import type { TaxNormItem } from '@/types/panorama'
import type { EsferaFederativaId } from '@/services/buscaAvancada'

export type EsferaNormaId = EsferaFederativaId

export interface OpcaoEsferaNorma {
  id: EsferaNormaId
  label: string
  sigla: string
  descricao: string
}

export const OPCOES_ESFERAS_NORMA: OpcaoEsferaNorma[] = [
  {
    id: 'federal',
    label: 'Federal (União, CGIBS, RFB, Planalto)',
    sigla: 'FED',
    descricao: 'Atos de alcance nacional/federal',
  },
  {
    id: 'estadual',
    label: 'Estadual (CONFAZ, Sefaz, Estados)',
    sigla: 'EST',
    descricao: 'Atos estaduais e distritais',
  },
  {
    id: 'municipal',
    label: 'Municipal (Municípios, NFS-e local)',
    sigla: 'MUN',
    descricao: 'Atos municipais e do DF',
  },
]

export interface OpcaoFonteNorma {
  id: string
  label: string
  badge: string
  sigla: string
}

export const OPCOES_FONTES_NORMA: OpcaoFonteNorma[] = [
  {
    id: 'Planalto',
    label: 'Planalto (Presidência)',
    badge: 'EC / LC / Decreto',
    sigla: 'PLANALTO',
  },
  { id: 'CGIBS', label: 'CGIBS (Comitê Gestor do IBS)', badge: 'Resoluções IBS', sigla: 'CGIBS' },
  { id: 'RFB', label: 'Receita Federal (RFB)', badge: 'Atos Conjuntos', sigla: 'RFB' },
  { id: 'CGSN', label: 'CGSN (Simples Nacional)', badge: 'Resoluções CGSN', sigla: 'CGSN' },
  {
    id: 'CONFAZ',
    label: 'CONFAZ (Conselho Fazendário)',
    badge: 'Convênios ICMS/IBS',
    sigla: 'CONFAZ',
  },
  { id: 'SUFRAMA', label: 'SUFRAMA (Zona Franca)', badge: 'Incentivos ZFM', sigla: 'SUFRAMA' },
]

export interface OpcaoTipoAtoNorma {
  id: string
  label: string
  badge: string
}

export const OPCOES_TIPOS_ATO_NORMA: OpcaoTipoAtoNorma[] = [
  { id: 'Emenda Constitucional', label: 'Emenda Constitucional', badge: 'EC' },
  { id: 'Lei Complementar', label: 'Lei Complementar', badge: 'LC' },
  { id: 'Decreto', label: 'Decreto Federal', badge: 'DEC' },
  { id: 'Resolução', label: 'Resolução (CGIBS/CGSN)', badge: 'RES' },
  { id: 'Portaria Conjunta', label: 'Portaria Conjunta (MF/CGIBS)', badge: 'PORT' },
  { id: 'Ato Conjunto', label: 'Ato Conjunto (RFB/CGIBS)', badge: 'ATO' },
]

export interface OpcaoIncidenciaNorma {
  id: string
  label: string
  badge: string
}

export const OPCOES_INCIDENCIA_NORMA: OpcaoIncidenciaNorma[] = [
  { id: 'INCIDE', label: 'Cria / Regula Incidência', badge: 'Incide' },
  { id: 'REGULA_CBS_IBS', label: 'Regulamentos (CBS / IBS)', badge: 'Regulamento' },
  { id: 'OBRIG_ACESSORIAS', label: 'Obrigações Acessórias', badge: 'Acessória' },
  { id: 'OPERACIONAL', label: 'Operacional / Governança', badge: 'Operacional' },
  { id: 'ME_EPP', label: 'ME / EPP (Simples Nacional)', badge: 'Simples' },
  { id: 'NAO_INCIDE', label: 'Não Incide / Imune', badge: 'Não Incide' },
  { id: 'ESPECIFICO_PARCIAL', label: 'Regime Específico / Parcial', badge: 'Específico' },
]

export interface FiltrosNormasState {
  termo?: string
  tiposAto: string[]
  esferas: EsferaNormaId[]
  fontes: string[]
  incidencias: string[]
}

