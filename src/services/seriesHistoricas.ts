/**
 * SÉRIES HISTÓRICAS E ACUMULADOS — portal de Indicadores Econômicos e
 * Financeiros (aba Histórico).
 *
 * Consome EXCLUSIVAMENTE o proxy do backend /backend/v1/series-historicas
 * (hook pocketbase/hooks/series_historicas_route.js) — o navegador nunca fala
 * direto com BCB/IBGE (padrão anti-bloqueio do projeto). Quando a fonte viva
 * falha, cada indicador cai na base interna aproximada com o aviso transparente
 * "Base interna — dado aproximado", mesmo padrão do portal.
 *
 * CONTRATO COM O HOOK (versão implantada):
 * GET /backend/v1/series-historicas?chave=<chave>
 *   → { ok, chave, fonteViva, baseInterna, fonte,
 *       serie: [{ periodo, valor }], aviso }
 *   - periodo normalizado no hook: 'YYYY-MM' (mensal, incluindo séries diárias
 *     colapsadas em "mensal_ultimo"), 'YYYY-Qn' (trimestral) ou 'YYYY'.
 *   - ordenação ASCENDENTE, teto de 3.000 pontos truncando pelo mais recente e
 *     resposta final limitada a 360 pontos mensais.
 *   - fonte morta/sem API aberta ⇒ fonteViva=false + baseInterna=true com o
 *     aviso transparente — o frontend cai na base interna, nunca erro cru.
 */
import pb from '@/lib/pocketbase/client'

export type ChaveSerieHistorica =
  | 'ipca'
  | 'ipca15'
  | 'igpm'
  | 'igpdi'
  | 'inpc'
  | 'ipc'
  | 'selic'
  | 'cdi'
  | 'tr'
  | 'poupanca'
  | 'tjlp'
  | 'juros_medio'
  | 'juros_pessoal'
  | 'inadimplencia'
  | 'usd'
  | 'eur'
  | 'gbp'
  | 'jpy'
  | 'yuan'
  | 'pib'
  | 'desemprego'
  | 'renda_media'
  | 'producao_industrial'
  | 'venda_varejo'
  | 'populacao_ocupada'
  | 'agro_producao'
  | 'boi_gordo'
  | 'soja'
  | 'milho'
  | 'fipezap'
  | 'matriculas_basica'
  | 'ideb_anos_iniciais'
  | 'ideb_anos_finais'
  | 'nascidos_vivos'
  | 'internacoes_aih'
  | 'mortalidade_infantil'
  | 'acesso_agua'
  | 'coleta_esgoto'
  | 'tratamento_esgoto'
  | 'perda_agua'
  | 'taxa_desemprego_pnad'
  | 'admissoes_caged'
  | 'desligamentos_caged'
  | 'saldo_empregos'
  | 'divida'
  | 'salmin'
  | 'ibovespa'
  | 'ifix'
  | 'sp500'
  | 'dowjones'
  | 'nasdaq'
  | 'ibge_populacao'
  | 'ibge_pms'
  | 'ibge_construcao'

export type GranularidadeHistorica = 'mensal' | 'trimestral' | 'anual'

export type ModoAcumulado = 'variacao_mensal' | 'nivel'

/** Ponto da série histórica — periodo 'YYYY-MM' | 'YYYY-Qn' | 'YYYY'. */
export interface PontoSerie {
  periodo: string
  valor: number
}

export interface RespostaSerieHistorica {
  ok: boolean
  chave: ChaveSerieHistorica
  fonteViva: boolean
  baseInterna: boolean
  fonte: string
  serie: PontoSerie[]
  aviso: string
}

export interface CatalogoSerie {
  chave: ChaveSerieHistorica
  nome: string
  descricao: string
  categoria: string
  unidade: string
  /** true = série de nível (variação % no período); false = índice mensal de inflação/correção (acumulado composto). */
  modoAcumulado: ModoAcumulado
  fonte: string
  fonteUrl: string
  selo: 'oficial_institucional'
  termo: string
  /** Rótulo do valor pontual: 'pct' (valor já é %), 'real' (R$) ou 'bruto'. */
  formatoValor: 'pct' | 'real' | 'bruto'
}

