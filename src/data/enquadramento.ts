/**
 * TABELAS DE ENQUADRAMENTO TRIBUTÁRIO E ATIVIDADES COMERCIAIS
 * ============================================================
 * Pedido do CEO (05/11/2026): "tabela de enquadramento tributário e atividades
 * comerciais, para usar de cruzamento na construção da melhor opção tributária
 * para a reforma."
 *
 * ── AS TRÊS DIMENSÕES DO CRUZAMENTO ──
 * A melhor opção tributária de um cliente não sai de uma dimensão só. Ela nasce
 * do cruzamento de três:
 *
 *   1. O QUE ELE VENDE (NCM → tratamento na reforma)
 *      Já existe: o motor de classificação (1.125 regras, 3 eixos).
 *
 *   2. COMO ELE ESTÁ ENQUADRADO (regime → o que muda na reforma)
 *      É esta tabela. Simples, Presumido, Real, MEI — cada um tem um caminho
 *      diferente na transição, e alguns perdem vantagem.
 *
 *   3. O QUE ELE FAZ (atividade → anexos e obrigações aplicáveis)
 *      Também esta tabela. Comércio, indústria, serviço, agro — cada atividade
 *      alcança anexos diferentes da LC 214.
 *
 * ── A REGRA DE HONESTIDADE DESTE ARQUIVO ──
 * Nenhuma linha aqui afirma "este é o melhor regime". O que a tabela faz é dizer,
 * para cada combinação, QUAIS fatores pesam e ONDE olhar. A decisão é do
 * contador, com o caso concreto na mão — porque envolve folha, margem, crédito
 * acumulado, benefício estadual e planejamento societário, coisas que tabela
 * nenhuma captura.
 *
 * ── FONTES ──
 * Regimes: LC 123/2006 (Simples/MEI), Lei 9.718/1998 e 10.637/2002 (Presumido/
 * Real), LC 214/2025 arts. 41 e 343 (tratamento na reforma).
 * Atividades: LC 214/2025 (anexos por setor), CNAE 2.3 (IBGE) nos grupos.
 */

/* ══════════════════════════════════════════════════════════════════
 * DIMENSÃO 1 — REGIMES DE ENQUADRAMENTO
 * ══════════════════════════════════════════════════════════════════ */

/**
 * Os regimes QUE O CONTRIBUINTE ESCOLHE ou em que se enquadra.
 *
 * Ficam juntos porque são alternativas entre si (não se está no Simples e no
 * Real ao mesmo tempo). Os regimes ESPECÍFICOS (combustível, financeiro, ZFM)
 * não entram aqui: não são opção, são condição da operação — misturá-los na
 * mesma escolha faria o cruzamento perder sentido. Eles ficam em
 * REGIMES_ADICIONAIS/REGIMES_ESPECIFICOS.
 */
import { REGIMES_ADICIONAIS } from './regimesAdicionais'

export type RegimeId =
  | 'mei'
  | 'simples'
  | 'simples_hibrido'
  | 'presumido'
  | 'real'
  | 'isenta'
  | 'imune'
  | 'rural_pf'
  | 'rural_pj'
  | 'rural_integrado'
  | 'cooperativa'

export interface Regime {
  id: RegimeId
  nome: string
  /** em uma frase, sem jargão */
  resumo: string
  /** limites e condições que definem quem pode estar nele */
  condicoes: string[]
  /** como a reforma trata este regime */
  naReforma: {
    /** mantém o regime? */
    mantem: boolean
    /** o que muda de fato */
    o_que_muda: string
    /** base legal */
    base: string
    /** cuidado principal */
    alerta: string
  }
  /** para quem este regime tende a ser pior/melhor — sem afirmar qual escolher */
  tendencia: 'mantem-vantagem' | 'perde-vantagem' | 'depende' | 'neutro'
  /** o que fazer na prática */
  acao: string
}

