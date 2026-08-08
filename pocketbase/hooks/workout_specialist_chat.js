// Chat streaming com o Especialista de Treinos (slug "workout-specialist").
// POST /backend/v1/workout-specialist/chat  (auth obrigatório)
// body: { message: string, conversation_id?: string|null }
// Retorna um stream SSE com os eventos do agente Skip e o header
// X-Conversation-Id pré-resolvido antes do primeiro byte.
//
// O Especialista de Treinos é focado na área /treinos: ele pode refinar
// treinos existentes ou processar drafts pendentes do Coach Rocha,
// criando/atualizando registros em workouts + workout_exercises.
routerAdd(
  'POST',
  '/backend/v1/workout-specialist/chat',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const body = info.body || {}
      let message = String(body.message || '').trim()
      if (!message) return e.badRequestError('message is required')

      // Detecta quando o atleta colou um bloco de treino do Coach (formato
      // estruturado com dias/exercícios) e garante a criação automática dos
      // cards — não depende da decisão do modelo.
      const looksLikePastedWorkout =
        /(semana de treino|dia \d|séries|series:|reps:|descanso:|exercícios?:)/i.test(message)
      const isExplicitlyAnalyzeOnly =
        /(só analisa|só explica|não cria|nao cria|só me diz|só quero saber|apenas analisa|só avalia)/i.test(
          message,
        )

      if (looksLikePastedWorkout && !isExplicitlyAnalyzeOnly) {
        message +=
          '\n\n---\n[INSTRUÇÃO DO SISTEMA] O atleta colou um treino gerado pelo Coach Rocha. CRIE os cards agora: para cada dia, crie UM registro em workouts (title, description, goal, days_per_week, status="pendente", day_of_week, workout_type, user_id=' +
          userId +
          ') e para cada exercício crie UM registro em workout_exercises (workout_id do criado, exercise_id do catálogo, sets, reps, rest_time, sort_order). Use as ferramentas de criação. Complete com exercícios do catálogo se houver menos de 5 por dia. NÃO pergunte se deve criar — crie. Depois resuma em PT-BR o que criou.'
      }

      // Pré-resolve o id da conversa para enviá-lo no header antes do 1º byte.
      const conv = $ai.agent('workout-specialist').getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
      })

      const iter = $ai.agent('workout-specialist').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: message,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('Connection', 'keep-alive')
      e.response.header().set('X-Conversation-Id', conv.id)
      $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Especialista de Treinos temporariamente indisponível.' })
      }
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao conectar com o Especialista.' : err.message,
        })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, {
          error: status >= 500 ? 'Especialista de Treinos indisponível.' : err.message,
        })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
