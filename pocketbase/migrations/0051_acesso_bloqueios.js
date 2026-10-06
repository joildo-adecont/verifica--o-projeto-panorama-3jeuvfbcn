/// <reference path="../pb_data/types.d.ts" />
// 0051 - Trava de Segurança (Rate Limit + Bloqueio na 3ª tentativa) — Panorama 62493
// Modelo do CEO: porta giratória (limite de acessos por minuto) + chave bloqueada
// após a 3ª tentativa falha; desbloqueio SOMENTE pelo administrador (N4).
migrate(
  (app) => {
    const bloqueios = new Collection({
      name: 'acesso_bloqueios',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })
    bloqueios.fields.add(new TextField({ name: 'chave', required: true, max: 200 }))
    bloqueios.fields.add(new NumberField({ name: 'tentativas', onlyInt: true }))
    bloqueios.fields.add(new BoolField({ name: 'bloqueado' }))
    bloqueios.fields.add(new TextField({ name: 'bloqueado_em', max: 40 }))
    bloqueios.fields.add(new TextField({ name: 'ultimo_comando', max: 40 }))
    bloqueios.fields.add(new TextField({ name: 'ultimo_motivo', max: 400 }))
    // Rate limit: janela de 1 minuto (bucket) e contador de acessos na janela
    bloqueios.fields.add(new TextField({ name: 'janela', max: 40 }))
    bloqueios.fields.add(new NumberField({ name: 'acessos_janela', onlyInt: true }))
    bloqueios.fields.add(new TextField({ name: 'desbloqueado_por', max: 200 }))
    bloqueios.fields.add(new TextField({ name: 'desbloqueado_em', max: 40 }))
    app.save(bloqueios)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('acesso_bloqueios'))
    } catch (_) {}
  },
)
