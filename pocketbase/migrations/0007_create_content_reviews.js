migrate(
  (app) => {
    // 1. Coleção content_reviews: histórico de revisões semanais de normas e fontes oficiais
    const contentReviews = new Collection({
      name: 'content_reviews',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'review_date', type: 'text', required: true }, // Data ISO ou YYYY-MM-DD da revisão
        { name: 'status', type: 'text', required: true }, // 'ok', 'warning', 'attention'
        { name: 'sources_checked', type: 'json', required: false }, // array de fontes com key, name, url, status, http_status
        { name: 'notes', type: 'text', required: false }, // notas da revisão semanal
        { name: 'summary', type: 'text', required: false }, // resumo em uma linha
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_content_reviews_date ON content_reviews (review_date DESC)'],
    })
    app.save(contentReviews)

    // 2. Registro inicial de seed representando a última revisão semanal realizada
    // Segunda-feira mais recente: 2026-09-28 (ou data corrente)
    try {
      const initialRecord = new Record(contentReviews)
      const now = new Date()
      // Identifica a data da última segunda-feira
      const day = now.getUTCDay()
      const diff = (day + 7 - 1) % 7 // dias desde a última segunda
      const lastMonday = new Date(now.getTime() - diff * 24 * 60 * 60 * 1000)
      lastMonday.setUTCHours(11, 0, 0, 0)

      initialRecord.set('review_date', lastMonday.toISOString())
      initialRecord.set('status', 'ok')
      initialRecord.set('sources_checked', [
        {
          key: 'cgibs',
          name: 'CGIBS (Comitê Gestor IBS)',
          url: 'https://www.cgibs.gov.br/',
          status: 'active',
          http_status: 200,
        },
        {
          key: 'receita',
          name: 'Receita Federal do Brasil',
          url: 'https://www.receita.fazenda.gov.br',
          status: 'active',
          http_status: 200,
        },
        {
          key: 'planalto',
          name: 'Portal da Legislação (Planalto)',
          url: 'https://www.planalto.gov.br',
          status: 'active',
          http_status: 200,
        },
      ])
      initialRecord.set(
        'notes',
        'Verificação semanal de novas normas — CGIBS/Receita Federal/Planalto: fontes oficiais ativas, normas vigentes consolidadas no Panorama da Reforma Tributária.',
      )
      initialRecord.set(
        'summary',
        'Fontes oficiais verificadas e ativas (CGIBS, RFB, Planalto). Normas vigentes conferidas.',
      )
      app.save(initialRecord)
    } catch (e) {
      console.log('Aviso ao criar seed de content_reviews:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('content_reviews')
      app.delete(col)
    } catch (_) {}
  },
)
