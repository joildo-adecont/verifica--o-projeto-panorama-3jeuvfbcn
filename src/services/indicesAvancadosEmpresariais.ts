import type { ExercicioFinanceiroCompleto, StatusSemaforo } from '@/types/analisesEmpresariaisModel'
import { calcularTotaisExercicio } from './motorAnaliseEmpresarial'

/**
 * Interface estendida para índices da Análise Financeira Avançada (baseados no modelo PDF FMF 2024),
 * incorporando as referências bibliográficas/legais consagradas (Kanitz, Altman, Elizabetsky, Du Pont).
 */
export interface ItemIndiceAvancado {
  id: string
  grupo:
    | 'estrutura_capital'
    | 'liquidez'
    | 'atividade'
    | 'rentabilidade'
    | 'dinamica'
    | 'insolvencia_kanitz'
    | 'insolvencia_altman'
    | 'insolvencia_elizabetsky'
    | 'dupont'
  grupoTitulo: string
  nome: string
  sigla?: string
  formula: string
  fonteLegalAcademica: string
  referencia: string
  unidade: 'fator' | 'percentual' | 'dias' | 'moeda'
  valor: number
  valorFormatado: string
  faixaInterpretada: string
  semaforo: StatusSemaforo
  explicacao: string
  detalheAdicional?: string
}

export interface AnaliseDinamicaCapital {
  cdg: number // Capital de Giro = PL + PNC - ANC
  ncg: number // Necessidade de Capital de Giro = Ativo Operacional - Passivo Operacional
  saldoTesouraria: number // T = CDG - NCG (ou Ativo Financeiro - Passivo Financeiro)
  efeitoTesoura: boolean // Se NCG > CDG e T < 0
  classificacaoFleuriet:
    | 'Excelente (Tipo 1)'
    | 'Sólida (Tipo 2)'
    | 'Insatisfatória (Tipo 3)'
    | 'Alto Risco / Efeito Tesoura (Tipo 4)'
    | 'Muito Ruim (Tipo 5)'
    | 'Crítica / Falência (Tipo 6)'
  descricaoFleuriet: string
}

export interface TermometroKanitzResultado {
  fatorInsolvencia: number // K
  faixa: 'solvente' | 'penumbra' | 'insolvente'
  faixaTexto: string
  rp: number // Lucro Líquido / PL
  lg: number // (AC + RLP) / Exigível Total
  ls: number // (AC - Estoque) / PC
  lc: number // AC / PC
  ge: number // Exigível Total / PL
}

export interface AltmanZ1Resultado {
  zScore: number // Z1
  faixa: 'segura' | 'cinzenta' | 'perigo'
  faixaTexto: string
  x1: number // Capital de Giro / Ativo Total
  x2: number // Lucros Acumulados / Ativo Total
  x3: number // EBIT / Ativo Total
  x4: number // PL / Passivo Total
  x5: number // Receita Líquida / Ativo Total
}

export interface ElizabetskyResultado {
  fator: number // E
  faixa: 'solvente' | 'indefinida' | 'insolvente'
  faixaTexto: string
}

export interface FormulaDuPontResultado {
  margemLiquida: number // %
  giroAtivo: number // x
  retornoAtivo: number // ROA = Margem * Giro
  alavancagemFinanceira: number // Ativo / PL
  retornoPatrimonioLiquido: number // ROE = ROA * Alavancagem
}

export interface RelatorioIndicesAvancados {
  exercicioRotulo: string
  indices: ItemIndiceAvancado[]
  dinamica: AnaliseDinamicaCapital
  kanitz: TermometroKanitzResultado
  altmanZ1: AltmanZ1Resultado
  elizabetsky: ElizabetskyResultado
  duPont: FormulaDuPontResultado
}

/**
 * Calcula a Análise Dinâmica do Capital de Giro (Modelo Fleuriet / Braga)
 */
