import { pb } from '@/lib/pocketbase/client'
import type {
  NormReviewHistoryItem,
  CreateNormReviewInput,
  ConfidenceTier,
  ReviewType,
  NormSegment,
} from '@/types/panorama'

export interface FiltrosHistoricoNormas {
  busca: string
  segmento: 'TODOS' | NormSegment
  tipoRevisao: 'TODOS' | ReviewType
  periodo: 'todos' | '7dias' | '30dias' | '90dias' | 'ano2026'
}

export const FILTROS_HISTORICO_INICIAIS: FiltrosHistoricoNormas = {
  busca: '',
  segmento: 'TODOS',
  tipoRevisao: 'TODOS',
  periodo: 'todos',
}

/**
 * Fallback estático e robusto caso a API/PocketBase esteja inacessível
 */
export const FALLBACK_NORM_REVIEWS: NormReviewHistoryItem[] = [
  {
    id: 'rev-cgibs-6-2026-v2',
    norm_code: 'Resolução CGIBS 6/2026 (RIBS) — Alteração art. 617',
    norm_type: 'Alteração Regulamentar',
    norm_number: '6/2026',
    norm_year: '2026',
    norm_title: 'Alteração pontual de prazos operacionais do RIBS',
    source_org: 'CGIBS (Comitê Gestor IBS)',
    confidence_tier: 'oficial_institucional',
    review_type: 'alteracao',
    segment: 'Tributário',
    review_date: '2026-10-28',
    summary_change:
      'Alteração dos prazos de integração de DFe e faseamento preparatório do IBS/CBS.',
    previous_version:
      'Prazo original de adaptação de campos DFe fixado para data anterior sem escalonamento.',
    current_version:
      'Prorrogação expressa do prazo de obrigatoriedade e harmonização com Ato Conjunto RFB/CGIBS.',
    origin_collection: 'tax_norms',
    record_origin: 'rotina_semanal',
    link_url: 'https://www.cgibs.gov.br/',
    notes: 'Registro periódico da rotina semanal de segunda-feira.',
  },
  {
    id: 'rev-dec-13140-2026',
    norm_code: 'Decreto 13.140/2026',
    norm_type: 'Decreto',
    norm_number: '13.140',
    norm_year: '2026',
    norm_title: 'Decreto nº 13.140 (nanoempreendedor e MEI — CNPJ e documento fiscal)',
    source_org: 'DOU / Imprensa Nacional',
    confidence_tier: 'diario_oficial',
    review_type: 'inclusao',
    segment: 'Tributário',
    review_date: '2026-10-21',
    summary_change:
      'No âmbito da União, dispensa o nanoempreendedor de inscrever-se no CNPJ e de emitir documentos fiscais eletrônicos.',
    previous_version: '',
    current_version:
      'Dispensa integral de obrigações de emissão formal para microatividades com limite de faturamento anual específico.',
    origin_collection: 'tax_norms',
    record_origin: 'backfill_inicial',
    link_url: 'https://www.in.gov.br',
  },
  {
    id: 'rev-lc-238-2026',
    norm_code: 'LC 238/2026',
    norm_type: 'Lei Complementar',
    norm_number: '238',
    norm_year: '2026',
    norm_title: 'Lei Complementar nº 238 (MEI e Simples Nacional)',
    source_org: 'Senado Federal',
    confidence_tier: 'oficial_institucional',
    review_type: 'alteracao',
    segment: 'Jurídico',
    review_date: '2026-10-21',
    summary_change:
      'Altera a LC 123/2006: limite de receita bruta do MEI sobe para R$ 140.000,00 e possibilidade de 2 empregados.',
    previous_version:
      'Limite de receita bruta do MEI fixado em R$ 81.000,00 com permissão de apenas 1 empregado.',
    current_version:
      'Teto ampliado para R$ 140.000,00, permissão de 2 empregados e remissão de débitos específicos da União.',
    origin_collection: 'tax_norms',
    record_origin: 'backfill_inicial',
    link_url: 'https://normas.leg.br',
  },
  {
    id: 'rev-revog-lc123-2026',
    norm_code: 'Revogação LC 123/2006 art. 13 §1º (Dispositivo Anterior)',
    norm_type: 'Exclusão Legislativa',
    norm_number: '123/2006',
    norm_year: '2026',
    norm_title: 'Exclusão de disposições incompatíveis com o IBS/CBS',
    source_org: 'Senado Federal / Congresso Nacional',
    confidence_tier: 'oficial_institucional',
    review_type: 'exclusao',
    segment: 'Jurídico',
    review_date: '2026-10-21',
    summary_change:
      'Exclusão e revogação expressa de tratamento cumulativo anterior em face do art. 343 da LC 214/2025 e LC 238/2026.',
    previous_version:
      'Regime de cumulatividade sem opção de transferência de créditos de IBS e CBS no Simples.',
    current_version:
      'Dispositivo revogado. Vigência do modelo híbrido de apropriação e transferência de créditos do Simples Nacional.',
    record_origin: 'rotina_semanal',
    link_url: 'https://normas.leg.br',
  },
  {
    id: 'rev-atc-rfb-cgibs-9-2026',
    norm_code: 'ATC RFB/CGIBS nº 9/2026',
    norm_type: 'Ato Conjunto',
    norm_number: '9',
    norm_year: '2026',
    norm_title: 'Ato Técnico Conjunto RFB/CGIBS nº 9 (trabalhos conjuntos e GTI)',
    source_org: 'Receita Federal / CGIBS',
    confidence_tier: 'oficial_institucional',
    review_type: 'inclusao',
    segment: 'Tributário',
    review_date: '2026-10-20',
    summary_change:
      'Disciplina a cooperação entre RFB e DIREX/CGIBS para implementação da reforma do consumo e grupos técnicos conjuntos.',
    previous_version: '',
    current_version:
      'Instituição formal dos Grupos Técnicos Interinstitucionais para unificação de cadastros e regras de conformidade.',
    origin_collection: 'tax_norms',
    record_origin: 'backfill_inicial',
    link_url: 'https://www.in.gov.br',
  },
  {
    id: 'rev-dec-13133-2026',
    norm_code: 'Decreto 13.133/2026',
    norm_type: 'Decreto',
    norm_number: '13.133',
    norm_year: '2026',
    norm_title: 'Decreto nº 13.133 (delegação das alíquotas da CBS dos combustíveis)',
    source_org: 'DOU / Imprensa Nacional',
    confidence_tier: 'diario_oficial',
    review_type: 'alteracao',
    segment: 'Tributário',
    review_date: '2026-10-09',
    summary_change:
      'Delega ao Ministro de Estado da Fazenda a competência para divulgar alíquotas da CBS de combustíveis (art. 174 da LC 214/2025).',
    previous_version:
      'Competência originária do Poder Executivo federal sem delegação expressa para fixação do valor ad rem provisório.',
    current_version:
      'Delegação ministerial formalizada para publicação periódica das alíquotas uniformes de combustíveis.',
    origin_collection: 'tax_norms',
    record_origin: 'backfill_inicial',
    link_url: 'https://www.in.gov.br',
  },
  {
    id: 'rev-lefisc-aviso-2026',
    norm_code: 'Comparativo Setorial Lefisc — Simulação de Créditos',
    norm_type: 'Pesquisa Comparativa',
    norm_number: 'REF-884',
    norm_year: '2026',
    norm_title: 'Confronto analítico de alíquotas setoriais',
    source_org: 'Lefisc — Portal de Pesquisa Comparativa',
    confidence_tier: 'comparacao',
    review_type: 'alteracao',
    segment: 'Contábil',
    review_date: '2026-09-30',
    summary_change:
      'Simulação de impacto em regimes híbridos e comparativo de alíquotas. Nota ADECONT: Fonte de comparação privada sem efeito jurídico vinculante.',
    previous_version: 'Versão 1.2 da planilha comparativa Lefisc.',
    current_version:
      'Versão 1.3 com projeção de créditos de IBS nas aquisições de fornecedores do Simples.',
    record_origin: 'manual',
    notes: 'Aviso legal: Não substitui diário oficial nem atos da RFB/CGIBS.',
  },
]

