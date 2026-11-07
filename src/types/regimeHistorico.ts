/**
 * Tipos da Trilha de Auditoria de Regime Tributário
 * Sistema ADECONT — Projeto Panorama
 */

export type OrigemAlteracaoRegime =
  | 'listagem'
  | 'ficha_cadastral'
  | 'banner_diagnostico'
  | 'parametrizador'

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
  data_hora?: string
  observacao?: string
  created?: string
  updated?: string
}

export interface RegistrarMudancaRegimeParams {
  empresaId?: string
  empresaCodigo?: number
  empresaNome?: string
  empresaDocumento?: string
  regimeAnterior?: string | null
  regimeNovo: string
  origem: OrigemAlteracaoRegime
  usuario?: string
  observacao?: string
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
