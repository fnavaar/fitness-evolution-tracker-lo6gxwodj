// Garante o default de `status` ("proposta") em rascunhos do Coach.
// PocketBase select não aplica default automático na criação da collection,
// e o agente cria drafts via tool sem setar status explicitamente.
// Roda antes da validação do create.
onRecordCreate((e) => {
  // Set default status
  const cur = e.record.get('status') || ''
  if (cur === '') {
    e.record.set('status', 'proposta')
  }
  // Auto-set user_id from the request's authenticated user.
  // The agent tool creates drafts without user_id in the payload;
  // scopeFilter doesn't auto-populate it on create.
  const info = e.requestInfo()
  const authId = (info && info.auth && info.auth.id) || ''
  if (authId && !e.record.get('user_id')) {
    e.record.set('user_id', authId)
    console.log('[coach_drafts] user_id auto-setado:', authId)
  }
}, 'coach_drafts')
