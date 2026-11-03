import { describe, it, expect } from 'vitest'
import {
  ordenarRevisoesCronologicamente,
  filtrarHistoricoRevisoes,
  obterTodasRevisoesDaNorma,
  FILTROS_HISTORICO_INICIAIS,
  FALLBACK_NORM_REVIEWS,
} from './normReviewsHistory'
import type { NormReviewHistoryItem } from '@/types/panorama'

const MOCK_REVISOES: NormReviewHistoryItem[] = [
  {
    id: 'item-antigo',
    norm_code: 'Decreto 13.133/2026',
    norm_type: 'Decreto',
    norm_number: '13.133',
    norm_year: '2026',
    norm_title: 'Decreto 13.133 Combustíveis',
    source_org: 'DOU / Imprensa Nacional',
    confidence_tier: 'diario_oficial',
    review_type: 'alteracao',
    segment: 'Tributário',
    review_date: '2026-10-09',
    summary_change: 'Alíquota da CBS combustíveis',
    record_origin: 'rotina_semanal',
  },
  {
    id: 'item-recente',
    norm_code: 'Resolução CGIBS 6/2026 (RIBS) — Alteração art. 617',
    norm_type: 'Alteração Regulamentar',
    norm_number: '6/2026',
    norm_year: '2026',
    norm_title: 'RIBS Prazos Operacionais',
    source_org: 'CGIBS',
    confidence_tier: 'oficial_institucional',
    review_type: 'alteracao',
    segment: 'Tributário',
    review_date: '2026-10-28',
    summary_change: 'Prorrogação expressa de prazos DFe',
    record_origin: 'rotina_semanal',
  },
  {
    id: 'item-exclusao',
    norm_code: 'Revogação LC 123/2006 art. 13 §1º',
    norm_type: 'Exclusão Legislativa',
    norm_number: '123/2006',
    norm_year: '2026',
    norm_title: 'Exclusão de disposições Simples',
    source_org: 'Senado Federal',
    confidence_tier: 'oficial_institucional',
    review_type: 'exclusao',
    segment: 'Jurídico',
    review_date: '2026-10-21',
    summary_change: 'Revogação de cumulatividade anterior',
    record_origin: 'manual',
  },
  {
    id: 'item-inclusao',
    norm_code: 'Decreto 13.140/2026',
    norm_type: 'Decreto',
    norm_number: '13.140',
    norm_year: '2026',
    norm_title: 'Dispensa Nanoempreendedor',
    source_org: 'DOU / Imprensa Nacional',
    confidence_tier: 'diario_oficial',
    review_type: 'inclusao',
    segment: 'Contábil',
    review_date: '2026-10-21',
    summary_change: 'Dispensa de emissão fiscal',
    record_origin: 'backfill_inicial',
  },
]

describe('normReviewsHistory service', () => {
  it('ordena revisões cronologicamente com a mais recente no topo', () => {
    const ordenado = ordenarRevisoesCronologicamente(MOCK_REVISOES)
    expect(ordenado[0].id).toBe('item-recente')
    expect(ordenado[ordenado.length - 1].id).toBe('item-antigo')
    expect(ordenado[0].review_date).toBe('2026-10-28')
  })

  it('filtra por segmento corretamente', () => {
    const juridico = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, segmento: 'Jurídico' },
      '2026-10-31',
    )
    expect(juridico).toHaveLength(1)
    expect(juridico[0].norm_code).toContain('Revogação LC 123/2006')

    const tributario = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, segmento: 'Tributário' },
      '2026-10-31',
    )
    expect(tributario).toHaveLength(2)
  })

  it('filtra por tipo de revisão (inclusao, alteracao, exclusao)', () => {
    const exclusoes = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, tipoRevisao: 'exclusao' },
      '2026-10-31',
    )
    expect(exclusoes).toHaveLength(1)
    expect(exclusoes[0].review_type).toBe('exclusao')

    const inclusoes = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, tipoRevisao: 'inclusao' },
      '2026-10-31',
    )
    expect(inclusoes).toHaveLength(1)
    expect(inclusoes[0].review_type).toBe('inclusao')

    const alteracoes = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, tipoRevisao: 'alteracao' },
      '2026-10-31',
    )
    expect(alteracoes).toHaveLength(2)
  })

  it('filtra por período recente (7 dias, 30 dias, ano 2026)', () => {
    const refData = '2026-10-31'
    const seteDias = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, periodo: '7dias' },
      refData,
    )
    // 2026-10-28 está a 3 dias de 2026-10-31
    expect(seteDias.some((i) => i.id === 'item-recente')).toBe(true)
    // 2026-10-09 está a 22 dias, não deve entrar nos 7 dias
    expect(seteDias.some((i) => i.id === 'item-antigo')).toBe(false)

    const trintaDias = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, periodo: '30dias' },
      refData,
    )
    expect(trintaDias).toHaveLength(4)
  })

  it('busca textual por número da norma ou palavra-chave', () => {
    const porNumero = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, busca: '13.140' },
      '2026-10-31',
    )
    expect(porNumero).toHaveLength(1)
    expect(porNumero[0].norm_code).toBe('Decreto 13.140/2026')

    const porPalavra = filtrarHistoricoRevisoes(
      MOCK_REVISOES,
      { ...FILTROS_HISTORICO_INICIAIS, busca: 'Prorrogação' },
      '2026-10-31',
    )
    expect(porPalavra).toHaveLength(1)
    expect(porPalavra[0].id).toBe('item-recente')
  })

  it('recupera todas as revisões de uma norma específica para histórico longitudinal', () => {
    const itensRepetidos: NormReviewHistoryItem[] = [
      ...MOCK_REVISOES,
      {
        id: 'item-recente-v2',
        norm_code: 'Decreto 13.133/2026',
        norm_type: 'Decreto',
        norm_title: 'Decreto 13.133 Revisão Atualizada',
        source_org: 'DOU',
        confidence_tier: 'diario_oficial',
        review_type: 'alteracao',
        segment: 'Tributário',
        review_date: '2026-10-30',
        summary_change: 'Nova redação de artigos',
        record_origin: 'manual',
      },
    ]

    const historicoNorma = obterTodasRevisoesDaNorma(itensRepetidos, 'Decreto 13.133/2026')
    expect(historicoNorma).toHaveLength(2)
    expect(historicoNorma[0].id).toBe('item-recente-v2')
    expect(historicoNorma[1].id).toBe('item-antigo')
  })

  it('fallback possui normas pré-carregadas válidas e ordenadas', () => {
    expect(FALLBACK_NORM_REVIEWS.length).toBeGreaterThan(0)
    const ordenado = ordenarRevisoesCronologicamente(FALLBACK_NORM_REVIEWS)
    expect(ordenado[0].review_date >= ordenado[1].review_date).toBe(true)
  })
})
