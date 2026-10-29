/**
 * Registro cronológico da legislação da reforma tributária do consumo.
 *
 * Este arquivo é a FONTE ÚNICA da linha do tempo exibida no Monitor Legislativo
 * (Seção 12A). Cada item carrega:
 *   - a data de assinatura (a que vale para a URN LexML, não a de publicação);
 *   - a URN oficial, que abre o texto integral no normas.leg.br;
 *   - se já está incorporada ao Panorama e em qual seção ela aparece;
 *   - o hash do texto, quando conferido, para detectar alteração futura.
 *
 * Conferido em 28/10/2026 contra:
 *   - Senado Dados Abertos (catálogo de Leis Complementares 2025–2026)
 *   - Diário Oficial da União / Imprensa Nacional
 *   - CGIBS (resoluções)
 *
 * REGRA: só entra aqui o que tem data e fonte conferidas. Norma sem data
 * confirmada fica fora até ser conferida — melhor faltar do que inventar.
 */

export type TipoNorma =
  | 'Emenda Constitucional'
  | 'Lei Complementar'
  | 'Decreto'
  | 'Portaria Conjunta'
  | 'Ato Conjunto'
  | 'Resolução'

export type SituacaoNorma = 'vigente' | 'alterada' | 'revogada'

export interface ItemCronologia {
  /** Código curto e estável, usado como chave em todo o sistema */
  codigo: string
  tipo: TipoNorma
  /** Data de assinatura — AAAA-MM-DD */
  data: string
  /** Data de publicação no DOU, quando diferente */
  publicacao?: string
  titulo: string
  /** Uma linha sobre o objeto da norma */
  objeto: string
  urn?: string
  /** Endereço que abre o texto — sempre a fonte que responde */
  url: string
  situacao: SituacaoNorma
  /** O que a norma fez com a reforma do consumo */
  papel: 'estrutura' | 'regulamento' | 'alteracao' | 'combustivel' | 'simples' | 'organizacao'
  incorporada: boolean
  /** Onde ela aparece no Panorama, quando incorporada */
  secao?: string
  /** Observação de conferência */
  nota?: string
}

/**
 * A linha do tempo. Ordem: da mais recente para a mais antiga.
 * Agrupada por ano no componente, não aqui — a ordem do array é o que importa.
 */
