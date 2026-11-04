/// <reference path="../pb_data/types.d.ts" />

/**
 * PARAMETRIZADOR — IMPORTADOR EM LOTES, TOTALIZADORES E ANALISADOR DO IBS
 * ========================================================================
 * Pedido do CEO (03/11/2026): "Criar o importador em lotes tanto de NF de
 * entradas como de saídas, e apresentar relatório com totalizadores por período
 * e analisadores futuros do IBS em cada ano."
 *
 * ── A DECISÃO QUE SUSTENTA TUDO: A DIREÇÃO VEM DO CFOP ──
 * Entrada ou saída não se adivinha. Poderia tentar pelo emitente ser o CNPJ da
 * empresa, mas isso quebra em operação entre estabelecimentos da mesma empresa
 * e exige que o sistema saiba qual é "a empresa" — que muda conforme quem opera.
 * O CFOP carrega a resposta no primeiro dígito, por definição legal:
 *     1.xxx, 2.xxx, 3.xxx  → ENTRADA
 *     5.xxx, 6.xxx, 7.xxx  → SAÍDA
 * É a classificação que o próprio contribuinte declarou no documento. O que o
 * sistema faz é LER, não decidir. E quando um documento tem itens de direções
 * diferentes (raro, quase sempre erro), ele não escolhe: marca o conflito.
 *
 * ── POR QUE ENTRADA E SAÍDA PRECISAM FICAR SEPARADAS ──
 * Na reforma, entrada gera CRÉDITO e saída gera DÉBITO. O que se apura é a
 * diferença. Um totalizador que soma os dois lados produz um número grande e
 * sem significado — pior que não ter número, porque parece resultado.
 *
 * ── A DEDUPLICAÇÃO É POR CHAVE, E É OBRIGATÓRIA ──
 * XML de NF-e se reimporta o tempo todo: o contador baixa o mês inteiro, depois
 * baixa de novo com um arquivo a mais. Sem dedup por chave de acesso, o valor
 * do período dobra e ninguém percebe. O lote devolve quantos entraram e quantos
 * foram reconhecidos como repetidos — e repetido NÃO é erro.
 *
 * ── REGRA DO JSVM ──
 * Cada callback roda em VM separado: nada de função fora do corpo. Tudo inline.
 */

