/**
 * ALÍQUOTAS DO REGIME ATUAL — ICMS POR UF
 *
 * ── POR QUE ESTE ARQUIVO EXISTE, E POR QUE ELE AVISA ──
 * O Analisador Tributário precisa comparar a carga de HOJE com a da REFORMA.
 * A carga da reforma tem fonte única e oficial (`aliquotas.ts`, CBS 11,3% +
 * IBS 18,7%). A carga de hoje, não: o ICMS é estadual, muda por lei de cada
 * estado, e as fontes públicas divergem em três UFs.
 *
 * ── O QUE EU NÃO FIZ ──
 * Não escolhi a alíquota "que parece mais certa" nos estados onde as fontes
 * discordam. Onde há divergência, o valor aqui é o da alíquota MODAL BASE —
 * sem o adicional de fundo estadual (FECOEP, FECP, FECOP) — e o campo
 * `divergente` marca a UF. O analisador mostra a ressalva na tela.
 *
 * ── O QUE ISSO SIGNIFICA NA PRÁTICA ──
 * A comparação é um DIMENSIONAMENTO, não uma apuração. O ICMS real de uma
 * operação depende de: alíquota interna do estado, benefícios fiscais,
 * substituição tributária, crédito outorgado, regime da empresa e do produto.
 * Nada disso está aqui. O que está aqui é o ponto de partida honesto: a
 * alíquota modal, que é o que a maioria das operações paga.
 *
 * ── AS CONTRIBUIÇÕES FEDERAIS (estas são de lei federal, sem divergência) ──
 *   PIS   1,65%  (regime não cumulativo)
 *   COFINS 7,60% (regime não cumulativo)
 *   Total 9,25% — que a reforma substitui por CBS 11,3% + IBS 18,7% = 30,0%
 *
 * Fonte das alíquotas de ICMS: compilação de tabelas públicas atualizadas em
 * 2026 (Paggo 22/10/2026, Barbieri 01/07/2026, Despezzas 05/08/2026, Real
 * Contabilidade 09/09/2026), conferidas contra o RICMS de cada estado quando
 * disponível. Onde as compilações divergem, ver `divergente`.
 */

export interface AliquotaUF {
  uf: string
  /** alíquota interna modal base, em % */
  icms: number
  /** % do adicional de fundo estadual (FECOEP/FECP/FECOP), quando há */
  fundo?: number
  /** as fontes públicas divergem para esta UF */
  divergente?: boolean
  /** norma citada pela compilação */
  norma?: string
}

/**
 * Alíquotas internas modais. Onde a compilação cita adicional de fundo, ele
 * vem separado — para o analisador poder mostrar "19% + 1% FECOEP" em vez de
 * um número único que esconde a composição.
 */
export const ICMS_POR_UF: AliquotaUF[] = [
  { uf: 'AC', icms: 19, norma: 'RICMS/AC' },
  {
    uf: 'AL',
    icms: 19,
    fundo: 1,
    divergente: true,
    norma: 'RICMS/AL (FECOEP) — compilações divergem: 19% ou 20%',
  },
  { uf: 'AP', icms: 18, norma: 'RICMS/AP' },
  { uf: 'AM', icms: 20, norma: 'RICMS/AM' },
  { uf: 'BA', icms: 20.5, norma: 'RICMS/BA' },
  { uf: 'CE', icms: 20, norma: 'RICMS/CE' },
  { uf: 'DF', icms: 20, norma: 'Lei 1.254/1996 (DF)' },
  { uf: 'ES', icms: 17, norma: 'RICMS/ES' },
  { uf: 'GO', icms: 19, norma: 'RICMS/GO' },
  { uf: 'MA', icms: 22, norma: 'RICMS/MA' },
  { uf: 'MT', icms: 17, norma: 'RICMS/MT' },
  { uf: 'MS', icms: 17, norma: 'RICMS/MS' },
  { uf: 'MG', icms: 18, norma: 'RICMS/MG' },
  { uf: 'PA', icms: 19, norma: 'RICMS/PA' },
  { uf: 'PB', icms: 20, norma: 'RICMS/PB' },
  { uf: 'PR', icms: 19, fundo: 0.5, norma: 'RICMS/PR (FECOP)' },
  { uf: 'PE', icms: 20.5, norma: 'RICMS/PE' },
  { uf: 'PI', icms: 21, divergente: true, norma: 'RICMS/PI — compilações divergem: 21% ou 22,5%' },
  { uf: 'RJ', icms: 20, fundo: 2, norma: 'RICMS/RJ (FECP)' },
  { uf: 'RN', icms: 18, divergente: true, norma: 'RICMS/RN — compilações divergem: 18% ou 20%' },
  { uf: 'RS', icms: 17, norma: 'RICMS/RS, Livro I, art. 27, X (Decreto 37.699/1997)' },
  { uf: 'RO', icms: 19.5, norma: 'RICMS/RO' },
  { uf: 'RR', icms: 20, norma: 'RICMS/RR' },
  { uf: 'SC', icms: 17, norma: 'RICMS/SC' },
  { uf: 'SP', icms: 18, norma: 'RICMS/SP' },
  { uf: 'SE', icms: 19, norma: 'RICMS/SE' },
  { uf: 'TO', icms: 20, norma: 'RICMS/TO' },
]

