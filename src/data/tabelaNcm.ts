/**
 * TABELA NCM — Nomenclatura Comum do Mercosul, com rastreabilidade
 *
 * ── FONTE E PROCEDÊNCIA ──
 * 15.040 códigos vigentes, espelhados da **Resolução Gecex nº 272/2021** (tabela
 * NCM/TEC). Cada linha carrega o ato de origem: 15.028 sob a 272/2021, e 12 em
 * EXCECOES (a 321/2022 e outros).
 *
 * ── DE ONDE NÃO VEIO, E POR QUÊ ──
 *   · Classif / Siscomex → exige captcha (retorna 1.166 bytes com reCAPTCHA e
 *     hCaptcha). Contornar captcha não é caminho aceitável, e o sistema não faz.
 *   · Receita Federal → a página da NCM explica o que é a TIPI mas NÃO publica o
 *     arquivo; remete ao Classif.
 *   · MDIC / Balança → sem rota do pod.
 * A BrasilAPI é o espelho com ato de origem POR LINHA — é o que permite rastrear
 * cada código até a norma, e é a exigência deste sistema.
 *
 * ── O QUE ESTA TABELA NÃO CONTÉM ──
 * As alterações pontuais posteriores à 272/2021 ficam em ALTERACOES, em camada
 * separada — não embutidas em silêncio. Hoje: Res. Gecex 926/2026 altera 7
 * códigos; a 975 e a 976/2026 mexem em alíquota TEC, não na estrutura.
 *
 * ── O QUE O MONITOR VIGIA ──
 * O agente de fontes consulta o DOU por atos que alterem a NCM/TEC e compara com
 * a data de carga. Se aparecer ato novo, ele entra em ALTERACOES e a tela avisa
 * que a tabela precisa de atualização — sem que ninguém tenha de lembrar.
 */

import { ATO_PREDOMINANTE, EXCECOES, NMCS, TOTAL_NCM } from './tabelaNcmDados'

export { NMCS, TOTAL_NCM, ATO_PREDOMINANTE, EXCECOES }

export interface Ncm {
  /** código só dígitos (2 a 8) */
  c: string
  /** descrição oficial */
  d: string
}

/** Identificação da fonte, para a tela citar sem inventar. */
export const FONTE = {
  ato: 'Resolução Gecex nº 272, de 19/11/2021',
  espelho: 'BrasilAPI /ncm',
  o_que_e: 'Tabela NCM/TEC — Nomenclatura Comum do Mercosul e Tarifa Externa Comum',
  cobertura: '15.040 códigos vigentes, com ato de origem por linha',
  data_carga: '2026-11-05',
  limite:
    'É a tabela BASE. As alterações pontuais posteriores estão em ALTERACOES, em camada separada.',
} as const

/**
 * ALTERAÇÕES POSTERIORES À BASE — camada separada, de propósito.
 *
 * Por que não embutir: aplicar alteração pontual por cima da base exige saber a
 * data de vigência de cada uma, e uma alteração mal aplicada é pior que uma
 * tabela desatualizada — porque PARECE correta. Ficando separado, o contador vê
 * o que mudou e desde quando.
 */
export interface AlteracaoNcm {
  norma: string
  data: string
  ncm: string[]
  efeito: string
  o_que_muda: string
  url: string
  /** já conferida contra o texto do DOU? */
  conferida: boolean
}

export const ALTERACOES: AlteracaoNcm[] = [
  {
    norma: 'Resolução Gecex nº 926, de 24/06/2026',
    data: '2026-06-24',
    ncm: [
      '3913.90.50',
      '8452.10.00',
      '8518.10.90',
      '9202.10.00',
      '9202.90.00',
      '9205.10.00',
      '9205.90.00',
    ],
    efeito: 'Altera descrição e TEC de 7 códigos; vigência a partir de 01/10/2026',
    o_que_muda:
      'Quitosan passa a "Quitosana"; máquina de costura de uso doméstico cai de 20% para 0%; ' +
      'instrumentos musicais de cordas e de metais caem para 0%; 8518.10.90 desdobra em 8518.10.20',
    url: 'https://www.in.gov.br/web/dou/-/resolucao-gecex-n-926-de-24-de-junho-de-2026-714453402',
    conferida: true,
  },
  {
    norma: 'Resolução Gecex nº 976, de 26/10/2026',
    data: '2026-10-26',
    ncm: [],
    efeito: 'Altera o Anexo IX (elevações tarifárias por desequilíbrio comercial)',
    o_que_muda: 'Alíquota TEC de produtos específicos — NÃO altera a estrutura NCM',
    url: 'https://www.in.gov.br/web/dou/-/resolucao-gecex-n-976-de-26-de-outubro-de-2026-740418452',
    conferida: true,
  },
]

/* ══════════════ BUSCA ══════════════ */

/** Índice por código, montado uma vez. */
const POR_CODIGO = new Map<string, Ncm>()
for (const n of NMCS) POR_CODIGO.set(n.c, n)

/** Busca por código: exato primeiro, depois por prefixo. */
export function buscarPorCodigo(termo: string, limite = 100): Ncm[] {
  const t = String(termo || '').replace(/\D/g, '')
  if (!t) return []
  const exato = POR_CODIGO.get(t)
  if (exato) return [exato]
  const out: Ncm[] = []
  for (const n of NMCS) {
    if (n.c.startsWith(t)) {
      out.push(n)
      if (out.length >= limite) break
    }
  }
  return out
}

/**
 * Busca por descrição: sem acento, vários termos em E lógico.
 * Percorre 15 mil registros normalizando — por isso o resultado é limitado:
 * uma lista de 15 mil na tela não ajuda ninguém.
 */
