/**
 * FONTES ESTATÍSTICAS OFICIAIS — proxy backend (IBGE · Tesouro Nacional · IPEA)
 *
 * Mesmo padrão anti-bloqueio do projeto (ver indicadores_economicos_route.js):
 * o navegador NUNCA fala direto com a fonte oficial — toda consulta parte daqui,
 * com tempo limite curto e fallback pela base interna com aviso transparente.
 * Nunca erro cru, nunca crash: qualquer falha vira resposta 200 com fonteViva=false.
 */
routerAdd('GET', '/backend/v1/fontes-estatisticas', (e) => {
  const fonte = e.urlParams().get('fonte') || 'todas'
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
    }
    const lista = internas[fonteNome] || []
    for (let i = 0; i < lista.length; i++) lista[i].baseInterna = true
    return lista
  }

  const consultas = []
  if (fonte === 'todas' || fonte === 'ibge') consultas.push('IBGE')
  if (fonte === 'todas' || fonte === 'tesouro') consultas.push('Tesouro Nacional')
  if (fonte === 'todas' || fonte === 'ipea') consultas.push('IPEA')

  const fontes = []
  for (const nome of consultas) {
    let itens = []
    let viva = true
    let aviso = ''
    try {
      if (nome === 'IBGE') itens = coletarIbge()
      else if (nome === 'Tesouro Nacional') itens = coletarTesouro()
      else if (nome === 'IPEA') itens = coletarIpea()
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
