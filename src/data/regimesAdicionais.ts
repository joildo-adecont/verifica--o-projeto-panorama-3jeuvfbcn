/**
 * REGIMES ADICIONAIS — os que faltavam no enquadramento
 * ======================================================
 * Pedido do CEO (05/11/2026): "inclua no Regime Simples Híbrido, Isentas, Imunes,
 * produtor rural PF e produtor rural PJ e pesquise se temos mais regimes a
 * classificar."
 *
 * ── O QUE ESTE ARQUIVO ACRESCENTA ──
 * O enquadramento tinha 4 regimes (MEI, Simples, Presumido, Real). Faltavam os
 * que a LC 214 trata como SUJEITO, e não só como alíquota:
 *
 *   1. SIMPLES HÍBRIDO — o optante do Simples que apura IBS/CBS pelo regime
 *      regular. Está no art. 41, §3º — e não é "um Simples melhorado": é o
 *      Simples em tudo, MENOS no IBS/CBS.
 *   2. ISENTAS — quem tem isenção. Ponto crítico: isenção ANULA o crédito das
 *      operações anteriores (art. 51).
 *   3. IMUNES — quem tem imunidade constitucional (art. 9º). Mesmo efeito sobre
 *      o crédito, com rol próprio na Constituição e na lei.
 *   4. PRODUTOR RURAL PF — não contribuinte até R$ 3,6 mi (art. 164).
 *   5. PRODUTOR RURAL PJ — MESMA regra: o art. 164 diz "pessoa física ou
 *      jurídica". O limite e o tratamento são iguais; o que muda é a operação
 *      societária e a soma do §6º.
 *   6. PRODUTOR RURAL INTEGRADO — nunca contribuinte, qualquer receita.
 *   7. COOPERATIVA — regime específico com alíquota zero em parte das operações
 *      (art. 271).
 *
 * ── O QUE A PESQUISA ACHOU ALÉM DISSO ──
 * Regimes específicos da LC 214 que o sistema ainda não classifica como regime:
 *   · Combustíveis (arts. 174-181) — alíquota uniforme por unidade de medida
 *   · Serviços financeiros (arts. 182-214) — base e alíquotas próprias
 *   · Planos de assistência à saúde (arts. 234-241)
 *   · Serviços de apostas e prognósticos (arts. 242-250)
 *   · Missões diplomáticas e repartições consulares (art. 251)
 *   · Zona Franca de Manaus e áreas de livre comércio (arts. 439-461)
 *   · Regimes aduaneiros especiais (arts. 262-306) e bens de capital (307-320)
 *   · Repetro (arts. 380 e ss.) e REPORTO
 *   · Regime automotivo (art. 320 e ss.)
 *
 * ── POR QUE NEM TODOS VIRAM LINHA NA TABELA ──
 * Regime aduaneiro especial não é "opção do contribuinte" — é condição da
 * operação. Colocá-lo ao lado de Simples e Lucro Real misturaria natureza
 * diferentes na mesma escolha, e o cruzamento perderia sentido. Ficam em
 * ESPECIFICOS, que é uma lista separada e declarada como tal.
 *
 * FONTE: LC 214/2025, texto integral do Senado Federal (653 mil caracteres),
 * conferido artigo por artigo nos pontos citados.
 */

export type RegimeIdNovo =
  | 'simples_hibrido'
  | 'isenta'
  | 'imune'
  | 'rural_pf'
  | 'rural_pj'
  | 'rural_integrado'
  | 'cooperativa'

export interface RegimeAdicional {
  id: RegimeIdNovo
  nome: string
  /** o que é, em uma frase */
  resumo: string
  /** quem se enquadra */
  quem: string[]
  /** base legal verificada no texto da lei */
  base: string
  /** como a reforma trata */
  naReforma: string
  /** o ponto que mais erra na prática */
  alerta: string
  /** efeito no crédito — é o que separa isenção de regime normal */
  credito: string
  /** a decisão que o cliente precisa tomar */
  decisao: string
}