export const REGIMES: Regime[] = [
  {
    id: 'mei',
    nome: 'MEI — Microempreendedor Individual',
    resumo: 'Regime simplificado com valor fixo mensal, para quem trabalha sozinho.',
    condicoes: [
      'Faturamento até R$ 81.000/ano (R$ 251.600 a partir de 2027, se aprovada a ampliação)',
      'Nenhuma participação em outra empresa',
      'No máximo 1 empregado',
      'Atividade permitida na lista do MEI',
    ],
    naReforma: {
      mantem: true,
      o_que_muda:
        'O MEI fica FORA do IBS/CBS como contribuinte. Ele não destaca nem recolhe IBS/CBS na ' +
        'sua venda, e o documento que emite não gera crédito para o comprador PJ.',
      base: 'LC 214/2025, art. 41 e art. 343 (o Simples e o MEI recolhem IBS/CBS no DAS)',
      alerta:
        'Cliente PJ que compra de MEI NÃO aproveita crédito de IBS/CBS. Se o cliente vende para ' +
        'empresas, isso pode virar desvantagem comercial mesmo mantendo tributação menor.',
    },
    tendencia: 'depende',
    acao:
      'Verificar para quem o cliente vende: se a maior parte é consumidor final, tende a manter a ' +
      'vantagem; se vende para PJ que se credita, o comprador perde crédito e pode pressionar o preço.',
  },
  {
    id: 'simples',
    nome: 'Simples Nacional',
    resumo:
      'Regime unificado: um DAS recolhe vários tributos, com alíquota por faixa de faturamento.',
    condicoes: [
      'Faturamento até R$ 4,8 milhões/ano',
      'Atividade permitida no Simples (há vedações por setor)',
      'Sem débitos com o fisco para aderir',
    ],
    naReforma: {
      mantem: true,
      o_que_muda:
        'IBS e CBS entram recolhidos JUNTOS no DAS, sem destaque separado. O crédito transferido ao ' +
        'comprador é limitado ao que o Simples efetivamente recolheu — ou seja, MENOR que no regime regular.',
      base: 'LC 214/2025, art. 343; LC 123/2006, art. 13, §10; Res. CGSN 190/2026, arts. 40-C e 40-D',
      alerta:
        'O Simples deixa de ser "o regime do crédito cheio". Quem vende para indústria ou para ' +
        'cadeia de revenda passa a transferir crédito reduzido, e isso muda a negociação.',
    },
    tendencia: 'perde-vantagem',
    acao:
      'Comparar o DAS com a carga do regime regular sobre a MESMA base (o sistema faz isso na 6E). ' +
      'Se o cliente vende para PJ que se credita, simular a migração antes de decidir.',
  },
  {
    id: 'presumido',
    nome: 'Lucro Presumido',
    resumo: 'Tributa sobre uma margem presumida por lei, não sobre o lucro real.',
    condicoes: [
      'Faturamento até R$ 78 milhões/ano',
      'Atividade permite presunção (comércio, indústria, serviços específicos)',
      'Não obrigado ao Real',
    ],
    naReforma: {
      mantem: true,
      o_que_muda:
        'Passa a conviver com IBS/CBS não cumulativos por fora. PIS/COFINS saem, IBS/CBS entram com ' +
        'crédito amplo — o que costuma FAVORECER quem tem cadeia longa e compra de fornecedor regular.',
      base: 'LC 214/2025, arts. 41 e seguintes (regime regular)',
      alerta:
        'A apuração passa a exigir controle de crédito por documento. Quem não tem escrituração ' +
        'organizada perde crédito por não conseguir comprovar.',
    },
    tendencia: 'depende',
    acao:
      'Levantar a cadeia de compras: quanto mais insumo com IBS/CBS destacado, mais o crédito amplo ' +
      'compensa. Cruzar com o NCM dos produtos para ver o tratamento efetivo.',
  },
  {
    id: 'real',
    nome: 'Lucro Real',
    resumo: 'Tributa sobre o lucro efetivo, com apuração completa.',
    condicoes: [
      'Obrigatório acima de R$ 78 milhões/ano',
      'Obrigatório em setores específicos (financeiro, factoring)',
      'Ou por opção, quando a margem real é baixa',
    ],
    naReforma: {
      mantem: true,
      o_que_muda:
        'É o regime que MAIS se aproxima do desenho da reforma: crédito amplo, apuração por documento, ' +
        'não cumulatividade plena. A mudança tende a ser de adaptação, não de ruptura.',
      base: 'LC 214/2025, arts. 41 e seguintes',
      alerta:
        'O ganho depende de conseguir tomar todos os créditos a que tem direito. Crédito não tomado ' +
        'é dinheiro perdido — e o controle passa a ser item por item do documento.',
    },
    tendencia: 'mantem-vantagem',
    acao:
      'Conferir a completude dos documentos de entrada (NCM, cClassTrib, CST). Documento sem esses ' +
      'campos é crédito em risco. A Lista de Conferência de NCM mostra o que está faltando.',
  },
  /* ══ ACRESCENTADOS EM 05/11/2026 — pedido do CEO ══
   * Simples Híbrido, Isentas, Imunes, produtor rural PF/PJ, integrado e
   * cooperativa. Os dados completos (quem se enquadra, base legal verificada,
   * efeito no crédito e decisão) vivem em regimesAdicionais.ts; aqui ficam
   * reduzidos ao shape que o cruzamento usa.
   */
  ...REGIMES_ADICIONAIS.map((r) => ({
    id: r.id as RegimeId,
    nome: r.nome,
    resumo: r.resumo,
    condicoes: r.quem,
    naReforma: {
      mantem: true,
      o_que_muda: r.naReforma,
      base: r.base,
      alerta: r.alerta,
    },
    tendencia: 'depende' as const,
    acao: r.decisao,
  })),
]

