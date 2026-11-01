/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Garantir usuário de serviço para sessões do agente tributário
    const usersCol = app.findCollectionByNameOrId('users')
    let serviceUser = null
    try {
      serviceUser = app.findFirstRecordByData('users', 'email', 'agente-tributario@adecont.local')
    } catch (_) {
      serviceUser = null
    }

    if (!serviceUser) {
      serviceUser = new Record(usersCol)
      serviceUser.setEmail('agente-tributario@adecont.local')
      serviceUser.setPassword($security.randomString(32))
      serviceUser.setVerified(true)
      serviceUser.set('name', 'Agente Diagnóstico Tributário ADECONT')
      app.save(serviceUser)
    }

    // 2. Definir o agente nativo Skip Cloud ($ai.agents.define)
    // Persona: analista tributário-jurídico-contábil da ADECONT ("Assessoria Contábil e Administrativa")
    // com capacidade interpretativa, reflexos tributários, pareceres resumidos, comparativos e orientações práticas.
    $ai.agents.define(app, {
      slug: 'diagnostico-tributario',
      name: 'Diagnóstico Tributário ADECONT',
      description:
        'Agente inteligente de tributos, do jurídico e contábil da ADECONT para análise interpretativa de textos legislativos, interligações tributárias, pontos de atenção, pareceres resumidos e debate com o CEO.',
      systemPrompt:
        'Você é o Agente Inteligente de Diagnóstico Tributário da ADECONT (tagline oficial: "Assessoria Contábil e Administrativa").\n' +
        'Sua função é atuar como analista sênior tributário, jurídico e contábil, com profunda capacidade interpretativa e foco executivo e administrativo.\n\n' +
        'DIRETRIZES FUNDAMENTAIS:\n' +
        '1. BASE DO CONHECIMENTO E FONTES: Você tem acesso de leitura às coleções nativas do sistema (tax_norms, tax_topics, classifications, radar_atos, radar_municipios, etc.). Sempre fundamente suas análises nos diplomas normativos reais vigentes e no processo de transição (EC 132/2023, LC 214/2025, LC 227/2026, LC 238/2026, decretos regulamentares da CBS como Dec. 12.955/2026, resoluções do CGIBS como Res. CGIBS 6/2026 RIBS, atos CGSN e atos do Radar Nacional). Cite expressamente a capitulação legal (artigos, parágrafos, incisos e anexos específicos).\n' +
        '2. ANÁLISE INTERPRETATIVA E INTERLIGAÇÕES: Analise os textos legislativos não de forma isolada, mas conectando suas interligações tributárias e reflexos práticos (IBS estadual/municipal, CBS federal, Imposto Seletivo, transição 2026–2033, split payment, cumulatividade vs. não-cumulatividade plena, crédito financeiro e impactos no Simples Nacional).\n' +
        '3. PONTOS DE ATENÇÃO E FUSÃO ADMINISTRATIVA: Destaque com clareza os pontos críticos de atenção, riscos fiscais, reflexos na contabilidade, impactos na governança corporativa e observações para a fusão administrativa e operacional das rotinas dos clientes da ADECONT.\n' +
        '4. PARECERES RESUMIDOS E EXECUTIVOS: Emita pareceres concisos, diretos e objetivos sobre os atos normativos solicitados, estruturando em: (a) Resumo da Matéria; (b) Base Legal e Capitulação; (c) Reflexos Tributários e Interligações; (d) Pontos de Atenção Contábil/Administrativa; (e) Parecer Conclusivo; e (f) Passo a Passo para Implementação.\n' +
        '5. DEBATE E DISCUSSÃO COM O CEO: Esteja preparado para dialogar em alto nível com o CEO da empresa/cliente. Apresente seu raciocínio de forma clara, abra pontos para discussão e rebate, acolha as ponderações do CEO e complete o raciocínio estratégico.\n' +
        '6. CÁLCULOS E ALÍQUOTAS: Forneça comparativos numéricos de alíquotas (ex.: alíquota de referência padrão de 26,50% da LC 214/2025, CBS de 11,30%, IBS de 18,70%, regimes favorecidos com redução de 60% resultando em 10,60%, e alíquota zero nos anexos da cesta básica nacional).\n' +
        '7. TOM E IDENTIDADE INSTITUCIONAL: Responda em tom profissional, seguro, analítico e construtivo. Mantenha a identidade visual e de autoridade da ADECONT em todas as manifestações.',
      tier: 'fast',
      tools: [
        { collection: 'tax_norms', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'tax_topics', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'classifications', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'radar_atos', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'radar_municipios', perms: { list: true, read: true }, actAs: 'admin' },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'ADECONT — Assessoria Contábil e Administrativa. Diretrizes do Diagnóstico Tributário: foco na EC 132/2023, LC 214/2025 (norma central do IBS, CBS e IS), LC 227/2026 (CGIBS e ITCMD), LC 238/2026 (Simples Nacional e MEI), Decreto 12.955/2026 (Regulamento da CBS) e Resolução CGIBS 6/2026 (Regulamento do IBS). Alíquota de referência teto: 26,50% (CBS 11,30% + IBS 18,70%). Transição: 2026 teste com CBS 0,9% e IBS 0,1%; 2027 vigência plena da CBS; 2029 a 2032 redução gradual de ICMS/ISS e aumento de IBS; 2033 sistema definitivo do IVA Dual.',
          },
        },
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Qual é a alíquota teto estimada do IVA Dual da Reforma Tributária?',
                answer:
                  'A alíquota de referência teto fixada pelo art. 349 da LC 214/2025 é de 26,50%, estimada conjuntamente pelo TCU e CGIBS em CBS de 11,30% e IBS de 18,70%.',
              },
              {
                question: 'Como funciona o regime de alíquota reduzida de 60% na LC 214/2025?',
                answer:
                  'Determinados setores essenciais (saúde, educação, dispositivos médicos, insumos agropecuários) têm redução de 60% nas alíquotas do IBS e da CBS, resultando em alíquota efetiva de 10,60% considerando a referência de 26,50%.',
              },
            ],
          },
        },
      ],
    })

    // 3. Criar a coleção persistente 'diagnostico_sessoes' para registrar o histórico de sessões
    let sessoesCol = null
    try {
      sessoesCol = app.findCollectionByNameOrId('diagnostico_sessoes')
    } catch (_) {
      sessoesCol = null
    }

    if (!sessoesCol) {
      sessoesCol = new Collection({
        name: 'diagnostico_sessoes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'titulo', type: 'text', required: true },
          { name: 'tema', type: 'text' },
          { name: 'ato_analisado', type: 'text' },
          { name: 'conversation_id', type: 'text' },
          {
            name: 'tipo_analise',
            type: 'select',
            values: ['geral', 'ato_normativo', 'interligacoes', 'debate_ceo'],
            maxSelect: 1,
          },
          { name: 'parecer_resumido', type: 'text' },
          { name: 'pontos_atencao', type: 'text' },
          { name: 'passo_a_passo', type: 'text' },
          { name: 'dados_tabela', type: 'json' },
          { name: 'relatorio_consolidado', type: 'text' },
          { name: 'autor_email', type: 'text' },
          { name: 'data_sessao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_diag_sessoes_data ON diagnostico_sessoes (created DESC)',
          'CREATE INDEX idx_diag_sessoes_tipo ON diagnostico_sessoes (tipo_analise)',
          'CREATE INDEX idx_diag_sessoes_conv ON diagnostico_sessoes (conversation_id)',
        ],
      })
      app.save(sessoesCol)
    }
  },
  (app) => {
    try {
      const sessoesCol = app.findCollectionByNameOrId('diagnostico_sessoes')
      app.delete(sessoesCol)
    } catch (_) {}

    try {
      $ai.agents.delete(app, 'diagnostico-tributario')
    } catch (_) {}
  },
)
