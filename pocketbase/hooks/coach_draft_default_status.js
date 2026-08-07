// Garante o default de `status` ("proposta") em rascunhos do Coach.
// PocketBase select não aplica default automático na criação da collection,
// e o agente cria drafts via tool sem setar status explicitamente.
// Roda antes da validação do create.
onRecordCreate((e) => {
  const cur = e.record.get('status') || ''
  if (cur === '') {
    e.record.set('status', 'proposta')
  }
}, 'coach_drafts')
