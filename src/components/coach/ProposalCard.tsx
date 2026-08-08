import { useState } from 'react'
import { Dumbbell, ArrowRight, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { CoachDraft } from '@/services/coachDrafts'

interface ProposalCardProps {
  draft: CoachDraft
  /** Mantido por compatibilidade — o processamento é automático agora. */
  onConfirm?: (id: string) => Promise<void>
  onDiscard: (id: string) => Promise<void>
}

interface DraftExercise {
  name?: string
  sets?: number
  reps?: string
  rest_time?: number
  muscle_group?: string
  equipment?: string
  difficulty?: string
}

const GOAL_LABELS: Record<string, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento',
  resistencia: 'Resistência',
}

const DAY_LABELS: Record<string, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

const TYPE_LABELS: Record<string, string> = {
  full_body: 'Full body',
  upper: 'Parte superior',
  lower: 'Parte inferior',
  push: 'Push',
  pull: 'Pull',
  legs: 'Pernas',
  cardio: 'Cardio',
  mobilidade: 'Mobilidade',
  core: 'Core',
}

export function ProposalCard({ draft, onDiscard }: ProposalCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<'discard' | null>(null)

  const payload = (draft.payload || {}) as {
    title?: string
    description?: string
    goal?: string
    days_per_week?: number
    exercises?: DraftExercise[]
    days?: Array<{
      day_of_week?: string
      workout_type?: string
      title?: string
      exercises?: DraftExercise[]
    }>
  }

  const title = payload.title || 'Proposta de treino'
  const description = payload.description || ''
  const goal = payload.goal ? GOAL_LABELS[payload.goal] || payload.goal : ''
  const daysPerWeek = typeof payload.days_per_week === 'number' ? payload.days_per_week : null
  const days = Array.isArray(payload.days) ? payload.days : []
  const exercises =
    days.length > 0 && Array.isArray(days[0]?.exercises)
      ? days[0].exercises
      : Array.isArray(payload.exercises)
        ? payload.exercises
        : []

  const handleDiscard = async () => {
    setLoading('discard')
    try {
      await onDiscard(draft.id)
      toast({
        title: 'Proposta descartada',
        description: 'Você pode pedir um novo plano ao Coach quando quiser.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao descartar',
        description:
          err instanceof Error ? err.message : 'Não foi possível descartar. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-2xl border border-[#262635] bg-[#1A1A24] overflow-hidden">
      {/* Header / badge */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#262635] bg-[#12121A]">
        <span className="flex items-center gap-1.5 rounded-full bg-[#A3E635]/15 px-2.5 py-1 text-[11px] font-bold text-[#A3E635] uppercase tracking-wide">
          <Dumbbell className="w-3.5 h-3.5" />
          {days.length > 1 ? 'Proposta de semana' : 'Proposta de treino'}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#A3E635] px-2.5 py-1 text-[11px] font-bold text-[#0B0B10] uppercase tracking-wide">
          <ArrowRight className="w-3.5 h-3.5" />
          Enviado ao Especialista
        </span>
      </div>

      {/* Corpo */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-extrabold text-white leading-tight">{title}</h3>
          {(goal || daysPerWeek) && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {goal && (
                <span className="rounded-md bg-[#262635] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {goal}
                </span>
              )}
              {daysPerWeek && (
                <span className="rounded-md bg-[#262635] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {daysPerWeek}x/semana
                </span>
              )}
            </div>
          )}
        </div>

        {description && <p className="text-sm text-slate-400 leading-relaxed">{description}</p>}

        {days.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {days.map((day, index) => (
              <div
                key={day.day_of_week || index}
                className="rounded-lg border border-[#262635] bg-[#0B0B10]/60 px-3 py-2"
              >
                <p className="text-xs font-bold text-white">
                  {DAY_LABELS[day.day_of_week || ''] || 'Sessão ' + (index + 1)}
                </p>
                <p className="text-[11px] text-slate-400">
                  {TYPE_LABELS[day.workout_type || ''] || 'Treino personalizado'}
                </p>
                {day.title && <p className="mt-1 text-[11px] text-slate-500">{day.title}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Resumo dos exercícios */}
        {exercises.length > 0 && (
          <ul className="space-y-1.5">
            {exercises.map((ex, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#0B0B10]/60 px-3 py-1.5"
              >
                <span className="text-sm font-medium text-slate-200 truncate">
                  {ex.name || `Exercício ${i + 1}`}
                </span>
                <span className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 tabular-nums">
                  {typeof ex.sets === 'number' && (
                    <span>
                      {ex.sets}
                      <span className="text-slate-600">×</span>
                      {ex.reps || ''}
                    </span>
                  )}
                  {typeof ex.rest_time === 'number' && (
                    <span className="text-slate-500">{ex.rest_time}s descanso</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Aviso de processamento automático */}
        <div className="rounded-lg border border-[#A3E635]/25 bg-[#A3E635]/10 px-3 py-2.5">
          <p className="text-xs text-[#ECFCCB] leading-relaxed">
            Plano de treino enviado para o Especialista. Confira em{' '}
            <span className="font-bold">/treinos</span>!
          </p>
        </div>

        {/* Ações — apenas descartar (processamento é automático) */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDiscard}
            disabled={loading !== null}
            className="text-slate-300 hover:bg-[#262635] hover:text-white border border-[#262635]"
          >
            {loading === 'discard' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            Descartar
          </Button>
        </div>
      </div>
    </div>
  )
}
