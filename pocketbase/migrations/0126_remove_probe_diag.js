/// <reference path="../pb_data/types.d.ts" />
// 0126 — LIMPEZA do diagnóstico: remove a coleção TEMPORÁRIA probe_diag
// (criada pela 0125 para a sonda de códigos IPEADATA/BCB). A sonda
// (hook ipea_probe_cron.js) já foi removida do código; a coleção e as
// linhas de diagnóstico saem do ar com esta migration.
migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('probe_diag')
      if (col !== null && col !== undefined) app.delete(col)
    } catch (_) {
      // já não existe — idempotente
    }
  },
  (app) => {
    // Reversa: nada a recriar (coleção era descartável).
  },
)
