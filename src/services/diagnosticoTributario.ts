/**
 * Serviço do Diagnóstico Tributário ADECONT
 * Comunicação com o Agente Inteligente Skip Cloud ($ai.agent('diagnostico-tributario'))
 * e persistência das sessões na coleção 'diagnostico_sessoes'.
 */
import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  type AgentCitation,
  type StreamAgentChatHandlers,
  type StreamAgentChatResult,
} from '@/lib/skipAi'

export interface MensagemDiagnostico {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AgentCitation[]
  created: string
}

export interface LinhaComparativoAliquota {
  regime: string
  cbs: number
  ibs: number
  total: number
  diferencaRef: number
  baseLegal: string
  observacao: string
}

export interface SessaoDiagnostico {
  id?: string
  titulo: string
  tema?: string
  ato_analisado?: string
  conversation_id?: string
  tipo_analise?: 'geral' | 'ato_normativo' | 'interligacoes' | 'debate_ceo'
  parecer_resumido?: string
  pontos_atencao?: string
  passo_a_passo?: string
  dados_tabela?: LinhaComparativoAliquota[]
  relatorio_consolidado?: string
  autor_email?: string
  data_sessao?: string
  created?: string
  updated?: string
}

export interface ChatDiagnosticoResponse {
  conversation_id: string
  content: string
  citations?: AgentCitation[]
  message_id: string
  iterations?: number
}

/**
 * Envia uma mensagem síncrona ao Agente Skip Cloud
 */
export async function enviarMensagemDiagnostico(params: {
  message: string
  conversationId?: string | null
}): Promise<ChatDiagnosticoResponse> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/diagnostico-tributario/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({
        message: params.message,
        conversation_id: params.conversationId || null,
        stream: false,
      }),
    },
  )

  if (!res.ok) {
    let errMsg = `Erro no agente (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) errMsg = data.error
    } catch {
      /* intentionally ignored */
    }
    throw new Error(errMsg)
  }

  return (await res.json()) as ChatDiagnosticoResponse
}

/**
 * Envia mensagem via SSE streaming ao Agente Skip Cloud usando as rotinas nativas de skipAi
 */
export async function enviarMensagemDiagnosticoStream(params: {
  message: string
  conversationId?: string | null
  handlers: StreamAgentChatHandlers
}): Promise<StreamAgentChatResult> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/diagnostico-tributario/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({
        message: params.message,
        conversation_id: params.conversationId || null,
        stream: true,
      }),
      signal: params.handlers.signal,
    },
  )

  return await streamAgentChat(res, params.handlers)
}

/**
 * Carrega a lista de sessões salvas no banco
 */
export async function listarSessoesDiagnostico(): Promise<SessaoDiagnostico[]> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/diagnostico-tributario/sessoes`,
      {
        headers: {
          ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
        },
      },
    )
    if (!res.ok) throw new Error(`Falha ${res.status}`)
    const data = await res.json()
    return (data?.items || []) as SessaoDiagnostico[]
  } catch (err) {
    console.warn('Erro ao carregar sessões de diagnóstico:', err)
    return []
  }
}

/**
 * Salva ou atualiza uma sessão de diagnóstico no banco
 */
export async function salvarSessaoDiagnostico(
  sessao: Partial<SessaoDiagnostico>,
): Promise<{ id: string; success: boolean }> {
  const res = await fetch(
    `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/diagnostico-tributario/sessoes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify(sessao),
    },
  )

  if (!res.ok) {
    let errMsg = `Falha ao salvar sessão (${res.status})`
    try {
      const data = await res.json()
      if (data?.error) errMsg = data.error
    } catch {
      /* intentionally ignored */
    }
    throw new Error(errMsg)
  }

  return (await res.json()) as { id: string; success: boolean }
}

/**
 * Exporta dados de comparativo e parecer para CSV compatível com Excel (BOM UTF-8, ponto e vírgula)
 */
export function exportarDiagnosticoCsv(params: {
  titulo: string
  atoOuTema: string
  parecer: string
  pontosAtencao: string
  passoAPasso: string
  linhasTabela: LinhaComparativoAliquota[]
}) {
  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""'
    const s = String(val)
      .replace(/"/g, '""')
      .replace(/\r\n|\n|\r/g, ' ')
    return `"${s}"`
  }

  const cabecalhoInstitucional = [
    ['ADECONT — Assessoria Contábil e Administrativa'],
    ['DIAGNÓSTICO TRIBUTÁRIO — RELATÓRIO EXECUTIVO E COMPARATIVO'],
    [`Título: ${params.titulo}`],
    [`Matéria / Ato Analisado: ${params.atoOuTema}`],
    [
      `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
    ],
    [''],
    ['1. PARECER RESUMIDO'],
    [params.parecer || 'Não informado'],
    [''],
    ['2. PONTOS DE ATENÇÃO (JURÍDICO, CONTÁBIL E FUSÃO ADMINISTRATIVA)'],
    [params.pontosAtencao || 'Não informado'],
    [''],
    ['3. ORIENTAÇÕES E PASSO A PASSO PARA IMPLEMENTAÇÃO'],
    [params.passoAPasso || 'Não informado'],
    [''],
    ['4. COMPARATIVO DE ALÍQUOTAS E CÁLCULOS'],
    [
      'Regime / Setor',
      'CBS Federal (%)',
      'IBS Est./Mun. (%)',
      'Total IVA Dual (%)',
      'Diferença Ref. 26,50%',
      'Capitulação Legal',
      'Observação Prática',
    ],
  ]

  const linhasCsv = cabecalhoInstitucional.map((l) => l.map(escapeCsv).join(';'))

  if (params.linhasTabela && params.linhasTabela.length > 0) {
    for (const row of params.linhasTabela) {
      const colunas = [
        escapeCsv(row.regime),
        escapeCsv(row.cbs.toFixed(2).replace('.', ',') + '%'),
        escapeCsv(row.ibs.toFixed(2).replace('.', ',') + '%'),
        escapeCsv(row.total.toFixed(2).replace('.', ',') + '%'),
        escapeCsv(
          (row.diferencaRef > 0 ? '+' : '') + row.diferencaRef.toFixed(2).replace('.', ',') + '%',
        ),
        escapeCsv(row.baseLegal),
        escapeCsv(row.observacao),
      ]
      linhasCsv.push(colunas.join(';'))
    }
  }

  const csvContent = '\uFEFF' + linhasCsv.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeNome = (params.titulo || 'diagnostico_tributario').replace(/[^a-zA-Z0-9]/g, '_')
  link.href = url
  link.download = `ADECONT_Diagnostico_${safeNome}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
