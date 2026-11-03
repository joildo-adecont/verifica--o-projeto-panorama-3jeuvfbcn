/// <reference path="../pb_data/types.d.ts" />
// 0106 - Cadastro de Usuários do Sistema, Níveis de Acesso e Permissões por Segmento
// Plataforma ADECONT: Jurídico, Tributário, Contábil e Administrativo
migrate(
  (app) => {
    const col = new Collection({
      name: 'sistema_usuarios',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'nome', type: 'text', required: true, max: 200 },
        { name: 'email', type: 'email', required: true },
        { name: 'cargo', type: 'text', max: 120 },
        {
          name: 'nivel',
          type: 'select',
          required: true,
          values: ['Administrador', 'Editor', 'Leitor'],
          maxSelect: 1,
        },
        { name: 'ativo', type: 'bool' },
        // Permissões por Segmento: cada segmento define se tem acesso e o tipo (consultar ou editar)
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
        { name: 'observacoes', type: 'text', max: 1000 },
        { name: 'cadastrado_por', type: 'text', max: 200 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_sistema_usuarios_email ON sistema_usuarios (email)',
        'CREATE INDEX idx_sistema_usuarios_nivel ON sistema_usuarios (nivel)',
        'CREATE INDEX idx_sistema_usuarios_ativo ON sistema_usuarios (ativo)',
      ],
    })
    app.save(col)

    // Seed inicial: Administrador Geral ADECONT para a base não nascer vazia
    try {
      const admin = new Record(col)
      admin.set('nome', 'Administrador ADECONT')
      admin.set('email', 'joildo@adecont.com.br')
      admin.set('cargo', 'Diretor / CEO')
      admin.set('nivel', 'Administrador')
      admin.set('ativo', true)
      admin.set('perm_juridico_acesso', true)
      admin.set('perm_juridico_tipo', 'editar')
      admin.set('perm_tributario_acesso', true)
      admin.set('perm_tributario_tipo', 'editar')
      admin.set('perm_contabil_acesso', true)
      admin.set('perm_contabil_tipo', 'editar')
      admin.set('perm_administrativo_acesso', true)
      admin.set('perm_administrativo_tipo', 'editar')
      admin.set(
        'observacoes',
        'Usuário administrador inicial com acesso total aos 4 segmentos ADECONT.',
      )
      admin.set('cadastrado_por', 'Sistema / Instalação Inicial')
      app.save(admin)
    } catch (e) {
      console.log('Seed administrador ADECONT falhou: ' + e)
    }

    // Seed secundário para demonstração de Editor com escopo
    try {
      const editor = new Record(col)
      editor.set('nome', 'Equipe Contábil & Tributária ADECONT')
      editor.set('email', 'contabil@adecont.com.br')
      editor.set('cargo', 'Analista Contábil Pleno')
      editor.set('nivel', 'Editor')
      editor.set('ativo', true)
      editor.set('perm_juridico_acesso', true)
      editor.set('perm_juridico_tipo', 'consultar')
      editor.set('perm_tributario_acesso', true)
      editor.set('perm_tributario_tipo', 'editar')
      editor.set('perm_contabil_acesso', true)
      editor.set('perm_contabil_tipo', 'editar')
      editor.set('perm_administrativo_acesso', true)
      editor.set('perm_administrativo_tipo', 'consultar')
      editor.set(
        'observacoes',
        'Editor com permissão de alteração nos módulos Contábil e Tributário, e consulta nos demais.',
      )
      editor.set('cadastrado_por', 'Sistema / Instalação Inicial')
      app.save(editor)
    } catch (e) {
      console.log('Seed editor ADECONT falhou: ' + e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('sistema_usuarios')
      app.delete(col)
    } catch (_) {}
  },
)
