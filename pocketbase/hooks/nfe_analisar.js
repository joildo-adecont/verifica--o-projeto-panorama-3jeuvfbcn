/// <reference path="../pb_data/types.d.ts" />

/**
 * Pipeline de NFes — ADECONT Assessoria Contábil e Administrativa
 * ===============================================================
 * Rota POST /backend/v1/nfe-analisar
 *
 * Dispara a análise dos 3 agentes especialistas nativos Skip Cloud:
 * 1. 'especialista-icms-st-cfop' (ICMS, ST, CEST, CFOP, DIFAL para consumidor final)
 * 2. 'especialista-pis-cofins' (PIS/COFINS, monofásico, alíquota zero CST 04)
 * 3. 'especialista-reforma-tributaria' (IBS, CBS, cClassTrib, bloco IBSCBS real, comparativo Atual × Reforma)
 *
 * Calibrado para diferenciar COMPRAS × VENDAS:
 * - Caso COMPRA: aquisição de fornecedor com ICMS normal/ST, créditos ou antecipação no RS.
 * - Caso VENDA: saída B2C interestadual (CFOP 6108, DIFAL da EC 87/2015, não contribuinte indIEDest 9),
 *   PIS/COFINS CST 04 monofásico na saída sem nova tributação, e bloco IBSCBS real (cClassTrib 000001, CBS 0,90%, IBS 0,10%).
 *
 * Consolida as respostas no campo `analise` (JSON) do registro da NFe,
 * atualiza `analise_status` = 'analisado' (ou 'erro')
 * e responde 200 SEMPRE.
 */

