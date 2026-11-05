/**
 * AQUECIMENTO DO CACHE DE SÉRIE — job agendado (todo dia, 03:20 UTC).
 *
 * O roteador series_historicas_route.js nunca faz o usuário esperar uma fonte
 * lenta: ele serve do cache (TTL 6 h; FipeZap 26 h). Este job refresca o cache
 * fora do caminho do usuário — em especial o FipeZap (fonte lenta demais para
 * consultar dentro de um pedido), que DEPENDE deste job para ter dados
 * oficiais no cache.
 *
 * REGRA DA JSVM: callbacks de cronAdd rodam em POOL SEPARADO — não enxergam
 * símbolos de nível superior de outro arquivo (a antiga via
 * globalThis.PANORAMA_seriesHistoricasNucleo falhou em produção: "Cannot read
 * property 'resolver' of undefined or null"). A coleta viva fica então inline
 * AQUI (cópia das funções do roteador, sem depender de nada externo).
 */
cronAdd('refresh_series_cache', '20 3 * * *', () => {
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }

  function parseValor(s) {
    return parseFloat(String(s == null ? '' : s).replace(',', '.'))
  }

  function urlDoCandidato(cand) {
    const anoAtual = new Date().getFullYear()
    if (cand.tipo === 'bcb') {
      const inicio = cand.agreg === 'mensal_ultimo' ? '01/01/' + (anoAtual - 2) : '01/01/2014'
      return (
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
        cand.codigo +
        '/dados?formato=json&dataInicial=' +
        inicio
      )
    }
    if (cand.tipo === 'sidra') {
      return (
        'https://apisidra.ibge.gov.br/values/t/' +
        cand.tabela +
        '/n1/1/v/' +
        cand.variavel +
        '/p/last%20160'
      )
    }
    // IPEADATA
    return (
      "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='" +
      cand.codigos[0] +
      "')?$top=1600&$orderby=VALDATA%20desc"
    )
  }

  function coletarCandidato(cand, timeoutSegundos) {
    const resp = $http.send({
      url: urlDoCandidato(cand),
      method: 'GET',
      timeout: timeoutSegundos,
      headers: CAB,
    })
    if (!resp || resp.statusCode < 200 || resp.statusCode >= 400) return []
    const body = resp.json
    const arr = cand.tipo === 'ipea' ? (body && body.value ? body.value : []) : body || []
    const coletados = []
    for (let i = 0; i < arr.length; i++) {
      const linha = arr[i]
      if (!linha) continue
      let periodo = ''
      let valor = NaN
      if (cand.tipo === 'bcb') {
        const m = String(linha.data || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (!m) continue
        periodo = m[3] + '-' + m[2]
        valor = parseValor(linha.valor)
      } else if (cand.tipo === 'ipea') {
        const data = String(linha.VALDATA || '')
        if (data.length < 7) continue
        periodo = data.slice(0, 7)
        valor = parseFloat(linha.VALVALOR)
      } else {
        if (linha.V === 'Valor' || linha.VL === 'Valor') continue
        valor = parseFloat(linha.V != null ? linha.V : linha.VL)
        const s = String(linha.D3C || linha.D2C || linha.Periodo || linha.D1C || '')
        let m = s.match(/^(\d{4})(\d{2})-(\d{4})(\d{2})$/)
        if (m) periodo = m[1] + '-Q' + Math.ceil(parseInt(m[2], 10) / 3)
        else {
          m = s.match(/^(\d{4})(\d{2})$/)
          if (m) {
            const mm = parseInt(m[2], 10)
            periodo = mm === 0 ? m[1] : m[1] + '-' + String(mm).padStart(2, '0')
          } else {
            m = s.match(/^(\d{4})/)
            periodo = m ? m[1] : s
          }
        }
      }
      if (!isFinite(valor) || !periodo) continue
      coletados.push({ periodo: periodo, valor: valor })
    }
    if (cand.tipo === 'ipea') coletados.reverse()
    return coletados
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

  function coletarVivo(item) {
    const candidatos = item.candidatos || []
    for (let i = 0; i < candidatos.length; i++) {
      try {
        const pontos = coletarCandidato(candidatos[i], 8)
        if (pontos.length > 0) {
          const finais = item.agreg === 'mensal_ultimo' ? agregarMensalUltimo(pontos) : pontos
          if (finais.length > 3000) return finais.slice(finais.length - 3000)
          return finais
        }
      } catch (_) {
        // fonte falhou → próximo candidato
      }
    }
    return []
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

  const CATALOGO_CRON = {
    fipezap: {
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 19967 }],
    },
    ibovespa: {
      agreg: 'mensal_ultimo',
      candidatos: [
        { tipo: 'bcb', codigo: 7 },
        { tipo: 'ipea', codigos: ['GM366_IBVSP366'] },
      ],
    },
    ifix: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'ipea', codigos: ['GM366_IFIX366'] }] },
    sp500: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'ipea', codigos: ['GM366_SP500366'] }] },
    dowjones: {
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'ipea', codigos: ['GM366_DJIA366'] }],
    },
    nasdaq: {
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'ipea', codigos: ['GM366_NASDAQ366'] }],
    },
    usd: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 10813 }] },
    eur: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 21619 }] },
    gbp: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 21621 }] },
    jpy: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 21620 }] },
    yuan: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 21623 }] },
    boi_gordo: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 23447 }] },
    soja: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 23448 }] },
    milho: { agreg: 'mensal_ultimo', candidatos: [{ tipo: 'bcb', codigo: 23449 }] },
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
    const item = CATALOGO_CRON[chaves[i]]
    if (!item) continue
    try {
      const pontos = coletarVivo(item)
      if (pontos.length > 0) {
        salvarCache(chaves[i], pontos)
        ok++
      } else {
        console.log('refresh_series_cache: ' + chaves[i] + ' sem pontos na fonte viva')
      }
    } catch (err) {
      console.log('refresh_series_cache: ' + chaves[i] + ' falhou: ' + String(err))
    }
  }
  console.log('refresh_series_cache: ' + ok + '/' + chaves.length + ' séries atualizadas')
})
