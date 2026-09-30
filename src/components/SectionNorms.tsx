import { useState } from 'react'
import { ExternalLink, AlertTriangle, Filter, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TaxNormItem } from '@/types/panorama'

interface SectionNormsProps {
  norms: TaxNormItem[]
  loading?: boolean
}

export function SectionNorms({ norms, loading }: SectionNormsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('TODOS')

  const filterOptions = [
    'TODOS',
    'INCIDE',
    'NÃO INCIDE',
    'PARCIAL/REGIME ESPECÍFICO',
    'INCIDE',
    'NÃO INCIDE',
    'PARCIAL/REGIME ESPECÍFICO',
    'ISENTO/IMUNE',
  ]

  const getBadgeStyle = (status: string) => {
    const s = status.toUpperCase()
    if (s.includes('CRIA') || s.includes('REGULA A INCIDÊNCIA') || s.includes('INCIDE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
    if (s.includes('NÃO INCIDE')) {
      return 'bg-rose-100 text-rose-800 border-rose-300'
    }
    if (s.includes('PARCIAL') || s.includes('ESPECÍFICO')) {
      return 'bg-amber-100 text-amber-800 border-amber-300'
    }
    if (s.includes('ISENTO') || s.includes('IMUNE')) {
      return 'bg-blue-100 text-blue-800 border-blue-300'
    }
    if (s.includes('REGULA A CBS') || s.includes('REGULA O IBS') || s.includes('ADMINISTRAÇÃO')) {
      return 'bg-purple-100 text-purple-800 border-purple-300'
    }
    return 'bg-slate-100 text-slate-800 border-slate-300'
  }

  const filteredNorms = norms.filter((norm) => {
    if (selectedFilter === 'TODOS') return true
    const s = norm.status_incidence.toUpperCase()
    if (selectedFilter === 'INCIDE') {
      return s.includes('CRIA') || s.includes('REGULA A INCIDÊNCIA') || s.includes('INCIDE')
    }
    if (selectedFilter === 'NÃO INCIDE') return s.includes('NÃO INCIDE')
    if (selectedFilter === 'PARCIAL/REGIME ESPECÍFICO') {
      return s.includes('ESPECÍFICO') || s.includes('PARCIAL')
    }
    if (selectedFilter === 'ISENTO/IMUNE') {
      return s.includes('ISENTO') || s.includes('IMUNE')
    }
    return true
  })

  return (
    <section id="secao-1" className="scroll-mt-24 space-y-4">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs">
            1
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Arcabouço normativo — todas as normas que compõem a reforma
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
          Cada norma abaixo traz: tipo, data, o que trata e <strong>onde incidem IBS/CBS</strong>.
          Classificação:
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedFilter(opt)}
              className={`text-[11px] px-2.5 py-1 rounded font-bold transition-colors border ${
                selectedFilter === opt
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-3 px-4 w-44">Norma</th>
              <th className="py-3 px-3 w-28">Data</th>
              <th className="py-3 px-4">Tema / capítulos principais</th>
              <th className="py-3 px-4 w-44">Incidência IBS/CBS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Carregando normas oficiais da Reforma...
                </td>
              </tr>
            ) : filteredNorms.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Nenhuma norma encontrada para este filtro.
                </td>
              </tr>
            ) : (
              filteredNorms.map((norm) => (
                <tr key={norm.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 align-top">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      {norm.code}
                      {norm.link_url && (
                        <a
                          href={norm.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="Abrir no Planalto / Diário Oficial"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {norm.dou_date && (
                      <span className="text-[11px] text-slate-500 block">
                        (DOU {norm.dou_date})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 align-top text-slate-600 whitespace-nowrap">
                    {norm.date}
                  </td>
                  <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                    {norm.summary}
                  </td>
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
              ))
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
