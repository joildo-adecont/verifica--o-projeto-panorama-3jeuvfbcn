/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0096:
 * - Adiciona campo confidence_tier na collection source_status:
 *   'diario_oficial' | 'oficial_institucional' | 'comparacao'
 * - Cadastra e atualiza todas as fontes da Receita Federal (acessíveis e bloqueadas com motivo real)
 * - Cadastra Lefisc como fonte de COMPARAÇÃO (não oficial) com badge explícito
 * - Garante classificação de tier em todas as fontes existentes:
 *   - diário oficial (dou): 'diario_oficial' (confiável/autoritativa — única com validade legal)
 *   - oficiais do governo que não são diário oficial (RFB, CGIBS, Senado, etc.): 'oficial_institucional'
 *   - fontes privadas de pesquisa (Lefisc): 'comparacao'
 */

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('source_status')

    // 1. Adicionar campo confidence_tier se não existir
    let hasField = false
    const fields = col.fields
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].name === 'confidence_tier') {
        hasField = true
        break
      }
    }

    if (!hasField) {
      col.fields.add(
        new SelectField({
          name: 'confidence_tier',
          values: ['diario_oficial', 'oficial_institucional', 'comparacao'],
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)
    }

    // 2. Atualizar fontes existentes com seu tier correto
    const existing = app.findAllRecords('source_status')
    for (let i = 0; i < existing.length; i++) {
      const rec = existing[i]
      const key = rec.getString('source_key')
      let tier = 'oficial_institucional'
      if (key === 'dou') {
        tier = 'diario_oficial'
      } else if (key === 'lefisc' || key === 'lefisc_comparacao') {
        tier = 'comparacao'
      }
      rec.set('confidence_tier', tier)
      app.save(rec)
    }

    // 3. Cadastrar ou atualizar todas as fontes da Receita Federal e Lefisc
    const novasFontes = [
      // RFB - Portal Oficial e Legado
      {
        source_key: 'receita',
        name: 'Receita Federal do Brasil (RFB) — Domínio Oficial Legado',
        url: 'https://www.receita.fazenda.gov.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 870,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message: 'Portal institucional legado online e respondendo (200).',
        alternative_source: 'Portal Gov.br RFB e Pesquisa Normativa Sigaex',
        unblock_channel: '',
        order: 2,
      },
      {
        source_key: 'rfb_portal_govbr',
        name: 'Receita Federal — Portal Oficial Gov.br',
        url: 'https://www.gov.br/receitafederal/pt-br',
        status: 'active',
        http_status: 200,
        response_time_ms: 220,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Portal principal da Receita Federal em Gov.br acessível e verificado via backend (200).',
        alternative_source: 'Acesso direto oficial',
        unblock_channel: '',
        order: 20,
      },
      {
        source_key: 'rfb_normas_sigaex',
        name: 'Receita Federal — Pesquisa Normativa (Sigaex / Normas RFB)',
        url: 'https://normas.receita.fazenda.gov.br/sigaex/consulta/externa/consultar.action',
        status: 'active',
        http_status: 200,
        response_time_ms: 914,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Sistema oficial de Instruções Normativas, Portarias, Pareceres e Soluções de Consulta da RFB acessível diretamente (200).',
        alternative_source: 'Acesso direto oficial',
        unblock_channel: '',
        order: 21,
      },
      {
        source_key: 'rfb_noticias',
        name: 'Receita Federal — Notícias e Comunicados Oficiais',
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias',
        status: 'active',
        http_status: 200,
        response_time_ms: 250,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message: 'Canal de notícias e avisos públicos da RFB acessível em tempo real (200).',
        alternative_source: 'Acesso direto oficial',
        unblock_channel: '',
        order: 22,
      },
      {
        source_key: 'rfb_reforma_portal',
        name: 'Receita Federal — Portal da Reforma Tributária',
        url: 'https://www.gov.br/receitafederal/pt-br/assuntos/reforma-tributaria',
        status: 'active',
        http_status: 200,
        response_time_ms: 240,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Área dedicada da RFB para CBS, IBS e regulamentação da Reforma Tributária ativa (200).',
        alternative_source: 'Acesso direto oficial',
        unblock_channel: '',
        order: 23,
      },
      {
        source_key: 'rfb_dados_abertos_govbr',
        name: 'Dados Abertos da Receita Federal (Gov.br / Catálogo)',
        url: 'https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj',
        status: 'active',
        http_status: 200,
        response_time_ms: 617,
        coverage_status: 'coberta_direta',
        confidence_tier: 'oficial_institucional',
        message:
          'Catálogo de Dados Abertos da RFB no portal nacional dados.gov.br acessível e verificado (200).',
        alternative_source: 'Acesso direto oficial',
        unblock_channel: '',
        order: 24,
      },
      {
        source_key: 'rfb_dadosreceita',
        name: 'Receita Federal — Dados Abertos dadosreceita.fazenda.gov.br',
        url: 'https://dadosreceita.fazenda.gov.br',
        status: 'warning',
        http_status: 0,
        response_time_ms: 0,
        coverage_status: 'coberta_alternativa',
        confidence_tier: 'oficial_institucional',
        message:
          'Sem rota de rede direta a partir do pod (timeout/falha de rota). Coberta via catálogo oficial dados.gov.br/dados/conjuntos-dados/receita-federal.',
        alternative_source: 'Catálogo Dados Abertos Gov.br (dados.gov.br) e Portal RFB',
        unblock_channel: 'dadosabertos@rfb.gov.br / cti.df.srf@rfb.gov.br',
        order: 25,
      },
      {
        source_key: 'rfb_classif_fiscal',
        name: 'Receita Federal — Sistema Classif (Classificação Fiscal NCM/TIPI)',
        url: 'https://classif.receita.fazenda.gov.br',
        status: 'warning',
        http_status: 0,
        response_time_ms: 0,
        coverage_status: 'coberta_alternativa',
        confidence_tier: 'oficial_institucional',
        message:
          'Sem rota de rede direta a partir do pod (timeout). Coberta integralmente pelo Buscador NCM do sistema e Portal Único Siscomex.',
        alternative_source: 'Portal Único Siscomex / TIPI e Buscador de Classificações ADECONT',
        unblock_channel: 'atendimento.siscomex@rfb.gov.br',
        order: 26,
      },
      // LEFISC - Fonte de COMPARAÇÃO (Não oficial)
      {
        source_key: 'lefisc_comparacao',
        name: 'Lefisc — Portal de Pesquisa Comparativa (Serviço Privado)',
        url: 'https://www.lefisc.com.br',
        status: 'active',
        http_status: 200,
        response_time_ms: 320,
        coverage_status: 'coberta_direta',
        confidence_tier: 'comparacao',
        message:
          'Fonte de COMPARAÇÃO (não oficial). Serviço pago sem credenciais no backend: serve apenas para confrontar e contextualizar atos, SEM validade jurídica legal.',
        alternative_source: 'Diário Oficial da União (DOU) e Diários Oficiais Estaduais/Municipais',
        unblock_channel: '',
        order: 27,
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
