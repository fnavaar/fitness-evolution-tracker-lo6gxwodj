// Chat streaming com o Especialista de Treinos (slug "workout-specialist").
// POST /backend/v1/workout-specialist/chat  (auth obrigatório)
// body: { message: string, conversation_id?: string|null }
//
// FLUXO COPY-AND-PASTE:
// - Se a mensagem contiver um treino colado (formato estruturado do Coach),
//   este hook CRIA os cards (workouts + workout_exercises) DIRETO NO BANCO,
//   de forma determinística (parse do texto), e anexa ao agente um resumo do
//   que foi criado para ele explicar. Não depende da decisão do modelo.
// - Se o atleta pedir "só analisa/só explica", não cria — só passa ao agente.
routerAdd(
  'POST',
  '/backend/v1/workout-specialist/chat',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) return e.unauthorizedError('auth required')

      const body = info.body || {}
      const rawMessage = String(body.message || '').trim()
      if (!rawMessage) return e.badRequestError('message is required')

      const isExplicitlyAnalyzeOnly =
        /(só analisa|só explica|não cria|nao cria|só me diz|só quero saber|apenas analisa|só avalia)/i.test(
          rawMessage,
        )

      const parsed = isExplicitlyAnalyzeOnly ? null : parseWorkoutPlan(rawMessage)

      let message = rawMessage
      if (parsed && parsed.days.length > 0) {
        // Cria os cards no banco (determinístico).
        const created = createWorkoutCards(parsed, userId)
        // Avisa o agente do que foi criado para ele explicar.
        message =
          'O sistema já criou os seguintes cards para o treino colado pelo atleta:\n' +
          JSON.stringify(created.summary, null, 2) +
          '\n\nExplique ao atleta em PT-BR: o que foi criado, como executar cada exercício (técnica, o que sentir, erro comum) e a progressão sugerida. Se algo estiver incompleto, sugira o ajuste.'
      } else if (looksLikePastedWorkout(rawMessage) && !isExplicitlyAnalyzeOnly) {
        // Não parseou mas parece treino — deixa o agente tentar, com instrução.
        message =
          '[OBRIGATÓRIO] O atleta colou um treino do Coach. CRIE os cards AGORA usando as ferramentas create_workouts e create_workout_exercises. user_id=' +
          userId +
          '. Crie 1 workout por dia E TODOS os workout_exercises. Não responda sem criar os exercícios.\n\n' +
          rawMessage
      }

      // Pré-resolve o id da conversa.
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

/* ----------------- Parse do treino colado ----------------- */

function looksLikePastedWorkout(text) {
  return /(semana de treino|dia \d|séries|series:|reps:|descanso:)/i.test(text)
}

/**
 * Parseia um bloco de treino no formato do Coach:
 *   SEMANA DE TREINO - objetivo
 *   Frequência: X dias/semana
 *   Dia 1 (SEGUNDA) - tipo
 *   1. Nome - grupo | equipamento | dificuldade
 *      Series: 3 | Reps: 10-12 | Descanso: 90s
 * Retorna { goal, days_per_week, days: [{ day_of_week, workout_type, title, exercises: [...] }] }
 * ou null se não conseguir parsear.
 */
