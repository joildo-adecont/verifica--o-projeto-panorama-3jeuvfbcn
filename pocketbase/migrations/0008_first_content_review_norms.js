migrate(
  (app) => {
    const taxNorms = app.findCollectionByNameOrId('tax_norms')

    // 1. Atualizar registro existente da Resolução CGIBS 6/2026 (RIBS) com o link oficial do PDF
    try {
      const ribsRecord = app.findFirstRecordByData(
        'tax_norms',
        'code',
        'Resolução CGIBS 6/2026 (RIBS)',
      )
      ribsRecord.set(
        'link_url',
        'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      )
      app.save(ribsRecord)
    } catch (e) {
      console.log('Aviso ao atualizar Resolução CGIBS 6/2026:', e)
    }

    // 2. Atualizar o registro agrupado 'Resoluções CGIBS 1, 2/2026; 13–16/2026' para refletir normas remanescentes (Resoluções 1 e 2/2026)
    try {
      const groupedRecord = app.findFirstRecordByData(
        'tax_norms',
        'code',
        'Resoluções CGIBS 1, 2/2026; 13–16/2026',
      )
      groupedRecord.set('code', 'Resoluções CGIBS 1 e 2/2026')
      groupedRecord.set('title', 'Instalação e Regimento do CGIBS')
      groupedRecord.set('date', '02/2026')
      groupedRecord.set('dou_date', '02/2026')
      groupedRecord.set(
        'summary',
        'Instalação, regimento interno e estrutura administrativa de governança do CGIBS (normas complementadas pelas Resoluções 13 a 16/2026 individualizadas)',
      )
      groupedRecord.set('status_incidence', 'Operacional')
      groupedRecord.set('link_url', 'https://www.cgibs.gov.br/resolucoes')
      groupedRecord.set('order', 6)
      app.save(groupedRecord)
    } catch (e) {
      console.log('Aviso ao atualizar registro agrupado de resoluções:', e)
    }

    // 3. Atualizar ou inserir novas normas individuais solicitadas
    // Normas a adicionar com suas devidas ordenações e campos
    const newNorms = [
      {
        code: 'Ato Conjunto RFB/CGIBS nº 1/2025',
        title: 'Obrigações acessórias 2026',
        date: '22/12/2025',
        dou_date: '23/12/2025',
        summary:
          'Disciplina obrigações acessórias do IBS/CBS em 2026; apuração meramente informativa, sem recolhimento nem sanções se cumpridas as obrigações; campos IBS/CBS em NF-e, NFC-e, CT-e, NFS-e; institui a DeRE',
        status_incidence: 'Obrig. acessórias',
        link_url:
          'https://www.in.gov.br/web/dou/-/ato-conjunto-rfb/cgibs-n-1-de-22-de-dezembro-de-2025-677624586',
        order: 4,
      },
      {
        code: 'Portaria Conjunta MF/CGIBS nº 7/2026',
        title: 'Disposições comuns IBS/CBS',
        date: '30/04/2026',
        dou_date: '30/04/2026',
        summary:
          'Reconhece expressamente como disposições comuns o Livro I do Decreto 12.955/2026 (RCBS) e da Resolução CGIBS 6/2026 (RIBS); base da contagem do prazo do art. 3º do Ato Conjunto 1/2025 → marco 01/08/2026',
        status_incidence: 'Operacional',
        link_url: '',
        order: 7,
      },
      {
        code: 'Resolução CGIBS nº 13/2026',
        title: 'Alteração do RIBS',
        date: '22/07/2026',
        dou_date: '22/07/2026',
        summary: 'Altera o art. 617 do Regulamento do IBS (Resolução CGIBS 6/2026)',
        status_incidence: 'Operacional',
        link_url: 'https://www.cgibs.gov.br/resolucoes',
        order: 9,
      },
      {
        code: 'Resolução CGIBS nº 14/2026',
        title: 'Financiamento do CGIBS 2027',
        date: '29/07/2026',
        dou_date: '31/07/2026',
        summary:
          'Proposta de destinação de até 50% da arrecadação do IBS ao financiamento do CGIBS em 2027; nota técnica estima alíquota de referência conjunta de 27,91% (IBS ≈ 18,70%; fator 1,0532 sobre a estimativa inicial de 26,50%/17,70%) — referência técnica orçamentária, NÃO alíquota definitiva',
        status_incidence: 'Operacional',
        link_url:
          'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
        order: 10,
      },
      {
        code: 'Resolução CGIBS nº 16/2026',
        title: 'Prorrogação de obrigatoriedade',
        date: '2026',
        dou_date: '2026',
        summary:
          'Prorroga a obrigatoriedade do preenchimento dos campos relativos ao IBS e à CBS nos documentos fiscais eletrônicos',
        status_incidence: 'Operacional',
        link_url: 'https://www.cgibs.gov.br/resolucoes',
        order: 11,
      },
    ]

    for (let i = 0; i < newNorms.length; i++) {
      const item = newNorms[i]
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

    // Reorganizar ordens dos outros registros existentes para manter listagem coesa
    // EC 132 (1), LC 214 (2), LC 227 (3), Ato Conjunto 1/2025 (4), Dec 12.955 (5), Res CGIBS 6 (6), Portaria MF/CGIBS 7 (7), Res CGIBS 1 e 2 (8), Res CGIBS 13 (9), Res CGIBS 14 (10), Res CGIBS 16 (11), Ato Conjunto 4/2026 (12), Res CGSN (13)
    const orderingUpdates = [
      { code: 'EC 132/2023', order: 1 },
      { code: 'LC 214/2025', order: 2 },
      { code: 'LC 227/2026', order: 3 },
      { code: 'Ato Conjunto RFB/CGIBS nº 1/2025', order: 4 },
      { code: 'Decreto 12.955/2026', order: 5 },
      { code: 'Resolução CGIBS 6/2026 (RIBS)', order: 6 },
      { code: 'Portaria Conjunta MF/CGIBS nº 7/2026', order: 7 },
      { code: 'Resoluções CGIBS 1 e 2/2026', order: 8 },
      { code: 'Resolução CGIBS nº 13/2026', order: 9 },
      { code: 'Resolução CGIBS nº 14/2026', order: 10 },
      { code: 'Resolução CGIBS nº 16/2026', order: 11 },
      { code: 'Ato Conjunto RFB/CGIBS 4/2026', order: 12 },
      { code: 'Resoluções CGSN 190–192/2026', order: 13 },
    ]

    for (let u = 0; u < orderingUpdates.length; u++) {
      const up = orderingUpdates[u]
      try {
        const rec = app.findFirstRecordByData('tax_norms', 'code', up.code)
        rec.set('order', up.order)
        app.save(rec)
      } catch (_) {}
    }

    // 4. Inserir registro oficial em content_reviews da PRIMEIRA REVISÃO DE CONTEÚDO REAL
    // Review nº 1 (v0.0.16) em 30/09/2026
    const contentReviews = app.findCollectionByNameOrId('content_reviews')
    const revRecord = new Record(contentReviews)

    const reviewDate = '2026-09-30T14:30:00.000Z'
    const sourcesChecked = [
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
    ]

    const notes =
      'Revisão nº 1 — Primeira revisão real de conteúdo: inclusão do Ato Conjunto RFB/CGIBS nº 1/2025 (obrigações acessórias e DeRE), Portaria Conjunta MF/CGIBS nº 7/2026 (disposições comuns), Resoluções CGIBS nº 13/2026 (alteração do art. 617 do RIBS), nº 14/2026 (proposta de financiamento do CGIBS e estimativa técnica de alíquota de 27,91%) e nº 16/2026 (prorrogação da obrigatoriedade dos campos IBS/CBS nos DFe). Atualização do link oficial do PDF do RIBS (Res. CGIBS 6/2026) e detalhamento dos marcos operacionais do Ato Conjunto RFB/CGIBS 4/2026 e do Simples Nacional.'

    const summary =
      'Revisão nº 1 (30/09/2026): inclusão de 5 novas normas oficiais (Ato Conjunto 1/2025, Portaria 7/2026, Res. CGIBS 13, 14 e 16/2026) e atualização dos marcos operacionais dos DFe.'

    revRecord.set('review_date', reviewDate)
    revRecord.set('status', 'ok')
    revRecord.set('sources_checked', sourcesChecked)
    revRecord.set('notes', notes)
    revRecord.set('summary', summary)

    app.save(revRecord)
  },
  (app) => {
    // Reversão
    try {
      const codesToDelete = [
        'Ato Conjunto RFB/CGIBS nº 1/2025',
        'Portaria Conjunta MF/CGIBS nº 7/2026',
        'Resolução CGIBS nº 13/2026',
        'Resolução CGIBS nº 14/2026',
        'Resolução CGIBS nº 16/2026',
      ]
      for (let i = 0; i < codesToDelete.length; i++) {
        try {
          const rec = app.findFirstRecordByData('tax_norms', 'code', codesToDelete[i])
          app.delete(rec)
        } catch (_) {}
      }
    } catch (_) {}
  },
)
