/// <reference path="../pb_data/types.d.ts" />
// Remove o workout órfão de teste "Treino Foco em Hipertrofia & Força"
// (id z0l1g84l14wc7sx, criado no seed de 04/08). workout_logs.workout_id
// tem cascadeDelete=false, então é preciso remover os logs que apontam para
// ele antes de deletar o workout.
migrate(
  (app) => {
    const ORPHAN_ID = 'z0l1g84l14wc7sx'

    // 1) Remove workout_logs que referenciam o órfão.
    const logs = app.findRecordsByFilter('workout_logs', 'workout_id = {:wid}', undefined, 0, 0, {
      wid: ORPHAN_ID,
    })
    for (const log of logs) {
      app.delete(log)
      console.log('[0035] workout_log removido:', log.id)
    }

    // 2) Remove o workout órfão.
    try {
      const orphan = app.findRecordById('workouts', ORPHAN_ID)
      app.delete(orphan)
      console.log('[0035] workout órfão removido:', ORPHAN_ID)
    } catch (_) {
      console.log('[0035] workout órfão não encontrado (já removido?)')
    }
  },
  (app) => {
    // rollback: nada a restaurar (remoção de dados de teste).
  },
)
