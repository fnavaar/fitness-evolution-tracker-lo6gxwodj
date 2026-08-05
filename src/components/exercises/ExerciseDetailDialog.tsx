import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, ListChecks, Target, Lightbulb, Gauge, Activity, Sparkles } from 'lucide-react'
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
  parseInstructions,
} from '@/services/exercises'

interface ExerciseDetailDialogProps {
  exercise: ExerciseRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExerciseDetailDialog({ exercise, open, onOpenChange }: ExerciseDetailDialogProps) {
  if (!exercise) return null

  const group = exercise.muscle_group as MuscleGroup
  const style = MUSCLE_GROUP_STYLES[group]
  const emoji = MUSCLE_GROUP_EMOJIS[group]
  const instructions = parseInstructions(exercise.instructions)

  // Músculos primários/secundários e dicas — opcionais no schema.
  const primaryMuscles = exercise.primary_muscles?.trim()
  const secondaryMuscles = exercise.secondary_muscles?.trim()
  const tips = exercise.tips?.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl max-w-2xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div
          className={`relative h-32 w-full overflow-hidden shrink-0 bg-gradient-to-br ${style.grad} flex items-center`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-[#12121A]/40 to-transparent" />
          <div className="relative px-5 pt-5 flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl ${style.iconBg} backdrop-blur-sm flex items-center justify-center text-4xl shrink-0`}
            >
              <span aria-hidden>{emoji}</span>
            </div>
          </div>
          <DialogHeader className="absolute bottom-0 left-0 right-0 p-5 pb-4 space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`border ${style.badge} font-semibold`}>
                {MUSCLE_GROUP_LABELS[group]}
              </Badge>
              <Badge
                variant="outline"
                className={`border ${DIFFICULTY_STYLES[exercise.difficulty as Difficulty]} font-semibold`}
              >
                {DIFFICULTY_LABELS[exercise.difficulty as Difficulty]}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-white leading-tight drop-shadow">
              {exercise.name}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Tags rápidas: equipamento + dificuldade */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0B10] border border-[#262635] px-3 py-1.5 text-xs text-slate-300">
              <Dumbbell className="w-3.5 h-3.5 text-[#A3E635]" />
              {EQUIPMENT_LABELS[exercise.equipment as Equipment]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B0B10] border border-[#262635] px-3 py-1.5 text-xs text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-[#A3E635]" />
              {DIFFICULTY_LABELS[exercise.difficulty as Difficulty]}
            </span>
          </div>

          {/* Instruções de execução */}
          {instructions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#A3E635]" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Instruções de Execução
                </h3>
              </div>
              <ol className="space-y-3">
                {instructions.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#A3E635] text-[#0B0B10] text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Músculos trabalhados */}
          {(primaryMuscles || secondaryMuscles) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#A3E635]" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Músculos Trabalhados
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {primaryMuscles && (
                  <MuscleBox
                    icon={<Activity className="w-4 h-4 text-[#A3E635]" />}
                    label="Primários"
                    value={primaryMuscles}
                  />
                )}
                {secondaryMuscles && (
                  <MuscleBox
                    icon={<Sparkles className="w-4 h-4 text-[#22D3EE]" />}
                    label="Secundários"
                    value={secondaryMuscles}
                  />
                )}
              </div>
            </div>
          )}

          {/* Dicas */}
          {tips && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#FB923C]" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Dicas
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed rounded-xl bg-[#0B0B10] border border-[#262635] p-4">
                {tips}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface MuscleBoxProps {
  icon: React.ReactNode
  label: string
  value: string
}

function MuscleBox({ icon, label, value }: MuscleBoxProps) {
  return (
    <div className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-sm text-slate-200 leading-snug">{value}</p>
    </div>
  )
}

export default ExerciseDetailDialog
