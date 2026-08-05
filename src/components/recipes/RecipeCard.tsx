import { memo } from 'react'
import {
  Flame,
  Clock,
  Users,
  Beef,
  Wheat,
  Droplet,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type RecipeRecord,
  type RecipeCategory,
  RECIPE_CATEGORY_LABELS,
  RECIPE_CATEGORY_STYLES,
  getRecipeImageUrl,
  type CompatibilityStatus,
} from '@/services/recipes'
import type { DietRecord } from '@/services/diets'
import { getRecipeCompatibility } from '@/services/recipes'

interface RecipeCardProps {
  recipe: RecipeRecord
  diet: DietRecord | null
  onOpen: (recipe: RecipeRecord) => void
}

function RecipeCardBase({ recipe, diet, onOpen }: RecipeCardProps) {
  const style = RECIPE_CATEGORY_STYLES[recipe.category as RecipeCategory]
  const imageUrl = getRecipeImageUrl(recipe)
  const compatibility = getRecipeCompatibility(recipe, diet)

  return (
    <Card
      onClick={() => onOpen(recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(recipe)
        }
      }}
      className={`group relative flex flex-col bg-[#12121A] border-[#262635] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl ${style.glow}`}
    >
      {/* Imagem */}
      <div className="relative h-44 w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={recipe.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${style.grad} flex items-center justify-center`}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Flame className="w-7 h-7 text-white/80" />
            </div>
          </div>
        )}
        {/* Badge de categoria sobre a imagem */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`backdrop-blur-md border ${style.badge} font-semibold`}
          >
            {RECIPE_CATEGORY_LABELS[recipe.category as RecipeCategory]}
          </Badge>
        </div>
        {/* Indicador de compatibilidade */}
        {compatibility !== 'neutro' && (
          <div className="absolute top-3 right-3">
            {compatibility === 'compativel' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#A3E635]/90 text-[#0B0B10] text-[11px] font-bold px-2.5 py-1 backdrop-blur-md shadow-lg">
                <CheckCircle2 className="w-3 h-3" />
                Compatível
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FB923C]/90 text-[#0B0B10] text-[11px] font-bold px-2.5 py-1 backdrop-blur-md shadow-lg">
                <AlertTriangle className="w-3 h-3" />
                Acima da meta
              </span>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* Nome */}
        <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{recipe.name}</h3>

        {/* Calorias destacadas */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-[#FB923C]/10 px-2.5 py-1">
            <Flame className="w-4 h-4 text-[#FB923C]" />
            <span className="text-sm font-extrabold text-[#FB923C]">{recipe.calories}</span>
            <span className="text-[11px] text-[#FB923C]/70 font-medium">kcal</span>
          </div>
        </div>

        {/* Mini macros em pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#0B0B10] border border-[#262635] px-2 py-0.5 text-[11px] font-semibold text-[#A3E635]">
            <Beef className="w-3 h-3" /> {recipe.protein}g
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#0B0B10] border border-[#262635] px-2 py-0.5 text-[11px] font-semibold text-[#22D3EE]">
            <Wheat className="w-3 h-3" /> {recipe.carbs}g
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#0B0B10] border border-[#262635] px-2 py-0.5 text-[11px] font-semibold text-[#A78BFA]">
            <Droplet className="w-3 h-3" /> {recipe.fat}g
          </span>
        </div>

        {/* Tempo e porções */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-auto pt-1">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {recipe.prep_time} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {recipe.servings} porç
            {recipe.servings > 1 ? 'ões' : 'ão'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export const RecipeCard = memo(RecipeCardBase)
export default RecipeCard

/* ----------------- Skeleton ----------------- */

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] overflow-hidden animate-pulse">
      <Skeleton className="h-44 w-full bg-[#1A1A24]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-5/6 bg-[#1A1A24]" />
        <Skeleton className="h-7 w-24 bg-[#1A1A24]" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-12 bg-[#1A1A24]" />
          <Skeleton className="h-5 w-12 bg-[#1A1A24]" />
          <Skeleton className="h-5 w-12 bg-[#1A1A24]" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-3 w-16 bg-[#1A1A24]" />
          <Skeleton className="h-3 w-16 bg-[#1A1A24]" />
        </div>
      </div>
    </div>
  )
}
