/**
 * Serviço de Trilha de Auditoria de Status/Situação Cadastral
 * Sistema ADECONT — Projeto Panorama
 *
 * Registra o motivo de inativações, reativações e alterações de status
 * com timestamp, operador e dados do cliente.
 * Salva no histórico unificado e despacha eventos para os componentes.
 */

import pb from '../lib/pocketbase/client'

export const EVENTO_STATUS_AUDITORIA_ATUALIZADO = 'adecont:status-auditoria-atualizado'

const STORAGE_KEY_AUDITORIA_STATUS = 'adecont_status_auditoria_historico'

export interface RegistroAuditoriaStatus {
  id?: string
  empresa_codigo: number
  empresa_nome?: string
  empresa_documento?: string
  status_anterior: string
  status_novo: string
  acao: 'inativar' | 'reativar' | 'alterar_status'
  motivo?: string
  usuario?: string
  data_hora: string
  created?: string
}

export interface RegistrarAuditoriaStatusParams {
  empresaCodigo: number
  empresaNome?: string
  empresaDocumento?: string
  statusAnterior: string
  statusNovo: string
  acao: 'inativar' | 'reativar' | 'alterar_status'
  motivo?: string
  usuario?: string
}

function lerCacheAuditoriaStatus(): RegistroAuditoriaStatus[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_AUDITORIA_STATUS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function salvarCacheAuditoriaStatus(lista: RegistroAuditoriaStatus[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY_AUDITORIA_STATUS, JSON.stringify(lista.slice(0, 200)))
  } catch {
    // quota exceeded ou inacessível
  }
}

/**
 * Registra formalmente a mudança individual ou em lote de status na auditoria.
 * Persiste em localStorage resiliente e tenta gravar na coleção regime_historico
 * (como observação estruturada) para unificação com o painel de auditoria do PocketBase.
 */
export async function registrarAuditoriaStatus(
  params: RegistrarAuditoriaStatusParams,
): Promise<{ sucesso: boolean; registro: RegistroAuditoriaStatus }> {
  const agoraIso = new Date().toISOString()
  const docLimpo = (params.empresaDocumento || '').replace(/\D/g, '')
  const usuario = params.usuario || 'ADECONT Operador'
  const motivoTexto = (params.motivo || '').trim() || 'Sem motivo especificado'

  const registro: RegistroAuditoriaStatus = {
    id: `status_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    empresa_codigo: params.empresaCodigo,
    empresa_nome: params.empresaNome || '',
    empresa_documento: docLimpo,
    status_anterior: params.statusAnterior,
    status_novo: params.statusNovo,
    acao: params.acao,
    motivo: motivoTexto,
    usuario,
    data_hora: agoraIso,
    created: agoraIso,
  }

  // Tenta persistir no PocketBase (coleção regime_historico)
  // usando o campo observacao para guardar a auditoria de status
  try {
    const pbRecord = await pb.collection('regime_historico').create({
      empresa_codigo: params.empresaCodigo,
      empresa_nome: params.empresaNome || '',
      empresa_documento: docLimpo,
      regime_anterior: `[Status: ${params.statusAnterior}]`,
      regime_novo: `[Status: ${params.statusNovo}]`,
      origem:
        params.acao === 'inativar'
          ? 'status_inativacao'
          : params.acao === 'reativar'
            ? 'status_reativacao'
            : 'status_individual',
      usuario,
      data_hora: agoraIso,
      observacao: `Alteração de Status: "${params.statusAnterior}" → "${params.statusNovo}". Motivo: ${motivoTexto}`,
    })
    registro.id = pbRecord.id
    registro.created = pbRecord.created
  } catch (err) {
    console.warn(
      '[statusAuditoria] PocketBase indisponível para registro de status, usando cache local:',
      err,
    )
  }

  // Atualiza cache local
  const cache = lerCacheAuditoriaStatus()
  cache.unshift(registro)
  salvarCacheAuditoriaStatus(cache)

  // Despacha evento para componentes ouvintes
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(EVENTO_STATUS_AUDITORIA_ATUALIZADO, {
          detail: { registro },
        }),
      )
    } catch {
      // ambiente sem CustomEvent
    }
  }

  return { sucesso: true, registro }
}

/**
 * Lista o histórico de auditoria de status de um cliente
 */
export function listarAuditoriaStatusPorCliente(codigo: number): RegistroAuditoriaStatus[] {
  const cache = lerCacheAuditoriaStatus()
  return cache.filter((item) => item.empresa_codigo === codigo)
}

/**
 * Limpa o cache de auditoria de status (útil para testes unitários)
 */
export function limparCacheAuditoriaStatus(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.removeItem(STORAGE_KEY_AUDITORIA_STATUS)
  } catch {
    // silencioso
  }
}
