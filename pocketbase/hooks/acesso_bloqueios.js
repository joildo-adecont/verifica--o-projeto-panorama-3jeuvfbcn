// Trava de Segurança do Controle de Acesso (Panorama 62493)
// MODELO DO CEO:
//  1. RATE LIMIT — "porta giratória": a mesma chave só pode fazer 10 pedidos
//     por minuto ao sistema; o 11º é recusado (429) por 1 minuto.
//  2. BLOQUEIO NA 3ª TENTATIVA FALHA — 3 comandos negados (401/403) seguidos
//     e a chave fica BLOQUEADA; todo pedido seguinte é recusado (423 Locked).
//  3. DESBLOQUEIO SOMENTE PELO ADMINISTRADOR (N4 / token do painel).
// Endpoints:
//   GET  /backend/v1/acesso-bloqueios        -> lista a fila de chaves (N1+)
//   POST /backend/v1/acesso-bloqueios        -> desbloqueia chave (SOMENTE N4)
// A trava roda DENTRO do hook controle_acesso.js (todos os comandos passam por ela).

// ---------- 1. VER a fila de bloqueios (N1+) ----------
routerAdd('GET', '/backend/v1/acesso-bloqueios', (e) => {
  function nivelDoChamador(e) {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    if (esperado && recebido && recebido === esperado) {
      return { nivel: 4, email: 'joildo@adecont.com.br', ok: true, mestre: true }
    }
    var qemail = String(e.requestInfo().query.email || '')
      .toLowerCase()
      .trim()
    if (!qemail) return { nivel: 0, email: '', ok: false, mestre: false }
    try {
      var eu = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
        email: qemail,
      })
      if (!eu.getBool('is_active')) return { nivel: 0, email: '', ok: false, mestre: false }
      var n = parseInt(eu.getString('nivel'), 10) || 0
      return { nivel: n, email: eu.getString('email'), ok: n >= 1, mestre: false }
    } catch (_) {
      return { nivel: 0, email: '', ok: false, mestre: false }
    }
  }
  function audit(comando, ator, resultado, detalhe) {
    try {
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', comando)
      a.set('nivel_minimo', '1')
      a.set('ator_email', ator)
      a.set('resultado', resultado)
      a.set('detalhe', detalhe || '')
      $app.save(a)
    } catch (err) {
      console.log('[bloqueios] audit fail: ' + err)
    }
  }

  var cham = nivelDoChamador(e)
  if (!cham.ok) {
    audit('VER_BLOQUEIOS', cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message:
        'Nenhuma chave válida. Use o token do painel ou informe ?email= de um usuário autorizado.',
    })
  }
  var registros = $app.findRecordsByFilter('acesso_bloqueios', 'id != ""', '-atualizado_em', 0, 0)
  var lista = []
  var agora = new Date()
  for (var i = 0; i < registros.length; i++) {
    var b = registros[i]
    var janela = b.getString('janela')
    var expirou = false
    if (janela) {
      var t = new Date(janela)
      expirou = agora.getTime() - t.getTime() > 60000
    }
    lista.push({
      id: b.id,
      chave: b.getString('chave'),
      tentativas: b.getInt('tentativas'),
      bloqueado: b.getBool('bloqueado'),
      bloqueado_em: b.getString('bloqueado_em'),
      ultimo_comando: b.getString('ultimo_comando'),
      ultimo_motivo: b.getString('ultimo_motivo'),
      acessos_janela: b.getInt('acessos_janela'),
      janela_expirada: expirou,
      desbloqueado_por: b.getString('desbloqueado_por'),
      desbloqueado_em: b.getString('desbloqueado_em'),
    })
  }
  audit('VER_BLOQUEIOS', cham.email, 'OK', lista.length + ' registros')
  return e.json(200, { success: true, meu_nivel: cham.nivel, bloqueios: lista })
})

// ---------- 2. DESBLOQUEAR (SOMENTE N4 — administrador) ----------
routerAdd('POST', '/backend/v1/acesso-bloqueios', (e) => {
  function nivelDoChamador(e) {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    if (esperado && recebido && recebido === esperado) {
      return { nivel: 4, email: 'joildo@adecont.com.br', ok: true, mestre: true }
    }
    var qemail = String(e.requestInfo().query.email || '')
      .toLowerCase()
      .trim()
    if (!qemail) return { nivel: 0, email: '', ok: false, mestre: false }
    try {
      var eu = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
        email: qemail,
      })
      if (!eu.getBool('is_active')) return { nivel: 0, email: '', ok: false, mestre: false }
      var n = parseInt(eu.getString('nivel'), 10) || 0
      return { nivel: n, email: eu.getString('email'), ok: n >= 1, mestre: false }
    } catch (_) {
      return { nivel: 0, email: '', ok: false, mestre: false }
    }
  }
  function audit(comando, ator, resultado, detalhe) {
    try {
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', comando)
      a.set('nivel_minimo', '4')
      a.set('ator_email', ator)
      a.set('resultado', resultado)
      a.set('detalhe', detalhe || '')
      $app.save(a)
    } catch (err) {
      console.log('[bloqueios] audit fail: ' + err)
    }
  }

  var cham = nivelDoChamador(e)
  if (!cham.ok) {
    audit('DESBLOQUEAR', cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 4) {
    audit('DESBLOQUEAR', cham.email, 'NEGADO', 'exige N4 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'O desbloqueio é exclusivo do administrador — Nível 04 (chave mestra).',
    })
  }
  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var chave = String(body.chave || '')
    .toLowerCase()
    .trim()
  if (!chave)
    return e.json(400, { success: false, error: 'Informe a chave (chave) a desbloquear.' })
  var rec = null
  try {
    rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', { chave: chave })
  } catch (_) {
    rec = null
  }
  if (!rec) {
    return e.json(404, { success: false, error: 'Nenhum registro de trava para esta chave.' })
  }
  rec.set('bloqueado', false)
  rec.set('tentativas', 0)
  rec.set('acessos_janela', 0)
  rec.set('desbloqueado_por', cham.email)
  rec.set('desbloqueado_em', new Date().toISOString())
  $app.save(rec)
  audit('DESBLOQUEAR', cham.email, 'OK', 'chave ' + chave + ' desbloqueada')
  return e.json(200, { success: true, chave: chave, desbloqueado_por: cham.email })
})
