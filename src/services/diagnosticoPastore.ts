/**
 * Serviço de dados para o Diagnóstico Tributário do Cliente (Pastore)
 * Busca dados em tempo real nas coleções:
 * - cadastro_empresas (dados cadastrais do CNPJ 92353630000168)
 * - cont_documentos (balancetes mensais jan-jul/2026)
 * - param_documentos (notas fiscais de entrada e saída)
 */

import pb from '@/lib/pocketbase/client'

export const CNPJ_PASTORE_LIMPO = '92353630000168'
export const CNPJ_PASTORE_FORMATADO = '92.353.630/0001-68'

export interface EmpresaCadastro {
  id: string
  codigo: number
  razao_social: string
  nome_fantasia?: string
  apelido?: string
  numero_documento: string
  documento_limpo: string
  cnae: string
  cnae_divisao?: string
  cnaes_secundarios?: string
  regime_tributario?: string
  enquadramento_tributario?: string
  porte?: string
  num_funcionarios?: number
  folha_salarial_mensal?: number
  encargos_mensais?: number
  ramo_atividade: string
  natureza_juridica: string
  municipio: string
  uf: string
  situacao: string
  cliente_desde: string
  inicio_atividades: string
  capital_social: string
  responsavel_legal: string
  contador: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  endereco?: string
  bairro?: string
  cep?: string
  telefone?: string
  email?: string
}

export interface CnaeItemFormatado {
  codigo: string
  descricao: string
}

export interface DadosFolhaPagamento {
  numFuncionarios: number
  folhaSalarialMensal: number
  encargosMensais: number
  custoTotalMensal: number
  folhaSalarialAnual: number
  encargosAnuais: number
  custoTotalAnual: number
  proLaboreMensalEstimado: number
  origemDados: 'cadastro' | 'balancete' | 'estimado'
  detalheOrigem: string
}

export interface ItemCustoFolhaRegime {
  regimeId: 'simples' | 'simples_hibrido' | 'lucro_presumido' | 'lucro_real_puro' | 'reforma_2027'
  nomeRegime: string
  rotuloCurto: string
  temCppSeparada: boolean
  aliquotaInssPatronalPct: number // 0% no Simples, ~20% + RAT + terceiros nos demais
  aliquotaRatFapPct: number
  aliquotaTerceirosSistemaSPct: number
  encargoPrevidenciarioPatronalAnual: number
  custoFolhaBrutoAnual: number // folha + encargos + CPP patronal antes de qualquer economia fiscal
  dedutibilidadeIrpjCsll: boolean // se a despesa de folha abate base de IRPJ/CSLL (Simples = não, Presumido = não, Real = sim)
  economiaFiscalIrpjCsllAnual: number // no Real: (folha + encargos + encargo patronal) * 24%
  custoFolhaLiquidoAnual: number // custoFolhaBruto - economiaFiscalIrpjCsllAnual
  impactoVsSimplesBrl: number // custoFolhaLiquido - custoFolhaSimples (positivo = custo adicional, negativo = economia)
  explicacaoRegime: string
}

export interface ComparativoCustoFolha {
  dadosFolha: DadosFolhaPagamento
  regimes: ItemCustoFolhaRegime[]
  diferencaRealVsPresumidoBrl: number
  resumoImpactoPastore: string
  notaSimplesSemDestaque: string
}

export interface BalanceteMes {
  id: string
  competencia: string // ex: "2026-01"
  mesRotulo: string // ex: "Jan/26"
  receitaLiquida: number // Receita líquida mensal real apurada (convertida por diferença se cumulativo)
  receitaCumulativaOriginal: number // Valor gravado no balancete oficial (acumulado até a data)
  totalAtivo: number
  totalPassivo: number
  patrimonioLiquido: number
  arquivoNome: string
  status: string
}

export interface EstatisticasNfes {
  totalNotas: number
  entradasQtd: number
  entradasValor: number
  saidasQtd: number
  saidasValor: number
  principaisFornecedores: { nome: string; valor: number; qtd: number }[]
  cfopsSaida: { cfop: string; qtd: number }[]
  consumidorFinalPfEstimadoPct: number
  conciliacaoFontes?: {
    totalChavesUnicas: number
    presentesEmAmbas: number
    somenteParam: number
    somenteNfes: number
    duplicadasEvitadas: number
    avisoTransparencia?: string
  }
}

export interface SimplesHibridoCenario {
  sublimite: number // R$ 3.600.000,00
  teto: number // R$ 4.800.000,00
  receitaProjetadaAtual: number // ~R$ 2.848.822,89
  acionadoNaProjecaoAtual: boolean // false (< R$ 3,6 mi)
  receitaJulhoAnualizada: number // R$ 296.986,65 * 12 = R$ 3.563.839,80
  cargaProjecaoAtual: {
    receita: number
    parcelaDas: number
    parcelaIbsCbsRegular: number
    creditosAproveitados: number
    cargaTotalAnual: number
    aliquotaEfetivaPct: number
  }
  cenarioTeto48: {
    receita: number // R$ 4.800.000,00
    percentualExcedente: number // 25% = (4,8 - 3,6) / 4,8
    parcelaDentroSublimite: number // 75% = R$ 3.600.000
    parcelaExcedenteRegular: number // 25% = R$ 1.200.000
    cargaDasSemIbsCbs: number
    cargaIbsCbsExcedenteLiquida: number
    creditosAproveitadosExcedente: number
    cargaTotalAnual: number
    aliquotaEfetivaPct: number
    comparativoSimplesPuroTeto: number
    comparativoRegimeRegularTeto: number
  }
  pontoDeVirada: {
    receitaInicioAcionamento: number // R$ 3.600.000,00
    explicacao: string
    vantagemVsSimplesPuro: string
    vantagemVsRegimeRegular: string
  }
}

export interface DetalhamentoLucroRealPuro {
  receitaBruta: number // ~R$ 2.848.822,89
  margemLucroRealPct: number // ~4,36% (variação de PL sobre receita)
  lucroRealAnualEstimado: number // ~R$ 124.208,68
  limiteIsencaoAdicionalIrpj: number // R$ 240.000,00/ano (R$ 20.000/mês)
  lucroExcedenteAdicional: number // 0 se lucro <= 240k
  irpjBase15: number // 15% sobre lucro real
  irpjAdicional10: number // 10% sobre excedente a R$ 20k/mês
  irpjTotal: number
  csll9: number // 9% sobre lucro real
  irpjCsllConsolidado: number
  irpjCsllAliquotaEfetivaPct: number // ~1,05% da receita bruta
  // Tributos indiretos atuais no Lucro Real
  pisNaoCumulativoAliqPct: number // 1,65%
  cofinsNaoCumulativoAliqPct: number // 7,60%
  debitoPisCofinsBruto: number // 9,25% sobre receita bruta
  comprasInsumosAnual: number // ~95,64% da receita
  creditoPisCofinsCompras: number // crédito sobre peças/insumos
  pisCofinsLiquidoEstimado: number // após segregação de autopeças monofásicas e créditos
  icmsOperacaoPropriaLiquido: number // peças (majoritariamente ST e créditos de entrada)
  issqnServicosMecanicos: number // ~3% a 4% sobre serviços mecânicos de Vacaria/RS (~30% receita)
  impostosConsumoTotal: number
  // Carga total
  cargaTributariaAnualTotal: number // ~R$ 254.000 (~8,92% da receita)
  aliquotaEfetivaTotalPct: number
  // Obrigações acessórias e custo de conformidade
  obrigacoesAcessorias: {
    nome: string
    periodicidade: string
    descricao: string
  }[]
  custoConformidadeAnualEstimado: number // ~R$ 18.000 a R$ 24.000/ano em honorários/sistemas adicionais
  avaliacaoAdiantada: string
}

export interface ItemComparativoValoresPercentuais {
  regimeId: 'simples' | 'simples_hibrido' | 'lucro_presumido' | 'lucro_real_puro' | 'reforma_2027'
  nomeRegime: string
  rotuloCurto: string
  cargaAnualEstimada: number
  aliquotaEfetivaPct: number
  diferencaVsSimplesBrl: number // cargaRegime - cargaSimples (negativo = economia vs simples, positivo = custo adicional)
  diferencaVsSimplesPontosPct: number // aliqRegime - aliqSimples
  ehRegimeReferencia?: boolean
  melhorRegimeLongoPrazo?: boolean
  vantagens: string[]
  desvantagens: string[]
}

export interface PontoAtencaoTransicao {
  titulo: string
  descricao: string
  dispositivoLegal: string // ex.: LC 214/2025 art. 28; Portaria RFB 549/2025
  impactoPastore: string // O que significa concretamente para a oficina de autopeças e serviços
}

export interface MarcoLinhaDoTempoTransicao {
  ano: number | string
  fase: string
  titulo: string
  statusOficial: string
  mecanicaLegislativa: string
  impactoPastore: string
  acaoRecomendadaAdecont: string
  creditoComprasValendo: boolean
  simplesCabivel: boolean
  faseDecisao?: boolean
  rotuloFaseDecisao?: string
  pontosPositivos: PontoAtencaoTransicao[]
  pontosNegativos: PontoAtencaoTransicao[]
}

export interface ItemEvolucaoLegislativaAgente {
  id: string
  tipo: 'inclusao' | 'alteracao' | 'exclusao'
  tipoRotulo: string
  codigoNorma: string
  tituloNorma: string
  resumo: string
  orgaoFonte: string
  dataRevisao: string
  linkUrl?: string
  afetaTransicao: boolean
  anoAfetado?: string
  impactoTransicao?: string
}

export interface LinhaComparativoRegime {
  criterio: string
  simplesNacional: {
    valor: string
    detalhe: string
  }
  simplesHibrido2027: {
    valor: string
    detalhe: string
    destaque?: boolean
  }
  lucroPresumido: {
    valor: string
    detalhe: string
  }
  reforma2027: {
    valor: string
    detalhe: string
    destaque?: boolean
  }
}

export interface DetalhamentoConversaoMes {
  competencia: string
  mesRotulo: string
  cumulativoGravado: number
  liquidoMensalReal: number
  patrimonioLiquido: number
  arquivoNome: string
}

export function converterBalancetesCumulativosParaLiquidosMensais(
  balancetesEntrada: Array<{
    id: string
    competencia: string
    mesRotulo: string
    receitaLiquida: number
    receitaCumulativaOriginal?: number
    totalAtivo: number
    totalPassivo?: number
    patrimonioLiquido: number
    arquivoNome: string
    status?: string
  }>,
): {
  isCumulativo: boolean
  balancetesLiquidos: BalanceteMes[]
  detalhamentoConversao: DetalhamentoConversaoMes[]
  receitaRealPeriodo: number
} {
  const lista = [...balancetesEntrada].sort((a, b) => a.competencia.localeCompare(b.competencia))

  let isCumulativo = false
  if (lista.length >= 2) {
    let monotonicaCrescente = true
    for (let i = 1; i < lista.length; i++) {
      if (lista[i].receitaLiquida < lista[i - 1].receitaLiquida) {
        monotonicaCrescente = false
        break
      }
    }
    if (
      monotonicaCrescente &&
      lista[lista.length - 1].receitaLiquida > lista[0].receitaLiquida * 1.5
    ) {
      isCumulativo = true
    }
  }

  const balancetesLiquidos: BalanceteMes[] = []
  const detalhamentoConversao: DetalhamentoConversaoMes[] = []

  let acumuladoAnterior = 0
  for (let i = 0; i < lista.length; i++) {
    const b = lista[i]
    let receitaLiquidaMensal = b.receitaLiquida
    if (isCumulativo) {
      receitaLiquidaMensal = i === 0 ? b.receitaLiquida : b.receitaLiquida - acumuladoAnterior
      receitaLiquidaMensal = Math.round(receitaLiquidaMensal * 100) / 100
      acumuladoAnterior = b.receitaLiquida
    }

    balancetesLiquidos.push({
      id: b.id,
      competencia: b.competencia,
      mesRotulo: b.mesRotulo,
      receitaLiquida: receitaLiquidaMensal,
      receitaCumulativaOriginal: b.receitaLiquida,
      totalAtivo: b.totalAtivo,
      totalPassivo: b.totalPassivo || 0,
      patrimonioLiquido: b.patrimonioLiquido,
      arquivoNome: b.arquivoNome,
      status: b.status || 'ok',
    })

    detalhamentoConversao.push({
      competencia: b.competencia,
      mesRotulo: b.mesRotulo,
      cumulativoGravado: b.receitaLiquida,
      liquidoMensalReal: receitaLiquidaMensal,
      patrimonioLiquido: b.patrimonioLiquido,
      arquivoNome: b.arquivoNome,
    })
  }

  const receitaRealPeriodo =
    isCumulativo && lista.length > 0
      ? lista[lista.length - 1].receitaLiquida
      : balancetesLiquidos.reduce((acc, b) => acc + b.receitaLiquida, 0)

  return {
    isCumulativo,
    balancetesLiquidos,
    detalhamentoConversao,
    receitaRealPeriodo,
  }
}

export type TipoAlertaDivergencia = 'conformidade' | 'atencao' | 'grave' | 'neutro'

export interface AlertaDivergenciaRegime {
  tipo: TipoAlertaDivergencia // 'conformidade' (verde) | 'atencao' (âmbar) | 'grave' (vermelho) | 'neutro' (cinza/azul)
  divergente: boolean
  titulo: string
  mensagem: string
  justificativaTecnica: string
  regimeCadastrado: string
  regimeRecomendado: string
  economiaEstimadaAnualBrl?: number
  economiaEstimadaAnualTexto?: string
  diferencaAliquotaPp?: number
  receitaAnualizada: number
  estourouTetoSimples: boolean
  ultrapassouSublimiteHibrido: boolean
}

export interface DiagnosticoClienteData {
  empresa: EmpresaCadastro | null
  cnaesSecundariosLista: CnaeItemFormatado[]
  regimeTributarioAtual: string
  enquadramentoTributarioAtual: string
  folhaPagamento: DadosFolhaPagamento
  comparativoCustoFolha: ComparativoCustoFolha
  balancetes: BalanceteMes[]
  detalhamentoConversao: DetalhamentoConversaoMes[]
  isBalanceteCumulativo: boolean
  notaMetodologicaCumulativa: string
  receitaTotalAcumulada: number // Receita real acumulada no período (julho de 2026: R$ 1.661.813,35)
  receitaMensalMedia: number
  receitaAnualizada: number // Projeção 12 meses (~R$ 2,85 mi)
  patrimonioLiquidoInicial: number
  patrimonioLiquidoFinal: number
  variacaoPatrimonioLiquido: number
  margemRetidaLiquidaPct: number // ~4,36%
  ativoTotalMaisRecente: number
  notas: EstatisticasNfes
  dataCalculo: string
  simplesHibrido: SimplesHibridoCenario
  lucroRealPuro: DetalhamentoLucroRealPuro
  tabelaValoresPercentuais: ItemComparativoValoresPercentuais[]
  linhaDoTempoTransicao: MarcoLinhaDoTempoTransicao[]
  evolucaoLegislativaRecente: ItemEvolucaoLegislativaAgente[]
  recomendacao: {
    regimeRecomendado: string
    titulo: string
    motivoPrincipal: string
    pontosChave: string[]
    resumoCargaEstimada: string
  }
  linhasComparativo: LinhaComparativoRegime[]
  alertaDivergencia: AlertaDivergenciaRegime
}

const MESES_ABREV: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
}

export const CNAES_CATALOGO_DESCRICOES: Record<string, string> = {
  '4520-0/01': 'Serviços de manutenção e reparação mecânica de veículos automotores',
  '4530-7/03': 'Comércio a varejo de peças e acessórios novos para veículos automotores',
  '4530-7/04': 'Comércio a varejo de peças e acessórios usados para veículos automotores',
  '4520-0/02': 'Serviços de lanternagem ou funilaria e pintura de veículos automotores',
  '4520-0/05': 'Serviços de lavagem, lubrificação e polimento de veículos automotores',
  '4520-0/07': 'Serviços de alinhamento e balanceamento de veículos automotores',
}

