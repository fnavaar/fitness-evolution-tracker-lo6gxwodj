// Processamento automático de coach_drafts pendentes pelo Especialista de Treinos.
// Roda via cron (fora do request HTTP, então a chamada bloqueante ao agente
// não trava nenhum create). A cada 2 minutos, busca drafts de workout com
// status "proposta" e dispara o workout-specialist para materializá-los em
// workouts + workout_exercises.
//
// Este é o mecanismo oficial de processamento automático (substitui o antigo
// onRecordAfterCreateSuccess, que travava o create por chamar o agente de forma
// síncrona dentro do request).
cronAdd('process-pending-workout-drafts', '*/2 * * * *', () => {
  try {
    const drafts = $app.findRecordsByFilter(
      'coach_drafts',
      'type = "workout" && status = "proposta"',
      '-created',
      0,
      50,
    )

    if (drafts.length === 0) {
      return
    }

    console.log('[workout-specialist-cron] drafts pendentes:', drafts.length)

    for (const draft of drafts) {
      const userId = draft.get('user_id') || ''
      if (!userId) {
        console.log('[workout-specialist-cron] draft ' + draft.id + ' sem user_id, pulando')
        continue
      }

      let payload = {}
      try {
        const raw = draft.get('payload')
        payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
      } catch (_) {
        payload = {}
      }

      try {
        const iter = $ai.agent('workout-specialist').chat({
          user_id: userId,
          message:
            'Processe o coach_draft com ID ' +
            draft.id +
            '. O plano macro do Coach Rocha contém: ' +
            JSON.stringify(payload) +
            '. Crie o treino completo no banco de dados (workouts + workout_exercises) usando os exercícios do catálogo. IMPORTANTE: se o payload tiver o campo "days", crie UM workout por dia, preenchendo day_of_week e workout_type de cada sessão. Ao final, atualize o draft para status="confirmado". Responda em PT-BR com o resumo dos treinos criados.',
          stream: false,
        })

        console.log(
          '[workout-specialist-cron] draft ' +
            draft.id +
            ' processado: ' +
            (iter && iter.content ? String(iter.content).substring(0, 150) : '(sem conteúdo)'),
        )
      } catch (err) {
        const msg = err && err.message ? err.message : String(err)
        console.error('[workout-specialist-cron] falha ao processar draft ' + draft.id + ': ' + msg)
        // Não marca como confirmado — o próximo ciclo tenta de novo.
      }
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err)
    console.error('[workout-specialist-cron] erro geral: ' + msg)
  }
})
