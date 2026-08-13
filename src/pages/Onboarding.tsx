import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import type { ProfileRecord } from '@/services/profiles'
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

const GOALS = [
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'hipertrofia', label: 'Hipertrofia' },
  { value: 'condicionamento', label: 'Condicionamento' },
  { value: 'resistencia', label: 'Resistência' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentario', label: 'Sedentário' },
  { value: 'levemente_ativo', label: 'Levemente ativo' },
  { value: 'moderadamente_ativo', label: 'Moderadamente ativo' },
  { value: 'muito_ativo', label: 'Muito ativo' },
]

const DIET_PREFERENCES = [
  { value: 'onivoro', label: 'Onívoro' },
  { value: 'vegetariano', label: 'Vegetariano' },
  { value: 'vegano', label: 'Vegano' },
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [goal, setGoal] = useState('hipertrofia')
  const [activityLevel, setActivityLevel] = useState('moderadamente_ativo')
  const [trainingFrequency, setTrainingFrequency] = useState('4')
  const [currentWeight, setCurrentWeight] = useState('')
  const [height, setHeight] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [dietaryPreference, setDietaryPreference] = useState('onivoro')
  const [restrictions, setRestrictions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)

  // Redireciona para /dashboard caso o usuário já possua perfil.
  useEffect(() => {
    let cancelled = false
    async function checkExistingProfile() {
      if (!user) {
        setCheckingProfile(false)
        return
      }
      try {
        const res = await pb
          .collection('profiles')
          .getList<ProfileRecord>(1, 1, { filter: `user_id = "${user.id}"` })
        if (cancelled) return
        if (res.items.length > 0) {
          navigate('/dashboard', { replace: true })
          return
        }
      } catch (e) {
        console.error('Erro ao verificar perfil existente:', e)
      }
      setCheckingProfile(false)
    }
    checkExistingProfile()
    return () => {
      cancelled = true
    }
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const weight = Number(currentWeight)
    const heightCm = Number(height)
    const freq = Number(trainingFrequency)

    if (
      !weight ||
      weight <= 0 ||
      !heightCm ||
      heightCm <= 0 ||
      !birthDate ||
      !freq ||
      freq < 1 ||
      freq > 7
    ) {
      toast({
        title: 'Campos inválidos',
        description: 'Preencha peso, altura, data de nascimento e frequência semanal (1–7 dias).',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        user_id: user.id,
        goal,
        current_weight: weight,
        height: heightCm,
        birth_date: new Date(`${birthDate}T12:00:00`).toISOString(),
        activity_level: activityLevel,
        training_frequency: freq,
        dietary_preference: dietaryPreference,
        restrictions: restrictions.trim() || '',
      }

      // Verifica novamente se já existe perfil (proteção contra race condition).
      // Se existir, atualiza em vez de criar — evita o erro 400 do PocketBase
      // quando a relação user_id → users já está preenchida (maxSelect 1).
      const existing = await pb
        .collection('profiles')
        .getList<ProfileRecord>(1, 1, { filter: `user_id = "${user.id}"` })

      if (existing.items.length > 0) {
        await pb.collection('profiles').update(existing.items[0].id, payload)
      } else {
        await pb.collection('profiles').create(payload)
      }

      try {
        await pb.collection('progress').create({
          user_id: user.id,
          weight,
        })
      } catch (progressErr) {
        console.error('Erro ao registrar peso inicial no progress:', progressErr)
      }

      toast({
        title: 'Perfil salvo!',
        description: 'Seu perfil e peso inicial foram salvos. Bem-vindo ao EvolutFit.',
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      toast({
        title: 'Erro ao salvar perfil',
        description: 'Não foi possível salvar seu perfil. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkingProfile) {
    return (
      <div className="w-full max-w-lg flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#A3E635]" />
        <p className="mt-4 text-sm text-slate-400 animate-pulse">Verificando seu perfil...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg">
      <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Vamos montar seu perfil
            </h1>
            <p className="text-sm text-slate-400">
              Essas informações personalizam seus treinos e dietas com IA.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Objetivo e treino
            </h2>
            <div className="space-y-2">
              <Label className="text-slate-200">Objetivo principal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                  <SelectValue placeholder="Selecione o objetivo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                  {GOALS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Nível de atividade</Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                  {ACTIVITY_LEVELS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">
                Frequência semanal <span className="text-slate-500 font-normal">(1–7 dias)</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={7}
                value={trainingFrequency}
                onChange={(e) => setTrainingFrequency(e.target.value)}
                placeholder="Ex.: 4"
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Medidas e alimentação
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Peso atual (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="Ex.: 78"
                  required
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Altura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ex.: 178"
                  required
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Data de nascimento</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="bg-[#0B0B10] border-[#262635] text-white [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Preferência alimentar</Label>
              <Select value={dietaryPreference} onValueChange={setDietaryPreference}>
                <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                  <SelectValue placeholder="Selecione a preferência" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                  {DIET_PREFERENCES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">
                Restrições / alergias <span className="text-slate-500 font-normal">(opcional)</span>
              </Label>
              <Textarea
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                placeholder="Ex.: intolerância à lactose, não como carne vermelha..."
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 min-h-[80px] resize-none"
              />
            </div>
          </section>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:shadow-[#A3E635]/40 transition-all h-11"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                Concluir cadastro
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
