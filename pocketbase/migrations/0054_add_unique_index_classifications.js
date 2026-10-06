/// <reference path="../pb_data/types.d.ts" />
// 0054 - Adiciona índice único composto (tipo, codigo) para suportar upsert idempotente
migrate(
  (app) => {
    // 1. Remover duplicatas residuais caso existam (mantendo a mais antiga)
    try {
      app
        .db()
        .newQuery(`
        DELETE FROM classifications WHERE id NOT IN (
          SELECT MIN(id) FROM classifications GROUP BY tipo, codigo
        )
      `)
        .execute()
    } catch (e) {
      console.log('[0054_idx_unique warning clean dups] ' + String(e))
    }

    // 2. Adicionar o índice único
    try {
      const col = app.findCollectionByNameOrId('classifications')
      col.addIndex('idx_classifications_tipo_codigo_unique', true, 'tipo, codigo', '')
      app.save(col)
    } catch (err) {
      console.log('[0054_idx_unique error] ' + String(err))
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('classifications')
      col.removeIndex('idx_classifications_tipo_codigo_unique')
      app.save(col)
    } catch (_) {}
  },
)
