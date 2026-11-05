/**
 * SÉRIES HISTÓRICAS OFICIAIS — proxy backend
 *
 * GET /backend/v1/series-historicas?chave=ipca
 *   → { ok, chave, fonteViva, baseInterna, fonte, serie: [{ periodo, valor }], aviso }
 *
 * HISTÓRICO DO BUG (regressão v0.0.562, confirmado ao vivo em requests + hooks):
 *   o callback do routerAdd passou a chamar globalThis.PANORAMA_seriesHistoricasNucleo,
 *   mas a JSVM executa callbacks de router/cron em POOL SEPARADO — a atribuição
 *   feita no nível superior do arquivo NÃO existe lá ("Cannot read property
 *   'resolver' of undefined or null" nos logs hooks). O guard externo mascarava
 *   o erro devolvendo 200 com serie:[] VAZIO em TODAS as chaves, inclusive
 *   ipca/selic/usd que funcionavam na v0.0.561.
 *
 * CORREÇÃO (regressão v0.0.563): TODO o núcleo vive DENTRO do callback do
 * routerAdd — nenhum símbolo de nível superior é referenciado no callback
 * (exigência do validador de deploy: "Move all logic inline inside the
 * callback body"). O cron refresh_series_cache.js, que roda em outro pool,
 * recebeu cópia inline própria dos coletores.
 *
 * CONTRATO ABSOLUTO: NUNCA serie:[] — qualquer caminho de falha degrada COM
 * pontos: fonte viva → cache → snapshot → base interna (mercado: FALLBACK_ANUAL;
 * inflação/taxas/câmbio: âncoras mensais internas) — sempre com aviso transparente.
 *
 * Regras intocáveis mantidas: routerAdd com 2 argumentos; FipeZap
 * semVivoNoPedido (só cache do cron); Ibovespa via IPEADATA GM366_IBVSP366.
 *
 * CORREÇÃO v0.0.567 (completar índices de mercado, confirmado ao vivo):
 * 1. IPEADATA paginado por JANELAS de VALDATA ($filter ge/lt, 3 anos), do
 *    mais recente para o mais antigo e ordenado no fim — o $orderby global
 *    não é honrado e $top=1600 devolvia a página ASCENDENTE (Ibovespa
 *    parava em set/2019).
 * 2. Chaves de mercado (ibovespa/ifix/sp500/dowjones/nasdaq): timeout
 *    individual 15s, orçamento 40s e TTL 26h — as séries GM366_* geradas
 *    pela API respondem devagar (estouravam 5s); o cron refresh_series_cache
 *    aquece o cache das 5 todo dia 03:20 UTC.
 * 3. Parâmetro ?reteste=1 fura o cache e força coleta viva (validação).
 *
 * CORREÇÃO v0.0.568 (índices globais com fonte viva): os códigos IPEADATA
 * GM366_SP500366/GM366_DJIA366/GM366_NASDAQ366 NÃO EXISTEM no catálogo
 * (Metadados('X') devolve vazio, comprovado um a um — a API não aceita busca
 * por nome). S&P 500, Dow Jones e Nasdaq passam a usar Stooq (CSV mensal,
 * sem chave, ^spx/^dji/^ndx) como PRIMEIRO candidato vivo, com o candidato
 * IPEA mantido por trás caso a série venha a existir. IFIX não tem código
 * vivo comprovado (IPEA nem SGS): mantém a degradação para a base interna
 * com aviso — nunca série vazia.
 *
 * CORREÇÃO v0.0.585 (latência + fonte global alternativa):
 * 1. Stooq é INALCANÇÁVEL do backend (logs hooks: "context deadline exceeded"
 *    em TODAS as tentativas) e, com timeout longo, pendurava a rota 30s+.
 * 2. sp500/dowjones/nasdaq tentam agora o Yahoo Finance chart API (sem chave,
 *    %5EGSPC/%5EDJI/%5EIXIC, interval=1mo&range=15y) como PRIMEIRO candidato
 *    vivo, com timeout CURTO (5s). Stooq fica ATRÁS (pode voltar a responder)
 *    e o IPEA por último. Falha de todos → base interna com aviso.
 * 3. ORÇAMENTO TOTAL de 15s por chave global (soma de TODOS os candidatos) —
 *    mesmo com todas as fontes mortas a resposta sai em ~15s com pontos.
 *    Ibovespa mantém o padrão provado ao vivo (IPEA janelado, TTL 26h).
 *
 * CORREÇÃO v0.0.586 (IFIX com fonte viva): o candidato IFIX.SA do Yahoo
 * Finance chart API RESPONDE ao vivo (metadados + close mensal de 3558,43),
 * mas só entrega 1 ponto (o mês corrente) em interval=1mo&range=15y, com
 * period1/period2 e range=max — série histórica indisponível na fonte.
 * Fonte viva = B3 indexStatisticsProxy IndexCall/GetPortfolioDay (sem chave,
 * sem autenticação, JSON puro): payload base64 {"index":"IFIX","year":"AAAA",
 * "language":"pt-br"} devolve a MATRIZ DIÁRIA do ano (results[].rateValue1..12,
 * valores com ponto de milhar e vírgula decimal). Coletados os anos desde
 * 2014, o último pregão de cada mês vira a série mensal (mensal_ultimo).
 * Falha de todos → base interna com aviso, nunca série vazia.
 */
