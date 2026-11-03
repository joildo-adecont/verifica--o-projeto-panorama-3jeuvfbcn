migrate(
  (app) => {
    // 1. Coleção norm_alerts (Alertas de Novas Revisões de Normas)
    let alertsCol = null
    try {
      alertsCol = app.findCollectionByNameOrId('norm_alerts')
    } catch (_) {
      alertsCol = null
    }

    if (!alertsCol) {
      alertsCol = new Collection({
        name: 'norm_alerts',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'review_id', type: 'text' },
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
          { name: 'origin_record_id', type: 'text' },
          {
            name: 'record_origin',
            type: 'select',
            values: ['rotina_semanal', 'manual', 'backfill_inicial'],
            maxSelect: 1,
            required: true,
          },
          { name: 'is_read', type: 'bool' },
          { name: 'link_url', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_norm_alerts_date ON norm_alerts (review_date DESC)',
          'CREATE INDEX idx_norm_alerts_code ON norm_alerts (norm_code)',
          'CREATE INDEX idx_norm_alerts_type ON norm_alerts (review_type)',
          'CREATE INDEX idx_norm_alerts_segment ON norm_alerts (segment)',
        ],
      })
      app.save(alertsCol)
    }

    // 2. Backfill idempotente a partir das revisões existentes em norm_reviews_history
    try {
      const existingReviews = app.findRecordsByFilter(
        'norm_reviews_history',
        '',
        '-review_date,-created',
        50,
        0,
      )

      for (let i = 0; i < existingReviews.length; i++) {
        const rev = existingReviews[i]
        const code = rev.getString('norm_code') || 'Norma'
        const rDate = rev.getString('review_date') || ''

        // Verifica se já existe alerta correspondente
        const jaExiste = app.findRecordsByFilter(
          'norm_alerts',
          'norm_code = {:c} && review_date = {:d}',
          '',
          1,
          0,
          { c: code, d: rDate },
        )
        if (jaExiste.length > 0) continue

        const alertRec = new Record(alertsCol)
        alertRec.set('review_id', rev.id)
        alertRec.set('norm_code', code)
        alertRec.set('norm_type', rev.getString('norm_type') || 'Ato Normativo')
        alertRec.set('norm_number', rev.getString('norm_number'))
        alertRec.set('norm_year', rev.getString('norm_year'))
        alertRec.set('norm_title', rev.getString('norm_title') || code)
        alertRec.set('source_org', rev.getString('source_org') || 'Órgão Oficial')
        alertRec.set('confidence_tier', rev.getString('confidence_tier') || 'oficial_institucional')
        alertRec.set('review_type', rev.getString('review_type') || 'inclusao')
        alertRec.set('segment', rev.getString('segment') || 'Tributário')
        alertRec.set('review_date', rDate)
        alertRec.set('summary_change', rev.getString('summary_change'))
        alertRec.set('origin_record_id', rev.getString('origin_record_id'))
        alertRec.set('record_origin', rev.getString('record_origin') || 'rotina_semanal')
        alertRec.set('is_read', false)
        alertRec.set('link_url', rev.getString('link_url'))
        app.save(alertRec)
      }
    } catch (backfillErr) {
      console.log('Erro no backfill inicial de norm_alerts: ' + String(backfillErr))
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('norm_alerts')
      app.delete(col)
    } catch (_) {}
  },
)
