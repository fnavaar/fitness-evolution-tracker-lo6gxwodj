// Expõe o header `X-Conversation-Id` ao JavaScript do navegador (CORS).
// Sem `Access-Control-Expose-Headers`, `res.headers.get('X-Conversation-Id')`
// retorna `null` no fetch do navegador, fazendo o frontend perder o id da
// conversa a cada turno — cada nova mensagem acabava criando uma conversa nova.
// Roda em todos os requests (routerUse é executado antes do handler da rota).
routerUse((e) => {
  e.response.header().set('Access-Control-Expose-Headers', 'X-Conversation-Id')
  return e.next()
})
