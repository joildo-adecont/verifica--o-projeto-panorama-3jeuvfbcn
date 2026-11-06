import { Link } from 'react-router-dom'
import { Users2, ExternalLink } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'

interface BotaoCadastroClientesProps {
  /**
   * 'header' = botão compacto com logo ADECONT no cabeçalho
   * 'menu' = item para menus laterais / drawers
   * 'mobile' = botão touch amigável para celular
   */
  variante?: 'header' | 'menu' | 'mobile'
  className?: string
  aoClicar?: () => void
}

/**
 * Ícone e Botão do Sistema para o "Cadastro Analítico de Clientes" da ADECONT.
 * Reutilizável em todos os módulos do Panorama (header, menu lateral, mobile, etc.).
 * Leva para a rota dedicada /cadastro-clientes.
 */
export function BotaoCadastroClientes({
  variante = 'header',
  className = '',
  aoClicar,
}: BotaoCadastroClientesProps) {
  if (variante === 'menu') {
    return (
      <Link
        to="/cadastro-clientes"
        onClick={aoClicar}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 transition-colors border border-transparent hover:border-slate-200 group ${className}`}
        title="Cadastro Analítico de Clientes ADECONT"
      >
        <div className="w-8 h-8 rounded-lg bg-[#0F294A] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
          <Users2 className="w-4 h-4 text-[#D4AF37]" />
        </div>
        <div className="flex flex-col text-left min-w-0">
          <span className="truncate font-bold text-slate-900 group-hover:text-[#0F294A]">
            Cadastro de Clientes
          </span>
          <span className="text-[10px] text-slate-400 truncate">
            Consulta analítica ADECONT
          </span>
        </div>
      </Link>
    )
  }

  if (variante === 'mobile') {
    return (
      <Link
        to="/cadastro-clientes"
        onClick={aoClicar}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#0F294A] to-[#1E3A5F] text-white shadow-sm border border-[#0F294A] active:scale-[0.98] transition-all ${className}`}
        title="Cadastro Analítico de Clientes ADECONT"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Users2 className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold truncate leading-tight">
              Cadastro de Clientes
            </span>
            <span className="text-[10px] text-[#D4AF37] truncate font-medium">
              Consulta analítica ADECONT
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
      to="/cadastro-clientes"
      onClick={aoClicar}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#0F294A] hover:bg-[#163b65] text-white px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shadow-xs border border-[#0F294A] hover:border-[#D4AF37]/50 group shrink-0 ${className}`}
      title="Cadastro Analítico de Clientes ADECONT (consulta, busca e relatório A4)"
      aria-label="Cadastro de Clientes ADECONT"
    >
      <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0 border border-white/20 group-hover:bg-[#D4AF37]/20 transition-colors">
        <Users2 className="w-3.5 h-3.5 text-[#D4AF37]" />
      </div>
      <span className="hidden sm:inline whitespace-nowrap">Cadastro de Clientes</span>
      <span className="sm:hidden whitespace-nowrap">Clientes</span>
    </Link>
  )
}