/** POST /param-importar-lote — recebe vários XMLs de uma vez. */
routerAdd('POST', '/backend/v1/param-importar-lote', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var arquivos = body.arquivos
  if (!arquivos || !arquivos.length) {
    return e.json(400, { success: false, error: 'Envie uma lista de arquivos.' })
  }
  // Trava de tamanho: lote é para o mês, não para o ano inteiro numa chamada.
  if (arquivos.length > 300) {
    return e.json(400, {
      success: false,
      error: 'Máximo de 300 arquivos por lote. Divida o período em lotes menores.',
    })
  }

  var lote = String(
    body.lote ||
      'LOTE-' +
        new Date()
          .toISOString()
          .replace(/[-:T.Z]/g, '')
          .slice(0, 14),
  )

  /** Direção pelo primeiro dígito do CFOP — regra legal, não heurística. */
  function direcaoPorCFOP(cfop) {
    var c = String(cfop || '').replace(/\D/g, '')
    if (!c) return ''
    var d = c.charAt(0)
    if (d === '1' || d === '2' || d === '3') return 'entrada'
    if (d === '5' || d === '6' || d === '7') return 'saida'
    return ''
  }

  function numDe(v) {
    var n = Number(String(v === undefined || v === null ? '' : v).replace(',', '.'))
    return isFinite(n) ? n : 0
  }

  function todos(x, nome) {
    var re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>', 'g')
    var out = []
    var m
    while ((m = re.exec(String(x || ''))) !== null) out.push(m[1])
    return out
  }

  function lerTag(x, nome) {
    var re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>')
    var m = re.exec(String(x || ''))
    return m ? m[1] : ''
  }

  function limpar(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  var colDoc = $app.findCollectionByNameOrId('param_documentos')
  var colIt = $app.findCollectionByNameOrId('param_itens')

  var resultados = []
  var entraram = 0
  var repetidos = 0
  var invalidos = 0
  var somaEntrada = 0
  var somaSaida = 0

  for (var a = 0; a < arquivos.length; a++) {
    var arq = arquivos[a] || {}
    var xml = String(arq.xml || '').trim()
    var nome = String(arq.nome || 'documento.xml').slice(0, 280)

    if (!xml || xml.indexOf('<') < 0) {
      invalidos++
      resultados.push({ nome: nome, status: 'invalido', motivo: 'conteúdo vazio ou não é XML' })
      continue
    }

    try {
      var chave = ''
      var idAttr = /<infNFe[^>]*\sId="([^"]*)"/.exec(xml)
      if (idAttr) chave = String(idAttr[1]).replace(/^NFe/, '')

      /* ── dedup por chave de acesso ── */
      if (chave) {
        var jaTem = null
        try {
          jaTem = $app.findFirstRecordByFilter('param_documentos', 'chave = {:c}', { c: chave })
        } catch (_) {
          jaTem = null
        }
        if (jaTem) {
          repetidos++
          resultados.push({
            nome: nome,
            status: 'repetido',
            chave: chave,
            documento_id: jaTem.id,
            motivo: 'já importado — não foi duplicado',
          })
          continue
        }
      }

      var ide = lerTag(xml, 'ide')
      var emit = lerTag(xml, 'emit')
      var dest = lerTag(xml, 'dest')
      var blocoTotal = lerTag(xml, 'total')
      var icmsTot = lerTag(blocoTotal, 'ICMSTot')

      var dets = todos(xml, 'det')
      var itens = []
      var contEntrada = 0
      var contSaida = 0
      var cfopPrim = ''

      for (var i = 0; i < dets.length; i++) {
        var d = dets[i]
        var prod = lerTag(d, 'prod')
        var imposto = lerTag(d, 'imposto')
        var ibsCbs = lerTag(imposto, 'IBSCBS')
        var cfop = limpar(lerTag(prod, 'CFOP'))
        var dir = direcaoPorCFOP(cfop)
        if (!cfopPrim && cfop) cfopPrim = cfop
        if (dir === 'entrada') contEntrada++
        else if (dir === 'saida') contSaida++
        itens.push({
          numero_item: i + 1,
          descricao: limpar(lerTag(prod, 'xProd')),
          ncm: limpar(lerTag(prod, 'NCM')),
          cfop: cfop,
          direcao: dir,
          valor_total: numDe(lerTag(prod, 'vProd')),
          cclasstrib: limpar(lerTag(ibsCbs, 'cClassTrib')),
        })
      }

      /* ── direção do documento: a maioria manda, e o conflito é registrado ── */
      var direcao = ''
      var conflito = 0
      if (contEntrada > contSaida) {
        direcao = 'entrada'
        conflito = contSaida
      } else if (contSaida > contEntrada) {
        direcao = 'saida'
        conflito = contEntrada
      } else if (contEntrada > 0 && contSaida > 0) {
        direcao = 'mista'
        conflito = contEntrada + contSaida
      }
      /* Sem CFOP em nenhum item não se inventa direção: fica vazio e o
         relatório mostra como não classificada. */

      var valorTotal = numDe(lerTag(icmsTot, 'vNF'))

      var rec = new Record(colDoc)
      rec.set('chave', chave)
      rec.set('modelo', limpar(lerTag(ide, 'mod')) || 'desconhecido')
      rec.set('numero', limpar(lerTag(ide, 'nNF')))
      rec.set('serie', limpar(lerTag(ide, 'serie')))
      var dh = limpar(lerTag(ide, 'dhEmi'))
      if (dh) rec.set('data_emissao', dh.slice(0, 19).replace('T', ' '))
      rec.set('emitente_cnpj', limpar(lerTag(emit, 'CNPJ')))
      rec.set('emitente_nome', limpar(lerTag(emit, 'xNome')))
      rec.set('destinatario_cnpj', limpar(lerTag(dest, 'CNPJ')))
      rec.set('destinatario_nome', limpar(lerTag(dest, 'xNome')))
      rec.set('uf', limpar(lerTag(lerTag(emit, 'enderEmit'), 'UF')))
      rec.set('valor_total', valorTotal)
      rec.set('qtd_itens', itens.length)
      rec.set('status', 'importado')
      rec.set('nome_arquivo', nome)
      rec.set('direcao', direcao)
      rec.set('lote', lote)
      rec.set('cfop_predominante', cfopPrim)
      rec.set('itens_direcao_divergente', conflito)
      rec.set('importado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      $app.save(rec)

      for (var k = 0; k < itens.length; k++) {
        var i2 = itens[k]
        var ri = new Record(colIt)
        ri.set('documento', rec.id)
        ri.set('chave_doc', chave)
        ri.set('numero_item', i2.numero_item)
        ri.set('descricao', i2.descricao)
        ri.set('ncm', i2.ncm)
        ri.set('cfop', i2.cfop)
        ri.set('direcao', i2.direcao)
        ri.set('cclasstrib', i2.cclasstrib)
        ri.set('valor_total', i2.valor_total)
        $app.save(ri)
      }

      entraram++
      if (direcao === 'entrada') somaEntrada += valorTotal
      else if (direcao === 'saida') somaSaida += valorTotal

      resultados.push({
        nome: nome,
        status: 'importado',
        chave: chave,
        documento_id: rec.id,
        direcao: direcao,
        cfop_predominante: cfopPrim,
        itens: itens.length,
        valor: valorTotal,
        conflito: conflito,
      })
    } catch (err) {
      invalidos++
      resultados.push({ nome: nome, status: 'erro', motivo: String(err).slice(0, 200) })
    }
  }

  return e.json(200, {
    success: true,
    lote: lote,
    total_arquivos: arquivos.length,
    entraram: entraram,
    repetidos: repetidos,
    invalidos: invalidos,
    valor_entrada: Math.round(somaEntrada * 100) / 100,
    valor_saida: Math.round(somaSaida * 100) / 100,
    resultados: resultados,
  })
})

