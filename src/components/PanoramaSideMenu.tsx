import { useState, useEffect } from 'react'
import { X, Search, ChevronRight } from 'lucide-react'
import { NAVEGACAO } from '@/components/navegacao'

/**
 * Menu lateral de acesso rápido do Panorama — agora lendo a NAVEGACAO única
 * (mesma lista do header; sem duplicação). Aparência e teclas mantidas.
 * Teclas de atalho: teclas 1..9, letras; "/" abre a busca; Esc fecha a gaveta.
 */

const ITENS = NAVEGACAO.map((n) => ({
  id: n.href,
  tecla: n.tecla,
  numero: n.numero || '',
  label: n.label,
  Icon: n.Icon,
  cor: n.cor,
  bg: n.bg,
  borda: n.borda,
}))

// Mapeia âncora → id real da seção no DOM (as seções usam ids sem "#")
const alvo = (id: string) => document.getElementById(id.replace('#', ''))

export function PanoramaSideMenu() {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState<string>('')
  const [filtro, setFiltro] = useState('')

  const visiveis = ITENS.filter(
    (i) => i.label.toLowerCase().includes(filtro.toLowerCase()) || i.numero === filtro,
  )

  // Teclas de atalho
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const digitando = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
      if (e.key === 'Escape') {
        setAberto(false)
        return
      }
      if (digitando) return
      if (e.key === '/') {
        e.preventDefault()
        const busca = document.querySelector<HTMLInputElement>('input[type="text"]')
        if (busca) busca.focus()
        return
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const item = ITENS.find((i) => i.tecla === e.key.toLowerCase())
      if (item) {
        e.preventDefault()
        setAberto(false)
        const el = alvo(item.id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Destaca a seção visível durante a rolagem
  useEffect(() => {
    const ids = ITENS.map((i) => i.id.replace('#', ''))
    const onScroll = () => {
      let atual = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < 160) atual = id
      }
      setAtivo(atual)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const ir = (item: (typeof ITENS)[number]) => {
    setAberto(false)
    const el = alvo(item.id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const conteudo = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Acesso rápido
          </span>
          <button
            onClick={() => setAberto(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-700"
            aria-label="Fechar menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar seções… (tecla / busca o conteúdo)"
            className="w-full pl-8 pr-2 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 leading-snug">
          Atalhos: teclas <b>1–9</b> e letras · <b>/</b> foca a busca · <b>Esc</b> fecha
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {visiveis.map((item) => {
          const { Icon } = item
          const isAtivo = ativo === item.id.replace('#', '')
          return (
            <button
              key={item.id}
              onClick={() => ir(item)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                isAtivo
                  ? 'bg-panorama-gold/10 text-panorama-gold-dark border-l-2 border-panorama-gold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-panorama-gold-dark border-l-2 border-transparent'
              }`}
              title={`Tecla de atalho: ${item.tecla.toUpperCase()} — ${item.label}`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-md border ${item.bg} ${item.borda} ${item.cor}`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 leading-tight">{item.label}</span>
              <kbd
                className={`inline-flex items-center px-1 rounded text-[10px] font-mono ${
                  isAtivo
                    ? 'bg-panorama-gold/20 text-panorama-gold-dark'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {item.tecla.toUpperCase()}
              </kbd>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
            </button>
          )
        })}
        {!visiveis.length && (
          <p className="px-3 py-4 text-xs text-slate-400">Nenhuma seção encontrada.</p>
        )}
      </nav>

      <div className="px-3 py-2.5 border-t border-slate-200 text-[11px] text-slate-400">
        Panorama Reforma Tributária · ADECONT
      </div>
    </div>
  )

  return (
    <>
      {/* Menu fixo lateral — somente telas grandes */}
      <aside className="hidden lg:block fixed left-0 top-[64px] bottom-0 w-64 bg-white border-r border-slate-200 z-40 shadow-sm border-t-2 border-t-panorama-gold/60">
        {conteudo}
      </aside>

      {/* Botão flutuante para abrir a gaveta (telas menores) */}
      <button
        onClick={() => setAberto(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 bg-panorama-navy hover:bg-panorama-navy-light text-panorama-gold-light text-xs font-bold px-4 py-3 rounded-full shadow-lg border border-panorama-gold/40"
        aria-label="Abrir menu de seções"
      >
        ☰ Seções
      </button>

      {/* Gaveta — telas menores */}
      {aberto && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setAberto(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl">{conteudo}</div>
        </div>
      )}
    </>
  )
}
