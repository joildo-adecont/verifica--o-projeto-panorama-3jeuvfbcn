/**
 * Serviço de Indicadores Econômicos e Financeiros (Plataforma Administrativa).
 *
 * Os dados vêm SEMPRE do backend (rotas /backend/v1/indicadores-economicos e
 * /backend/v1/fontes-estatisticas em pb_hooks/), que consulta as APIs públicas
 * do lado do servidor — Banco Central (SGS/PTAX/Olinda), IBGE SIDRA, Tesouro
 * SICONFI, IPEADATA, CONAB, Cepea-Esalq, FipeZap, INEP, DATASUS e SNIS — com
 * timeout curto. NUNCA
 * chamada direta do navegador (padrão anti-bloqueio do projeto).
 *
 * Se a fonte viva falhar, o hook devolve a base interna aproximada com
 * `fonteViva: false` e um aviso transparente; se nem o proxy responder, este
 * serviço cai para o mesmo fallback interno, também com aviso explícito.
 */
import pb from '@/lib/pocketbase/client'

export type CategoriaIndicador = 'inflacao' | 'taxa'

export interface IndicadorEconomico {
  chave: string
  nome: string
  categoria: CategoriaIndicador
  unidade: string
  valorAtual: number
  variacao: number
  dataReferencia: string
  /** Últimos 12 pontos da série (mais antigo → mais recente). */
  serie: number[]
  descricao: string
}

export interface MoedaCotacao {
  codigo: string
  nome: string
  cotacaoCompra: number
  cotacaoVenda: number
  dataCotacao: string
}

export interface RespostaIndicadores {
  fonteViva: boolean
  atualizadoEm: string
  aviso: string
  indicadores: IndicadorEconomico[]
  moedas: MoedaCotacao[]
  moedasDisponiveis: { codigo: string; nome: string }[]
}

export interface ItemIndicadorBusca {
  titulo: string
  descricao: string
  valor: string
  data: string
  fonte: string
  fonteUrl: string
  categoria: CategoriaIndicador | 'moeda'
  ancora: string
  /** Fonte estatística de origem (ibge | tesouro | ipea) — presente só nos itens das novas fontes. */
  fonteEstatistica?: FonteEstatisticaId
  /** false quando veio da base interna (fonte oficial indisponível no momento). */
  fonteViva?: boolean
}

const URL_ROTA = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/indicadores-economicos`
const URL_ROTA_ESTATISTICAS = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/fontes-estatisticas`

export type FonteEstatisticaId =
  | 'ibge'
  | 'tesouro'
  | 'ipea'
  | 'ibge_agro'
  | 'conab'
  | 'cepea'
  | 'fipezap'
  | 'bcb_sfh'
  | 'inep'
  | 'datasus'
  | 'snis'

export const FONTES_ESTATISTICAS_META: Record<
  FonteEstatisticaId,
  { rotulo: string; url: string; tier: 'oficial_institucional' }
> = {
  ibge: {
    rotulo: 'IBGE — Instituto Brasileiro de Geografia e Estatística (SIDRA)',
    url: 'https://www.ibge.gov.br',
    tier: 'oficial_institucional',
  },
  tesouro: {
    rotulo: 'Tesouro Nacional — Tesouro Transparente (SICONFI)',
    url: 'https://www.tesourotransparente.gov.br',
    tier: 'oficial_institucional',
  },
  ipea: {
    rotulo: 'IPEA — Instituto de Pesquisa Econômica Aplicada (IPEADATA)',
    url: 'https://www.ipeadata.gov.br',
    tier: 'oficial_institucional',
  },
  ibge_agro: {
    rotulo: 'IBGE — Levantamento Sistemático da Produção Agrícola (LSPA)',
    url: 'https://www.ibge.gov.br',
    tier: 'oficial_institucional',
  },
  conab: {
    rotulo: 'CONAB — Companhia Nacional de Abastecimento',
    url: 'https://www.conab.gov.br',
    tier: 'oficial_institucional',
  },
  cepea: {
    rotulo: 'Cepea/Esalq-USP — Centro de Estudos Avançados em Economia Aplicada',
    url: 'https://www.cepea.esalq.usp.br',
    tier: 'oficial_institucional',
  },
  fipezap: {
    rotulo: 'FipeZap — Índice de Preços de Imóveis (Fipe/Zap+)',
    url: 'https://www.fipe.org.br',
    tier: 'oficial_institucional',
  },
  bcb_sfh: {
    rotulo: 'Banco Central — Sistema Financeiro de Habitação (SFH)',
    url: 'https://www.bcb.gov.br',
    tier: 'oficial_institucional',
  },
  inep: {
    rotulo: 'INEP/MEC — Censo da Educação Básica e IDEB',
    url: 'https://www.gov.br/inep',
    tier: 'oficial_institucional',
  },
  datasus: {
    rotulo: 'DATASUS — Ministério da Saúde (SINASC · AIH/SUS · TABNET)',
    url: 'https://datasus.saude.gov.br',
    tier: 'oficial_institucional',
  },
  snis: {
    rotulo: 'SNIS — Sistema Nacional de Informações sobre Saneamento (Ministério das Cidades)',
    url: 'https://www.gov.br/cidades',
    tier: 'oficial_institucional',
  },
}

