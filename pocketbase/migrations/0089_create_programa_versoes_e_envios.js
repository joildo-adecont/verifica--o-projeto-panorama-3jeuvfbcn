migrate(
  (app) => {
    // 1. Coleção programa_versoes (Versões do Programa controladas pelo COU)
    let versoesCol = null
    try {
      versoesCol = app.findCollectionByNameOrId('programa_versoes')
    } catch (_) {
      versoesCol = null
    }

    if (!versoesCol) {
      versoesCol = new Collection({
        name: 'programa_versoes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'versao', type: 'text', required: true },
          { name: 'data_atualizacao', type: 'text', required: true },
          { name: 'notas_versao', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            values: ['atual', 'anterior', 'planejada'],
            maxSelect: 1,
            required: true,
          },
          { name: 'url_instalador', type: 'text' },
          { name: 'canal_distribuicao', type: 'text' },
          { name: 'controlado_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_programa_versoes_data ON programa_versoes (data_atualizacao DESC)',
          'CREATE INDEX idx_programa_versoes_status ON programa_versoes (status)',
        ],
      })
      app.save(versoesCol)
    }

    // 2. Coleção programa_envios (Registros de Envio da Instalação pelo COU)
    let enviosCol = null
    try {
      enviosCol = app.findCollectionByNameOrId('programa_envios')
    } catch (_) {
      enviosCol = null
    }

    if (!enviosCol) {
      enviosCol = new Collection({
        name: 'programa_envios',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'versao_ref', type: 'text', required: true },
          { name: 'data_atualizacao_ref', type: 'text' },
          { name: 'destinatario_nome', type: 'text', required: true },
          { name: 'destinatario_email', type: 'text' },
          { name: 'destinatario_whatsapp', type: 'text' },
          { name: 'destinatario_empresa', type: 'text' },
          {
            name: 'canal',
            type: 'select',
            values: ['email', 'whatsapp', 'qr_code', 'link_direto'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            values: ['ENVIADO', 'RECEBIDO', 'PENDENTE'],
            maxSelect: 1,
            required: true,
          },
          { name: 'protocolo', type: 'text' },
          { name: 'mensagem', type: 'text' },
          { name: 'url_instalador_enviada', type: 'text' },
          { name: 'enviado_por', type: 'text' },
          { name: 'data_envio', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_programa_envios_versao ON programa_envios (versao_ref)',
          'CREATE INDEX idx_programa_envios_created ON programa_envios (created DESC)',
        ],
      })
      app.save(enviosCol)
    }

    // 3. Semente inicial da Versão Atual homologada pelo COU (idempotente)
    const versoesExistentes = app.findRecordsByFilter(
      'programa_versoes',
      'versao = {:v}',
      '',
      1,
      0,
      {
        v: 'v2.8.4',
      },
    )

    if (versoesExistentes.length === 0) {
      const vAtual = new Record(versoesCol)
      vAtual.set('versao', 'v2.8.4')
      vAtual.set('data_atualizacao', '2026-10-31')
      vAtual.set(
        'notas_versao',
        'Lançamento do Módulo Central do COU: Instalador e Controle de Versão, Radar Nacional (três níveis federativos), Busca Avançada NCM com mais de 15.240 classificações e política anti-bloqueio institucional ADECONT.',
      )
      vAtual.set('status', 'atual')
      vAtual.set('url_instalador', '/#instalador-versao')
      vAtual.set('canal_distribuicao', 'E-mail, WhatsApp e QR Code Seguro')
      vAtual.set('controlado_por', 'COU — Centro de Operações Unificadas ADECONT')
      app.save(vAtual)
    }

    const vAnterior = app.findRecordsByFilter('programa_versoes', 'versao = {:v}', '', 1, 0, {
      v: 'v2.7.1',
    })

    if (vAnterior.length === 0) {
      const vAnt = new Record(versoesCol)
      vAnt.set('versao', 'v2.7.1')
      vAnt.set('data_atualizacao', '2026-10-15')
      vAnt.set(
        'notas_versao',
        'Implementação dos simuladores setoriais da Reforma Tributária (LC 214/2025, LC 227/2026), cálculo de alíquotas de referência CBS/IBS e catálogo de anexos 1 a 28.',
      )
      vAnt.set('status', 'anterior')
      vAnt.set('url_instalador', '/#instalador-versao')
      vAnt.set('canal_distribuicao', 'E-mail Oficial e PWA')
      vAnt.set('controlado_por', 'COU — Centro de Operações Unificadas ADECONT')
      app.save(vAnt)
    }
  },
  (app) => {
    try {
      const envios = app.findCollectionByNameOrId('programa_envios')
      app.delete(envios)
    } catch (_) {}

    try {
      const versoes = app.findCollectionByNameOrId('programa_versoes')
      app.delete(versoes)
    } catch (_) {}
  },
)
