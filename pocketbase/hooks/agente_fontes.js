/// <reference path="../pb_data/types.d.ts" />
/**
 * AGENTE DE VIGILÂNCIA DAS FONTES — notificação por e-mail
 *
 * Endpoint: POST /backend/v1/agente-fontes/notificar
 * Header:   X-Painel-Token: <AGENTE_FONTES_TOKEN>
 *
 * Recebe o estado da varredura (as fontes que mudaram) e envia o aviso para o
 * e-mail do diretor. É chamado pela rotina semanal, depois de regenerar
 * agenteFontes.ts, quando há pelo menos uma fonte com assinatura divergente.
 *
 * REGRA DE OURO: este hook não decide o que mudou. Ele recebe a lista de
 * mudanças já apurada pela varredura e apenas notifica. Se a lista vier vazia,
 * não envia nada — alerta inventado destrói a confiança no alerta verdadeiro.
 *
 * QUIRK do PocketBase JSVM: funções helper no topo do arquivo NÃO são acessíveis
 * dentro dos callbacks do router. Por isso tudo é inline em cada handler.
 */

routerAdd('POST', '/backend/v1/agente-fontes/notificar', (c) => {
  // ── autenticação inline (mesmo padrão do painel do Simulador) ──
  var esperado = $secrets.get('AGENTE_FONTES_TOKEN') || ''
  if (!esperado) {
    return c.json(503, { ok: false, erro: 'AGENTE_FONTES_TOKEN não configurado' })
  }
  var recebido = c.request().header.get('X-Painel-Token') || ''
  if (recebido !== esperado) {
    return c.json(403, { ok: false, erro: 'token inválido' })
  }

  // ── corpo ──
  var body = {}
  try {
    body = $apis.requestInfo(c).data || {}
  } catch (_) {
    body = {}
  }

  var mudancas = body.mudancas || []
  var execucao = body.execucao || ''
  var resumo = body.resumo || ''
  var destinatario = body.destinatario || 'joildo@adecont.com.br'
  var forcar = body.forcar === true

  if (!mudancas.length && !forcar) {
    return c.json(200, { ok: true, enviado: false, motivo: 'nenhuma mudança — nada a notificar' })
  }

  var baseUrl = body.baseUrl || 'https://verificacao-projeto-panorama-18549.goskip.app'

  // ── monta a lista de impactos ──
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

  var totalLinhas = 0
  for (var k = 0; k < mudancas.length; k++) {
    var mm = mudancas[k]
    if (mm.linhas) totalLinhas += mm.linhas
  }

  var assunto =
    mudancas.length === 1
      ? '[ADECONT] Alerta de legislação: ' +
        (mudancas[0].rotulo || mudancas[0].fonte || 'fonte alterada')
      : '[ADECONT] Alerta de legislação: ' + mudancas.length + ' fontes com alteração'

  var html =
    '<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1c2b3a">' +
    '<div style="background:#0b3142;padding:18px;text-align:center">' +
    '<img src="' +
    baseUrl +
    '/logo-adecont-branco.png" alt="ADECONT" style="max-height:52px">' +
    '</div>' +
    '<div style="padding:22px;background:#fff;border:1px solid #dbe3ee">' +
    '<h2 style="color:#7f1d1d;margin-top:0">⚠ Alerta de alteração na legislação</h2>' +
    '<p style="font-size:14px">O Agente de Vigilância das Fontes detectou alteração em ' +
    mudancas.length +
    ' fonte(s) das quais a legislação da reforma tributária depende.' +
    (totalLinhas > 0
      ? ' Isso alcança <b>' + totalLinhas + ' linha(s)</b> de tabela do Panorama.'
      : '') +
    '</p>' +
    '<div style="background:#f6f8fc;border:1px solid #dbe3ee;border-radius:8px;padding:10px 14px;margin:0 0 16px;font-size:13px;color:#475569">' +
    '<b>Varredura:</b> ' +
    (execucao || 'agora') +
    '<br><b>Resumo:</b> ' +
    (resumo || 'não informado') +
    '</div>' +
    blocos +
    '<p style="font-size:13px;margin-top:18px">O que fazer: abra o Monitor Legislativo, confira as seções indicadas e atualize o Panorama se a alteração valer. A varredura compara o hash do texto de cada fonte — uma divergência significa ato novo ou texto alterado, não erro de leitura.</p>' +
    '<p style="margin:20px 0 0;text-align:center">' +
    '<a href="' +
    baseUrl +
    '/#monitor-legislativo" style="background:#12315e;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Abrir o Monitor Legislativo</a>' +
    '</p>' +
    '</div>' +
    '<div style="padding:14px 22px 26px;background:#f6f8fc;border:1px solid #dbe3ee;border-top:none;text-align:center">' +
    '<p style="margin:0;font-size:11px;color:#8a97a8">ADECONT Assessoria Administrativa, Contábil · aviso automático do Agente de Vigilância das Fontes · não responda</p>' +
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
  } catch (e) {
    erro = String(e)
    console.log('[agente-fontes] falha ao enviar: ' + erro)
  }

  // ── registra no log de auditoria ──
  try {
    var col = $app.findCollectionByNameOrId('acesso_comandos')
    var rec = new Record(col)
    rec.set('comando', 'ALERTA_FONTES')
    rec.set(
      'descricao',
      'Aviso de alteração enviado a ' + destinatario + ' (' + mudancas.length + ' fonte(s))',
    )
    rec.set('nivel_minimo', '1')
    rec.set('ator_email', 'agente-fontes@sistema')
    rec.set('resultado', enviado ? 'ENVIADO' : 'FALHA')
    rec.set('detalhe', (enviado ? 'ok' : erro).slice(0, 900))
    $app.save(rec)
  } catch (logErr) {
    console.log('[agente-fontes] log falhou: ' + logErr)
  }

  return c.json(200, { ok: true, enviado: enviado, destinatario: destinatario, erro: erro })
})

/**
 * GET /backend/v1/agente-fontes/status
 * Diz se o canal de e-mail está configurado, para o painel poder avisar antes
 * de alguém contar com uma notificação que não vai chegar.
 */
routerAdd('GET', '/backend/v1/agente-fontes/status', (c) => {
  var esperado = $secrets.get('AGENTE_FONTES_TOKEN') || ''
  var recebido = c.request().header.get('X-Painel-Token') || ''
  if (esperado && recebido !== esperado) {
    return c.json(403, { ok: false, erro: 'token inválido' })
  }
  return c.json(200, {
    ok: true,
    tokenConfigurado: !!esperado,
    destinatarioPadrao: 'joildo@adecont.com.br',
  })
})
