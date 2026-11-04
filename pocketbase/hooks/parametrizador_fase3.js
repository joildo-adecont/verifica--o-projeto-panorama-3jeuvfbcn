/// <reference path="../pb_data/types.d.ts" />

/**
 * PARAMETRIZADOR — FASE 3: comparativo, auditoria e relatório
 * =============================================================
 * Pedido do CEO (03/11/2026): "ambiente de análise, comparativos e auditorias,
 * com classificação fiscal e contábil, relatórios legíveis".
 *
 * ── O QUE MUDA EM RELAÇÃO À FASE 1 ──
 * A Fase 1 lê UM documento. A Fase 3 olha o CONJUNTO: o que se repete entre
 * documentos, qual NCM concentra valor, o que está sem classificação, e o que
 * mudou de uma competência para outra. Sem o conjunto, o contador tem uma pilha
 * de arquivos; com o conjunto, ele tem um diagnóstico.
 *
 * ── AS TRÊS PERGUNTAS QUE ESTE ARQUIVO RESPONDE ──
 * 1. AUDITORIA — o que está errado ou faltando neste documento? (por documento)
 * 2. COMPARATIVO — o que mudou entre as competências? (por período)
 * 3. CONCENTRAÇÃO — onde está o valor e onde está o risco fiscal? (por NCM)
 *
 * ── REGRA DO JSVM ──
 * Cada callback roda em VM separado: nada de função fora do corpo. Tudo inline.
 */