/** Mapa rápido UF → alíquota. */
export const ICMS_UF: Record<string, number> = ICMS_POR_UF.reduce(
  (acc, a) => {
    acc[a.uf] = a.icms
    return acc
  },
  {} as Record<string, number>,
)

/** Contribuições federais do regime atual (não cumulativo). */
export const PIS = 1.65
export const COFINS = 7.6
export const PIS_COFINS = PIS + COFINS // 9,25%

/**
 * Alíquota interestadual do ICMS (Resolução do Senado Federal nº 22/1989).
 *   Sul/Sudeste → Norte/Nordeste/Centro-Oeste/ES : 7%
 *   demais operações interestaduais              : 12%
 *   importados (Res. SF 13/2012)                 : 4%
 */
export function icmsInterestadual(ufOrigem: string, ufDestino: string): number {
  const SUL_SUDESTE = ['RS', 'SC', 'PR', 'SP', 'RJ', 'MG', 'ES']
  const NORTE_NORDESTE_CO = [
    'AC',
    'AM',
    'AP',
    'PA',
    'RO',
    'RR',
    'TO',
    'AL',
    'BA',
    'CE',
    'MA',
    'PB',
    'PE',
    'PI',
    'RN',
    'SE',
    'DF',
    'GO',
    'MT',
    'MS',
  ]
  const orig = String(ufOrigem || '').toUpperCase()
  const dest = String(ufDestino || '').toUpperCase()
  if (!orig || !dest) return 12
  if (orig === dest) return ICMS_UF[orig] ?? 18
  // ES é Sul/Sudeste para origem, mas destino na regra dos 7%
  if (SUL_SUDESTE.indexOf(orig) >= 0 && NORTE_NORDESTE_CO.indexOf(dest) >= 0) return 7
  return 12
}

/**
 * Carga total do regime atual sobre uma operação interna, em % do valor.
 * Soma ICMS (com adicional de fundo, quando há) + PIS + COFINS.
 */
export function cargaAtual(uf: string): {
  icms: number
  fundo: number
  federal: number
  total: number
  divergente: boolean
  norma: string
} {
  const a = ICMS_POR_UF.find((x) => x.uf === String(uf || '').toUpperCase())
  const icms = a ? a.icms : 18
  const fundo = a && a.fundo ? a.fundo : 0
  const federal = PIS_COFINS
  return {
    icms,
    fundo,
    federal,
    total: Math.round((icms + fundo + federal) * 100) / 100,
    divergente: Boolean(a && a.divergente),
    norma: a ? a.norma || '' : 'UF não informada — usado 18% (referência de SP)',
  }
}

/** Estados cuja alíquota as fontes públicas não convergem. */
export const UFS_DIVERGENTES = ICMS_POR_UF.filter((a) => a.divergente).map((a) => a.uf)

/** Ressalva que o analisador exibe junto de qualquer comparação. */
export const RESSALVA_COMPARACAO =
  'A carga atual é a alíquota modal do ICMS + PIS/COFINS não cumulativos. Não considera ' +
  'benefícios fiscais, substituição tributária, crédito outorgado, regime especial da empresa ' +
  'nem alíquota específica do produto. É ponto de partida para dimensionar, não apuração.'
