// Rota HTTP para acionamento imediato da verificação das fontes ("Atualizar agora")
// POST /backend/v1/check-sources

routerAdd('POST', '/backend/v1/check-sources', (e) => {
  const sources = [
    {
      key: 'cgibs',
      name: 'CGIBS (Comitê Gestor IBS)',
      url: 'https://www.gov.br/consext/pt-br',
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

  const results = []

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
      }
    } catch (err) {
      status = 'offline'
      httpStatus = 0
      message = 'Falha temporária de conexão: ' + String(err)
    }

    const duration = new Date().getTime() - startTime
    const nowIso = new Date().toISOString()

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

      results.push({
        source_key: src.key,
        name: src.name,
        url: src.url,
        status: status,
        http_status: httpStatus,
        response_time_ms: duration,
        last_checked_at: nowIso,
        message: message,
      })
    } catch (dbErr) {
      results.push({
        source_key: src.key,
        error: String(dbErr),
      })
    }
  }

  return e.json(200, {
    success: true,
    sources: results,
    timestamp: new Date().toISOString(),
  })
})
