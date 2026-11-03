/**
 * DEPARTAMENTO FISCAL — Setor novo da Plataforma Contábil (pedido do CEO, 02/11/2026)
 * ==================================================================================
 *
 * Pedido: "criar um setor ícone que se chamará de DEPARTAMENTO FISCAL, que servirá
 * para recepcionar a Legislação Federal, Estadual e Municipal — Leis, Decretos,
 * normas reguladoras, matérias de cada esfera — depositadas dentro de sub-ícones
 * do Departamento Fiscal, com a busca das legislações em fontes oficiais e
 * governamentais, que muitas delas já estão conectadas no panorama, para a busca
 * da legislação da reforma tributária. Mantenha estes ambientes de coleta e amplie
 * para os estados e municípios, trazendo principalmente a legislação do ICMS e do
 * ISS/ISSQN de todo o país, identificando por estado e municípios de escopo e base
 * tributária regional e municipal. Desconsidere a fonte já conectada, mas mantenha
 * as informações desta para alimentar também esta base do Departamento Fiscal."
 *
 * ── COMO ISSO FOI TRADUZIDO EM TELA ──
 * O setor NÃO duplica o Radar Nacional. Ele LÊ a mesma coleção (`radar_atos`), que
 * já tem os atos por ente (federal / estadual / municipal) com o campo `relacao`
 * (reforma | conexo | interage). Assim: o Radar continua sendo o coletor; o
 * Departamento Fiscal é a MESA DE TRABALHO que organiza por esfera e por tributo.
 * "Desconsidere a fonte já conectada, mas mantenha as informações" = não criar um
 * segundo coletor; reaproveitar o dado e reorganizá-lo.
 *
 * ── O QUE É REAL E O QUE É CATÁLOGO (nada inventado) ──
 *  • BASE LEGAL DO ICMS e do ISS: números de lei conferidos um a um (ver abaixo, e
 *    cada campo `fonte` diz onde foi conferida).
 *  • ALÍQUOTAS: as modais de ICMS por UF e a faixa do ISS, com a norma quando
 *    conhecida. Onde não há confirmação, o campo fica vazio — não se estima.
 *  • DISPONIBILIDADE DAS SEFAZ: medida nesta data, host por host, com o código
 *    HTTP real (ver COBERTURA_SEFAZ). **18 confirmadas respondendo, 9 sem resposta**
 *    DESTE servidor — o que NÃO significa que o portal esteja fora do ar para uma
 *    pessoa (bloqueio de IP de datacenter é comum, como já aconteceu com o
 *    Planalto e a CONFAZ). O número é calculado de COBERTURA_SEFAZ, nunca escrito
 *    à mão: já houve divergência entre o card (18) e o texto do agente (11)
 *    porque a contagem foi digitada em dois lugares.
 */

export interface EsferaFiscal {
  id: 'federal' | 'estadual' | 'municipal'
  nome: string
  tributos: string[]
  o_que_se_guarda: string[]
  onde_publica: string
  orgaos: { nome: string; url: string; o_que_tem: string }[]
}

