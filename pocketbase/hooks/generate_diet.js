routerAdd('POST', '/backend/v1/generate-diet', (e) => {
  const info = e.requestInfo()
  if (!info.auth) {
    return e.json(401, { error: 'Não autorizado.' })
  }

  const userId = info.auth.id
  const body = info.body || {}
  const goal = body.goal || 'hipertrofia'
  const calories = Number(body.calories || 2200)
  const preference = body.preference || 'onivoro'

  const prompt = `Crie um plano alimentar em formato JSON rigoroso para um usuário com objetivo "${goal}", meta de ${calories} kcal/dia e preferência alimentar "${preference}".
Responda EXATAMENTE e APENAS com um objeto JSON válido sem formatação markdown, no seguinte formato:
{
  "title": "Nome descritivo da dieta em PT-BR",
  "description": "Detalhamento das refeições principais (Café da manhã, Almoço, Lanche, Jantar) e opções recomendadas em PT-BR",
  "protein": 150,
  "carbs": 250,
  "fat": 60
}
Calcule os macronutrientes em gramas ajustados para somar aproximadamente ${calories} kcal (1g proteína = 4kcal, 1g carboidrato = 4kcal, 1g gordura = 9kcal).`

  const response = $ai.chat(
    [
      {
        role: 'system',
        content:
          'Você é um gerador de dietas nutricionais em formato JSON rigoroso. Responda apenas com o JSON.',
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
    return e.json(500, { error: 'Erro ao processar dieta gerada pela IA.' })
  }

  const dietsCol = $app.findCollectionByNameOrId('diets')
  const diet = new Record(dietsCol)
  diet.set('user_id', userId)
  diet.set('title', plan.title || 'Dieta Personalizada IA')
  diet.set(
    'description',
    plan.description || 'Dieta calculada por IA com divisão balanceada de macronutrientes.',
  )
  diet.set('goal', goal)
  diet.set('daily_calories', calories)
  diet.set('protein', Number(plan.protein || Math.round((calories * 0.3) / 4)))
  diet.set('carbs', Number(plan.carbs || Math.round((calories * 0.45) / 4)))
  diet.set('fat', Number(plan.fat || Math.round((calories * 0.25) / 9)))
  $app.save(diet)

  return e.json(200, { id: diet.id })
})