function parseWorkoutPlan(text) {
  try {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    let goal = 'hipertrofia'
    const goalMatch = text.match(/SEMANA DE TREINO\s*[-–—:]\s*([^\n]+)/i)
    if (goalMatch) {
      const g = goalMatch[1].toLowerCase()
      if (g.includes('emagrec')) goal = 'emagrecimento'
      else if (g.includes('condicion')) goal = 'condicionamento'
      else if (g.includes('resist') || g.includes('força') || g.includes('forca'))
        goal = 'resistencia'
      else goal = 'hipertrofia'
    }

    let daysPerWeek = 0
    const freqMatch = text.match(/Frequ[eê]ncia:\s*(\d+)/i)
    if (freqMatch) daysPerWeek = parseInt(freqMatch[1], 10)

    const DAY_MAP = {
      segunda: 'segunda',
      terca: 'terca',
      quarta: 'quarta',
      quinta: 'quinta',
      sexta: 'sexta',
      sabado: 'sabado',
      domingo: 'domingo',
    }
    const TYPE_MAP = {
      full_body: 'full_body',
      upper: 'upper',
      lower: 'lower',
      push: 'push',
      pull: 'pull',
      legs: 'legs',
      cardio: 'cardio',
      mobilidade: 'mobilidade',
      core: 'core',
    }

    const days = []
    let currentDay = null

    for (const line of lines) {
      const dayMatch = line.match(/^Dia\s+(\d+)\s*[(-]\s*([A-Za-záéíóúãõâêôç]+)/i)
      if (dayMatch) {
        const dayName = dayMatch[2].toLowerCase()
        const dayOfWeek = DAY_MAP[dayName] || 'segunda'
        // tenta extrair o tipo (full_body, upper, etc.)
        let workoutType = 'full_body'
        const typeMatch = line.match(
          /(full[_ ]?body|upper|lower|push|pull|legs|cardio|mobilidade|core)/i,
        )
        if (typeMatch) {
          const t = typeMatch[1].toLowerCase().replace(' ', '_')
          workoutType = TYPE_MAP[t] || 'full_body'
        }
        currentDay = {
          day_of_week: dayOfWeek,
          workout_type: workoutType,
          title:
            'Dia ' + dayMatch[1] + ' (' + dayName.charAt(0).toUpperCase() + dayName.slice(1) + ')',
          exercises: [],
        }
        days.push(currentDay)
        continue
      }

      // exercício: "1. Nome - grupo | equipamento | dificuldade"
      const exMatch = line.match(
        /^\d+[.)]\s*([^|]+?)\s*(?:[-–—]\s*([^|]+))?\s*(?:\|\s*([^|]+)\s*\|\s*([^|]+))?$/i,
      )
      if (exMatch && currentDay) {
        const name = exMatch[1].trim()
        // próxima linha pode ter Series/Reps/Descanso
        let sets = 3
        let reps = '8-12'
        let restTime = 60
        // procura na linha atual ou nas próximas
        const fullDayText = lines.slice(lines.indexOf(line)).join(' ')
        const setsMatch = fullDayText.match(/S[eé]ries?:?\s*(\d+)/i)
        const repsMatch = fullDayText.match(/Reps?:?\s*([\d\s-]+|[\d]+(?:-[\d]+)?s?)/i)
        const restMatch = fullDayText.match(/Descanso:?\s*(\d+)\s*s/i)
        if (setsMatch) sets = parseInt(setsMatch[1], 10)
        if (repsMatch) reps = repsMatch[1].trim()
        if (restMatch) restTime = parseInt(restMatch[1], 10)

        currentDay.exercises.push({ name, sets, reps, rest_time: restTime })
      }
    }

    if (days.length === 0) return null
    if (daysPerWeek === 0) daysPerWeek = days.length
    return { goal, days_per_week: daysPerWeek, days }
  } catch (_) {
    return null
  }
}

/* ----------------- Criação determinística no banco ----------------- */

function createWorkoutCards(plan, userId) {
  const summary = []
  const workoutsCol = $app.findCollectionByNameOrId('workouts')
  const workoutExercisesCol = $app.findCollectionByNameOrId('workout_exercises')

  for (const day of plan.days) {
    const workout = new Record(workoutsCol)
    workout.set('user_id', userId)
    workout.set('title', day.title)
    workout.set(
      'description',
      'Treino gerado pelo Coach Rocha e materializado pelo Especialista de Treinos.',
    )
    workout.set('goal', plan.goal)
    workout.set('days_per_week', plan.days_per_week)
    workout.set('status', 'pendente')
    workout.set('day_of_week', day.day_of_week)
    workout.set('workout_type', day.workout_type)
    $app.save(workout)

    const exercises = []
    let order = 1
    for (const ex of day.exercises) {
      // busca o exercise_id no catálogo
      let exRecord = null
      try {
        exRecord = $app.findFirstRecordByData('exercises', 'name', ex.name)
      } catch (_) {
        exRecord = null
      }
      if (!exRecord) {
        // tenta similar por nome parcial
        try {
          const similar = $app.findRecordsByFilter('exercises', 'name ~ {:q}', undefined, 1, 0, {
            q: ex.name,
          })
          if (similar.length > 0) exRecord = similar[0]
        } catch (_) {}
      }
      if (!exRecord) continue

      const we = new Record(workoutExercisesCol)
      we.set('workout_id', workout.id)
      we.set('exercise_id', exRecord.id)
      we.set('sets', Number(ex.sets) || 3)
      we.set('reps', String(ex.reps || '8-12'))
      we.set('rest_time', Number(ex.rest_time) || 60)
      we.set('sort_order', order)
      $app.save(we)
      exercises.push(ex.name + ' (' + we.get('sets') + 'x' + we.get('reps') + ')')
      order++
    }

    summary.push({
      id: workout.id,
      title: workout.get('title'),
      day: day.day_of_week,
      type: day.workout_type,
      exercises: exercises,
    })
  }

  return { summary }
}
