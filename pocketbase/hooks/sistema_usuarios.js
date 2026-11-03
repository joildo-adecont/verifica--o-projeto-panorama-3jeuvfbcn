/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook de Usuários e Níveis de Acesso do Sistema ADECONT Panorama
 *
 * Suporte completo a:
 * - Login com identificador/e-mail e senha (sem token corporativo)
 * - Confirmação de cadastro por código (público)
 * - Confirmação manual pelo administrador (com token)
 * - Listagem, criação, edição e exclusão de usuários
 * - CRUD de níveis de acesso customizáveis
 *
 * NOTA: Cada callback routerAdd declara suas próprias funções utilitárias inline.
 */

// -------------------------------------------------------------
// 1. ROTA PÚBLICA DE LOGIN: POST /backend/v1/sistema-usuarios/login
// -------------------------------------------------------------
routerAdd('POST', '/backend/v1/sistema-usuarios/login', (e) => {
  const sanitizar = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      cargo: rec.getString('cargo'),
      departamento: rec.getString('departamento'),
      nivel: rec.getString('nivel'),
      nivel_customizado_id: rec.getString('nivel_customizado_id'),
      nivel_customizado_nome: rec.getString('nivel_customizado_nome'),
      status_cadastro: rec.getString('status_cadastro') || 'confirmado',
      codigo_confirmacao: rec.getString('codigo_confirmacao'),
      confirmado_em: rec.getString('confirmado_em'),
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      cadastrado_por: rec.getString('cadastrado_por'),
      observacoes: rec.getString('observacoes'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const identificador = (data.identificador || data.email || '').trim().toLowerCase()
  const senha = (data.senha || '').trim()

  if (!identificador || !senha) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'Por favor, informe seu e-mail (ou usuário) e senha.',
    })
  }

  try {
    const records = $app.findRecordsByFilter(
      'sistema_usuarios',
      'email = {:email}',
      '-created',
      1,
      0,
      { email: identificador },
    )

    if (!records || records.length === 0) {
      return e.json(401, {
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos. Verifique suas credenciais de acesso ADECONT.',
      })
    }

    const user = records[0]

    if (!user.getBool('ativo')) {
      return e.json(403, {
        sucesso: false,
        mensagem:
          'Este usuário está inativo no sistema. Entre em contato com o Administrador ADECONT.',
      })
    }

    const statusCadastro = user.getString('status_cadastro') || 'confirmado'
    if (statusCadastro === 'pendente_confirmacao') {
      return e.json(403, {
        sucesso: false,
        pendente_confirmacao: true,
        mensagem:
          'Seu cadastro está pendente de confirmação. Utilize o código de confirmação recebido por WhatsApp ou e-mail para concluir a ativação.',
        codigo_confirmacao: user.getString('codigo_confirmacao'),
        email: user.getString('email'),
      })
    }

    const salt = user.getString('senha_salt') || ''
    const hashSalvo = user.getString('senha_hash') || ''
    const hashDigitado = $security.sha256(senha + salt)

    if (!hashSalvo || hashDigitado !== hashSalvo) {
      return e.json(401, {
        sucesso: false,
        mensagem: 'E-mail ou senha incorretos. Verifique suas credenciais de acesso ADECONT.',
      })
    }

    const usuarioFormatado = sanitizar(user)
    return e.json(200, {
      sucesso: true,
      mensagem: 'Login realizado com sucesso. Bem-vindo(a), ' + usuarioFormatado.nome + '!',
      usuario: usuarioFormatado,
    })
  } catch (err) {
    console.log('Erro no login sistema_usuarios: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao processar login. Tente novamente em instantes.',
    })
  }
})

