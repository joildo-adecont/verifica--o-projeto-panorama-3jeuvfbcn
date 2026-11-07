import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CheckCircle2,
  FileStack,
  Info,
  Loader2,
  Package,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react'
import { CBS_POR_ANO, IBS_REF, REF_TOTAL, ibsDoAno, pct, totalDoAno } from '@/data/aliquotas'
import { classificarNCM } from '@/data/motorClassificacao'

/**
 * IMPORTADOR EM LOTES + TOTALIZADORES + ANALISADOR DO IBS
 * =======================================================
 * Pedido do CEO (03/11/2026): "Criar o importador em lotes tanto de NF de
 * entradas como de saídas, e apresentar relatório com totalizadores por período
 * e analisadores futuros do IBS em cada ano."
 *
 * ── A DIREÇÃO VEM DO CFOP, E ISSO NÃO É DETALHE ──
 * Entrada × saída não se adivinha pelo emitente. O CFOP carrega a resposta no
 * primeiro dígito: 1/2/3 = entrada, 5/6/7 = saída. O sistema LÊ o que o
 * contribuinte declarou — não decide por conta própria.
 *
 * ── POR QUE SEPARAR ENTRADA E SAÍDA É O QUE DÁ SENTIDO AO RELATÓRIO ──
 * Na reforma, entrada gera CRÉDITO e saída gera DÉBITO. Somar os dois lados dá
 * um número grande e vazio. O que se apura é a DIFERENÇA.
 *
 * ── AS ALÍQUOTAS DO ANALISADOR VÊM DE `aliquotas.ts` ──
 * Fonte única do sistema. O backend devolve o valor real e a média mensal; a
 * série de transição é aplicada aqui, importada de um só lugar. Se a alíquota
 * mudar amanhã, corrige-se em um arquivo e o analisador acompanha — não existe
 * uma segunda verdade escondida neste componente.
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

interface Mes {
  competencia: string
  documentos: number
  entrada: number
  saida: number
  sem_direcao: number
  n_entrada: number
  n_saida: number
  n_sem_direcao: number
  resultado: number
}

/** Os anos da transição: 2026 é teste, 2033 é o regime pleno. */
const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]

