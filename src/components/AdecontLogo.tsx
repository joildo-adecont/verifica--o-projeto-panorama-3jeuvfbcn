import React, { useState } from 'react'

export interface AdecontLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: 'color' | 'white' | 'dark'
  showTagline?: boolean
  className?: string
}

/**
 * Logo Oficial ADECONT — Assessoria Contábil e Administrativa
 *
 * Utiliza o ativo visual oficial de alta fidelidade:
 * - variant="white": /logo-adecont-branco.png (com fallback seguro para SVG branco)
 * - variant="color" | "dark": /logo-adecont.png (com fallback seguro para SVG colorido)
 *
 * Inclui tratamento de erro com fallback vetorial inline garantindo que
 * o logo NUNCA fique quebrado ou invisível em qualquer tela ou impressão.
 */
export function AdecontLogo({
  variant = 'color',
  showTagline = true,
  className = 'h-12 w-auto',
  ...props
}: AdecontLogoProps) {
  const [hasError, setHasError] = useState(false)
  const isWhite = variant === 'white'

  // Se ambas as imagens falharem no carregamento, exibe fallback institucional inline estilizado
  if (hasError) {
    return (
      <div
        className={`inline-flex items-center gap-2.5 select-none print:flex ${className}`}
        role="img"
        aria-label="ADECONT — Assessoria Contábil e Administrativa"
      >
        <div
          className={`flex items-center justify-center rounded-xl px-2.5 py-1 font-serif font-black tracking-widest text-xs shadow-sm ${
            isWhite
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-[#0F294A] text-[#D4AF37] border border-[#D4AF37]/40'
          }`}
        >
          ADECONT
        </div>
        <div className="flex flex-col justify-center leading-tight text-left">
          <span
            className={`font-serif font-black tracking-wider text-xs ${
              isWhite ? 'text-white' : 'text-[#0F294A]'
            }`}
          >
            ADECONT
          </span>
          {showTagline && (
            <span
              className={`text-[8px] font-bold tracking-wider uppercase ${
                isWhite ? 'text-slate-200' : 'text-slate-600'
              }`}
            >
              Assessoria Contábil e Administrativa
            </span>
          )}
        </div>
      </div>
    )
  }

  const primarySrc = isWhite ? '/logo-adecont-branco.png' : '/logo-adecont.png'
  const fallbackSvg = isWhite ? '/logo-adecont-white.svg' : '/logo-adecont.svg'

  return (
    <img
      src={primarySrc}
      alt="ADECONT — Assessoria Contábil e Administrativa"
      className={`${className} object-contain print:inline-block`}
      draggable={false}
      loading="eager"
      decoding="async"
      onError={(e) => {
        const target = e.currentTarget
        // Tenta SVG se o PNG primário falhar
        if (target.src.endsWith('.png')) {
          target.src = fallbackSvg
        } else {
          setHasError(true)
        }
      }}
      {...props}
    />
  )
}

/**
 * Versão Badge / Emblema horizontal compacto para barras, headers, cards e rodapés.
 */
export function AdecontBadge({
  variant = 'color',
  className = 'h-10',
}: {
  variant?: 'color' | 'white' | 'dark'
  className?: string
}) {
  return <AdecontLogo variant={variant} className={`h-full w-auto ${className}`} />
}
