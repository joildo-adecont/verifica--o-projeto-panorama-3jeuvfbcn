import { describe, it, expect, beforeEach } from 'vitest'
import {
  ordenarAlertasCronologicamente,
  getReadAlertIdsFromStorage,
  saveReadAlertIdsToStorage,
  FALLBACK_NORM_ALERTS,
} from './normAlerts'
import type { NormAlertItem } from '@/types/panorama'

const MOCK_ALERTAS: NormAlertItem[] = [
  {
    id: 'alerta-1',
    norm_code: 'Decreto 13.133/2026',
    norm_type: 'Decreto',
    norm_title: 'Decreto 13.133 Combustíveis',
    source_org: 'DOU / Imprensa Nacional',
    confidence_tier: 'diario_oficial',
    review_type: 'alteracao',
    segment: 'Tributário',
    review_date: '2026-10-09',
    summary_change: 'Alíquotas da CBS combustíveis',
    record_origin: 'rotina_semanal',
    is_read: false,
    created: '2026-10-09T10:00:00Z',
  },
  {
    id: 'alerta-2',
    norm_code: 'Resolução CGIBS 6/2026 (RIBS) — Alteração art. 617',
    norm_type: 'Alteração Regulamentar',
    norm_title: 'RIBS Prazos Operacionais',
    source_org: 'CGIBS',
    confidence_tier: 'oficial_institucional',
    review_type: 'alteracao',
    segment: 'Tributário',
    review_date: '2026-10-28',
    summary_change: 'Prorrogação expressa de prazos DFe',
    record_origin: 'rotina_semanal',
    is_read: false,
    created: '2026-10-28T12:00:00Z',
  },
  {
    id: 'alerta-3',
    norm_code: 'Revogação LC 123/2006 art. 13 §1º',
    norm_type: 'Exclusão Legislativa',
    norm_title: 'Exclusão de disposições Simples',
    source_org: 'Senado Federal',
    confidence_tier: 'oficial_institucional',
    review_type: 'exclusao',
    segment: 'Jurídico',
    review_date: '2026-10-21',
    summary_change: 'Revogação de cumulatividade anterior',
    record_origin: 'manual',
    is_read: true,
    created: '2026-10-21T08:00:00Z',
  },
]

describe('normAlerts service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('ordena alertas cronologicamente com o mais recente no topo', () => {
    const ordenados = ordenarAlertasCronologicamente(MOCK_ALERTAS)
    expect(ordenados[0].id).toBe('alerta-2')
    expect(ordenados[0].review_date).toBe('2026-10-28')
    expect(ordenados[ordenados.length - 1].id).toBe('alerta-1')
  })

  it('gerencia persistência de alertas lidos no localStorage', () => {
    expect(getReadAlertIdsFromStorage()).toEqual([])

    saveReadAlertIdsToStorage(['alerta-1', 'alerta-2'])
    const lidos = getReadAlertIdsFromStorage()
    expect(lidos).toContain('alerta-1')
    expect(lidos).toContain('alerta-2')

    // Evita duplicatas ao salvar
    saveReadAlertIdsToStorage(['alerta-1', 'alerta-3'])
    const atualizados = getReadAlertIdsFromStorage()
    expect(atualizados).toContain('alerta-1')
    expect(atualizados).toContain('alerta-3')
  })

  it('fallback de alertas contém dados estruturados e ordenáveis', () => {
    expect(FALLBACK_NORM_ALERTS.length).toBeGreaterThan(0)
    const ordenados = ordenarAlertasCronologicamente(FALLBACK_NORM_ALERTS)
    expect(ordenados[0].review_date >= ordenados[1].review_date).toBe(true)
    expect(ordenados.every((a) => a.norm_code && a.review_type && a.segment)).toBe(true)
  })

  it('permite criar alerta em fallback para exclusões', async () => {
    const { criarAlertaParaExclusao } = await import('./normAlerts')
    const alerta = await criarAlertaParaExclusao({
      id: 'excl-teste-1',
      norm_code: 'Revogação Teste Art. 1º',
      norm_type: 'Exclusão Legislativa',
      norm_title: 'Revogação teste',
      source_org: 'Senado Federal',
      confidence_tier: 'oficial_institucional',
      segment: 'Tributário',
      exclusion_date: '2026-11-03',
      reason_description: 'Revogação expressa para teste',
    })

    expect(alerta.review_type).toBe('exclusao')
    expect(alerta.norm_code).toBe('Revogação Teste Art. 1º')
    expect(alerta.is_read).toBe(false)
  })
})
