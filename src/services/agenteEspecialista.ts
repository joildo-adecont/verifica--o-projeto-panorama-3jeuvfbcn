/**
 * Serviço dos Agentes Especialistas ADECONT por Segmento:
 * - Jurídico ('juridico') -> 'especialista-juridico'
 * - Tributário ('tributario') -> 'especialista-tributario'
 * - Contábil ('contabil') -> 'especialista-contabil'
 * - Administrativo ('administrativo') -> 'especialista-administrativo'
 * - Consultor Contábil Estratégico ('consultor-contabil-estrategico') -> 'consultor-contabil-estrategico'
 * - Gestão Estratégica ('gestao-estrategica') -> 'gestao-estrategica'
 * - Reforma Tributária ('reforma-tributaria') -> 'consultor-reforma-tributaria'
 * - Trabalhista e Previdenciário ('trabalhista-previdenciario') -> 'trabalhista-previdenciario'
 * - Tributos Indiretos ('tributos-indiretos') -> 'tributos-indiretos'
 * - Societário e Compliance ('societario-compliance') -> 'societario-compliance'
 */
import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  type AgentCitation,
  type StreamAgentChatHandlers,
  type StreamAgentChatResult,
} from '@/lib/skipAi'

/**
 * URL base do backend. FALLBACK OBRIGATÓRIO: este é o único serviço do projeto
 * sem ele, e quando o build de produção não embute a env a URL vira
 * "undefined/backend/v1/..." — TODAS as colunas do modo Comparar agentes falham
 * com "Failed to fetch" de uma vez. Mesmo padrão de sistemaUsuarios.ts.
 */
const URL_BASE =
  (import.meta.env.VITE_POCKETBASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

export const ROTA_CHAT_ESPECIALISTA = `${URL_BASE}/backend/v1/agente-especialista/chat`

/** Erro de rede do navegador (servidor fora do ar, CORS, DNS, offline…). */
export function isErroRedeFetch(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false
  return /failed to fetch|networkerror|load failed/i.test(err.message)
}

export type SegmentoEspecialista =
  | 'juridico'
  | 'tributario'
  | 'contabil'
  | 'administrativo'
  | 'consultor-contabil-estrategico'
  | 'gestao-estrategica'
  | 'reforma-tributaria'
  | 'trabalhista-previdenciario'
  | 'tributos-indiretos'
  | 'societario-compliance'

export interface MensagemEspecialista {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AgentCitation[]
  created: string
}

export interface ChatEspecialistaResponse {
  conversation_id: string
  content: string
  citations?: AgentCitation[]
  message_id: string
  segmento: SegmentoEspecialista
  slug: string
}

export async function enviarMensagemEspecialista(params: {
  segmento: SegmentoEspecialista
  message: string
  conversationId?: string | null
  /** Cancela a requisição (ex.: botão da coluna). Padrão: timer interno. */
  signal?: AbortSignal
  /** Teto da chamada síncrona (padrão 90s — agentes levam ~20s+). */
  timeoutMs?: number
}): Promise<ChatEspecialistaResponse> {
  // Resposta síncrona do agente pode levar ~20s+ (pesquisa em fontes externas).
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 90_000)
  try {
    const res = await fetch(ROTA_CHAT_ESPECIALISTA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({
        segmento: params.segmento,
        message: params.message,
        conversation_id: params.conversationId || null,
        stream: false,
      }),
      signal: params.signal ?? controller.signal,
    })

    if (!res.ok) {
      let errMsg = `Erro no agente especialista (${res.status})`
      try {
        const data = await res.json()
        if (data?.error) errMsg = data.error
      } catch {
        /* intentionally ignored */
      }
      throw new Error(errMsg)
    }

    return (await res.json()) as ChatEspecialistaResponse
  } finally {
    clearTimeout(timeout)
  }
}

export async function enviarMensagemEspecialistaStream(params: {
  segmento: SegmentoEspecialista
  message: string
  conversationId?: string | null
  handlers: StreamAgentChatHandlers
}): Promise<StreamAgentChatResult> {
  const res = await fetch(ROTA_CHAT_ESPECIALISTA, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify({
      segmento: params.segmento,
      message: params.message,
      conversation_id: params.conversationId || null,
      stream: true,
    }),
    signal: params.handlers.signal,
  })

  return await streamAgentChat(res, params.handlers)
}
