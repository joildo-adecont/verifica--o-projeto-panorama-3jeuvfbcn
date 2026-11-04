/// <reference path="../pb_data/types.d.ts" />

/**
 * PASTAS POR CLIENTE — individualizador de documentação
 * ======================================================
 * Pedido do CEO (03/11/2026): "criar um individualizador de documentação em
 * pastas separadas por cliente por parametrização para não misturar documentos."
 *
 * ── O QUE "NÃO MISTURAR" EXIGE DE VERDADE ──
 * Separar na tela é fácil e inútil: se a nota do cliente A pode ser gravada na
 * pasta do cliente B, os relatórios continuam errados e ninguém percebe. A
 * trava tem de estar na GRAVAÇÃO.
 *
 * Por isso toda importação passa pela mesma regra: se o destino tem CNPJ e o
 * documento também, os dois têm de bater. Divergência NÃO é descartada em
 * silêncio — o documento entra na pasta certa do seu próprio CNPJ, ou fica sem
 * pasta, e o resultado diz o que aconteceu. Descartar em silêncio faria o
 * contador achar que importou e depois não achar nada.
 *
 * ── AS TRÊS ROTAS ──
 *   GET/POST/PATCH/DELETE  /param-pastas   → CRUD das pastas
 *   POST /param-mover-lote                 → move documentos entre pastas
 *   GET  /param-pasta-resumo               → o que tem em cada pasta
 *
 * ── REGRA DO JSVM ──
 * Cada callback roda em VM separado: nada de função fora do corpo. Inline.
 */

/** Normaliza nome para busca: sem acento, minúsculo, espaço único. */
routerAdd('GET', '/backend/v1/param-pastas', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 1000, 0)
  } catch (_) {
    pastas = []
  }

  /* Contagem por pasta em UMA passada pelos documentos — não uma consulta por
     pasta, que com 300 pastas viraria 300 consultas a cada abertura da tela. */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 10000, 0)
  } catch (_) {
    docs = []
  }
  var contagem = {}
  var semPasta = 0
  for (var i = 0; i < docs.length; i++) {
    var p = docs[i].getString('pasta')
    if (!p) {
      semPasta++
      continue
    }
    if (!contagem[p]) contagem[p] = { documentos: 0, entrada: 0, saida: 0 }
    contagem[p].documentos++
    var v = Number(docs[i].get('valor_total')) || 0
    var dir = docs[i].getString('direcao')
    if (dir === 'entrada') contagem[p].entrada += v
    else if (dir === 'saida') contagem[p].saida += v
  }

  var out = []
  for (var j = 0; j < pastas.length; j++) {
    var pa = pastas[j]
    var c = contagem[pa.id] || { documentos: 0, entrada: 0, saida: 0 }
    out.push({
      id: pa.id,
      nome: pa.getString('nome'),
      cnpj: pa.getString('cnpj'),
      cliente_id: pa.getString('cliente_id'),
      cor: pa.getString('cor'),
      observacao: pa.getString('observacao'),
      ativo: pa.get('ativo') !== false,
      documentos: c.documentos,
      entrada: Math.round(c.entrada * 100) / 100,
      saida: Math.round(c.saida * 100) / 100,
    })
  }

  return e.json(200, {
    success: true,
    total: out.length,
    pastas: out,
    documentos_sem_pasta: semPasta,
    total_documentos: docs.length,
  })
})

