/**
 * MODO COMPARAÇÃO DOS AGENTES — dentro da tela "Pesquisa dos Agentes"
 * Sistema ADECONT — Projeto Panorama
 *
 * Pedido do usuário: "Comparar respostas dos agentes lado a lado".
 *
 * Comportamento:
 *  - o usuário marca 2+ agentes (máx. 4, para caber na tela), digita UMA pergunta
 *    e as chamadas de chat disparam EM PARALELO para /backend/v1/agente-especialista/chat;
 *  - cada coluna mostra o nome/ícone do agente, estado de carregando, erro
 *    (sem derrubar as outras colunas) e a resposta nos MESMOS blocos estruturados
 *    da tela individual (parser + RenderizadorBlocosRelatorio reusados);
 *  - cada coluna tem a MESMA barra de exportação da tela individual
 *    (BarraExportacaoRelatorio: PDF · TXT · CSV · XLSX, com registro na Central).
 *
 * As conversas de cada agente são mantidas entre perguntas (conversation_id por
 * segmento), então uma segunda pergunta continua cada conversa de onde parou.
 */
import { useMemo, useState } from 'react'
import { Columns3, Loader2, Send, AlertTriangle, X, Sparkles } from 'lucide-react'
import { CONFIG_AGENTES } from '@/components/configAgentes'
import { RenderizadorBlocosRelatorio } from '@/components/RenderizadorBlocosRelatorio'
import { BarraExportacaoRelatorio } from '@/components/BarraExportacaoRelatorio'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import { parseBlocosRelatorio } from '@/services/relatorioAgenteParser'
import {
  enviarMensagemEspecialista,
  type SegmentoEspecialista,
} from '@/services/agenteEspecialista'
import type { AgentCitation } from '@/lib/skipAi'

/** Máximo de colunas lado a lado (sugestivo — cabe na tela ampla). */
const MAX_AGENTES = 4

type EstadoColuna =
  | { estado: 'aguardando' }
  | { estado: 'carregando' }
  | {
      estado: 'ok'
      content: string
      citations?: AgentCitation[]
      emitidoEm: string
    }
  | { estado: 'erro'; mensagem: string }

function classeColunas(quantidade: number): string {
  if (quantidade >= 4) return 'grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4'
  if (quantidade === 3) return 'grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4'
  return 'grid grid-cols-1 md:grid-cols-2 gap-4'
}