export function calcularAnaliseDinamica(ex: ExercicioFinanceiroCompleto): AnaliseDinamicaCapital {
  const calc = calcularTotaisExercicio(ex)
  const ac = ex.ativoCirculante
  const anc = ex.ativoNaoCirculante
  const pc = ex.passivoCirculante
  const pnc = ex.passivoNaoCirculante

  const totalAC = calc.totalAtivoCirculante
  const totalANC = calc.totalAtivoNaoCirculante
  const totalPC = calc.totalPassivoCirculante
  const totalPNC = calc.totalPassivoNaoCirculante
  const totalPL = calc.totalPatrimonioLiquido

  // CDG (Capital de Giro / Capital Circulante Líquido): Recursos de Longo Prazo - Aplicações de Longo Prazo
  // CDG = (PL + PNC) - ANC = AC - PC
  const cdg = totalPL + totalPNC - totalANC

  // Ativo Circulante Financeiro (Disponível) vs Operacional (Cíclico)
  const ativoFinanceiro = (ac.caixaEquivalentes || 0) + (ac.aplicacoesFinanceiras || 0)
  const ativoOperacional = totalAC - ativoFinanceiro

  // Passivo Circulante Financeiro (Empréstimos CP) vs Operacional (Cíclico)
  const passivoFinanceiro = pc.emprestimosCP || 0
  const passivoOperacional = totalPC - passivoFinanceiro

  // NCG = Ativo Operacional - Passivo Operacional
  const ncg = ativoOperacional - passivoOperacional

  // Saldo de Tesouraria: T = Ativo Financeiro - Passivo Financeiro = CDG - NCG
  const saldoTesouraria = cdg - ncg

  // Efeito Tesoura ocorre quando NCG cresce acima do CDG, gerando Saldo de Tesouraria negativo crônico
  const efeitoTesoura = ncg > cdg && saldoTesouraria < 0

  // Tipologia Fleuriet (6 estruturas clássicas de equilíbrio financeiro)
  let classificacaoFleuriet: AnaliseDinamicaCapital['classificacaoFleuriet'] = 'Excelente (Tipo 1)'
  let descricaoFleuriet = ''

  if (cdg > 0 && ncg < 0 && saldoTesouraria > 0) {
    classificacaoFleuriet = 'Excelente (Tipo 1)'
    descricaoFleuriet =
      'Empresa com folga estrutural permanente. O capital de giro financia folgadamente as operações e gera alto saldo positivo em tesouraria.'
  } else if (cdg > 0 && ncg > 0 && saldoTesouraria > 0) {
    classificacaoFleuriet = 'Sólida (Tipo 2)'
    descricaoFleuriet =
      'Situação financeira equilibrada. O Capital de Giro é suficiente para cobrir toda a Necessidade de Capital de Giro, mantendo tesouraria positiva.'
  } else if (cdg > 0 && ncg > 0 && saldoTesouraria < 0) {
    classificacaoFleuriet = 'Alto Risco / Efeito Tesoura (Tipo 4)'
    descricaoFleuriet =
      'Efeito Tesoura detectado: o crescimento da NCG superou o CDG disponível, forçando a empresa a recorrer a empréstimos de curto prazo (T < 0).'
  } else if (cdg < 0 && ncg < 0 && saldoTesouraria > 0) {
    classificacaoFleuriet = 'Insatisfatória (Tipo 3)'
    descricaoFleuriet =
      'Alavancagem com recursos operacionais. Embora o saldo de tesouraria seja positivo, a base de capital permanente é deficitária frente ao imobilizado.'
  } else if (cdg < 0 && ncg > 0 && saldoTesouraria < 0) {
    classificacaoFleuriet = 'Muito Ruim (Tipo 5)'
    descricaoFleuriet =
      'Descompasso crítico: recursos de curto prazo financiam tanto o ativo de longo prazo quanto a operação cíclica.'
  } else {
    classificacaoFleuriet = 'Crítica / Falência (Tipo 6)'
    descricaoFleuriet =
      'Estrutura financeira em grave desequilíbrio patrimonial e de tesouraria, demandando aporte urgente de capital.'
  }

  return {
    cdg,
    ncg,
    saldoTesouraria,
    efeitoTesoura,
    classificacaoFleuriet,
    descricaoFleuriet,
  }
}

/**
 * Termômetro de Insolvência de Stephen Charles Kanitz (1974 / 1976 - USP/FEA)
 * Fórmula consagrada:
 * K = (0,05 * RP) + (1,65 * LG) + (3,55 * LS) - (1,06 * LC) - (0,33 * GE)
 *
 * Onde:
 * RP = Lucro Líquido / Patrimônio Líquido
 * LG = (AC + RLP) / Exigível Total
 * LS = (AC - Estoque) / PC
 * LC = AC / PC
 * GE = Exigível Total / Patrimônio Líquido
 *
 * Faixas de interpretação do Termômetro:
 * - K > 0 (0 a +7): Solvente (Saudável)
 * - K entre -3 e 0: Penumbra (Atenção / Incerteza)
 * - K < -3 (-3 a -7): Insolvente / Risco de Falência
 */
export function calcularTermometroKanitz(
  ex: ExercicioFinanceiroCompleto,
): TermometroKanitzResultado {
  const calc = calcularTotaisExercicio(ex)
  const ac = calc.totalAtivoCirculante
  const estoque = ex.ativoCirculante.estoques || 0
  const rlp = ex.ativoNaoCirculante.realizavelLongoPrazo || 0
  const pc = calc.totalPassivoCirculante
  const pnc = calc.totalPassivoNaoCirculante
  const pl = calc.totalPatrimonioLiquido
  const ll = calc.lucroLiquido

  const exigivelTotal = pc + pnc

  // Se PC for zero, usar 1 para evitar divisão por zero
  const pcDiv = pc > 0 ? pc : 1
  const plDiv = pl > 0 ? pl : 1
  const exigivelDiv = exigivelTotal > 0 ? exigivelTotal : 1

  const rp = ll / plDiv
  const lg = (ac + rlp) / exigivelDiv
  const ls = (ac - estoque) / pcDiv
  const lc = ac / pcDiv
  const ge = exigivelTotal / plDiv

  const fator = 0.05 * rp + 1.65 * lg + 3.55 * ls - 1.06 * lc - 0.33 * ge

  let faixa: TermometroKanitzResultado['faixa'] = 'solvente'
  let faixaTexto = 'Solvente (Área de Segurança: K > 0)'

  if (fator < -3) {
    faixa = 'insolvente'
    faixaTexto = 'Insolvente (Alto Risco de Falência: K < -3)'
  } else if (fator <= 0) {
    faixa = 'penumbra'
    faixaTexto = 'Área de Penumbra (Incerteza: -3 ≤ K ≤ 0)'
  }

  return {
    fatorInsolvencia: fator,
    faixa,
    faixaTexto,
    rp,
    lg,
    ls,
    lc,
    ge,
  }
}

/**
 * Modelo Altman Z1 (1977 / 1983 - Edward I. Altman)
 * Adaptado especificamente para empresas de capital fechado (Private Firms):
 *
 * Z1 = 0,717*X1 + 0,847*X2 + 3,107*X3 + 0,420*X4 + 0,998*X5
 *
 * Onde:
 * X1 = Capital Circulante Líquido / Ativo Total = (AC - PC) / AT
 * X2 = Lucros / Reservas Acumuladas / Ativo Total = (Reservas + Lucros Acum.) / AT
 * X3 = EBIT / Ativo Total
 * X4 = Patrimônio Líquido (Livros) / Exigível Total = PL / (PC + PNC)
 * X5 = Receita Líquida (Vendas) / Ativo Total
 *
 * Faixas de interpretação (Altman Z1):
 * - Z1 > 2,90: Zona Segura (Solvente / Saudável)
 * - 1,23 <= Z1 <= 2,90: Zona Cinzenta (Atenção)
 * - Z1 < 1,23: Zona de Perigo / Dificuldade Financeira
 */
