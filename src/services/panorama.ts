import pb from '@/lib/pocketbase/client'
import type {
  TaxNormItem,
  TaxTopicItem,
  InquiryInput,
  InquiryItem,
  SourceStatusItem,
  ContentReviewItem,
  GalleryItem,
  NeighborhoodItem,
  FloorplanItem,
} from '@/types/panorama'

export const fallbackNorms: TaxNormItem[] = [
  {
    id: 'norm-1',
    code: 'EC 132/2023',
    dou_date: '21/12/2023',
    date: '20/12/2023',
    title: 'Emenda Constitucional nº 132',
    summary:
      'Art. 156-A (IBS), art. 195 V (CBS), art. 153 VIII (IS), art. 156-B (CGIBS), ADCT arts. 124–137 (transição)',
    status_incidence: 'Cria a incidência',
    order: 1,
    link_url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
  },
  {
    id: 'norm-2',
    code: 'LC 214/2025',
    dou_date: '16/01/2025',
    date: '16/01/2025',
    title: 'Lei Complementar nº 214 (Norma Central)',
    summary:
      'Livro I: normas gerais (Títulos I–IV); Título V: regimes específicos; Livro II: Imposto Seletivo; Livro III: transição (arts. 343–433)',
    status_incidence: 'Regula a incidência',
    order: 2,
    link_url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
  },
  {
    id: 'norm-3',
    code: 'LC 227/2026',
    dou_date: '14/01/2026',
    date: '13/01/2026',
    title: 'Lei Complementar nº 227 (CGIBS e ITCMD)',
    summary:
      'Livro I: CGIBS, contencioso e distribuição; Livro II: normas gerais do ITCMD (arts. 163–193); altera LC 214',
    status_incidence: 'Administração do IBS',
    order: 3,
    link_url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
  },
  {
    id: 'norm-4',
    code: 'Decreto 12.955/2026',
    dou_date: '29/04/2026',
    date: '29/04/2026',
    title: 'Regulamento da CBS',
    summary: 'Regulamento da CBS — 620 arts. e 5 anexos; coordenação RFB/PGFN/CGIBS (art. 451)',
    status_incidence: 'Regula a CBS',
    order: 4,
    link_url: '',
  },
  {
    id: 'norm-5',
    code: 'Resolução CGIBS 6/2026 (RIBS)',
    dou_date: '30/04/2026',
    date: '30/04/2026',
    title: 'Regulamento do IBS',
    summary:
      'Regulamento do IBS — 617 arts., 3 livros e 5 anexos; cadastro, documento fiscal, local da operação, obrigações acessórias',
    status_incidence: 'Regula o IBS',
    order: 5,
    link_url: 'https://cgibs.gov.br/resolucoes',
  },
  {
    id: 'norm-6',
    code: 'Resoluções CGIBS 1, 2/2026; 13–16/2026',
    dou_date: '02–09/2026',
    date: '02–09/2026',
    title: 'Organização do CGIBS',
    summary:
      'Organização do CGIBS; alteração do RIBS (art. 617); financiamento; documentos fiscais',
    status_incidence: 'Operacional',
    order: 6,
    link_url: '',
  },
  {
    id: 'norm-7',
    code: 'Ato Conjunto RFB/CGIBS 4/2026',
    dou_date: '30/07/2026',
    date: '30/07/2026',
    title: 'Cronograma DFe e Conformidade',
    summary: 'Cronograma dos documentos fiscais eletrônicos; programa de conformidade 2026',
    status_incidence: 'Obrig. acessórias',
    order: 7,
    link_url: '',
  },
  {
    id: 'norm-8',
    code: 'Resoluções CGSN 190–192/2026',
    dou_date: '2026',
    date: '2026',
    title: 'Simples Nacional na Reforma',
    summary:
      'Simples Nacional: IBS/CBS no DAS, sublimite R$ 3,6 mi (IBS), NFS-e nacional (01/11/2026)',
    status_incidence: 'ME/EPP',
    order: 8,
    link_url: '',
  },
]

export async function fetchTaxNorms(): Promise<TaxNormItem[]> {
  try {
    const records = await pb.collection('tax_norms').getFullList<TaxNormItem>({
      sort: 'order',
    })
    return records && records.length > 0 ? records : fallbackNorms
  } catch (err) {
    console.warn('Falha ao buscar tax_norms do PocketBase, usando dados padrão:', err)
    return fallbackNorms
  }
}

export async function fetchTaxTopics(section?: string): Promise<TaxTopicItem[]> {
  try {
    const options: Record<string, unknown> = { sort: 'order' }
    if (section) {
      options.filter = `section = "${section}"`
    }
    const records = await pb.collection('tax_topics').getFullList<TaxTopicItem>(options)
    return records
  } catch (err) {
    console.warn('Falha ao buscar tax_topics do PocketBase:', err)
    return []
  }
}

export async function submitInquiry(data: InquiryInput): Promise<InquiryItem> {
  const record = await pb.collection('inquiries').create<InquiryItem>(data)
  return record
}

export async function fetchSourceStatuses(): Promise<SourceStatusItem[]> {
  try {
    const records = await pb.collection('source_status').getFullList<SourceStatusItem>({
      sort: 'order',
    })
    return records
  } catch (err) {
    console.warn('Falha ao buscar source_status do PocketBase:', err)
    return []
  }
}

export async function triggerSourceCheck(): Promise<boolean> {
  try {
    const res = await pb.send('/backend/v1/check-sources', {
      method: 'POST',
    })
    if (res && res.success === false) {
      throw new Error(res.error || 'Falha ao processar verificação das fontes.')
    }
    return true
  } catch (err) {
    console.error('Falha ao acionar verificação de fontes no backend:', err)
    throw err
  }
}

export async function fetchLatestContentReview(): Promise<ContentReviewItem | null> {
  try {
    const records = await pb.collection('content_reviews').getList<ContentReviewItem>(1, 1, {
      sort: '-review_date',
    })
    if (records.items && records.items.length > 0) {
      return records.items[0]
    }
    return null
  } catch (err) {
    console.warn('Falha ao buscar content_reviews do PocketBase:', err)
    return null
  }
}

export async function fetchContentReviewsHistory(limit = 10): Promise<ContentReviewItem[]> {
  try {
    const records = await pb.collection('content_reviews').getList<ContentReviewItem>(1, limit, {
      sort: '-review_date',
    })
    return records.items || []
  } catch (err) {
    console.warn('Falha ao buscar histórico de content_reviews:', err)
    return []
  }
}

export async function triggerWeeklyReview(): Promise<boolean> {
  try {
    const res = await pb.send('/backend/v1/trigger-weekly-review', {
      method: 'POST',
    })
    if (res && res.success === false) {
      throw new Error(res.error || 'Falha ao executar revisão semanal.')
    }
    return true
  } catch (err) {
    console.error('Falha ao acionar revisão semanal no backend:', err)
    throw err
  }
}

// Retrocompatibilidade se necessário
export const fallbackGallery: GalleryItem[] = []
export const fallbackNeighborhood: NeighborhoodItem[] = []
export const fallbackFloorplans: FloorplanItem[] = []
export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  return []
}
export async function fetchNeighborhoodItems(): Promise<NeighborhoodItem[]> {
  return []
}
export async function fetchFloorplans(): Promise<FloorplanItem[]> {
  return []
}
