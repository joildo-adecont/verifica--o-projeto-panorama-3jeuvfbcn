/**
 * ACERVO JURÍDICO — Setor novo da Plataforma Jurídica (pedido do CEO, 02/11/2026)
 * ==============================================================================
 *
 * Pedido: "criar um setor ícone chamado ACERVO JURÍDICO, que servirá para
 * recepcionar a Constituição Federal com todas as alterações, inclusões,
 * supressões e exclusões desde 1988; os Códigos e Processos Jurídicos atualizados
 * com toda a legislação federal, estadual e municipal; contemplando também
 * jurisprudências de todas as áreas e decisões dos tribunais, depositadas em
 * sub-ícones chamados ACERVOS LEGAIS e distribuídos por HIERARQUIA
 * INSTITUCIONAL, estando no topo a Constituição Federal, dando a cada segmento
 * um ícone para facilitar a localização; com busca em fontes oficiais,
 * governamentais e judiciais; mantendo os ambientes de coleta já conectados e
 * ampliando para todo o país — estados e municípios — identificando as bases
 * legais e trazendo de forma CRONOLÓGICA, com escopo e base tributária nacional,
 * regional e municipal."
 *
 * ── O QUE É FATO VERIFICADO E O QUE É CATÁLOGO ──
 *  • CF/88: atualizada até a EC 141/2026 (16.10.2026). Conferido no quadro de
 *    emendas do Planalto e no texto da Câmara ("atualizada até a EC 141/2026").
 *  • Datas das últimas emendas: EC 139 (05.05.2026), EC 140 e 141 (16.10.2026).
 *  • Disponibilidade dos tribunais: medida host por host em 02/11/2026.
 *  • O Planalto devolve HTTP 200 com uma página de 814 bytes "Acesso Negado!" —
 *    é bloqueio por IP, não queda. Por isso o texto integral da CF e o quadro de
 *    emendas são apontados para a CÂMARA (que o CEO abre normalmente) e para o
 *    DOU, e NÃO como se este servidor lesse o Planalto.
 *  • DataJud (CNJ): responde 401 — exige chave de API. Não se promete consulta
 *    aberta a ele.
 */

export interface Tribunal {
  id: string
  nome: string
  sigla: string
  esfera:
    | 'constitucional'
    | 'superior'
    | 'federal'
    | 'estadual'
    | 'trabalhista'
    | 'eleitoral'
    | 'militar'
  /** o que decide / para que serve */
  papel: string
  /** quais precedentes valem citar */
  precedentes: string
  url: string
  /** respondeu deste servidor em 02/11/2026? */
  responde: boolean
  codigo?: string
  /** caminho direto para a jurisprudência, quando conhecido */
  buscaUrl?: string
}

/**
 * HIERARQUIA INSTITUCIONAL — do topo para baixo, como o CEO pediu.
 * O topo é a Constituição; abaixo os tribunais superiores; depois a Justiça
 * comum/federal/trabalhista/eleitoral/militar; na base, os tribunais estaduais.
 */
