/// <reference path="../pb_data/types.d.ts" />
/**
 * AGENTE DE VIGILÂNCIA DAS FONTES — notificação por e-mail
 *
 * Endpoint: POST /backend/v1/agente-fontes/notificar
 * Header:   X-Painel-Token: <AGENTE_FONTES_TOKEN>
 *
 * DOIS MODOS DE MENSAGEM
 *
 *   modo: 'alerta'  — há fonte com assinatura divergente. Faixa vermelha, tom de
 *                     urgência, o que mudou e o que revisar. Exige ação.
 *
 *   modo: 'resumo'  — a vigilância rodou e está tudo igual. Faixa verde, tom de
 *                     prestação de contas: quantas fontes foram conferidas,
 *                     quando, e a confirmação de que nada mudou. Existe porque
 *                     silêncio não prova que o sistema funcionou — e um aviso que
 *                     nunca chega não se distingue de um sistema parado.
 *
 * REGRA DE OURO: este hook não decide o que mudou. Ele recebe a lista já apurada
 * pela varredura e apenas redige e envia. No modo alerta, lista vazia não vira
 * e-mail: alerta sem motivo ensina a ignorar o alerta.
 *
 * QUIRK do PocketBase JSVM: funções helper no topo do arquivo NÃO são acessíveis
 * dentro dos callbacks do router — por isso tudo é inline em cada handler.
 * O handler recebe (e), usa e.requestInfo().body e e.request.header.get().
 */

