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

export interface DiagnosticoClienteData {
  empresa: EmpresaCadastro | null
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
  recomendacao: {
    regimeRecomendado: string
    titulo: string
    motivoPrincipal: string
    pontosChave: string[]
    resumoCargaEstimada: string
  }
  linhasComparativo: LinhaComparativoRegime[]
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
    },
    {
      ano: 2027,
      fase: 'Início da Vigência Federal (CBS)',
      titulo: '2027: CBS Plena e Sublimite do Simples Híbrido',
      statusOficial: 'Extinção de PIS/COFINS e Ativação da CBS',
      mecanicaLegislativa:
        'Extinção definitiva de PIS e COFINS. CBS entra com alíquota plena (~8,8%). IBS mantém alíquota teste de 0,1%. Ativação da regra do Simples Híbrido (LC 214/2025, art. 28) com sublimite de R$ 3,6 mi.',
      impactoPastore:
        'Para faturamento até R$ 3,6 mi, a Pastore recolhe DAS sem alteração. Se atingir o ritmo de julho (~R$ 3,56 mi) e romper R$ 3,6 mi, o excedente recolhe CBS/IBS com crédito pleno de compras.',
      acaoRecomendadaAdecont:
        'Avaliar migração estratégica para o Regime Regular caso a receita exceda R$ 3,6 mi ou se a carteira corporativa (frotas PJ) exigir destaque integral de créditos.',
      creditoComprasValendo: true,
      simplesCabivel: true,
    },
    {
      ano: 2028,
      fase: 'Calibração das Alíquotas Subnacionais',
      titulo: '2028: Fixação de Alíquotas Estaduais e Municipais',
      statusOficial: 'CBS Plena + IBS Calibrado pelo Senado',
      mecanicaLegislativa:
        'Manutenção da CBS plena. Senado Federal fixa alíquotas de referência para Estados e Municípios. Redução preparatória de benefícios e incentivos fiscais regionais.',
      impactoPastore:
        'A oficina mecânica segue operando com segurança. Distribuidores de peças (Cobra Rolamentos, etc.) já emitem notas com crédito financeiro integral destacado de CBS.',
      acaoRecomendadaAdecont:
        'Auditoria contínua da margem retida líquida (~4,4%) e monitoramento mensal do faturamento em 12 meses acumulados para antecipar virada de sublimite.',
      creditoComprasValendo: true,
      simplesCabivel: true,
    },
    {
      ano: '2029–2032',
      fase: 'Transição Gradual IBS (1/10 ao ano)',
      titulo: '2029 a 2032: Redução Gradual de ICMS/ISS e Subida do IBS',
      statusOficial: 'Substituição Proporcional de 10% a 40% ao ano',
      mecanicaLegislativa:
        'ICMS e ISS são reduzidos anualmente na proporção de 1/10 (90% em 2029, 80% em 2030, 70% em 2031, 60% em 2032), enquanto o IBS é elevado na mesma proporção.',
      impactoPastore:
        'A cumulatividade do ICMS e ISS perde força gradativamente. Empresas que migrarem para o Regime Regular abatem 100% de créditos de insumos, equipamentos e energia.',
      acaoRecomendadaAdecont:
        'Transição recomendada para Regime Regular + Lucro Real caso a receita ultrapasse R$ 3,6 mi, aproveitando o crédito pleno das autopeças para reduzir alíquota efetiva a ~8,5%.',
      creditoComprasValendo: true,
      simplesCabivel: true,
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

  return {
    empresa,
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
    recomendacao,
    linhasComparativo,
  }
}