export function ModoComparacaoAgentes() {
  const [selecionados, setSelecionados] = useState<SegmentoEspecialista[]>([
    CONFIG_AGENTES[0].segmento,
    CONFIG_AGENTES[1].segmento,
  ])
  const [pergunta, setPergunta] = useState('')
  const [estados, setEstados] = useState<Record<string, EstadoColuna>>({})
  const [conversationIds, setConversationIds] = useState<Record<string, string | null>>({})
  const [comparando, setComparando] = useState(false)

  const agentesSelecionados = useMemo(
    () =>
      selecionados.map((seg) => CONFIG_AGENTES.find((a) => a.segmento === seg)!).filter(Boolean),
    [selecionados],
  )

  const podeComparar =
    !comparando &&
    selecionados.length >= 2 &&
    selecionados.length <= MAX_AGENTES &&
    pergunta.trim().length > 0

  function alternarAgente(seg: SegmentoEspecialista) {
    setSelecionados((prev) => {
      if (prev.includes(seg)) {
        if (prev.length <= 1) return prev
        return prev.filter((s) => s !== seg)
      }
      if (prev.length >= MAX_AGENTES) return prev
      return [...prev, seg]
    })
  }

  function limparComparacao() {
    setEstados({})
    setPergunta('')
    setConversationIds({})
  }

  async function comparar() {
    const texto = pergunta.trim()
    if (!podeComparar) return

    const iniciais: Record<string, EstadoColuna> = {}
    for (const seg of selecionados) iniciais[seg] = { estado: 'carregando' }
    setEstados(iniciais)
    setComparando(true)

    // Chamadas em paralelo — uma falha NÃO derruba as outras colunas.
    await Promise.all(
      selecionados.map(async (seg) => {
        try {
          const resp = await enviarMensagemEspecialista({
            segmento: seg,
            message: texto,
            conversationId: conversationIds[seg] ?? null,
          })
          if (resp.conversation_id) {
            setConversationIds((prev) => ({ ...prev, [seg]: resp.conversation_id }))
          }
          setEstados((prev) => ({
            ...prev,
            [seg]: {
              estado: 'ok',
              content: resp.content,
              citations: resp.citations,
              emitidoEm: new Date().toISOString(),
            },
          }))
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Falha na comunicação com o agente'
          setEstados((prev) => ({
            ...prev,
            [seg]: { estado: 'erro', mensagem: msg },
          }))
        }
      }),
    )

    setComparando(false)
  }

  return (
    <div className="space-y-4">
      {/* ── PAINEL DE SELEÇÃO + PERGUNTA ÚNICA ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Columns3 className="w-4 h-4 text-panorama-gold" />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Modo Comparação — mesma pergunta para vários agentes
          </span>
          <span className="text-[11px] text-slate-400">
            ({selecionados.length} de {MAX_AGENTES} selecionados · mínimo 2)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {CONFIG_AGENTES.map((ag) => {
            const marcado = selecionados.includes(ag.segmento)
            return (
              <button
                key={ag.segmento}
                onClick={() => alternarAgente(ag.segmento)}
                title={marcado ? 'Remover da comparação' : 'Adicionar à comparação'}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  marcado
                    ? `${ag.corPrimaria} ring-2 ring-panorama-gold/40 shadow-sm`
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <ag.Icon className="w-3.5 h-3.5" />
                <span>{ag.curto}</span>
                {marcado && <X className="w-3 h-3 opacity-60" />}
              </button>
            )
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            comparar()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Digite UMA pergunta para todos os agentes selecionados..."
            disabled={comparando}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-panorama-navy focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!podeComparar}
            title={
              selecionados.length < 2
                ? 'Selecione pelo menos 2 agentes'
                : 'Enviar a pergunta aos agentes selecionados'
            }
            className="px-4 py-2.5 rounded-xl bg-panorama-navy hover:bg-slate-900 text-panorama-gold-light font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50 cursor-pointer border border-panorama-gold/40"
          >
            {comparando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Comparar respostas</span>
          </button>
          {Object.keys(estados).length > 0 && !comparando && (
            <button
              type="button"
              onClick={limparComparacao}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              title="Limpar respostas desta comparação"
            >
              Limpar
            </button>
          )}
        </form>
      </div>

      {/* ── COLUNAS LADO A LADO ── */}
      {agentesSelecionados.length >= 2 && (
        <div className={classeColunas(agentesSelecionados.length)}>
          {agentesSelecionados.map((ag) => {
            const estado = estados[ag.segmento] ?? { estado: 'aguardando' as const }
            return (
              <div
                key={ag.segmento}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
              >
                {/* Cabeçalho da coluna */}
                <div
                  className={`px-4 py-3 border-b border-slate-200 flex items-center gap-2 ${ag.corPrimaria.split(' ').slice(1).join(' ')}`}
                >
                  <ag.Icon className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wide">{ag.curto}</span>
                </div>

                {/* Corpo */}
                <div className="flex-1 overflow-y-auto max-h-[560px] p-4 space-y-3 bg-slate-50/50">
                  {estado.estado === 'aguardando' && (
                    <p className="text-xs text-slate-400">
                      Aguardando a comparação — digite a pergunta e clique em “Comparar respostas”.
                    </p>
                  )}

                  {estado.estado === 'carregando' && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 rounded-xl border border-slate-200 bg-white p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-panorama-gold shrink-0" />
                      <span>
                        O {ag.curto} está pesquisando as bases oficiais e estruturando o parecer...
                      </span>
                    </div>
                  )}

                  {estado.estado === 'erro' && (
                    <div className="flex items-start gap-2 text-xs text-rose-700 rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Não foi possível obter a resposta do {ag.curto} ({estado.mensagem}). As
                        demais colunas seguem normalmente — reenvie a comparação para tentar de
                        novo.
                      </span>
                    </div>
                  )}

                  {estado.estado === 'ok' && (
                    <>
                      <RenderizadorBlocosRelatorio
                        blocos={parseBlocosRelatorio(estado.content)}
                        modoCompacto
                      />

                      {estado.citations && estado.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
                            Fontes do Sistema Citadas:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {estado.citations.map((c, idx) => (
                              <span
                                key={idx}
                                className="text-[10.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200 font-mono inline-flex items-center gap-1.5 max-w-full"
                              >
                                <span className="truncate">
                                  [{c.n}] {c.excerpt.slice(0, 80)}...
                                </span>
                                <SeloNivelConfianca fonte={c.excerpt} compacto />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exportação própria da coluna — mesma barra da tela individual */}
                      <BarraExportacaoRelatorio
                        blocos={parseBlocosRelatorio(estado.content)}
                        meta={{
                          titulo: `${ag.titulo} — Comparação de Agentes`,
                          agente: ag.titulo,
                          dataEmissao: new Date(estado.emitidoEm).toLocaleString('pt-BR'),
                        }}
                        agenteSegmento={ag.segmento}
                        perguntaOrigem={pergunta.trim()}
                        citations={estado.citations}
                      />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {agentesSelecionados.length < 2 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center">
          <Sparkles className="w-5 h-5 text-panorama-gold mx-auto mb-2" />
          <p className="text-xs text-slate-500">
            Selecione pelo menos 2 agentes acima para comparar as respostas lado a lado.
          </p>
        </div>
      )}
    </div>
  )
}
