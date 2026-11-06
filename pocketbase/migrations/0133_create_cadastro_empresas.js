migrate(
  (app) => {
    const collection = new Collection({
      name: 'cadastro_empresas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'codigo', type: 'number', required: true, onlyInt: true },
        { name: 'tipo_documento', type: 'text' },
        { name: 'numero_documento', type: 'text' },
        { name: 'documento_limpo', type: 'text' },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'apelido', type: 'text' },
        { name: 'data_inscricao', type: 'text' },
        { name: 'inscricao_estadual', type: 'text' },
        { name: 'inscricao_suframa', type: 'text' },
        { name: 'pagina', type: 'number', onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cadastro_empresas_codigo ON cadastro_empresas (codigo)',
        'CREATE INDEX idx_cadastro_empresas_tipo_doc ON cadastro_empresas (tipo_documento)',
        'CREATE INDEX idx_cadastro_empresas_doc_limpo ON cadastro_empresas (documento_limpo)',
        'CREATE INDEX idx_cadastro_empresas_razao ON cadastro_empresas (razao_social)',
        'CREATE INDEX idx_cadastro_empresas_apelido ON cadastro_empresas (apelido)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cadastro_empresas')
      app.delete(col)
    } catch (_) {}
  },
)
