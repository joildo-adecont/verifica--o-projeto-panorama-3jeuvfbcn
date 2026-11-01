import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Share2,
  Copy,
  Check,
  QrCode,
  PlusCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Sliders,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { renderQrCodeSvg } from '@/lib/qrCode'
import pb from '@/lib/pocketbase/client'
import {
  fetchInstallShortcuts,
  createInstallShortcut,
  registerShortcutSend,
  type InstallShortcutItem,
} from '@/services/installShortcuts'

export interface ModalBuscaAvancadaProps {
  isOpen: boolean
  onClose: () => void
  termoInicial?: string
  contextoInicial?: {
    termo?: string
    anexoFiltro?: string
    categoriaEspecial?: string
    totalRegistros?: number
    filtrosAplicados?: {
      grupos?: string[]
      esferas?: string[]
      fontes?: string[]
      tiposAto?: string[]
      tabelas?: string[]
      reducoes?: string[]
    }
  }
}

export interface ClienteOption {
  id: string
  nome: string
  email: string
  whatsapp?: string
  empresa?: string
}

const SUGESTOES_TERMOS = [
  'cesta básica',
  'Simples Nacional',
  'insumo agropecuário',
  'cClassTrib',
  'alíquota zero',
  'isenção',
  'saúde',
  'educação',
  'serviços financeiros',
  'locação de imóveis',
  'consórcios',
]

