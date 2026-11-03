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

export type NivelAcessoPadrao = 'Administrador' | 'Editor' | 'Leitor'
export type NivelAcesso = NivelAcessoPadrao | string
export type TipoPermissao = 'consultar' | 'editar'
export type StatusCadastro = 'confirmado' | 'pendente_confirmacao'

/** Departamentos institucionais de qualificação do usuário (6 valores oficiais). */
export const DEPARTAMENTOS_USUARIOS = [
  'Contábil',
  'Fiscal',
  'Pessoal',
  'Apoio',
  'Jurídico',
  'Administrativo',
] as const
export type DepartamentoUsuario = (typeof DEPARTAMENTOS_USUARIOS)[number]

export interface PermissaoSegmento {
  acesso: boolean
  tipo: TipoPermissao
}

export interface SistemaUsuario {
  id: string
  nome: string
  email: string
  cargo: string
  departamento?: DepartamentoUsuario | ''
  nivel: NivelAcesso
  nivel_customizado_id?: string
  nivel_customizado_nome?: string
  status_cadastro?: StatusCadastro
  codigo_confirmacao?: string
  confirmado_em?: string
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

export interface NivelAcessoCustomizado {
  id: string
  nome: string
  descricao: string
  cor_badge: string
  ativo: boolean
  perm_juridico_acesso: boolean
  perm_juridico_tipo: TipoPermissao
  perm_tributario_acesso: boolean
  perm_tributario_tipo: TipoPermissao
  perm_contabil_acesso: boolean
  perm_contabil_tipo: TipoPermissao
  perm_administrativo_acesso: boolean
  perm_administrativo_tipo: TipoPermissao
  criado_por?: string
  created?: string
  updated?: string
}

export interface SalvarUsuarioInput {
  nome: string
  email: string
  cargo?: string
  departamento?: DepartamentoUsuario | ''
  nivel: NivelAcesso
  nivel_customizado_id?: string
  nivel_customizado_nome?: string
  senha?: string
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
  cadastrado_por?: string
}

export interface SalvarNivelInput {
  nome: string
  descricao?: string
  cor_badge?: string
  ativo?: boolean
  perm_juridico_acesso: boolean
  perm_juridico_tipo: TipoPermissao
  perm_tributario_acesso: boolean
  perm_tributario_tipo: TipoPermissao
  perm_contabil_acesso: boolean
  perm_contabil_tipo: TipoPermissao
  perm_administrativo_acesso: boolean
  perm_administrativo_tipo: TipoPermissao
  criado_por?: string
}

export interface ListarUsuariosParams {
  q?: string
  nivel?: string
  departamento?: string
  situacao?: 'ativo' | 'inativo' | ''
}

export interface ListarUsuariosResponse {
  ok: boolean
  sucesso?: boolean
  total: number
  total_geral?: number
  ativos?: number
  inativos?: number
  usuarios: SistemaUsuario[]
  erro?: string
  mensagem?: string
}

export interface LoginResponse {
  sucesso: boolean
  mensagem: string
  usuario?: SistemaUsuario
  pendente_confirmacao?: boolean
  codigo_confirmacao?: string
  email?: string
}

export interface ConfirmarCodigoResponse {
  sucesso: boolean
  mensagem: string
  usuario?: SistemaUsuario
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

// -------------------------------------------------------------------
// 1. AUTENTICAÇÃO COM LOGIN E SENHA
// -------------------------------------------------------------------

export async function loginSistemaUsuario(
  identificador: string,
  senha: string,
): Promise<LoginResponse> {
  try {
    const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha }),
    })

    const json = await res.json()
    return json as LoginResponse
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      sucesso: false,
      mensagem: `Falha na conexão com o servidor ADECONT: ${msg}`,
    }
  }
}

export async function confirmarCodigoUsuario(
  codigo: string,
  email?: string,
): Promise<ConfirmarCodigoResponse> {
  try {
    const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/confirmar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, email }),
    })

    const json = await res.json()
    return json as ConfirmarCodigoResponse
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      sucesso: false,
      mensagem: `Erro ao validar código de confirmação: ${msg}`,
    }
  }
}

