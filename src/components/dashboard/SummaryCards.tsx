import { memo } from 'react'
import { Scale, Activity, ArrowDown, Dumbbell, UtensilsCrossed, Flame } from 'lucide-react'
import { SummaryCard } from './SummaryCard'
import {
  buildWeightSummary,
  countWorkoutsThisWeek,
  computeStreak,
  type DashboardData,
} from '@/lib/dashboard'

interface SummaryCardsProps {
  data: DashboardData
  isLoading: boolean
}

function WeightCard({ data, isLoading }: SummaryCardsProps) {
  const summary = buildWeightSummary(data.progress, data.profile?.current_weight ?? null)

  let hint: string | undefined
  let hintTone: 'positive' | 'negative' | 'neutral' = 'neutral'
  if (summary.delta !== null && summary.hasComparison) {
    const abs = Math.abs(summary.delta).toFixed(1)
    const lost = summary.delta < 0
    hint = `${lost ? '−' : '+'}${abs}kg este mês`
    hintTone = lost ? 'positive' : 'negative'
  } else if (summary.current !== null && data.progress.length === 0) {
    hint = 'Do seu perfil'
    hintTone = 'neutral'
  }

  return (
    <SummaryCard
      icon={summary.delta !== null && summary.delta < 0 ? ArrowDown : Scale}
      label="Peso Atual"
      value={summary.current !== null ? `${summary.current.toFixed(1)} kg` : '—'}
      hint={hint}
      hintTone={hintTone}
      accent="lime"
      isLoading={isLoading}
    />
  )
}

function WorkoutsCard({ data, isLoading }: SummaryCardsProps) {
  const count = countWorkoutsThisWeek(data.workoutLogs)
  const frequency = data.profile?.training_frequency
  const hasFrequency = typeof frequency === 'number' && frequency > 0

  let hint: string
  let hintTone: 'positive' | 'negative' | 'neutral'
  if (count > 0) {
    hint = 'Nos últimos 7 dias'
    hintTone = 'positive'
  } else if (hasFrequency) {
    hint = `Meta: ${frequency}x por semana`
    hintTone = 'neutral'
  } else {
    hint = 'Sem registros na semana'
    hintTone = 'neutral'
  }

  return (
    <SummaryCard
      icon={Dumbbell}
      label="Treinos Esta Semana"
      value={String(count)}
      hint={hint}
      hintTone={hintTone}
      accent="orange"
      isLoading={isLoading}
    />
  )
}

function DietCard({ data, isLoading }: SummaryCardsProps) {
  const latest = data.diets[0]
  return (
    <SummaryCard
      icon={UtensilsCrossed}
      label="Dieta Atual"
      value={latest ? latest.title : 'Nenhuma dieta ativa'}
      hint={latest ? `${latest.daily_calories} kcal / dia` : 'Crie uma dieta para começar'}
      hintTone={latest ? 'positive' : 'neutral'}
      accent="cyan"
      isLoading={isLoading}
    />
  )
}

function StreakCard({ data, isLoading }: SummaryCardsProps) {
  const streak = computeStreak(data.workoutLogs)
  return (
    <SummaryCard
      icon={streak > 0 ? Flame : Activity}
      label="Sequência (Streak)"
      value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`}
      hint={streak > 0 ? 'Mantenha o ritmo!' : 'Treine hoje para começar'}
      hintTone={streak > 0 ? 'positive' : 'neutral'}
      accent={streak > 0 ? 'orange' : 'violet'}
      isLoading={isLoading}
    />
  )
}

function SummaryCardsBase({ data, isLoading }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <WeightCard data={data} isLoading={isLoading} />
      <WorkoutsCard data={data} isLoading={isLoading} />
      <DietCard data={data} isLoading={isLoading} />
      <StreakCard data={data} isLoading={isLoading} />
    </div>
  )
}

export const SummaryCards = memo(SummaryCardsBase)
export default SummaryCards
