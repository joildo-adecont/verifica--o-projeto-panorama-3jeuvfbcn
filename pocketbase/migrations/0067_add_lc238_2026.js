migrate(
  (app) => {
    const normsCol = app.findCollectionByNameOrId('tax_norms')

    // LC 238/2026 — Lei Complementar nº 238, de 21/10/2026 (DOU 21/10/2026, edição extra A).
    // Altera a LC 123/2006 (Simples Nacional): limite do MEI, 2 empregados, remissão de
    // créditos da União e compras públicas. NÃO altera alíquotas de IBS/CBS nem o
    // sublimite de R$ 3,6 mi do art. 13-A. Texto conferido no DOU em 28/10/2026.
    const item = {
      code: 'LC 238/2026',
      title: 'Lei Complementar nº 238 (MEI e Simples Nacional)',
      norm_type: 'Lei Complementar',
      origin: 'Planalto',
      link_url:
        'https://www.in.gov.br/web/dou/-/lei-complementar-n-238-de-21-de-outubro-de-2026-739686316',
      dou_date: '21/10/2026',
      status_incidence: 'ME/EPP',
      order: 17,
      date: '21/10/2026',
      summary:
        'Altera a LC 123/2006: limite de receita bruta do MEI sobe para R$ 140.000,00 (efeitos em 1º/01/2028; R$ 110.000,00 em 2027), MEI passa a poder ter 2 empregados, remissão integral de créditos da União de MEI até 13/10/2026 e ajustes nas compras públicas (arts. 48 e 49 da LC 123). Não altera alíquotas de IBS/CBS nem o sublimite de R$ 3,6 milhões do art. 13-A.',
    }

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

    // Só define os campos que a coleção possui, para não falhar em esquema antigo
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
    for (let i = 0; i < campos.length; i++) {
      const nome = campos[i]
      if (normsCol.fields.getByName(nome)) {
        record.set(nome, item[nome])
      }
    }

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('tax_norms', 'code', 'LC 238/2026')
      app.delete(record)
    } catch (_) {
      // registro já não existe — nada a desfazer
    }
  },
)
