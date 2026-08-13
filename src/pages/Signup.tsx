import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowRight, Check, Lock, Mail, User } from 'lucide-react'

interface FormErrors {
  name?: string
  email?: string
  password?: string
  passwordConfirm?: string
  general?: string
}

export default function Signup() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function validate(): FormErrors {
    const next: FormErrors = {}
    const normalizedEmail = email.trim()

    if (!name.trim()) next.name = 'Nome é obrigatório.'
    else if (name.trim().length < 2) next.name = 'Informe pelo menos 2 caracteres.'

    if (!normalizedEmail) next.email = 'E-mail é obrigatório.'
    else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) next.email = 'Insira um e-mail válido.'

    if (!password) next.password = 'Senha é obrigatória.'
    else if (password.length < 8) next.password = 'A senha deve ter pelo menos 8 caracteres.'

    if (!passwordConfirm) next.passwordConfirm = 'Confirme sua senha.'
    else if (password !== passwordConfirm) next.passwordConfirm = 'As senhas não coincidem.'

    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setLoading(true)

    try {
      await pb.collection('users').create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        emailVisibility: false,
        password,
        passwordConfirm,
      })
      await pb.collection('users').authWithPassword(email.trim().toLowerCase(), password)
      await refreshUser()

      // Recém-criado: redireciona para o onboarding. Se por acaso já existir
      // perfil (cadastro prévio órfão), vai direto ao dashboard.
      try {
        const existing = await pb.collection('profiles').getList(1, 1, {
          filter: `user_id = "${pb.authStore.record?.id}"`,
        })
        if (existing.items.length > 0) {
          navigate('/dashboard', { replace: true })
          return
        }
      } catch (e) {
        console.error('Erro ao verificar perfil pós-signup:', e)
      }
      navigate('/onboarding', { replace: true })
    } catch (err: any) {
      const message = String(err?.response?.message || '').toLowerCase()
      const fieldErrors = err?.response?.data || {}
      const next: FormErrors = {}

      if (fieldErrors.email || message.includes('email')) {
        next.email = 'Este e-mail já está cadastrado ou é inválido.'
      }
      if (fieldErrors.password || message.includes('password')) {
        next.password = 'A senha não atende aos requisitos.'
      }
      if (Object.keys(next).length === 0) {
        next.general = 'Não foi possível criar a conta. Revise os dados e tente novamente.'
      }
      setErrors(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B10] flex items-center justify-center p-4 relative">
      <Card className="w-full max-w-md bg-[#12121A] border-[#262635] text-white rounded-2xl shadow-2xl p-2 z-10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#A3E635] to-[#84CC16] flex items-center justify-center font-black text-[#0B0B10] text-xl mb-3 shadow-lg shadow-[#A3E635]/20">
            EF
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight">Crie sua conta</CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Comece seu acompanhamento personalizado no EvolutFit
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.general && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`pl-10 bg-[#0B0B10] border-[#262635] focus:border-[#A3E635] focus:ring-[#A3E635]/20 text-white rounded-xl h-11 ${errors.name ? 'border-red-500/80' : ''}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 bg-[#0B0B10] border-[#262635] focus:border-[#A3E635] focus:ring-[#A3E635]/20 text-white rounded-xl h-11 ${errors.email ? 'border-red-500/80' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 bg-[#0B0B10] border-[#262635] focus:border-[#A3E635] focus:ring-[#A3E635]/20 text-white rounded-xl h-11 ${errors.password ? 'border-red-500/80' : ''}`}
                />
              </div>
              {errors.password ? (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#A3E635]" /> Use pelo menos 8 caracteres.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={`pl-10 bg-[#0B0B10] border-[#262635] focus:border-[#A3E635] focus:ring-[#A3E635]/20 text-white rounded-xl h-11 ${errors.passwordConfirm ? 'border-red-500/80' : ''}`}
                />
              </div>
              {errors.passwordConfirm && (
                <p className="text-xs text-red-400 mt-1">{errors.passwordConfirm}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#0B0B10] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar conta e continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[#A3E635] font-bold hover:underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
