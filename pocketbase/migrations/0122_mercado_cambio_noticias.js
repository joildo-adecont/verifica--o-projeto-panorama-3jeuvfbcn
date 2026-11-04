/// <reference path="../pb_data/types.d.ts" />
// Migration 0122 — Mercado financeiro ampliado: novos índices globais e câmbio
// (orders 50–52 na fonte de status), cache de séries/notícias e alertas de mercado.
migrate(
  (app) => {
    const fontes = [
      {
        source_key: 'ipea_global',
        name: 'IPEA/IPEADATA — Índices de Mercado Globais (S&P 500, Dow Jones e Nasdaq)',
        url: 'https://www.ipeadata.gov.br',
        order: 50,
        alternative:
          'API OData IPEADATA (ValoresSerie) e séries de referência internacional compiladas pela base interna ADECONT',
      },
      {
        source_key: 'bcb_cambio',
        name: 'Banco Central — Câmbio (PTAX: dólar, euro e moedas de referência)',
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/cambio',
        order: 51,
        alternative:
          'API SGS do BCB (10813 dólar PTAX, 21619 euro) e boletins diários de câmbio do BCB',
      },
      {
        source_key: 'noticias_bcb',
        name: 'Banco Central — Sala de Imprensa / Notícias Oficiais (feed RSS)',
        url: 'https://www.bcb.gov.br/saladeimprensa',
        order: 52,
        alternative:
          'Feed RSS oficial do Banco Central (api/conteudo/rss) e página Sala de Imprensa BCB',
      },
    ]

    for (let i = 0; i < fontes.length; i++) {
      const src = fontes[i]
      let rec = null
      try {
        rec = app.findFirstRecordByData('source_status', 'source_key', src.source_key)
      } catch (_) {
        rec = null
      }
      if (!rec) {
        const col = app.findCollectionByNameOrId('source_status')
        rec = new Record(col)
        rec.set('source_key', src.source_key)
      }
      rec.set('name', src.name)
      rec.set('url', src.url)
      rec.set('status', 'active')
      rec.set('http_status', 200)
      rec.set('response_time_ms', 0)
      rec.set('last_checked_at', new Date().toISOString())
      rec.set(
        'message',
        'Fonte oficial institucional registrada (proxy /backend/v1/series-mercado e /backend/v1/noticias-financeiras).',
      )
      rec.set('order', src.order)
      rec.set('coverage_status', 'coberta_direta')
      rec.set('confidence_tier', 'oficial_institucional')
      rec.set('alternative_source', src.alternative)
      app.save(rec)
    }

    // Cache de séries históricas de mercado/câmbio (proxy anti-bloqueio)
    let colCache = null
    try {
      colCache = app.findCollectionByNameOrId('series_cache')
    } catch (_) {
      colCache = null
    }
    if (!colCache) {
      colCache = new Collection({
        name: 'series_cache',
        type: 'base',
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'payload', type: 'json', required: true },
          { name: 'fonte', type: 'text' },
          { name: 'fetched_at', type: 'date' },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_series_cache_chave ON series_cache (chave)'],
      })
      app.save(colCache)
    }

    // Cache de notícias financeiras (feed oficial do Banco Central)
    let colNews = null
    try {
      colNews = app.findCollectionByNameOrId('news_cache')
    } catch (_) {
      colNews = null
    }
    if (!colNews) {
      colNews = new Collection({
        name: 'news_cache',
        type: 'base',
        fields: [
          { name: 'feed_key', type: 'text', required: true },
          { name: 'guid', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'link', type: 'url' },
          { name: 'resumo', type: 'text' },
          { name: 'publicado_em', type: 'date' },
          { name: 'fonte_nome', type: 'text' },
          { name: 'fetched_at', type: 'date' },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_news_cache_feed_guid ON news_cache (feed_key, guid)'],
      })
      app.save(colNews)
    }

    // Alertas de mercado (sino do sistema — canal novo "alertas de mercado")
    let colAlerts = null
    try {
      colAlerts = app.findCollectionByNameOrId('market_alerts')
    } catch (_) {
      colAlerts = null
    }
    if (!colAlerts) {
      colAlerts = new Collection({
        name: 'market_alerts',
        type: 'base',
        fields: [
          { name: 'indice', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'mensagem', type: 'text', required: true },
          { name: 'variacao_pct', type: 'number' },
          { name: 'direcao', type: 'text' },
          { name: 'alert_date', type: 'date', required: true },
          { name: 'fonte', type: 'text' },
          { name: 'link_url', type: 'url' },
          { name: 'is_read', type: 'bool' },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_market_alerts_indice_data ON market_alerts (indice, alert_date)',
        ],
      })
      app.save(colAlerts)
    }
  },
  (app) => {
    const chaves = ['ipea_global', 'bcb_cambio', 'noticias_bcb']
    for (let i = 0; i < chaves.length; i++) {
      try {
        const rec = app.findFirstRecordByData('source_status', 'source_key', chaves[i])
        if (rec) app.delete(rec)
      } catch (_) {}
    }
    try {
      app.delete(app.findCollectionByNameOrId('market_alerts'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('news_cache'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('series_cache'))
    } catch (_) {}
  },
)
