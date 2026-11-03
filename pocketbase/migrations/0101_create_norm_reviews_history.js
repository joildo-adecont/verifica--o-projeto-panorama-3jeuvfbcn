migrate(
  (app) => {
    // 1. Coleção norm_reviews_history (Histórico de Revisões de Normas)
    let historyCol = null
    try {
      historyCol = app.findCollectionByNameOrId('norm_reviews_history')
    } catch (_) {
      historyCol = null
    }

    if (!historyCol) {
      historyCol = new Collection({
        name: 'norm_reviews_history',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'norm_code', type: 'text', required: true },
          { name: 'norm_type', type: 'text', required: true },
          { name: 'norm_number', type: 'text' },
          { name: 'norm_year', type: 'text' },
          { name: 'norm_title', type: 'text' },
          { name: 'source_org', type: 'text', required: true },
          {
            name: 'confidence_tier',
            type: 'select',
            values: ['diario_oficial', 'oficial_institucional', 'comparacao'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'review_type',
            type: 'select',
            values: ['inclusao', 'alteracao', 'exclusao'],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'segment',
            type: 'select',
            values: ['Tributário', 'Jurídico', 'Contábil', 'Administrativo'],
            maxSelect: 1,
            required: true,
          },
          { name: 'review_date', type: 'text', required: true },
          { name: 'summary_change', type: 'text', required: true },
          { name: 'previous_version', type: 'text' },
          { name: 'current_version', type: 'text' },
          { name: 'origin_record_id', type: 'text' },
          { name: 'origin_collection', type: 'text' },
          {
            name: 'record_origin',
            type: 'select',
            values: ['rotina_semanal', 'manual', 'backfill_inicial'],
            maxSelect: 1,
            required: true,
          },
          { name: 'link_url', type: 'text' },
          { name: 'notes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nrh_date ON norm_reviews_history (review_date DESC)',
          'CREATE INDEX idx_nrh_code ON norm_reviews_history (norm_code)',
          'CREATE INDEX idx_nrh_segment ON norm_reviews_history (segment)',
          'CREATE INDEX idx_nrh_type ON norm_reviews_history (review_type)',
        ],
      })
      app.save(historyCol)
    }

    // 2. Backfill idempotente a partir das normas existentes em tax_norms
    // Popular histórico com as normas capturadas e alterações legislativas
    try {
      const existingTaxNorms = app.findRecordsByFilter('tax_norms', '', '-created', 100, 0)
      for (let i = 0; i < existingTaxNorms.length; i++) {
        const norm = existingTaxNorms[i]
        const code = norm.getString('code') || 'Norma'

        // Verifica se já existe registro de histórico para esta norma
        const jaExiste = app.findRecordsByFilter(
          'norm_reviews_history',
          'norm_code = {:c}',
          '',
          1,
          0,
          { c: code },
        )
        if (jaExiste.length > 0) continue

        const normType = norm.getString('norm_type') || 'Ato Normativo'
        const origin = norm.getString('origin') || 'Órgão Oficial'
        const title = norm.getString('title') || code
        const summary =
          norm.getString('summary') || 'Inclusão normativa no acervo do Panorama ADECONT.'
        const dateStr = norm.getString('date') || '2026-10-29'
        const linkUrl = norm.getString('link_url') || ''

        // Deduz segmento (maioria tributário/jurídico)
        let seg = 'Tributário'
        if (
          normType.toLowerCase().includes('lei') ||
          code.toLowerCase().includes('ec ') ||
          code.toLowerCase().includes('constitucional')
        ) {
          seg = 'Jurídico'
        } else if (code.toLowerCase().includes('cgsn') || code.toLowerCase().includes('simples')) {
          seg = 'Contábil'
        }

        // Deduz confidence tier
        let confTier = 'oficial_institucional'
        const origLow = origin.toLowerCase()
        if (
          origLow.includes('dou') ||
          origLow.includes('imprensa') ||
          origLow.includes('diário') ||
          origLow.includes('diario')
        ) {
          confTier = 'diario_oficial'
        } else if (origLow.includes('lefisc')) {
          confTier = 'comparacao'
        }

        // Extrai número e ano aproximados do código (ex: LC 238/2026 -> 238 e 2026)
        let numNorma = ''
        let anoNorma = '2026'
        const matchAno = code.match(/(\d{4})/)
        if (matchAno) anoNorma = matchAno[1]
        const matchNum = code.match(/n[ºo°\s]*(\d+[\.\d]*)/i) || code.match(/(\d+)\/\d{4}/)
        if (matchNum) numNorma = matchNum[1]

        // Identifica tipo de revisão: inclusão ou alteração
        let revType = 'inclusao'
        let prevVer = ''
        let currVer = summary
        if (
          summary.toLowerCase().includes('altera') ||
          title.toLowerCase().includes('alteração') ||
          title.toLowerCase().includes('altera')
        ) {
          revType = 'alteracao'
          prevVer = 'Versão anterior sem as alterações consolidadas pela nova norma.'
        }

        const histRec = new Record(historyCol)
        histRec.set('norm_code', code)
        histRec.set('norm_type', normType)
        histRec.set('norm_number', numNorma)
        histRec.set('norm_year', anoNorma)
        histRec.set('norm_title', title)
        histRec.set('source_org', origin)
        histRec.set('confidence_tier', confTier)
        histRec.set('review_type', revType)
        histRec.set('segment', seg)
        // Padroniza review_date em formato ISO ou YYYY-MM-DD
        let rDate = dateStr
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/')
          if (parts.length === 3) {
            rDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }
        histRec.set('review_date', rDate)
        histRec.set('summary_change', summary)
        histRec.set('previous_version', prevVer)
        histRec.set('current_version', currVer)
        histRec.set('origin_record_id', norm.id)
        histRec.set('origin_collection', 'tax_norms')
        histRec.set('record_origin', 'backfill_inicial')
        histRec.set('link_url', linkUrl)
        histRec.set(
          'notes',
          `Backfill automático idempotente da norma ${code} a partir de tax_norms`,
        )
        app.save(histRec)
      }
    } catch (backfillErr) {
      console.log('Erro no backfill inicial de norm_reviews_history: ' + String(backfillErr))
    }

    // 3. Semente de marcos legislativos chave de exclusão e alteração para demonstrar os 3 tipos
    try {
      const marcosExclusaoEAlteracao = [
        {
          norm_code: 'Revogação LC 123/2006 art. 13 §1º (Dispositivo Anterior)',
          norm_type: 'Exclusão Legislativa',
          norm_number: '123/2006',
          norm_year: '2026',
          norm_title: 'Exclusão de disposições incompatíveis com o IBS/CBS',
          source_org: 'Senado Federal / Congresso Nacional',
          confidence_tier: 'oficial_institucional',
          review_type: 'exclusao',
          segment: 'Jurídico',
          review_date: '2026-10-21',
          summary_change:
            'Exclusão e revogação expressa de tratamento cumulativo anterior em face do art. 343 da LC 214/2025 e LC 238/2026.',
          previous_version:
            'Regime de cumulatividade sem opção de transferência de créditos de IBS e CBS no Simples.',
          current_version:
            'Dispositivo revogado. Vigência do modelo híbrido de apropriação e transferência de créditos do Simples Nacional.',
          origin_record_id: '',
          origin_collection: '',
          record_origin: 'rotina_semanal',
          link_url: 'https://normas.leg.br',
          notes: 'Exclusão legislativa registrada pelo comitê diretivo ADECONT.',
        },
        {
          norm_code: 'Resolução CGIBS 6/2026 (RIBS) — Alteração art. 617',
          norm_type: 'Alteração Regulamentar',
          norm_number: '13/2026',
          norm_year: '2026',
          norm_title: 'Alteração pontual de prazos operacionais do RIBS',
          source_org: 'CGIBS (Comitê Gestor IBS)',
          confidence_tier: 'oficial_institucional',
          review_type: 'alteracao',
          segment: 'Tributário',
          review_date: '2026-10-28',
          summary_change:
            'Alteração dos prazos de integração de DFe e faseamento preparatório do IBS/CBS.',
          previous_version: 'Prazo original de adaptação de campos DFe fixado para data anterior.',
          current_version:
            'Prorrogação expressa do prazo de obrigatoriedade e harmonização com Ato Conjunto RFB/CGIBS.',
          origin_record_id: '',
          origin_collection: 'tax_norms',
          record_origin: 'rotina_semanal',
          link_url: 'https://www.cgibs.gov.br/',
          notes: 'Registro periódico da rotina semanal de segunda-feira.',
        },
      ]

      for (let m = 0; m < marcosExclusaoEAlteracao.length; m++) {
        const itemM = marcosExclusaoEAlteracao[m]
        const jaTem = app.findRecordsByFilter(
          'norm_reviews_history',
          'norm_code = {:c}',
          '',
          1,
          0,
          { c: itemM.norm_code },
        )
        if (jaTem.length === 0) {
          const r = new Record(historyCol)
          r.set('norm_code', itemM.norm_code)
          r.set('norm_type', itemM.norm_type)
          r.set('norm_number', itemM.norm_number)
          r.set('norm_year', itemM.norm_year)
          r.set('norm_title', itemM.norm_title)
          r.set('source_org', itemM.source_org)
          r.set('confidence_tier', itemM.confidence_tier)
          r.set('review_type', itemM.review_type)
          r.set('segment', itemM.segment)
          r.set('review_date', itemM.review_date)
          r.set('summary_change', itemM.summary_change)
          r.set('previous_version', itemM.previous_version)
          r.set('current_version', itemM.current_version)
          r.set('origin_record_id', itemM.origin_record_id)
          r.set('origin_collection', itemM.origin_collection)
          r.set('record_origin', itemM.record_origin)
          r.set('link_url', itemM.link_url)
          r.set('notes', itemM.notes)
          app.save(r)
        }
      }
    } catch (seedErr) {
      console.log('Erro ao gravar sementes adicionais em norm_reviews_history: ' + String(seedErr))
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('norm_reviews_history')
      app.delete(col)
    } catch (_) {}
  },
)
