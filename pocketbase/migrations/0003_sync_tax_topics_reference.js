migrate(
  (app) => {
    const taxTopics = app.findCollectionByNameOrId('tax_topics')

    // Truncate / clean existing rows to recreate fully aligned with reference
    try {
      app.truncateCollection(taxTopics)
    } catch (_) {
      app.db().newQuery('DELETE FROM tax_topics').execute()
    }

    const allTopics = [
      // Seção 2: Fato Gerador (10 itens)
      {
        section: 'fato_gerador',
        category: 'Critério material',
        title: 'Critério material',
        legal_basis: 'Art. 4º',
        treatment: 'INCIDE',
        description: 'INCIDE sobre operações onerosas com bens e serviços',
        order: 1,
      },
      {
        section: 'fato_gerador',
        category: 'Conceito de fornecimento',
        title: 'Conceito de fornecimento',
        legal_basis: 'Art. 3º, I–II',
        treatment: 'Regra Geral',
        description:
          'Entrega/disponibilização de bem material; instituição/transferência de bem imaterial (inclusive direito); prestação de serviços',
        order: 2,
      },
      {
        section: 'fato_gerador',
        category: 'Momento do fato gerador',
        title: 'Momento do fato gerador',
        legal_basis: 'Art. 10, caput',
        treatment: 'Regra Geral',
        description: 'No fornecimento, ainda que execução continuada ou fracionada',
        order: 3,
      },
      {
        section: 'fato_gerador',
        category: 'Serviços',
        title: 'Serviços',
        legal_basis: 'Art. 10, §2º',
        treatment: 'Regra Geral',
        description: 'No pagamento (contrato com pagamento periódico) ou recebimento',
        order: 4,
      },
      {
        section: 'fato_gerador',
        category: 'Pagamento antecipado',
        title: 'Pagamento antecipado',
        legal_basis: 'Art. 10, §4º',
        treatment: 'Regra Geral',
        description: 'Tributo devido na data de cada parcela paga antes do fornecimento',
        order: 5,
      },
      {
        section: 'fato_gerador',
        category: 'Distrato',
        title: 'Distrato',
        legal_basis: 'Art. 10, §5º',
        treatment: 'Regra Geral',
        description:
          'Créditos de antecipação restituída podem ser apropriados se o fornecimento não ocorrer',
        order: 6,
      },
      {
        section: 'fato_gerador',
        category: 'Local da operação',
        title: 'Local da operação',
        legal_basis: 'Art. 11',
        treatment: 'Regra Geral',
        description: 'Destino do bem/serviço (tributação no consumo)',
        order: 7,
      },
      {
        section: 'fato_gerador',
        category: 'Split payment',
        title: 'Split payment',
        legal_basis: 'Arts. 31–35',
        treatment: 'Regra Geral',
        description:
          'Recolhimento automático vinculado ao documento fiscal; obrigatório em hipóteses listadas, opcional (ampliado pelo PLP 108) nas demais',
        order: 8,
      },
      {
        section: 'fato_gerador',
        category: 'Locação de imóvel',
        title: 'Locação de imóvel',
        legal_basis: 'Art. 254, III',
        treatment: 'Regra Geral',
        description: 'Fato gerador no pagamento (disp. objeto de crítica doutrinária)',
        order: 9,
      },
      {
        section: 'fato_gerador',
        category: 'Importação',
        title: 'Importação',
        legal_basis: 'Arts. 444–447',
        treatment: 'INCIDE',
        description: 'INCIDE na importação de bens e serviços, por quem promove a entrada',
        order: 10,
      },

      // Seção 3: Cesta Básica Nacional (8 itens alíquota zero)
      {
        section: 'cesta_basica',
        category: 'Cereais e grãos',
        title: 'Cereais e grãos',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Arroz, feijão, milho, trigo, aveia, quinoa',
        order: 11,
      },
      {
        section: 'cesta_basica',
        category: 'Carnes e ovos',
        title: 'Carnes e ovos',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Carne bovina, suína, aves, peixes, ovos',
        order: 12,
      },
      {
        section: 'cesta_basica',
        category: 'Laticínios',
        title: 'Laticínios',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Leite, queijos, manteiga',
        order: 13,
      },
      {
        section: 'cesta_basica',
        category: 'Pães e massas',
        title: 'Pães e massas',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Pão francês, macarrão, farinhas, biscoitos simples',
        order: 14,
      },
      {
        section: 'cesta_basica',
        category: 'Frutas, legumes, verduras',
        title: 'Frutas, legumes, verduras',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'In natura, refrigerados, congelados e secos',
        order: 15,
      },
      {
        section: 'cesta_basica',
        category: 'Óleos e gorduras',
        title: 'Óleos e gorduras',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Óleo vegetal, azeite, banha',
        order: 16,
      },
      {
        section: 'cesta_basica',
        category: 'Sal, açúcar, condimentos',
        title: 'Sal, açúcar, condimentos',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Sal, açúcar, café, chá, especiarias',
        order: 17,
      },
      {
        section: 'cesta_basica',
        category: 'Sementes e mudas',
        title: 'Sementes e mudas',
        legal_basis: 'Art. 149, LC 214/2025',
        treatment: 'ALÍQUOTA ZERO',
        description: 'Para cultivo doméstico dos alimentos acima',
        order: 18,
      },

      // Seção 3: Outros exemplos por tratamento (12 itens)
      {
        section: 'cesta_outros',
        category: 'Medicamentos',
        title: 'Medicamentos',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Medicamentos com redução de 60% da alíquota',
        order: 19,
      },
      {
        section: 'cesta_outros',
        category: 'Dispositivos médicos e acessibilidade',
        title: 'Dispositivos médicos e acessibilidade',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Dispositivos médicos e acessibilidade',
        order: 20,
      },
      {
        section: 'cesta_outros',
        category: 'Produtos agropecuários e aquícolas',
        title: 'Produtos agropecuários e aquícolas',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Produtos agropecuários e aquícolas',
        order: 21,
      },
      {
        section: 'cesta_outros',
        category: 'Insumos agropecuários',
        title: 'Insumos agropecuários',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Insumos agropecuários',
        order: 22,
      },
      {
        section: 'cesta_outros',
        category: 'Transporte público coletivo',
        title: 'Transporte público coletivo',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Transporte público coletivo',
        order: 23,
      },
      {
        section: 'cesta_outros',
        category: 'Educação, serviços médicos e saúde',
        title: 'Educação, serviços médicos e saúde',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Educação, serviços médicos e saúde',
        order: 24,
      },
      {
        section: 'cesta_outros',
        category: 'Bens e serviços de democratização',
        title: 'Bens e serviços de democratização (remanejamento fiscal)',
        legal_basis: 'Art. 148, I, LC 214',
        treatment: 'Redução 60%',
        description: 'Bens e serviços de democratização (remanejamento fiscal)',
        order: 25,
      },
      {
        section: 'cesta_outros',
        category: 'Profissionais de educação e saúde',
        title: 'Profissionais de educação e saúde em regime regular',
        legal_basis: 'Art. 148, §1º, LC 214',
        treatment: 'Crédito presumido',
        description: 'Profissionais de educação e saúde em regime regular',
        order: 26,
      },
      {
        section: 'cesta_outros',
        category: 'Dispositivos de acessibilidade PCD',
        title: 'Dispositivos de acessibilidade para PCD',
        legal_basis: 'Art. 151, II, LC 214',
        treatment: 'Cashback',
        description: 'Dispositivos de acessibilidade para PCD',
        order: 27,
      },
      {
        section: 'cesta_outros',
        category: 'Baixa renda',
        title: 'Medicamentos, transporte, gás de cozinha e energia elétrica (baixa renda)',
        legal_basis: 'Art. 151, LC 214',
        treatment: 'Cashback 100% CBS / 20% IBS',
        description: 'Medicamentos, transporte, gás de cozinha e energia elétrica (baixa renda)',
        order: 28,
      },
      {
        section: 'cesta_outros',
        category: 'Bens nocivos / IS',
        title: 'Cigarros, bebidas alcoólicas, bebidas açucaradas, bens nocivos',
        legal_basis: 'Livro II, LC 214; EC 132 art. 153 VIII',
        treatment: 'Imposto Seletivo (além de IBS/CBS)',
        description: 'Cigarros, bebidas alcoólicas, bebidas açucaradas, bens nocivos',
        order: 29,
      },
      {
        section: 'cesta_outros',
        category: 'Veículos',
        title: 'Veículos (moto e carro popular)',
        legal_basis: 'LC 214, Livro II',
        treatment: 'Redução IS (70%/50%)',
        description: 'Veículos (moto e carro popular)',
        order: 30,
      },

      // Seção 4: Imunidades, não incidências (9 itens)
      {
        section: 'imunidades',
        category: 'Exportação',
        title: 'Exportação de bens e serviços',
        legal_basis: 'Art. 8º, LC 214; CF art. 149, §2º I',
        treatment: 'IMUNE — com manutenção integral de créditos',
        description: 'Exportação de bens e serviços',
        order: 31,
      },
      {
        section: 'imunidades',
        category: 'INSS',
        title: 'Alienação de bem imóvel pelo INSS a beneficiário',
        legal_basis: 'LC 214 (rol de imunidades)',
        treatment: 'IMUNE',
        description: 'Alienação de bem imóvel pelo INSS a beneficiário',
        order: 32,
      },
      {
        section: 'imunidades',
        category: 'ZFM / ALC',
        title: 'Operações com a Zona Franca de Manaus e ALC',
        legal_basis: 'LC 214, arts. 419–427',
        treatment: 'Reduções específicas — crédito presumido e alíquotas reduzidas',
        description: 'Operações com a Zona Franca de Manaus e ALC',
        order: 33,
      },
      {
        section: 'imunidades',
        category: 'Societário',
        title: 'Alienações societárias (participações societárias)',
        legal_basis: 'Art. 5º, LC 214',
        treatment: 'NÃO INCIDE',
        description: 'Alienações societárias (participações societárias)',
        order: 34,
      },
      {
        section: 'imunidades',
        category: 'Inter-estabelecimentos',
        title: 'Operações de inter-estabelecimentos (mesma empresa)',
        legal_basis: 'Art. 5º, LC 214',
        treatment: 'NÃO INCIDE (salvo casos elencados)',
        description: 'Operações de inter-estabelecimentos (mesma empresa)',
        order: 35,
      },
      {
        section: 'imunidades',
        category: 'Financeiro puro',
        title: 'Operações financeiras puras (juros, câmbio, ações)',
        legal_basis: 'Art. 182 e ss., LC 214',
        treatment: 'NÃO INCIDE (serviços financeiros têm regime próprio)',
        description: 'Operações financeiras puras (juros, câmbio, ações)',
        order: 36,
      },
      {
        section: 'imunidades',
        category: 'Trabalhista',
        title: 'Folha de pagamento / trabalhistas',
        legal_basis: 'LC 214',
        treatment: 'NÃO INCIDE',
        description: 'Folha de pagamento / trabalhistas',
        order: 37,
      },
      {
        section: 'imunidades',
        category: 'Imobiliário',
        title: 'Locação e cessão de imóveis',
        legal_basis: 'Arts. 252–259, LC 214',
        treatment: 'Regime específico imobiliário',
        description: 'Locação e cessão de imóveis',
        order: 38,
      },
      {
        section: 'imunidades',
        category: 'Governamental',
        title: 'Operações com entes públicos (alíquota reduzida a zero nas compras governamentais)',
        legal_basis: 'RIBS, Res. CGIBS 6/2026',
        treatment: 'Redução a zero — regulamento do IBS',
        description:
          'Operações com entes públicos (alíquota reduzida a zero nas compras governamentais)',
        order: 39,
      },

      // Seção 6: Regimes Específicos (8 itens)
      {
        section: 'regimes_especificos',
        category: 'Consórcios ⭐',
        title: 'Consórcios ⭐',
        legal_basis: 'Arts. 204–205, LC 214',
        treatment: 'Regime Específico',
        description:
          'Administradora tributa só a taxa de administração (pode deduzir intermediação); aquisições com carta de crédito seguem normas gerais (imóvel → regime imobiliário); execução de garantia sem incidência na consolidação; créditos da taxa (art. 205); consorciados respondem proporcionalmente se o consórcio não optar pelo regime regular',
        order: 40,
      },
      {
        section: 'regimes_especificos',
        category: 'Bens imóveis',
        title: 'Bens imóveis',
        legal_basis: 'Arts. 252–259, 485–488, LC 214',
        treatment: 'Regime Específico / Caixa',
        description:
          'Alienação: FG no ato do contrato; incorporação/parcelamento: regime caixa (cada pagamento); redução de 50% na alienação, 70% na locação; redutor social R$ 100 mil por imóvel residencial novo; sem crédito na aquisição de unidade sob regime específico',
        order: 41,
      },
      {
        section: 'regimes_especificos',
        category: 'Serviços financeiros',
        title: 'Serviços financeiros',
        legal_basis: 'Arts. 182–214, LC 214',
        treatment: 'Fluxo de Caixa',
        description: 'Tributação por fluxo de caixa (recebimentos), com deduções permitidas',
        order: 42,
      },
      {
        section: 'regimes_especificos',
        category: 'Agropecuária',
        title: 'Agropecuária',
        legal_basis: 'LC 214, arts. 287 e ss.',
        treatment: 'Crédito Presumido',
        description: 'Créditos presumidos (compras) + créditos para quem compra do produtor',
        order: 43,
      },
      {
        section: 'regimes_especificos',
        category: 'Cooperativas',
        title: 'Cooperativas',
        legal_basis: 'LC 214',
        treatment: 'Regras Próprias',
        description: 'Regras próprias de creditamento',
        order: 44,
      },
      {
        section: 'regimes_especificos',
        category: 'Comércio eletrônico / plataformas',
        title: 'Comércio eletrônico / plataformas',
        legal_basis: 'LC 214 (responsabilidade de plataformas)',
        treatment: 'Solidariedade',
        description:
          'Plataforma é responsável solidária pelos débitos do fornecedor (inclusive estrangeiro)',
        order: 45,
      },
      {
        section: 'regimes_especificos',
        category: 'Simples Nacional',
        title: 'Simples Nacional',
        legal_basis: 'LC 214; Res. CGSN 190–192/2026',
        treatment: 'Dual (DAS/Regime Regular)',
        description:
          'IBS/CBS no DAS até R$ 3,6 mi (IBS) e R$ 4,8 mi (CBS); opção pelo regime regular em janelas (set/mar); NF obrigatória com destaque',
        order: 46,
      },
      {
        section: 'regimes_especificos',
        category: 'Sociedades de profissionais',
        title: 'Sociedades de profissionais',
        legal_basis: 'LC 214, arts. 149-A e ss.',
        treatment: 'Redução 50%',
        description: 'Alíquota reduzida de 50% / crédito presumido',
        order: 47,
      },
    ]

    for (let i = 0; i < allTopics.length; i++) {
      const item = allTopics[i]
      const rec = new Record(taxTopics)
      rec.set('section', item.section)
      rec.set('title', item.title)
      rec.set('category', item.category)
      rec.set('treatment', item.treatment)
      rec.set('legal_basis', item.legal_basis)
      rec.set('description', item.description)
      rec.set('order', item.order)
      app.save(rec)
    }
  },
  (app) => {
    try {
      const taxTopics = app.findCollectionByNameOrId('tax_topics')
      app.truncateCollection(taxTopics)
    } catch (_) {}
  },
)
