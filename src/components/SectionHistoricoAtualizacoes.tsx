import { History, ExternalLink, Database, MapPin, CalendarClock, Wrench, Scale } from 'lucide-react'

/**
 * Seção 13 — Histórico de Atualizações do Panorama, em DOIS BLOCOS:
 * 1) 🔧 Atualização do Sistema — mudanças no Panorama/Simulador (versões, layout, funcionalidades).
 * 2) ⚖️ Atualização da Legislação — atos normativos novos dos órgãos oficiais
 *    (Planalto, CGIBS, RFB etc.) e o que mudou no conteúdo por causa deles.
 * Alimentada pelo assistente a cada atualização (rotina semanal + sob demanda).
 *
 * POLÍTICA DE RETENÇÃO: mantém somente os registros dos últimos 30 dias.
 */

interface Registro {
  data: string // dd/mm/aaaa
  hora: string
  titulo: string
  conteudo: string
  fontes: { nome: string; url?: string }[]
  caminho: string
  versao?: string
  /** Bloco: 'sistema' = mudança no sistema; 'legislacao' = ato normativo novo de órgão oficial */
  bloco: 'sistema' | 'legislacao'
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
  // ============ BLOCO: ATUALIZAÇÃO DO SISTEMA ============
  {
    data: '05/10/2026',
    hora: '02:13',
    titulo: 'Botão "📤 Enviar" nas seções 6A–6F — envio pelo Simulador Geral (canal único)',
    conteudo:
      'A pedido do CEO, todas as seções de regimes (6A imobiliário, 6B agro, 6C consórcios, 6D financeiros, 6F profissões/plataformas) ganharam o botão "📤 Enviar esta simulação por e-mail (protocolo) — via Simulador Geral": faixa dourada no fim de cada simulador dedicado que abre o Simulador Geral com ?q=termo (item representativo da seção pré-buscado: venda de imóvel novo, produtos agropecuários, taxa de administração, serviços jurídicos) e &enviar=1 (painel de envio abre automaticamente). O Simulador Geral passou a aceitar o parâmetro enviar=1. Canal de envio ÚNICO: cadastro de clientes + protocolo SIM-AAAAMMDD-XXXXXX. Teste E2E: clique na 6F → Simulador Geral abre com 1.1701 Serviços jurídicos selecionado, simulação feita e painel de envio aberto com capitulação e resultado pré-preenchidos.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (base legal das capitulações)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — BotaoEnviarSimulacao nas 5 seções + parâmetro enviar=1 no simulador.html (2 cópias)',
    versao: '62493 v0.0.125',
  },
  {
    data: '05/10/2026',
    hora: '02:05',
    titulo: 'Simulador Geral: painel de envio integrado ao Cadastro de Clientes (protocolo)',
    conteudo:
      'A pedido do CEO, o Simulador Geral (simulador.html, nas 2 cópias) ganhou o painel "📤 Enviar simulação": botão no header + seção no fim da página que pré-preenche automaticamente o item simulado, a capitulação legal e o resultado da simulação; lista os clientes do cadastro (simul_clientes) e envia pelo MESMO canal do painel Cadastro & Envios — endpoint /backend/v1/simul-enviar, e-mail oficial ADECONT (nao-responda@adecont.com.br) com protocolo SIM-AAAAMMDD-XXXXXX e link de confirmação de recebimento. Teste E2E APROVADO em produção: item 3926.90.30 (Bolsa para drenagem, dispositivos60) simulado e enviado para joildo@adecont.com.br — protocolo SIM-20261005-2ZE5QB, registrado em simul_envios. Capitulação legal do envio vem do mapa por grupo (LC 214, RIBS, Decreto 12.955).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (base legal das capitulações)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — public/simulador.html e public/panorama-reforma/simulador.html (painel de envio integrado)',
    versao: '62493 v0.0.122',
  },
  {
    data: '04/10/2026',
    hora: '22:45',
    titulo: 'Modernização visual de TODOS os simuladores (6A–6F) — design system v2',
    conteudo:
      'A pedido do CEO, todos os 7 simuladores do Panorama (6A imobiliário, 6B agro, 6C consórcios, 6D financeiros, 6E regime híbrido, 6F profissões e plataformas) receberam o mesmo design moderno: (1) HERO com gradiente navy→navy-light, selo SIMULADOR dourado, subtítulo com a regra central e CAPITULAÇÃO LEGAL em chips (Lei Complementar / Decreto / Resolução / Ato Conjunto — indicador de origem de cada cálculo); (2) CHIPS DE MODO em cards clicáveis com badge de tecla de atalho ⌥1–⌥4 (Alt+1 a Alt+4 — hook useModoTeclado, sem conflito com os atalhos globais do menu lateral); (3) KPIs com gradiente navy, números tabulares e hover-shadow; (4) badges ✓/⚠ arredondados; (5) BLOCOS numerados com medalha dourada e chip de capitulação legal do bloco (art. da LC/Decreto/Res.); (6) RODAPÉ DE CAPITULAÇÃO LEGAL em cada simulador — origem de cada cálculo (LC 214/2025, LC 227/2026, Decreto 12.955/2026, Res. CGIBS 14/2026, RIBS Res. 6/2026, Res. CGSN 190/2026, atos conjuntos) com nota de atualização automática pela rotina semanal (seg 11h) e registro na Seção 13. Tabelas mantêm identidade navy+dourado com zebra/hover. Validado em produção nos 6 simuladores (hero + capitulação + chips presentes).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (fonte legal de todos os simuladores)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — design system v2 inline nos 7 arquivos (SectionRegimeImobiliario/Agronegocio/Consorcios/Financeiros/Simples/ProfissionaisPlataformas)',
    versao: '62493 v0.0.120',
  },
  {
    data: '04/10/2026',
    hora: '22:15',
    titulo: 'Seção 6F — simulador de profissões regulamentadas e simulador de plataformas digitais',
    conteudo:
      'A pedido do CEO, no mesmo layout dos simuladores da 6A/6B/6C/6D/6E: (1) 🧮 Simulador de profissões — art. 127: seleção das 18 profissões regulamentadas (com conselho: CRA, OAB, CAU, CRESS, CFB, CRBio, CRC, CORECON, CAE, CREF, CREA, CONRE, CRMV, COBRAMUSEO, CRQ, CONRERP), prestador PF (§1º, I: serviços vinculados à habilitação) × PJ (§1º, II: 5 requisitos cumulativos + checklist completo com §§1º-2º), apuração do tributo (referência 27,91% × 0,70 = efetiva 19,54%; IBS+CBS mês e ano), base de cálculo passo a passo, tabela de simulação por profissão (as 18 com alíquota efetiva, IBS+CBS mês/ano e botão Simular por profissão) e IMPLANTAÇÃO NA LINHA DO TEMPO 2026-2033 (CBS teste 0,9%/8,8% e IBS 0,1%→0,05%→10%→40%→70%→90%→100% dos arts. 343-347 e 295-296, com efetiva c/ −30% por ano e seletor de ano); exceção do §3º (educação física). (2) 🧮 Simulador de plataformas — art. 22: perfil do fornecedor (estrangeiro = substituição inciso I; nacional contribuinte = solidária inciso II conforme emite documento/informa; nacional não contribuinte), produto/serviço comercializado (regular 27,91%, cesta básica 0%, educação/saúde/medicamento −60%, serviço regular), checkboxes de documento fiscal, informações §5º e split payment §6º; mapa completo da responsabilidade (caput, I e II, §7º, §10-11); obrigações plataforma × fornecedor (§3º dispensa estrangeiro, §4º CGIBS/RFB, §5º informações, §6º split, §§12-13 opção de emitir documentos/substituta tributária — LC 227/2026); tabela de tributação dos produtos/serviços com alíquotas e base legal. Ambos com bloco de pontos pendentes de legislação e nota de atualização automática (rotina semanal + Seção 13).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (arts. 22 e 127)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionProfissionaisPlataformas.tsx (abas 🧮 Simulador de profissões e 🧮 Simulador de plataformas)',
    versao: '62493 v0.0.116',
  },
  {
    data: '04/10/2026',
    hora: '22:00',
    titulo:
      'Seção 6D — simulador de serviços financeiros (4 modos: empréstimo, tarifas bancárias, sujeitos, obrigações banco × correntista)',
    conteudo:
      'A pedido do CEO, no mesmo layout dos simuladores da 6A/6B/6C/6E: (1) 🏦 Empréstimo (crédito) — base passo a passo dos arts. 192 e 194: total pago − principal (não é receita, art. 192 §1º I) = base do banco; alíquota uniforme (art. 189); crédito do tomador PJ regular = alíquota × despesa financeira deduzido o juro equivalente à Selic over (art. 194, II), calculado parcela a parcela pelo regime de caixa, com tabela de custos por parcela (parcela, juros, parcela Selic, despesa creditável, crédito, custo líquido); deduções do banco listadas (captação sem principal §2º, câmbio, perdas com títulos, encargos de dívida, perdas de crédito nas regras do IR — red. LC 227/2026, assessores/correspondentes); reversão de provisões entra na base (art. 186); vedada despesa administrativa (art. 187); (2) 💳 Tarifas bancárias — simulador de receita de tarifas (abertura, manutenção, saques, transferências × nº de contas) com regime por tipo de instituição (banco/instituição de pagamento = normas gerais do art. 184; outra = regime específico) + mapa das tarifas (quem pode cobrar e como tributa, incl. conta de pagamento art. 184 §2º e arranjos art. 214) + crédito do correntista PJ (art. 198); (3) 👥 Sujeitos ativos e passivos — tabela do art. 183: 29 tipos supervisionados pelo SFN + fornecedores não supervisionados (securitizadoras, factoring, empresas simples de crédito, participantes de arranjos — LC 227/2026), com regime aplicável e tratamento das tarifas de cada um; (4) 📋 Obrigações: banco × correntista — tabela com tipo FISCAL/FINANCEIRA/VEDAÇÃO: banco (apurar com deduções, prestar informações ao CGIBS/RFB arts. 190-191, deduções restritas art. 187) × correntista PJ (créditos arts. 194, 195 debêntures, 196 desgio/DI, 198 tarifas, 203 leasing; vedações art. 197 moeda estrangeira/cooperativas) × PF consumidora final (sem crédito) + vedação geral do art. 199; bloco de pontos pendentes de legislação (CBS 2027 Senado, IBS Res. 14/2026, alíquotas do art. 233, regulamento das informações RIBS, atos CMN/Bacen/CVM).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (arts. 182-214)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho: 'Panorama (62493) — SectionFinanceiros.tsx (aba 🧮 Simulador financeiro, 4 modos)',
    versao: '62493 v0.0.114',
  },
  {
    data: '04/10/2026',
    hora: '21:50',
    titulo:
      'Seção 6C — simulador de consórcios (4 modos: taxa & lances, carta de crédito, garantia fiduciária, apuração & créditos/débitos)',
    conteudo:
      'A pedido do CEO, no mesmo layout dos simuladores da 6A/6B/6E: (1) 💰 Taxa & lances — base de cálculo passo a passo do art. 204 (taxa + tarifas/encargos/multas/juros efetivamente pagos, regime de caixa, dedução da intermediação §1º), IBS+CBS sobre a taxa e tabela do efeito dos lances (0-50% do crédito): lance maior reduz o saldo, a taxa e o tributo; contemplação não é fato gerador; (2) 🧾 Carta de crédito — mapa do art. 204, §2º: bem móvel (normas gerais), imóvel (regime 6A), regime específico, contemplação e parcelas (sem FG); responsabilidade do consorciado (administradora NÃO responde); crédito integral (contribuinte) × sem crédito (PF consumidora final); isenções/não incidências do consórcio; (3) ⚖️ Garantia fiduciária — mapa do art. 204, §3º: consolidação sem incidência, alienação conforme a condição do consorciado (§3º, II), adquirente com as mesmas regras (§3º, III), remuneração da administradora tributada (§3º, IV); (4) 📊 Apuração & créditos/débitos — quem apura o quê (administradora, intermediadora, consorciado PJ regular/Simples/PF, grupo) e tabela de créditos e débitos por operação (quem credita, quem debita), com bloco de pontos que dependem das próximas edições legislativas (alíquota CBS 2027 — Senado; IBS 19,11% — Res. 14/2026; regulamentação da dedução da intermediação e identificação do adquirente no RIBS) — monitorados na rotina semanal e registrados na Seção 13.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (arts. 204-206)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho: 'Panorama (62493) — SectionConsorcios.tsx (aba 🧮 Simulador de consórcios, 4 modos)',
    versao: '62493 v0.0.112',
  },
  {
    data: '04/10/2026',
    hora: '21:35',
    titulo:
      'Seção 6B — simulador do agronegócio (4 modos: produtor, insumos/diferimento, créditos presumidos, cooperativa)',
    conteudo:
      'A pedido do CEO, no mesmo layout dos simuladores da 6A e 6E (KPIs, base de cálculo passo a passo com base legal por linha, faixa, avisos): (1) 🚜 Produtor — enquadramento art. 164: receita própria + soma societária (§6º), limite R$ 3,6 mi atualizado pelo IPCA (art. 167), checkbox de produtor integrado (nunca contribuinte), excesso ≤20% → ano seguinte / >20% → 2º mês subsequente (§§2º-3º), faixa de receita R$ 1-12 mi com contribuinte? e quando entra, opção pelo regime regular (art. 165) e renúncia (art. 166); (2) 🌾 Insumos & diferimento — art. 138: −60% (efetiva 11,16% sobre ref. 27,91%), cadeia Regular→Regular / Regular→Produtor NC / Produtor NC→Regular com efeito por etapa, diferimento condicionado ao uso na produção vendida a adquirente com crédito presumido (§2º, I, b), encerramento (§§5º-9º), revisão do Anexo IX a cada 120 dias (§10); (3) 💵 Créditos presumidos — arts. 168-169: percentual editável, crédito = % × operação, valor líquido fiscal, discriminação obrigatória no documento (§1º), tabela de conexões fornecedor → cliente (quem credita quem: produtor NC, integrado, frete autônomo/MEI, cooperativa recebendo de associado §9º, cooperativa → associado regular), limites (uso pessoal §7º, dedução/ressarcimento §8º) e alíquota zero de tratores/máquinas/veículos de carga (art. 110); (4) 🤝 Cooperativa — art. 271: alíquota zero nas operações associado↔cooperativa e entre cooperativas, condicionante de créditos anulados para associado não regular (§1º, II), ressalva dos insumos diferidos (§4º), opção (§3º) e transferência de créditos do associado (art. 272).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (arts. 110, 137-138, 164-169, 271-272)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho: 'Panorama (62493) — SectionAgronegocio.tsx (aba 🧮 Simulador do agro, 4 modos)',
    versao: '62493 v0.0.109',
  },
  {
    data: '04/10/2026',
    hora: '20:50',
    titulo:
      'Seção 6A — enquadramento (art. 251), faixa de imóveis e valores apurados no simulador de aluguéis',
    conteudo:
      'A pedido do CEO, o simulador de aluguéis da Seção 6A ganhou: (0) Enquadramento — obrigatoriedade de apurar IBS/CBS (art. 251): seletor PJ (sempre contribuinte) × PF; receita de aluguéis no ano anterior; IPCA acumulado desde 01/2025 para atualizar os limites (R$ 240 mil → ano anterior; +20% → R$ 288 mil → próprio ano, art. 251, §5º e §2º, II; cumulatividade com mais de 3 imóveis confirmada pelo Decreto 12.955/2026, art. 382, §1º, III); badge CONTRIBUINTE (apuração obrigatória) × NÃO CONTRIBUINTE (sem IBS/CBS sobre aluguéis) com o motivo legal; notas do art. 253 (temporada ≤90 dias = hotelaria, −40%) e art. 487 (contratos até 16/01/2025 mantêm regra atual até 31/12/2028). (3) Faixa de imóveis — mínimo a máximo: tabela de 1 a 12 imóveis com receita mensal/anual, se obriga ou não a apurar, base, IBS+CBS no mês e no ano; identifica o mínimo de imóveis para obrigatoriedade nesta configuração. (4) Valores apurados: receita anual, base anual, IBS+CBS anual e card Obrigatoriedade (compõe / não compõe a apuração). Blocos renumerados (comparativo virou 5, RET virou 6).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (art. 251, §§1º, 2º e 5º)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'Decreto 12.955/2026 — art. 382, §1º, III (cumulatividade no ano corrente)',
        url: 'https://www.in.gov.br/en/web/dou/-/decreto-n-12.955-de-29-de-abril-de-2026-702415229',
      },
      {
        nome: 'DPC — Aluguel de imóveis com a Reforma Tributária (limites atualizados pelo IPCA)',
        url: 'https://www.dpc.com.br/aluguel-de-imoveis-com-a-reforma-tributaria-5-perguntas-e-respostas-para-entender-as-mudancas',
      },
    ],
    caminho:
      'Panorama (62493) — SectionRegimeImobiliario.tsx (simulador de aluguéis: bloco 0 enquadramento, bloco 3 faixa de imóveis, bloco 4 valores apurados)',
    versao: '62493 v0.0.107',
  },
  {
    data: '04/10/2026',
    hora: '20:35',
    titulo: 'Seção 6A — simulador do regime imobiliário (venda e aluguel)',
    conteudo:
      'A pedido do CEO, a Seção 6A (Regime Imobiliário) ganhou a aba 🧮 Simulador — venda e aluguel, no padrão do simulador do Simples (6E), com as particularidades da legislação imobiliária (LC 214, arts. 255–262). Dois modos: Venda (imóvel residencial novo c/ redutor social R$ 100 mil, usado c/ redutor de ajuste — custo de aquisição corrigido pelo IPCA — e lote c/ R$ 30 mil) e Aluguel (nº de imóveis, aluguel mensal, residencial c/ redutor social R$ 600/mês por imóvel × comercial sem redutor). Apresentação em 4 blocos: (1) Percentuais do cenário — referência 27,91%, redução do art. 261 (−50% venda / −70% locação), alíquota efetiva (13,96% / 8,37%) e carga sobre a receita; (2) Base de cálculo passo a passo — valor da operação → redutor de ajuste → redutor social → base efetiva → alíquota → IBS+CBS a recolher, cada linha com a base legal; (3) Comparativo reforma × tributação atual (PIS/Cofins 3,65% presumidos) com diferenças sinalizadas e crédito do adquirente; (4) Referência RET (2,08% / 0,53%, art. 485). Notas: art. 487 (contratos até 16/01/2025 mantêm regra atual até 31/12/2028) e CBS ref estimada (oficial depende de resolução do Senado).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (arts. 252–262, 257–260, 261 e 485)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'Redutor de ajuste — Barbieri Advogados (valor inicial e exemplo de cálculo)',
        url: 'https://www.barbieriadvogados.com/redutor-de-ajuste-entenda-o-mecanismo',
      },
      {
        nome: 'Resolução CGIBS 14/2026 — alíquota de referência 27,91%',
        url: 'https://www.in.gov.br/web/dou/-/resolucao-cgibs-n-14-de-2026',
      },
    ],
    caminho:
      'Panorama (62493) — SectionRegimeImobiliario.tsx (nova aba 🧮 Simulador — venda e aluguel)',
    versao: '62493 v0.0.105',
  },
  {
    data: '04/10/2026',
    hora: '20:15',
    titulo: 'Seção 6E — novo layout de resultados do regime híbrido',
    conteudo:
      'A pedido do CEO, a aba 🧮 Simulação — regime híbrido da Seção 6E foi reorganizada em 5 blocos numerados: (1) Percentuais do cenário — 4 KPIs (alíquota efetiva do DAS, partilha CBS+IBS do anexo, crédito ao cliente no DAS e alíquota híbrida); (2) Comparativo do mês em R$ — IBS+CBS a recolher (líquido), crédito que o cliente apropria e custo líquido % da receita, DAS × híbrido com diferenças sinalizadas; (3) Comparativo por faixa — as 6 faixas do Simples com limites (RBT12), efetiva no teto, crédito DAS, híbrido e diferença em p.p., faixa selecionada destacada; (4) Transição ano a ano 2027–2033 — partilha CBS+IBS no DAS, crédito DAS, híbrido (CBS ref + IBS 0,1%→pleno) e diferença, com grupos de partilha 1ª–2ª e 3ª–5ª faixa (Anexos XVIII–XXII da LC 214); (5) Faixas e limites do Simples — chips clicáveis (sublimite R$ 3,6 mi, teto R$ 4,8 mi, MEI fora).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (arts. 41, 47 e 344–347)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'CGSN — notícia sobre opção pelo regime regular (Simples híbrido)',
        url: 'https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5',
      },
    ],
    caminho:
      'Panorama (62493) — SectionSimples.tsx (aba 🧮 reorganizada em 5 blocos: KPIs, comparativo mensal, por faixa, transição ano a ano e limites)',
    versao: '62493 v0.0.102',
  },
  {
    data: '04/10/2026',
    hora: '13:30',
    titulo: 'Seção 6E — aba de simulação do regime híbrido (Simples normal × híbrido)',
    conteudo:
      'A pedido do CEO, a Seção 6E (Simples Nacional) ganhou a aba 🧮 Simulação — regime híbrido, com simulador comparativo: recolher IBS/CBS dentro do DAS × pelo regime regular (LC 214, art. 41, §3º; LC 123, art. 13, §10; Res. CGSN 190/2026, arts. 40-C/40-D). Entradas: receita mensal, anexo (I–V), faixa, % de custo com direito a crédito e CBS de referência (estimativa editável — oficial depende de resolução do Senado). Saídas: alíquota efetiva × partilha CBS+IBS do anexo (crédito limitado ao devido no DAS, art. 47, §9º, II) × alíquota cheia com crédito integral; IBS+CBS a recolher e crédito do cliente, com diferenças sinalizadas. Abaixo, tabela de forma e prazos da opção: janela 1–30/09 (efeitos jan–jun do ano seguinte, cancelamento até 30/11; 2026 prorrogado até 30/10 pela Res. CGSN 194/2026), janela 1–31/03 (efeitos jul–dez, cancelamento até 31/05), irretratabilidade por semestre e como optar no Portal. MEI (SIMEI) não participa.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto (art. 41, §3º; art. 47, §9º)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'CGSN — notícia sobre opção pelo regime regular (Simples híbrido)',
        url: 'https://www8.receita.fazenda.gov.br/simplesnacional/noticias/NoticiaCompleta.aspx?id=e595d010-1e04-4c3b-95d9-185fc58594b5',
      },
      {
        nome: 'Resolução CGSN 190/2026 — DOU (arts. 40-C/40-D)',
        url: 'https://www.in.gov.br/web/dou/-/resolucao-cgsn-n-190-de-4-de-agosto-de-2026-724454118',
      },
      {
        nome: 'Manual RFB — Opção pelo Regime Regular IBS/CBS no Simples Nacional',
        url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/Arquivos/manual/Manual%20op%C3%A7%C3%A3o%20regime%20regular%20IBS%20e%20CBS%20no%20Simples%20Nacional.pdf',
      },
    ],
    caminho:
      'Panorama (62493) — SectionSimples.tsx (nova aba 🧮 Simulação — regime híbrido + tabela de prazos)',
    versao: '62493 v0.0.99–100',
  },
  {
    data: '04/10/2026',
    hora: '12:20',
    titulo: 'Tabelas uniformizadas (layout da 6A) nas seções 6B–6F',
    conteudo:
      'A pedido do CEO, todas as seções de regime (6A a 6F) passaram a usar o MESMO layout de tabela da 6A Regime Imobiliário: colunas Operação / Redução / Detalhe / Base legal / Simular, thead navy com filete dourado e badges de tratamento. 6B: 4 tabelas (Reduções, Produtor não contribuinte, Créditos presumidos, Diferimento, Cooperativas). 6C: 3 tabelas (Taxa, Carta, Garantias). 6D: tabela Base e deduções + Arranjos. 6E: tabelas Transição (com badges de ano) e Regras — IBS e CBS no DAS (art. 343). 6F: tabelas Profissionais (−30%) e Plataformas.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionAgronegocio.tsx, SectionConsorcios.tsx, SectionFinanceiros.tsx, SectionSimples.tsx, SectionProfissionaisPlataformas.tsx (componente Tabela uniforme)',
    versao: '62493 v0.0.94',
    bloco: 'sistema',
  },
  {
    data: '04/10/2026',
    hora: '12:00',
    titulo: 'Seções 6C–6F no mesmo layout de abas da 6A/6B',
    conteudo:
      'A pedido do CEO, as seções 6C Consórcios, 6D Serviços financeiros, 6E Simples Nacional e 6F Profissionais e Plataformas foram reorganizadas no MESMO layout das seções 6A/6B: cabeçalho com selo navy+dourado, abas internas (AbaButton), cards com base legal, caixas de destaque (dourada/azul/âmbar) e links Simular. Abas: 6C (Taxa de administração / Carta de crédito / Garantias), 6D (Operações art. 182 / Base e deduções / Arranjos de pagamento), 6E (Transição 2026–2029+ / Regras do regime), 6F (Profissionais regulamentados / Plataformas digitais).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionConsorcios.tsx, SectionFinanceiros.tsx, SectionSimples.tsx, SectionProfissionaisPlataformas.tsx (reescritos com abas)',
    versao: '62493 v0.0.91',
    bloco: 'sistema',
  },
  {
    data: '04/10/2026',
    hora: '11:50',
    titulo: 'Regimes com entrada individual no menu lateral — 6C a 6F',
    conteudo:
      'A pedido do CEO, cada regime específico ganhou entrada individual no menu lateral e seção própria, no mesmo layout das seções 6A/6B: 6C Consórcios (tecla C), 6D Serviços financeiros (tecla F), 6E Simples Nacional (tecla P) e 6F Profissionais regulamentados e plataformas digitais (tecla R). A seção agregada 6C anterior foi desmembrada nas quatro seções individuais. O box de destaque da Seção 6 foi atualizado com os 6 cards (6A a 6F).',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionConsorcios.tsx, SectionFinanceiros.tsx, SectionSimples.tsx, SectionProfissionaisPlataformas.tsx (novos) + Index.tsx + PanoramaSideMenu.tsx + SectionRegimesEspecificos.tsx',
    versao: '62493 v0.0.90',
    bloco: 'sistema',
  },
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
    bloco: 'sistema',
  },
  {
    data: '04/10/2026',
    hora: '11:30',
    titulo:
      'Seção 6C — Consórcios, serviços financeiros, Simples Nacional e profissionais regulamentados',
    conteudo:
      'Nova seção com os demais regimes específicos e diferenciados, no mesmo padrão das seções 6A/6B, com 4 abas: Consórcios (arts. 204-206), Serviços financeiros (art. 182: 17 operações; base art. 185; deduções art. 192; arranjos art. 214; sujeitos BC/CVM/Previc/SUSEP art. 183), Simples Nacional (LC 123 art. 13-A: IBS no DAS até R$ 3,6 mi; alíquotas de teste 2026-2028 arts. 343-347; janelas Res. CGSN 190-192/2026) e Profissionais + plataformas (art. 127: redução 30%, 18 profissões; art. 22: responsabilidade solidária). Atalho O no menu lateral.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionOutrosRegimes.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: '62493 v0.0.88',
    bloco: 'sistema',
  },
  {
    data: '04/10/2026',
    hora: '11:15',
    titulo: 'Seção 6B — Regime do Agronegócio (produtor rural, créditos presumidos, cooperativas)',
    conteudo:
      'Nova seção dedicada ao regime do agropecuário (LC 214/2025, arts. 110, 137-138, 164-171 e 271-272), com 5 abas: Reduções de alíquota (produtos in natura −60% art. 137; insumos do Anexo IX −60% art. 138), Produtor não contribuinte (limite R$ 3,6 mi/ano art. 164), Créditos presumidos (arts. 168-169, tratores/veículos de carga alíquota zero art. 110), Diferimento de insumos (art. 138 §2º-§9º) e Cooperativas (alíquota zero art. 271, transferência de créditos art. 272). Links Simular para o grupo 🌾 Insumos agro. Atalho G no menu lateral.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho: 'Panorama (62493) — SectionAgronegocio.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: '62493 v0.0.87',
    bloco: 'sistema',
  },
  {
    data: '04/10/2026',
    hora: '11:00',
    titulo: 'Seção 6A — Regime Imobiliário (venda, locação, redutores e RET)',
    conteudo:
      'Nova seção dedicada ao regime específico das operações com bens imóveis (LC 214/2025, arts. 252-261 e 485-488), com 3 abas: Operações e reduções (alienação −50% com redutor social R$ 100 mil para imóvel novo e R$ 30 mil para lote, redutor de ajuste para imóvel usado, locação −70% com redutor social R$ 600/mês, intermediação e construção civil −50%), RET incorporação (2,08% patrimônio de afetação / 0,53% RET especial, opção antes de 01/01/2029) e Permutas e não incidências (art. 252 §2º/§5º/§5-A da LC 227/2026). Cada operação com link direto para simular (grupo 🏠 Imobiliário, 9 itens). Atalho I no menu lateral.',
    fontes: [
      {
        nome: 'LC 214/2025 compilada — Planalto',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
    ],
    caminho:
      'Panorama (62493) — SectionRegimeImobiliario.tsx (novo) + Index.tsx + PanoramaSideMenu.tsx',
    versao: '62493 v0.0.86',
    bloco: 'sistema',
  },
  {
    data: '04/10/2026',
    hora: '00:45',
    titulo: 'Unificação de dados — Seção 7A passa a ser a fonte única das tabelas de itens',
    conteudo:
      'Auditoria de duplicações (a pedido do CEO): 185 códigos NCM/NBS estavam repetidos entre as seções 2C/2D do Panorama HTML e a 7A; os anexos da LC 214 com tabela de itens na Seção 7 duplicavam a 7A; a Cesta Básica aparecia em 2 lugares. Unificação: a Seção 7A é agora a FONTE ÚNICA das tabelas de itens e alíquotas (1.053 linhas); a Seção 7 virou catálogo analítico com link direto para o bloco correspondente da 7A; a Seção 3 (Cesta) aponta para o Anexo I da LC 214 na 7A. Correção adicional: removida a duplicação de renderização da 7A no Index (v0.0.69).',
    fontes: [
      { nome: 'RIBS — Resolução CGIBS 6/2026 (cgibs.gov.br/resolucoes)' },
      { nome: 'LC 214/2025 compilada (Planalto)' },
      { nome: 'Decreto 12.955/2026 (Planalto)' },
    ],
    caminho:
      'Panorama (62493) — SectionAnexos.tsx (itensDetalhados → link 7A; box unificação), SectionCestaBasica.tsx (link 7A), Index.tsx (dedup 7A)',
    versao: '62493 v0.0.70',
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
  },
  {
    data: '03/10/2026',
    hora: '17:05',
    titulo: 'Seção 7 — Anexos I e II do RIBS completos com carga sob demanda (parcela final)',
    conteudo:
      'Tabelas de itens dos dois maiores anexos do RIBS: Anexo I depreciação (258 linhas oficiais com referência NCM, prazo de vida útil e taxa anual, incluindo as notas 1-3 do anexo) e Anexo II Repetro (580 itens nas 4 tabelas oficiais: T1 Repetro-Temporário 86, T2 GNL-Temporário 324 com tipo de atividade, T3 Repetro-Permanente 151, T4 Repetro-Entreposto 19). CARGA SOB DEMANDA: os dados só são baixados pelo navegador quando o anexo é aberto (import dinâmico). Com isto, os 5 anexos do RIBS têm 100% dos seus itens consultáveis no Panorama.',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho:
      'Panorama (62493) — src/data/ribsA1A2.ts (novo) + src/data/ribsRepetro.ts (novo) + SectionAnexos.tsx (TabelaSobDemanda)',
    versao: '62493 v0.0.62',
    bloco: 'sistema',
  },
  {
    data: '03/10/2026',
    hora: '16:45',
    titulo:
      'Seção 7 — Tabelas de itens dos Anexos III, IV e V do RIBS com filtro e teclas de atalho',
    conteudo:
      'Tabelas de itens consultáveis nos anexos do RIBS: Anexo III Reporto (14 itens), Anexo IV bens de capital (98 itens nas 3 tabelas oficiais) e Anexo V ZFM (49 itens com legislação estadual do AM por item — Lei 2.826/03 e Decretos 38.558/17 a 51.978/25). Cada tabela tem filtro próprio (item, descrição, NCM, legislação) e a busca geral da seção agora encontra itens dentro das tabelas. Teclas: / foca a busca geral, Esc limpa o filtro. Próxima parcela: Anexos I (≈260) e II (≈580) do RIBS.',
    fontes: [
      {
        nome: 'RIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
    ],
    caminho: 'Panorama (62493) — src/data/ribsItens.ts (novo) + SectionAnexos.tsx (TabelaItens)',
    versao: '62493 v0.0.61',
    bloco: 'sistema',
  },
  {
    data: '03/10/2026',
    hora: '00:45',
    titulo: 'Seção 7 ↔ Simulador — interligação completa nos dois sentidos (Parcela 3)',
    conteudo:
      'Mapeamento dos 118 itens do catálogo do Simulador aos anexos da Seção 7: cada anexo com mapeamento direto exibe selo "N no Simulador" e, aberto, a nota de correspondência (Anexo I 35 itens, XV 14, II 7, III 12, IV 11, IX 4, XVII 13, RIBS III 1, RIBS IV 4, RIBS V 1); faixa resumo no topo da seção. No sentido inverso, o Simulador ganhou o botão "📑 Anexos (Seção 7)" no header (nas duas cópias da página estática), levando à âncora #secao-7.',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
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
    bloco: 'sistema',
  },

  // ============ BLOCO: ATUALIZAÇÃO DA LEGISLAÇÃO (órgãos oficiais) ============
  {
    data: '01/10/2026',
    hora: '10:00',
    titulo: 'LC 214/2025 alterada pela LC 227/2026 — texto compilado atualizado no Planalto',
    conteudo:
      'A Lei Complementar 214/2025 (IBS/CBS) recebeu alterações da LC 227/2026, já refletidas no texto compilado do Planalto usado como fonte do Panorama: novo art. 252 §5-A (permutas com não contribuinte — redutores de ajuste), proteção patrimonial mutualista incluída nos serviços financeiros (art. 182) e revogação do Anexo XIV da LC 214. As seções 6A (permutas), 6D (financeiros) e 7 (índice de anexos) foram verificadas contra o texto compilado.',
    fontes: [
      {
        nome: 'Planalto — LC 214/2025 compilada (com alterações da LC 227/2026)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
      },
      {
        nome: 'Planalto — LC 227/2026 (texto original)',
        url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
      },
    ],
    caminho:
      'Panorama — seções 6A (permutas §5-A), 6D (financeiros), 7 (anexo XIV revogado); fonte de todas as seções de regime',
    versao: 'verificação 04/10/2026',
    bloco: 'legislacao',
  },
  {
    data: '30/04/2026',
    hora: '—',
    titulo: 'RIBS — Resolução CGIBS 6/2026: Regulamento do IBS (617 artigos, 28 anexos)',
    conteudo:
      'O Comitê Gestor do IBS publicou o Regulamento do IBS (RIBS) na Resolução CGIBS 6/2026, com 617 artigos e 28 anexos: depreciação (Anexo I), Repetro (Anexo II, 4 tabelas), Reporto (Anexo III), bens de capital (Anexo IV), ZFM (Anexo V) e demais. O Panorama extraiu os itens dos anexos diretamente do PDF oficial (Seções 7 e 7A) e cita o RIBS como base legal em toda a navegação. A Resolução 13/2026 altera o RIBS — monitorada na rotina semanal.',
    fontes: [
      {
        nome: 'CGIBS — Resolução CGIBS 6/2026 (PDF oficial)',
        url: 'https://www.cgibs.gov.br/upload/arquivos/202604/30084927-res-cgibs-n-6-30-abr-2026-regulamenta-o-ibs.pdf',
      },
      {
        nome: 'CGIBS — Resoluções (todas as 18 de 2026)',
        url: 'https://www.cgibs.gov.br/resolucoes',
      },
    ],
    caminho:
      'Panorama — seções 7 e 7A (anexos do RIBS), base legal citada nas seções 2/6; rotina semanal monitora novas resoluções',
    versao: 'publicado 30/04/2026',
    bloco: 'legislacao',
  },
  {
    data: '16/09/2026',
    hora: '—',
    titulo: 'Decreto 12.955/2026 — Regulamento da CBS (Planalto)',
    conteudo:
      'Decreto regulamentador da CBS publicado no Planalto, com anexos de produtos e serviços (Anexo IV citado no catálogo do Simulador). O Panorama usa o Decreto como fonte das seções de CBS e dos 5 blocos de anexos da CBS na Seção 7/7A.',
    fontes: [
      {
        nome: 'Planalto — Decreto 12.955/2026',
        url: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12955.htm',
      },
    ],
    caminho: 'Panorama — seções 7/7A (anexos CBS), Simulador (fonte do catálogo)',
    versao: 'publicado 16/09/2026',
    bloco: 'legislacao',
  },
  {
    data: '12/09/2026',
    hora: '—',
    titulo: 'Resoluções CGSN 190–192/2026 — Simples Nacional na reforma (IBS no DAS)',
    conteudo:
      'O Comitê Gestor do Simples Nacional publicou as Resoluções 190, 191 e 192/2026 regulamentando o recolhimento do IBS no DAS (LC 123, art. 13-A), as janelas de opção e a emissão de documento fiscal com destaque. Base legal da Seção 6E (Simples Nacional) do Panorama.',
    fontes: [
      {
        nome: 'Receita Federal / CGSN — Resoluções 190–192/2026',
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias',
      },
    ],
    caminho: 'Panorama — seção 6E (Simples Nacional); Seção 6 (tabela de regimes)',
    versao: 'publicado set/2026',
    bloco: 'legislacao',
  },
  {
    data: '2026',
    hora: '—',
    titulo: 'IT 2025.002 / Ato Técnico Conjunto — cClassTrib e cCredPres (em construção oficial)',
    conteudo:
      'Os códigos de classificação tributária (cClassTrib) e de crédito presumido (cCredPres) do IBS/CBS ainda NÃO foram publicados em fonte oficial definitiva — constam apenas da IT 2025.002 (v1.70) e do Ato Técnico Conjunto 8, monitorados via Buscador NCM (fonte secundária, seção 11). Quando publicados oficialmente, entram na Seção 7A e no Histórico deste bloco.',
    fontes: [
      {
        nome: 'Buscador NCM — acompanhamento de cClassTrib/cCredPres (fonte secundária)',
        url: 'https://buscadorncm.com.br/fontes',
      },
    ],
    caminho: 'Panorama — seção 11 (alerta de fonte secundária); pendência na rotina semanal',
    versao: 'monitoramento contínuo',
    bloco: 'legislacao',
  },
]

// Política de retenção: exibe somente registros dos últimos 30 dias.
const VISIVEIS = REGISTROS.filter((r) => ehRecente(r.data))
const SISTEMA = VISIVEIS.filter((r) => r.bloco === 'sistema')
const LEGISLACAO = VISIVEIS.filter((r) => r.bloco === 'legislacao')

function Bloco({
  titulo,
  icone,
  cor,
  registros,
  vazio,
}: {
  titulo: string
  icone: React.ReactNode
  cor: string
  registros: Registro[]
  vazio: string
}) {
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 border-b-2 pb-2 ${cor}`}>
        {icone}
        <h3 className="text-base md:text-lg font-bold text-slate-900">{titulo}</h3>
        <span className="ml-auto text-xs font-semibold text-slate-500">
          {registros.length} registro{registros.length === 1 ? '' : 's'}
        </span>
      </div>
      {registros.length ? (
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {registros.map((r, i) => (
            <li key={i} className="ml-6">
              <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full bg-lime-500 border-4 border-white shadow" />
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                    <CalendarClock className="w-3.5 h-3.5 text-lime-600" />
                    {r.data} {r.hora !== '—' ? `às ${r.hora}` : ''}
                  </span>
                  {r.versao && (
                    <span className="font-mono text-[11px] text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                      {r.versao}
                    </span>
                  )}
                </div>

                <h4 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                  {r.titulo}
                </h4>

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
                      Fonte{r.fontes.length > 1 ? 's' : ''} oficial
                      {r.fontes.length > 1 ? 'is' : ''}:
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
      ) : (
        <p className="text-sm text-slate-500 py-4 text-center">{vazio}</p>
      )}
    </div>
  )
}

export function SectionHistoricoAtualizacoes() {
  return (
    <section id="historico-atualizacoes" className="scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
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
            Registro cronológico em dois blocos: <strong>Atualização do Sistema</strong> (mudanças
            no Panorama e no Simulador) e <strong>Atualização da Legislação</strong> (atos
            normativos novos dos órgãos oficiais — Planalto, CGIBS, Receita Federal — e o que mudou
            no conteúdo por causa deles). Alimentado pelo assistente a cada atualização — na rotina
            semanal (segundas, 11h) e sob demanda.
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

        {/* BLOCO 1 — Atualização do Sistema */}
        <Bloco
          titulo="🔧 Atualização do Sistema"
          icone={<Wrench className="w-4 h-4 text-panorama-gold-dark" />}
          cor="border-panorama-gold/60"
          registros={SISTEMA}
          vazio="Nenhuma atualização do sistema nos últimos 30 dias."
        />

        {/* BLOCO 2 — Atualização da Legislação */}
        <Bloco
          titulo="⚖️ Atualização da Legislação — atos normativos dos órgãos oficiais"
          icone={<Scale className="w-4 h-4 text-panorama-gold-dark" />}
          cor="border-panorama-navy/60"
          registros={LEGISLACAO}
          vazio="Nenhum ato normativo novo dos órgãos oficiais nos últimos 30 dias."
        />
      </div>
    </section>
  )
}
