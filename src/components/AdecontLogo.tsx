import React from 'react'

export interface AdecontLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'color' | 'white' | 'dark'
  showTagline?: boolean
  className?: string
}

/**
 * Logo Oficial ADECONT — Assessoria Contábil e Administrativa
 * Reprodução vetorial fiel em altíssima resolução baseada no logotipo oficial:
 * 1. Arco azul-marinho profundo (#2B2160):
 *    - Nasce como ponta finíssima na parte inferior esquerda (desce até tocar a letra 'A')
 *    - Sobe em curva convexa larga formando pico arredondado no topo central
 *    - Desce afinando até ponta de agulha à direita, acima da letra 'T'
 *    - Curva interna côncava acompanhando o topo das letras
 * 2. Esfera circular central sob o pico:
 *    - Azul-claro (#4FA8DC -> #7EC8F0) com degradê radial suave e glow difuso branco no centro
 * 3. 'ADECONT': bold, sans-serif geométrica estendida, proporções largas e sólidas
 * 4. 'ASSESSORIA': caixa alta, tracking bem largo
 * 5. Linha horizontal fina separadora abaixo de ASSESSORIA, largura total
 * 6. Tagline oficial: 'ADMINISTRATIVA, CONTÁBIL' (sem a palavra proibida)
 */
