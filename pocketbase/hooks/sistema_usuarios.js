/**
 * SISTEMA USUÁRIOS & PERMISSÕES ADECONT
 * =====================================
 * CRUD seguro de usuários do sistema, níveis de acesso e matriz de permissões
 * pelos 4 segmentos da plataforma: Jurídico, Tributário, Contábil e Administrativo.
 *
 * Protegido com o token do painel (SIMUL_PAINEL_TOKEN) via header X-Painel-Token.
 */

routerAdd('GET', '/backend/v1/sistema-usuarios', (c) => {
  try {
    const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    const token = c.request.header.get('X-Painel-Token') || ''
    if (!tokenEsperado || token !== tokenEsperado) {
      return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
    }

    const query = c.requestInfo().query || {}
    const q = String(query.q || '')
      .trim()
      .toLowerCase()
    const nivel = query.nivel || ''
    const situacao = query.situacao || '' // 'ativo', 'inativo', ou ''
    const limiteBruto = parseInt(query.limite || '200', 10)
    const limite = limiteBruto > 0 && limiteBruto <= 500 ? limiteBruto : 200

    const filtros = []
    if (nivel) filtros.push('nivel = {:nivel}')
    if (situacao === 'ativo') filtros.push('ativo = true')
    if (situacao === 'inativo') filtros.push('ativo = false')

    const params = { nivel: nivel }
    const filtro = filtros.join(' && ')

    let registros = []
    try {
      registros = $app.findRecordsByFilter('sistema_usuarios', filtro, 'nome', limite, 0, params)
    } catch (_) {
      registros = $app.findRecordsByFilter('sistema_usuarios', '', 'nome', limite, 0, {})
    }

    const itens = registros.map((r) => ({
      id: r.id,
      nome: r.getString('nome'),
      email: r.getString('email'),
      cargo: r.getString('cargo'),
      nivel: r.getString('nivel'),
      ativo: r.getBool('ativo'),
      perm_juridico_acesso: r.getBool('perm_juridico_acesso'),
      perm_juridico_tipo: r.getString('perm_juridico_tipo') || 'consultar',
      perm_tributario_acesso: r.getBool('perm_tributario_acesso'),
      perm_tributario_tipo: r.getString('perm_tributario_tipo') || 'consultar',
      perm_contabil_acesso: r.getBool('perm_contabil_acesso'),
      perm_contabil_tipo: r.getString('perm_contabil_tipo') || 'consultar',
      perm_administrativo_acesso: r.getBool('perm_administrativo_acesso'),
      perm_administrativo_tipo: r.getString('perm_administrativo_tipo') || 'consultar',
      observacoes: r.getString('observacoes'),
      cadastrado_por: r.getString('cadastrado_por'),
      created: r.getString('created'),
      updated: r.getString('updated'),
    }))

    let filtrados = itens
    if (q) {
      filtrados = itens.filter((u) => {
        const t = (u.nome + ' ' + u.email + ' ' + u.cargo + ' ' + u.observacoes).toLowerCase()
        return t.indexOf(q) >= 0
      })
    }

    const ativosCount = itens.filter((u) => u.ativo).length
    const inativosCount = itens.length - ativosCount

    return c.json(200, {
      ok: true,
      total: filtrados.length,
      total_geral: itens.length,
      ativos: ativosCount,
      inativos: inativosCount,
      usuarios: filtrados,
    })
  } catch (err) {
    return c.json(500, { ok: false, erro: 'Falha ao listar usuários: ' + String(err) })
  }
})

