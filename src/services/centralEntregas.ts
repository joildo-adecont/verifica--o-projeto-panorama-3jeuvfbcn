/**
 * SERVIÇO DA CENTRAL DE ENTREGAS — persistência dos relatórios dos agentes
 * Sistema ADECONT — Projeto Panorama
 *
 * Cada relatório exportado/entregue é gravado na coleção `entregas_agentes`
 * (migration 0160) e listado na tela "Central de Entregas de Agentes"
 * (#central-entregas-agentes), com visualização e re-exportação.
 */
import pb from '@/lib/pocketbase/client'
import type { BlocoRelatorio } from '@/services/relatorioAgenteParser'
import type { SegmentoEspecialista } from '@/services/agenteEspecialista'

export const COLECAO_ENTREGAS = 'entregas_agentes'

export interface EntregaAgente {
  id: string
  agente_segmento: SegmentoEspecialista
  agente_nome: string
  titulo: string
  tipo_conteudo: string
  /** JSON string com o array de blocos estruturados do relatório */
  conteudo_json: string
  pergunta_origem: string
  created: string
  updated: string
}

export interface NovaEntregaParams {
  agenteSegmento: SegmentoEspecialista
  agenteNome: string
  titulo: string
  tipoConteudo: string
  blocos: BlocoRelatorio[]
  perguntaOrigem?: string
}

/** Grava a entrega na coleção entregas_agentes (não bloqueia a exportação se falhar). */
export async function registrarEntrega(params: NovaEntregaParams): Promise<EntregaAgente | null> {
  const payload = {
    agente_segmento: params.agenteSegmento,
    agente_nome: params.agenteNome,
    titulo: params.titulo,
    tipo_conteudo: params.tipoConteudo,
    conteudo_json: JSON.stringify(params.blocos),
    pergunta_origem: params.perguntaOrigem || '',
  }
  try {
    // caminho preferencial: hook de backend (centralizado, tolerante a falhas)
    const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/central-entregas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.ok) {
        return {
          ...payload,
          id: data.id,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        } as EntregaAgente
      }
      console.warn('[CentralEntregas] hook respondeu erro:', data?.error)
    }
  } catch (e) {
    console.warn('[CentralEntregas] falha no hook, tentando SDK direto:', e)
  }

  // fallback: grava direto pela coleção (regras públicas da migração 0160)
  try {
    const rec = await pb.collection(COLECAO_ENTREGAS).create(payload)
    return rec as unknown as EntregaAgente
  } catch (e) {
    console.warn('[CentralEntregas] falha ao registrar entrega:', e)
    return null
  }
}

/** Lista as entregas mais recentes primeiro. */
export async function listarEntregas(limite = 100): Promise<EntregaAgente[]> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/central-entregas?limit=${limite}`,
      {
        headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
      },
    )
    if (res.ok) {
      const data = await res.json()
      if (data?.ok && Array.isArray(data.entregas)) return data.entregas as EntregaAgente[]
      console.warn('[CentralEntregas] hook respondeu erro ao listar:', data?.error)
    }
  } catch (e) {
    console.warn('[CentralEntregas] falha no hook de listagem, tentando SDK direto:', e)
  }

  // fallback: lista direto pela coleção
  try {
    const res = await pb.collection(COLECAO_ENTREGAS).getList(1, limite, { sort: '-created' })
    return res.items as unknown as EntregaAgente[]
  } catch (e) {
    console.warn('[CentralEntregas] falha ao listar entregas:', e)
    return []
  }
}

/** Lê os blocos estruturados de uma entrega (tolerante a JSON inválido). */
export function blocosDaEntrega(entrega: EntregaAgente): BlocoRelatorio[] {
  try {
    const parsed = JSON.parse(entrega.conteudo_json || '[]')
    return Array.isArray(parsed) ? (parsed as BlocoRelatorio[]) : []
  } catch {
    return []
  }
}

/** Apaga uma entrega (arquivamento do usuário). */
export async function excluirEntrega(id: string): Promise<boolean> {
  try {
    await pb.collection(COLECAO_ENTREGAS).delete(id)
    return true
  } catch (e) {
    console.warn('[CentralEntregas] falha ao excluir entrega:', e)
    return false
  }
}
