import pb from '@/lib/pocketbase/client'
import type { UnsubscribeFunc } from 'pocketbase'

/* ----------------- Tipos ----------------- */

export type MuscleGroup = 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'core' | 'gluteos'
export type Equipment = 'halteres' | 'barra' | 'maquina' | 'peso_corporal' | 'cabos'
export type Difficulty = 'iniciante' | 'intermediario' | 'avancado'

export interface ExerciseRecord {
  id: string
  name: string
  muscle_group: MuscleGroup
  equipment: Equipment
  difficulty: Difficulty
  instructions: string
  image: string
  /** Campos opcionais — não presentes no schema atual, mantidos para compatibilidade futura. */
  description?: string
  primary_muscles?: string
  secondary_muscles?: string
  tips?: string
  created: string
  updated: string
}

/* ----------------- Serviço ----------------- */

/**
 * Escapa aspas duplas para uso seguro dentro de filtros PocketBase.
 */
function escapeFilterValue(value: string): string {
  return value.replace(/"/g, '\\"')
}

/**
 * Busca exercícios com filtros opcionais de busca textual (nome + instruções)
 * e grupo muscular. Ordenado por nome.
 */
export async function getExercises(
  search?: string,
  muscleGroup?: MuscleGroup | 'todos',
): Promise<ExerciseRecord[]> {
  const filters: string[] = []

  const term = search?.trim()
  if (term) {
    const safe = escapeFilterValue(term)
    filters.push(`(name ~ "${safe}" || instructions ~ "${safe}")`)
  }

  if (muscleGroup && muscleGroup !== 'todos') {
    filters.push(`muscle_group = "${muscleGroup}"`)
  }

  const filter = filters.length > 0 ? filters.join(' && ') : undefined

  const records = await pb.collection('exercises').getFullList({
    sort: 'name',
    ...(filter ? { filter } : {}),
  })
  return records as unknown as ExerciseRecord[]
}

/**
 * Busca um exercício específico pelo id.
 */
export async function getExercise(id: string): Promise<ExerciseRecord> {
  const record = await pb.collection('exercises').getOne(id)
  return record as unknown as ExerciseRecord
}

/**
 * Inscrição realtime na coleção `exercises`.
 * Retorna a função de cancelamento (UnsubscribeFunc).
 */
export function subscribeToExercises(callback: () => void): Promise<UnsubscribeFunc> {
  // Guarda: só assina quando o cliente está autenticado com token válido,
  // evitando o erro "Invalid realtime client" (400).
  if (!pb.authStore.isValid || !pb.authStore.token) {
    return Promise.reject(new Error('PocketBase client is not authenticated'))
  }
  return pb.collection('exercises').subscribe('*', () => {
    callback()
  })
}

/* ----------------- Helpers de UI ----------------- */

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  pernas: 'Pernas',
  ombros: 'Ombros',
  bracos: 'Braços',
  core: 'Abdômen',
  gluteos: 'Glúteos',
}

/** Emoji ilustrativo por grupo muscular. */
export const MUSCLE_GROUP_EMOJIS: Record<MuscleGroup, string> = {
  peito: '💪',
  costas: '🏋️',
  pernas: '🦵',
  ombros: '🙆',
  bracos: '🦾',
  core: '🔥',
  gluteos: '🍑',
}

/** Classes Tailwind de cor por grupo muscular (badge + acentos do card). */
export const MUSCLE_GROUP_STYLES: Record<
  MuscleGroup,
  { badge: string; glow: string; grad: string; iconBg: string; iconText: string }
> = {
  peito: {
    badge: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
    glow: 'group-hover:border-rose-400/40 group-hover:shadow-rose-400/10',
    grad: 'from-rose-500/30 to-red-700/10',
    iconBg: 'bg-rose-400/15',
    iconText: 'text-rose-300',
  },
  costas: {
    badge: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
    glow: 'group-hover:border-blue-400/40 group-hover:shadow-blue-400/10',
    grad: 'from-blue-500/30 to-indigo-700/10',
    iconBg: 'bg-blue-400/15',
    iconText: 'text-blue-300',
  },
  pernas: {
    badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
    glow: 'group-hover:border-emerald-400/40 group-hover:shadow-emerald-400/10',
    grad: 'from-emerald-500/30 to-green-700/10',
    iconBg: 'bg-emerald-400/15',
    iconText: 'text-emerald-300',
  },
  ombros: {
    badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    glow: 'group-hover:border-amber-400/40 group-hover:shadow-amber-400/10',
    grad: 'from-amber-500/30 to-orange-700/10',
    iconBg: 'bg-amber-400/15',
    iconText: 'text-amber-300',
  },
  bracos: {
    badge: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
    glow: 'group-hover:border-violet-400/40 group-hover:shadow-violet-400/10',
    grad: 'from-violet-500/30 to-purple-700/10',
    iconBg: 'bg-violet-400/15',
    iconText: 'text-violet-300',
  },
  core: {
    badge: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
    glow: 'group-hover:border-cyan-400/40 group-hover:shadow-cyan-400/10',
    grad: 'from-cyan-500/30 to-teal-700/10',
    iconBg: 'bg-cyan-400/15',
    iconText: 'text-cyan-300',
  },
  gluteos: {
    badge: 'bg-pink-400/15 text-pink-300 border-pink-400/30',
    glow: 'group-hover:border-pink-400/40 group-hover:shadow-pink-400/10',
    grad: 'from-pink-500/30 to-fuchsia-700/10',
    iconBg: 'bg-pink-400/15',
    iconText: 'text-pink-300',
  },
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  halteres: 'Halteres',
  barra: 'Barra',
  maquina: 'Máquina',
  peso_corporal: 'Peso Corporal',
  cabos: 'Cabos',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  iniciante: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  intermediario: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  avancado: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
}

export const MUSCLE_GROUP_FILTERS: { value: 'todos' | MuscleGroup; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'ombros', label: 'Ombros' },
  { value: 'bracos', label: 'Braços' },
  { value: 'core', label: 'Abdômen' },
  { value: 'gluteos', label: 'Glúteos' },
]

/**
 * Retorna a URL da imagem de um exercício ou string vazia quando não há imagem.
 */
export function getExerciseImageUrl(exercise: ExerciseRecord): string {
  if (!exercise.image) return ''
  return pb.files.getURL(exercise as unknown as { id: string }, exercise.image)
}

/**
 * Faz o parse do campo `instructions` em passos numerados.
 * Aceita "1. ...", "1) ...", ou linhas separadas por quebra de linha.
 */
export function parseInstructions(raw: string): string[] {
  if (!raw) return []
  const trimmed = raw.trim()
  const steps = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\s*\d+[).-]\s*/, '').trim())
    .filter(Boolean)
  return steps
}
