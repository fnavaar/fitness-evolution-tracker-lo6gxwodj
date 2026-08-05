import pb from '@/lib/pocketbase/client'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getOrCreateProfile, type ProfileRecord } from '@/services/profiles'

export interface ProgressEntry {
  id: string
  weight: number
  body_fat?: number
  chest?: number
  waist?: number
  hip?: number
  arm?: number
  thigh?: number
  notes?: string
  created: string
}

export interface WorkoutLog {
  id: string
  date: string
  weight_used: number
  reps_completed: number
  sets_completed: number
  workout_id: string
  exercise_id: string
  created: string
}

export interface DietEntry {
  id: string
  title: string
  description: string
  goal: string
  daily_calories: number
  protein: number
  carbs: number
  fat: number
  created: string
}

export interface DashboardData {
  progress: ProgressEntry[]
  workoutLogs: WorkoutLog[]
  diets: DietEntry[]
  profile: ProfileRecord | null
}

/**
 * Busca todos os dados relevantes ao dashboard do usuário autenticado.
 * Lança erro para ser tratado pelo chamador (toast + estado de erro).
 */
export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [progressRes, logsRes, dietsRes, profile] = await Promise.all([
    pb.collection('progress').getFullList({
      filter: `user_id = "${userId}"`,
      sort: 'created',
    }),
    pb.collection('workout_logs').getFullList({
      filter: `user_id = "${userId}"`,
      sort: 'date',
    }),
    pb.collection('diets').getFullList({
      filter: `user_id = "${userId}"`,
      sort: '-created',
    }),
    getOrCreateProfile(userId).catch((err) => {
      console.error('Erro ao buscar perfil no dashboard:', err)
      return null
    }),
  ])

  return {
    progress: progressRes as unknown as ProgressEntry[],
    workoutLogs: logsRes as unknown as WorkoutLog[],
    diets: dietsRes as unknown as DietEntry[],
    profile: profile ?? null,
  }
}

/* ---------------- helpers de formatação ---------------- */

export function formatShortDate(value: string | number | Date): string {
  return format(new Date(value), 'dd/MM', { locale: ptBR })
}

export function formatFullDate(value: string | number | Date): string {
  return format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/* ---------------- peso atual + variação mensal ---------------- */

export interface WeightSummary {
  current: number | null
  /** delta = atual - referencia (~30 dias atrás). Negativo = perdeu peso. */
  delta: number | null
  hasComparison: boolean
}

export function buildWeightSummary(
  progress: ProgressEntry[],
  fallbackWeight?: number | null,
): WeightSummary {
  if (progress.length === 0) {
    // Sem entradas de progresso: usa o current_weight do perfil como fallback.
    // O delta não pode ser calculado sem progress entries.
    const hasFallback = typeof fallbackWeight === 'number' && fallbackWeight > 0
    return {
      current: hasFallback ? fallbackWeight! : null,
      delta: null,
      hasComparison: false,
    }
  }

  const sorted = [...progress].sort(
    (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
  )
  const latest = sorted[sorted.length - 1]

  // Peso atual vazio no progress? Usa o fallback do perfil.
  const current =
    typeof latest.weight === 'number' && latest.weight > 0
      ? latest.weight
      : typeof fallbackWeight === 'number' && fallbackWeight > 0
        ? fallbackWeight
        : null

  const latestDate = new Date(latest.created)
  const cutoff = subDays(latestDate, 30)

  // Entrada mais recente com created <= 30 dias atrás do último registro.
  // Se não houver, usa a mais antiga como referência.
  const ref = [...sorted].reverse().find((p) => new Date(p.created) <= cutoff) ?? sorted[0]

  const canComputeDelta = current !== null && sorted.length > 1

  return {
    current,
    delta: canComputeDelta ? current! - ref.weight : null,
    hasComparison: canComputeDelta,
  }
}

/* ---------------- treinos nos últimos 7 dias ---------------- */

export function countWorkoutsThisWeek(logs: WorkoutLog[]): number {
  const cutoff = subDays(new Date(), 7)
  return logs.filter((l) => new Date(l.date) >= cutoff).length
}

/* ---------------- streak de dias consecutivos com treino ---------------- */

export function computeStreak(logs: WorkoutLog[]): number {
  if (logs.length === 0) return 0

  const dates = new Set(logs.map((l) => format(new Date(l.date), 'yyyy-MM-dd')))
  const sorted = Array.from(dates).sort()
  let streak = 0
  let cursor = new Date(sorted[sorted.length - 1] + 'T00:00:00')

  while (dates.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

/* ---------------- dados do gráfico de peso ---------------- */

export interface WeightPoint {
  date: string
  fullDate: string
  weight: number
}

export function buildWeightData(progress: ProgressEntry[]): WeightPoint[] {
  return [...progress]
    .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
    .map((p) => ({
      date: formatShortDate(p.created),
      fullDate: formatFullDate(p.created),
      weight: p.weight,
    }))
}

/* ---------------- dados do gráfico de carga total por treino ---------------- */

export interface LoadPoint {
  date: string
  fullDate: string
  volume: number
  ts: number
}

export function buildLoadData(logs: WorkoutLog[]): LoadPoint[] {
  const map = new Map<string, { volume: number; ts: number }>()

  for (const log of logs) {
    const d = new Date(log.date)
    const key = format(d, 'yyyy-MM-dd')
    const volume = log.weight_used * log.reps_completed * log.sets_completed
    const existing = map.get(key)
    if (existing) {
      existing.volume += volume
    } else {
      map.set(key, { volume, ts: d.getTime() })
    }
  }

  return Array.from(map.entries())
    .map(([key, v]) => {
      const d = new Date(key + 'T00:00:00')
      return {
        date: format(d, 'dd/MM', { locale: ptBR }),
        fullDate: format(d, "dd 'de' MMM", { locale: ptBR }),
        volume: v.volume,
        ts: v.ts,
      }
    })
    .sort((a, b) => a.ts - b.ts)
}
