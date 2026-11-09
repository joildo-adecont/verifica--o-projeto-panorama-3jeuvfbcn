/**
 * SERVIÇO DE INTEGRAÇÃO COM MAILCHIMP (MODO "CADA USUÁRIO A SUA CONTA")
 * ====================================================================
 * Utiliza o toolkit 'mailchimp' via skipConnectors (Composio) do Skip Cloud.
 *
 * Ferramentas do conector:
 * - MAILCHIMP_GET_LISTS_INFO: busca audiências/listas da conta conectada.
 * - MAILCHIMP_BATCH_SUBSCRIBE_OR_UNSUBSCRIBE: adiciona ou atualiza membros em lote
 *   com status padrão 'pending' (double opt-in) ou 'subscribed' se solicitado.
 * - Fallback / upsert individual com MAILCHIMP_ADD_OR_UPDATE_LIST_MEMBER se necessário.
 */

import { execute } from '@/lib/skipConnectors'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

export interface MailchimpAudience {
  id: string
  name: string
  total_members?: number
  stats?: {
    member_count?: number
    unsubscribe_count?: number
    cleaned_count?: number
  }
}

export interface SyncMailchimpOptions {
  listId: string
  status?: 'pending' | 'subscribed'
  incluirInativos?: boolean
  atualizarExistentes?: boolean
}

export interface SyncMailchimpResult {
  totalClientesAnalisados: number
  totalSemEmail: number
  totalInscritosEnviados: number
  totalAtualizados: number
  totalErros: number
  mensagensErros: string[]
  dataHora: string
  audienciaId: string
  audienciaNome?: string
}

export interface MailchimpSyncHistoryEntry {
  id: string
  dataHora: string
  audienciaId: string
  audienciaNome: string
  totalClientesAnalisados: number
  totalComEmail: number
  totalSemEmail: number
  totalSucessos: number
  totalErros: number
  incluiuInativos: boolean
  statusOptIn: string
}

const STORAGE_KEY_HISTORY = 'adecont_mailchimp_sync_history'

/**
 * Validação básica e sanitização de e-mail
 */
export function extrairEmailValido(rawEmail?: string | null): string | null {
  if (!rawEmail) return null
  const cleaned = rawEmail.trim().toLowerCase()
  // Pode conter múltiplos emails separados por vírgula ou ponto-e-vírgula
  const primeiro = cleaned.split(/[,;\s]+/)[0]
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(primeiro)) {
    return primeiro
  }
  return null
}

/**
 * Separa primeiro nome e sobrenome a partir da razão social ou nome fantasia
 */
export function extrairNomes(cliente: EmpresaRecord): { firstName: string; lastName: string } {
  const nomeCompleto = (
    cliente.nome_fantasia ||
    cliente.razao_social ||
    cliente.nome ||
    cliente.apelido ||
    'Cliente ADECONT'
  ).trim()

  const partes = nomeCompleto.split(/\s+/).filter(Boolean)
  if (partes.length === 0) {
    return { firstName: 'Cliente', lastName: 'ADECONT' }
  }
  if (partes.length === 1) {
    return { firstName: partes[0], lastName: '' }
  }
  return {
    firstName: partes[0],
    lastName: partes.slice(1).join(' '),
  }
}

/**
 * Lista as audiências (lists) da conta do Mailchimp conectada pelo usuário
 */
export async function listarAudienciasMailchimp(): Promise<{
  sucesso: boolean
  audiencias: MailchimpAudience[]
  erro?: string
}> {
  try {
    const res = await execute('MAILCHIMP_GET_LISTS_INFO', {
      count: 100,
    })

    if (!res.successful) {
      return {
        sucesso: false,
        audiencias: [],
        erro: res.error || 'Não foi possível buscar as audiências no Mailchimp.',
      }
    }

    const data: any = res.data
    // A API do Mailchimp retorna `{ lists: [ ... ] }` ou a chave pode vir aninhada em `data.lists`
    const listsRaw =
      data?.lists ||
      data?.response_data?.lists ||
      data?.data?.lists ||
      (Array.isArray(data) ? data : [])

    const audiencias: MailchimpAudience[] = (listsRaw as any[]).map((l: any) => ({
      id: String(l.id || ''),
      name: String(l.name || 'Audiência sem nome'),
      total_members: l.stats?.member_count ?? l.member_count ?? 0,
      stats: {
        member_count: l.stats?.member_count ?? 0,
        unsubscribe_count: l.stats?.unsubscribe_count ?? 0,
        cleaned_count: l.stats?.cleaned_count ?? 0,
      },
    }))

    return {
      sucesso: true,
      audiencias,
    }
  } catch (err: any) {
    return {
      sucesso: false,
      audiencias: [],
      erro: err?.message || 'Erro inesperado ao conectar à API do Mailchimp.',
    }
  }
}

