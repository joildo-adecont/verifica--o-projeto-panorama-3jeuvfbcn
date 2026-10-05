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

/** Seção 6B — Regime do Agronegócio (LC 214/2025, arts. 110, 137-138, 164-171 e 271-272).
 *  Layout de tabela uniformizado com a Seção 6A. */

const REDUCOES = [
  {
    titulo: 'Produtos agropecuários in natura',
    badge: '−60%',
    detalhe:
      'Produtos agropecuários, aquícolas, pesqueiros, florestais e extrativistas vegetais in natura (art. 137). In natura = sem industrialização; secagem, limpeza, debulha, congelamento e resfriamento não tiram a condição (§1º). Serviços ambientais de conservação/recuperação de vegetação nativa contam como produto florestal (§3º).',
    base: 'LC 214, art. 137',
    sim: 'produtos agropecuários',
  },
  {
    titulo: 'Insumos agropecuários e aquícolas (Anexo IX)',
    badge: '−60%',
    detalhe:
      'Insumos relacionados no Anexo IX da LC 214, com NCM/NBS específica (art. 138). Exige registro como insumo no Ministério da Agricultura, quando exigido (§1º). Lista revisada a cada 120 dias por ato conjunto Fazenda/CGIBS/Mapa (§10).',
    base: 'LC 214, art. 138 e Anexo IX',
    sim: 'insumos agropecuários',
  },
]

const NAO_CONTRIBUINTE = [
  {
    titulo: 'Quem não é contribuinte',
    badge: 'R$ 3,6 mi',
    detalhe:
      'Produtor rural (pessoa física ou jurídica) com receita até R$ 3,6 milhões/ano e o produtor rural integrado não são contribuintes do IBS/CBS. Cooperativas de produtores com receita abaixo do limite também ficam fora.',
    base: 'LC 214, art. 164',
  },
  {
    titulo: 'Produtor rural integrado',
    badge: 'Integrado',
    detalhe:
      'Produtor agrossilvipastoril vinculado ao integrador por contrato de integração vertical, recebendo bens/servios para produção e fornecendo matéria-prima, bens intermediários ou de consumo final.',
    base: 'LC 214, art. 164, §1º',
  },
  {
    titulo: 'Excedeu o limite no meio do ano',
    badge: 'Excesso',
    detalhe:
      'Passa a ser contribuinte a partir do 2º mês subsequente ao excesso; se o excesso for até 20% do limite, os efeitos só no ano seguinte. Início de atividade: limite proporcional aos meses.',
    base: 'LC 214, art. 164, §2º–§4º',
  },
  {
    titulo: 'Limite é somado',
    badge: 'Soma',
    detalhe:
      'Se o produtor tem participação societária em outra pessoa jurídica agropecuária, o limite de R$ 3,6 milhões é verificado sobre a soma das receitas de todas. O limite é atualizado anualmente pelo IPCA.',
    base: 'LC 214, arts. 164, §6º e 167',
  },
  {
    titulo: 'Opção pelo regime regular',
    badge: 'Opção',
    detalhe:
      'O produtor não contribuinte PODE optar por se inscrever como contribuinte — efeitos a partir do mês seguinte, irretratável no ano. Renúncia possível, com efeito no ano seguinte. Quem já faturava ≥ R$ 3,6 mi antes da reforma é contribuinte automático.',
    base: 'LC 214, arts. 165–166',
  },
]

const CREDITOS = [
  {
    titulo: 'Compra do produtor não contribuinte',
    badge: 'Crédito presumido',
    detalhe:
      'O adquirente (contribuinte regular) apropria crédito presumido nas aquisições de bens e serviços do produtor rural não contribuinte. O documento fiscal deve discriminar: valor da operação, valor do crédito presumido e valor líquido. Percentuais definidos anualmente por ato conjunto Fazenda/CGIBS (média de 5 anos).',
    base: 'LC 214, art. 168',
  },
  {
    titulo: 'Frete do transportador autônomo',
    badge: 'Crédito presumido',
    detalhe:
      'Crédito presumido nas aquisições de transporte de carga de autônomo (PF) não contribuinte ou MEI. Não vale quando o transporte está embutido no valor da operação. Mesma mecânica de percentuais anuais.',
    base: 'LC 214, art. 169',
  },
  {
    titulo: 'Cooperativa também apropria',
    badge: 'Crédito presumido',
    detalhe:
      'O direito ao crédito presumido alcança a cooperativa no recebimento de bens/servios de associados não contribuintes não optantes pelo Simples — inclusive com o regime específico do art. 271.',
    base: 'LC 214, art. 168, §9º',
  },
  {
    titulo: 'Tratores e veículos de carga',
    badge: 'Zero',
    detalhe:
      'Fornecimento e importação de tratores, máquinas e implementos agrícolas destinados a produtor rural não contribuinte, e de veículos de carga para transportador autônomo PF não contribuinte, têm alíquota ZERO — inclusive bens de capital listados em regulamento.',
    base: 'LC 214, art. 110',
  },
]

