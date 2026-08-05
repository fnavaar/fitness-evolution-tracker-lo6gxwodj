import pb from '@/lib/pocketbase/client'
import type { DietRecord } from '@/services/diets'

/* ----------------- Tipos ----------------- */

export type RecipeCategory = 'cafe_da_manha' | 'almoco' | 'jantar' | 'lanche' | 'shake'

export interface RecipeRecord {
  id: string
  name: string
  description: string
  category: RecipeCategory
  ingredients: string
  instructions: string
  calories: number
  protein: number
  carbs: number
  fat: number
  prep_time: number
  servings: number
  image: string
  created: string
  updated: string
}

export interface ParsedIngredient {
  name: string
  quantity?: string
}

export type CompatibilityStatus = 'compativel' | 'acima' | 'neutro'

/* ----------------- Serviço ----------------- */

/**
 * Busca todas as receitas disponíveis (ordenadas por nome).
 */
export async function getRecipes(): Promise<RecipeRecord[]> {
  const records = await pb.collection('recipes').getFullList({
    sort: 'name',
  })
  return records as unknown as RecipeRecord[]
}

/**
 * Busca uma receita específica pelo id.
 */
export async function getRecipe(id: string): Promise<RecipeRecord> {
  const record = await pb.collection('recipes').getOne(id)
  return record as unknown as RecipeRecord
}

/**
 * Busca a dieta ativa (status = 'em_andamento') do usuário autenticado.
 * Retorna null quando não há dieta ativa.
 */
export async function getActiveDiet(): Promise<DietRecord | null> {
  if (!pb.authStore.record) return null
  const records = await pb.collection('diets').getFullList({
    filter: `user_id = "${pb.authStore.record.id}" && status = 'em_andamento'`,
    sort: '-created',
    expand: 'recipes',
  })
  if (records.length === 0) return null
  return records[0] as unknown as DietRecord
}

/**
 * Adiciona uma receita à dieta (atualiza o campo relation `recipes`).
 * Lê os recipes atuais e adiciona o novo id sem duplicar.
 */
export async function addRecipeToDiet(dietId: string, recipeId: string): Promise<void> {
  const diet = await pb.collection('diets').getOne(dietId)
  const current = (diet.get('recipes') as string[]) || []
  if (current.includes(recipeId)) return
  await pb.collection('diets').update(dietId, {
    recipes: [...current, recipeId],
  })
}

/* ----------------- Helpers de UI ----------------- */

export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  cafe_da_manha: 'Café da Manhã',
  almoco: 'Almoço',
  jantar: 'Jantar',
  lanche: 'Lanche',
  shake: 'Shake',
}

/** Classes Tailwind de cor por categoria (badge + acentos). */
export const RECIPE_CATEGORY_STYLES: Record<
  RecipeCategory,
  { badge: string; glow: string; grad: string }
> = {
  cafe_da_manha: {
    badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
    glow: 'group-hover:border-amber-400/40 group-hover:shadow-amber-400/10',
    grad: 'from-amber-500/30 to-orange-600/10',
  },
  almoco: {
    badge: 'bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/30',
    glow: 'group-hover:border-[#A3E635]/40 group-hover:shadow-[#A3E635]/10',
    grad: 'from-[#A3E635]/30 to-[#65A30D]/10',
  },
  jantar: {
    badge: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30',
    glow: 'group-hover:border-indigo-400/40 group-hover:shadow-indigo-400/10',
    grad: 'from-indigo-500/30 to-blue-700/10',
  },
  lanche: {
    badge: 'bg-[#FB923C]/15 text-[#FB923C] border-[#FB923C]/30',
    glow: 'group-hover:border-[#FB923C]/40 group-hover:shadow-[#FB923C]/10',
    grad: 'from-[#FB923C]/30 to-[#C2410C]/10',
  },
  shake: {
    badge: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
    glow: 'group-hover:border-violet-400/40 group-hover:shadow-violet-400/10',
    grad: 'from-violet-500/30 to-fuchsia-700/10',
  },
}

export const CATEGORY_FILTERS: { value: 'todos' | RecipeCategory; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'cafe_da_manha', label: 'Café da Manhã' },
  { value: 'almoco', label: 'Almoço' },
  { value: 'jantar', label: 'Jantar' },
  { value: 'lanche', label: 'Lanche' },
  { value: 'shake', label: 'Shake' },
]

/**
 * Retorna a URL da imagem de uma receita ou string vazia quando não há imagem.
 */
export function getRecipeImageUrl(recipe: RecipeRecord): string {
  if (!recipe.image) return ''
  return pb.files.getURL(recipe, recipe.image)
}

/**
 * Faz o parse do campo `ingredients`, que pode estar em dois formatos:
 *  - JSON stringificado de array de { name, quantity } (seed antiga)
 *  - Texto multilinha com "Nome: quantidade" (seed nova) ou itens separados por linha
 */
export function parseIngredients(raw: string): ParsedIngredient[] {
  if (!raw) return []
  const trimmed = raw.trim()
  // Tenta JSON primeiro.
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((it) =>
            typeof it === 'string'
              ? { name: it }
              : { name: it?.name ?? '', quantity: it?.quantity ?? '' },
          )
          .filter((it) => it.name)
      }
    } catch {
      /* fall through to text parsing */
    }
  }
  // Texto multilinha: cada linha é um ingrediente.
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Formato "Nome: quantidade" ou "Nome - quantidade".
      const match = line.match(/^([^::-]+?)\s*[:-]\s*(.+)$/)
      if (match) {
        return { name: match[1].trim(), quantity: match[2].trim() }
      }
      return { name: line }
    })
}

/**
 * Faz o parse do campo `instructions` em passos numerados.
 * Aceita "1. ...", "1) ...", ou linhas separadas por quebra de linha.
 */
export function parseInstructions(raw: string): string[] {
  if (!raw) return []
  const trimmed = raw.trim()
  // Se contém numeração no início das linhas, divide preservando os textos.
  const steps = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\s*\d+[).-]\s*/, '').trim())
    .filter(Boolean)
  return steps
}

/**
 * Avalia a compatibilidade de uma receita com a dieta ativa do usuário.
 * Considera que uma refeição individual não deveria ultrapassar ~1/3 das
 * metas diárias de calorias e macros. Retorna 'compativel' (verde) ou
 * 'acima' (laranja). Sem dieta ativa retorna 'neutro'.
 */
export function getRecipeCompatibility(
  recipe: RecipeRecord,
  diet: DietRecord | null,
): CompatibilityStatus {
  if (!diet) return 'neutro'
  const ratio = 1 / 3
  const overCalories = recipe.calories > diet.daily_calories * ratio
  const overProtein = recipe.protein > diet.protein * ratio
  const overCarbs = recipe.carbs > diet.carbs * ratio
  const overFat = recipe.fat > diet.fat * ratio
  // Se ultrapassa calorias OU dois ou mais macros → acima da meta.
  const overMacros = [overProtein, overCarbs, overFat].filter(Boolean).length
  if (overCalories || overMacros >= 2) return 'acima'
  return 'compativel'
}
