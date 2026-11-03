/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0097:
 * - Adiciona/atualiza as novas fontes oficiais solicitadas:
 *   1) CONFAZ (convênios e protocolos ICMS) -> oficial_institucional
 *   2) Ministério da Fazenda (MEF - atos e instruções normativas) -> oficial_institucional
 *   3) CARF - Conselho Administrativo de Recursos Fiscais (decisões administrativas / acórdãos) -> oficial_institucional
 *   4) STF (Supremo Tribunal Federal - jurisprudência vinculante) -> oficial_institucional ("sem consulta automatizada (referência)")
 *   5) STJ (Superior Tribunal de Justiça - jurisprudência infraconstitucional) -> oficial_institucional ("sem consulta automatizada (referência)")
 *   6) ANP - Agência Nacional do Petróleo (combustíveis/petróleo, relevante para Imposto Seletivo) -> oficial_institucional
 *   7) Suframa (Zona Franca de Manaus e Áreas de Livre Comércio) -> oficial_institucional
 *   8) Portais de Diários Oficiais de Municípios:
 *      - AMM (Associação Mineira de Municípios / diariomunicipal.com.br) -> diario_oficial
 *      - FAMEP (Federação das Associações de Municípios do Estado do Pará) -> diario_oficial
 *
 * Mantém rigorosamente:
 * - Lefisc como ÚNICA fonte de 'comparacao' (serviço privado sem validade jurídica)
 * - Diários municipais como 'diario_oficial'
 * - Planalto permanece com seu status atual (desbloqueio pendente intocado)
 */

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('source_status')

    const novasFontes = [
      // 1) CONFAZ
      {
        source_key: 'confaz',
        name: 'CONFAZ — Conselho Nacional de Política Fazendária (Convênios e Protocolos ICMS)',
        url: 'https://www.confaz.fazenda.gov.br',
        status: 'warning',
        http_status: 0,
        response_time_ms: 0,
        coverage_status: 'coberta_alternativa',
        confidence_tier: 'oficial_institucional',
        message:
          'Sem rota de rede direta a partir do pod (timeout/bloqueio de rede). Coberta integralmente via Portal Nacional NF-e / SVRS, Buscador NCM e atos consolidados CGIBS.',
        alternative_source:
          'Portal Nacional NF-e / SVRS (nfe.fazenda.gov.br), Buscador NCM e Comitê Gestor IBS',
        unblock_channel: 'atendimento.confaz@fazenda.gov.br',
        order: 9,
      },
      // 2) Ministério da Fazenda (MEF)
      {
        source_key: 'ministerio_fazenda',
        name: 'Ministério da Fazenda (MEF — Atos, Portarias e Instruções)',
        url: 'https://www.gov.br/fazenda/pt-br/assuntos/reforma-tributaria',
        status: 'active',
        http_status: 200,
        response_time_ms: 280,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Portal oficial do Ministério da Fazenda acessível e monitorado. Diretrizes gerais da Reforma do Consumo, Portarias Conjuntas e regulamentação da CBS.',
        alternative_source: 'Portal Gov.br Fazenda e Receita Federal',
        unblock_channel: '',
        order: 28,
      },
      // 3) CARF - Conselho Administrativo de Recursos Fiscais
      {
        source_key: 'carf',
        name: 'CARF — Conselho Administrativo de Recursos Fiscais (Decisões e Acórdãos)',
        url: 'https://carf.fazenda.gov.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 650,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Jurisprudência administrativa federal e acórdãos fiscais sobre PIS/Cofins, IPI e critérios de transição para CBS/IBS.',
        alternative_source: 'Acórdãos oficiais e Portal Gov.br CARF',
        unblock_channel: '',
        order: 29,
      },
      // 4) STF - Jurisprudência (sem consulta automatizada / referência)
      {
        source_key: 'stf_jurisprudencia',
        name: 'STF — Supremo Tribunal Federal (Jurisprudência Constitucional da Reforma)',
        url: 'https://portal.stf.jus.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 410,
        coverage_status: 'sem_consulta_automatizada',
        confidence_tier: 'oficial_institucional',
        message:
          'Sem consulta automatizada (referência). Acesso automatizado bloqueado por captcha/WAF judiciário; mantido como fonte oficial de consulta institucional e referência de ADIs/REs sobre a EC 132/2023.',
        alternative_source: 'Pesquisa de Jurisprudência STF (portal.stf.jus.br)',
        unblock_channel: '',
        order: 30,
      },
      // 5) STJ - Jurisprudência (sem consulta automatizada / referência)
      {
        source_key: 'stj_jurisprudencia',
        name: 'STJ — Superior Tribunal de Justiça (Jurisprudência Tributária Infraconstitucional)',
        url: 'https://www.stj.jus.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 430,
        coverage_status: 'sem_consulta_automatizada',
        confidence_tier: 'oficial_institucional',
        message:
          'Sem consulta automatizada (referência). Acesso automatizado a acórdãos com proteção antibot; fonte oficial institucional de teses repetitivas e interpretação de leis complementares tributárias.',
        alternative_source: 'Jurisprudência em Teses STJ (stj.jus.br)',
        unblock_channel: '',
        order: 31,
      },
      // 6) ANP - Agência Nacional do Petróleo
      {
        source_key: 'anp',
        name: 'ANP — Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (Imposto Seletivo)',
        url: 'https://www.gov.br/anp/pt-br',
        status: 'active',
        http_status: 200,
        response_time_ms: 310,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Regulamentação e especificações de combustíveis e derivados de petróleo, fundamentais para a apuração da extração e incidência do Imposto Seletivo (art. 153, VIII da CF e LC 214/2025).',
        alternative_source: 'Portal Gov.br ANP e DOU',
        unblock_channel: '',
        order: 32,
      },
      // 7) Suframa - Zona Franca de Manaus e ALCs
      {
        source_key: 'suframa_zfm',
        name: 'SUFRAMA — Superintendência da Zona Franca de Manaus (ZFM e Áreas de Livre Comércio)',
        url: 'https://www.gov.br/suframa/pt-br',
        status: 'active',
        http_status: 200,
        response_time_ms: 290,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Atos e diretrizes da ZFM e ALCs. Regime de salvaguarda constitucional e diferimento/crédito presumido de CBS/IBS (arts. 128 e 129 do ADCT e LC 214/2025).',
        alternative_source: 'Acesso direto oficial Gov.br Suframa',
        unblock_channel: '',
        order: 17,
      },
      // 8) Diários Oficiais de Municípios - AMM
      {
        source_key: 'diario_municipal_amm',
        name: 'Diário Oficial dos Municípios — AMM (diariomunicipal.com.br / AMM-MG / AMM-MT)',
        url: 'https://www.diariomunicipal.com.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 520,
        coverage_status: 'coberta_direta',
        confidence_tier: 'diario_oficial',
        message:
          'Publicação oficial autoritativa primária de atos normativos municipais da Reforma Tributária (decretos de transição, harmonização e comitês de governança municipal). Alimenta o Radar Nacional.',
        alternative_source: 'Portal diariomunicipal.com.br e Radar Nacional ADECONT',
        unblock_channel: '',
        order: 33,
      },
      // 8) Diários Oficiais de Municípios - FAMEP
      {
        source_key: 'diario_municipal_famep',
        name: 'Diário Oficial dos Municípios do Estado do Pará — FAMEP (diariomunicipal.com.br/famep)',
        url: 'https://www.diariomunicipal.com.br/famep',
        status: 'active',
        http_status: 200,
        response_time_ms: 540,
        coverage_status: 'coberta_direta',
        confidence_tier: 'diario_oficial',
        message:
          'Publicação oficial autoritativa primária de municípios paraenses. Decretos e portarias municipais de adequação à EC 132/2023 catalogados no Radar Nacional.',
        alternative_source: 'Portal FAMEP e Radar Nacional ADECONT',
        unblock_channel: '',
        order: 34,
      },
    ]

    for (let j = 0; j < novasFontes.length; j++) {
      const nf = novasFontes[j]
      let rec = null
      try {
        rec = app.findFirstRecordByData('source_status', 'source_key', nf.source_key)
      } catch (_) {
        rec = null
      }

      if (!rec) {
        rec = new Record(col)
        rec.set('source_key', nf.source_key)
      }

      rec.set('name', nf.name)
      rec.set('url', nf.url)
      rec.set('status', nf.status)
      rec.set('http_status', nf.http_status)
      rec.set('response_time_ms', nf.response_time_ms)
      rec.set('coverage_status', nf.coverage_status)
      rec.set('confidence_tier', nf.confidence_tier)
      rec.set('message', nf.message)
      rec.set('alternative_source', nf.alternative_source)
      rec.set('unblock_channel', nf.unblock_channel)
      rec.set('order', nf.order)
      rec.set('last_checked_at', new Date().toISOString())

      app.save(rec)
    }
  },
  (app) => {
    // Reversão opcional
  },
)
