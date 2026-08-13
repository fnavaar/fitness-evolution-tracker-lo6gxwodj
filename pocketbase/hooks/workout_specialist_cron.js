// Processamento automático de coach_drafts pendentes pelo Especialista de Treinos.
// Roda via cron (fora do request HTTP). A cada 2 minutos, busca drafts de
// workout com status "proposta" e dispara o workout-specialist para produzir
// um JSON estruturado, que este hook materializa atomicamente em workouts +
// workout_exercises dentro de $app.runInTransaction.
//
// PADRÃO: o agente NÃO cria registros via tools (o scopeFilter relacional da
// tool workout_exercises não pode ser avaliado no create). O agente responde
// com JSON e o hook faz o save (mesmo padrão do generate_workout.js).
//
// NOTA: PocketBase JSVM roda callbacks em VM separada — toda a lógica fica
// DENTRO do callback (sem funções/variáveis top-level referenciadas).
cronAdd('process-pending-workout-drafts', '*/2 * * * *', () => {
  try {
    const drafts = $app.findRecordsByFilter(
      'coach_drafts',
      'type = "workout" && status = "proposta"',
      '-created',
      0,
      50,
    )

    if (drafts.length === 0) {
      return
    }

    console.log('[workout-specialist-cron] drafts pendentes:', drafts.length)

    const validDays = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
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
    const validGoals = ['hipertrofia', 'emagrecimento', 'condicionamento', 'resistencia']
    const validGroups = ['peito', 'costas', 'pernas', 'ombros', 'bracos', 'core', 'gluteos']
    const validEquip = ['halteres', 'barra', 'maquina', 'peso_corporal', 'cabos']
    const validDiff = ['iniciante', 'intermediario', 'avancado']

    for (const draft of drafts) {
      const draftId = draft.id
      const userId = draft.get('user_id') || ''
      if (!userId) {
        console.log('[workout-specialist-cron] draft ' + draftId + ' sem user_id, pulando')
        continue
      }

      let payload = {}
      try {
        const raw = draft.get('payload')
        payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
      } catch (_) {
        payload = {}
      }

      // --- Chama o agente para produzir o JSON estruturado ---
      let content = ''
      try {
        const iter = $ai.agent('workout-specialist').chat({
          user_id: userId,
          message:
            'Processe o coach_draft com ID ' +
            draftId +
            '. O plano macro do Coach Rocha contém: ' +
            JSON.stringify(payload) +
            '. Use os exercícios do catálogo. Se o payload tiver o campo "days", gere UM workout por dia, preenchendo day_of_week e workout_type. Responda em PT-BR com um breve resumo e, ao final, o bloco JSON no formato pedido.',
          stream: false,
        })
        content = (iter && iter.content ? String(iter.content) : '') || ''
      } catch (err) {
        const status = (err && err.status) || 0
        const msg = (err && err.message) || String(err)
        const gwKeySet = !!$os.getenv('SKIP_AI_GATEWAY_API_KEY')
        const gwUrlSet = !!$os.getenv('SKIP_AI_GATEWAY_URL')
        console.error(
          '[workout-specialist-cron] falha ao chamar agente draft ' +
            draftId +
            ': status=' +
            status +
            ' msg=' +
            msg +
            ' gateway_key_set=' +
            gwKeySet +
            ' gateway_url_set=' +
            gwUrlSet,
        )
        // Mantém o draft como proposta — próximo ciclo retenta.
        continue
      }

      // --- Extrai o último bloco ```json ... ``` da resposta ---
      let plan = null
      try {
        const fence = String.fromCharCode(96).repeat(3)
        const text = content || ''
        let start = text.lastIndexOf(fence + 'json')
        let fenceStart = start >= 0 ? start + (fence + 'json').length : -1
        if (fenceStart < 0) {
          start = text.lastIndexOf(fence)
          fenceStart = start >= 0 ? start + fence.length : -1
        }
        if (fenceStart < 0) {
          const braceStart = text.lastIndexOf('{')
          if (braceStart >= 0) {
            plan = JSON.parse(text.substring(braceStart))
          }
        } else {
          const closeFence = text.indexOf(fence, fenceStart)
          const jsonText =
            closeFence >= 0 ? text.substring(fenceStart, closeFence) : text.substring(fenceStart)
          plan = JSON.parse(jsonText.trim())
        }
      } catch (err) {
        console.error(
          '[workout-specialist-cron] draft ' +
            draftId +
            ' falha ao parsear JSON: ' +
            ((err && err.message) || String(err)),
        )
        continue
      }

      if (!plan || typeof plan !== 'object') {
        console.error('[workout-specialist-cron] draft ' + draftId + ' JSON inválido (vazio)')
        continue
      }

      const workoutsArr = Array.isArray(plan.workouts) ? plan.workouts : []
      if (workoutsArr.length === 0) {
        console.error('[workout-specialist-cron] draft ' + draftId + ' sem workouts no JSON')
        continue
      }

      // --- Materializa atomicamente ---
      let workoutCount = 0
      let exerciseLinkCount = 0
      try {
        $app.runInTransaction((txApp) => {
          const txWorkoutsCol = txApp.findCollectionByNameOrId('workouts')
          const txExercisesCol = txApp.findCollectionByNameOrId('exercises')
          const txWorkoutExercisesCol = txApp.findCollectionByNameOrId('workout_exercises')
          const txDraftsCol = txApp.findCollectionByNameOrId('coach_drafts')

          const daysPerWeek = workoutsArr.length

          for (let wi = 0; wi < workoutsArr.length; wi++) {
            const w = workoutsArr[wi] || {}
            const exercises = Array.isArray(w.exercises) ? w.exercises : []
            if (exercises.length === 0) continue

            const goal = validGoals.indexOf(w.goal) >= 0 ? w.goal : 'hipertrofia'
            const dayOfWeek =
              validDays.indexOf(w.day_of_week) >= 0 ? w.day_of_week : validDays[wi % 7]
            const workoutType =
              validTypes.indexOf(w.workout_type) >= 0 ? w.workout_type : 'full_body'

            const workout = new Record(txWorkoutsCol)
            workout.set('user_id', userId)
            workout.set('title', w.title || 'Treino ' + dayOfWeek)
            workout.set(
              'description',
              w.description || 'Treino gerado pelo Especialista de Treinos.',
            )
            workout.set('goal', goal)
            workout.set('days_per_week', daysPerWeek)
            workout.set('status', 'pendente')
            workout.set('day_of_week', dayOfWeek)
            workout.set('workout_type', workoutType)
            txApp.save(workout)
            workoutCount++

            for (let ei = 0; ei < exercises.length; ei++) {
              const item = exercises[ei] || {}
              const exName = (item.name || '').toString().trim()
              if (!exName) continue

              let exercise
              try {
                exercise = txApp.findFirstRecordByData('exercises', 'name', exName)
              } catch (_) {
                exercise = new Record(txExercisesCol)
                exercise.set('name', exName)
                exercise.set(
                  'muscle_group',
                  validGroups.indexOf(item.muscle_group) >= 0 ? item.muscle_group : 'pernas',
                )
                exercise.set(
                  'equipment',
                  validEquip.indexOf(item.equipment) >= 0 ? item.equipment : 'peso_corporal',
                )
                exercise.set(
                  'difficulty',
                  validDiff.indexOf(item.difficulty) >= 0 ? item.difficulty : 'intermediario',
                )
                exercise.set('instructions', item.instructions || 'Execute com técnica e controle.')
                txApp.save(exercise)
              }

              const link = new Record(txWorkoutExercisesCol)
              link.set('workout_id', workout.id)
              link.set('exercise_id', exercise.id)
              link.set('sets', Number(item.sets || 3))
              link.set('reps', String(item.reps || '8-12'))
              link.set('rest_time', Number(item.rest_time || 60))
              link.set('sort_order', ei + 1)
              txApp.save(link)
              exerciseLinkCount++
            }
          }

          // Atualiza o draft para status="confirmado".
          const updatedDraft = new Record(txDraftsCol)
          updatedDraft.id = draftId
          updatedDraft.set('status', 'confirmado')
          txApp.save(updatedDraft)
        })
      } catch (err) {
        console.error(
          '[workout-specialist-cron] draft ' +
            draftId +
            ' falha na transação: ' +
            ((err && err.message) || String(err)),
        )
        // Mantém o draft como proposta — próximo ciclo retenta.
        continue
      }

      console.log(
        '[workout-specialist-cron] draft ' +
          draftId +
          ' materializado: ' +
          workoutCount +
          ' workouts, ' +
          exerciseLinkCount +
          ' exercícios vinculados',
      )
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err)
    console.error('[workout-specialist-cron] erro geral: ' + msg)
  }
})
