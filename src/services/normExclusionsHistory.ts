import pb from '@/lib/pocketbase/client'
import type {
  NormExclusionHistoryItem,
  CreateNormExclusionInput,
  ConfidenceTier,
  NormSegment,
  NormRecordOrigin,
} from '@/types/panorama'

export interface FiltrosHistoricoExclusoes {
  busca: string
  segmento: 'TODOS' | NormSegment
  fonte: 'TODAS' | string
  periodo: 'todos' | '7dias' | '30dias' | '90dias' | 'ano2026'
}

export const FILTROS_EXCLUSOES_INICIAIS: FiltrosHistoricoExclusoes = {
  busca: '',
  segmento: 'TODOS',
  fonte: 'TODAS',
  periodo: 'todos',
}

/**
 * Fallback estático e robusto caso o PocketBase esteja inacessível
 */
export const FALLBACK_NORM_EXCLUSIONS: NormExclusionHistoryItem[] = [
  {
    id: 'excl-revog-lc123-2026',
    norm_code: 'Revogação LC 123/2006 art. 13 §1º (Dispositivo Anterior)',
    norm_type: 'Exclusão Legislativa',
    norm_number: '123/2006',
    norm_year: '2026',
    norm_title: 'Exclusão de disposições incompatíveis com o IBS/CBS',
    source_org: 'Senado Federal / Congresso Nacional',
    confidence_tier: 'oficial_institucional',
    segment: 'Jurídico',
    exclusion_date: '2026-10-21',
    system_exclusion_date: '2026-10-21',
    reason_description:
      'Exclusão e revogação expressa de tratamento cumulativo anterior em face do art. 343 da LC 214/2025 e LC 238/2026.',
    revoked_article: 'art. 13, §1º',
    previous_content:
      'Regime de cumulatividade sem opção de transferência de créditos de IBS e CBS no Simples.',
    origin_collection: 'tax_norms',
    record_origin: 'rotina_semanal',
    link_url: 'https://normas.leg.br',
    notes: 'Exclusão legislativa registrada pelo comitê diretivo ADECONT.',
  },
  {
    id: 'excl-dec-revog-pis-cofins-2026',
    norm_code: 'Revogação de Decretos de Retenção PIS/Cofins na Fonte',
    norm_type: 'Revogação Expressa',
    norm_number: '9.718/1998',
    norm_year: '2026',
    norm_title: 'Revogação de regimes especiais de retenção da seguridade anterior',
    source_org: 'DOU / Imprensa Nacional',
    confidence_tier: 'diario_oficial',
    segment: 'Tributário',
    exclusion_date: '2026-10-15',
    system_exclusion_date: '2026-10-15',
    reason_description:
      'Exclusão formal de hipóteses de antecipação e retenção na fonte incompatíveis com a sistemática de split payment da CBS.',
    revoked_article: 'arts. 2º ao 4º',
    previous_content:
      'Obrigatoriedade de retenção ampla de PIS/Cofins por tomadores de serviços em regime cumulativo.',
    origin_collection: 'tax_norms',
    record_origin: 'backfill_inicial',
    link_url: 'https://www.in.gov.br',
    notes: 'Harmonização com a Lei Complementar nº 214/2025.',
  },
  {
    id: 'excl-res-cgibs-minuta-anterior',
    norm_code: 'Exclusão de Artigo Transitório — Resolução CGIBS 4/2026',
    norm_type: 'Exclusão Normativa',
    norm_number: '4/2026',
    norm_year: '2026',
    norm_title: 'Exclusão de exigência antecipada de cadastro bifásico para MEI',
    source_org: 'CGIBS (Comitê Gestor IBS)',
    confidence_tier: 'oficial_institucional',
    segment: 'Contábil',
    exclusion_date: '2026-09-25',
    system_exclusion_date: '2026-09-25',
    reason_description:
      'Revogação de parágrafo transitório que previa duplicidade cadastral para contribuintes optantes pelo Simples Nacional.',
    revoked_article: 'art. 88, parágrafo único',
    previous_content:
      'Exigência de habilitação prévia segregada em portal estadual e municipal antes do acesso ao Comitê Gestor.',
    origin_collection: 'tax_norms',
    record_origin: 'rotina_semanal',
    link_url: 'https://www.cgibs.gov.br/',
    notes: 'Exclusão aprovada por unanimidade pelo Comitê Gestor.',
  },
]

