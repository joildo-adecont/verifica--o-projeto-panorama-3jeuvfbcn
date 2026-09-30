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

export interface TaxNormItem {
  id: string
  code: string
  date: string
  dou_date?: string
  title: string
  summary: string
  status_incidence: string
  order?: number
  link_url?: string
  created?: string
  updated?: string
}

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
