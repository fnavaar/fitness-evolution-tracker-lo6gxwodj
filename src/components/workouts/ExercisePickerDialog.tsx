import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type ExerciseRecord, fetchExercises, MUSCLE_GROUP_LABELS } from '@/services/workouts'

interface ExercisePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (exercise: ExerciseRecord) => void
  /** Ids de exercícios já presentes no treino (para sinalizar/evitar duplicidade). */
  excludeIds?: string[]
}

/**
 * Modal de busca para selecionar um exercício da collection `exercises`
 * e adicioná-lo ao treino atual.
 */
export function ExercisePickerDialog({
  open,
  onOpenChange,
  onPick,
  excludeIds = [],
}: ExercisePickerDialogProps) {
  const [items, setItems] = useState<ExerciseRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)
    setSearch('')
    fetchExercises()
      .then((result) => {
        if (!cancelled) setItems(result)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (ex) =>
        ex.name.toLowerCase().includes(term) ||
        (ex.instructions || '').toLowerCase().includes(term),
    )
  }, [items, search])

  function handleSelect(ex: ExerciseRecord) {
    onPick(ex)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Adicionar exercício</DialogTitle>
          <DialogDescription className="text-slate-400">
            Busque um exercício da biblioteca para incluir neste treino.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou instrução..."
            className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 pl-9 h-10"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Carregando exercícios...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-slate-500">
              Nenhum exercício encontrado.
            </div>
          ) : (
            filtered.map((ex) => {
              const already = excludeIds.includes(ex.id)
              return (
                <button
                  key={ex.id}
                  type="button"
                  disabled={already}
                  onClick={() => handleSelect(ex)}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#262635] bg-[#0B0B10]/60 px-4 py-3 text-left transition-all hover:border-[#A3E635]/40 hover:bg-[#A3E635]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{ex.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {MUSCLE_GROUP_LABELS[ex.muscle_group]} ·{' '}
                      <span className="capitalize">{(ex.equipment || '').replace(/_/g, ' ')}</span>
                    </p>
                  </div>
                  {already ? (
                    <Badge
                      variant="outline"
                      className="border-[#262635] bg-[#12121A] text-slate-500 shrink-0"
                    >
                      Adicionado
                    </Badge>
                  ) : (
                    <span className="w-8 h-8 shrink-0 rounded-lg bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#262635] text-slate-300 hover:bg-[#1A1A24] rounded-xl"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExercisePickerDialog
