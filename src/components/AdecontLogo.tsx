import React from 'react'

export interface AdecontLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'color' | 'white' | 'dark'
  showTagline?: boolean
  className?: string
}

/**
 * Logo Oficial ADECONT — Assessoria Contábil e Administrativa
 * Traçado vetorial fiel reproduzido a partir do logotipo oficial de alta resolução:
 * 1. Arco superior azul-marinho (#251A54) em forma de cúpula com pontas afiladas e curvatura precisa.
 * 2. Esfera central em degradê esférico com ponto de luz (#FFFFFF -> #7BC5EE -> #2C88CA -> #165691).
 * 3. Logotipia 'ADECONT' com corte moderno e geometria sólida.
 * 4. 'ASSESSORIA' com espaçamento largo entre caracteres e linha horizontal subjacente.
 * 5. Tagline oficial 'ASSESSORIA CONTÁBIL E ADMINISTRATIVA' (ou 'ADMINISTRATIVA, CONTÁBIL'),
 *    sem a palavra JURÍDICA conforme diretriz mandatória permanente do cliente.
 */
export function AdecontLogo({
  variant = 'color',
  showTagline = true,
  className = 'h-12 w-auto',
  ...props
}: AdecontLogoProps) {
  // Cores de acordo com a variante (color = oficial azul escuro #251A54, white = fundos escuros)
  const isWhite = variant === 'white'
  const brandDark = '#251A54'
  const primaryColor = isWhite ? '#FFFFFF' : brandDark
  const secondaryColor = isWhite ? '#CBD5E1' : '#2D205E'
  const ruleColor = isWhite ? '#94A3B8' : brandDark

  const id = React.useId().replace(/:/g, '')

  return (
    <svg
      viewBox="0 0 1000 560"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ADECONT Assessoria Contábil e Administrativa"
      role="img"
      {...props}
    >
      <defs>
        {/* Gradiente radial esférico com ponto de luz suave deslocado ao topo-centro */}
        <radialGradient id={`${id}-adecontSphere`} cx="48%" cy="42%" r="56%" fx="46%" fy="38%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="22%" stopColor="#A8DDF7" />
          <stop offset="55%" stopColor="#4FA8DC" />
          <stop offset="85%" stopColor="#1C75B7" />
          <stop offset="100%" stopColor="#145A91" />
        </radialGradient>

        {/* Suave sombra projetada pela esfera no fundo claro */}
        {!isWhite && (
          <filter id={`${id}-sphereGlow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1C75B7" floodOpacity="0.25" />
          </filter>
        )}
      </defs>

      {/* SÍMBOLO ADECONT: ARCO SUPERIOR + ESFERA */}
      <g id="adecont-simbolo">
        {/* Arco superior: forma de cúpula com pontas finas e curvatura característica */}
        <path
          d="M 120 370
             C 175 295, 230 200, 315 115
             C 385 45, 445 10, 500 0
             C 555 10, 615 45, 685 115
             C 770 200, 825 295, 880 370
             C 800 230, 735 150, 650 90
             C 585 45, 545 28, 500 28
             C 455 28, 415 45, 350 90
             C 265 150, 200 230, 120 370 Z"
          fill={primaryColor}
        />

        {/* Esfera central com gradiente tridimensional */}
        <circle
          cx="500"
          cy="215"
          r="58"
          fill={`url(#${id}-adecontSphere)`}
          filter={!isWhite ? `url(#${id}-sphereGlow)` : undefined}
        />
      </g>

      {/* LOGOTIPO ADECONT VETORIAL DE ALTA DEFINIÇÃO */}
      <g id="adecont-texto" fill={primaryColor}>
        {/* LETRA A: estilo estendido com corte angular moderno */}
        <path
          d="M 5 430
             L 55 350
             L 115 350
             L 142 430
             L 110 430
             L 100 400
             L 48 400
             L 36 430
             Z
             M 57 375
             L 92 375
             L 85 355
             L 65 355
             Z"
          fillRule="evenodd"
        />

        {/* LETRA D: cantos arredondados à direita e interior nítido */}
        <path
          d="M 155 350
             L 225 350
             C 255 350, 275 365, 275 390
             C 275 415, 255 430, 225 430
             L 155 430
             Z
             M 183 373
             L 183 407
             L 218 407
             C 235 407, 246 400, 246 390
             C 246 380, 235 373, 218 373
             Z"
          fillRule="evenodd"
        />

        {/* LETRA E: barra central e superior com corte limpo */}
        <path
          d="M 290 350
             L 375 350
             L 375 373
             L 318 373
             L 318 381
             L 368 381
             L 368 401
             L 318 401
             L 318 407
             L 375 407
             L 375 430
             L 290 430
             Z"
        />

        {/* LETRA C: abertura ampla e cantos externos ligeiramente facetados */}
        <path
          d="M 470 373
             L 448 373
             C 432 373, 420 380, 420 390
             C 420 400, 432 407, 448 407
             L 470 407
             L 470 430
             L 445 430
             C 410 430, 390 415, 390 390
             C 390 365, 410 350, 445 350
             L 470 350
             Z"
        />

        {/* LETRA O: proporções condizentes com C e D */}
        <path
          d="M 525 350
             C 560 350, 582 365, 582 390
             C 582 415, 560 430, 525 430
             C 490 430, 468 415, 468 390
             C 468 365, 490 350, 525 350
             Z
             M 525 373
             C 542 373, 553 380, 553 390
             C 553 400, 542 407, 525 407
             C 508 407, 497 400, 497 390
             C 497 380, 508 373, 525 373
             Z"
          fillRule="evenodd"
        />

        {/* LETRA N: traço diagonal com junção sólida */}
        <path
          d="M 598 350
             L 626 350
             L 674 407
             L 674 350
             L 702 350
             L 702 430
             L 674 430
             L 626 373
             L 626 430
             L 598 430
             Z"
        />

        {/* LETRA T: barra horizontal ampla no topo */}
        <path
          d="M 718 350
             L 815 350
             L 815 373
             L 780 373
             L 780 430
             L 753 430
             L 753 373
             L 718 373
             Z"
        />
      </g>

      {/* SUB-PALAVRA: 'A S S E S S O R I A' COM TRACKING EXCLUSIVO */}
      <g id="adecont-assessoria">
        <text
          x="500"
          y="472"
          textAnchor="middle"
          fill={primaryColor}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="36"
          fontWeight="900"
          letterSpacing="28"
          style={{ textTransform: 'uppercase' }}
        >
          A S S E S S O R I A
        </text>

        {/* Linha horizontal inferior precisa sob ASSESSORIA */}
        <line
          x1="5"
          y1="486"
          x2="995"
          y2="486"
          stroke={ruleColor}
          strokeWidth="3.2"
          strokeOpacity={isWhite ? '0.75' : '0.95'}
        />
      </g>

      {/* TAGLINE: 'ASSESSORIA CONTÁBIL E ADMINISTRATIVA' — SEM A PALAVRA JURÍDICA */}
      {showTagline && (
        <g id="adecont-tagline">
          <text
            x="500"
            y="534"
            textAnchor="middle"
            fill={secondaryColor}
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            fontSize="26"
            fontWeight="800"
            letterSpacing="12"
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
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      <AdecontLogo variant={variant} showTagline={false} className="h-full w-auto shrink-0" />
      <div className="flex flex-col justify-center leading-none">
        <span
          className={`font-black text-sm md:text-base tracking-widest ${
            isWhite ? 'text-white' : 'text-[#251A54]'
          }`}
        >
          ADECONT
        </span>
        <span
          className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase mt-0.5 ${
            isWhite ? 'text-blue-200' : 'text-[#3B2D77]'
          }`}
        >
          Assessoria Contábil e Administrativa
        </span>
      </div>
    </div>
  )
}
