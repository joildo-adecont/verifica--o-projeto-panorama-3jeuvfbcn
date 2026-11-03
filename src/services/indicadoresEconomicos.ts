/**
 * Serviço de Indicadores Econômicos e Financeiros (Plataforma Administrativa).
 *
 * Os dados vêm SEMPRE do backend (rota /backend/v1/indicadores-economicos em
 * pb_hooks/), que consulta as APIs públicas do Banco Central do lado do
 * servidor — SGS (séries temporais) e PTAX/Olinda (câmbio) — com timeout curto
 * e cache interno. NUNCA chamada direta do navegador (padrão anti-bloqueio do
 * projeto, como no download-resolution).
 *
 * Se a fonte viva falhar, o hook devolve o último snapshot em cache com
 * `fonteViva: false` e um aviso transparente; se nem o cache existir, este
 * serviço cai para uma base interna aproximada, também com aviso explícito.
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
}

const URL_ROTA = `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/indicadores-economicos`

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
        ? (bruto.moedas_disponiveis as Record<string, string>[])
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
}

/** Busca simples por palavra-chave sobre os indicadores e moedas. */
export function buscarIndicadoresPorPalavraChave(
  termo: string,
  res: RespostaIndicadores,
): ItemIndicadorBusca[] {
  const t = termo.trim().toLowerCase()
  if (!t) return []
  const termos = t.split(/\s+/)
  const alvos = new Set<string>(termos)
  for (const lista of Object.values(SINONIMOS_BUSCA)) {
    if (lista.some((s) => t.includes(s))) lista.forEach((s) => alvos.add(s))
  }
  return itensIndicadoresParaBusca(res).filter((item) => {
    const haystack = `${item.titulo} ${item.descricao} ${item.categoria}`.toLowerCase()
    return [...alvos].some((palavra) => haystack.includes(palavra))
  })
}
