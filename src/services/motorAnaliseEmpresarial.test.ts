import { describe, it, expect } from 'vitest'
import {
  criarExercicioVazio,
  calcularTotaisExercicio,
  calcularAH,
  calcularAV,
  calcular25Indicadores,
  calcularScorePonderado,
  simularCenariosSensibilidade,
  regressaoLinearSimples,
  projetarForecast3Anos,
  gerarDiagnosticoPorDimensao,
} from './motorAnaliseEmpresarial'

describe('Motor de Análise Empresarial ADECONT', () => {
  it('deve calcular corretamente totais patrimoniais e DRE de um exercício genérico', () => {
    const ex = criarExercicioVazio('Ano Atual', '2025')
    ex.ativoCirculante.caixaEquivalentes = 100
    ex.ativoCirculante.contasReceber = 200
    ex.ativoCirculante.estoques = 300
    ex.ativoNaoCirculante.imobilizado = 400

    ex.passivoCirculante.fornecedores = 250
    ex.passivoCirculante.emprestimosCP = 50
    ex.passivoNaoCirculante.emprestimosLP = 200
    ex.patrimonioLiquido.capitalSocial = 500

    ex.dre.receitaBruta = 2000
    ex.dre.deducoesImpostos = -200
    ex.dre.cmv = -800
    ex.dre.despesasAdministrativas = -200
    ex.dre.depreciacaoAmortizacao = 50
    ex.dre.resultadoFinanceiro = -50
    ex.dre.irCsll = -100

    const calc = calcularTotaisExercicio(ex)

    // Ativo Circulante = 100+200+300 = 600
    expect(calc.totalAtivoCirculante).toBe(600)
    // Ativo Não Circulante = 400
    expect(calc.totalAtivoNaoCirculante).toBe(400)
    // Ativo Total = 1000
    expect(calc.ativoTotal).toBe(1000)

    // Passivo Circulante = 250+50 = 300
    expect(calc.totalPassivoCirculante).toBe(300)
    // Passivo Não Circulante = 200
    expect(calc.totalPassivoNaoCirculante).toBe(200)
    // PL = 500
    expect(calc.totalPatrimonioLiquido).toBe(500)
    // Passivo + PL = 1000
    expect(calc.passivoTotalComPL).toBe(1000)
    // Conferência = 0
    expect(calc.diferencaConferencia).toBe(0)

    // DRE
    // Receita Líquida = 2000 - 200 = 1800
    expect(calc.receitaLiquida).toBe(1800)
    // Lucro Bruto = 1800 - 800 = 1000
    expect(calc.lucroBruto).toBe(1000)
    // EBIT = 1000 - 200 = 800
    expect(calc.ebit).toBe(800)
    // EBITDA = 800 + 50 = 850
    expect(calc.ebitda).toBe(850)
    // LAIR = 800 - 50 = 750
    expect(calc.lair).toBe(750)
    // Lucro Líquido = 750 - 100 = 650
    expect(calc.lucroLiquido).toBe(650)
  })

  it('deve calcular corretamente AH% e AV%', () => {
    // AH: de 100 para 150 = +50%
    expect(calcularAH(100, 150)).toBe(50)
    // AH: de 200 para 100 = -50%
    expect(calcularAH(200, 100)).toBe(-50)
    // AH com base 0
    expect(calcularAH(0, 100)).toBeNull()

    // AV: 250 de 1000 = 25%
    expect(calcularAV(250, 1000)).toBe(25)
    expect(calcularAV(50, 0)).toBeNull()
  })

  it('deve calcular os 25 indicadores com semáforos correspondentes', () => {
    const ex = criarExercicioVazio('Ano Atual', '2025')
    ex.ativoCirculante.caixaEquivalentes = 300
    ex.ativoCirculante.contasReceber = 500
    ex.ativoCirculante.estoques = 200
    ex.ativoNaoCirculante.realizavelLongoPrazo = 100
    ex.ativoNaoCirculante.imobilizado = 900

    ex.passivoCirculante.fornecedores = 200
    ex.passivoCirculante.emprestimosCP = 100
    ex.passivoNaoCirculante.emprestimosLP = 200
    ex.patrimonioLiquido.capitalSocial = 1000
    ex.patrimonioLiquido.reservasLucros = 500

    ex.dre.receitaBruta = 5000
    ex.dre.deducoesImpostos = -500
    ex.dre.cmv = -2000
    ex.dre.despesasAdministrativas = -500
    ex.dre.depreciacaoAmortizacao = 100
    ex.dre.resultadoFinanceiro = -50
    ex.dre.irCsll = -150

    ex.complementares.compras = 2000
    ex.complementares.despesaJuros = 50
    ex.complementares.amortizacaoDividas = 50
    ex.complementares.capex = 150

    const indicadores = calcular25Indicadores(ex)

    expect(indicadores).toHaveLength(25)

    const map = new Map(indicadores.map((i) => [i.id, i]))

    // 1. Liquidez corrente: AC (1000) / PC (300) = 3.33 (Saudável > 1.5)
    expect(map.get('liq_corrente')?.valor).toBeCloseTo(3.33, 1)
    expect(map.get('liq_corrente')?.semaforo).toBe('saudavel')

    // 2. Liquidez seca: (1000 - 200) / 300 = 2.66 (Saudável > 1.0)
    expect(map.get('liq_seca')?.valor).toBeCloseTo(2.66, 1)
    expect(map.get('liq_seca')?.semaforo).toBe('saudavel')

    // 3. Liquidez imediata: 300 / 300 = 1.0 (Saudável > 0.3)
    expect(map.get('liq_imediata')?.valor).toBe(1.0)
    expect(map.get('liq_imediata')?.semaforo).toBe('saudavel')

    // 5. CCL: 1000 - 300 = 700 (Saudável > 0)
    expect(map.get('ccl')?.valor).toBe(700)
    expect(map.get('ccl')?.semaforo).toBe('saudavel')

    // 15. Margem líquida: Lucro Líquido / Rec Líquida
    expect(map.get('margem_liquida')?.valor).toBeGreaterThan(5)
    expect(map.get('margem_liquida')?.semaforo).toBe('saudavel')
  })

  it('deve calcular o Score Ponderado com os pesos fixos do modelo (soma dos pesos = 1.0)', () => {
    const score = calcularScorePonderado({
      Liquidez: 9,
      Endividamento: 8,
      Rentabilidade: 9,
      Atividade: 8,
      Fiscal: 8,
      Trabalhista: 8,
      Contingências: 7,
      Governança: 9,
    })

    // Soma ponderada:
    // 9*0.15 + 8*0.15 + 9*0.2 + 8*0.1 + 8*0.15 + 8*0.1 + 7*0.1 + 9*0.05
    // = 1.35 + 1.20 + 1.80 + 0.80 + 1.20 + 0.80 + 0.70 + 0.45 = 8.30
    expect(score.notaFinal).toBeCloseTo(8.3, 2)
    expect(score.classificacao).toContain('Bom')
  })

  it('deve simular cenários de sensibilidade (Otimista, Base, Pessimista)', () => {
    const cenarios = simularCenariosSensibilidade(1000, 200, 50)
    expect(cenarios).toHaveLength(3)

    const [otimista, base, pessimista] = cenarios
    expect(otimista.receita).toBe(1100)
    expect(base.receita).toBe(1000)
    expect(pessimista.receita).toBe(900)

    expect(otimista.ebitda).toBeGreaterThan(base.ebitda)
    expect(base.ebitda).toBeGreaterThan(pessimista.ebitda)
  })

  it('deve calcular projeção de 3 anos com regressão linear (FORECAST)', () => {
    // Tendência linear pura: x=1 -> 100, x=2 -> 200, x=3 -> 300
    const recs: [number, number, number] = [100, 200, 300]
    const ebs: [number, number, number] = [10, 20, 30]

    const projecao = projetarForecast3Anos(recs, ebs)
    expect(projecao).toHaveLength(3)

    // Ano +1 (x=4) deve ser 400 e 40
    expect(projecao[0].ano).toBe('Ano +1')
    expect(projecao[0].receita).toBe(400)
    expect(projecao[0].ebitda).toBe(40)

    // Ano +2 (x=5) deve ser 500
    expect(projecao[1].receita).toBe(500)
    // Ano +3 (x=6) deve ser 600
    expect(projecao[2].receita).toBe(600)
  })

  it('deve gerar diagnóstico textual por dimensão sem erros', () => {
    const ex = criarExercicioVazio('Ano Atual', '2025')
    const indicadores = calcular25Indicadores(ex)
    const diagnostico = gerarDiagnosticoPorDimensao(indicadores)
    expect(diagnostico).toHaveLength(7)
    expect(diagnostico[0].dimensao).toBe('Liquidez')
  })
})