routerAdd('POST', '/backend/v1/sistema-usuarios', (c) => {
  try {
    const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    const token = c.request.header.get('X-Painel-Token') || ''
    if (!tokenEsperado || token !== tokenEsperado) {
      return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
    }

    const body = c.requestInfo().body || {}
    const nome = String(body.nome || '').trim()
    const email = String(body.email || '')
      .trim()
      .toLowerCase()
    const cargo = String(body.cargo || '').trim()
    const nivel = body.nivel || 'Leitor'
    const ativo = body.ativo !== false
    const observacoes = String(body.observacoes || '').trim()
    const cadastrado_por = String(body.cadastrado_por || 'Painel ADECONT').trim()

    if (!nome) {
      return c.json(400, { ok: false, erro: 'Nome completo é obrigatório.' })
    }
    if (!email || email.indexOf('@') < 1) {
      return c.json(400, { ok: false, erro: 'E-mail válido é obrigatório.' })
    }

    const niveisValidos = ['Administrador', 'Editor', 'Leitor']
    const nivelFinal = niveisValidos.indexOf(nivel) >= 0 ? nivel : 'Leitor'

    // Verifica duplicidade de e-mail
    try {
      const existe = $app.findFirstRecordByFilter('sistema_usuarios', 'email = {:email}', {
        email: email,
      })
      if (existe) {
        return c.json(400, {
          ok: false,
          erro: 'Já existe um usuário cadastrado com o e-mail ' + email + '.',
        })
      }
    } catch (_) {
      // Nenhum registro encontrado -> seguro continuar
    }

    const col = $app.findCollectionByNameOrId('sistema_usuarios')
    const rec = new Record(col)
    rec.set('nome', nome)
    rec.set('email', email)
    rec.set('cargo', cargo)
    rec.set('nivel', nivelFinal)
    rec.set('ativo', ativo)
    rec.set('perm_juridico_acesso', body.perm_juridico_acesso === true)
    rec.set('perm_juridico_tipo', body.perm_juridico_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_tributario_acesso', body.perm_tributario_acesso === true)
    rec.set('perm_tributario_tipo', body.perm_tributario_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_contabil_acesso', body.perm_contabil_acesso === true)
    rec.set('perm_contabil_tipo', body.perm_contabil_tipo === 'editar' ? 'editar' : 'consultar')
    rec.set('perm_administrativo_acesso', body.perm_administrativo_acesso === true)
    rec.set(
      'perm_administrativo_tipo',
      body.perm_administrativo_tipo === 'editar' ? 'editar' : 'consultar',
    )
    rec.set('observacoes', observacoes)
    rec.set('cadastrado_por', cadastrado_por)

    $app.save(rec)

    return c.json(200, {
      ok: true,
      id: rec.id,
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: {
        id: rec.id,
        nome: rec.getString('nome'),
        email: rec.getString('email'),
        cargo: rec.getString('cargo'),
        nivel: rec.getString('nivel'),
        ativo: rec.getBool('ativo'),
      },
    })
  } catch (err) {
    return c.json(500, { ok: false, erro: 'Falha ao cadastrar usuário: ' + String(err) })
  }
})

routerAdd('PATCH', '/backend/v1/sistema-usuarios/{id}', (c) => {
  try {
    const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    const token = c.request.header.get('X-Painel-Token') || ''
    if (!tokenEsperado || token !== tokenEsperado) {
      return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
    }

    const id = c.request.pathValue('id')
    const rec = $app.findRecordById('sistema_usuarios', id)
    const body = c.requestInfo().body || {}

    if (body.nome !== undefined) {
      const n = String(body.nome).trim()
      if (!n) return c.json(400, { ok: false, erro: 'Nome não pode ser vazio.' })
      rec.set('nome', n)
    }

    if (body.email !== undefined) {
      const e = String(body.email).trim().toLowerCase()
      if (!e || e.indexOf('@') < 1) {
        return c.json(400, { ok: false, erro: 'E-mail inválido.' })
      }
      // Se alterou e-mail, verificar unicidade
      if (e !== rec.getString('email')) {
        try {
          const outro = $app.findFirstRecordByFilter(
            'sistema_usuarios',
            'email = {:email} && id != {:id}',
            {
              email: e,
              id: id,
            },
          )
          if (outro) {
            return c.json(400, { ok: false, erro: 'E-mail já está em uso por outro usuário.' })
          }
        } catch (_) {}
      }
      rec.set('email', e)
    }

    if (body.cargo !== undefined) rec.set('cargo', String(body.cargo).trim())
    if (body.nivel !== undefined) {
      const niveisValidos = ['Administrador', 'Editor', 'Leitor']
      if (niveisValidos.indexOf(body.nivel) >= 0) rec.set('nivel', body.nivel)
    }
    if (body.ativo !== undefined) rec.set('ativo', body.ativo === true)

    if (body.perm_juridico_acesso !== undefined)
      rec.set('perm_juridico_acesso', body.perm_juridico_acesso === true)
    if (body.perm_juridico_tipo !== undefined) {
      rec.set('perm_juridico_tipo', body.perm_juridico_tipo === 'editar' ? 'editar' : 'consultar')
    }

    if (body.perm_tributario_acesso !== undefined)
      rec.set('perm_tributario_acesso', body.perm_tributario_acesso === true)
    if (body.perm_tributario_tipo !== undefined) {
      rec.set(
        'perm_tributario_tipo',
        body.perm_tributario_tipo === 'editar' ? 'editar' : 'consultar',
      )
    }

    if (body.perm_contabil_acesso !== undefined)
      rec.set('perm_contabil_acesso', body.perm_contabil_acesso === true)
    if (body.perm_contabil_tipo !== undefined) {
      rec.set('perm_contabil_tipo', body.perm_contabil_tipo === 'editar' ? 'editar' : 'consultar')
    }

    if (body.perm_administrativo_acesso !== undefined)
      rec.set('perm_administrativo_acesso', body.perm_administrativo_acesso === true)
    if (body.perm_administrativo_tipo !== undefined) {
      rec.set(
        'perm_administrativo_tipo',
        body.perm_administrativo_tipo === 'editar' ? 'editar' : 'consultar',
      )
    }

    if (body.observacoes !== undefined) rec.set('observacoes', String(body.observacoes).trim())

    $app.save(rec)

    return c.json(200, {
      ok: true,
      id: rec.id,
      mensagem: 'Usuário atualizado com sucesso!',
      usuario: {
        id: rec.id,
        nome: rec.getString('nome'),
        email: rec.getString('email'),
        nivel: rec.getString('nivel'),
        ativo: rec.getBool('ativo'),
      },
    })
  } catch (err) {
    return c.json(500, { ok: false, erro: 'Falha ao atualizar usuário: ' + String(err) })
  }
})

routerAdd('DELETE', '/backend/v1/sistema-usuarios/{id}', (c) => {
  try {
    const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
    const token = c.request.header.get('X-Painel-Token') || ''
    if (!tokenEsperado || token !== tokenEsperado) {
      return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
    }

    const id = c.request.pathValue('id')
    const rec = $app.findRecordById('sistema_usuarios', id)

    // Proteção: não excluir o único administrador ADECONT inicial caso seja o último
    const email = rec.getString('email')
    if (email === 'joildo@adecont.com.br') {
      const admins = $app.findRecordsByFilter(
        'sistema_usuarios',
        'nivel = "Administrador" && ativo = true',
        '',
        10,
        0,
        {},
      )
      if (admins.length <= 1) {
        return c.json(400, {
          ok: false,
          erro: 'O administrador titular joildo@adecont.com.br não pode ser excluído para evitar bloqueio da plataforma. É possível desativá-lo ou alterar suas permissões.',
        })
      }
    }

    $app.delete(rec)

    return c.json(200, { ok: true, id: id, mensagem: 'Usuário removido com sucesso.' })
  } catch (err) {
    return c.json(500, { ok: false, erro: 'Falha ao excluir usuário: ' + String(err) })
  }
})
