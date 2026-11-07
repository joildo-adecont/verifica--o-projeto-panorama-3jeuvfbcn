/**
 * SERVIÇO DE DADOS DE MERCADO PARA ANÁLISES EMPRESARIAIS (ADECONT)
 *
 * Integra a infraestrutura de séries históricas do backend (/backend/v1/series-historicas)
 * com o módulo /analises-empresariais do portal ADECONT.
 *
 * Consome dados reais de mercado:
 * - SELIC (BCB SGS 432)
 * - IPCA (IBGE / BCB SGS 433)
 * - Ibovespa (B3 / IPEADATA GM366_IBVSP366 / SGS 7)
 * - IFIX (B3 / IPEADATA)
 * - Dólar PTAX (BCB SGS 10813)
 * - Juros Pessoal (BCB SGS 20746)
 * - Inadimplência (BCB SGS 21114)
 * - Juros Médio (BCB SGS 20714)
 *
 * Degradação transparente: se a fonte externa falhar, expõe dados da base interna
 * com carimbo "dados da base interna (última sincronização: <data>)" — nunca quebra,
 * nunca devolve número NaN/inválido.
 */

import { fetchSerieHistorica, type ChaveSerieHistorica, type PontoSerie } from './seriesHistoricas'

export type InterpretacaoIndice = 'alta_boa' | 'baixa_boa' | 'neutro'

export interface ItemIndiceMercado {
  chave: ChaveSerieHistorica
  nome: string
  codigoCurto: string
  descricao: string
  unidade: string
  valorAtual: number | null
  valorAnterior: number | null
  variacao: number | null
  variacaoPct: number | null
  periodoFormatado: string
  dataReferencia: string
  fonte: string
  fonteRota?: string
  fonteViva: boolean
  baseInterna: boolean
  aviso: string
  historico: PontoSerie[]
  interpretacao: InterpretacaoIndice
  categoria: 'bolsa_fii' | 'taxas' | 'inflacao' | 'cambio' | 'credito'
  formato: 'moeda' | 'pontos' | 'percentual'
  casasDecimais: number
}

export const INDICES_MERCADO_CONFIG: {
  chave: ChaveSerieHistorica
  nome: string
  codigoCurto: string
  descricao: string
  unidade: string
  interpretacao: InterpretacaoIndice
  categoria: 'bolsa_fii' | 'taxas' | 'inflacao' | 'cambio' | 'credito'
  formato: 'moeda' | 'pontos' | 'percentual'
  casasDecimais: number
}[] = [
  {
    chave: 'selic',
    nome: 'Taxa Selic Meta',
    codigoCurto: 'SELIC',
    descricao: 'Taxa básica de juros definida pelo Copom / Banco Central',
    unidade: '% a.a.',
    interpretacao: 'baixa_boa',
    categoria: 'taxas',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'ipca',
    nome: 'IPCA (Inflação Oficial)',
    codigoCurto: 'IPCA',
    descricao: 'Índice Nacional de Preços ao Consumidor Amplo (IBGE)',
    unidade: '% a.m.',
    interpretacao: 'baixa_boa',
    categoria: 'inflacao',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'ibovespa',
    nome: 'Ibovespa',
    codigoCurto: 'IBOV',
    descricao: 'Principal índice de ações da B3 (bolsa de valores brasileira)',
    unidade: 'pts',
    interpretacao: 'alta_boa',
    categoria: 'bolsa_fii',
    formato: 'pontos',
    casasDecimais: 0,
  },
  {
    chave: 'ifix',
    nome: 'IFIX (Fundos Imobiliários)',
    codigoCurto: 'IFIX',
    descricao: 'Índice de Fundos de Investimento Imobiliário da B3',
    unidade: 'pts',
    interpretacao: 'alta_boa',
    categoria: 'bolsa_fii',
    formato: 'pontos',
    casasDecimais: 0,
  },
  {
    chave: 'usd',
    nome: 'Dólar Comercial (PTAX)',
    codigoCurto: 'USD',
    descricao: 'Cotação de venda do dólar PTAX calculada pelo Banco Central',
    unidade: 'R$',
    interpretacao: 'neutro',
    categoria: 'cambio',
    formato: 'moeda',
    casasDecimais: 4,
  },
  {
    chave: 'juros_pessoal',
    nome: 'Crédito Pessoal (Taxa Média)',
    codigoCurto: 'J. PESSOAL',
    descricao: 'Taxa média de juros cobrada nas operações de crédito pessoal',
    unidade: '% a.a.',
    interpretacao: 'baixa_boa',
    categoria: 'credito',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'inadimplencia',
    nome: 'Inadimplência da Carteira',
    codigoCurto: 'INADIMP.',
    descricao: 'Taxa de inadimplência da carteira total do sistema financeiro (atrasos > 90 dias)',
    unidade: '%',
    interpretacao: 'baixa_boa',
    categoria: 'credito',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'juros_medio',
    nome: 'Juros Médios Bancários',
    codigoCurto: 'J. MÉDIO',
    descricao: 'Taxa média geral de juros do sistema financeiro nacional',
    unidade: '% a.a.',
    interpretacao: 'baixa_boa',
    categoria: 'taxas',
    formato: 'percentual',
    casasDecimais: 2,
  },
]