export interface IndicadorEstatistico {
  chave: string
  nome: string
  categoria: string
  unidade: string
  valor: number
  periodo: string
  variacao: number
  serie: number[]
  fonte: string
  /** true quando o dado veio da base interna (fonte oficial indisponível). */
  baseInterna?: boolean
  nota?: string
}

export interface FonteEstatistica {
  fonte: FonteEstatisticaId
  fonteNome: string
  fonteViva: boolean
  aviso: string
  selo: 'oficial_institucional'
  atualizadoEm: string
  indicadores: IndicadorEstatistico[]
}

export interface RespostaFontesEstatisticas {
  ok: boolean
  geradoEm: string
  fontes: FonteEstatistica[]
}

/** Base interna aproximada — usada só quando BCB e cache falham (aviso transparente). */
export const FALLBACK_INDICADORES: IndicadorEconomico[] = [
  {
    chave: 'ipca',
    nome: 'IPCA',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.26,
    variacao: -0.11,
    dataReferencia: '',
    serie: [0.38, 0.24, 0.24, 0.21, 0.38, 0.17, 0.22, 0.38, 0.44, 0.42, 0.48, 0.26],
    descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE/BCB série 433',
  },
  {
    chave: 'igpm',
    nome: 'IGP-M',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.31,
    variacao: 0.05,
    dataReferencia: '',
    serie: [0.42, 0.95, -0.44, -0.51, 0.64, 0.87, -0.19, 0.22, 0.41, 0.65, 0.28, 0.31],
    descricao: 'Índice Geral de Preços — Mercado — FGV/BCB série 189',
  },
  {
    chave: 'inpc',
    nome: 'INPC',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.22,
    variacao: -0.09,
    dataReferencia: '',
    serie: [0.42, 0.36, 0.38, 0.24, 0.51, 0.25, 0.19, 0.35, 0.46, 0.39, 0.42, 0.22],
    descricao: 'Índice Nacional de Preços ao Consumidor — IBGE/BCB série 188',
  },
  {
    chave: 'ipc',
    nome: 'IPC',
    categoria: 'inflacao',
    unidade: '% a.m.',
    valorAtual: 0.24,
    variacao: 0.02,
    dataReferencia: '',
    serie: [0.31, 0.29, 0.27, 0.22, 0.36, 0.19, 0.21, 0.31, 0.38, 0.35, 0.41, 0.24],
    descricao: 'Índice de Preços ao Consumidor — Fipe/BCB série 192',
  },
  {
    chave: 'selic',
    nome: 'Selic',
    categoria: 'taxa',
    unidade: '% a.a.',
    valorAtual: 15.0,
    variacao: 0.0,
    dataReferencia: '',
    serie: [13.25, 13.25, 13.5, 14.25, 14.75, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0],
    descricao: 'Taxa básica de juros — Copom/BCB série 4390',
  },
  {
    chave: 'cdi',
    nome: 'CDI',
    categoria: 'taxa',
    unidade: '% a.a.',
    valorAtual: 14.9,
    variacao: 0.0,
    dataReferencia: '',
    serie: [13.15, 13.15, 13.4, 14.15, 14.65, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9],
    descricao: 'Taxa DI média diária — B3/BCB série 12',
  },
  {
    chave: 'tr',
    nome: 'TR',
    categoria: 'taxa',
    unidade: '% a.m.',
    valorAtual: 0.09,
    variacao: 0.01,
    dataReferencia: '',
    serie: [0.05, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.09, 0.09, 0.09, 0.09],
    descricao: 'Taxa Referencial — BCB série 226',
  },
  {
    chave: 'poupanca',
    nome: 'Poupança',
    categoria: 'taxa',
    unidade: '% a.m.',
    valorAtual: 0.62,
    variacao: 0.0,
    dataReferencia: '',
    serie: [0.54, 0.54, 0.55, 0.58, 0.6, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62],
    descricao: 'Rendimento da poupança — BCB série 195',
  },
]

