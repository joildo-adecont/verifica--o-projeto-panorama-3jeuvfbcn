/**
 * Serviço de Gestão de Usuários do Sistema, Níveis de Acesso e Permissões por Segmento
 * ====================================================================================
 * Plataforma ADECONT: Jurídico, Tributário, Contábil e Administrativo
 */

const BACKEND_URL =
  import.meta.env.VITE_POCKETBASE_URL ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

export const TOKEN_KEY = 'simul_painel_token'
export const USUARIO_ATIVO_KEY = 'adecont_usuario_sistema_ativo'

export type NivelAcesso = 'Administrador' | 'Editor' | 'Leitor'
export type TipoPermissao = 'consultar' | 'editar'

export interface PermissaoSegmento {
  acesso: boolean
  tipo: TipoPermissao
}

export interface SistemaUsuario {
  id: string
  nome: string
  email: string
  cargo: string
  nivel: NivelAcesso
  ativo: boolean
  perm_juridico_acesso: boolean
  perm_juridico_tipo: TipoPermissao
  perm_tributario_acesso: boolean
  perm_tributario_tipo: TipoPermissao
  perm_contabil_acesso: boolean
  perm_contabil_tipo: TipoPermissao
  perm_administrativo_acesso: boolean
  perm_administrativo_tipo: TipoPermissao
  observacoes: string
  cadastrado_por: string
  created: string
  updated: string
}

export interface SalvarUsuarioInput {
  nome: string
  email: string
  cargo?: string
  nivel: NivelAcesso
  ativo?: boolean
  perm_juridico_acesso: boolean
  perm_juridico_tipo: TipoPermissao
  perm_tributario_acesso: boolean
  perm_tributario_tipo: TipoPermissao
  perm_contabil_acesso: boolean
  perm_contabil_tipo: TipoPermissao
  perm_administrativo_acesso: boolean
  perm_administrativo_tipo: TipoPermissao
  observacoes?: string
}

export interface ListarUsuariosParams {
  q?: string
  nivel?: string
  situacao?: 'ativo' | 'inativo' | ''
}

export interface ListarUsuariosResponse {
  ok: boolean
  total: number
  total_geral: number
  ativos: number
  inativos: number
  usuarios: SistemaUsuario[]
  erro?: string
}

export class SemTokenError extends Error {
  constructor(message = 'Token do painel ausente ou inválido.') {
    super(message)
    this.name = 'SemTokenError'
  }
}

/** Lê o token do painel armazenado localmente */
export function lerTokenPainel(): string {
  if (typeof window === 'undefined') return ''
  try {
    return (
      window.localStorage.getItem(TOKEN_KEY) ||
      window.localStorage.getItem('SIMUL_PAINEL_TOKEN') ||
      ''
    )
  } catch {
    return ''
  }
}

/** Salva o token do painel no localStorage */
export function salvarTokenPainel(tok: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TOKEN_KEY, tok)
  } catch {
    /* ignore */
  }
}

/** Valida o token contra a rota de validação do backend */
export async function validarTokenPainel(tok: string): Promise<boolean> {
  if (!tok || !tok.trim()) return false
  try {
    const res = await fetch(`${BACKEND_URL}/backend/v1/simul-validar-token`, {
      method: 'GET',
      headers: { 'X-Painel-Token': tok.trim() },
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Consulta lista de usuários cadastrados
 */
export async function listarSistemaUsuarios(
  token: string,
  params?: ListarUsuariosParams,
): Promise<ListarUsuariosResponse> {
  if (!token) throw new SemTokenError()

  const qp = new URLSearchParams()
  if (params?.q) qp.set('q', params.q)
  if (params?.nivel) qp.set('nivel', params.nivel)
  if (params?.situacao) qp.set('situacao', params.situacao)

  const url = `${BACKEND_URL}/backend/v1/sistema-usuarios?${qp.toString()}`
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'X-Painel-Token': token },
  })

  if (res.status === 401) {
    throw new SemTokenError()
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || `Erro ao listar usuários (HTTP ${res.status}).`)
  }

  return json as ListarUsuariosResponse
}

/**
 * Cadastra um novo usuário no sistema
 */
export async function criarSistemaUsuario(
  token: string,
  input: SalvarUsuarioInput,
): Promise<{ ok: boolean; id: string; mensagem: string }> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify(input),
  })

  if (res.status === 401) {
    throw new SemTokenError()
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || `Erro ao cadastrar usuário (HTTP ${res.status}).`)
  }

  return json
}

/**
 * Atualiza um usuário existente
 */
export async function atualizarSistemaUsuario(
  token: string,
  id: string,
  dados: Partial<SalvarUsuarioInput>,
): Promise<{ ok: boolean; id: string; mensagem: string }> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify(dados),
  })

  if (res.status === 401) {
    throw new SemTokenError()
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || `Erro ao atualizar usuário (HTTP ${res.status}).`)
  }

  return json
}

/**
 * Ativa ou desativa um usuário (toggle rápido)
 */
export async function alternarSituacaoUsuario(
  token: string,
  id: string,
  ativo: boolean,
): Promise<{ ok: boolean; mensagem: string }> {
  return atualizarSistemaUsuario(token, id, { ativo })
}

/**
 * Remove um usuário do sistema com confirmação
 */
export async function excluirSistemaUsuario(
  token: string,
  id: string,
): Promise<{ ok: boolean; mensagem: string }> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Painel-Token': token,
    },
  })

  if (res.status === 401) {
    throw new SemTokenError()
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || `Erro ao excluir usuário (HTTP ${res.status}).`)
  }

  return json
}

/**
 * Obtém ou define o usuário de demonstração ativo no navegador
 * (para exibição informativa de nível/permissão em outras seções)
 */
export function obterUsuarioAtivoLocal(): SistemaUsuario | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USUARIO_ATIVO_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SistemaUsuario
  } catch {
    return null
  }
}

export function definirUsuarioAtivoLocal(user: SistemaUsuario | null) {
  if (typeof window === 'undefined') return
  try {
    if (!user) {
      window.localStorage.removeItem(USUARIO_ATIVO_KEY)
    } else {
      window.localStorage.setItem(USUARIO_ATIVO_KEY, JSON.stringify(user))
    }
  } catch {
    /* ignore */
  }
}
