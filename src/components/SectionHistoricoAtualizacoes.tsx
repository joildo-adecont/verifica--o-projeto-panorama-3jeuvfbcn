import { History, ExternalLink, Database, MapPin, CalendarClock } from 'lucide-react'

/**
 * Seção 13 — Histórico de Atualizações do Panorama.
 * Registro cronológico de todas as atualizações do sistema: data/hora,
 * fonte oficial consultada, caminho (onde foi aplicado) e conteúdo.
 * Alimentada pelo assistente a cada atualização (rotina semanal + sob demanda).
 *
 * POLÍTICA DE RETENÇÃO: mantém somente os registros dos últimos 30 dias —
 * registros mais antigos são filtrados automaticamente na renderização
 * (ver ehRecente). O array REGISTROS pode acumular; a seção exibe apenas
 * o que está dentro da janela.
 */

interface Registro {
  data: string // dd/mm/aaaa
  hora: string
  titulo: string
  conteudo: string
  fontes: { nome: string; url?: string }[]
  caminho: string
  versao?: string
}

/** Janela de retenção em dias (política do CEO: máximo 30 dias). */
const RETENCAO_DIAS = 30

/** Verifica se o registro está dentro da janela de retenção (≤ 30 dias). */
function ehRecente(dataBR: string): boolean {
  const [d, m, a] = dataBR.split('/').map(Number)
  const data = new Date(a, m - 1, d)
  const limite = new Date()
  limite.setDate(limite.getDate() - RETENCAO_DIAS)
  limite.setHours(0, 0, 0, 0)
  return data >= limite
}

