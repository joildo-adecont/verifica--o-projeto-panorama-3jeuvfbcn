/**
 * Serviço dos Agentes Especialistas ADECONT por Segmento:
 * - Jurídico ('juridico') -> 'especialista-juridico'
 * - Tributário ('tributario') -> 'especialista-tributario'
 * - Contábil ('contabil') -> 'especialista-contabil'
 * - Administrativo ('administrativo') -> 'especialista-administrativo'
 */
import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  type AgentCitation,
  type StreamAgentChatHandlers,
  type StreamAgentChatResult,
} from '@/lib/skipAi'

export type SegmentoEspecialista = 'juridico' | 'tributario' | 'contabil' | 'administrativo'

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
}): Promise<ChatEspecialistaResponse> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/agente-especialista/chat`,
    {
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
    },
  )

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
}

export async function enviarMensagemEspecialistaStream(params: {
  segmento: SegmentoEspecialista
  message: string
  conversationId?: string | null
  handlers: StreamAgentChatHandlers
}): Promise<StreamAgentChatResult> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/agente-especialista/chat`,
    {
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
    },
  )

  return await streamAgentChat(res, params.handlers)
}
