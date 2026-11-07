import { describe, it, expect } from 'vitest'
import {
  carregarDiagnosticoClientePastore,
  converterBalancetesCumulativosParaLiquidosMensais,
} from './diagnosticoPastore'

describe('diagnosticoPastore - recálculo por balancetes cumulativos', () => {
  it('detecta balancetes cumulativos e converte para valores líquidos mensais por diferença', () => {
    const balancetesCumulativosMock = [
      {
        id: '1',
        competencia: '2026-01-01',
        mesRotulo: 'Jan/2026',
        receitaLiquida: 233319.33,
        totalAtivo: 1100000,
        patrimonioLiquido: 377846.83,
        arquivoNome: 'balancete_01.pdf',
      },
      {
        id: '2',
        competencia: '2026-02-01',
        mesRotulo: 'Fev/2026',
        receitaLiquida: 434688.59,
        totalAtivo: 1120000,
        patrimonioLiquido: 388000.0,
        arquivoNome: 'balancete_02.pdf',
      },
      {
        id: '3',
        competencia: '2026-03-01',
        mesRotulo: 'Mar/2026',
        receitaLiquida: 647760.7,
        totalAtivo: 1150000,
        patrimonioLiquido: 401000.0,
        arquivoNome: 'balancete_03.pdf',
      },
      {
        id: '4',
        competencia: '2026-04-01',
        mesRotulo: 'Abr/2026',
        receitaLiquida: 856805.95,
        totalAtivo: 1180000,
        patrimonioLiquido: 412000.0,
        arquivoNome: 'balancete_04.pdf',
      },
      {
        id: '5',
        competencia: '2026-05-01',
        mesRotulo: 'Mai/2026',
        receitaLiquida: 1104286.65,
        totalAtivo: 1200000,
        patrimonioLiquido: 425000.0,
        arquivoNome: 'balancete_05.pdf',
      },
      {
        id: '6',
        competencia: '2026-06-01',
        mesRotulo: 'Jun/2026',
        receitaLiquida: 1364826.7,
        totalAtivo: 1230000,
        patrimonioLiquido: 439000.0,
        arquivoNome: 'balancete_06.pdf',
      },
      {
        id: '7',
        competencia: '2026-07-01',
        mesRotulo: 'Jul/2026',
        receitaLiquida: 1661813.35,
        totalAtivo: 1262846.12,
        patrimonioLiquido: 450343.07,
        arquivoNome: 'balancete_07.pdf',
      },
    ]

    const resultado = converterBalancetesCumulativosParaLiquidosMensais(balancetesCumulativosMock)

    expect(resultado.isCumulativo).toBe(true)
    expect(resultado.receitaRealPeriodo).toBeCloseTo(1661813.35, 2)

    // Valores mensais líquidos calculados por diferença
    expect(resultado.balancetesLiquidos[0].receitaLiquida).toBeCloseTo(233319.33, 2)
    expect(resultado.balancetesLiquidos[1].receitaLiquida).toBeCloseTo(201369.26, 2)
    expect(resultado.balancetesLiquidos[2].receitaLiquida).toBeCloseTo(213072.11, 2)
    expect(resultado.balancetesLiquidos[3].receitaLiquida).toBeCloseTo(209045.25, 2)
    expect(resultado.balancetesLiquidos[4].receitaLiquida).toBeCloseTo(247480.7, 2)
    expect(resultado.balancetesLiquidos[5].receitaLiquida).toBeCloseTo(260540.05, 2)
    expect(resultado.balancetesLiquidos[6].receitaLiquida).toBeCloseTo(296986.65, 2)

    // Soma das diferenças é igual ao balancete de julho
    const somaMensais = resultado.balancetesLiquidos.reduce((acc, b) => acc + b.receitaLiquida, 0)
    expect(somaMensais).toBeCloseTo(1661813.35, 2)

    // Detalhamento de conversão com 7 meses
    expect(resultado.detalhamentoConversao).toHaveLength(7)
    expect(resultado.detalhamentoConversao[6].cumulativoGravado).toBeCloseTo(1661813.35, 2)
    expect(resultado.detalhamentoConversao[6].liquidoMensalReal).toBeCloseTo(296986.65, 2)
  })

  it('não deve conter menção a 6,3 milhões ou 12,5 milhões como receita real do período', async () => {
    const diag = await carregarDiagnosticoClientePastore()

    // 1. Receita acumulada do período é exatamente R$ 1.661.813,35
    expect(diag.receitaTotalAcumulada).toBeCloseTo(1661813.35, 2)

    // 2. Projeção anualizada em ~R$ 2,85 mi, DENTRO do teto do Simples Nacional (R$ 4,8 mi)
    expect(diag.receitaAnualizada).toBeGreaterThan(2800000)
    expect(diag.receitaAnualizada).toBeLessThan(2900000)
    expect(diag.receitaAnualizada).toBeLessThan(4800000)

    // 3. Margem retida líquida recalculada em ~4,4%
    expect(diag.margemRetidaLiquidaPct).toBeGreaterThan(4.2)
    expect(diag.margemRetidaLiquidaPct).toBeLessThan(4.6)

    // 4. Ausência de R$ 6,3 mi e R$ 12,5 mi como receita
    expect(diag.recomendacao.motivoPrincipal).not.toContain('R$ 6.303.501,27')
    expect(diag.recomendacao.motivoPrincipal).not.toContain('12,5 milhões')
    expect(diag.recomendacao.motivoPrincipal).not.toContain('12.5')
    expect(diag.recomendacao.motivoPrincipal).not.toContain('10,8 milhões')
    expect(diag.recomendacao.motivoPrincipal).toContain('R$ 1.661.813,35')
    expect(diag.recomendacao.motivoPrincipal).toContain('Simples Nacional')
    expect(diag.recomendacao.motivoPrincipal).toContain('R$ 4,8 milhões')

    // 5. Presença do Simples Nacional na recomendação e na tabela comparativa
    expect(diag.recomendacao.regimeRecomendado).toContain('Simples Nacional')
    expect(diag.linhasComparativo.length).toBeGreaterThanOrEqual(8)

    for (const linha of diag.linhasComparativo) {
      expect(linha.simplesNacional).toBeDefined()
      expect(linha.simplesNacional?.valor).toBeTruthy()
      expect(linha.lucroPresumido?.valor).toBeTruthy()
      expect(linha.reforma2027?.valor).toBeTruthy()

      // Não deve ter menção a 6,3 mi nem 12,5 mi nas linhas
      expect(linha.criterio).not.toContain('12,5')
      expect(linha.criterio).not.toContain('6,3')
      expect(linha.simplesNacional?.detalhe).not.toContain('12,5')
      expect(linha.lucroPresumido.detalhe).not.toContain('12,5')
      expect(linha.reforma2027.detalhe).not.toContain('12,5')
    }

    // 6. Detalhamento e nota metodológica presentes
    expect(diag.detalhamentoConversao).toHaveLength(7)
    expect(diag.isBalanceteCumulativo).toBe(true)
    expect(diag.notaMetodologicaCumulativa).toContain('cumulativos')
    expect(diag.notaMetodologicaCumulativa).toContain('diferença')
  })
})
