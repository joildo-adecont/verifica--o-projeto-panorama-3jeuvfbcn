import type {
  ExercicioFinanceiroCompleto,
  BalancoDRECalculado,
  ItemIndicador,
  StatusSemaforo,
  BlocoScorePonderado,
  ScorePonderadoResultado,
  SimuladorCenariosItem,
  ProjecaoForecastAno,
  DimensaoDiagnostico,
} from '@/types/analisesEmpresariaisModel'

/**
 * Cria estrutura vazia de um exercício financeiro
 */
export function criarExercicioVazio(
  rotulo: string,
  anoCalendario = '',
): ExercicioFinanceiroCompleto {
  return {
    rotulo,
    anoCalendario,
    ativoCirculante: {
      caixaEquivalentes: 0,
      aplicacoesFinanceiras: 0,
      contasReceber: 0,
      estoques: 0,
      tributosRecuperar: 0,
      outrosAtivosCirculantes: 0,
    },
    ativoNaoCirculante: {
      realizavelLongoPrazo: 0,
      investimentos: 0,
      imobilizado: 0,
      intangivel: 0,
    },
    passivoCirculante: {
      fornecedores: 0,
      emprestimosCP: 0,
      obrigacoesTrabalhistas: 0,
      obrigacoesTributarias: 0,
      adiantamentosClientes: 0,
      outrasObrigacoesCP: 0,
    },
    passivoNaoCirculante: {
      outrasObrigacoesLP: 0,
      emprestimosLP: 0,
      provisoesCPC25: 0,
      tributosParcelados: 0,
    },
    patrimonioLiquido: {
      capitalSocial: 0,
      reservasLucros: 0,
      ajustesAvaliacaoPatrimonial: 0,
      prejuizosAcumulados: 0,
    },
    dre: {
      receitaBruta: 0,
      deducoesImpostos: 0,
      cmv: 0,
      despesasVendas: 0,
      despesasAdministrativas: 0,
      outrasDespesasOperacionais: 0,
      depreciacaoAmortizacao: 0,
      resultadoFinanceiro: 0,
      irCsll: 0,
    },
    complementares: {
      depreciacao: 0,
      despesaJuros: 0,
      compras: 0,
      numEmpregados: 0,
      folhaBruta: 0,
      encargos: 0,
      capex: 0,
      amortizacaoDividas: 0,
    },
  }
}

/**
 * Calcula totais patrimoniais e DRE de um exercício
 */
export function calcularTotaisExercicio(ex: ExercicioFinanceiroCompleto): BalancoDRECalculado {
  const ac = ex.ativoCirculante
  const anc = ex.ativoNaoCirculante
  const pc = ex.passivoCirculante
  const pnc = ex.passivoNaoCirculante
  const pl = ex.patrimonioLiquido
  const dre = ex.dre

  const totalAtivoCirculante =
    (ac.caixaEquivalentes || 0) +
    (ac.aplicacoesFinanceiras || 0) +
    (ac.contasReceber || 0) +
    (ac.estoques || 0) +
    (ac.tributosRecuperar || 0) +
    (ac.outrosAtivosCirculantes || 0)

  const totalAtivoNaoCirculante =
    (anc.realizavelLongoPrazo || 0) +
    (anc.investimentos || 0) +
    (anc.imobilizado || 0) +
    (anc.intangivel || 0)

  const ativoTotal = totalAtivoCirculante + totalAtivoNaoCirculante

  const totalPassivoCirculante =
    (pc.fornecedores || 0) +
    (pc.emprestimosCP || 0) +
    (pc.obrigacoesTrabalhistas || 0) +
    (pc.obrigacoesTributarias || 0) +
    (pc.adiantamentosClientes || 0) +
    (pc.outrasObrigacoesCP || 0)

  const totalPassivoNaoCirculante =
    (pnc.outrasObrigacoesLP || 0) +
    (pnc.emprestimosLP || 0) +
    (pnc.provisoesCPC25 || 0) +
    (pnc.tributosParcelados || 0)

  const totalPatrimonioLiquido =
    (pl.capitalSocial || 0) +
    (pl.reservasLucros || 0) +
    (pl.ajustesAvaliacaoPatrimonial || 0) +
    (pl.prejuizosAcumulados || 0)

  const passivoTotalComPL =
    totalPassivoCirculante + totalPassivoNaoCirculante + totalPatrimonioLiquido
  const diferencaConferencia = ativoTotal - passivoTotalComPL

  // DRE
  // deducoesImpostos e cmv são tipicamente negativos na planilha modelo
  const receitaBruta = dre.receitaBruta || 0
  const deducoes = dre.deducoesImpostos || 0
  const receitaLiquida = receitaBruta + deducoes // Se deducoes for negativo, diminui; se for positivo mas deduções, trata
  const cmv = dre.cmv || 0
  const lucroBruto = receitaLiquida + cmv // cmv negativo

  const despVendas = dre.despesasVendas || 0
  const despAdmin = dre.despesasAdministrativas || 0
  const outrasDesp = dre.outrasDespesasOperacionais || 0

  const ebit = lucroBruto + despVendas + despAdmin + outrasDesp

  const depAmort = dre.depreciacaoAmortizacao || ex.complementares.depreciacao || 0
  const ebitda = ebit + Math.abs(depAmort)

  const resFin = dre.resultadoFinanceiro || 0
  const lair = ebit + resFin

  const irCsll = dre.irCsll || 0
  const lucroLiquido = lair + irCsll

  return {
    totalAtivoCirculante,
    totalAtivoNaoCirculante,
    ativoTotal,
    totalPassivoCirculante,
    totalPassivoNaoCirculante,
    totalPatrimonioLiquido,
    passivoTotalComPL,
    diferencaConferencia,
    receitaLiquida,
    lucroBruto,
    ebit,
    ebitda,
    lair,
    lucroLiquido,
  }
}