routerAdd('GET', '/backend/v1/series-historicas', (e) => {
  // ------------------------------------------------------------------
  // 1. FALLBACKS DE ÚLTIMA INSTÂNCIA (puro JS — fora do try, o guard
  //    externo SEMPRE consegue montar pontos com eles).
  // ------------------------------------------------------------------
  const ANO_INICIO_FIXO = 2014

  // Índices de mercado — 6 pontos anuais (2014..ano corrente é gerado dinamicamente)
  const FALLBACK_ANUAL = {
    ibovespa: [128400, 131200, 134600, 138500, 138500, 138500],
    ifix: [2040, 2055, 2071, 2080, 2080, 2080],
    sp500: [4766, 4796, 5074, 5672, 5672, 5672],
    dowjones: [36187, 37690, 39807, 42630, 42630, 42630],
    nasdaq: [10464, 11394, 16794, 18249, 18249, 18249],
    ibge_populacao: [210147125, 211755692, 212583750, 213317639, 213317639, 213317639],
    ibge_pms: [105.2, 107.4, 108.9, 110.8, 110.8, 110.8],
    ibge_construcao: [118.4, 120.2, 121.8, 123.4, 123.4, 123.4],
  }

  // Inflação/taxas/câmbio — âncora anual ⇒ pontos MENSAIS aproximados
  // (valores médios de referência, claramente rotulados como aproximados).
  const ANCORAS_MENSAL = {
    ipca: [0.55, 0.95, 0.7, 0.35, 0.3, 0.35, 0.25, 0.85, 0.95, 0.45, 0.4, 0.45, 0.35],
    ipca15: [0.5, 0.9, 0.65, 0.3, 0.25, 0.3, 0.2, 0.8, 0.9, 0.4, 0.35, 0.4, 0.3],
    igpm: [0.4, 1.2, 0.9, 0.2, 0.5, 0.4, 0.5, 1.0, 1.2, 0.3, 0.6, 0.6, 0.4],
    igpdi: [0.4, 1.15, 0.85, 0.25, 0.5, 0.4, 0.5, 1.0, 1.15, 0.35, 0.55, 0.55, 0.4],
    inpc: [0.5, 0.95, 0.7, 0.35, 0.3, 0.35, 0.25, 0.85, 0.95, 0.45, 0.4, 0.45, 0.35],
    ipc: [0.45, 0.9, 0.65, 0.3, 0.3, 0.3, 0.25, 0.75, 0.9, 0.4, 0.35, 0.4, 0.3],
    selic: [0.9, 1.1, 1.1, 0.7, 0.55, 0.4, 0.25, 0.35, 0.85, 1.05, 0.9, 1.0, 1.0],
    cdi: [0.88, 1.05, 1.08, 0.68, 0.53, 0.39, 0.23, 0.33, 0.82, 1.02, 0.88, 0.98, 0.98],
    tr: [0.1, 0.2, 0.15, 0.08, 0.06, 0.05, 0.04, 0.08, 0.25, 0.35, 0.4, 0.45, 0.45],
    poupanca: [0.55, 0.7, 0.6, 0.45, 0.4, 0.3, 0.25, 0.35, 0.65, 0.75, 0.65, 0.7, 0.7],
    tjlp: [0.6, 0.8, 0.9, 0.5, 0.4, 0.35, 0.25, 0.3, 0.7, 0.8, 0.7, 0.75, 0.75],
    juros_medio: [3.5, 3.7, 3.6, 3.3, 3.2, 3.1, 3.0, 3.2, 3.5, 3.8, 4.0, 4.1, 4.0],
    juros_pessoal: [4.5, 4.8, 4.9, 4.6, 4.5, 4.4, 4.3, 4.5, 4.9, 5.2, 5.4, 5.5, 5.4],
    inadimplencia: [3.0, 3.5, 3.8, 3.2, 2.8, 2.6, 2.8, 2.9, 2.6, 3.0, 3.1, 3.0, 3.0],
    usd: [2.35, 3.35, 3.5, 3.2, 3.65, 3.95, 5.2, 5.4, 5.15, 5.0, 5.45, 5.85, 5.45],
    eur: [3.05, 3.7, 3.85, 3.55, 4.25, 4.4, 5.9, 6.1, 5.55, 5.45, 5.95, 6.35, 5.95],
    gbp: [3.9, 4.65, 4.6, 4.1, 4.75, 4.9, 6.6, 7.0, 6.4, 6.3, 6.9, 7.3, 6.9],
    jpy: [
      0.0225, 0.0275, 0.0305, 0.0285, 0.0325, 0.0355, 0.0485, 0.0485, 0.0375, 0.0365, 0.0345,
      0.0365, 0.0355,
    ],
    yuan: [0.38, 0.52, 0.54, 0.5, 0.57, 0.58, 0.75, 0.85, 0.76, 0.72, 0.78, 0.82, 0.77],
  }

  function pontosAnuaisAproximados(valores) {
    const anoAtual = new Date().getFullYear()
    const pontos = []
    for (let i = 0; i < valores.length; i++) {
      pontos.push({ periodo: String(anoAtual - (valores.length - 1) + i), valor: valores[i] })
    }
    return pontos
  }

  function pontosMensaisAproximados(ancoras) {
    const agora = new Date()
    const pontos = []
    for (let ano = ANO_INICIO_FIXO; ano <= agora.getFullYear(); ano++) {
      const anchor = ancoras[ano - ANO_INICIO_FIXO]
      if (anchor === undefined) continue
      const ultimoMes = ano === agora.getFullYear() ? agora.getMonth() : 11
      for (let mes = 0; mes <= ultimoMes; mes++) {
        pontos.push({
          periodo: ano + '-' + String(mes + 1).padStart(2, '0'),
          valor: anchor,
        })
      }
    }
    return pontos
  }

  function fallbackUltimaInstancia(chave) {
    if (FALLBACK_ANUAL[chave]) return pontosAnuaisAproximados(FALLBACK_ANUAL[chave])
    if (ANCORAS_MENSAL[chave]) return pontosMensaisAproximados(ANCORAS_MENSAL[chave])
    return []
  }

  // ------------------------------------------------------------------
  // 2. PARÂMETROS DO PEDIDO + NÚCLEO (todo inline no callback)
  // ------------------------------------------------------------------
  let q = {}
  try {
    q = (e.requestInfo && e.requestInfo().query) || {}
  } catch (_) {
    q = {}
  }
  const chave = String(q['chave'] || q['serie'] || '')
  // reteste=1 (validação): fura o cache e força a coleta viva.
  const forcarVivo = q['reteste'] === '1' || q['reteste'] === 'true'

  let resposta = null
  try {
    const TIMEOUT_FONTE_S = 5 // segundos por FONTE individual
    const ORCAMENTO_TOTAL_MS = 11000 // teto total de consultas vivas por pedido
    const TETO_PONTOS = 3000
    const TTL_PADRAO_MS = 6 * 3600 * 1000 // 6 h
    const TTL_FIPEZAP_MS = 26 * 3600 * 1000 // 26 h (cron diário mantém quente)
    // Chaves GLOBAIS (sp500/dowjones/nasdaq): fontes externas sem chave
    // (Yahoo/Stooq) com timeout CURTO por candidato e ORÇAMENTO TOTAL de 15s
    // — o pior caso (todas as fontes mortas) responde em ~15s, nunca 30s+.
    const TIMEOUT_GLOBAL_S = 5
    const ORCAMENTO_GLOBAL_MS = 15000
    const TTL_MERCADO_MS = 26 * 3600 * 1000 // 26 h
    // Ibovespa: IPEADATA janelado responde devagar — padrão provado ao vivo
    // mantido (timeout 15s/orçamento 40s), aquecido pelo cron (TTL 26h).
    const TIMEOUT_MERCADO_S = 15
    const ORCAMENTO_MERCADO_MS = 40000
    const CAB = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json,text/plain,*/*',
    }

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
        ttlMs: TTL_MERCADO_MS,
        timeoutS: TIMEOUT_MERCADO_S,
        orcamentoMs: ORCAMENTO_MERCADO_MS,
        candidatos: [
          { tipo: 'ipea', codigos: ['GM366_IBVSP366'] },
          { tipo: 'bcb', codigo: 7 },
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
      // S&P 500 / Dow Jones / Nasdaq: os códigos IPEADATA GM366_* NÃO existem
      // no catálogo (Metadados('X') vazio, comprovado 05/11) e o Stooq é
      // INALCANÇÁVEL do backend (context deadline exceeded). Fonte viva =
      // Yahoo Finance chart API (sem chave), timeout CURTO, orçamento TOTAL
      // de 15s; Stooq fica atrás (pode voltar a responder) e o IPEA por
      // último. Falha de todos → base interna com aviso, nunca série vazia.
      sp500: {
        fonte: 'S&P Dow Jones Indices / Yahoo Finance',
        agreg: 'mensal_ultimo',
        ttlMs: TTL_MERCADO_MS,
        timeoutS: TIMEOUT_GLOBAL_S,
        orcamentoMs: ORCAMENTO_GLOBAL_MS,
        candidatos: [
          { tipo: 'yahoo', simbolo: '%5EGSPC' },
          { tipo: 'stooq', simbolo: '%5Espx' },
          { tipo: 'ipea', codigos: ['GM366_SP500366'] },
        ],
      },
      dowjones: {
        fonte: 'S&P Dow Jones Indices / Yahoo Finance',
        agreg: 'mensal_ultimo',
        ttlMs: TTL_MERCADO_MS,
        timeoutS: TIMEOUT_GLOBAL_S,
        orcamentoMs: ORCAMENTO_GLOBAL_MS,
        candidatos: [
          { tipo: 'yahoo', simbolo: '%5EDJI' },
          { tipo: 'stooq', simbolo: '%5Edji' },
          { tipo: 'ipea', codigos: ['GM366_DJIA366'] },
        ],
      },
      nasdaq: {
        fonte: 'Nasdaq / Yahoo Finance',
        agreg: 'mensal_ultimo',
        ttlMs: TTL_MERCADO_MS,
        timeoutS: TIMEOUT_GLOBAL_S,
        orcamentoMs: ORCAMENTO_GLOBAL_MS,
        candidatos: [
          { tipo: 'yahoo', simbolo: '%5EIXIC' },
          { tipo: 'stooq', simbolo: '%5Endx' },
          { tipo: 'ipea', codigos: ['GM366_NASDAQ366'] },
        ],
      },
      // IFIX: sem código vivo no IPEADATA (comprovado) nem no BCB SGS. Fonte
      // viva = B3 indexStatisticsProxy (GetPortfolioDay por ano, sem chave) —
      // provada ao vivo em 05/11. O Yahoo IFIX.SA RESPONDE mas só devolve
      // 1 ponto (o mês corrente) em qualquer intervalo/range/period — um
      // candidato de 1 ponto marcaria a chave como fonteViva com série
      // degenerada, pior que a base interna de 6 pontos: NÃO entra. O IPEA
      // fica por último, caso a série venha a existir. Falha de todos →
      // base interna com aviso, nunca série vazia.
      ifix: {
        fonte: 'B3 — IFIX',
        agreg: 'mensal_ultimo',
        ttlMs: TTL_MERCADO_MS,
        timeoutS: TIMEOUT_GLOBAL_S,
        orcamentoMs: ORCAMENTO_GLOBAL_MS,
        candidatos: [
          { tipo: 'b3indice', indice: 'IFIX' },
          { tipo: 'ipea', codigos: ['GM366_IFIX366'] },
        ],
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
      // — IBGE Fontes Estatísticas — População, Serviços (PMS) e Construção Civil —
      ibge_populacao: {
        fonte: 'IBGE SIDRA t6579 (População residente)',
        candidatos: [{ tipo: 'sidra', tabela: 6579, variavel: 9324 }],
      },
      ibge_pms: {
        fonte: 'IBGE SIDRA t6455 (PMS - Volume de Serviços)',
        candidatos: [{ tipo: 'sidra', tabela: 6455, variavel: 8677 }],
      },
      ibge_construcao: {
        fonte: 'IBGE SIDRA t5906 (Produção da Construção Civil)',
        candidatos: [{ tipo: 'sidra', tabela: 5906, variavel: 7167, classif: 'c11046/56726' }],
      },
    }

    function parseValor(s) {
      return parseFloat(String(s == null ? '' : s).replace(',', '.'))
    }

    // Números da B3 vêm em pt-BR como TEXTO: "1.282" (milhar com ponto) e
    // "3.500,44" (decimal com vírgula). O parseValor comum engole o ponto de
    // milhar (devolvia 1,282 em vez de 1.282 pontos) — parser próprio. A
    // matriz também pode chegar como número FRACIONÁRIO (1.282 = 1.282
    // pontos em milhares): valor < 100 é fração de mil pontos → ×1000 (o
    // IFIX nunca negociou abaixo de 1.000 pontos desde 2014).
    function parseValorB3(bruto) {
      let v =
        typeof bruto === 'number'
          ? isFinite(bruto)
            ? bruto
            : NaN
          : (() => {
              const s = String(bruto == null ? '' : bruto).trim()
              if (s === '') return NaN
              return parseFloat(s.replace(/\./g, '').replace(',', '.'))
            })()
      if (isFinite(v) && v > 0 && v < 100) v = v * 1000
      return v
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

    // `agreg` vem do ITEM (não do candidato): séries DIÁRIAS do BCB aceitam
    // no máximo 10 anos de janela — pedidos com dataInicial=01/2014 devolvem
    // erro "no máximo 10 anos" e a chave ficava sem pontos (diagnóstico
    // 05/11, logs hooks + resposta textual do BCData). Diárias são buscadas
    // em janelas de 5 anos (coletarCandidato); mensais/trimestrais usam 2014.
    function urlDoCandidato(cand, agreg) {
      const anoAtual = new Date().getFullYear()
      if (cand.tipo === 'bcb') {
        const inicio =
          agreg === 'mensal_ultimo' ? '01/01/' + (anoAtual - 2) : '01/01/' + ANO_INICIO_FIXO
        return (
          'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          cand.codigo +
          '/dados?formato=json&dataInicial=' +
          inicio
        )
      }
      if (cand.tipo === 'sidra') {
        const classif = cand.classif ? '/' + cand.classif : ''
        return (
          'https://apisidra.ibge.gov.br/values/t/' +
          cand.tabela +
          '/n1/1/v/' +
          cand.variavel +
          '/p/last%20160' +
          classif
        )
      }
      if (cand.tipo === 'stooq') {
        return (
          'https://stooq.com/q/d/l/?s=' +
          cand.simbolo +
          '&i=m&d1=' +
          ANO_INICIO_FIXO +
          '0101&d2=' +
          (anoAtual + 1) +
          '0101'
        )
      }
      // IPEADATA — JANELAS de VALDATA ($filter ge/lt, 3 anos por pedido),
      // do MAIS RECENTE para o mais antigo. Confirmado ao vivo (05/11): a
      // API NÃO honra $orderby com $filter e o $top=1600 devolvia a página
      // ASCENDENTE (Ibovespa parava em set/2019). A ordem é corrigida no fim.
      // dataInicial opcional corta janelas mais antigas que o início da série.
      return {
        base:
          "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='" +
          cand.codigos[0] +
          "')",
        dataInicial: cand.dataInicial || '',
      }
    }

    function escapeOdataData(iso) {
      // VALDATA comparado com datetime ISO — o IPEADATA aceita '2020-01-01'.
      return iso + 'T00:00:00'
    }

    // Coleta UMA janela (dataInicial..dataFinal ISO) de um código IPEADATA.
    // Devolve os pontos ASCENDENTES da janela ([] em falha) e o total real.
    function coletarJanelaIpea(base, dataInicial, dataFinal, timeoutSegundos, CABlocal) {
      let url =
        base +
        '?$top=1200&$filter=VALDATA%20ge%20' +
        escapeOdataData(dataInicial) +
        '%20and%20VALDATA%20lt%20' +
        escapeOdataData(dataFinal)
      const resp = $http.send({
        url: url,
        method: 'GET',
        timeout: timeoutSegundos,
        headers: CABlocal,
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

    // Série IPEADATA completa: janelas de 3 anos do mais recente ao mais
    // antigo, concatenadas e REORDENADAS ascendente no fim (a página única
    // com $top devolvia só a parte antiga — causa raiz confirmada da série
    // do Ibovespa parar em 2019).
    function coletarIpeaJanelas(codigos, timeoutSegundos, orcamentoMs, dataInicial) {
      const anoAtual = new Date().getFullYear()
      const dataInicialIso = String(dataInicial || '2014-01-01').slice(0, 10)
      const inicioBudget = new Date().getTime()
      for (let ci = 0; ci < codigos.length; ci++) {
        const base = urlDoCandidato({
          tipo: 'ipea',
          codigos: [codigos[ci]],
          dataInicial: dataInicialIso,
        })
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
              base.base,
              dataIniJanela,
              dataFim,
              Math.max(1, Math.min(timeoutSegundos, Math.floor(restante / 1000))),
              CAB,
            )
          } catch (_) {
            janela = []
          }
          for (let k = 0; k < janela.length; k++) todos.push(janela[k])
        }
        if (todos.length > 0) {
          todos.sort(function (a, b) {
            return a.periodo < b.periodo ? -1 : a.periodo > b.periodo ? 1 : 0
          })
          return todos
        }
      }
      return []
    }

    // Base64 de payload ASCII (payload do índice da B3) — a JSVM (goja) NÃO
    // expõe btoa: codificador próprio, sem dependência externa.
    function b64encode(texto) {
      const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const bytes = []
      const s = String(texto || '')
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i)
        if (c < 128) bytes.push(c)
        else {
          // UTF-8 mínimo (o payload só tem ASCII, mas por segurança)
          bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63))
        }
      }
      let saida = ''
      for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i]
        const b2 = i + 1 < bytes.length ? bytes[i + 1] : -1
        const b3 = i + 2 < bytes.length ? bytes[i + 2] : -1
        saida += B64[b1 >> 2]
        saida += B64[((b1 & 3) << 4) | (b2 >= 0 ? b2 >> 4 : 0)]
        saida += b2 >= 0 ? B64[((b2 & 15) << 2) | (b3 >= 0 ? b3 >> 6 : 0)] : '='
        saida += b3 >= 0 ? B64[b3 & 63] : '='
      }
      return saida
    }

    // Um candidato = UMA fonte, com o PRÓPRIO timeout (a fonte lenta nunca
    // segura mais do que o seu limite).
    function parseCsvLinhas(texto) {
      // CSV do Stooq: header Date,Open,High,Low,Close[,Volume]; i=m → "YYYY-MM"
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

    // Yahoo Finance chart API (sem chave): JSON com timestamp[] e closes
    // mensais — %5EGSPC/%5EDJI/%5EIXIC, interval=1mo&range=15y.
    function coletarYahoo(simbolo, timeoutSegundos) {
      const respY = $http.send({
        url:
          'https://query1.finance.yahoo.com/v8/finance/chart/' +
          simbolo +
          '?interval=1mo&range=15y',
        method: 'GET',
        timeout: timeoutSegundos,
        headers: CAB,
      })
      if (!respY || respY.statusCode < 200 || respY.statusCode >= 400) return []
      const j = respY.json
      const resultado = j && j.chart && j.chart.result ? j.chart.result[0] : null
      if (!resultado) return []
      const stamps = resultado.timestamp || []
      const quote =
        resultado.indicators && resultado.indicators.quote
          ? resultado.indicators.quote[0] || {}
          : {}
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

    function coletarCandidato(cand, timeoutSegundos, agreg, inicioBudget, orcamentoMs) {
      // IPEADATA: JANELAS de VALDATA — a página única com $top devolvia só a
      // parte antiga da série (causa raiz do Ibovespa parar em set/2019).
      if (cand.tipo === 'ipea') {
        return coletarIpeaJanelas(
          cand.codigos,
          timeoutSegundos,
          orcamentoMs || ORCAMENTO_TOTAL_MS,
          ANO_INICIO_FIXO + '-01-01',
        )
      }
      // Yahoo Finance (índices globais): JSON mensal direto — sem chave.
      if (cand.tipo === 'yahoo') {
        return coletarYahoo(cand.simbolo, timeoutSegundos)
      }
      // B3 (IFIX/índices da B3): indexStatisticsProxy GetPortfolioDay, um
      // pedido por ano desde 2014 — JSON com a matriz diária do índice
      // (results[].rateValue1..12, ponto de milhar + vírgula decimal). O
      // ÚLTIMO pregão não nulo de cada mês vira o ponto mensal.
      // Base64: a JSVM (goja) NÃO tem btoa — codificador próprio, ASCII.
      if (cand.tipo === 'b3indice') {
        const anoAtualB3 = new Date().getFullYear()
        const todosB3 = []
        for (let anoB3 = ANO_INICIO_FIXO; anoB3 <= anoAtualB3; anoB3++) {
          const restanteB3 =
            (orcamentoMs || ORCAMENTO_TOTAL_MS) - (new Date().getTime() - inicioBudget)
          if (restanteB3 < 400) break
          const payloadB3 = b64encode(
            '{"index":"' + cand.indice + '","year":"' + anoB3 + '","language":"pt-br"}',
          )
          let respB3 = null
          try {
            respB3 = $http.send({
              url:
                'https://sistemaswebb3-listados.b3.com.br/indexStatisticsProxy/IndexCall/GetPortfolioDay/' +
                payloadB3,
              method: 'GET',
              timeout: Math.max(1, Math.min(timeoutSegundos, Math.floor(restanteB3 / 1000))),
              headers: CAB,
            })
          } catch (_) {
            respB3 = null
          }
          if (!respB3 || respB3.statusCode < 200 || respB3.statusCode >= 400) continue
          const corpoB3 = respB3.json
          const linhasB3 = corpoB3 && corpoB3.results ? corpoB3.results : []
          for (let li = 0; li < linhasB3.length; li++) {
            const linhaB3 = linhasB3[li]
            if (!linhaB3 || typeof linhaB3.day !== 'number') continue
            for (let mesB3 = 1; mesB3 <= 12; mesB3++) {
              const bruto = linhaB3['rateValue' + mesB3]
              if (bruto == null || bruto === '') continue
              const valorB3 = parseValorB3(bruto)
              if (!isFinite(valorB3) || valorB3 <= 0) continue
              todosB3.push({
                periodo:
                  anoB3 +
                  '-' +
                  String(mesB3).padStart(2, '0') +
                  '-' +
                  String(linhaB3.day).padStart(2, '0'),
                valor: valorB3,
              })
            }
          }
        }
        // Ordena por período e fica só com o ÚLTIMO pregão de cada mês.
        todosB3.sort(function (a, b) {
          return a.periodo < b.periodo ? -1 : a.periodo > b.periodo ? 1 : 0
        })
        const mensalB3 = []
        for (let pi = 0; pi < todosB3.length; pi++) {
          const mes = todosB3[pi].periodo.slice(0, 7)
          if (mensalB3.length > 0 && mensalB3[mensalB3.length - 1].periodo === mes) {
            mensalB3[mensalB3.length - 1].valor = todosB3[pi].valor
          } else {
            mensalB3.push({ periodo: mes, valor: todosB3[pi].valor })
          }
        }
        return mensalB3
      }
      // Stooq (índices globais): CSV mensal direto — sem chave, sem janela.
      if (cand.tipo === 'stooq') {
        const respS = $http.send({
          url: urlDoCandidato(cand, agreg),
          method: 'GET',
          timeout: timeoutSegundos,
          headers: CAB,
        })
        if (!respS || respS.statusCode < 200 || respS.statusCode >= 400) return []
        const texto =
          typeof respS.body === 'string'
            ? respS.body
            : typeof respS.json === 'string'
              ? respS.json
              : ''
        if (texto.indexOf('Exceeded the daily hits limit') !== -1) return []
        return parseCsvLinhas(texto)
      }
      if (cand.tipo === 'bcb' && agreg === 'mensal_ultimo') {
        // Séries DIÁRIAS: o BCData recusa janelas > 10 anos (a partir de HOJE,
        // não do ano civil — 01/01/(ano-10) também estoura) com HTTP 200 e
        // corpo de erro. Série diária é pedida em janelas de 5 anos desde
        // 2014 e concatenada; a última janela não leva dataFinal (data futura
        // também é recusada). Janela que falhe não zera o que já veio.
        const anoAtual = new Date().getFullYear()
        const todos = []
        for (let y = ANO_INICIO_FIXO; y <= anoAtual; y += 5) {
          const restante = ORCAMENTO_TOTAL_MS - (new Date().getTime() - inicioBudget)
          if (restante < 400) break
          let url =
            'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
            cand.codigo +
            '/dados?formato=json&dataInicial=01/01/' +
            y
          if (y + 4 < anoAtual) url = url + '&dataFinal=31/12/' + (y + 4)
          const resp = $http.send({
            url: url,
            method: 'GET',
            timeout: Math.max(1, Math.min(timeoutSegundos, Math.floor(restante / 1000))),
            headers: CAB,
          })
          if (resp && resp.statusCode >= 200 && resp.statusCode < 400) {
            const arr = resp.json
            if (Array.isArray(arr) && arr.length > 0) {
              const janela = parseBcbLinhas(arr)
              for (let k = 0; k < janela.length; k++) todos.push(janela[k])
            }
          }
        }
        if (todos.length === 0) {
          console.log(
            'series-historicas: janelas diárias sem pontos (' + chave + '): sgs.' + cand.codigo,
          )
        }
        return todos
      }
      const resp = $http.send({
        url: urlDoCandidato(cand, agreg),
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
          const janelaUnica = parseBcbLinhas([linha])
          if (janelaUnica.length === 0) continue
          periodo = janelaUnica[0].periodo
          valor = janelaUnica[0].valor
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
        const orcamentoMs = item.orcamentoMs || ORCAMENTO_TOTAL_MS
        const restante = orcamentoMs - (new Date().getTime() - inicio)
        if (restante < 400) break
        const timeoutSegundos = Math.max(
          1,
          Math.min(item.timeoutS || TIMEOUT_FONTE_S, Math.floor(restante / 1000)),
        )
        try {
          const pontos = coletarCandidato(
            candidatos[i],
            timeoutSegundos,
            item.agreg,
            inicio,
            orcamentoMs,
          )
          if (pontos.length === 0) {
            console.log(
              'series-historicas: candidato sem pontos (' +
                chave +
                '): ' +
                (candidatos[i].tipo === 'ipea'
                  ? 'ipeadata ' + String(candidatos[i].codigos || [])
                  : candidatos[i].tipo === 'stooq'
                    ? 'stooq ' + String(candidatos[i].simbolo || '')
                    : candidatos[i].tipo === 'yahoo'
                      ? 'yahoo ' + String(candidatos[i].simbolo || '')
                      : urlDoCandidato(candidatos[i], item.agreg)),
            )
          }
          if (pontos.length > 0) {
            let finais = item.agreg === 'mensal_ultimo' ? agregarMensalUltimo(pontos) : pontos
            if (finais.length > TETO_PONTOS) finais = finais.slice(finais.length - TETO_PONTOS)
            return finais
          }
        } catch (errCand) {
          console.log('series-historicas: candidato falhou (' + chave + '): ' + String(errCand))
          // fonte falhou/estourou o tempo → tenta o próximo candidato
        }
      }
      return []
    }

    function lerCache(c) {
      try {
        const rec = $app.findFirstRecordByData('series_cache', 'chave', c)
        let obj = rec.get('payload')
        if (typeof obj === 'string') {
          try {
            obj = JSON.parse(obj)
          } catch (_) {
            obj = null
          }
        }
        if (!obj || !Array.isArray(obj.serie) || obj.serie.length === 0) return null
        // IFIX gravado antes da correção de escala (1.282 gravado como 1,282):
        // valor < 100 é fração de mil pontos → ×1000 na leitura.
        let pontos = obj.serie
        if (c === 'ifix') {
          pontos = pontos.map(function (p) {
            if (p && isFinite(p.valor) && p.valor > 0 && p.valor < 100) {
              return { periodo: p.periodo, valor: p.valor * 1000 }
            }
            return p
          })
        }
        const ts = Date.parse(String(obj.fetched_at_iso || '').replace(' ', 'T')) || 0
        return { ts: ts, pontos: pontos }
      } catch (_) {
        return null
      }
    }

    function salvarCache(c, pontos) {
      try {
        let rec = null
        try {
          rec = $app.findFirstRecordByData('series_cache', 'chave', c)
        } catch (_) {
          const col = $app.findCollectionByNameOrId('series_cache')
          rec = new Record(col)
          rec.set('chave', c)
        }
        const agora = new Date().toISOString()
        rec.set('payload', JSON.stringify({ fetched_at_iso: agora, serie: pontos }))
        rec.set('fonte', 'backend/v1/series-historicas')
        rec.set('fetched_at', agora)
        $app.save(rec)
      } catch (err) {
        console.log('series-historicas: erro ao salvar cache de ' + c + ': ' + String(err))
      }
    }

    // Fallback interno aproximado para FipeZap (série mensal de variação %).
    function pontosFipeZapAproximados() {
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

    function fallbackInterno(c) {
      if (c === 'fipezap') return pontosFipeZapAproximados()
      return fallbackUltimaInstancia(c)
    }

    function formatar(c, item, fonteViva, baseInterna, pontos, aviso) {
      return {
        ok: true,
        chave: c,
        fonteViva: fonteViva,
        baseInterna: baseInterna,
        fonte: item ? item.fonte : '',
        serie: pontos,
        aviso: aviso,
      }
    }

    function resolver(c, forcarVivo) {
      c = String(c || '')
      const item = CATALOGO[c]
      if (!item) {
        const fbDesconhecida = fallbackInterno(c)
        return formatar(
          c,
          null,
          false,
          true,
          fbDesconhecida,
          fbDesconhecida.length > 0
            ? 'Série disponível apenas na base interna aproximada do sistema.'
            : 'Série não catalogada — disponível apenas na base interna do sistema.',
        )
      }

      // reteste=1 (validação): fura o cache e força a coleta viva primeiro.
      if (forcarVivo && !item.semVivoNoPedido) {
        let vivosReteste = []
        try {
          vivosReteste = coletarVivo(item)
        } catch (errReteste) {
          console.log('series-historicas: reteste vivo de ' + c + ' falhou: ' + String(errReteste))
          vivosReteste = []
        }
        if (vivosReteste.length > 0) {
          salvarCache(c, vivosReteste)
          return formatar(c, item, true, false, vivosReteste, '')
        }
      }

      const ttl = item.ttlMs || TTL_PADRAO_MS
      const cache = lerCache(c)
      const idadeOk = cache !== null && new Date().getTime() - cache.ts < ttl
      if (idadeOk) return formatar(c, item, true, false, cache.pontos, '')

      // FipeZap: o pedido NUNCA espera a fonte lenta — só cache/snapshot/fallback.
      if (!item.semVivoNoPedido) {
        let vivos = []
        try {
          vivos = coletarVivo(item)
        } catch (errVivo) {
          console.log('series-historicas: coleta viva de ' + c + ' falhou: ' + String(errVivo))
          vivos = []
        }
        if (vivos.length > 0) {
          salvarCache(c, vivos)
          return formatar(c, item, true, false, vivos, '')
        }
      }

      // Cache vencido ainda vale: snapshot oficial anterior, COM dados.
      if (cache) {
        const dataSnap = String(new Date(cache.ts).toISOString()).slice(0, 10)
        return formatar(
          c,
          item,
          false,
          true,
          cache.pontos,
          'Fonte oficial indisponível neste momento — exibindo o último snapshot oficial captado pelo servidor em ' +
            dataSnap +
            '.',
        )
      }

      const fb = fallbackInterno(c)
      if (fb.length > 0) {
        return formatar(
          c,
          item,
          false,
          true,
          fb,
          'Fonte oficial indisponível neste momento — exibindo a base interna aproximada do sistema (valores de referência, não oficiais).',
        )
      }

      return formatar(
        c,
        item,
        false,
        true,
        [],
        'Fonte oficial indisponível neste momento — exibindo a base interna aproximada do sistema.',
      )
    }

    resposta = resolver(chave, forcarVivo)
  } catch (err) {
    // LOG OBRIGATÓRIO (mantido): o erro real aparece nos logs hooks — o guard
    // abaixo NUNCA deve mascarar uma falha de execução sem rastro.
    console.log('series-historicas: falha no resolver (' + chave + '): ' + String(err))
    resposta = null
  }

  // ------------------------------------------------------------------
  // 3. GUARD EXTERNO — CONTRATO ABSOLUTO: nunca serie:[] com pontos
  //    disponíveis. Fallback de última instância SEMPRE entrega pontos
  //    (mercado: anual; inflação/taxas/câmbio: mensal) com aviso.
  // ------------------------------------------------------------------
  if (!resposta || !Array.isArray(resposta.serie) || resposta.serie.length === 0) {
    const fb = fallbackUltimaInstancia(chave)
    if (fb.length > 0) {
      if (resposta) {
        resposta.serie = fb
        resposta.fonteViva = false
        resposta.baseInterna = true
        if (!resposta.aviso) {
          resposta.aviso =
            'Fonte oficial indisponível neste momento — exibindo a base interna aproximada do sistema (valores de referência, não oficiais).'
        }
      } else {
        resposta = {
          ok: true,
          chave: chave,
          fonteViva: false,
          baseInterna: true,
          fonte: 'Base interna do sistema',
          serie: fb,
          aviso: 'Base interna — dado aproximado (fonte indisponível)',
        }
      }
    } else if (!resposta) {
      resposta = {
        ok: true,
        chave: chave,
        fonteViva: false,
        baseInterna: true,
        fonte: 'Base interna do sistema',
        serie: [],
        aviso: 'Base interna — dado aproximado (fonte indisponível)',
      }
    }
  }
  return e.json(200, resposta)
})
