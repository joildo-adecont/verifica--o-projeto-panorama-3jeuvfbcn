/// <reference path="../pb_data/types.d.ts" />

/**
 * Pipeline de NFes — ADECONT Assessoria Contábil e Administrativa
 * ===============================================================
 * Rota GET /backend/v1/nfe-listar
 *
 * Lista NFes com suporte a filtros (cliente_id, tipo_operacao, busca, limite, offset),
 * contadores de compras e vendas, totais financeiros e detalhamento sob demanda.
 */

routerAdd('OPTIONS', '/backend/v1/nfe-listar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  e.response
    .header()
    .set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Painel-Token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/nfe-listar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  try {
    var info = e.requestInfo()
    var q = info.query || {}

    var clienteId = String(q.cliente_id || '').trim()
    var tipo = String(q.tipo || '').trim() // 'compra', 'venda' ou ''
    var busca = String(q.busca || '').trim()
    var limite = parseInt(q.limite, 10) || 50
    if (limite > 200) limite = 200
    var offset = parseInt(q.offset, 10) || 0

    var filtros = []
    if (clienteId) {
      filtros.push('cliente_id = "' + clienteId + '"')
    }
    if (tipo === 'compra' || tipo === 'venda') {
      filtros.push('tipo_operacao = "' + tipo + '"')
    }
    if (busca) {
      var b = busca.replace(/"/g, '')
      filtros.push(
        '(numero ~ "' +
          b +
          '" || chave_acesso ~ "' +
          b +
          '" || emit_razao_social ~ "' +
          b +
          '" || dest_razao_social ~ "' +
          b +
          '" || emit_cnpj_cpf ~ "' +
          b +
          '" || dest_cnpj_cpf ~ "' +
          b +
          '")',
      )
    }

    var filtroSql = filtros.join(' && ')
    var recs = $app.findRecordsByFilter('nfes', filtroSql, '-data_emissao', limite, offset)

    var lista = []
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i]
      lista.push({
        id: r.id,
        chave_acesso: r.getString('chave_acesso'),
        lote_id: r.getString('lote_id'),
        numero: r.getString('numero'),
        serie: r.getString('serie'),
        natureza_operacao: r.getString('natureza_operacao'),
        data_emissao: r.getString('data_emissao'),
        tipo_operacao: r.getString('tipo_operacao'),
        cliente_id: r.getString('cliente_id'),
        cliente_cnpj: r.getString('cliente_cnpj'),
        cliente_nome: r.getString('cliente_nome'),
        vinculo_cliente_status: r.getString('vinculo_cliente_status'),
        emit_cnpj_cpf: r.getString('emit_cnpj_cpf'),
        emit_razao_social: r.getString('emit_razao_social'),
        emit_uf: r.getString('emit_uf'),
        emit_municipio: r.getString('emit_municipio'),
        dest_cnpj_cpf: r.getString('dest_cnpj_cpf'),
        dest_razao_social: r.getString('dest_razao_social'),
        dest_uf: r.getString('dest_uf'),
        dest_municipio: r.getString('dest_municipio'),
        valor_produtos: r.get('valor_produtos') || 0,
        valor_frete: r.get('valor_frete') || 0,
        valor_total_nfe: r.get('valor_total_nfe') || 0,
        valor_icms: r.get('valor_icms') || 0,
        valor_icms_st: r.get('valor_icms_st') || 0,
        valor_pis: r.get('valor_pis') || 0,
        valor_cofins: r.get('valor_cofins') || 0,
        valor_ipi: r.get('valor_ipi') || 0,
        forma_pagamento: r.getString('forma_pagamento'),
        duplicatas: r.get('duplicatas') || [],
        quantidade_itens: r.get('quantidade_itens') || 0,
        arquivo_origem: r.getString('arquivo_origem'),
        analise_status: r.getString('analise_status') || 'pendente',
        analise: r.get('analise') || null,
        created: r.getString('created'),
      })
    }

    // Busca itens sob demanda se solicitado nfe_id específico
    var nfeDetalheId = String(q.nfe_id || '').trim()
    var itensDetalhe = []
    if (nfeDetalheId) {
      try {
        var recsItens = $app.findRecordsByFilter(
          'nfes_itens',
          'nfe_id = "' + nfeDetalheId + '"',
          'numero_item',
          500,
          0,
        )
        for (var k = 0; k < recsItens.length; k++) {
          var it = recsItens[k]
          itensDetalhe.push({
            id: it.id,
            nfe_id: it.getString('nfe_id'),
            numero_item: it.get('numero_item'),
            codigo_produto: it.getString('codigo_produto'),
            descricao: it.getString('descricao'),
            ncm: it.getString('ncm'),
            cest: it.getString('cest'),
            cfop: it.getString('cfop'),
            unidade: it.getString('unidade'),
            quantidade: it.get('quantidade') || 0,
            valor_unitario: it.get('valor_unitario') || 0,
            valor_total: it.get('valor_total') || 0,
            valor_desconto: it.get('valor_desconto') || 0,
            origem: it.getString('origem'),
            cst_icms: it.getString('cst_icms'),
            aliquota_icms: it.get('aliquota_icms') || 0,
            valor_icms: it.get('valor_icms') || 0,
            cst_icms_st: it.getString('cst_icms_st'),
            aliquota_icms_st: it.get('aliquota_icms_st') || 0,
            valor_icms_st: it.get('valor_icms_st') || 0,
            cst_pis: it.getString('cst_pis'),
            aliquota_pis: it.get('aliquota_pis') || 0,
            valor_pis: it.get('valor_pis') || 0,
            cst_cofins: it.getString('cst_cofins'),
            aliquota_cofins: it.get('aliquota_cofins') || 0,
            valor_cofins: it.get('valor_cofins') || 0,
            cclass_trib_sugerido: it.getString('cclass_trib_sugerido'),
            regime_reforma_sugerido: it.getString('regime_reforma_sugerido'),
            credito_presumido_reforma: it.getString('credito_presumido_reforma'),
          })
        }
      } catch (_) {}
    }

    return e.json(200, {
      success: true,
      total_retornado: lista.length,
      nfes: lista,
      itens: itensDetalhe,
    })
  } catch (errListar) {
    console.log('Erro em nfe-listar:', errListar)
    return e.json(200, {
      success: false,
      error: 'Falha ao listar NFes: ' + String(errListar).slice(0, 300),
      nfes: [],
      itens: [],
    })
  }
})
