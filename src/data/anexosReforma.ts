/**
 * Catálogo Oficial dos Anexos da Reforma Tributária (LC 214/2025 e EC 132/2023)
 *
 * Baseado nos textos oficiais do Planalto (Portal da Legislação / DOU / Senado LEGIS):
 * - Anexo I: Cesta Básica Nacional de Alimentos — Alíquota Zero (-100%)
 * - Anexo II: Serviços de Educação e Bens Reduzidos — Redução de 60%
 * - Anexo III: Serviços de Saúde — Redução de 60%
 * - Anexo IV: Dispositivos Médicos e Medicamentos — Redução de 60% (Zero p/ SUS e entidades públicas)
 * - Anexo V: Dispositivos de Acessibilidade p/ PCD — Redução de 60%
 * - Anexo VI: Nutrição Enteral, Parenteral e Fórmulas Especiais — Redução de 60% (Zero p/ CEBAS/SUS)
 * - Anexo VII: Alimentos Destinados ao Consumo Humano (Cesta Estendida) — Redução de 60%
 * - Anexo VIII: Higiene Pessoal e Limpeza Baixa Renda — Redução de 60%
 * - Anexo IX: Insumos Agropecuários e Aquícolas — Redução de 60% (+ diferimento)
 * - Anexo X: Produções Artísticas, Culturais e Audiovisuais — Redução de 60%
 * - Anexo XI: Bens e Serviços de Soberania e Defesa Cibernética — Redução de 60%
 * - Anexo XII: Dispositivos Médicos com Alíquota Zero Própria (-100%)
 * - Anexo XIII: Dispositivos de Acessibilidade com Alíquota Zero Própria (-100%)
 * - Anexo XV: Hortícolas, Frutas e Ovos — Alíquota Zero (-100%)
 * - Anexo XVII: Imposto Seletivo (Bens e Serviços Prejudiciais)
 * - Regimes Específicos: Combustíveis e Minerais (Monofásico / ad rem), Serviços Financeiros,
 *   Sociedades Cooperativas, Planos Privados de Assistência à Saúde, Intercâmbio de Estudantes e Turismo.
 *
 * Capitulações normativas exatas da LC 214/2025 e correlação com códigos oficiais (NCM, NBS, cClassTrib, cCredPres).
 */

export interface ProdutoServicoAnexo {
  item: string
  descricao: string
  tipoCodigo?: 'NCM' | 'NBS' | 'cClassTrib' | 'cCredPres' | 'CST'
  codigo?: string
  detalhes?: string
}

export interface AnexoReformaItem {
  id: string
  numero: string // 'Anexo I', 'Anexo II', etc.
  titulo: string
  subtitulo: string
  instrumento: 'LC 214/2025' | 'EC 132/2023' | 'RIBS' | 'DEC 12.955/2026'
  capitulacaoLegal: string // artigo, inciso, parágrafo exato
  artigosRemissao: string[] // ex: ['Art. 125', 'Art. 148']
  reducaoAliquotaPct: number // 0, -30, -50, -60, -100
  reducaoRotulo: string
  aliquotaEfetivaIbsCbs: string
  baseCalculoTexto: string
  resumo: string
  produtosServicos: ProdutoServicoAnexo[]
  codigosOficiaisRelacionados: string[]
  fonteOficial: {
    nome: string
    url: string
    selo: string
  }
  documentoDownloadId?: string
  tags: string[]
  categoria:
    | 'Cesta Básica & Alimentos'
    | 'Saúde & Medicina'
    | 'Educação'
    | 'Agronegócio & Insumos'
    | 'Acessibilidade & PCD'
    | 'Cultura & Segurança'
    | 'Regimes Específicos'
    | 'Imposto Seletivo'
}

