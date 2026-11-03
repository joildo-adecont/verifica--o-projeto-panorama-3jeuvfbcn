import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Bot,
  User,
  Loader2,
  RefreshCw,
  Scale,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  enviarMensagemEspecialista,
  type SegmentoEspecialista,
  type MensagemEspecialista,
} from '@/services/agenteEspecialista'

export interface MetaEspecialista {
  segmento: SegmentoEspecialista
  titulo: string
  subtitulo: string
  badge: string
  descricao: string
  sugestoes: string[]
}

export const METADADOS_ESPECIALISTAS: Record<SegmentoEspecialista, MetaEspecialista> = {
  juridico: {
    segmento: 'juridico',
    titulo: 'Especialista Jurídico ADECONT',
    subtitulo: 'Constitucional, Jurisprudência, EC 132/2023, LC 214/2025 e contencioso',
    badge: 'Agente Jurídico',
    descricao:
      'Analisa legalidade, segurança jurídica, precedentes de tribunais superiores, contencioso e fundamentos da Reforma Tributária.',
    sugestoes: [
      'Quais são os limites constitucionais da não cumulatividade do IBS e CBS?',
      'Como a LC 214/2025 disciplina o regime de transição do contencioso administrativo?',
      'Há risco de bitributação na incidência do Imposto Seletivo sobre bens minerais?',
    ],
  },
  tributario: {
    segmento: 'tributario',
    titulo: 'Especialista Tributário ADECONT',
    subtitulo: 'IBS, CBS, Imposto Seletivo, regimes específicos e alíquotas',
    badge: 'Agente Tributário',
    descricao:
      'Especialista em alíquotas, regras de incidência, fatos geradores, regimes específicos e desonerações da Reforma Tributária.',
    sugestoes: [
      'Qual a alíquota de referência combinada prevista para IBS e CBS e as reduções da cesta básica?',
      'Como funciona o regime diferenciado para combustíveis e biocombustíveis?',
      'Quais serviços de saúde e educação têm redução de alíquota de 60%?',
    ],
  },
  contabil: {
    segmento: 'contabil',
    titulo: 'Especialista Contábil ADECONT',
    subtitulo: 'cClassTrib, CSTs, créditos presumidos, split payment e conformidade SPED',
    badge: 'Agente Contábil',
    descricao:
      'Orienta sobre escrituração, classificação de itens, apropriação de créditos, split payment e conciliação contábil.',
    sugestoes: [
      'Qual a correlação entre CST antigo e o novo código cClassTrib para produtos agrícolas?',
      'Como contabilizar apropriação e estorno de créditos presumidos de IBS/CBS?',
      'Qual o impacto do split payment no fluxo de caixa e na escrituração contábil?',
    ],
  },
  administrativo: {
    segmento: 'administrativo',
    titulo: 'Especialista Administrativo ADECONT',
    subtitulo: 'Gestão operacional, rotinas da assessoria, contratos e governança',
    badge: 'Agente Administrativo',
    descricao:
      'Assessora em governança tributária, rotinas de entrega aos clientes, adequação de contratos e procedimentos internos.',
    sugestoes: [
      'Como planejar a adaptação dos sistemas ERP e rotinas fiscais até 2026?',
      'Quais cláusulas contratuais de fornecimento exigem repactuação com o IBS/CBS?',
      'Qual o cronograma de obrigações acessórias na fase de teste de 2026 a 2027?',
    ],
  },
}

/**
 * Mapeia a rota ou filtro de segmento da Busca Avançada para o agente nativo correspondente:
 * - 'juridica' | 'juridico' -> 'juridico' (Especialista Jurídico)
 * - 'administrativa' | 'administrativo' -> 'administrativo' (Especialista Administrativo)
 * - 'contabil' -> 'contabil' (Especialista Contábil)
 * - sem segmento | 'tributario' | qualquer outro -> 'tributario' (Especialista Tributário)
 */
