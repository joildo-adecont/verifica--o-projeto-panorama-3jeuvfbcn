/// <reference path="../pb_data/types.d.ts" />

/**
 * PARAMETRIZADOR — ROTAS CONSOLIDADAS (Fases 3, 4 e 6)
 *
 * ── POR QUE NUM ARQUIVO SO ──
 * Os tres hooks separados deixaram de registrar suas rotas: /param-auditar,
 * /param-importar-lote e /param-pastas respondiam 404 enquanto /param-documentos
 * respondia 401 no MESMO servidor. Sintaxe conferida, chaves balanceadas, nada no
 * codigo explicava.
 *
 * Cada rota mantem o seu proprio callback e a sua propria validacao de token:
 * consolidar agrupou o ARQUIVO, nao as permissoes.
 */

// ==============================================================
// FASE 3 — auditoria, comparativo, concentração, relatório
// ==============================================================

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

// ==============================================================
// FASE 4 — importador em lote, totalizadores, análise do IBS
// ==============================================================

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
  // Trava de tamanho: lote ampliado para até 1.000 arquivos (alinhado ao módulo Documentos Fiscais).
  if (arquivos.length > 1000) {
    return e.json(400, {
      success: false,
      error: 'Máximo de 1.000 arquivos por lote. Divida o período em lotes menores.',
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

  /**
   * PASTA DE DESTINO — individualizador por cliente (03/11/2026).
   *
   * Se vier `pasta`, o documento só entra se o CNPJ da pasta aparecer em uma das
   * partes (emitente ou destinatário). Não basta "abrir a pasta antes": a trava
   * tem de estar na gravação, senão uma nota do cliente A cai na pasta do B e os
   * relatórios ficam errados sem ninguém perceber.
   *
   * Quando não bate, o documento NÃO é descartado: entra sem pasta e o resultado
   * do lote diz o motivo, com os dois CNPJs. Descartar em silêncio faria o
   * contador achar que importou e não achar a nota em lugar nenhum.
   */
  var pastaId = String(body.pasta || '')
  var pastaNome = ''
  var pastaCnpj = ''
  if (pastaId) {
    try {
      var pRec = $app.findRecordById('param_pastas', pastaId)
      pastaNome = pRec.getString('nome')
      pastaCnpj = String(pRec.getString('cnpj') || '').replace(/\D/g, '')
    } catch (_) {
      return e.json(404, { success: false, error: 'Pasta de destino não encontrada.' })
    }
  }

  /**
   * DIREÇÃO RELATIVA AO CLIENTE — a correção do defeito de 03/11/2026.
   *
   * ── O QUE ESTAVA ERRADO ──
   * O CFOP é sempre a ótica de QUEM EMITE. O 6.102 é "venda de mercadoria
   * adquirida de terceiros, interestadual": é SAÍDA para quem emitiu. Para o
   * DESTINATÁRIO, a mesma operação é ENTRADA — ele comprou.
   *
   * A regra anterior olhava só o primeiro dígito do CFOP e chamava isso de "a
   * direção do documento". Isso classificava a operação pela ótica do emitente,
   * não do cliente cuja pasta estamos organizando — e arquivava compra do
   * cliente em Vendas.
   *
   * ── A ORDEM DE AGORA ──
   * 1. Se há cliente identificado (CNPJ da pasta):
   *      cliente é o emitente     -> SAÍDA   (vendeu)
   *      cliente é o destinatário -> ENTRADA (comprou)
   *      cliente é os dois        -> cai no CFOP (transferência entre filiais)
   * 2. Sem cliente identificado (pasta sem CNPJ): cai no CFOP, que é a ótica do
   *    emitente — e o resultado é o melhor palpite possível, não uma certeza.
   */
  function direcaoDoCliente(cnpjCliente, cnpjEmitente, cnpjDestinatario, cfop) {
    var cli = String(cnpjCliente || '').replace(/\D/g, '')
    var emit = String(cnpjEmitente || '').replace(/\D/g, '')
    var dest = String(cnpjDestinatario || '').replace(/\D/g, '')

    if (cli) {
      var eEmit = emit && emit === cli
      var eDest = dest && dest === cli
      if (eEmit && !eDest) return 'saida'
      if (eDest && !eEmit) return 'entrada'
      /* cliente é as duas partes: transferência entre estabelecimentos.
         Aí o CFOP é quem diz o sentido. */
    }

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
  var foraDaPasta = 0

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
        var dir = direcaoDoCliente(
          pastaCnpj,
          limpar(lerTag(emit, 'CNPJ')),
          limpar(lerTag(dest, 'CNPJ')),
          cfop,
        )
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

      /* ── direção: primeiro pela posição do CLIENTE na nota, depois pelo CFOP ── */
      var cnpjEmit = limpar(lerTag(emit, 'CNPJ'))
      var cnpjDest = limpar(lerTag(dest, 'CNPJ'))
      var direcao = direcaoDoCliente(pastaCnpj, cnpjEmit, cnpjDest, cfopPrim)

      /* Sem CNPJ de cliente, cai no CFOP pela maioria dos itens — que é a ótica
         do emitente, não do cliente. */
      if (!direcao) {
        if (contEntrada > contSaida) direcao = 'entrada'
        else if (contSaida > contEntrada) direcao = 'saida'
        else if (contEntrada > 0 && contSaida > 0) direcao = 'mista'
      }

      var conflito = 0
      if (direcao === 'entrada') conflito = contSaida
      else if (direcao === 'saida') conflito = contEntrada
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

      /* ── a trava do CNPJ ── */
      var pastaAplicada = pastaId
      var motivoSemPasta = ''
      if (pastaId && pastaCnpj) {
        var cDoc = String(rec.get('emitente_cnpj') || '').replace(/\D/g, '')
        var cDest = String(rec.get('destinatario_cnpj') || '').replace(/\D/g, '')
        var bate = (cDoc && cDoc === pastaCnpj) || (cDest && cDest === pastaCnpj)
        if (!bate) {
          pastaAplicada = ''
          motivoSemPasta =
            'não entrou na pasta "' +
            pastaNome +
            '": nenhuma das partes (' +
            (cDoc || 'emitente sem CNPJ') +
            ' / ' +
            (cDest || 'destinatário sem CNPJ') +
            ') corresponde ao CNPJ da pasta (' +
            pastaCnpj +
            ')'
        }
      }
      rec.set('pasta', pastaAplicada)
      rec.set('pasta_nome', pastaAplicada ? pastaNome : '')
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
        ri.set('pasta', pastaAplicada)
        $app.save(ri)
      }

      entraram++
      if (direcao === 'entrada') somaEntrada += valorTotal
      else if (direcao === 'saida') somaSaida += valorTotal
      if (pastaId && !pastaAplicada) foraDaPasta++

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
        pasta: pastaAplicada ? pastaNome : '',
        motivo_sem_pasta: motivoSemPasta,
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
    pasta: pastaNome,
    fora_da_pasta: foraDaPasta,
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

// ==============================================================
// FASE 6 — pastas por cliente com trava de CNPJ
// ==============================================================

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
