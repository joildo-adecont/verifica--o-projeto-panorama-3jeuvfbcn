import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Info,
  Layers,
  Loader2,
  Minus,
  Package,
  Printer,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react'
import {
  analisarProduto,
  agruparPorTratamento,
  agruparPorNCM,
  consolidar,
  recomendar,
  simularPorAno,
  RESSALVA_COMPARACAO,
} from '@/data/analisadorTributario'
import { ICMS_POR_UF, UFS_DIVERGENTES } from '@/data/aliquotasAtuais'
import { IBS_REF, REF_TOTAL, pct } from '@/data/aliquotas'
import { estatisticasTabela } from '@/data/motorClassificacao'

/**
 * ANALISADOR TRIBUTÁRIO — comparação fina entre a tributação de HOJE e a da REFORMA
 * =================================================================================
 * Pedido do CEO (04/11/2026): "análises finas com relação à tributação atual e a
 * da reforma, com comparativos das duas, indicando por produto, grupo, ramo e
 * atividades relacionadas ao cliente o melhor caminho e/ou a melhor tributação,
 * realizando também simulações futuras", com busca avançada nativa e "sempre
 * utilizando agentes especialistas de cada quebra dos XMLs".
 *
 * ── OS ESPECIALISTAS QUE ALIMENTAM ESTA TELA ──
 * Cada bloco da página é servido por um especialista, e a tela diz qual:
 *
 *   ESPECIALISTA DE PRODUTO   → classifica o NCM e compara item a item
 *   ESPECIALISTA DE GRUPO     → agrega por tratamento, ponderando por valor
 *   ESPECIALISTA DE RAMO      → cruza os NCMs com a atividade do cliente
 *   ESPECIALISTA DE TRANSIÇÃO → projeta cada ano de 2026 a 2033
 *   ESPECIALISTA DE CAMINHO   → consolida e aponta onde agir primeiro
 *
 * Nenhum deles "interpreta" texto: todos partem do NCM, do CFOP e do valor que
 * estão no XML, e aplicam a regra da lei. O que muda entre eles é o recorte.
 *
 * ── O QUE A TELA NÃO PROMETE ──
 * Não promete economia. Mostra a conta e a margem de erro. Um número de
 * "economia de R$ X" sem a ressalva de que a carga de hoje é modal — e não a
 * efetiva de cada produto — seria a mentira mais fácil de contar aqui.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number | null | undefined) =>
  v === null || v === undefined || !isFinite(Number(v))
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const num = (v: number) => v.toFixed(2).replace('.', ',')

/** Os ramos de atividade — usados para o especialista de ramo. */
const RAMOS = [
  {
    id: 'comercio',
    nome: 'Comércio',
    ncmHint: [
      '01',
      '02',
      '03',
      '04',
      '07',
      '08',
      '09',
      '10',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '30',
      '39',
      '84',
      '85',
    ],
  },
  {
    id: 'industria',
    nome: 'Indústria',
    ncmHint: ['25', '26', '27', '28', '29', '32', '38', '39', '72', '73', '76', '84', '85'],
  },
  { id: 'servicos', nome: 'Serviços', ncmHint: ['99'] },
  {
    id: 'agro',
    nome: 'Agronegócio',
    ncmHint: ['01', '02', '03', '04', '07', '08', '10', '12', '23', '31', '38'],
  },
  {
    id: 'alimentacao',
    nome: 'Alimentação',
    ncmHint: [
      '01',
      '02',
      '03',
      '04',
      '07',
      '08',
      '09',
      '10',
      '11',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
    ],
  },
  { id: 'saude', nome: 'Saúde', ncmHint: ['30', '38', '90', '94'] },
  { id: 'construcao', nome: 'Construção', ncmHint: ['25', '68', '69', '70', '73', '76'] },
  { id: 'tecnologia', nome: 'Tecnologia', ncmHint: ['84', '85', '99'] },
]