// -------------------------------------------------------------
// 2. ROTA PÚBLICA DE CONFIRMAÇÃO POR CÓDIGO
// POST /backend/v1/sistema-usuarios/confirmar-codigo
// -------------------------------------------------------------
routerAdd('POST', '/backend/v1/sistema-usuarios/confirmar-codigo', (e) => {
  const sanitizar = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      cargo: rec.getString('cargo'),
      departamento: rec.getString('departamento'),
      nivel: rec.getString('nivel'),
      nivel_customizado_id: rec.getString('nivel_customizado_id'),
      nivel_customizado_nome: rec.getString('nivel_customizado_nome'),
      status_cadastro: rec.getString('status_cadastro') || 'confirmado',
      codigo_confirmacao: rec.getString('codigo_confirmacao'),
      confirmado_em: rec.getString('confirmado_em'),
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      cadastrado_por: rec.getString('cadastrado_por'),
      observacoes: rec.getString('observacoes'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const codigo = (data.codigo || '').trim().toUpperCase()
  const email = (data.email || '').trim().toLowerCase()

  if (!codigo) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'Por favor, informe o código de confirmação recebido.',
    })
  }

  try {
    let filter = 'codigo_confirmacao = {:codigo}'
    const params = { codigo: codigo }
    if (email) {
      filter += ' && email = {:email}'
      params.email = email
    }

    const records = $app.findRecordsByFilter('sistema_usuarios', filter, '-created', 1, 0, params)
    if (!records || records.length === 0) {
      return e.json(404, {
        sucesso: false,
        mensagem:
          'Código de confirmação não encontrado ou inválido. Verifique a mensagem recebida.',
      })
    }

    const user = records[0]
    user.set('status_cadastro', 'confirmado')
    user.set('confirmado_em', new Date().toISOString())
    $app.save(user)

    return e.json(200, {
      sucesso: true,
      mensagem:
        'Cadastro de ' +
        user.getString('nome') +
        ' confirmado com sucesso! O acesso está liberado para login.',
      usuario: sanitizar(user),
    })
  } catch (err) {
    console.log('Erro ao confirmar código sistema_usuarios: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao processar confirmação. Tente novamente em instantes.',
    })
  }
})

// -------------------------------------------------------------
// 3. CONFIRMAÇÃO DIRETA PELO ADMINISTRADOR (com token do painel)
// POST /backend/v1/sistema-usuarios/confirmar-admin
// -------------------------------------------------------------
routerAdd('POST', '/backend/v1/sistema-usuarios/confirmar-admin', (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem:
        'Token do painel inválido ou ausente. Operação restrita a administradores autorizados.',
    })
  }

  const sanitizar = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      cargo: rec.getString('cargo'),
      departamento: rec.getString('departamento'),
      nivel: rec.getString('nivel'),
      nivel_customizado_id: rec.getString('nivel_customizado_id'),
      nivel_customizado_nome: rec.getString('nivel_customizado_nome'),
      status_cadastro: rec.getString('status_cadastro') || 'confirmado',
      codigo_confirmacao: rec.getString('codigo_confirmacao'),
      confirmado_em: rec.getString('confirmado_em'),
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      cadastrado_por: rec.getString('cadastrado_por'),
      observacoes: rec.getString('observacoes'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const id = (data.id || '').trim()

  if (!id) {
    return e.json(400, { sucesso: false, mensagem: 'ID do usuário não informado.' })
  }

  try {
    const user = $app.findRecordById('sistema_usuarios', id)
    user.set('status_cadastro', 'confirmado')
    user.set('confirmado_em', new Date().toISOString())
    $app.save(user)

    return e.json(200, {
      sucesso: true,
      mensagem: 'Usuário ' + user.getString('nome') + ' confirmado com sucesso pelo administrador.',
      usuario: sanitizar(user),
    })
  } catch (err) {
    return e.json(404, {
      sucesso: false,
      mensagem: 'Usuário não encontrado para confirmação: ' + err,
    })
  }
})

// -------------------------------------------------------------
// 4. LISTAR USUÁRIOS (com token do painel)
// GET /backend/v1/sistema-usuarios
// -------------------------------------------------------------
routerAdd('GET', '/backend/v1/sistema-usuarios', (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem:
        'Token do painel inválido ou ausente. Informe o token corporativo para carregar os usuários.',
    })
  }

  const sanitizar = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      cargo: rec.getString('cargo'),
      departamento: rec.getString('departamento'),
      nivel: rec.getString('nivel'),
      nivel_customizado_id: rec.getString('nivel_customizado_id'),
      nivel_customizado_nome: rec.getString('nivel_customizado_nome'),
      status_cadastro: rec.getString('status_cadastro') || 'confirmado',
      codigo_confirmacao: rec.getString('codigo_confirmacao'),
      confirmado_em: rec.getString('confirmado_em'),
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      cadastrado_por: rec.getString('cadastrado_por'),
      observacoes: rec.getString('observacoes'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  try {
    const records = $app.findRecordsByFilter('sistema_usuarios', '', '-created', 100, 0, {})
    const lista = records.map(sanitizar)

    return e.json(200, {
      sucesso: true,
      total: lista.length,
      usuarios: lista,
    })
  } catch (err) {
    console.log('Erro ao listar sistema_usuarios: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Erro ao consultar usuários no backend: ' + err,
      usuarios: [],
    })
  }
})

