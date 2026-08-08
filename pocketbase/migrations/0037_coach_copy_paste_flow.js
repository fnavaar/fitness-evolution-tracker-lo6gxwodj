/// <reference path="../pb_data/types.d.ts" />
// Ajusta o system prompt do agente fitness-coach para o novo fluxo de
// copy-and-paste: o Coach gera o treino completo NO CHAT, em formato
// estruturado e copiável (sem depender de tool/draft), para o atleta copiar
// e colar no Especialista de Treinos (workout-specialist).
// Não altera persona, método, tools ou memórias — apenas acrescenta o
// formato de saída e desativa a dependência de coach_drafts.
migrate(
  (app) => {
    const agent = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = agent.getString('system_prompt')

    const MARKER = 'FLUXO COPY-AND-PASTE COM O ESPECIALISTA (FASE 3)'
    if (systemPrompt.indexOf(MARKER) === -1) {
      systemPrompt +=
        '\n\n' +
        MARKER +
        '\n' +
        '- O atleta usa um fluxo de copiar-e-colar: você (Coach) gera o treino COMPLETO no chat, o atleta copia o texto e cola no Especialista de Treinos, que explica e monta os cards. Portanto, o treino que você responde PRECISA ser autossuficiente e copiável.\n' +
        '- NÃO crie coach_drafts neste fluxo. A prescrição é entregue como TEXTO ESTRUTURADO na sua resposta (o Especialista lê o texto colado).\n' +
        '- Formato de saída (sempre que prescrever treino): use um bloco claramente delimitado, ex.:\n' +
        '```treino\n' +
        'SEMANA DE TREINO — [objetivo]\n' +
        'Frequência: X dias/semana\n' +
        'Dia 1 (SEGUNDA) — [tipo: full_body|upper|lower|push|pull|legs|cardio|mobilidade|core]\n' +
        '1. [Exercício] — [grupo muscular] | [equipamento] | [dificuldade]\n' +
        '   Séries: X | Reps: Y-Z | Descanso: Ns | Instruções: [1 linha]\n' +
        '...\n' +
        'Dia 2 (QUARTA) — [tipo]\n' +
        '...\n' +
        '```\n' +
        '- Regras da prescrição: 5 a 8 exercícios por sessão; multiarticulares primeiro; use os enums do sistema (muscle_group: peito|costas|pernas|ombros|bracos|core|gluteos; equipment: halteres|barra|maquina|peso_corporal|cabos; difficulty: iniciante|intermediario|avancado); sets número inteiro, reps como faixa ("8-12"), rest_time em segundos.\n' +
        '- Após o bloco, adicione 2-3 linhas de orientação prática (aquecimento, ritmo, progressão) e uma linha dizendo "Copie o bloco acima e cole no Especialista de Treinos para montar seus cards.".\n' +
        '- Mantenha a triagem obrigatória ANTES de prescrever: se ainda não tiver os dados de saúde/equipamento, peça antes de montar o bloco.'
      agent.set('system_prompt', systemPrompt)
      app.save(agent)
      console.log('[0037] prompt do fitness-coach ajustado para fluxo copy-and-paste')
    }
  },
  (app) => {},
)
