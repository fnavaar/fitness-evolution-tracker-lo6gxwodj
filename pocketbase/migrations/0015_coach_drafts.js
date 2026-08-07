/// <reference path="../pb_data/types.d.ts" />
// Nova collection `coach_drafts`: rascunhos de prescrições criados pelo
// Coach IA dentro do chat (Fase 1 — treinos) e que aguardam confirmação
// do atleta. Dieta/receita são apenas schema futuro.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'coach_drafts',
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
          minSelect: 0,
          maxSelect: 1,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['workout', 'diet', 'recipe'],
          maxSelect: 1,
        },
        { name: 'payload', type: 'json', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['proposta', 'confirmado', 'descartado'],
          maxSelect: 1,
        },
        { name: 'source_conversation_id', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_coach_drafts_user_id ON coach_drafts (user_id)'],
    })
    app.save(collection)

    // Default status = "proposta" — o PocketBase select não aplica default
    // automaticamente via `new Collection`, então garantimos via campo.
    // (Não há registros ainda; o default é aplicado em runtime pelo hook
    // de criação do agente / pelo app quando omitido.)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('coach_drafts')
    app.delete(collection)
  },
)