// -------------------------------------------------------------
// 5. CADASTRAR NOVO USUÁRIO (com token do painel)
// POST /backend/v1/sistema-usuarios
// -------------------------------------------------------------
routerAdd('POST', '/backend/v1/sistema-usuarios', (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem: 'Token do painel inválido ou ausente. Não é possível cadastrar sem autorização.',
    })
  }

  const sanitizar = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      cargo: rec.getString('cargo'),
      departamento: rec.getString('departamento'),
      nivel: rec.getString('nivel'),
      nivel_customizado_id: rec.getString('nivel_customizado_id'),
      nivel_customizado_nome: rec.getString('nivel_customizado_nome'),
      status_cadastro: rec.getString('status_cadastro') || 'confirmado',
      codigo_confirmacao: rec.getString('codigo_confirmacao'),
      confirmado_em: rec.getString('confirmado_em'),
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      cadastrado_por: rec.getString('cadastrado_por'),
      observacoes: rec.getString('observacoes'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const nome = (data.nome || '').trim()
  const email = (data.email || '').trim().toLowerCase()
  const cargo = (data.cargo || '').trim()
  const departamento = (data.departamento || '').trim()
  const nivel = (data.nivel || 'Leitor').trim()
  const nivelCustomizadoId = (data.nivel_customizado_id || '').trim()
  const nivelCustomizadoNome = (data.nivel_customizado_nome || '').trim()
  const senha = (data.senha || '').trim()

  if (!nome || !email) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'Nome completo e e-mail corporativo são obrigatórios.',
    })
  }

  if (!email.includes('@')) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'Informe um endereço de e-mail válido.',
    })
  }

  try {
    const existentes = $app.findRecordsByFilter(
      'sistema_usuarios',
      'email = {:email}',
      '-created',
      1,
      0,
      { email: email },
    )
    if (existentes && existentes.length > 0) {
      return e.json(409, {
        sucesso: false,
        mensagem: 'Já existe um usuário cadastrado com o e-mail ' + email + '.',
      })
    }

    const col = $app.findCollectionByNameOrId('sistema_usuarios')
    const rec = new Record(col)

    rec.set('nome', nome)
    rec.set('email', email)
    rec.set('cargo', cargo)
    rec.set('departamento', departamento)
    rec.set('nivel', nivel)
    rec.set('nivel_customizado_id', nivelCustomizadoId)
    rec.set('nivel_customizado_nome', nivelCustomizadoNome)
    rec.set('ativo', data.ativo !== false)

    // Senha
    const senhaFinal = senha || 'Adecont@' + Math.floor(1000 + Math.random() * 9000)
    const salt = 'adecont_salt_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
    const hash = $security.sha256(senhaFinal + salt)
    rec.set('senha_salt', salt)
    rec.set('senha_hash', hash)

    // Código de confirmação
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let codigoConfirmacao = 'ADEC-'
    for (let i = 0; i < 6; i++) {
      codigoConfirmacao += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    rec.set('status_cadastro', 'pendente_confirmacao')
    rec.set('codigo_confirmacao', codigoConfirmacao)
    rec.set('confirmado_em', '')

    // Permissões por segmento
    rec.set('perm_juridico_acesso', data.perm_juridico_acesso !== false)
    rec.set('perm_juridico_tipo', data.perm_juridico_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_tributario_acesso', data.perm_tributario_acesso !== false)
    rec.set('perm_tributario_tipo', data.perm_tributario_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_contabil_acesso', data.perm_contabil_acesso !== false)
    rec.set('perm_contabil_tipo', data.perm_contabil_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_administrativo_acesso', data.perm_administrativo_acesso === true)
    rec.set(
      'perm_administrativo_tipo',
      data.perm_administrativo_tipo === 'editar' ? 'editar' : 'consultar',
    )

    rec.set('cadastrado_por', (data.cadastrado_por || 'Administrador').trim())
    rec.set('observacoes', (data.observacoes || '').trim())

    $app.save(rec)

    const usuarioSalvo = sanitizar(rec)
    return e.json(201, {
      sucesso: true,
      mensagem:
        'Usuário cadastrado com sucesso! Envie a mensagem com o código de confirmação para liberar o acesso.',
      usuario: usuarioSalvo,
      senha_temporaria: senhaFinal,
      codigo_confirmacao: codigoConfirmacao,
    })
  } catch (err) {
    console.log('Erro ao cadastrar sistema_usuarios: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao salvar usuário no backend: ' + err,
    })
  }
})

// -------------------------------------------------------------
// 6. EDITAR USUÁRIO - suporta tanto /backend/v1/sistema-usuarios/:id quanto /backend/v1/sistema-usuarios
// -------------------------------------------------------------
const editarUsuarioHandler = (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem: 'Token do painel inválido ou ausente.',
    })
  }

  const sanitizar = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      email: rec.getString('email'),
      cargo: rec.getString('cargo'),
      departamento: rec.getString('departamento'),
      nivel: rec.getString('nivel'),
      nivel_customizado_id: rec.getString('nivel_customizado_id'),
      nivel_customizado_nome: rec.getString('nivel_customizado_nome'),
      status_cadastro: rec.getString('status_cadastro') || 'confirmado',
      codigo_confirmacao: rec.getString('codigo_confirmacao'),
      confirmado_em: rec.getString('confirmado_em'),
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      cadastrado_por: rec.getString('cadastrado_por'),
      observacoes: rec.getString('observacoes'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const paramId = (e.request && e.request.pathParam && e.request.pathParam('id')) || ''
  const id = (paramId || data.id || '').trim()

  if (!id) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'ID do usuário é obrigatório para atualização.',
    })
  }

  try {
    const rec = $app.findRecordById('sistema_usuarios', id)

    if (data.nome !== undefined) rec.set('nome', String(data.nome).trim())
    if (data.cargo !== undefined) rec.set('cargo', String(data.cargo).trim())
    if (data.departamento !== undefined) rec.set('departamento', String(data.departamento).trim())
    if (data.nivel !== undefined) rec.set('nivel', String(data.nivel).trim())
    if (data.nivel_customizado_id !== undefined)
      rec.set('nivel_customizado_id', String(data.nivel_customizado_id).trim())
    if (data.nivel_customizado_nome !== undefined)
      rec.set('nivel_customizado_nome', String(data.nivel_customizado_nome).trim())
    if (data.ativo !== undefined) rec.set('ativo', Boolean(data.ativo))
    if (data.status_cadastro !== undefined)
      rec.set('status_cadastro', String(data.status_cadastro).trim())

    if (data.senha && String(data.senha).trim().length > 0) {
      const novaSenha = String(data.senha).trim()
      const salt = 'adecont_salt_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
      const hash = $security.sha256(novaSenha + salt)
      rec.set('senha_salt', salt)
      rec.set('senha_hash', hash)
    }

    if (data.perm_juridico_acesso !== undefined)
      rec.set('perm_juridico_acesso', Boolean(data.perm_juridico_acesso))
    if (data.perm_juridico_tipo !== undefined)
      rec.set('perm_juridico_tipo', data.perm_juridico_tipo === 'editar' ? 'editar' : 'consultar')
    if (data.perm_tributario_acesso !== undefined)
      rec.set('perm_tributario_acesso', Boolean(data.perm_tributario_acesso))
    if (data.perm_tributario_tipo !== undefined)
      rec.set(
        'perm_tributario_tipo',
        data.perm_tributario_tipo === 'editar' ? 'editar' : 'consultar',
      )
    if (data.perm_contabil_acesso !== undefined)
      rec.set('perm_contabil_acesso', Boolean(data.perm_contabil_acesso))
    if (data.perm_contabil_tipo !== undefined)
      rec.set('perm_contabil_tipo', data.perm_contabil_tipo === 'editar' ? 'editar' : 'consultar')
    if (data.perm_administrativo_acesso !== undefined)
      rec.set('perm_administrativo_acesso', Boolean(data.perm_administrativo_acesso))
    if (data.perm_administrativo_tipo !== undefined)
      rec.set(
        'perm_administrativo_tipo',
        data.perm_administrativo_tipo === 'editar' ? 'editar' : 'consultar',
      )
    if (data.observacoes !== undefined) rec.set('observacoes', String(data.observacoes).trim())

    $app.save(rec)

    return e.json(200, {
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso.',
      usuario: sanitizar(rec),
    })
  } catch (err) {
    console.log('Erro ao atualizar sistema_usuarios: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao atualizar usuário: ' + err,
    })
  }
}

