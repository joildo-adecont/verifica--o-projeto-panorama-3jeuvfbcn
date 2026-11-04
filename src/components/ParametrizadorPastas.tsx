import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Folder,
  FolderPlus,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'

/**
 * PASTAS POR CLIENTE — individualizador de documentação
 * ======================================================
 * Pedido do CEO (03/11/2026): "criar um individualizador de documentação em
 * pastas separadas por cliente por parametrização para não misturar documentos."
 *
 * ── O QUE ESTA TELA FAZ QUE UMA PASTA DE VERDADE PRECISA FAZER ──
 * 1. Criar a pasta com nome e CNPJ.
 * 2. IMPEDIR a mistura: a nota de um CNPJ não entra em pasta de outro. A trava
 *    está na gravação (backend), não aqui — esta tela só mostra o recado.
 * 3. Consertar o que já está fora de pasta: move em lote.
 * 4. Apagar a pasta SEM apagar nota: os documentos voltam a "sem pasta".
 *
 * ── POR QUE O CNPJ DA PASTA É O CAMPO MAIS IMPORTANTE ──
 * Sem ele, a pasta é só um rótulo — e a nota do cliente A vai para a pasta do B
 * sem ninguém perceber. Com ele, a importação recusa e diz por quê.
 *
 * ── O QUE A TELA DIZ QUANDO NÃO SABE ──
 * Documento sem pasta aparece com o valor dele. Não somo esses valores nos
 * relatórios por cliente: dinheiro que não se sabe de quem é não pertence a
 * nenhum cliente, e ratear seria inventar.
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

interface Pasta {
  id: string
  nome: string
  cnpj: string
  cliente_id: string
  cor: string
  observacao: string
  ativo: boolean
  documentos: number
  entrada: number
  saida: number
}

interface DocSemPasta {
  id: string
  chave: string
  modelo: string
  numero: string
  emitente: string
  cnpj: string
  valor_total: number
  direcao: string
  nome_arquivo: string
  importado_em: string
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
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [semPasta, setSemPasta] = useState(0)
  const [totalDocs, setTotalDocs] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // criar / editar
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cor, setCor] = useState('slate')
  const [obs, setObs] = useState('')
  const [editando, setEditando] = useState<string | null>(null)

  // busca
  const [busca, setBusca] = useState('')

  // mover documentos
  const [painelMover, setPainelMover] = useState(false)
  const [docsSoltos, setDocsSoltos] = useState<DocSemPasta[]>([])
  const [selDocs, setSelDocs] = useState<Set<string>>(new Set())
  const [pastaDestino, setPastaDestino] = useState('')
  const [resultadoMover, setResultadoMover] = useState<any>(null)

  // apagar
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
      const j = await chamar('param-pastas')
      setPastas(j.pastas || [])
      setSemPasta(j.documentos_sem_pasta || 0)
      setTotalDocs(j.total_documentos || 0)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, chamar])

  useEffect(() => {
    if (token) carregar()
  }, [token])

  const salvar = async () => {
    if (!nome.trim()) {
      setErro('Dê um nome à pasta.')
      return
    }
    setErro(null)
    try {
      if (editando) {
        await chamar('param-pastas', {
          metodo: 'PATCH',
          corpo: { id: editando, nome: nome.trim(), cnpj, cor, observacao: obs },
        })
        setAviso('Pasta atualizada.')
      } else {
        await chamar('param-pastas', {
          corpo: { nome: nome.trim(), cnpj, cor, observacao: obs },
        })
        setAviso('Pasta criada.')
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

  const abrirEdicao = (p: Pasta) => {
    setEditando(p.id)
    setNome(p.nome)
    setCnpj(p.cnpj || '')
    setCor(p.cor || 'slate')
    setObs(p.observacao || '')
    setCriando(true)
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

  /** Carrega os documentos sem pasta — a fila do conserto. */
  const abrirMover = async () => {
    setPainelMover(true)
    setResultadoMover(null)
    setSelDocs(new Set())
    setErro(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-documentos`, {
        headers: { 'X-Painel-Token': token },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      const soltos = (j.documentos || []).filter((d: any) => !d.pasta_nome)
      setDocsSoltos(soltos)
    } catch (e: any) {
      setErro(e.message)
    }
  }

  const mover = async () => {
    if (!selDocs.size || !pastaDestino) return
    setErro(null)
    try {
      const j = await chamar('param-mover-lote', {
        corpo: { documento_ids: Array.from(selDocs), pasta: pastaDestino },
      })
      setResultadoMover(j)
      setSelDocs(new Set())
      carregar()
    } catch (e: any) {
      setErro(e.message)
    }
  }

  const alternar = (id: string) => {
    const s = new Set(selDocs)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setSelDocs(s)
  }

  const filtradas = useMemo(() => {
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (!t) return pastas
    return pastas.filter(
      (p) =>
        p.nome
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(t) || (p.cnpj || '').includes(t.replace(/\D/g, '')),
    )
  }, [pastas, busca])

  const corDe = (c: string) => CORES.find((x) => x.v === c)?.cls || 'bg-slate-500'

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

      {/* ── barra de ações ── */}
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
            Nova pasta
          </button>
          <button
            type="button"
            onClick={abrirMover}
            disabled={!token}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-panorama-navy px-2.5 py-1.5 text-[11px] font-bold text-panorama-navy hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Organizar documentos {semPasta > 0 && `(${semPasta} sem pasta)`}
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
              placeholder="Buscar pasta ou CNPJ"
              className="w-[180px] text-[11px] bg-transparent focus:outline-none"
            />
          </label>
        </div>

        {semPasta > 0 && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] leading-snug text-amber-900">
            <AlertTriangle className="mt-0.5 w-3 h-3 shrink-0" />
            <span>
              <b>{semPasta}</b> de {totalDocs} documento(s) estão <b>sem pasta</b> — não aparecem em
              nenhum relatório por cliente. Use <b>Organizar documentos</b> para encaixá-los.
            </span>
          </p>
        )}
      </div>

      {/* ── formulário criar/editar ── */}
      {criando && (
        <div className="rounded-xl border-2 border-panorama-gold/60 bg-amber-50/40 p-3">
          <p className="text-[11px] font-bold text-slate-900">
            {editando ? 'Editar pasta' : 'Nova pasta de cliente'}
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
                CNPJ do cliente
                <span className="ml-1 font-normal text-slate-500">
                  — é o que impede nota de outro cliente entrar aqui
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
                placeholder="Opcional — ex.: filial, grupo, contato"
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
              onClick={salvar}
              className="rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer"
            >
              {editando ? 'Salvar alterações' : 'Criar pasta'}
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

      {/* ── painel de organização ── */}
      {painelMover && (
        <div className="rounded-xl border-2 border-panorama-navy/40 bg-white p-3">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold text-slate-900">
              Documentos sem pasta ({docsSoltos.length})
            </p>
            <button
              onClick={() => setPainelMover(false)}
              className="ml-auto cursor-pointer text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {docsSoltos.length === 0 ? (
            <p className="mt-2 rounded-lg bg-emerald-50 border border-emerald-300 p-2 text-[10.5px] text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Todos os documentos já estão em uma pasta.
            </p>
          ) : (
            <>
              <div className="mt-2 max-h-[260px] overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {docsSoltos.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-start gap-2 px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selDocs.has(d.id)}
                      onChange={() => alternar(d.id)}
                      className="mt-0.5 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] font-bold text-slate-900 truncate">
                        {d.emitente}{' '}
                        <span className="font-normal text-slate-500">
                          · mod. {d.modelo} nº {d.numero}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        {d.cnpj || 'sem CNPJ'} · {brl(d.valor_total)} · {d.direcao || 'sem direção'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="flex-1 min-w-[200px]">
                  <span className="text-[10px] font-bold text-slate-600">
                    Mover {selDocs.size} selecionado(s) para
                  </span>
                  <select
                    value={pastaDestino}
                    onChange={(e) => setPastaDestino(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
                  >
                    <option value="">— escolha a pasta —</option>
                    {pastas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                        {p.cnpj ? ` (${p.cnpj})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={mover}
                  disabled={!selDocs.size || !pastaDestino}
                  className="rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                >
                  Mover
                </button>
              </div>

              {resultadoMover && (
                <div className="mt-2 rounded-lg border border-slate-300 bg-slate-50 p-2 text-[10px]">
                  <p className="font-bold text-slate-900">
                    {resultadoMover.movidos} movido(s) para {resultadoMover.pasta}
                    {resultadoMover.recusados > 0 && (
                      <span className="ml-1 text-rose-700">
                        · {resultadoMover.recusados} recusado(s)
                      </span>
                    )}
                  </p>
                  {(resultadoMover.detalhe_recusados || []).map((r: any, i: number) => (
                    <p key={i} className="mt-0.5 text-rose-800">
                      <b>{r.nome || r.id}</b>: {r.motivo}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── lista de pastas ── */}
      {filtradas.length === 0 && !carregando ? (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-[11px] text-slate-600">
          {pastas.length === 0
            ? 'Nenhuma pasta criada ainda. Crie a primeira para separar os documentos por cliente.'
            : 'Nenhuma pasta encontrada para esta busca.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtradas.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border-2 border-slate-200 bg-white p-3 hover:border-panorama-gold/60 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg ${corDe(p.cor)} text-white shrink-0`}
                >
                  <Folder className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-bold text-slate-900 leading-tight truncate">
                    {p.nome}
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">{p.cnpj || 'sem CNPJ'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirEdicao(p)}
                    title="Editar"
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setConfirmando(p.id)}
                    title="Apagar pasta (não apaga documentos)"
                    className="text-slate-400 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {p.observacao && (
                <p className="mt-1 text-[9px] text-slate-500 leading-snug line-clamp-2">
                  {p.observacao}
                </p>
              )}

              <div className="mt-1.5 flex items-center gap-2 text-[9.5px]">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-bold text-slate-700">
                  {p.documentos} doc
                </span>
                <span className="text-blue-700 tabular-nums">E {brlCurto(p.entrada)}</span>
                <span className="text-emerald-700 tabular-nums">S {brlCurto(p.saida)}</span>
              </div>

              {confirmando === p.id && (
                <div className="mt-2 rounded-lg border border-rose-300 bg-rose-50 p-2">
                  <p className="text-[9.5px] leading-snug text-rose-900">
                    Apagar a pasta <b>{p.nome}</b>? Os <b>{p.documentos} documento(s)</b> continuam
                    no sistema, apenas sem pasta. Nenhuma nota é apagada.
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    <button
                      onClick={() => apagar(p.id)}
                      className="rounded bg-rose-700 px-2 py-1 text-[9.5px] font-bold text-white cursor-pointer"
                    >
                      Apagar pasta
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
          ))}
        </div>
      )}

      <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] leading-snug text-slate-500">
        <b>Como funciona a trava:</b> a pasta tem um CNPJ. Ao importar um lote para ela, cada
        documento só entra se esse CNPJ aparecer como emitente ou destinatário. Se não aparecer, a
        nota <b>não é descartada</b> — entra sem pasta e o resultado do lote diz o motivo, com os
        dois números. Documento sem pasta não soma em nenhum cliente: valor que não se sabe de quem
        é não pertence a ninguém.
      </p>
    </div>
  )
}
