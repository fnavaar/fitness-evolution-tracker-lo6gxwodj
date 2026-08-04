import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sparkles,
  Dumbbell,
  Utensils,
  Activity,
  Apple,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export default function Index() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    navigate('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-[#0B0B10] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#A3E635] selection:text-[#0B0B10]">
      {/* Top Navbar */}
      <header className="container mx-auto max-w-7xl px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A3E635] to-[#84CC16] flex items-center justify-center font-black text-[#0B0B10] text-xl shadow-lg shadow-[#A3E635]/20">
            EF
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Evolut<span className="text-[#A3E635]">Fit</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-[#1A1A24] rounded-xl"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold rounded-xl shadow-lg shadow-[#A3E635]/20 hover:scale-105 transition-all">
              Começar agora
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-6 pt-12 pb-20 text-center relative z-10 flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#12121A] border border-[#262635] text-xs font-semibold text-[#A3E635] mb-8 shadow-sm">
          <Sparkles className="w-4 h-4 text-[#A3E635]" />
          <span>Inteligência Artificial aplicada aos seus treinos e dieta</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] mb-6">
          <span className="bg-gradient-to-r from-[#A3E635] via-[#84CC16] to-[#FB923C] bg-clip-text text-transparent">
            Evolua
          </span>{' '}
          seu corpo. Supere seus limites.
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed mb-10">
          A plataforma definitiva de gestão fitness. Treinos personalizados por IA, plano
          nutricional sob medida, fichas técnicas de alimentos e métricas detalhadas da sua
          evolução.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-13 px-8 bg-gradient-to-r from-[#A3E635] to-[#84CC16] hover:brightness-110 text-[#0B0B10] font-bold text-base rounded-xl shadow-xl shadow-[#A3E635]/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              <span>Começar agora</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#funcionalidades" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-13 px-8 border-[#262635] bg-[#12121A] text-slate-200 hover:bg-[#1A1A24] font-semibold text-base rounded-xl"
            >
              Ver funcionalidades
            </Button>
          </a>
        </div>

        {/* Dashboard Floating Preview Card */}
        <div className="w-full max-w-5xl rounded-2xl bg-[#12121A]/80 border border-[#262635] p-4 md:p-6 shadow-2xl backdrop-blur-xl relative group animate-float">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#A3E635]/10 to-[#FB923C]/10 rounded-2xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-[#262635] pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-slate-400 font-medium ml-2">
                Painel de Controle — EvolutFit Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#A3E635]/10 text-[#A3E635] font-bold">
                Online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left mb-6">
            <div className="p-4 rounded-xl bg-[#1A1A24] border border-[#262635]">
              <span className="text-xs text-slate-400 font-medium">Peso Atual</span>
              <div className="text-2xl font-bold text-white mt-1">78.0 kg</div>
              <span className="text-xs text-[#A3E635] font-semibold">↓ -6.0 kg acumulado</span>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A24] border border-[#262635]">
              <span className="text-xs text-slate-400 font-medium">Gordura Corporal</span>
              <div className="text-2xl font-bold text-white mt-1">16.2 %</div>
              <span className="text-xs text-[#A3E635] font-semibold">↓ -5.8% redução</span>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A24] border border-[#262635]">
              <span className="text-xs text-slate-400 font-medium">IMC</span>
              <div className="text-2xl font-bold text-white mt-1">24.6</div>
              <span className="text-xs text-slate-400 font-semibold">Faixa ideal</span>
            </div>
            <div className="p-4 rounded-xl bg-[#1A1A24] border border-[#262635]">
              <span className="text-xs text-slate-400 font-medium">Treinos Concluídos</span>
              <div className="text-2xl font-bold font-white mt-1">24</div>
              <span className="text-xs text-[#FB923C] font-semibold">🔥 100% frequência</span>
            </div>
          </div>

          <div className="h-32 w-full rounded-xl bg-[#1A1A24]/60 border border-[#262635] p-4 flex items-end justify-between gap-2">
            {[40, 55, 45, 65, 75, 80, 70, 85, 90, 95, 100].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-[#84CC16]/20 to-[#A3E635] rounded-t-sm"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="funcionalidades"
        className="container mx-auto max-w-7xl px-6 py-20 relative z-10"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Recursos projetados para sua <span className="text-[#A3E635]">alta performance</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Uma suíte completa de ferramentas alimentadas por inteligência artificial para otimizar
            cada etapa da sua transformação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#12121A] border-[#262635] hover:border-[#A3E635]/40 hover:-translate-y-1 transition-all rounded-2xl p-2">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center mb-6">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Treinos Personalizados por IA</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Algoritmos adaptativos criam rotinas de exercícios sob medida com base no seu
                objetivo e frequência semanal.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#12121A] border-[#262635] hover:border-[#FB923C]/40 hover:-translate-y-1 transition-all rounded-2xl p-2">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center mb-6">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dietas Nutricionais</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Planos alimentares ajustados com precisão de calorias e distribuição ideal de
                macronutrientes para o seu foco.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#12121A] border-[#262635] hover:border-[#A3E635]/40 hover:-translate-y-1 transition-all rounded-2xl p-2">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dashboard de Evolução</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Gráficos interativos para acompanhar peso, circunferências corporais, progressão de
                cargas e resumo semanal.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#12121A] border-[#262635] hover:border-[#FB923C]/40 hover:-translate-y-1 transition-all rounded-2xl p-2">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-[#FB923C]/10 text-[#FB923C] flex items-center justify-center mb-6">
                <Apple className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ficha Técnica de Alimentos</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cardápio de receitas completas com tabela nutricional por porção e 100g, além de
                busca semântica inteligente.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto max-w-5xl px-6 py-16 mb-12 relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#12121A] via-[#1A1A24] to-[#12121A] border border-[#262635] p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Pronto para transformar seu corpo?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8 text-base">
            Junte-se à nova era da gestão fitness. Cadastre-se em segundos e receba seus planos
            personalizados.
          </p>
          <Link to="/signup">
            <Button className="h-13 px-10 bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10] font-bold text-lg rounded-xl shadow-xl shadow-[#A3E635]/20 hover:scale-105 transition-all">
              Criar conta gratuita
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
