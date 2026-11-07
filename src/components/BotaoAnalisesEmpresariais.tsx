import { Link } from 'react-router-dom'
import { BarChart3, ExternalLink } from 'lucide-react'

interface BotaoAnalisesEmpresariaisProps {
  /**
   * 'header' = botão compacto no cabeçalho
   * 'menu' = item para menus laterais / drawers
   * 'mobile' = botão touch amigável para celular
   */
  variante?: 'header' | 'menu' | 'mobile'
  className?: string
  aoClicar?: () => void
}

/**
 * Ícone e Botão de acesso ao módulo "Análises Empresariais" da ADECONT.
 * Reutilizável em cabeçalhos, barra de navegação, menu lateral e gaveta mobile.
 * Leva para a rota dedicada /analises-empresariais.
 */
export function BotaoAnalisesEmpresariais({
  variante = 'header',
  className = '',
  aoClicar,
}: BotaoAnalisesEmpresariaisProps) {
  if (variante === 'menu') {
    return (
      <Link
        to="/analises-empresariais"
        onClick={aoClicar}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-950 hover:bg-emerald-50/70 transition-colors border border-transparent hover:border-emerald-200 group ${className}`}
        title="Análises Empresariais — Módulo Administrativo ADECONT"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <BarChart3 className="w-4 h-4 text-emerald-200" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="truncate font-bold text-slate-900 group-hover:text-emerald-900">
            Análises Empresariais
          </span>
          <span className="text-[10px] text-emerald-700 truncate font-medium">
            Gestão & Indicadores Corporativos
          </span>
        </div>
      </Link>
    )
  }

  if (variante === 'mobile') {
    return (
      <Link
        to="/analises-empresariais"
        onClick={aoClicar}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-900 to-[#0F294A] text-white shadow-sm border border-emerald-800 active:scale-[0.98] transition-all ${className}`}
        title="Análises Empresariais ADECONT"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <BarChart3 className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold truncate leading-tight">Análises Empresariais</span>
            <span className="text-[10px] text-emerald-200 truncate font-medium">
              Gestão & Indicadores Corporativos
            </span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-white/70 shrink-0" />
      </Link>
    )
  }

  // Variante 'header' (padrão)
  return (
    <Link
      to="/analises-empresariais"
      onClick={aoClicar}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shadow-xs border border-emerald-700 hover:border-emerald-300 group shrink-0 ${className}`}
      title="Análises Empresariais ADECONT — Indicadores corporativos e diagnósticos empresariais"
      aria-label="Análises Empresariais"
    >
      <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0 border border-white/20 group-hover:bg-emerald-600/30 transition-colors">
        <BarChart3 className="w-3.5 h-3.5 text-emerald-200" />
      </div>
      <span className="hidden sm:inline whitespace-nowrap">Análises Empresariais</span>
      <span className="sm:hidden whitespace-nowrap">Análises</span>
    </Link>
  )
}
