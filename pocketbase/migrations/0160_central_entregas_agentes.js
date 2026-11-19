/// <reference path="../pb_data/types.d.ts" />
/**
 * MIGRATION 0160 — COLEÇÃO entregas_agentes (CENTRAL DE ENTREGAS DOS AGENTES)
 * Sistema ADECONT — Projeto Panorama
 *
 * Persiste cada relatório de agente especialista exportado/entregue:
 * agente (segmento + nome), título, tipo de conteúdo (PDF/TXT/CSV/XLSX),
 * conteúdo estruturado em JSON e a pergunta de origem.
 * Idempotente: só cria quando a coleção não existe.
 */
migrate(
  (app) => {
    let colecao = null
    try {
      colecao = app.findCollectionByNameOrId('entregas_agentes')
    } catch (_) {
      colecao = null
    }
    if (colecao) return

    const col = new Collection({
      name: 'entregas_agentes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })

    col.fields.add(new TextField({ name: 'agente_segmento', required: true, max: 60 }))
    col.fields.add(new TextField({ name: 'agente_nome', required: true, max: 120 }))
    col.fields.add(new TextField({ name: 'titulo', required: true, max: 300 }))
    col.fields.add(new TextField({ name: 'tipo_conteudo', required: true, max: 20 }))
    col.fields.add(new TextField({ name: 'conteudo_json', required: true, max: 500000 }))
    col.fields.add(new TextField({ name: 'pergunta_origem', max: 4000 }))
    col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }))
    col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))

    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('entregas_agentes'))
    } catch (_) {}
  },
)