export function AdecontLogo({
  variant = 'color',
  showTagline = true,
  className = 'h-12 w-auto',
  ...props
}: AdecontLogoProps) {
  const isWhite = variant === 'white'
  const brandDark = '#2E2260'
  const primaryColor = isWhite ? '#FFFFFF' : brandDark
  const secondaryColor = isWhite ? '#E2E8F0' : brandDark
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
        {/* Degradê radial suave da esfera: branco suave ao centro (#FFFFFF) -> azul celeste (#7EC8F0 -> #4FA8DC -> #2B80B9 -> #1B4E7A) */}
        <radialGradient id={`${id}-adecontSphere`} cx="49%" cy="46%" r="52%" fx="49%" fy="46%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="25%" stopColor="#AEE1FA" stopOpacity="0.98" />
          <stop offset="55%" stopColor="#7EC8F0" />
          <stop offset="78%" stopColor="#4FA8DC" />
          <stop offset="92%" stopColor="#2A7EB8" />
          <stop offset="100%" stopColor="#1B4F7D" />
        </radialGradient>
        {/* Glow branco difuso no centro da esfera (highlight suave não-duro) */}
        <filter id={`${id}-softCenterGlow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Sombra suave e atmosférica sob a esfera em variantes coloridas */}
        {!isWhite && (
          <filter id={`${id}-sphereShadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#1B4E7A" floodOpacity="0.3" />
          </filter>
        )}
      </defs>

      {/* SÍMBOLO ADECONT: ARCO + ESFERA */}
      <g id="adecont-simbolo">
        {/*
          Arco/swoosh azul-marinho:
          - Início na ponta esquerda inferior (x: 122, y: 370) onde tangencia a perna do A
          - Curva externa convexa: sobe larga até o pico arredondado no topo central (x: 500, y: 0)
          - Desce afinando até ponta de agulha à direita (x: 755, y: 283) sobre a letra T
          - Curva interna côncava: retorna contornando o espaço sob o pico (x: 500, y: 110) até a ponta esquerda
        */}
        <path
          d="M 122 370
             C 142 320, 206 182, 326 84
             C 388 34, 452 0, 500 0
             C 548 0, 612 34, 674 84
             C 718 120, 742 186, 755 283
             C 745 220, 715 156, 650 114
             C 592 76, 540 106, 500 110
             C 458 114, 404 80, 344 116
             C 246 174, 178 266, 122 370 Z"
          fill={primaryColor}
        />

        {/* Esfera circular central perfeitamente posicionada sob o pico do arco */}
        <circle
          cx="486"
          cy="216"
          r="59"
          fill={`url(#${id}-adecontSphere)`}
          filter={!isWhite ? `url(#${id}-sphereShadow)` : undefined}
        />

        {/* Ponto de luz / highlight difuso suave no centro da esfera */}
        <circle
          cx="486"
          cy="216"
          r="16"
          fill="#FFFFFF"
          opacity="0.82"
          filter={`url(#${id}-softCenterGlow)`}
        />
      </g>

      {/* TIPOGRAFIA ADECONT EM VETOR: Bold, sans-serif geométrica, proporções largas idênticas ao oficial */}
      <g id="adecont-letras" fill={primaryColor}>
        {/* LETRA A: triângulo geométrico largo e corte horizontal preciso */}
        <path
          d="M 68 350
             L 142 350
             L 142 430
             L 106 430
             L 106 408
             L 42 408
             L 24 430
             L 2 430
             L 68 350 Z
             M 64 380
             L 106 380
             L 106 368
             L 74 368
             Z"
          fillRule="evenodd"
        />

        {/* LETRA D: bloco geométrico curvo estendido */}
        <path
          d="M 156 350
             L 230 350
             C 264 350, 282 366, 282 390
             C 282 414, 264 430, 230 430
             L 156 430
             Z
             M 190 373
             L 190 407
             L 225 407
             C 244 407, 250 400, 250 390
             C 250 380, 244 373, 225 373
             Z"
          fillRule="evenodd"
        />

        {/* LETRA E: barras horizontais com cantos retos e barra central ligeiramente mais curta */}
        <path
          d="M 296 350
             L 404 350
             L 404 373
             L 330 373
             L 330 378
             L 396 378
             L 396 401
             L 330 401
             L 330 407
             L 404 407
             L 404 430
             L 296 430
             Z"
        />

        {/* LETRA C: abertura ampla à direita e cantos internos retos/quadrados conforme a tipografia original */}
        <path
          d="M 434 350
             L 512 350
             L 512 373
             L 468 373
             C 452 373, 444 380, 444 390
             C 444 400, 452 407, 468 407
             L 512 407
             L 512 430
             L 434 430
             C 416 430, 410 416, 410 390
             C 410 364, 416 350, 434 350
             Z"
        />

        {/* LETRA O: formato geométrico retangular estendido com cantos internos retos/quadrados */}
        <path
          d="M 548 350
             L 626 350
             C 644 350, 650 364, 650 390
             C 650 416, 644 430, 626 430
             L 548 430
             C 530 430, 524 416, 524 390
             C 524 364, 530 350, 548 350
             Z
             M 558 373
             C 552 373, 548 380, 548 390
             C 548 400, 552 407, 558 407
             L 616 407
             C 622 407, 626 400, 626 390
             C 626 380, 622 373, 616 373
             Z"
          fillRule="evenodd"
        />

        {/* LETRA N: pernas verticais largas e diagonal sólida com junção precisa */}
        <path
          d="M 664 350
             L 698 350
             L 758 407
             L 758 350
             L 790 350
             L 790 430
             L 756 430
             L 696 373
             L 696 430
             L 664 430
             Z"
        />

        {/* LETRA T: trave horizontal larga superior e perna central firme */}
        <path
          d="M 798 350
             L 960 350
             L 960 373
             L 896 373
             L 896 430
             L 862 430
             L 862 373
             L 798 373
             Z"
        />
      </g>

      {/* PALAVRA SUBORDINADA: 'A S S E S S O R I A' COM TRACKING LARGO */}
      <g id="adecont-assessoria">
        <text
          x="486"
          y="473"
          textAnchor="middle"
          fill={primaryColor}
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="35"
          fontWeight="900"
          letterSpacing="34"
          style={{ textTransform: 'uppercase' }}
        >
          A S S E S S O R I A
        </text>

        {/* Linha horizontal fina separadora abaixo de ASSESSORIA em largura total */}
        <line
          x1="2"
          y1="488"
          x2="970"
          y2="488"
          stroke={ruleColor}
          strokeWidth="3.2"
          strokeOpacity={isWhite ? '0.85' : '1'}
        />
      </g>

      {/* TAGLINE OFICIAL: 'ADMINISTRATIVA, CONTÁBIL' — TRACKING LARGO E SEM A PALAVRA PROIBIDA */}
      {showTagline && (
        <g id="adecont-tagline">
          <text
            x="486"
            y="534"
            textAnchor="middle"
            fill={secondaryColor}
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            fontSize="25"
            fontWeight="800"
            letterSpacing="16"
            style={{ textTransform: 'uppercase' }}
          >
            ADMINISTRATIVA, CONTÁBIL
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
            isWhite ? 'text-white' : 'text-[#2E2260]'
          }`}
        >
          ADECONT
        </span>
        <span
          className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase mt-0.5 ${
            isWhite ? 'text-blue-200' : 'text-[#3D317D]'
          }`}
        >
          Assessoria Administrativa, Contábil
        </span>
      </div>
    </div>
  )
}
