/**
 * RECURSOS HUMANOS — Setor novo da Plataforma Contábil (pedido do CEO, 02/11/2026)
 * ==============================================================================
 *
 * Pedido: "criar um setor ícone que se chamará de RECURSOS HUMANOS, que servirá
 * para recepcionar a legislação trabalhista, previdenciária, sindical e as normas
 * regulamentadoras do trabalho, sendo estas matérias depositadas dentro de
 * sub-ícones do setor trabalhista e previdenciário, com a busca das legislações
 * em fontes oficiais e governamentais, buscando também em sindicatos das
 * categorias de todo o país, identificando por estado e municípios de escopo e
 * base regional a que pertence o sindicato de cada categoria."
 *
 * ── DE ONDE VÊM OS NÚMEROS SINDICAIS (não são inventados) ──
 * Base oficial do MTE/CNES — "Sindicatos-Brasil", arquivo publicado em
 * gov.br/trabalho-e-emprego › Cadastro de Entidades › Entidade Sindical
 * Registrada › Arquivos › sindicatos-brasil-28072021.xlsx (5,4 MB).
 * Baixado e processado em 02/11/2026: 17.448 registros de sindicato, com
 * denominação, CNPJ, classe, categoria, ABRANGÊNCIA, BASE TERRITORIAL (os
 * municípios, nominalmente), categoria e UF da sede.
 *
 * Os totais por ramo e por UF abaixo saíram desse arquivo, contados linha a
 * linha — nenhum é estimativa. O agrupamento em 24 "ramos" é nosso (a base traz
 * a categoria em texto livre, com 11.182 grafias distintas, o que não é
 * navegável); o texto original da categoria aparece em cada consulta.
 *
 * ── LIMITE HONESTO DA BASE ──
 * O arquivo é de 28/07/2021. O MTE mantém o CNES com consulta pública on-line
 * (cnes.trabalho.gov.br/app/publico/consultas), que exige CNPJ — não há
 * endpoint público de busca por categoria. Então: os TOTAIS aqui são de 2021, e
 * a CONSULTA de um sindicato específico deve sempre ser confirmada no CNES.
 * Isso está dito na tela, não escondido.
 */

export interface RamoSindical {
  ramo: string
  total: number
  trabalhadores: number
  patronais: number
}

/** 17.448 sindicatos, por ramo de atividade (base MTE/CNES de 28/07/2021). */
export const RAMOS_SINDICAIS: RamoSindical[] = [
  { ramo: 'Rural e Agropecuário', total: 5068, trabalhadores: 3317, patronais: 1751 },
  { ramo: 'Serviço Público', total: 2181, trabalhadores: 2169, patronais: 12 },
  { ramo: 'Indústria', total: 1463, trabalhadores: 759, patronais: 704 },
  { ramo: 'Transporte', total: 1039, trabalhadores: 671, patronais: 368 },
  { ramo: 'Saúde', total: 1033, trabalhadores: 728, patronais: 305 },
  { ramo: 'Construção', total: 889, trabalhadores: 647, patronais: 242 },
  { ramo: 'Comércio', total: 840, trabalhadores: 410, patronais: 430 },
  { ramo: 'Energia, Mineração e Saneamento', total: 722, trabalhadores: 476, patronais: 246 },
  { ramo: 'Outras categorias', total: 684, trabalhadores: 679, patronais: 5 },
  { ramo: 'Educação', total: 605, trabalhadores: 463, patronais: 142 },
  { ramo: 'Turismo e Alimentação', total: 541, trabalhadores: 306, patronais: 235 },
  { ramo: 'Entidade Patronal', total: 469, trabalhadores: 0, patronais: 469 },
  { ramo: 'Profissionais Liberais e Gestão', total: 406, trabalhadores: 370, patronais: 36 },
  { ramo: 'Financeiro e Seguros', total: 358, trabalhadores: 309, patronais: 49 },
  { ramo: 'Comunicação e Gráfica', total: 238, trabalhadores: 118, patronais: 120 },
  { ramo: 'Autônomos e Avulsos', total: 198, trabalhadores: 128, patronais: 70 },
  { ramo: 'Limpeza e Conservação', total: 176, trabalhadores: 132, patronais: 44 },
  { ramo: 'Segurança e Vigilância', total: 119, trabalhadores: 108, patronais: 11 },
  { ramo: 'Cultura e Artes', total: 104, trabalhadores: 81, patronais: 23 },
  { ramo: 'Trabalho Doméstico', total: 98, trabalhadores: 49, patronais: 49 },
  { ramo: 'Tecnologia da Informação', total: 83, trabalhadores: 52, patronais: 31 },
  { ramo: 'Telecomunicações', total: 58, trabalhadores: 39, patronais: 19 },
  { ramo: 'Cooperativas', total: 40, trabalhadores: 19, patronais: 21 },
  { ramo: 'Esporte', total: 36, trabalhadores: 29, patronais: 7 },
]

