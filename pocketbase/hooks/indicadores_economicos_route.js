/**
 * ROTA PROXY — Indicadores Econômicos e Financeiros (Banco Central)
 * GET /backend/v1/indicadores-economicos[?atualizar=1]
 *
 * ── PADRÃO ANTI-BLOQUEIO DO PROJETO ──
 * O navegador NUNCA fala direto com o BCB (o Edge do usuário bloqueia domínios
 * externos — mesmo padrão do /backend/v1/download-resolution). Tudo passa por
 * este hook, com timeout curto, cache em `economic_indicators_cache` e fallback
 * com aviso transparente — nunca erro cru.
 *
 * ── REGRA DE ESCOPO DA JSVM (lição das rodadas anteriores) ──
 * Os callbacks (routerAdd/cronAdd) rodam em pool separado e NÃO enxergam
 * constantes/funções de nível superior do arquivo. TODA a lógica vive DENTRO
 * do callback do routerAdd; `globalThis.buscarContextoIndicadoresBCB` é
 * totalmente autossuficiente (só usa $app/$http, que são builtins do pool).
 */
routerAdd('GET /backend/v1/indicadores-economicos', (e) => {
  const CABECALHO_BCB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }

  // SGS: séries temporais do Banco Central (id → indicador)
  const SERIES_INDICADORES = [
    {
      chave: 'ipca',
      nome: 'IPCA',
      categoria: 'inflacao',
      serie: 433,
      unidade: '% a.m.',
      descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE',
    },
    {
      chave: 'inpc',
      nome: 'INPC',
      categoria: 'inflacao',
      serie: 188,
      unidade: '% a.m.',
      descricao: 'Índice Nacional de Preços ao Consumidor — IBGE',
    },
    {
      chave: 'igpm',
      nome: 'IGP-M',
      categoria: 'inflacao',
      serie: 189,
      unidade: '% a.m.',
      descricao: 'Índice Geral de Preços — Mercado — FGV',
    },
    {
      chave: 'ipc',
      nome: 'IPC',
      categoria: 'inflacao',
      serie: 192,
      unidade: '% a.m.',
      descricao: 'Índice de Preços ao Consumidor — Fipe',
    },
    {
      chave: 'selic',
      nome: 'Selic',
      categoria: 'taxa',
      serie: 4390,
      unidade: '% a.a.',
      descricao: 'Taxa básica de juros — Copom',
    },
    {
      chave: 'cdi',
      nome: 'CDI',
      categoria: 'taxa',
      serie: 12,
      unidade: '% a.a.',
      descricao: 'Taxa DI média diária — B3',
    },
    {
      chave: 'tr',
      nome: 'TR',
      categoria: 'taxa',
      serie: 226,
      unidade: '% a.m.',
      descricao: 'Taxa Referencial',
    },
    {
      chave: 'poupanca',
      nome: 'Poupança',
      categoria: 'taxa',
      serie: 195,
      unidade: '% a.m.',
      descricao: 'Rendimento da poupança',
    },
  ]

  const NOMES_MOEDAS = {
    USD: 'Dólar americano',
    EUR: 'Euro',
    GBP: 'Libra esterlina',
    JPY: 'Iene japonês',
    ARS: 'Peso argentino',
    CNY: 'Yuan chinês',
    CAD: 'Dólar canadense',
    CHF: 'Franco suíço',
    AUD: 'Dólar australiano',
    BRL: 'Real brasileiro',
  }

  const INDICADORES_FALLBACK_HOOK = [
    {
      chave: 'ipca',
      nome: 'IPCA',
      categoria: 'inflacao',
      unidade: '% a.m.',
      valorAtual: 0.26,
      variacao: -0.11,
      serie: [0.38, 0.24, 0.24, 0.21, 0.38, 0.17, 0.22, 0.38, 0.44, 0.42, 0.48, 0.26],
      descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE',
    },
    {
      chave: 'inpc',
      nome: 'INPC',
      categoria: 'inflacao',
      unidade: '% a.m.',
      valorAtual: 0.22,
      variacao: -0.09,
      serie: [0.42, 0.36, 0.38, 0.24, 0.51, 0.25, 0.19, 0.35, 0.46, 0.39, 0.42, 0.22],
      descricao: 'Índice Nacional de Preços ao Consumidor — IBGE',
    },
    {
      chave: 'igpm',
      nome: 'IGP-M',
      categoria: 'inflacao',
      unidade: '% a.m.',
      valorAtual: 0.31,
      variacao: 0.05,
      serie: [0.42, 0.95, -0.44, -0.51, 0.64, 0.87, -0.19, 0.22, 0.41, 0.65, 0.28, 0.31],
      descricao: 'Índice Geral de Preços — Mercado — FGV',
    },
    {
      chave: 'ipc',
      nome: 'IPC',
      categoria: 'inflacao',
      unidade: '% a.m.',
      valorAtual: 0.24,
      variacao: 0.02,
      serie: [0.31, 0.29, 0.27, 0.22, 0.36, 0.19, 0.21, 0.31, 0.38, 0.35, 0.41, 0.24],
      descricao: 'Índice de Preços ao Consumidor — Fipe',
    },
    {
      chave: 'selic',
      nome: 'Selic',
      categoria: 'taxa',
      unidade: '% a.a.',
      valorAtual: 15.0,
      variacao: 0.0,
      serie: [13.25, 13.25, 13.5, 14.25, 14.75, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0],
      descricao: 'Taxa básica de juros — Copom',
    },
    {
      chave: 'cdi',
      nome: 'CDI',
      categoria: 'taxa',
      unidade: '% a.a.',
      valorAtual: 14.9,
      variacao: 0.0,
      serie: [13.15, 13.15, 13.4, 14.15, 14.65, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9],
      descricao: 'Taxa DI média diária — B3',
    },
    {
      chave: 'tr',
      nome: 'TR',
      categoria: 'taxa',
      unidade: '% a.m.',
      valorAtual: 0.09,
      variacao: 0.01,
      serie: [0.05, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09],
      descricao: 'Taxa Referencial',
    },
    {
      chave: 'poupanca',
      nome: 'Poupança',
      categoria: 'taxa',
      unidade: '% a.m.',
      valorAtual: 0.62,
      variacao: 0.0,
      serie: [0.54, 0.54, 0.55, 0.58, 0.6, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62],
      descricao: 'Rendimento da poupança',
    },
  ]

  const MOEDAS_FALLBACK_HOOK = [
    { codigo: 'USD', cotacaoCompra: 5.4, cotacaoVenda: 5.41, dataCotacao: '' },
    { codigo: 'EUR', cotacaoCompra: 6.3, cotacaoVenda: 6.31, dataCotacao: '' },
    { codigo: 'GBP', cotacaoCompra: 7.3, cotacaoVenda: 7.31, dataCotacao: '' },
    { codigo: 'JPY', cotacaoCompra: 0.036, cotacaoVenda: 0.0361, dataCotacao: '' },
    { codigo: 'ARS', cotacaoCompra: 0.0045, cotacaoVenda: 0.0046, dataCotacao: '' },
    { codigo: 'CNY', cotacaoCompra: 0.75, cotacaoVenda: 0.751, dataCotacao: '' },
    { codigo: 'CAD', cotacaoCompra: 3.9, cotacaoVenda: 3.91, dataCotacao: '' },
    { codigo: 'CHF', cotacaoCompra: 6.6, cotacaoVenda: 6.61, dataCotacao: '' },
    { codigo: 'AUD', cotacaoCompra: 3.55, cotacaoVenda: 3.56, dataCotacao: '' },
  ]

  // ── helpers (definidos DENTRO do callback — regra de escopo da JSVM) ──

  function fetchJsonSeguro(url, timeoutSegundos) {
    const res = $http.send({
      url: url,
      method: 'GET',
      headers: CABECALHO_BCB,
      timeout: timeoutSegundos || 8,
    })
    if (!res || res.statusCode < 200 || res.statusCode >= 400) {
      throw new Error('HTTP ' + (res ? res.statusCode : 'sem resposta') + ' em ' + url)
    }
    let dados = res.json
    if (!dados && res.body) {
      try {
        dados = JSON.parse(res.body)
      } catch (_) {
        throw new Error('Resposta não-JSON do BCB')
      }
    }
    return dados
  }

  function dataIsoParaPtax(d) {
    // PTAX usa MM-DD-YYYY
    const iso = (d || new Date()).toISOString()
    return iso.slice(5, 7) + '-' + iso.slice(8, 10) + '-' + iso.slice(0, 4)
  }

  function coletarSerieSGS(def) {
    const url =
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
      def.serie +
      '/dados/ultimos/12?formato=json'
    const pontos = fetchJsonSeguro(url, 8)
    if (!Array.isArray(pontos) || pontos.length === 0) throw new Error('Série vazia ' + def.serie)
    const serie = pontos.map((p) => Number(String(p.valor).replace(',', '.')) || 0)
    const atual = serie[serie.length - 1]
    const anterior = serie.length > 1 ? serie[serie.length - 2] : atual
    const dataRef = pontos[pontos.length - 1].data || ''
    return {
      chave: def.chave,
      nome: def.nome,
      categoria: def.categoria,
      unidade: def.unidade,
      valorAtual: atual,
      variacao: Math.round((atual - anterior) * 10000) / 10000,
      dataReferencia: dataRef,
      serie: serie,
      descricao: def.descricao + ' — BCB série SGS ' + def.serie,
    }
  }

  function coletarMoedaPTAX() {
    // CotacaoMoedasDia de um dia útil recente (tenta até 5 dias para trás)
    let bruto = null
    let dataCotacao = ''
    for (let recuo = 0; recuo < 5; recuo++) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - recuo)
      const dataPtax = dataIsoParaPtax(d)
      const url =
        'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedasDia(dataHoraCotacao=@dataHoraCotacao)?@dataHoraCotacao=%27' +
        dataPtax +
        '%27&$format=json'
      try {
        const resposta = fetchJsonSeguro(url, 8)
        if (resposta && Array.isArray(resposta.value) && resposta.value.length > 0) {
          bruto = resposta.value
          dataCotacao = d.toISOString().slice(0, 10)
          break
        }
      } catch (_) {
        // tenta o dia anterior
      }
    }
    if (!bruto) throw new Error('PTAX indisponível')

    // Fechamento por moeda (tipoBoletim "Fechamento"; senão o último registro)
    const porMoeda = {}
    for (let i = 0; i < bruto.length; i++) {
      const item = bruto[i]
      const codigo = String(item.moeda || '').toUpperCase()
      if (!codigo || !NOMES_MOEDAS[codigo] || codigo === 'BRL') continue
      const existente = porMoeda[codigo]
      const ehFechamento = String(item.tipoBoletim || '') === 'Fechamento PTAX'
      if (!existente || (ehFechamento && !existente.fechou)) {
        porMoeda[codigo] = {
          codigo: codigo,
          nome: NOMES_MOEDAS[codigo],
          cotacaoCompra: Number(item.cotacaoCompra) || 0,
          cotacaoVenda: Number(item.cotacaoVenda) || 0,
          dataCotacao: dataCotacao,
          fechou: ehFechamento,
        }
      }
    }

    const moedas = []
    for (const codigo of Object.keys(NOMES_MOEDAS)) {
      if (codigo === 'BRL') continue
      const m = porMoeda[codigo]
      if (m) {
        moedas.push({
          codigo: m.codigo,
          nome: m.nome,
          cotacaoCompra: m.cotacaoCompra,
          cotacaoVenda: m.cotacaoVenda,
          dataCotacao: m.dataCotacao,
        })
      }
    }
    if (moedas.length === 0) throw new Error('PTAX sem moedas válidas')
    return moedas
  }

  function lerCache() {
    try {
      const rec = $app.findFirstRecordByData('economic_indicators_cache', 'chave', 'snapshot')
      const bruto = rec.get('payload')
      let obj = bruto
      if (typeof bruto === 'string') {
        try {
          obj = JSON.parse(bruto)
        } catch (_) {
          obj = null
        }
      }
      if (obj && obj.indicadores && obj.moedas) return obj
    } catch (_) {}
    return null
  }

  function salvarCache(snap) {
    try {
      let rec = null
      try {
        rec = $app.findFirstRecordByData('economic_indicators_cache', 'chave', 'snapshot')
      } catch (_) {
        const col = $app.findCollectionByNameOrId('economic_indicators_cache')
        rec = new Record(col)
        rec.set('chave', 'snapshot')
      }
      rec.set('payload', JSON.stringify(snap))
      rec.set('atualizado_em', snap.atualizado_em)
      $app.save(rec)
    } catch (err) {
      console.log('Erro ao salvar cache de indicadores: ' + String(err))
    }
  }

  function coletarVivo() {
    const indicadores = []
    for (let i = 0; i < SERIES_INDICADORES.length; i++) {
      try {
        indicadores.push(coletarSerieSGS(SERIES_INDICADORES[i]))
      } catch (err) {
        console.log('SGS série ' + SERIES_INDICADORES[i].serie + ' falhou: ' + String(err))
      }
    }
    const moedas = coletarMoedaPTAX()
    if (indicadores.length === 0) throw new Error('Nenhuma série SGS disponível')
    return {
      fonte_viva: true,
      atualizado_em: new Date().toISOString(),
      aviso: '',
      indicadores: indicadores,
      moedas: moedas,
      moedas_disponiveis: moedas.map((m) => ({ codigo: m.codigo, nome: m.nome })),
    }
  }

  const forcarAtualizacao = e.requestInfo().query && e.requestInfo().query['atualizar'] === '1'

  let resposta = null

  if (!forcarAtualizacao) {
    const cache = lerCache()
    if (cache && cache.fonte_viva) resposta = cache
  }

  if (!resposta) {
    try {
      resposta = coletarVivo()
      salvarCache(resposta)
    } catch (errVivo) {
      console.log('BCB vivo indisponível: ' + String(errVivo))
      const cache = lerCache()
      if (cache) {
        resposta = Object.assign({}, cache, {
          fonte_viva: false,
          atualizado_em: new Date().toISOString(),
          aviso:
            'Consulta ao vivo ao Banco Central indisponível neste momento. Exibindo o último snapshot captado pelo servidor (' +
            String(cache.atualizado_em || '').slice(0, 10) +
            ').',
        })
      } else {
        resposta = {
          fonte_viva: false,
          atualizado_em: new Date().toISOString(),
          aviso:
            'Não foi possível consultar o Banco Central e não há snapshot em cache. Exibindo a base interna aproximada do sistema (não oficial, apenas referência).',
          indicadores: INDICADORES_FALLBACK_HOOK,
          moedas: MOEDAS_FALLBACK_HOOK.map((m) => ({
            codigo: m.codigo,
            nome: NOMES_MOEDAS[m.codigo],
            cotacaoCompra: m.cotacaoCompra,
            cotacaoVenda: m.cotacaoVenda,
            dataCotacao: m.dataCotacao,
          })),
          moedas_disponiveis: MOEDAS_FALLBACK_HOOK.map((m) => ({
            codigo: m.codigo,
            nome: NOMES_MOEDAS[m.codigo],
          })),
        }
      }
    }
  }

  return e.json(200, resposta)
})

