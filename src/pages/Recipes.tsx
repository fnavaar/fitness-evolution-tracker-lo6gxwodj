import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, BookOpen, AlertTriangle, RefreshCw, X, Flame } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getRecipes,
  getActiveDiet,
  CATEGORY_FILTERS,
  type RecipeRecord,
  type RecipeCategory,
} from '@/services/recipes'
import type { DietRecord } from '@/services/diets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecipeCard, RecipeCardSkeleton } from '@/components/recipes/RecipeCard'
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog'

type FilterValue = 'todos' | RecipeCategory

export default function Recipes() {
  const { toast } = useToast()

  const [recipes, setRecipes] = useState<RecipeRecord[]>([])
  const [diet, setDiet] = useState<DietRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterValue>('todos')

  const [selected, setSelected] = useState<RecipeRecord | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(false)
    try {
      const [recipeList, activeDiet] = await Promise.all([getRecipes(), getActiveDiet()])
      setRecipes(recipeList)
      setDiet(activeDiet)
    } catch (err) {
      console.error('Erro ao carregar receitas:', err)
      setError(true)
      toast({
        title: 'Erro ao carregar receitas',
        description: 'Não foi possível buscar as receitas. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  // Realtime: atualiza cards quando receitas mudam e dieta quando muda.
  useRealtime('recipes', () => {
    getRecipes()
      .then(setRecipes)
      .catch(() => {})
  })
  useRealtime('diets', () => {
    getActiveDiet()
      .then(setDiet)
      .catch(() => {})
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return recipes.filter((r) => {
      const matchesCategory = filter === 'todos' || r.category === filter
      if (!matchesCategory) return false
      if (!term) return true
      const inName = r.name.toLowerCase().includes(term)
      const inIngredients = r.ingredients.toLowerCase().includes(term)
      return inName || inIngredients
    })
  }, [recipes, search, filter])

  const hasFilters = search.trim() !== '' || filter !== 'todos'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Receitas
          </h1>
          <p className="text-sm text-slate-400">
            Ideias fitness para adequar à sua dieta e atingir seus macros.
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      {error && !isLoading ? (
        <ErrorState onRetry={load} />
      ) : isLoading ? (
        <LoadingState />
      ) : recipes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Busca e filtros */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou ingrediente..."
                className="pl-10 pr-10 h-11 bg-[#12121A] border-[#262635] text-white placeholder:text-slate-500 rounded-xl focus-visible:border-[#A3E635]/50 focus-visible:ring-[#A3E635]/20"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((f) => {
                const active = filter === f.value
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                      active
                        ? 'bg-[#A3E635] text-[#0B0B10] border-[#A3E635] shadow-md shadow-[#A3E635]/20'
                        : 'bg-[#12121A] text-slate-300 border-[#262635] hover:border-[#A3E635]/40 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grid de receitas */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#12121A] border border-[#262635] flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-300 font-semibold">
                Nenhuma receita encontrada com esses filtros
              </p>
              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch('')
                    setFilter('todos')
                  }}
                  className="mt-3 text-[#A3E635] hover:text-[#84CC16] hover:bg-[#A3E635]/5"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((r) => (
                <RecipeCard key={r.id} recipe={r} diet={diet} onOpen={setSelected} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      <RecipeDetailDialog
        recipe={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        diet={diet}
        onAddedToDiet={() => {
          getActiveDiet()
            .then(setDiet)
            .catch(() => {})
        }}
      />
    </div>
  )
}

/* ----------------- Estados ----------------- */

function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-10 md:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center mx-auto mb-4">
        <Flame className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white">Nenhuma receita disponível</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
        Ainda não há receitas cadastradas. Volte em breve para novidades!
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-white">Algo deu errado</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
        Não foi possível carregar as receitas. Verifique sua conexão e tente novamente.
      </p>
      <Button
        onClick={onRetry}
        className="mt-4 bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl"
      >
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </Button>
    </div>
  )
}
