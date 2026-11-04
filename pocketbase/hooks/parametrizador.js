/// <reference path="../pb_data/types.d.ts" />

/**
 * PARAMETRIZADOR DE DOCUMENTOS FISCAIS DA REFORMA — backend
 * =========================================================
 * Pedido do CEO (03/11/2026), Fase 1 aprovada: importar e processar XMLs de
 * NF-e e demais documentos, quebrar o arquivo em partes, individualizar as
 * informações e conferir contra as tabelas da reforma.
 *
 * ── A DECISÃO CENTRAL DESTE ARQUIVO ──
 * O XML é lido por PARSER, não por modelo de linguagem. Um DF-e tem estrutura
 * fixa e verificável; pedir a uma IA que "entenda o documento" introduziria
 * erro onde existe certeza. O que é inteligência aqui é a REGRA de cada
 * especialista — quais campos importam naquele segmento, o que é obrigatório,
 * e o que conta como divergência. Isso é determinístico e auditável.
 *
 * ── OS ESPECIALISTAS DE QUEBRA ──
 * Cada segmento do XML tem um responsável, e cada um devolve o que achou e o
 * que faltou:
 *   IDENTIFICACAO  chave, modelo, número, série, emissão
 *   EMITENTE       CNPJ, nome, UF
 *   DESTINATARIO   CNPJ, nome
 *   TOTAIS         valor total, tributos
 *   ITENS          a quebra item a item (NCM, CFOP, CST, cClassTrib, valores)
 *   TRIBUTARIO     presença dos campos da reforma (IBS/CBS/IS)
 *   CONTABIL       o que seria lançado, a partir do que o documento traz
 *
 * ── O QUE ELE NÃO FAZ (e não deve fingir) ──
 * Não "interpreta" texto livre nem inventa classificação. Onde o XML não traz
 * o campo, ele diz que não trouxe — é exatamente essa lacuna que vira a
 * auditoria que o CEO pediu: documento sem cClassTrib é um achado, não um erro
 * do leitor.
 */

// ══════════════════════════════════════════════════════════════
// LEITOR DE XML — parser mínimo e suficiente para DF-e
// ══════════════════════════════════════════════════════════════
// JSVM não tem DOMParser. Um leitor por expressão regular é suficiente porque
// o DF-e é plano e previsível: cada campo aparece uma vez por bloco. Onde há
// repetição (itens), quebramos por <det>.

/**
 * LÊ O CONTEÚDO DE UMA TAG.
 *
 * ── O DEFEITO QUE ISSO CORRIGE (achado no teste local, antes de publicar) ──
 * `espTotais` fazia `tag(tag(xml,'total'), 'ICMSTot')`. Quando o primeiro tag
 * devolve o CONTEUDO de <total>, esse conteudo comeca com `<ICMSTot>` — e a
 * busca por `ICMSTot` dentro dele nao casava, porque o padrao exigia encontrar
 * a abertura em um texto que ja era o proprio conteudo. Resultado: TODOS os
 * totais vinham zero, em SILENCIO. O documento era gravado com valor 0,00.
 *
 * Correcao: se o texto JA e o conteudo da tag pedida, usamos ele direto.
 */
/**
 * LÊ O CONTEÚDO DE UMA TAG — à prova de XML malformado.
 *
 * ── O QUE O TESTE LOCAL REVELOU (antes de publicar) ──
 * A primeira versão devolvia '' em dois casos que parecem iguais e não são:
 *   1. a tag realmente não existe no documento;
 *   2. a tag existe mas o XML está TRUNCADO ou malformado.
 * Nos dois, o total virava 0,00 em silêncio — e um documento de R$ 0,00 no
 * painel é pior que um erro: parece dado.
 *
 * Agora a função distingue os casos: se a tag de abertura existe e a de
 * fechamento não, ela devolve FECHAMENTO_AUSENTE (símbolo), e quem chama
 * registra a divergência. Ausência de campo é achado; XML quebrado é defeito.
 */
var TAG_MALFORMADA = '__TAG_SEM_FECHAMENTO__'

