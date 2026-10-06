/// <reference path="../pb_data/types.d.ts" />
// 0064 - Diagnostico contagem real com app.countRecords
migrate(
  (app) => {
    let result = {}

    try {
      result.totalGeral = app.countRecords('classifications')
    } catch (e) {
      result.totalGeralErr = String(e)
    }

    try {
      result.totalNCM = app.countRecords('classifications', $dbx.exp("tipo = 'NCM'"))
    } catch (e) {
      result.totalNCMErr = String(e)
    }

    try {
      result.totalHash = app.countRecords('classifications', $dbx.hashExp({ tipo: 'NCM' }))
    } catch (e) {
      result.totalHashErr = String(e)
    }

    try {
      const colReview = app.findCollectionByNameOrId('content_reviews')
      const rec = new Record(colReview)
      rec.set('review_date', new Date().toISOString())
      rec.set('status', 'ok')
      rec.set('notes', 'COUNT_RECORDS_RESULT: ' + JSON.stringify(result))
      rec.set('summary', 'Resultado exato countRecords')
      rec.set('sources_checked', [])
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
