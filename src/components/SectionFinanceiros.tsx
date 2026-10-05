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

function useModoTeclado<T extends string>(setModo: (m: T) => void, ids: readonly T[]) {
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

/** Seção 6D — Serviços Financeiros (LC 214/2025, arts. 182–214).
 *  Layout de tabela uniformizado com a Seção 6A. */

const LISTA = [
  'Operações de crédito (captação, repasse, adiantamento, empréstimo, financiamento, desconto de títulos, garantias)',
  'Operações de câmbio',
  'Operações com títulos e valores mobiliários (custódia, corretagem, intermediação, assessor de investimento)',
  'Securitização',
  'Faturização (factoring)',
  'Arrendamento mercantil (leasing), operacional ou financeiro',
  'Administração de consórcio',
  'Gestão e administração de recursos e fundos de investimento',
  'Arranjos de pagamento (instituidores, instituições de pagamento, liquidação antecipada de recebíveis, fidelização)',
  'Entidades administradoras de mercados organizados e depositárias centrais',
  'Operações de seguros (exceto seguros de saúde)',
  'Resseguros',
  'Previdência privada (aberta e fechada)',
  'Capitalização',
  'Intermediação de consórcios, seguros, resseguros, previdência e capitalização',
  'Serviços de ativos virtuais (cripto)',
  'Proteção patrimonial mutualista (LC 227/2026)',
]

const REGRAS = [
  {
    titulo: 'Base de cálculo: receitas com deduções',
    badge: 'Receitas',
    detalhe:
      'A base é composta das receitas das operações, com as deduções previstas no capítulo (art. 185). Aplica-se à totalidade da contraprestação, independentemente do local da operação (art. 182, p.ú.).',
    base: 'LC 214, arts. 182, p.ú. e 185',
  },
  {
    titulo: 'Deduções nas operações de crédito, câmbio e títulos',
    badge: 'Deduções',
    detalhe:
      'Deduzem-se: despesas financeiras de captação; despesas de câmbio; perdas com títulos; encargos financeiros de instrumentos de dívida; perdas na recebibilidade de créditos (regras do IR); despesas com assessores/consultores não empregados (art. 192).',
    base: 'LC 214, art. 192',
  },
  {
    titulo: 'Quem está sujeito',
    badge: 'Sujeitos',
    detalhe:
      'Pessoas físicas e jurídicas supervisionadas pelo Banco Central, CVM, Previc ou SUSEP (art. 183) — bancos, seguradoras, administradoras de consórcio, corretoras etc.',
    base: 'LC 214, art. 183',
  },
  {
    titulo: 'Arranjos de pagamento',
    badge: 'Art. 214',
    detalhe:
      'Credenciamento, captura, processamento e liquidação de transações, taxa de desconto, locação de terminais e softwares (art. 214). A relação emissor↔portador segue normas gerais, salvo crédito (art. 214, §2º).',
    base: 'LC 214, art. 214',
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

function fmtF(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

function KpiF({
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

function BadgeF({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'}`}
    >
      {ok ? '✓' : '⚠'} {texto}
    </span>
  )
}

function SimuladorFinanceiro() {
  const [modo, setModo] = useState<'credito' | 'tarifas' | 'sujeitos' | 'obrigacoes'>('credito')
  useModoTeclado(setModo, ['credito', 'tarifas', 'sujeitos', 'obrigacoes'] as const)
  // Empréstimo (art. 194)
  const [principal, setPrincipal] = useState(100000)
  const [parcelas, setParcelas] = useState(12)
  const [jurosMes, setJurosMes] = useState(2)
  const [selicAno, setSelicAno] = useState(10)
  const [tomadorRegular, setTomadorRegular] = useState(true)
  // Tarifas (art. 198)
  const [tarifaAbertura, setTarifaAbertura] = useState(50)
  const [tarifaManutencao, setTarifaManutencao] = useState(25)
  const [contas, setContas] = useState(500)
  const [saquesMes, setSaquesMes] = useState(3)
  const [valorSaque, setValorSaque] = useState(8)
  const [transferencias, setTransferencias] = useState(5)
  const [valorTransferencia, setValorTransferencia] = useState(12)
  // Sujeitos
  const [tipoInstituicao, setTipoInstituicao] = useState<'banco' | 'pagamento' | 'outra'>('banco')

  const aliCheia = REF_TOTAL
  const cbsRef = 8.8
  const ibsRef = REF_TOTAL - cbsRef

  // ---------- CRÉDITO (arts. 194/192) ----------
  const parcela = (principal * (jurosMes / 100)) / (1 - Math.pow(1 + jurosMes / 100, -parcelas))
  const totalPago = parcela * parcelas
  const jurosTotal = totalPago - principal
  const selicMes = Math.pow(1 + selicAno / 100, 1 / 12) - 1
  const selicTotal = principal * (Math.pow(1 + selicMes, parcelas) - 1)
  const despesaFinanceira = Math.max(0, jurosTotal - selicTotal)
  const creditoTomador = tomadorRegular ? (despesaFinanceira * aliCheia) / 100 : 0
  const baseBanco = jurosTotal
  const ibsCbsBanco = (baseBanco * aliCheia) / 100
  const custoLiquido = totalPago - creditoTomador
  const tabelaParcelas = Array.from({ length: Math.min(parcelas, 6) }, (_, k) => {
    const saldo = principal * (1 - k / parcelas) * (1 + jurosMes / 100)
    const jurosP = saldo * (jurosMes / 100)
    const selicP = principal * (Math.pow(1 + selicMes, k + 1) - Math.pow(1 + selicMes, k))
    const despP = Math.max(0, jurosP - selicP)
    const credP = tomadorRegular ? (despP * aliCheia) / 100 : 0
    return { n: k + 1, parcela, jurosP, selicP, despP, credP, liquido: parcela - credP }
  })

  // ---------- TARIFAS (arts. 184/198) ----------
  const receitaTarifasMes =
    contas * (tarifaAbertura / 12 + tarifaManutencao) +
    saquesMes * valorSaque +
    transferencias * valorTransferencia
  const regimeTarifas = tipoInstituicao === 'banco' || tipoInstituicao === 'pagamento'
  const ibsCbsTarifas = (receitaTarifasMes * aliCheia) / 100
  const creditoCorrentistaPJ = (receitaTarifasMes * aliCheia) / 100
  const tarifasLinhas = [
    {
      tarifa: 'Abertura de conta (corrente/poupança)',
      quem: 'Só instituições financeiras bancárias',
      regime: 'Normas gerais (Título I)',
      base: 'art. 184, caput',
    },
    {
      tarifa: 'Manutenção de conta (corrente/poupança)',
      quem: 'Só instituições financeiras bancárias',
      regime: 'Normas gerais (Título I)',
      base: 'art. 184, caput',
    },
    {
      tarifa: 'Encerramento de conta',
      quem: 'Só instituições financeiras bancárias',
      regime: 'Normas gerais (Título I)',
      base: 'art. 184, caput',
    },
    {
      tarifa: 'Fornecimento de cheques',
      quem: 'Só instituições financeiras bancárias',
      regime: 'Normas gerais (Título I)',
      base: 'art. 184, caput',
    },
    {
      tarifa: 'Saque e transferência de valores',
      quem: 'Só instituições financeiras bancárias',
      regime: 'Normas gerais (Título I)',
      base: 'art. 184, caput',
    },
    {
      tarifa: 'Manutenção/encerramento de conta de pagamento (pré/pós-paga)',
      quem: 'Instituições de pagamento',
      regime: 'Normas gerais (Título I)',
      base: 'art. 184, §2º',
    },
    {
      tarifa: 'Taxa de desconto / credenciamento / captura / liquidação',
      quem: 'Arranjos de pagamento',
      regime: 'Regime específico — base = remuneração bruta recebida',
      base: 'art. 214, §§1º e 3º',
    },
    {
      tarifa: 'Locação de terminais e software do arranjo',
      quem: 'Arranjos de pagamento',
      regime: 'Regime específico',
      base: 'art. 214, §1º, II',
    },
  ]

  // ---------- SUJEITOS ----------
  const sujeitosLinhas = [
    {
      papel: 'Bancos de qualquer espécie e caixas econômicas',
      tipo: 'Sujeitos ao regime específico (arts. 182–214) para crédito, câmbio, títulos, leasing, consórcio, fundos',
      tarifas: 'Tarifas de conta/saque/transferência seguem as NORMAS GERAIS (art. 184)',
      base: 'arts. 183, §1º, I-II e 184',
    },
    {
      papel: 'Cooperativas de crédito',
      tipo: 'Regime específico; podem optar pelo art. 271 (zero associado↔coop) com reversão proporcional das deduções',
      tarifas: '—',
      base: 'arts. 183, §1º, III e 188',
    },
    {
      papel: 'Corretoras de câmbio e de valores, distribuidoras',
      tipo: 'Regime específico (câmbio e títulos — art. 192)',
      tarifas: '—',
      base: 'arts. 183, §1º, IV-VI e 192',
    },
    {
      papel: 'Administradoras/gestoras de carteiras e fundos, assessores e consultores',
      tipo: 'Regime específico (gestão de recursos)',
      tarifas: '—',
      base: 'arts. 183, §1º, VII-IX',
    },
    {
      papel: 'Correspondentes registrados no Bacen',
      tipo: 'Regime específico; despesas com eles são dedutíveis da base do contratante (art. 192, VI)',
      tarifas: '—',
      base: 'arts. 183, §1º, X e 192, VI',
    },
    {
      papel: 'Administradoras de consórcio e intermediárias',
      tipo: 'Regime específico do consórcio (Seção 6C)',
      tarifas: '—',
      base: 'arts. 183, §1º, XI-XII e 204-206',
    },
    {
      papel:
        'Sociedades de crédito direto, empréstimo entre pessoas, agências de fomento, hipotecárias, SCD/SEP/SCMEPP',
      tipo: 'Regime específico (operações de crédito)',
      tarifas: '—',
      base: 'arts. 183, §1º, XIII-XVIII',
    },
    {
      papel: 'Instituições de pagamento',
      tipo: 'Regime específico dos arranjos de pagamento (art. 214); tarifas de conta de pagamento em normas gerais (art. 184, §2º)',
      tarifas: 'Conta de pagamento: normas gerais',
      base: 'arts. 183, §1º, XXII e 214',
    },
    {
      papel: 'Seguradoras, resseguradores, previdência, capitalização e corretores',
      tipo: 'Regime específico de seguros (outro capítulo da LC 214)',
      tarifas: '—',
      base: 'arts. 183, §1º, XXIV-XXVIII',
    },
    {
      papel: 'Prestadores de serviços de ativos virtuais (cripto)',
      tipo: 'Regime específico',
      tarifas: '—',
      base: 'art. 183, §1º, XXIX',
    },
    {
      papel: 'Securitizadoras, factoring, empresas simples de crédito (não supervisionadas)',
      tipo: 'Também fornecedores do regime — art. 183, §2º, II-IV',
      tarifas: '—',
      base: 'art. 183, §2º',
    },
    {
      papel: 'Participantes de arranjos e programas de fidelização não instituições de pagamento',
      tipo: 'Fornecedores do regime (LC 227/2026)',
      tarifas: '—',
      base: 'art. 183, §2º, I',
    },
  ]

  // ---------- OBRIGAÇÕES ----------
  const obrigacoesLinhas = [
    {
      quem: 'Banco / instituição financeira',
      tipo: 'FISCAL',
      oque: 'Apurar IBS/CBS sobre receitas das operações (crédito, câmbio, títulos, leasing, consórcio, fundos) com as deduções do art. 192; alíquotas nacionalmente uniformes (art. 189); tarifas bancárias em normas gerais (art. 184)',
      base: 'arts. 185, 189, 192 e 184',
    },
    {
      quem: 'Banco / instituição financeira',
      tipo: 'FISCAL',
      oque: 'Prestar informações das operações ao CGIBS/RFB (obrigação acessória) — é delas que dependem os créditos dos clientes',
      base: 'art. 191',
    },
    {
      quem: 'Banco / instituição financeira',
      tipo: 'FISCAL',
      oque: 'Informar os créditos apropriáveis pelos tomadores (art. 190) — o crédito do correntista PJ nasce da informação prestada pelo banco',
      base: 'arts. 190 e 191',
    },
    {
      quem: 'Banco / instituição financeira',
      tipo: 'FINANCEIRA',
      oque: 'Deduções restritas a operações autorizadas por órgão governamental, nos limites operacionais legais — vedada dedução de despesa administrativa (art. 187); reversão de provisões e recuperação de créditos entram na base (art. 186)',
      base: 'arts. 186-187',
    },
    {
      quem: 'Correntista PJ do regime regular',
      tipo: 'FISCAL',
      oque: 'Crédito sobre despesas financeiras de empréstimos: alíquota devida × despesa efetivamente paga (caixa), deduzido principal + juros equivalentes à Selic over (art. 194); vedado em moeda estrangeira e com cooperativas do art. 271 (art. 197)',
      base: 'arts. 194 e 197',
    },
    {
      quem: 'Correntista PJ do regime regular',
      tipo: 'FISCAL',
      oque: 'Crédito sobre tarifas e comissões pagas (operações I a V do art. 182), com base nos valores pagos pelo fornecedor (art. 198); entidades do regime específico também creditem, se a despesa não for dedutível da base delas (§ único)',
      base: 'art. 198',
    },
    {
      quem: 'Correntista PJ do regime regular',
      tipo: 'FISCAL',
      oque: 'Emissor de debêntures/notas comerciais: crédito na forma do art. 194 enquanto o título for detido por entidade do regime específico; em oferta pública, o credor exclui da base o juro acima da Selic e o devedor NÃO credita (art. 195)',
      base: 'art. 195',
    },
    {
      quem: 'Correntista PJ do regime regular',
      tipo: 'FISCAL',
      oque: 'Antecipação/desconto de recebíveis: crédito sobre a parcela do desgio que exceder a curva futura da taxa DI pelo prazo da antecipação (art. 196)',
      base: 'art. 196',
    },
    {
      quem: 'Correntista PJ do regime regular',
      tipo: 'FISCAL',
      oque: 'Leasing: crédito sobre as parcelas das contraprestações e valor residual, na medida do pagamento, pela alíquota devida (art. 203)',
      base: 'art. 203',
    },
    {
      quem: 'Correntista PF (consumidor final)',
      tipo: '—',
      oque: 'Sem crédito — suporta o IBS/CBS embutido nas tarifas e no spread; a vedação geral do art. 199 fecha qualquer crédito não expressamente permitido',
      base: 'arts. 199 e 4º',
    },
    {
      quem: 'Todos',
      tipo: 'VEDAÇÃO',
      oque: 'É VEDADO apropriar créditos nas aquisições de serviços financeiros I a V do art. 182 que não estejam expressamente permitidos nos arts. 194 a 198',
      base: 'art. 199',
    },
  ]

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador de Serviços Financeiros"
        sub="O regime específico tributa as RECEITAS das operações com as deduções do art. 192 — o principal do empréstimo NÃO é receita (art. 192, §1º, I). Tarifas de conta/saque/transferência seguem as normas gerais (art. 184). O correntista PJ credita sobre despesas financeiras ACIMA da Selic (art. 194) e sobre tarifas (art. 198)."
        teclas="Alt+1 Empréstimo · Alt+2 Tarifas · Alt+3 Sujeitos · Alt+4 Obrigações"
        capitulacao="LEI LC 214/2025, arts. 182–214 · LEI LC 227/2026 (art. 192 V) · RESOLUÇÃO CGIBS 14/2026 (ref. 27,91%)"
      />

      <ModoChips
        modos={[
          { id: 'credito', label: 'Empréstimo (crédito)', icone: '🏦' },
          { id: 'tarifas', label: 'Tarifas bancárias', icone: '💳' },
          { id: 'sujeitos', label: 'Sujeitos ativos e passivos', icone: '👥' },
          { id: 'obrigacoes', label: 'Obrigações: banco × correntista', icone: '📋' },
        ]}
        modo={modo}
        setModo={setModo}
      />

      {modo === 'credito' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Principal do empréstimo (R$)
              </span>
              <input
                type="number"
                value={principal}
                min={0}
                onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Parcelas</span>
              <input
                type="number"
                value={parcelas}
                min={1}
                onChange={(e) => setParcelas(Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Juros do contrato (% a.m.)
              </span>
              <input
                type="number"
                value={jurosMes}
                min={0}
                step={0.1}
                onChange={(e) => setJurosMes(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Selic (% a.a.)</span>
              <input
                type="number"
                value={selicAno}
                min={0}
                step={0.1}
                onChange={(e) => setSelicAno(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Perfil do tomador</span>
              <select
                value={tomadorRegular ? 'r' : 'pf'}
                onChange={(e) => setTomadorRegular(e.target.value === 'r')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="r">PJ do regime regular (credita — art. 194)</option>
                <option value="pf">PF consumidora final (sem crédito)</option>
              </select>
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais e valores do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiF
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiF
                titulo="Juros totais do contrato"
                valor={fmtF(jurosTotal)}
                sub="receita do banco (art. 192, §1º, I)"
              />
              <KpiF
                titulo="Despesa financeira creditável"
                valor={fmtF(despesaFinanceira)}
                sub="juros − parcela Selic (art. 194, II)"
                destaque
              />
              <KpiF
                titulo="Crédito do tomador (total)"
                valor={fmtF(creditoTomador)}
                sub={
                  tomadorRegular
                    ? aliCheia.toFixed(2) + '% × despesa financeira'
                    : 'sem crédito (PF)'
                }
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Base de cálculo — passo a passo"
              capitulacao="arts. 192 e 194 (LC 214/2025)"
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
                      Total pago pelo tomador (parcelas × prazo)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmtF(totalPago)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 192, §1º, I
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      (−) Principal (NÃO é receita)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">− {fmtF(principal)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 192, §1º, I
                    </td>
                  </tr>
                  <tr className="bg-panorama-gold/10">
                    <td className="py-2.5 px-4 font-bold text-panorama-navy">=</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Base do banco (juros)</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                      {fmtF(baseBanco)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 185 (receitas c/ deduções)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">×</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Alíquota de referência
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{aliCheia.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 189 (uniforme)
                    </td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">IBS + CBS do banco</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {fmtF(ibsCbsBanco)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">
                      arts. 182, I, 185 e 192
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">3</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      (−) Juros equivalentes à Selic over (dedução do crédito do tomador)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">− {fmtF(selicTotal)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 194, II
                    </td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">Crédito do tomador regular</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {fmtF(creditoTomador)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">
                      art. 194, caput
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Custos por parcela — o que o tomador paga e o que credita"
              capitulacao="art. 194 (regime de caixa)"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Parcela</th>
                    <th className="py-3 px-3">Valor da parcela</th>
                    <th className="py-3 px-3">Juros da parcela</th>
                    <th className="py-3 px-3">Parcela Selic</th>
                    <th className="py-3 px-3">Despesa creditável</th>
                    <th className="py-3 px-3">Crédito</th>
                    <th className="py-3 px-3">Custo líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tabelaParcelas.map((p) => (
                    <tr key={p.n} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900">{p.n}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtF(p.parcela)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtF(p.jurosP)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtF(p.selicP)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtF(p.despP)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">{fmtF(p.credP)}</td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono font-semibold">
                        {fmtF(p.liquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Custo líquido total do tomador: <strong>{fmtF(custoLiquido)}</strong> (
              {tomadorRegular ? 'total pago − créditos' : 'sem crédito — PF consumidora final'}). O
              crédito é calculado parcela a parcela, pelo regime de caixa, após o pagamento (art.
              194). Vedado em operações em moeda estrangeira e com cooperativas do art. 271 (art.
              197).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ Deduções do banco na base (art. 192): captação de recursos (sem principal — §2º),
            câmbio, perdas com títulos, encargos de dívida emitida, perdas de crédito nas regras do
            IR (art. 192, V, red. LC 227/2026), assessores/consultores/correspondentes não
            empregados (VI). Reversão de provisões e recuperação de créditos baixados{' '}
            <strong>entram</strong> na base (art. 186). Derivativos também computam (§7º). Deduções
            só em operações autorizadas por órgão governamental, nos limites legais —{' '}
            <strong>vedada despesa administrativa</strong> (art. 187).
          </div>
        </>
      )}

      {modo === 'tarifas' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Nº de contas</span>
              <input
                type="number"
                value={contas}
                min={0}
                onChange={(e) => setContas(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Tarifa de abertura (R$/conta)
              </span>
              <input
                type="number"
                value={tarifaAbertura}
                min={0}
                onChange={(e) => setTarifaAbertura(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Tarifa de manutenção (R$/mês)
              </span>
              <input
                type="number"
                value={tarifaManutencao}
                min={0}
                onChange={(e) => setTarifaManutencao(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Saques por conta/mês</span>
              <input
                type="number"
                value={saquesMes}
                min={0}
                onChange={(e) => setSaquesMes(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Tarifa de saque (R$)</span>
              <input
                type="number"
                value={valorSaque}
                min={0}
                onChange={(e) => setValorSaque(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Transferências por conta/mês
              </span>
              <input
                type="number"
                value={transferencias}
                min={0}
                onChange={(e) => setTransferencias(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Tarifa de transferência (R$)
              </span>
              <input
                type="number"
                value={valorTransferencia}
                min={0}
                onChange={(e) => setValorTransferencia(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Tipo de instituição</span>
              <select
                value={tipoInstituicao}
                onChange={(e) =>
                  setTipoInstituicao(e.target.value as 'banco' | 'pagamento' | 'outra')
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="banco">Banco / caixa econômica</option>
                <option value="pagamento">Instituição de pagamento</option>
                <option value="outra">Outra (cooperativa, corretora etc.)</option>
              </select>
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais e valores do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiF
                titulo="Receita mensal de tarifas"
                valor={fmtF(receitaTarifasMes)}
                sub={`${contas} contas × tarifas + saques + transferências`}
              />
              <KpiF
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiF
                titulo="Regime das tarifas"
                valor={regimeTarifas ? 'Normas gerais' : 'Regime específico'}
                sub={regimeTarifas ? 'art. 184 (banco/instituição de pagamento)' : 'art. 182-185'}
                destaque
              />
              <KpiF
                titulo="IBS+CBS sobre tarifas (mês)"
                valor={fmtF(ibsCbsTarifas)}
                sub={`${fmtF(ibsCbsTarifas * 12)}/ano`}
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Base de cálculo — passo a passo"
              capitulacao="art. 184 (normas gerais)"
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
                      Receita mensal de tarifas (abertura + manutenção + saques + transferências)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">
                      {fmtF(receitaTarifasMes)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 184, caput
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">Regime aplicável</td>
                    <td className="py-2.5 px-4 font-mono">
                      {regimeTarifas ? 'Normas gerais (Título I)' : 'Regime específico'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 184, caput e §2º
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">×</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Alíquota de referência
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{aliCheia.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      Res. CGIBS 14/2026
                    </td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">IBS + CBS sobre as tarifas (mensal)</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {fmtF(ibsCbsTarifas)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">art. 184</td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">+</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Crédito do correntista PJ do regime regular (art. 198)
                    </td>
                    <td className="py-2.5 px-4 font-mono">{fmtF(creditoCorrentistaPJ)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 198, caput
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Mapa das tarifas — quem pode cobrar e como tributa"
              capitulacao="arts. 184 e 214"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Tarifa / serviço</th>
                    <th className="py-3 px-3">Quem presta</th>
                    <th className="py-3 px-3">Regime</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tarifasLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.tarifa}</td>
                      <td className="py-2.5 px-3 text-slate-700">{l.quem}</td>
                      <td className="py-2.5 px-3 text-slate-700">{l.regime}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ <strong>Correntista:</strong> o PJ do regime regular credita sobre as tarifas pagas
            (art. 198), com base nos valores informados pelo fornecedor ao CGIBS/RFB (art. 190). A
            PF suporta o tributo embutido, sem crédito. A relação emissor × portador de instrumento
            de pagamento segue normas gerais, salvo crédito do emissor (art. 214, §2º).
          </div>
        </>
      )}

      {modo === 'sujeitos' && (
        <>
          <div>
            <BlocoH
              n="1"
              titulo="⃣ Sujeitos ativos (fornecedores) e passivos (tomadores) — art. 183"
              capitulacao="art. 183 (29 tipos + §2º)"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Instituição / papel</th>
                    <th className="py-3 px-3">Regime aplicável</th>
                    <th className="py-3 px-3">Tarifas de conta</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sujeitosLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.papel}</td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.tipo}</td>
                      <td className="py-2.5 px-3 text-slate-700">{l.tarifas}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ <strong>Sujeito ativo</strong> (quem recolhe): a instituição que presta o serviço
            financeiro — supervisionada pelo SFN (art. 183, §1º, 29 tipos) ou fornecedor não
            supervisionado que presta serviço financeiro habitualmente/profissionalmente (art. 183,
            §2º, VI). <strong>Sujeito passivo</strong> (quem suporta): o tomador — PJ do regime
            regular (com crédito nas hipóteses dos arts. 194-198) ou consumidor final (sem crédito).
            As alíquotas do regime são <strong>nacionalmente uniformes</strong> (art. 189, §1º).
          </div>
        </>
      )}

      {modo === 'obrigacoes' && (
        <>
          <div>
            <BlocoH
              n="1"
              titulo="⃣ Obrigações fiscais e financeiras — banco × correntista"
              capitulacao="arts. 185–199 e 203"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Quem</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Obrigação / direito</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {obrigacoesLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.quem}</td>
                      <td className="py-2.5 px-3">
                        <BadgeF ok={l.tipo !== 'VEDAÇÃO'} texto={l.tipo} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.oque}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
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
            (1) alíquota de referência da CBS 2027 — resolução do Senado pendente (LC 214, art.
            349); (2) IBS de 19,11% deriva da referência total de 27,91% (Res. CGIBS 14/2026) e será
            ajustado; (3) alíquotas do regime financeiro 2027-2033 seguem o art. 233 e serão
            nacionalmente uniformes (art. 189); (4) forma de prestação das informações ao CGIBS/RFB
            (arts. 190-191) depende de regulamento (RIBS); (5) novos atos do CMN/Bacen/CVM podem
            alterar enquadramentos (art. 193, §4º). Qualquer mudança entra na Seção 13 — Histórico
            de Atualizações.
          </div>

          <BotaoEnviarSimulacao termo="empréstimos" />

          <RodapeCapitulacao
            itens={[
              'lei|LC 214/2025 — arts. 182–214 (serviços financeiros)',
              'lei|LC 227/2026 — art. 192, V (perdas de crédito)',
              'resolucao|Res. CGIBS 14/2026 — referência 27,91%',
              'ref|Alíquotas 2027–2033 — art. 233 (a definir)',
            ]}
          />
        </>
      )}
    </div>
  )
}

export function SectionFinanceiros() {
  const [tab, setTab] = useState<'operacoes' | 'base' | 'arranjos' | 'simulador'>('operacoes')

  return (
    <section id="financeiros" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6D
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Serviços financeiros — fluxo de caixa e deduções
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico dos serviços financeiros (LC 214/2025, arts. 182–214). Texto extraído da{' '}
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
        <AbaButton ativo={tab === 'operacoes'} onClick={() => setTab('operacoes')}>
          🏦 Operações (art. 182)
        </AbaButton>
        <AbaButton ativo={tab === 'base'} onClick={() => setTab('base')}>
          💰 Base e deduções
        </AbaButton>
        <AbaButton ativo={tab === 'simulador'} onClick={() => setTab('simulador')}>
          🧮 Simulador financeiro
        </AbaButton>
        <AbaButton ativo={tab === 'arranjos'} onClick={() => setTab('arranjos')}>
          💳 Arranjos de pagamento
        </AbaButton>
      </div>

      {tab === 'operacoes' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (art. 182):</strong> o regime alcança{' '}
            <strong>17 operações</strong> financeiras — praticado por quem é supervisionado pelo BC,
            CVM, Previc ou SUSEP (art. 183).
          </div>
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              O que são serviços financeiros (art. 182)
            </h4>
            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside leading-relaxed">
              {LISTA.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="text-[11px] font-mono text-slate-500">LC 214, art. 182</p>
          </div>
        </div>
      )}

      {tab === 'base' && (
        <div className="space-y-3">
          <Tabela linhas={REGRAS.filter((r) => r.titulo !== 'Arranjos de pagamento')} />
        </div>
      )}

      {tab === 'arranjos' && (
        <div className="space-y-3">
          <Tabela linhas={REGRAS.filter((r) => r.titulo === 'Arranjos de pagamento')} />
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ Quem está sujeito: pessoas físicas e jurídicas supervisionadas pelo Banco Central,
            CVM, Previc ou SUSEP (art. 183) — bancos, seguradoras, administradoras de consórcio,
            corretoras etc.
          </div>
        </div>
      )}

      {tab === 'simulador' && <SimuladorFinanceiro />}
    </section>
  )
}
