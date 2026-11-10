/**
 * TABELA DE RÓTULOS → CAMPOS DA GRADE — leitorBalancoDrePDF
 * ==========================================================
 * Chaves EXATAS dos grupos de `ExercicioFinanceiroCompleto` (grade editável da
 * FerramentaAnaliseBalancosAnexados). Ancora nos TOTAIS de cada grupo; contas
 * de detalhe entram só quando não há total (ver parseLeitura).
 *
 * Não inventa valor: rótulo ausente → campo permanece vazio (0 na grade,
 * sinalizado como "não lido" na UI).
 *
 * Ampla cobertura de sinônimos, abreviações (AC, ANC, PC, PNC, PL, CIRC., N.CIRC.),
 * grafias com e sem artigo ("do passivo", "de vendas", etc.) e numerações de plano
 * de contas ("1.", "1.1", "2.1", etc. removidas na normalização).
 */

export interface AlvoRotulo {
  chave: string
  /** Padrões de rótulo normalizado; o primeiro com valor define, ambiguidade sinalizada. */
  padroes: RegExp[]
}

/** 1. Rótulos de TOTAL de cada grupo e DRE (prioridade máxima). */
export const ALVOS_TOTAIS: AlvoRotulo[] = [
  // — Ativo Circulante —
  {
    chave: 'ativoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?ativo\s*circulante\b/i,
      /^ativo\s*circulante\s*total\b/i,
      /^total\s*(do\s*)?ativo\s*circ\b/i,
      /^total\s*(do\s*)?circulante\s*ativo\b/i,
      /^total\s*ac\b/i,
      /^ac\s*total\b/i,
      /^total\s*(do\s*)?circulante$/i,
    ],
  },
  // — Ativo Não Circulante —
  {
    chave: 'ativoNaoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?ativo\s*nao\s*circulante\b/i,
      /^ativo\s*nao\s*circulante\s*total\b/i,
      /^total\s*(do\s*)?ativo\s*n\s*circulante\b/i,
      /^total\s*(do\s*)?ativo\s*n\s*circ\b/i,
      /^total\s*anc\b/i,
      /^anc\s*total\b/i,
      /^total\s*(do\s*)?realizavel\s*a\s*longo\s*prazo\s*e\s*permanente/i,
      /^total\s*(do\s*)?nao\s*circulante\b/i,
      /^ativo\s*permanente\s*total\b/i,
      /^total\s*(do\s*)?ativo\s*permanente\b/i,
    ],
  },
  // — Ativo Total —
  {
    chave: 'ativo.total',
    padroes: [
      /^total\s*(geral\s*)?(do\s*)?ativo$/i,
      /^total\s*(geral\s*)?(do\s*)?ativo\b/i,
      /^ativo\s*total$/i,
      /^ativo\s*total\b/i,
      /^total\s*ativo$/i,
      /^total\s*ativo\b/i,
      /^total\s*do\s*ativo\s*geral$/i,
    ],
  },
  // — Passivo Circulante —
  {
    chave: 'passivoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?passivo\s*circulante\b/i,
      /^passivo\s*circulante\s*total\b/i,
      /^total\s*(do\s*)?passivo\s*circ\b/i,
      /^total\s*pc\b/i,
      /^pc\s*total\b/i,
      /^total\s*(das\s*)?exigibilidades\s*a\s*curto\s*prazo\b/i,
      /^passivo\s*circulante$/i,
    ],
  },
  // — Passivo Não Circulante —
  {
    chave: 'passivoNaoCirculante.total',
    padroes: [
      /^total\s*(do\s*)?passivo\s*nao\s*circulante\b/i,
      /^passivo\s*nao\s*circulante\s*total\b/i,
      /^total\s*(do\s*)?passivo\s*n\s*circulante\b/i,
      /^total\s*(do\s*)?passivo\s*n\s*circ\b/i,
      /^total\s*pnc\b/i,
      /^pnc\s*total\b/i,
      /^total\s*(do\s*)?exigivel\s*a\s*longo\s*prazo\b/i,
      /^exigivel\s*a\s*longo\s*prazo\s*total\b/i,
      /^passivo\s*nao\s*circulante$/i,
      /^passivo\s*n\s*circulante$/i,
    ],
  },
  // — Passivo Total (Passivo Circulante + PNC, sem ou com PL) —
  {
    chave: 'passivo.total',
    padroes: [
      /^total\s*(do\s*)?passivo\s*(e|\+)\s*(do\s*)?patrimonio\s*liquido\b/i,
      /^total\s*(do\s*)?passivo\s*(e|\+)\s*(do\s*)?pl\b/i,
      /^passivo\s*(e|\+)\s*patrimonio\s*liquido\s*total\b/i,
      /^passivo\s*total\s*(e|\+)\s*patrimonio\s*liquido\b/i,
      /^total\s*(do\s*)?passivo\s*circulante\s*e\s*nao\s*circulante\b/i,
      /^passivo\s*circulante\s*e\s*nao\s*circulante\b/i,
      /^total\s*(geral\s*)?(do\s*)?passivo$/i,
      /^passivo\s*total\b/i,
      /^total\s*passivo\b/i,
      /^total\s*geral\s*(do\s*)?passivo\b/i,
    ],
  },
  // — Patrimônio Líquido Total —
  {
    chave: 'patrimonioLiquido.total',
    padroes: [
      /^total\s*(do\s*)?patrimonio\s*liquido\b/i,
      /^patrimonio\s*liquido\s*total\b/i,
      /^total\s*(do\s*)?patr\s*liq\b/i,
      /^total\s*pl\b/i,
      /^pl\s*total\b/i,
      /^patrimonio\s*liquido$/i,
      /^patrimonio\s*liquido\s*social$/i,
    ],
  },
  // — DRE: Receita Bruta —
  {
    chave: 'dre.receitaBruta',
    padroes: [
      /^receita\s*(operacional\s*)?bruta\b/i,
      /^receita\s*bruta\s*(de\s*vendas|\(de\s*vendas\)|das\s*vendas)\b/i,
      /^receita\s*bruta\s*de\s*(vendas\s*e\s*)?servicos\b/i,
      /^receita\s*de\s*vendas\s*(e\s*servicos)?\b/i,
      /^vendas\s*(de\s*)?servicos\b/i,
      /^vendas\s*de\s*mercadorias\b/i,
      /^vendas\s*brutas\b/i,
      /^faturamento\s*bruto\b/i,
      /^receita\s*bruta$/i,
    ],
  },
  // — DRE: Deduções e Impostos —
  {
    chave: 'dre.deducoesImpostos',
    padroes: [
      /^deducoes\s*(da\s*receita|e\s*impostos|de\s*impostos|sobre\s*vendas|das\s*vendas)\b/i,
      /^deducoes\s*da\s*receita\s*bruta\b/i,
      /^deducoes\s*e\s*abatimentos\b/i,
      /^tributos\s*sobre\s*(vendas|servicos|receita)\b/i,
      /^impostos\s*e\s*contribuicoes\s*sobre\s*(vendas|a\s*receita|receita)\b/i,
      /^impostos\s*sobre\s*(as\s*)?(vendas|servicos|receita)\b/i,
      /^impostos\s*incidentes\s*sobre\s*(vendas|a\s*receita)\b/i,
      /^vendas\s*canceladas\b/i,
      /^deducoes$/i,
      /^impostos\s*e\s*deducoes\b/i,
    ],
  },
  // — DRE: Receita Líquida —
  {
    chave: 'dre.receitaLiquida',
    padroes: [
      /^receita\s*(operacional\s*)?liquida\b/i,
      /^receita\s*liquida\s*de\s*vendas\b/i,
      /^receita\s*liquida\s*(das\s*)?vendas\s*e\s*servicos\b/i,
      /^vendas\s*liquidas\b/i,
      /^faturamento\s*liquido\b/i,
      /^receita\s*liquida$/i,
    ],
  },
  // — DRE: CMV / CPV / CSP / Custos —
  {
    chave: 'dre.cmv',
    padroes: [
      /^custo\s*(das|dos|de)\s*(mercadorias|produtos|servicos|vendas)\b/i,
      /^custos?\s*(das|dos|de)\s*(mercadorias|produtos|servicos|vendas)\b/i,
      /^custo\s*(da\s*)?mercadoria\s*vendida\b/i,
      /^custo\s*(dos\s*)?produtos\s*vendidos\b/i,
      /^custo\s*(dos\s*)?servicos\s*prestados\b/i,
      /^custo\s*(das\s*)?vendas\b/i,
      /^custos\s*operacionais\b/i,
      /^cmv\b/i,
      /^cpv\b/i,
      /^csp\b/i,
      /^custo\s*total\s*(das\s*vendas|dos\s*servicos)\b/i,
    ],
  },
  // — DRE: Lucro Bruto —
  {
    chave: 'dre.lucroBruto',
    padroes: [
      /^(lucro|resultado)\s*bruto\b/i,
      /^margem\s*bruta\b/i,
      /^lucro\s*bruto\s*operacional\b/i,
      /^(lucro|prejuizo)\s*bruto\b/i,
    ],
  },
  // — DRE: Despesas com Vendas / Comerciais —
  {
    chave: 'dre.despesasVendas',
    padroes: [
      /^despesas?\s*(com\s*)?(de\s*)?vendas\b/i,
      /^despesas?\s*comerciais\b/i,
      /^despesas?\s*de\s*distribuicao\b/i,
      /^despesas?\s*com\s*comercializacao\b/i,
    ],
  },
  // — DRE: Despesas Gerais e Administrativas —
  {
    chave: 'dre.despesasAdministrativas',
    padroes: [
      /^despesas?\s*(com\s*)?administra(cao|tivas?)\b/i,
      /^despesas?\s*gerais\s*e\s*administrativas?\b/i,
      /^despesas?\s*administrativas?\s*e\s*gerais\b/i,
      /^despesas?\s*com\s*pessoal\b/i,
      /^despesas?\s*de\s*pessoal\b/i,
      /^despesas?\s*gerais\b/i,
      /^despesas?\s*admin\b/i,
      /^despesas?\s*de\s*administracao\b/i,
    ],
  },
  // — DRE: Outras Despesas/Receitas Operacionais —
  {
    chave: 'dre.outrasDespesasOperacionais',
    padroes: [
      /^outras\s*(despesas\s*e\s*)?receitas?\s*operacionais\b/i,
      /^outras\s*receitas?\s*e\s*despesas?\s*operacionais\b/i,
      /^outras\s*despesas?\s*operacionais\b/i,
      /^outras\s*receitas?\s*operacionais\b/i,
      /^despesas?\s*operacionais\s*liquidas\b/i,
      /^total\s*(das\s*)?despesas?\s*operacionais\b/i,
      /^despesas?\s*operacionais\b/i,
    ],
  },
  // — DRE: Depreciação e Amortização —
  {
    chave: 'dre.depreciacaoAmortizacao',
    padroes: [
      /^depreciacao\s*(e|\/)\s*amortizacao\b/i,
      /^depreciacao\s*e\s*exaustao\b/i,
      /^depreciacoes?\s*e\s*amortizacoes?\b/i,
      /^depreciacoes?\b/i,
      /^amortizacoes?\b/i,
      /^depreciacao\b/i,
      /^amortizacao\b/i,
      /^depr\s*e\s*amort\b/i,
    ],
  },
  // — DRE: Resultado Financeiro Líquido / Despesas e Receitas Financeiras —
  {
    chave: 'dre.resultadoFinanceiro',
    padroes: [
      /^resultado\s*financeiro\s*liquido\b/i,
      /^resultado\s*financeiro\b/i,
      /^receitas?\s*e\s*despesas?\s*financeiras\b/i,
      /^despesas?\s*e\s*receitas?\s*financeiras\b/i,
      /^despesas?\s*financeiras\s*liquidas\b/i,
      /^despesas?\s*financeiras\b/i,
      /^receitas?\s*financeiras\b/i,
      /^encargos\s*financeiros\s*liquidos\b/i,
    ],
  },
  // — DRE: IRPJ e CSLL —
  {
    chave: 'dre.irCsll',
    padroes: [
      /^imposto\s*de\s*renda\s*e\s*contribuicao\s*social\b/i,
      /^contribuicao\s*social\s*(sobre\s*o\s*lucro)?\b/i,
      /^provisao\s*(para\s*)?(o\s*)?(irpj\s*e\s*csll|ir|imposto\s*de\s*renda)\b/i,
      /^irpj\s*(e|\/)\s*csll\b/i,
      /^ir\s*(e|\/)\s*csll\b/i,
      /^irpj\b/i,
      /^csll\b/i,
      /^provisao\s*para\s*ir\b/i,
      /^impostos\s*sobre\s*o\s*lucro\b/i,
    ],
  },
  // — DRE: Lucro ou Prejuízo Líquido do Exercício —
  {
    chave: 'dre.lucroPrejuizo',
    padroes: [
      /^(lucro|prejuizo)\s*(liquido)?\s*(do\s*(exercicio|periodo))\b/i,
      /^(lucro|prejuizo)\s*liquido\s*do\s*exercicio$/i,
      /^(lucro|prejuizo)\s*liquido\b/i,
      /^(lucro|prejuizo)\s*(ou\s*prejuizo)?\s*(do\s*exercicio|do\s*periodo)\b/i,
      /^resultado\s*liquido\s*(do\s*(exercicio|periodo))\b/i,
      /^resultado\s*liquido\b/i,
      /^sobra\s*(ou\s*perda)?\s*liquida\b/i,
      /^(lucro|prejuizo)\s*do\s*exercicio$/i,
      /^(lucro|prejuizo)\s*do\s*periodo$/i,
      /^lucro\s*apurado\b/i,
      /^prejuizo\s*apurado\b/i,
    ],
  },
]

