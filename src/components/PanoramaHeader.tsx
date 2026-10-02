import { useState, useEffect, useCallback } from 'react'
import {
  RotateCw,
  Clock,
  ExternalLink,
  Search,
  Menu,
  X,
  FileText,
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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AdecontLogo } from '@/components/AdecontLogo'
import { fetchSourceStatuses, triggerSourceCheck } from '@/services/panorama'
import { useToast } from '@/hooks/use-toast'
import type { SourceStatusItem } from '@/types/panorama'

interface PanoramaHeaderProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  onManualRefresh?: () => void
}

// Itens do menu principal com tecla de atalho e ícone colorido
const NAV_LINKS = [
  {
    href: '#secao-1',
    label: 'Normas',
    tecla: '1',
    Icon: Scale,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
  },
  {
    href: '#secao-2',
    label: 'Fato Gerador',
    tecla: '2',
    Icon: Factory,
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
  },
  {
    href: '#secao-3',
    label: 'Cesta Básica',
    tecla: '3',
    Icon: ShoppingBasket,
    cor: 'text-emerald-600',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
  },
  {
    href: '#secao-4',
    label: 'Imunidades',
    tecla: '4',
    Icon: ShieldCheck,
    cor: 'text-teal-600',
    bg: 'bg-teal-50',
    borda: 'border-teal-200',
  },
  {
    href: '#secao-5',
    label: 'Isenções e Alíquotas',
    tecla: '5',
    Icon: Percent,
    cor: 'text-amber-600',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
  },
  {
    href: '#secao-6',
    label: 'Regimes Específicos',
    tecla: '6',
    Icon: Layers,
    cor: 'text-orange-600',
    bg: 'bg-orange-50',
    borda: 'border-orange-200',
  },
  {
    href: '#secao-7',
    label: 'Anexos',
    tecla: '7',
    Icon: Paperclip,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
  },
  {
    href: '#secao-8',
    label: 'Cronograma 2026–2033',
    tecla: '8',
    Icon: CalendarDays,
    cor: 'text-cyan-600',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-200',
  },
  {
    href: '#secao-9',
    label: 'Fontes & Atualização',
    tecla: '9',
    Icon: Database,
    cor: 'text-violet-600',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
  },
  {
    href: '#fontes-agregador',
    label: 'Agregadores (Buscador NCM)',
    tecla: 'q',
    Icon: Globe2,
    cor: 'text-sky-600',
    bg: 'bg-sky-50',
    borda: 'border-sky-200',
  },
  {
    href: '#fontes-primarias',
    label: 'Fontes primárias (110 bases)',
    tecla: 'w',
    Icon: ListChecks,
    cor: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-200',
  },
  {
    href: '#historico-atualizacoes',
    label: 'Histórico de Atualizações',
    tecla: 'h',
    Icon: History,
    cor: 'text-lime-600',
    bg: 'bg-lime-50',
    borda: 'border-lime-200',
  },
]

