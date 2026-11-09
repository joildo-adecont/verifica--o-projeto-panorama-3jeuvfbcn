/**
 * SERVIÇO DE OPERAÇÕES EM MASSA DE CLIENTES
 * ==========================================
 * Permite edição e movimentação em lote de clientes (ativos e inativos):
 * - Alteração em lote de Regime Tributário, Município e UF
 * - Inativação em lote (transfere de cadastro_empresas para cadastro_empresas_inativos)
 * - Reativação em lote (transfere de cadastro_empresas_inativos para cadastro_empresas)
 * - Registro de histórico para auditoria no sistema
 */
import pb from '@/lib/pocketbase/client'
import { inativarCliente, reativarCliente } from '@/services/cadastroEmpresasInativos'
import { registrarAlteracaoRegime } from '@/services/regimeHistoricoService'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

export interface DadosEdicaoEmMassa {
  regime_tributario?: string
  municipio?: string
  uf?: string
}

export interface ResultadoOperacaoEmMassa {
  totalSolicitado: number
  sucessoCount: number
  falhaCount: number
  erros: { codigo: number; razaoSocial?: string; erro: string }[]
}

/**
 * Atualiza campos comuns de múltiplos clientes em lote.
 * Suporta a coleção ativa ('cadastro_empresas') ou inativa ('cadastro_empresas_inativos').
 */
export async function editarClientesEmMassa(
  clientes: EmpresaRecord[],
  dados: DadosEdicaoEmMassa,
  colecao: 'cadastro_empresas' | 'cadastro_empresas_inativos' = 'cadastro_empresas',
): Promise<ResultadoOperacaoEmMassa> {
  const resultado: ResultadoOperacaoEmMassa = {
    totalSolicitado: clientes.length,
    sucessoCount: 0,
    falhaCount: 0,
    erros: [],
  }

  // Prepara o payload com apenas os campos fornecidos
  const payload: Record<string, any> = {}
  if (dados.regime_tributario !== undefined && dados.regime_tributario !== '') {
    payload.regime_tributario = dados.regime_tributario.trim()
  }
  if (dados.municipio !== undefined && dados.municipio !== '') {
    payload.municipio = dados.municipio.trim()
  }
  if (dados.uf !== undefined && dados.uf !== '') {
    payload.uf = dados.uf.trim().toUpperCase()
  }

  if (Object.keys(payload).length === 0) {
    return resultado
  }

  for (const cliente of clientes) {
    try {
      let recordId = cliente.id

      // Se não temos o ID direto do PB, busca pelo código
      if (!recordId) {
        const item = await pb.collection(colecao).getFirstListItem(`codigo = ${cliente.codigo}`)
        recordId = item.id
      }

      await pb.collection(colecao).update(recordId, payload)
      resultado.sucessoCount++

      // Se houve alteração de regime, registra histórico de auditoria
      if (payload.regime_tributario && payload.regime_tributario !== cliente.regime_tributario) {
        registrarAlteracaoRegime({
          empresa_id: recordId,
          codigo: cliente.codigo,
          razao_social: cliente.razao_social,
          documento_limpo: cliente.documento_limpo,
          regime_anterior: cliente.regime_tributario || '',
          regime_novo: payload.regime_tributario,
          motivo: 'Edição em massa no Cadastro Analítico de Clientes',
        }).catch((err) => {
          console.warn('[editarClientesEmMassa] Erro ao registrar auditoria:', err)
        })
      }
    } catch (err: any) {
      console.error(`[editarClientesEmMassa] Erro no cliente ${cliente.codigo}:`, err)
      resultado.falhaCount++
      resultado.erros.push({
        codigo: cliente.codigo,
        razaoSocial: cliente.razao_social,
        erro: err?.message || 'Falha ao atualizar registro',
      })
    }
  }

  return resultado
}

/**
 * Inativa múltiplos clientes em lote.
 */
export async function inativarClientesEmMassa(
  clientes: EmpresaRecord[],
  motivo?: string,
): Promise<ResultadoOperacaoEmMassa> {
  const resultado: ResultadoOperacaoEmMassa = {
    totalSolicitado: clientes.length,
    sucessoCount: 0,
    falhaCount: 0,
    erros: [],
  }

  for (const cliente of clientes) {
    try {
      await inativarCliente(
        cliente.codigo,
        motivo || 'Inativação em massa pelo Cadastro Analítico de Clientes',
      )
      resultado.sucessoCount++
    } catch (err: any) {
      console.error(`[inativarClientesEmMassa] Erro no cliente ${cliente.codigo}:`, err)
      resultado.falhaCount++
      resultado.erros.push({
        codigo: cliente.codigo,
        razaoSocial: cliente.razao_social,
        erro: err?.message || 'Falha ao inativar cliente',
      })
    }
  }

  return resultado
}

/**
 * Reativa múltiplos clientes em lote.
 */
export async function reativarClientesEmMassa(
  clientes: EmpresaRecord[],
): Promise<ResultadoOperacaoEmMassa> {
  const resultado: ResultadoOperacaoEmMassa = {
    totalSolicitado: clientes.length,
    sucessoCount: 0,
    falhaCount: 0,
    erros: [],
  }

  for (const cliente of clientes) {
    try {
      await reativarCliente(cliente.codigo)
      resultado.sucessoCount++
    } catch (err: any) {
      console.error(`[reativarClientesEmMassa] Erro no cliente ${cliente.codigo}:`, err)
      resultado.falhaCount++
      resultado.erros.push({
        codigo: cliente.codigo,
        razaoSocial: cliente.razao_social,
        erro: err?.message || 'Falha ao reativar cliente',
      })
    }
  }

  return resultado
}