routerAdd('PUT', '/backend/v1/sistema-usuarios', editarUsuarioHandler)
routerAdd('PUT', '/backend/v1/sistema-usuarios/{id}', editarUsuarioHandler)
routerAdd('PATCH', '/backend/v1/sistema-usuarios/{id}', editarUsuarioHandler)

// -------------------------------------------------------------
// 7. EXCLUIR USUÁRIO
// -------------------------------------------------------------
const excluirUsuarioHandler = (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem: 'Token do painel inválido ou ausente.',
    })
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const paramId = (e.request && e.request.pathParam && e.request.pathParam('id')) || ''
  const id = (paramId || data.id || '').trim()

  if (!id) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'ID do usuário é obrigatório.',
    })
  }

  try {
    const rec = $app.findRecordById('sistema_usuarios', id)
    if (rec.getString('email') === 'joildo@adecont.com.br') {
      return e.json(403, {
        sucesso: false,
        mensagem: 'O usuário Administrador Principal da ADECONT não pode ser excluído.',
      })
    }

    $app.delete(rec)
    return e.json(200, {
      sucesso: true,
      mensagem: 'Usuário excluído com sucesso.',
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao excluir usuário: ' + err,
    })
  }
}

routerAdd('DELETE', '/backend/v1/sistema-usuarios', excluirUsuarioHandler)
routerAdd('DELETE', '/backend/v1/sistema-usuarios/{id}', excluirUsuarioHandler)