/** Formata período (ex: '2026-02' -> 'Fev/2026', '2025' -> '2025') */
export function formatarPeriodoReferencia(periodo: string): string {
  if (!periodo) return 'Atual'
  const matchAnoMes = periodo.match(/^(\d{4})-(\d{2})$/)
  if (matchAnoMes) {
    const meses = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    const mesIndex = parseInt(matchAnoMes[2], 10) - 1
    if (mesIndex >= 0 && mesIndex < 12) {
      return `${meses[mesIndex]}/${matchAnoMes[1]}`
    }
  }
  return periodo
}

/** Formata número com padrão pt-BR de acordo com o formato e casas */
export function formatarValorIndice(
  valor: number | null | undefined,
  formato: 'moeda' | 'pontos' | 'percentual',
  casasDecimais = 2,
): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return '—'
  }
  if (formato === 'moeda') {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais,
    })
  }
  if (formato === 'pontos') {
    return valor.toLocaleString('pt-BR', {
      maximumFractionDigits: 0,
    })
  }
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  })
}

/**
 * Converte a série bruta do backend para ItemIndiceMercado com métricas consistentes.
 */
export function processarSerieEmItemMercado(
  config: (typeof INDICES_MERCADO_CONFIG)[number],
  resultado: {
    serie: PontoSerie[]
    fonteViva: boolean
    baseInterna: boolean
    fonte: string
    aviso: string
  },
): ItemIndiceMercado {
  const serie = resultado.serie || []
  const temPontos = serie.length > 0
  const ultimoPonto = temPontos ? serie[serie.length - 1] : null
  const pontoAnterior = temPontos && serie.length >= 2 ? serie[serie.length - 2] : null

  const valorAtual = ultimoPonto && Number.isFinite(ultimoPonto.valor) ? ultimoPonto.valor : null
  const valorAnterior =
    pontoAnterior && Number.isFinite(pontoAnterior.valor) ? pontoAnterior.valor : null

  let variacao: number | null = null
  let variacaoPct: number | null = null

  if (valorAtual !== null && valorAnterior !== null) {
    variacao = valorAtual - valorAnterior
    if (valorAnterior !== 0) {
      variacaoPct = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100
    }
  }

  const periodoBruto = ultimoPonto?.periodo || ''
  const periodoFormatado = formatarPeriodoReferencia(periodoBruto)

  // Selo da fonte real ou base interna com transparência
  let seloFonte = resultado.fonte || 'Fonte Oficial'
  if (!resultado.fonteViva || resultado.baseInterna) {
    seloFonte = 'Base Interna ADECONT'
  }

  let avisoTratado = resultado.aviso || ''
  if ((!resultado.fonteViva || resultado.baseInterna) && !avisoTratado) {
    avisoTratado = `dados da base interna (última sincronização: ${periodoFormatado})`
  }

  return {
    chave: config.chave,
    nome: config.nome,
    codigoCurto: config.codigoCurto,
    descricao: config.descricao,
    unidade: config.unidade,
    valorAtual,
    valorAnterior,
    variacao,
    variacaoPct,
    periodoFormatado,
    dataReferencia: periodoBruto,
    fonte: seloFonte,
    fonteRota: resultado.fonte,
    fonteViva: resultado.fonteViva,
    baseInterna: resultado.baseInterna,
    aviso: avisoTratado,
    historico: serie,
    interpretacao: config.interpretacao,
    categoria: config.categoria,
    formato: config.formato,
    casasDecimais: config.casasDecimais,
  }
}

/**
 * Busca todas as séries de mercado em paralelo com tolerância a falhas.
 * Nunca lança exceção — sempre retorna itens com dados reais ou base interna.
 */
export async function buscarIndicesMercadoAnalises(): Promise<{
  itens: ItemIndiceMercado[]
  atualizadoEm: string
  todasVivas: boolean
}> {
  const promises = INDICES_MERCADO_CONFIG.map(async (conf) => {
    try {
      const res = await fetchSerieHistorica(conf.chave)
      return processarSerieEmItemMercado(conf, res)
    } catch {
      // Degradação segura
      return processarSerieEmItemMercado(conf, {
        serie: [],
        fonteViva: false,
        baseInterna: true,
        fonte: 'Base interna do sistema',
        aviso: 'dados da base interna (última sincronização: referência do sistema)',
      })
    }
  })

  const itens = await Promise.all(promises)
  const todasVivas = itens.every((i) => i.fonteViva && !i.baseInterna)

  return {
    itens,
    atualizadoEm: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    todasVivas,
  }
}

/**
 * Filtra os pontos do histórico para o período selecionado (ex: '6m', '12m', '24m', 'todos').
 */
export function filtrarHistoricoPorPeriodo(
  historico: PontoSerie[],
  periodo: '6m' | '12m' | '24m' | 'todos',
): PontoSerie[] {
  if (!historico || historico.length === 0) return []
  if (periodo === 'todos') return historico
  const qtd = periodo === '6m' ? 6 : periodo === '12m' ? 12 : 24
  return historico.slice(-qtd)
}
