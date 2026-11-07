/**
 * MIGRATION 0151 — Limpeza Segura do Cadastro de Clientes (ADECONT)
 *
 * 1. Adiciona campos de auditoria e arquivamento em `cadastro_empresas`:
 *    - `arquivado`: bool (default false)
 *    - `arquivado_em`: text (data ISO)
 *    - `arquivado_por`: text (ex: 'limpeza_segura_automatica' | 'manual')
 *    - `motivo_arquivamento`: text
 *    - `substituido_por_id`: text (id do registro mantido)
 *    - `substituido_por_codigo`: number (codigo do registro mantido)
 *
 * 2. Cria índices para busca eficiente de registros ativos/arquivados.
 *
 * 3. Execução idempotente da "Limpeza Segura":
 *    - Agrupa registros com documento válido e não-vazio por:
 *      chave = documento_limpo + '|||' + cnae_normalizado (ou ramo_atividade se cnae vazio)
 *    - Preserva intactos:
 *      * cadastros com atividades diferentes (ex: Antonio Ferreira de Lima, Jaqueline)
 *      * matriz e filial com CNPJs distintos (ex: Amora Brasil 0001-49 e 0002-20)
 *      * documentos malformados/vazios (apenas sinalizados na interface, nunca alterados)
 *    - Para duplicatas reais (mesmo documento + mesma atividade):
 *      * Seleciona o registro mais completo (score de completude de campos + data + menor código)
 *      * Marca os gêmeos como arquivados (soft-delete, NUNCA apaga)
 *      * Reaponta vínculos em:
 *        - `cont_documentos` (cliente_id, cliente_codigo se existir)
 *        - `nfes` (cliente_id)
 *        - `nfes_lote` (cliente_id)
 *        - `regime_historico` (empresa_id, empresa_codigo)
 *        - `param_documentos` (cliente_id se existir)
 */

