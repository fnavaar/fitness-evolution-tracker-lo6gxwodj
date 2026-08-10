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
 * Exclui um treino e todos os seus itens de exercício relacionados.
 *
 * O PocketBase impede a exclusão de um `workout` enquanto existirem
 * registros filhos em `workout_exercises` (relação obrigatória), por isso
 * é preciso removê-los antes de deletar o registro pai. Lança erro para o
 * chamador tratar.
 */
export async function deleteWorkout(id: string): Promise<void> {
  // 1. Busca todos os itens de exercício relacionados ao treino.
  let children: { id: string }[] = []
  try {
    children = await pb.collection('workout_exercises').getFullList({
      filter: `workout_id = "${id}"`,
    })
  } catch (err) {
    throw new Error(
      'Falha ao listar os exercícios do treino para exclusão: ' +
        (err instanceof Error ? err.message : String(err)),
    )
  }

  // 2. Deleta cada filho (PocketBase JS SDK não expõe batch delete público).
  for (const child of children) {
    try {
      await pb.collection('workout_exercises').delete(child.id)
    } catch (err) {
      throw new Error(
        'Falha ao excluir um exercício do treino: ' +
          (err instanceof Error ? err.message : String(err)),
      )
    }
  }

  // 3. Deleta o treino pai.
  try {
    await pb.collection('workouts').delete(id)
  } catch (err) {
    throw new Error(
      'Falha ao excluir o treino: ' + (err instanceof Error ? err.message : String(err)),
    )
  }
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

/* ----------------- Especialista de Treinos ----------------- */

export interface SpecialistChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/**
 * Consome o stream SSE do Especialista de Treinos, chamando os handlers
 * a cada chunk. Resolve quando o turno termina (`done`); lança em
 * abort/erro. Retorna o conversation_id da conversa (nova ou existente).
 */
export async function streamSpecialistChat(
  res: Response,
  handlers: {
    onChunk?: (deltaText: string, accumulatedText: string) => void
    onError?: (message: string) => void
    signal?: AbortSignal
  },
): Promise<{ conversationId: string; content: string }> {
  const { streamAgentChat } = await import('@/lib/skipAi')
  const result = await streamAgentChat(res, {
    onChunk: handlers.onChunk,
    onError: handlers.onError,
    signal: handlers.signal,
  })
  const conversationId = res.headers.get('X-Conversation-Id') ?? result.conversation_id
  return { conversationId, content: result.content }
}

/**
 * Envia uma mensagem ao Especialista de Treinos (agente workout-specialist)
 * no backend e devolve a `Response` bruta (SSE) para ser consumida via
 * `streamSpecialistChat`.
 *
 * O runtime do agente mantém o histórico da conversa server-side (por
 * `conversation_id`), então enviamos apenas a nova mensagem do usuário.
 */
export async function sendSpecialistMessage(
  message: string,
  opts: { conversationId?: string | null; signal?: AbortSignal } = {},
): Promise<Response> {
  // Timeout de 120s (2 minutos). Evita que o fetch fique pendurado quando o
  // Especialista demora demais (gateway lento / agente travado).
  const SPECIALIST_TIMEOUT_MS = 120_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SPECIALIST_TIMEOUT_MS)

  const externalSignal = opts.signal
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort()
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  let res: Response
  try {
    res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/workout-specialist/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: pb.authStore.token || '',
      },
      body: JSON.stringify({
        message,
        conversation_id: opts.conversationId ?? null,
      }),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (controller.signal.aborted && !(externalSignal && externalSignal.aborted)) {
      throw new Error('Especialista ocupado, tente novamente em instantes.')
    }
    throw err
  }
  clearTimeout(timer)
  return res
}
