/// <reference path="../pb_data/types.d.ts" />
// 0049 - Cadastro de Clientes e Protocolo de Envios do Simulador de Transicao (Panorama)
migrate(
  (app) => {
    const clientes = new Collection({
      name: 'simul_clientes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })
    clientes.fields.add(new TextField({ name: 'nome', required: true, max: 200 }))
    clientes.fields.add(new EmailField({ name: 'email', required: true }))
    clientes.fields.add(new TextField({ name: 'whatsapp', max: 30 }))
    clientes.fields.add(new TextField({ name: 'empresa', max: 200 }))
    clientes.fields.add(new TextField({ name: 'documento', max: 30 }))
    clientes.fields.add(
      new SelectField({ name: 'canal_preferido', maxSelect: 1, values: ['email', 'whatsapp'] }),
    )
    clientes.fields.add(new BoolField({ name: 'is_active' }))
    clientes.fields.add(new TextField({ name: 'observacoes', max: 500 }))
    app.save(clientes)

    const envios = new Collection({
      name: 'simul_envios',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })
    envios.fields.add(
      new RelationField({
        name: 'cliente',
        collectionId: clientes.id,
        maxSelect: 1,
        required: true,
      }),
    )
    envios.fields.add(new TextField({ name: 'protocolo', required: true, max: 40 }))
    envios.fields.add(new TextField({ name: 'canal', max: 20 }))
    envios.fields.add(
      new SelectField({ name: 'status', maxSelect: 1, values: ['ENVIADO', 'RECEBIDO', 'FALHA'] }),
    )
    envios.fields.add(new TextField({ name: 'tema_resumo', max: 2000 }))
    envios.fields.add(new TextField({ name: 'capitulacao_legal', max: 4000 }))
    envios.fields.add(new TextField({ name: 'payload_simulacao', max: 8000 }))
    envios.fields.add(new TextField({ name: 'item_codigo', max: 40 }))
    envios.fields.add(new TextField({ name: 'item_nome', max: 250 }))
    envios.fields.add(new TextField({ name: 'token_recebimento', required: true, max: 80 }))
    envios.fields.add(new TextField({ name: 'destinatario_email', max: 200 }))
    envios.fields.add(new AutodateField({ name: 'enviado_em', onCreate: true }))
    envios.fields.add(new DateField({ name: 'recebido_em' }))
    envios.fields.add(new BoolField({ name: 'email_ok' }))
    app.save(envios)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('simul_envios'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('simul_clientes'))
    } catch (_) {}
  },
)
