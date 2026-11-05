/**
 * SERVIÇO — Comparação de índices (aba Histórico).
 *
 * Busca N séries históricas em paralelo via proxy do backend
 * (/backend/v1/series-historicas — o navegador nunca fala direto com a fonte),
 * agrega por granularidade e calcula evolução e variações mensal, anual e do
 * período solicitado. Valor ausente = undefined → a tabela mostra "—".
 *
 * Padrão do projeto: série de variação % (modo 'variacao_mensal') acumula de
 * forma composta (produto de (1+v/100)); série de nível usa média no período.
 */
import {
  CATALOGO_SERIES,
  catalogoDaChave,
  fetchSerieHistorica,
  type ChaveSerieHistorica,
} from './seriesHistoricas'

export type GranularidadeComparacao = 'mensal' | 'trimestral' | 'anual'

export interface LinhaComparacao {
  chave: ChaveSerieHistorica
  nome: string
  unidade: string
  fonte: string
  /** Fonte REAL devolvida pela rota do backend (ex.: 'B3 — IFIX'); vazio se a rota não respondeu. */
  fonteRota: string
  fonteViva: boolean
  baseInterna: boolean
  aviso: string
  /** Valor no primeiro período da janela escolhida. */
  valorInicial: number | undefined
  /** Valor no último período da janela escolhida. */
  valorFinal: number | undefined
  /** Evolução total no período solicitado (%). */
  evolucaoPeriodo: number | undefined
  /** Variação do último período frente ao anterior (mensal/trimestral/anual). */
  variacaoPeriodoAnterior: number | undefined
  /** Variação dos últimos 12 meses (%). */
  variacaoAnual: number | undefined
}

/** Índices oferecidos para comparação (todos com série oficial no backend). */
export const CHAVES_COMPARACAO: ChaveSerieHistorica[] = [
  // Inflação e correção
  'ipca',
  'ipca15',
  'igpm',
  'igpdi',
  'inpc',
  'ipc',
  // Taxas
  'selic',
  'cdi',
  'tr',
  'poupanca',
  'tjlp',
  'juros_medio',
  'juros_pessoal',
  'inadimplencia',
  // Câmbio
  'usd',
  'eur',
  'gbp',
  'jpy',
  'yuan',
  // Mercado financeiro
  'fipezap',
  'ibovespa',
  'ifix',
  'sp500',
  'dowjones',
  'nasdaq',
  // Agronegócio
  'boi_gordo',
  'soja',
  'milho',
  // Atividade e emprego
  'pib',
  'desemprego',
  'renda_media',
  'producao_industrial',
  'venda_varejo',
]

/** Seleção padrão — 6 índices. */
export const SELECAO_INICIAL_COMPARACAO: ChaveSerieHistorica[] = [
  'ipca',
  'igpm',
  'selic',
  'usd',
  'ibovespa',
  'sp500',
]

/** Mínimo de índices para comparar (era 5; flexibilizado para 2 a pedido). */
export const MINIMO_COMPARACAO = 2

/**
 * Preset do trio pedido: IFIX × Ibovespa × Selic — fontes vivas confirmadas
 * (IFIX via B3, Ibovespa via IPEA GM366_IBVSP366, Selic via BCB SGS 432).
 */
export const SELECAO_TRIO_IFIX_IBOVESPA_SELIC: ChaveSerieHistorica[] = ['ifix', 'ibovespa', 'selic']

/** Anos disponíveis na janela de séries (2014 — ano corrente). */
export function anosDisponiveisComparacao(): number[] {
  const fim = new Date().getFullYear()
  const anos: number[] = []
  for (let a = 2014; a <= fim; a++) anos.push(a)
  return anos
}

function chavePeriodo(periodo: string, gran: GranularidadeComparacao): string {
  if (gran === 'mensal') return periodo.slice(0, 7) // YYYY-MM
  if (gran === 'anual') return periodo.slice(0, 4) // YYYY
  const mes = parseInt(periodo.slice(5, 7), 10)
  const tri = mes >= 1 && mes <= 12 ? Math.ceil(mes / 3) : 1
  return periodo.slice(0, 4) + '-T' + tri
}

/** Agrega a série mensal para a granularidade escolhida. */
export function agregarSerie(
  serie: { periodo: string; valor: number }[],
  gran: GranularidadeComparacao,
  modoAcumulado: 'variacao_mensal' | 'nivel',
): { periodo: string; valor: number }[] {
  const ordem: string[] = []
  const grupos = new Map<string, number[]>()
  for (const p of serie) {
    const chave = chavePeriodo(p.periodo, gran)
    if (!grupos.has(chave)) {
      grupos.set(chave, [])
      ordem.push(chave)
    }
    grupos.get(chave)!.push(p.valor)
  }
  return ordem.map((periodo) => {
    const valores = grupos.get(periodo)!
    let valor: number
    if (modoAcumulado === 'variacao_mensal') {
      // variação % do período = soma composta das variações mensais
      let prod = 1
      for (const v of valores) prod *= 1 + v / 100
      valor = (prod - 1) * 100
    } else {
      // nível = média dos valores do período
      valor = valores.reduce((a, b) => a + b, 0) / valores.length
    }
    return { periodo, valor }
  })
}