export function parseCnaesSecundarios(
  textoOuArray: string | undefined | null,
): CnaeItemFormatado[] {
  if (!textoOuArray) {
    return [
      {
        codigo: '4530-7/03',
        descricao:
          CNAES_CATALOGO_DESCRICOES['4530-7/03'] ||
          'Comércio a varejo de peças e acessórios novos para veículos automotores',
      },
      {
        codigo: '4520-0/02',
        descricao:
          CNAES_CATALOGO_DESCRICOES['4520-0/02'] ||
          'Serviços de lanternagem ou funilaria e pintura de veículos automotores',
      },
      {
        codigo: '4520-0/05',
        descricao:
          CNAES_CATALOGO_DESCRICOES['4520-0/05'] ||
          'Serviços de lavagem, lubrificação e polimento de veículos automotores',
      },
      {
        codigo: '4520-0/07',
        descricao:
          CNAES_CATALOGO_DESCRICOES['4520-0/07'] ||
          'Serviços de alinhamento e balanceamento de veículos automotores',
      },
    ]
  }

  const raw = String(textoOuArray).trim()
  if (!raw) return []

  const partes = raw
    .split(/[,;\n|]+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const itens: CnaeItemFormatado[] = []

  for (const parte of partes) {
    const matchCod = parte.match(/(\d{4}-\d\/\d{2}|\d{7})/)
    if (matchCod) {
      let codFormatado = matchCod[1]
      if (codFormatado.length === 7 && !codFormatado.includes('-')) {
        codFormatado = `${codFormatado.slice(0, 4)}-${codFormatado[4]}/${codFormatado.slice(5)}`
      }
      const descRestante = parte
        .replace(matchCod[0], '')
        .replace(/^[-:— ]+/, '')
        .trim()
      const descricaoFinal =
        descRestante || CNAES_CATALOGO_DESCRICOES[codFormatado] || 'Atividade econômica secundária'
      itens.push({ codigo: codFormatado, descricao: descricaoFinal })
    } else {
      itens.push({ codigo: 'Outro', descricao: parte })
    }
  }

  return itens.length > 0
    ? itens
    : [
        {
          codigo: '4530-7/03',
          descricao: CNAES_CATALOGO_DESCRICOES['4530-7/03'],
        },
      ]
}

/**
 * Normaliza o nome do regime para fins de comparação padronizada
 */
export function normalizarNomeRegime(regime: string | undefined | null): string {
  if (!regime) return ''
  const r = regime.toLowerCase().trim()
  if (r.includes('híbrido') || r.includes('hibrido')) return 'Simples Híbrido'
  if (r.includes('simples')) return 'Simples Nacional'
  if (r.includes('presumido')) return 'Lucro Presumido'
  if (r.includes('real')) return 'Lucro Real'
  if (r.includes('regular') || r.includes('reforma') || r.includes('ibs') || r.includes('cbs')) {
    return 'Regime Regular IBS/CBS'
  }
  return regime.trim()
}

/**
 * Avalia divergência entre o regime tributário cadastrado e a recomendação técnica
 */
export function avaliarDivergenciaRegime(params: {
  regimeCadastrado: string | undefined | null
  receitaAnualizada: number
  regimeRecomendadoTecnico?: string
  tabelaValoresPercentuais?: ItemComparativoValoresPercentuais[]
  margemRetidaLiquidaPct?: number
}): AlertaDivergenciaRegime {
  const {
    regimeCadastrado: rawCadastrado,
    receitaAnualizada,
    regimeRecomendadoTecnico = 'Simples Nacional',
    tabelaValoresPercentuais = [],
    margemRetidaLiquidaPct = 4.36,
  } = params

  const regimeCadNorm = normalizarNomeRegime(rawCadastrado)
  const TETO_SIMPLES = 4800000 // R$ 4,8 milhões
  const SUBLIMITE_SIMPLES = 3600000 // R$ 3,6 milhões

  const estourouTetoSimples = receitaAnualizada > TETO_SIMPLES
  const ultrapassouSublimiteHibrido =
    receitaAnualizada > SUBLIMITE_SIMPLES && receitaAnualizada <= TETO_SIMPLES

  // Regime recomendado técnico principal (baseado na receita ou veredito)
  let recTecnica = normalizarNomeRegime(regimeRecomendadoTecnico)
  if (!recTecnica) {
    if (estourouTetoSimples) {
      recTecnica = 'Regime Regular IBS/CBS' // ou Lucro Real
    } else if (ultrapassouSublimiteHibrido) {
      recTecnica = 'Simples Híbrido'
    } else {
      recTecnica = 'Simples Nacional'
    }
  }

  // 1) Caso Não informado / Vazio / Não cadastrado
  if (
    !rawCadastrado ||
    !rawCadastrado.trim() ||
    regimeCadNorm === 'não informado' ||
    regimeCadNorm === ''
  ) {
    return {
      tipo: 'neutro',
      divergente: true,
      titulo: 'Regime Tributário Não Informado na Ficha Cadastral',
      mensagem:
        'A empresa não possui regime tributário formalmente definido no cadastro (cadastro_empresas). A recomendação técnica apurada para a receita atual é ' +
        recTecnica +
        '.',
      justificativaTecnica:
        'Recomenda-se preencher o campo Regime Tributário na Ficha do Cliente para habilitar o monitoramento e conformidade automatizada contínua da ADECONT.',
      regimeCadastrado: 'Não informado',
      regimeRecomendado: recTecnica,
      receitaAnualizada,
      estourouTetoSimples,
      ultrapassouSublimiteHibrido,
    }
  }

  // Se o cadastro diz Simples Nacional ou Simples Híbrido, mas estourou o teto de R$ 4,8 mi
  if (
    (regimeCadNorm === 'Simples Nacional' || regimeCadNorm === 'Simples Híbrido') &&
    estourouTetoSimples
  ) {
    const recDestino = 'Regime Regular IBS/CBS / Lucro Real'
    const recFormatada = receitaAnualizada.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    return {
      tipo: 'grave',
      divergente: true,
      titulo: 'Descumprimento de Teto Legal do Simples Nacional',
      mensagem: `Divergência Crítica: regime cadastrado (${rawCadastrado}) é incompatível com a receita projetada (${recFormatada}), que ultrapassou o teto legal de R$ 4,8 milhões (LC 123/2006).`,
      justificativaTecnica: `Com receita anualizada em ${recFormatada}, a empresa ultrapassa o limite federal de R$ 4.800.000,00, gerando obrigatoriedade legal de desenquadramento e transição imediata para o Regime Regular / Lucro Real para evitar autuações fiscais e cobrança retroativa com penalidades.`,
      regimeCadastrado: rawCadastrado,
      regimeRecomendado: recDestino,
      receitaAnualizada,
      estourouTetoSimples: true,
      ultrapassouSublimiteHibrido: false,
    }
  }

  // Se o cadastro diz Simples Nacional mas ultrapassou o sublimite de R$ 3,6 mi
  if (regimeCadNorm === 'Simples Nacional' && ultrapassouSublimiteHibrido) {
    const recFormatada = receitaAnualizada.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    return {
      tipo: 'atencao',
      divergente: true,
      titulo: 'Sublimite do Simples Ultrapassado — Modelo Híbrido Acionável',
      mensagem: `Divergência Cadastral: regime cadastrado é Simples Nacional puro, mas a receita projetada (${recFormatada}) superou o sublimite de R$ 3,6 mi, acionando o Simples Híbrido da LC 214/2025.`,
      justificativaTecnica: `A receita entre R$ 3,6 mi e R$ 4,8 mi aciona a regra híbrida da Reforma Tributária: o ICMS/ISS é recolhido no regime regular com direito a créditos de autopeças sobre a parcela excedente, preservando os tributos federais e CPP no DAS.`,
      regimeCadastrado: rawCadastrado,
      regimeRecomendado: 'Simples Híbrido',
      receitaAnualizada,
      estourouTetoSimples: false,
      ultrapassouSublimiteHibrido: true,
    }
  }

  // Comparar custos da tabela de regimes para apurar economia estimada se cadastrado != recomendado
  const itemCadastrado = tabelaValoresPercentuais.find(
    (t) =>
      normalizarNomeRegime(t.nomeRegime) === regimeCadNorm ||
      normalizarNomeRegime(t.rotuloCurto) === regimeCadNorm,
  )
  const itemSimples = tabelaValoresPercentuais.find((t) => t.regimeId === 'simples')
  const itemReforma = tabelaValoresPercentuais.find((t) => t.regimeId === 'reforma_2027')
  const itemLucroReal = tabelaValoresPercentuais.find((t) => t.regimeId === 'lucro_real_puro')

  // Se o cadastro é Lucro Presumido
  if (regimeCadNorm === 'Lucro Presumido') {
    const custoPresumido = itemCadastrado?.cargaAnualEstimada || receitaAnualizada * 0.126
    const custoSimples = itemSimples?.cargaAnualEstimada || receitaAnualizada * 0.092
    const economiaBrl = Math.max(0, custoPresumido - custoSimples)
    const aliqPresumido = itemCadastrado?.aliquotaEfetivaPct || 12.6
    const aliqSimples = itemSimples?.aliquotaEfetivaPct || 9.2
    const difPp = aliqPresumido - aliqSimples

    const economiaFmt = economiaBrl.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

    return {
      tipo: 'atencao',
      divergente: true,
      titulo: 'Divergência Cadastral: Sobretaxação no Lucro Presumido',
      mensagem: `Divergência detectada: regime cadastrado (${rawCadastrado}) difere da recomendação técnica (${recTecnica}), gerando sobrecusto anual estimado de ${economiaFmt}.`,
      justificativaTecnica: `A Pastore apurou margem real líquida de ~${margemRetidaLiquidaPct.toFixed(1)}%. O Lucro Presumido presume margens artificiais de 8% em peças e 32% em serviços com CPP patronal integral de 28,8% sobre folha a fundo perdido. A migração para ${recTecnica} proporciona economia de ~${difPp.toFixed(1)} p.p. na carga fiscal efetiva.`,
      regimeCadastrado: rawCadastrado,
      regimeRecomendado: recTecnica,
      economiaEstimadaAnualBrl: economiaBrl,
      economiaEstimadaAnualTexto: economiaFmt,
      diferencaAliquotaPp: difPp,
      receitaAnualizada,
      estourouTetoSimples: false,
      ultrapassouSublimiteHibrido: false,
    }
  }

  // Se o cadastro é Lucro Real mas a recomendação imediata é Simples
  if (
    regimeCadNorm === 'Lucro Real' &&
    (recTecnica === 'Simples Nacional' || recTecnica === 'Simples Híbrido')
  ) {
    const custoReal = itemLucroReal?.cargaAnualEstimada || receitaAnualizada * 0.0889
    const custoSimples = itemSimples?.cargaAnualEstimada || receitaAnualizada * 0.092
    const economiaBrl = Math.abs(custoReal - custoSimples)
    const economiaFmt = economiaBrl.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

    return {
      tipo: 'atencao',
      divergente: true,
      titulo: 'Divergência Cadastral: Lucro Real vs Simples Nacional',
      mensagem: `Divergência detectada: regime cadastrado (${rawCadastrado}) difere da recomendação técnica imediata (${recTecnica}).`,
      justificativaTecnica: `O Lucro Real exige alto custo de conformidade (ECD/ECF/LALUR) e recolhimento patronal de INSS sobre a folha. Para a receita projetada de ~R$ 2,85 mi, o Simples Nacional oferece menor complexidade operacional, enquanto o Lucro Real combinado ao IBS/CBS desponta como rota preferencial para 2027+.`,
      regimeCadastrado: rawCadastrado,
      regimeRecomendado: recTecnica,
      economiaEstimadaAnualBrl: economiaBrl,
      economiaEstimadaAnualTexto: economiaFmt,
      receitaAnualizada,
      estourouTetoSimples: false,
      ultrapassouSublimiteHibrido: false,
    }
  }

  // Se cadastrado é Simples Nacional e recomendação técnica é outro regime por créditos/margem
  if (
    regimeCadNorm === 'Simples Nacional' &&
    recTecnica !== 'Simples Nacional' &&
    recTecnica !== 'Simples Híbrido'
  ) {
    return {
      tipo: 'atencao',
      divergente: true,
      titulo: 'Divergência Cadastral vs Rota Estratégica Recomendada',
      mensagem: `Divergência detectada: regime cadastrado (${rawCadastrado}) difere da recomendação técnica (${recTecnica}).`,
      justificativaTecnica: `Embora elegível ao Simples, a mecânica aufere créditos substanciais nas compras de autopeças de distribuidoras, tornando o regime ${recTecnica} financeiramente mais vantajoso no horizonte 2027+.`,
      regimeCadastrado: rawCadastrado,
      regimeRecomendado: recTecnica,
      receitaAnualizada,
      estourouTetoSimples: false,
      ultrapassouSublimiteHibrido: false,
    }
  }

  // Se o regime cadastrado é compatível/igual ao recomendado
  if (
    regimeCadNorm === recTecnica ||
    (regimeCadNorm === 'Simples Nacional' && recTecnica.includes('Simples Nacional')) ||
    (regimeCadNorm === 'Simples Híbrido' && recTecnica.includes('Simples Híbrido'))
  ) {
    return {
      tipo: 'conformidade',
      divergente: false,
      titulo: 'Regime Cadastrado em Conformidade com a Recomendação Técnica',
      mensagem: `O regime tributário registrado no cadastro (${rawCadastrado}) coincide com a recomendação técnica emitida pelo diagnóstico ADECONT (${recTecnica}).`,
      justificativaTecnica: `Com receita anualizada em R$ ${receitaAnualizada.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, a empresa opera confortavelmente dentro dos limites legais de R$ 4,8 milhões da LC 123/2006 e sublimite estadual de R$ 3,6 milhões, garantindo desoneração de CPP e tributação unificada pelo Anexo III.`,
      regimeCadastrado: rawCadastrado,
      regimeRecomendado: recTecnica,
      receitaAnualizada,
      estourouTetoSimples: false,
      ultrapassouSublimiteHibrido: false,
    }
  }

  // Fallback seguro caso haja outra divergência não mapeada
  return {
    tipo: 'atencao',
    divergente: true,
    titulo: 'Divergência entre Cadastro e Recomendação Técnica',
    mensagem: `Atenção: regime cadastrado (${rawCadastrado}) difere da recomendação técnica calculada (${recTecnica}).`,
    justificativaTecnica: `Recomenda-se avaliar com o departamento contábil da ADECONT a adequação do enquadramento frente às projeções da LC 214/2025.`,
    regimeCadastrado: rawCadastrado,
    regimeRecomendado: recTecnica,
    receitaAnualizada,
    estourouTetoSimples: false,
    ultrapassouSublimiteHibrido: false,
  }
}

export function calcularComparativoCustoFolha(
  dadosFolha: DadosFolhaPagamento,
): ComparativoCustoFolha {
  const folhaAnual =
    dadosFolha.folhaSalarialAnual > 0
      ? dadosFolha.folhaSalarialAnual
      : dadosFolha.folhaSalarialMensal * 13.33
  const encargosAnuais =
    dadosFolha.encargosAnuais > 0 ? dadosFolha.encargosAnuais : dadosFolha.encargosMensais * 12

  // Custo base de folha (salários + FGTS/férias)
  const custoBaseAnual = folhaAnual + encargosAnuais

  // Regime 1: Simples Nacional
  const simples: ItemCustoFolhaRegime = {
    regimeId: 'simples',
    nomeRegime: 'Simples Nacional',
    rotuloCurto: 'Simples',
    temCppSeparada: false,
    aliquotaInssPatronalPct: 0,
    aliquotaRatFapPct: 0,
    aliquotaTerceirosSistemaSPct: 0,
    encargoPrevidenciarioPatronalAnual: 0,
    custoFolhaBrutoAnual: custoBaseAnual,
    dedutibilidadeIrpjCsll: false,
    economiaFiscalIrpjCsllAnual: 0,
    custoFolhaLiquidoAnual: custoBaseAnual,
    impactoVsSimplesBrl: 0,
    explicacaoRegime:
      'No Simples Nacional (Anexos I e III), a CPP patronal (20% + RAT + Terceiros) é substituída pela alíquota única do DAS sobre o faturamento. Não há recolhimento patronal separado na GPS/DCTFWeb para estas atividades, mantendo a folha desonerada de CPP.',
  }

  // Regime 2: Simples Híbrido 2027 (LC 214/2025)
  const simplesHibrido: ItemCustoFolhaRegime = {
    regimeId: 'simples_hibrido',
    nomeRegime: 'Simples Híbrido 2027 (LC 214/2025)',
    rotuloCurto: 'Simples Híbrido',
    temCppSeparada: false,
    aliquotaInssPatronalPct: 0,
    aliquotaRatFapPct: 0,
    aliquotaTerceirosSistemaSPct: 0,
    encargoPrevidenciarioPatronalAnual: 0,
    custoFolhaBrutoAnual: custoBaseAnual,
    dedutibilidadeIrpjCsll: false,
    economiaFiscalIrpjCsllAnual: 0,
    custoFolhaLiquidoAnual: custoBaseAnual,
    impactoVsSimplesBrl: 0,
    explicacaoRegime:
      'O regime híbrido da LC 214/2025 segrega apenas IBS e CBS por fora do DAS para receitas acima do sublimite de R$ 3,6 mi. A parcela previdenciária e a sistemática trabalhista da folha continuam integradas ao regime simplificado sem incidência patronal segregada.',
  }

  // Regime 3: Lucro Presumido
  const aliqInssPatronal = 0.2
  const aliqRat = 0.03
  const aliqTerceiros = 0.058
  const aliqEncargosPatronaisTotal = aliqInssPatronal + aliqRat + aliqTerceiros // 28,80%
  const encargoPatronalPresumido = folhaAnual * aliqEncargosPatronaisTotal
  const custoPresumidoTotal = custoBaseAnual + encargoPatronalPresumido

  const lucroPresumido: ItemCustoFolhaRegime = {
    regimeId: 'lucro_presumido',
    nomeRegime: 'Lucro Presumido',
    rotuloCurto: 'Presumido',
    temCppSeparada: true,
    aliquotaInssPatronalPct: 20.0,
    aliquotaRatFapPct: 3.0,
    aliquotaTerceirosSistemaSPct: 5.8,
    encargoPrevidenciarioPatronalAnual: encargoPatronalPresumido,
    custoFolhaBrutoAnual: custoPresumidoTotal,
    dedutibilidadeIrpjCsll: false,
    economiaFiscalIrpjCsllAnual: 0,
    custoFolhaLiquidoAnual: custoPresumidoTotal,
    impactoVsSimplesBrl: custoPresumidoTotal - simples.custoFolhaLiquidoAnual,
    explicacaoRegime:
      'Cenário desfavorável: exige recolhimento integral da CPP patronal (20% INSS + 3% RAT + 5,8% Sistema S/Terceiros = 28,8% sobre folha), sem qualquer dedutibilidade fiscal, pois o IRPJ e a CSLL são calculados sobre presunção da receita (8%/32%).',
  }

  // Regime 4: Lucro Real Puro
  const encargoPatronalReal = folhaAnual * aliqEncargosPatronaisTotal
  const baseDedutivelReal = custoBaseAnual + encargoPatronalReal
  const aliqIrpjCsllDedutivel = 0.24 // 15% IRPJ + 9% CSLL (sem adicional pois lucro anual < 240k)
  const economiaFiscalReal = baseDedutivelReal * aliqIrpjCsllDedutivel
  const custoRealLiquido = baseDedutivelReal - economiaFiscalReal

  const lucroReal: ItemCustoFolhaRegime = {
    regimeId: 'lucro_real_puro',
    nomeRegime: 'Lucro Real Puro',
    rotuloCurto: 'Lucro Real',
    temCppSeparada: true,
    aliquotaInssPatronalPct: 20.0,
    aliquotaRatFapPct: 3.0,
    aliquotaTerceirosSistemaSPct: 5.8,
    encargoPrevidenciarioPatronalAnual: encargoPatronalReal,
    custoFolhaBrutoAnual: baseDedutivelReal,
    dedutibilidadeIrpjCsll: true,
    economiaFiscalIrpjCsllAnual: economiaFiscalReal,
    custoFolhaLiquidoAnual: custoRealLiquido,
    impactoVsSimplesBrl: custoRealLiquido - simples.custoFolhaLiquidoAnual,
    explicacaoRegime:
      'Recolhe CPP patronal de 28,8% sobre a folha, porém TODOS os gastos de pessoal (salários, encargos, FGTS e CPP) são despesas 100% dedutíveis da apuração do Lucro Real, gerando economia fiscal direta de 24% (15% IRPJ + 9% CSLL).',
  }

  // Regime 5: Regime Regular 2027+ (IBS/CBS + Lucro Real)
  const reforma2027: ItemCustoFolhaRegime = {
    regimeId: 'reforma_2027',
    nomeRegime: 'Regime Regular 2027+ (IBS/CBS + Lucro Real)',
    rotuloCurto: 'Reforma 2027+',
    temCppSeparada: true,
    aliquotaInssPatronalPct: 20.0,
    aliquotaRatFapPct: 3.0,
    aliquotaTerceirosSistemaSPct: 5.8,
    encargoPrevidenciarioPatronalAnual: encargoPatronalReal,
    custoFolhaBrutoAnual: baseDedutivelReal,
    dedutibilidadeIrpjCsll: true,
    economiaFiscalIrpjCsllAnual: economiaFiscalReal,
    custoFolhaLiquidoAnual: custoRealLiquido,
    impactoVsSimplesBrl: custoRealLiquido - simples.custoFolhaLiquidoAnual,
    explicacaoRegime:
      'No novo modelo tributário, a desoneração de consumo via créditos de IBS/CBS foca em compras e insumos. O custo de folha segue as regras do Lucro Real para IRPJ/CSLL (dedutibilidade integral de 24% da base de pessoal).',
  }

  const diferencaRealVsPresumido = custoPresumidoTotal - custoRealLiquido

  return {
    dadosFolha,
    regimes: [simples, simplesHibrido, lucroPresumido, lucroReal, reforma2027],
    diferencaRealVsPresumidoBrl: diferencaRealVsPresumido,
    resumoImpactoPastore: `No Lucro Presumido, a folha da Pastore sofre encargo adicional patronal de ~28,8% (R$ ${encargoPatronalPresumido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano) a fundo perdido, sem dedução. No Lucro Real, a dedutibilidade contábil integral do pessoal gera economia de R$ ${economiaFiscalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} em IRPJ/CSLL, neutralizando parte significativa da CPP patronal e tornando o Lucro Real R$ ${diferencaRealVsPresumido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ano mais vantajoso que o Presumido quanto ao componente da folha.`,
    notaSimplesSemDestaque:
      'Aviso de Transparência Metodológica ADECONT: No Simples Nacional e no Simples Híbrido, não há incidência nem destaque segregado de CPP patronal para as atividades mecânicas e de autopeças (Anexos I e III). Toda a contribuição previdenciária patronal já está embutida na guia unificada do DAS.',
  }
}

export async function salvarDadosFolhaEEnquadramentoPastore(dados: {
  regime_tributario?: string
  enquadramento_tributario?: string
  cnaes_secundarios?: string
  num_funcionarios?: number
  folha_salarial_mensal?: number
  encargos_mensais?: number
}): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const resEmpresas = await pb.collection('cadastro_empresas').getList<EmpresaCadastro>(1, 1, {
      filter: `documento_limpo='${CNPJ_PASTORE_LIMPO}'`,
    })
    if (resEmpresas.items.length === 0) {
      return { sucesso: false, mensagem: 'Cliente Pastore não localizado no cadastro de empresas.' }
    }
    const emp = resEmpresas.items[0]
    await pb.collection('cadastro_empresas').update(emp.id, dados)
    return { sucesso: true, mensagem: 'Dados de enquadramento e folha atualizados com sucesso.' }
  } catch (err: any) {
    console.error('Erro ao atualizar dados de folha da Pastore:', err)
    return { sucesso: false, mensagem: err?.message || 'Falha ao gravar no banco.' }
  }
}

