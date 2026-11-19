/// <reference path="../pb_data/types.d.ts" />
/**
 * HOOK — CENTRAL DE ENTREGAS DOS AGENTES (Sistema ADECONT — Projeto Panorama)
 *
 * Rotas:
 *  POST /backend/v1/central-entregas           → grava uma entrega (relatório exportado)
 *  GET  /backend/v1/central-entregas?limit=N   → lista as entregas mais recentes
 *
 * O frontend também pode usar o PocketBase SDK direto (coleção entregas_agentes);
 * estas rotas existem para o fluxo ficar centralizado e tolerante a falhas
 * (sempre respondem 200 com { ok:false } em erro de negócio).
 */
routerAdd('POST', '/backend/v1/central-entregas', (e) => {
  let body = {}
  try {
    const info = e.requestInfo()
    body = (info && info.body) || {}
  } catch (errInfo) {
    body = {}
  }

  const agenteSegmento = String(body.agente_segmento || '').trim()
  const agenteNome = String(body.agente_nome || '').trim()
  const titulo = String(body.titulo || '').trim()
  const tipoConteudo = String(body.tipo_conteudo || '').trim()
  let conteudoJson = body.conteudo_json
  if (typeof conteudoJson !== 'string') {
    try {
      conteudoJson = JSON.stringify(conteudoJson || [])
    } catch (err) {
      conteudoJson = '[]'
    }
  }

  if (!agenteSegmento || !titulo) {
    return e.json(200, { ok: false, error: 'agente_segmento e titulo são obrigatórios' })
  }

  try {
    const col = $app.findCollectionByNameOrId('entregas_agentes')
    const rec = new Record(col)
    rec.set('agente_segmento', agenteSegmento)
    rec.set('agente_nome', agenteNome || agenteSegmento)
    rec.set('titulo', titulo)
    rec.set('tipo_conteudo', tipoConteudo || 'PDF')
    rec.set('conteudo_json', String(conteudoJson).slice(0, 490000))
    rec.set('pergunta_origem', String(body.pergunta_origem || '').slice(0, 3900))
    $app.save(rec)
    return e.json(200, { ok: true, id: rec.get('id') })
  } catch (err) {
    console.log('[central-entregas] erro ao gravar: ' + err)
    return e.json(200, { ok: false, error: 'falha ao gravar entrega' })
  }
})

routerAdd('GET', '/backend/v1/central-entregas', (e) => {
  try {
    const url = e.request.url.query()
    let limite = parseInt(url.get('limit') || '100', 10)
    if (!limite || limite < 1) limite = 100
    if (limite > 500) limite = 500

    const col = $app.findCollectionByNameOrId('entregas_agentes')
    const registros = $app.findRecordsByFilter(col, '', '-created', limite, 0)

    const entregas = registros.map((rec) => ({
      id: rec.get('id'),
      agente_segmento: rec.get('agente_segmento'),
      agente_nome: rec.get('agente_nome'),
      titulo: rec.get('titulo'),
      tipo_conteudo: rec.get('tipo_conteudo'),
      conteudo_json: rec.get('conteudo_json'),
      pergunta_origem: rec.get('pergunta_origem'),
      created: rec.get('created'),
    }))

    return e.json(200, { ok: true, entregas: entregas })
  } catch (err) {
    console.log('[central-entregas] erro ao listar: ' + err)
    return e.json(200, { ok: false, entregas: [], error: 'falha ao listar entregas' })
  }
})
