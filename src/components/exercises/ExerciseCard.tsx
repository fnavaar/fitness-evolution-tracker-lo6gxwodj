import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dumbbell } from 'lucide-react'
import {
  type ExerciseRecord,
  type MuscleGroup,
  type Equipment,
  type Difficulty,
  MUSCLE_GROUP_LABELS,
  MUSCLE_GROUP_STYLES,
  MUSCLE_GROUP_EMOJIS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_STYLES,
} from '@/services/exercises'

interface ExerciseCardProps {
  exercise: ExerciseRecord
  onOpen: (exercise: ExerciseRecord) => void
}

function ExerciseCardBase({ exercise, onOpen }: ExerciseCardProps) {
  const group = exercise.muscle_group as MuscleGroup
  const style = MUSCLE_GROUP_STYLES[group]
  const emoji = MUSCLE_GROUP_EMOJIS[group]

  return (
    <Card
      onClick={() => onOpen(exercise)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(exercise)
        }
      }}
      className={`group relative flex flex-col bg-[#12121A] border-[#262635] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:border-[#A3E635]/30 hover:shadow-[#A3E635]/10 ${style.glow}`}
    >
      {/* Cabeçalho ilustrado */}
      <div
        className={`relative h-28 w-full bg-gradient-to-br ${style.grad} flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className={`w-14 h-14 rounded-2xl ${style.iconBg} backdrop-blur-sm flex items-center justify-center text-3xl`}
          >
            <span aria-hidden>{emoji}</span>
          </div>
        </div>
        {/* Badge do grupo sobre o cabeçalho */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`backdrop-blur-md border ${style.badge} font-semibold`}
          >
            {MUSCLE_GROUP_LABELS[group]}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* Nome */}
        <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
          {exercise.name}
        </h3>

        {/* Descrição curta (usa instructions resumido) */}
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {exercise.instructions}
        </p>

        {/* Tags: equipamento + dificuldade */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#0B0B10] border border-[#262635] px-2 py-0.5 text-[11px] font-semibold text-slate-300">
            <Dumbbell className="w-3 h-3 text-[#A3E635]" />
            {EQUIPMENT_LABELS[exercise.equipment as Equipment]}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${DIFFICULTY_STYLES[exercise.difficulty as Difficulty]}`}
          >
            {DIFFICULTY_LABELS[exercise.difficulty as Difficulty]}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export const ExerciseCard = memo(ExerciseCardBase)
export default ExerciseCard

/* ----------------- Skeleton ----------------- */

export function ExerciseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] overflow-hidden animate-pulse">
      <Skeleton className="h-28 w-full bg-[#1A1A24]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-5/6 bg-[#1A1A24]" />
        <Skeleton className="h-3 w-full bg-[#1A1A24]" />
        <Skeleton className="h-3 w-4/6 bg-[#1A1A24]" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-20 bg-[#1A1A24]" />
          <Skeleton className="h-5 w-24 bg-[#1A1A24]" />
        </div>
      </div>
    </div>
  )
}
