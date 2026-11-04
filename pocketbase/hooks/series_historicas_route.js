/**
 * SÉRIES HISTÓRICAS OFICIAIS — proxy backend
 *
 * Mesmo padrão anti-bloqueio do projeto (indicadores_economicos_route.js e
 * fontes_estatisticas_route.js): o navegador NUNCA fala direto com a fonte —
 * toda consulta de série histórica parte daqui.
 *
 * GET /backend/v1/series-historicas?chave=ipca
 *   → { ok, chave, fonteViva, baseInterna, fonte, serie: [{ periodo, valor }], aviso }
 *
 * periodo sai normalizado: 'YYYY-MM' (mensal), 'YYYY-Qn' (trimestral) ou
 * 'YYYY' (anual) — o agrupamento por período é feito no frontend.
 *
 * Diagnóstico da rodada 0.0.539 (a fonte VIVA respondia, mas o frontend
 * descartava a resposta): o BCB aceita "dataInicial=01/01/2014", porém series
 * MENSALISADAS (SGS 7 = Ibovespa, câmbio 10813…) devolvem uma linha POR DIA —
 * até 10 anos de pontos diários ultrapassavam o limite do PocketBase router
 * e a resposta não chegava ao navegador (gráficos sempre vazios/fallback).
 * Correções aplicadas aqui:
 *   1. dataInicial DEFAULT = 01/01/2014 (5 anos é pouco p/ acumulados por ano);
 *      série diária recebe 01/01/{anoAtual-2} (2 anos de dias = 24 pontos
 *      mensais após a agregação 'mensal_ultimo' — payload pequeno e suficiente).
 *   2. TETO DE PONTOS (3000): cada fonte é truncada ao período mais recente
 *      antes de virar resposta — nenhum payload gigante derruba a rota.
 *   3. Todas as séries de MERCADO (Ibovespa, câmbio, Cepea) agora saem da
 *      API SGS do BCB com agreg mensal_ultimo — o IPEADATA (http) respondia
 *      vazio/erro ao vivo para S&P 500/Dow/Nasdaq/IFIX.
 *   4. Resposta compacta: serie truncada ao último N=360 pontos (30 anos
 *      mensais) — janela máxima do seletor de período do frontend.
 *
 * Séries sem API aberta com série (inep, datasus, snis, tesouro, caged,
 * salário mínimo) respondem fonteViva=false — o frontend cai na base interna
 * com o aviso transparente "Base interna — dado aproximado".
 */
