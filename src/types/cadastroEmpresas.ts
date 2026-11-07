// Lista oficial dos 5 regimes tributários reconhecidos no sistema ADECONT
export const OPCOES_REGIME_TRIBUTARIO = [
  'Simples Nacional',
  'Simples Híbrido',
  'Lucro Presumido',
  'Lucro Real',
  'Regime Regular IBS/CBS',
] as const

export type RegimeTributarioTipo = (typeof OPCOES_REGIME_TRIBUTARIO)[number]

// Nome do evento CustomEvent para sincronização em tempo real entre módulos
export const EVENTO_REGIME_TRIBUTARIO_ALTERADO = 'adecont:regime_tributario_alterado'

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
  regime_tributario?: string
  enquadramento_tributario?: string
  cnaes_secundarios?: string
  porte?: string
  num_funcionarios?: number
  folha_salarial_mensal?: number
  encargos_mensais?: number
  tipo_cadastro?: string
  cpf_cnpj?: string
  telefone_2?: string
  data_inicio_atividades?: string
  data_cadastro?: string
  motivo_transferencia?: string
  transferido_em?: string
  created?: string
  updated?: string
  arquivado?: boolean
  arquivado_em?: string
  arquivado_por?: string
  motivo_arquivamento?: string
  substituido_por_id?: string
  substituido_por_codigo?: number
}
