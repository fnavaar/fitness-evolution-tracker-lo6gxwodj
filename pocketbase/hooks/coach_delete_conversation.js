// Exclui uma conversa do usuário com o agente Coach Rocha.
// DELETE /backend/v1/coach/conversations/{conversationId}  (auth obrigatório)
routerAdd(
  'DELETE',
  '/backend/v1/coach/conversations/{conversationId}',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const conversationId = e.request.pathValue('conversationId')
      if (!conversationId) return e.badRequestError('conversationId is required')

      $ai.agent('fitness-coach').deleteConversation({
        id: conversationId,
        user_id: userId,
      })

      return e.json(200, { ok: true })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Coach temporariamente indisponível.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error:
            status === 404
              ? 'Conversa não encontrada.'
              : status === 403
                ? 'Sem permissão para excluir esta conversa.'
                : status >= 500
                  ? 'Falha ao excluir a conversa.'
                  : err.message,
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
