import { CoachAvatar } from './CoachAvatar'
import { cn } from '@/lib/utils'

export interface CoachBubbleMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface ChatMessageProps {
  message: CoachBubbleMessage
}

/**
 * Bolha de mensagem — estilo distinto para usuário (direita, verde) e
 * coach (esquerda, card escuro com avatar). Animação de entrada ao montar.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end animate-coach-msg-in">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-[#A3E635]/15 border border-[#A3E635]/30 px-4 py-3">
          <p className="text-sm text-[#ECFCCB] whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5 animate-coach-msg-in">
      <CoachAvatar size="sm" />
      <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md bg-[#1A1A24] border border-[#262635] px-4 py-3">
        <p className="text-sm text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
          {message.streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#A3E635] animate-pulse align-middle rounded-sm" />
          )}
        </p>
      </div>
    </div>
  )
}

export default ChatMessage
