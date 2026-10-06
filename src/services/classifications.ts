import pb from '@/lib/pocketbase/client'
import type { ClassificationItem, ClassificationType } from '@/types/panorama'

// Fallback oficial representativo das 11 tabelas para robustez total offline
export const FALLBACK_CLASSIFICATIONS: ClassificationItem[] = [
  // 1. NOME
  {
    id: 'fb-nome-01',
    tipo: 'Nome',
    codigo: 'PROD-ARROZ-01',
    nome: 'Arroz em grãos beneficiado (Polido / Parboilizado)',
    descricao:
      'Arroz beneficiado, polido ou parboilizado, item fundamental da Cesta Básica Nacional',
    fonte: 'RFB / MAPA',
    tabela_origem: 'Cesta Básica Nacional (LC 214/2025, Anexo I)',
    atualizado_em: '2026-10-01',
    observacoes: 'Alíquota zero no IBS e na CBS (art. 8º da LC 214/2025)',
  },
  {
    id: 'fb-nome-02',
    tipo: 'Nome',
    codigo: 'PROD-FEIJAO-02',
    nome: 'Feijão de todas as espécies',
    descricao:
      'Feijões de qualquer variedade para consumo humano (preto, carioca, fradinho, branco)',
    fonte: 'RFB / MAPA',
    tabela_origem: 'Cesta Básica Nacional (LC 214/2025, Anexo I)',
    atualizado_em: '2026-10-01',
    observacoes: 'Alíquota zero de IBS e CBS',
  },
  {
    id: 'fb-nome-03',
    tipo: 'Nome',
    codigo: 'PROD-CARNE-03',
    nome: 'Carnes bovina, suína, ovina, caprina e de aves',
    descricao: 'Carnes frescas, resfriadas ou congeladas destinadas à alimentação humana',
    fonte: 'RFB / MAPA',
    tabela_origem: 'Cesta Básica Nacional (LC 214/2025, Anexo I)',
    atualizado_em: '2026-10-01',
    observacoes: 'Alíquota zero de IBS/CBS nos termos do Anexo I da LC 214',
  },
  {
    id: 'fb-nome-04',
    tipo: 'Nome',
    codigo: 'PROD-LEITE-04',
    nome: 'Leite pasteurizado, UHT e em pó',
    descricao: 'Leite fluído integral, desnatado, semidesnatado e leite em pó para consumo',
    fonte: 'RFB / MAPA',
    tabela_origem: 'Cesta Básica Nacional (LC 214/2025, Anexo I)',
    atualizado_em: '2026-10-01',
    observacoes: 'Item essencial com desoneração integral',
  },
  {
    id: 'fb-nome-05',
    tipo: 'Nome',
    codigo: 'PROD-MEDIC-05',
    nome: 'Medicamentos para tratamento de neoplasias (câncer)',
    descricao: 'Fármacos antineoplásicos e imunoterápicos para tratamento oncológico',
    fonte: 'RFB / ANVISA',
    tabela_origem: 'Anexo VI da LC 214/2025 (Redução 100% de Alíquota)',
    atualizado_em: '2026-10-01',
    observacoes: 'Alíquota reduzida a 0% do IBS e CBS',
  },
  {
    id: 'fb-nome-06',
    tipo: 'Nome',
    codigo: 'ATIV-DEV-06',
    nome: 'Desenvolvimento e licenciamento de softwares e plataformas digitais',
    descricao: 'Atividade de desenvolvimento contínuo de sistemas, SaaS e licenças de computação',
    fonte: 'IBGE / RFB',
    tabela_origem: 'Seção 6F da Reforma Tributária (LC 214/2025)',
    atualizado_em: '2026-10-01',
    observacoes: 'Regime padrão com não-cumulatividade plena e direito a crédito amplo',
  },
  {
    id: 'fb-nome-07',
    tipo: 'Nome',
    codigo: 'ATIV-CONT-07',
    nome: 'Serviços de contabilidade, auditoria e assessoria administrativa',
    descricao:
      'Serviços contábeis, planejamento tributário, auditoria contábil e consultoria fiscal',
    fonte: 'CFC / RFB',
    tabela_origem: 'Profissões Regulamentadas (LC 214/2025, art. 136 e Anexo XIV)',
    atualizado_em: '2026-10-01',
    observacoes:
      'Redução de 30% nas alíquotas do IBS e CBS para sociedades profissionais qualificadas',
  },

  // 2. NCM
  {
    id: 'fb-ncm-01',
    tipo: 'NCM',
    codigo: '1006.30.21',
    nome: 'Arroz parboilizado polido',
    descricao: 'Arroz semibranqueado ou branqueado, mesmo polido ou glaciado, parboilizado',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Cesta Básica Nacional (Alíquota zero)',
  },
  {
    id: 'fb-ncm-02',
    tipo: 'NCM',
    codigo: '0713.33.19',
    nome: 'Feijão preto',
    descricao: 'Feijão comum (Phaseolus vulgaris), preto, para semeadura ou consumo',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Cesta Básica Nacional (Alíquota zero)',
  },
  {
    id: 'fb-ncm-03',
    tipo: 'NCM',
    codigo: '0201.30.00',
    nome: 'Carnes desossadas de bovino, frescas ou refrigeradas',
    descricao: 'Carnes de animais da espécie bovina, frescas ou refrigeradas, desossadas',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Cesta Básica Nacional (Alíquota zero)',
  },
  {
    id: 'fb-ncm-04',
    tipo: 'NCM',
    codigo: '0401.20.10',
    nome: 'Leite UHT',
    descricao: 'Leite integral UHT (Ultra High Temperature), com teor de gordura > 1% e <= 6%',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Cesta Básica Nacional (Alíquota zero)',
  },
  {
    id: 'fb-ncm-05',
    tipo: 'NCM',
    codigo: '3004.90.99',
    nome: 'Outros medicamentos dosificados',
    descricao:
      'Outros medicamentos constituídos por produtos misturados ou não misturados, para fins terapêuticos',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Anexo V ou VI da LC 214/2025 (Redução 60% ou 100%)',
  },
  {
    id: 'fb-ncm-06',
    tipo: 'NCM',
    codigo: '8471.30.12',
    nome: 'Computadores portáteis (laptops/notebooks)',
    descricao: 'Máquinas automáticas para processamento de dados, portáteis, de peso <= 10 kg',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Bens de capital e tecnologia; alíquota padrão com crédito integral',
  },
  {
    id: 'fb-ncm-07',
    tipo: 'NCM',
    codigo: '2202.10.00',
    nome: 'Refrigerantes e bebidas aromatizadas',
    descricao:
      'Águas, incluindo as águas minerais e gaseificadas, adicionadas de açúcar ou aromatizadas',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Sujeito ao Imposto Seletivo (IS) conforme art. 393 da LC 214/2025',
  },
  {
    id: 'fb-ncm-08',
    tipo: 'NCM',
    codigo: '2402.20.00',
    nome: 'Cigarros contendo tabaco',
    descricao: 'Cigarros contendo tabaco para consumo',
    fonte: 'RFB / Mercosul',
    tabela_origem: 'TIPI / Tarifa Externa Comum (TEC)',
    atualizado_em: '2026-10-01',
    observacoes: 'Sujeito ao Imposto Seletivo (IS) com alíquota específica e ad valorem',
  },

  // 3. cClassTrib
  {
    id: 'fb-cclasstrib-01',
    tipo: 'cClassTrib',
    codigo: '000001',
    nome: 'Operação com incidência integral das alíquotas padrão de IBS e CBS',
    descricao:
      'Classificação tributária geral para operações tributadas integralmente pelas alíquotas de referência',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Regime regular do IBS e da CBS',
  },
  {
    id: 'fb-cclasstrib-02',
    tipo: 'cClassTrib',
    codigo: '000002',
    nome: 'Cesta Básica Nacional de Alimentos — Alíquota Zero',
    descricao:
      'Operações com produtos destinados à alimentação humana contemplados pelo Anexo I da LC 214/2025',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Alíquotas do IBS e da CBS reduzidas a 0% (zero)',
  },
  {
    id: 'fb-cclasstrib-03',
    tipo: 'cClassTrib',
    codigo: '000003',
    nome: 'Produtos Agropecuários e Alimentos — Redução de 60%',
    descricao:
      'Operações com produtos agropecuários, aquícolas, pesqueiros e insumos com alíquota reduzida em 60%',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Anexo II da LC 214/2025 (Fator multiplicador 0,40)',
  },
  {
    id: 'fb-cclasstrib-04',
    tipo: 'cClassTrib',
    codigo: '000004',
    nome: 'Serviços de Saúde e Dispositivos Médicos — Redução de 60%',
    descricao:
      'Serviços de saúde humana, laboratoriais, hospitalares e dispositivos médicos do Anexo III da LC 214',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Redução de 60% na alíquota de referência',
  },
  {
    id: 'fb-cclasstrib-05',
    tipo: 'cClassTrib',
    codigo: '000005',
    nome: 'Serviços de Educação e Ensino — Redução de 60%',
    descricao:
      'Serviços de educação infantil, ensino fundamental, médio, técnico e superior (Anexo IV da LC 214)',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Redução de 60% da alíquota padrão',
  },
  {
    id: 'fb-cclasstrib-06',
    tipo: 'cClassTrib',
    codigo: '000006',
    nome: 'Medicamentos e Dispositivos Médicos — Isenção / Redução de 100%',
    descricao: 'Medicamentos essenciais do Anexo VI da LC 214/2025 com redução integral a zero',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Redução de 100% (alíquota zero)',
  },
  {
    id: 'fb-cclasstrib-07',
    tipo: 'cClassTrib',
    codigo: '000007',
    nome: 'Profissões Regulamentadas — Redução de 30%',
    descricao:
      'Serviços de profissões intelectuais de natureza científica, literária ou artística fiscalizadas por conselho',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Anexo XIV da LC 214/2025 (Advogados, Contadores, Engenheiros, Médicos PJ)',
  },
  {
    id: 'fb-cclasstrib-08',
    tipo: 'cClassTrib',
    codigo: '000008',
    nome: 'Imposto Seletivo (IS) — Incidência Monofásica',
    descricao:
      'Operações com bens prejudiciais à saúde ou ao meio ambiente sujeitos ao IS (art. 393 da LC 214)',
    fonte: 'CGIBS / RFB / ENCAT',
    tabela_origem: 'IT 2025.002 v1.70 — Tabela de Classificação Tributária IBS/CBS',
    atualizado_em: '2026-10-01',
    observacoes: 'Incidência monofásica com base específica',
  },

  // 4. CST
  {
    id: 'fb-cst-01',
    tipo: 'CST',
    codigo: '01',
    nome: 'Operação tributada integralmente',
    descricao: 'Tributação integral da operação pelas alíquotas regulares vigentes de IBS e CBS',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Permite apropriação e transferência de crédito',
  },
  {
    id: 'fb-cst-02',
    tipo: 'CST',
    codigo: '02',
    nome: 'Operação tributada com alíquota reduzida',
    descricao: 'Tributação sob regimes diferenciados de redução de 30%, 60% ou alíquota favorecida',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Exige indicação do cClassTrib correspondente',
  },
  {
    id: 'fb-cst-03',
    tipo: 'CST',
    codigo: '03',
    nome: 'Operação com alíquota zero',
    descricao: 'Operações expressamente desoneradas com alíquota de 0% (ex: Cesta Básica Anexo I)',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Mantém manutenção de crédito nas hipóteses autorizadas por lei',
  },
  {
    id: 'fb-cst-04',
    tipo: 'CST',
    codigo: '04',
    nome: 'Operação imune ou não tributada',
    descricao:
      'Imunidades constitucionais (exportações, templos, livros, jornais, partidos políticos)',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Art. 156-A, § 5º da CF e Seção 4 da LC 214/2025',
  },
  {
    id: 'fb-cst-05',
    tipo: 'CST',
    codigo: '05',
    nome: 'Operação com suspensão ou diferimento',
    descricao:
      'Tributação com exigibilidade suspensa ou diferida para etapas posteriores da cadeia',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Regimes aduaneiros especiais, REPETRO, industrialização sob encomenda',
  },
  {
    id: 'fb-cst-06',
    tipo: 'CST',
    codigo: '06',
    nome: 'Operação sob regime específico',
    descricao:
      'Combustíveis (monofasia), serviços financeiros, planos de saúde, bens imóveis, consórcios',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Capítulo dos Regimes Específicos da LC 214/2025',
  },
  {
    id: 'fb-cst-49',
    tipo: 'CST',
    codigo: '49',
    nome: 'Outras operações de saída tributadas',
    descricao: 'Demais operações de saídas tributadas não enquadradas nos códigos anteriores',
    fonte: 'RFB / CGIBS / SPED',
    tabela_origem: 'Tabela de CST do IBS e da CBS (DF-e / SPED)',
    atualizado_em: '2026-10-01',
    observacoes: 'Uso residual regulamentar',
  },

  // 5. cCredPres
  {
    id: 'fb-ccredpres-01',
    tipo: 'cCredPres',
    codigo: '0101',
    nome: 'Aquisição de produtor rural pessoa física não contribuinte',
    descricao:
      'Crédito presumido concedido aos adquirentes de produtos agropecuários in natura de produtores rurais PF',
    fonte: 'SVRS / RFB / CGIBS',
    tabela_origem: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
    atualizado_em: '2026-10-01',
    observacoes: 'Art. 168 da LC 214/2025 — percentual fixado em ato conjunto',
  },
  {
    id: 'fb-ccredpres-02',
    tipo: 'cCredPres',
    codigo: '0102',
    nome: 'Aquisição de transportador autônomo de carga (TAC)',
    descricao:
      'Crédito presumido incidente sobre serviços de frete contratados de transportador autônomo PF',
    fonte: 'SVRS / RFB / CGIBS',
    tabela_origem: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
    atualizado_em: '2026-10-01',
    observacoes: 'Art. 169 da LC 214/2025',
  },
  {
    id: 'fb-ccredpres-03',
    tipo: 'cCredPres',
    codigo: '0103',
    nome: 'Aquisições de resíduos sólidos e materiais recicláveis de catadores PF',
    descricao:
      'Crédito presumido na aquisição de sucata, papel, vidro e plásticos de cooperativas e catadores',
    fonte: 'SVRS / RFB / CGIBS',
    tabela_origem: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
    atualizado_em: '2026-10-01',
    observacoes: 'Incentivo à economia circular e reciclagem (art. 170 da LC 214/2025)',
  },
  {
    id: 'fb-ccredpres-04',
    tipo: 'cCredPres',
    codigo: '0104',
    nome: 'Bens do ativo imobilizado na transição (saldo remanescente ICMS/PIS/Cofins)',
    descricao:
      'Aproveitamento do crédito presumido de transição sobre bens adquiridos até 31/12/2026',
    fonte: 'SVRS / RFB / CGIBS',
    tabela_origem: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
    atualizado_em: '2026-10-01',
    observacoes: 'Arts. 343 a 348 da LC 214/2025 (Transição 2026–2033)',
  },
  {
    id: 'fb-ccredpres-05',
    tipo: 'cCredPres',
    codigo: '0105',
    nome: 'ZFM — Zona Franca de Manaus e Áreas de Livre Comércio',
    descricao:
      'Crédito presumido regional para compensar a desoneração de mercadorias produzidas no polo industrial',
    fonte: 'SVRS / RFB / CGIBS',
    tabela_origem: 'Tabela de Crédito Presumido do IBS/CBS — Portal DF-e',
    atualizado_em: '2026-10-01',
    observacoes:
      'Garantia constitucional do diferencial de competitividade da ZFM (art. 444 da LC 214)',
  },

  // 6. CEST
  {
    id: 'fb-cest-01',
    tipo: 'CEST',
    codigo: '01.001.00',
    nome: 'Autopeças — Catalisadores',
    descricao: 'Catalisadores em colmeia cerâmica ou metálica para veículos automotores',
    fonte: 'CONFAZ',
    tabela_origem: 'Convênio ICMS 142/2018 — Anexo II (Autopeças)',
    atualizado_em: '2026-10-01',
    observacoes:
      'NCM 8421.39.90 — Segmento de autopeças sujeito ao regime de substituição tributária estadual',
  },
  {
    id: 'fb-cest-02',
    tipo: 'CEST',
    codigo: '03.001.00',
    nome: 'Cervejas e chopes',
    descricao: 'Cerveja de malte e chope em embalagens retornáveis ou descartáveis',
    fonte: 'CONFAZ',
    tabela_origem: 'Convênio ICMS 142/2018 — Anexo IV (Cervejas e Bebidas)',
    atualizado_em: '2026-10-01',
    observacoes: 'NCM 2203.00.00 — Substituição tributária estadual e IS na Reforma',
  },
  {
    id: 'fb-cest-03',
    tipo: 'CEST',
    codigo: '06.001.00',
    nome: 'Combustíveis — Gasolina automotiva',
    descricao: 'Gasolina de aviação e gasolina automotiva comum e aditivada',
    fonte: 'CONFAZ',
    tabela_origem: 'Convênio ICMS 142/2018 — Anexo VII (Combustíveis e Lubrificantes)',
    atualizado_em: '2026-10-01',
    observacoes: 'NCM 2710.12.59 — Tributação monofásica por unidade de medida',
  },
  {
    id: 'fb-cest-04',
    tipo: 'CEST',
    codigo: '13.001.00',
    nome: 'Medicamentos e produtos farmacêuticos de uso humano',
    descricao: 'Medicamentos de referência, genéricos e similares para uso humano',
    fonte: 'CONFAZ',
    tabela_origem: 'Convênio ICMS 142/2018 — Anexo XIV (Medicamentos)',
    atualizado_em: '2026-10-01',
    observacoes: 'NCM 3003 e 3004 — PMC (Preço Máximo ao Consumidor) Anvisa',
  },
  {
    id: 'fb-cest-05',
    tipo: 'CEST',
    codigo: '17.001.00',
    nome: 'Produtos alimentícios — Chocolates',
    descricao: 'Chocolate branco e chocolates em barras, tabletes ou blocos',
    fonte: 'CONFAZ',
    tabela_origem: 'Convênio ICMS 142/2018 — Anexo XVII (Produtos Alimentícios)',
    atualizado_em: '2026-10-01',
    observacoes: 'NCM 1806.31.10 / 1806.31.20',
  },
  {
    id: 'fb-cest-06',
    tipo: 'CEST',
    codigo: '21.001.00',
    nome: 'Tintas, vernizes e outras coberturas',
    descricao: 'Tintas e vernizes à base de polímeros sintéticos dispersos em meio aquoso',
    fonte: 'CONFAZ',
    tabela_origem: 'Convênio ICMS 142/2018 — Anexo XXI (Materiais de Construção)',
    atualizado_em: '2026-10-01',
    observacoes: 'NCM 3208 e 3209',
  },

  // 7. MVA-ST
  {
    id: 'fb-mvast-01',
    tipo: 'MVA-ST',
    codigo: 'MVA-AUTO-40',
    nome: 'Autopeças — MVA Original e Ajustada (SP / MG / RJ)',
    descricao:
      'Margem de Valor Agregado padrão de 40% (original 40,00%, ajustada 59,60% para alíquota interestadual de 12%)',
    fonte: 'CONFAZ / Sefaz SP / Sefaz MG',
    tabela_origem: 'Portal Nacional da Substituição Tributária (CONFAZ)',
    atualizado_em: '2026-10-01',
    observacoes: 'CEST 01.001.00 a 01.999.00 — Protocolo ICMS 41/2008',
  },
  {
    id: 'fb-mvast-02',
    tipo: 'MVA-ST',
    codigo: 'MVA-BEB-140',
    nome: 'Cervejas e Bebidas Frias — MVA Padrão',
    descricao:
      'Margem de 140% para cervejas e chopes quando não fixado Preço Médio Ponderado a Consumidor Final (PMPF)',
    fonte: 'CONFAZ / Protocolo 11/91',
    tabela_origem: 'Tabela de MVA-ST de Bebidas Frias (CONFAZ)',
    atualizado_em: '2026-10-01',
    observacoes: 'CEST 03.001.00 a 03.003.00',
  },
  {
    id: 'fb-mvast-03',
    tipo: 'MVA-ST',
    codigo: 'MVA-MED-38',
    nome: 'Medicamentos — PMC e MVA residual',
    descricao:
      'Base prioritária pelo Preço Máximo ao Consumidor (PMC); MVA residual de 38,24% na ausência de tabela',
    fonte: 'CONFAZ / CMED / Anvisa',
    tabela_origem: 'Convênio ICMS 234/2017 e Portal ST CONFAZ',
    atualizado_em: '2026-10-01',
    observacoes: 'CEST 13.001.00 a 13.016.00',
  },
  {
    id: 'fb-mvast-04',
    tipo: 'MVA-ST',
    codigo: 'MVA-ALIM-45',
    nome: 'Produtos Alimentícios — MVA Original 45%',
    descricao:
      'Margem de 45% sobre produtos da indústria alimentícia em operações internas e interestaduais ajustadas',
    fonte: 'CONFAZ / Sefaz RS / Sefaz PR',
    tabela_origem: 'Protocolos ICMS 108/2013 e 119/2012',
    atualizado_em: '2026-10-01',
    observacoes: 'CEST 17.001.00',
  },
  {
    id: 'fb-mvast-05',
    tipo: 'MVA-ST',
    codigo: 'MVA-MATCON-35',
    nome: 'Materiais de Construção — MVA Original 35% a 51%',
    descricao:
      'Margem de valor agregado aplicável a tintas, vernizes, argamassas e condutores elétricos',
    fonte: 'CONFAZ / Protocolo 32/2014',
    tabela_origem: 'Portal Nacional ST CONFAZ',
    atualizado_em: '2026-10-01',
    observacoes: 'CEST 21.001.00',
  },

  // 8. CFOP
  {
    id: 'fb-cfop-01',
    tipo: 'CFOP',
    codigo: '1.101',
    nome: 'Compra para industrialização ou produção rural',
    descricao:
      'Classificam-se neste código as compras de mercadorias a serem utilizadas em processo de industrialização ou produção rural',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970 consolidado 2026)',
    atualizado_em: '2026-10-01',
    observacoes: 'Entrada interna de insumos com direito a crédito de IBS e CBS',
  },
  {
    id: 'fb-cfop-02',
    tipo: 'CFOP',
    codigo: '1.102',
    nome: 'Compra para comercialização',
    descricao: 'Classificam-se neste código as compras de mercadorias a serem comercializadas',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes: 'Entrada interna de mercadorias para revenda com crédito pleno',
  },
  {
    id: 'fb-cfop-03',
    tipo: 'CFOP',
    codigo: '2.102',
    nome: 'Compra para comercialização em operação interestadual',
    descricao:
      'Classificam-se neste código as compras de mercadorias a serem comercializadas, decorrentes de operações interestaduais',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes:
      'Entrada de outro Estado — na RT o IBS passa a pertencer integralmente ao Estado de destino',
  },
  {
    id: 'fb-cfop-04',
    tipo: 'CFOP',
    codigo: '3.101',
    nome: 'Compra para industrialização ou produção rural (Importação)',
    descricao:
      'Classificam-se neste código as compras de mercadorias a serem utilizadas em processo de industrialização, decorrentes de importação',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes: 'Entrada do exterior — recolhimento de IBS/CBS na importação',
  },
  {
    id: 'fb-cfop-05',
    tipo: 'CFOP',
    codigo: '5.101',
    nome: 'Venda de produção do estabelecimento',
    descricao:
      'Classificam-se neste código as vendas de produtos industrializados ou produzidos pelo próprio estabelecimento',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes: 'Saída interna de produção própria — fato gerador pleno de IBS e CBS',
  },
  {
    id: 'fb-cfop-06',
    tipo: 'CFOP',
    codigo: '5.102',
    nome: 'Venda de mercadoria adquirida ou recebida de terceiros',
    descricao:
      'Classificam-se neste código as vendas de mercadorias adquiridas ou recebidas de terceiros para comercialização',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes: 'Saída interna de mercadoria comercializada',
  },
  {
    id: 'fb-cfop-07',
    tipo: 'CFOP',
    codigo: '6.102',
    nome: 'Venda interestadual de mercadoria de terceiros',
    descricao:
      'Classificam-se neste código as vendas interestaduais de mercadorias adquiridas ou recebidas de terceiros',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes: 'Princípio do destino — tributação na UF consumidora da mercadoria',
  },
  {
    id: 'fb-cfop-08',
    tipo: 'CFOP',
    codigo: '7.101',
    nome: 'Venda de produção para o exterior (Exportação)',
    descricao:
      'Classificam-se neste código as vendas de produtos industrializados pelo estabelecimento destinados ao exterior',
    fonte: 'CONFAZ / Receita Federal',
    tabela_origem: 'Tabela CFOP oficial (Ajuste SINIEF s/nº de 1970)',
    atualizado_em: '2026-10-01',
    observacoes: 'Imunidade constitucional nas exportações — crédito acumulado ressarcível',
  },

  // 9. NBS
  {
    id: 'fb-nbs-01',
    tipo: 'NBS',
    codigo: '1.0101.10.00',
    nome: 'Serviços jurídicos e de advocacia contenciosa',
    descricao:
      'Serviços de representação e assistência jurídica em juízo, processos cíveis, trabalhistas e tributários',
    fonte: 'RFB / MDIC / Codex NBS 2.0',
    tabela_origem:
      'Nomenclatura Brasileira de Serviços (Decreto 7.708 / Portaria Conjunta RFB/SCS)',
    atualizado_em: '2026-10-01',
    observacoes: 'Profissão Regulamentada — Anexo XIV da LC 214/2025 (Redução 30%)',
  },
  {
    id: 'fb-nbs-02',
    tipo: 'NBS',
    codigo: '1.0102.10.00',
    nome: 'Serviços de contabilidade, auditoria e escrituração fiscal',
    descricao:
      'Serviços contábeis de elaboração de balanços, declarações fiscais e auditoria independente',
    fonte: 'RFB / MDIC / Codex NBS 2.0',
    tabela_origem: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
    atualizado_em: '2026-10-01',
    observacoes: 'Profissão Regulamentada — Redução de 30% nas alíquotas do IBS/CBS',
  },
  {
    id: 'fb-nbs-03',
    tipo: 'NBS',
    codigo: '1.0201.20.00',
    nome: 'Serviços de consultoria em tecnologia da informação (TI)',
    descricao:
      'Consultoria técnica em sistemas computacionais, arquitetura de software e governança digital',
    fonte: 'RFB / MDIC / Codex NBS 2.0',
    tabela_origem: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
    atualizado_em: '2026-10-01',
    observacoes: 'Tributação padrão com aproveitamento amplo de crédito',
  },
  {
    id: 'fb-nbs-04',
    tipo: 'NBS',
    codigo: '1.0301.11.00',
    nome: 'Serviços médicos de clínica geral e especialidades',
    descricao: 'Atendimento médico ambulatorial, consultas especializadas e telemedicina',
    fonte: 'RFB / MDIC / Codex NBS 2.0',
    tabela_origem: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
    atualizado_em: '2026-10-01',
    observacoes: 'Anexo III da LC 214/2025 (Redução de 60%)',
  },
  {
    id: 'fb-nbs-05',
    tipo: 'NBS',
    codigo: '1.0401.10.00',
    nome: 'Serviços de ensino fundamental e médio regular',
    descricao: 'Serviços educacionais prestados por escolas e colégios de educação básica',
    fonte: 'RFB / MDIC / Codex NBS 2.0',
    tabela_origem: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
    atualizado_em: '2026-10-01',
    observacoes: 'Anexo IV da LC 214/2025 (Redução de 60%)',
  },
  {
    id: 'fb-nbs-06',
    tipo: 'NBS',
    codigo: '1.0501.10.00',
    nome: 'Serviços de intermediação e plataformas digitais',
    descricao:
      'Intermediação de negócios, marketplaces e veiculação de publicidade em meio digital',
    fonte: 'RFB / MDIC / Codex NBS 2.0',
    tabela_origem: 'Nomenclatura Brasileira de Serviços (NBS 2.0)',
    atualizado_em: '2026-10-01',
    observacoes:
      'Responsabilidade tributária por solidariedade na falta de recolhimento (art. 21 da LC 214)',
  },

  // 10. CNAE 2.3
  {
    id: 'fb-cnae-01',
    tipo: 'CNAE 2.3',
    codigo: '6920-6/01',
    nome: 'Atividades de contabilidade',
    descricao:
      'Serviços de registro contábil de transações comerciais, elaboração de demonstrações contábeis e consultoria contábil',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (Comissão Nacional de Classificação)',
    atualizado_em: '2026-10-01',
    observacoes: 'Divisão 69 (Atividades jurídicas, de contabilidade e de auditoria)',
  },
  {
    id: 'fb-cnae-02',
    tipo: 'CNAE 2.3',
    codigo: '6911-7/01',
    nome: 'Serviços advocatícios',
    descricao: 'Assessoria jurídica, consultoria contenciosa e preventiva prestada por advogados',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (IBGE)',
    atualizado_em: '2026-10-01',
    observacoes: 'Profissão Regulamentada (Redução 30%)',
  },
  {
    id: 'fb-cnae-03',
    tipo: 'CNAE 2.3',
    codigo: '6201-5/01',
    nome: 'Desenvolvimento de programas de computador sob encomenda',
    descricao: 'Criação e desenvolvimento de softwares customizados para clientes específicos',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (IBGE)',
    atualizado_em: '2026-10-01',
    observacoes: 'Divisão 62 (Atividades dos serviços de tecnologia da informação)',
  },
  {
    id: 'fb-cnae-04',
    tipo: 'CNAE 2.3',
    codigo: '8610-1/01',
    nome: 'Atividades de atendimento hospitalar, exceto pronto-socorro',
    descricao: 'Serviços hospitalares com internação para tratamento clínico ou cirúrgico',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (IBGE)',
    atualizado_em: '2026-10-01',
    observacoes: 'Serviços de Saúde — Anexo III da LC 214/2025 (Redução 60%)',
  },
  {
    id: 'fb-cnae-05',
    tipo: 'CNAE 2.3',
    codigo: '8531-7/00',
    nome: 'Educação superior — graduação',
    descricao: 'Cursos de graduação universitária e pós-graduação lato e stricto sensu',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (IBGE)',
    atualizado_em: '2026-10-01',
    observacoes: 'Serviços de Educação — Anexo IV da LC 214/2025 (Redução 60%)',
  },
  {
    id: 'fb-cnae-06',
    tipo: 'CNAE 2.3',
    codigo: '4711-3/01',
    nome: 'Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios (hipermercados)',
    descricao: 'Comércio de alimentos, bebidas, higiene e limpeza com área de vendas ampla',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (IBGE)',
    atualizado_em: '2026-10-01',
    observacoes: 'Mix de produtos: Cesta Básica (zero), alíquota reduzida e padrão',
  },
  {
    id: 'fb-cnae-07',
    tipo: 'CNAE 2.3',
    codigo: '0111-3/01',
    nome: 'Cultivo de arroz',
    descricao: 'Produção agrícola de arroz irrigado ou de sequeiro para fornecimento',
    fonte: 'IBGE / CONCLA',
    tabela_origem: 'CNAE Subclasses 2.3 (IBGE)',
    atualizado_em: '2026-10-01',
    observacoes: 'Produtor rural com direito a crédito presumido pelo art. 168 da LC 214',
  },

  // 11. cBenef
  {
    id: 'fb-cbenef-01',
    tipo: 'cBenef',
    codigo: 'SP000001',
    nome: 'Isenção — Cesta Básica Paulista (Art. 3º do Anexo II do RICMS/SP)',
    descricao:
      'Redução de base de cálculo e desonerações estaduais para itens da cesta de alimentos em São Paulo',
    fonte: 'Sefaz SP',
    tabela_origem: 'Tabela de cBenef de São Paulo (Portaria CAT 162/2008 atualizada 2026)',
    atualizado_em: '2026-10-01',
    observacoes: 'Substituído gradualmente pela Cesta Básica Nacional da LC 214/2025',
  },
  {
    id: 'fb-cbenef-02',
    tipo: 'cBenef',
    codigo: 'RS051001',
    nome: 'Diferimento parcial de ICMS nas operações internas (RS)',
    descricao:
      'Diferimento de parcela do imposto devido em saídas internas para contribuintes industriais no RS',
    fonte: 'Sefaz RS',
    tabela_origem: 'Tabela de cBenef da SEFAZ Virtual do RS (Decreto 37.699/97)',
    atualizado_em: '2026-10-01',
    observacoes: 'Válido na transição até a unificação no IBS',
  },
  {
    id: 'fb-cbenef-03',
    tipo: 'cBenef',
    codigo: 'PR800001',
    nome: 'Crédito presumido do agronegócio paranaense',
    descricao: 'Benefício fiscal concedido a cooperativas e agroindústrias do Paraná',
    fonte: 'Sefaz PR',
    tabela_origem: 'Tabela de cBenef do Estado do Paraná (Anexo VII do RICMS/PR)',
    atualizado_em: '2026-10-01',
    observacoes: 'Convalidação dos incentivos regionais conforme art. 385 da LC 214/2025',
  },
  {
    id: 'fb-cbenef-04',
    tipo: 'cBenef',
    codigo: 'RJ800002',
    nome: 'Redução de base de cálculo — Operações de refino e distribuição (RJ)',
    descricao:
      'Tratamento tributário especial nas operações com combustíveis e derivados no Estado do Rio de Janeiro',
    fonte: 'Sefaz RJ',
    tabela_origem: 'Tabela de Benefícios Fiscais da SEFAZ-RJ',
    atualizado_em: '2026-10-01',
    observacoes: 'Substituição pelo regime monofásico do IBS/CBS',
  },
  {
    id: 'fb-cbenef-05',
    tipo: 'cBenef',
    codigo: 'GO020005',
    nome: 'Incentivo Produzir / Fomentar (Goiás)',
    descricao:
      'Programa de atração de indústrias mediante diferimento e financiamento fiscal em Goiás',
    fonte: 'Sefaz GO',
    tabela_origem: 'Tabela de cBenef de Goiás (Decreto 4.852/97)',
    atualizado_em: '2026-10-01',
    observacoes: 'Fundo de Compensação de Benefícios Fiscais previsto na EC 132/2023',
  },
]

