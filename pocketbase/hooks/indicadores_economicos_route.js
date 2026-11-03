/// <reference path="../pb_data/types.d.ts" />

/**
 * HOOK — Indicadores Econômicos e Financeiros (Plataforma Administrativa).
 *
 * Rota: GET /backend/v1/indicadores-economicos          → coleta sob demanda
 *       GET /backend/v1/indicadores-economicos?atualizar=1 → força coleta nova
 *
 * Padrão anti-bloqueio do projeto (igual ao download-resolution):
 * - consulta feita SEMPRE no backend, nunca no navegador;
 * - timeout curto (4 s) por fonte;
 * - resposta estruturada;
 * - se a fonte viva falhar, devolve o último snapshot em cache
 *   (coleção indicadores_economicos) com fonte_viva=false e aviso transparente.
 *
 * Fontes oficiais (sem chave de API):
 * - SGS/BCB:   https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/data/ultimos/13?formato=json
 * - PTAX/Olinda: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/...
 */

var SERIES_INDICADORES = [
  {
    chave: 'ipca',
    nome: 'IPCA',
    codigo: '433',
    categoria: 'inflacao',
    unidade: '% a.m.',
    descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE/BCB série 433',
  },
  {
    chave: 'igpm',
    nome: 'IGP-M',
    codigo: '189',
    categoria: 'inflacao',
    unidade: '% a.m.',
    descricao: 'Índice Geral de Preços — Mercado — FGV/BCB série 189',
  },
  {
    chave: 'inpc',
    nome: 'INPC',
    codigo: '188',
    categoria: 'inflacao',
    unidade: '% a.m.',
    descricao: 'Índice Nacional de Preços ao Consumidor — IBGE/BCB série 188',
  },
  {
    chave: 'ipc',
    nome: 'IPC',
    codigo: '192',
    categoria: 'inflacao',
    unidade: '% a.m.',
    descricao: 'Índice de Preços ao Consumidor — Fipe/BCB série 192',
  },
  {
    chave: 'selic',
    nome: 'Selic',
    codigo: '4390',
    categoria: 'taxa',
    unidade: '% a.a.',
    descricao: 'Taxa básica de juros — Copom/BCB série 4390',
  },
  {
    chave: 'cdi',
    nome: 'CDI',
    codigo: '12',
    categoria: 'taxa',
    unidade: '% a.a.',
    descricao: 'Taxa DI média diária — B3/BCB série 12',
  },
  {
    chave: 'tr',
    nome: 'TR',
    codigo: '226',
    categoria: 'taxa',
    unidade: '% a.m.',
    descricao: 'Taxa Referencial — BCB série 226',
  },
  {
    chave: 'poupanca',
    nome: 'Poupança',
    codigo: '195',
    categoria: 'taxa',
    unidade: '% a.m.',
    descricao: 'Rendimento da poupança — BCB série 195',
  },
]

var MOEDAS_PTAX = ['USD', 'EUR', 'GBP', 'JPY', 'ARS', 'CNY', 'CAD', 'CHF', 'AUD']
var NOMES_MOEDAS = {
  USD: 'Dólar americano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  JPY: 'Iene japonês',
  ARS: 'Peso argentino',
  CNY: 'Yuan chinês',
  CAD: 'Dólar canadense',
  CHF: 'Franco suíço',
  AUD: 'Dólar australiano',
}

var CABECALHO_BCB = {
  Accept: 'application/json',
  'User-Agent': 'ADECONT-PanoramaRT/1.0 (+https://panorama.adecont.com.br)',
}

function fetchJsonSeguro(url, timeoutSegundos) {
  try {
    var res = $http.send({
      url: url,
      method: 'GET',
      headers: CABECALHO_BCB,
      timeout: timeoutSegundos || 4,
    })
    if (!res || res.statusCode < 200 || res.statusCode >= 400) return null
    var corpo = res.json
    if (typeof corpo === 'undefined' || corpo === null) {
      try {
        corpo = JSON.parse(res.body || 'null')
      } catch (_) {
        return null
      }
    }
    return corpo
  } catch (err) {
    console.log('indicadores: falha ao consultar ' + url + ': ' + err)
    return null
  }
}

