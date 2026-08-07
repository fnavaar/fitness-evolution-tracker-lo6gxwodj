import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dumbbell, Sparkles, AlertTriangle, RefreshCw, ListPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  fetchUserWorkouts,
  type WorkoutRecord,
  type WorkoutGoal,
  GOAL_LABELS,
} from '@/services/workouts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkoutCard } from '@/components/workouts/WorkoutCard'
import { GenerateWorkoutDialog } from '@/components/workouts/GenerateWorkoutDialog'
import { WorkoutDetailDialog } from '@/components/workouts/WorkoutDetailDialog'

type FilterValue = 'todos' | WorkoutGoal

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'resistencia', label: 'Força' },
  { value: 'condicionamento', label: 'Condicionamento' },
]

export default function Workouts() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [filter, setFilter] = useState<FilterValue>('todos')

  const [generateOpen, setGenerateOpen] = useState(false)
  const [selected, setSelected] = useState<WorkoutRecord | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(false)
    try {
      const result = await fetchUserWorkouts(user.id)
      setWorkouts(result)
      // Sincroniza o treino selecionado com a lista recarregada (realtime/mutações),
      // ou fecha o detalhe caso tenha sido excluído.
      setSelected((prev) => (prev ? (result.find((w) => w.id === prev.id) ?? null) : null))
    } catch (err) {
      console.error('Erro ao carregar treinos:', err)
      setError(true)
      toast({
        title: 'Erro ao carregar treinos',
        description: 'Não foi possível buscar seus treinos. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    load()
  }, [load])

  // Atualização em tempo real nas coleções workouts e workout_exercises.
  useRealtime('workouts', () => {
    load()
  })
  useRealtime('workout_exercises', () => {
    load()
  })

  const filtered = useMemo(() => {
    if (filter === 'todos') return workouts
    return workouts.filter((w) => w.goal === filter)
  }, [workouts, filter])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Meus Treinos
            </h1>
            <p className="text-sm text-slate-400">
              Crie, acompanhe e evolua seus planos de treino personalizados.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setGenerateOpen(true)}
          className="bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:shadow-[#A3E635]/40 hover:scale-[1.02] transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Gerar Treino com IA
        </Button>
      </div>

      {/* Conteúdo */}
      {error && !isLoading ? (
        <ErrorState onRetry={load} />
      ) : isLoading ? (
        <LoadingState />
      ) : workouts.length === 0 ? (
        <EmptyState onGenerate={() => setGenerateOpen(true)} />
      ) : (
        <>
          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
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

          {/* Grid de treinos */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400">
                Nenhum treino encontrado para o filtro{' '}
                <span className="text-white font-semibold">
                  “{GOAL_LABELS[filter as WorkoutGoal]}”
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((w) => (
                <WorkoutCard key={w.id} workout={w} onSeeDetails={setSelected} onDeleted={load} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <GenerateWorkoutDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={() => load()}
      />
      <WorkoutDetailDialog
        workout={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        onMutated={load}
      />
    </div>
  )
}

/* ----------------- Estados ----------------- */

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-[#262635] bg-[#12121A] p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-xl bg-[#1A1A24]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-[#1A1A24]" />
              <Skeleton className="h-3 w-1/2 bg-[#1A1A24]" />
            </div>
          </div>
          <Skeleton className="h-3 w-full bg-[#1A1A24]" />
          <Skeleton className="h-3 w-5/6 bg-[#1A1A24]" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full bg-[#1A1A24]" />
            <Skeleton className="h-9 w-full bg-[#1A1A24]" />
            <Skeleton className="h-9 w-full bg-[#1A1A24]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-10 md:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center mx-auto mb-4">
        <ListPlus className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white">Nenhum treino ainda</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
        Que tal gerar seu primeiro treino com IA? Leva poucos segundos e fica pronto para começar.
      </p>
      <Button
        onClick={onGenerate}
        className="mt-5 bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:shadow-[#A3E635]/40 hover:scale-[1.02] transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Gerar Treino com IA
      </Button>
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
        Não foi possível carregar seus treinos. Verifique sua conexão e tente novamente.
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
