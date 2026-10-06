/// <reference path="../pb_data/types.d.ts" />
// 0065 - Contagem exata por tipo e códigos distintos sem $dbx
migrate(
  (app) => {
    let result = {}

    // No PocketBase v0.36 SQLite, podemos criar uma view temporária ou consultar tabela auxiliar ou iterar
    // Ou simplesmente: app.countRecords("classifications")
    const totalGeral = app.countRecords('classifications')
    result.totalGeral = totalGeral

    // Para saber NCM e distintos, podemos usar uma tabela de relatório ou contar diretamente via SQL INSERT INTO
    // SQLite permite: INSERT INTO content_reviews (...) SELECT ... FROM classifications
    try {
      app
        .db()
        .newQuery(`
        INSERT INTO content_reviews (id, review_date, status, notes, summary, sources_checked, created, updated)
        SELECT 
          'audit-ncm-counts' as id,
          datetime('now') as review_date,
          'ok' as status,
          'AUDITORIA_FINAL_SQL: total_ncm=' || count(*) || ', distinct_ncm=' || count(DISTINCT codigo) as notes,
          'Contagem e distintos apurados via SQL direto no SQLite' as summary,
          '[]' as sources_checked,
          datetime('now') as created,
          datetime('now') as updated
        FROM classifications WHERE tipo = 'NCM'
        ON CONFLICT(id) DO UPDATE SET notes = excluded.notes, updated = excluded.updated
      `)
        .execute()
    } catch (eSql) {
      result.sqlErr = String(eSql)
    }

    try {
      app
        .db()
        .newQuery(`
        INSERT INTO content_reviews (id, review_date, status, notes, summary, sources_checked, created, updated)
        SELECT 
          'audit-all-types' as id,
          datetime('now') as review_date,
          'ok' as status,
          'AUDITORIA_TIPOS_SQL: ' || group_concat(tipo || '=' || c, ', ') as notes,
          'Contagem por tipo de classificacao' as summary,
          '[]' as sources_checked,
          datetime('now') as created,
          datetime('now') as updated
        FROM (SELECT tipo, count(*) as c FROM classifications GROUP BY tipo)
        ON CONFLICT(id) DO UPDATE SET notes = excluded.notes, updated = excluded.updated
      `)
        .execute()
    } catch (eTipos) {
      result.tiposErr = String(eTipos)
    }
  },
  (app) => {},
)