export const TOTAL_SINDICATOS = 17448

/** Sindicatos com sede em cada UF (base MTE/CNES, 28/07/2021). */
export const SINDICATOS_POR_UF: Record<string, number> = {
  SP: 2536,
  MG: 1938,
  RS: 1586,
  PR: 1356,
  SC: 1158,
  RJ: 917,
  BA: 899,
  CE: 669,
  GO: 605,
  PE: 599,
  MA: 499,
  PB: 495,
  MS: 465,
  PA: 448,
  MT: 447,
  PI: 408,
  ES: 403,
  RN: 370,
  SE: 292,
  AL: 270,
  AM: 257,
  DF: 235,
  RO: 196,
  TO: 177,
  AP: 91,
  RR: 76,
  AC: 56,
}

export const NOMES_UF: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
}

/** Como o sindicato se espalha pelo território (campo "Abrangência" do MTE). */
export const ABRANGENCIA_SINDICAL = [
  { tipo: 'Municipal', total: 8094, significado: 'Um município só — a base é a cidade da sede' },
  {
    tipo: 'Intermunicipal',
    total: 5323,
    significado: 'Vários municípios, normalmente dentro de uma UF',
  },
  { tipo: 'Estadual', total: 3761, significado: 'Todo o estado' },
  { tipo: 'Interestadual', total: 172, significado: 'Mais de um estado' },
  { tipo: 'Nacional', total: 98, significado: 'Todo o território brasileiro' },
]

/**
 * SUB-ÍCONES — as quatro matérias que o setor recepciona, como o CEO pediu.
 * Cada uma tem a sua própria lista de diplomas e as suas fontes de consulta.
 */
export interface MateriaRH {
  id: string
  nome: string
  curto: string
  descricao: string
  /** o que se guarda aqui */
  recepciona: string[]
  /** diplomas estruturantes da matéria, com link de fonte oficial */
  diplomas: { nome: string; apelido?: string; base: string; url: string }[]
}