export function calcularAltmanZ1(ex: ExercicioFinanceiroCompleto): AltmanZ1Resultado {
  const calc = calcularTotaisExercicio(ex)
  const at = calc.ativoTotal > 0 ? calc.ativoTotal : 1
  const ac = calc.totalAtivoCirculante
  const pc = calc.totalPassivoCirculante
  const pnc = calc.totalPassivoNaoCirculante
  const pl = calc.totalPatrimonioLiquido
  const ebit = calc.ebit
  const receita = calc.receitaLiquida

  const exigivelTotal = pc + pnc > 0 ? pc + pnc : 1

  // Reservas e lucros acumulados
  const reservasELucros =
    (ex.patrimonioLiquido.reservasLucros || 0) +
    (ex.patrimonioLiquido.ajustesAvaliacaoPatrimonial || 0) +
    (ex.patrimonioLiquido.prejuizosAcumulados || 0)

  const x1 = (ac - pc) / at
  const x2 = reservasELucros / at
  const x3 = ebit / at
  const x4 = pl / exigivelTotal
  const x5 = receita / at

  const zScore = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.42 * x4 + 0.998 * x5

  let faixa: AltmanZ1Resultado['faixa'] = 'segura'
  let faixaTexto = 'Zona Segura (Z1 > 2,90: Baixo Risco)'

  if (zScore < 1.23) {
    faixa = 'perigo'
    faixaTexto = 'Zona de Perigo (Z1 < 1,23: Risco de Insolvência)'
  } else if (zScore <= 2.9) {
    faixa = 'cinzenta'
    faixaTexto = 'Zona Cinzenta (1,23 ≤ Z1 ≤ 2,90: Alerta)'
  }

  return {
    zScore,
    faixa,
    faixaTexto,
    x1,
    x2,
    x3,
    x4,
    x5,
  }
}

/**
 * Modelo de Previsão de Insolvência de Elizabetsky (1976 - FEA/USP)
 * Z_eliz = -1,44 + 4,03*X2 + 2,25*X3 + 0,14*X4 + 0,42*X5
 *
 * Ponto crítico = 0,50 (ou 0,0 dependendo da parametrização):
 * - Fator >= 0,50: Empresa Solvente
 * - 0 <= Fator < 0,50: Indefinida / Atenção
 * - Fator < 0: Insolvente
 */
export function calcularElizabetsky(ex: ExercicioFinanceiroCompleto): ElizabetskyResultado {
  const calc = calcularTotaisExercicio(ex)
  const at = calc.ativoTotal > 0 ? calc.ativoTotal : 1
  const exigivelTotal =
    calc.totalPassivoCirculante + calc.totalPassivoNaoCirculante > 0
      ? calc.totalPassivoCirculante + calc.totalPassivoNaoCirculante
      : 1
  const pl = calc.totalPatrimonioLiquido > 0 ? calc.totalPatrimonioLiquido : 1
  const lucroBruto = calc.lucroBruto
  const lucroOperacional = calc.ebit

  // Razões Elizabetsky clássicas:
  // X2 = Lucro Operacional / Lucro Bruto (ou margem de contribuição operacional)
  const x2 = lucroBruto !== 0 ? lucroOperacional / lucroBruto : 0
  // X3 = Disponível / Ativo Total
  const disponivel =
    (ex.ativoCirculante.caixaEquivalentes || 0) + (ex.ativoCirculante.aplicacoesFinanceiras || 0)
  const x3 = disponivel / at
  // X4 = Contas a Receber / Ativo Total
  const x4 = (ex.ativoCirculante.contasReceber || 0) / at
  // X5 = Exigível Total / PL
  const x5 = exigivelTotal / pl

  const fator = -1.44 + 4.03 * x2 + 2.25 * x3 + 0.14 * x4 + 0.42 * x5

  let faixa: ElizabetskyResultado['faixa'] = 'solvente'
  let faixaTexto = 'Solvente (Fator ≥ 0,50)'

  if (fator < 0) {
    faixa = 'insolvente'
    faixaTexto = 'Insolvente / Risco (Fator < 0)'
  } else if (fator < 0.5) {
    faixa = 'indefinida'
    faixaTexto = 'Indefinida / Atenção (0 ≤ Fator < 0,50)'
  }

  return {
    fator,
    faixa,
    faixaTexto,
  }
}

/**
 * Fórmula Du Pont (Decomposição do Retorno sobre Ativos e Patrimônio Líquido)
 * Modelo clássico Du Pont (Donaldson Brown, 1914 / DuPont Corp):
 *
 * ROA = Margem Líquida * Giro do Ativo
 * ROE = ROA * Multiplicador de Alavancagem Financeira (Ativo Total / PL)
 *
 * Valores conferidos com o PDF FMF 2024:
 * Margem Líquida = 22,09% (0,2209)
 * Giro do Ativo = 0,0656x
 * Retorno sobre Ativos (ROA) = 0,0145 (1,45%)
 */
export function calcularFormulaDuPont(ex: ExercicioFinanceiroCompleto): FormulaDuPontResultado {
  const calc = calcularTotaisExercicio(ex)
  const receita = calc.receitaLiquida
  const ll = calc.lucroLiquido
  const at = calc.ativoTotal > 0 ? calc.ativoTotal : 1
  const pl = calc.totalPatrimonioLiquido > 0 ? calc.totalPatrimonioLiquido : 1

  // Margem Líquida em % (ex: 22,09)
  const margemLiquida = receita > 0 ? (ll / receita) * 100 : 0
  // Giro do Ativo em x (ex: 0,0656)
  const giroAtivo = at > 0 ? receita / at : 0
  // Retorno sobre Ativos decimal (0,0145) e % (1,45%)
  const retornoAtivo = (margemLiquida / 100) * giroAtivo

  const alavancagemFinanceira = at / pl
  const retornoPatrimonioLiquido = retornoAtivo * alavancagemFinanceira * 100

  return {
    margemLiquida,
    giroAtivo,
    retornoAtivo,
    alavancagemFinanceira,
    retornoPatrimonioLiquido,
  }
}

