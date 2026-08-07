import { Plus, Loader2, AlertCircle, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/services/coach'
import { ConversationItem } from './ConversationItem'

interface ConversationListProps {
  conversations: Conversation[]
  activeId: string | null
  loading: boolean
  error: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onRetry?: () => void
}

/**
 * Sidebar de conversas anteriores do Coach IA.
 * - Botão "Nova conversa" no topo
 * - Lista de conversas (título + data relativa), ativa destacada em verde
 * - Estados: loading, erro, vazio
 */
export function ConversationList({
  conversations,
  activeId,
  loading,
  error,
  onSelect,
  onNew,
  onRetry,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Nova conversa */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className={cn(
            'flex items-center justify-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm font-semibold',
            'bg-[#A3E635] text-[#0B0B10] hover:bg-[#BEF264] hover:shadow-[0_0_18px_rgba(163,230,53,0.35)]',
            'transition-all',
          )}
        >
          <Plus className="w-4 h-4" />
          Nova conversa
        </button>
      </div>

      {/* Rótulo */}
      <div className="px-4 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Histórico
        </p>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mb-2" />
            <p className="text-xs">Carregando conversas…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <AlertCircle className="w-5 h-5 text-red-400 mb-2" />
            <p className="text-xs text-red-300 mb-3">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-2"
              >
                Tentar novamente
              </button>
            )}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <History className="w-6 h-6 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">Nenhuma conversa ainda</p>
          </div>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              active={c.id === activeId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ConversationList
