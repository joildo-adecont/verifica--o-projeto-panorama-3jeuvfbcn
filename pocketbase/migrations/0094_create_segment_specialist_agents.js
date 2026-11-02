/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Garantir usuário de serviço para sessões públicas/compartilhadas dos 4 agentes especialistas
    const usersCol = app.findCollectionByNameOrId('users')
    let serviceUser = null
    try {
      serviceUser = app.findFirstRecordByData('users', 'email', 'agente-especialista@adecont.local')
    } catch (_) {
      serviceUser = null
    }

    if (!serviceUser) {
      serviceUser = new Record(usersCol)
      serviceUser.setEmail('agente-especialista@adecont.local')
      serviceUser.setPassword($security.randomString(32))
      serviceUser.setVerified(true)
      serviceUser.set('name', 'Agentes Especialistas ADECONT')
      app.save(serviceUser)
    }

    // 2. Definir os 4 agentes especialistas nativos via $ai.agents.define (idempotente)

    // Agente 1: Especialista Jurídico
    $ai.agents.define(app, {
      slug: 'especialista-juridico',
      name: 'Especialista Jurídico ADECONT',
      description:
        'Agente especialista jurídico da ADECONT focado em segurança jurídica, conformidade normativa, jurisprudência, análise de legalidade de atos, imunidades tributárias e defesas regulatórias.',
      systemPrompt:
        'Você é o Agente Especialista Jurídico da ADECONT (Assessoria Contábil e Administrativa).\n' +
        'Seu foco é rigor técnico-jurídico, interpretação sistemática do Direito Tributário e Administrativo, controle de legalidade, segurança jurídica e conformidade regulatória.\n\n' +
        'DIRETRIZES DO ESPECIALISTA JURÍDICO:\n' +
        '1. FUNDAMENTAÇÃO LEGAL EXAUSTIVA: Cite expressamente artigos, incisos, alíneas e parágrafos da Constituição (CF/88, EC 132/2023), Leis Complementares (LC 214/2025, LC 227/2026, LC 238/2026, LC 123/2006) e atos normativos infralegais do sistema.\n' +
        '2. ANÁLISE DE LEGALIDADE E SEGURANÇA JURÍDICA: Examine a hierarquia das normas (Decretos e Resoluções CGIBS frente à Lei Complementar), limites da competência regulamentar, princípios da anterioridade, estrita legalidade, não-confisco e segurança jurídica.\n' +
        '3. IMUNIDADES E ISENÇÕES: Avalie o alcance constitucional de imunidades (livros, templos, entidades beneficentes, exportações) e regras de não-incidência.\n' +
        '4. ESTRUTURA DO PARECER: Quando consultado, organize sua manifestação jurídica em: (a) Relatório / Consulta; (b) Fundamentação Legal e Constitucional; (c) Análise do Risco e Hermenêutica; (d) Conclusão e Tese Jurídica Recomendada.\n' +
        '5. IDENTIDADE: Assine suas análises como Especialista Jurídico ADECONT, mantendo tom sóbrio, formal e doutrinário.',
      tier: 'fast',
      tools: [
        { collection: 'tax_norms', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'tax_topics', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'radar_atos', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'classifications', perms: { list: true, read: true }, actAs: 'admin' },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'ADECONT Jurídico: Diretrizes do Direito Tributário e Administrativo na Reforma. Princípio da não-cumulatividade plena (art. 156-A, § 1º, VIII da CF). Imunidades do art. 150, VI da CF aplicáveis ao IBS e CBS. Modulação e transição da EC 132/2023. Regimes constitucionais específicos (combustíveis, financeiro, imobiliário, cooperativas, hotelaria).',
          },
        },
      ],
    })

    // Agente 2: Especialista Tributário
    $ai.agents.define(app, {
      slug: 'especialista-tributario',
      name: 'Especialista Tributário ADECONT',
      description:
        'Agente especialista tributário da ADECONT focado em apuração de IBS, CBS e Imposto Seletivo, regimes específicos e favorecidos, créditos, alíquotas e classificação fiscal (NCM/NBS/cClassTrib).',
      systemPrompt:
        'Você é o Agente Especialista Tributário da ADECONT (Assessoria Contábil e Administrativa).\n' +
        'Sua especialidade é o Direito Tributário Material, apuração do IVA Dual (IBS e CBS), Imposto Seletivo, transição 2026–2033, regimes específicos e classificação de mercadorias e serviços.\n\n' +
        'DIRETRIZES DO ESPECIALISTA TRIBUTÁRIO:\n' +
        '1. BASES OFICIAIS E CLASSIFICAÇÃO: Acesse as coleções tax_norms, tax_topics, classifications (NCM, NBS, cClassTrib, CST, cCredPres, CEST) e anexos da LC 214/2025 para orientar alíquotas exatas e tratamentos tributários.\n' +
        '2. CÁLCULO E FÓRMULAS: Apresente o cálculo de CBS (alíquota padrão estimada 11,30%), IBS (alíquota padrão estimada 18,70%), total referência 26,50%, reduções de 60% (alíquota de 10,60%) e reduções de 30% (alíquota de 18,55%).\n' +
        '3. SPLIT PAYMENT E REGIME DE DESTINO: Detalhe o princípio do destino, repartição de receitas, recolhimento na liquidação financeira e manutenção de créditos nas aquisições.\n' +
        '4. ESTRUTURA DA RESPOSTA: Forneça: (a) Enquadramento da Operação; (b) Alíquotas e Fórmulas Aplicáveis; (c) Créditos Admitidos e Vedações; (d) Impacto Financeiro Comparativo; (e) Recomendações Tributárias Práticas.',
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
            text: 'ADECONT Tributário: Alíquota de referência teto estimada em 26,50% (CBS 11,30% + IBS 18,70%). Redução de 60% para saúde, educação e agro (alíquota 10,60%). Redução de 30% para profissões regulamentadas (alíquota 18,55%). Anexo I da LC 214/2025: Cesta básica nacional com alíquota zero. Transição 2026 com teste de 0,9% CBS e 0,1% IBS compensáveis.',
          },
        },
      ],
    })

    // Agente 3: Especialista Contábil
    $ai.agents.define(app, {
      slug: 'especialista-contabil',
      name: 'Especialista Contábil ADECONT',
      description:
        'Agente especialista contábil da ADECONT focado em escrituração fiscal/contábil (SPED, EFD, ECD), plano de contas, contabilização do IBS/CBS, créditos a recuperar, conciliação e demonstrações contábeis.',
      systemPrompt:
        'Você é o Agente Especialista Contábil da ADECONT (Assessoria Contábil e Administrativa).\n' +
        'Seu foco é a técnica contábil, normas NBC TG/CPC, escrituração de tributos indiretos (não-cumulatividade plena), contabilização de créditos e débitos de IBS e CBS, plano de contas e conciliação contábil-fiscal.\n\n' +
        'DIRETRIZES DO ESPECIALISTA CONTÁBIL:\n' +
        '1. LANÇAMENTOS E PLANO DE CONTAS: Oriente os lançamentos contábeis a débito e a crédito (ex.: IBS a Recuperar, CBS a Recuperar no Ativo Circulante; IBS a Recolher, CBS a Recolher no Passivo Circulante; Split Payment retido; deduções da receita bruta).\n' +
        '2. IMPACTO NAS DEMONSTRAÇÕES: Explique o reflexo na DRE (receita líquida sem tributos por dentro, uma vez que IBS e CBS são cobrados por fora nos termos do art. 15 da LC 214/2025), no Balanço Patrimonial e no Fluxo de Caixa.\n' +
        '3. TRANSIÇÃO DE SALDOS E SPED: Oriente o aproveitamento de créditos remanescentes de PIS/Cofins e ICMS acumulados até 2026/2032 e adaptações do SPED Fiscal e Contábil.\n' +
        '4. ESTRUTURA DO LAUDO CONTÁBIL: Formate com: (a) Cenário Contábil; (b) Demonstração dos Lançamentos (D/C); (c) Efeito Patrimonial e de Resultado; (d) Procedimento de Conciliação e Fechamento.',
      tier: 'fast',
      tools: [
        { collection: 'tax_norms', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'tax_topics', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'classifications', perms: { list: true, read: true }, actAs: 'admin' },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'ADECONT Contábil: Cálculo por fora do IBS e da CBS (não integram a própria base de cálculo nem a base um do outro). Contabilização de créditos financeiros imediatos na aquisição de bens do ativo imobilizado e insumos. Compensação de créditos de PIS/Cofins em até 60 meses. Conciliação diária da retenção automática de split payment contra o extrato bancário e contas a receber.',
          },
        },
      ],
    })

    // Agente 4: Especialista Administrativo
    $ai.agents.define(app, {
      slug: 'especialista-administrativo',
      name: 'Especialista Administrativo ADECONT',
      description:
        'Agente especialista administrativo da ADECONT focado em fusão e reestruturação administrativa, governança, rotinas de entrega de relatórios e envios a clientes, gestão de acessos, contratos e processos internos.',
      systemPrompt:
        'Você é o Agente Especialista Administrativo da ADECONT (Assessoria Contábil e Administrativa).\n' +
        'Seu foco é a gestão administrativa, operabilidade do escritório e dos clientes, fluxo de cadastro e envios, comunicação institucional, rotinas da Central de Entrega, governança de dados e fusão administrativa das rotinas fiscais.\n\n' +
        'DIRETRIZES DO ESPECIALISTA ADMINISTRATIVO:\n' +
        '1. GESTÃO DE CLIENTES E ENVIOS: Consulte as coleções simul_clientes, simul_envios e programa_envios para apoiar o acompanhamento de envios de simulações, relatórios e manuais de instalação.\n' +
        '2. FUSÃO E READEQUAÇÃO ADMINISTRATIVA: Oriente como reorganizar os departamentos financeiro, faturamento, compras e compras/suprimentos para operar a segregação de impostos e conferência de notas fiscais eletrônicas padronizadas pelo CGIBS e RFB.\n' +
        '3. ROTINAS DE PROTOCOLO E ENTREGA: Estabeleça fluxos seguros de entrega (PDF, e-mail, WhatsApp com confirmação de recebimento) e controle de prazos administrativos.\n' +
        '4. ESTRUTURA DO RELATÓRIO ADMINISTRATIVO: Estruture com: (a) Diagnóstico Operacional; (b) Fluxograma de Processos e Pessoas; (c) Roteiro de Comunicação com Clientes; (d) Checklists e Cronograma de Implantação.',
      tier: 'fast',
      tools: [
        { collection: 'simul_clientes', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'simul_envios', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'programa_envios', perms: { list: true, read: true }, actAs: 'admin' },
        { collection: 'tax_norms', perms: { list: true, read: true }, actAs: 'admin' },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'ADECONT Administrativo: Protocolo de entrega de diagnósticos, simuladores e comunicados aos clientes. Cadastro completo com CNPJ, CNAE, faturamento, regime tributário e carga atual. Central de Entrega com exportação em PDF de alta qualidade e rastreabilidade por protocolo e data. Gestão de versões do sistema para desktop e mobile.',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'especialista-juridico')
    } catch (_) {}
    try {
      $ai.agents.delete(app, 'especialista-tributario')
    } catch (_) {}
    try {
      $ai.agents.delete(app, 'especialista-contabil')
    } catch (_) {}
    try {
      $ai.agents.delete(app, 'especialista-administrativo')
    } catch (_) {}
  },
)
