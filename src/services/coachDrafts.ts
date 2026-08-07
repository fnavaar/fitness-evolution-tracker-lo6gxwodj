import pb from '@/lib/pocketbase/client'

/* ----------------- Tipos ----------------- */

export type CoachDraftType = 'workout' | 'diet' | 'recipe'
export type CoachDraftStatus = 'proposta' | 'confirmado' | 'descartado'

export interface CoachDraft {
  id: string
  user_id: string
  type: CoachDraftType
  payload: Record<string, unknown>
  status: CoachDraftStatus
  source_conversation_id?: string
  created: string
  updated: string
}

/* ----------------- API ----------------- */

/**
 * Lista os rascunhos de prescrição pendentes (status "proposta") do
 * atleta autenticado, mais recentes primeiro.
 */
export async function listPendingDrafts(userId: string): Promise<CoachDraft[]> {
  const res = await pb.collection('coach_drafts').getFullList({
    filter: `user_id = "${userId}" && status = "proposta"`,
    sort: '-created',
  })
  return res as unknown as CoachDraft[]
}

/**
 * Confirma um rascunho de treino no backend — materializa em
 * workouts + workout_exercises e marca o draft como "confirmado".
 */
export async function confirmDraft(id: string): Promise<{ id: string; type: string }> {
  return pb.send('/backend/v1/coach/drafts/' + id + '/confirm', { method: 'POST' })
}

/**
 * Descarta um rascunho (status "descartado"). Não materializa nada.
 */
export async function discardDraft(id: string): Promise<void> {
  await pb.collection('coach_drafts').update(id, { status: 'descartado' })
}
