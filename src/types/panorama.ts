export type IncidenceStatus =
  | 'INCIDE'
  | 'NÃO INCIDE'
  | 'PARCIAL/REGIME ESPECÍFICO'
  | 'ISENTO/IMUNE'
  | 'Cria a incidência'
  | 'Regula a incidência'
  | 'Administração do IBS'
  | 'Regula a CBS'
  | 'Regula o IBS'
  | 'Operacional'
  | 'Obrig. acessórias'
  | 'ME/EPP'

export type NormType =
  | 'Emenda Constitucional'
  | 'Lei Complementar'
  | 'Decreto'
  | 'Resolução'
  | 'Portaria Conjunta'
  | 'Ato Conjunto'
  | 'Outro'

export interface TaxNormItem {
  id: string
  code: string
  date: string
  dou_date?: string
  title: string
  summary: string
  status_incidence: string
  norm_type?: string
  origin?: string
  order?: number
  link_url?: string
  created?: string
  updated?: string
}

export interface OfficialDocumentItem {
  id: string
  code: string
  date: string
  title: string
  summary: string
  norm_type: string
  origin: string
  url: string
  proxy_url?: string
  filename?: string
  badge?: string
  format?: 'pdf' | 'html'
}

// Mantido para compatibilidade onde DirectCgibsDocumentItem era importado
export type DirectCgibsDocumentItem = OfficialDocumentItem

export interface TaxTopicItem {
  id: string
  section: string
  title: string
  category?: string
  treatment?: string
  legal_basis?: string
  description: string
  order?: number
  created?: string
  updated?: string
}

export interface InquiryInput {
  name: string
  email: string
  phone: string
  message?: string
}

export interface InquiryItem extends InquiryInput {
  id: string
  created?: string
}

export type ConfidenceTier = 'diario_oficial' | 'oficial_institucional' | 'comparacao'

export interface SourceStatusItem {
  id: string
  source_key: string
  name: string
  url: string
  status: 'active' | 'offline' | 'warning'
  http_status?: number
  response_time_ms?: number
  last_checked_at?: string
  message?: string
  order?: number
  coverage_status?: string
  confidence_tier?: ConfidenceTier
  alternative_source?: string
  unblock_channel?: string
  created?: string
  updated?: string
}

export interface ContentReviewSourceItem {
  key: string
  name: string
  url?: string
  status: 'active' | 'offline' | 'warning'
  http_status?: number
  response_time_ms?: number
  message?: string
  coverage_status?: string
  confidence_tier?: ConfidenceTier
  alternative_source?: string
  unblock_channel?: string
}

export interface ContentReviewItem {
  id: string
  review_date: string
  status: 'ok' | 'warning' | 'attention'
  sources_checked?: ContentReviewSourceItem[]
  notes?: string
  summary?: string
  created?: string
  updated?: string
}

export type ReviewType = 'inclusao' | 'alteracao' | 'exclusao'
export type NormSegment = 'Tributário' | 'Jurídico' | 'Contábil' | 'Administrativo'
export type NormRecordOrigin = 'rotina_semanal' | 'manual' | 'backfill_inicial'

export interface NormReviewHistoryItem {
  id: string
  norm_code: string
  norm_type: string
  norm_number?: string
  norm_year?: string
  norm_title: string
  source_org: string
  confidence_tier: ConfidenceTier
  review_type: ReviewType
  segment: NormSegment
  review_date: string // YYYY-MM-DD ou ISO
  summary_change: string
  previous_version?: string
  current_version?: string
  origin_record_id?: string
  origin_collection?: string
  record_origin: NormRecordOrigin
  link_url?: string
  notes?: string
  created?: string
  updated?: string
}

export interface NormAlertItem {
  id: string
  review_id?: string
  norm_code: string
  norm_type: string
  norm_number?: string
  norm_year?: string
  norm_title: string
  source_org: string
  confidence_tier: ConfidenceTier
  review_type: ReviewType
  segment: NormSegment
  review_date: string
  summary_change: string
  origin_record_id?: string
  record_origin: NormRecordOrigin
  is_read: boolean
  link_url?: string
  created?: string
  updated?: string
}

export interface CreateNormReviewInput {
  norm_code: string
  norm_type: string
  norm_number?: string
  norm_year?: string
  norm_title: string
  source_org: string
  confidence_tier: ConfidenceTier
  review_type: ReviewType
  segment: NormSegment
  review_date: string
  summary_change: string
  previous_version?: string
  current_version?: string
  origin_record_id?: string
  origin_collection?: string
  record_origin?: NormRecordOrigin
  link_url?: string
  notes?: string
}

// Para manter retrocompatibilidade com partes antigas se necessário
export interface GalleryItem {
  id: string
  title: string
  category?: string
  image_url: string
  order?: number
}
export interface NeighborhoodItem {
  id: string
  name: string
  description?: string
  distance: string
  icon?: string
}
export interface FloorplanItem {
  id: string
  name: string
  tagline?: string
  area: string
  suites_parking: string
  description: string
  image_url: string
}

export type ClassificationType =
  | 'Nome'
  | 'NCM'
  | 'cClassTrib'
  | 'CST'
  | 'cCredPres'
  | 'CEST'
  | 'MVA-ST'
  | 'CFOP'
  | 'NBS'
  | 'CNAE 2.3'
  | 'cBenef'

export interface ClassificationItem {
  id: string
  tipo: ClassificationType
  codigo: string
  descricao: string
  nome?: string
  fonte: string
  tabela_origem?: string
  atualizado_em?: string
  observacoes?: string
  created?: string
  updated?: string
}
