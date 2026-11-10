/// <reference path="../pb_data/types.d.ts" />
/**
 * ROTA /backend/v1/ler-balanco-pdf
 * Lê um anexo PDF de `cliente_arquivos` no servidor via $documents.toMarkdown.
 * Devolve o markdown com o texto e tabelas extraídas diretamente pelo backend.
 */
routerAdd('OPTIONS', '/backend/v1/ler-balanco-pdf', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/ler-balanco-pdf', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  const recordId = e.request.url.query().get('id')
  if (!recordId) {
    return e.json(400, { ok: false, erro: 'Parâmetro id é obrigatório' })
  }

  try {
    const record = $app.findRecordById('cliente_arquivos', recordId)
    const { markdown, truncated } = $documents.toMarkdown({ record, field: 'arquivo' })
    const titulo = record.getString('titulo')
    console.log(
      `[ler-balanco-pdf] Sucesso para id=${recordId} (${titulo}): ${markdown.length} chars`,
    )
    return e.json(200, { ok: true, titulo, markdown, truncated })
  } catch (err) {
    const status = err.status || 500
    if (status === 422) {
      console.warn(`[ler-balanco-pdf] PDF escaneado (422) para id=${recordId}: ${err.message}`)
      return e.json(422, {
        ok: false,
        escaneado: true,
        erro: 'PDF sem texto selecionável (imagem escaneada) — conferência manual necessária.',
      })
    }
    console.warn(`[ler-balanco-pdf] Erro id=${recordId}: ${status} - ${err.message}`)
    return e.json(status, { ok: false, erro: String(err.message || err) })
  }
})
