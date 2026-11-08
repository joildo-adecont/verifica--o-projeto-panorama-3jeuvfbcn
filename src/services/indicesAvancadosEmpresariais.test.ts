import { describe, it, expect } from 'vitest'
import { DADOS_EXEMPLO_FMF_2024, BALANCO_3_EXERCICIOS_FMF } from '@/data/exemploFmfAnalise'
import {
  calcularTodosIndicesAvancados,
  calcularTermometroKanitz,
  calcularAltmanZ1,
  calcularFormulaDuPont,
} from './indicesAvancadosEmpresariais'

describe('Conferência dos Cálculos com o PDF FMF 2024', () => {
  it('deve conferir Liquidez Corrente = 81,45', () => {
    const relatorio = calcularTodosIndicesAvancados(DADOS_EXEMPLO_FMF_2024)
    const lc = relatorio.indices.find((i) => i.id === 'adv_liq_corrente')
    expect(lc).toBeDefined()
    expect(Number(lc!.valor.toFixed(2))).toBe(81.45)
  })

  it('deve conferir Termômetro de Kanitz = 195,2636', () => {
    const kanitz = calcularTermometroKanitz(DADOS_EXEMPLO_FMF_2024)
    expect(Number(kanitz.fatorInsolvencia.toFixed(4))).toBe(195.2636)
    expect(kanitz.faixa).toBe('solvente')
  })

  it('deve conferir Altman Z1 = -1,2035', () => {
    const altman = calcularAltmanZ1(DADOS_EXEMPLO_FMF_2024)
    expect(Number(altman.zScore.toFixed(4))).toBe(-1.2035)
  })

  it('deve conferir Du Pont Margem 22,09% x Giro 0,0656 = Retorno 0,0145', () => {
    const dupont = calcularFormulaDuPont(DADOS_EXEMPLO_FMF_2024)
    expect(Number(dupont.margemLiquida.toFixed(2))).toBe(22.09)
    expect(Number(dupont.giroAtivo.toFixed(4))).toBe(0.0656)
    expect(Number(dupont.retornoAtivo.toFixed(4))).toBe(0.0145)
  })

  it('deve calcular todos os grupos de índices solicitados sem erros', () => {
    const relatorio = calcularTodosIndicesAvancados(DADOS_EXEMPLO_FMF_2024)
    expect(relatorio.indices.length).toBeGreaterThanOrEqual(14)
    expect(relatorio.dinamica.cdg).toBeGreaterThan(0)
    expect(relatorio.dinamica.saldoTesouraria).toBeGreaterThan(0)
    expect(relatorio.elizabetsky.fator).toBeDefined()
    expect(BALANCO_3_EXERCICIOS_FMF.anoAtual.rotulo).toBe('2024')
  })
})