/**
 * Calcula variação horizontal AH% entre dois valores: ((atual - base) / base) * 100
 */
export function calcularAH(valorBase: number, valorAtual: number): number | null {
  if (valorBase === 0) return null
  return ((valorAtual - valorBase) / Math.abs(valorBase)) * 100
}

/**
 * Calcula variação vertical AV% de uma linha em relação à base: (valor / baseTotal) * 100
 */
export function calcularAV(valor: number, baseTotal: number): number | null {
  if (baseTotal === 0) return null
  return (valor / baseTotal) * 100
}

/**
 * Calcula os 25 indicadores comparativos com semáforo baseado nas regras do modelo
 */
export function calcular25Indicadores(ex: ExercicioFinanceiroCompleto): ItemIndicador[] {
  const calc = calcularTotaisExercicio(ex)
  const ac = ex.ativoCirculante
  const anc = ex.ativoNaoCirculante
  const pc = ex.passivoCirculante
  const pnc = ex.passivoNaoCirculante
  const pl = ex.patrimonioLiquido
  const dre = ex.dre
  const comp = ex.complementares

  const ativoCirculante = calc.totalAtivoCirculante
  const passivoCirculante = calc.totalPassivoCirculante
  const realizavelLP = anc.realizavelLongoPrazo || 0
  const passivoNaoCirculante = calc.totalPassivoNaoCirculante
  const patrimonioLiquido = calc.totalPatrimonioLiquido
  const receitaLiquida = calc.receitaLiquida
  const lucroBruto = calc.lucroBruto
  const ebitda = calc.ebitda
  const ebit = calc.ebit
  const lucroLiquido = calc.lucroLiquido
  const ativoTotal = calc.ativoTotal

  const estoque = ac.estoques || 0
  const disponivel = (ac.caixaEquivalentes || 0) + (ac.aplicacoesFinanceiras || 0)
  const contasReceber = ac.contasReceber || 0
  const fornecedores = pc.fornecedores || 0

  const dividaTotal =
    (pc.emprestimosCP || 0) + (pnc.emprestimosLP || 0) + (pnc.tributosParcelados || 0)
  const dividaLiquida = dividaTotal - disponivel

  // 1. Liquidez Corrente = AC / PC (ref: > 1,5)
  const liqCorrente = passivoCirculante > 0 ? ativoCirculante / passivoCirculante : 0
  const semLiqCorrente: StatusSemaforo =
    liqCorrente >= 1.5 ? 'saudavel' : liqCorrente >= 1.0 ? 'atencao' : 'critico'

  // 2. Liquidez Seca = (AC - Estoques) / PC (ref: > 1,0)
  const liqSeca = passivoCirculante > 0 ? (ativoCirculante - estoque) / passivoCirculante : 0
  const semLiqSeca: StatusSemaforo =
    liqSeca >= 1.0 ? 'saudavel' : liqSeca >= 0.7 ? 'atencao' : 'critico'

  // 3. Liquidez Imediata = Disponível / PC (ref: > 0,3)
  const liqImediata = passivoCirculante > 0 ? disponivel / passivoCirculante : 0
  const semLiqImediata: StatusSemaforo =
    liqImediata >= 0.3 ? 'saudavel' : liqImediata >= 0.15 ? 'atencao' : 'critico'

  // 4. Liquidez Geral = (AC + RLP) / (PC + PNC) (ref: > 1,0)
  const passivoExigivel = passivoCirculante + passivoNaoCirculante
  const liqGeral = passivoExigivel > 0 ? (ativoCirculante + realizavelLP) / passivoExigivel : 0
  const semLiqGeral: StatusSemaforo =
    liqGeral >= 1.0 ? 'saudavel' : liqGeral >= 0.8 ? 'atencao' : 'critico'

  // 5. Capital Circulante Líquido (CCL) = AC - PC (ref: > 0)
  const ccl = ativoCirculante - passivoCirculante
  const semCcl: StatusSemaforo = ccl > 0 ? 'saudavel' : ccl === 0 ? 'atencao' : 'critico'

  // 6. Participação de Capital de Terceiros = (PC + PNC) / Ativo Total (ref: < 0,60)
  const pct = ativoTotal > 0 ? passivoExigivel / ativoTotal : 0
  const semPct: StatusSemaforo = pct <= 0.6 ? 'saudavel' : pct <= 0.8 ? 'atencao' : 'critico'

  // 7. Composição do Endividamento = PC / (PC + PNC) (ref: < 0,60)
  const ce = passivoExigivel > 0 ? passivoCirculante / passivoExigivel : 0
  const semCe: StatusSemaforo = ce <= 0.6 ? 'saudavel' : ce <= 0.75 ? 'atencao' : 'critico'

  // 8. Grau de Endividamento = (PC + PNC) / PL (ref: < 1,5)
  const ge = patrimonioLiquido > 0 ? passivoExigivel / patrimonioLiquido : 999
  const semGe: StatusSemaforo = ge <= 1.5 ? 'saudavel' : ge <= 3.0 ? 'atencao' : 'critico'

  // 9. Dívida Líquida (ref: baixa / negativa)
  const semDividaLiq: StatusSemaforo =
    dividaLiquida <= 0 ? 'saudavel' : dividaLiquida < ebitda * 2 ? 'atencao' : 'critico'

  // 10. Dívida Líquida / EBITDA (ref: < 2,0x)
  const dlEbitda = ebitda > 0 ? dividaLiquida / ebitda : dividaLiquida <= 0 ? 0 : 999
  const semDlEbitda: StatusSemaforo =
    dlEbitda <= 2.0 ? 'saudavel' : dlEbitda <= 3.5 ? 'atencao' : 'critico'

  // 11. Dívida Líquida / PL (ref: < 1,0x)
  const dlPl = patrimonioLiquido > 0 ? dividaLiquida / patrimonioLiquido : 999
  const semDlPl: StatusSemaforo = dlPl <= 1.0 ? 'saudavel' : dlPl <= 2.0 ? 'atencao' : 'critico'

  // 12. Margem Bruta = Lucro Bruto / Receita Líquida (ref: > 20%)
  const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0
  const semMargemBruta: StatusSemaforo =
    margemBruta >= 20 ? 'saudavel' : margemBruta >= 10 ? 'atencao' : 'critico'

  // 13. Margem EBITDA = EBITDA / Receita Líquida (ref: > 12%)
  const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0
  const semMargemEbitda: StatusSemaforo =
    margemEbitda >= 12 ? 'saudavel' : margemEbitda >= 6 ? 'atencao' : 'critico'

  // 14. Margem Operacional = EBIT / Receita Líquida (ref: > 8%)
  const margemOperacional = receitaLiquida > 0 ? (ebit / receitaLiquida) * 100 : 0
  const semMargemOperacional: StatusSemaforo =
    margemOperacional >= 8 ? 'saudavel' : margemOperacional >= 3 ? 'atencao' : 'critico'

  // 15. Margem Líquida = Lucro Líquido / Receita Líquida (ref: > 5%)
  const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0
  const semMargemLiquida: StatusSemaforo =
    margemLiquida >= 5 ? 'saudavel' : margemLiquida >= 0 ? 'atencao' : 'critico'

  // 16. ROA = Lucro Líquido / Ativo Total (ref: > 4%)
  const roa = ativoTotal > 0 ? (lucroLiquido / ativoTotal) * 100 : 0
  const semRoa: StatusSemaforo = roa >= 4 ? 'saudavel' : roa >= 1 ? 'atencao' : 'critico'

  // 17. ROE = Lucro Líquido / PL (ref: > 10%)
  const roe = patrimonioLiquido > 0 ? (lucroLiquido / patrimonioLiquido) * 100 : 0
  const semRoe: StatusSemaforo = roe >= 10 ? 'saudavel' : roe >= 0 ? 'atencao' : 'critico'

  // 18. Giro do Ativo = Receita Líquida / Ativo Total (ref: > 1,0x)
  const giroAtivo = ativoTotal > 0 ? receitaLiquida / ativoTotal : 0
  const semGiroAtivo: StatusSemaforo =
    giroAtivo >= 1.0 ? 'saudavel' : giroAtivo >= 0.6 ? 'atencao' : 'critico'

  // 19. PMR = (Contas a Receber / Receita Bruta ou Líquida) * 360 (ref: < 60d)
  const baseReceitaDia = receitaLiquida > 0 ? receitaLiquida / 360 : 1
  const pmr = contasReceber / baseReceitaDia
  const semPmr: StatusSemaforo = pmr <= 60 ? 'saudavel' : pmr <= 90 ? 'atencao' : 'critico'

  // 20. PMP = (Fornecedores / Compras ou CMV) * 360 (ref: < 60d)
  const compras = comp.compras > 0 ? comp.compras : Math.abs(dre.cmv || 1)
  const baseComprasDia = compras > 0 ? compras / 360 : 1
  const pmp = fornecedores / baseComprasDia
  const semPmp: StatusSemaforo = pmp <= 60 ? 'saudavel' : pmp <= 90 ? 'atencao' : 'critico'

  // 21. PME = (Estoques / CMV) * 360 (ref: < 60d)
  const cmvPositivo = Math.abs(dre.cmv || 1)
  const baseCmvDia = cmvPositivo > 0 ? cmvPositivo / 360 : 1
  const pme = estoque / baseCmvDia
  const semPme: StatusSemaforo = pme <= 60 ? 'saudavel' : pme <= 90 ? 'atencao' : 'critico'

  // 22. Ciclo Operacional = PMR + PME (ref: < 120d)
  const cicloOperacional = pmr + pme
  const semCicloOper: StatusSemaforo =
    cicloOperacional <= 120 ? 'saudavel' : cicloOperacional <= 180 ? 'atencao' : 'critico'

  // 23. Ciclo Financeiro = Ciclo Operacional - PMP (ref: < 90d)
  const cicloFinanceiro = cicloOperacional - pmp
  const semCicloFin: StatusSemaforo =
    cicloFinanceiro <= 90 ? 'saudavel' : cicloFinanceiro <= 120 ? 'atencao' : 'critico'

  // 24. DSCR (Índice de Cobertura do Serviço da Dívida) = EBITDA / (Juros + Amortização) (ref: > 1,3x)
  const servicoDivida = (comp.despesaJuros || 0) + (comp.amortizacaoDividas || 0)
  const dscr = servicoDivida > 0 ? ebitda / servicoDivida : ebitda > 0 ? 5.0 : 0
  const semDscr: StatusSemaforo = dscr >= 1.3 ? 'saudavel' : dscr >= 1.0 ? 'atencao' : 'critico'

  // 25. CAPEX / Receita Líquida (ref: > 2%)
  const capex = comp.capex || 0
  const capexReceita = receitaLiquida > 0 ? (capex / receitaLiquida) * 100 : 0
  const semCapex: StatusSemaforo =
    capexReceita >= 2.0 ? 'saudavel' : capexReceita >= 1.0 ? 'atencao' : 'critico'

  return [
    {
      id: 'liq_corrente',
      nome: 'Liquidez corrente',
      formula: 'Ativo Circulante / Passivo Circulante',
      referencia: '> 1,5',
      unidade: 'fator',
      valor: liqCorrente,
      semaforo: semLiqCorrente,
      explicacao: 'Mede a capacidade de honrar obrigações de curto prazo com ativos circulantes.',
    },
    {
      id: 'liq_seca',
      nome: 'Liquidez seca',
      formula: '(Ativo Circulante - Estoques) / Passivo Circulante',
      referencia: '> 1,0',
      unidade: 'fator',
      valor: liqSeca,
      semaforo: semLiqSeca,
      explicacao: 'Capacidade de liquidação imediata sem depender da venda de estoques.',
    },
    {
      id: 'liq_imediata',
      nome: 'Liquidez imediata',
      formula: 'Disponibilidades / Passivo Circulante',
      referencia: '> 0,3',
      unidade: 'fator',
      valor: liqImediata,
      semaforo: semLiqImediata,
      explicacao:
        'Recursos disponíveis imediatamente (caixa e bancos) frente às dívidas de curto prazo.',
    },
    {
      id: 'liq_geral',
      nome: 'Liquidez geral',
      formula: '(AC + RLP) / (PC + PNC)',
      referencia: '> 1,0',
      unidade: 'fator',
      valor: liqGeral,
      semaforo: semLiqGeral,
      explicacao: 'Capacidade total de honrar obrigações de curto e longo prazo.',
    },
    {
      id: 'ccl',
      nome: 'Capital circulante líquido',
      formula: 'Ativo Circulante - Passivo Circulante',
      referencia: '> 0',
      unidade: 'moeda',
      valor: ccl,
      semaforo: semCcl,
      explicacao: 'Volume monetário de folga de liquidez operacional no giro.',
    },
    {
      id: 'pct',
      nome: 'Participação de capital de terceiros',
      formula: '(PC + PNC) / Ativo Total',
      referencia: '< 0,60',
      unidade: 'fator',
      valor: pct,
      semaforo: semPct,
      explicacao: 'Percentual do ativo financiado por credores externos.',
    },
    {
      id: 'comp_endividamento',
      nome: 'Composição do endividamento',
      formula: 'Passivo Circulante / (PC + PNC)',
      referencia: '< 0,60',
      unidade: 'fator',
      valor: ce,
      semaforo: semCe,
      explicacao: 'Proporção da dívida total exigível no curto prazo.',
    },
    {
      id: 'grau_endividamento',
      nome: 'Grau de endividamento',
      formula: '(PC + PNC) / Patrimônio Líquido',
      referencia: '< 1,5',
      unidade: 'fator',
      valor: ge,
      semaforo: semGe,
      explicacao: 'Alavancagem patrimonial e comprometimento do patrimônio dos sócios.',
    },
    {
      id: 'divida_liquida',
      nome: 'Dívida líquida',
      formula: 'Empréstimos (CP+LP) - Disponibilidades',
      referencia: 'baixa',
      unidade: 'moeda',
      valor: dividaLiquida,
      semaforo: semDividaLiq,
      explicacao: 'Endividamento financeiro bancário líquido de disponibilidades.',
    },
    {
      id: 'div_liq_ebitda',
      nome: 'Dívida líquida / EBITDA',
      formula: 'Dívida Líquida / EBITDA',
      referencia: '< 2,0x',
      unidade: 'fator',
      valor: dlEbitda,
      semaforo: semDlEbitda,
      explicacao: 'Anos necessários para pagar a dívida líquida com a geração operacional.',
    },
    {
      id: 'div_liq_pl',
      nome: 'Dívida líquida / PL',
      formula: 'Dívida Líquida / Patrimônio Líquido',
      referencia: '< 1,0x',
      unidade: 'fator',
      valor: dlPl,
      semaforo: semDlPl,
      explicacao: 'Proporção entre a dívida líquida e os recursos próprios.',
    },
    {
      id: 'margem_bruta',
      nome: 'Margem bruta',
      formula: 'Lucro Bruto / Receita Líquida',
      referencia: '> 20%',
      unidade: 'percentual',
      valor: margemBruta,
      semaforo: semMargemBruta,
      explicacao: 'Retorno gerado pela atividade após custos diretos de vendas/serviços.',
    },
    {
      id: 'margem_ebitda',
      nome: 'Margem EBITDA',
      formula: 'EBITDA / Receita Líquida',
      referencia: '> 12%',
      unidade: 'percentual',
      valor: margemEbitda,
      semaforo: semMargemEbitda,
      explicacao: 'Geração operacional pura de caixa sobre o faturamento líquido.',
    },
    {
      id: 'margem_operacional',
      nome: 'Margem operacional',
      formula: 'EBIT / Receita Líquida',
      referencia: '> 8%',
      unidade: 'percentual',
      valor: margemOperacional,
      semaforo: semMargemOperacional,
      explicacao: 'Eficiência operacional incluindo depreciações e despesas estruturais.',
    },
    {
      id: 'margem_liquida',
      nome: 'Margem líquida',
      formula: 'Lucro Líquido / Receita Líquida',
      referencia: '> 5%',
      unidade: 'percentual',
      valor: margemLiquida,
      semaforo: semMargemLiquida,
      explicacao: 'Rentabilidade final retida após todos os tributos e resultado financeiro.',
    },
    {
      id: 'roa',
      nome: 'ROA (Retorno sobre Ativo)',
      formula: 'Lucro Líquido / Ativo Total',
      referencia: '> 4%',
      unidade: 'percentual',
      valor: roa,
      semaforo: semRoa,
      explicacao: 'Capacidade dos ativos totais em gerar lucro líquido.',
    },
    {
      id: 'roe',
      nome: 'ROE (Retorno sobre Patrimônio Líquido)',
      formula: 'Lucro Líquido / Patrimônio Líquido',
      referencia: '> 10%',
      unidade: 'percentual',
      valor: roe,
      semaforo: semRoe,
      explicacao: 'Remuneração do capital investido pelos sócios.',
    },
    {
      id: 'giro_ativo',
      nome: 'Giro do ativo',
      formula: 'Receita Líquida / Ativo Total',
      referencia: '> 1,0x',
      unidade: 'fator',
      valor: giroAtivo,
      semaforo: semGiroAtivo,
      explicacao: 'Eficiência com que os ativos são convertidos em receitas.',
    },
    {
      id: 'pmr',
      nome: 'PMR (Prazo médio de recebimento)',
      formula: '(Contas a Receber / Receita Líquida) * 360',
      referencia: '< 60d',
      unidade: 'dias',
      valor: pmr,
      semaforo: semPmr,
      explicacao: 'Tempo médio necessário para receber as vendas a prazo.',
    },
    {
      id: 'pmp',
      nome: 'PMP (Prazo médio de pagamento)',
      formula: '(Fornecedores / Compras) * 360',
      referencia: '< 60d',
      unidade: 'dias',
      valor: pmp,
      semaforo: semPmp,
      explicacao: 'Prazo médio concedido pelos fornecedores para pagamento de insumos.',
    },
    {
      id: 'pme',
      nome: 'PME (Prazo médio de estocagem)',
      formula: '(Estoques / CMV) * 360',
      referencia: '< 60d',
      unidade: 'dias',
      valor: pme,
      semaforo: semPme,
      explicacao: 'Dias em que as mercadorias/produtos permanecem em estoque antes da venda.',
    },
    {
      id: 'ciclo_operacional',
      nome: 'Ciclo operacional',
      formula: 'PMR + PME',
      referencia: '< 120d',
      unidade: 'dias',
      valor: cicloOperacional,
      semaforo: semCicloOper,
      explicacao: 'Período completo desde a compra de matéria-prima até o recebimento da venda.',
    },
    {
      id: 'ciclo_financeiro',
      nome: 'Ciclo financeiro',
      formula: 'Ciclo Operacional - PMP',
      referencia: '< 90d',
      unidade: 'dias',
      valor: cicloFinanceiro,
      semaforo: semCicloFin,
      explicacao:
        'Necessidade de capital de giro: dias entre pagar fornecedores e receber clientes.',
    },
    {
      id: 'dscr',
      nome: 'DSCR (Cobertura do Serviço da Dívida)',
      formula: 'EBITDA / (Juros + Amortização de Dívidas)',
      referencia: '> 1,3x',
      unidade: 'fator',
      valor: dscr,
      semaforo: semDscr,
      explicacao: 'Folga de geração operacional de caixa frente ao serviço da dívida bancária.',
    },
    {
      id: 'capex_receita',
      nome: 'CAPEX / Receita líquida',
      formula: 'Investimentos em Ativo / Receita Líquida',
      referencia: '> 2%',
      unidade: 'percentual',
      valor: capexReceita,
      semaforo: semCapex,
      explicacao: 'Taxa de reinvestimento de capital e modernização do imobilizado.',
    },
  ]
}

