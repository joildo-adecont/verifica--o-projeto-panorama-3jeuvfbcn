/// <reference path="../pb_data/types.d.ts" />
// Migration 0122 — Registro da fonte bcb_bacen (Banco Central do Brasil — BACEN)
// na tabela de status de fontes (order 50, tier oficial_institucional, status ativo).
// Indicadores: BCB SGS 20714 (juros médios), 20746 (juros pessoal), 21114 (inadimplência).
migrate(
  (app) => {
    let rec = null
    try {
      rec = app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
    } catch (_) {
      rec = null
    }
    if (!rec) {
      const col = app.findCollectionByNameOrId('source_status')
      rec = new Record(col)
      rec.set('source_key', 'bcb_bacen')
    }
    rec.set('name', 'Banco Central do Brasil (BACEN)')
    rec.set('url', 'https://www.bcb.gov.br')
    rec.set('status', 'active')
    rec.set('http_status', 200)
    rec.set('response_time_ms', 0)
    rec.set('last_checked_at', new Date().toISOString())
    rec.set(
      'message',
      'Fonte oficial institucional registrada (séries BCB SGS de crédito: juros médios, juros pessoal e inadimplência).',
    )
    rec.set('order', 50)
    rec.set('coverage_status', 'coberta_direta')
    rec.set('confidence_tier', 'oficial_institucional')
    rec.set(
      'alternative_source',
      'BCB SGS 20714 (juros médios das operações de crédito), 20746 (juros pessoal), 21114 (inadimplência)',
    )
    app.save(rec)
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
      if (rec) app.delete(rec)
    } catch (_) {}
  },
)
