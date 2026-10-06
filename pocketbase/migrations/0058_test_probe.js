/// <reference path="../pb_data/types.d.ts" />
// 0058 - Limpeza e preparo para absorção completa de classificações
migrate(
  (app) => {
    try {
      app.db().newQuery("DELETE FROM content_reviews WHERE notes LIKE 'MIGRATION_0058%'").execute()
    } catch (_) {}
  },
  (app) => {},
)
