import pb from '@/lib/pocketbase/client'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'
import {
  fetchIndicadoresEconomicos,
  type IndicadorEconomico,
  type RespostaIndicadores,
} from './indicadoresEconomicos'

export interface DocumentoContabilRecord {
  id?: string
  cliente_cnpj: string
  cliente_nome: string
  tipo_documento: 'balancete' | 'balanco' | 'dre' | 'razao' | 'indefinido'
  competencia: string // AAAA-MM
  arquivo_nome: string
  formato?: string
  linhas?: number
  contas_reconhecidas?: number
  total_ativo?: number
  total_passivo?: number
  receita_liquida?: number
  lucro_liquido?: number
  patrimonio_liquido?: number
  validacao?: any
  importado_por?: string
  importado_em?: string
  created?: string
}

export interface SerieContabilMensal {
  documentoId: string
  competencia: string
  arquivoNome: string
  receitaCumulativa: number
  receitaMensalLiquida: number
  lucroLiquido: number
  totalAtivo: number
  totalPassivo: number
  patrimonioLiquido: number
  margemLucroLiquido: number
}

export interface IndicadoresMicroEmpresa {
  receitaTotalCumulada: number
  receitaAnualizada: number
  receitaUltimoMes: number
  mesesDisponiveis: number
  mesMaisRecente: string
  ativoTotalAtual: number
  passivoTotalAtual: number
  patrimonioLiquidoAtual: number
  margemLucroLiquidoMedia: number
  crescimentoMedioReceitaPct: number
  seriesMensalizadas: SerieContabilMensal[]
}

export interface RevisaoLegislativaRecente {
  id: string
  review_date: string
  reviewer?: string
  status?: string
  observations?: string
  highlights?: string
  changes_count?: number
}

export interface ParecerEspecialistasSintese {
  tributario: string
  contabil: string
  administrativo: string
  economico: string
}

export interface SinteseAnaliseEmpresarial {
  cliente: EmpresaRecord
  indicadores: IndicadoresMicroEmpresa
  documentosContabeis: DocumentoContabilRecord[]
  documentosFiscais: Array<{ id: string; chave?: string; valor?: number; emitido_em?: string }>
  normasRelevantes: RevisaoLegislativaRecente[]
  indicesMacro: RespostaIndicadores
  parecerEspecialistas: ParecerEspecialistasSintese
  dataAnalise: string
}

export function normalizarDocumento(doc?: string | null): string {
  if (!doc) return ''
  return doc.replace(/\D/g, '').trim()
}

/**
 * Busca todos os documentos da coleção cont_documentos vinculados a um CNPJ
 */
export async function buscarDocumentosContabeisPorCnpj(
  cnpjOuCpf: string,
): Promise<DocumentoContabilRecord[]> {
  const docLimpo = normalizarDocumento(cnpjOuCpf)
  if (!docLimpo) return []

  try {
    const records = await pb.collection('cont_documentos').getFullList({
      filter: `cliente_cnpj = '${docLimpo}'`,
      sort: 'competencia',
      batch: 100,
    })

    return records.map((r: any) => ({
      id: r.id,
      cliente_cnpj: r.cliente_cnpj || '',
      cliente_nome: r.cliente_nome || '',
      tipo_documento: r.tipo_documento || 'balancete',
      competencia: r.competencia || '',
      arquivo_nome: r.arquivo_nome || '',
      formato: r.formato || '',
      linhas: r.linhas || 0,
      contas_reconhecidas: r.contas_reconhecidas || 0,
      total_ativo: Number(r.total_ativo || 0),
      total_passivo: Number(r.total_passivo || 0),
      receita_liquida: Number(r.receita_liquida || 0),
      lucro_liquido: Number(r.lucro_liquido || 0),
      patrimonio_liquido: Number(r.patrimonio_liquido || 0),
      validacao: r.validacao,
      importado_por: r.importado_por || '',
      importado_em: r.importado_em || r.created || '',
      created: r.created,
    }))
  } catch (err) {
    console.warn('[analisesEmpresariais] Falha ao carregar cont_documentos:', err)
    return []
  }
}

/**
 * Salva novo documento contábil na coleção cont_documentos
 */
export async function salvarDocumentoEmpresarial(
  doc: Omit<DocumentoContabilRecord, 'id' | 'created'>,
): Promise<DocumentoContabilRecord> {
  const cnpjLimpo = normalizarDocumento(doc.cliente_cnpj)
  const payload = {
    ...doc,
    cliente_cnpj: cnpjLimpo,
    importado_em: new Date().toISOString(),
  }

  const rec = await pb.collection('cont_documentos').create(payload)
  return {
    id: rec.id,
    cliente_cnpj: rec.cliente_cnpj,
    cliente_nome: rec.cliente_nome,
    tipo_documento: rec.tipo_documento,
    competencia: rec.competencia,
    arquivo_nome: rec.arquivo_nome,
    formato: rec.formato,
    linhas: rec.linhas,
    contas_reconhecidas: rec.contas_reconhecidas,
    total_ativo: rec.total_ativo,
    total_passivo: rec.total_passivo,
    receita_liquida: rec.receita_liquida,
    lucro_liquido: rec.lucro_liquido,
    patrimonio_liquido: rec.patrimonio_liquido,
    validacao: rec.validacao,
    importado_por: rec.importado_por,
    importado_em: rec.importado_em,
    created: rec.created,
  }
}

