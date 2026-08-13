import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

interface AuthContextType {
  user: RecordModel | null
  token: string | null
  isLoading: boolean
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RecordModel | null>(pb.authStore.record)
  const [token, setToken] = useState<string | null>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    if (pb.authStore.isValid) {
      try {
        const authData = await pb.collection('users').authRefresh()
        setUser(authData.record)
        setToken(authData.token)
      } catch (err) {
        pb.authStore.clear()
        setUser(null)
        setToken(null)
      }
    } else {
      setUser(null)
      setToken(null)
    }
  }

  useEffect(() => {
    // No boot, valida a sessão existente no localStorage: chama authRefresh
    // para confirmar que o usuário autenticado ainda existe no backend.
    // Se o usuário foi deletado (ou o token expirou), authRefresh falha e
    // limpamos o authStore — evitando criar perfil com user_id órfão.
    async function validateSession() {
      if (pb.authStore.isValid) {
        try {
          const authData = await pb.collection('users').authRefresh()
          setUser(authData.record)
          setToken(authData.token)
        } catch (err) {
          console.error('Sessão inválida no boot, limpando:', err)
          pb.authStore.clear()
          setUser(null)
          setToken(null)
        }
      } else {
        setUser(null)
        setToken(null)
      }
      setIsLoading(false)
    }

    validateSession()

    const unsubscribe = pb.authStore.onChange((tok, rec) => {
      setUser(rec)
      setToken(tok)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
