/// <reference path="../pb_data/types.d.ts" />
// Corrige o problema do Especialista de Treinos NÃO vincular exercícios.
//
// CAUSA RAIZ: o scopeFilter relacional `workout_id.user_id = @request.auth.id`
// da tool `workout_exercises` não pode ser avaliado no momento do create pelo
// agente, então a tool falha silenciosamente e os exercícios nunca persistem.
//
// SOLUÇÃO: trocar "agente chama tools de create" por "agente gera JSON
// estruturado + hook materializa tudo atomicamente" (mesmo padrão do
// generate_workout.js, que funciona). Remove as tools `workouts` e
// `workout_exercises` (create via API falha) e mantém apenas as tools de
// LEITURA: coach_drafts, profiles, exercises, workout_logs. O novo system
// prompt instrui o agente a responder com um JSON estruturado, que os hooks
// workout_specialist_process.js / workout_specialist_cron.js materializam em
// workouts + workout_exercises dentro de $app.runInTransaction.
//
// Mantém as 3 memórias RAG (faq + text + url) e tier 'reasoning'.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'workout-specialist',
      name: 'Especialista de Treinos',
      description:
        'Especialista de Treinos do EvolutFit. Analisa o plano macro do Coach Rocha e produz um plano de treino completo e detalhado em JSON estruturado, que o backend materializa atomicamente em workouts + workout_exercises. Restrito à área /treinos.',
      tier: 'reasoning',
      systemPrompt:
        `Você é o Especialista de Treinos do EvolutFit. Seu trabalho é analisar o plano macro do Coach Rocha e produzir um plano de treino completo e detalhado.

## SEU PROCESSO
1. Leia o coach_draft (type="workout", status="proposta") do atleta
2. Leia o perfil do atleta (profiles) — objetivo, nível, restrições, peso, altura
3. Leia o catálogo de exercícios (exercises) para selecionar os mais adequados
4. Leia o histórico (workout_logs) para calibrar progressão
5. Produza sua resposta EXATAMENTE neste formato (substitua os placeholders):

` +
        '```json' +
        `
{
  "draft_action": "confirm",
  "workouts": [
    {
      "title": "Nome do treino em PT-BR",
      "description": "Metodologia e objetivos em PT-BR",
      "goal": "hipertrofia",
      "days_per_week": 4,
      "day_of_week": "segunda",
      "workout_type": "upper",
      "exercises": [
        {
          "name": "Supino Reto com Barra",
          "muscle_group": "peito",
          "equipment": "barra",
          "difficulty": "intermediario",
          "instructions": "Deitado no banco, segure a barra...",
          "sets": 4,
          "reps": "8-12",
          "rest_time": 90
        }
      ]
    }
  ]
}
` +
        '```' +
        `

## REGRAS DO JSON
- workouts: array de 1 a 7 treinos (um por dia da semana que o Coach prescreveu)
- exercises: 5 a 8 exercícios por treino
- goal: "hipertrofia" | "emagrecimento" | "condicionamento" | "resistencia"
- day_of_week: "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo"
- workout_type: "full_body" | "upper" | "lower" | "legs" | "push" | "pull" | "cardio" | "mobilidade" | "core"
- muscle_group: "peito" | "costas" | "pernas" | "ombros" | "bracos" | "core" | "gluteos"
- equipment: "halteres" | "barra" | "maquina" | "peso_corporal" | "cabos"
- difficulty: "iniciante" | "intermediario" | "avancado"
- sets: número inteiro. reps: string ("8-12"). rest_time: número inteiro (segundos)
- Use SOMENTE exercícios que existem no catálogo (exercises). Se um exercício ideal não existir, escolha o mais similar por nome/muscle_group.
- Siga as regras de prescrição baseadas em evidência (ACSM 2026, Schoenfeld): hipertrofia reps 8-12/descanso 60-120s, emagrecimento reps 10-15/descanso 45-90s, etc.
- O JSON DEVE ser a ÚLTIMA coisa na sua resposta, após um breve resumo em PT-BR do plano.`,
      tools: [
        {
          name: 'coach_drafts',
          collection: 'coach_drafts',
          perms: { list: true, view: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Rascunhos de plano macro criados pelo Coach Rocha. Leia os drafts com type="workout" e status="proposta" para gerar treinos.',
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
      ],
      memory: [
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Quantas séries por grupo muscular por semana para hipertrofia?',
                answer:
                  'Aponte para ~10 séries semanais por grupo muscular como referência; a faixa ótima é de 12 a 20 séries (ACSM 2026, Baz-Valle 2022). Iniciantes podem começar com menos (5–10) e progredir.',
              },
              {
                question: 'Qual o descanso entre séries para hipertrofia vs força?',
                answer:
                  'Hipertrofia: 60–120s entre séries (Grgic 2017). Força: 120–180s (2–3 min) para cargas altas. Resistência/circuito: 30–60s.',
              },
              {
                question: 'Como progredir a carga de um exercício?',
                answer:
                  'Quando o atleta completa a faixa superior de repetições com técnica adequada e esforço controlado (RIR ~2 ou mais), incremente a carga em 2–10% (ACSM 2009) ou adicione 1–2 reps. Iniciantes priorizam técnica antes de subir carga.',
              },
              {
                question: 'Posso treinar o mesmo grupo muscular 2x na semana?',
                answer:
                  'Sim, e é recomendado: treinar cada grupo muscular pelo menos 2x/semana promove hipertrofia superior a 1x (Schoenfeld 2016). Distribua o volume semanal em 2 ou mais sessões, com pelo menos 48h entre sessões do mesmo grupo.',
              },
              {
                question: 'É obrigatório treinar até a falha muscular?',
                answer:
                  'Não. Esforço próximo da falha (RIR 1–3) é suficiente para hipertrofia e força. Para iniciantes, prefira margem de segurança (RIR 2–3). Falha frequente aumenta fadiga sem benefício adicional comprovado.',
              },
            ],
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Princípios de prescrição baseados em evidência (resumo operacional): (1) Consistência vence complexidade — treinar todos os grupos musculares principais pelo menos 2x por semana importa mais que um plano "perfeito" (ACSM 2026). (2) Hipertrofia: ~10 séries semanais por grupo muscular; reps 8–12; descanso 60–120s; RIR 1–3. (3) Força: cargas altas (~80% 1RM); reps 1–8; descanso 2–3 min; RIR 1–2. (4) Potência: 30–70% 1RM com concêntrico rápido. (5) Emagrecimento: exercício aeróbico 150–300 min/semana + fortalecimento ≥2 dias/semana (WHO 2020); treino resistido preserva massa magra; circuitos com descanso curto melhoram composição corporal. (6) Ordem: multiarticulares primeiro, isolamento depois, core/mobilidade no fim; cardio depois da força na mesma sessão. (7) Progressão: +2–10% de carga ou +1–2 reps quando a faixa superior for completada com técnica e RIR adequado; reduza volume com queda de desempenho ou fadiga. (8) Não repita o mesmo grupo muscular em dias consecutivos (frescor muscular). (9) Split e full-body são equivalentes com volume igualado — a divisão serve à aderência. (10) Aderência e segurança vêm antes de complexidade; respeite o nível do atleta e o equipamento disponível.',
          },
        },
        {
          type: 'url',
          payload: {
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/',
          },
        },
      ],
    })
  },
  (app) => {
    // rollback: restaura o agente com tools de create (0033).
    try {
      $ai.agents.define(app, {
        slug: 'workout-specialist',
        name: 'Especialista de Treinos',
        description:
          'Especialista de Treinos do EvolutFit. Aprofunda o plano macro de treino criado pelo Coach Rocha em um treino completo e executável, criando registros diretamente em workouts + workout_exercises. Restrito à área /treinos.',
        tier: 'reasoning',
        systemPrompt:
          'Você é o Especialista de Treinos do EvolutFit. Seu trabalho é analisar o plano macro do Coach Rocha e produzir um plano de treino completo e detalhado.',
        tools: [],
        memory: [],
      })
    } catch (_) {
      console.log('Rollback 0041: falha ao restaurar agente workout-specialist')
    }
  },
)
