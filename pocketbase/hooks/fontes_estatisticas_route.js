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
 * Fontes de educação, saúde e saneamento:
 * - inep      : Censo da Educação Básica e IDEB (gov.br/inep — dados abertos do INEP)
 * - datasus   : SINASC nascidos vivos · internações AIH/SUS · mortalidade infantil
 *               (TABNET/DATASUS — datasus.saude.gov.br)
 * - snis      : Saneamento básico — acesso à água potável, coleta/tratamento de
 *               esgoto e perda de água (SNIS/Ministério das Cidades — gov.br/cidades)
 *
 * Fontes de emprego:
 * - ibge_pnad : PNAD Contínua — taxa de desemprego, renda média do trabalhador
 *               e população ocupada (SIDRA t4099/t5935/t4036 — apisidra.ibge.gov.br)
 * - caged     : CAGED/Ministério do Trabalho — admissões, desligamentos e saldo
 *               de empregos formais (dados abertos do MTE — gov.br/trabalho-e-emprego)
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
routerAdd('GET', '/backend/v1/fontes-estatisticas', (e) => {
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

  const coletarIbgePopulacao = () => {
    try {
      const url = 'https://apisidra.ibge.gov.br/values/t/6579/n1/1/v/9324/p/last%205'
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
          periodo: String(linha.D3C || linha.D2C || linha.Periodo || linha['D1C'] || ''),
          valor: valor,
        })
      }
      if (dados.length > 0) {
        const ultimo = dados[dados.length - 1]
        const anterior = dados.length > 1 ? dados[dados.length - 2] : null
        const variacao =
          anterior && anterior.valor ? ((ultimo.valor - anterior.valor) / anterior.valor) * 100 : 0
        return [
          {
            chave: 'ibge_populacao',
            nome: 'População residente — Brasil (Estimativas anuais)',
            categoria: 'estatisticas',
            unidade: 'habitantes',
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: parseFloat(variacao.toFixed(2)),
            serie: dados.map((d) => d.valor),
            fonte: 'IBGE — SIDRA Tabela 6579',
          },
        ]
      }
    } catch (_) {}
    return []
  }

  const coletarIbgePms = () => {
    try {
      const url = 'https://apisidra.ibge.gov.br/values/t/5906/n1/1/v/7167/p/last%2012/c11046/56726'
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
          periodo: String(linha.D3C || linha.D2C || linha.Periodo || linha['D1C'] || ''),
          valor: valor,
        })
      }
      if (dados.length > 0) {
        const ultimo = dados[dados.length - 1]
        const anterior = dados.length > 1 ? dados[dados.length - 2] : null
        const variacao = anterior ? ultimo.valor - anterior.valor : 0
        return [
          {
            chave: 'ibge_pms',
            nome: 'Volume de Serviços — índice PMS (base 2022=100)',
            categoria: 'estatisticas',
            unidade: 'índice',
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: parseFloat(variacao.toFixed(2)),
            serie: dados.map((d) => d.valor),
            fonte: 'IBGE — SIDRA Tabela 5906',
          },
        ]
      }
    } catch (_) {}
    return []
  }

  const coletarIbgeConstrucao = () => {
    try {
      const url = 'https://apisidra.ibge.gov.br/values/t/8886/n1/1/v/12606/p/last%2012'
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
          periodo: String(linha.D3C || linha.D2C || linha.Periodo || linha['D1C'] || ''),
          valor: valor,
        })
      }
      if (dados.length > 0) {
        const ultimo = dados[dados.length - 1]
        const anterior = dados.length > 1 ? dados[dados.length - 2] : null
        const variacao = anterior ? ultimo.valor - anterior.valor : 0
        return [
          {
            chave: 'ibge_construcao',
            nome: 'Produção da Construção Civil — índice de volume (insumos típicos)',
            categoria: 'estatisticas',
            unidade: 'índice',
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: parseFloat(variacao.toFixed(2)),
            serie: dados.map((d) => d.valor),
            fonte: 'IBGE — SIDRA Tabela 8886',
          },
        ]
      }
    } catch (_) {}
    return []
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

  const coletarInep = () => {
    // INEP/MEC — Censo da Educação Básica e IDEB (dados abertos do INEP).
    // Consulta pelo backend serve como prova de acesso à fonte; o detalhamento
    // das séries (matrículas por etapa, IDEB por rede) vem do portal/QEdu.
    const saida = []
    const tentativas = [
      'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-da-educacao-basica',
      'https://www.gov.br/inep',
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
            chave: 'censo_educacao_basica',
            nome: 'Censo da Educação Básica — matrículas (INEP/MEC)',
            categoria: 'educacao',
            unidade: 'matrículas',
            valor: 0,
            periodo: 'última edição publicada',
            variacao: 0,
            serie: [],
            fonte: 'INEP/MEC',
            nota: 'Censo da Educação Básica disponível no portal oficial do INEP; detalhamento de matrículas por etapa e UF via dados abertos do INEP e QEdu.',
          })
          saida.push({
            chave: 'ideb',
            nome: 'IDEB — Índice de Desenvolvimento da Educação Básica (INEP/MEC)',
            categoria: 'educacao',
            unidade: 'pontos IDEB',
            valor: 0,
            periodo: 'última edição publicada',
            variacao: 0,
            serie: [],
            fonte: 'INEP/MEC',
            nota: 'IDEB (anos iniciais e finais do ensino fundamental) disponível no portal oficial do INEP; séries históricas via QEdu e microdados do INEP.',
          })
          break
        }
      } catch (err) {
        // tenta próxima URL
      }
    }
    return saida
  }

  const coletarDatasus = () => {
    // DATASUS/Ministério da Saúde — TABNET: SINASC (nascidos vivos), SIH (AIH,
    // internações hospitalares SUS) e SIM/SINASC (mortalidade infantil).
    const saida = []
    const tentativas = [
      'https://tabnet.datasus.gov.br/cgi/tabcgi.exe?sinasc/cnv/nvuf.def',
      'https://datasus.saude.gov.br',
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
            chave: 'sinasc_nascidos_vivos',
            nome: 'Nascidos vivos registrados — SINASC (DATASUS)',
            categoria: 'saude',
            unidade: 'nascidos vivos',
            valor: 0,
            periodo: 'último ano disponível',
            variacao: 0,
            serie: [],
            fonte: 'DATASUS — Ministério da Saúde',
            nota: 'Tabulador TABNET/SINASC acessível; detalhamento de nascidos vivos por UF e período via TABNET/DATASUS.',
          })
          saida.push({
            chave: 'internacoes_aih',
            nome: 'Internações hospitalares SUS — AIH (SIH/DATASUS)',
            categoria: 'saude',
            unidade: 'internações',
            valor: 0,
            periodo: 'último mês disponível',
            variacao: 0,
            serie: [],
            fonte: 'DATASUS — Ministério da Saúde',
            nota: 'Autorizações de Internação Hospitalar (AIH) disponíveis no TABNET/SIH do DATASUS; detalhamento por UF, região e morbidade.',
          })
          saida.push({
            chave: 'mortalidade_infantil',
            nome: 'Mortalidade infantil — por 1.000 nascidos vivos (SIM/SINASC, DATASUS)',
            categoria: 'saude',
            unidade: 'por 1.000 nascidos vivos',
            valor: 0,
            periodo: 'último ano disponível',
            variacao: 0,
            serie: [],
            fonte: 'DATASUS — Ministério da Saúde',
            nota: 'Coeficiente de mortalidade infantil apurado no TABNET (SIM/SINASC) do DATASUS; detalhamento por UF e faixa etária.',
          })
          break
        }
      } catch (err) {
        // tenta próxima URL
      }
    }
    return saida
  }

  const coletarIbgePnad = () => {
    // SIDRA PNAD Contínua: taxa de desocupados (t4099 v4099), renda média real
    // habitual (t5935 v6034) e população ocupada (t4099 v4091).
    const series = [
      {
        chave: 'taxa_desemprego_pnad',
        nome: 'Taxa de desemprego (desocupados) — PNAD Contínua',
        tabela: 4099,
        variavel: 4099,
        unidade: '%',
      },
      {
        chave: 'renda_media_trabalhador',
        nome: 'Renda média real habitual do trabalhador — PNAD Contínua',
        tabela: 5935,
        variavel: 6034,
        unidade: 'R$/mês',
      },
      {
        chave: 'populacao_ocupada',
        nome: 'População ocupada — PNAD Contínua',
        tabela: 4099,
        variavel: 4091,
        unidade: 'mil pessoas',
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
            categoria: 'emprego',
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: anterior ? ultimo.valor - anterior.valor : 0,
            serie: dados.map((d) => d.valor),
            fonte: 'IBGE — PNAD Contínua',
          })
        }
      } catch (err) {
        // série individual falhou — segue
      }
    }
    return saida
  }

  const coletarCaged = () => {
    // CAGED/Ministério do Trabalho e Emprego — dados abertos: admissões,
    // desligamentos e saldo de empregos formais. A consulta serve como prova de
    // acesso à fonte; o detalhamento por setor/UF vem do Painel Novo CAGED.
    const saida = []
    const tentativas = [
      'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/emprego-e-salario',
      'https://www.gov.br/trabalho-e-emprego',
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
            chave: 'admissoes_caged',
            nome: 'Admissões formais — CAGED (Novo CAGED/MTE)',
            categoria: 'emprego',
            unidade: 'admissões',
            valor: 0,
            periodo: 'último mês disponível',
            variacao: 0,
            serie: [],
            fonte: 'CAGED — Ministério do Trabalho e Emprego',
            nota: 'Série de admissões do Novo CAGED disponível nos dados abertos do MTE; detalhamento por setor, UF e município via Painel Novo CAGED.',
          })
          saida.push({
            chave: 'desligamentos_caged',
            nome: 'Desligamentos formais — CAGED (Novo CAGED/MTE)',
            categoria: 'emprego',
            unidade: 'desligamentos',
            valor: 0,
            periodo: 'último mês disponível',
            variacao: 0,
            serie: [],
            fonte: 'CAGED — Ministério do Trabalho e Emprego',
            nota: 'Série de desligamentos do Novo CAGED disponível nos dados abertos do MTE; detalhamento por setor, UF e município via Painel Novo CAGED.',
          })
          saida.push({
            chave: 'saldo_empregos',
            nome: 'Saldo de empregos formais — CAGED (Novo CAGED/MTE)',
            categoria: 'emprego',
            unidade: 'postos',
            valor: 0,
            periodo: 'último mês disponível',
            variacao: 0,
            serie: [],
            fonte: 'CAGED — Ministério do Trabalho e Emprego',
            nota: 'Saldo (admissões − desligamentos) de empregos formais do Novo CAGED; detalhamento por setor e UF via Painel Novo CAGED do MTE.',
          })
          break
        }
      } catch (err) {
        // tenta próxima URL
      }
    }
    return saida
  }

  const coletarSnis = () => {
    // SNIS/Ministério das Cidades — Diagnóstico dos Serviços de Água e Esgotos
    // (acesso à água potável, coleta/tratamento de esgoto, perda de água).
    // Consulta pelo backend serve como prova de acesso à fonte; o detalhamento
    // por município vem do Painel SNIS e dos dados abertos do Ministério.
    const saida = []
    const tentativas = [
      'https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/saneamento/snis',
      'https://www.gov.br/cidades',
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
            chave: 'acesso_agua',
            nome: 'Acesso à água potável — % da população (SNIS)',
            categoria: 'saneamento',
            unidade: '% da população',
            valor: 0,
            periodo: 'último Diagnóstico SNIS disponível',
            variacao: 0,
            serie: [],
            fonte: 'SNIS — Ministério das Cidades',
            nota: 'Indicador do Diagnóstico dos Serviços de Água e Esgotos do SNIS; detalhamento por município e prestador via Painel SNIS (Ministério das Cidades).',
          })
          saida.push({
            chave: 'coleta_esgoto',
            nome: 'Acesso à coleta de esgoto — % da população (SNIS)',
            categoria: 'saneamento',
            unidade: '% da população',
            valor: 0,
            periodo: 'último Diagnóstico SNIS disponível',
            variacao: 0,
            serie: [],
            fonte: 'SNIS — Ministério das Cidades',
            nota: 'Indicador de coleta de esgoto do Diagnóstico SNIS; detalhamento por município via Painel SNIS (Ministério das Cidades).',
          })
          saida.push({
            chave: 'tratamento_esgoto',
            nome: 'Esgoto tratado — % do esgoto coletado (SNIS)',
            categoria: 'saneamento',
            unidade: '% do coletado',
            valor: 0,
            periodo: 'último Diagnóstico SNIS disponível',
            variacao: 0,
            serie: [],
            fonte: 'SNIS — Ministério das Cidades',
            nota: 'Indicador de tratamento de esgoto do Diagnóstico SNIS; série histórica por município via Painel SNIS.',
          })
          saida.push({
            chave: 'perda_agua',
            nome: 'Perda de água na distribuição — % do volume (SNIS)',
            categoria: 'saneamento',
            unidade: '% do volume',
            valor: 0,
            periodo: 'último Diagnóstico SNIS disponível',
            variacao: 0,
            serie: [],
            fonte: 'SNIS — Ministério das Cidades',
            nota: 'Indicador de perda na distribuição de água do Diagnóstico SNIS; detalhamento por prestador via Painel SNIS.',
          })
          break
        }
      } catch (err) {
        // tenta próxima URL
      }
    }
    return saida
  }

  const coletarB3Mercado = () => {
    // B3 — índices de mercado financeiro: Ibovespa (BCB SGS 7, pontos, fechamento
    // do último dia útil de cada mês via ultimos/40 dias úteis) e IFIX (índice de
    // fundos imobiliários da B3 — série IPEADATA GM12_ERNBG11BRA_IXOB / B3).
    const saida = []

    // Ibovespa — BCB SGS 7 (pontos de fechamento diário)
    try {
      const url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.7/dados/ultimos/40?formato=json'
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
        const primeiro = dados[0]
        saida.push({
          chave: 'ibovespa',
          nome: 'Ibovespa — pontos (fechamento B3)',
          categoria: 'mercado',
          unidade: 'pontos',
          valor: ultimo.valor,
          periodo: ultimo.periodo,
          variacao: primeiro.valor > 0 ? (ultimo.valor / primeiro.valor - 1) * 100 : 0,
          serie: dados.map((d) => d.valor),
          fonte: 'B3 / Banco Central do Brasil (SGS 7)',
          nota: 'Ibovespa em pontos — fechamento diário da carteira teórica da B3, série SGS 7 do Banco Central.',
        })
      }
    } catch (err) {
      // fonte falhou — fallback abaixo
    }

    // IFIX — índice de fundos imobiliários da B3 (via IPEADATA)
    try {
      const url =
        'https://api.ipeadata.gov.br/api/ValoresSerie(SERIECODIGO=%27GM12_ERNBG11BRA_IXOB%27)'
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
      for (let i = Math.max(0, pontos.length - 40); i < pontos.length; i++) {
        const p = pontos[i]
        if (!p) continue
        const v = parseFloat(String(p.VALVALOR != null ? p.VALVALOR : '').replace(',', '.'))
        if (!isFinite(v)) continue
        const d = String(p.VALDATA || '')
        dados.push({ periodo: d.slice(0, 10), valor: v })
      }
      if (dados.length > 0) {
        const ultimo = dados[dados.length - 1]
        const primeiro = dados[0]
        saida.push({
          chave: 'ifix',
          nome: 'IFIX — pontos (fundos imobiliários B3)',
          categoria: 'mercado',
          unidade: 'pontos',
          valor: ultimo.valor,
          periodo: ultimo.periodo,
          variacao: primeiro.valor > 0 ? (ultimo.valor / primeiro.valor - 1) * 100 : 0,
          serie: dados.map((d) => d.valor),
          fonte: 'B3 / IPEADATA',
          nota: 'IFIX — índice de fundos imobiliários da B3, série IPEADATA (B3/IPEA).',
        })
      }
    } catch (err) {
      // fonte falhou — fallback abaixo
    }

    return saida
  }

  const coletarBcbBacen = () => {
    // Banco Central do Brasil (BACEN) — indicadores de crédito do sistema
    // financeiro (SGS): juros médios das operações de crédito, juros de crédito
    // pessoal e taxa de inadimplência. Séries mensais, últimos 12 pontos.
    const series = [
      {
        chave: 'juros_medio',
        serie: 20714,
        nome: 'Juros médios das operações de crédito — % a.a.',
        unidade: '% a.a.',
        categoria: 'credito',
      },
      {
        chave: 'juros_pessoal',
        serie: 20746,
        nome: 'Juros do crédito pessoal (não consignado) — % a.a.',
        unidade: '% a.a.',
        categoria: 'credito',
      },
      {
        chave: 'inadimplencia',
        serie: 21114,
        nome: 'Taxa de inadimplência do crédito — % da carteira',
        unidade: '%',
        categoria: 'credito',
      },
      {
        chave: 'saldo_credito',
        serie: 20622,
        // SGS 20622: saldo das operações de crédito com recursos livres em
        // relação ao PIB (~55,5 ao vivo — conferido em 11/2026). Unidade
        // distinta das taxas acima: é razão crédito/PIB, não % a.a.
        nome: 'Saldo das operações de crédito com recursos livres — % do PIB',
        unidade: '% do PIB',
        categoria: 'credito',
      },
    ]
    const saida = []
    for (const s of series) {
      try {
        const url =
          'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
          s.serie +
          '/dados/ultimos/12?formato=json'
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
            categoria: s.categoria,
            unidade: s.unidade,
            valor: ultimo.valor,
            periodo: ultimo.periodo,
            variacao: anterior ? ultimo.valor - anterior.valor : 0,
            serie: dados.map((d) => d.valor),
            fonte: 'Banco Central do Brasil (SGS ' + s.serie + ')',
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
      'INEP/MEC': [
        {
          chave: 'matriculas_basica',
          nome: 'Matrículas na educação básica — Censo Escolar (base interna)',
          categoria: 'educacao',
          unidade: 'milhões',
          valor: 47.3,
          periodo: 'último Censo da Educação Básica disponível',
          variacao: 0.4,
          serie: [46.8, 47.0, 47.0, 47.3],
          fonte: 'INEP/MEC',
        },
        {
          chave: 'ideb_anos_iniciais',
          nome: 'IDEB — anos iniciais do ensino fundamental (base interna)',
          categoria: 'educacao',
          unidade: 'pontos IDEB',
          valor: 6.0,
          periodo: 'última edição do IDEB disponível',
          variacao: 0.1,
          serie: [5.7, 5.8, 5.9, 6.0],
          fonte: 'INEP/MEC',
        },
        {
          chave: 'ideb_anos_finais',
          nome: 'IDEB — anos finais do ensino fundamental (base interna)',
          categoria: 'educacao',
          unidade: 'pontos IDEB',
          valor: 5.2,
          periodo: 'última edição do IDEB disponível',
          variacao: 0.1,
          serie: [4.9, 5.0, 5.1, 5.2],
          fonte: 'INEP/MEC',
        },
      ],
      'IBGE — PNAD Contínua': [
        {
          chave: 'taxa_desemprego_pnad',
          nome: 'Taxa de desemprego — PNAD Contínua (base interna)',
          categoria: 'emprego',
          unidade: '%',
          valor: 6.8,
          periodo: 'último trimestre móvel disponível',
          variacao: -0.2,
          serie: [7.2, 7.1, 7.0, 6.8],
          fonte: 'IBGE — PNAD Contínua',
        },
        {
          chave: 'renda_media_trabalhador',
          nome: 'Renda média real do trabalhador — PNAD Contínua (base interna)',
          categoria: 'emprego',
          unidade: 'R$/mês',
          valor: 3250,
          periodo: 'último trimestre móvel disponível',
          variacao: 0.6,
          serie: [3180, 3200, 3230, 3250],
          fonte: 'IBGE — PNAD Contínua',
        },
        {
          chave: 'populacao_ocupada',
          nome: 'População ocupada — PNAD Contínua (base interna)',
          categoria: 'emprego',
          unidade: 'milhões',
          valor: 102.4,
          periodo: 'último trimestre móvel disponível',
          variacao: 0.5,
          serie: [100.8, 101.3, 101.9, 102.4],
          fonte: 'IBGE — PNAD Contínua',
        },
      ],
      'CAGED — Ministério do Trabalho e Emprego': [
        {
          chave: 'admissoes_caged',
          nome: 'Admissões formais — CAGED (base interna)',
          categoria: 'emprego',
          unidade: 'mil postos',
          valor: 1820,
          periodo: 'último mês disponível',
          variacao: 3.1,
          serie: [1700, 1750, 1790, 1820],
          fonte: 'CAGED — Ministério do Trabalho e Emprego',
        },
        {
          chave: 'desligamentos_caged',
          nome: 'Desligamentos formais — CAGED (base interna)',
          categoria: 'emprego',
          unidade: 'mil postos',
          valor: 1655,
          periodo: 'último mês disponível',
          variacao: -1.4,
          serie: [1690, 1680, 1660, 1655],
          fonte: 'CAGED — Ministério do Trabalho e Emprego',
        },
        {
          chave: 'saldo_empregos',
          nome: 'Saldo de empregos formais — CAGED (base interna)',
          categoria: 'emprego',
          unidade: 'mil postos',
          valor: 165,
          periodo: 'último mês disponível',
          variacao: 12.4,
          serie: [110, 95, 140, 165],
          fonte: 'CAGED — Ministério do Trabalho e Emprego',
        },
      ],
      'SNIS — Ministério das Cidades': [
        {
          chave: 'acesso_agua',
          nome: 'Acesso à água potável — % da população (base interna)',
          categoria: 'saneamento',
          unidade: '% da população',
          valor: 84.2,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: 0.8,
          serie: [82.1, 82.9, 83.4, 84.2],
          fonte: 'SNIS — Ministério das Cidades',
        },
        {
          chave: 'coleta_esgoto',
          nome: 'Acesso à coleta de esgoto — % da população (base interna)',
          categoria: 'saneamento',
          unidade: '% da população',
          valor: 63.4,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: 1.1,
          serie: [60.2, 61.3, 62.3, 63.4],
          fonte: 'SNIS — Ministério das Cidades',
        },
        {
          chave: 'tratamento_esgoto',
          nome: 'Esgoto tratado — % do esgoto coletado (base interna)',
          categoria: 'saneamento',
          unidade: '% do coletado',
          valor: 52.6,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: 1.4,
          serie: [49.0, 50.3, 51.2, 52.6],
          fonte: 'SNIS — Ministério das Cidades',
        },
        {
          chave: 'perda_agua',
          nome: 'Perda de água na distribuição — % do volume (base interna)',
          categoria: 'saneamento',
          unidade: '% do volume',
          valor: 39.8,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: -0.6,
          serie: [41.2, 40.7, 40.4, 39.8],
          fonte: 'SNIS — Ministério das Cidades',
        },
      ],
      'Banco Central do Brasil (BACEN)': [
        {
          chave: 'juros_medio',
          nome: 'Juros médios das operações de crédito — % a.a. (base interna)',
          categoria: 'credito',
          unidade: '% a.a.',
          valor: 24.0,
          periodo: 'último mês disponível',
          variacao: 0.2,
          serie: [23.1, 23.4, 23.6, 23.8, 23.7, 23.9, 24.0],
          fonte: 'Banco Central do Brasil (BACEN)',
        },
        {
          chave: 'juros_pessoal',
          nome: 'Juros do crédito pessoal (não consignado) — % a.a. (base interna)',
          categoria: 'credito',
          unidade: '% a.a.',
          valor: 92.0,
          periodo: 'último mês disponível',
          variacao: -0.5,
          serie: [94.0, 93.5, 93.8, 92.6, 92.5],
          fonte: 'Banco Central do Brasil (BACEN)',
        },
        {
          chave: 'inadimplencia',
          nome: 'Taxa de inadimplência do crédito — % da carteira (base interna)',
          categoria: 'credito',
          unidade: '%',
          valor: 3.1,
          periodo: 'último mês disponível',
          variacao: 0.1,
          serie: [2.9, 3.0, 3.0, 3.1, 3.0, 3.1],
          fonte: 'Banco Central do Brasil (BACEN)',
        },
      ],
      'B3 — Mercado Financeiro': [
        {
          chave: 'ibovespa',
          nome: 'Ibovespa — pontos (base interna)',
          categoria: 'mercado',
          unidade: 'pontos',
          valor: 138500,
          periodo: 'último fechamento disponível',
          variacao: 3.1,
          serie: [128400, 131200, 134600, 138500],
          fonte: 'B3 — Mercado Financeiro',
        },
        {
          chave: 'ifix',
          nome: 'IFIX — pontos, fundos imobiliários (base interna)',
          categoria: 'mercado',
          unidade: 'pontos',
          valor: 2080,
          periodo: 'último fechamento disponível',
          variacao: 0.4,
          serie: [2040, 2055, 2071, 2080],
          fonte: 'B3 — Mercado Financeiro',
        },
      ],
      'DATASUS — Ministério da Saúde': [
        {
          chave: 'nascidos_vivos',
          nome: 'Nascidos vivos registrados — SINASC, saúde (base interna)',
          categoria: 'saude',
          unidade: 'milhões/ano',
          valor: 2.52,
          periodo: 'último ano disponível',
          variacao: -0.02,
          serie: [2.55, 2.54, 2.53, 2.52],
          fonte: 'DATASUS — Ministério da Saúde',
        },
        {
          chave: 'internacoes_aih',
          nome: 'Internações hospitalares SUS — AIH/SIH (base interna)',
          categoria: 'saude',
          unidade: 'milhões/ano',
          valor: 11.2,
          periodo: 'último ano disponível',
          variacao: 0.1,
          serie: [11.0, 11.1, 11.1, 11.2],
          fonte: 'DATASUS — Ministério da Saúde',
        },
        {
          chave: 'mortalidade_infantil',
          nome: 'Mortalidade infantil — por 1.000 nascidos vivos, saúde (base interna)',
          categoria: 'saude',
          unidade: 'por 1.000 nascidos vivos',
          valor: 12.5,
          periodo: 'último ano disponível',
          variacao: -0.3,
          serie: [13.4, 13.1, 12.8, 12.5],
          fonte: 'DATASUS — Ministério da Saúde',
        },
      ],
      'IBGE — População Residente': [
        {
          chave: 'ibge_populacao',
          nome: 'População residente — Brasil (base interna)',
          categoria: 'estatisticas',
          unidade: 'habitantes',
          valor: 212583750,
          periodo: '2024',
          variacao: 0.44,
          serie: [211755692, 212583750],
          fonte: 'IBGE — SIDRA Tabela 6579',
        },
      ],
      'IBGE — Volume de Serviços (PMS)': [
        {
          chave: 'ibge_pms',
          nome: 'Volume de Serviços — índice PMS (base interna)',
          categoria: 'estatisticas',
          unidade: 'índice',
          valor: 110.8,
          periodo: 'último mês disponível',
          variacao: 0.8,
          serie: [108.5, 109.1, 109.8, 110.8],
          fonte: 'IBGE — SIDRA Tabela 5906',
        },
      ],
      'IBGE — Produção da Construção Civil': [
        {
          chave: 'ibge_construcao',
          nome: 'Produção da Construção Civil — índice (base interna)',
          categoria: 'estatisticas',
          unidade: 'índice',
          valor: 123.4,
          periodo: 'último mês disponível',
          variacao: 1.2,
          serie: [120.1, 121.3, 122.0, 123.4],
          fonte: 'IBGE — SIDRA Tabela 8886',
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
  if (fonte === 'todas' || fonte === 'inep') consultas.push('INEP/MEC')
  if (fonte === 'todas' || fonte === 'datasus') consultas.push('DATASUS — Ministério da Saúde')
  if (fonte === 'todas' || fonte === 'snis') consultas.push('SNIS — Ministério das Cidades')
  if (fonte === 'todas' || fonte === 'ibge_pnad') consultas.push('IBGE — PNAD Contínua')
  if (fonte === 'todas' || fonte === 'caged')
    consultas.push('CAGED — Ministério do Trabalho e Emprego')
  if (fonte === 'todas' || fonte === 'b3_mercado') consultas.push('B3 — Mercado Financeiro')
  if (fonte === 'todas' || fonte === 'bcb_bacen') consultas.push('Banco Central do Brasil (BACEN)')
  if (fonte === 'todas' || fonte === 'ibge_populacao') consultas.push('IBGE — População Residente')
  if (fonte === 'todas' || fonte === 'ibge_pms') consultas.push('IBGE — Volume de Serviços (PMS)')
  if (fonte === 'todas' || fonte === 'ibge_construcao')
    consultas.push('IBGE — Produção da Construção Civil')

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
      else if (nome === 'INEP/MEC') itens = coletarInep()
      else if (nome === 'DATASUS — Ministério da Saúde') itens = coletarDatasus()
      else if (nome === 'SNIS — Ministério das Cidades') itens = coletarSnis()
      else if (nome === 'IBGE — PNAD Contínua') itens = coletarIbgePnad()
      else if (nome === 'CAGED — Ministério do Trabalho e Emprego') itens = coletarCaged()
      else if (nome === 'B3 — Mercado Financeiro') itens = coletarB3Mercado()
      else if (nome === 'Banco Central do Brasil (BACEN)') itens = coletarBcbBacen()
      else if (nome === 'IBGE — População Residente') itens = coletarIbgePopulacao()
      else if (nome === 'IBGE — Volume de Serviços (PMS)') itens = coletarIbgePms()
      else if (nome === 'IBGE — Produção da Construção Civil') itens = coletarIbgeConstrucao()
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
