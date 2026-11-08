/**
 * INDICADORES ECONÔMICOS SETORIAIS — portal ADECONT (aba Indicadores Setoriais)
 *
 * Integra as séries oficiais já catalogadas no backend (/backend/v1/series-historicas)
 * com o módulo /analises-empresariais, organizadas por SETOR da economia:
 * - Agronegócio: soja, milho e boi gordo (Cepea/Esalq) + produção agrícola (Conab/IBGE)
 * - Construção Civil: FipeZap, custo da construção (IBGE) e IGP-M (FGV)
 * - Comércio/Serviços: vendas de varejo, produção industrial e renda média (IBGE/PNAD)
 * - Crédito/Financeiro: inadimplência (SGS 21114), juros pessoal (SGS 20746) e saldo de crédito
 *
 * Degradação transparente (mesmo padrão da series-historicas/dados de mercado):
 * fonte viva falha ⇒ dado da base interna com aviso de contingência — nunca
 * série vazia, nunca erro 400. O serviço nunca lança exceção.
 */

import { fetchSerieHistorica, type ChaveSerieHistorica, type PontoSerie } from './seriesHistoricas'
import { formatarPeriodoReferencia, type InterpretacaoIndice } from './dadosMercadoAnalises'

export type SetorIndicador =
  | 'agronegocio'
  | 'construcao'
  | 'comercio_servicos'
  | 'credito_financeiro'

export type FormatoValorSetorial = 'moeda' | 'pontos' | 'percentual' | 'quantidade'

export const ROTULO_SETOR: Record<SetorIndicador, string> = {
  agronegocio: 'Agronegócio',
  construcao: 'Construção Civil',
  comercio_servicos: 'Comércio & Serviços',
  credito_financeiro: 'Crédito & Financeiro',
}

/** Ordem canônica dos setores no painel e nas exportações. */
export const ORDEM_SETOR: SetorIndicador[] = [
  'agronegocio',
  'construcao',
  'comercio_servicos',
  'credito_financeiro',
]

export interface ConfigIndicadorSetorial {
  chave: ChaveSerieHistorica
  nome: string
  codigoCurto: string
  descricao: string
  unidade: string
  setor: SetorIndicador
  interpretacao: InterpretacaoIndice
  formato: FormatoValorSetorial
  casasDecimais: number
}

export interface ItemIndicadorSetorial {
  chave: ChaveSerieHistorica
  nome: string
  codigoCurto: string
  descricao: string
  unidade: string
  setor: SetorIndicador
  valorAtual: number | null
  valorAnterior: number | null
  variacao: number | null
  variacaoPct: number | null
  periodoFormatado: string
  dataReferencia: string
  fonte: string
  fonteRota: string
  fonteViva: boolean
  baseInterna: boolean
  aviso: string
  historico: PontoSerie[]
  interpretacao: InterpretacaoIndice
  formato: FormatoValorSetorial
  casasDecimais: number
}

