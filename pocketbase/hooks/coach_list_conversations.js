// Lista as conversas anteriores do usuário com o agente Coach Rocha.
// GET /backend/v1/coach/conversations?limit=20  (auth obrigatório)
routerAdd(
  'GET',
  '/backend/v1/coach/conversations',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const limit = parseInt((info.query && info.query.limit) || '20', 10) || 20

      const result = $ai.agent('fitness-coach').listConversations({
        user_id: userId,
        limit: limit,
      })

      return e.json(200, result)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Coach temporariamente indisponível.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao listar conversas.' : err.message,
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
