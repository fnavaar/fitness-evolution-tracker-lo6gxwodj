import { useState, useRef, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  sendMessage,
  streamCoachChat,
  loadCoachContext,
  listConversations,
  loadMessages,
  deleteConversation,
  renameConversation,
  type ChatMessage,
  type Conversation,
} from '@/services/coach'
import { listPendingDrafts, discardDraft, type CoachDraft } from '@/services/coachDrafts'
import { sendSpecialistMessage, streamSpecialistChat } from '@/services/workouts'
import { CoachAvatar } from '@/components/coach/CoachAvatar'
import { ChatMessage as ChatMessageBubble } from '@/components/coach/ChatMessage'
import { ChatInput } from '@/components/coach/ChatInput'
import { TypingIndicator } from '@/components/coach/TypingIndicator'
import { WelcomeScreen } from '@/components/coach/WelcomeScreen'
import { ConversationList } from '@/components/coach/ConversationList'
import { ProposalCard } from '@/components/coach/ProposalCard'

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

  // Histórico de conversas
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [convsError, setConvsError] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // drawer mobile

  // Propostas (rascunhos de prescrição) do Coach dentro do chat.
  const [proposals, setProposals] = useState<CoachDraft[]>([])
  const [proposalLoading, setProposalLoading] = useState(false)
  const seenDraftIds = useRef<Set<string>>(new Set())
  const conversationStartRef = useRef<Date>(new Date())

  const contextRef = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Espelho sempre atual de `conversationId` para uso dentro de `handleSend`
  // sem depender do valor capturado pela closure (evita stale state que fazia
  // cada mensagem reenviar conversation_id null e criar uma conversa nova).
  const conversationIdRef = useRef<string | null>(null)
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

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

  // Carrega a lista de conversas do usuário.
  const refreshConversations = useCallback(async () => {
    if (!user?.id) return
    setLoadingConvs(true)
    setConvsError(null)
    try {
      const list = await listConversations(50)
      setConversations(list)
    } catch (err) {
      setConvsError(err instanceof Error ? err.message : 'Erro ao carregar conversas.')
    } finally {
      setLoadingConvs(false)
    }
  }, [user?.id])

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  // Auto-scroll para o final a cada nova mensagem / chunk.
  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isResponding, proposals, scrollToBottom])

  // Inicia uma nova conversa: limpa o chat e volta ao WelcomeScreen.
  const handleNewConversation = useCallback(() => {
    abortRef.current?.abort()
    conversationIdRef.current = null
    setConversationId(null)
    setMessages([])
    setError(null)
    setLastUserText('')
    setProposals([])
    seenDraftIds.current = new Set()
    conversationStartRef.current = new Date()
    setSidebarOpen(false)
  }, [])

  // Carrega uma conversa anterior no chat principal.
  const handleSelectConversation = useCallback(async (id: string) => {
    if (id === conversationId) {
      setSidebarOpen(false)
      return
    }
    abortRef.current?.abort()
    conversationIdRef.current = id
    setConversationId(id)
    setMessages([])
    setError(null)
    setLastUserText('')
    setProposals([])
    seenDraftIds.current = new Set()
    conversationStartRef.current = new Date()
    setLoadingMessages(true)
    setSidebarOpen(false)
    try {
      const hist = await loadMessages(id)
      setMessages(
        hist.map((m) => ({
          id: uid(),
          role: m.role,
          content: m.content,
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mensagens.')
    } finally {
      setLoadingMessages(false)
    }
  }, [])

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

      // Lê o conversationId do ref (sempre atual) para evitar stale closure.
      const currentConvId = conversationIdRef.current

      // Envia contexto apenas na primeira mensagem da conversa.
      const isFirstMessage = currentConvId === null
      const context = isFirstMessage ? contextRef.current : ''

      // Rastreia se esta é uma conversa nova para atualizar a sidebar depois.
      const wasNewConversation = currentConvId === null

      try {
        const res = await sendMessage(
          [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: text },
          ],
          {
            conversationId: currentConvId,
            context,
            signal: controller.signal,
          },
        )

        // Captura o conversation_id do header se disponível e sincroniza
        // tanto o state quanto o ref imediatamente, para que a próxima
        // mensagem (antes do re-render) já use o id correto.
        const headerConv = res.headers.get('X-Conversation-Id')
        if (headerConv) {
          conversationIdRef.current = headerConv
          setConversationId(headerConv)
        }

        const result = await streamCoachChat(res, {
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

        // Se era uma conversa nova, atualiza a sidebar para refleti-la.
        if (wasNewConversation) {
          refreshConversations()
        }

        // O draft é um handoff interno do Coach. Para treinos, o plano macro
        // fica como proposta e o atleta o converte em treino completo na área
        // /treinos, pelo chat do Especialista de Treinos (botão "Gerar do
        // plano do Coach"). Aqui apenas exibimos o card informativo para o
        // atleta saber que o plano está pronto para ser gerado.
        if (user?.id && result.toolCalls.some((tc) => tc.name === 'coach_drafts' && tc.ok)) {
          setProposalLoading(true)
          try {
            const drafts = await listPendingDrafts(user.id)
            const cutoff = conversationStartRef.current
            const fresh = drafts.filter((d) => {
              if (seenDraftIds.current.has(d.id)) return false
              const created = new Date(d.created)
              if (isNaN(created.getTime())) return true
              return created >= cutoff
            })

            if (fresh.length > 0) {
              fresh.forEach((d) => seenDraftIds.current.add(d.id))
              setProposals((prev) => [...prev, ...fresh])
              toast({
                title: 'Plano de treino pronto',
                description: 'Gere seu treino completo em /treinos, no chat do Especialista.',
              })
            } else {
              // Fallback: o agente chamou a tool com ok:true, mas não achamos
              // nenhum draft novo (create silenciosamente rejeitado, por ex.).
              toast({
                title: 'Plano de treino pronto',
                description: 'Acesse Meus Treinos e use o botão do Especialista para gerar.',
                variant: 'default',
              })
            }
          } catch {
            /* best-effort */
          } finally {
            setProposalLoading(false)
          }
        }

        // Fallback de geração: se o usuário pediu para gerar/criar/recriar um
        // treino e o Coach NÃO chamou a tool coach_drafts (respondeu só em
        // texto), dispara o Especialista de Treinos automaticamente para
        // materializar o plano. Sem isso, o Coach "promete" e nada é criado.
        const askedForWorkout =
          /(gerar|criar|montar|recriar|refazer|semana de treino|plano de treino|treino de)/i.test(
            lastUserText,
          )
        const coachCreatedDraft = result.toolCalls.some((tc) => tc.name === 'coach_drafts' && tc.ok)
        if (user?.id && askedForWorkout && !coachCreatedDraft) {
          setProposalLoading(true)
          try {
            // Envia ao Especialista para gerar a partir do pedido do atleta.
            // Inclui a última mensagem do usuário como contexto para o agente
            // saber o que gerar (dias, objetivo, preferências).
            const res = await sendSpecialistMessage(
              'O atleta pediu um treino e o Coach Rocha orientou o plano. Gere e crie no banco de dados (workouts + workout_exercises) o treino/semana coerente com este pedido e com o perfil do atleta, usando apenas exercícios do catálogo (5 a 8 por treino), com sets, reps, rest_time e sort_order. Se houver dias definidos, crie um workout por dia preenchendo day_of_week e workout_type. user_id: ' +
                user.id +
                '. Pedido do atleta: "' +
                lastUserText +
                '". Resuma em PT-BR.',
              { conversationId: null },
            )
            const headerConv = res.headers.get('X-Conversation-Id')
            await streamSpecialistChat(res, {
              onChunk: () => {},
              onError: (msg) => {
                throw new Error(msg)
              },
            })
            toast({
              title: 'Treino em geração',
              description:
                'O Especialista de Treinos está criando seu treino. Confira em /treinos.',
            })
            void headerConv
          } catch (specialistErr) {
            console.error('Erro ao disparar Especialista no fallback:', specialistErr)
            toast({
              title: 'Não foi possível gerar agora',
              description: 'Tente novamente em instantes ou use o Especialista em /treinos.',
              variant: 'destructive',
            })
          } finally {
            setProposalLoading(false)
          }
        }
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
    [user, isResponding, messages, toast, refreshConversations],
  )

  // Renomeia uma conversa (atualização local + backend).
  const handleRenameConversation = useCallback(
    async (id: string, title: string) => {
      try {
        await renameConversation(id, title)
        setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
        toast({ title: 'Conversa renomeada' })
      } catch (err) {
        toast({
          title: 'Erro ao renomear',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          variant: 'destructive',
        })
        throw err
      }
    },
    [toast],
  )

  // Exclui uma conversa; se for a ativa, volta para uma nova conversa.
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id)
        if (id === conversationIdRef.current) {
          handleNewConversation()
        }
        await refreshConversations()
        toast({ title: 'Conversa excluída' })
      } catch (err) {
        toast({
          title: 'Erro ao excluir',
          description: err instanceof Error ? err.message : 'Tente novamente.',
          variant: 'destructive',
        })
      }
    },
    [toast, handleNewConversation, refreshConversations],
  )

  const handleRetry = useCallback(() => {
    if (!lastUserText) return
    handleSend(lastUserText)
  }, [lastUserText, handleSend])

  const hasMessages = messages.length > 0

  const sidebar = (
    <ConversationList
      conversations={conversations}
      activeId={conversationId}
      loading={loadingConvs}
      error={convsError}
      onSelect={handleSelectConversation}
      onRename={handleRenameConversation}
      onDelete={handleDeleteConversation}
      onNew={handleNewConversation}
      onRetry={refreshConversations}
    />
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] w-full max-w-5xl mx-auto">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-[#262635] bg-[#0B0B10]">
        {sidebar}
      </aside>

      {/* Sidebar mobile (drawer) */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[80vw] h-full flex flex-col border-r border-[#262635] bg-[#0B0B10] animate-coach-drawer-in">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A1A24] transition-colors"
              aria-label="Fechar histórico"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Área de chat principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-1 py-3 border-b border-[#262635]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A1A24] transition-colors"
            aria-label="Abrir histórico"
          >
            <Menu className="w-5 h-5" />
          </button>
          <CoachAvatar size="md" />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white tracking-tight truncate">
                Coach Rocha
              </h1>
              <span className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_8px_rgba(163,230,53,0.6)] shrink-0" />
            </div>
            <p className="text-xs text-slate-400 truncate">Seu personal trainer virtual</p>
          </div>
        </header>

        {/* Mensagens / Welcome / Loading histórico */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
          {loadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mb-2" />
              <p className="text-sm">Carregando conversa…</p>
            </div>
          ) : !hasMessages ? (
            <WelcomeScreen onSuggestion={handleSend} disabled={isResponding} />
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessageBubble key={m.id} message={m} />
              ))}
              {proposals.length > 0 && !isResponding && (
                <div className="space-y-3">
                  {proposals.map((draft) => (
                    <ProposalCard
                      key={draft.id}
                      draft={draft}
                      onDiscard={async (id) => {
                        await discardDraft(id)
                        setProposals((prev) => prev.filter((d) => d.id !== id))
                      }}
                    />
                  ))}
                </div>
              )}
              {proposalLoading && isResponding && (
                <p className="text-xs text-slate-500 text-center">Preparando plano…</p>
              )}
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
          <ChatInput onSend={handleSend} disabled={isResponding || loadingMessages} />
          <p className="mt-1.5 text-center text-[11px] text-slate-600">
            O Coach Rocha pode cometer erros. Não substitui acompanhamento profissional.
          </p>
        </div>
      </div>
    </div>
  )
}
