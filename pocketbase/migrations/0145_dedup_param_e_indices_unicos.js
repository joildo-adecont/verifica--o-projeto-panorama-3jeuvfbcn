/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0145 — DEDUPLICAÇÃO E ÍNDICES ÚNICOS (param_documentos e param_itens)
 *
 * 1. Deduplicação em param_documentos:
 *    Identifica registros com a mesma chave de acesso (chave não vazia).
 *    Mantém APENAS o registro mais antigo (primeiro importado por importado_em/created/id).
 *    Remove os registros duplicados mais novos.
 *
 * 2. Limpeza de órfãos e deduplicação em param_itens:
 *    Remove itens apontando para documentos que foram deletados.
 *    Deduplica itens com a mesma chave_doc + numero_item mantendo o registro do documento preservado.
 *
 * 3. Deduplicação defensiva em nfes e nfes_itens (caso haja alguma inconsistência histórica).
 *
 * 4. Aplicação de índice único:
 *    - param_documentos: CREATE UNIQUE INDEX idx_param_documentos_chave ON param_documentos (chave) WHERE chave != ''
 *    - param_itens: CREATE UNIQUE INDEX idx_param_itens_chave_num ON param_itens (chave_doc, numero_item) WHERE chave_doc != ''
 */

migrate(
  (app) => {
    console.log('[0145] Iniciando deduplicação e criação de índices únicos...')

    var totalDocsRemovidos = 0
    var totalItensRemovidos = 0
    var totalNfesRemovidas = 0
    var totalNfesItensRemovidos = 0

    // ══════════════════════════════════════════════════════════════════════════
    // A. DEDUPLICAÇÃO DE param_documentos
    // ══════════════════════════════════════════════════════════════════════════
    try {
      const colDocs = app.findCollectionByNameOrId('param_documentos')
      if (colDocs) {
        // Busca todos os documentos que possuem chave preenchida, ordenados por importado_em ASC, id ASC
        const docs = app.findRecordsByFilter(
          'param_documentos',
          'chave != ""',
          'importado_em, id',
          50000,
          0,
        )

        var mapChaves = {}
        var idsParaExcluir = []

        for (var i = 0; i < docs.length; i++) {
          var d = docs[i]
          var ch = String(d.getString('chave') || '').trim()
          if (!ch) continue

          if (!mapChaves[ch]) {
            // Primeiro registro encontrado: mantido (é o mais antigo)
            mapChaves[ch] = d.id
          } else {
            // Duplicata posterior: marcar para exclusão
            idsParaExcluir.push(d.id)
          }
        }

        console.log(
          '[0145] param_documentos: encontrados ' +
            idsParaExcluir.length +
            ' duplicados para exclusão.',
        )

        for (var j = 0; j < idsParaExcluir.length; j++) {
          var idDoc = idsParaExcluir[j]
          try {
            // Exclui itens órfãos do documento deletado
            var itensDoc = app.findRecordsByFilter(
              'param_itens',
              'documento = {:id}',
              '',
              5000,
              0,
              {
                id: idDoc,
              },
            )
            for (var k = 0; k < itensDoc.length; k++) {
              try {
                app.delete(itensDoc[k])
                totalItensRemovidos++
              } catch (errIt) {
                console.log('[0145] Erro ao excluir item órfão ' + itensDoc[k].id + ': ' + errIt)
              }
            }

            var recDoc = app.findRecordById('param_documentos', idDoc)
            if (recDoc) {
              app.delete(recDoc)
              totalDocsRemovidos++
            }
          } catch (errDel) {
            console.log('[0145] Erro ao deletar param_documentos ' + idDoc + ': ' + errDel)
          }
        }
      }
    } catch (errColDoc) {
      console.log('[0145] Erro na deduplicação de param_documentos: ' + errColDoc)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // B. DEDUPLICAÇÃO DE param_itens RESTANTES (por chave_doc + numero_item)
    // ══════════════════════════════════════════════════════════════════════════
    try {
      const colItens = app.findCollectionByNameOrId('param_itens')
      if (colItens) {
        const itens = app.findRecordsByFilter('param_itens', 'chave_doc != ""', 'id', 50000, 0)

        var mapItens = {}
        var itensDuplicados = []

        for (var m = 0; m < itens.length; m++) {
          var it = itens[m]
          var kChaveItem =
            String(it.getString('chave_doc') || '').trim() + '_' + it.getInt('numero_item')
          if (!mapItens[kChaveItem]) {
            mapItens[kChaveItem] = it.id
          } else {
            itensDuplicados.push(it)
          }
        }

        console.log(
          '[0145] param_itens: encontrados ' +
            itensDuplicados.length +
            ' itens duplicados para exclusão.',
        )

        for (var n = 0; n < itensDuplicados.length; n++) {
          try {
            app.delete(itensDuplicados[n])
            totalItensRemovidos++
          } catch (errItD) {
            console.log(
              '[0145] Erro ao deletar item duplicado ' + itensDuplicados[n].id + ': ' + errItD,
            )
          }
        }
      }
    } catch (errColIt) {
      console.log('[0145] Erro na deduplicação de param_itens: ' + errColIt)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // C. DEDUPLICAÇÃO DEFENSIVA EM nfes E nfes_itens
    // ══════════════════════════════════════════════════════════════════════════
    try {
      const colNfes = app.findCollectionByNameOrId('nfes')
      if (colNfes) {
        const nfesDocs = app.findRecordsByFilter(
          'nfes',
          'chave_acesso != ""',
          'created, id',
          50000,
          0,
        )
        var mapNfes = {}
        for (var p = 0; p < nfesDocs.length; p++) {
          var nfe = nfesDocs[p]
          var chNfe = String(nfe.getString('chave_acesso') || '').trim()
          if (!chNfe) continue
          if (!mapNfes[chNfe]) {
            mapNfes[chNfe] = nfe.id
          } else {
            try {
              // Limpar itens
              var nitens = app.findRecordsByFilter('nfes_itens', 'nfe_id = {:id}', '', 5000, 0, {
                id: nfe.id,
              })
              for (var q = 0; q < nitens.length; q++) {
                try {
                  app.delete(nitens[q])
                  totalNfesItensRemovidos++
                } catch (_) {}
              }
              app.delete(nfe)
              totalNfesRemovidas++
            } catch (errN) {
              console.log('[0145] Erro ao excluir nfe duplicada: ' + errN)
            }
          }
        }
      }
    } catch (errColNfe) {
      console.log('[0145] Verificação de nfes: ' + errColNfe)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // D. CRIAÇÃO DOS ÍNDICES ÚNICOS
    // ══════════════════════════════════════════════════════════════════════════
    try {
      const colDocsParaIndice = app.findCollectionByNameOrId('param_documentos')
      if (colDocsParaIndice) {
        var idxDocs = colDocsParaIndice.indexes || []
        var jaTemIdxDoc = false
        for (var idxi = 0; idxi < idxDocs.length; idxi++) {
          if (idxDocs[idxi].indexOf('idx_param_documentos_chave') >= 0) {
            jaTemIdxDoc = true
            break
          }
        }
        if (!jaTemIdxDoc) {
          idxDocs.push(
            'CREATE UNIQUE INDEX idx_param_documentos_chave ON param_documentos (chave) WHERE chave != ""',
          )
          colDocsParaIndice.indexes = idxDocs
          app.save(colDocsParaIndice)
          console.log('[0145] Índice único idx_param_documentos_chave criado com sucesso.')
        }
      }
    } catch (errIdxDoc) {
      console.log('[0145] Erro ao criar índice único em param_documentos: ' + errIdxDoc)
    }

    try {
      const colItensParaIndice = app.findCollectionByNameOrId('param_itens')
      if (colItensParaIndice) {
        var idxItens = colItensParaIndice.indexes || []
        var jaTemIdxItem = false
        for (var idxj = 0; idxj < idxItens.length; idxj++) {
          if (idxItens[idxj].indexOf('idx_param_itens_chave_num') >= 0) {
            jaTemIdxItem = true
            break
          }
        }
        if (!jaTemIdxItem) {
          idxItens.push(
            'CREATE UNIQUE INDEX idx_param_itens_chave_num ON param_itens (chave_doc, numero_item) WHERE chave_doc != ""',
          )
          colItensParaIndice.indexes = idxItens
          app.save(colItensParaIndice)
          console.log('[0145] Índice único idx_param_itens_chave_num criado com sucesso.')
        }
      }
    } catch (errIdxIt) {
      console.log('[0145] Erro ao criar índice único em param_itens: ' + errIdxIt)
    }

    console.log(
      '[0145] Concluído! Removidos: ' +
        totalDocsRemovidos +
        ' documentos em param_documentos, ' +
        totalItensRemovidos +
        ' itens em param_itens, ' +
        totalNfesRemovidas +
        ' nfes e ' +
        totalNfesItensRemovidos +
        ' nfes_itens.',
    )
  },
  (app) => {
    // Rollback
    try {
      const colDocs = app.findCollectionByNameOrId('param_documentos')
      if (colDocs && colDocs.indexes) {
        colDocs.indexes = colDocs.indexes.filter(function (idx) {
          return idx.indexOf('idx_param_documentos_chave') < 0
        })
        app.save(colDocs)
      }
    } catch (_) {}

    try {
      const colItens = app.findCollectionByNameOrId('param_itens')
      if (colItens && colItens.indexes) {
        colItens.indexes = colItens.indexes.filter(function (idx) {
          return idx.indexOf('idx_param_itens_chave_num') < 0
        })
        app.save(colItens)
      }
    } catch (_) {}
  },
)
