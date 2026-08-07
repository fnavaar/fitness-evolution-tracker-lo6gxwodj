import { useState } from 'react'
import { Dumbbell, Check, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { CoachDraft } from '@/services/coachDrafts'

interface ProposalCardProps {
  draft: CoachDraft
  onConfirm: (id: string) => Promise<void>
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

export function ProposalCard({ draft, onConfirm, onDiscard }: ProposalCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<'confirm' | 'discard' | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const payload = (draft.payload || {}) as {
    title?: string
    description?: string
    goal?: string
    days_per_week?: number
    exercises?: DraftExercise[]
  }

  const title = payload.title || 'Proposta de treino'
  const description = payload.description || ''
  const goal = payload.goal ? GOAL_LABELS[payload.goal] || payload.goal : ''
  const days = typeof payload.days_per_week === 'number' ? payload.days_per_week : null
  const exercises = Array.isArray(payload.exercises) ? payload.exercises : []

  const handleConfirm = async () => {
    setLoading('confirm')
    try {
      await onConfirm(draft.id)
      setConfirmed(true)
      toast({
        title: 'Treino adicionado!',
        description: 'O plano foi salvo nos seus treinos com status "pendente".',
      })
    } catch (err) {
      toast({
        title: 'Erro ao confirmar treino',
        description:
          err instanceof Error
            ? err.message
            : 'Não foi possível confirmar o treino. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

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
          Proposta de treino
        </span>
        {confirmed && (
          <span className="flex items-center gap-1.5 rounded-full bg-[#A3E635] px-2.5 py-1 text-[11px] font-bold text-[#0B0B10] uppercase tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Adicionado aos seus treinos
          </span>
        )}
      </div>

      {/* Corpo */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-extrabold text-white leading-tight">{title}</h3>
          {(goal || days) && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {goal && (
                <span className="rounded-md bg-[#262635] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {goal}
                </span>
              )}
              {days && (
                <span className="rounded-md bg-[#262635] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  {days}x/semana
                </span>
              )}
            </div>
          )}
        </div>

        {description && <p className="text-sm text-slate-400 leading-relaxed">{description}</p>}

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

        {/* Ações */}
        {!confirmed && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading !== null}
              className="bg-[#A3E635] text-[#0B0B10] hover:bg-[#A3E635]/90 font-bold"
            >
              {loading === 'confirm' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar
            </Button>
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
        )}
      </div>
    </div>
  )
}
