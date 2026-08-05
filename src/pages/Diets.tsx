import { useCallback, useEffect, useMemo, useState } from 'react'
import { UtensilsCrossed, Sparkles, AlertTriangle, RefreshCw, ListPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { fetchUserDiets, type DietRecord, type DietGoal, DIET_GOAL_LABELS } from '@/services/diets'
import { Button } from '@/components/ui/button'
import { DietCard, DietCardSkeleton } from '@/components/diets/DietCard'
import { GenerateDietDialog } from '@/components/diets/GenerateDietDialog'
import { DietDetailDialog } from '@/components/diets/DietDetailDialog'

type FilterValue = 'todas' | DietGoal

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'resistencia', label: 'Força' },
  { value: 'condicionamento', label: 'Condicionamento' },
]

export default function Diets() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [diets, setDiets] = useState<DietRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const [filter, setFilter] = useState<FilterValue>('todas')

  const [generateOpen, setGenerateOpen] = useState(false)
  const [selected, setSelected] = useState<DietRecord | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(false)
    try {
      const result = await fetchUserDiets(user.id)
      setDiets(result)
    } catch (err) {
      console.error('Erro ao carregar dietas:', err)
      setError(true)
      toast({
        title: 'Erro ao carregar dietas',
        description: 'Não foi possível buscar suas dietas. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    load()
  }, [load])

  // Atualização em tempo real na coleção diets.
  useRealtime('diets', () => {
    load()
  })

  const filtered = useMemo(() => {
    if (filter === 'todas') return diets
    return diets.filter((d) => d.goal === filter)
  }, [diets, filter])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Minhas Dietas
            </h1>
            <p className="text-sm text-slate-400">
              Planos alimentares personalizados com macros calculados por IA.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setGenerateOpen(true)}
          className="bg-[#FB923C] hover:bg-[#F97316] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#FB923C]/20 hover:shadow-[#FB923C]/40 hover:scale-[1.02] transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Gerar Dieta com IA
        </Button>
      </div>

      {/* Conteúdo */}
      {error && !isLoading ? (
        <ErrorState onRetry={load} />
      ) : isLoading ? (
        <LoadingState />
      ) : diets.length === 0 ? (
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
                      ? 'bg-[#FB923C] text-[#0B0B10] border-[#FB923C] shadow-md shadow-[#FB923C]/20'
                      : 'bg-[#12121A] text-slate-300 border-[#262635] hover:border-[#FB923C]/40 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Grid de dietas */}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400">
                Nenhuma dieta encontrada para o filtro{' '}
                <span className="text-white font-semibold">
                  “{DIET_GOAL_LABELS[filter as DietGoal]}”
                </span>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((d) => (
                <DietCard key={d.id} diet={d} onSeeDetails={setSelected} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modais */}
      <GenerateDietDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={() => load()}
      />
      <DietDetailDialog
        diet={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  )
}

/* ----------------- Estados ----------------- */

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[0, 1, 2].map((i) => (
        <DietCardSkeleton key={i} />
      ))}
    </div>
  )
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-10 md:p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center mx-auto mb-4">
        <ListPlus className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white">Nenhuma dieta ainda</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
        Gere sua primeira dieta com IA e receba um plano com macros calculados para o seu objetivo.
      </p>
      <Button
        onClick={onGenerate}
        className="mt-5 bg-[#FB923C] hover:bg-[#F97316] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#FB923C]/20 hover:shadow-[#FB923C]/40 hover:scale-[1.02] transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Gerar Dieta com IA
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
        Não foi possível carregar suas dietas. Verifique sua conexão e tente novamente.
      </p>
      <Button
        onClick={onRetry}
        className="mt-4 bg-[#FB923C] hover:bg-[#F97316] text-[#0B0B10] font-bold rounded-xl"
      >
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </Button>
    </div>
  )
}