routerAdd('GET /backend/v1/series-historicas', (e) => {
  const q = e.requestInfo().query || {}
  const chave = String(q['chave'] || '')
  const timeoutMs = 9000
  const TETO_PONTOS = 3000
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }

  const ANO_INICIO_FIXO = 2014
  const anoAtual = new Date().getFullYear()
  const dataInicioNivel = '01/01/' + ANO_INICIO_FIXO
  const dataInicioDiaria = '01/01/' + (anoAtual - 2)

  const CATALOGO = {
    // — Inflação e correção (variação % mensal) —
    ipca: { tipo: 'bcb', codigo: 433, fonte: 'BCB SGS 433 / IBGE' },
    ipca15: { tipo: 'bcb', codigo: 7478, fonte: 'BCB SGS 7478 / IBGE' },
    igpm: { tipo: 'bcb', codigo: 189, fonte: 'BCB SGS 189 / FGV' },
    igpdi: { tipo: 'bcb', codigo: 190, fonte: 'BCB SGS 190 / FGV' },
    inpc: { tipo: 'bcb', codigo: 188, fonte: 'BCB SGS 188 / IBGE' },
    ipc: { tipo: 'bcb', codigo: 192, fonte: 'BCB SGS 192 / Fipe' },
    // — Taxas —
    selic: { tipo: 'bcb', codigo: 432, fonte: 'BCB SGS 432' },
    cdi: { tipo: 'bcb', codigo: 4391, fonte: 'BCB SGS 4391 / B3' },
    tr: { tipo: 'bcb', codigo: 226, fonte: 'BCB SGS 226' },
    poupanca: { tipo: 'bcb', codigo: 195, fonte: 'BCB SGS 195' },
    tjlp: { tipo: 'bcb', codigo: 254, fonte: 'BCB SGS 254' },
    juros_medio: { tipo: 'bcb', codigo: 20714, fonte: 'BCB SGS 20714' },
    juros_pessoal: { tipo: 'bcb', codigo: 20746, fonte: 'BCB SGS 20746' },
    inadimplencia: { tipo: 'bcb', codigo: 21114, fonte: 'BCB SGS 21114' },
    // — Câmbio (diária → último do mês) —
    usd: { tipo: 'bcb', codigo: 10813, fonte: 'BCB SGS 10813', agreg: 'mensal_ultimo' },
    eur: { tipo: 'bcb', codigo: 21619, fonte: 'BCB SGS 21619', agreg: 'mensal_ultimo' },
    gbp: { tipo: 'bcb', codigo: 21621, fonte: 'BCB SGS 21621', agreg: 'mensal_ultimo' },
    jpy: { tipo: 'bcb', codigo: 21620, fonte: 'BCB SGS 21620', agreg: 'mensal_ultimo' },
    yuan: { tipo: 'bcb', codigo: 21623, fonte: 'BCB SGS 21623', agreg: 'mensal_ultimo' },
    // — Mercado financeiro —
    ibovespa: { tipo: 'bcb', codigo: 7, fonte: 'B3 / BCB SGS 7', agreg: 'mensal_ultimo' },
    fipezap: { tipo: 'bcb', codigo: 19967, fonte: 'BCB SGS 19967 / FipeZap' },
    sp500: {
      tipo: 'ipea',
      codigos: ['JPA366_SP500366', 'GM366_SP500366'],
      fonte: 'IPEA — IPEADATA (S&P 500)',
      agreg: 'mensal_ultimo',
    },
    dowjones: {
      tipo: 'ipea',
      codigos: ['SGS366_DJIA366', 'GM366_DJIA366'],
      fonte: 'IPEA — IPEADATA (Dow Jones)',
      agreg: 'mensal_ultimo',
    },
    nasdaq: {
      tipo: 'ipea',
      codigos: ['SGS366_NASDAQ366', 'GM366_NASDAQ366'],
      fonte: 'IPEA — IPEADATA (Nasdaq)',
      agreg: 'mensal_ultimo',
    },
    ifix: {
      tipo: 'ipea',
      codigos: ['GM366_IFIX366', 'SGS366_IFIX366'],
      fonte: 'IPEA — IPEADATA (IFIX)',
      agreg: 'mensal_ultimo',
    },
    // — Agronegócio (diária → último do mês) —
    boi_gordo: {
      tipo: 'bcb',
      codigo: 23447,
      fonte: 'BCB SGS 23447 / Cepea',
      agreg: 'mensal_ultimo',
    },
    soja: { tipo: 'bcb', codigo: 23448, fonte: 'BCB SGS 23448 / Cepea', agreg: 'mensal_ultimo' },
    milho: { tipo: 'bcb', codigo: 23449, fonte: 'BCB SGS 23449 / Cepea', agreg: 'mensal_ultimo' },
    // — Atividade e emprego (IBGE SIDRA — códigos verificados) —
    pib: { tipo: 'sidra', tabela: 5938, variavel: 216, fonte: 'IBGE SIDRA t5938 (PIB trimestral)' },
    desemprego: {
      tipo: 'sidra',
      tabela: 4099,
      variavel: 4099,
      fonte: 'IBGE SIDRA t4099 (PNAD Contínua)',
    },
    renda_media: {
      tipo: 'sidra',
      tabela: 5932,
      variavel: 5945,
      fonte: 'IBGE SIDRA t5932 (rendimento médio real)',
    },
    producao_industrial: {
      tipo: 'sidra',
      tabela: 8885,
      variavel: 12606,
      fonte: 'IBGE PIM-PF t8885',
    },
    venda_varejo: { tipo: 'sidra', tabela: 8883, variavel: 7169, fonte: 'IBGE PMS t8883' },
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
      const inicio = item.agreg === 'mensal_ultimo' ? dataInicioDiaria : dataInicioNivel
      urls = [
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          item.codigo +
          '/dados?formato=json&dataInicial=' +
          inicio,
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
          "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='" +
            item.codigos[c] +
            "')?$top=1600&$orderby=VALDATA%20desc",
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

  // Teto de resposta: mantém o período mais recente (série em ordem crescente).
  if (pontos.length > TETO_PONTOS) pontos = pontos.slice(pontos.length - TETO_PONTOS)

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
