import { useState, useEffect, useMemo } from 'react'
import {
  KeyRound,
  Eye,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Hotel,
  Search,
  X,
  Check,
  Save,
  RefreshCw,
} from 'lucide-react'

/**
 * Seção 16 — Níveis de Acesso (CRUD) & Autorizações de Uso
 * Modelo do CEO (chaves de hotel):
 *  N1 Somente Leitura  → ver
 *  N2 Leitura+Criação  → ver, criar
 *  N3 +Edição          → ver, criar, editar
 *  N4 Acesso Total     → ver, criar, editar, apagar (chave mestra)
 * A API (hook controle_acesso.js) valida o nível exigido por comando —
 * novos comandos só precisam declarar o nível mínimo aqui e na API.
 */

const NIVEIS = [
  {
    nivel: 1,
    nome: 'Nível 01 — Somente Leitura',
    permite: ['Ver'],
    exemplo: 'Enxerga e lê o que está na tela.',
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
  },
  {
    nivel: 2,
    nome: 'Nível 02 — Leitura e Criação',
    permite: ['Ver', 'Criar'],
    exemplo: 'Vê tudo e cadastra novos itens.',
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
  },
  {
    nivel: 3,
    nome: 'Nível 03 — Leitura, Criação e Edição',
    permite: ['Ver', 'Criar', 'Editar'],
    exemplo: 'Vê, cadastra e altera dados já salvos.',
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
  },
  {
    nivel: 4,
    nome: 'Nível 04 — Acesso Total',
    permite: ['Ver', 'Criar', 'Editar', 'Apagar'],
    exemplo: 'Administrador: chave mestra de todos os quartos.',
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
  },
] as const

/** Catálogo de comandos e o nível mínimo exigido (liberados por nível). */
const COMANDOS = [
  { cmd: 'VER', nome: 'Consultar (ver o conteúdo)', min: 1, grupo: 'Consultar' },
  { cmd: 'CRIAR', nome: 'Criar (cadastrar novo item)', min: 2, grupo: 'Incluir' },
  { cmd: 'EDITAR', nome: 'Editar (alterar dado salvo)', min: 3, grupo: 'Alterar' },
  { cmd: 'APAGAR', nome: 'Apagar (excluir qualquer coisa)', min: 4, grupo: 'Excluir' },
  {
    cmd: 'AUTORIZAR',
    nome: 'Autorizar / alterar nível de usuário (juntar chaves)',
    min: 4,
    grupo: 'Excluir',
  },
] as const

interface Usuario {
  id: string
  nome: string
  email: string
  nivel: number
  ativo: boolean
  obs?: string
  updated?: string
}

interface Bloqueio {
  id: string
  chave: string
  tentativas: number
  bloqueado: boolean
  bloqueado_em: string
  ultimo_comando: string
  ultimo_motivo: string
  acessos_janela: number
  janela_expirada: boolean
  desbloqueado_por: string
  desbloqueado_em: string
}

const PB_URL = 'https://verificacao-projeto-panorama-18549.shrd00.internal.goskip.dev'

function badgeNivel(n: number) {
  const map: Record<number, string> = {
    1: 'bg-blue-100 text-blue-800',
    2: 'bg-emerald-100 text-emerald-800',
    3: 'bg-amber-100 text-amber-800',
    4: 'bg-rose-100 text-rose-800',
  }
  return map[n] || 'bg-slate-100 text-slate-800'
}