export const CRONOLOGIA: ItemCronologia[] = [
  // ───────────────────────── 2026 ─────────────────────────
  {
    codigo: 'Decreto 13.140/2026',
    tipo: 'Decreto',
    data: '2026-10-21',
    titulo: 'Decreto nº 13.140',
    objeto: 'Nanoempreendedor e MEI — dispensa de CNPJ e de documento fiscal eletrônico',
    urn: 'urn:lex:br:federal:decreto:2026-10-21;13140',
    url: 'https://www.in.gov.br/web/dou/-/decreto-n-13.140-de-21-de-outubro-de-2026-739686339',
    situacao: 'vigente',
    papel: 'simples',
    incorporada: true,
    secao: 'Seção 1 — Arcabouço normativo',
    nota: 'Dispensas valem no IBS só a partir de 01/01/2029, após manifestação do CGIBS.',
  },
  {
    codigo: 'LC 238/2026',
    tipo: 'Lei Complementar',
    data: '2026-10-21',
    titulo: 'Lei Complementar nº 238',
    objeto: 'Novo limite do MEI (R$ 140 mil a partir de 2028) e até 2 empregados',
    urn: 'urn:lex:br:federal:lei.complementar:2026-10-21;238',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-10-21;238',
    situacao: 'vigente',
    papel: 'simples',
    incorporada: true,
    secao: 'Seção 6E — aba LC 238/2026',
    nota: 'Não altera o sublimite de R$ 3,6 mi do IBS/CBS no Simples.',
  },
  {
    codigo: 'ATC RFB/CGIBS 9/2026',
    tipo: 'Ato Conjunto',
    data: '2026-10-20',
    publicacao: '2026-10-26',
    titulo: 'Ato Técnico Conjunto RFB/CGIBS nº 9',
    objeto: 'Trabalhos conjuntos RFB/DIREX e 25 Grupos de Trabalho Interinstitucionais',
    url: 'https://www.in.gov.br/web/dou/-/ato-tecnico-conjunto-rfb/cgibs-n-9-de-20-de-outubro-de-2026-740391670',
    situacao: 'vigente',
    papel: 'organizacao',
    incorporada: true,
    secao: 'Seção 6E — aba ATC 9',
    nota: 'Vigência até 31/03/2027. Inclui o GTI 10 — Combustíveis.',
  },
  {
    codigo: 'Decreto 13.133/2026',
    tipo: 'Decreto',
    data: '2026-10-09',
    titulo: 'Decreto nº 13.133',
    objeto: 'Delega ao Ministro da Fazenda divulgar as alíquotas da CBS dos combustíveis',
    urn: 'urn:lex:br:federal:decreto:2026-10-09;13133',
    url: 'https://www.in.gov.br/web/dou/-/decreto-n-13.133-de-9-de-outubro-de-2026-737756208',
    situacao: 'vigente',
    papel: 'combustivel',
    incorporada: true,
    secao: 'Seção 1 — Arcabouço normativo',
    nota: 'Alcança 2027 em diante. Revoga o art. 477 do Decreto 12.955/2026.',
  },
  {
    codigo: 'Portaria Conjunta MF/CGIBS 14/2026',
    tipo: 'Portaria Conjunta',
    data: '2026-10-02',
    publicacao: '2026-10-05',
    titulo: 'Portaria Conjunta MF/CGIBS nº 14',
    objeto: 'Metodologia de cálculo da carga tributária dos combustíveis',
    url: 'https://www.in.gov.br/web/dou/-/portaria-conjunta-mf/cgibs-n-14-de-2-de-outubro-de-2026-736295196',
    situacao: 'vigente',
    papel: 'combustivel',
    incorporada: true,
    secao: 'Seção 6E — aba LC 235/2026',
    nota: 'Aplica-se à CBS em 2027 e ao IBS em 2029.',
  },
  {
    codigo: 'LC 237/2026',
    tipo: 'Lei Complementar',
    data: '2026-09-15',
    titulo: 'Lei Complementar nº 237',
    objeto: 'Exceções à LRF e regime especial de datacenter',
    urn: 'urn:lex:br:federal:lei.complementar:2026-09-15;237',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-09-15;237',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: true,
    secao: 'Seção 1 — Arcabouço normativo',
  },
  {
    codigo: 'LC 236/2026',
    tipo: 'Lei Complementar',
    data: '2026-09-04',
    titulo: 'Lei Complementar nº 236',
    objeto: 'Normas gerais de solução de controvérsias e processo administrativo (CTN)',
    urn: 'urn:lex:br:federal:lei.complementar:2026-09-04;236',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-09-04;236',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Sem dispositivo de IBS/CBS — é norma de processo administrativo.',
  },
  {
    codigo: 'LC 235/2026',
    tipo: 'Lei Complementar',
    data: '2026-08-27',
    publicacao: '2026-08-28',
    titulo: 'Lei Complementar nº 235',
    objeto: 'Renúncias de receita e combustíveis — etanol a zero se a gasolina cair 30%',
    urn: 'urn:lex:br:federal:lei.complementar:2026-08-27;235',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-08-27;235',
    situacao: 'vigente',
    papel: 'combustivel',
    incorporada: true,
    secao: 'Seção 6E — aba LC 235/2026',
  },
  {
    codigo: 'LC 234/2026',
    tipo: 'Lei Complementar',
    data: '2026-08-06',
    titulo: 'Lei Complementar nº 234',
    objeto: 'Altera a LCP 141/2012 — serviços de saneamento',
    urn: 'urn:lex:br:federal:lei.complementar:2026-08-06;234',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-08-06;234',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Zero menções a IBS, CBS ou CGIBS no texto.',
  },
  {
    codigo: 'Decreto 12.955/2026',
    tipo: 'Decreto',
    data: '2026-04-29',
    titulo: 'Decreto nº 12.955 — Regulamento da CBS',
    objeto: 'Regulamento da CBS: 620 artigos e 5 anexos',
    urn: 'urn:lex:br:federal:decreto:2026-04-29;12955',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:decreto:2026-04-29;12955',
    situacao: 'alterada',
    papel: 'regulamento',
    incorporada: true,
    secao: 'Seções 7 e 7A — Anexos',
    nota: 'Alterado pelos Decretos 13.133/2026 (arts. 471 e 476; revoga art. 477).',
  },
  {
    codigo: 'Resolução CGIBS 6/2026',
    tipo: 'Resolução',
    data: '2026-04-30',
    titulo: 'Resolução CGIBS nº 6 — Regulamento do IBS (RIBS)',
    objeto: 'RIBS: 617 artigos, 3 livros e 5 anexos',
    url: 'https://cgibs.gov.br/resolucoes',
    situacao: 'alterada',
    papel: 'regulamento',
    incorporada: true,
    secao: 'Seções 7 e 10',
    nota: 'Alterado pela Resolução CGIBS nº 13/2026.',
  },
  {
    codigo: 'LC 233/2026',
    tipo: 'Lei Complementar',
    data: '2026-07-01',
    titulo: 'Lei Complementar nº 233',
    objeto: 'Destinação de recursos do Fundo Nacional de Segurança Pública',
    urn: 'urn:lex:br:federal:lei.complementar:2026-07-01;233',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-07-01;233',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Zero menções a IBS, CBS ou CGIBS no texto.',
  },
  {
    codigo: 'LC 232/2026',
    tipo: 'Lei Complementar',
    data: '2026-06-26',
    titulo: 'Lei Complementar nº 232',
    objeto: 'Condições à isenção de ISS para determinados fatos geradores',
    urn: 'urn:lex:br:federal:lei.complementar:2026-06-26;232',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-06-26;232',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Trata de ISS, não de IBS — sem impacto direto no regime do consumo.',
  },
  {
    codigo: 'LC 231/2026',
    tipo: 'Lei Complementar',
    data: '2026-06-16',
    titulo: 'Lei Complementar nº 231',
    objeto: 'Altera MPs 2.156-5 e 2.157-5',
    urn: 'urn:lex:br:federal:lei.complementar:2026-06-16;231',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-06-16;231',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Zero menções a IBS, CBS ou CGIBS no texto.',
  },
  {
    codigo: 'LC 230/2026',
    tipo: 'Lei Complementar',
    data: '2026-04-15',
    titulo: 'Lei Complementar nº 230',
    objeto: 'Desmembramento de município para incorporação a outro',
    urn: 'urn:lex:br:federal:lei.complementar:2026-04-15;230',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-04-15;230',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Zero menções a IBS, CBS ou CGIBS no texto.',
  },
  {
    codigo: 'LC 229/2026',
    tipo: 'Lei Complementar',
    data: '2026-03-30',
    titulo: 'Lei Complementar nº 229',
    objeto: 'Benefícios tributários e despesas obrigatórias do exercício de 2026',
    urn: 'urn:lex:br:federal:lei.complementar:2026-03-30;229',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-03-30;229',
    situacao: 'alterada',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Alterada pela LC 237/2026 (regime de datacenter).',
  },
  {
    codigo: 'LC 228/2026',
    tipo: 'Lei Complementar',
    data: '2026-03-19',
    titulo: 'Lei Complementar nº 228',
    objeto: 'Redução de PIS/Cofins da indústria química e petroquímica',
    urn: 'urn:lex:br:federal:lei.complementar:2026-03-19;228',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-03-19;228',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'PIS/Cofins — tributos extintos em 2027, não IBS/CBS.',
  },
  {
    codigo: 'LC 227/2026',
    tipo: 'Lei Complementar',
    data: '2026-01-13',
    titulo: 'Lei Complementar nº 227',
    objeto: 'Institui o Comitê Gestor do IBS e normas gerais do ITCMD',
    urn: 'urn:lex:br:federal:lei.complementar:2026-01-13;227',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-01-13;227',
    situacao: 'vigente',
    papel: 'estrutura',
    incorporada: true,
    secao: 'Seção 1 — Arcabouço normativo',
    nota: 'Altera a LC 214/2025 (revoga o art. 87-B da LC 123).',
  },
  {
    codigo: 'LC 226/2026',
    tipo: 'Lei Complementar',
    data: '2026-01-12',
    titulo: 'Lei Complementar nº 226',
    objeto: 'Pagamentos retroativos de anuênio e triênio (LCP 173/2020)',
    urn: 'urn:lex:br:federal:lei.complementar:2026-01-12;226',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-01-12;226',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: 'Zero menções a IBS, CBS ou CGIBS no texto.',
  },
  {
    codigo: 'LC 225/2026',
    tipo: 'Lei Complementar',
    data: '2026-01-08',
    titulo: 'Lei Complementar nº 225',
    objeto: 'Código de Defesa do Contribuinte',
    urn: 'urn:lex:br:federal:lei.complementar:2026-01-08;225',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-01-08;225',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
    nota: '68 artigos sobre garantias do contribuinte — sem IBS/CBS nominal.',
  },

  // ───────────────────────── 2025 ─────────────────────────
  {
    codigo: 'LC 224/2025',
    tipo: 'Lei Complementar',
    data: '2025-12-26',
    titulo: 'Lei Complementar nº 224',
    objeto: 'Redução e critérios de incentivos e benefícios tributários da União',
    urn: 'urn:lex:br:federal:lei.complementar:2025-12-26;224',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-12-26;224',
    situacao: 'vigente',
    papel: 'alteracao',
    incorporada: false,
  },
  {
    codigo: 'LC 214/2025',
    tipo: 'Lei Complementar',
    data: '2025-01-16',
    titulo: 'Lei Complementar nº 214 — Norma Central',
    objeto: 'Institui o IBS, a CBS e o Imposto Seletivo',
    urn: 'urn:lex:br:federal:lei.complementar:2025-01-16;214',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
    situacao: 'alterada',
    papel: 'estrutura',
    incorporada: true,
    secao: 'Todas as seções do Panorama',
    nota: '544 artigos e 661.175 caracteres conferidos no texto integral. Alterada pela LC 227/2026 e pela LC 235/2026.',
  },

  // ───────────────────────── 2023 ─────────────────────────
  {
    codigo: 'EC 132/2023',
    tipo: 'Emenda Constitucional',
    data: '2023-12-20',
    publicacao: '2023-12-21',
    titulo: 'Emenda Constitucional nº 132',
    objeto: 'Altera o Sistema Tributário Nacional — cria a base constitucional do IBS/CBS',
    urn: 'urn:lex:br:federal:emenda.constitucional:2023-12-20;132',
    url: 'https://normas.leg.br/?urn=urn:lex:br:federal:emenda.constitucional:2023-12-20;132',
    situacao: 'vigente',
    papel: 'estrutura',
    incorporada: true,
    secao: 'Seção 1 e Seção 6',
    nota: 'Art. 156-A (IBS), 195, V (CBS), 153, VIII (IS), 156-B (CGIBS); ADCT arts. 124–137.',
  },
]

