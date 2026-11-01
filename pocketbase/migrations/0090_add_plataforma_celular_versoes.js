migrate(
  (app) => {
    // 1. Atualizar programa_versoes com o campo plataforma (desktop | celular)
    const versoesCol = app.findCollectionByNameOrId('programa_versoes')
    if (!versoesCol.fields.getByName('plataforma')) {
      versoesCol.fields.add(
        new SelectField({
          name: 'plataforma',
          values: ['desktop', 'celular'],
          maxSelect: 1,
        }),
      )
      versoesCol.addIndex('idx_programa_versoes_plataforma', false, 'plataforma', '')
      app.save(versoesCol)
    }

    // Atualizar registros legados sem plataforma para 'desktop'
    app
      .db()
      .newQuery(
        "UPDATE programa_versoes SET plataforma = 'desktop' WHERE plataforma IS NULL OR plataforma = ''",
      )
      .execute()

    // 2. Atualizar programa_envios com o campo plataforma (desktop | celular)
    const enviosCol = app.findCollectionByNameOrId('programa_envios')
    if (!enviosCol.fields.getByName('plataforma')) {
      enviosCol.fields.add(
        new SelectField({
          name: 'plataforma',
          values: ['desktop', 'celular'],
          maxSelect: 1,
        }),
      )
      enviosCol.addIndex('idx_programa_envios_plataforma', false, 'plataforma', '')
      app.save(enviosCol)
    }

    app
      .db()
      .newQuery(
        "UPDATE programa_envios SET plataforma = 'desktop' WHERE plataforma IS NULL OR plataforma = ''",
      )
      .execute()

    // 3. Semear versões homologadas para CELULAR pelo COU (idempotente)
    const vMobileAtual = app.findRecordsByFilter(
      'programa_versoes',
      "versao = {:v} && plataforma = 'celular'",
      '',
      1,
      0,
      { v: 'v2.8.4-m' },
    )

    if (vMobileAtual.length === 0) {
      const rec = new Record(versoesCol)
      rec.set('versao', 'v2.8.4-m')
      rec.set('plataforma', 'celular')
      rec.set('data_atualizacao', '2026-10-31')
      rec.set(
        'notas_versao',
        'Versão para Celular (PWA Mobile) homologada pelo COU: interface adaptada para toque, leitor de Classificações NCM no bolso, simuladores setoriais da Reforma Tributária otimizados para smartphone e atalho seguro na tela inicial.',
      )
      rec.set('status', 'atual')
      rec.set('url_instalador', '/#instalador-versao?tipo=celular')
      rec.set('canal_distribuicao', 'WhatsApp, QR Code Celular e E-mail')
      rec.set('controlado_por', 'COU — Centro de Operações Unificadas ADECONT')
      app.save(rec)
    }

    const vMobileAnterior = app.findRecordsByFilter(
      'programa_versoes',
      "versao = {:v} && plataforma = 'celular'",
      '',
      1,
      0,
      { v: 'v2.7.0-m' },
    )

    if (vMobileAnterior.length === 0) {
      const recAnt = new Record(versoesCol)
      recAnt.set('versao', 'v2.7.0-m')
      recAnt.set('plataforma', 'celular')
      recAnt.set('data_atualizacao', '2026-10-10')
      recAnt.set(
        'notas_versao',
        'Compilação mobile inicial: consulta ágil de alíquotas CBS/IBS, visualização responsiva de notas técnicas e suporte a telas de Android e iOS.',
      )
      recAnt.set('status', 'anterior')
      recAnt.set('url_instalador', '/#instalador-versao?tipo=celular')
      recAnt.set('canal_distribuicao', 'PWA Mobile e QR Code')
      recAnt.set('controlado_por', 'COU — Centro de Operações Unificadas ADECONT')
      app.save(recAnt)
    }
  },
  (app) => {
    try {
      const versoesCol = app.findCollectionByNameOrId('programa_versoes')
      versoesCol.removeIndex('idx_programa_versoes_plataforma')
      const campoPlat = versoesCol.fields.getByName('plataforma')
      if (campoPlat) {
        versoesCol.fields.remove(campoPlat)
      }
      app.save(versoesCol)
    } catch (_) {}

    try {
      const enviosCol = app.findCollectionByNameOrId('programa_envios')
      enviosCol.removeIndex('idx_programa_envios_plataforma')
      const campoPlatEnv = enviosCol.fields.getByName('plataforma')
      if (campoPlatEnv) {
        enviosCol.fields.remove(campoPlatEnv)
      }
      app.save(enviosCol)
    } catch (_) {}
  },
)
