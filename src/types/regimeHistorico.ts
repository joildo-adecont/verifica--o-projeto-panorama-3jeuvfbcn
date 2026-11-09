/**
 * Tipos da Trilha de Auditoria de Regime Tributário
 * Sistema ADECONT — Projeto Panorama
 */

export type OrigemAlteracaoRegime =
  | 'listagem'
  | 'ficha_cadastral'
  | 'banner_diagnostico'
  | 'parametrizador'
  | 'edicao_em_massa'
  | 'status_inativacao'
  | 'status_reativacao'
  | 'status_individual'

export interface RegistroHistoricoRegime {
  id?: string
  empresa_id?: string
  empresa_codigo?: number
  empresa_nome?: string
  empresa_documento?: string
  regime_anterior: string
  regime_novo: string
  origem: OrigemAlteracaoRegime
  usuario?: string
  usuario_nome?: string
  data_hora?: string
  observacao?: string
  created?: string
  updated?: string
}

/**
 * Alias compatível com os componentes que usam RegimeHistoricoItem
 */
export type RegimeHistoricoItem = RegistroHistoricoRegime

export interface RegistrarMudancaRegimeParams {
  empresaId?: string
  empresa_id?: string
  empresaCodigo?: number
  empresa_codigo?: number
  empresaNome?: string
  empresa_nome?: string
  empresaDocumento?: string
  empresa_documento?: string
  empresaCnpj?: string
  empresa_cnpj?: string
  regimeAnterior?: string | null
  regime_anterior?: string | null
  regimeNovo?: string
  regime_novo?: string
  origem: OrigemAlteracaoRegime
  usuario?: string
  usuario_nome?: string
  observacao?: string
}

export interface ListarHistoricoFiltros {
  empresaId?: string
  empresa_id?: string
  empresaCodigo?: number
  empresa_codigo?: number
  empresaDocumento?: string
  empresa_documento?: string
  empresaCnpj?: string
  empresa_cnpj?: string
  limite?: number
}

export interface ResumoUltimaAlteracaoRegime {
  temHistorico: boolean
  totalAlteracoes: number
  ultimoRegistro: RegistroHistoricoRegime | null
  dataUltimaAlteracaoFormatada?: string
  dataEntradaRegimeAtualFormatada?: string
  regimeAnterior?: string
  regimeAtual?: string
  origemTexto?: string
}
