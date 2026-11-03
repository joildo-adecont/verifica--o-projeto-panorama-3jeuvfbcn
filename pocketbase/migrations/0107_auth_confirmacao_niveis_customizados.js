/// <reference path="../pb_data/types.d.ts" />
// 0107 - Login com senha, confirmação de cadastro e níveis customizados ADECONT
migrate(
  (app) => {
    // 1. Atualizar coleção sistema_usuarios existente
    const colUsuarios = app.findCollectionByNameOrId('sistema_usuarios')

    // Permitir níveis além dos 3 fixos transformando o select em text ou aceitando valores customizados
    // Em PocketBase, podemos substituir o select por text ou adicionar campos:
    // Para manter retrocompatibilidade e permitir níveis customizados, adicionamos 'nivel_customizado' (text)
    // e os campos de autenticação e confirmação
    if (!colUsuarios.fields.getByName('senha_hash')) {
      colUsuarios.fields.add(new TextField({ name: 'senha_hash', max: 256 }))
    }
    if (!colUsuarios.fields.getByName('senha_salt')) {
      colUsuarios.fields.add(new TextField({ name: 'senha_salt', max: 64 }))
    }
    if (!colUsuarios.fields.getByName('status_cadastro')) {
      // 'confirmado' ou 'pendente_confirmacao'
      colUsuarios.fields.add(new TextField({ name: 'status_cadastro', max: 50 }))
    }
    if (!colUsuarios.fields.getByName('codigo_confirmacao')) {
      colUsuarios.fields.add(new TextField({ name: 'codigo_confirmacao', max: 50 }))
    }
    if (!colUsuarios.fields.getByName('confirmado_em')) {
      colUsuarios.fields.add(new TextField({ name: 'confirmado_em', max: 50 }))
    }
    if (!colUsuarios.fields.getByName('nivel_customizado_nome')) {
      colUsuarios.fields.add(new TextField({ name: 'nivel_customizado_nome', max: 150 }))
    }
    if (!colUsuarios.fields.getByName('nivel_customizado_id')) {
      colUsuarios.fields.add(new TextField({ name: 'nivel_customizado_id', max: 50 }))
    }
    app.save(colUsuarios)

    // 2. Criar coleção de níveis de acesso customizáveis
    try {
      app.findCollectionByNameOrId('sistema_niveis_acesso')
    } catch (_) {
      const colNiveis = new Collection({
        name: 'sistema_niveis_acesso',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
        fields: [
          { name: 'nome', type: 'text', required: true, max: 120 },
          { name: 'descricao', type: 'text', max: 400 },
          { name: 'cor_badge', type: 'text', max: 50 },
          { name: 'ativo', type: 'bool' },
          { name: 'perm_juridico_acesso', type: 'bool' },
          {
            name: 'perm_juridico_tipo',
            type: 'select',
            values: ['consultar', 'editar'],
            maxSelect: 1,
          },
          { name: 'perm_tributario_acesso', type: 'bool' },
          {
            name: 'perm_tributario_tipo',
            type: 'select',
            values: ['consultar', 'editar'],
            maxSelect: 1,
          },
          { name: 'perm_contabil_acesso', type: 'bool' },
          {
            name: 'perm_contabil_tipo',
            type: 'select',
            values: ['consultar', 'editar'],
            maxSelect: 1,
          },
          { name: 'perm_administrativo_acesso', type: 'bool' },
          {
            name: 'perm_administrativo_tipo',
            type: 'select',
            values: ['consultar', 'editar'],
            maxSelect: 1,
          },
          { name: 'criado_por', type: 'text', max: 200 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_niveis_acesso_nome ON sistema_niveis_acesso (nome)'],
      })
      app.save(colNiveis)

      // Seed de nível personalizado modelo
      try {
        const nivelAudit = new Record(colNiveis)
        nivelAudit.set('nome', 'Auditor Fiscal Externo')
        nivelAudit.set(
          'descricao',
          'Acesso completo para consulta e auditoria contábil e tributária, sem permissão de alteração.',
        )
        nivelAudit.set('cor_badge', 'bg-purple-100 text-purple-800 border-purple-300')
        nivelAudit.set('ativo', true)
        nivelAudit.set('perm_juridico_acesso', true)
        nivelAudit.set('perm_juridico_tipo', 'consultar')
        nivelAudit.set('perm_tributario_acesso', true)
        nivelAudit.set('perm_tributario_tipo', 'consultar')
        nivelAudit.set('perm_contabil_acesso', true)
        nivelAudit.set('perm_contabil_tipo', 'consultar')
        nivelAudit.set('perm_administrativo_acesso', false)
        nivelAudit.set('perm_administrativo_tipo', 'consultar')
        nivelAudit.set('criado_por', 'Sistema / Instalação Inicial')
        app.save(nivelAudit)
      } catch (e) {
        console.log('Seed nível customizado falhou: ' + e)
      }
    }

    // 3. Configurar senha inicial e status confirmado para os usuários existentes (ADECONT Administrador)
    // Senha padrão inicial para joildo@adecont.com.br: Adecont@2026
    // Usamos hash sha256 com salt
    try {
      const saltAdmin = 'adecont_salt_2026'
      const hashAdmin = $security.sha256('Adecont@2026' + saltAdmin)

      const usuariosExistentes = app.findRecordsByFilter('sistema_usuarios', '', 'id', 100, 0, {})
      for (let i = 0; i < usuariosExistentes.length; i++) {
        const u = usuariosExistentes[i]
        const email = u.getString('email')
        u.set('status_cadastro', 'confirmado')
        u.set('confirmado_em', new Date().toISOString())
        u.set('codigo_confirmacao', 'ADECONT-CONFIRMADO')

        if (!u.getString('senha_hash')) {
          if (email === 'joildo@adecont.com.br') {
            u.set('senha_salt', saltAdmin)
            u.set('senha_hash', hashAdmin)
          } else {
            // Outros usuários seed: senha inicial 'Adecont@123'
            const salt = 'adecont_salt_' + u.id
            const hash = $security.sha256('Adecont@123' + salt)
            u.set('senha_salt', salt)
            u.set('senha_hash', hash)
          }
          app.save(u)
        }
      }
    } catch (e) {
      console.log('Atualização de senhas dos usuários existentes falhou: ' + e)
    }
  },
  (app) => {
    try {
      const colNiveis = app.findCollectionByNameOrId('sistema_niveis_acesso')
      app.delete(colNiveis)
    } catch (_) {}
  },
)
