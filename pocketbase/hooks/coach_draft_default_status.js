// Garante o default de `status` ("proposta") e preenche `user_id`
// automaticamente em rascunhos do Coach criados via tool pelo agente.
// O agente cria drafts sem user_id no payload (por design), então o hook
// resolve o usuário autenticado a partir do contexto da requisição.
// PocketBase select não aplica default automático na criação da collection.
// Roda antes da validação do create (onRecordCreate).
onRecordCreate((e) => {
  // 1) Set default status = "proposta"
  const cur = e.record.get('status') || ''
  if (cur === '') {
    e.record.set('status', 'proposta')
  }

  // 2) Auto-set user_id from the request's authenticated user.
  //    O agente cria drafts via tool sem user_id no payload; o scopeFilter
  //    não o popula automaticamente no create. Tentamos várias fontes.
  if (!e.record.get('user_id')) {
    const info = e.requestInfo()

    // Método 1: contexto de auth do PocketBase
    let userId = (info && info.auth && info.auth.id) || ''

    // Método 2 (fallback): contexto do Skip AI (userId injetado no chat)
    if (!userId && info && info.context) {
      userId = info.context.userId || ''
    }

    // Método 3 (fallback final): headers ou cookies
    if (!userId && info) {
      try {
        const headers = info.headers || {}
        userId = headers['x-user-id'] || headers['x-auth-id'] || ''
      } catch (_) {}
    }

    if (userId) {
      e.record.set('user_id', userId)
      console.log('[coach_drafts] user_id auto-setado:', userId)
    } else {
      console.log('[coach_drafts] WARN: não foi possível obter user_id para o draft')
    }
  }
}, 'coach_drafts')
