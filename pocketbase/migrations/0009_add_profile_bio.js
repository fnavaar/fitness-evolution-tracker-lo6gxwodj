migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')

    if (!col.fields.getByName('bio')) {
      col.fields.add(
        new TextField({
          name: 'bio',
          required: false,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    const f = col.fields.getByName('bio')
    if (f) {
      col.fields.remove(f)
      app.save(col)
    }
  },
)