/** SGS: devolve [{data, valor}] dos últimos N pontos da série. */
function coletarSerieSGS(codigo, quantidade) {
  var url =
    'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' +
    codigo +
    '/data/ultimos/' +
    (quantidade || 13) +
    '?formato=json'
  var bruto = fetchJsonSeguro(url, 4)
  if (!Array.isArray(bruto)) return []
  var lista = []
  for (var i = 0; i < bruto.length; i++) {
    var item = bruto[i] || {}
    lista.push({ data: String(item.data || ''), valor: Number(item.valor || 0) })
  }
  return lista
}

function dataIsoParaPtax(iso) {
  // PTAX quer MM-DD-YYYY
  var p = String(iso).split('-')
  return p[1] + '-' + p[2] + '-' + p[0]
}

/** PTAX/Olinda: última cotação de compra/venda da moeda. */
function coletarMoedaPTAX(codigo) {
  var hoje = new Date()
  var dias15 = new Date(hoje.getTime() - 15 * 24 * 60 * 60 * 1000)
  var url =
    "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda='" +
    codigo +
    "',dataInicial='" +
    dataIsoParaPtax(dias15.toISOString().slice(0, 10)) +
    "',dataFinalCotacao='" +
    dataIsoParaPtax(hoje.toISOString().slice(0, 10)) +
    "')?$format=json&$top=2&$orderby=dataHoraCotacao desc"
  var bruto = fetchJsonSeguro(url, 4)
  var lista = bruto && bruto.value ? bruto.value : []
  if (!Array.isArray(lista) || lista.length === 0) return null
  var ultimo = lista[0]
  return {
    codigo: codigo,
    nome: NOMES_MOEDAS[codigo] || codigo,
    cotacaoCompra: Number(ultimo.cotacaoCompra || 0),
    cotacaoVenda: Number(ultimo.cotacaoVenda || 0),
    dataCotacao: String(ultimo.dataHoraCotacao || '').slice(0, 10),
  }
}

function salvarCache(chave, dados, fonteViva) {
  try {
    var colecao = $app.findCollectionByNameOrId('indicadores_economicos')
    var registro = null
    try {
      registro = $app.findFirstRecordByFilter(colecao, "chave = '" + chave + "'")
    } catch (_) {
      registro = null
    }
    if (!registro) {
      registro = new Record(colecao)
      registro.set('chave', chave)
    }
    registro.set('dados', JSON.stringify(dados))
    registro.set('fonte_viva', fonteViva)
    registro.set('coletado_em', new Date().toISOString())
    $app.save(registro)
  } catch (err) {
    console.log('indicadores: cache indisponível (' + chave + '): ' + err)
  }
}

function lerCache(chave) {
  try {
    var colecao = $app.findCollectionByNameOrId('indicadores_economicos')
    var registro = $app.findFirstRecordByFilter(colecao, "chave = '" + chave + "'")
    if (!registro) return null
    return {
      dados: JSON.parse(registro.getString('dados') || 'null'),
      fonteViva: registro.getBool('fonte_viva'),
      coletadoEm: registro.getString('coletado_em'),
    }
  } catch (_) {
    return null
  }
}

/** Coleta viva no BCB. Devolve { indicadores, moedas, fonteViva } (parciais aceitas). */
function coletarVivo() {
  var indicadores = []
  var falhas = 0
  for (var i = 0; i < SERIES_INDICADORES.length; i++) {
    var def = SERIES_INDICADORES[i]
    var serie = coletarSerieSGS(def.codigo, 13)
    if (serie.length === 0) {
      falhas++
      continue
    }
    var atual = serie[serie.length - 1]
    var anterior = serie.length > 1 ? serie[serie.length - 2] : atual
    var serie12 = serie.slice(-12).map(function (p) {
      return p.valor
    })
    indicadores.push({
      chave: def.chave,
      nome: def.nome,
      categoria: def.categoria,
      unidade: def.unidade,
      valorAtual: atual.valor,
      variacao: anterior.valor !== 0 ? atual.valor - anterior.valor : 0,
      dataReferencia: atual.data,
      serie: serie12,
      descricao: def.descricao,
    })
  }

  var moedas = []
  var falhasMoeda = 0
  for (var j = 0; j < MOEDAS_PTAX.length; j++) {
    var cot = coletarMoedaPTAX(MOEDAS_PTAX[j])
    if (cot && cot.cotacaoCompra > 0) moedas.push(cot)
    else falhasMoeda++
  }

  var fonteViva = falhas < SERIES_INDICADORES.length && falhasMoeda < MOEDAS_PTAX.length
  return {
    indicadores: indicadores,
    moedas: moedas,
    fonteViva: fonteViva,
    falhas: falhas + falhasMoeda,
  }
}

