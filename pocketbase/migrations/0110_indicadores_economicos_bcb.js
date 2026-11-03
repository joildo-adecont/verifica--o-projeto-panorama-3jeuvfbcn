/**
 * 0110 — Indicadores Econômicos e Financeiros (Banco Central)
 *
 * 1) Cria a coleção `economic_indicators_cache` — snapshot dos indicadores
 *    coletados pelo hook /backend/v1/indicadores-economicos (SGS + PTAX do BCB).
 *    Regras fechadas (null): a coleção é interna, lida/escrita só por hooks.
 * 2) Registra a fonte "Banco Central" em `source_status` com
 *    confidence_tier "oficial_institucional", para o selo aparecer na
 *    verificação de fontes, na faixa de status da home e no Monitor Legislativo.
 *
 * Idempotente: em base vazia é no-op na fonte (só cria o que falta).
 */
/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // ── 1. coleção de cache ──
    let colecao = null
    try {
      colecao = app.findCollectionByNameOrId('economic_indicators_cache')
    } catch (_) {
      colecao = null
    }
    if (!colecao) {
      const nova = new Collection({
        name: 'economic_indicators_cache',
        type: 'base',
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'payload', type: 'json' },
          { name: 'atualizado_em', type: 'text' },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_economic_indicators_cache_chave ON economic_indicators_cache (chave)',
        ],
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
      })
      app.save(nova)
    }

    // ── 2. fonte Banco Central no catálogo de fontes ──
    const colFontes = app.findCollectionByNameOrId('source_status')

    let rec = null
    try {
      rec = app.findFirstRecordByData('source_status', 'source_key', 'banco_central')
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record(colFontes)
      rec.set('source_key', 'banco_central')
    }
    rec.set('name', 'Banco Central do Brasil (BCB — Indicadores Econômicos, SGS e Câmbio PTAX)')
    rec.set('url', 'https://www.bcb.gov.br')
    rec.set('status', 'active')
    rec.set('http_status', 200)
    rec.set('response_time_ms', 0)
    rec.set('last_checked_at', new Date().toISOString())
    rec.set(
      'message',
      'Fonte oficial institucional dos indicadores econômicos e financeiros: séries SGS (IPCA, INPC, IGP-M, IPC, Selic, CDI, TR, poupança) e câmbio PTAX. Consultada via proxy do backend (/backend/v1/indicadores-economicos), com cache e fallback transparente.',
    )
    rec.set('order', 35)
    rec.set('coverage_status', 'coberta_direta')
    rec.set('confidence_tier', 'oficial_institucional')
    rec.set(
      'alternative_source',
      'API SGS do BCB (api.bcb.gov.br) e PTAX/Olinda (olinda.bcb.gov.br)',
    )
    rec.set('unblock_channel', '')
    app.save(rec)
  },
  (app) => {
    // Revert: remove apenas o registro da fonte; a coleção permanece (sem dados)
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'banco_central')
      app.delete(rec)
    } catch (_) {}
  },
)
