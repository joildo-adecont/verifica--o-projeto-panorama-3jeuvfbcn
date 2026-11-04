/// <reference path="../pb_data/types.d.ts" />

/**
 * 0112 — PASTAS POR CLIENTE (individualizador de documentação)
 *
 * ── O QUE O CEO PEDIU (03/11/2026) ──
 * "criar um individualizador de documentação em pastas separadas por cliente
 * por parametrização para não misturar documentos."
 *
 * ── POR QUE COLECAO PROPRIA E NAO A `simul_clientes` ──
 * `simul_clientes` é o cadastro do simulador de envios: tem 500 registros com
 * CNAE, regime, carga tributária informada. Nem todo cliente do escritório está
 * lá, e nem todo registro de lá tem notas para processar. Amarrar as pastas
 * àquela coleção obrigaria a cadastrar cliente no simulador só para organizar
 * nota — e impediria pasta para contribuinte avulso, que é comum.
 *
 * A pasta é a unidade de trabalho: um CNPJ, um nome, e as notas dele. Quando o
 * cliente já existe em `simul_clientes`, `cliente_id` guarda o vínculo — mas a
 * pasta funciona sozinha, sem ele.
 *
 * ── POR QUE `pasta` É TEXTO E NÃO RELAÇÃO NO POCKETBASE ──
 * Relação exigiria que o registro existisse antes, e a importação em lote cria
 * documento às pressas. Guardar o id da pasta como texto mantém a gravação
 * simples e a filtragem por igualdade — que é o que os relatórios usam. A
 * integridade é garantida na rota: só aceita `pasta` que existe.
 *
 * ── O CAMPO `pasta` NOS ITENS TAMBÉM ──
 * Parece redundante (o item já aponta para o documento), mas sem ele todo
 * relatório por NCM teria de juntar item→documento→pasta em memória, e o
 * endpoint que lista 20.000 itens faria isso a cada consulta. Redundância
 * controlada, gravada no mesmo momento, sem chance de divergir.
 */

migrate(
  (app) => {
    // ═══════════ PASTAS ═══════════
    const pastas = new Collection({
      name: 'param_pastas',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    pastas.fields.add(new TextField({ name: 'nome', required: true, max: 200 }))
    pastas.fields.add(new TextField({ name: 'cnpj', required: false, max: 20 }))
    /* Vínculo opcional com o cadastro do simulador de envios. */
    pastas.fields.add(new TextField({ name: 'cliente_id', required: false, max: 40 }))
    /* Cor de identificação visual na lista — sem ela, 300 pastas viram uma
       parede cinza e ninguém acha a que quer. */
    pastas.fields.add(new TextField({ name: 'cor', required: false, max: 20 }))
    pastas.fields.add(new TextField({ name: 'observacao', required: false, max: 600 }))
    pastas.fields.add(new BoolField({ name: 'ativo' }))
    /* Nome normalizado (sem acento, minúsculo) para busca e para impedir
       pasta duplicada com nome que só difere na acentuação. */
    pastas.fields.add(new TextField({ name: 'nome_busca', required: false, max: 200 }))
    pastas.fields.add(new DateField({ name: 'criado_em', required: false }))
    app.save(pastas)

    // ═══════════ VÍNCULO NOS DOCUMENTOS ═══════════
    try {
      const doc = app.findCollectionByNameOrId('param_documentos')
      doc.fields.add(new TextField({ name: 'pasta', required: false, max: 40 }))
      doc.fields.add(new TextField({ name: 'pasta_nome', required: false, max: 200 }))
      app.save(doc)
    } catch (_) {
      console.log('[0112] param_documentos ausente')
    }

    try {
      const it = app.findCollectionByNameOrId('param_itens')
      it.fields.add(new TextField({ name: 'pasta', required: false, max: 40 }))
      app.save(it)
    } catch (_) {
      console.log('[0112] param_itens ausente')
    }
  },
  (app) => {
    for (const nome of ['param_pastas']) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
    try {
      const doc = app.findCollectionByNameOrId('param_documentos')
      for (const n of ['pasta', 'pasta_nome']) {
        try {
          doc.fields.removeByName(n)
        } catch (_) {}
      }
      app.save(doc)
    } catch (_) {}
    try {
      const it = app.findCollectionByNameOrId('param_itens')
      try {
        it.fields.removeByName('pasta')
      } catch (_) {}
      app.save(it)
    } catch (_) {}
  },
)
