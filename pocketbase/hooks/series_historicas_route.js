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
    let url
    if (item.tipo === 'bcb') {
      url =
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
        item.codigo +
        '/dados?formato=json&dataInicial=01/01/2014'
    } else {
      url =
        'https://apisidra.ibge.gov.br/values/t/' +
        item.tabela +
        '/n1/1/v/' +
        item.variavel +
        '/p/last%20160'
    }
    const resp = $http.send({ url: url, method: 'GET', timeout: timeoutMs, headers: CAB })
    const arr = resp.json || []
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
      } else {
        if (linha.V === 'Valor' || linha.VL === 'Valor') continue
        valor = parseFloat(linha.V != null ? linha.V : linha.VL)
        periodo = periodoSidra(linha.D3C || linha.D2C || linha.Periodo || linha.D1C)
      }
      if (!isFinite(valor) || !periodo) continue
      pontos.push({ periodo: periodo, valor: valor })
    }
  } catch (err) {
    pontos = []
  }

  // Séries diárias (câmbio, Cepea) colapsadas para o último valor do mês.
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
