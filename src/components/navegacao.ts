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
  Search,
  SearchCode,
  FileSearch,
  BrainCircuit,
  Ban,
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
  dominio?: string
  setor?: string
}

export interface GrupoNavegacao {
  id: string
  /** segmento para o filtro rápido do menu */
  segmentoKey?: string
  /** domínios que este segmento agrupa (fonte única da divisão) */
  dominios?: string[]
  secoes?: string[]
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
  /* ── RECURSOS HUMANOS (02/11/2026) ──
   * Setor pedido pelo CEO dentro da Plataforma Contábil. Não é regime da LC 214:
   * é o acervo trabalhista/previdenciário/sindical/NR que o escritório precisa
   * ter à mão. Tecla 'h' (de RH) não colide com nenhuma existente. */
  {
    href: '#recursos-humanos',
    label: 'Recursos Humanos',
    curto: 'RH',
    tecla: 'h',
    numero: '28',
    Icon: Users,
    cor: 'text-orange-700',
    bg: 'bg-orange-50',
    borda: 'border-orange-300',
    descricao: 'Trabalhista, previdenciário, sindical e as NRs de segurança',
    tags: [
      'rh',
      'recursos humanos',
      'trabalhista',
      'clt',
      'previdenciario',
      'previdenciaria',
      'inss',
      'sindical',
      'sindicato',
      'nr',
      'norma regulamentadora',
      'seguranca do trabalho',
      'sst',
      'folha',
      'empregado',
      'empregador',
      'convencao coletiva',
      'acordo coletivo',
    ],
    dominio: 'setores',
    setor: 'recursos-humanos',
  },
  /* ── DEPARTAMENTO FISCAL (02/11/2026) ──
   * Segundo setor pedido pelo CEO. Reúne as três esferas (federal, estadual,
   * municipal), o ICMS das 27 UFs e o ISS/ISSQN. Consome o acervo do Radar
   * Nacional em vez de criar um segundo coletor. Tecla 'k' (de fiscal). */
  {
    href: '#departamento-fiscal',
    label: 'Departamento Fiscal',
    curto: 'Fiscal',
    tecla: 'k',
    numero: '29',
    Icon: Building2,
    cor: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-300',
    descricao: 'Federal, estadual e municipal: ICMS, ISS e o acervo coletado',
    tags: [
      'fiscal',
      'departamento fiscal',
      'icms',
      'iss',
      'issqn',
      'estadual',
      'municipal',
      'federal',
      'sefaz',
      'confaz',
      'lei estadual',
      'lei municipal',
      'decreto',
      'regulamento',
      'ricms',
      'ctm',
      'iptu',
      'ipva',
      'itbi',
      'itcd',
    ],
    dominio: 'setores',
    setor: 'departamento-fiscal',
  },
  /* ── ACERVO JURÍDICO (02/11/2026) ──
   * Terceiro setor pedido pelo CEO, agora na Plataforma Jurídica. A Constituição
   * no topo, os códigos por área e a jurisprudência dos tribunais, em hierarquia
   * institucional. Tecla 'l' (de legal/acervo). Consome o Radar, não duplica. */
  {
    href: '#acervo-juridico',
    label: 'Acervo Jurídico',
    curto: 'Acervo',
    tecla: 'o',
    numero: '30',
    /* Scale e não Gavel: Gavel não está no import de navegacao.ts, e usar um
       símbolo não importado quebra o build inteiro (não é aviso — é erro). */
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    descricao: 'Constituição, códigos, jurisprudência e hierarquia dos tribunais',
    tags: [
      'acervo',
      'juridico',
      'jurídico',
      'constituição',
      'constituicao',
      'cf',
      'emenda constitucional',
      'código',
      'codigo',
      'jurisprudência',
      'jurisprudencia',
      'stf',
      'stj',
      'tst',
      'tribunal',
      'súmula',
      'sumula',
      'cpc',
      'ctn',
      'clt',
      'civil',
      'penal',
    ],
    dominio: 'nucleo',
    setor: 'acervo-juridico',
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
    tecla: 'n',
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
    tecla: 'j',
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

/* ── três plataformas: micromenus ── */
const SECOES_JURIDICA = [
  /* Acervo Jurídico entra PRIMEIRO: é a porta de entrada de quem advoga — a
     Constituição no topo, os códigos e a jurisprudência antes das seções de
     conteúdo da reforma. */
  '#acervo-juridico',
  '#secao-1',
  '#historico-revisoes',
  '#historico-exclusoes',
  '#secao-2',
  '#secao-3',
  '#secao-4',
  '#secao-5',
  '#secao-6',
  '#secao-8',
  '#secao-7',
  '#fontes-primarias',
  '#radar-nacional',
  '#monitor-legislativo',
  '#diagnostico-tributario',
  '#fontes-agregador',
  '#secao-9',
  '#lefisc',
  '#historico-atualizacoes',
  '#busca-avancada?segmento=juridica',
]
const SECOES_CONTABIL = [
  /* Recursos Humanos entra PRIMEIRO: para quem opera a folha, é a porta de
     entrada do setor — o resto da plataforma é apuração de IBS/CBS. */
  '#recursos-humanos',
  '#departamento-fiscal',
  '#regime-imobiliario',
  '#agronegocio',
  '#consorcios',
  '#financeiros',
  '#simples',
  '#profissionais-plataformas',
  '#setor-combustiveis',
  '#setor-saude',
  '#setor-educacao',
  '#setor-turismo',
  '#setor-cooperativas',
  '#setor-futebol',
  '#setor-exterior',
  '#setor-diplomatico',
  '#tabela-geral',
  '#busca-avancada?segmento=contabil',
  '#diagnostico-tributario',
]
const SECOES_ADMINISTRATIVA = [
  '#mapa',
  '#indicadores',
  '#cadastro-envios',
  '#central-entrega',
  '#assistentes-seguranca',
  '#controle-acesso',
  '#responsividade-celulares',
  '#busca-avancada?segmento=administrativa',
  '#instalador-versao',
]

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
  tags: ['inicio', 'home', 'painel', 'plataforma', 'portal'],
}

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

/* ── itens restaurados (03/11/2026): existem no roteador e faltavam no menu ── */
const EXTRAS: LinkNavegacao[] = [
  {
    href: '#busca-avancada',
    label: 'Busca Avançada',
    curto: 'Busca Avançada',
    tecla: 'b',
    numero: 'B',
    Icon: Search,
    cor: 'text-cyan-700',
    bg: 'bg-cyan-50',
    borda: 'border-cyan-300',
    descricao: 'Encontrar o item (NCM/NBS) e ver tratamento e alíquota',
    tags: ['busca', 'ncm', 'nbs', 'item', 'produto', 'servico', 'catalogo'],
    dominio: 'simulacao',
    setor: 'sim-geral',
  },
  {
    href: '#busca-avancada?segmento=contabil',
    label: 'Busca Avançada',
    curto: 'Busca Contábil',
    tecla: 'b',
    numero: 'B',
    Icon: Search,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    descricao: 'Busca de classificações, NCMs, CSTs e alíquotas do setor contábil',
    tags: ['busca', 'contabil', 'classificacoes', 'ncm', 'cst', 'aliquotas'],
    dominio: 'simulacao',
    setor: 'sim-geral',
  },
  {
    href: '#busca-avancada?segmento=juridica',
    label: 'Busca Avançada',
    curto: 'Busca Jurídica',
    tecla: 'b',
    numero: 'B',
    Icon: SearchCode,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    descricao: 'Pesquisa avançada em normas, acervos e atos da reforma',
    tags: ['busca', 'juridico', 'normas', 'atos', 'leis', 'jurisprudencia'],
    dominio: 'nucleo',
    setor: 'regras-gerais',
  },
  {
    href: '#busca-avancada?segmento=administrativa',
    label: 'Busca Avançada',
    curto: 'Busca Adm',
    tecla: 'b',
    numero: 'B',
    Icon: FileSearch,
    cor: 'text-slate-700',
    bg: 'bg-slate-100',
    borda: 'border-slate-300',
    descricao: 'Pesquisa avançada em atos, fontes oficiais e órgãos de publicação',
    tags: ['busca', 'administrativo', 'atos', 'fontes', 'orgaos', 'publicacoes'],
    dominio: 'sistema',
    setor: 'gestao',
  },
  {
    href: '#diagnostico-tributario',
    label: 'Diagnóstico Tributário',
    curto: 'Diagnostico',
    tecla: 't',
    numero: '12B',
    Icon: BrainCircuit,
    cor: 'text-violet-700',
    bg: 'bg-violet-50',
    borda: 'border-violet-300',
    descricao: 'Raio-X da situacao do contribuinte por regime',
    tags: ['diagnostico', 'raio-x', 'situacao', 'contribuinte'],
    dominio: 'fontes',
    setor: 'monitor',
  },
  {
    href: '#historico-revisoes',
    label: 'Histórico de Revisões de Normas',
    curto: 'Revisões de Normas',
    tecla: 'shift+v',
    numero: '12C',
    Icon: History,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    descricao: 'Linha do tempo de alterações, inclusões e exclusões com versão anterior e atual',
    tags: [
      'revisao',
      'revisoes',
      'historico',
      'norma',
      'normas',
      'alteracao',
      'inclusao',
      'exclusao',
      'vigencia',
      'semanal',
    ],
    dominio: 'nucleo',
    setor: 'regras-gerais',
  },
  {
    href: '#historico-exclusoes',
    label: 'Histórico de Exclusões',
    curto: 'Exclusões de Normas',
    tecla: 'shift+w',
    numero: '12D',
    Icon: Ban,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    descricao: 'Linha do tempo de exclusões legislativas, revogações e perda de eficácia',
    tags: [
      'exclusao',
      'exclusoes',
      'revogacao',
      'revogado',
      'ineficaz',
      'perda de eficacia',
      'historico exclusoes',
      'norma revogada',
      'artigo revogado',
    ],
    dominio: 'nucleo',
    setor: 'regras-gerais',
  },
]

const TODOS_ITENS: LinkNavegacao[] = [
  ...INDICADORES,
  ...FUNDAMENTOS,
  ...SETORES_NOVOS,
  ...SIMULACAO,
  ...TABELAS,
  ...FONTES,
  ...SISTEMA,
  ...EXTRAS,
  ITEM_INSTALADOR_CEO,
  HOME,
]

function itensDaPlataforma(secoes: string[]): LinkNavegacao[] {
  return secoes
    .map((h) => TODOS_ITENS.find((i) => i.href === h))
    .filter((i): i is LinkNavegacao => Boolean(i))
}

/* ══════════════════════════════════════════════════════════════════════
 * TRÊS PLATAFORMAS NO MENU LATERAL (03/11/2026 — decisão do CEO)
 * "Redimensione para o menu lateral: jurídica, contábil e administrativa,
 *  a um macro menu. Posteriormente redimensionarei os micromenus."
 *
 * Divisão por ÁREA DE CONHECIMENTO, não por tipo de tela:
 *   JURÍDICA       a norma, a interpretação e a régua de fontes
 *   CONTÁBIL       apuração por setor, classificação e cálculo
 *   ADMINISTRATIVA clientes, envios, entrega, indicadores, manutenção
 *
 * REDIMENSIONAR MICROMENU = mover uma string entre SECOES_* abaixo.
 * Nenhum item, tecla ou texto precisa ser tocado.
 * ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
 * PLATAFORMA MACRO — REFORMA TRIBUTÁRIA (03/11/2026, decisão do CEO)
 *
 * "Criar uma plataforma macro chamada segmento reforma tributária. Todos os
 *  ícones dos assuntos de reforma tributária para esta plataforma. Pode manter
 *  a estrutura nas demais. Posteriormente irei reconfigurá-las."
 *
 * ── O QUE ESTA PLATAFORMA É ──
 * O AGREGADO de tudo que é assunto da reforma: a norma, o fato gerador, a
 * cesta, as imunidades, as alíquotas, os regimes específicos, o cronograma, os
 * anexos, os 14 setores, a tabela geral e a busca por item. 25 seções.
 *
 * ── POR QUE ELA CONVIVE COM AS OUTRAS TRÊS ──
 * As plataformas Jurídica, Contábil e Administrativa seguem intactas: são
 * RECORTES por área de quem trabalha. Esta é o recorte por ASSUNTO. A mesma
 * seção aparece nos dois lugares, de propósito — quem procura "tudo sobre a
 * reforma" vem aqui; quem é do contábil abre a contábil.
 *
 * Por isso `NAVEGACAO` deduplica por href: a tecla de atalho e a busca do menu
 * continuam apontando para UMA seção, não duas.
 * ══════════════════════════════════════════════════════════════════════════ */
const SECOES_REFORMA = [
  '#secao-1',
  '#historico-revisoes',
  '#historico-exclusoes',
  '#secao-2',
  '#secao-3',
  '#secao-4',
  '#secao-5',
  '#secao-6',
  '#secao-8',
  '#secao-7',
  '#tabela-geral',
  '#regime-imobiliario',
  '#agronegocio',
  '#consorcios',
  '#financeiros',
  '#simples',
  '#profissionais-plataformas',
  '#setor-combustiveis',
  '#setor-saude',
  '#setor-educacao',
  '#setor-turismo',
  '#setor-cooperativas',
  '#setor-futebol',
  '#setor-exterior',
  '#setor-diplomatico',
  '#busca-avancada',
]

export const GRUPOS: GrupoNavegacao[] = [
  /* ── MACRO: tudo que é assunto da reforma num lugar só ── */
  {
    id: 'reforma-tributaria',
    segmentoKey: 'reforma-tributaria',
    nome: 'Reforma Tributária',
    proposito: 'Todos os assuntos da reforma: norma, setores, tabelas e cálculo',
    Icon: Landmark,
    cor: 'text-panorama-gold',
    bg: 'bg-panorama-navy/5',
    borda: 'border-panorama-gold',
    dominios: ['nucleo', 'setores', 'tabelas', 'simulacao'],
    secoes: SECOES_REFORMA,
    itens: itensDaPlataforma(SECOES_REFORMA),
  },
  {
    id: 'juridica',
    segmentoKey: 'juridica',
    nome: 'Plataforma Jurídica',
    proposito: 'A norma, sua interpretação e a régua de fontes oficiais',
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    dominios: ['nucleo'],
    secoes: SECOES_JURIDICA,
    itens: itensDaPlataforma(SECOES_JURIDICA),
  },
  {
    id: 'contabil',
    segmentoKey: 'contabil',
    nome: 'Plataforma Contábil',
    proposito: 'Apuração por setor, classificação do item e cálculo',
    Icon: Calculator,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    dominios: ['setores', 'simulacao', 'tabelas'],
    secoes: SECOES_CONTABIL,
    itens: itensDaPlataforma(SECOES_CONTABIL),
  },
  {
    id: 'administrativa',
    segmentoKey: 'administrativa',
    nome: 'Plataforma Administrativa',
    proposito: 'Clientes, envios, entrega, indicadores e manutenção',
    Icon: Settings2,
    cor: 'text-slate-700',
    bg: 'bg-slate-100',
    borda: 'border-slate-300',
    dominios: ['sistema'],
    secoes: SECOES_ADMINISTRATIVA,
    itens: itensDaPlataforma(SECOES_ADMINISTRATIVA),
  },
]

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

export const SEGMENTOS_SISTEMA: SegmentoSistema[] = [
  {
    id: 'reforma-tributaria',
    nome: 'Reforma Tributária',
    descricao:
      'Todos os assuntos da reforma num lugar: norma, setores, anexos, tabela geral e cálculo.',
    Icon: Landmark,
    cor: 'text-panorama-gold',
    bg: 'bg-panorama-navy/5',
    borda: 'border-panorama-gold',
    hrefAgente: '#secao-1',
    agenteNome: 'Jurídico',
    itens: itensDaPlataforma(SECOES_REFORMA),
  },
  {
    id: 'juridica',
    nome: 'Plataforma Jurídica',
    descricao: 'A norma, sua interpretação, os anexos e a régua de fontes oficiais.',
    Icon: Scale,
    cor: 'text-indigo-700',
    bg: 'bg-indigo-50',
    borda: 'border-indigo-300',
    hrefAgente: '#secao-1',
    agenteNome: 'Jurídico',
    itens: itensDaPlataforma(SECOES_JURIDICA),
  },
  {
    id: 'contabil',
    nome: 'Plataforma Contábil',
    descricao: 'Apuração por setor (14 regimes), classificação do item e cálculo.',
    Icon: Calculator,
    cor: 'text-emerald-700',
    bg: 'bg-emerald-50',
    borda: 'border-emerald-300',
    hrefAgente: '#setor-combustiveis',
    agenteNome: 'Contábil',
    itens: itensDaPlataforma(SECOES_CONTABIL),
  },
  {
    id: 'administrativa',
    nome: 'Plataforma Administrativa',
    descricao: 'Clientes, envios, central de entrega, indicadores e manutenção.',
    Icon: Settings2,
    cor: 'text-slate-700',
    bg: 'bg-slate-100',
    borda: 'border-slate-300',
    hrefAgente: '#mapa',
    agenteNome: 'Administrativo',
    itens: itensDaPlataforma(SECOES_ADMINISTRATIVA),
  },
]

/* ── HIERARQUIA (usada pelo Painel de Degraus, rota #mapa) ── */
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
      { id: 'regras-gerais', nome: 'Regras Gerais', base: 'EC 132 · LC 214 · LC 227', Icon: Scale },
      {
        id: 'regimes-especificos',
        nome: 'Regimes Específicos',
        base: 'LC 214, arts. 172-307',
        Icon: Layers,
      },
    ],
  },
  {
    id: 'setores',
    numero: '2',
    nome: 'Setores da Economia',
    proposito: 'Cada setor tem regra própria — 14 setores',
    Icon: Factory,
    cor: 'text-rose-700',
    bg: 'bg-rose-50',
    borda: 'border-rose-300',
    setores: [
      { id: 'imobiliario', nome: 'Bens Imóveis', base: 'LC 214, arts. 251-261', Icon: Building2 },
      { id: 'agro', nome: 'Agronegócio', base: 'LC 214, arts. 164-171', Icon: Tractor },
      { id: 'consorcios', nome: 'Consórcios', base: 'LC 214, arts. 204-206', Icon: Handshake },
      {
        id: 'financeiro',
        nome: 'Serviços Financeiros',
        base: 'LC 214, arts. 181-233',
        Icon: Landmark,
      },
      { id: 'simples', nome: 'Simples Nacional', base: 'LC 123 · art. 343', Icon: Store },
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
        base: 'regimes específico e diferenciado',
        Icon: HeartPulse,
      },
      { id: 'educacao', nome: 'Educação', base: 'serviços de educação', Icon: GraduationCap },
      {
        id: 'turismo',
        nome: 'Bares, Restaurantes e Turismo',
        base: 'regime específico',
        Icon: UtensilsCrossed,
      },
      { id: 'cooperativas', nome: 'Cooperativas', base: 'LC 214, arts. 271-272', Icon: UsersRound },
      { id: 'futebol', nome: 'Sociedade Anônima do Futebol', base: 'regime da SAF', Icon: Trophy },
      {
        id: 'exterior',
        nome: 'Comércio Exterior e ZFM',
        base: 'art. 93 e ss. · Dec. 12.955',
        Icon: Ship,
      },
      {
        id: 'diplomatico',
        nome: 'Missões Diplomáticas',
        base: 'tratados internacionais',
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
        base: 'catálogo de 1.002 itens',
        Icon: Calculator,
      },
      { id: 'sim-setoriais', nome: 'Simuladores por Setor', base: 'um por regime', Icon: Layers },
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
        base: '23 + 5 + 5 anexos',
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
        base: 'publicadores primários',
        Icon: Landmark,
      },
      {
        id: 'fontes-agregadores',
        nome: 'Agregadores',
        base: 'reprodutores — nunca base legal',
        Icon: Layers,
      },
      { id: 'monitor', nome: 'Monitoramento', base: 'radar e acompanhamento', Icon: Radio },
    ],
  },
  {
    id: 'sistema',
    numero: '6',
    nome: 'Sistema',
    proposito: 'Gestão, entrega, segurança e manutenção',
    Icon: Settings2,
    cor: 'text-slate-700',
    bg: 'bg-slate-100',
    borda: 'border-slate-300',
    setores: [
      { id: 'gestao', nome: 'Gestão e Entrega', base: 'operação do escritório', Icon: Gauge },
      { id: 'seguranca', nome: 'Segurança e Acesso', base: 'controle interno', Icon: ShieldCheck },
      { id: 'manutencao', nome: 'Manutenção', base: 'controle do programa', Icon: Wrench },
    ],
  },
]

export function setoresDoDominio(dominioId: string) {
  const dom = DOMINIOS_HIERARQUIA.find((d) => d.id === dominioId)
  if (!dom) return []
  return dom.setores.map((s) => ({
    ...s,
    itens: NAVEGACAO.filter((n) => n.dominio === dominioId && n.setor === s.id),
  }))
}

/**
 * Lista achatada e SEM DUPLICATAS.
 *
 * Com a macro Reforma Tributária, a mesma seção passa a existir em duas
 * plataformas (a macro e a de área). Sem deduplicar, o menu lateral mostraria
 * "Normas" duas vezes e a busca por tecla encontraria dois destinos — o
 * usuário apertaria "1" e não saberia qual abrir. Aqui a primeira ocorrência
 * vence, e a ordem das plataformas define qual é.
 */
export const NAVEGACAO: LinkNavegacao[] = GRUPOS.flatMap((g) => g.itens).filter(
  (item, i, arr) => arr.findIndex((x) => x.href === item.href) === i,
)
export const TOTAL_ITENS = NAVEGACAO.length
export const TOTAL_GRUPOS = GRUPOS.length
