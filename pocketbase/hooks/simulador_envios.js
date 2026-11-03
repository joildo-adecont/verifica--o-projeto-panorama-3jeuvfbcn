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
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', 'SIMUL_' + operation)
      a.set('nivel_minimo', '1')
      a.set('ator_email', userId || 'sistema')
      a.set('resultado', 'OK')
      a.set('detalhe', JSON.stringify({ entity: entity, payload: payload }))
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit log: ' + err)
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
      if (c.observacoes !== undefined) existing.set('observacoes', c.observacoes || '')
      // campos de análise: só grava quando vierem preenchidos, para não apagar
      // o que já estava no cadastro numa atualização parcial
      if (c.regime_tributario) existing.set('regime_tributario', c.regime_tributario)
      if (c.atividade) existing.set('atividade', c.atividade)
      if (c.uf) existing.set('uf', String(c.uf).toUpperCase())
      // identificação completa + situação atual (migration 0072) — mesma regra:
      // só grava quando vier preenchido, para importação parcial não apagar
      if (c.tipo_pessoa) existing.set('tipo_pessoa', c.tipo_pessoa)
      if (c.razao_social) existing.set('razao_social', c.razao_social)
      if (c.nome_fantasia) existing.set('nome_fantasia', c.nome_fantasia)
      if (c.cep) existing.set('cep', c.cep)
      if (c.municipio) existing.set('municipio', c.municipio)
      if (c.cnae) existing.set('cnae', c.cnae)
      if (c.segmento) existing.set('segmento', c.segmento)
      if (c.telefone) existing.set('telefone', c.telefone)
      if (
        c.num_funcionarios !== undefined &&
        c.num_funcionarios !== null &&
        c.num_funcionarios !== ''
      ) {
        var nf = Number(c.num_funcionarios)
        if (isFinite(nf) && nf >= 0) existing.set('num_funcionarios', nf)
      }
      if (
        c.carga_atual_pct !== undefined &&
        c.carga_atual_pct !== null &&
        c.carga_atual_pct !== ''
      ) {
        var cap = Number(String(c.carga_atual_pct).replace(',', '.'))
        if (isFinite(cap) && cap >= 0 && cap <= 100) existing.set('carga_atual_pct', cap)
      }
      if (Array.isArray(c.tributos_atuais)) existing.set('tributos_atuais', c.tributos_atuais)
      /*
       * PERMISSÕES (migration 0107) — aqui a regra é o INVERSO das outras.
       * Os demais campos só gravam quando vêm preenchidos, para importação
       * parcial não apagar dado. Nas proibições isso seria um defeito grave:
       * desmarcar uma proibição no formulário NÃO a removeria do cadastro, e o
       * cliente continuaria bloqueado sem ninguém entender por quê. Por isso
       * os arrays de permissão SEMPRE são gravados quando presentes — inclusive
       * vazios, que é o "nada proibido".
       */
      if (c.acesso_situacao) existing.set('acesso_situacao', c.acesso_situacao)
      if (c.acesso_nivel) existing.set('acesso_nivel', c.acesso_nivel)
      if (Array.isArray(c.acesso_restricoes)) existing.set('acesso_restricoes', c.acesso_restricoes)
      if (Array.isArray(c.acesso_liberacoes)) existing.set('acesso_liberacoes', c.acesso_liberacoes)
      if (c.acesso_motivo !== undefined && c.acesso_motivo !== null)
        existing.set('acesso_motivo', String(c.acesso_motivo))
      if (c.acesso_autorizado_por !== undefined && c.acesso_autorizado_por !== null)
        existing.set('acesso_autorizado_por', String(c.acesso_autorizado_por))
      if (
        c.acesso_validade_dias !== undefined &&
        c.acesso_validade_dias !== null &&
        c.acesso_validade_dias !== ''
      ) {
        var avd = Number(c.acesso_validade_dias)
        if (isFinite(avd) && avd >= 0) {
          existing.set('acesso_validade_dias', avd)
          // materializa a data de expiração: o hook de acesso compara datas,
          // não fica recalculando dias a cada requisição
          if (avd > 0) {
            var exp = new Date()
            exp.setDate(exp.getDate() + avd)
            existing.set('acesso_expira_em', exp.toISOString().replace('T', ' ').slice(0, 19))
          }
        }
      }
      existing.set('acesso_atualizado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      if (c.receita_mensal !== undefined && c.receita_mensal !== null && c.receita_mensal !== '') {
        var rmUp = Number(String(c.receita_mensal).replace(/\./g, '').replace(',', '.'))
        if (isFinite(rmUp) && rmUp >= 0) existing.set('receita_mensal', rmUp)
      }
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
        if (c.regime_tributario) rec.set('regime_tributario', c.regime_tributario)
        if (c.atividade) rec.set('atividade', c.atividade)
        if (c.uf) rec.set('uf', String(c.uf).toUpperCase())
        if (c.tipo_pessoa) rec.set('tipo_pessoa', c.tipo_pessoa)
        if (c.razao_social) rec.set('razao_social', c.razao_social)
        if (c.nome_fantasia) rec.set('nome_fantasia', c.nome_fantasia)
        if (c.cep) rec.set('cep', c.cep)
        if (c.municipio) rec.set('municipio', c.municipio)
        if (c.cnae) rec.set('cnae', c.cnae)
        if (c.segmento) rec.set('segmento', c.segmento)
        if (c.telefone) rec.set('telefone', c.telefone)
        if (
          c.num_funcionarios !== undefined &&
          c.num_funcionarios !== null &&
          c.num_funcionarios !== ''
        ) {
          var nfN = Number(c.num_funcionarios)
          if (isFinite(nfN) && nfN >= 0) rec.set('num_funcionarios', nfN)
        }
        if (
          c.carga_atual_pct !== undefined &&
          c.carga_atual_pct !== null &&
          c.carga_atual_pct !== ''
        ) {
          var capN = Number(String(c.carga_atual_pct).replace(',', '.'))
          if (isFinite(capN) && capN >= 0 && capN <= 100) rec.set('carga_atual_pct', capN)
        }
        if (Array.isArray(c.tributos_atuais)) rec.set('tributos_atuais', c.tributos_atuais)
        // permissões (0107) — cadastro novo nasce com padrão seguro
        rec.set('acesso_situacao', c.acesso_situacao || 'liberado')
        rec.set('acesso_nivel', c.acesso_nivel || 'N3_confirmacao')
        if (Array.isArray(c.acesso_restricoes)) rec.set('acesso_restricoes', c.acesso_restricoes)
        if (Array.isArray(c.acesso_liberacoes)) rec.set('acesso_liberacoes', c.acesso_liberacoes)
        if (c.acesso_motivo) rec.set('acesso_motivo', String(c.acesso_motivo))
        if (c.acesso_autorizado_por)
          rec.set('acesso_autorizado_por', String(c.acesso_autorizado_por))
        rec.set('acesso_atualizado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
        if (
          c.receita_mensal !== undefined &&
          c.receita_mensal !== null &&
          c.receita_mensal !== ''
        ) {
          var rmNew = Number(String(c.receita_mensal).replace(/\./g, '').replace(',', '.'))
          if (isFinite(rmNew) && rmNew >= 0) rec.set('receita_mensal', rmNew)
        }
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
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', 'SIMUL_' + operation)
      a.set('nivel_minimo', '1')
      a.set('ator_email', userId || 'sistema')
      a.set('resultado', 'OK')
      a.set('detalhe', JSON.stringify({ entity: entity, payload: payload }))
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit log: ' + err)
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
  var clienteId = body.cliente_id || ''
  var resumo = body.tema_resumo || ''
  var capitulacao = body.capitulacao_legal || ''
  var grupo = body.grupo || 'regular'
  var itemCodigo = body.item_codigo || ''
  var itemNome = body.item_nome || ''
  var valorOperacao = Number(body.valor_operacao || 0)
  var regimeAdotado = body.regime_adotado || ''
  var anoSimulado = Number(body.ano_simulado || 0)
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
  var pulados = []
  var mailer = $app.newMailClient()
  var remetente = 'nao-responda@adecont.com.br'

  for (var i = 0; i < alvoIds.length; i++) {
    var cli
    try {
      cli = $app.findRecordById('simul_clientes', alvoIds[i])
    } catch (_) {
      continue
    }
    /*
     * PERMISSÕES DO CLIENTE (migration 0107) — envio de novo laudo.
     * `proibe_novos_envios` e `bloqueado` impedem o escritório de mandar simulação
     * para ESTE cliente. Isso protege o dado do cliente que pediu para não receber
     * mais, e evita que o "enviar para todos" mande e-mail a quem está suspenso.
     * O laço apenas PULA o cliente e segue — um bloqueado não derruba o envio em
     * massa para os outros.
     */
    var sitEnv = cli.getString('acesso_situacao') || 'liberado'
    var restEnv = cli.get('acesso_restricoes') || []
    if (sitEnv === 'bloqueado' || restEnv.indexOf('proibe_novos_envios') >= 0) {
      pulados.push({
        id: alvoIds[i],
        nome: cli.getString('nome'),
        motivo: sitEnv === 'bloqueado' ? 'acesso suspenso' : 'proibido receber novos envios',
      })
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
    if (valorOperacao > 0) rec.set('valor_operacao', valorOperacao)
    if (regimeAdotado) rec.set('regime_adotado', regimeAdotado)
    if (anoSimulado >= 2026 && anoSimulado <= 2033) rec.set('ano_simulado', anoSimulado)
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
  return e.json(200, {
    success: true,
    total: results.length,
    envios: results,
    // transparência: quem foi pulado por restrição, e por quê. Sem isto o
    // "enviar para todos" pareceria ter falhado com alguns clientes.
    pulados_por_restricao: pulados,
    total_pulados: pulados.length,
  })
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
  /*
   * PERMISSÕES DO CLIENTE — bloco de restrições do cadastro (migration 0107)
   *
   * ESTE É O PONTO ONDE A PERMISSÃO DEIXA DE SER ENFEITE.
   * O cliente entra com o token do laudo, sem login. Então a única forma de
   * negar acesso é aqui: procurar o cadastro do cliente dono do token e aplicar
   * o que o escritório marcou. Sem isto, marcar "bloqueado" na tela não fecharia
   * nada e o cliente continuaria abrindo o laudo.
   *
   * DECISÕES QUE IMPORTAM:
   *  - Cadastro ausente ou campo vazio = LIBERADO. Restringir exige ato
   *    explícito; o contrário derrubaria 500 clientes no dia da publicação.
   *  - "bloqueado" responde 403 com mensagem de negócio, não 404: o cliente
   *    precisa saber que existe e que foi suspenso, senão abre chamado.
   *  - Expiração só vale se o escritório marcou `proibe_apos_expirar`; sem essa
   *    marca, a data é informativa e não fecha acesso (evita bloqueio em massa
   *    por uma data esquecida no passado).
   */
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

  // ── aplica as restrições do cadastro ──
  var restricoes = []
  var liberacoes = []
  var situacao = 'liberado'
  var nivel = 'N3_confirmacao'
  if (cli) {
    situacao = cli.getString('acesso_situacao') || 'liberado'
    nivel = cli.getString('acesso_nivel') || 'N3_confirmacao'
    restricoes = cli.get('acesso_restricoes') || []
    liberacoes = cli.get('acesso_liberacoes') || []
  }

  if (situacao === 'bloqueado') {
    return e.json(403, {
      success: false,
      status: 403,
      error: 'ACESSO_SUSPENSO',
      message:
        'O acesso deste cliente ao sistema está suspenso. Fale com o escritório para regularizar.',
    })
  }

  // expiração: só fecha quando o escritório marcou a proibição correspondente
  if (restricoes.indexOf('proibe_apos_expirar') >= 0) {
    var expira = cli ? cli.getString('acesso_expira_em') : ''
    if (expira) {
      var quando = new Date(expira).getTime()
      if (isFinite(quando) && quando > 0 && Date.now() > quando) {
        return e.json(403, {
          success: false,
          status: 403,
          error: 'ACESSO_EXPIRADO',
          message:
            'O prazo de acesso deste cliente venceu. Fale com o escritório para renovar a liberação.',
        })
      }
    }
  }

  // monta o laudo aplicando as restrições de conteúdo
  var out = {
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
    // informativo: a tela mostra o que foi restringido, em vez de esconder
    restricoes_aplicadas: restricoes,
    nivel_acesso: nivel,
  }

  // proibe_capitulacao fecha a base legal — a liberação explícita vence
  if (
    restricoes.indexOf('proibe_capitulacao') >= 0 &&
    liberacoes.indexOf('libera_capitulacao') < 0
  ) {
    out.capitulacao = ''
    out.capitulacao_oculta = true
  }

  // proibe_valores fecha os valores tributários do laudo
  if (restricoes.indexOf('proibe_valores') >= 0 && liberacoes.indexOf('libera_valores') < 0) {
    out.payload = ''
    out.valores_ocultos = true
  }

  return e.json(200, out)
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
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', 'SIMUL_' + operation)
      a.set('nivel_minimo', '1')
      a.set('ator_email', userId || 'sistema')
      a.set('resultado', 'OK')
      a.set('detalhe', JSON.stringify({ entity: entity, payload: payload }))
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit log: ' + err)
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
  /*
   * PERMISSÕES DO CLIENTE (migration 0107) — confirmação de recebimento.
   * Se o escritório marcou `proibe_confirmar`, o cliente LÊ o laudo mas não
   * confirma. Bloqueio total (`bloqueado`) também impede confirmar: quem está
   * suspenso não movimenta o registro.
   * Confirmar duas vezes já era inofensivo (o if abaixo); o que se fecha aqui é
   * a movimentação por quem não tem mais liberação.
   */
  var cliConf = null
  try {
    cliConf = $app.findRecordById('simul_clientes', envio.getString('cliente'))
  } catch (_) {}
  if (cliConf) {
    var sitConf = cliConf.getString('acesso_situacao') || 'liberado'
    var restConf = cliConf.get('acesso_restricoes') || []
    if (sitConf === 'bloqueado') {
      return e.json(403, {
        success: false,
        error: 'ACESSO_SUSPENSO',
        message: 'Acesso suspenso. Fale com o escritório para regularizar.',
      })
    }
    if (restConf.indexOf('proibe_confirmar') >= 0) {
      return e.json(403, {
        success: false,
        error: 'CONFIRMACAO_NAO_PERMITIDA',
        message:
          'Este cliente não tem permissão para confirmar recebimento. O laudo continua disponível para leitura.',
      })
    }
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

// ---------- 0. Validação rápida de token do painel ----------
routerAdd('GET', '/backend/v1/simul-validar-token', (e) => {
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!recebido) {
    var qToken = e.requestInfo().query.token || ''
    if (qToken) recebido = qToken
  }
  var valido = Boolean(esperado && recebido && recebido === esperado)
  if (!valido && !(e.auth && e.auth.id)) {
    return e.json(401, {
      success: false,
      valido: false,
      message: 'Token inválido ou expirado — cole novamente.',
    })
  }
  return e.json(200, {
    success: true,
    valido: true,
    message: 'Token válido e autenticado com sucesso.',
  })
})

routerAdd('POST', '/backend/v1/simul-validar-token', (e) => {
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!recebido) {
    try {
      var body = e.requestInfo().body || {}
      if (body.token) recebido = String(body.token).trim()
    } catch (_) {}
  }
  var valido = Boolean(esperado && recebido && recebido === esperado)
  if (!valido && !(e.auth && e.auth.id)) {
    return e.json(401, {
      success: false,
      valido: false,
      message: 'Token inválido ou expirado — cole novamente.',
    })
  }
  return e.json(200, {
    success: true,
    valido: true,
    message: 'Token válido e autenticado com sucesso.',
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
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', 'SIMUL_' + operation)
      a.set('nivel_minimo', '1')
      a.set('ator_email', userId || 'sistema')
      a.set('resultado', 'OK')
      a.set('detalhe', JSON.stringify({ entity: entity, payload: payload }))
      $app.save(a)
    } catch (err) {
      console.log('[simul] audit log: ' + err)
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
