/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA — verifica o que a rota de carteira devolve de verdade. */
routerAdd('POST', '/backend/v1/param-teste-carteira', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = {}

  /* 1. a coleção existe? */
  try {
    var col = $app.findCollectionByNameOrId('clients')
    out.colecao_existe = true
    out.colecao_id = col.id
    out.campos = col.fields.map(function (f) {
      return f.name
    })
  } catch (err) {
    out.colecao_existe = false
    out.erro = String(err).slice(0, 160)
  }

  /* 2. quantos registros? */
  if (out.colecao_existe) {
    try {
      var todos = $app.findRecordsByFilter('clients', '', 'name', 5, 0)
      out.amostra = []
      for (var i = 0; i < todos.length; i++) {
        out.amostra.push({
          codigo: todos[i].getString('client_code'),
          nome: String(todos[i].getString('name')).slice(0, 40),
          natureza: todos[i].getString('legal_nature'),
        })
      }
    } catch (err) {
      out.erro_leitura = String(err).slice(0, 160)
    }
  }

  /* 3. lista as coleções disponíveis neste backend (para saber onde procurar) */
  try {
    var cols = $app.findAllCollections()
    var nomes = []
    for (var j = 0; j < cols.length; j++) nomes.push(cols[j].name)
    out.total_colecoes = nomes.length
    out.tem_clients = nomes.indexOf('clients') >= 0
    out.tem_simul_clientes = nomes.indexOf('simul_clientes') >= 0
    out.primeiras = nomes.slice(0, 20)
  } catch (err) {
    out.erro_colecoes = String(err).slice(0, 120)
  }

  return e.json(200, { success: true, resultado: out })
})
