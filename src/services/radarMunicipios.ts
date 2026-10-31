import pb from '@/lib/pocketbase/client'
import {
  MUNICIPIOS_IBGE_POR_UF,
  ATOS_NORMATIVOS_MUNICIPAIS,
  type MunicipioIBGE,
  type AtoNormativoMunicipal,
} from '@/data/radarMunicipios'

export interface RadarMunicipioItem {
  id: string
  codigo_ibge: string
  nome: string
  uf: string
  atosCount?: number
}

export interface RadarAtoItem {
  id: string
  uf: string
  codigo_ibge?: string
  municipio_nome?: string
  titulo: string
  url?: string
  assoc?: string
  data?: string
  resumo?: string
  nivel?: 'municipal' | 'estadual' | 'federal'
}

export interface FetchMunicipiosParams {
  uf?: string
  termo?: string
  page?: number
  perPage?: number
}

export interface FetchMunicipiosResult {
  items: RadarMunicipioItem[]
  totalItems: number
  page: number
  perPage: number
  totalPages: number
  source: 'database' | 'fallback'
}

export interface RadarEstatisticasNacionais {
  totalMunicipios: number
  totalUfs: number
  totalAtosMunicipais: number
  municipiosPorUf: Record<string, number>
  atosPorUf: Record<string, number>
}

// 27 Unidades Federativas Oficiais do Brasil
export const UFS_BRASIL = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const

// Distribuição oficial IBGE de municípios por UF (5.570 no total nacional)
export const TOTAL_OFICIAL_MUNICIPIOS_POR_UF: Record<string, number> = {
  AC: 22,
  AL: 102,
  AM: 62,
  AP: 16,
  BA: 417,
  CE: 184,
  DF: 1,
  ES: 78,
  GO: 246,
  MA: 217,
  MG: 853,
  MS: 79,
  MT: 141,
  PA: 144,
  PB: 223,
  PE: 185,
  PI: 224,
  PR: 399,
  RJ: 92,
  RN: 167,
  RO: 52,
  RR: 15,
  RS: 497,
  SC: 295,
  SE: 75,
  SP: 645,
  TO: 139,
}

export const TOTAL_OFICIAL_MUNICIPIOS_BRASIL = 5570
export const TOTAL_OFICIAL_UFS_BRASIL = 27

/**
 * Busca estatísticas agregadas do Radar Nacional.
 */
export async function fetchRadarEstatisticas(): Promise<RadarEstatisticasNacionais> {
  const atosPorUf: Record<string, number> = {}
  let totalAtos = 0

  try {
    const atosRes = await pb.collection('radar_atos').getFullList({
      sort: 'uf',
      requestKey: null,
    })

    if (atosRes.length > 0) {
      totalAtos = atosRes.length
      for (const a of atosRes) {
        const u = (a.uf || '').toUpperCase().trim()
        if (u) {
          atosPorUf[u] = (atosPorUf[u] || 0) + 1
        }
      }
    } else {
      // Fallback em radarMunicipios.ts
      for (const a of ATOS_NORMATIVOS_MUNICIPAIS) {
        atosPorUf[a.uf] = (atosPorUf[a.uf] || 0) + 1
      }
      totalAtos = ATOS_NORMATIVOS_MUNICIPAIS.length
    }
  } catch (err) {
    console.warn('[fetchRadarEstatisticas] Fallback atos:', err)
    for (const a of ATOS_NORMATIVOS_MUNICIPAIS) {
      atosPorUf[a.uf] = (atosPorUf[a.uf] || 0) + 1
    }
    totalAtos = ATOS_NORMATIVOS_MUNICIPAIS.length
  }

  return {
    totalMunicipios: TOTAL_OFICIAL_MUNICIPIOS_BRASIL,
    totalUfs: TOTAL_OFICIAL_UFS_BRASIL,
    totalAtosMunicipais: totalAtos,
    municipiosPorUf: TOTAL_OFICIAL_MUNICIPIOS_POR_UF,
    atosPorUf,
  }
}

/**
 * Busca todos os atos da coleção `radar_atos` (ou fallback) mapeados por codigo_ibge.
 */
