/**
 * TABELA DE RÓTULOS → CAMPOS DA GRADE — leitorBalancoDrePDF
 * ==========================================================
 * Chaves EXATAS dos grupos de `ExercicioFinanceiroCompleto` (grade editável da
 * FerramentaAnaliseBalancosAnexados). Ancora nos TOTAIS de cada grupo; contas
 * de detalhe entram só quando não há total (ver parseLeitura).
 *
 * Não inventa valor: rótulo ausente → campo permanece vazio (0 na grade,
 * sinalizado como "não lido" na UI).
 */

export interface AlvoRotulo {
  chave: string
  /** Padrões de rótulo; o primeiro com valor define, ambiguidade sinalizada. */
  padroes: RegExp[]
}

/** 1. Rótulos de TOTAL de cada grupo (prioridade máxima). */
export const ALVOS_TOTAIS: AlvoRotulo[] = [
  // — Ativo Circulante —
  {
    chave: 'ativoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?ativo\s*circulante\b/i,
      /^ativo\s*circulante\s*total\b/i,
      /^total\s*ac\b/i,
    ],
  },
  // — Ativo Não Circulante —
  {
    chave: 'ativoNaoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?ativo\s*nao\s*circulante\b/i,
      /^ativo\s*nao\s*circulante\s*total\b/i,
      /^total\s*anc\b/i,
      /^(ativo\s*)?realizavel\s*a\s*longo\s*prazo/i,
      /^nao\s*circulante\b/i,
    ],
  },
  // — Ativo Total —
  {
    chave: 'ativo.total',
    padroes: [/^total\s*(do\s*)?ativo$/i, /^ativo\s*total\b/i, /^total\s*ativo\b/i],
  },
  // — Passivo Circulante —
  {
    chave: 'passivoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?passivo\s*circulante\b/i,
      /^passivo\s*circulante\s*total\b/i,
      /^total\s*pc\b/i,
    ],
  },
  // — Passivo Não Circulante —
  {
    chave: 'passivoNaoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?passivo\s*nao\s*circulante\b/i,
      /^passivo\s*nao\s*circulante\s*total\b/i,
      /^total\s*pnc\b/i,
      /^passivo\s*nao\s*circulante$/i,
    ],
  },
  // — Passivo Total —
  {
    chave: 'passivo.total',
    padroes: [
      /^total\s*(do\s*)?passivo\b/i,
      /^passivo\s*total\b/i,
      /^total\s*passivo\b/i,
      /^passivo\s*circulante\s*e\s*nao\s*circulante\b/i,
    ],
  },
  // — Patrimônio Líquido —
  {
    chave: 'patrimonioLiquido.total',
    padroes: [
      /^total\s*(do\s*)?patrimonio\s*liquido\b/i,
      /^patrimonio\s*liquido\s*total\b/i,
      /^total\s*pl\b/i,
    ],
  },
  // — DRE —
  {
    chave: 'dre.receitaBruta',
    padroes: [
      /^receita\s*bruta\b/i,
      /^receita\s*operacional\s*bruta\b/i,
      /^receita\s*de\s*vendas\b/i,
    ],
  },
  {
    chave: 'dre.receitaLiquida',
    padroes: [
      /^receita\s*(operacional\s*)?liquida\b/i,
      /^receita\s*liquida\s*de\s*vendas\b/i,
      /^receita\s*liquida$/i,
    ],
  },
  {
    chave: 'dre.deducoesImpostos',
    padroes: [
      /^dedu(ç|c)(õ|o)es\b/i,
      /^dedu(ç|c)(õ|o)es\s*(da\s*receita|e\s*impostos|de\s*impostos)\b/i,
      /^impostos\s*sobre\s*vendas/i,
      /^impostos?\s*sobre\s*a?\s*receita/i,
    ],
  },
  {
    chave: 'dre.cmv',
    padroes: [
      /^(custos?\s*(dos\s*)?(de\s*)?(produtos|mercadorias|servi(ç|c)os))\b.*vendid/i,
      /^(custos?\s*(dos\s*)?(de\s*)?(produtos|mercadorias|servi(ç|c)os|vendas))\b/i,
      /^cmv\b/i,
      /^cpv\b/i,
      /^csp\b/i,
    ],
  },
  {
    chave: 'dre.despesasVendas',
    padroes: [/^despesas?\s*(com\s*)?(de\s*)?vendas\b/i, /^despesas?\s*comerciais\b/i],
  },
  {
    chave: 'dre.despesasAdministrativas',
    padroes: [
      /^despesas?\s*(com\s*)?administra(ç|c)(ã|o)/i,
      /^despesas?\s*gerais\s*e\s*administrativas/i,
      /^despesas?\s*gerais\b/i,
      /^despesas?\s*admin/i,
    ],
  },
  {
    chave: 'dre.outrasDespesasOperacionais',
    padroes: [
      /^outras\s*(despesas\s*e\s*)?receitas?\s*opera(ç|c)ionais/i,
      /^outras\s*receitas?\s*e\s*despesas?\s*opera(ç|c)ionais/i,
      /^outras\s*despesas\s*opera(ç|c)ionais/i,
      /^despesas?\s*operacionais\b/i,
    ],
  },
  {
    chave: 'dre.depreciacaoAmortizacao',
    padroes: [
      /^deprecia(ç|c)(ã|o)\s*e?\s*(e\s*)?amortiza(ç|c)(ã|o)/i,
      /^depreciacao\b/i,
      /^amortiza(ç|c)(ã|o)\b/i,
      /^deprecia(ç|c)(õ|o)es\b/i,
    ],
  },
  {
    chave: 'dre.resultadoFinanceiro',
    padroes: [
      /^resultado\s*financeiro\b/i,
      /^receitas?\s*e\s*despesas?\s*financeiras/i,
      /^despesas?\s*financeiras/i,
      /^receitas?\s*financeiras/i,
    ],
  },
  {
    chave: 'dre.irCsll',
    padroes: [
      /^contribui(ç|c)(ã|o)\s*social\s*(sobre\s*o\s*lucro)?\b/i,
      /^(provis(ã|o)es?\s*)?para\s*(ir|imposto)/i,
      /^ir\s*\/?\s*csll/i,
      /^irpj\b/i,
      /^csll\b/i,
    ],
  },
  {
    chave: 'dre.lucroPrejuizo',
    padroes: [
      /^(lucro|preju(í|i)zo)\s*(l(í|i)quido)?\s*(do\s*(exerc(í|i)cio|per(í|i)odo))?\s*(do\s*exerc(í|i)cio)?$/i,
      /^(lucro|preju(í|i)zo)\s*(l(í|i)quido)\b/i,
      /^(lucro|preju(í|i)zo)\s*(ou\s*preju(í|i)zo)?\s*(do\s*exerc(í|i)cio|do\s*per(í|i)odo)\b/i,
    ],
  },
]

