/// <reference path="../pb_data/types.d.ts" />
// Corrige a única fonte RAG que falhou por bloqueio HTTP 403.
// O define parcial preserva prompt e tools; a lista de memory substitui as fontes
// do agente de forma idempotente e remove a URL HTML bloqueada da AHA.
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'fitness-coach',
      memory: [
        {
          type: 'url',
          payload: { url: 'https://www.who.int/publications/i/item/9789240015128' },
        },
        {
          type: 'url',
          payload: {
            url: 'https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-exercitar/documentos/pdf/guia_atividade_fisica_populacao_brasileira.pdf',
          },
        },
        {
          type: 'url',
          payload: { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/' },
        },
        {
          type: 'url',
          payload: { url: 'https://www.cdc.gov/sleep/about/index.html' },
        },
        {
          type: 'url',
          payload: { url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
        },
        {
          type: 'url',
          payload: { url: 'https://www.who.int/health-topics/healthy-diet' },
        },
        {
          type: 'url',
          payload: {
            url: 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional',
          },
        },
        {
          type: 'url',
          payload: { url: 'https://eparmedx.com/?page_id=75' },
        },
        {
          type: 'url',
          payload: { url: 'https://pubmed.ncbi.nlm.nih.gov/37752011/' },
        },
        {
          type: 'url',
          payload: {
            url: 'https://www.heart.org/en/-/media/Files/Health-Topics/Heart-Attack/Do-It-Yourself-Health-Lesson-Heart-Attack-With-Notes.pdf?sc_lang=en',
          },
        },
        {
          type: 'url',
          payload: { url: 'https://acsm.org/monitoring-aerobic-exercise-intensity' },
        },
        {
          type: 'text',
          payload: {
            text: 'Método de decisão do Coach IA: primeiro segurança e triagem; depois objetivo, capacidade e contexto; em seguida prescrição mínima eficaz; depois progressão por desempenho; por fim revisão por aderência, sintomas, sono, esforço e tendência de peso. Uma estimativa não deve ser apresentada como medição.',
          },
        },
        {
          type: 'faq',
          payload: {
            qa: [
              {
                question: 'Quantas calorias máximas devo ingerir por dia?',
                answer:
                  'Não existe uma máxima universal. Estime o gasto de repouso e a manutenção com incerteza, defina o objetivo e recalibre pela tendência de peso, desempenho, fome, sono e saúde. Para dietas individualizadas, encaminhe ao nutricionista.',
              },
              {
                question: 'Quantas calorias devo queimar no treino?',
                answer:
                  'Não use uma meta fixa de calorias queimadas. Prescreva atividade por saúde, condicionamento, força, função e aderência, pois relógios e aparelhos estimam o gasto com erro.',
              },
              {
                question: 'Quanto devo dormir?',
                answer:
                  'Adultos devem dormir pelo menos 7 horas; para a maioria, 7 a 9 horas é uma faixa prática, ajustada por idade, qualidade do sono, rotina e sintomas.',
              },
              {
                question: 'O que fazer se sentir dor durante o exercício?',
                answer:
                  'Pare o exercício doloroso. Dor aguda, intensa, crescente, irradiada ou acompanhada de falta de ar, tontura, desmaio ou dor no peito exige avaliação profissional e pode exigir atendimento urgente.',
              },
              {
                question: 'Os outros agentes podem mudar o treino?',
                answer:
                  'Não devem contradizer a prescrição, as restrições de segurança ou os alertas do Coach IA. Alterações relevantes exigem nova avaliação do perfil, histórico, recuperação e objetivo.',
              },
            ],
          },
        },
      ],
    })
  },
  (app) => {},
)
