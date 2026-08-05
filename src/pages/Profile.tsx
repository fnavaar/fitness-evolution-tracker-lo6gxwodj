import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  User as UserIcon,
  Camera,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Dumbbell,
  BookOpen,
  Flame,
  CalendarDays,
  Mail,
  Lock,
  LogOut,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  getOrCreateProfile,
  updateProfile,
  fetchProfileStats,
  GOAL_LABELS,
  ACTIVITY_LABELS,
  FREQUENCY_LABELS,
  type ProfileRecord,
  type ProfileStats,
  type Goal,
  type ActivityLevel,
} from '@/services/profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const GOAL_OPTIONS = Object.entries(GOAL_LABELS) as [Goal, string][]
const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]
const FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: '1-2x por semana' },
  { value: '2', label: '1-2x por semana' },
  { value: '3', label: '3-4x por semana' },
  { value: '4', label: '3-4x por semana' },
  { value: '5', label: '5-6x por semana' },
  { value: '6', label: '5-6x por semana' },
  { value: '7', label: 'Todos os dias' },
]

function formatDateOnly(value: string): string {
  // birth_date vem como ISO; para input[type=date] precisamos de yyyy-MM-dd.
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return format(d, 'yyyy-MM-dd')
}

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null
  const d = new Date(birthDate)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 ? age : null
}

