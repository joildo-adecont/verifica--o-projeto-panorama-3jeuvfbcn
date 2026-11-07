/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0143 — Pipeline de NFes e Agentes Nativos Especialistas ADECONT
 * =========================================================================
 * Cria as 3 coleções do pipeline de documentos fiscais eletrônicos:
 *  1. `nfes_lote`: Envelopes de lote de arquivos XML processados
 *  2. `nfes`: Cabeçalhos e totais das Notas Fiscais Eletrônicas
 *  3. `nfes_itens`: Itens individuais de cada nota fiscal com tributação
 *
 * E registra os 3 agentes nativos especialistas Skip Cloud:
 *  - 'especialista-icms-st-cfop' (ICMS / ICMS-ST / CEST / CFOP)
 *  - 'especialista-pis-cofins' (PIS / COFINS / Regime Cumulativo e Não-Cumulativo)
 *  - 'especialista-reforma-tributaria' (Reforma Tributária IBS / CBS / cClassTrib)
 */

migrate(
  (app) => {
    /* ══════════════════════════════════════════════════════════════════════════
     * 1. nfes_lote
     * ══════════════════════════════════════════════════════════════════════════ */
    const lote = new Collection({
      name: 'nfes_lote',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })

    lote.fields.add(new TextField({ name: 'cliente_id', required: false }))
    lote.fields.add(new TextField({ name: 'cliente_cnpj', required: false }))
    lote.fields.add(new TextField({ name: 'cliente_nome', required: false }))
    lote.fields.add(
      new SelectField({
        name: 'tipo',
        required: false,
        values: ['compra', 'venda', 'misto'],
        maxSelect: 1,
      }),
    )
    lote.fields.add(new NumberField({ name: 'total_arquivos', required: false }))
    lote.fields.add(new NumberField({ name: 'processadas_sucesso', required: false }))
    lote.fields.add(new NumberField({ name: 'duplicadas', required: false }))
    lote.fields.add(new NumberField({ name: 'erros', required: false }))
    lote.fields.add(new NumberField({ name: 'total_itens', required: false }))
    lote.fields.add(new NumberField({ name: 'valor_total_produtos', required: false }))
    lote.fields.add(new NumberField({ name: 'valor_total_nf', required: false }))
    lote.fields.add(
      new SelectField({
        name: 'status',
        required: false,
        values: ['processando', 'concluido', 'concluido_com_erros', 'falha'],
        maxSelect: 1,
      }),
    )
    lote.fields.add(new JSONField({ name: 'resumo_arquivos', required: false, maxSize: 500000 }))
    lote.fields.add(new TextField({ name: 'observacao', required: false }))

    lote.indexes = [
      'CREATE INDEX idx_nfes_lote_cliente ON nfes_lote (cliente_id)',
      'CREATE INDEX idx_nfes_lote_cnpj ON nfes_lote (cliente_cnpj)',
      'CREATE INDEX idx_nfes_lote_status ON nfes_lote (status)',
    ]
    app.save(lote)

    /* ══════════════════════════════════════════════════════════════════════════
     * 2. nfes
     * ══════════════════════════════════════════════════════════════════════════ */
    const nfes = new Collection({
      name: 'nfes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })

    nfes.fields.add(new TextField({ name: 'chave_acesso', required: true }))
    nfes.fields.add(new TextField({ name: 'lote_id', required: false }))
    nfes.fields.add(new TextField({ name: 'numero', required: false }))
    nfes.fields.add(new TextField({ name: 'serie', required: false }))
    nfes.fields.add(new TextField({ name: 'natureza_operacao', required: false }))
    nfes.fields.add(new TextField({ name: 'data_emissao', required: false }))
    nfes.fields.add(new TextField({ name: 'data_saida_entrada', required: false }))
    nfes.fields.add(
      new SelectField({
        name: 'tipo_operacao',
        required: false,
        values: ['compra', 'venda', 'entrada', 'saida'],
        maxSelect: 1,
      }),
    )
    nfes.fields.add(new TextField({ name: 'cliente_id', required: false }))
    nfes.fields.add(new TextField({ name: 'cliente_cnpj', required: false }))
    nfes.fields.add(new TextField({ name: 'cliente_nome', required: false }))
    nfes.fields.add(
      new SelectField({
        name: 'vinculo_cliente_status',
        required: false,
        values: ['vinculado', 'nao_localizado', 'pendente'],
        maxSelect: 1,
      }),
    )

    // Emitente
    nfes.fields.add(new TextField({ name: 'emit_cnpj_cpf', required: false }))
    nfes.fields.add(new TextField({ name: 'emit_razao_social', required: false }))
    nfes.fields.add(new TextField({ name: 'emit_nome_fantasia', required: false }))
    nfes.fields.add(new TextField({ name: 'emit_uf', required: false }))
    nfes.fields.add(new TextField({ name: 'emit_municipio', required: false }))
    nfes.fields.add(new TextField({ name: 'emit_ie', required: false }))
    nfes.fields.add(new TextField({ name: 'emit_crt', required: false }))

    // Destinatário
    nfes.fields.add(new TextField({ name: 'dest_cnpj_cpf', required: false }))
    nfes.fields.add(new TextField({ name: 'dest_razao_social', required: false }))
    nfes.fields.add(new TextField({ name: 'dest_uf', required: false }))
    nfes.fields.add(new TextField({ name: 'dest_municipio', required: false }))
    nfes.fields.add(new TextField({ name: 'dest_ie', required: false }))

    // Totais e tributos
    nfes.fields.add(new NumberField({ name: 'valor_produtos', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_frete', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_seguro', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_desconto', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_outras_despesas', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_total_nfe', required: false }))

    nfes.fields.add(new NumberField({ name: 'base_icms', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_icms', required: false }))
    nfes.fields.add(new NumberField({ name: 'base_icms_st', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_icms_st', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_pis', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_cofins', required: false }))
    nfes.fields.add(new NumberField({ name: 'valor_ipi', required: false }))

    // Faturamento e duplicatas
    nfes.fields.add(new TextField({ name: 'forma_pagamento', required: false }))
    nfes.fields.add(new JSONField({ name: 'duplicatas', required: false, maxSize: 100000 }))

    // Status e Análises dos Agentes
    nfes.fields.add(new NumberField({ name: 'quantidade_itens', required: false }))
    nfes.fields.add(new TextField({ name: 'arquivo_origem', required: false }))
    nfes.fields.add(new JSONField({ name: 'analise', required: false, maxSize: 500000 }))
    nfes.fields.add(
      new SelectField({
        name: 'analise_status',
        required: false,
        values: ['pendente', 'analisado', 'erro'],
        maxSelect: 1,
      }),
    )

    nfes.indexes = [
      'CREATE UNIQUE INDEX idx_nfes_chave ON nfes (chave_acesso)',
      'CREATE INDEX idx_nfes_lote ON nfes (lote_id)',
      'CREATE INDEX idx_nfes_cliente ON nfes (cliente_id)',
      'CREATE INDEX idx_nfes_cliente_cnpj ON nfes (cliente_cnpj)',
      'CREATE INDEX idx_nfes_emit_cnpj ON nfes (emit_cnpj_cpf)',
      'CREATE INDEX idx_nfes_dest_cnpj ON nfes (dest_cnpj_cpf)',
      'CREATE INDEX idx_nfes_tipo ON nfes (tipo_operacao)',
      'CREATE INDEX idx_nfes_data ON nfes (data_emissao)',
    ]
    app.save(nfes)

    /* ══════════════════════════════════════════════════════════════════════════
     * 3. nfes_itens
     * ══════════════════════════════════════════════════════════════════════════ */
    const itens = new Collection({
      name: 'nfes_itens',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    })

    itens.fields.add(new TextField({ name: 'nfe_id', required: true }))
    itens.fields.add(new TextField({ name: 'chave_acesso', required: false }))
    itens.fields.add(new NumberField({ name: 'numero_item', required: false }))
    itens.fields.add(new TextField({ name: 'codigo_produto', required: false }))
    itens.fields.add(new TextField({ name: 'descricao', required: false }))
    itens.fields.add(new TextField({ name: 'ncm', required: false }))
    itens.fields.add(new TextField({ name: 'cest', required: false }))
    itens.fields.add(new TextField({ name: 'cfop', required: false }))
    itens.fields.add(new TextField({ name: 'unidade', required: false }))
    itens.fields.add(new NumberField({ name: 'quantidade', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_unitario', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_total', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_desconto', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_frete', required: false }))

    // Origem e ICMS
    itens.fields.add(new TextField({ name: 'origem', required: false }))
    itens.fields.add(new TextField({ name: 'cst_icms', required: false }))
    itens.fields.add(new NumberField({ name: 'base_icms', required: false }))
    itens.fields.add(new NumberField({ name: 'aliquota_icms', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_icms', required: false }))
    itens.fields.add(new TextField({ name: 'cst_icms_st', required: false }))
    itens.fields.add(new NumberField({ name: 'base_icms_st', required: false }))
    itens.fields.add(new NumberField({ name: 'aliquota_icms_st', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_icms_st', required: false }))

    // PIS
    itens.fields.add(new TextField({ name: 'cst_pis', required: false }))
    itens.fields.add(new NumberField({ name: 'base_pis', required: false }))
    itens.fields.add(new NumberField({ name: 'aliquota_pis', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_pis', required: false }))

    // COFINS
    itens.fields.add(new TextField({ name: 'cst_cofins', required: false }))
    itens.fields.add(new NumberField({ name: 'base_cofins', required: false }))
    itens.fields.add(new NumberField({ name: 'aliquota_cofins', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_cofins', required: false }))

    // IPI
    itens.fields.add(new TextField({ name: 'cst_ipi', required: false }))
    itens.fields.add(new NumberField({ name: 'aliquota_ipi', required: false }))
    itens.fields.add(new NumberField({ name: 'valor_ipi', required: false }))

    // Projeções / Classificações da Reforma Tributária
    itens.fields.add(new TextField({ name: 'cclass_trib_sugerido', required: false }))
    itens.fields.add(new TextField({ name: 'regime_reforma_sugerido', required: false }))
    itens.fields.add(new TextField({ name: 'credito_presumido_reforma', required: false }))
    itens.fields.add(new JSONField({ name: 'parecer_item', required: false, maxSize: 50000 }))

    itens.indexes = [
      'CREATE INDEX idx_nfes_itens_nfe ON nfes_itens (nfe_id)',
      'CREATE INDEX idx_nfes_itens_chave ON nfes_itens (chave_acesso)',
      'CREATE INDEX idx_nfes_itens_ncm ON nfes_itens (ncm)',
      'CREATE INDEX idx_nfes_itens_cfop ON nfes_itens (cfop)',
      'CREATE INDEX idx_nfes_itens_cest ON nfes_itens (cest)',
      'CREATE INDEX idx_nfes_itens_cst_icms ON nfes_itens (cst_icms)',
    ]
    app.save(itens)

    /* ══════════════════════════════════════════════════════════════════════════
     * 4. AGENTES NATIVOS SKIP CLOUD — ESPECIALISTAS DO PIPELINE DE NFES
     * ══════════════════════════════════════════════════════════════════════════ */
    // 1. Agente Especialista em ICMS / ICMS-ST / CEST / CFOP
    try {
      $ai.agents.define({
        name: 'Especialista ICMS, ICMS-ST, CEST e CFOP',
        slug: 'especialista-icms-st-cfop',
        system_instruction:
          'Você é o Agente Especialista em ICMS, ICMS-ST, CEST e CFOP da ADECONT Assessoria Contábil e Administrativa. ' +
          'Sua função é analisar notas fiscais eletrônicas de compras e vendas, checando item a item: ' +
          '1) O enquadramento de CFOP (operações internas vs interestaduais, revenda 5102/6102, industrialização 5101/6101, compra para comercialização 1102/2102, compra para ativo 1551/2551 ou uso/consumo 1407/2407); ' +
          '2) Correção de CST/CSOSN do ICMS (00 tributada integralmente, 10 com ST, 20 com redução de base, 40/41 isenta/não tributada, 60 cobrado anteriormente por ST); ' +
          '3) Código CEST e regime de Substituição Tributária (MVA original e ajustada, alíquotas interestaduais de 4%, 7% e 12%); ' +
          '4) Recomendar correções na escrituração atual e alertar se a operação dá direito a crédito ou recolhimento antecipado (DIFAL ou ST). ' +
          'Forneça sempre conclusões práticas, diretas e com fundamentação legal clara.',
        temperature: 0.2,
      })
    } catch (e1) {
      console.log('Agente especialista-icms-st-cfop já existe ou não pôde ser definido:', e1)
    }

    // 2. Agente Especialista em PIS / COFINS
    try {
      $ai.agents.define({
        name: 'Especialista PIS e COFINS',
        slug: 'especialista-pis-cofins',
        system_instruction:
          'Você é o Agente Especialista em PIS e COFINS da ADECONT Assessoria Contábil e Administrativa. ' +
          'Sua função é analisar os itens de notas fiscais eletrônicas sob a ótica dos tributos federais sobre o faturamento: ' +
          '1) Regime Cumulativo (Lucro Presumido: PIS 0,65% e COFINS 3,00%) vs Regime Não-Cumulativo (Lucro Real: PIS 1,65% e COFINS 7,60%); ' +
          '2) Identificação de produtos sob regime Monofásico ou Alíquota Zero (ex.: autopeças, combustíveis, farmacêuticos, bebidas) e correta aplicação de CST (01, 02, 04 tributação monofásica, 06 alíquota zero, 50 a 66 créditos da não-cumulatividade); ' +
          '3) Validação do direito a crédito de PIS/COFINS sobre insumos e mercadorias para revenda; ' +
          '4) Recomendações práticas para evitar tributação indevida ou perda de créditos federais.',
        temperature: 0.2,
      })
    } catch (e2) {
      console.log('Agente especialista-pis-cofins já existe ou não pôde ser definido:', e2)
    }

    // 3. Agente Especialista em Reforma Tributária (IBS / CBS / cClassTrib)
    try {
      $ai.agents.define({
        name: 'Especialista Reforma Tributária IBS e CBS',
        slug: 'especialista-reforma-tributaria',
        system_instruction:
          'Você é o Agente Especialista na Reforma Tributária sobre o Consumo (EC 132/2023, LC 214/2025 e regulamentações) da ADECONT Assessoria Contábil e Administrativa. ' +
          'Sua função é projetar os impactos da transição da tributação atual (ICMS/ISS/PIS/COFINS/IPI) para o novo modelo do IBS e da CBS sobre a carteira de compras e vendas: ' +
          '1) Sugerir o código de classificação tributária (cClassTrib) adequado a cada NCM/natureza de produto/serviço; ' +
          '2) Comparar a carga tributária efetiva atual com a nova alíquota de referência estimada (CBS federal ~8,8%, IBS estadual/municipal ~17,7%, total de ~26,5% ou regimes favorecidos com redução de 30%, 60% ou alíquota zero para cesta básica/saúde/agro/educação); ' +
          '3) Identificar oportunidade de crédito amplo e financeiro imediato sobre todas as aquisições da pessoa jurídica (não-cumulatividade plena); ' +
          '4) Apresentar parecer claro recomendando qual a melhor alternativa entre a legislação atual e seu enquadramento e a reforma tributária futura.',
        temperature: 0.2,
      })
    } catch (e3) {
      console.log('Agente especialista-reforma-tributaria já existe ou não pôde ser definido:', e3)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('nfes_itens'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('nfes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('nfes_lote'))
    } catch (_) {}
  },
)
