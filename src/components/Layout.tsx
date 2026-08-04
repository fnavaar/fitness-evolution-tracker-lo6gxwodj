import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  BookOpen,
  Library,
  Bot,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  Flame,
  User as UserIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    async function checkProfile() {
      if (user && location.pathname !== '/onboarding') {
        try {
          const profiles = await pb.collection('profiles').getList(1, 1, {
            filter: `user_id = "${user.id}"`,
          })
          if (profiles.items.length === 0) {
            navigate('/onboarding', { replace: true })
          }
        } catch (e) {
          console.error('Erro ao verificar perfil:', e)
        }
      }
      setCheckingProfile(false)
    }

    checkProfile()
  }, [user, location.pathname, navigate])

  if (user && location.pathname !== '/onboarding' && checkingProfile) {
    return (
      <div className="min-h-screen bg-[#0B0B10] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#A3E635] border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm font-medium animate-pulse">
            Carregando EvolutFit...
          </p>
        </div>
      </div>
    )
  }

  // Onboarding layout (full page container)
  if (location.pathname === '/onboarding') {
    return (
      <div className="min-h-screen bg-[#0B0B10] text-[#F8FAFC] flex flex-col justify-center items-center p-4 relative">
        <div className="absolute top-10 left-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#A3E635] to-[#84CC16] flex items-center justify-center font-extrabold text-[#0B0B10]">
            EF
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Evolut<span className="text-[#A3E635]">Fit</span>
          </span>
        </div>
        <Outlet />
      </div>
    )
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Treinos', path: '/treinos', icon: Dumbbell },
    { label: 'Dietas', path: '/dietas', icon: UtensilsCrossed },
    { label: 'Receitas', path: '/receitas', icon: BookOpen },
    { label: 'Exercícios', path: '/exercicios', icon: Library },
    { label: 'Coach IA', path: '/coach', icon: Bot },
  ]

  const avatarUrl = user.avatar
    ? pb.files.getURL(user, user.avatar)
    : `https://img.usecurling.com/ppl/128?seed=${user.id}`

  return (
    <div className="min-h-screen bg-[#0B0B10] text-[#F8FAFC] flex flex-col md:flex-row">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#12121A] border-r border-[#262635] fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-[#262635]">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A3E635] to-[#84CC16] flex items-center justify-center font-black text-[#0B0B10] text-lg shadow-lg shadow-[#A3E635]/20 group-hover:scale-105 transition-transform">
              EF
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Evolut<span className="text-[#A3E635]">Fit</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Evolution Tech
              </span>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative group ${
                    isActive
                      ? 'bg-[#1A1A24] text-[#A3E635] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1A1A24]/50'
                  }`
                }
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#A3E635] rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 ${isActive ? 'text-[#A3E635]' : 'text-slate-400 group-hover:text-slate-200'}`}
                />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* User Block at bottom */}
        <div className="p-4 border-t border-[#262635] bg-[#0B0B10]/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#12121A] border border-[#262635]">
            <NavLink
              to="/configuracoes"
              className="flex items-center gap-3 overflow-hidden flex-1 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-10 h-10 border border-[#262635]">
                <AvatarImage src={avatarUrl} alt={user.name || 'Usuário'} />
                <AvatarFallback className="bg-[#1A1A24] text-[#A3E635]">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white truncate">
                  {user.name || 'Atleta'}
                </span>
                <span className="text-xs text-slate-400 truncate">{user.email}</span>
              </div>
            </NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between h-16 px-4 bg-[#12121A] border-b border-[#262635] sticky top-0 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#12121A] border-[#262635] text-white p-0 w-72">
            <div className="h-16 flex items-center px-6 border-b border-[#262635]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#A3E635] flex items-center justify-center font-extrabold text-[#0B0B10]">
                  EF
                </div>
                <span className="font-extrabold text-lg text-white">EvolutFit</span>
              </div>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-[#1A1A24] text-[#A3E635]' : 'text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
              <div className="pt-4 border-t border-[#262635] mt-4">
                <NavLink
                  to="/configuracoes"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400"
                >
                  <Settings className="w-5 h-5" />
                  <span>Configurações</span>
                </NavLink>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#A3E635] flex items-center justify-center font-extrabold text-[#0B0B10]">
            EF
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Evolut<span className="text-[#A3E635]">Fit</span>
          </span>
        </NavLink>

        <NavLink to="/configuracoes">
          <Avatar className="w-8 h-8 border border-[#262635]">
            <AvatarImage src={avatarUrl} alt={user.name || 'Perfil'} />
            <AvatarFallback className="bg-[#1A1A24] text-[#A3E635] text-xs">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </AvatarFallback>
          </Avatar>
        </NavLink>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between">
        <div className="animate-fade-in-up">
          <Outlet />
        </div>

        <footer className="mt-12 pt-6 border-t border-[#262635] flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EvolutFit. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido para sua melhor performance física{' '}
            <Flame className="w-3.5 h-3.5 text-[#FB923C]" />
          </p>
        </footer>
      </main>
    </div>
  )
}
