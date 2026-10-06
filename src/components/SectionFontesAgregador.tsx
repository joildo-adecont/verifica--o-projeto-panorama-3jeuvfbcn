import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Database,
  RefreshCw,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Download,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { Badge } from '@/components/ui/badge'
import {
  fetchClassifications,
  fetchClassificationCounts,
  getExportClassificationsUrl,
  OfficialTableCountsResult,
} from '@/services/classifications'
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
  const [selectedTabela, setSelectedTabela] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedTerm, setDebouncedTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<'codigo' | 'descricao' | 'nome' | 'tipo'>('codigo')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const perPage = 50

  const [loading, setLoading] = useState<boolean>(true)
  const [items, setItems] = useState<ClassificationItem[]>([])
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

  // Reset de página ao trocar tabela
  const handleSelectTabela = (tabId: string) => {
    setSelectedTabela(tabId)
    setCurrentPage(1)
  }

  // Carregamento dos dados via service com fallback offline integrado
  const loadClassifications = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchClassifications({
        tipo: selectedTabela,
        termo: debouncedTerm,
        page: currentPage,
        perPage: perPage,
        sortBy: sortBy,
        sortDirection: sortDirection,
      })

      setItems(result.items)
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
      setSourceMode(result.source)
    } finally {
      setLoading(false)
    }
  }, [selectedTabela, debouncedTerm, currentPage, sortBy, sortDirection])

  useEffect(() => {
    loadClassifications()
  }, [loadClassifications])

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
              Último sincronismo oficial do banco de dados: 01/10/2026 (Fontes: RFB, CGIBS, CONFAZ e
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
                  <span
                    className={`mt-2 text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded self-start ${
                      isSelected
                        ? 'bg-white/20 text-panorama-gold-light'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.orgao}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* CAMPO DE BUSCA LIVRE & CONTROLES DE FILTRAGEM */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Input de texto livre */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por NOME do produto/atividade, código (ex: 1006.30, 000001, 1.101, SP000001), descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panorama-gold/60 focus:border-panorama-navy transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  title="Limpar termo de busca"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Controles de ordenação rápida */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Ordenar:</span>
              </span>
              <button
                onClick={() => toggleSort('codigo')}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  sortBy === 'codigo'
                    ? 'bg-panorama-navy text-white border-panorama-navy shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Código {sortBy === 'codigo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => toggleSort('descricao')}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  sortBy === 'descricao'
                    ? 'bg-panorama-navy text-white border-panorama-navy shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Descrição {sortBy === 'descricao' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                onClick={() => toggleSort('nome')}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                  sortBy === 'nome'
                    ? 'bg-panorama-navy text-white border-panorama-navy shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Nome {sortBy === 'nome' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>

              <button
                onClick={loadClassifications}
                disabled={loading}
                title="Recarregar dados da tabela"
                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Botão de download direto da base completa (CSV) */}
              <a
                href={getExportClassificationsUrl(selectedTabela, 'csv')}
                download
                target="_blank"
                rel="noopener noreferrer"
                title={`Baixar todos os registros da base ${activeTabelaInfo.label} em formato CSV (Excel)`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>⬇ Baixar base completa (CSV)</span>
              </a>
            </div>
          </div>

          {/* Rótulo ativo e feedback de filtros */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">Tabela ativa:</span>
              <span className="font-bold text-panorama-navy bg-white px-2 py-0.5 rounded border border-slate-200">
                {activeTabelaInfo.label} — {activeTabelaInfo.sublabel}
              </span>
              {debouncedTerm && (
                <span className="text-slate-500">
                  • Filtrado por <strong>&quot;{debouncedTerm}&quot;</strong>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500">
              Mostrando {items.length} de {totalItems} itens ({perPage} por página)
            </div>
          </div>
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
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">
                        Nenhum registro encontrado para estes critérios.
                      </p>
                      <p className="text-xs text-slate-400 max-w-md">
                        Tente buscar por um código diferente ou selecione &quot;Todas as
                        Tabelas&quot; no menu superior.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedTabela('TODOS')
                          setSearchTerm('')
                        }}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                      >
                        Limpar filtros e ver todos os itens
                      </button>
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
                        </div>
                      </td>

                      {/* Data de Atualização */}
                      <td className="py-3 px-3.5 align-top text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{row.atualizado_em || '01/10/2026'}</span>
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
            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800">Tributos da Reforma (IBS / CBS)</span>
              <p className="text-slate-600">
                <strong>cClassTrib, CST e cCredPres:</strong> IT 2025.002 v1.70, Atos Técnicos
                Conjuntos RFB/CGIBS e Portal da Conformidade Fácil (SVRS).
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800">Comércio Exterior &amp; Serviços</span>
              <p className="text-slate-600">
                <strong>NCM:</strong> TIPI e Sistema CLASSIF do Portal Único Siscomex.
                <br />
                <strong>NBS:</strong> Decreto Federal 7.708 e MDIC/Codex NBS 2.0.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
              <span className="font-bold text-slate-800">Estadual &amp; Atividades</span>
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
              Política ADECONT: Verificação Semanal • Atualizado em 01/10/2026
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
