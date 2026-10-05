import { useState } from 'react'
import { Calculator, Handshake, Landmark, Percent, Smartphone, Users } from 'lucide-react'

const SIM_URL = '/simulador.html'

/** Seções 6C–6F — demais regimes específicos e diferenciados (LC 214/2025).
 *  Texto extraído da LC 214 compilada do Planalto (conferido em 04/10/2026). */

// ---------- 6C: Consórcios ----------
const CONSORCIO_PONTOS = [
  {
    titulo: 'Taxa de administração — regime de caixa',
    regra:
      'A base de cálculo compreende todas as tarifas, comissões e taxas, bem como encargos, multas e juros do contrato de participação, efetivamente pagos — regime de caixa (art. 204).',
    base: 'LC 214, art. 204',
  },
  {
    titulo: 'Dedução da intermediação',
    regra:
      'A administradora pode deduzir da base de cálculo os valores referentes aos serviços de intermediação (art. 204, §1º).',
    base: 'LC 214, art. 204, §1º',
  },
  {
    titulo: 'Uso da carta de crédito',
    regra:
      'A aquisição com carta de crédito segue as normas gerais de incidência — exceto imóvel (regime imobiliário) e bens/servios com regime diferenciado. A administradora NÃO responde pelos tributos da aquisição (art. 204, §2º).',
    base: 'LC 214, art. 204, §2º',
  },
  {
    titulo: 'Contemplação não é fato gerador',
    regra:
      'O tributo é devido apenas na aquisição do bem com a carta — o sorteio ou lance em si não gera fato gerador (consequência do regime de caixa da taxa).',
    base: 'LC 214, art. 204 (sistemática)',
  },
  {
    titulo: 'Execução de garantia fiduciária',
    regra:
      'A consolidação da propriedade do bem pelo grupo NÃO sofre incidência (art. 204, §3º, I). Na alienação pelo grupo: sem incidência se o consorciado não for contribuinte; com incidência nas mesmas regras do consorciado, se contribuinte (§3º, II). O adquirente recebe as mesmas regras (§3º, III).',
    base: 'LC 214, art. 204, §3º',
  },
  {
    titulo: 'Crédito da taxa de administração',
    regra:
      'O contribuinte do regime regular que paga a taxa de administração apropria créditos do IBS/CBS com base nos valores pagos pelo fornecedor sobre esses serviços (art. 205).',
    base: 'LC 214, art. 205',
  },
  {
    titulo: 'Intermediação de consórcios',
    regra:
      'Os serviços de intermediação de consórcios (corretoras etc.) sujeitam-se à incidência sobre o valor da operação pela mesma alíquota aplicável à taxa de administração (art. 206).',
    base: 'LC 214, art. 206',
  },
]

