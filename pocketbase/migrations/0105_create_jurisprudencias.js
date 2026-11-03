migrate(
  (app) => {
    /**
     * JURISPRUDÊNCIAS PUBLICADAS — 03/11/2026
     * =======================================
     *
     * Pedido do CEO: "Crie um ícone em separado no acervo jurídico só para
     * publicar as jurisprudências."
     *
     * ── O QUE ESTA COLEÇÃO É, E O QUE ELA NÃO É ──
     * É o ACERVO DO ESCRITÓRIO: a decisão que o advogado separou para usar, com
     * a sua própria classificação (matéria, tribunal, tese, aplicação prática).
     * NÃO é substituta das bases dos tribunais — essas continuam sendo a fonte
     * oficial em "Súmulas e teses" e na hierarquia.
     *
     * ── POR QUE O CAMPO `origem` EXISTE ──
     * Uma jurisprudência pode ser publicada a partir de: (a) uma das 2.963
     * verbetes já extraídos, (b) um link de tribunal que o usuário colou, ou
     * (c) digitação manual. Guardar a origem permite mostrar depois de onde
     * veio — e impede que uma nota interna seja confundida com a decisão do
     * tribunal. É o mesmo princípio do índice de artigos: declarar a fonte.
     *
     * ── POR QUE `situacao` TEM 'revisar' ──
     * Publicar não é o mesmo que estar correto. Uma peça marcada 'revisar'
     * aparece na lista com aviso; 'publicada' é o que vai para o cliente. Assim
     * ninguém envia minuta ao cliente achando que era a versão final.
     */

    let col = null
    try {
      col = app.findCollectionByNameOrId('jurisprudencias')
    } catch (_) {
      col = null
    }

    if (!col) {
      col = new Collection({
        name: 'jurisprudencias',
        type: 'base',
        // Painel interno: ninguém lê sem o token do painel (validado no hook).
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'titulo', type: 'text', required: true, max: 300 },
          {
            name: 'tribunal',
            type: 'select',
            values: [
              'STF',
              'STJ',
              'TST',
              'TSE',
              'STM',
              'TRF1',
              'TRF2',
              'TRF3',
              'TRF4',
              'TRF5',
              'TRF6',
              'TJ',
              'TRT',
              'TRE',
              'Outro',
            ],
            maxSelect: 1,
            required: true,
          },
          { name: 'orgao_julgador', type: 'text' },
          {
            name: 'tipo_decisao',
            type: 'select',
            values: [
              'súmula',
              'súmula vinculante',
              'acórdão',
              'decisão monocrática',
              'tema repetitivo',
              'repercussão geral',
              'resolução',
              'enunciado',
            ],
            maxSelect: 1,
            required: true,
          },
          { name: 'numero', type: 'text', max: 80 },
          { name: 'processo', type: 'text', max: 80 },
          { name: 'relator', type: 'text', max: 160 },
          { name: 'data_julgamento', type: 'text' },
          { name: 'data_publicacao', type: 'text' },
          {
            name: 'materia',
            type: 'select',
            values: [
              'Tributário',
              'Civil',
              'Processo Civil',
              'Penal',
              'Processo Penal',
              'Trabalhista',
              'Administrativo',
              'Constitucional',
              'Empresarial',
              'Consumidor',
              'Previdenciário',
              'Eleitoral',
              'Ambiental',
              'Outro',
            ],
            maxSelect: 1,
            required: true,
          },
          { name: 'tese', type: 'text', required: true, max: 8000 },
          { name: 'ementa', type: 'text', max: 20000 },
          { name: 'aplicacao_pratica', type: 'text', max: 4000 },
          {
            name: 'dispositivos',
            type: 'text',
            max: 500,
            // "CTN art. 156; CF art. 150, VI" — casa com o índice de artigos
          },
          { name: 'palavras_chave', type: 'text', max: 500 },
          {
            name: 'origem',
            type: 'select',
            values: ['verbete_extraido', 'link_tribunal', 'manual'],
            maxSelect: 1,
            required: true,
          },
          { name: 'fonte_url', type: 'text', max: 1000 },
          {
            name: 'situacao',
            type: 'select',
            values: ['rascunho', 'revisar', 'publicada', 'arquivada'],
            maxSelect: 1,
            required: true,
          },
          { name: 'destaque', type: 'bool' },
          { name: 'publicado_em', type: 'text' },
          { name: 'criado_por', type: 'text' },
          { name: 'atualizado_em', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_juris_tribunal ON jurisprudencias (tribunal)',
          'CREATE INDEX idx_juris_materia ON jurisprudencias (materia)',
          'CREATE INDEX idx_juris_situacao ON jurisprudencias (situacao)',
          'CREATE INDEX idx_juris_publicado ON jurisprudencias (publicado_em DESC)',
        ],
      })
      app.save(col)
    }

    /**
     * Log de publicação: quem publicou, o que mudou e quando. Sem isto, a
     * pergunta "quem enviou isso ao cliente?" não tem resposta — e num escritório
     * ela sempre aparece.
     */
    let log = null
    try {
      log = app.findCollectionByNameOrId('jurisprudencias_log')
    } catch (_) {
      log = null
    }

    if (!log) {
      log = new Collection({
        name: 'jurisprudencias_log',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'jurisprudencia_id', type: 'text', required: true },
          { name: 'acao', type: 'text', required: true },
          { name: 'de', type: 'text' },
          { name: 'para', type: 'text' },
          { name: 'por', type: 'text' },
          { name: 'detalhe', type: 'text', max: 2000 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        ],
      })
      app.save(log)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('jurisprudencias_log'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('jurisprudencias'))
    } catch (_) {}
  },
)
