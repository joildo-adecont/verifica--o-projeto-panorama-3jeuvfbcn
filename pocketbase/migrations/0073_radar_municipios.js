/// <reference path="../pb_data/types.d.ts" />

/**
 * 0073 — RADAR NACIONAL: MUNICIPIOS E ATOS MUNICIPAIS
 *
 * Cria coleções e campos para individualização de municípios nos estados:
 * 1. radar_municipios: cadastro oficial de municípios (código IBGE, nome, UF)
 * 2. radar_atos: atos normativos municipais vinculados à UF e ao município (código IBGE)
 * 3. Idempotente: se já existirem, reaproveita sem falhar.
 */

migrate(
  (app) => {
    // 1. Coleção radar_municipios
    let colMunicipios
    try {
      colMunicipios = app.findCollectionByNameOrId('radar_municipios')
    } catch (_) {
      colMunicipios = new Collection({
        name: 'radar_municipios',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'codigo_ibge', type: 'text', required: true, min: 7, max: 7 },
          { name: 'nome', type: 'text', required: true, min: 1, max: 150 },
          { name: 'uf', type: 'text', required: true, min: 2, max: 2 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_radar_municipios_codigo_ibge ON radar_municipios (codigo_ibge)',
          'CREATE INDEX idx_radar_municipios_uf ON radar_municipios (uf)',
        ],
      })
      app.save(colMunicipios)
    }

    // 2. Coleção radar_atos
    let colAtos
    try {
      colAtos = app.findCollectionByNameOrId('radar_atos')
    } catch (_) {
      colAtos = new Collection({
        name: 'radar_atos',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'uf', type: 'text', required: true, min: 2, max: 2 },
          { name: 'municipio_nome', type: 'text', required: false, max: 150 },
          { name: 'codigo_ibge', type: 'text', required: false, max: 7 },
          { name: 'titulo', type: 'text', required: true, min: 3 },
          { name: 'url', type: 'text', required: false },
          { name: 'assoc', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_radar_atos_uf ON radar_atos (uf)',
          'CREATE INDEX idx_radar_atos_ibge ON radar_atos (codigo_ibge)',
        ],
      })
      app.save(colAtos)
    }

    // 3. Adicionar campo opcional municipio e codigo_ibge em tax_norms (se ainda não existirem)
    try {
      const taxNormsCol = app.findCollectionByNameOrId('tax_norms')
      let changed = false
      if (!taxNormsCol.fields.getByName('municipio')) {
        taxNormsCol.fields.add(new TextField({ name: 'municipio', required: false, max: 150 }))
        changed = true
      }
      if (!taxNormsCol.fields.getByName('codigo_ibge')) {
        taxNormsCol.fields.add(new TextField({ name: 'codigo_ibge', required: false, max: 7 }))
        changed = true
      }
      if (changed) {
        app.save(taxNormsCol)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const colAtos = app.findCollectionByNameOrId('radar_atos')
      app.delete(colAtos)
    } catch (_) {}

    try {
      const colMunicipios = app.findCollectionByNameOrId('radar_municipios')
      app.delete(colMunicipios)
    } catch (_) {}

    try {
      const taxNormsCol = app.findCollectionByNameOrId('tax_norms')
      try {
        taxNormsCol.fields.removeByName('municipio')
      } catch (_) {}
      try {
        taxNormsCol.fields.removeByName('codigo_ibge')
      } catch (_) {}
      app.save(taxNormsCol)
    } catch (_) {}
  },
)