export const FALLBACK_MOEDAS: MoedaCotacao[] = [
  {
    codigo: 'USD',
    nome: 'Dólar americano',
    cotacaoCompra: 5.4,
    cotacaoVenda: 5.41,
    dataCotacao: '',
  },
  { codigo: 'EUR', nome: 'Euro', cotacaoCompra: 6.3, cotacaoVenda: 6.31, dataCotacao: '' },
  {
    codigo: 'GBP',
    nome: 'Libra esterlina',
    cotacaoCompra: 7.3,
    cotacaoVenda: 7.31,
    dataCotacao: '',
  },
  {
    codigo: 'JPY',
    nome: 'Iene japonês',
    cotacaoCompra: 0.036,
    cotacaoVenda: 0.0361,
    dataCotacao: '',
  },
  {
    codigo: 'ARS',
    nome: 'Peso argentino',
    cotacaoCompra: 0.0045,
    cotacaoVenda: 0.0046,
    dataCotacao: '',
  },
  { codigo: 'CNY', nome: 'Yuan chinês', cotacaoCompra: 0.75, cotacaoVenda: 0.751, dataCotacao: '' },
  {
    codigo: 'CAD',
    nome: 'Dólar canadense',
    cotacaoCompra: 3.9,
    cotacaoVenda: 3.91,
    dataCotacao: '',
  },
  { codigo: 'CHF', nome: 'Franco suíço', cotacaoCompra: 6.6, cotacaoVenda: 6.61, dataCotacao: '' },
  {
    codigo: 'AUD',
    nome: 'Dólar australiano',
    cotacaoCompra: 3.55,
    cotacaoVenda: 3.56,
    dataCotacao: '',
  },
]

const MOEDAS_DISPONIVEIS_FALLBACK = FALLBACK_MOEDAS.map((m) => ({
  codigo: m.codigo,
  nome: m.nome,
}))

const DESCRICOES_FALLBACK = new Map(FALLBACK_INDICADORES.map((i) => [i.chave, i.descricao]))

export function respostaFallback(aviso: string): RespostaIndicadores {
  const agora = new Date().toISOString()
  return {
    fonteViva: false,
    atualizadoEm: agora,
    aviso,
    indicadores: FALLBACK_INDICADORES.map((i) => ({ ...i, serie: [...i.serie] })),
    moedas: FALLBACK_MOEDAS.map((m) => ({ ...m })),
    moedasDisponiveis: MOEDAS_DISPONIVEIS_FALLBACK,
  }
}

function normalizarIndicador(bruto: Record<string, unknown>): IndicadorEconomico {
  const serie = Array.isArray(bruto.serie) ? (bruto.serie as number[]) : []
  return {
    chave: String(bruto.chave || ''),
    nome: String(bruto.nome || ''),
    categoria: bruto.categoria === 'taxa' ? 'taxa' : 'inflacao',
    unidade: String(bruto.unidade || ''),
    valorAtual: Number(bruto.valorAtual || 0),
    variacao: Number(bruto.variacao || 0),
    dataReferencia: String(bruto.dataReferencia || ''),
    serie,
    descricao: String(bruto.descricao || DESCRICOES_FALLBACK.get(String(bruto.chave)) || ''),
  }
}

function normalizarMoeda(bruto: Record<string, unknown>): MoedaCotacao {
  return {
    codigo: String(bruto.codigo || ''),
    nome: String(bruto.nome || ''),
    cotacaoCompra: Number(bruto.cotacaoCompra || 0),
    cotacaoVenda: Number(bruto.cotacaoVenda || 0),
    dataCotacao: String(bruto.dataCotacao || ''),
  }
}

/**
 * Fallback interno das fontes estatísticas — usado só quando o backend responde
 * mal ou sem nenhuma série (aviso transparente, nunca erro cru).
 */
