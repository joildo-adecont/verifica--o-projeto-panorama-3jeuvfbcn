export interface EmpresaPdfItem {
  pagina: number
  codigo: number
  tipoDocumento: string
  numeroDocumento: string
  documentoLimpo: string
  razaoSocial: string
  apelido: string
  dataInscricao: string
  inscricaoEstadual?: string
  inscricaoSuframa?: string
}

export function parseToc(): EmpresaPdfItem[] {
  return []
}