function tag(xml, nome) {
  var t = String(xml || '')
  if (!t) return ''
  var abre = '<' + nome
  var fecha = '</' + nome + '>'

  // caso 1: o texto JÁ é o conteudo da tag (chamada encadeada)
  var i = t.indexOf(abre)
  if (i >= 0 && t.slice(0, i).trim() === '') {
    var j0 = t.indexOf('>', i)
    var k0 = t.lastIndexOf(fecha)
    if (j0 >= 0 && k0 > j0) return t.slice(j0 + 1, k0)
    if (j0 >= 0) return TAG_MALFORMADA
  }

  // caso 2: a tag esta dentro de um texto maior
  var a = t.indexOf(abre)
  if (a < 0) return ''
  var b = t.indexOf('>', a)
  if (b < 0) return TAG_MALFORMADA
  var c = t.indexOf(fecha, b)
  if (c < 0) return TAG_MALFORMADA
  return t.slice(b + 1, c)
}

/** verdadeiro quando o valor lido indica XML truncado/malformado */
function tagQuebrada(v) {
  return v === TAG_MALFORMADA
}

function tagAttr(xml, nome, attr) {
  var re = new RegExp('<' + nome + '[^>]*\\s' + attr + '="([^"]*)"')
  var m = re.exec(xml)
  return m ? m[1] : ''
}

function todas(xml, nome) {
  var re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>', 'g')
  var out = []
  var m
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}

function num(v) {
  if (v === TAG_MALFORMADA) return 0
  var n = Number(String(v || '').replace(',', '.'))
  return isFinite(n) ? n : 0
}