function initials(name?: string): string {
  if (!name) return 'US'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Campos do formulário
  const [name, setName] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState<Goal>('hipertrofia')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderadamente_ativo')
  const [trainingFrequency, setTrainingFrequency] = useState('3')
  const [birthDate, setBirthDate] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  // Configurações da conta
  const [newEmail, setNewEmail] = useState('')
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(false)
    try {
      const [p, s] = await Promise.all([
        getOrCreateProfile(user.id),
        fetchProfileStats(user.id).catch(() => null),
      ])
      setProfile(p)
      setStats(s)
      setName(user.name || '')
      setCurrentWeight(String(p.current_weight ?? ''))
      setHeight(String(p.height ?? ''))
      setGoal(p.goal)
      setActivityLevel(p.activity_level)
      setTrainingFrequency(String(p.training_frequency ?? '3'))
      setBirthDate(formatDateOnly(p.birth_date))
      setBio(((p as Record<string, unknown>).bio as string) ?? '')
      setNewEmail(user.email || '')
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
      setError(true)
      toast({
        title: 'Erro ao carregar perfil',
        description: 'Não foi possível buscar seus dados. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    load()
  }, [load])

  // Realtime no perfil — só assina quando autenticado com token válido.
  useEffect(() => {
    if (!profile) return
    if (!user || !pb.authStore.isValid || !pb.authStore.token) return
    let active = true
    pb.collection('profiles')
      .subscribe(profile.id, (e) => {
        if (!active) return
        if (e.action === 'update' || e.action === 'create') {
          setProfile(e.record as unknown as ProfileRecord)
        }
      })
      .catch(() => {})

    return () => {
      active = false
      pb.collection('profiles')
        .unsubscribe(profile.id)
        .catch(() => {})
    }
  }, [profile?.id, user])

  // Pré-visualização do avatar
  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile)
      setAvatarPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setAvatarPreview(null)
  }, [avatarFile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return

    const weight = Number(currentWeight)
    const heightCm = Number(height)
    const freq = Number(trainingFrequency)

    if (!weight || weight <= 0 || !heightCm || heightCm <= 0) {
      toast({
        title: 'Campos inválidos',
        description: 'Preencha peso e altura com valores válidos.',
        variant: 'destructive',
      })
      return
    }
    if (!birthDate) {
      toast({
        title: 'Data de nascimento obrigatória',
        description: 'Informe sua data de nascimento.',
        variant: 'destructive',
      })
      return
    }
    if (!freq || freq < 1 || freq > 7) {
      toast({
        title: 'Frequência inválida',
        description: 'Selecione uma frequência entre 1 e 7 dias.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    // Snapshot para rollback
    const prev = { ...profile }
    const optimistic: ProfileRecord = {
      ...profile,
      goal,
      current_weight: weight,
      height: heightCm,
      birth_date: new Date(birthDate).toISOString(),
      activity_level: activityLevel,
      training_frequency: freq,
      bio,
    }
    setProfile(optimistic)

    try {
      // Atualiza nome + avatar no users (auth)
      if (name !== user.name || avatarFile) {
        const userFormData = new FormData()
        userFormData.append('name', name)
        if (avatarFile) userFormData.append('avatar', avatarFile)
        await pb.collection('users').update(user.id, userFormData)
        await refreshUser()
        setAvatarFile(null)
      }

      const updated = await updateProfile(profile.id, {
        goal,
        current_weight: weight,
        height: heightCm,
        birth_date: new Date(birthDate).toISOString(),
        activity_level: activityLevel,
        training_frequency: freq,
        bio,
      })
      setProfile(updated)

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      })
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setProfile(prev) // rollback
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const email = newEmail.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Digite um endereço de e-mail válido.',
        variant: 'destructive',
      })
      return
    }
    if (email === user.email) {
      toast({ title: 'Nenhuma alteração', description: 'O e-mail informado é igual ao atual.' })
      return
    }
    setIsSavingEmail(true)
    try {
      await pb.collection('users').update(user.id, { email })
      await refreshUser()
      toast({ title: 'E-mail atualizado!', description: 'Seu e-mail foi alterado com sucesso.' })
    } catch (err) {
      console.error('Erro ao atualizar e-mail:', err)
      toast({
        title: 'Erro ao atualizar e-mail',
        description: 'Não foi possível alterar o e-mail. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingEmail(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'A nova senha e a confirmação devem ser iguais.',
        variant: 'destructive',
      })
      return
    }
    setIsSavingPassword(true)
    try {
      // PocketBase: troca de senha via reautenticação + atualização do registro.
      await pb.collection('users').authWithPassword(user.email!, currentPassword)
      await pb.collection('users').update(user.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ title: 'Senha alterada!', description: 'Sua senha foi atualizada com sucesso.' })
    } catch (err) {
      console.error('Erro ao alterar senha:', err)
      toast({
        title: 'Erro ao alterar senha',
        description: 'Verifique sua senha atual e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    if (!user) return
    setIsDeleting(true)
    try {
      // Remove o perfil primeiro (se existir)
      if (profile) {
        try {
          await pb.collection('profiles').delete(profile.id)
        } catch (_) {
          /* perfil pode já não existir */
        }
      }
      await pb.collection('users').delete(user.id)
      toast({ title: 'Conta excluída', description: 'Sua conta foi removida permanentemente.' })
      logout()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Erro ao excluir conta:', err)
      toast({
        title: 'Erro ao excluir conta',
        description: 'Não foi possível excluir sua conta. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  /* ----------------- Renderização ----------------- */

  if (isLoading) return <ProfileSkeleton />

  if (error && !profile) {
    return (
      <div className="space-y-8">
        <ProfileHeaderSkeleton />
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Algo deu errado</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Não foi possível carregar seu perfil. Verifique sua conexão e tente novamente.
          </p>
          <Button
            onClick={load}
            className="mt-4 bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!user || !profile) return null

  const memberSince = format(new Date(user.created), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const age = calcAge(profile.birth_date)
  const avatarUrl =
    avatarPreview ??
    (user.avatar ? pb.files.getURL(user, user.avatar) : null) ??
    `https://img.usecurling.com/ppl/256?seed=${user.id}`

  return (
    <div className="space-y-8">
      {/* ---------------- Cabeçalho do Perfil ---------------- */}
      <div className="rounded-2xl border border-[#262635] bg-gradient-to-br from-[#12121A] to-[#0B0B10] p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar com upload */}
          <div className="relative group">
            <Avatar className="w-28 h-28 border-4 border-[#262635] shadow-xl">
              <AvatarImage src={avatarUrl} alt={user.name || 'Perfil'} />
              <AvatarFallback className="bg-[#1A1A24] text-[#A3E635] text-2xl font-extrabold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] flex items-center justify-center shadow-lg transition-colors"
              title="Alterar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setAvatarFile(f)
              }}
            />
          </div>

          {/* Nome + badges */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {user.name || 'Atleta'}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
              <Badge className="bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/30 hover:bg-[#A3E635]/20">
                <UserIcon className="w-3 h-3 mr-1" />
                {GOAL_LABELS[profile.goal]}
              </Badge>
              <Badge className="bg-[#FB923C]/15 text-[#FB923C] border-[#FB923C]/30 hover:bg-[#FB923C]/20">
                Membro desde {memberSince}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-2">{user.email}</p>
          </div>
        </div>
      </div>

      {/* ---------------- Estatísticas Rápidas ---------------- */}
      <section>
        <h2 className="text-lg font-bold text-white mb-3">Estatísticas rápidas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Dumbbell}
            label="Treinos realizados"
            value={stats ? String(stats.totalWorkouts) : '—'}
            accent="lime"
          />
          <StatCard
            icon={BookOpen}
            label="Receitas salvas"
            value={stats ? String(stats.totalSavedRecipes) : '—'}
            accent="orange"
          />
          <StatCard
            icon={Flame}
            label="Sequência atual"
            value={stats ? `${stats.currentStreak} dias` : '—'}
            accent="orange"
          />
          <StatCard
            icon={CalendarDays}
            label="Dias ativos este mês"
            value={stats ? String(stats.activeDaysThisMonth) : '—'}
            accent="lime"
          />
        </div>
      </section>

      {/* ---------------- Metas e Dados Corporais ---------------- */}
      <Card className="bg-[#12121A] border-[#262635]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#A3E635]" />
            Metas e dados corporais
          </CardTitle>
          <CardDescription className="text-slate-400">
            Mantenha seus dados atualizados para treinos e dietas mais precisos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-slate-200">Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Peso atual (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="Ex.: 78"
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
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Objetivo principal</Label>
                <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
                  <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                    {GOAL_OPTIONS.map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Nível de atividade</Label>
                <Select
                  value={activityLevel}
                  onValueChange={(v) => setActivityLevel(v as ActivityLevel)}
                >
                  <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                    {ACTIVITY_OPTIONS.map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Frequência de treinos</Label>
                <Select value={trainingFrequency} onValueChange={setTrainingFrequency}>
                  <SelectTrigger className="bg-[#0B0B10] border-[#262635] text-white">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A24] border-[#262635] text-white">
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">
                  Data de nascimento
                  {age !== null && (
                    <span className="text-slate-500 font-normal ml-2">({age} anos)</span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-[#0B0B10] border-[#262635] text-white [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Bio / Sobre mim</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você, seus objetivos e história fitness..."
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 min-h-[90px] resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:shadow-[#A3E635]/40 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ---------------- Configurações da Conta ---------------- */}
      <Card className="bg-[#12121A] border-[#262635]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#A3E635]" />
            Configurações da conta
          </CardTitle>
          <CardDescription className="text-slate-400">
            Gerencie suas credenciais e preferências de conta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Alterar e-mail */}
          <form onSubmit={handleUpdateEmail} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Mail className="w-4 h-4 text-[#FB923C]" />
              Alterar e-mail
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500 md:flex-1"
              />
              <Button
                type="submit"
                disabled={isSavingEmail}
                variant="outline"
                className="border-[#262635] text-slate-200 hover:bg-[#1A1A24] hover:text-white rounded-xl"
              >
                {isSavingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Atualizar e-mail
              </Button>
            </div>
          </form>

          <div className="h-px bg-[#262635]" />

          {/* Alterar senha */}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Lock className="w-4 h-4 text-[#FB923C]" />
              Alterar senha
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Senha atual</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Nova senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-400 text-xs">Confirmar senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0B0B10] border-[#262635] text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSavingPassword}
              variant="outline"
              className="border-[#262635] text-slate-200 hover:bg-[#1A1A24] hover:text-white rounded-xl"
            >
              {isSavingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Alterar senha
            </Button>
          </form>

          <div className="h-px bg-[#262635]" />

          {/* Ações de conta */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={logout}
              variant="outline"
              className="border-[#262635] text-slate-300 hover:bg-[#1A1A24] hover:text-white rounded-xl flex-1"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#12121A] border-[#262635] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Excluir conta?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400">
                    Tem certeza? Esta ação é irreversível. Todos os seus dados — perfil, treinos,
                    dietas e progresso — serão permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[#1A1A24] border-[#262635] text-slate-200 hover:bg-[#262635] rounded-xl">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-red-500 hover:bg-red-600 text-white border-transparent rounded-xl"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Excluir definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ----------------- Subcomponentes ----------------- */

const ACCENT_CLASSES: Record<string, { bg: string; text: string }> = {
  lime: { bg: 'bg-[#A3E635]/10', text: 'text-[#A3E635]' },
  orange: { bg: 'bg-[#FB923C]/10', text: 'text-[#FB923C]' },
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: 'lime' | 'orange'
}) {
  const a = ACCENT_CLASSES[accent]
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-5">
      <div
        className={`w-10 h-10 rounded-xl ${a.bg} ${a.text} flex items-center justify-center mb-3`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  )
}

function ProfileHeaderSkeleton() {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <Skeleton className="w-28 h-28 rounded-full bg-[#1A1A24]" />
        <div className="flex-1 space-y-3 text-center md:text-left">
          <Skeleton className="h-8 w-48 bg-[#1A1A24] mx-auto md:mx-0" />
          <div className="flex gap-2 justify-center md:justify-start">
            <Skeleton className="h-6 w-28 bg-[#1A1A24]" />
            <Skeleton className="h-6 w-40 bg-[#1A1A24]" />
          </div>
          <Skeleton className="h-4 w-56 bg-[#1A1A24] mx-auto md:mx-0" />
        </div>
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <ProfileHeaderSkeleton />
      <div>
        <Skeleton className="h-6 w-48 bg-[#1A1A24] mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[#262635] bg-[#12121A] p-5 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl bg-[#1A1A24]" />
              <Skeleton className="h-7 w-16 bg-[#1A1A24]" />
              <Skeleton className="h-3 w-24 bg-[#1A1A24]" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-6 space-y-4">
        <Skeleton className="h-6 w-48 bg-[#1A1A24]" />
        <Skeleton className="h-10 w-full bg-[#1A1A24]" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full bg-[#1A1A24]" />
          <Skeleton className="h-10 w-full bg-[#1A1A24]" />
        </div>
      </div>
    </div>
  )
}
