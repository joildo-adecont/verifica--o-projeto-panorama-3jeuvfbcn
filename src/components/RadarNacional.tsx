import { useState, useEffect, useMemo, useCallback } from 'react'
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
import {
  OPCOES_NIVEIS_RADAR,
  filtrarAtosRadar,
  contarFiltrosRadarAtivos,
  type NivelAtoRadar,
  type FiltrosRadarState,
} from '@/services/radarFilters'

const NAVY = 'bg-panorama-navy'

export interface RadarNacionalProps {
  initialUf?: string
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

  // Estado de expansão das UFs (chevron)
  const [expandedUfs, setExpandedUfs] = useState<Record<string, boolean>>({})

  // Paginação e lista de municípios server-side
  const [municipios, setMunicipios] = useState<RadarMunicipioItem[]>([])
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalMunicipiosEncontrados, setTotalMunicipiosEncontrados] = useState<number>(0)
  const [loadingMunicipios, setLoadingMunicipios] = useState<boolean>(false)
  const [sourceMode, setSourceMode] = useState<'database' | 'fallback'>('database')

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

  // Debounce do termo de busca (250ms conforme padrão da Seção 11)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTermo(termoBusca)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [termoBusca])

  // Carga inicial de estatísticas e atos
  useEffect(() => {
    fetchRadarEstatisticas().then((res) => setStats(res))
    fetchAtosMunicipaisPorCodigo().then((res) => setAtosMap(res))
  }, [])

  // Sincroniza expansão ao selecionar UF via filtro externo
  useEffect(() => {
    if (selectedUf) {
      setExpandedUfs((prev) => ({ ...prev, [selectedUf]: true }))
    }
  }, [selectedUf])

  // Busca server-side de municípios ao alterar UF, termo ou página
  const carregarMunicipios = useCallback(async () => {
    setLoadingMunicipios(true)
    try {
      const res = await fetchMunicipiosPaginados({
        uf: selectedUf || undefined,
        termo: debouncedTermo || undefined,
        page,
        perPage: 30,
      })

      // Injeta contagem de atos vinculados em cada município
      const itemsComAtos = res.items.map((m) => {
        const atos = atosMap.porIbge[m.codigo_ibge] || []
        return {
          ...m,
          atosCount: atos.length,
        }
      })

      setMunicipios(itemsComAtos)
      setTotalPages(res.totalPages)
      setTotalMunicipiosEncontrados(res.totalItems)
      setSourceMode(res.source)
    } finally {
      setLoadingMunicipios(false)
    }
  }, [selectedUf, debouncedTermo, page, atosMap.porIbge])

  useEffect(() => {
    carregarMunicipios()
  }, [carregarMunicipios])

  // Alterna expansão de uma UF
  const toggleExpandUf = (ufCode: string) => {
    setExpandedUfs((prev) => ({
      ...prev,
      [ufCode]: !prev[ufCode],
    }))
    if (selectedUf !== ufCode) {
      setSelectedUf(ufCode)
      setSelectedMunicipio(null)
      setPage(1)
    }
  }

  // Seleciona/deseleciona chip de município
  const handleSelectMunicipio = (m: RadarMunicipioItem) => {
    if (selectedMunicipio?.codigo_ibge === m.codigo_ibge) {
      setSelectedMunicipio(null)
    } else {
      setSelectedMunicipio(m)
      if (m.uf && selectedUf !== m.uf) {
        setSelectedUf(m.uf)
      }
    }
  }

  // Alterna nível selecionado no painel facetado
  const toggleNivel = (nId: NivelAtoRadar) => {
    setNiveisSelecionados((prev) => {
      const exists = prev.includes(nId)
      const novo = exists ? prev.filter((x) => x !== nId) : [...prev, nId]
      // Sincroniza com o seletor rápido
      if (novo.length === 1) {
        setNivel(novo[0])
      } else {
        setNivel('todos')
      }
      return novo
    })
  }

  // Seleciona nível via seletor rápido
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
    setPage(1)
  }

  // Lista consolidada de atos filtrados via serviço puro radarFilters.ts
  const atosFiltrados = useMemo(() => {
    return filtrarAtosRadar(atosMap.todos, filtrosState)
  }, [atosMap.todos, filtrosState])

  return (
    <div className="space-y-4">
      {/* PAINEL DE ESTATÍSTICAS NACIONAIS (5.570 municípios, 27 UFs) */}
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
            <span>Nível estadual/municipal</span>
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
              {totalMunicipiosEncontrados.toLocaleString('pt-BR')}
            </p>
            <p className="text-[8.5px] font-semibold uppercase tracking-wide text-panorama-gold-light/90 mt-0.5">
              Municípios na consulta
            </p>
          </div>
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[9px] text-slate-600">
            <span>Modo: {sourceMode === 'database' ? 'PocketBase API' : 'Fallback'}</span>
            <span className="font-semibold text-slate-700">
              Pág. {page}/{totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* PAINEL DE FILTROS FACETADOS PADRÃO INSTITUCIONAL ADECONT */}
      <div className="space-y-3">
        {/* Barra de Ações: Botão Expandir/Recolher + Limpar + Seletor rápido + Campo de Busca */}
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

          {/* Campo de Busca textual rápida */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar ato, município ou código IBGE..."
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
                    2. Unidade Federativa
                  </span>
                  {selectedUf && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 rounded">
                      {selectedUf}
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-500 leading-tight">
                  Selecione no grid de 27 UFs abaixo ou filtre rapidamente pela sigla:
                </p>
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedUf('')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold border cursor-pointer ${
                      !selectedUf
                        ? 'bg-panorama-navy text-white border-panorama-navy'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Todas
                  </button>
                  {UFS_BRASIL.map((ufCode) => {
                    const isSel = selectedUf === ufCode
                    return (
                      <button
                        key={`filtro-uf-${ufCode}`}
                        type="button"
                        onClick={() => setSelectedUf(isSel ? '' : ufCode)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                          isSel
                            ? 'bg-indigo-100 text-indigo-950 border-indigo-400 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
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
                    Nenhum município selecionado. Clique em qualquer chip no catálogo de municípios
                    abaixo para isolar seus atos normativos.
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
                <span>UF: {selectedUf}</span>
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
                  {selectedMunicipio.nome} ({selectedMunicipio.uf})
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

      {/* SELETOR DE UFS COM EXPANSÃO (CHEVRON) E CONTAGEM OFICIAL */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-panorama-gold" />
            <h3 className="text-xs font-bold text-white">
              Expansão por Estado — 27 Unidades Federativas (Oficial IBGE)
            </h3>
          </div>
          <span className="text-[9.5px] text-panorama-gold-light/90">
            Clique na UF para expandir municípios reais do banco
          </span>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-1.5">
            {UFS_BRASIL.map((ufCode) => {
              const isSelected = selectedUf === ufCode
              const isExpanded = !!expandedUfs[ufCode]
              const totalUfMuni = TOTAL_OFICIAL_MUNICIPIOS_POR_UF[ufCode] || 0
              const totalAtosUf = stats.atosPorUf[ufCode] || 0

              return (
                <button
                  key={ufCode}
                  onClick={() => toggleExpandUf(ufCode)}
                  className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-panorama-navy bg-panorama-navy text-white ring-2 ring-panorama-gold/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold font-mono">{ufCode}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-panorama-gold" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[8.5px] text-slate-500 w-full">
                    <span className={isSelected ? 'text-slate-200' : 'text-slate-600'}>
                      {totalUfMuni} mun.
                    </span>
                    {totalAtosUf > 0 && (
                      <span
                        className={`font-bold px-1 rounded ${
                          isSelected
                            ? 'bg-panorama-gold text-panorama-navy'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                        title={`${totalAtosUf} atos vinculados nesta UF`}
                      >
                        {totalAtosUf} atos
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CATÁLOGO DE MUNICÍPIOS COM BUSCA E PAGINAÇÃO SERVER-SIDE (CHIPS SELECIONÁVEIS) */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-panorama-gold" />
            <h3 className="text-xs font-bold text-white">
              Municípios Oficiais IBGE — Consulta no Servidor (5.570 registros)
            </h3>
            {selectedUf && (
              <span className="text-[10px] font-bold bg-panorama-gold text-panorama-navy px-1.5 py-0.2 rounded">
                UF: {selectedUf}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-panorama-gold-light">
            {loadingMunicipios ? (
              <span className="flex items-center gap-1 text-white">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Carregando do banco...</span>
              </span>
            ) : (
              <span>
                {totalMunicipiosEncontrados.toLocaleString('pt-BR')} municípios encontrados
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Instrução visual */}
          <p className="text-[10.5px] text-slate-600 leading-relaxed">
            Selecione um município abaixo para isolar seus atos normativos municipais vinculados.
            Cada chip exibe a denominação oficial, a UF, o código IBGE de 7 dígitos e a contagem de
            atos vigentes.
          </p>

          {/* Grid de Chips de Municípios */}
          {loadingMunicipios ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-panorama-navy" />
              <span className="text-xs">
                Consultando base oficial de municípios no PocketBase...
              </span>
            </div>
          ) : municipios.length === 0 ? (
            <div className="p-6 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs">
              Nenhum município encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {municipios.map((m) => {
                const isSelected = selectedMunicipio?.codigo_ibge === m.codigo_ibge
                const temAtos = (m.atosCount || 0) > 0

                return (
                  <button
                    key={m.codigo_ibge}
                    onClick={() => handleSelectMunicipio(m)}
                    className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'border-panorama-navy bg-panorama-navy text-white shadow-xs ring-2 ring-panorama-gold/70'
                        : temAtos
                          ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-slate-900'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin
                          className={`w-3 h-3 shrink-0 ${
                            isSelected
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
                            isSelected ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {m.uf}
                        </span>
                        <span
                          className={`font-mono ${
                            isSelected ? 'text-panorama-gold-light' : 'text-slate-400'
                          }`}
                        >
                          IBGE: {m.codigo_ibge}
                        </span>
                      </div>
                    </div>

                    {temAtos && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
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

          {/* Controles de Paginação Server-side */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 text-[11px]">
                Página <strong>{page}</strong> de <strong>{totalPages}</strong> (
                {totalMunicipiosEncontrados} no total)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1 || loadingMunicipios}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px] font-semibold"
                >
                  ← Anterior
                </button>
                <button
                  disabled={page >= totalPages || loadingMunicipios}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-[11px] font-semibold"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DE ATOS NORMATIVOS MUNICIPAIS VINCULADOS AO RADAR */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="bg-panorama-navy px-3 py-2 border-b-2 border-panorama-gold flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-panorama-gold" />
            <h3 className="text-xs font-bold text-white">
              Atos Normativos Municipais Vinculados por Código IBGE
            </h3>
            <span className="text-[10px] text-panorama-gold-light/90">
              ({atosFiltrados.length} ato{atosFiltrados.length === 1 ? '' : 's'} filtrado
              {atosFiltrados.length === 1 ? '' : 's'})
            </span>
          </div>

          {selectedMunicipio && (
            <span className="text-[9.5px] font-bold bg-panorama-gold text-panorama-navy px-2 py-0.5 rounded">
              {selectedMunicipio.nome}/{selectedMunicipio.uf} (IBGE: {selectedMunicipio.codigo_ibge}
              )
            </span>
          )}
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
            atosFiltrados.map((ato) => (
              <div
                key={ato.id}
                className="p-3 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-2.5"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                      Nível {ato.nivel || 'Municipal'}
                    </span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      UF: {ato.uf}
                    </span>
                    {ato.codigo_ibge && (
                      <span className="text-[9px] font-mono font-semibold bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                        IBGE: {ato.codigo_ibge}
                      </span>
                    )}
                    {ato.municipio_nome && (
                      <span className="text-[9px] font-bold text-slate-900">
                        {ato.municipio_nome}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{ato.titulo}</h4>

                  {ato.resumo && (
                    <p className="text-[10px] text-slate-600 leading-relaxed">{ato.resumo}</p>
                  )}

                  {ato.assoc && (
                    <p className="text-[9px] text-slate-500 font-medium">
                      Diário Oficial / Fonte: {ato.assoc}
                      {ato.data && ` • Data: ${ato.data}`}
                    </p>
                  )}
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}
