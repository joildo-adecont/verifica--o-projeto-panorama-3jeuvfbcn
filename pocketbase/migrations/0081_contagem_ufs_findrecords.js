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
        const records = app.findRecordsByFilter(
          'radar_municipios',
          "uf = '" + uf + "'",
          '',
          1000,
          0,
        )
        c = records ? records.length : 0
      } catch (_) {
        c = 0
      }
      contagens[uf] = c
      soma += c
    }

    const p1 = {}
    const p2 = {}
    for (let i = 0; i < 14; i++) p1[ufs[i]] = contagens[ufs[i]]
    for (let i = 14; i < ufs.length; i++) p2[ufs[i]] = contagens[ufs[i]]

    try {
      const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
      rec.set('title', 'Contagem Precisa UFs findRecords')
      rec.set('review_date', '2026-10-31')
      rec.set('status', 'approved')
      rec.set('summary', JSON.stringify(p1))
      rec.set('notes', 'SOMA=' + soma + '; ' + JSON.stringify(p2))
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