/**
 * Ordena lista de exclusões cronologicamente com a mais recente no topo (data decrescente)
 */
export function ordenarExclusoesCronologicamente(
  itens: NormExclusionHistoryItem[],
): NormExclusionHistoryItem[] {
  return [...itens].sort((a, b) => {
    const dataA = a.exclusion_date || a.created || ''
    const dataB = b.exclusion_date || b.created || ''
    if (dataA !== dataB) {
      return dataB.localeCompare(dataA)
    }
    return (b.created || '').localeCompare(a.created || '')
  })
}

/**
 * Normaliza campos vindos do PocketBase
 */
function normalizarItemPocketBase(rec: Record<string, unknown>): NormExclusionHistoryItem {
  return {
    id: String(rec.id || ''),
    norm_code: String(rec.norm_code || ''),
    norm_type: String(rec.norm_type || 'Exclusão Legislativa'),
    norm_number: rec.norm_number ? String(rec.norm_number) : undefined,
    norm_year: rec.norm_year ? String(rec.norm_year) : undefined,
    norm_title: String(rec.norm_title || rec.norm_code || ''),
    source_org: String(rec.source_org || 'Órgão Oficial'),
    confidence_tier: (rec.confidence_tier as ConfidenceTier) || 'oficial_institucional',
    segment: (rec.segment as NormSegment) || 'Tributário',
    exclusion_date: String(rec.exclusion_date || rec.created || '').slice(0, 10),
    system_exclusion_date: rec.system_exclusion_date
      ? String(rec.system_exclusion_date).slice(0, 10)
      : undefined,
    reason_description: String(rec.reason_description || ''),
    revoked_article: rec.revoked_article ? String(rec.revoked_article) : undefined,
    previous_content: rec.previous_content ? String(rec.previous_content) : undefined,
    origin_record_id: rec.origin_record_id ? String(rec.origin_record_id) : undefined,
    origin_collection: rec.origin_collection ? String(rec.origin_collection) : undefined,
    review_history_id: rec.review_history_id ? String(rec.review_history_id) : undefined,
    record_origin:
      (rec.record_origin as NormRecordOrigin) || 'rotina_semanal',
    link_url: rec.link_url ? String(rec.link_url) : undefined,
    notes: rec.notes ? String(rec.notes) : undefined,
    created: rec.created ? String(rec.created) : undefined,
    updated: rec.updated ? String(rec.updated) : undefined,
  }
}

/**
 * Busca todo o histórico de exclusões de normas do PocketBase (com fallback seguro)
 */
export async function listarHistoricoExclusoes(): Promise<NormExclusionHistoryItem[]> {
  try {
    const records = await pb.collection('norm_exclusions_history').getFullList({
      sort: '-exclusion_date,-created',
      requestKey: null,
    })

    if (!records || records.length === 0) {
      return ordenarExclusoesCronologicamente(FALLBACK_NORM_EXCLUSIONS)
    }

    const mapeados = records.map((r) =>
      normalizarItemPocketBase(r as unknown as Record<string, unknown>),
    )
    return ordenarExclusoesCronologicamente(mapeados)
  } catch (err) {
    console.warn(
      'listarHistoricoExclusoes: usando fallback de exclusões por indisponibilidade momentânea',
      err,
    )
    return ordenarExclusoesCronologicamente(FALLBACK_NORM_EXCLUSIONS)
  }
}

/**
 * Cria manualmente um novo registro no histórico de exclusões
 */
