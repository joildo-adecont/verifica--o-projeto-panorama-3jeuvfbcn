/// <reference path="../pb_data/types.d.ts" />
// 0050 - Controle de Acesso: niveis de uso (CRUD) e auditoria de comandos (Panorama 62493)
// Modelo do CEO: N1 leitura / N2 +criacao / N3 +edicao / N4 acesso total (chave mestra)
migrate(
  (app) => {
    const usuarios = new Collection({
      name: 'acesso_usuarios',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })
    usuarios.fields.add(new TextField({ name: 'nome', required: true, max: 200 }))
    usuarios.fields.add(new EmailField({ name: 'email', required: true }))
    usuarios.fields.add(
      new SelectField({ name: 'nivel', maxSelect: 1, values: ['1', '2', '3', '4'] }),
    )
    usuarios.fields.add(new BoolField({ name: 'is_active' }))
    usuarios.fields.add(new TextField({ name: 'observacoes', max: 500 }))
    usuarios.fields.add(new TextField({ name: 'atualizado_por', max: 200 }))
    usuarios.fields.add(
      new AutodateField({ name: 'atualizado_em', onCreate: true, onUpdate: true }),
    )
    app.save(usuarios)

    const cmds = new Collection({
      name: 'acesso_comandos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })
    cmds.fields.add(new TextField({ name: 'comando', required: true, max: 40 }))
    cmds.fields.add(new TextField({ name: 'descricao', max: 400 }))
    cmds.fields.add(
      new SelectField({ name: 'nivel_minimo', maxSelect: 1, values: ['1', '2', '3', '4'] }),
    )
    cmds.fields.add(new TextField({ name: 'ator_email', max: 200 }))
    cmds.fields.add(new TextField({ name: 'resultado', max: 40 }))
    cmds.fields.add(new TextField({ name: 'detalhe', max: 1000 }))
    cmds.fields.add(new AutodateField({ name: 'quando', onCreate: true }))
    app.save(cmds)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('acesso_comandos'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('acesso_usuarios'))
    } catch (_) {}
  },
)