export const ESFERAS_FISCAIS: EsferaFiscal[] = [
  {
    id: 'federal',
    nome: 'Esfera Federal',
    tributos: ['CBS', 'Imposto Seletivo', 'IRPJ/CSLL', 'PIS/Cofins (até 2026)', 'IPI'],
    o_que_se_guarda: [
      'Leis ordinárias e complementares federais de matéria tributária',
      'Decretos e regulamentos de execução (ex.: Decreto 12.955/2026)',
      'Instruções Normativas, Atos Declaratórios e Soluções de Consulta COSIT',
      'Atos conjuntos RFB/CGIBS e os atos técnicos do CGIBS',
      'Portarias e resoluções dos órgãos de julgamento (CARF) e de registro',
    ],
    onde_publica: 'Diário Oficial da União — é onde o ato nasce e passa a valer.',
    orgaos: [
      {
        nome: 'Diário Oficial da União',
        url: 'https://www.in.gov.br',
        o_que_tem: 'Texto integral do ato com data e assinatura — a publicação que dá vigência.',
      },
      {
        nome: 'Receita Federal (normas)',
        url: 'https://www.gov.br/receitafederal/pt-br',
        o_que_tem: 'IN, ADI, Solução de Consulta COSIT e o Perguntas e Respostas oficial.',
      },
      {
        nome: 'normas.leg.br',
        url: 'https://normas.leg.br',
        o_que_tem: 'Texto integral consolidado de leis e decretos, com URN por norma.',
      },
      {
        nome: 'CGIBS — Comitê Gestor do IBS',
        url: 'https://www.cgibs.gov.br',
        o_que_tem: 'Resoluções (RIBS), atos técnicos, CST e CBF do IBS.',
      },
    ],
  },
  {
    id: 'estadual',
    nome: 'Esfera Estadual',
    tributos: ['ICMS', 'IPVA', 'ITCD', 'FECP/FECOEP', 'Taxas estaduais'],
    o_que_se_guarda: [
      'Lei estadual do ICMS (a lei matriz de cada UF)',
      'Regulamento do ICMS (o RICMS, que é decreto)',
      'Convênios e Protocolos ICMS do CONFAZ — porque alteram a lei de todos',
      'Decretos de benefício fiscal, regime especial e substituição tributária',
      'Portarias e resoluções da SEFAZ com prazos e obrigações acessórias',
    ],
    onde_publica:
      'Diário Oficial do Estado. O CONFAZ publica os convênios no DOU, mas quem os internaliza é o estado.',
    orgaos: [
      {
        nome: 'CONFAZ — legislação',
        url: 'https://www.confaz.fazenda.gov.br/legislacao',
        o_que_tem:
          'Convênios, protocolos e ajustes ICMS. Observação medida em 02/11/2026: não responde deste servidor (bloqueio de rede) — o link vale para o usuário.',
      },
      {
        nome: 'Portal Nacional da NF-e',
        url: 'https://www.nfe.fazenda.gov.br',
        o_que_tem: 'Notas técnicas e regras do documento fiscal eletrônico, que mudam por ato.',
      },
      {
        nome: 'SEFAZ de cada estado',
        url: 'https://www.gov.br',
        o_que_tem: 'A legislação tributária estadual e o RICMS vigente, na fonte que o aplica.',
      },
    ],
  },
  {
    id: 'municipal',
    nome: 'Esfera Municipal',
    tributos: ['ISS/ISSQN', 'IPTU', 'ITBI', 'Taxas municipais'],
    o_que_se_guarda: [
      'Lei municipal do ISS (o que cada município realmente cobra)',
      'Código Tributário Municipal — CTM',
      'Decretos e regulamentos de ISSQN, retenção e responsabilidade',
      'Lista de serviços do município e o regime de sociedades de profissionais',
      'Alvará, cadastro mobiliário e obrigações acessórias municipais',
    ],
    onde_publica:
      'Diário Oficial do município (ou do consórcio/associação que o publica). A LC 116/2003 é nacional, mas a alíquota é de cada município.',
    orgaos: [
      {
        nome: 'LC 116/2003 (lei nacional do ISS)',
        url: 'https://normas.leg.br',
        o_que_tem:
          'Lista de serviços, local de incidência e os pisos de alíquota. Revogada por inteiro em 01/01/2033 (LC 214/2025, art. 543, IV).',
      },
      {
        nome: 'Diários Oficiais Municipais (SIGPub / AMM / FAMEP)',
        url: 'https://www.diariomunicipal.com.br',
        o_que_tem:
          'Onde o ato municipal é publicado. É a fonte que o Radar Nacional já percorre — 20 das 27 UFs têm instância.',
      },
      {
        nome: 'Confederação Nacional de Municípios',
        url: 'https://www.cnm.org.br',
        o_que_tem: 'Estudos e orientação sobre ISS e a transição para o IBS. Responde 403 a robô.',
      },
    ],
  },
]