export const REGIMES_ADICIONAIS: RegimeAdicional[] = [
  /* ══════════════ SIMPLES HÍBRIDO ══════════════ */
  {
    id: 'simples_hibrido',
    nome: 'Simples Nacional — opção pelo regime regular do IBS/CBS (híbrido)',
    resumo:
      'O contribuinte continua no Simples para os tributos da LC 123, mas apura e recolhe IBS e CBS ' +
      'pelo regime regular, com crédito amplo.',
    quem: [
      'Optante do Simples Nacional, em dia com as obrigações',
      'Qualquer faixa de faturamento dentro do limite do Simples (R$ 4,8 mi)',
      'Não pode ter recebido ressarcimento de créditos de IBS/CBS no ano corrente ou anterior',
    ],
    base: 'LC 214/2025, art. 41, §3º a §6º (a opção é exercida nos termos da LC 123/2006)',
    naReforma:
      'O ISS, ICMS, IRPJ, CSLL, PIS e COFINS continuam no DAS. IBS e CBS saem do DAS e passam a ser ' +
      'apurados por fora, com débito nas saídas e crédito nas entradas — como no regime regular.',
    alerta:
      'É uma escolha IRREVERSÍVEL no ano se houve ressarcimento de crédito (art. 41, §5º). E o ' +
      'híbrido não é "melhor" por definição: ele aumenta o crédito transferido ao comprador, mas ' +
      'obriga a escrituração completa e pode aumentar a carga em atividade com pouca compra.',
    credito:
      'Crédito AMPLO de IBS/CBS (diferente do Simples puro, que não permite apropriação — art. 41, ' +
      '§9º, I). É exatamente aqui que está o ganho para quem vende a PJ.',
    decisao:
      'Comparar: (a) DAS integral × (b) DAS sem IBS/CBS + regime regular de IBS/CBS. O híbrido ganha ' +
      'quando o cliente vende para PJ que se credita e tem cadeia de compra com IBS/CBS destacado.',
  },

  /* ══════════════ ISENTAS ══════════════ */
  {
    id: 'isenta',
    nome: 'Operações isentas',
    resumo:
      'A lei dispensa o pagamento do tributo em hipóteses específicas. Diferente de alíquota zero, a ' +
      'isenção pressupõe uma operação que SERIA tributada.',
    quem: [
      'Qualquer contribuinte, em operação prevista em lei como isenta',
      'Não confundir com alíquota zero (que é técnica de tributação, não dispensa)',
    ],
    base: 'LC 214/2025, art. 51 (efeito da isenção sobre créditos) e hipóteses esparsas na lei',
    naReforma:
      'A isenção não gera débito, mas também não gera crédito ao comprador. E o efeito mais grave: ' +
      'ANULA os créditos das operações anteriores, na proporção das operações isentas.',
    alerta:
      'O art. 51 é o dispositivo que mais surpreende: quem tem isenção precisa ESTORNAR crédito ' +
      'proporcional. Empresa com 40% de receita isenta perde 40% do crédito das compras — o que ' +
      'pode tornar a isenção pior que a tributação.',
    credito: 'ANULA o crédito proporcionalmente (art. 51 e §1º). Isenção não é ganho automático.',
    decisao:
      'Calcular o estorno de crédito antes de comemorar a isenção. Em cadeia longa, abrir mão da ' +
      'isenção e pagar o tributo pode ser melhor — porque mantém o crédito.',
  },

  /* ══════════════ IMUNES ══════════════ */
  {
    id: 'imune',
    nome: 'Entidades e operações imunes',
    resumo:
      'Imunidade é vedação constitucional de tributar. Não depende de lei ordinária e não pode ser ' +
      'revogada por norma infraconstitucional.',
    quem: [
      'União, Estados, DF e Municípios nas finalidades essenciais (art. 9º, I)',
      'Entidades religiosas e templos de qualquer culto (art. 9º, II)',
      'Partidos, sindicatos, instituições de educação e assistência social sem fins lucrativos (art. 9º, III)',
      'Livros, jornais, periódicos; fonogramas de autores brasileiros; radiodifusão gratuita; ouro como ativo financeiro (art. 9º, IV a VII)',
    ],
    base: 'LC 214/2025, art. 9º (rol das imunidades); CF art. 150, VI',
    naReforma:
      'Não há incidência sobre as operações imunes. Mas o art. 9º, §4º é expresso: a imunidade dos ' +
      'incisos I a III NÃO alcança as AQUISIÇÕES de bens e serviços.',
    alerta:
      'A pegadinha clássica: a igreja é imune no que FORNECE, mas paga IBS/CBS no que COMPRA. E o ' +
      'documento fiscal é obrigatório mesmo para imune (art. 60, §2º, I).',
    credito:
      'Anula o crédito em regra (art. 51). Exceções: exportação (art. 79), livros e periódicos e ' +
      'radiodifusão (art. 51, §2º, II).',
    decisao:
      'Separar o que é imune do que é tributado dentro da mesma entidade. Entidade mista (culto + ' +
      'cantina, por exemplo) precisa segregar receita — senão perde a imunidade no todo.',
  },

  /* ══════════════ PRODUTOR RURAL PF ══════════════ */
  {
    id: 'rural_pf',
    nome: 'Produtor rural — pessoa física',
    resumo:
      'Não é contribuinte do IBS/CBS enquanto a receita anual ficar abaixo de R$ 3,6 milhões.',
    quem: [
      'Pessoa física que exerce atividade rural',
      'Receita inferior a R$ 3.600.000,00 no ano-calendário',
    ],
    base: 'LC 214/2025, art. 164, caput',
    naReforma:
      'Não sendo contribuinte, não destaca IBS/CBS na venda e não toma crédito na compra. Ao ' +
      'ultrapassar o limite no ano, passa a contribuinte a partir do mês seguinte ao do excesso.',
    alerta:
      'O limite considera a SOMA das operações da pessoa física e das pessoas jurídicas em que ela ' +
      'participa (art. 164, §6º). Produtor que abre uma PJ e continua faturando como PF pode ' +
      'estourar o limite sem perceber.',
    credito:
      'Não toma crédito (não é contribuinte), mas o ADQUIRENTE pode ter crédito presumido em ' +
      'operações com produtor rural não contribuinte.',
    decisao:
      'Simular o ponto de virada: em algum volume de venda a PJ, virar contribuinte compensa, ' +
      'porque o comprador passa a ter crédito e paga melhor.',
  },

  /* ══════════════ PRODUTOR RURAL PJ ══════════════ */
  {
    id: 'rural_pj',
    nome: 'Produtor rural — pessoa jurídica',
    resumo:
      'A MESMA regra da pessoa física: o art. 164 diz expressamente "pessoa física ou jurídica". ' +
      'Abaixo de R$ 3,6 mi, também não é contribuinte.',
    quem: [
      'Pessoa jurídica que exerce atividade rural',
      'Receita inferior a R$ 3.600.000,00 no ano-calendário',
    ],
    base: 'LC 214/2025, art. 164, caput ("produtor rural pessoa física ou jurídica")',
    naReforma:
      'Idêntica à PF: não contribuinte até o limite; ao exceder, contribuinte a partir do mês ' +
      'seguinte. A partir de então, apura pelo regime regular (ou pelo Simples, se optante).',
    alerta:
      'Muita gente supõe que PJ rural é sempre contribuinte — o art. 164 não distingue. Mas a PJ ' +
      'que também industrializa ou comercializa pode ter receita FORA da atividade rural, e essa ' +
      'parte não entra no limite: precisa segregar.',
    credito:
      'Igual à PF enquanto não contribuinte. Como contribuinte, tem crédito normal e transfere ' +
      'crédito ao comprador — o que muda a negociação.',
    decisao:
      'Definir se vale manter abaixo do limite ou virar contribuinte. Virar contribuinte aumenta o ' +
      'crédito do comprador e pode viabilizar preço melhor na venda para indústria.',
  },

  /* ══════════════ PRODUTOR RURAL INTEGRADO ══════════════ */
  {
    id: 'rural_integrado',
    nome: 'Produtor rural integrado',
    resumo:
      'Quem produz vinculado a um integrador por contrato de integração vertical. É SEMPRE não ' +
      'contribuinte, independentemente da receita.',
    quem: [
      'Produtor agrossilvipastoril, PF ou PJ, individual ou associativo',
      'Vinculado ao integrador por contrato de integração vertical',
      'Recebe bens ou serviços do integrador e fornece matéria-prima ou bem para ele',
    ],
    base: 'LC 214/2025, art. 164, §1º',
    naReforma:
      'Nunca é contribuinte — o limite de R$ 3,6 mi não se aplica a ele. A cadeia de integração ' +
      'tem tratamento próprio, e o integrador assume a apuração na ponta.',
    alerta:
      'A definição do §1º é restritiva: exige CONTRATO de integração vertical. Produtor que ' +
      'simplesmente vende sempre para a mesma agroindústria, sem contrato formal, não é integrado ' +
      '— e aí volta a valer o limite.',
    credito: 'Não contribuinte. O crédito aparece na cadeia pelo integrador, conforme o contrato.',
    decisao:
      'Confirmar se há contrato formal de integração. Sem contrato, o enquadramento é de produtor ' +
      'rural comum e o limite de R$ 3,6 mi se aplica.',
  },

  /* ══════════════ COOPERATIVA ══════════════ */
  {
    id: 'cooperativa',
    nome: 'Sociedades cooperativas — regime específico',
    resumo:
      'Podem optar por regime em que ficam reduzidas a zero as alíquotas nas operações entre o ' +
      'associado e a cooperativa.',
    quem: [
      'Sociedades cooperativas regularmente constituídas',
      'Que exerçam a opção pelo regime específico do art. 271',
    ],
    base: 'LC 214/2025, art. 271 (opção e hipóteses de alíquota zero) e art. 272',
    naReforma:
      'Na operação em que o associado entrega à cooperativa e na que a cooperativa devolve ao ' +
      'associado, a alíquota pode ser zero. Fora dessas hipóteses, aplica-se o regime regular.',
    alerta:
      'A opção é do conjunto: cooperativa que opta precisa cumprir as condições em TODAS as ' +
      'operações alcançadas. E o associado que opera com redução tem regra própria no art. 272.',
    credito:
      'Depende da operação: as de alíquota zero não geram crédito; as demais seguem o regime regular.',
    decisao:
      'Mapear quais operações são entre associado e cooperativa e quais são com terceiros. Só as ' +
      'primeiras têm alíquota zero — misturar as duas na mesma conta erra o resultado.',
  },
]