routerAdd('POST', '/backend/v1/agente-fontes/notificar', (e) => {
  // ── autenticação inline (mesmo padrão do painel do Simulador) ──
  var esperado = $secrets.get('AGENTE_FONTES_TOKEN') || ''
  if (!esperado) {
    return e.json(503, { ok: false, erro: 'AGENTE_FONTES_TOKEN não configurado' })
  }
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (recebido !== esperado) {
    return e.json(403, { ok: false, erro: 'token inválido' })
  }

  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  var mudancas = body.mudancas || []
  var fontes = body.fontes || []
  var execucao = body.execucao || ''
  var resumo = body.resumo || ''
  var destinatario = body.destinatario || 'joildo@adecont.com.br'
  // cópias vêm do cadastro (agente_config), não do corpo: quem manda no cadastro
  // manda no envio, e o chamador não pode acrescentar destinatário por conta
  // própria. O corpo pode sobrescrever só com 'destinatario'.
  var copias = []
  try {
    var cfgRec = $app.findRecordById('agente_config', 'config')
    destinatario = cfgRec.getString('destinatario_principal') || destinatario
    var arrCopias = cfgRec.get('destinatarios_copia')
    if (arrCopias && arrCopias.length) copias = arrCopias
  } catch (_) {}
  var forcar = body.forcar === true
  var modo = body.modo || (mudancas.length ? 'alerta' : 'resumo')

  // modo alerta sem mudança e sem forçar: não envia
  if (modo === 'alerta' && !mudancas.length && !forcar) {
    return e.json(200, { ok: true, enviado: false, motivo: 'nenhuma mudança — nada a notificar' })
  }

  var baseUrl = body.baseUrl || 'https://verificacao-projeto-panorama-18549.goskip.app'
  var alerta = modo === 'alerta' || mudancas.length > 0

  // ── blocos de impacto (modo alerta) ──
  var blocos = ''
  for (var i = 0; i < mudancas.length; i++) {
    var m = mudancas[i]
    var fonte = m.rotulo || m.fonte || 'fonte não identificada'
    var desc = m.descricao || m.detalhe || 'assinatura de conteúdo divergiu'

    var revisarHtml = ''
    var rev = m.revisar || []
    if (rev.length) {
      revisarHtml =
        '<p style="margin:8px 0 0;font-size:13px;color:#7a1f1f"><b>Revisar:</b> ' +
        rev.join(' · ') +
        '</p>'
    }

    var anexosHtml = ''
    var anx = m.anexos || []
    if (anx.length) {
      anexosHtml = '<ul style="margin:6px 0 0 18px;padding:0;font-size:13px;color:#334155">'
      for (var a = 0; a < anx.length && a < 12; a++) {
        var x = anx[a]
        anexosHtml +=
          '<li>' +
          (x.anexo || '') +
          ' — ' +
          (x.linhas || x.total || 0) +
          ' linhas' +
          (x.dispositivo ? ' (' + x.dispositivo + ')' : '') +
          '</li>'
      }
      if (anx.length > 12) {
        anexosHtml += '<li>… e mais ' + (anx.length - 12) + ' anexo(s)</li>'
      }
      anexosHtml += '</ul>'
    }

    blocos +=
      '<div style="border-left:4px solid #b91c1c;background:#fef2f2;padding:12px 14px;margin:0 0 12px;border-radius:0 6px 6px 0">' +
      '<p style="margin:0;font-size:15px;font-weight:bold;color:#7f1d1d">' +
      fonte +
      '</p>' +
      '<p style="margin:4px 0 0;font-size:13px;color:#7a1f1f">' +
      desc +
      '</p>' +
      revisarHtml +
      anexosHtml +
      '</div>'
  }

  // ── tabela de fontes conferidas (modo resumo) ──
  var tabelaFontes = ''
  if (!alerta && fontes.length) {
    var ativas = 0
    var linhas = ''
    for (var f = 0; f < fontes.length; f++) {
      var ft = fontes[f]
      var ok = ft.status === 'ok'
      if (ok) ativas++
      linhas +=
        '<tr>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px">' +
        (ok ? '✅' : '⚠️') +
        ' ' +
        (ft.rotulo || ft.id || '') +
        '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569">' +
        (ft.orgao || '') +
        '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;color:' +
        (ok ? '#166534' : '#b45309') +
        '">' +
        (ok ? 'sem alteração' : ft.status || 'verificar') +
        '</td>' +
        '</tr>'
    }
    tabelaFontes =
      '<table style="width:100%;border-collapse:collapse;margin:0 0 14px">' +
      '<thead><tr>' +
      '<th style="text-align:left;padding:6px 8px;border-bottom:2px solid #0b3142;font-size:11px;color:#0b3142;text-transform:uppercase">Fonte</th>' +
      '<th style="text-align:left;padding:6px 8px;border-bottom:2px solid #0b3142;font-size:11px;color:#0b3142;text-transform:uppercase">Órgão</th>' +
      '<th style="text-align:right;padding:6px 8px;border-bottom:2px solid #0b3142;font-size:11px;color:#0b3142;text-transform:uppercase">Resultado</th>' +
      '</tr></thead><tbody>' +
      linhas +
      '</tbody></table>' +
      '<p style="font-size:12px;color:#475569;margin:0 0 4px">' +
      ativas +
      ' de ' +
      fontes.length +
      ' fontes conferidas sem alteração nesta varredura.</p>'
  }

  var totalLinhas = 0
  for (var k = 0; k < mudancas.length; k++) {
    if (mudancas[k].linhas) totalLinhas += mudancas[k].linhas
  }

  var assunto
  if (alerta) {
    assunto =
      mudancas.length === 1
        ? '[ADECONT] Alerta de legislação: ' +
          (mudancas[0].rotulo || mudancas[0].fonte || 'fonte alterada')
        : '[ADECONT] Alerta de legislação: ' + mudancas.length + ' fontes com alteração'
  } else {
    assunto =
      '[ADECONT] Vigilância semanal: ' +
      (fontes.length || 'todas as') +
      ' fontes conferidas, nenhuma alteração'
  }

  var titulo = alerta ? '⚠ Alerta de alteração na legislação' : '✅ Vigilância semanal — nada mudou'
  var corTitulo = alerta ? '#7f1d1d' : '#14532d'
  var corFaixa = alerta ? '#b91c1c' : '#15803d'

  var abertura = alerta
    ? '<p style="font-size:14px">O Agente de Vigilância das Fontes detectou alteração em ' +
      mudancas.length +
      ' fonte(s) das quais a legislação da reforma tributária depende.' +
      (totalLinhas > 0
        ? ' Isso alcança <b>' + totalLinhas + ' linha(s)</b> de tabela do Panorama.'
        : '') +
      '</p>'
    : '<p style="font-size:14px">A vigilância semanal foi executada e <b>nenhuma das fontes de origem da legislação mudou</b>. Nada a fazer: este e-mail é a confirmação de que o sistema está de pé e conferiu as fontes.</p>'

  var html =
    '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1c2b3a">' +
    '<div style="background:#0b3142;padding:18px;text-align:center">' +
    '<img src="' +
    baseUrl +
    '/logo-adecont-branco.png" alt="ADECONT" style="max-height:52px">' +
    '</div>' +
    '<div style="height:4px;background:' +
    corFaixa +
    '"></div>' +
    '<div style="padding:22px;background:#fff;border:1px solid #dbe3ee">' +
    '<h2 style="color:' +
    corTitulo +
    ';margin-top:0">' +
    titulo +
    '</h2>' +
    abertura +
    '<div style="background:#f6f8fc;border:1px solid #dbe3ee;border-radius:8px;padding:10px 14px;margin:0 0 16px;font-size:13px;color:#475569">' +
    '<b>Varredura:</b> ' +
    (execucao || 'agora') +
    '<br><b>Resumo:</b> ' +
    (resumo || 'não informado') +
    '</div>' +
    blocos +
    tabelaFontes +
    '<p style="font-size:13px;margin-top:18px">' +
    (alerta
      ? 'O que fazer: abra o Monitor Legislativo, confira as seções indicadas e atualize o Panorama se a alteração valer. A varredura compara o hash do texto de cada fonte — uma divergência significa ato novo ou texto alterado, não erro de leitura.'
      : 'Como funciona: cada fonte guarda a assinatura de conteúdo (o hash do texto) da varredura anterior. Quando o hash muda, o aviso deixa de ser este resumo e passa a ser um alerta com as seções a revisar.') +
    '</p>' +
    '<p style="margin:20px 0 0;text-align:center">' +
    '<a href="' +
    baseUrl +
    '/#monitor-legislativo" style="background:#12315e;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Abrir o Monitor Legislativo</a>' +
    '</p>' +
    '</div>' +
    '<div style="padding:14px 22px 26px;background:#f6f8fc;border:1px solid #dbe3ee;border-top:none;text-align:center">' +
    '<p style="margin:0;font-size:11px;color:#8a97a8">ADECONT Assessoria Administrativa, Contábil · aviso automático do Agente de Vigilância das Fontes · toda quarta-feira, 11:00 · não responda</p>' +
    '</div></div>'

  // ── envia ──
  var enviado = false
  var erro = ''
  try {
    var mailer = $app.newMailClient()
    mailer.send(
      new MailerMessage({
        from: { address: 'nao-responda@adecont.com.br', name: 'ADECONT — Agente de Fontes' },
        to: (function () {
          var lista = [{ address: destinatario }]
          for (var cx = 0; cx < copias.length; cx++) {
            var em = (copias[cx].email || '').toLowerCase()
            if (!em || em === destinatario.toLowerCase()) continue
            lista.push({ address: copias[cx].email })
          }
          return lista
        })(),
        subject: assunto,
        html: html,
      }),
    )
    enviado = true
  } catch (sendErr) {
    erro = String(sendErr)
    console.log('[agente-fontes] falha ao enviar: ' + erro)
  }

  // ── registra no log de auditoria ──
  try {
    var col = $app.findCollectionByNameOrId('acesso_comandos')
    var rec = new Record(col)
    rec.set('comando', alerta ? 'ALERTA_FONTES' : 'RESUMO_FONTES')
    rec.set(
      'descricao',
      (alerta ? 'Aviso de alteração' : 'Resumo semanal') +
        ' enviado a ' +
        destinatario +
        ' (' +
        mudancas.length +
        ' mudança(s), ' +
        fontes.length +
        ' fonte(s), ' +
        (1 + copias.length) +
        ' destinatário(s))',
    )
    rec.set('nivel_minimo', '1')
    rec.set('ator_email', 'agente-fontes@sistema')
    rec.set('resultado', enviado ? 'ENVIADO' : 'FALHA')
    rec.set('detalhe', (enviado ? 'ok' : erro).slice(0, 900))
    $app.save(rec)
  } catch (logErr) {
    console.log('[agente-fontes] log falhou: ' + logErr)
  }

  return e.json(200, {
    ok: true,
    enviado: enviado,
    modo: alerta ? 'alerta' : 'resumo',
    destinatario: destinatario,
    copias: copias.length,
    erro: erro,
  })
})

