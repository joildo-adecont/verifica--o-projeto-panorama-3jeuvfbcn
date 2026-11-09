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
import type { EmpresaRecord, SituacaoCadastroTipo } from '@/types/cadastroEmpresas'
import { EVENTO_SITUACAO_CLIENTE_ALTERADA } from '@/types/cadastroEmpresas'

export interface DadosEdicaoEmMassa {
  regime_tributario?: string
  municipio?: string
  uf?: string
}

export interface DadosAlteracaoStatusEmMassa {
  novaSituacao: SituacaoCadastroTipo | string
  motivo?: string
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
          empresaId: recordId,
          empresaCodigo: cliente.codigo,
          empresaNome: cliente.razao_social,
          empresaDocumento: cliente.documento_limpo || cliente.numero_documento,
          regimeAnterior: cliente.regime_tributario || '',
          regimeNovo: payload.regime_tributario,
          origem: 'listagem',
          observacao: 'Edição em massa no Cadastro Analítico de Clientes',
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
 * Altera a situação/status de múltiplos clientes em lote.
 *
 * Regras de negócio ADECONT:
 * - Se colecao for 'cadastro_empresas' e a nova situação for 'Inativa',
 *   executa a inativação formal (transfere para cadastro_empresas_inativos com motivo).
 * - Se colecao for 'cadastro_empresas_inativos' e a nova situação for 'Ativa',
 *   executa a reativação formal (transfere de volta para cadastro_empresas).
 * - Para demais situações ('Ativa', 'Suspensa', 'Baixada' na coleção ativa,
 *   ou 'Inativa', 'Suspensa', 'Baixada' na coleção inativa),
 *   atualiza o campo `situacao` diretamente no registro de cada cliente.
 * - Dispara evento EVENTO_SITUACAO_CLIENTE_ALTERADA para sincronização em tempo real.
 */
export async function alterarStatusClientesEmMassa(
  clientes: EmpresaRecord[],
  dados: DadosAlteracaoStatusEmMassa,
  colecao: 'cadastro_empresas' | 'cadastro_empresas_inativos' = 'cadastro_empresas',
): Promise<ResultadoOperacaoEmMassa> {
  const resultado: ResultadoOperacaoEmMassa = {
    totalSolicitado: clientes.length,
    sucessoCount: 0,
    falhaCount: 0,
    erros: [],
  }

  const novaSituacao = (dados.novaSituacao || '').trim()
  if (!novaSituacao) {
    return resultado
  }

  const motivo =
    (dados.motivo || '').trim() || `Alteração em massa de status para "${novaSituacao}"`

  for (const cliente of clientes) {
    try {
      // Caso 1: Na carteira ativa, mudar para 'Inativa' -> inativação formal via hook/serviço
      if (colecao === 'cadastro_empresas' && novaSituacao.toLowerCase() === 'inativa') {
        await inativarCliente(cliente.codigo, motivo)
        resultado.sucessoCount++
        continue
      }

      // Caso 2: Na carteira inativa, mudar para 'Ativa' -> reativação formal via hook/serviço
      if (colecao === 'cadastro_empresas_inativos' && novaSituacao.toLowerCase() === 'ativa') {
        await reativarCliente(cliente.codigo)
        resultado.sucessoCount++
        continue
      }

      // Caso 3: Atualização direta do campo situacao na respectiva coleção
      let recordId = cliente.id
      if (!recordId) {
        const item = await pb.collection(colecao).getFirstListItem(`codigo = ${cliente.codigo}`)
        recordId = item.id
      }

      await pb.collection(colecao).update(recordId, { situacao: novaSituacao })
      resultado.sucessoCount++
    } catch (err: any) {
      console.error(
        `[alterarStatusClientesEmMassa] Erro no cliente ${cliente.codigo} (${cliente.razao_social}):`,
        err,
      )
      resultado.falhaCount++
      resultado.erros.push({
        codigo: cliente.codigo,
        razaoSocial: cliente.razao_social,
        erro: err?.message || 'Falha ao alterar situação cadastral',
      })
    }
  }

  // Notifica ouvintes locais sobre a alteração de status
  if (resultado.sucessoCount > 0 && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(EVENTO_SITUACAO_CLIENTE_ALTERADA, {
          detail: {
            novaSituacao,
            motivo,
            totalAfetados: resultado.sucessoCount,
            colecao,
          },
        }),
      )
    } catch (e) {
      // Fallback silencioso se o ambiente não suportar CustomEvent
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
