migrate(
  (app) => {
    const taxNorms = app.findCollectionByNameOrId('tax_norms')

    // Mapeamento das normas com links diretos oficiais do CGIBS
    // 1. Resolução CGIBS nº 1/2026 (23/02/2026): https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf
    // 2. Resolução CGIBS nº 5/2026 (30/04/2026): https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf
    // 3. Resolução CGIBS nº 6/2026 (30/04/2026) — Regulamento do IBS: https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf
    // 4. Resolução CGIBS nº 8/2026 (26/05/2026): https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf
    // 5. Resolução CGIBS nº 10/2026 (29/06/2026) — Proposta Orçamentária 2026: https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf
    // 6. Resolução CGIBS nº 13/2026 (22/07/2026): https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf
    // 7. Resolução CGIBS nº 14/2026 (29/07/2026) — Proposta Percentual IBS 2027: https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf
    // 8. Resolução CGIBS nº 16/2026 (29/07/2026): https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf

    // Atualizar Resolução CGIBS 6/2026 (RIBS)
    try {
      const rec6 = app.findFirstRecordByData('tax_norms', 'code', 'Resolução CGIBS 6/2026 (RIBS)')
      rec6.set(
        'link_url',
        'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      )
      app.save(rec6)
    } catch (_) {}

    // Atualizar Resolução CGIBS nº 13/2026
    try {
      const rec13 = app.findFirstRecordByData('tax_norms', 'code', 'Resolução CGIBS nº 13/2026')
      rec13.set(
        'link_url',
        'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
      )
      rec13.set('date', '22/07/2026')
      app.save(rec13)
    } catch (_) {}

    // Atualizar Resolução CGIBS nº 14/2026
    try {
      const rec14 = app.findFirstRecordByData('tax_norms', 'code', 'Resolução CGIBS nº 14/2026')
      rec14.set(
        'link_url',
        'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
      )
      rec14.set('date', '29/07/2026')
      app.save(rec14)
    } catch (_) {}

    // Atualizar Resolução CGIBS nº 16/2026
    try {
      const rec16 = app.findFirstRecordByData('tax_norms', 'code', 'Resolução CGIBS nº 16/2026')
      rec16.set(
        'link_url',
        'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
      )
      rec16.set('date', '29/07/2026')
      app.save(rec16)
    } catch (_) {}

    // Atualizar Resoluções CGIBS 1 e 2/2026 -> detalhar link direto para Resolução nº 1/2026 (Instalação e Governança)
    try {
      const rec1 = app.findFirstRecordByData('tax_norms', 'code', 'Resoluções CGIBS 1 e 2/2026')
      rec1.set('code', 'Resolução CGIBS nº 1/2026 (e nº 2)')
      rec1.set('date', '23/02/2026')
      rec1.set('dou_date', '02/2026')
      rec1.set(
        'link_url',
        'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
      )
      app.save(rec1)
    } catch (_) {}

    // Adicionar também registros diretos para Resoluções nº 5, 8 e 10 de 2026 se não existirem
    const additionalNorms = [
      {
        code: 'Resolução CGIBS nº 5/2026',
        title: 'Regras e Governança Operacional CGIBS',
        date: '30/04/2026',
        dou_date: '30/04/2026',
        summary: 'Aprova diretrizes complementares de governança e operacionalização do CGIBS',
        status_incidence: 'Operacional',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
        order: 5.5,
      },
      {
        code: 'Resolução CGIBS nº 8/2026',
        title: 'Estruturação Administrativa do CGIBS',
        date: '26/05/2026',
        dou_date: '26/05/2026',
        summary:
          'Dispõe sobre a estruturação administrativa e funcionamento dos órgãos do Comitê Gestor',
        status_incidence: 'Operacional',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
        order: 8.5,
      },
      {
        code: 'Resolução CGIBS nº 10/2026',
        title: 'Proposta Orçamentária 2026',
        date: '29/06/2026',
        dou_date: '01/07/2026',
        summary: 'Aprova a proposta orçamentária do Comitê Gestor do IBS para o exercício de 2026',
        status_incidence: 'Operacional',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
        order: 8.8,
      },
    ]

    for (let i = 0; i < additionalNorms.length; i++) {
      const item = additionalNorms[i]
      let record
      try {
        record = app.findFirstRecordByData('tax_norms', 'code', item.code)
      } catch (_) {
        record = new Record(taxNorms)
      }
      record.set('code', item.code)
      record.set('title', item.title)
      record.set('date', item.date)
      record.set('dou_date', item.dou_date)
      record.set('summary', item.summary)
      record.set('status_incidence', item.status_incidence)
      record.set('link_url', item.link_url)
      record.set('order', item.order)
      app.save(record)
    }

    // Normalizar ordens inteiras sequenciais para ordenação limpa
    // 1: EC 132/2023
    // 2: LC 214/2025
    // 3: LC 227/2026
    // 4: Ato Conjunto RFB/CGIBS nº 1/2025
    // 5: Decreto 12.955/2026
    // 6: Resolução CGIBS nº 5/2026
    // 7: Resolução CGIBS 6/2026 (RIBS)
    // 8: Portaria Conjunta MF/CGIBS nº 7/2026
    // 9: Resolução CGIBS nº 1/2026 (e nº 2)
    // 10: Resolução CGIBS nº 8/2026
    // 11: Resolução CGIBS nº 10/2026
    // 12: Resolução CGIBS nº 13/2026
    // 13: Resolução CGIBS nº 14/2026
    // 14: Resolução CGIBS nº 16/2026
    // 15: Ato Conjunto RFB/CGIBS 4/2026
    // 16: Resoluções CGSN 190–192/2026
    const cleanOrders = [
      { code: 'EC 132/2023', order: 1 },
      { code: 'LC 214/2025', order: 2 },
      { code: 'LC 227/2026', order: 3 },
      { code: 'Ato Conjunto RFB/CGIBS nº 1/2025', order: 4 },
      { code: 'Decreto 12.955/2026', order: 5 },
      { code: 'Resolução CGIBS nº 5/2026', order: 6 },
      { code: 'Resolução CGIBS 6/2026 (RIBS)', order: 7 },
      { code: 'Portaria Conjunta MF/CGIBS nº 7/2026', order: 8 },
      { code: 'Resolução CGIBS nº 1/2026 (e nº 2)', order: 9 },
      { code: 'Resolução CGIBS nº 8/2026', order: 10 },
      { code: 'Resolução CGIBS nº 10/2026', order: 11 },
      { code: 'Resolução CGIBS nº 13/2026', order: 12 },
      { code: 'Resolução CGIBS nº 14/2026', order: 13 },
      { code: 'Resolução CGIBS nº 16/2026', order: 14 },
      { code: 'Ato Conjunto RFB/CGIBS 4/2026', order: 15 },
      { code: 'Resoluções CGSN 190–192/2026', order: 16 },
    ]

    for (let o = 0; o < cleanOrders.length; o++) {
      const ord = cleanOrders[o]
      try {
        const rec = app.findFirstRecordByData('tax_norms', 'code', ord.code)
        rec.set('order', ord.order)
        app.save(rec)
      } catch (_) {}
    }
  },
  (app) => {
    // Reverter normas adicionadas
    try {
      const added = [
        'Resolução CGIBS nº 5/2026',
        'Resolução CGIBS nº 8/2026',
        'Resolução CGIBS nº 10/2026',
      ]
      for (let i = 0; i < added.length; i++) {
        try {
          const rec = app.findFirstRecordByData('tax_norms', 'code', added[i])
          app.delete(rec)
        } catch (_) {}
      }
    } catch (_) {}
  },
)
