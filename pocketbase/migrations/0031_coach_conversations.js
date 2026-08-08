/// <reference path="../pb_data/types.d.ts" />
// Shadow collection `coach_conversations`: armazena os metadados das conversas
// gerenciadas pelo agente Coach Rocha (fitness-coach). O SDK JS do Skip AI não
// expõe `updateConversation()` nem `deleteConversation()`, então rename/delete
// operam sobre estes registros próprios enquanto o histórico real permanece no
// runtime do agente (acessível via listMessages / listConversations).
migrate(
  (app) => {
    const collection = new Collection({
      name: 'coach_conversations',
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
          name: 'agent_conversation_id',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cc_user_id ON coach_conversations (user_id)',
        'CREATE UNIQUE INDEX idx_cc_agent_conv_id ON coach_conversations (agent_conversation_id)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('coach_conversations')
    app.delete(collection)
  },
)
