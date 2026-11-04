/**
 * BUSCADOR NATIVO DE ÍNDICES — portal de Indicadores Econômicos e Financeiros.
 *
 * Busca própria do portal (não é a Busca Avançada global): o usuário digita
 * "IPCA", "Selic", "dólar", "soja", "IDEB"… e o portal lista os indicadores
 * correspondentes; ao clicar, abre o histórico/gráfico daquele indicador.
 *
 * Padrão do projeto: tolerante a acentos e maiúsculas (normalizarParaBusca) e
 * termos combinados com "E" (correspondePalavrasChave — todas as palavras).
 */
import { CATALOGO_SERIES, type CatalogoSerie, type ChaveSerieHistorica } from './seriesHistoricas'
import { normalizarParaBusca, correspondePalavrasChave } from './destaqueBusca'

export interface ResultadoBuscaIndicador {
  chave: ChaveSerieHistorica
  nome: string
  descricao: string
  categoria: string
  unidade: string
  fonte: string
  baseInterna: boolean
}

/**
 * Sinônimos adicionais por indicador — além do campo `termo` do catálogo,
 * para consultas como "dolar turismo" ou "poupanca rendimento".
 */
const SINONIMOS: Record<string, string> = {
  ipca: 'inflacao indice nacional precos consumidor amplo correcao',
  igpm: 'inflacao aluguel correcao fgv geral precos mercado',
  inpc: 'inflacao nacional consumidor salario correcao',
  ipc: 'inflacao fipe consumidor sao paulo correcao',
  selic: 'juros taxa basica copom',
  cdi: 'juros di b3 deposito interfinanceiro',
  tr: 'taxa referencial correcao poupanca sfh',
  poupanca: 'rendimento caderneta poupanca correcao',
  tjlp: 'juros longo prazo emprestimo',
  usd: 'dolar turismo comercial moeda estrangeira verde',
  eur: 'euro moeda estrangeira europa',
  gbp: 'libra esterlina moeda estrangeira inglaterra',
  jpy: 'iene japao moeda estrangeira yen',
  pib: 'produto interno bruto economia atividade crescimento',
  desemprego: 'desocupados desempregados pnad continu taxa',
  renda_media: 'rendimento salario medio real trabalhador',
  populacao_ocupada: 'empregados ocupados mao de obra',
  agro_producao: 'agricultura pecuaria lspa safra producao',
  boi_gordo: 'pecuaria arroba gado corte cepea',
  soja: 'oleaginosa grao saca cepea exportacao',
  milho: 'graos cereais saca cepea',
  fipezap: 'imovel casa apartamento residencial venda aluguel indice preco',
  matriculas_basica: 'alunos escolas censo escolar educacao basica',
  ideb_anos_iniciais: 'qualidade educacao fundamental indice desenvolvimento',
  ideb_anos_finais: 'qualidade educacao fundamental indice desenvolvimento',
  nascidos_vivos: 'nascimentos registro civil sinasc',
  internacoes_aih: 'hospitalizacao sus sus sistema unico saude',
  mortalidade_infantil: 'morte criancas obito menores',
  acesso_agua: 'abastecimento agua potavel encanamento saneamento',
  coleta_esgoto: 'esgoto sanitario rede coletora saneamento',
  tratamento_esgoto: 'estacao tratamento ete esgoto saneamento',
  perda_agua: 'perdas distribuicao vazamento agua',
  taxa_desemprego_pnad: 'desocupados desempregados taxa pnad continua',
  admissoes_caged: 'contratacoes admissao carteira assinada novo caged',
  desligamentos_caged: 'demissoes desligamento dispensa carteira assinada',
  saldo_empregos: 'geracao postos emprego formal saldo',
  divida: 'divida publica federal bruta pib tesouro',
  salmin: 'salario minimo piso nacional renda',
}

/** Lista os indicadores que correspondem à consulta (todos os termos, "E"). */
export function buscarIndicadores(consulta: string): ResultadoBuscaIndicador[] {
  const q = normalizarParaBusca(consulta)
  if (!q) return []
  const termos = q.split(/\s+/).filter(Boolean)
  const saida: ResultadoBuscaIndicador[] = []
  for (const item of CATALOGO_SERIES) {
    const sinonimos = SINONIMOS[item.chave] ? ' ' + SINONIMOS[item.chave] : ''
    const alvo = [item.nome, item.descricao, item.categoria, item.fonte, item.termo + sinonimos]
    if (correspondePalavrasChave(alvo, termos)) {
      saida.push({
        chave: item.chave,
        nome: item.nome,
        descricao: item.descricao,
        categoria: item.categoria,
        unidade: item.unidade,
        fonte: item.fonte,
        baseInterna: /base interna/i.test(item.descricao),
      })
    }
  }
  return saida
}

/** Sugestões rápidas exibidas quando o campo está vazio. */
export const SUGESTOES_BUSCA_INDICADORES = [
  'IPCA',
  'Selic',
  'dólar',
  'soja',
  'IDEB',
  'FipeZap',
  'desemprego',
]

/** Catálogo agrupado por categoria para a listagem padrão da aba Histórico. */
export function catalogoAgrupado(): Map<string, ResultadoBuscaIndicador[]> {
  const mapa = new Map<string, ResultadoBuscaIndicador[]>()
  for (const item of CATALOGO_SERIES) {
    if (!mapa.has(item.categoria)) mapa.set(item.categoria, [])
    mapa.get(item.categoria)!.push({
      chave: item.chave,
      nome: item.nome,
      descricao: item.descricao,
      categoria: item.categoria,
      unidade: item.unidade,
      fonte: item.fonte,
      baseInterna: /base interna/i.test(item.descricao),
    })
  }
=======
=======
