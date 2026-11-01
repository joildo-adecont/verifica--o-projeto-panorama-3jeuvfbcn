import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  FileDown,
  Layers,
  Filter,
  Eye,
  ExternalLink,
  BookOpen,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  Search,
  Scale,
  BadgeCheck,
  ShieldAlert,
} from 'lucide-react'
import type { TaxNormItem } from '@/types/panorama'
import { getOfficialDocProxyUrl } from '@/services/panorama'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  OPCOES_ESFERAS_NORMA,
  OPCOES_FONTES_NORMA,
  OPCOES_TIPOS_ATO_NORMA,
  OPCOES_INCIDENCIA_NORMA,
  FILTROS_NORMAS_INICIAIS,
  filtrarNormas,
  deduzirTipoAto,
  contarFiltrosNormasAtivos,
  type FiltrosNormasState,
  type EsferaNormaId,
} from '@/services/normasFilters'

interface SectionNormsProps {
  norms: TaxNormItem[]
  loading?: boolean
}

export function SectionNorms({ norms, loading }: SectionNormsProps) {
  const [filtros, setFiltros] = useState<FiltrosNormasState>(FILTROS_NORMAS_INICIAIS)
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(true)
  const [normaModal, setNormaModal] = useState<TaxNormItem | null>(null)

  const getBadgeStyle = (status: string) => {
    const s = status.toUpperCase()
    if (s.includes('CRIA') || s.includes('REGULA A INCIDÊNCIA') || s.includes('INCIDE')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300'
    }
    if (s.includes('NÃO INCIDE')) {
      return 'bg-rose-50 text-rose-800 border-rose-300'
    }
    if (s.includes('PARCIAL') || s.includes('ESPECÍFICO')) {
      return 'bg-amber-50 text-amber-800 border-amber-300'
    }
    if (s.includes('ISENTO') || s.includes('IMUNE')) {
      return 'bg-blue-50 text-blue-800 border-blue-300'
    }
    if (s.includes('REGULA A CBS') || s.includes('REGULA O IBS') || s.includes('ADMINISTRAÇÃO')) {
      return 'bg-purple-50 text-purple-800 border-purple-300'
    }
    return 'bg-slate-100 text-slate-800 border-slate-300'
  }

  const getTypeBadgeStyle = (normType?: string) => {
    const t = (normType || '').toLowerCase()
    if (t.includes('emenda')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    }
    if (t.includes('lei')) {
      return 'bg-sky-50 text-sky-700 border-sky-200'
    }
    if (t.includes('decreto')) {
      return 'bg-purple-50 text-purple-700 border-purple-200'
    }
    if (t.includes('resolução') || t.includes('resolucao')) {
      return 'bg-blue-50 text-blue-700 border-blue-200'
    }
    if (t.includes('portaria')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'
    }
    if (t.includes('ato')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  // Alterna item em um array de filtros
  const toggleFiltroArray = <K extends 'tiposAto' | 'esferas' | 'fontes' | 'incidencias'>(
    chave: K,
    valor: string,
  ) => {
    setFiltros((prev) => {
      const lista = (prev[chave] || []) as string[]
      const jaExiste = lista.includes(valor)
      const novaLista = jaExiste ? lista.filter((v) => v !== valor) : [...lista, valor]
      return {
        ...prev,
        [chave]: novaLista,
      }
    })
  }

  const limparTodosFiltros = () => {
    setFiltros(FILTROS_NORMAS_INICIAIS)
  }

  const totalAtivos = useMemo(() => contarFiltrosNormasAtivos(filtros), [filtros])

  const filteredNorms = useMemo(() => {
    return filtrarNormas(norms, filtros)
  }, [norms, filtros])

  return (
    <section id="secao-1" className="scroll-mt-24 space-y-4">
      {/* Cabeçalho da Seção com Identidade ADECONT */}
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50 shadow-xs">
              1
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Arcabouço normativo — todas as normas que compõem a reforma
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>
              Exibindo <strong>{filteredNorms.length}</strong> de <strong>{norms.length}</strong>{' '}
              atos oficiais
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
          Cada ato normativo abaixo traz: <strong>tipo de ato</strong>, data, órgão emissor, o que
          trata, link/download mediado e <strong>classificação de incidência IBS/CBS</strong>.
          Utilize o painel de filtros facetados institucional para restringir e cruzar dimensões.
        </p>

        {/* Barra de Ações: Botão Expandir Filtros + Limpar + Busca de Texto */}
        <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
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
                title="Expandir/recolher painel de filtros facetados"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-panorama-gold" />
                <span>Filtros de Normas</span>
                {totalAtivos > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-panorama-gold text-panorama-navy">
                    {totalAtivos}
                  </span>
                )}
              </button>

              {totalAtivos > 0 && (
                <button
                  type="button"
                  onClick={limparTodosFiltros}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                  title="Limpar todos os filtros selecionados"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar todos os filtros ({totalAtivos})</span>
                </button>
              )}

              {/* Seletor rápido de Esfera Federativa (Federal / Estadual / Municipal) */}
              <div className="hidden md:flex items-center gap-1 text-xs text-slate-600">
                <span className="font-semibold text-[11px] text-slate-500 ml-1">Esfera:</span>
                {OPCOES_ESFERAS_NORMA.map((esf) => {
                  const ativa = filtros.esferas.includes(esf.id)
                  return (
                    <button
                      key={esf.id}
                      type="button"
                      onClick={() => toggleFiltroArray('esferas', esf.id)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        ativa
                          ? 'bg-blue-700 text-white border-blue-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={esf.descricao}
                    >
                      {esf.sigla}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Campo de busca textual rápida dentro das normas */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={filtros.termo || ''}
                onChange={(e) => setFiltros((prev) => ({ ...prev, termo: e.target.value }))}
                placeholder="Filtrar por código ou tema..."
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-panorama-navy focus:ring-1 focus:ring-panorama-navy"
              />
              {filtros.termo && (
                <button
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, termo: '' }))}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Limpar busca textual"
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
                  Painel de Filtros Facetados das Normas
                </span>
                <span className="text-[11px] text-slate-500">
                  {totalAtivos > 0
                    ? `${totalAtivos} dimensão(ões) ativa(s)`
                    : 'Nenhum filtro aplicado'}
                </span>
              </div>

              {/* Grid de 4 dimensões combináveis: Tipo de Ato, Esfera, Fonte Oficial, Incidência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Tipo de Ato Normativo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      1. Tipo de Ato
                    </span>
                    {filtros.tiposAto.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 rounded">
                        {filtros.tiposAto.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {OPCOES_TIPOS_ATO_NORMA.map((opt) => {
                      const ativo = filtros.tiposAto.includes(opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleFiltroArray('tiposAto', opt.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
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

                {/* 2. Esfera Federativa */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-600" />
                      2. Esfera Federativa
                    </span>
                    {filtros.esferas.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 rounded">
                        {filtros.esferas.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {OPCOES_ESFERAS_NORMA.map((esf) => {
                      const ativo = filtros.esferas.includes(esf.id)
                      return (
                        <button
                          key={esf.id}
                          type="button"
                          onClick={() => toggleFiltroArray('esferas', esf.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="truncate">
                            <span>{esf.label}</span>
                          </div>
                          {ativo ? (
                            <Check className="w-3.5 h-3.5 text-indigo-700 shrink-0 ml-1" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Fonte Oficial */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                      3. Fonte Oficial
                    </span>
                    {filtros.fontes.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 rounded">
                        {filtros.fontes.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto pr-1">
                    {OPCOES_FONTES_NORMA.map((fnt) => {
                      const ativo = filtros.fontes.includes(fnt.id)
                      return (
                        <button
                          key={fnt.id}
                          type="button"
                          onClick={() => toggleFiltroArray('fontes', fnt.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            ativo
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                          title={fnt.badge}
                        >
                          <span>{fnt.label}</span>
                          {ativo && <Check className="w-3 h-3 text-emerald-700" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Incidência IBS / CBS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-amber-600" />
                      4. Incidência IBS/CBS
                    </span>
                    {filtros.incidencias.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 rounded">
                        {filtros.incidencias.length}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                    {OPCOES_INCIDENCIA_NORMA.map((inc) => {
                      const ativo = filtros.incidencias.includes(inc.id)
                      return (
                        <button
                          key={inc.id}
                          type="button"
                          onClick={() => toggleFiltroArray('incidencias', inc.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{inc.label}</span>
                          {ativo ? (
                            <Check className="w-3.5 h-3.5 text-amber-800 shrink-0 ml-1" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHIPS DE FILTROS ATIVOS REMOVÍVEIS */}
          {totalAtivos > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Filtros ativos:</span>

              {filtros.termo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold">
                  <span>Termo: &ldquo;{filtros.termo}&rdquo;</span>
                  <button
                    type="button"
                    onClick={() => setFiltros((prev) => ({ ...prev, termo: '' }))}
                    className="hover:text-rose-600 cursor-pointer"
                    title="Remover filtro de termo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filtros.tiposAto.map((tipo) => (
                <span
                  key={`chip-tipo-${tipo}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-semibold"
                >
                  <span>Tipo: {tipo}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltroArray('tiposAto', tipo)}
                    className="hover:text-blue-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.esferas.map((esf) => (
                <span
                  key={`chip-esf-${esf}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-semibold"
                >
                  <span>
                    Esfera: {OPCOES_ESFERAS_NORMA.find((x) => x.id === esf)?.sigla || esf}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFiltroArray('esferas', esf as EsferaNormaId)}
                    className="hover:text-indigo-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.fontes.map((fnt) => (
                <span
                  key={`chip-fnt-${fnt}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-semibold"
                >
                  <span>Fonte: {fnt}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltroArray('fontes', fnt)}
                    className="hover:text-emerald-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.incidencias.map((incId) => (
                <span
                  key={`chip-inc-${incId}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold"
                >
                  <span>
                    Incidência:{' '}
                    {OPCOES_INCIDENCIA_NORMA.find((x) => x.id === incId)?.badge || incId}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFiltroArray('incidencias', incId)}
                    className="hover:text-amber-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={limparTodosFiltros}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table com coluna de Tipo de Ato */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
              <th className="py-3 px-3 w-40">Tipo de Ato</th>
              <th className="py-3 px-4 w-52">Norma / Código</th>
              <th className="py-3 px-3 w-28">Data</th>
              <th className="py-3 px-4">Tema / capítulos principais</th>
              <th className="py-3 px-4 w-44">Incidência IBS/CBS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Carregando normas oficiais da Reforma...
                </td>
              </tr>
            ) : filteredNorms.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-4 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <ShieldAlert className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      Nenhuma norma encontrada para os filtros selecionados
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Não localizamos atos normativos que correspondam simultaneamente à combinação
                      de tipo de ato, fonte oficial, esfera e incidência escolhida.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={limparTodosFiltros}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-panorama-gold" />
                        <span>Limpar todos os filtros ({totalAtivos})</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredNorms.map((norm) => {
                const normType = deduzirTipoAto(norm)
                const isPdf = norm.link_url && norm.link_url.endsWith('.pdf')
                const proxyDownloadUrl = getOfficialDocProxyUrl(norm.code || norm.id)
                const downloadFilename = isPdf
                  ? `${norm.code.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
                  : `${norm.code.replace(/[^a-zA-Z0-9]/g, '-')}.html`

                return (
                  <tr key={norm.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Coluna 1: Tipo de Ato & Origem */}
                    <td className="py-3 px-3 align-top">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeStyle(
                            normType,
                          )}`}
                        >
                          {normType}
                        </span>
                        {norm.origin && (
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {norm.origin}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Coluna 2: Código da Norma e Ação de Download Mediado */}
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setNormaModal(norm)}
                            className="group inline-flex items-center gap-1 font-bold text-panorama-gold-dark hover:text-panorama-navy transition-colors cursor-pointer text-left"
                            title={`Ver atalho do monitor legislativo e detalhes: ${norm.code}`}
                          >
                            <span className="group-hover:underline underline-offset-2">
                              {norm.code}
                            </span>
                          </button>

                          {/* Badge de atalho do Monitor Legislativo com ícone Eye */}
                          <a
                            href="#monitor-legislativo"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shrink-0"
                            title={`Atalho do Monitor Legislativo para ${norm.code} (Seção 12A)`}
                          >
                            <Eye className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>Atalho Monitor</span>
                            <ExternalLink className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          </a>
                        </div>

                        {/* Download mediado e atalhos auxiliares */}
                        <div className="flex items-center gap-2 text-[10px] flex-wrap">
                          <a
                            href={proxyDownloadUrl}
                            download={downloadFilename}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:underline font-medium"
                            title="Download mediado via domínio próprio Panorama ADECONT"
                          >
                            <FileDown className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>
                              {isPdf ? 'Download mediado (PDF)' : 'Download mediado (DOC)'}
                            </span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setNormaModal(norm)}
                            className="text-slate-400 hover:text-slate-700 hover:underline cursor-pointer"
                            title="Ver detalhes e atalhos"
                          >
                            • Detalhes
                          </button>
                        </div>

                        {norm.dou_date && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            DOU: {norm.dou_date}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Coluna 3: Data */}
                    <td className="py-3 px-3 align-top text-slate-600 whitespace-nowrap text-xs font-mono">
                      {norm.date}
                    </td>

                    {/* Coluna 4: Tema / Resumo */}
                    <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                      <div className="font-semibold text-slate-900 text-xs mb-0.5">
                        {norm.title}
                      </div>
                      <p className="text-xs text-slate-600">{norm.summary}</p>
                    </td>

                    {/* Coluna 5: Incidência IBS/CBS */}
                    <td className="py-3 px-4 align-top">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold border ${getBadgeStyle(
                          norm.status_incidence,
                        )}`}
                      >
                        {norm.status_incidence}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Warning Alert Note */}
      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          ⚠️ A LC 214/2025 é citada em fontes antigas como &quot;LC 214/2024&quot; (número do PLP
          68/2024). A referência correta é <strong>LC 214, de 16/01/2025</strong>.
        </div>
      </div>

      {/* Modal de Detalhes da Norma e Atalhos do Monitor Legislativo */}
      <Dialog open={!!normaModal} onOpenChange={(open) => !open && setNormaModal(null)}>
        <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
          {normaModal &&
            (() => {
              const mType = deduzirTipoAto(normaModal)
              const isPdf = normaModal.link_url && normaModal.link_url.endsWith('.pdf')
              const proxyDownloadUrl = getOfficialDocProxyUrl(normaModal.code || normaModal.id)
              const downloadFilename = isPdf
                ? `${normaModal.code.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
                : `${normaModal.code.replace(/[^a-zA-Z0-9]/g, '-')}.html`

              return (
                <div className="space-y-4">
                  <DialogHeader className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeStyle(mType)}`}
                      >
                        {mType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(normaModal.status_incidence)}`}
                      >
                        {normaModal.status_incidence}
                      </span>
                      {normaModal.origin && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          {normaModal.origin}
                        </span>
                      )}
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                      {normaModal.code} — {normaModal.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Data do ato: {normaModal.date}{' '}
                      {normaModal.dou_date ? `· Publicado no DOU em ${normaModal.dou_date}` : ''}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Badges de Documento e Atalhos do Monitor Legislativo */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Atalhos &amp; Acesso ao Documento
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Badge do documento com ícone do Monitor Legislativo */}
                      <a
                        href="#monitor-legislativo"
                        onClick={() => setNormaModal(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
                        title="Abrir linha do tempo e conexões no Monitor Legislativo (Seção 12A)"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Atalho do Monitor Legislativo</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                      </a>

                      {/* Download mediado seguro mantido */}
                      <a
                        href={proxyDownloadUrl}
                        download={downloadFilename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                        title="Download mediado via servidor ADECONT (anti-bloqueio)"
                      >
                        <FileDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Download mediado ({isPdf ? 'PDF' : 'DOC'})</span>
                      </a>

                      {normaModal.link_url && (
                        <a
                          href={normaModal.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors shadow-2xs"
                          title="Abrir página oficial na íntegra"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>Texto na Fonte</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Resumo da Norma */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Tema &amp; Capítulos Principais
                    </h4>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-2xs">
                      {normaModal.summary}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Panorama da Reforma Tributária • ADECONT</span>
                    <button
                      type="button"
                      onClick={() => setNormaModal(null)}
                      className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )
            })()}
        </DialogContent>
      </Dialog>
    </section>
  )
}
