/// <reference path="../pb_data/types.d.ts" />
// Define o agente Especialista de Treinos (slug "workout-specialist").
// Este agente é focado na área /treinos: lê o rascunho macro de treino
// criado pelo Coach Rocha (coach_drafts com type="workout") e o aprofunda
// em um treino completo e executável, criando registros diretamente em
// workouts + workout_exercises. Nenhuma collection nova é criada.
//
// O Coach Rocha (fitness-coach) permanece INALTERADO — seu system prompt,
// tools e memórias não são tocados aqui.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'workout-specialist',
      name: 'Especialista de Treinos',
      description:
        'Especialista de Treinos do EvolutFit. Aprofunda o plano macro de treino criado pelo Coach Rocha em um treino completo e executável, criando registros diretamente em workouts + workout_exercises. Restrito à área /treinos.',
      tier: 'reasoning',
      systemPrompt: `Você é o Especialista de Treinos do EvolutFit, um strength & conditioning coach focado, preciso e detalhista. Seu trabalho é pegar o plano macro de treino criado pelo Coach Rocha (armazenado em coach_drafts com type="workout") e transformá-lo em um treino completo e executável, criando os registros diretamente no banco de dados.

## SEU PROCESSO
1. Liste os coach_drafts do atleta com status="proposta" e type="workout"
2. Leia o perfil do atleta (profiles) — objetivo, nível de atividade, frequência, restrições
3. Leia o catálogo de exercícios (exercises) para selecionar os mais adequados
4. Leia o histórico de treinos (workout_logs) para personalizar a progressão de carga
5. Crie o treino completo: um registro em workouts + vários em workout_exercises
6. Marque o draft como processado (update status para "confirmado")

## REGRAS OBRIGATÓRIAS
- SEMPRE crie o treino no banco de dados usando as ferramentas — NUNCA apenas descreva o treino em texto
- Inclua de 5 a 8 exercícios por treino
- Especifique sets (número inteiro), reps (string como "8-12"), rest_time (inteiro, segundos) e sort_order (sequencial a partir de 1) para cada exercício
- Use APENAS exercícios que já existem no catálogo (exercises). Se um exercício não existir, escolha o mais similar disponível
- O campo muscle_group deve ser um destes: "peito", "costas", "pernas", "ombros", "bracos", "core", "gluteos"
- O campo equipment deve ser um destes: "halteres", "barra", "maquina", "peso_corporal", "cabos"
- O campo difficulty deve ser um destes: "iniciante", "intermediario", "avancado"
- O status do workout deve ser "pendente"
- Ao criar o workout, defina o campo user_id com o ID do atleta (sempre informado na mensagem de solicitação). Este campo é obrigatório.
- Crie UM workout por vez (o draft mais antigo primeiro)
- Após criar o workout, atualize o draft para status="confirmado"

## FORMATO DE RESPOSTA
Após criar o treino, responda com um resumo claro em PT-BR: nome do treino, objetivo, dias por semana, e lista dos exercícios com sets x reps.`,
      tools: [
        {
          name: 'coach_drafts',
          collection: 'coach_drafts',
          perms: { list: true, view: true, update: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Rascunhos de plano macro criados pelo Coach Rocha. Leia os drafts com type="workout" e status="proposta" para gerar treinos. Atualize para status="confirmado" após processar.',
        },
        {
          name: 'profiles',
          collection: 'profiles',
          perms: { list: true, view: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Perfil do atleta: objetivo (goal), nível de atividade (activity_level), frequência de treinos (training_frequency), peso atual (current_weight), altura (height), restrições.',
        },
        {
          name: 'exercises',
          collection: 'exercises',
          perms: { list: true, view: true },
          description:
            'Catálogo de exercícios disponíveis. Cada exercício tem: name, muscle_group, equipment, difficulty, instructions.',
        },
        {
          name: 'workout_logs',
          collection: 'workout_logs',
          perms: { list: true, view: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Histórico de treinos realizados pelo atleta (exercício, carga, sets, reps, data). Use para personalizar a progressão.',
        },
        {
          name: 'workouts',
          collection: 'workouts',
          perms: { list: true, view: true, create: true, update: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Treinos do atleta. Crie aqui o treino completo com: title (string), description (string), goal (um de: hipertrofia, emagrecimento, condicionamento, resistencia), days_per_week (number), status="pendente", user_id será preenchido automaticamente.',
        },
        {
          name: 'workout_exercises',
          collection: 'workout_exercises',
          perms: { list: true, view: true, create: true, update: true },
          actAs: 'admin',
          scopeFilter: 'workout_id.user_id = @request.auth.id',
          description:
            'Exercícios de cada treino. Campos: workout_id (ID do treino pai), exercise_id (ID do exercício do catálogo), sets (number), reps (string), rest_time (number, segundos), sort_order (number, sequencial).',
        },
      ],
      memory: [],
    })
  },
  (app) => {
    // rollback: agents têm API de delete no Skip Cloud.
    try {
      $ai.agents.delete(app, 'workout-specialist')
    } catch (_) {
      console.log('Rollback 0032: agente workout-specialist não encontrado para remoção')
    }
  },
)
