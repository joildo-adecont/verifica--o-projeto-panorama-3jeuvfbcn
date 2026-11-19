/**
 * CONFIGURAÇÃO DOS 10 AGENTES ESPECIALISTAS — propriedades de apresentação.
 *
 * Extrai do antigo padrão dos wrappers SectionEspecialista* tudo que a nova
 * tela "Pesquisa dos Agentes" (SectionPesquisaAgentes) precisa para montar o
 * TelaAgenteEspecialista de cada segmento. Os wrappers antigos continuam
 * existindo e montados no roteador (compat de rotas #agente-*) — esta config
 * NÃO substitui as chamadas deles ao backend.
 */
import {
  Scale,
  Percent,
  Calculator,
  Building2,
  Lightbulb,
  Target,
  Landmark,
  HardHat,
  PackageCheck,
  Briefcase,
} from 'lucide-react'
import type { SegmentoEspecialista } from '@/services/agenteEspecialista'

export interface ConfigAgente {
  segmento: SegmentoEspecialista
  curto: string
  titulo: string
  subtitulo: string
  badge: string
  descricao: string
  corPrimaria: string
  Icon: React.ComponentType<{ className?: string }>
  exemplosProntos: string[]
}

export const CONFIG_AGENTES: ConfigAgente[] = [
  {
    segmento: 'juridico',
    curto: 'Jurídico',
    titulo: 'Especialista Jurídico ADECONT',
    subtitulo: 'Análise de conformidade legal, segurança jurídica e teses normativas',
    badge: 'Segmento Jurídico',
    descricao:
      'Agente inteligente de consultoria jurídica da ADECONT especializado em controle de legalidade, interpretação sistemática do Direito Tributário e Administrativo, hermenêutica das Leis Complementares 214/2025 e 227/2026, limites regulatórios do CGIBS e garantias de segurança jurídica dos contribuintes.',
    corPrimaria: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    Icon: Scale,
    exemplosProntos: [
      'Qual o alcance constitucional da imunidade do art. 150, VI da CF para IBS e CBS?',
      'O Comitê Gestor do IBS pode criar obrigações acessórias sem amparo em Lei Complementar?',
      'Como a EC 132/2023 protege os contratos de longo prazo e a segurança jurídica?',
    ],
  },
  {
    segmento: 'tributario',
    curto: 'Tributário',
    titulo: 'Especialista Tributário ADECONT',
    subtitulo: 'Regimes, alíquotas, classificações e apuração por setor',
    badge: 'Segmento Tributário',
    descricao:
      'Agente inteligente de consultoria tributária da ADECONT especializado em IBS, CBS, Imposto Seletivo, regimes específicos da LC 214/2025, classificações (NCM, cClassTrib, CST, CEST, cBenef) e apuração por setor, com resposta fundamentada em atos normativos e fontes oficiais.',
    corPrimaria: 'text-violet-700 bg-violet-50 border-violet-200',
    Icon: Percent,
    exemplosProntos: [
      'Como classificar cClassTrib para operações com redução de base da cesta básica?',
      'Quais setores têm regime específico na LC 214/2025 e quais as alíquotas de referência?',
      'Qual a diferença entre CST e cClassTrib na apuração do IBS/CBS?',
    ],
  },
  {
    segmento: 'contabil',
    curto: 'Contábil',
    titulo: 'Especialista Contábil ADECONT',
    subtitulo: 'Lançamentos, escrituração, plano de contas e conciliação',
    badge: 'Segmento Contábil',
    descricao:
      'Agente inteligente de consultoria contábil da ADECONT especializado em lançamentos, cálculo por fora, plano de contas, conciliação e fechamento, com atenção às transições contábeis da Reforma Tributária (créditos presumidos, saldos de créditos e transição IBS/CBS).',
    corPrimaria: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Icon: Calculator,
    exemplosProntos: [
      'Como registrar o crédito presumido do IBS na escrituração?',
      'Quais contas do plano de contas exigem atenção na transição ao IBS/CBS?',
      'Como conciliar créditos acumulados do regime antigo com os créditos da reforma?',
    ],
  },
  {
    segmento: 'administrativo',
    curto: 'Administrativo',
    titulo: 'Especialista Administrativo ADECONT',
    subtitulo: 'Rotinas, prazos, fluxos de entrega e gestão do escritório',
    badge: 'Segmento Administrativo',
    descricao:
      'Agente inteligente de consultoria administrativa da ADECONT especializado em fusão administrativa, fluxos de entrega, rotinas, prazos, gestão de clientes e governança do escritório.',
    corPrimaria: 'text-slate-700 bg-slate-100 border-slate-300',
    Icon: Building2,
    exemplosProntos: [
      'Como organizar o fluxo de entrega mensal de documentos dos clientes?',
      'Qual a rotina recomendada de conferência de pendências por responsável?',
      'Como padronizar a governança da carteira entre as equipes?',
    ],
  },
  {
    segmento: 'consultor-contabil-estrategico',
    curto: 'Consultor Contábil',
    titulo: 'Consultor Contábil Estratégico',
    subtitulo: 'Indicadores, decisões do negócio, materiais e treinamento',
    badge: 'UON 27 · Consultor',
    descricao:
      'Agente inteligente da ADECONT que apoia gestão, contabilidade, fiscal e materiais para equipes e clientes — memorandos, treinamentos e apontamento de indicadores estratégicos do negócio.',
    corPrimaria: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    Icon: Lightbulb,
    exemplosProntos: [
      'Quais indicadores acompanhar mensalmente na carteira de clientes?',
      'Monte um memorando de treinamento sobre apuração do IBS para a equipe.',
      'Como precificar serviços contábeis considerando o novo modelo de créditos?',
    ],
  },
  {
    segmento: 'gestao-estrategica',
    curto: 'Gestão Estratégica',
    titulo: 'Especialista em Gestão Estratégica',
    subtitulo: 'Planejamento, precificação e risco',
    badge: 'UON 27 · Gestão',
    descricao:
      'Agente inteligente da ADECONT que orienta decisões contábeis, fiscais e financeiras para a gestão estratégica — planejamento, precificação, risco e cenários.',
    corPrimaria: 'text-amber-700 bg-amber-50 border-amber-200',
    Icon: Target,
    exemplosProntos: [
      'Como montar um planejamento de transição à Reforma Tributária em 3 cenários?',
      'Quais riscos fiscais priorizar num diagnóstico de carteira?',
      'Como precificar levando em conta o Imposto Seletivo?',
    ],
  },
  {
    segmento: 'reforma-tributaria',
    curto: 'Reforma Tributária',
    titulo: 'Consultor da Reforma Tributária',
    subtitulo: 'Todos os atos normativos e a transição',
    badge: 'UON 27 · Reforma',
    descricao:
      'Agente inteligente da ADECONT que orienta empresas e contadores sobre os impactos e a transição da Reforma Tributária, abrangendo todos os tipos de atos normativos — Resoluções CGIBS, Decretos, Portarias, Atos e alterações legislativas.',
    corPrimaria: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
    Icon: Landmark,
    exemplosProntos: [
      'Quais Resoluções CGIBS já publicadas impactam meu setor?',
      'Qual o cronograma de transição do IBS/CBS por tipo de empresa?',
      'Como acompanhar novos Decretos e Portarias da Reforma?',
    ],
  },
  /* ── TRIO SUGERIDO (19/11/2026) — +3 especialistas nativos, total 10 ── */
  {
    segmento: 'trabalhista-previdenciario',
    curto: 'Trabalhista e Previdenciário',
    titulo: 'Especialista Trabalhista e Previdenciário',
    subtitulo: 'CLT, encargos, eSocial e contribuições previdenciárias',
    badge: 'UON 27 · Trabalhista',
    descricao:
      'Agente inteligente da ADECONT que apoia equipes e clientes em questões de CLT, encargos trabalhistas (INSS, FGTS, 13º, férias, adicionais e multas), eventos do eSocial, EFD-Reinf, DCTFWeb e contribuições previdenciárias, cobrindo todos os tipos de atos normativos — Resoluções, Decretos, Portarias, Atos e alterações legislativas.',
    corPrimaria: 'text-rose-700 bg-rose-50 border-rose-200',
    Icon: HardHat,
    exemplosProntos: [
      'Como apurar o INSS e o FGTS sobre horas extras e adicionais?',
      'Quais eventos do eSocial enviar na rescisão de um empregado?',
      'Qual o impacto do FAP e do RAT no custo da folha da empresa?',
    ],
  },
  {
    segmento: 'tributos-indiretos',
    curto: 'Tributos Indiretos',
    titulo: 'Especialista em Tributos Indiretos',
    subtitulo: 'ICMS, IPI, ISS e a transição para IBS/CBS',
    badge: 'UON 27 · Indiretos',
    descricao:
      'Agente inteligente da ADECONT que orienta a apuração e o cumprimento de obrigações de ICMS (Convênios, ST, DIFAL), IPI (TIPI, créditos) e ISS (LC 116/2003), além da transição para IBS/CBS da Reforma Tributária — cobrindo todos os tipos de atos normativos, de Resoluções e Decretos a Portarias, Atos e alterações legislativas.',
    corPrimaria: 'text-teal-700 bg-teal-50 border-teal-200',
    Icon: PackageCheck,
    exemplosProntos: [
      'Como tratar o DIFAL numa venda interestadual a consumidor final?',
      'Quais créditos de IPI são admitidos e quais são vedados?',
      'Como fica a apuração no período de teste de 2026 (0,9% CBS + 0,1% IBS)?',
    ],
  },
  {
    segmento: 'societario-compliance',
    curto: 'Societário e Compliance',
    titulo: 'Especialista Societário e Compliance',
    subtitulo: 'Registros societários, obrigações acessórias e governança',
    badge: 'UON 27 · Societário',
    descricao:
      'Agente inteligente da ADECONT que orienta registros societários (constituição, alterações, incorporação, fusão e cisão), obrigações acessórias (ECD, ECF, DCTFWeb, NIRF, LGPD) e governança para empresas e contadores — cobrindo todos os tipos de atos normativos, de Resoluções a Decretos, Portarias, Atos e alterações legislativas.',
    corPrimaria: 'text-blue-700 bg-blue-50 border-blue-200',
    Icon: Briefcase,
    exemplosProntos: [
      'Quais os passos para incorporar uma subsidiária integralmente detida?',
      'Quais obrigações acessórias uma S.A. precisa cumprir anualmente?',
      'Como estruturar controles internos de compliance no escritório contábil?',
    ],
  },
]
