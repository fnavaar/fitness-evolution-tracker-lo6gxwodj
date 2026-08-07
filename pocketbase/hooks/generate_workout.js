// Geração de semana de treino via IA (endpoint síncrono $ai.chat).
// POST /backend/v1/generate-workout  (auth obrigatório)
// body: { goal, level, duration, equipment?, notes?, daysPerWeek? }
// Retorna { id, ids, sessions } com os treinos criados.
routerAdd('POST', '/backend/v1/generate-workout', (e) => {
  try {
    const info = e.requestInfo()
    if (!info.auth) {
      return e.json(401, { error: 'Não autorizado.' })
    }

    const userId = info.auth.id
    const body = info.body || {}
    const goal = body.goal || 'hipertrofia'
    const level = body.level || 'intermediario'
    const duration = Number(body.duration || 60)
    const equipment = body.equipment || ''
    const notes = body.notes || ''

    const durationToDays = { 30: 3, 45: 4, 60: 4, 90: 5 }
    const requestedDays = Number(body.daysPerWeek || durationToDays[duration] || 4)
    const daysPerWeek = Math.min(7, Math.max(1, requestedDays))

    const levelLabel =
      {
        iniciante: 'iniciante',
        intermediario: 'intermediário',
        avancado: 'avançado',
      }[level] || 'intermediário'

    const extraContext = []
    if (equipment) extraContext.push('Equipamentos disponíveis: ' + equipment + '.')
    if (notes) extraContext.push('Restrições/observações do usuário: ' + notes + '.')
    const extra = extraContext.length ? ' ' + extraContext.join(' ') : ''

    const prompt =
      'Crie uma semana de treino em formato JSON rigoroso para um usuário com objetivo de "' +
      goal +
      '", nível ' +
      levelLabel +
      ', com duração estimada de ' +
      duration +
      ' minutos por sessão, treinando ' +
      daysPerWeek +
      ' dias por semana.' +
      extra +
      '\nResponda EXATAMENTE e APENAS com um objeto JSON válido sem markdown no formato:\n' +
      '{\n' +
      '  "title": "Nome da semana em PT-BR",\n' +
      '  "description": "Explicação geral da metodologia em PT-BR",\n' +
      '  "days": [\n' +
      '    {\n' +
      '      "day_of_week": "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo",\n' +
      '      "workout_type": "full_body" | "upper" | "lower" | "push" | "pull" | "legs" | "cardio" | "mobilidade" | "core",\n' +
      '      "title": "Nome da sessão",\n' +
      '      "description": "Como executar a sessão e qual é o foco",\n' +
      '      "exercises": [\n' +
      '        {\n' +
      '          "name": "Nome do exercício em PT-BR",\n' +
      '          "muscle_group": "peito" | "costas" | "pernas" | "ombros" | "bracos" | "core" | "gluteos",\n' +
      '          "equipment": "halteres" | "barra" | "maquina" | "peso_corporal" | "cabos",\n' +
      '          "difficulty": "iniciante" | "intermediario" | "avancado",\n' +
      '          "instructions": "Instruções passo a passo de execução em PT-BR",\n' +
      '          "sets": 4,\n' +
      '          "reps": "8-12",\n' +
      '          "rest_time": 60\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n' +
      'Gere exatamente ' +
      daysPerWeek +
      ' sessões, uma por dia, com 3 a 8 exercícios em cada sessão. Distribua os grupos musculares, informe como executar cada exercício e mantenha a dificuldade coerente com o nível ' +
      levelLabel +
      '.'

    // --- Chamada à IA (envolvida em try/catch p/ não virar 400 genérico) ---
    let response
    try {
      response = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um gerador de semanas de treino em JSON rigoroso. Responda apenas com JSON.',
          },
          { role: 'user', content: prompt },
        ],
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, { error: 'Geração de treino temporariamente indisponível.' })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status >= 500 ? 502 : status, {
          error: 'Falha ao comunicar com a IA. Tente novamente.',
        })
      }
      return e.json(500, { error: 'Falha ao comunicar com a IA. Tente novamente.' })
    }

    // --- Parse defensivo da resposta da IA ---
    let plan
    try {
      const rawText =
        (response &&
          response.choices &&
          response.choices[0] &&
          response.choices[0].message &&
          response.choices[0].message.content) ||
        ''
      let cleanText = String(rawText).trim()
      const fence = String.fromCharCode(96).repeat(3)
      if (cleanText.startsWith(fence + 'json')) {
        cleanText = cleanText
          .slice((fence + 'json').length)
          .replace(new RegExp(fence + '$'), '')
          .trim()
      } else if (cleanText.startsWith(fence)) {
        cleanText = cleanText
          .slice(fence.length)
          .replace(new RegExp(fence + '$'), '')
          .trim()
      }
      plan = JSON.parse(cleanText)
    } catch (_) {
      return e.json(500, { error: 'Erro ao processar plano gerado pela IA.' })
    }

    const defaultDays = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
    const validTypes = [
      'full_body',
      'upper',
      'lower',
      'push',
      'pull',
      'legs',
      'cardio',
      'mobilidade',
      'core',
    ]

    // --- Montagem das sessões ---
    let sessions
    try {
      sessions =
        Array.isArray(plan.days) && plan.days.length > 0
          ? plan.days.slice(0, 7)
          : [
              {
                day_of_week: defaultDays[0],
                workout_type: 'full_body',
                title: plan.title || 'Treino Personalizado IA',
                description: plan.description || 'Treino gerado por Inteligência Artificial.',
                exercises: plan.exercises || [],
              },
            ]
    } catch (_) {
      return e.json(500, { error: 'Erro ao montar a semana de treinos.' })
    }

    // --- Transação de banco (workouts + exercises + workout_exercises) ---
    const ids = []
    try {
      $app.runInTransaction((txApp) => {
        const txWorkoutsCol = txApp.findCollectionByNameOrId('workouts')
        const txExercisesCol = txApp.findCollectionByNameOrId('exercises')
        const txWorkoutExercisesCol = txApp.findCollectionByNameOrId('workout_exercises')

        for (let index = 0; index < sessions.length; index++) {
          const session = sessions[index] || {}
          const day = defaultDays[index] || 'segunda'
          const exercises = Array.isArray(session.exercises) ? session.exercises : []
          if (exercises.length === 0) continue

          const workout = new Record(txWorkoutsCol)
          workout.set('user_id', userId)
          workout.set('title', session.title || (plan.title || 'Treino IA') + ' — ' + day)
          workout.set(
            'description',
            session.description || plan.description || 'Sessão gerada por Inteligência Artificial.',
          )
          workout.set('goal', goal)
          workout.set('days_per_week', sessions.length)
          workout.set('status', 'pendente')
          workout.set(
            'day_of_week',
            defaultDays.indexOf(session.day_of_week) >= 0 ? session.day_of_week : day,
          )
          workout.set(
            'workout_type',
            validTypes.indexOf(session.workout_type) >= 0 ? session.workout_type : 'full_body',
          )
          txApp.save(workout)
          ids.push(workout.id)

          for (let i = 0; i < exercises.length; i++) {
            const item = exercises[i] || {}
            let exercise
            try {
              exercise = txApp.findFirstRecordByData('exercises', 'name', item.name)
            } catch (_) {
              exercise = new Record(txExercisesCol)
              exercise.set('name', item.name || 'Exercício')
              exercise.set('muscle_group', item.muscle_group || 'pernas')
              exercise.set('equipment', item.equipment || 'peso_corporal')
              exercise.set('difficulty', item.difficulty || level)
              exercise.set('instructions', item.instructions || 'Execute com técnica e controle.')
              txApp.save(exercise)
            }

            const link = new Record(txWorkoutExercisesCol)
            link.set('workout_id', workout.id)
            link.set('exercise_id', exercise.id)
            link.set('sets', Number(item.sets || 3))
            link.set('reps', String(item.reps || '10-12'))
            link.set('rest_time', Number(item.rest_time || 60))
            link.set('sort_order', i + 1)
            txApp.save(link)
          }
        }
      })
    } catch (err) {
      return e.json(500, {
        error: err && err.message ? err.message : 'Erro ao publicar a semana de treinos.',
      })
    }

    return e.json(200, { id: ids[0] || null, ids, sessions: ids.length })
  } catch (err) {
    // Rede de segurança: qualquer exceção não prevista vira 500 tratado.
    return e.json(500, {
      error: err && err.message ? err.message : 'Erro inesperado ao gerar o treino.',
    })
  }
})
