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
 * Diagnóstico da rodada 0.0.558 (confirmado ao vivo em requests + fontes):
 *   1. Ibovespa: a série SGS 7 do BCData NÃO devolve mais pontos (série morta)
 *      → ?chave=ibovespa respondia ok:true com serie:[] VAZIO. O IPEADATA tem o
 *      Ibovespa vivo (GM366_IBVSP366, atualizado 2026) — agora entra como
 *      candidato de fallback, com o MESMO agreg 'mensal_ultimo' das demais
 *      séries diárias (Selic/CDI/TR/câmbio/Cepea).
 *   2. FipeZap (SGS 19967): a fonte fica LENTA demais e segurava a resposta
 *      inteira (30,1s medidos no log mesmo com timeout de 9s). Agora essa chave
 *      NUNCA consulta a fonte viva dentro do pedido: serve o cache aquecido
 *      (cron refresh_series_cache) ou o snapshot mais recente — e, sem cache
 *      nenhum, a base interna aproximada COM PONTOS (nunca serie vazia).
 *   3. Toda consulta viva tem TIMEOUT INDIVIDUAL curto (5s) e ORÇAMENTO TOTAL
 *      de ~11s por rota: uma fonte lenta não segura mais a resposta.
 *   4. Degradar = SEMPRE com dados: cache vencido → snapshot com aviso
 *      transparente; sem cache → fallback interno embutido; só fica serie:[]
 *      quando nem base interna o indicador tem.
 *   5. Cache em `series_cache` (TTL 6h; FipeZap 26h, aquecida pelo cron
 *      diário) — a maior parte dos pedidos responde instantânea.
 *
 * Séries sem API aberta com série (inep, datasus, snis, tesouro, caged,
 * salário mínimo) continuam respondendo baseInterna=true — o frontend cai na
 * base interna com o aviso transparente "Base interna — dado aproximado".
 */
