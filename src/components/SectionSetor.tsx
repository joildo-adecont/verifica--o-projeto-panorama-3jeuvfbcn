import { useState } from 'react'
import { SimuladorSetor } from '@/components/SimuladorSetor'
import {
  Fuel,
  HeartPulse,
  GraduationCap,
  UtensilsCrossed,
  UsersRound,
  Trophy,
  Ship,
  Globe,
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Calculator,
  Layers,
} from 'lucide-react'

/**
 * SEÇÕES SETORIAIS — base única para os 8 setores novos (02/11/2026)
 * ==================================================================
 *
 * Pedido do CEO: "Introduza as mudanças novas, construa também as oito seções
 * setoriais."
 *
 * ── POR QUE UM COMPONENTE SÓ, COM DADOS, E NÃO OITO ARQUIVOS ──
 * As seis seções setoriais que já existem (6A a 6F) têm cada uma ~600 linhas de
 * layout próprio. Repetir esse padrão oito vezes criaria oito lugares para o
 * mesmo defeito aparecer e oito arquivos para manter quando a lei mudar.
 *
 * Aqui a ESTRUTURA é uma só e o CONTEÚDO é dado. Cada setor declara:
 *   · base legal (o artigo que cria o regime)
 *   · como o tributo incide (fato gerador do setor)
 *   · as regras que o distinguem
 *   · o que muda na prática para o contribuinte
 *   · o que ainda depende de regulamento (declarado, não escondido)
 *
 * ── HONESTIDADE SOBRE O ESTÁGIO ──
 * Estas seções são o MAPA do regime: base legal, incidência, regras e pontos de
 * atenção, tudo rastreável ao artigo. Não substituem o simulador numérico
 * daquele setor — que entra depois, quando o CEO priorizar a ordem. Cada seção
 * diz isso na tela, para ninguém calcular imposto com uma página de resumo.
 */

interface Regra {
  titulo: string
  detalhe: string
  artigo: string
}

interface Setor {
  id: string
  numero: string
  nome: string
  Icon: React.ComponentType<{ className?: string }>
  base: string
  /** como o tributo incide neste setor */
  incidencia: string
  /** o que distingue o regime */
  regras: Regra[]
  /** efeito prático para quem está no setor */
  pratica: string[]
  /** o que ainda não está fechado — declarado de propósito */
  pendente?: string
  /** seções irmãs do mesmo domínio, para navegação lateral */
  relacionadas: { label: string; href: string }[]
}

