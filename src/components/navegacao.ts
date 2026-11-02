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
  Gauge,
  Building2,
  Lock,
  Globe2,
  Wrench,
  SlidersHorizontal,
  Users,
  Store,
  Fuel,
  HeartPulse,
  GraduationCap,
  UtensilsCrossed,
  UsersRound,
  Trophy,
  Ship,
  Globe,
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
  /**
   * Palavras que o usuário pode digitar e que NÃO aparecem no rótulo.
   * Existe porque a busca é literal: quem procura "imóvel" precisa achar a seção
   * cujo rótulo diz "Imobiliário"; quem procura "aluguel" precisa achar 6A;
   * quem procura "carro" precisa achar a Tabela Geral. Sem esta lista, a busca
   * devolve vazio para o sinônimo e o usuário conclui que o sistema não tem.
   */
  tags: string[]
}

export interface GrupoNavegacao {
  id: string
  /** segmento para o filtro rápido do menu */
  segmentoKey?: string
  /** domínios que este segmento agrupa (fonte única da divisão) */
  dominios?: string[]
  nome: string
  /** frase curta: para que serve este grupo */
  proposito: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
  itens: LinkNavegacao[]
}

/* ══════════════════════════════════════════════════════════════════════════
 * 8 SETORES NOVOS (02/11/2026) — cada um é um regime da LC 214, arts. 172-307
 * As teclas não roubam atalho de nenhuma seção existente.
 * ══════════════════════════════════════════════════════════════════════════ */
const SETORES_NOVOS: LinkNavegacao[] = [
  {
    href: '#setor-combustiveis',
    label: 'Combustíveis e Energia',
    curto: 'Combustíveis',
    tecla: 'q',
    numero: '20',
    Icon: Fuel,
    cor: 'text-orange-700',
    bg: 'bg-orange-50',
    borda: 'border-orange-300',
    descricao: 'LC 214, arts. 172-180: incidência única e alíquota ad rem',
    tags: ['combustível', 'combustivel', 'gasolina', 'diesel', 'etanol', 'ad rem', 'energia'],
    dominio: 'setores',
    setor: 'combustiveis',
  },
  {
    href: '#setor-saude',
    label: 'Saúde e Planos',
    curto: 'Saúde',
    tecla: 'z',
    numero: '21',
    Icon: HeartPulse,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    descricao: 'Planos, medicamentos e dispositivos médicos',
    tags: ['saúde', 'saude', 'plano', 'medicamento', 'remedio', 'hospital'],
    dominio: 'setores',
    setor: 'saude',
  },
  {
    href: '#setor-educacao',
    label: 'Educação',
    curto: 'Educação',
    tecla: 'y',
    numero: '22',
    Icon: GraduationCap,
    cor: 'text-sky-700',
    bg: 'bg-sky-50',
    borda: 'border-sky-300',
    descricao: 'Serviços de educação: redução de 60% e requisitos',
    tags: ['educação', 'educacao', 'escola', 'faculdade', 'curso'],
    dominio: 'setores',
    setor: 'educacao',
  },
  {
    href: '#setor-turismo',
    label: 'Bares, Restaurantes e Turismo',
    curto: 'Turismo',
    tecla: 'ñ',
    numero: '23',
    Icon: UtensilsCrossed,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-300',
    descricao: 'Alimentação, hotelaria, parques e agências',
    tags: ['bar', 'restaurante', 'hotel', 'turismo', 'parque'],
    dominio: 'setores',
    setor: 'turismo',
  },
  {
    href: '#setor-cooperativas',
    label: 'Cooperativas',
    curto: 'Cooperativas',
    tecla: 'õ',
    numero: '24',
    Icon: UsersRound,
    cor: 'text-teal-700',
    bg: 'bg-teal-50',
    borda: 'border-teal-300',
    descricao: 'LC 214, arts. 271-272: ato cooperativo e crédito presumido',
    tags: ['cooperativa', 'cooperado', 'ato cooperativo'],
    dominio: 'setores',
    setor: 'cooperativas',
  },
  {
    href: '#setor-futebol',
    label: 'Sociedade Anônima do Futebol',
    curto: 'SAF',
    tecla: 'ç',
    numero: '25',
    Icon: Trophy,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    descricao: 'Regime da SAF: transferência de atletas',
    tags: ['futebol', 'saf', 'clube', 'atleta', 'jogador'],
    dominio: 'setores',
    setor: 'futebol',
  },
  {
    href: '#setor-exterior',
    label: 'Comércio Exterior e ZFM',
    curto: 'Exterior',
    tecla: 'shift+e',
    numero: '26',
    Icon: Ship,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-300',
    descricao: 'LC 214, art. 93 e ss.: ZFM, REPORTO e drawback',
    tags: ['importação', 'exportação', 'zfm', 'manaus', 'drawback'],
    dominio: 'setores',
    setor: 'exterior',
  },
  {
    href: '#setor-diplomatico',
    label: 'Missões Diplomáticas',
    curto: 'Diplomático',
    tecla: 'shift+d',
    numero: '27',
    Icon: Globe,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-300',
    descricao: 'Missões, repartições internacionais e tratados',
    tags: ['diplomacia', 'embaixada', 'consulado', 'tratado'],
    dominio: 'setores',
    setor: 'diplomatico',
  },
]

