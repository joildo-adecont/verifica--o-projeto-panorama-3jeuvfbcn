/**
 * BUSCA DE JURISPRUDÊNCIAS NA BUSCA AVANÇADA
 * ==========================================
 *
 * Pedido do CEO (03/11/2026): "colocar na busca avançada a busca das
 * jurisprudências por palavras-chave, e ou tribunais."
 *
 * ── O QUE ENTRA NESTA BUSCA, E O QUE NÃO ENTRA ──
 * Entram os DOIS acervos, e a tela diz de qual veio cada resultado:
 *
 *  1. **Fonte oficial** — os 2.963 verbetes dos tribunais (STF, STJ, TST),
 *     servidos como arquivo estático em /dados/. É o que o tribunal publicou.
 *  2. **Acervo do escritório** — o que foi cadastrado/publicado na Seção 30,
 *     lido do backend (exige token do painel).
 *
 * Misturar os dois numa lista só seria desonesto: a tese do escritório não tem
 * o peso de uma súmula vinculante. Por isso o resultado vem etiquetado.
 *
 * ── POR QUE A BUSCA DO ESCRITÓRIO NÃO DERRUBA A TELA SEM TOKEN ──
 * O acervo próprio é protegido. Se o painel não estiver autenticado, esta busca
 * devolve `semToken: true` e a tela avisa — mas os resultados OFICIAIS continuam
 * aparecendo. Um erro de credencial não pode esconder as 2.963 súmulas públicas.
 */

export type FonteJuris = 'oficial' | 'escritorio'

export interface JurisResultado {
  id: string
  fonte: FonteJuris
  tribunal: string
  tipo: string
  numero: string
  /** vinculante (STF), cancelada (TST) ou nenhum dos dois */
  selo?: 'vinculante' | 'cancelada'
  titulo: string
  texto: string
  orgao: string
  data: string
  /** área do direito / ramo — é por aqui que "palavras-chave" casa */
  area: string
  palavrasChave: string
  situacao: string
  fonteUrl: string
  /** só no acervo do escritório */
  aplicacaoPratica?: string
}