export function respostaFontesEstatisticasFallback(aviso: string): RespostaFontesEstatisticas {
  const agora = new Date().toISOString()
  const interna = (fonte: FonteEstatisticaId, fonteNome: string): FonteEstatistica => {
    const base: Record<FonteEstatisticaId, IndicadorEstatistico[]> = {
      ibge: [
        {
          chave: 'ipca',
          nome: 'IPCA — variação % mensal (base interna)',
          categoria: 'inflacao',
          unidade: '%',
          valor: 0.42,
          periodo: 'último mês disponível',
          variacao: 0.05,
          serie: [0.38, 0.4, 0.45, 0.42],
          fonte: 'IBGE',
          baseInterna: true,
        },
        {
          chave: 'pib',
          nome: 'PIB — variação % trimestral (base interna)',
          categoria: 'atividade',
          unidade: '%',
          valor: 0.9,
          periodo: 'último trimestre disponível',
          variacao: 0.1,
          serie: [0.7, 0.8, 0.8, 0.9],
          fonte: 'IBGE',
          baseInterna: true,
        },
        {
          chave: 'desemprego',
          nome: 'Taxa de desemprego — PNAD Contínua (base interna)',
          categoria: 'trabalho',
          unidade: '%',
          valor: 7.5,
          periodo: 'último trimestre móvel disponível',
          variacao: -0.2,
          serie: [7.9, 7.8, 7.7, 7.5],
          fonte: 'IBGE',
          baseInterna: true,
        },
      ],
      tesouro: [
        {
          chave: 'divida',
          nome: 'Dívida pública federal — % do PIB (base interna)',
          categoria: 'fiscal',
          unidade: '%',
          valor: 76.8,
          periodo: 'último exercício disponível',
          variacao: 0.9,
          serie: [74.2, 75.1, 75.9, 76.8],
          fonte: 'Tesouro Nacional',
          baseInterna: true,
        },
      ],
      ipea: [
        {
          chave: 'igpm',
          nome: 'IGP-M — variação % em 12 meses (base interna)',
          categoria: 'inflacao',
          unidade: '%',
          valor: 4.8,
          periodo: 'últimos 12 meses disponíveis',
          variacao: -0.4,
          serie: [5.6, 5.4, 5.1, 4.8],
          fonte: 'IPEA',
          baseInterna: true,
        },
        {
          chave: 'salmin',
          nome: 'Salário mínimo — variação % em 12 meses (base interna)',
          categoria: 'renda',
          unidade: '%',
          valor: 4.5,
          periodo: 'últimos 12 meses disponíveis',
          variacao: 0.3,
          serie: [3.9, 4.1, 4.2, 4.5],
          fonte: 'IPEA',
          baseInterna: true,
        },
      ],
      ibge_agro: [
        {
          chave: 'agro_producao',
          nome: 'Produção da agropecuária — variação % anual (base interna)',
          categoria: 'agronegocio',
          unidade: '%',
          valor: 2.9,
          periodo: 'último ano disponível',
          variacao: 0.3,
          serie: [2.1, 2.4, 2.6, 2.9],
          fonte: 'IBGE — Agronegócio',
          baseInterna: true,
        },
      ],
      conab: [
        {
          chave: 'conab_safra',
          nome: 'Safra brasileira de grãos — produção total estimada (base interna)',
          categoria: 'agronegocio',
          unidade: 'mil t',
          valor: 322000,
          periodo: 'último levantamento consolidado',
          variacao: 4100,
          serie: [298000, 303000, 318000, 322000],
          fonte: 'CONAB',
          baseInterna: true,
        },
      ],
      cepea: [
        {
          chave: 'boi_gordo',
          nome: 'Boi gordo Cepea-Esalq — R$/arroba (base interna)',
          categoria: 'agronegocio',
          unidade: 'R$/@',
          valor: 322.5,
          periodo: 'última cotação disponível',
          variacao: 1.2,
          serie: [308.4, 312.9, 318.6, 322.5],
          fonte: 'Cepea-Esalq/USP',
          baseInterna: true,
        },
        {
          chave: 'soja',
          nome: 'Soja Cepea-Esalq — R$/sc 60 kg (base interna)',
          categoria: 'agronegocio',
          unidade: 'R$/sc',
          valor: 142.8,
          periodo: 'última cotação disponível',
          variacao: -0.8,
          serie: [148.2, 146.1, 144.0, 142.8],
          fonte: 'Cepea-Esalq/USP',
          baseInterna: true,
        },
        {
          chave: 'milho',
          nome: 'Milho Cepea-Esalq — R$/sc 60 kg (base interna)',
          categoria: 'agronegocio',
          unidade: 'R$/sc',
          valor: 58.4,
          periodo: 'última cotação disponível',
          variacao: 0.5,
          serie: [56.2, 57.0, 57.9, 58.4],
          fonte: 'Cepea-Esalq/USP',
          baseInterna: true,
        },
      ],
      fipezap: [
        {
          chave: 'fipezap',
          nome: 'FipeZap — imóveis residenciais anunciados, % a.m. (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.m.',
          valor: 0.45,
          periodo: 'último mês disponível',
          variacao: 0.05,
          serie: [0.32, 0.36, 0.4, 0.45],
          fonte: 'FipeZap (Fipe/ZAP+)',
          baseInterna: true,
        },
      ],
      bcb_sfh: [
        {
          chave: 'tr',
          nome: 'TR — Taxa Referencial, % a.m. (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.m.',
          valor: 0.08,
          periodo: 'último mês disponível',
          variacao: 0,
          serie: [0.08, 0.08, 0.08, 0.08],
          fonte: 'Banco Central — SFH',
          baseInterna: true,
        },
        {
          chave: 'tjlp',
          nome: 'TJLP — Taxa de Juros de Longo Prazo, % a.a. (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.a.',
          valor: 7.5,
          periodo: 'último trimestre disponível',
          variacao: 0,
          serie: [7.5, 7.5, 7.5, 7.5],
          fonte: 'Banco Central — SFH',
          baseInterna: true,
        },
        {
          chave: 'igpm12',
          nome: 'IGP-M 12 meses — correção de financiamentos SFH (base interna)',
          categoria: 'imobiliario',
          unidade: '% a.a.',
          valor: 4.8,
          periodo: 'últimos 12 meses disponíveis',
          variacao: -0.4,
          serie: [5.6, 5.4, 5.1, 4.8],
          fonte: 'Banco Central — SFH',
          baseInterna: true,
        },
      ],
      inep: [
        {
          chave: 'matriculas_basica',
          nome: 'Matrículas na educação básica — Censo Escolar (base interna)',
          categoria: 'educacao',
          unidade: 'milhões',
          valor: 47.3,
          periodo: 'último Censo da Educação Básica disponível',
          variacao: 0.4,
          serie: [46.8, 47.0, 47.0, 47.3],
          fonte: 'INEP/MEC',
          baseInterna: true,
        },
        {
          chave: 'ideb_anos_iniciais',
          nome: 'IDEB — anos iniciais do ensino fundamental (base interna)',
          categoria: 'educacao',
          unidade: 'pontos IDEB',
          valor: 6.0,
          periodo: 'última edição do IDEB disponível',
          variacao: 0.1,
          serie: [5.7, 5.8, 5.9, 6.0],
          fonte: 'INEP/MEC',
          baseInterna: true,
        },
        {
          chave: 'ideb_anos_finais',
          nome: 'IDEB — anos finais do ensino fundamental (base interna)',
          categoria: 'educacao',
          unidade: 'pontos IDEB',
          valor: 5.2,
          periodo: 'última edição do IDEB disponível',
          variacao: 0.1,
          serie: [4.9, 5.0, 5.1, 5.2],
          fonte: 'INEP/MEC',
          baseInterna: true,
        },
      ],
      datasus: [
        {
          chave: 'nascidos_vivos',
          nome: 'Nascidos vivos registrados — SINASC, saúde (base interna)',
          categoria: 'saude',
          unidade: 'milhões/ano',
          valor: 2.52,
          periodo: 'último ano disponível',
          variacao: -0.02,
          serie: [2.55, 2.54, 2.53, 2.52],
          fonte: 'DATASUS — Ministério da Saúde',
          baseInterna: true,
        },
        {
          chave: 'internacoes_aih',
          nome: 'Internações hospitalares SUS — AIH/SIH (base interna)',
          categoria: 'saude',
          unidade: 'milhões/ano',
          valor: 11.2,
          periodo: 'último ano disponível',
          variacao: 0.1,
          serie: [11.0, 11.1, 11.1, 11.2],
          fonte: 'DATASUS — Ministério da Saúde',
          baseInterna: true,
        },
        {
          chave: 'mortalidade_infantil',
          nome: 'Mortalidade infantil — por 1.000 nascidos vivos, saúde (base interna)',
          categoria: 'saude',
          unidade: 'por 1.000 nascidos vivos',
          valor: 12.5,
          periodo: 'último ano disponível',
          variacao: -0.3,
          serie: [13.4, 13.1, 12.8, 12.5],
          fonte: 'DATASUS — Ministério da Saúde',
          baseInterna: true,
        },
      ],
      snis: [
        {
          chave: 'acesso_agua',
          nome: 'Acesso à água potável — % da população (base interna)',
          categoria: 'saneamento',
          unidade: '% da população',
          valor: 84.2,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: 0.8,
          serie: [82.1, 82.9, 83.4, 84.2],
          fonte: 'SNIS — Ministério das Cidades',
          baseInterna: true,
        },
        {
          chave: 'coleta_esgoto',
          nome: 'Acesso à coleta de esgoto — % da população (base interna)',
          categoria: 'saneamento',
          unidade: '% da população',
          valor: 63.4,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: 1.1,
          serie: [60.2, 61.3, 62.3, 63.4],
          fonte: 'SNIS — Ministério das Cidades',
          baseInterna: true,
        },
        {
          chave: 'tratamento_esgoto',
          nome: 'Esgoto tratado — % do esgoto coletado (base interna)',
          categoria: 'saneamento',
          unidade: '% do coletado',
          valor: 52.6,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: 1.4,
          serie: [49.0, 50.3, 51.2, 52.6],
          fonte: 'SNIS — Ministério das Cidades',
          baseInterna: true,
        },
        {
          chave: 'perda_agua',
          nome: 'Perda de água na distribuição — % do volume (base interna)',
          categoria: 'saneamento',
          unidade: '% do volume',
          valor: 39.8,
          periodo: 'último Diagnóstico SNIS disponível',
          variacao: -0.6,
          serie: [41.2, 40.7, 40.4, 39.8],
          fonte: 'SNIS — Ministério das Cidades',
          baseInterna: true,
        },
      ],
    }
    const nomes: Record<FonteEstatisticaId, string> = {
      ibge: 'IBGE',
      tesouro: 'Tesouro Nacional',
      ipea: 'IPEA',
      ibge_agro: 'IBGE — Agronegócio',
      conab: 'CONAB',
      cepea: 'Cepea-Esalq/USP',
      fipezap: 'FipeZap',
      bcb_sfh: 'Banco Central — SFH',
      inep: 'INEP/MEC',
      datasus: 'DATASUS — Ministério da Saúde',
      snis: 'SNIS — Ministério das Cidades',
    }
    return {
      fonte,
      fonteNome: nomes[fonte],
      fonteViva: false,
      aviso:
        'A fonte ' +
        nomes[fonte] +
        ' está indisponível neste momento. Os valores vêm da base interna aproximada do sistema — confira a fonte oficial antes de usar em publicações.' +
        (aviso ? ' (' + aviso + ')' : ''),
      selo: 'oficial_institucional',
      atualizadoEm: agora,
      indicadores: base[fonte].map((i) => ({ ...i, serie: [...i.serie] })),
    }
  }
  return {
    ok: true,
    geradoEm: agora,
    fontes: [
      interna('ibge', 'IBGE'),
      interna('tesouro', 'Tesouro Nacional'),
      interna('ipea', 'IPEA'),
      interna('ibge_agro', 'IBGE — Agronegócio'),
      interna('conab', 'CONAB'),
      interna('cepea', 'Cepea-Esalq/USP'),
      interna('fipezap', 'FipeZap'),
      interna('bcb_sfh', 'Banco Central — SFH'),
      interna('inep', 'INEP/MEC'),
      interna('datasus', 'DATASUS — Ministério da Saúde'),
      interna('snis', 'SNIS — Ministério das Cidades'),
    ],
  }
}