export const INDICADORES_SETORIAIS_CONFIG: ConfigIndicadorSetorial[] = [
  // — Agronegócio —
  {
    chave: 'soja',
    nome: 'Soja (saca 60 kg)',
    codigoCurto: 'SOJA',
    descricao: 'Preço da saca de soja — Cepea/Esalq',
    unidade: 'R$/saca',
    setor: 'agronegocio',
    interpretacao: 'alta_boa',
    formato: 'moeda',
    casasDecimais: 2,
  },
  {
    chave: 'milho',
    nome: 'Milho (saca 60 kg)',
    codigoCurto: 'MILHO',
    descricao: 'Preço da saca de milho — Cepea/Esalq',
    unidade: 'R$/saca',
    setor: 'agronegocio',
    interpretacao: 'alta_boa',
    formato: 'moeda',
    casasDecimais: 2,
  },
  {
    chave: 'boi_gordo',
    nome: 'Boi Gordo (arroba)',
    codigoCurto: 'BOI',
    descricao: 'Preço da arroba do boi gordo — Cepea/Esalq',
    unidade: 'R$/@',
    setor: 'agronegocio',
    interpretacao: 'alta_boa',
    formato: 'moeda',
    casasDecimais: 2,
  },
  {
    chave: 'agro_producao',
    nome: 'Produção Agrícola Nacional',
    codigoCurto: 'PROD. AGRO',
    descricao: 'Produção agrícola nacional estimada — Conab/IBGE',
    unidade: 'mil t',
    setor: 'agronegocio',
    interpretacao: 'alta_boa',
    formato: 'quantidade',
    casasDecimais: 0,
  },
  // — Construção Civil —
  {
    chave: 'fipezap',
    nome: 'FipeZap (preço m²)',
    codigoCurto: 'FIPEZAP',
    descricao: 'Índice FipeZap de preços de venda de imóveis novos — Fipe/Zap',
    unidade: 'R$/m²',
    setor: 'construcao',
    interpretacao: 'alta_boa',
    formato: 'moeda',
    casasDecimais: 2,
  },
  {
    chave: 'ibge_construcao',
    nome: 'Custo da Construção (INCC)',
    codigoCurto: 'INCC/IBGE',
    descricao: 'Variação do custo de construção civil — IBGE (SINAPI/INCC)',
    unidade: '% a.m.',
    setor: 'construcao',
    interpretacao: 'baixa_boa',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'igpm',
    nome: 'IGP-M (correção imobiliária)',
    codigoCurto: 'IGP-M',
    descricao: 'Índice Geral de Preços do Mercado — FGV (correção de aluguéis e contratos)',
    unidade: '% a.m.',
    setor: 'construcao',
    interpretacao: 'neutro',
    formato: 'percentual',
    casasDecimais: 2,
  },
  // — Comércio & Serviços —
  {
    chave: 'venda_varejo',
    nome: 'Vendas de Varejo',
    codigoCurto: 'VAREJO',
    descricao: 'Variação das vendas no comércio varejista — IBGE (PMC)',
    unidade: '% a.m.',
    setor: 'comercio_servicos',
    interpretacao: 'alta_boa',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'producao_industrial',
    nome: 'Produção Industrial',
    codigoCurto: 'PROD. IND.',
    descricao: 'Variação da produção física industrial — IBGE (PIM)',
    unidade: '% a.m.',
    setor: 'comercio_servicos',
    interpretacao: 'alta_boa',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'renda_media',
    nome: 'Renda Média do Trabalhador',
    codigoCurto: 'RENDA',
    descricao: 'Rendimento médio real habitual — IBGE (PNAD Contínua)',
    unidade: 'R$',
    setor: 'comercio_servicos',
    interpretacao: 'alta_boa',
    formato: 'moeda',
    casasDecimais: 2,
  },
  // — Crédito & Financeiro —
  {
    chave: 'inadimplencia',
    nome: 'Inadimplência da Carteira',
    codigoCurto: 'INADIMP.',
    descricao:
      'Inadimplência da carteira total do sistema financeiro (atrasos > 90 dias) — BCB SGS 21114',
    unidade: '%',
    setor: 'credito_financeiro',
    interpretacao: 'baixa_boa',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'juros_pessoal',
    nome: 'Juros do Crédito Pessoal',
    codigoCurto: 'J. PESSOAL',
    descricao: 'Taxa média de juros das operações de crédito pessoal — BCB SGS 20746',
    unidade: '% a.a.',
    setor: 'credito_financeiro',
    interpretacao: 'baixa_boa',
    formato: 'percentual',
    casasDecimais: 2,
  },
  {
    chave: 'saldo_credito',
    nome: 'Saldo de Crédito Total',
    codigoCurto: 'SALDO CRED.',
    descricao: 'Saldo total das operações de crédito do sistema financeiro — BCB',
    unidade: 'R$ bi',
    setor: 'credito_financeiro',
    interpretacao: 'alta_boa',
    formato: 'quantidade',
    casasDecimais: 1,
  },
]

/** Formata valor no padrão pt-BR conforme o formato do indicador (ausente = '—'). */
export function formatarValorSetorial(
  valor: number | null | undefined,
  formato: FormatoValorSetorial,
  casasDecimais = 2,
): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return '—'
  }
  if (formato === 'pontos') {
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  })
}

/** Status textual do semáforo em pt-BR a partir da variação do período. */
export function obterStatusSemaforoSetorial(variacao: number | null | undefined): {
  statusTexto: string
  tipo: 'alta' | 'baixa' | 'estavel' | 'indisponivel'
} {
  if (variacao === null || variacao === undefined || !Number.isFinite(variacao)) {
    return { statusTexto: 'Indisponível', tipo: 'indisponivel' }
  }
  if (Math.abs(variacao) < 0.00001) return { statusTexto: 'Estável', tipo: 'estavel' }
  return variacao > 0
    ? { statusTexto: 'Alta', tipo: 'alta' }
    : { statusTexto: 'Baixa', tipo: 'baixa' }
}

/**
 * Converte a série bruta do backend para ItemIndicadorSetorial com métricas consistentes
 * e selo da fonte real (nunca selo genérico).
 */
export function processarSerieEmItemSetorial(
  config: ConfigIndicadorSetorial,
  resultado: {
    serie: PontoSerie[]
    fonteViva: boolean
    baseInterna: boolean
    fonte: string
    aviso: string
  },
): ItemIndicadorSetorial {
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
    setor: config.setor,
    valorAtual,
    valorAnterior,
    variacao,
    variacaoPct,
    periodoFormatado,
    dataReferencia: periodoBruto,
    fonte: seloFonte,
    fonteRota: resultado.fonte || '',
    fonteViva: resultado.fonteViva,
    baseInterna: resultado.baseInterna,
    aviso: avisoTratado,
    historico: serie,
    interpretacao: config.interpretacao,
    formato: config.formato,
    casasDecimais: config.casasDecimais,
  }
}

/**
 * Busca todas as séries setoriais em paralelo com tolerância a falhas.
 * Nunca lança exceção — sempre retorna itens com dado real ou base interna.
 */
export async function buscarIndicadoresSetoriais(): Promise<{
  itens: ItemIndicadorSetorial[]
  atualizadoEm: string
  todasVivas: boolean
}> {
  const promises = INDICADORES_SETORIAIS_CONFIG.map(async (conf) => {
    try {
      const res = await fetchSerieHistorica(conf.chave)
      return processarSerieEmItemSetorial(conf, res)
    } catch {
      // Degradação segura — contingência, nunca erro 400 nem série vazia
      return processarSerieEmItemSetorial(conf, {
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
