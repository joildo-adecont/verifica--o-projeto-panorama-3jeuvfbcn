/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0098:
 * Registra e consolida a integração dos dados do Planalto (planalto.gov.br e lexml.gov.br / normas.leg.br)
 * na collection source_status como nível de confiança 'oficial_institucional'.
 * Idempotente: atualiza o registro 'planalto' existente ou cria se não existir.
 */

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('source_status')

    let rec = null
    try {
      rec = app.findFirstRecordByData('source_status', 'source_key', 'planalto')
    } catch (_) {
      rec = null
    }

    if (!rec) {
      rec = new Record(col)
      rec.set('source_key', 'planalto')
    }

    rec.set('name', 'Portal da Legislação (Planalto — Presidência da República)')
    rec.set('url', 'https://www.planalto.gov.br')
    rec.set('order', 6)
    rec.set('confidence_tier', 'oficial_institucional')
    rec.set('status', 'warning')
    rec.set('http_status', 200)
    rec.set('response_time_ms', 450)
    rec.set('coverage_status', 'coberta_alternativa')
    rec.set(
      'message',
      'Fonte primária das leis federais compiladas (planalto.gov.br). Acesso direto por robôs protegido por WAF da Presidência; cobertura em tempo real mantida ativa via proxy intermediado do backend, endpoints públicos de pesquisa LexML/normas.leg.br e base consolidada do Panorama.',
    )
    rec.set(
      'alternative_source',
      'Proxy intermediado ADECONT (/backend/v1/download-resolution), normas.leg.br, LexML e Senado Dados Abertos',
    )
    rec.set('unblock_channel', 'bloqueio.de.aplicacoes@presidencia.gov.br')
    rec.set('last_checked_at', new Date().toISOString())

    app.save(rec)
  },
  (app) => {
    // Reversão opcional
  },
)
