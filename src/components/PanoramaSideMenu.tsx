import { useState, useEffect } from 'react'
import {
  X,
  Search,
  ChevronRight,
  Scale,
  Factory,
  ShoppingBasket,
  ShieldCheck,
  Percent,
  Layers,
  Paperclip,
  CalendarDays,
  Database,
  Globe2,
  ListChecks,
  History,
  Table2,
  Home,
  Tractor,
  Handshake,
  Landmark,
  Smartphone,
  Printer,
} from 'lucide-react'

/**
 * Menu lateral de acesso rápido do Panorama.
 * - Fixo à esquerda em telas grandes (lg+); gaveta em telas menores.
 * - Teclas de atalho: teclas 1..9, Q, W e H acessam as seções; "/" abre a
 *   busca do header; Esc fecha a gaveta.
 * - Destaca a seção visível conforme a rolagem da página.
 * - Mesmos ícones coloridos do menu principal (identidade visual por seção).
 */

interface MenuItem {
  id: string
  tecla: string
  numero: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
}

const ITENS: MenuItem[] = [
  {
    id: '#secao-1',
    tecla: '1',
    numero: '1',
    label: 'Normas (arcabouço)',
    Icon: Scale,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
  },
  {
    id: '#secao-2',
    tecla: '2',
    numero: '2',
    label: 'Fato Gerador',
    Icon: Factory,
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
  },
  {
    id: '#secao-3',
    tecla: '3',
    numero: '3',
    label: 'Cesta Básica',
    Icon: ShoppingBasket,
    cor: 'text-emerald-600',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
  },
  {
    id: '#secao-4',
    tecla: '4',
    numero: '4',
    label: 'Imunidades',
    Icon: ShieldCheck,
    cor: 'text-teal-600',
    bg: 'bg-teal-50',
    borda: 'border-teal-200',
  },
  {
    id: '#secao-5',
    tecla: '5',
    numero: '5',
    label: 'Isenções e Alíquotas',
    Icon: Percent,
    cor: 'text-amber-600',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
  },
  {
    id: '#secao-6',
    tecla: '6',
    numero: '6',
    label: 'Regimes Específicos',
    Icon: Layers,
    cor: 'text-orange-600',
    bg: 'bg-orange-50',
    borda: 'border-orange-200',
  },
  {
    id: '#regime-imobiliario',
    tecla: 'I',
    numero: '6A',
    label: 'Regime Imobiliário',
    Icon: Home,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
  },
  {
    id: '#agronegocio',
    tecla: 'G',
    numero: '6B',
    label: 'Agronegócio',
    Icon: Tractor,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
  },
  {
    id: '#consorcios',
    tecla: 'C',
    numero: '6C',
    label: 'Consórcios',
    Icon: Handshake,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
  },
  {
    id: '#financeiros',
    tecla: 'F',
    numero: '6D',
    label: 'Financeiros',
    Icon: Landmark,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
  },
  {
    id: '#simples',
    tecla: 'P',
    numero: '6E',
    label: 'Simples Nacional',
    Icon: Percent,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
  },
  {
    id: '#profissionais-plataformas',
    tecla: 'R',
    numero: '6F',
    label: 'Profissionais e Plataformas',
    Icon: Smartphone,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
  },
  {
    id: '#secao-7',
    tecla: '7',
    numero: '7',
    label: 'Anexos',
    Icon: Paperclip,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
  },
  {
    id: '#tabela-geral',
    tecla: 'A',
    numero: '7A',
    label: 'Tabela Geral dos Anexos',
    Icon: Table2,
    cor: 'text-rose-700',
    bg: 'bg-rose-100',
    borda: 'border-rose-300',
  },
  {
    id: '#secao-8',
    tecla: '8',
    numero: '8',
    label: 'Cronograma 2026–2033',
    Icon: CalendarDays,
    cor: 'text-cyan-600',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-200',
  },
  {
    id: '#secao-9',
    tecla: '9',
    numero: '9',
    label: 'Fontes & Atualização',
    Icon: Database,
    cor: 'text-violet-600',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
  },
  {
    id: '#fontes-agregador',
    tecla: 'q',
    numero: '11',
    label: 'Agregadores (Buscador NCM)',
    Icon: Globe2,
    cor: 'text-sky-600',
    bg: 'bg-sky-50',
    borda: 'border-sky-200',
  },
  {
    id: '#fontes-primarias',
    tecla: 'w',
    numero: '12',
    label: 'Fontes primárias (110 bases)',
    Icon: ListChecks,
    cor: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-200',
  },
  {
    id: '#assistentes-seguranca',
    tecla: 'x',
    numero: '15',
    label: 'Assistentes & Segurança',
    Icon: ShieldCheck,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
  },
  {
    id: '#central-entrega',
    tecla: 'e',
    numero: '14',
    label: 'Central de Entrega (imprimir/enviar)',
    Icon: Printer,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
  },
  {
    id: '#historico-atualizacoes',
    tecla: 'h',
    numero: '13',
    label: 'Histórico de Atualizações',
    Icon: History,
    cor: 'text-lime-600',
    bg: 'bg-lime-50',
    borda: 'border-lime-200',
  },
]

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

  const ir = (item: MenuItem) => {
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
          Atalhos: teclas <b>1–9</b>, <b>Q</b>, <b>W</b> e <b>H</b> · <b>/</b> foca a busca ·{' '}
          <b>Esc</b> fecha
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
                className={`hidden lg:inline-flex items-center px-1 rounded text-[10px] font-mono ${
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
