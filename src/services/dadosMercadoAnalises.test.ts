import { describe, it, expect, vi } from 'vitest'
import {
  INDICES_MERCADO_CONFIG,
  formatarPeriodoReferencia,
  formatarValorIndice,
  processarSerieEmItemMercado,
  filtrarHistoricoPorPeriodo,
} from './dadosMercadoAnalises'

describe('dadosMercadoAnalises', () => {
  it('contém a configuração dos principais índices de mercado requeridos', () => {
    const chaves = INDICES_MERCADO_CONFIG.map((c) => c.chave)
    expect(chaves).toContain('selic')
    expect(chaves).toContain('ipca')
    expect(chaves).toContain('ibovespa')
    expect(chaves).toContain('ifix')
    expect(chaves).toContain('usd')
    expect(chaves).toContain('juros_pessoal')
    expect(chaves).toContain('inadimplencia')
    expect(chaves).toContain('juros_medio')
  })

  it('formata período YYYY-MM para Mês/Ano amigável em pt-BR', () => {
    expect(formatarPeriodoReferencia('2026-02')).toBe('Fev/2026')
    expect(formatarPeriodoReferencia('2025-11')).toBe('Nov/2025')
    expect(formatarPeriodoReferencia('2024')).toBe('2024')
    expect(formatarPeriodoReferencia('')).toBe('Atual')
  })

  it('formata valores em pt-BR de acordo com o formato e trata nulos com traço', () => {
    expect(formatarValorIndice(null, 'percentual')).toBe('—')
    expect(formatarValorIndice(undefined, 'pontos')).toBe('—')
    expect(formatarValorIndice(NaN, 'moeda')).toBe('—')

    // Moeda
    expect(formatarValorIndice(5.4215, 'moeda', 4)).toBe('5,4215')
    // Percentual
    expect(formatarValorIndice(10.75, 'percentual', 2)).toBe('10,75')
    // Pontos (sem casas decimais)
    expect(formatarValorIndice(138520, 'pontos')).toBe('138.520')
  })

  it('processa série viva calculando variação e metadados de fonte', () => {
    const selicConfig = INDICES_MERCADO_CONFIG.find((c) => c.chave === 'selic')!
    const mockResultado = {
      serie: [
        { periodo: '2026-01', valor: 10.5 },
        { periodo: '2026-02', valor: 10.75 },
      ],
      fonteViva: true,
      baseInterna: false,
      fonte: 'BCB SGS 432',
      aviso: '',
    }

    const item = processarSerieEmItemMercado(selicConfig, mockResultado)
    expect(item.valorAtual).toBe(10.75)
    expect(item.valorAnterior).toBe(10.5)
    expect(item.variacao).toBeCloseTo(0.25, 2)
    expect(item.variacaoPct).toBeCloseTo(2.38, 2)
    expect(item.periodoFormatado).toBe('Fev/2026')
    expect(item.fonteViva).toBe(true)
    expect(item.baseInterna).toBe(false)
    expect(item.fonte).toBe('BCB SGS 432')
  })

  it('degrada elegantemente para base interna quando a fonte falha, com aviso transparente', () => {
    const ibovConfig = INDICES_MERCADO_CONFIG.find((c) => c.chave === 'ibovespa')!
    const mockResultado = {
      serie: [
        { periodo: '2024', valor: 134600 },
        { periodo: '2025', valor: 138500 },
      ],
      fonteViva: false,
      baseInterna: true,
      fonte: 'Base interna do sistema',
      aviso: 'dados da base interna (última sincronização: 2025)',
    }

    const item = processarSerieEmItemMercado(ibovConfig, mockResultado)
    expect(item.valorAtual).toBe(138500)
    expect(item.valorAnterior).toBe(134600)
    expect(item.fonteViva).toBe(false)
    expect(item.baseInterna).toBe(true)
    expect(item.fonte).toBe('Base Interna ADECONT')
    expect(item.aviso).toContain('base interna')
  })

  it('filtra histórico por períodos 6m, 12m, 24m e todos', () => {
    const pontos = Array.from({ length: 30 }, (_, i) => ({
      periodo: `2024-${String((i % 12) + 1).padStart(2, '0')}`,
      valor: 100 + i,
    }))

    expect(filtrarHistoricoPorPeriodo(pontos, '6m').length).toBe(6)
    expect(filtrarHistoricoPorPeriodo(pontos, '12m').length).toBe(12)
    expect(filtrarHistoricoPorPeriodo(pontos, '24m').length).toBe(24)
    expect(filtrarHistoricoPorPeriodo(pontos, 'todos').length).toBe(30)
    expect(filtrarHistoricoPorPeriodo([], '6m').length).toBe(0)
  })
})