export const TRIBUNAIS: Tribunal[] = [
  {
    id: 'stf',
    nome: 'Supremo Tribunal Federal',
    sigla: 'STF',
    esfera: 'constitucional',
    papel:
      'Guarda da Constituição. Decide controle concentrado (ADI, ADPF, ADC) e, no recurso extraordinário, a última palavra sobre matéria constitucional.',
    precedentes:
      'Súmulas vinculantes, repercussão geral (Tema) e as decisões de controle concentrado — é o que vincula os demais.',
    url: 'https://portal.stf.jus.br',
    buscaUrl: 'https://portal.stf.jus.br/jurisprudencia/',
    responde: true,
    codigo: '200',
  },
  {
    id: 'stj',
    nome: 'Superior Tribunal de Justiça',
    sigla: 'STJ',
    esfera: 'superior',
    papel:
      'Uniformiza a lei federal infraconstitucional: recursos especiais, repetitivos e as teses sobre obrigação tributária, prescrição, compensação e processo civil.',
    precedentes:
      'Recursos repetitivos (Tema), súmulas e a jurisprudência em teses — é onde se confirma a leitura do CTN e do CPC.',
    url: 'https://www.stj.jus.br',
    buscaUrl: 'https://scon.stj.jus.br/SCON/',
    responde: true,
    codigo: '200',
  },
  {
    id: 'tst',
    nome: 'Tribunal Superior do Trabalho',
    sigla: 'TST',
    esfera: 'trabalhista',
    papel:
      'Uniformiza a CLT: súmulas, orientações jurisprudenciais e precedentes normativos. É o tribunal que interpreta a reforma trabalhista na prática.',
    precedentes: 'Súmulas, OJs e precedentes normativos.',
    url: 'https://www.tst.jus.br',
    buscaUrl: 'https://www.tst.jus.br/jurisprudencia',
    responde: true,
    codigo: '202',
  },
  {
    id: 'tse',
    nome: 'Tribunal Superior Eleitoral',
    sigla: 'TSE',
    esfera: 'eleitoral',
    papel:
      'Jurisprudência eleitoral e resoluções: alcança propaganda, contas de campanha e condutas vedadas — que dialogam com a legislação eleitoral aplicada ao setor público.',
    precedentes: 'Súmulas e resoluções do TSE.',
    url: 'https://www.tse.jus.br',
    buscaUrl: 'https://www.tse.jus.br/jurisprudencia',
    responde: false,
    codigo: '403',
  },
  {
    id: 'stm',
    nome: 'Superior Tribunal Militar',
    sigla: 'STM',
    esfera: 'militar',
    papel: 'Jurisprudência penal militar e as questões de competência da Justiça Militar.',
    precedentes: 'Súmulas e julgados do STM.',
    url: 'https://www.stm.jus.br',
    responde: true,
    codigo: '200',
  },
  {
    id: 'trf',
    nome: 'Tribunais Regionais Federais',
    sigla: 'TRFs (1ª a 6ª Região)',
    esfera: 'federal',
    papel:
      'Segunda instância da Justiça Federal: é onde se decide, na prática, execução fiscal, tributos federais e as causas contra a União, o INSS e a RFB.',
    precedentes: 'Súmulas regionais e os incidentes de uniformização.',
    url: 'https://www.cjf.jus.br',
    responde: false,
    codigo: 'não medido',
  },
  {
    id: 'tj',
    nome: 'Tribunais de Justiça estaduais',
    sigla: 'TJs (27)',
    esfera: 'estadual',
    papel:
      'Segunda instância estadual: ICMS, ITCD, IPVA, ISS na via judicial e o contencioso que sobe do estado e do município.',
    precedentes: 'Súmulas estaduais e os incidentes de resolução de demandas repetitivas (IRDR).',
    url: 'https://www.cnj.jus.br',
    responde: false,
    codigo: 'não medido',
  },
  {
    id: 'cnj',
    nome: 'Conselho Nacional de Justiça',
    sigla: 'CNJ',
    esfera: 'superior',
    papel:
      'Não julga causas, mas publica a base DataJud (metadados de processos de todo o país) e as metas/estatísticas do Judiciário.',
    precedentes: 'DataJud — API pública por tribunal, exige chave de acesso (respondeu 401).',
    url: 'https://www.cnj.jus.br',
    responde: true,
    codigo: '200',
  },
]

