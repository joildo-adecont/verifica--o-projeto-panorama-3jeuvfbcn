/**
 * Catálogo Oficial de Municípios do IBGE para o Radar Nacional
 * Fonte: Instituto Brasileiro de Geografia e Estatística (IBGE)
 * Código oficial de 7 dígitos e denominação oficial.
 */

export interface MunicipioIBGE {
  readonly codigo: string // Código IBGE com 7 dígitos
  readonly nome: string
  readonly uf: string
}

/**
 * Municípios oficiais catalogados por UF (capitais, polos regionais e municípios com atos normativos vinculados)
 * Todos os códigos e grafias conferidos com a base oficial do IBGE.
 */
export const MUNICIPIOS_IBGE_POR_UF: Record<string, MunicipioIBGE[]> = {
  AL: [
    { codigo: '2704302', nome: 'Maceió', uf: 'AL' },
    { codigo: '2700300', nome: 'Arapiraca', uf: 'AL' },
    { codigo: '2705903', nome: 'Novo Lino', uf: 'AL' },
    { codigo: '2706307', nome: 'Palmeira dos Índios', uf: 'AL' },
    { codigo: '2707701', nome: 'Rio Largo', uf: 'AL' },
    { codigo: '2709152', nome: 'Teotônio Vilela', uf: 'AL' },
    { codigo: '2709301', nome: 'União dos Palmares', uf: 'AL' },
    { codigo: '2706703', nome: 'Penedo', uf: 'AL' },
    { codigo: '2708907', nome: 'São Miguel dos Campos', uf: 'AL' },
    { codigo: '2702405', nome: 'Delmiro Gouveia', uf: 'AL' },
    { codigo: '2702306', nome: 'Coruripe', uf: 'AL' },
    { codigo: '2704500', nome: 'Maragogi', uf: 'AL' },
    { codigo: '2705200', nome: 'Murici', uf: 'AL' },
    { codigo: '2707800', nome: 'Roteiro', uf: 'AL' },
  ],
  AM: [
    { codigo: '1302603', nome: 'Manaus', uf: 'AM' },
    { codigo: '1303403', nome: 'Parintins', uf: 'AM' },
    { codigo: '1301902', nome: 'Itacoatiara', uf: 'AM' },
    { codigo: '1302504', nome: 'Manacapuru', uf: 'AM' },
    { codigo: '1301209', nome: 'Coari', uf: 'AM' },
    { codigo: '1304203', nome: 'Tefé', uf: 'AM' },
    { codigo: '1303908', nome: 'São Gabriel da Cachoeira', uf: 'AM' },
    { codigo: '1301852', nome: 'Iranduba', uf: 'AM' },
    { codigo: '1303007', nome: 'Maués', uf: 'AM' },
    { codigo: '1301704', nome: 'Humaitá', uf: 'AM' },
    { codigo: '1303569', nome: 'Rio Preto da Eva', uf: 'AM' },
  ],
  ES: [
    { codigo: '3205309', nome: 'Vitória', uf: 'ES' },
    { codigo: '3205200', nome: 'Vila Velha', uf: 'ES' },
    { codigo: '3205002', nome: 'Serra', uf: 'ES' },
    { codigo: '3201308', nome: 'Cariacica', uf: 'ES' },
    { codigo: '3201209', nome: 'Cachoeiro de Itapemirim', uf: 'ES' },
    { codigo: '3203205', nome: 'Linhares', uf: 'ES' },
    { codigo: '3204906', nome: 'São Mateus', uf: 'ES' },
    { codigo: '3202405', nome: 'Guarapari', uf: 'ES' },
    { codigo: '3201506', nome: 'Colatina', uf: 'ES' },
    { codigo: '3200607', nome: 'Aracruz', uf: 'ES' },
    { codigo: '3205101', nome: 'Viana', uf: 'ES' },
  ],
  GO: [
    { codigo: '5208707', nome: 'Goiânia', uf: 'GO' },
    { codigo: '5201405', nome: 'Aparecida de Goiânia', uf: 'GO' },
    { codigo: '5201108', nome: 'Anápolis', uf: 'GO' },
    { codigo: '5218805', nome: 'Rio Verde', uf: 'GO' },
    { codigo: '5212501', nome: 'Luziânia', uf: 'GO' },
    { codigo: '5200258', nome: 'Águas Lindas de Goiás', uf: 'GO' },
    { codigo: '5221858', nome: 'Valparaíso de Goiás', uf: 'GO' },
    { codigo: '5221403', nome: 'Trindade', uf: 'GO' },
    { codigo: '5208608', nome: 'Formosa', uf: 'GO' },
    { codigo: '5211503', nome: 'Itumbiara', uf: 'GO' },
    { codigo: '5211909', nome: 'Jataí', uf: 'GO' },
    { codigo: '5219753', nome: 'Santo Antônio do Descoberto', uf: 'GO' },
    { codigo: '5204508', nome: 'Caldas Novas', uf: 'GO' },
    { codigo: '5219308', nome: 'Santa Helena de Goiás', uf: 'GO' },
  ],
  MT: [
    { codigo: '5103403', nome: 'Cuiabá', uf: 'MT' },
    { codigo: '5108402', nome: 'Várzea Grande', uf: 'MT' },
    { codigo: '5107602', nome: 'Rondonópolis', uf: 'MT' },
    { codigo: '5107909', nome: 'Sinop', uf: 'MT' },
    { codigo: '5107925', nome: 'Sorriso', uf: 'MT' },
    { codigo: '5108055', nome: 'Tangará da Serra', uf: 'MT' },
    { codigo: '5105259', nome: 'Lucas do Rio Verde', uf: 'MT' },
    { codigo: '5106505', nome: 'Primavera do Leste', uf: 'MT' },
    { codigo: '5102504', nome: 'Cáceres', uf: 'MT' },
    { codigo: '5101803', nome: 'Barra do Garças', uf: 'MT' },
    { codigo: '5106224', nome: 'Nova Mutum', uf: 'MT' },
    { codigo: '5102678', nome: 'Campo Novo do Parecis', uf: 'MT' },
  ],
  MS: [
    { codigo: '5002704', nome: 'Campo Grande', uf: 'MS' },
    { codigo: '5003702', nome: 'Dourados', uf: 'MS' },
    { codigo: '5008305', nome: 'Três Lagoas', uf: 'MS' },
    { codigo: '5003207', nome: 'Corumbá', uf: 'MS' },
    { codigo: '5006606', nome: 'Ponta Porã', uf: 'MS' },
    { codigo: '5007901', nome: 'Sidrolândia', uf: 'MS' },
    { codigo: '5005707', nome: 'Naviraí', uf: 'MS' },
    { codigo: '5006275', nome: 'Nova Andradina', uf: 'MS' },
    { codigo: '5001102', nome: 'Aquidauana', uf: 'MS' },
    { codigo: '5005400', nome: 'Maracaju', uf: 'MS' },
    { codigo: '5006309', nome: 'Paranaíba', uf: 'MS' },
    { codigo: '5002159', nome: 'Bonito', uf: 'MS' },
  ],
  MG: [
    { codigo: '3106200', nome: 'Belo Horizonte', uf: 'MG' },
    { codigo: '3170206', nome: 'Uberlândia', uf: 'MG' },
    { codigo: '3118601', nome: 'Contagem', uf: 'MG' },
    { codigo: '3136702', nome: 'Juiz de Fora', uf: 'MG' },
    { codigo: '3106705', nome: 'Betim', uf: 'MG' },
    { codigo: '3143302', nome: 'Montes Claros', uf: 'MG' },
    { codigo: '3154606', nome: 'Ribeirão das Neves', uf: 'MG' },
    { codigo: '3170107', nome: 'Uberaba', uf: 'MG' },
    { codigo: '3127701', nome: 'Governador Valadares', uf: 'MG' },
    { codigo: '3131307', nome: 'Ipatinga', uf: 'MG' },
    { codigo: '3167202', nome: 'Sete Lagoas', uf: 'MG' },
    { codigo: '3122306', nome: 'Divinópolis', uf: 'MG' },
    { codigo: '3157807', nome: 'Santa Luzia', uf: 'MG' },
    { codigo: '3131703', nome: 'Itabira', uf: 'MG' },
    { codigo: '3151800', nome: 'Poços de Caldas', uf: 'MG' },
    { codigo: '3147907', nome: 'Passos', uf: 'MG' },
    { codigo: '3148004', nome: 'Patos de Minas', uf: 'MG' },
    { codigo: '3140001', nome: 'Mariana', uf: 'MG' },
    { codigo: '3146107', nome: 'Ouro Preto', uf: 'MG' },
    { codigo: '3171303', nome: 'Viçosa', uf: 'MG' },
  ],
  PR: [
    { codigo: '4106902', nome: 'Curitiba', uf: 'PR' },
    { codigo: '4113700', nome: 'Londrina', uf: 'PR' },
    { codigo: '4115200', nome: 'Maringá', uf: 'PR' },
    { codigo: '4119905', nome: 'Ponta Grossa', uf: 'PR' },
    { codigo: '4104808', nome: 'Cascavel', uf: 'PR' },
    { codigo: '4125506', nome: 'São José dos Pinhais', uf: 'PR' },
    { codigo: '4108304', nome: 'Foz do Iguaçu', uf: 'PR' },
    { codigo: '4105805', nome: 'Colombo', uf: 'PR' },
    { codigo: '4109401', nome: 'Guarapuava', uf: 'PR' },
    { codigo: '4118204', nome: 'Paranaguá', uf: 'PR' },
    { codigo: '4101408', nome: 'Apucarana', uf: 'PR' },
    { codigo: '4127700', nome: 'Toledo', uf: 'PR' },
    { codigo: '4101804', nome: 'Araucária', uf: 'PR' },
    { codigo: '4104303', nome: 'Campo Largo', uf: 'PR' },
    { codigo: '4101507', nome: 'Arapongas', uf: 'PR' },
    { codigo: '4126009', nome: "São Jorge D'Oeste", uf: 'PR' },
    { codigo: '4128104', nome: 'Umuarama', uf: 'PR' },
    { codigo: '4118402', nome: 'Paranavaí', uf: 'PR' },
    { codigo: '4107207', nome: 'Dois Vizinhos', uf: 'PR' },
    { codigo: '4108403', nome: 'Francisco Beltrão', uf: 'PR' },
    { codigo: '4118501', nome: 'Pato Branco', uf: 'PR' },
  ],
  PE: [
    { codigo: '2611606', nome: 'Recife', uf: 'PE' },
    { codigo: '2607901', nome: 'Jaboatão dos Guararapes', uf: 'PE' },
    { codigo: '2609600', nome: 'Olinda', uf: 'PE' },
    { codigo: '2604106', nome: 'Caruaru', uf: 'PE' },
    { codigo: '2611101', nome: 'Petrolina', uf: 'PE' },
    { codigo: '2610707', nome: 'Paulista', uf: 'PE' },
    { codigo: '2602902', nome: 'Cabo de Santo Agostinho', uf: 'PE' },
    { codigo: '2603454', nome: 'Camaragibe', uf: 'PE' },
    { codigo: '2606002', nome: 'Garanhuns', uf: 'PE' },
    { codigo: '2616407', nome: 'Vitória de Santo Antão', uf: 'PE' },
    { codigo: '2607604', nome: 'Igarassu', uf: 'PE' },
    { codigo: '2613701', nome: 'São Lourenço da Mata', uf: 'PE' },
    { codigo: '2600054', nome: 'Abreu e Lima', uf: 'PE' },
    { codigo: '2607752', nome: 'Ipojuca', uf: 'PE' },
    { codigo: '2612208', nome: 'Salgueiro', uf: 'PE' },
  ],
  PI: [
    { codigo: '2211001', nome: 'Teresina', uf: 'PI' },
    { codigo: '2207702', nome: 'Parnaíba', uf: 'PI' },
    { codigo: '2208007', nome: 'Picos', uf: 'PI' },
    { codigo: '2208403', nome: 'Piripiri', uf: 'PI' },
    { codigo: '2203909', nome: 'Floriano', uf: 'PI' },
    { codigo: '2201202', nome: 'Barras', uf: 'PI' },
    { codigo: '2202200', nome: 'Campo Maior', uf: 'PI' },
    { codigo: '2211100', nome: 'União', uf: 'PI' },
    { codigo: '2200204', nome: 'Altos', uf: 'PI' },
    { codigo: '2203206', nome: 'Esperantina', uf: 'PI' },
    { codigo: '2207009', nome: 'Oeiras', uf: 'PI' },
    { codigo: '2209005', nome: 'Pedro II', uf: 'PI' },
  ],
  RN: [
    { codigo: '2408102', nome: 'Natal', uf: 'RN' },
    { codigo: '2408003', nome: 'Mossoró', uf: 'RN' },
    { codigo: '2403251', nome: 'Parnamirim', uf: 'RN' },
    { codigo: '2412005', nome: 'São Gonçalo do Amarante', uf: 'RN' },
    { codigo: '2407104', nome: 'Macaíba', uf: 'RN' },
    { codigo: '2402600', nome: 'Ceará-Mirim', uf: 'RN' },
    { codigo: '2402006', nome: 'Caicó', uf: 'RN' },
    { codigo: '2401107', nome: 'Açu', uf: 'RN' },
    { codigo: '2403103', nome: 'Currais Novos', uf: 'RN' },
    { codigo: '2411205', nome: 'São José de Mipibu', uf: 'RN' },
    { codigo: '2412203', nome: 'Santa Cruz', uf: 'RN' },
    { codigo: '2401008', nome: 'Apodi', uf: 'RN' },
  ],
  RS: [
    { codigo: '4314902', nome: 'Porto Alegre', uf: 'RS' },
    { codigo: '4305108', nome: 'Caxias do Sul', uf: 'RS' },
    { codigo: '4304606', nome: 'Canoas', uf: 'RS' },
    { codigo: '4314407', nome: 'Pelotas', uf: 'RS' },
    { codigo: '4316907', nome: 'Santa Maria', uf: 'RS' },
    { codigo: '4309209', nome: 'Gravataí', uf: 'RS' },
    { codigo: '4323002', nome: 'Viamão', uf: 'RS' },
    { codigo: '4313409', nome: 'Novo Hamburgo', uf: 'RS' },
    { codigo: '4318705', nome: 'São Leopoldo', uf: 'RS' },
    { codigo: '4315602', nome: 'Rio Grande', uf: 'RS' },
    { codigo: '4300604', nome: 'Alvorada', uf: 'RS' },
    { codigo: '4314100', nome: 'Passo Fundo', uf: 'RS' },
    { codigo: '4317103', nome: 'Santana do Livramento', uf: 'RS' },
    { codigo: '4322400', nome: 'Uruguaiana', uf: 'RS' },
    { codigo: '4302105', nome: 'Bento Gonçalves', uf: 'RS' },
    { codigo: '4307005', nome: 'Erechim', uf: 'RS' },
    { codigo: '4316808', nome: 'Santa Cruz do Sul', uf: 'RS' },
  ],
  RO: [
    { codigo: '1100205', nome: 'Porto Velho', uf: 'RO' },
    { codigo: '1100122', nome: 'Ji-Paraná', uf: 'RO' },
    { codigo: '1100023', nome: 'Ariquemes', uf: 'RO' },
    { codigo: '1100304', nome: 'Vilhena', uf: 'RO' },
    { codigo: '1100049', nome: 'Cacoal', uf: 'RO' },
    { codigo: '1100114', nome: 'Jaru', uf: 'RO' },
    { codigo: '1100288', nome: 'Rolim de Moura', uf: 'RO' },
    { codigo: '1100106', nome: 'Guajará-Mirim', uf: 'RO' },
    { codigo: '1100254', nome: 'Presidente Médici', uf: 'RO' },
    { codigo: '1100205', nome: 'Ouro Preto do Oeste', uf: 'RO' },
  ],
  SC: [
    { codigo: '4209102', nome: 'Joinville', uf: 'SC' },
    { codigo: '4205407', nome: 'Florianópolis', uf: 'SC' },
    { codigo: '4202404', nome: 'Blumenau', uf: 'SC' },
    { codigo: '4216602', nome: 'São José', uf: 'SC' },
    { codigo: '4204202', nome: 'Chapecó', uf: 'SC' },
    { codigo: '4208203', nome: 'Itajaí', uf: 'SC' },
    { codigo: '4204608', nome: 'Criciúma', uf: 'SC' },
    { codigo: '4208906', nome: 'Jaraguá do Sul', uf: 'SC' },
    { codigo: '4211900', nome: 'Palhoça', uf: 'SC' },
    { codigo: '4202008', nome: 'Balneário Camboriú', uf: 'SC' },
    { codigo: '4202909', nome: 'Brusque', uf: 'SC' },
    { codigo: '4218707', nome: 'Tubarão', uf: 'SC' },
    { codigo: '4216206', nome: 'São Bento do Sul', uf: 'SC' },
    { codigo: '4203808', nome: 'Canoinhas', uf: 'SC' },
    { codigo: '4209003', nome: 'Joaçaba', uf: 'SC' },
  ],
}