function normalizarIndicadorEstatistico(bruto: Record<string, unknown>): IndicadorEstatistico {
  const serie = Array.isArray(bruto.serie) ? (bruto.serie as number[]) : []
  return {
    chave: String(bruto.chave || ''),
    nome: String(bruto.nome || ''),
    categoria: String(bruto.categoria || ''),
    unidade: String(bruto.unidade || ''),
    valor: Number(bruto.valor || 0),
    periodo: String(bruto.periodo || ''),
    variacao: Number(bruto.variacao || 0),
    serie,
    fonte: String(bruto.fonte || ''),
    baseInterna: Boolean(bruto.baseInterna),
    nota: bruto.nota ? String(bruto.nota) : undefined,
  }
}

/**
 * Busca as fontes estatísticas no backend (proxy IBGE SIDRA / Tesouro SICONFI /
 * IPEADATA). Nunca lança: qualquer falha devolve fallback interno com aviso.
 */
export async function fetchFontesEstatisticas(
  fonte: FonteEstatisticaId | 'todas' = 'todas',
): Promise<RespostaFontesEstatisticas> {
  try {
    const res = await fetch(`${URL_ROTA_ESTATISTICAS}?fonte=${encodeURIComponent(fonte)}`, {
      headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
    })
    if (!res.ok) throw new Error(`Backend respondeu ${res.status}`)
    const bruto = (await res.json()) as Record<string, unknown>
    const fontesBrutas = Array.isArray(bruto.fontes)
      ? (bruto.fontes as Record<string, unknown>[])
      : []
    const fontes: FonteEstatistica[] = fontesBrutas
      .filter((f) => f && typeof f.fonte === 'string')
      .map((f) => {
        const chaveFonte = String(f.fonte)
        const id: FonteEstatisticaId =
          chaveFonte === 'Tesouro Nacional'
            ? 'tesouro'
            : chaveFonte === 'IPEA'
              ? 'ipea'
              : chaveFonte === 'IBGE — Agronegócio'
                ? 'ibge_agro'
                : chaveFonte === 'CONAB'
                  ? 'conab'
                  : chaveFonte === 'Cepea-Esalq/USP'
                    ? 'cepea'
                    : chaveFonte === 'FipeZap'
                      ? 'fipezap'
                      : chaveFonte === 'Banco Central — SFH'
                        ? 'bcb_sfh'
                        : chaveFonte === 'INEP/MEC'
                          ? 'inep'
                          : chaveFonte === 'DATASUS — Ministério da Saúde'
                            ? 'datasus'
                            : chaveFonte === 'SNIS — Ministério das Cidades'
                              ? 'snis'
                              : 'ibge'
        return {
          fonte: id,
          fonteNome: chaveFonte,
          fonteViva: Boolean(f.fonteViva),
          aviso: String(f.aviso || ''),
          selo: 'oficial_institucional',
          atualizadoEm: String(f.atualizadoEm || bruto.geradoEm || new Date().toISOString()),
          indicadores: Array.isArray(f.indicadores)
            ? (f.indicadores as Record<string, unknown>[]).map(normalizarIndicadorEstatistico)
            : [],
        }
      })
    if (fontes.length === 0) throw new Error('Resposta sem fontes')
    return {
      ok: bruto.ok !== false,
      geradoEm: String(bruto.geradoEm || new Date().toISOString()),
      fontes,
    }
  } catch {
    return respostaFontesEstatisticasFallback(
      'Falha de comunicação com o proxy do sistema — exibindo a base interna aproximada.',
    )
  }
}

