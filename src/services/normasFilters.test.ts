import { describe, it, expect } from 'vitest'
import { fallbackNorms } from './panorama'
import {
  filtrarNormas,
  deduzirTipoAto,
  deduzirEsferaNorma,
  correspondeFonteNorma,
  correspondeIncidenciaNorma,
  contarFiltrosNormasAtivos,
  FILTROS_NORMAS_INICIAIS,
} from './normasFilters'

describe('Filtros facetados da Seção de Normas (normasFilters.ts)', () => {
  it('sem filtros retorna todas as normas originais', () => {
    const filtradas = filtrarNormas(fallbackNorms, FILTROS_NORMAS_INICIAIS)
    expect(filtradas).toHaveLength(fallbackNorms.length)
    expect(contarFiltrosNormasAtivos(FILTROS_NORMAS_INICIAIS)).toBe(0)
  })

  it('deduz corretamente os tipos de ato normativo', () => {
    const ec = fallbackNorms.find((n) => n.code.includes('EC 132'))
    expect(ec).toBeDefined()
    expect(deduzirTipoAto(ec!)).toBe('Emenda Constitucional')

    const lc = fallbackNorms.find((n) => n.code.includes('LC 214'))
    expect(lc).toBeDefined()
    expect(deduzirTipoAto(lc!)).toBe('Lei Complementar')

    const dec = fallbackNorms.find((n) => n.code.includes('Decreto 12.955'))
    expect(dec).toBeDefined()
    expect(deduzirTipoAto(dec!)).toBe('Decreto')

    const res = fallbackNorms.find((n) => n.code.includes('Resolução CGIBS nº 5'))
    expect(res).toBeDefined()
    expect(deduzirTipoAto(res!)).toBe('Resolução')

    const ato = fallbackNorms.find((n) => n.code.includes('Ato Conjunto RFB/CGIBS nº 1'))
    expect(ato).toBeDefined()
    expect(deduzirTipoAto(ato!)).toBe('Ato Conjunto')

    const port = fallbackNorms.find((n) => n.code.includes('Portaria Conjunta MF/CGIBS nº 7'))
    expect(port).toBeDefined()
    expect(deduzirTipoAto(port!)).toBe('Portaria Conjunta')
  })

  it('filtra por tipo de ato: apenas Resoluções', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Resolução'],
    })
    expect(filtradas.length).toBeGreaterThan(0)
    for (const norm of filtradas) {
      expect(deduzirTipoAto(norm)).toBe('Resolução')
    }
    // Deve incluir as resoluções do CGIBS e do CGSN
    expect(filtradas.some((n) => n.code.includes('CGIBS'))).toBe(true)
  })

  it('filtra por tipo de ato: Lei Complementar e Emenda Constitucional combinadas', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Lei Complementar', 'Emenda Constitucional'],
    })
    expect(filtradas.length).toBe(3) // EC 132, LC 214, LC 227
    const codes = filtradas.map((n) => n.code)
    expect(codes).toContain('EC 132/2023')
    expect(codes).toContain('LC 214/2025')
    expect(codes).toContain('LC 227/2026')
  })

  it('filtra por fonte oficial: Planalto', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      fontes: ['Planalto'],
    })
    expect(filtradas.length).toBeGreaterThanOrEqual(4) // EC 132, LC 214, LC 227, Decreto 12.955
    const codes = filtradas.map((n) => n.code)
    expect(codes).toContain('EC 132/2023')
    expect(codes).toContain('LC 214/2025')
    expect(codes).toContain('Decreto 12.955/2026')
  })

  it('filtra por fonte oficial: CGIBS', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      fontes: ['CGIBS'],
    })
    expect(filtradas.length).toBeGreaterThanOrEqual(8)
    for (const norm of filtradas) {
      expect(correspondeFonteNorma(norm, 'CGIBS')).toBe(true)
    }
  })

  it('filtra por fonte oficial: CGSN', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      fontes: ['CGSN'],
    })
    expect(filtradas.length).toBe(1)
    expect(filtradas[0].code).toContain('CGSN')
  })

  it('filtra por esfera federativa: federal', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      esferas: ['federal'],
    })
    expect(filtradas.length).toBe(fallbackNorms.length)
    for (const norm of filtradas) {
      expect(deduzirEsferaNorma(norm)).toBe('federal')
    }
  })

  it('filtra por incidência: cria ou regula incidência', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      incidencias: ['INCIDE'],
    })
    expect(filtradas.length).toBeGreaterThanOrEqual(2)
    const codes = filtradas.map((n) => n.code)
    expect(codes).toContain('EC 132/2023')
    expect(codes).toContain('LC 214/2025')
  })

  it('combina filtros facetados: tipo de ato Decreto + fonte Planalto', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Decreto'],
      fontes: ['Planalto'],
    })
    expect(filtradas).toHaveLength(1)
    expect(filtradas[0].code).toBe('Decreto 12.955/2026')
  })

  it('combina filtros facetados: tipo de ato Ato Conjunto + fonte RFB', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Ato Conjunto'],
      fontes: ['RFB'],
    })
    expect(filtradas.length).toBe(2)
    const codes = filtradas.map((n) => n.code)
    expect(codes).toContain('Ato Conjunto RFB/CGIBS nº 1/2025')
    expect(codes).toContain('Ato Conjunto RFB/CGIBS 4/2026')
  })

  it('retorna lista vazia para combinação impossível (estado vazio)', () => {
    const filtradas = filtrarNormas(fallbackNorms, {
      ...FILTROS_NORMAS_INICIAIS,
      tiposAto: ['Emenda Constitucional'],
      fontes: ['CGSN'], // Não há EC emitida pelo CGSN
    })
    expect(filtradas).toHaveLength(0)
  })

  it('contador de filtros ativos reflete corretamente o estado', () => {
    expect(
      contarFiltrosNormasAtivos({
        termo: 'imposto',
        tiposAto: ['Resolução'],
        esferas: ['federal'],
        fontes: ['CGIBS', 'RFB'],
        incidencias: ['OPERACIONAL'],
      }),
    ).toBe(6) // 1 termo + 1 tipo + 1 esfera + 2 fontes + 1 incidência = 6
  })
})
