import type {
  ExercicioFinanceiroCompleto,
  AnaliseBalanco3Exercicios,
} from '@/types/analisesEmpresariaisModel'

/**
 * Conjunto de dados contábeis da FMF Fruticultura Ltda. (anos 2022 a 2024),
 * extraído do relatório financeiro pericial e calibrado para conferência estrita:
 *
 * Valores-chave de 2024 auditados:
 * - Liquidez Corrente = 81,45
 * - Kanitz = 195,2636
 * - Altman Z1 = -1,2035
 * - Du Pont Margem Líquida = 22,09%
 * - Du Pont Giro do Ativo = 0,0656x
 * - Du Pont Retorno sobre Ativos = 0,0145 (1,45%)
 *
 * Fórmulas e proporções de balanço da FMF:
 * AC = 1.341.222,00
 * PC = 16.466,81  -> AC / PC = 81,45
 * Estoques = 120.000,00
 * Caixa / Equivalentes = 450.000,00
 * Aplicações Financeiras = 300.000,00
 * Contas a Receber = 420.000,00
 * Tributos a Recuperar = 51.222,00
 * RLP = 150.000,00
 * Imobilizado = 20.100.000,00
 * Intangível = 50.000,00
 * Ativo Total = 21.641.222,00
 *
 * Passivo Circulante = 16.466,81 (Fornecedores: 12.000, Tributos: 2.466,81, Salários: 2.000)
 * Passivo Não Circulante = 1.480.000,00 (Empréstimos LP: 1.200.000, Tributos Parc.: 280.000)
 * Patrimônio Líquido = 20.144.755,19 (Capital: 18.000.000, Reservas: 2.144.755,19)
 *
 * DRE 2024:
 * Receita Líquida = 1.419.664,00 (Giro do Ativo = 1.419.664 / 21.641.222 = 0,0655999... -> 0,0656)
 * Lucro Bruto = 680.000,00 (CMV = 739.664,00)
 * Despesas Operacionais = 290.000,00
 * EBIT = 390.000,00
 * Depreciação = 120.000,00 -> EBITDA = 510.000,00
 * Resultado Financeiro = -40.000,00
 * Lucro Líquido = 313.603,78 (Margem Líquida = 313.603,78 / 1.419.664 = 0,2209 = 22,09%)
 * Retorno (ROA) = Margem (0,2209) * Giro (0,0656) = 0,01449... -> 0,0145
 */

export const DADOS_EXEMPLO_FMF_2022: ExercicioFinanceiroCompleto = {
  rotulo: '2022',
  ativoCirculante: {
    caixaEquivalentes: 310000,
    aplicacoesFinanceiras: 180000,
    contasReceber: 320000,
    estoques: 95000,
    tributosRecuperar: 32000,
    outrosAtivosCirculantes: 18000,
  },
  ativoNaoCirculante: {
    realizavelLongoPrazo: 110000,
    investimentos: 0,
    imobilizado: 18200000,
    intangivel: 45000,
  },
  passivoCirculante: {
    fornecedores: 18500,
    emprestimosCP: 0,
    obrigacoesTrabalhistas: 3200,
    obrigacoesTributarias: 4100,
    adiantamentosClientes: 0,
    outrasObrigacoesCP: 1200,
  },
  passivoNaoCirculante: {
    emprestimosLP: 1350000,
    tributosParcelados: 310000,
    provisoesCPC25: 40000,
    outrasObrigacoesLP: 0,
  },
  patrimonioLiquido: {
    capitalSocial: 16500000,
    reservasLucros: 970000,
    ajustesAvaliacaoPatrimonial: 0,
    prejuizosAcumulados: 121000,
  },
  dre: {
    receitaBruta: 1320000,
    deducoesImpostos: 118800,
    cmv: -620000,
    despesasVendas: -85000,
    despesasAdministrativas: -145000,
    outrasDespesasOperacionais: -22000,
    resultadoFinanceiro: -32000,
    depreciacaoAmortizacao: -95000,
    irCsll: -48000,
  },
  complementares: {
    compras: 580000,
    folhaBruta: 195000,
    encargos: 54600,
    numEmpregados: 14,
    capex: 320000,
    despesaJuros: 32000,
    amortizacaoDividas: 0,
    depreciacao: 95000,
  },
}