/* ────────────────────────────── GRUPO 1 ────────────────────────────── */
const FUNDAMENTOS: LinkNavegacao[] = [
  {
    href: '#secao-1',
    label: 'Normas',
    curto: 'Normas',
    tecla: '1',
    numero: '1',
    dominio: 'nucleo',
    setor: 'regras-gerais',
    Icon: Scale,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: 'EC 132, LC 214/2025, LC 227/2026 e os regulamentos',
    tags: [
      'lei',
      'legislação',
      'legislacao',
      'ec 132',
      'lc 214',
      'lc 227',
      'decreto',
      'resolucao',
      'rib',
      'norma',
      'constituicao',
    ],
  },
  {
    href: '#secao-2',
    label: 'Fato Gerador',
    curto: 'Fato gerador',
    tecla: '2',
    numero: '2',
    dominio: 'nucleo',
    setor: 'regras-gerais',
    Icon: Factory,
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
    descricao: 'Quando o tributo incide: fornecimento, pagamento, split payment',
    tags: [
      'incidencia',
      'split',
      'pagamento',
      'fato gerador',
      'quando incide',
      'base',
      'local',
      'destino',
      'operacao',
    ],
  },
  {
    href: '#secao-3',
    label: 'Cesta Básica',
    curto: 'Cesta básica',
    tecla: '3',
    numero: '3',
    dominio: 'nucleo',
    setor: 'regras-gerais',
    Icon: ShoppingBasket,
    cor: 'text-emerald-600',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
    descricao: 'Alimentos com alíquota zero e exemplos práticos',
    tags: [
      'alimento',
      'comida',
      'cesta',
      'zero',
      'feijao',
      'arroz',
      'carne',
      'leite',
      'supermercado',
      'mercado',
    ],
  },
  {
    href: '#secao-4',
    label: 'Imunidades',
    curto: 'Imunidades',
    tecla: '4',
    numero: '4',
    dominio: 'nucleo',
    setor: 'regras-gerais',
    Icon: ShieldCheck,
    cor: 'text-teal-600',
    bg: 'bg-teal-50',
    borda: 'border-teal-200',
    descricao: 'O que não é tributado: livros, saúde pública, exportação',
    tags: [
      'imunidade',
      'isento',
      'nao tributa',
      'livro',
      'exportacao',
      'templo',
      'partido',
      'educacao pública',
    ],
  },
  {
    href: '#secao-5',
    label: 'Isenções e Alíquotas',
    curto: 'Isenções',
    tecla: '5',
    numero: '5',
    dominio: 'nucleo',
    setor: 'regras-gerais',
    Icon: Percent,
    cor: 'text-amber-600',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
    descricao: 'Reduções de 60% e 30%, diferimentos e regimes favorecidos',
    tags: [
      'reducao',
      'aliquota',
      'desconto',
      '60',
      '30',
      'diferimento',
      'isencao',
      'beneficio',
      'favorecido',
    ],
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
    dominio: 'nucleo',
    setor: 'regimes-especificos',
    Icon: Layers,
    cor: 'text-orange-600',
    bg: 'bg-orange-50',
    borda: 'border-orange-200',
    descricao: 'Mapa dos regimes que fogem da regra geral',
    tags: ['regime', 'especifico', 'diferenciado', 'mapa', 'visao geral', 'setor'],
  },
  {
    href: '#regime-imobiliario',
    label: 'Regime Imobiliário',
    curto: 'Imobiliário',
    tecla: 'i',
    numero: '6A',
    dominio: 'setores',
    setor: 'imobiliario',
    Icon: Home,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-200',
    descricao: 'Venda, locação, RET e redutores de ajuste',
    tags: [
      'imovel',
      'imobiliario',
      'aluguel',
      'locacao',
      'venda',
      'casa',
      'apartamento',
      'terreno',
      'lote',
      'ret',
      'construtora',
      'incorporacao',
      'inquilino',
    ],
  },
  {
    href: '#agronegocio',
    label: 'Agronegócio',
    curto: 'Agro',
    tecla: 'g',
    numero: '6B',
    dominio: 'setores',
    setor: 'agro',
    Icon: Tractor,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-200',
    descricao: 'Produtor rural, insumos, créditos presumidos e cooperativas',
    tags: [
      'agro',
      'agropecuario',
      'fazenda',
      'produtor rural',
      'insumo',
      'soja',
      'boi',
      'cooperativa',
      'credito presumido',
      'trator',
    ],
  },
  {
    href: '#consorcios',
    label: 'Consórcios',
    curto: 'Consórcios',
    tecla: 'c',
    numero: '6C',
    dominio: 'setores',
    setor: 'consorcios',
    Icon: Handshake,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Taxa de administração, carta de crédito e garantias',
    tags: [
      'consorcio',
      'carta de credito',
      'administradora',
      'grupo',
      'contemplacao',
      'garantia',
      'lance',
    ],
  },
  {
    href: '#financeiros',
    label: 'Financeiros',
    curto: 'Financeiros',
    tecla: 'f',
    numero: '6D',
    dominio: 'setores',
    setor: 'financeiro',
    Icon: Landmark,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Empréstimos, tarifas, arranjos de pagamento e split',
    tags: [
      'banco',
      'financeiro',
      'emprestimo',
      'credito',
      'juros',
      'tarifa',
      'banco',
      'seguro',
      'leasing',
      'factoring',
      'split',
      'cartao',
      'adquirante',
    ],
  },
  {
    href: '#simples',
    label: 'Simples Nacional',
    curto: 'Simples',
    tecla: 'p',
    numero: '6E',
    dominio: 'setores',
    setor: 'simples',
    Icon: Percent,
    cor: 'text-blue-700',
    bg: 'bg-blue-50',
    borda: 'border-blue-200',
    descricao: 'IBS e CBS no DAS, sublimites e comparação de regimes',
    tags: [
      'simples',
      'mei',
      'microempresa',
      'pequena empresa',
      'das',
      'rbt12',
      'faixa',
      'optante',
      'cnpj',
    ],
  },
  {
    href: '#profissionais-plataformas',
    label: 'Profissionais e Plataformas',
    curto: 'Profissionais',
    tecla: 'r',
    numero: '6F',
    dominio: 'setores',
    setor: 'profissionais',
    Icon: Smartphone,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: '18 profissões regulamentadas e responsabilidade das plataformas',
    tags: [
      'profissao',
      'profissional',
      'advogado',
      'contador',
      'medico',
      'engenheiro',
      'dentista',
      'plataforma',
      'app',
      'marketplaces',
      'uber',
      'ifood',
    ],
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
    dominio: 'tabelas',
    setor: 'anexos',
    Icon: Paperclip,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
    descricao: 'Catálogo analítico dos 28 anexos, com base legal',
    tags: ['anexo', 'catalogo', 'lista', 'rib', 'decreto', 'pdf', 'base legal'],
  },
  {
    href: '#tabela-geral',
    label: 'Tabela Geral dos Anexos',
    curto: 'Tabela geral',
    tecla: 'a',
    numero: '7A',
    dominio: 'simulacao',
    setor: 'sim-setoriais',
    Icon: Calculator,
    cor: 'text-rose-700',
    bg: 'bg-rose-100',
    borda: 'border-rose-300',
    descricao: '1.053 itens com alíquota e dispositivo de origem',
    tags: [
      'tabela',
      'item',
      'ncm',
      'nbs',
      'codigo',
      'produto',
      'lista completa',
      '1053',
      'aliquota por produto',
      'carro',
      'celular',
    ],
  },
  {
    href: '#secao-8',
    label: 'Cronograma 2026–2033',
    curto: 'Cronograma',
    tecla: '8',
    numero: '8',
    dominio: 'nucleo',
    setor: 'regras-gerais',
    Icon: CalendarDays,
    cor: 'text-cyan-600',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-200',
    descricao: 'Fases da transição e simulador ano a ano',
    tags: [
      'cronograma',
      'calendario',
      'transicao',
      'ano',
      '2026',
      '2027',
      '2028',
      '2029',
      '2030',
      '2033',
      'fase',
    ],
  },
]