export function PanoramaHeader({
  searchTerm,
  setSearchTerm,
  onManualRefresh,
}: PanoramaHeaderProps) {
  const [isAutoOn, setIsAutoOn] = useState<boolean>(true)
  const [lastCheck, setLastCheck] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sources, setSources] = useState<SourceStatusItem[]>([])
  const { toast } = useToast()

  const loadSourceStatus = useCallback(async () => {
    const data = await fetchSourceStatuses()
    if (data && data.length > 0) {
      setSources(data)
      // Encontra a data da verificação mais recente entre as fontes
      const timestamps = data
        .map((s) => (s.last_checked_at ? new Date(s.last_checked_at).getTime() : 0))
        .filter((t) => !isNaN(t) && t > 0)

      if (timestamps.length > 0) {
        const latest = new Date(Math.max(...timestamps))
        setLastCheck(
          latest.toLocaleDateString('pt-BR') +
            ' às ' +
            latest.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        )
      } else {
        const now = new Date()
        setLastCheck(
          now.toLocaleDateString('pt-BR') +
            ' às ' +
            now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        )
      }
    } else {
      const now = new Date()
      setLastCheck(
        now.toLocaleDateString('pt-BR') +
          ' às ' +
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      )
    }
  }, [])

  useEffect(() => {
    loadSourceStatus()

    if (isAutoOn) {
      const interval = setInterval(loadSourceStatus, 60000 * 60) // a cada 1 hora
      return () => clearInterval(interval)
    }
  }, [isAutoOn, loadSourceStatus])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Dispara a verificação imediata via backend pb_hooks
      await triggerSourceCheck()
      // Recarrega o status atualizado do banco
      await loadSourceStatus()
      toast({
        title: 'Fontes verificadas com sucesso',
        description: 'Os servidores do CGIBS, Receita Federal e Planalto foram consultados.',
      })
      if (onManualRefresh) onManualRefresh()
    } catch (err) {
      console.error('Erro ao verificar fontes:', err)
      toast({
        title: 'Erro na verificação de fontes',
        description: 'Não foi possível completar a consulta imediata aos servidores oficiais.',
        variant: 'destructive',
      })
      await loadSourceStatus()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Identifica se alguma fonte está offline
  const allActive = sources.length === 0 || sources.every((s) => s.status === 'active')

  // Atalhos de teclado do menu principal: 1-9, Q, W e H saltam para a seção;
  // "/" foca a busca; "s" abre/fecha o menu mobile.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const digitando = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        return
      }
      if (digitando || e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key === '/') {
        e.preventDefault()
        const busca = document.querySelector<HTMLInputElement>('header input[type="text"]')
        if (busca) busca.focus()
        return
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        setMobileMenuOpen((v) => !v)
        return
      }
      const item = NAV_LINKS.find((l) => l.tecla === e.key.toLowerCase())
      if (item) {
        e.preventDefault()
        setMobileMenuOpen(false)
        const el = document.getElementById(item.href.replace('#', ''))
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Banner / Status Bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2 w-2 rounded-full ${
                allActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium text-slate-200">
              CGIBS & Receita Federal — Fontes Oficiais Ativas
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span
              className="hidden md:inline text-slate-300"
              title={sources.map((s) => `${s.name}: ${s.status} (${s.message || ''})`).join(' | ')}
            >
              Última verificação: {lastCheck || 'Carregando...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoOn(!isAutoOn)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isAutoOn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title="Verificação de disponibilidade da fonte oficial a cada 1 hora"
            >
              <Clock className="w-3 h-3" />
              <span>⏱️ Auto: {isAutoOn ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              title="Faz a verificação imediata das fontes"
            >
              <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>🔄 Atualizar agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo oficial da ADECONT Assessoria Administrativa, Contábil */}
            <a
              href="#"
              className="group flex items-center shrink-0 transition-opacity hover:opacity-90"
              title="ADECONT Assessoria Administrativa, Contábil"
            >
              <div className="bg-white rounded-lg p-1 border border-slate-200/80 shadow-xs flex items-center">
                <AdecontLogo
                  variant="color"
                  showTagline={true}
                  className="h-11 sm:h-13 md:h-14 w-auto max-w-[190px] sm:max-w-[230px] md:max-w-[250px]"
                />
              </div>
            </a>

            <div className="hidden sm:block h-10 w-px bg-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  Panorama da Reforma Tributária
                </h1>
                <Badge
                  variant="outline"
                  className="border-blue-600 text-blue-700 bg-blue-50 text-[10px] uppercase font-bold shrink-0 hidden md:inline-flex"
                >
                  IBS / CBS / IS
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-md">
                Guia Estruturado • LC 214/2025, LC 227/2026, Dec. 12.955 & Res. CGIBS 6/2026
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex items-center relative w-72">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar normas, regimes, alimentos…  (tecla /)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <a
              href="/panorama-reforma/envios.html"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded-md shadow-sm transition-colors"
              title="Cadastro de Clientes & Protocolo de Envios"
            >
              <span>📇 Cadastro & Envios</span>
            </a>
            <a
              href="/panorama-reforma/simulador.html"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-md shadow-sm transition-colors"
              title="Simulador Didático de Transição — regime atual vs IBS/CBS"
            >
              <span>🧮 Simulador</span>
            </a>
            <a
              href="https://planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Texto da LC 214</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href="#contato"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md shadow-sm transition-colors"
            >
              <span>Consultar Especialista</span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="mt-2.5 lg:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar em todo o Panorama…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50"
            />
          </div>
        </div>

        {/* Navigation Bar Links — fonte maior, ícones coloridos e teclas de atalho */}
        <nav className="mt-3 pt-2.5 border-t border-slate-100 hidden lg:flex items-center justify-between text-[13px] font-semibold text-slate-700 overflow-x-auto scrollbar-none gap-2">
          {NAV_LINKS.map((link) => {
            const { Icon } = link
            return (
              <a
                key={link.href}
                href={link.href}
                className={`group inline-flex items-center gap-1.5 whitespace-nowrap transition-colors py-1 px-1.5 rounded-md hover:${link.bg} hover:text-${link.cor}`}
                title={`Tecla de atalho: ${link.tecla.toUpperCase()} — ${link.label}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md border ${link.bg} ${link.borda} ${link.cor}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="leading-tight">{link.label}</span>
                <kbd className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded border border-slate-300 bg-slate-100 text-[9px] font-mono text-slate-500 group-hover:border-blue-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                  {link.tecla.toUpperCase()}
                </kbd>
              </a>
            )
          })}
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2 pb-2">
            {NAV_LINKS.map((link) => {
              const { Icon } = link
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 py-2 px-2 rounded hover:bg-slate-50"
                >
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-md border ${link.bg} ${link.borda} ${link.cor}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1">{link.label}</span>
                  <kbd className="inline-flex items-center justify-center min-w-[18px] h-5 px-1 rounded border border-slate-300 bg-slate-100 text-[10px] font-mono text-slate-500">
                    {link.tecla.toUpperCase()}
                  </kbd>
                </a>
              )
            })}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="/panorama-reforma/simulador.html"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-xs font-semibold text-white bg-emerald-600 p-2 rounded"
              >
                <span>🧮 Simulador de Transição</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="/panorama-reforma/envios.html"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-xs font-semibold text-white bg-amber-600 p-2 rounded"
              >
                <span>📇 Cadastro & Envios</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs text-slate-600 bg-slate-100 p-2 rounded"
              >
                <span>Texto Oficial da LC 214/2025</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="#contato"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs font-bold text-white bg-blue-600 p-2 rounded"
              >
                Enviar Dúvida / Solicitar Parecer
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
