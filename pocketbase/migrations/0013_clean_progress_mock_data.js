/// <reference path="../pb_data/types.d.ts" />
// Remove os dados mockados de progresso criados pelo seed (0002) e garante que
// cada usuário tenha apenas UM registro inicial de progresso derivado do perfil.
//
// Os mocks do seed foram criados em lote no mesmo segundo (2026-08-04 13:45:32.x)
// com notas fixas de demonstração. Critério robusto: created nesse timestamp do
// seed + notas conhecidas. Registros criados pelo usuário são preservados.
migrate(
  (app) => {
    const seedNotes = [
      'Início da jornada.',
      'Primeira semana focada na dieta.',
      'Cargas aumentando nos treinos.',
      'Excelente definição abdominal aparecendo.',
      'Ótima energia e disposição.',
      'Meta atual atingida! Manter constância.',
    ]

    const profiles = app.findRecordsByFilter('profiles', '', '-created', 0, 0)

    let removed = 0
    let backfilled = 0

    for (const profile of profiles) {
      const userId = profile.getString('user_id')
      if (!userId) continue

      const progress = app.findRecordsByFilter('progress', `user_id = "${userId}"`, 'created', 0, 0)

      // Remove registros criados no mesmo segundo do seed E com nota de demonstração.
      const mocks = progress.filter((p) => {
        const created = p.getString('created')
        const notes = p.getString('notes')
        const createdInSeedWindow = created.startsWith('2026-08-04 13:45:32')
        const isSeedNote = seedNotes.includes(notes)
        return createdInSeedWindow && isSeedNote
      })

      for (const mock of mocks) {
        app.delete(mock)
        removed++
      }

      // Se o usuário ficou sem progresso, cria um registro inicial com o peso do perfil.
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
