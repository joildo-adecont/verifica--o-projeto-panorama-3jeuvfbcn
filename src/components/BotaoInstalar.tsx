import { useState, useEffect, useCallback } from 'react'
import { Download, Smartphone, Check, Share, X, MoreVertical } from 'lucide-react'

/**
 * BOTÃO DE INSTALAÇÃO DO APP (pedido do CEO, 02/11/2026)
 * "bem como o link para instalação, pronto para receber as atualizações."
 *
 * ── O PROBLEMA ──
 * Não existe "link de instalação" universal. Cada plataforma tem o seu caminho:
 *
 *   ANDROID/Chrome → existe o evento `beforeinstallprompt`, que abre a caixa
 *                    nativa "Instalar app". É o único caso com instalação em
 *                    um toque.
 *   iOS/Safari      → NÃO existe esse evento. A Apple obriga o usuário a tocar
 *                    em Compartilhar → "Adicionar à Tela de Início". Qualquer
 *                    botão que prometa instalação automática no iPhone está
 *                    mentindo. Aqui mostramos a instrução com o desenho certo.
 *   Já instalado    → o botão não aparece.
 *
 * ── COMO O BOTÃO APARECE SEM ATRAPALHAR ──
 * Ele flutua no canto, discreto, e some sozinho quando o app já está instalado
 * (display-mode: standalone). Não cobre conteúdo: fica acima da barra inferior
 * com margem de safe-area.
 */

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function jaInstalado(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS expõe isto em vez do display-mode
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function ehIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ se apresenta como Macintosh; o toque desmascara
  const iPadNovo = /Macintosh/.test(ua) && 'ontouchend' in document
  return iOS || iPadNovo
}

