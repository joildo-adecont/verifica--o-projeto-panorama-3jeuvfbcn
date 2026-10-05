import { useEffect, useState } from 'react'
import { Calculator } from 'lucide-react'

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
  modos: { id: T; label: string; icone: string }[]
  modo: T
  setModo: (m: T) => void
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

function useModoTeclado<T extends string>(setModo: (m: T) => void, ids: T[]) {
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

/** Seção 6C — Consórcios (LC 214/2025, arts. 204–206).
 *  Layout de tabela uniformizado com a Seção 6A. */

const TAXA = [
  {
    titulo: 'Taxa de administração — regime de caixa',
    badge: 'Caixa',
    detalhe:
      'A base de cálculo compreende todas as tarifas, comissões e taxas, bem como encargos, multas e juros do contrato de participação, efetivamente pagos — regime de caixa (art. 204).',
    base: 'LC 214, art. 204',
  },
  {
    titulo: 'Dedução da intermediação',
    badge: 'Dedução',
    detalhe:
      'A administradora pode deduzir da base de cálculo os valores referentes aos serviços de intermediação (art. 204, §1º).',
    base: 'LC 214, art. 204, §1º',
  },
  {
    titulo: 'Crédito da taxa de administração',
    badge: 'Crédito',
    detalhe:
      'O contribuinte do regime regular que paga a taxa de administração apropria créditos do IBS/CBS com base nos valores pagos pelo fornecedor sobre esses serviços (art. 205).',
    base: 'LC 214, art. 205',
  },
  {
    titulo: 'Intermediação de consórcios',
    badge: 'Alíquota da taxa',
    detalhe:
      'Os serviços de intermediação de consórcios (corretoras etc.) sujeitam-se à incidência sobre o valor da operação pela mesma alíquota aplicável à taxa de administração (art. 206).',
    base: 'LC 214, art. 206',
  },
]

const CARTA = [
  {
    titulo: 'Uso da carta de crédito',
    badge: 'Normas gerais',
    detalhe:
      'A aquisição com carta de crédito segue as normas gerais de incidência — exceto imóvel (regime imobiliário) e bens/servios com regime diferenciado. A administradora NÃO responde pelos tributos da aquisição (art. 204, §2º).',
    base: 'LC 214, art. 204, §2º',
  },
  {
    titulo: 'Contemplação não é fato gerador',
    badge: 'Sem FG',
    detalhe:
      'O tributo é devido apenas na aquisição do bem com a carta — o sorteio ou lance em si não gera fato gerador (consequência do regime de caixa da taxa).',
    base: 'LC 214, art. 204 (sistemática)',
  },
]

const GARANTIAS = [
  {
    titulo: 'Execução de garantia fiduciária',
    badge: 'Sem incidência',
    detalhe:
      'A consolidação da propriedade do bem pelo grupo NÃO sofre incidência (art. 204, §3º, I). Na alienação pelo grupo: sem incidência se o consorciado não for contribuinte; com incidência nas mesmas regras do consorciado, se contribuinte (§3º, II). O adquirente recebe as mesmas regras (§3º, III).',
    base: 'LC 214, art. 204, §3º',
  },
]

function AbaButton({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
        ativo
          ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function Tabela({
  linhas,
}: {
  linhas: { titulo: string; badge: string; detalhe: string; base: string; sim?: string }[]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
            <th className="py-3 px-4">Operação</th>
            <th className="py-3 px-3 w-32">Redução</th>
            <th className="py-3 px-4">Detalhe</th>
            <th className="py-3 px-3 w-44">Base legal</th>
            <th className="py-3 px-3 w-24">Simular</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {linhas.map((o) => (
            <tr key={o.titulo} className="hover:bg-slate-50/70 align-top">
              <td className="py-3 px-4 font-semibold text-slate-900">{o.titulo}</td>
              <td className="py-3 px-3">
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {o.badge}
                </span>
              </td>
              <td className="py-3 px-4 text-slate-700 leading-relaxed">{o.detalhe}</td>
              <td className="py-3 px-3 text-slate-600 text-xs font-mono">{o.base}</td>
              <td className="py-3 px-3">
                {o.sim ? (
                  <a
                    href={`${SIM_URL}?q=${encodeURIComponent(o.sim)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark"
                  >
                    <Calculator className="w-3 h-3" /> Simular
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const REF_TOTAL = 27.91

function fmtC(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

function KpiC({
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

function BadgeC({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
    >
      {ok ? '✓' : '⚠'} {texto}
    </span>
  )
}

function SimuladorConsorcio() {
  const [modo, setModo] = useState<'taxa' | 'carta' | 'garantia' | 'apuracao'>('taxa')
  useModoTeclado(setModo, ['taxa', 'carta', 'garantia', 'apuracao'] as const)
  // Taxa / lances
  const [credito, setCredito] = useState(100000)
  const [prazo, setPrazo] = useState(60)
  const [taxaAdm, setTaxaAdm] = useState(18)
  const [fundoReserva, setFundoReserva] = useState(2)
  const [seguro, setSeguro] = useState(1.5)
  const [lance, setLance] = useState(30)
  const [intermediacao, setIntermediacao] = useState(0)
  const [ipcaRef, setIpcaRef] = useState(5)
  // Carta
  const [tipoBem, setTipoBem] = useState<'movel' | 'imovel' | 'servico'>('movel')
  const [consorciadoContribuinte, setConsorciadoContribuinte] = useState(true)
  // Garantia
  const [executou, setExecutou] = useState(false)
  const [alienou, setAlienou] = useState(false)
  const [valorAlienacao, setValorAlienacao] = useState(80000)
  // Apuração
  const [tipoContribuinte, setTipoContribuinte] = useState<'pf' | 'pj-regular' | 'pj-simples'>(
    'pj-regular',
  )

  const aliCheia = REF_TOTAL
  const cbsRef = 8.8
  const ibsRef = REF_TOTAL - cbsRef

  // ---------- TAXA / LANCES (art. 204) ----------
  const admMes = (credito * taxaAdm) / 100 / prazo
  const frMes = (credito * fundoReserva) / 100 / prazo
  const segMes = (credito * seguro) / 100 / prazo
  const parcela = admMes + frMes + segMes
  const lanceValor = (credito * lance) / 100
  const baseAdmMes = admMes - intermediacao
  const ibsCbsAdmMes = (baseAdmMes * aliCheia) / 100
  const ibsCbsAdmAno = ibsCbsAdmMes * 12
  const totalTaxasAno = parcela * 12
  const tabelaLances = [0, 10, 20, 30, 40, 50].map((l) => {
    const vl = (credito * l) / 100
    const saldo = credito - vl
    const admLance = (saldo * taxaAdm) / 100 / prazo
    const baseL = admLance - intermediacao
    const t = (baseL * aliCheia) / 100
    return { l, vl, saldo, admLance, t, tAno: t * 12 }
  })

  // ---------- CARTA (art. 204, §2º) ----------
  const cartaLinhas = [
    {
      bem: 'Bem móvel (veículo, máquina etc.)',
      regime: 'Normas gerais de incidência (Título I) — tributado na aquisição',
      resp: 'Consorciado (a administradora NÃO responde)',
      base: 'art. 204, §2º',
      trib: true,
    },
    {
      bem: 'Bem imóvel',
      regime: 'Regime específico dos bens imóveis (Seção 6A)',
      resp: 'Consorciado',
      base: 'art. 204, §2º; arts. 251–263',
      trib: true,
    },
    {
      bem: 'Bem/serviço com regime diferenciado ou específico',
      regime: 'Segue o regime próprio (agro, financeiros, profissional regulamentado etc.)',
      resp: 'Consorciado',
      base: 'art. 204, §2º',
      trib: true,
    },
    {
      bem: 'Contemplação (sorteio ou lance)',
      regime: 'NÃO é fato gerador — o tributo é devido apenas na aquisição do bem com a carta',
      resp: '—',
      base: 'art. 204 (regime de caixa)',
      trib: false,
    },
    {
      bem: 'Quotas pagas ao grupo (parcelas de crédito)',
      regime:
        'Sem incidência — o consorciado paga o crédito ao grupo, não é fornecimento tributável',
      resp: '—',
      base: 'art. 204 (sistemática)',
      trib: false,
    },
  ]

  // ---------- GARANTIA (art. 204, §3º) ----------
  const consolidacaoTrib = false
  const alienacaoTrib = consorciadoContribuinte
  const ibsCbsAlienacao = alienou ? (valorAlienacao * aliCheia) / 100 : 0
  const garantiaLinhas = [
    {
      evento: 'Consolidação da propriedade do bem pelo grupo',
      efeito: 'SEM incidência de IBS/CBS',
      base: 'art. 204, §3º, I',
      trib: consolidacaoTrib,
    },
    {
      evento: 'Alienação do bem pelo grupo — consorciado NÃO contribuinte',
      efeito: 'SEM incidência de IBS/CBS',
      base: 'art. 204, §3º, II, a',
      trib: false,
    },
    {
      evento: 'Alienação do bem pelo grupo — consorciado CONTRIBUINTE',
      efeito: 'COM incidência — mesmas regras que seriam aplicáveis ao consorciado',
      base: 'art. 204, §3º, II, b',
      trib: true,
    },
    {
      evento: 'Adquirente do bem alienado pelo grupo',
      efeito: 'Mesmas regras que teria se comprasse do consorciado (crédito, quando cabível)',
      base: 'art. 204, §3º, III',
      trib: true,
    },
    {
      evento: 'Remuneração da administradora pelo serviço de execução',
      efeito:
        'COM incidência — a administradora tributa o serviço (não responde pelos tributos do consorciado)',
      base: 'art. 204, §3º, IV',
      trib: true,
    },
  ]

  // ---------- APURAÇÃO ----------
  const contribuinteApura = tipoContribuinte !== 'pf'
  const apuracaoLinhas = [
    {
      quem: 'Administradora do consórcio',
      oque: 'Taxa de administração + encargos, multas e juros efetivamente pagos (regime de caixa), deduzida a intermediação',
      como: 'Regime regular — alíquota de referência (27,91%) sobre a base de caixa',
      base: 'arts. 182, VII, 204 e 206',
    },
    {
      quem: 'Intermediadora de consórcios',
      oque: 'Comissão de intermediação',
      como: 'Mesma alíquota da taxa de administração; se optante pelo Simples, permanece no Simples (ou opta pelo regular)',
      base: 'art. 206, caput e §1º',
    },
    {
      quem: 'Consorciado PJ do regime regular',
      oque: 'Aquisição do bem com a carta de crédito',
      como: 'Normas gerais (ou regime específico do bem); apropria crédito da taxa de administração paga (art. 205) e da intermediação, se identificada (art. 206, §2º)',
      base: 'arts. 204, §2º, 205 e 206, §2º',
    },
    {
      quem: 'Consorciado PF (não contribuinte)',
      oque: 'Aquisição do bem com a carta',
      como: 'Sem crédito; paga o IBS/CBS embutido no preço do bem (regra do consumidor final)',
      base: 'arts. 4º e 204, §2º',
    },
    {
      quem: 'Consorciado optante pelo Simples',
      oque: 'Aquisição do bem com a carta',
      como: 'Segue as regras do Simples; crédito conforme o regime (limitado no DAS, integral no regular — art. 47 §9º)',
      base: 'LC 123, art. 13-A; LC 214, art. 41, §3º',
    },
    {
      quem: 'Grupo de consórcio (execução de garantia)',
      oque: 'Consolidação e alienação do bem retomado',
      como: 'Consolidação sem incidência; alienação conforme a condição do consorciado',
      base: 'art. 204, §3º',
    },
  ]
  const creditoTaxaAno = ibsCbsAdmAno

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador de Consórcios"
        sub="A administradora tributa APENAS a taxa de administração — regime de caixa (tarifas, comissões, taxas, encargos, multas e juros efetivamente pagos), deduzida a intermediação (§1º). Contemplação (sorteio ou lance) NÃO é fato gerador. Aquisição com carta segue o regime do bem — administradora não responde (§2º). Garantia: consolidação sem incidência; alienação segue a condição do consorciado (§3º)."
        teclas="Alt+1 Taxa & lances · Alt+2 Carta · Alt+3 Garantia · Alt+4 Apuração"
        capitulacao="LEI LC 214/2025, arts. 204–206 · RESOLUÇÃO CGIBS 14/2026 (ref. 27,91%) · RIBS Res. CGIBS 6/2026 (regulamentação)"
      />

      <ModoChips
        modos={[
          { id: 'taxa', label: 'Taxa & lances', icone: '💰' },
          { id: 'carta', label: 'Carta de crédito', icone: '🧾' },
          { id: 'garantia', label: 'Garantia fiduciária', icone: '⚖️' },
          { id: 'apuracao', label: 'Apuração & créditos/débitos', icone: '📊' },
        ]}
        modo={modo}
        setModo={setModo}
      />

      {modo === 'taxa' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Valor da carta de crédito (R$)
              </span>
              <input
                type="number"
                value={credito}
                min={0}
                onChange={(e) => setCredito(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Prazo do grupo (meses)</span>
              <input
                type="number"
                value={prazo}
                min={1}
                onChange={(e) => setPrazo(Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Taxa de administração (%)
              </span>
              <input
                type="number"
                value={taxaAdm}
                min={0}
                onChange={(e) => setTaxaAdm(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Fundo de reserva (%)</span>
              <input
                type="number"
                value={fundoReserva}
                min={0}
                onChange={(e) => setFundoReserva(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Seguro (%)</span>
              <input
                type="number"
                value={seguro}
                min={0}
                onChange={(e) => setSeguro(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Lance ofertado (% do crédito)
              </span>
              <input
                type="number"
                value={lance}
                min={0}
                max={100}
                onChange={(e) => setLance(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Comissão de intermediação (R$/mês, dedutível)
              </span>
              <input
                type="number"
                value={intermediacao}
                min={0}
                onChange={(e) => setIntermediacao(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                IPCA acumulado desde 01/2025 (%)
              </span>
              <input
                type="number"
                value={ipcaRef}
                min={0}
                onChange={(e) => setIpcaRef(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais e valores do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiC
                titulo="Parcela mensal total"
                valor={fmtC(parcela)}
                sub="taxa + FR + seguro (÷ prazo)"
              />
              <KpiC
                titulo="Base de cálculo mensal (adm.)"
                valor={fmtC(baseAdmMes)}
                sub="taxa − intermediação dedutível (art. 204, §1º)"
              />
              <KpiC
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiC
                titulo="IBS+CBS sobre a taxa (mês)"
                valor={fmtC(ibsCbsAdmMes)}
                sub={`${fmtC(ibsCbsAdmAno)}/ano`}
                destaque
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Base de cálculo — passo a passo"
              capitulacao="art. 204, caput e §1º"
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
                      Taxa de administração mensal (sobre o crédito ÷ prazo)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmtC(admMes)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204, caput
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Fundo de reserva + seguro (não são base da adm., mas tarifas do contrato)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmtC(frMes + segMes)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204, caput (tarifas/taxas)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">3</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      (−) Dedução da intermediação
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">
                      − {fmtC(intermediacao)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204, §1º
                    </td>
                  </tr>
                  <tr className="bg-panorama-gold/10">
                    <td className="py-2.5 px-4 font-bold text-panorama-navy">=</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Base de cálculo mensal</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                      {fmtC(baseAdmMes)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204, caput e §1º
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">×</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Alíquota de referência (regime regular)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{aliCheia.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      Res. CGIBS 14/2026
                    </td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">IBS + CBS sobre a taxa (mensal)</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {fmtC(ibsCbsAdmMes)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">
                      arts. 182, VII e 204
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Efeito dos lances — quanto maior o lance, menor a taxa (e o tributo)"
              capitulacao="art. 204, caput (regime de caixa)"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Lance (% do crédito)</th>
                    <th className="py-3 px-3">Valor do lance</th>
                    <th className="py-3 px-3">Saldo a pagar ao grupo</th>
                    <th className="py-3 px-3">Taxa adm. mensal</th>
                    <th className="py-3 px-3">IBS+CBS (mês)</th>
                    <th className="py-3 px-3">IBS+CBS (ano)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tabelaLances.map((f) => (
                    <tr
                      key={f.l}
                      className={
                        'align-top ' +
                        (f.l === lance
                          ? 'bg-panorama-gold/10 font-semibold'
                          : 'hover:bg-slate-50/70')
                      }
                    >
                      <td className="py-2.5 px-3 text-slate-900">
                        {f.l}%{f.l === lance ? ' ←' : ''}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtC(f.vl)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtC(f.saldo)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtC(f.admLance)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtC(f.t)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtC(f.tAno)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              O lance em si <strong>não gera fato gerador</strong> — o IBS/CBS incide sobre a taxa
              efetivamente paga (regime de caixa, art. 204). Lance antecipado reduz o saldo
              financiado e, com ele, a taxa mensal e o tributo. Encargos, multas e juros pagos pelo
              consorciado <strong>integram a base</strong> (art. 204, caput).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ O que o consorciado paga e o que é tributado: <strong>taxa de administração</strong>{' '}
            — tributada na administradora (regime de caixa);{' '}
            <strong>fundo de reserva e seguro</strong> — tarifas do contrato (a tributação segue a
            natureza de cada prestador); <strong>parcelas de crédito</strong> — sem incidência (não
            é fornecimento); <strong>encargos, multas e juros</strong> — integram a base quando
            efetivamente pagos (art. 204, caput). A contemplação (sorteio ou lance) não é fato
            gerador.
          </div>
        </>
      )}

      {modo === 'carta' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Tipo de bem/serviço adquirido com a carta
              </span>
              <select
                value={tipoBem}
                onChange={(e) => setTipoBem(e.target.value as 'movel' | 'imovel' | 'servico')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="movel">Bem móvel (veículo, máquina, equipamento)</option>
                <option value="imovel">Bem imóvel</option>
                <option value="servico">Serviço / outro bem com regime específico</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                O consorciado é contribuinte do IBS/CBS?
              </span>
              <select
                value={consorciadoContribuinte ? 's' : 'n'}
                onChange={(e) => setConsorciadoContribuinte(e.target.value === 's')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="s">Sim — PJ do regime regular (ou PF enquadrada)</option>
                <option value="n">Não — PF consumidora final</option>
              </select>
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiC
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiC
                titulo="Regime aplicável à aquisição"
                valor={
                  tipoBem === 'imovel'
                    ? 'Imobiliário'
                    : tipoBem === 'servico'
                      ? 'Específico do bem'
                      : 'Normas gerais'
                }
                sub="art. 204, §2º"
                destaque
              />
              <KpiC
                titulo="Responsável pelo tributo"
                valor="Consorciado"
                sub="administradora NÃO responde (art. 204, §2º)"
              />
              <KpiC
                titulo="Crédito para o consorciado"
                valor={consorciadoContribuinte ? 'Integral' : 'Sem crédito'}
                sub={
                  consorciadoContribuinte
                    ? 'contribuinte do regime regular'
                    : 'consumidor final — IBS/CBS embutido no preço'
                }
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ O que acontece com a carta de crédito — mapa completo"
              capitulacao="art. 204, §2º"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Evento / operação</th>
                    <th className="py-3 px-3">Regime e efeito</th>
                    <th className="py-3 px-3">Tributado?</th>
                    <th className="py-3 px-3">Quem responde</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartaLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.bem}</td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.regime}</td>
                      <td className="py-2.5 px-3">
                        <BadgeC ok={!l.trib} texto={l.trib ? 'Sim' : 'Não'} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{l.resp}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ <strong>Isenções/não incidências do consórcio:</strong> a contemplação (sorteio ou
            lance) não é fato gerador; as parcelas de crédito pagas ao grupo não são fornecimento
            tributável; a administradora não responde pelos tributos da aquisição com a carta (art.
            204, §2º). O tributo da aquisição é o mesmo que o consorciado pagaria comprando
            diretamente.
          </div>
        </>
      )}

      {modo === 'garantia' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={executou}
                onChange={(e) => setExecutou(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Grupo executou a garantia (inadimplência)
              </span>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={alienou}
                onChange={(e) => setAlienou(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Grupo alienou o bem retomado
              </span>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Valor da alienação (R$)</span>
              <input
                type="number"
                value={valorAlienacao}
                min={0}
                onChange={(e) => setValorAlienacao(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais e valores do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiC
                titulo="Consolidação da propriedade"
                valor="Sem incidência"
                sub="art. 204, §3º, I"
              />
              <KpiC
                titulo="Alienação pelo grupo"
                valor={consorciadoContribuinte ? 'Com incidência' : 'Sem incidência'}
                sub={
                  consorciadoContribuinte
                    ? 'consorciado contribuinte — regras dele (§3º, II, b)'
                    : 'consorciado não contribuinte (§3º, II, a)'
                }
                destaque
              />
              <KpiC
                titulo="IBS+CBS na alienação"
                valor={fmtC(ibsCbsAlienacao)}
                sub={aliCheia.toFixed(2) + '% sobre ' + fmtC(valorAlienacao)}
              />
              <KpiC
                titulo="Remuneração da administradora"
                valor="Com incidência"
                sub="serviço de execução — §3º, IV"
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Execução de garantia — mapa completo"
              capitulacao="art. 204, §3º"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Evento</th>
                    <th className="py-3 px-3">Efeito tributário</th>
                    <th className="py-3 px-3">Incidência?</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {garantiaLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.evento}</td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.efeito}</td>
                      <td className="py-2.5 px-3">
                        <BadgeC ok={!l.trib} texto={l.trib ? 'Sim' : 'Não'} />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ A administradora <strong>tributa o próprio serviço</strong> de execução da garantia
            (§3º, IV) e <strong>não responde</strong> pelos tributos devidos pelo consorciado na
            alienação (§3º, II, b). O adquirente do bem retomado recebe as mesmas regras que teria
            comprando do consorciado (§3º, III) — inclusive o crédito, quando cabível.
          </div>
        </>
      )}

      {modo === 'apuracao' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Perfil do consorciado</span>
              <select
                value={tipoContribuinte}
                onChange={(e) =>
                  setTipoContribuinte(e.target.value as 'pf' | 'pj-regular' | 'pj-simples')
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pj-regular">PJ do regime regular</option>
                <option value="pj-simples">PJ optante pelo Simples Nacional</option>
                <option value="pf">Pessoa física (consumidora final)</option>
              </select>
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiC
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiC
                titulo="Crédito da taxa de administração (ano)"
                valor={tipoContribuinte === 'pj-regular' ? fmtC(creditoTaxaAno) : '—'}
                sub={
                  tipoContribuinte === 'pj-regular'
                    ? 'art. 205 — valores pagos pelo fornecedor'
                    : 'sem crédito (PF/Simples)'
                }
                destaque
              />
              <KpiC
                titulo="Crédito da intermediação"
                valor={tipoContribuinte === 'pj-regular' ? 'Sim, se identificada' : '—'}
                sub="art. 206, §2º — fornecedor identifica o adquirente"
              />
              <KpiC
                titulo="Débito do consorciado"
                valor={tipoContribuinte === 'pf' ? 'Embutido no preço' : 'Na aquisição do bem'}
                sub="art. 204, §2º — administradora não responde"
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Quem apura o quê — consorciado × consórcio"
              capitulacao="arts. 182, VII, 204–206"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Contribuinte</th>
                    <th className="py-3 px-3">Fato gerador</th>
                    <th className="py-3 px-3">Como apura</th>
                    <th className="py-3 px-3 w-48">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apuracaoLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.quem}</td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.oque}</td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.como}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Créditos e débitos da atividade — quem credita, quem debita"
              capitulacao="arts. 204–206"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Operação</th>
                    <th className="py-3 px-3">Débito (quem recolhe)</th>
                    <th className="py-3 px-3">Crédito (quem apropria)</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      Taxa de administração paga pelo consorciado
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Administradora (regime de caixa, base deduzida da intermediação)
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Consorciado do regime regular — crédito com base nos valores pagos pelo
                      fornecedor (art. 205)
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      arts. 204 e 205
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      Comissão de intermediação
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Intermediadora — mesma alíquota da taxa (art. 206); Simples permanece no
                      Simples
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Adquirente do regime regular, se o fornecedor identificar o destinatário (art.
                      206, §2º)
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">art. 206</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      Aquisição do bem com a carta de crédito
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Fornecedor do bem (normas gerais ou regime específico do bem)
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Consorciado contribuinte — crédito integral; PF consumidora final: sem crédito
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204, §2º
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      Alienação do bem retomado (garantia)
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Consorciado contribuinte (regras dele) — administradora só tributa o serviço
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Adquirente, nas mesmas regras de compra direta do consorciado (§3º, III)
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204, §3º
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70 align-top">
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">
                      Parcelas de crédito e contemplação
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">Nenhum — sem fato gerador</td>
                    <td className="py-2.5 px-3 text-slate-700">—</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 204 (sistemática)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️{' '}
            <strong>
              Pontos que dependem das próximas edições legislativas (monitorados na rotina semanal
              de fontes oficiais):
            </strong>{' '}
            (1) a alíquota de referência da CBS 2027 depende de resolução do Senado (LC 214, art.
            349) — hoje 8,8% é estimativa (8,8% − 0,1 p.p. do art. 347); (2) o IBS de 19,11% deriva
            da referência total de 27,91% (Res. CGIBS 14/2026) e será ajustado pelos entes; (3) a
            dedução da intermediação (art. 204, §1º) e a identificação do adquirente para o crédito
            (art. 206, §2º) dependem de regulamento (RIBS — Res. CGIBS 6/2026); (4) novos atos do
            CGIBS e da RFB podem alterar leiautes de documento fiscal e a forma de apuração.
            Qualquer mudança entra na Seção 13 — Histórico de Atualizações.
          </div>

          <RodapeCapitulacao
            itens={[
              'lei|LC 214/2025 — arts. 204–206 (consórcios)',
              'resolucao|Res. CGIBS 14/2026 — referência 27,91%',
              'resolucao|RIBS Res. CGIBS 6/2026 — regulamentação',
              'ref|CBS 2027 — pendente de resolução do Senado',
            ]}
          />
        </>
      )}
    </div>
  )
}

export function SectionConsorcios() {
  const [tab, setTab] = useState<'taxa' | 'carta' | 'garantias' | 'simulador'>('taxa')

  return (
    <section id="consorcios" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6C
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Consórcios — taxa de administração, carta de crédito e garantias
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico da administração de consórcios (LC 214/2025, arts. 204–206). Texto
          extraído da{' '}
          <a
            href="https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            LC 214 compilada do Planalto
          </a>{' '}
          (conferido em 04/10/2026).
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'taxa'} onClick={() => setTab('taxa')}>
          🤝 Taxa de administração
        </AbaButton>
        <AbaButton ativo={tab === 'carta'} onClick={() => setTab('carta')}>
          💳 Carta de crédito
        </AbaButton>
        <AbaButton ativo={tab === 'garantias'} onClick={() => setTab('garantias')}>
          🛡️ Garantias
        </AbaButton>
        <AbaButton ativo={tab === 'simulador'} onClick={() => setTab('simulador')}>
          🧮 Simulador de consórcios
        </AbaButton>
      </div>

      {tab === 'taxa' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 204):</strong> a administradora tributa apenas a{' '}
            <strong>taxa de administração</strong>, em regime de caixa — a contemplação não é fato
            gerador.
          </div>
          <Tabela linhas={TAXA} />
        </div>
      )}

      {tab === 'carta' && (
        <div className="space-y-3">
          <Tabela linhas={CARTA} />
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ Imóvel adquirido com carta segue o{' '}
            <a href="#regime-imobiliario" className="underline font-semibold">
              regime imobiliário (6A)
            </a>
            ; bens com regime diferenciado seguem o respectivo capítulo.
          </div>
        </div>
      )}

      {tab === 'garantias' && (
        <div className="space-y-3">
          <Tabela linhas={GARANTIAS} />
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ A consolidação da propriedade em favor do grupo (garantia fiduciária) não é fato
            gerador — a incidência só ocorre na alienação posterior, nas regras do consorciado.
          </div>
        </div>
      )}

      {tab === 'simulador' && <SimuladorConsorcio />}
    </section>
  )
}