/** POST /param-auditar — audita um documento já gravado, item a item. */
routerAdd('POST', '/backend/v1/param-auditar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var docId = String(body.documento || '')
  if (!docId) return e.json(400, { success: false, error: 'Informe o documento.' })

  var doc
  try {
    doc = $app.findRecordById('param_documentos', docId)
  } catch (_) {
    return e.json(404, { success: false, error: 'Documento não encontrado.' })
  }

  var itens = []
  try {
    itens = $app.findRecordsByFilter(
      'param_itens',
      'documento = "' + docId + '"',
      'numero_item',
      500,
      0,
    )
  } catch (_) {
    itens = []
  }

  /**
   * AS REGRAS DE AUDITORIA.
   *
   * Cada uma responde a uma pergunta que o contador faria. A gravidade existe
   * porque nem todo achado tem o mesmo peso: NCM ausente impede a
   * classificação (ALTA); CFOP ausente atrapalha a escrituração (MÉDIA); e não
   * ter cClassTrib em 2026 é esperado (INFO) — marcá-lo como erro grave seria
   * alarme falso todo dia, e alarme falso ensina a ignorar o alarme.
   */
  var achados = []
  var valorTotal = 0
  var valorSemNCM = 0
  var valorSemCFOP = 0
  var itensSemNCM = 0
  var itensSemCFOP = 0
  var itensComCST = 0
  var somaItens = 0

  for (var i = 0; i < itens.length; i++) {
    var it = itens[i]
    var ncm = it.getString('ncm')
    var cfop = it.getString('cfop')
    var cst = it.getString('cst_icms')
    var cClass = it.getString('cclasstrib')
    var v = Number(it.get('valor_total')) || 0
    somaItens += v
    valorTotal += v

    if (!ncm) {
      itensSemNCM++
      valorSemNCM += v
      achados.push({
        gravidade: 'ALTA',
        item: it.get('numero_item'),
        regra: 'NCM ausente',
        detalhe:
          'Item "' +
          it.getString('descricao').slice(0, 80) +
          '" sem NCM: não há como classificar na reforma.',
        valor: v,
      })
    }
    if (!cfop) {
      itensSemCFOP++
      valorSemCFOP += v
      achados.push({
        gravidade: 'MEDIA',
        item: it.get('numero_item'),
        regra: 'CFOP ausente',
        detalhe: 'Sem CFOP a escrituração fica incompleta.',
        valor: v,
      })
    }
    if (cst) itensComCST++
    if (cClass) {
      achados.push({
        gravidade: 'INFO',
        item: it.get('numero_item'),
        regra: 'já classificado na reforma',
        detalhe: 'Item traz cClassTrib ' + cClass + ' — nada a parametrizar.',
        valor: v,
      })
    }
  }

  // soma dos itens contra o total do documento
  var totalDoc = Number(doc.get('valor_total')) || 0
  if (itens.length > 0 && totalDoc > 0) {
    var dif = Math.abs(somaItens - totalDoc)
    if (dif > 0.05) {
      achados.push({
        gravidade: 'ALTA',
        item: null,
        regra: 'soma dos itens ≠ total',
        detalhe:
          'Itens somam ' +
          somaItens.toFixed(2) +
          ' e o documento declara ' +
          totalDoc.toFixed(2) +
          ' (diferença ' +
          dif.toFixed(2) +
          ').',
        valor: dif,
      })
    }
  }

  // documento sem nenhum item
  if (itens.length === 0) {
    achados.push({
      gravidade: 'ALTA',
      item: null,
      regra: 'documento sem itens',
      detalhe: 'Nenhum item individualizado: o arquivo não foi quebrado ou está vazio.',
      valor: totalDoc,
    })
  }

  // ordena por gravidade
  var peso = { ALTA: 0, MEDIA: 1, BAIXA: 2, INFO: 3 }
  achados.sort(function (a, b) {
    var pa = peso[a.gravidade] === undefined ? 9 : peso[a.gravidade]
    var pb = peso[b.gravidade] === undefined ? 9 : peso[b.gravidade]
    return pa - pb
  })

  var graves = 0
  var medias = 0
  var infos = 0
  for (var k = 0; k < achados.length; k++) {
    if (achados[k].gravidade === 'ALTA') graves++
    else if (achados[k].gravidade === 'MEDIA') medias++
    else if (achados[k].gravidade === 'INFO') infos++
  }

  return e.json(200, {
    success: true,
    documento: {
      id: doc.id,
      chave: doc.getString('chave'),
      modelo: doc.getString('modelo'),
      numero: doc.getString('numero'),
      emitente: doc.getString('emitente_nome'),
      valor_total: totalDoc,
      qtd_itens: itens.length,
    },
    resumo: {
      itens: itens.length,
      valor_total: valorTotal,
      com_cst: itensComCST,
      sem_ncm: itensSemNCM,
      sem_cfop: itensSemCFOP,
      valor_sem_ncm: valorSemNCM,
      valor_sem_cfop: valorSemCFOP,
      achados_alta: graves,
      achados_media: medias,
      achados_info: infos,
      /* O percentual do valor que está sem classificação é o número que
         dimensiona o risco: 3 itens sem NCM em 300 é irrelevante; 3 itens sem
         NCM que somam 80% do valor é o documento inteiro sem classificação. */
      percentual_valor_sem_ncm:
        valorTotal > 0 ? Math.round((valorSemNCM / valorTotal) * 1000) / 10 : 0,
    },
    achados: achados,
  })
})

/**
 * POST /param-comparativo — compara duas competências (mês/ano).
 * body: { de: "2026-09", ate: "2026-10" }
 *
 * Responde o que interessa na virada: o valor subiu ou caiu? O número de
 * documentos? E o que NÃO mudou (mesmo fornecedor, mesmo NCM)?
 */
