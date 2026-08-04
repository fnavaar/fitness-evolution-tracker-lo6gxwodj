migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Seed User
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'navaar@adapta.org')
    } catch (_) {
      user = new Record(usersCol)
      user.setEmail('navaar@adapta.org')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Navaar Adapta')
      app.save(user)
    }

    // 2. Seed Profile
    const profilesCol = app.findCollectionByNameOrId('profiles')
    try {
      app.findFirstRecordByData('profiles', 'user_id', user.id)
    } catch (_) {
      const profile = new Record(profilesCol)
      profile.set('user_id', user.id)
      profile.set('goal', 'hipertrofia')
      profile.set('current_weight', 78)
      profile.set('height', 178)
      profile.set('birth_date', '1990-01-15 00:00:00.000Z')
      profile.set('activity_level', 'moderadamente_ativo')
      profile.set('training_frequency', 4)
      profile.set('dietary_preference', 'onivoro')
      profile.set('restrictions', 'Nenhuma restrição alimentar severa.')
      app.save(profile)
    }

    // 3. Seed Exercises
    const exercisesCol = app.findCollectionByNameOrId('exercises')
    const exerciseList = [
      {
        name: 'Agachamento Livre',
        muscle_group: 'pernas',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Posicione a barra sobre os trapézios. Mantenha os pés afastados na largura dos ombros, coluna ereta. Agache flexionando os joelhos e quadril até que as coxas fiquem paralelas ao chão. Retorne à posição inicial mantendo os calcanhares no chão.',
      },
      {
        name: 'Levantamento Terra',
        muscle_group: 'pernas',
        equipment: 'barra',
        difficulty: 'avancado',
        instructions:
          'Fique de pé com a barra sobre o meio dos pés. Flexione o quadril e joelhos para segurar a barra. Mantenha o peito aberto e as costas retas. Eleve a barra estendendo o quadril e joelhos simultaneamente.',
      },
      {
        name: 'Supino Reto',
        muscle_group: 'peito',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Deite-se no banco plano. Segure a barra com pegada ligeiramente mais larga que os ombros. Desça a barra suavemente até a linha do peito e empurre-a de volta para cima até a extensão quase completa dos braços.',
      },
      {
        name: 'Remada Curvada',
        muscle_group: 'costas',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Incline o tronco à frente a aproximadamente 45 graus, mantendo a coluna neutra e joelhos levemente flexionados. Puxe a barra em direção ao abdômen, contraindo as escápulas na subida.',
      },
      {
        name: 'Desenvolvimento Militar',
        muscle_group: 'ombros',
        equipment: 'barra',
        difficulty: 'intermediario',
        instructions:
          'Em pé ou sentado, apoie a barra no peitoral superior. Empurre a barra verticalmente para cima da cabeça até os braços estenderem. Controle a descida de volta à altura da clavícula.',
      },
      {
        name: 'Rosca Direta',
        muscle_group: 'bracos',
        equipment: 'barra',
        difficulty: 'iniciante',
        instructions:
          'Fique de pé segurando a barra com pegada supinada. Com os cotovelos fixos ao lado do corpo, flexione os cotovelos trazendo a barra até a altura dos ombros. Desça controlando o peso.',
      },
      {
        name: 'Tríceps Corda',
        muscle_group: 'bracos',
        equipment: 'cabos',
        difficulty: 'iniciante',
        instructions:
          'Na polia alta com acessório de corda, incline levemente o corpo à frente. Com os cotovelos fixos ao lado das costelas, estenda os braços para baixo abrindo as pontas da corda no final do movimento.',
      },
      {
        name: 'Prancha',
        muscle_group: 'core',
        equipment: 'peso_corporal',
        difficulty: 'iniciante',
        instructions:
          'Apoie os antebraços e as pontas dos pés no chão. Mantenha o corpo alinhado em linha reta da cabeça aos calcanhares. Contraia forte o abdômen e os glúteos mantendo a posição pelo tempo estipulado.',
      },
      {
        name: 'Afundo',
        muscle_group: 'pernas',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Segurando um halter em cada mão, dê um passo à frente. Flexione ambos os joelhos até formar um ângulo de 90 graus com a perna da frente. Retorne à posição inicial e alterne a perna.',
      },
      {
        name: 'Elevação Lateral',
        muscle_group: 'ombros',
        equipment: 'halteres',
        difficulty: 'iniciante',
        instructions:
          'Segure os halteres ao lado das coxas. Com os cotovelos levemente flexionados, eleve os braços lateralmente até a altura dos ombros. Desça de forma lenta e controlada.',
      },
    ]

    const createdExercisesMap = {}

    for (const exData of exerciseList) {
      let exRecord
      try {
        exRecord = app.findFirstRecordByData('exercises', 'name', exData.name)
      } catch (_) {
        exRecord = new Record(exercisesCol)
        exRecord.set('name', exData.name)
        exRecord.set('muscle_group', exData.muscle_group)
        exRecord.set('equipment', exData.equipment)
        exRecord.set('difficulty', exData.difficulty)
        exRecord.set('instructions', exData.instructions)
        app.save(exRecord)
      }
      createdExercisesMap[exData.name] = exRecord.id
    }

    // 4. Seed Recipes
    const recipesCol = app.findCollectionByNameOrId('recipes')
    const recipeList = [
      {
        name: 'Frango Grelhado com Arroz Integral',
        description:
          'Prato clássico fitness balanceado, rico em proteínas de alto valor biológico e carboidratos complexos.',
        category: 'almoco',
        ingredients: JSON.stringify([
          { name: 'Peito de frango limpo', quantity: '150g' },
          { name: 'Arroz integral cozido', quantity: '120g' },
          { name: 'Brócolis cozido ao vapor', quantity: '80g' },
          { name: 'Azeite de oliva extra virgem', quantity: '1 colher de chá (5ml)' },
          { name: 'Alho, sal e pimenta', quantity: 'A gosto' },
        ]),
        instructions:
          '1. Tempere o frango com alho, sal e pimenta.\n2. Aqueça uma frigideira antiaderente com azeite e grelhe o frango até dourar de ambos os lados.\n3. Sirva acompanhado do arroz integral e do brócolis temperado.',
        calories: 450,
        protein: 40,
        carbs: 45,
        fat: 12,
        prep_time: 25,
        servings: 1,
      },
      {
        name: 'Omelete de Claras com Espinafre',
        description: 'Refeição leve e altamente proteica, ideal para o café da manhã ou ceia.',
        category: 'cafe_da_manha',
        ingredients: JSON.stringify([
          { name: 'Claras de ovo', quantity: '4 unidades (120ml)' },
          { name: 'Ovo inteiro', quantity: '1 unidade' },
          { name: 'Folhas de espinafre frescas', quantity: '50g' },
          { name: 'Queijo cottage zero gordura', quantity: '30g' },
          { name: 'Sal e orégano', quantity: 'A gosto' },
        ]),
        instructions:
          '1. Bata as claras e o ovo em uma tigela com sal e temperos.\n2. Aqueça uma frigideira levemente untada e refogue o espinafre.\n3. Despeje os ovos batidos, adicione o cottage e dobre a omelete quando o centro estiver firme.',
        calories: 220,
        protein: 28,
        carbs: 6,
        fat: 8,
        prep_time: 10,
        servings: 1,
      },
      {
        name: 'Bowl de Quinoa com Legumes',
        description: 'Opção vegetariana repleta de fibras, micronutrientes e gorduras saudáveis.',
        category: 'almoco',
        ingredients: JSON.stringify([
          { name: 'Quinoa cozida', quantity: '150g' },
          { name: 'Grão-de-bico cozido', quantity: '80g' },
          { name: 'Abacate picado', quantity: '40g' },
          { name: 'Tomate-cereja e pepino', quantity: '100g' },
          { name: 'Azeite de oliva e limão', quantity: '1 colher de sopa' },
        ]),
        instructions:
          '1. Em uma tigela grande, disponha a quinoa como base.\n2. Adicione o grão-de-bico, o abacate, tomates e pepino em seções.\n3. Regue com o molho de azeite e limão e sirva gelado ou morno.',
        calories: 380,
        protein: 14,
        carbs: 58,
        fat: 10,
        prep_time: 20,
        servings: 2,
      },
      {
        name: 'Salada de Atum e Grãos',
        description: 'Jantar prático e refrescante com excelente perfil de ômega-3.',
        category: 'jantar',
        ingredients: JSON.stringify([
          { name: 'Atum em água escorrido', quantity: '1 lata (120g)' },
          { name: 'Feijão fradinho ou lentilha cozida', quantity: '100g' },
          { name: 'Folhas verdes mistas', quantity: '100g' },
          { name: 'Azeitonas pretas picadas', quantity: '4 unidades' },
        ]),
        instructions:
          '1. Misture o atum escorrido com os grãos escolhidos.\n2. Monte a base com as folhas verdes em um prato fundo.\n3. Cubra com a mistura de atum, decore com azeitonas e tempere com azeite e limão.',
        calories: 310,
        protein: 35,
        carbs: 10,
        fat: 12,
        prep_time: 12,
        servings: 1,
      },
      {
        name: 'Shake de Proteína com Banana',
        description: 'Shake pós-treino anabólico, de rápida absorção e excelente sabor.',
        category: 'shake',
        ingredients: JSON.stringify([
          { name: 'Whey Protein de Baunilha ou Chocolate', quantity: '30g' },
          { name: 'Banana prata madura', quantity: '1 unidade (100g)' },
          { name: 'Pasta de amendoim integral', quantity: '15g' },
          { name: 'Leite desnatado ou vegetal', quantity: '250ml' },
          { name: 'Gelo', quantity: '3 pedras' },
        ]),
        instructions:
          '1. Adicione todos os ingredientes no liquidificador.\n2. Bata na velocidade máxima por 60 segundos até obter uma consistência cremosa.\n3. Beba imediatamente após o treino.',
        calories: 320,
        protein: 30,
        carbs: 40,
        fat: 4,
        prep_time: 5,
        servings: 1,
      },
      {
        name: 'Iogurte com Granola e Frutas',
        description: 'Lanche proteico e crocante com probióticos para a saúde intestinal.',
        category: 'lanche',
        ingredients: JSON.stringify([
          { name: 'Iogurte grego natural desnatado', quantity: '170g' },
          { name: 'Granola sem açúcar', quantity: '30g' },
          { name: 'Morangos e mirtilos frescos', quantity: '80g' },
          { name: 'Mel de abelha', quantity: '1 colher de chá (opcional)' },
        ]),
        instructions:
          '1. Coloque o iogurte grego em um copo ou tigela.\n2. Monte camadas com a granola e as frutas picadas.\n3. Finalize com um fio de mel se desejar mais doçura.',
        calories: 280,
        protein: 15,
        carbs: 38,
        fat: 7,
        prep_time: 5,
        servings: 1,
      },
    ]

    for (const recData of recipeList) {
      try {
        app.findFirstRecordByData('recipes', 'name', recData.name)
      } catch (_) {
        const recipe = new Record(recipesCol)
        recipe.set('name', recData.name)
        recipe.set('description', recData.description)
        recipe.set('category', recData.category)
        recipe.set('ingredients', recData.ingredients)
        recipe.set('instructions', recData.instructions)
        recipe.set('calories', recData.calories)
        recipe.set('protein', recData.protein)
        recipe.set('carbs', recData.carbs)
        recipe.set('fat', recData.fat)
        recipe.set('prep_time', recData.prep_time)
        recipe.set('servings', recData.servings)
        app.save(recipe)
      }
    }

    // 5. Seed Progress for Navaar
    const progressCol = app.findCollectionByNameOrId('progress')
    const progressRecords = [
      {
        weight: 84.0,
        body_fat: 22.0,
        chest: 102,
        waist: 88,
        hip: 100,
        arm: 36,
        thigh: 56,
        notes: 'Início da jornada.',
        created: '2025-01-01 08:00:00.000Z',
      },
      {
        weight: 82.8,
        body_fat: 21.0,
        chest: 102,
        waist: 86,
        hip: 99,
        arm: 36.5,
        thigh: 56.5,
        notes: 'Primeira semana focada na dieta.',
        created: '2025-01-10 08:00:00.000Z',
      },
      {
        weight: 81.5,
        body_fat: 20.0,
        chest: 103,
        waist: 85,
        hip: 98,
        arm: 37,
        thigh: 57,
        notes: 'Cargas aumentando nos treinos.',
        created: '2025-01-20 08:00:00.000Z',
      },
      {
        weight: 80.2,
        body_fat: 18.8,
        chest: 104,
        waist: 83,
        hip: 97,
        arm: 37.5,
        thigh: 57.5,
        notes: 'Excelente definição abdominal aparecendo.',
        created: '2025-02-01 08:00:00.000Z',
      },
      {
        weight: 79.1,
        body_fat: 17.5,
        chest: 105,
        waist: 81,
        hip: 96,
        arm: 38,
        thigh: 58,
        notes: 'Ótima energia e disposição.',
        created: '2025-02-12 08:00:00.000Z',
      },
      {
        weight: 78.0,
        body_fat: 16.2,
        chest: 106,
        waist: 80,
        hip: 95,
        arm: 39,
        thigh: 59,
        notes: 'Meta atual atingida! Manter constância.',
        created: '2025-02-25 08:00:00.000Z',
      },
    ]

    try {
      const existing = app.findRecordsByFilter('progress', `user_id = '${user.id}'`, '', 1, 0)
      if (existing.length === 0) {
        for (const p of progressRecords) {
          const pr = new Record(progressCol)
          pr.set('user_id', user.id)
          pr.set('weight', p.weight)
          pr.set('body_fat', p.body_fat)
          pr.set('chest', p.chest)
          pr.set('waist', p.waist)
          pr.set('hip', p.hip)
          pr.set('arm', p.arm)
          pr.set('thigh', p.thigh)
          pr.set('notes', p.notes)
          pr.set('created', p.created)
          app.save(pr)
        }
      }
    } catch (_) {}

    // 6. Seed Workouts and Workout Exercises for Navaar
    const workoutsCol = app.findCollectionByNameOrId('workouts')
    const workoutExercisesCol = app.findCollectionByNameOrId('workout_exercises')
    let workoutId

    try {
      const existingW = app.findRecordsByFilter('workouts', `user_id = '${user.id}'`, '', 1, 0)
      if (existingW.length > 0) {
        workoutId = existingW[0].id
      } else {
        const workout = new Record(workoutsCol)
        workout.set('user_id', user.id)
        workout.set('title', 'Treino Foco em Hipertrofia & Força')
        workout.set(
          'description',
          'Programa de treino focado no ganho de massa magra e densidade muscular para 4 dias na semana.',
        )
        workout.set('goal', 'hipertrofia')
        workout.set('days_per_week', 4)
        app.save(workout)
        workoutId = workout.id

        // Add workout exercises
        const exToInclude = [
          { name: 'Agachamento Livre', sets: 4, reps: '8-10', rest_time: 90, sort_order: 1 },
          { name: 'Supino Reto', sets: 4, reps: '8-12', rest_time: 90, sort_order: 2 },
          { name: 'Remada Curvada', sets: 4, reps: '10-12', rest_time: 60, sort_order: 3 },
          { name: 'Desenvolvimento Militar', sets: 3, reps: '10', rest_time: 60, sort_order: 4 },
          { name: 'Rosca Direta', sets: 3, reps: '12', rest_time: 45, sort_order: 5 },
        ]

        for (const item of exToInclude) {
          const exId = createdExercisesMap[item.name]
          if (exId) {
            const we = new Record(workoutExercisesCol)
            we.set('workout_id', workoutId)
            we.set('exercise_id', exId)
            we.set('sets', item.sets)
            we.set('reps', item.reps)
            we.set('rest_time', item.rest_time)
            we.set('sort_order', item.sort_order)
            app.save(we)
          }
        }
      }
    } catch (_) {}

    // 7. Seed Workout Logs for Navaar
    const workoutLogsCol = app.findCollectionByNameOrId('workout_logs')
    try {
      const existingLogs = app.findRecordsByFilter(
        'workout_logs',
        `user_id = '${user.id}'`,
        '',
        1,
        0,
      )
      if (existingLogs.length === 0 && workoutId) {
        const logs = [
          {
            exName: 'Agachamento Livre',
            date: '2025-02-20 00:00:00.000Z',
            weight: 90,
            reps: 10,
            sets: 4,
            notes: 'Série pesada, joelhos firmes.',
          },
          {
            exName: 'Supino Reto',
            date: '2025-02-21 00:00:00.000Z',
            weight: 80,
            reps: 8,
            sets: 4,
            notes: 'Boa amplitude no peitoral.',
          },
          {
            exName: 'Remada Curvada',
            date: '2025-02-22 00:00:00.000Z',
            weight: 70,
            reps: 10,
            sets: 4,
            notes: 'Puxada consciente.',
          },
          {
            exName: 'Desenvolvimento Militar',
            date: '2025-02-24 00:00:00.000Z',
            weight: 50,
            reps: 10,
            sets: 3,
            notes: 'Ombros queimando no final.',
          },
          {
            exName: 'Agachamento Livre',
            date: '2025-02-26 00:00:00.000Z',
            weight: 95,
            reps: 8,
            sets: 4,
            notes: 'Recorde pessoal no agachamento!',
          },
        ]

        for (const l of logs) {
          const exId = createdExercisesMap[l.exName]
          if (exId) {
            const logRec = new Record(workoutLogsCol)
            logRec.set('user_id', user.id)
            logRec.set('workout_id', workoutId)
            logRec.set('exercise_id', exId)
            logRec.set('date', l.date)
            logRec.set('weight_used', l.weight)
            logRec.set('reps_completed', l.reps)
            logRec.set('sets_completed', l.sets)
            logRec.set('notes', l.notes)
            app.save(logRec)
          }
        }
      }
    } catch (_) {}
  },
  (app) => {
    // down function
  },
)
