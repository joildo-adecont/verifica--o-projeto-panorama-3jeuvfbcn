/**
 * Tipos e Estruturas de Dados para as Ferramentas Nativas de Análise Empresarial
 * Modelo: Balanço & DRE 3 exercícios, 25 Indicadores, Score Ponderado, Checklist (51 docs), Matriz de Achados e Parecer.
 */

export interface BalancoAtivoCirculante {
  caixaEquivalentes: number
  aplicacoesFinanceiras: number
  contasReceber: number
  estoques: number
  tributosRecuperar: number
  outrosAtivosCirculantes: number
}

export interface BalancoAtivoNaoCirculante {
  realizavelLongoPrazo: number
  investimentos: number
  imobilizado: number
  intangivel: number
}

export interface BalancoPassivoCirculante {
  fornecedores: number
  emprestimosCP: number
  obrigacoesTrabalhistas: number
  obrigacoesTributarias: number
  adiantamentosClientes: number
  outrasObrigacoesCP: number
}

export interface BalancoPassivoNaoCirculante {
  outrasObrigacoesLP: number
  emprestimosLP: number
  provisoesCPC25: number
  tributosParcelados: number
}

export interface BalancoPatrimonioLiquido {
  capitalSocial: number
  reservasLucros: number
  ajustesAvaliacaoPatrimonial: number
  prejuizosAcumulados: number // Se negativo ou positivo
}

export interface EstruturaDRE {
  receitaBruta: number
  deducoesImpostos: number // Geralmente valor negativo
  cmv: number // Geralmente negativo
  despesasVendas: number // Negativo
  despesasAdministrativas: number // Negativo
  outrasDespesasOperacionais: number // Negativo ou positivo
  depreciacaoAmortizacao: number // Positivo para somar no EBITDA
  resultadoFinanceiro: number // Geralmente negativo (despesas financeiras líquidas)
  irCsll: number // Negativo
}

export interface DadosComplementaresExercicio {
  depreciacao: number
  despesaJuros: number
  compras: number
  numEmpregados: number
  folhaBruta: number
  encargos: number
  capex: number
  amortizacaoDividas: number
}

export type GrupoContaDinamica =
  | 'ativoCirculante'
  | 'ativoNaoCirculante'
  | 'passivoCirculante'
  | 'passivoNaoCirculante'
  | 'patrimonioLiquido'
  | 'dre'
  | 'outros'

export interface ContaDinamicaExercicio {
  id: string
  nome: string
  valor: number
  grupo: GrupoContaDinamica
  origem?: string
}

export interface ExercicioFinanceiroCompleto {
  rotulo: string // 'Ano -2' | 'Ano -1' | 'Ano Atual'
  anoCalendario?: string
  ativoCirculante: BalancoAtivoCirculante
  ativoNaoCirculante: BalancoAtivoNaoCirculante
  passivoCirculante: BalancoPassivoCirculante
  passivoNaoCirculante: BalancoPassivoNaoCirculante
  patrimonioLiquido: BalancoPatrimonioLiquido
  dre: EstruturaDRE
  complementares: DadosComplementaresExercicio
  contasDinamicas?: ContaDinamicaExercicio[]
}

export interface BalancoDRECalculado {
  totalAtivoCirculante: number
  totalAtivoNaoCirculante: number
  ativoTotal: number

  totalPassivoCirculante: number
  totalPassivoNaoCirculante: number
  totalPatrimonioLiquido: number
  passivoTotalComPL: number
  diferencaConferencia: number // Ativo - (Passivo + PL), deve ser 0

  receitaLiquida: number
  lucroBruto: number
  ebit: number
  ebitda: number
  lair: number
  lucroLiquido: number
}

export type StatusSemaforo = 'saudavel' | 'atencao' | 'critico'