/**
 * Pesos oficiais do modelo ADECONT (Score Ponderado Multicritério)
 */
export const PESOS_SCORE_MODELO: Record<BlocoScorePonderado['bloco'], number> = {
  Liquidez: 0.15,
  Endividamento: 0.15,
  Rentabilidade: 0.2,
  Atividade: 0.1,
  Fiscal: 0.15,
  Trabalhista: 0.1,
  Contingências: 0.1,
  Governança: 0.05,
}

/**
 * Deriva nota automática 0-10 para um bloco do score com base nos indicadores
 */
export function derivarNotaAutomaticaBloco(
  bloco: BlocoScorePonderado['bloco'],
  indicadores: ItemIndicador[],
  completudeDocumentalPct = 100,
): number {
  const map = new Map(indicadores.map((i) => [i.id, i]))

  switch (bloco) {
    case 'Liquidez': {
      const lc = map.get('liq_corrente')?.valor || 0
      const ls = map.get('liq_seca')?.valor || 0
      if (lc >= 1.5 && ls >= 1.0) return 9
      if (lc >= 1.2 && ls >= 0.8) return 7
      if (lc >= 1.0) return 5
      if (lc >= 0.7) return 3
      return 2
    }
    case 'Endividamento': {
      const dlEb = map.get('div_liq_ebitda')?.valor || 0
      const ge = map.get('grau_endividamento')?.valor || 0
      if (dlEb <= 1.5 && ge <= 1.2) return 9
      if (dlEb <= 2.5 && ge <= 1.8) return 7
      if (dlEb <= 3.5) return 5
      if (dlEb <= 5.0) return 3
      return 2
    }
    case 'Rentabilidade': {
      const ml = map.get('margem_liquida')?.valor || 0
      const roe = map.get('roe')?.valor || 0
      if (ml >= 8 && roe >= 15) return 9
      if (ml >= 5 && roe >= 10) return 8
      if (ml >= 2 && roe >= 5) return 6
      if (ml >= 0) return 4
      return 1 // Prejuízo
    }
    case 'Atividade': {
      const cf = map.get('ciclo_financeiro')?.valor || 0
      const pme = map.get('pme')?.valor || 0
      if (cf <= 60 && pme <= 60) return 9
      if (cf <= 90 && pme <= 90) return 8
      if (cf <= 120) return 6
      if (cf <= 180) return 4
      return 3
    }
    case 'Fiscal': {
      // Baseado na completude documental e tributos
      if (completudeDocumentalPct >= 80) return 8
      if (completudeDocumentalPct >= 60) return 6
      if (completudeDocumentalPct >= 40) return 4
      return 3
    }
    case 'Trabalhista': {
      if (completudeDocumentalPct >= 70) return 8
      if (completudeDocumentalPct >= 50) return 6
      return 3
    }
    case 'Contingências': {
      return 7
    }
    case 'Governança': {
      if (completudeDocumentalPct >= 80) return 9
      if (completudeDocumentalPct >= 50) return 7
      return 4
    }
    default:
      return 5
  }
}