export async function confirmarUsuarioManualAdmin(
  token: string,
  id: string,
): Promise<{ sucesso: boolean; mensagem: string; usuario?: SistemaUsuario }> {
  if (!token) throw new SemTokenError()

  try {
    const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/confirmar-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Painel-Token': token,
      },
      body: JSON.stringify({ id }),
    })

    const json = await res.json()
    return json
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      sucesso: false,
      mensagem: `Erro ao confirmar usuário: ${msg}`,
    }
  }
}

// -------------------------------------------------------------------
// 2. GESTÃO DE USUÁRIOS
// -------------------------------------------------------------------

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
    throw new Error(json.mensagem || json.erro || `Erro ao listar usuários (HTTP ${res.status}).`)
  }

  const rawUsers = (json.usuarios || []) as SistemaUsuario[]
  let filtered = [...rawUsers]

  if (params?.q) {
    const qLower = params.q.toLowerCase()
    filtered = filtered.filter(
      (u) =>
        u.nome?.toLowerCase().includes(qLower) ||
        u.email?.toLowerCase().includes(qLower) ||
        u.cargo?.toLowerCase().includes(qLower),
    )
  }
  if (params?.nivel) {
    filtered = filtered.filter((u) => u.nivel === params.nivel)
  }
  if (params?.departamento) {
    filtered = filtered.filter((u) => (u.departamento || '') === params.departamento)
  }
  if (params?.situacao === 'ativo') {
    filtered = filtered.filter((u) => u.ativo)
  } else if (params?.situacao === 'inativo') {
    filtered = filtered.filter((u) => !u.ativo)
  }

  return {
    ok: true,
    sucesso: true,
    total: filtered.length,
    total_geral: rawUsers.length,
    ativos: rawUsers.filter((u) => u.ativo).length,
    inativos: rawUsers.filter((u) => !u.ativo).length,
    usuarios: filtered,
  }
}

export async function criarSistemaUsuario(
  token: string,
  input: SalvarUsuarioInput,
): Promise<{
  ok: boolean
  sucesso?: boolean
  id?: string
  mensagem: string
  usuario?: SistemaUsuario
  senha_temporaria?: string
  codigo_confirmacao?: string
}> {
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
    throw new Error(json.mensagem || json.erro || `Erro ao cadastrar usuário (HTTP ${res.status}).`)
  }

  return {
    ok: json.sucesso !== false,
    sucesso: json.sucesso !== false,
    id: json.usuario?.id,
    mensagem: json.mensagem,
    usuario: json.usuario,
    senha_temporaria: json.senha_temporaria,
    codigo_confirmacao: json.codigo_confirmacao,
  }
}

export async function atualizarSistemaUsuario(
  token: string,
  id: string,
  dados: Partial<SalvarUsuarioInput>,
): Promise<{
  ok: boolean
  sucesso?: boolean
  id: string
  mensagem: string
  usuario?: SistemaUsuario
}> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify({ id, ...dados }),
  })

  if (res.status === 401) {
    throw new SemTokenError()
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.mensagem || json.erro || `Erro ao atualizar usuário (HTTP ${res.status}).`)
  }

  return {
    ok: json.sucesso !== false,
    sucesso: json.sucesso !== false,
    id: json.usuario?.id || id,
    mensagem: json.mensagem,
    usuario: json.usuario,
  }
}

export async function alternarSituacaoUsuario(
  token: string,
  id: string,
  ativo: boolean,
): Promise<{ ok: boolean; mensagem: string }> {
  return atualizarSistemaUsuario(token, id, { ativo })
}

export async function excluirSistemaUsuario(
  token: string,
  id: string,
): Promise<{ ok: boolean; mensagem: string }> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-usuarios/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify({ id }),
  })

  if (res.status === 401) {
    throw new SemTokenError()
  }

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.mensagem || json.erro || `Erro ao excluir usuário (HTTP ${res.status}).`)
  }

  return {
    ok: json.sucesso !== false,
    mensagem: json.mensagem || 'Usuário excluído com sucesso.',
  }
}

// -------------------------------------------------------------------
// 3. NÍVEIS CUSTOMIZÁVEIS
// -------------------------------------------------------------------

