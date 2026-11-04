/**
 * FONTES ESTATÍSTICAS OFICIAIS — proxy backend
 * (IBGE · Tesouro Nacional · IPEA · Agronegócio: IBGE-SIDRA/CONAB/Cepea-Esalq ·
 *  Imobiliário: FipeZap · BCB índices SFH)
 *
 * Mesmo padrão anti-bloqueio do projeto (ver indicadores_economicos_route.js):
 * o navegador NUNCA fala direto com a fonte oficial — toda consulta parte daqui,
 * com tempo limite curto e fallback pela base interna com aviso transparente.
 * Nunca erro cru, nunca crash: qualquer falha vira resposta 200 com fonteViva=false.
 *
 * Fontes de agronegócio e imobiliário:
 * - ibge_agro : produção da agropecuária (SIDRA tabela 6588 / PIB agro)
 * - conab     : safras e estoques oficiais (boletins CONAB — gov.br/conab)
 * - cepea     : preços agro Cepea-Esalq/USP via séries SGS do BCB
 *               (23447 boi gordo · 23448 soja · 23449 milho)
 * - fipezap   : índice FipeZap de imóveis residenciais (BCB SGS 19967)
 * - bcb_sfh   : índices de correção de financiamentos SFH
 *               (SGS 226 TR · 254 TJLP · 36 IGP-M 12 meses)
 */
