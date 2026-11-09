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
  secoesCustomizadas: [],
  incluirSecoesCustomizadas: true,
  incluirDadosEmpresa: true,
  incluirQrCode: true,
  incluirRodapeOficial: true,
}
