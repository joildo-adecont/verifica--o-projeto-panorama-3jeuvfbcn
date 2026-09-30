migrate(
  (app) => {
    // 1. tax_norms (Arcabouço normativo: EC 132, LC 214, LC 227, etc.)
    const taxNorms = new Collection({
      name: 'tax_norms',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'code', type: 'text', required: true },
        { name: 'date', type: 'text', required: true },
        { name: 'dou_date', type: 'text', required: false },
        { name: 'title', type: 'text', required: true },
        { name: 'summary', type: 'text', required: true },
        { name: 'status_incidence', type: 'text', required: true }, // INCIDE, NÃO INCIDE, PARCIAL/REGIME ESPECÍFICO, ISENTO/IMUNE, OPERACIONAL, OBRIG. ACESSÓRIAS, ME/EPP
        { name: 'order', type: 'number', required: false },
        { name: 'link_url', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_tax_norms_order ON tax_norms (order)'],
    })
    app.save(taxNorms)

    // Seed tax_norms
    const normsSeed = [
      {
        code: 'EC 132/2023',
        dou_date: '21/12/2023',
        date: '20/12/2023',
        title: 'Emenda Constitucional nº 132',
        summary:
          'Art. 156-A (IBS), art. 195 V (CBS), art. 153 VIII (IS), art. 156-B (CGIBS), ADCT arts. 124–137 (transição)',
        status_incidence: 'Cria a incidência',
        order: 1,
        link_url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
      },
      {
        code: 'LC 214/2025',
        dou_date: '16/01/2025',
        date: '16/01/2025',
        title: 'Lei Complementar nº 214 (Norma Central)',
        summary:
          'Livro I: normas gerais (Títulos I–IV); Título V: regimes específicos; Livro II: Imposto Seletivo; Livro III: transição (arts. 343–433)',
        status_incidence: 'Regula a incidência',
        order: 2,
        link_url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        code: 'LC 227/2026',
        dou_date: '14/01/2026',
        date: '13/01/2026',
        title: 'Lei Complementar nº 227 (CGIBS e ITCMD)',
        summary:
          'Livro I: CGIBS, contencioso e distribuição; Livro II: normas gerais do ITCMD (arts. 163–193); altera LC 214',
        status_incidence: 'Administração do IBS',
        order: 3,
        link_url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
      },
      {
        code: 'Decreto 12.955/2026',
        dou_date: '29/04/2026',
        date: '29/04/2026',
        title: 'Regulamento da CBS',
        summary: 'Regulamento da CBS — 620 arts. e 5 anexos; coordenação RFB/PGFN/CGIBS (art. 451)',
        status_incidence: 'Regula a CBS',
        order: 4,
        link_url: '',
      },
      {
        code: 'Resolução CGIBS 6/2026 (RIBS)',
        dou_date: '30/04/2026',
        date: '30/04/2026',
        title: 'Regulamento do IBS',
        summary:
          'Regulamento do IBS — 617 arts., 3 livros e 5 anexos; cadastro, documento fiscal, local da operação, obrigações acessórias',
        status_incidence: 'Regula o IBS',
        order: 5,
        link_url: 'https://cgibs.gov.br/resolucoes',
      },
      {
        code: 'Resoluções CGIBS 1, 2/2026; 13–16/2026',
        dou_date: '02–09/2026',
        date: '02–09/2026',
        title: 'Organização do CGIBS',
        summary:
          'Organização do CGIBS; alteração do RIBS (art. 617); financiamento; documentos fiscais',
        status_incidence: 'Operacional',
        order: 6,
        link_url: '',
      },
      {
        code: 'Ato Conjunto RFB/CGIBS 4/2026',
        dou_date: '30/07/2026',
        date: '30/07/2026',
        title: 'Cronograma DFe e Conformidade',
        summary: 'Cronograma dos documentos fiscais eletrônicos; programa de conformidade 2026',
        status_incidence: 'Obrig. acessórias',
        order: 7,
        link_url: '',
      },
      {
        code: 'Resoluções CGSN 190–192/2026',
        dou_date: '2026',
        date: '2026',
        title: 'Simples Nacional na Reforma',
        summary:
          'Simples Nacional: IBS/CBS no DAS, sublimite R$ 3,6 mi (IBS), NFS-e nacional (01/11/2026)',
        status_incidence: 'ME/EPP',
        order: 8,
        link_url: '',
      },
    ]

    for (let i = 0; i < normsSeed.length; i++) {
      const item = normsSeed[i]
      const rec = new Record(taxNorms)
      rec.set('code', item.code)
      rec.set('dou_date', item.dou_date)
      rec.set('date', item.date)
      rec.set('title', item.title)
      rec.set('summary', item.summary)
      rec.set('status_incidence', item.status_incidence)
      rec.set('order', item.order)
      rec.set('link_url', item.link_url)
      app.save(rec)
    }

    // 2. tax_topics (Para armazenar pontos-chave, regimes específicos, cesta básica, etc)
    const taxTopics = new Collection({
      name: 'tax_topics',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'section', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'category', type: 'text', required: false },
        { name: 'treatment', type: 'text', required: false },
        { name: 'legal_basis', type: 'text', required: false },
        { name: 'description', type: 'text', required: true },
        { name: 'order', type: 'number', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tax_topics_section ON tax_topics (section)',
        'CREATE INDEX idx_tax_topics_order ON tax_topics (order)',
      ],
    })
    app.save(taxTopics)

    // Seed some highlight topics
    const highlightTopics = [
      {
        section: 'fato_gerador',
        title: 'Momento do Fato Gerador e Fornecimento',
        category: 'Regra Geral',
        treatment: 'INCIDE',
        legal_basis: 'Arts. 3º, 4º e 10 da LC 214/2025',
        description:
          'Incide sobre operações onerosas com bens materiais, imateriais (direitos) e serviços. No fornecimento, ou no pagamento para serviços de execução continuada.',
        order: 1,
      },
      {
        section: 'fato_gerador',
        title: 'Pagamento Antecipado',
        category: 'Fluxo Financeiro',
        treatment: 'INCIDE no pagamento',
        legal_basis: 'Art. 10, §4º da LC 214/2025',
        description:
          'Tributo devido na data de cada parcela paga antes do fornecimento. Distrato permite aproveitamento de crédito correspondente.',
        order: 2,
      },
      {
        section: 'fato_gerador',
        title: 'Split Payment (Recolhimento Inteligente)',
        category: 'Operacional',
        treatment: 'Retenção Automática',
        legal_basis: 'Arts. 31–35 da LC 214/2025',
        description:
          'Recolhimento automático vinculado ao documento fiscal; obrigatório em hipóteses listadas e ampliado progressivamente.',
        order: 3,
      },
      {
        section: 'regimes_especificos',
        title: 'Consórcios — 6 Pontos Essenciais',
        category: 'Consórcios',
        treatment: 'Regime Específico',
        legal_basis: 'Arts. 204–205 da LC 214/2025',
        description:
          'Administradora tributa apenas a taxa de administração (com dedução de intermediação). Contemplação não é fato gerador. Carta segue regras gerais.',
        order: 4,
      },
      {
        section: 'regimes_especificos',
        title: 'Bens Imóveis e Incorporação',
        category: 'Imobiliário',
        treatment: 'Regime Específico / Caixa',
        legal_basis: 'Arts. 252–259 e 485–488 da LC 214/2025',
        description:
          'Incorporação e loteamento operam pelo regime caixa (cada pagamento). Redução de 50% na alienação e 70% na locação; redutor social de R$ 100 mil.',
        order: 5,
      },
    ]

    for (let j = 0; j < highlightTopics.length; j++) {
      const ht = highlightTopics[j]
      const r = new Record(taxTopics)
      r.set('section', ht.section)
      r.set('title', ht.title)
      r.set('category', ht.category)
      r.set('treatment', ht.treatment)
      r.set('legal_basis', ht.legal_basis)
      r.set('description', ht.description)
      r.set('order', ht.order)
      app.save(r)
    }
  },
  (app) => {
    try {
      const t1 = app.findCollectionByNameOrId('tax_topics')
      app.delete(t1)
    } catch (_) {}
    try {
      const t2 = app.findCollectionByNameOrId('tax_norms')
      app.delete(t2)
    } catch (_) {}
  },
)
