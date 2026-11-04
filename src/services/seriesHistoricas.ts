/**
 * SERVIÇO — Séries históricas e acumulados dos indicadores do portal de
 * Indicadores Econômicos e Financeiros (aba Histórico).
 *
 * Consome EXCLUSIVAMENTE o proxy do backend /backend/v1/series-historicas
 * (hook pocketbase/hooks/series_historicas_route.js) — o navegador nunca fala
 * direto com BCB/IBGE (padrão anti-bloqueio do projeto). Quando a fonte viva
 * falha, cada indicador cai na base interna aproximada com o aviso transparente
 * "Base interna — dado aproximado", mesmo padrão do portal.
 */
import pb from '@/lib/pocketbase/client'

export type ChaveSerieHistorica =
  | 'ipca'
  | 'igpm'
  | 'inpc'
  | 'ipc'
  | 'selic'
  | 'cdi'
  | 'tr'
  | 'poupanca'
  | 'usd'
  | 'eur'
  | 'gbp'
  | 'jpy'
  | 'pib'
  | 'desemprego'
  | 'renda_media'
  | 'populacao_ocupada'
  | 'agro_producao'
  | 'boi_gordo'
  | 'soja'
  | 'milho'
  | 'fipezap'
  | 'tjlp'
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

export const CATALOGO_SERIES: CatalogoSerie[] = [
  {
    chave: 'ipca',
    nome: 'IPCA',
    descricao: 'Índice Nacional de Preços ao Consumidor Amplo — IBGE/BCB SGS 433',
    categoria: 'Inflação e correção',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'IBGE / BCB',
    fonteUrl: 'https://www.ibge.gov.br',
    selo: 'oficial_institucional',
    termo: 'inflacao ipca preco consumidor correcao monetaria',
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
    selo: 'oficial_institucional',
    termo: 'inflacao igpm aluguel correcao fgv mercado',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
    termo: 'taxa poupanca rendimento caderneta',
    formatoValor: 'pct',
  },
  {
    chave: 'selic',
    nome: 'Selic',
    descricao: 'Taxa básica de juros — Copom/BCB SGS 432',
    categoria: 'Taxas',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
    termo: 'taxa tjlp longo prazo financiamento',
    formatoValor: 'pct',
  },
  {
    chave: 'usd',
    nome: 'Dólar (USD)',
    descricao: 'Câmbio — dólar comercial PTAX compra, mensal — BCB SGS 10813',
    categoria: 'Câmbio',
    unidade: 'R$/USD',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    selo: 'oficial_institucional',
    termo: 'cambio dolar usd moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'eur',
    nome: 'Euro (EUR)',
    descricao: 'Câmbio — euro PTAX compra, mensal — BCB SGS 21619',
    categoria: 'Câmbio',
    unidade: 'R$/EUR',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    selo: 'oficial_institucional',
    termo: 'cambio euro eur moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'gbp',
    nome: 'Libra (GBP)',
    descricao: 'Câmbio — libra esterlina PTAX compra, mensal — BCB SGS 21621',
    categoria: 'Câmbio',
    unidade: 'R$/GBP',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    selo: 'oficial_institucional',
    termo: 'cambio libra gbp esterlina moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'jpy',
    nome: 'Iene (JPY)',
    descricao: 'Câmbio — iene japonês PTAX compra, mensal — BCB SGS 21620',
    categoria: 'Câmbio',
    unidade: 'R$/JPY',
    modoAcumulado: 'nivel',
    fonte: 'Banco Central do Brasil',
    fonteUrl: 'https://www.bcb.gov.br',
    selo: 'oficial_institucional',
    termo: 'cambio iene jpy japao moeda ptax',
    formatoValor: 'bruto',
  },
  {
    chave: 'pib',
    nome: 'PIB',
    descricao: 'PIB — variação % trimestral — IBGE SIDRA t5938',
    categoria: 'Estatísticas',
    unidade: '% trim.',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — SIDRA',
    fonteUrl: 'https://www.ibge.gov.br',
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
    termo: 'desemprego emprego pnad desocupados trabalho',
    formatoValor: 'pct',
  },
  {
    chave: 'renda_media',
    nome: 'Renda média',
    descricao: 'Renda média real habitual do trabalhador — PNAD t5935',
    categoria: 'Estatísticas',
    unidade: 'R$/mês',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PNAD Contínua',
    fonteUrl: 'https://www.ibge.gov.br',
    selo: 'oficial_institucional',
    termo: 'renda media trabalhador salario pnad',
    formatoValor: 'real',
  },
  {
    chave: 'populacao_ocupada',
    nome: 'População ocupada',
    descricao: 'População ocupada — PNAD Contínua t4099',
    categoria: 'Estatísticas',
    unidade: 'mil pessoas',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — PNAD Contínua',
    fonteUrl: 'https://www.ibge.gov.br',
    selo: 'oficial_institucional',
    termo: 'populacao ocupada emprego trabalhadores pnad',
    formatoValor: 'bruto',
  },
  {
    chave: 'agro_producao',
    nome: 'Produção agropecuária',
    descricao: 'Produção da agropecuária — variação % anual — IBGE t6588',
    categoria: 'Agronegócio',
    unidade: '% a.a.',
    modoAcumulado: 'nivel',
    fonte: 'IBGE — LSPA',
    fonteUrl: 'https://www.ibge.gov.br',
    selo: 'oficial_institucional',
    termo: 'agro agronegocio producao agropecuaria safra lspa',
    formatoValor: 'pct',
  },
  {
    chave: 'boi_gordo',
    nome: 'Boi gordo',
    descricao: 'Boi gordo Cepea-Esalq — R$/arroba — BCB SGS 23447',
    categoria: 'Agronegócio',
    unidade: 'R$/@',
    modoAcumulado: 'nivel',
    fonte: 'Cepea-Esalq/USP',
    fonteUrl: 'https://www.cepea.esalq.usp.br',
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
    termo: 'agro milho cepea saca grao preco',
    formatoValor: 'real',
  },
  {
    chave: 'fipezap',
    nome: 'FipeZap',
    descricao: 'Índice FipeZap de imóveis residenciais anunciados — BCB SGS 19967',
    categoria: 'Imobiliário',
    unidade: '% a.m.',
    modoAcumulado: 'variacao_mensal',
    fonte: 'FipeZap (Fipe/ZAP+)',
    fonteUrl: 'https://www.fipe.org.br',
    selo: 'oficial_institucional',
    termo: 'imobiliario fipezap imovel residencial aluguel preco',
    formatoValor: 'pct',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
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
    selo: 'oficial_institucional',
    termo: 'renda salario minimo ipea ipeadata',
    formatoValor: 'pct',
  },
  {
    chave: 'ibovespa',
    nome: 'Ibovespa',
    descricao: 'Ibovespa — pontos da B3, fechamento mensal — BCB SGS 7 (base interna)',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'B3 / Banco Central — SGS 7',
    fonteUrl: 'https://www.b3.com.br',
    selo: 'oficial_institucional',
    termo: 'ibovespa b3 bolsa acoes mercado financeiro indice',
    formatoValor: 'bruto',
  },
  {
    chave: 'ifix',
    nome: 'IFIX',
    descricao: 'IFIX — índice de fundos imobiliários da B3, fechamento mensal — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'B3 / IPEA — IPEADATA',
    fonteUrl: 'https://www.ipeadata.gov.br',
    selo: 'oficial_institucional',
    termo: 'ifix fundo imobiliario fii b3 mercado financeiro',
    formatoValor: 'bruto',
  },
  {
    chave: 'sp500',
    nome: 'S&P 500',
    descricao: 'Índice S&P 500 (bolsa de NY) — fechamento mensal — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA (S&P 500)',
    fonteUrl: 'https://www.ipeadata.gov.br',
    selo: 'oficial_institucional',
    termo: 'sp500 s&p standard poor bolsas internacionais nova york',
    formatoValor: 'bruto',
  },
  {
    chave: 'dowjones',
    nome: 'Dow Jones',
    descricao: 'Índice Dow Jones Industrial Average — fechamento mensal — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA (Dow Jones)',
    fonteUrl: 'https://www.ipeadata.gov.br',
    selo: 'oficial_institucional',
    termo: 'dow jones industrial average bolsas internacionais nova york',
    formatoValor: 'bruto',
  },
  {
    chave: 'nasdaq',
    nome: 'Nasdaq',
    descricao: 'Índice Nasdaq Composite — fechamento mensal — IPEA/IPEADATA',
    categoria: 'Mercado Financeiro',
    unidade: 'pontos',
    modoAcumulado: 'nivel',
    fonte: 'IPEA — IPEADATA (Nasdaq)',
    fonteUrl: 'https://www.ipeadata.gov.br',
    selo: 'oficial_institucional',
    termo: 'nasdaq composite bolsas internacionais tecnologia',
    formatoValor: 'bruto',
  },
]

