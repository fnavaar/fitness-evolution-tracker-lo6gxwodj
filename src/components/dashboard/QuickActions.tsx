import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, UtensilsCrossed, Ruler, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface QuickAction {
  icon: LucideIcon
  title: string
  description: string
  to: string
  cta: string
  accent: 'lime' | 'orange' | 'cyan'
}

const ACTIONS: QuickAction[] = [
  {
    icon: Dumbbell,
    title: 'Gerar Treino',
    description: 'Crie um plano de treino personalizado com IA baseado no seu objetivo.',
    to: '/treinos',
    cta: 'Gerar treino',
    accent: 'lime',
  },
  {
    icon: UtensilsCrossed,
    title: 'Gerar Dieta',
    description: 'Monte uma dieta sob medida com macronutrientes ajustados a você.',
    to: '/dietas',
    cta: 'Gerar dieta',
    accent: 'orange',
  },
  {
    icon: Ruler,
    title: 'Registrar Medidas',
    description: 'Adicione peso, medidas e % de gordura para acompanhar sua evolução.',
    to: '/dashboard',
    cta: 'Registrar agora',
    accent: 'cyan',
  },
]

const ACCENT_CLASSES: Record<QuickAction['accent'], { icon: string; btn: string }> = {
  lime: {
    icon: 'bg-[#A3E635]/10 text-[#A3E635]',
    btn: 'bg-[#A3E635] hover:bg-[#84CC16] text-[#0B0B10]',
  },
  orange: {
    icon: 'bg-[#FB923C]/10 text-[#FB923C]',
    btn: 'bg-[#FB923C] hover:bg-[#F97316] text-[#0B0B10]',
  },
  cyan: {
    icon: 'bg-[#22D3EE]/10 text-[#22D3EE]',
    btn: 'bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0B0B10]',
  },
}

function QuickActionsBase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        const styles = ACCENT_CLASSES[action.accent]
        return (
          <Card
            key={action.title}
            className="group bg-[#12121A] border-[#262635] rounded-2xl transition-all duration-300 hover:border-[#A3E635]/30 hover:shadow-lg hover:shadow-[#A3E635]/5 hover:-translate-y-0.5"
          >
            <CardContent className="p-5 flex flex-col h-full">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${styles.icon}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">{action.title}</h3>
              <p className="text-sm text-slate-400 mt-1 flex-1 leading-relaxed">
                {action.description}
              </p>
              <Button
                asChild
                className={`mt-4 w-full font-bold rounded-xl h-10 transition-all ${styles.btn}`}
              >
                <Link to={action.to} className="flex items-center justify-center gap-2">
                  {action.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export const QuickActions = memo(QuickActionsBase)
export default QuickActions
