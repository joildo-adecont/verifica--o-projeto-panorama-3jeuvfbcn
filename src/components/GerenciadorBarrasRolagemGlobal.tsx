import { useCallback, useEffect, useRef, useState } from 'react'
import { BarraRolagemHorizontalFixa } from './BarraRolagemHorizontalFixa'

/**
 * GerenciadorBarrasRolagemGlobal — estende a barra de rolagem horizontal fixa
 * (modelo aprovado na 0.0.763 em /cadastro-clientes) a TODO o sistema sem tocar
 * em cada tela.
 *
 * Como funciona:
 *  - Varre o DOM procurando containers `.overflow-x-auto` / `.overflow-x-scroll`
 *    VISÍVEIS que contenham uma <table> e realmente transbordem na horizontal.
 *  - Monta UMA ÚNICA BarraRolagemHorizontalFixa (a mesma da 0.0.763, intacta)
 *    apontando para o container escolhido, com prioridade para tabelas dentro
 *    de modal aberto (role="dialog") e, fora deles, para o maior overflow.
 *  - Um MutationObserver + resize + varredura periódica reavaliam o alvo quando
 *    a página troca de aba, pagina, filtra, abre/fecha modal ou muda de rota.
 *  - Sem candidato com overflow, nenhuma barra fica órfã no rodapé (o próprio
 *    componente se oculta, e o gerenciador zera o alvo).
 *
 * Exceções: containers marcados com `data-barra-rolagem-propria` (ex.: a
 * listagem de /cadastro-clientes, que já renderiza a própria barra aprovada)
 * são ignorados para nunca existirem duas barras para a mesma tabela.
 */

const SELETOR_CONTAINERS = '.overflow-x-auto, .overflow-x-scroll, [data-sys-scroll]'
const INTERVALO_VARREDURA_MS = 2000
const DEBOUNCE_MUTACAO_MS = 200

function estaVisivel(el: HTMLElement): boolean {
  return el.getClientRects().length > 0
}

function temOverflow(el: HTMLElement): boolean {
  return el.scrollWidth > el.clientWidth + 1
}

/** Escolhe o container que merece a barra agora (ou null). */
function acharContainerAtivo(): HTMLElement | null {
  const candidatos = Array.from(document.querySelectorAll<HTMLElement>(SELETOR_CONTAINERS))
  const validos: HTMLElement[] = []
  for (const el of candidatos) {
    if (el.hasAttribute('data-barra-rolagem-propria')) continue // página cuida da própria barra
    if (!estaVisivel(el)) continue // escondido (aba inativa, accordion fechado)
    if (!el.querySelector('table')) continue // só tabelas/grids largos
    if (!temOverflow(el)) continue // cabe na tela: nenhuma barra (o componente também ocultaria)
    validos.push(el)
  }
  if (validos.length === 0) return null
  // Prioridade 1: tabela dentro de modal aberto (o que o usuário está manipulando)
  const emModal = validos.find((el) => el.closest('[role="dialog"]'))
  if (emModal) return emModal
  // Prioridade 2: o container com maior transbordo (tabela principal da página)
  return validos.reduce((melhor, el) =>
    el.scrollWidth - el.clientWidth > melhor.scrollWidth - melhor.clientWidth ? el : melhor,
  )
}

export function GerenciadorBarrasRolagemGlobal() {
  const alvoRef = useRef<HTMLDivElement | null>(null)
  const ultimoAlvoRef = useRef<HTMLElement | null>(null)
  const [chave, setChave] = useState(0)

  const escanear = useCallback(() => {
    const alvo = acharContainerAtivo()
    if (alvo === ultimoAlvoRef.current) return
    ultimoAlvoRef.current = alvo
    alvoRef.current = (alvo as HTMLDivElement | null) ?? null
    // chave nova força remontagem da barra: os listeners/observer do componente
    // precisam ser reanexados ao NOVO container (e a medir roda no mount)
    setChave((c) => c + 1)
  }, [])

  useEffect(() => {
    // primeira varredura após o paint inicial da rota
    const t0 = window.setTimeout(escanear, 0)

    // mudanças no DOM (troca de aba, paginação, filtros, modais, navegação)
    let timer: number | null = null
    const agendar = () => {
      if (timer !== null) return
      timer = window.setTimeout(() => {
        timer = null
        escanear()
      }, DEBOUNCE_MUTACAO_MS)
    }
    const observador = new MutationObserver(agendar)
    observador.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('resize', agendar)
    const intervalo = window.setInterval(escanear, INTERVALO_VARREDURA_MS)

    return () => {
      window.clearTimeout(t0)
      if (timer !== null) window.clearTimeout(timer)
      observador.disconnect()
      window.removeEventListener('resize', agendar)
      window.clearInterval(intervalo)
      ultimoAlvoRef.current = null
      alvoRef.current = null
    }
  }, [escanear])

  // A barra em si é EXATAMENTE a da 0.0.763: mesma sincronia bidirecional,
  // arraste, clique na trilha, roda do mouse, reserva no pé e auto-ocultação.
  return <BarraRolagemHorizontalFixa key={chave} alvoRef={alvoRef} chaveRecalculo={chave} />
}
