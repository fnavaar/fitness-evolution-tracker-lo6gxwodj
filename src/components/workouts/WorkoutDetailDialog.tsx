import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dumbbell,
  Calendar,
  Repeat,
  Plus,
  Trash2,
  Loader2,
  Save,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import {
  type WorkoutRecord,
  type WorkoutGoal,
  type WorkoutStatus,
  type WorkoutExerciseItem,
  type ExerciseRecord,
  STATUS_LABELS,
  GOAL_LABELS,
  DAY_LABELS,
  WORKOUT_TYPE_LABELS,
  MUSCLE_GROUP_LABELS,
  updateWorkout,
  deleteWorkout,
  updateWorkoutExercise,
  deleteWorkoutExercise,
  addWorkoutExercise,
} from '@/services/workouts'
import { ExercisePickerDialog } from './ExercisePickerDialog'
import { WorkoutLogDialog } from './WorkoutLogDialog'

interface WorkoutDetailDialogProps {
  workout: WorkoutRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Chamado após mutações (salvar/excluir) para o pai recarregar. */
  onMutated?: () => void
}

const GOAL_OPTIONS: { value: WorkoutGoal; label: string }[] = [
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'condicionamento', label: 'Condicionamento' },
  { value: 'resistencia', label: 'Força' },
]

const STATUS_OPTIONS: { value: WorkoutStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
]

/** Item editável local (pode ser novo — id temporário — ou existente). */
interface EditableExercise extends WorkoutExerciseItem {
  __new?: boolean
}

