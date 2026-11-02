/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook dos 4 Agentes Especialistas Nativos ADECONT:
 * - Especialista Jurídico: slug 'especialista-juridico'
 * - Especialista Tributário: slug 'especialista-tributario'
 * - Especialista Contábil: slug 'especialista-contabil'
 * - Especialista Administrativo: slug 'especialista-administrativo'
 *
 * Rotas expostas:
 * POST /backend/v1/agente-especialista/chat
 * Query ou body param: `segmento` = 'juridico' | 'tributario' | 'contabil' | 'administrativo'
 */

routerAdd('POST', '/backend/v1/agente-especialista/chat', (e) => {
  try {
    const slugsPorSegmento = {
      juridico: 'especialista-juridico',
      tributario: 'especialista-tributario',
      contabil: 'especialista-contabil',
      administrativo: 'especialista-administrativo',
    }

    const info = e.requestInfo()
    const body = info.body || {}
    const query = info.query || {}

    const segmentoRaw = (body.segmento || query.segmento || 'tributario')
      .toString()
      .toLowerCase()
      .trim()
    const slug = slugsPorSegmento[segmentoRaw] || 'especialista-tributario'

    const message = (body.message || '').toString().trim()
    const conversationId = body.conversation_id ? String(body.conversation_id).trim() : null
    const stream = Boolean(body.stream)

    if (!message) {
      return e.json(400, { error: 'Mensagem é obrigatória para o Agente Especialista.' })
    }

    let userId = e.auth?.id
    if (!userId) {
      try {
        const user = $app.findFirstRecordByData(
          'users',
          'email',
          'agente-especialista@adecont.local',
        )
        userId = user.id
      } catch (_) {
        try {
          const records = $app.findRecordsByFilter('users', '', '-created', 1, 0)
          if (records.length > 0) userId = records[0].id
        } catch (errUser) {
          console.error('Erro ao buscar usuário para agente especialista:', errUser)
        }
      }
    }

    if (!userId) {
      return e.json(500, { error: 'Usuário de serviço para o agente não encontrado.' })
    }

    const agent = $ai.agent(slug)

    if (stream) {
      const conv = agent.getOrCreateConversation({
        user_id: userId,
        id: conversationId || null,
      })

      const iter = agent.chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)
      $response.stream(e, iter)
      return
    }

    // Síncrono
    const result = agent.chat({
      user_id: userId,
      conversation_id: conversationId,
      message: message,
    })

    return e.json(200, {
      conversation_id: result.conversation_id,
      content: result.content,
      citations: result.citations || [],
      message_id: result.message_id,
      segmento: segmentoRaw,
      slug: slug,
    })
  } catch (err) {
    console.error('Erro no agente especialista:', err)
    if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
      return e.json(503, { error: 'Serviço de IA temporariamente indisponível.' })
    }
    if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
      const status = err.status || 500
      return e.json(status, {
        error: status >= 500 ? 'Falha interna na execução do agente especialista.' : err.message,
      })
    }
    return e.json(500, { error: err.message || 'Erro inesperado no agente especialista.' })
  }
})