const DIFERIMENTO = [
  {
    titulo: 'O que é diferido',
    badge: 'Diferido',
    detalhe:
      'O recolhimento do IBS/CBS dos insumos do Anexo IX fica ADIADO nas operações: (I) fornecimento por contribuinte regular para outro contribuinte regular; e (II) fornecimento/importação por contribuinte regular ou produtor não contribuinte que usa o insumo para produzir bem vendido a adquirentes com direito a crédito presumido (art. 168).',
    base: 'LC 214, art. 138, §2º',
  },
  {
    titulo: 'Quando o diferimento encerra',
    badge: 'Encerramento',
    detalhe:
      'Nas operações entre contribuintes regulares: encerra se a operação seguinte não tem diferimento, é isenta/não tributada/alíquota zero, ou sem documento fiscal — o recolhimento é do contribuinte que promove a operação que encerra a fase. Na cadeia do produtor não contribuinte: encerra com a redução dos créditos presumidos do art. 168.',
    base: 'LC 214, art. 138, §5º–§9º',
  },
  {
    titulo: 'Convivência com cooperativas',
    badge: 'Ressalva',
    detalhe:
      'O regime de alíquota zero das cooperativas (art. 271) NÃO se aplica às operações com insumos do Anexo IX alcançadas pelo diferimento do art. 138, §3º.',
    base: 'LC 214, art. 271, §4º',
  },
]