/** POST /param-pastas — cria pasta. */
routerAdd('POST', '/backend/v1/param-pastas', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var nome = String(body.nome || '').trim()
  if (!nome) return e.json(400, { success: false, error: 'Informe o nome da pasta.' })

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  var nb = norm(nome)

  /* Duas pastas com o mesmo nome seriam dois lugares para a mesma nota, e a
     pessoa escolheria o errado metade das vezes. Bloqueia. */
  try {
    var existentes = $app.findRecordsByFilter('param_pastas', '', 'nome', 1000, 0)
    for (var i = 0; i < existentes.length; i++) {
      if (norm(existentes[i].getString('nome')) === nb) {
        return e.json(409, {
          success: false,
          error: 'Já existe uma pasta com esse nome.',
          pasta_id: existentes[i].id,
        })
      }
    }
  } catch (_) {}

  try {
    var col = $app.findCollectionByNameOrId('param_pastas')
    var rec = new Record(col)
    rec.set('nome', nome)
    rec.set('cnpj', String(body.cnpj || '').replace(/\D/g, ''))
    rec.set('cliente_id', String(body.cliente_id || ''))
    rec.set('cor', String(body.cor || 'slate'))
    rec.set('observacao', String(body.observacao || ''))
    rec.set('ativo', true)
    rec.set('nome_busca', nb)
    rec.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rec)
    return e.json(200, {
      success: true,
      pasta: { id: rec.id, nome: rec.getString('nome'), cnpj: rec.getString('cnpj') },
    })
  } catch (err) {
    return e.json(500, { success: false, error: String(err).slice(0, 200) })
  }
})

/** PATCH /param-pastas — edita nome, CNPJ ou observação. */
routerAdd('PATCH', '/backend/v1/param-pastas', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }
  var body = e.requestInfo().body || {}
  var id = String(body.id || '')
  if (!id) return e.json(400, { success: false, error: 'Informe a pasta.' })

  try {
    var rec = $app.findRecordById('param_pastas', id)
    if (body.nome !== undefined) {
      var nome = String(body.nome).trim()
      if (!nome) return e.json(400, { success: false, error: 'O nome não pode ficar vazio.' })
      rec.set('nome', nome)
      rec.set(
        'nome_busca',
        String(nome)
          .toLowerCase()
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
    }
    if (body.cnpj !== undefined) rec.set('cnpj', String(body.cnpj).replace(/\D/g, ''))
    if (body.cor !== undefined) rec.set('cor', String(body.cor))
    if (body.observacao !== undefined) rec.set('observacao', String(body.observacao))
    if (body.ativo !== undefined) rec.set('ativo', body.ativo !== false)
    $app.save(rec)

    /* Renomear a pasta tem de renomear o rótulo nos documentos — senão a lista
       de documentos mostra o nome antigo para sempre. */
    if (body.nome !== undefined) {
      try {
        var docs = $app.findRecordsByFilter('param_documentos', 'pasta = "' + id + '"', '', 5000, 0)
        for (var i = 0; i < docs.length; i++) {
          docs[i].set('pasta_nome', rec.getString('nome'))
          $app.save(docs[i])
        }
      } catch (_) {}
    }
    return e.json(200, { success: true })
  } catch (err) {
    return e.json(404, { success: false, error: 'Pasta não encontrada.' })
  }
})

/**
 * DELETE /param-pastas?id=X
 * Apagar pasta NÃO apaga documento: os documentos voltam a "sem pasta".
 * Apagar nota fiscal por causa de organização seria destruir o dado do cliente.
 */
routerAdd('DELETE', '/backend/v1/param-pastas', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }
  var q = e.requestInfo().query || {}
  var id = String(q.id || '')
  if (!id) return e.json(400, { success: false, error: 'Informe a pasta.' })

  var soltos = 0
  try {
    var docs = $app.findRecordsByFilter('param_documentos', 'pasta = "' + id + '"', '', 5000, 0)
    for (var i = 0; i < docs.length; i++) {
      docs[i].set('pasta', '')
      docs[i].set('pasta_nome', '')
      $app.save(docs[i])
      soltos++
    }
    var itens = $app.findRecordsByFilter('param_itens', 'pasta = "' + id + '"', '', 20000, 0)
    for (var j = 0; j < itens.length; j++) {
      itens[j].set('pasta', '')
      $app.save(itens[j])
    }
    $app.delete($app.findRecordById('param_pastas', id))
  } catch (err) {
    return e.json(404, { success: false, error: 'Pasta não encontrada.' })
  }

  return e.json(200, {
    success: true,
    documentos_liberados: soltos,
    aviso:
      'A pasta foi apagada. Os ' + soltos + ' documento(s) continuam no sistema, agora sem pasta.',
  })
})

/**
 * POST /param-mover-lote — move documentos para uma pasta.
 * body: { documento_ids: [...], pasta: 'ID' }
 *
 * É a ferramenta de conserto: o que entrou antes das pastas existirem, ou o que
 * foi importado sem destino, se organiza aqui.
 */
