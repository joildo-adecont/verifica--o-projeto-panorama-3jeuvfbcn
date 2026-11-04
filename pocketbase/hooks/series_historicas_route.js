/**
 * SÉRIES HISTÓRICAS OFICIAIS — proxy backend
 *
 * Mesmo padrão anti-bloqueio do projeto (indicadores_economicos_route.js e
 * fontes_estatisticas_route.js): o navegador NUNCA fala direto com a fonte —
 * toda consulta de série histórica parte daqui.
 *
 * GET /backend/v1/series-historicas?chave=ipca
 *   → { ok, chave, fonteViva, baseInterna, serie: [{ periodo, valor }], aviso }
 *
 * periodo sai normalizado: 'YYYY-MM' (mensal), 'YYYY-Qn' (trimestral) ou
 * 'YYYY' (anual) — o agrupamento por período é feito no frontend.
 *
 * Janela padrão: BCB desde 01/01/2014 (dados?dataInicial=...) e SIDRA
 * p/last 160 — séries suficientes para acumulados por ano e por período
 * escolhido pelo usuário, sem payload gigante.
 *
 * Séries sem API aberta com série (inep, datasus, snis, tesouro, caged,
 * salário mínimo) respondem fonteViva=false — o frontend cai na base interna
 * com o aviso transparente "Base interna — dado aproximado".
 *
 * Séries de mercado (sp500, dowjones, nasdaq, ifix) usam a API OData do
 * IPEADATA com lista de códigos candidatos: o primeiro código que responder
 * com pontos vale a série; se nenhum responder, fonteViva=false (fallback
 * base interna com aviso, nunca erro cru).
 */