/* ────────────────────────────── GRUPO 4 ────────────────────────────── */
const FONTES: LinkNavegacao[] = [
  {
    /*
     * Seção 19 — Radar Nacional (31/10/2026). Tecla 'n' de "Nacional": livre — as
     * usadas são 0-9, w, v, h, k, e, x, l, m, d, i, g, c, f, p, r, a, o, b, j.
     * Fica no grupo Fontes porque é a extensão do radar de fontes oficiais aos
     * diários estaduais e municipais.
     */
    href: '#radar-nacional',
    label: 'Radar Nacional',
    curto: 'Radar Nacional',
    tecla: 'n',
    numero: '19',
    dominio: 'fontes',
    setor: 'monitor',
    Icon: Globe2,
    cor: 'text-teal-700',
    bg: 'bg-teal-50',
    borda: 'border-teal-300',
    descricao: 'Diários oficiais federais, estaduais e municipais no mesmo radar',
    tags: [
      'radar nacional',
      'estados',
      'municipios',
      'diario oficial',
      'diarios oficiais',
      'estadual',
      'municipal',
      'municipios',
      'uf',
      'sigpub',
      'diariomunicipal',
      'legislacao estadual',
      'legislacao municipal',
      'tres niveis',
    ],
  },
  {
    /*
     * Seção 18 — Lefisc (31/10/2026). Portal de legislação fiscal por assinatura.
     * Tecla 'j' (de "Jurídico"): livre — as letras usadas são 0-9, w, v, h, k, e,
     * x, l, m, d, i, g, c, f, p, r, a, o, b. 'j' não colide com nenhuma.
     * Fica no grupo Fontes porque é isso que ela é: uma fonte externa de consulta.
     */
    href: '#lefisc',
    label: 'Acesso Lefisc',
    curto: 'Lefisc',
    tecla: 'j',
    numero: '18',
    dominio: 'fontes',
    setor: 'fontes-agregadores',
    Icon: Lock,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    descricao: 'Seu acesso ao portal de legislação fiscal, com senha guardada',
    tags: [
      'lefisc',
      'lefisque',
      'legislacao fiscal',
      'portal',
      'assinatura',
      'senha',
      'login',
      'acesso',
      'consulta',
      'tabelas',
      'calendario tributario',
      'dou',
      'compilada',
    ],
  },
  {
    /*
     * Seção 11 — acrescentada em 29/10/2026. Ela existia no Index (era renderizada
     * entre a 9A e a 9, na página empilhada), mas NUNCA teve item de menu: chegava-se
     * a ela apenas rolando. Quando a navegação virou abas, "só rolar" deixou de
     * existir e a seção ficou INALCANÇÁVEL — o hash #fontes-agregador não tinha
     * componente no roteador e caía no Início. Este item fecha esse buraco.
     * Tecla 'o' (de "origem"/agregadores): livre e sem conflito com as demais.
     */
    href: '#fontes-agregador',
    label: 'Fontes de referência (agregadores)',
    curto: 'Agregadores',
    tecla: 'o',
    numero: '11',
    dominio: 'fontes',
    setor: 'fontes-agregadores',
    Icon: Layers,
    cor: 'text-fuchsia-700',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-300',
    descricao: 'Buscador NCM e agregadores — fonte secundária, com alerta',
    tags: [
      'agregador',
      'agregadores',
      'buscador',
      'ncm',
      'nbs',
      'referencia',
      'secundaria',
      'catalogo',
      'produto',
      'classificacao',
      'tabela',
      'consulta',
    ],
  },
  {
    href: '#secao-9',
    label: 'Fontes & Atualização',
    curto: 'Fontes',
    tecla: '9',
    numero: '9',
    dominio: 'fontes',
    setor: 'fontes-oficiais',
    Icon: Database,
    cor: 'text-violet-600',
    bg: 'bg-violet-50',
    borda: 'border-violet-200',
    descricao: 'Hierarquia das fontes e rotina de conferência',
    tags: ['fonte', 'atualizacao', 'governanca', 'hierarquia', 'procedencia'],
  },
  {
    href: '#fontes-primarias',
    label: 'Fontes primárias (115 bases)',
    curto: 'Fontes primárias',
    tecla: 'w',
    numero: '12',
    dominio: 'fontes',
    setor: 'fontes-oficiais',
    Icon: ListChecks,
    cor: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-200',
    descricao: 'As 115 bases oficiais, com órgão e ato de origem',
    tags: ['fonte', 'base', 'oficial', 'orgao', '115', 'indice', 'receita federal', 'cgibs'],
  },
  {
    href: '#monitor-legislativo',
    label: 'Monitor Legislativo',
    curto: 'Monitor',
    tecla: 'v',
    numero: '12A',
    dominio: 'fontes',
    setor: 'monitor',
    Icon: Eye,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    descricao: 'Linha do tempo das normas, agente de fontes e alertas',
    tags: [
      'monitor',
      'vigilancia',
      'linha do tempo',
      'alerta',
      'mudanca',
      'agente',
      'fiscalizacao',
    ],
  },
]

