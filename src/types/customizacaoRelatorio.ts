/**
 * Tipos e Modelos para Customização de Relatórios de Análise Empresarial
 * Sistema ADECONT — Portal Panorama RT
 */

export interface SecoesCustomizacaoRelatorio {
  /** Seção de Síntese Financeira & Patrimonial Consolidada (quadro executivo) */
  sinteseExecutiva?: boolean
  /** Seção do Balanço Patrimonial & DRE Comparativo (3 Exercícios) */
  balanco3Anos?: boolean
  /** Indicadores Clássicos (Liquidez, Endividamento, Rentabilidade, Atividade, Cobertura) */
  indicesClassicos: boolean
  /** Modelos Avançados de Insolvência (Kanitz, Altman Z1, Elizabetsky, Du Pont, Fleuriet) */
  modelosAvancados: boolean
  /** Parecer Técnico Final (Opinião, Conclusão, Recomendação de Crédito, Responsável Técnico) */
  parecerTecnico: boolean
  /** Notas e Achados Críticos (Notas da tela e Matriz de Achados / Due Diligence) */
  achadosCriticos: boolean
  /** Síntese Técnica dos 4 Agentes Especialistas ADECONT (Tributário, Contábil, Admin, Macroeconômico) */
  agentesEspecialistas?: boolean
  /** Checklist Documental de Due Diligence */
  checklistDocumental?: boolean
}

/**
 * Títulos customizados opcionais para cada seção do relatório.
 * Se preenchido, substitui o título padrão na visualização e nas exportações (A4, Excel e CSV).
 * Se vazio ou não informado, o título padrão da seção é mantido.
 */
export interface TitulosSecoesCustomizacao {
  /** Título personalizado para Índices Clássicos (padrão: "Índices Clássicos" / "3. Matriz dos Indicadores Contábeis...") */
  indicesClassicos?: string
  /** Título personalizado para Modelos Avançados (padrão: "Modelos Avançados" / "3.1 Modelos de Insolvência...") */
  modelosAvancados?: string
  /** Título personalizado para Parecer Técnico (padrão: "Parecer Técnico Oficial" / "1. Parecer Técnico Oficial...") */
  parecerTecnico?: string
  /** Título personalizado para Notas e Achados Críticos (padrão: "Notas & Achados Críticos" / "5. Matriz de Achados...") */
  achadosCriticos?: string
  /** Título personalizado para Síntese Executiva / Score Ponderado (padrão: "Síntese Executiva" / "Score Ponderado (0 a 10)") */
  sinteseExecutiva?: string
  /** Título personalizado para Balanço & DRE Comparativo 3 Anos (padrão: "Balanço Patrimonial & DRE Comparativo") */
  balanco3Anos?: string
  /** Título personalizado para Agentes Especialistas (padrão: "Síntese Técnica dos Agentes Especialistas ADECONT") */
  agentesEspecialistas?: string
  /** Título personalizado para Checklist Documental (padrão: "Checklist Documental & Due Diligence") */
  checklistDocumental?: string
}

export interface SecaoCustomizada {
  /** Identificador único da seção customizada */
  id: string
  /** Título da seção (ex: "Análise Setorial e Competitiva", "Garantias Oferecidas", "Parecer de Conformidade ESG") */
  titulo: string
  /** Conteúdo textual da seção (livre, multi-linha) */
  conteudo: string
  /** Ordem de exibição no relatório (iniciando em 0) */
  ordem?: number
  /** Se esta seção individual está ativa (padrão true) */
  ativa?: boolean
}

export interface ConfiguracaoRelatorioCustomizado {
  /** Título personalizado do relatório. Se vazio, utiliza o padrão do sistema */
  tituloPersonalizado?: string
  /** Subtítulo ou escopo personalizado do relatório */
  subtituloPersonalizado?: string
  /** Observações ou considerações finais livres exibidas no encerramento */
  observacoesFinais?: string
  /** Seleção de seções ativas na exportação */
  secoes: SecoesCustomizacaoRelatorio
  /** Títulos customizados/renomeados de cada seção do relatório */
  titulosSecoes?: TitulosSecoesCustomizacao
  /** Seções customizadas criadas pelo usuário */
  secoesCustomizadas?: SecaoCustomizada[]
  /** Chave mestra para incluir ou não as seções customizadas no relatório */
  incluirSecoesCustomizadas?: boolean
  /** Incluir bloco de identificação cadastral completa da empresa no relatório A4 */
  incluirDadosEmpresa: boolean
  /** Incluir QRCode oficial de autenticidade / verificação no relatório A4 */
  incluirQrCode: boolean
  /** Incluir carimbo e rodapé de responsabilidade técnica oficial ADECONT */
  incluirRodapeOficial?: boolean
}

export const TITULO_PADRAO_RELATORIO = 'Parecer Técnico & Dossiê Empresarial Integrado'

export const SUBTITULO_PADRAO_RELATORIO = 'Portal Panorama RT · Módulo de Análises Empresariais'

export const TITULOS_PADRAO_SECOES: Required<TitulosSecoesCustomizacao> = {
  indicesClassicos: 'Índices Clássicos',
  modelosAvancados: 'Modelos Avançados de Insolvência & Dinâmica Financeira',
  parecerTecnico: 'Parecer Técnico Oficial & Recomendação de Crédito',
  achadosCriticos: 'Notas & Achados Críticos (Due Diligence)',
  sinteseExecutiva: 'Síntese Executiva & Score Ponderado',
  balanco3Anos: 'Balanço Patrimonial & DRE Comparativo (3 Exercícios)',
  agentesEspecialistas: 'Síntese Técnica dos Agentes Especialistas ADECONT',
  checklistDocumental: 'Checklist Documental & Due Diligence',
}

export const CONFIGURACAO_RELATORIO_PADRAO: ConfiguracaoRelatorioCustomizado = {
  tituloPersonalizado: '',
  subtituloPersonalizado: '',
  observacoesFinais: '',
  secoes: {
    sinteseExecutiva: true,
    balanco3Anos: true,
    indicesClassicos: true,
    modelosAvancados: true,
    parecerTecnico: true,
    achadosCriticos: true,
    agentesEspecialistas: true,
    checklistDocumental: true,
  },
  titulosSecoes: {},
  secoesCustomizadas: [],
  incluirSecoesCustomizadas: true,
  incluirDadosEmpresa: true,
  incluirQrCode: true,
  incluirRodapeOficial: true,
}
