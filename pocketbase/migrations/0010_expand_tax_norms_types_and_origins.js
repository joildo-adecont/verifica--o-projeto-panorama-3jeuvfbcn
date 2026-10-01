migrate(
  (app) => {
    const normsCol = app.findCollectionByNameOrId('tax_norms')

    // 1. Adicionar campos norm_type e origin se ainda não existirem
    if (!normsCol.fields.getByName('norm_type')) {
      normsCol.fields.add(
        new TextField({
          name: 'norm_type',
          required: false,
        }),
      )
    }

    if (!normsCol.fields.getByName('origin')) {
      normsCol.fields.add(
        new TextField({
          name: 'origin',
          required: false,
        }),
      )
    }

    app.save(normsCol)

    // 2. Mapeamento de dados atualizados para todas as normas conhecidas
    const normUpdates = [
      {
        code: 'EC 132/2023',
        title: 'Emenda Constitucional nº 132',
        norm_type: 'Emenda Constitucional',
        origin: 'Planalto',
        link_url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
        status_incidence: 'Cria a incidência',
        order: 1,
      },
      {
        code: 'LC 214/2025',
        title: 'Lei Complementar nº 214 (Norma Central)',
        norm_type: 'Lei Complementar',
        origin: 'Planalto',
        link_url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
        status_incidence: 'Regula a incidência',
        order: 2,
      },
      {
        code: 'LC 227/2026',
        title: 'Lei Complementar nº 227 (CGIBS e ITCMD)',
        norm_type: 'Lei Complementar',
        origin: 'Planalto',
        link_url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
        status_incidence: 'Administração do IBS',
        order: 3,
      },
      {
        code: 'Ato Conjunto RFB/CGIBS nº 1/2025',
        title: 'Obrigações acessórias 2026',
        norm_type: 'Ato Conjunto',
        origin: 'Receita Federal / CGIBS',
        link_url:
          'https://www.in.gov.br/web/dou/-/ato-conjunto-rfb/cgibs-n-1-de-22-de-dezembro-de-2025-677624586',
        status_incidence: 'Obrig. acessórias',
        order: 4,
      },
      {
        code: 'Decreto 12.955/2026',
        title: 'Regulamento da CBS',
        norm_type: 'Decreto',
        origin: 'Planalto',
        link_url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12955.htm',
        status_incidence: 'Regula a CBS',
        order: 5,
      },
      {
        code: 'Resolução CGIBS nº 5/2026',
        title: 'Regras e Governança Operacional CGIBS',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
        status_incidence: 'Operacional',
        order: 6,
      },
      {
        code: 'Resolução CGIBS 6/2026 (RIBS)',
        title: 'Regulamento do IBS',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
        status_incidence: 'Regula o IBS',
        order: 7,
      },
      {
        code: 'Portaria Conjunta MF/CGIBS nº 7/2026',
        title: 'Disposições comuns IBS/CBS',
        norm_type: 'Portaria Conjunta',
        origin: 'Ministério da Fazenda / CGIBS',
        link_url:
          'https://www.in.gov.br/web/dou/-/portaria-conjunta-mf/cgibs-n-7-de-30-de-abril-de-2026-702822417',
        status_incidence: 'Operacional',
        order: 8,
      },
      {
        code: 'Resolução CGIBS nº 1/2026 (e nº 2)',
        title: 'Instalação e Regimento do CGIBS',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
        status_incidence: 'Operacional',
        order: 9,
      },
      {
        code: 'Resolução CGIBS nº 8/2026',
        title: 'Estruturação Administrativa do CGIBS',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
        status_incidence: 'Operacional',
        order: 10,
      },
      {
        code: 'Resolução CGIBS nº 10/2026',
        title: 'Proposta Orçamentária 2026',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
        status_incidence: 'Operacional',
        order: 11,
      },
      {
        code: 'Resolução CGIBS nº 13/2026',
        title: 'Alteração do RIBS',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
        status_incidence: 'Operacional',
        order: 12,
      },
      {
        code: 'Resolução CGIBS nº 14/2026',
        title: 'Financiamento do CGIBS 2027',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
        status_incidence: 'Operacional',
        order: 13,
      },
      {
        code: 'Resolução CGIBS nº 16/2026',
        title: 'Prorrogação de obrigatoriedade',
        norm_type: 'Resolução',
        origin: 'CGIBS',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
        status_incidence: 'Operacional',
        order: 14,
      },
      {
        code: 'Ato Conjunto RFB/CGIBS 4/2026',
        title: 'Cronograma DFe e Conformidade',
        norm_type: 'Ato Conjunto',
        origin: 'Receita Federal / CGIBS',
        link_url:
          'https://www.in.gov.br/web/dou/-/ato-conjunto-rfb/cgibs-n-4-de-30-de-julho-de-2026-722697172',
        status_incidence: 'Obrig. acessórias',
        order: 15,
      },
      {
        code: 'Resoluções CGSN 190–192/2026',
        title: 'Simples Nacional na Reforma',
        norm_type: 'Resolução',
        origin: 'Comitê Gestor do Simples Nacional (CGSN)',
        link_url:
          'https://www.in.gov.br/web/dou/-/resolucao-cgsn-n-190-de-4-de-agosto-de-2026-724454118',
        status_incidence: 'ME/EPP',
        order: 16,
      },
    ]

    for (let i = 0; i < normUpdates.length; i++) {
      const item = normUpdates[i]
      let record = null

      try {
        record = app.findFirstRecordByData('tax_norms', 'code', item.code)
      } catch (_) {
        // Tentar por aproximação caso o code seja sutilmente diferente
        const prefix = item.code.split(' ')[0]
        try {
          const matches = app.findRecordsByFilter(
            'tax_norms',
            "code ~ '" + prefix + "' && order = " + item.order,
            'order',
            1,
            0,
          )
          if (matches && matches.length > 0) {
            record = matches[0]
          }
        } catch (_) {}
      }

      if (!record) {
        record = new Record(normsCol)
        record.set('code', item.code)
      }

      record.set('norm_type', item.norm_type)
      record.set('origin', item.origin)
      if (item.link_url) {
        record.set('link_url', item.link_url)
      }
      if (item.status_incidence) {
        record.set('status_incidence', item.status_incidence)
      }
      if (item.order) {
        record.set('order', item.order)
      }
      if (item.title) {
        record.set('title', item.title)
      }

      app.save(record)
    }
  },
  (app) => {
    const normsCol = app.findCollectionByNameOrId('tax_norms')
    const field1 = normsCol.fields.getByName('norm_type')
    if (field1) {
      normsCol.fields.removeByName('norm_type')
    }
    const field2 = normsCol.fields.getByName('origin')
    if (field2) {
      normsCol.fields.removeByName('origin')
    }
    app.save(normsCol)
  },
)
