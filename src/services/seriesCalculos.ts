/**
 * CÁLCULOS — agregação, acumulados e granularidade das séries históricas
 * do portal de Indicadores Econômicos e Financeiros (aba Histórico).
 */
import type { CatalogoSerie, GranularidadeHistorica, PontoSerie } from './seriesHistoricas'

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export interface PontoGrafico {
  rotulo: string
  valor: number
  /** Acumulado composto do período até este ponto (índices de correção). */
  acumulado: number
}

export interface AcumuladoAno {
  ano: number
  acumulado: number
}

export interface ResumoAcumulados {
  anoCorrente: number
  anoAnterior: number
  periodo: number
  primeiro: PontoSerie
  ultimo: PontoSerie
  quantidadePontos: number
}

/** Rotula um ponto conforme a granularidade. */
export function rotuloDoPonto(periodo: string, granularidade: GranularidadeHistorica): string {
  if (granularidade === 'anual') return periodo.slice(0, 4)
  if (granularidade === 'trimestral') {
    const m = periodo.match(/^(\d{4})-Q(\d)$/)
    if (m) return `Q${m[2]}/${m[1].slice(2)}`
  }
  const m = periodo.match(/^(\d{4})-(\d{2})$/)
  if (m) return `${MESES_CURTOS[parseInt(m[2], 10) - 1]}/${m[1].slice(2)}`
  return periodo
}

/** Ordena os períodos normalizados (YYYY-MM > YYYY-Qn > YYYY). */
function chavePeriodo(p: string): number {
  const m = p.match(/^(\d{4})(?:-(?:(\d{2})|Q(\d)))?$/)
  if (!m) return 0
  const ano = parseInt(m[1], 10) * 10000
  const mes = m[2] ? parseInt(m[2], 10) * 100 : m[3] ? parseInt(m[3], 10) * 300 : 0
  return ano + mes
}

export function ordenarSerie(serie: PontoSerie[]): PontoSerie[] {
  return [...serie].sort((a, b) => chavePeriodo(a.periodo) - chavePeriodo(b.periodo))
}

/**
 * Agrupa a série na granularidade pedida.
 * - mensal: ponto a ponto.
 * - trimestral: média dos meses do trimestre (nível) ou soma (variação %).
 * - anual: média dos meses do ano (nível) ou soma composta (variação %).
 */
export function agruparSerie(
  serie: PontoSerie[],
  item: CatalogoSerie,
  granularidade: GranularidadeHistorica,
): PontoSerie[] {
  const ordenada = ordenarSerie(serie)
  if (granularidade === 'mensal') {
    // séries anuais (base interna) viram mensais? não — retornam como estão.
    return ordenada
  }
  const ehVariacao = item.modoAcumulado === 'variacao_mensal'
  const grupos = new Map<string, PontoSerie[]>()
  const ordem: string[] = []
  for (const p of ordenada) {
    const chave = granularidade === 'anual' ? p.periodo.slice(0, 4) : trimestreDe(p.periodo)
    if (!chave) continue
    if (!grupos.has(chave)) {
      grupos.set(chave, [])
      ordem.push(chave)
    }
    grupos.get(chave)!.push(p)
  }
  const saida: PontoSerie[] = []
  for (const chave of ordem) {
    const pts = grupos.get(chave)!
    const validos = pts.filter((p) => Number.isFinite(p.valor))
    if (validos.length === 0) continue
    if (ehVariacao) {
      let acum = 1
      for (const p of validos) acum *= 1 + p.valor / 100
      saida.push({ periodo: chave, valor: (acum - 1) * 100 })
    } else {
      const soma = validos.reduce((s, p) => s + p.valor, 0)
      saida.push({ periodo: chave, valor: soma / validos.length })
    }
  }
  return saida
}

/** '2024-03' → '2024-Q1'; '2024-Q2' → '2024-Q2'; '2024' → '2024'. */
function trimestreDe(periodo: string): string {
  const m = periodo.match(/^(\d{4})-(\d{2})$/)
  if (m) return `${m[1]}-Q${Math.ceil(parseInt(m[2], 10) / 3)}`
  if (/^\d{4}-Q\d$/.test(periodo)) return periodo
  return periodo
}

/**
 * Acumulado composto do período para índices de correção (%): produto dos
 * (1 + v/100). Para séries de nível: variação % entre o primeiro e o último
 * ponto do período (e também o acumulado composto quando os valores são %).
 */
