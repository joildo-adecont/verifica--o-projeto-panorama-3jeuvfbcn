import { useState } from 'react'
import { AlertTriangle, FileDown, Layers, Filter } from 'lucide-react'
import type { TaxNormItem } from '@/types/panorama'
import { getOfficialDocProxyUrl } from '@/services/panorama'

interface SectionNormsProps {
  norms: TaxNormItem[]
  loading?: boolean
}

export function SectionNorms({ norms, loading }: SectionNormsProps) {
  const [selectedIncidenceFilter, setSelectedIncidenceFilter] = useState<string>('TODOS')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('TODOS')

  const incidenceOptions = [
    'TODOS',
    'INCIDE',
    'NÃO INCIDE',
    'PARCIAL/REGIME ESPECÍFICO',
    'ISENTO/IMUNE',
  ]

  const typeOptions = [
    'TODOS',
    'Emenda Constitucional',
    'Lei Complementar',
    'Decreto',
    'Resolução',
    'Portaria Conjunta',
    'Ato Conjunto',
  ]

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

  // Dedução automática do tipo de ato se o campo norm_type ainda não estiver presente no registro
  const resolveNormType = (norm: TaxNormItem): string => {
    if (norm.norm_type) return norm.norm_type
    const code = norm.code.toUpperCase()
    if (code.startsWith('EC ') || code.includes('EMENDA')) return 'Emenda Constitucional'
    if (code.startsWith('LC ') || code.includes('LEI COMPLEMENTAR')) return 'Lei Complementar'
    if (code.startsWith('DECRETO')) return 'Decreto'
    if (code.includes('RESOLUÇÃO') || code.includes('RESOLUCAO') || code.startsWith('RES '))
      return 'Resolução'
    if (code.includes('PORTARIA')) return 'Portaria Conjunta'
    if (code.includes('ATO CONJUNTO')) return 'Ato Conjunto'
    return 'Outro'
  }

  const filteredNorms = norms.filter((norm) => {
    // 1. Filtro por tipo de ato normativo
    if (selectedTypeFilter !== 'TODOS') {
      const actualType = resolveNormType(norm)
      if (actualType !== selectedTypeFilter) {
        return false
      }
    }

    // 2. Filtro por classificação de incidência
    if (selectedIncidenceFilter === 'TODOS') return true
    const s = norm.status_incidence.toUpperCase()
    if (selectedIncidenceFilter === 'INCIDE') {
      return s.includes('CRIA') || s.includes('REGULA A INCIDÊNCIA') || s.includes('INCIDE')
    }
    if (selectedIncidenceFilter === 'NÃO INCIDE') return s.includes('NÃO INCIDE')
    if (selectedIncidenceFilter === 'PARCIAL/REGIME ESPECÍFICO') {
      return s.includes('ESPECÍFICO') || s.includes('PARCIAL')
    }
    if (selectedIncidenceFilter === 'ISENTO/IMUNE') {
      return s.includes('ISENTO') || s.includes('IMUNE')
    }
    return true
  })

  return (
    <section id="secao-1" className="scroll-mt-24 space-y-4">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            1
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Arcabouço normativo — todas as normas que compõem a reforma
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
          Cada ato normativo abaixo traz: <strong>tipo de ato</strong>, data, órgão emissor, o que
          trata, link/download mediado e <strong>classificação de incidência IBS/CBS</strong>.
        </p>

        {/* Linhas duplas de filtros: Tipo de Ato & Incidência */}
        <div className="space-y-2 mt-3 pt-2 border-t border-slate-100">
          {/* Filtro por Tipo de Ato Normativo */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Layers className="w-3 h-3 text-blue-600" />
              <span>Tipo de ato:</span>
            </span>
            {typeOptions.map((tOpt) => (
              <button
                key={tOpt}
                onClick={() => setSelectedTypeFilter(tOpt)}
                className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ${
                  selectedTypeFilter === tOpt
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {tOpt}
              </button>
            ))}
          </div>

          {/* Filtro por Incidência */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-slate-500" />
              <span>Incidência:</span>
            </span>
            {incidenceOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedIncidenceFilter(opt)}
                className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border cursor-pointer ${
                  selectedIncidenceFilter === opt
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
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
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Nenhuma norma encontrada para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredNorms.map((norm) => {
                const normType = resolveNormType(norm)
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
                        <a
                          href={proxyDownloadUrl}
                          download={downloadFilename}
                          className="group inline-flex items-center gap-1.5 font-bold text-panorama-gold-dark hover:text-panorama-navy transition-colors cursor-pointer"
                          title={`Baixar documento oficial: ${norm.code} (download mediado via domínio próprio Panorama ADECONT)`}
                        >
                          <span className="group-hover:underline underline-offset-2">
                            {norm.code}
                          </span>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-blue-100 transition-colors">
                            <FileDown className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{isPdf ? 'PDF' : 'DOC'}</span>
                          </span>
                        </a>

                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <a
                            href={proxyDownloadUrl}
                            download={downloadFilename}
                            className="hover:underline"
                            title="Download oficial com mediação e garantia ADECONT"
                          >
                            {isPdf ? 'PDF oficial mediado' : 'Texto oficial mediado'}
                          </a>
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
    </section>
  )
}
