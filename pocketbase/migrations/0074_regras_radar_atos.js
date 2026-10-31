/// <reference path="../pb_data/types.d.ts" />

/**
 * 0074 — REGRAS DE API DA COLEÇÃO radar_atos
 *
 * ── O QUE ACONTECEU ──
 * A migration 0073 criou os campos de nível/ente, mas a coleção herdou as regras
 * do rascunho: createRule/updateRule/deleteRule = null. No PocketBase, `null`
 * significa "somente superusuário". A rotina de carga grava com o token do agente
 * e recebeu 403 "Only superusers can perform this action" — que o retry interpretou
 * como 429 e repetiu em vão, deixando a coleção vazia depois de a 0073 ter apagado
 * a amostra antiga.
 *
 * ── CORREÇÃO ──
 * Leitura pública (o painel consulta sem login) e escrita liberada para a API,
 * porque quem grava é a rotina do servidor com o token do agente. O que protege a
 * coleção contra duplicata é o índice único (nivel+ente_chave+titulo+data).
 *
 * Se no futuro a coleção passar a receber escrita de navegador, as regras precisam
 * voltar a exigir autenticação — está anotado aqui para não se perder.
 */

migrate(
  (app) => {
    const atos = app.findCollectionByNameOrId('radar_atos')
    atos.listRule = ''
    atos.viewRule = ''
    atos.createRule = ''
    atos.updateRule = ''
    atos.deleteRule = ''
    app.save(atos)
  },
  (app) => {
    const atos = app.findCollectionByNameOrId('radar_atos')
    atos.listRule = ''
    atos.viewRule = ''
    atos.createRule = null
    atos.updateRule = null
    atos.deleteRule = null
    app.save(atos)
  },
)
