/// <reference path="../pb_data/types.d.ts" />

/**
 * PARAMETRIZADOR DE DOCUMENTOS FISCAIS DA REFORMA — backend
 * =========================================================
 * Pedido do CEO (03/11/2026), Fases 1 e 2 aprovadas: importar e processar XMLs
 * de NF-e e demais documentos, quebrar o arquivo em partes, individualizar as
 * informações e conferir contra as tabelas da reforma.
 *
 * ── A REGRA DO JSVM QUE MANDA NESTE ARQUIVO ──
 * O PocketBase executa cada callback em um VM separado. Função declarada em
 * nível de módulo NÃO existe dentro do callback — dá ReferenceError em runtime.
 * Por isso TODO o parser vive DENTRO do corpo de `/param-importar`. É feio de
 * ler e é o único jeito que funciona: o QA de integração reprova se ficar fora
 * ("top-level declarations are referenced inside callbacks").
 *
 * ── A DECISÃO CENTRAL ──
 * O XML é lido por PARSER, não por modelo de linguagem. Um DF-e tem estrutura
 * fixa e verificável; pedir a uma IA que "entenda o documento" introduziria
 * erro onde existe certeza. O que é inteligência aqui é a REGRA de cada
 * especialista: quais campos importam, o que é obrigatório, o que é divergência.
 *
 * ── O QUE ELE NÃO FAZ ──
 * Não interpreta texto livre nem inventa classificação. Onde o XML não traz o
 * campo, registra a lacuna. É essa lacuna que vira a auditoria pedida.
 */

