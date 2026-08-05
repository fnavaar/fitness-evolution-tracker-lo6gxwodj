migrate(
  (app) => {
    // Backfill: usuários que fizeram onboarding (têm perfil) mas não têm
    // registro em `progress` (o onboarding < 0.0.9 não criava o seed).
    // O dashboard lê peso de `progress` — sem esse registro, o card
    // "Peso Atual" e o gráfico nascem vazios.
    const progressCol = app.findCollectionByNameOrId('progress')

    // 1. Todos os perfis existentes (mais antigos primeiro).
    const profiles = app.findRecordsByFilter('profiles', '', '-created', 0, 0)

    let backfilled = 0
    for (const profile of profiles) {
      const userId = profile.getString('user_id')
      if (!userId) continue

      // 2. Já existe registro de progresso para este usuário?
      const existing = app.findRecordsByFilter('progress', `user_id = "${userId}"`, '', 1, 0)
      if (existing.length > 0) continue

      // 3. Peso do perfil como peso inicial.
      const weight = profile.get('current_weight')
      if (!weight || Number(weight) <= 0) continue

      const record = new Record(progressCol)
      record.set('user_id', userId)
      record.set('weight', Number(weight))
      app.save(record)
      backfilled++
    }

    console.log(`[backfill-progress] ${backfilled} registro(s) criado(s) em progress`)
  },
  (app) => {
    // rollback: não remove nada — reverter um backfill destruiria dados legítimos.
  },
)
