import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Flame,
  Clock,
  Users,
  Beef,
  Wheat,
  Droplet,
  ListChecks,
  ChefHat,
  Plus,
  Loader2,
} from 'lucide-react'
import {
  type RecipeRecord,
  type RecipeCategory,
  RECIPE_CATEGORY_LABELS,
  RECIPE_CATEGORY_STYLES,
  getRecipeImageUrl,
  parseIngredients,
  parseInstructions,
  getRecipeCompatibility,
  addRecipeToDiet,
} from '@/services/recipes'
import type { DietRecord } from '@/services/diets'
import { useToast } from '@/hooks/use-toast'

interface RecipeDetailDialogProps {
  recipe: RecipeRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  diet: DietRecord | null
  onAddedToDiet?: () => void
}

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
  diet,
  onAddedToDiet,
}: RecipeDetailDialogProps) {
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)

  if (!recipe) return null

  const style = RECIPE_CATEGORY_STYLES[recipe.category as RecipeCategory]
  const imageUrl = getRecipeImageUrl(recipe)
  const ingredients = parseIngredients(recipe.ingredients)
  const instructions = parseInstructions(recipe.instructions)
  const compatibility = getRecipeCompatibility(recipe, diet)

  const totalCalories = recipe.calories * recipe.servings
  const totalProtein = recipe.protein * recipe.servings
  const totalCarbs = recipe.carbs * recipe.servings
  const totalFat = recipe.fat * recipe.servings

  async function handleAddToDiet() {
    if (!diet || !recipe) return
    setAdding(true)
    try {
      await addRecipeToDiet(diet.id, recipe.id)
      toast({
        title: 'Receita adicionada à sua dieta!',
        description: `${recipe.name} foi incluída no plano "${diet.title}".`,
      })
      onAddedToDiet?.()
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha desconhecida.'
      toast({
        title: 'Erro ao adicionar receita',
        description: message || 'Não foi possível adicionar a receita à dieta.',
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cabeçalho com imagem */}
        <div className="relative h-52 w-full overflow-hidden shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={recipe.name} className="h-full w-full object-cover" />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${style.grad} flex items-center justify-center`}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <Flame className="w-8 h-8 text-white/80" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-[#12121A]/40 to-transparent" />
          <DialogHeader className="absolute bottom-0 left-0 right-0 p-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`border ${style.badge} font-semibold`}>
                {RECIPE_CATEGORY_LABELS[recipe.category as RecipeCategory]}
              </Badge>
              {compatibility === 'compativel' && (
                <Badge className="bg-[#A3E635] text-[#0B0B10] hover:bg-[#A3E635] font-bold">
                  Compatível com sua dieta
                </Badge>
              )}
              {compatibility === 'acima' && (
                <Badge className="bg-[#FB923C] text-[#0B0B10] hover:bg-[#FB923C] font-bold">
                  Acima da meta
                </Badge>
              )}
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white leading-tight drop-shadow">
              {recipe.name}
            </DialogTitle>
            <DialogDescription className="text-slate-300 mt-1 line-clamp-2">
              {recipe.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Infotags tempo e porções */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0B10] border border-[#262635] px-3 py-1.5 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-[#A3E635]" />
              {recipe.prep_time} min de preparo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0B10] border border-[#262635] px-3 py-1.5 text-xs text-slate-300">
              <Users className="w-3.5 h-3.5 text-[#A3E635]" />
              {recipe.servings} porç{recipe.servings > 1 ? 'ões' : 'ão'}
            </span>
          </div>

          {/* Painel de Ficha Técnica Nutricional */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FB923C]" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Ficha Técnica Nutricional
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NutritionCard
                icon={<Flame className="w-5 h-5" />}
                color="text-[#FB923C]"
                bg="bg-[#FB923C]/10"
                label="Calorias"
                perServing={`${recipe.calories}`}
                unit="kcal"
                total={`${totalCalories} kcal`}
              />
              <NutritionCard
                icon={<Beef className="w-5 h-5" />}
                color="text-[#A3E635]"
                bg="bg-[#A3E635]/10"
                label="Proteínas"
                perServing={`${recipe.protein}g`}
                unit=""
                total={`${totalProtein}g total`}
              />
              <NutritionCard
                icon={<Wheat className="w-5 h-5" />}
                color="text-[#22D3EE]"
                bg="bg-[#22D3EE]/10"
                label="Carboidratos"
                perServing={`${recipe.carbs}g`}
                unit=""
                total={`${totalCarbs}g total`}
              />
              <NutritionCard
                icon={<Droplet className="w-5 h-5" />}
                color="text-[#A78BFA]"
                bg="bg-[#A78BFA]/10"
                label="Gorduras"
                perServing={`${recipe.fat}g`}
                unit=""
                total={`${totalFat}g total`}
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#A3E635]" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Ingredientes
              </h3>
            </div>
            <ul className="space-y-1.5">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A3E635] shrink-0" />
                  <span>
                    <span className="font-medium text-white">{ing.name}</span>
                    {ing.quantity && <span className="text-slate-400"> — {ing.quantity}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Modo de Preparo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#FB923C]" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Modo de Preparo
              </h3>
            </div>
            <ol className="space-y-3">
              {instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#A3E635] text-[#0B0B10] text-xs font-extrabold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Rodapé com ação */}
        {diet && (
          <div className="border-t border-[#262635] p-4 bg-[#0B0B10]/60 shrink-0">
            <Button
              onClick={handleAddToDiet}
              disabled={adding}
              className="w-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:shadow-[#A3E635]/40 hover:scale-[1.01] transition-all h-11"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Adicionar à Dieta
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface NutritionCardProps {
  icon: React.ReactNode
  color: string
  bg: string
  label: string
  perServing: string
  unit: string
  total: string
}

function NutritionCard({ icon, color, bg, label, perServing, unit, total }: NutritionCardProps) {
  return (
    <div className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-3 flex flex-col items-center text-center">
      <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className={`text-xl font-extrabold ${color}`}>
        {perServing}
        {unit && <span className="text-xs text-slate-400 ml-0.5">{unit}</span>}
      </p>
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-[10px] text-slate-500 mt-1">por porção</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{total}</p>
    </div>
  )
}

export default RecipeDetailDialog
