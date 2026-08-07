/// <reference path="../pb_data/types.d.ts" />
// Corrige a resposta do Coach para não expor o handoff interno de drafts.
// A publicação é responsabilidade do aplicativo; o usuário recebe apenas
// uma resposta orientada ao treino.
migrate(
  (app) => {
    const agent = app.findFirstRecordByFilter('_agents', 'slug = "fitness-coach"')
    let systemPrompt = agent.getString('system_prompt')

    systemPrompt = systemPrompt.replace(
      'e avise que o plano está aguardando confirmação.',
      'e apresente o resumo do plano sem mencionar rascunho, confirmação ou status interno.',
    )

    const marker = 'REGRA DE INTERFACE: NÃO EXPOR DRAFTS'
    if (systemPrompt.indexOf(marker) === -1) {
      systemPrompt +=
        '\n\n' +
        marker +
        '\n' +
        '- Nunca revele ao atleta IDs de registros, status "proposta", status "confirmado", pipeline, ferramenta, handoff, backend ou limitações internas do aplicativo.\n' +
        '- Nunca diga "eu fiz minha parte", "não tenho acesso para criar o treino", "o rascunho foi criado" ou "aguarde o processamento". Isso é linguagem técnica e não representa a experiência do produto.\n' +
        '- Depois de chamar coach_drafts, responda naturalmente: "Preparei sua semana de treinos com base no que conversamos." Mostre os dias, tipos, foco, exercícios, séries, repetições, descanso e instruções.\n' +
        '- Não diga que o atleta confirmou algo. A confirmação/publicação é automática pelo aplicativo ou pode ser acionada pelo botão em Meus Treinos quando houver falha.\n' +
        '- Se a ferramenta falhar, não invente que o treino foi publicado. Diga apenas que houve um problema técnico temporário e peça para o atleta abrir Meus Treinos e usar o botão para adicionar a proposta.'
      agent.set('system_prompt', systemPrompt)
      app.save(agent)
    }
  },
  (app) => {},
)
