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
    let total = 0

    for (let i = 0; i < ufs.length; i++) {
      const uf = ufs[i]
      let count = 0
      try {
        count = app.countRecords('radar_municipios', "uf = '" + uf + "'")
      } catch (e) {
        count = -1
      }
      contagens[uf] = count
      total += count > 0 ? count : 0
    }

    let totalGeral = 0
    try {
      totalGeral = app.countRecords('radar_municipios')
    } catch (_) {}

    try {
      const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
      rec.set('title', 'Auditoria Contagem Municipios IBGE')
      rec.set('review_date', '2026-10-31')
      rec.set('status', 'approved')
      rec.set(
        'notes',
        'TOTAL_GERAL=' +
          totalGeral +
          '; SOMA_UFS=' +
          total +
          '; DETALHES=' +
          JSON.stringify(contagens),
      )
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
