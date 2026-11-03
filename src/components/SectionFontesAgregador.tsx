import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  ArrowUpDown,
  ShieldCheck,
  Calendar,
  Layers,
  Database,
  RefreshCw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Download,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Globe2,
  X,
  FileText,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import { Badge } from '@/components/ui/badge'
import {
  fetchClassifications,
  fetchClassificationCounts,
  getExportClassificationsUrl,
  OfficialTableCountsResult,
} from '@/services/classifications'
import {
  OPCOES_TABELAS_AGREGADOR,
  OPCOES_FONTES_AGREGADOR,
  OPCOES_ESFERAS_AGREGADOR,
  filtrarClassificacoes,
  contarFiltrosAgregadoresAtivos,
  type EsferaAgregadorId,
  type FiltrosAgregadoresState,
} from '@/services/agregadoresFilters'
import type { ClassificationItem, ClassificationType } from '@/types/panorama'

export const TABELAS_CLASSIFICACAO: {
  id: ClassificationType | 'TODOS'
  label: string
  sublabel: string
  orgao: string
  cor: string
  badgeBg: string
}[] = [
  {
    id: 'TODOS',
    label: 'Todas as Tabelas',
    sublabel: 'Busca consolidada nas 11 classificações oficiais',
    orgao: 'Consolidado',
    cor: 'text-slate-700',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'Nome',
    label: '1. Nome',
    sublabel: 'Produtos e atividades pelo nome e especificação',
    orgao: 'RFB / MAPA / CFC',
    cor: 'text-blue-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'NCM',
    label: '2. NCM',
    sublabel: 'Nomenclatura Comum do Mercosul',
    orgao: 'Receita Federal / TEC',
    cor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'cClassTrib',
    label: '3. cClassTrib',
    sublabel: 'Classificação Tributária IBS/CBS',
    orgao: 'CGIBS / RFB / ENCAT',
    cor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'CST',
    label: '4. CST',
    sublabel: 'Código de Situação Tributária',
    orgao: 'RFB / CGIBS / SPED',
    cor: 'text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'cCredPres',
    label: '5. cCredPres',
    sublabel: 'Crédito Presumido IBS/CBS',
    orgao: 'SVRS / RFB / CGIBS',
    cor: 'text-teal-700',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    id: 'CEST',
    label: '6. CEST',
    sublabel: 'Substituição Tributária Estadual',
    orgao: 'CONFAZ (Conv. 142/18)',
    cor: 'text-purple-700',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'MVA-ST',
    label: '7. MVA-ST',
    sublabel: 'Margem de Valor Agregado',
    orgao: 'CONFAZ / Sefaz UFs',
    cor: 'text-rose-700',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'CFOP',
    label: '8. CFOP',
    sublabel: 'Operações e Prestações (Entradas e Saídas)',
    orgao: 'CONFAZ / Ajustes SINIEF',
    cor: 'text-cyan-700',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    id: 'NBS',
    label: '9. NBS',
    sublabel: 'Nomenclatura Brasileira de Serviços',
    orgao: 'RFB / MDIC / Codex',
    cor: 'text-violet-700',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    id: 'CNAE 2.3',
    label: '10. CNAE 2.3',
    sublabel: 'Atividades Econômicas e Subclasses',
    orgao: 'IBGE / CONCLA',
    cor: 'text-orange-700',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    id: 'cBenef',
    label: '11. cBenef',
    sublabel: 'Códigos de Benefício Fiscal na NF-e',
    orgao: 'Sefaz Estaduais (SP/RS/PR...)',
    cor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  },
]

