import { useState, useRef, useEffect } from 'react'
import { MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/services/coach'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface ConversationItemProps {
  conversation: Conversation
  active: boolean
  onSelect: (id: string) => void
  onRename: (id: string, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
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
 * Menu de contexto (⋮) com renomear (edição inline) e excluir (AlertDialog).
 */
export function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const dateLabel = relativeDate(conversation.updated || conversation.created)

  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(conversation.title)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming])

  const startRename = () => {
    setRenameValue(conversation.title)
    setRenaming(true)
  }

  const commitRename = async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === conversation.title) {
      setRenaming(false)
      return
    }
    setSubmitting(true)
    try {
      await onRename(conversation.id, trimmed)
      setRenaming(false)
    } catch {
      // mantém o modo de edição para o usuário corrigir
    } finally {
      setSubmitting(false)
    }
  }

  const cancelRename = () => {
    setRenameValue(conversation.title)
    setRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelRename()
    }
  }

  return (
    <div
      className={cn(
        'group relative w-full text-left rounded-xl px-3 py-2.5 transition-colors',
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
          {renaming ? (
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => void commitRename()}
              disabled={submitting}
              maxLength={200}
              className="bg-[#1A1A24] border border-[#A3E635]/50 rounded-lg px-2 py-1 text-sm text-white w-full outline-none focus:border-[#A3E635]"
            />
          ) : (
            <button
              type="button"
              onClick={() => onSelect(conversation.id)}
              className="block w-full text-left"
            >
              <p
                className={cn(
                  'text-sm leading-snug truncate',
                  active ? 'text-[#ECFCCB] font-semibold' : 'text-slate-300',
                )}
              >
                {truncate(conversation.title) || 'Conversa'}
              </p>
              {dateLabel && <p className="mt-0.5 text-[11px] text-slate-500">{dateLabel}</p>}
            </button>
          )}
        </div>

        {/* Menu de contexto (⋮) — visível no hover, exceto durante a edição */}
        {!renaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'shrink-0 p-1 rounded-md transition-colors',
                  'text-slate-500 hover:text-white hover:bg-[#262635]',
                  'opacity-0 group-hover:opacity-100 focus:opacity-100',
                  active && 'opacity-60',
                )}
                aria-label="Opções da conversa"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#12121A] border-[#262635] text-slate-200"
            >
              <DropdownMenuItem
                onSelect={() => startRename()}
                className="cursor-pointer focus:bg-[#1A1A24] focus:text-white"
              >
                <Pencil className="w-4 h-4 text-slate-400" />
                Renomear
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
                      'text-red-300 hover:bg-red-500/10 hover:text-red-200',
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#12121A] border-[#262635] text-slate-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Todas as mensagens desta conversa serão perdidas permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent border-[#262635] text-slate-300 hover:bg-[#1A1A24] hover:text-white">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => void onDelete(conversation.id)}
                      className="bg-red-600 text-white hover:bg-red-700 border-transparent"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default ConversationItem
