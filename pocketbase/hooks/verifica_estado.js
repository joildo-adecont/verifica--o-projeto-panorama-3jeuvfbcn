/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA — verifica se o estado dos agentes NCM existe no banco de PRODUÇÃO. */
routerAdd('POST', '/backend/v1/param-verifica-estado-ncm', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = { registros: [], campos: [] }

  try {
    var col = $app.findCollectionByNameOrId('ncm_agente_estado')
    out.colecao = true
    for (var i = 0; i < col.fields.length; i++) out.campos.push(col.fields[i].name)
  } catch (err) {
    out.colecao = false
    out.erro_colecao = String(err).slice(0, 160)
  }

  try {
    var todos = $app.findRecordsByFilter('ncm_agente_estado', '', '-gravado_em', 20, 0)
    out.total = todos.length
    for (var j = 0; j < todos.length; j++) {
      var p = todos[j].getString('payload')
      var d = {}
      try {
        d = JSON.parse(p)
      } catch (_) {}
      out.registros.push({
        agente: todos[j].getString('agente'),
        gravado_em: String(todos[j].get('gravado_em') || ''),
        bytes: p.length,
        estado: d.estado || '',
        quando: d.quando || '',
        ok: d.verificacoes_ok || 0,
        total_v: d.verificacoes_total || 0,
        relevantes: d.relevantes ? d.relevantes.length : 0,
      })
    }
  } catch (err) {
    out.erro_busca = String(err).slice(0, 160)
  }

  return e.json(200, { success: true, resultado: out })
})