export function ParametrizadorLote() {
  const [token, setToken] = useState('')
  const [aba, setAba] = useState<'lote' | 'totalizadores' | 'ibs'>('lote')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  // lote
  const LIMITE_ARQUIVOS_LOTE = 1000
  const [arquivos, setArquivos] = useState<{ nome: string; xml: string }[]>([])
  const [avisoLimite, setAvisoLimite] = useState<string | null>(null)
  const [resultadoLote, setResultadoLote] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // totalizadores
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [tot, setTot] = useState<any>(null)

  // IBS
  const [ibs, setIbs] = useState<any>(null)
  /* Itens de todos os documentos do período — a base do cálculo efetivo por NCM. */
  const [itensTodos, setItensTodos] = useState<any[]>([])
  /* PASTAS (Fase 6): a importação em lote pode ir direto para a pasta do
     cliente. A trava de CNPJ é do backend — aqui só escolhemos o destino. */
  const [pastas, setPastas] = useState<any[]>([])
  const [pastaAlvo, setPastaAlvo] = useState('')

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const chamar = useCallback(
    async (rota: string, corpo?: any) => {
      const r = await fetch(`${BACKEND}/backend/v1/${rota}`, {
        method: corpo ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
        body: corpo ? JSON.stringify(corpo) : undefined,
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      return j
    },
    [token],
  )

  const carregarTotalizadores = useCallback(async () => {
    if (!token) return
    try {
      const qs = new URLSearchParams()
      if (de) qs.set('de', de)
      if (ate) qs.set('ate', ate)
      const j = await chamar(`param-totalizadores?${qs.toString()}`)
      setTot(j)
    } catch (e: any) {
      setErro(e.message)
    }
  }, [token, de, ate, chamar])

  const carregarIbs = useCallback(async () => {
    if (!token) return
    try {
      const qs = new URLSearchParams()
      if (de) qs.set('de', de)
      if (ate) qs.set('ate', ate)
      const j = await chamar(`param-analise-ibs?${qs.toString()}`)
      setIbs(j)
      try {
        const ji = await chamar(`param-itens-todos?${qs.toString()}`)
        setItensTodos(ji.itens || [])
      } catch {
        setItensTodos([])
      }
    } catch (e: any) {
      setErro(e.message)
    }
  }, [token, de, ate, chamar])

  useEffect(() => {
    if (token) {
      carregarTotalizadores()
      carregarIbs()
      chamar('param-pastas')
        .then((j) => setPastas(j.pastas || []))
        .catch(() => setPastas([]))
    }
  }, [token])

  /** Lê vários arquivos de uma vez no navegador. */
  const escolherArquivos = (lista: FileList | null) => {
    if (!lista || !lista.length) return
    setAvisoLimite(null)

    // Filtra apenas arquivos XML
    const xmlFiles: File[] = []
    for (let i = 0; i < lista.length; i++) {
      const f = lista[i]
      if (f.name.toLowerCase().endsWith('.xml')) {
        xmlFiles.push(f)
      }
    }

    if (xmlFiles.length === 0) return

    let arquivosParaLer = xmlFiles
    if (xmlFiles.length > LIMITE_ARQUIVOS_LOTE) {
      arquivosParaLer = xmlFiles.slice(0, LIMITE_ARQUIVOS_LOTE)
      const excedente = xmlFiles.length - LIMITE_ARQUIVOS_LOTE
      setAvisoLimite(
        `Limite de 1.000 arquivos por lote excedido. Foram carregados os primeiros 1.000 arquivos; ${excedente} arquivo(s) foram ignorados. Divida o período em lotes menores se necessário.`,
      )
    }

    const arr: { nome: string; xml: string }[] = []
    let lidos = 0
    const total = arquivosParaLer.length
    for (let i = 0; i < total; i++) {
      const f = arquivosParaLer[i]
      const leitor = new FileReader()
      leitor.onload = () => {
        arr.push({ nome: f.name, xml: String(leitor.result || '') })
        lidos++
        if (lidos === total) {
          // ordena por nome para o resultado sair previsível
          arr.sort((a, b) => a.nome.localeCompare(b.nome))
          setArquivos(arr)
          setResultadoLote(null)
        }
      }
      leitor.onerror = () => {
        lidos++
        if (lidos === total) {
          arr.sort((a, b) => a.nome.localeCompare(b.nome))
          setArquivos(arr)
        }
      }
      leitor.readAsText(f)
    }
  }

  const importarLote = async () => {
    if (!token) {
      setErro('Informe o token do painel.')
      return
    }
    if (!arquivos.length) {
      setErro('Escolha ao menos um arquivo XML.')
      return
    }
    setOcupado(true)
    setErro(null)
    try {
      const j = await chamar('param-importar-lote', { arquivos, pasta: pastaAlvo })
      setResultadoLote(j)
      setArquivos([])
      if (inputRef.current) inputRef.current.value = ''
      carregarTotalizadores()
      carregarIbs()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  /**
   * PROJEÇÃO DO IBS POR ANO.
   *
   * Base: a média mensal REAL do período importado, anualizada. Aplico a
   * alíquota de cada ano sobre a saída (débito) e sobre a entrada (crédito), e
   * o que interessa é o SALDO.
   *
   * O que este número NÃO é: apuração. Ele ignora o tratamento por NCM
   * (alíquota zero, redução de 60%, imposto seletivo), porque o valor importado
   * ainda não traz cClassTrib na maioria dos documentos. É dimensionamento —
   * "quanto pesa o IBS neste volume" — e o rodapé diz isso com todas as letras.
   */
  /**
   * PROJEÇÃO POR ALÍQUOTA EFETIVA, ITEM A ITEM.
   *
   * ── O QUE MUDOU (03/11/2026, a pedido do CEO) ──
   * Antes: valor × alíquota cheia do ano. Todo produto pagava 100% da
   * referência. Isso superestima quem tem redução (extrato de tomate paga 40%)
   * e subestima quem tem Imposto Seletivo (cerveja paga IBS/CBS cheio MAIS IS).
   *
   * Agora: cada item é classificado pelo seu NCM no motor, e o fator da lei é
   * aplicado ao valor daquele item. O resultado é a alíquota efetiva real da
   * carteira, não a nominal.
   *
   * ── A PARTE HONESTA ──
   * Item sem regra de alíquota recebe fator 1 (tributação integral) — presunção
   * legal correta, mas NÃO é "calculado". A tela mostra o percentual da base
   * que foi efetivamente classificado e o valor que ficou na presunção. Sem
   * isso, um número bonito esconderia que quase nada foi classificado.
   */
  const projecao = useMemo(() => {
    if (!ibs?.base) return { anos: [], cobertura: null }
    const saidaAnual = Number(ibs.base.anual_saida) || 0
    const entradaAnual = Number(ibs.base.anual_entrada) || 0
    if (saidaAnual <= 0 && entradaAnual <= 0) return { anos: [], cobertura: null }

    /* Base efetiva: soma de valor × fator, por direção. */
    let baseSaidaEfetiva = 0
    let baseEntradaEfetiva = 0
    let valorSaidaTotal = 0
    let valorEntradaTotal = 0
    let itensClassificados = 0
    let itensTotal = 0
    let valorClassificado = 0
    let valorComIS = 0
    let itensComIS = 0

    for (const it of itensTodos) {
      const cls = classificarNCM(it.ncm)
      const v = Number(it.valor) || 0
      const dir = it.direcao
      itensTotal++
      if (cls.encontrado) {
        itensClassificados++
        valorClassificado += v
      }
      if (cls.seletivos.length > 0) {
        itensComIS++
        valorComIS += v
      }
      /* O fator do eixo ALÍQUOTA é o que muda a conta. Regime não entra. */
      const vEfetivo = v * cls.fator
      if (dir === 'entrada') {
        baseEntradaEfetiva += vEfetivo
        valorEntradaTotal += v
      } else if (dir === 'saida') {
        baseSaidaEfetiva += vEfetivo
        valorSaidaTotal += v
      }
    }

    /* Anualiza pela razão entre o anual projetado e o total do período — o
       mesmo multiplicador para base e valor, para a proporção não distorcer. */
    const fatorAnualSaida = valorSaidaTotal > 0 ? saidaAnual / valorSaidaTotal : 0
    const fatorAnualEntrada = valorEntradaTotal > 0 ? entradaAnual / valorEntradaTotal : 0

    const anualSaidaEfetiva = baseSaidaEfetiva * fatorAnualSaida
    const anualEntradaEfetiva = baseEntradaEfetiva * fatorAnualEntrada

    const cobertura = {
      itens_total: itensTotal,
      itens_classificados: itensClassificados,
      percentual_itens:
        itensTotal > 0 ? Math.round((itensClassificados / itensTotal) * 1000) / 10 : 0,
      valor_total: Math.round((valorSaidaTotal + valorEntradaTotal) * 100) / 100,
      valor_classificado: Math.round(valorClassificado * 100) / 100,
      percentual_valor:
        valorSaidaTotal + valorEntradaTotal > 0
          ? Math.round((valorClassificado / (valorSaidaTotal + valorEntradaTotal)) * 1000) / 10
          : 0,
      itens_com_is: itensComIS,
      valor_com_is: Math.round(valorComIS * 100) / 100,
      /* Quanto a alíquota efetiva representa da plena — a "economia" (ou o
         acréscimo) que o tratamento por NCM provoca na carteira. */
      reducao_efetiva_pct:
        saidaAnual > 0 ? Math.round((1 - anualSaidaEfetiva / saidaAnual) * 1000) / 10 : 0,
    }

    const anos = ANOS.map((ano) => {
      const total = totalDoAno(ano)
      const cbs = CBS_POR_ANO[ano] ?? 0
      const ibsAno = ibsDoAno(ano)
      /* Sobre a base JÁ reduzida pelo tratamento de cada NCM. */
      const debito = (anualSaidaEfetiva * total) / 100
      const credito = (anualEntradaEfetiva * total) / 100
      const debitoPleno = (saidaAnual * total) / 100
      return {
        ano,
        cbs,
        ibs: ibsAno,
        total,
        debito,
        credito,
        saldo: debito - credito,
        debitoPleno,
        economia: debitoPleno - debito,
        fase:
          ano <= 2026
            ? 'teste'
            : ano <= 2028
              ? 'CBS plena · IBS em teste'
              : ano === 2033
                ? 'regime pleno'
                : 'transição do IBS',
      }
    })

    return { anos, cobertura }
  }, [ibs, itensTodos])

  const maxProj = useMemo(
    () =>
      Math.max(1, ...projecao.anos.map((p: any) => Math.max(p.debito, p.credito, p.debitoPleno))),
    [projecao],
  )

  const hm = tot?.meses ?? []
  const maxMes = useMemo(
    () => Math.max(1, ...hm.map((m: Mes) => Math.max(m.entrada, m.saida))),
    [hm],
  )

  return (
    <div className="space-y-3">
      {!token && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10.5px] text-amber-900">
          Informe o token do painel na aba <b>Importar e quebrar</b> — o lote usa a mesma
          credencial.
        </p>
      )}
      {erro && (
        <p className="flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[10.5px] text-rose-900">
          <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
          {erro}
        </p>
      )}

      {/* abas */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'lote' as const, nome: 'Importar em lote', Icon: FileStack },
          { id: 'totalizadores' as const, nome: 'Totalizadores por período', Icon: BarChart3 },
          { id: 'ibs' as const, nome: 'Analisador do IBS por ano', Icon: Package },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setAba(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold border-2 transition-colors cursor-pointer ${
              aba === t.id
                ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <t.Icon className="w-3.5 h-3.5" />
            {t.nome}
          </button>
        ))}
      </div>

      {/* ══════════ 1. LOTE ══════════ */}
      {aba === 'lote' && (
        <>
          <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
            <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
              <FileStack className="w-3.5 h-3.5" />
              Importar vários XMLs de uma vez
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
              Aceita NF de <b>entrada</b> e de <b>saída</b> na mesma leva. A direção de cada
              documento vem do <b>CFOP</b> declarado nele (1/2/3 = entrada, 5/6/7 = saída) — o
              sistema lê o que o documento diz, não adivinha. Reimportar o mesmo arquivo{' '}
              <b>não duplica</b>: é reconhecido pela chave de acesso.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Escolher XMLs (vários)
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".xml,text/xml,application/xml"
                  className="hidden"
                  onChange={(e) => escolherArquivos(e.target.files)}
                />
              </label>
              <button
                type="button"
                onClick={importarLote}
                disabled={ocupado || !arquivos.length}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-navy hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                {ocupado ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                )}
                Processar lote
              </button>
              {arquivos.length > 0 && (
                <span className="text-[10.5px] font-bold text-slate-700">
                  {arquivos.length} arquivo(s) na fila
                  {arquivos.length >= LIMITE_ARQUIVOS_LOTE && (
                    <span className="ml-1 text-[9.5px] text-amber-800">
                      (limite de 1.000 atingido)
                    </span>
                  )}
                </span>
              )}
            </div>

            {avisoLimite && (
              <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10.5px] text-amber-900">
                <Info className="mt-0.5 w-3.5 h-3.5 shrink-0 text-amber-700" />
                {avisoLimite}
              </p>
            )}

            <label className="mt-2 block max-w-[420px]">
              <span className="text-[10px] font-bold text-slate-600">
                Pasta do cliente (opcional)
                <span className="ml-1 font-normal text-slate-500">
                  — documento de outro CNPJ não entra nela
                </span>
              </span>
              <select
                value={pastaAlvo}
                onChange={(e) => setPastaAlvo(e.target.value)}
                className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
              >
                <option value="">— sem pasta —</option>
                {pastas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                    {p.cnpj ? ` (${p.cnpj})` : ''}
                  </option>
                ))}
              </select>
              {pastaAlvo && (
                <span className="mt-0.5 block text-[9px] text-amber-800">
                  A pasta tem CNPJ: notas de outro cliente entram <b>sem pasta</b> e o resultado
                  abaixo diz o motivo. Nenhuma nota é descartada.
                </span>
              )}
            </label>
          </div>

          {resultadoLote && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { r: 'Entraram', v: resultadoLote.entraram, cor: 'text-emerald-700' },
                  { r: 'Repetidos', v: resultadoLote.repetidos, cor: 'text-slate-600' },
                  {
                    r: 'Inválidos',
                    v: resultadoLote.invalidos,
                    cor: resultadoLote.invalidos > 0 ? 'text-rose-700' : 'text-slate-400',
                  },
                  { r: 'Arquivos', v: resultadoLote.total_arquivos, cor: 'text-slate-900' },
                ].map((k) => (
                  <div key={k.r} className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      {k.r}
                    </p>
                    <p className={`text-[19px] font-bold tabular-nums leading-tight ${k.cor}`}>
                      {k.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50 flex items-center gap-1.5">
                  <FileStack className="w-3.5 h-3.5" />
                  Lote {resultadoLote.lote} · entrada {brl(resultadoLote.valor_entrada)} · saída{' '}
                  {brl(resultadoLote.valor_saida)}
                </p>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                  {(resultadoLote.resultados ?? []).map((r: any, i: number) => (
                    <div key={i} className="px-3 py-1.5 flex items-start gap-2">
                      {r.status === 'importado' ? (
                        <CheckCircle2 className="mt-0.5 w-3.5 h-3.5 shrink-0 text-emerald-700" />
                      ) : r.status === 'repetido' ? (
                        <Info className="mt-0.5 w-3.5 h-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0 text-rose-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold text-slate-900 truncate">{r.nome}</p>
                        <p className="text-[9.5px] text-slate-600">
                          {r.status === 'importado' && (
                            <>
                              <span
                                className={`mr-1 rounded px-1 text-[8.5px] font-bold ${
                                  r.direcao === 'entrada'
                                    ? 'bg-blue-100 text-blue-800'
                                    : r.direcao === 'saida'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {r.direcao || 'sem direção'}
                              </span>
                              {r.itens} item(ns) · CFOP {r.cfop_predominante || '—'} ·{' '}
                              {brl(r.valor)}
                              {r.conflito > 0 && (
                                <span className="ml-1 text-amber-800 font-bold">
                                  · {r.conflito} item(ns) de direção oposta
                                </span>
                              )}
                              {r.pasta && (
                                <span className="ml-1 rounded bg-violet-100 px-1 text-[8.5px] font-bold text-violet-800">
                                  {r.pasta}
                                </span>
                              )}
                              {r.motivo_sem_pasta && (
                                <span className="ml-1 block text-[8.5px] text-amber-800">
                                  {r.motivo_sem_pasta}
                                </span>
                              )}
                            </>
                          )}
                          {r.status !== 'importado' && (r.motivo || r.status)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════ 2. TOTALIZADORES ══════════ */}
      {aba === 'totalizadores' && (
        <>
          <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
            <div className="flex flex-wrap items-end gap-2">
              <label>
                <span className="text-[10px] font-bold text-slate-600">De (AAAA-MM)</span>
                <input
                  value={de}
                  onChange={(e) => setDe(e.target.value)}
                  placeholder="2026-01"
                  className="mt-0.5 block w-[120px] rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
                />
              </label>
              <label>
                <span className="text-[10px] font-bold text-slate-600">Até (AAAA-MM)</span>
                <input
                  value={ate}
                  onChange={(e) => setAte(e.target.value)}
                  placeholder="2026-12"
                  className="mt-0.5 block w-[120px] rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  carregarTotalizadores()
                  carregarIbs()
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Aplicar
              </button>
            </div>
          </div>

          {tot && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    r: 'Entradas',
                    v: brl(tot.totais?.entrada),
                    cor: 'text-blue-800',
                    I: ArrowDownToLine,
                  },
                  {
                    r: 'Saídas',
                    v: brl(tot.totais?.saida),
                    cor: 'text-emerald-800',
                    I: ArrowUpFromLine,
                  },
                  {
                    r: 'Resultado',
                    v: brl(tot.totais?.resultado),
                    cor: 'text-slate-900',
                    I: BarChart3,
                  },
                  {
                    r: 'Sem direção',
                    v: brl(tot.totais?.sem_direcao),
                    cor: (tot.totais?.sem_direcao ?? 0) > 0 ? 'text-amber-700' : 'text-slate-400',
                    I: AlertTriangle,
                  },
                ].map((k) => (
                  <div key={k.r} className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1">
                      <k.I className="w-3 h-3" />
                      {k.r}
                    </p>
                    <p className={`text-[15px] font-bold tabular-nums leading-tight ${k.cor}`}>
                      {k.v}
                    </p>
                  </div>
                ))}
              </div>

              {hm.length === 0 ? (
                <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
                  Nenhum documento com data de emissão no período. Importe um lote para começar.
                </p>
              ) : (
                <>
                  {/* gráfico de barras por mês */}
                  <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                    <p className="text-[11px] font-bold text-slate-900 mb-2">
                      Entradas e saídas por competência
                    </p>
                    <div className="space-y-2">
                      {hm.map((m: Mes) => (
                        <div key={m.competencia}>
                          <div className="flex items-center justify-between text-[9.5px] text-slate-600">
                            <span className="font-bold text-slate-800">{m.competencia}</span>
                            <span>
                              {m.documentos} doc · resultado {brlCurto(m.resultado)}
                            </span>
                          </div>
                          <div className="mt-0.5 space-y-[2px]">
                            <div className="flex items-center gap-1">
                              <span className="w-[26px] text-[8.5px] text-blue-700 font-bold">
                                E
                              </span>
                              <div className="flex-1 h-[9px] bg-slate-100 rounded-sm overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{ width: `${(m.entrada / maxMes) * 100}%` }}
                                />
                              </div>
                              <span className="w-[74px] text-right text-[8.5px] tabular-nums text-slate-600">
                                {brlCurto(m.entrada)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-[26px] text-[8.5px] text-emerald-700 font-bold">
                                S
                              </span>
                              <div className="flex-1 h-[9px] bg-slate-100 rounded-sm overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600"
                                  style={{ width: `${(m.saida / maxMes) * 100}%` }}
                                />
                              </div>
                              <span className="w-[74px] text-right text-[8.5px] tabular-nums text-slate-600">
                                {brlCurto(m.saida)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-[10.5px] min-w-[720px]">
                      <thead>
                        <tr className="bg-panorama-navy text-white">
                          <th className="text-left px-2 py-1.5 font-bold">Competência</th>
                          <th className="text-right px-2 py-1.5 font-bold">Docs</th>
                          <th className="text-right px-2 py-1.5 font-bold">Entradas</th>
                          <th className="text-right px-2 py-1.5 font-bold">Saídas</th>
                          <th className="text-right px-2 py-1.5 font-bold">Resultado</th>
                          <th className="text-right px-2 py-1.5 font-bold">Sem direção</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hm.map((m: Mes, i: number) => (
                          <tr key={m.competencia} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="px-2 py-1.5 border-b border-slate-100 font-bold text-slate-900">
                              {m.competencia}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-600">
                              {m.documentos}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-blue-800">
                              {brl(m.entrada)}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-emerald-800">
                              {brl(m.saida)}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold">
                              {brl(m.resultado)}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-400">
                              {m.sem_direcao > 0 ? brl(m.sem_direcao) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold">
                          <td className="px-2 py-1.5 text-slate-900">Total</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {tot.totais?.n_entrada +
                              tot.totais?.n_saida +
                              tot.totais?.n_sem_direcao}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-blue-900">
                            {brl(tot.totais?.entrada)}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-emerald-900">
                            {brl(tot.totais?.saida)}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {brl(tot.totais?.resultado)}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">
                            {tot.totais?.sem_direcao > 0 ? brl(tot.totais?.sem_direcao) : '—'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {tot.totais?.documentos_com_conflito > 0 && (
                    <p className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] text-amber-900">
                      <b>{tot.totais.documentos_com_conflito} documento(s)</b> têm itens de direções
                      opostas. Isso é raro e quase sempre erro de digitação no CFOP — vale conferir
                      na aba de auditoria.
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════ 3. ANALISADOR DO IBS ══════════ */}
      {aba === 'ibs' && (
        <>
          {!ibs || !ibs.base || (ibs.base.anual_saida === 0 && ibs.base.anual_entrada === 0) ? (
            <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
              Importe documentos para projetar o IBS. O analisador usa a média mensal real do
              período importado — não uma premissa genérica.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { r: 'Meses no período', v: ibs.periodo?.meses ?? 0, cor: 'text-slate-900' },
                  {
                    r: 'Base anual saídas',
                    v: brlCurto(ibs.base?.anual_saida),
                    cor: 'text-emerald-800',
                  },
                  {
                    r: 'Base anual entradas',
                    v: brlCurto(ibs.base?.anual_entrada),
                    cor: 'text-blue-800',
                  },
                  { r: 'Referência plena', v: pct(REF_TOTAL), cor: 'text-slate-900' },
                ].map((k) => (
                  <div key={k.r} className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      {k.r}
                    </p>
                    <p className={`text-[15px] font-bold tabular-nums leading-tight ${k.cor}`}>
                      {k.v}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── COBERTURA DA CLASSIFICAÇÃO: o número que impede o número bonito ── */}
              {projecao.cobertura && (
                <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-bold text-slate-900">
                    Quanto da base foi realmente classificado
                  </p>
                  <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">
                        Itens com regra
                      </p>
                      <p className="text-[16px] font-bold tabular-nums text-slate-900">
                        {projecao.cobertura.itens_classificados}
                        <span className="text-[10px] font-normal text-slate-500">
                          {' '}
                          / {projecao.cobertura.itens_total}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {projecao.cobertura.percentual_itens}% dos itens
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">
                        Valor classificado
                      </p>
                      <p className="text-[16px] font-bold tabular-nums text-slate-900">
                        {projecao.cobertura.percentual_valor}%
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {brlCurto(projecao.cobertura.valor_classificado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">
                        Alíquota efetiva
                      </p>
                      <p className="text-[16px] font-bold tabular-nums text-emerald-800">
                        {projecao.cobertura.reducao_efetiva_pct > 0
                          ? `−${projecao.cobertura.reducao_efetiva_pct}%`
                          : '0%'}
                      </p>
                      <p className="text-[9px] text-slate-500">sobre a plena</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-500">
                        Com Imposto Seletivo
                      </p>
                      <p className="text-[16px] font-bold tabular-nums text-amber-700">
                        {projecao.cobertura.itens_com_is}
                      </p>
                      <p className="text-[9px] text-slate-500">
                        {brlCurto(projecao.cobertura.valor_com_is)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[9px] leading-snug text-slate-500">
                    Item sem regra de alíquota recebe <b>tributação integral</b> — presunção legal
                    correta, mas <b>não é cálculo</b>. Quanto menor o percentual acima, mais o
                    número final é estimativa e menos é apuração.
                    {projecao.cobertura.itens_com_is > 0 && (
                      <span className="ml-1 font-bold text-amber-800">
                        Há {projecao.cobertura.itens_com_is} item(ns) com Imposto Seletivo: a carga
                        total é MAIOR que a projetada aqui, porque o IS incide por fora.
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* gráfico por ano */}
              <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                <p className="text-[11px] font-bold text-slate-900">
                  IBS + CBS por ano da transição
                </p>
                <p className="mt-0.5 text-[9.5px] text-slate-500 leading-snug">
                  Cada item pela alíquota que a LEI lhe dá — classificado pelo NCM, não pela
                  alíquota cheia. Barra verde = débito sobre saídas; azul = crédito sobre entradas.
                  O que se apura é a diferença.
                </p>
                <div className="mt-2 space-y-1.5">
                  {projecao.anos.map((p: any) => (
                    <div key={p.ano}>
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="font-bold text-slate-800">
                          {p.ano}
                          <span className="ml-1 font-normal text-slate-500">{p.fase}</span>
                        </span>
                        <span className="tabular-nums text-slate-600">
                          {pct(p.total)}
                          <span className="ml-1 text-slate-400">
                            (IBS {p.ibs.toFixed(2).replace('.', ',')} + CBS{' '}
                            {p.cbs.toFixed(2).replace('.', ',')})
                          </span>
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1">
                        <div className="flex-1 space-y-[2px]">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-[7px] bg-slate-100 rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-emerald-600"
                                style={{ width: `${(p.debito / maxProj) * 100}%` }}
                              />
                            </div>
                            <span className="w-[70px] text-right text-[8px] tabular-nums text-emerald-800">
                              {brlCurto(p.debito)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 h-[7px] bg-slate-100 rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${(p.credito / maxProj) * 100}%` }}
                              />
                            </div>
                            <span className="w-[70px] text-right text-[8px] tabular-nums text-blue-800">
                              {brlCurto(p.credito)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`w-[78px] text-right text-[9px] font-bold tabular-nums ${
                            p.saldo >= 0 ? 'text-slate-900' : 'text-blue-800'
                          }`}
                        >
                          {p.saldo >= 0 ? '+' : ''}
                          {brlCurto(p.saldo)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* tabela detalhada */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-[10.5px] min-w-[680px]">
                  <thead>
                    <tr className="bg-panorama-navy text-white">
                      <th className="text-left px-2 py-1.5 font-bold">Ano</th>
                      <th className="text-right px-2 py-1.5 font-bold">IBS</th>
                      <th className="text-right px-2 py-1.5 font-bold">CBS</th>
                      <th className="text-right px-2 py-1.5 font-bold">Total</th>
                      <th className="text-right px-2 py-1.5 font-bold">Débito (saídas)</th>
                      <th className="text-right px-2 py-1.5 font-bold">Crédito (entradas)</th>
                      <th className="text-right px-2 py-1.5 font-bold">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projecao.anos.map((p: any, i: number) => (
                      <tr
                        key={p.ano}
                        className={
                          p.ano === 2033
                            ? 'bg-panorama-gold/10 font-bold'
                            : i % 2
                              ? 'bg-slate-50'
                              : 'bg-white'
                        }
                      >
                        <td className="px-2 py-1.5 border-b border-slate-100">
                          <span className="font-bold text-slate-900">{p.ano}</span>
                          <span className="ml-1 text-[8.5px] text-slate-500">{p.fase}</span>
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                          {p.ibs.toFixed(2).replace('.', ',')}%
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                          {p.cbs.toFixed(2).replace('.', ',')}%
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold">
                          {pct(p.total)}
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-emerald-800">
                          {brl(p.debito)}
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-blue-800">
                          {brl(p.credito)}
                        </td>
                        <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold">
                          {brl(p.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[9.5px] leading-snug text-amber-900">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  O que este número é — e o que ele não é
                </p>
                <p className="mt-0.5">
                  Cada item é classificado pelo seu <b>NCM</b> e paga a alíquota que a lei lhe dá:
                  alíquota zero, redução de 60% ou 30%, ou a cheia. As alíquotas de cada ano vêm de{' '}
                  <code className="rounded bg-amber-100 px-0.5">aliquotas.ts</code> (fonte única do
                  sistema). <b>Ainda não é apuração completa</b>: o motor cobre as 112 regras de
                  alíquota dos Anexos, e item cujo NCM não tem regra fica na tributação integral — o
                  quadro de cobertura acima mostra exatamente quanto. E onde incide{' '}
                  <b>Imposto Seletivo</b>, a carga real é maior que a projetada, porque o IS incide
                  por fora do IBS/CBS.
                </p>
              </div>

              {ibs.top_ncm?.length > 0 && (
                <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                  <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50">
                    Onde o valor se concentra (por NCM)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] min-w-[520px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="text-left px-2 py-1 font-bold">NCM</th>
                          <th className="text-right px-2 py-1 font-bold">Entradas</th>
                          <th className="text-right px-2 py-1 font-bold">Saídas</th>
                          <th className="text-right px-2 py-1 font-bold">Itens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ibs.top_ncm.map((r: any, i: number) => (
                          <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="px-2 py-1 border-b border-slate-100 font-mono text-[9.5px]">
                              {r.ncm}
                            </td>
                            <td className="px-2 py-1 border-b border-slate-100 text-right tabular-nums text-blue-800">
                              {r.entrada > 0 ? brl(r.entrada) : '—'}
                            </td>
                            <td className="px-2 py-1 border-b border-slate-100 text-right tabular-nums text-emerald-800">
                              {r.saida > 0 ? brl(r.saida) : '—'}
                            </td>
                            <td className="px-2 py-1 border-b border-slate-100 text-right tabular-nums text-slate-500">
                              {r.itens}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
