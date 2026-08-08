import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { ChevronUp, ChevronDown, Sparkles, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendSpecialistMessage, streamSpecialistChat } from '@/services/workouts'
import { useToast } from '@/hooks/use-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

const INITIAL_MESSAGE: ChatMessage = {
  id: 'specialist-welcome',
  role: 'assistant',
  content:
    'Olá! Sou o Especialista de Treinos. Posso refinar seus treinos ou gerar novos baseados no plano do Coach Rocha. Como posso ajudar?',
}

interface WorkoutSpecialistChatProps {
  /** Callback disparado quando o especialista menciona criar/processar treinos. */
  onWorkoutsChanged?: () => void
}

/**
 * Chat colapsável com o Especialista de Treinos (agente workout-specialist),
 * restrito à área /treinos. Inicia colapsado como uma barra fixa no bottom.
 */
export function WorkoutSpecialistChat({ onWorkoutsChanged }: WorkoutSpecialistChatProps) {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // conversationId ref para uso dentro de handleSend sem stale closure.
  const conversationIdRef = useRef<string | null>(null)
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isResponding, expanded, scrollToBottom])

  // Auto-expande a textarea até um limite.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [input])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isResponding) return

      const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed }
      const assistantId = uid()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setInput('')
      setIsResponding(true)

      const controller = new AbortController()
      abortRef.current = controller

      let createdOrUpdatedWorkouts = false

      try {
        const res = await sendSpecialistMessage(trimmed, {
          conversationId: conversationIdRef.current,
          signal: controller.signal,
        })

        const headerConv = res.headers.get('X-Conversation-Id')
        if (headerConv) {
          conversationIdRef.current = headerConv
          setConversationId(headerConv)
        }

        const result = await streamSpecialistChat(res, {
          onChunk: (_delta, full) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: full, streaming: true } : m,
              ),
            )
            createdOrUpdatedWorkouts = true // há conteúdo de resposta — possível mudança
          },
          onError: (msg) => {
            throw new Error(msg)
          },
          signal: controller.signal,
        })

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
        )

        // Se a resposta indica que treinos podem ter sido criados/atualizados,
        // notifica a página para recarregar a lista.
        if (createdOrUpdatedWorkouts && onWorkoutsChanged) {
          onWorkoutsChanged()
        }

        // Heurística: se o conteúdo menciona criação de treino, dispara reload.
        const content = result.content || ''
        if (
          onWorkoutsChanged &&
          /(criei|treino criado|treino completo|workout|adicionado|atualizado|pronto)/i.test(
            content,
          )
        ) {
          onWorkoutsChanged()
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
          )
          setIsResponding(false)
          abortRef.current = null
          return
        }

        console.error('Erro no chat do especialista:', err)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        toast({
          title: 'Erro ao falar com o Especialista',
          description: 'Não foi possível obter a resposta. Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setIsResponding(false)
        abortRef.current = null
      }
    },
    [isResponding, onWorkoutsChanged, toast],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleQuickGenerate = () => {
    sendMessage(
      'Gerar do plano do Coach: processe meus coach_drafts de treino pendentes (type="workout", status="proposta"), crie o treino completo no banco de dados (workouts + workout_exercises) usando os exercícios do catálogo e, ao final, atualize o draft para status="confirmado".',
    )
  }

  const lastMessage = messages[messages.length - 1]
  const showTyping = isResponding && lastMessage?.role === 'assistant' && !lastMessage.content

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:left-0 pointer-events-none">
      <div className="mx-auto max-w-5xl px-3 pb-3 pointer-events-auto">
        <div className="rounded-2xl border border-[#262635] bg-[#0B0B10] shadow-2xl shadow-black/50 overflow-hidden">
          {/* Header / barra colapsada */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[#12121A] hover:bg-[#1A1A24] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 shrink-0 rounded-xl bg-[#A3E635]/15 text-[#A3E635] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-sm font-extrabold text-white truncate">
                  💬 Especialista de Treinos
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {expanded ? 'Recolher' : 'Refine ou gere treinos a partir do plano do Coach'}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-slate-400">
              {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </span>
          </button>

          {/* Corpo expandido */}
          {expanded && (
            <div className="flex flex-col">
              {/* Área de mensagens */}
              <div ref={scrollRef} className="max-h-[300px] overflow-y-auto px-3 py-3 space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
                        m.role === 'user'
                          ? 'bg-[#A3E635] text-[#0B0B10] font-medium rounded-br-sm'
                          : 'bg-[#1A1A24] text-slate-100 border border-[#262635] rounded-bl-sm',
                      )}
                    >
                      {m.content || (m.streaming ? '' : '')}
                      {m.streaming && m.content && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#A3E635] animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                ))}

                {showTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1A1A24] border border-[#262635] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Ação rápida + input */}
              <div className="border-t border-[#262635] px-3 py-2.5 space-y-2">
                <button
                  type="button"
                  onClick={handleQuickGenerate}
                  disabled={isResponding}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all',
                    'bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/30 hover:bg-[#A3E635]/20',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gerar do plano do Coach
                </button>

                <div className="flex items-end gap-2 rounded-xl bg-[#12121A] border border-[#262635] focus-within:border-[#A3E635]/50 transition-colors px-2.5 py-1.5">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isResponding}
                    placeholder="Refinar meu treino de peito... ou Gerar treino do plano do Coach"
                    className="flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none py-1.5 max-h-32 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage(input)}
                    disabled={isResponding || !input.trim()}
                    aria-label="Enviar mensagem"
                    className={cn(
                      'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      'bg-[#A3E635] text-[#0B0B10] hover:bg-[#BEF264]',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                    )}
                  >
                    {isResponding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkoutSpecialistChat
