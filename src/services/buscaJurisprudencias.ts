import { listarJurisprudencias } from '@/services/jurisprudencias'

/**
 * BUSCA DE JURISPRUDÊNCIAS NA BUSCA AVANÇADA
 * ==========================================
 *
 * Pedido do CEO (03/11/2026): "colocar na busca avançada a busca das
 * jurisprudências por palavras-chave, e ou tribunais."
 *
 * ── O ERRO DE DESEMPENHO QUE TRAVOU A PRIMEIRA VERSÃO ──
 * A versão inicial chamava `normalize('NFD')` + regex DENTRO do laço, uma vez
 * por verbete, a cada busca: 2.963 normalizações por consulta. No engine do
 * navegador (mais leve que Chrome) isso não terminava — a tela ficava em
 * "Buscando…" sem erro no console. A correção é pré-computar o texto
 * normalizado UMA vez, no download, e guardar no cache. A busca passa a
 * comparar strings simples.
 *
 * ── PROCEDÊNCIA ──
 * Cada resultado diz de onde veio: `oficial` (o que o tribunal publicou) ou
 * `escritorio` (o acervo próprio, protegido por token). Misturar sem rótulo
 * daria à nota do escritório o peso de uma súmula vinculante.
 */

export type FonteJuris = 'oficial' | 'escritorio'

export interface JurisResultado {
  id: string
  fonte: FonteJuris
  tribunal: string
  tipo: string
  numero: string
  selo?: 'vinculante' | 'cancelada'
  titulo: string
  texto: string
  orgao: string
  data: string
  area: string
  palavrasChave: string
  situacao: string
  fonteUrl: string
  aplicacaoPratica?: string
}

export interface BuscaJurisParams {
  termo?: string
  tribunais?: string[]
  materias?: string[]
  incluirOficial?: boolean
  incluirEscritorio?: boolean
  limite?: number
}

export interface BuscaJurisResultado {
  itens: JurisResultado[]
  total: number
  porFonte: { oficial: number; escritorio: number }
  porTribunal: Record<string, number>
  semToken: boolean
  aviso?: string
}