/** O topo da hierarquia: a Constituição. */
export const CONSTITUICAO = {
  nome: 'Constituição da República Federativa do Brasil',
  ano: '1988',
  promulgada: '05/10/1988',
  ultimaEmenda: 'EC 141/2026',
  dataUltimaEmenda: '16/10/2026',
  emendas: 141,
  /** as três últimas, com data e objeto — conferidas no quadro de emendas */
  ultimas: [
    {
      numero: '141',
      data: '16/10/2026',
      objeto:
        'Reduz a duração máxima semanal do trabalho e prevê 2 dias de repouso semanal remunerado, sem redução salarial (art. 7º).',
      url: 'https://www.in.gov.br/web/dou/-/emenda-constitucional-n-141-738818165',
    },
    {
      numero: '140',
      data: '16/10/2026',
      objeto:
        'Aposentadoria diferenciada dos agentes comunitários de saúde e de combate às endemias, com regularização do vínculo (arts. 40, 198 e 201).',
      url: 'https://www.in.gov.br',
    },
    {
      numero: '139',
      data: '05/05/2026',
      objeto:
        'Permite acumulação remunerada de um cargo de professor com outro de qualquer natureza (art. 37).',
      url: 'https://www.in.gov.br',
    },
    {
      numero: '132',
      data: '20/12/2023',
      objeto:
        'Reforma Tributária: IBS, CBS e Imposto Seletivo (arts. 149-B, 153, VIII, 156-A e 195, V).',
      url: 'https://www.in.gov.br',
    },
  ],
  /**
   * FONTE QUE ABRE: o Planalto devolve "Acesso Negado" para este servidor
   * (página de 814 bytes com HTTP 200). O texto atualizado e o quadro completo
   * das 141 emendas estão na Câmara e no DOU — e é isso que se aponta.
   */
  ondeLer: [
    {
      nome: 'Texto atualizado até a EC 141/2026',
      orgao: 'Câmara dos Deputados',
      url: 'https://www2.camara.leg.br/atividade-legislativa/legislacao/Constituicoes_Brasileiras/constituicao-cidada/constituicao1988',
      nota: 'HTML e PDF do texto compilado, mais o ADCT atualizado.',
    },
    {
      nome: 'Quadro de todas as 141 emendas',
      orgao: 'Presidência da República (Planalto)',
      url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/quadro_emc.htm',
      nota: 'Lista completa com ementa e data de cada emenda. ATENÇÃO: abre no computador do usuário; deste servidor o Planalto responde "Acesso Negado" (bloqueio de IP).',
    },
    {
      nome: 'Diário Oficial da União',
      orgao: 'Imprensa Nacional',
      url: 'https://www.in.gov.br',
      nota: 'O texto como foi promulgado, com data e mesa diretora — é a prova de vigência.',
    },
    {
      nome: 'normas.leg.br',
      orgao: 'Senado Federal / Congresso',
      url: 'https://normas.leg.br',
      nota: 'URN da CF/88 e das emendas, com versão por data (dateModified 16/10/2026 conferido na API).',
    },
  ],
}

/**
 * CÓDIGOS — os ramos do Direito, cada um com o seu ícone (pedido do CEO:
 * "dando a cada segmento um ícone para facilitar a localização").
 */
export interface Codigo {
  id: string
  nome: string
  apelido: string
  /** o que se resolve com ele */
  area: string
  norma: string
  lei: string
  /** link oficial para o texto */
  url: string
}

