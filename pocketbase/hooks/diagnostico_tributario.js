/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook do Agente Nativo de Diagnóstico Tributário ADECONT
 * Rotas expostas:
 * - POST /backend/v1/diagnostico-tributario/chat (conversa síncrona / streaming com o agente Skip Cloud)
 * - GET  /backend/v1/diagnostico-tributario/sessoes (listar sessões gravadas)
 * - POST /backend/v1/diagnostico-tributario/sessoes (gravar ou atualizar sessão / relatório consolidado)
 * - GET  /backend/v1/diagnostico-tributario/historico (listar mensagens de uma conversa com o agente)
 */

// 1. Chat com o Agente Inteligente de Tributos Skip Cloud
routerAdd('POST', '/backend/v1/diagnostico-tributario/chat', (e) => {
  try {
    const info = e.requestInfo()
    const body = info.body || {}
    const message = (body.message || '').toString().trim()
    const conversationId = body.conversation_id ? String(body.conversation_id).trim() : null
    const stream = Boolean(body.stream)

    if (!message) {
      return e.json(400, { error: 'Mensagem é obrigatória para o Diagnóstico Tributário.' })
    }

    let userId = e.auth?.id
    if (!userId) {
      try {
        const user = $app.findFirstRecordByData('users', 'email', 'agente-tributario@adecont.local')
        userId = user.id
      } catch (_) {
        try {
          const records = $app.findRecordsByFilter('users', '', '-created', 1, 0)
          if (records.length > 0) userId = records[0].id
        } catch (errUser) {
          console.error('Erro ao buscar usuário de serviço:', errUser)
        }
      }
    }

    if (!userId) {
      return e.json(500, { error: 'Usuário de serviço para o agente não encontrado.' })
    }

    const agent = $ai.agent('diagnostico-tributario')

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

    // Modo síncrono
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
      iterations: result.iterations || 1,
    })
  } catch (err) {
    console.error('Erro no chat do Diagnóstico Tributário:', err)
    if (typeof SkipAiConfigError !== 'undefined' && err instanceof SkipAiConfigError) {
      return e.json(503, { error: 'Serviço de IA do agente temporariamente indisponível.' })
    }
    if (typeof SkipAiAgentsError !== 'undefined' && err instanceof SkipAiAgentsError) {
      const status = err.status || 500
      return e.json(status, {
        error: status >= 500 ? 'Falha interna na execução do agente.' : err.message,
      })
    }
    return e.json(500, { error: err.message || 'Erro inesperado no agente.' })
  }
})

// 2. Histórico de mensagens da conversa com o agente
routerAdd('GET', '/backend/v1/diagnostico-tributario/historico', (e) => {
  try {
    const info = e.requestInfo()
    const convId = info.query?.conversation_id
    if (!convId) {
      return e.json(400, { error: 'conversation_id é obrigatório.' })
    }

    let userId = e.auth?.id
    if (!userId) {
      try {
        const user = $app.findFirstRecordByData('users', 'email', 'agente-tributario@adecont.local')
        userId = user.id
      } catch (_) {
        try {
          const records = $app.findRecordsByFilter('users', '', '-created', 1, 0)
          if (records.length > 0) userId = records[0].id
        } catch (errUser) {
          console.error('Erro ao buscar usuário para histórico:', errUser)
        }
      }
    }

    if (!userId) {
      return e.json(500, { error: 'Usuário não localizado.' })
    }

    const agent = $ai.agent('diagnostico-tributario')
    const list = agent.listMessages({
      conversation_id: String(convId),
      user_id: userId,
      limit: 100,
    })

    return e.json(200, list)
  } catch (err) {
    console.error('Erro ao listar mensagens do agente:', err)
    return e.json(500, { error: err.message || 'Falha ao buscar histórico.' })
  }
})

// 3. Listar sessões gravadas na coleção diagnostico_sessoes
routerAdd('GET', '/backend/v1/diagnostico-tributario/sessoes', (e) => {
  try {
    const records = $app.findRecordsByFilter('diagnostico_sessoes', '', '-created', 50, 0)

    const items = records.map((r) => {
      let dadosTabela = null
      try {
        const str = r.getString('dados_tabela')
        if (str && str !== 'null') {
          dadosTabela = JSON.parse(str)
        }
      } catch (_) {
        dadosTabela = null
      }

      return {
        id: r.id,
        titulo: r.getString('titulo'),
        tema: r.getString('tema'),
        ato_analisado: r.getString('ato_analisado'),
        conversation_id: r.getString('conversation_id'),
        tipo_analise: r.getString('tipo_analise'),
        parecer_resumido: r.getString('parecer_resumido'),
        pontos_atencao: r.getString('pontos_atencao'),
        passo_a_passo: r.getString('passo_a_passo'),
        dados_tabela: dadosTabela,
        relatorio_consolidado: r.getString('relatorio_consolidado'),
        autor_email: r.getString('autor_email'),
        data_sessao: r.getString('data_sessao'),
        created: r.getString('created'),
        updated: r.getString('updated'),
      }
    })

    return e.json(200, { items, total: items.length })
  } catch (err) {
    console.error('Erro ao listar sessões:', err)
    return e.json(500, { error: err.message || 'Falha ao listar sessões.' })
  }
})

// 4. Salvar sessão / relatório consolidado
routerAdd('POST', '/backend/v1/diagnostico-tributario/sessoes', (e) => {
  try {
    const info = e.requestInfo()
    const body = info.body || {}
    const col = $app.findCollectionByNameOrId('diagnostico_sessoes')

    let record = null
    if (body.id) {
      try {
        record = $app.findRecordById('diagnostico_sessoes', body.id)
      } catch (_) {
        record = null
      }
    }

    if (!record) {
      record = new Record(col)
    }

    if (body.titulo) record.set('titulo', String(body.titulo))
    if (body.tema !== undefined) record.set('tema', String(body.tema || ''))
    if (body.ato_analisado !== undefined)
      record.set('ato_analisado', String(body.ato_analisado || ''))
    if (body.conversation_id !== undefined)
      record.set('conversation_id', String(body.conversation_id || ''))
    if (body.tipo_analise !== undefined)
      record.set('tipo_analise', String(body.tipo_analise || 'geral'))
    if (body.parecer_resumido !== undefined)
      record.set('parecer_resumido', String(body.parecer_resumido || ''))
    if (body.pontos_atencao !== undefined)
      record.set('pontos_atencao', String(body.pontos_atencao || ''))
    if (body.passo_a_passo !== undefined)
      record.set('passo_a_passo', String(body.passo_a_passo || ''))
    if (body.relatorio_consolidado !== undefined)
      record.set('relatorio_consolidado', String(body.relatorio_consolidado || ''))
    if (body.autor_email !== undefined) record.set('autor_email', String(body.autor_email || ''))
    if (body.data_sessao !== undefined) {
      record.set('data_sessao', String(body.data_sessao))
    } else if (!record.getString('data_sessao')) {
      record.set('data_sessao', new Date().toISOString().slice(0, 10))
    }

    if (body.dados_tabela !== undefined) {
      record.set('dados_tabela', JSON.stringify(body.dados_tabela))
    }

    $app.save(record)

    return e.json(200, {
      id: record.id,
      success: true,
      message: 'Sessão de diagnóstico registrada com sucesso.',
    })
  } catch (err) {
    console.error('Erro ao salvar sessão de diagnóstico:', err)
    return e.json(500, { error: err.message || 'Falha ao salvar sessão.' })
  }
})
