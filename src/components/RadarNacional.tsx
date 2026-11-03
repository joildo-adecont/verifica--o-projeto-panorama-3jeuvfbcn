import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Search,
  X,
  MapPin,
  Building2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  FileText,
  Globe2,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Scale,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react'
import {
  UFS_BRASIL,
  TOTAL_OFICIAL_MUNICIPIOS_POR_UF,
  TOTAL_OFICIAL_MUNICIPIOS_BRASIL,
  TOTAL_OFICIAL_UFS_BRASIL,
  fetchRadarEstatisticas,
  fetchAtosMunicipaisPorCodigo,
  fetchMunicipiosPaginados,
  type RadarMunicipioItem,
  type RadarAtoItem,
  type RadarEstatisticasNacionais,
} from '@/services/radarMunicipios'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  OPCOES_NIVEIS_RADAR,
  filtrarAtosRadar,
  contarFiltrosRadarAtivos,
  filtrarMunicipiosPorRecorte,
  extrairAtosMunicipaisNaoIdentificados,
  type NivelAtoRadar,
  type FiltrosRadarState,
} from '@/services/radarFilters'

const NAVY = 'bg-panorama-navy'

export const NOMES_UFS: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
}

export interface RadarNacionalProps {
  initialUf?: string
}

interface UfDataState {
  items: RadarMunicipioItem[]
  page: number
  totalPages: number
  totalItems: number
  loading: boolean
}