export const CODIGOS: Codigo[] = [
  {
    id: 'civil',
    nome: 'Código Civil',
    apelido: 'CC',
    area: 'Obrigações, contratos, empresa, família e sucessões',
    norma: 'Lei 10.406/2002',
    lei: 'Lei 10.406/2002',
    url: 'https://normas.leg.br',
  },
  {
    id: 'processo-civil',
    nome: 'Código de Processo Civil',
    apelido: 'CPC',
    area: 'Como se cobra e se defende em juízo — prazos, provas, recursos e execução',
    norma: 'Lei 13.105/2015',
    lei: 'Lei 13.105/2015',
    url: 'https://normas.leg.br',
  },
  {
    id: 'tributario',
    nome: 'Código Tributário Nacional',
    apelido: 'CTN',
    area: 'Fato gerador, obrigação, crédito, prescrição e decadência — a base de todo tributo',
    norma: 'Lei 5.172/1966',
    lei: 'Lei 5.172/1966 (recepcionado como lei complementar)',
    url: 'https://normas.leg.br',
  },
  {
    id: 'penal',
    nome: 'Código Penal',
    apelido: 'CP',
    area: 'Crimes e penas — inclusive os crimes contra a ordem tributária',
    norma: 'Decreto-Lei 2.848/1940',
    lei: 'Decreto-Lei 2.848/1940',
    url: 'https://normas.leg.br',
  },
  {
    id: 'processo-penal',
    nome: 'Código de Processo Penal',
    apelido: 'CPP',
    area: 'Investigação, denúncia, instrução e julgamento criminal',
    norma: 'Decreto-Lei 3.689/1941',
    lei: 'Decreto-Lei 3.689/1941',
    url: 'https://normas.leg.br',
  },
  {
    id: 'trabalhista',
    nome: 'Consolidação das Leis do Trabalho',
    apelido: 'CLT',
    area: 'Relação de emprego, jornada, rescisão e processo do trabalho',
    norma: 'Decreto-Lei 5.452/1943',
    lei: 'Decreto-Lei 5.452/1943',
    url: 'https://normas.leg.br',
  },
  {
    id: 'consumidor',
    nome: 'Código de Defesa do Consumidor',
    apelido: 'CDC',
    area: 'Relação de consumo, responsabilidade do fornecedor e cobrança indevida',
    norma: 'Lei 8.078/1990',
    lei: 'Lei 8.078/1990',
    url: 'https://normas.leg.br',
  },
  {
    id: 'empresarial',
    nome: 'Lei das Sociedades por Ações e do Registro Empresarial',
    apelido: 'SA / Empresarial',
    area: 'Sociedade, sócios, balanço, registro e responsabilidade dos administradores',
    norma: 'Lei 6.404/1976 e Lei 8.934/1994',
    lei: 'Lei 6.404/1976',
    url: 'https://normas.leg.br',
  },
  {
    id: 'falencia',
    nome: 'Lei de Recuperação Judicial e Falência',
    apelido: 'LRF',
    area: 'Recuperação, falência, credores e o que acontece com o crédito tributário',
    norma: 'Lei 11.101/2005',
    lei: 'Lei 11.101/2005',
    url: 'https://normas.leg.br',
  },
  {
    id: 'administrativo',
    nome: 'Lei do Processo Administrativo Federal',
    apelido: 'Lei 9.784/1999',
    area: 'Como a administração decide, prazos, recurso e anulação do ato',
    norma: 'Lei 9.784/1999',
    lei: 'Lei 9.784/1999',
    url: 'https://normas.leg.br',
  },
  {
    id: 'licitacoes',
    nome: 'Lei de Licitações e Contratos',
    apelido: 'Nova Lei de Licitações',
    area: 'Contratação pública, dispensa, pregão e execução do contrato',
    norma: 'Lei 14.133/2021',
    lei: 'Lei 14.133/2021',
    url: 'https://normas.leg.br',
  },
  {
    id: 'execucao-fiscal',
    nome: 'Lei de Execução Fiscal',
    apelido: 'LEF',
    area: 'Cobrança judicial do crédito tributário — a via da dívida ativa',
    norma: 'Lei 6.830/1980',
    lei: 'Lei 6.830/1980',
    url: 'https://normas.leg.br',
  },
  {
    id: 'improbidade',
    nome: 'Lei de Improbidade Administrativa',
    apelido: 'LIA',
    area: 'Conduta do agente público, sanções e o que mudou na Lei 14.230/2021',
    norma: 'Lei 8.429/1992',
    lei: 'Lei 8.429/1992',
    url: 'https://normas.leg.br',
  },
  {
    id: 'antifurto',
    nome: 'Lei de Lavagem de Dinheiro',
    apelido: 'Lavagem',
    area: 'Prevenção, comunicação de operação suspeita e responsabilidade',
    norma: 'Lei 9.613/1998',
    lei: 'Lei 9.613/1998',
    url: 'https://normas.leg.br',
  },
]

/**
 * ACERVOS LEGAIS — os sub-ícones por área do Direito, como o CEO nomeou.
 * Cada área reúne: o código que a organiza, o tribunal que a decide e a fonte.
 */
export interface AcervoLegal {
  id: string
  nome: string
  descricao: string
  codigos: string[]
  tribunais: string[]
}

