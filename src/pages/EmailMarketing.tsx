import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Send,
  Sliders,
  History,
  Trash2,
  ArrowLeft,
  Building2,
  Info,
  Filter,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { ConnectorButton } from '@/components/skip/ConnectorButton'
import { listConnectors, type ConnectorStatus } from '@/lib/skipConnectors'
import { listarEmpresasParaRelatorio } from '@/services/cadastroEmpresas'
import { listarEmpresasInativas } from '@/services/cadastroEmpresasInativos'
import {
  listarAudienciasMailchimp,
  sincronizarClientesComMailchimp,
  carregarHistoricoSincronizacoes,
  salvarEntradaHistorico,
  limparHistoricoSincronizacoes,
  extrairEmailValido,
  type MailchimpAudience,
  type SyncMailchimpResult,
  type MailchimpSyncHistoryEntry,
} from '@/services/mailchimpSyncService'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import { useToast } from '@/hooks/use-toast'

export default function EmailMarketing() {
  const { toast } = useToast()

  // Estado do Conector
  const [connectorStatus, setConnectorStatus] = useState<ConnectorStatus | null>(null)
  const isConnected = connectorStatus === 'connected'

  const verificarStatusConector = useCallback(async () => {
    try {
      const all = await listConnectors()
      const found = all.find((c) => c.toolkit === 'mailchimp')
      setConnectorStatus(found?.status ?? 'not_connected')
    } catch (e) {
      console.warn('Não foi possível verificar status do conector Mailchimp:', e)
      setConnectorStatus('not_connected')
    }
  }, [])

  useEffect(() => {
    verificarStatusConector()
    const onFocus = () => verificarStatusConector()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [verificarStatusConector])

  // Audiências
  const [audiencias, setAudiencias] = useState<MailchimpAudience[]>([])
  const [audienciaSelecionadaId, setAudienciaSelecionadaId] = useState<string>('')
  const [carregandoAudiencias, setCarregandoAudiencias] = useState<boolean>(false)
  const [erroAudiencias, setErroAudiencias] = useState<string | null>(null)

  // Clientes
  const [clientesAtivos, setClientesAtivos] = useState<EmpresaRecord[]>([])
  const [clientesInativos, setClientesInativos] = useState<EmpresaRecord[]>([])
  const [carregandoClientes, setCarregandoClientes] = useState<boolean>(false)

  // Opções de Sync
  const [incluirInativos, setIncluirInativos] = useState<boolean>(false)
  const [statusOptIn, setStatusOptIn] = useState<'pending' | 'subscribed'>('pending')
  const [atualizarExistentes, setAtualizarExistentes] = useState<boolean>(true)

  // Execução de Sincronização
  const [sincronizando, setSincronizando] = useState<boolean>(false)
  const [progressoTexto, setProgressoTexto] = useState<string>('')
  const [resultadoAtual, setResultadoAtual] = useState<SyncMailchimpResult | null>(null)

  // Histórico
  const [historico, setHistorico] = useState<MailchimpSyncHistoryEntry[]>([])

  // Carrega clientes do cadastro
  const carregarClientesLocais = useCallback(async () => {
    setCarregandoClientes(true)
    try {
      const [ativos, inativosRes] = await Promise.all([
        listarEmpresasParaRelatorio({ somenteAtivos: true }, 5000),
        listarEmpresasInativas({ pagina: 1, porPagina: 5000 }),
      ])
      setClientesAtivos(ativos)
      setClientesInativos(inativosRes.items || [])
    } catch (err: any) {
      console.error('Erro ao carregar clientes para o e-mail marketing:', err)
      toast({
        title: 'Aviso sobre cadastro de clientes',
        description: 'Não foi possível carregar toda a base analítica de clientes.',
        variant: 'destructive',
      })
    } finally {
      setCarregandoClientes(false)
    }
  }, [toast])

  // Carrega audiências quando o conector estiver ativo
  const carregarAudiencias = useCallback(async () => {
    if (!isConnected) {
      setAudiencias([])
      setAudienciaSelecionadaId('')
      return
    }

    setCarregandoAudiencias(true)
    setErroAudiencias(null)
    try {
      const res = await listarAudienciasMailchimp()
      if (res.sucesso) {
        setAudiencias(res.audiencias)
        if (res.audiencias.length > 0 && !audienciaSelecionadaId) {
          setAudienciaSelecionadaId(res.audiencias[0].id)
        }
      } else {
        setErroAudiencias(res.erro || 'Falha ao buscar audiências no Mailchimp.')
      }
    } catch (err: any) {
      setErroAudiencias(err?.message || 'Erro inesperado ao consultar audiências.')
    } finally {
      setCarregandoAudiencias(false)
    }
  }, [isConnected, audienciaSelecionadaId])

  // Efeito de inicialização
  useEffect(() => {
    carregarClientesLocais()
    setHistorico(carregarHistoricoSincronizacoes())
  }, [carregarClientesLocais])

  useEffect(() => {
    if (isConnected) {
      carregarAudiencias()
    }
  }, [isConnected, carregarAudiencias])

  // Contagem de clientes elegíveis
  const clientesParaSincronizar = useMemo(() => {
    return incluirInativos ? [...clientesAtivos, ...clientesInativos] : clientesAtivos
  }, [incluirInativos, clientesAtivos, clientesInativos])

  const contagemEmails = useMemo(() => {
    let comEmail = 0
    let semEmail = 0
    for (const c of clientesParaSincronizar) {
      if (extrairEmailValido(c.email)) {
        comEmail++
      } else {
        semEmail++
      }
    }
    return { comEmail, semEmail, total: clientesParaSincronizar.length }
  }, [clientesParaSincronizar])

  const audienciaSelecionada = useMemo(() => {
    return audiencias.find((a) => a.id === audienciaSelecionadaId)
  }, [audiencias, audienciaSelecionadaId])

  // Disparo de sincronização
  const handleSincronizar = async () => {
    if (!isConnected) {
      toast({
        title: 'Conta não conectada',
        description: 'Conecte sua conta do Mailchimp antes de iniciar a sincronização.',
        variant: 'destructive',
      })
      return
    }

    if (!audienciaSelecionadaId) {
      toast({
        title: 'Nenhuma audiência selecionada',
        description: 'Selecione uma audiência de destino no Mailchimp.',
        variant: 'destructive',
      })
      return
    }

    if (contagemEmails.comEmail === 0) {
      toast({
        title: 'Nenhum e-mail para enviar',
        description: 'Os clientes filtrados não possuem e-mails cadastrados.',
        variant: 'destructive',
      })
      return
    }

    setSincronizando(true)
    setProgressoTexto('Iniciando sincronização com o Mailchimp...')
    setResultadoAtual(null)

    try {
      const res = await sincronizarClientesComMailchimp(
        clientesParaSincronizar,
        {
          listId: audienciaSelecionadaId,
          status: statusOptIn,
          incluirInativos,
          atualizarExistentes,
        },
        (p) => {
          setProgressoTexto(p.mensagem)
        },
      )

      res.audienciaNome = audienciaSelecionada?.name || audienciaSelecionadaId
      setResultadoAtual(res)

      // Grava no histórico local
      salvarEntradaHistorico({
        dataHora: res.dataHora,
        audienciaId: res.audienciaId,
        audienciaNome: res.audienciaNome,
        totalClientesAnalisados: res.totalClientesAnalisados,
        totalComEmail: contagemEmails.comEmail,
        totalSemEmail: res.totalSemEmail,
        totalSucessos: res.totalInscritosEnviados + res.totalAtualizados,
        totalErros: res.totalErros,
        incluiuInativos: incluirInativos,
        statusOptIn,
      })

      setHistorico(carregarHistoricoSincronizacoes())

      toast({
        title: 'Sincronização concluída!',
        description: `${res.totalInscritosEnviados + res.totalAtualizados} contatos processados na audiência "${res.audienciaNome}".`,
      })

      // Atualiza os contadores da lista no Mailchimp
      carregarAudiencias()
    } catch (err: any) {
      toast({
        title: 'Erro na sincronização',
        description: err?.message || 'Falha ao sincronizar clientes com o Mailchimp.',
        variant: 'destructive',
      })
    } finally {
      setSincronizando(false)
      setProgressoTexto('')
    }
  }

  const handleLimparHistorico = () => {
    if (window.confirm('Deseja realmente limpar todo o histórico local de sincronizações?')) {
      limparHistoricoSincronizacoes()
      setHistorico([])
      toast({
        title: 'Histórico limpo',
        description: 'Os registros locais de sincronizações foram removidos.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Topo / Header Padrão ADECONT */}
      <header className="bg-panorama-navy border-b border-slate-700/60 sticky top-0 z-30 shadow-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                to="/cadastro-clientes"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-600/50"
                title="Voltar ao Cadastro de Clientes"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cadastro de Clientes</span>
              </Link>
              <div className="h-5 w-px bg-slate-700 hidden sm:block" />
              <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-xs flex items-center">
                <AdecontLogo variant="color" showTagline={false} className="h-7 w-auto" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  E-mail Marketing ADECONT
                </h1>
                <p className="text-[10px] text-slate-300 hidden md:block">
                  Integração oficial Mailchimp em modo individual por usuário
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
              >
                Início
              </Link>
              <ConnectorButton
                toolkit="mailchimp"
                name="Mailchimp"
                className="shadow-xs font-semibold text-xs"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Banner Informativo de Modo "Conta de Cada Usuário" */}
        <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-sky-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-400" />
                Segurança & Privacidade
              </span>
              <span className="text-xs text-slate-400">Modo: Conta Própria de Usuário</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">
              Envio e Sincronização Direta com seu Mailchimp
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Cada usuário conecta a sua própria conta do Mailchimp. Suas credenciais não são
              compartilhadas e os contatos da carteira analítica da ADECONT são enviados diretamente
              para a sua audiência selecionada, respeitando as normas de opt-in.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div className="text-left text-xs">
              <p className="font-semibold text-slate-200">
                {isConnected ? 'Conta Conectada' : 'Desconectado'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isConnected
                  ? 'Pronto para sincronizar audiências'
                  : 'Clique no botão acima para conectar'}
              </p>
            </div>
          </div>
        </div>

        {/* Caso NÃO esteja conectado: Card Explicativo com Ação Clara */}
        {!isConnected && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center space-y-4 max-w-2xl mx-auto my-8">
            <div className="w-14 h-14 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Conecte sua conta do Mailchimp</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Para enviar contatos, atualizar inscrições e sincronizar a carteira de clientes da
                ADECONT com suas campanhas, autorize a conexão com sua conta do Mailchimp.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <ConnectorButton
                toolkit="mailchimp"
                name="Mailchimp"
                className="px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg"
              />
            </div>
            <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Nenhuma ação de envio pode ser disparada sem a conta conectada.</span>
            </div>
          </div>
        )}

        {/* Se CONECTADO: Painel de Configuração e Disparo de Sincronização */}
        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna 1 e 2: Configuração e Audiências */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card de Seleção de Audiência */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Audiência de Destino no Mailchimp
                      </h3>
                      <p className="text-xs text-slate-500">
                        Escolha a lista em que os contatos serão cadastrados ou atualizados
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={carregarAudiencias}
                    disabled={carregandoAudiencias}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
                    title="Recarregar listas do Mailchimp"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${carregandoAudiencias ? 'animate-spin' : ''}`}
                    />
                    <span className="hidden sm:inline">Atualizar Listas</span>
                  </button>
                </div>

                {carregandoAudiencias && (
                  <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                    <span>Buscando audiências da sua conta Mailchimp...</span>
                  </div>
                )}

                {erroAudiencias && !carregandoAudiencias && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Não foi possível listar as audiências</p>
                      <p className="text-[11px] text-rose-600">{erroAudiencias}</p>
                    </div>
                    <button
                      onClick={carregarAudiencias}
                      className="underline text-rose-800 hover:text-rose-900 font-bold text-[11px]"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!carregandoAudiencias && !erroAudiencias && audiencias.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    Nenhuma audiência (lista) foi encontrada na sua conta do Mailchimp. Crie uma
                    lista no painel do Mailchimp para sincronizar.
                  </div>
                )}

                {!carregandoAudiencias && audiencias.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      Selecione a Lista / Audiência:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {audiencias.map((aud) => {
                        const selecionada = aud.id === audienciaSelecionadaId
                        return (
                          <div
                            key={aud.id}
                            onClick={() => setAudienciaSelecionadaId(aud.id)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                              selecionada
                                ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-500'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {aud.name}
                              </p>
                              {selecionada && (
                                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                              <span>Membros:</span>
                              <span className="font-semibold text-slate-700">
                                {aud.total_members ?? aud.stats?.member_count ?? 0}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-[10px] text-slate-400">
                                ID: {aud.id}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card de Filtros e Opções de Envio */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sliders className="w-5 h-5 text-sky-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Opções e Filtros de Clientes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Defina o escopo da carteira de clientes que será transmitida
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Filtro Ativos / Inativos */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      Status dos Clientes
                    </label>
                    <div className="space-y-2 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="filtroStatus"
                          checked={!incluirInativos}
                          onChange={() => setIncluirInativos(false)}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>Somente Clientes Ativos (Padrão)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="filtroStatus"
                          checked={incluirInativos}
                          onChange={() => setIncluirInativos(true)}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <span>Incluir Clientes Inativos ({clientesInativos.length})</span>
                      </label>
                    </div>
                  </div>

                  {/* Status de Inscrição no Mailchimp */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Status de Inscrição (Opt-in)
                    </label>
                    <div className="space-y-2 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="statusOptIn"
                          value="pending"
                          checked={statusOptIn === 'pending'}
                          onChange={() => setStatusOptIn('pending')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">
                            Pendente (Double Opt-In - Recomendado)
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Mailchimp envia confirmação por e-mail antes de ativar.
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="statusOptIn"
                          value="subscribed"
                          checked={statusOptIn === 'subscribed'}
                          onChange={() => setStatusOptIn('subscribed')}
                          className="text-sky-600 focus:ring-sky-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">Inscrito Direto</p>
                          <p className="text-[10px] text-slate-500">
                            Usar apenas se o cliente já autorizou expressamente.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={atualizarExistentes}
                      onChange={(e) => setAtualizarExistentes(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      Atualizar dados cadastrais (Razão Social, CNPJ, Regime) caso o contato já
                      exista na lista
                    </span>
                  </label>
                </div>
              </div>

              {/* Botão de Disparo */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-sky-900 space-y-0.5">
                  <p className="font-bold">
                    Pronto para sincronizar {contagemEmails.comEmail} contatos válidos
                  </p>
                  <p className="text-[11px] text-sky-700">
                    Destino: {audienciaSelecionada?.name || 'Selecione uma audiência'} • Opt-in:{' '}
                    {statusOptIn === 'pending' ? 'Pendente' : 'Inscrito direto'}
                  </p>
                </div>

                <button
                  onClick={handleSincronizar}
                  disabled={
                    sincronizando || !audienciaSelecionadaId || contagemEmails.comEmail === 0
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all"
                >
                  {sincronizando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Sincronizar Agora com Mailchimp</span>
                    </>
                  )}
                </button>
              </div>

              {/* Barra de Progresso Durante Envio */}
              {sincronizando && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      Processamento de Lotes em Andamento
                    </span>
                    <span className="text-sky-600 font-bold">{progressoTexto}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-sky-600 h-2 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* Resultado da Última Sincronização Executada */}
              {resultadoAtual && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Resumo da Sincronização Recente
                        </h4>
                        <p className="text-xs text-slate-500">
                          Audiência: {resultadoAtual.audienciaNome} •{' '}
                          {new Date(resultadoAtual.dataHora).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-lg font-bold text-slate-900">
                        {resultadoAtual.totalClientesAnalisados}
                      </p>
                      <p className="text-[11px] text-slate-500">Total Analisados</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-lg font-bold text-emerald-700">
                        {resultadoAtual.totalInscritosEnviados + resultadoAtual.totalAtualizados}
                      </p>
                      <p className="text-[11px] text-emerald-600">Enviados / Atualizados</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-lg font-bold text-amber-700">
                        {resultadoAtual.totalSemEmail}
                      </p>
                      <p className="text-[11px] text-amber-600">Sem E-mail Válido</p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                      <p className="text-lg font-bold text-rose-700">{resultadoAtual.totalErros}</p>
                      <p className="text-[11px] text-rose-600">Falhas / Erros</p>
                    </div>
                  </div>

                  {resultadoAtual.mensagensErros.length > 0 && (
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-1">
                      <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Ocorrências reportadas pela API do Mailchimp:
                      </p>
                      <ul className="text-[11px] text-rose-700 list-disc list-inside space-y-0.5">
                        {resultadoAtual.mensagensErros.slice(0, 5).map((m, idx) => (
                          <li key={idx} className="truncate">
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Coluna 3: Resumo dos Clientes e Histórico */}
            <div className="space-y-6">
              {/* Card Resumo da Carteira */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Estatísticas da Carteira
                  </h3>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Clientes Ativos:</span>
                    <span className="font-bold text-slate-800">
                      {carregandoClientes ? '...' : clientesAtivos.length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Clientes Inativos:</span>
                    <span className="font-bold text-slate-800">
                      {carregandoClientes ? '...' : clientesInativos.length}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Com E-mail Válido:</span>
                    <span className="font-bold text-emerald-700">{contagemEmails.comEmail}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Sem E-mail Cadastrado:</span>
                    <span className="font-bold text-amber-700">{contagemEmails.semEmail}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/cadastro-clientes"
                    className="block text-center text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 py-2 rounded-lg transition-colors"
                  >
                    Gerenciar E-mails no Cadastro Analítico →
                  </Link>
                </div>
              </div>

              {/* Histórico de Sincronizações */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Histórico Recente
                    </h3>
                  </div>
                  {historico.length > 0 && (
                    <button
                      onClick={handleLimparHistorico}
                      className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1"
                      title="Limpar histórico local"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {historico.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Nenhuma sincronização registrada até o momento.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {historico.slice(0, 10).map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 truncate max-w-[140px]">
                            {h.audienciaNome}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(h.dataHora).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="text-emerald-700 font-semibold">
                            ✓ {h.totalSucessos} enviados
                          </span>
                          {h.totalErros > 0 && (
                            <span className="text-rose-600 font-semibold">
                              • {h.totalErros} falhas
                            </span>
                          )}
                          <span className="text-slate-400">
                            ({h.incluiuInativos ? 'c/ inativos' : 'só ativos'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
