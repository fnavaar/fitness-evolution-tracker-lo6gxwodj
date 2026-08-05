import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { UtensilsCrossed, Flame, Beef, Wheat, Droplet, Calendar, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { type DietRecord, DIET_GOAL_LABELS, DIET_PREFERENCE_LABELS } from '@/services/diets'
import { getRecipe, getRecipeImageUrl, type RecipeRecord } from '@/services/recipes'

interface DietDetailDialogProps {
  diet: DietRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DietDetailDialog({ diet, open, onOpenChange }: DietDetailDialogProps) {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([])

  useEffect(() => {
    if (!diet || !open) {
      setRecipes([])
      return
    }
    const recipeIds = (diet as unknown as { recipes?: string[] }).recipes || []
    if (recipeIds.length === 0) {
      setRecipes([])
      return
    }
    let cancelled = false
    Promise.all(recipeIds.map((id) => getRecipe(id).catch(() => null)))
      .then((results) => {
        if (cancelled) return
        setRecipes(results.filter((r): r is RecipeRecord => r !== null))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [diet, open])

  if (!diet) return null

  const createdLabel = format(new Date(diet.created), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })

  // Distribuição aproximada das refeições para visualização (baseada em macros).
  const mealDistribution = [
    { label: 'Café da manhã', pct: 0.25 },
    { label: 'Almoço', pct: 0.35 },
    { label: 'Lanche', pct: 0.15 },
    { label: 'Jantar', pct: 0.25 },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-extrabold text-white leading-tight">
                {diet.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                {diet.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Metadados */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {DIET_GOAL_LABELS[diet.goal]}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {DIET_PREFERENCE_LABELS[diet.preference || 'onivoro']}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            <Calendar className="w-3 h-3 mr-1" />
            {createdLabel}
          </Badge>
        </div>

        {/* Meta calórica */}
        <div className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Meta diária</p>
            <p className="text-lg font-extrabold text-white">
              {diet.daily_calories.toLocaleString('pt-BR')} kcal
            </p>
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-3 text-center">
            <Beef className="w-5 h-5 mx-auto mb-1 text-[#A3E635]" />
            <p className="text-lg font-extrabold text-white">{diet.protein}g</p>
            <p className="text-xs text-slate-400">Proteína</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {Math.round(((diet.protein * 4) / diet.daily_calories) * 100)}% kcal
            </p>
          </div>
          <div className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-3 text-center">
            <Wheat className="w-5 h-5 mx-auto mb-1 text-[#22D3EE]" />
            <p className="text-lg font-extrabold text-white">{diet.carbs}g</p>
            <p className="text-xs text-slate-400">Carboidratos</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {Math.round(((diet.carbs * 4) / diet.daily_calories) * 100)}% kcal
            </p>
          </div>
          <div className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-3 text-center">
            <Droplet className="w-5 h-5 mx-auto mb-1 text-[#A78BFA]" />
            <p className="text-lg font-extrabold text-white">{diet.fat}g</p>
            <p className="text-xs text-slate-400">Gorduras</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {Math.round(((diet.fat * 9) / diet.daily_calories) * 100)}% kcal
            </p>
          </div>
        </div>

        {/* Distribuição de refeições (estimativa visual) */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Distribuição sugerida
          </p>
          {mealDistribution.map((meal) => (
            <div key={meal.label} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-24 shrink-0">{meal.label}</span>
              <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FB923C] to-[#F97316]"
                  style={{ width: `${meal.pct * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-14 text-right font-mono">
                {Math.round(diet.daily_calories * meal.pct)} kcal
              </span>
            </div>
          ))}
        </div>

        {/* Receitas planejadas */}
        {recipes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#A3E635]" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Receitas planejadas
              </p>
            </div>
            <div className="space-y-2">
              {recipes.map((r) => {
                const imageUrl = getRecipeImageUrl(r)
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-2"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      {imageUrl ? (
                        <img src={imageUrl} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#A3E635]/30 to-[#65A30D]/10 flex items-center justify-center">
                          <Flame className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{r.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-0.5 text-[#FB923C]">
                          <Flame className="w-3 h-3" /> {r.calories} kcal
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[#A3E635]">
                          <Beef className="w-3 h-3" /> {r.protein}g
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[#22D3EE]">
                          <Wheat className="w-3 h-3" /> {r.carbs}g
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[#A78BFA]">
                          <Droplet className="w-3 h-3" /> {r.fat}g
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-[#262635]">
          <span className="text-xs text-slate-500">
            Plano gerado por IA — ajuste com um nutricionista se necessário.
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DietDetailDialog