/**
 * Sincroniza a carteira de clientes com a audiência selecionada.
 * Divide em lotes de até 50 contatos para respeitar limites da API do Mailchimp.
 */
export async function sincronizarClientesComMailchimp(
  clientes: EmpresaRecord[],
  options: SyncMailchimpOptions,
  onProgresso?: (progresso: { atual: number; total: number; mensagem: string }) => void,
): Promise<SyncMailchimpResult> {
  const result: SyncMailchimpResult = {
    totalClientesAnalisados: clientes.length,
    totalSemEmail: 0,
    totalInscritosEnviados: 0,
    totalAtualizados: 0,
    totalErros: 0,
    mensagensErros: [],
    dataHora: new Date().toISOString(),
    audienciaId: options.listId,
  }

  // Filtrar e preparar os membros válidos
  interface MembroBatch {
    email_address: string
    status: 'pending' | 'subscribed'
    merge_fields: {
      FNAME: string
      LNAME: string
      EMPRESA?: string
      CNPJ?: string
      REGIME?: string
      CIDADE?: string
      UF?: string
    }
  }

  const membrosValidos: MembroBatch[] = []
  const emailsJaAdicionados = new Set<string>()

  for (const c of clientes) {
    const email = extrairEmailValido(c.email)
    if (!email) {
      result.totalSemEmail++
      continue
    }

    if (emailsJaAdicionados.has(email)) {
      // Ignorar duplicados no mesmo lote
      continue
    }
    emailsJaAdicionados.add(email)

    const { firstName, lastName } = extrairNomes(c)
    membrosValidos.push({
      email_address: email,
      status: options.status || 'pending',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        EMPRESA: (c.razao_social || c.nome || '').substring(0, 50),
        CNPJ: (c.numero_documento || '').substring(0, 20),
        REGIME: (c.regime_tributario || '').substring(0, 30),
        CIDADE: (c.municipio || '').substring(0, 40),
        UF: (c.uf || '').substring(0, 2),
      },
    })
  }

  if (membrosValidos.length === 0) {
    return result
  }

  // Lotes de 50 membros
  const BATCH_SIZE = 50
  const totalLotes = Math.ceil(membrosValidos.length / BATCH_SIZE)

  for (let i = 0; i < totalLotes; i++) {
    const lote = membrosValidos.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    onProgresso?.({
      atual: i + 1,
      total: totalLotes,
      mensagem: `Enviando lote ${i + 1} de ${totalLotes} (${lote.length} contatos)...`,
    })

    try {
      const res = await execute('MAILCHIMP_BATCH_SUBSCRIBE_OR_UNSUBSCRIBE', {
        list_id: options.listId,
        members: lote,
        update_existing: options.atualizarExistentes ?? true,
      })

      if (!res.successful) {
        result.totalErros += lote.length
        result.mensagensErros.push(`Lote ${i + 1}: ${res.error || 'Falha no envio do lote'}`)
      } else {
        const data: any = res.data
        const newMembers = data?.new_members || data?.response_data?.new_members || []
        const updatedMembers = data?.updated_members || data?.response_data?.updated_members || []
        const errors = data?.errors || data?.response_data?.errors || []

        if (Array.isArray(newMembers) && newMembers.length > 0) {
          result.totalInscritosEnviados += newMembers.length
        }
        if (Array.isArray(updatedMembers) && updatedMembers.length > 0) {
          result.totalAtualizados += updatedMembers.length
        }
        if (Array.isArray(errors) && errors.length > 0) {
          result.totalErros += errors.length
          errors.slice(0, 3).forEach((errItem: any) => {
            result.mensagensErros.push(
              `${errItem.email_address || 'E-mail'}: ${errItem.error || 'Erro no item'}`,
            )
          })
        }

        // Se a API não separou new/updated mas deu sucesso geral
        if (!newMembers.length && !updatedMembers.length && !errors.length) {
          result.totalInscritosEnviados += lote.length
        }
      }
    } catch (err: any) {
      result.totalErros += lote.length
      result.mensagensErros.push(`Lote ${i + 1}: ${err?.message || 'Erro inesperado'}`)
    }
  }

  return result
}

/**
 * Lê o histórico de sincronizações salvo localmente
 */
export function carregarHistoricoSincronizacoes(): MailchimpSyncHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Salva uma nova entrada no histórico de sincronizações
 */
export function salvarEntradaHistorico(entrada: Omit<MailchimpSyncHistoryEntry, 'id'>): void {
  try {
    const historico = carregarHistoricoSincronizacoes()
    const novaEntrada: MailchimpSyncHistoryEntry = {
      ...entrada,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    }
    const atualizado = [novaEntrada, ...historico].slice(0, 50)
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(atualizado))
  } catch (err) {
    console.warn('Não foi possível gravar o histórico de sincronização:', err)
  }
}

/**
 * Limpa todo o histórico de sincronizações local
 */
export function limparHistoricoSincronizacoes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY)
  } catch {
    // noop
  }
}
