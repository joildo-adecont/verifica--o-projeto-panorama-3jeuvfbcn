/**
 * Catálogo dos Anexos da Reforma Tributária — Seção 7 (Parcela 1)
 * Fonte: texto oficial extraído — RIBS (Res. CGIBS 6/2026, PDF cgibs.gov.br),
 * LC 214/2025 (Planalto) e Decreto 12.955/2026 (Planalto).
 * Cada anexo é individualizado com base legal, efeito tributário, tabelas,
 * volume de itens, conexões com demais seções e grupos do Simulador.
 */

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
    itens: '9 códigos NBS no catálogo do Simulador',
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
    itens: '30 códigos NBS no catálogo do Simulador',
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
    itens: '92 códigos NCM no catálogo do Simulador (dispositivos60)',
    detalhe:
      'Exige regularização na Anvisa (RIBS, art. 206, § 1º). Lista revisada a cada 120 dias por ato conjunto Fazenda/CGIBS, só para inclusão de dispositivos inexistentes com as mesmas finalidades (art. 206, § 2º). Em emergência de saúde pública, ato conjunto pode incluir dispositivos fora da lista, com vigência limitada (art. 220, § 3º).',
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
    detalhe:
      'Exige atendimento a requisitos de norma do órgão competente (RIBS, art. 207, § 1º); revisão a cada 120 dias por ato conjunto, só para inclusões (art. 207, § 2º). O Anexo XIII da LC 214 traz a lista equivalente para a alíquota zero (RIBS, art. 221).',
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
    detalhe:
      'Destinadas a pessoas com erros inatos do metabolismo, com especificação NCM/SH. Lista do Anexo VI revisada a cada 120 dias (RIBS, art. 209).',
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
    efeito: 'Redução de 60% das alíquotas do IBS sobre o fornecimento, com especificação NCM/SH.',
    detalhe:
      'Pendente de extração item a item — programado para a Parcela 2 (fonte: LC 214, Anexo VIII).',
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
    itens: '4 itens no catálogo do Simulador (insumos_agro)',
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
    id: 'lc214-a12',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XII',
    tituloOficial: 'Dispositivos médicos — alíquota zero (lista própria)',
    baseLegal: 'LC 214, art. 144, I; RIBS, art. 220, I',
    efeito:
      'Alíquota zero do IBS sobre o fornecimento dos dispositivos relacionados, com especificação NCM/SH.',
    detalhe:
      'Lista distinta do Anexo IV (redução 60%): o Anexo XII concentra os dispositivos com alíquota zero plena. Ato conjunto pode incluir dispositivos em emergência de saúde pública (RIBS, art. 220, § 3º). Pendente de extração item a item — Parcela 2.',
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
    id: 'lc214-a15',
    instrumento: 'LC214',
    instrumentoNome: 'Lei Complementar 214/2025',
    anexo: 'Anexo XV',
    tituloOficial: 'Produtos hortícolas, frutas e ovos — alíquota zero',
    baseLegal: 'LC 214, art. 148; RIBS, art. 224',
    efeito: 'Alíquota zero do IBS sobre o fornecimento, com especificação NCM/SH.',
    detalhe:
      'Podem apresentar-se inteiros, fatiados, ralados, descascados, lavados, higienizados, embalados, frescos, resfriados ou congelados, mesmo misturados entre si (RIBS, art. 224, parágrafo único).',
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
      'Cigarros, bebidas alcoólicas (cerveja, cachaça), veículos, entre outros. O IS não incide em 2026 (ano-teste) e entra na transição conforme cronograma.',
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

/** Nota de verificação de fidelidade — Parcela 1. */
export const NOTA_VERIFICACAO =
  'Os cinco anexos do RIBS foram conferidos contra o texto oficial do PDF da Resolução CGIBS 6/2026 (cgibs.gov.br): Anexo I depreciação, Anexo II Repetro, Anexo III Reporto, Anexo IV bens de capital e Anexo V ZFM. Os códigos CST do IBS e o Código de Benefício Fiscal (CBF) NÃO constam dos anexos do RIBS — são objeto de atos técnicos conjuntos (IT 2025.002) e por isso saíram do quadro anterior desta seção, em correção de fidelidade à fonte.'
