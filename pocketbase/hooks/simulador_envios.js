// Hook do Simulador de Transicao: cadastro de clientes, envio com protocolo e confirmacao de recebimento
// Endpoints:
//  POST /backend/v1/simul-importar       -> importacao CSV de clientes [{nome,email,whatsapp,empresa,documento}]
//  POST /backend/v1/simul-enviar         -> envia simulacao p/ 1 cliente (gera protocolo + token) ou em massa (cliente_id = "TODOS")
//  GET  /backend/v1/simul-confirmar?token=... -> confirmacao de recebimento (link no e-mail) [publico]
//  GET  /backend/v1/simul-protocolo/:id  -> dados do envio p/ comprovante

// ---------- 1. Importacao CSV ----------
routerAdd('POST', '/backend/v1/simul-importar', (e) => {
  // --- validação de token do painel (inline) ---
  var painelTokenOk = (function () {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    return esperado && recebido && recebido === esperado
  })()
  if (!painelTokenOk && !(e.auth && e.auth.id)) {
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }

  // --- helpers inline (JSVM exige funções dentro do callback) ---
  function maskEmail(email) {
    if (!email || typeof email !== 'string') return ''
    var parts = email.split('@')
    if (parts.length !== 2) return '***'
    var name = parts[0]
    var visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1)
    return visible + '***@' + parts[1]
  }

  function genProtocolo() {
    var d = new Date()
    var y = d.getFullYear()
    var m = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    var rnd = ''
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (var i = 0; i < 6; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return 'SIM-' + y + m + day + '-' + rnd
  }

  function genToken() {
    var rnd = ''
    var chars = 'abcdef0123456789'
    for (var i = 0; i < 48; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return rnd
  }

  function audit(entity, operation, payload, userId) {
    try {
      var col = $app.findCollectionByNameOrId('audit_log')
      var a = new Record(col)
      a.set('entity', entity)
      a.set('operation', operation)
      a.set('payload', payload)
      if (userId) a.set('user', userId)
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit fail: ' + err)
    }
  }

  // Capitulacao legal por grupo de tributacao
  var CAPITULACAO = {
    regular: 'LC 214/2025 (arts. 124-127); RIBS - Res. CGIBS 6/2026; Decreto 12.955/2026 (CBS).',
    cesta_zero:
      'LC 214/2025, art. 149 e Anexo I (cesta básica); RIBS - Res. CGIBS 6/2026, Anexo correspondente; Decreto 12.955/2026, Anexo III.',
    zero: 'LC 214/2025, art. 147 (alíquota zero específica - saúde menstrual etc.).',
    reducao60:
      'LC 214/2025, arts. 128-130 (redução de 60% - saúde, educação, medicamentos e dispositivos de mobilidade).',
    dispositivos60:
      'LC 214/2025, Anexo IV (dispositivos médicos - redução 60%); RIBS - Res. CGIBS 6/2026.',
    imposto_seletivo:
      'LC 214/2025, Livro II (Imposto Seletivo); Decreto 12.955/2026, Anexo IV (bens selecionados).',
    zfm: 'RIBS - Res. CGIBS 6/2026, Anexo V e art. 521, §1º, IV (crédito presumido ZFM); EC 132/2023, art. 93.',
    suspensao: 'RIBS - Res. CGIBS 6/2026, art. 186, §5º e Anexo III (REPORTO - suspensão).',
    bens_capital: 'RIBS - Res. CGIBS 6/2026, arts. 196-197 e Anexo IV (bens de capital).',
    regime_especial:
      'LC 214/2025, arts. 204-205 (consórcios) e regime específico aplicável; RIBS - Res. CGIBS 6/2026, art. 397 (catering/bares e restaurantes).',
    agro: 'LC 214/2025, arts. 287 e seguintes (crédito presumido agropecuária); RIBS - Res. CGIBS 6/2026.',
  }

  function capitulacaoPara(grupo) {
    return CAPITULACAO[grupo] || CAPITULACAO.regular
  }

  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var clientes = body.clientes || []
  if (!Array.isArray(clientes) || clientes.length === 0) {
    return e.json(400, { success: false, error: 'Lista vazia' })
  }
  var col = $app.findCollectionByNameOrId('simul_clientes')
  var inseridos = 0,
    atualizados = 0,
    erros = []
  for (var i = 0; i < clientes.length && i < 2000; i++) {
    var c = clientes[i]
    if (!c.nome || !c.email) {
      erros.push({ linha: i + 2, erro: 'nome/email ausente' })
      continue
    }
    try {
      var existing = $app.findFirstRecordByFilter('simul_clientes', 'email = {:email}', {
        email: String(c.email).toLowerCase().trim(),
      })
      existing.set('nome', c.nome || existing.getString('nome'))
      existing.set('whatsapp', c.whatsapp || existing.getString('whatsapp'))
      existing.set('empresa', c.empresa || existing.getString('empresa'))
      existing.set('documento', c.documento || existing.getString('documento'))
      if (c.canal_preferido) existing.set('canal_preferido', c.canal_preferido)
      existing.set('is_active', true)
      $app.save(existing)
      atualizados++
    } catch (_) {
      try {
        var rec = new Record(col)
        rec.set('nome', c.nome)
        rec.set('email', String(c.email).toLowerCase().trim())
        rec.set('whatsapp', c.whatsapp || '')
        rec.set('empresa', c.empresa || '')
        rec.set('documento', c.documento || '')
        rec.set('canal_preferido', c.canal_preferido || 'email')
        rec.set('is_active', true)
        rec.set('observacoes', c.observacoes || '')
        $app.save(rec)
        inseridos++
      } catch (err2) {
        erros.push({ linha: i + 2, erro: String(err2) })
      }
    }
  }
  audit(
    'simul_clientes',
    'INSERT',
    {
      action: 'importacao_csv',
      inseridos: inseridos,
      atualizados: atualizados,
      erros: erros.length,
    },
    e.auth ? e.auth.id : '',
  )
  return e.json(200, {
    success: true,
    inseridos: inseridos,
    atualizados: atualizados,
    erros: erros,
  })
})

// ---------- 2. Envio com protocolo ----------
routerAdd('POST', '/backend/v1/simul-enviar', (e) => {
  // --- validação de token do painel (inline) ---
  var painelTokenOk = (function () {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    return esperado && recebido && recebido === esperado
  })()
  if (!painelTokenOk && !(e.auth && e.auth.id)) {
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }

  // --- helpers inline (JSVM exige funções dentro do callback) ---
  function maskEmail(email) {
    if (!email || typeof email !== 'string') return ''
    var parts = email.split('@')
    if (parts.length !== 2) return '***'
    var name = parts[0]
    var visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1)
    return visible + '***@' + parts[1]
  }

  function genProtocolo() {
    var d = new Date()
    var y = d.getFullYear()
    var m = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    var rnd = ''
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (var i = 0; i < 6; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return 'SIM-' + y + m + day + '-' + rnd
  }

  function genToken() {
    var rnd = ''
    var chars = 'abcdef0123456789'
    for (var i = 0; i < 48; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return rnd
  }

  function audit(entity, operation, payload, userId) {
    try {
      var col = $app.findCollectionByNameOrId('audit_log')
      var a = new Record(col)
      a.set('entity', entity)
      a.set('operation', operation)
      a.set('payload', payload)
      if (userId) a.set('user', userId)
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit fail: ' + err)
    }
  }

  // Capitulacao legal por grupo de tributacao
  var CAPITULACAO = {
    regular: 'LC 214/2025 (arts. 124-127); RIBS - Res. CGIBS 6/2026; Decreto 12.955/2026 (CBS).',
    cesta_zero:
      'LC 214/2025, art. 149 e Anexo I (cesta básica); RIBS - Res. CGIBS 6/2026, Anexo correspondente; Decreto 12.955/2026, Anexo III.',
    zero: 'LC 214/2025, art. 147 (alíquota zero específica - saúde menstrual etc.).',
    reducao60:
      'LC 214/2025, arts. 128-130 (redução de 60% - saúde, educação, medicamentos e dispositivos de mobilidade).',
    dispositivos60:
      'LC 214/2025, Anexo IV (dispositivos médicos - redução 60%); RIBS - Res. CGIBS 6/2026.',
    imposto_seletivo:
      'LC 214/2025, Livro II (Imposto Seletivo); Decreto 12.955/2026, Anexo IV (bens selecionados).',
    zfm: 'RIBS - Res. CGIBS 6/2026, Anexo V e art. 521, §1º, IV (crédito presumido ZFM); EC 132/2023, art. 93.',
    suspensao: 'RIBS - Res. CGIBS 6/2026, art. 186, §5º e Anexo III (REPORTO - suspensão).',
    bens_capital: 'RIBS - Res. CGIBS 6/2026, arts. 196-197 e Anexo IV (bens de capital).',
    regime_especial:
      'LC 214/2025, arts. 204-205 (consórcios) e regime específico aplicável; RIBS - Res. CGIBS 6/2026, art. 397 (catering/bares e restaurantes).',
    agro: 'LC 214/2025, arts. 287 e seguintes (crédito presumido agropecuária); RIBS - Res. CGIBS 6/2026.',
  }

  function capitulacaoPara(grupo) {
    return CAPITULACAO[grupo] || CAPITULACAO.regular
  }

  var CAPITULACAO = {
    regular: 'LC 214/2025 (arts. 124-127); RIBS - Res. CGIBS 6/2026; Decreto 12.955/2026 (CBS).',
    cesta_zero:
      'LC 214/2025, art. 149 e Anexo I (cesta básica); RIBS - Res. CGIBS 6/2026; Decreto 12.955/2026, Anexo III.',
    zero: 'LC 214/2025, art. 147 (alíquota zero específica).',
    reducao60: 'LC 214/2025, arts. 128-130 (redução de 60% - saúde, educação, medicamentos).',
    dispositivos60:
      'LC 214/2025, Anexo IV (dispositivos médicos - redução 60%); RIBS - Res. CGIBS 6/2026.',
    imposto_seletivo: 'LC 214/2025, Livro II (Imposto Seletivo); Decreto 12.955/2026, Anexo IV.',
    zfm: 'RIBS - Res. CGIBS 6/2026, Anexo V e art. 521, §1º, IV (crédito presumido ZFM); EC 132/2023, art. 93.',
    suspensao: 'RIBS - Res. CGIBS 6/2026, art. 186, §5º e Anexo III (REPORTO).',
    bens_capital: 'RIBS - Res. CGIBS 6/2026, arts. 196-197 e Anexo IV (bens de capital).',
    regime_especial:
      'LC 214/2025, arts. 204-205 (consórcios); RIBS - Res. CGIBS 6/2026, art. 397 (catering).',
    agro: 'LC 214/2025, arts. 287 e seguintes (crédito presumido agropecuária).',
  }
  function capitulacaoPara(grupo) {
    return CAPITULACAO[grupo] || CAPITULACAO[grupo]
  }

  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var clienteId = body.cliente_id || ''
  var resumo = body.tema_resumo || ''
  var capitulacao = body.capitulacao_legal || ''
  var grupo = body.grupo || 'regular'
  var itemCodigo = body.item_codigo || ''
  var itemNome = body.item_nome || ''
  var payloadSim = JSON.stringify(body.payload || {})

  if (!capitulacao) capitulacao = capitulacaoPara(grupo)

  var baseUrl = 'https://verificacao-projeto-panorama-18549.goskip.app'

  // envio em massa
  var alvoIds = []
  if (clienteId === 'TODOS') {
    var all = $app.findRecordsByFilter('simul_clientes', 'is_active = true', 'nome', 2000, 0)
    for (var a = 0; a < all.length; a++) alvoIds.push(all[a].id)
  } else {
    alvoIds.push(clienteId)
  }

  var envioCol = $app.findCollectionByNameOrId('simul_envios')
  var results = []
  var mailer = $app.newMailClient()
  var remetente = 'nao-responda@adecont.com.br'

  for (var i = 0; i < alvoIds.length; i++) {
    var cli
    try {
      cli = $app.findRecordById('simul_clientes', alvoIds[i])
    } catch (_) {
      continue
    }
    var email = cli.getString('email')
    var nome = cli.getString('nome')
    var protocolo = genProtocolo()
    var token = genToken()

    var tema =
      resumo ||
      'Simulação de Transição Tributária (IBS/CBS)' +
        (itemNome ? ' — ' + itemNome : '') +
        (itemCodigo ? ' (' + itemCodigo + ')' : '')

    var msg =
      '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1c2b3a">' +
      '<div style="background:#0b3142;padding:18px;text-align:center"><img src="' +
      baseUrl +
      '/logo-adecont-branco.png" alt="ADECONT" style="max-height:52px"></div>' +
      '<div style="padding:22px;background:#fff;border:1px solid #dbe3ee">' +
      '<h2 style="color:#0b3142;margin-top:0">Simulação de Transição Tributária — Protocolo ' +
      protocolo +
      '</h2>' +
      '<p>Prezado(a) <b>' +
      nome +
      '</b>,</p>' +
      '<p>A ADECONT encaminha simulação comparativa entre o <b>regime tributário atual</b> e o <b>novo regime IBS/CBS</b> (Emenda Constitucional 132/2023 e Lei Complementar 214/2025).</p>' +
      '<div style="background:#f6f8fc;border:1px solid #dbe3ee;border-radius:8px;padding:14px;margin:14px 0">' +
      '<p style="margin:0 0 6px"><b>Tema:</b> ' +
      tema +
      '</p>' +
      '<p style="margin:0"><b>Base legal:</b> ' +
      capitulacao +
      '</p>' +
      '</div>' +
      (payloadSim && payloadSim.length > 4
        ? '<pre style="background:#f0f3f8;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap">' +
          payloadSim.replace(/[<>&]/g, '').slice(0, 3000) +
          '</pre>'
        : '') +
      '<p style="font-size:12px;color:#5b6b7b">Simulação didática, sem valor fiscal. Não substitui assessoria tributária específica.</p>' +
      '</div>' +
      '<div style="padding:14px 22px 26px;background:#f6f8fc;border:1px solid #dbe3ee;border-top:none;text-align:center">' +
      '<p style="margin:0 0 10px;font-size:13px"><a href="' +
      baseUrl +
      '/panorama-reforma/relatorio.html?token=' +
      token +
      '" style="background:#12315e;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-bottom:10px">📄 Abrir relatório completo (salvar em PDF)</a></p>' +
      '<p style="margin:0 0 10px;font-size:13px">Confirme o recebimento para registro no protocolo:</p>' +
      '<a href="' +
      baseUrl +
      '/panorama-reforma/recebido.html?token=' +
      token +
      '" style="background:#1e7a1e;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:bold">✔ Confirmar recebimento</a>' +
      '<p style="margin:10px 0 0;font-size:11px;color:#8a97a8">ADECONT Assessoria Administrativa, Contábil • mensagem automática, não responda</p>' +
      '</div></div>'

    var emailOk = false
    try {
      mailer.send(
        new MailerMessage({
          from: { address: remetente, name: 'ADECONT Assessoria' },
          to: [{ address: email }],
          subject: '[ADECONT] Simulação de Transição Tributária — Protocolo ' + protocolo,
          html: msg,
        }),
      )
      emailOk = true
    } catch (mailErr) {
      console.log('[simul] mail fail ' + email + ': ' + mailErr)
    }

    var rec = new Record(envioCol)
    rec.set('cliente', cli.id)
    rec.set('protocolo', protocolo)
    rec.set('canal', 'email')
    rec.set('status', emailOk ? 'ENVIADO' : 'FALHA')
    rec.set('tema_resumo', tema)
    rec.set('capitulacao_legal', capitulacao)
    rec.set('payload_simulacao', payloadSim)
    rec.set('item_codigo', itemCodigo)
    rec.set('item_nome', itemNome)
    rec.set('token_recebimento', token)
    rec.set('destinatario_email', email)
    rec.set('email_ok', emailOk)
    $app.save(rec)

    results.push({
      protocolo: protocolo,
      cliente: nome,
      email_masked: maskEmail(email),
      status: emailOk ? 'ENVIADO' : 'FALHA',
    })
  }

  audit(
    'simul_envios',
    'INSERT',
    {
      action: 'envio_simulacao',
      total: results.length,
      enviados: results.filter(function (r) {
        return r.status === 'ENVIADO'
      }).length,
    },
    e.auth ? e.auth.id : '',
  )
  return e.json(200, { success: true, total: results.length, envios: results })
})

// ---------- 2c. Relatorio consolidado (painel, agrupado por cliente) ----------
routerAdd('GET', '/backend/v1/simul-consolidado', (e) => {
  var painelTokenOk = (function () {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    return esperado && recebido && recebido === esperado
  })()
  if (!painelTokenOk && !(e.auth && e.auth.id)) {
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  var envios = $app.findRecordsByFilter('simul_envios', 'protocolo != ""', '-enviado_em', 2000, 0)
  var porCliente = {}
  var ordem = []
  var total = 0
  var enviados = 0
  var recebidos = 0
  for (var i = 0; i < envios.length; i++) {
    var v = envios[i]
    var cliId = v.getString('cliente')
    var nome = ''
    var empresa = ''
    var email = ''
    try {
      var cli = $app.findRecordById('simul_clientes', cliId)
      nome = cli.getString('nome')
      empresa = cli.getString('empresa')
      email = cli.getString('email')
    } catch (_) {
      nome = '(cliente removido)'
    }
    if (!porCliente[cliId]) {
      porCliente[cliId] = { nome: nome, empresa: empresa, email: email, envios: [] }
      ordem.push(cliId)
    }
    var st = v.getString('status')
    var rec = v.getString('recebido_em') || ''
    if (st === 'ENVIADO') enviados++
    if (rec) recebidos++
    porCliente[cliId].envios.push({
      protocolo: v.getString('protocolo'),
      tema: v.getString('tema_resumo'),
      item_codigo: v.getString('item_codigo'),
      item_nome: v.getString('item_nome'),
      status: st,
      enviado_em: v.get('enviado_em'),
      recebido_em: rec,
      capitulacao: v.getString('capitulacao_legal'),
    })
    total++
  }
  var clientes = ordem.map(function (id) {
    var g = porCliente[id]
    return {
      nome: g.nome,
      empresa: g.empresa,
      email: g.email,
      envios: g.envios,
      total: g.envios.length,
    }
  })
  clientes.sort(function (a, b) {
    return a.nome.localeCompare(b.nome)
  })
  return e.json(200, {
    total_envios: total,
    enviados: enviados,
    recebidos: recebidos,
    clientes: clientes,
    gerado_em: new Date().toISOString(),
  })
})

// ---------- 2b. Relatorio publico por token ----------
routerAdd('GET', '/backend/v1/simul-relatorio', (e) => {
  var token = e.requestInfo().query.token || ''
  if (!token) return e.json(400, { success: false, error: 'token ausente' })
  var envio
  try {
    envio = $app.findFirstRecordByFilter('simul_envios', 'token_recebimento = {:t}', { t: token })
  } catch (_) {
    return e.json(404, { success: false, error: 'não encontrado' })
  }
  var cli
  var nome = ''
  var empresa = ''
  var email = ''
  try {
    cli = $app.findRecordById('simul_clientes', envio.getString('cliente'))
    nome = cli.getString('nome')
    empresa = cli.getString('empresa')
    email = cli.getString('email')
  } catch (_) {}
  return e.json(200, {
    protocolo: envio.getString('protocolo'),
    status: envio.getString('status'),
    tema: envio.getString('tema_resumo'),
    capitulacao: envio.getString('capitulacao_legal'),
    payload: envio.getString('payload_simulacao'),
    item_codigo: envio.getString('item_codigo'),
    item_nome: envio.getString('item_nome'),
    enviado_em: envio.get('enviado_em'),
    recebido_em: envio.get('recebido_em'),
    cliente: nome,
    empresa: empresa,
    email: email,
  })
})

// ---------- 3. Confirmacao de recebimento (publico) ----------
routerAdd('GET', '/backend/v1/simul-confirmar', (e) => {
  // --- helpers inline (JSVM exige funções dentro do callback) ---
  function maskEmail(email) {
    if (!email || typeof email !== 'string') return ''
    var parts = email.split('@')
    if (parts.length !== 2) return '***'
    var name = parts[0]
    var visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1)
    return visible + '***@' + parts[1]
  }

  function genProtocolo() {
    var d = new Date()
    var y = d.getFullYear()
    var m = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    var rnd = ''
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (var i = 0; i < 6; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return 'SIM-' + y + m + day + '-' + rnd
  }

  function genToken() {
    var rnd = ''
    var chars = 'abcdef0123456789'
    for (var i = 0; i < 48; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return rnd
  }

  function audit(entity, operation, payload, userId) {
    try {
      var col = $app.findCollectionByNameOrId('audit_log')
      var a = new Record(col)
      a.set('entity', entity)
      a.set('operation', operation)
      a.set('payload', payload)
      if (userId) a.set('user', userId)
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit fail: ' + err)
    }
  }

  // Capitulacao legal por grupo de tributacao
  var CAPITULACAO = {
    regular: 'LC 214/2025 (arts. 124-127); RIBS - Res. CGIBS 6/2026; Decreto 12.955/2026 (CBS).',
    cesta_zero:
      'LC 214/2025, art. 149 e Anexo I (cesta básica); RIBS - Res. CGIBS 6/2026, Anexo correspondente; Decreto 12.955/2026, Anexo III.',
    zero: 'LC 214/2025, art. 147 (alíquota zero específica - saúde menstrual etc.).',
    reducao60:
      'LC 214/2025, arts. 128-130 (redução de 60% - saúde, educação, medicamentos e dispositivos de mobilidade).',
    dispositivos60:
      'LC 214/2025, Anexo IV (dispositivos médicos - redução 60%); RIBS - Res. CGIBS 6/2026.',
    imposto_seletivo:
      'LC 214/2025, Livro II (Imposto Seletivo); Decreto 12.955/2026, Anexo IV (bens selecionados).',
    zfm: 'RIBS - Res. CGIBS 6/2026, Anexo V e art. 521, §1º, IV (crédito presumido ZFM); EC 132/2023, art. 93.',
    suspensao: 'RIBS - Res. CGIBS 6/2026, art. 186, §5º e Anexo III (REPORTO - suspensão).',
    bens_capital: 'RIBS - Res. CGIBS 6/2026, arts. 196-197 e Anexo IV (bens de capital).',
    regime_especial:
      'LC 214/2025, arts. 204-205 (consórcios) e regime específico aplicável; RIBS - Res. CGIBS 6/2026, art. 397 (catering/bares e restaurantes).',
    agro: 'LC 214/2025, arts. 287 e seguintes (crédito presumido agropecuária); RIBS - Res. CGIBS 6/2026.',
  }

  function capitulacaoPara(grupo) {
    return CAPITULACAO[grupo] || CAPITULACAO.regular
  }

  var token = e.requestInfo().query.token || ''
  if (!token) return e.json(400, { success: false, error: 'token ausente' })
  var envio
  try {
    envio = $app.findFirstRecordByFilter('simul_envios', 'token_recebimento = {:t}', { t: token })
  } catch (_) {
    return e.json(404, { success: false, error: 'protocolo não encontrado' })
  }
  if (envio.getString('status') !== 'RECEBIDO') {
    envio.set('status', 'RECEBIDO')
    envio.set('recebido_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(envio)
    audit(
      'simul_envios',
      'UPDATE',
      { action: 'confirmacao_recebimento', protocolo: envio.getString('protocolo') },
      '',
    )
  }
  return e.json(200, {
    success: true,
    protocolo: envio.getString('protocolo'),
    tema: envio.getString('tema_resumo'),
    recebido_em: envio.getString('recebido_em'),
  })
})

// ---------- 4. Consulta de protocolo (autenticado) ----------
routerAdd('GET', '/backend/v1/simul-protocolo', (e) => {
  // --- validação de token do painel (inline) ---
  var painelTokenOk = (function () {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    return esperado && recebido && recebido === esperado
  })()
  if (!painelTokenOk && !(e.auth && e.auth.id)) {
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }

  // --- helpers inline (JSVM exige funções dentro do callback) ---
  function maskEmail(email) {
    if (!email || typeof email !== 'string') return ''
    var parts = email.split('@')
    if (parts.length !== 2) return '***'
    var name = parts[0]
    var visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1)
    return visible + '***@' + parts[1]
  }

  function genProtocolo() {
    var d = new Date()
    var y = d.getFullYear()
    var m = String(d.getMonth() + 1).padStart(2, '0')
    var day = String(d.getDate()).padStart(2, '0')
    var rnd = ''
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    for (var i = 0; i < 6; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return 'SIM-' + y + m + day + '-' + rnd
  }

  function genToken() {
    var rnd = ''
    var chars = 'abcdef0123456789'
    for (var i = 0; i < 48; i++) rnd += chars[Math.floor(Math.random() * chars.length)]
    return rnd
  }

  function audit(entity, operation, payload, userId) {
    try {
      var col = $app.findCollectionByNameOrId('audit_log')
      var a = new Record(col)
      a.set('entity', entity)
      a.set('operation', operation)
      a.set('payload', payload)
      if (userId) a.set('user', userId)
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit fail: ' + err)
    }
  }

  // Capitulacao legal por grupo de tributacao
  var CAPITULACAO = {
    regular: 'LC 214/2025 (arts. 124-127); RIBS - Res. CGIBS 6/2026; Decreto 12.955/2026 (CBS).',
    cesta_zero:
      'LC 214/2025, art. 149 e Anexo I (cesta básica); RIBS - Res. CGIBS 6/2026, Anexo correspondente; Decreto 12.955/2026, Anexo III.',
    zero: 'LC 214/2025, art. 147 (alíquota zero específica - saúde menstrual etc.).',
    reducao60:
      'LC 214/2025, arts. 128-130 (redução de 60% - saúde, educação, medicamentos e dispositivos de mobilidade).',
    dispositivos60:
      'LC 214/2025, Anexo IV (dispositivos médicos - redução 60%); RIBS - Res. CGIBS 6/2026.',
    imposto_seletivo:
      'LC 214/2025, Livro II (Imposto Seletivo); Decreto 12.955/2026, Anexo IV (bens selecionados).',
    zfm: 'RIBS - Res. CGIBS 6/2026, Anexo V e art. 521, §1º, IV (crédito presumido ZFM); EC 132/2023, art. 93.',
    suspensao: 'RIBS - Res. CGIBS 6/2026, art. 186, §5º e Anexo III (REPORTO - suspensão).',
    bens_capital: 'RIBS - Res. CGIBS 6/2026, arts. 196-197 e Anexo IV (bens de capital).',
    regime_especial:
      'LC 214/2025, arts. 204-205 (consórcios) e regime específico aplicável; RIBS - Res. CGIBS 6/2026, art. 397 (catering/bares e restaurantes).',
    agro: 'LC 214/2025, arts. 287 e seguintes (crédito presumido agropecuária); RIBS - Res. CGIBS 6/2026.',
  }

  function capitulacaoPara(grupo) {
    return CAPITULACAO[grupo] || CAPITULACAO.regular
  }

  var proto = e.requestInfo().query.protocolo || ''
  var envio
  try {
    envio = $app.findFirstRecordByFilter('simul_envios', 'protocolo = {:p}', { p: proto })
  } catch (_) {
    return e.json(404, { success: false, error: 'não encontrado' })
  }
  return e.json(200, {
    protocolo: envio.getString('protocolo'),
    status: envio.getString('status'),
    tema: envio.getString('tema_resumo'),
    capitulacao: envio.getString('capitulacao_legal'),
    enviado_em: envio.get('enviado_em'),
    recebido_em: envio.get('recebido_em'),
  })
})
