import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { cn } from '@/lib/utils'

/**
 * BarraRolagemHorizontalFixa — "sticky horizontal scrollbar" reutilizável.
 *
 * Espelha o scroll horizontal de um container com overflow-x (ex.: tabela larga)
 * numa barra FINA fixa no rodapé da viewport (position: fixed). Assim o usuário
 * não precisa rolar a página até o fim para deslocar as colunas.
 *
 * Sincronização BIDIRECIONAL e sem loop de eventos:
 *  - Arrastar a barra fixa define alvo.scrollLeft (evento "scroll" do alvo apenas
 *    RELÊ a posição — nunca reescreve scrollLeft, portanto não há realimentação).
 *  - Rolar a tabela pela barra nativa/shift+wheel atualiza a barra fixa.
 *  - O thumb reflete a proporção clientWidth/scrollWidth e se recalcula via
 *    ResizeObserver (resize da janela, mudança de colunas) e via `chaveRecalculo`
 *    (paginação, filtros, mudança de dados, troca de aba).
 *  - Sem overflow horizontal a barra não é renderizada.
 *
 * Reuso: basta passar um RefObject apontando para o div `.overflow-x-auto`.
 */

const ALTURA_BARRA_PX = 14
const ESPACO_RESERVA_PX = ALTURA_BARRA_PX + 6
const LARGURA_MINIMA_THUMB_PX = 36

interface BarraRolagemHorizontalFixaProps {
  /** Ref do container com overflow-x-auto que será controlado pela barra. */
  alvoRef: RefObject<HTMLDivElement | null>
  /** Qualquer valor que, ao mudar (dados, página, filtros), força nova medição. */
  chaveRecalculo?: unknown
  className?: string
}

export function BarraRolagemHorizontalFixa({
  alvoRef,
  chaveRecalculo,
  className,
}: BarraRolagemHorizontalFixaProps) {
  const [visivel, setVisivel] = useState(false)
  const [proporcaoThumb, setProporcaoThumb] = useState(1)
  const [posicao, setPosicao] = useState(0)

  const trilhaRef = useRef<HTMLDivElement>(null)
  const arrastandoRef = useRef(false)
  const inicioDragRef = useRef({ x: 0, scroll: 0 })

  /** Lê a geometria atual do container e atualiza a barra (somente leitura). */
  const medir = useCallback(() => {
    const alvo = alvoRef.current
    if (!alvo) {
      // Container desmontado (ex.: troca de aba): esconde a barra órfã
      setVisivel(false)
      return
    }
    const { scrollWidth, clientWidth, scrollLeft } = alvo
    const temOverflow = scrollWidth > clientWidth + 1
    setVisivel(temOverflow)
    if (!temOverflow) return
    setProporcaoThumb(Math.min(1, clientWidth / scrollWidth))
    const maxScroll = scrollWidth - clientWidth
    setPosicao(maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0)
  }, [alvoRef])

  // Observa o container e a tabela (largura muda com colunas/conteúdo) + resize da janela
  useEffect(() => {
    const alvo = alvoRef.current
    if (!alvo) return
    medir()
    alvo.addEventListener('scroll', medir, { passive: true })
    const observador = new ResizeObserver(medir)
    observador.observe(alvo)
    if (alvo.firstElementChild) observador.observe(alvo.firstElementChild)
    window.addEventListener('resize', medir)
    return () => {
      alvo.removeEventListener('scroll', medir)
      observador.disconnect()
      window.removeEventListener('resize', medir)
    }
  }, [alvoRef, medir])

  // Recalcula quando os dados/página/filtros mudam
  useEffect(() => {
    medir()
  }, [medir, chaveRecalculo])

  // Reserva espaço no fim da página para a barra fixa não cobrir o rodapé
  useEffect(() => {
    if (!visivel) return
    const anterior = document.body.style.paddingBottom
    document.body.style.paddingBottom = `${ESPACO_RESERVA_PX}px`
    return () => {
      document.body.style.paddingBottom = anterior
    }
  }, [visivel])

  // ---- Arraste do thumb (Pointer Events: mouse, toque e caneta) ----
  const handleThumbPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const alvo = alvoRef.current
    if (!alvo || e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    arrastandoRef.current = true
    inicioDragRef.current = { x: e.clientX, scroll: alvo.scrollLeft }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleThumbPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastandoRef.current) return
    const alvo = alvoRef.current
    const trilha = trilhaRef.current
    if (!alvo || !trilha) return
    const maxScroll = alvo.scrollWidth - alvo.clientWidth
    if (maxScroll <= 0) return
    const trilhaRect = trilha.getBoundingClientRect()
    const larguraThumbPx = Math.max(
      LARGURA_MINIMA_THUMB_PX,
      trilhaRect.width * (alvo.clientWidth / alvo.scrollWidth),
    )
    const trilhaUtil = Math.max(1, trilhaRect.width - larguraThumbPx)
    const deltaConteudo = ((e.clientX - inicioDragRef.current.x) / trilhaUtil) * maxScroll
    alvo.scrollLeft = Math.min(maxScroll, Math.max(0, inicioDragRef.current.scroll + deltaConteudo))
  }

  const encerrarDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastandoRef.current) return
    arrastandoRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // ---- Clique na trilha: leva o thumb até o ponto clicado ----
  const handleTrilhaPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return // clique no thumb: ignora (tratado acima)
    const alvo = alvoRef.current
    const trilha = trilhaRef.current
    if (!alvo || !trilha) return
    const rect = trilha.getBoundingClientRect()
    const fracao = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    alvo.scrollLeft = fracao * (alvo.scrollWidth - alvo.clientWidth)
  }

  // ---- Roda do mouse sobre a barra também rola a tabela na horizontal ----
  useEffect(() => {
    const trilha = trilhaRef.current
    if (!trilha || !visivel) return
    const handleWheel = (e: WheelEvent) => {
      const alvo = alvoRef.current
      if (!alvo) return
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return
      e.preventDefault()
      alvo.scrollLeft += delta
    }
    trilha.addEventListener('wheel', handleWheel, { passive: false })
    return () => trilha.removeEventListener('wheel', handleWheel)
  }, [alvoRef, visivel])

  if (!visivel) return null

  const larguraThumbPct = proporcaoThumb * 100
  const deslocamentoThumbPct = posicao * (1 - proporcaoThumb) * 100

  return (
    <div
      className={cn('fixed bottom-0 left-0 right-0 z-40 select-none', className)}
      style={{ height: ALTURA_BARRA_PX }}
      role="scrollbar"
      aria-orientation="horizontal"
      aria-label="Barra de rolagem horizontal fixa da tabela"
      aria-valuenow={Math.round(posicao * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        ref={trilhaRef}
        onPointerDown={handleTrilhaPointerDown}
        className="h-full w-full bg-slate-200/95 border-t border-slate-300 shadow-[0_-1px_3px_rgba(15,41,74,0.08)] backdrop-blur-sm cursor-pointer"
        title="Arraste para rolar a tabela horizontalmente"
      >
        <div
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handleThumbPointerMove}
          onPointerUp={encerrarDrag}
          onPointerCancel={encerrarDrag}
          style={{
            width: `max(${LARGURA_MINIMA_THUMB_PX}px, ${larguraThumbPct}%)`,
            marginLeft: `${deslocamentoThumbPct}%`,
          }}
          className="h-full rounded-full bg-[#0F294A]/75 hover:bg-[#0F294A] active:bg-[#0A1D34] transition-colors cursor-grab active:cursor-grabbing touch-none"
        />
      </div>
    </div>
  )
}
