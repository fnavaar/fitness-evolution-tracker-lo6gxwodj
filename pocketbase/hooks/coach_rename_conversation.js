// Renomeia uma conversa do usuário com o agente Coach Rocha.
// PATCH /backend/v1/coach/conversations/{conversationId}  (auth obrigatório)
// body: { title: string }  (não vazio, máx 200 caracteres)
routerAdd(
  'PATCH',
  '/backend/v1/coach/conversations/{conversationId}',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const conversationId = e.request.pathValue('conversationId')
      if (!conversationId) return e.badRequestError('conversationId is required')

      const body = info.body || {}
      const title = String(body.title || '').trim()
      if (!title) return e.badRequestError('title is required')
      if (title.length > 200) return e.badRequestError('title too long')

      $ai.agent('fitness-coach').updateConversation({
        id: conversationId,
        user_id: userId,
        title: title,
      })

      return e.json(200, { ok: true, title: title })
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
                ? 'Sem permissão para renomear esta conversa.'
                : status >= 500
                  ? 'Falha ao renomear a conversa.'
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
