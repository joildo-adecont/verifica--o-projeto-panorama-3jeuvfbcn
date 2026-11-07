/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0144 — Extensão do Pipeline de NFes (ADECONT):
 * - Diferenciação COMPRA × VENDA (campo tipo_compra_venda e valores 'compra' | 'venda')
 * - Suporte a consumidor final PF (destinatário CPF, sem erro PJ)
 * - Dados de Intermediador / Marketplace (infIntermed CNPJ/ID, transportadora marketplace)
 * - Dados de ICMSUFDest / DIFAL interestadual para consumidor final
 * - Bloco IBSCBS no total da NFe e por item (Reforma Tributária EC 132/2023 e LC 214/2025)
 */

migrate(
  (app) => {
    // 1. Atualiza coleção 'nfes'
    try {
      const nfes = app.findCollectionByNameOrId('nfes')

      // tipo_compra_venda: 'compra' | 'venda'
      if (!nfes.fields.getByName('tipo_compra_venda')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'tipo_compra_venda',
            required: false,
          }),
        )
      }

      // destinatario_tipo: 'PJ' | 'PF'
      if (!nfes.fields.getByName('destinatario_tipo')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'destinatario_tipo',
            required: false,
          }),
        )
      }

      // ind_final: 0=normal, 1=consumidor final
      if (!nfes.fields.getByName('ind_final')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new NumberField({
            name: 'ind_final',
            required: false,
          }),
        )
      }

      // intermediador_cnpj / intermediador_nome / intermediador_id
      if (!nfes.fields.getByName('intermediador_cnpj')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'intermediador_cnpj',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('intermediador_nome')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'intermediador_nome',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('intermediador_id')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'intermediador_id',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('transportadora_nome')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'transportadora_nome',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('transportadora_cnpj')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new TextField({
            name: 'transportadora_cnpj',
            required: false,
          }),
        )
      }

      // DIFAL / ICMS Interestadual UF Destino
      if (!nfes.fields.getByName('valor_difal_uf_dest')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new NumberField({
            name: 'valor_difal_uf_dest',
            required: false,
          }),
        )
      }

      // Totais Bloco IBSCBS
      if (!nfes.fields.getByName('ibscbs_tot_vbc')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new NumberField({
            name: 'ibscbs_tot_vbc',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('ibscbs_tot_vibs')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new NumberField({
            name: 'ibscbs_tot_vibs',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('ibscbs_tot_vcbs')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new NumberField({
            name: 'ibscbs_tot_vcbs',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('ibscbs_tot_vcredpres')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new NumberField({
            name: 'ibscbs_tot_vcredpres',
            required: false,
          }),
        )
      }
      if (!nfes.fields.getByName('bloco_ibscbs')) {
        nfes.fields.addAt(
          nfes.fields.length,
          new JSONField({
            name: 'bloco_ibscbs',
            required: false,
          }),
        )
      }

      app.save(nfes)
    } catch (errNfe) {
      console.log('Aviso ao atualizar coleção nfes:', errNfe)
    }

    // 2. Atualiza coleção 'nfes_itens'
    try {
      const nfesItens = app.findCollectionByNameOrId('nfes_itens')

      // Bloco IBSCBS por item
      if (!nfesItens.fields.getByName('ibscbs_cst')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new TextField({
            name: 'ibscbs_cst',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_cclass_trib')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new TextField({
            name: 'ibscbs_cclass_trib',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_vbc')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_vbc',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_pibs_uf')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_pibs_uf',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_pibs_mun')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_pibs_mun',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_vibs')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_vibs',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_pcbs')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_pcbs',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_vcbs')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_vcbs',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('ibscbs_vcredpres')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'ibscbs_vcredpres',
            required: false,
          }),
        )
      }
      if (!nfesItens.fields.getByName('dados_ibscbs')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new JSONField({
            name: 'dados_ibscbs',
            required: false,
          }),
        )
      }

      // DIFAL do item
      if (!nfesItens.fields.getByName('valor_difal_uf_dest')) {
        nfesItens.fields.addAt(
          nfesItens.fields.length,
          new NumberField({
            name: 'valor_difal_uf_dest',
            required: false,
          }),
        )
      }

      app.save(nfesItens)
    } catch (errItens) {
      console.log('Aviso ao atualizar coleção nfes_itens:', errItens)
    }
  },
  (app) => {
    // Reversão
  },
)