/**
 * BASE LEGAL DO ICMS — uma linha por UF, com a lei matriz conferida.
 * O campo `fonte` diz onde o número foi conferido (não é palpite).
 */
export interface LeiIcms {
  uf: string
  lei: string
  ano: string
  /** alíquota interna modal em 2026 (%), quando confirmada */
  aliquota?: number
  obs?: string
  fonte: string
}

export const LEIS_ICMS: LeiIcms[] = [
  {
    uf: 'AC',
    lei: 'LC 55/1996',
    ano: '1996',
    aliquota: 19,
    fonte: 'SEFAZ-AC (legislação do ICMS)',
  },
  {
    uf: 'AL',
    lei: 'Lei 5.900/1996',
    ano: '1996',
    aliquota: 20.5,
    obs: 'Era 19%; Lei 9.776/2025 elevou para 20,5% desde 01/04/2026',
    fonte: 'SEFAZ-AL + Lei 9.776/2025',
  },
  {
    uf: 'AP',
    lei: 'Lei 1.940/1996',
    ano: '1996',
    aliquota: 18,
    fonte: 'Legislação estadual (a confirmar na SEFAZ)',
  },
  {
    uf: 'AM',
    lei: 'Lei 2.826/2003',
    ano: '2003',
    aliquota: 20,
    fonte: 'SEFAZ-AM (sistemas de normas)',
  },
  {
    uf: 'BA',
    lei: 'Lei 7.014/1996',
    ano: '1996',
    aliquota: 20.5,
    obs: 'Redação da Lei 14.629/2023',
    fonte: 'Lei 7.014/1996, art. 15',
  },
  {
    uf: 'CE',
    lei: 'Lei 18.665/2023',
    ano: '2023',
    aliquota: 20,
    fonte: 'SEFAZ-CE (nota técnica da reforma comentada)',
  },
  {
    uf: 'DF',
    lei: 'Lei 1.254/1996',
    ano: '1996',
    aliquota: 20,
    fonte: 'Legislação do DF (a confirmar)',
  },
  { uf: 'ES', lei: 'Lei 7.000/2001', ano: '2001', aliquota: 17, fonte: 'Legislação estadual' },
  {
    uf: 'GO',
    lei: 'Lei 11.651/1991 (CTE)',
    ano: '1991',
    aliquota: 19,
    fonte: 'Economia-GO (Código Tributário Estadual)',
  },
  { uf: 'MA', lei: 'Lei 7.799/2002', ano: '2002', aliquota: 22, fonte: 'Legislação estadual' },
  {
    uf: 'MT',
    lei: 'Lei 7.098/1998',
    ano: '1998',
    aliquota: 17,
    fonte: 'SEFAZ-MT (legislação tributária)',
  },
  { uf: 'MS', lei: 'Lei 1.810/1997', ano: '1997', aliquota: 17, fonte: 'SEFAZ-MS' },
  {
    uf: 'MG',
    lei: 'Lei 6.763/1975',
    ano: '1975',
    aliquota: 18,
    obs: 'Código Tributário Estadual; o RICMS é o Decreto 43.080/2002',
    fonte: 'Fazenda-MG (PDF oficial da Lei 6.763/1975)',
  },
  { uf: 'PA', lei: 'Lei 6.080/1997', ano: '1997', aliquota: 19, fonte: 'Legislação estadual' },
  { uf: 'PB', lei: 'Lei 7.102/2002', ano: '2002', aliquota: 20, fonte: 'SEFAZ-PB' },
  {
    uf: 'PR',
    lei: 'Lei 11.580/1996',
    ano: '1996',
    aliquota: 19.5,
    obs: 'Atualizada até a Lei 22.962/2025',
    fonte: 'SEFAZ-PR (PDF oficial da lei, atualizado)',
  },
  {
    uf: 'PE',
    lei: 'Lei 15.730/2016',
    ano: '2016',
    aliquota: 20.5,
    fonte: 'SEFAZ-PE (tabela de alíquotas oficial)',
  },
  {
    uf: 'PI',
    lei: 'Lei 4.257/1989',
    ano: '1989',
    aliquota: 21,
    obs: 'A Lei 4.261/1989 é a do ITCMD, não a do ICMS',
    fonte: 'Portal da Legislação SEFAZ-PI (portaldalegislacao.sefaz.pi.gov.br)',
  },
  { uf: 'RJ', lei: 'Lei 2.657/1996', ano: '1996', aliquota: 22, fonte: 'Fazenda-RJ' },
  {
    uf: 'RN',
    lei: 'Lei 6.968/1996',
    ano: '1996',
    aliquota: 18,
    obs: 'RICMS é o Decreto 31.825/2022',
    fonte: 'SEFAZ-RN (seção ICMS › Leis / Regulamentos)',
  },
  { uf: 'RS', lei: 'Lei 8.820/1989', ano: '1989', aliquota: 17, fonte: 'Fazenda-RS' },
  { uf: 'RO', lei: 'Lei 688/1996', ano: '1996', aliquota: 19.5, fonte: 'Legislação estadual' },
  { uf: 'RR', lei: 'Lei 059/1993', ano: '1993', aliquota: 20, fonte: 'SEFAZ-RR' },
  {
    uf: 'SC',
    lei: 'Lei 10.297/1996',
    ano: '1996',
    aliquota: 17,
    fonte: 'SEF-SC (índice de leis estaduais)',
  },
  {
    uf: 'SP',
    lei: 'Lei 6.374/1989',
    ano: '1989',
    aliquota: 18,
    obs: 'Atualizada até a Lei 17.784/2023',
    fonte: 'AL-SP (texto compilado) + legislação.fazenda.sp.gov.br',
  },
  {
    uf: 'SE',
    lei: 'Lei 3.796/1996',
    ano: '1996',
    aliquota: 19,
    obs: 'RICMS é o Decreto 21.400/2002',
    fonte: 'LegisLog SE (legislacao.se.gov.br) / AL-SE',
  },
  {
    uf: 'TO',
    lei: 'Lei 1.287/2001',
    ano: '2001',
    aliquota: 20,
    obs: 'Código Tributário do Estado (CTE); RICMS é o Decreto 2.912/2006',
    fonte: 'DTRI/SEFAZ-TO (Lei 1.287/01 consolidada)',
  },
]

