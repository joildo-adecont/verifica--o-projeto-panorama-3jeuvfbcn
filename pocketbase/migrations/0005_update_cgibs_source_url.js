// Migration 0005: Atualiza URL oficial da fonte CGIBS em source_status
// Corrige a URL antiga (gov.br/consext/pt-br) para https://www.cgibs.gov.br/
// e define o status da fonte como 'active'

migrate(
  (app) => {
    try {
      const record = app.findFirstRecordByData('source_status', 'source_key', 'cgibs')
      record.set('url', 'https://www.cgibs.gov.br/')
      record.set('status', 'active')
      record.set('http_status', 200)
      record.set('message', 'Fonte oficial ativa e acessível (CGIBS)')
      record.set('last_checked_at', new Date().toISOString())
      app.save(record)
    } catch (err) {
      console.log('Registro cgibs não encontrado em source_status:', err)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('source_status', 'source_key', 'cgibs')
      record.set('url', 'https://www.gov.br/consext/pt-br')
      app.save(record)
    } catch (_) {}
  },
)