export const FILTROS_NORMAS_INICIAIS: FiltrosNormasState = {
  termo: '',
  tiposAto: [],
  esferas: [],
  fontes: [],
  incidencias: [],
}

function normalizarTexto(str?: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Deduz o tipo do ato normativo a partir de `norm_type` ou das regras de prefixo do código.
 */
export function deduzirTipoAto(norm: TaxNormItem): string {
  if (norm.norm_type) {
    const nt = norm.norm_type.trim()
    if (nt.toLowerCase().includes('emenda')) return 'Emenda Constitucional'
    if (nt.toLowerCase().includes('lei complementar')) return 'Lei Complementar'
    if (nt.toLowerCase().includes('decreto')) return 'Decreto'
    if (nt.toLowerCase().includes('portaria')) return 'Portaria Conjunta'
    if (nt.toLowerCase().includes('ato conjunto')) return 'Ato Conjunto'
    if (nt.toLowerCase().includes('resolu')) return 'Resolução'
    return nt
  }

  const code = (norm.code || '').toUpperCase()
  if (code.startsWith('EC ') || code.includes('EMENDA')) return 'Emenda Constitucional'
  if (code.startsWith('LC ') || code.includes('LEI COMPLEMENTAR')) return 'Lei Complementar'
  if (code.startsWith('DECRETO')) return 'Decreto'
  if (code.includes('RESOLUÇÃO') || code.includes('RESOLUCAO') || code.startsWith('RES '))
    return 'Resolução'
  if (code.includes('PORTARIA')) return 'Portaria Conjunta'
  if (code.includes('ATO CONJUNTO')) return 'Ato Conjunto'
  return 'Outro'
}

/**
 * Deduz a esfera federativa da norma.
 * No panorama tributário da reforma (IBS/CBS):
 * - Quase todas as normas gerais (EC 132, LC 214, LC 227, Decretos federais, Atos RFB/CGIBS, CGSN) são de alcance federal/nacional.
 * - Normas CONFAZ ou de Sefaz estaduais são estaduais.
 * - Normas municipais (ISS/NFS-e municipal ou entes locais) são municipais.
 * - CGIBS é composto por Estados e Municípios, mas as Resoluções do CGIBS e LC 227 têm alcance nacional (esfera federal/nacional).
 */
export function deduzirEsferaNorma(norm: TaxNormItem): EsferaNormaId {
  const origin = normalizarTexto(norm.origin || '')
  const title = normalizarTexto(norm.title || '')
  const summary = normalizarTexto(norm.summary || '')

  if (origin.includes('confaz') || origin.includes('sefaz') || title.includes('estadual')) {
    return 'estadual'
  }

  if (origin.includes('municip') || origin.includes('prefeitura') || title.includes('municipal')) {
    return 'municipal'
  }

  // Padrão nacional da reforma do consumo (IBS/CBS)
  return 'federal'
}

/**
 * Normaliza e identifica a qual fonte oficial a norma pertence.
 */
export function correspondeFonteNorma(norm: TaxNormItem, fonteId: string): boolean {
  const fId = normalizarTexto(fonteId)
  const origin = normalizarTexto(norm.origin || '')
  const code = normalizarTexto(norm.code || '')
  const title = normalizarTexto(norm.title || '')
  const summary = normalizarTexto(norm.summary || '')
  const link = normalizarTexto(norm.link_url || '')

  if (fId === 'planalto') {
    return (
      origin.includes('planalto') ||
      origin.includes('presidencia') ||
      code.startsWith('ec ') ||
      code.startsWith('lc ') ||
      code.startsWith('decreto') ||
      link.includes('normas.leg.br') ||
      link.includes('planalto.gov.br')
    )
  }

  if (fId === 'cgibs') {
    return (
      origin.includes('cgibs') ||
      origin.includes('comite gestor') ||
      code.includes('cgibs') ||
      link.includes('cgibs.gov.br')
    )
  }

  if (fId === 'rfb') {
    return (
      origin.includes('receita federal') ||
      origin.includes('rfb') ||
      code.includes('rfb') ||
      summary.includes('rfb')
    )
  }

  if (fId === 'cgsn') {
    return (
      origin.includes('cgsn') ||
      origin.includes('simples nacional') ||
      code.includes('cgsn') ||
      title.includes('simples')
    )
  }

  if (fId === 'confaz') {
    return origin.includes('confaz') || code.includes('confaz') || summary.includes('confaz')
  }

  if (fId === 'suframa') {
    return origin.includes('suframa') || summary.includes('zfm') || summary.includes('zona franca')
  }

  return origin.includes(fId) || code.includes(fId) || title.includes(fId)
}

/**
 * Avalia se o status de incidência da norma combina com a opção selecionada.
 */
export function correspondeIncidenciaNorma(norm: TaxNormItem, incidenciaId: string): boolean {
  const s = (norm.status_incidence || '').toUpperCase()

  switch (incidenciaId) {
    case 'INCIDE':
      return s.includes('CRIA') || s.includes('REGULA A INCIDÊNCIA') || s.includes('INCIDE')
    case 'REGULA_CBS_IBS':
      return s.includes('REGULA A CBS') || s.includes('REGULA O IBS') || s.includes('ADMINISTRAÇÃO')
    case 'OBRIG_ACESSORIAS':
      return s.includes('OBRIG') || s.includes('ACESSÓRIA') || s.includes('ACESSORIAS')
    case 'OPERACIONAL':
      return s.includes('OPERACIONAL')
    case 'ME_EPP':
      return s.includes('ME/EPP') || s.includes('ME') || s.includes('SIMPLES')
    case 'NAO_INCIDE':
      return s.includes('NÃO INCIDE') || s.includes('ISENTO') || s.includes('IMUNE')
    case 'ESPECIFICO_PARCIAL':
      return s.includes('ESPECÍFICO') || s.includes('ESPECIFICO') || s.includes('PARCIAL')
    default:
      return true
  }
}

/**
 * Função pura que aplica a combinação facetada de filtros sobre a lista de normas.
 */
export function filtrarNormas(norms: TaxNormItem[], filtros: FiltrosNormasState): TaxNormItem[] {
  const termoNorm = normalizarTexto(filtros.termo)

  return norms.filter((norm) => {
    // 1. Termo de busca textual
    if (termoNorm) {
      const searchSpace = normalizarTexto(
        `${norm.code} ${norm.title} ${norm.summary} ${norm.status_incidence} ${norm.norm_type || ''} ${norm.origin || ''} ${norm.date || ''} ${norm.dou_date || ''}`,
      )
      if (!searchSpace.includes(termoNorm)) {
        return false
      }
    }

    // 2. Tipo de ato (OR entre tipos selecionados)
    if (filtros.tiposAto && filtros.tiposAto.length > 0) {
      const tipoReal = deduzirTipoAto(norm)
      const matchTipo = filtros.tiposAto.some((tSel) => {
        const tNorm = normalizarTexto(tSel)
        const realNorm = normalizarTexto(tipoReal)
        return realNorm.includes(tNorm) || tNorm.includes(realNorm)
      })
      if (!matchTipo) return false
    }

    // 3. Esfera federativa (OR entre esferas selecionadas)
    if (filtros.esferas && filtros.esferas.length > 0) {
      const esferaReal = deduzirEsferaNorma(norm)
      if (!filtros.esferas.includes(esferaReal)) {
        return false
      }
    }

    // 4. Fonte oficial (OR entre fontes selecionadas)
    if (filtros.fontes && filtros.fontes.length > 0) {
      const matchFonte = filtros.fontes.some((fonteId) => correspondeFonteNorma(norm, fonteId))
      if (!matchFonte) return false
    }

    // 5. Incidência (OR entre incidências selecionadas)
    if (filtros.incidencias && filtros.incidencias.length > 0) {
      const matchIncidencia = filtros.incidencias.some((incId) =>
        correspondeIncidenciaNorma(norm, incId),
      )
      if (!matchIncidencia) return false
    }

    return true
  })
}

/**
 * Calcula o total de filtros ativos para o contador do botão e badges.
 */
export function contarFiltrosNormasAtivos(filtros: FiltrosNormasState): number {
  return (
    (filtros.termo && filtros.termo.trim().length > 0 ? 1 : 0) +
    filtros.tiposAto.length +
    filtros.esferas.length +
    filtros.fontes.length +
    filtros.incidencias.length
  )
}
