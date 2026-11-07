/**
 * Serviço de Trilha de Auditoria de Regime Tributário
 * Sistema ADECONT — Projeto Panorama
 *
 * Registra formalmente no PocketBase (coleção regime_historico) toda alteração
 * realizada na listagem inline, na Ficha Cadastral ou no banner do diagnóstico.
 * Possui fallback gracioso em memória/localStorage para resiliência offline.
 */

import pb from '../lib/pocketbase/client'
import type {
  OrigemAlteracaoRegime,
  RegistroHistoricoRegime,
  RegistrarMudancaRegimeParams,
  ResumoUltimaAlteracaoRegime,
} from '../types/regimeHistorico'

export const EVENTO_REGIME_HISTORICO_ATUALIZADO = 'adecont:regime-historico-atualizado'

const STORAGE_KEY_FALLBACK = 'adecont_regime_historico_cache'

/**
 * Mapeia a origem técnica para descrição legível em relatórios e telas
 */
export function formatarOrigemAlteracao(origem: OrigemAlteracaoRegime | string): string {
  switch (origem) {
    case 'listagem':
      return 'Listagem de Clientes (Inline)'
    case 'ficha_cadastral':
      return 'Ficha Cadastral do Cliente'
    case 'banner_diagnostico':
      return 'Banner do Diagnóstico Tributário'
    case 'parametrizador':
      return 'Parametrizador Tributário'
    default:
      return origem || 'Sistema ADECONT'
  }
}

/**
 * Lê o fallback local em caso de backend indisponível ou execução em ambiente de testes
 */
function lerCacheLocal(): RegistroHistoricoRegime[] {
  if (typeof window === 'undefined' || !window.localStorage) return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_FALLBACK)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function salvarCacheLocal(lista: RegistroHistoricoRegime[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY_FALLBACK, JSON.stringify(lista.slice(0, 100)))
  } catch {
    // quota exceeded ou inacessível
  }
}

/**
 * Normaliza string de regime para comparação segura (case/trim)
 */
export function normalizarNomeRegime(regime?: string | null): string {
  if (!regime) return ''
  return regime.trim()
}

/**
 * Registra uma alteração de regime tributário no histórico de auditoria.
 *
 * REGRA DE OURO: se o regime novo for idêntico ao regime anterior, NÃO grava.
 */
export async function registrarMudancaRegime(params: RegistrarMudancaRegimeParams): Promise<{
  sucesso: boolean
  gravou: boolean
  registro?: RegistroHistoricoRegime
  motivo?: string
}> {
  const anteriorNorm = normalizarNomeRegime(params.regimeAnterior)
  const novoNorm = normalizarNomeRegime(params.regimeNovo)

  // Deduplicação: se o regime anterior for idêntico ao novo, ignora
  if (anteriorNorm && novoNorm && anteriorNorm.toLowerCase() === novoNorm.toLowerCase()) {
    return {
      sucesso: true,
      gravou: false,
      motivo: 'Regime não foi alterado (mesmo valor anterior e novo).',
    }
  }

  const agoraIso = new Date().toISOString()
  const payload: RegistroHistoricoRegime = {
    empresa_id: params.empresaId || '',
    empresa_codigo: params.empresaCodigo,
    empresa_nome: params.empresaNome || '',
    empresa_documento: (params.empresaDocumento || '').replace(/\D/g, ''),
    regime_anterior: params.regimeAnterior || 'Não informado',
    regime_novo: params.regimeNovo,
    origem: params.origem,
    usuario: params.usuario || 'ADECONT Operador',
    data_hora: agoraIso,
    observacao: params.observacao || `Alteração via ${formatarOrigemAlteracao(params.origem)}`,
  }

  let gravado: RegistroHistoricoRegime = { ...payload }

  try {
    const record = await pb.collection('regime_historico').create(payload)
    gravado = {
      ...payload,
      id: record.id,
      created: record.created,
      updated: record.updated,
    }
  } catch (erro) {
    console.warn('[regimeHistorico] Falha ao persistir no PocketBase, usando cache local:', erro)
    gravado.id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    gravado.created = agoraIso
  }

  // Atualiza cache local
  const cache = lerCacheLocal()
  cache.unshift(gravado)
  salvarCacheLocal(cache)

  // Notifica componentes
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENTO_REGIME_HISTORICO_ATUALIZADO, {
        detail: {
          registro: gravado,
          empresaCodigo: params.empresaCodigo,
          empresaDocumento: payload.empresa_documento,
        },
      }),
    )
  }

  return { sucesso: true, gravou: true, registro: gravado }
}