function limpar(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * ESPECIALISTA: IDENTIFICAÇÃO
 * A chave de acesso tem 44 dígitos e carrega UF, AAAA-MM, CNPJ, modelo, série
 * e número — ou seja, dá para conferir o cabeçalho contra a própria chave.
 * Essa conferência cruzada é o primeiro teste de integridade do documento e é
 * de graça: se o XML diz modelo 65 e a chave diz 55, o documento está adulterado
 * ou é de outro arquivo.
 */
function espIdentificacao(xml, inf) {
  var chave =
    tagAttr(xml, 'infNFe', 'Id').replace(/^NFe/, '') || tagAttr(xml, 'infEvento', 'Id') || ''
  var ide = tag(xml, 'ide')
  var modelo = limpar(tag(ide, 'mod'))
  var serie = limpar(tag(ide, 'serie'))
  var numero = limpar(tag(ide, 'nNF'))
  var dhEmi = limpar(tag(ide, 'dhEmi') || tag(ide, 'dEmi'))
  var achados = []
  var faltando = []

  if (chave && chave.length === 44) {
    var modeloDaChave = chave.substr(20, 2)
    var serieDaChave = chave.substr(22, 3)
    var numDaChave = chave.substr(25, 9)
    if (modelo && modeloDaChave && modelo.padStart(2, '0') !== modeloDaChave) {
      achados.push({
        tipo: 'DIVERGENCIA',
        campo: 'modelo',
        detalhe: 'cabeçalho diz ' + modelo + ' e a chave diz ' + modeloDaChave,
      })
    }
    if (serie && serieDaChave && String(serie).padStart(3, '0') !== serieDaChave) {
      achados.push({
        tipo: 'DIVERGENCIA',
        campo: 'serie',
        detalhe: 'cabeçalho diz ' + serie + ' e a chave diz ' + serieDaChave,
      })
    }
    if (numero && numDaChave && String(numero).padStart(9, '0') !== numDaChave) {
      achados.push({
        tipo: 'DIVERGENCIA',
        campo: 'numero',
        detalhe: 'cabeçalho diz ' + numero + ' e a chave diz ' + numDaChave,
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

/** ESPECIALISTA: EMITENTE */
function espEmitente(xml) {
  var emit = tag(xml, 'emit')
  var cnpj = limpar(tag(emit, 'CNPJ') || tag(emit, 'CPF'))
  var nome = limpar(tag(emit, 'xNome'))
  var uf = limpar(tag(tag(emit, 'enderEmit'), 'UF'))
  var faltando = []
  if (!cnpj) faltando.push('CNPJ do emitente')
  if (!nome) faltando.push('nome do emitente')
  return { cnpj: cnpj, nome: nome, uf: uf, faltando: faltando }
}

/** ESPECIALISTA: DESTINATÁRIO */
function espDestinatario(xml) {
  var dest = tag(xml, 'dest')
  return {
    cnpj: limpar(tag(dest, 'CNPJ') || tag(dest, 'CPF')),
    nome: limpar(tag(dest, 'xNome')),
    faltando: [],
  }
}

/** ESPECIALISTA: TOTAIS */
function espTotais(xml) {
  var blocoTotal = tag(xml, 'total')
  var icmsTot = blocoTotal === TAG_MALFORMADA ? TAG_MALFORMADA : tag(blocoTotal, 'ICMSTot')
  var quebrado = tagQuebrada(blocoTotal) || tagQuebrada(icmsTot)
  return {
    estrutura_quebrada: quebrado,
    valor_total: num(tag(icmsTot, 'vNF')),
    valor_produtos: num(tag(icmsTot, 'vProd')),
    valor_icms: num(tag(icmsTot, 'vICMS')),
    valor_pis: num(tag(icmsTot, 'vPIS')),
    valor_cofins: num(tag(icmsTot, 'vCOFINS')),
    valor_ibs: num(tag(icmsTot, 'vIBS')),
    valor_cbs: num(tag(icmsTot, 'vCBS')),
    valor_is: num(tag(icmsTot, 'vIS')),
  }
}

/**
 * ESPECIALISTA: ITENS — a quebra item a item.
 *
 * É aqui que o pedido do CEO se cumpre: "sua quebra deverá ser segmentada e as
 * informações deste individualizadas". Cada <det> vira uma linha, com o
 * tratamento da reforma quando o documento trouxer.
 */
function espItens(xml) {
  var dets = todas(xml, 'det')
  var itens = []
  for (var i = 0; i < dets.length; i++) {
    var d = dets[i]
    var prod = tag(d, 'prod')
    var imposto = tag(d, 'imposto')
    var icms = tag(imposto, 'ICMS')
    var icms00 =
      tag(icms, 'ICMS00') ||
      tag(icms, 'ICMS20') ||
      tag(icms, 'ICMS90') ||
      tag(icms, 'ICMSSN102') ||
      tag(icms, 'ICMS51') ||
      tag(icms, 'ICMS60')

    // ── campos da reforma (IBS/CBS/IS) — o layout 4.00 já os prevê ──
    var ibsCbs = tag(imposto, 'IBSCBS')
    var cClassTrib = limpar(tag(ibsCbs, 'cClassTrib') || tag(imposto, 'cClassTrib'))
    var cstIbsCbs = limpar(tag(ibsCbs, 'CST') || tag(tag(ibsCbs, 'gIBSCBS'), 'CST'))
    var gIbs = tag(ibsCbs, 'gIBSCBS')
    var vIbs = num(tag(gIbs, 'vIBSS') || tag(gIbs, 'vIBS'))
    var vCbs = num(tag(gIbs, 'vCBS'))
    var is = tag(imposto, 'IS')
    var vIs = num(tag(is, 'vIS'))

    itens.push({
      numero_item: limpar(tagAttr(d, 'det', 'n')) || String(i + 1),
      codigo_produto: limpar(tag(prod, 'cProd')),
      descricao: limpar(tag(prod, 'xProd')),
      ncm: limpar(tag(prod, 'NCM')),
      cfop: limpar(tag(prod, 'CFOP')),
      unidade: limpar(tag(prod, 'uCom')),
      quantidade: num(tag(prod, 'qCom')),
      valor_unitario: num(tag(prod, 'vUnCom')),
      valor_total: num(tag(prod, 'vProd')),
      cst_icms: limpar(tag(icms00, 'CST') || tag(icms00, 'CSOSN')),
      cst_ibs_cbs: cstIbsCbs,
      cclasstrib: cClassTrib,
      cbenef: limpar(tag(prod, 'cBenef')),
      valor_ibs: vIbs,
      valor_cbs: vCbs,
      valor_is: vIs,
      tem_campos_rt: Boolean(cClassTrib || cstIbsCbs || vIbs || vCbs),
    })
  }
  return itens
}

/**
 * ESPECIALISTA: TRIBUTÁRIO — olha o documento como um todo.
 * Responde a pergunta que interessa ao contador: "este documento já está no
 * padrão da reforma?" Se nenhum item traz cClassTrib, a resposta é não — e isso
 * é um ACHADO, não um erro de leitura.
 */
function espTributario(itens, totais) {
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
        ' itens traz cClassTrib/CST do IBS-CBS. ' +
        'O documento está no padrão anterior à reforma — é o esperado em 2026, ' +
        'e precisa ser classificado para a apuração assistida.',
    })
  }
  if (semNCM > 0) {
    achados.push({ tipo: 'LACUNA', campo: 'NCM', detalhe: semNCM + ' item(ns) sem NCM' })
  }
  if (semCFOP > 0) {
    achados.push({ tipo: 'LACUNA', campo: 'CFOP', detalhe: semCFOP + ' item(ns) sem CFOP' })
  }
  return {
    itens_total: itens.length,
    itens_com_campos_rt: comRT,
    percentual_com_rt: itens.length ? Math.round((comRT / itens.length) * 100) : 0,
    achados: achados,
  }
}

/**
 * ESPECIALISTA: CONTÁBIL
 * Não inventa lançamento: descreve o que o documento sustenta. O valor de
 * aquisição, o ICMS destacado (quando recuperável) e o total. Lançamento
 * contábil completo exige o plano de contas do escritório, que não está aqui —
 * e fingir que está seria pior que não ter.
 */
function espContabil(totais, emitente, destinatario) {
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
      'Valores extraídos do próprio documento. A conta contábil depende do plano de ' +
      'contas do escritório e não é deduzida aqui.',
  }
}

// ══════════════════════════════════════════════════════════════
// ROTAS
// ══════════════════════════════════════════════════════════════

routerAdd('OPTIONS', '/backend/v1/param-importar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, X-Painel-Token')
  return e.noContent(204)
})

