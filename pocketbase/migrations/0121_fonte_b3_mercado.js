/// <reference path="../pb_data/types.d.ts" />
// Migration 0121 — Registro pendente da fonte b3_mercado (B3/IPEA — Ibovespa e IFIX)
// na tabela de status de fontes (order 49, tier oficial_institucional).
migrate(
  (app) => {
    let rec = null
    try {
      rec = app.findFirstRecordByData('source_status', 'source_key', 'b3_mercado')
    } catch (_) {
      rec = null
    }
    if (!rec) {
      const col = app.findCollectionByNameOrId('source_status')
      rec = new Record(col)
      rec.set('source_key', 'b3_mercado')
    }
    rec.set('name', 'B3/IPEA — Mercado Financeiro (Ibovespa e IFIX — índices da B3)')
    rec.set('url', 'https://www.b3.com.br')
    rec.set('status', 'active')
    rec.set('http_status', 200)
    rec.set('response_time_ms', 0)
    rec.set('last_checked_at', new Date().toISOString())
    rec.set(
      'message',
      'Fonte oficial institucional registrada (Ibovespa via BCB SGS 7; IFIX via IPEADATA GM12_ERNBG11BRA_IXOB).',
    )
    rec.set('order', 49)
    rec.set('coverage_status', 'coberta_direta')
    rec.set('confidence_tier', 'oficial_institucional')
    rec.set(
      'alternative_source',
      'BCB SGS 7 (Ibovespa em pontos) e IPEADATA GM12_ERNBG11BRA_IXOB (IFIX — fundos imobiliários da B3)',
    )
    app.save(rec)
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'b3_mercado')
      if (rec) app.delete(rec)
    } catch (_) {}
  },
)
