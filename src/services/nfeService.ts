import pb from '@/lib/pocketbase/client'
import type { NfeRecord, NfeItem, NfeAnalise, ProcessamentoLoteResponse } from '@/types/nfes'

export interface ListarNfesParams {
  cliente_id?: string
  tipo?: 'compra' | 'venda' | ''
  busca?: string
  limite?: number
  offset?: number
  nfe_id?: string
}

export interface ListarNfesResponse {
  success: boolean
  total_retornado: number
  nfes: NfeRecord[]
  itens?: NfeItem[]
  error?: string
}

export async function processarLoteNfe(
  arquivos: { nome: string; xml: string }[],
): Promise<ProcessamentoLoteResponse> {
  const url = `${pb.baseUrl}/backend/v1/nfe-processar-lote`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ arquivos }),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data: ProcessamentoLoteResponse = await res.json()
    return data
  } catch (err) {
    console.error('Falha ao processar lote de NFes:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro inesperado de comunicação com o servidor.',
      total_arquivos: arquivos.length,
      processadas_sucesso: 0,
      duplicadas: 0,
      erros: arquivos.length,
      total_itens: 0,
      valor_total_produtos: 0,
      valor_total_nf: 0,
      resultados: arquivos.map((a) => ({
        arquivo: a.nome,
        status: 'erro',
        motivo: err instanceof Error ? err.message : 'Falha na requisição.',
      })),
    }
  }
}

export async function listarNfes(params: ListarNfesParams = {}): Promise<ListarNfesResponse> {
  const query = new URLSearchParams()
  if (params.cliente_id) query.set('cliente_id', params.cliente_id)
  if (params.tipo) query.set('tipo', params.tipo)
  if (params.busca) query.set('busca', params.busca)
  if (params.limite) query.set('limite', String(params.limite))
  if (params.offset) query.set('offset', String(params.offset))
  if (params.nfe_id) query.set('nfe_id', params.nfe_id)

  const url = `${pb.baseUrl}/backend/v1/nfe-listar?${query.toString()}`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data: ListarNfesResponse = await res.json()
    return data
  } catch (err) {
    console.error('Falha ao listar NFes:', err)
    return {
      success: false,
      total_retornado: 0,
      nfes: [],
      itens: [],
      error: err instanceof Error ? err.message : 'Falha ao buscar NFes no servidor.',
    }
  }
}

export async function analisarNfeComAgentes(params: {
  nfe_id?: string
  chave_acesso?: string
}): Promise<{
  success: boolean
  nfe_id?: string
  analise_status?: string
  analise?: NfeAnalise
  error?: string
}> {
  const url = `${pb.baseUrl}/backend/v1/nfe-analisar`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    return data
  } catch (err) {
    console.error('Falha ao acionar agentes especialistas:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao comunicar com agentes nativos.',
    }
  }
}
