/**
 * Indicador de "digitando" — três pontos que pulam em sequência.
 * Usado enquanto o coach processa antes do primeiro chunk do stream.
 */
export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 animate-coach-msg-in">
      <div className="w-8 h-8 rounded-full bg-[#12121A] border border-[#A3E635]/40 flex items-center justify-center shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#A3E635]/60" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-[#1A1A24] border border-[#262635] px-4 py-3.5">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
        </div>
      </div>
    </div>
  )
}

export default TypingIndicator
