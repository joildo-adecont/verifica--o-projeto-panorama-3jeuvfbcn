/**
 * MIGRATION 0154 — Suporte a edição em massa e campos de inativos
 * ==============================================================
 * 1. Adiciona campo `regime_tributario` em `cadastro_empresas_inativos` para
 *    garantir paridade total com o cadastro ativo durante edição em massa.
 * 2. Libera `updateRule = ''` em `cadastro_empresas_inativos` para permitir
 *    atualizações de campos cadastrais (regime, município, UF) diretamente
 *    pelo painel analítico ADECONT.
 */
migrate(
  (app) => {
    const colInativos = app.findCollectionByNameOrId('cadastro_empresas_inativos')

    // Adiciona regime_tributario se não existir
    if (!colInativos.fields.getByName('regime_tributario')) {
      colInativos.fields.add(new TextField({ name: 'regime_tributario', required: false }))
    }

    // Libera atualização direta no PocketBase para clientes inativos
    colInativos.updateRule = ''
    app.save(colInativos)
  },
  (app) => {
    try {
      const colInativos = app.findCollectionByNameOrId('cadastro_empresas_inativos')
      const campo = colInativos.fields.getByName('regime_tributario')
      if (campo) {
        colInativos.fields.remove(campo)
      }
      colInativos.updateRule = null
      app.save(colInativos)
    } catch (_) {}
  },
)
