/**
 * MIGRATION 0147 — Campo regime_tributario em cadastro_empresas
 * ==============================================================
 * Permite selecionar e gravar formalmente o Regime Tributário do cliente
 * (Simples Nacional, Simples Híbrido, Lucro Presumido, Lucro Real, Regime Regular IBS/CBS).
 *
 * Também inicializa o regime da Auto Mecânica Irmãos Pastore Ltda (CNPJ 92353630000168)
 * como 'Simples Nacional'.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas')

    if (!col.fields.getByName('regime_tributario')) {
      col.fields.add(new TextField({ name: 'regime_tributario', required: false }))
      app.save(col)
    }

    // Inicializa o cliente Pastore
    try {
      const records = app.findRecordsByFilter(
        'cadastro_empresas',
        "documento_limpo = '92353630000168' || numero_documento ~ '92.353.630' || razao_social ~ 'PASTORE'",
        '',
        1,
        0,
      )
      if (records && records.length > 0) {
        const pastore = records[0]
        pastore.set('regime_tributario', 'Simples Nacional')
        if (!pastore.getString('enquadramento_tributario')) {
          pastore.set('enquadramento_tributario', 'Simples Nacional')
        }
        app.save(pastore)
      }
    } catch (e) {
      console.log('[0147] Aviso ao inicializar regime_tributario da Pastore:', e)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas')
    const f = col.fields.getByName('regime_tributario')
    if (f) {
      col.fields.remove(f)
      app.save(col)
    }
  },
)
