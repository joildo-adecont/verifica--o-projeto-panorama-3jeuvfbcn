/// <reference path="../pb_data/types.d.ts" />

/**
 * 0109 — Qualificação de usuários por departamento (ADECONT)
 * Adiciona o campo "departamento" (select, opcional) à coleção sistema_usuarios,
 * com os seis valores institucionais: Contábil, Fiscal, Pessoal, Apoio, Jurídico, Administrativo.
 */

const DEPARTAMENTOS = ['Contábil', 'Fiscal', 'Pessoal', 'Apoio', 'Jurídico', 'Administrativo']

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('sistema_usuarios')

    if (!col.fields.getByName('departamento')) {
      col.fields.add(
        new SelectField({
          name: 'departamento',
          values: DEPARTAMENTOS,
          maxSelect: 1,
        }),
      )
      col.addIndex('idx_sistema_usuarios_departamento', false, 'departamento', '')
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('sistema_usuarios')
    col.removeIndex('idx_sistema_usuarios_departamento')
    if (col.fields.getByName('departamento')) {
      col.fields.removeByName('departamento')
    }
    app.save(col)
  },
)
