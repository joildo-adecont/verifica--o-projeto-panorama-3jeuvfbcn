// Endpoint de Proxy para Download Seguro de Documentos Oficiais da Reforma Tributária
// (Resoluções CGIBS, Leis, Decretos, Portarias, Atos Conjuntos, Emendas Constitucionais)
// Mantém rota GET /backend/v1/download-resolution por retrocompatibilidade e atende a todos os atos normativos
// Aceita query params: ?id=..., ?number=..., ?code=..., ?type=...
// Exemplos aceitos:
// - ?id=1, ?id=doc-cgibs-6, ?id=6
// - ?id=ec-132, ?id=ec-132-2023, ?id=norm-1
// - ?id=lc-214, ?id=lc-214-2025, ?id=lc-227
// - ?id=decreto-12955, ?id=d12955
// - ?id=ato-conjunto-1, ?id=ato-conjunto-rfb-cgibs-1-2025
// - ?id=portaria-conjunta-7, ?id=portaria-mf-cgibs-7-2026
// - ?id=<recordId no tax_norms>

routerAdd('OPTIONS', '/backend/v1/download-resolution', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/download-resolution', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  // 1. Identificar o identificador / número do ato normativo
  const rawId = String(
    e.request.url.query().get('id') ||
      e.request.url.query().get('number') ||
      e.request.url.query().get('code') ||
      e.request.url.query().get('res') ||
      '',
  ).trim()

  if (!rawId) {
    return e.json(400, {
      success: false,
      error: 'Parâmetro "id" ou "code" do ato normativo não informado.',
    })
  }

  // Tabela canônica de documentos conhecidos com URLs oficiais e nomes padronizados de arquivo
  const canonicalDocs = {
    // Resoluções CGIBS (1, 5, 6, 8, 10, 13, 14, 16)
    1: {
      code: 'Resolução CGIBS nº 1/2026',
      filename: 'Resolucao-CGIBS-01-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
    },
    5: {
      code: 'Resolução CGIBS nº 5/2026',
      filename: 'Resolucao-CGIBS-05-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
    },
    6: {
      code: 'Resolução CGIBS nº 6/2026',
      filename: 'Resolucao-CGIBS-06-2026-Regulamento-IBS.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
    8: {
      code: 'Resolução CGIBS nº 8/2026',
      filename: 'Resolucao-CGIBS-08-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
    },
    10: {
      code: 'Resolução CGIBS nº 10/2026',
      filename: 'Resolucao-CGIBS-10-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
    },
    13: {
      code: 'Resolução CGIBS nº 13/2026',
      filename: 'Resolucao-CGIBS-13-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
    },
    14: {
      code: 'Resolução CGIBS nº 14/2026',
      filename: 'Resolucao-CGIBS-14-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
    },
    16: {
      code: 'Resolução CGIBS nº 16/2026',
      filename: 'Resolucao-CGIBS-16-2026.pdf',
      contentType: 'application/pdf',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
    },
    // Atos do Planalto e DOU (Emendas, Leis, Decretos, Portarias e Atos Conjuntos)
    'ec-132': {
      code: 'EC 132/2023',
      filename: 'Emenda-Constitucional-132-2023-Planalto.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
    },
    'lc-214': {
      code: 'LC 214/2025',
      filename: 'Lei-Complementar-214-2025-Planalto.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
    'lc-227': {
      code: 'LC 227/2026',
      filename: 'Lei-Complementar-227-2026-Planalto.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
    },
    'decreto-12955': {
      code: 'Decreto 12.955/2026',
      filename: 'Decreto-12955-2026-Regulamento-CBS.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12955.htm',
    },
    'ato-conjunto-1': {
      code: 'Ato Conjunto RFB/CGIBS nº 1/2025',
      filename: 'Ato-Conjunto-RFB-CGIBS-01-2025-DOU.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.in.gov.br/web/dou/-/ato-conjunto-rfb/cgibs-n-1-de-22-de-dezembro-de-2025-677624586',
    },
    'portaria-conjunta-7': {
      code: 'Portaria Conjunta MF/CGIBS nº 7/2026',
      filename: 'Portaria-Conjunta-MF-CGIBS-07-2026-DOU.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.in.gov.br/web/dou/-/portaria-conjunta-mf/cgibs-n-7-de-30-de-abril-de-2026-702822417',
    },
    'ato-conjunto-4': {
      code: 'Ato Conjunto RFB/CGIBS 4/2026',
      filename: 'Ato-Conjunto-RFB-CGIBS-04-2026-DOU.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.in.gov.br/web/dou/-/ato-conjunto-rfb/cgibs-n-4-de-30-de-julho-de-2026-722697172',
    },
    'resolucao-cgsn-190': {
      code: 'Resolução CGSN 190/2026',
      filename: 'Resolucao-CGSN-190-2026-DOU.html',
      contentType: 'text/html; charset=utf-8',
      url: 'https://www.in.gov.br/web/dou/-/resolucao-cgsn-n-190-de-4-de-agosto-de-2026-724454118',
    },
  }

  let matchedKey = ''
  let targetUrl = ''
  let customFilename = ''
  let contentType = 'application/pdf'

  const lowerRaw = rawId.toLowerCase()

  // Mapeamentos comuns de alias
  if (lowerRaw.includes('doc-cgibs-')) {
    matchedKey = lowerRaw.replace('doc-cgibs-', '')
  } else if (
    lowerRaw.includes('ec-132') ||
    lowerRaw.includes('ec132') ||
    lowerRaw.includes('emc132') ||
    lowerRaw.includes('emenda-132')
  ) {
    matchedKey = 'ec-132'
  } else if (
    lowerRaw.includes('lc-214') ||
    lowerRaw.includes('lc214') ||
    lowerRaw.includes('lcp214')
  ) {
    matchedKey = 'lc-214'
  } else if (
    lowerRaw.includes('lc-227') ||
    lowerRaw.includes('lc227') ||
    lowerRaw.includes('lcp227')
  ) {
    matchedKey = 'lc-227'
  } else if (
    lowerRaw.includes('12955') ||
    lowerRaw.includes('12.955') ||
    lowerRaw.includes('decreto')
  ) {
    matchedKey = 'decreto-12955'
  } else if (lowerRaw.includes('portaria') && lowerRaw.includes('7')) {
    matchedKey = 'portaria-conjunta-7'
  } else if (
    lowerRaw.includes('ato') &&
    (lowerRaw.includes('1/2025') ||
      lowerRaw.includes('1-2025') ||
      lowerRaw === 'ato-1' ||
      lowerRaw === 'ato-conjunto-1')
  ) {
    matchedKey = 'ato-conjunto-1'
  } else if (
    lowerRaw.includes('ato') &&
    (lowerRaw.includes('4/2026') ||
      lowerRaw.includes('4-2026') ||
      lowerRaw === 'ato-4' ||
      lowerRaw === 'ato-conjunto-4')
  ) {
    matchedKey = 'ato-conjunto-4'
  } else if (lowerRaw.includes('cgsn') || lowerRaw.includes('190')) {
    matchedKey = 'resolucao-cgsn-190'
  } else if (/^\d+$/.test(rawId)) {
    matchedKey = String(parseInt(rawId, 10))
  } else {
    // Tenta match numérico para resoluções CGIBS (ex.: "Resolução CGIBS 6/2026")
    const m = rawId.match(/(\d+)/)
    if (m && canonicalDocs[String(parseInt(m[1], 10))]) {
      matchedKey = String(parseInt(m[1], 10))
    }
  }

  if (matchedKey && canonicalDocs[matchedKey]) {
    targetUrl = canonicalDocs[matchedKey].url
    customFilename = canonicalDocs[matchedKey].filename
    contentType = canonicalDocs[matchedKey].contentType || 'application/pdf'
  }

  // 2. Tentar buscar da coleção tax_norms no banco
  try {
    let normRecord = null
    try {
      normRecord = $app.findRecordById('tax_norms', rawId)
    } catch (_) {}

    if (!normRecord) {
      let filterExp = ''
      if (matchedKey && /^\d+$/.test(matchedKey)) {
        filterExp =
          "code ~ '" +
          matchedKey +
          "/2026' || code ~ 'nº " +
          matchedKey +
          "' || code ~ 'n° " +
          matchedKey +
          "'"
      } else {
        filterExp = "code ~ '" + rawId + "' || id = '" + rawId + "'"
      }

      const records = $app.findRecordsByFilter('tax_norms', filterExp, 'order', 1, 0)
      if (records && records.length > 0) {
        normRecord = records[0]
      }
    }

    if (normRecord) {
      const dbUrl = normRecord.getString('link_url')
      if (dbUrl && (dbUrl.startsWith('http://') || dbUrl.startsWith('https://'))) {
        targetUrl = dbUrl
        const codeText = normRecord.getString('code') || 'documento'
        const safeCode = codeText.replace(/[^a-zA-Z0-9]/g, '-')

        if (dbUrl.toLowerCase().endsWith('.pdf')) {
          contentType = 'application/pdf'
          customFilename = safeCode + '.pdf'
        } else {
          contentType = 'text/html; charset=utf-8'
          customFilename = safeCode + '.html'
        }
      }
    }
  } catch (err) {
    console.log('download-resolution: falha ao buscar no banco tax_norms: ' + String(err))
  }

  if (!targetUrl) {
    return e.json(404, {
      success: false,
      error: 'Documento ou ato normativo oficial não localizado para o identificador: ' + rawId,
    })
  }

  // 3. Fazer mediação server-side do documento oficial
  // O servidor busca o documento na fonte oficial e entrega pelo domínio próprio com Content-Disposition
  const filename =
    customFilename ||
    (contentType.includes('pdf') ? 'documento-oficial.pdf' : 'documento-oficial.html')

  e.response.header().set('Content-Type', contentType)
  e.response.header().set('Content-Disposition', 'attachment; filename="' + filename + '"')
  e.response.header().set('Cache-Control', 'public, max-age=86400')

  try {
    let referer = 'https://www.planalto.gov.br/'
    if (targetUrl.includes('cgibs.gov.br')) {
      referer = 'https://www.cgibs.gov.br/'
    } else if (targetUrl.includes('in.gov.br')) {
      referer = 'https://www.in.gov.br/'
    }

    const res = $http.send({
      url: targetUrl,
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: referer,
      },
      timeout: 15,
    })

    const status = res.statusCode || 200
    if (status < 200 || status >= 400) {
      return e.json(502, {
        success: false,
        error: 'Servidor oficial retornou status HTTP ' + status,
        targetUrl: targetUrl,
      })
    }

    const payload = res.body || res.raw
    try {
      return e.blob(200, contentType, payload)
    } catch (_) {
      e.response.writeHeader(200)
      e.response.write(payload)
      return null
    }
  } catch (err) {
    console.log('download-resolution: falha ao intermediar download: ' + String(err))
    return e.json(504, {
      success: false,
      error: 'Falha ou tempo esgotado ao buscar o documento no servidor oficial: ' + String(err),
      targetUrl: targetUrl,
    })
  }
})
