/// <reference path="../pb_data/types.d.ts" />
/**
 * 0157 — coleção `analises_exercicios_conferidos`
 *
 * Guarda os dados conferidos de cada exercício (Balanço/DRE lido dos PDFs
 * anexados em cliente_arquivos), por cliente (chave CNPJ ou COD{código}).
 * Usado pelo fluxo "Analisar Balanços Anexados" de /analises-empresariais.
 */
migrate(
  (app) => {
    const collection = new Collection({
      type: 'base',
      name: 'analises_exercicios_conferidos',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: null,
      fields: [
        { name: 'cliente_chave', type: 'text', required: true },
        { name: 'exercicio', type: 'text', required: true },
        { name: 'conferido', type: 'bool', required: false },
        { name: 'origem_arquivos', type: 'text', required: false },
        { name: 'data_base', type: 'text', required: false },
        { name: 'dados_json', type: 'text', required: false },
        { name: 'atualizado_em', type: 'text', required: false },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_analises_exercicios_chave ON analises_exercicios_conferidos (cliente_chave, exercicio)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const c = app.findCollectionByNameOrId('analises_exercicios_conferidos')
      app.delete(c)
    } catch (_) {
      // já não existe
    }
  },
)
