import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Clock, Calendar, Repeat, Timer } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  type WorkoutRecord,
  type WorkoutStatus,
  STATUS_LABELS,
  GOAL_LABELS,
  MUSCLE_GROUP_LABELS,
} from '@/services/workouts'

interface WorkoutDetailDialogProps {
  workout: WorkoutRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_BADGE: Record<WorkoutStatus, string> = {
  pendente: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  em_andamento: 'bg-[#FB923C]/15 text-[#FB923C] border-[#FB923C]/20',
  concluido: 'bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/20',
}

export function WorkoutDetailDialog({ workout, open, onOpenChange }: WorkoutDetailDialogProps) {
  if (!workout) return null

  const exercises = (workout.expand?.workout_exercises || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const createdLabel = format(new Date(workout.created), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-extrabold text-white leading-tight">
                {workout.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400 mt-1">
                {workout.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Metadados */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={`border ${STATUS_BADGE[workout.status || 'pendente']}`}
          >
            {STATUS_LABELS[workout.status || 'pendente']}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {GOAL_LABELS[workout.goal]}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            <Calendar className="w-3 h-3 mr-1" />
            {createdLabel}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            <Repeat className="w-3 h-3 mr-1" />
            {workout.days_per_week}x/semana
          </Badge>
        </div>

        {/* Lista de exercícios */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {exercises.map((item, idx) => {
            const ex = item.expand?.exercise_id
            return (
              <div key={item.id} className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 shrink-0 rounded-md bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">{ex?.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 pl-8">
                      {ex ? MUSCLE_GROUP_LABELS[ex.muscle_group] : ''} ·{' '}
                      <span className="capitalize">{ex?.equipment?.replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pl-8">
                  <Badge variant="outline" className="border-[#262635] bg-[#12121A] text-slate-200">
                    <Dumbbell className="w-3 h-3 mr-1" />
                    {item.sets} séries
                  </Badge>
                  <Badge variant="outline" className="border-[#262635] bg-[#12121A] text-slate-200">
                    <Repeat className="w-3 h-3 mr-1" />
                    {item.reps} reps
                  </Badge>
                  <Badge variant="outline" className="border-[#262635] bg-[#12121A] text-slate-200">
                    <Timer className="w-3 h-3 mr-1" />
                    {item.rest_time}s descanso
                  </Badge>
                </div>

                {ex?.instructions && (
                  <p className="text-xs text-slate-400 leading-relaxed mt-3 pl-8">
                    {ex.instructions}
                  </p>
                )}
              </div>
            )
          })}

          {exercises.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 italic">
                Nenhum exercício vinculado a este treino.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262635]">
          <span className="text-xs text-slate-500 flex items-center gap-1 mr-auto">
            <Clock className="w-3 h-3" />
            {exercises.length} exercício(s)
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default WorkoutDetailDialog