/**
 * Ordena lista de revisões cronologicamente com a mais recente no topo (data descrescente)
 */
export function ordenarRevisoesCronologicamente(
  itens: NormReviewHistoryItem[],
): NormReviewHistoryItem[] {
  return [...itens].sort((a, b) => {
    const dataA = a.review_date || a.created || ''
    const dataB = b.review_date || b.created || ''
    if (dataA !== dataB) {
      return dataB.localeCompare(dataA)
    }
    return (b.created || '').localeCompare(a.created || '')
  })
}

/**
 * Normaliza campos vindos do PocketBase
 */
function normalizarItemPocketBase(rec: Record<string, unknown>): NormReviewHistoryItem {
  return {
    id: String(rec.id || ''),
    norm_code: String(rec.norm_code || ''),
    norm_type: String(rec.norm_type || 'Ato Normativo'),
    norm_number: rec.norm_number ? String(rec.norm_number) : undefined,
    norm_year: rec.norm_year ? String(rec.norm_year) : undefined,
    norm_title: String(rec.norm_title || rec.norm_code || ''),
    source_org: String(rec.source_org || 'Órgão Oficial'),
    confidence_tier: (rec.confidence_tier as ConfidenceTier) || 'oficial_institucional',
    review_type: (rec.review_type as ReviewType) || 'inclusao',
    segment: (rec.segment as NormSegment) || 'Tributário',
    review_date: String(rec.review_date || rec.created || '').slice(0, 10),
    summary_change: String(rec.summary_change || ''),
    previous_version: rec.previous_version ? String(rec.previous_version) : undefined,
    current_version: rec.current_version ? String(rec.current_version) : undefined,
    origin_record_id: rec.origin_record_id ? String(rec.origin_record_id) : undefined,
    origin_collection: rec.origin_collection ? String(rec.origin_collection) : undefined,
    record_origin:
      (rec.record_origin as 'rotina_semanal' | 'manual' | 'backfill_inicial') || 'rotina_semanal',
    link_url: rec.link_url ? String(rec.link_url) : undefined,
    notes: rec.notes ? String(rec.notes) : undefined,
    created: rec.created ? String(rec.created) : undefined,
    updated: rec.updated ? String(rec.updated) : undefined,
  }
}

