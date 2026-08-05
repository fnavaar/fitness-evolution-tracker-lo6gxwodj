import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateWorkout, type WorkoutGoal } from '@/services/workouts'
import { useToast } from '@/hooks/use-toast'

interface GenerateWorkoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (id: string) => void
}

const GOAL_OPTIONS: { value: WorkoutGoal; label: string }[] = [
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'condicionamento', label: 'Condicionamento' },
  { value: 'resistencia', label: 'Força' },
]

const LEVEL_OPTIONS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

const DURATION_OPTIONS = [
  { value: '30', label: '30 minutos' },
  { value: '45', label: '45 minutos' },
  { value: '60', label: '60 minutos' },
  { value: '90', label: '90 minutos' },
]

export function GenerateWorkoutDialog({
  open,
  onOpenChange,
  onGenerated,
}: GenerateWorkoutDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [goal, setGoal] = useState<WorkoutGoal>('hipertrofia')
  const [level, setLevel] = useState('iniciante')
  const [duration, setDuration] = useState('60')
  const [equipment, setEquipment] = useState('')
  const [notes, setNotes] = useState('')

  function resetForm() {
    setGoal('hipertrofia')
    setLevel('iniciante')
    setDuration('60')
    setEquipment('')
    setNotes('')
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const id = await generateWorkout({
        goal,
        level: level as 'iniciante' | 'intermediario' | 'avancado',
        duration: Number(duration) as 30 | 45 | 60 | 90,
        equipment: equipment.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      toast({
        title: 'Treino gerado com sucesso!',
        description: 'Seu novo treino já está disponível na lista.',
      })
      onGenerated(id)
      onOpenChange(false)
      resetForm()
    } catch (err) {
      console.error('Erro ao gerar treino:', err)
      const message =
        err instanceof Error ? err.message : 'Não foi possível gerar o treino. Tente novamente.'
      toast({
        title: 'Erro ao gerar treino',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isSubmitting) onOpenChange(v)
      }}
    >
      <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-white">
                Gerar Treino com IA
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Personalize seu plano de treino em segundos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Objetivo */}
          <div className="space-y-2">
            <Label className="text-slate-200">Objetivo</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as WorkoutGoal)}>
              <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                {GOAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nível */}
          <div className="space-y-2">
            <Label className="text-slate-200">Nível</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                {LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duração estimada */}
          <div className="space-y-2">
            <Label className="text-slate-200">Duração estimada</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                <SelectValue placeholder="Selecione a duração" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Equipamentos (opcional) */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              Equipamentos disponíveis{' '}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </Label>
            <Input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ex.: halteres, barra, polia..."
              className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
            />
          </div>

          {/* Restrições / observações (opcional) */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              Restrições / observações{' '}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: evitar agachamento por dor no joelho..."
              className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-slate-300 hover:text-white hover:bg-[#1A1A24]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:shadow-[#A3E635]/40 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Treino
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
