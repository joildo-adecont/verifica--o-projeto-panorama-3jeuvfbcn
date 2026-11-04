/// <reference path="../pb_data/types.d.ts" />

/**
 * 0108 — PARAMETRIZADOR DE DOCUMENTOS FISCAIS DA REFORMA
 *
 * ── O QUE O CEO PEDIU (03/11/2026) ──
 * "Um ícone chamado Parametrizador de Documentos Fiscais da Reforma, que busque
 * todos os tipos de documentos fiscais usados na apuração assistida e na base de
 * lançamentos fiscais e contábeis, importe e processe XMLs de NF-e e demais,
 * com agentes especialistas que quebrem e segmentem os arquivos, ambiente de
 * análise, comparativos e auditorias, com classificação fiscal e contábil,
 * relatórios legíveis, tudo de fontes oficiais."
 *
 * ── AS TRÊS COLEÇÕES E POR QUE TRÊS ──
 *
 * 1. `param_documentos` — o CABEÇALHO de cada arquivo importado.
 *    Um XML = um registro. Guarda chave, modelo, emitente, valores, e o
 *    resultado da conferência. É o que a lista mostra.
 *
 * 2. `param_itens` — cada ITEM do documento, individualizado.
 *    Aqui está o ponto central do pedido do CEO: "sua quebra deverá ser
 *    segmentada e as informações individualizadas". Se os itens fossem um JSON
 *    dentro do cabeçalho, não haveria como classificar item a item, comparar
 *    NCM entre documentos nem auditar divergência. Uma linha por item é o que
 *    torna análise e auditoria possíveis.
 *
 * 3. `param_classificacoes_rt` — as TABELAS DA REFORMA (cClassTrib, CST,
 *    crédito presumido). Sem elas, "classificação fiscal na reforma" seria
 *    chute: a base atual do sistema tem 15.429 registros e TODOS são NCM.
 *
 * ── POR QUE O CATÁLOGO É COLEÇÃO E NÃO CÓDIGO ──
 * Os tipos de documento fiscal mudam (a reforma cria e altera layouts). Catálogo
 * em código exigiria deploy para cada tipo novo; em coleção, o escritório
 * atualiza e o portal já enxerga.
 */

