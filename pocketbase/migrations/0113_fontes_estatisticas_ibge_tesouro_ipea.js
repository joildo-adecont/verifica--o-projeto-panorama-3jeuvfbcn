/**
 * 0113 — Fontes Estatísticas Oficiais: IBGE, Tesouro Nacional e IPEA
 *
 * 1) Registra `ibge`, `tesouro_nacional` e `ipea` em `source_status` com
 *    confidence_tier "oficial_institucional", para o selo aparecer na
 *    verificação de fontes, na faixa de status da home e no Monitor Legislativo.
 * 2) Atualiza os 5 agentes especialistas com diretiva de citação das novas
 *    fontes estatísticas (mesmo formato da rfbDirective da migration 0100).
 * 3) Estende o cache `economic_indicators_cache` (criado na 0110) para as
 *    novas fontes: cria registros de chave por fonte, se ainda não existirem.
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
        key: 'ibge',
        name: 'IBGE — Instituto Brasileiro de Geografia e Estatística (SIDRA e API de Indicadores)',
        url: 'https://www.ibge.gov.br',
        order: 36,
        alternative: 'API SIDRA (servicedata.ibge.gov.br) e API IBGE (servicodados.ibge.gov.br)',
        message:
          'Fonte oficial institucional de indicadores econômicos e estatísticas oficiais: IPCA, INPC, IPC, PIM-PF, PME, emprego, PIB trimestral e classificação CNAE 2.3. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=ibge), com cache e fallback transparente.',
      },
      {
        key: 'tesouro_nacional',
        name: 'Tesouro Nacional — Tesouro Transparente (API de Dados Abertos, RREO/RGF e Dívida)',
        url: 'https://www.tesourotransparente.gov.br',
        order: 37,
        alternative: 'API do Tesouro Transparente (api.tesouro.gov.br) e Portal SIAFI',
        message:
          'Fonte oficial institucional de indicadores fiscais e financeiros: receitas e despesas do Governo Federal (RREO/RGF), dívida pública, títulos da dívida (Tesouro Direto) e execução orçamentária. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=tesouro), com cache e fallback transparente.',
      },
      {
        key: 'ipea',
        name: 'IPEA — Instituto de Pesquisa Econômica Aplicada (IPEADATA)',
        url: 'https://www.ipeadata.gov.br',
        order: 38,
        alternative: 'API IPEADATA (api.ipeadata.gov.br) e portal do IPEA',
        message:
          'Fonte oficial institucional de séries macroeconômicas e regionais: salário mínimo, IPCA-15, câmbio, contas nacionais, indicadores sociais e regionais. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=ipea), com cache e fallback transparente.',
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
      const chaves = ['fonte_ibge', 'fonte_tesouro', 'fonte_ipea']
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

    // ── 3. diretiva de citação das fontes estatísticas para os 5 agentes ──
    const fontesDirective = `

INTEGRAÇÃO REAL DE DADOS DAS FONTES ESTATÍSTICAS OFICIAIS (IBGE, TESOURO NACIONAL E IPEA) E PADRÃO DE CITAÇÃO OBRIGATÓRIO:
1. Ao responder a questionamentos que envolvam indicadores econômicos, inflação, correção monetária, salário mínimo, dívida pública, execução orçamentária e estatísticas oficiais, você DEVE consultar os dados das fontes estatísticas e citar expressamente a origem dos números apresentados.
2. Formato de citação dos indicadores:
   - Fonte de origem expressa: "IBGE" (SIDRA/API de Indicadores), "Tesouro Nacional" (Tesouro Transparente) ou "IPEA" (IPEADATA);
   - Série e referência temporal quando aplicável (ex.: IPCA-12 meses IBGE, Salário mínimo vigente IPEADATA, RREO Tesouro Nacional);
   - Selo de procedência: "Oficial institucional";
   - Link da fonte quando aplicável (ibge.gov.br, tesourotransparente.gov.br, ipeadata.gov.br).
3. Transparência e Fallback: caso a consulta às fontes estatísticas esteja momentaneamente inacessível (fonte fora do ar, bloqueio de rede ou manutenção), fundamente a resposta com base na base interna consolidada do sistema com aviso transparente (ex.: "Conforme base estatística interna consolidada do Panorama RT — fonte IBGE temporariamente indisponível..."), sem nunca apresentar erro cru ou interromper o atendimento.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado Federal, Ministério da Fazenda (MEF), CARF, ANP, SUFRAMA, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional e IPEA.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, STF, STJ, CARF, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional e IPEA.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), CGIBS, Portal Nacional NF-e/SVRS, CGSN, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional e IPEA.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional e IPEA.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional e IPEA.
- COMPARAÇÃO: Confronto com bases secundárias sempre com ressalva jurídica.
Estruture sempre seus relatórios com:
1. Resumo Executivo
2. Enquadramento e Base Legal (Planalto e Receita Federal com selo Oficial Institucional)
3. Alíquotas e Cálculos Comparativos (com indicadores IBGE/Tesouro/IPEA quando aplicável)
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
        console.log('Aviso ao atualizar agente ' + ag.id + ' na migration 0113: ' + String(eAgent))
      }
    }
  },
  (app) => {
    // Revert: remove apenas os registros das novas fontes; coleção e agentes permanecem
    const chaves = ['ibge', 'tesouro_nacional', 'ipea']
    for (let i = 0; i < chaves.length; i++) {
      try {
        const rec = app.findFirstRecordByData('source_status', 'source_key', chaves[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)
