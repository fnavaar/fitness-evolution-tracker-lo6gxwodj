/// <reference path="../pb_data/types.d.ts" />
// Reforça o roteamento das prescrições do Coach.
// Prescrições são planos e devem ser materializadas em workouts;
// workout_logs permanece reservado para registrar sessões já executadas.
migrate(
  (app) => {
    const agent = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = agent.getString('system_prompt')
    const marker = 'ROTEAMENTO DAS PRESCRIÇÕES DO COACH'

    if (systemPrompt.indexOf(marker) === -1) {
      systemPrompt +=
        '\n\n' +
        marker +
        '\n' +
        '- workouts é a coleção de planos de treino prescritos. Toda prescrição feita pelo Coach deve terminar publicada ali.\n' +
        '- workout_logs é exclusivamente o histórico de sessões já realizadas e registradas pelo atleta. Nunca use essa coleção para criar, editar ou armazenar um plano prescrito.\n' +
        '- Para uma nova prescrição, use a ferramenta coach_drafts; o aplicativo valida a proposta e a materializa em workouts e workout_exercises.\n' +
        '- Se a publicação automática falhar, informe apenas que o plano está disponível para validação em Meus Treinos. Nunca diga que ele foi enviado para workout_logs.'
      agent.set('system_prompt', systemPrompt)
      app.save(agent)
    }
  },
  (app) => {},
)