export interface BuscaJurisParams {
  termo?: string
  tribunais?: string[]
  /** só do acervo do escritório; no oficial não há esse campo */
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

const semAcento = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const ARQ_STF = 'dados/sumulas-stf.json'
const ARQ_STJ = 'dados/sumulas-stj.json'
const ARQ_TST = 'dados/sumulas-tst.json'
const ARQ_TEMAS = 'dados/temas-stj.json'

const FONTE_URL: Record<string, string> = {
  STF: 'https://portal.stf.jus.br/jurisprudencia/',
  STJ: 'https://scon.stj.jus.br/SCON/',
  TST: 'https://www.tst.jus.br/jurisprudencia',
}

/** cache por sessão: os arquivos têm ~1 MB e não mudam entre buscas */
const cache: Record<string, any[]> = {}

async function baixar(arquivo: string): Promise<any[]> {
  if (cache[arquivo]) return cache[arquivo]
  try {
    const r = await fetch(arquivo)
    if (!r.ok) return []
    const j = await r.json()
    cache[arquivo] = Array.isArray(j) ? j : []
    return cache[arquivo]
  } catch {
    return []
  }
}

function normalizarOficial(arquivo: string, v: any): JurisResultado {
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
  // temas repetitivos do STJ
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

/** Casa o termo contra tudo que o verbete tem de texto. */
function casa(r: JurisResultado, termos: string[]): boolean {
  const alvo = semAcento(
    [r.titulo, r.texto, r.numero, r.area, r.palavrasChave, r.orgao, r.tipo].join(' '),
  )
  for (let i = 0; i < termos.length; i++) {
    if (alvo.indexOf(termos[i]) < 0) return false
  }
  return true
}

export async function buscarJurisprudencias(
  params: BuscaJurisParams,
): Promise<BuscaJurisResultado> {
  const termo = semAcento(params.termo || '').trim()
  const termos = termo ? termo.split(/\s+/) : []
  const tribs = (params.tribunais || []).map((t) => t.toUpperCase())
  const materias = (params.materias || []).map((m) => semAcento(m))
  const limite = params.limite && params.limite > 0 ? params.limite : 200

  const incluirOficial = params.incluirOficial !== false
  const incluirEscritorio = params.incluirEscritorio !== false

  let itens: JurisResultado[] = []
  let semToken = false
  let aviso: string | undefined

  /* ── 1. ACERVO OFICIAL (público) ── */
  if (incluirOficial) {
    const arquivos = [
      [ARQ_STF, 'STF'],
      [ARQ_STJ, 'STJ'],
      [ARQ_TST, 'TST'],
      [ARQ_TEMAS, 'STJ'],
    ] as const

    for (let a = 0; a < arquivos.length; a++) {
      const [arquivo, tribunal] = arquivos[a]
      if (tribs.length && tribs.indexOf(tribunal) < 0) continue
      const dados = await baixar(arquivo)
      for (let i = 0; i < dados.length; i++) {
        const r = normalizarOficial(arquivo, dados[i])
        if (termos.length && !casa(r, termos)) continue
        if (materias.length) {
          const area = semAcento(r.area)
          let bateu = false
          for (let m = 0; m < materias.length; m++) {
            if (area.indexOf(materias[m]) >= 0) {
              bateu = true
              break
            }
          }
          if (!bateu) continue
        }
        itens.push(r)
      }
    }
  }

  /* ── 2. ACERVO DO ESCRITÓRIO (protegido) ──
   * O import dinâmico e a leitura ficam em blocos separados de propósito: o
   * acervo do escritório depende de token, e uma falha de credencial aqui NÃO
   * pode apagar os resultados oficiais já coletados acima. Foi o que travou a
   * primeira versão: a exceção subia e a tela ficava em "Buscando…". */
  if (incluirEscritorio) {
    try {
      const { listarJurisprudencias } = await import('@/services/jurisprudencias')
      const r = await listarJurisprudencias({})
      const lista = r.itens.filter((j) => j.situacao !== 'arquivada')
      for (let i = 0; i < lista.length; i++) {
        const j = lista[i]
        if (tribs.length && tribs.indexOf(j.tribunal.toUpperCase()) < 0) continue
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
        if (termos.length && !casa(item, termos)) continue
        if (materias.length) {
          const area = semAcento(item.area)
          let bateu = false
          for (let m = 0; m < materias.length; m++) {
            if (area.indexOf(materias[m]) >= 0) {
              bateu = true
              break
            }
          }
          if (!bateu) continue
        }
        itens.push(item)
      }
    } catch (e: any) {
      // Sem token é o caso mais comum e não é erro: a tela avisa e segue com
      // o acervo oficial. Qualquer outra falha também não derruba a busca.
      semToken = e && e.name === 'SemTokenError'
      if (!semToken) {
        aviso = 'Acervo do escritório indisponível: ' + String((e && e.message) || e)
      }
    }
  }

  // Ordem: vinculante primeiro, depois oficial, depois escritório; por tribunal.
  const peso = (r: JurisResultado) => {
    if (r.selo === 'cancelada') return 3
    if (r.fonte === 'oficial' && r.selo === 'vinculante') return 0
    if (r.fonte === 'oficial') return 1
    return 2
  }
  itens.sort((a, b) => {
    const d = peso(a) - peso(b)
    if (d !== 0) return d
    if (a.tribunal !== b.tribunal) return a.tribunal.localeCompare(b.tribunal)
    return a.titulo.localeCompare(b.titulo, 'pt-BR')
  })

  const porTribunal: Record<string, number> = {}
  let oficial = 0
  let escritorio = 0
  for (let i = 0; i < itens.length; i++) {
    porTribunal[itens[i].tribunal] = (porTribunal[itens[i].tribunal] || 0) + 1
    if (itens[i].fonte === 'oficial') oficial += 1
    else escritorio += 1
  }

  const total = itens.length
  const recortado = itens.slice(0, limite)

  return {
    itens: recortado,
    total,
    porFonte: { oficial, escritorio },
    porTribunal,
    semToken,
    aviso,
  }
}

/** Tribunais disponíveis para o filtro — só os que têm acervo. */
export const TRIBUNAIS_JURIS = ['STF', 'STJ', 'TST', 'TSE', 'STM'] as const

/** Matérias do acervo do escritório (as que existem no cadastro). */
export const MATERIAS_JURIS = [
  'Tributário',
  'Civil',
  'Processo Civil',
  'Penal',
  'Processo Penal',
  'Trabalhista',
  'Administrativo',
  'Constitucional',
  'Empresarial',
  'Consumidor',
  'Previdenciário',
  'Eleitoral',
  'Ambiental',
] as const
