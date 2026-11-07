/**
 * MIGRATION 0153 — Backfill do campo documento em cadastro_empresas e cadastro_empresas_inativos
 */
migrate(
  (app) => {
    console.log('[0153] Executando backfill do campo documento...')
    const colecoes = ['cadastro_empresas', 'cadastro_empresas_inativos']

    for (let c = 0; c < colecoes.length; c++) {
      const nomeCol = colecoes[c]
      try {
        const registros = app.findAllRecords(nomeCol)
        console.log('[0153] Coleção ' + nomeCol + ': ' + registros.length + ' registros.')
        let atualizados = 0

        for (let i = 0; i < registros.length; i++) {
          const reg = registros[i]
          const numDoc = reg.get('numero_documento') || ''
          const docLimpo = reg.get('documento_limpo') || ''
          const val = numDoc || docLimpo || ''

          if (val) {
            reg.set('documento', val)
            app.save(reg)
            atualizados++
          }
        }
        console.log(
          '[0153] Coleção ' +
            nomeCol +
            ': ' +
            atualizados +
            ' registros atualizados com campo documento.',
        )
      } catch (err) {
        console.log('[0153] Erro no backfill de ' + nomeCol + ': ' + err)
      }
    }
  },
  (app) => {},
)
