/**
 * VÍNCULOS ENTRE A LEGISLAÇÃO E AS LINHAS DA TABELA GERAL
 *
 * Gerado por scripts/ligacao-item/gerar_vinculos.py — não editar à mão.
 * Regenerar quando a Tabela Geral ou o catálogo do Simulador mudarem.
 *
 * COMO ESTÁ ORGANIZADO
 * Todas as linhas de um anexo nascem do mesmo dispositivo: o Anexo II do RIBS
 * inteiro vem do art. 164. Por isso a norma é declarada uma vez por bloco, e as
 * linhas carregam apenas a confiança, numa string com um caractere por linha,
 * na mesma ordem em que as linhas aparecem na Tabela Geral:
 *
 *   a = alta   — o código da linha casa com o catálogo do Simulador no mesmo anexo
 *   m = média  — casou em parte (a linha cita mais de um código)
 *   b = baixa  — não casou: linha sem código, ou código ausente do catálogo
 *
 * O que é honesto prometer: 'a' é vínculo deduzido e verificado contra o
 * catálogo do Simulador; 'b' é ausência de confirmação, e a tela mostra a
 * ressalva em vez de inventar origem. Nenhuma linha recebe dispositivo que não
 * venha do baseLegal do próprio anexo.
 *
 * A posição da linha é estável porque este arquivo e a Tabela Geral são gerados
 * da mesma fonte, na mesma ordem.
 */

export type Confianca = 'alta' | 'media' | 'baixa'

export interface BlocoVinculo {
  norma: string
  dispositivo: string
  remissao?: string
  anexo: string
  /** um caractere por linha do bloco, na ordem da Tabela Geral */
  linhas: string
}

export const VINCULOS_POR_BLOCO: Record<string, BlocoVinculo> = {
  'lc214-a1': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 125',
    remissao: 'RIBS art. 199; EC 132 art. 8º',
    anexo: 'LC 214 Anexo I',
    linhas: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  'lc214-a12': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 144, I',
    remissao: 'RIBS art. 220, I',
    anexo: 'LC 214 Anexo XII',
    linhas: 'baaaaaaaamamaaaaamaa',
  },
  'lc214-a13': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 145',
    remissao: 'RIBS art. 221',
    anexo: 'LC 214 Anexo XIII',
    linhas: 'abaaaaam',
  },
  'lc214-a15': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 148',
    remissao: 'RIBS art. 224',
    anexo: 'LC 214 Anexo XV',
    linhas: 'aaaaaaaaaaaaaa',
  },
  'lc214-a17': {
    norma: 'LC 214/2025',
    dispositivo: 'Anexo XVII',
    remissao: 'Decreto 12.955/2026, Anexo IV',
    anexo: 'LC 214 Anexo XVII',
    linhas: 'aaaaaaaaaaaaa',
  },
  'lc214-a2': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 129',
    remissao: 'RIBS art. 204',
    anexo: 'LC 214 Anexo II',
    linhas: 'aaaaaaaab',
  },
  'lc214-a3': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 130',
    remissao: 'RIBS art. 205',
    anexo: 'LC 214 Anexo III',
    linhas: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  'lc214-a4': {
    norma: 'LC 214/2025',
    dispositivo: 'arts. 131 e 144',
    remissao: 'RIBS arts. 206 e 220',
    anexo: 'LC 214 Anexo IV',
    linhas: 'aaaaaaaaaaa',
  },
  'lc214-a7': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 135',
    remissao: 'RIBS art. 210',
    anexo: 'LC 214 Anexo VII',
    linhas: 'bmabmbammaaaabbma',
  },
  'lc214-a8': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 136',
    remissao: 'RIBS art. 211',
    anexo: 'LC 214 Anexo VIII',
    linhas: 'aaaaaaa',
  },
  'lc214-a9': {
    norma: 'LC 214/2025',
    dispositivo: 'art. 138 e § 2º',
    remissao: 'RIBS arts. 213–214',
    anexo: 'LC 214 Anexo IX',
    linhas: 'amammmmmammmammaabmmaamaaaaaaaaabm',
  },
  'ribs-a1': {
    norma: 'Resolução CGIBS 6/2026 — RIBS',
    dispositivo: 'arts. 47–48',
    remissao: 'arts. 47 e 47, § 7º, da LC 214/2025',
    anexo: 'RIBS Anexo I',
    linhas:
      'bbbaaaabbaaaaaaabababaabbabaaabababaaaaaaabaaabaaaaaaaaaaaaabaabaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaabaa',
  },
  'ribs-a2': {
    norma: 'Resolução CGIBS 6/2026 — RIBS',
    dispositivo: 'art. 164 e §§ 2º a 5º',
    remissao: 'art. 93 da LC 214/2025',
    anexo: 'RIBS Anexo II',
    linhas:
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  'ribs-a3': {
    norma: 'Resolução CGIBS 6/2026 — RIBS',
    dispositivo: 'art. 186, § 5º',
    remissao: 'art. 105 da LC 214/2025',
    anexo: 'RIBS Anexo III',
    linhas: 'bmmmmmmmammmma',
  },
  'ribs-a4': {
    norma: 'Resolução CGIBS 6/2026 — RIBS',
    dispositivo: 'arts. 196–197',
    remissao: 'arts. 109 e 110 da LC 214/2025',
    anexo: 'RIBS Anexo IV',
    linhas:
      'baaaabaaaaaaaabaaaaaaaammaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  },
  'ribs-a5': {
    norma: 'Resolução CGIBS 6/2026 — RIBS',
    dispositivo: 'art. 521, § 1º, IV',
    remissao: 'art. 450 da LC 214/2025',
    anexo: 'RIBS Anexo V',
    linhas: 'mammmmmammaaammmammammmmammaaaaammmaammamamaammma',
  },
}

const LETRA: Record<string, Confianca> = { a: 'alta', m: 'media', b: 'baixa' }

/** Confiança do vínculo de uma linha, pela posição dela dentro do bloco. */
export function confiancaDaLinha(anexoId: string, posicao: number): Confianca | undefined {
  const b = VINCULOS_POR_BLOCO[anexoId]
  if (!b) return undefined
  const letra = b.linhas[posicao]
  return letra ? LETRA[letra] : undefined
}

/** Resumo de um bloco inteiro — para o cabeçalho da tabela na tela. */
export function resumoBloco(anexoId: string) {
  const b = VINCULOS_POR_BLOCO[anexoId]
  if (!b) return undefined
  let a = 0
  let m = 0
  let x = 0
  for (const letra of b.linhas) {
    if (letra === 'a') a++
    else if (letra === 'm') m++
    else x++
  }
  return {
    norma: b.norma,
    dispositivo: b.dispositivo,
    remissao: b.remissao,
    anexo: b.anexo,
    total: b.linhas.length,
    alta: a,
    media: m,
    baixa: x,
  }
}

/** Quantas linhas cada dispositivo sustenta — o caminho norma -> tabela. */
export const LINHAS_POR_DISPOSITIVO = Object.values(VINCULOS_POR_BLOCO).map((b) => ({
  norma: b.norma,
  dispositivo: b.dispositivo,
  linhas: b.linhas.length,
  anexo: b.anexo,
  confianca_alta: Array.from(b.linhas).filter((l) => l === 'a').length,
}))

export const TOTAL_LINHAS = 1053
export const TOTAL_ALTA = 954
export const TOTAL_MEDIA = 66
export const TOTAL_BAIXA = 33
export const TOTAL_BLOCOS = Object.keys(VINCULOS_POR_BLOCO).length
