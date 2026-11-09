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
  RegimeHistoricoItem,
  RegistrarMudancaRegimeParams,
  ListarHistoricoFiltros,
  ResumoUltimaAlteracaoRegime,
} from '../types/regimeHistorico'

export { OPCOES_REGIME_TRIBUTARIO, type RegimeTributarioTipo } from '../types/cadastroEmpresas'

export const EVENTO_REGIME_HISTORICO_ATUALIZADO = 'adecont:regime-historico-atualizado'

const STORAGE_KEY_FALLBACK = 'adecont_regime_historico_cache'

export interface BadgeVisualInfo {
  label: string
  bg: string
  text: string
  border: string
}

/**
 * Retorna classes Tailwind de badge visual para cada regime tributário
 */
export function obterBadgeRegime(regime?: string | null): BadgeVisualInfo {
  const norm = (regime || '').trim().toLowerCase()
  if (!norm || norm === 'não informado') {
    return {
      label: 'Não informado',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
    }
  }
  if (norm.includes('híbrido') || norm.includes('hibrido')) {
    return {
      label: regime || 'Simples Híbrido',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-300',
    }
  }
  if (norm.includes('simples')) {
    return {
      label: regime || 'Simples Nacional',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
    }
  }
  if (norm.includes('presumido')) {
    return {
      label: regime || 'Lucro Presumido',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
    }
  }
  if (norm.includes('real')) {
    return {
      label: regime || 'Lucro Real',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
    }
  }
  if (norm.includes('ibs') || norm.includes('regular') || norm.includes('cbs')) {
    return {
      label: regime || 'Regime Regular IBS/CBS',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-300',
    }
  }
  return {
    label: regime || 'Regime',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
  }
}

/**
 * Retorna classes Tailwind de badge visual para cada origem de alteração
 */
export function obterBadgeOrigem(origem?: OrigemAlteracaoRegime | string): BadgeVisualInfo {
  switch (origem) {
    case 'listagem':
      return {
        label: 'Listagem Inline',
        bg: 'bg-cyan-50',
        text: 'text-cyan-800',
        border: 'border-cyan-300',
      }
    case 'ficha_cadastral':
      return {
        label: 'Ficha Cadastral',
        bg: 'bg-indigo-50',
        text: 'text-indigo-800',
        border: 'border-indigo-300',
      }
    case 'banner_diagnostico':
      return {
        label: 'Banner Diagnóstico',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-300',
      }
    case 'parametrizador':
      return {
        label: 'Parametrizador',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
      }
    default:
      return {
        label: origem ? String(origem) : 'ADECONT',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
      }
  }
}

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
 * Aceita tanto parâmetros camelCase quanto snake_case para compatibilidade.
 *
 * REGRA DE OURO: se o regime novo for idêntico ao regime anterior, NÃO grava.
 */
export async function registrarMudancaRegime(params: RegistrarMudancaRegimeParams): Promise<{
  sucesso: boolean
  gravou: boolean
  registro?: RegistroHistoricoRegime
  motivo?: string
}> {
  const regAnterior = params.regimeAnterior ?? params.regime_anterior ?? null
  const regNovo = params.regimeNovo ?? params.regime_novo ?? ''
  const empId = params.empresaId || params.empresa_id || ''
  const empCodigo = params.empresaCodigo ?? params.empresa_codigo
  const empNome = params.empresaNome || params.empresa_nome || ''
  const empDoc =
    params.empresaDocumento ||
    params.empresa_documento ||
    params.empresaCnpj ||
    params.empresa_cnpj ||
    ''
  const usuario = params.usuario || params.usuario_nome || 'ADECONT Operador'

  const anteriorNorm = normalizarNomeRegime(regAnterior)
  const novoNorm = normalizarNomeRegime(regNovo)

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
    empresa_id: empId,
    empresa_codigo: empCodigo,
    empresa_nome: empNome,
    empresa_documento: empDoc.replace(/\D/g, ''),
    regime_anterior: regAnterior || 'Não informado',
    regime_novo: regNovo,
    origem: params.origem,
    usuario,
    usuario_nome: usuario,
    data_hora: agoraIso,
    observacao: params.observacao || `Alteração via ${formatarOrigemAlteracao(params.origem)}`,
  }

  let gravado: RegistroHistoricoRegime = { ...payload }

  try {
    const record = await pb.collection('regime_historico').create({
      empresa_id: payload.empresa_id,
      empresa_codigo: payload.empresa_codigo,
      empresa_nome: payload.empresa_nome,
      empresa_documento: payload.empresa_documento,
      regime_anterior: payload.regime_anterior,
      regime_novo: payload.regime_novo,
      origem: payload.origem,
      usuario: payload.usuario,
      data_hora: payload.data_hora,
      observacao: payload.observacao,
    })
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
          empresaCodigo: empCodigo,
          empresaDocumento: payload.empresa_documento,
        },
      }),
    )
  }

  return { sucesso: true, gravou: true, registro: gravado }
}

/**
 * Alias de registrarMudancaRegime para componentes existentes
 */
export const registrarAlteracaoRegime = registrarMudancaRegime

/**
 * Busca o histórico de alterações de regime de um cliente específico
 * por código, documento limpo, CNPJ ou ID da empresa.
 */
export async function listarHistoricoRegimePorCliente(
  identificador: ListarHistoricoFiltros,
): Promise<RegistroHistoricoRegime[]> {
  const filtros: string[] = []

  const empCodigo = identificador.empresaCodigo ?? identificador.empresa_codigo
  const empDocRaw =
    identificador.empresaDocumento ||
    identificador.empresa_documento ||
    identificador.empresaCnpj ||
    identificador.empresa_cnpj
  const empId = identificador.empresaId || identificador.empresa_id
  const limite = identificador.limite

  if (empCodigo) {
    filtros.push(`empresa_codigo = ${empCodigo}`)
  }
  if (empDocRaw) {
    const docLimpo = empDocRaw.replace(/\D/g, '')
    if (docLimpo) {
      filtros.push(`empresa_documento = '${docLimpo}'`)
    }
  }
  if (empId) {
    filtros.push(`empresa_id = '${empId}'`)
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
        usuario_nome: r.usuario || 'ADECONT Operador',
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
    if (empCodigo && item.empresa_codigo === empCodigo) return true
    if (empDocRaw) {
      const doc = empDocRaw.replace(/\D/g, '')
      if (doc && item.empresa_documento === doc) return true
    }
    if (empId && item.empresa_id === empId) return true
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

  if (limite && limite > 0) {
    return combinados.slice(0, limite)
  }

  return combinados
}

/**
 * Alias de listarHistoricoRegimePorCliente
 */
export const listarHistoricoPorEmpresa = listarHistoricoRegimePorCliente

/**
 * Obtém o último registro de alteração de regime de um cliente
 */
export async function obterUltimaAlteracaoPorEmpresa(
  identificador: ListarHistoricoFiltros,
): Promise<RegistroHistoricoRegime | null> {
  const lista = await listarHistoricoPorEmpresa({ ...identificador, limite: 1 })
  return lista.length > 0 ? lista[0] : null
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
 * Alias de formatação de data/hora para auditoria
 */
export const formatarDataHoraAuditoria = formatarDataHoraRegime

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
