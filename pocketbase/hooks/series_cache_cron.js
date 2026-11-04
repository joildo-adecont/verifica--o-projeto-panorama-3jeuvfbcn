/**
 * AQUECIMENTO DO CACHE DE SÉRIE — job agendado (todo dia, 03:20 UTC).
 *
 * O roteador series_historicas_route.js nunca faz o usuário esperar uma fonte
 * lenta: ele serve do cache (TTL 6 h; FipeZap 26 h). Este job refresca o cache
 * fora do caminho do usuário — em especial o FipeZap (fonte lenta demais para
 * consultar dentro de um pedido), que DEPENDE deste job para ter dados
 * oficiais no cache.
 */
cronAdd('refresh_series_cache', '20 3 * * *', () => {
  const nucleo = globalThis.PANORAMA_seriesHistoricasNucleo
  if (!nucleo) {
    console.log('refresh_series_cache: núcleo de séries históricas ausente')
    return
  }
  // FipeZap primeiro (só consegue dados aqui); depois mercado/câmbio.
  const chaves = [
    'fipezap',
    'ibovespa',
    'ifix',
    'sp500',
    'dowjones',
    'nasdaq',
    'usd',
    'eur',
    'gbp',
    'jpy',
    'yuan',
    'boi_gordo',
    'soja',
    'milho',
  ]
  let ok = 0
  for (let i = 0; i < chaves.length; i++) {
    try {
      const n = nucleo.atualizar(chaves[i])
      if (n > 0) ok++
    } catch (err) {
      console.log('refresh_series_cache: ' + chaves[i] + ' falhou: ' + String(err))
    }
  }
  console.log('refresh_series_cache: ' + ok + '/' + chaves.length + ' séries atualizadas')
})