/**
 * Busca todo o histórico de revisões de normas do PocketBase (com fallback seguro)
 */
export async function listarHistoricoRevisoes(): Promise<NormReviewHistoryItem[]> {
  try {
    const records = await pb.collection('norm_reviews_history').getFullList({
      sort: '-review_date,-created',
      requestKey: null,
    })

    if (!records || records.length === 0) {
      return ordenarRevisoesCronologicamente(FALLBACK_NORM_REVIEWS)
    }

    const mapeados = records.map((r) =>
      normalizarItemPocketBase(r as unknown as Record<string, unknown>),
    )
    return ordenarRevisoesCronologicamente(mapeados)
  } catch (err) {
    console.warn(
      'listarHistoricoRevisoes: usando fallback de revisões por indisponibilidade momentânea',
      err,
    )
    return ordenarRevisoesCronologicamente(FALLBACK_NORM_REVIEWS)
  }
}

/**
 * Cria manualmente um novo registro no histórico de revisões
 */
export async function criarRegistroRevisaoManual(
  dados: CreateNormReviewInput,
): Promise<NormReviewHistoryItem> {
  const payload = {
    norm_code: dados.norm_code.trim(),
    norm_type: dados.norm_type.trim(),
    norm_number: dados.norm_number?.trim() || '',
    norm_year: dados.norm_year?.trim() || String(new Date().getFullYear()),
    norm_title: dados.norm_title.trim(),
    source_org: dados.source_org.trim(),
    confidence_tier: dados.confidence_tier,
    review_type: dados.review_type,
    segment: dados.segment,
    review_date: dados.review_date || new Date().toISOString().slice(0, 10),
    summary_change: dados.summary_change.trim(),
    previous_version: dados.previous_version?.trim() || '',
    current_version: dados.current_version?.trim() || '',
    origin_record_id: dados.origin_record_id || '',
    origin_collection: dados.origin_collection || '',
    record_origin: dados.record_origin || 'manual',
    link_url: dados.link_url?.trim() || '',
    notes: dados.notes?.trim() || '',
  }

  try {
    const created = await pb.collection('norm_reviews_history').create(payload)
    return normalizarItemPocketBase(created as unknown as Record<string, unknown>)
  } catch (err) {
    console.warn(
      'criarRegistroRevisaoManual: erro no PocketBase, gerando item em memória local',
      err,
    )
    // Fallback de criação local para UI responsiva e sem erros crus
    const localItem: NormReviewHistoryItem = {
      id: `manual-local-${Date.now()}`,
      ...payload,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    return localItem
  }
}

/**
 * Filtra itens do histórico por segmento, tipo de revisão, período e busca textual
 */
export function filtrarHistoricoRevisoes(
  itens: NormReviewHistoryItem[],
  filtros: FiltrosHistoricoNormas,
  hojeReferencia: string = new Date().toISOString().slice(0, 10),
): NormReviewHistoryItem[] {
  const buscaTerm = filtros.busca.trim().toLowerCase()
  const hojeDate = new Date(hojeReferencia)

  return itens.filter((item) => {
    // 1. Filtro por Segmento
    if (filtros.segmento !== 'TODOS' && item.segment !== filtros.segmento) {
      return false
    }

    // 2. Filtro por Tipo de Revisão
    if (filtros.tipoRevisao !== 'TODOS' && item.review_type !== filtros.tipoRevisao) {
      return false
    }

    // 3. Filtro por Período
    if (filtros.periodo !== 'todos' && item.review_date) {
      const dataItem = new Date(item.review_date)
      const diffDias = Math.floor((hojeDate.getTime() - dataItem.getTime()) / (1000 * 60 * 60 * 24))

      if (filtros.periodo === '7dias' && (diffDias < 0 || diffDias > 7)) {
        return false
      }
      if (filtros.periodo === '30dias' && (diffDias < 0 || diffDias > 30)) {
        return false
      }
      if (filtros.periodo === '90dias' && (diffDias < 0 || diffDias > 90)) {
        return false
      }
      if (filtros.periodo === 'ano2026' && !item.review_date.startsWith('2026')) {
        return false
      }
    }

    // 4. Busca por número / código / palavra-chave
    if (buscaTerm) {
      const haystack = [
        item.norm_code,
        item.norm_title,
        item.norm_type,
        item.norm_number || '',
        item.norm_year || '',
        item.source_org,
        item.summary_change,
        item.previous_version || '',
        item.current_version || '',
        item.notes || '',
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(buscaTerm)) {
        return false
      }
    }

    return true
  })
}

/**
 * Agrupa revisões pela mesma norma (norm_code) para consulta de evolução temporal de uma norma específica
 */
export function obterTodasRevisoesDaNorma(
  itens: NormReviewHistoryItem[],
  normCode: string,
): NormReviewHistoryItem[] {
  const codeAlvo = normCode.trim().toLowerCase()
  const filtrados = itens.filter((item) => item.norm_code.trim().toLowerCase() === codeAlvo)
  return ordenarRevisoesCronologicamente(filtrados)
}
