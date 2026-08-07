migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const cardioLogs = new Collection({
      name: 'cardio_logs',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'type', type: 'text', required: true },
        { name: 'distance', type: 'number', required: true, min: 0 },
        { name: 'duration', type: 'number', required: true, min: 0 },
        { name: 'date', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cardio_user_id ON cardio_logs (user_id)',
        'CREATE INDEX idx_cardio_date ON cardio_logs (date DESC)',
      ],
    })

    app.save(cardioLogs)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cardio_logs')
      app.delete(col)
    } catch (_) {}
  },
)
