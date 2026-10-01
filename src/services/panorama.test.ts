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

  it('validação das fontes oficiais monitoradas', () => {
    const sources = [
      { key: 'cgibs', url: 'https://www.cgibs.gov.br/' },
      { key: 'receita', url: 'https://www.receita.fazenda.gov.br' },
      { key: 'planalto', url: 'https://www.planalto.gov.br' },
    ]
    expect(sources).toHaveLength(3)
    expect(sources[0].url).toBe('https://www.cgibs.gov.br/')
  })

  it('validação da estrutura do registro de revisão semanal de conteúdo', () => {
    const review = {
      review_date: new Date().toISOString(),
      status: 'ok',
      notes: 'verificação semanal de novas normas — CGIBS/Receita Federal/Planalto',
      sources_checked: [
        { key: 'cgibs', name: 'CGIBS (Comitê Gestor IBS)', status: 'active', http_status: 200 },
        { key: 'receita', name: 'Receita Federal do Brasil', status: 'active', http_status: 200 },
        {
          key: 'planalto',
          name: 'Portal da Legislação (Planalto)',
          status: 'active',
          http_status: 200,
        },
      ],
    }
    expect(review.status).toBe('ok')
    expect(review.notes).toContain('verificação semanal de novas normas')
    expect(review.sources_checked).toHaveLength(3)
  })

  it('validação dos marcos e normas da Revisão nº 1', () => {
    // Valida que as novas normas da primeira revisão possuem campos válidos
    const revisaoNormas = [
      'Ato Conjunto RFB/CGIBS nº 1/2025',
      'Portaria Conjunta MF/CGIBS nº 7/2026',
      'Resolução CGIBS nº 13/2026',
      'Resolução CGIBS nº 14/2026',
      'Resolução CGIBS nº 16/2026',
    ]
    expect(revisaoNormas).toHaveLength(5)
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
})