export function acumuladoDoPeriodo(pontos: PontoSerie[], item: CatalogoSerie): number {
  const validos = pontos.filter((p) => Number.isFinite(p.valor))
  if (validos.length === 0) return 0
  if (item.modoAcumulado === 'variacao_mensal') {
    let acum = 1
    for (const p of validos) acum *= 1 + p.valor / 100
    return (acum - 1) * 100
  }
  const primeiro = validos[0].valor
  const ultimo = validos[validos.length - 1].valor
  if (primeiro === 0) return 0
  return ((ultimo - primeiro) / Math.abs(primeiro)) * 100
}

/** Acumulado de cada ano civil presente na série (jan–dez). */
export function acumuladosPorAno(serie: PontoSerie[], item: CatalogoSerie): AcumuladoAno[] {
  const porAno = new Map<number, PontoSerie[]>()
  for (const p of ordenarSerie(serie)) {
    const ano = parseInt(p.periodo.slice(0, 4), 10)
    if (!Number.isFinite(ano)) continue
    if (!porAno.has(ano)) porAno.set(ano, [])
    porAno.get(ano)!.push(p)
  }
  const saida: AcumuladoAno[] = []
  for (const [ano, pts] of porAno) {
    // Ano corrente: acumula só o que já existe (jan até o último mês disponível).
    const saidaAno = acumuladoDoPeriodo(pts, item)
    saida.push({ ano, acumulado: saidaAno })
  }
  return saida.sort((a, b) => a.ano - b.ano)
}

/** Série de gráfico com acumulado progressivo em cada ponto. */
export function serieComAcumulado(serie: PontoSerie[], item: CatalogoSerie): PontoGrafico[] {
  const saida: PontoGrafico[] = []
  let acum = 1
  for (const p of serie) {
    if (item.modoAcumulado === 'variacao_mensal') {
      acum *= 1 + (Number.isFinite(p.valor) ? p.valor : 0) / 100
      saida.push({ rotulo: p.periodo, valor: p.valor, acumulado: (acum - 1) * 100 })
    } else {
      saida.push({ rotulo: p.periodo, valor: p.valor, acumulado: p.valor })
    }
  }
  return saida
}

/** Filtra a série pelo período (mês/ano inicial e final) escolhido. */
export function filtrarPorPeriodo(
  serie: PontoSerie[],
  inicioAno: number,
  inicioMes: number,
  fimAno: number,
  fimMes: number,
): PontoSerie[] {
  const de = inicioAno * 100 + inicioMes
  const ate = fimAno * 100 + fimMes
  return ordenarSerie(serie).filter((p) => {
    const m = p.periodo.match(/^(\d{4})(?:-(?:(\d{2})|Q(\d)))?$/)
    if (!m) return true
    const ano = parseInt(m[1], 10)
    const mes = m[2] ? parseInt(m[2], 10) : m[3] ? (parseInt(m[3], 10) - 1) * 3 + 1 : 6
    const chave = ano * 100 + mes
    return chave >= de && chave <= ate
  })
}

/** Resumo de acumulados: ano corrente, ano anterior e período selecionado. */
export function resumoAcumulados(
  serieCompleta: PontoSerie[],
  serieFiltrada: PontoSerie[],
  item: CatalogoSerie,
): ResumoAcumulados | null {
  const ordenada = ordenarSerie(serieCompleta).filter((p) => Number.isFinite(p.valor))
  if (ordenada.length === 0 || serieFiltrada.length === 0) return null
  const anoCorrente = new Date().getFullYear()
  const ptsCorrente = ordenada.filter((p) => p.periodo.startsWith(String(anoCorrente)))
  const ptsAnterior = ordenada.filter((p) => p.periodo.startsWith(String(anoCorrente - 1)))
  const validos = ordenarSerie(serieFiltrada).filter((p) => Number.isFinite(p.valor))
  return {
    anoCorrente: acumuladoDoPeriodo(ptsCorrente, item),
    anoAnterior: acumuladoDoPeriodo(ptsAnterior, item),
    periodo: acumuladoDoPeriodo(validos, item),
    primeiro: validos[0],
    ultimo: validos[validos.length - 1],
    quantidadePontos: validos.length,
  }
}

/** Formata valor conforme o tipo do indicador. */
export function formatarValorSerie(
  valor: number,
  item: Pick<CatalogoSerie, 'formatoValor' | 'unidade'>,
): string {
  if (!Number.isFinite(valor)) return '—'
  if (item.formatoValor === 'real') {
    return 'R$ ' + valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  }
  const sufixo = item.formatoValor === 'pct' ? '%' : ''
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + sufixo
}
