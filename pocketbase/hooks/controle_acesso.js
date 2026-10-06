// Hook de Controle de Acesso (Panorama 62493) — modelo do CEO: chaves de hotel
// Niveis: N1 ver / N2 ver+criar / N3 ver+criar+editar / N4 total (ver+criar+editar+apagar)
// Endpoints:
//   GET    /backend/v1/acesso-usuarios  -> comando VER    (nivel minimo 1)
//   POST   /backend/v1/acesso-usuarios  -> comando CRIAR  (nivel minimo 2)
//   PATCH  /backend/v1/acesso-usuarios  -> comando EDITAR (nivel minimo 3)
//   DELETE /backend/v1/acesso-usuarios  -> comando APAGAR (nivel minimo 4)
// A validacao de nivel e feita AQUI no backend: mesmo burlando a tela, o comando
// e recusado se o nivel da chave for inferior ao exigido.
// JSVM: todos os helpers ficam INLINE dentro de cada callback (regra de QA).

// ---------- 1. VER (Nivel 1) ----------
routerAdd('GET', '/backend/v1/acesso-usuarios', (e) => {
  function nivelDoChamador(e) {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    if (esperado && recebido && recebido === esperado) {
      // Token do painel = chave mestra gerencial (N4)
      return {
        nivel: 4,
        nome: 'Gerência (token do painel)',
        email: 'joildo@adecont.com.br',
        ok: true,
      }
    }
    var qemail = String(e.requestInfo().query.email || '')
      .toLowerCase()
      .trim()
    if (!qemail) return { nivel: 0, nome: '', email: '', ok: false }
    try {
      var eu = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
        email: qemail,
      })
      if (!eu.getBool('is_active')) return { nivel: 0, nome: '', email: '', ok: false }
      var n = parseInt(eu.getString('nivel'), 10) || 0
      return {
        nivel: n,
        nome: eu.getString('nome'),
        email: eu.getString('email'),
        ok: n >= 1,
      }
    } catch (_) {
      return { nivel: 0, nome: '', email: '', ok: false }
    }
  }
  function audit(comando, nivelMin, ator, resultado, detalhe) {
    try {
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', comando)
      a.set('nivel_minimo', String(nivelMin))
      a.set('ator_email', ator)
      a.set('resultado', resultado)
      a.set('detalhe', detalhe || '')
      $app.save(a)
    } catch (err) {
      console.log('[acesso] audit fail: ' + err)
    }
  }

  var cham = nivelDoChamador(e)
  if (!cham.ok) {
    audit('VER', 1, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message:
        'Nenhuma chave válida. Use o token do painel ou informe ?email= de um usuário autorizado.',
    })
  }
  if (cham.nivel < 1) {
    audit('VER', 1, cham.email, 'NEGADO', 'nível insuficiente (N' + cham.nivel + ')')
    return e.json(403, { status: 403, error: 'Comando VER exige Nível 01.' })
  }
  var registros = $app.findRecordsByFilter('acesso_usuarios', 'id != ""', '-updated', 0, 0)
  var lista = []
  for (var i = 0; i < registros.length; i++) {
    var u = registros[i]
    lista.push({
      id: u.id,
      nome: u.getString('nome'),
      email: u.getString('email'),
      nivel: parseInt(u.getString('nivel'), 10) || 0,
      ativo: u.getBool('is_active'),
      obs: u.getString('observacoes'),
      updated: u.get('updated') || '',
    })
  }
  audit('VER', 1, cham.email, 'OK', lista.length + ' registros')
  return e.json(200, { success: true, meu_nivel: cham.nivel, usuarios: lista })
})

