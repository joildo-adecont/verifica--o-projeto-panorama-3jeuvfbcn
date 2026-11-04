/**
 * 0119 — Fontes Estatísticas: Emprego e Desemprego (IBGE PNAD Contínua e CAGED)
 *
 * Registra em `source_status` as 2 novas fontes de indicadores de emprego, no
 * MESMO padrão das migrations 0113–0118: confidence_tier
 * "oficial_institucional" e coverage_status "coberta_direta", para o selo
 * aparecer na verificação de fontes, na faixa da home e no Monitor Legislativo.
 *
 * 1) Fontes: ibge_pnad (order 47) e caged (order 48).
 * 2) Semeia o cache `economic_indicators_cache` com as chaves das fontes novas
 *    (base interna de contingência).
 * 3) Atualiza os 5 agentes especialistas com a diretiva de citação das fontes
 *    de emprego (mesmo formato da 0118).
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
        key: 'ibge_pnad',
        name: 'IBGE — PNAD Contínua (taxa de desemprego, renda média do trabalhador e população ocupada)',
        url: 'https://www.ibge.gov.br/estatisticas/sociais/trabalho-e-rendimento',
        order: 47,
        alternative:
          'SIDRA/IBGE (tabelas 4099 e 5935 da PNAD Contínua) e painéis Trabalho e Rendimento do IBGE',
        message:
          'Fonte oficial institucional de indicadores de emprego e desemprego: taxa de desemprego (desocupados) da PNAD Contínua, renda média real habitual do trabalhador e população ocupada, via SIDRA/IBGE. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=ibge_pnad), com cache e fallback transparente para a base interna.',
      },
      {
        key: 'caged',
        name: 'CAGED — Ministério do Trabalho e Emprego (admissões, desligamentos e saldo de empregos formais)',
        url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/emprego-e-salario',
        order: 48,
        alternative:
          'Painel Novo CAGED do Ministério do Trabalho e Emprego e dados abertos do MTE (ftp/dados abertos)',
        message:
          'Fonte oficial institucional de indicadores de emprego formal: admissões, desligamentos e saldo de empregos formais (CEIS/Novo CAGED) do Ministério do Trabalho e Emprego. Consultada via proxy do backend (/backend/v1/fontes-estatisticas?fonte=caged), com cache e fallback transparente para a base interna.',
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

    // ── 2. semente da base interna das fontes novas no cache ──
    let colecao = null
    try {
      colecao = app.findCollectionByNameOrId('economic_indicators_cache')
    } catch (_) {
      colecao = null
    }
    if (colecao) {
      const chaves = ['fonte_ibge_pnad', 'fonte_caged']
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

    // ── 3. diretiva de citação das fontes de emprego ──
    const fontesDirective = `

INTEGRAÇÃO REAL DE DADOS DE EMPREGO E DESEMPREGO E PADRÃO DE CITAÇÃO OBRIGATÓRIO:
1. Ao responder a questionamentos que envolvam indicadores de emprego e desemprego (taxa de desemprego/desocupados da PNAD Contínua, renda média real habitual do trabalhador, população ocupada, admissões, desligamentos e saldo de empregos formais do CAGED), você DEVE consultar os dados das fontes estatísticas e citar expressamente a origem dos números apresentados.
2. Formato de citação dos indicadores:
   - Fonte de origem expressa: "IBGE — PNAD Contínua" (taxa de desemprego, renda média do trabalhador e população ocupada) ou "CAGED — Ministério do Trabalho e Emprego" (admissões, desligamentos e saldo de empregos formais — Novo CAGED);
   - Referência temporal quando aplicável (ex.: PNAD Contínua do trimestre móvel mais recente, CAGED do último mês divulgado pelo MTE);
   - Selo de procedência: "Oficial institucional";
   - Link da fonte quando aplicável (ibge.gov.br/estatisticas/sociais/trabalho-e-rendimento, sidra.ibge.gov.br, gov.br/trabalho-e-emprego, Painel Novo CAGED).
3. Transparência e Fallback: caso a consulta às fontes esteja momentaneamente inacessível (fonte fora do ar, bloqueio de rede ou manutenção), fundamente a resposta com base na base interna consolidada do sistema com aviso transparente (ex.: "Conforme base estatística interna consolidada do Panorama RT — fonte IBGE PNAD Contínua/CAGED temporariamente indisponível..."), sem nunca apresentar erro cru ou interromper o atendimento.
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado Federal, Ministério da Fazenda (MEF), CARF, ANP, SUFRAMA, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde), SNIS (saneamento — Ministério das Cidades), IBGE PNAD Contínua (emprego e desemprego) e CAGED (Ministério do Trabalho e Emprego).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, STF, STJ, CARF, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde), SNIS (saneamento — Ministério das Cidades), IBGE PNAD Contínua (emprego e desemprego) e CAGED (Ministério do Trabalho e Emprego).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), CGIBS, Portal Nacional NF-e/SVRS, CGSN, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde), SNIS (saneamento — Ministério das Cidades), IBGE PNAD Contínua (emprego e desemprego) e CAGED (Ministério do Trabalho e Emprego).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência), Receita Federal do Brasil (RFB), Comitê Gestor IBS (CGIBS), Senado, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde), SNIS (saneamento — Ministério das Cidades), IBGE PNAD Contínua (emprego e desemprego) e CAGED (Ministério do Trabalho e Emprego).
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
- OFICIAL INSTITUCIONAL: Portal da Legislação (Planalto — Presidência da República), Receita Federal do Brasil (RFB), CGIBS, Senado Federal, Ministério da Fazenda, Banco Central do Brasil (BCB), IBGE, Tesouro Nacional, IPEA, CONAB, Cepea-Esalq/USP, FipeZap, INEP/MEC (educação), DATASUS (saúde), SNIS (saneamento — Ministério das Cidades), IBGE PNAD Contínua (emprego e desemprego) e CAGED (Ministério do Trabalho e Emprego).
- COMPARAÇÃO: Confronto com bases secundárias sempre com ressalva jurídica.
Estruture sempre seus relatórios com:
1. Resumo Executivo
2. Enquadramento e Base Legal (Planalto e Receita Federal com selo Oficial Institucional)
3. Alíquotas e Cálculos Comparativos (com indicadores IBGE/Tesouro/IPEA/CONAB/Cepea/FipeZap/INEP/DATASUS/SNIS/PNAD/CAGED quando aplicável)
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
        console.log('Aviso ao atualizar agente ' + ag.id + ' na migration 0119: ' + String(eAgent))
      }
    }
  },
  (app) => {
    // Revert: remove apenas os registros das fontes novas; coleção e agentes permanecem
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'ibge_pnad')
      app.delete(rec)
    } catch (_) {}
    try {
      const rec = app.findFirstRecordByData('source_status', 'source_key', 'caged')
      app.delete(rec)
    } catch (_) {}
  },
)