const REGISTROS: Registro[] = [
  {
    data: '04/10/2026',
    hora: '11:40',
    titulo: 'Seção 6 — destaque das seções dedicadas de regimes (6A, 6B e 6C)',
    conteudo:
      'A Seção 6 (Regimes específicos e diferenciados) ganhou box de destaque com links diretos para as seções dedicadas: 6A Regime Imobiliário (venda −50%, locação −70%, redutores sociais, RET), 6B Agronegócio (produtor rural, créditos presumidos, cooperativas) e 6C Consórcios/Financeiros/Simples/Profissionais. O box aparece no topo da Seção 6, antes da tabela de regimes, com a identidade navy+dourado do Panorama.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho: 'Panorama (62493) — SectionRegimesEspecificos.tsx (box de destaque)',
    versao: '62493 v0.0.89',
  },
  {
    data: '04/10/2026',
    hora: '11:30',
    titulo:
      'Seção 6C — Consórcios, serviços financeiros, Simples Nacional e profissionais regulamentados',
    conteudo:
      'Nova seção com os demais regimes específicos e diferenciados, no mesmo padrão das seções 6A/6B, com 4 abas: Consórcios (arts. 204-206: taxa de administração em regime de caixa, dedução da intermediação, carta de crédito segue normas gerais, contemplação não é fato gerador, execução de garantia sem incidência na consolidação, crédito da taxa, intermediação), Serviços financeiros (art. 182: lista completa das 17 operações; base de cálculo art. 185; deduções art. 192; arranjos de pagamento art. 214; sujeitos supervisionados BC/CVM/Previc/SUSEP art. 183), Simples Nacional (LC 123 art. 13-A: IBS no DAS até R$ 3,6 mi; alíquotas de teste 2026-2028 arts. 343-347; janelas de opção Res. CGSN 190-192/2026; NF com destaque; crédito presumido de importação arts. 444/462) e Profissionais regulamentados + plataformas digitais (art. 127: redução 30%, 18 profissões, requisitos da PJ; art. 22: responsabilidade solidária das plataformas, definição e exceções). Texto extraído da LC 214 compilada do Planalto, conferido em 04/10/2026. Atalho O no menu lateral.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionOutrosRegimes.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: '62493 v0.0.88',
  },
  {
    data: '04/10/2026',
    hora: '11:15',
    titulo: 'Seção 6B — Regime do Agronegócio (produtor rural, créditos presumidos, cooperativas)',
    conteudo:
      'Nova seção dedicada ao regime do agropecuário (LC 214/2025, arts. 110, 137-138, 164-171 e 271-272), com 5 abas: Reduções de alíquota (produtos in natura −60% art. 137; insumos do Anexo IX −60% art. 138, lista revisada a cada 120 dias), Produtor não contribuinte (limite R$ 3,6 mi/ano art. 164, produtor integrado, excesso de limite, opção pelo regime regular arts. 165-166), Créditos presumidos (compra do produtor não contribuinte art. 168, frete de autônomo/MEI art. 169, cooperativa art. 168 §9º, tratores/veículos de carga alíquota zero art. 110), Diferimento de insumos (art. 138 §2º-§9º, encerramento, convivência com cooperativas art. 271 §4º) e Cooperativas (alíquota zero associado↔cooperativa art. 271, transferência de créditos art. 272). Links Simular para o grupo 🌾 Insumos agro do Simulador. Texto extraído da LC 214 compilada do Planalto, conferido em 04/10/2026. Atalho G no menu lateral.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho: 'Panorama (62493) — SectionAgronegocio.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: '62493 v0.0.87',
  },
  {
    data: '04/10/2026',
    hora: '11:00',
    titulo: 'Seção 6A — Regime Imobiliário (venda, locação, redutores e RET)',
    conteudo:
      'Nova seção dedicada ao regime específico das operações com bens imóveis (LC 214/2025, arts. 252-261 e 485-488), com 3 abas: Operações e reduções (alienação −50% com redutor social R$ 100 mil para imóvel novo e R$ 30 mil para lote, redutor de ajuste para imóvel usado, locação −70% com redutor social R$ 600/mês, intermediação e construção civil −50%), RET incorporação (2,08% patrimônio de afetação / 0,53% RET especial, opção antes de 01/01/2029) e Permutas e não incidências (art. 252 §2º/§5º/§5-A da LC 227/2026). Cada operação tem link direto para simular no Simulador de Transição (grupo 🏠 Imobiliário, 9 itens). Texto extraído da LC 214 compilada do Planalto, conferido em 04/10/2026. Atalho I no menu lateral.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionRegimeImobiliario.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: '62493 v0.0.86',
  },
  {
    data: '04/10/2026',
    hora: '00:45',
    titulo: 'Unificação de dados — Seção 7A passa a ser a fonte única das tabelas de itens',
    conteudo:
      'Auditoria de duplicações (a pedido do CEO): 185 códigos NCM/NBS estavam repetidos entre as seções 2C/2D do Panorama HTML e a 7A; os anexos da LC 214 com tabela de itens na Seção 7 (educação, saúde, dispositivos, higiene, insumos agro, acessibilidade, hortifrúti) duplicavam a 7A; a Cesta Básica aparecia em 2 lugares. Unificação: a Seção 7A é agora a FONTE ÚNICA das tabelas de itens e alíquotas (1.053 linhas); a Seção 7 virou catálogo analítico (base legal + efeito + conexões) com link direto para o bloco correspondente da 7A; a Seção 3 (Cesta) aponta para o Anexo I da LC 214 na 7A. Correção adicional: removida a duplicação de renderização da 7A no Index (v0.0.69).',
    fontes: [
      { nome: 'RIBS — Resolução CGIBS 6/2026 (cgibs.gov.br/resolucoes)' },
      { nome: 'LC 214/2025 compilada (Planalto)' },
      { nome: 'Decreto 12.955/2026 (Planalto)' },
    ],
    caminho:
      'Panorama (62493) — SectionAnexos.tsx (itensDetalhados → link 7A; box unificação), SectionCestaBasica.tsx (link 7A), Index.tsx (dedup 7A)',
    versao: '62493 v0.0.70',
  },
  {
    data: '04/10/2026',
    hora: '00:25',
    titulo: 'Modernização visual do Panorama — identidade ADECONT (navy + dourado)',
    conteudo:
      'Redesign visual completo do Panorama em 2 parcelas: (1) Hero com gradiente navy profundo, halos de luz, trama dourada, título em degradê dourado, CTA dourado e card de status em vidro; barra de status do header em navy com botão "Atualizar agora" dourado; menu lateral com item ativo em dourado; footer navy-escuro com borda dourada; scrollbar e seleção de texto na paleta da marca. (2) Todas as seções de conteúdo: numeração das seções em navy com anel dourado e filete dourado no título, cabeçalhos de tabela em navy com borda dourada, filtros ativos em navy, box de consórcios com moldura dourada, seções 11/12/13 com rótulo e ícone em dourado. Paleta: navy #0B1528 / dourado #C5A059 (identidade ADECONT).',
    fontes: [{ nome: 'Identidade visual ADECONT (logo oficial v3) — aplicação interna' }],
    caminho:
      'src/components/PanoramaHero.tsx, PanoramaHeader.tsx, PanoramaSideMenu.tsx, PanoramaFooter.tsx, Section*.tsx, src/main.css',
    versao: 'v0.0.67 (parcela 1) e v0.0.68 (parcela 2)',
  },
  {
    data: '03/10/2026',
    hora: '19:10',
    titulo: 'Seção 7A — Tabela Geral dos Anexos: itens e alíquotas da reforma, anexo por anexo',
    conteudo:
      'Nova seção com UMA TABELA INDIVIDUAL POR ANEXO (28 blocos: 5 do RIBS, 18 da LC 214 e 5 do Decreto 12.955/2026) — 1.053 linhas extraídas dos textos oficiais, cada linha com item, código NCM/NBS, descrição, TRATAMENTO na reforma (alíquota zero, redução 60/30%, Imposto Seletivo, suspensão, crédito presumido, depreciação) e ALÍQUOTA na reforma. Carga sob demanda (import dinâmico, ~270 KB só quando um anexo é aberto). Índice navegável com filtros por tratamento e instrumento, busca global (tecla T), botão 🧮 para abrir o grupo correspondente no Simulador de Transição e atalho 7A no menu lateral. Entram na rotina semanal de fontes oficiais.',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'LC 214/2025 — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'Decreto 12.955/2026 — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho:
      'Panorama (62493) — src/data/tabelaGeralDados.ts (novo) + src/components/SectionTabelaGeral.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: 'v0.0.66',
  },
  {
    data: '03/10/2026',
    hora: '17:05',
    titulo: 'Seção 7 — Anexos I e II do RIBS completos com carga sob demanda (parcela final)',
    conteudo:
      'Tabelas de itens dos dois maiores anexos do RIBS: Anexo I depreciação (258 linhas oficiais com referência NCM, prazo de vida útil e taxa anual, incluindo as notas 1-3 do anexo) e Anexo II Repetro (580 itens nas 4 tabelas oficiais: T1 Repetro-Temporário 86, T2 GNL-Temporário 324 com tipo de atividade, T3 Repetro-Permanente 151, T4 Repetro-Entreposto 19). CARGA SOB DEMANDA: os dados (arquivos de 28 KB e 92 KB) só são baixados pelo navegador quando o anexo é aberto (import dinâmico), sem pesar o carregamento inicial da página. Com isto, os 5 anexos do RIBS têm 100% dos seus itens consultáveis no Panorama.',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho:
      'Panorama (62493) — src/data/ribsA1A2.ts (novo) + src/data/ribsRepetro.ts (novo) + SectionAnexos.tsx (TabelaSobDemanda)',
    versao: '62493 v0.0.62',
  },
  {
    data: '03/10/2026',
    hora: '16:45',
    titulo:
      'Seção 7 — Tabelas de itens dos Anexos III, IV e V do RIBS com filtro e teclas de atalho',
    conteudo:
      'Tabelas de itens consultáveis nos anexos do RIBS: Anexo III Reporto (14 itens), Anexo IV bens de capital (98 itens nas 3 tabelas oficiais: I bens de capital art. 196, II tratores/máquinas agrícolas art. 197 I, III veículos de carga art. 197 II) e Anexo V ZFM (49 itens com legislação estadual do AM por item — Lei 2.826/03 e Decretos 38.558/17 a 51.978/25). Cada tabela tem filtro próprio (item, descrição, NCM, legislação) e a busca geral da seção agora encontra itens dentro das tabelas. Teclas de atalho: / foca a busca geral, Esc limpa o filtro da tabela. Tabelas sujeitas à rotina semanal de fontes oficiais (seg 11h) com registro no Histórico. Próxima parcela: Anexos I (≈260) e II (≈580) do RIBS com carga sob demanda.',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho: 'Panorama (62493) — src/data/ribsItens.ts (novo) + SectionAnexos.tsx (TabelaItens)',
    versao: '62493 v0.0.61',
  },
  {
    data: '03/10/2026',
    hora: '00:45',
    titulo: 'Seção 7 ↔ Simulador — interligação completa nos dois sentidos (Parcela 3)',
    conteudo:
      'Mapeamento dos 118 itens do catálogo do Simulador aos anexos da Seção 7: cada anexo com mapeamento direto exibe selo "N no Simulador" e, aberto, a nota de correspondência (Anexo I 35 itens, XV 14, II 7, III 12, IV 11, IX 4, XVII 13, RIBS III 1, RIBS IV 4, RIBS V 1); faixa resumo no topo da seção. No sentido inverso, o Simulador ganhou o botão "📑 Anexos (Seção 7)" no header (nas duas cópias da página estática), levando à âncora #secao-7. Itens do catálogo já citavam a origem oficial (anexo + item) desde a ampliação do catálogo.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho:
      'Panorama (62493) — anexosCatalogo.ts (MAPA_SIMULADOR), SectionAnexos.tsx, simulador.html (raiz e /panorama-reforma/)',
    versao: '62493 v0.0.60',
  },
  {
    data: '03/10/2026',
    hora: '00:20',
    titulo: 'Seção 7 — Extração item a item dos anexos da LC 214 e índice completo (Parcela 2)',
    conteudo:
      'Índice ampliado para os 23 anexos da LC 214 (XVIII–XXIII do Simples inclusos; XIV revogado pela LC 227/2026 registrado) e extração item a item da versão compilada do Planalto: Anexo VIII higiene (7 itens), Anexo XII dispositivos zero (17 itens), Anexo XIII acessibilidade zero (6 itens), Anexo XV hortifrúti (6 itens), Anexo VII alimentos 60% (17 itens), Anexo II educação (9 itens), Anexo III saúde (30 itens), Anexo IX insumos agro (35 itens); volumes dos Anexos IV (105), V (30), VI (81), X, XI e XVI (tabela 2029–2040) e XVII (IS, 7 grupos). Tabela de itens consultável dentro de cada anexo, com NCM/SH e NBS.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho: 'Panorama (62493) — src/data/anexosCatalogo.ts + SectionAnexos.tsx (seção 7)',
    versao: '62493 v0.0.59',
  },
  {
    data: '02/10/2026',
    hora: '23:59',
    titulo:
      'Seção 7 — Anexos individualizados com conteúdo analítico e ícone de abertura (Parcela 1)',
    conteudo:
      'Anexos da reforma individualizados: 5 anexos do RIBS (depreciação art. 48; Repetro art. 164 c/ 4 tabelas; Reporto art. 186 §5º; bens de capital arts. 196-197; ZFM art. 521 §1º IV), anexos da LC 214 referenciados pelo Regulamento do IBS (I, II, III, IV, V, VI, VII, VIII, IX, XII, XV) e 5 anexos do Decreto 12.955/2026 (CBS). Cada anexo com ícone de abertura, base legal, efeito tributário, tabelas, volume de itens, conteúdo analítico, conexões com as demais seções e atalhos para os grupos do Simulador; busca interna por anexo/artigo/NCM. Correção de fidelidade: CST do IBS e CBF saíram do quadro — não constam dos anexos do RIBS (são atos técnicos conjuntos, IT 2025.002).',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'LC 214/2025 — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'Decreto 12.955/2026 — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama (62493) — src/data/anexosCatalogo.ts + SectionAnexos.tsx (seção 7)',
    versao: '62493 v0.0.57',
  },
  {
    data: '02/10/2026',
    hora: '02:28',
    titulo: 'Navegação do Panorama: menu lateral, teclas de atalho e ícones coloridos',
    conteudo:
      'Menu lateral fixo "Acesso Rápido" com as 13 seções; teclas de atalho 1–9, Q, W e H em toda a página; ícones coloridos por seção no menu principal e no lateral; item "Histórico de Atualizações" criado (esta seção). Página 404 blindada: caminhos antigos do Panorama redirecionam para a home.',
    fontes: [{ nome: 'Interno — Sistema ADECONT (projeto Panorama)' }],
    caminho: 'Panorama (62493) — menus principal e lateral; App.tsx; NotFound.tsx',
    versao: 'v0.0.47–52',
  },
  {
    data: '02/10/2026',
    hora: '01:18',
    titulo: 'Correção do retorno do Simulador ao Panorama',
    conteudo:
      'Os links "← Voltar ao Panorama" do Simulador, Cadastro & Envios e página de confirmação passam a apontar para a home do app React (/). Rotas de fallback criadas para /panorama-reforma/index.html e /panorama-reforma. Validado com clique real em produção.',
    fontes: [{ nome: 'Interno — Sistema ADECONT (projeto Panorama)' }],
    caminho:
      'Panorama (62493) — simulador.html, envios.html, recebido.html (raiz e /panorama-reforma/), App.tsx',
    versao: 'v0.0.41–46',
  },
  {
    data: '02/10/2026',
    hora: '01:04',
    titulo: 'Simulador/Cadastro/Envios consolidados somente no Panorama',
    conteudo:
      'Removidas do Financeiro (56819) as cópias do Simulador, Cadastro & Envios, catálogo, hook de envio e migration 0049. Regra definitiva: Simulador, Cadastro, Envios e o backend (coleções, hook, SMTP) vivem SOMENTE no Panorama (62493). Botão do Financeiro aponta para o Panorama.',
    fontes: [{ nome: 'Interno — Sistema ADECONT (projetos 56819 e 62493)' }],
    caminho: 'Financeiro (56819) — remoção de 6 arquivos; Panorama (62493) — único dono do módulo',
    versao: '56819 v0.0.89–90',
  },
  {
    data: '01/10/2026',
    hora: '22:00',
    titulo: 'Seção 12 — Índice das fontes oficiais primárias (110 bases)',
    conteudo:
      'Índice completo das 110 bases de dados oficiais, casadas com o link do órgão e classificadas em 6 grupos: Reforma IBS/CBS (18), Fiscal/NF-e/SPED (43), Serviços NBS/ISS/NFS-e (10), ICMS/CONFAZ (9), Comércio exterior (18), Empresas/trabalho (8). Cada linha traz órgão, situação datada e link oficial.',
    fontes: [
      {
        nome: 'Buscador NCM — página de fontes (agregador)',
        url: 'https://buscadorncm.com.br/fontes',
      },
      { nome: 'Órgãos primários: Receita Federal, CONFAZ, ENCAT, Planalto, IBGE, MDIC, CGIBS' },
    ],
    caminho:
      'Panorama — seção 12 (56819: parte-conteudo-6.html; 62493: SectionFontesPrimarias.tsx)',
    versao: '56819 v0.0.88 · 62493 v0.0.39–40',
  },
  {
    data: '01/10/2026',
    hora: '21:34',
    titulo: 'Seção 11 — Fontes de referência: agregadores especializados',
    conteudo:
      'Inclusão do Buscador NCM como fonte secundária (com alerta de natureza não oficial), destacada para pesquisa, conferência cruzada e simulações. Tabela das 6 bases mais relevantes com situação datada em 01/10/2026 (cClassTrib IT 2025.002 v1.70, Calculadora RTC banco V0059, regimes por NCM, cCredPres, NTs da reforma).',
    fontes: [
      {
        nome: 'Buscador NCM — fontes oficiais e datas de atualização',
        url: 'https://buscadorncm.com.br/fontes',
      },
      {
        nome: 'Receita Federal / Serpro — Calculadora RTC (banco V0059)',
        url: 'https://consumo.tributos.gov.br/servico/calcular-tributos-consumo/calculadora-offline-download',
      },
    ],
    caminho:
      'Panorama — seção 11 (56819: parte-conteudo-5.html; 62493: SectionFontesAgregador.tsx)',
    versao: '56819 v0.0.87',
  },
  {
    data: '01/10/2026',
    hora: '02:13',
    titulo: 'Simulador de Transição v2 — componentes individuais e catálogo ampliado',
    conteudo:
      '4 componentes com botões liga/desliga (CBS, IBS Estadual, IBS Municipal, Imposto Seletivo), ano-teste 2026 correto (CBS 0,9% / IBS 0,05%+0,05%; IS não incide), capitulação legal separada por componente. Catálogo ampliado de 45 para 118 itens (cesta básica 49, saúde/educação 19, red.30% 5, dispositivos 11, insumos agro 4, IS 13, regimes especiais 10, regulares).',
    fontes: [
      {
        nome: 'LC 214/2025 — Anexos I, II, III, IV, IX, XV e XVII (Planalto)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'Decreto 12.955/2026 — Regulamento CBS, Anexo IV',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama (62493) — simulador.html + partes/sim-catalogo.js',
    versao: '62493 v0.0.36–38 · 56819 v0.0.84–85',
  },
  {
    data: '30/09/2026',
    hora: '19:34',
    titulo: 'Seção 10 — Resoluções CGIBS: inventário e busca no texto integral',
    conteudo:
      'Inventário completo das 18 Resoluções CGIBS de 2026 (ementa, categoria, PDF oficial) + busca no texto integral com 1.213 trechos indexados, filtros por resolução e acentos opcionais. Testada em produção ("split payment" → 13 trechos em 12ms).',
    fontes: [
      { nome: 'CGIBS — Resoluções (fonte oficial)', url: 'https://www.cgibs.gov.br/resolucoes' },
    ],
    caminho: 'Panorama — seção 10 + busca-resolucoes.html',
    versao: '56819 v0.0.65–68',
  },
  {
    data: '30/09/2026',
    hora: '22:08',
    titulo: 'Seções 2, 2A, 2C e 2D — marco normativo e códigos de classificação',
    conteudo:
      'Seção 2 expandida (marco normativo multi-instrumento: EC 132, LC 214/227, Decreto CBS, RIBS, atos conjuntos, CGSN); 2A com mapa artigo→produto/serviço→anexo e 12 grupos de tributação; 2C com códigos NCM dos Anexos do RIBS (depreciação 237, REPORTO 14, bens de capital 98, ZFM 16); 2D com NBS de educação (9) e saúde (30) da LC 214 e dispositivos médicos NCM (92).',
    fontes: [
      {
        nome: 'LC 214/2025 consolidada (Planalto)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (cgibs.gov.br)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'Decreto 12.955/2026 (Planalto)',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama — seções 2/2A/2C/2D (parte-conteudo-1.html)',
    versao: '56819 v0.0.77–80',
  },
  {
    data: '30/09/2026',
    hora: '11:02',
    titulo: 'Panorama da Reforma Tributária publicado — versão inicial',
    conteudo:
      'Publicação do Panorama com 9 seções: arcabouço normativo, fato gerador/incidência, cesta básica, imunidades, isenções/diferimentos/reduções, regimes específicos (destaque consórcios e cartas de contemplação), anexos, cronograma 2026–2033 e fontes oficiais. Com busca, sumário clicável e auto-atualização.',
    fontes: [
      {
        nome: 'Planalto — LC 214/2025 e LC 227/2026',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm',
      },
      {
        nome: 'Receita Federal — orientações da Reforma Tributária do Consumo',
        url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/orientacoes-da-reforma-tributaria',
      },
      {
        nome: 'CGIBS — resoluções e Regulamento do IBS',
        url: 'https://www.cgibs.gov.br/resolucoes',
      },
    ],
    caminho: 'Panorama — seções 1 a 9',
    versao: '56819 v0.0.64',
  },
]

// Política de retenção: exibe somente registros dos últimos 30 dias.
const VISIVEIS = REGISTROS.filter((r) => ehRecente(r.data))

export function SectionHistoricoAtualizacoes() {
  return (
    <section id="historico-atualizacoes" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-panorama-gold-dark">
            Seção 13
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-panorama-gold/50 bg-panorama-gold/10 text-panorama-gold-dark">
              <History className="w-4 h-4" />
            </span>
            Histórico de Atualizações
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro cronológico de todas as atualizações do Panorama: data e hora, fonte oficial
            consultada, caminho aplicado no sistema e conteúdo da mudança. Alimentado pelo
            assistente a cada atualização — na rotina semanal (segundas, 11h) e sob demanda.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-2">
          <CalendarClock className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <p>
            <strong>Política de retenção:</strong> esta seção mantém somente os registros dos{' '}
            <strong>últimos 30 dias</strong> — atualizações mais antigas são removidas
            automaticamente. Exibindo {VISIVEIS.length} registro{VISIVEIS.length === 1 ? '' : 's'}{' '}
            no momento.
          </p>
        </div>

        <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-blue-900 flex items-start gap-2">
          <Database className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
          <p>
            <strong>Como ler cada registro:</strong> o <strong>caminho</strong> indica onde a
            atualização foi aplicada (arquivo/seção/projeto); as <strong>fontes</strong> são os
            documentos oficiais que fundamentam o conteúdo; a <strong>versão</strong> é o registro
            no histórico de versões do Skip (QA + publish). O histórico externo das tabelas fiscais
            (o que mudou de alíquota, com data e ato) continua disponível no{' '}
            <a
              href="https://buscadorncm.com.br/atualizacoes"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold inline-flex items-center gap-0.5"
            >
              Buscador NCM <ExternalLink className="w-3 h-3" />
            </a>
            .
          </p>
        </div>

        {/* Linha do tempo cronológica — mais recente primeiro, janela de 30 dias */}
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {VISIVEIS.map((r, i) => (
            <li key={i} className="ml-6">
              <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-lime-500 border-4 border-white shadow" />
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                    <CalendarClock className="w-3.5 h-3.5 text-lime-600" />
                    {r.data} às {r.hora}
                  </span>
                  {r.versao && (
                    <span className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                      {r.versao}
                    </span>
                  )}
                </div>

                <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                  {r.titulo}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">{r.conteudo}</p>

                <div className="flex items-start gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-orange-500" />
                  <span>
                    <strong>Caminho:</strong> {r.caminho}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600">
                  <Database className="w-3.5 h-3.5 mt-0.5 shrink-0 text-violet-500" />
                  <span>
                    <strong>
                      Fonte{r.fontes.length > 1 ? 's' : ''} oficial{r.fontes.length > 1 ? 'is' : ''}
                      :
                    </strong>{' '}
                    {r.fontes.map((f, j) => (
                      <span key={j}>
                        {j > 0 && ' · '}
                        {f.url ? (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:underline font-medium"
                          >
                            {f.nome}
                          </a>
                        ) : (
                          f.nome
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!VISIVEIS.length && (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nenhuma atualização nos últimos 30 dias.
          </p>
        )}
      </div>
    </section>
  )
}
