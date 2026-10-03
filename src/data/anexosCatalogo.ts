/**
 * Catálogo dos Anexos da Reforma Tributária — Seção 7 (Parcelas 1 e 2)
 * Fonte: texto oficial extraído — RIBS (Res. CGIBS 6/2026, PDF cgibs.gov.br),
 * LC 214/2025 compilada (Planalto) e Decreto 12.955/2026 (Planalto).
 * Parcela 2: extração ITEM A ITEM dos Anexos VIII (higiene) e XII (dispositivos
 * médicos zero) da LC 214 + itens dos Anexos II, III, VII, IX e XV + índice
 * de volumes de todos os anexos da LC 214.
 */

export interface ItemAnexo {
  item: string
  descricao: string
  codigo?: string // NCM/SH ou NBS
}

export interface Conexao {
  rotulo: string
  alvo: string // âncora da seção ou URL do simulador
  tipo: 'secao' | 'simulador'
}

export interface AnexoInfo {
  id: string
  instrumento: 'RIBS' | 'LC214' | 'DEC12955'
  instrumentoNome: string
  anexo: string
  tituloOficial: string
  baseLegal: string
  efeito: string
  tabelas?: string[]
  itens?: string
  itensDetalhados?: ItemAnexo[]
  detalhe: string
  conexoes: Conexao[]
  fonte: { nome: string; url: string }
}

