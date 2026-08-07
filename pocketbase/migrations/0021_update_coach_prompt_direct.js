/// <reference path="../pb_data/types.d.ts" />
// Atualiza APENAS o system_prompt do agente `fitness-coach`, preservando
// todas as 9 tools e 13 memórias atuais. Adiciona instrução explícita para
// o Coach NÃO enviar user_id ao criar rascunhos via tool coach_drafts
// (o sistema preenche automaticamente via hook).
migrate(
  (app) => {
    const current = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = current.getString('system_prompt')

    const MARKER =
      'IMPORTANTE: Ao criar o rascunho com coach_drafts, NÃO inclua o campo user_id no payload'
    if (systemPrompt.indexOf(MARKER) === -1) {
      const INSERT_AFTER =
        'e apresente o resumo do plano sem mencionar rascunho, confirmação ou status interno.'
      const NEW_LINE =
        '\n- IMPORTANTE: Ao criar o rascunho com coach_drafts, NÃO inclua o campo user_id no payload — o sistema preenche automaticamente. Inclua APENAS: type, payload, status ("proposta"). Exemplo: {"type":"workout","status":"proposta","payload":{...}}'

      if (systemPrompt.indexOf(INSERT_AFTER) !== -1) {
        systemPrompt = systemPrompt.replace(INSERT_AFTER, INSERT_AFTER + NEW_LINE)
      } else {
        // fallback: anexa ao bloco de prescrição
        const PRESC_MARKER = 'PRESCRIÇÃO DENTRO DO CHAT (FASE 1 — TREINOS)'
        if (systemPrompt.indexOf(PRESC_MARKER) !== -1) {
          systemPrompt = systemPrompt.replace(PRESC_MARKER, PRESC_MARKER + '\n' + NEW_LINE)
        } else {
          systemPrompt = systemPrompt + '\n\n' + NEW_LINE
        }
      }
      current.set('system_prompt', systemPrompt)
      app.save(current)
    }
  },
  (app) => {},
)