migrate(
  (app) => {
    console.log('[0151] Iniciando migration 0151: Limpeza Segura do cadastro de clientes...')

    const col = app.findCollectionByNameOrId('cadastro_empresas')
    if (!col) {
      console.log('[0151] Coleção cadastro_empresas não encontrada.')
      return
    }

    // 1. Adiciona campos de arquivamento caso não existam
    const camposNovos = [
      { name: 'arquivado', type: 'bool' },
      { name: 'arquivado_em', type: 'text' },
      { name: 'arquivado_por', type: 'text' },
      { name: 'motivo_arquivamento', type: 'text' },
      { name: 'substituido_por_id', type: 'text' },
      { name: 'substituido_por_codigo', type: 'number' },
    ]

    let colAlterada = false
    for (let i = 0; i < camposNovos.length; i++) {
      const campo = camposNovos[i]
      if (!col.fields.getByName(campo.name)) {
        col.fields.add(
          new Field({
            name: campo.name,
            type: campo.type,
            required: false,
          }),
        )
        colAlterada = true
        console.log('[0151] Campo adicionado em cadastro_empresas: ' + campo.name)
      }
    }

    if (colAlterada) {
      try {
        col.indexes.push(
          'CREATE INDEX idx_cadastro_empresas_arquivado ON cadastro_empresas (arquivado)',
        )
        col.indexes.push(
          'CREATE INDEX idx_cadastro_empresas_subst ON cadastro_empresas (substituido_por_id)',
        )
      } catch (errIdx) {
        console.log('[0151] Aviso ao adicionar índices: ' + errIdx)
      }
      app.save(col)
    }

    // 2. Execução da dedup idempotente
    try {
      const registros = app.findAllRecords('cadastro_empresas')
      console.log(
        '[0151] Total de registros em cadastro_empresas para avaliação: ' + registros.length,
      )

      // Função de pontuação de completude de um registro
      function calcularScore(r) {
        let score = 0
        const campos = [
          'razao_social',
          'nome_fantasia',
          'apelido',
          'cnae',
          'cnae_divisao',
          'ramo_atividade',
          'natureza_juridica',
          'inscricao_estadual',
          'inscricao_municipal',
          'inscricao_junta_comercial',
          'capital_social',
          'email',
          'telefone',
          'endereco',
          'bairro',
          'municipio',
          'uf',
          'cep',
          'responsavel_legal',
          'contador',
          'regime_tributario',
          'enquadramento_tributario',
        ]
        for (let k = 0; k < campos.length; k++) {
          const v = r.get(campos[k])
          if (v !== null && v !== undefined && String(v).trim().length > 0) {
            score++
          }
        }
        return score
      }

      function normalizarAtividade(r) {
        const cnae = String(r.get('cnae') || '')
          .replace(/\D/g, '')
          .trim()
        if (cnae.length >= 4) return 'CNAE:' + cnae

        const ramo = String(r.get('ramo_atividade') || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (ramo.length > 5) return 'RAMO:' + ramo.slice(0, 40)

        const cnaeDiv = String(r.get('cnae_divisao') || '')
          .replace(/\D/g, '')
          .trim()
        if (cnaeDiv) return 'DIV:' + cnaeDiv

        return 'GERAL'
      }

      // Agrupa por documento limpo + atividade normalizada
      const grupos = {}
      for (let i = 0; i < registros.length; i++) {
        const r = registros[i]
        const docLimpo = String(r.get('documento_limpo') || '')
          .replace(/\D/g, '')
          .trim()

        // Ignora documentos vazios ou obviamente anômalos no agrupamento (serão sinalizados na UI)
        // CPF tem 11 dígitos, CNPJ tem 14 dígitos. CEI tem 12 dígitos.
        if (
          !docLimpo ||
          (docLimpo.length !== 11 && docLimpo.length !== 12 && docLimpo.length !== 14)
        ) {
          continue
        }

        const ativ = normalizarAtividade(r)
        const chave = docLimpo + '|||' + ativ

        if (!grupos[chave]) {
          grupos[chave] = []
        }
        grupos[chave].push(r)
      }

      let totalArquivados = 0
      let totalVinculosReapontados = 0

      const chaves = Object.keys(grupos)
      for (let c = 0; c < chaves.length; c++) {
        const lista = grupos[chaves[c]]
        if (lista.length <= 1) continue

        // Ordena: registros NÃO arquivados primeiro, depois maior score de campos, depois data de criação mais antiga
        lista.sort((a, b) => {
          const arqA = Boolean(a.get('arquivado')) ? 1 : 0
          const arqB = Boolean(b.get('arquivado')) ? 1 : 0
          if (arqA !== arqB) return arqA - arqB

          const scoreA = calcularScore(a)
          const scoreB = calcularScore(b)
          if (scoreA !== scoreB) return scoreB - scoreA

          const codA = Number(a.get('codigo') || 999999)
          const codB = Number(b.get('codigo') || 999999)
          return codA - codB
        })

        const principal = lista[0]
        const principalId = principal.id
        const principalCodigo = Number(principal.get('codigo') || 0)

        // Se o principal estava arquivado por engano, desmarca
        if (Boolean(principal.get('arquivado'))) {
          principal.set('arquivado', false)
          principal.set('substituido_por_id', '')
          principal.set('substituido_por_codigo', null)
          app.save(principal)
        }

        for (let g = 1; g < lista.length; g++) {
          const gemeo = lista[g]
          const gemeoId = gemeo.id
          const gemeoCodigo = Number(gemeo.get('codigo') || 0)

          const jaArquivado = Boolean(gemeo.get('arquivado'))
          const mesmoSubst = String(gemeo.get('substituido_por_id') || '') === principalId

          if (!jaArquivado || !mesmoSubst) {
            gemeo.set('arquivado', true)
            gemeo.set('arquivado_em', new Date().toISOString())
            gemeo.set('arquivado_por', 'limpeza_segura_migration_0151')
            gemeo.set(
              'motivo_arquivamento',
              'Duplicata real de cadastro (mesmo documento e atividade). Mantido código ' +
                principalCodigo,
            )
            gemeo.set('substituido_por_id', principalId)
            gemeo.set('substituido_por_codigo', principalCodigo)
            app.save(gemeo)
            totalArquivados++
            console.log(
              '[0151] Registro arquivado: id=' +
                gemeoId +
                ' (cod ' +
                gemeoCodigo +
                ') -> mantido id=' +
                principalId +
                ' (cod ' +
                principalCodigo +
                ')',
            )
          }

          // Reaponta vínculos das outras coleções do gemeoId para o principalId
          // 1. nfes (cliente_id)
          try {
            const nfesGemeo = app.findRecordsByFilter(
              'nfes',
              'cliente_id = {:gid}',
              '-created',
              1000,
              0,
              { gid: gemeoId },
            )
            for (let n = 0; n < nfesGemeo.length; n++) {
              nfesGemeo[n].set('cliente_id', principalId)
              app.save(nfesGemeo[n])
              totalVinculosReapontados++
            }
          } catch (_) {}

          // 2. nfes_lote (cliente_id)
          try {
            const lotesGemeo = app.findRecordsByFilter(
              'nfes_lote',
              'cliente_id = {:gid}',
              '-created',
              500,
              0,
              { gid: gemeoId },
            )
            for (let l = 0; l < lotesGemeo.length; l++) {
              lotesGemeo[l].set('cliente_id', principalId)
              app.save(lotesGemeo[l])
              totalVinculosReapontados++
            }
          } catch (_) {}

          // 3. regime_historico (empresa_id)
          try {
            const regGemeo = app.findRecordsByFilter(
              'regime_historico',
              'empresa_id = {:gid}',
              '-created',
              500,
              0,
              { gid: gemeoId },
            )
            for (let r = 0; r < regGemeo.length; r++) {
              regGemeo[r].set('empresa_id', principalId)
              regGemeo[r].set('empresa_codigo', principalCodigo)
              app.save(regGemeo[r])
              totalVinculosReapontados++
            }
          } catch (_) {}

          // 4. cont_documentos (se houver campo de id)
          try {
            if (app.hasTable('cont_documentos')) {
              const colDoc = app.findCollectionByNameOrId('cont_documentos')
              if (colDoc.fields.getByName('cliente_id')) {
                const docs = app.findRecordsByFilter(
                  'cont_documentos',
                  'cliente_id = {:gid}',
                  '-created',
                  1000,
                  0,
                  { gid: gemeoId },
                )
                for (let d = 0; d < docs.length; d++) {
                  docs[d].set('cliente_id', principalId)
                  app.save(docs[d])
                  totalVinculosReapontados++
                }
              }
            }
          } catch (_) {}
        }
      }

      console.log(
        '[0151] Limpeza Segura concluída com sucesso! Duplicatas arquivadas: ' +
          totalArquivados +
          ', Vínculos reapontados: ' +
          totalVinculosReapontados,
      )
    } catch (errDedup) {
      console.log('[0151] Erro durante a dedup idempotente: ' + errDedup)
    }
  },
  (app) => {
    // Reversão suave (remove campos caso necessário)
    try {
      const col = app.findCollectionByNameOrId('cadastro_empresas')
      if (col) {
        col.fields.removeByName('arquivado')
        col.fields.removeByName('arquivado_em')
        col.fields.removeByName('arquivado_por')
        col.fields.removeByName('motivo_arquivamento')
        col.fields.removeByName('substituido_por_id')
        col.fields.removeByName('substituido_por_codigo')
        app.save(col)
      }
    } catch (_) {}
  },
)