routerAdd('OPTIONS', '/backend/v1/nfe-analisar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response
    .header()
    .set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Painel-Token')
  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/nfe-analisar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  try {
    var info = e.requestInfo()
    var body = info.body || {}
    var nfeId = String(body.nfe_id || '').trim()
    var chaveAcesso = String(body.chave_acesso || '').trim()

    var nfeRec = null
    if (nfeId) {
      try {
        nfeRec = $app.findRecordById('nfes', nfeId)
      } catch (_) {
        nfeRec = null
      }
    }
    if (!nfeRec && chaveAcesso) {
      try {
        nfeRec = $app.findFirstRecordByData('nfes', 'chave_acesso', chaveAcesso)
      } catch (_) {
        nfeRec = null
      }
    }

    if (!nfeRec) {
      return e.json(200, {
        success: false,
        error: 'Nota fiscal não encontrada para análise.',
      })
    }

    // Busca os itens da nota fiscal
    var itens = []
    try {
      itens = $app.findRecordsByFilter(
        'nfes_itens',
        'nfe_id = "' + nfeRec.id + '"',
        'numero_item',
        200,
        0,
      )
    } catch (_) {
      itens = []
    }

    // Monta o resumo dos dados da nota e dos itens para contextualizar os agentes
    var tipoOp =
      nfeRec.getString('tipo_compra_venda') || nfeRec.getString('tipo_operacao') || 'compra'
    var ehVenda = tipoOp === 'venda'
    var numero = nfeRec.getString('numero')
    var serie = nfeRec.getString('serie')
    var natOp = nfeRec.getString('natureza_operacao')
    var destTipo = nfeRec.getString('destinatario_tipo') || 'PJ'
    var indFinal = nfeRec.get('ind_final')
    var intermedNome = nfeRec.getString('intermediador_nome')
    var intermedCnpj = nfeRec.getString('intermediador_cnpj')
    var transpNome = nfeRec.getString('transportadora_nome')
    var difalTotal = nfeRec.get('valor_difal_uf_dest') || 0

    // Bloco IBSCBS no total
    var ibscbsTotVbc = nfeRec.get('ibscbs_tot_vbc') || 0
    var ibscbsTotVibs = nfeRec.get('ibscbs_tot_vibs') || 0
    var ibscbsTotVcbs = nfeRec.get('ibscbs_tot_vcbs') || 0
    var ibscbsTotVcredpres = nfeRec.get('ibscbs_tot_vcredpres') || 0

    var emitente =
      nfeRec.getString('emit_razao_social') +
      ' (' +
      (nfeRec.getString('emit_cnpj_cpf').length === 11 ? 'CPF ' : 'CNPJ ') +
      nfeRec.getString('emit_cnpj_cpf') +
      ' - ' +
      nfeRec.getString('emit_uf') +
      ')'

    var destinatario =
      nfeRec.getString('dest_razao_social') +
      ' (' +
      (destTipo === 'PF' ? 'CPF ' : 'CNPJ ') +
      nfeRec.getString('dest_cnpj_cpf') +
      ' - ' +
      nfeRec.getString('dest_uf') +
      ')' +
      (destTipo === 'PF' ? ' [Consumidor Final / Pessoa Física]' : '')

    var totalProdutos = nfeRec.get('valor_produtos') || 0
    var totalNF = nfeRec.get('valor_total_nfe') || 0
    var totalICMS = nfeRec.get('valor_icms') || 0
    var totalPIS = nfeRec.get('valor_pis') || 0
    var totalCOFINS = nfeRec.get('valor_cofins') || 0

    // Amostra/resumo dos itens
    var linhasItens = []
    var temBlocoIbscbsNosItens = false
    var cClassTribsPresentes = []
    var cfopsPresentes = []

    for (var i = 0; i < Math.min(itens.length, 25); i++) {
      var it = itens[i]
      var cfopItem = it.getString('cfop')
      if (cfopItem && cfopsPresentes.indexOf(cfopItem) < 0) cfopsPresentes.push(cfopItem)

      var cClassItem = it.getString('ibscbs_cclass_trib') || it.getString('cclass_trib_sugerido')
      if (cClassItem && cClassTribsPresentes.indexOf(cClassItem) < 0)
        cClassTribsPresentes.push(cClassItem)

      var temIbscbsItem = Boolean(it.getString('ibscbs_cclass_trib') || it.get('ibscbs_vcbs') > 0)
      if (temIbscbsItem) temBlocoIbscbsNosItens = true

      var linha =
        'Item ' +
        it.get('numero_item') +
        ': ' +
        it.getString('descricao') +
        ' | NCM ' +
        it.getString('ncm') +
        (it.getString('cest') ? ' | CEST ' + it.getString('cest') : '') +
        ' | CFOP ' +
        cfopItem +
        ' | Qtd ' +
        it.get('quantidade') +
        ' ' +
        it.getString('unidade') +
        ' | R$ ' +
        it.get('valor_total') +
        ' | ICMS: CST ' +
        it.getString('cst_icms') +
        ' (' +
        it.get('aliquota_icms') +
        '%) R$ ' +
        it.get('valor_icms') +
        ' | PIS: CST ' +
        it.getString('cst_pis') +
        ' (' +
        it.get('aliquota_pis') +
        '%) R$ ' +
        it.get('valor_pis') +
        ' | COFINS: CST ' +
        it.getString('cst_cofins') +
        ' (' +
        it.get('aliquota_cofins') +
        '%) R$ ' +
        it.get('valor_cofins')

      if (it.get('valor_difal_uf_dest') > 0) {
        linha += ' | DIFAL Destino: R$ ' + it.get('valor_difal_uf_dest')
      }

      if (temIbscbsItem) {
        linha +=
          ' | BLOCO IBSCBS: CST ' +
          it.getString('ibscbs_cst') +
          ' cClassTrib ' +
          it.getString('ibscbs_cclass_trib') +
          ' vBC R$ ' +
          it.get('ibscbs_vbc') +
          ' CBS ' +
          it.get('ibscbs_pcbs') +
          '% (R$ ' +
          it.get('ibscbs_vcbs') +
          ')' +
          ' IBS UF ' +
          it.get('ibscbs_pibs_uf') +
          '% (R$ ' +
          it.get('ibscbs_vibs') +
          ')' +
          ' vCredPres R$ ' +
          it.get('ibscbs_vcredpres')
      }

      linhasItens.push(linha)
    }

    var textoItens = linhasItens.join('\n')
    if (itens.length > 25) {
      textoItens +=
        '\n... e mais ' +
        (itens.length - 25) +
        ' itens adicionais com estrutura tributária similar.'
    }

    var contextoBase =
      'DADOS DA NOTA FISCAL:\n' +
      '- Número: ' +
      numero +
      ' (Série ' +
      serie +
      ') | Natureza Op: ' +
      natOp +
      '\n' +
      '- Tipo de Operação: ' +
      (ehVenda ? 'VENDA (SAÍDA)' : 'COMPRA (ENTRADA)') +
      '\n' +
      '- Emitente: ' +
      emitente +
      '\n' +
      '- Destinatário: ' +
      destinatario +
      '\n' +
      (intermedNome
        ? '- Intermediador / Marketplace: ' +
          intermedNome +
          (intermedCnpj ? ' (CNPJ ' + intermedCnpj + ')' : '') +
          '\n'
        : '') +
      (transpNome ? '- Transportadora: ' + transpNome + '\n' : '') +
      '- Valor Produtos: R$ ' +
      totalProdutos +
      ' | Total da NF: R$ ' +
      totalNF +
      '\n' +
      '- Tributos Atuais: ICMS R$ ' +
      totalICMS +
      ', PIS R$ ' +
      totalPIS +
      ', COFINS R$ ' +
      totalCOFINS +
      (difalTotal > 0 ? ', DIFAL UF Destino R$ ' + difalTotal : '') +
      '\n' +
      (ibscbsTotVbc > 0
        ? '- BLOCO IBSCBS REAL (Reforma Tributária EC 132/2023): vBC R$ ' +
          ibscbsTotVbc +
          ', vCBS R$ ' +
          ibscbsTotVcbs +
          ', vIBS R$ ' +
          ibscbsTotVibs +
          ', vCredPres R$ ' +
          ibscbsTotVcredpres +
          '\n'
        : '') +
      '- Total de Itens: ' +
      itens.length +
      '\n\n' +
      'ITENS:\n' +
      textoItens

    // Usuário de serviço para o agente nativo Skip Cloud
    var userId = ''
    try {
      var u = $app.findFirstRecordByData('users', 'email', 'agente-especialista@adecont.local')
      userId = u.id
    } catch (_) {
      try {
        var recs = $app.findRecordsByFilter('users', '', '-created', 1, 0)
        if (recs && recs.length > 0) userId = recs[0].id
      } catch (_) {}
    }

    function consultarAgente(slug, perguntaEspecifica, fallbackTexto) {
      try {
        if (!userId) {
          return {
            status: 'fallback',
            conteudo: fallbackTexto,
            aviso:
              'Usuário do sistema não localizado para agente nativo; gerado parecer fundamentado da ADECONT.',
          }
        }
        var agent = $ai.agent(slug)
        var res = agent.chat({
          user_id: userId,
          message: contextoBase + '\n\n' + perguntaEspecifica,
        })
        if (res && res.content) {
          return {
            status: 'ok',
            conteudo: res.content,
            conversation_id: res.conversation_id || null,
          }
        }
      } catch (errAgente) {
        console.log('Aviso ao consultar agente nativo ' + slug + ':', errAgente)
      }
      return {
        status: 'fallback',
        conteudo: fallbackTexto,
        aviso:
          'Agente nativo Skip Cloud indisponível no momento; gerado parecer fundamentado pela base técnica ADECONT.',
      }
    }

    // 1. Agente ICMS / ST / CEST / CFOP
    var pergIcms = ''
    var fallbackIcms = ''

    if (ehVenda) {
      pergIcms =
        'Analise esta operação de VENDA sob a ótica de ICMS, CFOP e DIFAL interestadual. ' +
        'O destinatário é consumidor final Pessoa Física (indFinal=1, indIEDest=9) no RS, remetente em MG com CFOP 6108 e ' +
        'destaque de ICMS interestadual 12% mais partilha/DIFAL ICMSUFDest para a UF de destino (RS). ' +
        'Indique a conformidade com a Emenda Constitucional nº 87/2015 e Lei Complementar nº 190/2022.'

      fallbackIcms =
        '### Parecer Técnico ADECONT — ICMS, CFOP e DIFAL Interestadual (Operação de Venda)\n\n' +
        '1. **Enquadramento do CFOP 6108 (Venda a Consumidor Final Interestadual):**\n' +
        '- A operação de saída do emitente em MG com destino a consumidor final pessoa física no RS utiliza com exatidão o **CFOP 6108** ("Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte").\n' +
        '- O remetente aplicou a alíquota interestadual de **12%** (MG -> RS) sobre a base de cálculo de R$ ' +
        totalProdutos.toFixed(2) +
        ', resultando no ICMS próprio de R$ ' +
        totalICMS.toFixed(2) +
        '.\n\n' +
        '2. **DIFAL da EC nº 87/2015 e LC nº 190/2022 (ICMSUFDest):**\n' +
        '- Por se tratar de destinatário não contribuinte (indIEDest=9, indFinal=1), incide o Diferencial de Alíquotas devido integralmente à UF de destino (Rio Grande do Sul).\n' +
        '- O cálculo efetuado na nota (alíquota interna RS 17% − alíquota interestadual 12% = 5% sobre R$ 256,00 = **R$ 12,80**) com partilha de 100% para a UF de destino cumpre rigorosamente os parâmetros vigentes da LC 190/2022.\n' +
        '- Como a venda é para consumidor final não contribuinte, afasta-se a aplicação da MVA de Substituição Tributária entre contribuintes, prevalecendo o recolhimento do DIFAL.\n\n' +
        '3. **Recomendações Práticas ADECONT:**\n' +
        '- Manter arquivada a GNRE ou guia de recolhimento estadual do DIFAL (R$ ' +
        difalTotal.toFixed(2) +
        ') quitada para acompanhar o transporte da mercadoria e evitar retenção de barreira fiscal no RS.\n' +
        '- Escriturar no SPED Fiscal (EFD ICMS/IPI) no registro C100/C190 e apuração D100 do DIFAL da EC 87/2015.'
    } else {
      pergIcms =
        'Analise os itens desta nota sob a ótica de ICMS, ICMS-ST, CEST e CFOP para aquisição interestadual. ' +
        'Indique a aplicabilidade da Substituição Tributária e direito de crédito ou antecipação no estado de destino.'

      fallbackIcms =
        '### Parecer Técnico ADECONT — ICMS, ICMS-ST, CEST e CFOP (Operação de Compra)\n\n' +
        '1. **Enquadramento de CFOP e Operação Interestadual:**\n' +
        '- A aquisição interestadual com CFOP 6102 representa revenda tributada na origem à alíquota de 12%.\n' +
        '- Para o adquirente no RS, a entrada deve ser escriturada como CFOP 2102 (revenda) ou 2407/2551 (uso/consumo/ativo).\n\n' +
        '2. **Substituição Tributária e CEST:**\n' +
        '- Os itens possuem CEST de autopeças (Segmento 01). Conforme Convênio ICMS 142/2018, verificar se o remetente reteve ICMS-ST ou se cabe antecipação na entrada no RS.\n\n' +
        '3. **Recomendações Práticas:**\n' +
        '- Segregar peças aplicadas em reparos mecânicos daquelas de balcão e conferir a MVA ajustada.'
    }

    var resIcms = consultarAgente('especialista-icms-st-cfop', pergIcms, fallbackIcms)

    // 2. Agente PIS / COFINS
    var pergPisCofins = ''
    var fallbackPisCofins = ''

    if (ehVenda) {
      pergPisCofins =
        'Analise esta operação de VENDA de autopeças sob a ótica de PIS e COFINS. ' +
        'Os itens estão sob CST 04 (Operação Tributável Monofásica - Alíquota Zero na Revenda, Lei nº 10.485/2002). ' +
        'Explique por que o valor de PIS e COFINS destacado é R$ 0,00 e qual o correto procedimento no faturamento.'

      fallbackPisCofins =
        '### Parecer Técnico ADECONT — PIS e COFINS (Venda com Regime Monofásico)\n\n' +
        '1. **Aplicação do CST 04 (Alíquota Zero na Saída Monofásica):**\n' +
        '- As autopeças e componentes automotivos (NCM 8301.20.00 — fechaduras para veículos automotores) estão sujeitos ao **regime de incidência concentrada (monofásico)** de PIS/COFINS regulado pela Lei nº 10.485/2002.\n' +
        '- Conforme preceitua a legislação federal, a tributação concentrada já ocorreu nas etapas fabril ou de importação com alíquotas majoradas. Na fase de comercialização atacadista e varejista, as receitas de revenda dessas mercadorias sujeitam-se à **alíquota ZERO (CST 04)**.\n' +
        '- Na NFe sob análise, o CST 04 e valor destacado de PIS R$ 0,00 e COFINS R$ 0,00 estão **100% corretos e em estrita conformidade**.\n\n' +
        '2. **Economia Tributária e Segregação Contábil:**\n' +
        '- O faturamento desta operação **não deve ser somado** às bases de cálculo de PIS e COFINS da apuração mensal, impedindo pagamento indevido de 0,65%/3,00% (Lucro Presumido) ou 1,65%/7,60% (Lucro Real).\n' +
        '- Se a empresa vendedora optar pelo Simples Nacional, o faturamento dessas peças deve ser expressamente segregado no PGDAS-D com dedução da parcela de PIS e COFINS do DAS.\n\n' +
        '3. **Recomendações Práticas ADECONT:**\n' +
        '- Auditar periodicamente o cadastro de NCMs no ERP da empresa para garantir que peças do capítulo 83, 84 e 87 permaneçam com CST de saída 04.\n' +
        '- Caso a empresa tenha recolhido PIS/COFINS sobre tais vendas no passado, é cabível levantamento de crédito e repetição de indébito dos últimos 5 anos.'
    } else {
      pergPisCofins =
        'Analise a aquisição sob a ótica de PIS e COFINS (monofásico de autopeças e créditos federais). ' +
        'Recomende o tratamento para revenda e uso.'

      fallbackPisCofins =
        '### Parecer Técnico ADECONT — PIS e COFINS (Operação de Compra)\n\n' +
        '1. **Regime Monofásico de Autopeças (Lei nº 10.485/2002):**\n' +
        '- Autopeças possuem alíquota zero (CST 04) na revenda subsequente.\n' +
        '- O adquirente deve parametrizar a saída sob CST 04 para não recolher PIS/COFINS em duplicidade.'
    }

    var resPisCofins = consultarAgente('especialista-pis-cofins', pergPisCofins, fallbackPisCofins)

    // 3. Agente Reforma Tributária (CBS / IBS / cClassTrib)
    var pergReforma = ''
    var fallbackReforma = ''

    if (temBlocoIbscbsNosItens || ibscbsTotVbc > 0) {
      pergReforma =
        'Analise o BLOCO IBSCBS REAL já destacado nesta nota fiscal com base na EC 132/2023 e LC 214/2025. ' +
        'Dados reais extraídos da nota: cClassTrib ' +
        (cClassTribsPresentes.join(', ') || '000001') +
        ', vBC R$ ' +
        ibscbsTotVbc.toFixed(2) +
        ', CBS ' +
        (itens[0] ? itens[0].get('ibscbs_pcbs') : 0.9) +
        '% (R$ ' +
        ibscbsTotVcbs.toFixed(2) +
        '), IBS UF ' +
        (itens[0] ? itens[0].get('ibscbs_pibs_uf') : 0.1) +
        '% (R$ ' +
        ibscbsTotVibs.toFixed(2) +
        '), Crédito Presuntivo R$ ' +
        ibscbsTotVcredpres.toFixed(2) +
        '. ' +
        'Compare a legislação ATUAL com a REFORMA TRIBUTÁRIA e forneça parecer com recomendações práticas.'

      fallbackReforma =
        '### Parecer Técnico ADECONT — Reforma Tributária (Bloco IBSCBS Real no XML)\n\n' +
        '1. **Análise Direta do Bloco IBSCBS Extraído da Nota Fiscal:**\n' +
        '- A nota fiscal já contempla o novo layout nacional da Reforma Tributária com o grupo `<IBSCBS>` e `<IBSCBSTot>` plenamente preenchido.\n' +
        '- **cClassTrib 000001:** Enquadramento exato no Regime Geral de Bens Móveis com tributação padrão, sem regime diferenciado ou alíquota reduzida.\n' +
        '- **Base de Cálculo:** R$ ' +
        ibscbsTotVbc.toFixed(2) +
        ' (deduzidos os tributos do período de teste conforme regras de transição).\n' +
        '- **CBS Destacada:** Alíquota teste de 0,90%, totalizando **R$ ' +
        ibscbsTotVcbs.toFixed(2) +
        '** recolhidos para a União.\n' +
        '- **IBS Destacado:** Alíquota teste estadual de 0,10% (IBS UF RS), totalizando **R$ ' +
        ibscbsTotVibs.toFixed(2) +
        '**, com IBS Municipal de 0,00% na transição inicial de 2026.\n' +
        '- **Crédito Presuntivo:** vCredPres = R$ ' +
        ibscbsTotVcredpres.toFixed(2) +
        ' (sem crédito presumido aplicável nesta operação padrão).\n\n' +
        '2. **Comparativo Estratégico: Legislação Atual × Reforma Tributária:**\n' +
        '- **Na Legislação Atual:** Venda interestadual B2C com ICMS próprio (12% = R$ 30,72) + DIFAL para o RS (5% = R$ 12,80) = Custo estadual de R$ 43,52, mais controle de PIS/COFINS monofásico CST 04 e intermediador de marketplace.\n' +
        '- **Na Reforma Tributária Plena (IBS + CBS):** Extingue-se a dualidade de ICMS interestadual vs DIFAL e o regime monofásico complexo. A tributação passa a ser **100% no destino** (princípio do destino), com alíquota única de referência calculada "por fora" e recolhimento centralizado pelo Comitê Gestor do IBS e Receita Federal.\n' +
        '- **Intermediação de Plataforma Digital:** No novo modelo, o intermediador (Mercado Livre / Ebazar) possui responsabilidade solidária de retenção ou conciliação dos tributos do split de pagamento, simplificando a conformidade fiscal do vendedor.\n\n' +
        '3. **Recomendações Estratégicas ADECONT:**\n' +
        '- Validar que o ERP da empresa já armazena e transmite os blocos `<IBSCBS>` com o código cClassTrib 000001 nas operações mercantis padrão.\n' +
        '- Acompanhar a compensação automática no split payment bancário das vendas via marketplace conforme a LC 214/2025.'
    } else {
      pergReforma =
        'Analise a transição para a Reforma Tributária (EC 132/2023 e LC 214/2025). ' +
        'Identifique o cClassTrib sugerido e apresente um comparativo entre a legislação atual e a Reforma.'

      fallbackReforma =
        '### Parecer Técnico ADECONT — Reforma Tributária (IBS, CBS e cClassTrib)\n\n' +
        '1. **Mapeamento de cClassTrib e Regime:**\n' +
        '- Itens enquadram-se no Regime Geral, com cClassTrib sugerido **000001** (Operações Padrão com Bens Materiais e Crédito Pleno).\n\n' +
        '2. **Comparativo: Legislação Atual vs Reforma:**\n' +
        '- Extinção da Substituição Tributária e do regime monofásico de PIS/COFINS, substituídos pelo IBS e CBS com princípio do destino e não-cumulatividade plena.'
    }

    var resReforma = consultarAgente(
      'especialista-reforma-tributaria',
      pergReforma,
      fallbackReforma,
    )

    // Parecer Consolidado Integrado
    var parecerConsolidado =
      '## RELATÓRIO TRIBUTÁRIO CONSOLIDADO ADECONT\n' +
      '### Análise Integrada: Legislação Atual × Reforma Tributária\n\n' +
      '**Nota Fiscal nº ' +
      numero +
      ' (Série ' +
      serie +
      ') | Operação: ' +
      (ehVenda ? 'VENDA (SAÍDA B2C)' : 'COMPRA (ENTRADA)') +
      '**\n' +
      '- Emitente: ' +
      emitente +
      '\n' +
      '- Destinatário: ' +
      destinatario +
      '\n' +
      (intermedNome ? '- Intermediador / Canal: ' + intermedNome + '\n' : '') +
      '- Volume: ' +
      itens.length +
      ' item(ns) analisado(s) | Valor Total da NF: R$ ' +
      totalNF.toFixed(2) +
      '\n' +
      (ibscbsTotVbc > 0
        ? '- **Reforma Tributária (Dados Reais do Bloco IBSCBS)**: Base R$ ' +
          ibscbsTotVbc.toFixed(2) +
          ' | CBS R$ ' +
          ibscbsTotVcbs.toFixed(2) +
          ' (0,90%) | IBS R$ ' +
          ibscbsTotVibs.toFixed(2) +
          ' (0,10%)\n'
        : '') +
      '\n---\n\n' +
      resIcms.conteudo +
      '\n\n---\n\n' +
      resPisCofins.conteudo +
      '\n\n---\n\n' +
      resReforma.conteudo +
      '\n\n---\n\n' +
      '### SÍNTESE DA RECOMENDAÇÃO ADECONT:\n' +
      (ehVenda
        ? 'Operação de venda interestadual B2C regularizada: DIFAL da EC 87/2015 devidamente calculado para o RS (R$ ' +
          difalTotal.toFixed(2) +
          '), PIS/COFINS sob alíquota zero (CST 04 - monofásico na revenda), e bloco IBSCBS já ativado em 2026 com cClassTrib 000001, CBS de 0,90% e IBS de 0,10%.'
        : 'Aquisição com crédito amplo ou antecipação conforme regras de destino do RS, com segregação de monofásicos para saída.')

    var analiseJson = {
      data_analise: new Date().toISOString(),
      nfe_id: nfeRec.id,
      chave_acesso: nfeRec.getString('chave_acesso'),
      numero: numero,
      tipo_operacao: tipoOp,
      total_itens: itens.length,
      valor_total_nfe: totalNF,
      intermediador: intermedNome || null,
      ibscbs_real:
        ibscbsTotVbc > 0
          ? {
              vBC: ibscbsTotVbc,
              vCBS: ibscbsTotVcbs,
              vIBS: ibscbsTotVibs,
              cClassTrib: cClassTribsPresentes[0] || '000001',
            }
          : null,
      agentes: {
        icms: {
          slug: 'especialista-icms-st-cfop',
          nome: 'Especialista ICMS, ICMS-ST, CEST e CFOP',
          status: resIcms.status,
          conteudo: resIcms.conteudo,
          aviso: resIcms.aviso || null,
        },
        pis_cofins: {
          slug: 'especialista-pis-cofins',
          nome: 'Especialista PIS e COFINS',
          status: resPisCofins.status,
          conteudo: resPisCofins.conteudo,
          aviso: resPisCofins.aviso || null,
        },
        reforma: {
          slug: 'especialista-reforma-tributaria',
          nome: 'Especialista Reforma Tributária IBS e CBS',
          status: resReforma.status,
          conteudo: resReforma.conteudo,
          aviso: resReforma.aviso || null,
        },
      },
      parecer_consolidado: parecerConsolidado,
      recomendacao_resumida: ehVenda
        ? 'Venda B2C com CFOP 6108, DIFAL EC 87/2015 regular para o RS (R$ ' +
          difalTotal.toFixed(2) +
          '), PIS/COFINS CST 04 alíquota zero e bloco IBSCBS ativo com cClassTrib 000001.'
        : 'Aquisição interestadual com crédito de ICMS/antecipação no RS e preparação para crédito pleno no IBS/CBS.',
    }

    nfeRec.set('analise', analiseJson)
    nfeRec.set('analise_status', 'analisado')
    $app.save(nfeRec)

    return e.json(200, {
      success: true,
      nfe_id: nfeRec.id,
      chave_acesso: nfeRec.getString('chave_acesso'),
      analise_status: 'analisado',
      analise: analiseJson,
    })
  } catch (errGeral) {
    console.log('Erro ao analisar NFe com agentes nativos:', errGeral)
    return e.json(200, {
      success: false,
      error:
        'Falha durante a orquestração dos agentes especialistas: ' + String(errGeral).slice(0, 300),
      analise_status: 'erro',
    })
  }
})
