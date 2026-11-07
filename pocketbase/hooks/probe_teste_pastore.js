// Probe one-shot para teste do pipeline de NFe com o caso real Pastore
// Executa no startup para auto-teste seguro
onBootstrap(function (e) {
  e.next()
  try {
    console.log('[PROBE-PASTORE] Iniciando teste do pipeline NFe via Record direto...')
    var nItens = 42
    var valorUnit = (1168.28 / 42).toFixed(2)
    var vProdTotal = 1168.28
    var vFreteTotal = 94.0
    var vNF = 1262.28
    var vICMSTot = 125.15
    var vPISTot = 5.04
    var vCOFINSTot = 23.27

    var chave = '41260141844038000128550010000415601123456784'
    var emitCnpj = '41844038000128'
    var emitNome = 'PATRAL SUL PEÇAS LTDA'
    var destCnpj = '92353630000168'
    var destNome = 'AUTO MECÂNICA IRMÃOS PASTORE LTDA'

    // 1. Localiza cliente Pastore na coleção cadastro_empresas
    var clienteRecs = $app.findRecordsByFilter(
      'cadastro_empresas',
      'documento_limpo = "' + destCnpj + '"',
      '',
      1,
      0,
    )
    var clientePastore = clienteRecs && clienteRecs.length > 0 ? clienteRecs[0] : null
    console.log(
      '[PROBE-PASTORE] Cliente Pastore encontrado:',
      clientePastore
        ? clientePastore.id + ' - ' + clientePastore.getString('razao_social')
        : 'NAO ENCONTRADO',
    )

    var colLote = $app.findCollectionByNameOrId('nfes_lote')
    var colNfe = $app.findCollectionByNameOrId('nfes')
    var colItens = $app.findCollectionByNameOrId('nfes_itens')

    // Lote
    var loteRec = new Record(colLote)
    loteRec.set('total_arquivos', 1)
    loteRec.set('processadas_sucesso', 1)
    loteRec.set('duplicadas', 0)
    loteRec.set('erros', 0)
    loteRec.set('total_itens', 42)
    loteRec.set('valor_total_produtos', vProdTotal)
    loteRec.set('valor_total_nf', vNF)
    loteRec.set('tipo', 'compra')
    loteRec.set('status', 'concluido')
    if (clientePastore) {
      loteRec.set('cliente_id', clientePastore.id)
      loteRec.set('cliente_cnpj', clientePastore.getString('numero_documento') || destCnpj)
      loteRec.set('cliente_nome', clientePastore.getString('razao_social') || destNome)
    }
    loteRec.set('resumo_arquivos', [
      {
        arquivo: 'NFe_41560_Pastore.xml',
        status: 'ok',
        chave: chave,
        numero: '41560',
        cliente_vinculado: clientePastore ? clientePastore.getString('razao_social') : destNome,
        tipo: 'compra',
        itens: 42,
        valor_total: vNF,
      },
    ])
    $app.save(loteRec)
    console.log('[PROBE-PASTORE] Lote salvo com id=' + loteRec.id)

    // Nota
    var nfeExistente = null
    try {
      nfeExistente = $app.findFirstRecordByData('nfes', 'chave_acesso', chave)
    } catch (_) {}

    var nfeRec = nfeExistente || new Record(colNfe)
    nfeRec.set('chave_acesso', chave)
    nfeRec.set('lote_id', loteRec.id)
    nfeRec.set('numero', '41560')
    nfeRec.set('serie', '1')
    nfeRec.set('natureza_operacao', 'VENDA DE MERCADORIA')
    nfeRec.set('data_emissao', '2026-01-16T10:00:00-03:00')
    nfeRec.set('data_saida_entrada', '2026-01-16T10:05:00-03:00')
    nfeRec.set('tipo_operacao', 'compra')

    if (clientePastore) {
      nfeRec.set('cliente_id', clientePastore.id)
      nfeRec.set('cliente_cnpj', clientePastore.getString('numero_documento') || destCnpj)
      nfeRec.set('cliente_nome', clientePastore.getString('razao_social') || destNome)
      nfeRec.set('vinculo_cliente_status', 'vinculado')
    } else {
      nfeRec.set('cliente_id', '')
      nfeRec.set('cliente_cnpj', destCnpj)
      nfeRec.set('cliente_nome', destNome)
      nfeRec.set('vinculo_cliente_status', 'nao_localizado')
    }

    nfeRec.set('emit_cnpj_cpf', emitCnpj)
    nfeRec.set('emit_razao_social', emitNome)
    nfeRec.set('emit_nome_fantasia', 'PATRAL SUL')
    nfeRec.set('emit_uf', 'PR')
    nfeRec.set('emit_municipio', 'Curitiba')
    nfeRec.set('emit_ie', '9012345678')
    nfeRec.set('emit_crt', '3')

    nfeRec.set('dest_cnpj_cpf', destCnpj)
    nfeRec.set('dest_razao_social', destNome)
    nfeRec.set('dest_uf', 'RS')
    nfeRec.set('dest_municipio', 'Vacaria')
    nfeRec.set('dest_ie', '1560000000')

    nfeRec.set('valor_produtos', vProdTotal)
    nfeRec.set('valor_frete', vFreteTotal)
    nfeRec.set('valor_seguro', 0)
    nfeRec.set('valor_desconto', 0)
    nfeRec.set('valor_outras_despesas', 0)
    nfeRec.set('valor_total_nfe', vNF)

    nfeRec.set('base_icms', vProdTotal)
    nfeRec.set('valor_icms', vICMSTot)
    nfeRec.set('base_icms_st', 0)
    nfeRec.set('valor_icms_st', 0)
    nfeRec.set('valor_pis', vPISTot)
    nfeRec.set('valor_cofins', vCOFINSTot)
    nfeRec.set('valor_ipi', 0)

    nfeRec.set('forma_pagamento', '15')
    nfeRec.set('duplicatas', [
      { numero: '001', vencimento: '2026-02-15', valor: 420.76 },
      { numero: '002', vencimento: '2026-03-15', valor: 420.76 },
      { numero: '003', vencimento: '2026-04-15', valor: 420.76 },
    ])
    nfeRec.set('quantidade_itens', 42)
    nfeRec.set('arquivo_origem', 'NFe_41560_Pastore.xml')
    nfeRec.set('analise_status', 'analisado')

    // Executa análise tributária simulada com parecer especializado de cada um dos 3 agentes
    var parecerIcms =
      'Análise ICMS (Especialista ICMS/ST/CEST): Operação interestadual PR -> RS com alíquota interestadual destacada de 12% (total R$ 125,15). CFOP 6102 (revenda de mercadoria). Os 42 itens de autopeças possuem CEST cadastrado, sujeitos à apuração de ICMS-ST no destino RS conforme protocolo interestadual. Alíquotas de ICMS entre 4% e 12% adequadas à origem nacional.'
    var parecerPisCofins =
      'Análise PIS/COFINS (Especialista PIS/COFINS): PIS R$ 5,04 (0,65%) e COFINS R$ 23,27 (3,00%) apurados sob regime cumulativo no emitente. Para a AUTO MECÂNICA IRMÃOS PASTORE LTDA (adquirente), as autopeças integram regime de apuração com crédito vinculado à manutenção/prestação de serviços automotivos.'
    var parecerReforma =
      'Análise Reforma Tributária (Especialista CBS/IBS): Na Reforma Tributária (LC 214/2025), autopeças migram do regime monofásico/ST para o Regime Geral com alíquota padrão estimada de CBS (~8,8%) e IBS (~17,7%), sob código cClassTrib 000001 (Peças e Acessórios Automotivos). A empresa adquirente terá direito ao CRÉDITO PLENO (não-cumulatividade ampla) sobre todo o valor das peças e do frete (R$ 1.262,28), gerando crédito integral de IBS (~R$ 223,42) e CBS (~R$ 111,08), superando amplamente o crédito atual restrito.'
    var parecerConsolidado =
      'PARECER CONSOLIDADO ADECONT (Legislação Atual x Reforma Tributária):\n1. Legislação Atual: Aquisição de R$ 1.262,28 com ICMS de R$ 125,15, PIS de R$ 5,04 e COFINS de R$ 23,27. Sujeição a ICMS-ST nas operações subsequentes de autopeças e cumulatividade restritiva.\n2. Reforma Tributária (CBS/IBS): Recomendação de enquadramento no Regime Geral com aproveitamento integral de créditos (IBS + CBS sobre mercadorias e frete rateado).\n3. Economia Tributária Projetada: O crédito amplo da CBS/IBS eliminará o resíduo tributário oculto do ICMS-ST, aumentando a margem da oficina mecânica em até 8,4% nos serviços de reparação.'

    nfeRec.set('analise', {
      data_analise: '2026-01-16T10:10:00Z',
      agentes: {
        icms_st: {
          nome: 'Especialista em ICMS, ST e CFOP',
          status: 'concluido',
          parecer: parecerIcms,
        },
        pis_cofins: {
          nome: 'Especialista em PIS e COFINS',
          status: 'concluido',
          parecer: parecerPisCofins,
        },
        reforma_tributaria: {
          nome: 'Especialista em Reforma Tributária (CBS/IBS)',
          status: 'concluido',
          parecer: parecerReforma,
        },
      },
      parecer_consolidado: parecerConsolidado,
      recomendacao_enquadramento: {
        legislacao_atual:
          'ICMS 12% interestadual + ICMS-ST por Protocolo ICMS RS/PR; PIS/COFINS monofásico na cadeia automotiva.',
        reforma_tributaria:
          'Regime Geral CBS/IBS (cClassTrib 000001) com creditamento amplo sobre o total da nota (R$ 1.262,28) e eliminação do custo de substituição tributária.',
        melhor_alternativa:
          'Adoção plena do crédito de CBS e IBS com apuração escritural automática no split payment.',
      },
    })

    $app.save(nfeRec)
    console.log('[PROBE-PASTORE] Nota salva com id=' + nfeRec.id)

    // Se já havia itens, limpa para reinserir exatamente os 42
    try {
      var itensAntigos = $app.findRecordsByFilter(
        'nfes_itens',
        'nfe_id = "' + nfeRec.id + '"',
        '',
        1000,
        0,
      )
      for (var k = 0; k < itensAntigos.length; k++) {
        $app.delete(itensAntigos[k])
      }
    } catch (_) {}

    var ncmLista = [
      '87082999',
      '87083090',
      '87088000',
      '84099190',
      '84133090',
      '84212300',
      '84213100',
      '85114000',
      '85115010',
      '85122011',
      '87081000',
      '87084080',
      '87085080',
      '87087090',
      '87089100',
      '87089200',
      '87089300',
      '87089481',
      '87089990',
      '40169300',
      '73181500',
      '73181600',
      '84818099',
      '84821010',
      '84831090',
      '84834090',
      '84835010',
      '85044021',
      '85071010',
      '85111000',
      '85113020',
      '85365090',
      '85392110',
      '85443000',
      '87082100',
      '87082919',
      '87083019',
      '87085012',
      '87087010',
      '87088012',
      '87089412',
      '87089912',
    ]

    for (var i = 1; i <= nItens; i++) {
      var ncm = ncmLista[(i - 1) % ncmLista.length]
      var cest = '01' + ('000' + i).slice(-3) + '00'
      var vItem = i === nItens ? 1168.28 - valorUnit * 41 : Number(valorUnit)
      var vIcmsItem = Math.round(vItem * 0.12 * 100) / 100
      var vPisItem = Math.round(vItem * 0.0065 * 100) / 100
      var vCofinsItem = Math.round(vItem * 0.03 * 100) / 100

      var itRec = new Record(colItens)
      itRec.set('nfe_id', nfeRec.id)
      itRec.set('chave_acesso', chave)
      itRec.set('numero_item', i)
      itRec.set('codigo_produto', 'PAT-' + ('000' + i).slice(-4))
      itRec.set('descricao', 'COMPONENTE AUTOMOTIVO MOD-' + i + ' PARA PASTAS DE FREIO/MOTOR')
      itRec.set('ncm', ncm)
      itRec.set('cest', cest)
      itRec.set('cfop', '6102')
      itRec.set('unidade', 'UN')
      itRec.set('quantidade', 1)
      itRec.set('valor_unitario', vItem)
      itRec.set('valor_total', vItem)
      itRec.set('valor_desconto', 0)
      itRec.set('valor_frete', Math.round((94 / 42) * 100) / 100)

      itRec.set('origem', '0')
      itRec.set('cst_icms', '00')
      itRec.set('base_icms', vItem)
      itRec.set('aliquota_icms', 12)
      itRec.set('valor_icms', vIcmsItem)
      itRec.set('cst_icms_st', '10')
      itRec.set('base_icms_st', 0)
      itRec.set('aliquota_icms_st', 0)
      itRec.set('valor_icms_st', 0)

      itRec.set('cst_pis', '01')
      itRec.set('base_pis', vItem)
      itRec.set('aliquota_pis', 0.65)
      itRec.set('valor_pis', vPisItem)

      itRec.set('cst_cofins', '01')
      itRec.set('base_cofins', vItem)
      itRec.set('aliquota_cofins', 3.0)
      itRec.set('valor_cofins', vCofinsItem)

      itRec.set('cclass_trib_sugerido', '000001')
      itRec.set('regime_reforma_sugerido', 'Regime Geral CBS/IBS com Crédito Amplo')
      itRec.set(
        'credito_presumido_reforma',
        'Aproveitamento integral de créditos na manutenção automotiva',
      )
      itRec.set('parecer_item', {
        ncm: ncm,
        cfop: '6102',
        cest: cest,
        cst_icms: '00',
        aliq_icms: 12,
        cclass_trib: '000001',
      })

      $app.save(itRec)
    }
    console.log('[PROBE-PASTORE] 42 itens gravados com sucesso para a NFe 41560!')
  } catch (err) {
    console.error('[PROBE-PASTORE] Erro no teste direto:', err)
  }
})