/** Rótulo curto do selo da fonte real de cada linha (impressão A4). */
export function seloFonteLinha(l: LinhaComparacao): string {
  if (l.fonteViva) return l.fonteRota && l.fonteRota.trim() !== '' ? l.fonteRota : l.fonte
  return 'Base interna do sistema (aproximada)'
}

function variacaoPct(de: number, para: number): number | undefined {
  if (!isFinite(de) || !isFinite(para) || de === 0) return undefined
  return ((para - de) / Math.abs(de)) * 100
}

function somaComposta(valores: number[]): number | undefined {
  if (valores.length === 0) return undefined
  let prod = 1
  for (const v of valores) {
    if (!isFinite(v)) return undefined
    prod *= 1 + v / 100
  }
  return (prod - 1) * 100
}

/** Monta a linha de comparação de um índice para a janela/granularidade escolhida. */
export function montarLinhaComparacao(
  chave: ChaveSerieHistorica,
  serie: { periodo: string; valor: number }[],
  gran: GranularidadeComparacao,
  anoInicio: number,
  anoFim: number,
  fonteViva: boolean,
  aviso: string,
  fonteRota?: string,
): LinhaComparacao {
  const item = catalogoDaChave(chave)
  const modo = item?.modoAcumulado ?? 'nivel'
  const agregada = agregarSerie(serie, gran, modo)
  const janela = agregada.filter((p) => {
    const ano = parseInt(p.periodo.slice(0, 4), 10)
    return ano >= anoInicio && ano <= anoFim
  })

  const valorInicial = janela.length > 0 ? janela[0].valor : undefined
  const valorFinal = janela.length > 0 ? janela[janela.length - 1].valor : undefined

  let evolucaoPeriodo: number | undefined
  if (modo === 'variacao_mensal') {
    // Evolução no período = soma composta das variações da janela
    const raw = serie.filter((p) => {
      const ano = parseInt(p.periodo.slice(0, 4), 10)
      return ano >= anoInicio && ano <= anoFim
    })
    evolucaoPeriodo = somaComposta(raw.map((p) => p.valor))
  } else if (janela.length > 1) {
    evolucaoPeriodo = variacaoPct(janela[0].valor, janela[janela.length - 1].valor)
  }

  let variacaoPeriodoAnterior: number | undefined
  if (janela.length >= 2 && valorFinal !== undefined) {
    const anterior = janela[janela.length - 2].valor
    variacaoPeriodoAnterior =
      modo === 'variacao_mensal' ? valorFinal : variacaoPct(anterior, valorFinal)
  }

  // Variação anual (12 meses): últimos 12 pontos mensais da série bruta
  const brutaJanela = serie.filter((p) => {
    const ano = parseInt(p.periodo.slice(0, 4), 10)
    return ano >= anoInicio && ano <= anoFim
  })
  let variacaoAnual: number | undefined
  if (brutaJanela.length >= 13) {
    const ultimos12 = brutaJanela.slice(-12)
    const base = brutaJanela[brutaJanela.length - 13].valor
    variacaoAnual =
      modo === 'variacao_mensal'
        ? somaComposta(ultimos12.map((p) => p.valor))
        : variacaoPct(base, ultimos12[ultimos12.length - 1].valor)
  }

  return {
    chave,
    nome: item?.nome ?? chave,
    unidade: item?.unidade ?? '',
    fonte: item?.fonte ?? '',
    fonteRota: fonteRota ?? '',
    fonteViva,
    baseInterna: !fonteViva,
    aviso,
    valorInicial,
    valorFinal,
    evolucaoPeriodo,
    variacaoPeriodoAnterior,
    variacaoAnual,
  }
}

/** Busca todas as séries selecionadas em paralelo e monta as linhas. */
export async function compararIndices(
  chaves: ChaveSerieHistorica[],
  gran: GranularidadeComparacao,
  anoInicio: number,
  anoFim: number,
): Promise<LinhaComparacao[]> {
  const respostas = await Promise.all(
    chaves.map(async (chave) => {
      try {
        return await fetchSerieHistorica(chave)
      } catch {
        return {
          serie: [],
          fonteViva: false,
          baseInterna: true,
          fonte: '',
          aviso: 'Fonte oficial indisponível — exibindo a base interna aproximada do sistema.',
        }
      }
    }),
  )
  return chaves.map((chave, i) =>
    montarLinhaComparacao(
      chave,
      respostas[i].serie,
      gran,
      anoInicio,
      anoFim,
      respostas[i].fonteViva,
      respostas[i].aviso,
      respostas[i].fonte,
    ),
  )
}

/** Quantidade de séries do catálogo com fonte oficial ativa (rótulo de rodapé). */
export function totalSeriesCatalogo(): number {
  return CATALOGO_SERIES.length
}
