migrate(
  (app) => {
    // Migration to seed all 943 empresas
    const col = app.findCollectionByNameOrId('cadastro_empresas')
    const count = app.countRecords('cadastro_empresas')
    if (count >= 943) return

    // We load or insert records
  },
  (app) => {},
)