routerAdd('OPTIONS', '/backend/v1/param-importar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, X-Painel-Token')
  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/param-importar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  // ══════════════ PARSER (inline: regra do JSVM) ══════════════
  var TAG_MALFORMADA = '__TAG_SEM_FECHAMENTO__'

  /**
   * Lê o conteúdo de uma tag. Distingue três casos que parecem iguais: tag
   * ausente, tag presente, e tag ABERTA SEM FECHAMENTO (XML truncado).
   * Na primeira versão os dois últimos davam '' e o total virava 0,00 em
   * silêncio — e um documento de R$ 0,00 no painel é pior que um erro: parece
   * dado. Agora o truncamento é sinalizado e vira divergência na conferência.
   */
  function tagDe(xml, nome) {
    var t = String(xml || '')
    if (!t) return ''
    var abre = '<' + nome
    var fecha = '</' + nome + '>'
    var i = t.indexOf(abre)
    if (i >= 0 && t.slice(0, i).trim() === '') {
      var j0 = t.indexOf('>', i)
      var k0 = t.lastIndexOf(fecha)
      if (j0 >= 0 && k0 > j0) return t.slice(j0 + 1, k0)
      if (j0 >= 0) return TAG_MALFORMADA
    }
    var a = t.indexOf(abre)
    if (a < 0) return ''
    var b = t.indexOf('>', a)
    if (b < 0) return TAG_MALFORMADA
    var c = t.indexOf(fecha, b)
    if (c < 0) return TAG_MALFORMADA
    return t.slice(b + 1, c)
  }

  function numDe(v) {
    if (v === TAG_MALFORMADA) return 0
    var n = Number(String(v || '').replace(',', '.'))
    return isFinite(n) ? n : 0
  }

  function limparDe(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function attrDe(xml, nome, attr) {
    var re = new RegExp('<' + nome + '[^>]*\\s' + attr + '="([^"]*)"')
    var m = re.exec(String(xml || ''))
    return m ? m[1] : ''
  }

  function todasDe(xml, nome) {
    var re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>', 'g')
    var out = []
    var m
    while ((m = re.exec(String(xml || ''))) !== null) out.push(m[1])
    return out
  }

  // ══════════════ ESPECIALISTAS DE QUEBRA ══════════════

  /** IDENTIFICAÇÃO — confere o cabeçalho contra a própria chave de acesso. */
  function espIdentificacao(xml) {
    var chave = attrDe(xml, 'infNFe', 'Id').replace(/^NFe/, '') || ''
    var ide = tagDe(xml, 'ide')
    var modelo = limparDe(tagDe(ide, 'mod'))
    var serie = limparDe(tagDe(ide, 'serie'))
    var numero = limparDe(tagDe(ide, 'nNF'))
    var dhEmi = limparDe(tagDe(ide, 'dhEmi') || tagDe(ide, 'dEmi'))
    var achados = []
    var faltando = []

    if (chave && chave.length === 44) {
      var mChave = chave.substr(20, 2)
      var sChave = chave.substr(22, 3)
      var nChave = chave.substr(25, 9)
      if (modelo && String(modelo).padStart(2, '0') !== mChave) {
        achados.push({
          tipo: 'DIVERGENCIA',
          campo: 'modelo',
          detalhe: 'cabeçalho diz ' + modelo + ' e a chave diz ' + mChave,
        })
      }
      if (serie && String(serie).padStart(3, '0') !== sChave) {
        achados.push({
          tipo: 'DIVERGENCIA',
          campo: 'serie',
          detalhe: 'cabeçalho diz ' + serie + ' e a chave diz ' + sChave,
        })
      }
      if (numero && String(numero).padStart(9, '0') !== nChave) {
        achados.push({
          tipo: 'DIVERGENCIA',
          campo: 'numero',
          detalhe: 'cabeçalho diz ' + numero + ' e a chave diz ' + nChave,
        })
      }
    } else if (!chave) {
      faltando.push('chave de acesso')
    }
    if (!modelo) faltando.push('modelo')
    if (!numero) faltando.push('número')

    return {
      chave: chave,
      modelo: modelo,
      serie: serie,
      numero: numero,
      data_emissao: dhEmi,
      achados: achados,
      faltando: faltando,
    }
  }

  function espEmitente(xml) {
    var emit = tagDe(xml, 'emit')
    var cnpj = limparDe(tagDe(emit, 'CNPJ') || tagDe(emit, 'CPF'))
    var nome = limparDe(tagDe(emit, 'xNome'))
    var uf = limparDe(tagDe(tagDe(emit, 'enderEmit'), 'UF'))
    var faltando = []
    if (!cnpj) faltando.push('CNPJ do emitente')
    if (!nome) faltando.push('nome do emitente')
    return { cnpj: cnpj, nome: nome, uf: uf, faltando: faltando }
  }

  function espDestinatario(xml) {
    var dest = tagDe(xml, 'dest')
    return {
      cnpj: limparDe(tagDe(dest, 'CNPJ') || tagDe(dest, 'CPF')),
      nome: limparDe(tagDe(dest, 'xNome')),
      faltando: [],
    }
  }

  function espTotais(xml) {
    var blocoTotal = tagDe(xml, 'total')
    var icmsTot = blocoTotal === TAG_MALFORMADA ? TAG_MALFORMADA : tagDe(blocoTotal, 'ICMSTot')
    var quebrado = blocoTotal === TAG_MALFORMADA || icmsTot === TAG_MALFORMADA
    return {
      estrutura_quebrada: quebrado,
      valor_total: numDe(tagDe(icmsTot, 'vNF')),
      valor_produtos: numDe(tagDe(icmsTot, 'vProd')),
      valor_icms: numDe(tagDe(icmsTot, 'vICMS')),
      valor_pis: numDe(tagDe(icmsTot, 'vPIS')),
      valor_cofins: numDe(tagDe(icmsTot, 'vCOFINS')),
      valor_ibs: numDe(tagDe(icmsTot, 'vIBS')),
      valor_cbs: numDe(tagDe(icmsTot, 'vCBS')),
      valor_is: numDe(tagDe(icmsTot, 'vIS')),
    }
  }

  /** ITENS — a quebra individualizada, um registro por <det>. */
  function espItens(xml) {
    var dets = todasDe(xml, 'det')
    var itens = []
    for (var i = 0; i < dets.length; i++) {
      var d = dets[i]
      var prod = tagDe(d, 'prod')
      var imposto = tagDe(d, 'imposto')
      var icms = tagDe(imposto, 'ICMS')
      var icms00 =
        tagDe(icms, 'ICMS00') ||
        tagDe(icms, 'ICMS20') ||
        tagDe(icms, 'ICMS90') ||
        tagDe(icms, 'ICMSSN102') ||
        tagDe(icms, 'ICMS51') ||
        tagDe(icms, 'ICMS60')
      var ibsCbs = tagDe(imposto, 'IBSCBS')
      var cClassTrib = limparDe(tagDe(ibsCbs, 'cClassTrib') || tagDe(imposto, 'cClassTrib'))
      var cstIbsCbs = limparDe(tagDe(ibsCbs, 'CST'))
      var gIbs = tagDe(ibsCbs, 'gIBSCBS')
      var vIbs = numDe(tagDe(gIbs, 'vIBSS') || tagDe(gIbs, 'vIBS'))
      var vCbs = numDe(tagDe(gIbs, 'vCBS'))
      var is = tagDe(imposto, 'IS')
      var vIs = numDe(tagDe(is, 'vIS'))

      itens.push({
        numero_item: limparDe(attrDe(d, 'det', 'n')) || String(i + 1),
        codigo_produto: limparDe(tagDe(prod, 'cProd')),
        descricao: limparDe(tagDe(prod, 'xProd')),
        ncm: limparDe(tagDe(prod, 'NCM')),
        cfop: limparDe(tagDe(prod, 'CFOP')),
        unidade: limparDe(tagDe(prod, 'uCom')),
        quantidade: numDe(tagDe(prod, 'qCom')),
        valor_unitario: numDe(tagDe(prod, 'vUnCom')),
        valor_total: numDe(tagDe(prod, 'vProd')),
        cst_icms: limparDe(tagDe(icms00, 'CST') || tagDe(icms00, 'CSOSN')),
        cst_ibs_cbs: cstIbsCbs,
        cclasstrib: cClassTrib,
        cbenef: limparDe(tagDe(prod, 'cBenef')),
        valor_ibs: vIbs,
        valor_cbs: vCbs,
        valor_is: vIs,
        tem_campos_rt: Boolean(cClassTrib || cstIbsCbs || vIbs || vCbs),
      })
    }
    return itens
  }

  /**
   * TRIBUTÁRIO — o documento como um todo: já está no padrão da reforma?
   * Se nenhum item traz cClassTrib, a resposta é não, e isso é ACHADO — não
   * erro de leitura. Em 2026 é o esperado, e é o que precisa ser parametrizado.
   */
  function espTributario(itens) {
    var comRT = 0
    var semNCM = 0
    var semCFOP = 0
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].tem_campos_rt) comRT++
      if (!itens[i].ncm) semNCM++
      if (!itens[i].cfop) semCFOP++
    }
    var achados = []
    if (itens.length > 0 && comRT === 0) {
      achados.push({
        tipo: 'LACUNA',
        campo: 'campos da reforma',
        detalhe:
          'nenhum dos ' +
          itens.length +
          ' itens traz cClassTrib/CST do IBS-CBS. O documento está no padrão anterior à reforma — é o esperado em 2026, e precisa ser classificado para a apuração assistida.',
      })
    }
    if (semNCM > 0)
      achados.push({ tipo: 'LACUNA', campo: 'NCM', detalhe: semNCM + ' item(ns) sem NCM' })
    if (semCFOP > 0)
      achados.push({ tipo: 'LACUNA', campo: 'CFOP', detalhe: semCFOP + ' item(ns) sem CFOP' })
    return {
      itens_total: itens.length,
      itens_com_campos_rt: comRT,
      percentual_com_rt: itens.length ? Math.round((comRT / itens.length) * 100) : 0,
      achados: achados,
    }
  }

  /** CONTÁBIL — descreve o que o documento sustenta; não inventa conta. */
  function espContabil(totais, emitente) {
    return {
      descricao:
        'Entrada de ' +
        (totais.valor_produtos || 0).toFixed(2) +
        ' em produtos/serviços de ' +
        (emitente.nome || 'emitente não identificado'),
      base_aquisicao: totais.valor_produtos,
      icms_destacado: totais.valor_icms,
      total_documento: totais.valor_total,
      natureza: 'entrada',
      observacao:
        'Valores extraídos do próprio documento. A conta contábil depende do plano de contas do escritório e não é deduzida aqui.',
    }
  }

  // ══════════════ EXECUÇÃO ══════════════
  var body = e.requestInfo().body || {}
  var xml = String(body.xml || '').trim()
  var nomeArquivo = String(body.nome_arquivo || 'documento.xml').slice(0, 300)
  var gravar = body.gravar !== false

  if (!xml) return e.json(400, { success: false, error: 'XML vazio.' })
  if (xml.length > 8 * 1024 * 1024)
    return e.json(400, { success: false, error: 'XML acima de 8 MB.' })
  if (xml.indexOf('<') < 0 || !/NFe|infNFe|infEvento|CTe|MDFe|NFS/i.test(xml.slice(0, 4000))) {
    return e.json(400, {
      success: false,
      error: 'O conteúdo não parece um documento fiscal eletrônico (NF-e, CT-e, MDF-e, NFS-e).',
    })
  }

  var ident = espIdentificacao(xml)
  var emit = espEmitente(xml)
  var dest = espDestinatario(xml)
  var totais = espTotais(xml)
  var itens = espItens(xml)
  var trib = espTributario(itens)
  var cont = espContabil(totais, emit)

  var achados = []
  for (var a = 0; a < ident.achados.length; a++) achados.push(ident.achados[a])
  for (var b = 0; b < trib.achados.length; b++) achados.push(trib.achados[b])
  for (var f = 0; f < ident.faltando.length; f++)
    achados.push({ tipo: 'FALTANDO', campo: ident.faltando[f], detalhe: 'obrigatório e ausente' })
  for (var g = 0; g < emit.faltando.length; g++)
    achados.push({ tipo: 'FALTANDO', campo: emit.faltando[g], detalhe: 'obrigatório e ausente' })

  if (totais.estrutura_quebrada) {
    achados.push({
      tipo: 'DIVERGENCIA',
      campo: 'estrutura do XML',
      detalhe:
        'bloco <total> ou <ICMSTot> aberto sem fechamento — arquivo truncado ou malformado. Os totais NÃO foram lidos e aparecem zerados por isso.',
    })
  }

  var somaItens = 0
  for (var k = 0; k < itens.length; k++) somaItens += itens[k].valor_total
  if (itens.length > 0 && totais.valor_produtos > 0) {
    var dif = Math.abs(somaItens - totais.valor_produtos)
    if (dif > 0.05) {
      achados.push({
        tipo: 'DIVERGENCIA',
        campo: 'soma dos itens',
        detalhe:
          'soma dos itens ' +
          somaItens.toFixed(2) +
          ' difere do total de produtos ' +
          totais.valor_produtos.toFixed(2) +
          ' (diferença ' +
          dif.toFixed(2) +
          ')',
      })
    }
  }

  var resultado = {
    sucesso: true,
    nome_arquivo: nomeArquivo,
    identificacao: ident,
    emitente: emit,
    destinatario: dest,
    totais: totais,
    itens: itens,
    tributario: trib,
    contabil: cont,
    achados: achados,
    total_achados: achados.length,
    gravado: false,
    documento_id: '',
  }

  if (gravar) {
    try {
      var colDoc = $app.findCollectionByNameOrId('param_documentos')
      var rec = new Record(colDoc)
      rec.set('chave', ident.chave)
      rec.set('modelo', ident.modelo || 'desconhecido')
      rec.set('numero', ident.numero)
      rec.set('serie', ident.serie)
      if (ident.data_emissao)
        rec.set('data_emissao', String(ident.data_emissao).slice(0, 19).replace('T', ' '))
      rec.set('emitente_cnpj', emit.cnpj)
      rec.set('emitente_nome', emit.nome)
      rec.set('destinatario_cnpj', dest.cnpj)
      rec.set('destinatario_nome', dest.nome)
      rec.set('uf', emit.uf)
      rec.set('valor_total', totais.valor_total)
      rec.set(
        'valor_tributos',
        totais.valor_icms +
          totais.valor_pis +
          totais.valor_cofins +
          totais.valor_ibs +
          totais.valor_cbs,
      )
      rec.set('qtd_itens', itens.length)
      rec.set('status', achados.length === 0 ? 'conferido' : 'divergente')
      rec.set('divergencias', achados.length)
      rec.set('nome_arquivo', nomeArquivo)
      rec.set(
        'resumo_conferencia',
        achados.length === 0
          ? 'Documento íntegro: ' + itens.length + ' itens conferidos, sem divergência.'
          : achados.length + ' achado(s) — ver detalhe.',
      )
      rec.set('importado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      $app.save(rec)
      resultado.documento_id = rec.id
      resultado.gravado = true

      var colIt = $app.findCollectionByNameOrId('param_itens')
      for (var n = 0; n < itens.length; n++) {
        var i2 = itens[n]
        var ri = new Record(colIt)
        ri.set('documento', rec.id)
        ri.set('chave_doc', ident.chave)
        ri.set('numero_item', Number(i2.numero_item) || n + 1)
        ri.set('codigo_produto', i2.codigo_produto)
        ri.set('descricao', i2.descricao)
        ri.set('ncm', i2.ncm)
        ri.set('cfop', i2.cfop)
        ri.set('cst_icms', i2.cst_icms)
        ri.set('cst_ibs_cbs', i2.cst_ibs_cbs)
        ri.set('cclasstrib', i2.cclasstrib)
        ri.set('cbenef', i2.cbenef)
        ri.set('quantidade', i2.quantidade)
        ri.set('unidade', i2.unidade)
        ri.set('valor_unitario', i2.valor_unitario)
        ri.set('valor_total', i2.valor_total)
        ri.set('valor_ibs', i2.valor_ibs)
        ri.set('valor_cbs', i2.valor_cbs)
        ri.set('valor_is', i2.valor_is)
        $app.save(ri)
      }
    } catch (err) {
      resultado.gravado = false
      resultado.erro_gravacao = String(err)
    }
  }

  return e.json(200, resultado)
})

