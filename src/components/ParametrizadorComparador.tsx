import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  Info,
  Loader2,
  Printer,
  RefreshCw,
  Scale,
  Target,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import {
  comparar,
  creditosPorOrigem,
  pontoDeEquilibrio,
  faseDoAno,
  ANOS_COMPARADOR,
  REGIMES,
  RESSALVA_COMPARADOR,
  REF_PLENA,
  type EntradaComparador,
} from '@/data/comparadorRegimes'

/**
 * COMPARADOR DE REGIMES E CRÉDITOS — interface
 * ============================================
 * Separa o que é DADO (receita, compras, imobilizado, DAS informado) do que é
 * REGRA (alíquotas da lei). O usuário mexe nos dados; a regra vem do motor.
 *
 * A tela não escolhe regime por ninguém: mostra a carga de cada caminho, o
 * crédito que cada um entrega ao adquirente e o ponto em que a diferença de DAS
 * deixa de compensar o crédito perdido.
 */

const BACKEND =
  import.meta.env.VITE_POCKETBASE_URL?.replace(/\/$/, '') ||
  'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

const TOKEN_KEY = 'adecont_painel_token'

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })

const pctBR = (v: number) => `${v.toFixed(2).replace('.', ',')}%`

export function ParametrizadorComparador() {
  const [token, setToken] = useState('')
  const [entrada, setEntrada] = useState<EntradaComparador>({
    receitaAnual: 1_200_000,
    comprasAnual: 480_000,
    imobilizadoAnual: 60_000,
    pctComprasCreditaveis: 85,
    dasPct: 8.5,
    pctIbsCbsNoDas: 3.65,
    fatorVendas: 1,
    uf: 'RS',
  })

  const [carregando, setCarregando] = useState(false)
  const [origem, setOrigem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || '')
    } catch {
      setToken('')
    }
  }, [])

  const set = <K extends keyof EntradaComparador>(k: K, v: EntradaComparador[K]) =>
    setEntrada((p) => ({ ...p, [k]: v }))

  /**
   * PUXAR OS NÚMEROS DO CLIENTE A PARTIR DOS XMLs JÁ IMPORTADOS.
   * Só preenche o que o documento prova: compras (entradas) e receita (saídas).
   * O DAS não vem de XML — é informado pelo contador, e a tela diz isso.
   */
  const puxarDoCliente = useCallback(async () => {
    if (!token) {
      setErro('Informe o token do painel para ler os documentos do cliente.')
      return
    }
    setCarregando(true)
    setErro(null)
    try {
      const r = await fetch(`${BACKEND}/backend/v1/param-pastas-arvore`, {
        headers: { 'X-Painel-Token': token },
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `Falha (${r.status})`)
      const arvore = j.arvore || []
      if (!arvore.length) {
        setErro('Nenhuma pasta de cliente encontrada no Parametrizador.')
        return
      }
      const base = arvore[0].base
      const r2 = await fetch(
        `${BACKEND}/backend/v1/param-itens-cliente?pasta=${encodeURIComponent(base.id)}`,
        { headers: { 'X-Painel-Token': token } },
      )
      const j2 = await r2.json()
      if (!r2.ok) throw new Error(j2.error || `Falha (${r2.status})`)

      const lista: any[] = j2.lista || []
      const entradas = lista
        .filter((x) => x.direcao === 'entrada')
        .reduce((s, x) => s + (Number(x.valor) || 0), 0)
      const saidas = lista
        .filter((x) => x.direcao === 'saida')
        .reduce((s, x) => s + (Number(x.valor) || 0), 0)

      setEntrada((p) => ({
        ...p,
        comprasAnual: Math.round(entradas) || p.comprasAnual,
        receitaAnual: Math.round(saidas) || p.receitaAnual,
      }))
      setOrigem(
        `${base.nome} — ${lista.length} itens dos documentos importados: ` +
          `${brl(entradas)} em entradas e ${brl(saidas)} em saídas. ` +
          'O DAS continua informado pelo contador.',
      )
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [token])

  const resultado = useMemo(() => comparar(entrada), [entrada])
  const creditos = useMemo(() => creditosPorOrigem(entrada), [entrada])
  const equilibrio = useMemo(() => pontoDeEquilibrio(entrada), [entrada])

  const regular = resultado.find((r) => r.regime === 'regular')
  const hibrido = resultado.find((r) => r.regime === 'simples_hibrido')
  const simples = resultado.find((r) => r.regime === 'simples')

  /** Diferença do híbrido contra o regular, em 2033. */
  const difHibrido = (hibrido?.cargaTotal2033 ?? 0) - (regular?.cargaTotal2033 ?? 0)

  return (
    <div className="space-y-4">
      {/* cabeçalho */}
      <div className="rounded-xl bg-gradient-to-r from-panorama-navy to-[#132a4a] p-4 ring-1 ring-panorama-gold/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-panorama-gold-light" />
              <h2 className="text-base font-bold text-white">Comparador de regimes e créditos</h2>
            </div>
            <p className="mt-1 text-[12px] text-slate-300 max-w-3xl">
              Carga de IBS/CBS e crédito em cada caminho, de 2026 a 2033. O Simples cobra menos — e
              é por isso que pode custar mais caro: sem crédito, o adquirente cobra a diferença no
              preço.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
        </div>
      </div>

      {/* entrada de dados */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold text-panorama-navy">Dados do contribuinte</h3>
          <button
            type="button"
            onClick={puxarDoCliente}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-panorama-navy px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {carregando ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Puxar dos XMLs importados
          </button>
        </div>

        {erro && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-[11px] text-red-800">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}
        {origem && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50 p-2 text-[11px] text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{origem}</span>
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo
            rotulo="Receita anual de vendas"
            valor={entrada.receitaAnual}
            onChange={(v) => set('receitaAnual', v)}
            prefixo="R$"
          />
          <Campo
            rotulo="Compras anuais (insumos)"
            valor={entrada.comprasAnual}
            onChange={(v) => set('comprasAnual', v)}
            prefixo="R$"
          />
          <Campo
            rotulo="Ativo imobilizado no ano"
            valor={entrada.imobilizadoAnual}
            onChange={(v) => set('imobilizadoAnual', v)}
            prefixo="R$"
          />
          <Campo
            rotulo="% das compras que gera crédito"
            valor={entrada.pctComprasCreditaveis}
            onChange={(v) => set('pctComprasCreditaveis', v)}
            sufixo="%"
          />
          <Campo
            rotulo="DAS efetivo (informado)"
            valor={entrada.dasPct}
            onChange={(v) => set('dasPct', v)}
            sufixo="% da receita"
          />
          <Campo
            rotulo="IBS/CBS dentro do DAS (informado)"
            valor={entrada.pctIbsCbsNoDas}
            onChange={(v) => set('pctIbsCbsNoDas', v)}
            sufixo="% da receita"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600">Tratamento das vendas:</span>
            {[
              { v: 1, nome: 'Integral' },
              { v: 0.7, nome: '−30%' },
              { v: 0.6, nome: '−40%' },
              { v: 0.4, nome: '−60%' },
              { v: 0.3, nome: '−70%' },
              { v: 0, nome: 'Zero' },
            ].map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => set('fatorVendas', f.v)}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer ${
                  entrada.fatorVendas === f.v
                    ? 'bg-panorama-gold text-panorama-navy'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* resultado por regime */}
      <div className="grid gap-3 lg:grid-cols-3">
        {resultado.map((r) => {
          const l = r.anos.find((a) => a.ano === 2033)
          const destaque = r.regime === 'simples_hibrido'
          return (
            <div
              key={r.regime}
              className={`rounded-xl border p-3 ${
                destaque
                  ? 'border-panorama-gold bg-panorama-navy text-white'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Wallet
                  className={`w-3.5 h-3.5 ${destaque ? 'text-panorama-gold-light' : 'text-panorama-navy'}`}
                />
                <h4
                  className={`text-[12px] font-bold ${destaque ? 'text-white' : 'text-panorama-navy'}`}
                >
                  {r.nome}
                </h4>
              </div>
              <p className={`mt-1 text-[10px] ${destaque ? 'text-slate-300' : 'text-slate-500'}`}>
                {r.base}
              </p>

              <div className="mt-2 space-y-1">
                <Linha nome="IBS/CBS sobre vendas" valor={brl(l?.debito ?? 0)} escuro={destaque} />
                <Linha nome="Crédito nas compras" valor={brl(l?.credito ?? 0)} escuro={destaque} />
                <Linha nome="DAS pago" valor={brl(l?.das ?? 0)} escuro={destaque} />
                <div
                  className={`mt-1 border-t pt-1 ${destaque ? 'border-white/20' : 'border-slate-200'}`}
                >
                  <Linha
                    nome="Carga total 2033"
                    valor={brl(r.cargaTotal2033)}
                    escuro={destaque}
                    forte
                  />
                </div>
                <Linha
                  nome="Crédito ao adquirente"
                  valor={brl(l?.creditoAoAdquirente ?? 0)}
                  escuro={destaque}
                />
              </div>

              <p
                className={`mt-2 text-[10.5px] leading-snug ${destaque ? 'text-slate-200' : 'text-slate-600'}`}
              >
                {r.leitura}
              </p>
            </div>
          )
        })}
      </div>

      {/* ponto de equilíbrio */}
      {equilibrio && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-[12px] font-bold text-amber-900">
                Ponto de equilíbrio entre Simples e regime regular
              </h4>
              <p className="mt-1 text-[11px] text-amber-900">{equilibrio.explicacao}</p>
              <p className="mt-1 text-[10px] text-amber-700">
                Medido pela carga de IBS/CBS no regime pleno (2033) contra o crédito que o Simples
                deixa de entregar na cadeia (art. 47, § 9º, II).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* créditos por origem */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-panorama-navy" />
          <h3 className="text-[13px] font-bold text-panorama-navy">
            Créditos de IBS/CBS por origem da compra
          </h3>
        </div>
        <p className="mt-1 text-[11px] text-slate-600">
          Alíquota plena de {pctBR(REF_PLENA)} aplicada sobre a base de cada origem. O ativo
          imobilizado tem a armadilha: a LC 214 dá crédito <strong>integral na aquisição</strong> —
          não há 1/48 avos, que é regra do PIS/COFINS atual.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-panorama-navy text-white">
                <th className="px-2 py-1.5 text-left font-bold border-b-2 border-panorama-gold">
                  Origem
                </th>
                <th className="px-2 py-1.5 text-right font-bold border-b-2 border-panorama-gold">
                  Base
                </th>
                <th className="px-2 py-1.5 text-right font-bold border-b-2 border-panorama-gold">
                  Crédito 2033
                </th>
                <th className="px-2 py-1.5 text-left font-bold border-b-2 border-panorama-gold">
                  Como é apropriado
                </th>
                <th className="px-2 py-1.5 text-left font-bold border-b-2 border-panorama-gold">
                  Base legal
                </th>
              </tr>
            </thead>
            <tbody>
              {creditos.map((c) => (
                <tr key={c.origem} className="border-b border-slate-100">
                  <td className="px-2 py-1.5 font-semibold text-panorama-navy">{c.origem}</td>
                  <td className="px-2 py-1.5 text-right">{brl(c.base)}</td>
                  <td
                    className={`px-2 py-1.5 text-right font-bold ${
                      c.credito > 0 ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {c.credito > 0 ? brl(c.credito) : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-slate-600">{c.como}</td>
                  <td className="px-2 py-1.5 text-slate-500">{c.baseLegal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* transição ano a ano */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-panorama-navy" />
          <h3 className="text-[13px] font-bold text-panorama-navy">
            Transição 2026 → 2033 — carga total por regime
          </h3>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-panorama-navy text-white">
                <th className="px-2 py-1.5 text-left font-bold border-b-2 border-panorama-gold">
                  Ano
                </th>
                <th className="px-2 py-1.5 text-left font-bold border-b-2 border-panorama-gold">
                  Fase
                </th>
                {REGIMES.map((r) => (
                  <th
                    key={r.id}
                    className="px-2 py-1.5 text-right font-bold border-b-2 border-panorama-gold"
                  >
                    {r.curto}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ANOS_COMPARADOR.map((ano) => (
                <tr
                  key={ano}
                  className={`border-b border-slate-100 ${ano === 2033 ? 'bg-panorama-gold/10 font-bold' : ''}`}
                >
                  <td className="px-2 py-1.5">{ano}</td>
                  <td className="px-2 py-1.5 text-slate-500">{faseDoAno(ano)}</td>
                  {REGIMES.map((r) => {
                    const reg = resultado.find((x) => x.regime === r.id)
                    const l = reg?.anos.find((a) => a.ano === ano)
                    return (
                      <td key={r.id} className="px-2 py-1.5 text-right">
                        {brl((l?.carga ?? 0) + (l?.das ?? 0))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* leitura do resultado */}
      {hibrido && regular && (
        <div
          className={`rounded-xl border p-3 ${
            difHibrido < 0 ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-panorama-navy" />
            <div>
              <h4 className="text-[12px] font-bold text-panorama-navy">
                Simples híbrido contra regime regular, em 2033
              </h4>
              <p className="mt-1 text-[11px] text-slate-700">
                O híbrido custa <strong>{brl(Math.abs(difHibrido))}</strong>{' '}
                {difHibrido < 0 ? 'menos' : 'mais'} que o regime regular neste cenário. A diferença
                vem do DAS que continua sendo pago sobre ICMS/ISS/IRPJ/CSLL — o IBS/CBS é idêntico
                nos dois, porque a apuração é a mesma.
              </p>
              {simples && (
                <p className="mt-1 text-[11px] text-slate-700">
                  E o Simples integral destrói <strong>{brl(simples.creditoPerdido2033)}</strong> de
                  crédito na cadeia em 2033 — valor que o adquirente tende a cobrar de volta no
                  preço.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ressalva */}
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-slate-600">{RESSALVA_COMPARADOR}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-white p-2 text-[10px] text-slate-500">
        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Alíquotas de <code>@/data/aliquotas</code>: CBS 11,3% (TCU, 28/10/2026) + IBS 18,70% (Res.
          CGIBS 14/2026) = 30,00% no regime pleno. A transição do IBS segue o art. 344 (10% em 2029,
          40% em 2030, 70% em 2031, 90% em 2032, 100% em 2033).
        </span>
      </div>
    </div>
  )
}

/* ── componentes auxiliares ── */

function Campo({
  rotulo,
  valor,
  onChange,
  prefixo,
  sufixo,
}: {
  rotulo: string
  valor: number
  onChange: (v: number) => void
  prefixo?: string
  sufixo?: string
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] font-semibold text-slate-600">{rotulo}</span>
      <div className="mt-0.5 flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5">
        {prefixo && <span className="text-[10px] text-slate-400">{prefixo}</span>}
        <input
          type="number"
          value={valor}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full bg-transparent text-[12px] font-semibold text-panorama-navy outline-none"
        />
        {sufixo && <span className="whitespace-nowrap text-[10px] text-slate-400">{sufixo}</span>}
      </div>
    </label>
  )
}

function Linha({
  nome,
  valor,
  escuro,
  forte,
}: {
  nome: string
  valor: string
  escuro?: boolean
  forte?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={`text-[10.5px] ${escuro ? 'text-slate-300' : 'text-slate-500'}`}>
        {nome}
      </span>
      <span
        className={`text-[11px] ${forte ? 'font-bold' : 'font-semibold'} ${
          escuro ? 'text-white' : 'text-panorama-navy'
        }`}
      >
        {valor}
      </span>
    </div>
  )
}

export default ParametrizadorComparador