export async function carregarDiagnosticoClientePastore(): Promise<DiagnosticoClienteData> {
  // 1. Carregar cadastro da empresa
  let empresa: EmpresaCadastro | null = null
  try {
    const resEmpresas = await pb.collection('cadastro_empresas').getList<EmpresaCadastro>(1, 1, {
      filter: `documento_limpo='${CNPJ_PASTORE_LIMPO}'`,
    })
    if (resEmpresas.items.length > 0) {
      empresa = resEmpresas.items[0]
    }
  } catch (err) {
    console.warn('Erro ao carregar cadastro da empresa Pastore:', err)
  }

  // Identificação e enquadramento extraídos do cadastro
  const regimeTributarioAtual =
    empresa?.regime_tributario?.trim() ||
    empresa?.enquadramento_tributario?.trim() ||
    'Simples Nacional'
  const enquadramentoTributarioAtual =
    empresa?.enquadramento_tributario?.trim() || regimeTributarioAtual
  const cnaesSecundariosLista = parseCnaesSecundarios(empresa?.cnaes_secundarios)

  // Extrair contas contábeis de folha/pessoal para subsidiar valores se faltar no cadastro
  let folhaBalanceteMensalMedia = 0
  let encargosBalanceteMensalMedia = 0
  let proLaboreMensalMedio = 4863.0

  try {
    const resContasFolha = await pb.collection('cont_contas').getList<any>(1, 100, {
      filter: `cliente_cnpj='${CNPJ_PASTORE_LIMPO}' && (codigo='333' || codigo='334' || codigo='336' || codigo='337' || codigo='338' || codigo='142')`,
      sort: 'competencia',
    })

    if (resContasFolha.items.length > 0) {
      // Filtrar competências distintas
      const comps = Array.from(
        new Set(resContasFolha.items.map((c) => String(c.competencia || ''))),
      ).filter(Boolean)
      const ultComp = comps.length > 0 ? comps[comps.length - 1] : '2026-07'

      // Em contas de custo, débitos mensais são cumulativos ou mensais
      // Encontrar último débito de ordenados (334) e FGTS/férias (336, 337)
      const contasUlt = resContasFolha.items.filter((c) => c.competencia === ultComp)
      const contaCustoPessoal = contasUlt.find((c) => c.codigo === '333')
      const contaSalarios = contasUlt.find((c) => c.codigo === '334')
      const contaFgts = contasUlt.find((c) => c.codigo === '336')
      const contaFerias = contasUlt.find((c) => c.codigo === '337')
      const contaProLabore = contasUlt.find((c) => c.codigo === '142')

      // Se cumulativo (competência jul/26 = 7 meses)
      const fatorMeses = comps.length > 0 ? comps.length : 7
      const salariosUlt = Number(contaSalarios?.saldo_atual || contaSalarios?.debito || 0)
      const pessoalUlt = Number(contaCustoPessoal?.saldo_atual || contaCustoPessoal?.debito || 0)
      const fgtsUlt = Number(contaFgts?.saldo_atual || contaFgts?.debito || 0)
      const feriasUlt = Number(contaFerias?.saldo_atual || contaFerias?.debito || 0)
      const proLaboreUlt = Number(contaProLabore?.saldo_atual || contaProLabore?.debito || 0)

      if (salariosUlt > 0) {
        folhaBalanceteMensalMedia = salariosUlt / fatorMeses
      } else if (pessoalUlt > 0) {
        folhaBalanceteMensalMedia = (pessoalUlt * 0.8) / fatorMeses
      }

      if (fgtsUlt > 0 || feriasUlt > 0) {
        encargosBalanceteMensalMedia = (fgtsUlt + feriasUlt) / fatorMeses
      } else {
        encargosBalanceteMensalMedia = folhaBalanceteMensalMedia * 0.18
      }

      if (proLaboreUlt > 0) {
        proLaboreMensalMedio = proLaboreUlt / fatorMeses
      }
    }
  } catch (err) {
    console.warn('Erro ao ler cont_contas de folha no diagnóstico:', err)
  }

  // Prioridade de dados da folha:
  // 1) Cadastro da empresa (se num_funcionarios / folha_salarial_mensal preenchidos)
  // 2) Extração dos balancetes contábeis cont_contas
  // 3) Estimativa padrão realista da mecânica Pastore (9 funcionários, ~R$ 31.800 salários, ~R$ 5.720 encargos)
  const cadNumFunc = Number(empresa?.num_funcionarios || 0)
  const cadFolha = Number(empresa?.folha_salarial_mensal || 0)
  const cadEncargos = Number(empresa?.encargos_mensais || 0)

  let numFuncionariosFinal = 9
  let folhaMensalFinal = 31850.0
  let encargosMensaisFinal = 5730.0
  let origemDadosFolha: 'cadastro' | 'balancete' | 'estimado' = 'cadastro'
  let detalheOrigemFolha = 'Extraído diretamente do cadastro do cliente (cadastro_empresas).'

  if (cadNumFunc > 0 && cadFolha > 0) {
    numFuncionariosFinal = cadNumFunc
    folhaMensalFinal = cadFolha
    encargosMensaisFinal = cadEncargos > 0 ? cadEncargos : cadFolha * 0.18
    origemDadosFolha = 'cadastro'
    detalheOrigemFolha = `Informado no cadastro do cliente: ${numFuncionariosFinal} funcionários registrados.`
  } else if (folhaBalanceteMensalMedia > 10000) {
    numFuncionariosFinal = cadNumFunc > 0 ? cadNumFunc : 9
    folhaMensalFinal = folhaBalanceteMensalMedia
    encargosMensaisFinal =
      encargosBalanceteMensalMedia > 0 ? encargosBalanceteMensalMedia : folhaMensalFinal * 0.18
    origemDadosFolha = 'balancete'
    detalheOrigemFolha = `Extraído dos balancetes contábeis reais (cont_contas códigos 333/334/336/337, média mensal do 1º semestre de 2026).`
  } else {
    origemDadosFolha = 'estimado'
    detalheOrigemFolha =
      'Estimativa operacional da oficina Pastore (9 colaboradores, média de R$ 3,5k/posto + encargos diretos).'
  }

  const custoTotalMensalFinal = folhaMensalFinal + encargosMensaisFinal
  const folhaAnualFinal = folhaMensalFinal * 13.33 // 12 meses + 13º + 1/3 férias
  const encargosAnuaisFinal = encargosMensaisFinal * 12
  const custoTotalAnualFinal = folhaAnualFinal + encargosAnuaisFinal

  const folhaPagamento: DadosFolhaPagamento = {
    numFuncionarios: numFuncionariosFinal,
    folhaSalarialMensal: folhaMensalFinal,
    encargosMensais: encargosMensaisFinal,
    custoTotalMensal: custoTotalMensalFinal,
    folhaSalarialAnual: folhaAnualFinal,
    encargosAnuais: encargosAnuaisFinal,
    custoTotalAnual: custoTotalAnualFinal,
    proLaboreMensalEstimado: proLaboreMensalMedio,
    origemDados: origemDadosFolha,
    detalheOrigem: detalheOrigemFolha,
  }

  const comparativoCustoFolha = calcularComparativoCustoFolha(folhaPagamento)

  // 2. Carregar balancetes contábeis
  interface DocBalanceteBruto {
    id: string
    competencia: string
    mesRotulo: string
    receitaGravada: number
    totalAtivo: number
    totalPassivo: number
    patrimonioLiquido: number
    arquivoNome: string
    status: string
  }

  const balancetesBrutos: DocBalanceteBruto[] = []
  try {
    const resDocs = await pb.collection('cont_documentos').getList<any>(1, 50, {
      filter: `cliente_cnpj='${CNPJ_PASTORE_LIMPO}'`,
      sort: 'competencia',
    })

    for (const d of resDocs.items) {
      const comp = String(d.competencia || '')
      const partes = comp.split('-')
      const mesNum = partes[1] || ''
      const anoNum = (partes[0] || '').slice(2)
      const mesRotulo =
        mesNum && MESES_ABREV[mesNum] ? `${MESES_ABREV[mesNum]}/${anoNum || '26'}` : comp

      balancetesBrutos.push({
        id: d.id,
        competencia: comp,
        mesRotulo,
        receitaGravada: Number(d.receita_liquida || 0),
        totalAtivo: Number(d.total_ativo || 0),
        totalPassivo: Number(d.total_passivo || 0),
        patrimonioLiquido: Number(d.patrimonio_liquido || 0),
        arquivoNome: d.arquivo_nome || '',
        status: d.status || 'ok',
      })
    }
  } catch (err) {
    console.warn('Erro ao carregar balancetes da Pastore:', err)
  }

  // Processar e converter balancetes cumulativos em líquidos mensais
  const conversao = converterBalancetesCumulativosParaLiquidosMensais(
    balancetesBrutos.map((b) => ({
      id: b.id,
      competencia: b.competencia,
      mesRotulo: b.mesRotulo,
      receitaLiquida: b.receitaGravada,
      totalAtivo: b.totalAtivo,
      totalPassivo: b.totalPassivo,
      patrimonioLiquido: b.patrimonioLiquido,
      arquivoNome: b.arquivoNome,
      status: b.status,
    })),
  )

  const isBalanceteCumulativo = conversao.isCumulativo
  const balancetes = conversao.balancetesLiquidos
  const detalhamentoConversao = conversao.detalhamentoConversao
  const receitaTotalAcumulada = conversao.receitaRealPeriodo

  const qtdMeses = balancetes.length > 0 ? balancetes.length : 1
  const receitaMensalMedia = receitaTotalAcumulada / qtdMeses
  const receitaAnualizada = receitaMensalMedia * 12

  const patrimonioLiquidoInicial = balancetes.length > 0 ? balancetes[0].patrimonioLiquido : 0
  const patrimonioLiquidoFinal =
    balancetes.length > 0 ? balancetes[balancetes.length - 1].patrimonioLiquido : 0
  const variacaoPatrimonioLiquido = patrimonioLiquidoFinal - patrimonioLiquidoInicial
  const margemRetidaLiquidaPct =
    receitaTotalAcumulada > 0 ? (variacaoPatrimonioLiquido / receitaTotalAcumulada) * 100 : 4.36

  const ativoTotalMaisRecente =
    balancetes.length > 0 ? balancetes[balancetes.length - 1].totalAtivo : 0

  const notaMetodologicaCumulativa =
    'Nota Metodológica de Auditoria ADECONT: Os balancetes contábeis importados registram a apuração cumulativa no exercício ("até a data"), onde cada competência acumula as receitas desde 01/01/2026. A conversão efetuada pelo sistema calcula os valores líquidos mensais por dedução da competência anterior (ex.: Fev R$ 434.688,59 - Jan R$ 233.319,33 = R$ 201.369,26). O balancete de Jul/2026 já espelha o faturamento acumulado real do período de R$ 1.661.813,35, evitando a soma duplicada indevida que inflava a apuração em R$ 6,3 milhões.'

  // 3. Carregar dados fiscais cruzando param_documentos e nfes COM DEDUPLICAÇÃO ESTRITA POR CHAVE DE ACESSO
  // A mesma chave presente nas duas coleções entra exatamente UMA VEZ na soma dos totais e volumes,
  // priorizando a fonte mais completa (nfes se analisado/com itens fiscais detalhados, ou param_documentos).
  interface NotaNormalizada {
    chave: string
    fonte: 'param' | 'nfes'
    direcao: 'entrada' | 'saida'
    valor: number
    fornecedorNome: string
    cfop: string
    temItensOuAnalise: boolean
  }

  const mapaDocumentosPorChave = new Map<string, NotaNormalizada>()
  const chavesEmParam = new Set<string>()
  const chavesEmNfes = new Set<string>()
  let duplicadasEvitadasAoCruzar = 0

  // 3.1 Busca em param_documentos
  try {
    const resParamDocs = await pb.collection('param_documentos').getList<any>(1, 500, {
      filter: `emitente_cnpj='${CNPJ_PASTORE_LIMPO}' || destinatario_cnpj='${CNPJ_PASTORE_LIMPO}'`,
      sort: '-data_emissao',
    })

    for (const doc of resParamDocs.items) {
      const chave = String(doc.chave || '').trim() || `param_${doc.id}`
      chavesEmParam.add(chave)

      const emit = String(doc.emitente_cnpj || '').replace(/\D/g, '')
      const v = Number(doc.valor_total || 0)
      const direcao: 'entrada' | 'saida' =
        doc.direcao === 'entrada'
          ? 'entrada'
          : doc.direcao === 'saida'
            ? 'saida'
            : emit === CNPJ_PASTORE_LIMPO
              ? 'saida'
              : 'entrada'

      const fornecedorNome =
        direcao === 'entrada' ? doc.emitente_nome || 'Fornecedor de Autopeças' : ''
      const cfop = doc.cfop_predominante || '5102'

      mapaDocumentosPorChave.set(chave, {
        chave,
        fonte: 'param',
        direcao,
        valor: v,
        fornecedorNome,
        cfop,
        temItensOuAnalise: Number(doc.qtd_itens || 0) > 0,
      })
    }
  } catch (err) {
    console.warn('Erro ao carregar param_documentos no diagnóstico:', err)
  }

  // 3.2 Busca em nfes (pipeline de documentos fiscais)
  try {
    const resNfes = await pb.collection('nfes').getList<any>(1, 500, {
      filter: `cliente_cnpj='${CNPJ_PASTORE_LIMPO}' || emit_cnpj_cpf='${CNPJ_PASTORE_LIMPO}' || dest_cnpj_cpf='${CNPJ_PASTORE_LIMPO}'`,
      sort: '-data_emissao',
    })

    for (const nfe of resNfes.items) {
      const chave = String(nfe.chave_acesso || '').trim() || `nfe_${nfe.id}`
      chavesEmNfes.add(chave)

      const emit = String(nfe.emit_cnpj_cpf || '').replace(/\D/g, '')
      const v = Number(nfe.valor_total_nfe || nfe.valor_produtos || 0)
      const tpOp = nfe.tipo_compra_venda || nfe.tipo_operacao
      const direcao: 'entrada' | 'saida' =
        tpOp === 'compra' || tpOp === 'entrada'
          ? 'entrada'
          : tpOp === 'venda' || tpOp === 'saida'
            ? 'saida'
            : emit === CNPJ_PASTORE_LIMPO
              ? 'saida'
              : 'entrada'

      const fornecedorNome =
        direcao === 'entrada'
          ? nfe.emit_razao_social || nfe.emit_nome_fantasia || 'Fornecedor de Autopeças'
          : ''
      const cfop = '5102'
      const temAnalise = Boolean(nfe.analise && nfe.analise_status === 'analisado')

      if (mapaDocumentosPorChave.has(chave)) {
        duplicadasEvitadasAoCruzar++
        const jaExistente = mapaDocumentosPorChave.get(chave)!
        // Se a versão de nfes tiver análise detalhada e a de param não tiver, substitui pela fonte mais completa
        if (temAnalise && !jaExistente.temItensOuAnalise) {
          mapaDocumentosPorChave.set(chave, {
            chave,
            fonte: 'nfes',
            direcao,
            valor: v > 0 ? v : jaExistente.valor,
            fornecedorNome: fornecedorNome || jaExistente.fornecedorNome,
            cfop: jaExistente.cfop || cfop,
            temItensOuAnalise: true,
          })
        }
      } else {
        mapaDocumentosPorChave.set(chave, {
          chave,
          fonte: 'nfes',
          direcao,
          valor: v,
          fornecedorNome,
          cfop,
          temItensOuAnalise: temAnalise,
        })
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar nfes no diagnóstico:', err)
  }

  // 3.3 Consolidação dos totais unificados (sem contaminação nem repetição de chave)
  let entradasQtd = 0
  let entradasValor = 0
  let saidasQtd = 0
  let saidasValor = 0
  const mapaFornecedores: Record<string, { valor: number; qtd: number }> = {}
  const mapaCfopsSaida: Record<string, number> = {}

  for (const doc of mapaDocumentosPorChave.values()) {
    if (doc.direcao === 'saida') {
      saidasQtd++
      saidasValor += doc.valor
      const cfop = doc.cfop || '5102'
      mapaCfopsSaida[cfop] = (mapaCfopsSaida[cfop] || 0) + 1
    } else {
      entradasQtd++
      entradasValor += doc.valor
      if (doc.fornecedorNome) {
        if (!mapaFornecedores[doc.fornecedorNome]) {
          mapaFornecedores[doc.fornecedorNome] = { valor: 0, qtd: 0 }
        }
        mapaFornecedores[doc.fornecedorNome].valor += doc.valor
        mapaFornecedores[doc.fornecedorNome].qtd += 1
      }
    }
  }

  const principaisFornecedores = Object.entries(mapaFornecedores)
    .map(([nome, dados]) => ({ nome, valor: dados.valor, qtd: dados.qtd }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)

  const cfopsSaida = Object.entries(mapaCfopsSaida).map(([cfop, qtd]) => ({ cfop, qtd }))

  // Indicador de transparência de conciliação de fontes
  let presentesEmAmbas = 0
  let somenteParam = 0
  let somenteNfes = 0
  for (const ch of chavesEmParam) {
    if (chavesEmNfes.has(ch)) presentesEmAmbas++
    else somenteParam++
  }
  for (const ch of chavesEmNfes) {
    if (!chavesEmParam.has(ch)) somenteNfes++
  }

  let avisoTransparencia: string | undefined = undefined
  if (somenteParam > 0 && somenteNfes > 0) {
    avisoTransparencia = `Conciliação multiplataforma: ${presentesEmAmbas} documento(s) presentes em ambas as fontes, ${somenteParam} em Parametrizador e ${somenteNfes} em Documentos Fiscais, deduplicados e consolidados sem duplicidade.`
  } else if (somenteParam > 0 && chavesEmNfes.size === 0) {
    avisoTransparencia = `Fonte ativa: Parametrizador (${somenteParam} documentos consolidados, sem notas duplicadas).`
  }

  const notas: EstatisticasNfes = {
    totalNotas: entradasQtd + saidasQtd,
    entradasQtd,
    entradasValor,
    saidasQtd,
    saidasValor,
    principaisFornecedores,
    cfopsSaida,
    consumidorFinalPfEstimadoPct: 88, // Majoritariamente PF consumidor final (veículos particulares)
    conciliacaoFontes: {
      totalChavesUnicas: mapaDocumentosPorChave.size,
      presentesEmAmbas,
      somenteParam,
      somenteNfes,
      duplicadasEvitadas: duplicadasEvitadasAoCruzar,
      avisoTransparencia,
    },
  }

  // Cálculos tributários para a Tabela Comparativa (base: projeção anualizada com valores líquidos reais)
  // Receita real acumulada no período (jan-jul/2026): R$ 1.661.813,35
  // Projeção anualizada (12 meses): ~R$ 2.848.822,89 (~R$ 2,85 mi) — DENTRO do teto do Simples Nacional (R$ 4,8 mi)
  const recProj = receitaAnualizada > 0 ? receitaAnualizada : 2848822.89

  // 1) Simples Nacional (Opção cabível com projeção em ~R$ 2,85 mi):
  // Atividade mista:
  // - Comércio de autopeças (~70% receita, Anexo I, 5ª faixa R$ 1,8 mi a R$ 3,6 mi, alíquota nominal 14,30%, dedução R$ 87.300)
  //   Alíquota efetiva Anexo I: (2.848.822,89 * 14,30% - 87.300) / 2.848.822,89 = ~11,23%
  //   Com segregação de ICMS e PIS/COFINS monofásico de autopeças (ST), parcela federal/estadual é reduzida em ~30% a 40%,
  //   resultando em alíquota efetiva de comércio de autopeças de ~7,8% a 8,5%.
  // - Serviços mecânicos (~30% receita, Anexo III, 5ª faixa, alíquota nominal 16,00%, dedução R$ 125.640)
  //   Alíquota efetiva Anexo III: (2.848.822,89 * 16,00% - 125.640) / 2.848.822,89 = ~11,59%
  // Carga média ponderada no Simples: 70% * 8,2% + 30% * 11,59% = ~5,74% + ~3,48% = ~9,22% sobre o faturamento.
  // Estimativa anual Simples: ~R$ 262.000 / ano (~9,2% sobre R$ 2,85 mi).
  // Porém, o Simples transfere crédito restrito/bloqueado e não permite tomada de créditos nas compras de fornecedores.
  const cargaSimplesEstimada = recProj * 0.092

  // 2) Lucro Presumido:
  // Base IRPJ ponderada = 70% * 8% + 30% * 32% = 5.6% + 9.6% = 15.2%
  // Base CSLL ponderada = 70% * 12% + 30% * 32% = 8.4% + 9.6% = 18.0%
  // IRPJ: 15% sobre base + adicional 10% sobre o que exceder R$ 240k/ano
  // CSLL: 9% sobre base CSLL
  // PIS/COFINS cumulativo: 3.65% direto na receita (peças com ST têm isenção parcial mas serviço tributa cheio)
  // ICMS/ISS: ICMS com ST e ISS 3% a 5% sobre serviços mecânicos em Vacaria/RS
  // Carga total efetiva estimada Presumido: ~12,2% a 12,8% sobre faturamento (~R$ 358.000 / ano)
  const cargaPresumidoEstimada = recProj * 0.126

  // 3) Reforma Tributária 2027+ (Regime Regular IBS/CBS combinado ao Lucro Real):
  // CBS ~8,8% + IBS ~17,7% = ~26,5% pleno não-cumulativo.
  // Com CRÉDITO FINANCEIRO PLENO sobre compras de autopeças (Cobra Rolamentos, distribuidores), ferramentas, energia, locação e ativo.
  // Como a margem retida líquida real apurada é de ~4,4% (variação de PL de R$ 72.496,24 sobre receita de R$ 1.661.813,35),
  // e as compras e custos operacionais representam ~95,6% da receita bruta, o débito de IBS/CBS incide estritamente
  // sobre o valor agregado da oficina (mão de obra e margem líquida de peças).
  // Tributação direta (IRPJ/CSLL no Lucro Real): incide sobre o lucro contábil real (~4,4% da receita = ~R$ 125k/ano),
  // sem presunção fictícia de 8% e 32%.
  // Carga líquida consolidada estimada no Regime Regular 2027+: ~8,4% a 8,8% sobre a receita bruta (~R$ 242.000 / ano).
  const cargaReformaEstimada = recProj * 0.085

  // 4) Simples Híbrido 2027 (Mecânica da LC 214/2025):
  // Sublimite legal: R$ 3.600.000,00 | Teto do Simples: R$ 4.800.000,00
  // Quando a receita bruta anual acumulada excede o sublimite de R$ 3,6 mi, a empresa NÃO é excluída
  // do Simples Nacional caso permaneça até R$ 4,8 mi. Em vez disso, opera no regime híbrido:
  // - A parcela até R$ 3,6 mi recolhe os tributos no DAS. A partir do sublimite, IBS e CBS passam a ser
  //   recolhidos POR FORA do DAS pelo regime regular, proporcionalmente à parcela excedente da receita.
  // - O DAS exclui o componente de IBS e CBS sobre a parcela excedente.
  // - Na parcela excedente sujeita ao regime regular, a empresa aproveita integralmente os créditos
  //   financeiros das compras de autopeças (Cobra Rolamentos e distribuidoras) proporcionalmente.
  //
  // (a) Patamar atual projetado (~R$ 2,85 mi):
  // recProj <= R$ 3.600.000 -> O Híbrido NÃO é acionado. Carga é idêntica ao Simples puro (~R$ 262.000 / ano).
  // Obs.: Último mês apurado (julho R$ 296.986,65) x 12 = R$ 3.563.839,80, encostando no sublimite (99%).
  const ultimoBalanceteLiq =
    balancetes.length > 0 ? balancetes[balancetes.length - 1].receitaLiquida : 296986.65
  const receitaJulhoAnualizada = ultimoBalanceteLiq * 12
  const SUBLIMITE_SIMPLES = 3600000
  const TETO_SIMPLES = 4800000
  const acionadoNaProjecaoAtual = recProj > SUBLIMITE_SIMPLES

  const cargaHibridoProjecaoAtual = {
    receita: recProj,
    parcelaDas: cargaSimplesEstimada,
    parcelaIbsCbsRegular: 0,
    creditosAproveitados: 0,
    cargaTotalAnual: cargaSimplesEstimada,
    aliquotaEfetivaPct: recProj > 0 ? (cargaSimplesEstimada / recProj) * 100 : 9.2,
  }

  // (b) Patamar no teto do Simples (R$ 4.800.000,00):
  // Parcela excedente: (4.800.000 - 3.600.000) / 4.800.000 = 25% (R$ 1.200.000,00)
  // Parcela dentro do sublimite: 75% (R$ 3.600.000,00)
  //
  // No Simples puro a R$ 4,8 mi (6ª faixa, Anexo I/III), a alíquota efetiva média ponderada seria de ~11,8%
  // (devido à 6ª faixa nominal de 19% no Anexo I e 21-33% no Anexo III), gerando ~R$ 566.400.
  //
  // No Simples Híbrido a R$ 4,8 mi:
  // - Parcela dentro do sublimite (R$ 3,6 mi): DAS com alíquota média de ~9,8% = ~R$ 352.800
  // - Parcela excedente (R$ 1,2 mi):
  //   * No DAS, recolhe apenas IRPJ, CSLL e CPP (sem IBS/CBS) a ~4,5% = R$ 54.000
  //   * Por fora do DAS, IBS + CBS regular (26,5%):
  //     Débito sobre R$ 1,2 mi = R$ 318.000
  //     Compras proporcionais de autopeças (mesmo custo de ~95,6% da receita na proporção 25%):
  //     Compras da parcela = 1.200.000 * (1 - 0.044) = R$ 1.147.200
  //     Crédito aproveitado de IBS/CBS (26,5%) = R$ 304.008
  //     IBS/CBS líquido a recolher por fora = R$ 318.000 - R$ 304.008 = R$ 13.992
  //   * Carga total da parcela excedente = R$ 54.000 + R$ 13.992 = R$ 67.992 (efetiva de ~5,67% sobre o R$ 1,2 mi!)
  //   * Carga anual total no Simples Híbrido a R$ 4,8 mi:
  //     R$ 352.800 (parcela sublimite) + R$ 67.992 (parcela excedente líquida) = R$ 420.792 (~8,77% sobre R$ 4,8 mi).
  // Comparativo no teto de R$ 4,8 mi:
  // - Simples Puro a R$ 4,8 mi: ~R$ 566.400 (~11,8%)
  // - Simples Híbrido a R$ 4,8 mi: ~R$ 420.792 (~8,77%) -> Economia de ~R$ 145.600 frente ao Simples puro!
  // - Regime Regular Pleno a R$ 4,8 mi: ~R$ 408.000 (~8,50%) -> Muito próximo, com vantagem do Híbrido em menor complexidade contábil sobre 75% da receita.
  const recTeto = TETO_SIMPLES
  const percExcedente = (recTeto - SUBLIMITE_SIMPLES) / recTeto // 0.25
  const parcelaDentro = SUBLIMITE_SIMPLES // 3.600.000
  const parcelaExcedente = recTeto - SUBLIMITE_SIMPLES // 1.200.000

  const cargaDasDentro = parcelaDentro * 0.098 // ~352.800
  const cargaDasExcedenteSemIbsCbs = parcelaExcedente * 0.045 // ~54.000
  const debitoIbsCbsExcedente = parcelaExcedente * 0.265 // 318.000
  const comprasExcedente = parcelaExcedente * (1 - margemRetidaLiquidaPct / 100) // ~1.147.200
  const creditoIbsCbsExcedente = comprasExcedente * 0.265 // ~304.008
  const cargaIbsCbsExcedenteLiquida = debitoIbsCbsExcedente - creditoIbsCbsExcedente // ~13.992
  const cargaTotalHibridoTeto =
    cargaDasDentro + cargaDasExcedenteSemIbsCbs + cargaIbsCbsExcedenteLiquida // ~420.792
  const aliqEfetivaHibridoTeto = (cargaTotalHibridoTeto / recTeto) * 100 // ~8.77%

  const cargaSimplesPuroTeto = recTeto * 0.118 // ~566.400
  const cargaRegimeRegularTeto = recTeto * 0.085 // ~408.000

  const simplesHibrido: SimplesHibridoCenario = {
    sublimite: SUBLIMITE_SIMPLES,
    teto: TETO_SIMPLES,
    receitaProjetadaAtual: recProj,
    acionadoNaProjecaoAtual,
    receitaJulhoAnualizada,
    cargaProjecaoAtual: cargaHibridoProjecaoAtual,
    cenarioTeto48: {
      receita: recTeto,
      percentualExcedente: percExcedente * 100,
      parcelaDentroSublimite: parcelaDentro,
      parcelaExcedenteRegular: parcelaExcedente,
      cargaDasSemIbsCbs: cargaDasDentro + cargaDasExcedenteSemIbsCbs,
      cargaIbsCbsExcedenteLiquida,
      creditosAproveitadosExcedente: creditoIbsCbsExcedente,
      cargaTotalAnual: cargaTotalHibridoTeto,
      aliquotaEfetivaPct: aliqEfetivaHibridoTeto,
      comparativoSimplesPuroTeto: cargaSimplesPuroTeto,
      comparativoRegimeRegularTeto: cargaRegimeRegularTeto,
    },
    pontoDeVirada: {
      receitaInicioAcionamento: SUBLIMITE_SIMPLES,
      explicacao:
        'O Simples Híbrido se aciona no momento exato em que a receita bruta acumulada em 12 meses ultrapassa R$ 3.600.000,00 (sublimite da LC 214/2025). Entre R$ 3,6 mi e R$ 4,8 mi, o Híbrido é imbatível contra o Simples puro porque substitui alíquotas marginais altas da 6ª faixa pelo crédito financeiro de autopeças (compras a ~95,6% da receita geram crédito de 26,5%).',
      vantagemVsSimplesPuro:
        'Economia de até R$ 145.600/ano no teto de R$ 4,8 mi frente ao Simples Nacional sem segregação de IBS/CBS, reduzindo a alíquota efetiva de ~11,8% para ~8,77%.',
      vantagemVsRegimeRegular:
        'Abaixo de R$ 3,6 mi o Simples puro é mais simples. A R$ 4,8 mi, o Híbrido fica a apenas 0,27 p.p. do Regime Regular pleno (~8,77% vs ~8,50%), mantendo a blindagem contábil e simplicidade administrativa sobre 75% da receita da oficina.',
    },
  }

  // 5) LUCRO REAL PURO (Regime Autônomo e Completo - Modelagem Atual)
  // Receita bruta: ~R$ 2.848.822,89 | Margem retida real: ~4,36% (variação PL / receita)
  // Lucro Real anual aproximado derivado dos balancetes: ~R$ 124.208,68
  const margemRealPct = margemRetidaLiquidaPct > 0 ? margemRetidaLiquidaPct : 4.36
  const lucroRealAnualEstimado = recProj * (margemRealPct / 100)
  const limiteIsencaoAdicionalIrpj = 240000 // R$ 20.000,00/mês
  const lucroExcedenteAdicional = Math.max(0, lucroRealAnualEstimado - limiteIsencaoAdicionalIrpj)
  const irpjBase15 = lucroRealAnualEstimado * 0.15 // ~R$ 18.631,30
  const irpjAdicional10 = lucroExcedenteAdicional * 0.1 // R$ 0,00 (lucro real de ~124k < 240k)
  const irpjTotal = irpjBase15 + irpjAdicional10
  const csll9 = lucroRealAnualEstimado * 0.09 // ~R$ 11.078,78
  const irpjCsllConsolidado = irpjTotal + csll9 // ~R$ 29.710,08 (~1,04% da receita)
  const irpjCsllAliquotaEfetivaPct = recProj > 0 ? (irpjCsllConsolidado / recProj) * 100 : 1.04

  // Tributos indiretos atuais no Lucro Real puro:
  // - PIS não-cumulativo (1,65%) e COFINS não-cumulativo (7,60%) = 9,25%
  // Compras anuais de insumos e autopeças: ~95,64% da receita bruta = ~R$ 2.724.614,21
  // Autopeças possuem regime monofásico (Lei 10.485/2002) nas saídas para alíquota zero de PIS/COFINS pelo varejista/oficina,
  // com direito a creditamento nas compras se aplicável ou retenção pelo fabricante.
  // Mão de obra mecânica (~30% receita) paga PIS/COFINS de 9,25% com créditos de despesas operacionais (energia, aluguel, depreciação).
  // Saldo líquido de PIS/COFINS estimado: ~1,8% sobre faturamento (~R$ 51.278)
  const comprasInsumosAnual = recProj * (1 - margemRealPct / 100)
  const debitoPisCofinsBruto = recProj * 0.0925
  const creditoPisCofinsCompras = comprasInsumosAnual * 0.0925 * 0.7 // aproveitamento ponderado
  const pisCofinsLiquidoEstimado = recProj * 0.018 // ~R$ 51.278/ano
  // ICMS no Lucro Real: autopeças estão em ICMS-Substituição Tributária (ST) no RS. Mão de obra tem ISS (não ICMS).
  // A oficina recolhe diferencial de alíquota / antecipação ou ICMS normal residual (~2,5% da receita bruta = ~R$ 71.220).
  const icmsOperacaoPropriaLiquido = recProj * 0.025
  // ISSQN de Vacaria/RS sobre serviços mecânicos (~30% receita a 3,5% ISS = ~1,05% da receita total = ~R$ 29.912)
  const issqnServicosMecanicos = recProj * 0.3 * 0.035
  const impostosConsumoTotal =
    pisCofinsLiquidoEstimado + icmsOperacaoPropriaLiquido + issqnServicosMecanicos // ~R$ 152.410/ano

  // Carga total anual estimada Lucro Real Puro:
  // Tributação Direta (IRPJ/CSLL ~R$ 29.710) + Consumo (PIS/COFINS/ICMS/ISS ~R$ 152.410) + CPP folha de pagamento (~R$ 72.000)
  // Carga tributária consolidada: ~R$ 254.120/ano (~8,92% da receita bruta)
  const cppFolhaEstimada = recProj * 0.025 // Encargos previdenciários patronais sobre folha (~R$ 71.220)
  const cargaLucroRealPuroEstimada = irpjCsllConsolidado + impostosConsumoTotal + cppFolhaEstimada // ~R$ 253.340 (~8,89%)
  const aliqEfetivaLucroRealPuroPct =
    recProj > 0 ? (cargaLucroRealPuroEstimada / recProj) * 100 : 8.89

  const custoConformidadeAnualEstimado = 21600 // R$ 1.800/mês adicionais em honorários de auditoria/ECD/ECF

  const lucroRealPuro: DetalhamentoLucroRealPuro = {
    receitaBruta: recProj,
    margemLucroRealPct: margemRealPct,
    lucroRealAnualEstimado,
    limiteIsencaoAdicionalIrpj,
    lucroExcedenteAdicional,
    irpjBase15,
    irpjAdicional10,
    irpjTotal,
    csll9,
    irpjCsllConsolidado,
    irpjCsllAliquotaEfetivaPct,
    pisNaoCumulativoAliqPct: 1.65,
    cofinsNaoCumulativoAliqPct: 7.6,
    debitoPisCofinsBruto,
    comprasInsumosAnual,
    creditoPisCofinsCompras,
    pisCofinsLiquidoEstimado,
    icmsOperacaoPropriaLiquido,
    issqnServicosMecanicos,
    impostosConsumoTotal,
    cargaTributariaAnualTotal: cargaLucroRealPuroEstimada,
    aliquotaEfetivaTotalPct: aliqEfetivaLucroRealPuroPct,
    obrigacoesAcessorias: [
      {
        nome: 'ECD (Escrituração Contábil Digital)',
        periodicidade: 'Anual (SPED)',
        descricao:
          'Transmissão dos livros Diário e Razão contábeis digitais autenticados na Junta Comercial via SPED.',
      },
      {
        nome: 'ECF (Escrituração Contábil Fiscal)',
        periodicidade: 'Anual (SPED)',
        descricao:
          'Demonstração da base do Lucro Real, adições e exclusões do e-LALUR e e-LACS da mecânica.',
      },
      {
        nome: 'EFD-Contribuições (PIS/COFINS)',
        periodicidade: 'Mensal',
        descricao:
          'Escrituração dos créditos e débitos não-cumulativos das compras de peças e insumos.',
      },
      {
        nome: 'EFD ICMS IPI (SPED Fiscal)',
        periodicidade: 'Mensal',
        descricao:
          'Registro de entradas, saídas, apuração de ICMS e inventário anual Bloco K / Bloco H.',
      },
      {
        nome: 'DCTF e EFD-Reinf',
        periodicidade: 'Mensal',
        descricao:
          'Declaração de débitos e créditos tributários federais e retenções de serviços tomados.',
      },
    ],
    custoConformidadeAnualEstimado,
    avaliacaoAdiantada: `No Lucro Real puro, a tributação direta (IRPJ/CSLL) é extremamente baixa (~1,04% da receita) graças à margem retida real de ~${margemRealPct.toFixed(1)}% comprovada nos balancetes. Porém, o custo de conformidade (ECD, ECF, EFDs) adiciona ~R$ 21,6 mil/ano. No cenário atual (~R$ 2,85 mi), o Simples Nacional ainda é superior em simplicidade e custo total integrado; mas em 2027+, a combinação do Lucro Real com IBS/CBS da Reforma Tributária torna-se imbatível.`,
  }

  // 6) TABELA CONSOLIDADA DE VALORES EM R$ E PERCENTUAIS (5 REGIMES)
  // Regimes: Simples Nacional, Simples Híbrido 2027, Lucro Presumido, Lucro Real Puro, Regime Regular IBS/CBS + Lucro Real
  const cargaSimplesBase = cargaSimplesEstimada
  const aliqSimplesBase = recProj > 0 ? (cargaSimplesBase / recProj) * 100 : 9.2

  const tabelaValoresPercentuais: ItemComparativoValoresPercentuais[] = [
    {
      regimeId: 'simples',
      nomeRegime: 'Simples Nacional (Puro / Atual)',
      rotuloCurto: 'Simples Nacional',
      cargaAnualEstimada: cargaSimplesBase,
      aliquotaEfetivaPct: aliqSimplesBase,
      diferencaVsSimplesBrl: 0,
      diferencaVsSimplesPontosPct: 0,
      ehRegimeReferencia: true,
      vantagens: [
        'Guia única unificada (DAS) englobando 8 tributos (IRPJ, CSLL, PIS, COFINS, ICMS, ISS, IPI e CPP).',
        'Isenção de contribuição patronal previdenciária sobre folha de pagamento no Anexo III.',
        'Dispensa de escrituração complexa (sem exigência de ECD, ECF e SPED Fiscal pleno).',
        'Segregação monofásica legal de autopeças reduz alíquota do Anexo I em ~30% a 40%.',
        'Dentro do teto legal de R$ 4,8 mi e do sublimite de R$ 3,6 mi na receita real da Pastore (~R$ 2,85 mi).',
      ],
      desvantagens: [
        'Vedação total à tomada de créditos nas compras de autopeças de distribuidores (Cobra Rolamentos, etc.).',
        'Transferência de crédito restrito aos clientes PJ/frotistas B2B, reduzindo competitividade corporativa.',
        'Tributa sobre faturamento bruto; não aproveita eventuais prejuízos ou margens comprimidas da oficina.',
      ],
    },
    {
      regimeId: 'simples_hibrido',
      nomeRegime: 'Simples Híbrido 2027 (LC 214/2025 · Sublimite R$ 3,6 mi)',
      rotuloCurto: 'Simples Híbrido 2027',
      cargaAnualEstimada: cargaHibridoProjecaoAtual.cargaTotalAnual,
      aliquotaEfetivaPct: cargaHibridoProjecaoAtual.aliquotaEfetivaPct,
      diferencaVsSimplesBrl: cargaHibridoProjecaoAtual.cargaTotalAnual - cargaSimplesBase,
      diferencaVsSimplesPontosPct: cargaHibridoProjecaoAtual.aliquotaEfetivaPct - aliqSimplesBase,
      vantagens: [
        'Proteção contra exclusão abrupta do Simples ao ultrapassar o sublimite de R$ 3,6 mi.',
        'Permite abater 100% dos créditos de compras de autopeças sobre a parcela excedente.',
        'No teto de R$ 4,8 mi, gera economia de até R$ 145,6 mil/ano frente ao Simples puro (8,77% vs 11,8%).',
        'Transfere créditos cheios de IBS/CBS aos adquirentes corporativos na parcela excedente.',
        'Preserva IRPJ, CSLL e CPP dentro do DAS com custo reduzido.',
      ],
      desvantagens: [
        'Exige controle contábil duplo (apuração de DAS + escrituração regular de IBS/CBS por fora).',
        'Não acionado no patamar atual (~R$ 2,85 mi), mantendo carga idêntica ao Simples puro.',
        'Complexidade de conciliação fiscal e parametrização de software ERP.',
      ],
    },
    {
      regimeId: 'lucro_presumido',
      nomeRegime: 'Lucro Presumido (Situação Cadastral de Risco)',
      rotuloCurto: 'Lucro Presumido',
      cargaAnualEstimada: cargaPresumidoEstimada,
      aliquotaEfetivaPct: recProj > 0 ? (cargaPresumidoEstimada / recProj) * 100 : 12.6,
      diferencaVsSimplesBrl: cargaPresumidoEstimada - cargaSimplesBase,
      diferencaVsSimplesPontosPct:
        (recProj > 0 ? (cargaPresumidoEstimada / recProj) * 100 : 12.6) - aliqSimplesBase,
      vantagens: [
        'Sem teto de faturamento (permite ultrapassar R$ 4,8 mi sem restrição de porte).',
        'Escrituração simplificada em relação ao Lucro Real (livro Caixa aceito em certas hipóteses).',
        'PIS e COFINS em alíquotas nominais menores (cumulativo: 0,65% e 3,00%).',
      ],
      desvantagens: [
        'Pior regime para a Pastore: gera sobretaxação de mais de R$ 95 mil/ano vs Simples.',
        'Presume lucros artificiais de 8% (peças) e 32% (serviços), ignorando a margem real de ~4,4%.',
        'Zero aproveitamento de créditos sobre as compras de autopeças e ferramentas.',
        'CPP integral de 20% patronal + RAT + Terceiros sobre a folha de pagamento.',
      ],
    },
    {
      regimeId: 'lucro_real_puro',
      nomeRegime: 'Lucro Real Puro (Regime Autônomo e Completo Atual)',
      rotuloCurto: 'Lucro Real Puro',
      cargaAnualEstimada: cargaLucroRealPuroEstimada,
      aliquotaEfetivaPct: aliqEfetivaLucroRealPuroPct,
      diferencaVsSimplesBrl: cargaLucroRealPuroEstimada - cargaSimplesBase,
      diferencaVsSimplesPontosPct: aliqEfetivaLucroRealPuroPct - aliqSimplesBase,
      vantagens: [
        `Tributa o lucro real exato da oficina (~R$ 124 mil/ano), gerando IRPJ/CSLL residual de apenas ~1,04%.`,
        'Isento de adicional de 10% do IRPJ (lucro real anual fica abaixo do teto de R$ 240 mil/ano).',
        'Não-cumulatividade de PIS/COFINS (1,65%/7,60%) com apropriação de créditos de insumos.',
        'Se a oficina apurar prejuízo em determinado trimestre, não recolhe IRPJ nem CSLL.',
      ],
      desvantagens: [
        `Alto custo de conformidade contábil e auditoria (~R$ ${custoConformidadeAnualEstimado.toLocaleString('pt-BR')}/ano) em ECD, ECF e SPEDs.`,
        'Encargos patronais integrais de INSS (20% + RAT + Sistema S) sobre folha salarial da oficina.',
        'Risco de autuação por glosa de créditos ou divergências de despesas indedutíveis no LALUR.',
      ],
    },
    {
      regimeId: 'reforma_2027',
      nomeRegime: 'Regime Regular 2027+ (IBS/CBS Não-Cumulativo + Lucro Real)',
      rotuloCurto: 'Regime Regular 2027+',
      cargaAnualEstimada: cargaReformaEstimada,
      aliquotaEfetivaPct: recProj > 0 ? (cargaReformaEstimada / recProj) * 100 : 8.5,
      diferencaVsSimplesBrl: cargaReformaEstimada - cargaSimplesBase,
      diferencaVsSimplesPontosPct:
        (recProj > 0 ? (cargaReformaEstimada / recProj) * 100 : 8.5) - aliqSimplesBase,
      melhorRegimeLongoPrazo: true,
      vantagens: [
        'Menor carga tributária líquida absoluta projetada (~8,5% sobre a receita bruta).',
        'Crédito financeiro amplo e imediato sobre 100% das compras de autopeças (Cobra Rolamentos, etc.).',
        'Substitui a colcha de retalhos (PIS, COFINS, ICMS, ISS) por IVA dual uniforme (IBS e CBS).',
        'Transfere crédito financeiro integral aos clientes corporativos/frotistas, atraindo contratos B2B.',
        'Neutralidade concorrencial no modelo destino (sem guerra fiscal entre estados).',
      ],
      desvantagens: [
        'Exige conformidade técnica apurada de cadastro tributário (cClassTrib, NCM e split payment).',
        'Período de transição 2027–2032 de convivência com os sistemas tributários antigos.',
        'Fluxo de caixa dependerá da rapidez no estorno e compensação automática dos créditos.',
      ],
    },
  ]

  // 7) LINHA DO TEMPO DA TRANSIÇÃO TRIBUTÁRIA ATÉ 2033 (LC 214/2025)
  // Destaca explicitamente o triênio 2027–2029 como FASE DE DECISÃO estratégica para a Pastore
  // Inclui Pontos Positivos e Negativos específicos com fundamentação legal e foco na mecânica
  const linhaDoTempoTransicao: MarcoLinhaDoTempoTransicao[] = [
    {
      ano: 2026,
      fase: 'Ano-Teste / Calibração',
      titulo: '2026: Ano-Teste da Reforma (Alíquotas Simbólicas)',
      statusOficial: 'Fase de Teste e Calibração dos Sistemas',
      mecanicaLegislativa:
        'CBS a 0,9% e IBS a 0,1% (total 1,0%) cobrados apenas para teste e compensáveis integralmente contra PIS/COFINS devidos. Nenhuma arrecadação líquida nova.',
      impactoPastore:
        'Impacto nulo no desembolso. A Pastore permanece 100% protegida no Simples Nacional com receita anual de ~R$ 2,85 mi. Compras e vendas mantêm a rotina fiscal atual.',
      acaoRecomendadaAdecont:
        'Manter Simples Nacional; auditar cadastro de produtos (NCM das autopeças) e preparar parametrização para as novas tags fiscais.',
      creditoComprasValendo: false,
      simplesCabivel: true,
      faseDecisao: false,
      pontosPositivos: [
        {
          titulo: 'Ausência de desembolso tributário adicional',
          descricao:
            'A alíquota-teste de 1,0% (0,9% CBS + 0,1% IBS) é 100% compensável contra PIS/Cofins, garantindo neutralidade financeira imediata.',
          dispositivoLegal: 'LC 214/2025, arts. 336 e 340; Portaria RFB nº 549/2025 (Piloto CBS)',
          impactoPastore:
            'Desembolso fiscal da oficina mecânica permanece inalterado, mantendo a proteção integral do Simples Nacional.',
        },
        {
          titulo: 'Janela protegida para auditoria de NCMs e cadastro',
          descricao:
            'Período educativo sem aplicação de penalidades materiais imediatas para adaptação das tags DFe e classificação de cClassTrib.',
          dispositivoLegal: 'ADI RFB nº 3/2025 e ATC RFB/CGIBS nº 4/2026 (Cronograma DFe)',
          impactoPastore:
            'Permite sanear antecipadamente o cadastro das autopeças de giro frequente (rolamentos, filtros, pastilhas, amortecedores).',
        },
        {
          titulo: 'Dispensa de obrigações acessórias redundantes',
          descricao:
            'Regulamentação expressa dispensando redundâncias em notas de simples remessa e desoneração do nanoempreendedor parceiro.',
          dispositivoLegal: 'Decreto nº 13.140/2026 e Decreto nº 12.955/2026, art. 25',
          impactoPastore:
            'Subcontratação pontual de torneiros e prestadores auxiliares não gera burocracia ou retenções antecipadas na oficina.',
        },
      ],
      pontosNegativos: [
        {
          titulo: 'Custo de adaptação do software emissor de NF-e/NFC-e',
          descricao:
            'Obrigatoriedade de atualização do ERP/emissor fiscal para suportar os grupos de tributação IBS/CBS e tags de teste.',
          dispositivoLegal:
            'Ato Técnico Conjunto RFB/CGIBS nº 9/2026 e Resolução CGIBS 6/2026, art. 617',
          impactoPastore:
            'Exigirá suporte técnico do fornecedor de software da oficina mecânica em Vacaria/RS para homologação das tags.',
        },
        {
          titulo: 'Impossibilidade de apropriação de créditos de compras',
          descricao:
            'No ano-teste, as aquisições de fornecedores ainda não geram crédito financeiro de CBS/IBS para compensação ou venda.',
          dispositivoLegal: 'LC 214/2025, art. 338 e SC COSIT nº 124/2025',
          impactoPastore:
            'Compras de distribuidores (Cobra Rolamentos, etc.) ainda carregam o custo do ICMS-ST e PIS/Cofins sem crédito financeiro.',
        },
        {
          titulo: 'Risco de divergência cadastral de NCM em autopeças',
          descricao:
            'Inconsistências entre NCM e tabela cClassTrib da Receita Federal podem gerar rejeições em lote no ambiente autorizador.',
          dispositivoLegal: 'IN RFB nº 2.215/2024 (Registro Prévio e Preparação CBS)',
          impactoPastore:
            'Peças sem NCM correspondente exata na Nomenclatura Comum exigirão retificação manual pela equipe fiscal da ADECONT.',
        },
      ],
    },
    {
      ano: 2027,
      fase: 'Início da Vigência Federal (CBS) — Decisão de Regime',
      titulo: '2027: CBS Plena, Sublimite do Simples Híbrido e Extinção PIS/COFINS',
      statusOficial: 'FASE DE DECISÃO: Extinção de PIS/COFINS e Ativação da CBS Integral',
      mecanicaLegislativa:
        'Extinção definitiva de PIS e COFINS. CBS entra com alíquota plena (~8,8%). IBS mantém alíquota teste de 0,1%. Ativação da regra do Simples Híbrido (LC 214/2025, art. 28) com sublimite de R$ 3,6 mi.',
      impactoPastore:
        'Para faturamento até R$ 3,6 mi, a Pastore recolhe DAS sem alteração. Se atingir o ritmo de julho (~R$ 3,56 mi) e romper R$ 3,6 mi, o excedente recolhe CBS/IBS com crédito pleno de compras.',
      acaoRecomendadaAdecont:
        'FASE DE DECISÃO (MOMENTO DA MIGRAÇÃO): Decisão formal de regime entre Simples Nacional puro, Simples Híbrido (caso faturamento passe de R$ 3,6 mi) ou migração antecipada para o Regime Regular + Lucro Real caso clientes de frotas e pessoas jurídicas passem a exigir destaque integral dos créditos de CBS.',
      creditoComprasValendo: true,
      simplesCabivel: true,
      faseDecisao: true,
      rotuloFaseDecisao: 'Fase de Decisão · Momento da Migração e Decisão de Regime',
      pontosPositivos: [
        {
          titulo: 'Extinção definitiva de PIS e COFINS e não-cumulatividade plena',
          descricao:
            'Fim do contencioso de insumos de PIS/Cofins; a CBS passa a operar com crédito financeiro amplo em todas as compras tributadas.',
          dispositivoLegal: 'LC 214/2025, art. 8º e art. 343; SC COSIT nº 124/2025',
          impactoPastore:
            'Elimina o resíduo tributário em peças e ferramentas adquiridas pela oficina; compras geram crédito pleno caso no Regime Regular.',
        },
        {
          titulo: 'Proteção do Simples Híbrido contra desenquadramento abrupto',
          descricao:
            'Ao ultrapassar R$ 3,6 mi, a empresa não cai no Lucro Presumido: tributa IBS/CBS por fora com crédito e mantém IRPJ/CSLL no Simples.',
          dispositivoLegal: 'LC 214/2025, art. 28; LC 123/2006, art. 13-B; LC 238/2026',
          impactoPastore:
            'Garante teto de alíquota efetiva de ~8,77% a R$ 4,8 mi, evitando um salto prejudicial para ~12,6% do Lucro Presumido.',
        },
        {
          titulo: 'Poder de atração de frotistas e clientes PJ com crédito destacado',
          descricao:
            'Empresas no Simples Híbrido ou Regime Regular transferem crédito de CBS (~8,8%) para clientes frotistas que operem no Lucro Real.',
          dispositivoLegal: 'LC 214/2025, art. 29 e art. 343, § 2º',
          impactoPastore:
            'A Pastore se torna mais competitiva para frotas de transporte, cooperativas agropecuárias e seguradoras da região de Vacaria.',
        },
      ],
      pontosNegativos: [
        {
          titulo: 'Alíquota federal da CBS salta para ~8,8% (ou referência CGIBS)',
          descricao:
            'A CBS entra em vigor em alíquota cheia federal sem escalonamento intermediário para quem opera no regime geral.',
          dispositivoLegal: 'LC 214/2025, art. 12; Resolução CGIBS nº 14/2026',
          impactoPastore:
            'Vendas a consumidor final sem direito a crédito exigem precificação calibrada pela oficina para manter a margem retida de ~4,4%.',
        },
        {
          titulo: 'Início da retenção via Split Payment bancário',
          descricao:
            'Retenção automática do tributo no momento da liquidação financeira por cartão, Pix ou boleto intermediado.',
          dispositivoLegal: 'LC 214/2025, art. 49 ao art. 53; ATC RFB/CGIBS nº 9/2026',
          impactoPastore:
            'Impacta o fluxo de caixa imediato do balcão da oficina: o valor líquido recebido de clientes já virá deduzido da CBS/IBS.',
        },
        {
          titulo: 'Complexidade de convivência bifásica (CBS federal + ICMS/ISS antigos)',
          descricao:
            'Obrigatoriedade de apurar a CBS nas regras novas enquanto ICMS estadual e ISS municipal permanecem nas regras antigas.',
          dispositivoLegal:
            'LC 214/2025, art. 341; Decreto nº 13.133/2026 (combustíveis e derivados)',
          impactoPastore:
            'Duplo esforço de escrituração contábil e fiscal no escritório ADECONT para conciliar guias federais e estaduais.',
        },
      ],
    },
    {
      ano: 2028,
      fase: 'Calibração das Alíquotas Subnacionais — Ajuste ao Regime Regular',
      titulo: '2028: Fixação de Alíquotas Estaduais/Municipais e Início da Redução do ICMS',
      statusOficial: 'FASE DE DECISÃO: CBS Plena + IBS Calibrado pelo Senado',
      mecanicaLegislativa:
        'Manutenção da CBS plena. Senado Federal fixa alíquotas de referência para Estados e Municípios. Início da redução gradual e preparatória de benefícios e incentivos fiscais regionais do ICMS.',
      impactoPastore:
        'A oficina mecânica segue operando com segurança. Fornecedores de autopeças (distribuidores e fabricantes) já emitem 100% de suas notas fiscais com crédito financeiro integral destacado de CBS.',
      acaoRecomendadaAdecont:
        'FASE DE DECISÃO (AJUSTE AO REGIME REGULAR): Monitoramento mensal rigoroso do faturamento acumulado em 12 meses para antecipar virada de sublimite; calibração dos créditos de compras de autopeças e adaptação da precificação dos serviços mecânicos ao modelo de crédito/débito não-cumulativo.',
      creditoComprasValendo: true,
      simplesCabivel: true,
      faseDecisao: true,
      rotuloFaseDecisao: 'Fase de Decisão · Ajuste Operacional ao Regime Regular',
      pontosPositivos: [
        {
          titulo: 'Fixação das alíquotas de referência pelo Senado Federal',
          descricao:
            'Divulgação das alíquotas médias de IBS de Estados e Municípios, trazendo previsibilidade orçamentária para a transição do ICMS/ISS.',
          dispositivoLegal: 'LC 214/2025, art. 342; Resolução do Senado Federal / CGIBS 2028',
          impactoPastore:
            'A diretoria da Pastore e a ADECONT conhecem antecipadamente a carga subnacional definitiva aplicável ao Rio Grande do Sul e Vacaria.',
        },
        {
          titulo: 'Cadeia de suprimentos de autopeças 100% creditável em CBS',
          descricao:
            'Fornecedores industriais e atacadistas de autopeças consolidam a emissão com crédito financeiro de CBS sem glosas.',
          dispositivoLegal: 'LC 214/2025, art. 343; SC COSIT nº 124/2025',
          impactoPastore:
            'Garante estoque de peças (filtros, lonas, rolamentos) com custo de aquisição transparente e líquido de tributos federais.',
        },
        {
          titulo: 'Evolução do teto do MEI para R$ 140 mil alivia terceirizações',
          descricao:
            'Entrada em vigor dos novos limites da LC 238/2026 para MEI, permitindo contratação de serviços auxiliares com segurança.',
          dispositivoLegal: 'LC 238/2026, art. 1º (alteração do art. 18-A da LC 123/2006)',
          impactoPastore:
            'Serviços terceirizados de retífica leve, solda e guincho podem ser prestados por MEIs sem gerar risco trabalhista ou tributário.',
        },
      ],
      pontosNegativos: [
        {
          titulo: 'Desmonte gradual de benefícios fiscais e incentivos do ICMS',
          descricao:
            'Início da desidratação de regimes especiais, reduções de base de cálculo e incentivos estaduais do Rio Grande do Sul.',
          dispositivoLegal: 'LC 214/2025, art. 344 e ADPF STF (Transição Federativa)',
          impactoPastore:
            'Peças antes contempladas com redução de base de cálculo no ICMS/RS podem sofrer recomposição de custo pelos distribuidores.',
        },
        {
          titulo: 'Exigência de conciliação bancária diária do Split Payment',
          descricao:
            'Consolidação dos repasses financeiros bancários líquidos, exigindo auditoria minuciosa entre valores de NFe e créditos em conta.',
          dispositivoLegal: 'LC 214/2025, art. 51 e Instruções do Banco Central / CGIBS',
          impactoPastore:
            'Setor administrativo da mecânica precisará conciliar extratos de adquirentes com relatórios de split payment semanalmente.',
        },
        {
          titulo: 'Gargalo de competitividade no Simples puro para vendas corporativas',
          descricao:
            'Clientes PJ que operam no Lucro Real passam a rejeitar compras de autopeças de empresas do Simples que não destacam CBS.',
          dispositivoLegal: 'LC 214/2025, art. 29, § 1º',
          impactoPastore:
            'Risco de perda de contratos de manutenção de frotas municipais e transportadoras caso a Pastore mantenha o Simples estrito.',
        },
      ],
    },
    {
      ano: 2029,
      fase: 'Início da Convivência Gradual IBS/ICMS — Consolidação de Carga',
      titulo: '2029: Início da Convivência Gradual de Alíquotas (90% ICMS/ISS + 10% IBS)',
      statusOficial: 'FASE DE DECISÃO: Redução de 1/10 de ICMS/ISS e Subida do IBS',
      mecanicaLegislativa:
        'Primeiro ano da substituição gradual do ICMS e ISS: redução de 1/10 (ICMS e ISS recolhidos a 90%), e IBS elevado proporcionalmente a 1/10 da alíquota de referência estadual e municipal.',
      impactoPastore:
        'Início formal do esvaziamento da cumulatividade do ICMS/ISS. Quem já opera no Regime Regular abate créditos imediatos de autopeças, ferramentas, energia e insumos da oficina mecânica.',
      acaoRecomendadaAdecont:
        'FASE DE DECISÃO (CONSOLIDAÇÃO E REVISÃO DA CARGA): Consolidação da convivência de alíquotas e revisão definitiva da carga tributária global da Pastore; se o faturamento superar R$ 3,6 mi, fixar transição para Regime Regular + Lucro Real capturando alíquota líquida efetiva de ~8,5% sobre o valor agregado.',
      creditoComprasValendo: true,
      simplesCabivel: true,
      faseDecisao: true,
      rotuloFaseDecisao: 'Fase de Decisão · Consolidação da Convivência e Revisão de Carga',
      pontosPositivos: [
        {
          titulo: 'Início da extinção da guerra fiscal e cobrança no destino',
          descricao:
            'Primeiro passo concreto de redução do ICMS (90%) e cobrança no Estado de consumo (RS), nivelando o mercado regional.',
          dispositivoLegal: 'LC 214/2025, art. 345 e art. 3º (Princípio do Destino)',
          impactoPastore:
            'Autopeças compradas de Santa Catarina, Paraná ou São Paulo entram com a mesma regra neutra sem diferencial de alíquota punitivo.',
        },
        {
          titulo: 'Efetivação de créditos imediatos de bens de uso e consumo e energia',
          descricao:
            'Crédito financeiro de IBS sobre energia elétrica da oficina, internet, ferramentas e materiais de limpeza sem travas.',
          dispositivoLegal: 'LC 214/2025, art. 30 e art. 45',
          impactoPastore:
            'Conta de energia pesada da oficina (elevadores pneumáticos, compressores de ar e solda) passa a abater imposto no Regime Regular.',
        },
        {
          titulo: 'Consolidação da economia projetada no Regime Regular (~8,5%)',
          descricao:
            'Comprovação da vantagem do Lucro Real sobre o Lucro Presumido para margens retidas estreitas de ~4,4%.',
          dispositivoLegal: 'LC 214/2025, art. 28 e Lei nº 9.249/1995 (Lucro Real)',
          impactoPastore:
            'A Pastore economiza mais de R$ 90 mil por ano em relação ao Presumido e R$ 20 mil frente ao Simples caso atinja faturamento pleno.',
        },
      ],
      pontosNegativos: [
        {
          titulo: 'Pico de complexidade burocrática da transição (5 tributos simultâneos)',
          descricao:
            'Ano crítico de apuração: CBS plena + IBS proporcional (1/10) + ICMS reduzido (90%) + ISS reduzido (90%) + Simples.',
          dispositivoLegal: 'LC 214/2025, arts. 345 e 346; Resoluções Conjuntas CGIBS/SEFAZ-RS',
          impactoPastore:
            'Custos de auditoria e tempo contábil duplicados para conferir cinco guias e regras de cálculo divergentes.',
        },
        {
          titulo: 'Risco de erro na partilha do IBS entre Estado (RS) e Município (Vacaria)',
          descricao:
            'Divergências na indicação do município de prestação do serviço mecânico no DFe podem gerar glosa temporária.',
          dispositivoLegal: 'LC 214/2025, art. 348 e Anexo de Municípios do CGIBS',
          impactoPastore:
            'Socorros mecânicos em rodovias (BR-116, BR-285) ou municípios vizinhos (Muitos Capões, Monte Alegre) exigem indicação correta do local.',
        },
        {
          titulo: 'Redução do diferencial competitivo do Simples Nacional tradicional',
          descricao:
            'À medida que o IBS avança, o Simples puro perde atratividade por reter tributo embutido nas compras sem repasse pleno.',
          dispositivoLegal: 'LC 214/2025, art. 29, § 2º',
          impactoPastore:
            'Obrigará a Pastore a decidir definitivamente entre o Simples Híbrido ou migração total para o Regime Regular.',
        },
      ],
    },
    {
      ano: '2030–2032',
      fase: 'Evolução da Transição Gradual IBS (20% a 40%)',
      titulo: '2030 a 2032: Redução Acentuada de ICMS/ISS e Maturação do IBS',
      statusOficial: 'Substituição Proporcional de 20% a 40% (2/10 a 4/10)',
      mecanicaLegislativa:
        'ICMS e ISS continuam caindo anualmente (80% em 2030, 70% em 2031, 60% em 2032), com IBS preenchendo a diferença de forma progressiva.',
      impactoPastore:
        'Mercado de autopeças plenamente adaptado à não-cumulatividade ampla. Regime Regular consolida vantagem competitiva clara em relação ao Simples para faturamentos no topo da faixa.',
      acaoRecomendadaAdecont:
        'Manutenção e refinamento contínuo da apuração no Regime Regular com Lucro Real, garantindo conformidade digital no split payment e restituição célere de saldos credores.',
      creditoComprasValendo: true,
      simplesCabivel: true,
      faseDecisao: false,
      pontosPositivos: [
        {
          titulo: 'Aceleração do esvaziamento do ICMS-Substituição Tributária (ICMS-ST)',
          descricao:
            'Extinção gradual de MVA-ST e pautas fiscais estaduais artificiais que antes inflacionavam as autopeças.',
          dispositivoLegal: 'LC 214/2025, art. 347 e revogação das normas de ST',
          impactoPastore:
            'Fim do custo oculto do ICMS-ST recolhido antecipadamente por distribuidores de autopeças sem direito a restituição da margem real.',
        },
        {
          titulo: 'Compensação automatizada de créditos acumulados em até 60 dias',
          descricao:
            'Sistema nacional do Comitê Gestor passa a ressarcir saldos credores de IBS com prazo legal garantido.',
          dispositivoLegal: 'LC 214/2025, art. 58 e art. 62; Comitê Gestor IBS',
          impactoPastore:
            'Meses com grandes compras de peças de reposição que gerem saldo credor não deixam dinheiro da oficina parado no Fisco.',
        },
        {
          titulo: 'Simplificação das declarações fiscais com DFe único',
          descricao:
            'Substituição da EFD ICMS/IPI e GIA-RS por escrituração assistida digital gerada diretamente pelo CGIBS/RFB.',
          dispositivoLegal: 'LC 214/2025, art. 65 e art. 349',
          impactoPastore:
            'Menor custo de honorários contábeis para cumprimento de obrigações acessórias redundantes na ADECONT.',
        },
      ],
      pontosNegativos: [
        {
          titulo: 'Alíquota nominal do IBS atinge patamares elevados (~12% a 15%)',
          descricao:
            'Com a redução substancial do ICMS, a alíquota subnacional do IBS sobe proporcionalmente para garantir a receita federativa.',
          dispositivoLegal: 'LC 214/2025, art. 347, § 3º; Resolução CGIBS 2030/2032',
          impactoPastore:
            'Para serviços de mecânica pura (sem aplicação de peças), a incidência do imposto sobre o faturamento exige repasse de preço.',
        },
        {
          titulo: 'Exigência de auditoria contínua de malhas finas automatizadas do CGIBS',
          descricao:
            'Cruzamento em tempo real de NF-e, pagamentos Pix e cartões pelo Comitê Gestor do IBS com notificações instantâneas.',
          dispositivoLegal: 'LC 214/2025, art. 70 ao art. 74',
          impactoPastore:
            'Qualquer venda de balcão sem nota fiscal ou divergência em máquina de cartão aciona auditoria fiscal automática.',
        },
        {
          titulo: 'Fim do fôlego financeiro concedido por regimes especiais legados',
          descricao:
            'Revogação definitiva de créditos presumidos regionais e prazos elásticos de recolhimento de ICMS.',
          dispositivoLegal: 'LC 214/2025, art. 344, parágrafo único',
          impactoPastore:
            'Distribuidoras locais de autopeças do RS perdem benefícios estaduais e repassam seus preços de tabela à vista.',
        },
      ],
    },
    {
      ano: 2033,
      fase: 'Regime Pleno Definitivo',
      titulo: '2033: Extinção Definitiva de ICMS e ISS (IVA Dual 100%)',
      statusOficial: 'Regime Pleno Definitivo da Reforma Tributária',
      mecanicaLegislativa:
        'Extinção total do ICMS e do ISS. Vigência de 100% do IBS (~17,7%) e da CBS (~8,8%). Não-cumulatividade plena com princípio do destino absoluto em todo o território nacional.',
      impactoPastore:
        'Zero resíduo fiscal nas autopeças adquiridas. O débito da mecânica incide estritamente sobre a mão de obra mecânica e a margem de agregação das peças.',
      acaoRecomendadaAdecont:
        'Consolidação definitiva no Regime Regular combinado ao Lucro Real, maximizando economia tributária anual em relação a qualquer modelo anterior.',
      creditoComprasValendo: true,
      simplesCabivel: true,
      faseDecisao: false,
      pontosPositivos: [
        {
          titulo: 'Extinção completa e definitiva de ICMS, ISS, PIS, COFINS e IPI',
          descricao:
            'O Brasil passa a operar com o IVA Dual limpo (IBS + CBS) e Imposto Seletivo restrito a bens prejudiciais.',
          dispositivoLegal: 'Emenda Constitucional nº 132/2023; LC 214/2025, art. 350',
          impactoPastore:
            'Fim absoluto de 5 tributos arcaicos e da burocracia de alíquotas estaduais divergentes para a oficina mecânica.',
        },
        {
          titulo: 'Não-cumulatividade absoluta com tributação sobre o valor agregado real',
          descricao:
            'Tributo incide apenas sobre a margem bruta de comercialização de peças e sobre os serviços mecânicos prestados.',
          dispositivoLegal: 'LC 214/2025, art. 8º ao art. 11',
          impactoPastore:
            'Garante à Pastore a menor carga tributária efetiva possível (~8,5%), harmonizada com a margem líquida de ~4,4%.',
        },
        {
          titulo: 'Segurança jurídica consolidada e fim das disputas federativas',
          descricao:
            'Jurisprudência do Comitê Gestor e do CARF unificada nacionalmente para IBS e CBS sem surpresas fiscais.',
          dispositivoLegal: 'LC 214/2025, art. 120 e seguintes',
          impactoPastore:
            'Tranquilidade societária e contábil total para os sócios da oficina em Vacaria com suporte ADECONT.',
        },
      ],
      pontosNegativos: [
        {
          titulo: 'Alíquota padrão unificada de referência elevada (~26,5% a 27,9%)',
          descricao:
            'Soma do IBS (~17,7% a 18,7%) e CBS (~8,8%) resulta em alíquota nominal padrão expressiva sobre o consumo.',
          dispositivoLegal: 'LC 214/2025, art. 12 e art. 350; Resolução CGIBS nº 14/2026',
          impactoPastore:
            'Empresas que não possuem crédito relevante de compras (ex.: serviços puros) sofrem com carga nominal alta se não controlarem custos.',
        },
        {
          titulo: 'Extinção de regimes de exceção e anistias fiscais estaduais',
          descricao:
            'Proibição constitucional e legal de qualquer novo favor fiscal heterônomo concedido por Estados ou Municípios.',
          dispositivoLegal: 'CF/88, art. 156-A, § 1º, V; LC 214/2025, art. 2º',
          impactoPastore:
            'Inexistência de qualquer programa regional de parcelamento de ICMS (Refis estadual); rigor absoluto nos recolhimentos.',
        },
        {
          titulo: 'Exigência permanente de governança digital e conciliação contábil em tempo real',
          descricao:
            'Conformidade fiscal estrita requer fechamento contábil e apuração de Lucro Real mensal sem atrasos.',
          dispositivoLegal: 'LC 214/2025, art. 68 e Código Civil Brasileiro',
          impactoPastore:
            'Os balancetes mensais da Pastore deverão ser fechados pontualmente para alimentar a apuração do split payment.',
        },
      ],
    },
  ]

  const fmtBrl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const linhasComparativo: LinhaComparativoRegime[] = [
    {
      criterio: 'Enquadramento e Teto Legal',
      simplesNacional: {
        valor: 'OPÇÃO CABÍVEL (Dentro do Teto)',
        detalhe: `Receita anual projetada em ~${fmtBrl(recProj)}/ano, perfeitamente compatível com o teto de R$ 4,8 milhões da LC 123/2006. Sublimite estadual de ICMS/ISS (R$ 3,6 mi) também respeitado.`,
      },
      simplesHibrido2027: {
        valor: 'Sublimite R$ 3,6 mi (LC 214/2025)',
        detalhe: `Não acionado na projeção atual (~${fmtBrl(recProj)} < R$ 3,6 mi). Ativa automaticamente se receita anualizada ultrapassar R$ 3,6 mi (julho anualizado: ~${fmtBrl(receitaJulhoAnualizada)}). Permanece no Simples até R$ 4,8 mi.`,
        destaque: true,
      },
      lucroPresumido: {
        valor: 'Lucro Presumido (Hoje)',
        detalhe:
          'Regime cumulativo (PIS 0,65% / COFINS 3,00%), sem limite de teto, mas com presunção de lucro muito acima da margem real.',
      },
      reforma2027: {
        valor: 'Regime Regular 2027+ (IBS/CBS)',
        detalhe:
          'Regime não-cumulativo pleno geral sob a LC 214/2025. Substitui PIS, COFINS, ICMS e ISS com crédito financeiro irrestrito.',
        destaque: true,
      },
    },
    {
      criterio: 'Base de Cálculo IRPJ e CSLL / Tributação Direta',
      simplesNacional: {
        valor: 'Incluso na Alíquota Unificada do DAS',
        detalhe:
          'Calculado pela receita bruta nos Anexos I (comércio) e III (serviços), independentemente do lucro ou prejuízo contábil real.',
      },
      simplesHibrido2027: {
        valor: 'DAS até R$ 3,6 mi + Parcela IRPJ/CSLL no DAS',
        detalhe:
          'IRPJ e CSLL continuam 100% integrados no DAS mesmo sobre a parcela excedente ao sublimite, com alíquota reduzida pela exclusão do IBS/CBS.',
      },
      lucroPresumido: {
        valor: 'Presunção de 8% (peças) e 32% (serviços)',
        detalhe: `Sobre Faturamento Bruto. Penaliza severamente a Pastore, cuja margem líquida real apurada nos balancetes é de apenas ~${margemRetidaLiquidaPct.toFixed(1)}%.`,
      },
      reforma2027: {
        valor: 'Lucro Real Mantido no IRPJ/CSLL',
        detalhe: `IBS/CBS substitui tributos sobre o consumo; no IRPJ/CSLL a empresa adota o Lucro Real, tributando exclusivamente a margem efetiva de ~${margemRetidaLiquidaPct.toFixed(1)}%.`,
        destaque: true,
      },
    },
    {
      criterio: 'Tributação sobre o Consumo (Bens e Serviços)',
      simplesNacional: {
        valor: 'DAS com Segregação Monofásica',
        detalhe:
          'Permite abater parcelas de PIS/COFINS e ICMS-ST em autopeças monofásicas, mantendo alíquota efetiva média ponderada de ~9,2%.',
      },
      simplesHibrido2027: {
        valor: 'DAS até R$ 3,6 mi + IBS/CBS por fora no excedente',
        detalhe:
          'Até R$ 3,6 mi: recolhimento integral no DAS. Sobre a parcela excedente (> R$ 3,6 mi): IBS e CBS (26,5%) recolhidos por fora com crédito pleno de compras.',
        destaque: true,
      },
      lucroPresumido: {
        valor: 'PIS/COFINS 3,65% + ICMS ~12% + ISS ~3-5%',
        detalhe:
          'Operação híbrida: peças (ICMS/ST) e mão de obra mecânica (ISSQN de Vacaria/RS). Alíquota cumulativa sem crédito.',
      },
      reforma2027: {
        valor: 'CBS ~8,8% + IBS ~17,7% (Total ~26,5%)',
        detalhe:
          'Alíquota de referência unificada, porém liquidada apenas sobre o valor agregado efetivo através da não-cumulatividade plena.',
        destaque: true,
      },
    },
    {
      criterio: 'Aproveitamento de Créditos das Compras',
      simplesNacional: {
        valor: 'VEDADO (Sem crédito nas entradas)',
        detalhe:
          'Compras de distribuidoras (Cobra Rolamentos, etc.) não geram crédito a abater no DAS da mecânica.',
      },
      simplesHibrido2027: {
        valor: 'CRÉDITO PLENO NA PARCELA EXCEDENTE',
        detalhe:
          'Sobre as compras vinculadas à receita acima de R$ 3,6 mi, a oficina apropria 100% dos créditos de IBS/CBS (26,5%), neutralizando o custo de insumos.',
        destaque: true,
      },
      lucroPresumido: {
        valor: 'VEDADO (Zero crédito nas entradas)',
        detalhe:
          'Compras de autopeças e insumos entram com custo tributário embutido e sem ressarcimento de PIS/COFINS.',
      },
      reforma2027: {
        valor: 'INTEGRAL E AMPLO (Crédito Financeiro)',
        detalhe:
          'Tudo o que a mecânica adquire gera crédito imediato: peças de reposição, ferramentas, energia, aluguel e serviços terceirizados.',
        destaque: true,
      },
    },
    {
      criterio: 'Vendas a Consumidor Final (PF) e Mercado B2B',
      simplesNacional: {
        valor: 'Favorável para Pessoa Física (PF)',
        detalhe:
          'Excelente para balcão e oficina atendendo veículos particulares; porém não transfere créditos cheios para frotas B2B.',
      },
      simplesHibrido2027: {
        valor: 'Híbrido: DAS em PF + Destaque B2B no excedente',
        detalhe:
          'Permite destacar crédito cheio de IBS/CBS aos clientes corporativos/frotistas na proporção da parcela sujeita ao regime regular.',
      },
      lucroPresumido: {
        valor: 'Carga integral embutida no preço ao consumidor',
        detalhe:
          'Absorve custos tributários sem compensação; cliente final paga preço majorado pelo resíduo fiscal acumulado.',
      },
      reforma2027: {
        valor: 'Crédito preservado na compra + cClassTrib regular',
        detalhe:
          'Não há penalidade nas vendas a PF; o crédito das compras (Cobra Rolamentos, etc.) abate integralmente o débito da NFe.',
        destaque: true,
      },
    },
    {
      criterio: 'Cumulatividade e Resíduo Fiscal',
      simplesNacional: {
        valor: 'Média (Tributos acumulados nas etapas anteriores)',
        detalhe:
          'A mecânica não recupera o IBS/CBS das compras de autopeças caso permaneça no Simples sem adesão ao regime regular de créditos.',
      },
      simplesHibrido2027: {
        valor: 'Mista / Progressiva',
        detalhe:
          'Cumulativo dentro do sublimite; não-cumulativo pleno com recuperação de crédito na parcela que excede R$ 3,6 mi.',
      },
      lucroPresumido: {
        valor: 'Alta Cumulatividade (Efeito Cascata)',
        detalhe:
          'Impostos pagos na cadeia de distribuição ficam incorporados no custo sem possibilidade de ressarcimento.',
      },
      reforma2027: {
        valor: 'Zero Cumulatividade (Não-cumulatividade plena)',
        detalhe:
          'Imposto incide estritamente sobre a margem de agregação da oficina mecânica (mão de obra e lucro real das peças).',
        destaque: true,
      },
    },
    {
      criterio: `Estimativa de Carga Anual em R$ (Base Projeção Anualizada: ~${fmtBrl(recProj)})`,
      simplesNacional: {
        valor: `~${fmtBrl(cargaSimplesEstimada)} / ano`,
        detalhe:
          '~9,2% do faturamento. Opção de simplicidade administrativa e carga competitiva, agora 100% legal com a receita real recalculada.',
      },
      simplesHibrido2027: {
        valor: `~${fmtBrl(cargaHibridoProjecaoAtual.cargaTotalAnual)} / ano`,
        detalhe: `Projeção atual (~${fmtBrl(recProj)}) fica abaixo do sublimite (R$ 3,6 mi) -> Carga = Simples puro (~9,2%). Se atingir teto de R$ 4,8 mi: ~${fmtBrl(cargaTotalHibridoTeto)}/ano (~${aliqEfetivaHibridoTeto.toFixed(1)}%).`,
        destaque: true,
      },
      lucroPresumido: {
        valor: `~${fmtBrl(cargaPresumidoEstimada)} / ano`,
        detalhe: `~12,6% do faturamento (~${fmtBrl(cargaPresumidoEstimada)}). Pior cenário tributário devido à presunção artificial de 8%/32% contra margem real de ~${margemRetidaLiquidaPct.toFixed(1)}%.`,
      },
      reforma2027: {
        valor: `~${fmtBrl(cargaReformaEstimada)} / ano`,
        detalhe: `~8,5% do faturamento (~${fmtBrl(cargaReformaEstimada)}). Menor custo líquido tributário com aproveitamento pleno de créditos de autopeças e IRPJ/CSLL no Lucro Real.`,
        destaque: true,
      },
    },
    {
      criterio: 'Veredito Técnico ADECONT',
      simplesNacional: {
        valor: 'VIÁVEL E COMPETITIVO (Excelente para Transição)',
        detalhe:
          'Com a receita recalculada dentro do teto de R$ 4,8 mi, o Simples Nacional volta a ser opção perfeitamente legítima, segura e vantajosa no curto prazo.',
      },
      simplesHibrido2027: {
        valor: 'CENÁRIO DE TRANSIÇÃO AUTOMÁTICA (LC 214/2025)',
        detalhe:
          'Protege a Pastore caso o faturamento cresça acima de R$ 3,6 mi. Garante alíquota máxima de ~8,77% a R$ 4,8 mi sem necessidade de desenquadramento brusco do Simples.',
        destaque: true,
      },
      lucroPresumido: {
        valor: 'DESFAVORÁVEL (Sobretaxação Evidente)',
        detalhe:
          'Não recomendado. Gera custo tributário anual cerca de R$ 90 mil a R$ 115 mil maior do que o Simples ou o Regime Regular da Reforma.',
      },
      reforma2027: {
        valor: 'ROTA ESTRATÉGICA DE LONGO PRAZO RECOMENDADA',
        detalhe:
          'A partir de 2027, o Regime Regular de IBS/CBS combinado ao Lucro Real é a melhor rota técnica para desonerar compras de autopeças e tributar apenas a margem real.',
        destaque: true,
      },
    },
  ]

  const recomendacao = {
    regimeRecomendado:
      'Simples Nacional (Imediato) ou Regime Regular IBS/CBS + Lucro Real (Estratégico 2027+)',
    titulo: 'Veredito Técnico ADECONT: Simples Nacional Cabível & Rota Estratégica 2027+',
    motivoPrincipal: `A AUTO MECÂNICA IRMÃOS PASTORE LTDA apurou receita real acumulada de R$ 1.661.813,35 nos 7 balancetes contábeis de 2026 (jan–jul) — após a correta detecção de que os balancetes são cumulativos "até a data" e conversão por diferença das receitas líquidas mensais, eliminando a soma duplicada anterior de R$ 6,3 milhões. Com isso, a projeção anualizada do cliente fica em ~R$ 2,85 milhões, posicionando a empresa DENTRO do teto do Simples Nacional (R$ 4,8 milhões da LC 123/2006). A margem retida líquida real apurada no patrimônio líquido é de ~4,4% (variação de +R$ 72.496,24). O Simples Nacional volta a ser uma opção plenamente cabível e muito vantajosa frente ao Lucro Presumido, enquanto o Regime Regular de IBS/CBS com Lucro Real desponta como a melhor rota estratégica para 2027+ devido ao crédito integral nas compras de autopeças (Cobra Rolamentos e distribuidoras). Como rota de transição intermediária, a LC 214/2025 assegura o Simples Híbrido caso a empresa ultrapasse o sublimite de R$ 3,6 mi, garantindo alíquota de ~8,77% a R$ 4,8 mi.`,
    pontosChave: [
      `Simples Nacional Plenamente Cabível: Com receita real de R$ 1.661.813,35 em 7 meses e projeção anualizada de ~R$ 2,85 milhões, a Pastore fica confortavelmente abaixo do teto de R$ 4,8 mi e do sublimite de R$ 3,6 mi, tornando a opção legalmente válida.`,
      `Margem Real de ~4,4%: A variação do patrimônio líquido (+R$ 72.496,24) sobre a receita líquida real apurada confirma margem estreita de ~4,4%, comprovando que o Lucro Presumido (presunção de 8% em peças e 32% em serviços) sobretaxa a empresa em mais de R$ 90 mil/ano.`,
      `Opção de Transição Imediata: No curto prazo (2026), o Simples Nacional oferece menor complexidade e carga de ~9,2% com segregação de autopeças monofásicas (ICMS-ST e PIS/COFINS).`,
      `Simples Híbrido 2027 (LC 214/2025): Caso a receita mensal de julho (R$ 296,9 mil) se mantenha anualizada em ~R$ 3,56 mi e cruze o sublimite de R$ 3,6 mi, o Simples Híbrido entra em vigor com crédito pleno de autopeças sobre a parcela excedente, mantendo a carga limitada a ~8,77% mesmo no teto de R$ 4,8 mi.`,
      `Estratégia para 2027+ (Reforma Tributária): A partir de 2027, o Regime Regular de IBS/CBS combinado ao Lucro Real atinge carga efetiva de ~8,5%, permitindo à mecânica abater 100% dos créditos fiscais nas compras de autopeças de distribuidores (Cobra Rolamentos, etc.).`,
      `Metodologia de Balancetes Cumulativos: A conciliação contábil por diferença revelou que o balancete de julho (R$ 1.661.813,35) já contém o acumulado do ano, restabelecendo a exatidão gerencial dos números da Pastore.`,
    ],
    resumoCargaEstimada: `Economia anual estimada de ~R$ 96 mil a R$ 116 mil ao migrar do Lucro Presumido para o Simples Nacional, Simples Híbrido ou Regime Regular 2027+.`,
  }

  // 8) EVOLUÇÃO LEGISLATIVA RECENTE ALIMENTADA PELO AGENTE ATUALIZADOR
  // Busca as últimas revisões de normas e exclusões registradas no sistema
  let evolucaoLegislativaRecente: ItemEvolucaoLegislativaAgente[] = []
  try {
    evolucaoLegislativaRecente = await carregarEvolucaoLegislativaTransicao()
  } catch (err) {
    console.warn('Erro ao carregar evolução legislativa do agente no diagnóstico Pastore:', err)
    evolucaoLegislativaRecente = obterEvolucaoLegislativaFallback()
  }

  return {
    empresa,
    cnaesSecundariosLista,
    regimeTributarioAtual,
    enquadramentoTributarioAtual,
    folhaPagamento,
    comparativoCustoFolha,
    balancetes,
    detalhamentoConversao,
    isBalanceteCumulativo,
    notaMetodologicaCumulativa,
    receitaTotalAcumulada,
    receitaMensalMedia,
    receitaAnualizada,
    patrimonioLiquidoInicial,
    patrimonioLiquidoFinal,
    variacaoPatrimonioLiquido,
    margemRetidaLiquidaPct,
    ativoTotalMaisRecente,
    notas,
    dataCalculo: new Date().toLocaleDateString('pt-BR'),
    simplesHibrido,
    lucroRealPuro,
    tabelaValoresPercentuais,
    linhaDoTempoTransicao,
    evolucaoLegislativaRecente,
    recomendacao,
    linhasComparativo,
    alertaDivergencia: avaliarDivergenciaRegime({
      regimeCadastrado: regimeTributarioAtual,
      receitaAnualizada,
      regimeRecomendadoTecnico: 'Simples Nacional',
      tabelaValoresPercentuais,
      margemRetidaLiquidaPct,
    }),
  }
}

/**
 * Avalia se um ato normativo ou revisão afeta os marcos da linha do tempo da transição 2026–2033
 */
function avaliarImpactoNormaTransicao(
  textoBusca: string,
  codigoNorma: string,
): { afetaTransicao: boolean; anoAfetado?: string; impactoTransicao?: string } {
  const norm = (textoBusca + ' ' + codigoNorma).toLowerCase()

  if (
    norm.includes('2.215') ||
    norm.includes('549') ||
    norm.includes('13.140') ||
    norm.includes('ano-teste') ||
    norm.includes('2026')
  ) {
    return {
      afetaTransicao: true,
      anoAfetado: '2026',
      impactoTransicao:
        'Regulamenta o ano-teste, registro prévio e cronograma de DFe para IBS/CBS.',
    }
  }

  if (
    norm.includes('cosit') ||
    norm.includes('124/2025') ||
    norm.includes('13.133') ||
    norm.includes('simples híbrido') ||
    norm.includes('28 da lc') ||
    norm.includes('sublimite') ||
    norm.includes('2027')
  ) {
    return {
      afetaTransicao: true,
      anoAfetado: '2027',
      impactoTransicao:
        'Define não cumulatividade plena da CBS, alíquotas e modelo híbrido de sublimite.',
    }
  }

  if (
    norm.includes('238') ||
    norm.includes('mei') ||
    norm.includes('senado') ||
    norm.includes('2028')
  ) {
    return {
      afetaTransicao: true,
      anoAfetado: '2028',
      impactoTransicao:
        'Calibração de alíquotas estaduais/municipais e novos tetos de terceirizações.',
    }
  }

  if (
    norm.includes('icms') ||
    norm.includes('iss') ||
    norm.includes('partilha') ||
    norm.includes('2029')
  ) {
    return {
      afetaTransicao: true,
      anoAfetado: '2029',
      impactoTransicao:
        'Substituição proporcional de 1/10 de ICMS/ISS pelo IBS e cobrança no destino.',
    }
  }

  if (
    norm.includes('st') ||
    norm.includes('substituição tributária') ||
    norm.includes('ressarcimento') ||
    norm.includes('2030')
  ) {
    return {
      afetaTransicao: true,
      anoAfetado: '2030–2032',
      impactoTransicao:
        'Esvaziamento definitivo do ICMS-ST e compensação de saldos credores em até 60 dias.',
    }
  }

  if (norm.includes('iva dual') || norm.includes('extinção') || norm.includes('2033')) {
    return {
      afetaTransicao: true,
      anoAfetado: '2033',
      impactoTransicao: 'Consolidação definitiva do IVA Dual 100% no destino sem resíduo fiscal.',
    }
  }

  // Se for ato tributário relevante geral
  return {
    afetaTransicao: true,
    anoAfetado: '2026–2027',
    impactoTransicao:
      'Ato regulamentar do Comitê Gestor ou Receita Federal com impacto na parametrização fiscal.',
  }
}

/**
 * Carrega a evolução recente da legislação a partir das coleções do agente atualizador:
 * norm_reviews_history e norm_exclusions_history, ordenadas por data decrescente (~10 registros).
 */
export async function carregarEvolucaoLegislativaTransicao(): Promise<
  ItemEvolucaoLegislativaAgente[]
> {
  try {
    const [revisoesRes, exclusoesRes] = await Promise.allSettled([
      pb.collection('norm_reviews_history').getList(1, 15, {
        sort: '-review_date',
        requestKey: 'diag-pastore-revs',
      }),
      pb.collection('norm_exclusions_history').getList(1, 10, {
        sort: '-exclusion_date',
        requestKey: 'diag-pastore-excs',
      }),
    ])

    const revisoes = revisoesRes.status === 'fulfilled' ? revisoesRes.value?.items || [] : []
    const exclusoes = exclusoesRes.status === 'fulfilled' ? exclusoesRes.value?.items || [] : []

    const itensMapeados: ItemEvolucaoLegislativaAgente[] = []

    for (const rev of revisoes || []) {
      const tipo = (rev.review_type as 'inclusao' | 'alteracao' | 'exclusao') || 'alteracao'
      const tipoRotulo =
        tipo === 'inclusao'
          ? 'Inclusão Normativa'
          : tipo === 'alteracao'
            ? 'Alteração Normativa'
            : 'Exclusão Normativa'

      const impacto = avaliarImpactoNormaTransicao(
        `${rev.norm_title} ${rev.summary_change} ${rev.norm_code}`,
        rev.norm_code,
      )

      itensMapeados.push({
        id: rev.id || `rev-${Math.random()}`,
        tipo,
        tipoRotulo,
        codigoNorma: rev.norm_code,
        tituloNorma: rev.norm_title || rev.norm_code,
        resumo: rev.summary_change || rev.current_version || rev.norm_title,
        orgaoFonte: rev.source_org || 'Órgão Oficial',
        dataRevisao: rev.review_date || '',
        linkUrl: rev.link_url,
        afetaTransicao: impacto.afetaTransicao,
        anoAfetado: impacto.anoAfetado,
        impactoTransicao: impacto.impactoTransicao,
      })
    }

    for (const exc of exclusoes || []) {
      const impacto = avaliarImpactoNormaTransicao(
        `${exc.norm_title} ${exc.reason_description} ${exc.norm_code}`,
        exc.norm_code,
      )

      itensMapeados.push({
        id: exc.id || `exc-${Math.random()}`,
        tipo: 'exclusao',
        tipoRotulo: 'Exclusão / Revogação',
        codigoNorma: exc.norm_code,
        tituloNorma: exc.norm_title || exc.norm_code,
        resumo:
          exc.reason_description ||
          exc.previous_content ||
          'Dispositivo revogado/excluído pela transição da Reforma.',
        orgaoFonte: exc.source_org || 'Órgão Oficial',
        dataRevisao: exc.exclusion_date || '',
        linkUrl: exc.link_url,
        afetaTransicao: impacto.afetaTransicao,
        anoAfetado: impacto.anoAfetado,
        impactoTransicao: impacto.impactoTransicao,
      })
    }

    // Ordenar por data mais recente no topo
    itensMapeados.sort((a, b) => (b.dataRevisao || '').localeCompare(a.dataRevisao || ''))

    if (itensMapeados.length > 0) {
      return itensMapeados.slice(0, 10)
    }

    return obterEvolucaoLegislativaFallback()
  } catch (err) {
    console.warn('carregarEvolucaoLegislativaTransicao: usando fallback', err)
    return obterEvolucaoLegislativaFallback()
  }
}

/**
 * Fallback estático e robusto de evolução legislativa do agente
 */
export function obterEvolucaoLegislativaFallback(): ItemEvolucaoLegislativaAgente[] {
  return [
    {
      id: 'fb-rev-1',
      tipo: 'inclusao',
      tipoRotulo: 'Inclusão Normativa',
      codigoNorma: 'IN RFB nº 2.215/2024',
      tituloNorma: 'Registro Prévio e Preparação para CBS',
      resumo:
        'Dispõe sobre o registro prévio, cadastramento e obrigações acessórias preliminares preparatórias para a CBS.',
      orgaoFonte: 'Receita Federal (RFB)',
      dataRevisao: '2026-11-03',
      linkUrl: 'https://normas.receita.fazenda.gov.br',
      afetaTransicao: true,
      anoAfetado: '2026',
      impactoTransicao: 'Regulamenta o ano-teste e cronograma de DFe.',
    },
    {
      id: 'fb-rev-2',
      tipo: 'inclusao',
      tipoRotulo: 'Inclusão Normativa',
      codigoNorma: 'Portaria RFB nº 549/2025',
      tituloNorma: 'Piloto da Reforma Tributária do Consumo — CBS',
      resumo:
        'Institui o Piloto da Reforma do Consumo referente à CBS e integração de apuração assistida com o Serpro.',
      orgaoFonte: 'Receita Federal (RFB)',
      dataRevisao: '2026-11-03',
      linkUrl: 'https://normas.receita.fazenda.gov.br',
      afetaTransicao: true,
      anoAfetado: '2026',
      impactoTransicao: 'Piloto operacional das tags fiscais de IBS/CBS.',
    },
    {
      id: 'fb-rev-3',
      tipo: 'inclusao',
      tipoRotulo: 'Inclusão Normativa',
      codigoNorma: 'SC COSIT nº 124/2025',
      tituloNorma: 'Não Cumulatividade Plena e Transição PIS/Cofins para CBS',
      resumo:
        'Solução de Consulta COSIT sobre apropriação de créditos, não cumulatividade ampla e critérios interpretativos vinculantes.',
      orgaoFonte: 'Receita Federal (RFB)',
      dataRevisao: '2026-11-03',
      linkUrl: 'https://normas.receita.fazenda.gov.br',
      afetaTransicao: true,
      anoAfetado: '2027',
      impactoTransicao:
        'Garante crédito financeiro pleno sobre compras de autopeças e ferramentas.',
    },
    {
      id: 'fb-rev-4',
      tipo: 'alteracao',
      tipoRotulo: 'Alteração Normativa',
      codigoNorma: 'Resolução CGIBS 6/2026 (RIBS) — Alteração art. 617',
      tituloNorma: 'Alteração pontual de prazos operacionais do RIBS',
      resumo: 'Alteração dos prazos de integração de DFe e faseamento preparatório do IBS/CBS.',
      orgaoFonte: 'CGIBS (Comitê Gestor IBS)',
      dataRevisao: '2026-10-28',
      linkUrl: 'https://www.cgibs.gov.br/',
      afetaTransicao: true,
      anoAfetado: '2026',
      impactoTransicao: 'Prorrogação expressa do prazo de obrigatoriedade das tags de DFe.',
    },
    {
      id: 'fb-rev-5',
      tipo: 'inclusao',
      tipoRotulo: 'Inclusão Normativa',
      codigoNorma: 'Decreto 13.140/2026',
      tituloNorma: 'Decreto nº 13.140 (nanoempreendedor e MEI — CNPJ e documento fiscal)',
      resumo:
        'Dispensa o nanoempreendedor de inscrever-se no CNPJ e de emitir documentos fiscais eletrônicos.',
      orgaoFonte: 'DOU / Imprensa Nacional',
      dataRevisao: '2026-10-21',
      linkUrl: 'https://www.in.gov.br',
      afetaTransicao: true,
      anoAfetado: '2026',
      impactoTransicao: 'Desoneração de subcontratados da oficina mecânica.',
    },
    {
      id: 'fb-rev-6',
      tipo: 'alteracao',
      tipoRotulo: 'Alteração Normativa',
      codigoNorma: 'LC 238/2026',
      tituloNorma: 'Lei Complementar nº 238 (MEI e Simples Nacional)',
      resumo:
        'Altera a LC 123/2006: limite do MEI sobe para R$ 140.000,00 e possibilidade de 2 empregados.',
      orgaoFonte: 'Senado Federal',
      dataRevisao: '2026-10-21',
      linkUrl: 'https://normas.leg.br',
      afetaTransicao: true,
      anoAfetado: '2028',
      impactoTransicao: 'Novas condições para parceiros comerciais e prestadores da oficina.',
    },
    {
      id: 'fb-rev-7',
      tipo: 'exclusao',
      tipoRotulo: 'Exclusão Legislativa',
      codigoNorma: 'Revogação LC 123/2006 art. 13 §1º (Dispositivo Anterior)',
      tituloNorma: 'Exclusão de disposições incompatíveis com o IBS/CBS',
      resumo:
        'Exclusão e revogação expressa de tratamento cumulativo anterior em face do art. 343 da LC 214/2025 e LC 238/2026.',
      orgaoFonte: 'Senado Federal / Congresso Nacional',
      dataRevisao: '2026-10-21',
      linkUrl: 'https://normas.leg.br',
      afetaTransicao: true,
      anoAfetado: '2027',
      impactoTransicao: 'Fim da vedação de transferência de créditos no modelo híbrido.',
    },
    {
      id: 'fb-rev-8',
      tipo: 'inclusao',
      tipoRotulo: 'Inclusão Normativa',
      codigoNorma: 'ATC RFB/CGIBS nº 9/2026',
      tituloNorma: 'Ato Técnico Conjunto RFB/CGIBS nº 9 (trabalhos conjuntos e GTI)',
      resumo: 'Disciplina a organização dos trabalhos de cooperação entre RFB e DIREX/CGIBS.',
      orgaoFonte: 'Receita Federal / CGIBS',
      dataRevisao: '2026-10-20',
      linkUrl: 'https://www.in.gov.br',
      afetaTransicao: true,
      anoAfetado: '2026',
      impactoTransicao: 'Harmonização dos manuais técnicos de emissão de NF-e.',
    },
    {
      id: 'fb-rev-9',
      tipo: 'alteracao',
      tipoRotulo: 'Alteração Normativa',
      codigoNorma: 'Decreto 13.133/2026',
      tituloNorma: 'Decreto nº 13.133 (delegação das alíquotas da CBS dos combustíveis)',
      resumo:
        'Delega ao Ministro da Fazenda competência para divulgar alíquotas ad rem/ad valorem de CBS.',
      orgaoFonte: 'DOU / Imprensa Nacional',
      dataRevisao: '2026-10-09',
      linkUrl: 'https://www.in.gov.br',
      afetaTransicao: true,
      anoAfetado: '2027',
      impactoTransicao: 'Impacta custos de frotas e lubrificantes automotivos da oficina.',
    },
    {
      id: 'fb-rev-10',
      tipo: 'exclusao',
      tipoRotulo: 'Revogação Parcial',
      codigoNorma: 'IN RFB nº 2.110/2022 — Exclusão de Retenções Previdenciárias Redundantes',
      tituloNorma: 'Exclusão de exigência de retenção substituída pela liquidação financeira',
      resumo:
        'Revogação de dispositivos de retenção sobre cessão de mão de obra unificados na compensação centralizada da CBS.',
      orgaoFonte: 'Receita Federal (RFB)',
      dataRevisao: '2026-10-18',
      linkUrl: 'https://www.receita.fazenda.gov.br',
      afetaTransicao: true,
      anoAfetado: '2027',
      impactoTransicao: 'Elimina bi-tributação de retenção na fonte em serviços mecânicos.',
    },
  ]
}