export function WorkoutDetailDialog({
  workout,
  open,
  onOpenChange,
  onMutated,
}: WorkoutDetailDialogProps) {
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState<WorkoutGoal>('hipertrofia')
  const [daysPerWeek, setDaysPerWeek] = useState('3')
  const [status, setStatus] = useState<WorkoutStatus>('pendente')
  const [exercises, setExercises] = useState<EditableExercise[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false)
  const [confirmDeleteExerciseId, setConfirmDeleteExerciseId] = useState<string | null>(null)
  const [confirmDeleteWorkoutOpen, setConfirmDeleteWorkoutOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  // Sincroniza o estado local sempre que o treino mudar (abrir/fechar).
  useEffect(() => {
    if (!workout) return
    setTitle(workout.title || '')
    setDescription(workout.description || '')
    setGoal(workout.goal || 'hipertrofia')
    setDaysPerWeek(String(workout.days_per_week ?? 3))
    setStatus(workout.status || 'pendente')
    setExercises(
      (workout.expand?.workout_exercises || [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({ ...item })),
    )
  }, [workout])

  const createdLabel = workout
    ? format(new Date(workout.created), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : ''

  const existingExerciseIds = useMemo(() => exercises.map((item) => item.exercise_id), [exercises])

  if (!workout) return null

  /* ---------- handlers ---------- */

  function updateExerciseField(id: string, field: 'sets' | 'reps' | 'rest_time', value: string) {
    setExercises((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: field === 'reps' ? value : Number(value) || 0 } : item,
      ),
    )
  }

  function handlePickExercise(ex: ExerciseRecord) {
    const nextOrder = exercises.length > 0 ? Math.max(...exercises.map((i) => i.sort_order)) + 1 : 1
    const newItem: EditableExercise = {
      id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workout_id: workout.id,
      exercise_id: ex.id,
      sets: 3,
      reps: '10-12',
      rest_time: 60,
      sort_order: nextOrder,
      expand: { exercise_id: ex },
      __new: true,
    }
    setExercises((prev) => [...prev, newItem])
  }

  async function handleRemoveExercise(id: string) {
    const item = exercises.find((i) => i.id === id)
    // Item novo (ainda não salvo): apenas remove localmente.
    if (item?.__new) {
      setExercises((prev) => prev.filter((i) => i.id !== id))
      setConfirmDeleteExerciseId(null)
      return
    }
    try {
      await deleteWorkoutExercise(id)
      setExercises((prev) => prev.filter((i) => i.id !== id))
      toast({ title: 'Exercício removido', description: 'O exercício foi retirado do treino.' })
      onMutated?.()
    } catch (err) {
      console.error('Erro ao remover exercício:', err)
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o exercício. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setConfirmDeleteExerciseId(null)
    }
  }

  async function handleSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast({
        title: 'Título obrigatório',
        description: 'Dê um nome ao treino.',
        variant: 'destructive',
      })
      return
    }
    const dpw = Number(daysPerWeek)
    if (!Number.isFinite(dpw) || dpw < 1) {
      toast({
        title: 'Frequência inválida',
        description: 'Informe quantos dias por semana.',
        variant: 'destructive',
      })
      return
    }
    if (exercises.length === 0) {
      toast({
        title: 'Sem exercícios',
        description: 'Adicione ao menos um exercício ao treino.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      // 1. Atualiza o treino.
      await updateWorkout(workout.id, {
        title: trimmedTitle,
        description: description.trim() || 'Treino sem descrição.',
        goal,
        days_per_week: dpw,
        status,
      })

      // 2. Atualiza/cria exercícios.
      for (const item of exercises) {
        if (item.__new) {
          await addWorkoutExercise(
            workout.id,
            item.exercise_id,
            item.sets,
            String(item.reps),
            item.rest_time,
            item.sort_order,
          )
        } else {
          await updateWorkoutExercise(item.id, {
            sets: item.sets,
            reps: String(item.reps),
            rest_time: item.rest_time,
            sort_order: item.sort_order,
          })
        }
      }

      toast({ title: 'Treino salvo!', description: 'Suas alterações foram registradas.' })
      onMutated?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao salvar treino:', err)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o treino. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteWorkout() {
    setIsDeletingWorkout(true)
    try {
      await deleteWorkout(workout.id)
      toast({ title: 'Treino excluído', description: 'O treino foi removido permanentemente.' })
      onMutated?.()
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao excluir treino:', err)
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o treino. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingWorkout(false)
      setConfirmDeleteWorkoutOpen(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#12121A] border-[#262635] text-[#F8FAFC] sm:rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent border-[#262635] focus-visible:border-[#A3E635]/40 text-white font-extrabold text-lg h-10 px-2"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do treino"
                  aria-label="Descrição do treino"
                  className="bg-transparent border-[#262635] focus-visible:border-[#A3E635]/40 text-slate-300 text-sm min-h-[48px] resize-none px-2"
                />
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Edite os detalhes e os exercícios deste treino.
          </DialogDescription>

          {/* Metadados editáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Objetivo
              </Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as WorkoutGoal)}>
                <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121A] border-[#262635] text-white">
                  {GOAL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dias/semana
              </Label>
              <Input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(e.target.value)}
                className="bg-[#0B0B10] border-[#262635] text-white h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as WorkoutStatus)}>
                <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#12121A] border-[#262635] text-white">
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Badges informativas */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
              <Calendar className="w-3 h-3 mr-1" />
              {createdLabel}
            </Badge>
            <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
              <Repeat className="w-3 h-3 mr-1" />
              {GOAL_LABELS[goal]}
            </Badge>
            {workout.day_of_week && (
              <Badge
                variant="outline"
                className="border-[#A3E635]/30 bg-[#A3E635]/10 text-[#A3E635]"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {DAY_LABELS[workout.day_of_week]}
              </Badge>
            )}
            {workout.workout_type && (
              <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
                {WORKOUT_TYPE_LABELS[workout.workout_type]}
              </Badge>
            )}
          </div>

          {/* Lista de exercícios editáveis */}
          <div className="space-y-2">
            {exercises.map((item, idx) => {
              const ex = item.expand?.exercise_id
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#262635] bg-[#0B0B10]/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-2">
                      <span className="w-6 h-6 shrink-0 rounded-md bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{ex?.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ex ? MUSCLE_GROUP_LABELS[ex.muscle_group] : ''} ·{' '}
                          <span className="capitalize">
                            {(ex?.equipment || '').replace(/_/g, ' ')}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteExerciseId(item.id)}
                      className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Remover exercício"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pl-8">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Séries
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={String(item.sets)}
                        onChange={(e) => updateExerciseField(item.id, 'sets', e.target.value)}
                        className="bg-[#12121A] border-[#262635] text-white h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Reps
                      </Label>
                      <Input
                        value={String(item.reps)}
                        onChange={(e) => updateExerciseField(item.id, 'reps', e.target.value)}
                        placeholder="10-12"
                        className="bg-[#12121A] border-[#262635] text-white h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-semibold text-slate-500 uppercase">
                        Descanso (s)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={String(item.rest_time)}
                        onChange={(e) => updateExerciseField(item.id, 'rest_time', e.target.value)}
                        className="bg-[#12121A] border-[#262635] text-white h-9 text-sm"
                      />
                    </div>
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

            <Button
              type="button"
              variant="outline"
              onClick={() => setPickerOpen(true)}
              className="w-full border-dashed border-[#262635] bg-[#0B0B10]/40 text-slate-300 hover:text-[#A3E635] hover:border-[#A3E635]/40 hover:bg-[#A3E635]/5 rounded-xl h-10"
            >
              <Plus className="w-4 h-4" />
              Adicionar exercício
            </Button>
          </div>

          {/* Rodapé */}
          <DialogFooter className="gap-2 pt-2 border-t border-[#262635] sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLogOpen(true)}
              className="text-slate-300 hover:text-[#A3E635] hover:bg-[#A3E635]/5 rounded-xl"
            >
              <ClipboardList className="w-4 h-4" />
              Registrar treino
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDeleteWorkoutOpen(true)}
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão de exercício */}
      <AlertDialog
        open={!!confirmDeleteExerciseId}
        onOpenChange={(v) => !v && setConfirmDeleteExerciseId(null)}
      >
        <AlertDialogContent className="bg-[#12121A] border-[#262635] text-white">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-white">Remover exercício?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Esta ação removerá o exercício do treino. Você pode adicioná-lo novamente depois.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#262635] text-slate-300 hover:bg-[#1A1A24] rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmDeleteExerciseId && handleRemoveExercise(confirmDeleteExerciseId)
              }
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar exclusão do treino inteiro */}
      <AlertDialog
        open={confirmDeleteWorkoutOpen}
        onOpenChange={(v) => {
          setConfirmDeleteWorkoutOpen(v)
          setIsDeletingWorkout(v)
        }}
      >
        <AlertDialogContent className="bg-[#12121A] border-[#262635] text-white">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-white">Excluir treino?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Tem certeza? Esta ação não pode ser desfeita. Todos os exercícios vinculados
                  também serão removidos.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#262635] text-slate-300 hover:bg-[#1A1A24] rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkout}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adicionar exercício */}
      <ExercisePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={handlePickExercise}
        excludeIds={existingExerciseIds}
      />

      {/* Registrar treino */}
      <WorkoutLogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        workoutId={workout.id}
        exercises={exercises}
        onSaved={onMutated}
      />
    </>
  )
}

export default WorkoutDetailDialog
