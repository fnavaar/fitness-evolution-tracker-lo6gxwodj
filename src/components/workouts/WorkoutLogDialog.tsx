import { useEffect, useState } from 'react'
import { Loader2, Dumbbell, ClipboardList } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  createWorkoutLog,
  type WorkoutExerciseItem,
  MUSCLE_GROUP_LABELS,
} from '@/services/workouts'

interface WorkoutLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workoutId: string
  exercises: WorkoutExerciseItem[]
  onSaved?: () => void
}

/**
 * Modal para registrar a execução de um treino (workout_logs).
 * Permite escolher um exercício do treino e logar séries, reps e carga.
 */
export function WorkoutLogDialog({
  open,
  onOpenChange,
  workoutId,
  exercises,
  onSaved,
}: WorkoutLogDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const sorted = exercises.slice().sort((a, b) => a.sort_order - b.sort_order)

  const [exerciseId, setExerciseId] = useState<string>(sorted[0]?.id ?? '')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Reseta/sincroniza o exercício selecionado quando o modal abre.
  useEffect(() => {
    if (open) {
      setExerciseId(sorted[0]?.id ?? '')
      setDate(new Date().toISOString().slice(0, 10))
      setSets('')
      setReps('')
      setWeight('')
      setNotes('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selected = sorted.find((item) => item.id === exerciseId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!selected) {
      toast({
        title: 'Selecione um exercício',
        description: 'Escolha um exercício do treino para registrar.',
        variant: 'destructive',
      })
      return
    }

    const setsNum = Number(sets)
    const repsNum = Number(reps)
    const weightNum = Number(weight)

    if (!sets || !Number.isFinite(setsNum) || setsNum <= 0) {
      toast({
        title: 'Séries inválidas',
        description: 'Informe o número de séries realizadas.',
        variant: 'destructive',
      })
      return
    }
    if (!reps || !Number.isFinite(repsNum) || repsNum <= 0) {
      toast({
        title: 'Reps inválidas',
        description: 'Informe o número de repetições realizadas.',
        variant: 'destructive',
      })
      return
    }
    if (!weight || !Number.isFinite(weightNum) || weightNum <= 0) {
      toast({
        title: 'Carga inválida',
        description: 'Informe a carga utilizada (kg).',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      await createWorkoutLog({
        user_id: user.id,
        workout_id: workoutId,
        exercise_id: selected.exercise_id,
        date: new Date(date).toISOString(),
        weight_used: weightNum,
        reps_completed: repsNum,
        sets_completed: setsNum,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })
      toast({
        title: 'Treino registrado!',
        description: 'Seu registro foi salvo e aparece no dashboard.',
      })
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      console.error('Erro ao registrar treino:', err)
      toast({
        title: 'Erro ao registrar',
        description: 'Não foi possível salvar o registro. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Pré-preenche com os valores planejados do exercício selecionado.
  useEffect(() => {
    if (selected) {
      setSets(String(selected.sets))
      setReps(extractFirstNumber(selected.reps))
    }
  }, [exerciseId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Registrar treino</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Registre as séries, repetições e carga realizadas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Exercício
            </Label>
            <Select value={exerciseId} onValueChange={setExerciseId}>
              <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white h-10">
                <SelectValue placeholder="Selecione o exercício" />
              </SelectTrigger>
              <SelectContent className="bg-[#12121A] border-[#262635] text-white">
                {sorted.map((item) => {
                  const ex = item.expand?.exercise_id
                  return (
                    <SelectItem key={item.id} value={item.id} className="text-white">
                      {ex?.name || 'Exercício'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selected && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
                  <Dumbbell className="w-3 h-3 mr-1" />
                  {selected.sets}x{selected.reps} planejado
                </Badge>
                {selected.expand?.exercise_id && (
                  <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
                    {MUSCLE_GROUP_LABELS[selected.expand.exercise_id.muscle_group]}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Séries
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="Ex.: 3"
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Repetições
              </Label>
              <Input
                type="number"
                min={1}
                step={1}
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="Ex.: 12"
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Carga (kg)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex.: 20"
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Data
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#0B0B10] border-[#262635] text-white h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Observações <span className="text-slate-500 normal-case font-normal">(opcional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: senti a última série pesada, boa execução..."
              className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 min-h-[70px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#262635] text-slate-300 hover:bg-[#1A1A24] rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || sorted.length === 0}
              className="bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ClipboardList className="w-4 h-4" />
              )}
              Salvar registro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Extrai o primeiro número de uma string de reps (ex.: "10-12" → "10"). */
function extractFirstNumber(reps: string): string {
  const match = String(reps || '').match(/\d+/)
  return match ? match[0] : ''
}

export default WorkoutLogDialog
