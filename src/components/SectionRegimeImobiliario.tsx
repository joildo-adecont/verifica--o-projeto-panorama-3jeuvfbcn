import { useEffect, useState } from 'react'
import { Building2, Calculator, Home, Landmark, KeyRound, TrendingDown } from 'lucide-react'
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

const SIM_URL = '/simulador.html'

// ============ DESIGN SYSTEM v2 — Simuladores Modernos (04/10/2026) ============
// Capitulação legal como indicador de origem em cada bloco.

const ORIGENS: Record<string, { rotulo: string; cor: string }> = {
  lei: { rotulo: 'LEI COMPLEMENTAR', cor: 'bg-blue-100 text-blue-800 border-blue-300' },
  decreto: {
    rotulo: 'DECRETO / REGULAMENTO',
    cor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  resolucao: {
    rotulo: 'RESOLUÇÃO CGIBS/CGSN',
    cor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  ato: { rotulo: 'ATO CONJUNTO', cor: 'bg-orange-100 text-orange-800 border-orange-300' },
  ref: { rotulo: 'REFERÊNCIA', cor: 'bg-slate-100 text-slate-700 border-slate-300' },
}

function Origem({ tipo, texto }: { tipo: keyof typeof ORIGENS; texto: string }) {
  const o = ORIGENS[tipo]
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${o.cor}`}
    >
      📎 {o.rotulo}: {texto}
    </span>
  )
}

function HeroSim({
  titulo,
  sub,
  teclas,
  capitulacao,
}: {
  titulo: string
  sub: string
  teclas: string
  capitulacao: string
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-panorama-navy via-panorama-navy to-panorama-navy-light text-white shadow-lg">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-panorama-gold text-panorama-navy text-[11px] font-black tracking-wider">
            SIMULADOR
          </span>
          <span className="text-[11px] font-semibold text-white/70">{teclas}</span>
        </div>
        <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight">{titulo}</h3>
        <p className="mt-1.5 text-xs sm:text-sm text-white/80 leading-relaxed">{sub}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {capitulacao.split(' · ').map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-mono font-semibold"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ModoChips<T extends string>({
  modos,
  modo,
  setModo,
}: {
  modos: readonly { id: T; label: string; icone: string }[]
  modo: T
  setModo: React.Dispatch<React.SetStateAction<T>> | ((m: T) => void)
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {modos.map((m, i) => (
        <button
          key={m.id}
          onClick={() => setModo(m.id)}
          className={`group relative px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            modo === m.id
              ? 'bg-gradient-to-br from-panorama-navy to-panorama-navy-light text-white border-panorama-navy shadow-md'
              : 'bg-white border-slate-200 text-slate-700 hover:border-panorama-gold hover:bg-panorama-cream'
          }`}
        >
          <div className="text-base leading-none">{m.icone}</div>
          <div
            className={`mt-1 text-xs font-bold leading-tight ${modo === m.id ? 'text-white' : 'text-slate-800'}`}
          >
            {m.label}
          </div>
          <div
            className={`absolute top-1.5 right-1.5 px-1.5 rounded text-[9px] font-black ${modo === m.id ? 'bg-panorama-gold text-panorama-navy' : 'bg-slate-100 text-slate-400 group-hover:text-panorama-gold-dark'}`}
          >
            ⌥{i + 1}
          </div>
        </button>
      ))}
    </div>
  )
}

function useModoTeclado<T extends string>(
  setModo: React.Dispatch<React.SetStateAction<T>> | ((m: T) => void),
  ids: readonly T[],
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= ids.length) {
        e.preventDefault()
        setModo(ids[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setModo, ids])
}

function BlocoH({ n, titulo, capitulacao }: { n: string; titulo: string; capitulacao?: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-panorama-gold to-panorama-gold-dark text-panorama-navy font-black text-[11px] shadow-sm">
        {n}
      </span>
      <h4 className="text-sm font-bold text-slate-900">{titulo}</h4>
      {capitulacao && <Origem tipo="lei" texto={capitulacao} />}
    </div>
  )
}

function RodapeCapitulacao({ itens }: { itens: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold text-slate-900">
          📚 Capitulação legal — origem de cada cálculo
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {itens.map((it) => {
          const [tipo, texto] = it.split('|')
          return <Origem key={it} tipo={tipo as keyof typeof ORIGENS} texto={texto} />
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-500">
        Fontes monitoradas na rotina semanal (seg 11h) — atualizações registradas na Seção 13 —
        Histórico.
      </p>
    </div>
  )
}

function BotaoEnviarSimulacao({ termo, label }: { termo?: string; label?: string }) {
  const href = termo ? `${SIM_URL}?q=${encodeURIComponent(termo)}&enviar=1` : `${SIM_URL}?enviar=1`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-panorama-gold to-panorama-gold-dark text-panorama-navy font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
    >
      📤 {label || 'Enviar esta simulação por e-mail (protocolo)'} — via Simulador Geral
    </a>
  )
}

/** Seção 6A — Regime Imobiliário (LC 214/2025, arts. 252–261 e 485–488).
 *  Fontes extraídas do texto compilado do Planalto (conferido em 04/10/2026). */

const OPERACOES = [
  {
    titulo: 'Venda (alienação) de imóvel residencial novo',
    reducao: '−50%',
    detalhe:
      'Redutor social de R$ 100 mil por imóvel, deduzido da base de cálculo (uma única vez por imóvel, atualizado pelo IPCA).',
    base: 'LC 214, arts. 261 e 259',
    sim: 'venda de imóvel residencial novo',
  },
  {
    titulo: 'Venda (alienação) de imóvel usado',
    reducao: '−50%',
    detalhe:
      'Redutor de ajuste: valor de aquisição do imóvel corrigido pelo IPCA é deduzido da base de cálculo (arts. 257–258).',
    base: 'LC 214, arts. 261, 257–258',
    sim: 'venda de imóvel usado',
  },
  {
    titulo: 'Venda de lote residencial (parcelamento de solo)',
    reducao: '−50%',
    detalhe: 'Redutor social de R$ 30 mil por lote (uma única vez, atualizado pelo IPCA).',
    base: 'LC 214, arts. 261 e 259',
    sim: 'lote residencial',
  },
  {
    titulo: 'Locação residencial',
    reducao: '−70%',
    detalhe: 'Redutor social de R$ 600/mês por imóvel, deduzido da base (atualizado pelo IPCA).',
    base: 'LC 214, art. 261, p.ú. e art. 260',
    sim: 'locação residencial',
  },
  {
    titulo: 'Locação comercial/industrial (não residencial)',
    reducao: '−70%',
    detalhe: 'Sem redutor social — apenas a redução de 70% da alíquota.',
    base: 'LC 214, art. 261, p.ú.',
    sim: 'locação não residencial',
  },
  {
    titulo: 'Intermediação imobiliária (corretagem)',
    reducao: '−50%',
    detalhe:
      'Cada corretor responde pelo IBS/CBS da própria remuneração; valores pagos diretamente pelos contratantes ficam fora da base.',
    base: 'LC 214, arts. 261 e 255, §3º',
    sim: 'intermediação',
  },
  {
    titulo: 'Construção civil por encomenda',
    reducao: '−50%',
    detalhe: 'Fato gerador no fornecimento (art. 254, V).',
    base: 'LC 214, art. 261',
    sim: 'construção civil',
  },
]

const RET = [
  {
    titulo: 'RET — patrimônio de afetação (Lei 10.931, arts. 4 e 8)',
    aliquota: '2,08% da receita mensal recebida',
    detalhe:
      'Opcão para incorporação com patrimônio de afetação, com pedido efetivado antes de 01/01/2029. Afasta as demais formas de incidência sobre a incorporação.',
    base: 'LC 214, art. 485, I',
  },
  {
    titulo: 'RET especial (Lei 10.931, art. 4, §6º/§8º e art. 8, p.ú.)',
    aliquota: '0,53% da receita mensal recebida',
    detalhe: 'Mesmas condições de opção e prazo (antes de 01/01/2029).',
    base: 'LC 214, art. 485, II',
  },
]

const PERMUTAS = [
  {
    titulo: 'Permuta entre contribuintes do regime regular',
    regra:
      'Sem incidência sobre o valor permutado (exceto a torna). O redutor de ajuste do imável dado em permuta é mantido e pode ser usado no imóvel recebido; na permuta para entrega de unidades a construir, aplica-se proporcionalmente à fração ideal.',
    base: 'LC 214, art. 252, §2º, I e §5º',
  },
  {
    titulo: 'Permuta entre contribuinte regular e não contribuinte',
    regra:
      'Não se constitui redutor de ajuste para o imóvel recebido pelo não contribuinte. Para o contribuinte regular: sem torna, mantém-se o redutor; com torna paga por ele, soma-se a torna; com torna recebida, deduz-se (sem ficar negativo).',
    base: 'LC 214, art. 252, §5-A (LC 227/2026)',
  },
  {
    titulo: 'Outras não incidências',
    regra:
      'Constituição/transmissão de direitos reais de garantia (hipoteca etc.) e operações de fundo patrimonial (Lei 13.800/2019). Servidão, cessão de uso e direito de passagem seguem as regras de locação.',
    base: 'LC 214, art. 252, §1º–§2º',
  },
]

/** Simulador do Regime Imobiliário — venda e locação (LC 214, arts. 255–262).
 *  Base de cálculo demonstrada passo a passo: valor da operação → redutor de ajuste →
 *  redutor social → base efetiva; alíquota cheia × redução (50% venda / 70% locação);
 *  comparação com a tributação atual (PIS/Cofins 3,65% + IRPJ/CSLL presumidos). */

const REF_TOTAL = 27.91 // referência total IBS+CBS (Res. CGIBS 14/2026)

function KpiA({
  titulo,
  valor,
  sub,
  destaque,
}: {
  titulo: string
  valor: string
  sub?: string
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 transition-shadow hover:shadow-md ${destaque ? 'bg-gradient-to-br from-panorama-navy to-panorama-navy-light text-white border-panorama-navy shadow-md' : 'bg-white border-slate-200'}`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-wider ${destaque ? 'text-panorama-gold-light' : 'text-slate-500'}`}
      >
        {titulo}
      </div>
      <div
        className={`mt-1 text-xl font-black tabular-nums ${destaque ? 'text-panorama-gold-light' : 'text-slate-900'}`}
      >
        {valor}
      </div>
      {sub && (
        <div className={`mt-0.5 text-[11px] ${destaque ? 'text-white/70' : 'text-slate-500'}`}>
          {sub}
        </div>
      )}
    </div>
  )
}

function BadgeA({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
    >
      {ok ? '✓' : '⚠'} {texto}
    </span>
  )
}

function SimuladorImobiliario() {
  const [modo, setModo] = useState<'venda' | 'locacao'>('venda')
  useModoTeclado(setModo, ['venda', 'locacao'] as const)
  // Venda
  const [preco, setPreco] = useState(800000)
  const [tipoVenda, setTipoVenda] = useState<'novo' | 'usado' | 'lote'>('novo')
  const [custo, setCusto] = useState(500000)
  const [ipca, setIpca] = useState(30)
  // Locação
  const [aluguel, setAluguel] = useState(2500)
  const [unidades, setUnidades] = useState(10)
  const [residencial, setResidencial] = useState(true)
  // Enquadramento (art. 251)
  const [tipoLocador, setTipoLocador] = useState<'pj' | 'pf'>('pj')
  const [receitaAnterior, setReceitaAnterior] = useState(300000)
  const [ipcaLimite, setIpcaLimite] = useState(10)

  const cbsRef = 8.8
  const ibsRef = REF_TOTAL - cbsRef
  const aliCheia = cbsRef + ibsRef

  // ---------- VENDA ----------
  const redutorAjuste = tipoVenda === 'usado' ? Math.min(custo * (1 + ipca / 100), preco) : 0
  const aposAjuste = Math.max(0, preco - redutorAjuste)
  const redutorSocial =
    tipoVenda === 'novo'
      ? Math.min(100000, aposAjuste)
      : tipoVenda === 'lote'
        ? Math.min(30000, aposAjuste)
        : 0
  const baseVenda = aposAjuste - redutorSocial
  const aliVenda = aliCheia * 0.5
  const ibsCbsVenda = (baseVenda * aliVenda) / 100
  const atualVenda = (preco * 3.65) / 100
  const difVenda = ibsCbsVenda - atualVenda

  // ---------- LOCAÇÃO ----------
  const receitaMes = aluguel * unidades
  const receitaAno = receitaMes * 12
  const limite240 = 240000 * (1 + ipcaLimite / 100)
  const limite288 = limite240 * 1.2
  const imoveisAnterior = unidades
  // Enquadramento art. 251
  const pjSempre = tipoLocador === 'pj'
  const pfAnoAnterior = !pjSempre && receitaAnterior > limite240 && imoveisAnterior > 3
  const pfProprioAno = !pjSempre && !pfAnoAnterior && receitaAno > limite288 && imoveisAnterior > 3
  const contribuinte = pjSempre || pfAnoAnoAnteriorFlag(pfAnoAnterior) || pfProprioAno
  const motivoEnq = pjSempre
    ? 'Pessoa jurídica é contribuinte do regime regular em qualquer volume (art. 251, caput).'
    : pfAnoAnterior
      ? 'PF: receita do ano anterior acima do limite atualizado E mais de 3 imóveis distintos (art. 251, §1º, I).'
      : pfProprioAno
        ? 'PF: receita do próprio ano supera o limite em mais de 20% e mais de 3 imóveis (art. 251, §2º, II; Decreto 12.955/2026, art. 382, §1º, III).'
        : 'Fora do regime regular: não atinge cumulativamente receita acima do limite e mais de 3 imóveis (art. 251, §1º, I) — sem IBS/CBS sobre aluguéis.'

  const redutorSocialLoc = residencial ? Math.min(600 * unidades, receitaMes) : 0
  const baseLoc = receitaMes - redutorSocialLoc
  const aliLoc = aliCheia * 0.3
  const ibsCbsLoc = (baseLoc * aliLoc) / 100
  const ibsCbsLocAno = ibsCbsLoc * 12
  const atualLoc = (receitaMes * 3.65) / 100
  const difLoc = ibsCbsLoc - atualLoc

  const e = modo === 'venda'
  const aliEfetiva = e ? aliVenda : aliLoc
  const base = e ? baseVenda : baseLoc
  const receita = e ? preco : receitaMes
  const ibsCbs = e ? ibsCbsVenda : ibsCbsLoc
  const atual = e ? atualVenda : atualLoc
  const dif = e ? difVenda : difLoc
  const redSocial = e ? redutorSocial : redutorSocialLoc

  // Faixa de imóveis 1..12 (locação)
  const faixaImoveis = Array.from({ length: 12 }, (_, k) => k + 1).map((n) => {
    const rm = aluguel * n
    const ra = rm * 12
    const enq = pjSempre || (receitaAnterior > limite240 && n > 3) || (ra > limite288 && n > 3)
    const rs = residencial ? Math.min(600 * n, rm) : 0
    const b = rm - rs
    const t = (b * aliLoc) / 100
    return { n, rm, ra, enq, rs, b, t, tAno: t * 12 }
  })
  const minEnq = faixaImoveis.find((f) => f.enq)?.n
  const maxFora = faixaImoveis.filter((f) => !f.enq).length

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador Imobiliário — venda e aluguel"
        sub="Base de cálculo = valor da operação − redutor de ajuste (custo + IPCA, só usado) − redutor social (R$ 100 mil novo / R$ 30 mil lote / R$ 600/mês residencial, atualizados pelo IPCA). Alíquota = referência 27,91% × 50% (venda) × 30% (locação)."
        teclas="Alt+1 Venda · Alt+2 Aluguel"
        capitulacao="LEI LC 214/2025, arts. 255–262 · LEI LC 227/2026 (art. 260) · DECRETO 12.955/2026, art. 382 · RESOLUÇÃO CGIBS 14/2026 (ref. 27,91%)"
      />

      <ModoChips
        modos={[
          { id: 'venda', label: 'Venda de imóvel', icone: '🏠' },
          { id: 'locacao', label: 'Aluguel (locação)', icone: '🔑' },
        ]}
        modo={modo}
        setModo={setModo}
      />

      {/* Entradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {e ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Valor de venda (R$)</span>
              <input
                type="number"
                value={preco}
                min={0}
                onChange={(ev) => setPreco(Number(ev.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Tipo de imóvel</span>
              <select
                value={tipoVenda}
                onChange={(ev) => setTipoVenda(ev.target.value as 'novo' | 'usado' | 'lote')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="novo">Residencial novo (redutor social R$ 100 mil)</option>
                <option value="usado">Usado (redutor de ajuste)</option>
                <option value="lote">Lote residencial (redutor social R$ 30 mil)</option>
              </select>
            </label>
            {tipoVenda === 'usado' && (
              <>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">
                    Custo de aquisição (R$)
                  </span>
                  <input
                    type="number"
                    value={custo}
                    min={0}
                    onChange={(ev) => setCusto(Number(ev.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-700">IPCA acumulado (%)</span>
                  <input
                    type="number"
                    value={ipca}
                    min={0}
                    onChange={(ev) => setIpca(Number(ev.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </>
            )}
          </>
        ) : (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Aluguel mensal por imóvel (R$)
              </span>
              <input
                type="number"
                value={aluguel}
                min={0}
                onChange={(ev) => setAluguel(Number(ev.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Nº de imóveis locados</span>
              <input
                type="number"
                value={unidades}
                min={1}
                onChange={(ev) => setUnidades(Number(ev.target.value) || 1)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Finalidade</span>
              <select
                value={residencial ? 'r' : 'c'}
                onChange={(ev) => setResidencial(ev.target.value === 'r')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="r">Residencial (redutor social R$ 600/mês por imóvel)</option>
                <option value="c">Comercial/industrial (sem redutor social)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Tipo de locador</span>
              <select
                value={tipoLocador}
                onChange={(ev) => setTipoLocador(ev.target.value as 'pj' | 'pf')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pj">Pessoa jurídica (sempre contribuinte)</option>
                <option value="pf">Pessoa física (art. 251)</option>
              </select>
            </label>
          </>
        )}
      </div>

      {/* 0 — Enquadramento / obrigatoriedade (só locação) */}
      {!e && (
        <div>
          <BlocoH
            n="0"
            titulo="Enquadramento — obrigatoriedade de apurar IBS/CBS"
            capitulacao="art. 251, §§1º, 2º e 5º (LC 214/2025)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Receita de aluguéis no ano anterior (R$)
              </span>
              <input
                type="number"
                value={receitaAnterior}
                min={0}
                onChange={(ev) => setReceitaAnterior(Number(ev.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                IPCA acumulado desde 01/2025 (%)
              </span>
              <input
                type="number"
                value={ipcaLimite}
                min={0}
                onChange={(ev) => setIpcaLimite(Number(ev.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] text-slate-600">
              Limites atualizados (art. 251, §5º): <strong>{fmt(limite240)}</strong> (ano anterior)
              · <strong>{fmt(limite288)}</strong> (próprio ano, +20%)
            </div>
          </div>
          <div
            className={`p-3.5 rounded-lg border text-sm ${contribuinte ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${contribuinte ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}
              >
                {contribuinte
                  ? '⚠️ CONTRIBUINTE — apuração OBRIGATÓRIA'
                  : '✅ NÃO CONTRIBUINTE — sem IBS/CBS sobre aluguéis'}
              </span>
              <span className="text-xs font-mono">art. 251, LC 214/2025</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed">{motivoEnq}</p>
            <p className="mt-1 text-[11px] opacity-80">
              Locação residencial por até 90 dias segue regras de hotelaria (art. 253, redução de
              40%). Contratos por prazo determinado firmados até 16/01/2025 podem manter a regra
              atual até 31/12/2028 (art. 487).
            </p>
          </div>
        </div>
      )}

      {/* 1 — KPIs */}
      <div>
        <BlocoH n="1" titulo="Percentuais do cenário" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiA
            titulo="Alíquota de referência"
            valor={aliCheia.toFixed(2) + '%'}
            sub="CBS 8,8% (estimativa) + IBS 19,11%"
          />
          <KpiA
            titulo="Redução do art. 261"
            valor={e ? '−50%' : '−70%'}
            sub={e ? 'venda/alienação' : 'locação/arrendamento'}
          />
          <KpiA
            titulo="Alíquota efetiva"
            valor={aliEfetiva.toFixed(2) + '%'}
            sub={e ? '27,91% × 50%' : '27,91% × 30%'}
            destaque
          />
          <KpiA
            titulo="Carga sobre a receita"
            valor={((ibsCbs / receita) * 100).toFixed(2) + '%'}
            sub="IBS+CBS ÷ valor da operação"
          />
        </div>
      </div>

      {/* 2 — Base de cálculo demonstrada */}
      <div>
        <BlocoH
          n="2"
          titulo="Base de cálculo — passo a passo"
          capitulacao="art. 255 e ss. (LC 214/2025)"
        />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-4">Passo</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-3 w-52">Base legal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-400">1</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">
                  {e ? 'Valor da operação (venda)' : 'Receita mensal de aluguéis'}
                </td>
                <td className="py-2.5 px-4 text-slate-700 font-mono">{fmt(receita)}</td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  art. 255 (valor da operação)
                </td>
              </tr>
              {e && tipoVenda === 'usado' && (
                <tr className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    (−) Redutor de ajuste — custo de aquisição corrigido
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-mono">− {fmt(redutorAjuste)}</td>
                  <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                    arts. 257–258
                  </td>
                </tr>
              )}
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-400">
                  {e && tipoVenda === 'usado' ? '3' : '2'}
                </td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">(−) Redutor social</td>
                <td className="py-2.5 px-4 text-slate-700 font-mono">
                  − {fmt(redSocial)}
                  {redSocial > 0 && (
                    <div className="text-[11px] text-slate-500">
                      {e
                        ? tipoVenda === 'novo'
                          ? 'R$ 100 mil · imóvel residencial novo'
                          : 'R$ 30 mil · lote residencial'
                        : 'R$ 600/mês × ' + unidades + ' imóveis residenciais'}
                    </div>
                  )}
                  {redSocial === 0 && (
                    <div className="text-[11px] text-slate-500">não aplicável</div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  {e ? 'art. 259' : 'art. 260 (LC 227/2026)'}
                </td>
              </tr>
              <tr className="bg-panorama-gold/10">
                <td className="py-2.5 px-4 font-bold text-panorama-navy">=</td>
                <td className="py-2.5 px-4 font-bold text-slate-900">Base de cálculo efetiva</td>
                <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">{fmt(base)}</td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  art. 255, §4º–§5º (limites)
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="py-2.5 px-4 font-bold text-slate-400">×</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">
                  Alíquota efetiva ({aliCheia.toFixed(2)}% × {e ? '50%' : '30%'})
                </td>
                <td className="py-2.5 px-4 text-slate-700 font-mono">{aliEfetiva.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                  art. 261 {e ? '' : ', p.ú.'}
                </td>
              </tr>
              <tr className="bg-panorama-navy text-white">
                <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                <td className="py-2.5 px-4 font-bold">IBS + CBS a recolher</td>
                <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                  {fmt(ibsCbs)}
                </td>
                <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">arts. 252 e 261</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 — Faixa de imóveis (só locação) */}
      {!e && (
        <div>
          <BlocoH n="3" titulo="Faixa de imóveis — mínimo a máximo (1 a 12)" />
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                  <th className="py-3 px-3">Imóveis</th>
                  <th className="py-3 px-3">Receita mensal</th>
                  <th className="py-3 px-3">Receita anual</th>
                  <th className="py-3 px-3">Obrigado a apurar?</th>
                  <th className="py-3 px-3">Base (mês)</th>
                  <th className="py-3 px-3">IBS+CBS (mês)</th>
                  <th className="py-3 px-3">IBS+CBS (ano)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faixaImoveis.map((f) => (
                  <tr
                    key={f.n}
                    className={
                      'align-top ' +
                      (f.n === unidades
                        ? 'bg-panorama-gold/10 font-semibold'
                        : 'hover:bg-slate-50/70')
                    }
                  >
                    <td className="py-2.5 px-3 text-slate-900">
                      {f.n}
                      {f.n === unidades ? ' ←' : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">{fmt(f.rm)}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">{fmt(f.ra)}</td>
                    <td className="py-2.5 px-3">
                      <BadgeA ok={!f.enq} texto={f.enq ? 'Sim' : 'Não'} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">{fmt(f.b)}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">{fmt(f.t)}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">{fmt(f.tAno)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mínimo para obrigatoriedade (PF): <strong>{minEnq ?? '—'} imóveis</strong> nesta
            configuração (receita + mais de 3 imóveis, art. 251, §1º, I). Até{' '}
            <strong>{maxFora} imóveis</strong> não há obrigatoriedade (para PF). PJ é obrigado em
            qualquer quantidade.
          </p>
        </div>
      )}

      {/* 4 — Valores apurados (só locação) */}
      {!e && (
        <div>
          <BlocoH n="4" titulo="Valores apurados — compõem a obrigatoriedade?" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiA
              titulo="Receita anual apurada"
              valor={fmt(receitaAno)}
              sub={aluguel.toLocaleString('pt-BR') + ' × ' + unidades + ' imóveis × 12'}
            />
            <KpiA
              titulo="Base de cálculo anual"
              valor={fmt(baseLoc * 12)}
              sub={residencial ? 'após redutor social R$ 600/mês por imóvel' : 'sem redutor social'}
            />
            <KpiA
              titulo="IBS+CBS anual"
              valor={fmt(ibsCbsLocAno)}
              sub={aliLoc.toFixed(2) + '% sobre a base'}
              destaque
            />
            <div
              className={`rounded-xl border p-3.5 ${contribuinte ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}
            >
              <div
                className={`text-[11px] font-semibold uppercase tracking-wide ${contribuinte ? 'text-amber-700' : 'text-emerald-700'}`}
              >
                Obrigatoriedade
              </div>
              <div
                className={`mt-1 text-lg font-bold ${contribuinte ? 'text-amber-900' : 'text-emerald-900'}`}
              >
                {contribuinte ? 'Compõe' : 'Não compõe'}
              </div>
              <div
                className={`mt-0.5 text-[11px] ${contribuinte ? 'text-amber-800' : 'text-emerald-800'}`}
              >
                {contribuinte
                  ? 'valores dentro do regime regular — apuração obrigatória'
                  : 'valores fora do regime regular — sem apuração de IBS/CBS'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5 — Comparativo com hoje */}
      <div>
        <BlocoH n="5" titulo="Comparativo — reforma × tributação atual" />
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                <th className="py-3 px-4">Indicador</th>
                <th className="py-3 px-4">📅 Hoje (PIS/Cofins presumidos)</th>
                <th className="py-3 px-4">🔮 Reforma (IBS+CBS, regime específico)</th>
                <th className="py-3 px-3 w-40">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70 align-top bg-amber-50/40">
                <td className="py-3 px-4 font-semibold text-slate-900">Tributo sobre a operação</td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(atual)}
                  <div className="text-[11px] text-slate-500">PIS/Cofins 3,65% sobre a receita</div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(ibsCbs)}
                  <div className="text-[11px] text-slate-500">
                    {aliEfetiva.toFixed(2)}% sobre a base de {fmt(base)}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <BadgeA ok={dif <= 0} texto={(dif <= 0 ? '− ' : '+ ') + fmt(Math.abs(dif))} />
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 align-top">
                <td className="py-3 px-4 font-semibold text-slate-900">
                  Crédito do adquirente/locatário (regime regular)
                </td>
                <td className="py-3 px-4 text-slate-700">
                  —
                  <div className="text-[11px] text-slate-500">
                    PIS/Cofins presumido: sem crédito
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-700">
                  {fmt(ibsCbs)}
                  <div className="text-[11px] text-slate-500">
                    integral, se adquirente no regime regular
                  </div>
                </td>
                <td className="py-3 px-3">
                  <BadgeA ok texto={'+ ' + fmt(ibsCbs)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          IRPJ/CSLL presumidos continuam em ambos os cenários (fora do IBS/CBS) — não comparados
          aqui. Contratos de locação por prazo determinado firmados até 16/01/2025 podem manter a
          regra atual até 31/12/2028 (art. 487).
        </p>
      </div>

      {/* 6 — RET */}
      <div>
        <BlocoH
          n="6"
          titulo="Referência — RET da incorporação"
          capitulacao="art. 485 (LC 214/2025)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <KpiA
            titulo="RET — patrimônio de afetação"
            valor="2,08%"
            sub="da receita mensal recebida (IBS+CBS unificados)"
          />
          <KpiA
            titulo="RET especial — HIS"
            valor="0,53%"
            sub="habitação de interesse social (art. 485, II)"
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Opção para incorporação com patrimônio de afetação com pedido efetivado antes de
          01/01/2029; afasta redutores de ajuste e social na alienação decorrente da incorporação
          (art. 485, §3º).
        </p>
      </div>

      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
        ⚠️ A alíquota de referência da CBS 2027 ainda depende de resolução do Senado (LC 214, art.
        349). A CBS de 8,8% é estimativa de mercado (8,8% − 0,1 p.p. do art. 347) e o IBS de 19,11%
        deriva da referência total de 27,91% (Res. CGIBS 14/2026). O redutor de ajuste dos imóveis
        detidos em 31/12/2026 usa custo de aquisição corrigido ou, por opção, o valor de referência
        (art. 258, I) — aqui simulado pelo custo + IPCA informado. O limite de R$ 240 mil (art. 251,
        §5º) e os redutores sociais são atualizados mensalmente pelo IPCA desde 16/01/2025 — informe
        o IPCA acumulado para o valor vigente.
      </div>

      <BotaoEnviarSimulacao termo="venda de imóvel residencial novo" />

      <RodapeCapitulacao
        itens={[
          'lei|LC 214/2025 — arts. 251–263 (regime imobiliário)',
          'lei|LC 227/2026 — redutor social mensal (art. 260)',
          'decreto|Decreto 12.955/2026 — art. 382 (enquadramento)',
          'resolucao|Res. CGIBS 14/2026 — referência 27,91%',
        ]}
      />
    </div>
  )
}

function pfAnoAnoAnteriorFlag(v: boolean) {
  return v
}

export function SectionRegimeImobiliario() {
  const [tab, setTab] = useState<'operacoes' | 'ret' | 'permutas' | 'simulador'>('operacoes')

  return (
    <section id="regime-imobiliario" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6A
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Regime imobiliário — venda, locação, redutores e RET
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico das operações com bens imóveis (LC 214/2025, arts. 252–261 e 485–488).
          Texto extraído da{' '}
          <a
            href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            LC 214 compilada do Planalto
          </a>{' '}
          (conferido em 04/10/2026). Simulável no{' '}
          <a
            href={`${SIM_URL}?q=imobiliario`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            Simulador de Transição
          </a>{' '}
          (grupo 🏠 Imobiliário).
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['operacoes', 'Operações e reduções'],
            ['ret', 'RET — incorporação'],
            ['permutas', 'Permutas e não incidências'],
            ['simulador', '🧮 Simulador — venda e aluguel'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
              tab === k
                ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'operacoes' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 261):</strong> as alíquotas do IBS/CBS das operações deste
            capítulo ficam reduzidas em <strong>50%</strong>; locação, cessão onerosa e arrendamento
            ficam reduzidas em <strong>70%</strong>.
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-3 w-20">Redução</th>
                  <th className="py-3 px-4">Detalhe</th>
                  <th className="py-3 px-3 w-44">Base legal</th>
                  <th className="py-3 px-3 w-32">Simular</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {OPERACOES.map((o) => (
                  <tr key={o.titulo} className="hover:bg-slate-50/70 align-top">
                    <td className="py-3 px-4 font-semibold text-slate-900">{o.titulo}</td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {o.reducao}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 leading-relaxed">{o.detalhe}</td>
                    <td className="py-3 px-3 text-slate-600 text-xs font-mono">{o.base}</td>
                    <td className="py-3 px-3">
                      <a
                        href={`${SIM_URL}?q=${encodeURIComponent(o.sim)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark"
                      >
                        <Calculator className="w-3 h-3" /> Simular
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ <strong>Fato gerador (art. 254):</strong> na alienação, no ato do contrato (inclusive
            promessa com pagamento); na locação e intermediação, em <strong>cada pagamento</strong>.
          </div>
        </div>
      )}

      {tab === 'ret' && (
        <div className="space-y-3">
          {RET.map((r) => (
            <div
              key={r.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-panorama-gold-dark" /> {r.titulo}
                </h4>
                <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold bg-panorama-navy text-panorama-gold-light">
                  {r.aliquota}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{r.detalhe}</p>
              <p className="text-[11px] font-mono text-slate-500">{r.base}</p>
            </div>
          ))}
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ A opção pelo RET <strong>afasta</strong> qualquer outra forma de incidência de
            IBS/CBS sobre a incorporação (art. 485, §1º). Prazo: pedido efetivado{' '}
            <strong>antes de 01/01/2029</strong>.
          </div>
        </div>
      )}

      {tab === 'simulador' && <SimuladorImobiliario />}

      {tab === 'permutas' && (
        <div className="space-y-3">
          {PERMUTAS.map((p) => (
            <div
              key={p.titulo}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-panorama-gold-dark" /> {p.titulo}
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
              <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