/** Identifica o ramo provável pelos dois primeiros dígitos dos NCMs. */
function ramoProvavel(ncms: string[]): { id: string; nome: string; aderencia: number }[] {
  const contagem: Record<string, number> = {}
  for (const n of ncms) {
    const cap = String(n || '')
      .replace(/\D/g, '')
      .slice(0, 2)
    if (!cap) continue
    for (const r of RAMOS) {
      if (r.ncmHint.indexOf(cap) >= 0) contagem[r.id] = (contagem[r.id] || 0) + 1
    }
  }
  const total = ncms.filter((n) => String(n || '').replace(/\D/g, '').length >= 2).length
  return RAMOS.map((r) => ({
    id: r.id,
    nome: r.nome,
    aderencia: total > 0 ? Math.round(((contagem[r.id] || 0) / total) * 100) : 0,
  }))
    .filter((r) => r.aderencia > 0)
    .sort((a, b) => b.aderencia - a.aderencia)
}

interface Pasta {
  id: string
  nome: string
  cnpj: string
  uf?: string
}

export function ParametrizadorAnalisador() {
  const [token, setToken] = useState('')
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [pastaSel, setPastaSel] = useState('')
  const [uf, setUf] = useState('RS')
  const [itens, setItens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  /* busca avançada nativa */
  const [busca, setBusca] = useState('')
  const [filtroTratamento, setFiltroTratamento] = useState('')
  const [filtroTendencia, setFiltroTendencia] = useState('')
  const [ordem, setOrdem] = useState<'valor' | 'variacao' | 'ncm'>('valor')

  const [ufSugerida, setUfSugerida] = useState('')
  const [resumoCliente, setResumoCliente] = useState<any>(null)

  const [aberto, setAberto] = useState<Record<string, boolean>>({
    produto: true,
    grupo: true,
    ramo: false,
    transicao: true,
    caminho: true,
  })

  const stats = useMemo(() => estatisticasTabela(), [])

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const chamar = useCallback(
    async (rota: string) => {
      const r = await fetch(`${BACKEND}/backend/v1/${rota}`, {
        headers: { 'X-Painel-Token': token },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      return j
    },
    [token],
  )

  /** Carrega clientes e, quando há um escolhido, os itens dele. */
  const carregar = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const j = await chamar('param-pastas-arvore')
      const lista: Pasta[] = (j.arvore || []).map((n: any) => ({
        id: n.base.id,
        nome: n.base.nome,
        cnpj: n.base.cnpj,
        uf: '',
      }))
      setPastas(lista)
      if (!pastaSel && lista.length) setPastaSel(lista[0].id)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, chamar, pastaSel])

  useEffect(() => {
    if (token) carregar()
  }, [token])

  /**
   * OS ITENS DO CLIENTE ESCOLHIDO — a base de todo o analisador.
   *
   * ── O DEFEITO QUE ISSO CORRIGE ──
   * A primeira versão pedia `/param-itens-todos` (que devolve os itens de TODOS
   * os clientes) e tentava filtrar no navegador com um `return true` que não
   * filtrava nada. O analisador mostraria a carteira inteira do escritório como
   * se fosse a de um cliente — e um erro desses não dá mensagem: dá número
   * errado com cara de análise.
   *
   * Agora o filtro é no servidor, pelo campo `pasta` do item (que existe desde a
   * Fase 6) e, como reforço, pelo CNPJ do cliente nas partes do documento.
   */
  const carregarItens = useCallback(async () => {
    if (!token || !pastaSel) return
    setCarregando(true)
    setErro(null)
    try {
      const j = await chamar(`param-itens-cliente?pasta=${encodeURIComponent(pastaSel)}`)
      setItens(j.lista || [])
      /* A UF vem do emitente das notas — é sugestão, e a tela deixa claro que
         quem manda é o estabelecimento do cliente. Não sobrescrevo a escolha
         manual do usuário: só sugiro quando ele ainda não mexeu. */
      if (j.uf_sugerida) setUfSugerida(j.uf_sugerida)
      setResumoCliente({
        documentos: j.documentos || 0,
        itens: j.itens || 0,
        nome: j.cliente ? j.cliente.nome : '',
        filhas: j.filhas || [],
      })
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, pastaSel, chamar])

  useEffect(() => {
    if (token && pastaSel) carregarItens()
  }, [token, pastaSel])

  /* ══════ AGENTE 1: PRODUTO ══════ */
  const produtos = useMemo(() => {
    return itens
      .filter((i) => Number(i.valor) > 0)
      .map((i) =>
        analisarProduto(
          {
            ncm: i.ncm || '',
            descricao: i.descricao || '',
            valor: Number(i.valor) || 0,
            direcao: (i.direcao || '') as any,
            cfop: i.cfop,
            uf,
          },
          uf,
        ),
      )
  }, [itens, uf])

  /* ══════ AGENTE 2: GRUPO ══════ */
  const grupos = useMemo(() => agruparPorTratamento(produtos), [produtos])
  const porNCM = useMemo(() => agruparPorNCM(produtos), [produtos])

  /* ══════ AGENTE 3: RAMO ══════ */
  const ramos = useMemo(() => ramoProvavel(produtos.map((p) => p.ncm)), [produtos])

  /* ══════ AGENTE 4: TRANSIÇÃO ══════ */
  const simulacao = useMemo(() => simularPorAno(produtos, uf), [produtos, uf])

  /* ══════ AGENTE 5: CAMINHO ══════ */
  const consolidado = useMemo(() => consolidar(produtos, uf), [produtos, uf])
  const recomendacoes = useMemo(() => recomendar(produtos, consolidado), [produtos, consolidado])

  /* ══════ BUSCA AVANÇADA ══════ */
  const produtosFiltrados = useMemo(() => {
    let lista = [...produtos]
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (t) {
      /* aceita vários termos, todos precisam aparecer (E lógico) */
      const termos = t.split(/\s+/)
      lista = lista.filter((p) => {
        const alvo = `${p.ncm} ${p.descricao} ${p.tratamento} ${p.anexo}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        return termos.every((term) => alvo.indexOf(term) >= 0)
      })
    }
    if (filtroTratamento) lista = lista.filter((p) => p.tratamento === filtroTratamento)
    if (filtroTendencia === 'piora') lista = lista.filter((p) => p.variacaoPP > 0.5)
    if (filtroTendencia === 'melhora') lista = lista.filter((p) => p.variacaoPP < -0.5)
    if (filtroTendencia === 'neutro') lista = lista.filter((p) => Math.abs(p.variacaoPP) <= 0.5)
    if (filtroTendencia === 'is') lista = lista.filter((p) => p.temIS)
    if (filtroTendencia === 'conferir') lista = lista.filter((p) => p.conferir)

    if (ordem === 'valor') lista.sort((a, b) => b.valor - a.valor)
    else if (ordem === 'variacao') lista.sort((a, b) => b.variacaoPP - a.variacaoPP)
    else lista.sort((a, b) => String(a.ncm).localeCompare(String(b.ncm)))
    return lista
  }, [produtos, busca, filtroTratamento, filtroTendencia, ordem])

  const tratamentos = useMemo(
    () => Array.from(new Set(produtos.map((p) => p.tratamento))).sort(),
    [produtos],
  )

  const imprimir = () => window.print()

  const baixarCsv = () => {
    const linhas = [
      [
        'NCM',
        'Descrição',
        'Tratamento',
        'Anexo',
        'Valor',
        'Carga hoje %',
        'Carga reforma %',
        'Variação pp',
        'Variação R$',
        'IS',
        'Conferir',
      ],
      ...produtosFiltrados.map((p) => [
        p.ncm,
        `"${p.descricao.replace(/"/g, '')}"`,
        p.tratamento,
        p.anexo,
        p.valor.toFixed(2),
        p.cargaHoje.toFixed(2),
        p.cargaReforma.toFixed(2),
        p.variacaoPP.toFixed(2),
        p.variacaoReais.toFixed(2),
        p.temIS ? 'sim' : 'nao',
        p.conferir ? 'sim' : 'nao',
      ]),
    ]
    const csv = linhas.map((l) => l.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'analise-tributaria.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const Bloco = ({
    id,
    titulo,
    sub,
    agente,
    Icon,
    children,
  }: {
    id: string
    titulo: string
    sub: string
    agente: string
    Icon: any
    children: React.ReactNode
  }) => (
    <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto((a) => ({ ...a, [id]: !a[id] }))}
        className="w-full flex items-start gap-2 px-3 py-2 border-b-2 border-panorama-gold/40 bg-slate-50 text-left cursor-pointer hover:bg-slate-100"
      >
        {aberto[id] ? (
          <ChevronDown className="mt-0.5 w-3.5 h-3.5 shrink-0 text-slate-500" />
        ) : (
          <ChevronRight className="mt-0.5 w-3.5 h-3.5 shrink-0 text-slate-500" />
        )}
        <Icon className="mt-0.5 w-3.5 h-3.5 shrink-0 text-panorama-navy" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-900 leading-tight">{titulo}</p>
          <p className="text-[9px] text-slate-500 leading-tight">{sub}</p>
        </div>
        <span className="shrink-0 rounded-full bg-panorama-navy/10 px-1.5 py-0.5 text-[8px] font-bold text-panorama-navy flex items-center gap-0.5">
          <Bot className="w-2.5 h-2.5" />
          {agente}
        </span>
      </button>
      {aberto[id] && <div className="p-3">{children}</div>}
    </div>
  )

  const Seta = ({ v }: { v: number }) =>
    Math.abs(v) < 0.5 ? (
      <Minus className="w-3 h-3 text-slate-400" />
    ) : v > 0 ? (
      <ArrowUpRight className="w-3 h-3 text-rose-600" />
    ) : (
      <ArrowDownRight className="w-3 h-3 text-emerald-600" />
    )

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

      {/* ── seleção do cliente e UF ── */}
      <div className="rounded-xl border-2 border-panorama-navy/30 bg-white p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[220px]">
            <span className="text-[10px] font-bold text-slate-600">Cliente</span>
            <select
              value={pastaSel}
              onChange={(e) => setPastaSel(e.target.value)}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              {pastas.length === 0 && <option value="">Nenhum cliente cadastrado</option>}
              {pastas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.cnpj ? `· ${p.cnpj}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[10px] font-bold text-slate-600">
              UF do estabelecimento
              <span className="ml-1 font-normal text-slate-500">— define o ICMS de hoje</span>
            </span>
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="mt-0.5 block w-[110px] rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              {ICMS_POR_UF.map((a) => (
                <option key={a.uf} value={a.uf}>
                  {a.uf} — {num(a.icms)}%
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={carregarItens}
            disabled={!pastaSel || carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Calculator className="w-3.5 h-3.5" />
            )}
            Analisar
          </button>
          <button
            type="button"
            onClick={imprimir}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
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
        {UFS_DIVERGENTES.indexOf(uf) >= 0 && (
          <p className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[9.5px] text-amber-900">
            <AlertTriangle className="mt-0.5 w-3 h-3 shrink-0" />
            As fontes públicas divergem para <b>{uf}</b>. A comparação usa a alíquota modal base —
            confira no RICMS estadual antes de levar o número ao cliente.
          </p>
        )}
      </div>

      {produtos.length === 0 && !carregando && (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-[11px] text-slate-600">
          Escolha o cliente e clique em <b>Analisar</b>. O analisador trabalha sobre os itens dos
          XMLs já importados — quanto mais notas, mais preciso o retrato.
        </p>
      )}

      {/* ══════ KPIs DO CONSOLIDADO ══════ */}
      {produtos.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Carga hoje</p>
              <p className="text-[17px] font-bold tabular-nums text-slate-900">
                {num(consolidado.cargaHojePonderada)}%
              </p>
              <p className="text-[8.5px] text-slate-500">
                ICMS {num(ICMS_POR_UF.find((x) => x.uf === uf)?.icms ?? 18)}% + PIS/COFINS 9,25%
              </p>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Carga na reforma</p>
              <p className="text-[17px] font-bold tabular-nums text-slate-900">
                {num(consolidado.cargaReformaPonderada)}%
              </p>
              <p className="text-[8.5px] text-slate-500">regime pleno (2033)</p>
            </div>
            <div
              className={`rounded-xl border-2 p-2.5 ${
                consolidado.variacaoPP > 0.5
                  ? 'border-rose-300 bg-rose-50'
                  : consolidado.variacaoPP < -0.5
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <p className="text-[9px] font-bold uppercase text-slate-500">Variação</p>
              <p
                className={`text-[17px] font-bold tabular-nums ${
                  consolidado.variacaoPP > 0.5
                    ? 'text-rose-800'
                    : consolidado.variacaoPP < -0.5
                      ? 'text-emerald-800'
                      : 'text-slate-900'
                }`}
              >
                {consolidado.variacaoPP > 0 ? '+' : ''}
                {num(consolidado.variacaoPP)} pp
              </p>
              <p className="text-[8.5px] text-slate-500">
                faixa {num(consolidado.cenarioMinPP)} a {num(consolidado.cenarioMaxPP)}
              </p>
            </div>
            <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
              <p className="text-[9px] font-bold uppercase text-slate-500">Classificados</p>
              <p className="text-[17px] font-bold tabular-nums text-slate-900">
                {consolidado.itensClassificados}
                <span className="text-[10px] font-normal text-slate-500">
                  {' '}
                  / {consolidado.itens}
                </span>
              </p>
              <p className="text-[8.5px] text-slate-500">itens com regra na lei</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-[10px] leading-snug text-slate-700">
            <p className="font-bold flex items-center gap-1 text-slate-900">
              <Scale className="w-3 h-3" />
              Leitura do consolidado
            </p>
            <p className="mt-0.5">{consolidado.leitura}</p>
            <p className="mt-1 text-[9px] text-slate-500">{RESSALVA_COMPARACAO}</p>
          </div>

          {/* ══════ AGENTE 5: MELHOR CAMINHO ══════ */}
          <Bloco
            id="caminho"
            titulo="O melhor caminho — onde agir primeiro"
            sub="prioridades ordenadas pelo que muda o resultado"
            agente="Caminho"
            Icon={Target}
          >
            <div className="space-y-1.5">
              {recomendacoes.map((r, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2 ${
                    r.prioridade === 'alta'
                      ? 'border-rose-300 bg-rose-50'
                      : r.prioridade === 'media'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <p className="flex items-start gap-1.5 text-[10.5px] font-bold text-slate-900">
                    <span
                      className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold ${
                        r.prioridade === 'alta'
                          ? 'bg-rose-700 text-white'
                          : r.prioridade === 'media'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-400 text-white'
                      }`}
                    >
                      {r.prioridade.toUpperCase()}
                    </span>
                    {r.titulo}
                  </p>
                  <p className="mt-1 text-[9.5px] leading-snug text-slate-700">
                    <b>Por quê:</b> {r.motivo}
                  </p>
                  <p className="mt-0.5 text-[9.5px] leading-snug text-slate-700">
                    <b>Ação:</b> {r.acao}
                  </p>
                  <p className="mt-0.5 text-[9px] font-bold text-slate-600">{r.impacto}</p>
                </div>
              ))}
            </div>
          </Bloco>

          {/* ══════ AGENTE 1: PRODUTO ══════ */}
          <Bloco
            id="produto"
            titulo="Análise por produto (NCM)"
            sub={`${produtosFiltrados.length} de ${produtos.length} itens · classificação e comparação item a item`}
            agente="Produto"
            Icon={Package}
          >
            {/* busca avançada nativa */}
            <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="flex flex-1 min-w-[180px] items-center gap-1.5 rounded-lg border-2 border-slate-300 bg-white px-2 py-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="NCM, descrição, tratamento ou anexo — vários termos com E"
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
                <select
                  value={filtroTratamento}
                  onChange={(e) => setFiltroTratamento(e.target.value)}
                  className="rounded-lg border-2 border-slate-300 px-1.5 py-1 text-[10px] bg-white focus:outline-none"
                >
                  <option value="">Todo tratamento</option>
                  {tratamentos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroTendencia}
                  onChange={(e) => setFiltroTendencia(e.target.value)}
                  className="rounded-lg border-2 border-slate-300 px-1.5 py-1 text-[10px] bg-white focus:outline-none"
                >
                  <option value="">Toda tendência</option>
                  <option value="piora">Piora na reforma</option>
                  <option value="melhora">Melhora na reforma</option>
                  <option value="neutro">Sem variação</option>
                  <option value="is">Com Imposto Seletivo</option>
                  <option value="conferir">Conferir (posição)</option>
                </select>
                <select
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as any)}
                  className="rounded-lg border-2 border-slate-300 px-1.5 py-1 text-[10px] bg-white focus:outline-none"
                >
                  <option value="valor">Maior valor</option>
                  <option value="variacao">Maior variação</option>
                  <option value="ncm">NCM</option>
                </select>
              </div>
              {(busca || filtroTratamento || filtroTendencia) && (
                <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-600">
                  <Info className="w-2.5 h-2.5" />
                  {produtosFiltrados.length} resultado(s)
                  <span className="ml-1 text-slate-400">
                    · {brl(produtosFiltrados.reduce((s, p) => s + p.valor, 0))} filtrados
                  </span>
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[9.5px] min-w-[900px]">
                <thead>
                  <tr className="bg-panorama-navy text-white">
                    <th className="text-left px-1.5 py-1.5 font-bold">NCM</th>
                    <th className="text-left px-1.5 py-1.5 font-bold">Descrição</th>
                    <th className="text-left px-1.5 py-1.5 font-bold">Tratamento</th>
                    <th className="text-right px-1.5 py-1.5 font-bold">Valor</th>
                    <th className="text-right px-1.5 py-1.5 font-bold">Hoje</th>
                    <th className="text-right px-1.5 py-1.5 font-bold">Reforma</th>
                    <th className="text-right px-1.5 py-1.5 font-bold">Variação</th>
                    <th className="text-right px-1.5 py-1.5 font-bold">R$</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((p, i) => (
                    <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="px-1.5 py-1 border-b border-slate-100 font-mono">
                        {p.ncm || <span className="text-rose-600 font-bold">—</span>}
                      </td>
                      <td className="px-1.5 py-1 border-b border-slate-100 max-w-[160px] truncate">
                        {p.descricao}
                      </td>
                      <td className="px-1.5 py-1 border-b border-slate-100">
                        <span className="font-bold text-slate-800">{p.tratamento}</span>
                        {p.temIS && (
                          <span className="ml-1 rounded bg-amber-500 px-1 text-[8px] font-bold text-white">
                            IS
                          </span>
                        )}
                        {p.conferir && (
                          <span className="ml-1 rounded bg-amber-200 px-1 text-[8px] font-bold text-amber-900">
                            conf
                          </span>
                        )}
                      </td>
                      <td className="px-1.5 py-1 border-b border-slate-100 text-right tabular-nums">
                        {brl(p.valor)}
                      </td>
                      <td className="px-1.5 py-1 border-b border-slate-100 text-right tabular-nums text-slate-600">
                        {num(p.cargaHoje)}%
                      </td>
                      <td className="px-1.5 py-1 border-b border-slate-100 text-right tabular-nums text-slate-600">
                        {num(p.cargaReforma)}%
                      </td>
                      <td
                        className={`px-1.5 py-1 border-b border-slate-100 text-right tabular-nums font-bold ${
                          p.variacaoPP > 0.5
                            ? 'text-rose-700'
                            : p.variacaoPP < -0.5
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                        }`}
                      >
                        {p.variacaoPP > 0 ? '+' : ''}
                        {num(p.variacaoPP)}
                      </td>
                      <td
                        className={`px-1.5 py-1 border-b border-slate-100 text-right tabular-nums ${
                          p.variacaoReais > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {brl(Math.abs(p.variacaoReais))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {produtosFiltrados.length === 0 && (
              <p className="py-3 text-center text-[10px] text-slate-500">
                Nenhum item atende a esses filtros.
              </p>
            )}
          </Bloco>

          {/* ══════ AGENTE 2: GRUPO ══════ */}
          <Bloco
            id="grupo"
            titulo="Análise por grupo de tratamento"
            sub="ponderada por valor — onde a lei ajuda e onde pesa"
            agente="Grupo"
            Icon={Layers}
          >
            <div className="space-y-1.5">
              {grupos.map((g) => (
                <div key={g.chave} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded shrink-0 ${
                        g.tendencia === 'melhora'
                          ? 'bg-emerald-100 text-emerald-700'
                          : g.tendencia === 'piora'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {g.tendencia === 'melhora' ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : g.tendencia === 'piora' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </span>
                    <p className="text-[10.5px] font-bold text-slate-900 flex-1 min-w-0 truncate">
                      {g.nome}
                    </p>
                    <span className="text-[9px] text-slate-500 shrink-0">{g.itens} item(ns)</span>
                    <span className="text-[9.5px] font-bold tabular-nums shrink-0 w-[74px] text-right">
                      {brl(g.valor)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[9px]">
                    <span className="text-slate-500 tabular-nums">
                      hoje {num(g.cargaHojePonderada)}%
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {num(g.cargaReformaPonderada)}%
                    </span>
                    <span
                      className={`ml-auto font-bold tabular-nums ${
                        g.variacaoPP > 0.5
                          ? 'text-rose-700'
                          : g.variacaoPP < -0.5
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {g.variacaoPP > 0 ? '+' : ''}
                      {num(g.variacaoPP)} pp
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[9px] leading-snug text-slate-500">
              A ponderação é por <b>valor</b>, não por quantidade de itens. Média simples faria um
              parafuso de R$ 5 pesar igual a um equipamento de R$ 500 mil.
            </p>
          </Bloco>

          {/* ══════ AGENTE 3: RAMO ══════ */}
          <Bloco
            id="ramo"
            titulo="Análise por ramo e atividade"
            sub="perfil dos NCMs do cliente cruzado com as atividades típicas"
            agente="Ramo"
            Icon={Sparkles}
          >
            {ramos.length === 0 ? (
              <p className="text-[10px] text-slate-500">Sem NCM suficiente para inferir o ramo.</p>
            ) : (
              <>
                <div className="space-y-1">
                  {ramos.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center gap-2">
                      <p className="w-[92px] shrink-0 text-[10px] font-bold text-slate-800">
                        {r.nome}
                      </p>
                      <div className="flex-1 h-[8px] rounded-sm bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-panorama-navy"
                          style={{ width: `${r.aderencia}%` }}
                        />
                      </div>
                      <span className="w-[34px] text-right text-[9px] tabular-nums text-slate-600">
                        {r.aderencia}%
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 rounded bg-slate-50 p-1.5 text-[9px] leading-snug text-slate-600">
                  Aderência calculada pelo capítulo do NCM (2 primeiros dígitos) contra os capítulos
                  típicos de cada ramo. É <b>indício de perfil</b>, não classificação da atividade —
                  quem define o ramo é o CNAE do cadastro do cliente.
                </p>
              </>
            )}
          </Bloco>

          {/* ══════ AGENTE 4: TRANSIÇÃO ══════ */}
          <Bloco
            id="transicao"
            titulo="Simulação futura — a transição ano a ano"
            sub="2026 a 2033, com o tratamento real da carteira"
            agente="Transição"
            Icon={Calculator}
          >
            <div className="space-y-1">
              {simulacao.anos.map((a) => {
                const max = Math.max(
                  ...simulacao.anos.map((x) => Math.max(x.cargaReforma, x.cargaHoje)),
                )
                return (
                  <div key={a.ano} className="flex items-center gap-2">
                    <span
                      className={`w-[34px] shrink-0 text-[9.5px] font-bold ${
                        a.pico ? 'text-panorama-gold' : 'text-slate-800'
                      }`}
                    >
                      {a.ano}
                    </span>
                    <div className="flex-1 h-[10px] rounded-sm bg-slate-100 overflow-hidden relative">
                      <div
                        className="h-full bg-slate-300"
                        style={{ width: `${(a.cargaHoje / max) * 100}%` }}
                      />
                      <div
                        className={`h-full absolute top-0 ${
                          a.variacaoPP > 0.5 ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${(a.cargaReforma / max) * 100}%`, opacity: 0.85 }}
                      />
                    </div>
                    <span className="w-[46px] text-right text-[9px] tabular-nums font-bold text-slate-800">
                      {num(a.cargaReforma)}%
                    </span>
                    <span
                      className={`w-[52px] text-right text-[8.5px] tabular-nums ${
                        a.variacaoPP > 0.5 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {a.variacaoPP > 0 ? '+' : ''}
                      {num(a.variacaoPP)}
                    </span>
                    {a.pico && (
                      <span className="shrink-0 rounded bg-panorama-gold px-1 text-[7.5px] font-bold text-panorama-navy">
                        maior dif.
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-2 rounded bg-slate-50 p-1.5 text-[9px] leading-snug text-slate-600">
              {simulacao.resumo}
            </p>
            <p className="mt-1 text-[8.5px] leading-snug text-slate-500">
              A barra cinza é a carga de hoje, constante. A colorida é a reforma: verde quando
              reduz, vermelha quando aumenta. <b>2026 é fase de teste</b> (CBS 0,9% + IBS 0,1%) e
              por isso aparece muito abaixo — não é o ano do impacto.
            </p>
          </Bloco>

          <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[8.5px] leading-snug text-slate-500">
            Alíquotas da reforma de <code>aliquotas.ts</code> (fonte única: CBS 11,3% · IBS{' '}
            {IBS_REF.toFixed(2).replace('.', ',')}% = {pct(REF_TOTAL)}). Alíquotas de hoje de{' '}
            <code>aliquotasAtuais.ts</code>. Motor de classificação com {stats.total} regras (
            {stats.aliquota} de alíquota · {stats.regime} de regime · {stats.seletivo} de IS).{' '}
            {RESSALVA_COMPARACAO}
          </p>
        </>
      )}
    </div>
  )
}
