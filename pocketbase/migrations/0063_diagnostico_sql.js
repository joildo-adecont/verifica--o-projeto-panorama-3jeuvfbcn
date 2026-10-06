/// <reference path="../pb_data/types.d.ts" />
// 0063 - Diagnostico Goja SQL retorno
migrate(
  (app) => {
    let result = {}
    try {
      // Formato Goja dbx all: em Goja/PocketBase, newQuery('...').all() pode precisar de passar um slice/array ou retorna []
      const rows = []
      app.db().newQuery('SELECT count(*) as total FROM classifications').all(rows)
      result.withArg = rows
    } catch (e1) {
      result.withArgErr = String(e1)
    }

    try {
      const q = app.db().newQuery('SELECT count(*) as total FROM classifications')
      const r = q.all()
      result.withoutArg = r
      if (r && r.length > 0) {
        result.firstRowKeys = Object.keys(r[0])
        result.firstRowVal = JSON.stringify(r[0])
      }
    } catch (e2) {
      result.withoutArgErr = String(e2)
    }

    try {
      const recs = app.findRecordsByFilter('classifications', "tipo = 'NCM'", '', 5, 0)
      result.findRecordsCount = recs ? recs.length : 0
      if (recs && recs.length > 0) {
        result.firstRecCodigo = recs[0].get('codigo')
        result.firstRecTipo = recs[0].get('tipo')
      }
    } catch (e3) {
      result.findRecordsErr = String(e3)
    }

    try {
      const c = app.countRecords('classifications')
      result.countRecordsDirect = c
    } catch (e4) {
      result.countRecordsErr = String(e4)
    }

    try {
      const colReview = app.findCollectionByNameOrId('content_reviews')
      const rec = new Record(colReview)
      rec.set('review_date', new Date().toISOString())
      rec.set('status', 'ok')
      rec.set('notes', 'DIAGNOSTICO_SQL: ' + JSON.stringify(result))
      rec.set('summary', 'Diagnostico da sintaxe Goja dbx no PocketBase v0.36')
      rec.set('sources_checked', [])
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