/**
 * Calcula o Score Ponderado Multicritério (0 a 10) com SUMPRODUCT
 */
export function calcularScorePonderado(
  notasCustom: Partial<Record<BlocoScorePonderado['bloco'], number>> = {},
  indicadores: ItemIndicador[] = [],
  completudeDocumentalPct = 100,
): ScorePonderadoResultado {
  const blocosChaves: BlocoScorePonderado['bloco'][] = [
    'Liquidez',
    'Endividamento',
    'Rentabilidade',
    'Atividade',
    'Fiscal',
    'Trabalhista',
    'Contingências',
    'Governança',
  ]

  const blocos: BlocoScorePonderado[] = blocosChaves.map((bloco) => {
    const peso = PESOS_SCORE_MODELO[bloco]
    let nota = notasCustom[bloco]
    let automatico = false
    if (nota === undefined || nota === null) {
      nota = derivarNotaAutomaticaBloco(bloco, indicadores, completudeDocumentalPct)
      automatico = true
    }
    // Garante range 0 a 10
    const notaClamped = Math.max(0, Math.min(10, nota))
    const notaPonderada = Number((notaClamped * peso).toFixed(3))
    return {
      bloco,
      peso,
      nota: notaClamped,
      notaPonderada,
      automatico,
    }
  })

  const somaPonderada = blocos.reduce((acc, b) => acc + b.notaPonderada, 0)
  const notaFinal = Number(somaPonderada.toFixed(2))

  let classificacao = 'Crítico'
  if (notaFinal >= 8.5) classificacao = 'Excelente (Baixíssimo Risco)'
  else if (notaFinal >= 7.0) classificacao = 'Bom (Risco Baixo/Moderado)'
  else if (notaFinal >= 5.5) classificacao = 'Moderado (Atenção)'
  else if (notaFinal >= 4.0) classificacao = 'Alto Risco'
  else classificacao = 'Crítico (Elevado Risco de Inadimplência)'

  return {
    blocos,
    notaFinal,
    classificacao,
  }
}

