// Confirmação e publicação automática de uma semana de treinos criada pelo Coach.
// O draft é um handoff interno: uma única proposta pode materializar várias
// sessões, uma para cada dia da semana.
routerAdd(
  'POST',
  '/backend/v1/coach/drafts/:id/confirm',
  (e) => {
    try {
      const info = e.requestInfo()
      const userId = info.auth && info.auth.id
      if (!userId) {
        return e.json(401, { error: 'Não autorizado.' })
      }

      const draftId = e.request.pathParam('id') || ''
      let draft
      try {
        draft = $app.findFirstRecordByData('coach_drafts', 'id', draftId)
      } catch (_) {
        return e.json(404, { error: 'Rascunho não encontrado.' })
      }

      if (draft.get('user_id') !== userId) {
        return e.json(403, { error: 'Não autorizado.' })
      }

      if ((draft.get('status') || '') !== 'proposta') {
        return e.json(409, { error: 'Rascunho já processado.' })
      }

      if ((draft.get('type') || '') !== 'workout') {
        return e.json(400, { error: 'Este fluxo publica apenas treinos.' })
      }

      let payload
      try {
        const raw = draft.get('payload')
        payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
      } catch (_) {
        return e.json(400, { error: 'Payload inválido.' })
      }

      if (!payload || typeof payload !== 'object') {
        return e.json(400, { error: 'Payload inválido.' })
      }

      const VALID_GOALS = ['hipertrofia', 'emagrecimento', 'condicionamento', 'resistencia']
      const VALID_DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
      const VALID_TYPES = [
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
      const VALID_MUSCLES = ['peito', 'costas', 'pernas', 'ombros', 'bracos', 'core', 'gluteos']
      const VALID_EQUIP = ['halteres', 'barra', 'maquina', 'peso_corporal', 'cabos']
      const VALID_DIFF = ['iniciante', 'intermediario', 'avancado']
      const DAY_LABELS = {
        segunda: 'Segunda-feira',
        terca: 'Terça-feira',
        quarta: 'Quarta-feira',
        quinta: 'Quinta-feira',
        sexta: 'Sexta-feira',
        sabado: 'Sábado',
        domingo: 'Domingo',
      }

      if (typeof payload.title !== 'string' || !payload.title.trim()) {
        return e.json(400, { error: 'title é obrigatório.' })
      }
      if (VALID_GOALS.indexOf(payload.goal) === -1) {
        return e.json(400, { error: 'goal inválido.' })
      }

      // Compatibilidade com drafts antigos de uma única sessão.
      const days =
        Array.isArray(payload.days) && payload.days.length > 0
          ? payload.days
          : [
              {
                day_of_week: 'segunda',
                workout_type: 'full_body',
                title: payload.title,
                description: payload.description,
                exercises: payload.exercises,
              },
            ]

      if (days.length < 1 || days.length > 7) {
        return e.json(400, { error: 'A semana deve ter entre 1 e 7 sessões.' })
      }

      const seenDays = {}
      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex]
        if (!day || typeof day !== 'object') {
          return e.json(400, { error: 'Sessão inválida na posição ' + (dayIndex + 1) + '.' })
        }
        if (VALID_DAYS.indexOf(day.day_of_week) === -1) {
          return e.json(400, { error: 'day_of_week inválido na sessão ' + (dayIndex + 1) + '.' })
        }
        if (seenDays[day.day_of_week]) {
          return e.json(400, { error: 'Há mais de uma sessão para o mesmo dia.' })
        }
        seenDays[day.day_of_week] = true
        if (VALID_TYPES.indexOf(day.workout_type) === -1) {
          return e.json(400, { error: 'workout_type inválido na sessão ' + (dayIndex + 1) + '.' })
        }

        const exList = day.exercises
        if (!Array.isArray(exList) || exList.length < 1 || exList.length > 12) {
          return e.json(400, {
            error: 'Cada sessão deve ter entre 1 e 12 exercícios.',
          })
        }

        for (let i = 0; i < exList.length; i++) {
          const item = exList[i]
          if (!item || typeof item !== 'object') {
            return e.json(400, { error: 'Exercício inválido na sessão ' + (dayIndex + 1) + '.' })
          }
          if (typeof item.name !== 'string' || !item.name.trim()) {
            return e.json(400, { error: 'name é obrigatório no exercício ' + (i + 1) + '.' })
          }
          if (VALID_MUSCLES.indexOf(item.muscle_group) === -1) {
            return e.json(400, { error: 'muscle_group inválido no exercício ' + (i + 1) + '.' })
          }
          if (VALID_EQUIP.indexOf(item.equipment) === -1) {
            return e.json(400, { error: 'equipment inválido no exercício ' + (i + 1) + '.' })
          }
          if (VALID_DIFF.indexOf(item.difficulty) === -1) {
            return e.json(400, { error: 'difficulty inválido no exercício ' + (i + 1) + '.' })
          }
          if (typeof item.instructions !== 'string' || !item.instructions.trim()) {
            return e.json(400, {
              error: 'instructions é obrigatório no exercício ' + (i + 1) + '.',
            })
          }
          if (typeof item.sets !== 'number' || item.sets < 1 || item.sets > 10) {
            return e.json(400, { error: 'sets inválido no exercício ' + (i + 1) + '.' })
          }
          if (typeof item.reps !== 'string' || !item.reps.trim()) {
            return e.json(400, { error: 'reps inválido no exercício ' + (i + 1) + '.' })
          }
          if (typeof item.rest_time !== 'number' || item.rest_time < 0 || item.rest_time > 600) {
            return e.json(400, { error: 'rest_time inválido no exercício ' + (i + 1) + '.' })
          }
        }
      }

      const resultIds = []
      $app.runInTransaction((txApp) => {
        const workoutsCol = txApp.findCollectionByNameOrId('workouts')
        const exercisesCol = txApp.findCollectionByNameOrId('exercises')
        const workoutExercisesCol = txApp.findCollectionByNameOrId('workout_exercises')

        for (const day of days) {
          const workout = new Record(workoutsCol)
          workout.set('user_id', userId)
          workout.set(
            'title',
            typeof day.title === 'string' && day.title.trim()
              ? day.title.trim()
              : payload.title + ' — ' + DAY_LABELS[day.day_of_week],
          )
          workout.set(
            'description',
            typeof day.description === 'string' && day.description.trim()
              ? day.description.trim()
              : typeof payload.description === 'string' && payload.description.trim()
                ? payload.description.trim()
                : 'Sessão prescrita pelo Coach IA.',
          )
          workout.set('goal', payload.goal)
          workout.set('days_per_week', days.length)
          workout.set('status', 'pendente')
          workout.set('day_of_week', day.day_of_week)
          workout.set('workout_type', day.workout_type)
          txApp.save(workout)
          resultIds.push(workout.id)

          for (let i = 0; i < day.exercises.length; i++) {
            const item = day.exercises[i]
            let exRecord
            try {
              exRecord = txApp.findFirstRecordByData('exercises', 'name', item.name)
            } catch (_) {
              exRecord = new Record(exercisesCol)
              exRecord.set('name', item.name)
              exRecord.set('muscle_group', item.muscle_group)
              exRecord.set('equipment', item.equipment)
              exRecord.set('difficulty', item.difficulty)
              exRecord.set('instructions', item.instructions)
              txApp.save(exRecord)
            }

            const workoutExercise = new Record(workoutExercisesCol)
            workoutExercise.set('workout_id', workout.id)
            workoutExercise.set('exercise_id', exRecord.id)
            workoutExercise.set('sets', Number(item.sets))
            workoutExercise.set('reps', String(item.reps))
            workoutExercise.set('rest_time', Number(item.rest_time))
            workoutExercise.set('sort_order', i + 1)
            txApp.save(workoutExercise)
          }
        }

        const txDraft = txApp.findFirstRecordByData('coach_drafts', 'id', draftId)
        txDraft.set('status', 'confirmado')
        txApp.save(txDraft)
      })

      return e.json(200, {
        id: resultIds[0],
        ids: resultIds,
        type: 'workout',
        sessions: resultIds.length,
      })
    } catch (err) {
      const msg = err && err.message ? err.message : 'Erro ao publicar a semana de treinos.'
      return e.json(500, { error: msg })
    }
  },
  $apis.requireAuth(),
)
