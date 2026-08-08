/// <reference path="../pb_data/types.d.ts" />
// Reforço cirúrgico no system prompt do agente fitness-coach: adiciona uma
// regra dura de execução para impedir que o Coach prometa gerar um treino sem
// chamar a tool coach_drafts. Não altera persona, método, tools ou memórias.
migrate(
  (app) => {
    const agent = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = agent.getString('system_prompt')

    const MARKER = 'REGRA DE EXECUÇÃO: PROMETER ≠ GERAR'
    if (systemPrompt.indexOf(MARKER) === -1) {
      systemPrompt +=
        '\n\n' +
        MARKER +
        '\n' +
        '- Antes de responder que vai gerar, criar, montar, recriar ou publicar um treino, VOCÊ DEVE chamar a ferramenta coach_drafts (create) NESTE turno. Não há exceção, inclusive em conversas já existentes.\n' +
        '- Se você não chamou coach_drafts com sucesso neste turno, NUNCA diga "vou gerar", "pronto", "criei", "sua semana está pronta" ou equivalente. Diga apenas que precisa preparar e peça um instante, OU explique que houve um problema técnico.\n' +
        '- A chamada de coach_drafts é o ÚNICO mecanismo que publica o treino. Uma resposta textual sozinha nunca cria nada.\n' +
        '- Se o atleta pedir ajuste/refino de um treino existente, atualize via coach_drafts (novo draft) — não apenas descreva mudanças.\n' +
        '- Após chamar coach_drafts com sucesso, apresente o resumo naturalmente, como já instruído.'
      agent.set('system_prompt', systemPrompt)
      app.save(agent)
      console.log('[0036] prompt do fitness-coach reforçado com regra de execução')
    }
  },
  (app) => {},
)