export function BotaoInstalar() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)
  const [instalado, setInstalado] = useState<boolean>(() => jaInstalado())
  const [mostrarIOS, setMostrarIOS] = useState(false)
  const [dispensado, setDispensado] = useState(false)

  useEffect(() => {
    const aoPoderInstalar = (e: Event) => {
      // impede o mini-infobar do Chrome: quem decide o momento é o usuário
      e.preventDefault()
      setEvento(e as EventoInstalacao)
    }
    const aoInstalar = () => setInstalado(true)

    window.addEventListener('beforeinstallprompt', aoPoderInstalar)
    window.addEventListener('appinstalled', aoInstalar)

    // se o usuário instalar por fora (menu do navegador), o estado acompanha
    const mq = window.matchMedia('(display-mode: standalone)')
    const aoMudar = () => setInstalado(jaInstalado())
    mq.addEventListener?.('change', aoMudar)

    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoderInstalar)
      window.removeEventListener('appinstalled', aoInstalar)
      mq.removeEventListener?.('change', aoMudar)
    }
  }, [])

  const instalar = useCallback(async () => {
    // iPhone não tem instalação programática: mostra o passo a passo
    if (ehIOS() && !evento) {
      setMostrarIOS(true)
      return
    }
    if (!evento) {
      // Android/desktop sem `beforeinstallprompt` (acontece quando o navegador
      // já instalou antes, quando é Firefox/Samsung Internet, ou quando o
      // critério de instalabilidade ainda não foi reconhecido). Em vez de
      // esconder o botão — o que deixava o CEO sem caminho — abrimos a mesma
      // instrução manual usada no iPhone, adaptada ao menu do navegador.
      setMostrarIOS(true)
      return
    }
    await evento.prompt()
    const escolha = await evento.userChoice
    if (escolha.outcome === 'accepted') setInstalado(true)
    setEvento(null)
  }, [evento])

  // já instalado (ou o usuário fechou) → não ocupa tela
  if (instalado || dispensado) return null

  /* O botão aparece SEMPRE que o app não está instalado. Antes ele dependia do
   * evento `beforeinstallprompt`, que não dispara em todos os navegadores nem
   * em todas as visitas — resultado: no Android do CEO o botão simplesmente não
   * existia. Agora, sem o evento, o toque abre a instrução manual. */
  const podeMostrar = true

  return (
    <>
      <div
        /* Posição: ACIMA do selo "Criado com o Skip", que o host fixa no canto
           inferior direito (18px de altura + ~14px de margem). Medido em
           02/11/2026: em bottom:14px o botão ficava exatamente sobre o selo.
           Aqui sobe para 52px + safe-area, e no desktop ancora no canto
           esquerdo, onde não há nada do host. */
        className="fixed z-40 right-3 bottom-[calc(env(safe-area-inset-bottom,0px)+52px)] flex items-center gap-2 rounded-full border border-panorama-gold/40 bg-panorama-navy px-3 py-2 shadow-lg shadow-black/30 print:hidden md:left-4 md:right-auto"
      >
        <button
          type="button"
          onClick={instalar}
          /* min-h-[44px]: alvo de toque mínimo recomendado (Apple HIG / Google).
             Medido antes: 18px de altura, abaixo do mínimo — difícil de acertar
             com o dedo. */
          className="flex min-h-[44px] items-center gap-2 px-1 text-[13px] font-semibold text-white"
          aria-label="Instalar o Panorama no celular"
        >
          <Download className="h-4 w-4 text-panorama-gold" />
          {/* em telas <380px só o ícone, para o botão não cobrir conteúdo */}
          <span className="hidden min-[380px]:inline">Instalar app</span>
        </button>
        <button
          type="button"
          onClick={() => setDispensado(true)}
          aria-label="Dispensar aviso de instalação"
          className="flex min-h-[44px] min-w-[32px] items-center justify-center text-white/50 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mostrarIOS && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 p-3 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Como instalar no iPhone"
          onClick={() => setMostrarIOS(false)}
        >
          <div
            className="w-full rounded-2xl border border-panorama-gold/40 bg-white p-5 shadow-2xl"
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-panorama-navy" />
                <h3 className="text-sm font-bold text-panorama-navy">
                  {ehIOS() ? 'Instalar no iPhone' : 'Instalar o aplicativo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarIOS(false)}
                aria-label="Fechar"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-[12px] leading-relaxed text-slate-600">
              {ehIOS()
                ? 'O iPhone não permite instalação automática. São três toques no Safari:'
                : 'Este navegador não abriu a instalação automática. Faça pelo menu dele:'}
            </p>

            <ol className="space-y-3 text-[12px] text-slate-700">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panorama-navy text-[10px] font-bold text-white">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Toque em
                  <Share className="h-4 w-4 text-blue-600" />
                  <b>Compartilhar</b>, na barra do Safari.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panorama-navy text-[10px] font-bold text-white">
                  2
                </span>
                <span>
                  Role e toque em <b>Adicionar à Tela de Início</b>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-panorama-navy text-[10px] font-bold text-white">
                  3
                </span>
                <span className="flex items-center gap-1.5">
                  Confirme em <b>Adicionar</b>. O ícone aparece na tela e o app abre em tela cheia.
                  <Check className="h-4 w-4 text-green-600" />
                </span>
              </li>
            </ol>

            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
              {ehIOS() ? (
                <>
                  <b className="text-slate-700">No Android é mais simples:</b> abra no Chrome e
                  toque em <MoreVertical className="inline h-3 w-3 align-middle" /> →{' '}
                  <b>Instalar aplicativo</b>.
                </>
              ) : (
                <>
                  <b className="text-slate-700">No Android/Chrome:</b> toque nos três pontos{' '}
                  <MoreVertical className="inline h-3 w-3 align-middle" /> →
                  <b> Instalar aplicativo</b> (ou “Adicionar à tela inicial”).
                  <br />
                  <b className="text-slate-700">No iPhone (Safari):</b>{' '}
                  <Share className="inline h-3 w-3 align-middle" /> Compartilhar →{' '}
                  <b>Adicionar à Tela de Início</b>.
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BotaoInstalar