export async function listarNiveisCustomizados(): Promise<{
  sucesso: boolean
  total: number
  niveis: NivelAcessoCustomizado[]
  mensagem?: string
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-niveis-acesso`, {
      method: 'GET',
    })
    const json = await res.json()
    return {
      sucesso: json.sucesso !== false,
      total: json.total || 0,
      niveis: json.niveis || [],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      sucesso: false,
      total: 0,
      niveis: [],
      mensagem: `Falha ao listar níveis: ${msg}`,
    }
  }
}

export async function criarNivelCustomizado(
  token: string,
  input: SalvarNivelInput,
): Promise<{
  sucesso: boolean
  mensagem: string
  nivel?: NivelAcessoCustomizado
}> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-niveis-acesso`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify(input),
  })

  if (res.status === 401) throw new SemTokenError()

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.mensagem || `Erro ao criar nível (HTTP ${res.status}).`)
  }

  return json
}

export async function atualizarNivelCustomizado(
  token: string,
  id: string,
  dados: Partial<SalvarNivelInput>,
): Promise<{
  sucesso: boolean
  mensagem: string
  nivel?: NivelAcessoCustomizado
}> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-niveis-acesso/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify({ id, ...dados }),
  })

  if (res.status === 401) throw new SemTokenError()

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.mensagem || `Erro ao atualizar nível (HTTP ${res.status}).`)
  }

  return json
}

