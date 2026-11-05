/// <reference path="../pb_data/types.d.ts" />
// Migration 0131 — Teste do endpoint interno /backend/v1/series-historicas
migrate(
  (app) => {
    // Limpa o registro temporário de content_reviews criado na 0130
    try {
      const rec = app.findFirstRecordByData(
        'content_reviews',
        'summary',
        'PROVA AO VIVO SIDRA: Construcao civil t8886=160 pontos; PMS t5906=160 pontos',
      )
      if (rec) app.delete(rec)
    } catch (_) {}
  },
  (app) => {},
)
