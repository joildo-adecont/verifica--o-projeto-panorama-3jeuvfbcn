/**
 * NAVEGAÇÃO ÚNICA — fonte única de verdade dos menus do Panorama.
 * O header, a lateral e o novo painel de grupos leem ESTA lista.
 *
 * ── O QUE MUDOU EM 29/10/2026 ──
 * Antes: 24 itens em lista plana, em ordem fora de sequência (a Seção 11 vinha
 * antes da 9), com uma duplicata — "Fontes primárias" aparecia duas vezes, uma
 * dizendo 115 bases e outra 110, ambas com a tecla 'w'. Numa lista plana de 24,
 * o CEO não acha o que procura e a duplicata faz o menu parecer quebrado.
 *
 * Agora: cinco GRUPOS temáticos, cada um com identidade própria (ícone, cor e
 * descrição). Dentro do grupo os itens seguem a ordem numérica oficial. Quem
 * quer "simular" vai ao grupo Simulação; quem quer "ver a lei" vai a
 * Fundamentos. A tecla de cada item continua a mesma — ninguém precisa
 * reaprender os atalhos.
 *
 * ── REGRA ──
 * Somente dados de navegação. Nenhuma função, cálculo ou dado do sistema.
 * Cada item pertence a exatamente UM grupo (sem repetição).
 */
import {
  Scale,
  Factory,
  ShoppingBasket,
  ShieldCheck,
  Percent,
  Layers,
  Paperclip,
  CalendarDays,
  Database,
  ListChecks,
  History,
  Home,
  Tractor,
  Handshake,
  Landmark,
  Smartphone,
  Printer,
  KeyRound,
  MonitorSmartphone,
  Eye,
  Calculator,
  BookOpen,
  Radio,
  Settings2,
  LayoutDashboard,
} from 'lucide-react'

export interface LinkNavegacao {
  href: string
  label: string
  /** rótulo curto para o card grande */
  curto: string
  tecla: string
  numero?: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
  /** uma linha explicando o que há ali — é o que faz o ícone ser intuitivo */
  descricao: string
}

export interface GrupoNavegacao {
  id: string
  nome: string
  /** frase curta: para que serve este grupo */
  proposito: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
  itens: LinkNavegacao[]
}

/* ────────────────────────────── GRUPO 1 ────────────────────────────── */
const FUNDAMENTOS: LinkNavegacao[] = [
  {
    href: '#secao-1',
    label: 'Normas',
    curto: 'Normas',
    tecla: '1',
    numero: '1',
    Icon: Scale,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: 'EC 132, LC 214/2025, LC 227/2026 e os regulamentos',
  },
  {
    href: '#secao-2',
    label: 'Fato Gerador',
    curto: 'Fato gerador',
    tecla: '2',
    numero: '2',
    Icon: Factory,
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
    descricao: 'Quando o tributo incide: fornecimento, pagamento, split payment',
  },
  {
    href: '#secao-3',
    label: 'Cesta Básica',
    curto: 'Cesta básica',
    tecla: '3',
    numero: '3',
    Icon: ShoppingBasket,
    cor: 'text-emerald-600',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
    descricao: 'Alimentos com alíquota zero e exemplos práticos',
  },
  {
    href: '#secao-4',
    label: 'Imunidades',
    curto: 'Imunidades',
    tecla: '4',
    numero: '4',
    Icon: ShieldCheck,
    cor: 'text-teal-600',
    bg: 'bg-teal-50',
    borda: 'border-teal-200',
    descricao: 'O que não é tributado: livros, saúde pública, exportação',
  },
  {
    href: '#secao-5',
    label: 'Isenções e Alíquotas',
    curto: 'Isenções',
    tecla: '5',
    numero: '5',
    Icon: Percent,
    cor: 'text-amber-600',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
    descricao: 'Reduções de 60% e 30%, diferimentos e regimes favorecidos',
  },
]