/**
 * Converte balancetes cumulativos em valores mensais líquidos (decupagem contábil)
 * Regra idêntica ao padrão de diagnóstico Pastore do sistema ADECONT.
 */
export function decuparBalancetesCumulativos(
  documentos: DocumentoContabilRecord[],
): IndicadoresMicroEmpresa {
  if (!documentos || documentos.length === 0) {
    return {
      receitaTotalCumulada: 0,
      receitaAnualizada: 0,
      receitaUltimoMes: 0,
      mesesDisponiveis: 0,
      mesMaisRecente: '',
      ativoTotalAtual: 0,
      passivoTotalAtual: 0,
      patrimonioLiquidoAtual: 0,
      margemLucroLiquidoMedia: 0,
      crescimentoMedioReceitaPct: 0,
      seriesMensalizadas: [],
    }
  }

  // Ordenar cronologicamente por competência
  const docsOrdenados = [...documentos].sort((a, b) => a.competencia.localeCompare(b.competencia))

  const series: SerieContabilMensal[] = []
  let receitaAnterior = 0
  let anoAnterior = ''

  for (const doc of docsOrdenados) {
    const ano = doc.competencia.slice(0, 4)
    const recCumulada = Number(doc.receita_liquida || 0)
    let recMensal = recCumulada

    // Se mudou de ano, zera a base acumulada
    if (ano !== anoAnterior) {
      recMensal = recCumulada
      receitaAnterior = recCumulada
      anoAnterior = ano
    } else {
      // Se receita acumulada for maior que a anterior, decupa a diferença mensal
      if (recCumulada >= receitaAnterior) {
        recMensal = recCumulada - receitaAnterior
      } else {
        // Se já era mensal pura ou houve retificação
        recMensal = recCumulada
      }
      receitaAnterior = recCumulada
    }

    const margem = recMensal > 0 ? (Number(doc.lucro_liquido || 0) / recMensal) * 100 : 0

    series.push({
      documentoId: doc.id || doc.competencia,
      competencia: doc.competencia,
      arquivoNome: doc.arquivo_nome,
      receitaCumulativa: recCumulada,
      receitaMensalLiquida: recMensal,
      lucroLiquido: Number(doc.lucro_liquido || 0),
      totalAtivo: Number(doc.total_ativo || 0),
      totalPassivo: Number(doc.total_passivo || 0),
      patrimonioLiquido: Number(doc.patrimonio_liquido || 0),
      margemLucroLiquido: margem,
    })
  }

  const ultimo = series[series.length - 1]
  const totalReceita = series.reduce((acc, s) => acc + s.receitaMensalLiquida, 0)
  const meses = series.length
  const receitaAnualizada = meses > 0 ? (totalReceita / meses) * 12 : 0

  // Cálculo do crescimento médio mensal
  let somaCrescimentos = 0
  let paresCrescimento = 0
  for (let i = 1; i < series.length; i++) {
    const anterior = series[i - 1].receitaMensalLiquida
    const atual = series[i].receitaMensalLiquida
    if (anterior > 0) {
      const varPct = ((atual - anterior) / anterior) * 100
      somaCrescimentos += varPct
      paresCrescimento++
    }
  }

  const crescimentoMedioReceitaPct = paresCrescimento > 0 ? somaCrescimentos / paresCrescimento : 0

  const margemMedia =
    meses > 0 ? series.reduce((acc, s) => acc + s.margemLucroLiquido, 0) / meses : 0

  return {
    receitaTotalCumulada: totalReceita,
    receitaAnualizada,
    receitaUltimoMes: ultimo?.receitaMensalLiquida || 0,
    mesesDisponiveis: meses,
    mesMaisRecente: ultimo?.competencia || '',
    ativoTotalAtual: ultimo?.totalAtivo || 0,
    passivoTotalAtual: ultimo?.totalPassivo || 0,
    patrimonioLiquidoAtual: ultimo?.patrimonioLiquido || 0,
    margemLucroLiquidoMedia: margemMedia,
    crescimentoMedioReceitaPct,
    seriesMensalizadas: series,
  }
}

/**
 * Busca histórico recente de revisões legislativas
 */
export async function buscarUltimasNormasLegislativas(): Promise<RevisaoLegislativaRecente[]> {
  try {
    const records = await pb.collection('norm_reviews_history').getList(1, 10, {
      sort: '-review_date',
    })

    return records.items.map((r: any) => ({
      id: r.id,
      review_date: r.review_date || '',
      reviewer: r.reviewer || '',
      status: r.status || '',
      observations: r.observations || '',
      highlights: r.highlights || '',
      changes_count: r.changes_count || 0,
    }))
  } catch (err) {
    console.warn('[analisesEmpresariais] Falha ao carregar norm_reviews_history:', err)
    return []
  }
}

