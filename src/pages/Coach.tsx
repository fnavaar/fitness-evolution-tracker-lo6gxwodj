import { useState, useRef, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { sendMessage, streamCoachChat, loadCoachContext, type ChatMessage } from '@/services/coach'
import { CoachAvatar } from '@/components/coach/CoachAvatar'
import { ChatMessage as ChatMessageBubble } from '@/components/coach/ChatMessage'
import { ChatInput } from '@/components/coach/ChatInput'
import { TypingIndicator } from '@/components/coach/TypingIndicator'
import { WelcomeScreen } from '@/components/coach/WelcomeScreen'

interface CoachMessage extends ChatMessage {
  id: string
  streaming?: boolean
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

export default function Coach() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [isResponding, setIsResponding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [lastUserText, setLastUserText] = useState<string>('')

  const contextRef = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Carrega o contexto de personalização uma vez por usuário.
  useEffect(() => {
    if (!user?.id) return
    let active = true
    loadCoachContext(user.id)
      .then((ctx) => {
        if (active) contextRef.current = ctx
      })
      .catch(() => {
        /* contexto é best-effort */
      })
    return () => {
      active = false
    }
  }, [user?.id])

  // Auto-scroll para o final a cada nova mensagem / chunk.
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isResponding, scrollToBottom])

  const handleSend = useCallback(
    async (text: string) => {
      if (!user || isResponding) return
      setError(null)
      setLastUserText(text)

      const userMsg: CoachMessage = { id: uid(), role: 'user', content: text }
      const assistantId = uid()
      const assistantMsg: CoachMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsResponding(true)

      const controller = new AbortController()
      abortRef.current = controller

      // Envia contexto apenas na primeira mensagem da conversa.
      const isFirstMessage = conversationId === null
      const context = isFirstMessage ? contextRef.current : ''

      try {
        const res = await sendMessage(
          [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
          {
            conversationId,
            context,
            signal: controller.signal,
          },
        )

        // Captura o conversation_id do header se disponível.
        const headerConv = res.headers.get('X-Conversation-Id')
        if (headerConv) setConversationId(headerConv)

        await streamCoachChat(res, {
          onChunk: (_delta, full) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: full, streaming: true } : m,
              ),
            )
          },
          onError: (msg) => {
            throw new Error(msg)
          },
          signal: controller.signal,
        })

        // Finaliza o estado de streaming.
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
        )
      } catch (err) {
        // Abort silencioso.
        if (err instanceof DOMException && err.name === 'AbortError') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
          )
          setIsResponding(false)
          abortRef.current = null
          return
        }

        console.error('Erro no chat do coach:', err)
        // Remove a bolha vazia do assistente e exibe erro.
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId).map((m) => ({ ...m, streaming: false })),
        )
        setError('Erro ao conectar com o coach. Tente novamente.')
        toast({
          title: 'Erro ao conectar com o coach',
          description: 'Não foi possível obter a resposta. Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setIsResponding(false)
        abortRef.current = null
      }
    },
    [user, isResponding, messages, conversationId, toast],
  )

  const handleRetry = useCallback(() => {
    if (!lastUserText) return
    handleSend(lastUserText)
  }, [lastUserText, handleSend])

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-3xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-1 py-3 border-b border-[#262635]">
        <CoachAvatar size="md" />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-white tracking-tight">Coach Rocha</h1>
            <span className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.6)]" />
          </div>
          <p className="text-xs text-slate-400">Seu personal trainer virtual</p>
        </div>
      </header>

      {/* Mensagens / Welcome */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
        {!hasMessages ? (
          <WelcomeScreen onSuggestion={handleSend} disabled={isResponding} />
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessageBubble key={m.id} message={m} />
            ))}
            {isResponding &&
              messages[messages.length - 1]?.role === 'assistant' &&
              !messages[messages.length - 1]?.content && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Erro inline */}
      {error && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isResponding}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-200 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Input fixo */}
      <div className="pt-2 pb-1">
        <ChatInput onSend={handleSend} disabled={isResponding} />
        <p className="mt-1.5 text-center text-[11px] text-slate-600">
          O Coach Rocha pode cometer erros. Não substitui acompanhamento profissional.
        </p>
      </div>
    </div>
  )
}