routerAdd('POST', '/backend/v1/param-mover-lote', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var ids = body.documento_ids || []
  var pastaId = String(body.pasta || '')
  if (!ids.length) return e.json(400, { success: false, error: 'Nenhum documento selecionado.' })

  var pastaNome = ''
  var pastaCnpj = ''
  if (pastaId) {
    try {
      var p = $app.findRecordById('param_pastas', pastaId)
      pastaNome = p.getString('nome')
      pastaCnpj = String(p.getString('cnpj') || '').replace(/\D/g, '')
    } catch (_) {
      return e.json(404, { success: false, error: 'Pasta não encontrada.' })
    }
  }

  var movidos = 0
  var recusados = []
  for (var i = 0; i < ids.length; i++) {
    try {
      var d = $app.findRecordById('param_documentos', ids[i])
      /* A mesma trava da importação: não deixa nota de um CNPJ entrar na pasta
         de outro. Aqui, sim, recusa — porque é ação manual e a pessoa pode
         corrigir na hora. */
      var cnpjDoc = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
      var cnpjDest = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
      if (pastaCnpj && cnpjDoc && cnpjDest && cnpjDoc !== pastaCnpj && cnpjDest !== pastaCnpj) {
        recusados.push({
          id: ids[i],
          nome: d.getString('nome_arquivo'),
          motivo:
            'nenhuma das partes (emitente ' +
            cnpjDoc +
            ' / destinatário ' +
            cnpjDest +
            ') corresponde ao CNPJ da pasta (' +
            pastaCnpj +
            ')',
        })
        continue
      }
      d.set('pasta', pastaId)
      d.set('pasta_nome', pastaNome)
      $app.save(d)

      var its = $app.findRecordsByFilter('param_itens', 'documento = "' + ids[i] + '"', '', 2000, 0)
      for (var k = 0; k < its.length; k++) {
        its[k].set('pasta', pastaId)
        $app.save(its[k])
      }
      movidos++
    } catch (_) {
      recusados.push({ id: ids[i], motivo: 'documento não encontrado' })
    }
  }

  return e.json(200, {
    success: true,
    movidos: movidos,
    recusados: recusados.length,
    detalhe_recusados: recusados,
    pasta: pastaNome,
  })
})

/** GET /param-pasta-resumo — o que existe em cada pasta, para o relatório. */
routerAdd('GET', '/backend/v1/param-pasta-resumo', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var pastaId = String(q.pasta || '')

  var docs = []
  try {
    docs = $app.findRecordsByFilter(
      'param_documentos',
      pastaId ? 'pasta = "' + pastaId + '"' : 'pasta = "" || pasta = null',
      '-data_emissao',
      5000,
      0,
    )
  } catch (_) {
    docs = []
  }

  var porMes = {}
  var meses = []
  var totE = 0
  var totS = 0
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var iso = String(d.get('data_emissao') || '')
    var comp = iso.length >= 7 ? iso.slice(0, 7) : ''
    if (!comp) continue
    if (!porMes[comp]) {
      porMes[comp] = { competencia: comp, documentos: 0, entrada: 0, saida: 0 }
      meses.push(comp)
    }
    var m = porMes[comp]
    m.documentos++
    var v = Number(d.get('valor_total')) || 0
    var dir = d.getString('direcao')
    if (dir === 'entrada') {
      m.entrada += v
      totE += v
    } else if (dir === 'saida') {
      m.saida += v
      totS += v
    }
  }
  meses.sort()
  var lista = []
  for (var j = 0; j < meses.length; j++) {
    var x = porMes[meses[j]]
    lista.push({
      competencia: x.competencia,
      documentos: x.documentos,
      entrada: Math.round(x.entrada * 100) / 100,
      saida: Math.round(x.saida * 100) / 100,
      resultado: Math.round((x.saida - x.entrada) * 100) / 100,
    })
  }

  return e.json(200, {
    success: true,
    pasta: pastaId,
    documentos: docs.length,
    entrada: Math.round(totE * 100) / 100,
    saida: Math.round(totS * 100) / 100,
    meses: lista,
  })
})
