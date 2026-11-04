import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  FolderPlus,
  Layers,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Wand2,
  X,
  XCircle,
} from 'lucide-react'

/**
 * PASTAS POR CLIENTE — hierarquia Base → Entradas (Compras) / Saídas (Vendas)
 * ===========================================================================
 * Pedido do CEO (03/11/2026): "Para cada cliente devemos criar uma pasta Base,
 * contendo duas pastas uma de entradas (Compras) e outra de Saídas (Vendas)."
 *
 * ── POR QUE A SEPARAÇÃO POR NATUREZA É O QUE DÁ SENTIDO AO NÚMERO ──
 * Já havia a divisão por cliente. O que faltava era a divisão por natureza da
 * operação DENTRO do cliente — e é ela que separa dois universos que NÃO se
 * somam:
 *
 *   Entradas (Compras) → geram CRÉDITO → o que o cliente comprou
 *   Saídas   (Vendas)  → geram DÉBITO  → o que o cliente vendeu
 *
 * Somar compras com vendas não dá faturamento nem custo: dá um número que não
 * significa nada. Separados, cada lado tem o seu valor e a apuração passa a ser
 * possível.
 *
 * ── QUEM DECIDE ONDE O DOCUMENTO FICA ──
 * A DIREÇÃO dele, que vem do CFOP (gravada desde a Fase 4). Não é o operador que
 * escolhe: é o documento que diz a que pasta pertence. Documento sem CFOP não
 * tem folha certa — fica na base e a tela aponta, em vez de adivinhar.
 *
 * ── O QUE A TELA NUNCA FAZ ──
 * Não apaga nota. Apagar o cliente devolve os documentos à condição "sem
 * cliente"; a estrutura é para organizar, não para destruir dado.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number | null | undefined) =>
  v === null || v === undefined || !isFinite(Number(v))
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const brlCurto = (v: number) => {
  const n = Math.abs(Number(v) || 0)
  if (n >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (n >= 1_000)
    return `R$ ${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
  return brl(v)
}

interface Totais {
  documentos: number
  entrada: number
  saida: number
}

interface Pasta {
  id: string
  nome: string
  cnpj: string
  cor: string
  observacao: string
  tipo: string
  pai: string
  ativo: boolean
  totais: Totais
}

interface NoCliente {
  base: Pasta
  filhas: Pasta[]
  consolidado: Totais
  estruturada: boolean
}

const CORES: { v: string; nome: string; cls: string }[] = [
  { v: 'slate', nome: 'Cinza', cls: 'bg-slate-500' },
  { v: 'blue', nome: 'Azul', cls: 'bg-blue-600' },
  { v: 'emerald', nome: 'Verde', cls: 'bg-emerald-600' },
  { v: 'amber', nome: 'Âmbar', cls: 'bg-amber-500' },
  { v: 'rose', nome: 'Vermelho', cls: 'bg-rose-600' },
  { v: 'violet', nome: 'Violeta', cls: 'bg-violet-600' },
  { v: 'teal', nome: 'Turquesa', cls: 'bg-teal-600' },
  { v: 'indigo', nome: 'Índigo', cls: 'bg-indigo-600' },
]

export function ParametrizadorPastas() {
  const [token, setToken] = useState('')
  const [clientes, setClientes] = useState<NoCliente[]>([])
  const [semPasta, setSemPasta] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cor, setCor] = useState('slate')
  const [obs, setObs] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const chamar = useCallback(
    async (rota: string, opts: { metodo?: string; corpo?: any } = {}) => {
      const r = await fetch(`${BACKEND}/backend/v1/${rota}`, {
        method: opts.metodo || (opts.corpo ? 'POST' : 'GET'),
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
        body: opts.corpo ? JSON.stringify(opts.corpo) : undefined,
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      return j
    },
    [token],
  )

  const carregar = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const j = await chamar('param-pastas-arvore')
      setClientes(j.arvore || [])
      setSemPasta(j.documentos_sem_pasta || 0)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, chamar])

  useEffect(() => {
    if (token) carregar()
  }, [token])

  const criarCliente = async () => {
    if (!nome.trim()) {
      setErro('Dê um nome ao cliente.')
      return
    }
    setErro(null)
    try {
      if (editando) {
        await chamar('param-pastas', {
          metodo: 'PATCH',
          corpo: { id: editando, nome: nome.trim(), cnpj, cor, observacao: obs },
        })
        setAviso('Cliente atualizado.')
      } else {
        await chamar('param-pastas-estruturar', {
          corpo: { criar: { nome: nome.trim(), cnpj, cor, observacao: obs } },
        })
        setAviso('Cliente criado com Base, Compras e Vendas.')
      }
      setNome('')
      setCnpj('')
      setObs('')
      setCor('slate')
      setCriando(false)
      setEditando(null)
      carregar()
    } catch (e: any) {
      setErro(e.message)
    }
  }

  const estruturar = async (baseId: string, nomeCliente: string) => {
    setErro(null)
    try {
      await chamar('param-pastas-estruturar', { corpo: { pasta: baseId } })
      setAviso(`${nomeCliente}: Compras e Vendas criadas.`)
      carregar()
    } catch (e: any) {
      setErro(e.message)
    }
  }

  const arquivar = async (baseId?: string) => {
    setErro(null)
    setCarregando(true)
    try {
      const j = await chamar('param-arquivar', {
        corpo: baseId ? { pasta_base: baseId } : { todas: true },
      })
      setAviso(
        `${j.movidos} documento(s) arquivado(s) na pasta certa.` +
          (j.sem_direcao > 0
            ? ` ${j.sem_direcao} sem direção ficaram na base (CFOP ausente).`
            : ''),
      )
      carregar()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  const apagar = async (id: string) => {
    setErro(null)
    try {
      const j = await chamar(`param-pastas?id=${id}`, { metodo: 'DELETE' })
      setAviso(j.aviso || 'Pasta apagada.')
      setConfirmando(null)
      carregar()
    } catch (e: any) {
      setErro(e.message)
    }
  }

  const abrirEdicao = (p: Pasta) => {
    setEditando(p.id)
    setNome(p.nome)
    setCnpj(p.cnpj || '')
    setCor(p.cor || 'slate')
    setObs(p.observacao || '')
    setCriando(true)
  }

  const alternarAberto = (id: string) => {
    const s = new Set(abertos)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setAbertos(s)
  }

  const filtrados = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (!t) return clientes
    return clientes.filter(
      (c) =>
        c.base.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(t) || (c.base.cnpj || '').includes(t.replace(/\D/g, '')),
    )
  }, [clientes, busca])

  const corDe = (c: string) => CORES.find((x) => x.v === c)?.cls || 'bg-slate-500'
  const semEstrutura = clientes.filter((c) => !c.estruturada).length

  return (
    <div className="space-y-3">
      {!token && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10.5px] text-amber-900">
          Informe o token do painel na aba <b>Importar e quebrar</b>.
        </p>
      )}
      {erro && (
        <p className="flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[10.5px] text-rose-900">
          <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
          {erro}
        </p>
      )}
      {aviso && (
        <p className="flex items-start gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 p-2 text-[10.5px] text-emerald-900">
          <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 shrink-0" />
          {aviso}
          <button onClick={() => setAviso(null)} className="ml-auto shrink-0 cursor-pointer">
            <X className="w-3 h-3" />
          </button>
        </p>
      )}

      {/* barra de ações */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCriando(true)
              setEditando(null)
              setNome('')
              setCnpj('')
              setObs('')
              setCor('slate')
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Novo cliente
          </button>
          <button
            type="button"
            onClick={() => arquivar()}
            disabled={!token || carregando}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-panorama-navy px-2.5 py-1.5 text-[11px] font-bold text-panorama-navy hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Arquivar por direção
          </button>
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <label className="ml-auto flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2 py-1">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente ou CNPJ"
              className="w-[180px] text-[11px] bg-transparent focus:outline-none"
            />
          </label>
        </div>

        <p className="mt-1.5 text-[9.5px] leading-snug text-slate-500">
          Cada cliente tem <b>Base</b> + <b>Compras</b> (entradas) + <b>Vendas</b> (saídas). O
          documento vai para a pasta filha pela <b>direção do CFOP</b> — não pela escolha de quem
          importa. <b>Arquivar por direção</b> põe na folha certa o que estiver na base.
        </p>

        {semEstrutura > 0 && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] leading-snug text-amber-900">
            <AlertTriangle className="mt-0.5 w-3 h-3 shrink-0" />
            <span>
              <b>{semEstrutura}</b> cliente(s) ainda sem as pastas de Compras e Vendas. Use o botão
              de estrutura ao lado do nome.
            </span>
          </p>
        )}
        {semPasta > 0 && (
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-slate-300 bg-slate-50 p-2 text-[10px] text-slate-700">
            <Layers className="mt-0.5 w-3 h-3 shrink-0" />
            <span>{semPasta} documento(s) sem cliente — não entram em nenhum totalizador.</span>
          </p>
        )}
      </div>

      {/* formulário */}
      {criando && (
        <div className="rounded-xl border-2 border-panorama-gold/60 bg-amber-50/40 p-3">
          <p className="text-[11px] font-bold text-slate-900">
            {editando ? 'Editar cliente' : 'Novo cliente — cria Base, Compras e Vendas'}
          </p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label>
              <span className="text-[10px] font-bold text-slate-600">Nome do cliente *</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Razão social ou nome curto"
                className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
              />
            </label>
            <label>
              <span className="text-[10px] font-bold text-slate-600">
                CNPJ
                <span className="ml-1 font-normal text-slate-500">
                  — impede nota de outro cliente entrar
                </span>
              </span>
              <input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] font-mono bg-white focus:outline-none focus:border-panorama-gold"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-600">Observação</span>
              <input
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Opcional — ex.: cidade, atividade, responsável"
                className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
              />
            </label>
            <div>
              <span className="text-[10px] font-bold text-slate-600">Cor</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {CORES.map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    onClick={() => setCor(c.v)}
                    title={c.nome}
                    className={`w-6 h-6 rounded-full ${c.cls} cursor-pointer ${
                      cor === c.v ? 'ring-2 ring-offset-1 ring-slate-900' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={criarCliente}
              className="rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer"
            >
              {editando ? 'Salvar alterações' : 'Criar cliente'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCriando(false)
                setEditando(null)
              }}
              className="rounded-lg border-2 border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* árvore */}
      {filtrados.length === 0 && !carregando ? (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-[11px] text-slate-600">
          {clientes.length === 0
            ? 'Nenhum cliente cadastrado. Crie o primeiro — ele já nasce com Base, Compras e Vendas.'
            : 'Nenhum cliente encontrado para esta busca.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => {
            const aberto = abertos.has(c.base.id)
            return (
              <div
                key={c.base.id}
                className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden"
              >
                <div className="flex items-center gap-2 p-2.5">
                  <button
                    onClick={() => alternarAberto(c.base.id)}
                    className="shrink-0 cursor-pointer text-slate-500 hover:text-slate-900"
                    title={aberto ? 'Recolher' : 'Expandir'}
                  >
                    {aberto ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-lg ${corDe(c.base.cor)} text-white shrink-0`}
                  >
                    <FolderTree className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-bold text-slate-900 leading-tight truncate">
                      {c.base.nome}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {c.base.cnpj || 'sem CNPJ'}
                      {!c.estruturada && (
                        <span className="ml-1 rounded bg-amber-100 px-1 font-sans font-bold text-amber-900">
                          sem Compras/Vendas
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[9.5px] shrink-0">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700">
                      {c.consolidado.documentos} doc
                    </span>
                    <span className="text-blue-700 tabular-nums" title="Entradas (Compras)">
                      C {brlCurto(c.consolidado.entrada)}
                    </span>
                    <span className="text-emerald-700 tabular-nums" title="Saídas (Vendas)">
                      V {brlCurto(c.consolidado.saida)}
                    </span>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {!c.estruturada && (
                      <button
                        onClick={() => estruturar(c.base.id, c.base.nome)}
                        title="Criar Compras e Vendas"
                        className="text-amber-700 hover:text-amber-900 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => arquivar(c.base.id)}
                      title="Arquivar documentos deste cliente pela direção"
                      className="text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => abrirEdicao(c.base)}
                      title="Editar"
                      className="text-slate-400 hover:text-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setConfirmando(c.base.id)}
                      title="Apagar cliente (não apaga documentos)"
                      className="text-slate-400 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {aberto && (
                  <div className="border-t border-slate-200 bg-slate-50/60 p-2 space-y-1">
                    {c.filhas.length === 0 ? (
                      <p className="px-2 py-1.5 text-[10px] text-amber-800">
                        Sem pastas de movimento. Clique no botão de estrutura para criar{' '}
                        <b>Compras</b> e <b>Vendas</b>.
                      </p>
                    ) : (
                      c.filhas.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-2 py-1.5"
                        >
                          <span
                            className={`flex items-center justify-center w-5 h-5 rounded ${
                              f.tipo === 'entrada'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            } shrink-0`}
                          >
                            {f.tipo === 'entrada' ? (
                              <ArrowDownToLine className="w-3 h-3" />
                            ) : (
                              <ArrowUpFromLine className="w-3 h-3" />
                            )}
                          </span>
                          <p className="text-[10.5px] font-bold text-slate-800 flex-1 min-w-0 truncate">
                            {f.tipo === 'entrada' ? 'Compras' : 'Vendas'}
                          </p>
                          <span className="text-[9px] rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-600 shrink-0">
                            {f.totais.documentos} doc
                          </span>
                          <span
                            className={`text-[9.5px] tabular-nums shrink-0 ${
                              f.tipo === 'entrada' ? 'text-blue-700' : 'text-emerald-700'
                            }`}
                          >
                            {brlCurto(f.tipo === 'entrada' ? f.totais.entrada : f.totais.saida)}
                          </span>
                        </div>
                      ))
                    )}

                    {c.base.totais.documentos > 0 && (
                      <p className="px-2 pt-1 text-[9px] text-amber-800">
                        <b>{c.base.totais.documentos}</b> documento(s) ainda na base — use{' '}
                        <b>Arquivar por direção</b> para levá-los às pastas certas.
                      </p>
                    )}
                  </div>
                )}

                {confirmando === c.base.id && (
                  <div className="border-t border-rose-200 bg-rose-50 p-2">
                    <p className="text-[9.5px] leading-snug text-rose-900">
                      Apagar <b>{c.base.nome}</b> e suas pastas de Compras/Vendas? Os{' '}
                      <b>{c.consolidado.documentos} documento(s)</b> continuam no sistema, apenas
                      sem cliente. Nenhuma nota é apagada.
                    </p>
                    <div className="mt-1 flex gap-1.5">
                      <button
                        onClick={() => apagar(c.base.id)}
                        className="rounded bg-rose-700 px-2 py-1 text-[9.5px] font-bold text-white cursor-pointer"
                      >
                        Apagar cliente
                      </button>
                      <button
                        onClick={() => setConfirmando(null)}
                        className="rounded border border-slate-300 px-2 py-1 text-[9.5px] font-bold text-slate-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] leading-snug text-slate-500">
        <b>Como a nota escolhe a pasta:</b> pelo CFOP. CFOP começando em 1, 2 ou 3 é entrada → vai
        para <b>Compras</b>. Começando em 5, 6 ou 7 é saída → vai para <b>Vendas</b>. Sem CFOP não
        há folha certa: o documento fica na base e aparece no aviso, em vez de ser adivinhado.
      </p>
    </div>
  )
}