const SEL_PADRAO = {
  selo: 'oficial_institucional',
} as const

export const CATALOGO_SERIES: CatalogoSerie[] = [
  // — Inflação e correção (variação % mensal) —
  {
    chave: 'ipca',
    nome: 'IPCA',
    descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE/BCB SGS 433',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'IBGE / BCB',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'inflacao ipca preco consumidor correcao monetaria',
    formatoValor: 'pct',
  },
  {
    chave: 'ipca15',
    nome: 'IPCA-15',
    descricao: 'Índice de Preços ao Consumidor Amplo 15 — prévia do IPCA — BCB SGS 7478',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'IBGE / BCB',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'inflacao ipca15 previa preco consumidor amplo',
    formatoValor: 'pct',
  },
  {
    chave: 'igpm',
    nome: 'IGP-M',
    descricao: 'Índice Geral de Preços — Mercado — FGV/BCB SGS 189',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'FGV / BCB',
    fonteUrl: 'https://www.fgv.br',
    ...SEL_PADRAO,
    termo: 'inflacao igpm aluguel correcao fgv mercado',
    formatoValor: 'pct',
  },
  {
    chave: 'igpdi',
    nome: 'IGP-DI',
    descricao: 'Índice Geral de Preços — Disponibilidade Interna — FGV/BCB SGS 190',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'FGV / BCB',
    fonteUrl: 'https://www.fgv.br',
    ...SEL_PADRAO,
    termo: 'inflacao igpdi disponibilidade interna fgv correcao',
    formatoValor: 'pct',
  },
  {
    chave: 'inpc',
    nome: 'INPC',
    descricao: 'Índice Nacional de Preços ao Consumidor — IBGE/BCB SGS 188',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'IBGE / BCB',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'inflacao inpc salario consumidor correcao',
    formatoValor: 'pct',
  },
  {
    chave: 'ipc',
    nome: 'IPC',
    descricao: 'Índice de Preços ao Consumidor — Fipe/BCB SGS 192',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'Fipe / BCB',
    fonteUrl: 'https://www.fipe.org.br',
    ...SEL_PADRAO,
    termo: 'inflacao ipc fipe consumidor sao paulo correcao',
    formatoValor: 'pct',
  },
  {
    chave: 'tr',
    nome: 'TR',
    descricao: 'Taxa Referencial — BCB SGS 226',
    categoria: 'Taxas',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'taxa tr referencial poupanca sfh correcao',
    formatoValor: 'pct',
  },
  {
    chave: 'poupanca',
    nome: 'Poupança',
    descricao: 'Rendimento da poupança — BCB SGS 195',
    categoria: 'Taxas',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'taxa poupanca rendimento caderneta',
    formatoValor: 'pct',
  },
  // — Taxas de juros e crédito —
  {
    chave: 'selic',
    nome: 'Selic',
    descricao: 'Taxa básica de juros — Copom/BCB SGS 432',
    categoria: 'Taxas',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'taxa selic juros copom basica',
    formatoValor: 'pct',
  },
  {
    chave: 'cdi',
    nome: 'CDI',
    descricao: 'Taxa DI média diária — B3/BCB SGS 4391',
    categoria: 'Taxas',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'B3 / BCB',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'taxa cdi di juros b3',
    formatoValor: 'pct',
  },
  {
    chave: 'tjlp',
    nome: 'TJLP',
    descricao: 'Taxa de Juros de Longo Prazo — BCB SGS 254',
    categoria: 'Taxas',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'taxa tjlp longo prazo financiamento',
    formatoValor: 'pct',
  },
  {
    chave: 'juros_medio',
    nome: 'Juros médio',
    descricao: 'Taxa média de juros das operações de crédito — BCB SGS 20714',
    categoria: 'Crédito e inadimplência',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'credito juros medio taxa operacoes bancario',
    formatoValor: 'pct',
  },
  {
    chave: 'juros_pessoal',
    nome: 'Juros pessoal',
    descricao: 'Taxa média de juros do crédito pessoal — BCB SGS 20746',
    categoria: 'Crédito e inadimplência',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'credito juros pessoal taxa emprestimo rotativo',
    formatoValor: 'pct',
  },
  {
    chave: 'inadimplencia',
    nome: 'Inadimplência',
    descricao: 'Inadimplência da carteira de crédito — % da carteira — BCB SGS 21114',
    categoria: 'Crédito e inadimplência',
    unidade: '% da carteira',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'credito inadimplencia carteira banca default',
    formatoValor: 'pct',
  },
  // — Câmbio —
  {
    chave: 'usd',
    nome: 'Dólar (USD)',
    descricao: 'Câmbio — dólar comercial PTAX compra, último do mês — BCB SGS 10813',
    categoria: 'Câmbio',
    unidade: 'R$/USD',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'cambio dolar usd moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'eur',
    nome: 'Euro (EUR)',
    descricao: 'Câmbio — euro PTAX compra, último do mês — BCB SGS 21619',
    categoria: 'Câmbio',
    unidade: 'R$/EUR',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'cambio euro eur moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'gbp',
    nome: 'Libra (GBP)',
    descricao: 'Câmbio — libra esterlina PTAX compra, último do mês — BCB SGS 21621',
    categoria: 'Câmbio',
    unidade: 'R$/GBP',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'cambio libra gbp esterlina moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'jpy',
    nome: 'Iene (JPY)',
    descricao: 'Câmbio — iene japonês PTAX compra, último do mês — BCB SGS 21620',
    categoria: 'Câmbio',
    unidade: 'R$/JPY',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'cambio iene jpy japao moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'yuan',
    nome: 'Yuan (CNY)',
    descricao: 'Câmbio — yuan chinês PTAX compra, último do mês — BCB SGS 21623',
    categoria: 'Câmbio',
    unidade: 'R$/CNY',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    ...SEL_PADRAO,
    termo: 'cambio yuan cny china renminbi moeda ptax',
    formatoValor: 'bruto',
  },
  // — Estatísticas —
  {
    chave: 'pib',
    nome: 'PIB',
    descricao: 'PIB — variação % trimestral — IBGE SIDRA t5938',
    categoria: 'Estatísticas',
    unidade: '% trim.',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — SIDRA',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'pib produto interno bruto atividade economia',
    formatoValor: 'pct',
  },
  {
    chave: 'desemprego',
    nome: 'Desemprego (PNAD)',
    descricao: 'Taxa de desemprego — PNAD Contínua, IBGE SIDRA t4099',
    categoria: 'Estatísticas',
    unidade: '%',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PNAD Contínua',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'desemprego emprego pnad desocupados trabalho',
    formatoValor: 'pct',
  },
  {
    chave: 'renda_media',
    nome: 'Renda média',
    descricao: 'Renda média real habitual do trabalhador — PNAD t5932',
    categoria: 'Estatísticas',
    unidade: 'R$/mês',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PNAD Contínua',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'renda media trabalhador salario pnad',
    formatoValor: 'real',
  },
  {
    chave: 'producao_industrial',
    nome: 'Produção industrial',
    descricao: 'Produção industrial — PIM-PF, variação % — IBGE SIDRA t8885',
    categoria: 'Estatísticas',
    unidade: '%',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PIM-PF',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'industria producao industrial pim pf fabricacao',
    formatoValor: 'pct',
  },
  {
    chave: 'venda_varejo',
    nome: 'Vendas varejo',
    descricao: 'Vendas no varejo nominal — PMS, variação % — IBGE SIDRA t8883',
    categoria: 'Estatísticas',
    unidade: '%',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PMS',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'varejo vendas comercio pms consumo',
    formatoValor: 'pct',
  },
  {
    chave: 'populacao_ocupada',
    nome: 'População ocupada',
    descricao: 'População ocupada — PNAD Contínua t4099 (base interna)',
    categoria: 'Estatísticas',
    unidade: 'mil pessoas',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PNAD Contínua',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'populacao ocupada emprego trabalhadores pnad',
    formatoValor: 'bruto',
  },
  {
    chave: 'agro_producao',
    nome: 'Produção agropecuária',
    descricao: 'Produção da agropecuária — variação % anual — IBGE t6588 (base interna)',
    categoria: 'Agronegócio',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — LSPA',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'agro agronegocio producao agropecuaria safra lspa',
    formatoValor: 'pct',
  },
  // — Agronegócio —
  {
    chave: 'boi_gordo',
    nome: 'Boi gordo',
    descricao: 'Boi gordo Cepea-Esalq — R$/arroba — BCB SGS 23447',
    categoria: 'Agronegócio',
    unidade: 'R$/@',
    modoAcumulado: 'nivel',
    fonte: 'Cepea-Esalq/USP',
    fonteUrl: 'https://www.cepea.esalq.usp.br',
    ...SEL_PADRAO,
    termo: 'agro boi gordo cepea arroba pecuaria preco',
    formatoValor: 'real',
  },
  {
    chave: 'soja',
    nome: 'Soja',
    descricao: 'Soja Cepea-Esalq — R$/sc 60 kg — BCB SGS 23448',
    categoria: 'Agronegócio',
    unidade: 'R$/sc',
    modoAcumulado: 'nivel',
    fonte: 'Cepea-Esalq/USP',
    fonteUrl: 'https://www.cepea.esalq.usp.br',
    ...SEL_PADRAO,
    termo: 'agro soja cepea saca grao preco',
    formatoValor: 'real',
  },
  {
    chave: 'milho',
    nome: 'Milho',
    descricao: 'Milho Cepea-Esalq — R$/sc 60 kg — BCB SGS 23449',
    categoria: 'Agronegócio',
    unidade: 'R$/sc',
    modoAcumulado: 'nivel',
    fonte: 'Cepea-Esalq/USP',
    fonteUrl: 'https://www.cepea.esalq.usp.br',
    ...SEL_PADRAO,
    termo: 'agro milho cepea saca grao preco',
    formatoValor: 'real',
  },
  // — Imobiliário —
  {
    chave: 'fipezap',
    nome: 'FipeZap',
    descricao: 'Índice FipeZap de imóveis residenciais anunciados — BCB SGS 19967',
    categoria: 'Imobiliário',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'FipeZap (Fipe/ZAP+)',
    fonteUrl: 'https://www.fipe.org.br',
    ...SEL_PADRAO,
    termo: 'imobiliario fipezap imovel residencial aluguel preco',
    formatoValor: 'pct',
  },
  // — Mercado Financeiro —
  {
    chave: 'ibovespa',
    nome: 'Ibovespa',
    descricao: 'Ibovespa — pontos da B3, último do mês — BCB SGS 7',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'B3 / Banco Central — SGS 7',
    fonteUrl: 'https://www.b3.com.br',
    ...SEL_PADRAO,
    termo: 'ibovespa b3 bolsa acoes mercado financeiro indice',
    formatoValor: 'bruto',
  },
  {
    chave: 'ifix',
    nome: 'IFIX',
    descricao: 'IFIX — índice de fundos imobiliários da B3, último do mês — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'B3 / IPEA — IPEADATA',
    fonteUrl: 'https://www.ipeadata.gov.br',
    ...SEL_PADRAO,
    termo: 'ifix fundo imobiliario fii b3 mercado financeiro',
    formatoValor: 'bruto',
  },
  {
    chave: 'sp500',
    nome: 'S&P 500',
    descricao: 'Índice S&P 500 (bolsa de NY), último do mês — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA (S&P 500)',
    fonteUrl: 'https://www.ipeadata.gov.br',
    ...SEL_PADRAO,
    termo: 'sp500 s&p standard poor bolsas internacionais nova york',
    formatoValor: 'bruto',
  },
  {
    chave: 'dowjones',
    nome: 'Dow Jones',
    descricao: 'Índice Dow Jones Industrial Average, último do mês — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA (Dow Jones)',
    fonteUrl: 'https://www.ipeadata.gov.br',
    ...SEL_PADRAO,
    termo: 'dow jones industrial average bolsas internacionais nova york',
    formatoValor: 'bruto',
  },
  {
    chave: 'nasdaq',
    nome: 'Nasdaq',
    descricao: 'Índice Nasdaq Composite, último do mês — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA (Nasdaq)',
    fonteUrl: 'https://www.ipeadata.gov.br',
    ...SEL_PADRAO,
    termo: 'nasdaq composite bolsas internacionais tecnologia',
    formatoValor: 'bruto',
  },
  // Séries sem API aberta com histórico: base interna aproximada (aviso transparente).
  {
    chave: 'matriculas_basica',
    nome: 'Matrículas educação básica',
    descricao: 'Censo da Educação Básica — matrículas (base interna)',
    categoria: 'Educação',
    unidade: 'milhões',
    modoAcumulado: 'nivel',
    fonte: 'INEP/MEC',
    fonteUrl: 'https://www.gov.br/inep',
    ...SEL_PADRAO,
    termo: 'educacao matriculas censo basico inep',
    formatoValor: 'bruto',
  },
  {
    chave: 'ideb_anos_iniciais',
    nome: 'IDEB anos iniciais',
    descricao: 'IDEB — anos iniciais do ensino fundamental (base interna)',
    categoria: 'Educação',
    unidade: 'pontos IDEB',
    modoAcumulado: 'nivel',
    fonte: 'INEP/MEC',
    fonteUrl: 'https://www.gov.br/inep',
    ...SEL_PADRAO,
    termo: 'educacao ideb anos iniciais inep escola',
    formatoValor: 'bruto',
  },
  {
    chave: 'ideb_anos_finais',
    nome: 'IDEB anos finais',
    descricao: 'IDEB — anos finais do ensino fundamental (base interna)',
    categoria: 'Educação',
    unidade: 'pontos IDEB',
    modoAcumulado: 'nivel',
    fonte: 'INEP/MEC',
    fonteUrl: 'https://www.gov.br/inep',
    ...SEL_PADRAO,
    termo: 'educacao ideb anos finais inep escola',
    formatoValor: 'bruto',
  },
  {
    chave: 'nascidos_vivos',
    nome: 'Nascidos vivos',
    descricao: 'Nascidos vivos registrados — SINASC/DATASUS (base interna)',
    categoria: 'Saúde',
    unidade: 'milhões/ano',
    modoAcumulado: 'nivel',
    fonte: 'DATASUS — Ministério da Saúde',
    fonteUrl: 'https://datasus.saude.gov.br',
    ...SEL_PADRAO,
    termo: 'saude nascidos vivos sinasc datatus nascimento',
    formatoValor: 'bruto',
  },
  {
    chave: 'internacoes_aih',
    nome: 'Internações SUS',
    descricao: 'Internações hospitalares SUS — AIH/SIH (base interna)',
    categoria: 'Saúde',
    unidade: 'milhões/ano',
    modoAcumulado: 'nivel',
    fonte: 'DATASUS — Ministério da Saúde',
    fonteUrl: 'https://datasus.saude.gov.br',
    ...SEL_PADRAO,
    termo: 'saude internacoes hospitalares sus aih datatus',
    formatoValor: 'bruto',
  },
  {
    chave: 'mortalidade_infantil',
    nome: 'Mortalidade infantil',
    descricao: 'Mortalidade infantil — por 1.000 nascidos vivos (base interna)',
    categoria: 'Saúde',
    unidade: 'por 1.000',
    modoAcumulado: 'nivel',
    fonte: 'DATASUS — Ministério da Saúde',
    fonteUrl: 'https://datasus.saude.gov.br',
    ...SEL_PADRAO,
    termo: 'saude mortalidade infantil datatus obito',
    formatoValor: 'bruto',
  },
  {
    chave: 'acesso_agua',
    nome: 'Acesso à água',
    descricao: 'População atendida com água potável — SNIS (base interna)',
    categoria: 'Saneamento',
    unidade: '% da população',
    modoAcumulado: 'nivel',
    fonte: 'SNIS — Ministério das Cidades',
    fonteUrl: 'https://www.gov.br/cidades',
    ...SEL_PADRAO,
    termo: 'saneamento agua potavel snis abastecimento',
    formatoValor: 'pct',
  },
  {
    chave: 'coleta_esgoto',
    nome: 'Coleta de esgoto',
    descricao: 'População atendida com coleta de esgoto — SNIS (base interna)',
    categoria: 'Saneamento',
    unidade: '% da população',
    modoAcumulado: 'nivel',
    fonte: 'SNIS — Ministério das Cidades',
    fonteUrl: 'https://www.gov.br/cidades',
    ...SEL_PADRAO,
    termo: 'saneamento esgoto coleta snis',
    formatoValor: 'pct',
  },
  {
    chave: 'tratamento_esgoto',
    nome: 'Tratamento de esgoto',
    descricao: 'Esgoto tratado — % do coletado — SNIS (base interna)',
    categoria: 'Saneamento',
    unidade: '% do coletado',
    modoAcumulado: 'nivel',
    fonte: 'SNIS — Ministério das Cidades',
    fonteUrl: 'https://www.gov.br/cidades',
    ...SEL_PADRAO,
    termo: 'saneamento esgoto tratamento snis',
    formatoValor: 'pct',
  },
  {
    chave: 'perda_agua',
    nome: 'Perda de água',
    descricao: 'Perda de água na distribuição — SNIS (base interna)',
    categoria: 'Saneamento',
    unidade: '% do volume',
    modoAcumulado: 'nivel',
    fonte: 'SNIS — Ministério das Cidades',
    fonteUrl: 'https://www.gov.br/cidades',
    ...SEL_PADRAO,
    termo: 'saneamento perda agua distribuicao snis',
    formatoValor: 'bruto',
  },
  {
    chave: 'taxa_desemprego_pnad',
    nome: 'Desemprego (PNAD Contínua)',
    descricao: 'Taxa de desemprego — PNAD Contínua, IBGE (base interna)',
    categoria: 'Emprego',
    unidade: '%',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PNAD Contínua',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'emprego desemprego pnad desocupados',
    formatoValor: 'pct',
  },
  {
    chave: 'admissoes_caged',
    nome: 'Admissões CAGED',
    descricao: 'Admissões formais — Novo CAGED/MTE (base interna)',
    categoria: 'Emprego',
    unidade: 'mil postos',
    modoAcumulado: 'nivel',
    fonte: 'CAGED — MTE',
    fonteUrl: 'https://www.gov.br/trabalho-e-emprego',
    ...SEL_PADRAO,
    termo: 'emprego admissoes caged carteira',
    formatoValor: 'bruto',
  },
  {
    chave: 'desligamentos_caged',
    nome: 'Desligamentos CAGED',
    descricao: 'Desligamentos formais — Novo CAGED/MTE (base interna)',
    categoria: 'Emprego',
    unidade: 'mil postos',
    modoAcumulado: 'nivel',
    fonte: 'CAGED — MTE',
    fonteUrl: 'https://www.gov.br/trabalho-e-emprego',
    ...SEL_PADRAO,
    termo: 'emprego desligamentos demissao caged carteira',
    formatoValor: 'bruto',
  },
  {
    chave: 'saldo_empregos',
    nome: 'Saldo de empregos',
    descricao: 'Saldo de empregos formais — Novo CAGED/MTE (base interna)',
    categoria: 'Emprego',
    unidade: 'mil postos',
    modoAcumulado: 'nivel',
    fonte: 'CAGED — MTE',
    fonteUrl: 'https://www.gov.br/trabalho-e-emprego',
    ...SEL_PADRAO,
    termo: 'emprego saldo caged postos carteira',
    formatoValor: 'bruto',
  },
  {
    chave: 'divida',
    nome: 'Dívida pública',
    descricao: 'Dívida pública federal — % do PIB, SICONFI (base interna)',
    categoria: 'Fiscal',
    unidade: '% do PIB',
    modoAcumulado: 'nivel',
    fonte: 'Tesouro Nacional — SICONFI',
    fonteUrl: 'https://www.tesourotransparente.gov.br',
    ...SEL_PADRAO,
    termo: 'fiscal divida publica tesouro siconfi',
    formatoValor: 'pct',
  },
  {
    chave: 'salmin',
    nome: 'Salário mínimo',
    descricao: 'Salário mínimo — variação % em 12 meses — IPEADATA (base interna)',
    categoria: 'Renda',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA',
    fonteUrl: 'https://www.ipeadata.gov.br',
    ...SEL_PADRAO,
    termo: 'renda salario minimo ipea ipeadata',
    formatoValor: 'pct',
  },
  // — Estatísticas do País (IBGE SIDRA) —
  {
    chave: 'ibge_populacao',
    nome: 'População residente',
    descricao: 'População residente no Brasil — estimativas anuais — IBGE SIDRA 6579',
    categoria: 'Estatísticas',
    unidade: 'habitantes',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — SIDRA',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'estatisticas populacao residente censo habitantes demografia ibge sidra',
    formatoValor: 'bruto',
  },
  {
    chave: 'ibge_pms',
    nome: 'Volume de Serviços (PMS)',
    descricao: 'Índice de volume de serviços — Pesquisa Mensal de Serviços — IBGE SIDRA 6455',
    categoria: 'Estatísticas',
    unidade: 'índice',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — SIDRA (PMS)',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'estatisticas servicos volume pms pesquisa mensal servicos ibge sidra',
    formatoValor: 'bruto',
  },
  {
    chave: 'ibge_construcao',
    nome: 'Produção da Construção Civil',
    descricao: 'Índice de produção e insumos típicos da construção civil — IBGE SIDRA 5906',
    categoria: 'Estatísticas',
    unidade: 'índice',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — SIDRA',
    fonteUrl: 'https://www.ibge.gov.br',
    ...SEL_PADRAO,
    termo: 'estatisticas construcao civil producao insumos fisicos industria ibge sidra',
    formatoValor: 'bruto',
  },
]