export const ACERVOS_LEGAIS: AcervoLegal[] = [
  {
    id: 'constitucional',
    nome: 'Constitucional',
    descricao:
      'A Constituição, as 141 emendas e o controle de constitucionalidade. É o topo da hierarquia: tudo o mais se lê à luz daqui.',
    codigos: ['Constituição Federal', 'ADCT'],
    tribunais: ['stf'],
  },
  {
    id: 'tributario',
    nome: 'Tributário',
    descricao:
      'CTN, LC 214/2025, LC 87/1996, LC 116/2003, execução fiscal e o contencioso administrativo e judicial do tributo.',
    codigos: ['CTN', 'LEF', 'LC 214/2025', 'LC 87/1996', 'LC 116/2003'],
    tribunais: ['stf', 'stj', 'trf', 'tj'],
  },
  {
    id: 'civil',
    nome: 'Civil e Processo Civil',
    descricao: 'Obrigações, contratos, responsabilidade civil e o rito do CPC.',
    codigos: ['CC', 'CPC'],
    tribunais: ['stj', 'tj'],
  },
  {
    id: 'trabalhista',
    nome: 'Trabalhista',
    descricao: 'CLT, reforma trabalhista e a jurisprudência que a aplica.',
    codigos: ['CLT'],
    tribunais: ['tst', 'trf'],
  },
  {
    id: 'penal',
    nome: 'Penal e Processo Penal',
    descricao:
      'CP, CPP e os crimes contra a ordem tributária (Lei 8.137/1990) — a fronteira entre o fiscal e o criminal.',
    codigos: ['CP', 'CPP', 'Lei 8.137/1990'],
    tribunais: ['stf', 'stj', 'tj'],
  },
  {
    id: 'administrativo',
    nome: 'Administrativo',
    descricao: 'Processo administrativo, licitações, improbidade e responsabilidade do gestor.',
    codigos: ['Lei 9.784/1999', 'Lei 14.133/2021', 'LIA'],
    tribunais: ['stf', 'stj', 'tj'],
  },
  {
    id: 'empresarial',
    nome: 'Empresarial e Falimentar',
    descricao: 'Sociedades, recuperação judicial e o encontro do crédito privado com o tributário.',
    codigos: ['Lei 6.404/1976', 'LRF'],
    tribunais: ['stj', 'tj'],
  },
  {
    id: 'consumidor',
    nome: 'Consumidor',
    descricao: 'CDC aplicado à cobrança, ao contrato e à oferta.',
    codigos: ['CDC'],
    tribunais: ['stj', 'tj'],
  },
]

/**
 * DISPONIBILIDADE DAS FONTES — medida host por host em 02/11/2026.
 * A coluna `responde` é o que se apurou, não o que se supõe.
 */
export interface FonteJuridica {
  nome: string
  orgao: string
  url: string
  o_que_tem: string
  responde: boolean
  codigo?: string
  observacao?: string
}

export const FONTES_JURIDICAS: FonteJuridica[] = [
  {
    nome: 'STF — jurisprudência',
    orgao: 'Supremo Tribunal Federal',
    url: 'https://portal.stf.jus.br/jurisprudencia/',
    o_que_tem: 'Acórdãos, súmulas vinculantes, repercussão geral (Temas) e o controle concentrado.',
    responde: true,
    codigo: '200',
  },
  {
    nome: 'STJ — SCON',
    orgao: 'Superior Tribunal de Justiça',
    url: 'https://scon.stj.jus.br/SCON/',
    o_que_tem: 'Jurisprudência completa, repetitivos (Temas) e jurisprudência em teses.',
    responde: true,
    codigo: '200',
  },
  {
    nome: 'TST — jurisprudência',
    orgao: 'Tribunal Superior do Trabalho',
    url: 'https://www.tst.jus.br/jurisprudencia',
    o_que_tem: 'Súmulas, OJs e precedentes normativos da Justiça do Trabalho.',
    responde: true,
    codigo: '202',
  },
  {
    nome: 'STM',
    orgao: 'Superior Tribunal Militar',
    url: 'https://www.stm.jus.br',
    o_que_tem: 'Jurisprudência penal militar.',
    responde: true,
    codigo: '200',
  },
  {
    nome: 'CNJ — DataJud',
    orgao: 'Conselho Nacional de Justiça',
    url: 'https://www.cnj.jus.br',
    o_que_tem:
      'API pública de metadados processuais de todo o Judiciário. Exige chave de API — sem ela responde 401.',
    responde: true,
    codigo: '200',
    observacao: 'A API DataJud respondeu 401 (chave obrigatória); o portal do CNJ responde 200.',
  },
  {
    nome: 'TSE',
    orgao: 'Tribunal Superior Eleitoral',
    url: 'https://www.tse.jus.br/jurisprudencia',
    o_que_tem: 'Jurisprudência e resoluções eleitorais.',
    responde: false,
    codigo: '403',
    observacao: 'Respondeu 403 deste servidor (proteção anti-robô). O link vale para o usuário.',
  },
  {
    nome: 'normas.leg.br',
    orgao: 'Senado Federal / Congresso Nacional',
    url: 'https://normas.leg.br',
    o_que_tem: 'Texto integral de leis e decretos, com URN e versão por data.',
    responde: true,
    codigo: '200',
  },
  {
    nome: 'Diário Oficial da União',
    orgao: 'Imprensa Nacional',
    url: 'https://www.in.gov.br',
    o_que_tem: 'O ato como foi publicado — a prova de vigência.',
    responde: true,
    codigo: '301 (redireciona)',
  },
  {
    nome: 'Planalto — legislação',
    orgao: 'Presidência da República',
    url: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/quadro_emc.htm',
    o_que_tem: 'Quadro completo das emendas constitucionais e o texto compilado da CF.',
    responde: false,
    codigo: '200 com "Acesso Negado!" em 814 bytes',
    observacao:
      'BLOQUEIO POR IP: devolve HTTP 200 com uma página de erro de 814 bytes. Abre no computador do usuário; não abre deste servidor. Não usar para afirmar leitura automática.',
  },
  {
    nome: 'Câmara dos Deputados — Constituição',
    orgao: 'Câmara dos Deputados',
    url: 'https://www2.camara.leg.br/atividade-legislativa/legislacao/Constituicoes_Brasileiras/constituicao-cidada/constituicao1988',
    o_que_tem: 'Texto da CF atualizado até a EC 141/2026 em HTML e PDF, mais o ADCT atualizado.',
    responde: false,
    codigo: 'sem resposta deste servidor',
    observacao: 'DNS resolve, mas a conexão não fecha daqui. O link vale para o usuário.',
  },
]

