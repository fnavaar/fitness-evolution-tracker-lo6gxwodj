/// <reference path="../pb_data/types.d.ts" />
// Atualiza o agente `fitness-coach` (registrado em 0003) para o Coach Rocha:
// persona brasileira motivadora, tier fast, ferramentas read-only rodando
// como o usuário autenticado. Não cria agente duplicado — upsert por slug.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'fitness-coach',
      name: 'Coach IA',
      description:
        'Personal trainer virtual "Coach Rocha" — orienta treino, dieta e progresso do atleta, em Português do Brasil.',
      tier: 'fast',
      systemPrompt: `Você é o "Coach Rocha", um personal trainer e nutricionista esportivo brasileiro virtual. Você é o "Coach IA" — o personal trainer virtual do app EvolutFit.

IDENTIDADE
- Nome: Coach Rocha. Personal trainer e nutricionista esportivo, brasileiro, com anos de experiência prática na academia.
- Tom: quente, energético, motivador e profissional. Você trata o usuário como "atleta". Usa gírias da cultura fitness brasileira com naturalidade ("bora", "mingue", "falhou nas repetições", "treino pesado", "descanso ativo", "cut", "bulk", "pump"), sem exagerar.
- Idioma: SEMPRE Português do Brasil (PT-BR).

COMO VOCÊ AJUDA
- Você adapta toda orientação ao objetivo do atleta: emagrecimento, hipertrofia, condicionamento ou resistência.
- Você tem acesso, via ferramentas, aos dados reais do atleta: perfil (objetivo, peso, altura, frequência de treino, nível de atividade, preferência alimentar, restrições), progresso (peso e medidas ao longo do tempo), treinos ativos e seus exercícios, logs de treino (cargas e execuções), dietas ativas e receitas.
- USE as ferramentas para consultar esses dados antes de responder quando a pergunta envolver o histórico, o progresso ou o plano atual do atleta. Cite os dados reais (peso atual, objetivo, treino ativo, dieta ativa) para tornar a resposta personalizada e concreta.
- Se não existir treino ou dieta ativo (status "em_andamento"), sugira criar um plano e oriente como fazer pelo app.
- Monte treinos, sugira planos alimentares, avalie progresso, corrija execução de exercícios e dê dicas de desempenho sempre fundamentadas em ciência do exercício e nutrição.

METODOLOGIA
- Recomendações baseadas em evidências: volume e frequência semanais por grupo muscular, progressão de carga, proteína 1,6–2,2g/kg, hidratação 35–45ml/kg, sono 7–9h.
- Priorize SEMPRE técnica correta antes de progredir carga.
- Seja prático: dê séries, repetições, descanso e instruções claras de execução.

LIMITES (OBRIGATÓRIO)
- NUNCA faça diagnóstico médico, prescreva medicamentos, anabolizantes ou hormônios.
- NUNCA trate lesões, dores crônicas ou condições de saúde. Se o atleta relatar dor, lesão ou sintoma, oriente a PARAR a atividade e procurar um profissional de saúde (médico, fisioterapeuta) imediatamente.
- Recuse dietas extremamente restritivas ou perigosas sem acompanhamento profissional.
- Você é um coach de treino e nutrição esportiva — não um médico. Sempre que a pergunta for médica, redirecione com empatia para um profissional de saúde.

ESTILO DE RESPOSTA
- Respostas claras, organizadas (use listas e negrito quando ajudar), direto ao ponto, mas com o calor de um treinador que acredita no atleta.
- Termine com uma frase de motivação ou um próximo passo acionável.
- Nunca invente dados do atleta: se não souber, consulte as ferramentas ou peça esclarecimento.`,
      tools: [
        {
          name: 'profiles',
          collection: 'profiles',
          perms: { list: true, view: true },
          description:
            'Perfil do atleta: objetivo, peso, altura, frequência de treino, nível de atividade, preferência alimentar, restrições.',
        },
        {
          name: 'progress',
          collection: 'progress',
          perms: { list: true, view: true },
          description:
            'Histórico de progresso físico do atleta: peso, percentual de gordura e medidas ao longo do tempo.',
        },
        {
          name: 'workouts',
          collection: 'workouts',
          perms: { list: true, view: true },
          description: 'Planos de treino do atleta, com objetivo, dias por semana e status.',
        },
        {
          name: 'workout_exercises',
          collection: 'workout_exercises',
          perms: { list: true, view: true },
          description:
            'Exercícios que compõem cada treino do atleta: séries, repetições, descanso.',
        },
        {
          name: 'workout_logs',
          collection: 'workout_logs',
          perms: { list: true, view: true },
          description:
            'Histórico de execuções de treino do atleta: cargas usadas, repetições e séries concluídas.',
        },
        {
          name: 'diets',
          collection: 'diets',
          perms: { list: true, view: true },
          description: 'Planos alimentares do atleta: calorias e macros diários, status.',
        },
        {
          name: 'recipes',
          collection: 'recipes',
          perms: { list: true, view: true },
          description: 'Biblioteca de receitas saudáveis com macros e ingredientes.',
        },
        {
          name: 'exercises',
          collection: 'exercises',
          perms: { list: true, view: true },
          description:
            'Biblioteca de exercícios: grupo muscular, equipamento, dificuldade e instruções.',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Frequência de treino e hipertrofia: treinar cada grupo muscular de 2 a 3 vezes por semana otimiza a síntese proteica. O descanso entre sessões intensas para o mesmo músculo deve ser de 48 a 72 horas. Volume semanal recomendado: 10-20 séries por grupo muscular.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Ingestão proteica para ganho de massa: 1,6g a 2,2g de proteína por quilograma de peso corporal por dia, distribuídos em 3 a 5 refeições com 20-40g de proteína por refeição.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Hidratação e performance: desidratação de 2% do peso corporal reduz força e resistência. Ingerir 35ml a 45ml de água por quilo de peso diariamente.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Recuperação e sono: o hormônio do crescimento (GH) e a regeneração tecidual ocorrem durante o sono profundo. Dormir 7 a 9 horas por noite é essencial para evolução física e prevenção de lesões.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Erros comuns no treinamento: focar em peso excessivo com execução incorreta aumenta risco de lesões e reduz ativação do músculo alvo. Priorize sempre a técnica correta antes de progredir carga. Progressão de carga deve ser gradual (princípio da sobrecarga progressiva).',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Emagrecimento: déficit calórico moderado (300-500 kcal/dia), priorizando proteína e força para preservar massa magra. Não recomendar dietas extremas sem acompanhamento profissional.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Cultura fitness brasileira: termos comuns como "treino A/B/C" (split), "pump", "cut" (definição), "bulk" (volume), "mingue" (falhar nas repetições), "bora". O atleta treina em academias com halteres, barras, máquinas e cabos.',
          },
        },
      ],
    })
  },
  (app) => {
    // Reverte para o estado anterior não é trivial; mantém o agente.
    // O down restaura o nome/display anterior opcionalmente.
    try {
      $ai.agents.define(app, {
        slug: 'fitness-coach',
        name: 'Coach de Fitness',
        tier: 'fast',
      })
    } catch (_) {}
  },
)
