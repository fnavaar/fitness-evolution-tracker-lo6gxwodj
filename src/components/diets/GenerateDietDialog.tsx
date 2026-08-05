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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateDiet, type DietGoal, type DietPreference } from '@/services/diets'
import { useToast } from '@/hooks/use-toast'

interface GenerateDietDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: (id: string) => void
}

const GOAL_OPTIONS: { value: DietGoal; label: string }[] = [
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'condicionamento', label: 'Condicionamento' },
  { value: 'resistencia', label: 'Força' },
]

const PREFERENCE_OPTIONS: { value: DietPreference; label: string }[] = [
  { value: 'onivoro', label: 'Onívoro' },
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
]

export function GenerateDietDialog({ open, onOpenChange, onGenerated }: GenerateDietDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [goal, setGoal] = useState<DietGoal>('hipertrofia')
  const [calories, setCalories] = useState('2200')
  const [preference, setPreference] = useState<DietPreference>('onivoro')

  function resetForm() {
    setGoal('hipertrofia')
    setCalories('2200')
    setPreference('onivoro')
  }

  async function handleSubmit() {
    const kcal = Number(calories)
    if (!kcal || kcal < 800 || kcal > 6000) {
      toast({
        title: 'Calorias inválidas',
        description: 'Informe uma meta entre 800 e 6000 kcal/dia.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const id = await generateDiet({
        goal,
        calories: kcal,
        preference,
      })
      toast({
        title: 'Dieta gerada com sucesso!',
        description: 'Sua dieta personalizada já está disponível na lista.',
      })
      onGenerated(id)
      onOpenChange(false)
      resetForm()
    } catch (err) {
      console.error('Erro ao gerar dieta:', err)
      const message =
        err instanceof Error ? err.message : 'Não foi possível gerar a dieta. Tente novamente.'
      toast({
        title: 'Erro ao gerar dieta',
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
            <div className="w-10 h-10 rounded-xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-white">
                Gerar Dieta com IA
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                A IA calcula seus macros e monta um cardápio sob medida.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Objetivo */}
          <div className="space-y-2">
            <Label className="text-slate-200">Objetivo</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as DietGoal)}>
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

          {/* Meta calórica */}
          <div className="space-y-2">
            <Label className="text-slate-200">
              Meta calórica <span className="text-slate-500 font-normal">(kcal/dia)</span>
            </Label>
            <Input
              type="number"
              min={800}
              max={6000}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Ex.: 2200"
              className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Dica: hipertrofia costuma usar ~300–500 kcal acima da manutenção; emagrecimento,
              abaixo.
            </p>
          </div>

          {/* Preferência alimentar */}
          <div className="space-y-2">
            <Label className="text-slate-200">Preferência alimentar</Label>
            <Select value={preference} onValueChange={(v) => setPreference(v as DietPreference)}>
              <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                <SelectValue placeholder="Selecione a preferência" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            className="bg-[#FB923C] hover:bg-[#F97316] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#FB923C]/20 hover:shadow-[#FB923C]/40 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Dieta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default GenerateDietDialog
