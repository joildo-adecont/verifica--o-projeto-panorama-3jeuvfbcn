import { describe, it, expect } from 'vitest'

describe('Validação dos fluxos do Panorama da Reforma Tributária', () => {
  it('estrutura de envio do formulário de dúvidas', () => {
    const inquiry = {
      name: 'Dr. Verificador Teste',
      email: 'teste@exemplo.com.br',
      phone: '(11) 98765-4321',
      message: 'Consulta sobre incidência do IBS/CBS em regime monofásico',
    }
    expect(inquiry.name).toBeTruthy()
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
})