const COOPERATIVAS = [
  {
    titulo: 'Alíquota zero associado ↔ cooperativa',
    badge: 'Zero',
    detalhe:
      'Cooperativas podem optar por regime específico com alíquota ZERO quando: (I) o associado fornece bem/servio para a cooperativa; e (II) a cooperativa fornece bem/servio a associado do regime regular. Vale também entre cooperativas singulares, centrais, federações, confederações e seus bancos cooperativos.',
    base: 'LC 214, art. 271',
  },
  {
    titulo: 'Cooperativa de produção agropecuária',
    badge: 'Zero',
    detalhe:
      'Fornecimento de bem material pela cooperativa de produção agropecuária a associado NÃO sujeito ao regime regular também é zero — desde que anulados os créditos por ela apropriados do bem fornecido.',
    base: 'LC 214, art. 271, §1º, II',
  },
  {
    titulo: 'Transferência de créditos do associado',
    badge: 'Créditos',
    detalhe:
      'O associado do regime regular que vende à cooperativa com redução pode transferir a ela os créditos das operações antecedentes e os créditos presumidos — sem a limitação do art. 55. Alcance: apenas bens/servios usados na produção do que é fornecido à cooperativa.',
    base: 'LC 214, art. 272',
  },
  {
    titulo: 'Como optar',
    badge: 'Opção',
    detalhe:
      'A opção é exercida pela cooperativa no ano-calendário anterior ao de início dos efeitos, ou no início das operações.',
    base: 'LC 214, art. 271, §3º',
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

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

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

function SimuladorAgro() {
  const [modo, setModo] = useState<'produtor' | 'insumos' | 'creditos' | 'cooperativa'>('produtor')
  useModoTeclado(setModo, ['produtor', 'insumos', 'creditos', 'cooperativa'] as const)
  const [receitaPropria, setReceitaPropria] = useState(3000000)
  const [receitaOutras, setReceitaOutras] = useState(0)
  const [ipcaLimite, setIpcaLimite] = useState(5)
  const [integrado, setIntegrado] = useState(false)
  const [valorInsumo, setValorInsumo] = useState(100000)
  const [cadeia, setCadeia] = useState<'rr' | 'rp' | 'pa' | 'imp'>('rr')
  const [usoProducao, setUsoProducao] = useState(true)
  const [valorAquisicao, setValorAquisicao] = useState(50000)
  const [tipoCredito, setTipoCredito] = useState<'produtor' | 'integrado' | 'frete' | 'coop'>(
    'produtor',
  )
  const [percentual, setPercentual] = useState(25)
  const [valorOperacao, setValorOperacao] = useState(200000)
  const [tipoCoop, setTipoCoop] = useState<
    'assoc-coop' | 'coop-assoc-r' | 'coop-assoc-nc' | 'entre-coops'
  >('assoc-coop')
  const [anulouCreditos, setAnulouCreditos] = useState(true)

  const aliCheia = REF_TOTAL
  const cbsRef = 8.8
  const ibsRef = REF_TOTAL - cbsRef
  const aliInsumo = aliCheia * 0.4

  // Modo produtor — art. 164
  const limite = 3600000 * (1 + ipcaLimite / 100)
  const receitaTotal = receitaPropria + receitaOutras
  const excesso = Math.max(0, receitaTotal - limite)
  const excessoPct = (excesso / limite) * 100
  const contribuinte = !integrado && receitaTotal > limite
  const quando =
    excessoPct <= 20
      ? 'Ano-calendário seguinte (art. 164, §3º)'
      : '2º mês subsequente ao excesso (art. 164, §2º)'
  const faixasReceita = [
    1000000, 2000000, 3000000, 3600000, 4500000, 6000000, 8000000, 10000000, 12000000,
  ]

  // Modo insumos — art. 138
  const diferido =
    cadeia === 'rr' || (cadeia === 'rp' && usoProducao) || (cadeia === 'imp' && usoProducao)
  const ibsCbsInsumo = (valorInsumo * aliInsumo) / 100
  const cadeiaLinhas = [
    {
      de: 'Contribuinte regular',
      para: 'Contribuinte regular',
      efeito: 'Diferido — recolhimento adiado',
      base: 'art. 138, §2º, I, a',
      badge: true,
    },
    {
      de: 'Contribuinte regular / importação',
      para: 'Produtor NC que produz para adquirente com crédito presumido',
      efeito: usoProducao ? 'Diferido — recolhimento adiado' : 'Tributado na operação (−60%)',
      base: 'art. 138, §2º, I, b e §2º, II, b',
      badge: usoProducao,
    },
    {
      de: 'Produtor rural não contribuinte',
      para: 'Adquirente do regime regular',
      efeito: 'Sem IBS/CBS na etapa (produtor NC) — adquirente apropria crédito presumido',
      base: 'arts. 164 e 168',
      badge: false,
    },
    {
      de: 'Operação que encerra o diferimento',
      para: 'Próxima etapa da cadeia',
      efeito: 'Recolhimento pelo contribuinte da operação que encerra a fase',
      base: 'art. 138, §§5º–9º',
      badge: false,
    },
  ]

  // Modo créditos — arts. 168/169
  const credito = (valorAquisicao * percentual) / 100
  const liquido = valorAquisicao - credito
  const conexoes = [
    {
      de: 'Produtor rural NC (art. 164)',
      para: 'Adquirente do regime regular',
      efeito:
        'Adquirente apropria crédito presumido; documento discrimina valor, crédito e líquido',
      base: 'art. 168, caput e §1º',
    },
    {
      de: 'Produtor rural integrado',
      para: 'Integradora (regime regular)',
      efeito:
        'Valor da operação = remuneração do contrato de integração; crédito presumido sobre ela',
      base: 'art. 168, §2º',
    },
    {
      de: 'Transportador autônomo PF / MEI',
      para: 'Contratante do regime regular',
      efeito:
        'Crédito presumido sobre o frete — não vale se o transporte estiver embutido na operação',
      base: 'art. 169, caput e §1º',
    },
    {
      de: 'Associado NC → Cooperativa',
      para: 'Cooperativa (mesmo com art. 271)',
      efeito:
        'Cooperativa apropria crédito presumido — exceto beneficiamento que retorna ao associado',
      base: 'art. 168, §9º',
    },
    {
      de: 'Cooperativa → Associado regular',
      para: 'Associado do regime regular',
      efeito:
        'Alíquota zero na operação; associado transfere créditos antecedentes e presumidos à cooperativa',
      base: 'arts. 271, I e 272',
    },
  ]

  // Modo cooperativa — art. 271
  const zero =
    tipoCoop === 'assoc-coop' ||
    tipoCoop === 'coop-assoc-r' ||
    tipoCoop === 'entre-coops' ||
    (tipoCoop === 'coop-assoc-nc' && anulouCreditos)
  const ibsCbsCoop = zero ? 0 : (valorOperacao * aliCheia) / 100
  const coopLinhas = [
    {
      op: 'Associado fornece bem/servio → cooperativa',
      efeito: 'Alíquota ZERO (opção pelo regime específico)',
      base: 'art. 271, I',
      zero: true,
    },
    {
      op: 'Cooperativa fornece → associado do regime regular',
      efeito: 'Alíquota ZERO',
      base: 'art. 271, II',
      zero: true,
    },
    {
      op: 'Cooperativa fornece → associado NÃO regular (coop. de produção agropecuária)',
      efeito: anulouCreditos
        ? 'Alíquota ZERO — créditos do bem anulados'
        : 'Tributado (créditos não anulados)',
      base: 'art. 271, §1º, II',
      zero: anulouCreditos,
    },
    {
      op: 'Entre cooperativas (singulares, centrais, federações, confederações e bancos cooperativos)',
      efeito: 'Alíquota ZERO',
      base: 'art. 271, §1º, I',
      zero: true,
    },
    {
      op: 'Serviços financeiros da cooperativa a associados (tarifas e comissões)',
      efeito: 'Alíquota ZERO',
      base: 'art. 271, §2º',
      zero: true,
    },
    {
      op: 'Insumos do Anexo IX alcançados pelo diferimento (art. 138, §3º)',
      efeito: 'Regime da cooperativa NÃO se aplica — segue diferimento',
      base: 'art. 271, §4º',
      zero: false,
    },
  ]

  return (
    <div className="space-y-5">
      <HeroSim
        titulo="Simulador do Agronegócio"
        sub="Produtor rural com receita até R$ 3,6 mi/ano (IPCA) e o produtor integrado NÃO são contribuintes (art. 164). In natura e insumos do Anexo IX: −60% (arts. 137–138). Tratores/máquinas e veículos de carga: alíquota ZERO (art. 110). Créditos presumidos (arts. 168–169) e cooperativas zero (art. 271)."
        teclas="Alt+1 Produtor · Alt+2 Insumos · Alt+3 Créditos · Alt+4 Cooperativa"
        capitulacao="LEI LC 214/2025, arts. 110, 137–138, 164–169 e 271–272 · RESOLUÇÃO CGIBS 14/2026 (ref. 27,91%) · ATO CONJUNTO Fazenda/CGIBS (créditos presumidos)"
      />

      <ModoChips
        modos={[
          { id: 'produtor', label: 'Produtor (enquadramento)', icone: '🚜' },
          { id: 'insumos', label: 'Insumos & diferimento', icone: '🌾' },
          { id: 'creditos', label: 'Créditos presumidos', icone: '💵' },
          { id: 'cooperativa', label: 'Cooperativa', icone: '🤝' },
        ]}
        modo={modo}
        setModo={setModo}
      />

      {modo === 'produtor' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Receita anual própria (R$)
              </span>
              <input
                type="number"
                value={receitaPropria}
                min={0}
                onChange={(e) => setReceitaPropria(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Receita de outras PJ agro (participação societária, R$)
              </span>
              <input
                type="number"
                value={receitaOutras}
                min={0}
                onChange={(e) => setReceitaOutras(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                IPCA acumulado desde 2026 (%)
              </span>
              <input
                type="number"
                value={ipcaLimite}
                min={0}
                onChange={(e) => setIpcaLimite(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={integrado}
                onChange={(e) => setIntegrado(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Sou produtor rural integrado (contrato de integração vertical)
              </span>
            </label>
          </div>

          <div>
            <BlocoH
              n="1"
              titulo="⃣ Enquadramento — sou contribuinte do IBS/CBS?"
              capitulacao="art. 164 c/ §§1º–6º (LC 214/2025)"
            />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiA
                titulo="Limite atualizado (IPCA)"
                valor={fmt(limite)}
                sub="R$ 3,6 mi × (1 + IPCA) — art. 167"
              />
              <KpiA
                titulo="Receita total (soma societária)"
                valor={fmt(receitaTotal)}
                sub="própria + outras PJ agro — art. 164, §6º"
              />
              <KpiA
                titulo="% do limite"
                valor={pctLimite(receitaTotal, limite)}
                sub={excesso > 0 ? 'excesso de ' + fmt(excesso) : 'dentro do limite'}
              />
              <div
                className={`rounded-xl border p-3.5 ${contribuinte ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'}`}
              >
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wide ${contribuinte ? 'text-amber-700' : 'text-emerald-700'}`}
                >
                  Situação
                </div>
                <div
                  className={`mt-1 text-lg font-bold ${contribuinte ? 'text-amber-900' : 'text-emerald-900'}`}
                >
                  {integrado ? 'Integrado' : contribuinte ? 'Contribuinte' : 'Não contribuinte'}
                </div>
                <div
                  className={`mt-0.5 text-[11px] ${contribuinte ? 'text-amber-800' : 'text-emerald-800'}`}
                >
                  {integrado
                    ? 'produtor integrado nunca é contribuinte (art. 164, caput)'
                    : contribuinte
                      ? quando
                      : 'fora do regime regular — sem IBS/CBS'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Base de cálculo do enquadramento — passo a passo"
              capitulacao="art. 164, caput e §6º"
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
                      Receita anual própria
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmt(receitaPropria)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 164, caput
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      (+) Receita de outras PJ agropecuárias com participação societária
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">+ {fmt(receitaOutras)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 164, §6º
                    </td>
                  </tr>
                  <tr className="bg-panorama-gold/10">
                    <td className="py-2.5 px-4 font-bold text-panorama-navy">=</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      Receita total comparada ao limite
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                      {fmt(receitaTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 164, caput
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">3</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Limite anual atualizado (IPCA)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmt(limite)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">art. 167</td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">Resultado</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {integrado
                        ? 'NÃO CONTRIBUINTE (integrado)'
                        : contribuinte
                          ? 'CONTRIBUINTE — ' + quando
                          : 'NÃO CONTRIBUINTE'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">
                      arts. 164, §2º–§3º, e 165
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Faixa de receita — de R$ 1 mi a R$ 12 mi"
              capitulacao="art. 164, §§2º–3º"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Receita anual</th>
                    <th className="py-3 px-3">Contribuinte?</th>
                    <th className="py-3 px-3">Quando entra</th>
                    <th className="py-3 px-3">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faixasReceita.map((f) => {
                    const enq = !integrado && f > limite
                    const q = enq
                      ? f - limite <= limite * 0.2
                        ? 'Ano seguinte (excesso ≤ 20%)'
                        : '2º mês subsequente'
                      : '—'
                    return (
                      <tr
                        key={f}
                        className={
                          'align-top ' +
                          (Math.abs(receitaTotal - f) < 100000
                            ? 'bg-panorama-gold/10 font-semibold'
                            : 'hover:bg-slate-50/70')
                        }
                      >
                        <td className="py-2.5 px-3 text-slate-900 font-mono">{fmt(f)}</td>
                        <td className="py-2.5 px-3">
                          <BadgeA ok={!enq} texto={enq ? 'Sim' : 'Não'} />
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{q}</td>
                        <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                          {enq ? 'art. 164, §2º ou §3º' : 'art. 164, caput'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ <strong>Opção pelo regime regular (art. 165):</strong> o produtor não contribuinte
            PODE se inscrever como contribuinte — efeitos a partir do mês seguinte à solicitação,
            irretratável no ano-calendário; renúncia possível com efeito no ano seguinte (art. 166).
            Quem já faturava ≥ R$ 3,6 mi antes da reforma é contribuinte automático (art. 165, §3º).
            Início de atividade: limite proporcional aos meses (art. 164, §4º).
          </div>
        </>
      )}

      {modo === 'insumos' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Valor do insumo (R$)</span>
              <input
                type="number"
                value={valorInsumo}
                min={0}
                onChange={(e) => setValorInsumo(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Cadeia da operação</span>
              <select
                value={cadeia}
                onChange={(e) => setCadeia(e.target.value as 'rr' | 'rp' | 'pa' | 'imp')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rr">Regular → Regular</option>
                <option value="rp">Regular / importação → Produtor NC</option>
                <option value="pa">Produtor NC → Adquirente regular</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={usoProducao}
                onChange={(e) => setUsoProducao(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Insumo usado na produção vendida a adquirente com crédito presumido (art. 168)
              </span>
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiA
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiA titulo="Redução do art. 138" valor="−60%" sub="insumos do Anexo IX" />
              <KpiA
                titulo="Alíquota efetiva"
                valor={aliInsumo.toFixed(2) + '%'}
                sub="27,91% × 40%"
                destaque
              />
              <KpiA
                titulo="Diferimento"
                valor={diferido ? 'Diferido' : 'Tributado'}
                sub={diferido ? 'recolhimento adiado na cadeia' : 'recolhimento na operação'}
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Base de cálculo — passo a passo"
              capitulacao="art. 138, caput (Anexo IX)"
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
                      Valor do insumo agropecuário/aquícola
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmt(valorInsumo)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 138, caput (Anexo IX)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Alíquota de referência (27,91%)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{aliCheia.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      Res. CGIBS 14/2026
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">3</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">(×) Redução de 60%</td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">−60%</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 138, caput
                    </td>
                  </tr>
                  <tr className="bg-panorama-gold/10">
                    <td className="py-2.5 px-4 font-bold text-panorama-navy">=</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">Alíquota efetiva</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                      {aliInsumo.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 138, caput
                    </td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">IBS + CBS a recolher</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {fmt(ibsCbsInsumo)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">
                      art. 138, caput
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">+</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      Diferimento do recolhimento
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      {diferido ? 'Diferido — adiados' : 'Não diferido'}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 138, §2º
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Fluxo da cadeia — fornecedor → adquirente → efeito"
              capitulacao="art. 138, §2º e §5º–§9º"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Fornecedor</th>
                    <th className="py-3 px-3">Adquirente</th>
                    <th className="py-3 px-3">Efeito tributário</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cadeiaLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.de}</td>
                      <td className="py-2.5 px-3 text-slate-700">{l.para}</td>
                      <td className="py-2.5 px-3">
                        <BadgeA ok={l.badge} texto={l.efeito} />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ Condições do diferimento: insumo registrado no Ministério da Agricultura quando
            exigido (art. 138, §1º); lista do Anexo IX revisada a cada 120 dias (§10); encerramento
            nas hipóteses dos §§5º–9º — a operação que encerra a fase é quem recolhe; no fluxo do
            produtor NC, o diferimento encerra com a redução dos créditos presumidos do art. 168
            (§9º, I).
          </div>
        </>
      )}

      {modo === 'creditos' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Valor da aquisição (R$)</span>
              <input
                type="number"
                value={valorAquisicao}
                min={0}
                onChange={(e) => setValorAquisicao(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Fornecedor</span>
              <select
                value={tipoCredito}
                onChange={(e) =>
                  setTipoCredito(e.target.value as 'produtor' | 'integrado' | 'frete' | 'coop')
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="produtor">Produtor rural não contribuinte (art. 168)</option>
                <option value="integrado">Produtor rural integrado (art. 168, §2º)</option>
                <option value="frete">Transportador autônomo PF / MEI (art. 169)</option>
                <option value="coop">Cooperativa recebendo de associado (art. 168, §9º)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">
                Percentual do crédito presumido (%)
              </span>
              <input
                type="number"
                value={percentual}
                min={0}
                max={100}
                onChange={(e) => setPercentual(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiA
                titulo="Valor da operação"
                valor={fmt(valorAquisicao)}
                sub="valor pago ao fornecedor"
              />
              <KpiA
                titulo="Percentual aplicado"
                valor={percentual.toFixed(0) + '%'}
                sub="divulgado anualmente até setembro (art. 168, §4º)"
              />
              <KpiA
                titulo="Crédito presumido"
                valor={fmt(credito)}
                sub={percentual.toFixed(0) + '% × ' + fmt(valorAquisicao)}
                destaque
              />
              <KpiA
                titulo="Valor líquido fiscal"
                valor={fmt(liquido)}
                sub="operação − crédito (art. 168, §1º, III)"
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Discriminação obrigatória no documento fiscal — passo a passo"
              capitulacao="art. 168, §1º"
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
                      Valor da operação (pago ao fornecedor)
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">{fmt(valorAquisicao)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 168, §1º, I (integrado: §2º)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-400">2</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      (−) Crédito presumido do adquirente
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-mono">− {fmt(credito)}</td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">
                      art. 168, §§3º–4º
                    </td>
                  </tr>
                  <tr className="bg-panorama-navy text-white">
                    <td className="py-2.5 px-4 font-bold text-panorama-gold-light">=</td>
                    <td className="py-2.5 px-4 font-bold">Valor líquido para efeitos fiscais</td>
                    <td className="py-2.5 px-4 font-bold font-mono text-panorama-gold-light">
                      {fmt(liquido)}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-white/70">
                      art. 168, §1º, III
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <BlocoH
              n="3"
              titulo="⃣ Conexões fornecedor → cliente — quem credita quem"
              capitulacao="arts. 168–169 (LC 214/2025)"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Fornecedor</th>
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Efeito</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conexoes.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.de}</td>
                      <td className="py-2.5 px-3 text-slate-700">{l.para}</td>
                      <td className="py-2.5 px-3 text-slate-700 leading-relaxed">{l.efeito}</td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ Limites do crédito presumido: não alcança aquisições para uso e consumo pessoal do
            produtor/transportador (arts. 168, §7º e 169, §6º); crédito deduz o IBS/CBS devidos, com
            ressarcimento possível (art. 168, §8º); percentuais definidos por ato conjunto
            Fazenda/CGIBS com base no ano anterior (média de 5 anos; excepcionalmente inferior de
            2027 a 2031 — art. 168, §§5º, III e 10). Tratores, máquinas e implementos agrícolas e
            veículos de carga para produtor NC/autônomo têm alíquota ZERO (art. 110).
          </div>
        </>
      )}

      {modo === 'cooperativa' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Valor da operação (R$)</span>
              <input
                type="number"
                value={valorOperacao}
                min={0}
                onChange={(e) => setValorOperacao(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Operação</span>
              <select
                value={tipoCoop}
                onChange={(e) =>
                  setTipoCoop(
                    e.target.value as
                      | 'assoc-coop'
                      | 'coop-assoc-r'
                      | 'coop-assoc-nc'
                      | 'entre-coops',
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="assoc-coop">Associado → Cooperativa</option>
                <option value="coop-assoc-r">Cooperativa → Associado regular</option>
                <option value="coop-assoc-nc">
                  Cooperativa → Associado não regular (coop. de produção)
                </option>
                <option value="entre-coops">Entre cooperativas</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={anulouCreditos}
                onChange={(e) => setAnulouCreditos(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs font-semibold text-slate-700">
                Créditos do bem fornecido anulados (art. 271, §1º, II)
              </span>
            </label>
          </div>

          <div>
            <BlocoH n="1" titulo="⃣ Percentuais do cenário" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiA
                titulo="Alíquota de referência"
                valor={aliCheia.toFixed(2) + '%'}
                sub={`CBS ${cbsRef.toFixed(2)}% + IBS ${ibsRef.toFixed(2)}%`}
              />
              <KpiA
                titulo="Regime da cooperativa"
                valor={zero ? 'Alíquota ZERO' : 'Tributado'}
                sub="opção pelo regime específico (art. 271)"
                destaque
              />
              <KpiA
                titulo="IBS + CBS a recolher"
                valor={fmt(ibsCbsCoop)}
                sub={zero ? 'operação com alíquota zero' : '27,91% sobre a operação'}
              />
              <KpiA
                titulo="Crédito presumido da cooperativa"
                valor={fmt((valorOperacao * percentual) / 100)}
                sub="recebimento de associado NC — art. 168, §9º"
              />
            </div>
          </div>

          <div>
            <BlocoH
              n="2"
              titulo="⃣ Mapa das operações com cooperativas"
              capitulacao="art. 271 (LC 214/2025)"
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-panorama-navy text-white border-b-2 border-panorama-gold font-semibold">
                    <th className="py-3 px-3">Operação</th>
                    <th className="py-3 px-3">Efeito</th>
                    <th className="py-3 px-3 w-44">Base legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coopLinhas.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 align-top">
                      <td className="py-2.5 px-3 text-slate-900 font-semibold">{l.op}</td>
                      <td className="py-2.5 px-3">
                        <BadgeA ok={l.zero} texto={l.efeito} />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] font-mono text-slate-500">{l.base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ <strong>Transferência de créditos (art. 272):</strong> o associado do regime regular
            que vende à cooperativa com alíquota zero pode transferir a ela os créditos das
            operações antecedentes e os créditos presumidos — sem a limitação do art. 55; alcance:
            apenas bens/servios usados na produção do que é fornecido à cooperativa. A opção pelo
            regime é exercida no ano-calendário anterior ao de início dos efeitos, ou no início das
            operações (art. 271, §3º).
          </div>
        </>
      )}

      <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
        ⚠️ A alíquota de referência da CBS 2027 ainda depende de resolução do Senado (LC 214, art.
        349); a CBS de 8,8% é estimativa de mercado (8,8% − 0,1 p.p. do art. 347) e o IBS de 19,11%
        deriva da referência total de 27,91% (Res. CGIBS 14/2026). O limite de R$ 3,6 milhões é
        atualizado anualmente pelo IPCA (art. 167). Os percentuais dos créditos presumidos serão
        divulgados anualmente (arts. 168–169) — o valor de {percentual.toFixed(0)}% aqui é editável
        e didático.
      </div>

      <RodapeCapitulacao
        itens={[
          'lei|LC 214/2025 — arts. 110, 137–138, 164–169, 271–272 (agro)',
          'resolucao|Res. CGIBS 14/2026 — referência 27,91%',
          'ato|Ato conjunto Fazenda/CGIBS — % dos créditos presumidos (a divulgar)',
          'ref|Anexo IX — lista de insumos (revisão a cada 120 dias)',
        ]}
      />
    </div>
  )
}

function pctLimite(receita: number, limite: number) {
  return ((receita / limite) * 100).toFixed(1) + '%'
}

export function SectionAgronegocio() {
  const [tab, setTab] = useState<
    'reducoes' | 'nao-contribuinte' | 'creditos' | 'diferimento' | 'cooperativas' | 'simulador'
  >('reducoes')

  return (
    <section id="agronegocio" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6B
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Regime do agronegócio — produtor rural, créditos presumidos e cooperativas
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Regime específico do setor (LC 214/2025, arts. 110, 137–138, 164–171 e 271–272). Texto
          extraído da{' '}
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
            href={`${SIM_URL}?q=agro`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-panorama-navy"
          >
            Simulador de Transição
          </a>{' '}
          (grupos 🌾 Insumos agro e 🐄 Agro).
        </p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'reducoes'} onClick={() => setTab('reducoes')}>
          🌾 Reduções de alíquota
        </AbaButton>
        <AbaButton ativo={tab === 'nao-contribuinte'} onClick={() => setTab('nao-contribuinte')}>
          🚜 Produtor não contribuinte
        </AbaButton>
        <AbaButton ativo={tab === 'creditos'} onClick={() => setTab('creditos')}>
          💵 Créditos presumidos
        </AbaButton>
        <AbaButton ativo={tab === 'diferimento'} onClick={() => setTab('diferimento')}>
          ⏸️ Diferimento de insumos
        </AbaButton>
        <AbaButton ativo={tab === 'cooperativas'} onClick={() => setTab('cooperativas')}>
          🤝 Cooperativas
        </AbaButton>
        <AbaButton ativo={tab === 'simulador'} onClick={() => setTab('simulador')}>
          🧮 Simulador do agro
        </AbaButton>
      </div>

      {tab === 'reducoes' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Regra central (arts. 137–138):</strong> produtos agropecuários in natura e
            insumos do Anexo IX têm alíquotas reduzidas em <strong>60%</strong>.
          </div>
          <Tabela linhas={REDUCOES} />
        </div>
      )}

      {tab === 'nao-contribuinte' && (
        <div className="space-y-3">
          <Tabela linhas={NAO_CONTRIBUINTE} />
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
            ⚠️ O limite de R$ 3,6 milhões é verificado sobre a <strong>soma</strong> das receitas de
            todas as PJ agropecuárias em que o produtor tem participação (art. 164, §6º).
          </div>
        </div>
      )}

      {tab === 'creditos' && (
        <div className="space-y-3">
          <Tabela linhas={CREDITOS} />
        </div>
      )}

      {tab === 'diferimento' && (
        <div className="space-y-3">
          <Tabela linhas={DIFERIMENTO} />
        </div>
      )}

      {tab === 'cooperativas' && (
        <div className="space-y-3">
          <Tabela linhas={COOPERATIVAS} />
          <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
            ℹ️ A opção pelo regime da cooperativa é exercida no ano-calendário anterior ao de início
            dos efeitos, ou no início das operações (art. 271, §3º).
          </div>
        </div>
      )}

      {tab === 'simulador' && <SimuladorAgro />}
    </section>
  )
}