/* ────────────────────────────── GRUPO 5 ────────────────────────────── */
const SISTEMA: LinkNavegacao[] = [
  {
    href: '#mapa',
    label: 'Mapa do sistema (degraus)',
    curto: 'Mapa',
    tecla: 'shift+m',
    numero: 'M',
    Icon: ListChecks,
    cor: 'text-panorama-navy',
    bg: 'bg-panorama-gold/15',
    borda: 'border-panorama-gold',
    descricao: 'Menu geral em degraus: domínio → setor → seção',
    tags: ['mapa', 'menu geral', 'degraus', 'índice', 'indice', 'planta', 'navegar'],
    dominio: 'sistema',
    setor: 'gestao',
  },
  {
    href: '#cadastro-envios',
    label: 'Cadastro de Clientes & Envios',
    curto: 'Cadastro',
    tecla: 'k',
    numero: '9A',
    dominio: 'sistema',
    setor: 'gestao',
    Icon: Building2,
    cor: 'text-sky-700',
    bg: 'bg-sky-50',
    borda: 'border-sky-300',
    descricao: 'Identificação completa, importação e comparativo com a reforma',
    tags: [
      'cadastro',
      'cliente',
      'clientes',
      'envio',
      'envios',
      'importar',
      'importacao',
      'planilha',
      'crm',
      'contato',
      'comparativo',
      'receita',
      'carga',
      'tributos',
    ],
  },
  {
    href: '#historico-atualizacoes',
    label: 'Histórico de Atualizações',
    curto: 'Histórico',
    tecla: 'h',
    numero: '13',
    dominio: 'fontes',
    setor: 'monitor',
    Icon: History,
    cor: 'text-lime-600',
    bg: 'bg-lime-50',
    borda: 'border-lime-200',
    descricao: 'O que mudou no sistema e na legislação, com data e fonte',
    tags: ['historico', 'mudanca', 'registro', 'versao', 'o que mudou', 'novidade', 'log'],
  },
  {
    href: '#central-entrega',
    label: 'Central de Entrega',
    curto: 'Entregar',
    tecla: 'e',
    numero: '14',
    dominio: 'sistema',
    setor: 'gestao',
    Icon: Printer,
    cor: 'text-rose-600',
    bg: 'bg-rose-50',
    borda: 'border-rose-200',
    descricao: 'Imprimir, salvar em PDF ou enviar ao cliente',
    tags: [
      'entregar',
      'imprimir',
      'pdf',
      'enviar',
      'whatsapp',
      'email',
      'cliente',
      'relatorio',
      'material',
    ],
  },
  {
    href: '#assistentes-seguranca',
    label: 'Assistentes & Segurança',
    curto: 'Assistentes',
    tecla: 'x',
    numero: '15',
    dominio: 'sistema',
    setor: 'seguranca',
    Icon: ShieldCheck,
    cor: 'text-indigo-600',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-200',
    descricao: 'Os seis agentes do sistema e as travas de segurança',
    tags: ['assistente', 'agente', 'seguranca', 'alerta', 'politica', 'governanca', 'ia'],
  },
  {
    href: '#controle-acesso',
    label: 'Níveis de Acesso (CRUD)',
    curto: 'Acesso',
    tecla: 'l',
    numero: '16',
    dominio: 'sistema',
    setor: 'seguranca',
    Icon: KeyRound,
    cor: 'text-amber-700',
    bg: 'bg-amber-50',
    borda: 'border-amber-300',
    descricao: 'Quem pode ver, criar, editar e apagar',
    tags: ['acesso', 'nivel', 'permissao', 'usuario', 'senha', 'bloqueio', 'crud', 'autorizacao'],
  },
  {
    href: '#responsividade-celulares',
    label: 'Responsividade em Celulares',
    curto: 'Celular',
    tecla: 'm',
    numero: '17',
    dominio: 'sistema',
    setor: 'manutencao',
    Icon: MonitorSmartphone,
    cor: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-300',
    descricao: 'Como o sistema se comporta no telefone',
    tags: ['celular', 'mobile', 'telefone', 'responsivo', 'tela pequena', 'app'],
  },
]

