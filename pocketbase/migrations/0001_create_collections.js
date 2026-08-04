migrate(
  (app) => {
    // 1. profiles
    const profiles = new Collection({
      name: 'profiles',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'goal',
          type: 'select',
          required: true,
          values: ['emagrecimento', 'hipertrofia', 'condicionamento', 'resistencia'],
          maxSelect: 1,
        },
        { name: 'current_weight', type: 'number', required: true },
        { name: 'height', type: 'number', required: true },
        { name: 'birth_date', type: 'date', required: true },
        {
          name: 'activity_level',
          type: 'select',
          required: true,
          values: ['sedentario', 'levemente_ativo', 'moderadamente_ativo', 'muito_ativo'],
          maxSelect: 1,
        },
        { name: 'training_frequency', type: 'number', required: true, min: 1, max: 7 },
        {
          name: 'dietary_preference',
          type: 'select',
          required: true,
          values: ['onivoro', 'vegetariano', 'vegano'],
          maxSelect: 1,
        },
        { name: 'restrictions', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_profiles_user_id ON profiles (user_id)'],
    })
    app.save(profiles)

    // 2. exercises
    const exercises = new Collection({
      name: 'exercises',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'muscle_group',
          type: 'select',
          required: true,
          values: ['peito', 'costas', 'pernas', 'ombros', 'bracos', 'core', 'gluteos'],
          maxSelect: 1,
        },
        {
          name: 'equipment',
          type: 'select',
          required: true,
          values: ['halteres', 'barra', 'maquina', 'peso_corporal', 'cabos'],
          maxSelect: 1,
        },
        {
          name: 'difficulty',
          type: 'select',
          required: true,
          values: ['iniciante', 'intermediario', 'avancado'],
          maxSelect: 1,
        },
        { name: 'instructions', type: 'text', required: true },
        { name: 'image', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'vector', type: 'vector', dimensions: 1536 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group)'],
    })
    app.save(exercises)

    // 3. workouts
    const workouts = new Collection({
      name: 'workouts',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'goal',
          type: 'select',
          required: true,
          values: ['emagrecimento', 'hipertrofia', 'condicionamento', 'resistencia'],
          maxSelect: 1,
        },
        { name: 'days_per_week', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_workouts_user_id ON workouts (user_id)'],
    })
    app.save(workouts)

    // 4. workout_exercises
    const workoutIdCol = app.findCollectionByNameOrId('workouts').id
    const exerciseIdCol = app.findCollectionByNameOrId('exercises').id

    const workout_exercises = new Collection({
      name: 'workout_exercises',
      type: 'base',
      listRule: 'workout_id.user_id = @request.auth.id',
      viewRule: 'workout_id.user_id = @request.auth.id',
      createRule: 'workout_id.user_id = @request.auth.id',
      updateRule: 'workout_id.user_id = @request.auth.id',
      deleteRule: 'workout_id.user_id = @request.auth.id',
      fields: [
        {
          name: 'workout_id',
          type: 'relation',
          required: true,
          collectionId: workoutIdCol,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'exercise_id',
          type: 'relation',
          required: true,
          collectionId: exerciseIdCol,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'sets', type: 'number', required: true },
        { name: 'reps', type: 'text', required: true },
        { name: 'rest_time', type: 'number', required: true },
        { name: 'sort_order', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_we_workout_id ON workout_exercises (workout_id)',
        'CREATE INDEX idx_we_exercise_id ON workout_exercises (exercise_id)',
      ],
    })
    app.save(workout_exercises)

    // 5. diets
    const diets = new Collection({
      name: 'diets',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'goal',
          type: 'select',
          required: true,
          values: ['emagrecimento', 'hipertrofia', 'condicionamento', 'resistencia'],
          maxSelect: 1,
        },
        { name: 'daily_calories', type: 'number', required: true },
        { name: 'protein', type: 'number', required: true },
        { name: 'carbs', type: 'number', required: true },
        { name: 'fat', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_diets_user_id ON diets (user_id)'],
    })
    app.save(diets)

    // 6. recipes
    const recipes = new Collection({
      name: 'recipes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['cafe_da_manha', 'almoco', 'jantar', 'lanche', 'shake'],
          maxSelect: 1,
        },
        { name: 'ingredients', type: 'text', required: true },
        { name: 'instructions', type: 'text', required: true },
        { name: 'calories', type: 'number', required: true },
        { name: 'protein', type: 'number', required: true },
        { name: 'carbs', type: 'number', required: true },
        { name: 'fat', type: 'number', required: true },
        { name: 'prep_time', type: 'number', required: true },
        { name: 'servings', type: 'number', required: true },
        { name: 'image', type: 'file', maxSelect: 1, maxSize: 5242880 },
        { name: 'vector', type: 'vector', dimensions: 1536 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_recipes_category ON recipes (category)'],
    })
    app.save(recipes)

    // 7. progress
    const progress = new Collection({
      name: 'progress',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'weight', type: 'number', required: true },
        { name: 'body_fat', type: 'number' },
        { name: 'chest', type: 'number' },
        { name: 'waist', type: 'number' },
        { name: 'hip', type: 'number' },
        { name: 'arm', type: 'number' },
        { name: 'thigh', type: 'number' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_progress_user_id ON progress (user_id)',
        'CREATE INDEX idx_progress_created ON progress (created DESC)',
      ],
    })
    app.save(progress)

    // 8. workout_logs
    const workout_logs = new Collection({
      name: 'workout_logs',
      type: 'base',
      listRule: 'user_id = @request.auth.id',
      viewRule: 'user_id = @request.auth.id',
      createRule: 'user_id = @request.auth.id',
      updateRule: 'user_id = @request.auth.id',
      deleteRule: 'user_id = @request.auth.id',
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'workout_id',
          type: 'relation',
          required: true,
          collectionId: workoutIdCol,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'exercise_id',
          type: 'relation',
          required: true,
          collectionId: exerciseIdCol,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'date', type: 'date', required: true },
        { name: 'weight_used', type: 'number', required: true },
        { name: 'reps_completed', type: 'number', required: true },
        { name: 'sets_completed', type: 'number', required: true },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_wlogs_user_id ON workout_logs (user_id)',
        'CREATE INDEX idx_wlogs_date ON workout_logs (date DESC)',
        'CREATE INDEX idx_wlogs_exercise_id ON workout_logs (exercise_id)',
      ],
    })
    app.save(workout_logs)
  },
  (app) => {
    const collections = [
      'workout_logs',
      'progress',
      'recipes',
      'diets',
      'workout_exercises',
      'workouts',
      'exercises',
      'profiles',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
