import { Send } from 'lucide-react'
import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Barra de input fixa na base com textarea auto-expansável e botão enviar.
 * Enter envia, Shift+Enter quebra linha. Desabilita enquanto o coach responde.
 */
export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Pergunte ao Coach Rocha...',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expande a textarea até um limite.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [value])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="relative flex items-end gap-2 rounded-2xl bg-[#12121A] border border-[#262635] focus-within:border-[#A3E635]/50 transition-colors px-3 py-2 shadow-lg shadow-black/30">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500',
          'outline-none py-1.5 max-h-40 disabled:opacity-50',
        )}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Enviar mensagem"
        className={cn(
          'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
          'bg-[#A3E635] text-[#0B0B10] hover:bg-[#BEF264] hover:shadow-[0_0_18px_rgba(163,230,53,0.45)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none',
        )}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}

export default ChatInput
