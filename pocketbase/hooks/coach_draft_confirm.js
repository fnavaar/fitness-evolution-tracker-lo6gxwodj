// Confirmação de rascunho de prescrição do Coach IA.
// POST /backend/v1/coach/drafts/{id}/confirm  (auth obrigatório)
//
// Busca o draft, valida posse/estado/tipo, valida o payload e
// materializa em workouts + workout_exercises (padrão do
// generate_workout.js). Marca o draft como "confirmado".
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

      const status = draft.get('status') || ''
      if (status !== 'proposta') {
        return e.json(409, { error: 'Rascunho já processado.' })
      }

      const type = draft.get('type') || ''
      if (type !== 'workout') {
        return e.json(400, { error: 'Confirmação de dieta/receita ainda não disponível.' })
      }

      // --- Validação do payload ---
      const VALID_GOALS = ['hipertrofia', 'emagrecimento', 'condicionamento', 'resistencia']
      const VALID_MUSCLES = ['peito', 'costas', 'pernas', 'ombros', 'bracos', 'core', 'gluteos']
      const VALID_EQUIP = ['halteres', 'barra', 'maquina', 'peso_corporal', 'cabos']
      const VALID_DIFF = ['iniciante', 'intermediario', 'avancado']

      let payload
      try {
        payload = JSON.parse(draft.get('payload') || '{}')
      } catch (_) {
        return e.json(400, { error: 'Payload inválido.' })
      }

      if (!payload || typeof payload !== 'object') {
        return e.json(400, { error: 'Payload inválido.' })
      }
      if (typeof payload.title !== 'string' || !payload.title.trim()) {
        return e.json(400, { error: 'title é obrigatório.' })
      }
      if (VALID_GOALS.indexOf(payload.goal) === -1) {
        return e.json(400, { error: 'goal inválido.' })
      }
      if (typeof payload.days_per_week !== 'number' || payload.days_per_week < 1) {
        return e.json(400, { error: 'days_per_week inválido.' })
      }
      const exList = payload.exercises
      if (!Array.isArray(exList) || exList.length < 1 || exList.length > 12) {
        return e.json(400, { error: 'exercises deve ter entre 1 e 12 itens.' })
      }
      for (let i = 0; i < exList.length; i++) {
        const item = exList[i]
        if (!item || typeof item !== 'object') {
          return e.json(400, { error: 'Exercício inválido na posição ' + (i + 1) + '.' })
        }
        if (typeof item.name !== 'string' || !item.name.trim()) {
          return e.json(400, { error: 'name é obrigatório (exercício ' + (i + 1) + ').' })
        }
        if (VALID_MUSCLES.indexOf(item.muscle_group) === -1) {
          return e.json(400, { error: 'muscle_group inválido (exercício ' + (i + 1) + ').' })
        }
        if (VALID_EQUIP.indexOf(item.equipment) === -1) {
          return e.json(400, { error: 'equipment inválido (exercício ' + (i + 1) + ').' })
        }
        if (VALID_DIFF.indexOf(item.difficulty) === -1) {
          return e.json(400, { error: 'difficulty inválido (exercício ' + (i + 1) + ').' })
        }
        if (typeof item.instructions !== 'string' || !item.instructions.trim()) {
          return e.json(400, { error: 'instructions é obrigatório (exercício ' + (i + 1) + ').' })
        }
        if (typeof item.sets !== 'number' || item.sets < 1) {
          return e.json(400, { error: 'sets inválido (exercício ' + (i + 1) + ').' })
        }
        if (typeof item.reps !== 'string' || !item.reps.trim()) {
          return e.json(400, { error: 'reps inválido (exercício ' + (i + 1) + ').' })
        }
        if (typeof item.rest_time !== 'number' || item.rest_time < 0) {
          return e.json(400, { error: 'rest_time inválido (exercício ' + (i + 1) + ').' })
        }
      }

      // --- Materialização (padrão generate_workout.js) ---
      const workoutsCol = $app.findCollectionByNameOrId('workouts')
      const exercisesCol = $app.findCollectionByNameOrId('exercises')
      const workoutExercisesCol = $app.findCollectionByNameOrId('workout_exercises')

      const workout = new Record(workoutsCol)
      workout.set('user_id', userId)
      workout.set('title', payload.title || 'Treino do Coach')
      workout.set(
        'description',
        typeof payload.description === 'string' && payload.description.trim()
          ? payload.description
          : 'Treino prescrito pelo Coach Rocha no chat.',
      )
      workout.set('goal', payload.goal)
      workout.set('days_per_week', payload.days_per_week)
      workout.set('status', 'pendente')
      $app.save(workout)

      for (let i = 0; i < exList.length; i++) {
        const item = exList[i]
        let exRecord
        try {
          exRecord = $app.findFirstRecordByData('exercises', 'name', item.name)
        } catch (_) {
          exRecord = new Record(exercisesCol)
          exRecord.set('name', item.name)
          exRecord.set('muscle_group', item.muscle_group)
          exRecord.set('equipment', item.equipment)
          exRecord.set('difficulty', item.difficulty)
          exRecord.set(
            'instructions',
            item.instructions || 'Execute com técnica e foco na contração.',
          )
          $app.save(exRecord)
        }

        const we = new Record(workoutExercisesCol)
        we.set('workout_id', workout.id)
        we.set('exercise_id', exRecord.id)
        we.set('sets', Number(item.sets || 3))
        we.set('reps', String(item.reps || '10-12'))
        we.set('rest_time', Number(item.rest_time || 60))
        we.set('sort_order', i + 1)
        $app.save(we)
      }

      // Marca o draft como confirmado.
      draft.set('status', 'confirmado')
      $app.save(draft)

      return e.json(200, { id: workout.id, type: 'workout' })
    } catch (err) {
      const msg = err && err.message ? err.message : 'Erro ao confirmar rascunho.'
      return e.json(500, { error: msg })
    }
  },
  $apis.requireAuth(),
)
