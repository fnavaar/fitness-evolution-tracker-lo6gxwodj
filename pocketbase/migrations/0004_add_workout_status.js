migrate(
  (app) => {
    // Adiciona o campo `status` à coleção workouts para suportar os
    // badges "Pendente", "Em andamento" e "Concluído" na página de treinos.
    const col = app.findCollectionByNameOrId('workouts')

    if (!col.fields.getByName('status')) {
      col.fields.add(
        new SelectField({
          name: 'status',
          required: false,
          values: ['pendente', 'em_andamento', 'concluido'],
          maxSelect: 1,
        }),
      )
    }

    app.save(col)

    // Backfill: marca treinos existentes como "pendente" quando nulo.
    app
      .db()
      .newQuery("UPDATE workouts SET status = 'pendente' WHERE status IS NULL OR status = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('workouts')
    const field = col.fields.getByName('status')
    if (field) {
      col.fields.remove(field)
      app.save(col)
    }
  },
)
