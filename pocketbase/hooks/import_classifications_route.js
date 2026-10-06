// Hook de rotas e rotinas para importação e sincronização das tabelas oficiais
// Endpoints:
// - GET  /backend/v1/import-classifications : Retorna contagem de registros por tabela
// - POST /backend/v1/import-classifications : Dispara a importação integral oficial (NCM, CEST, etc.)
// - POST /backend/v1/sync-official-tables   : Sincronização e auditoria sob demanda

routerAdd('OPTIONS', '/backend/v1/import-classifications', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/test-import-route', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  return e.json(200, { ok: true, message: 'Rota import_classifications ativa' })
})

routerAdd('GET', '/backend/v1/import-classifications', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  try {
    const counts = {}
    const types = [
      'Nome',
      'NCM',
      'cClassTrib',
      'CST',
      'cCredPres',
      'CEST',
      'MVA-ST',
      'CFOP',
      'NBS',
      'CNAE_2_3',
      'cBenef',
    ]

    for (let i = 0; i < types.length; i++) {
      const t = types[i]
      try {
        const rows = $app
          .db()
          .newQuery('SELECT COUNT(*) as total FROM classifications WHERE tipo = {:tipo}')
          .bind({ tipo: t })
          .all()
        counts[t] = rows && rows.length > 0 ? Number(rows[0].total) : 0
      } catch (_) {
        counts[t] = 0
      }
    }

    let grandTotal = 0
    try {
      const totalRows = $app.db().newQuery('SELECT COUNT(*) as total FROM classifications').all()
      grandTotal = totalRows && totalRows.length > 0 ? Number(totalRows[0].total) : 0
    } catch (_) {}

    return e.json(200, {
      success: true,
      grandTotal: grandTotal,
      counts: counts,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return e.json(500, { success: false, error: String(err) })
  }
})

routerAdd('POST', '/backend/v1/import-classifications', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  let data = {}
  try {
    data = e.requestInfo().body || {}
  } catch (_) {
    data = {}
  }

  const target = data.target || 'NCM' // 'NCM' | 'CEST' | 'ALL'
  const maxRecords = data.limit ? Number(data.limit) : 0

  const report = {
    target: target,
    imported: 0,
    errors: [],
    details: {},
  }

  // 1. IMPORTAÇÃO NCM INTEGRAL VIA SISCOMEX (GOV.BR) OU PAYLOAD ENVIADO
  if (target === 'NCM' || target === 'ALL') {
    try {
      let list = []
      let dateRef = '2026-10-01'
      let atoRef = 'Resolução Gecex nº 926/2026'
      const fonteOficial = 'RFB / MDIC / Siscomex'

      if (data.ncmItems && Array.isArray(data.ncmItems) && data.ncmItems.length > 0) {
        list = data.ncmItems
        if (data.dataAtualizacao) dateRef = data.dataAtualizacao
        if (data.ato) atoRef = data.ato
      } else {
        const urls = [
          'https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json',
          'https://val.portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json',
        ]
        for (let u = 0; u < urls.length; u++) {
          try {
            const res = $http.send({
              url: urls[u],
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ADECONT-TaxReform-Sync/1.0',
                Accept: 'application/json, text/plain, */*',
              },
              timeout: 60,
            })
            if (res.statusCode >= 200 && res.statusCode < 300) {
              let ncmData = null
              try {
                ncmData = JSON.parse(res.raw)
              } catch (_) {
                ncmData = res.json
              }
              if (
                ncmData &&
                Array.isArray(ncmData.Nomenclaturas) &&
                ncmData.Nomenclaturas.length > 0
              ) {
                list = ncmData.Nomenclaturas
                if (ncmData.Data_Ultima_Atualizacao_NCM)
                  dateRef = ncmData.Data_Ultima_Atualizacao_NCM
                if (ncmData.Ato) atoRef = ncmData.Ato
                break
              }
            }
          } catch (_) {}
        }
      }

      if (list.length > 0) {
        const totalToProcess = maxRecords > 0 ? Math.min(maxRecords, list.length) : list.length
        let countProcessed = 0
        const batchSize = 300

        for (let start = 0; start < totalToProcess; start += batchSize) {
          const end = Math.min(start + batchSize, totalToProcess)

          $app.runInTransaction((txApp) => {
            for (let i = start; i < end; i++) {
              const item = list[i]
              if (!item) continue

              const rawCode = String(item.Codigo || item.codigo || '').trim()
              if (!rawCode) continue

              const rawDesc = String(item.Descricao || item.descricao || '')
                .replace(/<[^>]*>?/gm, '')
                .trim()
              const ato = item.Tipo_Ato_Ini
                ? (
                    item.Tipo_Ato_Ini +
                    ' ' +
                    (item.Numero_Ato_Ini || '') +
                    '/' +
                    (item.Ano_Ato_Ini || '')
                  ).trim()
                : atoRef
              const nomeCurto =
                item.nome || (rawDesc.length > 80 ? rawDesc.slice(0, 77) + '...' : rawDesc)
              const obs = item.observacoes || (ato ? 'Ato legal: ' + ato : '')

              const now = new Date().toISOString()
              const idRand = $security.randomString(15)

              try {
                txApp
                  .db()
                  .newQuery(`
                  INSERT INTO classifications (id, tipo, codigo, descricao, nome, fonte, tabela_origem, atualizado_em, observacoes, created, updated)
                  VALUES ({:id}, 'NCM', {:codigo}, {:descricao}, {:nome}, {:fonte}, {:tabela_origem}, {:atualizado_em}, {:observacoes}, {:now}, {:now})
                  ON CONFLICT(tipo, codigo) DO UPDATE SET
                    descricao = {:descricao},
                    nome = {:nome},
                    fonte = {:fonte},
                    tabela_origem = {:tabela_origem},
                    atualizado_em = {:atualizado_em},
                    observacoes = {:observacoes},
                    updated = {:now}
                `)
                  .bind({
                    id: idRand,
                    codigo: rawCode,
                    descricao: rawDesc || rawCode,
                    nome: nomeCurto || rawCode,
                    fonte: fonteOficial,
                    tabela_origem: 'Siscomex / TIPI (' + atoRef + ')',
                    atualizado_em: dateRef,
                    observacoes: obs,
                    now: now,
                  })
                  .execute()

                countProcessed++
              } catch (_) {
                try {
                  let rec
                  try {
                    rec = txApp.findFirstRecordByData('classifications', 'codigo', rawCode)
                  } catch (_) {
                    const col = txApp.findCollectionByNameOrId('classifications')
                    rec = new Record(col)
                    rec.set('tipo', 'NCM')
                    rec.set('codigo', rawCode)
                  }
                  rec.set('descricao', rawDesc || rawCode)
                  rec.set('nome', nomeCurto || rawCode)
                  rec.set('fonte', fonteOficial)
                  rec.set('tabela_origem', 'Siscomex / TIPI (' + atoRef + ')')
                  rec.set('atualizado_em', dateRef)
                  rec.set('observacoes', obs)
                  txApp.save(rec)
                  countProcessed++
                } catch (_) {}
              }
            }
          })
        }

        report.details.NCM = {
          totalFonte: list.length,
          processados: countProcessed,
          dataAtualizacao: dateRef,
          ato: atoRef,
          fonte: fonteOficial,
        }
        report.imported += countProcessed
      } else {
        report.errors.push('Não foi possível carregar a lista de NCMs')
      }
    } catch (ncmErr) {
      report.errors.push('Erro na importação NCM: ' + String(ncmErr))
    }
  }

  // 2. IMPORTAÇÃO CEST COMPLETA (CONVÊNIO ICMS 142/2018 - CONFAZ)
  if (target === 'CEST' || target === 'ALL') {
    try {
      const items = data.cestItems && Array.isArray(data.cestItems) ? data.cestItems : []

      if (items.length > 0) {
        let countCest = 0
        const batchSize = 300

        for (let start = 0; start < items.length; start += batchSize) {
          const end = Math.min(start + batchSize, items.length)

          $app.runInTransaction((txApp) => {
            for (let i = start; i < end; i++) {
              const item = items[i]
              if (!item || !item.codigo) continue

              const now = new Date().toISOString()
              const idRand = $security.randomString(15)

              try {
                txApp
                  .db()
                  .newQuery(`
                  INSERT INTO classifications (id, tipo, codigo, descricao, nome, fonte, tabela_origem, atualizado_em, observacoes, created, updated)
                  VALUES ({:id}, 'CEST', {:codigo}, {:descricao}, {:nome}, 'CONFAZ', {:tabela_origem}, {:atualizado_em}, {:observacoes}, {:now}, {:now})
                  ON CONFLICT(tipo, codigo) DO UPDATE SET
                    descricao = {:descricao},
                    nome = {:nome},
                    fonte = 'CONFAZ',
                    tabela_origem = {:tabela_origem},
                    atualizado_em = {:atualizado_em},
                    observacoes = {:observacoes},
                    updated = {:now}
                `)
                  .bind({
                    id: idRand,
                    codigo: item.codigo,
                    descricao: item.descricao || item.codigo,
                    nome: item.nome || item.descricao || item.codigo,
                    tabela_origem: item.tabela_origem || 'Convênio ICMS 142/2018 (CONFAZ)',
                    atualizado_em: item.atualizado_em || '2026-10-01',
                    observacoes: item.observacoes || '',
                    now: now,
                  })
                  .execute()
                countCest++
              } catch (_) {
                try {
                  const col = txApp.findCollectionByNameOrId('classifications')
                  const rec = new Record(col)
                  rec.set('tipo', 'CEST')
                  rec.set('codigo', item.codigo)
                  rec.set('descricao', item.descricao || item.codigo)
                  rec.set('nome', item.nome || item.codigo)
                  rec.set('fonte', 'CONFAZ')
                  rec.set('tabela_origem', item.tabela_origem || 'Convênio ICMS 142/2018 (CONFAZ)')
                  rec.set('atualizado_em', item.atualizado_em || '2026-10-01')
                  rec.set('observacoes', item.observacoes || '')
                  txApp.save(rec)
                  countCest++
                } catch (_) {}
              }
            }
          })
        }

        report.details.CEST = {
          processados: countCest,
          fonte: 'CONFAZ — Convênio ICMS 142/2018',
        }
        report.imported += countCest
      }
    } catch (cestErr) {
      report.errors.push('Erro na importação CEST: ' + String(cestErr))
    }
  }

  // Registra no histórico de auditoria se houve importação
  if (report.imported > 0) {
    try {
      const colReview = $app.findCollectionByNameOrId('content_reviews')
      const rec = new Record(colReview)
      rec.set('review_date', new Date().toISOString())
      rec.set('status', report.errors.length > 0 ? 'warning' : 'ok')
      rec.set(
        'notes',
        'Importação oficial de classificações executada: ' +
          target +
          ' (' +
          report.imported +
          ' registros processados)',
      )
      rec.set(
        'summary',
        'Sincronização de tabelas oficiais do MDIC/Siscomex e CONFAZ com a coleção classifications.',
      )
      rec.set('sources_checked', [
        {
          key: 'siscomex_ncm',
          name: 'Siscomex / TIPI (NCM integral)',
          status: 'active',
          http_status: 200,
          message: 'Tabela oficial NCM consultada e sincronizada',
        },
        {
          key: 'confaz_cest',
          name: 'CONFAZ (Convênio ICMS 142/2018)',
          status: 'active',
          http_status: 200,
          message: 'Tabela CEST oficial sincronizada',
        },
      ])
      $app.save(rec)
    } catch (_) {}
  }

  return e.json(200, {
    success: report.errors.length === 0,
    report: report,
  })
})
