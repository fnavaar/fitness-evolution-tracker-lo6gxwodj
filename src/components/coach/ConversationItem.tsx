import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/services/coach'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onSelect: (id: string) => void
}

/** Distância relativa amigável em pt-BR: Hoje, Ontem, Há N dias/semanas. */
function relativeDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86400000)
  if (diffDays <= 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `Há ${diffDays} dias`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'Há 1 semana' : `Há ${weeks} semanas`
  }
  const months = Math.floor(diffDays / 30)
  return months === 1 ? 'Há 1 mês' : `Há ${months} meses`
}

function truncate(text: string, max = 40): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max).trimEnd() + '…'
}

/**
 * Item individual de conversa na sidebar — título truncado + data relativa.
 * Destaque com accent verde quando ativa.
 */
export function ConversationItem({ conversation, active, onSelect }: ConversationItemProps) {
  const dateLabel = relativeDate(conversation.updated || conversation.created)
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        'group w-full text-left rounded-xl px-3 py-2.5 transition-colors',
        'border border-transparent',
        active
          ? 'bg-[#A3E635]/10 border-[#A3E635]/30'
          : 'hover:bg-[#1A1A24] hover:border-[#262635]',
      )}
    >
      <div className="flex items-start gap-2">
        <MessageSquare
          className={cn(
            'w-4 h-4 mt-0.5 shrink-0',
            active ? 'text-[#A3E635]' : 'text-slate-500 group-hover:text-slate-400',
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm leading-snug truncate',
              active ? 'text-[#ECFCCB] font-semibold' : 'text-slate-300',
            )}
          >
            {truncate(conversation.title) || 'Conversa'}
          </p>
          {dateLabel && <p className="mt-0.5 text-[11px] text-slate-500">{dateLabel}</p>}
        </div>
      </div>
    </button>
  )
}

export default ConversationItem