export async function excluirNivelCustomizado(
  token: string,
  id: string,
): Promise<{ sucesso: boolean; mensagem: string }> {
  if (!token) throw new SemTokenError()

  const res = await fetch(`${BACKEND_URL}/backend/v1/sistema-niveis-acesso/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Painel-Token': token,
    },
    body: JSON.stringify({ id }),
  })

  if (res.status === 401) throw new SemTokenError()

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.mensagem || `Erro ao excluir nível (HTTP ${res.status}).`)
  }

  return json
}

// -------------------------------------------------------------------
// 4. ESTADO LOCAL DO USUÁRIO LOGADO / SESSÃO
// -------------------------------------------------------------------

const EVENTO_USUARIO_ALTERADO = 'adecont_usuario_sistema_alterado'

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
    // Dispara evento customizado para que todos os componentes reajam
    window.dispatchEvent(new CustomEvent(EVENTO_USUARIO_ALTERADO, { detail: user }))
  } catch {
    /* ignore */
  }
}

export function assinarMudancaUsuarioAtivo(callback: (user: SistemaUsuario | null) => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => {
    const custom = e as CustomEvent<SistemaUsuario | null>
    callback(custom.detail)
  }
  window.addEventListener(EVENTO_USUARIO_ALTERADO, handler)
  window.addEventListener('storage', (e) => {
    if (e.key === USUARIO_ATIVO_KEY) {
      callback(obterUsuarioAtivoLocal())
    }
  })
  return () => {
    window.removeEventListener(EVENTO_USUARIO_ALTERADO, handler)
  }
}

// -------------------------------------------------------------------
// 5. HELPER DE CHECAGEM DE PERMISSÃO POR SEGMENTO
// -------------------------------------------------------------------

export type SegmentoApp = 'juridico' | 'tributario' | 'contabil' | 'administrativo'

export interface ChecagemPermissao {
  temAcesso: boolean
  podeEditar: boolean
  podeConsultar: boolean
  motivo?: string
}

/**
 * Avalia se o usuário tem permissão para consultar ou editar determinado segmento.
 * - Administrador sempre tem tudo.
 * - Caso não haja usuário autenticado, consideramos modo convidado com consulta padrão
 *   (para não travar a navegação inicial antes do primeiro login, mas avisando ou bloqueando ações restritas).
 */
export function checarPermissaoSegmento(
  usuario: SistemaUsuario | null,
  segmento: SegmentoApp,
): ChecagemPermissao {
  if (!usuario) {
    // Usuário não logado: modo convidado
    return {
      temAcesso: true,
      podeEditar: false,
      podeConsultar: true,
      motivo: 'Efetue login no sistema para ter permissões de alteração.',
    }
  }

  // Administrador tem acesso total irrestrito
  if (usuario.nivel === 'Administrador') {
    return {
      temAcesso: true,
      podeEditar: true,
      podeConsultar: true,
    }
  }

  let temAcesso = false
  let tipo: TipoPermissao = 'consultar'

  switch (segmento) {
    case 'juridico':
      temAcesso = Boolean(usuario.perm_juridico_acesso)
      tipo = usuario.perm_juridico_tipo || 'consultar'
      break
    case 'tributario':
      temAcesso = Boolean(usuario.perm_tributario_acesso)
      tipo = usuario.perm_tributario_tipo || 'consultar'
      break
    case 'contabil':
      temAcesso = Boolean(usuario.perm_contabil_acesso)
      tipo = usuario.perm_contabil_tipo || 'consultar'
      break
    case 'administrativo':
      temAcesso = Boolean(usuario.perm_administrativo_acesso)
      tipo = usuario.perm_administrativo_tipo || 'consultar'
      break
  }

  const podeEditar = temAcesso && (tipo === 'editar' || usuario.nivel === 'Administrador')
  const podeConsultar = temAcesso

  return {
    temAcesso,
    podeEditar,
    podeConsultar,
    motivo: !temAcesso
      ? `Seu nível de acesso (${usuario.nivel}) não possui permissão para visualizar o segmento ${segmento.toUpperCase()}.`
      : !podeEditar
        ? `Seu nível de acesso (${usuario.nivel}) permite apenas consulta neste segmento.`
        : undefined,
  }
}

// -------------------------------------------------------------------
// 6. GERADOR DE MENSAGENS PRONTAS (WHATSAPP E E-MAIL)
// -------------------------------------------------------------------

export interface DadosMensagemConfirmacao {
  nome: string
  email: string
  codigo: string
  nivel: string
  cargo?: string
  linkSistema?: string
  senhaTemporaria?: string
}

export function gerarTextoConfirmacaoWhatsApp(dados: DadosMensagemConfirmacao): string {
  const urlApp = dados.linkSistema || (typeof window !== 'undefined' ? window.location.origin : '')
  const senhaInfo = dados.senhaTemporaria ? `🔑 *Senha provisória:* ${dados.senhaTemporaria}\n` : ''

  return `*ADECONT Assessoria Contábil e Administrativa*
*Ativação de Acesso — Panorama da Reforma Tributária*

Olá, *${dados.nome}*! 👋

Seu cadastro de usuário no sistema ADECONT Panorama foi criado com sucesso no perfil *${dados.nivel}*${dados.cargo ? ` (${dados.cargo})` : ''}.

Para concluir seu registro e liberar seu acesso, utilize o código de confirmação abaixo:

🔐 *Código de Confirmação:* *${dados.codigo}*
${senhaInfo}
👉 *Acesse o portal:* ${urlApp}/#nivel-acesso
Basta informar seu e-mail e este código no painel de ativação para começar a utilizar o sistema.

_Mensagem institucional gerada pela Plataforma ADECONT Panorama._`
}

export function gerarTextoConfirmacaoEmail(dados: DadosMensagemConfirmacao): {
  assunto: string
  corpo: string
} {
  const urlApp = dados.linkSistema || (typeof window !== 'undefined' ? window.location.origin : '')
  const senhaInfo = dados.senhaTemporaria
    ? `\nSenha temporária de acesso: ${dados.senhaTemporaria}\n(Recomendamos alterá-la após o primeiro acesso)\n`
    : ''

  const assunto = `[ADECONT] Ativação de Acesso — Código: ${dados.codigo}`
  const corpo = `Prezado(a) ${dados.nome},

Seu usuário foi cadastrado na Plataforma Corporativa ADECONT — Panorama da Reforma Tributária com o perfil: ${dados.nivel}${dados.cargo ? ` (${dados.cargo})` : ''}.

Para concluir seu registro institucional e liberar o login no sistema, utilize o código de segurança abaixo:

==========================================
CÓDIGO DE CONFIRMAÇÃO: ${dados.codigo}
==========================================
${senhaInfo}
Instruções:
1. Acesse o sistema através do link: ${urlApp}/#nivel-acesso
2. No painel de ativação, insira seu e-mail corporativo (${dados.email}) e o código informado acima.
3. Após a confirmação, seu acesso estará imediatamente habilitado com suas permissões atribuídas.

Em caso de dúvidas, contate o administrador da ADECONT Assessoria Contábil e Administrativa.

Atenciosamente,
Equipe ADECONT Panorama
Assessoria Contábil e Administrativa`

  return { assunto, corpo }
}
