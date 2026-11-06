// Helper for processing companies extracted from the report
export interface EmpresaRecord {
  codigo: number
  tipo_documento: string
  numero_documento: string
  documento_limpo: string
  razao_social: string
  apelido: string
  data_inscricao: string
  inscricao_estadual: string
  inscricao_suframa: string
  pagina: number
}
