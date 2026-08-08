// Renomeia uma conversa do usuário com o agente Coach Rocha.
// PATCH /backend/v1/coach/conversations/{conversationId}  (auth obrigatório)
// body: { title: string }  (não vazio, máx 200 caracteres)
//
// O SDK JS do Skip AI não expõe `updateConversation()`, então o rename opera
// sobre a collection shadow `coach_conversations` (criada na migration 0031).
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

      // Busca o registro shadow pertencente a este usuário.
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

      shadow.set('title', title)
      $app.save(shadow)

      return e.json(200, { ok: true, title: title })
    } catch (err) {
      const msg = err && err.message ? err.message : 'Falha ao renomear a conversa.'
      return e.json(500, { error: msg })
    }
  },
  $apis.requireAuth(),
)