// -------------------------------------------------------------
// 8. CRUD NÍVEIS CUSTOMIZÁVEIS
// -------------------------------------------------------------

// GET /backend/v1/sistema-niveis-acesso
routerAdd('GET', '/backend/v1/sistema-niveis-acesso', (e) => {
  const sanitizarNivel = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      descricao: rec.getString('descricao'),
      cor_badge: rec.getString('cor_badge') || 'bg-amber-100 text-amber-800 border-amber-300',
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      criado_por: rec.getString('criado_por'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  try {
    const records = $app.findRecordsByFilter('sistema_niveis_acesso', '', 'nome', 100, 0, {})
    const lista = records.map(sanitizarNivel)

    return e.json(200, {
      sucesso: true,
      total: lista.length,
      niveis: lista,
    })
  } catch (err) {
    console.log('Erro ao listar sistema_niveis_acesso: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Erro ao consultar níveis customizados: ' + err,
      niveis: [],
    })
  }
})

// POST /backend/v1/sistema-niveis-acesso
routerAdd('POST', '/backend/v1/sistema-niveis-acesso', (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem: 'Token do painel inválido ou ausente. Gravação de níveis restrita.',
    })
  }

  const sanitizarNivel = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      descricao: rec.getString('descricao'),
      cor_badge: rec.getString('cor_badge') || 'bg-amber-100 text-amber-800 border-amber-300',
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      criado_por: rec.getString('criado_por'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const nome = (data.nome || '').trim()
  const descricao = (data.descricao || '').trim()

  if (!nome) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'Nome do nível personalizado é obrigatório.',
    })
  }

  try {
    const col = $app.findCollectionByNameOrId('sistema_niveis_acesso')
    const rec = new Record(col)

    rec.set('nome', nome)
    rec.set('descricao', descricao)
    rec.set('cor_badge', data.cor_badge || 'bg-amber-100 text-amber-800 border-amber-300')
    rec.set('ativo', data.ativo !== false)

    rec.set('perm_juridico_acesso', Boolean(data.perm_juridico_acesso))
    rec.set('perm_juridico_tipo', data.perm_juridico_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_tributario_acesso', Boolean(data.perm_tributario_acesso))
    rec.set('perm_tributario_tipo', data.perm_tributario_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_contabil_acesso', Boolean(data.perm_contabil_acesso))
    rec.set('perm_contabil_tipo', data.perm_contabil_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_administrativo_acesso', Boolean(data.perm_administrativo_acesso))
    rec.set(
      'perm_administrativo_tipo',
      data.perm_administrativo_tipo === 'editar' ? 'editar' : 'consultar',
    )
    rec.set('criado_por', data.criado_por || 'Administrador ADECONT')

    $app.save(rec)

    return e.json(201, {
      sucesso: true,
      mensagem: 'Nível customizado "' + nome + '" criado com sucesso.',
      nivel: sanitizarNivel(rec),
    })
  } catch (err) {
    console.log('Erro ao criar nível customizado: ' + err)
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao salvar nível customizado: ' + err,
    })
  }
})

