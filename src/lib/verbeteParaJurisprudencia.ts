import type { Jurisprudencia } from '@/services/jurisprudencias'

/**
 * VERBETE → JURISPRUDÊNCIA DO ESCRITÓRIO
 * ======================================
 *
 * Pedido do CEO (03/11/2026): botão "usar esta tese" dentro de Súmulas e teses,
 * para não ter de colar o texto à mão em cada publicação.
 *
 * ── O QUE ESTE ARQUIVO NÃO FAZ ──
 * Não inventa o que o verbete não traz. A súmula do STJ tem número, enunciado,
 * área e data; NÃO tem número de processo nem relator — e é assim que o registro
 * nasce: campo vazio, para o advogado completar com o que interessa ao caso.
 * Preencher com aproximação entregaria ao cliente uma citação que não existe.
 *
 * ── O QUE ELE NÃO PREENCHE, DE PROPÓSITO ──
 * `aplicacao_pratica` — essa é a leitura da casa, e é justamente o que faz
 * sentido o sócio escrever. Pré-preencher seria adivinhar estratégia.
 */

export interface VerbeteLike {
  n: number
  /** texto da tese / enunciado */
  t: string
  /** 1 = súmula vinculante (só nos conjuntos do STF) */
  v?: number
  /** órgão julgador ou título do tema */
  o?: string
  /** data de julgamento (ISO ou dd/mm/aaaa) */
  d?: string
  /** área do direito (STJ) */
  a?: string
  /** 1 = cancelada (TST) */
  c?: number
  /** ramo do direito (temas repetitivos) */
  r?: string
  s?: string
}

const FONTE_URL: Record<string, string> = {
  STF: 'https://portal.stf.jus.br/jurisprudencia/',
  STJ: 'https://scon.stj.jus.br/SCON/',
  TST: 'https://www.tst.jus.br/jurisprudencia',
  TSE: 'https://www.tse.jus.br/jurisprudencia',
  STM: 'https://www.stm.jus.br',
}

const semAcento = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

/** Converte a área/ramo do verbete numa das matérias do cadastro. */
export function materiaDe(area?: string): string {
  const a = semAcento(area)
  if (!a) return 'Outro'
  if (a.indexOf('tribut') >= 0) return 'Tributário'
  if (a.indexOf('processo civil') >= 0) return 'Processo Civil'
  if (a.indexOf('processo penal') >= 0) return 'Processo Penal'
  if (a.indexOf('trabalh') >= 0) return 'Trabalhista'
  if (a.indexOf('previdenci') >= 0) return 'Previdenciário'
  if (a.indexOf('administrativ') >= 0) return 'Administrativo'
  if (a.indexOf('constituc') >= 0) return 'Constitucional'
  if (a.indexOf('falenc') >= 0 || a.indexOf('recupera') >= 0 || a.indexOf('empresar') >= 0)
    return 'Empresarial'
  if (a.indexOf('consumidor') >= 0) return 'Consumidor'
  if (a.indexOf('eleitor') >= 0) return 'Eleitoral'
  if (a.indexOf('ambient') >= 0) return 'Ambiental'
  if (a.indexOf('penal') >= 0) return 'Penal'
  if (a.indexOf('civil') >= 0) return 'Civil'
  return 'Outro'
}

/** Normaliza data para AAAA-MM-DD quando ela vem em dd/mm/aaaa. */
function dataIso(d?: string): string {
  const s = String(d || '').trim()
  if (!s) return ''
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  return s
}

/**
 * Monta o rascunho a partir de um verbete.
 * @param tribunal  STF | STJ | TST…
 * @param tipoDeDecisao 'súmula' | 'súmula vinculante' | 'tema repetitivo'
 */
export function verbeteParaJurisprudencia(
  tribunal: string,
  tipoDeDecisao: string,
  v: VerbeteLike,
): Partial<Jurisprudencia> {
  const ano = dataIso(v.d).slice(0, 4)
  const rotulo = tipoDeDecisao === 'tema repetitivo' ? 'Tema' : 'Súmula'
  const titulo = `${rotulo} ${v.n}${v.o ? ` — ${v.o}` : ''}${ano ? ` (${ano})` : ''}`

  const partes: string[] = []
  if (v.c === 1) {
    partes.push(
      'ATENÇÃO: esta súmula está CANCELADA no tribunal de origem. Serve como histórico, não como fundamento vigente.',
    )
  }
  partes.push(v.t)

  return {
    titulo: titulo.length > 300 ? `${titulo.slice(0, 297)}...` : titulo,
    tribunal: FONTE_URL[tribunal] ? tribunal : 'Outro',
    tipo_decisao: tipoDeDecisao,
    materia: materiaDe(v.a || v.r),
    numero: v.n ? String(v.n) : '',
    tese: partes.join('\n\n'),
    orgao_julgador: v.o || '',
    data_julgamento: dataIso(v.d),
    palavras_chave: v.a || v.r || '',
    origem: 'verbete_extraido',
    fonte_url: FONTE_URL[tribunal] || '',
    situacao: 'rascunho',
    destaque: false,
  }
}

/** Grupo do índice de artigos → como o verbete deve virar rascunho. */
export function grupoParaTribunal(grupoId: string, v: VerbeteLike): [string, string] {
  if (grupoId === '0') return ['STF', v.v === 1 ? 'súmula vinculante' : 'súmula']
  if (grupoId === '1') return ['STJ', 'súmula']
  if (grupoId === '2') return ['TST', 'súmula']
  if (grupoId === '3') return ['STJ', 'tema repetitivo']
  return ['Outro', 'súmula']
}