export function SectionFontesAgregador() {
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(true)
  const [selectedTabela, setSelectedTabela] = useState<string>('TODOS')
  const [tabelasSelecionadas, setTabelasSelecionadas] = useState<ClassificationType[]>([])
  const [fontesSelecionadas, setFontesSelecionadas] = useState<string[]>([])
  const [esferasSelecionadas, setEsferasSelecionadas] = useState<EsferaAgregadorId[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedTerm, setDebouncedTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<'codigo' | 'descricao' | 'nome' | 'tipo'>('codigo')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const perPage = 50

  const [loading, setLoading] = useState<boolean>(true)
  const [rawItems, setRawItems] = useState<ClassificationItem[]>([])
  const [totalItems, setTotalItems] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [sourceMode, setSourceMode] = useState<'database' | 'fallback'>('database')
  const [governanceCounts, setGovernanceCounts] = useState<OfficialTableCountsResult | null>(null)

  useEffect(() => {
    fetchClassificationCounts().then((res) => {
      setGovernanceCounts(res)
    })
  }, [])

  // Debounce da busca textual para digitação suave
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
      setCurrentPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Alterna tabela no painel facetado
  const toggleTabelaFiltro = (tabType: ClassificationType) => {
    setTabelasSelecionadas((prev) => {
      const exists = prev.includes(tabType)
      const novo = exists ? prev.filter((t) => t !== tabType) : [...prev, tabType]
      if (novo.length === 1) {
        setSelectedTabela(novo[0])
      } else if (novo.length === 0) {
        setSelectedTabela('TODOS')
      } else {
        setSelectedTabela('TODOS')
      }
      return novo
    })
    setCurrentPage(1)
  }

  // Alterna fonte oficial no painel facetado
  const toggleFonteFiltro = (fonteId: string) => {
    setFontesSelecionadas((prev) =>
      prev.includes(fonteId) ? prev.filter((f) => f !== fonteId) : [...prev, fonteId],
    )
    setCurrentPage(1)
  }

  // Alterna esfera federativa no painel facetado
  const toggleEsferaFiltro = (esferaId: EsferaAgregadorId) => {
    setEsferasSelecionadas((prev) =>
      prev.includes(esferaId) ? prev.filter((e) => e !== esferaId) : [...prev, esferaId],
    )
    setCurrentPage(1)
  }

  // Reset de página e sincronização ao trocar tabela pelo grid rápido de 11 opções
  const handleSelectTabela = (tabId: string) => {
    setSelectedTabela(tabId)
    if (tabId === 'TODOS') {
      setTabelasSelecionadas([])
    } else {
      setTabelasSelecionadas([tabId as ClassificationType])
    }
    setCurrentPage(1)
  }

  // Estado consolidado de filtros para o serviço puro agregadoresFilters.ts
  const filtrosAgregadores: FiltrosAgregadoresState = useMemo(() => {
    return {
      termo: debouncedTerm,
      tabelas: tabelasSelecionadas,
      fontes: fontesSelecionadas,
      esferas: esferasSelecionadas,
    }
  }, [debouncedTerm, tabelasSelecionadas, fontesSelecionadas, esferasSelecionadas])

  const totalFiltrosAtivos = useMemo(
    () => contarFiltrosAgregadoresAtivos(filtrosAgregadores),
    [filtrosAgregadores],
  )

  // Limpar todos os filtros com um clique
  const handleLimparTodosFiltros = () => {
    setSelectedTabela('TODOS')
    setTabelasSelecionadas([])
    setFontesSelecionadas([])
    setEsferasSelecionadas([])
    setSearchTerm('')
    setDebouncedTerm('')
    setCurrentPage(1)
  }

  // Carregamento dos dados via service com fallback offline integrado
  const loadClassifications = useCallback(async () => {
    setLoading(true)
    try {
      const tipoParaBuscar =
        tabelasSelecionadas.length === 1 ? tabelasSelecionadas[0] : selectedTabela

      const result = await fetchClassifications({
        tipo: tipoParaBuscar,
        termo: debouncedTerm,
        page: currentPage,
        perPage: perPage,
        sortBy: sortBy,
        sortDirection: sortDirection,
      })

      setRawItems(result.items)
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
      setSourceMode(result.source)
    } finally {
      setLoading(false)
    }
  }, [selectedTabela, tabelasSelecionadas, debouncedTerm, currentPage, sortBy, sortDirection])

  useEffect(() => {
    loadClassifications()
  }, [loadClassifications])

  // Aplica filtros facetados em tempo real sobre os itens recebidos
  const items = useMemo(() => {
    return filtrarClassificacoes(rawItems, filtrosAgregadores)
  }, [rawItems, filtrosAgregadores])

  // Alterna direção ou campo de ordenação
  const toggleSort = (field: 'codigo' | 'descricao' | 'nome') => {
    if (sortBy === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Estatística rápida por tipo
  const activeTabelaInfo = useMemo(() => {
    return TABELAS_CLASSIFICACAO.find((t) => t.id === selectedTabela) || TABELAS_CLASSIFICACAO[0]
  }, [selectedTabela])

  return (
    <section id="fontes-agregador" className="scroll-mt-24 space-y-6">
      {/* Header Institucional da Seção */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
                11
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-panorama-gold-dark">
                Seção 11 • Agregadores &amp; Tabelas de Classificação
              </p>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
              Buscador de Produtos e Atividades — Tabelas de Classificações Oficiais
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-4xl leading-relaxed">
              Consolidação oficial e atualizável por ordem de:{' '}
              <strong className="text-slate-800">
                Nome, NCM, cClassTrib, CST, cCredPres, CEST, MVA-ST, CFOP, NBS, CNAE 2.3 e cBenef
              </strong>
              . Dados extraídos exclusivamente de fontes públicas oficiais (RFB, CGIBS, CONFAZ, IBGE
              e SVRS) e integrados à governança semanal de atualização do sistema ADECONT.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 border border-slate-200/90 shadow-xs flex items-center">
              <AdecontLogo
                variant="color"
                showTagline={false}
                className="h-9 w-auto max-w-[150px]"
              />
            </div>
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-semibold py-1 px-2.5 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fontes Oficiais Verificadas</span>
            </Badge>
          </div>
        </div>

        {/* Alerta de Governança e Política de Segurança dos Dados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border-l-4 border-panorama-gold bg-gradient-to-r from-amber-50/80 to-white p-4 text-xs text-amber-950 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-panorama-gold-dark" />
              <span>Política de Atualização &amp; Segurança dos Dados</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              As 11 classificações são monitoradas semanalmente pela rotina automática das
              segundas-feiras (11h UTC / 08h Brasília) via backend seguro. Códigos citáveis
              diretamente nas declarações e documentos fiscais eletrônicos (NF-e, NFC-e e NFS-e).
            </p>
          </div>

          <div className="rounded-xl border-l-4 border-blue-600 bg-gradient-to-r from-blue-50/80 to-white p-4 text-xs text-blue-950 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Database className="w-4 h-4 text-blue-700" />
                <span>Base Oficial &amp; Total por Tabela</span>
              </div>
              <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                Total:{' '}
                {governanceCounts
                  ? governanceCounts.grandTotal.toLocaleString('pt-BR')
                  : totalItems}{' '}
                itens
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[11px] text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">NCM:</span>{' '}
                {governanceCounts?.counts?.['NCM']
                  ? governanceCounts.counts['NCM'].toLocaleString('pt-BR')
                  : '15.240'}{' '}
                itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">CEST:</span>{' '}
                {governanceCounts?.counts?.['CEST'] ?? '100+'} itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">CFOP:</span>{' '}
                {governanceCounts?.counts?.['CFOP'] ?? '17'} itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">cClassTrib:</span>{' '}
                {governanceCounts?.counts?.['cClassTrib'] ?? '15'} itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">CST:</span>{' '}
                {governanceCounts?.counts?.['CST'] ?? '10'} itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">cCredPres:</span>{' '}
                {governanceCounts?.counts?.['cCredPres'] ?? '7'} itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">NBS:</span>{' '}
                {governanceCounts?.counts?.['NBS'] ?? '10'} itens
              </div>
              <div>
                <span className="font-semibold text-slate-900">CNAE 2.3:</span>{' '}
                {governanceCounts?.counts?.['CNAE_2_3'] ??
                  governanceCounts?.counts?.['CNAE 2.3'] ??
                  '13'}{' '}
                itens
              </div>
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              Último sincronismo oficial do banco de dados: 28/10/2026 (Fontes: RFB, CGIBS, CONFAZ e
              IBGE)
            </p>
            <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-600">
                Exportação integral ({activeTabelaInfo.label}):
              </span>
              <a
                href={getExportClassificationsUrl(selectedTabela, 'csv')}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>
                  Baixar {activeTabelaInfo.id === 'TODOS' ? 'todas' : activeTabelaInfo.label} em CSV
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* SELETOR DAS 11 TABELAS DE CLASSIFICAÇÃO */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-panorama-navy" />
              <span>Seletor de Tabela de Classificação (11 opções):</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Total nesta exibição: <strong className="text-slate-800">{totalItems}</strong>{' '}
              registros
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {TABELAS_CLASSIFICACAO.map((tab) => {
              const isSelected = selectedTabela === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTabela(tab.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-panorama-navy bg-panorama-navy text-white shadow-md -translate-y-0.5 ring-2 ring-panorama-gold/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : tab.cor}`}
                      >
                        {tab.label}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] mt-1 line-clamp-2 leading-tight ${
                        isSelected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {tab.sublabel}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-1 flex-wrap self-start">
                    <span
                      className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-white/20 text-panorama-gold-light'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.orgao}
                    </span>
                    <SeloNivelConfianca fonte={tab.orgao} compacto />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* PAINEL DE FILTROS FACETADOS PADRÃO INSTITUCIONAL ADECONT */}
        <div className="space-y-3">
          {/* Barra de Ações: Botão Expandir/Recolher + Limpar + Campo de Busca + Download CSV */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPainelFiltrosAberto((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  totalFiltrosAtivos > 0
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Expandir/recolher painel de filtros facetados dos Agregadores"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-panorama-gold" />
                <span>Filtros das Classificações</span>
                {totalFiltrosAtivos > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-panorama-gold text-panorama-navy">
                    {totalFiltrosAtivos}
                  </span>
                )}
              </button>

              {totalFiltrosAtivos > 0 && (
                <button
                  type="button"
                  onClick={handleLimparTodosFiltros}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                  title="Limpar todos os filtros selecionados"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar todos os filtros ({totalFiltrosAtivos})</span>
                </button>
              )}

              {/* Botão de download direto da base completa (CSV) preservado */}
              <a
                href={getExportClassificationsUrl(selectedTabela, 'csv')}
                download
                target="_blank"
                rel="noopener noreferrer"
                title={`Baixar todos os registros da base ${activeTabelaInfo.label} em formato CSV (Excel)`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>⬇ Baixar base completa (CSV)</span>
              </a>

              <button
                type="button"
                onClick={loadClassifications}
                disabled={loading}
                title="Recarregar dados da tabela"
                className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Campo de Busca por NOME/CÓDIGO com debounce de 250ms */}
            <div className="relative w-full sm:w-96">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, código (1006.30, SP000001, 1.101)..."
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-panorama-navy focus:ring-1 focus:ring-panorama-navy"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
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
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-50/20 border-2 border-slate-200 space-y-4 animate-in fade-in duration-200 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-panorama-navy" />
                  Painel de Filtros Facetados das Classificações Tributárias
                </span>
                <span className="text-[11px] text-slate-500">
                  {totalFiltrosAtivos > 0
                    ? `${totalFiltrosAtivos} dimensão(ões) ativa(s)`
                    : 'Nenhum filtro aplicado'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Tabela de Classificação (as 11 opções) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      1. Tabela de Classificação (11)
                    </span>
                    {tabelasSelecionadas.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 rounded">
                        {tabelasSelecionadas.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                    {OPCOES_TABELAS_AGREGADOR.map((tab) => {
                      const ativo = tabelasSelecionadas.includes(tab.id)
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => toggleTabelaFiltro(tab.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                          title={`${tab.label} — ${tab.sublabel} (${tab.orgao})`}
                        >
                          <span className="truncate">{tab.label}</span>
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

                {/* 2. Fonte Oficial */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      2. Fonte Oficial
                    </span>
                    {fontesSelecionadas.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                        {fontesSelecionadas.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {OPCOES_FONTES_AGREGADOR.map((fnt) => {
                      const ativo = fontesSelecionadas.includes(fnt.id)
                      return (
                        <button
                          key={fnt.id}
                          type="button"
                          onClick={() => toggleFonteFiltro(fnt.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                          title={fnt.descricao}
                        >
                          <span className="truncate">{fnt.label}</span>
                          {ativo ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 ml-1" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Esfera / Governança & Ordenação */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                      3. Esfera / Governança
                    </span>
                    {esferasSelecionadas.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 rounded">
                        {esferasSelecionadas.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {OPCOES_ESFERAS_AGREGADOR.map((esf) => {
                      const ativo = esferasSelecionadas.includes(esf.id)
                      return (
                        <button
                          key={esf.id}
                          type="button"
                          onClick={() => toggleEsferaFiltro(esf.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{esf.label}</span>
                          {ativo ? (
                            <Check className="w-3.5 h-3.5 text-indigo-700 shrink-0 ml-1" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Ordenação rápida */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      Critério de ordenação da tabela:
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSort('codigo')}
                        className={`text-[10.5px] py-1 px-1.5 rounded border font-semibold cursor-pointer ${
                          sortBy === 'codigo'
                            ? 'bg-panorama-navy text-white border-panorama-navy'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Código {sortBy === 'codigo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSort('nome')}
                        className={`text-[10.5px] py-1 px-1.5 rounded border font-semibold cursor-pointer ${
                          sortBy === 'nome'
                            ? 'bg-panorama-navy text-white border-panorama-navy'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Nome {sortBy === 'nome' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSort('descricao')}
                        className={`text-[10.5px] py-1 px-1.5 rounded border font-semibold cursor-pointer ${
                          sortBy === 'descricao'
                            ? 'bg-panorama-navy text-white border-panorama-navy'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Descrição{' '}
                        {sortBy === 'descricao' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHIPS DE FILTROS ATIVOS REMOVÍVEIS */}
          {totalFiltrosAtivos > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Filtros ativos:</span>

              {debouncedTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold">
                  <span>Busca: &ldquo;{debouncedTerm}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      setDebouncedTerm('')
                    }}
                    className="hover:text-rose-600 cursor-pointer"
                    title="Remover filtro de termo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {tabelasSelecionadas.map((tabId) => (
                <span
                  key={`chip-tab-${tabId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-semibold"
                >
                  <span>Tabela: {tabId}</span>
                  <button
                    type="button"
                    onClick={() => toggleTabelaFiltro(tabId)}
                    className="hover:text-blue-950 cursor-pointer"
                    title="Remover filtro de tabela"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {fontesSelecionadas.map((fntId) => (
                <span
                  key={`chip-fonte-${fntId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-semibold"
                >
                  <span>Fonte: {fntId}</span>
                  <button
                    type="button"
                    onClick={() => toggleFonteFiltro(fntId)}
                    className="hover:text-emerald-950 cursor-pointer"
                    title="Remover filtro de fonte"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {esferasSelecionadas.map((esfId) => (
                <span
                  key={`chip-esf-${esfId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-semibold"
                >
                  <span>Esfera: {esfId.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => toggleEsferaFiltro(esfId)}
                    className="hover:text-indigo-950 cursor-pointer"
                    title="Remover filtro de esfera"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={handleLimparTodosFiltros}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>

        {/* TABELA DE RESULTADOS DAS CLASSIFICAÇÕES */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold text-xs uppercase tracking-wide">
                <th className="py-3 px-3.5 w-28">Tabela</th>
                <th
                  className="py-3 px-3.5 w-32 cursor-pointer"
                  onClick={() => toggleSort('codigo')}
                >
                  <div className="flex items-center gap-1">
                    <span>Código</span>
                    <ArrowUpDown className="w-3 h-3 text-panorama-gold-light" />
                  </div>
                </th>
                <th className="py-3 px-3.5 min-w-[200px]" onClick={() => toggleSort('nome')}>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span>Nome / Produto / Atividade</span>
                    <ArrowUpDown className="w-3 h-3 text-panorama-gold-light" />
                  </div>
                </th>
                <th
                  className="py-3 px-3.5 min-w-[260px] cursor-pointer"
                  onClick={() => toggleSort('descricao')}
                >
                  <div className="flex items-center gap-1">
                    <span>Descrição Oficial &amp; Capitulado Legal</span>
                    <ArrowUpDown className="w-3 h-3 text-panorama-gold-light" />
                  </div>
                </th>
                <th className="py-3 px-3.5 w-44">Fonte Oficial</th>
                <th className="py-3 px-3.5 w-32">Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-panorama-navy" />
                      <span className="text-xs font-semibold">
                        Carregando registros de classificações...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3 py-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <FileText className="w-6 h-6 text-amber-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Nenhuma classificação encontrada para os filtros selecionados
                      </p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        Não localizamos registros que correspondam à combinação de tabela, fonte
                        oficial e termos de busca informados.
                      </p>
                      {totalFiltrosAtivos > 0 && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleLimparTodosFiltros}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-panorama-gold" />
                            <span>Limpar todos os filtros ({totalFiltrosAtivos})</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row) => {
                  const tabelaMeta =
                    TABELAS_CLASSIFICACAO.find((t) => t.id === row.tipo) || TABELAS_CLASSIFICACAO[1]
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Badge da Tabela */}
                      <td className="py-3 px-3.5 align-top">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${tabelaMeta.badgeBg}`}
                        >
                          {row.tipo}
                        </span>
                      </td>

                      {/* Código Oficial */}
                      <td className="py-3 px-3.5 align-top font-mono font-bold text-slate-900 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {row.codigo}
                        </span>
                      </td>

                      {/* Nome do Produto / Atividade */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {row.nome || row.descricao}
                        </div>
                        {row.observacoes && (
                          <div className="mt-1 text-[11px] text-amber-800 bg-amber-50/70 rounded px-1.5 py-0.5 border border-amber-200/60 inline-block">
                            {row.observacoes}
                          </div>
                        )}
                      </td>

                      {/* Descrição oficial & Tabela de Origem */}
                      <td className="py-3 px-3.5 align-top text-slate-600 text-xs leading-relaxed">
                        <p>{row.descricao}</p>
                        {row.tabela_origem && (
                          <p className="mt-1 text-[10px] text-slate-400 font-mono">
                            Origem: {row.tabela_origem}
                          </p>
                        )}
                      </td>

                      {/* Badge da Fonte Oficial */}
                      <td className="py-3 px-3.5 align-top">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{row.fonte}</span>
                          </span>
                          <SeloNivelConfianca fonte={row.fonte} compacto />
                        </div>
                      </td>

                      {/* Data de Atualização */}
                      <td className="py-3 px-3.5 align-top text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{row.atualizado_em || '28/10/2026'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO DE ATÉ 50 POR PÁGINA */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div>
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({totalItems}{' '}
              itens no total)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              {(() => {
                // Paginação compacta e escalável para dezenas/centenas de páginas
                const delta = 2
                const range: (number | string)[] = []
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 ||
                    i === totalPages ||
                    (i >= currentPage - delta && i <= currentPage + delta)
                  ) {
                    range.push(i)
                  } else if (range[range.length - 1] !== '...') {
                    range.push('...')
                  }
                }
                return range.map((p, idx) =>
                  typeof p === 'number' ? (
                    <button
                      key={`page-${p}`}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentPage === p
                          ? 'bg-panorama-navy text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold select-none">
                      ...
                    </span>
                  ),
                )
              })()}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* BLOCO DE NOTAS TÉCNICAS E FONTES DE REFERÊNCIA */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-panorama-gold-dark" />
            <span>Fontes Oficiais das 11 Classificações</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-800">Tributos da Reforma (IBS / CBS)</span>
                <SeloNivelConfianca fonte="RFB / CGIBS" compacto />
              </div>
              <p className="text-slate-600">
                <strong>cClassTrib, CST e cCredPres:</strong> IT 2025.002 v1.70, Atos Técnicos
                Conjuntos RFB/CGIBS e Portal da Conformidade Fácil (SVRS).
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-800">Comércio Exterior &amp; Serviços</span>
                <SeloNivelConfianca fonte="Siscomex / MDIC / RFB" compacto />
              </div>
              <p className="text-slate-600">
                <strong>NCM:</strong> TIPI e Sistema CLASSIF do Portal Único Siscomex.
                <br />
                <strong>NBS:</strong> Decreto Federal 7.708 e MDIC/Codex NBS 2.0.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-slate-800">Estadual &amp; Atividades</span>
                <SeloNivelConfianca fonte="CONFAZ / IBGE" compacto />
              </div>
              <p className="text-slate-600">
                <strong>CEST, MVA-ST e CFOP:</strong> CONFAZ e SINIEF.
                <br />
                <strong>CNAE 2.3:</strong> IBGE/CONCLA.
                <br />
                <strong>cBenef:</strong> Secretarias de Fazenda estaduais.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
            <span>
              Para confrontar com o catálogo do simulador:{' '}
              <a
                href="/panorama-reforma/simulador.html"
                className="font-bold text-blue-700 hover:underline"
              >
                Abrir Simulador de Transição →
              </a>
            </span>
            <span className="font-mono text-[11px]">
              Política ADECONT: Verificação Semanal • Atualizado em 28/10/2026
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
