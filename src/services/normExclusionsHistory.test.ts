import { describe, it, expect } from 'vitest'
import {
  FALLBACK_NORM_EXCLUSIONS,
  ordenarExclusoesCronologicamente,
  filtrarHistoricoExclusoes,
  calcularMetricasExclusoes,
  extrairFontesComExclusoes,
  identificarChaveFonte,
  FILTROS_EXCLUSOES_INICIAIS,
  type FiltrosHistoricoExclusoes,
} from './normExclusionsHistory'

describe('normExclusionsHistory', () => {
  it('FALLBACK_NORM_EXCLUSIONS possui itens válidos e consistentes', () => {
    expect(FALLBACK_NORM_EXCLUSIONS.length).toBeGreaterThanOrEqual(7)
    for (const item of FALLBACK_NORM_EXCLUSIONS) {
      expect(item.norm_code).toBeTruthy()
      expect(item.exclusion_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(item.reason_description).toBeTruthy()
      expect(item.source_org).toBeTruthy()
      expect(['diario_oficial', 'oficial_institucional', 'comparacao']).toContain(
        item.confidence_tier,
      )
    }
  })

  it('extrairFontesComExclusoes identifica fontes reais com contagens e selos', () => {
    const fontes = extrairFontesComExclusoes(FALLBACK_NORM_EXCLUSIONS)
    expect(fontes.length).toBeGreaterThanOrEqual(5)

    const ids = fontes.map((f) => f.id)
    expect(ids).toContain('DOU')
    expect(ids).toContain('Receita Federal')
    expect(ids).toContain('Planalto')
    expect(ids).toContain('Senado')
    expect(ids).toContain('CGIBS')
    expect(ids).toContain('Lefisc')

    const douFonte = fontes.find((f) => f.id === 'DOU')
    expect(douFonte?.confidence_tier).toBe('diario_oficial')
    expect(douFonte?.count).toBeGreaterThanOrEqual(1)

    const rfbFonte = fontes.find((f) => f.id === 'Receita Federal')
    expect(rfbFonte?.confidence_tier).toBe('oficial_institucional')

    const lefiscFonte = fontes.find((f) => f.id === 'Lefisc')
    expect(lefiscFonte?.confidence_tier).toBe('comparacao')
  })

  it('ordenarExclusoesCronologicamente coloca o evento mais recente no topo', () => {
    const ordenados = ordenarExclusoesCronologicamente(FALLBACK_NORM_EXCLUSIONS)
    expect(ordenados[0].exclusion_date >= ordenados[1].exclusion_date).toBe(true)
  })

  it('filtrarHistoricoExclusoes filtra por fonte individual', () => {
    const filtrosDOU: FiltrosHistoricoExclusoes = {
      ...FILTROS_EXCLUSOES_INICIAIS,
      fonte: 'DOU',
    }
    const filtradosDOU = filtrarHistoricoExclusoes(FALLBACK_NORM_EXCLUSIONS, filtrosDOU)
    expect(filtradosDOU.length).toBeGreaterThan(0)
    expect(
      filtradosDOU.every(
        (i) =>
          i.source_org.toLowerCase().includes('dou') ||
          i.source_org.toLowerCase().includes('imprensa'),
      ),
    ).toBe(true)

    const filtrosRFB: FiltrosHistoricoExclusoes = {
      ...FILTROS_EXCLUSOES_INICIAIS,
      fonte: 'Receita Federal',
    }
    const filtradosRFB = filtrarHistoricoExclusoes(FALLBACK_NORM_EXCLUSIONS, filtrosRFB)
    expect(filtradosRFB.length).toBeGreaterThan(0)
    expect(filtradosRFB.every((i) => i.source_org.includes('Receita Federal'))).toBe(true)
  })

  it('filtrarHistoricoExclusoes combina fonte com segmento e busca', () => {
    const filtrosCombinados: FiltrosHistoricoExclusoes = {
      busca: 'split payment',
      segmento: 'Tributário',
      fonte: 'DOU',
      periodo: 'todos',
    }
    const res = filtrarHistoricoExclusoes(FALLBACK_NORM_EXCLUSIONS, filtrosCombinados)
    expect(res.length).toBe(1)
    expect(res[0].norm_code).toContain('PIS/Cofins')
  })

  it('ao limpar o filtro de fonte (fonte: TODAS), todas as exclusões retornam', () => {
    const filtrosTodas: FiltrosHistoricoExclusoes = {
      ...FILTROS_EXCLUSOES_INICIAIS,
      fonte: 'TODAS',
    }
    const res = filtrarHistoricoExclusoes(FALLBACK_NORM_EXCLUSIONS, filtrosTodas)
    expect(res.length).toBe(FALLBACK_NORM_EXCLUSIONS.length)
  })

  it('calcularMetricasExclusoes calcula total, 30/90 dias e por segmento', () => {
    const metricas = calcularMetricasExclusoes(FALLBACK_NORM_EXCLUSIONS, '2026-11-03')
    expect(metricas.total).toBe(FALLBACK_NORM_EXCLUSIONS.length)
    expect(metricas.ultimos30Dias).toBeGreaterThanOrEqual(1)
    expect(metricas.ultimos90Dias).toBeGreaterThanOrEqual(metricas.ultimos30Dias)
    expect(metricas.porSegmento.Jurídico).toBeGreaterThanOrEqual(1)
    expect(metricas.porSegmento.Tributário).toBeGreaterThanOrEqual(1)
  })

  it('identificarChaveFonte mapeia nomes de órgãos corretamente', () => {
    expect(identificarChaveFonte('DOU / Imprensa Nacional').id).toBe('DOU')
    expect(identificarChaveFonte('Receita Federal (RFB)').id).toBe('Receita Federal')
    expect(identificarChaveFonte('CGIBS (Comitê Gestor IBS)').id).toBe('CGIBS')
    expect(identificarChaveFonte('Senado Federal / Congresso Nacional').id).toBe('Senado')
    expect(identificarChaveFonte('Planalto / Presidência da República').id).toBe('Planalto')
    expect(identificarChaveFonte('Câmara dos Deputados').id).toBe('Câmara')
    expect(identificarChaveFonte('Lefisc Legislação Fiscal').id).toBe('Lefisc')
  })
})
