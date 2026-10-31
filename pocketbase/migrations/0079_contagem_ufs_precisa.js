/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const ufs = [
      'AC',
      'AL',
      'AM',
      'AP',
      'BA',
      'CE',
      'DF',
      'ES',
      'GO',
      'MA',
      'MG',
      'MS',
      'MT',
      'PA',
      'PB',
      'PE',
      'PI',
      'PR',
      'RJ',
      'RN',
      'RO',
      'RR',
      'RS',
      'SC',
      'SE',
      'SP',
      'TO',
    ]

    const contagens = {}
    let soma = 0

    for (let i = 0; i < ufs.length; i++) {
      const uf = ufs[i]
      let c = 0
      try {
        const records = app.findRecordsByFilter('radar_municipios', "uf = '" + uf + "'", '', 1, 0)
        // O método countRecords recebe (collection, filter) no PocketBase v0.36
        c = app.countRecords('radar_municipios', 'uf = {:uf}', { uf: uf })
      } catch (e1) {
        try {
          // Fallback usando findRecordsByFilter com limite
          const rows = app.findRecordsByFilter('radar_municipios', "uf = '" + uf + "'", '', 1000, 0)
          c = rows.length
        } catch (e2) {
          c = -1
        }
      }
      contagens[uf] = c
      soma += c > 0 ? c : 0
    }

    try {
      const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
      rec.set('title', 'Contagem Precisa UFs')
      rec.set('review_date', '2026-10-31')
      rec.set('status', 'approved')
      rec.set('notes', 'SOMA=' + soma + '; UFS=' + JSON.stringify(contagens))
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