/**
 * GET /param-totalizadores — totalizadores por período, separados por direção.
 *
 * Responde o que o CEO pediu: "relatório com totalizadores por período".
 * Cada competência (AAAA-MM) sai com entrada, saída, resultado e contagens.
 * Documento sem direção aparece em `sem_direcao` — visível, não escondido.
 */
routerAdd('GET', '/backend/v1/param-totalizadores', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var de = String(q.de || '') // AAAA-MM
  var ate = String(q.ate || '')

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 5000, 0)
  } catch (_) {
    docs = []
  }

  var porMes = {}
  var meses = []
  var totEntrada = 0
  var totSaida = 0
  var totSemDirecao = 0
  var nEntrada = 0
  var nSaida = 0
  var nSemDirecao = 0
  var nConflito = 0

  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var iso = String(d.get('data_emissao') || '')
    var comp = iso.length >= 7 ? iso.slice(0, 7) : ''
    if (!comp) continue
    if (de && comp < de) continue
    if (ate && comp > ate) continue

    if (!porMes[comp]) {
      porMes[comp] = {
        competencia: comp,
        entrada: 0,
        saida: 0,
        sem_direcao: 0,
        n_entrada: 0,
        n_saida: 0,
        n_sem_direcao: 0,
        n_documentos: 0,
      }
      meses.push(comp)
    }
    var m = porMes[comp]
    var v = Number(d.get('valor_total')) || 0
    var dir = d.getString('direcao')
    m.n_documentos++

    if (dir === 'entrada') {
      m.entrada += v
      m.n_entrada++
      totEntrada += v
      nEntrada++
    } else if (dir === 'saida') {
      m.saida += v
      m.n_saida++
      totSaida += v
      nSaida++
    } else {
      m.sem_direcao += v
      m.n_sem_direcao++
      totSemDirecao += v
      nSemDirecao++
    }
    if (Number(d.get('itens_direcao_divergente')) > 0) nConflito++
  }

  meses.sort()
  var lista = []
  for (var j = 0; j < meses.length; j++) {
    var mm = porMes[meses[j]]
    lista.push({
      competencia: mm.competencia,
      documentos: mm.n_documentos,
      entrada: Math.round(mm.entrada * 100) / 100,
      saida: Math.round(mm.saida * 100) / 100,
      sem_direcao: Math.round(mm.sem_direcao * 100) / 100,
      n_entrada: mm.n_entrada,
      n_saida: mm.n_saida,
      n_sem_direcao: mm.n_sem_direcao,
      /* Resultado do mês: saídas menos entradas. É o "quanto sobrou" bruto —
         não é apuração de tributo, e o texto do relatório diz isso. */
      resultado: Math.round((mm.saida - mm.entrada) * 100) / 100,
    })
  }

  return e.json(200, {
    success: true,
    de: de || (lista.length ? lista[0].competencia : ''),
    ate: ate || (lista.length ? lista[lista.length - 1].competencia : ''),
    meses: lista,
    totais: {
      entrada: Math.round(totEntrada * 100) / 100,
      saida: Math.round(totSaida * 100) / 100,
      sem_direcao: Math.round(totSemDirecao * 100) / 100,
      resultado: Math.round((totSaida - totEntrada) * 100) / 100,
      n_entrada: nEntrada,
      n_saida: nSaida,
      n_sem_direcao: nSemDirecao,
      documentos_com_conflito: nConflito,
    },
  })
})

/**
 * GET /param-analise-ibs — o analisador dos anos futuros do IBS.
 *
 * ── O QUE ELE FAZ, E O QUE ELE NÃO FAZ ──
 * Pega o valor REAL de entrada e saída já importado e projeta quanto de IBS e
 * CBS incidiria em cada ano da transição, aplicando as alíquotas do ano sobre
 * uma base declarada. NÃO é apuração: é dimensionamento.
 *
 * ── POR QUE A PROJEÇÃO É SEPARADA POR DIREÇÃO ──
 * Saída gera débito, entrada gera crédito. Projetar só sobre a saída daria o
 * IBS "a pagar" inflado; projetar só sobre a entrada daria o crédito. O número
 * que interessa ao CEO é o SALDO — e ele só existe com os dois lados.
 *
 * ── A ALÍQUOTA NÃO É INVENTADA AQUI ──
 * A série de transição vive em `src/data/aliquotas.ts` (fonte única do
 * sistema). Este endpoint devolve os dados brutos e o FRONT aplica a série,
 * para que exista um só lugar onde a alíquota pode ser corrigida. Duplicar a
 * série aqui seria criar uma segunda verdade que envelhece calada.
 */
