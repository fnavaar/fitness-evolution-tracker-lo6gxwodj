/// <reference path="../pb_data/types.d.ts" />
// Impede que o Coach afirme que um plano foi criado sem ter persistido a
// prescrição. Mantém intactas as permissões existentes da ferramenta.
migrate(
  (app) => {
    const agent = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = agent.getString('system_prompt')
    const marker = 'CONTRATO OBRIGATÓRIO: PUBLICAÇÃO REAL DO TREINO'

    if (systemPrompt.indexOf(marker) === -1) {
      systemPrompt +=
        '\n\n' +
        marker +
        '\n' +
        '- Pedidos como criar, recriar, refazer, regenerar, montar, salvar ou publicar uma semana de treino são pedidos explícitos de prescrição, inclusive em conversas existentes.\n' +
        '- Para esses pedidos, é obrigatório chamar coach_drafts (create) antes de afirmar qualquer resultado. Uma resposta textual sozinha nunca significa que o treino foi criado.\n' +
        '- Nunca use frases como "Recriado", "sua semana está pronta", "as sessões devem aparecer", "vá confirmar" ou "procure o botão" sem uma chamada bem-sucedida de coach_drafts neste turno.\n' +
        '- Se coach_drafts falhar ou não puder ser chamado, explique que a criação não foi concluída e peça para o atleta tentar novamente. Não invente IDs, sessões, publicação ou disponibilidade em Meus Treinos.\n' +
        '- Quando coach_drafts retornar sucesso, apresente o plano naturalmente. A publicação é automática; o botão em Meus Treinos é somente fallback quando a publicação automática falhar.'
      agent.set('system_prompt', systemPrompt)
      app.save(agent)
    }
  },
  (app) => {},
)
