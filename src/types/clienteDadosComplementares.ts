/**
 * Tipos para a Ficha Cadastral Estendida do Cliente
 * Sistema ADECONT — Projeto Panorama
 *
 * Abrange:
 * 1. Campos personalizados (definições e valores por cliente)
 * 2. Canais de contato com ícones e ações (email mailto, whatsapp wa.me, redes sociais)
 * 3. Arquivos anexos do cliente (upload, download, exclusão)
 * 4. Modelo de importação e exportação em massa
 */

export type TipoCampoPersonalizado = 'texto' | 'numero' | 'data' | 'booleano' | 'selecao'

export interface CampoPersonalizadoDef {
  id?: string
  chave: string
  rotulo: string
  tipo: TipoCampoPersonalizado
  opcoes?: string // Valores separados por vírgula para tipo 'selecao'
  descricao?: string
  ordem?: number
  ativo?: boolean
  criado_por?: string
  created?: string
  updated?: string
}

export interface CampoPersonalizadoValor {
  id?: string
  cliente_cnpj: string
  cliente_codigo?: number
  campo_chave: string
  valor: string
  atualizado_por?: string
  created?: string
  updated?: string
}

export type TipoCanalContato =
  | 'email'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'telegram'
  | 'site'
  | 'outro'

export interface ClienteContato {
  id?: string
  cliente_cnpj: string
  cliente_codigo?: number
  tipo: TipoCanalContato
  identificador: string // email, telefone/whats ou URL/handle
  rotulo?: string // ex: "Comercial", "Financeiro", "Diretoria"
  nome_responsavel?: string
  cargo_responsavel?: string
  principal?: boolean
  observacao?: string
  created?: string
  updated?: string
}

export interface ClienteArquivo {
  id?: string
  cliente_cnpj: string
  cliente_codigo?: number
  titulo: string
  categoria?: string // 'Contrato' | 'Documento Societário' | 'Procuração' | 'Fiscal' | 'Certidão' | 'Outro'
  arquivo?: string // nome do arquivo armazenado no PocketBase
  nome_original?: string
  tamanho_bytes?: number
  tipo_mime?: string
  observacao?: string
  enviado_por?: string
  url?: string
  created?: string
  updated?: string
}

export interface DadosComplementaresCliente {
  camposValores: Record<string, string> // chave do campo -> valor
  contatos: ClienteContato[]
  arquivos: ClienteArquivo[]
}

/**
 * Linha para importação/exportação em massa de dados complementares
 */
export interface LinhaImportExportMassa {
  codigo?: number
  cnpj_cpf: string
  razao_social?: string
  // Canais rápidos
  email?: string
  whatsapp?: string
  instagram?: string
  linkedin?: string
  facebook?: string
  // Campos dinâmicos (chave do campo -> valor)
  [campoChave: string]: any
}

export interface ResultadoImportacaoMassaComplementar {
  totalLido: number
  totalProcessado: number
  sucessoCount: number
  ignoradosCount: number
  errosCount: number
  clientesAtualizados: number
  contatosCriadosOuAtualizados: number
  valoresCamposAtualizados: number
  detalhes: {
    linha: number
    cnpj: string
    sucesso: boolean
    mensagem: string
  }[]
}