/** 2. Contas de DETALHE (só entram onde o total não foi encontrado). */
export const ALVOS_DETALHE: AlvoRotulo[] = [
  // Ativo Circulante
  {
    chave: 'ativoCirculante.caixaEquivalentes',
    padroes: [/^(caixa|caixa\s*e\s*equivalentes|disponibilidades)\b/i],
  },
  {
    chave: 'ativoCirculante.aplicacoesFinanceiras',
    padroes: [/^aplica(ç|c)(õ|o)es\s*financeiras/i],
  },
  {
    chave: 'ativoCirculante.contasReceber',
    padroes: [/^(clientes|contas?\s*a?\s*receber|duplicatas?\s*a?\s*receber)\b/i],
  },
  { chave: 'ativoCirculante.estoques', padroes: [/^estoques?\b/i, /^invent(á|a)rio\b/i] },
  {
    chave: 'ativoCirculante.tributosRecuperar',
    padroes: [/^(tributos?\s*a?\s*(recuperar|a\s*recuperar|compens(á|a)vel))\b/i],
  },
  {
    chave: 'ativoCirculante.outrosAtivosCirculantes',
    padroes: [/^outros?\s*ativos?\s*circulantes?\b/i],
  },
  // Ativo Não Circulante
  {
    chave: 'ativoNaoCirculante.realizavelLongoPrazo',
    padroes: [/^realizavel\s*a\s*longo\s*prazo/i],
  },
  { chave: 'ativoNaoCirculante.investimentos', padroes: [/^investimentos\b/i] },
  { chave: 'ativoNaoCirculante.imobilizado', padroes: [/^imobilizado\b/i] },
  { chave: 'ativoNaoCirculante.intangivel', padroes: [/^intang(í|i)vel\b/i] },
  // Passivo Circulante
  {
    chave: 'passivoCirculante.fornecedores',
    padroes: [/^(fornecedores|contas?\s*a?\s*pagar\s*(a\s*)?fornecedores)\b/i],
  },
  {
    chave: 'passivoCirculante.emprestimosCP',
    padroes: [/^emprestimos?\s*e?\s*financiamentos?\b/i, /^emprestimos\b/i],
  },
  {
    chave: 'passivoCirculante.obrigacoesTrabalhistas',
    padroes: [/^obriga(ç|c)(õ|o)es\s*trabalhistas/i],
  },
  {
    chave: 'passivoCirculante.obrigacoesTributarias',
    padroes: [/^obriga(ç|c)(õ|o)es\s*tribut(á|a)rias/i],
  },
  {
    chave: 'passivoCirculante.adiantamentosClientes',
    padroes: [/^adiantamentos?\s*de\s*clientes/i],
  },
  {
    chave: 'passivoCirculante.outrasObrigacoesCP',
    padroes: [/^outras?\s*obriga(ç|c)(õ|o)es?\s*(circulantes?)?\b/i],
  },
  // Passivo Não Circulante
  {
    chave: 'passivoNaoCirculante.emprestimosLP',
    padroes: [/^emprestimos?\s*e?\s*financiamentos?\b.*longo/i, /^emprestimos\s*lp\b/i],
  },
  {
    chave: 'passivoNaoCirculante.tributosParcelados',
    padroes: [/^(tributos?\s*parcelados|parcelamento)\b/i],
  },
  {
    chave: 'passivoNaoCirculante.provisoesCPC25',
    padroes: [/^provis(õ|o)es?\s*(cpc\s*25|atuaria|para\s*conting)/i],
  },
  {
    chave: 'passivoNaoCirculante.outrasObrigacoesLP',
    padroes: [/^outras?\s*obriga(ç|c)(õ|o)es?\s*(longo|n(ã|a)o\s*circulante)/i],
  },
  // Patrimônio Líquido
  {
    chave: 'patrimonioLiquido.capitalSocial',
    padroes: [/^capital\s*(social|realizado|subscrito)\b/i],
  },
  {
    chave: 'patrimonioLiquido.reservasLucros',
    padroes: [/^reservas?\s*de\s*lucros?\b/i, /^reservas?\b/i],
  },
  {
    chave: 'patrimonioLiquido.ajustesAvaliacaoPatrimonial',
    padroes: [/^ajustes?\s*(de\s*)?avalia(ç|c)(ã|o)\s*patrimonial/i],
  },
  {
    chave: 'patrimonioLiquido.prejuizosAcumulados',
    padroes: [/^(lucros|preju(í|i)zos)\s*acumulados?\b/i],
  },
]