/* ══════════════════════════════════════════════════════════════════
 * DIMENSÃO 2 — ATIVIDADES COMERCIAIS
 * ══════════════════════════════════════════════════════════════════ */

export interface Atividade {
  id: string
  nome: string
  /** CNAEs que costumam estar nesta atividade (grupos, não lista exaustiva) */
  cnaeGrupos: string[]
  /** seções da CNAE 2.3 que pertencem a esta atividade */
  cnaeSecoes: string[]
  /** anexos da LC 214 mais tipicamente aplicáveis */
  anexosTipicos: string[]
  /** o que mais pesa na reforma para esta atividade */
  o_que_pesa: string
  /** cuidado específico */
  alerta: string
  /** NCMs/capítulos que costumam aparecer */
  capitulosTipicos: string[]
}

export const ATIVIDADES: Atividade[] = [
  {
    id: 'comercio',
    nome: 'Comércio (varejo e atacado)',
    cnaeGrupos: ['45', '46', '47'],
    cnaeSecoes: ['G'],
    anexosTipicos: [
      'Anexo I (cesta básica)',
      'Anexo VII (alimentos)',
      'Anexo XVII (Imposto Seletivo)',
    ],
    o_que_pesa:
      'O tratamento do produto é que define a carga. Vender arroz (zero) e refrigerante (IS) no ' +
      'mesmo caixa dá cargas completamente diferentes — a classificação por NCM é o que separa.',
    alerta:
      'Produto do Anexo I (cesta básica) tem alíquota zero, e o crédito da compra é anulado. Quem ' +
      'compra de fornecedor do regime regular e revende cesta básica precisa olhar o crédito com atenção.',
    capitulosTipicos: [
      '01-24 (alimentos)',
      '30 (farmacêuticos)',
      '33 (cosméticos)',
      '39 (plásticos)',
      '84-85 (eletrônicos)',
    ],
  },
  {
    id: 'industria',
    nome: 'Indústria e transformação',
    cnaeGrupos: [
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
    ],
    cnaeSecoes: ['B', 'C'],
    anexosTipicos: [
      'Anexo IX (insumos agropecuários)',
      'Anexo XII (bens de capital)',
      'Anexo IV e V (saúde/educação)',
    ],
    o_que_pesa:
      'É a atividade que mais ganha com a não cumulatividade plena: compra insumo com crédito e ' +
      'vende com débito, e o que se apura é a diferença. Indústria com cadeia longa tende a se beneficiar.',
    alerta:
      'O crédito depende do documento de entrada trazer NCM e cClassTrib corretos. Insumo comprado ' +
      'sem classificação adequada pode virar crédito não aproveitado — perda silenciosa.',
    capitulosTipicos: [
      '25-40 (química/plástico)',
      '72-83 (metais)',
      '84-85 (máquinas)',
      '87-89 (veículos)',
    ],
  },
  {
    id: 'servicos',
    nome: 'Serviços',
    cnaeGrupos: [
      '49',
      '50',
      '51',
      '52',
      '53',
      '55',
      '56',
      '58',
      '59',
      '60',
      '61',
      '62',
      '63',
      '68',
      '69',
      '70',
      '71',
      '72',
      '73',
      '74',
      '75',
      '77',
      '78',
      '79',
      '80',
      '81',
      '82',
      '85',
      '86',
      '87',
      '88',
      '90',
      '91',
      '92',
      '93',
      '95',
      '96',
    ],
    cnaeSecoes: ['H', 'I', 'J', 'L', 'M', 'N', 'P', 'Q', 'R', 'S'],
    anexosTipicos: [
      'Anexo III (profissões regulamentadas — 30%)',
      'Anexo IV (saúde)',
      'Anexo V (educação)',
    ],
    o_que_pesa:
      'Serviço tem pouca compra com crédito — o que mais pesa é a ALÍQUOTA sobre a receita. Por isso ' +
      'as reduções de 60% (saúde, educação) e de 30% (profissões) fazem diferença enorme aqui.',
    alerta:
      'A redução de 30% das profissões regulamentadas exige que a atividade esteja na lista do art. 127 ' +
      'e, para PJ, que cumpra os 5 requisitos. Não é automática.',
    capitulosTipicos: ['99 (serviços)', 'NBS — Nomenclatura Brasileira de Serviços'],
  },
  {
    id: 'alimentacao',
    nome: 'Alimentação (restaurantes, bares, food service)',
    cnaeGrupos: ['56'],
    cnaeSecoes: ['I'],
    anexosTipicos: [
      'Anexo I (cesta básica)',
      'Anexo VII (alimentos com redução 60%)',
      'Anexo XVII (IS — bebidas)',
    ],
    o_que_pesa:
      'A atividade compra INSUMO de alimentação (que tem tratamento próprio) e VENDE refeição ' +
      '(que é serviço). São duas naturezas no mesmo CNPJ, com cargas diferentes.',
    alerta:
      'A compra de insumo pode ter alíquota zero (cesta básica), mas isso ANULA o crédito. O ganho ' +
      'na compra pode virar perda na apuração — o cruzamento NCM × regime é obrigatório aqui.',
    capitulosTipicos: ['01-24 (alimentos e bebidas)', '22 (bebidas — IS)'],
  },
  {
    id: 'agro',
    nome: 'Agronegócio e produtor rural',
    cnaeGrupos: [
      '01',
      '02',
      '03',
      '05',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
    ],
    cnaeSecoes: ['A'],
    anexosTipicos: [
      'Anexo IX (insumos agropecuários)',
      'Anexo I (cesta básica)',
      'arts. 164-171 (produtor rural)',
    ],
    o_que_pesa:
      'O produtor rural integrado NUNCA é contribuinte, e o produtor rural tem regime próprio com ' +
      'limite de R$ 3,6 milhões. A soma societária conta para esse limite.',
    alerta:
      'O limite do produtor rural considera a SOMA das operações da pessoa física e das empresas ' +
      'do mesmo grupo (art. 164, §6º). Exceder muda o enquadramento no ano seguinte.',
    capitulosTipicos: ['01-24 (produtos agropecuários)', '31 (fertilizantes — Anexo IX)'],
  },
  {
    id: 'saude',
    nome: 'Saúde',
    cnaeGrupos: ['86', '87', '88'],
    cnaeSecoes: ['Q'],
    anexosTipicos: [
      'Anexo IV (dispositivos e medicamentos — zero)',
      'Anexo V (serviços de saúde — 60%)',
    ],
    o_que_pesa:
      'Redução de 60% nos serviços e alíquota zero em vários dispositivos médicos. É um dos setores ' +
      'mais beneficiados pela reforma — desde que a classificação esteja correta.',
    alerta:
      'A diferença entre um dispositivo de Anexo (zero) e um artigo plástico hospitalar comum ' +
      '(integral) está na subposição do NCM. É exatamente onde o casamento por posição erra.',
    capitulosTipicos: [
      '30 (farmacêuticos)',
      '39 (plásticos hospitalares)',
      '90 (instrumentos médicos)',
    ],
  },
  {
    id: 'construcao',
    nome: 'Construção civil e imobiliário',
    cnaeGrupos: ['41', '42', '43', '68'],
    cnaeSecoes: ['F', 'L'],
    anexosTipicos: [
      'arts. 252-261 (imobiliário)',
      'arts. 485-488 (RET)',
      'Anexo XII (bens de capital)',
    ],
    o_que_pesa:
      'Venda de imóvel tem redução de 50% com redutores (R$ 100 mil novo / custo+IPCA usado / R$ 30 mil ' +
      'lote); locação tem redução de 70% com redutor de R$ 600/mês.',
    alerta:
      'O redutor é sobre o VALOR, não sobre a alíquota. Confundir os dois inverte o resultado em ' +
      'operações de alto valor — é o erro mais comum neste setor.',
    capitulosTipicos: ['25, 68-70 (materiais)', 'não se aplica NCM ao serviço/imóvel'],
  },
  {
    id: 'financeiro',
    nome: 'Instituições financeiras e seguros',
    cnaeGrupos: ['64', '65', '66'],
    cnaeSecoes: ['K'],
    anexosTipicos: ['arts. 182-214 (regime financeiro)', 'Anexo XVI (crédito presumido)'],
    o_que_pesa:
      'Regime específico: alíquota reduzida em alguns produtos, base própria em outros. A receita ' +
      'de juros tem tratamento diferente da tarifa.',
    alerta:
      'A base do IBS/CBS no empréstimo é o TOTAL PAGO menos o principal — não é o juro pelo nome. ' +
      'Calcular pelo juro nominal subestima a carga.',
    capitulosTipicos: ['não há NCM para operação financeira — regime por tipo de receita'],
  },
  {
    id: 'tecnologia',
    nome: 'Tecnologia e serviços digitais',
    cnaeGrupos: ['62', '63'],
    cnaeSecoes: ['J'],
    anexosTipicos: ['Anexo III (profissões — 30%)', 'regime de plataformas (art. 22)'],
    o_que_pesa:
      'Software é serviço: pesa a alíquota sobre a receita. Se houver licenciamento de produto, ' +
      'parte pode ser tratada como bem — e aí o NCM entra.',
    alerta:
      'Plataforma digital tem responsabilidade solidária pelo IBS/CBS dos vendedores que intermedeia ' +
      '(art. 22, §7º). Quem opera marketplace assume risco do vendedor.',
    capitulosTipicos: ['84-85 (equipamentos)', '99/NBS (serviços digitais)'],
  },
]