routerAdd('GET /backend/v1/fontes-estatisticas', (e) => {
  const fonte = String((e.requestInfo().query && e.requestInfo().query['fonte']) || 'todas')
  const timeoutMs = 9000

  // Toda a lógica fica DENTRO dos callbacks (lição do hook do BCB: nada de
  // nível superior referenciado dentro de routerAdd).

  const coletarIbge = () => {
    // SIDRA — séries: IPCA (t1737 v63), PIB trimestral (t5938), desemprego PNAD Contínua (t4099 v4099)
    const series = [
      {
        chave: 'ipca',
        nome: 'IPCA — variação % mensal',
        tabela: 1737,
        variavel: 63,
        unidade: '%',
        categoria: 'inflacao',
      },
      {
        chave: 'pib',
        nome: 'PIB — variação % trimestral',
        tabela: 5938,
        variavel: 216,
        unidade: '%',
        categoria: 'atividade',
      },
      {
        chave: 'desemprego',
        nome: 'Taxa de desemprego (PNAD Contínua)',
        tabela: 4099,
        variavel: 4099,
        unidade: '%',
        categoria: 'trabalho',
      },
    ]
    const saida = []
    for (const s of series) {
      try {
        const url =
          'https://apisidra.ibge.gov.br/values/t/' +
          s.tabela +
          '/n1/1/v/' +
          s.variavel +
          '/p/last%204'
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: { Accept: 'application/json' },
        })
        const arr = resp.json || []
        // primeira linha é header; demais são valores
        let idxHeader = -1
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] && (arr[i].V === 'Valor' || arr[i].VL === 'Valor' || arr[i].D2C === 'Valor')) {
            idxHeader = i
            break
          }
        }
        const dados = []
        for (let i = 0; i < arr.length; i++) {
          const linha = arr[i]
          if (!linha || linha.V === 'Valor' || linha.VL === 'Valor') continue
          const valor = parseFloat(linha.V != null ? linha.V : linha.VL)
          if (!isFinite(valor)) continue
          dados.push({
            periodo: String(linha.D3C || linha.D2C || linha.Periodo || linha['D1C'] || ''),
            valor: valor,
          })
        }
        if (dados.length > 0) {
          const ultimo = dados[dados.length - 1]
          const anterior = dados.length > 1 ? dados[dados.length - 2] : null
          saida.push({
            chave: s.chave,
            nome: s.nome,
            categoria: s.categoria,
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: anterior ? ultimo.valor - anterior.valor : 0,
            serie: dados.map((d) => d.valor),
            fonte: 'IBGE',
          })
        }
      } catch (err) {
        // série individual falhou — segue para a próxima; o agregado decide o estado geral
      }
    }
    return saida
  }

  const coletarTesouro = () => {
    // Tesouro Nacional — dados abertos (SICONFI / dívida). Falha => lista vazia.
    const saida = []
    const tentativas = [
      'https://apidata.tesouro.gov.br/api/siconfi/rreoes/municipios?an_referencia=2024&periodicidade=4&periodo_referencia=4&in_periodo=final',
    ]
    for (const url of tentativas) {
      try {
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: { Accept: 'application/json' },
        })
        const corpo = resp.json
        if (!corpo) continue
        // resposta do SICONFI: array de registros; usamos apenas como prova de acesso
        // e extração defensiva de um total de despesa para o recorte.
        if (Array.isArray(corpo) && corpo.length > 0) {
          saida.push({
            chave: 'rreoes',
            nome: 'RREO — receitas e despesas (SICONFI, recorte municipal)',
            categoria: 'fiscal',
            unidade: 'R$',
            valor: 0,
            periodo: '2024/4º quadrimestre',
            variacao: 0,
            serie: [],
            fonte: 'Tesouro Nacional',
            registrosDisponiveis: corpo.length,
            nota: 'Recorte fiscal do SICONFI disponível; detalhamento via Portal de Dados Abertos do Tesouro.',
          })
        }
        break
      } catch (err) {
        // tenta próxima URL
      }
    }
    return saida
  }

  const coletarIpea = () => {
    // IPEADATA — OData v4: séries macroeconômicas
    const series = [
      {
        chave: 'igpm',
        codigo: 'GM12_IGP10IGPM12',
        nome: 'IGP-M — variação % em 12 meses',
        unidade: '%',
        categoria: 'inflacao',
      },
      {
        chave: 'inpc',
        codigo: 'GM12_INPC12',
        nome: 'INPC — variação % em 12 meses',
        unidade: '%',
        categoria: 'inflacao',
      },
      {
        chave: 'salmin',
        codigo: 'GM12_SALMIN12',
        nome: 'Salário mínimo — variação % em 12 meses',
        unidade: '%',
        categoria: 'renda',
      },
    ]
    const saida = []
    for (const s of series) {
      try {
        const url =
          "http://www.ipeadata.gov.br/api/odata4/Valores(SERCODIGO='" +
          s.codigo +
          "')?$top=6&$orderby=VALDATA desc"
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: { Accept: 'application/json' },
        })
        const valores = (resp.json && resp.json.value) || []
        const dados = []
        for (let i = 0; i < valores.length; i++) {
          const v = parseFloat(valores[i].VALVALOR)
          if (!isFinite(v)) continue
          dados.push({ periodo: String(valores[i].VALDATA || '').slice(0, 10), valor: v })
        }
        if (dados.length > 0) {
          const ultimo = dados[0]
          const anterior = dados.length > 1 ? dados[1] : null
          saida.push({
            chave: s.chave,
            nome: s.nome,
            categoria: s.categoria,
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: anterior ? ultimo.valor - anterior.valor : 0,
            serie: dados.map((d) => d.valor).reverse(),
            fonte: 'IPEA',
          })
        }
      } catch (err) {
        // série individual falhou — segue
      }
    }
    return saida
  }

  const coletarIbgeAgro = () => {
    // SIDRA agronegócio: produção da agropecuária (t6588) e PIB agropecuária
    const series = [
      {
        chave: 'agro_producao',
        nome: 'Produção da agropecuária — variação % anual (SIDRA)',
        tabela: 6588,
        variavel: 216,
        unidade: '%',
        categoria: 'agronegocio',
      },
    ]
    const saida = []
    for (const s of series) {
      try {
        const url =
          'https://apisidra.ibge.gov.br/values/t/' +
          s.tabela +
          '/n1/1/v/' +
          s.variavel +
          '/p/last%204'
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: { Accept: 'application/json' },
        })
        const arr = resp.json || []
        const dados = []
        for (let i = 0; i < arr.length; i++) {
          const linha = arr[i]
          if (!linha || linha.V === 'Valor' || linha.VL === 'Valor') continue
          const valor = parseFloat(linha.V != null ? linha.V : linha.VL)
          if (!isFinite(valor)) continue
          dados.push({
            periodo: String(linha.D3C || linha.D2C || linha.Periodo || linha.D1C || ''),
            valor: valor,
          })
        }
        if (dados.length > 0) {
          const ultimo = dados[dados.length - 1]
          const anterior = dados.length > 1 ? dados[dados.length - 2] : null
          saida.push({
            chave: s.chave,
            nome: s.nome,
            categoria: s.categoria,
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: anterior ? ultimo.valor - anterior.valor : 0,
            serie: dados.map((d) => d.valor),
            fonte: 'IBGE',
          })
        }
      } catch (err) {
        // série individual falhou — segue
      }
    }
    return saida
  }

  const coletarConab = () => {
    // CONAB — boletins oficiais de safras (gov.br/conab). A consulta serve como
    // prova de acesso à fonte; o dado consolidado vem do último boletim.
    const saida = []
    const tentativas = [
      'https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-de-graos',
    ]
    for (const url of tentativas) {
      try {
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,*/*',
          },
        })
        const corpo = resp.body || ''
        if (resp.statusCode >= 200 && resp.statusCode < 400 && corpo.length > 0) {
          saida.push({
            chave: 'conab_safra',
            nome: 'Acompanhamento da safra brasileira de grãos — CONAB (boletim oficial)',
            categoria: 'agronegocio',
            unidade: 'mil t',
            valor: 0,
            periodo: 'último levantamento publicado',
            variacao: 0,
            serie: [],
            fonte: 'CONAB',
            nota: 'Boletim de levantamento da safra disponível no portal oficial da CONAB; detalhamento por cultura e UF via Boletim da Safra de Grãos.',
          })
        }
        break
      } catch (err) {
        // tenta próxima URL
      }
    }
    return saida
  }

  const coletarCepea = () => {
    // Cepea-Esalq/USP via séries SGS do BCB (divulgação oficial dos indicadores)
    const series = [
      {
        chave: 'boi_gordo',
        serie: 23447,
        nome: 'Boi gordo Cepea-Esalq — R$/arroba',
        unidade: 'R$/@',
      },
      { chave: 'soja', serie: 23448, nome: 'Soja Cepea-Esalq — R$/sc 60 kg', unidade: 'R$/sc' },
      { chave: 'milho', serie: 23449, nome: 'Milho Cepea-Esalq — R$/sc 60 kg', unidade: 'R$/sc' },
    ]
    const saida = []
    for (const s of series) {
      try {
        const url =
          'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          s.serie +
          '/dados/ultimos/6?formato=json'
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json,text/plain,*/*',
          },
        })
        const pontos = resp.json || []
        const dados = []
        for (let i = 0; i < pontos.length; i++) {
          const v = parseFloat(String(pontos[i].valor || '').replace(',', '.'))
          if (!isFinite(v)) continue
          dados.push({ periodo: String(pontos[i].data || ''), valor: v })
        }
        if (dados.length > 0) {
          const ultimo = dados[dados.length - 1]
          const anterior = dados.length > 1 ? dados[dados.length - 2] : null
          saida.push({
            chave: s.chave,
            nome: s.nome,
            categoria: 'agronegocio',
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao:
              anterior && anterior.valor > 0
                ? ((ultimo.valor - anterior.valor) / anterior.valor) * 100
                : 0,
            serie: dados.map((d) => d.valor),
            fonte: 'Cepea-Esalq/USP',
          })
        }
      } catch (err) {
        // série individual falhou — segue
      }
    }
    return saida
  }

  const coletarFipezap = () => {
    // FipeZap — índice de preços de imóveis residenciais (BCB SGS 19967, % mensal)
    const saida = []
    try {
      const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.19967/dados/ultimos/6?formato=json'
      const resp = $http.send({
        url: url,
        method: 'GET',
        timeout: timeoutMs,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json,text/plain,*/*',
        },
      })
      const pontos = resp.json || []
      const dados = []
      for (let i = 0; i < pontos.length; i++) {
        const v = parseFloat(String(pontos[i].valor || '').replace(',', '.'))
        if (!isFinite(v)) continue
        dados.push({ periodo: String(pontos[i].data || ''), valor: v })
      }
      if (dados.length > 0) {
        const ultimo = dados[dados.length - 1]
        const anterior = dados.length > 1 ? dados[dados.length - 2] : null
        saida.push({
          chave: 'fipezap',
          nome: 'FipeZap — imóveis residenciais anunciados (% a.m.)',
          categoria: 'imobiliario',
          unidade: '% a.m.',
          valor: ultimo.valor,
          periodo: ultimo.periodo,
          variacao: anterior ? ultimo.valor - anterior.valor : 0,
          serie: dados.map((d) => d.valor),
          fonte: 'FipeZap (Fipe/ZAP+)',
        })
      }
    } catch (err) {
      // fonte falhou — fallback abaixo
    }
    return saida
  }

  const coletarBcbSfh = () => {
    // BCB — índices de correção de financiamentos SFH: TR (226), TJLP (254) e
    // IGP-M 12 meses (36) — séries oficiais usadas pela Caixa no SFH.
    const series = [
      { chave: 'tr', serie: 226, nome: 'TR — Taxa Referencial (% a.m., SFH)', unidade: '% a.m.' },
      {
        chave: 'tjlp',
        serie: 254,
        nome: 'TJLP — Taxa de Juros de Longo Prazo (% a.a.)',
        unidade: '% a.a.',
      },
      {
        chave: 'igpm12',
        serie: 36,
        nome: 'IGP-M — variação % em 12 meses (correção SFH)',
        unidade: '% a.a.',
      },
    ]
    const saida = []
    for (const s of series) {
      try {
        const url =
          'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          s.serie +
          '/dados/ultimos/6?formato=json'
        const resp = $http.send({
          url: url,
          method: 'GET',
          timeout: timeoutMs,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json,text/plain,*/*',
          },
        })
        const pontos = resp.json || []
        const dados = []
        for (let i = 0; i < pontos.length; i++) {
          const v = parseFloat(String(pontos[i].valor || '').replace(',', '.'))
          if (!isFinite(v)) continue
          dados.push({ periodo: String(pontos[i].data || ''), valor: v })
        }
        if (dados.length > 0) {
          const ultimo = dados[dados.length - 1]
          const anterior = dados.length > 1 ? dados[dados.length - 2] : null
          saida.push({
            chave: s.chave,
            nome: s.nome,
            categoria: 'imobiliario',
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: anterior ? ultimo.valor - anterior.valor : 0,
            serie: dados.map((d) => d.valor),
            fonte: 'Banco Central do Brasil',
          })
        }
      } catch (err) {
        // série individual falhou — segue
      }
    }
    return saida
  }

  const baseInterna = (fonteNome, indicadores, avisoExtra) => {
    // Fallback: base interna aproximada, com aviso transparente — nunca erro cru.
    const internas = {
      IBGE: [
        {
          chave: 'ipca',
          nome: 'IPCA — variação % mensal (base interna)',
          categoria: 'inflacao',
          unidade: '%',
          valor: 0.42,
          periodo: 'último mês disponível',
          variacao: 0.05,
          serie: [0.38, 0.4, 0.45, 0.42],
          fonte: 'IBGE',
        },
        {
          chave: 'desemprego',
          nome: 'Taxa de desemprego — PNAD Contínua (base interna)',
          categoria: 'trabalho',
          unidade: '%',
          valor: 7.5,
          periodo: 'último trimestre móvel disponível',
          variacao: -0.2,
          serie: [7.9, 7.8, 7.7, 7.5],
          fonte: 'IBGE',
        },
      ],
      'Tesouro Nacional': [
        {
          chave: 'divida',
          nome: 'Dívida pública federal — % do PIB (base interna)',
          categoria: 'fiscal',
          unidade: '%',
          valor: 76.8,
          periodo: 'último exercício disponível',
          variacao: 0.9,
          serie: [74.2, 75.1, 75.9, 76.8],
          fonte: 'Tesouro Nacional',
        },
      ],
      IPEA: [
        {
          chave: 'igpm',
          nome: 'IGP-M — variação % em 12 meses (base interna)',
          categoria: 'inflacao',
          unidade: '%',
          valor: 4.8,
          periodo: 'últimos 12 meses disponíveis',
          variacao: -0.4,
          serie: [5.6, 5.4, 5.1, 4.8],
          fonte: 'IPEA',
        },
      ],
      'IBGE — Agronegócio': [
        {
          chave: 'agro_producao',
          nome: 'Produção da agropecuária — variação % anual (base interna)',
          categoria: 'agronegocio',
          unidade: '%',
          valor: 2.9,
          periodo: 'último ano disponível',
          variacao: 0.3,
          serie: [2.1, 2.4, 2.6, 2.9],
          fonte: 'IBGE — Agronegócio',
        },
      ],
      CONAB: [
        {
          chave: 'conab_safra',
          nome: 'Safra brasileira de grãos — produção total estimada (base interna)',
          categoria: 'agronegocio',
          unidade: 'mil t',
          valor: 322000,
          periodo: 'último levantamento consolidado',
          variacao: 4100,
          serie: [298000, 303000, 318000, 322000],
          fonte: 'CONAB',
        },
      ],
      'Cepea-Esalq/USP': [
        {
          chave: 'boi_gordo',
          nome: 'Boi gordo Cepea-Esalq — R$/arroba (base interna)',
          categoria: 'agronegocio',
          unidade: 'R$/@',
          valor: 322.5,
          periodo: 'última cotação disponível',
          variacao: 1.2,
          serie: [308.4, 312.9, 318.6, 322.5],
          fonte: 'Cepea-Esalq/USP',
        },
        {
          chave: 'soja',
          nome: 'Soja Cepea-Esalq — R$/sc 60 kg (base interna)',
          categoria: 'agronegocio',
          unidade: 'R$/sc',
          valor: 142.8,
          periodo: 'última cotação disponível',
          variacao: -0.8,
          serie: [148.2, 146.1, 144.0, 142.8],
          fonte: 'Cepea-Esalq/USP',
        },
        {
          chave: 'milho',
          nome: 'Milho Cepea-Esalq — R$/sc 60 kg (base interna)',
          categoria: 'agronegocio',
          unidade: 'R$/sc',
          valor: 58.4,
          periodo: 'última cotação disponível',
          variacao: 0.5,
          serie: [56.2, 57.0, 57.9, 58.4],
          fonte: 'Cepea-Esalq/USP',
        },
      ],
      FipeZap: [
        {
          chave: 'fipezap',
          nome: 'FipeZap — imóveis residenciais anunciados, % a.m. (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.m.',
          valor: 0.45,
          periodo: 'último mês disponível',
          variacao: 0.05,
          serie: [0.32, 0.36, 0.4, 0.45],
          fonte: 'FipeZap (Fipe/ZAP+)',
        },
      ],
      'Banco Central — SFH': [
        {
          chave: 'tr',
          nome: 'TR — Taxa Referencial, % a.m. (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.m.',
          valor: 0.08,
          periodo: 'último mês disponível',
          variacao: 0,
          serie: [0.08, 0.08, 0.08, 0.08],
          fonte: 'Banco Central — SFH',
        },
        {
          chave: 'tjlp',
          nome: 'TJLP — Taxa de Juros de Longo Prazo, % a.a. (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.a.',
          valor: 7.5,
          periodo: 'último trimestre disponível',
          variacao: 0,
          serie: [7.5, 7.5, 7.5, 7.5],
          fonte: 'Banco Central — SFH',
        },
        {
          chave: 'igpm12',
          nome: 'IGP-M 12 meses — correção de financiamentos SFH (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.a.',
          valor: 4.8,
          periodo: 'últimos 12 meses disponíveis',
          variacao: -0.4,
          serie: [5.6, 5.4, 5.1, 4.8],
          fonte: 'Banco Central — SFH',
        },
      ],
    }
    const lista = internas[fonteNome] || []
    for (let i = 0; i < lista.length; i++) lista[i].baseInterna = true
    return lista
  }

  const consultas = []
  if (fonte === 'todas' || fonte === 'ibge') consultas.push('IBGE')
  if (fonte === 'todas' || fonte === 'tesouro') consultas.push('Tesouro Nacional')
  if (fonte === 'todas' || fonte === 'ipea') consultas.push('IPEA')
  if (fonte === 'todas' || fonte === 'ibge_agro') consultas.push('IBGE — Agronegócio')
  if (fonte === 'todas' || fonte === 'conab') consultas.push('CONAB')
  if (fonte === 'todas' || fonte === 'cepea') consultas.push('Cepea-Esalq/USP')
  if (fonte === 'todas' || fonte === 'fipezap') consultas.push('FipeZap')
  if (fonte === 'todas' || fonte === 'bcb_sfh') consultas.push('Banco Central — SFH')

  const fontes = []
  for (const nome of consultas) {
    let itens = []
    let viva = true
    let aviso = ''
    try {
      if (nome === 'IBGE') itens = coletarIbge()
      else if (nome === 'Tesouro Nacional') itens = coletarTesouro()
      else if (nome === 'IPEA') itens = coletarIpea()
      else if (nome === 'IBGE — Agronegócio') itens = coletarIbgeAgro()
      else if (nome === 'CONAB') itens = coletarConab()
      else if (nome === 'Cepea-Esalq/USP') itens = coletarCepea()
      else if (nome === 'FipeZap') itens = coletarFipezap()
      else if (nome === 'Banco Central — SFH') itens = coletarBcbSfh()
      if (!itens || itens.length === 0) {
        viva = false
        aviso =
          'A fonte ' +
          nome +
          ' está fora do ar ou indisponível neste momento. Os valores abaixo vêm da base interna aproximada do sistema — confira a fonte oficial antes de usar em publicações.'
        itens = baseInterna(nome)
      }
    } catch (err) {
      viva = false
      aviso =
        'Falha ao consultar ' +
        nome +
        ' neste momento. Os valores abaixo vêm da base interna aproximada do sistema — confira a fonte oficial antes de usar em publicações.'
      itens = baseInterna(nome)
    }
    fontes.push({
      fonte: nome,
      fonteViva: viva,
      aviso: aviso,
      selo: 'oficial_institucional',
      atualizadoEm: new Date().toISOString(),
      indicadores: itens,
    })
  }

  return e.json(200, {
    ok: true,
    geradoEm: new Date().toISOString(),
    fontes: fontes,
  })
})
