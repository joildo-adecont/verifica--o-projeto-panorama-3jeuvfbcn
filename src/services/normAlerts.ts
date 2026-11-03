import pb from '@/lib/pocketbase/client'
import type {
  NormAlertItem,
  NormReviewHistoryItem,
  ConfidenceTier,
  ReviewType,
  NormSegment,
  NormRecordOrigin,
} from '@/types/panorama'

const LOCAL_STORAGE_READ_ALERTS_KEY = 'adecont_panorama_norm_alerts_read_ids_v1'

/**
 * Obtém a lista de IDs de alertas lidos guardados localmente
 */
export function getReadAlertIdsFromStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_READ_ALERTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Salva a lista de IDs de alertas lidos guardados localmente
 */
export function saveReadAlertIdsToStorage(ids: string[]): void {
  if (typeof window === 'undefined') return
  try {
    const unicos = Array.from(new Set(ids))
    localStorage.setItem(LOCAL_STORAGE_READ_ALERTS_KEY, JSON.stringify(unicos))
  } catch (err) {
    console.warn('Erro ao salvar alertas lidos no localStorage:', err)
  }
}

/**
 * Fallback estático e robusto caso o backend PocketBase esteja inacessível
 */
export const FALLBACK_NORM_ALERTS: NormAlertItem[] = [
  {
    id: 'alert-cgibs-6-2026',
    review_id: 'rev-cgibs-6-2026-v2',
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
    record_origin: 'rotina_semanal',
    is_read: false,
    link_url: 'https://www.cgibs.gov.br/',
    created: '2026-10-28T12:00:00Z',
  },
  {
    id: 'alert-dec-13140-2026',
    review_id: 'rev-dec-13140-2026',
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
    record_origin: 'backfill_inicial',
    is_read: false,
    link_url: 'https://www.in.gov.br',
    created: '2026-10-21T10:00:00Z',
  },
  {
    id: 'alert-lc-238-2026',
    review_id: 'rev-lc-238-2026',
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
    record_origin: 'backfill_inicial',
    is_read: false,
    link_url: 'https://normas.leg.br',
    created: '2026-10-21T09:30:00Z',
  },
  {
    id: 'alert-revog-lc123-2026',
    review_id: 'rev-revog-lc123-2026',
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
    record_origin: 'rotina_semanal',
    is_read: false,
    link_url: 'https://normas.leg.br',
    created: '2026-10-21T08:00:00Z',
  },
  {
    id: 'alert-atc-rfb-cgibs-9-2026',
    review_id: 'rev-atc-rfb-cgibs-9-2026',
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
    record_origin: 'backfill_inicial',
    is_read: false,
    link_url: 'https://www.in.gov.br',
    created: '2026-10-20T14:00:00Z',
  },
  {
    id: 'alert-dec-13133-2026',
    review_id: 'rev-dec-13133-2026',
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
    record_origin: 'backfill_inicial',
    is_read: false,
    link_url: 'https://www.in.gov.br',
    created: '2026-10-09T16:00:00Z',
  },
]

/**
 * Ordena alertas cronologicamente com o mais recente no topo
 */