/**
 * GET /backend/v1/agente-fontes/destinatarios
 * Devolve os destinatários atuais e os candidatos do cadastro.
 *
 * Candidatos vêm de duas fontes, cada um com a origem marcada:
 *   simul_clientes  — clientes cadastrados no Simulador (origem 'cliente')
 *   acesso_usuarios — usuários com acesso ao sistema (origem 'usuario')
 * Assim o e-mail escolhido é sempre o do cadastro, e quem sai do cadastro
 * desaparece da lista de candidatos naturalmente.
 */
routerAdd('GET', '/backend/v1/agente-fontes/destinatarios', (e) => {
  var esperado = $secrets.get('AGENTE_FONTES_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (esperado && recebido !== esperado) {
    return e.json(403, { ok: false, erro: 'token inválido' })
  }

  // config atual
  var principal = 'joildo@adecont.com.br'
  var copia = []
  var resumo = true
  try {
    var cfg = $app.findRecordById('agente_config', 'config')
    principal = cfg.getString('destinatario_principal') || principal
    var arr = cfg.get('destinatarios_copia')
    if (arr && arr.length) copia = arr
    resumo = cfg.getBool('enviar_resumo_semanal')
  } catch (_) {}

  // candidatos: clientes do Simulador
  var clientes = []
  try {
    var c1 = $app.findRecordsByFilter('simul_clientes', 'is_active = true', 'nome', 500, 0)
    for (var i = 0; i < c1.length; i++) {
      var r = c1[i]
      var em = r.getString('email')
      if (!em) continue
      clientes.push({
        email: em,
        nome: r.getString('nome') || em,
        empresa: r.getString('empresa') || '',
        origem: 'cliente',
      })
    }
  } catch (errCli) {
    console.log('[agente-fontes] clientes: ' + errCli)
  }

  // candidatos: usuários do sistema
  var usuarios = []
  try {
    var c2 = $app.findRecordsByFilter('acesso_usuarios', 'is_active = true', 'nome', 500, 0)
    for (var j = 0; j < c2.length; j++) {
      var u = c2[j]
      var eu = u.getString('email')
      if (!eu) continue
      usuarios.push({
        email: eu,
        nome: u.getString('nome') || eu,
        nivel: u.getString('nivel') || '',
        origem: 'usuario',
      })
    }
  } catch (errUsr) {
    console.log('[agente-fontes] usuarios: ' + errUsr)
  }

  return e.json(200, {
    ok: true,
    principal: principal,
    copia: copia,
    resumo_semanal: resumo,
    candidatos_clientes: clientes,
    candidatos_usuarios: usuarios,
  })
})

