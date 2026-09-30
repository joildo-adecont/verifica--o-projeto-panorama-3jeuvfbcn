migrate(
  (app) => {
    // Criação da coleção source_status para registrar o status de disponibilidade das fontes oficiais
    const sourceStatus = new Collection({
      name: 'source_status',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'source_key', type: 'text', required: true }, // ex: 'cgibs', 'receita', 'planalto'
        { name: 'name', type: 'text', required: true }, // ex: 'CGIBS', 'Receita Federal', 'Planalto'
        { name: 'url', type: 'text', required: true },
        { name: 'status', type: 'text', required: true }, // 'active', 'offline', 'warning'
        { name: 'http_status', type: 'number', required: false },
        { name: 'response_time_ms', type: 'number', required: false },
        { name: 'last_checked_at', type: 'text', required: false },
        { name: 'message', type: 'text', required: false },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_source_status_source_key ON source_status (source_key)',
        'CREATE INDEX idx_source_status_order ON source_status (order)',
      ],
    })
    app.save(sourceStatus)

    // Seed inicial das fontes oficiais
    const initialSources = [
      {
        source_key: 'cgibs',
        name: 'CGIBS (Comitê Gestor IBS)',
        url: 'https://www.gov.br/consext/pt-br',
        status: 'active',
        http_status: 200,
        response_time_ms: 120,
        last_checked_at: new Date().toISOString(),
        message: 'Fonte oficial ativa e acessível (Gov.br / CGIBS)',
        order: 1,
      },
      {
        source_key: 'receita',
        name: 'Receita Federal do Brasil',
        url: 'https://www.receita.fazenda.gov.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 150,
        last_checked_at: new Date().toISOString(),
        message: 'Portal da Receita Federal disponível',
        order: 2,
      },
      {
        source_key: 'planalto',
        name: 'Portal da Legislação (Planalto)',
        url: 'https://www.planalto.gov.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 95,
        last_checked_at: new Date().toISOString(),
        message: 'Portal do Planalto disponível para consulta de normas',
        order: 3,
      },
    ]

    for (let i = 0; i < initialSources.length; i++) {
      const src = initialSources[i]
      const rec = new Record(sourceStatus)
      rec.set('source_key', src.source_key)
      rec.set('name', src.name)
      rec.set('url', src.url)
      rec.set('status', src.status)
      rec.set('http_status', src.http_status)
      rec.set('response_time_ms', src.response_time_ms)
      rec.set('last_checked_at', src.last_checked_at)
      rec.set('message', src.message)
      rec.set('order', src.order)
      app.save(rec)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('source_status')
      app.delete(col)
    } catch (_) {}
  },
)
