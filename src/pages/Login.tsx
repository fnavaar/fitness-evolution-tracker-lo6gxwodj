import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Insira um e-mail válido.'
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return { errors: newErrors }
    }

    setErrors({})
    setLoading(true)

    try {
      await pb.collection('users').authWithPassword(email, password)
      await refreshUser()
      navigate('/dashboard')
    } catch (err: any) {
      setErrors({ general: 'E-mail ou senha incorretos. Tente novamente.' })
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
          <CardTitle className="text-2xl font-extrabold tracking-tight">Acesse sua conta</CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Digite suas credenciais para acessar seu painel fitness
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 bg-[#0B0B10] border-[#262635] focus:border-[#A3E635] focus:ring-[#A3E635]/20 text-white rounded-xl h-11 ${
                    errors.email ? 'border-red-500/80 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Senha
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#A3E635] hover:underline font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 bg-[#0B0B10] border-[#262635] focus:border-[#A3E635] focus:ring-[#A3E635]/20 text-white rounded-xl h-11 ${
                    errors.password ? 'border-red-500/80 focus:border-red-500' : ''
                  }`}
                />
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
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
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Ainda não tem uma conta?{' '}
            <Link to="/signup" className="text-[#A3E635] font-bold hover:underline">
              Criar conta gratuita
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
