import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoachAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  withRing?: boolean
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-11 h-11',
  lg: 'w-20 h-20',
}

const iconSize = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-9 h-9',
}

/**
 * Avatar do Coach Rocha — ícone de halter em círculo com anel lime,
 * sobre fundo gradiente. Usado no header, nas mensagens e no welcome.
 */
export function CoachAvatar({ size = 'md', className, withRing = true }: CoachAvatarProps) {
  return (
    <div
      className={cn(
        'relative shrink-0',
        withRing && 'p-[2px] rounded-full bg-gradient-to-br from-[#A3E635] to-[#65A30D]',
        className,
      )}
    >
      <div
        className={cn(
          sizeMap[size],
          'rounded-full bg-[#12121A] flex items-center justify-center text-[#A3E635] overflow-hidden',
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#A3E635]/10 to-transparent rounded-full" />
        <Dumbbell className={cn(iconSize[size], 'relative z-10')} />
      </div>
    </div>
  )
}
