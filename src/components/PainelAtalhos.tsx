import { useState, useEffect } from 'react'
import { Keyboard, X } from 'lucide-react'
import { NAVEGACAO } from '@/components/navegacao'

/**
 * Painel de Atalhos (tecla "?") — SOMENTE apresentação.
 * Lista todas as teclas de atalho do sistema lendo a NAVEGACAO única.
 * Nenhuma função, cálculo ou dado é alterado.
 */
export function PainelAtalhos() {
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const digitando = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
      if (e.key === '?' && !digitando) {
        e.preventDefault()
        setAberto((v) => !v)
      }
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const atalhosFixos = [
    { tecla: '/', oque: 'Foca a busca geral' },
    { tecla: 'Esc', oque: 'Fecha painéis e limpa a busca' },
    { tecla: 'S', oque: 'Abre/fecha o menu do celular' },
  ]

  return (
    <>
      {/* Botão flutuante discreto (canto inferior esquerdo, acima do botão mobile) */}
      <button
        onClick={() => setAberto(true)}
        className="hidden lg:inline-flex fixed bottom-6 left-6 z-40 items-center justify-center w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm text-slate-500 hover:text-panorama-gold-dark hover:border-panorama-gold shadow-md border border-slate-200 transition-all hover:-translate-y-0.5"
        title="Ver todas as teclas de atalho (?)"
        aria-label="Painel de atalhos"
      >
        <Keyboard className="w-4 h-4" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setAberto(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border-t-4 border-panorama-gold">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-panorama-gold-dark" />
                Teclas de atalho do sistema
              </h3>
              <button
                onClick={() => setAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                Gerais
              </p>
              <ul className="space-y-1.5 mb-4">
                {atalhosFixos.map((a) => (
                  <li key={a.tecla} className="flex items-center gap-3 text-sm">
                    <kbd className="inline-flex items-center justify-center min-w-[34px] px-2 py-1 rounded-md border border-slate-300 bg-slate-100 text-xs font-mono font-bold text-slate-700">
                      {a.tecla}
                    </kbd>
                    <span className="text-slate-700">{a.oque}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                Ir para a seção ({NAVEGACAO.length} atalhos)
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {NAVEGACAO.map((n) => (
                  <li key={n.href} className="flex items-center gap-2.5 text-[13px]">
                    <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md border border-slate-300 bg-slate-100 text-[11px] font-mono font-bold text-slate-700">
                      {n.tecla.toUpperCase()}
                    </kbd>
                    <span className="text-slate-700 leading-tight">{n.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
              Pressione <b>?</b> a qualquer momento para reabrir · <b>Esc</b> fecha
            </div>
          </div>
        </div>
      )}
    </>
  )
}
