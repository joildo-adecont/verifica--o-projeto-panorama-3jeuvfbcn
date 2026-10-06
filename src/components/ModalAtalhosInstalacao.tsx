import { useState, useEffect, useMemo } from 'react'
import {
  Smartphone,
  Monitor,
  Apple,
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  PlusCircle,
  Clock,
  ExternalLink,
  MessageCircle,
  Mail,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { renderQrCodeSvg } from '@/lib/qrCode'
import {
  fetchInstallShortcuts,
  createInstallShortcut,
  registerShortcutSend,
  type InstallShortcutItem,
  type ShortcutDeviceType,
} from '@/services/installShortcuts'

interface ModalAtalhosInstalacaoProps {
  isOpen: boolean
  onClose: () => void
}

export function ModalAtalhosInstalacao({ isOpen, onClose }: ModalAtalhosInstalacaoProps) {
  const [activeTab, setActiveTab] = useState<'gerar_enviar' | 'depositar' | 'historico'>(
    'gerar_enviar',
  )
  const [deviceFilter, setDeviceFilter] = useState<ShortcutDeviceType>('todos')
  const [shortcuts, setShortcuts] = useState<InstallShortcutItem[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Form para DEPOSITAR novo atalho
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novoDevice, setNovoDevice] = useState<ShortcutDeviceType>('todos')
  const [novaUrl, setNovaUrl] = useState('')
  const [novasInstrucoes, setNovasInstrucoes] = useState('')
  const [novasObs, setNovasObs] = useState('')
  const [criadoPor, setCriadoPor] = useState('Equipe ADECONT')
  const [saving, setSaving] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // URL base padrão da aplicação
  const defaultUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://verificacao-projeto-panorama-18549.goskip.app/'

  useEffect(() => {
    if (isOpen) {
      carregarAtalhos()
      if (!novaUrl) {
        setNovaUrl(defaultUrl)
      }
    }
  }, [isOpen])

  async function carregarAtalhos() {
    setLoading(true)
    try {
      const data = await fetchInstallShortcuts()
      setShortcuts(data)
    } finally {
      setLoading(false)
    }
  }

  const atalhoSelecionado = useMemo(() => {
    return (
      shortcuts.find((s) => s.device_type === deviceFilter) ||
      shortcuts.find((s) => s.device_type === 'todos') ||
      shortcuts[0]
    )
  }, [shortcuts, deviceFilter])

  const targetUrl = atalhoSelecionado ? atalhoSelecionado.url : defaultUrl

  // QR Code SVG em string
  const qrSvgString = useMemo(() => {
    if (!targetUrl) return ''
    return renderQrCodeSvg(targetUrl, 180, '#2E2260')
  }, [targetUrl])

  function copiarParaClipboard(texto: string, key: string) {
    navigator.clipboard.writeText(texto)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2500)
  }

  function gerarTextoMensagem(item?: InstallShortcutItem) {
    const s = item || atalhoSelecionado
    const titulo = s?.titulo || 'Atalhos de Instalação — ADECONT'
    const url = s?.url || defaultUrl
    const inst = s?.instrucoes || ''

    return `*ADECONT — Assessoria Contábil e Administrativa*
📱 *${titulo}*

Prezado cliente,
Para acessar e consultar o *Panorama da Reforma Tributária* com rapidez no seu celular ou computador, instale nosso atalho oficial:

🔗 *Link de Instalação do Sistema:*
${url}

📋 *Passo a passo por dispositivo:*
${inst}

🛡️ _Sistema com atualização semanal contínua e fontes primárias oficiais (CGIBS, LC 214/2025)._`
  }

  function enviarWhatsApp(item?: InstallShortcutItem) {
    const texto = gerarTextoMensagem(item)
    const url = 'https://wa.me/?text=' + encodeURIComponent(texto)
    if (item?.id) {
      registerShortcutSend(item.id)
    }
    window.open(url, '_blank')
  }

  function enviarEmail(item?: InstallShortcutItem) {
    const texto = gerarTextoMensagem(item)
    const subject = 'Atalho de Instalação — ADECONT Panorama da Reforma Tributária'
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(texto)}`
    if (item?.id) {
      registerShortcutSend(item.id)
    }
    window.location.href = mailto
  }

  async function handleDepositarAtalho(e: React.FormEvent) {
    e.preventDefault()
    if (!novoTitulo.trim() || !novaUrl.trim() || !novasInstrucoes.trim()) {
      setFeedbackMsg({ text: 'Preencha título, URL e instruções.', ok: false })
      return
    }

    setSaving(true)
    setFeedbackMsg(null)
    try {
      await createInstallShortcut({
        titulo: novoTitulo.trim(),
        device_type: novoDevice,
        url: novaUrl.trim(),
        instrucoes: novasInstrucoes.trim(),
        observacoes: novasObs.trim(),
        criado_por: criadoPor.trim() || 'Equipe ADECONT',
      })
      setFeedbackMsg({ text: '✔ Atalho depositado e persistido no banco com sucesso!', ok: true })
      setNovoTitulo('')
      setNovasObs('')
      await carregarAtalhos()
      setTimeout(() => {
        setActiveTab('gerar_enviar')
        setFeedbackMsg(null)
      }, 1500)
    } catch {
      setFeedbackMsg({ text: 'Erro ao persistir no banco de dados. Tente novamente.', ok: false })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Topo / Cabeçalho ADECONT */}
        <div className="bg-gradient-to-r from-panorama-navy via-[#2E2260] to-[#1E1643] text-white p-5 border-b border-panorama-gold/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <Smartphone className="w-6 h-6 text-panorama-gold-light" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Central de Entrega — Instalação do Sistema
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-panorama-gold text-panorama-navy uppercase tracking-wider">
                  PWA & Desktop
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                Deposite e envie aos clientes os atalhos de instalação nos celulares (Android/iOS) e
                computadores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block bg-white/95 px-2.5 py-1 rounded-lg shadow-xs">
              <AdecontLogo className="h-6 w-auto" />
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
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
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gerar_enviar'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-4 h-4 text-panorama-gold-dark" />
            1. Enviar para Clientes (Link & QR Code)
          </button>
          <button
            onClick={() => setActiveTab('depositar')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'depositar'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            2. Depositar Novos Atalhos (Banco)
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'historico'
                ? 'border-panorama-navy text-panorama-navy bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            3. Histórico de Atalhos ({shortcuts.length})
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 text-sm">
          {/* ABA 1: ENVIAR PARA CLIENTES */}
          {activeTab === 'gerar_enviar' && (
            <div className="space-y-5">
              {/* Seletor de dispositivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-panorama-navy" />
                  Selecione o formato de atalho para entrega:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setDeviceFilter('todos')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      deviceFilter === 'todos'
                        ? 'border-panorama-navy bg-panorama-navy/5 text-panorama-navy ring-1 ring-panorama-navy'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-panorama-gold-dark" />
                      Universal
                    </span>
                    <span className="text-[11px] text-slate-500">Todos os dispositivos</span>
                  </button>

                  <button
                    onClick={() => setDeviceFilter('android')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      deviceFilter === 'android'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      Android / Chrome
                    </span>
                    <span className="text-[11px] text-slate-500">Tela inicial & APK PWA</span>
                  </button>

                  <button
                    onClick={() => setDeviceFilter('iphone')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      deviceFilter === 'iphone'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <Apple className="w-3.5 h-3.5 text-purple-600" />
                      Apple / Safari
                    </span>
                    <span className="text-[11px] text-slate-500">iPhone e iPad</span>
                  </button>

                  <button
                    onClick={() => setDeviceFilter('computador')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                      deviceFilter === 'computador'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <Monitor className="w-3.5 h-3.5 text-blue-600" />
                      Computadores
                    </span>
                    <span className="text-[11px] text-slate-500">Windows & Mac (App)</span>
                  </button>
                </div>
              </div>

              {/* Bloco principal: QR Code + Instruções + Botões de Envio */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                {/* Coluna QR Code (4 cols) */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-panorama-navy">
                    <QrCode className="w-4 h-4 text-panorama-gold-dark" />
                    QR Code para Escanear no Celular
                  </div>

                  <div
                    className="p-2 border border-slate-200 rounded-xl bg-white shadow-xs inline-flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: qrSvgString }}
                  />

                  <div className="text-[11px] text-slate-500 max-w-[220px]">
                    Aponte a câmera do celular para abrir o link oficial e adicionar à tela inicial.
                  </div>

                  <div className="flex items-center gap-1.5 w-full pt-1">
                    <button
                      onClick={() => copiarParaClipboard(targetUrl, 'link_qr')}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      {copiedKey === 'link_qr' ? (
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
                      className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                      title="Testar Link Direto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Coluna Instruções & Ações de Envio (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        {atalhoSelecionado?.titulo || 'Instruções de Instalação'}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {atalhoSelecionado?.device_type || 'Geral'}
                      </span>
                    </div>

                    <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                      {atalhoSelecionado?.instrucoes || 'Instruções não cadastradas.'}
                    </div>

                    {atalhoSelecionado?.observacoes && (
                      <p className="text-[11px] text-slate-500 italic mt-1.5">
                        💡 {atalhoSelecionado.observacoes}
                      </p>
                    )}
                  </div>

                  {/* Banners e Ações de envio para o cliente */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="text-xs font-bold text-slate-700">Enviar para os Clientes:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => enviarWhatsApp()}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Enviar no WhatsApp
                      </button>

                      <button
                        onClick={() => enviarEmail()}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                        Enviar por E-mail
                      </button>
                    </div>

                    <button
                      onClick={() => copiarParaClipboard(gerarTextoMensagem(), 'msg_completa')}
                      className="w-full py-2 px-3 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedKey === 'msg_completa' ? (
                        <>
                          <Check className="w-4 h-4 text-panorama-gold" />
                          Mensagem Completa com Logo ADECONT Copiada!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-panorama-gold-light" />
                          Copiar Mensagem Formatada com Instruções
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informação sobre os recursos PWA */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs flex items-start gap-2.5">
                <span className="text-base leading-none">📱</span>
                <div>
                  <strong>Compatibilidade PWA ADECONT:</strong> O sistema já possui manifesto
                  configurado com ícones 192x192, 512x512 e Apple Touch Icon 180x180. Ao instalar, o
                  cliente passa a acessar o Panorama diretamente da tela de início sem barra de
                  endereços, como aplicativo nativo.
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: DEPOSITAR NOVOS ATALHOS */}
          {activeTab === 'depositar' && (
            <form onSubmit={handleDepositarAtalho} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2">
                <Download className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Depósito de Atalhos no Banco de Dados:</strong> Registre novas
                  configurações de atalhos e instruções customizadas (por exemplo, orientações para
                  filiais, novos domínios ou versões específicas). Ficam salvas na coleção{' '}
                  <code>install_shortcuts</code> para reutilização imediata.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Título do Atalho *</label>
                  <input
                    type="text"
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    placeholder="Ex.: Instalação Corporativa — Equipes Externas"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Dispositivo Alvo *</label>
                  <select
                    value={novoDevice}
                    onChange={(e) => setNovoDevice(e.target.value as ShortcutDeviceType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none bg-white"
                  >
                    <option value="todos">Universal (Todos os dispositivos)</option>
                    <option value="android">Android (Celulares & Tablets)</option>
                    <option value="iphone">iPhone / iPad (iOS Safari)</option>
                    <option value="computador">Computador (Windows / Mac / Linux)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  URL do Atalho / Sistema *
                </label>
                <input
                  type="url"
                  value={novaUrl}
                  onChange={(e) => setNovaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Instruções Passo a Passo *
                </label>
                <textarea
                  rows={4}
                  value={novasInstrucoes}
                  onChange={(e) => setNovasInstrucoes(e.target.value)}
                  placeholder="1. Abra o link...&#10;2. Clique no menu...&#10;3. Selecione Adicionar à tela..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Observações Internas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={novasObs}
                    onChange={(e) => setNovasObs(e.target.value)}
                    placeholder="Ex.: Recomendado para clientes de grande porte"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Identificação do Autor</label>
                  <input
                    type="text"
                    value={criadoPor}
                    onChange={(e) => setCriadoPor(e.target.value)}
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
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4 text-panorama-gold" />
                  {saving ? 'Depositando no banco...' : 'Depositar Atalho no Banco'}
                </button>
              </div>
            </form>
          )}

          {/* ABA 3: HISTÓRICO DE ATALHOS CADASTRADOS */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Atalhos Registrados na Base ({shortcuts.length}):
                </h4>
                <button
                  onClick={carregarAtalhos}
                  disabled={loading}
                  className="text-xs font-semibold text-panorama-navy hover:underline flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Atualizar Lista
                </button>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {shortcuts.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.titulo}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.device_type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 break-all">
                          {item.url}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            copiarParaClipboard(gerarTextoMensagem(item), `hist_${item.id}`)
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1"
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
                          onClick={() => enviarWhatsApp(item)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          title="Enviar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                      {item.instrucoes}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Autor: {item.criado_por || 'Sistema ADECONT'}</span>
                      <span>Envios registrados: {item.envios_count || 0}</span>
                      {item.created && (
                        <span>
                          Cadastrado em: {new Date(item.created).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
              Distribuição Segura de Aplicativos (PWA & Atalhos)
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
