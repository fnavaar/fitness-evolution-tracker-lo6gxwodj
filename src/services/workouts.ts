import pb from '@/lib/pocketbase/client'

/* ----------------- Tipos ----------------- */

export type WorkoutGoal = 'hipertrofia' | 'emagrecimento' | 'condicionamento' | 'resistencia'
export type WorkoutStatus = 'pendente' | 'em_andamento' | 'concluido'
export type MuscleGroup = 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'core' | 'gluteos'

export interface ExerciseRecord {
  id: string
  name: string
  muscle_group: MuscleGroup
  equipment: string
  difficulty: string
  instructions: string
}

export interface WorkoutExerciseItem {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_time: number
  sort_order: number
  /** Exercício relacionado, populado via expand. */
  expand?: { exercise_id?: ExerciseRecord }
}

export interface WorkoutRecord {
  id: string
  user_id: string
  title: string
  description: string
  goal: WorkoutGoal
  days_per_week: number
  status: WorkoutStatus
  created: string
  updated: string
  /** Itens de treino relacionados, populados via expand. */
  expand?: { workout_exercises?: WorkoutExerciseItem[] }
}

/* ----------------- Serviço ----------------- */

/**
 * Busca todos os treinos do usuário autenticado com seus exercícios
 * relacionados já expandidos. Lança erro para o chamador tratar.
 */
export async function fetchUserWorkouts(userId: string): Promise<WorkoutRecord[]> {
  const records = await pb.collection('workouts').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-created',
    expand: 'workout_exercises.exercise_id',
  })
  return records as unknown as WorkoutRecord[]
}

export interface GenerateWorkoutInput {
  goal: WorkoutGoal
  level: 'iniciante' | 'intermediario' | 'avancado'
  duration: 30 | 45 | 60 | 90
  equipment?: string
  notes?: string
}

/**
 * Chama o hook `generate-workout` do backend. O hook orquestra a IA,
 * cria o registro em `workouts` + `workout_exercises` e retorna `{ id }`.
 * Lança erro para o chamador tratar.
 */
export async function generateWorkout(input: GenerateWorkoutInput): Promise<string> {
  const res = await pb.send('/backend/v1/generate-workout', {
    method: 'POST',
    body: {
      goal: input.goal,
      level: input.level,
      duration: input.duration,
      equipment: input.equipment || '',
      notes: input.notes || '',
    },
  })

  if (res?.error) {
    throw new Error(res.error)
  }

  return res?.id as string
}

/* ----------------- Helpers de UI ----------------- */

export const GOAL_LABELS: Record<WorkoutGoal, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  resistencia: 'Força',
}

export const STATUS_LABELS: Record<WorkoutStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  ombros: 'Ombros',
  bracos: 'Braços',
  core: 'Core',
  gluteos: 'Glúteos',
}
