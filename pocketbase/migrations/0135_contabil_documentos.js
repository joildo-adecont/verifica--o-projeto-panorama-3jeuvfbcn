/**
 * MIGRATION 0135 — documentos contábeis (balancete, balanço, DRE)
 * ===============================================================
 * Pedido do CEO (05/11/2026): "criar no módulo ... Analisador um ícone para
 * importar e validar as informações dos balancetes, balanços e DREs, com o
 * agente contábil especialista, para ser usado nas análises e cruzamentos do
 * pedido anterior".
 *
 * ── POR QUE DUAS COLEÇÕES, E NÃO UMA ──
 * `cont_documentos` é o ENVELOPE (de quem é, que peça é, de que período, se
 * fechou) e `cont_contas` são as LINHAS. Poderia ser um JSON único — e seria
 * mais simples — mas então nenhuma consulta conseguiria perguntar "quanto de
 * ativo imobilizado este cliente tem" sem carregar o balanço inteiro no
 * navegador. Com as linhas em coleção própria, o cruzamento por grupo
 * contábil é uma consulta, não uma varredura.
 *
 * ── A CHAVE DE DEDUPLICAÇÃO ──
 * `hash_arquivo` (SHA-256 do conteúdo normalizado) + `competencia`. Reimportar
 * a mesma peça do mesmo mês ATUALIZA em vez de duplicar; e duas versões do
 * mesmo balanço no mesmo mês (o "reemitido") convivem, com a mais recente
 * vencendo na leitura — mas o histórico fica.
 *
 * ── O QUE NÃO É GUARDADO AQUI ──
 * Não se guarda o arquivo original: guarda-se o resultado do parsing. O
 * arquivo contábil tem dado de terceiros e não tem uso depois de lido — o que
 * precisa sobreviver é o número e a procedência dele.
 */
migrate(
  (app) => {
    /* ══════════ ENVELOPE ══════════ */
    const docs = new Collection({
      name: 'cont_documentos',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })

    docs.fields.add(new TextField({ name: 'cliente_cnpj', required: false }))
    docs.fields.add(new TextField({ name: 'cliente_nome', required: false }))
    docs.fields.add(
      new SelectField({
        name: 'tipo_documento',
        required: true,
        values: ['balancete', 'balanco', 'dre', 'razao', 'indefinido'],
        maxSelect: 1,
      }),
    )
    docs.fields.add(new TextField({ name: 'competencia', required: false }))
    docs.fields.add(new TextField({ name: 'periodo_inicio', required: false }))
    docs.fields.add(new TextField({ name: 'periodo_fim', required: false }))
    docs.fields.add(new TextField({ name: 'arquivo_nome', required: false }))
    docs.fields.add(new TextField({ name: 'hash_arquivo', required: false }))
    docs.fields.add(
      new SelectField({
        name: 'formato',
        required: false,
        values: ['sped_ecd', 'csv', 'txt_delimitado', 'html_xls', 'desconhecido'],
        maxSelect: 1,
      }),
    )
    docs.fields.add(
      new SelectField({
        name: 'status',
        required: false,
        values: ['ok', 'alerta', 'erro'],
        maxSelect: 1,
      }),
    )
    docs.fields.add(new NumberField({ name: 'linhas', required: false }))
    docs.fields.add(new NumberField({ name: 'contas_reconhecidas', required: false }))
    docs.fields.add(new NumberField({ name: 'total_ativo', required: false }))
    docs.fields.add(new NumberField({ name: 'total_passivo', required: false }))
    docs.fields.add(new NumberField({ name: 'receita_liquida', required: false }))
    docs.fields.add(new NumberField({ name: 'lucro_liquido', required: false }))
    docs.fields.add(new NumberField({ name: 'imobilizado', required: false }))
    docs.fields.add(new NumberField({ name: 'patrimonio_liquido', required: false }))
    docs.fields.add(new JSONField({ name: 'validacao', required: false, maxSize: 200000 }))
    docs.fields.add(new TextField({ name: 'importado_por', required: false }))
    docs.fields.add(new AutodateField({ name: 'importado_em', onCreate: true, onUpdate: false }))

    docs.indexes = [
      'CREATE INDEX idx_cont_doc_cnpj ON cont_documentos (cliente_cnpj)',
      'CREATE INDEX idx_cont_doc_comp ON cont_documentos (competencia)',
      'CREATE INDEX idx_cont_doc_tipo ON cont_documentos (tipo_documento)',
      'CREATE UNIQUE INDEX idx_cont_doc_hash ON cont_documentos (hash_arquivo, competencia)',
    ]
    app.save(docs)

    /* ══════════ LINHAS ══════════ */
    const contas = new Collection({
      name: 'cont_contas',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })

    contas.fields.add(new TextField({ name: 'documento_id', required: true }))
    contas.fields.add(new TextField({ name: 'cliente_cnpj', required: false }))
    contas.fields.add(new TextField({ name: 'competencia', required: false }))
    contas.fields.add(new TextField({ name: 'codigo', required: false }))
    contas.fields.add(new TextField({ name: 'descricao', required: false }))
    contas.fields.add(new NumberField({ name: 'nivel', required: false }))
    contas.fields.add(
      new SelectField({
        name: 'grupo',
        required: false,
        values: [
          'ativo',
          'passivo',
          'patrimonio_liquido',
          'receita',
          'custo',
          'despesa',
          'resultado',
          'nao_classificada',
        ],
        maxSelect: 1,
      }),
    )
    contas.fields.add(new NumberField({ name: 'saldo_anterior', required: false }))
    contas.fields.add(new NumberField({ name: 'debito', required: false }))
    contas.fields.add(new NumberField({ name: 'credito', required: false }))
    contas.fields.add(new NumberField({ name: 'saldo_atual', required: false }))
    contas.fields.add(
      new SelectField({
        name: 'natureza',
        required: false,
        values: ['devedora', 'credora'],
        maxSelect: 1,
      }),
    )
    /* A marca que liga a contabilidade à reforma: o que nesta conta entra no
       cálculo de IBS/CBS — receita tributável, insumo com crédito, imobilizado
       com crédito integral, ou nada. */
    contas.fields.add(
      new SelectField({
        name: 'efeito_reforma',
        required: false,
        values: [
          'base_receita',
          'credito_insumo',
          'credito_imobilizado',
          'sem_efeito',
          'a_confirmar',
        ],
        maxSelect: 1,
      }),
    )

    contas.indexes = [
      'CREATE INDEX idx_cont_contas_doc ON cont_contas (documento_id)',
      'CREATE INDEX idx_cont_contas_cnpj_comp ON cont_contas (cliente_cnpj, competencia)',
      'CREATE INDEX idx_cont_contas_grupo ON cont_contas (grupo)',
      'CREATE INDEX idx_cont_contas_codigo ON cont_contas (codigo)',
    ]
    app.save(contas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('cont_contas'))
    } catch (err) {
      /* já não existe */
    }
    try {
      app.delete(app.findCollectionByNameOrId('cont_documentos'))
    } catch (err) {
      /* já não existe */
    }
  },
)
