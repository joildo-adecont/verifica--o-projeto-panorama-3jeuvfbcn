/**
 * MIGRATION 0152 — Permissões de API e Compatibilidade de Campos (Auditoria Panorama)
 *
 * 1. Ajusta regras de API (listRule e viewRule públicas/autenticadas "") para coleções
 *    lidas pelo portal que estavam restritas apenas a superusers (causando erro 403):
 *    - `market_alerts`: permitida leitura pública (list e view) para o sino de alertas de mercado
 *    - `param_documentos`: permitida leitura (list e view) e inserção/atualização para documentos fiscais do cliente
 *    - `param_itens`: permitida leitura (list e view)
 *    - `param_pastas`: permitida leitura (list e view)
 *    - `series_cache`: permitida leitura (list e view)
 *    - `news_cache`: permitida leitura (list e view)
 *    - `economic_indicators_cache`: permitida leitura (list e view)
 *
 * 2. Adiciona campo de compatibilidade `documento` em `cadastro_empresas` e `cadastro_empresas_inativos`
 *    populado com `numero_documento` / `documento_limpo`, evitando erro 400 "Something went wrong"
 *    quando qualquer filtro PocketBase consultar `documento ~ '...'` ou `documento = '...'`.
 */

migrate(
  (app) => {
    console.log('[0152] Iniciando migration 0152: auditoria de permissões e compatibilidade...')

    // 1. Permissões de leitura pública em coleções operacionais do portal
    const colecoesLeitura = [
      'market_alerts',
      'param_documentos',
      'param_itens',
      'param_pastas',
      'series_cache',
      'news_cache',
      'economic_indicators_cache',
    ]

    for (let i = 0; i < colecoesLeitura.length; i++) {
      const nomeCol = colecoesLeitura[i]
      try {
        const col = app.findCollectionByNameOrId(nomeCol)
        if (col) {
          col.listRule = ''
          col.viewRule = ''
          if (
            nomeCol === 'param_documentos' ||
            nomeCol === 'param_itens' ||
            nomeCol === 'param_pastas'
          ) {
            col.createRule = ''
            col.updateRule = ''
          }
          if (nomeCol === 'market_alerts') {
            // Permitir marcar como lido (update)
            col.updateRule = ''
          }
          app.save(col)
          console.log('[0152] Regras de API atualizadas para coleção: ' + nomeCol)
        }
      } catch (errCol) {
        console.log('[0152] Aviso na coleção ' + nomeCol + ': ' + errCol)
      }
    }

    // 2. Campo de compatibilidade `documento` em cadastro_empresas e cadastro_empresas_inativos
    const colecoesCadastro = ['cadastro_empresas', 'cadastro_empresas_inativos']
    for (let c = 0; c < colecoesCadastro.length; c++) {
      const nomeCad = colecoesCadastro[c]
      try {
        const colCad = app.findCollectionByNameOrId(nomeCad)
        if (colCad) {
          let mudou = false
          if (!colCad.fields.getByName('documento')) {
            colCad.fields.add(
              new Field({
                name: 'documento',
                type: 'text',
                required: false,
              }),
            )
            mudou = true
          }
          if (mudou) {
            try {
              colCad.indexes.push(
                'CREATE INDEX idx_' + nomeCad + '_doc_compat ON ' + nomeCad + ' (documento)',
              )
            } catch (_) {}
            app.save(colCad)
            console.log('[0152] Campo de compatibilidade "documento" criado em ' + nomeCad)

            // Backfill do campo documento com o valor existente
            const registros = app.findAllRecords(nomeCad)
            console.log(
              '[0152] Sincronizando campo documento para ' +
                registros.length +
                ' registros em ' +
                nomeCad,
            )
            for (let r = 0; r < registros.length; r++) {
              const reg = registros[r]
              const docAtual = reg.get('documento')
              if (!docAtual) {
                const val = reg.get('numero_documento') || reg.get('documento_limpo') || ''
                if (val) {
                  reg.set('documento', val)
                  app.save(reg)
                }
              }
            }
          }
        }
      } catch (errCad) {
        console.log('[0152] Aviso ao adicionar campo documento em ' + nomeCad + ': ' + errCad)
      }
    }

    console.log('[0152] Migration 0152 concluída com sucesso.')
  },
  (app) => {
    // Reversão segura
    const colecoes = ['market_alerts', 'param_documentos', 'param_itens', 'param_pastas']
    for (let i = 0; i < colecoes.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(colecoes[i])
        if (col) {
          col.listRule = null
          col.viewRule = null
          app.save(col)
        }
      } catch (_) {}
    }
  },
)
