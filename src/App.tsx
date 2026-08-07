/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import Index from './pages/Index'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Diets from './pages/Diets'
import Recipes from './pages/Recipes'
import Exercises from './pages/Exercises'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Onboarding from './pages/Onboarding'
import Coach from './pages/Coach'
import Profile from './pages/Profile'

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
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes — auth guard + authenticated Layout (sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/coach" element={<Coach />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* ADD ALL PROTECTED ROUTES HERE (treinos, dietas, receitas, exercicios, coach, onboarding, configuracoes) */}
              <Route path="/treinos" element={<Workouts />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dietas" element={<Diets />} />
              <Route path="/receitas" element={<Recipes />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/exercises" element={<Exercises />} />
              <Route path="/exercicios" element={<Exercises />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