/* ────────────────────────────── GRUPO 2 ────────────────────────────── */
const SIMULACAO: LinkNavegacao[] = [
  {
    href: '#secao-6',
    label: 'Regimes Específicos',
    curto: 'Visão geral',
    tecla: '6',
    numero: '6',
    Icon: Layers,
    cor: 'text-orange-600',
    bg: 'bg-orange-50',
    borda: 'border-orange-200',
    descricao: 'Mapa dos regimes que fogem da regra geral',
  },
  {
    href: '#regime-imobiliario',
    label: 'Regime Imobiliário',
    curto: 'Imobiliário',
    tecla: 'i',
    numero: '6A',
    Icon: Home,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
    descricao: 'Venda, locação, RET e redutores de ajuste',
  },
  {
    href: '#agronegocio',
    label: 'Agronegócio',
    curto: 'Agro',
    tecla: 'g',
    numero: '6B',
    Icon: Tractor,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
    descricao: 'Produtor rural, insumos, créditos presumidos e cooperativas',
  },
  {
    href: '#consorcios',
    label: 'Consórcios',
    curto: 'Consórcios',
    tecla: 'c',
    numero: '6C',
    Icon: Handshake,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Taxa de administração, carta de crédito e garantias',
  },
  {
    href: '#financeiros',
    label: 'Financeiros',
    curto: 'Financeiros',
    tecla: 'f',
    numero: '6D',
    Icon: Landmark,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Empréstimos, tarifas, arranjos de pagamento e split',
  },
  {
    href: '#simples',
    label: 'Simples Nacional',
    curto: 'Simples',
    tecla: 'p',
    numero: '6E',
    Icon: Percent,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
    descricao: 'IBS e CBS no DAS, sublimites e comparação de regimes',
  },
  {
    href: '#profissionais-plataformas',
    label: 'Profissionais e Plataformas',
    curto: 'Profissionais',
    tecla: 'r',
    numero: '6F',
    Icon: Smartphone,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: '18 profissões regulamentadas e responsabilidade das plataformas',
  },
]

/* ────────────────────────────── GRUPO 3 ────────────────────────────── */
const TABELAS: LinkNavegacao[] = [
  {
    href: '#secao-7',
    label: 'Anexos',
    curto: 'Anexos',
    tecla: '7',
    numero: '7',
    Icon: Paperclip,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
    descricao: 'Catálogo analítico dos 28 anexos, com base legal',
  },
  {
    href: '#tabela-geral',
    label: 'Tabela Geral dos Anexos',
    curto: 'Tabela geral',
    tecla: 'a',
    numero: '7A',
    Icon: Calculator,
    cor: 'text-rose-700',
    bg: 'bg-rose-100',
    borda: 'border-rose-300',
    descricao: '1.053 itens com alíquota e dispositivo de origem',
  },
  {
    href: '#secao-8',
    label: 'Cronograma 2026–2033',
    curto: 'Cronograma',
    tecla: '8',
    numero: '8',
    Icon: CalendarDays,
    cor: 'text-cyan-600',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-200',
    descricao: 'Fases da transição e simulador ano a ano',
  },
]

/* ────────────────────────────── GRUPO 4 ────────────────────────────── */
const FONTES: LinkNavegacao[] = [
  {
    href: '#secao-9',
    label: 'Fontes & Atualização',
    curto: 'Fontes',
    tecla: '9',
    numero: '9',
    Icon: Database,
    cor: 'text-violet-600',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Hierarquia das fontes e rotina de conferência',
  },
  {
    href: '#fontes-primarias',
    label: 'Fontes primárias (115 bases)',
    curto: 'Fontes primárias',
    tecla: 'w',
    numero: '12',
    Icon: ListChecks,
    cor: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-200',
    descricao: 'As 115 bases oficiais, com órgão e ato de origem',
  },
  {
    href: '#monitor-legislativo',
    label: 'Monitor Legislativo',
    curto: 'Monitor',
    tecla: 'v',
    numero: '12A',
    Icon: Eye,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    descricao: 'Linha do tempo das normas, agente de fontes e alertas',
  },
]