// ---------- 2. CRIAR (Nivel 2) ----------
routerAdd('POST', '/backend/v1/acesso-usuarios', (e) => {
  function nivelDoChamador(e) {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    if (esperado && recebido && recebido === esperado) {
      return {
        nivel: 4,
        nome: 'Gerência (token do painel)',
        email: 'joildo@adecont.com.br',
        ok: true,
      }
    }
    var qemail = String(e.requestInfo().query.email || '')
      .toLowerCase()
      .trim()
    if (!qemail) return { nivel: 0, nome: '', email: '', ok: false }
    try {
      var eu = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
        email: qemail,
      })
      if (!eu.getBool('is_active')) return { nivel: 0, nome: '', email: '', ok: false }
      var n = parseInt(eu.getString('nivel'), 10) || 0
      return {
        nivel: n,
        nome: eu.getString('nome'),
        email: eu.getString('email'),
        ok: n >= 1,
      }
    } catch (_) {
      return { nivel: 0, nome: '', email: '', ok: false }
    }
  }
  function audit(comando, nivelMin, ator, resultado, detalhe) {
    try {
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', comando)
      a.set('nivel_minimo', String(nivelMin))
      a.set('ator_email', ator)
      a.set('resultado', resultado)
      a.set('detalhe', detalhe || '')
      $app.save(a)
    } catch (err) {
      console.log('[acesso] audit fail: ' + err)
    }
  }

  var cham = nivelDoChamador(e)
  if (!cham.ok) {
    audit('CRIAR', 2, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 2) {
    audit('CRIAR', 2, cham.email, 'NEGADO', 'comando exige N2 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'Comando CRIAR exige Nível 02 (chave atual: N' + cham.nivel + ').',
    })
  }
  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var dados = body.usuario || {}
  var nome = String(dados.nome || '').trim()
  var email = String(dados.email || '')
    .toLowerCase()
    .trim()
  var nivel = parseInt(String(dados.nivel || '1'), 10) || 1
  if (nivel < 1 || nivel > 4) nivel = 1
  if (!nome || !email) {
    return e.json(400, { success: false, error: 'Nome e e-mail são obrigatórios.' })
  }
  // Regra do modelo: quem entrega chave precisa ter nivel >= do que vai atribuir
  if (nivel > cham.nivel) {
    audit(
      'CRIAR',
      2,
      cham.email,
      'NEGADO',
      'nível atribuído maior que o próprio (N' + cham.nivel + ')',
    )
    return e.json(403, {
      status: 403,
      error: 'Não é possível entregar chave acima do próprio nível (N' + cham.nivel + ').',
    })
  }
  var col = $app.findCollectionByNameOrId('acesso_usuarios')
  var existente = null
  try {
    existente = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
      email: email,
    })
  } catch (_) {
    existente = null
  }
  var rec = existente
  if (!rec) rec = new Record(col)
  rec.set('nome', nome)
  rec.set('email', email)
  rec.set('nivel', String(nivel))
  rec.set('is_active', true)
  rec.set('observacoes', String(dados.obs || '').slice(0, 500))
  rec.set('atualizado_por', cham.email)
  $app.save(rec)
  audit(
    'CRIAR',
    2,
    cham.email,
    'OK',
    (existente ? 'atualizado ' : 'criado ') + email + ' N' + nivel,
  )
  return e.json(200, {
    success: true,
    usuario: {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      nivel: nivel,
      ativo: true,
    },
  })
})