// Normaliza o tipo retornado pelo banco (ex: CNAE_2_3 -> CNAE 2.3)
export function normalizeClassificationType(rawTipo: string): ClassificationType {
  if (rawTipo === 'CNAE_2_3' || rawTipo === 'CNAE 2.3') return 'CNAE 2.3'
  return rawTipo as ClassificationType
}

export interface FetchClassificationsParams {
  tipo?: string
  termo?: string
  page?: number
  perPage?: number
  sortBy?: 'codigo' | 'descricao' | 'nome' | 'tipo'
  sortDirection?: 'asc' | 'desc'
}

export interface FetchClassificationsResult {
  items: ClassificationItem[]
  totalItems: number
  page: number
  perPage: number
  totalPages: number
  source: 'database' | 'fallback'
}

export interface OfficialTableCountsResult {
  grandTotal: number
  counts: Record<string, number>
  lastUpdated?: string
}

export async function fetchClassificationCounts(): Promise<OfficialTableCountsResult> {
  try {
    const data = await pb.send<any>('/backend/v1/import-classifications', {
      method: 'GET',
    })
    if (data && data.success && data.counts) {
      return {
        grandTotal: data.grandTotal || 0,
        counts: data.counts,
        lastUpdated: data.timestamp,
      }
    }
  } catch {
    /* intentionally ignored */
  }

  // Fallback counting a partir de FALLBACK_CLASSIFICATIONS
  const fallbackCounts: Record<string, number> = {}
  for (const item of FALLBACK_CLASSIFICATIONS) {
    fallbackCounts[item.tipo] = (fallbackCounts[item.tipo] || 0) + 1
  }
  return {
    grandTotal: FALLBACK_CLASSIFICATIONS.length,
    counts: fallbackCounts,
  }
}

