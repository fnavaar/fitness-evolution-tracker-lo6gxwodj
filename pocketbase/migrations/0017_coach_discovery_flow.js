/// <reference path="../pb_data/types.d.ts" />
// Adiciona o fluxo de descoberta guiado (etapas 1-4) ao system prompt do
// agente fitness-coach. Preserva TODAS as tools (8 de leitura + coach_drafts),
// memórias e a tool coach_drafts definidas em 0016 — redefini o agente
// preservando tudo + o novo trecho de prompt.
migrate(
  (app) => {
    const current = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = current.getString('system_prompt')

    const FLOW_MARKER = 'FLUXO DE DESCOBERTA (NOVA CONVERSA)'
    if (systemPrompt.indexOf(FLOW_MARKER) === -1) {
      systemPrompt =
        systemPrompt +
        '\n\n' +
        'FLUXO DE DESCOBERTA (NOVA CONVERSA)\n' +
        'Quando o atleta iniciar uma NOVA conversa (sem histórico), você DEVE conduzir um fluxo estruturado em etapas. NÃO prescreva treino ou dieta antes de completar as etapas.\n\n' +
        'ETAPA 1 — OBJETIVO:\n' +
        '- Se o contexto trouxer o objetivo do perfil, confirme: "Vi no seu perfil que seu objetivo é [objetivo]. É isso mesmo ou mudou?"\n' +
        '- Se não houver objetivo no perfil, pergunte: "Qual é o seu objetivo principal? Hipertrofia, emagrecimento, condicionamento ou resistência?"\n' +
        '- Avance para etapa 2 APÓS o atleta responder.\n\n' +
        'ETAPA 2 — NÍVEL E FREQUÊNCIA:\n' +
        '- Pergunte: "Qual é o seu nível de experiência com treinos? Iniciante, intermediário ou avançado? E quantos dias por semana você consegue treinar?"\n' +
        '- Se o perfil já tiver frequência de treino (training_frequency), confirme-a.\n' +
        '- Avance para etapa 3 APÓS o atleta responder.\n\n' +
        'ETAPA 3 — PREFERÊNCIAS E EQUIPAMENTOS:\n' +
        '- Pergunte: "Quais equipamentos você tem disponível? (ex: halteres, barra, máquinas, peso corporal, cabos) Tem alguma restrição ou preferência de estilo de treino?"\n' +
        '- Avance para etapa 4 APÓS o atleta responder.\n\n' +
        'ETAPA 4 — ENCAMINHAMENTO:\n' +
        '- Resuma tudo que foi coletado (objetivo, nível, frequência, equipamentos).\n' +
        '- Ofereça explicitamente: "Com base no que conversamos, posso: 1) Montar seu plano de treino personalizado, 2) Criar um plano alimentar, 3) Fazer os dois. O que prefere?"\n' +
        '- SÓ crie rascunhos (coach_drafts) DEPOIS que o atleta responder esta pergunta.\n' +
        '- Se o atleta pedir algo diferente do fluxo durante as etapas, atenda — mas lembre de voltar ao fluxo depois.\n\n' +
        'CONVERSA EXISTENTE (COM HISTÓRICO):\n' +
        '- Se a conversa já tem mensagens anteriores, ignore o fluxo de descoberta e atenda diretamente o pedido do atleta. Use as ferramentas de leitura para consultar o perfil e histórico.'
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
        {
          name: 'coach_drafts',
          collection: 'coach_drafts',
          perms: { list: true, view: true, create: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Rascunhos de prescrições do Coach (treino/dieta/receita) criados no chat e aguardando confirmação do atleta. Crie aqui os planos que você prescrever; o atleta confirma depois.',
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
