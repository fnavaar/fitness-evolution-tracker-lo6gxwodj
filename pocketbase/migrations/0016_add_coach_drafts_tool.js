/// <reference path="../pb_data/types.d.ts" />
// Adiciona a tool de escrita `coach_drafts` ao agente fitness-coach e
// instrui o Coach sobre prescrição de treinos dentro do chat (Fase 1).
// Lê o system_prompt, tools e memory atuais do registro _agents e
// redefini o agente preservando tudo + a nova tool.
migrate(
  (app) => {
    const current = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = current.getString('system_prompt')

    const PRESC_MARKER = 'PRESCRIÇÃO DENTRO DO CHAT (FASE 1 — TREINOS)'
    if (systemPrompt.indexOf(PRESC_MARKER) === -1) {
      systemPrompt =
        systemPrompt +
        '\n\n' +
        'PRESCRIÇÃO DENTRO DO CHAT (FASE 1 — TREINOS)\n' +
        '- Quando o atleta pedir explicitamente um plano de treino, siga o método de ensino e a triagem obrigatória e depois crie EXATAMENTE UM rascunho usando a ferramenta coach_drafts (create), com type "workout" e payload no formato abaixo. NÃO despeje o plano completo em JSON no texto: apresente um resumo claro (objetivo, frequência, divisão dos dias, princípios-chave) e avise que o plano está aguardando confirmação.\n' +
        '- Crie no máximo um rascunho de treino pendente por vez. Se já houver um rascunho com status "proposta" para este atleta (liste coach_drafts), não crie outro: retome aquele ou peça para o atleta descartá-lo.\n' +
        '- NÃO crie rascunhos em conversa casual (perguntas sobre execução, motivação, nutrição geral, sono etc.). Apenas quando houver pedido de prescrição de treino.\n' +
        '- Formato exato do payload do rascunho (campo payload, JSON):\n' +
        '{\n' +
        '  "title": "Título curto e descritivo em PT-BR",\n' +
        '  "description": "Explicação da metodologia em PT-BR",\n' +
        '  "goal": "hipertrofia" | "emagrecimento" | "condicionamento" | "resistencia",\n' +
        '  "days_per_week": 3,\n' +
        '  "exercises": [\n' +
        '    {\n' +
        '      "name": "Nome do exercício em PT-BR",\n' +
        '      "muscle_group": "peito" | "costas" | "pernas" | "ombros" | "bracos" | "core" | "gluteos",\n' +
        '      "equipment": "halteres" | "barra" | "maquina" | "peso_corporal" | "cabos",\n' +
        '      "difficulty": "iniciante" | "intermediario" | "avancado",\n' +
        '      "instructions": "Passo a passo de execução em PT-BR",\n' +
        '      "sets": 4,\n' +
        '      "reps": "8-12",\n' +
        '      "rest_time": 60\n' +
        '    }\n' +
        '  ]\n' +
        '}\n' +
        '- Use os enums EXATAMENTE como acima (mesmos valores das collections do projeto). Inclua de 5 a 8 exercícios, coerentes com objetivo, nível, equipamentos e tempo disponível do atleta. Todos os campos são obrigatórios em cada exercício: name, muscle_group, equipment, difficulty, instructions, sets (int), reps (string), rest_time (int, segundos).'
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
