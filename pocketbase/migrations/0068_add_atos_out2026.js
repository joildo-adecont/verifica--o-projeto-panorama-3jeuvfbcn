migrate(
  (app) => {
    const normsCol = app.findCollectionByNameOrId('tax_norms')

    // Atos normativos incorporados em 28/10/2026 ao Panorama, com texto integral
    // conferido no DOU (Imprensa Nacional). O Planalto está inacessível a consulta
    // automatizada por WAF de IP estrangeiro; o DOU é a fonte de PUBLICAÇÃO oficial.
    const atos = [
      {
        code: 'LC 235/2026',
        title: 'Lei Complementar nº 235 (renúncias de receita e combustíveis)',
        norm_type: 'Lei Complementar',
        origin: 'Planalto',
        link_url:
          'https://www.in.gov.br/web/dou/-/lei-complementar-n-235-de-27-de-agosto-de-2026-728568253',
        dou_date: '28/08/2026',
        date: '27/08/2026',
        status_incidence: 'Regime específico',
        order: 18,
        summary:
          'Renúncias de receita em 2026 para mitigar o choque do mercado internacional de energia (Oriente Médio): redução de alíquotas federais sobre diesel, biodiesel, gasolina, etanol e querosene de aviação. Preserva a diferenciação competitiva do biocombustível (etanol a zero se a gasolina cair 30%+). Excepcionaliza benefícios de minerais críticos, fertilizantes e da Copa Feminina 2027. Altera a LC 214/2025 (arts. 82, § 11, e 174, § 12) e autoriza crédito fiscal a fertilizantes até 2031.',
      },
      {
        code: 'LC 237/2026',
        title: 'Lei Complementar nº 237 (exceções à LRF e datacenter)',
        norm_type: 'Lei Complementar',
        origin: 'Planalto',
        link_url:
          'https://www.in.gov.br/web/dou/-/lei-complementar-n-237-de-15-de-setembro-de-2026-731891987',
        dou_date: '15/09/2026',
        date: '15/09/2026',
        status_incidence: 'Regime específico',
        order: 19,
        summary:
          'Altera a LC 229/2026 para incluir nas exceções às regras de benefício tributário: o regime especial de tributação de serviços de datacenter, os programas federais de financiamento de apoio a pessoas com câncer e com deficiência e a desoneração de IRPJ/CSLL das sociedades resseguradoras locais. Altera a LRF para desobrigar Municípios com até 65.000 habitantes de comprovar pagamento de tributos para transferências voluntárias.',
      },
      {
        code: 'ATC RFB/CGIBS nº 9/2026',
        title: 'Ato Técnico Conjunto RFB/CGIBS nº 9 (trabalhos conjuntos e GTI)',
        norm_type: 'Ato Conjunto',
        origin: 'Receita Federal / CGIBS',
        link_url:
          'https://www.in.gov.br/web/dou/-/ato-tecnico-conjunto-rfb/cgibs-n-9-de-20-de-outubro-de-2026-740391670',
        dou_date: '26/10/2026',
        date: '20/10/2026',
        status_incidence: 'Obrig. acessórias',
        order: 20,
        summary:
          'Disciplina a organização e o funcionamento dos trabalhos de cooperação entre a Receita Federal (RFB) e a Diretoria Executiva do CGIBS (DIREX) para implementar a reforma do consumo. Institui Grupos de Trabalho Interinstitucionais (GTI) e as Coordenações Normativa e Operacional, com princípios de autonomia, compartilhamento de dados fiscais (LC 214, arts. 59 e 62) e portabilidade de sistemas. Vigência até 31/03/2027.',
      },
      {
        code: 'Portaria Conjunta MF/CGIBS nº 14/2026',
        title: 'Portaria Conjunta MF/CGIBS nº 14 (alíquotas dos combustíveis)',
        norm_type: 'Portaria Conjunta',
        origin: 'Ministério da Fazenda / CGIBS',
        link_url:
          'https://www.in.gov.br/web/dou/-/portaria-conjunta-mf/cgibs-n-14-de-2-de-outubro-de-2026-736295196',
        dou_date: '05/10/2026',
        date: '02/10/2026',
        status_incidence: 'Regime específico',
        order: 21,
        summary:
          'Aprova a metodologia de cálculo da carga tributária para fixação das alíquotas do IBS e da CBS sobre os combustíveis do regime específico (LC 214, art. 172; Regulamentos, art. 259). Alíquotas uniformes no território nacional, específicas por unidade de medida e diferenciadas por produto; aplicação à CBS a partir de 2027 e ao IBS a partir de 2029. Define carga direta (Cofins/PIS/Pasep e ICMS) e indireta (insumos, IPI, IOF/seguro, ISS).',
      },
    ]

    for (let i = 0; i < atos.length; i++) {
      const item = atos[i]
      let record = null
      try {
        record = app.findFirstRecordByData('tax_norms', 'code', item.code)
      } catch (_) {
        record = null
      }
      if (!record) {
        record = new Record(normsCol)
        record.set('code', item.code)
      }
      const campos = [
        'title',
        'summary',
        'date',
        'norm_type',
        'origin',
        'link_url',
        'dou_date',
        'status_incidence',
        'order',
      ]
      for (let j = 0; j < campos.length; j++) {
        const nome = campos[j]
        if (normsCol.fields.getByName(nome)) {
          record.set(nome, item[nome])
        }
      }
      app.save(record)
    }
  },
  (app) => {
    const codigos = [
      'LC 235/2026',
      'LC 237/2026',
      'ATC RFB/CGIBS nº 9/2026',
      'Portaria Conjunta MF/CGIBS nº 14/2026',
    ]
    for (let i = 0; i < codigos.length; i++) {
      try {
        app.delete(app.findFirstRecordByData('tax_norms', 'code', codigos[i]))
      } catch (_) {}
    }
  },
)