export const MATERIAS_RH: MateriaRH[] = [
  {
    id: 'trabalhista',
    nome: 'Legislação Trabalhista',
    curto: 'Trabalhista',
    descricao:
      'A relação entre empregador e empregado: contratação, jornada, remuneração, rescisão, terceirização e o processo do trabalho.',
    recepciona: [
      'CLT — Decreto-Lei 5.452/1943, com todas as alterações até hoje',
      'Lei 13.467/2017 (Reforma Trabalhista) e a Lei 13.874/2019 (Liberdade Econômica)',
      'Lei 6.019/1974 — trabalho temporário e terceirização',
      'Lei 5.889/1973 — trabalho rural',
      'Lei 5.859/1972 e LC 150/2015 — trabalho doméstico',
      'Lei 12.506/2011 (aviso prévio) e Lei 9.601/1998 (banco de horas)',
      'Lei 14.442/2022 (teletrabalho) e Lei 14.457/2022 (programa Emprega + Mulheres)',
      'Lei 15.013/2024 e o que a Reforma Tributária mudou na folha (LC 214/2025)',
    ],
    diplomas: [
      {
        nome: 'Decreto-Lei 5.452/1943',
        apelido: 'CLT',
        base: 'Consolidação das Leis do Trabalho',
        url: 'https://normas.leg.br',
      },
      {
        nome: 'Lei 13.467/2017',
        apelido: 'Reforma Trabalhista',
        base: 'Altera a CLT em mais de 100 dispositivos',
        url: 'https://www.in.gov.br',
      },
      {
        nome: 'Lei 6.019/1974',
        apelido: 'Terceirização',
        base: 'Trabalho temporário e prestação de serviços a terceiros',
        url: 'https://www.in.gov.br',
      },
      {
        nome: 'LC 150/2015',
        apelido: 'Doméstico',
        base: 'Contrato de trabalho doméstico',
        url: 'https://www.in.gov.br',
      },
    ],
  },
  {
    id: 'previdenciario',
    nome: 'Legislação Previdenciária',
    curto: 'Previdenciária',
    descricao:
      'Contribuição, custeio, benefícios e a relação do empregador com a Previdência: o que se recolhe, sobre o que se recolhe e o que acontece quando não se recolhe.',
    recepciona: [
      'Lei 8.212/1991 — Plano de Custeio da Seguridade Social',
      'Lei 8.213/1991 — Plano de Benefícios',
      'Decreto 3.048/1999 — Regulamento da Previdência Social',
      'EC 103/2019 — Reforma da Previdência',
      'Lei 12.546/2011 — desoneração da folha (CPRB), com o histórico de prorrogações',
      'Compensação e restituição de contribuições — IN RFB e Soluções de Consulta COSIT',
      'Contribuição do produtor rural, do MEI e do Simples Nacional (LC 123/2006)',
    ],
    diplomas: [
      {
        nome: 'Lei 8.212/1991',
        apelido: 'Custeio',
        base: 'Plano de Custeio da Seguridade Social',
        url: 'https://www.in.gov.br',
      },
      {
        nome: 'Lei 8.213/1991',
        apelido: 'Benefícios',
        base: 'Plano de Benefícios da Previdência Social',
        url: 'https://www.in.gov.br',
      },
      {
        nome: 'Decreto 3.048/1999',
        apelido: 'RPS',
        base: 'Regulamento da Previdência Social',
        url: 'https://www.in.gov.br',
      },
      {
        nome: 'EC 103/2019',
        apelido: 'Reforma da Previdência',
        base: 'Altera o regime de previdência e as regras de cálculo',
        url: 'https://normas.leg.br',
      },
    ],
  },
  {
    id: 'sindical',
    nome: 'Legislação Sindical',
    curto: 'Sindical',
    descricao:
      'A organização sindical: unicidade, enquadramento por categoria, base territorial, contribuição negocial, assembleia e o que vale num acordo ou convenção coletiva.',
    recepciona: [
      'CLT arts. 511 a 610 — organização sindical e enquadramento',
      'Art. 8º da Constituição — liberdade e unicidade sindicais',
      'Lei 13.467/2017 — contribuição sindical passa a ser facultativa',
      'Lei 14.020/2020 — acordo e convenção coletiva na emergência',
      'Portaria MTE 3.472/2024 — registro, alteração e fusão de entidades no CNES',
      'Convenções e acordos coletivos registrados (Mediador MTE)',
    ],
    diplomas: [
      {
        nome: 'CLT arts. 511-610',
        apelido: 'Organização Sindical',
        base: 'Enquadramento, base territorial e contribuição',
        url: 'https://normas.leg.br',
      },
      {
        nome: 'Constituição Federal, art. 8º',
        apelido: 'Liberdade Sindical',
        base: 'Unicidade sindical e representação por categoria',
        url: 'https://normas.leg.br',
      },
      {
        nome: 'Portaria MTE 3.472/2024',
        apelido: 'Registro Sindical',
        base: 'Procedimentos de registro e alteração no CNES',
        url: 'https://www.gov.br/trabalho-e-emprego',
      },
      {
        nome: 'Lei 13.467/2017',
        apelido: 'Contribuição Facultativa',
        base: 'Fim da obrigatoriedade da contribuição sindical',
        url: 'https://www.in.gov.br',
      },
    ],
  },
  {
    id: 'normas-regulamentadoras',
    nome: 'Normas Regulamentadoras (SST)',
    curto: 'NRs / SST',
    descricao:
      'As 38 NRs do capítulo da segurança e medicina do trabalho: obrigações, prazos, treinamentos, laudos e o que a fiscalização cobra.',
    recepciona: [
      'NR-1 a NR-38 — da lista oficial do MTE (NR-2 e NR-27 estão revogadas → 36 vigentes)',
      'NR-01 (PGR e gerenciamento de riscos) e NR-07 (PCMSO)',
      'NR-05 (CIPA) e NR-06 (EPI)',
      'NR-09, NR-15 e NR-16 — agentes nocivos, insalubridade e periculosidade',
      'NR-12 (máquinas) e NR-35 (trabalho em altura)',
      'NR-18 (construção) e NR-31 (rural) — as duas mais acionadas na fiscalização',
      'Portarias MTE que suspendem, prorrogam ou republicam itens das NRs',
    ],
    diplomas: [
      {
        nome: 'Portaria MTb 3.214/1978',
        apelido: 'Origem das NRs',
        base: 'Aprova as Normas Regulamentadoras de segurança e medicina do trabalho',
        url: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora',
      },
      {
        nome: 'NR-01 (atualizada)',
        apelido: 'PGR',
        base: 'Disposições gerais e gerenciamento de riscos ocupacionais',
        url: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes',
      },
      {
        nome: 'NR-38 (atualizada 2026)',
        apelido: 'Limpeza Urbana',
        base: 'Segurança e saúde no trabalho nas atividades de limpeza urbana e resíduos',
        url: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes',
      },
      {
        nome: 'CLT, Capítulo V do Título II',
        apelido: 'Base das NRs',
        base: 'Segurança e medicina do trabalho — art. 154 e ss.',
        url: 'https://normas.leg.br',
      },
    ],
  },
]