// IMPORTANTE: forma de DOIS argumentos (método, caminho) — a forma de um
// argumento ('GET /caminho') NÃO registra a rota nesta JSVM: a chamada ao
// vivo devolvia 404 "File not found" (diagnóstico 04/11/2026, requests).
//
// REGRAS DE ESCOPO DA JSVM: callbacks de routerAdd/cronAdd NÃO enxergam
// constantes de nível superior dos arquivos — toda a lógica vive no objeto
// globalThis abaixo (mesmo padrão de buscarContextoIndicadoresBCB no
// indicadores_economicos_route.js), autossuficiente (só builtins).
globalThis.PANORAMA_seriesHistoricasNucleo = (function () {
  const TIMEOUT_FONTE_S = 5 // segundos por FONTE individual
  const ORCAMENTO_TOTAL_MS = 11000 // teto total de consultas vivas por pedido
  const TETO_PONTOS = 3000
  const TTL_PADRAO_MS = 6 * 3600 * 1000 // 6 h
  const TTL_FIPEZAP_MS = 26 * 3600 * 1000 // 26 h (cron diário mantém quente)
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }
  const ANO_INICIO_FIXO = 2014

  // CATALOGO — candidatos em ordem: o PRIMEIRO que devolver pontos vale a série.
  // Toda série diária leva agreg:'mensal_ultimo' (último valor do mês), também
  // nos candidatos de fallback (Ibovespa via IPEADATA é diária).
  const CATALOGO = {
    // — Inflação e correção (variação % mensal) —
    ipca: { fonte: 'BCB SGS 433 / IBGE', candidatos: [{ tipo: 'bcb', codigo: 433 }] },
    ipca15: { fonte: 'BCB SGS 7478 / IBGE', candidatos: [{ tipo: 'bcb', codigo: 7478 }] },
    igpm: { fonte: 'BCB SGS 189 / FGV', candidatos: [{ tipo: 'bcb', codigo: 189 }] },
    igpdi: { fonte: 'BCB SGS 190 / FGV', candidatos: [{ tipo: 'bcb', codigo: 190 }] },
    inpc: { fonte: 'BCB SGS 188 / IBGE', candidatos: [{ tipo: 'bcb', codigo: 188 }] },
    ipc: { fonte: 'BCB SGS 192 / Fipe', candidatos: [{ tipo: 'bcb', codigo: 192 }] },
    // — Taxas (Selic/CDI/TR são DIÁRIAS → colapsadas ao último do mês) —
    selic: {
      fonte: 'BCB SGS 432',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 432 }],
    },
    cdi: {
      fonte: 'BCB SGS 4391 / B3',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 4391 }],
    },
    tr: {
      fonte: 'BCB SGS 226',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 226 }],
    },
    poupanca: { fonte: 'BCB SGS 195', candidatos: [{ tipo: 'bcb', codigo: 195 }] },
    tjlp: { fonte: 'BCB SGS 254', candidatos: [{ tipo: 'bcb', codigo: 254 }] },
    juros_medio: { fonte: 'BCB SGS 20714', candidatos: [{ tipo: 'bcb', codigo: 20714 }] },
    juros_pessoal: { fonte: 'BCB SGS 20746', candidatos: [{ tipo: 'bcb', codigo: 20746 }] },
    inadimplencia: { fonte: 'BCB SGS 21114', candidatos: [{ tipo: 'bcb', codigo: 21114 }] },
    // — Câmbio (diária → último do mês) —
    usd: {
      fonte: 'BCB SGS 10813',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 10813 }],
    },
    eur: {
      fonte: 'BCB SGS 21619',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 21619 }],
    },
    gbp: {
      fonte: 'BCB SGS 21621',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 21621 }],
    },
    jpy: {
      fonte: 'BCB SGS 21620',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 21620 }],
    },
    yuan: {
      fonte: 'BCB SGS 21623',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 21623 }],
    },
    // — Mercado financeiro —
    // SGS 7 (Ibovespa) morreu no BCData: IPEADATA GM366_IBVSP366 é o vivo.
    ibovespa: {
      fonte: 'B3 / Banco Central / IPEADATA',
      agreg: 'mensal_ultimo',
      candidatos: [
        { tipo: 'bcb', codigo: 7 },
        { tipo: 'ipea', codigos: ['GM366_IBVSP366'] },
      ],
    },
    // FipeZap: série correta é a SGS 19967 (mensal), porém a fonte trava.
    // semVivoNoPedido: o pedido NUNCA espera essa fonte — só cache/snapshot.
    fipezap: {
      fonte: 'BCB SGS 19967 / FipeZap',
      ttlMs: TTL_FIPEZAP_MS,
      semVivoNoPedido: true,
      candidatos: [{ tipo: 'bcb', codigo: 19967 }],
    },
    sp500: {
      fonte: 'IPEA — IPEADATA (S&P 500)',
      agreg: 'mensal_ultimo',
      candidatos: [
        {
          tipo: 'ipea',
          codigos: ['GM366_SP500366'],
        },
      ],
    },
    dowjones: {
      fonte: 'IPEA — IPEADATA (Dow Jones)',
      agreg: 'mensal_ultimo',
      candidatos: [
        {
          tipo: 'ipea',
          codigos: ['GM366_DJIA366'],
        },
      ],
    },
    nasdaq: {
      fonte: 'IPEA — IPEADATA (Nasdaq)',
      agreg: 'mensal_ultimo',
      candidatos: [
        {
          tipo: 'ipea',
          codigos: ['GM366_NASDAQ366'],
        },
      ],
    },
    ifix: {
      fonte: 'IPEA — IPEADATA (IFIX)',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'ipea', codigos: ['GM366_IFIX366'] }],
    },
    // — Agronegócio (diária → último do mês) —
    boi_gordo: {
      fonte: 'BCB SGS 23447 / Cepea',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 23447 }],
    },
    soja: {
      fonte: 'BCB SGS 23448 / Cepea',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 23448 }],
    },
    milho: {
      fonte: 'BCB SGS 23449 / Cepea',
      agreg: 'mensal_ultimo',
      candidatos: [{ tipo: 'bcb', codigo: 23449 }],
    },
    // — Atividade e emprego (IBGE SIDRA) —
    pib: {
      fonte: 'IBGE SIDRA t5938 (PIB trimestral)',
      candidatos: [{ tipo: 'sidra', tabela: 5938, variavel: 216 }],
    },
    desemprego: {
      fonte: 'IBGE SIDRA t4099 (PNAD Contínua)',
      candidatos: [{ tipo: 'sidra', tabela: 4099, variavel: 4099 }],
    },
    renda_media: {
      fonte: 'IBGE SIDRA t5932 (rendimento médio real)',
      candidatos: [{ tipo: 'sidra', tabela: 5932, variavel: 5945 }],
    },
    producao_industrial: {
      fonte: 'IBGE PIM-PF t8885',
      candidatos: [{ tipo: 'sidra', tabela: 8885, variavel: 12606 }],
    },
    venda_varejo: {
      fonte: 'IBGE PMS t8883',
      candidatos: [{ tipo: 'sidra', tabela: 8883, variavel: 7169 }],
    },
  }

  // Fallback interno aproximado (último recurso — nunca serie vazia para os
  // índices de mercado/FipeZap). Valores de referência alinhados com a base
  // interna do frontend (services/seriesHistoricas.ts).
  const FALLBACK_ANUAL = {
    ibovespa: [128400, 131200, 134600, 138500, 138500, 138500],
    ifix: [2040, 2055, 2071, 2080, 2080, 2080],
    sp500: [4766, 4796, 5074, 5672, 5672, 5672],
    dowjones: [36187, 37690, 39807, 42630, 42630, 42630],
    nasdaq: [10464, 11394, 16794, 18249, 18249, 18249],
  }

  function pontosAnuaisAproximados(valores) {
    const anoAtual = new Date().getFullYear()
    const pontos = []
    for (let i = 0; i < valores.length; i++) {
      pontos.push({ periodo: String(anoAtual - (valores.length - 1) + i), valor: valores[i] })
    }
    return pontos
  }

  function pontosFipeZapAproximados() {
    // Variação mensal média aproximada por ano (% a.m.) — série de referência
    // interna, claramente rotulada como aproximada no aviso da resposta.
    const mediasAno = {
      2014: 0.55,
      2015: 0.55,
      2016: 0.1,
      2017: 0.05,
      2018: 0.15,
      2019: 0.35,
      2020: 0.3,
      2021: 1.4,
      2022: 1.9,
      2023: 1.1,
      2024: 1.2,
      2025: 1.2,
      2026: 0.65,
    }
    const agora = new Date()
    const pontos = []
    for (let ano = ANO_INICIO_FIXO; ano <= agora.getFullYear(); ano++) {
      const media = mediasAno[ano] || 0.6
      const ultimoMes = ano === agora.getFullYear() ? agora.getMonth() : 11
      for (let mes = 0; mes <= ultimoMes; mes++) {
        pontos.push({
          periodo: ano + '-' + String(mes + 1).padStart(2, '0'),
          valor: Math.round(media * 100) / 100,
        })
      }
    }
    return pontos
  }

  function fallbackInterno(chave) {
    if (chave === 'fipezap') return pontosFipeZapAproximados()
    if (FALLBACK_ANUAL[chave]) return pontosAnuaisAproximados(FALLBACK_ANUAL[chave])
    return []
  }

  function parseValor(s) {
    return parseFloat(String(s == null ? '' : s).replace(',', '.'))
  }

  function periodoSidra(codigo) {
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

  function urlDoCandidato(cand) {
    const anoAtual = new Date().getFullYear()
    if (cand.tipo === 'bcb') {
      const inicio =
        cand.agreg === 'mensal_ultimo' ? '01/01/' + (anoAtual - 2) : '01/01/' + ANO_INICIO_FIXO
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

  // Um candidato = UMA fonte, com o PRÓPRIO timeout (a fonte lenta nunca
  // segura mais do que o seu limite).
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
        periodo = periodoSidra(linha.D3C || linha.D2C || linha.Periodo || linha.D1C)
      }
      if (!isFinite(valor) || !periodo) continue
      coletados.push({ periodo: periodo, valor: valor })
    }
    // IPEADATA ordena desc — reverte para o último valor do mês ficar correto
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

  // Percorre os candidatos com orçamento total limitado — nenhuma combinação
  // de fontes lentas segura a resposta além do orçamento.
  function coletarVivo(item) {
    const inicio = new Date().getTime()
    const candidatos = item.candidatos || []
    for (let i = 0; i < candidatos.length; i++) {
      const restante = ORCAMENTO_TOTAL_MS - (new Date().getTime() - inicio)
      if (restante < 400) break
      const timeoutSegundos = Math.max(1, Math.min(TIMEOUT_FONTE_S, Math.floor(restante / 1000)))
      try {
        const pontos = coletarCandidato(candidatos[i], timeoutSegundos)
        if (pontos.length > 0) {
          let finais = item.agreg === 'mensal_ultimo' ? agregarMensalUltimo(pontos) : pontos
          if (finais.length > TETO_PONTOS) finais = finais.slice(finais.length - TETO_PONTOS)
          return finais
        }
      } catch (_) {
        // fonte falhou/estourou o tempo → tenta o próximo candidato
      }
    }
    return []
  }

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
      return { ts: ts, pontos: obj.serie }
    } catch (_) {
      return null
    }
  }

  function salvarCache(chave, pontos) {
    try {
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
      rec.set('fonte', 'backend/v1/series-historicas')
      rec.set('fetched_at', agora)
      $app.save(rec)
    } catch (err) {
      console.log('series-historicas: erro ao salvar cache de ' + chave + ': ' + String(err))
    }
  }

  function formatar(chave, item, fonteViva, baseInterna, pontos, aviso) {
    return {
      ok: true,
      chave: chave,
      fonteViva: fonteViva,
      baseInterna: baseInterna,
      fonte: item ? item.fonte : '',
      serie: pontos,
      aviso: aviso,
    }
  }

  function resolver(chave) {
    chave = String(chave || '')
    const item = CATALOGO[chave]
    if (!item) {
      return formatar(
        chave,
        null,
        false,
        true,
        [],
        'Série disponível apenas na base interna aproximada do sistema.',
      )
    }

    const ttl = item.ttlMs || TTL_PADRAO_MS
    const cache = lerCache(chave)
    const idadeOk = cache !== null && new Date().getTime() - cache.ts < ttl
    if (idadeOk) return formatar(chave, item, true, false, cache.pontos, '')

    // FipeZap: o pedido NUNCA espera a fonte lenta — só cache/snapshot/fallback.
    if (!item.semVivoNoPedido) {
      let vivos = []
      try {
        vivos = coletarVivo(item)
      } catch (_) {
        vivos = []
      }
      if (vivos.length > 0) {
        salvarCache(chave, vivos)
        return formatar(chave, item, true, false, vivos, '')
      }
    }

    // Cache vencido ainda vale: snapshot oficial anterior, COM dados.
    if (cache) {
      const dataSnap = String(new Date(cache.ts).toISOString()).slice(0, 10)
      return formatar(
        chave,
        item,
        false,
        true,
        cache.pontos,
        'Fonte oficial indisponível neste momento — exibindo o último snapshot oficial captado pelo servidor em ' +
          dataSnap +
          '.',
      )
    }

    const fb = fallbackInterno(chave)
    if (fb.length > 0) {
      return formatar(
        chave,
        item,
        false,
        true,
        fb,
        'Fonte oficial indisponível neste momento — exibindo a base interna aproximada do sistema (valores de referência, não oficiais).',
      )
    }

    return formatar(
      chave,
      item,
      false,
      true,
      [],
      'Fonte oficial indisponível neste momento — exibindo a base interna aproximada do sistema.',
    )
  }

  function atualizar(chave) {
    const item = CATALOGO[String(chave || '')]
    if (!item) return 0
    let pontos = []
    try {
      pontos = coletarVivo(item)
    } catch (err) {
      console.log('series-historicas: atualização de ' + chave + ' falhou: ' + String(err))
      return 0
    }
    if (pontos.length === 0) return 0
    salvarCache(chave, pontos)
    return pontos.length
  }

  return { resolver: resolver, atualizar: atualizar }
})()

// REGRA ANTI-ERRO (contrato da aba Histórico): a rota JAMAIS responde com erro
// HTTP — toda exceção é absorvida e o frontend recebe 200 com a base interna
// (ou cache) e aviso transparente. Diagnóstico 0.0.559: exceção dentro do
// callback (ex.: cadeia de mercado) virava 400 "Something went wrong" no
// navegador e o frontend nem chegava a receber o fallback.
routerAdd('GET', '/backend/v1/series-historicas', (e) => {
  let resposta = null
  try {
    const q = e.requestInfo().query || {}
    resposta = globalThis.PANORAMA_seriesHistoricasNucleo.resolver(q['chave'] || '')
  } catch (err) {
    console.log('series-historicas: falha no resolver: ' + String(err))
    resposta = null
  }
  if (!resposta || !Array.isArray(resposta.serie)) {
    resposta = {
      ok: true,
      chave: String((e.requestInfo().query || {})['chave'] || ''),
      fonteViva: false,
      baseInterna: true,
      fonte: 'Base interna do sistema',
      serie: [],
      aviso: 'Base interna — dado aproximado (fonte indisponível)',
    }
  }
  return e.json(200, resposta)
})