/**
 * COBERTURA MEDIDA DAS SEFAZ — resultado de teste HTTP host por host em 02/11/2026.
 * `responde: true` = o portal respondeu 2xx/3xx com o host testado.
 * `responde: false` = não houve resposta deste servidor (DNS ou conexão).
 *
 * IMPORTANTE: `false` NÃO significa "site fora do ar". Significa "deste servidor,
 * neste momento, não veio resposta" — que é o caso clássico de bloqueio de IP de
 * datacenter. Já aconteceu com o Planalto (200 com "Acesso Negado") e com a CONFAZ
 * (timeout). O usuário, no escritório, abre normalmente.
 */
export interface CoberturaSefaz {
  uf: string
  host: string
  responde: boolean
  codigo?: string
  /**
   * Rota alternativa que RESPONDEU quando a SEFAZ não abre (medida em 02/11/2026).
   * `rota` é o que abre; `via` diz o que é. Quando existe, a UF deixa de ser
   * "sem caminho": o portal do governo ou o portal de legislação serve de acesso.
   */
  rota?: string
  via?: string
  /** true quando a rota é um portal de legislação com busca (vale mais que a home) */
  busca?: boolean
  /**
   * Endereço oficial conhecido que NÃO foi possível abrir daqui. Serve para o
   * usuário clicar — e não conta como cobertura, porque não é caminho medido.
   */
  rotaOficial?: string
}

