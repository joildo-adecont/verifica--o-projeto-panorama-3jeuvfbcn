export type CategoriaAssuntoEspecial =
  | 'Imposto do Pecado'
  | 'Comitê Gestor'
  | 'Simples Nacional'
  | 'ME e EPP'
  | 'Regimes Societários'
  | 'Entidades Associativas'
  | 'Sindicatos'
  | 'Regras Especiais'
  | 'Imunidades por Produtos e Segmentos'

export interface FonteOficialAssunto {
  nome: string
  orgao: 'Planalto' | 'CGIBS' | 'RFB' | 'CONFAZ' | 'Senado Federal' | 'CGSN' | 'TCU'
  url: string
  tipo: 'lei' | 'resolucao' | 'regulamento' | 'portal' | 'estatistica'
}

export interface ConexaoNormativaAssunto {
  codigoNorma: string
  titulo: string
  dispositivo: string
  efeitoOuTratamento: string
  linkProxyPdf?: string
  linkOficial?: string
}

export interface AssuntoEspecialItem {
  id: string
  titulo: string
  categoria: CategoriaAssuntoEspecial
  subtitulo: string
  foraTributacaoGeral: true
  badgeExcecao: string
  descricao: string
  oQueMuda: string
  baseLegal: string
  artigosRelevantes: string[]
  fontesOficiais: FonteOficialAssunto[]
  conexoesNormativas: ConexaoNormativaAssunto[]
  termosChave: string[]
  produtosOuSegmentosAfetados: string[]
  aliquotaOuTratamento: string
  destaqueBusca?: boolean
}

/**
 * Catálogo técnico consolidado de Assuntos Especiais (fora da tributação geral).
 * Cobre: Imposto do Pecado, Comitê Gestor e Projeções, Simples Nacional, ME/EPP,
 * Lucro Presumido e Lucro Real, Entidades Associativas, Sindicatos, Regras Especiais
 * (combustíveis, financeiro, zonas livres, etc.) e Imunidades por produtos/segmentos.
 */
