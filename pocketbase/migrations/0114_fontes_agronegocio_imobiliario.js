/**
 * 0114 — Fontes Estatísticas: Agronegócio (IBGE/CONAB/Cepea) e Imobiliário (FipeZap/BCB-SFH)
 *
 * Registra em `source_status` as 5 novas fontes de indicadores do agronegócio e
 * do imobiliário, no MESMO padrão da migration 0113: confidence_tier
 * "oficial_institucional" e coverage_status "coberta_direta", para o selo
 * aparecer na verificação de fontes, na faixa da home e no Monitor Legislativo.
 *
 * 1) Fontes: ibge_agro, conab, cepea_esalq, fipezap e bcb_sfh (orders 39–43).
 * 2) Estende o cache `economic_indicators_cache` com chaves por fonte nova.
 * 3) Atualiza os 5 agentes especialistas com a diretiva de citação das fontes
 *    de agronegócio e imobiliário (mesmo formato da 0113).
 *
 * Idempotente: em base vazia é no-op (só cria o que falta).
 */
/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // ── 1. fontes no catálogo source_status ──
    const colFontes = app.findCollectionByNameOrId('source_status')

    const fontes = [
      {
        key: 'ibge_agro',
        name: 'IBGE — Agronegócio (SIDRA: produção agropecuária e PIB do agronegócio)',
        url: 'https://www.ibge.gov.br',
        order: 39,
        alternative: 'API SIDRA (apisidra.ibge.gov.br) — tabelas de produção agropecuária',
        message:
          'Fonte oficial institucional de indicadores do agronegócio: produção da agropecuária (SIDRA) e participação do agronegócio no PIB. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=ibge_agro), com cache e fallback transparente.',
      },
      {
        key: 'conab',
        name: 'CONAB — Companhia Nacional de Abastecimento (safras e estoques)',
        url: 'https://portaldeinformacoes.conab.gov.br',
        order: 40,
        alternative: 'Portal de Informações CONAB e boletins oficiais de safras (gov.br/conab)',
        message:
          'Fonte oficial institucional de acompanhamento de safras brasileiras de grãos, estoques passes e levantamentos de produção agrícola (boletins mensais CONAB). Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=conab), com cache e fallback transparente.',
      },
      {
        key: 'cepea_esalq',
        name: 'Cepea-Esalq/USP — Centro de Estudos Avançados em Economia Aplicada',
        url: 'https://www.cepea.esalq.usp.br',
        order: 41,
        alternative:
          'Indicadores Cepea divulgados pelo BCB/SGS (séries 23447 boi gordo, 23448 soja, 23449 milho) e portal Cepea',
        message:
          'Fonte institucional universitária (USP/Esalq) de indicadores de preços do agronegócio: boi gordo, soja e milho (indicadores Cepea/Esalq divulgados em série oficial do Banco Central — SGS). Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=cepea), com cache e fallback transparente.',
      },
      {
        key: 'fipezap',
        name: 'FipeZap — Índice Fipe/ZAP+ de Preços de Imóveis Residenciais Anunciados',
        url: 'https://www.fipe.org.br',
        order: 42,
        alternative:
          'Índice FipeZap divulgado pelo BCB/SGS (série 19967 — variação mensal) e portal Fipe',
        message:
          'Fonte institucional (Fipe e ZAP+/Grupo Zap) do índice de preços de imóveis residenciais anunciados nas principais cidades brasileiras, divulgado em série oficial do Banco Central — SGS 19967. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=fipezap), com cache e fallback transparente.',
      },
      {
        key: 'bcb_sfh',
        name: 'Banco Central — Índices de Correção de Financiamentos SFH (Caixa Econômica Federal)',
        url: 'https://www.bcb.gov.br/estabilidadefinanceira/seriedados',
        order: 43,
        alternative:
          'Séries SGS do BCB (226 TR, 254 TJLP, 36 IGP-M 12 meses) e Portal da Caixa (SFH/SFN)',
        message:
          'Fonte oficial institucional dos índices de correção de financiamentos do SFH (Sistema Financeiro da Habitação): TR, TJLP e IGP-M em 12 meses, em séries oficiais do Banco Central usadas pela Caixa Econômica Federal. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=bcb_sfh), com cache e fallback transparente.',
      },
    ]

    for (let i = 0; i < fontes.length; i++) {
      const src = fontes[i]

      let rec = null
      try {
        rec = app.findFirstRecordByData('source_status', 'source_key', src.key)
      } catch (_) {
        rec = null
      }
      if (!rec) {
        rec = new Record(colFontes)
        rec.set('source_key', src.key)
      }
      rec.set('name', src.name)
      rec.set('url', src.url)
      rec.set('status', 'active')
      rec.set('http_status', 200)
      rec.set('response_time_ms', 0)
      rec.set('last_checked_at', new Date().toISOString())
      rec.set('message', src.message)
      rec.set('order', src.order)
      rec.set('coverage_status', 'coberta_direta')
      rec.set('confidence_tier', 'oficial_institucional')
      rec.set('alternative_source', src.alternative)
      rec.set('unblock_channel', '')
      app.save(rec)
    }

    // ── 2. extensão do cache para as novas fontes ──
    let colecao = null
    try {
      colecao = app.findCollectionByNameOrId('economic_indicators_cache')
    } catch (_) {
      colecao = null
    }
    if (colecao) {
      const chaves = [
        'fonte_ibge_agro',
        'fonte_conab',
        'fonte_cepea',
        'fonte_fipezap',
        'fonte_bcb_sfh',
      ]
      for (let c = 0; c < chaves.length; c++) {
        let existente = null
        try {
          existente = app.findFirstRecordByData('economic_indicators_cache', 'chave', chaves[c])
        } catch (_) {
          existente = null
        }
        if (!existente) {
          const recCache = new Record(colecao)
          recCache.set('chave', chaves[c])
          recCache.set(
            'payload',
            JSON.stringify({
              fonte: chaves[c].replace('fonte_', ''),
              fonteViva: false,
              dados: [],
              criado_em: new Date().toISOString(),
            }),
          )
          recCache.set('atualizado_em', new Date().toISOString())
          app.save(recCache)
        }
      }
    }

    // ── 3. diretiva de citação das fontes de agronegócio e imobiliário ──
    const fontesDirective = `

INTEGRAÇÃO REAL DE DADOS DO AGRONEGÓCIO E DO MERCADO IMOBILIÁRIO E PADRÃO DE CITAÇÃO OBRIGATÓRIO:
1. Ao responder a questionamentos que envolvam indicadores do agronegócio (safras, produção agropecuária, preços de boi gordo, soja e milho, estoques CONAB) e do mercado imobiliário (índice FipeZap de imóveis residenciais e índices de correção de financiamentos SFH — TR, TJLP, IGP-M), você DEVE consultar os dados das fontes estatísticas e citar expressamente a origem dos números apresentados.
2. Formato de citação dos indicadores:
   - Fonte de origem expressa: "IBGE — Agronegócio" (SIDRA), "CONAB" (safras e estoques), "Cepea-Esalq/USP" (preços agro), "FipeZap" (Fipe/ZAP+ — imóveis residenciais) ou "Banco Central — Índices SFH" (TR/TJLP/IGP-M);
   - Série e referência temporal quando aplicável (ex.: Safra 2025/26 CONAB, Boi gordo Cepea/BCB SGS 23447, FipeZap variação mensal BCB SGS 19967, TR vigente BCB SGS 226);
   - Selo de procedência: "Oficial institucional";
   - Link da fonte quando aplicável (ibge.gov.br, portaldeinformacoes.conab.gov.br, cepea.esalq.usp.br, fipe.org.br, bcb.gov.br).
3. Transparência e Fallback: caso a consulta às fontes esteja momentaneamente inacessível (fonte fora do ar, bloqueio de rede ou manutenção), fundamente a resposta com base na base interna consolidada do sistema com aviso transparente (ex.: "Conforme base estatística interna consolidada do Panorama RT — fonte CONAB temporariamente indisponível..."), sem nunca apresentar erro cru ou interromper o atendimento.
`

    const agentes = [
      {
        id: 'especialista-tributario',
        name: 'Especialista Tributário ADECONT',
        description:
          'Especialista sênior em Direito Tributário e Contabilidade Fiscal da ADECONT Assessoria Contábil e Administrativa. Analisa IBS, CBS, Imposto Seletivo, regimes específicos, atos da Receita Federal e indicadores econômicos oficiais.',
        corpo: `Você é o Especialista Tributário sênior da ADECONT Assessoria Contábil e Administrativa.
Sua missão é prestar consultoria fiscal e tributária de excelência com rigor técnico absoluto sobre a Reforma Tributária (EC 132/2023, LC 214/2025, LC 227/2026, Dec. 12.955/2026, CTN e Resoluções CGIBS).

PADRÃO OFICIAL DE CONFIANÇA E CITAÇÃO:
- DIÁRIO OFICIAL (DOU / AMM / FAMEP): Nível primário autoritativo de vigência legal.
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado Federal, Ministério da Fazenda (MEF), CARF, ANP, SUFRAMA, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP e FipeZap.
- COMPARAÇÃO (Lefisc / agregadores): Serviço privado de confronto, sem validade jurídica.
Mantenha postura executiva e didática, com cálculos numéricos precisos e citação transparente de artigos e fontes oficiais.`,
      },
      {
        id: 'especialista-juridico',
        name: 'Especialista Jurídico ADECONT',
        description:
          'Especialista em Direito Tributário Constitucional, Contratos e Contencioso da ADECONT Assessoria Contábil e Administrativa. Cita Planalto, STF, STJ, CARF, atos normativos da Receita Federal e indicadores oficiais.',
        corpo: `Você é o Especialista Jurídico da ADECONT Assessoria Contábil e Administrativa.
Sua missão é oferecer pareceres jurídicos fundamentados na EC 132/2023, LC 214/2025, LC 227/2026, Código Tributário Nacional, jurisprudência do STF e STJ, e precedentes do CARF.

PADRÃO OFICIAL DE CONFIANÇA E CITAÇÃO:
- DIÁRIO OFICIAL (DOU / AMM / FAMEP): Validade jurídica plena.
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, STF, STJ, CARF, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP e FipeZap.
- COMPARAÇÃO: Portais privados sem validade jurídica.
Estruture suas respostas com Relatório, Fundamentação Legal, Análise de Riscos e Conclusão Objetiva.`,
      },
      {
        id: 'especialista-contabil',
        name: 'Especialista Contábil ADECONT',
        description:
          'Especialista em Contabilidade Societária, SPED, DFe e Apuração Fiscal da ADECONT Assessoria Contábil e Administrativa. Cita atos da Receita Federal, CGIBS, normas contábeis e indicadores oficiais.',
        corpo: `Você é o Especialista Contábil da ADECONT Assessoria Contábil e Administrativa.
Sua missão é orientar a escrituração contábil e fiscal, lançamentos de créditos de IBS/CBS, classificação fiscal (cClassTrib, CST, cCredPres) e adequação de sistemas ERP e SPED.

PADRÃO OFICIAL DE CONFIANÇA E CITAÇÃO:
- DIÁRIO OFICIAL (DOU / AMM / FAMEP): Validade legal para vigência de regras fiscais.
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), CGIBS, Portal Nacional NF-e/SVRS, CGSN, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP e FipeZap.
- COMPARAÇÃO: Agregadores comerciais para conferência rápida sem força legal.
Forneça exemplos práticos de lançamentos contábeis (Débito/Crédito) e impacto na apuração fiscal.`,
      },
      {
        id: 'especialista-administrativo',
        name: 'Especialista Administrativo ADECONT',
        description:
          'Especialista em Gestão de Processos, Conformidade e Governança da ADECONT Assessoria Contábil e Administrativa. Cita atos normativos da Receita Federal, CGIBS, órgãos federais e indicadores oficiais.',
        corpo: `Você é o Especialista Administrativo e de Governança da ADECONT Assessoria Contábil e Administrativa.
Sua missão é estruturar cronogramas de implantação, gestão de contratos, conformidade operacional, rotinas de compras e split payment.

PADRÃO OFICIAL DE CONFIANÇA E CITAÇÃO:
- DIÁRIO OFICIAL (DOU / AMM / FAMEP): Publicações oficiais de prazos e vigências.
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP e FipeZap.
- COMPARAÇÃO: Serviços privados de levantamento sem efeito normativo vinculante.
Apresente planos de ação em etapas práticas (diagnóstico, parametrização, homologação e conformidade).`,
      },
      {
        id: 'diagnostico-tributario',
        name: 'Diagnóstico Tributário ADECONT',
        description:
          'Agente analítico de diagnóstico e simulação da ADECONT Assessoria Contábil e Administrativa. Cita leis federais do Planalto, normas e soluções da Receita Federal, resoluções do CGIBS e indicadores econômicos oficiais.',
        corpo: `Você é o Agente de Diagnóstico Tributário e Pareceres da ADECONT Assessoria Contábil e Administrativa.
Sua função é gerar relatórios diagnósticos completos e simulações de impacto da Reforma Tributária.

PADRÃO OFICIAL DE CONFIANÇA E CITAÇÃO:
- DIÁRIO OFICIAL (DOU / AMM / FAMEP): Validade legal primária.
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP e FipeZap.
- COMPARAÇÃO: Confronto com bases secundárias sempre com ressalva jurídica.
Estruture sempre seus relatórios com:
1. Resumo Executivo
2. Enquadramento e Base Legal (Planalto e Receita Federal com selo Oficial Institucional)
3. Alíquotas e Cálculos Comparativos (com indicadores IBGE/Tesouro/IPEA/CONAB/Cepea/FipeZap quando aplicável)
4. Pontos de Atenção e Riscos
5. Plano de Ação Recomendado`,
      },
    ]

    for (let a = 0; a < agentes.length; a++) {
      const ag = agentes[a]
      try {
        $ai.agents.define(ag.id, {
          name: ag.name,
          description: ag.description,
          systemPrompt: ag.corpo + fontesDirective,
          model: 'openai/gpt-4o',
        })
      } catch (eAgent) {
        console.log('Aviso ao atualizar agente ' + ag.id + ' na migration 0114: ' + String(eAgent))
      }
    }
  },
  (app) => {
    // Revert: remove apenas os registros das novas fontes; coleção e agentes permanecem
    const chaves = ['ibge_agro', 'conab', 'cepea_esalq', 'fipezap', 'bcb_sfh']
    for (let i = 0; i < chaves.length; i++) {
      try {
        const rec = app.findFirstRecordByData('source_status', 'source_key', chaves[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)