/* ─────────────────────── utilitários de leitura ─────────────────────── */

export const POR_ANO = CRONOLOGIA.reduce<Record<string, ItemCronologia[]>>((acc, item) => {
  const ano = item.data.slice(0, 4)
  if (!acc[ano]) acc[ano] = []
  acc[ano].push(item)
  return acc
}, {})

export const ANOS = Object.keys(POR_ANO).sort((a, b) => Number(b) - Number(a))

export const TOTAL = CRONOLOGIA.length
export const INCORPORADAS = CRONOLOGIA.filter((i) => i.incorporada).length
export const PENDENTES = TOTAL - INCORPORADAS
export const ULTIMA = CRONOLOGIA[0]
export const PRIMEIRA = CRONOLOGIA[CRONOLOGIA.length - 1]

export const POR_PAPEL = CRONOLOGIA.reduce<Record<string, number>>((acc, i) => {
  acc[i.papel] = (acc[i.papel] || 0) + 1
  return acc
}, {})

/**
 * Conexões do Monitor com o resto do sistema — cada item é um "pino" que liga
 * a legislação ao dado que dela depende. É o que o CEO chamou de "ícones
 * necessários para conectar todas as tabelas".
 */
export interface Conexao {
  id: string
  rotulo: string
  descricao: string
  alvo: string
  /** Quantos itens há do outro lado, quando mensurável */
  volume?: string
  grupo: 'tabela' | 'secao' | 'simulador' | 'fonte'
  externo?: boolean
}

