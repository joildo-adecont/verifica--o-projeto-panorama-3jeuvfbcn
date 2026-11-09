import React from 'react'
import {
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Send,
  Globe,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { TipoCanalContato } from '@/types/clienteDadosComplementares'
import { formatarLinkContato } from '@/services/clienteDadosComplementaresService'

interface BotaoCanalContatoProps {
  tipo: TipoCanalContato
  identificador: string
  rotulo?: string
  nomeResponsavel?: string
  tamanho?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export const BotaoCanalContato: React.FC<BotaoCanalContatoProps> = ({
  tipo,
  identificador,
  rotulo,
  nomeResponsavel,
  tamanho = 'md',
  showText = false,
  className = '',
}) => {
  const link = formatarLinkContato(tipo, identificador)
  if (!link) return null

  // Configurações de cores e ícones conforme o canal
  let icon = <HelpCircle className="w-4 h-4" />
  let bgClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
  let labelPadrao = 'Contato'

  switch (tipo) {
    case 'email':
      icon = <Mail className="w-4 h-4 text-rose-600" />
      bgClass = 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200'
      labelPadrao = 'E-mail'
      break
    case 'whatsapp':
      icon = <MessageCircle className="w-4 h-4 text-emerald-600" />
      bgClass = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
      labelPadrao = 'WhatsApp'
      break
    case 'instagram':
      icon = <Instagram className="w-4 h-4 text-pink-600" />
      bgClass = 'bg-pink-50 text-pink-800 hover:bg-pink-100 border-pink-200'
      labelPadrao = 'Instagram'
      break
    case 'facebook':
      icon = <Facebook className="w-4 h-4 text-blue-600" />
      bgClass = 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200'
      labelPadrao = 'Facebook'
      break
    case 'linkedin':
      icon = <Linkedin className="w-4 h-4 text-sky-700" />
      bgClass = 'bg-sky-50 text-sky-800 hover:bg-sky-100 border-sky-200'
      labelPadrao = 'LinkedIn'
      break
    case 'telegram':
      icon = <Send className="w-4 h-4 text-cyan-600" />
      bgClass = 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200'
      labelPadrao = 'Telegram'
      break
    case 'site':
      icon = <Globe className="w-4 h-4 text-slate-600" />
      bgClass = 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200'
      labelPadrao = 'Website'
      break
  }

  const tooltip = [
    rotulo || labelPadrao,
    nomeResponsavel ? `Resp: ${nomeResponsavel}` : null,
    identificador,
  ]
    .filter(Boolean)
    .join(' • ')

  const sizeClasses =
    tamanho === 'sm'
      ? 'p-1.5 text-[11px]'
      : tamanho === 'lg'
        ? 'px-3 py-2 text-xs font-semibold'
        : 'p-2 text-xs'

  return (
    <a
      href={link}
      target={tipo === 'email' ? undefined : '_blank'}
      rel={tipo === 'email' ? undefined : 'noopener noreferrer'}
      className={`inline-flex items-center gap-1.5 rounded-lg border transition-all shadow-sm cursor-pointer ${bgClass} ${sizeClasses} ${className}`}
      title={tooltip}
      aria-label={tooltip}
    >
      {icon}
      {showText && (
        <span className="truncate max-w-[140px] font-medium">{rotulo || identificador}</span>
      )}
      {tipo !== 'email' && showText && <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />}
    </a>
  )
}
