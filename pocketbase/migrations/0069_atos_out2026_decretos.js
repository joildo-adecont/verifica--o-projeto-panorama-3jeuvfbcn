migrate(
  (app) => {
    const normsCol = app.findCollectionByNameOrId('tax_norms')

    // Atos incorporados em 28/10/2026 com TEXTO INTEGRAL conferido no DOU.
    // Fonte de publicação: Imprensa Nacional (oficial). O Planalto está bloqueado
    // por WAF de IP estrangeiro — ver registro de fontes em scripts/fontes_oficiais.
    const atos = [
      {
        code: 'Decreto 13.133/2026',
        title: 'Decreto nº 13.133 (delegação das alíquotas da CBS dos combustíveis)',
        norm_type: 'Decreto',
        origin: 'DOU / Imprensa Nacional',
        link_url:
          'https://www.in.gov.br/web/dou/-/decreto-n-13.133-de-9-de-outubro-de-2026-737756208',
        dou_date: '09/10/2026',
        date: '09/10/2026',
        status_incidence: 'Regime específico',
        order: 22,
        summary:
          'Delega ao Ministro de Estado da Fazenda a competência para divulgar as alíquotas da CBS incidentes sobre combustíveis (art. 174, III, "b", da LC 214/2025), alcançando as alíquotas a partir de 2027 e os reajustes anuais. Os oito combustíveis nominados são: gasolina e suas correntes, EAC, óleo diesel e suas correntes, biodiesel (B100), GLP/GLGN, EHC, querosene de aviação e óleo combustível. A divulgação deve observar os limites dos arts. 174 e 175 da LC 214, a metodologia do ato conjunto MF/CGIBS e os cálculos da RFB. Altera o Decreto 12.955/2026 (arts. 471 e 476) e revoga o art. 477: as alíquotas da CBS sobre biocombustíveis ficam entre 40% e 90% da alíquota do fóssil de comparação.',
      },
      {
        code: 'Decreto 13.140/2026',
        title: 'Decreto nº 13.140 (nanoempreendedor e MEI — CNPJ e documento fiscal)',
        norm_type: 'Decreto',
        origin: 'DOU / Imprensa Nacional',
        link_url:
          'https://www.in.gov.br/web/dou/-/decreto-n-13.140-de-21-de-outubro-de-2026-739686339',
        dou_date: '21/10/2026',
        date: '21/10/2026',
        status_incidence: 'Obrig. acessórias',
        order: 23,
        summary:
          'No âmbito da União, dispensa o nanoempreendedor (art. 25, IV, do Decreto 12.955/2026) de inscrever-se no CNPJ e de emitir documentos fiscais eletrônicos. As dispensas não alcançam o nanoempreendedor que optar pelo regime regular de IBS/CBS (art. 26, § 1º, II, da LC 214) e, para o IBS, produzem efeitos só a partir de 1º/01/2029, após manifestação favorável do CGIBS. Autoriza também o uso da DASN-SIMEI como documento fiscal eletrônico nas vendas do MEI a consumidor final (art. 26, § 6º, II, da LC 123, na redação da LC 214).',
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

    // Item 2 da organização das fontes: as normas já cadastradas apontavam para o
    // Planalto, que está BLOQUEADO por WAF de IP estrangeiro. A citação oficial
    // passa a apontar para o portal do Senado/Congresso (normas.leg.br), que serve
    // o texto integral compilado e responde de qualquer rede.
    const correcoes = [
      { code: 'LC 214/2025', urn: 'urn:lex:br:federal:lei.complementar:2025-01-16;214' },
      { code: 'LC 227/2026', urn: 'urn:lex:br:federal:lei.complementar:2026-01-13;227' },
      { code: 'LC 235/2026', urn: 'urn:lex:br:federal:lei.complementar:2026-08-27;235' },
      { code: 'LC 237/2026', urn: 'urn:lex:br:federal:lei.complementar:2026-09-15;237' },
      { code: 'LC 238/2026', urn: 'urn:lex:br:federal:lei.complementar:2026-10-21;238' },
      { code: 'LC 236/2026', urn: 'urn:lex:br:federal:lei.complementar:2026-09-04;236' },
    ]
    for (let i = 0; i < correcoes.length; i++) {
      const c = correcoes[i]
      let rec = null
      try {
        rec = app.findFirstRecordByData('tax_norms', 'code', c.code)
      } catch (_) {
        rec = null
      }
      if (!rec) continue
      if (normsCol.fields.getByName('link_url')) {
        rec.set('link_url', 'https://normas.leg.br/?urn=' + c.urn)
      }
      if (normsCol.fields.getByName('origin')) {
        rec.set('origin', 'Senado Federal')
      }
      app.save(rec)
    }
  },
  (app) => {
    const codigos = ['Decreto 13.133/2026', 'Decreto 13.140/2026']
    for (let i = 0; i < codigos.length; i++) {
      try {
        app.delete(app.findFirstRecordByData('tax_norms', 'code', codigos[i]))
      } catch (_) {}
    }
    const volta = [
      { code: 'LC 214/2025', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm' },
      { code: 'LC 227/2026', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm' },
    ]
    for (let i = 0; i < volta.length; i++) {
      try {
        const rec = app.findFirstRecordByData('tax_norms', 'code', volta[i].code)
        rec.set('link_url', volta[i].url)
        rec.set('origin', 'Planalto')
        app.save(rec)
      } catch (_) {}
    }
  },
)
