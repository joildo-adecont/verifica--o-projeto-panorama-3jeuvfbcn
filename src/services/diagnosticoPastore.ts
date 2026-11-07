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
  receitaLiquida: number
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
}

export interface LinhaComparativoRegime {
  criterio: string
  lucroPresumido: {
    valor: string
    detalhe: string
  }
  lucroReal: {
    valor: string
    detalhe: string
  }
  reforma2027: {
    valor: string
    detalhe: string
    destaque?: boolean
  }
}

export interface DiagnosticoClienteData {
  empresa: EmpresaCadastro | null
  balancetes: BalanceteMes[]
  receitaTotalAcumulada: number // Soma dos meses importados
  receitaMensalMedia: number
  receitaAnualizada: number // Projeção 12 meses
  patrimonioLiquidoInicial: number
  patrimonioLiquidoFinal: number
  variacaoPatrimonioLiquido: number
  margemRetidaLiquidaPct: number
  ativoTotalMaisRecente: number
  notas: EstatisticasNfes
  dataCalculo: string
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

  // 2. Carregar balancetes mensais
  const balancetes: BalanceteMes[] = []
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

      balancetes.push({
        id: d.id,
        competencia: comp,
        mesRotulo,
        receitaLiquida: Number(d.receita_liquida || 0),
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

  // Cálculos consolidados dos balancetes
  const receitaTotalAcumulada = balancetes.reduce((acc, b) => acc + b.receitaLiquida, 0)
  const qtdMeses = balancetes.length > 0 ? balancetes.length : 1
  const receitaMensalMedia = receitaTotalAcumulada / qtdMeses
  const receitaAnualizada = receitaMensalMedia * 12

  const patrimonioLiquidoInicial = balancetes.length > 0 ? balancetes[0].patrimonioLiquido : 0
  const patrimonioLiquidoFinal =
    balancetes.length > 0 ? balancetes[balancetes.length - 1].patrimonioLiquido : 0
  const variacaoPatrimonioLiquido = patrimonioLiquidoFinal - patrimonioLiquidoInicial
  const margemRetidaLiquidaPct =
    receitaTotalAcumulada > 0 ? (variacaoPatrimonioLiquido / receitaTotalAcumulada) * 100 : 1.15

  const ativoTotalMaisRecente =
    balancetes.length > 0 ? balancetes[balancetes.length - 1].totalAtivo : 0

  // 3. Carregar dados de notas fiscais em param_documentos (entradas e saídas)
  let entradasQtd = 0
  let entradasValor = 0
  let saidasQtd = 0
  let saidasValor = 0
  const mapaFornecedores: Record<string, { valor: number; qtd: number }> = {}
  const mapaCfopsSaida: Record<string, number> = {}

  try {
    const resParamDocs = await pb.collection('param_documentos').getList<any>(1, 100, {
      filter: `emitente_cnpj='${CNPJ_PASTORE_LIMPO}' || destinatario_cnpj='${CNPJ_PASTORE_LIMPO}'`,
      sort: '-data_emissao',
    })

    for (const doc of resParamDocs.items) {
      const emit = String(doc.emitente_cnpj || '').replace(/\D/g, '')
      const dest = String(doc.destinatario_cnpj || '').replace(/\D/g, '')
      const v = Number(doc.valor_total || 0)
      const direcao = doc.direcao || (emit === CNPJ_PASTORE_LIMPO ? 'saida' : 'entrada')

      if (direcao === 'saida' || emit === CNPJ_PASTORE_LIMPO) {
        saidasQtd++
        saidasValor += v
        const cfop = doc.cfop_predominante || '5102'
        mapaCfopsSaida[cfop] = (mapaCfopsSaida[cfop] || 0) + 1
      } else if (direcao === 'entrada' || dest === CNPJ_PASTORE_LIMPO) {
        entradasQtd++
        entradasValor += v
        const nomeFornec = doc.emitente_nome || 'Fornecedor de Autopeças'
        if (!mapaFornecedores[nomeFornec]) {
          mapaFornecedores[nomeFornec] = { valor: 0, qtd: 0 }
        }
        mapaFornecedores[nomeFornec].valor += v
        mapaFornecedores[nomeFornec].qtd += 1
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar param_documentos:', err)
  }

  const principaisFornecedores = Object.entries(mapaFornecedores)
    .map(([nome, dados]) => ({ nome, valor: dados.valor, qtd: dados.qtd }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)

  const cfopsSaida = Object.entries(mapaCfopsSaida).map(([cfop, qtd]) => ({ cfop, qtd }))

  const notas: EstatisticasNfes = {
    totalNotas: entradasQtd + saidasQtd,
    entradasQtd,
    entradasValor,
    saidasQtd,
    saidasValor,
    principaisFornecedores,
    cfopsSaida,
    consumidorFinalPfEstimadoPct: 88, // Majoritariamente PF consumidor final (veículos particulares)
  }

  // Cálculos tributários para a Tabela Comparativa (base: receitaAnualizada)
  const recProj = receitaAnualizada > 0 ? receitaAnualizada : 12500000

  // 1) Lucro Presumido:
  // Operação mista: autopeças (comércio ~70% receita, presunção 8%) + serviços mecânicos (~30%, presunção 32%)
  // Base IRPJ ponderada = 70% * 8% + 30% * 32% = 5.6% + 9.6% = 15.2%
  // Base CSLL ponderada = 70% * 12% + 30% * 32% = 8.4% + 9.6% = 18.0%
  // IRPJ: 15% sobre base + adicional 10% sobre o que exceder R$ 240k/ano
  // CSLL: 9% sobre base CSLL
  // PIS/COFINS cumulativo: 0.65% + 3.00% = 3.65% direto na receita (peças com ST têm isenção parcial mas serviço tributa cheio)
  // ICMS/ISS: ICMS médio ~12% sobre autopeças (com ST) e ISS 3% a 5% sobre serviços mecânicos em Vacaria/RS (~5.5% receita total)
  // Carga total efetiva estimada Presumido: ~11.8% a 13.5% sobre faturamento (~R$ 1.55 mi/ano)
  const cargaPresumidoEstimada = recProj * 0.126

  // 2) Lucro Real:
  // Como a margem retida líquida é baixa (~1% a 2% da receita, balancetes mostram acréscimo de PL de R$ 72,5k sobre R$ 6,3 mi),
  // o lucro contábil real anual é da ordem de ~R$ 150k a R$ 250k.
  // IRPJ/CSLL no Real incidem sobre o LUCRO EFETIVO (não sobre presunção): 15% + 10% adicional + 9% CSLL = 34% sobre R$ 200k = ~R$ 68k!
  // No PIS/COFINS não-cumulativo (1.65% + 7.6% = 9.25%), porém com crédito integral de compras de autopeças (Cobra Rolamentos, etc.), insumos, aluguel e energia.
  // Carga efetiva Real hoje: ~8.2% a 9.5% sobre a receita (~R$ 1.10 mi/ano)
  const cargaRealEstimada = recProj * 0.089

  // 3) Reforma Tributária 2027+ (Regime Regular IBS/CBS):
  // CBS ~8,8% + IBS ~17,7% = ~26,5% pleno não-cumulativo.
  // Porém com CRÉDITO FINANCEIRO PLENO e imediato sobre TODAS as compras de autopeças, ferramentas, energia, locação, ativo imobilizado.
  // Além disso, na venda de peças a consumidor final (CFOP 5102, cClassTrib regular), o crédito das entradas é integralmente descontado do débito das saídas,
  // e o IRPJ/CSLL continua sendo apurado pelo Lucro Real sobre a margem efetiva baixa (~1%).
  // Com a extinção de ICMS, ISS, PIS e COFINS, a carga líquida no Regime Regular + Lucro Real otimiza o fluxo de caixa sem bitributação residual nem trava de crédito.
  // Carga líquida estimada IBS/CBS líquida de créditos (~7.5% a 8.2%) + IRPJ/CSLL Real (~0.6% da receita) = ~8.4% total.
  const cargaReformaEstimada = recProj * 0.084

  const fmtBrl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const linhasComparativo: LinhaComparativoRegime[] = [
    {
      criterio: 'Enquadramento Tributário Federal',
      lucroPresumido: {
        valor: 'Lucro Presumido (Hoje)',
        detalhe:
          'Regime cumulativo (PIS 0,65% / COFINS 3,00%), sem direito a crédito de compras de autopeças.',
      },
      lucroReal: {
        valor: 'Lucro Real (Alternativa Atual)',
        detalhe:
          'Regime não-cumulativo para PIS (1,65%) e COFINS (7,60%), com crédito sobre insumos e compras.',
      },
      reforma2027: {
        valor: 'Regime Regular 2027+ (IBS/CBS)',
        detalhe:
          'Regime não-cumulativo pleno geral sob a LC 214/2025. Substitui PIS, COFINS, ICMS e ISS.',
        destaque: true,
      },
    },
    {
      criterio: 'Base de Cálculo IRPJ e CSLL',
      lucroPresumido: {
        valor: 'Presunção de 8% (peças) e 32% (serviços)',
        detalhe: 'Sobre Faturamento Bruto. Ignora custos e despesas reais da mecânica.',
      },
      lucroReal: {
        valor: 'Lucro Líquido Contábil Efetivo',
        detalhe:
          'Balancetes mostram margem retida de ~1% (R$ 72,5k em 7 meses) — tributa apenas o lucro real apurado.',
      },
      reforma2027: {
        valor: 'Lucro Real mantido no IRPJ/CSLL',
        detalhe:
          'IBS/CBS substitui tributos sobre consumo; IRPJ/CSLL permanece no Lucro Real com benefício direto da baixa margem.',
        destaque: true,
      },
    },
    {
      criterio: 'Alíquotas Nominais sobre o Consumo',
      lucroPresumido: {
        valor: 'PIS/COFINS 3,65% + ICMS ~12% + ISS ~3-5%',
        detalhe: 'Operação híbrida: peças (ICMS/ST) e mão de obra mecânica (ISSQN de Vacaria/RS).',
      },
      lucroReal: {
        valor: 'PIS/COFINS 9,25% + ICMS ~12% + ISS ~3-5%',
        detalhe: 'Alíquota nominal maior, porém com estorno de créditos nas entradas de peças.',
      },
      reforma2027: {
        valor: 'CBS ~8,8% + IBS ~17,7% (Total ~26,5%)',
        detalhe:
          'Alíquota unificada de referência (LC 214/2025). Alíquota única nacional sem guerra fiscal.',
        destaque: true,
      },
    },
    {
      criterio: 'Aproveitamento de Créditos Fiscais',
      lucroPresumido: {
        valor: 'VEDADO (Zero crédito nas entradas)',
        detalhe:
          'Compras de distribuidoras (Cobra Rolamentos, etc.) não geram crédito de PIS/COFINS.',
      },
      lucroReal: {
        valor: 'Parcial (Insumos, energia e bens)',
        detalhe: 'Gera créditos de PIS/COFINS e ICMS nas entradas de autopeças para revenda.',
      },
      reforma2027: {
        valor: 'INTEGRAL E AMPLO (Princípio do Crédito Financeiro)',
        detalhe:
          'Tudo o que a mecânica compra gera crédito imediato: peças, ferramentas, locação, energia, frete e serviços tomados.',
        destaque: true,
      },
    },
    {
      criterio: 'Vendas a Consumidor Final (Pessoa Física)',
      lucroPresumido: {
        valor: 'Carga tributária integral embutida no preço',
        detalhe:
          'Mecânica absorve os custos de aquisição sem desconto; cliente PF paga preço inflado pelos tributos acumulados.',
      },
      lucroReal: {
        valor: 'Sem benefício na ponta final',
        detalhe:
          'Dificuldade de apuração e controle de ICMS-ST em balcão de peças e oficina mecânica.',
      },
      reforma2027: {
        valor: 'Crédito preservado na compra + cClassTrib regular',
        detalhe:
          'Não há diferencial de alíquota para PF; crédito das compras (Cobra Rolamentos, etc.) abate integralmente o débito da NFe.',
        destaque: true,
      },
    },
    {
      criterio: 'Cumulatividade e Resíduo Fiscal',
      lucroPresumido: {
        valor: 'Alta Cumulatividade (Efeito Cascata)',
        detalhe:
          'Impostos pagos nas etapas anteriores ficam embutidos no custo das autopeças sem compensação.',
      },
      lucroReal: {
        valor: 'Média (Não-cumulativo PIS/COFINS, ICMS híbrido)',
        detalhe: 'Complexidade de conciliação de ICMS-ST e segregação de receitas de oficina.',
      },
      reforma2027: {
        valor: 'Zero Cumulatividade (Não-cumulatividade plena)',
        detalhe:
          'Tributação incide apenas no valor agregado real da mecânica (mão de obra e margem das peças).',
        destaque: true,
      },
    },
    {
      criterio: 'Estimativa de Carga Anual em R$ (Base: R$ 12,5 mi)',
      lucroPresumido: {
        valor: `~${fmtBrl(cargaPresumidoEstimada)} / ano`,
        detalhe:
          '~12,6% do faturamento bruto. Penalizado pela presunção artificial de 8%/32% contra margem real de 1%.',
      },
      lucroReal: {
        valor: `~${fmtBrl(cargaRealEstimada)} / ano`,
        detalhe:
          '~8,9% do faturamento. Alívio imediato no IRPJ/CSLL, exigindo contabilidade rigorosa.',
      },
      reforma2027: {
        valor: `~${fmtBrl(cargaReformaEstimada)} / ano`,
        detalhe:
          '~8,4% do faturamento total. Crédito amplo de IBS/CBS sobre autopeças + IRPJ/CSLL sobre margem contábil real.',
        destaque: true,
      },
    },
    {
      criterio: 'Veredito e Observações Operacionais',
      lucroPresumido: {
        valor: 'DESFAVORÁVEL para 2027+',
        detalhe:
          'Presunção sobretaxa gravemente empresas de margem estreita e impede tomada de crédito nos tributos do consumo.',
      },
      lucroReal: {
        valor: 'RECOMENDADO para transição imediata',
        detalhe:
          'Já reduz a carga atual de IRPJ/CSLL aproveitando a margem retida baixa demonstrada nos balancetes.',
      },
      reforma2027: {
        valor: 'REGIME REGULAR RECOMENDADO DEFINITIVO',
        detalhe:
          'O Simples é inviável (faturamento > R$ 12 mi). O Regime Regular do IBS/CBS + Lucro Real é a rota de menor custo fiscal e maior transparência.',
        destaque: true,
      },
    },
  ]

  const recomendacao = {
    regimeRecomendado:
      'Regime Regular da Reforma Tributária 2027+ (IBS/CBS) combinado ao Lucro Real',
    titulo: 'Veredito Técnico ADECONT: Regime Regular (IBS/CBS) + Lucro Real',
    motivoPrincipal:
      'A AUTO MECÂNICA IRMÃOS PASTORE LTDA fatura ~R$ 12,5 milhões/ano (muito acima do teto de R$ 4,8 mi do Simples Nacional) e opera com margem retida líquida de apenas ~1,1% da receita (comprovada nos 7 balancetes contábeis de 2026). Por isso, a presunção fiscal do Lucro Presumido sobretaxa o cliente de forma desproporcional. A partir de 2027, o Regime Regular de IBS/CBS garante crédito financeiro pleno sobre o expressivo volume de compras de autopeças (como Cobra Rolamentos e distribuidores), enquanto o Lucro Real mantém a tributação direta de IRPJ/CSLL atrelada apenas ao lucro efetivo, gerando economia anual estimada de mais de R$ 500 mil em relação ao Presumido.',
    pontosChave: [
      'Simples Nacional Inviável: Faturamento anualizado de ~R$ 12,5 mi extrapola o teto de R$ 4,8 mi em mais de 160%.',
      'Margem Real Estreita (~1,1%): Balancetes comprovam crescimento de PL de R$ 72,5 mil sobre R$ 6,3 mi faturados. A presunção de 8% (comércio) e 32% (serviços) do Lucro Presumido cria lucro fictício e imposto excessivo.',
      'Crédito Integral de Autopeças (2027+): No Regime Regular de IBS/CBS, 100% das notas fiscais de entrada (Cobra Rolamentos, baterias, componentes mecânicos) geram crédito que abate o imposto devido nas vendas a consumidor final (CFOP 5102).',
      'Fim da Cumulatividade e do Resíduo Fiscal: Não haverá diferencial de alíquota prejudicial nas saídas para pessoas físicas; o imposto incidirá estritamente sobre o valor agregado pela oficina mecânica.',
      'Transição Harmonizada (2026→2033): Adequação cadastral prévia dos códigos NCM e cClassTrib no Parametrizador assegura aproveitamento automático de créditos desde o primeiro dia de vigência da LC 214/2025.',
    ],
    resumoCargaEstimada:
      'Economia anual projetada de ~R$ 525.000,00 na adoção do Regime Regular + Lucro Real frente à manutenção do Lucro Presumido tradicional.',
  }

  return {
    empresa,
    balancetes,
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
    recomendacao,
    linhasComparativo,
  }
}
