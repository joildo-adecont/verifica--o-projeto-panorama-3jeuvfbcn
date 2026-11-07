export interface NfeDuplicata {
  numero: string
  vencimento: string
  valor: number
}

export interface NfeItem {
  id?: string
  nfe_id: string
  chave_acesso?: string
  numero_item: number
  codigo_produto: string
  descricao: string
  ncm: string
  cest?: string
  cfop: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  valor_desconto?: number
  valor_frete?: number
  origem?: string
  cst_icms?: string
  base_icms?: number
  aliquota_icms?: number
  valor_icms?: number
  cst_icms_st?: string
  base_icms_st?: number
  aliquota_icms_st?: number
  valor_icms_st?: number
  cst_pis?: string
  base_pis?: number
  aliquota_pis?: number
  valor_pis?: number
  cst_cofins?: string
  base_cofins?: number
  aliquota_cofins?: number
  valor_cofins?: number
  cst_ipi?: string
  aliquota_ipi?: number
  valor_ipi?: number
  cclass_trib_sugerido?: string
  regime_reforma_sugerido?: string
  credito_presumido_reforma?: string
}

export interface NfeAgenteResultado {
  slug: string
  nome: string
  status: 'ok' | 'fallback' | 'erro'
  conteudo: string
  aviso?: string | null
}

export interface NfeAnalise {
  data_analise: string
  nfe_id: string
  chave_acesso: string
  numero: string
  tipo_operacao: 'compra' | 'venda'
  total_itens: number
  valor_total_nfe: number
  agentes: {
    icms: NfeAgenteResultado
    pis_cofins: NfeAgenteResultado
    reforma: NfeAgenteResultado
  }
  parecer_consolidado: string
  recomendacao_resumida: string
}

export interface NfeRecord {
  id: string
  chave_acesso: string
  lote_id?: string
  numero: string
  serie?: string
  natureza_operacao?: string
  data_emissao?: string
  data_saida_entrada?: string
  tipo_operacao: 'compra' | 'venda'
  cliente_id?: string
  cliente_cnpj?: string
  cliente_nome?: string
  vinculo_cliente_status: 'vinculado' | 'nao_localizado'
  emit_cnpj_cpf: string
  emit_razao_social: string
  emit_nome_fantasia?: string
  emit_uf?: string
  emit_municipio?: string
  emit_ie?: string
  emit_crt?: string
  dest_cnpj_cpf: string
  dest_razao_social: string
  dest_uf?: string
  dest_municipio?: string
  dest_ie?: string
  valor_produtos: number
  valor_frete?: number
  valor_seguro?: number
  valor_desconto?: number
  valor_outras_despesas?: number
  valor_total_nfe: number
  base_icms?: number
  valor_icms?: number
  base_icms_st?: number
  valor_icms_st?: number
  valor_pis?: number
  valor_cofins?: number
  valor_ipi?: number
  forma_pagamento?: string
  duplicatas?: NfeDuplicata[]
  quantidade_itens: number
  arquivo_origem?: string
  analise_status: 'pendente' | 'processando' | 'analisado' | 'erro'
  analise?: NfeAnalise | null
  created?: string
}

export interface ProcessamentoArquivoResultado {
  arquivo: string
  status: 'ok' | 'duplicada' | 'erro'
  chave?: string
  numero?: string
  nfe_id?: string
  cliente_vinculado?: string
  cliente_cnpj?: string
  tipo?: 'compra' | 'venda'
  itens?: number
  valor_total?: number
  motivo?: string
}

export interface ProcessamentoLoteResponse {
  success: boolean
  error?: string
  lote_id?: string
  status?: string
  total_arquivos: number
  processadas_sucesso: number
  duplicadas: number
  erros: number
  total_itens: number
  valor_total_produtos: number
  valor_total_nf: number
  tipo_predominante?: 'compra' | 'venda' | 'misto'
  cliente_vinculado?: {
    id: string
    cnpj: string
    cnpj_limpo: string
    nome: string
  } | null
  resultados: ProcessamentoArquivoResultado[]
}
