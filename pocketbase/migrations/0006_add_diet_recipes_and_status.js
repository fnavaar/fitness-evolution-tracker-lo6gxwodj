migrate(
  (app) => {
    // Adiciona o campo `recipes` (relation múltipla) e o campo `status`
    // à coleção `diets`, para suportar receitas planejadas e a noção de
    // dieta ativa (status = 'em_andamento') usada na página de Receitas.
    const col = app.findCollectionByNameOrId('diets')

    // 1. Campo `status` (select) — reflete o ciclo de vida da dieta.
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

    // 2. Campo `recipes` (relation múltipla) — receitas planejadas na dieta.
    if (!col.fields.getByName('recipes')) {
      const recipesColId = app.findCollectionByNameOrId('recipes').id
      col.fields.add(
        new RelationField({
          name: 'recipes',
          collectionId: recipesColId,
          cascadeDelete: false,
          minSelect: 0,
          maxSelect: 9999,
        }),
      )
    }

    app.save(col)

    // 3. Backfill: marca dietas existentes como 'em_andamento' quando nulo,
    //    para que dietas já criadas sejam consideradas ativas por padrão.
    app
      .db()
      .newQuery("UPDATE diets SET status = 'em_andamento' WHERE status IS NULL OR status = ''")
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('diets')
    const sf = col.fields.getByName('status')
    if (sf) col.fields.remove(sf)
    const rf = col.fields.getByName('recipes')
    if (rf) col.fields.remove(rf)
    app.save(col)
  },
)
