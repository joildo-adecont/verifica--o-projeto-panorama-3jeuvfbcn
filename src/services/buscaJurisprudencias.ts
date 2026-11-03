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

/* ══════════════════════════════════════════════════════════════════════════
 * BUSCA POR DISPOSITIVO ("Abrir na Busca Avançada")
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Recebe norma + artigo (ex.: CTN + 156) e devolve os verbetes ligados àquele
 * dispositivo, no MESMO formato da busca por palavra-chave — assim a tela
 * mostra tudo numa lista só, com os filtros de tribunal funcionando por cima.
 *
 * Por que aqui e não no componente: a regra de "quem é o verbete" (SV1 × S1,
 * tema × súmula) tem de ser a mesma em todo lugar. Duplicar essa lógica foi
 * exatamente o que produziu o bug das 92 súmulas do STF sem texto.
 */

interface IndiceArtigos {
  normas: Record<string, string>
  artigos: Record<string, Record<string, Array<number | string>>>
  origem: Record<string, string>
}

let cacheIndice: IndiceArtigos | null = null

async function carregarIndice(): Promise<IndiceArtigos | null> {
  if (cacheIndice) return cacheIndice
  try {
    const r = await fetch('dados/indice-artigos.json')
    if (!r.ok) return null
    cacheIndice = (await r.json()) as IndiceArtigos
    return cacheIndice
  } catch {
    return null
  }
}

/** Resolve o verbete a partir da chave do índice, respeitando o grupo. */
function resolverVerbete(
  lista: ItemCache[] | undefined,
  chave: number | string,
  grupo: string,
): ItemCache | undefined {
  const bruto = String(chave)
  const arr = lista || []
  if (grupo === '0') {
    // STF: "SV1" é vinculante, "S629" é simples — numeração independente.
    const porK = arr.find((x) => String((x.r as any).k) === bruto || x.r.id === `stf-${bruto}`)
    if (porK) return porK
    const m = bruto.match(/^S?V?(\d+)$/)
    if (m) {
      const num = parseInt(m[1], 10)
      const vinc = bruto.indexOf('SV') === 0
      return arr.find((x) => {
        const ehVinc = x.r.selo === 'vinculante'
        return x.r.numero.indexOf(` ${num}`) >= 0 && (vinc ? ehVinc : !ehVinc)
      })
    }
    return undefined
  }
  const num = typeof chave === 'number' ? chave : parseInt(bruto, 10)
  return arr.find((x) => x.r.numero.indexOf(` ${num}`) >= 0 || x.r.numero === String(num))
}

export interface BuscaPorDispositivoResultado extends BuscaJurisResultado {
  norma: string
  artigo: string
  /** rótulo legível da norma, ex.: "Código Tributário Nacional" */
  normaNome: string
}

export async function buscarPorDispositivo(
  normaChave: string,
  artigo: string,
  opts?: { tribunais?: string[]; incluirOficial?: boolean; incluirEscritorio?: boolean },
): Promise<BuscaPorDispositivoResultado> {
  const indice = await carregarIndice()
  const tribs = (opts?.tribunais || []).map((t) => t.toUpperCase())
  const incluirOficial = opts?.incluirOficial !== false
  const incluirEscritorio = opts?.incluirEscritorio !== false

  const vazio: BuscaPorDispositivoResultado = {
    itens: [],
    total: 0,
    porFonte: { oficial: 0, escritorio: 0 },
    porTribunal: {},
    semToken: false,
    norma: normaChave,
    artigo: artigo,
    normaNome: (indice && indice.normas[normaChave]) || normaChave,
  }
  if (!indice) return vazio

  const chaveIndice = `${normaChave}|${parseInt(artigo, 10)}`
  const grupos = indice.artigos[chaveIndice]
  if (!grupos) return vazio

  const itens: JurisResultado[] = []
  let semToken = false
  let aviso: string | undefined

  if (incluirOficial) {
    const porGrupo: Array<[string, string, string]> = [
      ['0', ARQ_STF, 'STF'],
      ['1', ARQ_STJ, 'STJ'],
      ['2', ARQ_TST, 'TST'],
      ['3', ARQ_TEMAS, 'STJ'],
    ]
    for (let g = 0; g < porGrupo.length; g++) {
      const grupo = porGrupo[g][0]
      const arquivo = porGrupo[g][1]
      const tribunal = porGrupo[g][2]
      if (tribs.length && tribs.indexOf(tribunal) < 0) continue
      const chaves = grupos[grupo]
      if (!chaves || !chaves.length) continue
      const prontos = await baixar(arquivo)
      for (let i = 0; i < chaves.length; i++) {
        const achado = resolverVerbete(prontos, chaves[i], grupo)
        if (achado) itens.push(achado.r)
      }
    }
  }

  // Acervo do escritório: casa o dispositivo contra o campo `dispositivos`
  if (incluirEscritorio) {
    try {
      const r = await listarJurisprudencias({})
      const alvo = norm(`${normaChave} ${indice.normas[normaChave] || ''} art`).trim()
      const numTxt = String(parseInt(artigo, 10))
      const lista = r.itens || []
      for (let i = 0; i < lista.length; i++) {
        const j = lista[i]
        if (j.situacao === 'arquivada') continue
        if (tribs.length && tribs.indexOf(String(j.tribunal).toUpperCase()) < 0) continue
        const disp = norm(j.dispositivos || '')
        if (!disp) continue
        // exige o número do artigo E alguma referência à norma
        if (disp.indexOf(numTxt) < 0) continue
        const sigla = norm(normaChave).replace(/\/.*$/, '')
        if (disp.indexOf(sigla) < 0 && disp.indexOf(norm(indice.normas[normaChave] || '')) < 0)
          continue
        itens.push({
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
        })
      }
      // `alvo` só existe para deixar claro que a norma entra no casamento
      void alvo
    } catch (e: any) {
      semToken = !!(e && e.name === 'SemTokenError')
      if (!semToken) aviso = 'Acervo do escritório indisponível: ' + String((e && e.message) || e)
    }
  }

  const porTribunal: Record<string, number> = {}
  let oficial = 0
  let escritorio = 0
  for (let i = 0; i < itens.length; i++) {
    porTribunal[itens[i].tribunal] = (porTribunal[itens[i].tribunal] || 0) + 1
    if (itens[i].fonte === 'oficial') oficial += 1
    else escritorio += 1
  }

  return {
    itens,
    total: itens.length,
    porFonte: { oficial, escritorio },
    porTribunal,
    semToken,
    aviso,
    norma: normaChave,
    artigo: artigo,
    normaNome: indice.normas[normaChave] || normaChave,
  }
}
