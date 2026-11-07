/**
 * MIGRATION 0149 — Regras de acesso públicas para cont_documentos e cont_contas
 *
 * Permite leitura e escrita direta pelo SDK autenticado ou anônimo no frontend
 * (listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: "")
 * para alimentar os importadores e análises empresariais segregadas por cliente_cnpj.
 */
migrate(
  (app) => {
    try {
      const docs = app.findCollectionByNameOrId('cont_documentos')
      docs.listRule = ''
      docs.viewRule = ''
      docs.createRule = ''
      docs.updateRule = ''
      docs.deleteRule = ''
      app.save(docs)
    } catch (e) {
      console.log('[0149] Erro ao atualizar cont_documentos:', e)
    }

    try {
      const contas = app.findCollectionByNameOrId('cont_contas')
      contas.listRule = ''
      contas.viewRule = ''
      contas.createRule = ''
      contas.updateRule = ''
      contas.deleteRule = ''
      app.save(contas)
    } catch (e) {
      console.log('[0149] Erro ao atualizar cont_contas:', e)
    }
  },
  (app) => {
    try {
      const docs = app.findCollectionByNameOrId('cont_documentos')
      docs.listRule = null
      docs.viewRule = null
      docs.createRule = null
      docs.updateRule = null
      docs.deleteRule = null
      app.save(docs)
    } catch (_) {}

    try {
      const contas = app.findCollectionByNameOrId('cont_contas')
      contas.listRule = null
      contas.viewRule = null
      contas.createRule = null
      contas.updateRule = null
      contas.deleteRule = null
      app.save(contas)
    } catch (_) {}
  },
)