/** Busca os indicadores no backend (proxy BCB). Nunca lança: sempre devolve resposta. */
export async function fetchIndicadoresEconomicos(
  forcarAtualizacao = false,
): Promise<RespostaIndicadores> {
  try {
    const res = await fetch(`${URL_ROTA}${forcarAtualizacao ? '?atualizar=1' : ''}`, {
      headers: pb.authStore.token ? { Authorization: pb.authStore.token } : {},
    })
    if (!res.ok) throw new Error(`Backend respondeu ${res.status}`)
    const bruto = (await res.json()) as Record<string, unknown>
    return {
      fonteViva: Boolean(bruto.fonte_viva),
      atualizadoEm: String(bruto.atualizado_em || new Date().toISOString()),
      aviso: String(bruto.aviso || ''),
      indicadores: Array.isArray(bruto.indicadores)
        ? (bruto.indicadores as Record<string, unknown>[]).map(normalizarIndicador)
        : [],
      moedas: Array.isArray(bruto.moedas)
        ? (bruto.moedas as Record<string, unknown>[]).map(normalizarMoeda)
        : [],
      moedasDisponiveis: Array.isArray(bruto.moedas_disponiveis)
        ? (bruto.moedas_disponiveis as Record<string, unknown>[]).map((m) => ({
            codigo: String(m.codigo || ''),
            nome: String(m.nome || ''),
          }))
        : MOEDAS_DISPONIVEIS_FALLBACK,
    }
  } catch {
    return respostaFallback(
      'Não foi possível consultar o Banco Central agora. Exibindo a base interna aproximada do sistema (não oficial, apenas referência).',
    )
  }
}

