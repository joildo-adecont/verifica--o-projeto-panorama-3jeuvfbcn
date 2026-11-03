/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Criação da coleção norm_exclusions_history caso não exista
    let collection
    try {
      collection = app.findCollectionByNameOrId('norm_exclusions_history')
    } catch (_) {
      collection = null
    }

    if (!collection) {
      collection = new Collection({
        name: 'norm_exclusions_history',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          {
            name: 'norm_code',
            type: 'text',
            required: true,
          },
          {
            name: 'norm_type',
            type: 'text',
            required: true,
          },
          {
            name: 'norm_number',
            type: 'text',
          },
          {
            name: 'norm_year',
            type: 'text',
          },
          {
            name: 'norm_title',
            type: 'text',
            required: true,
          },
          {
            name: 'source_org',
            type: 'text',
            required: true,
          },
          {
            name: 'confidence_tier',
            type: 'select',
            required: true,
            values: ['diario_oficial', 'oficial_institucional', 'comparacao'],
            maxSelect: 1,
          },
          {
            name: 'segment',
            type: 'select',
            required: true,
            values: ['Tributário', 'Jurídico', 'Contábil', 'Administrativo'],
            maxSelect: 1,
          },
          {
            name: 'exclusion_date',
            type: 'text',
            required: true,
          },
          {
            name: 'system_exclusion_date',
            type: 'text',
          },
          {
            name: 'reason_description',
            type: 'text',
            required: true,
          },
          {
            name: 'revoked_article',
            type: 'text',
          },
          {
            name: 'previous_content',
            type: 'text',
          },
          {
            name: 'origin_record_id',
            type: 'text',
          },
          {
            name: 'origin_collection',
            type: 'text',
          },
          {
            name: 'review_history_id',
            type: 'text',
          },
          {
            name: 'record_origin',
            type: 'select',
            required: true,
            values: ['rotina_semanal', 'manual', 'backfill_inicial'],
            maxSelect: 1,
          },
          {
            name: 'link_url',
            type: 'text',
          },
          {
            name: 'notes',
            type: 'text',
          },
        ],
        indexes: [
          'CREATE INDEX idx_norm_exclusions_date ON norm_exclusions_history (exclusion_date DESC)',
          'CREATE INDEX idx_norm_exclusions_code ON norm_exclusions_history (norm_code)',
          'CREATE INDEX idx_norm_exclusions_segment ON norm_exclusions_history (segment)',
          'CREATE INDEX idx_norm_exclusions_source ON norm_exclusions_history (source_org)',
        ],
      })

      app.save(collection)
    }

    // 2. Backfill inicial idempotente: popular com os eventos de tipo "exclusão" já existentes em norm_reviews_history
    try {
      const reviewsColl = app.findCollectionByNameOrId('norm_reviews_history')
      const targetColl = app.findCollectionByNameOrId('norm_exclusions_history')

      if (reviewsColl && targetColl) {
        // Busca revisões do tipo 'exclusao'
        const exclusoes = app.findRecordsByFilter(
          'norm_reviews_history',
          "review_type = 'exclusao'",
          '-review_date',
          100,
          0
        )

        for (const rev of exclusoes) {
          const revId = rev.id
          const code = rev.get('norm_code') || ''

          // Verifica se já existe registro com mesmo review_history_id ou norm_code
          let jaExiste = false
          try {
            const existentes = app.findRecordsByFilter(
              'norm_exclusions_history',
              `review_history_id = '${revId}' || norm_code = '${code.replace(/'/g, "\\'")}'`,
              '',
              1,
              0
            )
            if (existentes && existentes.length > 0) {
              jaExiste = true
            }
          } catch (_) {
            jaExiste = false
          }

          if (!jaExiste) {
            const novo = new Record(targetColl)
            novo.set('norm_code', code)
            novo.set('norm_type', rev.get('norm_type') || 'Exclusão Legislativa')
            novo.set('norm_number', rev.get('norm_number') || '')
            novo.set('norm_year', rev.get('norm_year') || '2026')
            novo.set('norm_title', rev.get('norm_title') || code)
            novo.set('source_org', rev.get('source_org') || 'Órgão Oficial')
            novo.set('confidence_tier', rev.get('confidence_tier') || 'oficial_institucional')
            novo.set('segment', rev.get('segment') || 'Tributário')
            novo.set('exclusion_date', rev.get('review_date') || rev.getString('created').slice(0, 10))
            novo.set('system_exclusion_date', rev.getString('created').slice(0, 10))
            novo.set('reason_description', rev.get('summary_change') || 'Dispositivo revogado/excluído')
            novo.set('revoked_article', '')
            novo.set('previous_content', rev.get('previous_version') || '')
            novo.set('origin_record_id', rev.get('origin_record_id') || '')
            novo.set('origin_collection', rev.get('origin_collection') || 'tax_norms')
            novo.set('review_history_id', revId)
            novo.set('record_origin', rev.get('record_origin') || 'rotina_semanal')
            novo.set('link_url', rev.get('link_url') || '')
            novo.set('notes', rev.get('notes') || 'Backfill inicial de exclusões a partir do histórico de revisões')

            app.save(novo)
          }
        }
      }
    } catch (err) {
      console.log('Aviso no backfill de exclusões (não fatal): ' + err)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('norm_exclusions_history')
      if (collection) {
        app.delete(collection)
      }
    } catch (_) {
      // Ignora erro se não existir
    }
  }
)