const SETORES: Setor[] = [
  {
    id: 'combustiveis',
    numero: '20',
    nome: 'Combustíveis e Energia',
    Icon: Fuel,
    base: 'LC 214/2025, arts. 172 a 180',
    incidencia:
      'O IBS e a CBS incidem UMA ÚNICA VEZ sobre a operação com combustível, ' +
      'qualquer que seja a finalidade — inclusive quando a operação se inicia no exterior.',
    regras: [
      {
        titulo: 'Alíquota específica por unidade',
        detalhe:
          'A alíquota é ad rem: valor fixo por litro, quilo ou outra unidade de medida, e não percentual sobre o preço. Isso tira o tributo da variação do preço do barril.',
        artigo: 'Art. 173',
      },
      {
        titulo: 'Incidência monofásica',
        detalhe:
          'Cobra-se uma vez na cadeia. Quem revende não recolhe de novo — o que evita o efeito cascata que existia no regime anterior.',
        artigo: 'Art. 172',
      },
      {
        titulo: 'Combustíveis alcançados',
        detalhe:
          'Gasolina, diesel, etanol, GLP, querosene de aviação, óleo combustível, gás natural e outros listados no capítulo.',
        artigo: 'Art. 172, I',
      },
      {
        titulo: 'Ajuste anual por ato conjunto',
        detalhe:
          'Os valores por unidade são atualizados por ato conjunto da Receita Federal e do CGIBS, com base na carga tributária atual do produto.',
        artigo: 'Art. 174',
      },
    ],
    pratica: [
      'O preço na bomba deixa de embutir percentual e passa a embutir valor fixo.',
      'O produtor e o importador são os pontos de recolhimento; o posto revendedor não recolhe.',
      'O crédito é apropriado por quem compra para uso industrial ou revenda, conforme o caso.',
    ],
    pendente:
      'Os valores definitivos por unidade dependem do ato conjunto anual. Sem esse número publicado, não há cálculo exato — só a estrutura.',
    relacionadas: [
      { label: 'Fato Gerador', href: '#secao-2' },
      { label: 'Tabela Geral dos Anexos', href: '#tabela-geral' },
      { label: 'Imposto Seletivo', href: '#secao-6' },
    ],
  },
  {
    id: 'saude',
    numero: '21',
    nome: 'Saúde e Planos',
    Icon: HeartPulse,
    base: 'LC 214/2025 — regime específico (planos) e diferenciado (saúde)',
    incidencia:
      'Dois tratamentos convivem: os PLANOS DE ASSISTÊNCIA À SAÚDE têm regime ' +
      'específico, com base de cálculo própria; os serviços de saúde e os ' +
      'dispositivos médicos têm redução de alíquota.',
    regras: [
      {
        titulo: 'Planos de saúde com base própria',
        detalhe:
          'A base de cálculo do plano não é o valor bruto da mensalidade: considera as provisões técnicas e a remuneração própria do plano, conforme o regime específico.',
        artigo: 'Regime específico — planos de assistência à saúde',
      },
      {
        titulo: 'Redução de 60% em saúde',
        detalhe:
          'Serviços de saúde e dispositivos médicos listados recebem alíquota reduzida em 60%, desde que cumpridos os requisitos.',
        artigo: 'Regime diferenciado',
      },
      {
        titulo: 'Medicamentos e dispositivos',
        detalhe:
          'Há lista própria de dispositivos médicos e de acessibilidade; o enquadramento depende do item estar expressamente previsto.',
        artigo: 'Anexos da LC 214',
      },
      {
        titulo: 'Requisitos para o serviço de saúde',
        detalhe:
          'A redução exige que o prestador atenda aos requisitos legais do setor — não basta o CNAE.',
        artigo: 'Regime diferenciado',
      },
    ],
    pratica: [
      'Hospital e clínica precisam confirmar o enquadramento antes de aplicar 60%.',
      'A operadora de plano apura por base própria, não sobre a mensalidade cheia.',
      'Medicamento e dispositivo fora da lista não herdam a redução.',
    ],
    pendente:
      'A lista final de dispositivos e itens de acessibilidade vem por anexo; a inclusão de um produto novo depende de ato posterior.',
    relacionadas: [
      { label: 'Isenções e Alíquotas', href: '#secao-5' },
      { label: 'Cesta Básica', href: '#secao-3' },
      { label: 'Imunidades', href: '#secao-4' },
    ],
  },
  {
    id: 'educacao',
    numero: '22',
    nome: 'Educação',
    Icon: GraduationCap,
    base: 'LC 214/2025 — serviços de educação (regime diferenciado)',
    incidencia:
      'Os serviços de educação têm redução de 60% na alíquota, condicionada a ' +
      'requisitos do prestador — não é automática para qualquer curso.',
    regras: [
      {
        titulo: 'Redução de 60%',
        detalhe:
          'A alíquota do IBS e da CBS é reduzida em 60% para os serviços de educação que atendam aos requisitos da lei.',
        artigo: 'Regime diferenciado',
      },
      {
        titulo: 'Quem alcança',
        detalhe:
          'Instituições de ensino regular e as demais atividades educacionais expressamente previstas. Curso livre sem previsão fica no regime regular.',
        artigo: 'Regime diferenciado',
      },
      {
        titulo: 'Requisitos cumulativos',
        detalhe:
          'A lei exige que o prestador cumpra as condições do setor; descumprir uma delas devolve a operação à alíquota cheia.',
        artigo: 'Regime diferenciado',
      },
      {
        titulo: 'Material didático',
        detalhe:
          'Itens de material didático têm tratamento próprio nos anexos, separado do serviço de ensino.',
        artigo: 'Anexos',
      },
    ],
    pratica: [
      'Escola e faculdade confirmam o enquadramento antes de faturar com 60%.',
      'Curso livre precisa verificar se está na lista — se não estiver, paga cheio.',
      'Mensalidade e material didático podem ter tratamentos diferentes na mesma nota.',
    ],
    relacionadas: [
      { label: 'Isenções e Alíquotas', href: '#secao-5' },
      { label: 'Profissionais e Plataformas', href: '#profissionais-plataformas' },
      { label: 'Cesta Básica', href: '#secao-3' },
    ],
  },
  {
    id: 'turismo',
    numero: '23',
    nome: 'Bares, Restaurantes e Turismo',
    Icon: UtensilsCrossed,
    base: 'LC 214/2025 — regime específico de bares, restaurantes, hotelaria, parques e agências',
    incidencia:
      'Alimentação, hotelaria, parques de diversão e temáticos, transporte ' +
      'coletivo de turismo e agências têm regime específico de apuração.',
    regras: [
      {
        titulo: 'Regime específico de apuração',
        detalhe:
          'O setor não segue o regime regular geral: tem regra própria de base e de apuração, prevista no capítulo dos regimes específicos.',
        artigo: 'Regime específico',
      },
      {
        titulo: 'Alimentação e bebidas',
        detalhe:
          'O tratamento de alimentação fora do lar é distinto do da cesta básica — não confundir venda de alimento em supermercado com serviço de restaurante.',
        artigo: 'Regimes específicos',
      },
      {
        titulo: 'Hotelaria e parques',
        detalhe:
          'Hotéis, parques de diversão e parques temáticos entram nominalmente no regime, com as mesmas regras de apuração do setor.',
        artigo: 'Regime específico',
      },
      {
        titulo: 'Agências e transporte turístico',
        detalhe:
          'Agências de turismo e transporte coletivo de passageiros no contexto turístico também são listados no regime.',
        artigo: 'Regime específico',
      },
    ],
    pratica: [
      'Restaurante apura pelo regime do setor, não pelo regular geral.',
      'Hotel e parque seguem a mesma regra de apuração do grupo.',
      'A venda de alimento para consumo no local e para levar têm tratamentos distintos.',
    ],
    pendente:
      'As condições de enquadramento e o detalhamento por atividade dependem de regulamento do CGIBS.',
    relacionadas: [
      { label: 'Cesta Básica', href: '#secao-3' },
      { label: 'Simples Nacional', href: '#simples' },
      { label: 'Fato Gerador', href: '#secao-2' },
    ],
  },
  {
    id: 'cooperativas',
    numero: '24',
    nome: 'Cooperativas',
    Icon: UsersRound,
    base: 'LC 214/2025, arts. 271 e 272',
    incidencia:
      'O ATO COOPERATIVO tem tratamento próprio: a operação entre o cooperado ' +
      'e a cooperativa não é tratada como venda comum ao mercado.',
    regras: [
      {
        titulo: 'Ato cooperativo',
        detalhe:
          'A operação praticada entre o associado e a cooperativa, para cumprir o objeto social, recebe tratamento específico previsto na lei.',
        artigo: 'Art. 271',
      },
      {
        titulo: 'Crédito presumido',
        detalhe:
          'Há previsão de crédito presumido para determinadas operações do setor, com percentual definido em lei.',
        artigo: 'Art. 272',
      },
      {
        titulo: 'Resultado da cooperativa',
        detalhe:
          'A distribuição de resultado ao cooperado não se confunde com receita de venda — a distinção é o que evita bitributação no setor.',
        artigo: 'Art. 271',
      },
      {
        titulo: 'Requisitos do cooperado',
        detalhe:
          'O tratamento depende de o vínculo ser cooperativo de verdade, conforme a lei cooperativista; sociedade mercantil disfarçada não alcança o regime.',
        artigo: 'Art. 271',
      },
    ],
    pratica: [
      'A cooperativa separa, na apuração, o ato cooperativo do ato não cooperativo.',
      'O crédito presumido só se aplica nas hipóteses expressas — não é geral.',
      'Documentar o vínculo cooperativo é o que sustenta o tratamento na fiscalização.',
    ],
    relacionadas: [
      { label: 'Agronegócio', href: '#agronegocio' },
      { label: 'Simples Nacional', href: '#simples' },
      { label: 'Créditos e Anexos', href: '#secao-7' },
    ],
  },
  {
    id: 'futebol',
    numero: '25',
    nome: 'Sociedade Anônima do Futebol',
    Icon: Trophy,
    base: 'LC 214/2025 — regime específico da SAF',
    incidencia:
      'A Sociedade Anônima do Futebol tem regime específico, com atenção ao ' +
      'ponto mais sensível do setor: a transferência de atletas.',
    regras: [
      {
        titulo: 'Regime específico próprio',
        detalhe:
          'A SAF não apura pelo regime regular geral: a lei prevê regramento próprio para o setor.',
        artigo: 'Regime específico — SAF',
      },
      {
        titulo: 'Transferência de atletas',
        detalhe:
          'A operação de cessão de direitos desportivos tem tratamento próprio, por ser a receita mais relevante de um clube.',
        artigo: 'Regime específico — SAF',
      },
      {
        titulo: 'Formação de atleta',
        detalhe:
          'Valores ligados à formação e ao mecanismo de solidariedade seguem regime próprio e não se confundem com a receita de venda.',
        artigo: 'Regime específico — SAF',
      },
      {
        titulo: 'Demais receitas do clube',
        detalhe:
          'Bilheteria, patrocínio e direitos de transmissão são analisados separadamente, cada um conforme sua natureza.',
        artigo: 'Regime específico — SAF',
      },
    ],
    pratica: [
      'A transferência de atleta é apurada em separado das receitas ordinárias.',
      'O clube mantém segregação contábil entre as naturezas de receita.',
      'Contrato de cessão e contrato de imagem não recebem o mesmo tratamento.',
    ],
    pendente: 'O detalhamento da apuração sobre direitos desportivos depende de regulamento.',
    relacionadas: [
      { label: 'Fato Gerador', href: '#secao-2' },
      { label: 'Profissionais e Plataformas', href: '#profissionais-plataformas' },
      { label: 'Regimes Específicos', href: '#secao-6' },
    ],
  },
  {
    id: 'exterior',
    numero: '26',
    nome: 'Comércio Exterior e ZFM',
    Icon: Ship,
    base: 'LC 214/2025, arts. 93 e ss. · Decreto 12.955/2026',
    incidencia:
      'Nas operações de comércio exterior vigora o princípio do destino: ' +
      'exportação desonerada, importação tributada, com regimes aduaneiros ' +
      'especiais preservados.',
    regras: [
      {
        titulo: 'Exportação desonerada',
        detalhe:
          'A exportação não é tributada pelo IBS e pela CBS, mantendo-se o crédito das etapas anteriores — é o que preserva a competitividade do produto brasileiro.',
        artigo: 'Arts. 93 e ss.',
      },
      {
        titulo: 'Importação tributada',
        detalhe:
          'A importação é fato gerador. O tributo é calculado sobre a base de importação, com as alíquotas do destino.',
        artigo: 'Arts. 93 e ss.',
      },
      {
        titulo: 'Zona Franca de Manaus',
        detalhe:
          'A ZFM mantém tratamento diferenciado, com previsão constitucional própria que a reforma preservou — é exceção e não regra.',
        artigo: 'Arts. 439 a 457',
      },
      {
        titulo: 'REPORTO e drawback',
        detalhe:
          'Os regimes aduaneiros especiais de petróleo e gás e de drawback continuam com suspensão, nas condições da legislação aduaneira.',
        artigo: 'Art. 93',
      },
    ],
    pratica: [
      'Exportador mantém crédito e não paga IBS/CBS na saída.',
      'Importador apura no desembaraço, sobre a base de importação.',
      'Empresa na ZFM verifica o enquadramento antes de aplicar o diferencial.',
      'Regime aduaneiro especial exige habilitação e controle do benefício.',
    ],
    relacionadas: [
      { label: 'Imunidades', href: '#secao-4' },
      { label: 'Tabela Geral dos Anexos', href: '#tabela-geral' },
      { label: 'Fontes Primárias', href: '#fontes-primarias' },
    ],
  },
  {
    id: 'diplomatico',
    numero: '27',
    nome: 'Missões Diplomáticas',
    Icon: Globe,
    base: 'LC 214/2025 — missões diplomáticas, repartições internacionais e tratados',
    incidencia:
      'As operações alcançadas por tratados internacionais e as realizadas por ' +
      'missões diplomáticas e repartições internacionais têm regime específico.',
    regras: [
      {
        titulo: 'Regime específico',
        detalhe:
          'A lei trata em capítulo próprio as operações de missões diplomáticas, repartições internacionais e as alcançadas por tratados.',
        artigo: 'Regime específico',
      },
      {
        titulo: 'Prevalência do tratado',
        detalhe:
          'Onde há tratado internacional, aplica-se o que ele dispõe — a lei interna não afasta obrigação assumida em tratado.',
        artigo: 'Regime específico',
      },
      {
        titulo: 'Abrangência restrita',
        detalhe:
          'O regime alcança a missão e seus integrantes nos limites do tratado; não se estende a empresa privada que apenas presta serviço à missão.',
        artigo: 'Regime específico',
      },
    ],
    pratica: [
      'A missão confirma no tratado aplicável o alcance da desoneração.',
      'Fornecedor de missão estrangeira verifica se a operação está coberta.',
      'A documentação do vínculo é o que sustenta o tratamento.',
    ],
    pendente:
      'Cada tratado tem alcance próprio; a análise é caso a caso e depende do texto do acordo.',
    relacionadas: [
      { label: 'Imunidades', href: '#secao-4' },
      { label: 'Normas', href: '#secao-1' },
      { label: 'Fontes Primárias', href: '#fontes-primarias' },
    ],
  },
]

