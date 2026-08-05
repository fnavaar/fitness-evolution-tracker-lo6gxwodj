import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Raiz do app — sem landing page.
 * Redireciona imediatamente com base no status de autenticação:
 *  - autenticado → /coach
 *  - não autenticado → /login
 */
export default function Index() {
  const { user, isLoading } = useAuth()

  // Enquanto o estado de auth é resolvido, mostra o loader padrão do app.
  if (isLoading) {
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

  return <Navigate to={user ? '/coach' : '/login'} replace />
}