export function SectionControleAcesso() {
  const [busca, setBusca] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [form, setForm] = useState<{ nome: string; email: string; nivel: number; obs: string }>({
    nome: '',
    email: '',
    nivel: 1,
    obs: '',
  })
  const [editId, setEditId] = useState<string | null>(null)
  const [editNivel, setEditNivel] = useState(1)
  const [editAtivo, setEditAtivo] = useState(true)
  const [delId, setDelId] = useState<string | null>(null)
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([])
  const [carregandoBloqueios, setCarregandoBloqueios] = useState(false)

  const carregarBloqueios = async () => {
    setCarregandoBloqueios(true)
    try {
      const r = await fetch(`${PB_URL}/backend/v1/acesso-bloqueios`, {
        headers: { 'X-Painel-Token': lerToken() },
      })
      const j = await r.json()
      if (r.ok && j.bloqueios) setBloqueios(j.bloqueios)
    } catch {
      /* silencioso — a lista aparece vazia */
    } finally {
      setCarregandoBloqueios(false)
    }
  }

  const desbloquear = async (chave: string) => {
    setMsg(null)
    try {
      const r = await fetch(`${PB_URL}/backend/v1/acesso-bloqueios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': lerToken() },
        body: JSON.stringify({ chave }),
      })
      const j = await r.json()
      if (!r.ok) setMsg({ ok: false, texto: j.error || 'Erro ao desbloquear.' })
      else {
        setMsg({ ok: true, texto: `🔓 Chave ${chave} desbloqueada pelo administrador.` })
        carregarBloqueios()
      }
    } catch {
      setMsg({ ok: false, texto: 'Falha de conexão com o backend.' })
    }
  }

  const lerToken = () =>
    typeof window !== 'undefined' ? window.localStorage.getItem('simul_painel_token') || '' : ''

  const carregar = async () => {
    setCarregando(true)
    setMsg(null)
    try {
      const r = await fetch(`${PB_URL}/backend/v1/acesso-usuarios`, {
        headers: { 'X-Painel-Token': lerToken() },
      })
      const j = await r.json()
      if (r.status === 401) {
        setMsg({
          ok: false,
          texto:
            '🔑 Autorize-se no botão “🔑 Token” do painel Cadastro & Envios antes de gerenciar as chaves.',
        })
        setUsuarios([])
      } else if (j.usuarios) {
        setUsuarios(j.usuarios)
      } else {
        setMsg({ ok: false, texto: j.error || 'Não foi possível carregar a lista.' })
      }
    } catch {
      setMsg({ ok: false, texto: 'Falha de conexão com o backend.' })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    carregarBloqueios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const criar = async () => {
    setMsg(null)
    try {
      const r = await fetch(`${PB_URL}/backend/v1/acesso-usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': lerToken() },
        body: JSON.stringify({
          usuario: {
            nome: form.nome,
            email: form.email,
            nivel: form.nivel,
            obs: form.obs,
          },
        }),
      })
      const j = await r.json()
      if (r.status === 401)
        setMsg({ ok: false, texto: '🔑 Token do painel ausente ou inválido (N4 exigido).' })
      else if (r.status === 403) setMsg({ ok: false, texto: '⛔ ' + (j.error || 'Ação negada.') })
      else if (!r.ok) setMsg({ ok: false, texto: j.error || 'Erro ao salvar.' })
      else {
        setMsg({
          ok: true,
          texto: `✅ Chave entregue a ${j.usuario.nome} — Nível ${String(j.usuario.nivel).padStart(2, '0')}.`,
        })
        setForm({ nome: '', email: '', nivel: 1, obs: '' })
        carregar()
      }
    } catch {
      setMsg({ ok: false, texto: 'Falha de conexão com o backend.' })
    }
  }

  const salvarEdicao = async () => {
    if (!editId) return
    setMsg(null)
    try {
      const r = await fetch(`${PB_URL}/backend/v1/acesso-usuarios`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': lerToken() },
        body: JSON.stringify({ id: editId, nivel: editNivel, ativo: editAtivo }),
      })
      const j = await r.json()
      if (!r.ok) setMsg({ ok: false, texto: j.error || 'Erro ao salvar.' })
      else {
        setMsg({ ok: true, texto: '✅ Chave reajustada.' })
        setEditId(null)
        carregar()
      }
    } catch {
      setMsg({ ok: false, texto: 'Falha de conexão com o backend.' })
    }
  }

  const apagar = async (id: string) => {
    setMsg(null)
    try {
      const r = await fetch(`${PB_URL}/backend/v1/acesso-usuarios`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': lerToken() },
        body: JSON.stringify({ id }),
      })
      const j = await r.json()
      if (!r.ok) setMsg({ ok: false, texto: j.error || 'Erro ao apagar.' })
      else {
        setMsg({ ok: true, texto: '🗑️ Chave devolvida ao mural (usuário removido).' })
        setDelId(null)
        carregar()
      }
    } catch {
      setMsg({ ok: false, texto: 'Falha de conexão com o backend.' })
    }
  }

  const usuariosFiltrados = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (!t) return usuarios
    return usuarios.filter((u) =>
      `${u.nome} ${u.email}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(t),
    )
  }, [usuarios, busca])

  return (
    <section id="controle-acesso" className="scroll-mt-24">
      {/* Cabeçalho navy + dourado (identidade ADECONT) */}
      <div className="rounded-2xl bg-panorama-navy text-white p-6 md:p-8 border-b-2 border-panorama-gold/60">
        <div className="flex items-start gap-4">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-panorama-gold/20 ring-1 ring-panorama-gold/50 text-panorama-gold-light shrink-0">
            <KeyRound className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-panorama-gold text-panorama-navy font-bold text-sm ring-1 ring-panorama-gold-light/50">
                16
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Níveis de Acesso (CRUD) & Autorizações de Uso
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
              Controla quem pode apenas <b>ver</b> informações e quem tem autorização para{' '}
              <b>criar</b>, <b>alterar</b> ou <b>apagar</b> dados. As permissões são separadas em
              quatro níveis diretos — como as <b>chaves de hotel</b>: a chave do hóspede só abre o
              quarto dele; a chave mestra da gerência abre todos os quartos.
            </p>
          </div>
        </div>
      </div>

      {/* Os 4 níveis */}
      <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {NIVEIS.map((n) => (
          <div key={n.nivel} className={`rounded-xl border-2 ${n.borda} ${n.bg} p-4 flex flex-col`}>
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border ${n.borda} ${n.cor} font-extrabold text-sm`}
              >
                {String(n.nivel).padStart(2, '0')}
              </span>
              {n.nivel === 4 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                  <Hotel className="w-3.5 h-3.5" /> chave mestra
                </span>
              )}
            </div>
            <h3 className={`mt-3 font-bold text-sm leading-snug ${n.cor}`}>{n.nome}</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Ver', 'Criar', 'Editar', 'Apagar'].map((acao) => {
                const tem = (n.permite as readonly string[]).includes(acao)
                return (
                  <span
                    key={acao}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      tem
                        ? 'bg-white border border-slate-300 text-slate-800'
                        : 'bg-slate-100 text-slate-300 border border-slate-100'
                    }`}
                  >
                    {acao === 'Ver' && <Eye className="w-3 h-3" />}
                    {acao === 'Criar' && <Plus className="w-3 h-3" />}
                    {acao === 'Editar' && <Pencil className="w-3 h-3" />}
                    {acao === 'Apagar' && <Trash2 className="w-3 h-3" />}
                    {acao}
                    {tem ? '' : ' ✕'}
                  </span>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-snug">{n.exemplo}</p>
          </div>
        ))}
      </div>

      {/* Comandos liberados por nível */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 bg-panorama-navy border-b-2 border-panorama-gold/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-panorama-gold-light" />
            Comandos liberados por nível
          </h3>
          <span className="text-[11px] text-slate-300 hidden sm:inline">
            novos comandos entram aqui e na API com o nível mínimo
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold">
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">
                Comando
              </th>
              <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">
                O que faz
              </th>
              <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                N1
              </th>
              <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                N2
              </th>
              <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                N3
              </th>
              <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                N4
              </th>
            </tr>
          </thead>
          <tbody>
            {COMANDOS.map((c) => (
              <tr key={c.cmd} className="border-b border-slate-100">
                <td className="px-4 py-2 font-mono text-xs font-bold text-slate-800">{c.cmd}</td>
                <td className="px-4 py-2 text-slate-700">{c.nome}</td>
                {[1, 2, 3, 4].map((n) => (
                  <td key={n} className="px-4 py-2 text-center">
                    {n >= c.min ? (
                      <Check className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 inline" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trava de segurança — Rate Limit + bloqueio na 3ª tentativa */}
      <div className="mt-6 rounded-xl border-2 border-rose-200 bg-rose-50 overflow-hidden">
        <div className="px-4 py-3 bg-rose-700 border-b-2 border-rose-300 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-100" />🔒 Trava de Segurança — Rate Limit &
            Bloqueio
          </h3>
          <span className="text-[11px] text-rose-100 hidden sm:inline">
            porta giratória: 10 pedidos/minuto · bloqueio na 3ª tentativa falha
          </span>
        </div>
        <div className="p-4">
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-white border border-rose-200 p-3">
              <p className="text-xs font-bold text-rose-800">🚪 Porta giratória (Rate Limit)</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                A mesma chave só faz <b>10 pedidos por minuto</b>. O 11º volta com aviso “aguarde 1
                minuto” — como a fila do banco que não deixa a agência lotar.
              </p>
            </div>
            <div className="rounded-lg bg-white border border-rose-200 p-3">
              <p className="text-xs font-bold text-rose-800">⛔ Bloqueio na 3ª tentativa</p>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                <b>3 comandos negados</b> (sem chave, nível insuficiente) e a chave fica
                <b> BLOQUEADA</b> — todo pedido seguinte é recusado até o desbloqueio.
              </p>
            </div>
            <div className="rounded-lg bg-white border border-rose-200 p-3">
              <p className="text-xs font-bold text-rose-800">
                🔑 Desbloqueio só com o administrador
              </p>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                Somente o <b>Nível 04</b> (chave mestra / token do painel) devolve a chave ao mural.
                Cada desbloqueio fica registrado na auditoria.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Fila da trava — chaves monitoradas
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                {bloqueios.length}
              </span>
            </h4>
            <button
              onClick={carregarBloqueios}
              disabled={carregandoBloqueios}
              className="p-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
              title="Atualizar fila da trava"
            >
              <RefreshCw className={`w-4 h-4 ${carregandoBloqueios ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-rose-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rose-700 text-white border-b-2 border-rose-300">
                  <th className="px-3 py-2 text-left text-xs uppercase font-semibold">Chave</th>
                  <th className="px-3 py-2 text-center text-xs uppercase font-semibold">Falhas</th>
                  <th className="px-3 py-2 text-center text-xs uppercase font-semibold">
                    Pedidos/min
                  </th>
                  <th className="px-3 py-2 text-left text-xs uppercase font-semibold">
                    Último comando
                  </th>
                  <th className="px-3 py-2 text-center text-xs uppercase font-semibold">Estado</th>
                  <th className="px-3 py-2 text-right text-xs uppercase font-semibold">
                    Ação (N4)
                  </th>
                </tr>
              </thead>
              <tbody>
                {carregandoBloqueios && bloqueios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-400 text-xs">
                      Carregando fila da trava…
                    </td>
                  </tr>
                )}
                {!carregandoBloqueios && bloqueios.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-400 text-xs">
                      Nenhuma chave monitorada ainda — a trava registra na primeira tentativa.
                    </td>
                  </tr>
                )}
                {bloqueios.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs font-bold text-slate-800">
                      {b.chave}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          b.tentativas >= 3
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.tentativas}/3
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-slate-600">
                      {b.acessos_janela}/10{b.janela_expirada ? ' (janela renovada)' : ''}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600">
                      <b>{b.ultimo_comando || '—'}</b>
                      {b.ultimo_motivo && (
                        <span className="block text-[10px] text-slate-400">{b.ultimo_motivo}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          b.bloqueado ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {b.bloqueado ? '🔒 BLOQUEADA' : 'OK'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {b.bloqueado ? (
                        <button
                          onClick={() => desbloquear(b.chave)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800"
                          title="Desbloquear (somente N4 — administrador)"
                        >
                          🔓 Desbloquear
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mural de chaves */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-panorama-gold-dark" />
            Autorizações de uso — mural de chaves
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-panorama-gold/15 text-panorama-gold-dark text-xs font-bold">
              {usuarios.length} {usuarios.length === 1 ? 'chave' : 'chaves'}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setBusca('')}
                placeholder="Buscar por nome ou e-mail… (Esc limpa)"
                className="w-56 pl-8 pr-8 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600 bg-slate-50"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-700"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={carregar}
              disabled={carregando}
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`mx-4 mt-3 px-3 py-2 rounded-lg text-[13px] ${
              msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
            }`}
          >
            {msg.texto}
          </div>
        )}

        {/* Formulário de nova autorização (CRIAR — exige N2+) */}
        <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
            Entregar nova chave (comando CRIAR — Nível 02+)
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Nome *</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome da pessoa"
                className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600">E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="pessoa@empresa.com.br"
                className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Nível da chave</label>
              <select
                value={form.nivel}
                onChange={(e) => setForm({ ...form, nivel: Number(e.target.value) })}
                className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
              >
                {NIVEIS.map((n) => (
                  <option key={n.nivel} value={n.nivel}>
                    {String(n.nivel).padStart(2, '0')} — {n.nome.split('— ')[1]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600">Observação</label>
              <input
                value={form.obs}
                onChange={(e) => setForm({ ...form, obs: e.target.value })}
                placeholder="Ex.: equipe fiscal (opcional)"
                className="w-full px-2.5 py-2 text-[13px] rounded-lg border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
          <button
            onClick={criar}
            disabled={!form.nome.trim() || !form.email.trim()}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-panorama-navy text-white text-sm font-bold hover:bg-panorama-navy-light disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Entregar chave
          </button>
        </div>

        {/* Tabela de usuários */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold">
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">
                  Pessoa
                </th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wide font-semibold">
                  E-mail
                </th>
                <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                  Nível
                </th>
                <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                  Pode
                </th>
                <th className="px-4 py-2 text-center text-xs uppercase tracking-wide font-semibold">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs uppercase tracking-wide font-semibold">
                  Ações (por nível)
                </th>
              </tr>
            </thead>
            <tbody>
              {carregando && usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">
                    Carregando mural de chaves…
                  </td>
                </tr>
              )}
              {!carregando && usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs">
                    Nenhuma chave no mural{busca ? ' para esta busca' : ' ainda'}. Entregue a
                    primeira no formulário acima.
                  </td>
                </tr>
              )}
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">
                    {u.nome}
                    {u.obs && (
                      <span className="block text-[11px] font-normal text-slate-400">{u.obs}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${badgeNivel(u.nivel)}`}
                    >
                      {String(u.nivel).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center text-[11px] text-slate-600">
                    {['Ver', 'Criar', 'Editar', 'Apagar']
                      .filter((a, i) => i + 1 <= u.nivel)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {u.ativo ? 'ATIVA' : 'BLOQUEADA'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {/* EDITAR — nível 3 do operador exigido pela API */}
                    <button
                      onClick={() => {
                        setEditId(u.id)
                        setEditNivel(u.nivel)
                        setEditAtivo(u.ativo)
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold hover:bg-amber-100"
                      title="Reajustar nível da chave (comando EDITAR — N3)"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Nível
                    </button>
                    {/* APAGAR — nível 4 do operador exigido pela API */}
                    <button
                      onClick={() => setDelId(u.id)}
                      className="ml-1.5 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                      title="Devolver a chave (comando APAGAR — N4)"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edição de nível */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setEditId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-panorama-gold">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-panorama-gold-dark" /> Reajustar chave (comando EDITAR
              — N3)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Somente quem possui Nível 03 ou superior consegue alterar um nível já entregue.
            </p>
            <label className="block mt-4 text-xs font-semibold text-slate-600">Novo nível</label>
            <select
              value={editNivel}
              onChange={(e) => setEditNivel(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            >
              {NIVEIS.map((n) => (
                <option key={n.nivel} value={n.nivel}>
                  {String(n.nivel).padStart(2, '0')} — {n.nome.split('— ')[1]}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 mt-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={editAtivo}
                onChange={(e) => setEditAtivo(e.target.checked)}
              />
              Chave ativa (desmarque para bloquear o acesso sem apagar)
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-panorama-navy text-white text-sm font-bold hover:bg-panorama-navy-light"
              >
                <Save className="w-4 h-4" /> Salvar nível
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de apagagem */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDelId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-t-4 border-rose-500">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" /> Devolver a chave? (comando APAGAR — N4)
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              A pessoa perde o acesso e a autorização é removida do mural. Esta ação é exclusiva do
              Nível 04 (acesso total).
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDelId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => apagar(delId)}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700"
              >
                Apagar autorização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé de capitulação do modelo */}
      <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
        Modelo definido pelo CEO Antonio Joildo (05/10/2026): 4 níveis diretos de CRUD — Leitura ·
        Criação · Edição · Apagagem — com a analogia das chaves de hotel. A validação de cada
        comando roda no backend (hook <code>controle_acesso.js</code>): mesmo que a tela seja
        burlada, o comando é recusado se o nível da chave for inferior ao exigido. Estrutura
        preparada para novos comandos (basta declarar o nível mínimo no catálogo).
      </p>
    </section>
  )
}
