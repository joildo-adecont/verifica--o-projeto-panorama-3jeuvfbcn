import { useState, useEffect, useMemo } from 'react'
import {
  PackageCheck,
  Send,
  Calendar,
  Layers,
  History,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Mail,
  ShieldCheck,
  PlusCircle,
  Users,
  Search,
  Sparkles,
  Smartphone,
  Monitor,
  Download,
  KeyRound,
  FileText,
  RefreshCw,
  Cpu,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { AdecontLogo, AdecontBadge } from '@/components/AdecontLogo'
import { renderQrCodeSvg } from '@/lib/qrCode'
import {
  fetchProgramaVersoes,
  createProgramaVersao,
  setVersaoComoAtual,
  fetchDestinatariosCadastro,
  registrarEnvioInstalacao,
  fetchProgramaEnvios,
  formatarMensagemInstalacao,
  fetchProgramaAtualizacoes,
  fetchProgramaPropagacoes,
  registrarAtualizacaoBaseEPropagar,
  consultarProgramaManifesto,
  type ProgramaVersaoItem,
  type DestinatarioCliente,
  type ProgramaEnvioItem,
  type CanalEnvioInstalacao,
  type StatusVersao,
  type ProgramaAtualizacaoItem,
  type ProgramaPropagacaoItem,
  type ProgramaManifestoResponse,
} from '@/services/programaVersoes'

export function SectionControleVersao() {
  const [abaAtiva, setAbaAtiva] = useState<
    'envio' | 'versoes' | 'historico_envios' | 'atualizacoes'
  >('envio')

  // Dados do backend
  const [versoes, setVersoes] = useState<ProgramaVersaoItem[]>([])
  const [clientes, setClientes] = useState<DestinatarioCliente[]>([])
  const [envios, setEnvios] = useState<ProgramaEnvioItem[]>([])
  const [atualizacoes, setAtualizacoes] = useState<ProgramaAtualizacaoItem[]>([])
  const [propagacoes, setPropagacoes] = useState<ProgramaPropagacaoItem[]>([])
  const [manifestoDesktop, setManifestoDesktop] = useState<ProgramaManifestoResponse | null>(null)
  const [manifestoCelular, setManifestoCelular] = useState<ProgramaManifestoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Ações de Atualização Manual de Base e Propagação no Mesmo Dia
  const [novaOrigemBase, setNovaOrigemBase] = useState('manual CEO')
  const [novaVersaoBase, setNovaVersaoBase] = useState(
    () => `base-${new Date().toISOString().slice(0, 10)}`,
  )
  const [novaDescricaoBase, setNovaDescricaoBase] = useState('')
  const [dataAtualizacaoBase, setDataAtualizacaoBase] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [propagando, setPropagando] = useState(false)
  const [feedbackPropagacao, setFeedbackPropagacao] = useState<{
    texto: string
    ok: boolean
  } | null>(null)

  // Seleções para envio
  const [versaoSelecionadaId, setVersaoSelecionadaId] = useState<string>('')
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [canalEnvio, setCanalEnvio] = useState<CanalEnvioInstalacao>('whatsapp')
  const [disparando, setDisparando] = useState(false)
  const [feedbackEnvio, setFeedbackEnvio] = useState<{ texto: string; ok: boolean } | null>(null)

  // Filtros de visualização e plataforma
  const [filtroPlataforma, setFiltroPlataforma] = useState<'todas' | 'desktop' | 'celular'>('todas')

  // Formulário de cadastro de nova versão pelo CEO
  const [novaVersaoNum, setNovaVersaoNum] = useState('')
  const [novaPlataforma, setNovaPlataforma] = useState<'desktop' | 'celular'>('celular')
  const [novaDataAtualizacao, setNovaDataAtualizacao] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [novasNotas, setNovasNotas] = useState('')
  const [novoStatus, setNovoStatus] = useState<StatusVersao>('atual')
  const [novoCanalDist, setNovoCanalDist] = useState('WhatsApp, QR Code Celular e E-mail')
  const [salvandoVersao, setSalvandoVersao] = useState(false)
  const [feedbackVersao, setFeedbackVersao] = useState<{ texto: string; ok: boolean } | null>(null)

  // Token do CEO (padrão de autorização do projeto via localStorage)
  const [tokenCeo, setTokenCeo] = useState<string>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem('simul_painel_token') || '' : '',
  )
  const [editandoToken, setEditandoToken] = useState(false)

  // URL de instalação (proxy seguro do projeto - política anti-bloqueio)
  const baseOrigin = useMemo(() => {
    return typeof window !== 'undefined'
      ? window.location.origin
      : 'https://verificacao-projeto-panorama-18549.goskip.app'
  }, [])

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    setLoading(true)
    try {
      const [vList, cList, eList, aList, pList, mDesk, mCel] = await Promise.all([
        fetchProgramaVersoes(),
        fetchDestinatariosCadastro(),
        fetchProgramaEnvios(),
        fetchProgramaAtualizacoes(),
        fetchProgramaPropagacoes(),
        consultarProgramaManifesto({ plataforma: 'desktop' }).catch(() => null),
        consultarProgramaManifesto({ plataforma: 'celular' }).catch(() => null),
      ])
      setVersoes(vList)
      setClientes(cList)
      setEnvios(eList)
      setAtualizacoes(aList)
      setPropagacoes(pList)
      setManifestoDesktop(mDesk)
      setManifestoCelular(mCel)

      // Seleciona versão atual por padrão se disponível
      const vAtual = vList.find((v) => v.status === 'atual') || vList[0]
      if (vAtual && !versaoSelecionadaId) {
        setVersaoSelecionadaId(vAtual.id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDispararAtualizacaoBaseEPropagar(e: React.FormEvent) {
    e.preventDefault()
    if (!novaDescricaoBase.trim()) {
      setFeedbackPropagacao({ texto: 'Informe a descrição da atualização de base.', ok: false })
      return
    }

    setPropagando(true)
    setFeedbackPropagacao(null)
    try {
      const res = await registrarAtualizacaoBaseEPropagar({
        origem: novaOrigemBase,
        versaoBase: novaVersaoBase.trim(),
        descricao: novaDescricaoBase.trim(),
        dataAtualizacao: dataAtualizacaoBase,
        executadoPor: 'CEO — Direção Executiva ADECONT',
      })

      setFeedbackPropagacao({
        texto: `✔ Atualização registrada e propagada com sucesso no mesmo dia (${res.dataPropagacao}) para ${res.propagacoesCriadas} envios!`,
        ok: true,
      })
      setNovaDescricaoBase('')
      await carregarTudo()
    } catch (err) {
      setFeedbackPropagacao({
        texto: 'Erro ao registrar atualização de base e propagar. Verifique o console.',
        ok: false,
      })
      console.error(err)
    } finally {
      setPropagando(false)
    }
  }

  async function handleReenviarEnvioAtualizado(envio: ProgramaEnvioItem) {
    // Reutiliza o fluxo de envio existente
    const vRef = versoes.find((v) => v.versao === envio.versao_ref) || versaoAtiva
    if (!vRef) return

    setVersaoSelecionadaId(vRef.id)
    const cliRef = clientes.find(
      (c) => c.nome === envio.destinatario_nome || c.email === envio.destinatario_email,
    )
    if (cliRef) {
      setClienteSelecionadoId(cliRef.id)
    }
    setCanalEnvio(envio.canal || 'whatsapp')
    setAbaAtiva('envio')
  }

  const versaoAtiva = useMemo(() => {
    return (
      versoes.find((v) => v.id === versaoSelecionadaId) ||
      versoes.find((v) => v.status === 'atual') ||
      versoes[0]
    )
  }, [versoes, versaoSelecionadaId])

  const clienteAtivo = useMemo(() => {
    return clientes.find((c) => c.id === clienteSelecionadoId) || null
  }, [clientes, clienteSelecionadoId])

  const clientesFiltrados = useMemo(() => {
    const q = buscaCliente.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.empresa && c.empresa.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        (c.whatsapp && c.whatsapp.includes(q)),
    )
  }, [clientes, buscaCliente])

  // URL final de instalação gerada pelo sistema/proxy institucional
  const urlInstaladorFinal = useMemo(() => {
    const vParam = versaoAtiva?.versao ? `&v=${encodeURIComponent(versaoAtiva.versao)}` : ''
    const platParam = versaoAtiva?.plataforma === 'celular' ? '&tipo=celular' : ''
    return `${baseOrigin}/#instalador-versao?origem=ceo${platParam}${vParam}`
  }, [baseOrigin, versaoAtiva])

  // QR Code da instalação
  const qrCodeSvg = useMemo(() => {
    if (!urlInstaladorFinal) return ''
    return renderQrCodeSvg(urlInstaladorFinal, 180, '#0F294A')
  }, [urlInstaladorFinal])

  // Mensagem formatada completa com dados institucionais
  const mensagemFormatada = useMemo(() => {
    if (!versaoAtiva) return ''
    return formatarMensagemInstalacao({
      versao: versaoAtiva.versao,
      plataforma: versaoAtiva.plataforma || 'desktop',
      dataAtualizacao: versaoAtiva.data_atualizacao,
      notasVersao: versaoAtiva.notas_versao,
      destinatarioNome: clienteAtivo?.nome,
      destinatarioEmpresa: clienteAtivo?.empresa,
      urlInstalador: urlInstaladorFinal,
      canal: canalEnvio,
    })
  }, [versaoAtiva, clienteAtivo, urlInstaladorFinal, canalEnvio])

  function copiarParaClipboard(texto: string, key: string) {
    navigator.clipboard.writeText(texto)
    setCopiedKey(key)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2500)
  }

  async function handleDispararEnvio(canalEscolhido: CanalEnvioInstalacao) {
    if (!versaoAtiva) return
    setDisparando(true)
    setFeedbackEnvio(null)

    const nomeDest = clienteAtivo?.nome || 'Cliente / Usuário Geral'
    const emailDest = clienteAtivo?.email || ''
    const waDest = clienteAtivo?.whatsapp ? clienteAtivo.whatsapp.replace(/\D/g, '') : ''
    const empDest = clienteAtivo?.empresa || ''

    try {
      const novoRegistro = await registrarEnvioInstalacao({
        versao_ref: versaoAtiva.versao,
        plataforma: versaoAtiva.plataforma || 'desktop',
        data_atualizacao_ref: versaoAtiva.data_atualizacao,
        destinatario_nome: nomeDest,
        destinatario_email: emailDest,
        destinatario_whatsapp: waDest,
        destinatario_empresa: empDest,
        canal: canalEscolhido,
        status: 'ENVIADO',
        mensagem: mensagemFormatada,
        url_instalador_enviada: urlInstaladorFinal,
        enviado_por: 'CEO — Direção Executiva ADECONT',
      })

      setEnvios((prev) => [novoRegistro, ...prev])
      setFeedbackEnvio({
        texto: `✔ Envio da versão ${versaoAtiva.versao} registrado com protocolo ${novoRegistro.protocolo}!`,
        ok: true,
      })

      if (canalEscolhido === 'whatsapp') {
        const waLink = waDest
          ? `https://wa.me/${waDest}?text=${encodeURIComponent(mensagemFormatada)}`
          : `https://wa.me/?text=${encodeURIComponent(mensagemFormatada)}`
        window.open(waLink, '_blank')
      } else if (canalEscolhido === 'email') {
        const subject = `Instalação do Programa Panorama (${versaoAtiva.versao}) — ADECONT CEO`
        const mailto = `mailto:${encodeURIComponent(emailDest)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mensagemFormatada)}`
        window.location.href = mailto
      }
    } catch {
      setFeedbackEnvio({
        texto: 'Erro ao registrar envio no backend. Tente novamente.',
        ok: false,
      })
    } finally {
      setDisparando(false)
    }
  }

  async function handleCadastrarVersao(e: React.FormEvent) {
    e.preventDefault()
    if (!novaVersaoNum.trim() || !novaDataAtualizacao.trim() || !novasNotas.trim()) {
      setFeedbackVersao({ texto: 'Preencha número da versão, data e notas.', ok: false })
      return
    }

    setSalvandoVersao(true)
    setFeedbackVersao(null)
    try {
      const versaoSalva = await createProgramaVersao({
        versao: novaVersaoNum.trim(),
        plataforma: novaPlataforma,
        data_atualizacao: novaDataAtualizacao.trim(),
        notas_versao: novasNotas.trim(),
        status: novoStatus,
        url_instalador:
          novaPlataforma === 'celular' ? '/#instalador-versao?tipo=celular' : '/#instalador-versao',
        canal_distribuicao: novoCanalDist.trim(),
        controlado_por: 'CEO — Direção Executiva ADECONT',
      })

      setFeedbackVersao({
        texto: `✔ Versão ${versaoSalva.versao} cadastrada com sucesso e controlada pelo CEO!`,
        ok: true,
      })
      setNovaVersaoNum('')
      setNovasNotas('')

      const lista = await fetchProgramaVersoes()
      setVersoes(lista)
      setVersaoSelecionadaId(versaoSalva.id)

      setTimeout(() => {
        setAbaAtiva('envio')
        setFeedbackVersao(null)
      }, 1400)
    } catch {
      setFeedbackVersao({
        texto: 'Erro ao cadastrar versão no banco de dados.',
        ok: false,
      })
    } finally {
      setSalvandoVersao(false)
    }
  }

  async function handlePromoverAtual(id: string, plataforma?: 'desktop' | 'celular') {
    try {
      await setVersaoComoAtual(id, plataforma)
      const lista = await fetchProgramaVersoes()
      setVersoes(lista)
    } catch (err) {
      console.error('Falha ao promover versão:', err)
    }
  }

  function salvarTokenCeo() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('simul_painel_token', tokenCeo.trim())
    }
    setEditandoToken(false)
  }

  return (
    <section id="instalador-versao" className="scroll-mt-24 space-y-6">
      {/* CABEÇALHO PROEMINENTE DO CEO — DESTAQUE VISUAL MÁXIMO ADECONT */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-panorama-navy via-[#1B365D] to-[#0A192F] text-white p-6 sm:p-7 shadow-xl border-2 border-panorama-gold/70">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-panorama-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-panorama-gold/30 via-panorama-gold/20 to-transparent rounded-2xl backdrop-blur-md border border-panorama-gold/50 shadow-inner shrink-0 text-panorama-gold-light">
              <PackageCheck className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-panorama-gold via-amber-300 to-panorama-gold-dark text-panorama-navy uppercase tracking-wider shadow-sm">
                  #1 CONTROLE GERAL CEO
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Operação Ativa ADECONT
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Instalador e Controle de Versão do Programa
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
                Painel central do <strong>CEO (Direção Executiva ADECONT)</strong> para organizar o
                envio da instalação do programa via e-mail e plataformas digitais para usuários e
                clientes cadastrados com as devidas permissões, controlando rigorosamente as
                versões, a data de cada atualização e os registros de envio.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
            <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-md border border-white/20">
              <AdecontLogo className="h-7 w-auto" />
            </div>

            {/* Chave de controle do CEO */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
              <KeyRound className="w-3.5 h-3.5 text-panorama-gold-light" />
              <span>Chave CEO:</span>
              {editandoToken ? (
                <div className="flex items-center gap-1">
                  <input
                    type="password"
                    value={tokenCeo}
                    onChange={(e) => setTokenCeo(e.target.value)}
                    placeholder="Token do CEO"
                    className="px-1.5 py-0.5 text-[11px] bg-slate-900 border border-panorama-gold rounded text-white w-28 focus:outline-none"
                  />
                  <button
                    onClick={salvarTokenCeo}
                    className="text-[10px] font-bold px-1.5 py-0.5 bg-panorama-gold text-panorama-navy rounded hover:brightness-110"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditandoToken(true)}
                  className="font-mono text-panorama-gold-light hover:underline text-[11px]"
                  title="Clique para configurar token administrativo do CEO"
                >
                  {tokenCeo ? '•••••••• (Ativo)' : 'Configurar Token'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS DO PAINEL */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white p-2 rounded-xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('envio')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            abaAtiva === 'envio'
              ? 'bg-panorama-navy text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4 text-panorama-gold" />
          <span>1. Envio da Instalação (E-mail & WhatsApp)</span>
        </button>

        <button
          onClick={() => setAbaAtiva('versoes')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            abaAtiva === 'versoes'
              ? 'bg-panorama-navy text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>2. Gestão de Versões pelo CEO ({versoes.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva('historico_envios')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            abaAtiva === 'historico_envios'
              ? 'bg-panorama-navy text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-blue-400" />
          <span>3. Histórico de Envios Registrados ({envios.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva('atualizacoes')}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            abaAtiva === 'atualizacoes'
              ? 'bg-panorama-navy text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>4. Atualizações Automáticas & Propagação ({atualizacoes.length})</span>
        </button>
      </div>

      {/* ABA 1: ENVIO DA INSTALAÇÃO (VERSÃO + CLIENTE CADASTRADO + CANAL) */}
      {abaAtiva === 'envio' && (
        <div className="space-y-6">
          {/* SELETOR DE VERSÃO E DESTINATÁRIO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Bloco de Seleção da Versão (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  {versaoAtiva?.plataforma === 'celular' ? (
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Monitor className="w-4 h-4 text-panorama-navy" />
                  )}
                  1. Versão do Programa Homologada pelo CEO:
                </label>
                <div className="flex items-center gap-1.5">
                  {versaoAtiva?.plataforma === 'celular' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Smartphone className="w-3 h-3 text-emerald-700" />
                      CELULAR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                      <Monitor className="w-3 h-3 text-blue-700" />
                      DESKTOP
                    </span>
                  )}
                  {versaoAtiva && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        versaoAtiva.status === 'atual'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {versaoAtiva.status === 'atual' ? 'VERSÃO ATUAL' : versaoAtiva.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Filtro rápido de plataforma para o seletor */}
              <div className="flex items-center gap-1.5 pb-1">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Filtrar:</span>
                <button
                  type="button"
                  onClick={() => setFiltroPlataforma('todas')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    filtroPlataforma === 'todas'
                      ? 'bg-panorama-navy text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({versoes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroPlataforma('celular')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    filtroPlataforma === 'celular'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  Celular ({versoes.filter((v) => v.plataforma === 'celular').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroPlataforma('desktop')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    filtroPlataforma === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  Desktop ({versoes.filter((v) => v.plataforma !== 'celular').length})
                </button>
              </div>

              <select
                value={versaoSelecionadaId}
                onChange={(e) => setVersaoSelecionadaId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
              >
                {versoes
                  .filter((v) => {
                    if (filtroPlataforma === 'celular') return v.plataforma === 'celular'
                    if (filtroPlataforma === 'desktop') return v.plataforma !== 'celular'
                    return true
                  })
                  .map((v) => {
                    const isCel = v.plataforma === 'celular'
                    return (
                      <option key={v.id} value={v.id}>
                        {isCel ? '📱 [CELULAR]' : '💻 [DESKTOP]'} {v.versao} — Atualização:{' '}
                        {v.data_atualizacao.split('-').reverse().join('/')} (
                        {v.status === 'atual' ? 'VERSÃO ATUAL' : v.status})
                      </option>
                    )
                  })}
              </select>

              {versaoAtiva && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    versaoAtiva.plataforma === 'celular'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200 pb-1.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-panorama-gold-dark" />
                      Data da Atualização:{' '}
                      <strong className="text-slate-900">
                        {versaoAtiva.data_atualizacao.split('-').reverse().join('/')}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                      {versaoAtiva.plataforma === 'celular' ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Versão para Celular</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="w-3.5 h-3.5 text-blue-600" />
                          <span>Versão para Computador (Desktop)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed font-sans text-xs">
                    <strong>Notas da Versão (o que mudou):</strong> {versaoAtiva.notas_versao}
                  </p>
                </div>
              )}
            </div>

            {/* Bloco de Seleção de Cliente / Usuário Cadastrado (6 cols) */}
            <div className="lg:col-span-6 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-panorama-navy" />
                  2. Usuário / Cliente Cadastrado (Permissões):
                </label>
                <span className="text-[11px] text-slate-500">
                  {clientes.length} cadastrados no banco
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  placeholder="Filtrar por nome, empresa, e-mail ou WhatsApp…"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                />
              </div>

              <select
                value={clienteSelecionadoId}
                onChange={(e) => setClienteSelecionadoId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
              >
                <option value="">— Envio Geral / Não vinculado a cliente específico —</option>
                {clientesFiltrados.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.nome} {cli.empresa ? `(${cli.empresa})` : ''} — {cli.email}
                    {cli.whatsapp ? ` • WA: ${cli.whatsapp}` : ''}
                  </option>
                ))}
              </select>

              {clienteAtivo ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div>
                    <strong>Destinatário Autorizado:</strong> {clienteAtivo.nome}
                    {clienteAtivo.empresa && <span> • {clienteAtivo.empresa}</span>}
                    <div className="text-[11px] text-emerald-700">
                      E-mail: {clienteAtivo.email}
                      {clienteAtivo.whatsapp && ` | WhatsApp: ${clienteAtivo.whatsapp}`}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 uppercase">
                    Homologado CEO
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  ℹ️ Selecione um cliente para direcionamento pessoal ou envie para múltiplos
                  contatos com a mensagem institucional oficial da ADECONT.
                </p>
              )}
            </div>
          </div>

          {/* PAINEL CENTRAL DE DISPARO: MENSAGEM, QR CODE E CANAIS DE PLATAFORMAS DIGITAIS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-2xl border-2 border-panorama-gold/40 bg-white shadow-sm">
            {/* Coluna QR Code & Links Oficiais (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-between p-5 bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 text-center space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-panorama-navy">
                  {versaoAtiva?.plataforma === 'celular' ? (
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <QrCode className="w-4 h-4 text-panorama-gold-dark" />
                  )}
                  {versaoAtiva?.plataforma === 'celular'
                    ? 'QR Code — Instalação no Celular'
                    : 'QR Code Oficial do Instalador ADECONT'}
                </div>
                <p className="text-[11px] text-slate-500 max-w-[240px]">
                  {versaoAtiva?.plataforma === 'celular'
                    ? 'Aponte a câmera do smartphone para instalar a versão mobile homologada '
                    : 'Aponte a câmera do celular para instalar o PWA homologado na versão '}
                  <strong>{versaoAtiva?.versao}</strong>.
                </p>
              </div>

              <div
                className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md inline-flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />

              <div className="w-full space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copiarParaClipboard(urlInstaladorFinal, 'link_instalador')}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'link_instalador' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    Copiar Link Seguro
                  </button>

                  <a
                    href={urlInstaladorFinal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center justify-center shadow-xs transition-colors"
                    title="Testar Link de Instalação"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-[10px] text-slate-400 font-mono break-all">
                  {urlInstaladorFinal}
                </p>
              </div>
            </div>

            {/* Coluna Mensagem Formatada ADECONT & Botões de Disparo (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-panorama-navy" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Mensagem Institucional do CEO para o Envio
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-panorama-gold-dark">
                    Versão: {versaoAtiva?.versao} • Data: {versaoAtiva?.data_atualizacao}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans max-h-60 overflow-y-auto shadow-inner">
                  {mensagemFormatada}
                </div>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Disparar Envio pelo CEO:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Registrado automaticamente no banco de dados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleDispararEnvio('whatsapp')}
                    disabled={disparando}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleDispararEnvio('email')}
                    disabled={disparando}
                    className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Enviar via E-mail Oficial</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      copiarParaClipboard(mensagemFormatada, 'msg_completa_ceo')
                      handleDispararEnvio('link_direto')
                    }}
                    disabled={disparando}
                    className="py-2.5 px-3 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {copiedKey === 'msg_completa_ceo' ? (
                      <>
                        <Check className="w-4 h-4 text-panorama-gold" />
                        <span>Mensagem Copiada & Registrada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-panorama-gold-light" />
                        <span>Copiar Mensagem & Registrar Envio</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDispararEnvio('qr_code')}
                    disabled={disparando}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4 text-panorama-gold" />
                    <span>Registrar Envio via QR Code</span>
                  </button>
                </div>

                {feedbackEnvio && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      feedbackEnvio.ok
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {feedbackEnvio.texto}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CARD INFORMATIVO INSTITUCIONAL ADECONT */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-950 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-panorama-navy shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Garantia de Integridade e Anti-Bloqueio ADECONT:</strong> Os downloads e links
              de instalação são servidos diretamente pelo proxy e roteador do próprio sistema
              ADECONT, sem redirecionamentos externos que possam ser bloqueados por filtros
              corporativos ou navegadores (política institucional de integridade anti-bloqueio). O
              CEO centraliza todas as versões e garante que os clientes recebam a compilação oficial
              homologada.
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: GESTÃO DE VERSÕES PELO CEO (CADASTRO E HISTÓRICO) */}
      {abaAtiva === 'versoes' && (
        <div className="space-y-6">
          {/* Formulário de Cadastro de Versão pelo CEO */}
          <form
            onSubmit={handleCadastrarVersao}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Cadastrar Nova Versão do Programa (Ação do CEO)
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-panorama-navy text-white">
                Controle CEO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Número da Versão *</label>
                <input
                  type="text"
                  value={novaVersaoNum}
                  onChange={(e) => setNovaVersaoNum(e.target.value)}
                  placeholder="Ex.: v2.8.5 ou v2.8.5-m"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>Plataforma *</span>
                  {novaPlataforma === 'celular' ? (
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </label>
                <select
                  value={novaPlataforma}
                  onChange={(e) => {
                    const plat = e.target.value as 'desktop' | 'celular'
                    setNovaPlataforma(plat)
                    if (plat === 'celular') {
                      setNovoCanalDist('WhatsApp, QR Code Celular e E-mail')
                    } else {
                      setNovoCanalDist('E-mail, WhatsApp e QR Code Seguro')
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                >
                  <option value="celular">📱 Celular (Mobile / Smartphone)</option>
                  <option value="desktop">💻 Desktop (Computador / PC)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Data da Atualização *</label>
                <input
                  type="date"
                  value={novaDataAtualizacao}
                  onChange={(e) => setNovaDataAtualizacao(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Status da Versão *</label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusVersao)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                >
                  <option value="atual">Versão Atual (Ativa)</option>
                  <option value="anterior">Versão Anterior</option>
                  <option value="planejada">Versão Planejada / Em Homologação</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Descrição / Notas da Versão (O que mudou nesta atualização) *
              </label>
              <textarea
                rows={3}
                value={novasNotas}
                onChange={(e) => setNovasNotas(e.target.value)}
                placeholder="Descreva as alterações normativas, novas classificações NCM adicionadas, melhorias nos simuladores ou correções realizadas..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-sans focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Canais de Distribuição</label>
                <input
                  type="text"
                  value={novoCanalDist}
                  onChange={(e) => setNovoCanalDist(e.target.value)}
                  placeholder="Ex.: E-mail, WhatsApp e QR Code Seguro"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Responsável pelo Controle
                </label>
                <input
                  type="text"
                  readOnly
                  value="CEO — Direção Executiva ADECONT"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-600 font-semibold"
                />
              </div>
            </div>

            {feedbackVersao && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  feedbackVersao.ok
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}
              >
                {feedbackVersao.texto}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={salvandoVersao}
                className="px-5 py-2.5 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4 text-panorama-gold" />
                <span>
                  {salvandoVersao
                    ? 'Registrando no Banco pelo CEO...'
                    : 'Salvar Versão no Histórico'}
                </span>
              </button>
            </div>
          </form>

          {/* HISTÓRICO DE VERSÕES DO PROGRAMA ORDENADO POR DATA */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-panorama-gold-dark" />
                  Histórico de Versões do Programa (Ordenado por Data de Atualização)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro cronológico controlado pelo CEO com número da versão, data da atualização
                  e notas oficiais.
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {versoes.length} versões registradas
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {versoes.map((item) => {
                const isAtual = item.status === 'atual'
                const isCelular = item.plataforma === 'celular'
                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 transition-colors space-y-2.5 ${
                      isAtual
                        ? isCelular
                          ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600'
                          : 'bg-blue-50/40 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Ícone novo de celular vs ícone de desktop */}
                          <div
                            className={`p-1.5 rounded-lg border ${
                              isCelular
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                : 'bg-blue-100 border-blue-300 text-blue-800'
                            }`}
                            title={
                              isCelular
                                ? 'Versão para Celular (Mobile)'
                                : 'Versão para Desktop (Computador)'
                            }
                          >
                            {isCelular ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Monitor className="w-4 h-4" />
                            )}
                          </div>

                          <span className="text-base font-black text-slate-900 font-mono">
                            {item.versao}
                          </span>

                          {/* Badge de plataforma com o novo ícone */}
                          {isCelular ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs uppercase tracking-wider">
                              <Smartphone className="w-3 h-3" />
                              CELULAR
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-700 text-white shadow-xs uppercase tracking-wider">
                              <Monitor className="w-3 h-3" />
                              DESKTOP
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isAtual
                                ? 'bg-amber-400 text-panorama-navy font-black shadow-xs border border-amber-500'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isAtual ? '★ VERSÃO ATUAL' : item.status.toUpperCase()}
                          </span>

                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-panorama-gold-dark" />
                            Data da Atualização:{' '}
                            <strong className="text-slate-900">
                              {item.data_atualizacao.split('-').reverse().join('/')}
                            </strong>
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Plataforma:{' '}
                          <strong>
                            {isCelular ? 'Celular (Android/iOS)' : 'Desktop/Computador'}
                          </strong>{' '}
                          • Controlado por: <strong>{item.controlado_por || 'CEO ADECONT'}</strong>{' '}
                          • Canais: {item.canal_distribuicao || 'E-mail, WhatsApp e PWA'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isAtual && (
                          <button
                            onClick={() =>
                              handlePromoverAtual(item.id, item.plataforma || 'desktop')
                            }
                            className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title={`Definir como a versão atual homologada pelo CEO para ${isCelular ? 'celular' : 'desktop'}`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Definir como Atual ({isCelular ? 'Celular' : 'Desktop'})</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setVersaoSelecionadaId(item.id)
                            setAbaAtiva('envio')
                          }}
                          className="px-3 py-1.5 rounded-lg bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-3.5 h-3.5 text-panorama-gold" />
                          <span>Organizar Envio</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                      <strong className="text-slate-900 block mb-0.5">Notas da Versão:</strong>
                      {item.notas_versao}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: HISTÓRICO DE ENVIOS REGISTRADOS (QUEM, QUAL VERSÃO, QUANDO) */}
      {abaAtiva === 'historico_envios' && (
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Histórico de Envios de Instalação (Controlado pelo CEO)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rastreabilidade completa: registro de para quem foi enviado, qual versão, data do
                disparo e protocolo oficial.
              </p>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {envios.length} envios registrados
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Plataforma</th>
                  <th className="p-3">Versão Enviada</th>
                  <th className="p-3">Data Atualização</th>
                  <th className="p-3">Canal</th>
                  <th className="p-3">Data do Envio</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Propagação / Base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {envios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400 text-xs">
                      Nenhum envio registrado ainda. Organize seu primeiro disparo na Aba 1.
                    </td>
                  </tr>
                ) : (
                  envios.map((env) => (
                    <tr key={env.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-panorama-navy">
                        {env.protocolo || env.id.slice(0, 10).toUpperCase()}
                      </td>
                      <td className="p-3 font-semibold text-slate-900">
                        {env.destinatario_nome}
                        {env.destinatario_empresa && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {env.destinatario_empresa}
                          </span>
                        )}
                        {env.destinatario_email && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {env.destinatario_email}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {env.plataforma === 'celular' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Smartphone className="w-3 h-3 text-emerald-700" />
                            Celular
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <Monitor className="w-3 h-3 text-blue-700" />
                            Desktop
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-800 font-mono">{env.versao_ref}</td>
                      <td className="p-3 text-slate-600">
                        {env.data_atualizacao_ref
                          ? env.data_atualizacao_ref.split('-').reverse().join('/')
                          : '—'}
                      </td>
                      <td className="p-3 uppercase font-bold text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            env.canal === 'whatsapp'
                              ? 'bg-emerald-100 text-emerald-800'
                              : env.canal === 'email'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {env.canal}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {env.data_envio
                          ? env.data_envio.split('-').reverse().join('/')
                          : env.created
                            ? new Date(env.created).toLocaleDateString('pt-BR')
                            : '—'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {env.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {env.requer_atualizacao ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-700" />
                            Requer Atualização
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Base Sincronizada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA 4: ATUALIZAÇÕES AUTOMÁTICAS & PROPAGAÇÃO NO MESMO DIA */}
      {abaAtiva === 'atualizacoes' && (
        <div className="space-y-6">
          {/* PAINEL DE STATUS DO MECANISMO E LINKS DO MANIFESTO */}
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-100" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    Mecanismo de Atualizações Automáticas e Propagação no Mesmo Dia
                  </h3>
                  <p className="text-xs text-slate-600">
                    O programa instalado consulta o <strong>Manifesto Oficial ADECONT</strong> para
                    manter a base sincronizada e aplicar normas e classificações no mesmo dia em que
                    são atualizadas.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  Mecanismo Ativo
                </span>
              </div>
            </div>

            {/* Endpoints do Manifesto para Configuração no Programa Instalado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Endpoint Desktop */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900">
                    <Monitor className="w-4 h-4 text-blue-700" />
                    Manifesto para Desktop (PC / Notebook)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                    Versão Atual: {manifestoDesktop?.versao_atual || 'v2.8.4'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-blue-200 font-mono text-[11px] text-slate-800 break-all select-all flex items-center justify-between gap-2">
                  <span>{`${import.meta.env.VITE_POCKETBASE_URL || ''}/backend/v1/programa-manifesto?plataforma=desktop`}</span>
                  <button
                    type="button"
                    onClick={() =>
                      copiarParaClipboard(
                        `${import.meta.env.VITE_POCKETBASE_URL || ''}/backend/v1/programa-manifesto?plataforma=desktop`,
                        'manifesto_desktop',
                      )
                    }
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
                    title="Copiar URL do manifesto desktop"
                  >
                    {copiedKey === 'manifesto_desktop' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Consumido pelo programa Desktop ao iniciar para verificar se a base ou o software
                  possuem novas compilações.
                </p>
              </div>

              {/* Endpoint Mobile */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    Manifesto para Celular (Mobile PWA)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    Versão Atual: {manifestoCelular?.versao_atual || 'v2.8.4-m'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200 font-mono text-[11px] text-slate-800 break-all select-all flex items-center justify-between gap-2">
                  <span>{`${import.meta.env.VITE_POCKETBASE_URL || ''}/backend/v1/programa-manifesto?plataforma=celular`}</span>
                  <button
                    type="button"
                    onClick={() =>
                      copiarParaClipboard(
                        `${import.meta.env.VITE_POCKETBASE_URL || ''}/backend/v1/programa-manifesto?plataforma=celular`,
                        'manifesto_celular',
                      )
                    }
                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
                    title="Copiar URL do manifesto celular"
                  >
                    {copiedKey === 'manifesto_celular' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Permite aos smartphones instalados sincronizar instantaneamente classificações e
                  tabelas da Reforma Tributária.
                </p>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO MANUAL DE ATUALIZAÇÃO DA BASE E PROPAGAÇÃO NO MESMO DIA */}
          <form
            onSubmit={handleDispararAtualizacaoBaseEPropagar}
            className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-panorama-navy" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Registrar Atualização de Base e Propagar no Mesmo Dia (Ação CEO)
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Gatilho Imediato
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ao registrar uma atualização de base, o sistema percorre{' '}
              <strong>todos os envios emitidos (desktop e celular)</strong> e cria registros de
              propagação datados <strong>estritamente no mesmo dia da atualização</strong>, marcando
              os envios como requerentes de atualização até sua confirmação.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Origem da Atualização *</label>
                <select
                  value={novaOrigemBase}
                  onChange={(e) => setNovaOrigemBase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                >
                  <option value="manual CEO">Manual CEO (Direção Executiva)</option>
                  <option value="base de classificações">
                    Base de Classificações NCM / TIPI / SVRS
                  </option>
                  <option value="rotina semanal de normas">
                    Rotina Semanal de Normas (Segunda-feira)
                  </option>
                  <option value="reforma tributária atos">
                    Atos Oficiais e Decretos Regulamentadores
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Identificador / Versão da Base *
                </label>
                <input
                  type="text"
                  value={novaVersaoBase}
                  onChange={(e) => setNovaVersaoBase(e.target.value)}
                  placeholder="Ex.: base-2026-11-01 ou ncm-15240-rev3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Data do Evento (Mesmo Dia) *
                </label>
                <input
                  type="date"
                  value={dataAtualizacaoBase}
                  onChange={(e) => setDataAtualizacaoBase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Descrição Detalhada das Alterações da Base *
              </label>
              <textarea
                rows={3}
                value={novaDescricaoBase}
                onChange={(e) => setNovaDescricaoBase(e.target.value)}
                placeholder="Ex.: Atualização da tabela de classificações NCM, novas resoluções publicadas pelo CGIBS e alíquotas de referência CBS/IBS ajustadas..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-sans focus:ring-2 focus:ring-panorama-gold/70 focus:outline-none"
                required
              />
            </div>

            {feedbackPropagacao && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  feedbackPropagacao.ok
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-50 text-rose-900 border border-rose-300'
                }`}
              >
                {feedbackPropagacao.texto}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={propagando}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${propagando ? 'animate-spin' : ''}`} />
                <span>
                  {propagando
                    ? 'Propagando para todos os envios no mesmo dia...'
                    : 'Registrar Atualização de Base e Propagar'}
                </span>
              </button>
            </div>
          </form>

          {/* HISTÓRICO DE ATUALIZAÇÕES DA BASE E SUAS PROPAGAÇÕES */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-panorama-navy" />
                  Atualizações de Base Registradas & Rastreabilidade de Propagação
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lista cronológica das atualizações da base, data do evento, origem e total de
                  envios afetados no mesmo dia.
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                {atualizacoes.length} atualizações registradas
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {atualizacoes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Nenhuma atualização de base registrada ainda.
                </div>
              ) : (
                atualizacoes.map((att) => {
                  const propsDestaAtt = propagacoes.filter((p) => p.atualizacao_id === att.id)
                  return (
                    <div
                      key={att.id}
                      className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-panorama-navy text-white uppercase tracking-wider">
                            {att.origem}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {att.versao_base}
                          </span>
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-panorama-gold-dark" />
                            Data da Atualização:{' '}
                            <strong className="text-slate-900">
                              {att.data_atualizacao.split('-').reverse().join('/')}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            {att.total_envios_afetados ?? propsDestaAtt.length} envios propagados no
                            mesmo dia
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {att.descricao}
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>
                          Responsável: <strong>{att.executado_por || 'CEO ADECONT'}</strong>
                        </span>
                        <span>
                          Data da Propagação:{' '}
                          <strong>
                            {att.data_atualizacao.split('-').reverse().join('/')} (Mesmo Dia)
                          </strong>
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* LISTA DE ENVIOS QUE REQUEREM ATUALIZAÇÃO / COM BOTÃO DE REENVIO */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Envios Pendentes de Atualização ("Requer Atualização")
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistemas e destinatários que receberam a propagação da nova base e podem receber
                  um reenvio/notificação oficial pelo fluxo existente.
                </p>
              </div>

              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {envios.filter((e) => e.requer_atualizacao).length} pendentes
              </span>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {envios.filter((e) => e.requer_atualizacao).length === 0 ? (
                <div className="p-6 text-center text-emerald-700 bg-emerald-50/50 text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Todos os sistemas enviados estão sincronizados com a base atual ou nenhum envio
                  pendente!
                </div>
              ) : (
                envios
                  .filter((e) => e.requer_atualizacao)
                  .map((env) => (
                    <div
                      key={env.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-panorama-navy">
                            {env.protocolo || env.id.slice(0, 10).toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {env.destinatario_nome}{' '}
                            {env.destinatario_empresa ? `(${env.destinatario_empresa})` : ''}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                              env.plataforma === 'celular'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {env.plataforma === 'celular' ? '📱 Celular' : '💻 Desktop'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Versão enviada: <strong>{env.versao_ref}</strong> • Canal:{' '}
                          <strong className="uppercase">{env.canal}</strong> • Data do Envio:{' '}
                          {env.data_envio ? env.data_envio.split('-').reverse().join('/') : '—'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReenviarEnvioAtualizado(env)}
                        className="px-3.5 py-2 rounded-xl bg-panorama-navy hover:bg-panorama-navy-light text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 text-panorama-gold" />
                        <span>Reenviar com Base Atualizada</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
