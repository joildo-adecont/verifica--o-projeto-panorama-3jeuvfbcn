/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Download da base oficial completa de 5.570 municípios do IBGE (27 Unidades Federativas)
    const res = $http.send({
      url: 'https://raw.githubusercontent.com/chandez/Estados-Cidades-IBGE/master/json/municipios.json',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ADECONT-Panorama/1.0',
      },
      timeout: 60,
    })

    if (res.statusCode !== 200 || !res.raw) {
      throw new Error(
        'Falha ao baixar catálogo oficial de municípios do IBGE: HTTP ' + res.statusCode,
      )
    }

    const parsed = JSON.parse(res.raw)
    const list = parsed.data || []

    if (!list || list.length < 5560) {
      throw new Error(
        'Catálogo de municípios incompleto: recebidos apenas ' + (list ? list.length : 0),
      )
    }

    const batchSize = 250
    const now = new Date().toISOString()
    let inseridos = 0

    for (let start = 0; start < list.length; start += batchSize) {
      const end = Math.min(start + batchSize, list.length)

      app.runInTransaction((txApp) => {
        for (let i = start; i < end; i++) {
          const item = list[i]
          if (!item || !item.Codigo || !item.Nome || !item.Uf) continue

          const codigo = String(item.Codigo).trim()
          const nome = String(item.Nome).trim()
          const uf = String(item.Uf).trim().toUpperCase()

          if (!/^\d{7}$/.test(codigo) || !uf || uf.length !== 2) continue

          const idRand = $security.randomString(15)

          txApp
            .db()
            .newQuery(`
          INSERT INTO radar_municipios (id, codigo_ibge, nome, uf, created, updated)
          VALUES ({:id}, {:codigo}, {:nome}, {:uf}, {:now}, {:now})
          ON CONFLICT(codigo_ibge) DO UPDATE SET
            nome = {:nome},
            uf = {:uf},
            updated = {:now}
        `)
            .bind({
              id: idRand,
              codigo: codigo,
              nome: nome,
              uf: uf,
              now: now,
            })
            .execute()

          inseridos++
        }
      })
    }

    // Registrar auditoria em content_reviews
    try {
      const rec = new Record(app.findCollectionByNameOrId('content_reviews'))
      rec.set('title', 'Expansão Nacional Radar Municípios - IBGE')
      rec.set('review_date', '2026-10-31')
      rec.set('status', 'approved')
      rec.set('notes', 'TOTAL_PROCESSADOS=' + inseridos + '; LISTA_ORIGINAL=' + list.length)
      app.save(rec)
    } catch (_) {}
  },
  (app) => {},
)
