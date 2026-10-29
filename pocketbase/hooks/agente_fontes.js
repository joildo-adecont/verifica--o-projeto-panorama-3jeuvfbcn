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
        to: [{ address: destinatario }],
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
        ' fonte(s))',
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
    erro: erro,
  })
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
