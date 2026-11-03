import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Scale,
  Sparkles,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  enviarMensagemEspecialista,
  type SegmentoEspecialista,
  type MensagemEspecialista,
} from '@/services/agenteEspecialista'

interface PropsTelaAgenteEspecialista {
  segmento: SegmentoEspecialista
  titulo: string
  subtitulo: string
  badge: string
  descricao: string
  Icon: React.ComponentType<{ className?: string }>
  exemplosProntos: string[]
  corPrimaria: string // classe tailwind p/ badge/detalhes
}

export function TelaAgenteEspecialista({
  segmento,
  titulo,
  subtitulo,
  badge,
  descricao,
  Icon,
  exemplosProntos,
  corPrimaria,
}: PropsTelaAgenteEspecialista) {
  const [mensagens, setMensagens] = useState<MensagemEspecialista[]>([
    {
      id: `msg-welcome-${segmento}`,
      role: 'assistant',
      content:
        `Olá! Sou o **${titulo}**.\n\n` +
        `${descricao}\n\n` +
        `Estou conectado às bases oficiais do sistema e pronto para emitir análises fundamentadas, com citação expressa de artigos, atos normativos e orientações práticas para a ADECONT.\n\n` +
        `Como posso auxiliá-lo nesta área hoje?`,
      created: new Date().toISOString(),
    },
  ])

  const [inputTexto, setInputTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  const handleEnviar = async (textoPersonalizado?: string) => {
    const texto = (textoPersonalizado || inputTexto).trim()
    if (!texto || carregando) return

    const userMsg: MensagemEspecialista = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: texto,
      created: new Date().toISOString(),
    }

    setMensagens((prev) => [...prev, userMsg])
    if (!textoPersonalizado) setInputTexto('')
    setCarregando(true)

    try {
      const resp = await enviarMensagemEspecialista({
        segmento,
        message: texto,
        conversationId,
      })

      if (resp.conversation_id) {
        setConversationId(resp.conversation_id)
      }

      const assistMsg: MensagemEspecialista = {
        id: resp.message_id || `msg-agent-${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        citations: resp.citations,
        created: new Date().toISOString(),
      }

      setMensagens((prev) => [...prev, assistMsg])
    } catch (err: unknown) {
      const erroMsg = err instanceof Error ? err.message : 'Falha na comunicação com o agente'
      const erroAssistMsg: MensagemEspecialista = {
        id: `msg-erro-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Não foi possível obter a resposta do especialista no momento (${erroMsg}). As bases continuam preservadas e você pode reenviar sua consulta.`,
        created: new Date().toISOString(),
      }
      setMensagens((prev) => [...prev, erroAssistMsg])
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── TOPO INSTITUCIONAL COM ADECONT LOGO ── */}
      <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-900 via-panorama-navy to-slate-900 p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy shadow-xs">
                <Icon className="w-3.5 h-3.5" />
                {badge}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/20">
                Agente Nativo com Memória RAG
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Bases Oficiais Conectadas
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-300" />
                Consulta fontes oficiais: Senado · DOU · Câmara · CGIBS
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                {titulo}
              </h1>
              <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
                {subtitulo}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {descricao}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 shrink-0 flex flex-col items-center justify-center self-start md:self-auto min-w-[200px]">
            <AdecontLogo variant="white" className="h-10 w-auto mb-1.5" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-200">
              Assessoria Contábil e Administrativa
            </span>
          </div>
        </div>
      </div>

      {/* ── CONSULTAS RÁPIDAS EM 1 CLIQUE ── */}
      {exemplosProntos && exemplosProntos.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1">
            Consultas Frequentes em 1 Clique:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {exemplosProntos.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => handleEnviar(ex)}
                disabled={carregando}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-panorama-gold hover:bg-amber-50/30 text-left transition-all shadow-xs text-xs text-slate-700 hover:text-panorama-navy font-medium flex items-start gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-panorama-gold shrink-0 mt-0.5" />
                <span className="line-clamp-2">{ex}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CHAT COM O AGENTE ESPECIALISTA ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[520px]">
        {/* Barra superior */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-panorama-navy text-panorama-gold flex items-center justify-center font-bold shadow-xs border border-panorama-gold/40">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{titulo}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Nativo Online
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                  <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                  Fontes oficiais em tempo real: Senado · DOU · Câmara · CGIBS
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Respostas fundamentadas com citação de diploma legal, ato oficial e dados externos
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setMensagens([
                {
                  id: `msg-reset-${Date.now()}`,
                  role: 'assistant',
                  content: 'Conversa reiniciada. Em que posso auxiliá-lo nesta área?',
                  created: new Date().toISOString(),
                },
              ])
              setConversationId(null)
            }}
            className="p-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Nova Conversa"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova conversa</span>
          </button>
        </div>

        {/* Mensagens */}
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
                      : 'bg-slate-800 text-white'
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

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-panorama-gold" />
                        Fontes do Sistema Citadas:
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
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[9.5px] text-right mt-1 ${isUser ? 'text-amber-200' : 'text-slate-400'}`}
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
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-panorama-gold" />
                <span>
                  O Especialista está pesquisando as bases oficiais e estruturando o parecer...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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
              placeholder={`Consulte o ${titulo}...`}
              disabled={carregando}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-panorama-navy focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={carregando || !inputTexto.trim()}
              className="px-4 py-2.5 rounded-xl bg-panorama-navy hover:bg-slate-900 text-panorama-gold-light font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer border border-panorama-gold/40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Consultar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