var INDICADORES_FALLBACK_HOOK = [
  {
    chave: 'ipca',
    nome: 'IPCA',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.26,
    variacao: -0.11,
    dataReferencia: '',
    serie: [0.38, 0.24, 0.24, 0.21, 0.38, 0.17, 0.22, 0.38, 0.44, 0.42, 0.48, 0.26],
    descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE/BCB série 433',
  },
  {
    chave: 'igpm',
    nome: 'IGP-M',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.31,
    variacao: 0.05,
    dataReferencia: '',
    serie: [0.42, 0.95, -0.44, -0.51, 0.64, 0.87, -0.19, 0.22, 0.41, 0.65, 0.28, 0.31],
    descricao: 'Índice Geral de Preços — Mercado — FGV/BCB série 189',
  },
  {
    chave: 'inpc',
    nome: 'INPC',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.22,
    variacao: -0.09,
    dataReferencia: '',
    serie: [0.42, 0.36, 0.38, 0.24, 0.51, 0.25, 0.19, 0.35, 0.46, 0.39, 0.42, 0.22],
    descricao: 'Índice Nacional de Preços ao Consumidor — IBGE/BCB série 188',
  },
  {
    chave: 'ipc',
    nome: 'IPC',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.24,
    variacao: 0.02,
    dataReferencia: '',
    serie: [0.31, 0.29, 0.27, 0.22, 0.36, 0.19, 0.21, 0.31, 0.38, 0.35, 0.41, 0.24],
    descricao: 'Índice de Preços ao Consumidor — Fipe/BCB série 192',
  },
  {
    chave: 'selic',
    nome: 'Selic',
    categoria: 'taxa',
    unidade: '% a.a.',
    valorAtual: 15.0,
    variacao: 0.0,
    dataReferencia: '',
    serie: [13.25, 13.25, 13.5, 14.25, 14.75, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0],
    descricao: 'Taxa básica de juros — Copom/BCB série 4390',
  },
  {
    chave: 'cdi',
    nome: 'CDI',
    categoria: 'taxa',
    unidade: '% a.a.',
    valorAtual: 14.9,
    variacao: 0.0,
    dataReferencia: '',
    serie: [13.15, 13.15, 13.4, 14.15, 14.65, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9],
    descricao: 'Taxa DI média diária — B3/BCB série 12',
  },
  {
    chave: 'tr',
    nome: 'TR',
    categoria: 'taxa',
    unidade: '% a.m.',
    valorAtual: 0.09,
    variacao: 0.01,
    dataReferencia: '',
    serie: [0.05, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09],
    descricao: 'Taxa Referencial — BCB série 226',
  },
  {
    chave: 'poupanca',
    nome: 'Poupança',
    categoria: 'taxa',
    unidade: '% a.m.',
    valorAtual: 0.62,
    variacao: 0.0,
    dataReferencia: '',
    serie: [0.54, 0.54, 0.55, 0.58, 0.6, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62],
    descricao: 'Rendimento da poupança — BCB série 195',
  },
]
var MOEDAS_FALLBACK_HOOK = [
  {
    codigo: 'USD',
    nome: 'Dólar americano',
    cotacaoCompra: 5.4,
    cotacaoVenda: 5.41,
    dataCotacao: '',
  },
  { codigo: 'EUR', nome: 'Euro', cotacaoCompra: 6.3, cotacaoVenda: 6.31, dataCotacao: '' },
  {
    codigo: 'GBP',
    nome: 'Libra esterlina',
    cotacaoCompra: 7.3,
    cotacaoVenda: 7.31,
    dataCotacao: '',
  },
  {
    codigo: 'JPY',
    nome: 'Iene japonês',
    cotacaoCompra: 0.036,
    cotacaoVenda: 0.0361,
    dataCotacao: '',
  },
  {
    codigo: 'ARS',
    nome: 'Peso argentino',
    cotacaoCompra: 0.0045,
    cotacaoVenda: 0.0046,
    dataCotacao: '',
  },
  { codigo: 'CNY', nome: 'Yuan chinês', cotacaoCompra: 0.75, cotacaoVenda: 0.751, dataCotacao: '' },
  {
    codigo: 'CAD',
    nome: 'Dólar canadense',
    cotacaoCompra: 3.9,
    cotacaoVenda: 3.91,
    dataCotacao: '',
  },
  { codigo: 'CHF', nome: 'Franco suíço', cotacaoCompra: 6.6, cotacaoVenda: 6.61, dataCotacao: '' },
  {
    codigo: 'AUD',
    nome: 'Dólar australiano',
    cotacaoCompra: 3.55,
    cotacaoVenda: 3.56,
    dataCotacao: '',
  },
]