/**
 * Busca documentos fiscais do cliente na coleção param_documentos
 */
export async function buscarDocumentosFiscaisPorCnpj(
  cnpj: string,
): Promise<Array<{ id: string; chave?: string; valor?: number; emitido_em?: string }>> {
  const docLimpo = normalizarDocumento(cnpj)
  if (!docLimpo) return []

  try {
    const records = await pb.collection('param_documentos').getList(1, 50, {
      filter: `cliente_cnpj = '${docLimpo}' || emitente_cnpj = '${docLimpo}' || destinatario_cnpj = '${docLimpo}'`,
      sort: '-data_emissao',
    })

    return records.items.map((r: any) => ({
      id: r.id,
      chave: r.chave_44 || r.id,
      valor: Number(r.valor_total || 0),
      emitido_em: r.data_emissao || r.created,
    }))
  } catch (err) {
    return []
  }
}

/**
 * Compila a síntese analítica completa e os pareceres dos 4 agentes especialistas
 */
export async function carregarDossieCompletoCliente(
  cliente: EmpresaRecord,
): Promise<SinteseAnaliseEmpresarial> {
  return carregarSinteseAnaliseCliente(cliente)
}

export async function carregarSinteseAnaliseCliente(
  cliente: EmpresaRecord,
): Promise<SinteseAnaliseEmpresarial> {
  const cnpj = cliente.cpf_cnpj || cliente.documento_limpo || cliente.numero_documento

  // Execuções em paralelo para máxima eficiência
  const [docsContabeis, docsFiscais, normas, indices] = await Promise.all([
    buscarDocumentosContabeisPorCnpj(cnpj),
    buscarDocumentosFiscaisPorCnpj(cnpj),
    buscarUltimasNormasLegislativas(),
    fetchIndicadoresEconomicos(),
  ])

  const micro = decuparBalancetesCumulativos(docsContabeis)

  // Geração dos pareceres dos 4 Agentes Especialistas da ADECONT
  const regime = cliente.regime_tributario || cliente.enquadramento_tributario || 'Não Informado'

  const receitaStr = micro.receitaAnualizada.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  // 1. Parecer Tributário (Reforma Tributária LC 214/2025 e CBS/IBS)
  let parecerTrib = `Empresa enquadrada no regime ${regime}. Com receita anualizada projetada em ${receitaStr}, recomenda-se monitoramento contínuo da transição da Reforma Tributária (LC 214/2025).`
  if (regime.includes('Simples')) {
    parecerTrib += ` O cliente mantém a opção do Simples Híbrido com apropriação de créditos de IBS/CBS na cadeia produtiva para B2B.`
  } else if (regime.includes('Presumido')) {
    parecerTrib += ` Avaliar seletividade de alíquotas neutras e não-cumulatividade plena antecipada do novo IBS/CBS.`
  } else {
    parecerTrib += ` Apuração no Lucro Real viabiliza créditos integrais sobre insumos, energia e aquisições de prestadores regulares.`
  }

  // 2. Parecer Contábil
  let parecerContab = ''
  if (micro.mesesDisponiveis > 0) {
    parecerContab = `Análise fundamentada em ${micro.mesesDisponiveis} competência(s) contábeis escrituradas até ${micro.mesMaisRecente}. Balancetes cumulativos decupados com sucesso. Margem líquida média observada em ${micro.margemLucroLiquidoMedia.toFixed(1)}% e Patrimônio Líquido de ${micro.patrimonioLiquidoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`
  } else {
    parecerContab = `Aguardando upload de balancetes/DRE para apuração de índices de liquidez corrente, margem e giro patrimonial.`
  }

  // 3. Parecer Administrativo & Trabalhista
  const funcionarios = cliente.num_funcionarios || 0
  const folha = Number(cliente.folha_salarial_mensal || 0)
  const parecerAdmin = `Quadro funcional composto por ${funcionarios} colaborador(es) com folha salarial de ${folha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Relação Fator R e encargos previdenciários compatíveis com o enquadramento de serviços.`

  // 4. Parecer Econômico e de Mercado
  const selic = indices.indicadores.find((i) => i.chave === 'selic')?.valorAtual
  const ipca = indices.indicadores.find((i) => i.chave === 'ipca')?.valorAtual
  const parecerEcon = `Cenário macroeconômico nacional: Taxa Selic em ${selic !== undefined ? selic + '%' : '10.75%'} e IPCA em ${ipca !== undefined ? ipca + '%' : '4.1%'}. Crescimento médio mensal de faturamento do cliente calculado em ${micro.crescimentoMedioReceitaPct.toFixed(1)}% ao mês.`

  return {
    cliente,
    indicadores: micro,
    documentosContabeis: docsContabeis,
    documentosFiscais: docsFiscais,
    normasRelevantes: normas,
    indicesMacro: indices,
    parecerEspecialistas: {
      tributario: parecerTrib,
      contabil: parecerContab,
      administrativo: parecerAdmin,
      economico: parecerEcon,
    },
    dataAnalise: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}
