/**
 * 0116 — Fonte Estatística: Saneamento Básico (SNIS/Ministério das Cidades)
 *
 * Registra em `source_status` a fonte de indicadores de saneamento básico, no
 * MESMO padrão da migration 0115: confidence_tier "oficial_institucional" e
 * coverage_status "coberta_direta", para o selo aparecer na verificação de
 * fontes, na faixa da home e no Monitor Legislativo.
 *
 * 1) Fonte: snis (order 46) — acesso à água potável, coleta/tratamento de
 *    esgoto e perda de água (SNIS — Ministério das Cidades).
 * 2) Estende o cache `economic_indicators_cache` com a chave da fonte nova
 *    (semeia a base interna da fonte).
 * 3) Atualiza os 5 agentes especialistas com a diretiva de citação das fontes
 *    de saneamento (mesmo formato da 0115).
 *
 * Idempotente: em base vazia é no-op (só cria o que falta).
 */
/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // ── 1. fonte no catálogo source_status ──
    const colFontes = app.findCollectionByNameOrId('source_status')

    const src = {
      key: 'snis',
      name: 'SNIS — Sistema Nacional de Informações sobre Saneamento (Ministério das Cidades)',
      url: 'https://www.gov.br/cidades',
      order: 46,
      alternative:
        'Painel SNIS e dados abertos do Ministério das Cidades (Diagnóstico dos Serviços de Água e Esgotos)',
      message:
        'Fonte oficial institucional de indicadores de saneamento básico: acesso à água potável (% da população), coleta de esgoto (% da população), tratamento de esgoto (% do coletado) e perda de água na distribuição (% do volume), do Diagnóstico dos Serviços de Água e Esgotos do SNIS. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=snis), com cache e fallback transparente para a base interna.',
    }

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

    // ── 2. semente da base interna da fonte nova no cache ──
    let colecao = null
    try {
      colecao = app.findCollectionByNameOrId('economic_indicators_cache')
    } catch (_) {
      colecao = null
    }
    if (colecao) {
      let existente = null
      try {
        existente = app.findFirstRecordByData('economic_indicators_cache', 'chave', 'fonte_snis')
      } catch (_) {
        existente = null
      }
      if (!existente) {
        const recCache = new Record(colecao)
        recCache.set('chave', 'fonte_snis')
        recCache.set(
          'payload',
          JSON.stringify({
            fonte: 'snis',
            fonteViva: false,
            dados: [],
            criado_em: new Date().toISOString(),
          }),
        )
        recCache.set('atualizado_em', new Date().toISOString())
        app.save(recCache)
      }
    }

    // ── 3. diretiva de citação da fonte de saneamento ──
    const fontesDirective = `

INTEGRAÇÃO REAL DE DADOS DE SANEAMENTO BÁSICO E PADRÃO DE CITAÇÃO OBRIGATÓRIO:
1. Ao responder a questionamentos que envolvam indicadores de saneamento básico (acesso à água potável em % da população, acesso à coleta de esgoto em % da população, esgoto tratado em % do esgoto coletado e perda de água na distribuição em % do volume), você DEVE consultar os dados das fontes estatísticas e citar expressamente a origem dos números apresentados.
2. Formato de citação dos indicadores:
   - Fonte de origem expressa: "SNIS — Ministério das Cidades" (Sistema Nacional de Informações sobre Saneamento — Diagnóstico dos Serviços de Água e Esgotos);
   - Referência temporal quando aplicável (ex.: Diagnóstico SNIS da edição mais recente disponível);
   - Selo de procedência: "Oficial institucional";
   - Link da fonte quando aplicável (gov.br/cidades, Painel SNIS do Ministério das Cidades).
3. Transparência e Fallback: caso a consulta às fontes esteja momentaneamente inacessível (fonte fora do ar, bloqueio de rede ou manutenção), fundamente a resposta com base na base interna consolidada do sistema com aviso transparente (ex.: "Conforme base estatística interna consolidada do Panorama RT — fonte SNIS/Ministério das Cidades temporariamente indisponível..."), sem nunca apresentar erro cru ou interromper o atendimento.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado Federal, Ministério da Fazenda (MEF), CARF, ANP, SUFRAMA, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde) e SNIS (saneamento — Ministério das Cidades).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, STF, STJ, CARF, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde) e SNIS (saneamento — Ministério das Cidades).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), CGIBS, Portal Nacional NF-e/SVRS, CGSN, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde) e SNIS (saneamento — Ministério das Cidades).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde) e SNIS (saneamento — Ministério das Cidades).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde) e SNIS (saneamento — Ministério das Cidades).
- COMPARAÇÃO: Confronto com bases secundárias sempre com ressalva jurídica.
Estruture sempre seus relatórios com:
1. Resumo Executivo
2. Enquadramento e Base Legal (Planalto e Receita Federal com selo Oficial Institucional)
3. Alíquotas e Cálculos Comparativos (com indicadores IBGE/Tesouro/IPEA/CONAB/Cepea/FipeZap/INEP/DATASUS/SNIS quando aplicável)
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
        console.log('Aviso ao atualizar agente ' + ag.id + ' na migration 0116: ' + String(eAgent))
      }
    }
  },
  (app) => {
    // Revert: remove apenas o registro da fonte nova; coleção e agentes permanecem
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'snis')
      app.delete(rec)
    } catch (_) {}
  },
)
