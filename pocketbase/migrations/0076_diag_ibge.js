/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Teste de gravação para verificar resultado do download
    try {
      const res = $http.send({
        url: 'https://raw.githubusercontent.com/chandez/Estados-Cidades-IBGE/master/json/municipios.json',
        method: 'GET',
        timeout: 30,
      })

      let total = 0
      let amostra = ''
      if (res.statusCode === 200) {
        const data = JSON.parse(res.raw)
        const list = data.data || []
        total = list.length
        if (list.length > 0) {
          amostra = list[0].Codigo + ' - ' + list[0].Nome + '/' + list[0].Uf
        }
      }

      try {
        const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
        rec.set('title', 'Diagnostico IBGE')
        rec.set('review_date', '2026-10-31')
        rec.set('status', 'approved')
        rec.set('notes', 'STATUS=' + res.statusCode + '; TOTAL=' + total + '; AMOSTRA=' + amostra)
        app.save(rec)
      } catch (e2) {
        // ignore
      }
    } catch (err) {
      try {
        const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
        rec.set('title', 'Diagnostico IBGE ERRO')
        rec.set('review_date', '2026-10-31')
        rec.set('status', 'approved')
        rec.set('notes', 'ERRO=' + String(err))
        app.save(rec)
      } catch (_) {}
    }
  },
  (app) => {},
)