const CATALOGO_MAP = new Map(CATALOGO_SERIES.map((c) => [c.chave, c]))

export function catalogoDaChave(chave: string): CatalogoSerie | undefined {
  return CATALOGO_MAP.get(chave as ChaveSerieHistorica)
}

/**
 * Base interna aproximada — gerada a partir da variação média dos últimos
 * valores do fallback do portal, para os índices sem API aberta com série
 * (INEP, DATASUS, SNIS, Tesouro, CAGED, salário mínimo).
 */
function serieBaseInterna(item: CatalogoSerie): PontoSerie[] {
  const hoje = new Date()
  const anos: number[] = []
  for (let a = hoje.getFullYear() - 5; a <= hoje.getFullYear(); a++) anos.push(a)
  const base: Record<string, number[]> = {
    matriculas_basica: [46.8, 47.0, 47.0, 47.3, 47.3, 47.3],
    ideb_anos_iniciais: [5.4, 5.7, 5.8, 5.9, 6.0, 6.0],
    ideb_anos_finais: [4.6, 4.9, 5.0, 5.1, 5.2, 5.2],
    nascidos_vivos: [2.55, 2.54, 2.53, 2.52, 2.52, 2.52],
    internacoes_aih: [11.0, 11.1, 11.1, 11.2, 11.2, 11.2],
    mortalidade_infantil: [13.4, 13.1, 12.8, 12.5, 12.5, 12.5],
    acesso_agua: [82.1, 82.9, 83.4, 84.2, 84.2, 84.2],
    coleta_esgoto: [60.2, 61.3, 62.3, 63.4, 63.4, 63.4],
    tratamento_esgoto: [49.0, 50.3, 51.2, 52.6, 52.6, 52.6],
    perda_agua: [41.2, 40.7, 40.4, 39.8, 39.8, 39.8],
    taxa_desemprego_pnad: [7.2, 7.1, 7.0, 6.8, 6.8, 6.8],
    admissoes_caged: [1700, 1750, 1790, 1820, 1820, 1820],
    desligamentos_caged: [1690, 1680, 1660, 1655, 1655, 1655],
    saldo_empregos: [110, 95, 140, 165, 165, 165],
    divida: [74.2, 75.1, 75.9, 76.8, 76.8, 76.8],
    salmin: [3.9, 4.1, 4.2, 4.5, 4.5, 4.5],
    populacao_ocupada: [93.0, 95.5, 97.0, 99.5, 99.8, 99.8],
    agro_producao: [2.1, -1.4, 4.3, 12.9, 3.2, 3.2],
    ibovespa: [128400, 131200, 134600, 138500, 138500, 138500],
    ifix: [2040, 2055, 2071, 2080, 2080, 2080],
    sp500: [4766, 4796, 5074, 5672, 5672, 5672],
    dowjones: [36187, 37690, 39807, 42630, 42630, 42630],
    nasdaq: [10464, 11394, 16794, 18249, 18249, 18249],
    ibge_populacao: [210147125, 211755692, 212583750, 213317639, 213317639, 213317639],
    ibge_pms: [105.2, 107.4, 108.9, 110.8, 110.8, 110.8],
    ibge_construcao: [118.4, 120.2, 121.8, 123.4, 123.4, 123.4],
  }
  const valores = base[item.chave]
  if (!valores) return []
  return anos.map((ano, i) => ({ periodo: String(ano), valor: valores[i] }))
}