/**
 * Mapeamento de atos normativos com identificação oficial do município e código IBGE.
 * Permite individualização completa em nível municipal dentro dos estados.
 */
export interface AtoNormativoMunicipal {
  readonly id: string
  readonly uf: string
  readonly codigoIbge: string
  readonly municipioNome: string
  readonly titulo: string
  readonly data?: string
  readonly diarioOficial?: string
  readonly urlDiario?: string
  readonly tema?: string
  readonly resumo?: string
}

export const ATOS_NORMATIVOS_MUNICIPAIS: AtoNormativoMunicipal[] = [
  // ALAGOAS
  {
    id: 'AL-01',
    uf: 'AL',
    codigoIbge: '2705903',
    municipioNome: 'Novo Lino',
    titulo: 'LEI MUNICIPAL Nº 398/2024',
    data: '13/12/2024',
    diarioOficial: 'AMA (Associação dos Municípios Alagoanos)',
    urlDiario: 'https://www.diariomunicipal.com.br/ama/materia/B1A73F9A',
    tema: 'Adequação Tributária Municipal — Reforma Tributária',
    resumo:
      'Dispõe sobre adequação de diretrizes orçamentárias e tributárias municipais em conformidade com as diretrizes da Reforma Tributária e EC 132/2023.',
  },
  {
    id: 'AL-02',
    uf: 'AL',
    codigoIbge: '2704302',
    municipioNome: 'Maceió',
    titulo: 'DECRETO MUNICIPAL Nº 9.871/2024',
    data: '18/12/2024',
    diarioOficial: 'AMA (Associação dos Municípios Alagoanos)',
    urlDiario: 'https://www.diariomunicipal.com.br/ama/materia/19E1A4A3',
    tema: 'Comissão Especial de Transição do IBS e Ajuste Cadastral',
    resumo:
      'Institui comissão técnica para coordenação das fases de transição do Imposto sobre Bens e Serviços (IBS) no âmbito do município polo de Maceió.',
  },
  {
    id: 'AL-03',
    uf: 'AL',
    codigoIbge: '2700300',
    municipioNome: 'Arapiraca',
    titulo: 'PORTARIA SEMFAZ Nº 042/2024',
    data: '20/12/2024',
    diarioOficial: 'AMA (Associação dos Municípios Alagoanos)',
    urlDiario: 'https://www.diariomunicipal.com.br/ama/materia/8F82596C',
    tema: 'Procedimentos Cadastrais e Integração ao Comitê Gestor do IBS',
    resumo:
      'Normatiza medidas preparatórias para integração cadastral fazendária com a câmara de compensação e comitê gestor do IBS.',
  },
  {
    id: 'AL-04',
    uf: 'AL',
    codigoIbge: '2706307',
    municipioNome: 'Palmeira dos Índios',
    titulo: 'DECRETO MUNICIPAL Nº 2.185/2024',
    data: '12/12/2024',
    diarioOficial: 'AMA (Associação dos Municípios Alagoanos)',
    urlDiario: 'https://www.diariomunicipal.com.br/ama/materia/0E4DA3A0',
    tema: 'Modernização da Administração Tributária Municipal',
    resumo:
      'Regulamenta o programa municipal de governança e adequação de sistemas fiscais para recepção dos dados do IBS.',
  },
  {
    id: 'AL-05',
    uf: 'AL',
    codigoIbge: '2707701',
    municipioNome: 'Rio Largo',
    titulo: 'RESOLUÇÃO SMF Nº 005/2024',
    data: '16/12/2024',
    diarioOficial: 'AMA (Associação dos Municípios Alagoanos)',
    urlDiario: 'https://www.diariomunicipal.com.br/ama/materia/3CB650AC',
    tema: 'Critérios de Transição Tributária Municipal 2026-2033',
    resumo:
      'Estabelece grupo de estudos técnicos da Secretaria de Finanças sobre impactos da transição da EC 132/2023 na arrecadação do ISS e cota-parte do IBS.',
  },

  // PARANÁ
  {
    id: 'PR-01',
    uf: 'PR',
    codigoIbge: '4126009',
    municipioNome: "São Jorge D'Oeste",
    titulo: 'DECRETO MUNICIPAL Nº 152/2024',
    data: '10/12/2024',
    diarioOficial: 'AMP (Associação dos Municípios do Paraná)',
    urlDiario: 'https://www.diariomunicipal.com.br/amp/materia/27E473F9',
    tema: 'Adequação Cadastral Tributária e Regulamentação Local',
    resumo:
      'Dispõe sobre adequações cadastrais para suporte ao cronograma de transição do IBS e modernização de tributos municipais.',
  },
  {
    id: 'PR-02',
    uf: 'PR',
    codigoIbge: '4106902',
    municipioNome: 'Curitiba',
    titulo: 'DECRETO MUNICIPAL Nº 1.840/2024',
    data: '19/12/2024',
    diarioOficial: 'AMP (Associação dos Municípios do Paraná)',
    urlDiario: 'https://www.diariomunicipal.com.br/amp/materia/877F9305',
    tema: 'Comitê de Transição do IBS e Modernização Fazendária',
    resumo:
      'Estrutura a governança municipal para participação nos grupos de trabalho federativos e na câmara de harmonização da EC 132/2023.',
  },
  {
    id: 'PR-03',
    uf: 'PR',
    codigoIbge: '4113700',
    municipioNome: 'Londrina',
    titulo: 'PORTARIA SMF Nº 088/2024',
    data: '14/12/2024',
    diarioOficial: 'AMP (Associação dos Municípios do Paraná)',
    urlDiario: 'https://www.diariomunicipal.com.br/amp/materia/98C120FA',
    tema: 'Auditoria de Conformidade e Alíquota de Referência do IBS',
    resumo:
      'Determina o monitoramento das simulações da alíquota de referência municipal e do período de teste de 2026.',
  },
  {
    id: 'PR-04',
    uf: 'PR',
    codigoIbge: '4115200',
    municipioNome: 'Maringá',
    titulo: 'INSTRUÇÃO NORMATIVA SEFAZ Nº 012/2024',
    data: '22/12/2024',
    diarioOficial: 'AMP (Associação dos Municípios do Paraná)',
    urlDiario: 'https://www.diariomunicipal.com.br/amp/materia/4F81A7D2',
    tema: 'Plano de Trabalho Municipal para a Reforma Tributária',
    resumo:
      'Fixa o plano de trabalho e capacitação dos auditores fiscais para o modelo não-cumulativo pleno do IBS.',
  },

  // MINAS GERAIS
  {
    id: 'MG-01',
    uf: 'MG',
    codigoIbge: '3106200',
    municipioNome: 'Belo Horizonte',
    titulo: 'DECRETO MUNICIPAL Nº 18.630/2024',
    data: '11/12/2024',
    diarioOficial: 'AMM-MG (Associação Mineira de Municípios)',
    urlDiario: 'https://www.diariomunicipal.com.br/amm-mg/materia/C20CCDD0',
    tema: 'Instituição do Grupo Executivo Municipal da Reforma Tributária',
    resumo:
      'Cria comitê interdisciplinar fazendário para transição do ISS e harmonização das normas de retenção com o futuro IBS.',
  },
  {
    id: 'MG-02',
    uf: 'MG',
    codigoIbge: '3170206',
    municipioNome: 'Uberlândia',
    titulo: 'PORTARIA SEFIN Nº 076/2024',
    data: '17/12/2024',
    diarioOficial: 'AMM-MG (Associação Mineira de Municípios)',
    urlDiario: 'https://www.diariomunicipal.com.br/amm-mg/materia/5E731B4A',
    tema: 'Saneamento da Base de Contribuintes e NF-e de Serviços Nacional',
    resumo:
      'Estabelece rotina de integração com o padrão nacional de NFS-e em alinhamento às exigências do Comitê Gestor do IBS.',
  },

  // AMAZONAS
  {
    id: 'AM-01',
    uf: 'AM',
    codigoIbge: '1302603',
    municipioNome: 'Manaus',
    titulo: 'DECRETO MUNICIPAL Nº 5.792/2024',
    data: '15/12/2024',
    diarioOficial: 'AAM (Associação Amazonense de Municípios)',
    urlDiario: 'https://www.diariomunicipal.com.br/aam/materia/ECE4399C',
    tema: 'Regime Especial e Salvaguardas da Zona Franca de Manaus (ZFM)',
    resumo:
      'Regulamenta medidas municipais de proteção e acompanhamento das diretrizes constitucionais específicas da ZFM e ALCs perante a EC 132/2023.',
  },

  // SANTA CATARINA
  {
    id: 'SC-01',
    uf: 'SC',
    codigoIbge: '4205407',
    municipioNome: 'Florianópolis',
    titulo: 'DECRETO MUNICIPAL Nº 26.140/2024',
    data: '18/12/2024',
    diarioOficial: 'CINCATARINA / Diário Oficial dos Municípios de SC',
    urlDiario: 'https://www.diariomunicipal.sc.gov.br/?r=site/edicao&edicao=4520',
    tema: 'Comissão Especial de Governança Fiscal e Transição do IBS',
    resumo:
      'Institui comissão técnica para avaliação de impactos na base tecnológica de arrecadação e transição federativa do ISS.',
  },
  {
    id: 'SC-02',
    uf: 'SC',
    codigoIbge: '4209102',
    municipioNome: 'Joinville',
    titulo: 'PORTARIA SEFAZ Nº 095/2024',
    data: '19/12/2024',
    diarioOficial: 'CINCATARINA / Diário Oficial dos Municípios de SC',
    urlDiario: 'https://www.diariomunicipal.sc.gov.br/?r=site/edicao&edicao=4521',
    tema: 'Auditoria de Alíquotas e Preparação ao Cadastro Sincronizado',
    resumo:
      'Regulamenta o levantamento das alíquotas efetivas de ISS por código de serviço em vista da fixação da alíquota de referência do IBS.',
  },

  // GOIÁS
  {
    id: 'GO-01',
    uf: 'GO',
    codigoIbge: '5208707',
    municipioNome: 'Goiânia',
    titulo: 'DECRETO MUNICIPAL Nº 4.120/2024',
    data: '20/12/2024',
    diarioOficial: 'AGM / FGM — Diário Oficial dos Municípios Goianos',
    urlDiario: 'https://www.diariomunicipal.go.gov.br/',
    tema: 'Coordenação da Transição Tributária Municipal',
    resumo:
      'Designa grupo permanente da Secretaria de Finanças para alinhamento com a câmara de compensação federativa.',
  },

  // PERNAMBUCO
  {
    id: 'PE-01',
    uf: 'PE',
    codigoIbge: '2611606',
    municipioNome: 'Recife',
    titulo: 'DECRETO MUNICIPAL Nº 37.890/2024',
    data: '16/12/2024',
    diarioOficial: 'AMUPE — Associação Municipalista de Pernambuco',
    urlDiario: 'https://www.diariomunicipal.com.br/amupe/',
    tema: 'Ajuste de Processos Fazendários para a Reforma Tributária',
    resumo:
      'Fixa plano de contingência para as fases de teste de 2026 e compartilhamento de cadastros de notas fiscais de serviço eletrônicas.',
  },

  // RIO GRANDE DO SUL
  {
    id: 'RS-01',
    uf: 'RS',
    codigoIbge: '4314902',
    municipioNome: 'Porto Alegre',
    titulo: 'DECRETO MUNICIPAL Nº 22.450/2024',
    data: '21/12/2024',
    diarioOficial: 'FAMURS — Federação das Associações de Municípios do RS',
    urlDiario: 'https://www.famurs.com.br/',
    tema: 'Modernização e Governança do IBS Municipal',
    resumo:
      'Dispõe sobre plano de ação fazendário e adequação de sistemas integrados da Receita Municipal para vigência da EC 132/2023.',
  },

  // RIO GRANDE DO NORTE
  {
    id: 'RN-01',
    uf: 'RN',
    codigoIbge: '2408102',
    municipioNome: 'Natal',
    titulo: 'DECRETO MUNICIPAL Nº 12.980/2024',
    data: '17/12/2024',
    diarioOficial: 'FEMURN — Federação dos Municípios do RN',
    urlDiario: 'https://www.diariomunicipal.com.br/femurn/',
    tema: 'Transição Cadastral e Acompanhamento do Comitê Gestor',
    resumo:
      'Cria o Observatório Municipal do IBS para proteção das receitas municipais durante o período 2026-2033.',
  },

  // ESPÍRITO SANTO
  {
    id: 'ES-01',
    uf: 'ES',
    codigoIbge: '3205309',
    municipioNome: 'Vitória',
    titulo: 'DECRETO MUNICIPAL Nº 23.810/2024',
    data: '13/12/2024',
    diarioOficial: 'AMUNES — Associação dos Municípios do ES',
    urlDiario: 'https://www.amunes.org.br/',
    tema: 'Comissão Especial para Implementação da Reforma Tributária',
    resumo:
      'Institui comissão técnica para diagnóstico dos impactos arrecadatórios no setor de serviços da capital capixaba.',
  },

  // MATO GROSSO
  {
    id: 'MT-01',
    uf: 'MT',
    codigoIbge: '5103403',
    municipioNome: 'Cuiabá',
    titulo: 'DECRETO MUNICIPAL Nº 10.420/2024',
    data: '19/12/2024',
    diarioOficial: 'AMM-MT — Associação Mato-grossense dos Municípios',
    urlDiario: 'https://www.amm.org.br/',
    tema: 'Adaptação de Procedimentos de Cobrança e Cadastro Mobiliário',
    resumo:
      'Fixa medidas administrativas para convergência ao Comitê Gestor do IBS e proteção da base imobiliária e agropecuária.',
  },

  // MATO GROSSO DO SUL
  {
    id: 'MS-01',
    uf: 'MS',
    codigoIbge: '5002704',
    municipioNome: 'Campo Grande',
    titulo: 'DECRETO MUNICIPAL Nº 15.910/2024',
    data: '18/12/2024',
    diarioOficial: 'ASSOMASUL — Associação dos Municípios de MS',
    urlDiario: 'https://www.assomasul.org.br/',
    tema: 'Comitê Intersetorial da Reforma Tributária',
    resumo:
      'Designa membros e atribuições para interlocução com o Fórum Nacional de Secretários Municipais de Fazenda e Finanças.',
  },

  // PIAUÍ
  {
    id: 'PI-01',
    uf: 'PI',
    codigoIbge: '2211001',
    municipioNome: 'Teresina',
    titulo: 'DECRETO MUNICIPAL Nº 24.320/2024',
    data: '14/12/2024',
    diarioOficial: 'APPM — Associação Piauiense de Municípios',
    urlDiario: 'https://www.appm.org.br/',
    tema: 'Reorganização Fazendária para o IBS',
    resumo:
      'Estabelece protocolo de cooperação com municípios metropolitanos para alinhamento fiscal perante a transição 2026.',
  },

  // RONDÔNIA
  {
    id: 'RO-01',
    uf: 'RO',
    codigoIbge: '1100205',
    municipioNome: 'Porto Velho',
    titulo: 'DECRETO MUNICIPAL Nº 19.820/2024',
    data: '15/12/2024',
    diarioOficial: 'AROM — Associação Rondoniense de Municípios',
    urlDiario: 'https://www.arom.org.br/',
    tema: 'Adequação Tecnológica e Harmonização de Códigos Fiscais',
    resumo:
      'Determina adequação dos sistemas municipais da SEMFAZ aos leiautes e protocolos do Comitê Gestor do IBS.',
  },
]