/**
 * Busca o histórico de alterações de regime de um cliente específico
 * por código, documento limpo ou ID da empresa.
 */
export async function listarHistoricoRegimePorCliente(identificador: {
  empresaId?: string
  empresaCodigo?: number
  empresaDocumento?: string
}): Promise<RegistroHistoricoRegime[]> {
  const filtros: string[] = []

  if (identificador.empresaCodigo) {
    filtros.push(`empresa_codigo = ${identificador.empresaCodigo}`)
  }
  if (identificador.empresaDocumento) {
    const docLimpo = identificador.empresaDocumento.replace(/\D/g, '')
    if (docLimpo) {
      filtros.push(`empresa_documento = '${docLimpo}'`)
    }
  }
  if (identificador.empresaId) {
    filtros.push(`empresa_id = '${identificador.empresaId}'`)
  }

  let registrosPb: RegistroHistoricoRegime[] = []

  if (filtros.length > 0) {
    try {
      const filterExpr = filtros.join(' || ')
      const records = await pb.collection('regime_historico').getFullList({
        filter: filterExpr,
        sort: '-created',
      })
      registrosPb = records.map((r) => ({
        id: r.id,
        empresa_id: r.empresa_id,
        empresa_codigo: r.empresa_codigo,
        empresa_nome: r.empresa_nome,
        empresa_documento: r.empresa_documento,
        regime_anterior: r.regime_anterior,
        regime_novo: r.regime_novo,
        origem: (r.origem as OrigemAlteracaoRegime) || 'ficha_cadastral',
        usuario: r.usuario,
        data_hora: r.data_hora || r.created,
        observacao: r.observacao,
        created: r.created,
        updated: r.updated,
      }))
    } catch (e) {
      console.warn('[regimeHistorico] Falha ao consultar PocketBase, recorrendo ao cache:', e)
    }
  }

  // Mescla com cache local para resiliência sem duplicar IDs
  const local = lerCacheLocal().filter((item) => {
    if (identificador.empresaCodigo && item.empresa_codigo === identificador.empresaCodigo)
      return true
    if (identificador.empresaDocumento) {
      const doc = identificador.empresaDocumento.replace(/\D/g, '')
      if (doc && item.empresa_documento === doc) return true
    }
    if (identificador.empresaId && item.empresa_id === identificador.empresaId) return true
    return false
  })

  const idsVistos = new Set(registrosPb.map((r) => r.id).filter(Boolean))
  const combinados = [...registrosPb]
  for (const item of local) {
    if (item.id && !idsVistos.has(item.id)) {
      combinados.push(item)
      idsVistos.add(item.id)
    }
  }

  // Ordena cronologicamente decrescente
  combinados.sort((a, b) => {
    const da = new Date(a.created || a.data_hora || 0).getTime()
    const db = new Date(b.created || b.data_hora || 0).getTime()
    return db - da
  })

  return combinados
}

/**
 * Formata data/hora brasileira amigável
 */
export function formatarDataHoraRegime(isoOuData?: string | null): string {
  if (!isoOuData) return '—'
  try {
    const d = new Date(isoOuData)
    if (isNaN(d.getTime())) return isoOuData
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoOuData
  }
}

/**
 * Obtém resumo da última alteração de regime para uso no Diagnóstico e Parecer
 */
export function obterResumoUltimaAlteracao(
  historico: RegistroHistoricoRegime[],
): ResumoUltimaAlteracaoRegime {
  if (!historico || historico.length === 0) {
    return {
      temHistorico: false,
      totalAlteracoes: 0,
      ultimoRegistro: null,
    }
  }

  const ultimo = historico[0]
  const dataFormatada = formatarDataHoraRegime(ultimo.data_hora || ultimo.created)

  return {
    temHistorico: true,
    totalAlteracoes: historico.length,
    ultimoRegistro: ultimo,
    dataUltimaAlteracaoFormatada: dataFormatada,
    dataEntradaRegimeAtualFormatada: dataFormatada,
    regimeAnterior: ultimo.regime_anterior,
    regimeAtual: ultimo.regime_novo,
    origemTexto: formatarOrigemAlteracao(ultimo.origem),
  }
}

/**
 * Limpa o cache local (usado em testes ou redefinição)
 */
export function limparCacheLocalHistorico(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_FALLBACK)
    } catch {
      /* intentionally ignored */
    }
  }
}
