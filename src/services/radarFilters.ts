import type { RadarAtoItem, RadarMunicipioItem } from './radarMunicipios'

export type NivelAtoRadar = 'federal' | 'estadual' | 'municipal'

export interface OpcaoNivelRadar {
  id: NivelAtoRadar
  label: string
  sigla: string
  descricao: string
}

export const OPCOES_NIVEIS_RADAR: OpcaoNivelRadar[] = [
  {
    id: 'federal',
    label: 'Federal (DOU, CGIBS, RFB)',
    sigla: 'FED',
    descricao: 'Atos normativos e publicações do Diário Oficial da União',
  },
  {
    id: 'estadual',
    label: 'Estadual (Diários Oficiais dos Estados / Sefaz)',
    sigla: 'EST',
    descricao: 'Decretos, portarias e atos publicados nos diários estaduais',
  },
  {
    id: 'municipal',
    label: 'Municipal (SIGPub, Diários Municipais e Prefeituras)',
    sigla: 'MUN',
    descricao: 'Atos municipais regulatórios do IBS, ISS e NFS-e local',
  },
]

export interface FiltrosRadarState {
  termo?: string
  uf?: string
  municipio?: RadarMunicipioItem | null
  niveis: NivelAtoRadar[]
}

export const FILTROS_RADAR_INICIAIS: FiltrosRadarState = {
  termo: '',
  uf: '',
  municipio: null,
  niveis: [],
}

function normalizarTexto(str?: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Função pura que aplica a combinação facetada de filtros sobre a lista de atos normativos do Radar Nacional.
 */
export function filtrarAtosRadar(atos: RadarAtoItem[], filtros: FiltrosRadarState): RadarAtoItem[] {
  const termoNorm = normalizarTexto(filtros.termo)
  const ufFiltro = filtros.uf ? filtros.uf.toUpperCase().trim() : ''
  const ibgeFiltro = filtros.municipio?.codigo_ibge

  return atos.filter((ato) => {
    // 1. Nível federativo (OR entre níveis selecionados, se algum foi marcado)
    if (filtros.niveis && filtros.niveis.length > 0) {
      const nivelAto = (ato.nivel || 'municipal').toLowerCase() as NivelAtoRadar
      if (!filtros.niveis.includes(nivelAto)) {
        return false
      }
    }

    // 2. Unidade Federativa (UF)
    if (ufFiltro) {
      const ufAto = (ato.uf || '').toUpperCase().trim()
      if (ufAto !== ufFiltro) {
        return false
      }
    }

    // 3. Município específico por código IBGE de 7 dígitos
    if (ibgeFiltro) {
      if (ato.codigo_ibge !== ibgeFiltro) {
        return false
      }
    }

    // 4. Busca textual livre em título, município, código IBGE ou resumo
    if (termoNorm) {
      const searchSpace = normalizarTexto(
        `${ato.titulo || ''} ${ato.municipio_nome || ''} ${ato.codigo_ibge || ''} ${ato.resumo || ''} ${ato.assoc || ''}`,
      )
      if (!searchSpace.includes(termoNorm)) {
        return false
      }
    }

    return true
  })
}

/**
 * Conta os filtros ativos para exibição em badges e no botão do painel.
 */
export function contarFiltrosRadarAtivos(filtros: FiltrosRadarState): number {
  return (
    (filtros.termo && filtros.termo.trim().length > 0 ? 1 : 0) +
    (filtros.uf ? 1 : 0) +
    (filtros.municipio ? 1 : 0) +
    filtros.niveis.length
  )
}

/**
 * Filtra e recomputa a lista de municípios de uma UF com base nos filtros ativos de nível e atos vinculados.
 * Com o nível 'municipal' ativo, o grupo da UF passa a exibir apenas os municípios que possuem atos
 * vinculados correspondentes, com a contagem atualizada refletindo o recorte.
 * Se o filtro de nível for limpo (ou nenhum nível ativo), retorna todos os municípios carregados.
 */
export function filtrarMunicipiosPorRecorte(
  municipios: RadarMunicipioItem[],
  atosDaUf: RadarAtoItem[],
  filtros: FiltrosRadarState,
): RadarMunicipioItem[] {
  const niveisAtivos = filtros.niveis || []
  const soMunicipal = niveisAtivos.includes('municipal')
  const soEstadualOuFederal = niveisAtivos.length > 0 && !soMunicipal

  // Indexa atos por código IBGE respeitando os filtros (incluindo nível e busca)
  const atosFiltrados = filtrarAtosRadar(atosDaUf, filtros)
  const contagemPorIbge: Record<string, number> = {}
  for (const ato of atosFiltrados) {
    if (ato.codigo_ibge) {
      contagemPorIbge[ato.codigo_ibge] = (contagemPorIbge[ato.codigo_ibge] || 0) + 1
    }
  }

  // Se nível 'municipal' estiver ativo: mostra APENAS municípios com atos municipais vinculados
  if (soMunicipal) {
    return municipios
      .filter((m) => (contagemPorIbge[m.codigo_ibge] || 0) > 0)
      .map((m) => ({
        ...m,
        atosCount: contagemPorIbge[m.codigo_ibge] || 0,
      }))
  }

  // Se outro nível (ex: apenas estadual ou federal) estiver ativo sem municipal:
  // no âmbito municipal não há atos desse nível, então os municípios ficam com atosCount 0
  if (soEstadualOuFederal) {
    return municipios.map((m) => ({
      ...m,
      atosCount: 0,
    }))
  }

  // Sem filtro de nível (ou níveis mistos que não forçam o isolamento municipal):
  // mantém a lista completa de municípios, com a contagem refletindo os atos compatíveis
  return municipios.map((m) => {
    // Se não há filtro de nível nem termo, usa a contagem total de atos do município
    const count =
      niveisAtivos.length === 0 && !filtros.termo
        ? (m.atosCount ?? contagemPorIbge[m.codigo_ibge] ?? 0)
        : contagemPorIbge[m.codigo_ibge] || 0
    return {
      ...m,
      atosCount: count,
    }
  })
}
