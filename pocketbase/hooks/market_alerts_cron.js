/**
 * ALERTAS DE MERCADO — job agendado (dias úteis, 06:00 UTC).
 *
 * Compara o último fechamento com o anterior (dia) para Ibovespa (BCB SGS 7),
 * dólar PTAX (SGS 10813) e euro PTAX (SGS 21619); variação relevante cria um
 * alerta no sino (market_alerts — único por índice + data, is_read=false).
 * Falha da fonte = silêncio (não cria alerta nem erro).
 */
cronAdd('check_market_alerts', '0 6 * * 1-5', () => {
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }
  const indices = [
    { chave: 'ibovespa', nome: 'Ibovespa', codigo: 7, limite: 2.0, unidade: 'pontos' },
    { chave: 'usd', nome: 'Dólar (PTAX)', codigo: 10813, limite: 1.5, unidade: 'R$/US$' },
    { chave: 'eur', nome: 'Euro (PTAX)', codigo: 21619, limite: 1.5, unidade: 'R$/EUR' },
  ]

  const hoje = new Date()
  const alertDate = hoje.toISOString().slice(0, 10) + ' 00:00:00.000Z'

  for (let i = 0; i < indices.length; i++) {
    const ind = indices[i]
    try {
      const resp = $http.send({
        url:
          'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          ind.codigo +
          '/dados/ultimos/2?formato=json',
        method: 'GET',
        timeout: 8,
        headers: CAB,
      })
      const arr = resp.json || []
      if (arr.length < 2) continue
      const parse = (s) => parseFloat(String(s || '').replace(',', '.'))
      const anterior = parse(arr[0].valor)
      const atual = parse(arr[1].valor)
      if (!isFinite(anterior) || !isFinite(atual) || anterior === 0) continue
      const variacao = ((atual - anterior) / Math.abs(anterior)) * 100
      if (Math.abs(variacao) < ind.limite) continue

      // único por (indice, alert_date): se já existe, pula
      try {
        const existente = $app.findFirstRecordByFilter(
          'market_alerts',
          'indice = "' + ind.chave + '" && alert_date >= "' + alertDate + '"',
        )
        if (existente) continue
      } catch (_) {
        // não encontrado → cria
      }

      const col = $app.findCollectionByNameOrId('market_alerts')
      const rec = new Record(col)
      rec.set('indice', ind.chave)
      rec.set(
        'titulo',
        ind.nome + ' variou ' + (variacao > 0 ? '+' : '') + variacao.toFixed(2) + '% em um dia',
      )
      rec.set(
        'mensagem',
        ind.nome +
          ' fechou em ' +
          atual.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) +
          ' ' +
          ind.unidade +
          ' (' +
          (variacao > 0 ? '+' : '') +
          variacao.toFixed(2) +
          '% vs. pregão anterior). Fonte oficial: Banco Central (SGS ' +
          ind.codigo +
          ').',
      )
      rec.set('variacao_pct', variacao)
      rec.set('direcao', variacao > 0 ? 'alta' : 'baixa')
      rec.set('alert_date', alertDate)
      rec.set('fonte', 'Banco Central do Brasil — SGS ' + ind.codigo)
      rec.set('link_url', 'https://www.bcb.gov.br/estabilidadefinanceira/cambio')
      rec.set('is_read', false)
      $app.save(rec)
      console.log(
        'market_alerts: alerta criado para ' + ind.chave + ' (' + variacao.toFixed(2) + '%)',
      )
    } catch (err) {
      // fonte falhou → sem alerta neste ciclo (fallback silencioso)
    }
  }
})
