import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

/* ----------------- Tipos ----------------- */

export type Goal = 'emagrecimento' | 'hipertrofia' | 'condicionamento' | 'resistencia'
export type ActivityLevel = 'sedentario' | 'levemente_ativo' | 'moderadamente_ativo' | 'muito_ativo'
export type DietaryPreference = 'onivoro' | 'vegetariano' | 'vegano'

export interface ProfileRecord extends RecordModel {
  id: string
  user_id: string
  goal: Goal
  current_weight: number
  height: number
  birth_date: string
  activity_level: ActivityLevel
  training_frequency: number
  dietary_preference: DietaryPreference
  restrictions: string
  created: string
  updated: string
}

/* ----------------- Labels PT-BR ----------------- */

export const GOAL_LABELS: Record<Goal, string> = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  condicionamento: 'Condicionamento',
  resistencia: 'Resistência',
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentário',
  levemente_ativo: 'Leve',
  moderadamente_ativo: 'Moderado',
  muito_ativo: 'Intenso',
}

export const FREQUENCY_LABELS: Record<number, string> = {
  1: '1-2x por semana',
  2: '1-2x por semana',
  3: '3-4x por semana',
  4: '3-4x por semana',
  5: '5-6x por semana',
  6: '5-6x por semana',
  7: 'Todos os dias',
}

/* ----------------- Serviço ----------------- */

const DEFAULT_PROFILE = {
  goal: 'hipertrofia' as Goal,
  current_weight: 0,
  height: 0,
  birth_date: new Date('1995-01-01').toISOString(),
  activity_level: 'moderadamente_ativo' as ActivityLevel,
  training_frequency: 3,
  dietary_preference: 'onivoro' as DietaryPreference,
  restrictions: '',
}

/**
 * Busca o perfil do usuário. Se não existir, cria um com valores padrão.
 * Retorna null quando o usuário não está autenticado.
 */
export async function getOrCreateProfile(userId: string): Promise<ProfileRecord> {
  const res = await pb.collection('profiles').getList<ProfileRecord>(1, 1, {
    filter: `user_id = "${userId}"`,
  })

  if (res.items.length > 0) {
    return res.items[0]
  }

  try {
    const created = await pb.collection('profiles').create<ProfileRecord>({
      user_id: userId,
      ...DEFAULT_PROFILE,
    })
    return created
  } catch (err: any) {
    // user_id órfão (usuário deletado no backend, mas sessão ainda ativa):
    // o PocketBase rejeita a relação com validation_missing_rel_records.
    // Nesse caso a sessão não é mais confiável — limpa o authStore para
    // redirecionar ao login, em vez de deixar o usuário preso num erro 400.
    const data = err?.response?.data || {}
    if (data?.user_id?.code === 'validation_missing_rel_records') {
      pb.authStore.clear()
      throw new Error('Sessão expirada. Faça login novamente.')
    }
    throw err
  }
}

export async function updateProfile(
  id: string,
  data: Partial<Omit<ProfileRecord, 'id' | 'user_id' | 'created' | 'updated'>>,
): Promise<ProfileRecord> {
  return await pb.collection('profiles').update<ProfileRecord>(id, data)
}

export interface ProfileStats {
  totalWorkouts: number
  totalSavedRecipes: number
  currentStreak: number
  activeDaysThisMonth: number
}

/**
 * Busca estatísticas para o card de "Estatísticas Rápidas".
 */
export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const [logs, dietsRes] = await Promise.all([
    pb.collection('workout_logs').getFullList({
      filter: `user_id = "${userId}"`,
      sort: '-date',
    }),
    pb.collection('diets').getFullList({
      filter: `user_id = "${userId}"`,
    }),
  ])

  const totalWorkouts = logs.length
  const totalSavedRecipes = dietsRes.reduce(
    (acc, d) => acc + (Array.isArray(d.recipes) ? d.recipes.length : 0),
    0,
  )

  // Streak: dias consecutivos com treino (lógica reaproveitada do dashboard).
  const dates = new Set(
    logs.map((l) => {
      const d = new Date(l.date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }),
  )
  const sortedDates = Array.from(dates).sort()
  let currentStreak = 0
  if (sortedDates.length > 0) {
    let cursor = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00')
    while (dates.has(formatDateKey(cursor))) {
      currentStreak++
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
    }
  }

  // Dias ativos este mês.
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const activeDaysThisMonth = Array.from(dates).filter((d) => d.startsWith(monthPrefix)).length

  return { totalWorkouts, totalSavedRecipes, currentStreak, activeDaysThisMonth }
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