export const CONEXOES: Conexao[] = [
  {
    id: 'tabela-geral',
    rotulo: 'Tabela Geral dos Anexos',
    descricao: 'Itens de todos os anexos, com tratamento e alíquota',
    alvo: '#tabela-geral',
    volume: '1.053 itens',
    grupo: 'tabela',
  },
  {
    id: 'anexos',
    rotulo: 'Anexos individualizados',
    descricao: '28 anexos: RIBS, LC 214 e Decreto 12.955',
    alvo: '#secao-7',
    volume: '28 anexos',
    grupo: 'tabela',
  },
  {
    id: 'classificacoes',
    rotulo: 'Base de classificações',
    descricao: 'NCM, CEST, cClassTrib, CST, cCredPres, CFOP, NBS, CNAE, cBenef',
    alvo: '#secao-2',
    volume: '11 tabelas',
    grupo: 'tabela',
  },
  {
    id: 'catalogo-simulador',
    rotulo: 'Catálogo do Simulador',
    descricao: 'Itens simuláveis por NCM, NBS e CNAE',
    alvo: '/simulador.html',
    volume: '1.002 itens',
    grupo: 'simulador',
    externo: true,
  },
  {
    id: 'norms',
    rotulo: 'Arcabouço normativo',
    descricao: 'Lista viva das normas carregadas do banco',
    alvo: '#secao-1',
    grupo: 'secao',
  },
  {
    id: 'fontes-primarias',
    rotulo: 'Fontes oficiais primárias',
    descricao: '115 bases indexadas, com órgão e ato de origem',
    alvo: '#fontes-primarias',
    volume: '115 bases',
    grupo: 'fonte',
  },
  {
    id: 'fontes',
    rotulo: 'Fontes e atualização',
    descricao: 'Hierarquia das fontes e rotina de conferência',
    alvo: '#secao-9',
    grupo: 'fonte',
  },
  {
    id: 'historico',
    rotulo: 'Histórico de Atualizações',
    descricao: 'Registro cronológico do que mudou no sistema e na lei',
    alvo: '#historico-atualizacoes',
    grupo: 'secao',
  },
  {
    id: 'controle-acesso',
    rotulo: 'Níveis de acesso',
    descricao: 'Quem pode ver, criar, editar e apagar',
    alvo: '#controle-acesso',
    grupo: 'secao',
  },
  {
    id: 'cronograma',
    rotulo: 'Cronograma 2026–2033',
    descricao: 'Fases da transição e marcos operacionais',
    alvo: '#secao-8',
    grupo: 'secao',
  },
]
