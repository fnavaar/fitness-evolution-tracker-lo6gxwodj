// Streaming chat com o agente Coach Rocha (slug "fitness-coach").
// POST /backend/v1/coach-chat  (auth obrigatório)
// body: { message: string, conversation_id?: string|null, context?: string }
// Retorna um stream SSE (eventos do agente Skip) com X-Conversation-Id.
routerAdd(
  'POST',
  '/backend/v1/coach-chat',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const body = info.body || {}
      const message = String(body.message || '').trim()
      if (!message) return e.badRequestError('message is required')

      const context = String(body.context || '').trim()
      const fullMessage = context
        ? message + '\n\n---\n[Contexto do atleta para esta conversa]\n' + context
        : message

      // Pré-resolve o id da conversa para enviá-lo no header antes do 1º byte.
      const conv = $ai.agent('fitness-coach').getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
      })

      // Espelha a conversa na collection shadow `coach_conversations` para que
      // rename/delete funcionem (o SDK do Skip AI não expõe esses métodos).
      // O title é derivado da primeira mensagem do usuário e só é definido na
      // criação — renomeações posteriores do usuário são preservadas.
      try {
        let shadow = null
        try {
          shadow = $app.findFirstRecordByData(
            'coach_conversations',
            'agent_conversation_id',
            conv.id,
          )
        } catch (_) {
          shadow = null
        }
        if (!shadow) {
          const shortTitle = message.length > 60 ? message.slice(0, 60).trim() + '…' : message
          const col = $app.findCollectionByNameOrId('coach_conversations')
          const rec = new Record(col)
          rec.set('user_id', userId)
          rec.set('agent_conversation_id', conv.id)
          rec.set('title', shortTitle || 'Nova conversa')
          $app.save(rec)
        }
      } catch (_) {
        // Falha no espelhamento não deve quebrar o chat.
      }

      const iter = $ai.agent('fitness-coach').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: fullMessage,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('Connection', 'keep-alive')
      e.response.header().set('X-Conversation-Id', conv.id)
      $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Coach temporariamente indisponível.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao conectar com o coach.' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Coach temporariamente indisponível.' : err.message,
        })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
