import { memo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UtensilsCrossed, Flame, ChevronRight, Beef, Wheat, Droplet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type DietRecord, DIET_GOAL_LABELS, DIET_PREFERENCE_LABELS } from '@/services/diets'
import { Skeleton } from '@/components/ui/skeleton'

interface DietCardProps {
  diet: DietRecord
  onSeeDetails: (diet: DietRecord) => void
}

const GOAL_ACCENT: Record<string, string> = {
  hipertrofia: 'bg-[#FB923C]/10 text-[#FB923C]',
  emagrecimento: 'bg-[#22D3EE]/10 text-[#22D3EE]',
  condicionamento: 'bg-[#A3E635]/10 text-[#A3E635]',
  resistencia: 'bg-[#A78BFA]/10 text-[#A78BFA]',
}

function DietCardBase({ diet, onSeeDetails }: DietCardProps) {
  const createdLabel = format(new Date(diet.created), "dd 'de' MMM 'de' yyyy", {
    locale: ptBR,
  })

  return (
    <Card className="group relative flex flex-col bg-[#12121A] border-[#262635] rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#FB923C]/30 hover:shadow-lg hover:shadow-[#FB923C]/5 hover:-translate-y-1">
      <CardContent className="p-5 flex flex-col h-full gap-4">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
              GOAL_ACCENT[diet.goal] || 'bg-[#FB923C]/10 text-[#FB923C]'
            }`}
          >
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
              {diet.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{createdLabel}</p>
          </div>
        </div>

        {/* Meta calórica */}
        <div className="flex items-center gap-2 rounded-xl bg-[#0B0B10]/60 border border-[#262635]/60 px-3 py-2">
          <Flame className="w-4 h-4 text-[#FB923C]" />
          <span className="text-sm font-bold text-white">
            {diet.daily_calories.toLocaleString('pt-BR')} kcal/dia
          </span>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#0B0B10]/60 border border-[#262635]/60 px-2 py-1.5 text-center">
            <Beef className="w-3.5 h-3.5 mx-auto mb-1 text-[#A3E635]" />
            <p className="text-xs font-bold text-white">{diet.protein}g</p>
            <p className="text-[10px] text-slate-500">Proteína</p>
          </div>
          <div className="rounded-lg bg-[#0B0B10]/60 border border-[#262635]/60 px-2 py-1.5 text-center">
            <Wheat className="w-3.5 h-3.5 mx-auto mb-1 text-[#22D3EE]" />
            <p className="text-xs font-bold text-white">{diet.carbs}g</p>
            <p className="text-[10px] text-slate-500">Carbo</p>
          </div>
          <div className="rounded-lg bg-[#0B0B10]/60 border border-[#262635]/60 px-2 py-1.5 text-center">
            <Droplet className="w-3.5 h-3.5 mx-auto mb-1 text-[#A78BFA]" />
            <p className="text-xs font-bold text-white">{diet.fat}g</p>
            <p className="text-[10px] text-slate-500">Gordura</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {DIET_GOAL_LABELS[diet.goal]}
          </Badge>
          <Badge variant="outline" className="border-[#262635] bg-[#0B0B10] text-slate-300">
            {DIET_PREFERENCE_LABELS[diet.preference || 'onivoro']}
          </Badge>
        </div>

        {/* Descrição */}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 flex-1">
          {diet.description}
        </p>

        {/* Ação */}
        <Button
          variant="ghost"
          onClick={() => onSeeDetails(diet)}
          className="w-full justify-between text-slate-300 hover:text-[#FB923C] hover:bg-[#FB923C]/5 rounded-xl h-10 font-semibold"
        >
          Ver detalhes
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

export const DietCard = memo(DietCardBase)
export default DietCard

/* ----------------- Skeleton de dieta ----------------- */

export function DietCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#262635] bg-[#12121A] p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="w-11 h-11 rounded-xl bg-[#1A1A24]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 bg-[#1A1A24]" />
          <Skeleton className="h-3 w-1/2 bg-[#1A1A24]" />
        </div>
      </div>
      <Skeleton className="h-10 w-full bg-[#1A1A24]" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-14 w-full bg-[#1A1A24]" />
        <Skeleton className="h-14 w-full bg-[#1A1A24]" />
        <Skeleton className="h-14 w-full bg-[#1A1A24]" />
      </div>
      <Skeleton className="h-3 w-full bg-[#1A1A24]" />
      <Skeleton className="h-3 w-5/6 bg-[#1A1A24]" />
      <Skeleton className="h-9 w-full bg-[#1A1A24]" />
    </div>
  )
}