export async function triggerOfficialImport(
  target: 'NCM' | 'CEST' | 'ALL' = 'NCM',
  limit: number = 0,
) {
  try {
    const data = await pb.send<any>('/backend/v1/import-classifications', {
      method: 'POST',
      body: { target, limit },
    })
    return data
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * Busca registros da coleção classifications no PocketBase com suporte a filtro, ordenação e paginação.
 * Se houver qualquer falha de rede/banco, recorre ao fallback completo em memória.
 */
export async function fetchClassifications(
  params: FetchClassificationsParams = {},
): Promise<FetchClassificationsResult> {
  const {
    tipo = 'TODOS',
    termo = '',
    page = 1,
    perPage = 50,
    sortBy = 'codigo',
    sortDirection = 'asc',
  } = params

  try {
    const filterParts: string[] = []

    if (tipo && tipo !== 'TODOS') {
      const dbTipo = tipo === 'CNAE 2.3' ? 'CNAE_2_3' : tipo
      filterParts.push(`tipo = "${dbTipo}"`)
    }

    if (termo && termo.trim()) {
      const sanitized = termo.trim().replace(/"/g, '\\"')
      filterParts.push(
        `(codigo ~ "${sanitized}" || descricao ~ "${sanitized}" || nome ~ "${sanitized}" || fonte ~ "${sanitized}" || observacoes ~ "${sanitized}")`,
      )
    }

    const sortPrefix = sortDirection === 'desc' ? '-' : ''
    const sortField = sortBy === 'nome' ? 'nome' : sortBy === 'descricao' ? 'descricao' : 'codigo'
    const sortExpr = `${sortPrefix}${sortField}`

    const res = await pb.collection('classifications').getList(page, perPage, {
      filter: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
      sort: sortExpr,
      requestKey: null,
    })

    const items: ClassificationItem[] = res.items.map((r) => ({
      id: r.id,
      tipo: normalizeClassificationType(r.tipo),
      codigo: r.codigo,
      descricao: r.descricao,
      nome: r.nome || '',
      fonte: r.fonte,
      tabela_origem: r.tabela_origem || '',
      atualizado_em: r.atualizado_em || '',
      observacoes: r.observacoes || '',
      created: r.created,
      updated: r.updated,
    }))

    return {
      items,
      totalItems: res.totalItems,
      page: res.page,
      perPage: res.perPage,
      totalPages: res.totalPages,
      source: 'database',
    }
  } catch (err) {
    console.warn('[fetchClassifications] Usando fallback offline:', err)

    // Filtra e pagina no fallback em memória
    let filtered = [...FALLBACK_CLASSIFICATIONS]

    if (tipo && tipo !== 'TODOS') {
      filtered = filtered.filter((i) => i.tipo === tipo)
    }

    if (termo && termo.trim()) {
      const norm = (s?: string) =>
        (s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

      const t = norm(termo.trim())
      filtered = filtered.filter(
        (i) =>
          norm(i.codigo).includes(t) ||
          norm(i.descricao).includes(t) ||
          norm(i.nome).includes(t) ||
          norm(i.fonte).includes(t) ||
          norm(i.observacoes).includes(t),
      )
    }

    // Ordenação
    filtered.sort((a, b) => {
      const valA = (a[sortBy] || a.codigo || '').toLowerCase()
      const valB = (b[sortBy] || b.codigo || '').toLowerCase()
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const offset = (page - 1) * perPage
    const pagedItems = filtered.slice(offset, offset + perPage)

    return {
      items: pagedItems,
      totalItems,
      page,
      perPage,
      totalPages,
      source: 'fallback',
    }
  }
}