routerAdd('GET /backend/v1/series-historicas', (e) => {
  const q = e.requestInfo().query || {}
  const chave = String(q['chave'] || '')
  const timeoutMs = 9000
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }

  const CATALOGO = {
    ipca: { tipo: 'bcb', codigo: 433, fonte: 'BCB SGS 433 / IBGE' },
    igpm: { tipo: 'bcb', codigo: 189, fonte: 'BCB SGS 189 / FGV' },
    inpc: { tipo: 'bcb', codigo: 188, fonte: 'BCB SGS 188 / IBGE' },
    ipc: { tipo: 'bcb', codigo: 192, fonte: 'BCB SGS 192 / Fipe' },
    selic: { tipo: 'bcb', codigo: 432, fonte: 'BCB SGS 432' },
    cdi: { tipo: 'bcb', codigo: 4391, fonte: 'BCB SGS 4391 / B3' },
    tr: { tipo: 'bcb', codigo: 226, fonte: 'BCB SGS 226' },
    poupanca: { tipo: 'bcb', codigo: 195, fonte: 'BCB SGS 195' },
    usd: { tipo: 'bcb', codigo: 10813, fonte: 'BCB SGS 10813', agreg: 'mensal_ultimo' },
    eur: { tipo: 'bcb', codigo: 21619, fonte: 'BCB SGS 21619', agreg: 'mensal_ultimo' },
    gbp: { tipo: 'bcb', codigo: 21621, fonte: 'BCB SGS 21621', agreg: 'mensal_ultimo' },
    jpy: { tipo: 'bcb', codigo: 21620, fonte: 'BCB SGS 21620', agreg: 'mensal_ultimo' },
    fipezap: { tipo: 'bcb', codigo: 19967, fonte: 'BCB SGS 19967 / FipeZap' },
    tjlp: { tipo: 'bcb', codigo: 254, fonte: 'BCB SGS 254' },
    boi_gordo: {
      tipo: 'bcb',
      codigo: 23447,
      fonte: 'BCB SGS 23447 / Cepea',
      agreg: 'mensal_ultimo',
    },
    soja: { tipo: 'bcb', codigo: 23448, fonte: 'BCB SGS 23448 / Cepea', agreg: 'mensal_ultimo' },
    milho: { tipo: 'bcb', codigo: 23449, fonte: 'BCB SGS 23449 / Cepea', agreg: 'mensal_ultimo' },
    pib: { tipo: 'sidra', tabela: 5938, variavel: 216, fonte: 'IBGE SIDRA t5938' },
    desemprego: { tipo: 'sidra', tabela: 4099, variavel: 4099, fonte: 'IBGE SIDRA t4099' },
    renda_media: { tipo: 'sidra', tabela: 5935, variavel: 6034, fonte: 'IBGE SIDRA t5935' },
    populacao_ocupada: { tipo: 'sidra', tabela: 4099, variavel: 4091, fonte: 'IBGE SIDRA t4099' },
    agro_producao: { tipo: 'sidra', tabela: 6588, variavel: 109, fonte: 'IBGE SIDRA t6588' },
    sp500: {
      tipo: 'ipea',
      codigos: ['JPA366_SP500366', 'SGS366_SP500366', 'GM366_SP500366', 'JPA366_SP500'],
      fonte: 'IPEA — IPEADATA (S&P 500)',
      agreg: 'mensal_ultimo',
    },
    dowjones: {
      tipo: 'ipea',
      codigos: ['SGS366_DJIA366', 'JPA366_DJIA366', 'GM366_DJIA366'],
      fonte: 'IPEA — IPEADATA (Dow Jones)',
      agreg: 'mensal_ultimo',
    },
    nasdaq: {
      tipo: 'ipea',
      codigos: ['SGS366_NASDAQ366', 'JPA366_NASDAQ366', 'GM366_NASDAQ366'],
      fonte: 'IPEA — IPEADATA (Nasdaq)',
      agreg: 'mensal_ultimo',
    },
    ifix: {
      tipo: 'ipea',
      codigos: ['GM366_IFIX366', 'SGS366_IFIX366', 'JPA366_IFIX366', 'GM12_IFIX'],
      fonte: 'IPEA — IPEADATA (IFIX)',
      agreg: 'mensal_ultimo',
    },
  }

  const periodoSidra = (codigo) => {
    const s = String(codigo || '')
    let m = s.match(/^(\d{4})(\d{2})-(\d{4})(\d{2})$/)
    if (m) return m[1] + '-Q' + Math.ceil(parseInt(m[2], 10) / 3)
    m = s.match(/^(\d{4})(\d{2})$/)
    if (m) {
      const mm = parseInt(m[2], 10)
      return mm === 0 ? m[1] : m[1] + '-' + String(mm).padStart(2, '0')
    }
    m = s.match(/^(\d{4})/)
    return m ? m[1] : s
  }

  const item = CATALOGO[chave]
  if (!item) {
    return e.json(200, {
      ok: true,
      chave: chave,
      fonteViva: false,
      baseInterna: true,
      fonte: '',
      serie: [],
      aviso: 'Série disponível apenas na base interna aproximada do sistema.',
    })
  }

  let pontos = []
  try {
    let urls = []
    if (item.tipo === 'bcb') {
      urls = [
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          item.codigo +
          '/dados?formato=json&dataInicial=01/01/2014',
      ]
    } else if (item.tipo === 'sidra') {
      urls = [
        'https://apisidra.ibge.gov.br/values/t/' +
          item.tabela +
          '/n1/1/v/' +
          item.variavel +
          '/p/last%20160',
      ]
    } else {
      // IPEADATA — tenta os códigos candidatos em ordem, para no primeiro que responder
      for (let c = 0; c < item.codigos.length; c++) {
        urls.push(
          "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='" +
            item.codigos[c] +
            "')?$top=4000&$orderby=VALDATA%20desc",
        )
      }
    }

    for (let u = 0; u < urls.length && pontos.length === 0; u++) {
      const resp = $http.send({ url: urls[u], method: 'GET', timeout: timeoutMs, headers: CAB })
      const body = resp.json
      const arr = item.tipo === 'ipea' ? (body && body.value ? body.value : []) : body || []
      const coletados = []
      for (let i = 0; i < arr.length; i++) {
        const linha = arr[i]
        if (!linha) continue
        let periodo = ''
        let valor = NaN
        if (item.tipo === 'bcb') {
          const data = String(linha.data || '')
          const m = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
          if (!m) continue
          periodo = m[3] + '-' + m[2]
          valor = parseFloat(String(linha.valor || '').replace(',', '.'))
        } else if (item.tipo === 'ipea') {
          const data = String(linha.VALDATA || '')
          if (data.length < 7) continue
          periodo = data.slice(0, 7)
          valor = parseFloat(linha.VALVALOR)
        } else {
          if (linha.V === 'Valor' || linha.VL === 'Valor') continue
          valor = parseFloat(linha.V != null ? linha.V : linha.VL)
          periodo = periodoSidra(linha.D3C || linha.D2C || linha.Periodo || linha.D1C)
        }
        if (!isFinite(valor) || !periodo) continue
        coletados.push({ periodo: periodo, valor: valor })
      }
      // IPEADATA ordena desc — reverte para o último valor do mês ser o mais recente
      if (item.tipo === 'ipea') coletados.reverse()
      pontos = coletados
    }
  } catch (err) {
    pontos = []
  }

  // Séries diárias (câmbio, Cepea, bolsa) colapsadas para o último valor do mês.
  if (item.agreg === 'mensal_ultimo' && pontos.length > 0) {
    const porMes = {}
    const ordem = []
    for (let i = 0; i < pontos.length; i++) {
      const p = pontos[i]
      if (!porMes[p.periodo]) ordem.push(p.periodo)
      porMes[p.periodo] = p.valor
    }
    pontos = ordem.map(function (k) {
      return { periodo: k, valor: porMes[k] }
    })
  }

  const viva = pontos.length > 0
  return e.json(200, {
    ok: true,
    chave: chave,
    fonteViva: viva,
    baseInterna: !viva,
    fonte: item.fonte,
    serie: pontos,
    aviso: viva
      ? ''
      : 'Fonte oficial indisponível neste momento — exibindo a base interna aproximada do sistema.',
  })
})
