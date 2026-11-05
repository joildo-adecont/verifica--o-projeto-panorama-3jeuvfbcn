import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react'
import { conferirPorPosicao, textoConferenciaPosicao } from '@/data/conferenciaPosicao'

/**
 * CONFERÊNCIA POR POSIÇÃO — o NCM é a raiz de tudo
 * =================================================
 * Pedido do CEO (05/11/2026): "liste quais são, com a posição que casou e a
 * descrição da nota, para o senhor conferir com a contabilidade" e "os agentes
 * validem a fonte e os NCMs atualizados, pois os NCM confiáveis vão determinar o
 * sucesso do Sistema, pois irão determinar a raiz dos produtos e posteriormente
 * todas as classificações fiscais e contábeis."
 *
 * ── POR QUE ESTA TELA É A MAIS IMPORTANTE DO PARAMETRIZADOR ──
 * O NCM é a chave. O tratamento na reforma, o crédito, o débito e a conta
 * contábil penduram no código. Se a chave está errada, todo o resto herda o erro
 * — e herda em SILÊNCIO, porque um número errado tem a mesma aparência de um
 * número certo.
 *
 * ── O QUE O TESTE REAL REVELOU ──
 * Dos 27 NCMs do DIO SANTO, 4 casaram por posição. Desses, TRÊS são suspeitos:
 *   · BANHA (1501.10.00) → posição "15" → regra do Anexo IX sobre ácidos graxos
 *     para sabão. Insumo industrial, não alimento.
 *   · BACON (0210.19.00) → posição "0210" → regra do Anexo IX sobre farinhas de
 *     carne e osso para ração.
 *   · BATATA CHIPS (2004.10.00) → posição "2004" → regra de hortícola
 *     pré-cozido; chips é produto frito industrializado.
 *
 * R$ 2.828,62 em benefício que pode não existir. Melhor descobrir agora.
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
}

export function ParametrizadorConferenciaPosicao() {
  const [token, setToken] = useState('')
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [pastaSel, setPastaSel] = useState('')
  const [itens, setItens] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [soSuspeita, setSoSuspeita] = useState(false)
  const [validador, setValidador] = useState<any>(null)
  const [carregandoVal, setCarregandoVal] = useState(false)

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

  const carregarPastas = useCallback(async () => {
    if (!token) return
    try {
      const j = await chamar('param-pastas-arvore')
      setPastas((j.arvore || []).map((n: any) => ({ id: n.base.id, nome: n.base.nome })))
    } catch {
      setPastas([])
    }
  }, [token, chamar])

  const carregarItens = useCallback(async () => {
    if (!token) return
    setCarregando(true)
    setErro(null)
    try {
      const url = pastaSel
        ? `param-itens-cliente?pasta=${encodeURIComponent(pastaSel)}`
        : `param-itens-todos`
      const j = await chamar(url)
      setItens(j.lista || j.itens || [])
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token, pastaSel, chamar])

  /** Estado do agente validador da base NCM. */
  const carregarValidador = useCallback(async () => {
    if (!token) return
    setCarregandoVal(true)
    try {
      const j = await chamar('param-ncm-status')
      setValidador(j.validador && j.validador.disponivel ? j.validador : null)
    } catch {
      setValidador(null)
    } finally {
      setCarregandoVal(false)
    }
  }, [token, chamar])

  useEffect(() => {
    if (token) {
      carregarPastas()
      carregarValidador()
    }
  }, [token])

  useEffect(() => {
    if (token) carregarItens()
  }, [token, pastaSel])

  const conferencia = useMemo(
    () =>
      conferirPorPosicao(
        itens.map((i) => ({
          ncm: i.ncm || '',
          descricao: i.descricao || '',
          valor: Number(i.valor) || 0,
        })),
      ),
    [itens],
  )

  const filtradas = useMemo(() => {
    let l = [...conferencia]
    if (soSuspeita) l = l.filter((x) => x.veredito === 'suspeita')
    const t = busca
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    if (t) {
      const termos = t.split(/\s+/)
      l = l.filter((x) => {
        const alvo = `${x.ncm} ${x.posicao} ${x.descricaoNota} ${x.tratamento} ${x.descricaoRegra}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
        return termos.every((p) => alvo.indexOf(p) >= 0)
      })
    }
    return l
  }, [conferencia, busca, soSuspeita])

  const suspeitas = conferencia.filter((x) => x.veredito === 'suspeita')
  const valorSuspeito = suspeitas.reduce((s, x) => s + x.valor, 0)
  const nomeCliente = pastas.find((p) => p.id === pastaSel)?.nome || 'Todos os clientes'

  const imprimir = () => {
    const txt = textoConferenciaPosicao(filtradas, nomeCliente)
    const janela = window.open('', '_blank', 'width=900,height=1000')
    if (!janela) return
    janela.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Conferência NCM por posição</title><style>
@page{size:A4;margin:16mm 14mm}
body{font-family:ui-monospace,"Courier New",monospace;font-size:10px;line-height:1.5;white-space:pre-wrap}
@media print{body{font-size:8.5pt}}
</style></head><body>${txt
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</body></html>`)
    janela.document.close()
    setTimeout(() => janela.print(), 350)
  }

  const baixarCsv = () => {
    const cab = [
      'Veredito',
      'NCM',
      'Descricao nota',
      'Posicao',
      'Digitos',
      'Tratamento',
      'Anexo',
      'Regra diz',
      'Itens',
      'Valor',
      'Motivo',
    ]
    const linhas = [
      cab,
      ...filtradas.map((x) => [
        x.veredito,
        x.ncm,
        `"${x.descricaoNota.replace(/"/g, '')}"`,
        x.posicao,
        String(x.digitos),
        x.tratamento,
        x.anexo,
        `"${x.descricaoRegra.replace(/"/g, '').slice(0, 120)}"`,
        String(x.itens),
        x.valor.toFixed(2),
        `"${x.motivo.replace(/"/g, '')}"`,
      ]),
    ]
    const csv = linhas.map((l) => l.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'conferencia-ncm-posicao.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

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

      {/* ── por que isto importa ── */}
      <div className="rounded-xl border-2 border-panorama-navy/40 bg-slate-50 p-3">
        <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
          <ClipboardCheck className="w-3.5 h-3.5" />
          Conferência de NCM casado por POSIÇÃO
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-slate-600">
          O <b>NCM é a raiz</b> de toda a classificação fiscal e contábil. Estes códigos não casaram
          pelo código exato: casaram pela <b>posição</b> (4 ou 2 dígitos). A regra vale para a
          posição inteira, então precisa de conferência — pode haver distinção por subposição que
          mude o tratamento. <b>Mussarela e queijo coalho são o exemplo:</b> mesmo produto para o
          mercado, tratamentos opostos na lei.
        </p>
      </div>

      {/* ── filtros ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex-1 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-600">Cliente</span>
            <select
              value={pastaSel}
              onChange={(e) => setPastaSel(e.target.value)}
              className="mt-0.5 w-full rounded-lg border-2 border-slate-300 px-2 py-1.5 text-[11px] bg-white focus:outline-none focus:border-panorama-gold"
            >
              <option value="">— todos os clientes —</option>
              {pastas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2 py-[7px]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="NCM, descrição ou regra"
              className="w-[170px] text-[10.5px] bg-transparent focus:outline-none"
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
          <label className="flex items-center gap-1 text-[10px] font-bold text-rose-800 cursor-pointer">
            <input
              type="checkbox"
              checked={soSuspeita}
              onChange={(e) => setSoSuspeita(e.target.checked)}
              className="cursor-pointer"
            />
            só suspeitas
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
            disabled={!filtradas.length}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Folha para o contador
          </button>
          <button
            type="button"
            onClick={baixarCsv}
            disabled={!filtradas.length}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      {conferencia.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-xl border-2 border-slate-200 bg-white p-2.5">
            <p className="text-[9px] font-bold uppercase text-slate-500">Casaram por posição</p>
            <p className="text-[18px] font-bold tabular-nums text-slate-900">
              {conferencia.length}
            </p>
            <p className="text-[8.5px] text-slate-500">
              de {new Set(itens.map((i) => i.ncm)).size} NCMs
            </p>
          </div>
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-2.5">
            <p className="text-[9px] font-bold uppercase text-rose-800">Suspeitas</p>
            <p className="text-[18px] font-bold tabular-nums text-rose-900">{suspeitas.length}</p>
            <p className="text-[8.5px] text-rose-700">conferir antes de usar</p>
          </div>
          <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-2.5">
            <p className="text-[9px] font-bold uppercase text-rose-800">Valor em risco</p>
            <p className="text-[15px] font-bold tabular-nums text-rose-900">{brl(valorSuspeito)}</p>
            <p className="text-[8.5px] text-rose-700">benefício que pode não existir</p>
          </div>
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-2.5">
            <p className="text-[9px] font-bold uppercase text-emerald-800">A confirmar</p>
            <p className="text-[18px] font-bold tabular-nums text-emerald-900">
              {conferencia.length - suspeitas.length}
            </p>
            <p className="text-[8.5px] text-emerald-700">assunto bate, falta subposição</p>
          </div>
        </div>
      )}

      {suspeitas.length > 0 && (
        <div className="rounded-lg border-2 border-rose-400 bg-rose-50 p-2.5">
          <p className="flex items-start gap-1.5 text-[10.5px] font-bold text-rose-900">
            <ShieldAlert className="mt-0.5 w-3.5 h-3.5 shrink-0" />
            {suspeitas.length} casamento(s) com indício de erro — {brl(valorSuspeito)} em jogo
          </p>
          <p className="mt-0.5 text-[9.5px] leading-snug text-rose-800">
            O código casou pela posição, mas o <b>assunto da regra é outro</b>: a lei fala de
            insumo, ração ou produto industrial e a nota descreve alimento. Tratar como benefício
            geraria diferença a recolher na fiscalização.
          </p>
        </div>
      )}

      {/* ── lista ── */}
      {filtradas.length === 0 && !carregando && (
        <p className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 text-center text-[11px] text-slate-600">
          {itens.length === 0
            ? 'Nenhum item carregado. Escolha um cliente ou importe documentos.'
            : 'Nenhum NCM casou por posição nesta base — todos casaram pelo código exato, o que é o melhor cenário.'}
        </p>
      )}

      {filtradas.length > 0 && (
        <div className="space-y-1.5">
          {filtradas.map((x, i) => (
            <div
              key={i}
              className={`rounded-xl border-2 p-2.5 ${
                x.veredito === 'suspeita'
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold ${
                    x.veredito === 'suspeita'
                      ? 'bg-rose-700 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {x.veredito === 'suspeita' ? 'SUSPEITA' : 'A CONFIRMAR'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-900 font-mono">
                    {x.ncm}
                    <span className="ml-1 font-sans font-normal text-slate-600">
                      — {x.descricaoNota.slice(0, 60)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[9.5px] text-slate-700">
                    Casou pela posição <b className="font-mono">{x.posicao}</b> ({x.digitos}{' '}
                    dígitos) → <b>{x.tratamento}</b> · {x.anexo}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-500 italic">
                    A regra diz: «{x.descricaoRegra.slice(0, 100)}»
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-900">
                  {brl(x.valor)}
                </span>
              </div>

              <p
                className={`mt-1.5 rounded p-1.5 text-[9px] leading-snug ${
                  x.veredito === 'suspeita'
                    ? 'bg-white/80 text-rose-900'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                <b>{x.veredito === 'suspeita' ? 'Por que é suspeita:' : 'O que fazer:'}</b>{' '}
                {x.motivo}
              </p>
              <p className="mt-1 text-[8.5px] leading-snug text-slate-500">
                <b>Ação:</b> {x.acao}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── agente validador da base ── */}
      <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
        <div className="flex items-start gap-2 px-3 py-2 border-b-2 border-panorama-gold/40 bg-slate-50">
          <Shield className="mt-0.5 w-3.5 h-3.5 shrink-0 text-panorama-navy" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">
              Agente validador da base NCM — 5 especialistas
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              procedência · integridade · cobertura · casamento · fonte viva
            </p>
          </div>
          <button
            type="button"
            onClick={carregarValidador}
            disabled={carregandoVal}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border-2 border-slate-300 px-2 py-1 text-[9.5px] font-bold text-slate-700 hover:bg-white disabled:opacity-40 cursor-pointer"
          >
            {carregandoVal ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Rodar
          </button>
        </div>
        <div className="p-3">
          {!validador || !validador.disponivel ? (
            <p className="text-[10px] text-slate-600">
              {validador?.mensagem ||
                'Sem registro da última auditoria da base. O agente roda junto com a rotina de fontes e grava o resultado no servidor.'}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    validador.problemas_graves > 0
                      ? 'bg-rose-600 text-white'
                      : validador.achados?.length > 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                  }`}
                >
                  {validador.verificacoes_ok}/{validador.verificacoes_total} OK
                </span>
                <span className="text-[9.5px] text-slate-600">
                  {String(validador.quando || '')
                    .slice(0, 16)
                    .replace('T', ' ')}
                </span>
              </div>
              <p className="mt-1 text-[10px] font-bold text-slate-800">{validador.mensagem}</p>

              <div className="mt-1.5 space-y-0.5">
                {(validador.verificacoes || []).map((v: any, i: number) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px]">
                    {v.ok ? (
                      <CheckCircle2 className="mt-0.5 w-2.5 h-2.5 shrink-0 text-emerald-700" />
                    ) : (
                      <AlertTriangle className="mt-0.5 w-2.5 h-2.5 shrink-0 text-amber-600" />
                    )}
                    <span className="text-slate-700">
                      <b>{v.nome}:</b> {v.detalhe}
                    </span>
                  </div>
                ))}
              </div>

              {validador.cobertura && (
                <p className="mt-2 rounded bg-slate-50 p-1.5 text-[9px] leading-snug text-slate-600">
                  <b>Leitura da cobertura:</b> {validador.cobertura.aliquota} regras de alíquota em{' '}
                  {validador.cobertura.capitulos_com_regra} capítulos.{' '}
                  {validador.cobertura.capitulos_sem_regra} capítulos não têm nenhuma regra — neles,
                  todo produto paga a integral. Isso não é falha da tabela: é o desenho da lei.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-[8.5px] leading-snug text-slate-500">
        <b>Como conferir:</b> abra a Tabela Geral dos Anexos (Seção 7A), localize o anexo citado e
        procure a <b>subposição</b> do produto (6 primeiros dígitos). Se estiver listada, o
        benefício vale; se não estiver, o produto paga a integral. O agente validador audita a base
        e o motor, mas não corrige sozinho: um agente que reescreve 15 mil códigos por conta própria
        é risco, não segurança.
      </p>
    </div>
  )
}
