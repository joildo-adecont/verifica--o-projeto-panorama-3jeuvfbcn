/// <reference path="../pb_data/types.d.ts" />
// 0066 - Depositar link oficial de download da base NCM completa na Central de Entrega (install_shortcuts)
migrate(
  (app) => {
    const tituloOficial = 'Base de Classificações NCM — Completa (15.240 itens oficiais)'
    const urlRelativa = '/backend/v1/export-classifications?tipo=NCM&formato=csv'
    const deviceType = 'todos'
    const criadoPor = 'Equipe ADECONT'
    const instrucoesTexto =
      '1. Clique no link para baixar o arquivo CSV oficial da base NCM.\n' +
      '2. Compatibilidade direta: arquivo codificado com BOM UTF-8 e separador ponto-e-vírgula (;), abrindo com acentuação e colunas perfeitas no Microsoft Excel e Google Planilhas.\n' +
      '3. Contém a base integral NCM oficial (15.240 itens oficiais do Siscomex/MDIC, referência 01/10/2026) servida pelo backend seguro ADECONT (política anti-bloqueio).'
    const observacoesTexto =
      'Base oficial completa NCM (15.240 itens Siscomex/MDIC, ref. 01/10/2026) em CSV com BOM UTF-8 e ponto-e-vírgula.'

    const col = app.findCollectionByNameOrId('install_shortcuts')

    // Upsert idempotente via SQL / Record: busca por título ou URL de exportação NCM
    let existingRecord = null
    try {
      const records = app.findRecordsByFilter(
        'install_shortcuts',
        "titulo = '" +
          tituloOficial.replace(/'/g, "''") +
          "' || url ~ 'export-classifications?tipo=NCM'",
        '-created',
        1,
        0,
      )
      if (records && records.length > 0) {
        existingRecord = records[0]
      }
    } catch (_) {}

    const now = new Date().toISOString()

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
        '[0066_deposit_ncm_shortcut] Registro existente atualizado com sucesso:',
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
        '[0066_deposit_ncm_shortcut] Novo registro NCM depositado com sucesso:',
        newRecord.id,
      )
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'install_shortcuts',
        "titulo = 'Base de Classificações NCM — Completa (15.240 itens oficiais)'",
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
