import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  X,
  MapPin,
  Building2,
  Landmark,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  FileText,
  Filter,
  CheckCircle2,
  Globe2,
  Radar,
  ShieldAlert,
  AlertTriangle,
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

const NAVY = 'bg-panorama-navy'

export interface RadarNacionalProps {
  initialUf?: string
}

export function RadarNacional({ initialUf = '' }: RadarNacionalProps) {
  // Filtros combinados
  const [selectedUf, setSelectedUf] = useState<string>(initialUf)
  const [selectedMunicipio, setSelectedMunicipio] = useState<RadarMunicipioItem | null>(null)
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

  // Limpar todos os filtros
  const handleLimparFiltros = () => {
    setSelectedUf('')
    setSelectedMunicipio(null)
    setNivel('todos')
    setTermoBusca('')
    setDebouncedTermo('')
    setPage(1)
  }

  // Lista consolidada de atos filtrados segundo UF + município + nível
  const atosFiltrados = useMemo(() => {
    return atosMap.todos.filter((ato) => {
      // Filtro de nível (federal / estadual / municipal)
      if (nivel !== 'todos' && ato.nivel !== nivel) {
        return false
      }

      // Filtro de UF
      if (selectedUf && ato.uf.toUpperCase() !== selectedUf.toUpperCase()) {
        return false
      }

      // Filtro de município selecionado
      if (selectedMunicipio && ato.codigo_ibge !== selectedMunicipio.codigo_ibge) {
        return false
      }

      // Filtro de busca textual no título ou município
      if (debouncedTermo) {
        const q = debouncedTermo.toLowerCase().trim()
        const matchTitulo = ato.titulo.toLowerCase().includes(q)
        const matchMuni = (ato.municipio_nome || '').toLowerCase().includes(q)
        const matchIbge = (ato.codigo_ibge || '').includes(q)
        if (!matchTitulo && !matchMuni && !matchIbge) {
          return false
        }
      }

      return true
    })
  }, [atosMap.todos, nivel, selectedUf, selectedMunicipio, debouncedTermo])

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

      {/* BARRA DE FILTROS COMBINADOS: UF + NÍVEL + BUSCA DE MUNICÍPIO */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-panorama-navy" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Filtros Combinados — Federação, Estado &amp; Município
            </h3>
          </div>

          {(selectedUf || selectedMunicipio || nivel !== 'todos' || termoBusca) && (
            <button
              onClick={handleLimparFiltros}
              className="text-[10px] font-bold text-panorama-navy bg-panorama-gold hover:bg-panorama-gold-dark rounded px-2 py-1 transition-colors self-start sm:self-auto cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Seletor de Nível */}
          <div className="md:col-span-4 flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
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
                onClick={() => setNivel(opt.id)}
                className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded transition-all cursor-pointer ${
                  nivel === opt.id
                    ? 'bg-panorama-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Campo de Busca textual por município ou código IBGE */}
          <div className="md:col-span-8 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar município por nome ou código IBGE de 7 dígitos (ex: 3304557, Niterói, Joinville, Porto Alegre)..."
              className="w-full text-xs pl-8 pr-7 py-2 rounded-lg border border-slate-300 focus:border-panorama-navy focus:ring-1 focus:ring-panorama-gold focus:outline-none transition-all"
            />
            {termoBusca && (
              <button
                onClick={() => setTermoBusca('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpar busca"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Feedback visual dos filtros ativos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10.5px]">
          <span className="text-slate-500 font-semibold">Filtros ativos:</span>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            Nível: <strong>{nivel.toUpperCase()}</strong>
          </span>
          {selectedUf ? (
            <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
              <span>
                Estado: <strong>{selectedUf}</strong>
              </span>
              <button
                onClick={() => setSelectedUf('')}
                className="hover:text-blue-950 font-bold ml-1"
                title="Remover filtro de UF"
              >
                ×
              </button>
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Todas as 27 UFs</span>
          )}
          {selectedMunicipio && (
            <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1 font-semibold">
              <MapPin className="w-3 h-3 text-amber-700" />
              <span>
                {selectedMunicipio.nome} ({selectedMunicipio.uf}) — IBGE:{' '}
                {selectedMunicipio.codigo_ibge}
              </span>
              <button
                onClick={() => setSelectedMunicipio(null)}
                className="hover:text-amber-950 font-bold ml-1"
                title="Remover município"
              >
                ×
              </button>
            </span>
          )}
          {debouncedTermo && (
            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Termo: &quot;{debouncedTermo}&quot;
            </span>
          )}
        </div>
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
            <div className="p-8 text-center text-slate-500 text-xs">
              <p>Nenhum ato normativo municipal cadastrado com os filtros selecionados.</p>
              <p className="text-[10px] text-slate-400 mt-1">
                Tente selecionar outra UF ou limpar o filtro de município para ver todos os atos.
              </p>
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