/**
 * CONTEXTO PARA OS AGENTES (agente especialista / diagnóstico).
 * Autossuficiente: nada aqui referencia constantes de nível superior deste
 * arquivo — só builtins ($app, $http). Chamado pelos hooks via
 * `globalThis.buscarContextoIndicadoresBCB(pergunta, segmento)`.
 */
globalThis.buscarContextoIndicadoresBCB = function (pergunta, segmento) {
  const SERIES = [
    { chave: 'ipca', nome: 'IPCA', serie: 433, unidade: '% a.m.' },
    { chave: 'inpc', nome: 'INPC', serie: 188, unidade: '% a.m.' },
    { chave: 'igpm', nome: 'IGP-M', serie: 189, unidade: '% a.m.' },
    { chave: 'selic', nome: 'Selic', serie: 4390, unidade: '% a.a.' },
    { chave: 'cdi', nome: 'CDI', serie: 12, unidade: '% a.a.' },
  ]

  function lerCacheLocal() {
    try {
      const rec = $app.findFirstRecordByData('economic_indicators_cache', 'chave', 'snapshot')
      const bruto = rec.get('payload')
      const obj = typeof bruto === 'string' ? JSON.parse(bruto) : bruto
      if (obj && obj.indicadores && obj.moedas) return obj
    } catch (_) {}
    return null
  }

  function buscarVivoLocal() {
    try {
      const res = $http.send({
        url: 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/2?formato=json',
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        timeout: 6,
      })
      if (!res || res.statusCode < 200 || res.statusCode >= 400) return null
      return res.json || null
    } catch (_) {
      return null
    }
  }

  const cache = lerCacheLocal()
  const vivo = cache ? null : buscarVivoLocal()
  if (!cache && !vivo) return null

  const linhas = []
  if (cache) {
    const mapa = {}
    for (let i = 0; i < cache.indicadores.length; i++) {
      mapa[cache.indicadores[i].chave] = cache.indicadores[i]
    }
    for (let i = 0; i < SERIES.length; i++) {
      const def = SERIES[i]
      const ind = mapa[def.chave]
      if (ind) {
        linhas.push(
          def.nome +
            ': ' +
            ind.valorAtual +
            ' ' +
            def.unidade +
            ' (ref. ' +
            (ind.dataReferencia || 'n/d') +
            ')',
        )
      }
    }
    const usd = (cache.moedas || []).find(function (m) {
      return m.codigo === 'USD'
    })
    const eur = (cache.moedas || []).find(function (m) {
      return m.codigo === 'EUR'
    })
    if (usd) linhas.push('USD/PTAX: R$ ' + usd.cotacaoCompra)
    if (eur) linhas.push('EUR/PTAX: R$ ' + eur.cotacaoCompra)
    return {
      resumo:
        'Indicadores econômicos (Banco Central — oficial institucional): ' + linhas.join('; '),
      fonte_viva: cache.fonte_viva !== false,
    }
  }

  if (vivo && Array.isArray(vivo) && vivo.length > 0) {
    const ultimo = Number(String(vivo[vivo.length - 1].valor).replace(',', '.'))
    linhas.push('IPCA: ' + ultimo + ' % a.m.')
    return {
      resumo:
        'Indicadores econômicos (Banco Central — oficial institucional): ' + linhas.join('; '),
      fonte_viva: true,
    }
  }
  return null
}
