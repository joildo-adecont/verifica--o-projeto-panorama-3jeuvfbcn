/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — testa a rota que a TELA usa (param-ncm-status), por dentro.
 *
 * A tela diz "o monitor ainda não rodou", mas o banco TEM os 2 registros.
 * Então o defeito está entre o banco e a tela. Esta rota reproduz exatamente
 * o que /param-ncm-status faz, para separar: banco → rota → tela.
 */
routerAdd('POST', '/backend/v1/param-diag-ncm-status', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = { passos: [] }

  /* 1. o segredo do painel existe? (a rota da tela valida X-Painel-Token) */
  var segredo = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  out.segredo_existe = segredo.length > 0
  out.segredo_tamanho = segredo.length

  /* 2. a leitura do banco, igual à rota real */
  function ler(agente) {
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('ncm_agente_estado', 'agente = {:a}', { a: agente })
    } catch (err) {
      return { erro: String(err).slice(0, 120) }
    }
    if (!rec) return { disponivel: false, agente: agente }
    var p = {}
    try {
      p = JSON.parse(rec.getString('payload'))
    } catch (_) {
      p = {}
    }
    p.disponivel = true
    p.gravado_em = String(rec.get('gravado_em') || '')
    return p
  }

  var val = ler('validador')
  var mon = ler('monitor')

  out.validador = {
    disponivel: val.disponivel,
    ok: val.verificacoes_ok,
    total: val.verificacoes_total,
    achados: val.achados ? val.achados.length : 0,
    mensagem: String(val.mensagem || '').slice(0, 120),
  }
  out.monitor = {
    disponivel: mon.disponivel,
    estado: mon.estado,
    relevantes: mon.relevantes ? mon.relevantes.length : 0,
    dias: mon.dias_varridos,
    mensagem: String(mon.mensagem || '').slice(0, 120),
  }

  /* 3. a rota responde com o token do segredo? (testa o caminho completo) */
  var host = 'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'
  try {
    var r = $http.send({
      url: host + '/backend/v1/param-ncm-status',
      method: 'GET',
      headers: { 'X-Painel-Token': segredo },
      timeout: 60,
    })
    out.rota_http = r.statusCode
    var j = r.json || {}
    out.rota_validador_disponivel = j.validador ? j.validador.disponivel : null
    out.rota_monitor_disponivel = j.monitor ? j.monitor.disponivel : null
  } catch (err) {
    out.rota_erro = String(err).slice(0, 140)
  }

  return e.json(200, { success: true, resultado: out })
})
