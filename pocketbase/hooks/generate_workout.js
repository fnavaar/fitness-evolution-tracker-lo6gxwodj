routerAdd('POST', '/backend/v1/generate-workout', (e) => {
  const info = e.requestInfo()
  if (!info.auth) {
    return e.json(401, { error: 'Não autorizado.' })
  }

  const userId = info.auth.id
  const body = info.body || {}
  const goal = body.goal || 'hipertrofia'
  const daysPerWeek = Number(body.daysPerWeek || 4)

  const prompt = `Crie um plano de treino em formato JSON rigoroso para um usuário com objetivo de "${goal}" treinando ${daysPerWeek} dias por semana.
Responda EXATAMENTE e APENAS com um objeto JSON válido sem formatação markdown em volta, no seguinte formato:
{
  "title": "Nome descritivo do plano em PT-BR",
  "description": "Breve explicação da metodologia do treino em PT-BR",
  "exercises": [
    {
      "name": "Nome do exercício em PT-BR",
      "muscle_group": "peito" | "costas" | "pernas" | "ombros" | "bracos" | "core" | "gluteos",
      "equipment": "halteres" | "barra" | "maquina" | "peso_corporal" | "cabos",
      "difficulty": "iniciante" | "intermediario" | "avancado",
      "instructions": "Instruções passo a passo de execução em PT-BR",
      "sets": 4,
      "reps": "8-12",
      "rest_time": 60
    }
  ]
}
Inclua entre 5 e 8 exercícios variados e focados no objetivo.`

  const response = $ai.chat(
    [
      {
        role: 'system',
        content:
          'Você é um gerador de treinos em formato JSON rigoroso. Responda apenas com o JSON.',
      },
      { role: 'user', content: prompt },
    ],
    { model: 'fast' },
  )

  let plan
  try {
    let cleanText = response.text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim()
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim()
    }
    plan = JSON.parse(cleanText)
  } catch (err) {
    return e.json(500, { error: 'Erro ao processar plano gerado pela IA.' })
  }

  const workoutsCol = $app.findCollectionByNameOrId('workouts')
  const exercisesCol = $app.findCollectionByNameOrId('exercises')
  const workoutExercisesCol = $app.findCollectionByNameOrId('workout_exercises')

  const workout = new Record(workoutsCol)
  workout.set('user_id', userId)
  workout.set('title', plan.title || 'Treino Personalizado IA')
  workout.set('description', plan.description || 'Treino gerado por Inteligência Artificial.')
  workout.set('goal', goal)
  workout.set('days_per_week', daysPerWeek)
  $app.save(workout)

  const exList = plan.exercises || []
  for (let i = 0; i < exList.length; i++) {
    const item = exList[i]
    let exRecord
    try {
      exRecord = $app.findFirstRecordByData('exercises', 'name', item.name)
    } catch (_) {
      exRecord = new Record(exercisesCol)
      exRecord.set('name', item.name)
      exRecord.set('muscle_group', item.muscle_group || 'pernas')
      exRecord.set('equipment', item.equipment || 'halteres')
      exRecord.set('difficulty', item.difficulty || 'intermediario')
      exRecord.set('instructions', item.instructions || 'Execute com técnica e foco na contração.')
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

  return e.json(200, { id: workout.id })
})
