/**
 * AQUECIMENTO DO CACHE DE SÉRIE — job agendado (todo dia, 03:20 UTC).
 *
 * O roteador series_historicas_route.js nunca faz o usuário esperar uma fonte
 * lenta: ele serve do cache (TTL 6 h; mercado 26 h; FipeZap 26 h). Este job
 * refresca o cache FORA do caminho do usuário — em especial FipeZap e as
 * séries IPEADATA geradas (ibovespa/ifix/sp500/dowjones/nasdaq), que respondem
 * devagar demais para um pedido ao vivo e DEPENDEM deste job para ter dado
 * oficial quente no cache.
 *
 * REGRA DA JSVM: callbacks de cronAdd rodam em POOL SEPARADO — não enxergam
 * símbolos de nível superior de outro arquivo. Tudo aqui é INLINE.
 *
 * REGRA DO BCB: séries DIÁRIAS recusam janelas > 10 anos (a partir de hoje) —
 * janelas de 5 anos desde 2014, concatenadas; janela falha não zera o resto.
 *
 * REGRA DO IPEADATA: a API NÃO honra $orderby com $filter e uma página única
 * com $top devolvia só a parte ASCENDENTE antiga (Ibovespa parava em set/2019
 * — diagnóstico ao vivo 05/11). Séries IPEA são coletadas em JANELAS de
 * VALDATA (3 anos), do mais recente ao mais antigo, e reordenadas no fim.
 *
 * v0.0.568: sp500/dowjones/nasdaq passam a Stooq (CSV mensal, ^spx/^dji/^ndx)
 * — os códigos IPEADATA GM366_* desses índices NÃO existem no catálogo
 * (Metadados('X') vazio, comprovado um a um). IFIX mantém candidato IPEA;
 * sem pontos vivos → degradação para a base interna (nunca série vazia).
 *
 * v0.0.585: Stooq é INALCANÇÁVEL do backend (context deadline exceeded).
 * sp500/dowjones/nasdaq coletam agora do Yahoo Finance chart API (sem chave,
 * %5EGSPC/%5EDJI/%5EIXIC, interval=1mo&range=15y) com timeout CURTO de 5s,
 * tentando o Stooq logo atrás. Timeouts do cron reduzidos — o job nunca
 * fica pendurado numa fonte morta.
 */
