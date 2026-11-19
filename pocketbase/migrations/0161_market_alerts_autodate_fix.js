/**
 * MIGRAÇÃO 0161 — Correção: campos autodate created/updated nas coleções da 0122
 * Sistema ADECONT — Projeto Panorama
 *
 * As coleções market_alerts, news_cache e series_cache foram criadas na
 * migração 0122 SEM os campos autodate created/updated (obrigatórios em toda
 * coleção base). Resultado: qualquer consulta do frontend que use sort/filter
 * por esses campos falha com HTTP 400 "Something went wrong" — em especial o
 * sino de alertas de mercado da home (sort: '-alert_date,-created'), que
 * quebrava a cada carregamento (visível nos logs de requests).
 *
 * Esta migração adiciona os dois campos autodate às três coleções, de forma
 * idempotente (só adiciona quando não existem).
 */
migrate(
  (app) => {
    const colecoes = ['market_alerts', 'news_cache', 'series_cache']

    for (let i = 0; i < colecoes.length; i++) {
      const col = app.findCollectionByNameOrId(colecoes[i])

      if (!col.fields.getByName('created')) {
        col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
      }
      if (!col.fields.getByName('updated')) {
        col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
      }

      app.save(col)
      console.log('[0161] autodate created/updated garantidos em ' + colecoes[i])
    }
  },
  (app) => {
    // down: remove os campos autodate novamente
    const colecoes = ['market_alerts', 'news_cache', 'series_cache']
    for (let i = 0; i < colecoes.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(colecoes[i])
        const fCreated = col.fields.getByName('created')
        if (fCreated) col.fields.removeByName('created')
        const fUpdated = col.fields.getByName('updated')
        if (fUpdated) col.fields.removeByName('updated')
        app.save(col)
      } catch (_) {}
    }
  },
)
