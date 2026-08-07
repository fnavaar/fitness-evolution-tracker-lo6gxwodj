/// <reference path="../pb_data/types.d.ts" />
// Corrige o coach para chamar o usuário pelo nome REAL.
// Lê o systemPrompt atual do registro (definido em 0010 e preservado em
// 0011/0012) e acrescenta uma instrução sobre usar o nome do atleta.
// Redefine o agente com tools + memory completos (o define substitui
// tools/memories quando presentes) preservando tier e persona "Coach Rocha".
migrate(
  (app) => {
    const current = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = current.getString('system_prompt')

    const NAME_MARKER = 'NOME DO ATLETA'
    if (systemPrompt.indexOf(NAME_MARKER) === -1) {
      systemPrompt =
        systemPrompt +
        `\n\nNOME DO ATLETA\n- Sempre que o contexto da conversa incluir uma linha "Nome do atleta: X", use ESSE nome (X) para se dirigir ao usuário de forma pessoal e motivadora.\n- NUNCA invente um nome. Se o contexto não trouxer o nome do atleta, trate o usuário como "atleta" ou pergunte como prefere ser chamado.\n- Mantenha a persona "Coach Rocha" (nome, tom e identidade) — apenas o nome do atleta muda.`
    }

    $ai.agents.define(app, {
      slug: 'fitness-coach',
      name: 'Coach IA',
      description:
        'Agente principal de treinamento, saúde física e educação em hábitos do EvolutFit. Personaliza exercícios, progressão, recuperação e orientação geral baseada em evidências.',
      tier: 'reasoning',
      systemPrompt,
      tools: [
        {
          name: 'profiles',
          collection: 'profiles',
          perms: { list: true, view: true },
          description:
            'Perfil do usuário: objetivo, peso, altura, nível de atividade, frequência, preferências e restrições.',
        },
        {
          name: 'progress',
          collection: 'progress',
          perms: { list: true, view: true },
          description: 'Histórico de peso, medidas e percentual de gordura do próprio usuário.',
        },
        {
          name: 'workouts',
          collection: 'workouts',
          perms: { list: true, view: true },
          description: 'Planos de treino, objetivo, frequência e status do próprio usuário.',
        },
        {
          name: 'workout_exercises',
          collection: 'workout_exercises',
          perms: { list: true, view: true },
          description: 'Exercícios dos planos: séries, repetições, descanso e instruções.',
        },
        {
          name: 'workout_logs',
          collection: 'workout_logs',
          perms: { list: true, view: true },
          description: 'Histórico de execução, cargas, repetições, séries, esforço e aderência.',
        },
        {
          name: 'diets',
          collection: 'diets',
          perms: { list: true, view: true },
          description: 'Planos alimentares do próprio usuário, apenas para contextualização.',
        },
        {
          name: 'recipes',
          collection: 'recipes',
          perms: { list: true, view: true },
          description: 'Biblioteca de receitas e informações nutricionais disponíveis no produto.',
        },
        {
          name: 'exercises',
          collection: 'exercises',
          perms: { list: true, view: true },
          description:
            'Biblioteca de exercícios, padrões de movimento, equipamentos, dificuldade e instruções.',
        },
      ],
      memory: [
        {
          type: 'url',
          payload: { url: 'https://www.who.int/publications/i/item/9789240015128' },
        },
        {
          type: 'url',
          payload: {
            url: 'https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-exercitar/documentos/pdf/guia_atividade_fisica_populacao_brasileira.pdf',
          },
        },
        {
          type: 'url',
          payload: { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/' },
        },
        {
          type: 'url',
          payload: { url: 'https://www.cdc.gov/sleep/about/index.html' },
        },
        {
          type: 'url',
          payload: { url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
        },
        {
          type: 'url',
          payload: { url: 'https://www.who.int/health-topics/healthy-diet' },
        },
        {
          type: 'url',
          payload: {
            url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional',
          },
        },
        {
          type: 'url',
          payload: { url: 'https://eparmedx.com/?page_id=75' },
        },
        {
          type: 'url',
          payload: { url: 'https://pubmed.ncbi.nlm.nih.gov/37752011/' },
        },
        {
          type: 'url',
          payload: { url: 'https://www.ncbi.nlm.nih.gov/books/NBK459157/' },
        },
        {
          type: 'url',
          payload: { url: 'https://acsm.org/monitoring-aerobic-exercise-intensity' },
        },
        {
          type: 'text',
          payload: {
            text: 'Método de decisão do Coach IA: primeiro segurança e triagem; depois objetivo, capacidade e contexto; em seguida prescrição mínima eficaz; depois progressão por desempenho; por fim revisão por aderência, sintomas, sono, esforço e tendência de peso. Uma estimativa não deve ser apresentada como medição.',
          },
        },
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Quantas calorias máximas devo ingerir por dia?',
                answer:
                  'Não existe uma máxima universal. Estime o gasto de repouso e a manutenção com incerteza, defina o objetivo e recalibre pela tendência de peso, desempenho, fome, sono e saúde. Para dietas individualizadas, encaminhe ao nutricionista.',
              },
              {
                question: 'Quantas calorias devo queimar no treino?',
                answer:
                  'Não use uma meta fixa de calorias queimadas. Prescreva atividade por saúde, condicionamento, força, função e aderência, pois relógios e aparelhos estimam o gasto com erro.',
              },
              {
                question: 'Quanto devo dormir?',
                answer:
                  'Adultos devem dormir pelo menos 7 horas; para a maioria, 7 a 9 horas é uma faixa prática, ajustada por idade, qualidade do sono, rotina e sintomas.',
              },
              {
                question: 'O que fazer se sentir dor durante o exercício?',
                answer:
                  'Pare o exercício doloroso. Dor aguda, intensa, crescente, irradiada ou acompanhada de falta de ar, tontura, desmaio ou dor no peito exige avaliação profissional e pode exigir atendimento urgente.',
              },
              {
                question: 'Os outros agentes podem mudar o treino?',
                answer:
                  'Não devem contradizer a prescrição, as restrições de segurança ou os alertas do Coach IA. Alterações relevantes exigem nova avaliação do perfil, histórico, recuperação e objetivo.',
              },
            ],
          },
        },
      ],
    })
  },
  (app) => {},
)