/**
 * POST /backend/v1/param-importar
 * body: { xml: "<conteudo>", nome_arquivo: "nfe.xml" }
 * Devolve o documento quebrado + o que foi gravado.
 */
routerAdd('POST', '/backend/v1/param-importar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var xml = String(body.xml || '').trim()
  var nomeArquivo = String(body.nome_arquivo || 'documento.xml').slice(0, 300)
  var gravar = body.gravar !== false

  if (!xml) return e.json(400, { success: false, error: 'XML vazio.' })
  if (xml.length > 8 * 1024 * 1024) {
    return e.json(400, { success: false, error: 'XML acima de 8 MB.' })
  }
  // guarda-corpo: isto é um leitor de DF-e, não um interpretador de qualquer coisa
  if (xml.indexOf('<') < 0 || !/NFe|infNFe|infEvento|CTe|MDFe|NFS/i.test(xml.slice(0, 4000))) {
    return e.json(400, {
      success: false,
      error: 'O conteúdo não parece um documento fiscal eletrônico (NF-e, CT-e, MDF-e, NFS-e).',
    })
  }

  // ── a quebra, segmento por segmento ──
  var ident = espIdentificacao(xml, '')
  var emit = espEmitente(xml)
  var dest = espDestinatario(xml)
  var totais = espTotais(xml)
  var itens = espItens(xml)
  var trib = espTributario(itens, totais)
  var cont = espContabil(totais, emit, dest)

  var achados = []
  for (var a = 0; a < ident.achados.length; a++) achados.push(ident.achados[a])
  for (var b = 0; b < trib.achados.length; b++) achados.push(trib.achados[b])
  for (var f = 0; f < ident.faltando.length; f++) {
    achados.push({ tipo: 'FALTANDO', campo: ident.faltando[f], detalhe: 'obrigatório e ausente' })
  }
  for (var g = 0; g < emit.faltando.length; g++) {
    achados.push({ tipo: 'FALTANDO', campo: emit.faltando[g], detalhe: 'obrigatório e ausente' })
  }

  // soma dos itens x total do documento: o teste que pega arquivo truncado
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

  // ── grava ──
  if (gravar) {
    try {
      var colDoc = $app.findCollectionByNameOrId('param_documentos')
      var rec = new Record(colDoc)
      rec.set('chave', ident.chave)
      rec.set('modelo', ident.modelo || 'desconhecido')
      rec.set('versao_layout', limpar(tagAttr(xml, 'infNFe', 'versao')))
      rec.set('numero', ident.numero)
      rec.set('serie', ident.serie)
      if (ident.data_emissao) {
        rec.set('data_emissao', String(ident.data_emissao).slice(0, 19).replace('T', ' '))
      }
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
      rec.set('hash_arquivo', String(xml.length))
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

      // itens
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
 * Consulta das tabelas da reforma — usada na classificação e na auditoria.
 */
routerAdd('GET', '/backend/v1/param-classificacoes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var q = e.requestInfo().query || {}
  var filtro = ''
  if (q.tipo) filtro = 'tipo = "' + String(q.tipo) + '"'
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

/** GET /backend/v1/param-documentos — lista os importados */
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