/**
 * Simulador de Cenários: Otimista (×1,1), Base (×1,0), Pessimista (×0,9)
 */
export function simularCenariosSensibilidade(
  receitaBase: number,
  ebitdaBase: number,
  servicoDivida: number,
): SimuladorCenariosItem[] {
  const multiplicadores = [
    { cenario: 'Otimista' as const, mult: 1.1 },
    { cenario: 'Base' as const, mult: 1.0 },
    { cenario: 'Pessimista' as const, mult: 0.9 },
  ]

  const margemEbitda = receitaBase > 0 ? ebitdaBase / receitaBase : 0

  return multiplicadores.map(({ cenario, mult }) => {
    const rec = receitaBase * mult
    // EBITDA varia de acordo com a alavancagem operacional
    const deltaRec = rec - receitaBase
    const novoEbitda = ebitdaBase + deltaRec * (margemEbitda > 0 ? margemEbitda : 0.15)
    const dscr = servicoDivida > 0 ? novoEbitda / servicoDivida : novoEbitda > 0 ? 5.0 : 0

    let classificacao = 'Resiliente'
    if (dscr < 1.0) classificacao = 'Crítico'
    else if (dscr < 1.3) classificacao = 'Atenção'
    else if (dscr >= 2.0) classificacao = 'Excelente'

    return {
      cenario,
      multiplicador: mult,
      receita: rec,
      ebitda: novoEbitda,
      dscr,
      classificacao,
    }
  })
}