migrate(
  (app) => {
    // ═════════════ 1. DOCUMENTOS (cabeçalho) ═════════════
    const doc = new Collection({
      name: 'param_documentos',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    doc.fields.add(new TextField({ name: 'chave', required: false, max: 60 }))
    doc.fields.add(new TextField({ name: 'modelo', required: true, max: 12 })) // 55, 65, 57...
    doc.fields.add(new TextField({ name: 'versao_layout', required: false, max: 20 }))
    doc.fields.add(new TextField({ name: 'numero', required: false, max: 30 }))
    doc.fields.add(new TextField({ name: 'serie', required: false, max: 10 }))
    doc.fields.add(new DateField({ name: 'data_emissao', required: false }))
    doc.fields.add(new TextField({ name: 'emitente_cnpj', required: false, max: 20 }))
    doc.fields.add(new TextField({ name: 'emitente_nome', required: false, max: 300 }))
    doc.fields.add(new TextField({ name: 'destinatario_cnpj', required: false, max: 20 }))
    doc.fields.add(new TextField({ name: 'destinatario_nome', required: false, max: 300 }))
    doc.fields.add(new TextField({ name: 'uf', required: false, max: 2 }))
    doc.fields.add(new NumberField({ name: 'valor_total', required: false }))
    doc.fields.add(new NumberField({ name: 'valor_tributos', required: false }))
    doc.fields.add(new NumberField({ name: 'qtd_itens', required: false }))
    doc.fields.add(new TextField({ name: 'status', required: false, max: 20 })) // importado/conferido/divergente
    doc.fields.add(new NumberField({ name: 'divergencias', required: false }))
    doc.fields.add(new TextField({ name: 'nome_arquivo', required: false, max: 300 }))
    doc.fields.add(new TextField({ name: 'hash_arquivo', required: false, max: 80 }))
    doc.fields.add(new TextField({ name: 'resumo_conferencia', required: false, max: 2000 }))
    doc.fields.add(new DateField({ name: 'importado_em', required: false }))
    app.save(doc)

    // ═════════════ 2. ITENS (a quebra individualizada) ═════════════
    const it = new Collection({
      name: 'param_itens',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    it.fields.add(new TextField({ name: 'documento', required: true, max: 40 })) // id do cabeçalho
    it.fields.add(new TextField({ name: 'chave_doc', required: false, max: 60 }))
    it.fields.add(new NumberField({ name: 'numero_item', required: false }))
    it.fields.add(new TextField({ name: 'codigo_produto', required: false, max: 60 }))
    it.fields.add(new TextField({ name: 'descricao', required: false, max: 600 }))
    it.fields.add(new TextField({ name: 'ncm', required: false, max: 10 }))
    it.fields.add(new TextField({ name: 'cfop', required: false, max: 6 }))
    it.fields.add(new TextField({ name: 'cst_icms', required: false, max: 5 }))
    it.fields.add(new TextField({ name: 'cst_ibs_cbs', required: false, max: 5 }))
    it.fields.add(new TextField({ name: 'cclasstrib', required: false, max: 8 }))
    it.fields.add(new TextField({ name: 'ccredpres', required: false, max: 6 }))
    it.fields.add(new TextField({ name: 'cbenef', required: false, max: 12 }))
    it.fields.add(new NumberField({ name: 'quantidade', required: false }))
    it.fields.add(new TextField({ name: 'unidade', required: false, max: 10 }))
    it.fields.add(new NumberField({ name: 'valor_unitario', required: false }))
    it.fields.add(new NumberField({ name: 'valor_total', required: false }))
    it.fields.add(new NumberField({ name: 'valor_ibs', required: false }))
    it.fields.add(new NumberField({ name: 'valor_cbs', required: false }))
    it.fields.add(new NumberField({ name: 'valor_is', required: false }))
    it.fields.add(new TextField({ name: 'tratamento_rt', required: false, max: 120 }))
    it.fields.add(new TextField({ name: 'base_legal', required: false, max: 300 }))
    it.fields.add(new TextField({ name: 'conta_contabil', required: false, max: 60 }))
    it.fields.add(new TextField({ name: 'observacao', required: false, max: 800 }))
    app.save(it)

    // ═════════════ 3. TABELAS DA REFORMA ═════════════
    const cls = new Collection({
      name: 'param_classificacoes_rt',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    cls.fields.add(new TextField({ name: 'tipo', required: true, max: 20 })) // CST / cClassTrib / cCredPres
    cls.fields.add(new TextField({ name: 'codigo', required: true, max: 10 }))
    cls.fields.add(new TextField({ name: 'descricao', required: false, max: 800 }))
    cls.fields.add(new TextField({ name: 'cst_pai', required: false, max: 5 }))
    cls.fields.add(new TextField({ name: 'fonte', required: false, max: 300 }))
    cls.fields.add(new DateField({ name: 'fonte_data', required: false }))
    app.save(cls)

    // ═════════════ 4. CATÁLOGO DE TIPOS DE DOCUMENTO ═════════════
    const cat = new Collection({
      name: 'param_tipos_documento',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    cat.fields.add(new TextField({ name: 'modelo', required: true, max: 12 }))
    cat.fields.add(new TextField({ name: 'nome', required: true, max: 120 }))
    cat.fields.add(new TextField({ name: 'sigla', required: false, max: 20 }))
    cat.fields.add(new TextField({ name: 'finalidade', required: false, max: 500 }))
    cat.fields.add(new TextField({ name: 'orgao', required: false, max: 200 }))
    cat.fields.add(new TextField({ name: 'layout_url', required: false, max: 400 }))
    cat.fields.add(new TextField({ name: 'base_legal', required: false, max: 400 }))
    cat.fields.add(
      new SelectField({
        name: 'tem_campos_rt',
        maxSelect: 1,
        required: false,
        values: ['sim', 'parcial', 'nao', 'previsto'],
      }),
    )
    cat.fields.add(new TextField({ name: 'obs', required: false, max: 600 }))
    app.save(cat)
  },
  (app) => {
    for (const nome of [
      'param_documentos',
      'param_itens',
      'param_classificacoes_rt',
      'param_tipos_documento',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)