export interface ItemIndicador {
  id: string
  nome: string
  formula: string
  referencia: string
  unidade: 'fator' | 'percentual' | 'moeda' | 'dias'
  valor: number
  semaforo: StatusSemaforo
  explicacao: string
}

export interface DimensaoDiagnostico {
  dimensao:
    | 'Liquidez'
    | 'Endividamento'
    | 'Rentabilidade'
    | 'Atividade'
    | 'Caixa'
    | 'Fiscal'
    | 'Documentação'
  conclusaoA: string
  conclusaoB?: string
  conclusaoComparativa: string
}

export interface BlocoScorePonderado {
  bloco:
    | 'Liquidez'
    | 'Endividamento'
    | 'Rentabilidade'
    | 'Atividade'
    | 'Fiscal'
    | 'Trabalhista'
    | 'Contingências'
    | 'Governança'
  peso: number
  nota: number // 0 a 10
  notaPonderada: number // nota * peso
  automatico?: boolean
}

export interface ScorePonderadoResultado {
  blocos: BlocoScorePonderado[]
  notaFinal: number // SUMPRODUCT (0 a 10)
  classificacao: string // 'Excelente' | 'Bom' | 'Moderado' | 'Alto Risco' | 'Crítico'
}

export interface SimuladorCenariosItem {
  cenario: 'Otimista' | 'Base' | 'Pessimista'
  multiplicador: number
  receita: number
  ebitda: number
  dscr: number
  classificacao: string
}

export interface ProjecaoForecastAno {
  ano: 'Ano +1' | 'Ano +2' | 'Ano +3'
  receita: number
  ebitda: number
}

export interface ChecklistDocumentalItem {
  id: string
  categoria:
    | 'Societário/Jurídico'
    | 'Contábil'
    | 'Fiscal'
    | 'Trabalhista'
    | 'Patrimonial'
    | 'Financeiro'
    | 'Operacional'
    | 'Governança/Compliance'
  documento: string
  obrigatorio: boolean
  recebido: boolean
  observacao?: string
}

export interface ResumoCompletudeChecklist {
  itensTotais: number
  itensRecebidos: number
  percentualCompletude: number
  obrigatoriosTotais: number
  obrigatoriosRecebidos: number
  percentualObrigatorios: number
}

export interface AchadoDueDiligence {
  id?: string
  cliente_cnpj?: string
  area: string
  achado: string
  evidencia: string
  impacto: 'Baixo' | 'Médio' | 'Alto'
  risco: 'Baixo' | 'Médio' | 'Alto'
  recomendacao: string
  responsavel: string
  prazo: string
  status: 'Em andamento' | 'Pendente' | 'Crítico' | 'Concluído'
}

// Aliases para máxima ergonomia e retrocompatibilidade
export type ItemChecklistDoc = ChecklistDocumentalItem
export type ImpactoAchado = 'Baixo' | 'Médio' | 'Alto'
export type StatusAchado = 'Em andamento' | 'Pendente' | 'Crítico' | 'Concluído'
export type ParecerFinalAnalise = ParecerFinalEstruturado
export type ExercicioFinanceiro = ExercicioFinanceiroCompleto

export interface AnaliseBalanco3Exercicios {
  anoMenos2: ExercicioFinanceiroCompleto
  anoMenos1: ExercicioFinanceiroCompleto
  anoAtual: ExercicioFinanceiroCompleto
}

export interface ParecerFinalEstruturado {
  empresaNome: string
  cnpj: string
  periodo: string
  escopo: string
  indicadoresChave: {
    liquidezCorrente: number
    margemLiquida: number
    roe: number
    dividaLiquidaEbitda: number
    cicloFinanceiro: number
    dscr: number
    scoreFinal: number
  }
  pontosFortes: string
  pontosAtencao: string
  achadosCriticos: string
  conclusao: string
  nivelOpiniao: 'Sem ressalvas' | 'Com ressalvas' | 'Adverso'
  recomendacaoCredito: string
  responsavelTecnico: string
  data: string
}
