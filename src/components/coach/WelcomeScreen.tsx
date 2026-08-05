import { CoachAvatar } from './CoachAvatar'

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void
  disabled?: boolean
}

const SUGGESTIONS = [
  'Monte meu treino da semana',
  'Avalie meu progresso',
  'Sugira um plano alimentar',
  'Como melhorar meu desempenho?',
  'Corrige minha execução',
]

/**
 * Estado vazio antes da primeira mensagem — avatar grande, mensagem de
 * boas-vindas e chips de sugestão com entrada animada (staggered).
 */
export function WelcomeScreen({ onSuggestion, disabled }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center text-center pt-6 sm:pt-12 pb-4 px-2">
      <div className="animate-coach-pop">
        <CoachAvatar size="lg" />
      </div>

      <h2 className="mt-5 text-xl sm:text-2xl font-extrabold text-white tracking-tight">
        Coach Rocha
      </h2>
      <p className="text-sm text-slate-400 font-medium">Seu personal trainer virtual</p>

      <p className="mt-5 max-w-md text-sm sm:text-base text-slate-300 leading-relaxed">
        Fala, atleta! 👋 Sou o Coach Rocha, seu personal trainer virtual. Tenho acesso aos seus
        treinos, dieta e progresso — me pergunta qualquer coisa sobre sua evolução!
      </p>

      <div className="mt-7 flex flex-wrap gap-2 justify-center max-w-lg">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onSuggestion(s)}
            style={{ animationDelay: `${0.08 * i + 0.1}s` }}
            className="animate-coach-chip-in text-sm px-3.5 py-2 rounded-full bg-[#1A1A24] border border-[#262635] text-slate-200 hover:border-[#A3E635]/50 hover:text-[#A3E635] hover:bg-[#A3E635]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default WelcomeScreen
