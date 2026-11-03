/**
 * Serviço de Jurisprudências — acervo próprio do escritório.
 *
 * ── POR QUE O TOKEN VEM DE localStorage ──
 * As rotas exigem X-Painel-Token. O token do painel fica em
 * `adecont_painel_token` (o mesmo da Seção 9A). Se estiver ausente, o erro é
 * "Faça login no sistema ADECONT antes" — nunca uma lista vazia silenciosa, que
 * faria o usuário achar que o acervo está vazio quando está sem credencial.
 */

const TOKEN_KEY = 'adecont_painel_token'

export interface Jurisprudencia {
  id: string
  titulo: string
  tribunal: string
  orgao_julgador: string
  tipo_decisao: string
  numero: string
  processo: string
  relator: string
  data_julgamento: string
  data_publicacao: string
  materia: string
  tese: string
  ementa: string
  aplicacao_pratica: string
  dispositivos: string
  palavras_chave: string
  origem: string
  fonte_url: string
  situacao: 'rascunho' | 'revisar' | 'publicada' | 'arquivada'
  destaque: boolean
  publicado_em: string
  criado_por: string
  created: string
  updated: string
}

export interface ResumoJuris {
  por_situacao: Record<string, number>
  por_tribunal: Record<string, number>
  por_materia: Record<string, number>
}

export interface ListaJuris {
  total: number
  total_acervo: number
  resumo: ResumoJuris
  itens: Jurisprudencia[]
}

function token(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

/**
 * Base das rotas do backend.
 *
 * NÃO é caminho relativo. O host publicado serve o app React: pedir
 * `/backend/v1/...` devolve o HTML do próprio app com HTTP 200 — foi exatamente
 * o que aconteceu no primeiro teste deste módulo (parecia "token ok", era a
 * página do sistema). O backend vive em outro host, o do Skip Cloud, exposto em
 * `VITE_POCKETBASE_URL`, como todos os outros serviços do projeto já fazem
 * (diagnosticoTributario, programaManifesto).
 */
function base(): string {
  const url = import.meta.env.VITE_POCKETBASE_URL as string | undefined
  if (!url) {
    // Falha alto: sem a URL, toda chamada cairia no app e devolveria HTML.
    throw new Error('VITE_POCKETBASE_URL não configurada — o backend não é alcançável.')
  }
  return `${url.replace(/\/$/, '')}/backend/v1/jurisprudencias`
}

export class SemTokenError extends Error {
  constructor() {
    super('Faça login no sistema ADECONT antes de publicar jurisprudências.')
    this.name = 'SemTokenError'
  }
}

async function tratar(res: Response) {
  if (res.status === 401) throw new SemTokenError()
  const texto = await res.text()
  let json: any = null
  try {
    json = texto ? JSON.parse(texto) : null
  } catch {
    throw new Error(`Resposta inesperada do servidor (HTTP ${res.status}).`)
  }
  if (!res.ok || (json && json.ok === false)) {
    throw new Error((json && json.erro) || `Falha na requisição (HTTP ${res.status}).`)
  }
  return json
}

export async function listarJurisprudencias(filtros?: {
  q?: string
  tribunal?: string
  materia?: string
  situacao?: string
  destaque?: boolean
}): Promise<ListaJuris> {
  const t = token()
  if (!t) throw new SemTokenError()

  const p = new URLSearchParams()
  if (filtros?.q) p.set('q', filtros.q)
  if (filtros?.tribunal) p.set('tribunal', filtros.tribunal)
  if (filtros?.materia) p.set('materia', filtros.materia)
  if (filtros?.situacao) p.set('situacao', filtros.situacao)
  if (filtros?.destaque) p.set('destaque', '1')

  const res = await fetch(`${base()}?${p.toString()}`, {
    headers: { 'X-Painel-Token': t },
  })
  const j = await tratar(res)
  return {
    total: j.total ?? 0,
    total_acervo: j.total_acervo ?? 0,
    resumo: j.resumo ?? { por_situacao: {}, por_tribunal: {}, por_materia: {} },
    itens: (j.itens ?? []) as Jurisprudencia[],
  }
}

export async function criarJurisprudencia(
  dados: Partial<Jurisprudencia>,
): Promise<{ id: string; situacao: string }> {
  const t = token()
  if (!t) throw new SemTokenError()
  const res = await fetch(base(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Painel-Token': t },
    body: JSON.stringify(dados),
  })
  const j = await tratar(res)
  return { id: j.id, situacao: j.situacao }
}

export async function atualizarJurisprudencia(
  id: string,
  dados: Partial<Jurisprudencia>,
): Promise<{ id: string; situacao: string }> {
  const t = token()
  if (!t) throw new SemTokenError()
  const res = await fetch(`${base()}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-Painel-Token': t },
    body: JSON.stringify(dados),
  })
  const j = await tratar(res)
  return { id: j.id, situacao: j.situacao }
}

/** Muda só a situação — publicar, revisar, arquivar. */
export async function mudarSituacao(
  id: string,
  situacao: Jurisprudencia['situacao'],
  por = 'painel',
): Promise<void> {
  await atualizarJurisprudencia(id, { situacao, criado_por: por } as any)
}

/** Arquiva (não apaga: o histórico de peça enviada a cliente se preserva). */
export async function arquivarJurisprudencia(id: string): Promise<void> {
  const t = token()
  if (!t) throw new SemTokenError()
  const res = await fetch(`${base()}/${id}`, {
    method: 'DELETE',
    headers: { 'X-Painel-Token': t },
  })
  await tratar(res)
}

export async function historicoJurisprudencia(
  id: string,
): Promise<
  { acao: string; de: string; para: string; por: string; detalhe: string; quando: string }[]
> {
  const t = token()
  if (!t) throw new SemTokenError()
  const res = await fetch(`${base()}/${id}/historico`, {
    headers: { 'X-Painel-Token': t },
  })
  const j = await tratar(res)
  return j.itens ?? []
}
