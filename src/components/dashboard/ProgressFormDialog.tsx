import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Ruler, Plus } from 'lucide-react'

interface ProgressFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  defaultWeight?: number | null
}

const FIELD_LABELS: { key: string; label: string; placeholder: string; step?: string }[] = [
  { key: 'weight', label: 'Peso (kg)', placeholder: 'Ex.: 78.5', step: '0.1' },
  { key: 'body_fat', label: '% de gordura', placeholder: 'Ex.: 18.5', step: '0.1' },
  { key: 'chest', label: 'Peitoral (cm)', placeholder: 'Ex.: 102', step: '0.1' },
  { key: 'waist', label: 'Cintura (cm)', placeholder: 'Ex.: 84', step: '0.1' },
  { key: 'hip', label: 'Quadril (cm)', placeholder: 'Ex.: 98', step: '0.1' },
  { key: 'arm', label: 'Braço (cm)', placeholder: 'Ex.: 37', step: '0.1' },
  { key: 'thigh', label: 'Coxa (cm)', placeholder: 'Ex.: 57', step: '0.1' },
]

export default function ProgressFormDialog({
  open,
  onOpenChange,
  onSaved,
  defaultWeight,
}: ProgressFormDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>({
    weight: defaultWeight ? String(defaultWeight) : '',
  })
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const weight = Number(values.weight)
    if (!weight || weight <= 0) {
      toast({
        title: 'Peso obrigatório',
        description: 'Informe seu peso atual para registrar o progresso.',
        variant: 'destructive',
      })
      return
    }

    const payload: Record<string, unknown> = { user_id: user.id, weight }
    for (const field of FIELD_LABELS) {
      const raw = values[field.key]
      if (raw && raw.trim() !== '') payload[field.key] = Number(raw)
    }
    if (notes.trim()) payload.notes = notes.trim()

    setIsSaving(true)
    try {
      await pb.collection('progress').create(payload)
      toast({
        title: 'Progresso registrado!',
        description: 'Seus dados foram salvos e já aparecem no dashboard.',
      })
      setValues({ weight: String(weight) })
      setNotes('')
      onOpenChange(false)
      onSaved()
    } catch (err) {
      console.error('Erro ao registrar progresso:', err)
      toast({
        title: 'Erro ao registrar',
        description: 'Não foi possível salvar seu progresso. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/10 text-[#22D3EE] flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Registrar progresso</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Adicione suas medições atuais para acompanhar a evolução.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELD_LABELS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  {field.label}
                </Label>
                <Input
                  type="number"
                  step={field.step ?? '1'}
                  min={0}
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 h-10"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Observações <span className="text-slate-500 normal-case font-normal">(opcional)</span>
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: boa semana de treino, senti mais energia..."
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
              disabled={isSaving}
              className="bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B0B10] font-bold rounded-xl"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Salvar medições
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
