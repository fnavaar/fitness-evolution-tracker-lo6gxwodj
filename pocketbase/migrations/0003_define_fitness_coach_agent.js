migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'fitness-coach',
      name: 'Coach de Fitness',
      systemPrompt: `Você é o "Coach IA", um personal trainer e nutricionista esportivo brasileiro extremamente motivador, profissional e empático.
Você fala em Português do Brasil (PT-BR) de forma amigável, clara e baseada em evidências científicas.
Seu objetivo é orientar o usuário em sua jornada de hipertrofia, emagrecimento, condicionamento e saúde.

Regras de Conduta:
1. NUNCA faça diagnósticos médicos ou prescrições de medicamentos/esteroides.
2. Recuse dietas extremamente perigosas ou restritivas sem acompanhamento médico.
3. Personalize suas respostas utilizando os dados do usuário disponíveis.
4. Quando mencionar receitas ou exercícios específicos do sistema, descreva-os claramente.
5. Mantenha o tom sempre positivo, encorajador e prático!`,
      tools: [
        {
          name: 'profiles',
          collection: 'profiles',
          perms: { list: true, view: true },
          description: 'Ver perfil e objetivos do usuário',
        },
        {
          name: 'workouts',
          collection: 'workouts',
          perms: { list: true, view: true },
          description: 'Ver planos de treino do usuário',
        },
        {
          name: 'workout_exercises',
          collection: 'workout_exercises',
          perms: { list: true, view: true },
          description: 'Ver exercícios incluídos nos treinos',
        },
        {
          name: 'exercises',
          collection: 'exercises',
          perms: { list: true, view: true },
          description: 'Ver biblioteca de exercícios',
        },
        {
          name: 'diets',
          collection: 'diets',
          perms: { list: true, view: true },
          description: 'Ver planos de dieta do usuário',
        },
        {
          name: 'recipes',
          collection: 'recipes',
          perms: { list: true, view: true },
          description: 'Ver receitas e opções nutricionais',
        },
        {
          name: 'progress',
          collection: 'progress',
          perms: { list: true, view: true },
          description: 'Ver progresso físico e histórico de peso',
        },
        {
          name: 'workout_logs',
          collection: 'workout_logs',
          perms: { list: true, view: true },
          description: 'Ver histórico de cargas e execuções de treinos',
        },
      ],
      sources: [
        {
          title: 'Frequência de Treino e Hipertrofia',
          content:
            'Trabalhar cada grupo muscular de 2 a 3 vezes por semana otimiza a síntese proteica. O descanso entre sessões intensas para o mesmo músculo deve ser de 48 a 72 horas.',
        },
        {
          title: 'Ingestão Proteica para Ganho de Massa',
          content:
            'Para hipertrofia, recomenda-se entre 1,6g e 2,2g de proteína por quilograma de peso corporal por dia, distribuídos em 3 a 5 refeições com cerca de 20-40g de proteína por refeição.',
        },
        {
          title: 'Hidratação e Performance',
          content:
            'A desidratação de apenas 2% do peso corporal reduz a força e a resistência significativamente. Recomenda-se ingerir entre 35ml a 45ml de água por quilo de peso diariamente.',
        },
        {
          title: 'Recuperação e Sono',
          content:
            'O hormônio do crescimento (GH) e a regeneração tecidual ocorrem predominantemente durante o sono profundo. Dormir de 7 a 9 horas por noite é essencial para evolução física e prevenção de lesões.',
        },
        {
          title: 'Erros Comuns no Treinamento',
          content:
            'Focar em carregar peso excessivo com execução incorreta aumenta o risco de lesões e reduz a ativação do músculo alvo. Priorize sempre a técnica correta antes de progredir carga.',
        },
      ],
      model: 'fast',
    })
  },
  (app) => {
    try {
      $ai.agents.remove(app, 'fitness-coach')
    } catch (_) {}
  },
)