routerAdd('GET', '/backend/v1/indicadores-economicos', (e) => {
  try {
    var info = e.requestInfo()
    var query = info.query || {}
    var forcar = String(query.atualizar || '') === '1'

    var coleta = null
    var aviso = ''
    if (!forcar) {
      var cache = lerCache('snapshot')
      if (cache && cache.dados) {
        return e.json(200, {
          fonte_viva: Boolean(cache.fonteViva),
          atualizado_em: cache.coletadoEm,
          aviso: cache.fonteViva
            ? ''
            : 'O Banco Central esteve indisponível na última tentativa de coleta. Exibindo o último snapshot salvo no cache interno do sistema.',
          indicadores: (cache.dados.indicadores || []).slice(0, 24),
          moedas: (cache.dados.moedas || []).slice(0, 24),
          moedas_disponiveis: cache.dados.moedas_disponiveis || MOEDAS_PTAX,
        })
      }
    }

    coleta = coletarVivo()
    if (coleta.fonteViva) {
      salvarCache(
        'snapshot',
        {
          indicadores: coleta.indicadores,
          moedas: coleta.moedas,
          moedas_disponiveis: MOEDAS_PTAX,
        },
        true,
      )
      return e.json(200, {
        fonte_viva: true,
        atualizado_em: new Date().toISOString(),
        aviso:
          coleta.falhas > 0
            ? 'Algumas séries do Banco Central não responderam; as demais foram atualizadas agora.'
            : '',
        indicadores: coleta.indicadores,
        moedas: coleta.moedas,
        moedas_disponiveis: MOEDAS_PTAX,
      })
    }

    // Fonte viva falhou → cache, depois base interna aproximada, sempre com aviso.
    var cacheFalha = lerCache('snapshot')
    if (cacheFalha && cacheFalha.dados) {
      return e.json(200, {
        fonte_viva: false,
        atualizado_em: cacheFalha.coletadoEm,
        aviso:
          'O Banco Central não respondeu agora. Exibindo o último snapshot salvo no cache interno do sistema (dados podem estar desatualizados).',
        indicadores: (cacheFalha.dados.indicadores || []).slice(0, 24),
        moedas: (cacheFalha.dados.moedas || []).slice(0, 24),
        moedas_disponiveis: cacheFalha.dados.moedas_disponiveis || MOEDAS_PTAX,
      })
    }

    aviso =
      'O Banco Central não respondeu e ainda não há cache interno. Exibindo a base interna aproximada do sistema (não oficial, apenas referência).'
    salvarCache(
      'snapshot',
      {
        indicadores: INDICADORES_FALLBACK_HOOK,
        moedas: MOEDAS_FALLBACK_HOOK,
        moedas_disponiveis: MOEDAS_PTAX,
      },
      false,
    )
    return e.json(200, {
      fonte_viva: false,
      atualizado_em: new Date().toISOString(),
      aviso: aviso,
      indicadores: INDICADORES_FALLBACK_HOOK,
      moedas: MOEDAS_FALLBACK_HOOK,
      moedas_disponiveis: MOEDAS_PTAX,
    })
  } catch (err) {
    console.error('Erro na rota indicadores-economicos:', err)
    try {
      var cacheErro = lerCache('snapshot')
      if (cacheErro && cacheErro.dados) {
        return e.json(200, {
          fonte_viva: false,
          atualizado_em: cacheErro.coletadoEm,
          aviso:
            'Ocorreu um erro ao atualizar os indicadores. Exibindo o último snapshot salvo no cache interno do sistema.',
          indicadores: (cacheErro.dados.indicadores || []).slice(0, 24),
          moedas: (cacheErro.dados.moedas || []).slice(0, 24),
          moedas_disponiveis: cacheErro.dados.moedas_disponiveis || MOEDAS_PTAX,
        })
      }
    } catch (_) {}
    return e.json(200, {
      fonte_viva: false,
      atualizado_em: new Date().toISOString(),
      aviso:
        'O Banco Central não está acessível agora e não há cache interno. Exibindo a base interna aproximada do sistema (não oficial).',
      indicadores: INDICADORES_FALLBACK_HOOK,
      moedas: MOEDAS_FALLBACK_HOOK,
      moedas_disponiveis: MOEDAS_PTAX,
    })
  }
})