// ---------- 3. EDITAR (Nivel 3) ----------
routerAdd('PATCH', '/backend/v1/acesso-usuarios', (e) => {
  function nivelDoChamador(e) {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    if (esperado && recebido && recebido === esperado) {
      return {
        nivel: 4,
        nome: 'Gerência (token do painel)',
        email: 'joildo@adecont.com.br',
        ok: true,
      }
    }
    var qemail = String(e.requestInfo().query.email || '')
      .toLowerCase()
      .trim()
    if (!qemail) return { nivel: 0, nome: '', email: '', ok: false }
    try {
      var eu = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
        email: qemail,
      })
      if (!eu.getBool('is_active')) return { nivel: 0, nome: '', email: '', ok: false }
      var n = parseInt(eu.getString('nivel'), 10) || 0
      return {
        nivel: n,
        nome: eu.getString('nome'),
        email: eu.getString('email'),
        ok: n >= 1,
      }
    } catch (_) {
      return { nivel: 0, nome: '', email: '', ok: false }
    }
  }
  function audit(comando, nivelMin, ator, resultado, detalhe) {
    try {
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', comando)
      a.set('nivel_minimo', String(nivelMin))
      a.set('ator_email', ator)
      a.set('resultado', resultado)
      a.set('detalhe', detalhe || '')
      $app.save(a)
    } catch (err) {
      console.log('[acesso] audit fail: ' + err)
    }
  }

  var cham = nivelDoChamador(e)
  if (!cham.ok) {
    audit('EDITAR', 3, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 3) {
    audit('EDITAR', 3, cham.email, 'NEGADO', 'comando exige N3 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'Comando EDITAR exige Nível 03 (chave atual: N' + cham.nivel + ').',
    })
  }
  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var id = String(body.id || '')
  if (!id) return e.json(400, { success: false, error: 'id obrigatório' })
  var rec
  try {
    rec = $app.findRecordById('acesso_usuarios', id)
  } catch (_) {
    return e.json(404, { success: false, error: 'Autorização não encontrada.' })
  }
  if (body.nivel !== undefined && body.nivel !== null) {
    var nv = parseInt(String(body.nivel), 10) || 0
    if (nv < 1 || nv > 4) {
      return e.json(400, { success: false, error: 'Nível inválido (1 a 4).' })
    }
    if (nv > cham.nivel) {
      audit(
        'EDITAR',
        3,
        cham.email,
        'NEGADO',
        'atribuição acima do próprio nível (N' + cham.nivel + ')',
      )
      return e.json(403, {
        status: 403,
        error: 'Não é possível atribuir nível maior que o da própria chave (N' + cham.nivel + ').',
      })
    }
    rec.set('nivel', String(nv))
  }
  if (body.ativo !== undefined && body.ativo !== null) {
    rec.set('is_active', !!body.ativo)
  }
  rec.set('atualizado_por', cham.email)
  $app.save(rec)
  audit(
    'EDITAR',
    3,
    cham.email,
    'OK',
    rec.getString('email') +
      ' -> N' +
      rec.getString('nivel') +
      ' ativo=' +
      rec.getBool('is_active'),
  )
  return e.json(200, {
    success: true,
    usuario: {
      id: rec.id,
      nivel: parseInt(rec.getString('nivel'), 10),
      ativo: rec.getBool('is_active'),
    },
  })
})

// ---------- 4. APAGAR (Nivel 4) ----------
routerAdd('DELETE', '/backend/v1/acesso-usuarios', (e) => {
  function nivelDoChamador(e) {
    var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    var recebido = e.request.header.get('X-Painel-Token') || ''
    if (esperado && recebido && recebido === esperado) {
      return {
        nivel: 4,
        nome: 'Gerência (token do painel)',
        email: 'joildo@adecont.com.br',
        ok: true,
      }
    }
    var qemail = String(e.requestInfo().query.email || '')
      .toLowerCase()
      .trim()
    if (!qemail) return { nivel: 0, nome: '', email: '', ok: false }
    try {
      var eu = $app.findFirstRecordByFilter('acesso_usuarios', 'email = {:email}', {
        email: qemail,
      })
      if (!eu.getBool('is_active')) return { nivel: 0, nome: '', email: '', ok: false }
      var n = parseInt(eu.getString('nivel'), 10) || 0
      return {
        nivel: n,
        nome: eu.getString('nome'),
        email: eu.getString('email'),
        ok: n >= 1,
      }
    } catch (_) {
      return { nivel: 0, nome: '', email: '', ok: false }
    }
  }
  function audit(comando, nivelMin, ator, resultado, detalhe) {
    try {
      var col = $app.findCollectionByNameOrId('acesso_comandos')
      var a = new Record(col)
      a.set('comando', comando)
      a.set('nivel_minimo', String(nivelMin))
      a.set('ator_email', ator)
      a.set('resultado', resultado)
      a.set('detalhe', detalhe || '')
      $app.save(a)
    } catch (err) {
      console.log('[acesso] audit fail: ' + err)
    }
  }

  var cham = nivelDoChamador(e)
  if (!cham.ok) {
    audit('APAGAR', 4, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 4) {
    audit('APAGAR', 4, cham.email, 'NEGADO', 'comando exige N4 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'Comando APAGAR exige Nível 04 — acesso total (chave mestra).',
    })
  }
  var body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }
  var id = String(body.id || '')
  if (!id) return e.json(400, { success: false, error: 'id obrigatório' })
  var rec
  try {
    rec = $app.findRecordById('acesso_usuarios', id)
  } catch (_) {
    return e.json(404, { success: false, error: 'Autorização não encontrada.' })
  }
  var removido = rec.getString('email')
  $app.delete(rec)
  audit('APAGAR', 4, cham.email, 'OK', 'removido ' + removido)
  return e.json(200, { success: true })
})