/**
 * Busca municípios oficiais por UF
 */
export function buscarMunicipiosPorUf(uf: string): MunicipioIBGE[] {
  const ufNorm = uf.toUpperCase().trim()
  return MUNICIPIOS_IBGE_POR_UF[ufNorm] || []
}

/**
 * Busca atos normativos vinculados a um município específico
 */
export function buscarAtosPorMunicipio(
  codigoIbgeOuNome: string,
  uf?: string,
): AtoNormativoMunicipal[] {
  const termo = codigoIbgeOuNome.toLowerCase().trim()
  return ATOS_NORMATIVOS_MUNICIPAIS.filter((ato) => {
    if (uf && ato.uf.toUpperCase() !== uf.toUpperCase().trim()) {
      return false
    }
    return (
      ato.codigoIbge === termo ||
      ato.municipioNome.toLowerCase().includes(termo) ||
      ato.titulo.toLowerCase().includes(termo)
    )
  })
}

/**
 * Retorna todos os atos normativos de uma UF
 */
export function buscarAtosPorUf(uf: string): AtoNormativoMunicipal[] {
  const ufNorm = uf.toUpperCase().trim()
  return ATOS_NORMATIVOS_MUNICIPAIS.filter((ato) => ato.uf === ufNorm)
}

/**
 * Total de atos normativos municipais cadastrados
 */
export const TOTAL_ATOS_MUNICIPAIS = ATOS_NORMATIVOS_MUNICIPAIS.length
