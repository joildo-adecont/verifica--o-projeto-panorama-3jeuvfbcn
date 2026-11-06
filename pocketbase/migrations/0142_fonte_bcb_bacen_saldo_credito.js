/// <reference path="../pb_data/types.d.ts" />
// Migration 0142 — Atualização do registro da fonte bcb_bacen (Banco Central do
// Brasil — BACEN) na tabela de status de fontes, com a descrição/nomes das 4
// séries de crédito do SGS: juros médios (SGS 20714), juros do crédito pessoal
// (SGS 20746), inadimplência (SGS 21114) e saldo de crédito em % do PIB (SGS 20622).
// Idempotente: no-op em banco vazio (não cria coleção, só atualiza o registro).
migrate(
  (app) => {
    let rec = null
    try {
      rec = app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
    } catch (_) {
      rec = null
    }
    if (!rec) {
      // No-op em DB vazio (a rota check-sources e o cron semanal criam o
      // registro com o mesmo conteúdo na primeira execução).
      return
    }
    rec.set('name', 'Banco Central — BACEN (Estatísticas de Crédito — SGS)')
    rec.set('url', 'https://www.bcb.gov.br/')
    rec.set(
      'message',
      'Fonte oficial institucional ativa (séries BCB SGS de crédito: juros médios 20714, juros do crédito pessoal 20746, inadimplência 21114 e saldo de crédito % do PIB 20622).',
    )
    rec.set('order', 50)
    rec.set('coverage_status', 'coberta_direta')
    rec.set('confidence_tier', 'oficial_institucional')
    rec.set(
      'alternative_source',
      'BCB SGS 20714 (juros médios), 20746 (juros do crédito pessoal), 21114 (inadimplência) e 20622 (saldo de crédito — % do PIB)',
    )
    app.save(rec)
  },
  (app) => {
    // Reversão: volta para a descrição anterior (3 séries).
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
      if (rec) {
        rec.set(
          'message',
          'Fonte oficial institucional registrada (séries BCB SGS de crédito: juros médios, juros pessoal e inadimplência).',
        )
        rec.set(
          'alternative_source',
          'BCB SGS 20714 (juros médios das operações de crédito), 20746 (juros pessoal), 21114 (inadimplência)',
        )
        app.save(rec)
      }
    } catch (_) {}
  },
)
