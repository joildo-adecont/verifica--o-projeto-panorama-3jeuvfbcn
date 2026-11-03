import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Search,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Ban,
  Building2,
  Scale,
  Calculator,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  BadgeAlert,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import {
  SistemaUsuario,
  NivelAcesso,
  TipoPermissao,
  SalvarUsuarioInput,
  listarSistemaUsuarios,
  criarSistemaUsuario,
  atualizarSistemaUsuario,
  alternarSituacaoUsuario,
  excluirSistemaUsuario,
  lerTokenPainel,
  salvarTokenPainel,
  validarTokenPainel,
  obterUsuarioAtivoLocal,
  definirUsuarioAtivoLocal,
  SemTokenError,
} from '@/services/sistemaUsuarios'

const NIVEIS_INFO: Record<
  NivelAcesso,
  {
    titulo: string
    badgeClass: string
    bgCard: string
    borda: string
    texto: string
    descricao: string
  }
> = {
  Administrador: {
    titulo: 'Administrador (Acesso Total)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    bgCard: 'bg-rose-50/60',
    borda: 'border-rose-200',
    texto: 'text-rose-900',
    descricao:
      'Chave mestra institucional: controle total de cadastros, parametrizações, envios e permissões de usuários.',
  },
  Editor: {
    titulo: 'Editor (Operação & Edição)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    bgCard: 'bg-amber-50/60',
    borda: 'border-amber-200',
    texto: 'text-amber-900',
    descricao:
      'Pode consultar dados e criar/editar registros nos segmentos liberados para sua equipe.',
  },
  Leitor: {
    titulo: 'Leitor (Somente Leitura)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    bgCard: 'bg-blue-50/60',
    borda: 'border-blue-200',
    texto: 'text-blue-900',
    descricao:
      'Acesso visual de consulta a normas, alíquotas e relatórios sem permissão para alteração de dados.',
  },
}

