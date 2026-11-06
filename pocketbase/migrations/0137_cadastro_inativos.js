/**
 * MIGRATION 0137 — CADASTRO ANALÍTICO DE CLIENTES INATIVOS
 * =========================================================
 * Pedido do CEO (05/11/2026): "criar outro Cadastro Analítico de Clientes, que
 * chamaremos de Cadastro Analítico de Clientes Inativos, e transferir todos os
 * clientes inativos que estão no Cadastro Analítico de Clientes para este novo
 * cadastro".
 *
 * ── POR QUE UMA COLEÇÃO SEPARADA, E NÃO UM FILTRO ──
 * A tela atual já tem o filtro "Inativas" — e ainda assim o CEO pediu um
 * cadastro separado. O motivo é operacional, não cosmético: cliente inativo não
 * deve aparecer em contagem de carteira, em cruzamento de regime nem em
 * relatório de prospecção. Um filtro depende de alguém lembrar de aplicá-lo em
 * cada tela nova; a separação física resolve na origem.
 *
 * ── A FORMA: ESPELHO EXATO DA `cadastro_empresas` ──
 * Todos os campos, com os mesmos nomes e tipos. Isso torna a transferência uma
 * cópia de objeto, sem tabela de correspondência para envelhecer — e permite
 * que a tela dos inativos reaproveite o mesmo componente de listagem.
 *
 * ── O QUE **NÃO** É DUPLICADO AQUI ──
 * Nenhum índice único em `codigo`: se um cliente voltar a ser ativo e depois
 * inativar de novo, o histórico de entradas e saídas no cadastro de inativos
 * pode ter mais de uma linha por código ao longo do tempo. A regra de
 * deduplicação é aplicada na transferência (ver `motivo_transferencia`), não
 * pelo banco.
 */
migrate(
  (app) => {
    const inativos = new Collection({
      name: 'cadastro_empresas_inativos',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })

    /* ── identificação ── */
    inativos.fields.add(new NumberField({ name: 'codigo', required: true }))
    inativos.fields.add(new TextField({ name: 'tipo_documento', required: false }))
    inativos.fields.add(new TextField({ name: 'numero_documento', required: false }))
    inativos.fields.add(new TextField({ name: 'documento_limpo', required: false }))
    inativos.fields.add(new TextField({ name: 'razao_social', required: false }))

    /* ── denominação ── */
    inativos.fields.add(new TextField({ name: 'nome', required: false }))
    inativos.fields.add(new TextField({ name: 'nome_fantasia', required: false }))
    inativos.fields.add(new TextField({ name: 'apelido', required: false }))
    inativos.fields.add(new TextField({ name: 'natureza_juridica', required: false }))

    /* ── atividade ── */
    inativos.fields.add(new TextField({ name: 'cnae', required: false }))
    inativos.fields.add(new TextField({ name: 'cnae_divisao', required: false }))
    inativos.fields.add(new TextField({ name: 'ramo_atividade', required: false }))

    /* ── datas ── */
    inativos.fields.add(new TextField({ name: 'data_inscricao', required: false }))
    inativos.fields.add(new TextField({ name: 'inicio_atividades', required: false }))
    inativos.fields.add(new TextField({ name: 'cliente_desde', required: false }))
    inativos.fields.add(new TextField({ name: 'pagina', required: false }))

    /* ── endereço ── */
    inativos.fields.add(new TextField({ name: 'tipo_endereco', required: false }))
    inativos.fields.add(new TextField({ name: 'endereco', required: false }))
    inativos.fields.add(new TextField({ name: 'numero_endereco', required: false }))
    inativos.fields.add(new TextField({ name: 'bairro', required: false }))
    inativos.fields.add(new TextField({ name: 'complemento', required: false }))
    inativos.fields.add(new TextField({ name: 'municipio', required: false }))
    inativos.fields.add(new TextField({ name: 'uf', required: false }))
    inativos.fields.add(new TextField({ name: 'cep', required: false }))
    inativos.fields.add(new TextField({ name: 'pais', required: false }))

    /* ── contato ── */
    inativos.fields.add(new TextField({ name: 'telefone', required: false }))
    inativos.fields.add(new TextField({ name: 'fax', required: false }))
    inativos.fields.add(new TextField({ name: 'email', required: false }))
    inativos.fields.add(new TextField({ name: 'pagina_internet', required: false }))

    /* ── inscrições ── */
    inativos.fields.add(new TextField({ name: 'inscricao_estadual', required: false }))
    inativos.fields.add(new TextField({ name: 'inscricao_municipal', required: false }))
    inativos.fields.add(new TextField({ name: 'inscricao_junta_comercial', required: false }))
    inativos.fields.add(new TextField({ name: 'inscricao_suframa', required: false }))
    inativos.fields.add(new TextField({ name: 'capital_social', required: false }))

    /* ── escrituração / responsáveis ── */
    inativos.fields.add(new TextField({ name: 'contador', required: false }))
    inativos.fields.add(new TextField({ name: 'responsavel_legal', required: false }))
    inativos.fields.add(new TextField({ name: 'foro_comarca', required: false }))
    inativos.fields.add(new TextField({ name: 'duracao_contrato', required: false }))

    /* ── situação e a TRILHA da transferência ──
       Estes campos respondem "por que este registro está aqui e não lá":
       quando saiu, por qual motivo e quem/quê o moveu. Sem eles, o cadastro de
       inativos vira um depósito sem história — e em três meses ninguém sabe se
       o cliente pediu baixa, se faliu ou se foi erro de digitação. */
    inativos.fields.add(new TextField({ name: 'situacao', required: false }))
    inativos.fields.add(new TextField({ name: 'motivo_transferencia', required: false }))
    inativos.fields.add(
      new AutodateField({ name: 'transferido_em', onCreate: true, onUpdate: false }),
    )
    inativos.fields.add(new TextField({ name: 'transferido_por', required: false }))
    inativos.fields.add(new BoolField({ name: 'reativado', required: false }))
    inativos.fields.add(new TextField({ name: 'reativado_em', required: false }))

    inativos.indexes = [
      'CREATE INDEX idx_inativos_codigo ON cadastro_empresas_inativos (codigo)',
      'CREATE INDEX idx_inativos_doc ON cadastro_empresas_inativos (documento_limpo)',
      'CREATE INDEX idx_inativos_razao ON cadastro_empresas_inativos (razao_social)',
      'CREATE INDEX idx_inativos_uf_mun ON cadastro_empresas_inativos (uf, municipio)',
      'CREATE INDEX idx_inativos_cnae_div ON cadastro_empresas_inativos (cnae_divisao)',
    ]

    app.save(inativos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('cadastro_empresas_inativos'))
    } catch (err) {
      /* já não existe */
    }
  },
)
