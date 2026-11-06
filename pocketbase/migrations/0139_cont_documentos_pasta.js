/**
 * MIGRATION 0139 — LIGA O DOCUMENTO CONTÁBIL À PASTA DO CLIENTE
 * ============================================================
 * Pedido do CEO (06/11/2026): os documentos contábeis (balanço, balancete, DRE)
 * precisam ficar guardados na pasta do cliente, junto com os XMLs, para que os
 * especialistas busquem no repositório do cliente e não num monte de documentos
 * soltos.
 *
 * ── POR QUE DOIS CAMPOS, E NÃO SÓ `pasta` ──
 * `pasta` é o id (a ligação real, usada nas consultas).
 * `pasta_nome` é o caminho legível ("BASE > Documentos Contábeis > Balancetes").
 * O nome parece redundante — e é, de propósito: quando alguém apagar a pasta,
 * o documento ficará órfão, e sem o nome gravado ninguém saberá onde ele
 * deveria estar. Já custou caro num sistema anterior ter de reconstruir isso
 * pelo histórico.
 *
 * ── O ÍNDICE ──
 * A consulta mais frequente será "o que tem na pasta X", e sem índice ela varre
 * a coleção inteira a cada abertura de pasta.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cont_documentos')

    /* id da pasta em param_pastas */
    col.fields.add(new TextField({ name: 'pasta', required: false }))
    /* caminho legível, para sobreviver à perda da pasta */
    col.fields.add(new TextField({ name: 'pasta_nome', required: false }))

    col.indexes = [...col.indexes, 'CREATE INDEX idx_cont_doc_pasta ON cont_documentos (pasta)']

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cont_documentos')
    col.fields.removeByName('pasta')
    col.fields.removeByName('pasta_nome')
    col.indexes = col.indexes.filter((i) => !i.includes('idx_cont_doc_pasta'))
    app.save(col)
  },
)