/** Paridade cruzada: quantas unidades da moeda B equivalem a 1 unidade da moeda A. */
export function paridadeEntre(a: MoedaCotacao, b: MoedaCotacao): number {
  if (!b.cotacaoCompra) return 0
  return a.cotacaoCompra / b.cotacaoCompra
}

/** Cotação de 1 real na moeda estrangeira (inverso da PTAX). */
export function realNaMoeda(m: MoedaCotacao): number {
  if (!m.cotacaoCompra) return 0
  return 1 / m.cotacaoCompra
}

/** Itens pesquisáveis no modo palavra-chave da Busca Avançada. */
export function itensIndicadoresParaBusca(res: RespostaIndicadores): ItemIndicadorBusca[] {
  const itens: ItemIndicadorBusca[] = res.indicadores.map((i) => ({
    titulo: i.nome,
    descricao: i.descricao,
    valor: `${i.valorAtual.toFixed(2)} ${i.unidade}`,
    data: i.dataReferencia,
    fonte: 'Banco Central do Brasil (BCB) — Oficial institucional',
    fonteUrl: 'https://www.bcb.gov.br/estabilidadefinanceira/seriedados',
    categoria: i.categoria,
    ancora: 'indicadores-economicos',
  }))
  for (const m of res.moedas) {
    itens.push({
      titulo: `${m.nome} (${m.codigo})`,
      descricao: `Cotação de câmbio PTAX — 1 ${m.codigo} em reais`,
      valor: `R$ ${m.cotacaoCompra.toFixed(4)}`,
      data: m.dataCotacao,
      fonte: 'Banco Central do Brasil (BCB) — PTAX/Olinda — Oficial institucional',
      fonteUrl: 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui',
      categoria: 'moeda',
      ancora: 'indicadores-economicos',
    })
  }
  return itens
}

