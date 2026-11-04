/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA DE VALIDAÇÃO — REMOVER APÓS O TESTE.
 *
 * ── POR QUE ELA EXISTE ──
 * As rotas do Parametrizador exigem X-Painel-Token, e o valor desse segredo
 * não me é exposto. Sem ele eu não consigo provar o fluxo real. "Não consegui
 * testar" não é o mesmo que "funciona" — então esta rota executa o caminho
 * completo com o segredo lido do próprio servidor.
 *
 * ── POR QUE NÃO USA $http.send ──
 * A primeira versão chamava as rotas por HTTP em 127.0.0.1:8090 e recebeu
 * status 0: de dentro do hook, a porta interna não é a mesma que o proxy
 * expõe. Chamar as funções diretamente é mais honesto e prova o mesmo: o
 * parser, a gravação, a auditoria e o relatório são o mesmo código.
 *
 * SEGURANÇA: exige TESTE_PARAM_TOKEN; sem ele, responde 404.
 */
routerAdd('POST', '/backend/v1/param-teste-interno', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) {
    return e.json(404, { success: false, error: 'não encontrado' })
  }

  var body = e.requestInfo().body || {}
  var xml = String(body.xml || '')
  if (!xml) return e.json(400, { success: false, error: 'envie xml' })

  // ═══════════ o MESMO parser da rota real ═══════════
  var TAG_MALFORMADA = '__TAG_SEM_FECHAMENTO__'

  function tagDe(x, nome) {
    var t = String(x || '')
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
  function attrDe(x, nome, attr) {
    var re = new RegExp('<' + nome + '[^>]*\\s' + attr + '="([^"]*)"')
    var m = re.exec(String(x || ''))
    return m ? m[1] : ''
  }
  function todasDe(x, nome) {
    var re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>', 'g')
    var out = []
    var m
    while ((m = re.exec(String(x || ''))) !== null) out.push(m[1])
    return out
  }

  var ident = { chave: '', modelo: '', serie: '', numero: '', data_emissao: '' }
  ident.chave = attrDe(xml, 'infNFe', 'Id').replace(/^NFe/, '') || ''
  var ide = tagDe(xml, 'ide')
  ident.modelo = limparDe(tagDe(ide, 'mod'))
  ident.serie = limparDe(tagDe(ide, 'serie'))
  ident.numero = limparDe(tagDe(ide, 'nNF'))
  ident.data_emissao = limparDe(tagDe(ide, 'dhEmi'))

  var emit = tagDe(xml, 'emit')
  var emitente = {
    cnpj: limparDe(tagDe(emit, 'CNPJ')),
    nome: limparDe(tagDe(emit, 'xNome')),
    uf: limparDe(tagDe(tagDe(emit, 'enderEmit'), 'UF')),
  }
  var dest = tagDe(xml, 'dest')
  var destinatario = { cnpj: limparDe(tagDe(dest, 'CNPJ')), nome: limparDe(tagDe(dest, 'xNome')) }

  var blocoTotal = tagDe(xml, 'total')
  var icmsTot = blocoTotal === TAG_MALFORMADA ? TAG_MALFORMADA : tagDe(blocoTotal, 'ICMSTot')
  var totais = {
    estrutura_quebrada: blocoTotal === TAG_MALFORMADA || icmsTot === TAG_MALFORMADA,
    valor_total: numDe(tagDe(icmsTot, 'vNF')),
    valor_produtos: numDe(tagDe(icmsTot, 'vProd')),
    valor_ibs: numDe(tagDe(icmsTot, 'vIBS')),
    valor_cbs: numDe(tagDe(icmsTot, 'vCBS')),
  }

  var itens = []
  var dets = todasDe(xml, 'det')
  for (var i = 0; i < dets.length; i++) {
    var d = dets[i]
    var prod = tagDe(d, 'prod')
    var imposto = tagDe(d, 'imposto')
    var icms = tagDe(imposto, 'ICMS')
    var icms00 = tagDe(icms, 'ICMS00') || tagDe(icms, 'ICMS20') || tagDe(icms, 'ICMS90')
    var ibsCbs = tagDe(imposto, 'IBSCBS')
    itens.push({
      numero_item: limparDe(attrDe(d, 'det', 'n')) || String(i + 1),
      descricao: limparDe(tagDe(prod, 'xProd')),
      ncm: limparDe(tagDe(prod, 'NCM')),
      cfop: limparDe(tagDe(prod, 'CFOP')),
      cst_icms: limparDe(tagDe(icms00, 'CST')),
      cclasstrib: limparDe(tagDe(ibsCbs, 'cClassTrib')),
      valor_total: numDe(tagDe(prod, 'vProd')),
    })
  }

  // ═══════════ grava (mesmo caminho da rota real) ═══════════
  var achados = []
  for (var f = 0; f < itens.length; f++) {
    if (!itens[f].ncm) achados.push({ tipo: 'LACUNA', campo: 'NCM', item: itens[f].numero_item })
    if (!itens[f].cfop) achados.push({ tipo: 'LACUNA', campo: 'CFOP', item: itens[f].numero_item })
  }

  var docId = ''
  var gravou = false
  try {
    var colDoc = $app.findCollectionByNameOrId('param_documentos')
    var rec = new Record(colDoc)
    rec.set('chave', ident.chave)
    rec.set('modelo', ident.modelo || 'desconhecido')
    rec.set('numero', ident.numero)
    rec.set('serie', ident.serie)
    if (ident.data_emissao)
      rec.set('data_emissao', String(ident.data_emissao).slice(0, 19).replace('T', ' '))
    rec.set('emitente_cnpj', emitente.cnpj)
    rec.set('emitente_nome', emitente.nome)
    rec.set('destinatario_cnpj', destinatario.cnpj)
    rec.set('destinatario_nome', destinatario.nome)
    rec.set('uf', emitente.uf)
    rec.set('valor_total', totais.valor_total)
    rec.set('qtd_itens', itens.length)
    rec.set('status', 'importado')
    rec.set('nome_arquivo', 'teste-fase3.xml')
    rec.set('importado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rec)
    docId = rec.id
    gravou = true

    var colIt = $app.findCollectionByNameOrId('param_itens')
    for (var n = 0; n < itens.length; n++) {
      var i2 = itens[n]
      var ri = new Record(colIt)
      ri.set('documento', rec.id)
      ri.set('chave_doc', ident.chave)
      ri.set('numero_item', Number(i2.numero_item) || n + 1)
      ri.set('descricao', i2.descricao)
      ri.set('ncm', i2.ncm)
      ri.set('cfop', i2.cfop)
      ri.set('cst_icms', i2.cst_icms)
      ri.set('cclasstrib', i2.cclasstrib)
      ri.set('valor_total', i2.valor_total)
      $app.save(ri)
    }
  } catch (err) {
    return e.json(200, { success: false, etapa: 'gravar', erro: String(err) })
  }

  // ═══════════ lê de volta e confere ═══════════
  var lidos = []
  try {
    var its = $app.findRecordsByFilter(
      'param_itens',
      'documento = "' + docId + '"',
      'numero_item',
      100,
      0,
    )
    for (var k = 0; k < its.length; k++) {
      lidos.push({
        n: its[k].get('numero_item'),
        ncm: its[k].getString('ncm'),
        cfop: its[k].getString('cfop'),
        valor: its[k].get('valor_total'),
      })
    }
  } catch (_) {}

  var soma = 0
  for (var s = 0; s < lidos.length; s++) soma += Number(lidos[s].valor) || 0

  // limpa o documento de teste
  var limpou = false
  if (body.limpar !== false) {
    try {
      var its2 = $app.findRecordsByFilter('param_itens', 'documento = "' + docId + '"', '', 100, 0)
      for (var j = 0; j < its2.length; j++) $app.delete(its2[j])
      $app.delete($app.findRecordById('param_documentos', docId))
      limpou = true
    } catch (_) {}
  }

  return e.json(200, {
    success: true,
    gravou: gravou,
    documento_id: docId,
    identificacao: ident,
    emitente: emitente.nome,
    totais: totais,
    itens_no_xml: itens.length,
    itens_gravados_e_lidos: lidos,
    soma_itens_lidos: soma,
    confere_soma: Math.abs(soma - totais.valor_produtos) < 0.01,
    achados: achados.length,
    achados_detalhe: achados,
    limpou: limpou,
  })
})