/** normaliza UMA vez por item (não por busca) */
function norm(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const ARQ_STF = 'dados/sumulas-stf.json'
const ARQ_STJ = 'dados/sumulas-stj.json'
const ARQ_TST = 'dados/sumulas-tst.json'
const ARQ_TEMAS = 'dados/temas-stj.json'

const FONTE_URL: Record<string, string> = {
  STF: 'https://portal.stf.jus.br/jurisprudencia/',
  STJ: 'https://scon.stj.jus.br/SCON/',
  TST: 'https://www.tst.jus.br/jurisprudencia',
}

/** item já normalizado, pronto para comparar sem custo */
interface ItemCache {
  r: JurisResultado
  /** texto de busca já sem acento e minúsculo */
  busca: string
}

const cache: Record<string, ItemCache[]> = {}

function montar(arquivo: string, v: any): JurisResultado {
  if (arquivo === ARQ_STF) {
    const vinc = v.v === 1
    return {
      id: `stf-${v.k || v.n}`,
      fonte: 'oficial',
      tribunal: 'STF',
      tipo: vinc ? 'súmula vinculante' : 'súmula',
      numero: vinc ? `SV ${v.n}` : `Súmula ${v.n}`,
      selo: vinc ? 'vinculante' : undefined,
      titulo: `${vinc ? 'Súmula vinculante' : 'Súmula'} ${v.n}${v.o ? ` — ${v.o}` : ''}`,
      texto: v.t || '',
      orgao: v.o || '',
      data: v.d || '',
      area: v.a || '',
      palavrasChave: v.a || '',
      situacao: 'vigente',
      fonteUrl: FONTE_URL.STF,
    }
  }
  if (arquivo === ARQ_STJ) {
    return {
      id: `stj-s${v.n}`,
      fonte: 'oficial',
      tribunal: 'STJ',
      tipo: 'súmula',
      numero: `Súmula ${v.n}`,
      titulo: `Súmula ${v.n}${v.a ? ` — ${v.a}` : ''}`,
      texto: v.t || '',
      orgao: '',
      data: v.d || '',
      area: v.a || '',
      palavrasChave: v.a || '',
      situacao: 'vigente',
      fonteUrl: FONTE_URL.STJ,
    }
  }
  if (arquivo === ARQ_TST) {
    return {
      id: `tst-${v.n}`,
      fonte: 'oficial',
      tribunal: 'TST',
      tipo: 'súmula',
      numero: `Súmula ${v.n}`,
      selo: v.c === 1 ? 'cancelada' : undefined,
      titulo: `Súmula ${v.n}${v.o ? ` — ${v.o}` : ''}`,
      texto: v.t || '',
      orgao: v.o || '',
      data: '',
      area: '',
      palavrasChave: v.o || '',
      situacao: v.c === 1 ? 'cancelada' : 'vigente',
      fonteUrl: FONTE_URL.TST,
    }
  }
  return {
    id: `stj-tema-${v.n}`,
    fonte: 'oficial',
    tribunal: 'STJ',
    tipo: 'tema repetitivo',
    numero: `Tema ${v.n}`,
    titulo: `Tema ${v.n}${v.r ? ` — ${v.r}` : ''}`,
    texto: v.t || '',
    orgao: '',
    data: '',
    area: v.r || '',
    palavrasChave: v.r || '',
    situacao: v.s || 'julgado',
    fonteUrl: FONTE_URL.STJ,
  }
}

async function baixar(arquivo: string): Promise<ItemCache[]> {
  if (cache[arquivo]) return cache[arquivo]
  try {
    const resp = await fetch(arquivo)
    if (!resp.ok) {
      cache[arquivo] = []
      return cache[arquivo]
    }
    const bruto = await resp.json()
    const lista = Array.isArray(bruto) ? bruto : []
    // normaliza aqui: 1 vez por item, na vida da sessão
    const prontos: ItemCache[] = []
    for (let i = 0; i < lista.length; i++) {
      const r = montar(arquivo, lista[i])
      prontos.push({
        r: r,
        busca: norm(
          `${r.titulo} ${r.texto} ${r.numero} ${r.area} ${r.palavrasChave} ${r.orgao} ${r.tipo}`,
        ),
      })
    }
    cache[arquivo] = prontos
    return prontos
  } catch {
    cache[arquivo] = []
    return cache[arquivo]
  }
}

export async function buscarJurisprudencias(
  params: BuscaJurisParams,
): Promise<BuscaJurisResultado> {
  const termo = norm(params.termo || '').trim()
  const termos = termo ? termo.split(/\s+/) : []
  const tribs = (params.tribunais || []).map((t) => t.toUpperCase())
  const materias = (params.materias || []).map((m) => norm(m))
  const limite = params.limite && params.limite > 0 ? params.limite : 200

  const incluirOficial = params.incluirOficial !== false
  const incluirEscritorio = params.incluirEscritorio !== false

  const itens: JurisResultado[] = []
  let semToken = false
  let aviso: string | undefined

  /* ── 1. ACERVO OFICIAL ── */
  if (incluirOficial) {
    const arquivos: Array<[string, string]> = [
      [ARQ_STF, 'STF'],
      [ARQ_STJ, 'STJ'],
      [ARQ_TST, 'TST'],
      [ARQ_TEMAS, 'STJ'],
    ]
    for (let a = 0; a < arquivos.length; a++) {
      const arquivo = arquivos[a][0]
      const tribunal = arquivos[a][1]
      if (tribs.length && tribs.indexOf(tribunal) < 0) continue
      const prontos = await baixar(arquivo)
      for (let i = 0; i < prontos.length; i++) {
        const it = prontos[i]
        let bateu = true
        for (let t = 0; t < termos.length; t++) {
          if (it.busca.indexOf(termos[t]) < 0) {
            bateu = false
            break
          }
        }
        if (!bateu) continue
        if (materias.length) {
          const area = norm(it.r.area)
          let ok = false
          for (let m = 0; m < materias.length; m++) {
            if (area.indexOf(materias[m]) >= 0) {
              ok = true
              break
            }
          }
          if (!ok) continue
        }
        itens.push(it.r)
      }
    }
  }

  /* ── 2. ACERVO DO ESCRITÓRIO (protegido por token) ── */
  if (incluirEscritorio) {
    try {
      const r = await listarJurisprudencias({})
      const lista = r.itens || []
      for (let i = 0; i < lista.length; i++) {
        const j = lista[i]
        if (j.situacao === 'arquivada') continue
        if (tribs.length && tribs.indexOf(String(j.tribunal).toUpperCase()) < 0) continue
        const item: JurisResultado = {
          id: j.id,
          fonte: 'escritorio',
          tribunal: j.tribunal,
          tipo: j.tipo_decisao,
          numero: j.numero || j.processo || '',
          titulo: j.titulo,
          texto: j.tese,
          orgao: j.orgao_julgador || '',
          data: j.data_julgamento || '',
          area: j.materia || '',
          palavrasChave: j.palavras_chave || '',
          situacao: j.situacao,
          fonteUrl: j.fonte_url || '',
          aplicacaoPratica: j.aplicacao_pratica || '',
        }
        const alvo = norm(
          `${item.titulo} ${item.texto} ${item.numero} ${item.area} ${item.palavrasChave} ${item.orgao} ${item.tipo}`,
        )
        let bateu2 = true
        for (let t = 0; t < termos.length; t++) {
          if (alvo.indexOf(termos[t]) < 0) {
            bateu2 = false
            break
          }
        }
        if (!bateu2) continue
        if (materias.length) {
          const area = norm(item.area)
          let ok = false
          for (let m = 0; m < materias.length; m++) {
            if (area.indexOf(materias[m]) >= 0) {
              ok = true
              break
            }
          }
          if (!ok) continue
        }
        itens.push(item)
      }
    } catch (e: any) {
      semToken = !!(e && e.name === 'SemTokenError')
      if (!semToken) aviso = 'Acervo do escritório indisponível: ' + String((e && e.message) || e)
    }
  }

  const peso = (r: JurisResultado) => {
    if (r.selo === 'cancelada') return 3
    if (r.fonte === 'oficial' && r.selo === 'vinculante') return 0
    if (r.fonte === 'oficial') return 1
    return 2
  }
  itens.sort((a, b) => {
    const d = peso(a) - peso(b)
    if (d !== 0) return d
    if (a.tribunal !== b.tribunal) return a.tribunal < b.tribunal ? -1 : 1
    return a.titulo < b.titulo ? -1 : a.titulo > b.titulo ? 1 : 0
  })

  const porTribunal: Record<string, number> = {}
  let oficial = 0
  let escritorio = 0
  for (let i = 0; i < itens.length; i++) {
    porTribunal[itens[i].tribunal] = (porTribunal[itens[i].tribunal] || 0) + 1
    if (itens[i].fonte === 'oficial') oficial += 1
    else escritorio += 1
  }

  return {
    itens: itens.slice(0, limite),
    total: itens.length,
    porFonte: { oficial, escritorio },
    porTribunal,
    semToken,
    aviso,
  }
}

export const TRIBUNAIS_JURIS = ['STF', 'STJ', 'TST', 'TSE', 'STM'] as const
