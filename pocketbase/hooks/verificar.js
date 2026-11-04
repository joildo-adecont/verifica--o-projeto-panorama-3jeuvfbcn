/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA DE VERIFICAÇÃO — REMOVER APÓS O TESTE. */
routerAdd('POST', '/backend/v1/param-verificar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {}

  var lista = []
  var semDirecao = 0
  var totalEntrada = 0
  var totalSaida = 0
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var dir = d.getString('direcao')
    var v = Number(d.get('valor_total')) || 0
    if (!dir) semDirecao++
    if (dir === 'entrada') totalEntrada += v
    else if (dir === 'saida') totalSaida += v
    lista.push({
      nome: d.getString('nome_arquivo'),
      emitente: d.getString('emitente_nome'),
      valor: v,
      direcao: dir,
      cfop: d.getString('cfop_predominante'),
      conflito: d.get('itens_direcao_divergente'),
    })
  }

  /* Duplicidade por chave — para o CEO decidir, não para eu apagar. */
  var porChave = {}
  var duplicadas = []
  for (var j = 0; j < docs.length; j++) {
    var ch = docs[j].getString('chave')
    if (!ch) continue
    if (porChave[ch]) duplicadas.push(ch)
    else porChave[ch] = true
  }

  return e.json(200, {
    success: true,
    total_documentos: docs.length,
    sem_direcao: semDirecao,
    total_entrada: Math.round(totalEntrada * 100) / 100,
    total_saida: Math.round(totalSaida * 100) / 100,
    documentos: lista,
    chaves_duplicadas: duplicadas,
  })
})