cronAdd('refresh_series_cache', '20 3 * * *', () => {
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }
  const ANO_INICIO = 2014
  const TIMEOUT_MERCADO_S = 10 // IPEA janelado (Ibovespa)
  const TIMEOUT_GLOBAL_S = 5 // Yahoo/Stooq — curto, nunca pendura o job
  const TIMEOUT_PADRAO_S = 8
  const ORCAMENTO_CHAVE_MS = 9 * 60 * 1000 // 9 min por chave (job roda às 03:20)
  const TTL_PADRAO_MS = 6 * 3600 * 1000
  const TTL_LONGO_MS = 26 * 3600 * 1000 // 26 h — cron mantém quente

  function parseValor(s) {
    return parseFloat(String(s == null ? '' : s).replace(',', '.'))
  }

  function parseBcbLinhas(arr) {
    const coletados = []
    for (let i = 0; i < arr.length; i++) {
      const linha = arr[i]
      if (!linha) continue
      const m = String(linha.data || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!m) continue
      const valor = parseValor(linha.valor)
      if (!isFinite(valor)) continue
      coletados.push({ periodo: m[3] + '-' + m[2], valor: valor })
    }
    return coletados
  }

  // BCB diário em janelas de 5 anos (contrato do BCData).
  function coletarBcbMensalUltimo(codigo) {
    const anoAtual = new Date().getFullYear()
    const todos = []
    for (let y = ANO_INICIO; y <= anoAtual; y += 5) {
      let url =
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
        codigo +
        '/dados?formato=json&dataInicial=01/01/' +
        y
      if (y + 4 < anoAtual) url = url + '&dataFinal=31/12/' + (y + 4)
      let resp = null
      try {
        resp = $http.send({ url: url, method: 'GET', timeout: TIMEOUT_PADRAO_S, headers: CAB })
      } catch (_) {
        resp = null
      }
      if (resp && resp.statusCode >= 200 && resp.statusCode < 400) {
        const arr = resp.json
        if (Array.isArray(arr) && arr.length > 0) {
          const janela = parseBcbLinhas(arr)
          for (let k = 0; k < janela.length; k++) todos.push(janela[k])
        }
      }
    }
    return todos
  }

  function escapeOdataData(iso) {
    return iso + 'T00:00:00'
  }

  // UMA janela VALDATA de um código IPEADATA (pontos ascendentes).
  function coletarJanelaIpea(base, dataInicial, dataFinal, timeoutSegundos) {
    const url =
      base +
      '?$top=1200&$filter=VALDATA%20ge%20' +
      escapeOdataData(dataInicial) +
      '%20and%20VALDATA%20lt%20' +
      escapeOdataData(dataFinal)
    const resp = $http.send({
      url: url,
      method: 'GET',
      timeout: timeoutSegundos,
      headers: CAB,
    })
    if (!resp || resp.statusCode < 200 || resp.statusCode >= 400) return []
    const body = resp.json
    const arr = body && body.value ? body.value : []
    const pontos = []
    for (let i = 0; i < arr.length; i++) {
      const linha = arr[i]
      if (!linha) continue
      const data = String(linha.VALDATA || '')
      if (data.length < 7) continue
      const valor = parseFloat(linha.VALVALOR)
      if (!isFinite(valor)) continue
      pontos.push({ periodo: data.slice(0, 7), valor: valor })
    }
    return pontos
  }

  // Série IPEA completa: janelas de 3 anos, do mais recente ao mais antigo,
  // concatenadas e reordenadas ascendente no fim.
  function coletarIpeaJanelas(codigo, timeoutSegundos, orcamentoMs) {
    const anoAtual = new Date().getFullYear()
    const dataInicialIso = ANO_INICIO + '-01-01'
    const base = "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='" + codigo + "')"
    const inicioBudget = new Date().getTime()
    const todos = []
    for (let anoFim = anoAtual + 1; anoFim >= 2014; anoFim -= 3) {
      const restante = orcamentoMs - (new Date().getTime() - inicioBudget)
      if (restante < 400) break
      const dataFim = String(Math.max(anoFim, 2015)) + '-01-01'
      const dataIniJanela =
        dataFim === '2015-01-01' ? dataInicialIso : String(anoFim - 3) + '-01-01'
      if (dataIniJanela >= dataFim) continue
      let janela = []
      try {
        janela = coletarJanelaIpea(
          base,
          dataIniJanela,
          dataFim,
          Math.max(1, Math.min(timeoutSegundos, Math.floor(restante / 1000))),
        )
      } catch (_) {
        janela = []
      }
      for (let k = 0; k < janela.length; k++) todos.push(janela[k])
    }
    if (todos.length === 0) return []
    todos.sort(function (a, b) {
      return a.periodo < b.periodo ? -1 : a.periodo > b.periodo ? 1 : 0
    })
    return todos
  }

  // CSV do Stooq (i=m): header Date,Open,High,Low,Close[,Volume] — fecha = col 5.
  function parseCsvLinhas(texto) {
    const linhas = String(texto || '').split(/\r?\n/)
    const coletados = []
    for (let i = 0; i < linhas.length; i++) {
      const cols = linhas[i].split(',')
      if (cols.length < 5) continue
      const per = String(cols[0] || '').trim()
      if (per === 'Date' || per === '' || per.indexOf('-') === -1) continue
      const valor = parseValor(cols[4])
      if (!isFinite(valor) || valor <= 0) continue
      coletados.push({ periodo: per.slice(0, 7), valor: valor })
    }
    return coletados
  }

  // Yahoo Finance chart API (sem chave): JSON mensal com timestamp[] + close.
  function coletarYahoo(simbolo) {
    let resp = null
    try {
      resp = $http.send({
        url:
          'https://query1.finance.yahoo.com/v8/finance/chart/' +
          simbolo +
          '?interval=1mo&range=15y',
        method: 'GET',
        timeout: TIMEOUT_GLOBAL_S,
        headers: CAB,
      })
    } catch (_) {
      resp = null
    }
    if (!resp || resp.statusCode < 200 || resp.statusCode >= 400) return []
    const j = resp.json
    const resultado = j && j.chart && j.chart.result ? j.chart.result[0] : null
    if (!resultado) return []
    const stamps = resultado.timestamp || []
    const quote =
      resultado.indicators && resultado.indicators.quote ? resultado.indicators.quote[0] || {} : {}
    const closes = quote.close || []
    const coletados = []
    for (let i = 0; i < stamps.length && i < closes.length; i++) {
      const d = new Date(stamps[i] * 1000)
      const valor = parseFloat(closes[i])
      if (!isFinite(valor) || valor <= 0) continue
      coletados.push({
        periodo: d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'),
        valor: valor,
      })
    }
    return coletados
  }

  // Stooq (índices globais): CSV mensal direto — sem chave, sem janela.
  function coletarStooq(simbolo) {
    const anoAtual = new Date().getFullYear()
    const url =
      'https://stooq.com/q/d/l/?s=' +
      simbolo +
      '&i=m&d1=' +
      ANO_INICIO +
      '0101&d2=' +
      (anoAtual + 1) +
      '0101'
    let resp = null
    try {
      resp = $http.send({ url: url, method: 'GET', timeout: TIMEOUT_MERCADO_S, headers: CAB })
    } catch (_) {
      resp = null
    }
    if (!resp || resp.statusCode < 200 || resp.statusCode >= 400) return []
    const texto =
      typeof resp.body === 'string' ? resp.body : typeof resp.json === 'string' ? resp.json : ''
    if (texto.indexOf('Exceeded the daily hits limit') !== -1) return []
    return parseCsvLinhas(texto)
  }

  function agregarMensalUltimo(pontos) {
    const porMes = {}
    const ordem = []
    for (let i = 0; i < pontos.length; i++) {
      const p = pontos[i]
      if (!porMes[p.periodo]) ordem.push(p.periodo)
      porMes[p.periodo] = p.valor
    }
    return ordem.map(function (k) {
      return { periodo: k, valor: porMes[k] }
    })
  }

  // Catálogo do cron: chave → {ttlMs, fonte: 'bcb'|'ipea', codigo}
  // ORDEM: mercado primeiro (é o que o Histórico precisa ter quente).
  const CATALOGO = [
    // Mercado primeiro (é o que o Histórico precisa ter quente). sp500/
    // dowjones/nasdaq: Yahoo como fonte primária, Stooq atrás (rota idem).
    { chave: 'fipezap', ttlMs: TTL_LONGO_MS, fonte: 'bcb', codigo: 19967 },
    { chave: 'ibovespa', ttlMs: TTL_LONGO_MS, fonte: 'ipea', codigo: 'GM366_IBVSP366' },
    { chave: 'ifix', ttlMs: TTL_LONGO_MS, fonte: 'ipea', codigo: 'GM366_IFIX366' },
    { chave: 'sp500', ttlMs: TTL_LONGO_MS, fonte: 'global', simbolo: '%5EGSPC' },
    { chave: 'dowjones', ttlMs: TTL_LONGO_MS, fonte: 'global', simbolo: '%5EDJI' },
    { chave: 'nasdaq', ttlMs: TTL_LONGO_MS, fonte: 'global', simbolo: '%5EIXIC' },
    { chave: 'usd', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 10813 },
    { chave: 'eur', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 21619 },
    { chave: 'gbp', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 21621 },
    { chave: 'jpy', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 21620 },
    { chave: 'yuan', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 21623 },
    { chave: 'boi_gordo', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 23447 },
    { chave: 'soja', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 23448 },
    { chave: 'milho', ttlMs: TTL_PADRAO_MS, fonte: 'bcb', codigo: 23449 },
  ]

  function lerCache(chave) {
    try {
      const rec = $app.findFirstRecordByData('series_cache', 'chave', chave)
      let obj = rec.get('payload')
      if (typeof obj === 'string') {
        try {
          obj = JSON.parse(obj)
        } catch (_) {
          obj = null
        }
      }
      if (!obj || !Array.isArray(obj.serie) || obj.serie.length === 0) return null
      const ts = Date.parse(String(obj.fetched_at_iso || '').replace(' ', 'T')) || 0
      return ts
    } catch (_) {
      return null
    }
  }

  function salvarCache(chave, pontos) {
    let rec = null
    try {
      rec = $app.findFirstRecordByData('series_cache', 'chave', chave)
    } catch (_) {
      const col = $app.findCollectionByNameOrId('series_cache')
      rec = new Record(col)
      rec.set('chave', chave)
    }
    const agora = new Date().toISOString()
    rec.set('payload', JSON.stringify({ fetched_at_iso: agora, serie: pontos }))
    rec.set('fonte', 'cron/refresh_series_cache')
    rec.set('fetched_at', agora)
    $app.save(rec)
  }

  let ok = 0
  let pulados = 0
  for (let i = 0; i < CATALOGO.length; i++) {
    const item = CATALOGO[i]
    try {
      // Só refresca o que já venceu o TTL da própria chave (a rota respeita
      // o MESMO ttlMs — cache cron fresco nunca é ignorado pelo pedido).
      const tsCache = lerCache(item.chave)
      if (tsCache > 0 && new Date().getTime() - tsCache < item.ttlMs) {
        pulados++
        continue
      }
      let pontos = []
      if (item.fonte === 'bcb') {
        pontos = coletarBcbMensalUltimo(item.codigo)
      } else if (item.fonte === 'global') {
        // Yahoo primeiro (timeout 5s), Stooq logo atrás; sem pontos nos dois
        // → degradação para a base interna na rota (nunca série vazia).
        pontos = coletarYahoo(item.simbolo)
        if (pontos.length === 0) pontos = coletarStooq(item.simbolo)
      } else {
        pontos = coletarIpeaJanelas(item.codigo, TIMEOUT_MERCADO_S, ORCAMENTO_CHAVE_MS)
      }
      if (pontos.length > 0) {
        const finais = agregarMensalUltimo(pontos).slice(-3000)
        salvarCache(item.chave, finais)
        ok++
        console.log(
          'refresh_series_cache: ' +
            item.chave +
            ' → ' +
            finais.length +
            ' pontos (' +
            finais[0].periodo +
            ' a ' +
            finais[finais.length - 1].periodo +
            ')',
        )
      } else {
        console.log('refresh_series_cache: ' + item.chave + ' sem pontos na fonte viva')
      }
    } catch (err) {
      console.log('refresh_series_cache: ' + item.chave + ' falhou: ' + String(err))
    }
  }
  console.log(
    'refresh_series_cache: ' + ok + ' atualizadas, ' + pulados + ' ainda frescas no cache',
  )
})
