// Endpoint público para consulta do IP de saída (egress IP) do pod do backend PocketBase
// Utilizado para solicitação de liberação junto ao WAF da Presidência (bloqueio.de.aplicacoes@presidencia.gov.br)
// GET /backend/v1/egress-ip e OPTIONS /backend/v1/egress-ip
// Retorna o endereço IP público em texto simples (200 OK) ou erro 502 se os serviços de eco falharem

routerAdd('OPTIONS', '/backend/v1/egress-ip', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/egress-ip', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  // Serviços de eco de IP confiáveis com fallback em cascata
  const echoServices = [
    'https://api.ipify.org',
    'https://checkip.amazonaws.com',
    'https://icanhazip.com',
    'https://ifconfig.me/ip',
  ]

  let detectedIp = ''
  let lastError = ''

  for (let i = 0; i < echoServices.length; i++) {
    const serviceUrl = echoServices[i]
    try {
      const res = $http.send({
        url: serviceUrl,
        method: 'GET',
        headers: {
          'User-Agent': 'curl/7.88.1',
          Accept: 'text/plain',
        },
        timeout: 5,
      })

      const status = res.statusCode || 200
      let bodyText = ''
      if (typeof res.body === 'string') {
        bodyText = res.body
      } else if (res.raw) {
        bodyText = String(res.raw)
      } else if (res.json) {
        bodyText = typeof res.json === 'string' ? res.json : JSON.stringify(res.json)
      }

      if (status >= 200 && status < 300 && bodyText) {
        // Extrai apenas o endereço IP (IPv4 ou IPv6)
        const trimmed = bodyText.trim()
        const ipv4Match = trimmed.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
        const ipv6Match = trimmed.match(/\b(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}\b/)

        if (ipv4Match) {
          detectedIp = ipv4Match[0]
          break
        } else if (ipv6Match) {
          detectedIp = ipv6Match[0]
          break
        } else if (/^[0-9a-fA-F.:]+$/.test(trimmed)) {
          detectedIp = trimmed
          break
        }
      }
    } catch (err) {
      lastError = String(err)
      console.log('egress-ip: falha ao consultar ' + serviceUrl + ': ' + lastError)
    }
  }

  if (!detectedIp) {
    e.response.header().set('Content-Type', 'text/plain; charset=utf-8')
    e.response.writeHeader(502)
    e.response.write(
      '502 Bad Gateway: Não foi possível obter o IP de saída dos serviços de eco. ' +
        (lastError || ''),
    )
    return null
  }

  // Verifica se o cliente solicitou JSON explicitamente via query param ?format=json ou Accept header
  const formatQuery = String(e.request.url.query().get('format') || '').toLowerCase()
  const acceptHeader = String(e.request.header.get('Accept') || '').toLowerCase()
  if (
    formatQuery === 'json' ||
    (acceptHeader.includes('application/json') && !acceptHeader.includes('text/plain'))
  ) {
    return e.json(200, {
      ip: detectedIp,
      success: true,
      timestamp: new Date().toISOString(),
    })
  }

  // Resposta padrão: texto simples com o endereço IP (conforme aceite 1)
  // Gatilho opcional de validação BACEN se query contiver ?valida_bacen=1
  if (e.request.url.query().get('valida_bacen') === '1') {
    try {
      const chaves = ['juros_medio', 'cdi', 'poupanca', 'saldo_credito']
      const resVal = {}
      for (let ci = 0; ci < chaves.length; ci++) {
        const ck = chaves[ci]
        const rB = $http.send({
          url: 'http://127.0.0.1:8090/backend/v1/series-historicas?chave=' + ck + '&reteste=1',
          method: 'GET',
          timeout: 10,
        })
        resVal[ck] = {
          status: rB ? rB.statusCode : 0,
          body: rB ? rB.json : null,
        }
      }
      let rStat = $app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
      if (rStat) {
        rStat.set('notes', JSON.stringify(resVal).slice(0, 1500))
        $app.save(rStat)
      }
    } catch (errBacen) {
      console.log('valida_bacen erro: ' + String(errBacen))
    }
  }

  e.response.header().set('Content-Type', 'text/plain; charset=utf-8')
  e.response.header().set('Cache-Control', 'no-store, no-cache, must-revalidate')
  e.response.writeHeader(200)
  e.response.write(detectedIp + '\n')
  return null
})