routerAdd('POST', '/backend/v1/param-comparativo', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var de = String(body.de || '')
  var ate = String(body.ate || '')

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 2000, 0)
  } catch (_) {
    docs = []
  }

  /** Agrupa por competência AAAA-MM a partir de data_emissao. */
  function competencia(d) {
    var iso = String(d.get('data_emissao') || '')
    return iso.length >= 7 ? iso.slice(0, 7) : ''
  }

  var porMes = {}
  var listaMeses = []
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var c = competencia(d)
    if (!c) continue
    if (!porMes[c]) {
      porMes[c] = {
        competencia: c,
        documentos: 0,
        valor: 0,
        itens: 0,
        emitentes: {},
        com_divergencia: 0,
      }
      listaMeses.push(c)
    }
    var m = porMes[c]
    m.documentos++
    m.valor += Number(d.get('valor_total')) || 0
    m.itens += Number(d.get('qtd_itens')) || 0
    var em = d.getString('emitente_cnpj') || d.getString('emitente_nome') || '?'
    m.emitentes[em] = (m.emitentes[em] || 0) + (Number(d.get('valor_total')) || 0)
    if (d.getString('status') === 'divergente') m.com_divergencia++
  }

  listaMeses.sort()
  var meses = []
  for (var j = 0; j < listaMeses.length; j++) {
    var mm = porMes[listaMeses[j]]
    var topEmitente = ''
    var topValor = 0
    for (var k in mm.emitentes) {
      if (mm.emitentes[k] > topValor) {
        topValor = mm.emitentes[k]
        topEmitente = k
      }
    }
    meses.push({
      competencia: mm.competencia,
      documentos: mm.documentos,
      valor: Math.round(mm.valor * 100) / 100,
      itens: mm.itens,
      com_divergencia: mm.com_divergencia,
      principal_emitente: topEmitente,
      valor_principal_emitente: Math.round(topValor * 100) / 100,
    })
  }

  // variação entre as duas competências pedidas (ou entre as duas últimas)
  var alvoDe = de || (meses.length >= 2 ? meses[meses.length - 2].competencia : '')
  var alvoAte = ate || (meses.length >= 1 ? meses[meses.length - 1].competencia : '')
  var mDe = null
  var mAte = null
  for (var x = 0; x < meses.length; x++) {
    if (meses[x].competencia === alvoDe) mDe = meses[x]
    if (meses[x].competencia === alvoAte) mAte = meses[x]
  }

  var variacao = null
  if (mDe && mAte && mDe.valor > 0) {
    var difV = mAte.valor - mDe.valor
    variacao = {
      de: mDe.competencia,
      ate: mAte.competencia,
      valor_de: mDe.valor,
      valor_ate: mAte.valor,
      diferenca: Math.round(difV * 100) / 100,
      percentual: Math.round((difV / mDe.valor) * 1000) / 10,
      documentos_de: mDe.documentos,
      documentos_ate: mAte.documentos,
      diferenca_documentos: mAte.documentos - mDe.documentos,
      leitura:
        difV === 0
          ? 'Valor idêntico entre as competências.'
          : (difV > 0 ? 'Aumento de ' : 'Redução de ') +
            Math.abs(Math.round(difV * 100) / 100).toFixed(2) +
            ' (' +
            Math.abs(Math.round((difV / mDe.valor) * 1000) / 10) +
            '%) de ' +
            mDe.competencia +
            ' para ' +
            mAte.competencia +
            '.',
    }
  } else if (!mDe || !mAte) {
    variacao = {
      de: alvoDe,
      ate: alvoAte,
      leitura:
        'Não há duas competências com movimento para comparar. ' +
        'Importe documentos de meses diferentes para ver a variação.',
    }
  }

  return e.json(200, { success: true, meses: meses, variacao: variacao, total_meses: meses.length })
})

/**
 * GET /param-concentracao — onde está o valor, por NCM e por emitente.
 * É a pergunta de risco: 80% do valor em 3 NCMs significa que classificar
 * esses 3 resolve quase tudo — e que errar neles contamina quase tudo.
 */
