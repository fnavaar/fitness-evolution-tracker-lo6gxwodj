// Exclui uma conversa do usuário com o agente Coach Rocha.
// DELETE /backend/v1/coach/conversations/{conversationId}  (auth obrigatório)
//
// O SDK JS do Skip AI não expõe `deleteConversation()`, então a exclusão opera
// sobre a collection shadow `coach_conversations` (migration 0031). A conversa
// real permanece no runtime do agente, mas fica órfã e deixa de aparecer nas
// listagens do front (que lê da collection shadow).
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

      $app.delete(shadow)

      return e.json(200, { ok: true })
    } catch (err) {
      const msg = err && err.message ? err.message : 'Falha ao excluir a conversa.'
      return e.json(500, { error: msg })
    }
  },
  $apis.requireAuth(),
)
