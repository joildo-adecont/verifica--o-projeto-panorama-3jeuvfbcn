/// <reference path="../pb_data/types.d.ts" />
// 0059 - Trigger probe inquiry
migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('inquiries')
      const rec = new Record(col)
      rec.set('name', 'Probe Test')
      rec.set('email', 'probe@adecont.com.br')
      rec.set('message', 'Teste de probe Siscomex')
      rec.set('phone', '54999999999')
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
