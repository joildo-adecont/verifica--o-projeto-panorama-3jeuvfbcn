import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Info,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Target,
  X,
  XCircle,
} from 'lucide-react'
import {
  montarListaConferencia,
  nomeCapitulo,
  textoConferencia,
  type LinhaConferencia,
} from '@/data/listaConferencia'

/**
 * LISTA DE CONFERÊNCIA — produtos sem regra de alíquota
 * =====================================================
 * Pedido do CEO (04/11/2026): "levantar quais NCMs aparecem sem regra em toda a
 * base importada e montar uma lista de conferência: isso transforma o '7 de 10'
 * em trabalho dirigido, em vez de dúvida."
 *
 * ── A SEPARAÇÃO QUE DÁ VALOR À LISTA ──
 *   CASO A — o capítulo do NCM TEM regras nos Anexos, mas este código não casou.
 *            Quase sempre NCM genérico ou descrição frouxa. CONFERIR RENDE.
 *   CASO B — o capítulo inteiro não tem regra. O produto paga a integral porque
 *            a lei não previu redução. Conferir só confirma.
 *
 * Sem essa divisão, o contador abriria 100 itens para descobrir que 70 nunca
 * teriam benefício. Com ela, começa pelos que têm — e a lista mostra quanto
 * valor está em cada lado.
 *
 * ── O QUE A TELA NÃO FAZ ──
 * Não diz "este produto deveria pagar menos". Diz "aqui há regra no capítulo e
 * o código não casou — vale olhar". A diferença é a diferença entre trabalho e
 * promessa.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface Pasta {
  id: string
  nome: string
  cnpj: string
}

export function ParametrizadorConferencia() {
  const [token, setToken] = useState('')
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [pastaSel, setPastaSel] = useState('')
  const [itens, setItens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroCaso, setFiltroCaso] = useState<'A' | 'B' | ''>('')
  const [soPrioridade, setSoPrioridade] = useState(false)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const carregar = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-pastas-arvore`, {
        headers: { 'X-Painel-Token': token },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      const lista: Pasta[] = (j.arvore || []).map((n: any) => ({
        id: n.base.id,
        nome: n.base.nome,
        cnpj: n.base.cnpj,
      }))
      setPastas(lista)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token])

  useEffect(() => {
    if (token) carregar()
  }, [token])

  /** Carrega os itens do cliente escolhido (ou de todos, quando vazio). */
  const carregarItens = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      /* Com cliente escolhido: a rota que filtra no servidor por pasta/CNPJ.
         Sem cliente: a rota de todos os itens — que é o que "todos os clientes"
         significa. Antes eu mandava sem parâmetro para a rota que EXIGE pasta,
         ela respondia 400 e a tela dizia "nenhum item" como se a base estivesse
         vazia. */
      const url = pastaSel
        ? `${BACKEND}/backend/v1/param-itens-cliente?pasta=${encodeURIComponent(pastaSel)}`
        : `${BACKEND}/backend/v1/param-itens-todos`
      const r = await fetch(url, { headers: { 'X-Painel-Token': token } })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      setItens(j.lista || j.itens || [])
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, pastaSel])

  useEffect(() => {
    if (token) carregarItens()
  }, [token, pastaSel])

  /* ── a lista ── */
  const { linhas, resumo } = useMemo(
    () =>
      montarListaConferencia(
        itens.map((i) => ({
          ncm: i.ncm || '',
          descricao: i.descricao || '',
          valor: Number(i.valor) || 0,
          direcao: i.direcao,
          fornecedor: i.emitente,
          competencia: i.competencia,
        })),
      ),
    [itens],
  )

  const filtradas = useMemo(() => {
    let l = [...linhas]
    if (filtroCaso) l = l.filter((x) => x.caso === filtroCaso)
    if (soPrioridade) l = l.filter((x) => x.prioridade === 'alta')
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (t) {
      const termos = t.split(/\s+/)
      l = l.filter((x) => {
        const alvo =
          `${x.ncm} ${x.capitulo} ${nomeCapitulo(x.capitulo)} ${x.descricoes.join(' ')} ${x.fornecedores.join(' ')}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        return termos.every((term) => alvo.indexOf(term) >= 0)
      })
    }
    return l
  }, [linhas, busca, filtroCaso, soPrioridade])

  const nomeCliente = pastas.find((p) => p.id === pastaSel)?.nome || 'Todos os clientes'

  const imprimir = () => {
    const txt = textoConferencia(filtradas, resumo, nomeCliente)
    const janela = window.open('', '_blank', 'width=900,height=1000')
    if (!janela) return
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Lista de conferência — NCM</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  body { font-family: ui-monospace, "Courier New", monospace; font-size: 10px;
         line-height: 1.45; color: #111; white-space: pre-wrap; }
  @media print { body { font-size: 8.5pt; } }
</style></head><body>${txt
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</body></html>`)
    janela.document.close()
    setTimeout(() => janela.print(), 350)
  }

  const baixarCsv = () => {
    const cab = [
      'Caso',
      'Prioridade',
      'NCM',
      'Capitulo',
      'Descricao capitulo',
      'Itens',
      'Valor',
      'Descricoes nas notas',
      'Fornecedores',
      'O que fazer',
    ]
    const linhasCsv = [
      cab,
      ...filtradas.map((l) => [
        l.caso,
        l.prioridade,
        l.ncm,
        l.capitulo,
        nomeCapitulo(l.capitulo),
        String(l.itens),
        l.valor.toFixed(2),
        `"${l.descricoes.join(' | ').replace(/"/g, '')}"`,
        `"${l.fornecedores.join(' | ').replace(/"/g, '')}"`,
        `"${l.acao.replace(/"/g, '')}"`,
      ]),
    ]
    const csv = linhasCsv.map((r) => r.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'lista-conferencia-ncm.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const corCaso = (c: 'A' | 'B') =>
    c === 'A' ? 'border-rose-300 bg-rose-50' : 'border-slate-300 bg-slate-50'

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

      {/* barra de seleção */}
      <div className="rounded-xl border-2 border-panorama-navy/30 bg-white p-3">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          Lista de conferência — produtos sem regra de alíquota
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
          Os NCMs que o motor <b>não conseguiu enquadrar</b> em nenhum Anexo. Separados em dois
          casos: <b>A</b> = o capítulo tem regra, então conferir rende; <b>B</b> = o capítulo não
          tem, então conferir confirma.
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[240px]">
            <span className="text-[10px] font-bold text-slate-600">Cliente</span>
            <select
              value={pastaSel}
              onChange={(e) => setPastaSel(e.target.value)}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              <option value="">— todos os clientes —</option>
              {pastas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.cnpj ? `· ${p.cnpj}` : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={carregarItens}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Atualizar
          </button>
          <button
            type="button"
            onClick={imprimir}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir folha
          </button>
          <button
            type="button"
            onClick={baixarCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* resumo */}
      {itens.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">NCMs sem regra</p>
              <p className="text-[18px] font-bold tabular-nums text-slate-900">
                {resumo.ncmsSemRegra}
                <span className="text-[10px] font-normal text-slate-500">
                  {' '}
                  / {resumo.ncmsTotais}
                </span>
              </p>
              <p className="text-[8.5px] text-slate-500">
                {resumo.itensSemRegra} item(ns) nas notas
              </p>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Valor envolvido</p>
              <p className="text-[18px] font-bold tabular-nums text-slate-900">
                {resumo.percentualValor}%
              </p>
              <p className="text-[8.5px] text-slate-500">{brl(resumo.valorSemRegra)}</p>
            </div>
            <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-rose-800">Caso A — conferir</p>
              <p className="text-[18px] font-bold tabular-nums text-rose-900">{resumo.casoA}</p>
              <p className="text-[8.5px] text-rose-700">{brl(resumo.valorCasoA)} · rende</p>
            </div>
            <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-600">Caso B — confirmar</p>
              <p className="text-[18px] font-bold tabular-nums text-slate-700">{resumo.casoB}</p>
              <p className="text-[8.5px] text-slate-500">
                {brl(resumo.valorCasoB)} · sem benefício
              </p>
            </div>
          </div>

          {resumo.casoA > 0 && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-[10px] leading-snug text-rose-900">
              <p className="font-bold flex items-center gap-1">
                <Target className="w-3 h-3" />
                Comece por aqui: {resumo.casoA} NCM(s) com {brl(resumo.valorCasoA)} em jogo
              </p>
              <p className="mt-0.5">
                São códigos cujo <b>capítulo tem regra de alíquota</b> nos Anexos, mas o código não
                casou. Na prática quase sempre é NCM genérico (ex.: <code>21069090</code> —
                preparações alimentícias diversas) ou descrição frouxa na nota. É onde a conferência
                pode revelar benefício não reconhecido.
              </p>
            </div>
          )}
        </>
      )}

      {/* filtros */}
      {linhas.length > 0 && (
        <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="flex flex-1 min-w-[180px] items-center gap-1.5 rounded-lg border-2 border-slate-300 bg-white px-2 py-1">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="NCM, capítulo ou descrição"
                className="w-full text-[10.5px] bg-transparent focus:outline-none"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="shrink-0 cursor-pointer text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setFiltroCaso('')}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold border-2 cursor-pointer ${
                  filtroCaso === ''
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFiltroCaso('A')}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold border-2 cursor-pointer ${
                  filtroCaso === 'A'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white text-rose-800 border-rose-300'
                }`}
              >
                Caso A
              </button>
              <button
                type="button"
                onClick={() => setFiltroCaso('B')}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold border-2 cursor-pointer ${
                  filtroCaso === 'B'
                    ? 'bg-slate-600 text-white border-slate-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Caso B
              </button>
            </div>
            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={soPrioridade}
                onChange={(e) => setSoPrioridade(e.target.checked)}
                className="cursor-pointer"
              />
              só prioridade alta
            </label>
            <span className="ml-auto text-[9px] text-slate-500">
              {filtradas.length} de {linhas.length} NCM(s)
            </span>
          </div>
        </div>
      )}

      {/* lista */}
      {linhas.length === 0 && itens.length > 0 && !carregando && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-center">
          <CheckCircle2 className="mx-auto w-6 h-6 text-emerald-700" />
          <p className="mt-1 text-[11px] font-bold text-emerald-900">
            Nenhum produto sem regra de alíquota
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-800">
            Todos os {resumo.ncmsTotais} NCMs desta base foram enquadrados em algum Anexo.
          </p>
        </div>
      )}

      {itens.length === 0 && !carregando && (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-[11px] text-slate-600">
          {!token
            ? 'Informe o token do painel na aba «Importar e quebrar» para carregar a lista.'
            : 'Nenhum item encontrado para este filtro. Importe documentos ou escolha outro cliente.'}
        </p>
      )}

      {filtradas.length > 0 && (
        <div className="space-y-1.5">
          {filtradas.map((l, i) => (
            <div key={i} className={`rounded-xl border-2 ${corCaso(l.caso)} p-2.5`}>
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold ${
                    l.caso === 'A' ? 'bg-rose-700 text-white' : 'bg-slate-600 text-white'
                  }`}
                >
                  CASO {l.caso}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${
                    l.prioridade === 'alta'
                      ? 'bg-amber-500 text-white'
                      : l.prioridade === 'media'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {l.prioridade.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-900 font-mono">
                    {l.ncm || 'SEM NCM'}
                    {l.capitulo && (
                      <span className="ml-1 font-sans font-normal text-slate-500">
                        cap. {l.capitulo} — {nomeCapitulo(l.capitulo)}
                      </span>
                    )}
                  </p>
                  {l.descricoes.length > 0 && (
                    <p className="mt-0.5 text-[9.5px] leading-snug text-slate-700">
                      {l.descricoes[0].slice(0, 110)}
                      {l.descricoes.length > 1 && (
                        <span className="text-slate-400"> (+{l.descricoes.length - 1})</span>
                      )}
                    </p>
                  )}
                  <p className="mt-0.5 text-[9px] text-slate-600">
                    {l.itens} item(ns) · {brl(l.valor)}
                    {l.fornecedores.length > 0 && (
                      <span className="text-slate-400"> · {l.fornecedores[0].slice(0, 40)}</span>
                    )}
                    {l.competencias.length > 0 && (
                      <span className="text-slate-400"> · {l.competencias.join(', ')}</span>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-900">
                  {brl(l.valor)}
                </span>
              </div>
              <p className="mt-1.5 rounded bg-white/70 p-1.5 text-[9px] leading-snug text-slate-700">
                <b>O que fazer:</b> {l.acao}
              </p>
            </div>
          ))}
        </div>
      )}

      {linhas.length > 0 && (
        <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[8.5px] leading-snug text-slate-500">
          <b>O que esta lista é:</b> o retrato dos produtos que o motor não conseguiu enquadrar em
          nenhum Anexo, separados por rendimento da conferência. <b>O que ela não é:</b> afirmação
          de que o produto deveria pagar menos — isso exige ler a lei e a descrição real do produto,
          e é decisão de quem responde por ela. Fonte: Tabela Geral dos Anexos (Seção 7A), da LC
          214/2025, RIBS (Res. CGIBS 6/2026) e Decreto 12.955/2026.
        </p>
      )}
    </div>
  )
}