export function ordenarAlertasCronologicamente(itens: NormAlertItem[]): NormAlertItem[] {
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
 * Normaliza registro vindo do PocketBase
 */
function normalizarAlertaPocketBase(
  rec: Record<string, unknown>,
  readIds: Set<string>,
): NormAlertItem {
  const id = String(rec.id || '')
  const dbRead = Boolean(rec.is_read)
  const isRead = dbRead || readIds.has(id)

  return {
    id,
    review_id: rec.review_id ? String(rec.review_id) : undefined,
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
    origin_record_id: rec.origin_record_id ? String(rec.origin_record_id) : undefined,
    record_origin: (rec.record_origin as NormRecordOrigin) || 'rotina_semanal',
    is_read: isRead,
    link_url: rec.link_url ? String(rec.link_url) : undefined,
    created: rec.created ? String(rec.created) : undefined,
    updated: rec.updated ? String(rec.updated) : undefined,
  }
}

/**
 * Lista todos os alertas da coleção norm_alerts
 */
export async function listarAlertasRevisoes(): Promise<NormAlertItem[]> {
  const readIds = new Set(getReadAlertIdsFromStorage())
  try {
    const records = await pb.collection('norm_alerts').getFullList({
      sort: '-review_date,-created',
      requestKey: null,
    })

    if (!records || records.length === 0) {
      const comStatus = FALLBACK_NORM_ALERTS.map((a) => ({
        ...a,
        is_read: a.is_read || readIds.has(a.id),
      }))
      return ordenarAlertasCronologicamente(comStatus)
    }

    const mapeados = records.map((r) =>
      normalizarAlertaPocketBase(r as unknown as Record<string, unknown>, readIds),
    )
    return ordenarAlertasCronologicamente(mapeados)
  } catch (err) {
    console.warn(
      'listarAlertasRevisoes: usando fallback de alertas por indisponibilidade momentânea',
      err,
    )
    const comStatus = FALLBACK_NORM_ALERTS.map((a) => ({
      ...a,
      is_read: a.is_read || readIds.has(a.id),
    }))
    return ordenarAlertasCronologicamente(comStatus)
  }
}

/**
 * Cria um alerta correspondente a uma revisão criada manualmente
 */
export async function criarAlertaParaRevisao(
  revisao: NormReviewHistoryItem,
): Promise<NormAlertItem> {
  const payload = {
    review_id: revisao.id,
    norm_code: revisao.norm_code,
    norm_type: revisao.norm_type,
    norm_number: revisao.norm_number || '',
    norm_year: revisao.norm_year || '2026',
    norm_title: revisao.norm_title || revisao.norm_code,
    source_org: revisao.source_org,
    confidence_tier: revisao.confidence_tier,
    review_type: revisao.review_type,
    segment: revisao.segment,
    review_date: revisao.review_date || new Date().toISOString().slice(0, 10),
    summary_change: revisao.summary_change,
    origin_record_id: revisao.origin_record_id || '',
    record_origin: revisao.record_origin || 'manual',
    is_read: false,
    link_url: revisao.link_url || '',
  }

  try {
    const created = await pb.collection('norm_alerts').create(payload)
    return normalizarAlertaPocketBase(created as unknown as Record<string, unknown>, new Set())
  } catch (err) {
    console.warn('criarAlertaParaRevisao: gerando alerta em memória local', err)
    return {
      id: `alert-local-${Date.now()}`,
      ...payload,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }
}

/**
 * Marca um alerta como lido (no PocketBase e no localStorage)
 */
export async function marcarAlertaComoLido(alertaId: string): Promise<void> {
  const readIds = getReadAlertIdsFromStorage()
  if (!readIds.includes(alertaId)) {
    readIds.push(alertaId)
    saveReadAlertIdsToStorage(readIds)
  }

  // Tenta sincronizar com o PocketBase silenciosamente
  try {
    if (!alertaId.startsWith('alert-local-') && !alertaId.startsWith('alert-cgibs-')) {
      await pb.collection('norm_alerts').update(alertaId, { is_read: true })
    }
  } catch (err) {
    console.warn('marcarAlertaComoLido: salvo localmente, falha ao sincronizar com PB:', err)
  }
}

/**
 * Marca todos os alertas como lidos
 */
export async function marcarTodosAlertasComoLidos(alertas: NormAlertItem[]): Promise<void> {
  const todosIds = alertas.map((a) => a.id)
  const existentes = getReadAlertIdsFromStorage()
  const unificados = Array.from(new Set([...existentes, ...todosIds]))
  saveReadAlertIdsToStorage(unificados)

  // Dispara updates no backend para os que puderem em lote/paralelo limitado
  const paraAtualizar = alertas.filter(
    (a) => !a.is_read && !a.id.startsWith('alert-local-') && !a.id.startsWith('alert-cgibs-'),
  )

  await Promise.allSettled(
    paraAtualizar.map((item) =>
      pb
        .collection('norm_alerts')
        .update(item.id, { is_read: true })
        .catch(() => {}),
    ),
  )
}
