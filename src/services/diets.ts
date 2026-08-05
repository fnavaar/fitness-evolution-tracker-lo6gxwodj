import pb from '@/lib/pocketbase/client'

/* ----------------- Tipos ----------------- */

export type DietGoal = 'emagrecimento' | 'hipertrofia' | 'condicionamento' | 'resistencia'
export type DietPreference = 'onivoro' | 'vegetariano' | 'vegano'

export interface DietRecord {
  id: string
  user_id: string
  title: string
  description: string
  goal: DietGoal
  daily_calories: number
  protein: number
  carbs: number
  fat: number
  /** Campo opcional — o schema atual não persiste preferência; mantido p/ compatibilidade. */
  preference?: DietPreference
  created: string
  updated: string
}

/* ----------------- Serviço ----------------- */

/**
 * Busca todas as dietas do usuário autenticado, mais recentes primeiro.
 */
export async function fetchUserDiets(userId: string): Promise<DietRecord[]> {
  const records = await pb.collection('diets').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-created',
  })
  return records as unknown as DietRecord[]
}

export interface GenerateDietInput {
  goal: DietGoal
  calories: number
  preference: DietPreference
}

/**
 * Chama o hook `generate-diet` do backend. O hook usa a IA para calcular
 * macros (TDEE) e cria o registro em `diets`, retornando `{ id }`.
 */
export async function generateDiet(input: GenerateDietInput): Promise<string> {
  const res = await pb.send('/backend/v1/generate-diet', {
    method: 'POST',
    body: {
      goal: input.goal,
      calories: input.calories,
      preference: input.preference,
    },
  })

  if (res?.error) {
    throw new Error(res.error)
  }

  return res?.id as string
}

/* ----------------- Helpers de UI ----------------- */

export const DIET_GOAL_LABELS: Record<DietGoal, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  resistencia: 'Força',
}

export const DIET_PREFERENCE_LABELS: Record<DietPreference, string> = {
  onivoro: 'Onívoro',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
}