export function RadarNacional({ initialUf = '' }: RadarNacionalProps) {
  // Filtros combinados com painel facetado institucional ADECONT
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(true)
  const [selectedUf, setSelectedUf] = useState<string>(initialUf)
  const [selectedMunicipio, setSelectedMunicipio] = useState<RadarMunicipioItem | null>(null)
  const [niveisSelecionados, setNiveisSelecionados] = useState<NivelAtoRadar[]>([])
  const [nivel, setNivel] = useState<'todos' | 'municipal' | 'estadual' | 'federal'>('todos')
  const [termoBusca, setTermoBusca] = useState<string>('')
  const [debouncedTermo, setDebouncedTermo] = useState<string>('')

  // Atalho 1: Busca rápida por Estado (Nome completo ou Sigla ex: 'MG' ou 'Minas Gerais')
  const [buscaEstado, setBuscaEstado] = useState<string>('')

  // Atalho 2: Busca rápida por Município (Nome ou Código IBGE)
  const [buscaMunicipio, setBuscaMunicipio] = useState<string>('')
  const [sugestoesMunicipios, setSugestoesMunicipios] = useState<RadarMunicipioItem[]>([])
  const [buscandoSugestoes, setBuscandoSugestoes] = useState<boolean>(false)

  // Estado de expansão das UFs (accordion sob demanda)
  const [expandedUfs, setExpandedUfs] = useState<Record<string, boolean>>(() => {
    if (initialUf) return { [initialUf]: true }
    return {}
  })

  // Cache e paginação lazy de municípios por UF { [UF]: UfDataState }
  const [ufData, setUfData] = useState<Record<string, UfDataState>>({})

  // Referência para scroll até o grupo da UF
  const ufRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Estatísticas e atos normativos carregados
  const [stats, setStats] = useState<RadarEstatisticasNacionais>({
    totalMunicipios: TOTAL_OFICIAL_MUNICIPIOS_BRASIL,
    totalUfs: TOTAL_OFICIAL_UFS_BRASIL,
    totalAtosMunicipais: 0,
    municipiosPorUf: TOTAL_OFICIAL_MUNICIPIOS_POR_UF,
    atosPorUf: {},
  })

  const [atosMap, setAtosMap] = useState<{
    porIbge: Record<string, RadarAtoItem[]>
    porUf: Record<string, RadarAtoItem[]>
    todos: RadarAtoItem[]
  }>({
    porIbge: {},
    porUf: {},
    todos: [],
  })

  // Debounce do termo geral de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTermo(termoBusca)
    }, 250)
    return () => clearTimeout(timer)
  }, [termoBusca])

  // Carga inicial de estatísticas e atos normativos
  useEffect(() => {
    fetchRadarEstatisticas().then((res) => setStats(res))
    fetchAtosMunicipaisPorCodigo().then((res) => setAtosMap(res))
  }, [])

  // Sincroniza estado inicial se prop mudar
  useEffect(() => {
    if (initialUf) {
      setSelectedUf(initialUf)
      setExpandedUfs((prev) => ({ ...prev, [initialUf]: true }))
    }
  }, [initialUf])

  // Função lazy para carregar municípios de uma UF específica sob demanda
  const carregarMunicipiosDaUf = useCallback(
    async (ufCode: string, pagina: number = 1, termoLocal?: string) => {
      setUfData((prev) => ({
        ...prev,
        [ufCode]: {
          items: prev[ufCode]?.items || [],
          page: pagina,
          totalPages: prev[ufCode]?.totalPages || 1,
          totalItems: prev[ufCode]?.totalItems || TOTAL_OFICIAL_MUNICIPIOS_POR_UF[ufCode] || 0,
          loading: true,
        },
      }))

      try {
        const res = await fetchMunicipiosPaginados({
          uf: ufCode,
          termo: termoLocal || debouncedTermo || undefined,
          page: pagina,
          perPage: 24,
        })

        // Injeta contagem de atos vinculados em cada município
        const itemsComAtos = res.items.map((m) => {
          const atos = atosMap.porIbge[m.codigo_ibge] || []
          return {
            ...m,
            atosCount: atos.length,
          }
        })

        setUfData((prev) => ({
          ...prev,
          [ufCode]: {
            items: itemsComAtos,
            page: res.page,
            totalPages: res.totalPages,
            totalItems: res.totalItems,
            loading: false,
          },
        }))
      } catch (err) {
        console.error(`Erro ao carregar municípios da UF ${ufCode}:`, err)
        setUfData((prev) => ({
          ...prev,
          [ufCode]: {
            items: prev[ufCode]?.items || [],
            page: pagina,
            totalPages: prev[ufCode]?.totalPages || 1,
            totalItems: prev[ufCode]?.totalItems || 0,
            loading: false,
          },
        }))
      }
    },
    [atosMap.porIbge, debouncedTermo],
  )

  // Ao expandir uma UF, se ainda não tiver dados ou se filtros mudarem, carrega lazy sob demanda
  const toggleExpandUf = useCallback(
    (ufCode: string) => {
      const proximoEstado = !expandedUfs[ufCode]
      setExpandedUfs((prev) => ({
        ...prev,
        [ufCode]: proximoEstado,
      }))

      if (proximoEstado && (!ufData[ufCode] || ufData[ufCode].items.length === 0)) {
        carregarMunicipiosDaUf(ufCode, 1)
      }
    },
    [expandedUfs, ufData, carregarMunicipiosDaUf],
  )

  // Recarrega UFs expandidas quando o termo geral, mapa de atos ou filtros mudam
  useEffect(() => {
    Object.keys(expandedUfs).forEach((ufCode) => {
      if (expandedUfs[ufCode]) {
        // Carrega sob demanda se ainda não tiver itens
        if (!ufData[ufCode] || ufData[ufCode].items.length === 0) {
          carregarMunicipiosDaUf(ufCode, 1)
        }
      }
    })
  }, [debouncedTermo, atosMap.porIbge, expandedUfs, ufData, carregarMunicipiosDaUf])

  // Atalho 1: Saltar direto para a UF por sigla ou nome (ex.: 'MG' ou 'Minas Gerais')
  const saltarParaUf = useCallback(
    (ufCode: string) => {
      const ufNorm = ufCode.toUpperCase().trim()
      if (!UFS_BRASIL.includes(ufNorm as (typeof UFS_BRASIL)[number])) return

      // Expande a UF
      setExpandedUfs((prev) => ({ ...prev, [ufNorm]: true }))
      setSelectedUf(ufNorm)

      // Carrega sob demanda se ainda não carregou
      if (!ufData[ufNorm] || ufData[ufNorm].items.length === 0) {
        carregarMunicipiosDaUf(ufNorm, 1)
      }

      // Rola suavemente até o elemento da UF
      setTimeout(() => {
        const el = ufRefs.current[ufNorm]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    },
    [ufData, carregarMunicipiosDaUf],
  )

  // Manipulador da busca por estado (reconhece sigla de 2 letras ou correspondência de nome)
  const handleBuscaEstadoSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const q = buscaEstado.trim().toLowerCase()
    if (!q) return

    // Busca exata por sigla
    const siglaExata = q.toUpperCase()
    if (UFS_BRASIL.includes(siglaExata as (typeof UFS_BRASIL)[number])) {
      saltarParaUf(siglaExata)
      return
    }

    // Busca por nome do estado
    const ufEncontrada = UFS_BRASIL.find((uf) => {
      const nome = NOMES_UFS[uf]?.toLowerCase() || ''
      return (
        nome.includes(q) ||
        nome
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(q.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      )
    })

    if (ufEncontrada) {
      saltarParaUf(ufEncontrada)
    }
  }

  // Atalho 2: Busca rápida de municípios por nome ou código IBGE com debounce para sugestões
  useEffect(() => {
    const q = buscaMunicipio.trim()
    if (q.length < 2) {
      setSugestoesMunicipios([])
      return
    }

    const timer = setTimeout(async () => {
      setBuscandoSugestoes(true)
      try {
        const res = await fetchMunicipiosPaginados({
          termo: q,
          page: 1,
          perPage: 8,
        })
        const comAtos = res.items.map((m) => ({
          ...m,
          atosCount: (atosMap.porIbge[m.codigo_ibge] || []).length,
        }))
        setSugestoesMunicipios(comAtos)
      } catch (err) {
        console.error('Erro na busca de sugestões de municípios:', err)
      } finally {
        setBuscandoSugestoes(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [buscaMunicipio, atosMap.porIbge])

  // Ao selecionar um município da sugestão rápida
  const handleSelecionarSugestaoMunicipio = (m: RadarMunicipioItem) => {
    setSelectedMunicipio(m)
    setBuscaMunicipio('')
    setSugestoesMunicipios([])

    if (m.uf) {
      setSelectedUf(m.uf)
      saltarParaUf(m.uf)
    }
  }

  // Alterna seleção de município individual
  const handleToggleSelectMunicipio = (m: RadarMunicipioItem) => {
    if (selectedMunicipio?.codigo_ibge === m.codigo_ibge) {
      setSelectedMunicipio(null)
    } else {
      setSelectedMunicipio(m)
      if (m.uf && selectedUf !== m.uf) {
        setSelectedUf(m.uf)
      }
    }
  }

  // Alterna nível federativo no painel facetado
  const toggleNivel = (nId: NivelAtoRadar) => {
    setNiveisSelecionados((prev) => {
      const exists = prev.includes(nId)
      const novo = exists ? prev.filter((x) => x !== nId) : [...prev, nId]
      if (novo.length === 1) {
        setNivel(novo[0])
      } else {
        setNivel('todos')
      }
      return novo
    })
  }

  // Seletor rápido de nível
  const handleSelectNivelRapido = (optId: 'todos' | 'municipal' | 'estadual' | 'federal') => {
    setNivel(optId)
    if (optId === 'todos') {
      setNiveisSelecionados([])
    } else {
      setNiveisSelecionados([optId])
    }
  }

  // Estado consolidado de filtros para o serviço puro radarFilters.ts
  const filtrosState: FiltrosRadarState = useMemo(() => {
    return {
      termo: debouncedTermo,
      uf: selectedUf,
      municipio: selectedMunicipio,
      niveis: niveisSelecionados,
    }
  }, [debouncedTermo, selectedUf, selectedMunicipio, niveisSelecionados])

  const totalAtivos = useMemo(() => contarFiltrosRadarAtivos(filtrosState), [filtrosState])

  // Limpar todos os filtros com um clique
  const handleLimparFiltros = () => {
    setSelectedUf('')
    setSelectedMunicipio(null)
    setNivel('todos')
    setNiveisSelecionados([])
    setTermoBusca('')
    setDebouncedTermo('')
    setBuscaEstado('')
    setBuscaMunicipio('')
    setSugestoesMunicipios([])
  }

  // Obtém lista de municípios filtrados por nível e contexto para uma dada UF
  const getMunicipiosVisiveisUf = useCallback(
    (ufCode: string, itemsOriginais: RadarMunicipioItem[]): RadarMunicipioItem[] => {
      const atosDaUf = atosMap.porUf[ufCode] || []
      return filtrarMunicipiosPorRecorte(itemsOriginais, atosDaUf, filtrosState)
    },
    [atosMap.porUf, filtrosState],
  )

  // Lista consolidada de atos filtrados via serviço puro radarFilters.ts
  const atosFiltrados = useMemo(() => {
    return filtrarAtosRadar(atosMap.todos, filtrosState)
  }, [atosMap.todos, filtrosState])

  // Atos de município não identificado da UF ativa
  const atosNaoIdentificadosUf = useMemo(() => {
    if (!selectedUf) return []
    const atosDaUf = atosMap.porUf[selectedUf] || []
    return extrairAtosMunicipaisNaoIdentificados(atosDaUf, filtrosState)
  }, [selectedUf, atosMap.porUf, filtrosState])

  // Mapa de contagem de atos de município não identificado por UF respeitando filtros
  const atosNaoIdentificadosPorUf = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const uf of UFS_BRASIL) {
      const atosDaUf = atosMap.porUf[uf] || []
      const naoIdent = extrairAtosMunicipaisNaoIdentificados(atosDaUf, filtrosState)
      if (naoIdent.length > 0) {
        mapa[uf] = naoIdent.length
      }
    }
    return mapa
  }, [atosMap.porUf, filtrosState])

  // Contagem de atos por UF respeitando o recorte de filtros ativo
  const atosContagemPorUfFiltrada = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const a of atosFiltrados) {
      const u = (a.uf || '').toUpperCase().trim()
      if (u) {
        mapa[u] = (mapa[u] || 0) + 1
      }
    }
    return mapa
  }, [atosFiltrados])

  const filtroNivelAtivo = useMemo(() => {
    return niveisSelecionados.length > 0
  }, [niveisSelecionados])

  // Helper para contagem de atos da UF considerando filtros
  const totalAtosAtivosFiltrados = useCallback(
    (
      ufCode: string,
      atosOriginais: number,
      contagemFiltrada: Record<string, number>,
      ativos: number,
    ): number => {
      if (ativos > 0) {
        return contagemFiltrada[ufCode] || 0
      }
      return atosOriginais
    },
    [],
  )

  // Lista de UFs a renderizar (se filtro de UF estiver ativo, isola apenas a UF correspondente)
  const ufsVisiveis = useMemo(() => {
    if (selectedUf) {
      return UFS_BRASIL.filter((u) => u === selectedUf)
    }
    return UFS_BRASIL
  }, [selectedUf])

  return (
    <div className="space-y-4">
      {/* 1. PAINEL DE ESTATÍSTICAS NACIONAIS (5.570 municípios, 27 UFs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-xs bg-white">
          <div className={NAVY + ' px-3 py-2'}>
            <p className="text-xl font-bold text-white tabular-nums leading-none">
              {stats.totalMunicipios.toLocaleString('pt-BR')}
            </p>
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/90 mt-0.5">
              Municípios oficiais IBGE
            </p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[9px] text-slate-600">
            <span>27 Unidades Federativas</span>
            <span className="font-semibold text-emerald-700">100% Censo IBGE</span>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-xs bg-white">
          <div className={NAVY + ' px-3 py-2'}>
            <p className="text-xl font-bold text-white tabular-nums leading-none">
              {stats.totalUfs}
            </p>
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/90 mt-0.5">
              Estados &amp; Distrito Federal
            </p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[9px] text-slate-600">
            <span>Grupos expansíveis por UF</span>
            <span className="font-semibold text-blue-700">Brasil integral</span>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-xs bg-white">
          <div className={NAVY + ' px-3 py-2'}>
            <p className="text-xl font-bold text-white tabular-nums leading-none">
              {stats.totalAtosMunicipais}
            </p>
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/90 mt-0.5">
              Atos normativos vinculados
            </p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[9px] text-slate-600">
            <span>Com código IBGE de 7 dígitos</span>
            <span className="font-semibold text-amber-700">Monitorados</span>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden ring-1 ring-panorama-gold/40 shadow-xs bg-white">
          <div className={NAVY + ' px-3 py-2'}>
            <p className="text-xl font-bold text-white tabular-nums leading-none">
              {ufsVisiveis.length}
            </p>
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/90 mt-0.5">
              {selectedUf ? `UF Ativa: ${selectedUf}` : 'UFs em Exibição'}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[9px] text-slate-600">
            <span>Navegação agrupada</span>
            <span className="font-semibold text-slate-700">Lazy load sob demanda</span>
          </div>
        </div>
      </div>

      {/* 2. ATALHOS RÁPIDOS DE BUSCA (ESTADO E MUNICÍPIO) */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-2xs">
        {/* Atalho A: Busca por Estado (Nome ou Sigla) que salta direto ao grupo */}
        <form onSubmit={handleBuscaEstadoSubmit} className="space-y-1">
          <label
            htmlFor="busca-estado-input"
            className="text-[11px] font-bold text-slate-700 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-indigo-700" />
              <span>Atalho de Busca por Estado (UF):</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Nome ou sigla (ex.: &ldquo;MG&rdquo; ou &ldquo;Minas Gerais&rdquo;)
            </span>
          </label>
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              id="busca-estado-input"
              type="text"
              value={buscaEstado}
              onChange={(e) => setBuscaEstado(e.target.value)}
              placeholder="Digite a sigla ou nome do estado (ex.: MG, SP, Bahia)..."
              className="w-full text-xs pl-8 pr-16 py-1.5 rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
            {buscaEstado ? (
              <button
                type="button"
                onClick={() => setBuscaEstado('')}
                className="absolute right-12 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title="Limpar busca de estado"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
            <button
              type="submit"
              className="absolute right-1 px-2 py-0.5 rounded-md bg-indigo-700 hover:bg-indigo-800 text-white text-[10.5px] font-bold cursor-pointer transition-colors"
            >
              Ir
            </button>
          </div>
        </form>

        {/* Atalho B: Busca por Município (Nome ou Código IBGE) com badge de estado */}
        <div className="space-y-1 relative">
          <label
            htmlFor="busca-municipio-input"
            className="text-[11px] font-bold text-slate-700 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Atalho de Busca por Município:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              Nome ou código IBGE de 7 dígitos
            </span>
          </label>
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              id="busca-municipio-input"
              type="text"
              value={buscaMunicipio}
              onChange={(e) => setBuscaMunicipio(e.target.value)}
              placeholder="Digite o nome ou código IBGE (ex.: Uberlândia, 3170206)..."
              className="w-full text-xs pl-8 pr-8 py-1.5 rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
            />
            {buscaMunicipio && (
              <button
                type="button"
                onClick={() => {
                  setBuscaMunicipio('')
                  setSugestoesMunicipios([])
                }}
                className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title="Limpar busca de município"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            {buscandoSugestoes && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 absolute right-8" />
            )}
          </div>

          {/* Dropdown de sugestões indicando claramente a qual UF cada resultado pertence */}
          {sugestoesMunicipios.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-lg border border-slate-300 shadow-lg overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
              <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase flex items-center justify-between">
                <span>Resultados ({sugestoesMunicipios.length})</span>
                <span>Clique para saltar ao grupo da UF</span>
              </div>
              {sugestoesMunicipios.map((item) => (
                <button
                  key={item.codigo_ibge}
                  type="button"
                  onClick={() => handleSelecionarSugestaoMunicipio(item)}
                  className="w-full px-3 py-2 text-left hover:bg-amber-50 flex items-center justify-between gap-2 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-900 truncate">{item.nome}</span>
                    <span className="font-mono text-[10.5px] text-slate-500">
                      IBGE: {item.codigo_ibge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Badge destacado da UF */}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-100 text-indigo-900 border border-indigo-200">
                      UF: {item.uf}
                    </span>
                    {(item.atosCount || 0) > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.atosCount} ato{item.atosCount === 1 ? '' : 's'}
                      </span>
                    )}
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. PAINEL DE FILTROS FACETADOS PADRÃO INSTITUCIONAL ADECONT */}
      <div className="space-y-3">
        {/* Barra de Ações: Botão Expandir/Recolher + Limpar + Seletor rápido + Campo de Busca Geral */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPainelFiltrosAberto((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                totalAtivos > 0
                  ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Expandir/recolher painel de filtros facetados do Radar Nacional"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-panorama-gold" />
              <span>Filtros do Radar</span>
              {totalAtivos > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-panorama-gold text-panorama-navy">
                  {totalAtivos}
                </span>
              )}
            </button>

            {totalAtivos > 0 && (
              <button
                type="button"
                onClick={handleLimparFiltros}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                title="Limpar todos os filtros selecionados"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar todos os filtros ({totalAtivos})</span>
              </button>
            )}

            {/* Seletor rápido por Nível */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Nível:</span>
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'federal', label: 'Federal' },
                  { id: 'estadual', label: 'Estadual' },
                  { id: 'municipal', label: 'Municipal' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectNivelRapido(opt.id)}
                  className={`text-[10px] font-bold py-1 px-2 rounded-md transition-all cursor-pointer ${
                    nivel === opt.id
                      ? 'bg-panorama-navy text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Busca textual livre combinável */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Filtrar por texto, termo ou diário..."
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-panorama-navy focus:ring-1 focus:ring-panorama-navy"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* PAINEL COMPLETO DE FILTROS FACETADOS (ESTILO INSTITUCIONAL ADECONT) */}
        {painelFiltrosAberto && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/20 border-2 border-slate-200 space-y-4 animate-in fade-in duration-200 shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-panorama-navy" />
                Painel de Filtros Facetados do Radar Nacional
              </span>
              <span className="text-[11px] text-slate-500">
                {totalAtivos > 0
                  ? `${totalAtivos} dimensão(ões) ativa(s)`
                  : 'Nenhum filtro aplicado'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Nível do Ato Normativo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    1. Nível do Ato
                  </span>
                  {niveisSelecionados.length > 0 && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 rounded">
                      {niveisSelecionados.length}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {OPCOES_NIVEIS_RADAR.map((opt) => {
                    const ativo = niveisSelecionados.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleNivel(opt.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                          ativo
                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={opt.descricao}
                      >
                        <span className="truncate">{opt.label}</span>
                        {ativo ? (
                          <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 ml-1" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Unidade Federativa (UF) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                    2. Unidade Federativa (UF)
                  </span>
                  {selectedUf && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 rounded">
                      {selectedUf}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  Filtrar por UF isola o grupo correspondente e oculta os demais:
                </p>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUf('')
                      setSelectedMunicipio(null)
                    }}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold border cursor-pointer ${
                      !selectedUf
                        ? 'bg-panorama-navy text-white border-panorama-navy'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Todas (27)
                  </button>
                  {UFS_BRASIL.map((ufCode) => {
                    const isSel = selectedUf === ufCode
                    return (
                      <button
                        key={`filtro-uf-${ufCode}`}
                        type="button"
                        onClick={() => {
                          if (isSel) {
                            setSelectedUf('')
                          } else {
                            saltarParaUf(ufCode)
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                          isSel
                            ? 'bg-indigo-100 text-indigo-950 border-indigo-400 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                        title={`${ufCode} - ${NOMES_UFS[ufCode]}`}
                      >
                        {ufCode}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 3. Município Ativo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    3. Município Selecionado
                  </span>
                  {selectedMunicipio && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 rounded">
                      1 ativo
                    </span>
                  )}
                </div>
                {selectedMunicipio ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">
                        {selectedMunicipio.nome} ({selectedMunicipio.uf})
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMunicipio(null)}
                        className="text-amber-800 hover:text-rose-600 p-0.5 cursor-pointer font-bold"
                        title="Remover seleção de município"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-slate-600">
                      Código IBGE: <strong>{selectedMunicipio.codigo_ibge}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                    Nenhum município isolado. Clique em qualquer município dentro dos grupos de UF
                    abaixo ou use o atalho de busca acima.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHIPS DE FILTROS ATIVOS REMOVÍVEIS */}
        {totalAtivos > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Filtros ativos:</span>

            {debouncedTermo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold">
                <span>Busca: &ldquo;{debouncedTermo}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setTermoBusca('')
                    setDebouncedTermo('')
                  }}
                  className="hover:text-rose-600 cursor-pointer"
                  title="Remover filtro de termo"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedUf && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-semibold">
                <span>
                  UF: {selectedUf} ({NOMES_UFS[selectedUf]})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUf('')}
                  className="hover:text-indigo-950 cursor-pointer"
                  title="Remover filtro de estado"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedMunicipio && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold">
                <MapPin className="w-3 h-3 text-amber-700" />
                <span>
                  {selectedMunicipio.nome} ({selectedMunicipio.uf}) - IBGE{' '}
                  {selectedMunicipio.codigo_ibge}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMunicipio(null)}
                  className="hover:text-amber-950 cursor-pointer"
                  title="Remover filtro de município"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {niveisSelecionados.map((nId) => (
              <span
                key={`chip-nivel-${nId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-semibold"
              >
                <span>Nível: {nId.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => toggleNivel(nId)}
                  className="hover:text-blue-950 cursor-pointer"
                  title="Remover filtro de nível"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={handleLimparFiltros}
              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* 4. GRUPOS DE MUNICÍPIOS POR ESTADO (UF) — EXPANSÍVEIS COM LAZY LOAD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-panorama-navy" />
            <h3 className="text-sm font-bold text-slate-900">
              Municípios Agrupados por Estado (UF) — 5.570 Censo IBGE
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {selectedUf ? `Mostrando grupo de ${selectedUf}` : '27 UFs expansíveis'} · Carregamento
            sob demanda
          </span>
        </div>

        <div className="space-y-2">
          {ufsVisiveis.map((ufCode) => {
            const nomeEstado = NOMES_UFS[ufCode] || ufCode
            const isExpanded = !!expandedUfs[ufCode]
            const isSelectedUf = selectedUf === ufCode
            const totalOficialUf = TOTAL_OFICIAL_MUNICIPIOS_POR_UF[ufCode] || 0
            // Se houver filtro ativo de nível ou termo, utiliza a contagem filtrada para a UF
            const totalAtosUf = totalAtosAtivosFiltrados(
              ufCode,
              stats.atosPorUf[ufCode] || 0,
              atosContagemPorUfFiltrada,
              totalAtivos,
            )
            const stateData = ufData[ufCode] || {
              items: [],
              page: 1,
              totalPages: 1,
              totalItems: totalOficialUf,
              loading: false,
            }
            // Municípios renderizados com recorte aplicado (respeita nível municipal / estadual / federal)
            const municipiosRenderizados = getMunicipiosVisiveisUf(ufCode, stateData.items)

            return (
              <div
                key={ufCode}
                ref={(el) => {
                  ufRefs.current[ufCode] = el
                }}
                className={`rounded-xl border transition-all duration-200 overflow-hidden bg-white shadow-xs ${
                  isSelectedUf
                    ? 'border-panorama-gold ring-2 ring-panorama-gold/40'
                    : isExpanded
                      ? 'border-slate-300'
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Cabeçalho da UF (Botão Acordeom) */}
                <button
                  type="button"
                  onClick={() => toggleExpandUf(ufCode)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                    isExpanded
                      ? 'bg-slate-50/90 border-b border-slate-200'
                      : 'hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                        isExpanded || isSelectedUf
                          ? 'bg-panorama-navy text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ufCode}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{nomeEstado}</h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({totalOficialUf} municípios IBGE)
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {totalAtosUf > 0
                          ? `${totalAtosUf} ato(s) normativo(s) localizado(s)`
                          : 'Nenhum ato direto registrado nesta UF'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {totalAtosUf > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {totalAtosUf} atos
                      </span>
                    )}

                    <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">
                      {isExpanded ? 'Recolher' : 'Expandir municípios'}
                    </span>

                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Conteúdo Expansível: Municípios daquela UF carregados sob demanda */}
                {isExpanded && (
                  <div className="p-3.5 bg-slate-50/40 space-y-3 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-slate-600">
                          Municípios oficiais de <strong>{nomeEstado}</strong> ({ufCode}) com código
                          IBGE de 7 dígitos e contador de atos vigentes:
                        </p>
                        {niveisSelecionados.includes('municipal') && (
                          <p className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                            <Filter className="w-3 h-3" />
                            <span>
                              Recorte por nível municipal ativo: exibindo apenas municípios com atos
                              municipais vinculados.
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        {stateData.loading ? (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Loader2 className="w-3 h-3 animate-spin text-panorama-navy" />
                            <span>Carregando do banco...</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">
                            Exibindo {municipiosRenderizados.length} de{' '}
                            {niveisSelecionados.includes('municipal')
                              ? `${municipiosRenderizados.length} com atos`
                              : `${stateData.totalItems} mun.`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Aviso honesto de atos de município não identificado dentro da UF */}
                    {atosNaoIdentificadosPorUf[ufCode] > 0 ? (
                      <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-relaxed text-amber-800">
                          <strong>
                            {atosNaoIdentificadosPorUf[ufCode]}
                            {atosNaoIdentificadosPorUf[ufCode] === 1
                              ? ' ato municipal'
                              : ' atos municipais'}
                          </strong>{' '}
                          de {nomeEstado} sem município identificado na coleta (ente_chave{' '}
                          {`"${String(ufCode)}-"`} /cnameihy rótulo &ldquo;município não
                          identificado&rdquo;). Eles permanecem contados no grupo da UF exibido
                          acima
                          {niveisSelecionados.includes('municipal')
                            ? ' e também aparecem no painel de atos vinculados no fim da página'
                            : ''}
                          . A busca por código IBGE específico não os retorna, pois não há como
                          atribuí-los a um município exato.
                        </p>
                      </div>
                    ) : null}

                    {stateData.loading && stateData.items.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin text-panorama-navy" />
                        <span className="text-xs">
                          Consultando municípios de {nomeEstado} no PocketBase...
                        </span>
                      </div>
                    ) : municipiosRenderizados.length === 0 ? (
                      <div className="p-5 text-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 text-xs space-y-2">
                        <p>
                          {niveisSelecionados.includes('municipal')
                            ? `Nenhum município de ${nomeEstado} possui atos municipais vinculados com os filtros atuais.`
                            : `Nenhum município encontrado em ${nomeEstado} com os filtros atuais.`}
                        </p>
                        {totalAtivos > 0 && (
                          <button
                            type="button"
                            onClick={handleLimparFiltros}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-panorama-navy hover:underline cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Limpar filtros e exibir todos os municípios</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {municipiosRenderizados.map((m) => {
                          const isMunSelected = selectedMunicipio?.codigo_ibge === m.codigo_ibge
                          const temAtos = (m.atosCount || 0) > 0

                          return (
                            <button
                              key={m.codigo_ibge}
                              type="button"
                              onClick={() => handleToggleSelectMunicipio(m)}
                              className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                                isMunSelected
                                  ? 'border-panorama-navy bg-panorama-navy text-white shadow-xs ring-2 ring-panorama-gold/70'
                                  : temAtos
                                    ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-slate-900'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                              }`}
                              title={`Código IBGE: ${m.codigo_ibge} · Clique para isolar atos`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <MapPin
                                    className={`w-3 h-3 shrink-0 ${
                                      isMunSelected
                                        ? 'text-panorama-gold'
                                        : temAtos
                                          ? 'text-emerald-700'
                                          : 'text-slate-400'
                                    }`}
                                  />
                                  <span className="text-[11px] font-bold truncate">{m.nome}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[9px]">
                                  <span
                                    className={`font-semibold ${
                                      isMunSelected ? 'text-slate-200' : 'text-slate-500'
                                    }`}
                                  >
                                    {m.uf}
                                  </span>
                                  <span
                                    className={`font-mono ${
                                      isMunSelected ? 'text-panorama-gold-light' : 'text-slate-400'
                                    }`}
                                  >
                                    IBGE: {m.codigo_ibge}
                                  </span>
                                </div>
                              </div>

                              {temAtos && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    isMunSelected
                                      ? 'bg-panorama-gold text-panorama-navy'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                  title={`${m.atosCount} ato(s) normativo(s) vinculado(s)`}
                                >
                                  {m.atosCount} ato{m.atosCount === 1 ? '' : 's'}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Paginação sob demanda dentro do grupo da UF */}
                    {stateData.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Página <strong>{stateData.page}</strong> de{' '}
                          <strong>{stateData.totalPages}</strong> ({stateData.totalItems} municípios
                          em {ufCode})
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={stateData.page <= 1 || stateData.loading}
                            onClick={() =>
                              carregarMunicipiosDaUf(ufCode, Math.max(1, stateData.page - 1))
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[10.5px] font-semibold"
                          >
                            ← Anterior
                          </button>
                          <button
                            type="button"
                            disabled={stateData.page >= stateData.totalPages || stateData.loading}
                            onClick={() =>
                              carregarMunicipiosDaUf(
                                ufCode,
                                Math.min(stateData.totalPages, stateData.page + 1),
                              )
                            }
                            className="px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[10.5px] font-semibold"
                          >
                            Próxima →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. PAINEL DE ATOS NORMATIVOS MUNICIPAIS VINCULADOS */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-panorama-gold" />
            <h3 className="text-xs font-bold text-white">
              Atos Normativos Municipais e Estaduais Vinculados
            </h3>
            <span className="text-[10px] text-panorama-gold-light/90">
              ({atosFiltrados.length} ato{atosFiltrados.length === 1 ? '' : 's'} localizado
              {atosFiltrados.length === 1 ? '' : 's'})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[9.5px]">
            {selectedUf && (
              <span className="font-bold bg-panorama-gold text-panorama-navy px-2 py-0.5 rounded">
                UF: {selectedUf}
              </span>
            )}
            {selectedMunicipio && (
              <span className="font-bold bg-white text-panorama-navy px-2 py-0.5 rounded border border-panorama-gold">
                {selectedMunicipio.nome} (IBGE: {selectedMunicipio.codigo_ibge})
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {atosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Nenhum ato normativo encontrado para os filtros selecionados
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Não localizamos matérias oficiais que correspondam à combinação de estado,
                  município e nível federativo escolhida.
                </p>
                {totalAtivos > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleLimparFiltros}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-panorama-gold" />
                      <span>Limpar todos os filtros ({totalAtivos})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            atosFiltrados.map((ato) => {
              const semIbge = !ato.codigo_ibge || ato.codigo_ibge.trim() === ''
              return (
                <div
                  key={ato.id}
                  className={`p-3 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 ${
                    semIbge ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                        Nível {ato.nivel || 'Municipal'}
                      </span>
                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        UF: {ato.uf}
                      </span>
                      {ato.codigo_ibge ? (
                        <span className="text-[9px] font-mono font-semibold bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                          IBGE: {ato.codigo_ibge}
                        </span>
                      ) : null}
                      {ato.municipio_nome ? (
                        <span className="text-[9px] font-bold text-slate-900">
                          {ato.municipio_nome}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-800 italic px-1.5 py-0.5 rounded bg-amber-100/70 border border-amber-200">
                          {ato.ente_nome || 'município não identificado'}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{ato.titulo}</h4>

                    {ato.resumo && (
                      <p className="text-[10px] text-slate-600 leading-relaxed">{ato.resumo}</p>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[9px] text-slate-500 font-medium">
                        Diário Oficial / Fonte: {ato.assoc || 'Diário Oficial'}
                        {ato.data && ` • Data: ${ato.data}`}
                      </span>
                      <SeloNivelConfianca fonte={ato.assoc || 'Diário Oficial'} compacto />
                    </div>
                  </div>

                  {ato.url && (
                    <div className="shrink-0 self-end sm:self-center">
                      <a
                        href={ato.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded transition-colors"
                      >
                        <span>Abrir no Diário Oficial</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
