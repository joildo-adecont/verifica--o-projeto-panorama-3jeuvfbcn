import { describe, it, expect } from 'vitest'
import {
  carregarDiagnosticoClientePastore,
  converterBalancetesCumulativosParaLiquidosMensais,
  calcularComparativoCustoFolha,
  parseCnaesSecundarios,
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
      expect(linha.simplesHibrido2027).toBeDefined()
      expect(linha.simplesHibrido2027?.valor).toBeTruthy()
      expect(linha.lucroPresumido?.valor).toBeTruthy()
      expect(linha.reforma2027?.valor).toBeTruthy()

      // Não deve ter menção a 6,3 mi nem 12,5 mi nas linhas
      expect(linha.criterio).not.toContain('12,5')
      expect(linha.criterio).not.toContain('6,3')
      expect(linha.simplesNacional?.detalhe).not.toContain('12,5')
      expect(linha.simplesHibrido2027?.detalhe).not.toContain('12,5')
      expect(linha.lucroPresumido.detalhe).not.toContain('12,5')
      expect(linha.reforma2027.detalhe).not.toContain('12,5')
    }

    // 6. Detalhamento e nota metodológica presentes
    expect(diag.detalhamentoConversao).toHaveLength(7)
    expect(diag.isBalanceteCumulativo).toBe(true)
    expect(diag.notaMetodologicaCumulativa).toContain('cumulativos')
    expect(diag.notaMetodologicaCumulativa).toContain('diferença')
  })

  it('calcula o cenário do Simples Híbrido 2027 com mecânica da LC 214/2025', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { simplesHibrido } = diag

    expect(simplesHibrido).toBeDefined()
    expect(simplesHibrido.sublimite).toBe(3600000)
    expect(simplesHibrido.teto).toBe(4800000)

    // (a) Na projeção atual (~R$ 2,85 mi), o híbrido NÃO é acionado (está abaixo do sublimite de R$ 3,6 mi)
    expect(simplesHibrido.receitaProjetadaAtual).toBeLessThan(3600000)
    expect(simplesHibrido.acionadoNaProjecaoAtual).toBe(false)
    expect(simplesHibrido.cargaProjecaoAtual.parcelaIbsCbsRegular).toBe(0)
    expect(simplesHibrido.cargaProjecaoAtual.creditosAproveitados).toBe(0)
    // Carga é exatamente igual ao Simples puro
    expect(simplesHibrido.cargaProjecaoAtual.cargaTotalAnual).toBeCloseTo(
      simplesHibrido.receitaProjetadaAtual * 0.092,
      1,
    )

    // A receita de julho anualizada encosta no sublimite (R$ 296.986,65 * 12 = ~R$ 3,56 mi)
    expect(simplesHibrido.receitaJulhoAnualizada).toBeGreaterThan(3500000)
    expect(simplesHibrido.receitaJulhoAnualizada).toBeLessThan(3600000)

    // (b) No teto do Simples (R$ 4,8 mi), parcela excedente é de 25% (R$ 1,2 mi) e parcela no sublimite é de 75% (R$ 3,6 mi)
    const teto48 = simplesHibrido.cenarioTeto48
    expect(teto48.receita).toBe(4800000)
    expect(teto48.percentualExcedente).toBeCloseTo(25, 1)
    expect(teto48.parcelaDentroSublimite).toBe(3600000)
    expect(teto48.parcelaExcedenteRegular).toBe(1200000)

    // Crédito pleno das compras sobre a parcela excedente
    expect(teto48.creditosAproveitadosExcedente).toBeGreaterThan(300000)
    expect(teto48.cargaIbsCbsExcedenteLiquida).toBeLessThan(20000)

    // Carga total no teto é substancialmente menor que Simples puro (economia de ~R$ 145k)
    expect(teto48.aliquotaEfetivaPct).toBeGreaterThan(8.5)
    expect(teto48.aliquotaEfetivaPct).toBeLessThan(9.5)
    expect(teto48.cargaTotalAnual).toBeLessThan(teto48.comparativoSimplesPuroTeto)
    expect(teto48.comparativoSimplesPuroTeto - teto48.cargaTotalAnual).toBeGreaterThan(100000)

    // Ponto de virada e justificativa
    expect(simplesHibrido.pontoDeVirada.receitaInicioAcionamento).toBe(3600000)
    expect(simplesHibrido.pontoDeVirada.explicacao).toContain('3.600.000,00')
    expect(simplesHibrido.pontoDeVirada.vantagemVsSimplesPuro).toContain('145.600')
  })

  it('calcula o Lucro Real puro completo com IRPJ, CSLL, PIS/COFINS e custos de conformidade', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { lucroRealPuro } = diag

    expect(lucroRealPuro).toBeDefined()
    expect(lucroRealPuro.receitaBruta).toBeCloseTo(diag.receitaAnualizada, 2)
    expect(lucroRealPuro.margemLucroRealPct).toBeCloseTo(diag.margemRetidaLiquidaPct, 2)

    // Lucro real derivado dos balancetes (~R$ 124 mil/ano)
    expect(lucroRealPuro.lucroRealAnualEstimado).toBeGreaterThan(110000)
    expect(lucroRealPuro.lucroRealAnualEstimado).toBeLessThan(140000)

    // Isento de adicional de 10% do IRPJ porque lucro <= R$ 240 mil/ano (R$ 20 mil/mês)
    expect(lucroRealPuro.limiteIsencaoAdicionalIrpj).toBe(240000)
    expect(lucroRealPuro.lucroExcedenteAdicional).toBe(0)
    expect(lucroRealPuro.irpjAdicional10).toBe(0)

    // IRPJ base 15% e CSLL 9%
    expect(lucroRealPuro.irpjBase15).toBeCloseTo(lucroRealPuro.lucroRealAnualEstimado * 0.15, 2)
    expect(lucroRealPuro.csll9).toBeCloseTo(lucroRealPuro.lucroRealAnualEstimado * 0.09, 2)
    expect(lucroRealPuro.irpjCsllConsolidado).toBeCloseTo(
      lucroRealPuro.irpjBase15 + lucroRealPuro.csll9,
      2,
    )
    expect(lucroRealPuro.irpjCsllAliquotaEfetivaPct).toBeLessThan(1.5) // ~1,04%

    // PIS e COFINS não-cumulativos
    expect(lucroRealPuro.pisNaoCumulativoAliqPct).toBe(1.65)
    expect(lucroRealPuro.cofinsNaoCumulativoAliqPct).toBe(7.6)
    expect(lucroRealPuro.comprasInsumosAnual).toBeGreaterThan(2500000)

    // Obrigações acessórias completas listadas (ECD, ECF, etc.)
    expect(lucroRealPuro.obrigacoesAcessorias.length).toBeGreaterThanOrEqual(4)
    const nomesObrigacoes = lucroRealPuro.obrigacoesAcessorias.map((o) => o.nome).join(' ')
    expect(nomesObrigacoes).toContain('ECD')
    expect(nomesObrigacoes).toContain('ECF')
    expect(nomesObrigacoes).toContain('EFD')
    expect(lucroRealPuro.custoConformidadeAnualEstimado).toBeGreaterThan(15000)
  })

  it('consolida tabela de valores em R$, percentuais e vantagens/desvantagens por regime', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { tabelaValoresPercentuais } = diag

    expect(tabelaValoresPercentuais).toBeDefined()
    expect(tabelaValoresPercentuais).toHaveLength(5)

    const ids = tabelaValoresPercentuais.map((t) => t.regimeId)
    expect(ids).toEqual([
      'simples',
      'simples_hibrido',
      'lucro_presumido',
      'lucro_real_puro',
      'reforma_2027',
    ])

    const simples = tabelaValoresPercentuais.find((t) => t.regimeId === 'simples')!
    expect(simples.ehRegimeReferencia).toBe(true)
    expect(simples.diferencaVsSimplesBrl).toBe(0)
    expect(simples.diferencaVsSimplesPontosPct).toBe(0)
    expect(simples.vantagens.length).toBeGreaterThanOrEqual(3)
    expect(simples.desvantagens.length).toBeGreaterThanOrEqual(2)

    const presumido = tabelaValoresPercentuais.find((t) => t.regimeId === 'lucro_presumido')!
    // Lucro Presumido tem custo superior ao Simples (+R$ 90k+)
    expect(presumido.diferencaVsSimplesBrl).toBeGreaterThan(80000)
    expect(presumido.diferencaVsSimplesPontosPct).toBeGreaterThan(2)

    const reforma = tabelaValoresPercentuais.find((t) => t.regimeId === 'reforma_2027')!
    expect(reforma.melhorRegimeLongoPrazo).toBe(true)
    // Reforma tem economia vs Simples
    expect(reforma.diferencaVsSimplesBrl).toBeLessThan(0)
    expect(reforma.aliquotaEfetivaPct).toBeLessThan(simples.aliquotaEfetivaPct)

    // Todos os 5 regimes devem ter vantagens e desvantagens detalhadas
    for (const item of tabelaValoresPercentuais) {
      expect(item.cargaAnualEstimada).toBeGreaterThan(0)
      expect(item.aliquotaEfetivaPct).toBeGreaterThan(0)
      expect(item.vantagens.length).toBeGreaterThanOrEqual(2)
      expect(item.desvantagens.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('detalha a linha do tempo da transição 2026 a 2033 (LC 214/2025) com impactos para a Pastore', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { linhaDoTempoTransicao } = diag

    expect(linhaDoTempoTransicao).toBeDefined()
    expect(linhaDoTempoTransicao.length).toBeGreaterThanOrEqual(5)

    const anos = linhaDoTempoTransicao.map((m) => String(m.ano))
    expect(anos).toContain('2026')
    expect(anos).toContain('2027')
    expect(anos).toContain('2028')
    expect(anos).toContain('2029')
    expect(anos).toContain('2030–2032')
    expect(anos).toContain('2033')

    const marco2026 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2026')!
    expect(marco2026.fase).toContain('Ano-Teste')
    expect(marco2026.simplesCabivel).toBe(true)
    expect(marco2026.faseDecisao).toBe(false)

    // Recorte 2027-2029: Fase de Decisão
    const marco2027 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2027')!
    expect(marco2027.titulo).toContain('CBS')
    expect(marco2027.creditoComprasValendo).toBe(true)
    expect(marco2027.faseDecisao).toBe(true)
    expect(marco2027.acaoRecomendadaAdecont).toContain('FASE DE DECISÃO (MOMENTO DA MIGRAÇÃO)')

    const marco2028 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2028')!
    expect(marco2028.faseDecisao).toBe(true)
    expect(marco2028.acaoRecomendadaAdecont).toContain('FASE DE DECISÃO (AJUSTE AO REGIME REGULAR)')

    const marco2029 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2029')!
    expect(marco2029.faseDecisao).toBe(true)
    expect(marco2029.acaoRecomendadaAdecont).toContain(
      'FASE DE DECISÃO (CONSOLIDAÇÃO E REVISÃO DA CARGA)',
    )

    const marco2030 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2030–2032')!
    expect(marco2030.faseDecisao).toBe(false)

    const marco2033 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2033')!
    expect(marco2033.titulo).toContain('2033')
    expect(marco2033.faseDecisao).toBe(false)
    expect(marco3033Fim(marco2033)).toBe(true)
  })

  it('inclui pontos de atenção positivos e negativos por ano na linha do tempo com fundamento legal', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { linhaDoTempoTransicao } = diag

    expect(linhaDoTempoTransicao).toBeDefined()

    for (const marco of linhaDoTempoTransicao) {
      expect(marco.pontosPositivos).toBeDefined()
      expect(marco.pontosPositivos!.length).toBeGreaterThanOrEqual(2)
      expect(marco.pontosPositivos!.length).toBeLessThanOrEqual(4)

      expect(marco.pontosNegativos).toBeDefined()
      expect(marco.pontosNegativos!.length).toBeGreaterThanOrEqual(2)
      expect(marco.pontosNegativos!.length).toBeLessThanOrEqual(4)

      // Verificar que cada ponto positivo e negativo possui título, descrição e dispositivo legal
      for (const pos of marco.pontosPositivos!) {
        expect(pos.titulo.length).toBeGreaterThan(5)
        expect(pos.descricao.length).toBeGreaterThan(10)
        expect(pos.dispositivoLegal.length).toBeGreaterThan(3)
      }

      for (const neg of marco.pontosNegativos!) {
        expect(neg.titulo.length).toBeGreaterThan(5)
        expect(neg.descricao.length).toBeGreaterThan(10)
        expect(neg.dispositivoLegal.length).toBeGreaterThan(3)
      }
    }

    // Conferir especificidades do cliente Pastore em 2026 e 2027
    const marco2026 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2026')!
    expect(
      marco2026.pontosPositivos!.some(
        (p) => p.dispositivoLegal.includes('549') || p.dispositivoLegal.includes('336'),
      ),
    ).toBe(true)
    expect(
      marco2026.pontosNegativos!.some(
        (p) => p.dispositivoLegal.includes('CGIBS') || p.dispositivoLegal.includes('2.215'),
      ),
    ).toBe(true)

    const marco2027 = linhaDoTempoTransicao.find((m) => String(m.ano) === '2027')!
    expect(
      marco2027.pontosPositivos!.some(
        (p) => p.dispositivoLegal.includes('COSIT') || p.dispositivoLegal.includes('28'),
      ),
    ).toBe(true)
    expect(
      marco2027.pontosNegativos!.some(
        (p) =>
          p.dispositivoLegal.includes('14/2026') ||
          p.dispositivoLegal.includes('Split Payment') ||
          p.dispositivoLegal.includes('49'),
      ),
    ).toBe(true)
  })

  it('alimenta bloco de evolução recente da legislação a partir do agente atualizador com badges e alertas', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { evolucaoLegislativaRecente } = diag

    expect(evolucaoLegislativaRecente).toBeDefined()
    expect(evolucaoLegislativaRecente!.length).toBeGreaterThanOrEqual(5)

    const tipos = evolucaoLegislativaRecente!.map((e) => e.tipo)
    // Contém inclusões, alterações e exclusões
    expect(tipos).toContain('inclusao')
    expect(tipos).toContain('alteracao')

    for (const item of evolucaoLegislativaRecente!) {
      expect(item.id).toBeDefined()
      expect(item.codigoNorma.length).toBeGreaterThan(2)
      expect(item.tituloNorma.length).toBeGreaterThan(3)
      expect(item.resumo.length).toBeGreaterThan(5)
      expect(['inclusao', 'alteracao', 'exclusao']).toContain(item.tipo)
    }
  })

  it('extrai enquadramento tributário e CNAEs secundários do cadastro da empresa Pastore', async () => {
    const diag = await carregarDiagnosticoClientePastore()

    expect(diag.enquadramentoTributarioAtual).toBeDefined()
    expect(diag.enquadramentoTributarioAtual).toContain('Simples Nacional')

    expect(diag.cnaesSecundariosLista).toBeDefined()
    expect(diag.cnaesSecundariosLista.length).toBeGreaterThanOrEqual(1)

    const codigosCnae = diag.cnaesSecundariosLista.map((c) => c.codigo)
    expect(codigosCnae).toContain('4530-7/03') // Comércio a varejo de autopeças

    for (const cnae of diag.cnaesSecundariosLista) {
      expect(cnae.codigo).toBeTruthy()
      expect(cnae.descricao).toBeTruthy()
    }
  })

  it('avalia bloco de folha de pagamento e compara custo entre Lucro Real e Presumido', async () => {
    const diag = await carregarDiagnosticoClientePastore()
    const { folhaPagamento, comparativoCustoFolha } = diag

    expect(folhaPagamento).toBeDefined()
    expect(folhaPagamento.numFuncionarios).toBeGreaterThanOrEqual(1)
    expect(folhaPagamento.folhaSalarialMensal).toBeGreaterThan(10000)
    expect(folhaPagamento.encargosMensais).toBeGreaterThan(1000)
    expect(folhaPagamento.custoTotalMensal).toBe(
      folhaPagamento.folhaSalarialMensal + folhaPagamento.encargosMensais,
    )
    expect(folhaPagamento.origemDados).toBeDefined()
    expect(['cadastro', 'balancete', 'estimado']).toContain(folhaPagamento.origemDados)

    // Comparativo de custo de folha
    expect(comparativoCustoFolha).toBeDefined()
    expect(comparativoCustoFolha.regimes).toHaveLength(5)

    const simples = comparativoCustoFolha.regimes.find((r) => r.regimeId === 'simples')!
    expect(simples.temCppSeparada).toBe(false)
    expect(simples.encargoPrevidenciarioPatronalAnual).toBe(0)
    expect(simples.impactoVsSimplesBrl).toBe(0)

    const simplesHibrido = comparativoCustoFolha.regimes.find(
      (r) => r.regimeId === 'simples_hibrido',
    )!
    expect(simplesHibrido.temCppSeparada).toBe(false)
    expect(simplesHibrido.encargoPrevidenciarioPatronalAnual).toBe(0)

    const presumido = comparativoCustoFolha.regimes.find((r) => r.regimeId === 'lucro_presumido')!
    expect(presumido.temCppSeparada).toBe(true)
    expect(presumido.aliquotaInssPatronalPct).toBe(20.0)
    expect(presumido.encargoPrevidenciarioPatronalAnual).toBeGreaterThan(0)
    expect(presumido.dedutibilidadeIrpjCsll).toBe(false)
    expect(presumido.economiaFiscalIrpjCsllAnual).toBe(0)
    expect(presumido.impactoVsSimplesBrl).toBeGreaterThan(0)

    const lucroReal = comparativoCustoFolha.regimes.find((r) => r.regimeId === 'lucro_real_puro')!
    expect(lucroReal.temCppSeparada).toBe(true)
    expect(lucroReal.dedutibilidadeIrpjCsll).toBe(true)
    expect(lucroReal.economiaFiscalIrpjCsllAnual).toBeGreaterThan(0)

    // Vantagem do Lucro Real sobre o Presumido quanto ao componente da folha
    expect(comparativoCustoFolha.diferencaRealVsPresumidoBrl).toBeGreaterThan(0)
    expect(lucroReal.custoFolhaLiquidoAnual).toBeLessThan(presumido.custoFolhaLiquidoAnual)

    // Nota metodológica explícita de Simples/Simples Híbrido sem destaque de CPP
    expect(comparativoCustoFolha.notaSimplesSemDestaque).toContain('Simples Nacional')
    expect(comparativoCustoFolha.notaSimplesSemDestaque).toContain('Simples Híbrido')
    expect(comparativoCustoFolha.notaSimplesSemDestaque).toContain('DAS')
  })

  it('função auxiliar parseCnaesSecundarios trata formatos variados com fallback', () => {
    const lista1 = parseCnaesSecundarios(null)
    expect(lista1.length).toBeGreaterThan(0)

    const lista2 = parseCnaesSecundarios('4530703; 4520002')
    expect(lista2.some((c) => c.codigo === '4530-7/03')).toBe(true)
    expect(lista2.some((c) => c.codigo === '4520-0/02')).toBe(true)

    const calc = calcularComparativoCustoFolha({
      numFuncionarios: 10,
      folhaSalarialMensal: 30000,
      encargosMensais: 5000,
      custoTotalMensal: 35000,
      folhaSalarialAnual: 399900,
      encargosAnuais: 60000,
      custoTotalAnual: 459900,
      proLaboreMensalEstimado: 4863,
      origemDados: 'cadastro',
      detalheOrigem: 'teste unitário',
    })

    expect(calc.diferencaRealVsPresumidoBrl).toBeGreaterThan(10000)
  })
})

function marco3033Fim(marco: any) {
  return marco.mecanicaLegislativa.includes('Extinção total') || marco.fase.includes('Pleno')
}
