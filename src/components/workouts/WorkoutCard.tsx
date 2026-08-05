import { memo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dumbbell,
  ChevronRight,
  Heart,
  ArrowLeftRight,
  Bike,
  Shield,
  Armchair,
  Flame,
  Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  type WorkoutRecord,
  type WorkoutStatus,
  type MuscleGroup,
  STATUS_LABELS,
  GOAL_LABELS,
  MUSCLE_GROUP_LABELS,
} from '@/services/workouts'

interface WorkoutCardProps {
  workout: WorkoutRecord
  onSeeDetails: (workout: WorkoutRecord) => void
}

const MUSCLE_ICON: Record<MuscleGroup, LucideIcon> = {
  peito: Heart,
  costas: ArrowLeftRight,
  pernas: Bike,
  ombros: Shield,
  bracos: Dumbbell,
  core: Layers,
  gluteos: Flame,
}

const STATUS_BADGE: Record<WorkoutStatus, string> = {
  pendente: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
  em_andamento: 'bg-[#FB923C]/15 text-[#FB923C] border-[#FB923C]/20',
  concluido: 'bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/20',
}

const GOAL_ACCENT: Record<string, string> = {
  hipertrofia: 'bg-[#A3E635]/10 text-[#A3E635]',
  emagrecimento: 'bg-[#FB923C]/10 text-[#FB923C]',
  condicionamento: 'bg-[#22D3EE]/10 text-[#22D3EE]',
  resistencia: 'bg-[#A78BFA]/10 text-[#A78BFA]',
}

function WorkoutCardBase({ workout, onSeeDetails }: WorkoutCardProps) {
  const exercises = (workout.expand?.workout_exercises || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)

  const primaryMuscle = exercises[0]?.expand?.exercise_id?.muscle_group || 'pernas'
  const MuscleIcon = MUSCLE_ICON[primaryMuscle] || Dumbbell

  const createdLabel = format(new Date(workout.created), "dd 'de' MMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <Card className="group relative flex flex-col bg-[#12121A] border-[#262635] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#A3E635]/30 hover:shadow-lg hover:shadow-[#A3E635]/5 hover:-translate-y-1">
      <CardContent className="p-5 flex flex-col h-full gap-4">
        {/* Cabeçalho do card */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
              GOAL_ACCENT[workout.goal] || 'bg-[#A3E635]/10 text-[#A3E635]'
            }`}
            title={MUSCLE_GROUP_LABELS[primaryMuscle]}
          >
            <MuscleIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
              {workout.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{createdLabel}</p>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 border ${STATUS_BADGE[workout.status || 'pendente']}`}
          >
            {STATUS_LABELS[workout.status || 'pendente']}
          </Badge>
        </div>

        {/* Descrição */}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{workout.description}</p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {GOAL_LABELS[workout.goal]}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            <Dumbbell className="w-3 h-3 mr-1" />
            {exercises.length} exercícios
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {workout.days_per_week}x/semana
          </Badge>
        </div>

        {/* Lista de exercícios */}
        <div className="space-y-1.5 flex-1">
          {exercises.slice(0, 4).map((item) => {
            const ex = item.expand?.exercise_id
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg bg-[#0B0B10]/60 border border-[#262635]/60"
              >
                <span className="text-xs font-medium text-slate-200 truncate">
                  {ex?.name || 'Exercício'}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {item.sets}x{item.reps}
                </span>
              </div>
            )
          })}
          {exercises.length > 4 && (
            <p className="text-[11px] text-slate-500 pl-3 pt-0.5">
              + {exercises.length - 4} exercício(s)
            </p>
          )}
          {exercises.length === 0 && (
            <p className="text-xs text-slate-500 italic">Nenhum exercício vinculado.</p>
          )}
        </div>

        {/* Ação */}
        <Button
          variant="ghost"
          onClick={() => onSeeDetails(workout)}
          className="w-full justify-between text-slate-300 hover:text-[#A3E635] hover:bg-[#A3E635]/5 rounded-xl h-10 font-semibold"
        >
          Ver detalhes
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

export const WorkoutCard = memo(WorkoutCardBase)
export default WorkoutCard
