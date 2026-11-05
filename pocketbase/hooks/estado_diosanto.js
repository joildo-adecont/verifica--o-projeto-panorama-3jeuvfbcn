/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — ESTADO DO DIO SANTO E PREPARO PARA O LOTE. REMOVER DEPOIS.
 *
 * O CEO vai trazer mais XMLs em lote. Antes de importar, preciso saber:
 *   1. Quais documentos do DIO SANTO já estão no sistema (para o lote não duplicar).
 *   2. Como está a estrutura Base / Compras / Vendas dele.
 *   3. Se as 284 regras recuperadas mudaram a classificação dos itens que já estão lá.
 */
routerAdd('POST', '/backend/v1/param-estado-diosanto', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var CNPJ = '08174238000145'
  var out = {}

  /* ── 1. a estrutura de pastas ── */
  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
  } catch (_) {}
  var doCliente = []
  var baseId = ''
  for (var i = 0; i < pastas.length; i++) {
    var c = String(pastas[i].getString('cnpj') || '').replace(/\D/g, '')
    if (c !== CNPJ) continue
    if (!pastas[i].getString('pai')) baseId = pastas[i].id
    doCliente.push({
      id: pastas[i].id,
      nome: pastas[i].getString('nome'),
      tipo: pastas[i].getString('tipo') || 'base',
      pai: pastas[i].getString('pai'),
    })
  }
  out.pastas = doCliente

  /* ── 2. documentos do cliente e suas chaves (para dedup do lote novo) ── */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 20000, 0)
  } catch (_) {}
  var meus = []
  var chaves = []
  var porPasta = {}
  for (var j = 0; j < docs.length; j++) {
    var d = docs[j]
    var cE = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cD = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    if (cE !== CNPJ && cD !== CNPJ) continue
    var item = {
      id: d.id,
      chave: d.getString('chave'),
      modelo: d.getString('modelo'),
      numero: d.getString('numero'),
      serie: d.getString('serie'),
      data: String(d.get('data_emissao') || '').slice(0, 10),
      emitente: d.getString('emitente_nome'),
      direcao: d.getString('direcao'),
      valor: Number(d.get('valor_total')) || 0,
      itens: d.get('qtd_itens'),
      pasta: d.getString('pasta_nome'),
    }
    meus.push(item)
    if (item.chave) chaves.push(item.chave)
    var pn = item.pasta || '(sem pasta)'
    if (!porPasta[pn]) porPasta[pn] = { documentos: 0, valor: 0 }
    porPasta[pn].documentos++
    porPasta[pn].valor += item.valor
  }
  out.documentos = meus
  out.total_documentos = meus.length
  out.chaves_existentes = chaves
  out.por_pasta = porPasta

  /* ── 3. itens e a classificação com o motor NOVO (284 regras recuperadas) ── */
  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 20000, 0)
  } catch (_) {}
  var ids = {}
  for (var k = 0; k < meus.length; k++) ids[meus[k].id] = true
  var ncms = {}
  var totalItens = 0
  for (var m = 0; m < itens.length; m++) {
    if (!ids[itens[m].getString('documento')]) continue
    totalItens++
    var ncm = itens[m].getString('ncm') || '(sem NCM)'
    if (!ncms[ncm])
      ncms[ncm] = { ncm: ncm, itens: 0, valor: 0, desc: itens[m].getString('descricao') }
    ncms[ncm].itens++
    ncms[ncm].valor += Number(itens[m].get('valor_total')) || 0
  }
  var listaNcm = []
  for (var n in ncms) listaNcm.push(ncms[n])
  listaNcm.sort(function (a, b) {
    return b.valor - a.valor
  })
  out.total_itens = totalItens
  out.ncms = listaNcm

  /* ── 4. o que já existe para o lote não duplicar ── */
  out.resumo_lote = {
    documentos_existentes: meus.length,
    chaves_para_dedup: chaves.length,
    itens_existentes: totalItens,
    ncms_distintos: listaNcm.length,
  }

  return e.json(200, { success: true, resultado: out })
})