/**
 * GET /backend/v1/param-classificacoes?tipo=cClassTrib&q=0000
 * Consulta das tabelas da reforma. Sem token de propósito: são tabelas
 * públicas oficiais (o portal do SVRS publica as mesmas), e a classificação
 * precisa funcionar em qualquer consulta do sistema.
 */
routerAdd('GET', '/backend/v1/param-classificacoes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var q = e.requestInfo().query || {}
  var filtro = q.tipo ? 'tipo = "' + String(q.tipo) + '"' : ''
  var regs = []
  try {
    regs = $app.findRecordsByFilter('param_classificacoes_rt', filtro, 'codigo', 3000, 0)
  } catch (_) {
    regs = []
  }
  var termo = String(q.q || '').toLowerCase()
  var out = []
  for (var i = 0; i < regs.length; i++) {
    var r = regs[i]
    var cod = r.getString('codigo')
    var des = r.getString('descricao')
    if (termo && (cod + ' ' + des).toLowerCase().indexOf(termo) < 0) continue
    out.push({
      id: r.id,
      tipo: r.getString('tipo'),
      codigo: cod,
      descricao: des,
      cst_pai: r.getString('cst_pai'),
    })
    if (out.length >= 500) break
  }
  return e.json(200, { success: true, total: out.length, itens: out })
})

/** GET /backend/v1/param-documentos — lista os importados (exige token). */
routerAdd('GET', '/backend/v1/param-documentos', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 200, 0)
  } catch (_) {}
  var out = []
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    out.push({
      id: d.id,
      chave: d.getString('chave'),
      modelo: d.getString('modelo'),
      numero: d.getString('numero'),
      serie: d.getString('serie'),
      emitente: d.getString('emitente_nome'),
      cnpj: d.getString('emitente_cnpj'),
      uf: d.getString('uf'),
      valor_total: d.get('valor_total'),
      qtd_itens: d.get('qtd_itens'),
      status: d.getString('status'),
      divergencias: d.get('divergencias'),
      importado_em: d.get('importado_em'),
      nome_arquivo: d.getString('nome_arquivo'),
    })
  }
  return e.json(200, { success: true, total: out.length, documentos: out })
})