routerAdd('GET', '/backend/v1/param-concentracao', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 5000, 0)
  } catch (_) {
    itens = []
  }

  var porNCM = {}
  var porEmit = {}
  var total = 0
  var semNCM = 0
  var comClass = 0

  for (var i = 0; i < itens.length; i++) {
    var it = itens[i]
    var ncm = it.getString('ncm') || '(sem NCM)'
    var v = Number(it.get('valor_total')) || 0
    total += v
    if (ncm === '(sem NCM)') semNCM += v
    if (it.getString('cclasstrib')) comClass++

    if (!porNCM[ncm])
      porNCM[ncm] = {
        ncm: ncm,
        itens: 0,
        valor: 0,
        descricao: it.getString('descricao').slice(0, 70),
      }
    porNCM[ncm].itens++
    porNCM[ncm].valor += v

    var em = it.getString('chave_doc') || '?'
    if (!porEmit[em]) porEmit[em] = { chave: em, itens: 0, valor: 0 }
    porEmit[em].itens++
    porEmit[em].valor += v
  }

  function top(obj, n) {
    var arr = []
    for (var k in obj) arr.push(obj[k])
    arr.sort(function (a, b) {
      return b.valor - a.valor
    })
    var out = []
    var acum = 0
    for (var i2 = 0; i2 < arr.length && i2 < n; i2++) {
      acum += arr[i2].valor
      out.push({
        chave: arr[i2].ncm || arr[i2].chave,
        itens: arr[i2].itens,
        valor: Math.round(arr[i2].valor * 100) / 100,
        descricao: arr[i2].descricao || '',
        percentual: total > 0 ? Math.round((arr[i2].valor / total) * 1000) / 10 : 0,
        acumulado: total > 0 ? Math.round((acum / total) * 1000) / 10 : 0,
      })
    }
    return out
  }

  return e.json(200, {
    success: true,
    total_itens: itens.length,
    valor_total: Math.round(total * 100) / 100,
    itens_sem_ncm: itens.length > 0 ? Math.round((semNCM / total) * 1000) / 10 : 0,
    itens_classificados: comClass,
    top_ncm: top(porNCM, 12),
    top_documentos: top(porEmit, 10),
  })
})

/**
 * POST /param-relatorio — monta o relatório legível de um documento.
 * Devolve TEXTO pronto (não HTML): o front imprime, e o mesmo texto pode ir
 * por e-mail sem virar sopa de tags.
 */
