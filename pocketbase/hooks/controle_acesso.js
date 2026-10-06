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
//
// TRAVA DE SEGURANCA (modelo do CEO):
//  - RATE LIMIT ("porta giratoria"): a mesma chave so faz 10 pedidos por minuto;
//    o 11o e recusado com 429 (Retry-After: 60).
//  - BLOQUEIO NA 3a TENTATIVA FALHA: 3 comandos negados (401/403) seguidos e a
//    chave fica BLOQUEADA (423 Locked) ate o administrador (N4) desbloquear.
//  - Desbloqueio: POST /backend/v1/acesso-bloqueios (hook acesso_bloqueios.js).
// Registros da trava ficam na colecao acesso_bloqueios (migration 0051).
// (constantes da trava definidas INLINE em cada callback — regra de QA do JSVM)

// ---------- 1. VER (Nivel 1) ----------
routerAdd('GET', '/backend/v1/acesso-usuarios', (e) => {
  var TRAVA_LIMITE_POR_MINUTO = 10
  var TRAVA_MAX_TENTATIVAS = 3
  function travaRegistrar(chave, falhou, comando, motivo) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16) // minuto corrente
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record($app.findCollectionByNameOrId('acesso_bloqueios'))
      rec.set('chave', chaveNorm)
      rec.set('tentativas', 0)
      rec.set('bloqueado', false)
      rec.set('acessos_janela', 0)
      rec.set('janela', janelaAtual)
    }
    if (rec.getString('janela') !== janelaAtual) {
      rec.set('janela', janelaAtual)
      rec.set('acessos_janela', 0)
    }
    rec.set('acessos_janela', rec.getInt('acessos_janela') + 1)
    rec.set('ultimo_comando', comando || '')
    rec.set('ultimo_motivo', motivo || '')
    if (falhou) {
      rec.set('tentativas', rec.getInt('tentativas') + 1)
      if (rec.getInt('tentativas') >= TRAVA_MAX_TENTATIVAS && !rec.getBool('bloqueado')) {
        rec.set('bloqueado', true)
        rec.set('bloqueado_em', agora.toISOString())
      }
    }
    $app.save(rec)
    return rec
  }
  function travaVerificar(chave) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) return { liberado: true, bloqueado: false, excesso: false }
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var bloqueado = rec.getBool('bloqueado')
    var excesso =
      rec.getString('janela') === janelaAtual &&
      rec.getInt('acessos_janela') >= TRAVA_LIMITE_POR_MINUTO
    if (!bloqueado && !excesso) return { liberado: true, bloqueado: false, excesso: false }
    if (bloqueado) return { liberado: false, bloqueado: true, excesso: false }
    return { liberado: false, bloqueado: false, excesso: true }
  }

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
  var chaveTrava = cham.ok ? cham.email || 'anonimo' : 'anonimo'
  var tv = travaVerificar(chaveTrava)
  if (!tv.liberado) {
    if (tv.bloqueado) {
      travaRegistrar(chaveTrava, false, 'VER', 'chave bloqueada — pedido recusado')
      return e.json(423, {
        status: 423,
        error:
          '🔒 Chave BLOQUEADA por segurança (3 tentativas falhas). Somente o administrador (Nível 04) pode desbloquear.',
      })
    }
    travaRegistrar(chaveTrava, false, 'VER', 'rate limit — porta giratória cheia')
    return e.json(429, {
      status: 429,
      error:
        'Porta giratória cheia: limite de ' +
        TRAVA_LIMITE_POR_MINUTO +
        ' pedidos por minuto. Aguarde 1 minuto.',
    })
  }
  if (!cham.ok) {
    travaRegistrar(chaveTrava, true, 'VER', 'sem chave válida')
    audit('VER', 1, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message:
        'Nenhuma chave válida. Use o token do painel ou informe ?email= de um usuário autorizado.',
    })
  }
  if (cham.nivel < 1) {
    travaRegistrar(chaveTrava, true, 'VER', 'nível insuficiente (N' + cham.nivel + ')')
    audit('VER', 1, cham.email, 'NEGADO', 'nível insuficiente (N' + cham.nivel + ')')
    return e.json(403, { status: 403, error: 'Comando VER exige Nível 01.' })
  }
  travaRegistrar(chaveTrava, false, 'VER', '')
  var registros = $app.findRecordsByFilter('acesso_usuarios', 'id != ""', '-atualizado_em', 0, 0)
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
  var TRAVA_LIMITE_POR_MINUTO = 10
  var TRAVA_MAX_TENTATIVAS = 3
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
  function travaRegistrar(chave, falhou, comando, motivo) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record($app.findCollectionByNameOrId('acesso_bloqueios'))
      rec.set('chave', chaveNorm)
      rec.set('tentativas', 0)
      rec.set('bloqueado', false)
      rec.set('acessos_janela', 0)
      rec.set('janela', janelaAtual)
    }
    if (rec.getString('janela') !== janelaAtual) {
      rec.set('janela', janelaAtual)
      rec.set('acessos_janela', 0)
    }
    rec.set('acessos_janela', rec.getInt('acessos_janela') + 1)
    rec.set('ultimo_comando', comando || '')
    rec.set('ultimo_motivo', motivo || '')
    if (falhou) {
      rec.set('tentativas', rec.getInt('tentativas') + 1)
      if (rec.getInt('tentativas') >= TRAVA_MAX_TENTATIVAS && !rec.getBool('bloqueado')) {
        rec.set('bloqueado', true)
        rec.set('bloqueado_em', agora.toISOString())
      }
    }
    $app.save(rec)
    return rec
  }
  function travaVerificar(chave) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) return { liberado: true, bloqueado: false, excesso: false }
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var bloqueado = rec.getBool('bloqueado')
    var excesso =
      rec.getString('janela') === janelaAtual &&
      rec.getInt('acessos_janela') >= TRAVA_LIMITE_POR_MINUTO
    if (!bloqueado && !excesso) return { liberado: true, bloqueado: false, excesso: false }
    if (bloqueado) return { liberado: false, bloqueado: true, excesso: false }
    return { liberado: false, bloqueado: false, excesso: true }
  }
  function travaRecusar(e, chave, comando, tipo) {
    if (tipo === 'bloqueado') {
      travaRegistrar(chave, false, comando, 'chave bloqueada — pedido recusado')
      return e.json(423, {
        status: 423,
        error:
          '🔒 Chave BLOQUEADA por segurança (3 tentativas falhas). Somente o administrador (Nível 04) pode desbloquear.',
      })
    }
    travaRegistrar(chave, false, comando, 'rate limit — porta giratória cheia')
    return e.json(429, {
      status: 429,
      error:
        'Porta giratória cheia: limite de ' +
        TRAVA_LIMITE_POR_MINUTO +
        ' pedidos por minuto. Aguarde 1 minuto.',
    })
  }

  var cham = nivelDoChamador(e)
  var chaveTrava = cham.ok ? cham.email || 'anonimo' : 'anonimo'
  var tv = travaVerificar(chaveTrava)
  if (!tv.liberado) {
    return travaRecusar(e, chaveTrava, 'CRIAR', tv.bloqueado ? 'bloqueado' : 'excesso')
  }
  if (!cham.ok) {
    travaRegistrar(chaveTrava, true, 'CRIAR', 'sem chave válida')
    audit('CRIAR', 2, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 2) {
    travaRegistrar(chaveTrava, true, 'CRIAR', 'comando exige N2 (chave N' + cham.nivel + ')')
    audit('CRIAR', 2, cham.email, 'NEGADO', 'comando exige N2 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'Comando CRIAR exige Nível 02 (chave atual: N' + cham.nivel + ').',
    })
  }
  travaRegistrar(chaveTrava, false, 'CRIAR', '')
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
  var TRAVA_LIMITE_POR_MINUTO = 10
  var TRAVA_MAX_TENTATIVAS = 3
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
  function travaRegistrar(chave, falhou, comando, motivo) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record($app.findCollectionByNameOrId('acesso_bloqueios'))
      rec.set('chave', chaveNorm)
      rec.set('tentativas', 0)
      rec.set('bloqueado', false)
      rec.set('acessos_janela', 0)
      rec.set('janela', janelaAtual)
    }
    if (rec.getString('janela') !== janelaAtual) {
      rec.set('janela', janelaAtual)
      rec.set('acessos_janela', 0)
    }
    rec.set('acessos_janela', rec.getInt('acessos_janela') + 1)
    rec.set('ultimo_comando', comando || '')
    rec.set('ultimo_motivo', motivo || '')
    if (falhou) {
      rec.set('tentativas', rec.getInt('tentativas') + 1)
      if (rec.getInt('tentativas') >= TRAVA_MAX_TENTATIVAS && !rec.getBool('bloqueado')) {
        rec.set('bloqueado', true)
        rec.set('bloqueado_em', agora.toISOString())
      }
    }
    $app.save(rec)
    return rec
  }
  function travaVerificar(chave) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) return { liberado: true, bloqueado: false, excesso: false }
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var bloqueado = rec.getBool('bloqueado')
    var excesso =
      rec.getString('janela') === janelaAtual &&
      rec.getInt('acessos_janela') >= TRAVA_LIMITE_POR_MINUTO
    if (!bloqueado && !excesso) return { liberado: true, bloqueado: false, excesso: false }
    if (bloqueado) return { liberado: false, bloqueado: true, excesso: false }
    return { liberado: false, bloqueado: false, excesso: true }
  }
  function travaRecusar(e, chave, comando, tipo) {
    if (tipo === 'bloqueado') {
      travaRegistrar(chave, false, comando, 'chave bloqueada — pedido recusado')
      return e.json(423, {
        status: 423,
        error:
          '🔒 Chave BLOQUEADA por segurança (3 tentativas falhas). Somente o administrador (Nível 04) pode desbloquear.',
      })
    }
    travaRegistrar(chave, false, comando, 'rate limit — porta giratória cheia')
    return e.json(429, {
      status: 429,
      error:
        'Porta giratória cheia: limite de ' +
        TRAVA_LIMITE_POR_MINUTO +
        ' pedidos por minuto. Aguarde 1 minuto.',
    })
  }

  var cham = nivelDoChamador(e)
  var chaveTrava = cham.ok ? cham.email || 'anonimo' : 'anonimo'
  var tv = travaVerificar(chaveTrava)
  if (!tv.liberado) {
    return travaRecusar(e, chaveTrava, 'EDITAR', tv.bloqueado ? 'bloqueado' : 'excesso')
  }
  if (!cham.ok) {
    travaRegistrar(chaveTrava, true, 'EDITAR', 'sem chave válida')
    audit('EDITAR', 3, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 3) {
    travaRegistrar(chaveTrava, true, 'EDITAR', 'comando exige N3 (chave N' + cham.nivel + ')')
    audit('EDITAR', 3, cham.email, 'NEGADO', 'comando exige N3 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'Comando EDITAR exige Nível 03 (chave atual: N' + cham.nivel + ').',
    })
  }
  travaRegistrar(chaveTrava, false, 'EDITAR', '')
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
  var TRAVA_LIMITE_POR_MINUTO = 10
  var TRAVA_MAX_TENTATIVAS = 3
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
  function travaRegistrar(chave, falhou, comando, motivo) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) {
      rec = new Record($app.findCollectionByNameOrId('acesso_bloqueios'))
      rec.set('chave', chaveNorm)
      rec.set('tentativas', 0)
      rec.set('bloqueado', false)
      rec.set('acessos_janela', 0)
      rec.set('janela', janelaAtual)
    }
    if (rec.getString('janela') !== janelaAtual) {
      rec.set('janela', janelaAtual)
      rec.set('acessos_janela', 0)
    }
    rec.set('acessos_janela', rec.getInt('acessos_janela') + 1)
    rec.set('ultimo_comando', comando || '')
    rec.set('ultimo_motivo', motivo || '')
    if (falhou) {
      rec.set('tentativas', rec.getInt('tentativas') + 1)
      if (rec.getInt('tentativas') >= TRAVA_MAX_TENTATIVAS && !rec.getBool('bloqueado')) {
        rec.set('bloqueado', true)
        rec.set('bloqueado_em', agora.toISOString())
      }
    }
    $app.save(rec)
    return rec
  }
  function travaVerificar(chave) {
    var chaveNorm = String(chave || 'anonimo')
      .toLowerCase()
      .trim()
      .slice(0, 200)
    var rec = null
    try {
      rec = $app.findFirstRecordByFilter('acesso_bloqueios', 'chave = {:chave}', {
        chave: chaveNorm,
      })
    } catch (_) {
      rec = null
    }
    if (!rec) return { liberado: true, bloqueado: false, excesso: false }
    var agora = new Date()
    var janelaAtual = agora.toISOString().slice(0, 16)
    var bloqueado = rec.getBool('bloqueado')
    var excesso =
      rec.getString('janela') === janelaAtual &&
      rec.getInt('acessos_janela') >= TRAVA_LIMITE_POR_MINUTO
    if (!bloqueado && !excesso) return { liberado: true, bloqueado: false, excesso: false }
    if (bloqueado) return { liberado: false, bloqueado: true, excesso: false }
    return { liberado: false, bloqueado: false, excesso: true }
  }
  function travaRecusar(e, chave, comando, tipo) {
    if (tipo === 'bloqueado') {
      travaRegistrar(chave, false, comando, 'chave bloqueada — pedido recusado')
      return e.json(423, {
        status: 423,
        error:
          '🔒 Chave BLOQUEADA por segurança (3 tentativas falhas). Somente o administrador (Nível 04) pode desbloquear.',
      })
    }
    travaRegistrar(chave, false, comando, 'rate limit — porta giratória cheia')
    return e.json(429, {
      status: 429,
      error:
        'Porta giratória cheia: limite de ' +
        TRAVA_LIMITE_POR_MINUTO +
        ' pedidos por minuto. Aguarde 1 minuto.',
    })
  }

  var cham = nivelDoChamador(e)
  var chaveTrava = cham.ok ? cham.email || 'anonimo' : 'anonimo'
  var tv = travaVerificar(chaveTrava)
  if (!tv.liberado) {
    return travaRecusar(e, chaveTrava, 'APAGAR', tv.bloqueado ? 'bloqueado' : 'excesso')
  }
  if (!cham.ok) {
    travaRegistrar(chaveTrava, true, 'APAGAR', 'sem chave válida')
    audit('APAGAR', 4, cham.email || '?', 'NEGADO', 'sem chave válida')
    return e.json(401, {
      status: 401,
      message: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }
  if (cham.nivel < 4) {
    travaRegistrar(chaveTrava, true, 'APAGAR', 'comando exige N4 (chave N' + cham.nivel + ')')
    audit('APAGAR', 4, cham.email, 'NEGADO', 'comando exige N4 (chave N' + cham.nivel + ')')
    return e.json(403, {
      status: 403,
      error: 'Comando APAGAR exige Nível 04 — acesso total (chave mestra).',
    })
  }
  travaRegistrar(chaveTrava, false, 'APAGAR', '')
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
