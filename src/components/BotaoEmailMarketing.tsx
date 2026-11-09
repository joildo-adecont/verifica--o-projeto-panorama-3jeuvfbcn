import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Sparkles } from 'lucide-react'

interface BotaoEmailMarketingProps {
  variante?: 'header' | 'mobile' | 'menu-lateral'
  aoClicar?: () => void
}

export function BotaoEmailMarketing({ variante = 'header', aoClicar }: BotaoEmailMarketingProps) {
  if (variante === 'header') {
    return (
      <Link
        to="/email-marketing"
        className="inline-flex min-h-[40px] items-center gap-1.5 rounded bg-sky-600/90 hover:bg-sky-600 text-white px-2.5 py-1 text-[11px] font-bold transition-all shadow-xs hover:shadow-sm"
        title="E-mail Marketing ADECONT — Integração Mailchimp e Sincronização de Clientes"
        onClick={aoClicar}
      >
        <Mail className="w-3.5 h-3.5 text-sky-200" />
        <span>E-mail Marketing</span>
      </Link>
    )
  }

  if (variante === 'mobile') {
    return (
      <Link
        to="/email-marketing"
        onClick={aoClicar}
        className="flex items-center justify-between text-xs font-semibold text-white bg-sky-700 hover:bg-sky-600 p-2.5 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-sky-200" />
          <span>E-mail Marketing (Mailchimp)</span>
        </div>
        <span className="text-[10px] bg-sky-800/80 px-1.5 py-0.5 rounded text-sky-200 uppercase font-bold tracking-wider">
          ADECONT
        </span>
      </Link>
    )
  }

  // menu-lateral
  return (
    <Link
      to="/email-marketing"
      onClick={aoClicar}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-sky-800 hover:bg-sky-50 transition-colors group"
      title="Acessar módulo de E-mail Marketing integrado ao Mailchimp"
    >
      <span className="w-6 h-6 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center group-hover:bg-sky-200 transition-colors">
        <Mail className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">E-mail Marketing</p>
        <p className="text-[10px] text-slate-500 truncate">Mailchimp & Campanhas</p>
      </div>
      <Sparkles className="w-3 h-3 text-sky-500 opacity-60" />
    </Link>
  )
}