export function buscarPorDescricao(termo: string, limite = 100): Ncm[] {
  const partes = String(termo || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!partes.length) return []
  const out: Ncm[] = []
  for (const n of NMCS) {
    const alvo = n.d
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    if (partes.every((p) => alvo.indexOf(p) >= 0)) {
      out.push(n)
      if (out.length >= limite) break
    }
  }
  return out
}

/** O ato de origem de um código — da exceção, se houver; senão o predominante. */
export function atoDe(codigo: string): string {
  const c = String(codigo || '').replace(/\D/g, '')
  const ex = EXCECOES.find((x) => x.c === c)
  return ex ? ex.a : ATO_PREDOMINANTE
}

/** Nomes dos capítulos — para a listagem ficar legível. */
const NOMES: Record<string, string> = {
  '01': 'Animais vivos',
  '02': 'Carnes e miudezas',
  '03': 'Peixes e crustáceos',
  '04': 'Leite, laticínios, ovos, mel',
  '05': 'Outros produtos de origem animal',
  '06': 'Plantas vivas e floricultura',
  '07': 'Produtos hortícolas',
  '08': 'Frutas e castanhas',
  '09': 'Café, chá, especiarias',
  '10': 'Cereais',
  '11': 'Produtos da moagem',
  '12': 'Sementes e frutos oleaginosos',
  '13': 'Gomas e resinas',
  '14': 'Matérias para trançar',
  '15': 'Gorduras e óleos',
  '16': 'Preparações de carne e peixe',
  '17': 'Açúcares e confeitaria',
  '18': 'Cacau e preparações',
  '19': 'Preparações de cereais',
  '20': 'Preparações de hortícolas e frutas',
  '21': 'Preparações alimentícias diversas',
  '22': 'Bebidas e líquidos alcoólicos',
  '23': 'Resíduos da indústria alimentar',
  '24': 'Fumo e tabaco',
  '25': 'Sal, pedras, cimentos',
  '26': 'Minérios',
  '27': 'Combustíveis minerais',
  '28': 'Produtos químicos inorgânicos',
  '29': 'Produtos químicos orgânicos',
  '30': 'Produtos farmacêuticos',
  '31': 'Adubos e fertilizantes',
  '32': 'Tintas e pigmentos',
  '33': 'Perfumaria e cosméticos',
  '34': 'Sabões e ceras',
  '35': 'Matérias albuminoides',
  '36': 'Pólvoras e explosivos',
  '37': 'Produtos para fotografia',
  '38': 'Produtos diversos das indústrias químicas',
  '39': 'Plásticos e suas obras',
  '40': 'Borracha e suas obras',
  '41': 'Peles e couros',
  '42': 'Obras de couro',
  '43': 'Peleteria',
  '44': 'Madeira e suas obras',
  '45': 'Cortiça',
  '46': 'Obras de espartaria',
  '47': 'Pasta de madeira',
  '48': 'Papel e cartão',
  '49': 'Livros e impressos',
  '50': 'Seda',
  '51': 'Lã e pelos',
  '52': 'Algodão',
  '53': 'Outras fibras têxteis',
  '54': 'Filamentos sintéticos',
  '55': 'Fibras sintéticas',
  '56': 'Pastas e feltros',
  '57': 'Tapetes',
  '58': 'Tecidos especiais',
  '59': 'Tecidos impregnados',
  '60': 'Tecidos de malha',
  '61': 'Vestuário de malha',
  '62': 'Vestuário exceto malha',
  '63': 'Outros artefatos têxteis',
  '64': 'Calçados',
  '65': 'Chapéus',
  '66': 'Guarda-chuvas',
  '67': 'Plumas e flores artificiais',
  '68': 'Obras de pedra e cimento',
  '69': 'Cerâmica',
  '70': 'Vidro',
  '71': 'Pedras preciosas e metais',
  '72': 'Ferro e aço',
  '73': 'Obras de ferro ou aço',
  '74': 'Cobre',
  '75': 'Níquel',
  '76': 'Alumínio',
  '78': 'Chumbo',
  '79': 'Zinco',
  '80': 'Estanho',
  '81': 'Outros metais comuns',
  '82': 'Ferramentas',
  '83': 'Obras de metal diverso',
  '84': 'Máquinas e aparelhos mecânicos',
  '85': 'Máquinas e aparelhos elétricos',
  '86': 'Locomotivas',
  '87': 'Veículos automóveis',
  '88': 'Aeronaves',
  '89': 'Embarcações',
  '90': 'Instrumentos ópticos e médicos',
  '91': 'Relógios',
  '92': 'Instrumentos musicais',
  '93': 'Armas e munições',
  '94': 'Móveis e iluminação',
  '95': 'Brinquedos e jogos',
  '96': 'Obras diversas',
  '97': 'Objetos de arte',
  '98': 'Especiais',
  '99': 'Serviços',
}

export function nomeCapitulo(cap: string): string {
  return NOMES[String(cap).padStart(2, '0')] || `Capítulo ${cap}`
}

/** Capítulos e quantos códigos cada um tem. */
export function capitulos(): { cap: string; total: number; nome: string }[] {
  const m = new Map<string, number>()
  for (const n of NMCS) {
    const cap = n.c.slice(0, 2)
    m.set(cap, (m.get(cap) || 0) + 1)
  }
  return Array.from(m.entries())
    .map(([cap, total]) => ({ cap, total, nome: nomeCapitulo(cap) }))
    .sort((a, b) => a.cap.localeCompare(b.cap))
}

/** Os códigos de um capítulo. */
export function doCapitulo(cap: string): Ncm[] {
  const p = String(cap).padStart(2, '0')
  return NMCS.filter((n) => n.c.startsWith(p))
}
