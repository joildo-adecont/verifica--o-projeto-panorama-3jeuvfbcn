import { Link } from 'react-router-dom'
import { FileSpreadsheet } from 'lucide-react'

interface BotaoDocumentosFiscaisProps {
  variante?: 'header' | 'menu' | 'mobile'
  className?: string
  aoClicar?: () => void
}

/**
 * Botão de acesso ao módulo "Documentos Fiscais (NFes) & Agentes Especialistas".
 * Padrão ADECONT para uso em cabeçalhos, barras e menus.
 */
export function BotaoDocumentosFiscais({
  variante = 'header',
  className = '',
  aoClicar,
}: BotaoDocumentosFiscaisProps) {
  if (variante === 'menu') {
    return (
      <Link
        to="/nfes"
        onClick={aoClicar}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-950 hover:bg-purple-50/70 transition-colors border border-transparent hover:border-purple-200 group ${className}`}
        title="Documentos Fiscais (NFes) — Pipeline de XMLs e Análise com Agentes"
      >
        <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <FileSpreadsheet className="w-4 h-4 text-purple-200" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="truncate font-bold text-slate-900 group-hover:text-purple-900">
            Documentos Fiscais (NF-e)
          </span>
          <span className="text-[10px] text-purple-600 truncate">Pipeline & Agentes IA</span>
        </div>
      </Link>
    )
  }

  if (variante === 'mobile') {
    return (
      <Link
        to="/nfes"
        onClick={aoClicar}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-sm border border-purple-800 active:scale-[0.98] transition-all ${className}`}
        title="Documentos Fiscais (NFes) ADECONT"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <FileSpreadsheet className="w-4 h-4 text-purple-200" />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold truncate leading-tight">
              Documentos Fiscais (NFes)
            </span>
            <span className="text-[10px] text-purple-200 truncate font-medium">
              Pipeline & Agentes IA
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Variante 'header' (padrão)
  return (
    <Link
      to="/nfes"
      onClick={aoClicar}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shadow-xs border border-purple-700 hover:border-purple-300 group shrink-0 ${className}`}
      title="Pipeline de Documentos Fiscais (NF-e) — Upload em lote, produtos e análise por 3 Agentes"
      aria-label="Documentos Fiscais NFes"
    >
      <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0 border border-white/20 group-hover:bg-purple-500/30 transition-colors">
        <FileSpreadsheet className="w-3.5 h-3.5 text-purple-200" />
      </div>
      <span className="hidden sm:inline whitespace-nowrap">Documentos Fiscais (NF-e)</span>
      <span className="sm:hidden whitespace-nowrap">NF-e</span>
    </Link>
  )
}
