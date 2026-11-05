/**
 * SERVIÇO — Distribuição dos indicadores por setor (gráfico de pizza).
 *
 * A contagem vem EXCLUSIVAMENTE do catálogo estático do frontend
 * (CATALOGO_SERIES, em services/seriesHistoricas.ts) — não depende de rede
 * nem de banco: o gráfico renderiza sempre, mesmo offline.
 *
 * Setores temáticos agrupam as categorias do catálogo; cada setor guarda a
 * lista de indicadores, um indicador representativo (aberto ao clicar na
 * fatia) e a cor própria da fatia no gráfico.
 */
import { CATALOGO_SERIES, type ChaveSerieHistorica } from './seriesHistoricas'

export interface ItemSetorIndicador {
  chave: ChaveSerieHistorica
  nome: string
}

export interface SetorDistribuicao {
  setor: string
  quantidade: number
  /** Percentual do setor no total do catálogo (0–100). */
  percentual: number
  /** Cor da fatia no gráfico de pizza. */
  cor: string
  /** Indicador aberto ao clicar na fatia. */
  representante: ChaveSerieHistorica
  /** Indicadores do setor, na ordem do catálogo. */
  indicadores: ItemSetorIndicador[]
}

/** Mapeia cada categoria do catálogo para o setor temático da pizza. */
const SETOR_POR_CATEGORIA: Record<string, string> = {
  'Inflação e correção': 'Inflação e Correção',
  Taxas: 'Taxas de Juros',
  'Crédito e inadimplência': 'Taxas de Juros',
  Câmbio: 'Câmbio',
  'Mercado Financeiro': 'Mercado Financeiro (B3/EUA)',
  Imobiliário: 'Imobiliário',
  Agronegócio: 'Agronegócio',
  Estatísticas: 'Estatísticas do País',
  Fiscal: 'Estatísticas do País',
  Renda: 'Estatísticas do País',
  Emprego: 'Emprego',
  Educação: 'Educação',
  Saúde: 'Saúde',
  Saneamento: 'Saneamento',
}

/** Cor própria de cada fatia — paleta consistente com o portal (navy/gold). */
const COR_POR_SETOR: Record<string, string> = {
  'Inflação e Correção': '#b91c1c',
  'Taxas de Juros': '#0f294a',
  Câmbio: '#b58a2b',
  'Mercado Financeiro (B3/EUA)': '#0369a1',
  Imobiliário: '#7c3aed',
  Agronegócio: '#15803d',
  'Estatísticas do País': '#475569',
  Emprego: '#c2410c',
  Educação: '#2563eb',
  Saúde: '#db2777',
  Saneamento: '#0891b2',
}

/** Indicador representativo de cada setor — aberto ao clicar na fatia. */
const REPRESENTANTE_POR_SETOR: Record<string, ChaveSerieHistorica> = {
  'Inflação e Correção': 'ipca',
  'Taxas de Juros': 'selic',
  Câmbio: 'usd',
  'Mercado Financeiro (B3/EUA)': 'ibovespa',
  Imobiliário: 'fipezap',
  Agronegócio: 'soja',
  'Estatísticas do País': 'pib',
  Emprego: 'taxa_desemprego_pnad',
  Educação: 'ideb_anos_iniciais',
  Saúde: 'internacoes_aih',
  Saneamento: 'acesso_agua',
}

/** Ordem fixa de exibição das fatias (a mesma das chaves de COR_POR_SETOR). */
const ORDEM_SETORES = Object.keys(COR_POR_SETOR)

/**
 * Distribuição dos indicadores do catálogo por setor temático.
 * Pura e síncrona — contagem local, nunca falha por rede.
 */
export function distribuicaoPorSetor(): SetorDistribuicao[] {
  const grupos = new Map<string, ItemSetorIndicador[]>()
  for (const item of CATALOGO_SERIES) {
    const setor = SETOR_POR_CATEGORIA[item.categoria]
    if (!setor) continue
    if (!grupos.has(setor)) grupos.set(setor, [])
    grupos.get(setor)!.push({ chave: item.chave, nome: item.nome })
  }

  const total = [...grupos.values()].reduce((s, lista) => s + lista.length, 0)
  if (total === 0) return []

  const setores = ORDEM_SETORES.filter((s) => grupos.has(s))
  return setores.map((setor) => {
    const indicadores = grupos.get(setor)!
    return {
      setor,
      quantidade: indicadores.length,
      percentual: (indicadores.length / total) * 100,
      cor: COR_POR_SETOR[setor],
      representante: REPRESENTANTE_POR_SETOR[setor] ?? indicadores[0].chave,
      indicadores,
    }
  })
}

/** Quantidade total de indicadores do catálogo considerados na distribuição. */
export function totalIndicadoresDistribuicao(fatias: SetorDistribuicao[]): number {
  return fatias.reduce((s, f) => s + f.quantidade, 0)
}
