import { useState, useEffect } from 'react'
import { X, Search, ChevronRight, ChevronDown } from 'lucide-react'
import { GRUPOS, HOME } from '@/components/navegacao'

/**
 * MENU LATERAL — agora AGRUPADO
 *
 * Antes: 24 itens em lista plana, com uma duplicata ("Fontes primárias" duas
 * vezes, uma dizendo 115 e outra 110 bases). Numa coluna estreita, 24 linhas do
 * mesmo peso visual não têm hierarquia: o olho não acha nada.
 *
 * Agora: os mesmos itens, com as mesmas teclas, organizados nos cinco grupos.
 * Cada grupo abre e fecha, e o que está aberto mostra os itens. Os grupos já
 * começam abertos quando não há filtro, para nada ficar escondido.
 */

const GRUPOS_UI = GRUPOS.map((g) => ({
  ...g,
  itens: g.itens.map((n) => ({
    id: n.href,
    tecla: n.tecla,
    numero: n.numero || '',
    label: n.label,
    Icon: n.Icon,
    cor: n.cor,
    bg: n.bg,
    borda: n.borda,
    tags: n.tags,
  })),
}))

const TODOS = GRUPOS_UI.flatMap((g) => g.itens)

// Mapeia âncora → id real da seção no DOM (as seções usam ids sem "#")
const alvo = (id: string) => document.getElementById(id.replace('#', ''))

export function PanoramaSideMenu() {
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState<string>('')
  const [filtro, setFiltro] = useState('')
  const [fechados, setFechados] = useState<Record<string, boolean>>({})

  const filtrando = filtro.trim() !== ''
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const gruposVisiveis = GRUPOS_UI.map((g) => {
    if (!filtrando) return { ...g, visiveis: g.itens }
    const t = norm(filtro)
    // filtro por rótulo, número e sinônimos (mesmas tags do painel inicial)
    const doGrupo = g.itens.filter((i) =>
      norm(`${i.label} ${i.numero} ${(i.tags || []).join(' ')}`).includes(t),
    )
    const grupoCasa = norm(g.nome).includes(t) || norm(g.proposito).includes(t)
    return { ...g, visiveis: grupoCasa && !doGrupo.length ? g.itens : doGrupo }
  }).filter((g) => g.visiveis.length > 0)

  // Teclas de atalho — inalteradas
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
      const item = TODOS.find((i) => i.tecla === e.key.toLowerCase())
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
    const ids = TODOS.map((i) => i.id.replace('#', ''))
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

  const ir = (item: { id: string }) => {
    setAberto(false)
    const el = alvo(item.id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const conteudo = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Navegação
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
            placeholder="Filtrar seções…"
            className="w-full pl-8 pr-2 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50"
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
          Teclas <b>1–9</b> e letras · <b>/</b> busca · <b>Esc</b> fecha
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-1.5">
        {/* Início */}
        <button
          onClick={() => ir({ id: HOME.href })}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] font-bold transition-colors ${
            ativo === '' || ativo === 'inicio'
              ? 'bg-panorama-gold/10 text-panorama-gold-dark border-l-2 border-panorama-gold'
              : 'text-slate-700 hover:bg-slate-100 border-l-2 border-transparent'
          }`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md border bg-slate-100 border-slate-300 text-slate-800">
            <HOME.Icon className="w-3.5 h-3.5" />
          </span>
          <span className="flex-1">Início</span>
          <kbd className="px-1 rounded text-[9px] font-mono bg-slate-100 text-slate-400">0</kbd>
        </button>

        {gruposVisiveis.map((g) => {
          const fechado = !filtrando && fechados[g.id]
          return (
            <div key={g.id} className="mt-1">
              <button
                onClick={() => setFechados((v) => ({ ...v, [g.id]: !v[g.id] }))}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-slate-50 cursor-pointer"
              >
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${fechado ? '-rotate-90' : ''}`}
                />
                <g.Icon className={`w-3.5 h-3.5 shrink-0 ${g.cor}`} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex-1">
                  {g.nome}
                </span>
                <span className="text-[9px] font-mono text-slate-400">{g.visiveis.length}</span>
              </button>

              {!fechado &&
                g.visiveis.map((item) => {
                  const { Icon } = item
                  const isAtivo = ativo === item.id.replace('#', '')
                  return (
                    <button
                      key={item.id}
                      onClick={() => ir(item)}
                      className={`w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-left text-[12px] font-semibold transition-colors ${
                        isAtivo
                          ? 'bg-panorama-gold/10 text-panorama-gold-dark border-l-2 border-panorama-gold'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-panorama-gold-dark border-l-2 border-transparent'
                      }`}
                      title={`Tecla ${item.tecla.toUpperCase()} — ${item.label}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md border ${item.bg} ${item.borda} ${item.cor}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="flex-1 leading-tight truncate">{item.label}</span>
                      <kbd
                        className={`px-1 rounded text-[9px] font-mono shrink-0 ${
                          isAtivo
                            ? 'bg-panorama-gold/20 text-panorama-gold-dark'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {item.tecla.toUpperCase()}
                      </kbd>
                    </button>
                  )
                })}
            </div>
          )
        })}

        {!gruposVisiveis.length && (
          <p className="px-3 py-4 text-xs text-slate-400">Nenhuma seção encontrada.</p>
        )}
      </nav>

      <div className="px-3 py-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Panorama · ADECONT</span>
        <a href="#inicio" className="hover:text-slate-700 font-bold">
          ↑ topo
        </a>
      </div>
    </div>
  )

  return (
    <>
      {/* Menu fixo lateral — somente telas grandes */}
      <aside className="hidden lg:block fixed left-0 top-[64px] bottom-0 w-60 bg-white border-r border-slate-200 z-40 shadow-sm border-t-2 border-t-panorama-gold/60">
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