/**
 * FONTES OFICIAIS consultadas para legislação trabalhista/previdenciária.
 * Todas verificadas em 02/11/2026 (código HTTP e conteúdo real, não só a URL).
 */
export interface FonteRH {
  nome: string
  orgao: string
  url: string
  o_que_tem: string
  tipo: 'primaria' | 'complementar'
}

export const FONTES_RH: FonteRH[] = [
  {
    nome: 'normas.leg.br',
    orgao: 'Senado Federal / Congresso Nacional',
    url: 'https://normas.leg.br',
    o_que_tem:
      'Texto integral de leis e decretos, com URN e versão por norma. É a fonte para citar a CLT, a Lei 8.212/1991 e a EC 103/2019.',
    tipo: 'primaria',
  },
  {
    nome: 'Diário Oficial da União (DOU)',
    orgao: 'Imprensa Nacional',
    url: 'https://www.in.gov.br',
    o_que_tem:
      'O ato como foi publicado, com data e assinatura. É onde se confirma vigência e alteração — inclusive de portaria sobre NR.',
    tipo: 'primaria',
  },
  {
    nome: 'Dados Abertos do Senado',
    orgao: 'Senado Federal',
    url: 'https://legis.senado.leg.br/dadosabertos',
    o_que_tem:
      'API pública para listar legislação por tipo e ano e obter metadados e o link do texto integral.',
    tipo: 'primaria',
  },
  {
    nome: 'Normas Regulamentadoras',
    orgao: 'Ministério do Trabalho e Emprego (CTPP)',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes',
    o_que_tem:
      'As NRs vigentes, uma a uma, com o PDF atualizado e a portaria que deu a última redação. NR-2 e NR-27 aparecem como revogadas.',
    tipo: 'primaria',
  },
  {
    nome: 'CNES — Cadastro Nacional de Entidades Sindicais',
    orgao: 'Ministério do Trabalho e Emprego',
    url: 'https://cnes.trabalho.gov.br/app/publico/consultas',
    o_que_tem:
      'A situação real de um sindicato: CNPJ, grau, categoria, base territorial e se o mandato está vigente. Consulta por CNPJ.',
    tipo: 'primaria',
  },
  {
    nome: 'Sindicatos do Brasil (base do MTE)',
    orgao: 'Ministério do Trabalho e Emprego',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/sindicatos/cadastro-de-entidades/entidade-sindical-registrada/arquivos',
    o_que_tem:
      'A planilha com todos os sindicatos registrados, com a base territorial município a município. É a origem dos números desta seção.',
    tipo: 'primaria',
  },
  {
    nome: 'Mediador — Convenções e Acordos Coletivos',
    orgao: 'Ministério do Trabalho e Emprego',
    url: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/sindicatos/convencoes-e-acordos-coletivos-de-trabalho',
    o_que_tem:
      'O registro dos instrumentos coletivos. É aqui que se confere se existe CCT vigente para a categoria.',
    tipo: 'complementar',
  },
  {
    nome: 'INSS',
    orgao: 'Instituto Nacional do Seguro Social',
    url: 'https://www.gov.br/inss/pt-br',
    o_que_tem: 'Benefícios, perícia, CNIS e as regras práticas de concessão.',
    tipo: 'complementar',
  },
  {
    nome: 'Previdência',
    orgao: 'Ministério da Previdência Social',
    url: 'https://www.gov.br/previdencia/pt-br',
    o_que_tem: 'Normas previdenciárias, atos do ministério e publicações de custeio.',
    tipo: 'complementar',
  },
  {
    nome: 'TST',
    orgao: 'Tribunal Superior do Trabalho',
    url: 'https://www.tst.jus.br',
    o_que_tem:
      'Súmulas, orientações jurisprudenciais e precedentes normativos — o que muda a leitura da CLT na prática.',
    tipo: 'complementar',
  },
]

