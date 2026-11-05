/// <reference path="../pb_data/types.d.ts" />
// 0125 — coleção de diagnóstico do probe IPEADATA/BCB (TEMPORÁRIA; será removida).
migrate(
  (app) => {
    let existe = null
    try {
      existe = app.findCollectionByNameOrId('probe_diag')
    } catch (_) {
      existe = null
    }
    if (existe === null || existe === undefined) {
      const col = new Collection({
        system: false,
        type: 'base',
        name: 'probe_diag',
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { type: 'text', name: 'linha', required: true },
          { type: 'autodate', name: 'created', onCreate: true },
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('probe_diag')
      if (col !== null && col !== undefined) app.delete(col)
    } catch (_) {}
  },
)
