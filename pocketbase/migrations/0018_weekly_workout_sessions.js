/// <reference path="../pb_data/types.d.ts" />
// Evolui o fluxo de treinos do Coach para uma semana com sessões separadas
// por dia e tipo. O draft continua sendo o handoff interno do agente; o
// frontend confirma automaticamente após o turno concluído.
migrate(
  (app) => {
    const workouts = app.findCollectionByNameOrId('workouts')

    if (!workouts.fields.getByName('day_of_week')) {
      workouts.fields.add(
        new SelectField({
          name: 'day_of_week',
          required: false,
          values: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
          maxSelect: 1,
        }),
      )
    }

    if (!workouts.fields.getByName('workout_type')) {
      workouts.fields.add(
        new SelectField({
          name: 'workout_type',
          required: false,
          values: [
            'full_body',
            'upper',
            'lower',
            'push',
            'pull',
            'legs',
            'cardio',
            'mobilidade',
            'core',
          ],
          maxSelect: 1,
        }),
      )
    }

    app.save(workouts)

    const agent = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = agent.getString('system_prompt')
    const marker = 'SEMANA DE TREINOS COM PUBLICAÇÃO AUTOMÁTICA (FASE 2)'

    if (systemPrompt.indexOf(marker) === -1) {
      systemPrompt +=
        '\n\n' +
        marker +
        '\n' +
        '- Depois que o atleta concluir as perguntas essenciais e escolher TREINO, monte a semana completa com uma sessão separada para cada dia de treino. Não diga que o plano ficará apenas como rascunho: o draft é um handoff interno e o app publica automaticamente as sessões após sua resposta.\n' +
        '- Use a ferramenta coach_drafts exatamente uma vez, com type "workout". Nunca crie um draft por exercício ou por dia.\n' +
        '- O payload DEVE seguir este formato: { "title": "...", "description": "...", "goal": "hipertrofia|emagrecimento|condicionamento|resistencia", "days_per_week": 3, "days": [{ "day_of_week": "segunda|terca|quarta|quinta|sexta|sabado|domingo", "workout_type": "full_body|upper|lower|push|pull|legs|cardio|mobilidade|core", "title": "...", "description": "Como executar e qual o foco da sessão.", "exercises": [{ "name": "...", "muscle_group": "peito|costas|pernas|ombros|bracos|core|gluteos", "equipment": "halteres|barra|maquina|peso_corporal|cabos", "difficulty": "iniciante|intermediario|avancado", "instructions": "Passo a passo de execução em PT-BR.", "sets": 3, "reps": "8-12", "rest_time": 60 }] }] }.\n' +
        '- Gere entre 1 e 7 sessões, exatamente para os dias informados pelo atleta. Se ele informar apenas a frequência, pergunte quais dias prefere antes de montar a semana. Cada sessão deve ter de 3 a 8 exercícios, um tipo claro e instruções práticas de execução.\n' +
        '- Na resposta textual, mostre o resumo da semana, os dias, o tipo de cada sessão e o próximo passo. Não use a palavra "rascunho" para o atleta e não peça uma segunda confirmação para publicar.\n' +
        '- Se faltar uma informação crítica, faça uma única pergunta objetiva e não crie a proposta ainda. Se houver dor, lesão, condição clínica ou sinal de alerta, priorize encaminhamento profissional e não gere treino automaticamente.\n' +
        '- Dietas e receitas continuam fora desta fase: não crie esses tipos até existir materialização específica para eles.'
      agent.set('system_prompt', systemPrompt)
      app.save(agent)
    }
  },
  (app) => {
    const workouts = app.findCollectionByNameOrId('workouts')
    const day = workouts.fields.getByName('day_of_week')
    if (day) workouts.fields.remove(day)
    const type = workouts.fields.getByName('workout_type')
    if (type) workouts.fields.remove(type)
    app.save(workouts)
  },
)