export const ANEXOS: AnexoInfo[] = [
  // ============ RIBS — Resolução CGIBS 6/2026 (Regulamento do IBS) ============
  {
    id: 'ribs-a1',
    instrumento: 'RIBS',
    instrumentoNome: 'Resolução CGIBS 6/2026 — Regulamento do IBS',
    anexo: 'Anexo I',
    tituloOficial: 'Taxas anuais de depreciação (Art. 48, § 1º)',
    baseLegal: 'RIBS, arts. 47–48 (remissão: arts. 47 e 47, § 7º, da LC 214/2025)',
    efeito:
      'Define prazo de vida útil e taxa anual de depreciação de bens do ativo imobilizado — parâmetro do estorno proporcional de créditos do IBS em caso de perecimento, deterioração, roubo, furto ou extravio.',
    itens: '≈260 itens (extração do PDF oficial)',
    detalhe:
      'Tabela única por NCM/capítulo: instalações (10 anos/10%), edificações (25 anos/4%), animais vivos (5 anos/20%), aves domésticas (2 anos/50%), embalagens e vasilhames (5 anos/20%), correias transportadoras (2 anos/50%), entre outros. Referenciada também no cômputo de créditos de cooperativas (crédito proporcional à depreciação do bem no período).',
    conexoes: [
      { rotulo: 'Créditos e estornos — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: bens de capital',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
  },
  {
    id: 'ribs-a2',
    instrumento: 'RIBS',
    instrumentoNome: 'Resolução CGIBS 6/2026 — Regulamento do IBS',
    anexo: 'Anexo II',
    tituloOficial: 'Repetro (Art. 164)',
    baseLegal: 'RIBS, art. 164 e §§ 2º a 5º (remissão: art. 93 da LC 214/2025)',
    efeito:
      'Lista os bens com suspensão do pagamento do IBS nas operações do Regime Aduaneiro Especial de Petróleo e Gás (Repetro), nas seis modalidades do art. 164.',
    tabelas: [
      'Tabela I — Repetro-Temporário (art. 164, I): importação temporária p/ exploração, desenvolvimento e produção',
      'Tabela II — GNL-Temporário (art. 164, II): transporte, movimentação, transferência, armazenamento e regaseificação de GNL',
      'Tabela III — Repetro-Permanente (art. 164, III, IV e V): permanência definitiva + industrialização e produto final',
      'Tabela IV — Repetro-Entreposto (art. 164, VI): conversão/construção contratada por empresa do exterior',
    ],
    itens: '≈580 itens nas 4 tabelas (extração do PDF oficial)',
    detalhe:
      'Suspensão vale enquanto o bem estiver submetido ao regime; habilitação prévia da empresa em ato conjunto RFB/CGIBS (§ 8º). Na modalidade Repetro-Permanente a suspensão converte-se em alíquota zero após 5 anos do registro da DI (§ 10). Vedada a suspensão p/ cabotagem, navegação interior e apoio portuário/marítimo (§ 9º). Exemplos: tubos de perfuração (7304), turbinas a gás (8411), sistemas modulares de compressão de CO₂ (8414), navios-sonda (8905).',
    conexoes: [
      { rotulo: 'Regimes específicos — Seção 6', alvo: '#secao-6', tipo: 'secao' },
      {
        rotulo: 'Simulador: suspensão/REPORTO',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
  },
  {
    id: 'ribs-a3',
    instrumento: 'RIBS',
    instrumentoNome: 'Resolução CGIBS 6/2026 — Regulamento do IBS',
    anexo: 'Anexo III',
    tituloOficial:
      'Lista de bens com suspensão do pagamento do IBS no regime diferenciado do Reporto (Art. 186, § 5º)',
    baseLegal: 'RIBS, art. 186, § 5º (remissão: art. 105 da LC 214/2025)',
    efeito:
      'Bens com suspensão do IBS nas importações e aquisições pelos beneficiários do Reporto (portos), destinados ao ativo imobilizado.',
    itens: '14 itens',
    detalhe:
      'Trilhos (7302), aparelhos de pesagem (8423), talhas e guinchos (8425), guindastes e pontes rolantes (8426), empilhadeiras (8427), máquinas de movimentação (8428), locomotivas e vagões (8601/8602/8606), tratores rodoviários (8701), caminhões (8704), veículos de fábrica/porto (8709), reboques (8716), aparelhos de raios X (9022) e medidores de nível (9026). Condições: peças de reposição com valor ≥ 20% da máquina (§ 6º); usufruto até 31/12/2028 (§ 7º); Simples Nacional não adere (§ 8º). A suspensão converte-se em alíquota zero após a incorporação (§ 2º).',
    conexoes: [
      { rotulo: 'Regimes específicos — Seção 6', alvo: '#secao-6', tipo: 'secao' },
      {
        rotulo: 'Simulador: suspensão/REPORTO',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
  },
  {
    id: 'ribs-a4',
    instrumento: 'RIBS',
    instrumentoNome: 'Resolução CGIBS 6/2026 — Regulamento do IBS',
    anexo: 'Anexo IV',
    tituloOficial: 'Bens de capital desonerados (Arts. 196 e 197)',
    baseLegal: 'RIBS, arts. 196–197 (remissão: arts. 109 e 110 da LC 214/2025)',
    efeito:
      'Suspensão do IBS na aquisição/importação de bens de capital da Tabela I; alíquota zero para tratores/máquinas agrícolas (Tabela II) e veículos de carga de transportador autônomo PF não contribuinte (Tabela III).',
    tabelas: [
      'Tabela I — Bens de capital com suspensão (art. 196)',
      'Tabela II — Tratores, máquinas e implementos agrícolas p/ produtor rural não contribuinte (art. 197, I)',
      'Tabela III — Veículos de carga p/ transportador autônomo PF não contribuinte (art. 197, II)',
    ],
    itens: '≈103 itens nas 3 tabelas (extração do PDF oficial)',
    detalhe:
      'Tabela I: motores e turbinas de aviação (8407/8411), aceleradores de partículas (8543), satélites (8802), navios de guerra (8906), microscópios eletrônicos (9012), cromatógrafos (9027). A suspensão converte-se em alíquota zero após a incorporação ao ativo imobilizado (art. 196, § 1º); não incorporou → recolhimento com multa e juros (§ 2º). Tabela II: pulverizadores (8424), tratores (8429), colheitadeiras. Tabela III: chassis e caminhões 8704 (até 5 t, 5–20 t, acima de 20 t), tanques e reboques (8716). Aplica-se também a optantes do Simples no regime regular (art. 196, § 3º).',
    conexoes: [
      { rotulo: 'Desoneração de bens de capital — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: bens de capital',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
  },
  {
    id: 'ribs-a5',
    instrumento: 'RIBS',
    instrumentoNome: 'Resolução CGIBS 6/2026 — Regulamento do IBS',
    anexo: 'Anexo V',
    tituloOficial: 'Bens fabricados na ZFM com 100% de crédito presumido (Art. 521, § 1º, IV)',
    baseLegal: 'RIBS, art. 521, § 1º, IV (remissão: art. 450 da LC 214/2025)',
    efeito:
      'Crédito presumido de 100% do IBS para bens de TIC e produtos com crédito estímulo de ICMS do Amazonas, produzidos por indústria incentivada na Zona Franca de Manaus.',
    itens: '49 itens',
    detalhe:
      'Percentuais do crédito presumido ZFM (art. 521, § 1º): 55% bens de consumo final, 75% bens de capital, 90,25% bens intermediários e 100% TIC/produtos com crédito estímulo estadual (este anexo). Itens: embarcações (8901), monitores (8528), som e autorrádio (8521/8527), vestuário (capítulos 61/62), veículos utilitários (8703/8704), brinquedos (9503), ar-condicionado (8415), fogões (8516), bicicletas (8712), soundbar (8518), relógios (9102), entre outros — cada item com a legislação estadual de origem (Leis 2.826/03, 4.090/07, Decretos 41.576/19, 44.958/21, 48.216/23, 48.569/23). Exclusões do regime ZFM (art. 434): armas, fumo, bebidas alcoólicas, automóveis de passageiros, petróleo/combustíveis e perfumaria.',
    conexoes: [
      { rotulo: 'Regimes específicos — Seção 6', alvo: '#secao-6', tipo: 'secao' },
      {
        rotulo: 'Simulador: ZFM',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
      url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
    },
  },

  // ============ LC 214/2025 — anexos referenciados pelo RIBS ============
  {
    id: 'lc214-a1',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo I',
    tituloOficial: 'Cesta Básica Nacional de Alimentos',
    baseLegal: 'LC 214, art. 125; RIBS, art. 199; EC 132, art. 8º',
    efeito:
      'Alíquota zero do IBS (e CBS) sobre os produtos alimentícios relacionados, com especificação NCM/SH.',
    itens: '49 itens no catálogo do Simulador (cesta_zero)',
    detalhe:
      'Produtos destinados à alimentação humana. Venda em conjunto não perde o benefício se o valor de cada item beneficiado for especificado (RIBS, art. 199, § 3º). Alterações de lista dependem do procedimento dos §§ 9º e 11 do art. 156-A da CF.',
    conexoes: [
      { rotulo: 'Cesta Básica — Seção 3', alvo: '#secao-3', tipo: 'secao' },
      {
        rotulo: 'Simulador: cesta_zero (49 itens)',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a2',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo II',
    tituloOficial: 'Serviços de educação (redução 60%)',
    baseLegal: 'LC 214, art. 129; RIBS, art. 204',
    efeito:
      'Redução de 60% das alíquotas do IBS sobre o fornecimento dos serviços de educação, com especificação NBS.',
    itens: '9 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      {
        item: '1',
        descricao: 'Ensino Infantil, inclusive creche e pré-escola',
        codigo: '1.2201.1',
      },
      { item: '2', descricao: 'Ensino Fundamental', codigo: '1.2201.20.00' },
      { item: '3', descricao: 'Ensino Médio', codigo: '1.2201.30.00' },
      { item: '4', descricao: 'Ensino Técnico de Nível Médio', codigo: '1.2202.00.00' },
      {
        item: '5',
        descricao:
          'Ensino para jovens e adultos destinado àqueles que não tiveram acesso ou continuidade de estudos no ensino fundamental e médio na idade própria',
        codigo: '1.2203',
      },
      {
        item: '6',
        descricao:
          'Ensino Superior, compreendidos os cursos e programas de graduação, pós-graduação, de extensão e cursos sequenciais',
        codigo: '1.2204',
      },
      {
        item: '7',
        descricao: 'Ensino de sistemas linguísticos de natureza visomotora e de escrita tátil',
        codigo: '1.2205.13.00',
      },
      {
        item: '8',
        descricao: 'Ensino de línguas nativas de povos originários',
        codigo: '1.2205.13.00',
      },
      {
        item: '9',
        descricao:
          'Educação especial destinada a pessoas com deficiência, transtornos globais do desenvolvimento e altas habilidades ou superdotação, de modo isolado ou agregado a qualquer das etapas de educação tratadas neste Anexo',
      },
    ],
    detalhe:
      'A redução aplica-se somente sobre a contraprestação dos serviços listados; não alcança outras operações no âmbito da escola/instituição (RIBS, art. 204, parágrafo único).',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: educação',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a3',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo III',
    tituloOficial: 'Serviços de saúde (redução 60%)',
    baseLegal: 'LC 214, art. 130; RIBS, art. 205',
    efeito:
      'Redução de 60% das alíquotas do IBS sobre o fornecimento dos serviços de saúde, com especificação NBS.',
    itens: '30 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      { item: '1', descricao: 'Serviços cirúrgicos', codigo: '1.2301.11.00' },
      { item: '2', descricao: 'Serviços ginecológicos e obstétricos', codigo: '1.2301.12.00' },
      { item: '3', descricao: 'Serviços psiquiátricos', codigo: '1.2301.13.00' },
      {
        item: '4',
        descricao: 'Serviços prestados em Unidades de Terapia Intensiva',
        codigo: '1.2301.14.00',
      },
      { item: '5', descricao: 'Serviços de atendimento de urgência', codigo: '1.2301.15.00' },
      {
        item: '6',
        descricao: 'Serviços hospitalares não classificados em subposições anteriores',
        codigo: '1.2301.19.00',
      },
      { item: '7', descricao: 'Serviços de clínica médica', codigo: '1.2301.21.00' },
      { item: '8', descricao: 'Serviços médicos especializados', codigo: '1.2301.22.00' },
      { item: '9', descricao: 'Serviços odontológicos', codigo: '1.2301.23.00' },
      { item: '10', descricao: 'Serviços de enfermagem', codigo: '1.2301.91.00' },
      { item: '11', descricao: 'Serviços de fisioterapia', codigo: '1.2301.92.00' },
      { item: '12', descricao: 'Serviços laboratoriais', codigo: '1.2301.93.00' },
      { item: '13', descricao: 'Serviços de diagnóstico por imagem', codigo: '1.2301.94.00' },
      {
        item: '14',
        descricao: 'Serviços de bancos de material biológico humano',
        codigo: '1.2301.95.00',
      },
      { item: '15', descricao: 'Serviços de ambulância', codigo: '1.2301.96.00' },
      {
        item: '16',
        descricao: 'Serviços de assistência ao parto e pós-parto',
        codigo: '1.2301.97.00',
      },
      { item: '17', descricao: 'Serviços de psicologia', codigo: '1.2301.98.00' },
      { item: '18', descricao: 'Serviços de vigilância sanitária', codigo: '1.2301.99.00' },
      { item: '19', descricao: 'Serviços de epidemiologia', codigo: '1.2301.99.00' },
      { item: '20', descricao: 'Serviços de vacinação', codigo: '1.2301.99.00' },
      { item: '21', descricao: 'Serviços de fonoaudiologia', codigo: '1.2301.99.00' },
      { item: '22', descricao: 'Serviços de nutrição', codigo: '1.2301.99.00' },
      { item: '23', descricao: 'Serviços de optometria', codigo: '1.2301.99.00' },
      { item: '24', descricao: 'Serviços de instrumentação cirúrgica', codigo: '1.2301.99.00' },
      { item: '25', descricao: 'Serviços de biomedicina', codigo: '1.2301.99.00' },
      { item: '26', descricao: 'Serviços farmacêuticos', codigo: '1.2301.99.00' },
      {
        item: '27',
        descricao:
          'Serviços de cuidado e assistência a idosos e pessoas com deficiência em unidades de acolhimento',
        codigo: '1.2302',
      },
      {
        item: '28',
        descricao:
          'Serviços domiciliares de apoio a pessoas adultas, idosas, crianças, adolescentes, pessoas com transtornos mentais e com deficiências',
        codigo: '1.2301.99.00',
      },
      { item: '29', descricao: 'Serviços de esterilização', codigo: '1.2301.99.0' },
      {
        item: '30',
        descricao: 'Serviços funerários, de cremação e de embalsamamento',
        codigo: '1.2603.00.00',
      },
    ],
    detalhe:
      'Valores glosados pela auditoria médica dos planos de assistência à saúde e não pagos não integram a base de cálculo do IBS (RIBS, art. 205, parágrafo único).',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: saúde',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a4',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo IV',
    tituloOficial: 'Dispositivos médicos (redução 60%; zero p/ órgãos públicos e CEBAS-SUS)',
    baseLegal: 'LC 214, arts. 131 e 144; RIBS, arts. 206 e 220',
    efeito:
      'Redução de 60% no fornecimento a particulares; alíquota zero quando adquiridos por órgãos públicos e entidades imunes com CEBAS que prestem serviços ao SUS.',
    itens: '105 itens (extração item a item — Parcela 2)',
    detalhe:
      'Exige regularização na Anvisa (RIBS, art. 206, § 1º). Lista revisada a cada 120 dias por ato conjunto Fazenda/CGIBS, só para inclusão de dispositivos inexistentes com as mesmas finalidades (art. 206, § 2º). Em emergência de saúde pública, ato conjunto pode incluir dispositivos fora da lista, com vigência limitada (art. 220, § 3º). Amostra da lista: bolsa para drenagem (3926.90.30), sistema para drenagem com medição de diurese (9018.90.99), chapas e filmes para raios-X (3701.10.10/3702.10), cimentos para reconstituição óssea (3006.40.20), conjuntos para diálise (3004.90.99), conjunto para hidrocefalia (9021.90.19/9021.90.80), eletrodos de marcapasso (9021.90.91), filtros para cardioplegia (8421.29.90), fios de sutura esterilizados, tomógrafo e aparelhos de raio X, respirador (9019.20.40), monitor multiparâmetros (9018.19.80), bomba de infusão (9018.90.10), ressonância magnética (9018.13.00), ultrassom (9018.12), cateteres e guias (9018.39).',
    conexoes: [
      { rotulo: 'Saúde — Seções 5 e 6', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: dispositivos60 (11) e zero',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a5',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo V',
    tituloOficial: 'Dispositivos de acessibilidade p/ pessoas com deficiência (redução 60%)',
    baseLegal: 'LC 214, art. 132; RIBS, art. 207',
    efeito: 'Redução de 60% das alíquotas do IBS sobre o fornecimento, com especificação NCM/SH.',
    itens: '≈30 itens com subitens (extração item a item — Parcela 2)',
    detalhe:
      'Exige atendimento a requisitos de norma do órgão competente (RIBS, art. 207, § 1º); revisão a cada 120 dias por ato conjunto, só para inclusões (art. 207, § 2º). Estrutura da lista: acessórios e adaptações especiais para veículos de PCD (comandos manuais de embreagem/freio/acelerador 8708.99.10, plataformas de elevação 8428.90.90), e grupos de bens de uso pessoal e doméstico adaptados (relógio despertador vibratório/luminoso 9103.10.00/9105.11.00, mouse controlado pelos olhos 8471.60.53). O Anexo XIII da LC 214 traz a lista equivalente para a alíquota zero (RIBS, art. 221).',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: acessibilidade',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a6',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo VI',
    tituloOficial: 'Composições para nutrição enteral/parenteral e fórmulas especiais',
    baseLegal: 'LC 214, arts. 133, § 1º, e 146, § 2º; RIBS, arts. 208 e 222',
    efeito:
      'Redução de 60% como acessório aos medicamentos; alíquota zero quando adquiridos por órgãos públicos e entidades CEBAS-SUS.',
    itens: '81 itens (extração item a item — Parcela 2)',
    detalhe:
      'Destinadas a pessoas com erros inatos do metabolismo, com especificação NCM/SH. Amostra: acetato de dextroalfatocoferol (2936.28.12), acetato de lisina (2922.41.90), ácido ascórbico (2936.27.10), ácido cítrico (2918.14.00), aminoácidos (treonina 2922.50.99), triglicerídeos de cadeia média (1513.19.00/1513.29.11). Lista do Anexo VI revisada a cada 120 dias (RIBS, art. 209).',
    conexoes: [
      { rotulo: 'Saúde — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: saúde',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a7',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo VII',
    tituloOficial: 'Alimentos destinados ao consumo humano (redução 60%)',
    baseLegal: 'LC 214, art. 135; RIBS, art. 210',
    efeito: 'Redução de 60% das alíquotas do IBS sobre o fornecimento, com especificação NCM/SH.',
    itens: '17 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      {
        item: '1',
        descricao:
          'Crustáceos (exceto lagostas e lagostim) e moluscos — 0306.1 e 0306.3 (exceto 0306.11, 0306.15.00, 0306.31.00, 0306.34.00, 0306.39.10); 0307.31.00, 0307.32.00, 0307.42.00, 0307.43, 0307.51.00, 0307.52.00, 0307.91.00 e 0307.92.00',
      },
      {
        item: '2',
        descricao: 'Leite fermentado, bebidas e compostos lácteos, conforme legislação específica',
        codigo: '0403.20.00, 0403.90.00, 2202.99.00',
      },
      { item: '3', descricao: 'Mel natural', codigo: '0409.00.00' },
      {
        item: '4',
        descricao:
          'Farinha das posições 1101.00, 11.02, 11.05, 11.06 e 12.08; ressalvados os produtos do Anexo I',
      },
      { item: '5', descricao: 'Grumos e sêmolas de cereais', codigo: '1103.11.00, 1103.19.00' },
      {
        item: '6',
        descricao:
          'Grãos de cereais das subposições 1104.1 e 1104.2; ressalvados os produtos do Anexo I',
      },
      { item: '7', descricao: 'Amido de milho', codigo: '1108.12.00' },
      {
        item: '8',
        descricao:
          'Óleos de soja, milho, canola e demais óleos vegetais para consumo como alimento',
        codigo: '1507.90, 15.08, 15.11, 15.12, 15.13, 15.14, 15.15',
      },
      { item: '9', descricao: 'Massas alimentícias', codigo: '1902.20.00, 1902.30.00' },
      {
        item: '10',
        descricao:
          'Sucos naturais de fruta ou de produtos hortícolas sem adição de açúcar/edulcorantes e sem conservantes',
        codigo: '20.09',
      },
      {
        item: '11',
        descricao:
          'Polpas de frutas ou de produtos hortícolas sem adição de açúcar/edulcorantes e sem conservantes',
        codigo: '20.08',
      },
      { item: '12', descricao: 'Pão de Forma', codigo: '1905.90.10' },
      { item: '13', descricao: 'Extrato de tomate', codigo: '2002.90.00' },
      {
        item: '14',
        descricao:
          'Frutas, produtos hortícolas e demais produtos vegetais sem adição de açúcar/edulcorantes (capítulos 7 e 8), ressalvadas frutas de casca rija não regionais e produtos dos Anexos I e XV, excetuadas 07.11, 08.12 e 0814.00.00',
      },
      {
        item: '15',
        descricao:
          'Cereais do capítulo 10 e sementes e frutos oleaginosos do capítulo 12; ressalvados os produtos do Anexo I',
      },
      {
        item: '16',
        descricao:
          'Produtos hortícolas, mesmo misturados, apenas pré-cozidos ou cozidos em água ou vapor, sem adição de sal ou outros produtos',
        codigo: '20.04, 20.05, 2002.10.00',
      },
      {
        item: '17',
        descricao:
          'Fruta de casca rija regional, amendoins e outras sementes, mesmo misturados, apenas torrados ou cozidos, sem adição de sal ou outras substâncias',
        codigo: '2008.1',
      },
    ],
    detalhe:
      'Distinto da Cesta Básica Nacional (Anexo I, alíquota zero): aqui estão alimentos com redução de 60% que não compõem a cesta nacional.',
    conexoes: [
      { rotulo: 'Cesta Básica — Seção 3', alvo: '#secao-3', tipo: 'secao' },
      {
        rotulo: 'Simulador: alimentos',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a8',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo VIII',
    tituloOficial:
      'Produtos de higiene pessoal e limpeza majoritariamente consumidos por famílias de baixa renda (redução 60%)',
    baseLegal: 'LC 214, art. 136; RIBS, art. 211',
    efeito:
      'Redução de 60% das alíquotas do IBS e da CBS sobre o fornecimento, com especificação NCM/SH.',
    itens: '7 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      { item: '1', descricao: 'Sabões de toucador', codigo: '3401.11.90' },
      { item: '2', descricao: 'Dentifrícios', codigo: '3306.10.00' },
      { item: '3', descricao: 'Escovas de dentes', codigo: '9603.21.00' },
      { item: '4', descricao: 'Papel higiênico', codigo: '4818.10.00' },
      { item: '5', descricao: 'Água sanitária', codigo: '3808.94.19' },
      { item: '6', descricao: 'Sabões em barra', codigo: '3401.19.00' },
      {
        item: '7',
        descricao: 'Fraldas e artigos higiênicos semelhantes, de qualquer matéria',
        codigo: '9619.00.00',
      },
    ],
    detalhe:
      'Lista fechada de 7 produtos essenciais. O RIBS (art. 211) remete diretamente ao Anexo VIII da LC 214 — não há tabela própria no Regulamento do IBS para este grupo.',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: cesta_zero (itens de higiene)',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a9',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo IX',
    tituloOficial: 'Insumos agropecuários e aquícolas (redução 60% + diferimento)',
    baseLegal: 'LC 214, art. 138 e § 2º; RIBS, arts. 213–214',
    efeito:
      'Redução de 60% no fornecimento; diferimento do recolhimento nas operações entre contribuintes do regime regular e na venda a produtor rural não contribuinte destinada a produção com crédito presumido (art. 245).',
    itens: '35 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      {
        item: '1',
        descricao: 'Biofertilizantes, conforme legislação específica',
        codigo: '3101.00.00',
      },
      { item: '2', descricao: 'Fertilizantes (adubos)', codigo: 'Capítulo 31; 3824.99.77/.79/.89' },
      {
        item: '3',
        descricao:
          'Corretivos de solo (inclusive condicionadores), remineralizadores e substratos para plantas',
        codigo: 'Capítulo 25',
      },
      {
        item: '4',
        descricao: 'Inoculantes, meios de cultura e outros microorganismos para uso agrícola',
        codigo: '3002.49, 3002.90.00, 3821.00.00',
      },
      {
        item: '5',
        descricao: 'Bioestimulantes e bioinsumos para controle fitossanitário',
        codigo: '38.24, 3807.00.00, 12.11, 38.08',
      },
      {
        item: '6',
        descricao:
          'Inseticidas, fungicidas, formicidas, herbicidas, parasiticidas, germicidas, acaricidas, nematicidas, raticidas, desfolhantes, dessecantes, espalhantes adesivos, estimuladores e inibidores de crescimento (reguladores) — uso agropecuário ou fabricação de defensivo',
        codigo: '38.08, 3824.99.89',
      },
      {
        item: '7',
        descricao:
          'Calcário, casca de coco triturada, turfa, tortas, bagaços e resíduos vegetais, resíduos de celulose, DL-Metionina, vermiculita, argilas expandidas, fibras vegetais, silicatos, resinas, óleos essenciais, carvão vegetal etc. — destinados a biofertilizantes/fertilizantes/corretivos/substratos/bioestimulantes/biodefensivos',
        codigo:
          '05.06, 1201.10.00, 1213.00.00, 1301.90.90, 1302.19.9, 1401.90.00, 1404.90.90, 2102.20.00, 23.02, 23.03, 2304.00, 2305.00.00, 23.06, 2308.00.00, 2703.00.00, 2839.90.10/.50, 2922.4, 2930.40, 33.01, 3802.90.40, 3804.00, 3824.99.71, 4401.39.00, 4401.4, 4402.90.00, 4701.00.00, 5305.00.90, 6806.20.00',
      },
      {
        item: '8',
        descricao:
          'Ácido nítrico, sulfúrico, fosfórico, fosfatos de cálcio naturais, enxofre, clorídrico, fosforoso, acético, hidróxido de sódio e carbonato dissódico — destinados à fabricação de fertilizantes',
        codigo:
          '2503.00.10/.90, 2510.10.10/.90, 2510.20.10/.90, 2802.00.00, 2806.10.20, 2807.00.10, 2808.00.10, 2809.20.11/.19, 2811.19.20, 2815.11.00, 2815.12.00, 2836.20.10/.90, 2915.21.00',
      },
      {
        item: '9',
        descricao: 'Enzimas preparadas para decomposição de matéria orgânica animal e vegetal',
        codigo: '3507.90.4',
      },
      {
        item: '10',
        descricao:
          'Sementes: genética, básica, nativa in natura, certificada C1/C2, não certificada S1/S2 e cultivar local/tradicional/crioula',
        codigo: 'Capítulos 7, 10 e 12',
      },
      {
        item: '11',
        descricao:
          'Mudas de plantas e demais materiais propagativos de plantas e fungos, inclusive nativos de espécies florestais',
        codigo: '06.01, 06.02',
      },
      {
        item: '12',
        descricao: 'Vacinas, soros e medicamentos de uso veterinário, exceto de animais domésticos',
        codigo: '3002.12, 3002.15, 3002.42, 3002.90.00, 30.04',
      },
      { item: '13', descricao: 'Aves de um dia, exceto as ornamentais', codigo: '0105.1' },
      {
        item: '14',
        descricao: 'Embriões e sêmen, congelado ou resfriado',
        codigo: '0511.10.00, 0511.9',
      },
      {
        item: '15',
        descricao: 'Reprodutores de raça pura, inclusive matrizes com registro genealógico',
        codigo: '01.02, 01.03, 01.04',
      },
      { item: '16', descricao: 'Ovos fertilizados', codigo: '0407.1' },
      { item: '17', descricao: 'Girinos e alevinos', codigo: '0106.90.00' },
      {
        item: '18',
        descricao:
          'Rações para animais, concentrados, suplementos, aditivos, premix ou núcleo, exceto para animais domésticos',
      },
      {
        item: '19–20',
        descricao:
          'Produtos e subprodutos vegetais/animais destinados à fabricação de ração ou alimentação animal (exceto domésticos)',
        codigo: '23.01, 23.02, 23.03, 2304.00, 2305.00.00, 23.06, 2308.00.00',
      },
      {
        item: '21',
        descricao:
          'Alho em pó, sal mineralizado, farinhas de peixe/ostra/carne/osso/pena/sangue/víscera, calcário calcítico, gorduras e óleos animais, resíduos de óleo/gordura, DL-Metionina — fabricação de ração ou alimentação animal',
        codigo: '02.10, 03.09, 0712.90.10, Capítulo 15, 2501.00, 2521.00.00, 2930.40',
      },
      { item: '22', descricao: 'Serviços agronômicos', codigo: 'NBS 1.1410.90.00' },
      {
        item: '23',
        descricao: 'Serviços de técnico agrícola, agropecuário ou em agroecologia',
        codigo: 'NBS 1.1410.90.00',
      },
      {
        item: '24',
        descricao: 'Serviços veterinários para produção animal',
        codigo: 'NBS 1.1405.21.00, 1.1405.22.00, 1.1405.90.00',
      },
      { item: '25', descricao: 'Serviços de zootecnistas', codigo: 'NBS 1.1410.90.00' },
      {
        item: '26',
        descricao: 'Serviços de inseminação e fertilização de animais de criação',
        codigo: 'NBS 1.1405.22.00',
      },
      { item: '27', descricao: 'Serviços de engenharia florestal', codigo: 'NBS 1.1403.10.00' },
      {
        item: '28',
        descricao: 'Serviços de pulverização e controle de pragas',
        codigo: 'NBS 1.1901.10.00',
      },
      {
        item: '29',
        descricao:
          'Serviços de semeadura, adubação, mistura de adubos, reparação de solo, plantio e colheita',
        codigo: 'NBS 1.1901.10.00',
      },
      {
        item: '30',
        descricao: 'Serviços de projetos para irrigação e fertirrigação',
        codigo: 'NBS 1.1403.29.00',
      },
      {
        item: '31',
        descricao:
          'Serviços de análise laboratorial de solos, sementes, materiais propagativos, fitossanitários, água de produção, bromatologia e sanidade animal',
        codigo: 'NBS 1.1404.41.00',
      },
      {
        item: '32',
        descricao: 'Licenciamento de direitos sobre cultivares',
        codigo: 'NBS 1.1105.10.00',
      },
      {
        item: '33',
        descricao: 'Cessão definitiva de direitos sobre cultivares',
        codigo: 'NBS 1.1109.10.00',
      },
      {
        item: '34',
        descricao:
          'Melhoramento genético de animais e plantas e biotecnologia, inclusive seus royalties',
      },
      { item: '35', descricao: 'Vinhaça', codigo: '2303.30.00, 2303.20.00' },
    ],
    detalhe:
      'Exige registro como insumo no Mapa quando exigido (RIBS, art. 213, § 1º); revisão a cada 120 dias (§ 2º). O diferimento encerra-se na operação subsequente não alcançada ou na redução do crédito presumido (art. 214, § 4º).',
    conexoes: [
      { rotulo: 'Agro — Seção 6', alvo: '#secao-6', tipo: 'secao' },
      {
        rotulo: 'Simulador: insumos_agro e agro',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a10',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo X',
    tituloOficial:
      'Produções nacionais artísticas, culturais, de eventos, jornalísticas e audiovisuais (redução 60%)',
    baseLegal: 'LC 214, art. 139; RIBS, art. 215',
    efeito:
      'Redução de 60% das alíquotas do IBS e da CBS sobre operações com produções nacionais do setor.',
    itens: 'Lista com dezenas de códigos NBS (licenciamento de direitos, espetáculos, eventos)',
    detalhe:
      'Amostra: licenciamento de direitos de autor e conexos (1.1103), obras literárias (1.1103.10.00), cinematográficas (1.1103.31.00), jornalísticas (1.1103.32.00), artistas intérpretes em obras audiovisuais (1.1103.34.00), espaços para apresentações e exposições (1.2502.90.00).',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: cultura',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a11',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XI',
    tituloOficial:
      'Bens e serviços relacionados à soberania e segurança nacional, da informação e cibernética (redução 60%)',
    baseLegal: 'LC 214, art. 142; RIBS, art. 218',
    efeito:
      'Redução de 60% das alíquotas do IBS e da CBS sobre bens e serviços de defesa cibernética e segurança.',
    itens: 'Lista com serviços NBS (1.1501.20.00 etc.) e bens NCM (8523.51 etc.)',
    detalhe:
      'Amostra: segurança em TI (1.1501.20.00), desenvolvimento de aplicativos de segurança (1.1502.90.00), serviços de TI de segurança (1.1510.00.00), localização de dispositivo perdido/furtado (1.1802.90.00), servidores de armazenamento seguro (8523.51). Itens 1.4 e 1.5 vetados na origem (mensagem presidencial).',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: segurança',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a12',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XII',
    tituloOficial: 'Dispositivos médicos — alíquota zero (lista própria)',
    baseLegal: 'LC 214, art. 144, I; RIBS, art. 220, I',
    efeito:
      'Alíquota zero do IBS e da CBS sobre o fornecimento dos dispositivos relacionados, com especificação NCM/SH.',
    itens: '17 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      {
        item: '1',
        descricao:
          'Aparelhos de eletrodiagnóstico (exploração funcional e verificação de parâmetros fisiológicos) — grupo com subitens',
      },
      { item: '1.1', descricao: 'Eletrocardiógrafos', codigo: '9018.11.00' },
      { item: '1.2', descricao: 'Eletroencefalógrafos', codigo: '9018.19.80' },
      {
        item: '1.3',
        descricao:
          'Aparelhos de eletrodiagnóstico, exceto os classificados nos códigos 9018.11.00, 9018.12.10, 9018.12.90, 9018.13.00, 9018.14.10, 9018.14.20, 9018.14.90, 9018.19.10 e 9018.19.20',
        codigo: '9018.19.80',
      },
      {
        item: '2',
        descricao: 'Aparelhos de raios ultravioleta ou infravermelhos',
        codigo: '9018.20',
      },
      { item: '3', descricao: 'Artigos e aparelhos ortopédicos', codigo: '9021.10.10' },
      { item: '4', descricao: 'Artigos e aparelhos para fraturas', codigo: '9021.10.20' },
      {
        item: '5',
        descricao:
          'Artigos e aparelhos de prótese, exceto os dentários e os códigos 9021.39.91 e 9021.39.99',
        codigo: '9021.3',
      },
      { item: '6', descricao: 'Tomógrafo computadorizado', codigo: '9022.12.00' },
      {
        item: '7',
        descricao: 'Aparelhos de raio X, móveis, exceto o código 9022.19.91',
        codigo: '9022.13, 9022.14, 9022.19',
      },
      { item: '8', descricao: 'Aparelho de radiocobalto (bomba de cobalto)', codigo: '9022.21.10' },
      { item: '9', descricao: 'Aparelho de crioterapia', codigo: '9018.90.99' },
      { item: '10', descricao: 'Aparelho de gamaterapia', codigo: '9022.21.20' },
      {
        item: '11',
        descricao:
          'Aparelhos que utilizem radiações alfa, beta, gama ou outras ionizantes para usos médicos, cirúrgicos, odontológicos ou veterinários, incluídos radiofotografia/radioterapia, exceto 9022.21.10 e 9022.21.20',
        codigo: '9022.21.90',
      },
      {
        item: '12',
        descricao:
          'Densímetros, areômetros, pesa-líquidos e instrumentos flutuantes semelhantes, termômetros, pirômetros, barômetros, higrômetros e psicômetros, registradores ou não, mesmo combinados entre si',
        codigo: '90.25',
      },
      { item: '13', descricao: 'Respirador', codigo: '9019.20.40' },
      { item: '14', descricao: 'Monitor multiparâmetros', codigo: '9018.19.80' },
      { item: '15', descricao: 'Bomba de infusão', codigo: '9018.90.10' },
      {
        item: '16',
        descricao: 'Aparelhos de diagnóstico por visualização de ressonância magnética',
        codigo: '9018.13.00',
      },
      { item: '17', descricao: 'Aparelhos de ultrassom', codigo: '9018.12' },
    ],
    detalhe:
      'Lista distinta do Anexo IV (redução 60%): o Anexo XII concentra 17 grupos de dispositivos com alíquota zero plena — equipamentos de diagnóstico por imagem, radioterapia, suporte ventilatório e monitorização. Ato conjunto pode incluir dispositivos em emergência de saúde pública (RIBS, art. 220, § 3º).',
    conexoes: [
      { rotulo: 'Saúde — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: dispositivos zero',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a13',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XIII',
    tituloOficial: 'Dispositivos de acessibilidade — alíquota zero (lista própria)',
    baseLegal: 'LC 214, art. 145; RIBS, art. 221',
    efeito:
      'Alíquota zero do IBS e da CBS sobre o fornecimento dos dispositivos de acessibilidade relacionados.',
    itens: '6 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      {
        item: '1',
        descricao: 'Barra de apoio para pessoa com deficiência física',
        codigo: '8302.41.00',
      },
      {
        item: '2',
        descricao:
          'Cadeira de rodas e outros veículos para deficientes, mesmo com motor ou outro mecanismo de propulsão — grupo com subitens',
      },
      { item: '2.1', descricao: 'Sem mecanismo de propulsão', codigo: '8713.10.00' },
      {
        item: '2.2',
        descricao:
          'Cadeiras de rodas com motor ou outro mecanismo de propulsão e outros veículos para pessoas com incapacidade',
        codigo: '8713.90.00',
      },
      {
        item: '3',
        descricao:
          'Partes e acessórios destinados exclusivamente a cadeiras de rodas ou outros veículos para deficientes',
        codigo: '8714.20.00',
      },
      {
        item: '4',
        descricao: 'Aparelhos para facilitar a audição dos surdos, exceto partes e acessórios',
        codigo: '9021.40.00',
      },
      {
        item: '5',
        descricao: 'Partes e acessórios de aparelhos para facilitar a audição dos surdos',
        codigo: '9021.90.92',
      },
      { item: '6', descricao: 'Implantes cocleares', codigo: '9021.90.19' },
    ],
    detalhe:
      'Lista zero espelho do Anexo V (redução 60%): aqui estão os dispositivos de acessibilidade com alíquota zero plena — barras de apoio, cadeiras de rodas, aparelhos auditivos e implantes cocleares.',
    conexoes: [
      { rotulo: 'Isenções e reduções — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: acessibilidade',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a14',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XIV',
    tituloOficial: '(Revogado pela LC 227/2026)',
    baseLegal: 'LC 214, Anexo XIV; revogação pela LC 227/2026',
    efeito: 'Anexo revogado — sem efeitos.',
    detalhe:
      'Registro de rastreabilidade: o Anexo XIV da LC 214 foi revogado pela Lei Complementar 227/2026. Mantido no índice para evitar lacuna de numeração e para documentar a alteração legislativa.',
    conexoes: [{ rotulo: 'Fontes oficiais — Seção 9', alvo: '#secao-9', tipo: 'secao' }],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a15',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XV',
    tituloOficial: 'Produtos hortícolas, frutas e ovos — alíquota zero',
    baseLegal: 'LC 214, art. 148; RIBS, art. 224',
    efeito: 'Alíquota zero do IBS e da CBS sobre o fornecimento, com especificação NCM/SH.',
    itens: '6 itens (extração item a item — Parcela 2)',
    itensDetalhados: [
      { item: '1', descricao: 'Ovos', codigo: '0407.2' },
      {
        item: '2',
        descricao:
          'Produtos hortícolas das posições 07.01, 07.02.00.00, 07.03, 07.04, 07.05, 07.06, 0707.00.00, 07.08, 07.09 e 07.10, exceto cogumelos e trufas (0709.5 e 0710.80.00)',
      },
      {
        item: '3',
        descricao:
          'Frutas frescas ou refrigeradas e frutas congeladas sem adição de açúcar ou outros edulcorantes',
        codigo: '08.03, 08.04, 08.05, 08.06, 08.07, 08.08, 08.09, 08.10, 08.11',
      },
      {
        item: '4',
        descricao:
          'Plantas e produtos de floricultura relativos à horticultura, cultivados para fins alimentares, ornamentais ou medicinais',
        codigo: 'Capítulo 6',
      },
      { item: '5', descricao: 'Raízes e tubérculos', codigo: '07.14' },
      { item: '6', descricao: 'Cocos', codigo: '0801.1' },
    ],
    detalhe:
      'Podem apresentar-se inteiros, fatiados, ralados, descascados, desfolhados, lavados, higienizados, embalados, frescos, resfriados ou congelados, mesmo misturados entre si (RIBS, art. 224, parágrafo único).',
    conexoes: [
      { rotulo: 'Cesta Básica — Seção 3', alvo: '#secao-3', tipo: 'secao' },
      {
        rotulo: 'Simulador: cesta_zero (hortifrúti)',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a16',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XVI',
    tituloOficial:
      'Limite inferior para fixação da alíquota própria em proporção da alíquota de referência',
    baseLegal: 'LC 214, Anexo XVI',
    efeito: 'Tabela de limites percentuais por ano para fixação de alíquotas próprias pelos entes.',
    itens: 'Tabela 2029–2040+ (extração — Parcela 2)',
    detalhe:
      'Amostra da tabela oficial: 2029–2032 = 81,0%; 2033 = 90,5%; 2034 = 88,6%; 2035 = 86,7%; 2036 = 84,8%; 2037 = 82,9%; 2038 = 81,0%; 2039 = 79,1%; 2040 = 77,2%. Conecta-se ao cronograma da transição (Seção 8).',
    conexoes: [
      { rotulo: 'Cronograma — Seção 8', alvo: '#secao-8', tipo: 'secao' },
      {
        rotulo: 'Simulador: transição ano a ano',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a17',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XVII',
    tituloOficial: 'Bens e serviços sujeitos ao Imposto Seletivo',
    baseLegal: 'LC 214, Anexo XVII; Decreto 12.955/2026, Anexo IV',
    efeito: 'Lista dos bens e serviços alcançados pelo IS, com especificação NCM/SH e NBS.',
    itens: '7 grupos (extração — Parcela 2)',
    detalhe:
      'Grupos oficiais: Veículos (87.03; 8704.21/.31/.41.00/.51.00/.60.00/.90.00 exceto caminhões; ressalvados veículos das Forças Armadas/Segurança Pública); Aeronaves e Embarcações (8802 exceto 8802.60.00; embarcações com motor 8903; mesmas ressalvas); Produtos fumígenos (2401, 2402, 2403, 2404); Bebidas alcoólicas (2203, 2204, 2205, 2206, 2208); Bebidas açucaradas (2202.10.00); Bens minerais (2601, 2709.00.10, 2711.11.00, 2711.21.00); Concursos de prognósticos e Fantasy sport.',
    conexoes: [
      { rotulo: 'Imposto Seletivo — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: imposto_seletivo (13 itens)',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },
  {
    id: 'lc214-a18',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexos XVIII a XXIII',
    tituloOficial: 'Anexos do Simples Nacional (alíquotas e partilha 2027–2028)',
    baseLegal: 'LC 214, Anexos XVIII–XXIII (produção de efeitos na LC 123/2006)',
    efeito:
      'Tabelas de alíquotas e partilha do Simples Nacional vigentes de 01/01/2027 a 31/12/2028, por setor.',
    itens:
      '6 anexos: Comércio (XVIII), Indústria (XIX), Locação de bens móveis e serviços (XX), Serviços § 5º-C (XXI), Serviços § 5º-I (XXII), Valores fixos (XXIII)',
    detalhe:
      'Amostra (Comércio, 1ª faixa até R$ 180 mil: 4,00%; 2ª faixa R$ 180–360 mil: 7,30% c/ dedução R$ 5.940; 3ª faixa R$ 360–720 mil: 9,50% c/ dedução R$ 13.860; 4ª faixa R$ 720 mil–1,8 mi: 10,70%). Vigência 2027–2028 — relevante para optantes do Simples que migrarem ao regime regular (RIBS, arts. 196 § 3º e 435).',
    conexoes: [
      { rotulo: 'Regimes específicos — Seção 6', alvo: '#secao-6', tipo: 'secao' },
      {
        rotulo: 'Simulador: regime_especial',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'LC 214/2025 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
    },
  },

  // ============ Decreto 12.955/2026 — Regulamento da CBS ============
  {
    id: 'dec-a1',
    instrumento: 'DEC12955',
    instrumentoNome: 'Decreto 12.955/2026 — Regulamento da CBS',
    anexo: 'Anexo I',
    tituloOficial: 'Código de Situação Tributária (CST) da CBS',
    baseLegal: 'Decreto 12.955/2026, Anexo I',
    efeito: 'Códigos de situação tributária a informar nos documentos fiscais eletrônicos da CBS.',
    detalhe:
      'Essencial ao preenchimento dos campos IBS/CBS nas NF-e/NFS-e (obrigatório desde 03/08/2026). A consolidação dos cClassTrib acompanha a IT 2025.002 (v1.70) — monitorada na rotina semanal.',
    conexoes: [
      { rotulo: 'Fato gerador e documentos — Seção 2', alvo: '#secao-2', tipo: 'secao' },
      { rotulo: 'Fontes: Buscador NCM (cClassTrib)', alvo: '#fontes-agregador', tipo: 'secao' },
    ],
    fonte: {
      nome: 'Decreto 12.955/2026 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
    },
  },
  {
    id: 'dec-a2',
    instrumento: 'DEC12955',
    instrumentoNome: 'Decreto 12.955/2026 — Regulamento da CBS',
    anexo: 'Anexo II',
    tituloOficial: 'Código de Situação Tributária do IS',
    baseLegal: 'Decreto 12.955/2026, Anexo II',
    efeito: 'Códigos de situação tributária do Imposto Seletivo nos documentos fiscais.',
    detalhe:
      'Complementa a apuração do IS por item — o Simulador calcula o IS por item (não incide em 2026).',
    conexoes: [
      { rotulo: 'Imposto Seletivo — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: imposto_seletivo (13 itens)',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'Decreto 12.955/2026 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
    },
  },
  {
    id: 'dec-a3',
    instrumento: 'DEC12955',
    instrumentoNome: 'Decreto 12.955/2026 — Regulamento da CBS',
    anexo: 'Anexo III',
    tituloOficial: 'Classificações de bens e serviços (cesta básica e reduzidos — CBS)',
    baseLegal: 'Decreto 12.955/2026, Anexo III',
    efeito:
      'Lista de cesta básica nacional e bens/serviços com alíquota reduzida para efeitos da CBS.',
    detalhe:
      'Espelho, na CBS, das classificações da LC 214 — paridade com os anexos I, VII e VIII da Lei.',
    conexoes: [
      { rotulo: 'Cesta Básica — Seção 3', alvo: '#secao-3', tipo: 'secao' },
      {
        rotulo: 'Simulador: cesta_zero',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'Decreto 12.955/2026 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
    },
  },
  {
    id: 'dec-a4',
    instrumento: 'DEC12955',
    instrumentoNome: 'Decreto 12.955/2026 — Regulamento da CBS',
    anexo: 'Anexo IV',
    tituloOficial: 'Produtos sujeitos ao Imposto Seletivo',
    baseLegal: 'Decreto 12.955/2026, Anexo IV',
    efeito: 'Lista de produtos sujeitos ao IS, com especificação NCM/SH.',
    itens: '13 itens no catálogo do Simulador (imposto_seletivo)',
    detalhe:
      'Cigarros, bebidas alcoólicas (cerveja, cachaça), veículos, entre outros. O IS não incide em 2026 (ano-teste) e entra na transição conforme cronograma. Espelho do Anexo XVII da LC 214.',
    conexoes: [
      { rotulo: 'Imposto Seletivo — Seção 5', alvo: '#secao-5', tipo: 'secao' },
      {
        rotulo: 'Simulador: imposto_seletivo',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'Decreto 12.955/2026 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
    },
  },
  {
    id: 'dec-a5',
    instrumento: 'DEC12955',
    instrumentoNome: 'Decreto 12.955/2026 — Regulamento da CBS',
    anexo: 'Anexo V',
    tituloOficial: 'Disposições transitórias e vinculações (CBS)',
    baseLegal: 'Decreto 12.955/2026, Anexo V',
    efeito: 'Regras de transição e vinculações normativas do regulamento da CBS.',
    detalhe: 'Cronograma de transição detalhado na Seção 8 (2026–2033).',
    conexoes: [
      { rotulo: 'Cronograma — Seção 8', alvo: '#secao-8', tipo: 'secao' },
      {
        rotulo: 'Simulador: transição ano a ano',
        alvo: 'https://verificacao-projeto-panorama-18549.goskip.app/simulador.html',
        tipo: 'simulador',
      },
    ],
    fonte: {
      nome: 'Decreto 12.955/2026 — Planalto',
      url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
    },
  },
]

/** Nota de verificação de fidelidade — Parcelas 1 e 2. */
export const NOTA_VERIFICACAO =
  'Parcela 1: os cinco anexos do RIBS conferidos contra o texto oficial do PDF da Resolução CGIBS 6/2026 (cgibs.gov.br). Parcela 2: anexos da LC 214 extraídos item a item da versão compilada do Planalto (lcp214compilado.htm) — Anexo VIII (7 itens), Anexo XII (17 itens), Anexo XIII (6 itens), Anexo XV (6 itens), Anexo VII (17 itens), Anexo II (9 itens), Anexo III (30 itens) e Anexo IX (35 itens); volumes dos demais anexos contados no texto oficial. Os códigos CST do IBS e o CBF NÃO constam dos anexos do RIBS (são atos técnicos conjuntos, IT 2025.002). O Anexo XIV da LC 214 está revogado pela LC 227/2026.'
