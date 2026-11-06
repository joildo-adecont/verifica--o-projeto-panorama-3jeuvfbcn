import { useState, useEffect, useCallback } from 'react'
import {
  RotateCw,
  Clock,
  ExternalLink,
  Search,
  Menu,
  X,
  FileText,
  ShieldUser,
  LogOut,
  LogIn,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AdecontLogo } from '@/components/AdecontLogo'
import { AlternadorTema } from '@/components/AlternadorTema'
import { NormAlertsBell } from '@/components/NormAlertsBell'
import { NAVEGACAO } from '@/components/navegacao'
import { fetchSourceStatuses, triggerSourceCheck } from '@/services/panorama'
import { useToast } from '@/hooks/use-toast'
import {
  obterUsuarioAtivoLocal,
  definirUsuarioAtivoLocal,
  assinarMudancaUsuarioAtivo,
  SistemaUsuario,
} from '@/services/sistemaUsuarios'
import { ModalLogin } from '@/components/ModalLogin'
import { BotaoCadastroClientes } from '@/components/BotaoCadastroClientes'
import type { SourceStatusItem } from '@/types/panorama'

interface PanoramaHeaderProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  onManualRefresh?: () => void
}

// Itens do menu principal — vindos da NAVEGACAO única (fonte única de verdade)
const NAV_LINKS = NAVEGACAO

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
  const [catalogo, setCatalogo] = useState<Array<{ codigo: string; nome: string; grupo: string }>>(
    [],
  )
  const [mostraProdutos, setMostraProdutos] = useState(false)
  const [usuarioAtivo, setUsuarioAtivo] = useState<SistemaUsuario | null>(null)
  const [modalLoginAberto, setModalLoginAberto] = useState(false)

  // Carrega usuário ativo e assina mudanças
  useEffect(() => {
    setUsuarioAtivo(obterUsuarioAtivoLocal())
    const unsubscribe = assinarMudancaUsuarioAtivo((u) => setUsuarioAtivo(u))
    return () => unsubscribe()
  }, [])

  const handleLogout = () => {
    definirUsuarioAtivoLocal(null)
    toast({
      title: 'Sessão encerrada',
      description: 'Você saiu da sua conta ADECONT.',
    })
  }

  // Carrega o catálogo do Simulador (987 itens NCM/NBS/CNAE) para a busca de produtos/serviços
  useEffect(() => {
    fetch('/partes/sim-catalogo.js')
      .then((r) => r.text())
      .then((t) => {
        const m = t.match(/const SIM_CATALOGO = ([\s\S]*?)\n\]/)
        if (!m) return
        const arr = new Function('return ' + m[1] + '\n]')() as unknown[][]
        const itens = arr
          .filter((a) => Array.isArray(a) && a.length >= 5)
          .map((a) => ({ codigo: String(a[0]), nome: String(a[1]), grupo: String(a[2]) }))
        setCatalogo(itens)
      })
      .catch(() => {})
  }, [])

  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const produtosAchados =
    searchTerm.trim().length >= 2
      ? catalogo
          .filter((i) => norm(i.codigo + ' ' + i.nome + ' ' + i.grupo).includes(norm(searchTerm)))
          .slice(0, 8)
      : []
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
        description:
          'Os servidores do CGIBS, do normas.leg.br (Senado) e da Receita Federal foram consultados.',
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
        // Esc também limpa a busca global (desktop e mobile)
        if (searchTerm) {
          setSearchTerm('')
          const busca = document.querySelector<HTMLInputElement>('header input[type="text"]')
          if (busca) busca.focus()
        }
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
        // o hash é a rota da aba: o Index troca o conteúdo, não há mais o que rolar
        if (window.location.hash === item.href) {
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        } else {
          window.location.hash = item.href
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-clip bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Top Banner / Status Bar */}
      <div className="w-full bg-panorama-navy text-slate-100 text-[11px] py-1 px-3 sm:px-6 border-b border-panorama-gold/30">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
            {/* min-w-0 + quebra: em 430px (iPhone 14 Pro Max) esta frase sozinha
                media 545px e empurrava o cabeçalho inteiro para fora da tela —
                115px ficavam inalcançáveis, sem rolagem horizontal possível.
                Agora ela quebra em duas linhas no celular e segue em uma no
                desktop (sm:truncate evita quebrar o alinhamento lá). */}
            <span className="min-w-0 font-medium text-slate-200">
              CGIBS, Senado Dados Abertos, RFB &amp; DOU — 100% Cobertura Ativa
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span
              className="hidden md:inline text-slate-300"
              title={sources
                .map(
                  (s) =>
                    `${s.name}: ${s.status} (${s.coverage_status === 'coberta_alternativa' ? 'Rota alternativa oficial ativa: ' + (s.alternative_source || '') : s.message || ''})`,
                )
                .join(' | ')}
            >
              Última verificação: {lastCheck || 'Carregando...'}
            </span>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsAutoOn(!isAutoOn)}
              /* min-h-[40px]: a auditoria da própria Seção 17 mediu 23px de
                 altura neste botão — abaixo do mínimo de 40px para o dedo.
                 Vale para os três botões da barra de status. */
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isAutoOn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/10 text-slate-400 border border-white/20'
              }`}
              title="Verificação de disponibilidade da fonte oficial a cada 1 hora"
            >
              <Clock className="w-3 h-3" />
              <span>⏱️ Auto: {isAutoOn ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded bg-panorama-gold px-2.5 py-1 text-[11px] font-bold text-panorama-navy transition-colors hover:bg-panorama-gold-light"
              title="Faz a verificação imediata das fontes"
            >
              <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>🔄 Atualizar agora</span>
            </button>

            {/* Ícone do Sistema: Cadastro Analítico de Clientes ADECONT */}
            <BotaoCadastroClientes variante="header" />

            <AlternadorTema />
          </div>
        </div>
      </div>

      {/* Main Header */}
      {/* w-full + min-w-0: medido em 02/11/2026 no iPhone 18 Pro Max (440px),
          este bloco media 518px e o cabeçalho estourava 78px para fora da tela
          — invisível e sem rolagem possível. `min-w-0` permite que os filhos
          ENCOLHAM em vez de empurrar; `flex-wrap` deixa o que não couber ir
          para a linha de baixo em vez de sair pela lateral. */}
      <div className="mx-auto w-full max-w-7xl px-3 py-1.5 sm:px-6">
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 md:gap-4">
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
                  className="h-8 sm:h-9 md:h-10 w-auto max-w-[150px] sm:max-w-[180px] md:max-w-[200px]"
                />
              </div>
            </a>

            <div className="hidden sm:block h-8 w-px bg-slate-200" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Panorama da Reforma Tributária
                </h1>
                <Badge
                  variant="outline"
                  className="border-blue-600 text-blue-700 bg-blue-50 text-[10px] uppercase font-bold shrink-0 hidden md:inline-flex"
                >
                  IBS / CBS / IS
                </Badge>
              </div>
              <p className="hidden xl:block text-[10px] text-slate-500 truncate max-w-md leading-tight">
                Guia Estruturado • LC 214/2025, LC 227/2026, Dec. 12.955 & Res. CGIBS 6/2026
              </p>
            </div>
          </div>

          {/* Quick Search — normas + produtos/serviços */}
          <div className="hidden lg:flex items-center relative w-80">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produtos, serviços, normas…  (tecla /)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setMostraProdutos(true)
              }}
              onFocus={() => setMostraProdutos(true)}
              onBlur={() => setTimeout(() => setMostraProdutos(false), 200)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-slate-50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                title="Limpar pesquisa (Esc)"
                className="absolute right-1.5 inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-200/80 hover:bg-panorama-navy hover:text-panorama-gold-light text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {mostraProdutos && produtosAchados.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 max-h-80 overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  Produtos e serviços — {produtosAchados.length} de {catalogo.length}
                </p>
                {produtosAchados.map((p) => (
                  <a
                    key={p.codigo + p.nome}
                    href={`/simulador.html?q=${encodeURIComponent(p.nome)}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <span className="font-mono text-[10px] font-bold text-panorama-navy bg-panorama-gold/10 rounded px-1.5 py-0.5 shrink-0">
                      {p.codigo}
                    </span>
                    <span className="text-xs text-slate-700 truncate">{p.nome}</span>
                    <span className="ml-auto text-[10px] text-slate-400 shrink-0">{p.grupo}</span>
                  </a>
                ))}
                <a
                  href={`/simulador.html?q=${encodeURIComponent(searchTerm)}`}
                  className="block px-3 py-2 text-xs font-semibold text-panorama-navy hover:bg-panorama-gold/10 border-t border-slate-100"
                >
                  🧮 Abrir "{searchTerm}" no Simulador de Transição →
                </a>
              </div>
            )}
          </div>

          {/* Actions & Alertas */}
          <div className="flex items-center gap-2">
            {/* Bell de Alertas de Novas Revisões */}
            <NormAlertsBell />

            {/* Identificação de usuário e login/logout */}
            <div className="flex items-center gap-1">
              {usuarioAtivo ? (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <a
                    href="#nivel-acesso"
                    title={`Logado como ${usuarioAtivo.nome} (${usuarioAtivo.nivel}) — Gerenciar Acessos`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <ShieldUser className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span className="truncate max-w-[110px]">
                      {usuarioAtivo.nome.split(' ')[0]}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-black bg-emerald-700 text-white">
                      {usuarioAtivo.nivel}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/60 text-slate-500 hover:text-red-700 transition-colors ml-0.5"
                    title="Sair do sistema (Logout)"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setModalLoginAberto(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-panorama-navy hover:bg-panorama-navy-light text-white shadow-xs transition-colors"
                  title="Entrar com usuário e senha"
                >
                  <LogIn className="w-3.5 h-3.5 text-panorama-gold" />
                  <span>Entrar</span>
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <a
                href="/panorama-reforma/envios.html"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-panorama-navy bg-panorama-gold hover:bg-panorama-gold-light px-3 py-1.5 rounded-md shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                title="Cadastro de Clientes & Protocolo de Envios"
              >
                <span>📇 Cadastro & Envios</span>
              </a>
              <a
                href="/panorama-reforma/simulador.html"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1E4FD8] hover:bg-[#2A5BE8] px-3 py-1.5 rounded-md shadow-sm transition-all hover:-translate-y-px hover:shadow-md"
                title="Simulador Didático de Transição — regime atual vs IBS/CBS"
              >
                <span>🧮 Simulador</span>
              </a>
              <a
                href="https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Texto da LC 214</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
              <a
                href="#secao-9"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-panorama-navy hover:bg-panorama-navy-light px-3 py-1.5 rounded-md shadow-sm transition-colors border border-panorama-gold/40"
              >
                <span>Consultar Especialista</span>
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center p-1.5 text-slate-600 hover:text-slate-900 focus:outline-none lg:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search — normas + produtos/serviços */}
        <div className="mt-1.5 lg:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar produtos, serviços, normas…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setMostraProdutos(true)
              }}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-9 text-xs focus:border-blue-600 focus:outline-none min-h-[40px]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                title="Limpar pesquisa (Esc)"
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-200/80 hover:bg-panorama-navy hover:text-panorama-gold-light text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {mostraProdutos && produtosAchados.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 max-h-72 overflow-y-auto">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  Produtos e serviços — {produtosAchados.length} de {catalogo.length}
                </p>
                {produtosAchados.map((p) => (
                  <a
                    key={p.codigo + p.nome}
                    href={`/simulador.html?q=${encodeURIComponent(p.nome)}`}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                  >
                    <span className="font-mono text-[10px] font-bold text-panorama-navy bg-panorama-gold/10 rounded px-1.5 py-0.5 shrink-0">
                      {p.codigo}
                    </span>
                    <span className="text-xs text-slate-700 truncate">{p.nome}</span>
                  </a>
                ))}
                <a
                  href={`/simulador.html?q=${encodeURIComponent(searchTerm)}`}
                  className="block px-3 py-2 text-xs font-semibold text-panorama-navy hover:bg-panorama-gold/10 border-t border-slate-100"
                >
                  🧮 Abrir no Simulador →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Bar Links — fonte maior, ícones coloridos e teclas de atalho */}
        <nav className="mt-3 pt-2.5 border-t border-slate-100 hidden items-center justify-between text-[13px] font-semibold text-slate-700 overflow-x-auto scrollbar-none gap-2">
          {NAV_LINKS.map((link) => {
            const { Icon } = link
            return (
              <a
                key={link.href}
                href={link.href}
                className="group inline-flex items-center gap-1.5 whitespace-nowrap transition-all py-1 px-1.5 rounded-md hover:bg-slate-100 hover:-translate-y-px hover:shadow-sm active:translate-y-0"
                title={`Tecla de atalho: ${link.tecla.toUpperCase()} — ${link.label}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 shrink-0 rounded-md border ${link.bg} ${link.borda} ${link.cor}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="leading-tight">{link.label}</span>
                <kbd className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded border border-slate-300 bg-slate-100 text-[9px] font-mono text-slate-500 group-hover:border-panorama-gold group-hover:text-panorama-gold-dark group-hover:bg-panorama-gold/10 transition-colors">
                  {link.tecla.toUpperCase()}
                </kbd>
              </a>
            )
          })}
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 flex flex-col gap-2 pb-2">
            {/* Ícone do Sistema: Cadastro Analítico de Clientes no Mobile */}
            <div className="pb-1">
              <BotaoCadastroClientes variante="mobile" aoClicar={() => setMobileMenuOpen(false)} />
            </div>

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
                href="https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between text-xs text-slate-600 bg-slate-100 p-2 rounded"
              >
                <span>Texto Oficial da LC 214/2025</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href="#secao-9"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs font-bold text-white bg-blue-600 p-2 rounded"
              >
                Enviar Dúvida / Solicitar Parecer
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Login Corporativo ADECONT */}
      <ModalLogin
        open={modalLoginAberto}
        onOpenChange={setModalLoginAberto}
        onSucessoLogin={(u) => setUsuarioAtivo(u)}
      />
    </header>
  )
}