/** Busca a série histórica de um indicador via proxy do backend. */
export async function fetchSerieHistorica(chave: ChaveSerieHistorica): Promise<{
  serie: PontoSerie[]
  fonteViva: boolean
  baseInterna: boolean
  fonte: string
  aviso: string
}> {
  const item = catalogoDaChave(chave)
  if (!item) {
    return {
      serie: [],
      fonteViva: false,
      baseInterna: true,
      fonte: '',
      aviso: 'Indicador não catalogado.',
    }
  }
  try {
    const res = (await pb.send('/backend/v1/series-historicas', {
      method: 'GET',
      query: { chave },
    })) as unknown as RespostaSerieHistorica
    const serie = Array.isArray(res?.serie)
      ? res.serie
          .map((p) => ({
            periodo: String(p?.periodo ?? ''),
            valor: Number(p?.valor),
          }))
          .filter((p) => p.periodo !== '' && Number.isFinite(p.valor))
      : []
    if (serie.length > 0) {
      return {
        serie: ordenarPorPeriodo(serie),
        fonteViva: res.fonteViva !== false,
        baseInterna: res.baseInterna === true,
        fonte: String(res.fonte || item.fonte),
        aviso: String(res.aviso || ''),
      }
    }
  } catch {
    // proxy fora do ar → base interna abaixo
  }
  return {
    serie: serieBaseInterna(item),
    fonteViva: false,
    baseInterna: true,
    fonte: item.fonte,
    aviso:
      'Fonte oficial indisponível ou sem série aberta — exibindo a base interna aproximada do sistema.',
  }
}

/** Ordena a série em ordem ascendente de período (YYYY[-MM[-Qn]]). */
function ordenarPorPeriodo(serie: PontoSerie[]): PontoSerie[] {
  const peso = (p: string): number => {
    const m = p.match(/^(\d{4})(?:-(?:(\d{2})|Q(\d)))?$/)
    if (!m) return 0
    return (
      parseInt(m[1], 10) * 10000 +
      (m[2] ? parseInt(m[2], 10) * 100 : m[3] ? parseInt(m[3], 10) * 300 : 0)
    )
  }
  return [...serie].sort((a, b) => peso(a.periodo) - peso(b.periodo))
}
