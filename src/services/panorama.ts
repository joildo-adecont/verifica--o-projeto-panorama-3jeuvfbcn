import pb from '@/lib/pocketbase/client'
import type {
  TaxNormItem,
  DirectCgibsDocumentItem,
  TaxTopicItem,
  InquiryInput,
  InquiryItem,
  SourceStatusItem,
  ContentReviewItem,
  GalleryItem,
  NeighborhoodItem,
  FloorplanItem,
} from '@/types/panorama'

/**
 * Retorna a URL do endpoint de proxy do backend para download seguro do PDF da Resolução CGIBS.
 * Contorna bloqueios locais de navegadores (ex.: ERR_BLOCKED_BY_CLIENT no Edge em relação ao domínio cgibs.gov.br).
 */
export function getCgibsPdfProxyUrl(identifier: string): string {
  const baseUrl = pb.baseURL || ''
  const trimmed = baseUrl.replace(/\/+$/, '')
  return `${trimmed}/backend/v1/download-resolution?id=${encodeURIComponent(identifier)}`
}

/**
 * Função utilitária para acionar o download do PDF via JavaScript (blob) com exibição de feedback.
 * Pode ser usada quando se deseja capturar erros detalhados de rede no cliente antes de salvar.
 */
export async function downloadCgibsPdfViaProxy(
  identifier: string,
  fallbackFilename?: string,
): Promise<void> {
  const proxyUrl = getCgibsPdfProxyUrl(identifier)
  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf,application/octet-stream,*/*',
    },
  })

  if (!response.ok) {
    let errorMsg = `Erro ${response.status} ao baixar o arquivo`
    try {
      const errJson = await response.json()
      if (errJson && errJson.error) {
        errorMsg = errJson.error
      }
    } catch {
      /* intentionally ignored */
    }
    throw new Error(errorMsg)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  let filename = fallbackFilename || 'Resolucao-CGIBS.pdf'

  const match = contentDisposition.match(/filename="?([^";]+)"?/i)
  if (match && match[1]) {
    filename = match[1]
  }

  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export const cgibsDirectDocuments: DirectCgibsDocumentItem[] = [
  {
    id: 'doc-cgibs-1',
    code: 'Resolução CGIBS nº 1/2026',
    date: '23/02/2026',
    title: 'Instalação e Governança do CGIBS',
    summary:
      'Instalação oficial e disposições preliminares de funcionamento do Comitê Gestor do IBS.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
    proxy_url: getCgibsPdfProxyUrl('1'),
    resolution_number: '1',
    filename: 'Resolucao-CGIBS-01-2026.pdf',
    badge: 'Governança',
  },
  {
    id: 'doc-cgibs-5',
    code: 'Resolução CGIBS nº 5/2026',
    date: '30/04/2026',
    title: 'Regras e Governança Operacional CGIBS',
    summary:
      'Aprova diretrizes operacionais de governança e funcionamento dos colegiados do Comitê.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
    proxy_url: getCgibsPdfProxyUrl('5'),
    resolution_number: '5',
    filename: 'Resolucao-CGIBS-05-2026.pdf',
    badge: 'Operacional',
  },
  {
    id: 'doc-cgibs-6',
    code: 'Resolução CGIBS nº 6/2026',
    date: '30/04/2026',
    title: 'Regulamento do IBS (RIBS)',
    summary: 'Regulamento oficial do IBS — 617 artigos, 3 livros e 5 anexos fundamentais.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    proxy_url: getCgibsPdfProxyUrl('6'),
    resolution_number: '6',
    filename: 'Resolucao-CGIBS-06-2026-Regulamento-IBS.pdf',
    badge: 'Regulamento Central',
  },
  {
    id: 'doc-cgibs-8',
    code: 'Resolução CGIBS nº 8/2026',
    date: '26/05/2026',
    title: 'Estruturação Administrativa do CGIBS',
    summary: 'Estruturação dos órgãos executivos, técnicos e administrativos do Comitê Gestor.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
    proxy_url: getCgibsPdfProxyUrl('8'),
    resolution_number: '8',
    filename: 'Resolucao-CGIBS-08-2026.pdf',
    badge: 'Administração',
  },
  {
    id: 'doc-cgibs-10',
    code: 'Resolução CGIBS nº 10/2026',
    date: '29/06/2026',
    title: 'Proposta Orçamentária 2026',
    summary: 'Aprova a proposta orçamentária do Comitê Gestor do IBS para o exercício 2026.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
    proxy_url: getCgibsPdfProxyUrl('10'),
    resolution_number: '10',
    filename: 'Resolucao-CGIBS-10-2026.pdf',
    badge: 'Orçamento',
  },
  {
    id: 'doc-cgibs-13',
    code: 'Resolução CGIBS nº 13/2026',
    date: '22/07/2026',
    title: 'Alteração do art. 617 do RIBS',
    summary: 'Altera o art. 617 do Regulamento do IBS (vigências e adequações normativas).',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
    proxy_url: getCgibsPdfProxyUrl('13'),
    resolution_number: '13',
    filename: 'Resolucao-CGIBS-13-2026.pdf',
    badge: 'Alteração RIBS',
  },
  {
    id: 'doc-cgibs-14',
    code: 'Resolução CGIBS nº 14/2026',
    date: '29/07/2026',
    title: 'Proposta Percentual IBS 2027 (Financiamento)',
    summary:
      'Proposta de percentual do IBS para financiamento do CGIBS e estimativa técnica de 27,91%.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
    proxy_url: getCgibsPdfProxyUrl('14'),
    resolution_number: '14',
    filename: 'Resolucao-CGIBS-14-2026.pdf',
    badge: 'Alíquotas 2027',
  },
  {
    id: 'doc-cgibs-16',
    code: 'Resolução CGIBS nº 16/2026',
    date: '29/07/2026',
    title: 'Prorrogação de Campos DFe',
    summary: 'Prorroga a obrigatoriedade do preenchimento dos campos relativos ao IBS/CBS nos DFe.',
    pdf_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
    proxy_url: getCgibsPdfProxyUrl('16'),
    resolution_number: '16',
    filename: 'Resolucao-CGIBS-16-2026.pdf',
    badge: 'DFe / Prazos',
  },
]

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
    code: 'Ato Conjunto RFB/CGIBS nº 1/2025',
    dou_date: '23/12/2025',
    date: '22/12/2025',
    title: 'Obrigações acessórias 2026',
    summary:
      'Disciplina obrigações acessórias do IBS/CBS em 2026; apuração meramente informativa, sem recolhimento nem sanções se cumpridas as obrigações; campos IBS/CBS em NF-e, NFC-e, CT-e, NFS-e; institui a DeRE',
    status_incidence: 'Obrig. acessórias',
    order: 4,
    link_url:
      'https://www.in.gov.br/web/dou/-/ato-conjunto-rfb/cgibs-n-1-de-22-de-dezembro-de-2025-677624586',
  },
  {
    id: 'norm-5',
    code: 'Decreto 12.955/2026',
    dou_date: '29/04/2026',
    date: '29/04/2026',
    title: 'Regulamento da CBS',
    summary: 'Regulamento da CBS — 620 arts. e 5 anexos; coordenação RFB/PGFN/CGIBS (art. 451)',
    status_incidence: 'Regula a CBS',
    order: 5,
    link_url: '',
  },
  {
    id: 'norm-6',
    code: 'Resolução CGIBS nº 5/2026',
    dou_date: '30/04/2026',
    date: '30/04/2026',
    title: 'Regras e Governança Operacional CGIBS',
    summary: 'Aprova diretrizes complementares de governança e operacionalização do CGIBS',
    status_incidence: 'Operacional',
    order: 6,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202604/30221158-resolucao-cgibs-n-5-de-30-de-abril-de-2026.pdf',
  },
  {
    id: 'norm-7',
    code: 'Resolução CGIBS 6/2026 (RIBS)',
    dou_date: '30/04/2026',
    date: '30/04/2026',
    title: 'Regulamento do IBS',
    summary:
      'Regulamento do IBS — 617 arts., 3 livros e 5 anexos; cadastro, documento fiscal, local da operação, obrigações acessórias',
    status_incidence: 'Regula o IBS',
    order: 7,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
  },
  {
    id: 'norm-8',
    code: 'Portaria Conjunta MF/CGIBS nº 7/2026',
    dou_date: '30/04/2026',
    date: '30/04/2026',
    title: 'Disposições comuns IBS/CBS',
    summary:
      'Reconhece expressamente como disposições comuns o Livro I do Decreto 12.955/2026 (RCBS) e da Resolução CGIBS 6/2026 (RIBS); base da contagem do prazo do art. 3º do Ato Conjunto 1/2025 → marco 01/08/2026',
    status_incidence: 'Operacional',
    order: 8,
    link_url: '',
  },
  {
    id: 'norm-9',
    code: 'Resolução CGIBS nº 1/2026 (e nº 2)',
    dou_date: '02/2026',
    date: '23/02/2026',
    title: 'Instalação e Regimento do CGIBS',
    summary:
      'Instalação, regimento interno e estrutura administrativa de governança do CGIBS (normas complementadas pelas Resoluções 13 a 16/2026 individualizadas)',
    status_incidence: 'Operacional',
    order: 9,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202602/27102250-resoluc-a-o-csibs-n-1-de-23-de-fevereiro-de-2026-assinatura.pdf',
  },
  {
    id: 'norm-10',
    code: 'Resolução CGIBS nº 8/2026',
    dou_date: '26/05/2026',
    date: '26/05/2026',
    title: 'Estruturação Administrativa do CGIBS',
    summary:
      'Dispõe sobre a estruturação administrativa e funcionamento dos órgãos do Comitê Gestor',
    status_incidence: 'Operacional',
    order: 10,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202605/26184150-resolucao-cgibs-n-8-de-2026-3.pdf',
  },
  {
    id: 'norm-11',
    code: 'Resolução CGIBS nº 10/2026',
    dou_date: '01/07/2026',
    date: '29/06/2026',
    title: 'Proposta Orçamentária 2026',
    summary: 'Aprova a proposta orçamentária do Comitê Gestor do IBS para o exercício de 2026',
    status_incidence: 'Operacional',
    order: 11,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/01163740-resolucao-cgibs-n-10-de-29-de-junho-de-2026-proposta-orcamentaria-2026.pdf',
  },
  {
    id: 'norm-12',
    code: 'Resolução CGIBS nº 13/2026',
    dou_date: '22/07/2026',
    date: '22/07/2026',
    title: 'Alteração do RIBS',
    summary: 'Altera o art. 617 do Regulamento do IBS (Resolução CGIBS 6/2026)',
    status_incidence: 'Operacional',
    order: 12,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/22121010-resolucao-cgibs-n-13-de-22-de-julho-de-2026.pdf',
  },
  {
    id: 'norm-13',
    code: 'Resolução CGIBS nº 14/2026',
    dou_date: '31/07/2026',
    date: '29/07/2026',
    title: 'Financiamento do CGIBS 2027',
    summary:
      'Proposta de destinação de até 50% da arrecadação do IBS ao financiamento do CGIBS em 2027; nota técnica estima alíquota de referência conjunta de 27,91% (IBS ≈ 18,70%; fator 1,0532 sobre a estimativa inicial de 26,50%/17,70%) — referência técnica orçamentária, NÃO alíquota definitiva',
    status_incidence: 'Operacional',
    order: 13,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/31144942-resoluc-ao-cgibs-n-14-de-29-de-julho-de-2026-proposta-percentual-ibs-cgibs-2027.pdf',
  },
  {
    id: 'norm-14',
    code: 'Resolução CGIBS nº 16/2026',
    dou_date: '2026',
    date: '29/07/2026',
    title: 'Prorrogação de obrigatoriedade',
    summary:
      'Prorroga a obrigatoriedade do preenchimento dos campos relativos ao IBS e à CBS nos documentos fiscais eletrônicos',
    status_incidence: 'Operacional',
    order: 14,
    link_url:
      'https://www.cgibs.gov.br/upload/arquivos/202607/29175824-doc-20260729-wa0035-260729-175811.pdf',
  },
  {
    id: 'norm-15',
    code: 'Ato Conjunto RFB/CGIBS 4/2026',
    dou_date: '30/07/2026',
    date: '30/07/2026',
    title: 'Cronograma DFe e Conformidade',
    summary: 'Cronograma dos documentos fiscais eletrônicos; programa de conformidade 2026',
    status_incidence: 'Obrig. acessórias',
    order: 15,
    link_url: '',
  },
  {
    id: 'norm-16',
    code: 'Resoluções CGSN 190–192/2026',
    dou_date: '2026',
    date: '2026',
    title: 'Simples Nacional na Reforma',
    summary:
      'Simples Nacional: IBS/CBS no DAS, sublimite R$ 3,6 mi (IBS), NFS-e nacional (01/11/2026)',
    status_incidence: 'ME/EPP',
    order: 16,
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