/**
 * Regressão Linear Simples (Equivalente ao FORECAST / TREND do Excel)
 * y = a + b * x
 */
export function regressaoLinearSimples(pontos: { x: number; y: number }[]): (x: number) => number {
  const n = pontos.length
  if (n === 0) return () => 0
  if (n === 1) return () => pontos[0].y

  let somaX = 0
  let somaY = 0
  let somaXY = 0
  let somaXX = 0

  for (const p of pontos) {
    somaX += p.x
    somaY += p.y
    somaXY += p.x * p.y
    somaXX += p.x * p.x
  }

  const denominador = n * somaXX - somaX * somaX
  if (denominador === 0) {
    const mediaY = somaY / n
    return () => mediaY
  }

  const b = (n * somaXY - somaX * somaY) / denominador
  const a = (somaY - b * somaX) / n

  return (x: number) => a + b * x
}

/**
 * Projeta receitas e EBITDA para os próximos 3 anos (Ano +1, Ano +2, Ano +3)
 * Usando regressão linear sobre os 3 exercícios (x = 1, 2, 3)
 */
export function projetarForecast3Anos(
  historicoReceitas: [number, number, number],
  historicoEbitda: [number, number, number],
): ProjecaoForecastAno[] {
  const pontosRec = [
    { x: 1, y: historicoReceitas[0] },
    { x: 2, y: historicoReceitas[1] },
    { x: 3, y: historicoReceitas[2] },
  ]

  const pontosEb = [
    { x: 1, y: historicoEbitda[0] },
    { x: 2, y: historicoEbitda[1] },
    { x: 3, y: historicoEbitda[2] },
  ]

  const forecastRec = regressaoLinearSimples(pontosRec)
  const forecastEb = regressaoLinearSimples(pontosEb)

  return [
    {
      ano: 'Ano +1',
      receita: Math.max(0, forecastRec(4)),
      ebitda: forecastEb(4),
    },
    {
      ano: 'Ano +2',
      receita: Math.max(0, forecastRec(5)),
      ebitda: forecastEb(5),
    },
    {
      ano: 'Ano +3',
      receita: Math.max(0, forecastRec(6)),
      ebitda: forecastEb(6),
    },
  ]
}

/**
 * Diagnóstico textual por dimensão (Bloco 2 do Relatório Comparativo)
 */
