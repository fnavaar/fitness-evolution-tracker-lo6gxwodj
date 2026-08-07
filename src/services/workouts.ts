import pb from '@/lib/pocketbase/client'

/* ----------------- Tipos ----------------- */

export type WorkoutGoal = 'hipertrofia' | 'emagrecimento' | 'condicionamento' | 'resistencia'
export type WorkoutStatus = 'pendente' | 'em_andamento' | 'concluido'
export type WorkoutDay = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'
export type WorkoutType =
  | 'full_body'
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'cardio'
  | 'mobilidade'
  | 'core'
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
  /** Sessão semanal — registros antigos podem não ter estes campos. */
  day_of_week?: WorkoutDay
  workout_type?: WorkoutType
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

/* ----------------- CRUD ----------------- */

export interface UpdateWorkoutInput {
  title?: string
  description?: string
  goal?: WorkoutGoal
  days_per_week?: number
  status?: WorkoutStatus
  day_of_week?: WorkoutDay
  workout_type?: WorkoutType
}

/**
 * Atualiza um treino. Lança erro para o chamador tratar.
 */
export async function updateWorkout(id: string, data: UpdateWorkoutInput): Promise<void> {
  await pb.collection('workouts').update(id, data)
}

/**
 * Exclui um treino. Lança erro para o chamador tratar.
 */
export async function deleteWorkout(id: string): Promise<void> {
  await pb.collection('workouts').delete(id)
}

export interface UpdateWorkoutExerciseInput {
  sets?: number
  reps?: string
  rest_time?: number
  sort_order?: number
}

/**
 * Atualiza um item de exercício do treino.
 */
export async function updateWorkoutExercise(
  id: string,
  data: UpdateWorkoutExerciseInput,
): Promise<void> {
  await pb.collection('workout_exercises').update(id, data)
}

/**
 * Exclui um item de exercício do treino.
 */
export async function deleteWorkoutExercise(id: string): Promise<void> {
  await pb.collection('workout_exercises').delete(id)
}

/**
 * Adiciona um exercício a um treino. Retorna o id do registro criado.
 */
export async function addWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  sets: number,
  reps: string,
  restTime: number,
  sortOrder: number,
): Promise<string> {
  const record = await pb.collection('workout_exercises').create({
    workout_id: workoutId,
    exercise_id: exerciseId,
    sets,
    reps,
    rest_time: restTime,
    sort_order: sortOrder,
  })
  return record.id
}

/**
 * Busca todos os exercícios disponíveis (collection `exercises`), ordenados por nome.
 */
export async function fetchExercises(): Promise<ExerciseRecord[]> {
  const records = await pb.collection('exercises').getFullList({ sort: 'name' })
  return records as unknown as ExerciseRecord[]
}

export interface WorkoutLogInput {
  user_id: string
  workout_id: string
  exercise_id: string
  date: string
  weight_used: number
  reps_completed: number
  sets_completed: number
  notes?: string
}

/**
 * Cria um registro de treino realizado (workout_logs).
 */
export async function createWorkoutLog(data: WorkoutLogInput): Promise<void> {
  await pb.collection('workout_logs').create(data)
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

export const DAY_LABELS: Record<WorkoutDay, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export const DAY_ORDER: Record<WorkoutDay, number> = {
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
  domingo: 7,
}

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  full_body: 'Full body',
  upper: 'Parte superior',
  lower: 'Parte inferior',
  push: 'Push',
  pull: 'Pull',
  legs: 'Pernas',
  cardio: 'Cardio',
  mobilidade: 'Mobilidade',
  core: 'Core',
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
