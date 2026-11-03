import { describe, it, expect } from 'vitest'
import {
  FALLBACK_NORM_EXCLUSIONS,
  ordenarExclusoesCronologicamente,
  filtrarHistoricoExclusoes,
  calcularMetricasExclusoes,
  FILTROS_EXCLUSOES_INICIAIS,
  type FiltrosHistoricoExclusoes,
} from './normExclusionsHistory'
import type { NormExclusionHistoryItem } from '@/types/panorama'

describe('normExclusionsHistory', () => {
  it('FALLBACK_NORM_EXCLUSIONS possui itens válidos e consistentes', () => {
    expect(FALLBACK_NORM_EXCLUSIONS.length).toBeGreaterThan(0)
    for (const item of FALLBACK_NORM_EXCLUSIONS) {
      expect(item.norm_code).toBeTruthy()
      expect(item.exclusion_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(item.reason_description).toBeTruthy()
      expect(item.source_org).toBeTruthy()
    }
  })

  it('ordenarExclusoesCronologicamente coloca o evento mais recente no topo', () => {
    const ordenados = ordenarExclusoesCronologicamente(FALLBACK_NORM_EXCLUSIONS)
    expect(ordenados[0].exclusion_date >= ordenados[1].exclusion_date).toBe(true)
  })

  it('filtrarHistoricoExclusoes filtra por segmento', () => {
    const filtros: FiltrosHistoricoExclusoes = {
      ...FILTROS_EXCLUSOES_INICIAIS,
      segmento: 'Jurídico',
    }
    const filtrados = filtrarHistoricoExclusoes(FALLBACK_NORM_EXCLUSIONS, filtros)
    expect(filtrados.every((i) => i.segment === 'Jurídico')).toBe(true)
  })

  it('filtrarHistoricoExclusoes busca por palavra-chave', () => {
    const filtros: FiltrosHistoricoExclusoes = {
      ...FILTROS_EXCLUSOES_INICIAIS,
      busca: 'PIS/Cofins',
    }
    const filtrados = filtrarHistoricoExclusoes(FALLBACK_NORM_EXCLUSIONS, filtros)
    expect(filtrados.length).toBeGreaterThan(0)
    expect(filtrados[0].norm_code).toContain('PIS/Cofins')
  })

  it('calcularMetricasExclusoes calcula total, 30/90 dias e por segmento', () => {
    const metricas = calcularMetricasExclusoes(FALLBACK_NORM_EXCLUSIONS, '2026-11-03')
    expect(metricas.total).toBe(FALLBACK_NORM_EXCLUSIONS.length)
    expect(metricas.ultimos30Dias).toBeGreaterThanOrEqual(1)
    expect(metricas.ultimos90Dias).toBeGreaterThanOrEqual(metricas.ultimos30Dias)
    expect(metricas.porSegmento.Jurídico).toBeGreaterThanOrEqual(1)
  })
})
