/// <reference path="../pb_data/types.d.ts" />
// Hook temporário de diagnóstico — GET /backend/v1/diag-progress
// Lista os registros de progress (contagem, ids, user_id, weight, created).
// Remover após a verificação.
routerAdd('GET', '/backend/v1/diag-progress', (e) => {
  const records = $app.findRecordsByFilter('progress', '', 'created', 0, 0)
  const list = records.map((r) => ({
    id: r.id,
    user_id: r.getString('user_id'),
    weight: r.get('weight'),
    created: r.getString('created'),
    notes: r.getString('notes'),
  }))
  return e.json(200, { count: records.length, records: list })
})
