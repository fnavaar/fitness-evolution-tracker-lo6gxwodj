// Processamento automático de coach_drafts de workout pelo Especialista de Treinos.
// Disparado quando um coach_draft é criado com sucesso. Quando o draft é do tipo
// "workout" e status "proposta", invoca o agente workout-specialist para aprofundar
// o plano macro do Coach Rocha em um treino completo (workouts + workout_exercises)
// diretamente no banco, sem etapa de confirmação manual.
onRecordAfterCreateSuccess((e) => {
  const record = e.record

  // Só processa drafts de workout com status proposta.
  const t = record.get('type') || ''
  const s = record.get('status') || ''
  if (t !== 'workout' || s !== 'proposta') {
    return
  }

  let userId = record.get('user_id') || ''
  if (!userId) {
    // Tenta resolver pelo contexto da requisição (fallback do hook de default).
    try {
      const info = e.requestInfo()
      if (info && info.auth && info.auth.id) userId = info.auth.id
    } catch (_) {}
  }
  if (!userId) {
    console.log(
      '[workout-specialist] draft ' +
        record.id +
        ' sem user_id — não foi possível processar automaticamente',
    )
    return
  }

  try {
    let payload
    try {
      const raw = record.get('payload')
      payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
    } catch (_) {
      payload = {}
    }

    const iter = $ai.agent('workout-specialist').chat({
      user_id: userId,
      message:
        'Processe o coach_draft com ID ' +
        record.id +
        '. O plano macro do Coach Rocha contém: ' +
        JSON.stringify(payload) +
        '. Crie o treino completo no banco de dados (workouts + workout_exercises) usando os exercícios do catálogo e, ao final, atualize o draft para status="confirmado". Responda em PT-BR com o resumo do treino criado.',
      stream: false,
    })

    console.log(
      '[workout-specialist] draft ' +
        record.id +
        ' processado: ' +
        (iter && iter.content ? String(iter.content).substring(0, 200) : '(sem conteúdo)'),
    )
  } catch (err) {
    const msg = err && err.message ? err.message : String(err)
    console.error('[workout-specialist] falha ao processar draft ' + record.id + ': ' + msg)
    // Não marca o draft como confirmado — permanece "proposta" e pode ser
    // reprocessado via chat do Especialista na página /treinos.
  }
}, 'coach_drafts')
