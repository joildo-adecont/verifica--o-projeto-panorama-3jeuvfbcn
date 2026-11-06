// Interface completa para os registros da coleção `cadastro_empresas` (PocketBase)
export interface EmpresaRecord {
  id?: string
  codigo: number
  tipo_documento: string
  numero_documento: string
  documento_limpo: string
  razao_social: string
  nome?: string
  apelido: string
  nome_fantasia?: string
  situacao?: string // 'Ativa' | 'Inativa' | etc.
  natureza_juridica?: string
  cnae?: string
  cnae_divisao?: string
  ramo_atividade?: string
  inicio_atividades?: string
  cliente_desde?: string
  tipo_endereco?: string
  endereco?: string
  numero_endereco?: string
  bairro?: string
  complemento?: string
  municipio?: string
  uf?: string
  cep?: string
  pais?: string
  telefone?: string
  fax?: string
  email?: string
  pagina_internet?: string
  data_inscricao?: string
  inscricao_estadual?: string
  inscricao_municipal?: string
  inscricao_junta_comercial?: string
  inscricao_suframa?: string
  capital_social?: string
  contador?: string
  responsavel_legal?: string
  foro_comarca?: string
  duracao_contrato?: string
  pagina?: number
  created?: string
  updated?: string
}