export function gerarDiagnosticoPorDimensao(
  indA: ItemIndicador[],
  indB?: ItemIndicador[],
): DimensaoDiagnostico[] {
  const mapA = new Map(indA.map((i) => [i.id, i]))
  const mapB = indB ? new Map(indB.map((i) => [i.id, i])) : null

  const getTexto = (dim: string, map: Map<string, ItemIndicador>) => {
    switch (dim) {
      case 'Liquidez': {
        const lc = map.get('liq_corrente')?.valor || 0
        return lc >= 1.5
          ? 'Liquidez sólida e folga de curto prazo.'
          : lc >= 1.0
            ? 'Liquidez moderada, sob controle.'
            : 'Restrição de liquidez e caixa comprimido.'
      }
      case 'Endividamento': {
        const dscr = map.get('dscr')?.valor || 0
        const dlEb = map.get('div_liq_ebitda')?.valor || 0
        return dscr >= 1.3 && dlEb <= 2.5
          ? 'Endividamento controlado e alavancagem saudável.'
          : 'Alavancagem elevada com atenção ao serviço da dívida.'
      }
      case 'Rentabilidade': {
        const ml = map.get('margem_liquida')?.valor || 0
        return ml >= 5
          ? `Operação lucrativa com margem de ${ml.toFixed(1)}%.`
          : ml >= 0
            ? 'Margem estreita demandando otimização.'
            : 'Operação deficitária com prejuízo contábil.'
      }
      case 'Atividade': {
        const cf = map.get('ciclo_financeiro')?.valor || 0
        return cf <= 90
          ? `Ciclos operacionais ágeis (ciclo fin. ${cf.toFixed(0)}d).`
          : 'Giro de estoque e recebimento alongados.'
      }
      case 'Caixa': {
        const disp = map.get('liq_imediata')?.valor || 0
        return disp >= 0.3
          ? 'Reservas líquidas imediatas preservadas.'
          : 'Baixo colchão de disponibilidades imediatas.'
      }
      case 'Fiscal': {
        return 'Regularidade fiscal em acompanhamento.'
      }
      case 'Documentação': {
        return 'Dossiê documental sob escrituração contábil.'
      }
      default:
        return 'Análise em processamento.'
    }
  }

  const dimensoes: DimensaoDiagnostico['dimensao'][] = [
    'Liquidez',
    'Endividamento',
    'Rentabilidade',
    'Atividade',
    'Caixa',
    'Fiscal',
    'Documentação',
  ]

  return dimensoes.map((dim) => {
    const concA = getTexto(dim, mapA)
    const concB = mapB ? getTexto(dim, mapB) : undefined
    let concComp = concA
    if (concB) {
      concComp = `Empresa A: ${concA} | Empresa B: ${concB}`
    }
    return {
      dimensao: dim,
      conclusaoA: concA,
      conclusaoB: concB,
      conclusaoComparativa: concComp,
    }
  })
}

/**
 * Gera relatório comparativo completo (Quadro-resumo, Diagnóstico, Conclusão e Recomendação)
 */
export function gerarRelatorioComparativo(
  rotuloA: string,
  rotuloB: string,
  totaisA: BalancoDRECalculado,
  totaisB: BalancoDRECalculado,
  indA: ItemIndicador[],
  indB: ItemIndicador[],
  completudeDocA = 100,
  completudeDocB = 80,
) {
  const getInd = (ind: ItemIndicador[], id: string) => ind.find((i) => i.id === id)?.valor ?? 0

  const lc_A = getInd(indA, 'liq_corrente')
  const lc_B = getInd(indB, 'liq_corrente')
  const ml_A = getInd(indA, 'margem_liquida')
  const ml_B = getInd(indB, 'margem_liquida')
  const roe_A = getInd(indA, 'roe')
  const roe_B = getInd(indB, 'roe')
  const cf_A = getInd(indA, 'ciclo_financeiro')
  const cf_B = getInd(indB, 'ciclo_financeiro')
  const dscr_A = getInd(indA, 'dscr')
  const dscr_B = getInd(indB, 'dscr')

  const dl_A = getInd(indA, 'divida_liquida')
  const dl_B = getInd(indB, 'divida_liquida')

  const quadroResumo: QuadroResumoRelatorio[] = [
    {
      item: 'Receita líquida',
      valorA: totaisA.receitaLiquida,
      valorB: totaisB.receitaLiquida,
      vantagem: totaisA.receitaLiquida >= totaisB.receitaLiquida ? 'A' : 'B',
      unidade: 'moeda',
    },
    {
      item: 'EBITDA',
      valorA: totaisA.ebitda,
      valorB: totaisB.ebitda,
      vantagem: totaisA.ebitda >= totaisB.ebitda ? 'A' : 'B',
      unidade: 'moeda',
    },
    {
      item: 'Lucro líquido',
      valorA: totaisA.lucroLiquido,
      valorB: totaisB.lucroLiquido,
      vantagem: totaisA.lucroLiquido >= totaisB.lucroLiquido ? 'A' : 'B',
      unidade: 'moeda',
    },
    {
      item: 'Ativo total',
      valorA: totaisA.totalAtivoTotal,
      valorB: totaisB.totalAtivoTotal,
      vantagem: totaisA.totalAtivoTotal >= totaisB.totalAtivoTotal ? 'A' : 'B',
      unidade: 'moeda',
    },
    {
      item: 'Patrimônio líquido',
      valorA: totaisA.totalPatrimonioLiquido,
      valorB: totaisB.totalPatrimonioLiquido,
      vantagem: totaisA.totalPatrimonioLiquido >= totaisB.totalPatrimonioLiquido ? 'A' : 'B',
      unidade: 'moeda',
    },
    {
      item: 'Dívida líquida',
      valorA: dl_A,
      valorB: dl_B,
      vantagem: dl_A <= dl_B ? 'A' : 'B',
      unidade: 'moeda',
    },
    {
      item: 'Liquidez corrente',
      valorA: lc_A,
      valorB: lc_B,
      vantagem: lc_A >= lc_B ? 'A' : 'B',
      unidade: 'multiplo',
    },
    {
      item: 'Margem líquida',
      valorA: ml_A,
      valorB: ml_B,
      vantagem: ml_A >= ml_B ? 'A' : 'B',
      unidade: 'percentual',
    },
    {
      item: 'ROE',
      valorA: roe_A,
      valorB: roe_B,
      vantagem: roe_A >= roe_B ? 'A' : 'B',
      unidade: 'percentual',
    },
    {
      item: 'Ciclo financeiro',
      valorA: cf_A,
      valorB: cf_B,
      vantagem: cf_A <= cf_B ? 'A' : 'B',
      unidade: 'dias',
    },
    {
      item: 'DSCR',
      valorA: dscr_A,
      valorB: dscr_B,
      vantagem: dscr_A >= dscr_B ? 'A' : 'B',
      unidade: 'multiplo',
    },
  ]

  const diagnosticoDimensoes = gerarDiagnosticoPorDimensao(indA, indB)

  const vitoriasA = quadroResumo.filter((q) => q.vantagem === 'A').length
  const vitoriasB = quadroResumo.filter((q) => q.vantagem === 'B').length

  const conclusaoGeral =
    vitoriasA > vitoriasB
      ? `${rotuloA} apresenta superioridade estrutural com solidez em ${vitoriasA} dos 11 indicadores fundamentais, refletindo maior robustez patrimonial e capacidade de liquidez frente a ${rotuloB}.`
      : vitoriasB > vitoriasA
        ? `${rotuloB} lidera o comparativo em ${vitoriasB} das 11 métricas chave, evidenciando melhor desempenho operacional ou de rentabilidade em relação a ${rotuloA}.`
        : `Empate técnico estrutural entre ${rotuloA} e ${rotuloB}, com métricas equilibradas entre liquidez, endividamento e rentabilidade.`

  const recomendacaoCreditoA =
    lc_A >= 1.5 && dscr_A >= 1.3
      ? 'Aprovado: Capacidade de pagamento comprovada com folga de liquidez e cobertura de juros.'
      : lc_A >= 1.0
        ? 'Aprovado com Garantias: Manter monitoramento de capital de giro e reciprocidades.'
        : 'Restrito: Alavancagem ou liquidez exigem plano de alongamento de passivo.'

  const recomendacaoCreditoB =
    lc_B >= 1.5 && dscr_B >= 1.3
      ? 'Aprovado: Capacidade de pagamento demonstrada com folga financeira.'
      : lc_B >= 1.0
        ? 'Aprovado com Garantias: Operação viável mediante garantias reais adicionais.'
        : 'Restrito / Negado: Indicadores pressionados demandam reestruturação prévia.'

  return {
    quadroResumo,
    diagnosticoDimensoes,
    conclusaoGeral,
    recomendacaoCreditoA,
    recomendacaoCreditoB,
  }
}