const SINONIMOS_BUSCA: Record<string, string[]> = {
  inflacao: ['ipca', 'inflacao', 'inflação', 'precos', 'preços'],
  dolar: ['dolar', 'dólar', 'usd', 'cambio', 'câmbio', 'moeda', 'moedas'],
  juros: ['selic', 'cdi', 'juros', 'taxa', 'taxas'],
  correcao: ['igpm', 'igp-m', 'inpc', 'ipc', 'tr', 'poupanca', 'poupança', 'correção', 'correcao'],
  estatisticas: [
    'pib',
    'produto interno',
    'desemprego',
    'pnad',
    'emprego',
    'salário mínimo',
    'salario minimo',
    'salário',
    'dívida pública',
    'divida publica',
    'dívida',
    'siconfi',
    'rreo',
    'ipeadata',
    'sidra',
    'estatísticas',
    'estatisticas',
  ],
  agronegocio: [
    'agronegocio',
    'agronegócio',
    'agro',
    'agropecuaria',
    'agropecuária',
    'producao agropecuaria',
    'produção agropecuária',
    'safra',
    'safras',
    'colheita',
    'grao',
    'grão',
    'graos',
    'grãos',
    'estoque',
    'estoques',
    'conab',
    'cepea',
    'esalq',
    'soja',
    'milho',
    'boi',
    'boi gordo',
    'arroba',
    'pecuaria',
    'pecuária',
    'cana',
    'cafe',
    'café',
    'algodao',
    'algodão',
  ],
  imobiliario: [
    'imobiliario',
    'imobiliário',
    'imovel',
    'imóvel',
    'imoveis',
    'imóveis',
    'aluguel',
    'aluguéis',
    'alugueis',
    'fipezap',
    'fipe zap',
    'fipe',
    'zap',
    'sfh',
    'financiamento imobiliario',
    'financiamento imobiliário',
    'financiamento da casa',
    'casa propria',
    'casa própria',
    'habitação',
    'habitacao',
    'caixa economica',
    'caixa econômica',
    'tjlp',
    'tr',
  ],
  educacao: [
    'educacao',
    'educação',
    'escola',
    'escolas',
    'matricula',
    'matrícula',
    'matrículas',
    'ideb',
    'inep',
    'mec',
    'aluno',
    'alunos',
    'ensino',
    'ensino fundamental',
    'ensino medio',
    'ensino médio',
    'censo escolar',
    'professor',
    'professores',
  ],
  saneamento: [
    'saneamento',
    'agua',
    'água',
    'agua potavel',
    'água potável',
    'esgoto',
    'esgotos',
    'coleta de esgoto',
    'tratamento de esgoto',
    'snis',
    'abastecimento',
    'abastecimento de agua',
    'abastecimento de água',
    'perda de agua',
    'perda de água',
    'saneamento basico',
    'saneamento básico',
    'ministério das cidades',
    'ministerio das cidades',
  ],
  saude: [
    'saude',
    'saúde',
    'sus',
    'datasus',
    'tabnet',
    'sinasc',
    'internacao',
    'internação',
    'internações',
    'hospital',
    'hospitalar',
    'nascimento',
    'nascidos vivos',
    'mortalidade',
    'mortalidade infantil',
    'aih',
    'ministério da saúde',
  ],
}

/** Itens pesquisáveis das fontes estatísticas (IBGE, Tesouro, IPEA, agronegócio e imobiliário). */
export function itensFontesEstatisticasParaBusca(
  res: RespostaFontesEstatisticas,
): ItemIndicadorBusca[] {
  const itens: ItemIndicadorBusca[] = []
  for (const f of res.fontes) {
    const meta = FONTES_ESTATISTICAS_META[f.fonte]
    for (const ind of f.indicadores) {
      itens.push({
        titulo: ind.nome,
        descricao:
          (ind.nota ? ind.nota + ' ' : '') +
          'Série oficial da fonte ' +
          f.fonteNome +
          (ind.baseInterna
            ? ' — base interna aproximada (fonte oficial indisponível no momento)'
            : ''),
        valor:
          ind.valor.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) +
          (ind.unidade === '%' ? ' %' : ' ' + ind.unidade),
        data: ind.periodo,
        fonte: f.fonteNome + ' — Oficial institucional',
        fonteUrl: meta.url,
        categoria: 'inflacao',
        ancora: 'indicadores-economicos',
        fonteEstatistica: f.fonte,
        fonteViva: f.fonteViva,
      })
    }
  }
  return itens
}

/** Busca simples por palavra-chave sobre os indicadores, moedas e fontes estatísticas. */
export function buscarIndicadoresPorPalavraChave(
  termo: string,
  res: RespostaIndicadores,
  resEstatisticas?: RespostaFontesEstatisticas,
): ItemIndicadorBusca[] {
  const t = termo.trim().toLowerCase()
  if (!t) return []
  const termos = t.split(/\s+/)
  const alvos = new Set<string>(termos)
  for (const lista of Object.values(SINONIMOS_BUSCA)) {
    if (lista.some((s) => t.includes(s))) lista.forEach((s) => alvos.add(s))
  }
  const base = itensIndicadoresParaBusca(res)
  if (resEstatisticas) {
    for (const item of itensFontesEstatisticasParaBusca(resEstatisticas)) {
      base.push(item)
    }
  }
  return base.filter((item) => {
    const haystack =
      `${item.titulo} ${item.descricao} ${item.categoria} ${item.fonte}`.toLowerCase()
    return [...alvos].some((palavra) => haystack.includes(palavra))
  })
}