const CATALOGO_MAP = new Map(CATALOGO_SERIES.map((c) => [c.chave, c]))

export function catalogoDaChave(chave: string): CatalogoSerie | undefined {
  return CATALOGO_MAP.get(chave as ChaveSerieHistorica)
}

/**
 * Base interna aproximada — gerada a partir da variação média dos últimos
 * 12 valores do fallback do portal, para os índices sem API aberta com série
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
    ibovespa: [128400, 131200, 134600, 138500, 138500, 138500],
    ifix: [2040, 2055, 2071, 2080, 2080, 2080],
    sp500: [4766, 4796, 5074, 5672, 5672, 5672],
    dowjones: [36187, 37690, 39807, 42630, 42630, 42630],
    nasdaq: [10464, 11394, 16794, 18249, 18249, 18249],
  }
  const valores = base[item.chave]
  if (!valores) return []
  if (
    ['admissoes_caged', 'desligamentos_caged', 'saldo_empregos', 'salmin', 'divida'].includes(
      item.chave,
    )
  ) {
    return anos.map((ano, i) => ({ periodo: String(ano), valor: valores[i] }))
  }
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
    if (res && Array.isArray(res.serie) && res.serie.length > 0) {
      return {
        serie: res.serie.map((p) => ({ periodo: String(p.periodo), valor: Number(p.valor) })),
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