/* ══════════════════════════════════════════════════════════════════
 * DIMENSÃO 3 — O CRUZAMENTO
 * ══════════════════════════════════════════════════════════════════ */

export interface Cruzamento {
  regime: RegimeId
  atividade: string
  /** quantos fatores apontam para cada direção */
  peso: 'favoravel' | 'desfavoravel' | 'misto'
  /** o que olhar primeiro */
  prioridade: string
  /** os fatores concretos, um por linha */
  fatores: string[]
}

/**
 * CRUZA REGIME × ATIVIDADE.
 *
 * Não devolve "melhor regime" — devolve **quais fatores pesam e em que direção**.
 * A diferença é a diferença entre uma tabela de consulta e uma promessa.
 */
export function cruzar(regimeId: RegimeId, atividadeId: string): Cruzamento | null {
  const r = REGIMES.find((x) => x.id === regimeId)
  const a = ATIVIDADES.find((x) => x.id === atividadeId)
  if (!r || !a) return null

  const fatores: string[] = []
  let favor = 0
  let contra = 0

  /* ══ REGIMES NOVOS (05/11/2026): cada um pesa por um motivo diferente ══ */
  if (regimeId === 'simples_hibrido') {
    favor++
    fatores.push(
      'Híbrido: mantém o DAS para os tributos da LC 123 e apura IBS/CBS pelo regime regular, ' +
        'com crédito AMPLO — o crédito que o Simples puro não permite (art. 41, §9º, I).',
    )
    if (a.id === 'servicos' || a.id === 'tecnologia') {
      contra++
      fatores.push(
        'Em serviço com pouca compra, o crédito amplo rende pouco: o que pesa é a alíquota sobre ' +
          'a receita, e o híbrido não a reduz.',
      )
    }
    if (a.id === 'comercio' || a.id === 'industria' || a.id === 'alimentacao') {
      favor++
      fatores.push(
        'Atividade com cadeia de compra relevante: o crédito amplo tende a compensar a saída do DAS.',
      )
    }
    fatores.push(
      'ATENÇÃO: se houve ressarcimento de crédito no ano corrente ou anterior, a volta ao Simples ' +
        'puro fica vedada (art. 41, §5º) — a escolha deixa de ser reversível.',
    )
  }

  if (regimeId === 'isenta') {
    contra++
    fatores.push(
      'Isenção ANULA o crédito das operações anteriores, na proporção das receitas isentas ' +
        '(art. 51 e §1º) — o efeito líquido pode ser pior que tributar.',
    )
    if (a.id === 'agro') {
      fatores.push(
        'No agro, parte da receita tem alíquota zero (não isenção) — as duas coisas têm efeito ' +
          'diferente no crédito e não devem ser somadas.',
      )
    }
  }

  if (regimeId === 'imune') {
    contra++
    fatores.push(
      'A imunidade alcança o que a entidade FORNECE, não o que ela COMPRA (art. 9º, §4º): ' +
        'igreja, partido e escola pagam IBS/CBS nas aquisições.',
    )
    fatores.push(
      'Documento fiscal é obrigatório mesmo para imune (art. 60, §2º, I) — sem ele, o fornecedor ' +
        'perde o crédito dele.',
    )
    if (a.id === 'saude' || a.id === 'servicos') {
      favor++
      fatores.push(
        'Atividade típica de entidade sem fins lucrativos (educação, assistência social, saúde): ' +
          'verificar se cumpre o art. 14 do CTN, exigido pelo art. 9º, III.',
      )
    }
  }

  if (regimeId === 'rural_pf' || regimeId === 'rural_pj') {
    favor++
    fatores.push(
      'Produtor rural (PF ou PJ — o art. 164 não distingue) abaixo de R$ 3,6 mi NÃO é contribuinte: ' +
        'não destaca IBS/CBS na venda.',
    )
    contra++
    fatores.push(
      'Não sendo contribuinte, o comprador PJ depende de crédito presumido — se o cliente vende ' +
        'para indústria, isso vira desvantagem comercial.',
    )
    fatores.push(
      'O limite é a SOMA das operações da PF e das PJ do mesmo grupo (art. 164, §6º): abrir empresa ' +
        'sem planejar pode estourar o teto.',
    )
    if (regimeId === 'rural_pj') {
      fatores.push(
        'PJ rural que também industrializa ou comercializa precisa SEGREGAR a receita: só a parte ' +
          'rural entra no limite de R$ 3,6 mi.',
      )
    }
  }

  if (regimeId === 'rural_integrado') {
    favor++
    fatores.push(
      'Integrado NUNCA é contribuinte, qualquer que seja a receita (art. 164, caput e §1º).',
    )
    fatores.push(
      'Exige CONTRATO de integração vertical: sem contrato formal, o enquadramento volta a ser de ' +
        'produtor rural comum, com o limite de R$ 3,6 mi.',
    )
  }

  if (regimeId === 'cooperativa') {
    favor++
    fatores.push(
      'Operações entre associado e cooperativa podem ter alíquota ZERO (art. 271) — nas demais, ' +
        'aplica-se o regime regular.',
    )
    contra++
    fatores.push(
      'Misturar operação com associado e com terceiro na mesma conta erra o resultado: só a ' +
        'primeira tem alíquota zero.',
    )
  }

  /* 1. o regime mantém vantagem na reforma? */
  if (r.tendencia === 'mantem-vantagem') {
    favor++
    fatores.push(`${r.nome}: o desenho da reforma é próximo deste regime (crédito amplo).`)
  } else if (r.tendencia === 'perde-vantagem') {
    contra++
    fatores.push(
      `${r.nome}: o crédito transferido passa a ser reduzido, o que pesa em venda para PJ.`,
    )
  } else {
    fatores.push(`${r.nome}: a vantagem depende de para quem o cliente vende.`)
  }

  /* 2. a atividade depende de crédito de insumo? */
  if (a.id === 'industria' || a.id === 'comercio') {
    favor++
    fatores.push(
      `${a.nome}: compra com crédito e vende com débito — a não cumulatividade trabalha a favor.`,
    )
  }
  if (a.id === 'servicos' || a.id === 'tecnologia') {
    fatores.push(
      `${a.nome}: pouca compra com crédito, então o que pesa é a alíquota sobre a receita.`,
    )
    if (regimeId === 'simples') {
      contra++
      fatores.push(
        'Simples em serviço: a redução de 30% das profissões exige enquadramento e requisitos.',
      )
    }
  }
  if (a.id === 'alimentacao') {
    fatores.push(
      'Alimentação compra insumo com tratamento próprio e vende serviço — duas naturezas no mesmo CNPJ.',
    )
    contra++
    fatores.push(
      'Cesta básica dá alíquota zero na compra, mas ANULA o crédito: o ganho vira perda na apuração.',
    )
  }
  if (a.id === 'agro') {
    favor++
    fatores.push(
      'Agro tem Anexo IX (insumo) e regime próprio de produtor rural com limite de R$ 3,6 mi.',
    )
  }
  if (a.id === 'saude') {
    favor++
    fatores.push(
      'Saúde é um dos setores mais beneficiados: 60% em serviço e zero em vários dispositivos.',
    )
  }
  if (a.id === 'construcao') {
    fatores.push(
      'Construção tem redução de 50% com redutor em VALOR (não em alíquota) — confundir inverte o resultado.',
    )
  }
  if (a.id === 'financeiro') {
    favor++
    fatores.push('Financeiro tem regime específico com alíquota reduzida em parte da receita.')
  }

  const peso: Cruzamento['peso'] =
    favor > contra ? 'favoravel' : contra > favor ? 'desfavoravel' : 'misto'

  const prioridade =
    regimeId === 'simples_hibrido'
      ? 'Simular DAS integral × (DAS sem IBS/CBS + regime regular): o híbrido ganha quando o cliente vende a PJ que se credita.'
      : regimeId === 'isenta' || regimeId === 'imune'
        ? 'Calcular o estorno de crédito (art. 51) ANTES de considerar a isenção uma vantagem.'
        : regimeId === 'rural_pf' || regimeId === 'rural_pj'
          ? 'Somar toda a receita rural do grupo (art. 164, §6º) e projetar o ponto em que virar contribuinte compensa.'
          : a.id === 'alimentacao'
            ? 'Cruzar NCM dos insumos com o regime: a cesta básica pode estar anulando crédito.'
            : a.id === 'servicos' || a.id === 'tecnologia'
              ? 'Verificar se a atividade está no art. 127 (redução de 30%) e se cumpre os requisitos.'
              : a.id === 'industria'
                ? 'Conferir se toda entrada tem NCM e cClassTrib — crédito sem classificação é crédito perdido.'
                : a.id === 'saude'
                  ? 'Conferir a subposição de cada dispositivo: zero e integral estão a poucos dígitos de distância.'
                  : r.tendencia === 'perde-vantagem'
                    ? 'Simular a migração de regime sobre a base real importada.'
                    : 'Cruzar o tratamento dos NCMs vendidos com a carga do regime atual.'

  return { regime: regimeId, atividade: atividadeId, peso, prioridade, fatores }
}

/** Todas as combinações relevantes, para a tela listar. */
export function matrizCruzamento(): Cruzamento[] {
  const out: Cruzamento[] = []
  for (const r of REGIMES) {
    for (const a of ATIVIDADES) {
      const c = cruzar(r.id, a.id)
      if (c) out.push(c)
    }
  }
  return out
}

/** Aviso que acompanha qualquer leitura desta tabela. */
export const RESSALVA_ENQUADRAMENTO =
  'Esta tabela mostra FATORES, não veredito. A escolha do regime depende de folha de pagamento, ' +
  'margem real, crédito acumulado, benefício estadual e planejamento societário — nada disso está ' +
  'aqui. Use como roteiro de conferência, não como recomendação.'