export async function fetchAtosMunicipaisPorCodigo(): Promise<{
  porIbge: Record<string, RadarAtoItem[]>
  porUf: Record<string, RadarAtoItem[]>
  todos: RadarAtoItem[]
}> {
  const porIbge: Record<string, RadarAtoItem[]> = {}
  const porUf: Record<string, RadarAtoItem[]> = {}
  const todos: RadarAtoItem[] = []

  try {
    const list = await pb.collection('radar_atos').getFullList({
      sort: '-created',
      requestKey: null,
    })

    if (list.length > 0) {
      for (const r of list) {
        const ato: RadarAtoItem = {
          id: r.id,
          uf: (r.uf || '').toUpperCase(),
          codigo_ibge: r.codigo_ibge || undefined,
          municipio_nome: r.municipio_nome || undefined,
          titulo: r.titulo,
          url: r.url || undefined,
          assoc: r.assoc || undefined,
          nivel: 'municipal',
        }
        todos.push(ato)
        if (ato.codigo_ibge) {
          if (!porIbge[ato.codigo_ibge]) porIbge[ato.codigo_ibge] = []
          porIbge[ato.codigo_ibge].push(ato)
        }
        if (ato.uf) {
          if (!porUf[ato.uf]) porUf[ato.uf] = []
          porUf[ato.uf].push(ato)
        }
      }
      return { porIbge, porUf, todos }
    }
  } catch (err) {
    console.warn('[fetchAtosMunicipaisPorCodigo] Usando fallback estático:', err)
  }

  // Fallback nos ATOS_NORMATIVOS_MUNICIPAIS
  for (const a of ATOS_NORMATIVOS_MUNICIPAIS) {
    const ato: RadarAtoItem = {
      id: a.id,
      uf: a.uf,
      codigo_ibge: a.codigoIbge,
      municipio_nome: a.municipioNome,
      titulo: a.titulo,
      url: a.urlDiario,
      assoc: a.diarioOficial,
      data: a.data,
      resumo: a.resumo,
      nivel: 'municipal',
    }
    todos.push(ato)
    if (ato.codigo_ibge) {
      if (!porIbge[ato.codigo_ibge]) porIbge[ato.codigo_ibge] = []
      porIbge[ato.codigo_ibge].push(ato)
    }
    if (ato.uf) {
      if (!porUf[ato.uf]) porUf[ato.uf] = []
      porUf[ato.uf].push(ato)
    }
  }

  return { porIbge, porUf, todos }
}

/**
 * Busca municípios da coleção `radar_municipios` com busca e paginação server-side.
 * Se offline ou falha, utiliza o catálogo de fallback com paginação em memória.
 */
export async function fetchMunicipiosPaginados(
  params: FetchMunicipiosParams = {},
): Promise<FetchMunicipiosResult> {
  const { uf, termo, page = 1, perPage = 30 } = params

  try {
    const filterParts: string[] = []

    if (uf && uf.trim()) {
      filterParts.push(`uf = "${uf.trim().toUpperCase()}"`)
    }

    if (termo && termo.trim()) {
      const sanitized = termo.trim().replace(/"/g, '\\"')
      filterParts.push(`(nome ~ "${sanitized}" || codigo_ibge ~ "${sanitized}")`)
    }

    const res = await pb.collection('radar_municipios').getList(page, perPage, {
      filter: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
      sort: 'nome',
      requestKey: null,
    })

    const items: RadarMunicipioItem[] = res.items.map((r) => ({
      id: r.id,
      codigo_ibge: r.codigo_ibge,
      nome: r.nome,
      uf: (r.uf || '').toUpperCase(),
    }))

    return {
      items,
      totalItems: res.totalItems,
      page: res.page,
      perPage: res.perPage,
      totalPages: res.totalPages,
      source: 'database',
    }
  } catch (err) {
    console.warn('[fetchMunicipiosPaginados] Usando fallback offline:', err)

    let all: MunicipioIBGE[] = []
    if (uf && uf.trim()) {
      all = MUNICIPIOS_IBGE_POR_UF[uf.trim().toUpperCase()] || []
    } else {
      for (const list of Object.values(MUNICIPIOS_IBGE_POR_UF)) {
        all.push(...list)
      }
    }

    if (termo && termo.trim()) {
      const q = termo
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      all = all.filter((m) => {
        const nomeNorm = m.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        return nomeNorm.includes(q) || m.codigo.includes(termo.trim())
      })
    }

    all.sort((a, b) => a.nome.localeCompare(b.nome))

    const totalItems = all.length
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const offset = (page - 1) * perPage
    const paged = all.slice(offset, offset + perPage)

    return {
      items: paged.map((m) => ({
        id: `fb-${m.codigo}`,
        codigo_ibge: m.codigo,
        nome: m.nome,
        uf: m.uf,
      })),
      totalItems,
      page,
      perPage,
      totalPages,
      source: 'fallback',
    }
  }
}
