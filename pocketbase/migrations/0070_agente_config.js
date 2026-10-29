/// <reference path="../pb_data/types.d.ts" />
// 0070 - Destinatários do Agente de Vigilância das Fontes
//
// Guarda quem recebe os avisos do agente. O principal é o diretor; as cópias são
// escolhidas do CADASTRO (clientes do Simulador ou usuários do sistema), e não
// digitadas à mão — assim o e-mail é sempre o mesmo que está cadastrado, e um
// cliente que sai do cadastro deixa de receber sem ninguém precisar lembrar.
//
// Uma coleção com um único registro (id fixo 'config') evita a pergunta "qual
// das linhas vale?".
migrate(
  (app) => {
    const col = new Collection({
      name: 'agente_config',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    // lista de cópias: [{ email, nome, origem }] — origem = 'cliente' | 'usuario' | 'manual'
    col.fields.add(new JSONField({ name: 'destinatarios_copia', maxSize: 20000 }))
    // e-mail do destinatário principal (o diretor)
    col.fields.add(new TextField({ name: 'destinatario_principal', max: 200 }))
    col.fields.add(new BoolField({ name: 'enviar_resumo_semanal' }))
    col.fields.add(new TextField({ name: 'atualizado_por', max: 200 }))
    col.fields.add(new AutodateField({ name: 'atualizado_em', onCreate: true, onUpdate: true }))
    app.save(col)

    // registro único com o estado inicial: diretor recebe tudo
    const rec = new Record(col)
    // id fixo: 15+ caracteres é exigência do PocketBase. 'agente_config_01'
    // mantém o registro único sem depender de busca por filtro.
    rec.id = 'agentecfg000001'
    rec.set('destinatario_principal', 'joildo@adecont.com.br')
    rec.set('destinatarios_copia', [])
    rec.set('enviar_resumo_semanal', true)
    rec.set('atualizado_por', 'migração 0070')
    app.save(rec)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('agente_config'))
    } catch (_) {}
  },
)
