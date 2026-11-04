import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileDown,
  GitCompareArrows,
  Info,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react'
import { classificarNCM, estatisticasTabela } from '@/data/motorClassificacao'

/**
 * PARAMETRIZADOR — FASE 3: ambiente de análise
 * =============================================
 * Pedido do CEO (03/11/2026): "ambiente de análise, comparativos e auditorias,
 * com classificação fiscal e contábil, relatórios legíveis".
 *
 * ── AS TRÊS TELAS, E A PERGUNTA QUE CADA UMA RESPONDE ──
 * 1. AUDITORIA   "o que está errado neste documento?"   → lista de achados por gravidade
 * 2. COMPARATIVO "o que mudou de um mês para o outro?"  → variação por competência
 * 3. CONCENTRAÇÃO "onde está o valor e o risco?"        → ranking por NCM
 *
 * ── A CLASSIFICAÇÃO RODA NO NAVEGADOR, E ISSO É DE PROPÓSITO ──
 * As 841 regras NCM→tratamento são uma tabela estática que já vem da Seção 7A
 * (fonte única de itens). Consultar o backend a cada item só tornaria a tela
 * lenta. O que vem do servidor é o que é grande demais para o bundle: os
 * documentos e os itens gravados.
 *
 * ── POR QUE O NÍVEL DE CASAMENTO APARECE ──
 * "Achei a regra do seu NCM exato" e "achei a regra da posição de 4 dígitos"
 * são respostas diferentes. A segunda é aproximação que o contador tem de
 * conferir. Mostrar as duas como iguais seria dar certeza onde há indício.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

interface Documento {
  id: string
  chave: string
  modelo: string
  numero: string
  emitente: string
  cnpj: string
  uf: string
  valor_total: number
  qtd_itens: number
  status: string
  divergencias: number
  importado_em: string
  nome_arquivo: string
}

interface Item {
  id: string
  numero_item: number
  descricao: string
  ncm: string
  cfop: string
  cst_icms: string
  cst_ibs_cbs: string
  cclasstrib: string
  valor_total: number
  valor_ibs: number
  valor_cbs: number
}

interface Achado {
  gravidade: 'ALTA' | 'MEDIA' | 'BAIXA' | 'INFO'
  item: number | null
  regra: string
  detalhe: string
  valor: number
}

const COR_GRAVIDADE: Record<string, string> = {
  ALTA: 'bg-rose-100 text-rose-900 border-rose-400',
  MEDIA: 'bg-amber-100 text-amber-900 border-amber-400',
  BAIXA: 'bg-blue-100 text-blue-900 border-blue-400',
  INFO: 'bg-slate-100 text-slate-700 border-slate-300',
}

const brl = (v: number | null | undefined) =>
  v === null || v === undefined || !isFinite(Number(v))
    ? '—'
    : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function ParametrizadorAnalise() {
  const [token, setToken] = useState('')
  const [aba, setAba] = useState<'auditoria' | 'comparativo' | 'concentracao'>('auditoria')
  const [docs, setDocs] = useState<Documento[]>([])
  const [docSel, setDocSel] = useState<string>('')
  const [auditoria, setAuditoria] = useState<any>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [comparativo, setComparativo] = useState<any>(null)
  const [concentracao, setConcentracao] = useState<any>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [relatorio, setRelatorio] = useState<string>('')

  const stats = useMemo(() => estatisticasTabela(), [])

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
        headers: {
          'Content-Type': 'application/json',
          'X-Painel-Token': token,
        },
        body: corpo ? JSON.stringify(corpo) : undefined,
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      return j
    },
    [token],
  )

  const carregarDocs = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const j = await chamar('param-documentos')
      setDocs(j.documentos || [])
      if (!docSel && j.documentos?.length) setDocSel(j.documentos[0].id)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, chamar, docSel])

  useEffect(() => {
    if (token) {
      carregarDocs()
      chamar('param-concentracao')
        .then(setConcentracao)
        .catch(() => setConcentracao(null))
      chamar('param-comparativo', {})
        .then(setComparativo)
        .catch(() => setComparativo(null))
    }
  }, [token])

  const auditar = async (id: string) => {
    if (!id || !token) return
    setCarregando(true)
    setErro(null)
    setRelatorio('')
    try {
      const j = await chamar('param-auditar', { documento: id })
      setAuditoria(j)
      // classifica os itens do documento no navegador
      const docsResp = await fetch(`${BACKEND}/backend/v1/param-itens-doc?documento=${id}`, {
        headers: { 'X-Painel-Token': token },
      })
      if (docsResp.ok) {
        const jr = await docsResp.json()
        setItens(jr.itens || [])
      }
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  const gerarRelatorio = async () => {
    if (!docSel || !token) return
    setCarregando(true)
    try {
      const j = await chamar('param-relatorio', { documento: docSel })
      setRelatorio(j.texto || '')
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  const imprimir = () => {
    const janela = window.open('', '_blank', 'width=820,height=1000')
    if (!janela) return
    const conteudo = relatorio || ''
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Relatório — Parametrizador ADECONT</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: ui-monospace, "Courier New", monospace; font-size: 10.5px;
         line-height: 1.5; color: #111; white-space: pre-wrap; }
  @media print { body { font-size: 9.5pt; } }
</style></head><body>${conteudo
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</body></html>`)
    janela.document.close()
    setTimeout(() => janela.print(), 350)
  }

  const baixarTxt = () => {
    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `relatorio-documento-${docSel.slice(0, 8)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const docAtual = docs.find((d) => d.id === docSel)

  return (
    <div className="space-y-3">
      {/* ── seletor de documento ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[240px]">
            <span className="text-[10px] font-bold text-slate-600">Documento</span>
            <select
              value={docSel}
              onChange={(e) => {
                setDocSel(e.target.value)
                setAuditoria(null)
                setItens([])
                setRelatorio('')
              }}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              {docs.length === 0 && <option value="">Nenhum documento importado</option>}
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  mod. {d.modelo} nº {d.numero} — {d.emitente} — {brl(d.valor_total)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => auditar(docSel)}
            disabled={!docSel || carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-2 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            Auditar
          </button>
          <button
            type="button"
            onClick={carregarDocs}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {erro && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-300 bg-rose-50 p-2 text-[10.5px] text-rose-900">
            <XCircle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
            {erro}
          </p>
        )}
        {!token && (
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10.5px] text-amber-900">
            Informe o token do painel na aba <b>Importar e quebrar</b> — a análise usa a mesma
            credencial.
          </p>
        )}
      </div>

      {/* ── abas ── */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'auditoria' as const, nome: 'Auditoria do documento', Icon: ShieldCheck },
          {
            id: 'comparativo' as const,
            nome: 'Comparativo entre competências',
            Icon: GitCompareArrows,
          },
          { id: 'concentracao' as const, nome: 'Concentração de valor', Icon: Target },
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

      {/* ══════════ 1. AUDITORIA ══════════ */}
      {aba === 'auditoria' && (
        <>
          {!auditoria && (
            <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
              Escolha um documento e clique em <b>Auditar</b>. A auditoria confere os itens um por
              um contra as regras da reforma e aponta o que falta.
            </p>
          )}

          {auditoria && (
            <>
              {/* resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { r: 'Itens', v: auditoria.resumo?.itens, cor: 'text-slate-900' },
                  {
                    r: 'Achados graves',
                    v: auditoria.resumo?.achados_alta ?? 0,
                    cor:
                      (auditoria.resumo?.achados_alta ?? 0) > 0
                        ? 'text-rose-700'
                        : 'text-emerald-700',
                  },
                  {
                    r: 'Achados médios',
                    v: auditoria.resumo?.achados_media ?? 0,
                    cor:
                      (auditoria.resumo?.achados_media ?? 0) > 0
                        ? 'text-amber-700'
                        : 'text-emerald-700',
                  },
                  {
                    r: 'Valor sem NCM',
                    v: `${auditoria.resumo?.percentual_valor_sem_ncm ?? 0}%`,
                    cor:
                      (auditoria.resumo?.percentual_valor_sem_ncm ?? 0) > 0
                        ? 'text-rose-700'
                        : 'text-emerald-700',
                  },
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

              {/* achados */}
              <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Achados ({auditoria.achados?.length ?? 0})
                  <span className="ml-auto text-[9px] font-normal text-slate-500">
                    ALTA impede classificação · MÉDIA atrapalha escrituração · INFO é esperado em
                    2026
                  </span>
                </p>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {(auditoria.achados ?? []).map((a: Achado, i: number) => (
                    <div key={i} className="px-3 py-1.5 flex items-start gap-2">
                      <span
                        className={`shrink-0 rounded border px-1 py-0.5 text-[8.5px] font-bold ${COR_GRAVIDADE[a.gravidade] || COR_GRAVIDADE.INFO}`}
                      >
                        {a.gravidade}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-bold text-slate-900 leading-tight">
                          {a.item ? `Item ${a.item} · ` : ''}
                          {a.regra}
                          {a.valor > 0 && (
                            <span className="ml-1 font-normal text-slate-500 tabular-nums">
                              ({brl(a.valor)})
                            </span>
                          )}
                        </p>
                        <p className="text-[9.5px] text-slate-600 leading-snug">{a.detalhe}</p>
                      </div>
                    </div>
                  ))}
                  {(auditoria.achados ?? []).length === 0 && (
                    <p className="p-4 text-center text-[11px] text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Nenhum achado: documento íntegro e classificado.
                    </p>
                  )}
                </div>
              </div>

              {/* classificação fiscal por item */}
              {itens.length > 0 && (
                <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                  <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Classificação na reforma, item por item
                    <span className="ml-auto text-[9px] font-normal text-slate-500">
                      {stats.total} regras NCM · {stats.exatos} exatas + {stats.posicoes} por
                      posição
                    </span>
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] min-w-[760px]">
                      <thead>
                        <tr className="bg-panorama-navy text-white">
                          <th className="text-left px-2 py-1.5 font-bold">#</th>
                          <th className="text-left px-2 py-1.5 font-bold">Descrição</th>
                          <th className="text-left px-2 py-1.5 font-bold">NCM</th>
                          <th className="text-left px-2 py-1.5 font-bold">Tratamento na reforma</th>
                          <th className="text-left px-2 py-1.5 font-bold">Origem</th>
                          <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itens.map((it, i) => {
                          const cls = classificarNCM(it.ncm)
                          return (
                            <tr key={it.id || i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                              <td className="px-2 py-1.5 border-b border-slate-100 text-slate-500">
                                {it.numero_item}
                              </td>
                              <td className="px-2 py-1.5 border-b border-slate-100 text-slate-800 max-w-[180px] truncate">
                                {it.descricao}
                              </td>
                              <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px]">
                                {it.ncm || <span className="text-rose-600 font-bold">—</span>}
                              </td>
                              <td className="px-2 py-1.5 border-b border-slate-100">
                                {cls.encontrado ? (
                                  <>
                                    <span className="font-bold text-slate-900">
                                      {cls.regra?.tratamento}
                                    </span>
                                    {cls.regra?.aliquota && (
                                      <span className="ml-1 text-[9px] text-slate-500">
                                        {cls.regra.aliquota}
                                      </span>
                                    )}
                                    {cls.nivel !== null && cls.nivel < 8 && (
                                      <span className="ml-1 rounded bg-amber-100 px-1 text-[8px] font-bold text-amber-900">
                                        por posição — conferir
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[9px] text-slate-400">
                                    sem regra nos anexos — tributação integral ou lacuna
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 border-b border-slate-100 text-[9px] text-slate-500">
                                {cls.regra?.anexo || '—'}
                              </td>
                              <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                                {brl(it.valor_total)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* relatório */}
              <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={gerarRelatorio}
                    disabled={carregando || !docSel}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-panorama-gold-light hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Gerar relatório
                  </button>
                  {relatorio && (
                    <>
                      <button
                        type="button"
                        onClick={imprimir}
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-panorama-navy px-2.5 py-1.5 text-[11px] font-bold text-panorama-navy hover:bg-slate-50 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir / PDF
                      </button>
                      <button
                        type="button"
                        onClick={baixarTxt}
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Baixar .txt
                      </button>
                    </>
                  )}
                </div>
                {relatorio && (
                  <pre className="mt-2 max-h-[360px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[9.5px] leading-relaxed text-slate-800 font-mono whitespace-pre-wrap">
                    {relatorio}
                  </pre>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════ 2. COMPARATIVO ══════════ */}
      {aba === 'comparativo' && (
        <>
          {!comparativo ? (
            <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
              Sem dados ainda. Importe documentos de meses diferentes para ver a variação.
            </p>
          ) : (
            <>
              {comparativo.variacao?.leitura && (
                <div className="rounded-xl border-2 border-panorama-gold bg-amber-50 p-3">
                  <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <GitCompareArrows className="w-3.5 h-3.5" />
                    {comparativo.variacao.de} → {comparativo.variacao.ate}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-slate-700 leading-snug">
                    {comparativo.variacao.leitura}
                  </p>
                  {comparativo.variacao.diferenca !== undefined && (
                    <p className="mt-1 text-[10px] text-slate-600">
                      Documentos: {comparativo.variacao.documentos_de} →{' '}
                      {comparativo.variacao.documentos_ate} (
                      {comparativo.variacao.diferenca_documentos > 0 ? '+' : ''}
                      {comparativo.variacao.diferenca_documentos})
                    </p>
                  )}
                </div>
              )}

              {comparativo.meses?.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-[10.5px] min-w-[700px]">
                    <thead>
                      <tr className="bg-panorama-navy text-white">
                        <th className="text-left px-2 py-1.5 font-bold">Competência</th>
                        <th className="text-right px-2 py-1.5 font-bold">Documentos</th>
                        <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                        <th className="text-right px-2 py-1.5 font-bold">Itens</th>
                        <th className="text-right px-2 py-1.5 font-bold">C/ divergência</th>
                        <th className="text-left px-2 py-1.5 font-bold">Principal emitente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(comparativo.meses ?? []).map((m: any, i: number) => (
                        <tr key={m.competencia} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="px-2 py-1.5 border-b border-slate-100 font-bold text-slate-900">
                            {m.competencia}
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                            {m.documentos}
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold">
                            {brl(m.valor)}
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-600">
                            {m.itens}
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                            <span
                              className={
                                m.com_divergencia > 0 ? 'text-rose-700 font-bold' : 'text-slate-400'
                              }
                            >
                              {m.com_divergencia}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 border-b border-slate-100 text-slate-600 truncate max-w-[200px]">
                            {m.principal_emitente}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] text-slate-500 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                A competência vem da data de emissão do documento. Só entram documentos com data
                preenchida.
              </p>
            </>
          )}
        </>
      )}

      {/* ══════════ 3. CONCENTRAÇÃO ══════════ */}
      {aba === 'concentracao' && (
        <>
          {!concentracao || concentracao.total_itens === 0 ? (
            <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 text-center text-[11px] text-slate-600">
              Sem itens gravados ainda. Importe documentos para ver onde o valor se concentra.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { r: 'Itens', v: concentracao.total_itens, cor: 'text-slate-900' },
                  { r: 'Valor total', v: brl(concentracao.valor_total), cor: 'text-slate-900' },
                  {
                    r: 'Valor sem NCM',
                    v: `${concentracao.itens_sem_ncm}%`,
                    cor: concentracao.itens_sem_ncm > 0 ? 'text-rose-700' : 'text-emerald-700',
                  },
                  {
                    r: 'Classificados na reforma',
                    v: concentracao.itens_classificados,
                    cor: 'text-slate-900',
                  },
                ].map((k) => (
                  <div key={k.r} className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      {k.r}
                    </p>
                    <p className={`text-[17px] font-bold tabular-nums leading-tight ${k.cor}`}>
                      {k.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
                <p className="px-3 py-2 text-[11px] font-bold text-slate-900 border-b-2 border-panorama-gold/40 bg-slate-50 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Onde está o valor, por NCM
                  <span className="ml-auto text-[9px] font-normal text-slate-500">
                    coluna "acumulado" mostra onde a cobertura fecha
                  </span>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10.5px] min-w-[640px]">
                    <thead>
                      <tr className="bg-panorama-navy text-white">
                        <th className="text-left px-2 py-1.5 font-bold">NCM</th>
                        <th className="text-left px-2 py-1.5 font-bold">Descrição</th>
                        <th className="text-left px-2 py-1.5 font-bold">Tratamento</th>
                        <th className="text-right px-2 py-1.5 font-bold">Itens</th>
                        <th className="text-right px-2 py-1.5 font-bold">Valor</th>
                        <th className="text-right px-2 py-1.5 font-bold">%</th>
                        <th className="text-right px-2 py-1.5 font-bold">Acum.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(concentracao.top_ncm ?? []).map((r: any, i: number) => {
                        const cls = classificarNCM(r.chave === '(sem NCM)' ? '' : r.chave)
                        return (
                          <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="px-2 py-1.5 border-b border-slate-100 font-mono text-[9.5px] font-bold">
                              {r.chave}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-slate-700 max-w-[190px] truncate">
                              {r.descricao || '—'}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-[9.5px]">
                              {cls.encontrado ? (
                                <span className="text-slate-800">{cls.regra?.tratamento}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-600">
                              {r.itens}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums font-bold">
                              {brl(r.valor)}
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums">
                              {r.percentual}%
                            </td>
                            <td className="px-2 py-1.5 border-b border-slate-100 text-right tabular-nums text-slate-500">
                              {r.acumulado}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[9px] text-slate-500 leading-snug">
                <b>Como ler:</b> se os primeiros NCMs já somam 80% no acumulado, classificar esses
                poucos itens resolve quase todo o valor — e um erro neles contamina quase todo o
                cálculo. É por onde começar a parametrização.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