/* ────────────────────────────── componente ────────────────────────────── */

export function SectionSetor({ id }: { id: string }) {
  const setor = SETORES.find((s) => s.id === id)
  const [aba, setAba] = useState<'regras' | 'pratica' | 'simulador' | 'base'>('regras')

  if (!setor) return null
  const Icon = setor.Icon

  return (
    <section className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      {/* cabeçalho */}
      <header className="mb-4 rounded-xl border border-panorama-gold/40 bg-panorama-navy p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-panorama-gold/20">
            <Icon className="h-6 w-6 text-panorama-gold" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-panorama-gold">
              Setor {setor.numero}
            </p>
            <h1 className="text-lg font-bold text-white sm:text-xl">{setor.nome}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
              <Scale className="h-3 w-3 shrink-0" />
              {setor.base}
            </p>
          </div>
        </div>
      </header>

      {/* como incide */}
      <div className="mb-4 rounded-lg border-l-4 border-panorama-gold bg-amber-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
          Como o tributo incide neste setor
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{setor.incidencia}</p>
      </div>

      {/* abas */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(
          [
            ['regras', 'Regras do regime', Layers],
            ['pratica', 'Na prática', CheckCircle2],
            ['simulador', 'Simulador', Calculator],
            ['base', 'Base legal', BookOpen],
          ] as const
        ).map(([k, rotulo, I]) => (
          <button
            key={k}
            onClick={() => setAba(k)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 text-[12px] font-bold transition-colors ${
              aba === k
                ? 'border-panorama-navy bg-panorama-navy text-white'
                : 'border-slate-300 bg-white text-slate-600 hover:border-panorama-gold'
            }`}
          >
            <I className="h-3.5 w-3.5" />
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'regras' && (
        <div className="space-y-2">
          {setor.regras.map((r, i) => (
            <article key={i} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[13px] font-bold text-panorama-navy">{r.titulo}</h3>
                <span className="shrink-0 rounded bg-panorama-gold/15 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-amber-800">
                  {r.artigo}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{r.detalhe}</p>
            </article>
          ))}
        </div>
      )}

      {aba === 'pratica' && (
        <ul className="space-y-2">
          {setor.pratica.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-[12px] leading-relaxed text-slate-700">{p}</span>
            </li>
          ))}
        </ul>
      )}

      {aba === 'simulador' && <SimuladorSetor id={setor.id} />}

      {aba === 'base' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Base legal
            </p>
            <p className="mt-1 font-mono text-[12px] text-panorama-navy">{setor.base}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Onde conferir o texto
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {setor.relacionadas.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded border border-slate-300 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700 hover:border-panorama-gold"
                >
                  {r.label}
                  <ArrowRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ressalva honesta */}
      {setor.pendente && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
              O que ainda depende de regulamento
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-700">{setor.pendente}</p>
          </div>
        </div>
      )}

      <p className="mt-4 rounded-lg bg-slate-100 p-3 text-[11px] leading-relaxed text-slate-600">
        <b>Esta seção é o mapa do regime</b> — base legal, incidência, regras e pontos de atenção,
        todos rastreáveis ao artigo. O simulador numérico deste setor entra em etapa seguinte; para
        calcular agora, use{' '}
        <a href="#busca-avancada" className="font-bold text-panorama-navy underline">
          Busca Avançada
        </a>{' '}
        ou os simuladores da Seção 3.
      </p>
    </section>
  )
}

export const SETORES_DISPONIVEIS = SETORES.map((s) => ({
  id: s.id,
  nome: s.nome,
  numero: s.numero,
}))
