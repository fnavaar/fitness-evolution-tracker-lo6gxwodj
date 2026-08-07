/// <reference path="../pb_data/types.d.ts" />
// Corrige o fluxo de criação de coach_drafts: o campo `user_id` era
// `required: true`, o que fazia a validação de schema rejeitar o registro
// ANTES do hook `coach_draft_default_status.js` poder preenchê-lo
// automaticamente a partir do usuário autenticado. Tornando `user_id`
// opcional, o hook consegue setá-lo em runtime e o registro persiste.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('coach_drafts')
    const field = collection.fields.find((f) => f.name === 'user_id')
    if (field) {
      field.required = false
      app.save(collection)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('coach_drafts')
    const field = collection.fields.find((f) => f.name === 'user_id')
    if (field) {
      field.required = true
      app.save(collection)
    }
  },
)