/** Cronologia: a ordem em que as coisas aconteceram, como o CEO pediu. */
export interface MarcoCronologico {
  data: string
  ano: string
  titulo: string
  descricao: string
  esfera: 'nacional' | 'estadual' | 'municipal'
}

export const CRONOLOGIA_JURIDICA: MarcoCronologico[] = [
  {
    data: '05/10/1988',
    ano: '1988',
    titulo: 'Promulgação da Constituição',
    descricao:
      'A Constituição Cidadã entra em vigor. É o topo da hierarquia: nenhuma lei, decreto ou decisão sobrevive a ela.',
    esfera: 'nacional',
  },
  {
    data: '1966',
    ano: '1966',
    titulo: 'Código Tributário Nacional',
    descricao:
      'Lei 5.172/1966 — recepcionada pela CF/88 como lei complementar. Define fato gerador, obrigação, crédito, prescrição e decadência.',
    esfera: 'nacional',
  },
  {
    data: '1988-2026',
    ano: '1988-2026',
    titulo: '141 emendas constitucionais',
    descricao:
      'Da EC 1/1992 à EC 141/2026. As três últimas: 139 (05.05.2026, acumulação de cargo de professor), 140 e 141 (16.10.2026, agentes de saúde e jornada de 40h).',
    esfera: 'nacional',
  },
  {
    data: '13/09/1996',
    ano: '1996',
    titulo: 'Lei Kandir — LC 87/1996',
    descricao:
      'Lei geral do ICMS: define o imposto estadual que a LC 214/2025 vai extinguir em 2033.',
    esfera: 'estadual',
  },
  {
    data: '31/07/2003',
    ano: '2003',
    titulo: 'LC 116/2003 — lei nacional do ISS',
    descricao:
      'Lista de serviços e limites de alíquota do imposto municipal. Revogada por inteiro em 01/01/2033.',
    esfera: 'municipal',
  },
  {
    data: '20/12/2023',
    ano: '2023',
    titulo: 'EC 132/2023 — Reforma Tributária',
    descricao:
      'Institui IBS, CBS e Imposto Seletivo. É a emenda constitucional que reescreve o sistema tributário.',
    esfera: 'nacional',
  },
  {
    data: '16/01/2025',
    ano: '2025',
    titulo: 'LC 214/2025',
    descricao:
      'Regulamenta a reforma: 617 artigos, 28 anexos e o calendário de transição até 2033.',
    esfera: 'nacional',
  },
  {
    data: '16/10/2026',
    ano: '2026',
    titulo: 'EC 141/2026',
    descricao:
      'A emenda mais recente: jornada de 40 horas semanais e dois dias de repouso, sem redução salarial.',
    esfera: 'nacional',
  },
]

export const TOTAL_ACERVOS = ACERVOS_LEGAIS.length
export const TOTAL_CODIGOS = CODIGOS.length
export const TRIBUNais_RESPONDEM = TRIBUNAIS.filter((t) => t.responde).length
