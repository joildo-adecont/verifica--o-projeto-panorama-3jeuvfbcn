import type { ClassificationItem, ClassificationType } from '@/types/panorama'

export type EsferaAgregadorId = 'federal' | 'estadual' | 'nacional'

export interface OpcaoTabelaAgregador {
  id: ClassificationType
  label: string
  sublabel: string
  orgao: string
  badge: string
}

export const OPCOES_TABELAS_AGREGADOR: OpcaoTabelaAgregador[] = [
  {
    id: 'Nome',
    label: '1. Nome',
    sublabel: 'Produtos e atividades por especificação',
    orgao: 'RFB / MAPA / CFC',
    badge: 'Nome',
  },
  {
    id: 'NCM',
    label: '2. NCM',
    sublabel: 'Nomenclatura Comum do Mercosul',
    orgao: 'Receita Federal / TEC',
    badge: 'NCM',
  },
  {
    id: 'cClassTrib',
    label: '3. cClassTrib',
    sublabel: 'Classificação Tributária IBS/CBS',
    orgao: 'CGIBS / RFB / ENCAT',
    badge: 'cClassTrib',
  },
  {
    id: 'CST',
    label: '4. CST',
    sublabel: 'Código de Situação Tributária',
    orgao: 'RFB / CGIBS / SPED',
    badge: 'CST',
  },
  {
    id: 'cCredPres',
    label: '5. cCredPres',
    sublabel: 'Crédito Presumido IBS/CBS',
    orgao: 'SVRS / RFB / CGIBS',
    badge: 'cCredPres',
  },
  {
    id: 'CEST',
    label: '6. CEST',
    sublabel: 'Substituição Tributária Estadual',
    orgao: 'CONFAZ (Conv. 142/18)',
    badge: 'CEST',
  },
  {
    id: 'MVA-ST',
    label: '7. MVA-ST',
    sublabel: 'Margem de Valor Agregado',
    orgao: 'CONFAZ / Sefaz UFs',
    badge: 'MVA-ST',
  },
  {
    id: 'CFOP',
    label: '8. CFOP',
    sublabel: 'Operações e Prestações (Entradas e Saídas)',
    orgao: 'CONFAZ / Ajustes SINIEF',
    badge: 'CFOP',
  },
  {
    id: 'NBS',
    label: '9. NBS',
    sublabel: 'Nomenclatura Brasileira de Serviços',
    orgao: 'RFB / MDIC / Codex',
    badge: 'NBS',
  },
  {
    id: 'CNAE 2.3',
    label: '10. CNAE 2.3',
    sublabel: 'Atividades Econômicas e Subclasses',
    orgao: 'IBGE / CONCLA',
    badge: 'CNAE 2.3',
  },
  {
    id: 'cBenef',
    label: '11. cBenef',
    sublabel: 'Benefícios Fiscais Estaduais na NF-e',
    orgao: 'Sefaz Estaduais (SP/RS/PR...)',
    badge: 'cBenef',
  },
]

export interface OpcaoFonteAgregador {
  id: string
  label: string
  sigla: string
  descricao: string
}

export const OPCOES_FONTES_AGREGADOR: OpcaoFonteAgregador[] = [
  {
    id: 'RFB',
    label: 'Receita Federal (RFB)',
    sigla: 'RFB',
    descricao: 'TIPI, NCM, SPED, NFe e atos conjuntos',
  },
  {
    id: 'CGIBS',
    label: 'CGIBS (Comitê Gestor do IBS)',
    sigla: 'CGIBS',
    descricao: 'Resoluções do IBS e IT 2025.002',
  },
  {
    id: 'CONFAZ',
    label: 'CONFAZ (Conselho Fazendário)',
    sigla: 'CONFAZ',
    descricao: 'CEST, MVA-ST, CFOP e Convênios',
  },
  {
    id: 'IBGE',
    label: 'IBGE / CONCLA',
    sigla: 'IBGE',
    descricao: 'Classificação Nacional de Atividades Econômicas (CNAE)',
  },
  {
    id: 'Siscomex/MDIC',
    label: 'Siscomex / MDIC',
    sigla: 'MDIC',
    descricao: 'Comércio exterior, NCM TEC e NBS',
  },
  {
    id: 'portal NF-e',
    label: 'Portal NF-e / SVRS',
    sigla: 'SVRS',
    descricao: 'SVRS, ENCAT e notas técnicas da NF-e',
  },
]

export interface OpcaoEsferaAgregador {
  id: EsferaAgregadorId
  label: string
  sigla: string
}

