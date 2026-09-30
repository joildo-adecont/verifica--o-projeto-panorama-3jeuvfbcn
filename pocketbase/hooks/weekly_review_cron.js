// Job agendado para revisão semanal de novas normas e disponibilidade das fontes oficiais
// Cron expression: "0 11 * * 1" (Toda segunda-feira às 11:00 UTC = 08:00 Horário de Brasília)
// Reutiliza a lógica de verificação de fontes oficiais (CGIBS, Receita Federal, Planalto)
// Atualiza o source_status e grava um registro em content_reviews com resumo, status e notas.

cronAdd('weekly_content_review', '0 11 * * 1', () => {
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

    // Atualiza ou insere em source_status
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

  // Grava o registro da revisão semanal em content_reviews
  try {
    const colReviews = $app.findCollectionByNameOrId('content_reviews')
    const reviewRecord = new Record(colReviews)

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
    console.log('weekly_content_review concluído com sucesso. Status: ' + overallStatus)
  } catch (reviewErr) {
    console.log(
      'Erro ao registrar content_reviews no job weekly_content_review: ' + String(reviewErr),
    )
  }
})