/* ══════════════════════════════════════════════════════════════════
 * REGIMES ESPECÍFICOS — listados, mas NÃO como opção do contribuinte
 * ══════════════════════════════════════════════════════════════════ */

export interface RegimeEspecifico {
  nome: string
  base: string
  o_que_e: string
  /** por que não entra na escolha de regime */
  por_que_separado: string
}

export const REGIMES_ESPECIFICOS: RegimeEspecifico[] = [
  {
    nome: 'Combustíveis',
    base: 'LC 214/2025, arts. 174 a 181',
    o_que_e:
      'Alíquota uniforme em todo o País, por unidade de medida (litro, kg), cobrada na refinaria.',
    por_que_separado: 'Não é escolha: é o desenho obrigatório da cadeia de combustíveis.',
  },
  {
    nome: 'Serviços financeiros',
    base: 'LC 214/2025, arts. 182 a 214',
    o_que_e:
      'Base e alíquotas próprias para banco, seguro, consórcio, arranjo de pagamento, factoring e ' +
      'securitização.',
    por_que_separado:
      'Depende da natureza da receita, não de opção — e o contribuinte é supervisionado.',
  },
  {
    nome: 'Planos de assistência à saúde',
    base: 'LC 214/2025, arts. 234 a 241',
    o_que_e: 'Regime específico para operadoras e para a intermediação de planos.',
    por_que_separado:
      'Setor regulado pela ANS, com base própria; não é alternativa de enquadramento.',
  },
  {
    nome: 'Apostas e prognósticos',
    base: 'LC 214/2025, arts. 242 a 250',
    o_que_e: 'Incidência sobre a receita da exploração de apostas, com regra própria.',
    por_que_separado: 'Atividade específica; a tributação independe do regime geral escolhido.',
  },
  {
    nome: 'Missões diplomáticas e repartições consulares',
    base: 'LC 214/2025, art. 251',
    o_que_e: 'Tratamento próprio nas aquisições de missões estrangeiras no Brasil.',
    por_que_separado: 'Alcança o adquirente por condição subjetiva, não por regime de apuração.',
  },
  {
    nome: 'Zona Franca de Manaus e áreas de livre comércio',
    base: 'LC 214/2025, arts. 439 a 461 (ZFM 439-457; ALC 458-461)',
    o_que_e: 'Regime territorial com manutenção de benefícios e regras próprias de crédito.',
    por_que_separado: 'Depende da LOCALIZAÇÃO, não de opção — e combina com qualquer regime.',
  },
  {
    nome: 'Regimes aduaneiros especiais',
    base: 'LC 214/2025, arts. 262 a 306',
    o_que_e: 'Trânsito, depósito, permanência temporária, aperfeiçoamento e bagagem.',
    por_que_separado:
      'Suspensão condicionada à operação de comércio exterior, não ao contribuinte.',
  },
  {
    nome: 'Repetro e REPORTO',
    base: 'LC 214/2025, arts. 380 e seguintes',
    o_que_e: 'Regime de bens e serviços para exploração de petróleo, gás e navios.',
    por_que_separado: 'Vinculado à destinação do bem, em cadeia específica de fornecimento.',
  },
  {
    nome: 'Regime automotivo',
    base: 'LC 214/2025, arts. 320 e seguintes',
    o_que_e: 'Tratamento específico para a cadeia automotiva e seus incentivos.',
    por_que_separado: 'Setor com regra própria de crédito, não é alternativa de apuração.',
  },
  {
    nome: 'Bens de capital',
    base: 'LC 214/2025, arts. 307 a 320',
    o_que_e: 'Regime de aquisição de bens de capital com desoneração e regras de crédito próprias.',
    por_que_separado: 'Depende do BEM adquirido (NCM), não da opção de regime do adquirente.',
  },
]

/** Aviso que acompanha a leitura dos regimes adicionais. */
export const RESSALVA_REGIMES =
  'Os regimes adicionais descrevem o tratamento da lei, não uma recomendação. Isenção e imunidade ' +
  'parecem vantagem e frequentemente não são: o art. 51 anula o crédito proporcional, e o efeito ' +
  'líquido pode ser pior que tributar. A decisão exige simulação com a cadeia real.'
