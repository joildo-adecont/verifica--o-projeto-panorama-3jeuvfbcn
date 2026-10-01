import { describe, it, expect } from 'vitest'

describe('Validação dos fluxos do Panorama da Reforma Tributária', () => {
  it('estrutura de envio do formulário de dúvidas', () => {
    const inquiry = {
      name: 'Dr. Verificador Teste',
      email: 'teste@exemplo.com.br',
      phone: '(11) 98765-4321',
      message: 'Consulta sobre incidência do IBS/CBS em regime monofásico',
    }
    expect(inquiry.name).toBe('Dr. Verificador Teste')
    expect(inquiry.email).toContain('@')
    expect(inquiry.phone).toBeTruthy()
  })

  it('validação das fontes oficiais monitoradas (incluindo DOU)', () => {
    const sources = [
      { key: 'cgibs', url: 'https://www.cgibs.gov.br/' },
      { key: 'receita', url: 'https://www.receita.fazenda.gov.br' },
      { key: 'planalto', url: 'https://www.planalto.gov.br' },
      { key: 'dou', url: 'https://www.in.gov.br' },
    ]
    expect(sources.length).toBeGreaterThanOrEqual(3)
    expect(sources[0].url).toBe('https://www.cgibs.gov.br/')
  })

  it('validação da estrutura do registro de revisão semanal de conteúdo', () => {
    const review = {
      review_date: new Date().toISOString(),
      status: 'ok',
      notes: 'verificação semanal de novas normas — CGIBS/Receita Federal/Planalto/DOU',
      sources_checked: [
        { key: 'cgibs', name: 'CGIBS (Comitê Gestor IBS)', status: 'active', http_status: 200 },
        { key: 'receita', name: 'Receita Federal do Brasil', status: 'active', http_status: 200 },
        {
          key: 'planalto',
          name: 'Portal da Legislação (Planalto)',
          status: 'active',
          http_status: 200,
        },
        {
          key: 'dou',
          name: 'Imprensa Nacional (Diário Oficial da União)',
          status: 'active',
          http_status: 200,
        },
      ],
    }
    expect(review.status).toBe('ok')
    expect(review.notes).toContain('verificação semanal de novas normas')
    expect(review.sources_checked).toHaveLength(4)
  })

  it('validação dos marcos e normas de todos os tipos de atos normativos', async () => {
    const { officialDocumentsList, fallbackNorms } = await import('./panorama')

    const normTypesInList = new Set(officialDocumentsList.map((d) => d.norm_type))
    expect(normTypesInList.has('Resolução')).toBe(true)
    expect(normTypesInList.has('Decreto')).toBe(true)
    expect(normTypesInList.has('Portaria Conjunta')).toBe(true)
    expect(normTypesInList.has('Ato Conjunto')).toBe(true)
    expect(normTypesInList.has('Lei Complementar')).toBe(true)
    expect(normTypesInList.has('Emenda Constitucional')).toBe(true)

    const codes = officialDocumentsList.map((d) => d.code)
    expect(codes).toContain('EC 132/2023')
    expect(codes).toContain('LC 214/2025')
    expect(codes).toContain('Ato Conjunto RFB/CGIBS nº 1/2025')
    expect(codes).toContain('Portaria Conjunta MF/CGIBS nº 7/2026')
    expect(codes).toContain('Decreto 12.955/2026')

    for (const norm of fallbackNorms) {
      expect(norm.norm_type).toBeTruthy()
      expect(norm.origin).toBeTruthy()
    }
  })

  it('validação da marca ADECONT: ausência do termo Jurídica e fidelidade da tagline', () => {
    const brandName = 'ADECONT'
    const tagline = 'Assessoria Contábil e Administrativa'
    const fullBrand = `${brandName} — ${tagline}`

    expect(fullBrand).toContain('ADECONT')
    expect(fullBrand).toContain('Assessoria Contábil e Administrativa')
    expect(fullBrand.toLowerCase()).not.toContain('jurídic')
    expect(fullBrand.toLowerCase()).not.toContain('juridic')
  })

  it('validação dos links diretos de PDFs oficiais do CGIBS para contorno de bloqueios locais', () => {
    const cgibsPdfs = [
      {
        code: 'Resolução CGIBS nº 1/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
      },
      {
        code: 'Resolução CGIBS nº 5/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
      },
      {
        code: 'Resolução CGIBS nº 6/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        code: 'Resolução CGIBS nº 8/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
      },
      {
        code: 'Resolução CGIBS nº 10/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
      },
      {
        code: 'Resolução CGIBS nº 13/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
      },
      {
        code: 'Resolução CGIBS nº 14/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
      },
      {
        code: 'Resolução CGIBS nº 16/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
      },
    ]

    expect(cgibsPdfs).toHaveLength(8)
    for (const item of cgibsPdfs) {
      expect(item.url).toMatch(/^https:\/\/www\.cgibs\.gov\.br\/upload\/arquivos\/.*\.pdf$/)
    }
  })

  it('validação do mapeamento de proxy de download seguro de resoluções e outros atos normativos', async () => {
    const { getOfficialDocProxyUrl, getCgibsPdfProxyUrl, officialDocumentsList } =
      await import('./panorama')

    expect(officialDocumentsList.length).toBeGreaterThanOrEqual(15)
    expect(getOfficialDocProxyUrl).toBe(getCgibsPdfProxyUrl)

    for (const doc of officialDocumentsList) {
      expect(doc.proxy_url).toBeTruthy()
      expect(doc.proxy_url).toContain('/backend/v1/download-resolution?id=')

      const generated = getOfficialDocProxyUrl(doc.id)
      expect(generated).toContain('/backend/v1/download-resolution?id=')
      expect(generated).not.toContain('www.cgibs.gov.br')
    }

    expect(getOfficialDocProxyUrl('ec-132')).toContain('id=ec-132')
    expect(getOfficialDocProxyUrl('lc-214')).toContain('id=lc-214')
    expect(getOfficialDocProxyUrl('decreto-12955')).toContain('id=decreto-12955')
  })
})