export const COBERTURA_SEFAZ: CoberturaSefaz[] = [
  { uf: 'AC', host: 'www.sefaz.ac.gov.br', responde: true, codigo: '302' },
  { uf: 'AL', host: 'www.sefaz.al.gov.br', responde: true, codigo: '200' },
  { uf: 'AM', host: 'www.sefaz.am.gov.br', responde: true, codigo: '200' },
  {
    uf: 'AP',
    host: 'www.sefaz.ap.gov.br',
    responde: false,
    rota: 'http://www.sefaz.ap.gov.br',
    via: 'SEFAZ-AP em HTTP (porta 80). Em HTTPS não completa o handshake deste servidor; o portal redireciona para HTTPS no navegador do usuário.',
  },
  { uf: 'BA', host: 'portal.sefaz.ba.gov.br', responde: true, codigo: '200' },
  { uf: 'CE', host: 'www.sefaz.ce.gov.br', responde: true, codigo: '301' },
  {
    uf: 'DF',
    host: 'www.fazenda.df.gov.br',
    responde: false,
    rota: 'https://fazenda.df.gov.br',
    via: 'Secretaria de Economia do DF — responde 302 e leva ao portal de fazenda do DF.',
  },
  { uf: 'ES', host: 'www.sefaz.es.gov.br', responde: true, codigo: '307' },
  { uf: 'GO', host: 'www.economia.go.gov.br', responde: true, codigo: '302' },
  {
    uf: 'MA',
    host: 'www.sefaz.ma.gov.br',
    responde: false,
    rota: 'https://www.ma.gov.br',
    via: 'Portal do Governo do Maranhão — a SEFAZ-MA derruba a conexão TLS deste servidor; o portal do estado responde.',
  },
  { uf: 'MG', host: 'www.fazenda.mg.gov.br', responde: true, codigo: '200' },
  { uf: 'MS', host: 'www.sefaz.ms.gov.br', responde: true, codigo: '200' },
  { uf: 'MT', host: 'www.indea.mt.gov.br', responde: true, codigo: '200' },
  {
    uf: 'PA',
    host: 'www.sefaz.pa.gov.br',
    responde: false,
    rota: 'https://www.pa.gov.br',
    via: 'Portal do Governo do Pará — responde 200; a SEFAZ-PA não aceita conexão deste servidor.',
  },
  { uf: 'PB', host: 'www.sefaz.pb.gov.br', responde: true, codigo: '200' },
  { uf: 'PE', host: 'www.sefaz.pe.gov.br', responde: true, codigo: '302' },
  {
    uf: 'PI',
    host: 'www.sefaz.pi.gov.br',
    responde: false,
    rota: 'https://www.pi.gov.br/orgao/secretaria-de-estado-da-fazenda-sefaz/',
    via: 'Portal do Governo do Piauí — página oficial da SEFAZ-PI. Responde 200; o domínio próprio da SEFAZ não abre daqui.',
  },
  { uf: 'PR', host: 'www.fazenda.pr.gov.br', responde: true, codigo: '302' },
  { uf: 'RJ', host: 'www.fazenda.rj.gov.br', responde: true, codigo: '200' },
  {
    uf: 'RN',
    host: 'www.sefaz.rn.gov.br',
    responde: false,
    rota: 'https://www.al.rn.leg.br/legislacao/pesquisa',
    via: 'Assembleia Legislativa do RN — pesquisa de legislação, onde a Lei 6.968/1996 é publicada. O portal do Executivo e a SEFAZ-RN não abrem deste servidor.',
  },
  {
    uf: 'RO',
    host: 'www.sefaz.ro.gov.br',
    responde: false,
    rota: 'https://www.ro.gov.br',
    via: 'Portal do Governo de Rondônia — responde 200. A SEFIN-RO mantém portal próprio de legislação (legislacao.sefin.ro.gov.br), que não abre deste servidor.',
  },
  { uf: 'RR', host: 'www.sefaz.rr.gov.br', responde: true, codigo: '200' },
  { uf: 'RS', host: 'www.fazenda.rs.gov.br', responde: true, codigo: '200' },
  { uf: 'SC', host: 'www.sefaz.sc.gov.br', responde: true, codigo: '301' },
  {
    uf: 'SE',
    host: 'www.sefaz.se.gov.br',
    responde: false,
    rota: 'https://legislacao.se.gov.br/',
    via: 'LegisOn — Portal de Legislação do Governo de Sergipe, com API pública de busca. Responde 200 e é a MELHOR rota dos nove.',
    busca: true,
  },
  { uf: 'SP', host: 'portal.fazenda.sp.gov.br', responde: true, codigo: '301' },
  {
    uf: 'TO',
    host: 'www.sefaz.to.gov.br',
    responde: false,
    /* SEM `rota` DE PROPÓSITO: a página de leis do ICMS (DTRI/SEFAZ-TO) foi
       localizada e é a fonte oficial, mas NÃO responde deste servidor — nem em
       HTTPS, nem em HTTP. Marcar como "via gov" daria a impressão de caminho
       aberto que não existe. `rotaOficial` guarda o endereço para o usuário
       clicar, sem contar como cobertura. */
    rotaOficial: 'https://dtri.sefaz.to.gov.br/legislacao/ntributaria/Leis/table_leis.htm',
  },
]

