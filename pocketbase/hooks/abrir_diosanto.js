/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — ABRIR A PASTA DO CLIENTE DIO SANTO TRATTORIA — REMOVER APÓS USO.
 *
 * Pedido do CEO (03/11/2026): "Cliente Dio Santo Trattoria pode importar o
 * Cliente pelo CNPJ do projeto Sistema Adecont Financeiro, e abra pasta para este."
 *
 * ── DE ONDE VEM O CNPJ ──
 * Não de digitação minha: da carga do projeto 56819 "Sistema ADECONT Financeiro"
 * (coleção `clients`), registro client_code 749:
 *   DIO SANTO TRATTORIA LTDA · fantasia DIO SANTO
 *   CNPJ 08.174.238/0001-45 · PJ · ativo_honorarios_mensais
 *   Vacaria/RS · CNAE 9520-0/00 (restaurantes) · cliente desde 2006-07-19
 *
 * ── O QUE ELA FAZ ──
 * 1. Cria a pasta com esse CNPJ (sem duplicar, se já existir).
 * 2. Verifica se a NF da SEGALAS que já está no sistema tem esse CNPJ como
 *    emitente ou destinatário — se tiver, ela PERTENCE a essa pasta e é movida.
 *    Se não tiver, fica como está e a resposta diz que não é dele.
 *
 * Mover só acontece quando o CNPJ bate: é a mesma trava da importação, não uma
 * exceção aberta à mão. E é reversível.
 */
routerAdd('POST', '/backend/v1/param-abrir-pasta-diosanto', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var CNPJ = '08174238000145'
  var NOME = 'DIO SANTO TRATTORIA LTDA'
  var out = {}

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /* ── 1. a pasta: cria ou reaproveita ── */
  var pastaId = ''
  var pastaNome = ''
  var criada = false
  try {
    var existentes = $app.findRecordsByFilter('param_pastas', '', 'nome', 1000, 0)
    for (var i = 0; i < existentes.length; i++) {
      if (norm(existentes[i].getString('nome')) === norm(NOME)) {
        pastaId = existentes[i].id
        pastaNome = existentes[i].getString('nome')
        break
      }
    }
    if (!pastaId) {
      var col = $app.findCollectionByNameOrId('param_pastas')
      var rec = new Record(col)
      rec.set('nome', NOME)
      rec.set('cnpj', CNPJ)
      rec.set('cliente_id', '')
      rec.set('cor', 'rose')
      rec.set(
        'observacao',
        'Cliente do Sistema ADECONT Financeiro (client_code 749) — Vacaria/RS, restaurante, cliente desde 19/07/2006.',
      )
      rec.set('ativo', true)
      rec.set('nome_busca', norm(NOME))
      rec.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      $app.save(rec)
      pastaId = rec.id
      pastaNome = NOME
      criada = true
    }
  } catch (err) {
    return e.json(500, { success: false, erro: 'criar pasta: ' + String(err).slice(0, 200) })
  }
  out.pasta = { id: pastaId, nome: pastaNome, cnpj: CNPJ, criada_agora: criada }

  /* ── 2. o que já está no sistema é deste cliente? ── */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {
    docs = []
  }

  var doCliente = []
  var deOutros = []
  for (var j = 0; j < docs.length; j++) {
    var d = docs[j]
    var cEmit = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cDest = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    var pertence = cEmit === CNPJ || cDest === CNPJ
    var info = {
      id: d.id,
      arquivo: d.getString('nome_arquivo'),
      emitente: d.getString('emitente_nome'),
      emitente_cnpj: cEmit,
      destinatario: d.getString('destinatario_nome'),
      destinatario_cnpj: cDest,
      valor: Number(d.get('valor_total')) || 0,
      pasta_atual: d.getString('pasta_nome'),
    }
    if (pertence) doCliente.push(info)
    else deOutros.push(info)
  }
  out.documentos_do_cliente = doCliente
  out.documentos_de_outros = deOutros

  /* ── 3. move os que são dele (a trava continua sendo o CNPJ) ── */
  var movidos = 0
  for (var k = 0; k < doCliente.length; k++) {
    try {
      var doc = $app.findRecordById('param_documentos', doCliente[k].id)
      doc.set('pasta', pastaId)
      doc.set('pasta_nome', pastaNome)
      $app.save(doc)
      var its = $app.findRecordsByFilter(
        'param_itens',
        'documento = "' + doCliente[k].id + '"',
        '',
        2000,
        0,
      )
      for (var m = 0; m < its.length; m++) {
        its[m].set('pasta', pastaId)
        $app.save(its[m])
      }
      movidos++
    } catch (_) {}
  }
  out.movidos = movidos

  /* ── 4. quantos documentos a pasta tem agora ── */
  var total = 0
  var entrada = 0
  var saida = 0
  try {
    var naPasta = $app.findRecordsByFilter(
      'param_documentos',
      'pasta = "' + pastaId + '"',
      '',
      5000,
      0,
    )
    total = naPasta.length
    for (var n = 0; n < naPasta.length; n++) {
      var v = Number(naPasta[n].get('valor_total')) || 0
      var dir = naPasta[n].getString('direcao')
      if (dir === 'entrada') entrada += v
      else if (dir === 'saida') saida += v
    }
  } catch (_) {}
  out.resumo_pasta = {
    documentos: total,
    entrada: Math.round(entrada * 100) / 100,
    saida: Math.round(saida * 100) / 100,
  }

  return e.json(200, { success: true, resultado: out })
})