const SEGMENTOS_SISTEMA_LISTA = [
  {
    key: 'juridico',
    nome: 'Jurídico',
    descricao: 'Normas, acervos, jurisprudências e fontes oficiais',
    Icon: Scale,
    corBadge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    key: 'tributario',
    nome: 'Tributário',
    descricao: 'Reforma Tributária, alíquotas CBS/IBS, regimes e regras gerais',
    Icon: Building2,
    corBadge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    key: 'contabil',
    nome: 'Contábil',
    descricao: 'Setores econômicos, apuração, classificações e cálculos',
    Icon: Calculator,
    corBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    key: 'administrativo',
    nome: 'Administrativo',
    descricao: 'Cadastro de clientes, envios, indicadores e gestão de acessos',
    Icon: Briefcase,
    corBadge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
] as const

type SegmentoKey = (typeof SEGMENTOS_SISTEMA_LISTA)[number]['key']

interface FormState {
  id?: string
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
}

const FORM_INICIAL: FormState = {
  nome: '',
  email: '',
  cargo: '',
  nivel: 'Editor',
  ativo: true,
  perm_juridico_acesso: true,
  perm_juridico_tipo: 'consultar',
  perm_tributario_acesso: true,
  perm_tributario_tipo: 'editar',
  perm_contabil_acesso: true,
  perm_contabil_tipo: 'editar',
  perm_administrativo_acesso: true,
  perm_administrativo_tipo: 'consultar',
  observacoes: '',
}

export function SectionNivelAcesso() {
  const [aba, setAba] = useState<'lista' | 'cadastro'>('lista')
  const [usuarios, setUsuarios] = useState<SistemaUsuario[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; txt: string } | null>(null)

  // Token de painel no padrão da Seção 9A
  const [token, setToken] = useState('')
  const [tokenInput, setTokenInput] = useState('')
  const [tokenValidado, setTokenValidado] = useState(false)
  const [validandoToken, setValidandoToken] = useState(false)

  // Filtros da lista
  const [busca, setBusca] = useState('')
  const [filtroNivel, setFiltroNivel] = useState<string>('todos')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos')

  // Formulário (preserva dados digitados sempre)
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [usuarioEmExclusao, setUsuarioEmExclusao] = useState<SistemaUsuario | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  // Usuário ativo no client (informativo para a plataforma)
  const [usuarioAtivo, setUsuarioAtivo] = useState<SistemaUsuario | null>(null)

  // Carrega token salvo
  useEffect(() => {
    const tokSalvo = lerTokenPainel()
    if (tokSalvo) {
      setToken(tokSalvo)
      setTokenInput(tokSalvo)
      validarTokenPainel(tokSalvo).then((valido) => {
        setTokenValidado(valido)
        if (!valido) {
          setMsg({
            tipo: 'erro',
            txt: 'Token do painel inválido ou expirado — informe novamente para gerenciar usuários.',
          })
        }
      })
    }
    const uAtivo = obterUsuarioAtivoLocal()
    if (uAtivo) setUsuarioAtivo(uAtivo)
  }, [])

  // Carrega lista do backend
  const carregarUsuarios = useCallback(async (tok: string) => {
    if (!tok) return
    setCarregando(true)
    setErro(null)
    try {
      const resp = await listarSistemaUsuarios(tok)
      setUsuarios(resp.usuarios || [])
      // Se não tiver usuário ativo selecionado, escolhe o primeiro administrador
      const atual = obterUsuarioAtivoLocal()
      if (!atual && resp.usuarios && resp.usuarios.length > 0) {
        const primeiroAdmin =
          resp.usuarios.find((u) => u.nivel === 'Administrador') || resp.usuarios[0]
        definirUsuarioAtivoLocal(primeiroAdmin)
        setUsuarioAtivo(primeiroAdmin)
      }
    } catch (e) {
      if (e instanceof SemTokenError) {
        setTokenValidado(false)
        setErro('Token do painel ausente ou inválido. Informe a chave no box âmbar.')
      } else {
        setErro((e as Error).message || 'Falha ao carregar lista de usuários do sistema.')
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (token && tokenValidado) {
      carregarUsuarios(token)
    }
  }, [token, tokenValidado, carregarUsuarios])

  // Aplica validação de token (com reenvio automático se havia submissão em andamento)
  const aplicarToken = async (tokParaTestar?: string, autoReenviarForm = false) => {
    const val = (tokParaTestar !== undefined ? tokParaTestar : tokenInput).trim()
    if (!val) {
      setMsg({ tipo: 'erro', txt: 'Informe o token do painel ADECONT para continuar.' })
      return
    }
    setValidandoToken(true)
    setMsg(null)
    setErro(null)
    try {
      const valido = await validarTokenPainel(val)
      if (valido) {
        setToken(val)
        setTokenValidado(true)
        salvarTokenPainel(val)
        setMsg({ tipo: 'ok', txt: 'Token do painel validado com sucesso!' })
        await carregarUsuarios(val)
        if (autoReenviarForm && form.nome && form.email) {
          await executarSalvar(val)
        }
      } else {
        setTokenValidado(false)
        setMsg({
          tipo: 'erro',
          txt: 'Token do painel inválido ou sem autorização — verifique a chave digitada.',
        })
      }
    } finally {
      setValidandoToken(false)
    }
  }

  // Submissão do formulário
  const executarSalvar = async (tokUsar: string) => {
    setMsg(null)
    setErro(null)
    if (!tokUsar) {
      setTokenValidado(false)
      setMsg({ tipo: 'erro', txt: 'Token do painel necessário para gravar.' })
      return
    }
    if (!form.nome.trim() || !form.email.trim()) {
      setMsg({ tipo: 'erro', txt: 'Nome completo e e-mail são obrigatórios.' })
      return
    }

    const payload: SalvarUsuarioInput = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      cargo: form.cargo.trim(),
      nivel: form.nivel,
      ativo: form.ativo,
      perm_juridico_acesso: form.perm_juridico_acesso,
      perm_juridico_tipo: form.perm_juridico_tipo,
      perm_tributario_acesso: form.perm_tributario_acesso,
      perm_tributario_tipo: form.perm_tributario_tipo,
      perm_contabil_acesso: form.perm_contabil_acesso,
      perm_contabil_tipo: form.perm_contabil_tipo,
      perm_administrativo_acesso: form.perm_administrativo_acesso,
      perm_administrativo_tipo: form.perm_administrativo_tipo,
      observacoes: form.observacoes.trim(),
    }

    setSalvando(true)
    try {
      if (form.id) {
        await atualizarSistemaUsuario(tokUsar, form.id, payload)
        setMsg({ tipo: 'ok', txt: `Usuário “${form.nome}” atualizado com sucesso!` })
      } else {
        await criarSistemaUsuario(tokUsar, payload)
        setMsg({ tipo: 'ok', txt: `Novo usuário “${form.nome}” cadastrado com sucesso!` })
      }
      setForm(FORM_INICIAL)
      setAba('lista')
      await carregarUsuarios(tokUsar)
    } catch (e) {
      if (e instanceof SemTokenError) {
        setTokenValidado(false)
        setMsg({
          tipo: 'erro',
          txt: 'Token do painel expirou ou é inválido. Seus dados permanecem intactos; informe a chave no box acima para concluir.',
        })
      } else {
        setMsg({
          tipo: 'erro',
          txt: (e as Error).message || 'Não foi possível salvar o usuário. Verifique os dados.',
        })
      }
    } finally {
      setSalvando(false)
    }
  }

  const salvarForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !tokenValidado) {
      setMsg({
        tipo: 'erro',
        txt: 'Token do painel necessário antes de salvar. Informe a chave no box âmbar acima.',
      })
      return
    }
    await executarSalvar(token)
  }

  // Prepara edição
  const iniciarEdicao = (u: SistemaUsuario) => {
    setForm({
      id: u.id,
      nome: u.nome,
      email: u.email,
      cargo: u.cargo || '',
      nivel: u.nivel,
      ativo: u.ativo,
      perm_juridico_acesso: u.perm_juridico_acesso,
      perm_juridico_tipo: u.perm_juridico_tipo,
      perm_tributario_acesso: u.perm_tributario_acesso,
      perm_tributario_tipo: u.perm_tributario_tipo,
      perm_contabil_acesso: u.perm_contabil_acesso,
      perm_contabil_tipo: u.perm_contabil_tipo,
      perm_administrativo_acesso: u.perm_administrativo_acesso,
      perm_administrativo_tipo: u.perm_administrativo_tipo,
      observacoes: u.observacoes || '',
    })
    setMsg(null)
    setAba('cadastro')
  }

  // Alterna ativação/desativação rápida
  const alternarAtivo = async (u: SistemaUsuario) => {
    if (!token || !tokenValidado) {
      setMsg({ tipo: 'erro', txt: 'Informe o token do painel para alterar a situação do usuário.' })
      return
    }
    const novoStatus = !u.ativo
    try {
      await alternarSituacaoUsuario(token, u.id, novoStatus)
      setMsg({
        tipo: 'ok',
        txt: `Usuário “${u.nome}” ${novoStatus ? 'ativado' : 'desativado'} com sucesso.`,
      })
      await carregarUsuarios(token)
    } catch (e) {
      setMsg({
        tipo: 'erro',
        txt: (e as Error).message || 'Erro ao alterar situação do usuário.',
      })
    }
  }

  // Confirma exclusão
  const confirmarExclusao = async () => {
    if (!usuarioEmExclusao || !token) return
    setExcluindo(true)
    try {
      await excluirSistemaUsuario(token, usuarioEmExclusao.id)
      setMsg({
        tipo: 'ok',
        txt: `Usuário “${usuarioEmExclusao.nome}” excluído com sucesso.`,
      })
      setUsuarioEmExclusao(null)
      await carregarUsuarios(token)
    } catch (e) {
      setMsg({
        tipo: 'erro',
        txt: (e as Error).message || 'Erro ao excluir usuário.',
      })
    } finally {
      setExcluindo(false)
    }
  }

  // Presets rápidos de permissão
  const aplicarPreset = (tipo: 'todos_editar' | 'todos_leitura' | 'limpar') => {
    if (tipo === 'todos_editar') {
      setForm((f) => ({
        ...f,
        perm_juridico_acesso: true,
        perm_juridico_tipo: 'editar',
        perm_tributario_acesso: true,
        perm_tributario_tipo: 'editar',
        perm_contabil_acesso: true,
        perm_contabil_tipo: 'editar',
        perm_administrativo_acesso: true,
        perm_administrativo_tipo: 'editar',
      }))
    } else if (tipo === 'todos_leitura') {
      setForm((f) => ({
        ...f,
        perm_juridico_acesso: true,
        perm_juridico_tipo: 'consultar',
        perm_tributario_acesso: true,
        perm_tributario_tipo: 'consultar',
        perm_contabil_acesso: true,
        perm_contabil_tipo: 'consultar',
        perm_administrativo_acesso: true,
        perm_administrativo_tipo: 'consultar',
      }))
    } else {
      setForm((f) => ({
        ...f,
        perm_juridico_acesso: false,
        perm_juridico_tipo: 'consultar',
        perm_tributario_acesso: false,
        perm_tributario_tipo: 'consultar',
        perm_contabil_acesso: false,
        perm_contabil_tipo: 'consultar',
        perm_administrativo_acesso: false,
        perm_administrativo_tipo: 'consultar',
      }))
    }
  }

  // Selecionar como usuário ativo da sessão
  const selecionarComoAtivo = (u: SistemaUsuario) => {
    definirUsuarioAtivoLocal(u)
    setUsuarioAtivo(u)
    setMsg({
      tipo: 'ok',
      txt: `Perfil de “${u.nome}” (${u.nivel}) selecionado como usuário ativo demonstrativo no navegador.`,
    })
  }

  // Filtro de lista
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroNivel !== 'todos' && u.nivel !== filtroNivel) return false
      if (filtroSituacao === 'ativo' && !u.ativo) return false
      if (filtroSituacao === 'inativo' && u.ativo) return false
      if (busca.trim()) {
        const termo = busca.toLowerCase()
        const texto = `${u.nome} ${u.email} ${u.cargo} ${u.observacoes}`.toLowerCase()
        if (!texto.includes(termo)) return false
      }
      return true
    })
  }, [usuarios, filtroNivel, filtroSituacao, busca])

  const totalAtivos = useMemo(() => usuarios.filter((u) => u.ativo).length, [usuarios])

  return (
    <section id="nivel-acesso" className="scroll-mt-24 space-y-6">
      {/* ── CABEÇALHO INSTITUCIONAL COM LOGO ADECONT ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <header className="bg-panorama-navy px-4 sm:px-6 py-5 border-b-2 border-panorama-gold/60">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/20 text-panorama-gold-light ring-1 ring-panorama-gold/50 shrink-0">
                <Shield className="w-6 h-6" />
              </span>
              <div className="bg-white/95 rounded-lg px-2.5 py-1 shadow-xs border border-panorama-gold/40 flex items-center">
                <AdecontLogo variant="color" className="h-7 w-auto" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-panorama-navy bg-panorama-gold rounded px-1.5 py-0.5">
                    Administrativo
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-panorama-gold-light/90">
                    Governança &amp; Acessos
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">
                  Nível de Acesso — Cadastro de Usuários
                </h1>
              </div>
            </div>

            {/* Badges de contadores no topo */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-emerald-300 border border-emerald-400/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{totalAtivos} Ativos</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-slate-300 border border-white/20">
                <Users className="w-3.5 h-3.5" />
                <span>{usuarios.length} Total</span>
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-slate-300 mt-2.5 leading-relaxed max-w-4xl">
            Gestão unificada de usuários da plataforma ADECONT. Defina o perfil de acesso
            (Administrador, Editor ou Leitor) e a matriz de permissões individual para cada um dos 4
            segmentos: <b>Jurídico</b>, <b>Tributário</b>, <b>Contábil</b> e <b>Administrativo</b>{' '}
            (consulta ou edição).
          </p>

          {/* Abas */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              onClick={() => {
                setAba('lista')
                setMsg(null)
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                aba === 'lista'
                  ? 'bg-panorama-gold text-panorama-navy shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários Cadastrados ({usuarios.length})</span>
            </button>
            <button
              onClick={() => {
                setAba('cadastro')
                setForm(FORM_INICIAL)
                setMsg(null)
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                aba === 'cadastro'
                  ? 'bg-panorama-gold text-panorama-navy shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </header>

        {/* ── CORPO DA SEÇÃO ── */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* BOX ÂMBAR DO TOKEN DO PAINEL (PADRÃO SEÇÃO 9A) */}
          {(!token || !tokenValidado) && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-xs">
              <div className="flex items-start gap-3 mb-2">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-800 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-amber-900 leading-tight">
                    Token do painel necessário
                  </p>
                  <p className="text-xs text-amber-800 mt-1 leading-snug">
                    Para cadastrar, alterar permissões ou gerenciar usuários do sistema, informe a
                    chave de acesso do painel ADECONT. A tela será liberada imediatamente após a
                    validação.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') aplicarToken(tokenInput, true)
                  }}
                  placeholder="Cole o token do painel (SIMUL_PAINEL_TOKEN)"
                  className="flex-1 rounded-xl border-2 border-amber-300 px-3.5 py-2 text-xs font-mono bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => aplicarToken(tokenInput, true)}
                  disabled={validandoToken || !tokenInput.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <KeyRound className={`w-3.5 h-3.5 ${validandoToken ? 'animate-spin' : ''}`} />
                  {validandoToken ? 'Validando…' : 'Usar'}
                </button>
              </div>

              {form.nome && (
                <p className="text-[11px] text-amber-900 font-semibold mt-2.5 bg-amber-100/70 rounded-lg p-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>
                    Seus dados digitados continuam intactos no formulário. Ao validar o token, a
                    gravação será concluída sem necessidade de redigitar.
                  </span>
                </p>
              )}
            </div>
          )}

          {/* MENSAGENS DE FEEDBACK */}
          {erro && (
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 flex items-start gap-2.5">
              <BadgeAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-900 font-medium">{erro}</p>
            </div>
          )}
          {msg && (
            <div
              className={`rounded-xl border-2 p-3 flex items-start gap-2.5 ${
                msg.tipo === 'ok'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-rose-300 bg-rose-50 text-rose-900'
              }`}
            >
              {msg.tipo === 'ok' ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              )}
              <p className="text-xs font-medium">{msg.txt}</p>
            </div>
          )}

          {/* BANNER INFORMATIVO: USUÁRIO ATIVO DO SISTEMA */}
          {usuarioAtivo && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-panorama-navy text-panorama-gold shrink-0">
                  <Shield className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Usuário Ativo de Referência:{' '}
                    <span className="text-panorama-navy">{usuarioAtivo.nome}</span> (
                    {usuarioAtivo.email})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nível: <span className="font-semibold">{usuarioAtivo.nivel}</span> · Cargo:{' '}
                    {usuarioAtivo.cargo || 'Não especificado'} · Permissões definidas para consulta
                    no sistema.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                  NIVEIS_INFO[usuarioAtivo.nivel]?.badgeClass || 'bg-slate-100 text-slate-800'
                }`}
              >
                {usuarioAtivo.nivel}
              </span>
            </div>
          )}

          {/* ════════════ ABA 1: LISTA DE USUÁRIOS ════════════ */}
          {aba === 'lista' && (
            <div className="space-y-4">
              {/* Barra de busca e filtros */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, e-mail, cargo ou observações…"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-panorama-navy bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={filtroNivel}
                    onChange={(e) => setFiltroNivel(e.target.value)}
                    className="text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy font-medium text-slate-700"
                  >
                    <option value="todos">Todos os Níveis</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Editor">Editor</option>
                    <option value="Leitor">Leitor</option>
                  </select>

                  <select
                    value={filtroSituacao}
                    onChange={(e) => setFiltroSituacao(e.target.value)}
                    className="text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy font-medium text-slate-700"
                  >
                    <option value="todos">Todas as Situações</option>
                    <option value="ativo">Somente Ativos</option>
                    <option value="inativo">Somente Inativos</option>
                  </select>

                  <button
                    onClick={() => carregarUsuarios(token)}
                    disabled={carregando || !tokenValidado}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
                    <span>Atualizar</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Usuários */}
              {usuariosFiltrados.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Nenhum usuário encontrado</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {usuarios.length === 0
                      ? 'Nenhum usuário cadastrado no sistema ainda. Clique em "Novo Usuário" para cadastrar o primeiro.'
                      : 'Nenhum registro corresponde aos filtros selecionados. Tente ajustar os termos de busca.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs min-w-[760px]">
                    <thead>
                      <tr className="bg-panorama-navy text-white">
                        <th className="py-3 px-3.5 font-bold">Identificação do Usuário</th>
                        <th className="py-3 px-3 font-bold">Nível de Acesso</th>
                        <th className="py-3 px-3 font-bold">Permissões nos 4 Segmentos</th>
                        <th className="py-3 px-3 font-bold text-center">Situação</th>
                        <th className="py-3 px-3.5 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usuariosFiltrados.map((u) => {
                        const nivelCfg = NIVEIS_INFO[u.nivel] || NIVEIS_INFO.Leitor
                        const isAtivoSession = usuarioAtivo?.id === u.id

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              !u.ativo ? 'bg-slate-50/40 opacity-75' : ''
                            }`}
                          >
                            {/* Nome e Cargo */}
                            <td className="py-3 px-3.5 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-panorama-navy/10 text-panorama-navy font-bold flex items-center justify-center shrink-0 text-xs">
                                  {u.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-900 truncate">{u.nome}</p>
                                    {isAtivoSession && (
                                      <span className="text-[9px] font-bold uppercase tracking-wider bg-panorama-navy text-panorama-gold px-1.5 py-0.2 rounded-md">
                                        Sessão
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-mono truncate">
                                    {u.email}
                                  </p>
                                  {u.cargo && (
                                    <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                                      {u.cargo}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Nível de Acesso */}
                            <td className="py-3 px-3 align-middle">
                              <span
                                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${nivelCfg.badgeClass}`}
                              >
                                {u.nivel}
                              </span>
                            </td>

                            {/* Grade de 4 Segmentos */}
                            <td className="py-3 px-3 align-middle">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Jurídico */}
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    u.perm_juridico_acesso
                                      ? u.perm_juridico_tipo === 'editar'
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                        : 'bg-indigo-50/50 text-indigo-700 border-indigo-100'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                  }`}
                                  title={`Jurídico: ${
                                    u.perm_juridico_acesso
                                      ? u.perm_juridico_tipo === 'editar'
                                        ? 'Editar'
                                        : 'Consultar'
                                      : 'Sem acesso'
                                  }`}
                                >
                                  Jur:{' '}
                                  {u.perm_juridico_acesso
                                    ? u.perm_juridico_tipo === 'editar'
                                      ? 'Ed'
                                      : 'Cons'
                                    : '—'}
                                </span>

                                {/* Tributário */}
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    u.perm_tributario_acesso
                                      ? u.perm_tributario_tipo === 'editar'
                                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                                        : 'bg-amber-50/50 text-amber-800 border-amber-100'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                  }`}
                                  title={`Tributário: ${
                                    u.perm_tributario_acesso
                                      ? u.perm_tributario_tipo === 'editar'
                                        ? 'Editar'
                                        : 'Consultar'
                                      : 'Sem acesso'
                                  }`}
                                >
                                  Trib:{' '}
                                  {u.perm_tributario_acesso
                                    ? u.perm_tributario_tipo === 'editar'
                                      ? 'Ed'
                                      : 'Cons'
                                    : '—'}
                                </span>

                                {/* Contábil */}
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    u.perm_contabil_acesso
                                      ? u.perm_contabil_tipo === 'editar'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-emerald-50/50 text-emerald-700 border-emerald-100'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                  }`}
                                  title={`Contábil: ${
                                    u.perm_contabil_acesso
                                      ? u.perm_contabil_tipo === 'editar'
                                        ? 'Editar'
                                        : 'Consultar'
                                      : 'Sem acesso'
                                  }`}
                                >
                                  Cont:{' '}
                                  {u.perm_contabil_acesso
                                    ? u.perm_contabil_tipo === 'editar'
                                      ? 'Ed'
                                      : 'Cons'
                                    : '—'}
                                </span>

                                {/* Administrativo */}
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    u.perm_administrativo_acesso
                                      ? u.perm_administrativo_tipo === 'editar'
                                        ? 'bg-slate-200 text-slate-900 border-slate-300'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                                  }`}
                                  title={`Administrativo: ${
                                    u.perm_administrativo_acesso
                                      ? u.perm_administrativo_tipo === 'editar'
                                        ? 'Editar'
                                        : 'Consultar'
                                      : 'Sem acesso'
                                  }`}
                                >
                                  Adm:{' '}
                                  {u.perm_administrativo_acesso
                                    ? u.perm_administrativo_tipo === 'editar'
                                      ? 'Ed'
                                      : 'Cons'
                                    : '—'}
                                </span>
                              </div>
                            </td>

                            {/* Situação (Ativo / Inativo) */}
                            <td className="py-3 px-3 align-middle text-center">
                              <button
                                onClick={() => alternarAtivo(u)}
                                title={u.ativo ? 'Clique para desativar' : 'Clique para reativar'}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                  u.ativo
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {u.ativo ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-700" />
                                    <span>Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3 text-slate-500" />
                                    <span>Inativo</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Ações */}
                            <td className="py-3 px-3.5 align-middle text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => selecionarComoAtivo(u)}
                                  title="Definir como usuário ativo demonstrativo"
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => iniciarEdicao(u)}
                                  title="Editar permissões e dados"
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setUsuarioEmExclusao(u)}
                                  title="Excluir usuário"
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════════════ ABA 2: FORMULÁRIO DE CADASTRO / EDIÇÃO ════════════ */}
          {aba === 'cadastro' && (
            <form onSubmit={salvarForm} className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-panorama-navy" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {form.id ? 'Editar Usuário e Permissões' : 'Cadastrar Novo Usuário do Sistema'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAba('lista')
                    setForm(FORM_INICIAL)
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Voltar para lista
                </button>
              </div>

              {/* BLOCO 1: DADOS DE IDENTIFICAÇÃO */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>1. Dados de Identificação</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      placeholder="Ex.: Dra. Maria Fernandes"
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      E-mail Institucional *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="maria@adecont.com.br"
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={form.cargo}
                      onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
                      placeholder="Ex.: Coordenadora Tributária"
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO 2: SELETOR DE NÍVEL DE ACESSO */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-600" />
                  <span>2. Nível de Acesso ao Sistema</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['Administrador', 'Editor', 'Leitor'] as NivelAcesso[]).map((nv) => {
                    const info = NIVEIS_INFO[nv]
                    const selecionado = form.nivel === nv

                    return (
                      <div
                        key={nv}
                        onClick={() => setForm((f) => ({ ...f, nivel: nv }))}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          selecionado
                            ? `${info.borda} ${info.bgCard} shadow-xs ring-2 ring-panorama-navy/20`
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${info.badgeClass}`}
                            >
                              {nv}
                            </span>
                            <input
                              type="radio"
                              name="nivel_acesso"
                              checked={selecionado}
                              onChange={() => setForm((f) => ({ ...f, nivel: nv }))}
                              className="text-panorama-navy"
                            />
                          </div>
                          <p className="text-xs font-bold text-slate-900 mt-1">{info.titulo}</p>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {info.descricao}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* BLOCO 3: GRADE DE PERMISSÕES POR SEGMENTO */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-600" />
                      <span>3. Matriz de Permissões por Segmento</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Defina individualmente se o usuário pode acessar e se possui permissão de
                      consulta ou edição em cada área.
                    </p>
                  </div>

                  {/* Presets Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('todos_editar')}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10.5px] font-bold cursor-pointer"
                    >
                      Todos (Editar)
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('todos_leitura')}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10.5px] font-bold cursor-pointer"
                    >
                      Somente Leitura
                    </button>
                    <button
                      type="button"
                      onClick={() => aplicarPreset('limpar')}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SEGMENTOS_SISTEMA_LISTA.map((seg) => {
                    const Icon = seg.Icon
                    const chaveAcesso = `perm_${seg.key}_acesso` as keyof FormState
                    const chaveTipo = `perm_${seg.key}_tipo` as keyof FormState
                    const temAcesso = Boolean(form[chaveAcesso])
                    const tipo = (form[chaveTipo] as TipoPermissao) || 'consultar'

                    return (
                      <div
                        key={seg.key}
                        className={`p-3.5 rounded-xl border transition-all ${
                          temAcesso
                            ? 'border-slate-300 bg-slate-50/50'
                            : 'border-slate-200 bg-slate-100/50 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                              <Icon className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{seg.nome}</p>
                              <p className="text-[10px] text-slate-500">{seg.descricao}</p>
                            </div>
                          </div>

                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={temAcesso}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  [chaveAcesso]: e.target.checked,
                                }))
                              }
                              className="rounded text-panorama-navy focus:ring-panorama-navy"
                            />
                            <span>Acesso liberado</span>
                          </label>
                        </div>

                        {/* Tipo de permissão */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-medium text-slate-600">
                            Tipo de operação:
                          </span>
                          <div className="flex items-center gap-2">
                            <label
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                                tipo === 'consultar'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-white text-slate-600 border-slate-200'
                              } ${!temAcesso ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <input
                                type="radio"
                                name={`tipo_${seg.key}`}
                                value="consultar"
                                checked={tipo === 'consultar'}
                                onChange={() =>
                                  setForm((f) => ({
                                    ...f,
                                    [chaveTipo]: 'consultar',
                                  }))
                                }
                                className="sr-only"
                              />
                              Consultar
                            </label>

                            <label
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-colors ${
                                tipo === 'editar'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-white text-slate-600 border-slate-200'
                              } ${!temAcesso ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                              <input
                                type="radio"
                                name={`tipo_${seg.key}`}
                                value="editar"
                                checked={tipo === 'editar'}
                                onChange={() =>
                                  setForm((f) => ({
                                    ...f,
                                    [chaveTipo]: 'editar',
                                  }))
                                }
                                className="sr-only"
                              />
                              Editar
                            </label>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* BLOCO 4: OBSERVAÇÕES E SITUAÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Observações e Justificativa de Acesso
                  </label>
                  <input
                    type="text"
                    value={form.observacoes}
                    onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                    placeholder="Ex.: Acesso concedido para rotinas de fechamento fiscal e auditoria."
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Situação da Conta
                  </label>
                  <select
                    value={form.ativo ? 'ativo' : 'inativo'}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.value === 'ativo' }))}
                    className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:border-panorama-navy font-semibold text-slate-800"
                  >
                    <option value="ativo">Ativo (Habilitado)</option>
                    <option value="inativo">Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* BOTÕES DE GRAVAÇÃO */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAba('lista')
                    setForm(FORM_INICIAL)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-panorama-navy text-panorama-gold font-bold text-xs hover:bg-slate-900 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Check className={`w-4 h-4 ${salvando ? 'animate-spin' : ''}`} />
                  <span>
                    {salvando ? 'Gravando…' : form.id ? 'Atualizar Usuário' : 'Salvar Cadastro'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {usuarioEmExclusao && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Confirmar Exclusão de Usuário</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tem certeza de que deseja remover o usuário <b>{usuarioEmExclusao.nome}</b> (
                  {usuarioEmExclusao.email})? As permissões e o histórico de acesso associados a
                  este e-mail serão revogados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUsuarioEmExclusao(null)}
                disabled={excluindo}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindo}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {excluindo ? 'Excluindo…' : 'Sim, Excluir Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