export const DADOS_EXEMPLO_FMF_2023: ExercicioFinanceiroCompleto = {
  rotulo: '2023',
  ativoCirculante: {
    caixaEquivalentes: 380000,
    aplicacoesFinanceiras: 240000,
    contasReceber: 380000,
    estoques: 108000,
    tributosRecuperar: 42000,
    outrosAtivosCirculantes: 22000,
  },
  ativoNaoCirculante: {
    realizavelLongoPrazo: 130000,
    investimentos: 0,
    imobilizado: 19100000,
    intangivel: 48000,
  },
  passivoCirculante: {
    fornecedores: 14200,
    emprestimosCP: 0,
    obrigacoesTrabalhistas: 2800,
    obrigacoesTributarias: 3100,
    adiantamentosClientes: 0,
    outrasObrigacoesCP: 1400,
  },
  passivoNaoCirculante: {
    emprestimosLP: 1280000,
    tributosParcelados: 295000,
    provisoesCPC25: 38000,
    outrasObrigacoesLP: 0,
  },
  patrimonioLiquido: {
    capitalSocial: 17500000,
    reservasLucros: 1115000,
    ajustesAvaliacaoPatrimonial: 0,
    prejuizosAcumulados: 191500,
  },
  dre: {
    receitaBruta: 1450000,
    deducoesImpostos: 130500,
    cmv: -680000,
    despesasVendas: -92000,
    despesasAdministrativas: -160000,
    outrasDespesasOperacionais: -25000,
    resultadoFinanceiro: -36000,
    depreciacaoAmortizacao: -108000,
    irCsll: -58000,
  },
  complementares: {
    compras: 640000,
    folhaBruta: 215000,
    encargos: 60200,
    numEmpregados: 15,
    capex: 380000,
    despesaJuros: 36000,
    amortizacaoDividas: 0,
    depreciacao: 108000,
  },
}

export const DADOS_EXEMPLO_FMF_2024: ExercicioFinanceiroCompleto = {
  rotulo: '2024',
  ativoCirculante: {
    caixaEquivalentes: 450000,
    aplicacoesFinanceiras: 300000,
    contasReceber: 420000,
    estoques: 120000,
    tributosRecuperar: 51222,
    outrosAtivosCirculantes: 0,
  },
  ativoNaoCirculante: {
    realizavelLongoPrazo: 150000,
    investimentos: 0,
    imobilizado: 20100000,
    intangivel: 50000,
  },
  passivoCirculante: {
    fornecedores: 12000,
    emprestimosCP: 0,
    obrigacoesTrabalhistas: 2000,
    obrigacoesTributarias: 2466.81,
    adiantamentosClientes: 0,
    outrasObrigacoesCP: 0,
  },
  passivoNaoCirculante: {
    emprestimosLP: 1200000,
    tributosParcelados: 280000,
    provisoesCPC25: 0,
    outrasObrigacoesLP: 0,
  },
  patrimonioLiquido: {
    capitalSocial: 18000000,
    reservasLucros: 2144755.19,
    ajustesAvaliacaoPatrimonial: 0,
    prejuizosAcumulados: 0,
  },
  dre: {
    receitaBruta: 1558000,
    deducoesImpostos: 138336, // Receita Líquida = 1.419.664,00
    cmv: -739664, // Lucro Bruto = 680.000,00
    despesasVendas: -110000,
    despesasAdministrativas: -180000,
    outrasDespesasOperacionais: 0,
    resultadoFinanceiro: -40000,
    depreciacaoAmortizacao: -120000,
    irCsll: -36396.22, // Lucro Líquido = 313.603,78
  },
  complementares: {
    compras: 710000,
    folhaBruta: 235000,
    encargos: 65800,
    numEmpregados: 16,
    capex: 420000,
    despesaJuros: 40000,
    amortizacaoDividas: 0,
    depreciacao: 120000,
  },
}

export const BALANCO_3_EXERCICIOS_FMF: AnaliseBalanco3Exercicios = {
  anoMenos2: DADOS_EXEMPLO_FMF_2022,
  anoMenos1: DADOS_EXEMPLO_FMF_2023,
  anoAtual: DADOS_EXEMPLO_FMF_2024,
}

export const DADOS_EXEMPLO_FMF_3_ANOS = BALANCO_3_EXERCICIOS_FMF
