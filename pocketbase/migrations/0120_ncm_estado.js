/// <reference path="../pb_data/types.d.ts" />

/**
 * 0120 — ESTADO DOS AGENTES NCM
 *
 * ── POR QUE COLECAO, E NAO ARQUIVO ──
 * A primeira versão das rotas lia `tmp/ncm-monitor-ultimo.json` com
 * `$os.readFile`. Ao testar, deu "no such file or directory": o backend roda em
 * OUTRO HOST, e o tmp/ que o script grava não existe do lado do PocketBase.
 *
 * Guardar o estado no banco resolve duas coisas de uma vez:
 *   1. não há caminho de arquivo atravessando hosts;
 *   2. o estado SOBREVIVE ao reinício do pod — o tmp/ é esvaziado quando o
 *      assistente dorme, e a tela voltava a dizer "sem registro" todo dia.
 *
 * ── POR QUE O PAYLOAD É JSON E NAO CAMPOS ──
 * O formato do relatório muda conforme o agente evolui. Uma migration por campo
 * novo seria atrito sem ganho, porque ninguém consulta campo isolado: a tela lê
 * o retrato inteiro e decide o que mostrar.
 */

migrate(
  (app) => {
    const col = new Collection({
      name: 'ncm_agente_estado',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    /* 'monitor' = varredura do DOU · 'validador' = auditoria da base */
    col.fields.add(new TextField({ name: 'agente', required: true, max: 30 }))
    /* o relatório inteiro, serializado */
    col.fields.add(new TextField({ name: 'payload', required: false, max: 1000000 }))
    col.fields.add(new DateField({ name: 'gravado_em', required: false }))
    app.save(col)

    /* índice único por agente: o upsert depende disso para não duplicar */
    try {
      col.addIndex('idx_ncm_agente', true, 'agente', '')
      app.save(col)
    } catch (_) {}
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('ncm_agente_estado'))
    } catch (_) {}
  },
)
