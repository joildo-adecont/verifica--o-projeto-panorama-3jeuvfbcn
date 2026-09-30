import React from 'react'

interface AdecontLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'color' | 'white' | 'dark'
  showTagline?: boolean
  className?: string
}

/**
 * Logo oficial ADECONT Assessoria Contábil e Administrativa
 * Recriado vetorialmente com máxima fidelidade à marca oficial:
 * - Arco/cúpula superior em azul-marinho (#0B1033)
 * - Esfera central em degradê azul-ciano com brilho radial (#29B6F6 -> #0288D1)
 * - Tipografia estilizada "ADECONT" com cantos suavemente facetados e traços característicos
 * - "ASSESSORIA" com espaçamento estendido entre letras
 * - Tagline "ASSESSORIA CONTÁBIL E ADMINISTRATIVA" (ou "CONTÁBIL E ADMINISTRATIVA" conforme solicitação)
 */
export function AdecontLogo({
  variant = 'color',
  showTagline = true,
  className = 'h-12 w-auto',
  ...props
}: AdecontLogoProps) {
  // Configuração de cores por variante
  const primaryColor = variant === 'white' ? '#FFFFFF' : '#0B1033'
  const secondaryColor = variant === 'white' ? '#E2E8F0' : '#1E293B'
  const accentLight = variant === 'white' ? '#93C5FD' : '#38BDF8'
  const accentMid = variant === 'white' ? '#60A5FA' : '#0284C7'
  const accentDark = variant === 'white' ? '#3B82F6' : '#0369A1'

  const idPrefix = React.useId().replace(/:/g, '')

  return (
    <svg
      viewBox="0 0 620 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ADECONT Assessoria Contábil e Administrativa"
      role="img"
      {...props}
    >
      <defs>
        {/* Gradiente da esfera azul-claro com ponto de luz central */}
        <radialGradient id={`${idPrefix}-sphereGrad`} cx="48%" cy="42%" r="54%" fx="46%" fy="38%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="25%" stopColor={accentLight} />
          <stop offset="65%" stopColor={accentMid} />
          <stop offset="100%" stopColor={accentDark} />
        </radialGradient>

        {/* Suave sombra da esfera */}
        <filter id={`${idPrefix}-sphereShadow`} x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284C7" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* SÍMBOLO: Arco/Olho superior */}
      <g id="simbolo">
        {/* Arco superior: forma de cúpula com ponta suave e abertura inferior elíptica */}
        <path
          d="M 80 188 
             C 150 92, 222 6, 310 2 
             C 398 6, 470 92, 540 188 
             C 460 52, 395 24, 310 24 
             C 225 24, 160 52, 80 188 Z"
          fill={primaryColor}
        />
        {/* Esfera azul-claro central */}
        <circle
          cx="310"
          cy="118"
          r="40"
          fill={`url(#${idPrefix}-sphereGrad)`}
          filter={`url(#${idPrefix}-sphereShadow)`}
        />{' '}
      </g>

      {/* LOGOTIPO: "ADECONT" com desenho geométrico característico */}
      <g id="texto-adecont" fill={primaryColor}>
        {/* A */}
        <path
          d="M 52 258 
             L 86 194 
             L 94 194 
             L 128 258 
             L 110 258 
             L 100 238 
             L 80 238 
             L 70 258 Z 
             M 85 224 
             L 95 224 
             L 90 211 Z"
          fillRule="evenodd"
        />

        {/* D */}
        <path
          d="M 138 194 
             L 174 194 
             C 192 194, 203 206, 203 226 
             C 203 246, 192 258, 174 258 
             L 138 258 Z 
             M 155 210 
             L 155 242 
             L 172 242 
             C 182 242, 187 236, 187 226 
             C 187 216, 182 210, 172 210 Z"
          fillRule="evenodd"
        />

        {/* E */}
        <path
          d="M 214 194 
             L 268 194 
             L 268 209 
             L 231 209 
             L 231 218 
             L 262 218 
             L 262 233 
             L 231 233 
             L 231 243 
             L 268 243 
             L 268 258 
             L 214 258 Z"
        />

        {/* C */}
        <path
          d="M 330 209 
             L 316 209 
             C 303 209, 296 215, 296 226 
             C 296 237, 303 243, 316 243 
             L 330 243 
             L 330 258 
             L 316 258 
             C 292 258, 279 245, 279 226 
             C 279 207, 292 194, 316 194 
             L 330 194 Z"
        />

        {/* O */}
        <path
          d="M 358 194 
             C 382 194, 395 207, 395 226 
             C 395 245, 382 258, 358 258 
             C 334 258, 321 245, 321 226 
             C 321 207, 334 194, 358 194 Z 
             M 358 210 
             C 347 210, 338 216, 338 226 
             C 338 236, 347 242, 358 242 
             C 369 242, 378 236, 378 226 
             C 378 216, 369 210, 358 210 Z"
          fillRule="evenodd"
        />

        {/* N */}
        <path
          d="M 406 194 
             L 423 194 
             L 451 238 
             L 451 194 
             L 468 194 
             L 468 258 
             L 451 258 
             L 423 214 
             L 423 258 
             L 406 258 Z"
        />

        {/* T */}
        <path
          d="M 479 194 
             L 541 194 
             L 541 209 
             L 519 209 
             L 519 258 
             L 501 258 
             L 501 209 
             L 479 209 Z"
        />
      </g>

      {/* SUB-PALAVRA: "ASSESSORIA" com tracking largo */}
      <g id="texto-assessoria">
        <text
          x="310"
          y="290"
          textAnchor="middle"
          fill={primaryColor}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="24"
          fontWeight="800"
          letterSpacing="18"
          style={{ textTransform: 'uppercase' }}
        >
          A S S E S S O R I A
        </text>

        {/* Linha horizontal decorativa sob assessoria */}
        <line
          x1="32"
          y1="298"
          x2="588"
          y2="298"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeOpacity={variant === 'white' ? '0.7' : '0.85'}
        />
      </g>

      {/* TAGLINE: "CONTÁBIL E ADMINISTRATIVA" (ou "ADMINISTRATIVA E CONTÁBIL" sem a palavra JURÍDICA) */}
      {showTagline && (
        <g id="tagline">
          <text
            x="310"
            y="326"
            textAnchor="middle"
            fill={secondaryColor}
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            fontSize="14.5"
            fontWeight="700"
            letterSpacing="6.5"
            style={{ textTransform: 'uppercase' }}
          >
            CONTÁBIL E ADMINISTRATIVA
          </text>
        </g>
      )}
    </svg>
  )
}

/**
 * Versão Badge / Emblema horizontal compacto para barras, headers e rodapés
 */
export function AdecontBadge({
  variant = 'color',
  className = 'h-10',
}: {
  variant?: 'color' | 'white' | 'dark'
  className?: string
}) {
  const isWhite = variant === 'white'
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <AdecontLogo variant={variant} showTagline={false} className="h-full w-auto shrink-0" />
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-black text-sm md:text-base tracking-wider ${
            isWhite ? 'text-white' : 'text-[#0B1033]'
          }`}
        >
          ADECONT
        </span>
        <span
          className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase mt-0.5 ${
            isWhite ? 'text-blue-200' : 'text-blue-800'
          }`}
        >
          Assessoria Contábil e Administrativa
        </span>
      </div>
    </div>
  )
}