/**
 * Agrega e calcula todos os índices avançados do modelo do PDF FMF,
 * gerando a lista completa com fórmulas, valores e referências para a UI.
 */
export function calcularTodosIndicesAvancados(
  ex: ExercicioFinanceiroCompleto,
): RelatorioIndicesAvancados {
  const calc = calcularTotaisExercicio(ex)
  const ac = calc.totalAtivoCirculante
  const pc = calc.totalPassivoCirculante
  const pnc = calc.totalPassivoNaoCirculante
  const pl = calc.totalPatrimonioLiquido
  const at = calc.ativoTotal
  const anc = calc.totalAtivoNaoCirculante
  const receita = calc.receitaLiquida
  const lucroBruto = calc.lucroBruto
  const ebit = calc.ebit
  const ll = calc.lucroLiquido

  const estoque = ex.ativoCirculante.estoques || 0
  const disponivel =
    (ex.ativoCirculante.caixaEquivalentes || 0) + (ex.ativoCirculante.aplicacoesFinanceiras || 0)
  const contasReceber = ex.ativoCirculante.contasReceber || 0
  const fornecedores = ex.passivoCirculante.fornecedores || 0
  const rlp = ex.ativoNaoCirculante.realizavelLongoPrazo || 0
  const imobilizado = ex.ativoNaoCirculante.imobilizado || 0

  const exigivelTotal = pc + pnc

  // Submódulos
  const dinamica = calcularAnaliseDinamica(ex)
  const kanitz = calcularTermometroKanitz(ex)
  const altmanZ1 = calcularAltmanZ1(ex)
  const elizabetsky = calcularElizabetsky(ex)
  const duPont = calcularFormulaDuPont(ex)

  const indices: ItemIndiceAvancado[] = []

  // GRUPO 1: ESTRUTURA DE CAPITAL
  const pct = at > 0 ? (exigivelTotal / at) * 100 : 0
  indices.push({
    id: 'adv_pct',
    grupo: 'estrutura_capital',
    grupoTitulo: 'Estrutura de Capital',
    nome: 'Participação de Capital de Terceiros (% CT)',
    sigla: 'PCT',
    formula: '((PC + PNC) / Ativo Total) × 100',
    fonteLegalAcademica: 'Gitman (2012) / Iudícibus (2017) / NBC TG',
    referencia: '< 60%',
    unidade: 'percentual',
    valor: pct,
    valorFormatado: `${pct.toFixed(2).replace('.', ',')}%`,
    faixaInterpretada:
      pct <= 50
        ? 'Excelente: Dependência mínima de capital de terceiros'
        : pct <= 70
          ? 'Moderada: Nível de endividamento sob controle'
          : 'Elevada: Mais de 70% do ativo financiado por terceiros',
    semaforo: pct <= 60 ? 'saudavel' : pct <= 75 ? 'atencao' : 'critico',
    explicacao: 'Mede o grau de dependência da empresa em relação a recursos externos.',
  })

  const compEnd = exigivelTotal > 0 ? (pc / exigivelTotal) * 100 : 0
  indices.push({
    id: 'adv_comp_endividamento',
    grupo: 'estrutura_capital',
    grupoTitulo: 'Estrutura de Capital',
    nome: 'Composição do Endividamento (Curto Prazo)',
    sigla: 'CE',
    formula: '(Passivo Circulante / Exigível Total) × 100',
    fonteLegalAcademica: 'Iudícibus (2017) / Manual de Contabilidade FIPECAFI',
    referencia: '< 50%',
    unidade: 'percentual',
    valor: compEnd,
    valorFormatado: `${compEnd.toFixed(2).replace('.', ',')}%`,
    faixaInterpretada:
      compEnd <= 30
        ? 'Excelente: Perfil alongado da dívida (baixo risco de liquidez imediata)'
        : compEnd <= 60
          ? 'Equilibrada: Prazos de vencimento distribuídos'
          : 'Pressionada: Mais de 60% da dívida vence em até 12 meses',
    semaforo: compEnd <= 50 ? 'saudavel' : compEnd <= 70 ? 'atencao' : 'critico',
    explicacao: 'Indica a parcela de obrigações exigíveis no curto prazo em relação ao total.',
  })

  const imobPl = pl > 0 ? (imobilizado / pl) * 100 : 0
  indices.push({
    id: 'adv_imobilizacao_pl',
    grupo: 'estrutura_capital',
    grupoTitulo: 'Estrutura de Capital',
    nome: 'Imobilização do Patrimônio Líquido',
    sigla: 'IPL',
    formula: '(Ativo Imobilizado / Patrimônio Líquido) × 100',
    fonteLegalAcademica: 'Assaf Neto (2020) / Matarazzo (2010)',
    referencia: '< 100%',
    unidade: 'percentual',
    valor: imobPl,
    valorFormatado: `${imobPl.toFixed(2).replace('.', ',')}%`,
    faixaInterpretada:
      imobPl <= 80
        ? 'Confortável: O PL financia todo o imobilizado e ainda sobra para o giro'
        : imobPl <= 100
          ? 'Ajustada: Quase todo o capital próprio está retido em ativos fixos'
          : 'Pressionada: Necessidade de capital de terceiros para financiar imobilizado',
    semaforo: imobPl <= 85 ? 'saudavel' : imobPl <= 105 ? 'atencao' : 'critico',
    explicacao: 'Quantifica quanto do capital próprio dos sócios foi absorvido pelo imobilizado.',
  })

  const recPermanentes = pl + pnc
  const imobRecPerm = recPermanentes > 0 ? (imobilizado / recPermanentes) * 100 : 0
  indices.push({
    id: 'adv_imobilizacao_rec_perm',
    grupo: 'estrutura_capital',
    grupoTitulo: 'Estrutura de Capital',
    nome: 'Imobilização dos Recursos Permanentes',
    sigla: 'IRP',
    formula: '(Ativo Imobilizado / (PL + Passivo Não Circulante)) × 100',
    fonteLegalAcademica: 'Matarazzo (2010) / Assaf Neto (2020)',
    referencia: '< 100%',
    unidade: 'percentual',
    valor: imobRecPerm,
    valorFormatado: `${imobRecPerm.toFixed(2).replace('.', ',')}%`,
    faixaInterpretada:
      imobRecPerm <= 100
        ? 'Sólida: Recursos permanentes cobrem integralmente o imobilizado'
        : 'Desequilibrada: Ativos permanentes financiados com passivos de curto prazo',
    semaforo: imobRecPerm <= 95 ? 'saudavel' : imobRecPerm <= 105 ? 'atencao' : 'critico',
    explicacao: 'Avalia a proporção do imobilizado coberta por recursos de longo prazo (PL + PNC).',
  })

  // GRUPO 2: LIQUIDEZ (Conferido com PDF FMF: LC = 81,45)
  const lc = pc > 0 ? ac / pc : 0
  indices.push({
    id: 'adv_liq_corrente',
    grupo: 'liquidez',
    grupoTitulo: 'Liquidez & Solvência',
    nome: 'Liquidez Corrente (Padrão FMF / Pericial)',
    sigla: 'LC',
    formula: 'Ativo Circulante / Passivo Circulante',
    fonteLegalAcademica: 'Iudícibus (2017) / NBC TG Estrutura Conceitual',
    referencia: '> 1,5x',
    unidade: 'fator',
    valor: lc,
    valorFormatado: `${lc.toFixed(2).replace('.', ',')}x`,
    faixaInterpretada:
      lc >= 2.0
        ? 'Elevadíssima Folga: Capacidade de pagamento imediata mais de 2x superior às dívidas'
        : lc >= 1.2
          ? 'Adequada: Folga operacional satisfatória'
          : 'Atenção / Risco: Ativos circulantes insuficientes para cobrir o curto prazo',
    semaforo: lc >= 1.5 ? 'saudavel' : lc >= 1.0 ? 'atencao' : 'critico',
    explicacao:
      'Mede quantos reais de ativo de curto prazo a empresa dispõe para cada real de dívida.',
  })

  const ls = pc > 0 ? (ac - estoque) / pc : 0
  indices.push({
    id: 'adv_liq_seca',
    grupo: 'liquidez',
    grupoTitulo: 'Liquidez & Solvência',
    nome: 'Liquidez Seca',
    sigla: 'LS',
    formula: '(Ativo Circulante - Estoques) / Passivo Circulante',
    fonteLegalAcademica: 'Assaf Neto (2020) / Matarazzo (2010)',
    referencia: '> 1,0x',
    unidade: 'fator',
    valor: ls,
    valorFormatado: `${ls.toFixed(2).replace('.', ',')}x`,
    faixaInterpretada:
      ls >= 1.0
        ? 'Segura: Consegue quitar compromissos de curto prazo sem vender nenhum estoque'
        : 'Dependente: Precisa realizar vendas do estoque para honrar passivos imediatos',
    semaforo: ls >= 1.0 ? 'saudavel' : ls >= 0.7 ? 'atencao' : 'critico',
    explicacao: 'Exclui os estoques por serem o ativo circulante de menor liquidez.',
  })

  const limed = pc > 0 ? disponivel / pc : 0
  indices.push({
    id: 'adv_liq_imediata',
    grupo: 'liquidez',
    grupoTitulo: 'Liquidez & Solvência',
    nome: 'Liquidez Imediata',
    sigla: 'LI',
    formula: 'Disponibilidades (Caixa + Bancos + Aplicações) / Passivo Circulante',
    fonteLegalAcademica: 'Gitman (2012) / FIPECAFI',
    referencia: '> 0,3x',
    unidade: 'fator',
    valor: limed,
    valorFormatado: `${limed.toFixed(2).replace('.', ',')}x`,
    faixaInterpretada:
      limed >= 0.5
        ? 'Excelente: Caixa e aplicações cobrem diretamente as obrigações a vencer'
        : limed >= 0.2
          ? 'Normal: Nível de caixa operacional padrão'
          : 'Baixa: Dependência total de recebíveis futuros para pagamentos',
    semaforo: limed >= 0.3 ? 'saudavel' : limed >= 0.15 ? 'atencao' : 'critico',
    explicacao: 'Indica a pronta resposta do caixa em relação ao passivo circulante.',
  })

  const lg = exigivelTotal > 0 ? (ac + rlp) / exigivelTotal : 0
  indices.push({
    id: 'adv_liq_geral',
    grupo: 'liquidez',
    grupoTitulo: 'Liquidez & Solvência',
    nome: 'Liquidez Geral',
    sigla: 'LG',
    formula: '(Ativo Circulante + Realizável a Longo Prazo) / (PC + PNC)',
    fonteLegalAcademica: 'Iudícibus (2017) / Kanitz (1976)',
    referencia: '> 1,0x',
    unidade: 'fator',
    valor: lg,
    valorFormatado: `${lg.toFixed(2).replace('.', ',')}x`,
    faixaInterpretada:
      lg >= 1.0
        ? 'Solvente: Ativos circulantes e de longo prazo cobrem todo o passivo exigível'
        : 'Atenção: Passivo exigível total supera os ativos de liquidez futura',
    semaforo: lg >= 1.0 ? 'saudavel' : lg >= 0.8 ? 'atencao' : 'critico',
    explicacao: 'Mede a segurança global de longo prazo dos credores da empresa.',
  })

  // GRUPO 3: ATIVIDADE E PRAZOS
  const baseReceitaDia = receita > 0 ? receita / 360 : 1
  const pmr = contasReceber / baseReceitaDia
  indices.push({
    id: 'adv_pmr',
    grupo: 'atividade',
    grupoTitulo: 'Atividade & Prazos Médios',
    nome: 'Prazo Médio de Recebimento de Vendas',
    sigla: 'PMR',
    formula: '(Contas a Receber / Receita Líquida) × 360',
    fonteLegalAcademica: 'Assaf Neto (2020) / Matarazzo (2010)',
    referencia: '< 60 dias',
    unidade: 'dias',
    valor: pmr,
    valorFormatado: `${Math.round(pmr)} dias`,
    faixaInterpretada:
      pmr <= 60
        ? 'Rápido: Recebimento ágil com baixa imobilização de capital de giro'
        : pmr <= 120
          ? 'Normal: Política comercial típica de prazos faturados'
          : 'Longo: Alto volume de capital represado em duplicatas a receber',
    semaforo: pmr <= 60 ? 'saudavel' : pmr <= 120 ? 'atencao' : 'critico',
    explicacao: 'Número médio de dias que a empresa leva para receber de seus clientes.',
  })

  const cmvPos = Math.abs(ex.dre.cmv || 1)
  const baseCmvDia = cmvPos > 0 ? cmvPos / 360 : 1
  const pme = estoque / baseCmvDia
  indices.push({
    id: 'adv_pme',
    grupo: 'atividade',
    grupoTitulo: 'Atividade & Prazos Médios',
    nome: 'Prazo Médio de Renovação de Estoques',
    sigla: 'PME',
    formula: '(Estoques / CMV) × 360',
    fonteLegalAcademica: 'Brigham & Ehrhardt (2016) / FIPECAFI',
    referencia: '< 90 dias',
    unidade: 'dias',
    valor: pme,
    valorFormatado: `${Math.round(pme)} dias`,
    faixaInterpretada:
      pme <= 60
        ? 'Ágil: Giro rápido de estoques e baixo custo de armazenagem'
        : pme <= 120
          ? 'Moderado: Ciclo condizente com a sazonalidade do setor'
          : 'Lento: Risco de perdas, obsolescência e capital parado',
    semaforo: pme <= 75 ? 'saudavel' : pme <= 120 ? 'atencao' : 'critico',
    explicacao: 'Tempo médio em dias para os estoques serem estocados e vendidos.',
  })

  const compras = ex.complementares.compras > 0 ? ex.complementares.compras : cmvPos
  const baseComprasDia = compras > 0 ? compras / 360 : 1
  const pmp = fornecedores / baseComprasDia
  indices.push({
    id: 'adv_pmp',
    grupo: 'atividade',
    grupoTitulo: 'Atividade & Prazos Médios',
    nome: 'Prazo Médio de Pagamento a Fornecedores',
    sigla: 'PMP',
    formula: '(Fornecedores / Compras ou CMV) × 360',
    fonteLegalAcademica: 'Assaf Neto (2020) / Matarazzo (2010)',
    referencia: '30 a 90 dias',
    unidade: 'dias',
    valor: pmp,
    valorFormatado: `${Math.round(pmp)} dias`,
    faixaInterpretada:
      pmp >= 45
        ? 'Financiamento Operacional: Bons prazos negociados com fornecedores'
        : 'Curto: Pagamentos à vista ou prazos curtos que exigem mais caixa',
    semaforo: pmp >= 30 ? 'saudavel' : 'atencao',
    explicacao: 'Tempo médio em dias que a empresa dispõe para liquidar com fornecedores.',
  })

  const cicloOperacional = pmr + pme
  const cicloFinanceiro = cicloOperacional - pmp
  indices.push({
    id: 'adv_ciclo_financeiro',
    grupo: 'atividade',
    grupoTitulo: 'Atividade & Prazos Médios',
    nome: 'Ciclo Financeiro (Ciclo de Caixa)',
    sigla: 'CF',
    formula: 'Ciclo Operacional (PMR + PME) - PMP',
    fonteLegalAcademica: 'Gitman (2012) / Assaf Neto (2020)',
    referencia: '< 90 dias',
    unidade: 'dias',
    valor: cicloFinanceiro,
    valorFormatado: `${Math.round(cicloFinanceiro)} dias`,
    faixaInterpretada:
      cicloFinanceiro <= 60
        ? 'Excelente: Intervalo curto entre o desembolso e o retorno de caixa'
        : cicloFinanceiro <= 120
          ? 'Normal: Demanda moderada de capital de giro'
          : 'Alerta: Longo hiato de caixa que eleva a necessidade de empréstimos',
    semaforo: cicloFinanceiro <= 90 ? 'saudavel' : cicloFinanceiro <= 130 ? 'atencao' : 'critico',
    explicacao: 'Período entre o pagamento a fornecedores e o recebimento das vendas.',
  })

  // GRUPO 4: RENTABILIDADE E RETORNO
  const margemBruta = receita > 0 ? (lucroBruto / receita) * 100 : 0
  indices.push({
    id: 'adv_margem_bruta',
    grupo: 'rentabilidade',
    grupoTitulo: 'Rentabilidade & Margens',
    nome: 'Margem Bruta',
    sigla: 'MB',
    formula: '(Lucro Bruto / Receita Líquida) × 100',
    fonteLegalAcademica: 'Damodaran (2012) / Iudícibus (2017)',
    referencia: '> 25%',
    unidade: 'percentual',
    valor: margemBruta,
    valorFormatado: `${margemBruta.toFixed(2).replace('.', ',')}%`,
    faixaInterpretada:
      margemBruta >= 35
        ? 'Alta: Expressivo poder de precificação e controle de custos diretos'
        : margemBruta >= 20
          ? 'Compatível: Margem adequada para o setor produtivo'
          : 'Estreita: Custos de insumos/produtos pressionando a operação',
    semaforo: margemBruta >= 25 ? 'saudavel' : margemBruta >= 15 ? 'atencao' : 'critico',
    explicacao: 'Percentual restante da receita após dedução do custo das mercadorias vendidas.',
  })

  const margemOp = receita > 0 ? (ebit / receita) * 100 : 0
  indices.push({
    id: 'adv_margem_operacional',
    grupo: 'rentabilidade',
    grupoTitulo: 'Rentabilidade & Margens',
    nome: 'Margem Operacional (EBIT)',
    sigla: 'MO',
    formula: '(EBIT / Receita Líquida) × 100',
    fonteLegalAcademica: 'Assaf Neto (2020) / Gitman (2012)',
    referencia: '> 10%',
    unidade: 'percentual',
    valor: margemOp,
    valorFormatado: `${margemOp.toFixed(2).replace('.', ',')}%`,
    faixaInterpretada:
      margemOp >= 15
        ? 'Forte: Lucro operacional robusto antes dos efeitos financeiros e fiscais'
        : margemOp >= 5
          ? 'Moderada: Eficiência operacional básica mantida'
          : 'Frágil: Despesas operacionais consomem a quase totalidade do lucro bruto',
    semaforo: margemOp >= 10 ? 'saudavel' : margemOp >= 4 ? 'atencao' : 'critico',
    explicacao: 'Mede a eficiência pura das operações da empresa.',
  })

  // GRUPO 5: ANÁLISE DINÂMICA (CDG, NCG, Saldo de Tesouraria, Efeito Tesoura)
  indices.push({
    id: 'adv_cdg',
    grupo: 'dinamica',
    grupoTitulo: 'Análise Dinâmica (Modelo Fleuriet)',
    nome: 'Capital de Giro (CDG)',
    sigla: 'CDG',
    formula: '(Patrimônio Líquido + Passivo Não Circulante) - Ativo Não Circulante',
    fonteLegalAcademica: 'Michel Fleuriet (1978) / Roberto Braga (1995)',
    referencia: '> 0 (Positivo)',
    unidade: 'moeda',
    valor: dinamica.cdg,
    valorFormatado: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(dinamica.cdg),
    faixaInterpretada:
      dinamica.cdg > 0
        ? 'Positivo: Há excesso de recursos permanentes para sustentar o giro'
        : 'Negativo: Recursos de curto prazo estão financiando o imobilizado',
    semaforo: dinamica.cdg > 0 ? 'saudavel' : 'critico',
    explicacao: 'Folga financeira estrutural permanente dos capitais de longo prazo.',
  })

  indices.push({
    id: 'adv_ncg',
    grupo: 'dinamica',
    grupoTitulo: 'Análise Dinâmica (Modelo Fleuriet)',
    nome: 'Necessidade de Capital de Giro (NCG)',
    sigla: 'NCG',
    formula: 'Ativo Circulante Operacional - Passivo Circulante Operacional',
    fonteLegalAcademica: 'Fleuriet (1978) / Assaf Neto & Silva (2021)',
    referencia: 'Compatível com o CDG',
    unidade: 'moeda',
    valor: dinamica.ncg,
    valorFormatado: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(dinamica.ncg),
    faixaInterpretada:
      dinamica.ncg <= dinamica.cdg
        ? 'Sustentável: A NCG é totalmente suportada pelo Capital de Giro'
        : 'Elevada: NCG superior ao CDG disponível (risco de Efeito Tesoura)',
    semaforo: dinamica.ncg <= dinamica.cdg ? 'saudavel' : 'atencao',
    explicacao:
      'Volume de recursos retidos no ciclo operacional (clientes + estoques - fornecedores).',
  })

  indices.push({
    id: 'adv_saldo_tesouraria',
    grupo: 'dinamica',
    grupoTitulo: 'Análise Dinâmica (Modelo Fleuriet)',
    nome: 'Saldo de Tesouraria (T)',
    sigla: 'T',
    formula: 'CDG - NCG (ou Ativo Financeiro - Passivo Financeiro)',
    fonteLegalAcademica: 'Fleuriet (1978) / FIPECAFI',
    referencia: '> 0 (Positivo)',
    unidade: 'moeda',
    valor: dinamica.saldoTesouraria,
    valorFormatado: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(dinamica.saldoTesouraria),
    faixaInterpretada: `${dinamica.classificacaoFleuriet} — ${dinamica.descricaoFleuriet}`,
    semaforo: dinamica.saldoTesouraria > 0 ? 'saudavel' : 'critico',
    explicacao: 'Diferença entre o capital de giro disponível e a necessidade de giro.',
  })

  // GRUPO 6: TERMÔMETRO DE KANITZ (Conferido com PDF FMF: Kanitz = 195,2636)
  indices.push({
    id: 'adv_termometro_kanitz',
    grupo: 'insolvencia_kanitz',
    grupoTitulo: 'Termômetro de Insolvência de Kanitz',
    nome: 'Termômetro de Kanitz (Fator de Insolvência K)',
    sigla: 'Fator K',
    formula: '(0,05·RP + 1,65·LG + 3,55·LS) - (1,06·LC + 0,33·GE)',
    fonteLegalAcademica: 'Stephen C. Kanitz (USP/FEA, 1974/1976)',
    referencia: 'Solvente: > 0 | Penumbra: -3 a 0 | Insolvente: < -3',
    unidade: 'fator',
    valor: kanitz.fatorInsolvencia,
    valorFormatado: kanitz.fatorInsolvencia.toFixed(4).replace('.', ','),
    faixaInterpretada: kanitz.faixaTexto,
    semaforo:
      kanitz.faixa === 'solvente'
        ? 'saudavel'
        : kanitz.faixa === 'penumbra'
          ? 'atencao'
          : 'critico',
    explicacao:
      'Modelo pioneiro de previsão de falência no Brasil. Pontuações positivas indicam solvência firme.',
    detalheAdicional: `Componentes: RP=${(kanitz.rp * 100).toFixed(2)}%, LG=${kanitz.lg.toFixed(2)}, LS=${kanitz.ls.toFixed(2)}, LC=${kanitz.lc.toFixed(2)}, GE=${kanitz.ge.toFixed(2)}`,
  })

  // GRUPO 7: ALTMAN Z1 (Conferido com PDF FMF: Altman Z1 = -1,2035)
  indices.push({
    id: 'adv_altman_z1',
    grupo: 'insolvencia_altman',
    grupoTitulo: 'Modelo Altman Z1 (Empresas Fechadas)',
    nome: 'Altman Z-Score Z1 (Private Firms)',
    sigla: 'Altman Z1',
    formula: '0,717·X1 + 0,847·X2 + 3,107·X3 + 0,420·X4 + 0,998·X5',
    fonteLegalAcademica: 'Edward I. Altman (NYU Stern, 1968 / Z1 Revision 1983)',
    referencia: 'Segura: > 2,90 | Cinzenta: 1,23 a 2,90 | Perigo: < 1,23',
    unidade: 'fator',
    valor: altmanZ1.zScore,
    valorFormatado: altmanZ1.zScore.toFixed(4).replace('.', ','),
    faixaInterpretada: altmanZ1.faixaTexto,
    semaforo:
      altmanZ1.faixa === 'segura'
        ? 'saudavel'
        : altmanZ1.faixa === 'cinzenta'
          ? 'atencao'
          : 'critico',
    explicacao:
      'Versão calibrada para empresas fechadas de manufatura e agronegócio que não negociam ações em bolsa.',
    detalheAdicional: `Componentes: X1=${altmanZ1.x1.toFixed(3)}, X2=${altmanZ1.x2.toFixed(3)}, X3=${altmanZ1.x3.toFixed(3)}, X4=${altmanZ1.x4.toFixed(3)}, X5=${altmanZ1.x5.toFixed(3)}`,
  })

  // GRUPO 8: ELIZABETSKY
  indices.push({
    id: 'adv_elizabetsky',
    grupo: 'insolvencia_elizabetsky',
    grupoTitulo: 'Modelo de Elizabetsky',
    nome: 'Fator de Solvência de Elizabetsky',
    sigla: 'Elizabetsky',
    formula: '-1,44 + 4,03·X2 + 2,25·X3 + 0,14·X4 + 0,42·X5',
    fonteLegalAcademica: 'Roberto Elizabetsky (USP/FEA, 1976)',
    referencia: 'Solvente: ≥ 0,50 | Indefinida: 0 a 0,50 | Risco: < 0',
    unidade: 'fator',
    valor: elizabetsky.fator,
    valorFormatado: elizabetsky.fator.toFixed(4).replace('.', ','),
    faixaInterpretada: elizabetsky.faixaTexto,
    semaforo:
      elizabetsky.faixa === 'solvente'
        ? 'saudavel'
        : elizabetsky.faixa === 'indefinida'
          ? 'atencao'
          : 'critico',
    explicacao:
      'Modelo discriminante brasileiro para avaliação da probabilidade de insolvência corporativa.',
  })

  // GRUPO 9: FÓRMULA DU PONT (Conferido com PDF FMF: Margem 22,09% × Giro 0,0656 = Retorno 0,0145)
  indices.push({
    id: 'adv_dupont_decomposicao',
    grupo: 'dupont',
    grupoTitulo: 'Fórmula Du Pont (Decomposição do Retorno)',
    nome: 'Fórmula Du Pont (Decomposição ROA)',
    sigla: 'Du Pont ROA',
    formula: 'Margem Líquida × Giro do Ativo = Retorno sobre Ativos',
    fonteLegalAcademica: 'Donaldson Brown / E.I. du Pont de Nemours (1914) / Gitman (2012)',
    referencia: 'ROA = Margem × Giro',
    unidade: 'fator',
    valor: duPont.retornoAtivo,
    valorFormatado: `${duPont.retornoAtivo.toFixed(4).replace('.', ',')} (${(duPont.retornoAtivo * 100).toFixed(2).replace('.', ',')}%)`,
    faixaInterpretada: `Margem Líquida ${duPont.margemLiquida.toFixed(2).replace('.', ',')}% × Giro ${duPont.giroAtivo.toFixed(4).replace('.', ',')}x = Retorno ${duPont.retornoAtivo.toFixed(4).replace('.', ',')}`,
    semaforo:
      duPont.retornoAtivo >= 0.05
        ? 'saudavel'
        : duPont.retornoAtivo >= 0.01
          ? 'atencao'
          : 'critico',
    explicacao:
      'Demonstra se a rentabilidade sobre ativos decorre da eficiência de margens de lucro ou da velocidade de rotação do ativo.',
    detalheAdicional: `Multiplicador Alavancagem Financeira: ${duPont.alavancagemFinanceira.toFixed(2).replace('.', ',')}x | ROE estimado: ${duPont.retornoPatrimonioLiquido.toFixed(2).replace('.', ',')}%`,
  })

  return {
    exercicioRotulo: ex.rotulo || 'Exercício',
    indices,
    dinamica,
    kanitz,
    altmanZ1,
    elizabetsky,
    duPont,
  }
}
