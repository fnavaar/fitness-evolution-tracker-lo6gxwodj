/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import Index from './pages/Index'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Onboarding from './pages/Onboarding'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public routes — standalone, no authenticated layout */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes — auth guard + authenticated Layout (sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* ADD ALL PROTECTED ROUTES HERE (treinos, dietas, receitas, exercicios, coach, onboarding, configuracoes) */}
              <Route path="/treinos" element={<Workouts />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
