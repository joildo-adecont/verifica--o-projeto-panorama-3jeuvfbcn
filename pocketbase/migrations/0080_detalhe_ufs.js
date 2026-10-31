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
        c = app.countRecords('radar_municipios', 'uf = {:uf}', { uf: uf })
      } catch (_) {
        c = 0
      }
      contagens[uf] = c
      soma += c
    }

    // Divide em duas partes para não truncar
    const parte1 = {}
    const parte2 = {}
    for (let i = 0; i < 14; i++) parte1[ufs[i]] = contagens[ufs[i]]
    for (let i = 14; i < ufs.length; i++) parte2[ufs[i]] = contagens[ufs[i]]

    try {
      const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
      rec.set('title', 'Contagem Precisa UFs Detalhada')
      rec.set('review_date', '2026-10-31')
      rec.set('status', 'approved')
      rec.set('summary', 'P1=' + JSON.stringify(parte1))
      rec.set('notes', 'TOTAL=' + soma + '; P2=' + JSON.stringify(parte2))
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