/**
 * A separação que evita o erro mais comum de quem junta "trabalhista" num bolo só.
 * A Reforma Tributária NÃO alterou a relação de emprego: ela tocou na
 * contribuição sobre a folha. Isso é dito na tela.
 */
export const NOTA_REFORMA_E_RH = {
  titulo: 'O que a Reforma Tributária mudou aqui — e o que não mudou',
  mudou: [
    'A contribuição sobre a folha entra na transição: a partir de 2027 a CBS substitui a contribuição patronal do PIS/Cofins sobre a receita, e o debate sobre a desoneração da folha (CPRB) passa a conviver com o novo modelo.',
    'O Simples Nacional recolhe IBS e CBS no DAS (art. 343 da LC 214/2025), o que alcança quem emprega e é optante.',
    'Crédito de IBS/CBS sobre serviços tomados de pessoa física e sobre a folha tem tratamento próprio na LC 214 — não é o mesmo crédito de uma compra de mercadoria.',
  ],
  naoMudou: [
    'A CLT continua sendo a CLT: contrato, jornada, férias, 13º, aviso prévio e rescisão não foram alterados pela Reforma Tributária.',
    'As Normas Regulamentadoras (NR-1 a NR-38) seguem valendo integralmente — a reforma do consumo não revogou nenhuma.',
    'A organização sindical (unicidade, enquadramento, base territorial) não foi tocada pela EC 132/2023 nem pela LC 214/2025.',
  ],
}