export const OPCOES_ESFERAS_AGREGADOR: OpcaoEsferaAgregador[] = [
  { id: 'federal', label: 'Federal (RFB, MDIC, Planalto)', sigla: 'FED' },
  { id: 'estadual', label: 'Estadual (CONFAZ, Sefaz, CEST/MVA)', sigla: 'EST' },
  { id: 'nacional', label: 'Nacional / Conjunta (CGIBS, IBGE, ENCAT)', sigla: 'NAC' },
]

export interface FiltrosAgregadoresState {
  termo?: string
  tabelas: ClassificationType[]
  fontes: string[]
  esferas: EsferaAgregadorId[]
}

export const FILTROS_AGREGADORES_INICIAIS: FiltrosAgregadoresState = {
  termo: '',
  tabelas: [],
  fontes: [],
  esferas: [],
}

function normalizarTexto(str?: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Deduz a esfera federativa ou de governança de um item de classificação.
 */
export function deduzirEsferaClassificacao(item: ClassificationItem): EsferaAgregadorId {
  const fonte = normalizarTexto(item.fonte || '')
  const tipo = item.tipo

  if (tipo === 'CEST' || tipo === 'MVA-ST' || tipo === 'cBenef') {
    return 'estadual'
  }

  if (tipo === 'cClassTrib' || tipo === 'cCredPres' || fonte.includes('cgibs')) {
    return 'nacional'
  }

  if (fonte.includes('confaz') || fonte.includes('sefaz')) {
    return 'estadual'
  }

  if (fonte.includes('ibge') || fonte.includes('encat')) {
    return 'nacional'
  }

  return 'federal'
}

/**
 * Avalia se o item de classificação corresponde à fonte oficial selecionada.
 */
export function correspondeFonteAgregador(item: ClassificationItem, fonteId: string): boolean {
  const fNorm = normalizarTexto(fonteId)
  const itemFonte = normalizarTexto(item.fonte || '')
  const itemTabela = normalizarTexto(item.tabela_origem || '')

  if (fNorm === 'rfb') {
    return itemFonte.includes('rfb') || itemFonte.includes('receita')
  }

  if (fNorm === 'cgibs') {
    return itemFonte.includes('cgibs') || itemFonte.includes('comite gestor')
  }

  if (fNorm === 'confaz') {
    return itemFonte.includes('confaz') || itemFonte.includes('sinief')
  }

  if (fNorm === 'ibge') {
    return itemFonte.includes('ibge') || itemFonte.includes('concla')
  }

  if (fNorm === 'siscomex/mdic' || fNorm === 'mdic') {
    return (
      itemFonte.includes('mdic') ||
      itemFonte.includes('mercosul') ||
      itemTabela.includes('tec') ||
      itemTabela.includes('tipi')
    )
  }

  if (fNorm === 'portal nf-e' || fNorm === 'svrs') {
    return (
      itemFonte.includes('svrs') ||
      itemFonte.includes('encat') ||
      itemFonte.includes('sped') ||
      itemTabela.includes('df-e')
    )
  }

  return itemFonte.includes(fNorm)
}

/**
 * Função pura que aplica a combinação facetada de filtros sobre itens de classificações.
 */
export function filtrarClassificacoes(
  items: ClassificationItem[],
  filtros: FiltrosAgregadoresState,
): ClassificationItem[] {
  const termoNorm = normalizarTexto(filtros.termo)

  return items.filter((item) => {
    // 1. Tabela de classificação (OR entre as selecionadas)
    if (filtros.tabelas && filtros.tabelas.length > 0) {
      if (!filtros.tabelas.includes(item.tipo)) {
        return false
      }
    }

    // 2. Fonte oficial (OR entre as selecionadas)
    if (filtros.fontes && filtros.fontes.length > 0) {
      const matchFonte = filtros.fontes.some((fnt) => correspondeFonteAgregador(item, fnt))
      if (!matchFonte) return false
    }

    // 3. Esfera federativa / governança
    if (filtros.esferas && filtros.esferas.length > 0) {
      const esferaItem = deduzirEsferaClassificacao(item)
      if (!filtros.esferas.includes(esferaItem)) {
        return false
      }
    }

    // 4. Termo de busca livre
    if (termoNorm) {
      const searchSpace = normalizarTexto(
        `${item.codigo} ${item.nome || ''} ${item.descricao} ${item.fonte || ''} ${item.observacoes || ''} ${item.tabela_origem || ''}`,
      )
      if (!searchSpace.includes(termoNorm)) {
        return false
      }
    }

    return true
  })
}

/**
 * Conta os filtros ativos para o botão e badges do painel.
 */
export function contarFiltrosAgregadoresAtivos(filtros: FiltrosAgregadoresState): number {
  return (
    (filtros.termo && filtros.termo.trim().length > 0 ? 1 : 0) +
    filtros.tabelas.length +
    filtros.fontes.length +
    filtros.esferas.length
  )
}