routerAdd('GET', '/backend/v1/param-analise-ibs', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var de = String(q.de || '')
  var ate = String(q.ate || '')

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 5000, 0)
  } catch (_) {
    docs = []
  }

  var entrada = 0
  var saida = 0
  var mesesUsados = {}
  var nDocs = 0

  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var iso = String(d.get('data_emissao') || '')
    var comp = iso.length >= 7 ? iso.slice(0, 7) : ''
    if (!comp) continue
    if (de && comp < de) continue
    if (ate && comp > ate) continue
    var v = Number(d.get('valor_total')) || 0
    var dir = d.getString('direcao')
    if (dir === 'entrada') entrada += v
    else if (dir === 'saida') saida += v
    mesesUsados[comp] = true
    nDocs++
  }

  var nMeses = 0
  for (var k in mesesUsados) nMeses++

  /* Média mensal: é a base honesta para projetar o ano. Se o importado cobre
     3 meses, projetar o total do período sem dividir inflaria o anual em 4x. */
  var mediaEntrada = nMeses > 0 ? entrada / nMeses : 0
  var mediaSaida = nMeses > 0 ? saida / nMeses : 0

  /* Por item: base para a classificação por NCM na projeção. */
  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 20000, 0)
  } catch (_) {
    itens = []
  }
  var porNCM = {}
  for (var n = 0; n < itens.length; n++) {
    var it = itens[n]
    var ncm = it.getString('ncm') || '(sem NCM)'
    var vIt = Number(it.get('valor_total')) || 0
    var dirIt = it.getString('direcao')
    if (!porNCM[ncm]) porNCM[ncm] = { ncm: ncm, entrada: 0, saida: 0, itens: 0 }
    if (dirIt === 'entrada') porNCM[ncm].entrada += vIt
    else if (dirIt === 'saida') porNCM[ncm].saida += vIt
    porNCM[ncm].itens++
  }
  var topNCM = []
  for (var c in porNCM) topNCM.push(porNCM[c])
  topNCM.sort(function (a, b) {
    return b.entrada + b.saida - (a.entrada + a.saida)
  })
  topNCM = topNCM.slice(0, 12)

  return e.json(200, {
    success: true,
    periodo: { de: de, ate: ate, meses: nMeses, documentos: nDocs },
    base: {
      entrada: Math.round(entrada * 100) / 100,
      saida: Math.round(saida * 100) / 100,
      media_mensal_entrada: Math.round(mediaEntrada * 100) / 100,
      media_mensal_saida: Math.round(mediaSaida * 100) / 100,
      /* Projeção anual = média mensal × 12. Declarada como projeção, não como
         realizado. */
      anual_entrada: Math.round(mediaEntrada * 12 * 100) / 100,
      anual_saida: Math.round(mediaSaida * 12 * 100) / 100,
    },
    top_ncm: topNCM,
    /* O front aplica `ibsDoAno()` e `CBS_POR_ANO` de aliquotas.ts sobre estas
       bases. Ver o comentário acima: a série de alíquotas tem UM dono. */
  })
})

/** GET /param-lotes — lista os lotes importados, com o que entrou em cada um. */
routerAdd('GET', '/backend/v1/param-lotes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {
    docs = []
  }

  var porLote = {}
  var chaves = []
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var l = d.getString('lote')
    if (!l) continue
    if (!porLote[l]) {
      porLote[l] = { lote: l, documentos: 0, entrada: 0, saida: 0, ultimo: '' }
      chaves.push(l)
    }
    var p = porLote[l]
    p.documentos++
    var v = Number(d.get('valor_total')) || 0
    var dir = d.getString('direcao')
    if (dir === 'entrada') p.entrada += v
    else if (dir === 'saida') p.saida += v
    var imp = String(d.get('importado_em') || '')
    if (imp > p.ultimo) p.ultimo = imp
  }

  var out = []
  for (var j = 0; j < chaves.length; j++) {
    var x = porLote[chaves[j]]
    out.push({
      lote: x.lote,
      documentos: x.documentos,
      entrada: Math.round(x.entrada * 100) / 100,
      saida: Math.round(x.saida * 100) / 100,
      ultimo: x.ultimo,
    })
  }
  out.sort(function (a, b) {
    return a.ultimo < b.ultimo ? 1 : -1
  })

  return e.json(200, { success: true, total: out.length, lotes: out })
})