// PUT /backend/v1/sistema-niveis-acesso e PUT /backend/v1/sistema-niveis-acesso/{id}
const editarNivelHandler = (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem: 'Token do painel inválido ou ausente.',
    })
  }

  const sanitizarNivel = (rec) => {
    return {
      id: rec.id,
      nome: rec.getString('nome'),
      descricao: rec.getString('descricao'),
      cor_badge: rec.getString('cor_badge') || 'bg-amber-100 text-amber-800 border-amber-300',
      ativo: rec.getBool('ativo'),
      perm_juridico_acesso: rec.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: rec.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: rec.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: rec.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: rec.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: rec.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: rec.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: rec.getString('perm_administrativo_tipo') || 'consultar',
      criado_por: rec.getString('criado_por'),
      created: rec.getString('created'),
      updated: rec.getString('updated'),
    }
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const paramId = (e.request && e.request.pathParam && e.request.pathParam('id')) || ''
  const id = (paramId || data.id || '').trim()

  if (!id) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'ID do nível é obrigatório.',
    })
  }

  try {
    const rec = $app.findRecordById('sistema_niveis_acesso', id)

    if (data.nome !== undefined) rec.set('nome', String(data.nome).trim())
    if (data.descricao !== undefined) rec.set('descricao', String(data.descricao).trim())
    if (data.cor_badge !== undefined) rec.set('cor_badge', String(data.cor_badge).trim())
    if (data.ativo !== undefined) rec.set('ativo', Boolean(data.ativo))

    if (data.perm_juridico_acesso !== undefined)
      rec.set('perm_juridico_acesso', Boolean(data.perm_juridico_acesso))
    if (data.perm_juridico_tipo !== undefined)
      rec.set('perm_juridico_tipo', data.perm_juridico_tipo === 'editar' ? 'editar' : 'consultar')
    if (data.perm_tributario_acesso !== undefined)
      rec.set('perm_tributario_acesso', Boolean(data.perm_tributario_acesso))
    if (data.perm_tributario_tipo !== undefined)
      rec.set(
        'perm_tributario_tipo',
        data.perm_tributario_tipo === 'editar' ? 'editar' : 'consultar',
      )
    if (data.perm_contabil_acesso !== undefined)
      rec.set('perm_contabil_acesso', Boolean(data.perm_contabil_acesso))
    if (data.perm_contabil_tipo !== undefined)
      rec.set('perm_contabil_tipo', data.perm_contabil_tipo === 'editar' ? 'editar' : 'consultar')
    if (data.perm_administrativo_acesso !== undefined)
      rec.set('perm_administrativo_acesso', Boolean(data.perm_administrativo_acesso))
    if (data.perm_administrativo_tipo !== undefined)
      rec.set(
        'perm_administrativo_tipo',
        data.perm_administrativo_tipo === 'editar' ? 'editar' : 'consultar',
      )

    $app.save(rec)

    return e.json(200, {
      sucesso: true,
      mensagem: 'Nível customizado atualizado com sucesso.',
      nivel: sanitizarNivel(rec),
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao atualizar nível customizado: ' + err,
    })
  }
}

routerAdd('PUT', '/backend/v1/sistema-niveis-acesso', editarNivelHandler)
routerAdd('PUT', '/backend/v1/sistema-niveis-acesso/{id}', editarNivelHandler)
routerAdd('PATCH', '/backend/v1/sistema-niveis-acesso/{id}', editarNivelHandler)

// DELETE /backend/v1/sistema-niveis-acesso e DELETE /backend/v1/sistema-niveis-acesso/{id}
const excluirNivelHandler = (e) => {
  const tokenEsperado = $os.getenv('SIMUL_PAINEL_TOKEN')
  const tokenRecebido = e.request.header.get('X-Painel-Token')
  if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
    return e.json(401, {
      sucesso: false,
      mensagem: 'Token do painel inválido ou ausente.',
    })
  }

  const data = (e.requestInfo && e.requestInfo().body) || {}
  const paramId = (e.request && e.request.pathParam && e.request.pathParam('id')) || ''
  const id = (paramId || data.id || '').trim()

  if (!id) {
    return e.json(400, {
      sucesso: false,
      mensagem: 'ID do nível é obrigatório.',
    })
  }

  try {
    const rec = $app.findRecordById('sistema_niveis_acesso', id)
    $app.delete(rec)

    return e.json(200, {
      sucesso: true,
      mensagem: 'Nível customizado excluído com sucesso.',
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      mensagem: 'Falha ao excluir nível customizado: ' + err,
    })
  }
}

routerAdd('DELETE', '/backend/v1/sistema-niveis-acesso', excluirNivelHandler)
routerAdd('DELETE', '/backend/v1/sistema-niveis-acesso/{id}', excluirNivelHandler)
