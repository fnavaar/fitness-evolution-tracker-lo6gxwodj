import { LayoutDashboard } from 'lucide-react'

/**
 * Página placeholder do Dashboard.
 * Será substituída pelo conteúdo completo em breve — existe apenas para
 * não quebrar a navegação após o login/redirecionamento da raiz.
 */
export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400">Visão geral da sua evolução fitness</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-10 md:p-16 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Em breve</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Estamos preparando seu painel de evolução com treinos, dieta e métricas. Volte em breve!
        </p>
      </div>
    </div>
  )
}
