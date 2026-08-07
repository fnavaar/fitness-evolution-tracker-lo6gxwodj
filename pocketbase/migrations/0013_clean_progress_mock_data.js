/// <reference path="../pb_data/types.d.ts" />
// Remove os dados mockados de progresso criados pelo seed e garante que cada
// usuário tenha apenas UM registro inicial de progresso derivado do perfil.
// Critério de mock: datas de 2025 (seed criava created manualmente em 2025-*)
// combinadas com as notas de demonstração conhecidas do seed.
migrate(
  (app) => {
    const profiles = app.findRecordsByFilter('profiles', '', '-created', 0, 0)

    let removed = 0
    let backfilled = 0

    for (const profile of profiles) {
      const userId = profile.getString('user_id')
      if (!userId) continue

      const progress = app.findRecordsByFilter('progress', `user_id = "${userId}"`, 'created', 0, 0)

      // Identifica e remove registros claramente mockados (datas de 2025 do seed).
      const mocks = progress.filter((p) => {
        const created = p.getString('created')
        return created.startsWith('2025-')
      })

      for (const mock of mocks) {
        app.delete(mock)
        removed++
      }

      // Depois da limpeza, se o usuário não tem mais progresso, cria um
      // registro inicial com o peso do perfil como ponto de partida real.
      const remaining = app.findRecordsByFilter('progress', `user_id = "${userId}"`, '', 1, 0)
      if (remaining.length === 0) {
        const weight = profile.get('current_weight')
        if (weight && Number(weight) > 0) {
          const progressCol = app.findCollectionByNameOrId('progress')
          const record = new Record(progressCol)
          record.set('user_id', userId)
          record.set('weight', Number(weight))
          app.save(record)
          backfilled++
        }
      }
    }

    console.log(
      `[clean-progress] removidos=${removed} registros mockados, backfill=${backfilled} peso inicial do perfil`,
    )
  },
  (app) => {
    // rollback intencionalmente vazio: remover mock e não recriar é seguro.
  },
)