routerAdd('POST', '/backend/v1/param-relatorio', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var docId = String(body.documento || '')

  var doc
  try {
    doc = $app.findRecordById('param_documentos', docId)
  } catch (_) {
    return e.json(404, { success: false, error: 'Documento não encontrado.' })
  }

  var itens = []
  try {
    itens = $app.findRecordsByFilter(
      'param_itens',
      'documento = "' + docId + '"',
      'numero_item',
      500,
      0,
    )
  } catch (_) {
    itens = []
  }

  function brl(v) {
    var n = Number(v) || 0
    var s = n.toFixed(2)
    var partes = s.split('.')
    var inteiro = partes[0]
    var out = ''
    var cont = 0
    for (var i = inteiro.length - 1; i >= 0; i--) {
      out = inteiro.charAt(i) + out
      cont++
      if (cont % 3 === 0 && i > 0) out = '.' + out
    }
    return 'R$ ' + out + ',' + partes[1]
  }

  var L = []
  L.push('RELATÓRIO DE DOCUMENTO FISCAL — CONFERÊNCIA E CLASSIFICAÇÃO')
  L.push('================================================================')
  L.push('')
  L.push('IDENTIFICAÇÃO')
  L.push('  Modelo............: ' + doc.getString('modelo'))
  L.push('  Número............: ' + doc.getString('numero'))
  L.push('  Série.............: ' + doc.getString('serie'))
  L.push('  Chave de acesso...: ' + doc.getString('chave'))
  L.push('  Emissão...........: ' + String(doc.get('data_emissao') || '').slice(0, 10))
  L.push('')
  L.push('PARTES')
  L.push(
    '  Emitente..........: ' +
      doc.getString('emitente_nome') +
      ' (' +
      doc.getString('emitente_cnpj') +
      ')',
  )
  L.push(
    '  Destinatário......: ' +
      doc.getString('destinatario_nome') +
      ' (' +
      doc.getString('destinatario_cnpj') +
      ')',
  )
  L.push('')
  L.push('VALORES')
  L.push('  Total do documento: ' + brl(doc.get('valor_total')))
  L.push('  Tributos destacados: ' + brl(doc.get('valor_tributos')))
  L.push('  Quantidade de itens: ' + (doc.get('qtd_itens') || itens.length))
  L.push('')
  L.push('ITENS — QUEBRA INDIVIDUALIZADA')
  L.push('----------------------------------------------------------------')
  for (var i = 0; i < itens.length; i++) {
    var it = itens[i]
    L.push('')
    L.push('  Item ' + it.get('numero_item') + ' — ' + it.getString('descricao'))
    L.push('    NCM...........: ' + (it.getString('ncm') || 'AUSENTE'))
    L.push('    CFOP..........: ' + (it.getString('cfop') || 'AUSENTE'))
    L.push('    CST ICMS......: ' + (it.getString('cst_icms') || '—'))
    L.push(
      '    cClassTrib....: ' +
        (it.getString('cclasstrib') || 'não traz (padrão anterior à reforma)'),
    )
    L.push('    Quantidade....: ' + (it.get('quantidade') || 0) + ' ' + it.getString('unidade'))
    L.push('    Valor total...: ' + brl(it.get('valor_total')))
    if (Number(it.get('valor_ibs')) > 0) L.push('    IBS...........: ' + brl(it.get('valor_ibs')))
    if (Number(it.get('valor_cbs')) > 0) L.push('    CBS...........: ' + brl(it.get('valor_cbs')))
  }
  L.push('')
  L.push('CONFERÊNCIA')
  L.push('----------------------------------------------------------------')
  L.push('  ' + (doc.getString('resumo_conferencia') || 'sem resumo'))
  L.push('  Situação: ' + (doc.getString('status') || 'não conferido'))
  L.push('')
  L.push('OBSERVAÇÕES')
  L.push('  Valores extraídos do próprio documento pelo leitor do Parametrizador.')
  L.push('  Onde o campo não existe no XML, consta AUSENTE — não foi preenchido por estimativa.')
  L.push('  A classificação fiscal e a conta contábil dependem do plano de contas do escritório.')
  L.push('')
  L.push('Gerado pelo Parametrizador de Documentos Fiscais da Reforma — ADECONT')
  L.push('Documento processado em ' + String(doc.get('importado_em') || '').slice(0, 19))

  return e.json(200, { success: true, texto: L.join('\n'), documento: doc.id })
})

/** GET /param-itens-doc?documento=ID — os itens individualizados de um documento. */
routerAdd('GET', '/backend/v1/param-itens-doc', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }
  var q = e.requestInfo().query || {}
  var docId = String(q.documento || '')
  if (!docId) return e.json(400, { success: false, error: 'Informe o documento.' })
  var itens = []
  try {
    itens = $app.findRecordsByFilter(
      'param_itens',
      'documento = "' + docId + '"',
      'numero_item',
      500,
      0,
    )
  } catch (_) {
    itens = []
  }
  var out = []
  for (var i = 0; i < itens.length; i++) {
    var it = itens[i]
    out.push({
      id: it.id,
      numero_item: it.get('numero_item'),
      descricao: it.getString('descricao'),
      ncm: it.getString('ncm'),
      cfop: it.getString('cfop'),
      cst_icms: it.getString('cst_icms'),
      cst_ibs_cbs: it.getString('cst_ibs_cbs'),
      cclasstrib: it.getString('cclasstrib'),
      valor_total: it.get('valor_total'),
      valor_ibs: it.get('valor_ibs'),
      valor_cbs: it.get('valor_cbs'),
    })
  }
  return e.json(200, { success: true, total: out.length, itens: out })
})
