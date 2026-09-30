// Rota HTTP para acionamento imediato da revisão semanal de conteúdo / teste
// POST /backend/v1/trigger-weekly-review e OPTIONS para CORS

routerAdd('OPTIONS', '/backend/v1/trigger-weekly-review', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/trigger-weekly-review', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  const sources = [
    {
      key: 'cgibs',
      name: 'CGIBS (Comitê Gestor IBS)',
      url: 'https://www.cgibs.gov.br/',
      order: 1,
    },
    {
      key: 'receita',
      name: 'Receita Federal do Brasil',
      url: 'https://www.receita.fazenda.gov.br',
      order: 2,
    },
    {
      key: 'planalto',
      name: 'Portal da Legislação (Planalto)',
      url: 'https://www.planalto.gov.br',
      order: 3,
    },
  ]

  const checkedSources = []
  let overallStatus = 'ok'
  const nowIso = new Date().toISOString()

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i]
    const startTime = new Date().getTime()
    let status = 'active'
    let httpStatus = 200
    let message = 'Fonte oficial ativa e acessível'

    try {
      const res = $http.send({
        url: src.url,
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10,
      })

      httpStatus = res.statusCode || 200

      if (httpStatus >= 200 && httpStatus < 400) {
        status = 'active'
        message = 'Fonte online e respondendo normalmente (' + httpStatus + ')'
      } else if (httpStatus === 403 || httpStatus === 401) {
        status = 'active'
        message = 'Servidor oficial ativo (proteção WAF/Gov ' + httpStatus + ')'
      } else {
        status = 'warning'
        message = 'Resposta com status HTTP ' + httpStatus
        if (overallStatus !== 'attention') {
          overallStatus = 'warning'
        }
      }
    } catch (err) {
      status = 'offline'
      httpStatus = 0
      message = 'Falha temporária de conexão: ' + String(err)
      overallStatus = 'attention'
    }

    const duration = new Date().getTime() - startTime

    try {
      let record
      try {
        record = $app.findFirstRecordByData('source_status', 'source_key', src.key)
      } catch (_) {
        const col = $app.findCollectionByNameOrId('source_status')
        record = new Record(col)
        record.set('source_key', src.key)
      }

      record.set('name', src.name)
      record.set('url', src.url)
      record.set('status', status)
      record.set('http_status', httpStatus)
      record.set('response_time_ms', duration)
      record.set('last_checked_at', nowIso)
      record.set('message', message)
      record.set('order', src.order)

      $app.save(record)
    } catch (dbErr) {
      console.log('Erro ao salvar status da fonte ' + src.key + ': ' + String(dbErr))
    }

    checkedSources.push({
      key: src.key,
      name: src.name,
      url: src.url,
      status: status,
      http_status: httpStatus,
      response_time_ms: duration,
      message: message,
    })
  }

  let reviewRecord
  try {
    const colReviews = $app.findCollectionByNameOrId('content_reviews')
    reviewRecord = new Record(colReviews)

    const notes = 'verificação semanal de novas normas — CGIBS/Receita Federal/Planalto'

    let summaryText = 'Todas as fontes oficiais responderam ativas na verificação semanal.'
    if (overallStatus === 'warning') {
      summaryText = 'Verificação semanal concluída com aviso em uma ou mais fontes.'
    } else if (overallStatus === 'attention') {
      summaryText = 'Atenção: uma ou mais fontes oficiais apresentaram falha de conexão.'
    }

    reviewRecord.set('review_date', nowIso)
    reviewRecord.set('status', overallStatus)
    reviewRecord.set('sources_checked', checkedSources)
    reviewRecord.set('notes', notes)
    reviewRecord.set('summary', summaryText)

    $app.save(reviewRecord)
  } catch (reviewErr) {
    return e.json(500, {
      success: false,
      error: 'Erro ao gravar content_reviews: ' + String(reviewErr),
    })
  }

  return e.json(200, {
    success: true,
    review: {
      id: reviewRecord.id,
      review_date: nowIso,
      status: overallStatus,
      notes: reviewRecord.getString('notes'),
      summary: reviewRecord.getString('summary'),
      sources_checked: checkedSources,
    },
  })
})
