migrate(
  (app) => {
    // 1. Coleção programa_atualizacoes (Registros de atualizações da base pelo CEO/rotinas)
    let atualizacoesCol = null
    try {
      atualizacoesCol = app.findCollectionByNameOrId('programa_atualizacoes')
    } catch (_) {
      atualizacoesCol = null
    }

    if (!atualizacoesCol) {
      atualizacoesCol = new Collection({
        name: 'programa_atualizacoes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'data_atualizacao', type: 'text', required: true }, // formato YYYY-MM-DD (mesmo dia do evento)
          { name: 'origem', type: 'text', required: true }, // ex.: "base de classificações", "rotina semanal de normas", "manual CEO"
          { name: 'versao_base', type: 'text', required: true }, // ex.: "v2.8.4-base", "base-2026-11-01"
          { name: 'descricao', type: 'text', required: true },
          { name: 'total_envios_afetados', type: 'number' },
          { name: 'executado_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_programa_atualizacoes_data ON programa_atualizacoes (data_atualizacao DESC)',
          'CREATE INDEX idx_programa_atualizacoes_origem ON programa_atualizacoes (origem)',
        ],
      })
      app.save(atualizacoesCol)
    }

    // 2. Coleção programa_propagacoes (Ligando atualização aos envios relevantes no MESMO DIA)
    let propagacoesCol = null
    try {
      propagacoesCol = app.findCollectionByNameOrId('programa_propagacoes')
    } catch (_) {
      propagacoesCol = null
    }

    if (!propagacoesCol) {
      propagacoesCol = new Collection({
        name: 'programa_propagacoes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'atualizacao_id', type: 'text', required: true },
          { name: 'envio_id', type: 'text', required: true },
          { name: 'protocolo_envio', type: 'text', required: true },
          {
            name: 'plataforma',
            type: 'select',
            values: ['desktop', 'celular'],
            maxSelect: 1,
            required: true,
          },
          { name: 'destinatario_nome', type: 'text' },
          { name: 'data_propagacao', type: 'text', required: true }, // MESMO DIA da atualização
          {
            name: 'status',
            type: 'select',
            values: ['propagada', 'pendente', 'confirmada'],
            maxSelect: 1,
            required: true,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_programa_propagacoes_data ON programa_propagacoes (data_propagacao DESC)',
          'CREATE INDEX idx_programa_propagacoes_envio ON programa_propagacoes (envio_id)',
          'CREATE INDEX idx_programa_propagacoes_atualizacao ON programa_propagacoes (atualizacao_id)',
          'CREATE INDEX idx_programa_propagacoes_plat ON programa_propagacoes (plataforma)',
        ],
      })
      app.save(propagacoesCol)
    }

    // 3. Adicionar campo 'requer_atualizacao' na coleção programa_envios (se ainda não existir)
    const enviosCol = app.findCollectionByNameOrId('programa_envios')
    if (!enviosCol.fields.getByName('requer_atualizacao')) {
      enviosCol.fields.add(
        new BoolField({
          name: 'requer_atualizacao',
          required: false,
        }),
      )
      enviosCol.addIndex('idx_programa_envios_requer_att', false, 'requer_atualizacao', '')
      app.save(enviosCol)
    }

    // 4. Semear uma atualização inicial oficial da base (idempotente)
    const atualizacoesExistentes = app.findRecordsByFilter(
      'programa_atualizacoes',
      'origem = {:o} && versao_base = {:vb}',
      '',
      1,
      0,
      {
        o: 'manual CEO',
        vb: 'v2.8.4-base',
      },
    )

    if (atualizacoesExistentes.length === 0) {
      const rec = new Record(atualizacoesCol)
      rec.set('data_atualizacao', '2026-10-31')
      rec.set('origem', 'manual CEO')
      rec.set('versao_base', 'v2.8.4-base')
      rec.set(
        'descricao',
        'Consolidação inicial de classificações NCM (mais de 15.240 itens), alíquotas CBS/IBS 2026-2033 e manifesto de atualização automática.',
      )
      rec.set('total_envios_afetados', 0)
      rec.set('executado_por', 'CEO — Direção Executiva ADECONT')
      app.save(rec)
    }
  },
  (app) => {
    try {
      const propagacoesCol = app.findCollectionByNameOrId('programa_propagacoes')
      app.delete(propagacoesCol)
    } catch (_) {}

    try {
      const atualizacoesCol = app.findCollectionByNameOrId('programa_atualizacoes')
      app.delete(atualizacoesCol)
    } catch (_) {}

    try {
      const enviosCol = app.findCollectionByNameOrId('programa_envios')
      enviosCol.removeIndex('idx_programa_envios_requer_att')
      const campo = enviosCol.fields.getByName('requer_atualizacao')
      if (campo) {
        enviosCol.fields.remove(campo)
      }
      app.save(enviosCol)
    } catch (_) {}
  },
)