export const ANEXOS_REFORMA_CATALOGO: AnexoReformaItem[] = [
  {
    id: 'anexo-lc214-01',
    numero: 'Anexo I',
    titulo: 'Cesta Básica Nacional de Alimentos — Alíquota Zero',
    subtitulo:
      'Desoneração de 100% de IBS e CBS para itens alimentares essenciais da nutrição humana',
    instrumento: 'LC 214/2025',
    capitulacaoLegal:
      'LC 214/2025, art. 125, caput e Anexo I; EC 132/2023, art. 8º; RIBS, art. 199',
    artigosRemissao: ['Art. 125', 'Art. 148', 'EC 132/2023 art. 8º'],
    reducaoAliquotaPct: -100,
    reducaoRotulo: 'Alíquota Zero (100% de Redução)',
    aliquotaEfetivaIbsCbs: '0,00% (CBS: 0,00% + IBS: 0,00%)',
    baseCalculoTexto:
      'Alíquota de referência 26,50% (ou projeção 30,00%) reduzida a 0%. Vedada incidência e vedada apropriação de créditos pelo consumidor final.',
    resumo:
      'Garante desoneração integral de tributos sobre o consumo dos alimentos de primeira necessidade. A venda em conjunto de mercadorias não perde o benefício quando o valor do item beneficiado for especificado.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Arroz beneficiado, polido ou parboilizado',
        tipoCodigo: 'NCM',
        codigo: '1006.20, 1006.30.21, 1006.40.00',
      },
      {
        item: '2',
        descricao: 'Feijões de qualquer espécie e tipo',
        tipoCodigo: 'NCM',
        codigo: '0713.33.19, 0713.35.90',
      },
      {
        item: '3',
        descricao: 'Leite pasteurizado, esterilizado ou em pó',
        tipoCodigo: 'NCM',
        codigo: '0401.10.10, 0401.20.10, 0402.10.10',
      },
      { item: '4', descricao: 'Manteiga', tipoCodigo: 'NCM', codigo: '0405.10.00' },
      {
        item: '5',
        descricao: 'Carnes bovinas frescas, refrigeradas ou congeladas',
        tipoCodigo: 'NCM',
        codigo: '0201.10.00, 0202',
      },
      {
        item: '6',
        descricao: 'Carnes suínas frescas, refrigeradas ou congeladas',
        tipoCodigo: 'NCM',
        codigo: '0203.11.00, 0203.2',
      },
      {
        item: '7',
        descricao: 'Carnes de aves frescas ou congeladas',
        tipoCodigo: 'NCM',
        codigo: '0207.11.00, 0207.12',
      },
      {
        item: '8',
        descricao: 'Peixes frescos ou congelados (exceto nobres)',
        tipoCodigo: 'NCM',
        codigo: '0302.32.00, 0303',
      },
      {
        item: '9',
        descricao: 'Farinha de mandioca e amidos',
        tipoCodigo: 'NCM',
        codigo: '1106.20.00, 1108',
      },
      {
        item: '10',
        descricao: 'Farinha de trigo e sêmolas',
        tipoCodigo: 'NCM',
        codigo: '1101.00.10',
      },
      {
        item: '11',
        descricao: 'Pão comum (tipo francês) sem recheio',
        tipoCodigo: 'NCM',
        codigo: '1905.90.90',
      },
      {
        item: '12',
        descricao: 'Óleo de soja refinado',
        tipoCodigo: 'NCM',
        codigo: '1507.10.00, 1507.90',
      },
      {
        item: '13',
        descricao: 'Café torrado ou moído',
        tipoCodigo: 'NCM',
        codigo: '0901.11.10, 0901.21.10',
      },
      {
        item: '14',
        descricao: 'Açúcar de cana cristal ou refinado',
        tipoCodigo: 'NCM',
        codigo: '1701.14.00, 1701.99.00',
      },
      { item: '15', descricao: 'Sal de cozinha refinado', tipoCodigo: 'NCM', codigo: '2501.00.20' },
      {
        item: '16',
        descricao: 'cClassTrib 0101 — Cesta básica nacional alíquota zero',
        tipoCodigo: 'cClassTrib',
        codigo: '0101',
      },
      {
        item: '17',
        descricao: 'cCredPres 0201 — Crédito presumido de produtos da cesta',
        tipoCodigo: 'cCredPres',
        codigo: '0201',
      },
    ],
    codigosOficiaisRelacionados: [
      '1006.20',
      '0713.33',
      '0401.10',
      '0201.10',
      '1905.90',
      '0101',
      '0201',
    ],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo I)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: ['cesta basica', 'arroz', 'feijao', 'carne', 'leite', 'pao', 'aliquota zero', 'alimento'],
    categoria: 'Cesta Básica & Alimentos',
  },
  {
    id: 'anexo-lc214-02',
    numero: 'Anexo II',
    titulo: 'Serviços de Educação e Formação — Redução de 60%',
    subtitulo:
      'Redução de 60% das alíquotas do IBS e da CBS sobre fornecimento de ensino e formação',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 129, caput e Anexo II; RIBS, art. 204',
    artigosRemissao: ['Art. 129', 'Art. 204 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (-60%)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'A base de cálculo do tributo é tributada à alíquota de 40% da referência padrão (fator 0,40). Alíquota de referência IBS 18,70% e CBS 11,30% reduzem para IBS 7,48% e CBS 4,52%.',
    resumo:
      'Alcança creches, ensino infantil, fundamental, médio, técnico, superior, pós-graduação, educação de jovens e adultos (EJA) e educação especial com especificação técnica NBS.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Ensino Infantil, inclusive creche e pré-escola',
        tipoCodigo: 'NBS',
        codigo: '1.2201.1',
      },
      { item: '2', descricao: 'Ensino Fundamental', tipoCodigo: 'NBS', codigo: '1.2201.20.00' },
      {
        item: '3',
        descricao: 'Ensino Médio regular e profissionalizante',
        tipoCodigo: 'NBS',
        codigo: '1.2201.30.00',
      },
      {
        item: '4',
        descricao: 'Ensino Técnico de Nível Médio',
        tipoCodigo: 'NBS',
        codigo: '1.2202.00.00',
      },
      {
        item: '5',
        descricao: 'Educação de Jovens e Adultos (EJA)',
        tipoCodigo: 'NBS',
        codigo: '1.2203',
      },
      {
        item: '6',
        descricao: 'Ensino Superior (graduação, pós, extensão e sequenciais)',
        tipoCodigo: 'NBS',
        codigo: '1.2204',
      },
      {
        item: '7',
        descricao: 'Ensino de escrita tátil e linguagem de sinais (LIBRAS)',
        tipoCodigo: 'NBS',
        codigo: '1.2205.13.00',
      },
      {
        item: '8',
        descricao: 'Ensino de línguas nativas de povos originários',
        tipoCodigo: 'NBS',
        codigo: '1.2205.13.00',
      },
      {
        item: '9',
        descricao: 'Educação especial destinada a pessoas com deficiência e superdotação',
        tipoCodigo: 'NBS',
        codigo: '1.2201',
      },
      {
        item: '10',
        descricao: 'cClassTrib 0301 — Serviços educacionais redução 60%',
        tipoCodigo: 'cClassTrib',
        codigo: '0301',
      },
    ],
    codigosOficiaisRelacionados: ['1.2201.1', '1.2201.20', '1.2204', '0301'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo II)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: ['educacao', 'escola', 'ensino', 'faculdade', 'universidade', 'creche', 'reducao 60'],
    categoria: 'Educação',
  },
  {
    id: 'anexo-lc214-03',
    numero: 'Anexo III',
    titulo: 'Serviços de Saúde Humana — Redução de 60%',
    subtitulo:
      'Redução de 60% das alíquotas do IBS e da CBS sobre o fornecimento de serviços médico-hospitalares',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 130, caput e Anexo III; RIBS, art. 205',
    artigosRemissao: ['Art. 130', 'Art. 205 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (-60%)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Aplica fator 0,40 sobre a alíquota padrão. Glosas médicas de planos de saúde não integram a base de cálculo (RIBS art. 205, p.ú.).',
    resumo:
      'Engloba 30 categorias de serviços de assistência à saúde: cirurgias, UTIs, diagnóstico por imagem, laboratórios, ambulâncias, fisioterapia, psicologia, odontologia e home care.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Serviços cirúrgicos e ambulatoriais',
        tipoCodigo: 'NBS',
        codigo: '1.2301.11.00',
      },
      {
        item: '2',
        descricao: 'Serviços ginecológicos e obstétricos',
        tipoCodigo: 'NBS',
        codigo: '1.2301.12.00',
      },
      {
        item: '3',
        descricao: 'Serviços prestados em UTI e CTI',
        tipoCodigo: 'NBS',
        codigo: '1.2301.14.00',
      },
      {
        item: '4',
        descricao: 'Serviços de clínica médica e consultórios',
        tipoCodigo: 'NBS',
        codigo: '1.2301.21.00',
      },
      {
        item: '5',
        descricao: 'Serviços médicos especializados de diagnóstico',
        tipoCodigo: 'NBS',
        codigo: '1.2301.22.00',
      },
      {
        item: '6',
        descricao: 'Serviços odontológicos e ortodônticos',
        tipoCodigo: 'NBS',
        codigo: '1.2301.23.00',
      },
      {
        item: '7',
        descricao: 'Serviços laboratoriais de análises clínicas',
        tipoCodigo: 'NBS',
        codigo: '1.2301.93.00',
      },
      {
        item: '8',
        descricao: 'Serviços de diagnóstico por imagem (raio-X, tomografia, ressonância)',
        tipoCodigo: 'NBS',
        codigo: '1.2301.94.00',
      },
      {
        item: '9',
        descricao: 'Serviços de enfermagem e fisioterapia',
        tipoCodigo: 'NBS',
        codigo: '1.2301.91.00, 1.2301.92.00',
      },
      {
        item: '10',
        descricao: 'Serviços de psicologia, fonoaudiologia e nutrição',
        tipoCodigo: 'NBS',
        codigo: '1.2301.98.00, 1.2301.99.00',
      },
      {
        item: '11',
        descricao: 'cClassTrib 0401 — Serviços de saúde redução 60%',
        tipoCodigo: 'cClassTrib',
        codigo: '0401',
      },
    ],
    codigosOficiaisRelacionados: ['1.2301.11', '1.2301.21', '1.2301.93', '1.2301.94', '0401'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo III)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'saude',
      'medicina',
      'hospital',
      'cirurgia',
      'laboratorio',
      'diagnostico',
      'medico',
      'reducao 60',
    ],
    categoria: 'Saúde & Medicina',
  },
  {
    id: 'anexo-lc214-04',
    numero: 'Anexo IV',
    titulo: 'Dispositivos Médicos e Medicina Diagnóstica — Redução de 60%',
    subtitulo:
      'Redução de 60% para aquisições privadas; Alíquota Zero para órgãos públicos e entidades com CEBAS/SUS',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, arts. 131 e 144, caput e Anexo IV; RIBS, arts. 206 e 220',
    artigosRemissao: ['Art. 131', 'Art. 144', 'Arts. 206 e 220 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (Zero para SUS / Poder Público)',
    aliquotaEfetivaIbsCbs: '10,60% privado / 0,00% público ou CEBAS-SUS',
    baseCalculoTexto:
      'Redução de 60% (fator 0,40) sobre fornecimento a hospitais e clínicas privadas; alíquota zero quando adquirido diretamente por órgãos da administração direta e entidades imunes credenciadas no SUS.',
    resumo:
      'Catálogo de 105 itens de dispositivos médico-hospitalares: bolsas de drenagem, filmes radiográficos, cimentos ortopédicos, dialisadores, marcapassos, stents, tomógrafos, ressonâncias magnéticas e aparelhos de raio X.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Bolsas para drenagem com medição de diurese',
        tipoCodigo: 'NCM',
        codigo: '3926.90.30',
      },
      {
        item: '2',
        descricao: 'Chapas e filmes para raios-X sensibilizados',
        tipoCodigo: 'NCM',
        codigo: '3701.10.10, 3702.10.20',
      },
      {
        item: '3',
        descricao: 'Cimentos para reconstituição óssea',
        tipoCodigo: 'NCM',
        codigo: '3006.40.20',
      },
      {
        item: '4',
        descricao: 'Conjuntos e filtros para hemodiálise',
        tipoCodigo: 'NCM',
        codigo: '3004.90.99, 8421.29.90',
      },
      {
        item: '5',
        descricao: 'Eletrodos de marcapasso e válvulas cardíacas',
        tipoCodigo: 'NCM',
        codigo: '9021.90.91',
      },
      {
        item: '6',
        descricao: 'Tomógrafo computadorizado',
        tipoCodigo: 'NCM',
        codigo: '9022.12.00',
      },
      {
        item: '7',
        descricao: 'Aparelhos de diagnóstico por ressonância magnética',
        tipoCodigo: 'NCM',
        codigo: '9018.13.00',
      },
      {
        item: '8',
        descricao: 'Aparelhos de ultrassonografia médica',
        tipoCodigo: 'NCM',
        codigo: '9018.12',
      },
      {
        item: '9',
        descricao: 'Respiradores e ventiladores pulmonares mecânicos',
        tipoCodigo: 'NCM',
        codigo: '9019.20.40',
      },
      {
        item: '10',
        descricao: 'Monitores multiparamétricos de UTI',
        tipoCodigo: 'NCM',
        codigo: '9018.19.80',
      },
      {
        item: '11',
        descricao: 'Bombas de infusão e seringas automáticas',
        tipoCodigo: 'NCM',
        codigo: '9018.90.10',
      },
      {
        item: '12',
        descricao: 'cClassTrib 0501 — Dispositivos médicos redução 60%',
        tipoCodigo: 'cClassTrib',
        codigo: '0501',
      },
    ],
    codigosOficiaisRelacionados: ['9018.12', '9018.13', '9022.12', '9019.20', '3926.90', '0501'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo IV)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'dispositivo medico',
      'medicina',
      'tomografo',
      'ultrassom',
      'respirador',
      'marcapasso',
      'reducao 60',
    ],
    categoria: 'Saúde & Medicina',
  },
  {
    id: 'anexo-lc214-05',
    numero: 'Anexo V',
    titulo: 'Dispositivos de Acessibilidade e Veículos para PCD — Redução de 60%',
    subtitulo:
      'Redução de 60% para bens médico-assistenciais, adaptação veicular e autonomia de pessoas com deficiência',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 132, caput e Anexo V; RIBS, art. 207',
    artigosRemissao: ['Art. 132', 'Art. 207 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (-60%)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Incidência do fator 0,40 sobre a alíquota padrão. Exige conformidade com normas técnicas do órgão competente (Inmetro/Anvisa/Contran).',
    resumo:
      'Cobre comandos manuais de acelerador e freio para veículos de PCD, plataformas elevatórias veiculares, dispositivos de tecnologia assistiva, mouses oculares e alarmes vibratórios.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Acessórios e adaptações de comandos manuais para veículos PCD',
        tipoCodigo: 'NCM',
        codigo: '8708.99.10',
      },
      {
        item: '2',
        descricao: 'Plataformas de elevação e embarque para cadeirantes',
        tipoCodigo: 'NCM',
        codigo: '8428.90.90',
      },
      {
        item: '3',
        descricao: 'Mouse controlado pelos olhos ou movimentos da cabeça',
        tipoCodigo: 'NCM',
        codigo: '8471.60.53',
      },
      {
        item: '4',
        descricao: 'Relógios despertadores luminosos e vibratórios para deficientes auditivos',
        tipoCodigo: 'NCM',
        codigo: '9103.10.00, 9105.11.00',
      },
      {
        item: '5',
        descricao: 'Teclados adaptados com colmeia para deficiência motora',
        tipoCodigo: 'NCM',
        codigo: '8471.60.52',
      },
      {
        item: '6',
        descricao: 'Lupas eletrônicas e ampliadores de caracteres para baixa visão',
        tipoCodigo: 'NCM',
        codigo: '9013.80.00',
      },
      {
        item: '7',
        descricao: 'cClassTrib 0601 — Acessibilidade PCD redução 60%',
        tipoCodigo: 'cClassTrib',
        codigo: '0601',
      },
    ],
    codigosOficiaisRelacionados: ['8708.99.10', '8428.90.90', '8471.60.53', '0601'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo V)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'acessibilidade',
      'pcd',
      'deficiencia',
      'veiculo pcd',
      'cadeirante',
      'assistiva',
      'reducao 60',
    ],
    categoria: 'Acessibilidade & PCD',
  },
  {
    id: 'anexo-lc214-07',
    numero: 'Anexo VII',
    titulo: 'Alimentos para Consumo Humano (Cesta Estendida) — Redução de 60%',
    subtitulo: 'Redução de 60% para alimentos que não compõem a cesta básica nacional zero',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 135, caput e Anexo VII; RIBS, art. 210',
    artigosRemissao: ['Art. 135', 'Art. 210 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (-60%)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Aplica fator 0,40 sobre a alíquota de referência conjunta do IVA Dual. Distinto do Anexo I (onde a alíquota é zero).',
    resumo:
      'Compreende 17 grupos: crustáceos e moluscos, leite fermentado e iogurtes, mel natural, massas alimentícias preparadas, sucos e polpas naturais sem adição de açúcar, pão de forma, extrato de tomate e conservas vegetais.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Crustáceos (exceto lagostas) e moluscos',
        tipoCodigo: 'NCM',
        codigo: '0306.1, 0306.3, 0307',
      },
      {
        item: '2',
        descricao: 'Leite fermentado, iogurtes e bebidas lácteas',
        tipoCodigo: 'NCM',
        codigo: '0403.20.00, 0403.90.00',
      },
      { item: '3', descricao: 'Mel natural', tipoCodigo: 'NCM', codigo: '0409.00.00' },
      {
        item: '4',
        descricao: 'Grumos e sêmolas de cereais',
        tipoCodigo: 'NCM',
        codigo: '1103.11.00, 1103.19.00',
      },
      {
        item: '5',
        descricao: 'Massas alimentícias recheadas ou preparadas',
        tipoCodigo: 'NCM',
        codigo: '1902.20.00, 1902.30.00',
      },
      { item: '6', descricao: 'Pão de forma', tipoCodigo: 'NCM', codigo: '1905.90.10' },
      {
        item: '7',
        descricao: 'Extrato de tomate concentrado',
        tipoCodigo: 'NCM',
        codigo: '2002.90.00',
      },
      {
        item: '8',
        descricao: 'Sucos naturais de frutas e hortaliças sem adição de açúcar',
        tipoCodigo: 'NCM',
        codigo: '20.09',
      },
      {
        item: '9',
        descricao: 'Polpas de frutas congeladas sem aditivos',
        tipoCodigo: 'NCM',
        codigo: '20.08',
      },
    ],
    codigosOficiaisRelacionados: ['0403.20', '0409.00', '1902.20', '1905.90.10', '2002.90'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo VII)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'alimentos',
      'pao de forma',
      'iogurte',
      'suco',
      'tomate',
      'cesta estendida',
      'reducao 60',
    ],
    categoria: 'Cesta Básica & Alimentos',
  },
  {
    id: 'anexo-lc214-08',
    numero: 'Anexo VIII',
    titulo: 'Produtos de Higiene Pessoal e Limpeza Essenciais — Redução de 60%',
    subtitulo: 'Itens essenciais consumidos majoritariamente por famílias de baixa renda',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 136, caput e Anexo VIII; RIBS, art. 211',
    artigosRemissao: ['Art. 136', 'Art. 211 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (-60%)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Alíquota do IBS e CBS apurada com fator 0,40 da alíquota padrão. Lista fechada de 7 produtos essenciais.',
    resumo:
      'Garante alívio tributário direto para famílias de menor renda em itens sanitários: sabonete, pasta de dente, escova dental, papel higiênico, água sanitária, sabão em barra e fraldas.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Sabões de toucador (sabonetes em barra ou líquidos)',
        tipoCodigo: 'NCM',
        codigo: '3401.11.90',
      },
      {
        item: '2',
        descricao: 'Dentifrícios (pastas de dente)',
        tipoCodigo: 'NCM',
        codigo: '3306.10.00',
      },
      { item: '3', descricao: 'Escovas de dentes', tipoCodigo: 'NCM', codigo: '9603.21.00' },
      { item: '4', descricao: 'Papel higiênico', tipoCodigo: 'NCM', codigo: '4818.10.00' },
      {
        item: '5',
        descricao: 'Água sanitária (hipoclorito de sódio)',
        tipoCodigo: 'NCM',
        codigo: '3808.94.19',
      },
      {
        item: '6',
        descricao: 'Sabões em barra para lavagem',
        tipoCodigo: 'NCM',
        codigo: '3401.19.00',
      },
      {
        item: '7',
        descricao: 'Fraldas infantis e geriátricas e absorventes',
        tipoCodigo: 'NCM',
        codigo: '9619.00.00',
      },
    ],
    codigosOficiaisRelacionados: [
      '3401.11.90',
      '3306.10.00',
      '9603.21.00',
      '4818.10.00',
      '9619.00.00',
    ],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo VIII)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'higiene',
      'limpeza',
      'sabonete',
      'papel higienico',
      'fralda',
      'agua sanitaria',
      'reducao 60',
    ],
    categoria: 'Cesta Básica & Alimentos',
  },
  {
    id: 'anexo-lc214-09',
    numero: 'Anexo IX',
    titulo: 'Insumos Agropecuários e Aquícolas — Redução de 60% e Diferimento',
    subtitulo:
      'Redução de 60% e diferimento tributário nas operações da cadeia de produção primária',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 138, caput e §§ 1º a 3º e Anexo IX; RIBS, arts. 213 e 214',
    artigosRemissao: ['Art. 138', 'Art. 110', 'Arts. 213–214 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (+ Diferimento)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Fator 0,40 sobre alíquotas do IBS e CBS. Diferimento nas operações entre contribuintes do regime regular e na venda a produtor rural não contribuinte destinada à produção agropecuária.',
    resumo:
      'Catálogo de 35 itens: biofertilizantes, adubos químicos, defensivos, sementes certificadas, mudas, vacinas e medicamentos veterinários, rações, sêmen, reprodutores e serviços agronômicos e veterinários (NBS).',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Biofertilizantes conforme registro no MAPA',
        tipoCodigo: 'NCM',
        codigo: '3101.00.00',
      },
      {
        item: '2',
        descricao: 'Fertilizantes químicos e adubos minerais',
        tipoCodigo: 'NCM',
        codigo: 'Capítulo 31; 3824.99.77',
      },
      {
        item: '3',
        descricao: 'Defensivos agrícolas: inseticidas, fungicidas e herbicidas',
        tipoCodigo: 'NCM',
        codigo: '38.08, 3824.99.89',
      },
      {
        item: '4',
        descricao: 'Corretivos de solo e remineralizadores agrícolas',
        tipoCodigo: 'NCM',
        codigo: 'Capítulo 25; 2521.00.00',
      },
      {
        item: '5',
        descricao: 'Sementes genéticas, básicas e certificadas (C1/C2)',
        tipoCodigo: 'NCM',
        codigo: 'Capítulos 7, 10 e 12',
      },
      {
        item: '6',
        descricao: 'Vacinas, soros e medicamentos de uso veterinário',
        tipoCodigo: 'NCM',
        codigo: '3002.12, 3002.42, 30.04',
      },
      {
        item: '7',
        descricao: 'Rações para animais de criação, premix e suplementos',
        tipoCodigo: 'NCM',
        codigo: '23.01, 23.09',
      },
      {
        item: '8',
        descricao: 'Aves de um dia para criação industrial',
        tipoCodigo: 'NCM',
        codigo: '0105.1',
      },
      {
        item: '9',
        descricao: 'Sêmen bovino e embriões para melhoramento genético',
        tipoCodigo: 'NCM',
        codigo: '0511.10.00, 0511.9',
      },
      {
        item: '10',
        descricao: 'Serviços agronômicos e de engenharia florestal',
        tipoCodigo: 'NBS',
        codigo: '1.1410.90.00, 1.1403.10.00',
      },
      {
        item: '11',
        descricao: 'Serviços de veterinária para produção animal',
        tipoCodigo: 'NBS',
        codigo: '1.1405.21.00',
      },
      {
        item: '12',
        descricao: 'Serviços de pulverização aérea e controle de pragas',
        tipoCodigo: 'NBS',
        codigo: '1.1901.10.00',
      },
      {
        item: '13',
        descricao: 'cCredPres 0301 — Crédito presumido de insumos agropecuários',
        tipoCodigo: 'cCredPres',
        codigo: '0301',
      },
    ],
    codigosOficiaisRelacionados: ['3101.00', '3808', '2521.00', '3002.42', '1.1410.90', '0301'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo IX)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'insumo',
      'insumo agropecuario',
      'fertilizante',
      'defensivo',
      'semente',
      'agronegocio',
      'racao',
      'diferimento',
    ],
    categoria: 'Agronegócio & Insumos',
  },
  {
    id: 'anexo-lc214-10',
    numero: 'Anexo X',
    titulo: 'Produções Culturais, Artísticas e Audiovisuais — Redução de 60%',
    subtitulo: 'Incentivo à cultura e fomento a produções nacionais de eventos, artes e jornalismo',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 139, caput e Anexo X; RIBS, art. 215',
    artigosRemissao: ['Art. 139', 'Art. 215 do RIBS'],
    reducaoAliquotaPct: -60,
    reducaoRotulo: 'Redução de 60% (-60%)',
    aliquotaEfetivaIbsCbs: '10,60% (Ref. 26,5%) ou 12,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Fator 0,40 sobre a alíquota padrão. Focado em produções nacionais de conteúdo e licenciamento de direitos autorais.',
    resumo:
      'Aplica-se ao licenciamento de direitos autorais de obras literárias, cinematográficas, musicais e jornalísticas, espetáculos teatrais e circenses e cessão de espaços culturais.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Licenciamento de direitos de autor de obras literárias',
        tipoCodigo: 'NBS',
        codigo: '1.1103.10.00',
      },
      {
        item: '2',
        descricao: 'Licenciamento de obras cinematográficas e audiovisuais nacionais',
        tipoCodigo: 'NBS',
        codigo: '1.1103.31.00',
      },
      {
        item: '3',
        descricao: 'Licenciamento de obras jornalísticas e fotográficas',
        tipoCodigo: 'NBS',
        codigo: '1.1103.32.00',
      },
      {
        item: '4',
        descricao: 'Apresentações musicais, teatrais e espetáculos circenses',
        tipoCodigo: 'NBS',
        codigo: '1.2501',
      },
      {
        item: '5',
        descricao: 'Serviços de locação de espaços para apresentações culturais',
        tipoCodigo: 'NBS',
        codigo: '1.2502.90.00',
      },
    ],
    codigosOficiaisRelacionados: ['1.1103.10', '1.1103.31', '1.2501', '1.2502.90'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo X)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'cultura',
      'audiovisual',
      'cinema',
      'teatro',
      'livro',
      'jornalismo',
      'evento cultural',
      'reducao 60',
    ],
    categoria: 'Cultura & Segurança',
  },
  {
    id: 'anexo-lc214-12',
    numero: 'Anexo XII',
    titulo: 'Dispositivos Médicos com Alíquota Zero Própria',
    subtitulo:
      'Lista autônoma de equipamentos e artigos médicos de suporte à vida e diagnóstico com Alíquota Zero (-100%)',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 144, inciso I e Anexo XII; RIBS, art. 220, I',
    artigosRemissao: ['Art. 144, I', 'Art. 220, I do RIBS'],
    reducaoAliquotaPct: -100,
    reducaoRotulo: 'Alíquota Zero (100% de Redução)',
    aliquotaEfetivaIbsCbs: '0,00% (CBS: 0,00% + IBS: 0,00%)',
    baseCalculoTexto:
      'Desoneração total permanente com manutenção de créditos na cadeia de fabricação nacional.',
    resumo:
      'Compreende 17 grupos cruciais de alta tecnologia em saúde: eletrocardiógrafos, eletroencefalógrafos, aparelhos de crioterapia, tomógrafos, bombas de cobalto, respiradores, bombas de infusão e ultrassons.',
    produtosServicos: [
      { item: '1', descricao: 'Eletrocardiógrafos', tipoCodigo: 'NCM', codigo: '9018.11.00' },
      {
        item: '2',
        descricao: 'Eletroencefalógrafos e aparelhos de eletrodiagnóstico',
        tipoCodigo: 'NCM',
        codigo: '9018.19.80',
      },
      {
        item: '3',
        descricao: 'Artigos e aparelhos ortopédicos e para fraturas',
        tipoCodigo: 'NCM',
        codigo: '9021.10.10, 9021.10.20',
      },
      {
        item: '4',
        descricao: 'Próteses articulares e artigos de prótese cirúrgica',
        tipoCodigo: 'NCM',
        codigo: '9021.3',
      },
      {
        item: '5',
        descricao: 'Aparelhos de radiocobalto e gamaterapia',
        tipoCodigo: 'NCM',
        codigo: '9022.21.10, 9022.21.20',
      },
      {
        item: '6',
        descricao: 'Respiradores e ventiladores pulmonares para UTI',
        tipoCodigo: 'NCM',
        codigo: '9019.20.40',
      },
      {
        item: '7',
        descricao: 'Monitores multiparamétricos de pacientes',
        tipoCodigo: 'NCM',
        codigo: '9018.19.80',
      },
      {
        item: '8',
        descricao: 'Bombas de infusão e seringas automáticas',
        tipoCodigo: 'NCM',
        codigo: '9018.90.10',
      },
      {
        item: '9',
        descricao: 'Aparelhos de ressonância magnética nuclear',
        tipoCodigo: 'NCM',
        codigo: '9018.13.00',
      },
      {
        item: '10',
        descricao: 'Aparelhos de ultrassom médico',
        tipoCodigo: 'NCM',
        codigo: '9018.12',
      },
    ],
    codigosOficiaisRelacionados: ['9018.11', '9021.10', '9022.21', '9019.20.40', '9018.13'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo XII)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'dispositivo zero',
      'saude',
      'medicina',
      'tomografo',
      'eletrocardiografo',
      'protese',
      'aliquota zero',
    ],
    categoria: 'Saúde & Medicina',
  },
  {
    id: 'anexo-lc214-13',
    numero: 'Anexo XIII',
    titulo: 'Dispositivos de Acessibilidade com Alíquota Zero Própria',
    subtitulo:
      'Lista autônoma de cadeiras de rodas, aparelhos auditivos e próteses com Alíquota Zero (-100%)',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 145, caput e Anexo XIII; RIBS, art. 221',
    artigosRemissao: ['Art. 145', 'Art. 221 do RIBS'],
    reducaoAliquotaPct: -100,
    reducaoRotulo: 'Alíquota Zero (100% de Redução)',
    aliquotaEfetivaIbsCbs: '0,00% (CBS: 0,00% + IBS: 0,00%)',
    baseCalculoTexto:
      'Desoneração integral do IBS e CBS com manutenção de créditos da cadeia produtiva.',
    resumo:
      'Garante gratuidade tributária total para barras de apoio para banheiros, cadeiras de rodas manuais e motorizadas, partes de cadeiras, aparelhos auditivos e implantes cocleares.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Barras de apoio para banheiros e ambientes acessíveis de PCD',
        tipoCodigo: 'NCM',
        codigo: '8302.41.00',
      },
      {
        item: '2',
        descricao: 'Cadeiras de rodas sem mecanismo de propulsão motora',
        tipoCodigo: 'NCM',
        codigo: '8713.10.00',
      },
      {
        item: '3',
        descricao: 'Cadeiras de rodas motorizadas e veículos especiais de locomoção',
        tipoCodigo: 'NCM',
        codigo: '8713.90.00',
      },
      {
        item: '4',
        descricao: 'Partes e peças sobressalentes exclusivas para cadeiras de rodas',
        tipoCodigo: 'NCM',
        codigo: '8714.20.00',
      },
      {
        item: '5',
        descricao: 'Aparelhos auditivos e facilitadores da audição para surdos',
        tipoCodigo: 'NCM',
        codigo: '9021.40.00',
      },
      {
        item: '6',
        descricao: 'Implantes cocleares cirúrgicos',
        tipoCodigo: 'NCM',
        codigo: '9021.90.19',
      },
    ],
    codigosOficiaisRelacionados: [
      '8302.41.00',
      '8713.10.00',
      '8713.90.00',
      '9021.40.00',
      '9021.90.19',
    ],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo XIII)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'acessibilidade zero',
      'cadeira de rodas',
      'aparelho auditivo',
      'implante coclear',
      'pcd',
      'aliquota zero',
    ],
    categoria: 'Acessibilidade & PCD',
  },
  {
    id: 'anexo-lc214-15',
    numero: 'Anexo XV',
    titulo: 'Produtos Hortícolas, Frutas Frescas e Ovos — Alíquota Zero',
    subtitulo:
      'Desoneração total permanente de alimentos frescos in natura da horticultura e avicultura',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, art. 148, caput e Anexo XV; RIBS, art. 224',
    artigosRemissao: ['Art. 148', 'Art. 224 do RIBS'],
    reducaoAliquotaPct: -100,
    reducaoRotulo: 'Alíquota Zero (100% de Redução)',
    aliquotaEfetivaIbsCbs: '0,00% (CBS: 0,00% + IBS: 0,00%)',
    baseCalculoTexto:
      'Alíquota zero de IBS e CBS. Podem apresentar-se inteiros, fatiados, descascados, ralados, higienizados, frescos ou congelados sem adição de açúcar.',
    resumo:
      'Contempla ovos de galinha e outras aves, batatas, tomates, cebolas, alho, couves, alfaces, cenouras, pepinos, leguminosas, frutas frescas ou refrigeradas e tubérculos (mandioca e batata-doce).',
    produtosServicos: [
      { item: '1', descricao: 'Ovos frescos ou conservados', tipoCodigo: 'NCM', codigo: '0407.2' },
      {
        item: '2',
        descricao: 'Batatas frescas ou refrigeradas',
        tipoCodigo: 'NCM',
        codigo: '07.01',
      },
      {
        item: '3',
        descricao: 'Tomates frescos ou refrigerados',
        tipoCodigo: 'NCM',
        codigo: '07.02',
      },
      {
        item: '4',
        descricao: 'Cebolas, alhos e alhos-porros frescos',
        tipoCodigo: 'NCM',
        codigo: '07.03',
      },
      {
        item: '5',
        descricao: 'Couves, repolhos e couve-flor frescos',
        tipoCodigo: 'NCM',
        codigo: '07.04',
      },
      { item: '6', descricao: 'Alfaces e chicórias', tipoCodigo: 'NCM', codigo: '07.05' },
      {
        item: '7',
        descricao: 'Cenouras, nabos e beterrabas de mesa',
        tipoCodigo: 'NCM',
        codigo: '07.06',
      },
      {
        item: '8',
        descricao: 'Frutas frescas: bananas, maçãs, laranjas, uvas, melões e mamões',
        tipoCodigo: 'NCM',
        codigo: '08.03, 08.04, 08.05, 08.06, 08.07, 08.08',
      },
      {
        item: '9',
        descricao: 'Raízes e tubérculos alimentícios (mandioca, inhame, batata-doce)',
        tipoCodigo: 'NCM',
        codigo: '07.14',
      },
    ],
    codigosOficiaisRelacionados: ['0407.2', '0701', '0702', '0703', '0803', '0808'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo XV)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'hortifruti',
      'frutas',
      'ovos',
      'legumes',
      'verduras',
      'mandioca',
      'aliquota zero',
      'agro',
    ],
    categoria: 'Cesta Básica & Alimentos',
  },
  {
    id: 'anexo-profissoes-30',
    numero: 'Profissões Regulamentadas (Art. 127)',
    titulo: '18 Profissões Regulamentadas — Redução de 30%',
    subtitulo:
      'Redução de 30% para serviços intelectuais submetidos a conselho de classe e prestados por PJ uniprofissional',
    instrumento: 'LC 214/2025',
    capitulacaoLegal:
      'LC 214/2025, art. 127, caput e §§ 1º a 3º; EC 132/2023, art. 156-A § 5º, VIII',
    artigosRemissao: ['Art. 127', 'EC 132/2023 art. 156-A § 5º VIII'],
    reducaoAliquotaPct: -30,
    reducaoRotulo: 'Redução de 30% (-30%)',
    aliquotaEfetivaIbsCbs: '18,55% (Ref. 26,5%) ou 21,00% (Ref. 30,0% TCU/CGIBS)',
    baseCalculoTexto:
      'Tributação à razão de 70% da alíquota padrão de referência (fator 0,70). Exige sócios com habilitação correspondente, sem sócio PJ e prestação direta.',
    resumo:
      'Alcança administradores, advogados, arquitetos e urbanistas, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, profissionais de educação física, engenheiros e agrônomos, estatísticos, médicos veterinários e zootecnistas, museólogos, químicos, relações públicas, técnicos industriais e agrícolas.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Serviços de advocacia e consultoria jurídica',
        tipoCodigo: 'NBS',
        codigo: '1.1401',
      },
      {
        item: '2',
        descricao: 'Serviços de contabilidade, auditoria e assessoria fiscal',
        tipoCodigo: 'NBS',
        codigo: '1.1402',
      },
      {
        item: '3',
        descricao: 'Serviços de arquitetura, urbanismo e paisagismo',
        tipoCodigo: 'NBS',
        codigo: '1.1403',
      },
      {
        item: '4',
        descricao: 'Serviços de engenharia civil, mecânica, elétrica e agronômica',
        tipoCodigo: 'NBS',
        codigo: '1.1403.2',
      },
      {
        item: '5',
        descricao: 'Serviços de medicina veterinária e zootecnia',
        tipoCodigo: 'NBS',
        codigo: '1.1405.2',
      },
      {
        item: '6',
        descricao: 'Serviços de administração de empresas e consultoria de gestão',
        tipoCodigo: 'NBS',
        codigo: '1.1407',
      },
      {
        item: '7',
        descricao: 'Serviços de economia e perícia econômico-financeira',
        tipoCodigo: 'NBS',
        codigo: '1.1408',
      },
    ],
    codigosOficiaisRelacionados: ['1.1401', '1.1402', '1.1403', '1.1407'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Art. 127)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'profissoes',
      'advogado',
      'contador',
      'engenheiro',
      'arquiteto',
      'veterinario',
      'reducao 30',
    ],
    categoria: 'Cultura & Segurança',
  },
  {
    id: 'anexo-regime-combustiveis',
    numero: 'Combustíveis e Biocombustíveis (Arts. 172–184)',
    titulo: 'Regime Monofásico de Combustíveis e Minerais',
    subtitulo:
      'Tributação monofásica por alíquota ad rem específica (R$ por unidade de medida) uniforme nacional',
    instrumento: 'LC 214/2025',
    capitulacaoLegal:
      'LC 214/2025, arts. 172 a 184; LC 235/2026; Portaria Conjunta MF/CGIBS 14/2026; Dec. 13.133/2026',
    artigosRemissao: ['Arts. 172–184', 'Dec. 13.133/2026', 'Portaria MF/CGIBS 14/2026'],
    reducaoAliquotaPct: 0,
    reducaoRotulo: 'Regime Específico Monofásico (ad rem)',
    aliquotaEfetivaIbsCbs: 'Fixada por valor ad rem (R$/litro ou m³)',
    baseCalculoTexto:
      'Não incide alíquota ad valorem percentual. Tributação concentrada no produtor/importador com alíquota única em R$ por litro, vedado crédito ao adquirente comum.',
    resumo:
      'Aplica-se à gasolina, diesel, biodiesel, etanol anidro, querosene de aviação e GLP. Biocombustíveis contam com alíquota proporcional entre 40% e 90% do fóssil equivalente.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Óleos brutos de petróleo e minerais betuminosos',
        tipoCodigo: 'NCM',
        codigo: '2709.00.10',
      },
      {
        item: '2',
        descricao: 'Gasolinas automotivas e de aviação',
        tipoCodigo: 'NCM',
        codigo: '2710.12.59',
      },
      {
        item: '3',
        descricao: 'Óleo diesel automotivo e marítimo',
        tipoCodigo: 'NCM',
        codigo: '2710.19.21',
      },
      {
        item: '4',
        descricao: 'Etanol anidro e hidratado combustível',
        tipoCodigo: 'NCM',
        codigo: '2207.10.10, 2207.20.10',
      },
      {
        item: '5',
        descricao: 'Gás liquefeito de petróleo (GLP)',
        tipoCodigo: 'NCM',
        codigo: '2711.19.10',
      },
    ],
    codigosOficiaisRelacionados: ['2709.00.10', '2710.12', '2710.19', '2207.10', '2711.19'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Arts. 172-184)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'combustivel',
      'gasolina',
      'diesel',
      'etanol',
      'glp',
      'petroleo',
      'monofasico',
      'regime especifico',
    ],
    categoria: 'Regimes Específicos',
  },
  {
    id: 'anexo-regime-financeiros',
    numero: 'Serviços Financeiros (Arts. 182–214)',
    titulo: 'Regime Específico de Serviços Financeiros',
    subtitulo:
      'Tributação sobre receitas de intermediação financeira com deduções operacionais legais',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, arts. 182 a 214; LC 227/2026, art. 192 V; RIBS arts. 182–199',
    artigosRemissao: ['Arts. 182–214', 'LC 227/2026 art. 192'],
    reducaoAliquotaPct: 0,
    reducaoRotulo: 'Regime Específico sobre Margem',
    aliquotaEfetivaIbsCbs: 'Alíquotas uniformes nacionais sobre receita líquida deduzida',
    baseCalculoTexto:
      'Base apurada com dedução das despesas de captação (sem principal), câmbio e perdas. Crédito ao tomador PJ regular sobre juros acima da Selic (art. 194).',
    resumo:
      'Regula bancos, cooperativas de crédito, seguradoras, administradoras de consórcios, distribuidoras e instituições de pagamento supervisionadas por BACEN, CVM, PREVIC e SUSEP.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Operações de crédito, financiamento e mútuo financeiro',
        tipoCodigo: 'NBS',
        codigo: '1.1601',
      },
      {
        item: '2',
        descricao: 'Serviços de câmbio e transferências internacionais',
        tipoCodigo: 'NBS',
        codigo: '1.1602',
      },
      {
        item: '3',
        descricao: 'Arrendamento mercantil (leasing financeiro)',
        tipoCodigo: 'NBS',
        codigo: '1.1603',
      },
      {
        item: '4',
        descricao: 'Administração de cartões e arranjos de pagamento (split payment)',
        tipoCodigo: 'NBS',
        codigo: '1.1604',
      },
      {
        item: '5',
        descricao: 'Gestão de fundos de investimento e previdência complementar',
        tipoCodigo: 'NBS',
        codigo: '1.1605',
      },
    ],
    codigosOficiaisRelacionados: ['1.1601', '1.1602', '1.1604'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Arts. 182-214)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'financeiro',
      'banco',
      'credito',
      'juros',
      'financiamento',
      'leasing',
      'split payment',
      'regime especifico',
    ],
    categoria: 'Regimes Específicos',
  },
  {
    id: 'anexo-regime-cooperativas',
    numero: 'Sociedades Cooperativas (Arts. 271–272)',
    titulo: 'Regime Específico das Sociedades Cooperativas',
    subtitulo: 'Alíquota Zero no ato cooperativo associado ↔ cooperativa e entre cooperativas',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, arts. 271 e 272; CF/88 art. 146, III, "c"',
    artigosRemissao: ['Art. 271', 'Art. 272', 'CF/88 art. 146 III c'],
    reducaoAliquotaPct: -100,
    reducaoRotulo: 'Alíquota Zero no Ato Cooperativo',
    aliquotaEfetivaIbsCbs: '0,00% nas operações internas entre associado e cooperativa',
    baseCalculoTexto:
      'Optativa. Aplica alíquota zero nas operações de fornecimento de bens ou serviços entre associado e cooperativa e entre cooperativas singulares e centrais.',
    resumo:
      'Preserva o tratamento adequado ao ato cooperativo. O adquirente que adquire da cooperativa na cadeia subsequente credita de acordo com as regras de transferência do art. 272.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Fornecimento de bens e serviços pelo associado à sociedade cooperativa',
        detalhes: 'Ato cooperativo principal — alíquota zero',
      },
      {
        item: '2',
        descricao: 'Fornecimento de insumos e assistência técnica da cooperativa ao associado',
        detalhes: 'Ato cooperativo interno — alíquota zero',
      },
      {
        item: '3',
        descricao: 'Operações entre cooperativas singulares, centrais, federações e confederações',
        detalhes: 'Alíquota zero entre cooperativas do art. 271',
      },
      {
        item: '4',
        descricao: 'Transferência de créditos acumulados do associado para a cooperativa',
        detalhes: 'Art. 272 da LC 214/2025',
      },
    ],
    codigosOficiaisRelacionados: ['0201', '0301'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Arts. 271-272)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'cooperativa',
      'cooperado',
      'ato cooperativo',
      'aliquota zero',
      'agro cooperativa',
      'regime especifico',
    ],
    categoria: 'Regimes Específicos',
  },
  {
    id: 'anexo-regime-planos-saude',
    numero: 'Planos de Assistência à Saúde (Arts. 215–221)',
    titulo: 'Regime Específico de Planos Privados de Assistência à Saúde',
    subtitulo: 'Dedução das despesas médico-hospitalares da base de cálculo do plano de saúde',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, arts. 215 a 221; ANS Lei 9.656/1998',
    artigosRemissao: ['Arts. 215–221', 'Art. 205 do RIBS'],
    reducaoAliquotaPct: 0,
    reducaoRotulo: 'Regime Específico com Deduções',
    aliquotaEfetivaIbsCbs: 'Apurada sobre a contraprestação líquida das despesas assistenciais',
    baseCalculoTexto:
      'Permite dedução dos custos assistenciais pagos à rede credenciada de hospitais, clínicas e médicos para evitar bitributação com a redução de 60% do Anexo III.',
    resumo:
      'Garante que operadoras de planos de saúde, medicinas de grupo e autogestões tributem apenas a taxa de administração e spread, sem cumulatividade sobre honorários médicos já tributados.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Planos de saúde individuais e familiares com cobertura ambulatorial/hospitalar',
        tipoCodigo: 'NBS',
        codigo: '1.1605',
      },
      {
        item: '2',
        descricao: 'Planos de saúde coletivos empresariais e por adesão',
        tipoCodigo: 'NBS',
        codigo: '1.1605',
      },
      {
        item: '3',
        descricao: 'Planos exclusivamente odontológicos',
        tipoCodigo: 'NBS',
        codigo: '1.1605',
      },
      {
        item: '4',
        descricao: 'Dedução de despesas de eventos indenizados e procedimentos da rede credenciada',
        detalhes: 'Base legal: art. 218 da LC 214/2025',
      },
    ],
    codigosOficiaisRelacionados: ['1.1605', '1.2301'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Arts. 215-221)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'plano de saude',
      'operadora',
      'convenio',
      'ans',
      'hospitalar',
      'deducoes',
      'regime especifico',
    ],
    categoria: 'Saúde & Medicina',
  },
  {
    id: 'anexo-regime-intercambio',
    numero: 'Intercâmbio e Turismo (Arts. 260–270)',
    titulo: 'Serviços de Intercâmbio de Estudantes e Agências de Viagens',
    subtitulo:
      'Tributação pelo valor agregado líquido (margem da agência / prestador de intercâmbio)',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, arts. 260 a 270; Embratur / Ministério do Turismo',
    artigosRemissao: ['Arts. 260–270'],
    reducaoAliquotaPct: 0,
    reducaoRotulo: 'Regime Específico sobre Margem de Intermediação',
    aliquotaEfetivaIbsCbs: 'Apurada sobre o valor da comissão/margem líquida da agência',
    baseCalculoTexto:
      'A base é restrita ao valor auferido pela intermediação, deduzidos os valores repassados a instituições educacionais ou prestadores de transporte e hospedagem no exterior.',
    resumo:
      'Evita que programas internacionais de estudo e intercâmbio sofram retenção sobre a integralidade das remessas acadêmicas ou passagens internacionais contratadas por estudantes.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Programas de intercâmbio cultural e educacional no exterior',
        tipoCodigo: 'NBS',
        codigo: '1.2401',
      },
      {
        item: '2',
        descricao: 'Intermediação de matrícula e cursos em universidades estrangeiras',
        tipoCodigo: 'NBS',
        codigo: '1.2401',
      },
      {
        item: '3',
        descricao: 'Serviços de agenciamento de viagens, hospedagem e pacotes turísticos',
        tipoCodigo: 'NBS',
        codigo: '1.2402',
      },
    ],
    codigosOficiaisRelacionados: ['1.2401', '1.2402'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Arts. 260-270)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'intercambio',
      'estudante',
      'turismo',
      'agencia de viagem',
      'exterior',
      'regime especifico',
    ],
    categoria: 'Regimes Específicos',
  },
  {
    id: 'anexo-lc214-17',
    numero: 'Anexo XVII',
    titulo: 'Imposto Seletivo — Bens e Serviços Prejudiciais à Saúde e Meio Ambiente',
    subtitulo:
      'Tributação extrafiscal sobre fumo, bebidas alcoólicas e açucaradas, veículos, embarcações e minerais',
    instrumento: 'LC 214/2025',
    capitulacaoLegal: 'LC 214/2025, arts. 392 a 424 e Anexo XVII; CF/88 art. 153, VIII',
    artigosRemissao: ['Arts. 392–424', 'Anexo XVII', 'CF/88 art. 153 VIII'],
    reducaoAliquotaPct: 0,
    reducaoRotulo: 'Incidência Adicional Monofásica (Sobretaxa Extrafiscal)',
    aliquotaEfetivaIbsCbs: 'Alíquotas específicas ad rem ou ad valorem adicionais ao IVA Dual',
    baseCalculoTexto:
      'Não incide na exportação de manufaturados nem sobre bens de capital. Não incide em 2026 (ano-teste informativo).',
    resumo:
      'Tributa extrafiscalmente externalidades negativas em 7 categorias: produtos fumígenos, bebidas alcoólicas, refrigerantes açucarados, veículos poluentes, aeronaves e embarcações esportivas, extração de petróleo e minério de ferro e apostas fantasy sport.',
    produtosServicos: [
      {
        item: '1',
        descricao: 'Cigarros e produtos fumígenos derivados do tabaco',
        tipoCodigo: 'NCM',
        codigo: '2401, 2402, 2403, 2404',
      },
      {
        item: '2',
        descricao: 'Bebidas alcoólicas (cervejas, vinhos, destilados)',
        tipoCodigo: 'NCM',
        codigo: '2203, 2204, 2205, 2206, 2208',
      },
      {
        item: '3',
        descricao: 'Bebidas açucaradas e refrigerantes',
        tipoCodigo: 'NCM',
        codigo: '2202.10.00',
      },
      {
        item: '4',
        descricao: 'Veículos automotores de passageiros poluentes',
        tipoCodigo: 'NCM',
        codigo: '87.03',
      },
      {
        item: '5',
        descricao: 'Aeronaves de recreio e iates/embarcações a motor',
        tipoCodigo: 'NCM',
        codigo: '8802, 8903',
      },
      {
        item: '6',
        descricao: 'Minério de ferro e petróleo bruto extraído',
        tipoCodigo: 'NCM',
        codigo: '2601, 2709.00.10',
      },
      {
        item: '7',
        descricao: 'Concursos de prognósticos e Fantasy sport',
        tipoCodigo: 'NBS',
        codigo: '1.2503',
      },
    ],
    codigosOficiaisRelacionados: ['2402', '2203', '2202.10', '8703', '2601', '2709'],
    fonteOficial: {
      nome: 'Planalto — Presidência da República (LC 214/2025, Anexo XVII)',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      selo: 'Planalto — Texto Compilado Oficial',
    },
    documentoDownloadId: 'lc-214-2025',
    tags: [
      'imposto seletivo',
      'cigarro',
      'bebida',
      'cerveja',
      'acucar',
      'veiculo',
      'minerio',
      'pecado',
    ],
    categoria: 'Imposto Seletivo',
  },
]
