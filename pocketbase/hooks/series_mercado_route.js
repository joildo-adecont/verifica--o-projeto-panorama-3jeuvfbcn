/**
 * SÉRIES DE MERCADO — valores atuais de índices e câmbio (proxy backend).
 *
 * GET /backend/v1/series-mercado
 *   → { ok, fontes: [{ fonte, fonteNome, fonteViva, aviso, indicadores: [{ chave, nome, valor, variacao, unidade, periodo, nota }] }] }
 *
 * Grupos: b3_mercado (Ibovespa — BCB SGS 7), bcb_cambio (dólar/euro PTAX —
 * BCB SGS 10813/21619) e ipea_global (S&P 500, Dow Jones, Nasdaq — IPEADATA,
 * códigos candidatos: o primeiro que responder vale a série).
 * Fonte falhou? o indicador sai da resposta e o grupo vem com fonteViva=false
 * + aviso transparente — nunca erro cru.
 */
routerAdd('GET /backend/v1/series-mercado', (e) => {
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }
  const timeoutMs = 9000

  const definicoes = [
    {
      fonte: 'b3_mercado',
      fonteNome: 'B3 — Ibovespa',
      chave: 'ibovespa',
      nome: 'Ibovespa — fechamento diário',
      tipo: 'bcb',
      codigo: 7,
      unidade: 'pontos',
      nota: 'BCB SGS 7 / B3',
    },
    {
      fonte: 'bcb_cambio',
      fonteNome: 'BCB — Câmbio PTAX',
      chave: 'usd',
      nome: 'Dólar comercial (PTAX)',
      tipo: 'bcb',
      codigo: 10813,
      unidade: 'R$/US$',
      nota: 'BCB SGS 10813 — PTAX venda',
    },
    {
      fonte: 'bcb_cambio',
      fonteNome: 'BCB — Câmbio PTAX',
      chave: 'eur',
      nome: 'Euro (PTAX)',
      tipo: 'bcb',
      codigo: 21619,
      unidade: 'R$/EUR',
      nota: 'BCB SGS 21619 — PTAX venda',
    },
    {
      fonte: 'ipea_global',
      fonteNome: 'IPEA/IPEADATA — Índices globais',
      chave: 'sp500',
      nome: 'S&P 500 — fechamento',
      tipo: 'ipea',
      codigos: ['JPA366_SP500366', 'SGS366_SP500366', 'GM366_SP500366', 'JPA366_SP500'],
      unidade: 'pontos',
      nota: 'Índice de ações large cap dos EUA',
    },
    {
      fonte: 'ipea_global',
      fonteNome: 'IPEA/IPEADATA — Índices globais',
      chave: 'dowjones',
      nome: 'Dow Jones Industrial Average',
      tipo: 'ipea',
      codigos: ['SGS366_DJIA366', 'JPA366_DJIA366', 'GM366_DJIA366'],
      unidade: 'pontos',
      nota: 'Índice das 30 maiores empresas dos EUA',
    },
    {
      fonte: 'ipea_global',
      fonteNome: 'IPEA/IPEADATA — Índices globais',
      chave: 'nasdaq',
      nome: 'Nasdaq Composite',
      tipo: 'ipea',
      codigos: ['SGS366_NASDAQ366', 'JPA366_NASDAQ366', 'GM366_NASDAQ366'],
      unidade: 'pontos',
      nota: 'Índice de ações de tecnologia dos EUA',
    },
  ]

  const porFonte = {}
  const ordemFontes = []
  const garantir = (fonte, fonteNome) => {
    if (!porFonte[fonte]) {
      porFonte[fonte] = {
        fonte: fonte,
        fonteNome: fonteNome,
        fonteViva: false,
        aviso: '',
        indicadores: [],
      }
      ordemFontes.push(fonte)
    }
    return porFonte[fonte]
  }

  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i]
    const grupo = garantir(d.fonte, d.fonteNome)
    let valor = NaN
    let anterior = NaN
    let periodo = ''
    try {
      if (d.tipo === 'bcb') {
        const resp = $http.send({
          url:
            'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
            d.codigo +
            '/dados/ultimos/2?formato=json',
          method: 'GET',
          timeout: timeoutMs,
          headers: CAB,
        })
        const arr = resp.json || []
        if (arr.length >= 2) {
          const parse = (s) => parseFloat(String(s || '').replace(',', '.'))
          anterior = parse(arr[0].valor)
          valor = parse(arr[1].valor)
          const m = String(arr[1].data || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
          if (m) periodo = m[3] + '-' + m[2] + '-' + m[1]
        }
      } else {
        for (let c = 0; c < d.codigos.length && !isFinite(valor); c++) {
          const resp = $http.send({
            url:
              "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='" +
              d.codigos[c] +
              "')?$top=2&$orderby=VALDATA%20desc",
            method: 'GET',
            timeout: timeoutMs,
            headers: CAB,
          })
          const arr = resp.json && resp.json.value ? resp.json.value : []
          if (arr.length >= 2) {
            anterior = parseFloat(arr[1].VALVALOR)
            valor = parseFloat(arr[0].VALVALOR)
            const data = String(arr[0].VALDATA || '')
            if (data.length >= 10)
              periodo = data.slice(8, 10) + '/' + data.slice(5, 7) + '/' + data.slice(0, 4)
          }
        }
      }
    } catch (err) {
      valor = NaN
    }

    if (isFinite(valor) && isFinite(anterior) && anterior !== 0) {
      grupo.indicadores.push({
        chave: d.chave,
        nome: d.nome,
        valor: valor,
        variacao: ((valor - anterior) / Math.abs(anterior)) * 100,
        unidade: d.unidade,
        periodo: periodo,
        nota: d.nota,
      })
      grupo.fonteViva = true
    }
  }

  for (let f = 0; f < ordemFontes.length; f++) {
    const g = porFonte[ordemFontes[f]]
    if (!g.fonteViva) {
      g.aviso =
        'Fonte oficial (' +
        g.fonteNome +
        ') indisponível neste momento — indicadores deste grupo ocultos; consulte a aba Histórico para a base interna aproximada.'
    }
  }

  return e.json(200, { ok: true, fontes: ordemFontes.map((f) => porFonte[f]) })
})
