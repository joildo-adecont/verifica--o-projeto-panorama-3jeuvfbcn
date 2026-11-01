/// <reference path="../pb_data/types.d.ts" />
// 0086 - Depositar link oficial da Busca Avançada da Reforma Tributária na Central de Entrega (install_shortcuts)
migrate(
  (app) => {
    const tituloOficial = '🔍 Busca Avançada da Reforma Tributária (Pesquisa Correlacionada)'
    const urlRelativa = '/#busca-avancada'
    const deviceType = 'todos'
    const criadoPor = 'Equipe ADECONT'
    const instrucoesTexto =
      '1. Acesse o link para abrir o Motor Integrado de Busca Avançada da Reforma Tributária no seu celular ou computador.\n' +
      '2. Pesquise diretamente por produtos, serviços, classificações (NCM, cClassTrib, CST, CEST, NBS, CNAE), normas, anexos, imunidades e reduções de alíquotas.\n' +
      '3. Gráficos de dispersão, comparativos de desoneração e visualização integrada de atos oficiais (União, CGIBS, Estados e Municípios).'
    const observacoesTexto =
      'Link direto da Busca Avançada ADECONT para consulta rápida e envio a clientes cadastrados com termo de pesquisa configurável.'

    const col = app.findCollectionByNameOrId('install_shortcuts')

    // Upsert idempotente via SQL / Record: busca por título ou URL da Busca Avançada
    let existingRecord = null
    try {
      const records = app.findRecordsByFilter(
        'install_shortcuts',
        "titulo = '" + tituloOficial.replace(/'/g, "''") + "' || url ~ 'busca-avancada'",
        '-created',
        1,
        0,
      )
      if (records && records.length > 0) {
        existingRecord = records[0]
      }
    } catch (_) {}

    if (existingRecord) {
      existingRecord.set('titulo', tituloOficial)
      existingRecord.set('device_type', deviceType)
      existingRecord.set('url', urlRelativa)
      existingRecord.set('instrucoes', instrucoesTexto)
      existingRecord.set('observacoes', observacoesTexto)
      existingRecord.set('criado_por', criadoPor)
      if (
        existingRecord.get('envios_count') === null ||
        existingRecord.get('envios_count') === undefined
      ) {
        existingRecord.set('envios_count', 0)
      }
      app.save(existingRecord)
      console.log(
        '[0086_deposit_busca_avancada_shortcut] Registro existente atualizado com sucesso:',
        existingRecord.id,
      )
    } else {
      const newRecord = new Record(col)
      newRecord.set('titulo', tituloOficial)
      newRecord.set('device_type', deviceType)
      newRecord.set('url', urlRelativa)
      newRecord.set('instrucoes', instrucoesTexto)
      newRecord.set('observacoes', observacoesTexto)
      newRecord.set('criado_por', criadoPor)
      newRecord.set('envios_count', 0)
      app.save(newRecord)
      console.log(
        '[0086_deposit_busca_avancada_shortcut] Novo registro Busca Avançada depositado com sucesso:',
        newRecord.id,
      )
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'install_shortcuts',
        "titulo = '🔍 Busca Avançada da Reforma Tributária (Pesquisa Correlacionada)'",
        '-created',
        10,
        0,
      )
      for (let i = 0; i < records.length; i++) {
        app.delete(records[i])
      }
    } catch (_) {}
  },
)