/* ───────────── GRUPO 0 — INDICADORES (acesso de topo) ───────────── */
const INDICADORES: LinkNavegacao[] = [
  {
    href: '#indicadores',
    label: 'Central de Indicadores',
    curto: 'Indicadores',
    tecla: 'd',
    numero: '8A',
    dominio: 'sistema',
    setor: 'gestao',
    Icon: Gauge,
    cor: 'text-amber-700',
    bg: 'bg-amber-100',
    borda: 'border-amber-400',
    descricao: 'Alíquotas, tabelas, fontes e normas em uma tela',
    tags: [
      'indicador',
      'painel',
      'dashboard',
      'numero',
      'grafico',
      'kpi',
      'metrica',
      'comparar',
      'custo',
      'erro',
      'cliente',
      'resumo',
      'visao geral',
      'acompanhamento',
    ],
  },
]

/* ─────────────────────────── GRUPOS ─────────────────────────── */
/**
 * LISTA ÚNICA DE ITENS — a fonte de verdade dos quatro segmentos.
 *
 * Cada segmento filtra esta lista por `dominio`. A vantagem: mover uma seção de
 * segmento é mover um domínio de lista, nunca reescrever 41 itens.
 */
/* Avaliada SOB DEMANDA (é função, não constante): assim a ordem de declaração
 * no arquivo deixa de importar. Em 02/11/2026 a versão como constante lia
 * HOME/ITEM_INSTALADOR_CEO antes de existirem e a home caía com
 * "Cannot read properties of undefined (reading 'dominio')". */
