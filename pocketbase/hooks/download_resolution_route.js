// Endpoint de Proxy para Download Seguro de PDFs Oficiais do CGIBS
// GET /backend/v1/download-resolution?id=1 (ou ?id=doc-cgibs-1 ou ?id=norm-9 ou ?number=1 ou ?code=Resolução CGIBS nº 1/2026)
// OPTIONS /backend/v1/download-resolution

routerAdd('OPTIONS', '/backend/v1/download-resolution', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/download-resolution', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  // 1. Identificar o identificador / número da Resolução
  const query = e.requestInfo().query || {}
  const rawId = String(query.id || query.number || query.code || query.res || '').trim()

  if (!rawId) {
    return e.json(400, {
      success: false,
      error: 'Parâmetro "id" ou "number" da Resolução não informado.',
    })
  }

  // Tabela canônica de resoluções com URLs oficiais e nomes padronizados de arquivo
  const staticMap = {
    1: {
      number: '1',
      code: 'Resolução CGIBS nº 1/2026',
      filename: 'Resolucao-CGIBS-01-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
    },
    5: {
      number: '5',
      code: 'Resolução CGIBS nº 5/2026',
      filename: 'Resolucao-CGIBS-05-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
    },
    6: {
      number: '6',
      code: 'Resolução CGIBS nº 6/2026',
      filename: 'Resolucao-CGIBS-06-2026-Regulamento-IBS.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
    8: {
      number: '8',
      code: 'Resolução CGIBS nº 8/2026',
      filename: 'Resolucao-CGIBS-08-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
    },
    10: {
      number: '10',
      code: 'Resolução CGIBS nº 10/2026',
      filename: 'Resolucao-CGIBS-10-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
    },
    13: {
      number: '13',
      code: 'Resolução CGIBS nº 13/2026',
      filename: 'Resolucao-CGIBS-13-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
    },
    14: {
      number: '14',
      code: 'Resolução CGIBS nº 14/2026',
      filename: 'Resolucao-CGIBS-14-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
    },
    16: {
      number: '16',
      code: 'Resolução CGIBS nº 16/2026',
      filename: 'Resolucao-CGIBS-16-2026.pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
    },
  }

  // Extrair número caso receba "doc-cgibs-1", "1", "01", "norm-9", "Resolução CGIBS nº 6/2026", etc.
  let matchedNum = ''
  let targetUrl = ''
  let customFilename = ''

  const lowerRaw = rawId.toLowerCase()
  if (lowerRaw.includes('doc-cgibs-')) {
    matchedNum = lowerRaw.replace('doc-cgibs-', '')
  } else if (/^\d+$/.test(rawId)) {
    matchedNum = String(parseInt(rawId, 10))
  } else {
    const m = rawId.match(/(\d+)/)
    if (m) {
      const extracted = String(parseInt(m[1], 10))
      if (staticMap[extracted]) {
        matchedNum = extracted
      }
    }
  }

  // 2. Tentar buscar da coleção tax_norms no banco primeiro (fonte de verdade viva)
  try {
    let normRecord = null
    try {
      normRecord = $app.findRecordById('tax_norms', rawId)
    } catch (_) {}

    if (!normRecord) {
      let filterExp = ''
      if (matchedNum) {
        filterExp =
          "code ~ '" +
          matchedNum +
          "/2026' || code ~ 'nº " +
          matchedNum +
          "' || code ~ 'n° " +
          matchedNum +
          "'"
      } else {
        filterExp = "code ~ '" + rawId + "'"
      }
      const records = $app.findRecordsByFilter('tax_norms', filterExp, 'order', 1, 0)
      if (records && records.length > 0) {
        normRecord = records[0]
      }
    }

    if (normRecord) {
      const dbUrl = normRecord.getString('link_url')
      if (dbUrl && dbUrl.includes('cgibs.gov.br') && dbUrl.endsWith('.pdf')) {
        targetUrl = dbUrl
        const codeText = normRecord.getString('code') || ''
        const codeNumMatch = codeText.match(/(\d+)/)
        const codeNum = codeNumMatch ? codeNumMatch[1] : matchedNum || 'doc'
        const paddedNum = codeNum.length === 1 ? '0' + codeNum : codeNum
        customFilename = 'Resolucao-CGIBS-' + paddedNum + '-2026.pdf'
      }
    }
  } catch (err) {
    console.warn('download-resolution: falha ao buscar no banco tax_norms:', String(err))
  }

  // Se não obteve do banco, recorrer ao staticMap
  if (!targetUrl && matchedNum && staticMap[matchedNum]) {
    targetUrl = staticMap[matchedNum].url
    customFilename = staticMap[matchedNum].filename
  }

  if (!targetUrl) {
    return e.json(404, {
      success: false,
      error: 'Resolução CGIBS ou documento PDF não localizado para o identificador: ' + rawId,
    })
  }

  // 3. Fazer download server-side do PDF a partir da URL oficial do CGIBS
  const filename = customFilename || 'Resolucao-CGIBS.pdf'
  e.response.header().set('Content-Type', 'application/pdf')
  e.response.header().set('Content-Disposition', 'attachment; filename="' + filename + '"')
  e.response.header().set('Cache-Control', 'public, max-age=86400')

  // Tentativa primária: $filesystem.fileFromURL -> e.stream
  try {
    const downloadedFile = $filesystem.fileFromURL(targetUrl, 15)
    if (downloadedFile && downloadedFile.reader) {
      return e.stream(200, 'application/pdf', downloadedFile.reader)
    }
  } catch (fsErr) {
    console.warn('fileFromURL não pôde ser transmitido diretamente:', String(fsErr))
  }

  // Fallback secundário: $http.send -> e.blob ou manual write
  try {
    const res = $http.send({
      url: targetUrl,
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/pdf,application/octet-stream,*/*;q=0.8',
        Referer: 'https://www.cgibs.gov.br/',
      },
      timeout: 15,
    })

    const status = res.statusCode || 200
    if (status < 200 || status >= 300) {
      return e.json(502, {
        success: false,
        error: 'Servidor oficial do CGIBS retornou status HTTP ' + status,
        targetUrl: targetUrl,
      })
    }

    const payload = res.body || res.raw
    try {
      return e.blob(200, 'application/pdf', payload)
    } catch (_) {
      e.response.writeHeader(200)
      e.response.write(payload)
      return null
    }
  } catch (err) {
    console.error('download-resolution: falha ao buscar PDF:', String(err))
    return e.json(504, {
      success: false,
      error: 'Falha ou tempo esgotado ao buscar o PDF no servidor oficial: ' + String(err),
      targetUrl: targetUrl,
    })
  }
})
