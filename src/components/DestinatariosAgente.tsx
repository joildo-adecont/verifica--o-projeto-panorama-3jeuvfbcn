import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'

/**
 * GESTÃO DOS DESTINATÁRIOS DO AGENTE DE VIGILÂNCIA
 *
 * Escolhe quem recebe os avisos a partir do CADASTRO — clientes do Simulador ou
 * usuários do sistema — e não por e-mail digitado.
 *
 * Por que do cadastro: um e-mail digitado à mão pode estar errado (e o alerta se
 * perde em silêncio) ou ser de alguém que não deveria ver o aviso. Vindo do
 * cadastro, o endereço é o mesmo que a empresa já mantém, e quem sai do cadastro
 * deixa de receber sem ninguém precisar lembrar de remover.
 *
 * O servidor valida de novo a cada gravação: mesmo que o painel mande um e-mail
 * inventado, ele é recusado com o motivo.
 */

const BACKEND = 'https://verificacao-projeto-panorama-18549.shrd00.internal.goskip.dev'
const TOKEN_KEY = 'adecont_agente_token'

interface Candidato {
  email: string
  nome: string
  empresa?: string
  nivel?: string
  origem: 'cliente' | 'usuario'
}

interface Copia {
  email: string
  nome: string
  origem: string
}