function todosItens(): LinkNavegacao[] {
  return [
    ...INDICADORES,
    ...FUNDAMENTOS,
    ...SETORES_NOVOS,
    ...SIMULACAO,
    ...TABELAS,
    ...FONTES,
    ...SISTEMA,
    ITEM_INSTALADOR_CEO,
    HOME,
  ]
}

export const GRUPOS: GrupoNavegacao[] = [
  /* ══════════════════════════════════════════════════════════════════════
   * QUATRO SEGMENTOS (decisão do CEO, 02/11/2026)
   *
   * "Reestruture o menu com os quatro segmentos, estruturados. Os quais,
   *  posteriormente, serão redefinidos e redimensionados."
   *
   * ── O QUE MUDOU ──
   * Antes eram SETE grupos com tamanhos muito desiguais (1, 7, 14, 1, 3, 6, 7).
   * Sete abas para 41 itens é menu demais: o primeiro grupo tinha UM item,
   * enquanto outro tinha catorze. Agora são quatro, com peso equilibrado:
   *
   *   SEGMENTO 1 · BASE LEGAL ............  7 itens  a lei e o que ela alcança
   *   SEGMENTO 2 · SETORES ............... 14 itens  cada regime, um setor
   *   SEGMENTO 3 · SIMULAÇÃO E TABELAS ...  5 itens  calcular e classificar
   *   SEGMENTO 4 · FONTES E SISTEMA ...... 14 itens  de onde vem e como se opera
   *
   * ── COMO REDEFINIR DEPOIS (é para isso que foi feito assim) ──
   * Cada segmento declara apenas DUAS coisas: o nome e a lista de domínios que
   * ele agrupa (`dominios`). Mudar o tamanho de um segmento = mover um domínio
   * de uma lista para outra. Nenhum item precisa ser tocado, e nenhuma tecla
   * muda, porque as teclas vivem no ITEM, não no grupo.
   *
   *   Para criar um 5º segmento:  acrescente um objeto neste array com nome,
   *   proposito, ícone e a lista `dominios`. O menu e a home se ajustam.
   * ══════════════════════════════════════════════════════════════════════ */

  // ── SEGMENTO 1 — BASE LEGAL ───────────────────────────────────────────
  {
    id: 'base-legal',
    segmentoKey: 'base-legal',
    nome: 'Base Legal',
    proposito: 'A lei, o fato gerador, o que fica de fora e o cronograma',
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    dominios: ['nucleo'],
    itens: todosItens().filter((i) => i.dominio === 'nucleo'),
  },

  // ── SEGMENTO 2 — SETORES ──────────────────────────────────────────────
  {
    id: 'setores',
    segmentoKey: 'setores',
    nome: 'Setores',
    proposito: 'Cada regime da LC 214 aplicado ao setor — 14 setores',
    Icon: Factory,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    dominios: ['setores'],
    itens: todosItens().filter((i) => i.dominio === 'setores'),
  },

  // ── SEGMENTO 3 — SIMULAÇÃO E TABELAS ──────────────────────────────────
  {
    id: 'simulacao-tabelas',
    segmentoKey: 'simulacao-tabelas',
    nome: 'Simulação e Tabelas',
    proposito: 'Calcular o impacto e achar onde cada item está classificado',
    Icon: Calculator,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    dominios: ['simulacao', 'tabelas'],
    itens: todosItens().filter((i) => ['simulacao', 'tabelas'].includes(i.dominio || '')),
  },

  // ── SEGMENTO 4 — FONTES E SISTEMA ─────────────────────────────────────
  {
    id: 'fontes-sistema',
    segmentoKey: 'fontes-sistema',
    nome: 'Fontes e Sistema',
    proposito: 'De onde vem o dado, o que mudou, e a operação do programa',
    Icon: Radio,
    cor: 'text-fuchsia-700',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-300',
    dominios: ['fontes', 'sistema'],
    itens: todosItens().filter((i) => ['fontes', 'sistema'].includes(i.dominio || '')),
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

/* ══════════════════════════════════════════════════════════════════════════
 * SEGMENTOS DO SISTEMA — filtro rápido do menu lateral
 *
 * O menu tem 41 seções. Antes de abrir, o CEO escolhe o segmento ("quero ver
 * só Simulação") e a lista encolhe. É o degrau 0: menos do que domínio, é um
 * recorte de conveniência sobre o que já existe.
 * ══════════════════════════════════════════════════════════════════════════ */
export interface SegmentoSistema {
  id: string
  nome: string
  descricao: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
  /** para onde leva o botão do agente daquele segmento */
  hrefAgente: string
  agenteNome: string
  /** as seções que pertencem ao segmento */
  itens: LinkNavegacao[]
}

/**
 * SEGMENTOS DO SISTEMA — a porta de entrada (PlataformaHome)
 *
 * Este array alimenta a home: cada segmento vira um CARD com o agente da área.
 * Os `itens` são derivados da NAVEGACAO por `dominio`, então nunca divergem do
 * menu — mas precisam existir aqui: o card mostra as seções do segmento.
 */
export const SEGMENTOS_SISTEMA: SegmentoSistema[] = [
  {
    id: 'base-legal',
    nome: 'Base Legal',
    descricao:
      'A lei e o que ela alcança: normas, fato gerador, cesta básica, imunidades, alíquotas e cronograma.',
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    hrefAgente: '#secao-1',
    agenteNome: 'Jurídico',
    itens: todosItens().filter((i) => i.dominio === 'nucleo'),
  },
  {
    id: 'setores',
    nome: 'Setores',
    descricao: 'Cada regime da LC 214 aplicado ao setor — 14 setores, de imóveis a combustíveis.',
    Icon: Factory,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    hrefAgente: '#setor-combustiveis',
    agenteNome: 'Contábil',
    itens: todosItens().filter((i) => i.dominio === 'setores'),
  },
  {
    id: 'simulacao-tabelas',
    nome: 'Simulação e Tabelas',
    descricao: 'Calcular o impacto antes de decidir e achar onde cada item está classificado.',
    Icon: Calculator,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    hrefAgente: '#busca-avancada',
    agenteNome: 'Contábil',
    itens: todosItens().filter((i) => ['simulacao', 'tabelas'].includes(i.dominio || '')),
  },
  {
    id: 'fontes-sistema',
    nome: 'Fontes e Sistema',
    descricao: 'De onde vem o dado, com selo de oficialidade, e a operação do programa.',
    Icon: Radio,
    cor: 'text-fuchsia-700',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-300',
    hrefAgente: '#radar-nacional',
    agenteNome: 'Administrativo',
    itens: todosItens().filter((i) => ['fontes', 'sistema'].includes(i.dominio || '')),
  },
]

/**
 * ITEM DO TOPO DO MENU — o Instalador e Controle de Versão.
 *
 * Regra permanente do CEO: o controle do programa fica no #1 do menu, sempre
 * visível, com selo próprio. É o primeiro item que ele procura ao abrir o app
 * em outro aparelho.
 */
export const ITEM_INSTALADOR_CEO: LinkNavegacao = {
  href: '#instalador-versao',
  label: 'Instalador e Versão',
  curto: 'Instalador',
  tecla: 'u',
  numero: '1',
  Icon: MonitorSmartphone,
  cor: 'text-amber-700',
  bg: 'bg-amber-100',
  borda: 'border-amber-400',
  descricao: 'Envios de instalação e controle de versões do programa',
  tags: [
    'instalador',
    'instalar',
    'versão',
    'versao',
    'atualização',
    'atualizacao',
    'app',
    'celular',
  ],
  dominio: 'sistema',
  setor: 'manutencao',
}

/* ══════════════════════════════════════════════════════════════════════════
 * HIERARQUIA — domínio → setor → seção (três degraus)
 *
 * Pedido do CEO (02/11/2026): "remontar o sistema em degraus, partindo de um
 * menu geral e acoplando todos os demais menus".
 *
 * O menu lateral lista seções; esta estrutura as ORGANIZA. Quem chega não
 * precisa saber que existe "seção 6B" — abre Agronegócio.
 * ══════════════════════════════════════════════════════════════════════════ */
export interface SetorHierarquia {
  id: string
  nome: string
  base: string
  Icon: React.ComponentType<{ className?: string }>
}

export interface DominioHierarquia {
  id: string
  numero: string
  nome: string
  proposito: string
  Icon: React.ComponentType<{ className?: string }>
  cor: string
  bg: string
  borda: string
  setores: SetorHierarquia[]
}

export const DOMINIOS_HIERARQUIA: DominioHierarquia[] = [
  {
    id: 'nucleo',
    numero: '1',
    nome: 'Núcleo Tributário',
    proposito: 'A lei, o fato gerador e o que fica de fora',
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    setores: [
      {
        id: 'regras-gerais',
        nome: 'Regras Gerais',
        base: 'EC 132/2023 · LC 214/2025 · LC 227/2026',
        Icon: Scale,
      },
      {
        id: 'regimes-especificos',
        nome: 'Regimes Específicos',
        base: 'LC 214/2025, arts. 172 a 307',
        Icon: Layers,
      },
    ],
  },
  {
    id: 'setores',
    numero: '2',
    nome: 'Setores da Economia',
    proposito: 'Cada setor tem regra própria — ache a sua',
    Icon: Factory,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    setores: [
      {
        id: 'imobiliario',
        nome: 'Bens Imóveis',
        base: 'LC 214, arts. 251-261 e 485-488 (RET)',
        Icon: Building2,
      },
      {
        id: 'agro',
        nome: 'Agronegócio',
        base: 'LC 214, arts. 110, 137-138, 164-171',
        Icon: Tractor,
      },
      { id: 'consorcios', nome: 'Consórcios', base: 'LC 214, arts. 204-206', Icon: Handshake },
      {
        id: 'financeiro',
        nome: 'Serviços Financeiros',
        base: 'LC 214, arts. 181-233',
        Icon: Landmark,
      },
      { id: 'simples', nome: 'Simples Nacional', base: 'LC 123/2006 · art. 343', Icon: Store },
      {
        id: 'profissionais',
        nome: 'Profissionais e Plataformas',
        base: 'LC 214, arts. 22 e 127',
        Icon: Users,
      },
      {
        id: 'combustiveis',
        nome: 'Combustíveis e Energia',
        base: 'LC 214, arts. 172-180',
        Icon: Fuel,
      },
      {
        id: 'saude',
        nome: 'Saúde e Planos',
        base: 'Regimes específico e diferenciado',
        Icon: HeartPulse,
      },
      { id: 'educacao', nome: 'Educação', base: 'Serviços de educação', Icon: GraduationCap },
      {
        id: 'turismo',
        nome: 'Bares, Restaurantes e Turismo',
        base: 'Regime específico de turismo',
        Icon: UtensilsCrossed,
      },
      { id: 'cooperativas', nome: 'Cooperativas', base: 'LC 214, arts. 271-272', Icon: UsersRound },
      {
        id: 'futebol',
        nome: 'Sociedade Anônima do Futebol',
        base: 'Regime específico da SAF',
        Icon: Trophy,
      },
      {
        id: 'exterior',
        nome: 'Comércio Exterior e ZFM',
        base: 'LC 214, art. 93 e ss.',
        Icon: Ship,
      },
      {
        id: 'diplomatico',
        nome: 'Missões Diplomáticas',
        base: 'Tratados internacionais',
        Icon: Globe,
      },
    ],
  },
  {
    id: 'simulacao',
    numero: '3',
    nome: 'Simuladores',
    proposito: 'Calcular o impacto antes de decidir',
    Icon: Calculator,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    setores: [
      {
        id: 'sim-geral',
        nome: 'Simulador Geral',
        base: 'Catálogo de 1.002 itens',
        Icon: Calculator,
      },
      {
        id: 'sim-setoriais',
        nome: 'Simuladores por Setor',
        base: 'Um por regime',
        Icon: SlidersHorizontal,
      },
    ],
  },
  {
    id: 'tabelas',
    numero: '4',
    nome: 'Tabelas e Anexos',
    proposito: 'Onde o item está classificado',
    Icon: Paperclip,
    cor: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-300',
    setores: [
      {
        id: 'anexos',
        nome: 'Anexos da LC 214 e do RIBS',
        base: '23 LC 214 · 5 RIBS · 5 Dec. 12.955',
        Icon: Paperclip,
      },
    ],
  },
  {
    id: 'fontes',
    numero: '5',
    nome: 'Fontes e Monitoramento',
    proposito: 'De onde vem o dado e o que mudou',
    Icon: Radio,
    cor: 'text-fuchsia-700',
    bg: 'bg-fuchsia-50',
    borda: 'border-fuchsia-300',
    setores: [
      {
        id: 'fontes-oficiais',
        nome: 'Fontes Oficiais',
        base: 'Publicadores primários',
        Icon: Landmark,
      },
      { id: 'fontes-agregadores', nome: 'Agregadores', base: 'Nunca base legal', Icon: Layers },
      { id: 'monitor', nome: 'Monitoramento', base: 'Radar e acompanhamento', Icon: Radio },
    ],
  },
  {
    id: 'sistema',
    numero: '6',
    nome: 'Sistema',
    proposito: 'Gestão, entrega, segurança e manutenção',
    Icon: Settings2,
    cor: 'text-slate-700',
    bg: 'bg-slate-50',
    borda: 'border-slate-300',
    setores: [
      { id: 'gestao', nome: 'Gestão e Entrega', base: 'Operação do escritório', Icon: Gauge },
      { id: 'seguranca', nome: 'Segurança e Acesso', base: 'Controle interno', Icon: ShieldCheck },
      { id: 'manutencao', nome: 'Manutenção', base: 'Controle do programa', Icon: Wrench },
    ],
  },
]

/** Setores de um domínio, já com as seções que pertencem a eles. */
export function setoresDoDominio(dominioId: string) {
  const dom = DOMINIOS_HIERARQUIA.find((d) => d.id === dominioId)
  if (!dom) return []
  return dom.setores.map((s) => ({
    ...s,
    itens: NAVEGACAO.filter((n) => n.dominio === dominioId && n.setor === s.id),
  }))
}

/** Total de seções de conteúdo — usado no painel inicial. */
export const TOTAL_ITENS = NAVEGACAO.length
export const TOTAL_GRUPOS = GRUPOS.length
