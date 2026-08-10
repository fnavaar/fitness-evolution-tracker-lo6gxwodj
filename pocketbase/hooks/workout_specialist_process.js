// Processamento automático de drafts de treino assim que são criados.
// Dispara em onRecordAfterCreateSuccess da collection `coach_drafts`
// (somente type="workout" e status="proposta") e chama o agente
// workout-specialist para materializar o draft em workouts +
// workout_exercises.
//
// Roda APÓS o commit do create (onRecordAfterCreateSuccess), então a
// chamada bloqueante ao agente não trava o request que criou o draft.
// É complementar ao cron (workout_specialist_cron.js): este hook garante
// latência baixa para o caso comum (o Coach cria um draft e o Especialista
// já processa na sequência); o cron varre pendências que este hook não
// conseguiu processar (falha transitória, restart do servidor, etc.).
//
// NOTA: PocketBase JSVM roda callbacks em VM separada — toda a lógica fica
// DENTRO do callback (sem funções/variáveis top-level referenciadas).
onRecordAfterCreateSuccess((e) => {
  const draft = e.record
  if (!draft) return

  // Filtra apenas drafts de treino em proposta.
  const type = draft.get('type') || ''
  const status = draft.get('status') || ''
  if (type !== 'workout' || status !== 'proposta') return

  const draftId = draft.id
  const userId = draft.get('user_id') || ''
  if (!userId) {
    console.log('[workout-specialist-process] draft ' + draftId + ' sem user_id, pulando')
    return
  }

  // Lê o payload (JSON) do draft.
  let payload = {}
  try {
    const raw = draft.get('payload')
    payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}
  } catch (_) {
    payload = {}
  }

  // Chama o agente workout-specialist (síncrono, stream:false). O agente
  // tem tools para ler/exercícios e criar workouts + workout_exercises e
  // atualizar o draft para status="confirmado".
  try {
    const iter = $ai.agent('workout-specialist').chat({
      user_id: userId,
      message:
        'Processe o coach_draft com ID ' +
        draftId +
        '. O plano macro do Coach Rocha contém: ' +
        JSON.stringify(payload) +
        '. Crie o treino completo no banco de dados (workouts + workout_exercises) usando os exercícios do catálogo. IMPORTANTE: se o payload tiver o campo "days", crie UM workout por dia, preenchendo day_of_week e workout_type de cada sessão. Ao final, atualize o draft para status="confirmado". Responda em PT-BR com o resumo dos treinos criados.',
      stream: false,
    })

    console.log(
      '[workout-specialist-process] draft ' +
        draftId +
        ' processado: ' +
        (iter && iter.content ? String(iter.content).substring(0, 150) : '(sem conteúdo)'),
    )
  } catch (err) {
    const status = (err && err.status) || 0
    const msg = (err && err.message) || String(err)
    const gwKeySet = !!$os.getenv('SKIP_AI_GATEWAY_API_KEY')
    const gwUrlSet = !!$os.getenv('SKIP_AI_GATEWAY_URL')
    console.error(
      '[workout-specialist-process] falha ao processar draft ' +
        draftId +
        ': status=' +
        status +
        ' msg=' +
        msg +
        ' gateway_key_set=' +
        gwKeySet +
        ' gateway_url_set=' +
        gwUrlSet,
    )
    // Não altera o draft: o cron (workout_specialist_cron.js) retenta a cada
    // 2 minutos, então o draft será reprocessado quando o gateway voltar.
  }
}, 'coach_drafts')