function token(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function DestinatariosAgente() {
  const [principal, setPrincipal] = useState('joildo@adecont.com.br')
  const [copias, setCopias] = useState<Copia[]>([])
  const [resumoSemanal, setResumoSemanal] = useState(true)
  const [clientes, setClientes] = useState<Candidato[]>([])
  const [usuarios, setUsuarios] = useState<Candidato[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [tk, setTk] = useState(token())
  const [mostrarToken, setMostrarToken] = useState(false)

  async function carregar(t: string) {
    if (!t) {
      setCarregando(false)
      setMostrarToken(true)
      return
    }
    setCarregando(true)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/agente-fontes/destinatarios`, {
        headers: { 'X-Painel-Token': t },
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setMsg({ tipo: 'erro', texto: d.erro || `falha ao ler (HTTP ${r.status})` })
        return
      }
      setPrincipal(d.principal || principal)
      setCopias(d.copia || [])
      setResumoSemanal(d.resumo_semanal !== false)
      setClientes(d.candidatos_clientes || [])
      setUsuarios(d.candidatos_usuarios || [])
    } catch (e) {
      setMsg({ tipo: 'erro', texto: `não consegui falar com o servidor: ${e}` })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar(tk)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function salvarToken() {
    try {
      localStorage.setItem(TOKEN_KEY, tk)
    } catch {
      /* modo privado: segue só na sessão */
    }
    setMostrarToken(false)
    carregar(tk)
  }

  function adicionar(c: Candidato) {
    if (copias.some((x) => x.email.toLowerCase() === c.email.toLowerCase())) {
      setMsg({ tipo: 'erro', texto: `${c.email} já está na lista` })
      return
    }
    if (c.email.toLowerCase() === principal.toLowerCase()) {
      setMsg({ tipo: 'erro', texto: 'Este já é o destinatário principal' })
      return
    }
    setCopias([...copias, { email: c.email, nome: c.nome, origem: c.origem }])
    setMsg(null)
  }

  function remover(email: string) {
    setCopias(copias.filter((x) => x.email !== email))
  }

  async function salvar() {
    setSalvando(true)
    setMsg(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/agente-fontes/destinatarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': tk },
        body: JSON.stringify({
          copia: copias,
          principal,
          resumo_semanal: resumoSemanal,
          ator: 'painel',
        }),
      })
      const d = await r.json()
      if (!r.ok || !d.ok) {
        setMsg({ tipo: 'erro', texto: d.erro || `falha ao salvar (HTTP ${r.status})` })
        return
      }
      setCopias(d.aceitos || [])
      if (d.recusados && d.recusados.length) {
        setMsg({
          tipo: 'erro',
          texto:
            `${d.recusados.length} recusado(s): ` +
            d.recusados
              .map((x: { email: string; motivo: string }) => `${x.email} (${x.motivo})`)
              .join('; '),
        })
      } else {
        setMsg({
          tipo: 'ok',
          texto: `Salvo. O aviso vai para ${principal}${d.aceitos?.length ? ` e mais ${d.aceitos.length} em cópia` : ''}.`,
        })
      }
    } catch (e) {
      setMsg({ tipo: 'erro', texto: `não consegui salvar: ${e}` })
    } finally {
      setSalvando(false)
    }
  }

  const jaEscolhidos = new Set(copias.map((c) => c.email.toLowerCase()))
  const disponiveisClientes = clientes.filter(
    (c) =>
      !jaEscolhidos.has(c.email.toLowerCase()) && c.email.toLowerCase() !== principal.toLowerCase(),
  )
  const disponiveisUsuarios = usuarios.filter(
    (c) =>
      !jaEscolhidos.has(c.email.toLowerCase()) && c.email.toLowerCase() !== principal.toLowerCase(),
  )

  if (mostrarToken) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
        <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Token do painel necessário
        </p>
        <p className="text-[10px] text-amber-800 mt-1 leading-snug">
          A lista de destinatários pode expor e-mails de clientes, então exige o token do painel.
          Cole abaixo — fica guardado neste navegador.
        </p>
        <div className="flex gap-1.5 mt-2">
          <input
            type="password"
            value={tk}
            onChange={(e) => setTk(e.target.value)}
            placeholder="token do painel"
            className="flex-1 rounded border border-amber-300 px-2 py-1 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          <button
            onClick={salvarToken}
            className="rounded bg-amber-700 text-white px-2.5 py-1 text-[11px] font-bold cursor-pointer hover:bg-amber-800"
          >
            Usar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      id="destinatarios-agente"
      className="rounded-xl border border-indigo-200 bg-white p-4 scroll-mt-24"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quem recebe os avisos</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Escolha do cadastro de clientes ou de usuários — o servidor valida cada e-mail contra
              o cadastro antes de gravar.
            </p>
          </div>
        </div>
        <button
          onClick={() => carregar(tk)}
          disabled={carregando}
          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Principal */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
          Destinatário principal — recebe alerta e resumo
        </p>
        <p className="text-[12px] font-bold text-slate-900 mt-0.5">{principal}</p>
      </div>

      {/* Cópias atuais */}
      <div className="mt-3">
        <p className="text-[10px] font-bold text-slate-700 mb-1.5">
          Em cópia {copias.length > 0 && <span className="text-slate-400">({copias.length})</span>}
        </p>
        {copias.length === 0 ? (
          <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2.5 py-2">
            Nenhuma cópia. Só o destinatário principal recebe.
          </p>
        ) : (
          <div className="space-y-1">
            {copias.map((c) => (
              <div
                key={c.email}
                className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2.5 py-1.5"
              >
                {c.origem === 'cliente' ? (
                  <Building2 className="w-3 h-3 text-sky-600 shrink-0" />
                ) : (
                  <UserRound className="w-3 h-3 text-violet-600 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-900 truncate">{c.nome}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{c.email}</p>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                  {c.origem}
                </span>
                <button
                  onClick={() => remover(c.email)}
                  className="text-rose-600 hover:text-rose-800 shrink-0 cursor-pointer"
                  aria-label={`Remover ${c.email}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adicionar do cadastro */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-sky-600" />
            Clientes do cadastro ({disponiveisClientes.length})
          </p>
          <div className="space-y-1 max-h-36 overflow-auto">
            {disponiveisClientes.length === 0 && (
              <p className="text-[10px] text-slate-400 px-1">Nenhum disponível.</p>
            )}
            {disponiveisClientes.map((c) => (
              <button
                key={c.email}
                onClick={() => adicionar(c)}
                className="w-full text-left rounded border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 px-2 py-1 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-800 truncate">{c.nome}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono truncate pl-3.5">{c.email}</p>
                {c.empresa && (
                  <p className="text-[9px] text-slate-400 truncate pl-3.5">{c.empresa}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-violet-600" />
            Usuários do sistema ({disponiveisUsuarios.length})
          </p>
          <div className="space-y-1 max-h-36 overflow-auto">
            {disponiveisUsuarios.length === 0 && (
              <p className="text-[10px] text-slate-400 px-1">Nenhum disponível.</p>
            )}
            {disponiveisUsuarios.map((c) => (
              <button
                key={c.email}
                onClick={() => adicionar(c)}
                className="w-full text-left rounded border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 px-2 py-1 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-800 truncate">{c.nome}</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono truncate pl-3.5">{c.email}</p>
                {c.nivel && (
                  <p className="text-[9px] text-slate-400 truncate pl-3.5">nível N{c.nivel}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo semanal */}
      <label className="mt-3 flex items-start gap-2 cursor-pointer rounded border border-slate-200 bg-slate-50/60 px-2.5 py-2">
        <input
          type="checkbox"
          checked={resumoSemanal}
          onChange={(e) => setResumoSemanal(e.target.checked)}
          className="mt-0.5 w-3.5 h-3.5 accent-indigo-700 cursor-pointer"
        />
        <span className="text-[10px] text-slate-700 leading-snug">
          <b>Enviar resumo semanal</b> mesmo quando nada mudar — a prova de que a vigilância rodou.
          Desmarcado, só chega e-mail quando houver alteração.
        </span>
      </label>

      {/* Salvar */}
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <button
          onClick={salvar}
          disabled={salvando || carregando}
          className="rounded-lg bg-indigo-700 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-indigo-800 disabled:opacity-50 cursor-pointer"
        >
          {salvando ? 'Salvando…' : 'Salvar destinatários'}
        </button>
        <button
          onClick={() => setMostrarToken(true)}
          className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
        >
          trocar token
        </button>
      </div>

      {msg && (
        <div
          className={`mt-2 rounded px-2.5 py-1.5 text-[10px] flex items-start gap-1.5 ${
            msg.tipo === 'ok'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {msg.tipo === 'ok' ? (
            <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          )}
          <span>{msg.texto}</span>
        </div>
      )}

      <p className="mt-2 text-[9px] text-slate-400 leading-snug">
        Quem sai do cadastro deixa de aparecer aqui e deixa de receber — sem precisar remover à mão.
        O servidor recusa qualquer e-mail que não conste no cadastro de clientes nem no de usuários.
      </p>
    </div>
  )
}
