/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA DE TESTE — REMOVER APÓS VALIDAR. */
routerAdd('POST', '/backend/v1/param-teste-f5', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {}

  var alvo = null
  for (var i = 0; i < docs.length; i++) {
    if (String(docs[i].getString('emitente_nome') || '').indexOf('SEGALAS') >= 0) {
      alvo = docs[i]
      break
    }
  }
  if (!alvo) return e.json(200, { success: false, erro: 'NF da SEGALAS não encontrada' })

  var itens = []
  try {
    itens = $app.findRecordsByFilter(
      'param_itens',
      'documento = "' + alvo.id + '"',
      'numero_item',
      500,
      0,
    )
  } catch (_) {}

  var lista = []
  for (var j = 0; j < itens.length; j++) {
    lista.push({
      n: itens[j].get('numero_item'),
      desc: itens[j].getString('descricao'),
      ncm: itens[j].getString('ncm'),
      cfop: itens[j].getString('cfop'),
      valor: itens[j].get('valor_total'),
      direcao: itens[j].getString('direcao'),
    })
  }

  return e.json(200, {
    success: true,
    documento: {
      id: alvo.id,
      emitente: alvo.getString('emitente_nome'),
      uf: alvo.getString('uf'),
      numero: alvo.getString('numero'),
      direcao: alvo.getString('direcao'),
      cfop: alvo.getString('cfop_predominante'),
      valor_total: alvo.get('valor_total'),
      qtd_itens: alvo.get('qtd_itens'),
    },
    itens: lista,
  })
})
