import { useCallback, useEffect, useState } from 'react'
import { LayoutDashboard, AlertTriangle, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { fetchDashboardData, type DashboardData } from '@/lib/dashboard'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { ChartsSection } from '@/components/dashboard/Charts'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { ProgressFormDialog } from '@/components/dashboard/ProgressFormDialog'
import { Button } from '@/components/ui/button'

const EMPTY_DATA: DashboardData = { progress: [], workoutLogs: [], diets: [], profile: null }

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [data, setData] = useState<DashboardData>(EMPTY_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(false)
    try {
      const result = await fetchDashboardData(user.id)
      setData(result)
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err)
      setError(true)
      toast({
        title: 'Erro ao carregar o dashboard',
        description: 'Não foi possível buscar seus dados. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    load()
  }, [load])

  // Atualizações em tempo real — reflete progresso, treinos e dietas.
  const handleRealtime = () => {
    load()
  }
  useRealtime('progress', handleRealtime)
  useRealtime('workout_logs', handleRealtime)
  useRealtime('diets', handleRealtime)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white break-words">
              {greeting()}, {firstName(user?.name)} 👋
            </h1>
            <p className="text-sm text-slate-400">Visão geral da sua evolução fitness</p>
          </div>
        </div>

        <Button
          onClick={() => setProgressOpen(true)}
          className="bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Registrar progresso
        </Button>
      </div>

      {/* Estado de erro com retry */}
      {error && !isLoading ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Algo deu errado</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.
          </p>
          <Button
            onClick={load}
            className="mt-4 bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl"
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <SummaryCards data={data} isLoading={isLoading} />

          {/* Charts */}
          <ChartsSection data={data} isLoading={isLoading} />

          {/* Quick Actions */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">Ações rápidas</h2>
            <QuickActions />
          </section>
        </>
      )}

      {/* Dialog de registro de progresso */}
      <ProgressFormDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        onSaved={load}
        defaultWeight={data.profile?.current_weight ?? null}
      />
    </div>
  )
}

/* ---------------- helpers de UI ---------------- */

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(name?: string): string {
  if (!name) return 'atleta'
  return name.trim().split(/\s+/)[0]
}
