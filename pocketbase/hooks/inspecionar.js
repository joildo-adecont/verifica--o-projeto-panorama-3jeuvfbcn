/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA DE INSPEÇÃO — REMOVER APÓS USO. Lista o que há no banco. */
routerAdd('POST', '/backend/v1/param-inspecionar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {}
  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 20000, 0)
  } catch (_) {}

  var lista = []
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    lista.push({
      id: d.id,
      nome_arquivo: d.getString('nome_arquivo'),
      modelo: d.getString('modelo'),
      numero: d.getString('numero'),
      emitente: d.getString('emitente_nome'),
      cnpj: d.getString('emitente_cnpj'),
      valor: d.get('valor_total'),
      direcao: d.getString('direcao'),
      lote: d.getString('lote'),
      data: String(d.get('data_emissao') || ''),
      importado_em: String(d.get('importado_em') || ''),
    })
  }
  var lisIt = []
  for (var j = 0; j < itens.length; j++) {
    lisIt.push({
      doc: itens[j].getString('documento'),
      ncm: itens[j].getString('ncm'),
      cfop: itens[j].getString('cfop'),
      direcao: itens[j].getString('direcao'),
      valor: itens[j].get('valor_total'),
    })
  }
  return e.json(200, {
    success: true,
    total_documentos: lista.length,
    total_itens: lisIt.length,
    documentos: lista,
    itens: lisIt.slice(0, 60),
  })
})
