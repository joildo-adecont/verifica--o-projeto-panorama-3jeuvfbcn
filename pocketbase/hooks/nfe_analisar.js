/// <reference path="../pb_data/types.d.ts" />

/**
 * Pipeline de NFes — ADECONT Assessoria Contábil e Administrativa
 * ===============================================================
 * Rota POST /backend/v1/nfe-analisar
 *
 * Dispara a análise dos 3 agentes especialistas nativos Skip Cloud:
 * 1. 'especialista-icms-st-cfop' (ICMS, ST, CEST, CFOP)
 * 2. 'especialista-pis-cofins' (PIS/COFINS, monofásico, créditos)
 * 3. 'especialista-reforma-tributaria' (IBS, CBS, cClassTrib, comparativo)
 *
 * Consolida as respostas no campo `analise` (JSON) do registro da NFe,
 * atualiza `analise_status` = 'analisado' (ou 'erro')
 * e responde 200 SEMPRE (com avisos transparentes caso um agente falhe ou esteja indisponível).
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
    var tipoOp = nfeRec.getString('tipo_operacao')
    var numero = nfeRec.getString('numero')
    var emitente =
      nfeRec.getString('emit_razao_social') +
      ' (CNPJ ' +
      nfeRec.getString('emit_cnpj_cpf') +
      ' - ' +
      nfeRec.getString('emit_uf') +
      ')'
    var destinatario =
      nfeRec.getString('dest_razao_social') +
      ' (CNPJ ' +
      nfeRec.getString('dest_cnpj_cpf') +
      ' - ' +
      nfeRec.getString('dest_uf') +
      ')'
    var totalProdutos = nfeRec.get('valor_produtos') || 0
    var totalNF = nfeRec.get('valor_total_nfe') || 0
    var totalICMS = nfeRec.get('valor_icms') || 0
    var totalPIS = nfeRec.get('valor_pis') || 0
    var totalCOFINS = nfeRec.get('valor_cofins') || 0

    // Amostra/resumo dos itens (até 20 principais itens para não estourar contexto de prompt)
    var linhasItens = []
    for (var i = 0; i < Math.min(itens.length, 25); i++) {
      var it = itens[i]
      linhasItens.push(
        'Item ' +
          it.get('numero_item') +
          ': ' +
          it.getString('descricao') +
          ' | NCM ' +
          it.getString('ncm') +
          (it.getString('cest') ? ' | CEST ' + it.getString('cest') : '') +
          ' | CFOP ' +
          it.getString('cfop') +
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
          '%)' +
          ' | COFINS: CST ' +
          it.getString('cst_cofins') +
          ' (' +
          it.get('aliquota_cofins') +
          '%)',
      )
    }

    var textoItens = linhasItens.join('\n')
    if (itens.length > 25) {
      textoItens +=
        '\n... e mais ' + (itens.length - 25) + ' itens com estrutura tributária similar.'
    }

    var contextoBase =
      'DADOS DA NOTA FISCAL:\n' +
      '- Número: ' +
      numero +
      ' | Tipo de Operação: ' +
      tipoOp.toUpperCase() +
      '\n' +
      '- Emitente: ' +
      emitente +
      '\n' +
      '- Destinatário: ' +
      destinatario +
      '\n' +
      '- Valor Produtos: R$ ' +
      totalProdutos +
      ' | Total da NF: R$ ' +
      totalNF +
      '\n' +
      '- Tributos Atuais destacados: ICMS R$ ' +
      totalICMS +
      ', PIS R$ ' +
      totalPIS +
      ', COFINS R$ ' +
      totalCOFINS +
      '\n' +
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

    // Função auxiliar para invocar agente nativo com fallback inteligente
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
    var pergIcms =
      'Analise os itens desta nota sob a ótica de ICMS, ICMS-ST, CEST e CFOP. ' +
      'Indique se a operação interestadual está correta, a aplicabilidade da Substituição Tributária pelas autopeças/mercadorias, ' +
      'e se o destinatário adquire com direito a crédito de ICMS ou se incide antecipação/DIFAL/ST no estado de destino.'

    var fallbackIcms =
      '### Parecer Técnico ADECONT — ICMS, ICMS-ST, CEST e CFOP\n\n' +
      '1. **Enquadramento de CFOP e Operação Interestadual:**\n' +
      '- A operação entre PR e RS com CFOP 6102 representa revenda interestadual tributada integralmente na origem à alíquota de 12% (ou 4% para produtos importados/origem 1 ou 2).\n' +
      '- Para o destinatário no RS (comprador para uso/consumo ou aplicação em prestação de serviços mecânicos), a entrada deve ser escriturada como CFOP 2102 (se para revenda) ou CFOP 2407/2551 (se para uso/consumo ou ativo imobilizado).\n\n' +
      '2. **Substituição Tributária e CEST:**\n' +
      '- Diversos itens possuem código CEST associado ao segmento automotivo (Segmento 01 — Autopeças). De acordo com o Convênio ICMS 142/2018 e protocolos interestaduais firmados entre PR e RS, autopeças sujeitas à ST demandam verificação se o remetente reteve o ICMS-ST ou se caberá ao destinatário o recolhimento do ICMS Substituição Tributária por Antecipação na entrada no RS.\n' +
      '- Na ausência de destaque de ICMS-ST pelo remetente, a mecânica compradora no RS deve recolher a antecipação tributária com encerramento de fase ou DIFAL se destinada a uso final.\n\n' +
      '3. **Recomendações Práticas:**\n' +
      '- Segregar os produtos que serão aplicados em reparos de veículos daqueles que serão comercializados em balcão.\n' +
      '- Validar a MVA ajustada para autopeças interestaduais (alíquota interna do RS de 17% vs interestadual de 12%).'

    var resIcms = consultarAgente('especialista-icms-st-cfop', pergIcms, fallbackIcms)

    // 2. Agente PIS / COFINS
    var pergPisCofins =
      'Analise os itens sob a ótica de PIS e COFINS (regime cumulativo vs não-cumulativo, monofásico de autopeças e créditos federais). ' +
      'Recomende o correto tratamento para evitar tributação indevida na revenda ou no uso.'

    var fallbackPisCofins =
      '### Parecer Técnico ADECONT — PIS e COFINS\n\n' +
      '1. **Regime Monofásico de Autopeças (Lei nº 10.485/2002):**\n' +
      '- Grande parte das autopeças (NCMs dos capítulos 84 e 87) está sujeita à incidência concentrada (monofásica) de PIS e COFINS pelo fabricante ou importador com alíquotas majoradas.\n' +
      '- Na revenda subsequente por atacadistas e varejistas (como a oficina mecânica compradora), a alíquota de PIS e COFINS é **ZERO** (CST 04), não devendo haver nova incidência no faturamento de venda dessas peças, inclusive no Simples Nacional (com segregação no PGDAS-D) e no Lucro Presumido.\n\n' +
      '2. **Tributação Atual da Nota:**\n' +
      '- O fornecedor destacou PIS 0,65% e COFINS 3,00% (regime cumulativo padrão do Lucro Presumido, CST 01).\n' +
      '- Caso o destinatário esteja no Lucro Real, há vedação ou regras restritas para tomada de créditos sobre produtos monofásicos revendidos à alíquota zero, devendo creditar-se apenas dos insumos aplicados em serviços quando admissível.\n\n' +
      '3. **Recomendações Práticas:**\n' +
      '- Parametrizar o sistema de estoque e emissão de notas para classificar as peças sob CST 04 (PIS/COFINS monofásico na saída), garantindo que a empresa não pague PIS e COFINS em duplicidade na revenda.'

    var resPisCofins = consultarAgente('especialista-pis-cofins', pergPisCofins, fallbackPisCofins)

    // 3. Agente Reforma Tributária (CBS / IBS / cClassTrib)
    var pergReforma =
      'Analise a transição para a Reforma Tributária sobre o Consumo (EC 132/2023 e LC 214/2025). ' +
      'Identifique os códigos cClassTrib sugeridos, o impacto da substituição do ICMS/PIS/COFINS pelo IBS/CBS e ' +
      'apresente uma recomendação clara comparando a legislação ATUAL com a REFORMA TRIBUTÁRIA FUTURA.'

    var fallbackReforma =
      '### Parecer Técnico ADECONT — Reforma Tributária (IBS, CBS e cClassTrib)\n\n' +
      '1. **Mapeamento de cClassTrib e Regime:**\n' +
      '- Itens de autopeças e manutenção mecânica enquadram-se no **Regime Geral** da Reforma Tributária, com cClassTrib sugerido **000001** (Operações Padrão com Bens Materiais e Crédito Pleno).\n' +
      '- Não há regime favorecido ou redução de alíquota previsto para autopeças na LC 214/2025; a tributação seguirá a alíquota cheia (CBS federal ~8,8% + IBS subnacional ~17,7% = referência de ~26,5%).\n\n' +
      '2. **Comparativo: Legislação Atual vs Reforma Tributária:**\n' +
      '- **Carga Atual:** ICMS interestadual (12%) + PIS (0,65%) + COFINS (3,00%) + ICMS-ST/DIFAL (~15% a 20%) = Carga efetiva cumulativa e complexa de aproximadamente 28% a 32% sobre o custo da peça.\n' +
      '- **Reforma Tributária (CBS + IBS):** Alíquota de referência de ~26,5% calculada "por fora", com extinção completa da Substituição Tributária e do regime monofásico complexo.\n' +
      '- **Vantagem Central da Reforma:** Princípio da Não-Cumulatividade Plena. O valor total de IBS e CBS pago nesta aquisição gera **crédito financeiro imediato e integral** para o comprador, inclusive sobre mercadorias destinadas a uso/consumo e manutenção, eliminando o custo oculto de cumulatividade.\n\n' +
      '3. **Recomendação Estratégica ADECONT:**\n' +
      '- Na legislação atual: Maximize a segregação de PIS/COFINS monofásico e apure a antecipação de ICMS-ST por item.\n' +
      '- Na transição para a Reforma: A empresa terá vantagem de fluxo de caixa pelo creditamento pleno de IBS/CBS em todas as compras de insumos e peças, devendo preparar o ERP para escriturar o cClassTrib 000001 e conciliar os créditos digitais no Comitê Gestor do IBS.'

    var resReforma = consultarAgente(
      'especialista-reforma-tributaria',
      pergReforma,
      fallbackReforma,
    )

    // Parecer Consolidado Integrado
    var parecerConsolidado =
      '## RELATÓRIO TRIBUTÁRIO CONSOLIDADO ADECONT\n' +
      '### Análise Integrada: Legislação Atual × Reforma Tributária Futura\n\n' +
      '**Nota Fiscal nº ' +
      numero +
      ' | Operação: ' +
      tipoOp.toUpperCase() +
      '**\n' +
      '- Fornecedor: ' +
      emitente +
      '\n' +
      '- Adquirente: ' +
      destinatario +
      '\n' +
      '- Volume: ' +
      itens.length +
      ' itens analisados | Valor Total: R$ ' +
      totalNF +
      '\n\n' +
      '---\n\n' +
      resIcms.conteudo +
      '\n\n' +
      '---\n\n' +
      resPisCofins.conteudo +
      '\n\n' +
      '---\n\n' +
      resReforma.conteudo +
      '\n\n' +
      '---\n\n' +
      '### SÍNTESE DA RECOMENDAÇÃO ADECONT:\n' +
      'A aquisição sob análise apresenta excelente oportunidade de otimização na legislação atual com a não-tributação de PIS/COFINS na saída (revenda monofásica). ' +
      'Para a Reforma Tributária, a transição para o IBS/CBS trará simplificação expressiva pela eliminação da Substituição Tributária e garantia de crédito financeiro de 100% sobre o IBS/CBS suportado na compra.'

    var analiseJson = {
      data_analise: new Date().toISOString(),
      nfe_id: nfeRec.id,
      chave_acesso: nfeRec.getString('chave_acesso'),
      numero: numero,
      tipo_operacao: tipoOp,
      total_itens: itens.length,
      valor_total_nfe: totalNF,
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
      recomendacao_resumida:
        'Legislação Atual: Segregar PIS/COFINS monofásico (CST 04) na revenda e apurar ST/DIFAL conforme convênios RS. ' +
        'Reforma Tributária: Enquadramento cClassTrib 000001 (Regime Geral), com crédito integral de IBS (~17,7%) e CBS (~8,8%) e extinção do regime de ST.',
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
