import { memo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  icon: LucideIcon
  label: string
  value: string
  /** Texto auxiliar exibido abaixo do valor (ex: variação). Opcional. */
  hint?: string
  /** Estado da dica — controla a cor. */
  hintTone?: 'positive' | 'negative' | 'neutral'
  /** Tom do ícone/círculo. */
  accent?: 'lime' | 'orange' | 'cyan' | 'violet' | 'pink'
  isLoading?: boolean
}

const ACCENT_BG: Record<NonNullable<SummaryCardProps['accent']>, string> = {
  lime: 'bg-[#A3E635]/10 text-[#A3E635]',
  orange: 'bg-[#FB923C]/10 text-[#FB923C]',
  cyan: 'bg-[#22D3EE]/10 text-[#22D3EE]',
  violet: 'bg-[#A78BFA]/10 text-[#A78BFA]',
  pink: 'bg-[#F472B6]/10 text-[#F472B6]',
}

const HINT_TONE: Record<NonNullable<SummaryCardProps['hintTone']>, string> = {
  positive: 'text-[#A3E635]',
  negative: 'text-[#FB923C]',
  neutral: 'text-slate-400',
}

function SummaryCardBase({
  icon: Icon,
  label,
  value,
  hint,
  hintTone = 'neutral',
  accent = 'lime',
  isLoading = false,
}: SummaryCardProps) {
  return (
    <Card className="group bg-[#12121A] border-[#262635] rounded-2xl transition-all duration-300 hover:border-[#A3E635]/30 hover:shadow-lg hover:shadow-[#A3E635]/5 hover:-translate-y-0.5">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
            ACCENT_BG[accent],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-20 bg-[#1A1A24]" />
              <Skeleton className="h-3.5 w-24 bg-[#1A1A24]" />
            </div>
          ) : (
            <>
              <p className="text-xl md:text-2xl font-extrabold text-white tracking-tight truncate">
                {value}
              </p>
              <p className="text-xs md:text-sm text-slate-400 font-medium truncate">{label}</p>
              {hint && (
                <p className={cn('text-xs font-semibold mt-0.5', HINT_TONE[hintTone])}>{hint}</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const SummaryCard = memo(SummaryCardBase)
export default SummaryCard
