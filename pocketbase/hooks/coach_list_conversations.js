// Lista as conversas anteriores do usuário com o agente Coach Rocha.
// GET /backend/v1/coach/conversations?limit=20  (auth obrigatório)
//
// A fonte de verdade para a listagem é a collection shadow
// `coach_conversations` (migration 0031), que respeita rename/delete. Para
// cada registro, tentamos enriquecer os timestamps `created`/`updated` reais
// consultando as mensagens da conversa no runtime do agente. Se a conversa
// estiver órfã (ou a chamada falhar), usamos os timestamps da shadow.
routerAdd(
  'GET',
  '/backend/v1/coach/conversations',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const limit = parseInt((info.query && info.query.limit) || '20', 10) || 20

      // Registros shadow do usuário, mais recentes primeiro.
      const shadows = $app.findRecordsByFilter(
        'coach_conversations',
        'user_id = {:uid}',
        '-updated',
        limit,
        0,
        { uid: userId },
      )

      const result = []
      for (let i = 0; i < shadows.length; i++) {
        const rec = shadows[i]
        const agentConvId = rec.get('agent_conversation_id') || ''
        const title = rec.get('title') || 'Nova conversa'
        let created = rec.get('created') || ''
        let updated = rec.get('updated') || rec.get('created') || ''

        // Tenta obter timestamps reais a partir das mensagens do agente.
        try {
          const msgs = $ai.agent('fitness-coach').listMessages({
            conversation_id: agentConvId,
            user_id: userId,
          })
          const list = Array.isArray(msgs)
            ? msgs
            : Array.isArray(msgs && msgs.messages)
              ? msgs.messages
              : []
          if (list.length > 0) {
            const times = []
            for (let j = 0; j < list.length; j++) {
              const t = list[j] && list[j].created
              if (t) times.push(t)
            }
            if (times.length > 0) {
              times.sort()
              created = times[0]
              updated = times[times.length - 1]
            }
          }
        } catch (_) {
          // Conversa órfã — mantém os timestamps da shadow.
        }

        result.push({
          id: agentConvId,
          title: title,
          created: created,
          updated: updated,
        })
      }

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