/**
 * Contexto para os Agentes Especialistas nativos: quando a pergunta do usuário
 * fala de indicador ou moeda, injeta o snapshot BCB com a fonte citada.
 */
globalThis.buscarContextoIndicadoresBCB = function (pergunta, segmento) {
  try {
    var termos = [
      'ipca',
      'igp',
      'inpc',
      'ipc ',
      'selic',
      'cdi',
      'tr ',
      'poupanca',
      'poupança',
      'inflaç',
      'inflac',
      'dolar',
      'dólar',
      'cambio',
      'câmbio',
      'moeda',
      'euro',
      'iene',
      'libra',
      'juros',
      'indicador',
    ]
    var texto = String(pergunta || '').toLowerCase()
    var combina = false
    for (var i = 0; i < termos.length; i++) {
      if (texto.indexOf(termos[i]) !== -1) {
        combina = true
        break
      }
    }
    if (!combina) return ''

    var dados = null
    var cache = lerCache('snapshot')
    if (cache && cache.dados) dados = cache.dados
    if (!dados) {
      var coleta = coletarVivo()
      dados = { indicadores: coleta.indicadores, moedas: coleta.moedas }
    }
    if (
      !dados ||
      ((!dados.indicadores || dados.indicadores.length === 0) &&
        (!dados.moedas || dados.moedas.length === 0))
    )
      return ''

    var linhas = []
    var inds = dados.indicadores || []
    for (var a = 0; a < inds.length; a++) {
      var ind = inds[a]
      linhas.push(
        '- ' +
          ind.nome +
          ': ' +
          ind.valorAtual +
          ' ' +
          ind.unidade +
          ' (referência ' +
          (ind.dataReferencia || 'série SGS/BCB') +
          ')',
      )
    }
    var mds = dados.moedas || []
    for (var b = 0; b < mds.length; b++) {
      var m = mds[b]
      linhas.push(
        '- Moeda ' +
          m.codigo +
          ' (' +
          m.nome +
          '): R$ ' +
          m.cotacaoCompra +
          ' (PTAX compra, ' +
          (m.dataCotacao || 'última cotação') +
          ')',
      )
    }
    return (
      'CONTEXTO OFICIAL — INDICADORES ECONÔMICOS (Banco Central do Brasil, fonte OFICIAL institucional; API pública SGS/SGS e PTAX/Olinda, sem consulta a diário oficial):\n' +
      linhas.join('\n') +
      '\nCite o Banco Central do Brasil (BCB) como fonte destes números.'
    )
  } catch (errCtx) {
    console.log('indicadores: contexto para agente falhou: ' + errCtx)
    return ''
  }
}
