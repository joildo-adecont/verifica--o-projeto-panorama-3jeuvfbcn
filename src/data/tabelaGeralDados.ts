/**
 * TABELA GERAL DOS ANEXOS DA REFORMA — arquivo-ponte (CARGA SOB DEMANDA).
 * Une as partes A (RIBS I/II) e B (LC 214, Dec. 12.955, RIBS III/IV/V).
 * Carregado pelo navegador SOMENTE quando um anexo da Tabela Geral é aberto (import dinâmico).
 */
export interface LinhaTabelaGeral {
  item: string
  descricao: string
  codigo: string
  tratamento: string
  aliquota: string
  detalhe?: string
}
import { DADOS_A } from './tabelaGeralDadosA'
import { DADOS_B } from './tabelaGeralDadosB'

export const TABELA_GERAL_DADOS: Record<string, LinhaTabelaGeral[]> = {
  ...DADOS_A,
  ...DADOS_B,
}
