import { useState, useEffect, useRef } from 'react'
import {
  BrainCircuit,
  Scale,
  Send,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  History,
  CheckCircle2,
  BookmarkPlus,
  MessagesSquare,
  Bot,
  User,
  ShieldAlert,
  Loader2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { RelatorioDiagnosticoModerno } from '@/components/RelatorioDiagnosticoModerno'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  enviarMensagemDiagnostico,
  listarSessoesDiagnostico,
  salvarSessaoDiagnostico,
  exportarDiagnosticoCsv,
  type MensagemDiagnostico,
  type LinhaComparativoAliquota,
  type SessaoDiagnostico,
} from '@/services/diagnosticoTributario'
import { extrairSecoesDeRespostaAgente } from '@/services/diagnosticoFormatador'
import { fetchTaxNorms } from '@/services/panorama'
import type { TaxNormItem } from '@/types/panorama'

const COMPARATIVO_PADRAO: LinhaComparativoAliquota[] = [
  {
    regime: 'Regime Geral Pleno (Teto LC 214)',
    cbs: 11.3,
    ibs: 18.7,
    total: 26.5,
    diferencaRef: 0.0,
    baseLegal: 'Art. 349 da LC 214/2025',
    observacao: 'Alíquota de referência padrão conjunta estimada por TCU e CGIBS',
  },
  {
    regime: 'Regime Favorecido (-60%)',
    cbs: 4.52,
    ibs: 7.48,
    total: 10.6,
    diferencaRef: -15.9,
    baseLegal: 'Art. 136 a 140 da LC 214/2025',
    observacao: 'Saúde, educação, dispositivos médicos, insumos agropecuários',
  },
  {
    regime: 'Regime Reduzido (-30%)',
    cbs: 7.91,
    ibs: 13.09,
    total: 18.55,
    diferencaRef: -7.95,
    baseLegal: 'Art. 141 da LC 214/2025',
    observacao: 'Serviços de 18 profissões intelectuais/regulamentadas',
  },
  {
    regime: 'Cesta Básica Nacional (Alíquota Zero)',
    cbs: 0.0,
    ibs: 0.0,
    total: 0.0,
    diferencaRef: -26.5,
    baseLegal: 'Anexo I da LC 214/2025 (Arroz, Feijão, etc.)',
    observacao: 'Desoneração integral com manutenção de créditos vinculados',
  },
  {
    regime: 'Regime Imobiliário (Locação/RET)',
    cbs: 2.26,
    ibs: 3.74,
    total: 6.0,
    diferencaRef: -20.5,
    baseLegal: 'Art. 248 a 265 da LC 214/2025',
    observacao: 'Redutores de ajuste para locação, incorporação e loteamento',
  },
  {
    regime: 'Transição 2026 (Teste Informativo)',
    cbs: 0.9,
    ibs: 0.1,
    total: 1.0,
    diferencaRef: -25.5,
    baseLegal: 'Art. 343 da LC 214/2025',
    observacao: 'Compensável com PIS/Cofins, sem desembolso efetivo de caixa',
  },
]

