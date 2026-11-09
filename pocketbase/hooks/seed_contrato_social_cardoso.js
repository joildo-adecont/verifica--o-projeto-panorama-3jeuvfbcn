/// <reference path="../pb_data/types.d.ts" />

/**
 * HOOK — seed de servidor do anexo do contrato social (CARDOSO & SIX LTDA)
 * =======================================================================
 * Cron de 5 em 5 minutos que garante o anexo do contrato social na ficha da
 * cliente CARDOSO & SIX LTDA (código 94109) SEM depender de alguém abrir a
 * tela de clientes (o seed do frontend em
 * src/services/seedAnexoContratoSocialCardoso.ts também existe, como redundância).
 *
 * Origem do binário: o PDF é publicado como asset estático na raiz do bundle
 * do frontend (/contrato-social-cardoso-e-six-d5830.pdf) — o backend roda em
 * outro host e não enxerga src/assets/ (lição da migration 0120). A URL base
 * vem da env SITE_URL (URL pública do app).
 *
 * IDEMPOTÊNCIA: se já existe registro em `cliente_arquivos` para o cliente
 * 94109 com o mesmo titulo, é no-op — nada duplica. Após o primeiro sucesso o
 * cron se auto-remove (cronRemove) para não rodar para sempre.
 *
 * NOTA JSVM: toda a lógica fica DENTRO do callback do cron — o pool de VMs do
 * PocketBase não enxerga declarações top-level de outros callbacks.
 */
cronAdd('seed_contrato_social_cardoso', '*/5 * * * *', () => {
  const CODIGO = 94109
  const TITULO = 'Contrato social - CARDOSO & SIX LTDA.pdf'
  const CRON_ID = 'seed_contrato_social_cardoso'

  // ── Idempotência: já existe o anexo deste arquivo para este cliente? ──
  let jaExiste = false
  try {
    $app.findFirstRecordByFilter('cliente_arquivos', 'cliente_codigo = {:c} && titulo = {:t}', {
      c: CODIGO,
      t: TITULO,
    })
    jaExiste = true
  } catch (_) {
    jaExiste = false
  }

  if (jaExiste) {
    try {
      cronRemove(CRON_ID)
    } catch (_) {}
    return
  }

  const siteUrl = String($os.getenv('SITE_URL') || '').replace(/\/+$/, '')
  if (!siteUrl) {
    console.log('[seed-contrato] SITE_URL não definida — anexo não gravado neste ciclo.')
    return
  }

  const url = siteUrl + '/contrato-social-cardoso-e-six-d5830.pdf'
  try {
    const res = $http.send({
      url: url,
      method: 'GET',
      headers: { Accept: 'application/pdf,*/*' },
      timeout: 30,
    })
    const status = res.statusCode || 0
    const bytes = res.body || res.raw
    if (status < 200 || status >= 300 || !bytes || bytes.length === 0) {
      console.log('[seed-contrato] Falha ao buscar o PDF em ' + url + ' (HTTP ' + status + ').')
      return
    }

    const rec = new Record($app.findCollectionByNameOrId('cliente_arquivos'))
    rec.set('cliente_cnpj', 'COD' + CODIGO)
    rec.set('cliente_codigo', CODIGO)
    rec.set('titulo', TITULO)
    rec.set('categoria', 'Contrato')
    rec.set('arquivo', $filesystem.fileFromBytes(bytes, TITULO))
    rec.set('nome_original', 'contrato-social-cardoso-e-six-d5830.pdf')
    rec.set('tamanho_bytes', bytes.length)
    rec.set('tipo_mime', 'application/pdf')
    rec.set('observacao', 'Contrato social registrado na JUCISRS nº 4848028 em 19/09/2018')
    rec.set('enviado_por', 'Seed contrato social (recepção de documento)')
    $app.save(rec)

    console.log(
      '[seed-contrato] Anexo "' +
        TITULO +
        '" gravado para o cliente ' +
        CODIGO +
        ' (' +
        bytes.length +
        ' bytes).',
    )

    try {
      cronRemove(CRON_ID)
    } catch (_) {}
  } catch (err) {
    console.log('[seed-contrato] Erro ao gravar o anexo: ' + String(err))
  }
})