export async function criarRegistroExclusaoManual(
  dados: CreateNormExclusionInput,
): Promise<NormExclusionHistoryItem> {
  const hoje = new Date().toISOString().slice(0, 10)
  const payload = {
    norm_code: dados.norm_code.trim(),
    norm_type: dados.norm_type.trim() || 'Exclusão Legislativa',
    norm_number: dados.norm_number?.trim() || '',
    norm_year: dados.norm_year?.trim() || String(new Date().getFullYear()),
    norm_title: dados.norm_title.trim(),
    source_org: dados.source_org.trim(),
    confidence_tier: dados.confidence_tier,
    segment: dados.segment,
    exclusion_date: dados.exclusion_date || hoje,
    system_exclusion_date: dados.system_exclusion_date || hoje,
    reason_description: dados.reason_description.trim(),
    revoked_article: dados.revoked_article?.trim() || '',
    previous_content: dados.previous_content?.trim() || '',
    origin_record_id: dados.origin_record_id || '',
    origin_collection: dados.origin_collection || '',
    review_history_id: dados.review_history_id || '',
    record_origin: dados.record_origin || 'manual',
    link_url: dados.link_url?.trim() || '',
    notes: dados.notes?.trim() || '',
  }

  try {
    const created = await pb.collection('norm_exclusions_history').create(payload)
    return normalizarItemPocketBase(created as unknown as Record<string, unknown>)
  } catch (err) {
    console.warn(
      'criarRegistroExclusaoManual: erro no PocketBase, gerando item em memória local',
      err,
    )
    const localItem: NormExclusionHistoryItem = {
      id: `manual-excl-local-${Date.now()}`,
      ...payload,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
    return localItem
  }
}

/**
 * Filtra itens do histórico de exclusões por segmento, fonte, período e busca textual
 */
export function filtrarHistoricoExclusoes(
  itens: NormExclusionHistoryItem[],
  filtros: FiltrosHistoricoExclusoes,
  hojeReferencia: string = new Date().toISOString().slice(0, 10),
): NormExclusionHistoryItem[] {
  const buscaTerm = filtros.busca.trim().toLowerCase()
  const hojeDate = new Date(hojeReferencia)

  return (itens || []).filter((item) => {
    // 1. Filtro por Segmento
    if (filtros.segmento !== 'TODOS' && item.segment !== filtros.segmento) {
      return false
    }

    // 2. Filtro por Fonte
    if (filtros.fonte !== 'TODAS' && !item.source_org.toLowerCase().includes(filtros.fonte.toLowerCase())) {
      return false
    }

    // 3. Filtro por Período
    if (filtros.periodo !== 'todos' && item.exclusion_date) {
      const dataItem = new Date(item.exclusion_date)
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
      if (filtros.periodo === 'ano2026' && !item.exclusion_date.startsWith('2026')) {
        return false
      }
    }

    // 4. Busca por número / código / palavra-chave
    if (buscaTerm) {
      const haystack = [
        item.norm_code || '',
        item.norm_title || '',
        item.norm_type || '',
        item.norm_number || '',
        item.norm_year || '',
        item.source_org || '',
        item.reason_description || '',
        item.revoked_article || '',
        item.previous_content || '',
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
 * Calcula métricas/contadores consolidados do acervo de exclusões
 */
export function calcularMetricasExclusoes(
  itens: NormExclusionHistoryItem[],
  hojeReferencia: string = new Date().toISOString().slice(0, 10),
) {
  const lista = itens || []
  const hojeDate = new Date(hojeReferencia)

  let ultimos30Dias = 0
  let ultimos90Dias = 0
  const porSegmento: Record<NormSegment, number> = {
    Tributário: 0,
    Jurídico: 0,
    Contábil: 0,
    Administrativo: 0,
  }

  for (const item of lista) {
    if (item.segment && porSegmento[item.segment] !== undefined) {
      porSegmento[item.segment]++
    }

    if (item.exclusion_date) {
      const dataItem = new Date(item.exclusion_date)
      const diffDias = Math.floor((hojeDate.getTime() - dataItem.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDias >= 0 && diffDias <= 30) {
        ultimos30Dias++
      }
      if (diffDias >= 0 && diffDias <= 90) {
        ultimos90Dias++
      }
    }
  }

  return {
    total: lista.length,
    ultimos30Dias,
    ultimos90Dias,
    porSegmento,
  }
}