export const ASSUNTOS_ESPECIAIS_CATALOGO: AssuntoEspecialItem[] = [
  // 1. IMPOSTO DO PECADO — PRODUTOS
  {
    id: 'esp-pecado-01',
    titulo: 'Imposto do Pecado (Imposto Seletivo — IS): Cigarros e Tabacaria',
    categoria: 'Imposto do Pecado',
    subtitulo: 'Sobretributação monofásica extrafiscal sobre produtos fumígenos',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imposto Seletivo Adicional',
    descricao:
      'Tributação monofásica extrafiscal além do IBS e da CBS incidente sobre a produção, extração, comercialização ou importação de cigarros, cigarrilhas, charutos e demais produtos derivados do tabaco, com alíquota ad valorem e/ou específica (ad rem) majorada e sem direito a crédito na cadeia.',
    oQueMuda:
      'Cigarros e derivados deixam de recolher IPI e passam a ter incidência cumulativa de Imposto Seletivo somado à CBS e ao IBS padrão. Não gera crédito para revendedores ou distribuidores. Alíquotas majoradas para desestimular o consumo e cobrir externalidades à saúde pública.',
    baseLegal: 'CF/88 art. 153 VIII; LC 214/2025 Livro II (arts. 392 a 424); EC 132/2023 art. 1º',
    artigosRelevantes: [
      'Art. 153, VIII, da CF/88',
      'Arts. 392 a 415 da LC 214/2025',
      'Anexo XVIII da LC 214/2025',
    ],
    fontesOficiais: [
      {
        nome: 'Portal da Legislação — LC 214/2025 Livro II',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Receita Federal — Guia do Imposto Seletivo',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'Lei Complementar nº 214/2025 — Livro II (Imposto Seletivo)',
        dispositivo: 'Arts. 392 a 410',
        efeitoOuTratamento:
          'Incidência monofásica sem crédito, alíquota majorada ad rem / ad valorem',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'EC 132/2023',
        titulo: 'Emenda Constitucional nº 132/2023',
        dispositivo: 'Art. 153, VIII da CF/88',
        efeitoOuTratamento:
          'Criação constitucional do Imposto Seletivo sobre bens prejudiciais à saúde',
        linkProxyPdf: '/backend/v1/download-resolution?id=EC-132-2023',
      },
    ],
    termosChave: [
      'cigarro',
      'cigarros',
      'tabaco',
      'fumo',
      'fumigenos',
      'charuto',
      'cigarrilha',
      'imposto do pecado',
      'imposto seletivo',
      'is',
      'seletividade',
      'nocivo',
    ],
    produtosOuSegmentosAfetados: [
      'Cigarros',
      'Cigarrilhas',
      'Charutos',
      'Tabaco picado',
      'Dispositivos eletrônicos de fumar',
    ],
    aliquotaOuTratamento: 'IS Específico ad rem + Ad Valorem adicional (sem crédito na cadeia)',
    destaqueBusca: true,
  },
  {
    id: 'esp-pecado-02',
    titulo: 'Imposto do Pecado: Bebidas Alcoólicas e Bebidas Açucaradas',
    categoria: 'Imposto do Pecado',
    subtitulo: 'Tributação de desestímulo com base no teor de álcool e concentração de açúcar',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Alíquotas Graduadas por Teor',
    descricao:
      'Incidência de Imposto Seletivo graduada proporcionalmente ao teor alcoólico das bebidas (cervejas, destilados, vinhos e fermentados) e à quantidade de açúcar adicionado em bebidas açucaradas (refrigerantes, sucos artificiais e isotônicos), buscando neutralizar impactos na saúde.',
    oQueMuda:
      'Cervejarias, destilarias e fabricantes de refrigerantes passam a apurar o IS na saída da fábrica ou importação. A alíquota é híbrida (porção por litro de álcool puro + percentual sobre o preço). Não se aplica alíquota reduzida da cesta básica.',
    baseLegal: 'CF/88 art. 153 VIII; LC 214/2025 arts. 411 a 424; Decreto 12.955/2026',
    artigosRelevantes: [
      'Arts. 411 a 424 da LC 214/2025',
      'Art. 153, VIII da CF',
      'Tabela TIPI / NCMs Capítulo 22',
    ],
    fontesOficiais: [
      {
        nome: 'Portal da Legislação — LC 214/2025 arts. 411-424',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Receita Federal — Nomenclatura e Regulamentação do IS Bebidas',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'Lei Complementar nº 214/2025 — Livro II Capítulo II',
        dispositivo: 'Arts. 411 a 424',
        efeitoOuTratamento: 'Graduação por teor alcoólico (g/litro) e teor calórico/açúcar',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'Decreto 12.955/2026',
        titulo: 'Regulamento da CBS',
        dispositivo: 'Coordenação RFB/CGIBS art. 451',
        efeitoOuTratamento: 'Operacionalização de recolhimento simultâneo CBS + IS',
        linkProxyPdf: '/backend/v1/download-resolution?id=Decreto-12-955-2026',
      },
    ],
    termosChave: [
      'alcool',
      'alcoolicas',
      'bebida alcoolica',
      'bebidas alcoolicas',
      'cerveja',
      'chopp',
      'destilado',
      'cachaca',
      'vodka',
      'whisky',
      'vinho',
      'refrigerante',
      'bebidas acucaradas',
      'imposto do pecado',
      'imposto seletivo',
    ],
    produtosOuSegmentosAfetados: [
      'Cervejas e chopes',
      'Destilados e aguardentes',
      'Vinhos e espumantes',
      'Refrigerantes e isotônicos açucarados',
    ],
    aliquotaOuTratamento: 'IS Híbrido (ad rem por teor alcoólico + ad valorem)',
    destaqueBusca: true,
  },
  {
    id: 'esp-pecado-03',
    titulo: 'Imposto do Pecado: Veículos Automotores, Aeronaves e Embarcações',
    categoria: 'Imposto do Pecado',
    subtitulo: 'Seletividade ambiental calculada por emissão de poluentes e eficiência energética',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Seletividade Ambiental e Veicular',
    descricao:
      'Imposto Seletivo sobre a fabricação e importação de veículos automotores terrestres, embarcações e aeronaves. A alíquota é diferenciada conforme o índice de emissão de CO2, pegada ecológica, reciclabilidade e tipo de motorização (combustão vs. elétrico/híbrido).',
    oQueMuda:
      'Substitui o IPI automotivo. Veículos populares e motos de baixa cilindrada possuem redutores de IS (redução de 50% a 70% conforme art. 423), enquanto veículos utilitários pesados a diesel e veículos de alto luxo sofrem alíquotas majoradas.',
    baseLegal: 'LC 214/2025 arts. 420 a 424; EC 132/2023 art. 153 § 6º',
    artigosRelevantes: [
      'Arts. 420 a 424 da LC 214/2025',
      'Capítulo 87 da NCM (Veículos)',
      'Programa Mover',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — LC 214/2025 Regras de Veículos e IS',
        orgao: 'Planalto',
        url: 'https://normas.leg.br',
        tipo: 'lei',
      },
      {
        nome: 'MDIC / Ministério do Desenvolvimento — Diretrizes Automotivas',
        orgao: 'Planalto',
        url: 'https://www.gov.br/mdic/pt-br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Livro II Seção IV',
        dispositivo: 'Arts. 420 a 424',
        efeitoOuTratamento: 'Alíquota progressiva conforme emissão de gases de efeito estufa',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'veiculo',
      'veiculos',
      'carro',
      'automovel',
      'motocicleta',
      'moto',
      'aeronave',
      'embarcacao',
      'iate',
      'poluente',
      'emissao co2',
      'imposto seletivo',
      'imposto do pecado',
    ],
    produtosOuSegmentosAfetados: [
      'Automóveis de passeio',
      'Motos',
      'Caminhonetes e SUVs',
      'Aeronaves civis',
      'Embarcações de recreio',
    ],
    aliquotaOuTratamento:
      'IS progressivo por pegada de carbono (redutor de até 70% para populares)',
    destaqueBusca: true,
  },

  // 2. COMITÊ GESTOR DO IBS — SUAS PROJEÇÕES E RESOLUÇÕES
  {
    id: 'esp-cgibs-01',
    titulo: 'Comitê Gestor do IBS (CGIBS): Alíquota de Referência e Projeções 2026–2033',
    categoria: 'Comitê Gestor',
    subtitulo: 'Trava do art. 349 da LC 214, alíquotas-teste e projeção TCU/CGIBS de até 30,00%',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Governança e Fixação de Alíquotas do IBS',
    descricao:
      'O Comitê Gestor do IBS (entidade pública federativa independente composta por Estados e Municípios criada pela EC 132/2023 e LC 227/2026) é responsável por calcular a alíquota de referência do IBS, gerir a arrecadação e distribuição federativa e publicar projeções de impacto.',
    oQueMuda:
      'A alíquota de referência conjunta do IVA Dual foi inicialmente estimada em 26,50% (trava do art. 349). Cálculos recentes do TCU (sessão 28/10/2026) e Resolução CGIBS 14/2026 projetam alíquota total de até 30,00% (CBS 11,30% + IBS 18,70%). Em 2026 o IBS terá teste informativo a 0,1% e em 2027 a CBS assume 11,30% com o IBS a 0,1%.',
    baseLegal:
      'CF/88 art. 156-B; LC 227/2026 Livro I; LC 214/2025 art. 349; Resoluções CGIBS 1 a 16/2026',
    artigosRelevantes: [
      'Art. 156-B da CF/88',
      'Arts. 1º a 162 da LC 227/2026',
      'Art. 349 da LC 214/2025',
      'Resoluções CGIBS 6 e 14/2026',
    ],
    fontesOficiais: [
      {
        nome: 'Comitê Gestor do IBS — Portal Oficial de Resoluções e Notas Técnicas',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'portal',
      },
      {
        nome: 'Senado Federal — Legislação LC 227/2026 (CGIBS e ITCMD)',
        orgao: 'Senado Federal',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-01-13;227',
        tipo: 'lei',
      },
      {
        nome: 'Tribunal de Contas da União — Acórdão Fixação Alíquota de Referência',
        orgao: 'TCU',
        url: 'https://portal.tcu.gov.br',
        tipo: 'estatistica',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 227/2026',
        titulo: 'Lei Complementar nº 227/2026 — Estrutura e Governança do CGIBS',
        dispositivo: 'Livro I arts. 1º a 162',
        efeitoOuTratamento:
          'Criação da autoridade federativa, contencioso e câmaras de uniformização',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-227-2026',
      },
      {
        codigoNorma: 'Resolução CGIBS 6/2026 (RIBS)',
        titulo: 'Regulamento do IBS — 617 artigos e 5 anexos',
        dispositivo: 'Arts. 1º a 617',
        efeitoOuTratamento:
          'Norma operacional definitiva do IBS para os 26 Estados, DF e 5.570 Municípios',
        linkProxyPdf: '/backend/v1/download-resolution?id=Res-CGIBS-6-2026',
      },
      {
        codigoNorma: 'Resolução CGIBS nº 14/2026',
        titulo: 'Financiamento do CGIBS e Nota Técnica de Alíquota Referencial',
        dispositivo: 'Art. 1º e Anexo Técnico',
        efeitoOuTratamento:
          'Estimativa de alíquota de 18,70% para o IBS (totalizando 30,00% com CBS)',
        linkProxyPdf: '/backend/v1/download-resolution?id=Res-CGIBS-14-2026',
      },
    ],
    termosChave: [
      'comite gestor',
      'comite gestor do ibs',
      'cgibs',
      'projecoes',
      'aliquota de referencia',
      '26,5',
      '26.5',
      '30%',
      'trava art 349',
      'resolucoes cgibs',
      'ribs',
      'aliquota teste',
      '2026',
      '2027',
    ],
    produtosOuSegmentosAfetados: [
      'Todos os contribuintes de IBS de todos os Estados e Municípios',
      'Distribuição de receitas federativas',
    ],
    aliquotaOuTratamento: 'Projeção 18,70% IBS + 11,30% CBS (Total 30,00% vs. Trava 26,50%)',
    destaqueBusca: true,
  },

  // 3. SIMPLES NACIONAL — REGIME DIFERENCIADO
  {
    id: 'esp-simples-01',
    titulo: 'Simples Nacional na Reforma Tributária: Regime Diferenciado e Opção Híbrida',
    categoria: 'Simples Nacional',
    subtitulo: 'Manutenção do regime unificado (DAS) ou migração para o regime regular do IBS/CBS',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Regime Favorecido e Opcionalidade Dual',
    descricao:
      'O Simples Nacional é mantido expressamente pelo art. 146 da CF e EC 132/2023. As microempresas e empresas de pequeno porte continuam recolhendo tributos unificados via DAS, mas com uma novidade estrutural: podem optar por transferir crédito amplo de IBS e CBS recolhendo esses dois tributos por fora no regime não-cumulativo regular.',
    oQueMuda:
      'Se mantiver no DAS: recolhe alíquota efetiva reduzida, mas só transfere crédito correspondente ao montante de IBS/CBS pago na partilha do DAS. Se optar por recolher IBS/CBS por fora: transfere 100% de crédito aos clientes B2B, preservando competitividade nas cadeias industriais.',
    baseLegal:
      'CF/88 art. 146 III d; LC 123/2006; LC 214/2025 arts. 425 a 433; Resoluções CGSN 190 a 192/2026',
    artigosRelevantes: [
      'Arts. 425 a 433 da LC 214/2025',
      'Resoluções CGSN 190, 191 e 192/2026',
      'Art. 146 da CF/88',
    ],
    fontesOficiais: [
      {
        nome: 'Comitê Gestor do Simples Nacional — Resoluções Oficiais 190-192/2026',
        orgao: 'CGSN',
        url: 'https://www.receita.fazenda.gov.br/simplesnacional',
        tipo: 'resolucao',
      },
      {
        nome: 'Portal da Legislação — LC 123/2006 atualizada',
        orgao: 'Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm',
        tipo: 'lei',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Título V Capítulo IX (Do Simples Nacional)',
        dispositivo: 'Arts. 425 a 433',
        efeitoOuTratamento: 'Regulamentação da opção de recolhimento segregado de IBS/CBS por fora',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'Resoluções CGSN 190–192/2026',
        titulo: 'Resoluções CGSN sobre Simples na Reforma Tributária',
        dispositivo: 'Art. 2º e tabelas de partilha',
        efeitoOuTratamento: 'NFS-e nacional obrigatória e limites de aproveitamento de crédito B2B',
        linkProxyPdf: '/backend/v1/download-resolution?id=Res-CGSN-190-192-2026',
      },
    ],
    termosChave: [
      'simples nacional',
      'simples',
      'cgsn',
      'das',
      'regime favorecido',
      'b2b',
      'credito do simples',
      'recolhimento por fora',
      'hibrido',
      'lc 123',
    ],
    produtosOuSegmentosAfetados: [
      'Comércio, indústria e prestadores de serviços optantes pelo Simples Nacional',
    ],
    aliquotaOuTratamento:
      'Opção: Tabela unificada do DAS (crédito restrito) OU Regime Regular (crédito pleno)',
    destaqueBusca: true,
  },

  // 4. ME (MICROEMPRESA) E EPP
  {
    id: 'esp-meepp-01',
    titulo: 'Microempresa (ME) e Empresa de Pequeno Porte (EPP): Sublimites e LC 238/2026',
    categoria: 'ME e EPP',
    subtitulo:
      'Sublimite estadual do IBS de R$ 3,6 milhões, teto de R$ 4,8 milhões e novos tetos MEI',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Sublimites e Tratamento ME/EPP',
    descricao:
      'Tratamento constitucional diferenciado para ME (faturamento até R$ 360 mil) e EPP (faturamento até R$ 4,8 milhões). A reforma tributária mantém o sublimite estadual e municipal de R$ 3,6 milhões para o IBS: empresas entre R$ 3,6 mi e R$ 4,8 mi recolhem CBS pelo Simples e IBS obrigatoriamente no regime regular.',
    oQueMuda:
      'A LC 238/2026 elevou o limite do MEI para até R$ 140.000,00 e ampliou a contratação de até 2 empregados. Para EPPs com faturamento acima de R$ 3,6 mi, a contabilidade passa a ser dual (CBS unificada e IBS não-cumulativo estadual/municipal com apuração de crédito e débito).',
    baseLegal: 'LC 123/2006; LC 238/2026; LC 214/2025 art. 427; Portarias RFB/CGSN',
    artigosRelevantes: ['LC 238/2026', 'Art. 13-A da LC 123/2006', 'Art. 427 da LC 214/2025'],
    fontesOficiais: [
      {
        nome: 'Senado Federal — LC 238/2026 (Novos tetos MEI e EPP)',
        orgao: 'Senado Federal',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-10-21;238',
        tipo: 'lei',
      },
      {
        nome: 'Receita Federal — Normas de Micro e Pequena Empresa',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 238/2026',
        titulo: 'Lei Complementar nº 238/2026 — Alteração da LC 123/2006',
        dispositivo: 'Arts. 1º a 4º',
        efeitoOuTratamento: 'Subida do teto MEI e regras de transição ME/EPP',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-238-2026',
      },
    ],
    termosChave: [
      'me',
      'epp',
      'microempresa',
      'empresa de pequeno porte',
      'mei',
      'microempreendedor',
      'sublimite',
      '3,6 milhoes',
      '3.6 milhoes',
      '4,8 milhoes',
      'lc 238',
    ],
    produtosOuSegmentosAfetados: [
      'Microempresas (receita até R$ 360 mil)',
      'Empresas de Pequeno Porte (até R$ 4,8 milhões)',
      'MEI',
    ],
    aliquotaOuTratamento: 'Tratamento simplificado; apuração dual acima de R$ 3,6 milhões',
    destaqueBusca: true,
  },

  // 5. LUCRO PRESUMIDO E LUCRO REAL — REGIMES SOCIETÁRIOS
  {
    id: 'esp-societario-01',
    titulo: 'Lucro Presumido e Lucro Real: Fim do PIS/Cofins Cumulativo e Transição IBS/CBS',
    categoria: 'Regimes Societários',
    subtitulo: 'Impacto nos regimes de IRPJ/CSLL com unificação da base de cálculo indireta',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Transição dos Regimes de Apuração',
    descricao:
      'Empresas no Lucro Presumido hoje recolhem PIS/Cofins no regime cumulativo (alíquota combinada de 3,65% sobre a receita bruta, sem crédito). Na reforma, o PIS/Cofins é extinto e substituído pela CBS (federal) e IBS (subnacional) sob o princípio da não-cumulatividade plena (crédito financeiro).',
    oQueMuda:
      'O Lucro Presumido continua existindo para fins de IRPJ e CSLL, mas para a tributação sobre o consumo (CBS e IBS) as empresas de Lucro Presumido deixam a alíquota de 3,65% e passam a apurar a alíquota padrão (cerca de 26,5% a 30%), passando a ter direito a crédito sobre todas as aquisições de insumos, bens e serviços.',
    baseLegal:
      'EC 132/2023 ADCT arts. 124 a 130; LC 214/2025 Livro I Título IV e Livro III (Transição)',
    artigosRelevantes: [
      'Arts. 343 a 350 da LC 214/2025',
      'Decreto 12.955/2026 Livro I',
      'Arts. 124 a 130 do ADCT',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — Decreto 12.955/2026 Regulamento da CBS',
        orgao: 'Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12955.htm',
        tipo: 'regulamento',
      },
      {
        nome: 'Receita Federal — Guia de Transição do Lucro Presumido e Real',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Livro III (Da Transição Tributária)',
        dispositivo: 'Arts. 343 a 380',
        efeitoOuTratamento: 'Extinção progressiva de PIS/Cofins (2027) e ICMS/ISS (2029-2032)',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'Decreto 12.955/2026',
        titulo: 'Regulamento da CBS (Presidência da República)',
        dispositivo: 'Arts. 50 a 110',
        efeitoOuTratamento:
          'Regras de creditamento amplo e cálculo da base tributável sem cumulatividade',
        linkProxyPdf: '/backend/v1/download-resolution?id=Decreto-12-955-2026',
      },
    ],
    termosChave: [
      'lucro presumido',
      'lucro real',
      'presumido',
      'regimes de apuracao',
      'regimes societarios',
      'pis cofins cumulativo',
      '3,65%',
      'nao cumulatividade plena',
      'transicao cbs',
      'credito financeiro',
    ],
    produtosOuSegmentosAfetados: [
      'Prestadores de serviços no Lucro Presumido',
      'Comércio e indústria de médio e grande porte',
    ],
    aliquotaOuTratamento:
      'Fim da alíquota cumulativa de 3,65%; migração para IBS/CBS não-cumulativo com crédito pleno',
    destaqueBusca: true,
  },

  // 6. ENTIDADES ASSOCIATIVAS — IMUNIDADE E ISENÇÕES
  {
    id: 'esp-associativas-01',
    titulo: 'Entidades Associativas e Sem Fins Lucrativos: Imunidade do Art. 150, VI da CF',
    categoria: 'Entidades Associativas',
    subtitulo: 'Regras de não-incidência sobre mensalidades, doações e receitas próprias',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Subjetiva e Requisitos da LC 214',
    descricao:
      'Imunidade tributária ampla de IBS e CBS para partidos políticos, fundações, entidades sindicais de trabalhadores, associações de moradores, entidades beneficentes de assistência social e templos de qualquer culto, aplicando o art. 150, VI, da Constituição Federal regulamentado pelos arts. 6º a 8º da LC 214/2025.',
    oQueMuda:
      'Mensalidades associativas, contribuições estatutárias, termos de fomento, doações e subvenções vinculadas às finalidades essenciais NÃO sofrem incidência de IBS/CBS. Vendas de bens ou serviços concorrenciais no mercado com fim econômico puro sofrem tributação para evitar concorrência desleal.',
    baseLegal: 'CF/88 art. 150 VI e art. 195 § 7º; LC 214/2025 arts. 6º e 7º; RIBS art. 198',
    artigosRelevantes: [
      'Art. 150, VI, da CF/88',
      'Arts. 6º e 7º da LC 214/2025',
      'Art. 198 do Regulamento do IBS (Res. 6/2026)',
    ],
    fontesOficiais: [
      {
        nome: 'Portal da Legislação — CF/88 Art. 150 VI e LC 214/2025',
        orgao: 'Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm',
        tipo: 'lei',
      },
      {
        nome: 'CGIBS — Resolução CGIBS 6/2026 (RIBS) Imunidades Subjetivas',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Livro I Título I Capítulo II (Das Imunidades)',
        dispositivo: 'Arts. 6º e 7º',
        efeitoOuTratamento:
          'Não incidência sobre receitas estatutárias com manutenção de créditos nos insumos essenciais',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'Resolução CGIBS 6/2026 (RIBS)',
        titulo: 'Regulamento do IBS',
        dispositivo: 'Art. 198',
        efeitoOuTratamento:
          'Critérios de comprovação de finalidade essencial perante as administrações tributárias',
        linkProxyPdf: '/backend/v1/download-resolution?id=Res-CGIBS-6-2026',
      },
    ],
    termosChave: [
      'entidades associativas',
      'associacoes',
      'associacao',
      'ong',
      'terceiro setor',
      'sem fins lucrativos',
      'mensalidade associativa',
      'fundacoes',
      'assistencia social',
      'imunidade subjetiva',
      'art 150 vi',
    ],
    produtosOuSegmentosAfetados: [
      'Associações civis',
      'Clubes sem fins lucrativos',
      'Fundações privadas de apoio',
      'Entidades beneficentes',
    ],
    aliquotaOuTratamento:
      'Imunidade Constitucional (Não Incidência Plena sobre atividades estatutárias)',
    destaqueBusca: true,
  },

  // 7. SINDICATOS — TRATAMENTO FISCAL
  {
    id: 'esp-sindicatos-01',
    titulo: 'Sindicatos e Centrais Sindicais: Tratamento Tributário das Contribuições e Atividades',
    categoria: 'Sindicatos',
    subtitulo:
      'Imunidade para entidades sindicais dos trabalhadores e limites das atividades conexas',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Sindical e Contribuições',
    descricao:
      'As entidades sindicais de trabalhadores gozam de imunidade constitucional de impostos sobre seu patrimônio, renda e serviços (art. 150, VI, "c" da CF/88), estendida ao IBS nos termos da EC 132/2023 e aos limites da CBS previstos na LC 214/2025.',
    oQueMuda:
      'Mensalidades sindicais voluntárias, contribuições assistenciais aprovadas em assembleia e contribuições sindicais confederativas NÃO sofrem incidência de IBS nem de CBS. Contratos de locação de espaços ou eventos abertos ao público em geral com intuito lucrativo seguem regramento de concorrência com o setor privado.',
    baseLegal: 'CF/88 art. 150 VI c e art. 156-A § 5º; LC 214/2025 arts. 6º e 7º; STF Tema 935',
    artigosRelevantes: [
      'Art. 150, VI, "c" da CF/88',
      'Art. 156-A, § 5º da CF',
      'Arts. 6º e 7º da LC 214/2025',
    ],
    fontesOficiais: [
      {
        nome: 'Senado Federal — Legislação e Imunidade Sindical na EC 132',
        orgao: 'Senado Federal',
        url: 'https://normas.leg.br',
        tipo: 'lei',
      },
      {
        nome: 'Receita Federal — Tratamento Tributário de Sindicatos e Federações',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'EC 132/2023',
        titulo: 'Emenda Constitucional nº 132/2023',
        dispositivo: 'Art. 156-A, § 5º, V da CF',
        efeitoOuTratamento: 'Extensão das imunidades constitucionais ao IBS',
        linkProxyPdf: '/backend/v1/download-resolution?id=EC-132-2023',
      },
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Art. 6º, § 2º',
        efeitoOuTratamento: 'Definição de patrimônio e serviços afetos à finalidade sindical',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'sindicato',
      'sindicatos',
      'entidades sindicais',
      'federacao sindical',
      'confederacao sindical',
      'contribuicao assistencial',
      'contribuicao sindical',
      'mensalidade sindical',
      'imunidade sindical',
    ],
    produtosOuSegmentosAfetados: [
      'Sindicatos de trabalhadores',
      'Federações e Confederações de categorias profissionais',
    ],
    aliquotaOuTratamento:
      'Imunidade Constitucional Total sobre arrecadação institucional e assistencial',
    destaqueBusca: true,
  },

  // 8. REGRAS ESPECIAIS — SETORES DA LC 214/2025
  {
    id: 'esp-regras-01',
    titulo: 'Regras Especiais: Combustíveis e Lubrificantes (Regime Monofásico)',
    categoria: 'Regras Especiais',
    subtitulo: 'Tributação monofásica com alíquotas ad rem uniformes em todo o território nacional',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Regime Monofásico Uniforme Nacional',
    descricao:
      'Combustíveis (gasolina, etanol anidro/hidratado, diesel, biodiesel, GLP e querosene de aviação) submetem-se a regime específico monofásico, recolhido uma única vez pelo produtor (refinaria) ou importador, com alíquota específica ad rem (em reais por litro ou por quilograma), vedado o creditamento pelo consumidor final.',
    oQueMuda:
      'Extingue o ICMS-Combustíveis nos moldes da LC 192/2022 e centraliza o recolhimento na origem. A LC 235/2026 previu renúncias e ajustes emergenciais frente ao cenário internacional de energia.',
    baseLegal:
      'CF/88 art. 155 § 4º; LC 214/2025 arts. 172 a 184; LC 235/2026; Portaria Conjunta MF/CGIBS 14/2026',
    artigosRelevantes: ['Arts. 172 a 184 da LC 214/2025', 'LC 235/2026', 'Dec. 13.133/2026'],
    fontesOficiais: [
      {
        nome: 'CONFAZ — Atos COTEPE e Alíquotas Ad Rem de Combustíveis',
        orgao: 'CONFAZ',
        url: 'https://www.confaz.fazenda.gov.br',
        tipo: 'portal',
      },
      {
        nome: 'Senado Federal — LC 235/2026 (Combustíveis e Energia)',
        orgao: 'Senado Federal',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2026-08-27;235',
        tipo: 'lei',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Título V Capítulo I (Dos Combustíveis)',
        dispositivo: 'Arts. 172 a 184',
        efeitoOuTratamento: 'Incidência única ad rem fixada por ato conjunto MF/CGIBS',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'LC 235/2026',
        titulo: 'Lei Complementar nº 235/2026',
        dispositivo: 'Arts. 1º a 3º',
        efeitoOuTratamento: 'Reduções emergenciais federais para diesel, gasolina e etanol',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-235-2026',
      },
    ],
    termosChave: [
      'combustiveis',
      'gasolina',
      'diesel',
      'etanol',
      'biodiesel',
      'glp',
      'gas de cozinha',
      'lubrificantes',
      'monofasico',
      'ad rem',
      'lc 235',
      'regras especiais',
    ],
    produtosOuSegmentosAfetados: [
      'Refinarias',
      'Importadores de combustíveis',
      'Distribuidoras',
      'Postos de combustíveis',
    ],
    aliquotaOuTratamento:
      'Alíquota Ad Rem específica fixa por unidade de medida (R$/litro ou R$/kg)',
    destaqueBusca: true,
  },
  {
    id: 'esp-regras-02',
    titulo: 'Regras Especiais: Serviços Financeiros, Seguros, Previdência e Planos de Saúde',
    categoria: 'Regras Especiais',
    subtitulo: 'Apuração sobre a margem financeira (spread) e fluxo de caixa com split payment',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Apuração Baseada em Margem e Spread',
    descricao:
      'Instituições financeiras, bancos, seguradoras, entidades de previdência complementar, sociedades de capitalização e operadoras de planos de saúde não apuram tributo sobre o valor bruto das transações ou juros nominais, mas sim sobre a margem operacional bruta (diferença entre receitas financeiras e custos de captação).',
    oQueMuda:
      'Operações de crédito direto mantêm tributação por spread com vedação de apropriação direta de crédito por pessoas físicas. Obrigatoriedade de split payment automatizado nos arranjos de pagamento (cartões e PIX) para retenção na fonte.',
    baseLegal:
      'LC 214/2025 arts. 185 a 221; Resolução CGIBS 6/2026 Livro II; Atos Conjuntos RFB/CGIBS',
    artigosRelevantes: [
      'Arts. 185 a 221 da LC 214/2025',
      'Arts. 31 a 35 (Split Payment)',
      'RIBS Livro II',
    ],
    fontesOficiais: [
      {
        nome: 'Banco Central do Brasil e Receita Federal — Split Payment',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
      {
        nome: 'CGIBS — Resoluções sobre Serviços Financeiros',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Título V Capítulo II',
        dispositivo: 'Arts. 185 a 221',
        efeitoOuTratamento: 'Tributação sobre margem financeira agregada',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'servicos financeiros',
      'bancos',
      'spread',
      'margem financeira',
      'seguros',
      'previdencia',
      'capitalizacao',
      'cartao de credito',
      'split payment',
      'regras especiais',
    ],
    produtosOuSegmentosAfetados: [
      'Bancos múltiplos',
      'Corretoras',
      'Seguradoras',
      'Entidades fechadas de previdência',
      'Operadoras de pagamento',
    ],
    aliquotaOuTratamento:
      'Apuração sobre Spread Operacional / Margem (sem alíquota ad valorem geral)',
    destaqueBusca: true,
  },
  {
    id: 'esp-regras-03',
    titulo: 'Regras Especiais: Zona Franca de Manaus (ZFM) e Áreas de Livre Comércio (ALC)',
    categoria: 'Regras Especiais',
    subtitulo:
      'Manutenção da competitividade regional via crédito presumido de até 100% de IBS e CBS',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Diferencial Constitucional da ZFM e ALC',
    descricao:
      'Garantia constitucional de manutenção do diferencial competitivo do Polo Industrial de Manaus e das Áreas de Livre Comércio da Amazônia Ocidental até o ano de 2073, por meio de incentivos de crédito presumido de até 100% nas saídas industriais, desoneração na entrada de insumos e Imposto Seletivo zero para produção incentivada local.',
    oQueMuda:
      'Produtos manufaturados na ZFM com Processo Produtivo Básico (PPB) geram crédito presumido equivalente a até a totalidade do IBS e da CBS, neutralizando a perda de incentivos de ICMS e IPI do modelo antigo.',
    baseLegal: 'CF/88 art. 92-B do ADCT; LC 214/2025 arts. 434 a 453; RIBS Anexo V',
    artigosRelevantes: [
      'Art. 92-B do ADCT',
      'Arts. 434 a 453 da LC 214/2025',
      'Anexo V do Regulamento do IBS',
    ],
    fontesOficiais: [
      {
        nome: 'SUFRAMA — Superintendência da Zona Franca de Manaus',
        orgao: 'Planalto',
        url: 'https://www.gov.br/suframa/pt-br',
        tipo: 'portal',
      },
      {
        nome: 'Planalto — LC 214/2025 Disposições da ZFM e ALC',
        orgao: 'Planalto',
        url: 'https://normas.leg.br',
        tipo: 'lei',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Título V Capítulo X (Da ZFM e ALC)',
        dispositivo: 'Arts. 434 a 453',
        efeitoOuTratamento: 'Crédito presumido de 55% a 100% do IBS e CBS para bens incentivados',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'zona franca',
      'zfm',
      'manaus',
      'alc',
      'areas de livre comercio',
      'amazonia ocidental',
      'suframa',
      'credito presumido zfm',
      'ppb',
      'regras especiais',
    ],
    produtosOuSegmentosAfetados: [
      'Polo Eletroeletrônico',
      'Duas Rodas',
      'Bens de Informática e TIC',
      'Indústrias da Amazônia Ocidental',
    ],
    aliquotaOuTratamento:
      'Crédito Presumido de 55% a 100% do IBS/CBS (alíquota efetiva de 0% a 13,5%)',
    destaqueBusca: true,
  },

  // 9. TRATAMENTOS DE IMUNIDADE POR PRODUTOS E SEGMENTOS
  {
    id: 'esp-imunidade-01',
    titulo: 'Imunidades por Produtos: Cesta Básica Nacional (Alíquota Zero Plena)',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo: 'Desoneração total de 100% de IBS e CBS para itens alimentares indispensáveis',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Alíquota Zero Constitucional Plena',
    descricao:
      'Imunidade e desoneração total de 100% (alíquota zero de IBS e CBS) conferida aos produtos alimentares essenciais que compõem a Cesta Básica Nacional de Alimentos definida pelo Anexo I da LC 214/2025, vedada qualquer tributação pelo Estado ou Município de destino.',
    oQueMuda:
      'Arroz, feijão, carnes bovinas, suínas e aves, leite fluido e em pó, café torrado/moído, manteiga, óleo vegetal, farinha de mandioca e pão comum não recolhem IBS nem CBS em nenhuma etapa da cadeia de distribuição ao consumidor.',
    baseLegal: 'CF/88 art. 156-A § 5º II; LC 214/2025 art. 125 e Anexo I; Decreto 12.955/2026',
    artigosRelevantes: [
      'Art. 156-A, § 5º, II da CF',
      'Art. 125 e Anexo I da LC 214/2025',
      'Art. 199 do RIBS',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — LC 214/2025 Anexo I (Lista Oficial da Cesta Básica)',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'CGIBS — Regulamento do IBS Anexo I de Desonerações',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Anexo I',
        dispositivo: 'Art. 125 e Anexo I',
        efeitoOuTratamento: 'Desoneração de 100% (alíquota zero integral)',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'cesta basica',
      'arroz',
      'feijao',
      'carne',
      'leite',
      'pao',
      'alimentos basicos',
      'aliquota zero',
      'imunidade de alimentos',
      'desoneracao',
    ],
    produtosOuSegmentosAfetados: [
      'Arroz',
      'Feijão',
      'Carnes in natura',
      'Leite pasteurizado',
      'Farinhas',
      'Pão francês',
      'Café',
    ],
    aliquotaOuTratamento: 'Alíquota Zero Plena (0,00% de IBS e 0,00% de CBS)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-02',
    titulo: 'Imunidades por Produtos: Livros, Jornais, Periódicos e Papel de Imprensa',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo: 'Imunidade cultural constitucional assegurada pelo art. 150, VI, "d" da CF/88',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Objetiva Cultural',
    descricao:
      'Imunidade constitucional objetiva incidente sobre livros de qualquer natureza, jornais, periódicos e o papel destinado a sua impressão, inclusive nas suas versões eletrônicas (e-books, áudio-livros e plataformas digitais de leitura conforme jurisprudência pacificada pelo STF e EC 132/2023).',
    oQueMuda:
      'Não há incidência de IBS nem de CBS sobre a comercialização, distribuição ou importação de livros e publicações editoriais periódicas. Mantém-se o direito de crédito para os estabelecimentos gráficos e editoriais conforme LC 214/2025.',
    baseLegal:
      'CF/88 art. 150 VI d e art. 156-A § 5º; LC 214/2025 arts. 6º a 8º; Súmula Vinculante 57 STF',
    artigosRelevantes: [
      'Art. 150, VI, "d" da CF/88',
      'Súmula Vinculante nº 57 do STF',
      'Art. 7º da LC 214/2025',
    ],
    fontesOficiais: [
      {
        nome: 'Supremo Tribunal Federal — Súmula Vinculante 57 (Livros Digitais)',
        orgao: 'Planalto',
        url: 'https://portal.stf.jus.br',
        tipo: 'lei',
      },
      {
        nome: 'Receita Federal — Parecer Normativo Imunidade de Livros e Periódicos',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'EC 132/2023',
        titulo: 'Emenda Constitucional nº 132/2023',
        dispositivo: 'Art. 156-A, § 5º, V',
        efeitoOuTratamento: 'Preservação da imunidade objetiva de imprensa e livros sobre o IBS',
        linkProxyPdf: '/backend/v1/download-resolution?id=EC-132-2023',
      },
    ],
    termosChave: [
      'livros',
      'livro',
      'ebook',
      'e-book',
      'jornais',
      'periodicos',
      'revistas',
      'papel de imprensa',
      'imunidade cultural',
      'art 150 vi d',
    ],
    produtosOuSegmentosAfetados: [
      'Editoras de livros',
      'Jornais impressos e digitais',
      'Revistas e publicações periódicas',
      'Plataformas de e-book',
    ],
    aliquotaOuTratamento: 'Não Incidência / Imunidade Constitucional Absoluta (0,00%)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-03',
    titulo: 'Imunidades por Segmentos: Exportações de Bens e Serviços (Desoneração com Crédito)',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Princípio do destino internacional com manutenção integral de créditos e devolução rápida',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Exportadora com Crédito Amplo',
    descricao:
      'Imunidade absoluta de IBS e CBS para as exportações de bens materiais e serviços prestados para o exterior, aplicando o princípio da tributação no destino. A reforma assegura manutenção de 100% dos créditos da cadeia produtiva e reembolso em prazo acelerado (até 60 dias) para impedir a exportação de resíduos tributários.',
    oQueMuda:
      'Elimina o contencioso antigo da Lei Kandir e do PIS/Cofins Exportação. Exportadores industriais, agronegócio exportador e empresas de tecnologia que vendem para o exterior não sofrem tributo na saída e recebem ressarcimento em dinheiro ou compensação automática via conta corrente tributária.',
    baseLegal: 'CF/88 art. 156-A § 5º I e art. 195 V; LC 214/2025 art. 8º; RIBS arts. 195 a 197',
    artigosRelevantes: [
      'Art. 156-A, § 5º, I da CF',
      'Art. 8º da LC 214/2025',
      'Arts. 195 a 197 da Resolução CGIBS 6/2026',
    ],
    fontesOficiais: [
      {
        nome: 'MDIC / Comex Stat — Diretrizes e Imunidades de Comércio Exterior',
        orgao: 'Planalto',
        url: 'https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior',
        tipo: 'portal',
      },
      {
        nome: 'CGIBS — Regulamento do IBS: Reembolso Acelerado aos Exportadores',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Livro I Título I Art. 8º (Das Exportações)',
        dispositivo: 'Art. 8º',
        efeitoOuTratamento:
          'Não incidência de IBS e CBS com apropriação e ressarcimento integral de créditos',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'exportacao',
      'exportacoes',
      'exportador',
      'comercio exterior',
      'venda externa',
      'resíduo tributario',
      'ressarcimento de credito',
      'imunidade exportadora',
      'principio do destino',
    ],
    produtosOuSegmentosAfetados: [
      'Agronegócio exportador (soja, milho, carnes)',
      'Indústria manufatureira exportadora',
      'Serviços de TI exportados',
    ],
    aliquotaOuTratamento:
      'Imunidade Plena (0%) + Manutenção e Restituição Integral de Créditos em até 60 dias',
    destaqueBusca: true,
  },

  // 10. ITENS ADICIONAIS DO CATÁLOGO DE IMUNIDADES, ALÍQUOTAS ZERO E NÃO INCIDÊNCIAS (ART. 145 E SEGUINTES DA LC 214/2025 E EC 132/2023)
  {
    id: 'esp-imunidade-04',
    titulo: 'Imunidades por Segmentos: Templos de Qualquer Culto e Organizações Religiosas',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Imunidade constitucional e não incidência estendida a entidades de culto e assistência correlata',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Constitucional Subjetiva',
    descricao:
      'Imunidade subjetiva plena de IBS e CBS assegurada pelo art. 150, VI, "b" e art. 156-A, § 5º da CF/88 c/c art. 6º e art. 145 da LC 214/2025 para templos de qualquer culto, organizações religiosas, congregações, seminários e entidades beneficentes a eles vinculadas em suas atividades essenciais.',
    oQueMuda:
      'Dízimos, ofertas, coletas, doações, vendas de livros doutrinários e celebrações religiosas não sofrem incidência de IBS nem de CBS. A EC 132/2023 e a LC 214/2025 pacificaram que a imunidade abrange organizações religiosas, creches e asilos mantidos pela igreja, mantendo direito a crédito nas aquisições essenciais.',
    baseLegal: 'CF/88 art. 150 VI b e art. 156-A § 5º; LC 214/2025 arts. 6º e 145; RIBS art. 198',
    artigosRelevantes: [
      'Art. 150, VI, "b" da CF/88',
      'Art. 156-A, § 5º da CF/88',
      'Arts. 6º e 145 da LC 214/2025',
      'Art. 198 do Regulamento do IBS (Res. CGIBS 6/2026)',
    ],
    fontesOficiais: [
      {
        nome: 'Portal da Legislação — Planalto: CF/88 Art. 150 e LC 214/2025',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Comitê Gestor do IBS — Regulamento do IBS (RIBS)',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Livro I Título I Capítulo II (Das Imunidades)',
        dispositivo: 'Arts. 6º e 145',
        efeitoOuTratamento:
          'Não incidência de IBS e CBS sobre receitas e serviços de finalidade religiosa',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
      {
        codigoNorma: 'EC 132/2023',
        titulo: 'Emenda Constitucional nº 132/2023',
        dispositivo: 'Art. 156-A, § 5º da CF',
        efeitoOuTratamento:
          'Extensão das imunidades constitucionais aos novos tributos sobre o consumo',
        linkProxyPdf: '/backend/v1/download-resolution?id=EC-132-2023',
      },
    ],
    termosChave: [
      'templo',
      'templos',
      'templo religioso',
      'igreja',
      'culto',
      'organizacoes religiosas',
      'dizimo',
      'oferta',
      'religioso',
      'imunidade religiosa',
      'art 150 vi b',
    ],
    produtosOuSegmentosAfetados: [
      'Igrejas e templos de qualquer culto',
      'Organizações religiosas e congregações',
      'Centros espíritas, terreiros e comunidades religiosas',
      'Seminários e instituições teológicas sem fins lucrativos',
    ],
    aliquotaOuTratamento: 'Imunidade Constitucional Total (0,00% IBS / 0,00% CBS)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-05',
    titulo:
      'Imunidades por Segmentos: Reciprocidade entre Entes Federativos (União, Estados, DF e Municípios)',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Imunidade recíproca assegurada pelo art. 150, VI, "a" da CF e art. 145 da LC 214/2025',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Recíproca Federativa',
    descricao:
      'Imunidade tributária recíproca que veda à União, aos Estados, ao Distrito Federal e aos Municípios instituir e cobrar IBS ou CBS sobre o patrimônio, renda e serviços uns dos outros, aplicando o art. 150, VI, "a" da CF/88 c/c art. 145 da LC 214/2025, estendida às autarquias e fundações públicas vinculadas às suas finalidades essenciais.',
    oQueMuda:
      'Prefeituras, governos estaduais, órgãos federais, autarquias e fundações públicas não pagam IBS nem CBS em suas operações estatais e serviços públicos indelegáveis. Em compras governamentais, aplica-se a alíquota zero com compensação financeira regulada pelo CGIBS.',
    baseLegal: 'CF/88 art. 150 VI a e art. 156-A § 5º; LC 214/2025 arts. 6º e 145; RIBS art. 198',
    artigosRelevantes: [
      'Art. 150, VI, "a" da CF/88',
      'Art. 150, § 2º da CF/88 (Autarquias e Fundações)',
      'Art. 145 da LC 214/2025',
    ],
    fontesOficiais: [
      {
        nome: 'Portal da Legislação — Presidência da República: CF/88 e LC 214/2025',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Senado Federal — Texto Compilado Oficial da Reforma Tributária',
        orgao: 'Senado Federal',
        url: 'https://normas.leg.br',
        tipo: 'lei',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Art. 145',
        efeitoOuTratamento:
          'Imunidade recíproca entre entes e desoneração nas compras governamentais',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'reciprocidade',
      'imunidade reciproca',
      'entes federativos',
      'uniao',
      'estados',
      'municipios',
      'prefeitura',
      'governo',
      'autarquia',
      'fundacao publica',
      'art 150 vi a',
    ],
    produtosOuSegmentosAfetados: [
      'Administração Pública Direta da União, Estados, DF e Municípios',
      'Autarquias e Fundações Públicas de direito público',
      'Serviços públicos indelegáveis',
    ],
    aliquotaOuTratamento: 'Imunidade Constitucional Recíproca (Não Incidência 0,00%)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-06',
    titulo: 'Imunidades por Segmentos: Partidos Políticos, Fundações e Fundos Partidários',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo: 'Não incidência sobre receitas partidárias, doações eleitorais e fundos públicos',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Partidária Constitucional',
    descricao:
      'Imunidade constitucional e não incidência de IBS e CBS sobre patrimônio, receitas, doações eleitorais, recursos do Fundo Partidário e do Fundo Especial de Financiamento de Campanha (FEFC) dos partidos políticos e suas fundações doutrinárias (art. 150, VI, "c" da CF/88 c/c art. 145 da LC 214/2025).',
    oQueMuda:
      'Atividades institucionais dos diretórios partidários, campanhas eleitorais e cursos das fundações partidárias estão plenamente imunes de tributação sobre o consumo.',
    baseLegal: 'CF/88 art. 150 VI c; LC 214/2025 arts. 6º e 145; Lei 9.096/1995',
    artigosRelevantes: [
      'Art. 150, VI, "c" da CF/88',
      'Art. 145 da LC 214/2025',
      'Art. 198 do RIBS',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — Texto Compilado Oficial LC 214/2025',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Tribunal Superior Eleitoral / Planalto — Legislação Partidária',
        orgao: 'Planalto',
        url: 'https://www.tse.jus.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Arts. 6º e 145',
        efeitoOuTratamento: 'Imunidade objetiva e subjetiva para partidos e fundações',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'partido politico',
      'partidos politicos',
      'fundo partidario',
      'fundacoes partidarias',
      'fefc',
      'doacao eleitoral',
      'campanha eleitoral',
      'imunidade partidaria',
    ],
    produtosOuSegmentosAfetados: [
      'Partidos políticos registrados no TSE',
      'Fundações e institutos partidários de formação política',
      'Fundos partidários e eleitorais',
    ],
    aliquotaOuTratamento: 'Imunidade Constitucional Absoluta (0,00%)',
    destaqueBusca: false,
  },
  {
    id: 'esp-imunidade-07',
    titulo:
      'Imunidades por Segmentos: Instituições de Educação e Assistência Social (com Condicionantes)',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Imunidade para entidades sem fins lucrativos que atendem aos requisitos do art. 14 do CTN e art. 145 da LC 214',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Condicionada (CEBAS / CTN)',
    descricao:
      'Imunidade subjetiva de IBS e CBS para instituições de educação e de assistência social sem fins lucrativos (art. 150, VI, "c" e art. 195, § 7º da CF/88 c/c arts. 6º, 7º e 145 da LC 214/2025), desde que não distribuam lucros, apliquem seus recursos integralmente no país e mantenham escrituração contábil regular.',
    oQueMuda:
      'Mensalidades escolares de entidades filantrópicas certificadas (CEBAS), serviços assistenciais hospitalares do SUS e ações sociais gratuitas não sofrem IBS nem CBS. Se venderem produtos em regime de concorrência de mercado desvinculados de sua finalidade, incidirá o tributo sobre a fração concorrencial.',
    baseLegal:
      'CF/88 art. 150 VI c e art. 195 § 7º; LC 214/2025 arts. 6º, 7º e 145; LC 187/2021 (CEBAS)',
    artigosRelevantes: [
      'Art. 150, VI, "c" da CF/88',
      'Art. 195, § 7º da CF/88',
      'Arts. 6º, 7º e 145 da LC 214/2025',
      'LC 187/2021 (Certificação Beneficente)',
    ],
    fontesOficiais: [
      {
        nome: 'Portal da Legislação — Planalto: LC 214/2025 e LC 187/2021',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Ministério da Fazenda / Receita Federal — Filantropia e Imunidade',
        orgao: 'RFB',
        url: 'https://www.receita.fazenda.gov.br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025 Título I Capítulo II e Art. 145',
        dispositivo: 'Arts. 6º, 7º e 145',
        efeitoOuTratamento:
          'Não incidência condicionada à observância das exigências estatutárias e filantrópicas',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'instituicoes de educacao',
      'assistencia social',
      'educacao filantropica',
      'filantropia',
      'cebas',
      'sem fins lucrativos',
      'entidade beneficente',
      'hospital filantropico',
      'imunidade educacional',
      'art 150 vi c',
    ],
    produtosOuSegmentosAfetados: [
      'Escolas e universidades comunitárias e filantrópicas',
      'Hospitais beneficentes e Santas Casas',
      'Entidades de acolhimento e assistência social',
    ],
    aliquotaOuTratamento: 'Imunidade Constitucional Subjetiva Condicionada (0,00%)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-08',
    titulo: 'Não Incidências Específicas: Ouro como Ativo Financeiro ou Instrumento Cambial',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo: 'Não incidência de IBS e CBS quando o ouro atua como ativo financeiro de reserva',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Ativo Financeiro / Reserva de Valor',
    descricao:
      'Não incidência de IBS e CBS sobre operações com ouro quando definido por lei como ativo financeiro ou instrumento cambial (art. 153, § 5º da CF/88 c/c arts. 5º, 145 e 185 da LC 214/2025), destinando-se a reservas internacionais e transações no mercado financeiro.',
    oQueMuda:
      'O ouro negociado como ativo financeiro entre instituições autorizadas pelo Banco Central e custodiado em reservas não sofre IBS nem CBS (permanece sob o regime próprio do IOF e ativos financeiros). Já o ouro vendido como mercadoria ou matéria-prima industrial (joalheria, eletrônica) segue o regime comercial regular.',
    baseLegal: 'CF/88 art. 153 § 5º; LC 214/2025 arts. 5º, 145 e 185; Lei 7.766/1989',
    artigosRelevantes: [
      'Art. 153, § 5º da CF/88',
      'Arts. 5º, 145 e 185 da LC 214/2025',
      'Art. 1º da Lei 7.766/1989',
    ],
    fontesOficiais: [
      {
        nome: 'Banco Central do Brasil — Diretrizes do Ouro como Ativo de Reserva',
        orgao: 'Planalto',
        url: 'https://www.bcb.gov.br',
        tipo: 'portal',
      },
      {
        nome: 'Planalto — Texto Compilado Oficial LC 214/2025',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Arts. 5º e 145',
        efeitoOuTratamento:
          'Não incidência sobre operações de ativo financeiro e transferências decorrentes',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'ouro',
      'ouro ativo financeiro',
      'ativo financeiro',
      'reserva internacional',
      'instrumento cambial',
      'banco central',
      'ativo de reserva',
      'lingote de ouro',
    ],
    produtosOuSegmentosAfetados: [
      'Instituições financeiras custodiantes de ouro',
      'Banco Central do Brasil e reservas soberanas',
      'Corretoras e distribuidores de títulos e valores mobiliários (DTVM)',
    ],
    aliquotaOuTratamento: 'Não Incidência de IBS e CBS (Regime de Ativo Financeiro)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-09',
    titulo:
      'Não Incidências Específicas: Petróleo, Gás Natural e Energia Elétrica Destinados ao Exterior',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Desoneração plena nas exportações energéticas com preservação de créditos de exploração',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Imunidade Exportadora Energética',
    descricao:
      'Não incidência de IBS e CBS sobre as exportações de petróleo bruto, derivados de petróleo, gás natural liquefeito/gasoso e energia elétrica destinados ao exterior, aplicando o princípio do destino internacional e art. 155, § 2º, X, "b" da CF/88 c/c arts. 8º e 145 da LC 214/2025 e Decreto 12.955/2026.',
    oQueMuda:
      'Garante desoneração completa nas vendas externas de hidrocarbonetos e eletricidade para países vizinhos ou mercado global, assegurando apropriação e ressarcimento dos créditos acumulados da fase de prospecção, perfuração e refino (Repetro/RIBS).',
    baseLegal:
      'CF/88 art. 155 § 2º X b e art. 156-A § 5º I; LC 214/2025 arts. 8º e 145; RIBS Anexo IV',
    artigosRelevantes: [
      'Art. 155, § 2º, X, "b" da CF/88',
      'Art. 156-A, § 5º, I da CF/88',
      'Arts. 8º e 145 da LC 214/2025',
    ],
    fontesOficiais: [
      {
        nome: 'Agência Nacional do Petróleo (ANP) / Planalto — Regras de Exportação',
        orgao: 'Planalto',
        url: 'https://www.gov.br/anp/pt-br',
        tipo: 'portal',
      },
      {
        nome: 'CGIBS — Regulamento do IBS: Regime Aduaneiro de Óleo e Gás',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Arts. 8º e 145',
        efeitoOuTratamento: 'Desoneração total na saída ao exterior de hidrocarbonetos e energia',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'petroleo',
      'petroleo bruto',
      'gas natural',
      'gnl',
      'energia eletrica',
      'combustiveis destinados ao exterior',
      'exportacao de petroleo',
      'hidrocarbonetos',
    ],
    produtosOuSegmentosAfetados: [
      'Produtores e refinarias de petróleo (offshore/onshore)',
      'Exportadores de gás natural',
      'Comercializadoras de energia elétrica internacional',
    ],
    aliquotaOuTratamento: 'Imunidade / Desoneração Plena com Manutenção de Créditos (0,00%)',
    destaqueBusca: false,
  },
  {
    id: 'esp-imunidade-10',
    titulo: 'Alíquotas Zero e Desonerações: Medicamentos, Dispositivos Médicos e Fórmulas Enterais',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Isenção e alíquota zero para fármacos oncológicos, hemoderivados e nutrição enteral',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Alíquota Zero de Saúde Pública',
    descricao:
      'Alíquota zero integral de IBS e CBS conferida aos medicamentos essenciais, vacinas, terapias oncológicas, hemoderivados, dispositivos médicos adquiridos pelo SUS e fórmulas de nutrição enteral e parenteral, conforme art. 143, art. 144 e Anexos VI e XII da LC 214/2025.',
    oQueMuda:
      'Garante acesso universal e custo reduzido em tratamentos de câncer, hemodiálise, doenças raras e suporte nutricional hospitalar, zerando tanto a CBS federal quanto o IBS de estados e municípios em toda a cadeia distributiva.',
    baseLegal: 'LC 214/2025 arts. 143, 144 e Anexos VI e XII; RIBS arts. 219 e 220; Anvisa RDC',
    artigosRelevantes: [
      'Art. 143 da LC 214/2025 (Medicamentos)',
      'Art. 144 e Anexo XII da LC 214/2025 (Dispositivos Médicos)',
      'Arts. 219 e 220 da Resolução CGIBS 6/2026',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — LC 214/2025 Anexos VI e XII (Listas Oficiais de Saúde Zero)',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Ministério da Saúde / ANVISA — Relação Nacional de Medicamentos',
        orgao: 'Planalto',
        url: 'https://www.gov.br/anvisa/pt-br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Arts. 143, 144 e Anexos VI e XII',
        efeitoOuTratamento:
          'Desoneração de 100% de IBS e CBS para itens de saúde pública essencial',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'medicamento',
      'medicamentos',
      'remedio',
      'vacina',
      'dispositivo medico',
      'nutricao enteral',
      'nutricao parenteral',
      'oncologico',
      'hemoderivado',
      'aliquota zero saude',
    ],
    produtosOuSegmentosAfetados: [
      'Indústria farmacêutica e laboratórios',
      'Distribuidores de medicamentos essenciais',
      'Hospitais públicos e privados',
      'Pacientes do SUS e clínicas oncológicas',
    ],
    aliquotaOuTratamento: 'Alíquota Zero Plena (0,00% IBS / 0,00% CBS)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-11',
    titulo:
      'Alíquotas Zero e Desonerações: Dispositivos de Acessibilidade para Pessoas com Deficiência (PCD)',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Desoneração total para cadeiras de rodas, aparelhos auditivos, próteses e tecnologias assistivas',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Acessibilidade Plena PCD (0%)',
    descricao:
      'Alíquota zero integral de IBS e CBS sobre o fornecimento de dispositivos de acessibilidade para pessoas com deficiência relacionados no Anexo XIII da LC 214/2025 e art. 145 c/c art. 221 do RIBS, incluindo cadeiras de rodas, próteses auditivas, implantes cocleares, barras de apoio e leitores táteis.',
    oQueMuda:
      'Garante que equipamentos de autonomia e inclusão física, sensorial e motora não sofram qualquer tributo sobre o consumo na fabricação, importação ou revenda no território nacional.',
    baseLegal:
      'LC 214/2025 art. 145 e Anexo XIII; RIBS art. 221; Estatuto da Pessoa com Deficiência',
    artigosRelevantes: [
      'Art. 145 e Anexo XIII da LC 214/2025',
      'Art. 221 do Regulamento do IBS (Res. CGIBS 6/2026)',
      'Lei 13.146/2015 (Estatuto da PCD)',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — LC 214/2025 Anexo XIII (Lista de Acessibilidade Alíquota Zero)',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'CGIBS — Resolução CGIBS 6/2026 Art. 221 e Tabelas de Desoneração',
        orgao: 'CGIBS',
        url: 'https://www.cgibs.gov.br/',
        tipo: 'resolucao',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Art. 145 e Anexo XIII',
        efeitoOuTratamento:
          'Alíquota zero sobre fornecimento de tecnologia assistiva e acessibilidade',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'acessibilidade',
      'pcd',
      'cadeira de rodas',
      'protese',
      'aparelho auditivo',
      'implante coclear',
      'barra de apoio',
      'tecnologia assistiva',
      'deficiencia',
      'aliquota zero pcd',
    ],
    produtosOuSegmentosAfetados: [
      'Fabricantes de cadeiras de rodas e órteses/próteses',
      'Importadores de tecnologia assistiva e leitores em braille',
      'Clínicas de reabilitação e lojas de produtos ortopédicos',
    ],
    aliquotaOuTratamento: 'Alíquota Zero Plena (0,00% de IBS e CBS)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-12',
    titulo: 'Alíquotas Zero e Reduções: Produtos Hortícolas, Frutas Frescas e Ovos in Natura',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Desoneração de produtos hortifrutícolas frescos essenciais para nutrição da população',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Hortifrúti e Ovos Desonerados',
    descricao:
      'Alíquota zero integral de IBS e CBS para produtos hortícolas, frutas frescas e ovos in natura relacionados no Anexo XV da LC 214/2025 c/c art. 144 e art. 222 do RIBS, garantindo desoneração do campo até a mesa do consumidor final.',
    oQueMuda:
      'Hortaliças, legumes, tubérculos, frutas in natura e ovos de galinha e codorna não sofrem IBS nem CBS em feiras, supermercados e distribuição atacadista.',
    baseLegal: 'LC 214/2025 art. 144 e Anexo XV; RIBS art. 222; Portarias MAPA',
    artigosRelevantes: ['Art. 144 e Anexo XV da LC 214/2025', 'Art. 222 da Resolução CGIBS 6/2026'],
    fontesOficiais: [
      {
        nome: 'Planalto — LC 214/2025 Anexo XV (Produtos Hortícolas, Frutas e Ovos)',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Ministério da Agricultura e Pecuária (MAPA) — Normas de Hortifrúti',
        orgao: 'Planalto',
        url: 'https://www.gov.br/agricultura/pt-br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Art. 144 e Anexo XV',
        efeitoOuTratamento: 'Desoneração total de IBS/CBS sobre hortifrúti fresco e ovos',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'horticolas',
      'hortifruti',
      'frutas',
      'fruta fresca',
      'legumes',
      'verduras',
      'ovos',
      'ovo',
      'tomate',
      'alface',
      'maca',
      'banana',
    ],
    produtosOuSegmentosAfetados: [
      'Produtores rurais familiares e hortifrutigranjeiros',
      'CEASAs e entrepostos de distribuição de alimentos',
      'Supermercados, feiras e sacolões',
    ],
    aliquotaOuTratamento: 'Alíquota Zero Plena (0,00% de IBS e CBS)',
    destaqueBusca: true,
  },
  {
    id: 'esp-imunidade-13',
    titulo:
      'Tratamentos Específicos: Serviços Educacionais, Serviços de Saúde e Planos de Saúde (Prouni / Deduções)',
    categoria: 'Imunidades por Produtos e Segmentos',
    subtitulo:
      'Regime de alíquota reduzida de 60% e alíquota zero nos programas Prouni e atendimento público',
    foraTributacaoGeral: true,
    badgeExcecao: 'Fora da Tributação Geral · Regime Social de Saúde e Educação',
    descricao:
      'Regime de redução de 60% na alíquota geral com hipóteses de alíquota zero para bolsas do Prouni, serviços do SUS e convênios públicos, c/c regime específico de planos privados de assistência à saúde com dedução de repasses a médicos e hospitais (arts. 129, 130, 144 e 212 a 221 da LC 214/2025).',
    oQueMuda:
      'Universidades que aderem ao Prouni mantêm isenção/alíquota zero correspondente às bolsas integrais concedidas. Hospitais que prestam serviços ao SUS são desonerados, e operadoras de planos de saúde apuram IBS/CBS apenas sobre o valor líquido de administração, sem bitributação sobre os repasses à rede credenciada.',
    baseLegal: 'LC 214/2025 arts. 129, 130, 144, 212 a 221 e Anexos II, III; RIBS arts. 204–206',
    artigosRelevantes: [
      'Arts. 129 e 130 da LC 214/2025',
      'Arts. 212 a 221 da LC 214/2025 (Planos de Saúde)',
      'Lei 11.096/2005 (Prouni)',
    ],
    fontesOficiais: [
      {
        nome: 'Planalto — LC 214/2025 Regras de Educação e Saúde',
        orgao: 'Planalto',
        url: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei.complementar:2025-01-16;214',
        tipo: 'lei',
      },
      {
        nome: 'Agência Nacional de Saúde Suplementar (ANS) / RFB',
        orgao: 'RFB',
        url: 'https://www.gov.br/ans/pt-br',
        tipo: 'portal',
      },
    ],
    conexoesNormativas: [
      {
        codigoNorma: 'LC 214/2025',
        titulo: 'LC 214/2025',
        dispositivo: 'Arts. 129, 130, 144 e 212 a 221',
        efeitoOuTratamento:
          'Redução de 60%, alíquota zero no Prouni e tributação da margem em planos',
        linkProxyPdf: '/backend/v1/download-resolution?id=LC-214-2025',
      },
    ],
    termosChave: [
      'servicos educacionais',
      'servicos de saude',
      'planos de saude',
      'plano de saude',
      'prouni',
      'bolsa de estudo',
      'sus',
      'atendimento publico',
      'convenio medico',
      'deducao de repasses',
    ],
    produtosOuSegmentosAfetados: [
      'Faculdades e instituições participantes do Prouni',
      'Operadoras de planos e seguros de saúde suplementar',
      'Hospitais, clínicas e laboratórios credenciados',
    ],
    aliquotaOuTratamento: 'Redução de 60% (12,00%) e Alíquota Zero em bolsas Prouni/SUS',
    destaqueBusca: true,
  },
]
