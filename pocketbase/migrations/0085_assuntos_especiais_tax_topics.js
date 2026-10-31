migrate(
  (app) => {
    const taxTopics = app.findCollectionByNameOrId('tax_topics')

    const novosAssuntos = [
      {
        section: 'assuntos_especiais',
        category: 'Imposto do Pecado',
        title: 'Imposto do Pecado: Cigarros e Derivados do Tabaco',
        legal_basis: 'CF/88 art. 153 VIII; LC 214/2025 arts. 392 a 410',
        treatment: 'Imposto Seletivo Monofásico sem crédito',
        description:
          'Tributação monofásica extrafiscal sobre cigarros, charutos e cigarrilhas com alíquotas ad rem e ad valorem majoradas sem creditamento na cadeia comercial.',
        order: 101,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imposto do Pecado',
        title: 'Imposto do Pecado: Bebidas Alcoólicas e Açucaradas',
        legal_basis: 'LC 214/2025 arts. 411 a 424; Dec. 12.955/2026',
        treatment: 'IS Híbrido graduado por teor alcoólico e açúcar',
        description:
          'Alíquotas graduadas proporcionalmente ao teor de álcool e teor de açúcar adicionado sobre cervejas, destilados, vinhos, refrigerantes e isotônicos.',
        order: 102,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imposto do Pecado',
        title: 'Imposto do Pecado: Veículos Automotores e Aeronaves',
        legal_basis: 'LC 214/2025 arts. 420 a 424; EC 132 art. 153 §6º',
        treatment: 'IS progressivo por pegada de carbono',
        description:
          'Incidência seletiva sobre fabricação/importação de veículos conforme emissão de CO2 e pegada ecológica, com redutores de até 70% para carros e motos populares.',
        order: 103,
      },
      {
        section: 'assuntos_especiais',
        category: 'Comitê Gestor',
        title: 'Comitê Gestor do IBS (CGIBS): Alíquota de Referência e Projeções',
        legal_basis: 'CF art. 156-B; LC 227/2026; LC 214 art. 349; Res. CGIBS 14/2026',
        treatment: 'Alíquota Referencial e Distribuição Federativa',
        description:
          'Governança do IBS, cálculo da alíquota de referência conjunta estimada em 26,5% a 30,00%, alíquota de teste a 0,1% em 2026/2027 e resoluções normativas 1 a 16.',
        order: 104,
      },
      {
        section: 'assuntos_especiais',
        category: 'Simples Nacional',
        title: 'Simples Nacional na Reforma: Opção Híbrida e Manutenção do DAS',
        legal_basis: 'CF art. 146 III d; LC 123/2006; LC 214 arts. 425 a 433; Res. CGSN 190–192',
        treatment: 'Dual (DAS Simplificado ou Recolhimento Segregado IBS/CBS)',
        description:
          'Opção para micro e pequenas empresas recolherem IBS/CBS unificado no DAS ou segregado no regime regular com transferência integral de créditos a compradores B2B.',
        order: 105,
      },
      {
        section: 'assuntos_especiais',
        category: 'ME e EPP',
        title: 'Microempresa (ME) e EPP: Sublimite R$ 3,6 mi e LC 238/2026',
        legal_basis: 'LC 123/2006; LC 238/2026; LC 214 art. 427',
        treatment: 'Sublimite IBS e Novos Tetos MEI',
        description:
          'Sublimite de R$ 3,6 milhões para IBS com apuração não-cumulativa; novo teto MEI de até R$ 140.000,00 pela LC 238/2026 e 2 empregados.',
        order: 106,
      },
      {
        section: 'assuntos_especiais',
        category: 'Regimes Societários',
        title: 'Lucro Presumido e Lucro Real: Transição CBS/IBS e Fim do Cumulativo',
        legal_basis: 'EC 132 arts. 124–130 ADCT; LC 214 Livro III; Dec. 12.955/2026',
        treatment: 'Não-cumulatividade plena com crédito financeiro',
        description:
          'Fim do PIS/Cofins cumulativo de 3,65% para prestadores no Lucro Presumido e migração para regime não-cumulativo pleno com direito a crédito amplo de insumos.',
        order: 107,
      },
      {
        section: 'assuntos_especiais',
        category: 'Entidades Associativas',
        title: 'Entidades Associativas e Sem Fins Lucrativos: Imunidade Art. 150 VI CF',
        legal_basis: 'CF art. 150 VI c; LC 214 arts. 6º e 7º; RIBS art. 198',
        treatment: 'Imunidade Constitucional Subjetiva',
        description:
          'Não incidência ampla de IBS e CBS sobre receitas estatutárias, doações, termos de fomento e mensalidades de associações civis sem fins lucrativos.',
        order: 108,
      },
      {
        section: 'assuntos_especiais',
        category: 'Sindicatos',
        title: 'Sindicatos e Centrais: Imunidade das Contribuições e Atividades',
        legal_basis: 'CF art. 150 VI c e art. 156-A §5º; LC 214 art. 6º',
        treatment: 'Imunidade Constitucional Total',
        description:
          'Imunidade de impostos e IBS/CBS sobre arrecadação assistencial, confederativa e mensalidades sindicais vinculadas às finalidades dos trabalhadores.',
        order: 109,
      },
      {
        section: 'assuntos_especiais',
        category: 'Regras Especiais',
        title: 'Regras Especiais: Combustíveis e Lubrificantes Monofásicos',
        legal_basis: 'CF art. 155 §4º; LC 214 arts. 172 a 184; LC 235/2026',
        treatment: 'Monofásico Ad Rem Uniforme Nacional',
        description:
          'Incidência única concentrada no produtor/importador com alíquotas ad rem fixas em reais por litro/kg para diesel, gasolina, etanol e GLP sem crédito.',
        order: 110,
      },
      {
        section: 'assuntos_especiais',
        category: 'Regras Especiais',
        title: 'Regras Especiais: Serviços Financeiros, Seguros e Split Payment',
        legal_basis: 'LC 214 arts. 185 a 221; Res. CGIBS 6/2026 Livro II',
        treatment: 'Tributação sobre Spread / Margem Operacional',
        description:
          'Apuração com base na margem financeira agregada deduzida dos custos de captação, com split payment eletrônico inteligente em arranjos de pagamento.',
        order: 111,
      },
      {
        section: 'assuntos_especiais',
        category: 'Regras Especiais',
        title: 'Regras Especiais: Zona Franca de Manaus (ZFM) e Áreas de Livre Comércio',
        legal_basis: 'CF art. 92-B ADCT; LC 214 arts. 434 a 453; RIBS Anexo V',
        treatment: 'Crédito Presumido Diferencial de até 100%',
        description:
          'Garantia do diferencial competitivo da ZFM até 2073 com créditos presumidos integrais nas saídas e desoneração total de insumos industriais.',
        order: 112,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Imunidade por Produtos: Cesta Básica Nacional (Alíquota Zero Plena)',
        legal_basis: 'CF art. 156-A §5º II; LC 214 art. 125 Anexo I',
        treatment: 'Alíquota Zero Plena (100% Desoneração)',
        description:
          'Desoneração total sem incidência de IBS e CBS em toda a cadeia para arroz, feijão, carnes, leite, café, pão comum e farinhas essenciais.',
        order: 113,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Imunidade por Produtos: Livros, Jornais, Periódicos e Papel de Imprensa',
        legal_basis: 'CF art. 150 VI d; LC 214 arts. 6º a 8º; STF Súmula Vinc. 57',
        treatment: 'Imunidade Objetiva Cultural Absoluta',
        description:
          'Não incidência de IBS e CBS sobre livros impressos e digitais (e-books), periódicos informativos e papel destinado a sua circulação.',
        order: 114,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Imunidade por Segmentos: Exportações com Devolução Rápida de Crédito',
        legal_basis: 'CF art. 156-A §5º I; LC 214 art. 8º; RIBS arts. 195–197',
        treatment: 'Desoneração Plena no Destino + Restituição Acelerada',
        description:
          'Desoneração integral na saída ao exterior de bens e serviços com ressarcimento compulsório de créditos da cadeia produtiva em até 60 dias.',
        order: 115,
      },
    ]

    for (let i = 0; i < novosAssuntos.length; i++) {
      const item = novosAssuntos[i]
      let rec
      try {
        rec = app.findFirstRecordByFilter(
          'tax_topics',
          `section = "assuntos_especiais" && title = "${item.title}"`,
        )
      } catch (_) {
        rec = new Record(taxTopics)
      }

      rec.set('section', item.section)
      rec.set('category', item.category)
      rec.set('title', item.title)
      rec.set('legal_basis', item.legal_basis)
      rec.set('treatment', item.treatment)
      rec.set('description', item.description)
      rec.set('order', item.order)
      app.save(rec)
    }
  },
  (app) => {
    try {
      app.db().newQuery('DELETE FROM tax_topics WHERE section = "assuntos_especiais"').execute()
    } catch (_) {}
  },
)
