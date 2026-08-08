// Lista as mensagens de uma conversa anterior do usuário com o Coach Rocha.
// GET /backend/v1/coach/conversations/{conversationId}/messages  (auth obrigatório)
//
// Antes de delegar ao runtime do agente, valida a posse da conversa através da
// collection shadow `coach_conversations` (migration 0031) — conversas excluídas
// pelo usuário não têm registro shadow e portanto retornam 404.
routerAdd(
  'GET',
  '/backend/v1/coach/conversations/{conversationId}/messages',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const conversationId = e.request.pathValue('conversationId')
      if (!conversationId) return e.badRequestError('conversationId is required')

      // Verifica posse via registro shadow.
      let shadow
      try {
        shadow = $app.findFirstRecordByData(
          'coach_conversations',
          'agent_conversation_id',
          conversationId,
        )
      } catch (_) {
        return e.json(404, { error: 'Conversa não encontrada.' })
      }
      if (!shadow || shadow.get('user_id') !== userId) {
        return e.json(404, { error: 'Conversa não encontrada.' })
      }

      const result = $ai.agent('fitness-coach').listMessages({
        conversation_id: conversationId,
        user_id: userId,
      })

      return e.json(200, result)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Coach temporariamente indisponível.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao carregar mensagens.' : err.message,
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
