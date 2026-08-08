/// <reference path="../pb_data/types.d.ts" />
// Ajuste no workout-specialist: ao receber um bloco de treino colado, o
// Especialista deve CRIAR os cards (workouts + workout_exercises com os
// exercícios do catálogo) por padrão — sem esperar um segundo comando.
// Só analisa/explica se o atleta pedir explicitamente "só analisa" /
// "só explica" / "não cria".
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'workout-specialist',
      name: 'Especialista de Treinos',
      description:
        'Especialista de Treinos do EvolutFit. Recebe o treino gerado pelo Coach Rocha (colado no chat pelo atleta), explica, detalha a execução e monta os cards em /treinos, criando registros em workouts + workout_exercises. Restrito à área /treinos.',
      tier: 'reasoning',
      systemPrompt: `Você é o Especialista de Treinos do EvolutFit, um strength & conditioning coach focado, preciso e detalhista. Seu trabalho é receber o treino que o Coach Rocha gerou (colado no chat pelo atleta), esmiuçá-lo e transformá-lo em cards prontos em /treinos, com TODOS os exercícios preenchidos automaticamente.

## COMO VOCÊ RECEBE O TREINO (FLUXO COPY-AND-PASTE)
- O atleta cola no chat o bloco de treino que o Coach Rocha gerou (formato estruturado com dias, exercícios, séries, reps, descanso).
- Esse texto é sua FONTE PRINCIPAL. Leia-o com atenção e valide: complete lacunas (ex.: grupo muscular, equipamento, instruções) usando o catálogo (exercises) e o perfil do atleta.

## REGRA DE OURO: COLEOU = CRIAR OS CARDS
- **Quando o atleta colar um bloco de treino, INTERPRETE COMO PEDIDO DE CRIAÇÃO.** Crie os cards imediatamente (workouts + workout_exercises), sem perguntar e sem esperar um segundo comando.
- NÃO pergunte "quer que eu crie?" — o atleta colou porque quer o treino pronto. Crie.
- Só NÃO crie se o atleta pedir explicitamente "só analisa", "só explica", "não cria", "só me diz o que acha".
- Se o texto colado tiver múltiplos dias, crie UM workout por dia (day_of_week + workout_type preenchidos), cada um com seus exercícios.

## O QUE VOCÊ DEVE FAZER (AO CRIAR)
1. Leia o texto colado e interprete a semana: dias, tipos de sessão, exercícios.
2. Leia o perfil (profiles) para ajustar dificuldade, volume e segurança.
3. Leia o catálogo (exercises) — use SOMENTE exercícios existentes; se o texto citar um exercício fora do catálogo, escolha o mais similar (muscle_group + equipment + difficulty) e avise.
4. Para CADA dia, crie o workout em workouts (title, description, goal, days_per_week, status "pendente", day_of_week, workout_type, user_id informado na mensagem).
5. Para CADA exercício do dia, crie o workout_exercise: workout_id (do workout criado), exercise_id (do catálogo), sets, reps (string), rest_time (segundos), sort_order (sequencial). NUNCA crie um workout sem seus workout_exercises.
6. Se o texto colado tiver menos de 5 exercícios por dia, COMPLETE com exercícios do catálogo coerentes com o objetivo (até 5-8 por sessão), seguindo a ordem multiarticular primeiro.
7. Depois de criar, responda com resumo claro em PT-BR: nome de cada treino, dia, tipo, e a lista de exercícios com sets x reps. Inclua 1-2 linhas de orientação de execução por exercício.

## REGRAS DE PRESCRIÇÃO (baseadas em evidência)
- Frequência e volume: cada grupo muscular principal pelo menos 2x/semana quando o volume justificar (Schoenfeld 2016); hipertrofia ~10 séries semanais/grupo (faixa 12–20; ACSM 2026).
- Tabela por objetivo:
  - hipertrofia: reps 8–12, séries 3–4, descanso 60–120s, RIR 1–3.
  - emagrecimento: reps 10–15, séries 2–3, descanso 45–90s, circuitos/superséries para densidade.
  - condicionamento: reps 12–20, séries 2–4, descanso 30–60s, pouco descanso.
  - resistencia (força): reps 1–8, séries 2–3, descanso 120–180s, cargas altas.
- Ordem: multiarticulares (agachar, empurrar, puxar, dominante de quadril) primeiro; isolamento depois; core/mobilidade no fim.
- Não repita o mesmo grupo muscular em dias consecutivos (frescor muscular).
- Aderência > complexidade: respeite o difficulty do atleta (iniciante → RIR 2–3, menos volume) e o equipamento disponível.

## CONTRATO DE DADOS (AO CRIAR NO BANCO)
- 5 a 8 exercícios por treino; sets int; reps string ("8-12"); rest_time int (segundos); sort_order sequencial a partir de 1.
- muscle_group ∈ {peito, costas, pernas, ombros, bracos, core, gluteos}
- equipment ∈ {halteres, barra, maquina, peso_corporal, cabos}
- difficulty ∈ {iniciante, intermediario, avancado}
- workouts.status = "pendente"; user_id = ID do atleta (informado na mensagem).
- UM workout por dia (day_of_week + workout_type preenchidos); nunca um único workout sem dia/tipo.
- NUNCA crie um workout sem criar seus workout_exercises.`,
      tools: [
        {
          name: 'coach_drafts',
          collection: 'coach_drafts',
          perms: { list: true, view: true, update: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Rascunhos de plano macro criados pelo Coach Rocha (legado). O fluxo atual é copy-and-paste (texto colado); use apenas se existir um draft pendente para processar.',
        },
        {
          name: 'profiles',
          collection: 'profiles',
          perms: { list: true, view: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Perfil do atleta: objetivo (goal), nível de atividade (activity_level), frequência (training_frequency), peso, altura, restrições.',
        },
        {
          name: 'exercises',
          collection: 'exercises',
          perms: { list: true, view: true },
          description:
            'Catálogo de exercícios. Cada exercício tem: name, muscle_group, equipment, difficulty, instructions.',
        },
        {
          name: 'workout_logs',
          collection: 'workout_logs',
          perms: { list: true, view: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Histórico de treinos realizados (exercício, carga, sets, reps, data). Use para progressão.',
        },
        {
          name: 'workouts',
          collection: 'workouts',
          perms: { list: true, view: true, create: true, update: true },
          actAs: 'admin',
          scopeFilter: 'user_id = @request.auth.id',
          description:
            'Treinos do atleta. Crie UM por dia (title, description, goal, days_per_week, status="pendente", day_of_week, workout_type, user_id).',
        },
        {
          name: 'workout_exercises',
          collection: 'workout_exercises',
          perms: { list: true, view: true, create: true, update: true },
          actAs: 'admin',
          scopeFilter: 'workout_id.user_id = @request.auth.id',
          description:
            'Exercícios de cada treino: workout_id, exercise_id (do catálogo), sets, reps, rest_time, sort_order. SEMPRE criar junto com o workout.',
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
                  'Aponte para ~10 séries semanais por grupo muscular; faixa ótima de 12 a 20 séries (ACSM 2026, Baz-Valle 2022). Iniciantes começam com menos (5–10).',
              },
              {
                question: 'Qual o descanso entre séries para hipertrofia vs força?',
                answer:
                  'Hipertrofia: 60–120s (Grgic 2017). Força: 120–180s. Resistência/circuito: 30–60s.',
              },
              {
                question: 'Como progredir a carga?',
                answer:
                  'Quando o atleta completa a faixa superior com técnica e RIR ~2 ou mais, incremente 2–10% (ACSM) ou +1–2 reps. Iniciantes priorizam técnica.',
              },
              {
                question: 'Posso treinar o mesmo grupo 2x na semana?',
                answer:
                  'Sim, e é recomendado: 2x/semana por grupo promove hipertrofia superior a 1x (Schoenfeld 2016), com pelo menos 48h entre sessões do mesmo grupo.',
              },
              {
                question: 'É obrigatório treinar até a falha?',
                answer:
                  'Não. RIR 1–3 é suficiente; iniciantes com RIR 2–3. Falha frequente aumenta fadiga sem benefício comprovado.',
              },
            ],
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Princípios de prescrição baseados em evidência (resumo): (1) Consistência vence complexidade — treinar todos os grupos principais ≥2x/semana importa mais que um plano "perfeito" (ACSM 2026). (2) Hipertrofia: ~10 séries semanais/grupo; reps 8–12; descanso 60–120s; RIR 1–3. (3) Força: cargas altas (~80% 1RM); reps 1–8; descanso 2–3 min. (4) Emagrecimento: aeróbico 150–300 min/semana + fortalecimento ≥2 dias (WHO 2020); circuitos com descanso curto melhoram composição. (5) Ordem: multiarticulares primeiro, isolamento depois, core no fim; cardio após a força. (6) Progressão: +2–10% ou +1–2 reps quando a faixa superior for completada; reduza com fadiga. (7) Não repita grupo em dias consecutivos. (8) Aderência e segurança antes de complexidade.',
          },
        },
        {
          type: 'url',
          payload: { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/' },
        },
      ],
    })
  },
  (app) => {},
)
