/// <reference path="../pb_data/types.d.ts" />

/**
 * PARAMETRIZADOR — BASE PARA O CÁLCULO EFETIVO POR NCM
 * =====================================================
 * Pedido do CEO (03/11/2026): "trocar a alíquota plena pela efetiva por NCM e o
 * analisador passa a mostrar o valor próximo do real; faça o teste pelo
 * documento importado individual."
 *
 * ── O QUE ESTA ROTA ENTREGA, E O QUE ELA NÃO FAZ ──
 * Ela devolve os itens com NCM, valor e direção — o dado bruto. O FATOR de cada
 * NCM NÃO é calculado aqui: ele vem do motor (`motorClassificacao.ts`), que é a
 * única fonte da tabela e roda no front. Duplicar a tabela neste hook criaria
 * uma segunda verdade que envelhece calada, e é exatamente o defeito que o
 * sistema já pagou caro para corrigir em altri lugares.
 *
 * Endpoints:
 *   GET  /param-itens-todos?de=&ate=   → itens com ncm, direcao, valor, documento
 *   GET  /param-documento-itens?id=    → um documento e seus itens (teste individual)
 */

routerAdd('GET', '/backend/v1/param-itens-todos', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var de = String(q.de || '')
  var ate = String(q.ate || '')

  /* Filtro por competência vem do DOCUMENTO (data de emissão), não do item —
     porque o item não carrega data própria. */
  var docsOk = {}
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 5000, 0)
  } catch (_) {
    docs = []
  }
  for (var i = 0; i < docs.length; i++) {
    var iso = String(docs[i].get('data_emissao') || '')
    var comp = iso.length >= 7 ? iso.slice(0, 7) : ''
    if (!comp) continue
    if (de && comp < de) continue
    if (ate && comp > ate) continue
    docsOk[docs[i].id] = {
      id: docs[i].id,
      competencia: comp,
      emitente: docs[i].getString('emitente_nome'),
      direcao_doc: docs[i].getString('direcao'),
      valor_doc: Number(docs[i].get('valor_total')) || 0,
    }
  }

  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 20000, 0)
  } catch (_) {
    itens = []
  }

  var out = []
  for (var j = 0; j < itens.length; j++) {
    var it = itens[j]
    var docId = it.getString('documento')
    var ref = docsOk[docId]
    if (!ref) continue
    out.push({
      documento: docId,
      competencia: ref.competencia,
      emitente: ref.emitente,
      numero_item: it.get('numero_item'),
      descricao: it.getString('descricao'),
      ncm: it.getString('ncm'),
      cfop: it.getString('cfop'),
      direcao: it.getString('direcao') || ref.direcao_doc,
      valor: Number(it.get('valor_total')) || 0,
      cclasstrib: it.getString('cclasstrib'),
    })
    if (out.length >= 20000) break
  }

  return e.json(200, { success: true, total: out.length, itens: out })
})

/**
 * GET /param-documento-itens?id=ID
 * Um documento e seus itens, com o total conferido. É a base do "teste pelo
 * documento importado individual" que o CEO pediu.
 */
routerAdd('GET', '/backend/v1/param-documento-itens', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var id = String(q.id || '')
  if (!id) return e.json(400, { success: false, error: 'Informe o documento.' })

  var doc
  try {
    doc = $app.findRecordById('param_documentos', id)
  } catch (_) {
    return e.json(404, { success: false, error: 'Documento não encontrado.' })
  }

  var itens = []
  try {
    itens = $app.findRecordsByFilter(
      'param_itens',
      'documento = "' + id + '"',
      'numero_item',
      1000,
      0,
    )
  } catch (_) {
    itens = []
  }

  var lista = []
  var soma = 0
  for (var i = 0; i < itens.length; i++) {
    var it = itens[i]
    var v = Number(it.get('valor_total')) || 0
    soma += v
    lista.push({
      numero_item: it.get('numero_item'),
      descricao: it.getString('descricao'),
      ncm: it.getString('ncm'),
      cfop: it.getString('cfop'),
      direcao: it.getString('direcao') || doc.getString('direcao'),
      valor: v,
      cclasstrib: it.getString('cclasstrib'),
    })
  }

  return e.json(200, {
    success: true,
    documento: {
      id: doc.id,
      chave: doc.getString('chave'),
      modelo: doc.getString('modelo'),
      numero: doc.getString('numero'),
      serie: doc.getString('serie'),
      emitente: doc.getString('emitente_nome'),
      emitente_cnpj: doc.getString('emitente_cnpj'),
      uf: doc.getString('uf'),
      data_emissao: doc.get('data_emissao'),
      direcao: doc.getString('direcao'),
      cfop_predominante: doc.getString('cfop_predominante'),
      valor_total: Number(doc.get('valor_total')) || 0,
      qtd_itens: itens.length,
    },
    itens: lista,
    soma_itens: Math.round(soma * 100) / 100,
    confere_total: Math.abs(soma - (Number(doc.get('valor_total')) || 0)) < 0.05,
  })
})
