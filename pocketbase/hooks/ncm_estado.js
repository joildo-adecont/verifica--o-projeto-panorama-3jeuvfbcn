/// <reference path="../pb_data/types.d.ts" />

/**
 * ESTADO DOS AGENTES NCM — agora gravado no BANCO, não em arquivo
 * ===============================================================
 * ── O DEFEITO QUE ISSO CORRIGE (achado em 05/11/2026) ──
 * As rotas liam `tmp/ncm-monitor-ultimo.json` e `tmp/ncm-validador-ultimo.json`
 * com `$os.readFile`. Ao testar, os dois deram "no such file or directory".
 *
 * A causa: o **backend roda em outro host**, não no container do assistente. O
 * `tmp/` que o script grava não existe do lado do PocketBase. Eu tinha assumido
 * que era o mesmo sistema de arquivos — e o erro só apareceu porque testei a
 * leitura em vez de confiar que "o arquivo existe aqui, então existe lá".
 *
 * ── A CORREÇÃO ──
 * O estado passa a viver numa COLEÇÃO do PocketBase. O script grava via API, com
 * o token do painel; as rotas leem do banco. Assim não há caminho de arquivo
 * atravessando hosts — e o estado sobrevive a reinício do pod, que era outro
 * problema do tmp/.
 *
 * ── A COLEÇÃO ──
 * `ncm_agente_estado` — um registro por agente ('monitor' | 'validador'), com o
 * payload em JSON. Guardar o JSON inteiro (e não campo por campo) porque o
 * formato muda conforme o agente evolui, e uma migration por campo novo seria
 * atrito sem ganho: ninguém consulta campo isolado, todos leem o retrato.
 */

routerAdd('POST', '/backend/v1/param-ncm-estado', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var agente = String(body.agente || '')
  var payload = body.estado
  if (!agente || !payload) {
    return e.json(400, { success: false, error: 'Informe agente e estado.' })
  }

  var txt = JSON.stringify(payload)

  /* upsert: um registro por agente */
  var rec = null
  try {
    rec = $app.findFirstRecordByFilter('ncm_agente_estado', 'agente = {:a}', { a: agente })
  } catch (_) {
    rec = null
  }

  try {
    if (!rec) {
      var col = $app.findCollectionByNameOrId('ncm_agente_estado')
      rec = new Record(col)
      rec.set('agente', agente)
    }
    rec.set('payload', txt)
    rec.set('gravado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rec)
    return e.json(200, { success: true, agente: agente, bytes: txt.length })
  } catch (err) {
    return e.json(500, { success: false, error: String(err).slice(0, 200) })
  }
})

/** GET /param-ncm-estado?agente=monitor|validador — lê o estado do banco. */
routerAdd('GET', '/backend/v1/param-ncm-estado', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var agente = String(q.agente || '')
  if (!agente) return e.json(400, { success: false, error: 'Informe o agente.' })

  var rec = null
  try {
    rec = $app.findFirstRecordByFilter('ncm_agente_estado', 'agente = {:a}', { a: agente })
  } catch (_) {
    rec = null
  }

  if (!rec) {
    return e.json(200, {
      success: true,
      disponivel: false,
      agente: agente,
      mensagem:
        'Sem registro da última execução. Isso NÃO significa que a base esteja errada ou ' +
        'desatualizada — significa que o agente ainda não gravou o resultado.',
    })
  }

  var payload = {}
  try {
    payload = JSON.parse(rec.getString('payload'))
  } catch (_) {
    payload = {}
  }

  return e.json(200, {
    success: true,
    disponivel: true,
    agente: agente,
    gravado_em: String(rec.get('gravado_em') || ''),
    estado: payload.estado || '',
    quando: payload.quando || '',
    mensagem: payload.mensagem || '',
    verificacoes_ok: payload.verificacoes_ok || 0,
    verificacoes_total: payload.verificacoes_total || 0,
    problemas_graves: payload.problemas_graves || 0,
    achados: payload.achados || [],
    verificacoes: payload.verificacoes || [],
    procedencia: payload.procedencia || {},
    integridade: payload.integridade || {},
    cobertura: payload.cobertura || {},
    casamento: payload.casamento || {},
    fonte: payload.fonte || {},
    dias_varridos: payload.dias_varridos || 0,
    relevantes: payload.relevantes || [],
    erros: payload.erros || [],
    acao_sugerida: payload.acao_sugerida || '',
  })
})

/** GET /param-ncm-status — os dois agentes em uma chamada (o que a tela usa). */
routerAdd('GET', '/backend/v1/param-ncm-status', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  function ler(agente) {
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('ncm_agente_estado', 'agente = {:a}', { a: agente })
    } catch (_) {
      rec = null
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

  return e.json(200, {
    success: true,
    validador: ler('validador'),
    monitor: ler('monitor'),
  })
})