// Aliases para ergonomia
export const calcularTodosIndicadores = calcular25Indicadores
export const calcularIndicadoresExercicio = calcular25Indicadores

export function gerarParecerAutomatico(
  empresaNome: string,
  indicadores: ItemIndicador[],
  scoreFinal: number,
): ParecerFinalAnalise {
  const indMap = new Map(indicadores.map((i) => [i.id, i.valor]))
  const liquidez = indMap.get('liq_corrente') ?? 0
  const margem = indMap.get('margem_liquida') ?? 0
  const roe = indMap.get('roe') ?? 0
  const dlEbitda = indMap.get('div_liq_ebitda') ?? 0
  const cicloFin = indMap.get('ciclo_financeiro') ?? 0
  const dscr = indMap.get('dscr') ?? 0

  const opiniao: ParecerFinalAnalise['nivelOpiniao'] =
    scoreFinal >= 7.0 ? 'Sem ressalvas' : scoreFinal >= 4.5 ? 'Com ressalvas' : 'Adverso'

  const recCredito =
    liquidez >= 1.5 && dscr >= 1.3
      ? 'Conceder crédito: Capacidade de pagamento comprovada com folga de liquidez e cobertura de juros.'
      : liquidez >= 1.0
        ? 'Conceder com garantias: Operação viável mediante acompanhamento de fluxo de caixa.'
        : 'Crédito restrito / negado: Indicadores pressionados exigem saneamento prévio de passivos.'

  const conc =
    scoreFinal >= 7.0
      ? `A empresa ${empresaNome} apresenta estrutura patrimonial consistente, com geração de caixa e solvência dentro dos parâmetros recomendados.`
      : scoreFinal >= 4.5
        ? `A empresa ${empresaNome} opera com margens moderadas, recomendando-se monitoramento preventivo de alavancagem.`
        : `A empresa ${empresaNome} evidencia vulnerabilidade de liquidez e endividamento, demandando plano corretivo.`

  return {
    empresaNome,
    cnpj: '',
    periodo: '3 exercícios (Ano -2 a Ano Atual)',
    escopo: 'Contábil, fiscal, patrimonial e financeiro',
    indicadoresChave: {
      liquidezCorrente: liquidez,
      margemLiquida: margem,
      roe,
      dividaLiquidaEbitda: dlEbitda,
      cicloFinanceiro: cicloFin,
      dscr,
      scoreFinal,
    },
    pontosFortes:
      liquidez >= 1.5
        ? 'Liquidez sólida e solvência de curto prazo'
        : 'Operação consolidada em seu setor',
    pontosAtencao:
      dlEbitda > 2
        ? 'Alavancagem financeira e endividamento'
        : 'Manter disciplina de custos operacionais',
    achadosCriticos:
      dscr < 1.0
        ? 'Capacidade de cobertura de serviço da dívida (DSCR < 1.0)'
        : 'Nenhum apontamento crítico de alto risco no período',
    conclusao: conc,
    nivelOpiniao: opiniao,
    recomendacaoCredito: recCredito,
    responsavelTecnico: 'Analista de Crédito e Finanças ADECONT',
    data: new Date().toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }),
  }
}
