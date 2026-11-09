/**
 * MIGRATION 0156 — Semente do cliente de teste "CARDOSO & SIX LTDA"
 * =================================================================
 * Recepção de documento nas Análises Empresariais: o usuário anexou o contrato
 * social registrado na JUCISRS (nº 4848028, 19/09/2018) e pediu que o cliente
 * exista no cadastro para as futuras análises.
 *
 * ── O QUE A MIGRATION FAZ ──
 * Cria o cliente na coleção `cadastro_empresas` APENAS com os dados legíveis
 * na certificação da JUCISRS: razão social, NIRE (inscricao_junta_comercial),
 * UF = RS e data de registro. CNPJ/CPF NÃO são inventados (o texto extraído do
 * PDF não os traz) — o campo fica vazio para o usuário preencher na ficha.
 *
 * ── IDEMPOTÊNCIA ──
 * Procura primeiro pelo NIRE / pela razão social; se o registro já existe,
 * não faz nada (no-op). O código do contribuinte (índice único da coleção)
 * começa em 94109 (acima do maior código vivo atual, 94108 — FMF) e avança
 * caso esteja ocupado, sem nunca reutilizar código de terceiro.
 *
 * O PDF do contrato social NÃO é anexado aqui (arquivo binário não entra em
 * migration): ele é anexado à ficha pela nova tela de Recepção de Documento
 * em /analises-empresariais, que grava na coleção `cliente_arquivos`.
 */
migrate(
  (app) => {
    // Já existe? (roda de novo sem duplicar)
    let existente = null
    try {
      existente = app.findFirstRecordByFilter(
        'cadastro_empresas',
        "inscricao_junta_comercial ~ '43206788148' || (razao_social ~ 'CARDOSO' && razao_social ~ 'SIX')",
        {},
      )
    } catch (_) {
      existente = null
    }
    if (existente) {
      console.log('[0156] Cliente CARDOSO & SIX LTDA já existe — nada a fazer.')
      return
    }

    // Reserva um código livre a partir de 94109
    let codigo = 94109
    for (let i = 0; i < 50; i++) {
      let ocupado = null
      try {
        ocupado = app.findFirstRecordByFilter('cadastro_empresas', 'codigo = {:c}', { c: codigo })
      } catch (_) {
        ocupado = null
      }
      if (!ocupado) break
      codigo++
    }

    const col = app.findCollectionByNameOrId('cadastro_empresas')
    const rec = new Record(col)
    rec.set('codigo', codigo)
    rec.set('razao_social', 'CARDOSO & SIX LTDA')
    rec.set('nome', 'CARDOSO & SIX LTDA')
    rec.set('apelido', 'CARDOSO & SIX')
    rec.set('tipo_documento', '')
    rec.set('numero_documento', '')
    rec.set('documento_limpo', '')
    rec.set('situacao', 'Ativa')
    rec.set('natureza_juridica', 'Sociedade Empresária Limitada')
    rec.set('pais', 'BRASIL')
    rec.set('uf', 'RS')
    rec.set('cliente_desde', '19/09/2018')
    rec.set('data_inscricao', '19/09/2018')
    rec.set('inicio_atividades', '')
    rec.set(
      'inscricao_junta_comercial',
      'NIRE 43206788148 — Registro JUCISRS nº 4848028 em 19/09/2018',
    )
    rec.set('regime_tributario', '')
    rec.set('arquivado', false)
    app.save(rec)
    console.log('[0156] Cliente CARDOSO & SIX LTDA criado com código ' + codigo + '.')
  },
  (app) => {
    // Rollback: remove apenas a semente desta migration (pelo NIRE)
    try {
      const rec = app.findFirstRecordByFilter(
        'cadastro_empresas',
        "inscricao_junta_comercial ~ '43206788148'",
        {},
      )
      app.delete(rec)
    } catch (_) {}
  },
)
