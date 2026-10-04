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

export function SectionOutrosRegimes() {
  const [tab, setTab] = useState<'consorcios' | 'financeiros' | 'simples' | 'profissionais'>(
    'consorcios',
  )

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