export function ModalBuscaAvancada({
  isOpen,
  onClose,
  termoInicial = '',
  contextoInicial,
}: ModalBuscaAvancadaProps) {
  const [activeTab, setActiveTab] = useState<'gerar_enviar' | 'depositar' | 'historico'>(
    'gerar_enviar',
  )
  const initialTerm = contextoInicial?.termo ?? termoInicial
  const [termoBusca, setTermoBusca] = useState(initialTerm)
  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('')
  const [shortcuts, setShortcuts] = useState<InstallShortcutItem[]>([])
  const [loadingShortcuts, setLoadingShortcuts] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Formulário de depósito no banco
  const [depTitulo, setDepTitulo] = useState('')
  const [depAutor, setDepAutor] = useState('Equipe ADECONT')
  const [depObs, setDepObs] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (isOpen) {
      carregarHistorico()
      carregarClientes()
    }
  }, [isOpen])

  useEffect(() => {
    const novoTermo = contextoInicial?.termo ?? termoInicial
    if (novoTermo !== undefined) {
      setTermoBusca(novoTermo)
    }
  }, [termoInicial, contextoInicial?.termo])

  async function carregarHistorico() {
    setLoadingShortcuts(true)
    try {
      const data = await fetchInstallShortcuts()
      setShortcuts(data)
    } finally {
      setLoadingShortcuts(false)
    }
  }

  async function carregarClientes() {
    try {
      const records = await pb.collection('simul_clientes').getFullList<ClienteOption>({
        filter: 'is_active = true',
        sort: 'nome',
      })
      setClientes(records || [])
    } catch {
      try {
        const records = await pb.collection('simul_clientes').getFullList<ClienteOption>({
          sort: 'nome',
        })
        setClientes(records || [])
      } catch (e) {
        console.warn('[ModalBuscaAvancada] Falha ao carregar simul_clientes:', e)
      }
    }
  }

  const clienteAtual = useMemo(() => {
    return clientes.find((c) => c.id === clienteSelecionadoId) || null
  }, [clientes, clienteSelecionadoId])

  // Derivação dinâmica da URL base a partir da origem atual (preview ou produção)
  const baseAppOrigin = useMemo(() => {
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'https://verificacao-projeto-panorama-18549.goskip.app'
  }, [])

  // URL direta com hash e parâmetro de termo opcional
  const targetUrl = useMemo(() => {
    const limpo = termoBusca.trim()
    if (limpo) {
      return `${baseAppOrigin}/#busca-avancada?q=${encodeURIComponent(limpo)}`
    }
    return `${baseAppOrigin}/#busca-avancada`
  }, [baseAppOrigin, termoBusca])

  // QR Code SVG
  const qrSvgString = useMemo(() => {
    if (!targetUrl) return ''
    return renderQrCodeSvg(targetUrl, 180, '#0F294A')
  }, [targetUrl])

  function copiarParaClipboard(texto: string, key: string) {
    navigator.clipboard.writeText(texto)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2500)
  }

  function gerarTextoMensagem(customUrl?: string, customTitulo?: string) {
    const url = customUrl || targetUrl
    const tit =
      customTitulo ||
      (termoBusca.trim()
        ? `Busca Avançada da Reforma Tributária — Pesquisa: "${termoBusca.trim()}"`
        : 'Busca Avançada da Reforma Tributária — Pesquisa Correlacionada Completa')

    const saudacao = clienteAtual
      ? `Prezado(a) ${clienteAtual.nome}${clienteAtual.empresa ? ` (${clienteAtual.empresa})` : ''},`
      : 'Prezado cliente,'

    const f = contextoInicial?.filtrosAplicados
    const temFiltrosFacetados =
      f &&
      ((f.grupos && f.grupos.length > 0) ||
        (f.esferas && f.esferas.length > 0) ||
        (f.fontes && f.fontes.length > 0) ||
        (f.tiposAto && f.tiposAto.length > 0) ||
        (f.tabelas && f.tabelas.length > 0) ||
        (f.reducoes && f.reducoes.length > 0))

    const temContextoExtra =
      contextoInicial &&
      ((contextoInicial.anexoFiltro && contextoInicial.anexoFiltro !== 'TODOS') ||
        (contextoInicial.categoriaEspecial && contextoInicial.categoriaEspecial !== 'TODAS') ||
        temFiltrosFacetados ||
        typeof contextoInicial.totalRegistros === 'number')

    const detalhesFiltros = [
      contextoInicial?.anexoFiltro && contextoInicial.anexoFiltro !== 'TODOS'
        ? `Anexo: ${contextoInicial.anexoFiltro}`
        : null,
      contextoInicial?.categoriaEspecial && contextoInicial.categoriaEspecial !== 'TODAS'
        ? `Grupo Especial: ${contextoInicial.categoriaEspecial}`
        : null,
      f?.grupos && f.grupos.length > 0 ? `Grupos: ${f.grupos.join(', ')}` : null,
      f?.esferas && f.esferas.length > 0 ? `Esferas: ${f.esferas.join(', ')}` : null,
      f?.fontes && f.fontes.length > 0 ? `Fontes: ${f.fontes.join(', ')}` : null,
      f?.tiposAto && f.tiposAto.length > 0 ? `Atos: ${f.tiposAto.join(', ')}` : null,
      f?.tabelas && f.tabelas.length > 0 ? `Tabelas: ${f.tabelas.join(', ')}` : null,
      f?.reducoes && f.reducoes.length > 0 ? `Reduções: ${f.reducoes.join(', ')}` : null,
      typeof contextoInicial?.totalRegistros === 'number'
        ? `${contextoInicial.totalRegistros.toLocaleString('pt-BR')} registros correlacionados`
        : null,
    ]
      .filter(Boolean)
      .join(' • ')

    const detalheTermo = termoBusca.trim()
      ? `\n🔎 *Matéria / Informação pesquisada:* "${termoBusca.trim()}"` +
        (temContextoExtra ? `\n📊 *Filtros e abrangência aplicados:* ${detalhesFiltros}` : '') +
        `\n(Ao acessar o link oficial abaixo, a Busca Avançada abrirá já pré-filtrada com todas as normas, NCMs e impactos correspondentes).\n`
      : temContextoExtra
        ? `\n📊 *Filtros aplicados na consulta:* ${detalhesFiltros}\n`
        : ''

    return `*ADECONT — Assessoria Contábil e Administrativa*
🔍 *${tit}*

${saudacao}
Disponibilizamos o acesso direto ao *Motor Integrado de Busca Avançada da Reforma Tributária* do sistema ADECONT:${detalheTermo}
🔗 *Link Direto da Busca Avançada:*
${url}

📋 *O que você encontrará no sistema:*
• Pesquisa correlacionada e simultânea em todas as fontes oficiais da Reforma Tributária.
• Normas e atos atualizados: Emenda Constitucional 132/2023, Lei Complementar 214/2025, Resoluções CGIBS, Decretos federais, convênios estaduais e atos municipais.
• Base de classificações oficiais: 15.240+ NCMs, cClassTrib, CSTs, cCredPres, CEST, CFOP, NBS e CNAE.
• Análise completa de tratamentos diferenciados: alíquotas de referência, reduções de 60% e 30%, isenções, alíquota zero (Cesta Básica Nacional) e imunidades constitucionais.
• Gráficos comparativos de desoneração, tabelas correlacionadas e pareceres práticos de aplicação contábil.

🛡️ *Segurança & Garantia:*
- Sistema atualizado semanalmente pela equipe de especialistas da ADECONT.
- Navegação otimizada para celulares (com QR Code) e computadores.

Nossa equipe de Assessoria Contábil e Administrativa está à disposição para esclarecer o impacto de cada norma na sua atividade.`
  }

  function formatarUrlLink(rawUrl?: string): string {
    if (!rawUrl) return targetUrl
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return rawUrl.startsWith('/') ? `${origin}${rawUrl}` : `${origin}/${rawUrl}`
  }

  async function handleEnviarWhatsApp(shortcutItem?: InstallShortcutItem) {
    const urlFinal = formatarUrlLink(shortcutItem?.url)
    const texto = gerarTextoMensagem(urlFinal, shortcutItem?.titulo)
    const phone = clienteAtual?.whatsapp ? clienteAtual.whatsapp.replace(/\D/g, '') : ''
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`

    const idToUpdate =
      shortcutItem?.id || shortcuts.find((s) => s.url.includes('busca-avancada'))?.id
    if (idToUpdate) {
      await registerShortcutSend(idToUpdate)
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === idToUpdate ? { ...s, envios_count: (s.envios_count || 0) + 1 } : s,
        ),
      )
    }
    window.open(waUrl, '_blank')
  }

  async function handleEnviarEmail(shortcutItem?: InstallShortcutItem) {
    const urlFinal = formatarUrlLink(shortcutItem?.url)
    const texto = gerarTextoMensagem(urlFinal, shortcutItem?.titulo)
    const assunto = termoBusca.trim()
      ? `Busca Avançada da Reforma Tributária: "${termoBusca.trim()}" — ADECONT`
      : 'Busca Avançada da Reforma Tributária — ADECONT'

    const emailDest = clienteAtual?.email ? encodeURIComponent(clienteAtual.email) : ''
    const mailto = `mailto:${emailDest}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(texto)}`

    const idToUpdate =
      shortcutItem?.id || shortcuts.find((s) => s.url.includes('busca-avancada'))?.id
    if (idToUpdate) {
      await registerShortcutSend(idToUpdate)
      setShortcuts((prev) =>
        prev.map((s) =>
          s.id === idToUpdate ? { ...s, envios_count: (s.envios_count || 0) + 1 } : s,
        ),
      )
    }
    window.location.href = mailto
  }

  async function handleDepositarNoBanco(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedbackMsg(null)

    const termo = termoBusca.trim()
    const tituloFinal =
      depTitulo.trim() ||
      (termo
        ? `🔍 Busca Avançada — Pesquisa: "${termo}"`
        : '🔍 Busca Avançada da Reforma Tributária (Pesquisa Correlacionada)')

    const instrucoesTexto =
      `1. Acesse o link oficial para abrir a Busca Avançada do sistema ADECONT.\n` +
      (termo
        ? `2. Termo de consulta configurado: "${termo}".\n`
        : `2. Pesquise por qualquer norma, NCM, alíquota ou produto.\n`) +
      `3. Assessoria Contábil e Administrativa ADECONT — Fontes Oficiais e Atualização Semanal.`

    const obsTexto =
      depObs.trim() ||
      (clienteAtual
        ? `Envio direcionado ao cliente ${clienteAtual.nome} (${clienteAtual.empresa || clienteAtual.email}).`
        : `Depósito de link da Busca Avançada${termo ? ` com termo "${termo}"` : ''} para clientes cadastrados.`)

    try {
      await createInstallShortcut({
        titulo: tituloFinal,
        device_type: 'todos',
        url: targetUrl.replace(baseAppOrigin, ''), // salva relativo para idempotência multi-ambiente
        instrucoes: instrucoesTexto,
        observacoes: obsTexto,
        criado_por: depAutor.trim() || 'Equipe ADECONT',
      })

      setFeedbackMsg({
        text: '✔ Link da Busca Avançada depositado com sucesso no banco de dados!',
        ok: true,
      })
      setDepTitulo('')
      setDepObs('')
      await carregarHistorico()

      setTimeout(() => {
        setActiveTab('historico')
        setFeedbackMsg(null)
      }, 1400)
    } catch {
      setFeedbackMsg({
        text: 'Erro ao depositar no banco de dados. Tente novamente.',
        ok: false,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Topo / Cabeçalho ADECONT */}
        <div className="bg-gradient-to-r from-panorama-navy via-[#1B365D] to-[#0F294A] text-white p-5 border-b border-panorama-gold/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <Search className="w-6 h-6 text-panorama-gold-light" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Central de Entrega — Busca Avançada da Reforma Tributária
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-panorama-gold text-panorama-navy uppercase tracking-wider">
                  Envio ao Cliente
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Gere o link direto da pesquisa correlacionada, QR Code e envie aos clientes
                cadastrados via WhatsApp ou E-mail com mensagem institucional ADECONT.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block bg-white/95 px-2.5 py-1 rounded-lg shadow-xs">
              <AdecontLogo className="h-6 w-auto" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('gerar_enviar')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'gerar_enviar'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-panorama-gold-dark" />
            1. Gerar Link &amp; Enviar para Clientes
          </button>
          <button
            onClick={() => setActiveTab('depositar')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'depositar'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            2. Depositar Link no Banco de Dados
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'historico'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            3. Histórico da Central ({shortcuts.length})
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-sm">
          {/* ABA 1: GERAR LINK E ENVIAR AO CLIENTE */}
          {activeTab === 'gerar_enviar' && (
            <div className="space-y-5">
              {/* Seletor de Cliente Cadastrado + Termo Pré-preenchido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                {/* 1. Cliente Cadastrado */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-panorama-navy" />
                    Destinatário (Cliente Cadastrado):
                  </label>
                  <select
                    value={clienteSelecionadoId}
                    onChange={(e) => setClienteSelecionadoId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-panorama-gold/70"
                  >
                    <option value="">— Envio Geral (Sem cliente específico) —</option>
                    {clientes.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.nome} {cli.empresa ? `• ${cli.empresa}` : ''} ({cli.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10.5px] text-slate-500">
                    {clienteAtual ? (
                      <span className="text-emerald-700 font-semibold">
                        ✔ Destinatário selecionado: {clienteAtual.nome}{' '}
                        {clienteAtual.whatsapp ? `• WA: ${clienteAtual.whatsapp}` : ''}
                      </span>
                    ) : (
                      'Selecione um cliente para personalizar a mensagem ou deixe livre para envio genérico.'
                    )}
                  </p>
                </div>

                {/* 2. Termo de Pesquisa Pré-preenchido */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-panorama-gold-dark" />
                      Termo de Busca Pré-Preenchido (Opcional):
                    </label>
                    {termoBusca && (
                      <button
                        onClick={() => setTermoBusca('')}
                        className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Limpar Termo
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      placeholder="Ex.: cesta básica, agronegócio, Simples Nacional, 26,5%..."
                      className="w-full pl-8 pr-3 py-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-panorama-gold/70"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 self-center mr-1">Sugestões:</span>
                    {SUGESTOES_TERMOS.slice(0, 5).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setTermoBusca(sug)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          termoBusca.toLowerCase() === sug.toLowerCase()
                            ? 'bg-panorama-navy text-white border-panorama-navy font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Painel Central: QR Code + Detalhes + Ações */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                {/* Coluna QR Code (5 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-panorama-navy">
                    <QrCode className="w-4 h-4 text-panorama-gold-dark" />
                    QR Code da Busca Avançada
                  </div>

                  <div
                    className="p-2 border border-slate-200 rounded-xl bg-white shadow-xs inline-flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: qrSvgString }}
                  />

                  <div className="text-[11px] text-slate-500 max-w-[240px]">
                    Aponte a câmera do celular para abrir o motor de Busca Avançada da Reforma
                    Tributária diretamente no aparelho.
                  </div>

                  <div className="flex items-center gap-1.5 w-full pt-1">
                    <button
                      onClick={() => copiarParaClipboard(targetUrl, 'link_busca')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedKey === 'link_busca' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copiar Link
                    </button>

                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-lg bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                      title="Abrir no Sistema"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir
                    </a>
                  </div>
                </div>

                {/* Coluna de Envio e Mensagem (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-panorama-gold-dark" />
                        Busca Avançada da Reforma Tributária
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-panorama-navy/10 text-panorama-navy">
                        {termoBusca.trim() ? `Termo: ${termoBusca.trim()}` : 'Geral'}
                      </span>
                    </div>

                    <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5 font-sans leading-relaxed">
                      <div className="flex items-start gap-1.5">
                        <strong className="text-slate-900 shrink-0">Abrangência:</strong>
                        <span>
                          Atos oficiais (União, CGIBS, Estados, Municípios), 15.240+ NCMs,
                          cClassTrib, CST, alíquotas e anexos.
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <strong className="text-slate-900 shrink-0">Recursos:</strong>
                        <span>
                          Filtros por esferas, 9 grupos especiais, consulta completa dos anexos e
                          gráficos correlacionados.
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-500 text-[11px] pt-1 border-t border-slate-100">
                        <strong className="text-slate-700 shrink-0">URL de Destino:</strong>
                        <span className="font-mono break-all text-[10px] text-slate-600">
                          {targetUrl}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Disparos para Clientes */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-700">
                      Disparo Imediato para Clientes (ADECONT):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEnviarWhatsApp()}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar no WhatsApp
                      </button>

                      <button
                        onClick={() => handleEnviarEmail()}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        Enviar por E-mail
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        copiarParaClipboard(gerarTextoMensagem(), 'msg_busca_completa')
                      }
                      className="w-full py-2 px-3 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedKey === 'msg_busca_completa' ? (
                        <>
                          <Check className="w-4 h-4 text-panorama-gold" />
                          Mensagem Institucional Copiada com Sucesso!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-panorama-gold-light" />
                          Copiar Mensagem Institucional Formatada
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Alerta Institucional de Garantia ADECONT */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-panorama-gold-dark shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Compatibilidade Multi-Ambiente:</strong> O link gerado funciona tanto no
                  ambiente de homologação/preview quanto no domínio final de produção, direcionando
                  o cliente de forma segura e imediata para a Busca Avançada da Reforma Tributária.
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: DEPOSITAR LINK NO BANCO DE DADOS */}
          {activeTab === 'depositar' && (
            <form onSubmit={handleDepositarNoBanco} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Depósito Permanente na Coleção da Central:</strong> O link da Busca
                  Avançada com a configuração escolhida será persistido na coleção{' '}
                  <code>install_shortcuts</code> com instruções completas, data e autor. Aparecerá
                  no histórico da Central com registro de contagem de envios.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Título do Depósito / Envio *
                  </label>
                  <input
                    type="text"
                    value={depTitulo}
                    onChange={(e) => setDepTitulo(e.target.value)}
                    placeholder={
                      termoBusca.trim()
                        ? `🔍 Busca Avançada — Pesquisa: "${termoBusca.trim()}"`
                        : '🔍 Busca Avançada da Reforma Tributária (Pesquisa Correlacionada)'
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Se vazio, será usado o título padrão oficial do sistema ADECONT.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Destino / Termo Ativo</label>
                  <input
                    type="text"
                    readOnly
                    value={
                      termoBusca.trim()
                        ? `Busca Avançada com filtro: "${termoBusca.trim()}"`
                        : 'Busca Avançada Completa (Sem filtro prévio)'
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-600 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  URL Direta do Sistema (Gerada Automaticamente)
                </label>
                <input
                  type="text"
                  readOnly
                  value={targetUrl}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Identificação do Autor</label>
                  <input
                    type="text"
                    value={depAutor}
                    onChange={(e) => setDepAutor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                    placeholder="Equipe ADECONT"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Observações Internas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={depObs}
                    onChange={(e) => setDepObs(e.target.value)}
                    placeholder="Ex.: Enviado para o cliente com pesquisa de cesta básica"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  />
                </div>
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    feedbackMsg.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  {feedbackMsg.text}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('gerar_enviar')}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-panorama-gold" />
                  {saving ? 'Depositando no banco...' : 'Depositar Link no Banco'}
                </button>
              </div>
            </form>
          )}

          {/* ABA 3: HISTÓRICO DA CENTRAL */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Links e Depósitos Registrados ({shortcuts.length}):
                </h4>
                <button
                  onClick={carregarHistorico}
                  disabled={loadingShortcuts}
                  className="text-xs font-semibold text-panorama-navy hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Atualizar Lista
                </button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {shortcuts.map((item) => {
                  const isBuscaAvancada =
                    item.url.includes('busca-avancada') ||
                    item.titulo.toLowerCase().includes('busca avançada')

                  return (
                    <div
                      key={item.id}
                      className={`p-4 transition-colors space-y-2 ${
                        isBuscaAvancada
                          ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-l-panorama-navy'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{item.titulo}</span>
                            {isBuscaAvancada ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                                <Search className="w-3 h-3 text-panorama-navy" /> Busca Avançada
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {item.device_type}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 break-all">
                            {item.url}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              copiarParaClipboard(
                                gerarTextoMensagem(formatarUrlLink(item.url), item.titulo),
                                `hist_${item.id}`,
                              )
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Copiar mensagem"
                          >
                            {copiedKey === `hist_${item.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            Copiar
                          </button>
                          <button
                            onClick={() => handleEnviarWhatsApp(item)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Enviar no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <a
                            href={formatarUrlLink(item.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Abrir URL / Testar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 whitespace-pre-line bg-white/70 p-2.5 rounded-lg border border-slate-200/80 font-sans">
                        {item.instrucoes}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 gap-2">
                        <span>Autor: {item.criado_por || 'Sistema ADECONT'}</span>
                        <span className="font-semibold text-slate-600">
                          Envios registrados: {item.envios_count || 0}
                        </span>
                        {item.created && (
                          <span>
                            Depositado em: {new Date(item.created).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(item.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé institucional com branding ADECONT */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-panorama-navy">
              ADECONT — Assessoria Contábil e Administrativa
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-500">
              Central de Entrega — Busca Avançada da Reforma Tributária
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