/**
 * POST /backend/v1/agente-fontes/destinatarios
 * Salva a lista de cópias. Body: { copia: [{email, nome, origem}], principal?, resumo_semanal? }
 *
 * Valida o e-mail contra o cadastro: só aceita cópia que exista em
 * simul_clientes ou em acesso_usuarios. Isso impede que um e-mail digitado por
 * engano passe a receber alertas internos do sistema.
 */
routerAdd('POST', '/backend/v1/agente-fontes/destinatarios', (e) => {
  var esperado = $secrets.get('AGENTE_FONTES_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (esperado && recebido !== esperado) {
    return e.json(403, { ok: false, erro: 'token inválido' })
  }

  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  var pedido = body.copia || []
  if (!Array.isArray(pedido)) pedido = []

  // monta o conjunto de e-mails válidos do cadastro
  var validos = {}
  try {
    var c1 = $app.findRecordsByFilter('simul_clientes', 'is_active = true', 'nome', 500, 0)
    for (var i = 0; i < c1.length; i++) {
      var em = (c1[i].getString('email') || '').toLowerCase()
      if (em) validos[em] = { nome: c1[i].getString('nome'), origem: 'cliente' }
    }
  } catch (_) {}
  try {
    var c2 = $app.findRecordsByFilter('acesso_usuarios', 'is_active = true', 'nome', 500, 0)
    for (var j = 0; j < c2.length; j++) {
      var eu = (c2[j].getString('email') || '').toLowerCase()
      if (eu && !validos[eu]) validos[eu] = { nome: c2[j].getString('nome'), origem: 'usuario' }
    }
  } catch (_) {}

  var aceitos = []
  var recusados = []
  for (var k = 0; k < pedido.length; k++) {
    var item = pedido[k] || {}
    var email = String(item.email || '').trim()
    var chave = email.toLowerCase()
    if (!chave) continue
    if (!validos[chave]) {
      recusados.push({ email: email, motivo: 'não consta no cadastro de clientes nem de usuários' })
      continue
    }
    // evita duplicidade
    var jaTem = false
    for (var a = 0; a < aceitos.length; a++) {
      if (aceitos[a].email.toLowerCase() === chave) {
        jaTem = true
        break
      }
    }
    if (jaTem) continue
    aceitos.push({
      email: email,
      nome: validos[chave].nome || email,
      origem: validos[chave].origem,
    })
  }

  // grava
  var principal = body.principal || 'joildo@adecont.com.br'
  var resumo = body.resumo_semanal
  try {
    var cfg = $app.findRecordById('agente_config', 'config')
    cfg.set('destinatarios_copia', aceitos)
    if (body.principal) cfg.set('destinatario_principal', principal)
    if (resumo === true || resumo === false) cfg.set('enviar_resumo_semanal', resumo)
    cfg.set('atualizado_por', body.ator || 'painel')
    $app.save(cfg)
  } catch (saveErr) {
    return e.json(500, { ok: false, erro: 'falha ao salvar: ' + saveErr })
  }

  // auditoria
  try {
    var col = $app.findCollectionByNameOrId('acesso_comandos')
    var rec = new Record(col)
    rec.set('comando', 'EDITAR')
    rec.set('descricao', 'Destinatários do agente: ' + aceitos.length + ' cópia(s)')
    rec.set('nivel_minimo', '4')
    rec.set('ator_email', body.ator || 'painel')
    rec.set('resultado', 'OK')
    rec.set('detalhe', JSON.stringify(aceitos).slice(0, 900))
    $app.save(rec)
  } catch (_) {}

  return e.json(200, { ok: true, aceitos: aceitos, recusados: recusados, principal: principal })
})

/**
 * GET /backend/v1/agente-fontes/status
 * Diz se o canal de e-mail está configurado, para o painel poder avisar antes
 * de alguém contar com uma notificação que não vai chegar.
 */
routerAdd('GET', '/backend/v1/agente-fontes/status', (e) => {
  var esperado = $secrets.get('AGENTE_FONTES_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (esperado && recebido !== esperado) {
    return e.json(403, { ok: false, erro: 'token inválido' })
  }
  return e.json(200, {
    ok: true,
    tokenConfigurado: !!esperado,
    destinatarioPadrao: 'joildo@adecont.com.br',
    modos: ['alerta', 'resumo'],
  })
})