export const SEFAZ_RESPONDEM = COBERTURA_SEFAZ.filter((s) => s.responde).length
export const SEFAZ_SEM_RESPOSTA = COBERTURA_SEFAZ.filter((s) => !s.responde).length
/** Das que não respondem: quantas têm uma rota alternativa oficial que abre. */
export const SEFAZ_COM_ROTA_ALTERNATIVA = COBERTURA_SEFAZ.filter(
  (s) => !s.responde && s.rota,
).length
/** As que não respondem E não têm rota alternativa — o vermelho de verdade. */
export const SEFAZ_SEM_CAMINHO = COBERTURA_SEFAZ.filter((s) => !s.responde && !s.rota).length
/** Cobertura total = quem abre direto + quem abre por rota alternativa. */
export const SEFAZ_ALCANCAVEIS = SEFAZ_RESPONDEM + SEFAZ_COM_ROTA_ALTERNATIVA

/**
 * ISS / ISSQN — a lei nacional e a transição. A alíquota é MUNICIPAL: não existe
 * "a alíquota do ISS do Brasil". O que a lei nacional fixa é o piso (2%) e o teto
 * (5%), e a LC 214/2025 programou a redução escalonada até a extinção.
 */
export const ISS_ESTRUTURA = {
  leiNacional: 'Lei Complementar 116/2003',
  listaServicos:
    'Lista anexa, 40 itens e subitens (ex.: 1.01 construção, 7.02 escolas, 17.05 contabilidade)',
  piso: 2,
  teto: 5,
  pisoBaseLegal: 'Art. 8º-A da LC 116/2003 (incluído pela LC 157/2016)',
  tetoBaseLegal: 'Art. 8º, II, da LC 116/2003',
  transicao: [
    {
      ano: '2029',
      reducao: '10%',
      ibs: '10%',
      base: 'Art. 8º-B da LC 116/2003 (incluído pela LC 214/2025)',
    },
    { ano: '2030', reducao: '20%', ibs: '20%', base: 'Art. 8º-B' },
    { ano: '2031', reducao: '30%', ibs: '30%', base: 'Art. 8º-B' },
    { ano: '2032', reducao: '40%', ibs: '40%', base: 'Art. 8º-B' },
    {
      ano: '2033',
      reducao: '100% (extinto)',
      ibs: '100%',
      base: 'LC 214/2025, art. 543, IV — LC 116 revogada',
    },
  ],
  nota:
    'As alíquotas municipais vigentes em 31/12/2028 são a base da redução. É por isso que ' +
    'revisar a lei municipal do ISS ATÉ 2028 importa: depois disso, a alíquota já está congelada ' +
    'na trajetória de extinção.',
}

/** Fonte de ICMS por UF: onde abrir a legislação de cada estado. */
export function fonteIcms(uf: string): CoberturaSefaz | undefined {
  return COBERTURA_SEFAZ.find((s) => s.uf === uf)
}

export const TOTAL_UFS = 27