// ---------- 6D: Serviços financeiros ----------
const FINANCEIRO_LISTA = [
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

const FINANCEIRO_REGRAS = [
  {
    titulo: 'Base de cálculo: receitas com deduções',
    regra:
      'A base é composta das receitas das operações, com as deduções previstas no capítulo (art. 185). Aplica-se à totalidade da contraprestação, independentemente do local da operação (art. 182, p.ú.).',
    base: 'LC 214, arts. 182, p.ú. e 185',
  },
  {
    titulo: 'Deduções nas operações de crédito, câmbio e títulos',
    regra:
      'Deduzem-se: despesas financeiras de captação; despesas de câmbio; perdas com títulos; encargos financeiros de instrumentos de dívida; perdas na recebibilidade de créditos (regras do IR); despesas com assessores/consultores não empregados (art. 192).',
    base: 'LC 214, art. 192',
  },
  {
    titulo: 'Arranjos de pagamento',
    regra:
      'Credenciamento, captura, processamento e liquidação de transações, taxa de desconto, locação de terminais e softwares (art. 214). A relação emissor↔portador segue normas gerais, salvo crédito (art. 214, §2º).',
    base: 'LC 214, art. 214',
  },
  {
    titulo: 'Quem está sujeito',
    regra:
      'Pessoas físicas e jurídicas supervisionadas pelo Banco Central, CVM, Previc ou SUSEP (art. 183) — bancos, seguradoras, administradoras de consórcio, corretoras etc.',
    base: 'LC 214, art. 183',
  },
]

// ---------- 6E: Simples Nacional ----------
const SIMPLES_REGRAS = [
  {
    titulo: 'IBS dentro do DAS',
    regra:
      'O IBS é recolhido no Simples Nacional (DAS) para empresas com receita até R$ 3,6 milhões/ano (LC 123, art. 13-A, incluído pela LC 214). A CBS não entra no DAS — segue apuração própria.',
    base: 'LC 123, art. 13-A; LC 214',
  },
  {
    titulo: 'Alíquotas de teste na transição',
    regra:
      '2026: IBS estadual 0,1% e CBS 0,9% (com compensação com PIS/Cofins — arts. 343 e 346). 2027–2028: IBS 0,05% estadual + 0,05% municipal e CBS reduzida em 0,1 p.p. (arts. 344 e 347).',
    base: 'LC 214, arts. 343–347',
  },
  {
    titulo: 'Opção e janelas',
    regra:
      'A opção pelo regime de recolhimento do IBS no Simples segue as janelas da LC 123 (setembro, efeitos no ano seguinte). Resoluções CGSN 190–192/2026 regulamentam.',
    base: 'LC 123; Res. CGSN 190–192/2026',
  },
  {
    titulo: 'NF obrigatória com destaque',
    regra:
      'O optante deve emitir documento fiscal eletrônico com destaque do IBS/CBS nas operações — condição para o adquirente apropriar crédito.',
    base: 'LC 214 (sistemática); Res. CGSN',
  },
  {
    titulo: 'Crédito presumido de importação',
    regra:
      'Contribuinte habilitado sujeito ao regime regular ou ao Simples Nacional tem crédito presumido de IBS relativo à importação (arts. 444 e 462).',
    base: 'LC 214, arts. 444 e 462',
  },
]

// ---------- 6F: Profissionais regulamentados e plataformas ----------
const PROFISSIONAIS = [
  {
    titulo: 'Redução de 30%',
    regra:
      'Serviços prestados por profissionais com atividade intelectual de natureza científica, literária ou artística, submetidos a conselho profissional: administradores, advogados, arquitetos, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, profissionais de educação física, engenheiros e agrônomos, estatísticos, médicos veterinários e zootecnistas, museólogos, químicos, relações públicas, técnicos industriais e técnicos agrícolas (art. 127).',
    base: 'LC 214, art. 127',
    sim: 'serviços jurídicos',
  },
  {
    titulo: 'Requisitos da pessoa jurídica',
    regra:
      'A redução vale para PJ que cumpra cumulativamente: sócios com habilitação relacionada ao objeto social e submetidos a conselho; sem sócio pessoa jurídica; não ser sócia de outra PJ; não exercer atividade diversa das habilitações; serviços da atividade-fim prestados diretamente pelos sócios (art. 127, §1º, II). União de diferentes profissionais é permitida (§2º, II).',
    base: 'LC 214, art. 127, §1º–§2º',
  },
  {
    titulo: 'Exceção (educação física)',
    regra:
      'A regra dos §1º e §2º não se aplica à prestação de serviços por pessoa jurídica relacionada à profissão de profissional de educação física (art. 127, §3º).',
    base: 'LC 214, art. 127, §3º',
  },
]

const PLATAFORMAS = [
  {
    titulo: 'Responsabilidade solidária',
    regra:
      'Plataformas digitais — mesmo domiciliadas no exterior — respondem pelo IBS/CBS das operações realizadas por seu intermédio: em substituição ao fornecedor estrangeiro (solidárias com o adquirente); ou solidárias com o fornecedor nacional que não informe os dados exigidos ou não emita documento fiscal eletrônico (art. 22).',
    base: 'LC 214, art. 22',
  },
  {
    titulo: 'O que é plataforma digital',
    regra:
      'Intermediária entre fornecedores e adquirentes em operações não presenciais/eletrônicas que controle ao menos um elemento essencial: cobrança, pagamento, definição de termos e condições ou entrega (art. 22, §1º).',
    base: 'LC 214, art. 22, §1º',
  },
  {
    titulo: 'O que NÃO é plataforma',
    regra:
      'Acesso à internet; serviços de pagamento de instituições autorizadas pelo BC; publicidade; busca/comparação de fornecedores sem cobrança por vendas (art. 22, §2º).',
    base: 'LC 214, art. 22, §2º',
  },
  {
    titulo: 'Fornecedor estrangeiro dispensado de inscrição',
    regra:
      'Na hipótese de substituição, o fornecedor residente no exterior fica dispensado da inscrição (art. 22, §3º) — a plataforma é a responsável direta.',
    base: 'LC 214, art. 22, §3º',
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

function Card({
  titulo,
  regra,
  base,
  icone,
  sim,
}: {
  titulo: string
  regra: string
  base: string
  icone?: React.ReactNode
  sim?: string
}) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-1.5">
      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
        {icone} {titulo}
      </h4>
      <p className="text-xs text-slate-700 leading-relaxed">{regra}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-mono text-slate-500">{base}</p>
        {sim && (
          <a
            href={`${SIM_URL}?q=${encodeURIComponent(sim)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-panorama-navy hover:text-panorama-gold-dark shrink-0"
          >
            <Calculator className="w-3 h-3" /> Simular
          </a>
        )}
      </div>
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
      className={`rounded-xl border p-3.5 ${destaque ? 'bg-panorama-gold/10 border-panorama-gold/60' : 'bg-white border-slate-200'}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </div>
      <div
        className={`mt-1 text-lg font-bold ${destaque ? 'text-panorama-navy' : 'text-slate-900'}`}
      >
        {valor}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  )
}

function BadgeC({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${ok ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}
    >
      {texto}
    </span>
  )
}

function SimuladorConsorcio() {
  const [modo, setModo] = useState<'taxa' | 'carta' | 'garantia' | 'apuracao'>('taxa')
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
      <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
        <strong>Como calcula (LC 214, arts. 204–206):</strong> a administradora tributa{' '}
        <strong>apenas a taxa de administração</strong> — tarifas, comissões, taxas, encargos,
        multas e juros <strong>efetivamente pagos</strong> (regime de caixa), deduzida a
        intermediação (art. 204, §1º). A{' '}
        <strong>contemplação (sorteio ou lance) não é fato gerador</strong>; a aquisição com carta
        de crédito segue as normas gerais ou o regime do bem, e a{' '}
        <strong>administradora não responde</strong> pelos tributos da aquisição (§2º). Na execução
        de garantia, a consolidação não sofre incidência e a alienação segue a condição do
        consorciado (§3º). O consorciado do regime regular apropria crédito da taxa paga (art. 205).
        Simulação didática.
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setModo('taxa')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer ${modo === 'taxa' ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          💰 Taxa & lances
        </button>
        <button
          onClick={() => setModo('carta')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer ${modo === 'carta' ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          🧾 Carta de crédito
        </button>
        <button
          onClick={() => setModo('garantia')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer ${modo === 'garantia' ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          ⚖️ Garantia fiduciária
        </button>
        <button
          onClick={() => setModo('apuracao')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer ${modo === 'apuracao' ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}
        >
          📊 Apuração & créditos/débitos
        </button>
      </div>

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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              1️⃣ Percentuais e valores do cenário
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              2️⃣ Base de cálculo — passo a passo (art. 204)
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              3️⃣ Efeito dos lances — quanto maior o lance, menor a taxa (e o tributo)
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">1️⃣ Percentuais do cenário</h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              2️⃣ O que acontece com a carta de crédito — mapa completo
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              1️⃣ Percentuais e valores do cenário
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              2️⃣ Execução de garantia — mapa completo (art. 204, §3º)
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">1️⃣ Percentuais do cenário</h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              2️⃣ Quem apura o quê — consorciado × consórcio
            </h4>
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
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              3️⃣ Créditos e débitos da atividade — quem credita, quem debita
            </h4>
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
        </>
      )}
    </div>
  )
}

export function SectionOutrosRegimes() {
  const [tab, setTab] = useState<
    'consorcios' | 'financeiros' | 'simples' | 'profissionais' | 'simulador'
  >('consorcios')

  return (
    <section id="outros-regimes" className="scroll-mt-24 space-y-5">
      <div className="border-b-2 border-panorama-gold/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-md bg-panorama-navy text-panorama-gold-light font-bold text-xs ring-1 ring-panorama-gold/50">
            6C
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Consórcios, serviços financeiros, Simples e profissionais regulamentados
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          Demais regimes específicos e diferenciados (LC 214/2025, arts. 127, 182–206, 214, 343–347
          e 444; LC 123, art. 13-A). Texto extraído da{' '}
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

      <div className="flex flex-wrap gap-1.5">
        <AbaButton ativo={tab === 'consorcios'} onClick={() => setTab('consorcios')}>
          🤝 Consórcios
        </AbaButton>
        <AbaButton ativo={tab === 'simulador'} onClick={() => setTab('simulador')}>
          🧮 Simulador de consórcios
        </AbaButton>
        <AbaButton ativo={tab === 'financeiros'} onClick={() => setTab('financeiros')}>
          🏦 Serviços financeiros
        </AbaButton>
        <AbaButton ativo={tab === 'simples'} onClick={() => setTab('simples')}>
          📋 Simples Nacional
        </AbaButton>
        <AbaButton ativo={tab === 'profissionais'} onClick={() => setTab('profissionais')}>
          ⚖️ Profissionais e plataformas
        </AbaButton>
      </div>

      {tab === 'consorcios' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Resumo:</strong> a administradora tributa apenas a taxa de administração (regime
            de caixa, com dedução da intermediação); a contemplação não é fato gerador; a carta de
            crédito segue as normas gerais; a execução de garantia não sofre incidência na
            consolidação.
          </div>
          {CONSORCIO_PONTOS.map((p) => (
            <Card
              key={p.titulo}
              titulo={p.titulo}
              regra={p.regra}
              base={p.base}
              icone={<Handshake className="w-4 h-4 text-panorama-gold-dark" />}
            />
          ))}
        </div>
      )}

      {tab === 'simulador' && <SimuladorConsorcio />}

      {tab === 'financeiros' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-panorama-gold-dark" /> O que são serviços
              financeiros (art. 182)
            </h4>
            <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside leading-relaxed">
              {FINANCEIRO_LISTA.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="text-[11px] font-mono text-slate-500">LC 214, art. 182</p>
          </div>
          {FINANCEIRO_REGRAS.map((r) => (
            <Card
              key={r.titulo}
              titulo={r.titulo}
              regra={r.regra}
              base={r.base}
              icone={<Landmark className="w-4 h-4 text-panorama-gold-dark" />}
            />
          ))}
        </div>
      )}

      {tab === 'simples' && (
        <div className="space-y-3">
          {SIMPLES_REGRAS.map((r) => (
            <Card
              key={r.titulo}
              titulo={r.titulo}
              regra={r.regra}
              base={r.base}
              icone={<Percent className="w-4 h-4 text-blue-600" />}
            />
          ))}
        </div>
      )}

      {tab === 'profissionais' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-panorama-gold/10 border border-panorama-gold/50 text-sm text-slate-800">
            <strong>Profissionais regulamentados (art. 127):</strong> redução de{' '}
            <strong>30%</strong> nas alíquotas — com requisitos objetivos para a pessoa jurídica.
          </div>
          {PROFISSIONAIS.map((p) => (
            <Card
              key={p.titulo}
              titulo={p.titulo}
              regra={p.regra}
              base={p.base}
              icone={<Users className="w-4 h-4 text-indigo-600" />}
              sim={p.sim}
            />
          ))}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-panorama-gold-dark" /> Plataformas digitais (art.
              22)
            </h4>
            {PLATAFORMAS.map((p) => (
              <div
                key={p.titulo}
                className="space-y-1 pt-1.5 border-t border-slate-50 first:border-0"
              >
                <p className="text-xs font-bold text-slate-800">{p.titulo}</p>
                <p className="text-xs text-slate-700 leading-relaxed">{p.regra}</p>
                <p className="text-[11px] font-mono text-slate-500">{p.base}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
