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
 * semVivoNoPedido (só cache do cron); Ibovespa via IPEADATA GM366_IBVSP366;
 * timeout individual 5s e orçamento total ~11s por pedido.
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
  const chave = String(q['chave'] || '')

  let resposta = null
  try {
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
        candidatos: [{ tipo: 'ipea', codigos: ['GM366_SP500366'] }],
      },
      dowjones: {
        fonte: 'IPEA — IPEADATA (Dow Jones)',
        agreg: 'mensal_ultimo',
        candidatos: [{ tipo: 'ipea', codigos: ['GM366_DJIA366'] }],
      },
      nasdaq: {
        fonte: 'IPEA — IPEADATA (Nasdaq)',
        agreg: 'mensal_ultimo',
        candidatos: [{ tipo: 'ipea', codigos: ['GM366_NASDAQ366'] }],
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

    function coletarCandidato(cand, timeoutSegundos, agreg, inicioBudget) {
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
        const restante = ORCAMENTO_TOTAL_MS - (new Date().getTime() - inicio)
        if (restante < 400) break
        const timeoutSegundos = Math.max(1, Math.min(TIMEOUT_FONTE_S, Math.floor(restante / 1000)))
        try {
          const pontos = coletarCandidato(candidatos[i], timeoutSegundos, item.agreg, inicio)
          if (pontos.length === 0) {
            console.log(
              'series-historicas: candidato sem pontos (' +
                chave +
                '): ' +
                urlDoCandidato(candidatos[i], item.agreg),
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
        const ts = Date.parse(String(obj.fetched_at_iso || '').replace(' ', 'T')) || 0
        return { ts: ts, pontos: obj.serie }
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

    function resolver(c) {
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

    resposta = resolver(chave)
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
