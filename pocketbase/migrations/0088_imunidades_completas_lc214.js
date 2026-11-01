migrate(
  (app) => {
    const taxTopics = app.findCollectionByNameOrId('tax_topics')

    const novosItensImunidades = [
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Imunidade por Segmentos: Templos de Qualquer Culto e Organizações Religiosas',
        legal_basis:
          'CF/88 art. 150 VI b e art. 156-A §5º; LC 214/2025 arts. 6º e 145; RIBS art. 198',
        treatment: 'Imunidade Constitucional Subjetiva Total (0%)',
        description:
          'Imunidade de IBS e CBS sobre dízimos, ofertas, coletas, doações, celebrações e atividades essenciais de organizações religiosas, congregações, seminários e assistência social vinculada.',
        order: 116,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title:
          'Imunidade por Segmentos: Reciprocidade entre Entes Federativos (União, Estados, DF e Municípios)',
        legal_basis:
          'CF/88 art. 150 VI a e art. 156-A §5º; LC 214/2025 arts. 6º e 145; RIBS art. 198',
        treatment: 'Imunidade Recíproca Constitucional (0%)',
        description:
          'Vedação recíproca de cobrança de IBS e CBS entre entes federativos, autarquias e fundações públicas em suas finalidades essenciais e serviços públicos indelegáveis.',
        order: 117,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Imunidade por Segmentos: Partidos Políticos, Fundações e Fundos Partidários',
        legal_basis: 'CF/88 art. 150 VI c; LC 214/2025 arts. 6º e 145; Lei 9.096/1995',
        treatment: 'Imunidade Constitucional Absoluta (0%)',
        description:
          'Não incidência de IBS e CBS sobre patrimônio, receitas, doações eleitorais, recursos do Fundo Partidário e do FEFC destinados às atividades políticas e doutrinárias.',
        order: 118,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title:
          'Imunidade por Segmentos: Instituições de Educação e Assistência Social (com Condicionantes)',
        legal_basis:
          'CF/88 art. 150 VI c e art. 195 §7º; LC 214/2025 arts. 6º, 7º e 145; LC 187/2021',
        treatment: 'Imunidade Subjetiva Condicionada (CEBAS / CTN)',
        description:
          'Não incidência de IBS/CBS sobre mensalidades de instituições filantrópicas e serviços assistenciais gratuitos que atendam às condicionantes de não distribuição de lucros e escrituração regular.',
        order: 119,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Não Incidências Específicas: Ouro como Ativo Financeiro ou Instrumento Cambial',
        legal_basis: 'CF/88 art. 153 §5º; LC 214/2025 arts. 5º, 145 e 185; Lei 7.766/1989',
        treatment: 'Não Incidência Plena (Regime de Ativo Financeiro)',
        description:
          'Não incidência de IBS e CBS sobre operações com ouro quando definido como ativo financeiro de reserva ou instrumento cambial em transações custodiadas autorizadas pelo Banco Central.',
        order: 120,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title:
          'Não Incidências Específicas: Petróleo, Gás Natural e Energia Elétrica Destinados ao Exterior',
        legal_basis:
          'CF/88 art. 155 §2º X b e art. 156-A §5º I; LC 214/2025 arts. 8º e 145; RIBS Anexo IV',
        treatment: 'Desoneração Total no Destino com Manutenção de Crédito',
        description:
          'Não incidência de IBS e CBS sobre exportações de petróleo bruto, derivados, gás natural e eletricidade para o exterior, com aproveitamento e ressarcimento de créditos de exploração.',
        order: 121,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Alíquotas Zero: Medicamentos, Dispositivos Médicos e Fórmulas Enterais',
        legal_basis: 'LC 214/2025 arts. 143, 144 e Anexos VI e XII; RIBS arts. 219 e 220',
        treatment: 'Alíquota Zero Plena (100% Desoneração Saúde)',
        description:
          'Desoneração total sem IBS nem CBS para medicamentos essenciais, vacinas, oncologia, hemoderivados, dispositivos médicos do SUS e fórmulas de nutrição enteral e parenteral.',
        order: 122,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Alíquotas Zero: Dispositivos de Acessibilidade para Pessoas com Deficiência (PCD)',
        legal_basis: 'LC 214/2025 art. 145 e Anexo XIII; RIBS art. 221; Lei 13.146/2015',
        treatment: 'Alíquota Zero Plena (100% Desoneração PCD)',
        description:
          'Alíquota zero integral sobre fornecimento de cadeiras de rodas, próteses auditivas, implantes cocleares, barras de apoio e tecnologias assistivas para autonomia e acessibilidade.',
        order: 123,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title: 'Alíquotas Zero: Produtos Hortícolas, Frutas Frescas e Ovos in Natura',
        legal_basis: 'LC 214/2025 art. 144 e Anexo XV; RIBS art. 222',
        treatment: 'Alíquota Zero Plena (100% Desoneração Alimentar)',
        description:
          'Desoneração total em toda a cadeia para legumes, verduras, tubérculos, frutas frescas e ovos in natura relacionados no Anexo XV da LC 214/2025.',
        order: 124,
      },
      {
        section: 'assuntos_especiais',
        category: 'Imunidades por Produtos e Segmentos',
        title:
          'Tratamentos Específicos: Serviços Educacionais, de Saúde e Planos de Saúde (Prouni / Deduções)',
        legal_basis:
          'LC 214/2025 arts. 129, 130, 144, 212 a 221 e Anexos II, III; RIBS arts. 204–206',
        treatment: 'Redução de 60% e Alíquota Zero Prouni/SUS',
        description:
          'Alíquota reduzida em 60% com alíquota zero para bolsas integrais do Prouni e atendimento público do SUS, além de regime específico em planos com dedução de repasses médicos.',
        order: 125,
      },
    ]

    for (let i = 0; i < novosItensImunidades.length; i++) {
      const item = novosItensImunidades[i]
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
      app
        .db()
        .newQuery(
          'DELETE FROM tax_topics WHERE section = "assuntos_especiais" AND order >= 116 AND order <= 125',
        )
        .execute()
    } catch (_) {}
  },
)
