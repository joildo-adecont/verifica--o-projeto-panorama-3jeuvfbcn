/**
 * MIGRATION 0134 — campos completos do cadastro de empresas
 * =========================================================
 * A colleção `cadastro_empresas` nasceu (0133) com 11 campos: código,
 * documento, razão social, apelido, data de inscrição, IE, SUFRAMA e página.
 * O PDF "Empresas completo" (943 páginas, um contribuinte por página) traz
 * MUITO mais — e o campo decisivo é o **CNAE 2.3**, que a exportação anterior
 * do sistema contábil não trazia e por isso deixou combustível e financeiro
 * como "pendente" no levantamento de carteira.
 *
 * ── POR QUE `cnae_divisao` É COLUNA E NÃO CÁLCULO NA TELA ──
 * O cruzamento por atividade usa a DIVISÃO do CNAE (2 primeiros dígitos: 64, 65,
 * 66 = financeiro; 46-81, 47-32 = combustível; 01-03 = agro). Guardar a divisão
 * pronta permite filtrar e agrupar no banco, sem carregar 943 registros para o
 * navegador só para cortar dois dígitos.
 *
 * ── OS CAMPOS SÃO TODOS `text` DE PROPÓSITO ──
 * Data, CEP, capital social e telefone vêm como texto no relatório de origem,
 * em formato brasileiro. Converter para número/data na importação criaria
 * registros que não voltam ao formato original na tela — e um CEP `95200000`
 * virando `95200000.0` é o tipo de erro que ninguém percebe até imprimir.
 * Exceto `codigo` e `pagina`, que já existiam como número.
 */
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cadastro_empresas')

    const camposTexto = [
      'nome',
      'nome_fantasia',
      'natureza_juridica',
      'cnae',
      'cnae_divisao',
      'ramo_atividade',
      'inicio_atividades',
      'cliente_desde',
      'situacao',
      'tipo_endereco',
      'endereco',
      'numero_endereco',
      'bairro',
      'complemento',
      'municipio',
      'uf',
      'cep',
      'pais',
      'telefone',
      'fax',
      'email',
      'pagina_internet',
      'inscricao_municipal',
      'inscricao_junta_comercial',
      'capital_social',
      'contador',
      'responsavel_legal',
      'foro_comarca',
      'duracao_contrato',
    ]

    for (const nome of camposTexto) {
      if (!col.fields.getByName(nome)) {
        col.fields.add(new TextField({ name: nome, required: false }))
      }
    }

    app.save(col)

    /* Índices que o uso real exige: procurar por CNAE, por UF+município e por
       situação. Sem eles, cada filtro da tela varre 943 registros. */
    const idx = [
      'CREATE INDEX idx_cadastro_empresas_cnae ON cadastro_empresas (cnae)',
      'CREATE INDEX idx_cadastro_empresas_cnae_div ON cadastro_empresas (cnae_divisao)',
      'CREATE INDEX idx_cadastro_empresas_uf_mun ON cadastro_empresas (uf, municipio)',
      'CREATE INDEX idx_cadastro_empresas_situacao ON cadastro_empresas (situacao)',
    ]

    const col2 = app.findCollectionByNameOrId('cadastro_empresas')
    for (const sql of idx) {
      const nomeIdx = sql
        .split(' ON ')[0]
        .replace('CREATE INDEX ', '')
        .replace('CREATE UNIQUE INDEX ', '')
      const jaTem = (col2.indexes || []).some((i) => i.indexOf(nomeIdx) >= 0)
      if (!jaTem) col2.indexes = [...(col2.indexes || []), sql]
    }
    app.save(col2)
  },
  (app) => {
    /* Rollback: remove só os campos e índices criados aqui. Os da 0133 ficam. */
    const col = app.findCollectionByNameOrId('cadastro_empresas')
    const remover = [
      'nome',
      'nome_fantasia',
      'natureza_juridica',
      'cnae',
      'cnae_divisao',
      'ramo_atividade',
      'inicio_atividades',
      'cliente_desde',
      'situacao',
      'tipo_endereco',
      'endereco',
      'numero_endereco',
      'bairro',
      'complemento',
      'municipio',
      'uf',
      'cep',
      'pais',
      'telefone',
      'fax',
      'email',
      'pagina_internet',
      'inscricao_municipal',
      'inscricao_junta_comercial',
      'capital_social',
      'contador',
      'responsavel_legal',
      'foro_comarca',
      'duracao_contrato',
    ]
    for (const nome of remover) {
      const f = col.fields.getByName(nome)
      if (f) col.fields.removeByName(nome)
    }
    col.indexes = (col.indexes || []).filter(
      (i) =>
        i.indexOf('idx_cadastro_empresas_cnae') < 0 &&
        i.indexOf('idx_cadastro_empresas_uf_mun') < 0 &&
        i.indexOf('idx_cadastro_empresas_situacao') < 0,
    )
    app.save(col)
  },
)
