import React from 'react'

export interface AdecontLogoProps {
  variant?: 'color' | 'white' | 'dark'
  showTagline?: boolean
  className?: string
}

/**
 * Logo Oficial ADECONT — Assessoria Administrativa, Contábil
 * Renderiza o PNG oficial (identico ao do Sistema ADECONT Financeiro):
 * arco azul-marinho + orbe azul-claro + "ADECONT" + "ASSESSORIA" +
 * linha separadora + "ADMINISTRATIVA, CONTÁBIL".
 *
 * variant="white" usa a versão branca do logo (fundo escuro).
 * showTagline=false exibe apenas o símbolo + "ADECONT ASSESSORIA".
 */
export function AdecontLogo({
  variant = 'color',
  showTagline = true,
  className = 'h-12 w-auto',
  ...props
}: AdecontLogoProps) {
  const src = variant === 'white' ? '/logo-adecont-branco.png' : '/logo-adecont.png'
  return (
    <img
      src={src}
      alt="ADECONT Assessoria Administrativa, Contábil"
      className={className}
      draggable={false}
      {...(props as React.ImgHTMLAttributes<HTMLImageElement>)}
    />
  )
}

/**
 * Versão Badge / Emblema horizontal compacto para barras, headers e rodapés.
 * Usa o PNG oficial; showTagline=false não se aplica ao PNG (tagline já embutida).
 */
export function AdecontBadge({
  variant = 'color',
  className = 'h-10',
}: {
  variant?: 'color' | 'white' | 'dark'
  className?: string
}) {
  const src = variant === 'white' ? '/logo-adecont-branco.png' : '/logo-adecont.png'
  return (
    <img
      src={src}
      alt="ADECONT Assessoria Administrativa, Contábil"
      className={`h-full w-auto ${className}`}
      draggable={false}
    />
  )
}
