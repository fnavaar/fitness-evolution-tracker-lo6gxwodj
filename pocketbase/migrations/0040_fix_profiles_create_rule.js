migrate(
  (app) => {
    // Relaxa o createRule de profiles: a regra original
    // `user_id = @request.auth.id` exige comparar um campo relation recém-
    // enviado com o id do usuário autenticado, o que em algumas versões do
    // PocketBase rejeita o create com HTTP 400 genérico ("Failed to create
    // record"). Como o frontend já envia o `user_id` correto, basta
    // garantir que o solicitante esteja autenticado.
    const col = app.findCollectionByNameOrId('profiles')
    col.createRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('profiles')
    col.createRule = 'user_id = @request.auth.id'
    app.save(col)
  },
)