export function mapearSegmentoParaEspecialista(segmento?: string | null): SegmentoEspecialista {
  const limpo = (segmento || '').toLowerCase().trim()
  if (limpo === 'juridica' || limpo === 'juridico') return 'juridico'
  if (limpo === 'administrativa' || limpo === 'administrativo') return 'administrativo'
  if (limpo === 'contabil') return 'contabil'
  return 'tributario'
}

export interface BuscaAvancadaIAPanelProps {
  segmentoAtual?: string | null
  perguntaInicial?: string
  aoFecharOuVoltar?: () => void
  onMudarPergunta?: (pergunta: string) => void
}

export function BuscaAvancadaIAPanel({
  segmentoAtual,
  perguntaInicial = '',
  aoFecharOuVoltar,
  onMudarPergunta,
}: BuscaAvancadaIAPanelProps) {
  const segmento = mapearSegmentoParaEspecialista(segmentoAtual)
  const meta = METADADOS_ESPECIALISTAS[segmento]

  const [inputTexto, setInputTexto] = useState(perguntaInicial)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const [mensagens, setMensagens] = useState<MensagemEspecialista[]>([
    {
      id: `welcome-${segmento}`,
      role: 'assistant',
      content:
        `Olá! Sou o **${meta.titulo}** integrado à Busca Avançada.\n\n` +
        `${meta.descricao}\n\n` +
        `Você pode me fazer perguntas em linguagem natural sobre leis, alíquotas, classificações, jurisprudência ou procedimentos da Reforma Tributária. Suas respostas trarão as fontes oficiais citadas e selos de confiança.`,
      created: new Date().toISOString(),
    },
  ])

  const mensagensFimRef = useRef<HTMLDivElement>(null)

  // Disparo automático caso venha com perguntaInicial que ainda não foi enviada
  const disparouInicial = useRef(false)
  useEffect(() => {
    if (perguntaInicial && perguntaInicial.trim() && !disparouInicial.current) {
      disparouInicial.current = true
      handleEnviar(perguntaInicial.trim())
    }
  }, [perguntaInicial])

  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, carregando])

  const handleEnviar = async (textoManual?: string) => {
    const texto = (textoManual || inputTexto).trim()
    if (!texto || carregando) return

    setErro(null)
    const userMsg: MensagemEspecialista = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      created: new Date().toISOString(),
    }

    setMensagens((prev) => [...prev, userMsg])
    if (!textoManual) {
      setInputTexto('')
      onMudarPergunta?.('')
    }
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
        id: resp.message_id || `agent-${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        citations: resp.citations,
        created: new Date().toISOString(),
      }

      setMensagens((prev) => [...prev, assistMsg])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na comunicação com o agente nativo'
      setErro(msg)
      const assistMsgErro: MensagemEspecialista = {
        id: `erro-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Não foi possível obter a resposta do especialista no momento (${msg}). O serviço de busca por palavra-chave e filtros continua operando normalmente. Você pode tentar novamente em instantes.`,
        created: new Date().toISOString(),
      }
      setMensagens((prev) => [...prev, assistMsgErro])
    } finally {
      setCarregando(false)
    }
  }

  const reiniciarConversa = () => {
    setConversationId(null)
    setErro(null)
    setMensagens([
      {
        id: `welcome-reset-${Date.now()}`,
        role: 'assistant',
        content: `Conversa com o **${meta.titulo}** reiniciada. Em que posso auxiliá-lo na Busca Avançada?`,
        created: new Date().toISOString(),
      },
    ])
  }

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-md overflow-hidden space-y-0">
      {/* ── BARRA SUPERIOR INSTITUCIONAL COM LOGO ADECONT ── */}
      <div className="bg-gradient-to-r from-panorama-navy via-slate-900 to-panorama-navy text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panorama-gold/30">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-panorama-gold text-panorama-navy flex items-center justify-center font-bold shadow-md shrink-0 border border-amber-300">
            <Bot className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">
                {meta.titulo}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy">
                {meta.badge}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Agente Nativo Skip Cloud
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                <CheckCircle2 className="w-3 h-3 text-cyan-300" />
                Senado · DOU · Câmara · CGIBS
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">{meta.subtitulo}</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex flex-col items-center">
            <AdecontLogo variant="white" className="h-7 w-auto mb-0.5" />
            <span className="text-[8.5px] uppercase font-bold tracking-widest text-slate-200">
              Assessoria Contábil e Administrativa
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={reiniciarConversa}
              className="p-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Reiniciar consulta com a IA"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Nova pergunta</span>
            </button>
            {aoFecharOuVoltar && (
              <button
                type="button"
                onClick={aoFecharOuVoltar}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-white/20"
                title="Voltar para busca por palavra-chave"
              >
                Voltar à busca normal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SUGESTÕES RÁPIDAS EM LINGUAGEM NATURAL ── */}
      {meta.sugestoes && meta.sugestoes.length > 0 && (
        <div className="p-3 sm:px-5 bg-amber-50/60 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Sugestões para o {meta.badge}:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {meta.sugestoes.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleEnviar(sug)}
                disabled={carregando}
                className="text-[11.5px] px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100/60 text-slate-700 hover:text-panorama-navy border border-amber-200 font-medium transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── AVISO SE HOUVER ERRO GRACIOSO ── */}
      {erro && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Aviso sobre o serviço de IA:</p>
            <p>{erro}</p>
            <p className="text-[11px] text-amber-800">
              A Busca Avançada e os filtros continuam funcionando normalmente. Você pode digitar
              palavras-chave na barra acima ou tentar novamente mais tarde.
            </p>
          </div>
        </div>
      )}

      {/* ── ÁREA DE MENSAGENS COM HISTÓRICO, FONTES E SELOS ── */}
      <div className="p-4 sm:p-6 space-y-4 max-h-[480px] overflow-y-auto bg-slate-50/60">
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
                className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-panorama-navy text-white rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs space-y-3'
                }`}
              >
                {/* Logo da ADECONT na resposta do assistente */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <AdecontLogo variant="color" className="h-5 w-auto" />
                      <span className="text-[10.5px] font-bold text-slate-700">{meta.titulo}</span>
                    </div>
                    <span className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Resposta Oficial
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Fontes citadas com Selo de Nível de Confiança */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2.5 mt-2.5 border-t border-slate-200 space-y-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-panorama-gold-dark" />
                      Fontes Citadas na Resposta com Selo de Confiança:
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {msg.citations.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-panorama-navy shrink-0">
                              [{c.n}]
                            </span>
                            <span className="font-medium text-slate-700 line-clamp-2">
                              {c.excerpt}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <SeloNivelConfianca fonte={c.excerpt} compacto />
                          </div>
                        </div>
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
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-2.5 text-xs text-slate-700">
              <Loader2 className="w-4 h-4 animate-spin text-panorama-gold" />
              <span>
                Consultando o <strong>{meta.titulo}</strong> com acesso às bases oficiais da Reforma
                Tributária...
              </span>
            </div>
          </div>
        )}

        <div ref={mensagensFimRef} />
      </div>

      {/* ── CAMPO DE ENVIO EM LINGUAGEM NATURAL ── */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleEnviar()
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputTexto}
              onChange={(e) => {
                setInputTexto(e.target.value)
                onMudarPergunta?.(e.target.value)
              }}
              placeholder={`Pergunte ao ${meta.titulo} (ex.: Como fica a alíquota de produtos do agronegócio?)...`}
              disabled={carregando}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-panorama-navy rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={carregando || !inputTexto.trim()}
            className="px-4 py-2.5 rounded-xl bg-panorama-navy hover:bg-slate-900 text-panorama-gold-light font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer border border-panorama-gold/40 shrink-0"
          >
            {carregando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Perguntar à IA</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-2 px-1">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" />
            Roteado automaticamente para o agente especialista do segmento:{' '}
            <strong>{meta.titulo}</strong>
          </span>
          <span className="text-slate-400 hidden sm:inline">
            A resposta inclui fontes oficiais (DOU, CGIBS, Senado, Planalto)
          </span>
        </div>
      </div>
    </div>
  )
}