/** 2. Contas de DETALHE da grade editável (preenchem campos específicos). */
export const ALVOS_DETALHE: AlvoRotulo[] = [
  // — Ativo Circulante: Caixa e Equivalentes —
  {
    chave: 'ativoCirculante.caixaEquivalentes',
    padroes: [
      /^caixa\s*e\s*equivalentes\s*(de\s*caixa)?\b/i,
      /^caixa\s*e\s*bancos\b/i,
      /^disponibilidades\b/i,
      /^disponivel\b/i,
      /^caixa\s*geral\b/i,
      /^caixa$/i,
      /^bancos\s*conta\s*movimento\b/i,
      /^bancos\s*c\/c\b/i,
      /^bancos\b/i,
    ],
  },
  // — Ativo Circulante: Aplicações Financeiras —
  {
    chave: 'ativoCirculante.aplicacoesFinanceiras',
    padroes: [
      /^aplicacoes\s*financeiras\s*(de\s*liquidez\s*imediata)?\b/i,
      /^aplicacoes\s*de\s*liquidez\s*imediata\b/i,
      /^titulos\s*e\s*valores\s*mobiliarios\s*(curto\s*prazo|cp)?\b/i,
      /^investimentos\s*de\s*curto\s*prazo\b/i,
      /^aplicacoes\s*financeiras$/i,
    ],
  },
  // — Ativo Circulante: Contas a Receber / Clientes —
  {
    chave: 'ativoCirculante.contasReceber',
    padroes: [
      /^contas\s*a\s*receber\s*(de\s*clientes)?\b/i,
      /^clientes\b/i,
      /^duplicatas\s*a\s*receber\b/i,
      /^titulos\s*a\s*receber\b/i,
      /^creditos\s*com\s*clientes\b/i,
      /^valores\s*a\s*receber\s*(de\s*clientes)?\b/i,
    ],
  },
  // — Ativo Circulante: Estoques —
  {
    chave: 'ativoCirculante.estoques',
    padroes: [
      /^estoques?\s*(de\s*mercadorias|de\s*produtos|de\s*materiais)?\b/i,
      /^mercadorias\s*(para\s*revenda)?\b/i,
      /^produtos\s*(acabados|em\s*elaboracao)?\b/i,
      /^materias\s*primas\b/i,
      /^inventario\b/i,
      /^estoques?$/i,
    ],
  },
  // — Ativo Circulante: Tributos a Recuperar —
  {
    chave: 'ativoCirculante.tributosRecuperar',
    padroes: [
      /^tributos?\s*a\s*(recuperar|compensar)\b/i,
      /^impostos?\s*a\s*(recuperar|compensar)\b/i,
      /^creditos?\s*tributarios\s*(a\s*recuperar)?\b/i,
      /^impostos?\s*e\s*contribuicoes\s*a\s*recuperar\b/i,
      /^icms\s*a\s*recuperar\b/i,
      /^pis\s*\/?\s*cofins\s*a\s*recuperar\b/i,
      /^irrf\s*a\s*compensar\b/i,
    ],
  },
  // — Ativo Circulante: Outros Ativos Circulantes —
  {
    chave: 'ativoCirculante.outrosAtivosCirculantes',
    padroes: [
      /^outros?\s*ativos?\s*circulantes?\b/i,
      /^outros\s*creditos\s*(circulante)?\b/i,
      /^despesas\s*(do\s*exercicio\s*seguinte|antecipadas|a\s*apropriar)\b/i,
      /^adiantamentos\s*(a\s*fornecedores|a\s*empregados|a\s*terceiros)\b/i,
      /^creditos\s*diversos\b/i,
      /^outras\s*contas\s*a\s*receber\b/i,
    ],
  },
  // — Ativo Não Circulante: Realizável a Longo Prazo —
  {
    chave: 'ativoNaoCirculante.realizavelLongoPrazo',
    padroes: [
      /^realizavel\s*a\s*longo\s*prazo\b/i,
      /^ativo\s*realizavel\s*a\s*longo\s*prazo\b/i,
      /^creditos\s*a\s*longo\s*prazo\b/i,
      /^depositos\s*judiciais\b/i,
      /^contas\s*a\s*receber\s*a\s*longo\s*prazo\b/i,
      /^rlp\b/i,
    ],
  },
  // — Ativo Não Circulante: Investimentos —
  {
    chave: 'ativoNaoCirculante.investimentos',
    padroes: [
      /^investimentos\s*(em\s*coligadas|permanentes)?\b/i,
      /^participacoes\s*societarias\b/i,
      /^participacoes\s*em\s*outras\s*sociedades\b/i,
      /^propriedades\s*para\s*investimento\b/i,
      /^investimentos$/i,
    ],
  },
  // — Ativo Não Circulante: Imobilizado —
  {
    chave: 'ativoNaoCirculante.imobilizado',
    padroes: [
      /^ativo\s*imobilizado\b/i,
      /^imobilizado\s*(liquido|bruto)?\b/i,
      /^bens\s*(moveis\s*e\s*imoveis|do\s*ativo\s*imobilizado)\b/i,
      /^imoveis\s*(e\s*terrenos)?\b/i,
      /^maquinas\s*(e\s*equipamentos)?\b/i,
      /^veiculos\b/i,
      /^instalacoes\b/i,
      /^imobilizado$/i,
    ],
  },
  // — Ativo Não Circulante: Intangível —
  {
    chave: 'ativoNaoCirculante.intangivel',
    padroes: [
      /^ativo\s*intangivel\b/i,
      /^intangivel\s*(liquido)?\b/i,
      /^marcas\s*(e\s*patentes)?\b/i,
      /^softwares?\b/i,
      /^fundo\s*de\s*comercio\b/i,
      /^goodwill\b/i,
      /^intangivel$/i,
    ],
  },
  // — Passivo Circulante: Fornecedores —
  {
    chave: 'passivoCirculante.fornecedores',
    padroes: [
      /^fornecedores\s*(nacionais|estrangeiros|a\s*pagar)?\b/i,
      /^contas\s*a\s*pagar\s*(a\s*)?fornecedores\b/i,
      /^duplicatas\s*a\s*pagar\b/i,
      /^titulos\s*a\s*pagar\b/i,
      /^fornecedores$/i,
    ],
  },
  // — Passivo Circulante: Empréstimos e Financiamentos CP —
  {
    chave: 'passivoCirculante.emprestimosCP',
    padroes: [
      /^emprestimos\s*(e\s*financiamentos)?\s*(a\s*curto\s*prazo|cp)?\b/i,
      /^financiamentos\s*(a\s*curto\s*prazo|cp)?\b/i,
      /^dividas\s*bancarias\s*(cp|curto\s*prazo)?\b/i,
      /^instituicoes\s*financeiras\s*(cp|curto\s*prazo)?\b/i,
      /^emprestimos\s*bancarios\s*(cp|curto\s*prazo)?\b/i,
      /^emprestimos\s*cp\b/i,
      /^financiamentos\s*cp\b/i,
      /^emprestimos\s*e\s*financiamentos$/i,
      /^emprestimos$/i,
    ],
  },
  // — Passivo Circulante: Obrigações Trabalhistas e Previdenciárias —
  {
    chave: 'passivoCirculante.obrigacoesTrabalhistas',
    padroes: [
      /^obrigacoes\s*trabalhistas\s*(e\s*previdenciarias)?\b/i,
      /^salarios\s*(e\s*ordenados)?\s*a\s*pagar\b/i,
      /^folha\s*de\s*pagamento\s*a\s*pagar\b/i,
      /^inss\s*(e\s*fgts)?\s*a\s*recolher\b/i,
      /^fgts\s*a\s*recolher\b/i,
      /^provisoes?\s*de\s*ferias\s*(e\s*13[ºo]\s*salario)?\b/i,
      /^provisao\s*para\s*13[ºo]\s*salario\b/i,
      /^encargos\s*sociais\s*a\s*recolher\b/i,
      /^obrigacoes\s*sociais\b/i,
      /^obrigacoes\s*trabalhistas$/i,
    ],
  },
  // — Passivo Circulante: Obrigações Tributárias / Fiscais —
  {
    chave: 'passivoCirculante.obrigacoesTributarias',
    padroes: [
      /^obrigacoes\s*tributarias\s*(e\s*fiscais)?\b/i,
      /^impostos\s*e\s*contribuicoes\s*a\s*(recolher|pagar)\b/i,
      /^impostos\s*a\s*(recolher|pagar)\b/i,
      /^tributos\s*a\s*(recolher|pagar)\b/i,
      /^tributos\s*municipais\s*estaduais\s*e\s*federais\b/i,
      /^icms\s*a\s*(recolher|pagar)\b/i,
      /^iss\s*a\s*(recolher|pagar)\b/i,
      /^pis\s*\/?\s*cofins\s*a\s*recolher\b/i,
      /^simples\s*nacional\s*(a\s*recolher)?\b/i,
      /^simples\s*nacional\b/i,
      /^das\s*a\s*recolher\b/i,
      /^irpj\s*e\s*csll\s*a\s*recolher\b/i,
      /^obrigacoes\s*fiscais\b/i,
      /^obrigacoes\s*tributarias$/i,
    ],
  },
  // — Passivo Circulante: Adiantamentos de Clientes —
  {
    chave: 'passivoCirculante.adiantamentosClientes',
    padroes: [
      /^adiantamentos?\s*(de\s*)?clientes\b/i,
      /^valores\s*recebidos\s*de\s*clientes\s*antecipadamente\b/i,
      /^recursos\s*recebidos\s*por\s*conta\s*de\s*clientes\b/i,
      /^adiantamento\s*de\s*clientes$/i,
    ],
  },
  // — Passivo Circulante: Outras Obrigações a Curto Prazo —
  {
    chave: 'passivoCirculante.outrasObrigacoesCP',
    padroes: [
      /^outras?\s*obrigacoes?\s*(a\s*curto\s*prazo|circulantes?)?\b/i,
      /^outras\s*contas\s*a\s*pagar\b/i,
      /^contas\s*a\s*pagar\s*diversas\b/i,
      /^dividendos\s*(e\s*jcp)?\s*a\s*pagar\b/i,
      /^pro-labore\s*a\s*pagar\b/i,
      /^credores\s*diversos\b/i,
      /^alugueis\s*a\s*pagar\b/i,
    ],
  },
  // — Passivo Não Circulante: Empréstimos e Financiamentos LP —
  {
    chave: 'passivoNaoCirculante.emprestimosLP',
    padroes: [
      /^emprestimos\s*(e\s*financiamentos)?\s*(a\s*longo\s*prazo|lp)\b/i,
      /^financiamentos\s*(a\s*longo\s*prazo|lp)\b/i,
      /^dividas\s*bancarias\s*(a\s*longo\s*prazo|lp)\b/i,
      /^instituicoes\s*financeiras\s*(a\s*longo\s*prazo|lp)\b/i,
      /^emprestimos\s*lp\b/i,
      /^financiamentos\s*lp\b/i,
    ],
  },
  // — Passivo Não Circulante: Tributos Parcelados —
  {
    chave: 'passivoNaoCirculante.tributosParcelados',
    padroes: [
      /^tributos?\s*(e\s*impostos\s*)?parcelados\s*(a\s*longo\s*prazo|lp)?\b/i,
      /^parcelamento\s*(de\s*tributos|fiscal|de\s*impostos|refis|pert)\b/i,
      /^parcelamentos?\s*(de\s*longo\s*prazo|lp)?\b/i,
      /^obrigacoes\s*tributarias\s*(a\s*longo\s*prazo|lp)\b/i,
      /^tributos\s*diferidos\s*(lp)?\b/i,
    ],
  },
  // — Passivo Não Circulante: Provisões CPC 25 / Contingências —
  {
    chave: 'passivoNaoCirculante.provisoesCPC25',
    padroes: [
      /^provisoes?\s*(para\s*)?(contingencias|riscos\s*fiscais|processos\s*judiciais)\b/i,
      /^provisoes?\s*cpc\s*25\b/i,
      /^provisoes?\s*(trabalhistas|fiscais|civeis)\s*(a\s*longo\s*prazo|lp)?\b/i,
      /^provisao\s*para\s*perdas\s*(lp)?\b/i,
    ],
  },
  // — Passivo Não Circulante: Outras Obrigações a Longo Prazo —
  {
    chave: 'passivoNaoCirculante.outrasObrigacoesLP',
    padroes: [
      /^outras?\s*obrigacoes?\s*(a\s*longo\s*prazo|nao\s*circulante|pnc|lp)\b/i,
      /^exigivel\s*a\s*longo\s*prazo\s*outros\b/i,
      /^contas\s*a\s*pagar\s*a\s*longo\s*prazo\b/i,
      /^partes\s*relacionadas\s*(a\s*longo\s*prazo|lp)\b/i,
      /^adiantamento\s*para\s*futuro\s*aumento\s*de\s*capital\s*(afac)\b/i,
      /^afac\b/i,
    ],
  },
  // — Patrimônio Líquido: Capital Social —
  {
    chave: 'patrimonioLiquido.capitalSocial',
    padroes: [
      /^capital\s*social\s*(subscrito|realizado|a\s*realizar|integralizado)?\b/i,
      /^capital\s*social\b/i,
      /^capital\s*subscrito\b/i,
      /^capital\s*integralizado\b/i,
      /^capital\s*realizado\b/i,
      /^capital$/i,
    ],
  },
  // — Patrimônio Líquido: Reservas de Lucros e de Capital —
  {
    chave: 'patrimonioLiquido.reservasLucros',
    padroes: [
      /^reservas?\s*de\s*lucros?\b/i,
      /^reservas?\s*de\s*capital\b/i,
      /^reserva\s*legal\b/i,
      /^reserva\s*estatutaria\b/i,
      /^reserva\s*de\s*contingencias\b/i,
      /^reserva\s*para\s*expansao\b/i,
      /^reserva\s*de\s*incentivos\s*fiscais\b/i,
      /^reserva\s*especial\b/i,
      /^reservas?$/i,
    ],
  },
  // — Patrimônio Líquido: Ajustes de Avaliação Patrimonial —
  {
    chave: 'patrimonioLiquido.ajustesAvaliacaoPatrimonial',
    padroes: [
      /^ajustes?\s*(de\s*)?avaliacao\s*patrimonial\b/i,
      /^ajustes\s*patrimoniais\b/i,
      /^outros\s*resultados\s*abrangentes\b/i,
      /^ajuste\s*de\s*avaliacao\b/i,
    ],
  },
  // — Patrimônio Líquido: Lucros ou Prejuízos Acumulados —
  {
    chave: 'patrimonioLiquido.prejuizosAcumulados',
    padroes: [
      /^(lucros|prejuizos)\s*acumulados?\b/i,
      /^lucros\s*ou\s*prejuizos\s*acumulados?\b/i,
      /^prejuizos\s*acumulados?$/i,
      /^lucros\s*acumulados?$/i,
      /^resultado\s*acumulado\b/i,
      /^sobras\s*ou\s*perdas\s*acumuladas\b/i,
      /^saldo\s*a\s*disposicao\s*(da\s*assembleia|dos\s*socios)\b/i,
    ],
  },
]
