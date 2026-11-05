/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA — grava o estado dos agentes NCM e confirma a leitura. */
routerAdd('POST', '/backend/v1/param-semeia-ncm-estado', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var body = e.requestInfo().body || {}
  var agente = String(body.agente || '')
  var estado = body.estado
  if (!agente || !estado) return e.json(400, { success: false, error: 'envie agente e estado' })

  var out = {}
  try {
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('ncm_agente_estado', 'agente = {:a}', { a: agente })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      var col = $app.findCollectionByNameOrId('ncm_agente_estado')
      rec = new Record(col)
      rec.set('agente', agente)
    }
    rec.set('payload', JSON.stringify(estado))
    rec.set('gravado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rec)
    out.gravou = true
    out.id = rec.id
  } catch (err) {
    out.gravou = false
    out.erro = String(err).slice(0, 200)
  }

  /* lê de volta para provar o caminho completo */
  try {
    var r2 = $app.findFirstRecordByFilter('ncm_agente_estado', 'agente = {:a}', { a: agente })
    var p = JSON.parse(r2.getString('payload'))
    out.leu_de_volta = true
    out.estado_lido = p.estado || ''
    out.total_lido = p.verificacoes_total || (p.relevantes ? p.relevantes.length : 0)
    out.gravado_em = String(r2.get('gravado_em') || '')
  } catch (err) {
    out.leu_de_volta = false
    out.erro_leitura = String(err).slice(0, 160)
  }

  return e.json(200, { success: true, resultado: out })
})
