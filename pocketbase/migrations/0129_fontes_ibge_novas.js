/// <reference path="../pb_data/types.d.ts" />
// Migration 0129 — Registro das 3 novas fontes oficiais IBGE em source_status
// (ibge_populacao, ibge_pms, ibge_construcao) com tier oficial_institucional e status ativo.
migrate(
  (app) => {
    const novasFontes = [
      {
        key: 'ibge_populacao',
        name: 'IBGE — População Residente (Estimativas e Censo — SIDRA Tabela 6579)',
        url: 'https://sidra.ibge.gov.br/tabela/6579',
        order: 53,
        confidenceTier: 'oficial_institucional',
        coverageStatus: 'coberta_direta',
        alternative:
          'API SIDRA Tabela 6579 (variável 9324 — População residente estimada do Brasil)',
        message:
          'Fonte oficial institucional de estimativas populacionais anuais do IBGE (SIDRA Tabela 6579).',
      },
      {
        key: 'ibge_pms',
        name: 'IBGE — Volume de Serviços (Pesquisa Mensal de Serviços / PMS — SIDRA Tabela 5906)',
        url: 'https://sidra.ibge.gov.br/tabela/5906',
        order: 54,
        confidenceTier: 'oficial_institucional',
        coverageStatus: 'coberta_direta',
        alternative:
          'API SIDRA Tabela 5906 (variável 7167, classificação c11046/56726 — Índice de volume de serviços PMS)',
        message:
          'Fonte oficial institucional da Pesquisa Mensal de Serviços (PMS) do IBGE (SIDRA Tabela 5906).',
      },
      {
        key: 'ibge_construcao',
        name: 'IBGE — Produção da Construção Civil (Insumos Típicos / PIM-PF — SIDRA Tabela 8886)',
        url: 'https://sidra.ibge.gov.br/tabela/8886',
        order: 55,
        confidenceTier: 'oficial_institucional',
        coverageStatus: 'coberta_direta',
        alternative:
          'API SIDRA Tabela 8886 (variável 12606 — Produção física de insumos típicos da construção civil PIM-PF)',
        message:
          'Fonte oficial institucional de insumos típicos da construção civil do IBGE (SIDRA Tabela 8886).',
      },
    ]

    const col = app.findCollectionByNameOrId('source_status')
    const nowIso = new Date().toISOString()

    for (let i = 0; i < novasFontes.length; i++) {
      const src = novasFontes[i]
      let rec = null
      try {
        rec = app.findFirstRecordByData('source_status', 'source_key', src.key)
      } catch (_) {
        rec = null
      }

      if (!rec) {
        rec = new Record(col)
        rec.set('source_key', src.key)
      }

      rec.set('name', src.name)
      rec.set('url', src.url)
      rec.set('status', 'active')
      rec.set('http_status', 200)
      rec.set('response_time_ms', 0)
      rec.set('last_checked_at', nowIso)
      rec.set('message', src.message)
      rec.set('order', src.order)
      rec.set('coverage_status', src.coverageStatus)
      rec.set('confidence_tier', src.confidenceTier)
      rec.set('alternative_source', src.alternative)
      app.save(rec)
    }
  },
  (app) => {
    const chaves = ['ibge_populacao', 'ibge_pms', 'ibge_construcao']
    for (let i = 0; i < chaves.length; i++) {
      try {
        const rec = app.findFirstRecordByData('source_status', 'source_key', chaves[i])
        if (rec) app.delete(rec)
      } catch (_) {}
    }
  },
)
