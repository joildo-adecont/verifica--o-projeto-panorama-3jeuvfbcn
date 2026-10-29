/**
 * ALÍQUOTAS DE REFERÊNCIA DO IBS E DA CBS
 *
 * ── FONTE ÚNICA ──
 * Todo simulador e toda tabela do Panorama leem daqui. Antes, o valor 27,91%
 * estava repetido em nove arquivos, e cada mudança exigia editar os nove sem
 * esquecer nenhum. Agora há uma linha para mudar.
 *
 * ── ESTADO ATUAL (29/10/2026) ──
 *
 * CBS — 11,30%, válida a partir de 01/01/2027.
 *   Fixada pelo TCU em 28/10/2026: o cálculo apurou 11,3468%, arredondado para
 *   11,3% conforme o §14 do art. 349 da LC 214/2025 (arredondamento ao décimo de
 *   ponto percentual). O Senado tem até 15/12/2026 para fixar por resolução; se
 *   não se manifestar, prevalece o cálculo do TCU e os 11,3% vigoram desde
 *   1º de janeiro de 2027. Decisão do CEO em 29/10/2026: adotar 11,3% desde já
 *   nos simuladores.
 *
 * IBS — 18,70%, mantido como estava (decisão do CEO em 29/10/2026).
 *   É a parcela do IBS na alíquota-padrão projetada, adotada pela Resolução
 *   CGIBS nº 14/2026 (DOU de 31/07/2026, Seção 3, p. 188-189). Não é alíquota em
 *   vigor: o IBS começa a ser cobrado em 2029, em transição até 2033.
 *
 * ── HISTÓRICO DO QUE MUDOU ──
 *   Antes (Res. CGIBS 14/2026):  IBS 18,70% + CBS 9,21% = 27,91%
 *   Agora  (TCU 28/10/2026):     IBS 18,70% + CBS 11,30% = 30,00%
 *
 * ── POR QUE A SOMA MUDOU, E O QUE ISSO AINDA NÃO É ──
 * A soma passa de 27,91% para 30,00% porque só a parcela da CBS foi atualizada.
 * Isso NÃO significa que a alíquota-padrão vigente em 2027 será 30%: em 2027 só
 * a CBS é cobrada (o IBS está em fase de teste, com 0,1%); o IBS entra em 2029 e
 * chega à referência em 2033. O 30,00% é a referência de regime pleno — a base
 * sobre a qual os redutores de 60%, 30%, 50% e 70% são aplicados.
 *
 * ── A TRAVA DE 26,5% ──
 * O art. 349 da LC 214/2025 prevê que, se a soma das alíquotas de referência
 * superar 26,5%, o Poder Executivo deve propor ao Congresso medidas para reduzi-la
 * a esse patamar. Com CBS 11,3% + IBS 18,7% = 30,0%, a trava passa a ser um fato
 * relevante — os simuladores exibem o aviso, e não o escondem.
 *
 * ── AVISO DE NATUREZA ──
 * Estes percentuais são a referência de cálculo, não a alíquota efetiva de cada
 * produto. Cada item tem seu tratamento (alíquota zero, redução de 60%/30%,
 * imposto seletivo, suspensão, crédito presumido), e o valor efetivo é a
 * referência multiplicada pelo fator do tratamento.
 */

/** Alíquota de referência da CBS, em %, válida a partir de 1º/01/2027. */
export const CBS_REF = 11.3

/** Alíquota de referência do IBS, em % — mantida em 18,70% (Res. CGIBS 14/2026). */
export const IBS_REF = 18.7

/** Soma das referências (regime pleno): 30,00% com os valores atuais. */
export const REF_TOTAL = CBS_REF + IBS_REF

/** Teto constitucional da alíquota de referência (LC 214/2025, art. 349). */
export const TETO_REFERENCIA = 26.5

/** A soma estourou a trava do art. 349? */
export const ACIMA_DO_TETO = REF_TOTAL > TETO_REFERENCIA

/** Vigência da referência da CBS adotada aqui. */
export const CBS_VIGENCIA = '2027-01-01'

/**
 * Procedência de cada número — para a tela poder citar a fonte, e para ninguém
 * confundir estimativa com alíquota fixada.
 */
