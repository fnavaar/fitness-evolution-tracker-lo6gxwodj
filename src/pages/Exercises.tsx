import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Library, AlertTriangle, RefreshCw, X, Dumbbell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getExercises,
  MUSCLE_GROUP_FILTERS,
  type ExerciseRecord,
  type MuscleGroup,
} from '@/services/exercises'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExerciseCard, ExerciseCardSkeleton } from '@/components/exercises/ExerciseCard'
import { ExerciseDetailDialog } from '@/components/exercises/ExerciseDetailDialog'

type FilterValue = 'todos' | MuscleGroup

export default function Exercises() {
  const { toast } = useToast()

  const [exercises, setExercises] = useState<ExerciseRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterValue>('todos')

  const [selected, setSelected] = useState<ExerciseRecord | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(false)
    try {
      const list = await getExercises()
      setExercises(list)
    } catch (err) {
      console.error('Erro ao carregar exercícios:', err)
      setError(true)
      toast({
        title: 'Erro ao carregar exercícios',
        description: 'Não foi possível buscar os exercícios. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  // Realtime: atualiza a lista quando exercícios mudam no banco.
  useRealtime('exercises', () => {
    getExercises(search, filter)
      .then(setExercises)
      .catch(() => {})
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return exercises.filter((e) => {
      const matchesGroup = filter === 'todos' || e.muscle_group === filter
      if (!matchesGroup) return false
      if (!term) return true
      const inName = e.name.toLowerCase().includes(term)
      const inInstructions = (e.instructions || '').toLowerCase().includes(term)
      const inDescription = (e.description || '').toLowerCase().includes(term)
      return inName || inInstructions || inDescription
    })
  }, [exercises, search, filter])

  const hasFilters = search.trim() !== '' || filter !== 'todos'

  const clearFilters = () => {
    setSearch('')
    setFilter('todos')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
          <Library className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Biblioteca de Exercícios
          </h1>
          <p className="text-sm text-slate-400">
            Explore nossa coleção completa de exercícios com instruções detalhadas
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      {error && !isLoading ? (
        <ErrorState onRetry={load} />
      ) : isLoading ? (
        <>
          <SearchSkeleton />
          <LoadingState />
        </>
      ) : exercises.length === 0 ? (
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
                placeholder="Buscar por nome ou descrição..."
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
              {MUSCLE_GROUP_FILTERS.map((f) => {
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

          {/* Contador */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              <span className="font-bold text-white">{filtered.length}</span>{' '}
              {filtered.length === 1 ? 'exercício encontrado' : 'exercícios encontrados'}
            </p>
          </div>

          {/* Grid de exercícios */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[#12121A] border border-[#262635] flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-slate-300 font-semibold">Nenhum exercício encontrado</p>
              <p className="text-sm text-slate-400 mt-1">
                Tente ajustar a busca ou o grupo muscular.
              </p>
              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="mt-3 text-[#A3E635] hover:text-[#84CC16] hover:bg-[#A3E635]/5"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((e) => (
                <ExerciseCard key={e.id} exercise={e} onOpen={setSelected} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      <ExerciseDetailDialog
        exercise={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  )
}

/* ----------------- Estados ----------------- */

function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ExerciseCardSkeleton key={i} />
      ))}
    </div>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-11 rounded-xl bg-[#12121A] border border-[#262635]" />
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-[#12121A] border border-[#262635]" />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-10 md:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center mx-auto mb-4">
        <Dumbbell className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white">Nenhum exercício disponível</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
        Ainda não há exercícios cadastrados na biblioteca. Volte em breve para novidades!
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
        Não foi possível carregar os exercícios. Verifique sua conexão e tente novamente.
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