export function SectionDiagnosticoTributario() {
  const [mensagens, setMensagens] = useState<MensagemDiagnostico[]>([
    {
      id: 'msg-boas-vindas',
      role: 'assistant',
      content:
        'Olá, CEO e equipe diretiva da ADECONT! Sou o **Agente de Diagnóstico Tributário, Jurídico e Contábil**.\n\n' +
        'Estou conectado nativamente às bases oficiais do sistema (normas vigentes, resoluções CGIBS, classificações NCM e radar legislativo) para:\n' +
        '• Analisar textos legislativos e suas interligações tributárias;\n' +
        '• Emitir pareceres resumidos e executivos;\n' +
        '• Apontar pontos críticos de atenção e reflexos para a fusão administrativa dos clientes;\n' +
        '• Abrir debate estratégico com o CEO e calcular comparativos de alíquotas com passo a passo de implementação.\n\n' +
        'Como posso iniciar nossa análise hoje? Você pode escolher um ato oficial para parecer imediato ou iniciar uma discussão direta.',
      created: new Date().toISOString(),
    },
  ])

  const [inputTexto, setInputTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessoesSalvas, setSessoesSalvas] = useState<SessaoDiagnostico[]>([])
  const [normasDisponiveis, setNormasDisponiveis] = useState<TaxNormItem[]>([])
  const [carregandoNormas, setCarregandoNormas] = useState(false)

  // Modais de Ação Rápida em 1 Clique
  const [modalAtoAberto, setModalAtoAberto] = useState(false)
  const [modalInterligacoesAberto, setModalInterligacoesAberto] = useState(false)
  const [modalDebateAberto, setModalDebateAberto] = useState(false)
  const [atoSelecionadoId, setAtoSelecionadoId] = useState<string>('')
  const [temaInterligacao, setTemaInterligacao] = useState<string>('split_payment')
  const [temaDebate, setTemaDebate] = useState<string>('')

  // Relatório Final Consolidado
  const [relatorioTitulo, setRelatorioTitulo] = useState(
    'Diagnóstico de Transição e Impactos Tributários',
  )
  const [relatorioAto, setRelatorioAto] = useState('LC 214/2025 e Regulamentos de 2026')
  const [parecerResumido, setParecerResumido] = useState(
    'O processo de substituição dos tributos indiretos (PIS, Cofins, IPI, ICMS e ISS) pelo IVA Dual (CBS e IBS) exige readequação dos sistemas de emissão, reestruturação da governança de créditos acumulados e segregação das operações favorecidas. A transição em 2026 é meramente informativa com alíquotas de teste de 0,9% (CBS) e 0,1% (IBS), exigindo adaptação imediata das rotinas contábeis.',
  )
  const [pontosAtencao, setPontosAtencao] = useState(
    '1. Risco de perda de crédito na aquisição de optantes do Simples Nacional que não transfiram integralmente a carga.\n' +
      '2. Implementação obrigatória da segregação financeira via split payment nos recebíveis de cartão e arranjos de pagamento.\n' +
      '3. Fusão administrativa das rotinas fiscais: integração da escrituração federal e municipal sob os padrões únicos do Comitê Gestor do IBS.',
  )
  const [passoAPasso, setPassoAPasso] = useState(
    'Etapa 1: Mapeamento de todos os itens cadastrados por NCM e correlação com os Anexos da LC 214/2025.\n' +
      'Etapa 2: Parametrização dos campos IBS/CBS no ERP nos moldes do Ato Conjunto RFB/CGIBS 1/2025.\n' +
      'Etapa 3: Simulação de fluxo de caixa considerando a não-cumulatividade plena e o regime de caixa vs. competência.\n' +
      'Etapa 4: Auditoria das obrigações acessórias prévias para evitar autuações na transição.',
  )
  const [tabelaComparativa, setTabelaComparativa] =
    useState<LinhaComparativoAliquota[]>(COMPARATIVO_PADRAO)
  const [salvandoSessao, setSalvandoSessao] = useState(false)
  const [sessaoSalvaId, setSessaoSalvaId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar sessões e normas na montagem
  useEffect(() => {
    carregarSessoes()
    carregarNormas()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  const carregarSessoes = async () => {
    try {
      const data = await listarSessoesDiagnostico()
      setSessoesSalvas(data)
    } catch (e) {
      console.warn('Erro ao carregar sessões:', e)
    }
  }

  const carregarNormas = async () => {
    setCarregandoNormas(true)
    try {
      const norms = await fetchTaxNorms()
      setNormasDisponiveis(norms)
      if (norms.length > 0) {
        setAtoSelecionadoId(norms[0].id)
      }
    } catch (e) {
      console.warn('Erro ao carregar normas para seleção:', e)
    } finally {
      setCarregandoNormas(false)
    }
  }

  // Envio de mensagem
  const handleEnviar = async (textoPersonalizado?: string) => {
    const texto = (textoPersonalizado || inputTexto).trim()
    if (!texto || carregando) return

    const userMsg: MensagemDiagnostico = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: texto,
      created: new Date().toISOString(),
    }

    setMensagens((prev) => [...prev, userMsg])
    if (!textoPersonalizado) setInputTexto('')
    setCarregando(true)

    try {
      const resp = await enviarMensagemDiagnostico({
        message: texto,
        conversationId: conversationId,
      })

      if (resp.conversation_id) {
        setConversationId(resp.conversation_id)
      }

      const assistMsg: MensagemDiagnostico = {
        id: resp.message_id || `msg-agent-${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        citations: resp.citations,
        created: new Date().toISOString(),
      }

      setMensagens((prev) => [...prev, assistMsg])

      // Se a resposta contiver parecer ou tópicos, atualizar dinamicamente o rascunho do relatório
      if (resp.content.length > 100) {
        const secoesExtraidas = extrairSecoesDeRespostaAgente(resp.content)
        if (secoesExtraidas.resumoExecutivo) {
          setParecerResumido(secoesExtraidas.resumoExecutivo)
        }
        if (secoesExtraidas.pontosAtencao) {
          setPontosAtencao(secoesExtraidas.pontosAtencao)
        }
        if (secoesExtraidas.passoAPasso) {
          setPassoAPasso(secoesExtraidas.passoAPasso)
        }
      }
    } catch (err: unknown) {
      const erroMsg = err instanceof Error ? err.message : 'Falha na comunicação com o agente'
      const erroAssistMsg: MensagemDiagnostico = {
        id: `msg-erro-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Não foi possível obter a resposta do agente inteligente no momento (${erroMsg}). O sistema manterá suas informações e você pode tentar reenviar a consulta.`,
        created: new Date().toISOString(),
      }
      setMensagens((prev) => [...prev, erroAssistMsg])
    } finally {
      setCarregando(false)
    }
  }

  // 1-Clique: Analisar Ato Normativo
  const dispararAnaliseAto = () => {
    const ato = normasDisponiveis.find((n) => n.id === atoSelecionadoId)
    if (!ato) return
    setModalAtoAberto(false)
    setRelatorioAto(`${ato.code} — ${ato.title}`)
    setRelatorioTitulo(`Parecer e Reflexos: ${ato.code}`)

    const prompt =
      `Por favor, realize a ANÁLISE COMPLETA E EMITA O PARECER RESUMIDO do seguinte ato normativo do sistema:\n` +
      `• Norma: ${ato.code} (${ato.title})\n` +
      `• Tipo: ${ato.norm_type} | Origem: ${ato.origin}\n` +
      `• Resumo do ato: ${ato.summary}\n` +
      `• Capitulação oficial / link: ${ato.link_url || 'Bases do sistema'}\n\n` +
      `Estruture sua resposta para a ADECONT com:\n` +
      `1. Resumo da matéria e aplicabilidade prática na norma;\n` +
      `2. Interligações e reflexos tributários (IBS, CBS e regimes correlatos);\n` +
      `3. Pontos de atenção para a contabilidade e fusão administrativa;\n` +
      `4. Comparativo de alíquotas incidentes;\n` +
      `5. Parecer conclusivo e orientações passo a passo para implementação no cliente.`

    handleEnviar(prompt)
  }

  // 1-Clique: Analisar Interligações
  const dispararAnaliseInterligacoes = () => {
    setModalInterligacoesAberto(false)
    const mapTemas: Record<string, { nome: string; foco: string }> = {
      split_payment: {
        nome: 'Split Payment e Arrecadação na Liquidação Financeira',
        foco: 'retenção automática no ato do pagamento, interligação com adquirentes e impacto no fluxo de caixa',
      },
      simples_nacional: {
        nome: 'Simples Nacional, MEI e a Reforma (LC 238/2026)',
        foco: 'sublimite de R$ 3,6 mi do IBS, transferência de créditos de CBS/IBS e novas faixas do MEI',
      },
      credito_pleno: {
        nome: 'Não-Cumulatividade Plena e Crédito Financeiro',
        foco: 'vedação ao crédito apenas para uso pessoal, apropriação sobre bens do ativo e prazo de ressarcimento',
      },
      agro_alimentos: {
        nome: 'Agronegócio, Cesta Básica Nacional e Alíquota Zero',
        foco: 'isenção nos alimentos essenciais, crédito presumido ao produtor rural pessoa física e insumos com -60%',
      },
    }

    const escolhido = mapTemas[temaInterligacao] || mapTemas.split_payment
    setRelatorioTitulo(`Interligações Tributárias: ${escolhido.nome}`)
    setRelatorioAto(`Reforma Tributária — ${escolhido.nome}`)

    const prompt =
      `Como analista tributário-jurídico-contábil da ADECONT, apresente uma análise interpretativa das INTERLIGAÇÕES TRIBUTÁRIAS E SEUS REFLEXOS sobre:\n` +
      `TEMA: ${escolhido.nome}\n` +
      `FOCO EXECUTIVO: ${escolhido.foco}\n\n` +
      `Fundamente nas normas do sistema (LC 214/2025, LC 227/2026, decretos e resoluções), aponte os pontos de atenção para a fusão administrativa dos clientes, mostre o cálculo/alíquota aplicável e proponha o plano de ação.`

    handleEnviar(prompt)
  }

  // 1-Clique: Iniciar Debate com o CEO
  const dispararDebateCeo = () => {
    setModalDebateAberto(false)
    const tema =
      temaDebate.trim() || 'Estratégia de precificação dos clientes frente à alíquota de 26,50%'
    setRelatorioTitulo(`Debate Estratégico com o CEO: ${tema}`)

    const prompt =
      `[MODO DEBATE COM O CEO DA ADECONT]\n` +
      `Prezado analista, gostaria de debater o seguinte posicionamento estratégico:\n` +
      `"${tema}"\n\n` +
      `Apresente seu raciocínio preliminar fundamentado na legislação e nas rotinas contábeis, indique onde o raciocínio pode ter fragilidades fiscais ou operacionais e abra pontos de discussão para completarmos nosso raciocínio juntos.`

    handleEnviar(prompt)
  }

  // Salvar Sessão no Banco
  const handleSalvarSessao = async () => {
    setSalvandoSessao(true)
    try {
      const payload: Partial<SessaoDiagnostico> = {
        titulo: relatorioTitulo,
        tema: relatorioAto,
        ato_analisado: relatorioAto,
        conversation_id: conversationId || undefined,
        tipo_analise: 'geral',
        parecer_resumido: parecerResumido,
        pontos_atencao: pontosAtencao,
        passo_a_passo: passoAPasso,
        dados_tabela: tabelaComparativa,
        relatorio_consolidado: `${parecerResumido}\n\nPontos de Atenção:\n${pontosAtencao}\n\nImplementação:\n${passoAPasso}`,
        autor_email: 'ceo@adecont.com.br',
        data_sessao: new Date().toISOString().slice(0, 10),
      }

      const res = await salvarSessaoDiagnostico(payload)
      setSessaoSalvaId(res.id)
      await carregarSessoes()
    } catch (err) {
      console.error('Falha ao salvar sessão:', err)
    } finally {
      setSalvandoSessao(false)
    }
  }

  // Exportar Relatório em Planilha CSV / Excel
  const handleExportarCsv = () => {
    exportarDiagnosticoCsv({
      titulo: relatorioTitulo,
      atoOuTema: relatorioAto,
      parecer: parecerResumido,
      pontosAtencao: pontosAtencao,
      passoAPasso: passoAPasso,
      linhasTabela: tabelaComparativa,
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── CABEÇALHO DA SEÇÃO COM LOGO ADECONT ── */}
      <div className="secao-diagnostico-topo rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-slate-900 via-panorama-navy to-indigo-950 p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy shadow-xs">
                <BrainCircuit className="w-3.5 h-3.5" />
                Agente Nativo Skip Cloud
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-indigo-200 border border-white/20">
                Tributário · Jurídico · Contábil · Administrativo
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Memória RAG Ativa
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-300" />
                Consulta fontes oficiais: Senado · DOU · Câmara · CGIBS
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Diagnóstico Tributário
              </h1>
              <span className="text-xs font-semibold text-indigo-200 hidden sm:inline">
                Análises interpretativas, pareceres e debate com o CEO
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Agente inteligente de alta capacidade interpretativa para examinar diplomas
              legislativos, conectar reflexos tributários, apontar pontos de atenção contábil e
              fusão administrativa, calcular alíquotas comparativas e produzir relatórios
              descritivos para apresentação institucional com a marca da ADECONT.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 shrink-0 flex flex-col items-center justify-center self-start md:self-auto min-w-[200px]">
            <AdecontLogo variant="white" className="h-10 w-auto mb-1.5" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">
              Assessoria Contábil e Administrativa
            </span>
          </div>
        </div>
      </div>

      {/* ── BOTÕES DE INÍCIO DE ANÁLISE EM 1 CLIQUE ── */}
      <div className="secao-diagnostico-botoes grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setModalAtoAberto(true)}
          className="group p-4 rounded-xl border-2 border-indigo-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-3 cursor-pointer"
        >
          <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-300 shrink-0 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5" />
          </span>
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 block">
              1-Clique
            </span>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">
              Analisar ato normativo
            </h4>
            <p className="text-xs text-slate-500 leading-snug">
              Escolha um ato do banco e obtenha parecer resumido com artigos e pontos de atenção.
            </p>
          </div>
        </button>

        <button
          onClick={() => setModalInterligacoesAberto(true)}
          className="group p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-3 cursor-pointer"
        >
          <span className="p-2.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-300 shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </span>
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-blue-700 block">
              1-Clique
            </span>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
              Analisar interligações
            </h4>
            <p className="text-xs text-slate-500 leading-snug">
              Examine reflexos tributários de split payment, não-cumulatividade plena e Simples.
            </p>
          </div>
        </button>

        <button
          onClick={() => setModalDebateAberto(true)}
          className="group p-4 rounded-xl border-2 border-amber-200 bg-white hover:border-amber-500 hover:bg-amber-50/50 shadow-xs hover:shadow-md transition-all text-left flex items-start gap-3 cursor-pointer"
        >
          <span className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0 group-hover:scale-105 transition-transform">
            <MessagesSquare className="w-5 h-5" />
          </span>
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 block">
              Interativo
            </span>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-900">
              Debate com o CEO
            </h4>
            <p className="text-xs text-slate-500 leading-snug">
              O agente abre o raciocínio preliminar e você (CEO) rebate e completa na conversa.
            </p>
          </div>
        </button>
      </div>

      {/* ── ÁREA PRINCIPAL: CONVERSA / CHAT COM O AGENTE ── */}
      <div className="secao-diagnostico-chat rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[580px]">
        {/* Barra superior do chat */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  Agente Diagnóstico Tributário ADECONT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Online
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                  Fontes oficiais em tempo real: Senado · DOU · Câmara · CGIBS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Acesso a tax_norms, tax_topics, classifications e dados externos em tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMensagens([
                  {
                    id: `msg-reset-${Date.now()}`,
                    role: 'assistant',
                    content:
                      'Conversa reiniciada. Como posso ajudá-lo na análise tributária ou na elaboração do parecer executivo?',
                    created: new Date().toISOString(),
                  },
                ])
                setConversationId(null)
              }}
              className="p-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1.5"
              title="Nova Conversa"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova conversa</span>
            </button>
          </div>
        </div>

        {/* Mensagens do Chat */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {mensagens.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                    isUser
                      ? 'bg-panorama-navy text-panorama-gold border border-panorama-gold/40'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-panorama-navy text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs space-y-2'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citações de fontes encontradas pelo agente */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        Fontes Oficiais Citadas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[10.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-mono inline-flex items-center gap-1.5 flex-wrap"
                          >
                            <span>
                              [{c.n}] {c.excerpt.slice(0, 80)}...
                            </span>
                            <SeloNivelConfianca fonte={c.excerpt} compacto />
                          </span>
                        ))}
                      </div>{' '}
                    </div>
                  )}

                  <div
                    className={`text-[9.5px] text-right mt-1 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}
                  >
                    {new Date(msg.created).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {carregando && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>
                  O Agente Tributário está consultando a legislação e estruturando a resposta...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Caixa de Entrada de Texto */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleEnviar()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              placeholder="Digite sua dúvida tributária, peça um parecer de ato ou rebata o raciocínio do agente..."
              disabled={carregando}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={carregando || !inputTexto.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
          <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1.5 px-1">
            <span>
              💡 Dica: Peça comparativos de alíquotas (ex.: &ldquo;Calcule o reflexo na locação de
              imóveis&rdquo;)
            </span>
            <span>Agente com memória e leitura da LC 214/2025</span>
          </div>
        </div>
      </div>

      {/* ── RELATÓRIO DESCRITIVO SIMPLIFICADO FORMATADO PARA ENVIO (LAYOUT MODERNO) ── */}
      <RelatorioDiagnosticoModerno
        titulo={relatorioTitulo}
        atoOuTema={relatorioAto}
        parecerResumido={parecerResumido}
        pontosAtencao={pontosAtencao}
        passoAPasso={passoAPasso}
        linhasTabela={tabelaComparativa}
        sessaoSalvaId={sessaoSalvaId}
        salvandoSessao={salvandoSessao}
        onSalvarSessao={handleSalvarSessao}
        onExportarCsv={handleExportarCsv}
        onAtualizarTitulo={setRelatorioTitulo}
        onAtualizarAto={setRelatorioAto}
        onAtualizarParecer={setParecerResumido}
        onAtualizarPontosAtencao={setPontosAtencao}
        onAtualizarPassoAPasso={setPassoAPasso}
      />

      {/* ── HISTÓRICO DE SESSÕES GRAVADAS NO BANCO ── */}
      {sessoesSalvas.length > 0 && (
        <div className="secao-diagnostico-historico rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Histórico de Sessões de Diagnóstico Gravadas ({sessoesSalvas.length})
              </h3>
            </div>
            <button
              onClick={carregarSessoes}
              className="text-xs font-semibold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Atualizar lista
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessoesSalvas.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-indigo-300 transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">{s.data_sessao || s.created?.slice(0, 10)}</span>
                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold uppercase">
                    {s.tipo_analise || 'Geral'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {s.titulo}
                </h4>
                {s.ato_analisado && (
                  <p className="text-[11px] text-indigo-700 font-medium truncate">
                    Ato: {s.ato_analisado}
                  </p>
                )}
                {s.parecer_resumido && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {s.parecer_resumido}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: 1-CLIQUE ANALISAR ATO NORMATIVO ── */}
      {modalAtoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-indigo-600 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Analisar Ato Normativo Oficial</h3>
              </div>
              <button
                onClick={() => setModalAtoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Selecione um ato legislativo registrado no banco de normas do sistema. O agente
              examinará a norma e emitirá imediatamente o parecer resumido com pontos de atenção e
              interligações.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ato do Banco:</label>
              {carregandoNormas ? (
                <div className="py-2 text-xs text-slate-400">Carregando atos do sistema...</div>
              ) : (
                <select
                  value={atoSelecionadoId}
                  onChange={(e) => setAtoSelecionadoId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-indigo-600"
                >
                  {normasDisponiveis.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.code} — {n.title} ({n.origin})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalAtoAberto(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={dispararAnaliseAto}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Emitir Parecer Imediato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: 1-CLIQUE ANALISAR INTERLIGAÇÕES ── */}
      {modalInterligacoesAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-blue-600 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Analisar Interligações & Reflexos</h3>
              </div>
              <button
                onClick={() => setModalInterligacoesAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Escolha um tema transversal da Reforma Tributária. O agente cruzará diplomas federais,
              estaduais e municipais para detalhar impactos e pontos de atenção para a fusão
              administrativa.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tema Transversal:</label>
              <select
                value={temaInterligacao}
                onChange={(e) => setTemaInterligacao(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="split_payment">
                  Split Payment: retenção em pagamentos eletrônicos e fluxo de caixa
                </option>
                <option value="simples_nacional">
                  Simples Nacional e MEI: sublimites, transferência de crédito e LC 238/2026
                </option>
                <option value="credito_pleno">
                  Crédito Financeiro Pleno: bens do ativo, serviços tomados e estorno
                </option>
                <option value="agro_alimentos">
                  Cesta Básica e Agro: desoneração da cesta básica e insumos agrícolas (-60%)
                </option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalInterligacoesAberto(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={dispararAnaliseInterligacoes}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Gerar Análise de Interligações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: 1-CLIQUE DEBATE COM O CEO ── */}
      {modalDebateAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-t-4 border-amber-500 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessagesSquare className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">Iniciar Debate Estratégico com o CEO</h3>
              </div>
              <button
                onClick={() => setModalDebateAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              O modo debate permite que você (CEO) apresente uma tese ou preocupação do negócio. O
              agente expõe seu raciocínio preliminar e fica a postos para os seus rebates na mesma
              conversa.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tema ou Tese para Debate:</label>
              <textarea
                rows={3}
                value={temaDebate}
                onChange={(e) => setTemaDebate(e.target.value)}
                placeholder="Ex.: Como defender a margem dos clientes prestadores de serviços de TI se a alíquota subir para 26,50%?"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalDebateAberto(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={dispararDebateCeo}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Abrir Discussão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