export const PROCEDENCIA = {
  cbs: {
    valor: CBS_REF,
    fixadoPor: 'TCU — sessão plenária extraordinária de 28/10/2026',
    calculado: 11.3468,
    arredondamento: '§14 do art. 349 da LC 214/2025 — décimo de ponto percentual',
    pendente: 'Resolução do Senado Federal até 15/12/2026; sem manifestação, prevalece o TCU',
    vigencia: 'a partir de 01/01/2027',
    status: 'fixada para 2027' as const,
  },
  ibs: {
    valor: IBS_REF,
    fixadoPor: 'Resolução CGIBS nº 14/2026 (DOU 31/07/2026, Seção 3, p. 188-189)',
    calculado: 18.7,
    arredondamento: 'parcela do IBS na alíquota-padrão projetada',
    pendente: 'alíquotas próprias de cada ente a partir de 2029',
    vigencia: 'referência de regime pleno (2033)',
    status: 'referência projetada' as const,
  },
} as const

/**
 * Série histórica do que já foi usado — para o Histórico e para conferência.
 * Quando a referência mudar de novo, acrescente uma linha em vez de apagar.
 */
export interface MarcoAliquota {
  de: string
  cbs: number
  ibs: number
  total: number
  fonte: string
  nota?: string
}

export const HISTORICO_ALIQUOTAS: MarcoAliquota[] = [
  {
    de: '2026-07-31',
    cbs: 9.21,
    ibs: 18.7,
    total: 27.91,
    fonte: 'Resolução CGIBS nº 14/2026',
    nota: 'Parcela da CBS estimada por diferença (27,91 − 18,70); a resolução não a declara expressamente.',
  },
  {
    de: '2026-10-28',
    cbs: 11.3,
    ibs: 18.7,
    total: 30.0,
    fonte: 'TCU — alíquota de referência da CBS para 2027',
    nota: 'Calculada em 11,3468% e arredondada para 11,3%. IBS mantido em 18,70% por decisão do CEO.',
  },
]

/** Última atualização registrada — a tela mostra esta data. */
export const ALIQUOTAS_ATUALIZADAS_EM = '2026-10-29'

/** Texto curto e reutilizável, para cabeçalhos e rodapés de simulador. */
export const ETIQUETA_REFERENCIA = `CBS ${CBS_REF.toFixed(2).replace('.', ',')}% + IBS ${IBS_REF.toFixed(
  2,
).replace('.', ',')}% = ${REF_TOTAL.toFixed(2).replace('.', ',')}%`

/** Frase de procedência para exibir junto do número. */
export const FRASE_PROCEDENCIA =
  'CBS 11,3% fixada pelo TCU em 28/10/2026 para 2027 (11,3468% arredondado, LC 214 art. 349 §14); ' +
  'IBS 18,70% mantido da Res. CGIBS 14/2026.'

/** Formata um percentual no padrão brasileiro, com 2 casas. */
export function pct(v: number): string {
  return `${v.toFixed(2).replace('.', ',')}%`
}

/**
 * Alíquota efetiva de um item, dado o fator do seu tratamento.
 * Ex.: fator 0,4 (redução de 60%) sobre 30,00% = 12,00%.
 */
export function efetiva(fator: number, base: number = REF_TOTAL): number {
  return base * fator
}

/**
 * Série da CBS por ano, para os simuladores que projetam a transição.
 * 2027 em diante usa a referência fixada; antes disso não há CBS.
 */
export const CBS_POR_ANO: Record<number, number> = {
  2026: 0.9, // ano de teste (art. 343): 0,9% na prática, 0,1% destacado
  2027: CBS_REF,
  2028: CBS_REF,
  2029: CBS_REF,
  2030: CBS_REF,
  2031: CBS_REF,
  2032: CBS_REF,
  2033: CBS_REF,
}

/**
 * Série do IBS por ano, em % da referência (transição do art. 344):
 * 2027-2028 teste 0,1%; 2029 10%; 2030 40%; 2031 70%; 2032 90%; 2033 100%.
 */
export const IBS_FRACAO_POR_ANO: Record<number, number> = {
  2026: 0.1 / 18.7,
  2027: 0.1 / 18.7,
  2028: 0.1 / 18.7,
  2029: 0.1,
  2030: 0.4,
  2031: 0.7,
  2032: 0.9,
  2033: 1,
}

/** Alíquota do IBS em um ano, em %. */
export function ibsDoAno(ano: number): number {
  const f = IBS_FRACAO_POR_ANO[ano]
  if (f === undefined) return ano >= 2033 ? IBS_REF : 0.1
  if (ano <= 2028) return 0.1 // fase de teste: 0,1% nominal
  return IBS_REF * f
}

/** Alíquota total (IBS + CBS) em um ano, em % — é o que entra nos simuladores. */
export function totalDoAno(ano: number): number {
  const cbs = CBS_POR_ANO[ano]
  if (cbs === undefined) {
    return ano >= 2027 ? REF_TOTAL : 1
  }
  return ibsDoAno(ano) + cbs
}