/* ────────────────────────────── GRUPO 5 ────────────────────────────── */
const SISTEMA: LinkNavegacao[] = [
  {
    href: '#historico-atualizacoes',
    label: 'Histórico de Atualizações',
    curto: 'Histórico',
    tecla: 'h',
    numero: '13',
    Icon: History,
    cor: 'text-lime-600',
    bg: 'bg-lime-50',
    borda: 'border-lime-200',
    descricao: 'O que mudou no sistema e na legislação, com data e fonte',
  },
  {
    href: '#central-entrega',
    label: 'Central de Entrega',
    curto: 'Entregar',
    tecla: 'e',
    numero: '14',
    Icon: Printer,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
    descricao: 'Imprimir, salvar em PDF ou enviar ao cliente',
  },
  {
    href: '#assistentes-seguranca',
    label: 'Assistentes & Segurança',
    curto: 'Assistentes',
    tecla: 'x',
    numero: '15',
    Icon: ShieldCheck,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: 'Os seis agentes do sistema e as travas de segurança',
  },
  {
    href: '#controle-acesso',
    label: 'Níveis de Acesso (CRUD)',
    curto: 'Acesso',
    tecla: 'l',
    numero: '16',
    Icon: KeyRound,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-300',
    descricao: 'Quem pode ver, criar, editar e apagar',
  },
  {
    href: '#responsividade-celulares',
    label: 'Responsividade em Celulares',
    curto: 'Celular',
    tecla: 'm',
    numero: '17',
    Icon: MonitorSmartphone,
    cor: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-300',
    descricao: 'Como o sistema se comporta no telefone',
  },
]

/* ─────────────────────────── GRUPOS ─────────────────────────── */
export const GRUPOS: GrupoNavegacao[] = [
  {
    id: 'fundamentos',
    nome: 'Fundamentos',
    proposito: 'A lei e o que ela alcança',
    Icon: BookOpen,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    itens: FUNDAMENTOS,
  },
  {
    id: 'simulacao',
    nome: 'Simulação',
    proposito: 'Calcular por regime e por setor',
    Icon: Calculator,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    itens: SIMULACAO,
  },
  {
    id: 'tabelas',
    nome: 'Tabelas',
    proposito: 'Os itens, os anexos e as datas',
    Icon: Layers,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    itens: TABELAS,
  },
  {
    id: 'fontes',
    nome: 'Fontes e Monitor',
    proposito: 'De onde vem e o que mudou',
    Icon: Radio,
    cor: 'text-fuchsia-700',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-300',
    itens: FONTES,
  },
  {
    id: 'sistema',
    nome: 'Sistema',
    proposito: 'Entregar, controlar e acompanhar',
    Icon: Settings2,
    cor: 'text-slate-700',
    bg: 'bg-slate-100',
    borda: 'border-slate-300',
    itens: SISTEMA,
  },
]

/** Lista achatada — para quem precisa de todos os itens em sequência. */
export const NAVEGACAO: LinkNavegacao[] = GRUPOS.flatMap((g) => g.itens)

/** Item do painel inicial (não é uma seção do conteúdo). */
export const HOME: LinkNavegacao = {
  href: '#inicio',
  label: 'Início',
  curto: 'Início',
  tecla: '0',
  numero: '0',
  Icon: LayoutDashboard,
  cor: 'text-slate-800',
  bg: 'bg-slate-100',
  borda: 'border-slate-300',
  descricao: 'Painel de acompanhamento e atalhos',
}

/** Total de seções de conteúdo — usado no painel inicial. */
export const TOTAL_ITENS = NAVEGACAO.length
export const TOTAL_GRUPOS = GRUPOS.length
