/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — ITENS DE UM CLIENTE ESPECÍFICO.
 *
 * ── O DEFEITO QUE ELA CORRIGE ──
 * O Analisador Tributário precisa dos itens DO cliente escolhido. A rota
 * `/param-itens-todos` devolve todos os itens da base, e eu tentei filtrar no
 * front com um `return true` que não filtrava nada — o analisador mostraria a
 * carteira inteira do escritório como se fosse a de um cliente. Um erro desses
 * não dá mensagem: dá número errado com cara de análise.
 *
 * O filtro certo é pelo campo `pasta` do item, que já existe desde a Fase 6 e é
 * preenchido quando o documento é arquivado.
 *
 * Query: ?pasta=ID  (aceita também ?cnpj=)
 */
routerAdd('GET', '/backend/v1/param-itens-cliente', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var q = e.requestInfo().query || {}
  var baseId = String(q.pasta || '')
  var cnpj = String(q.cnpj || '').replace(/\D/g, '')
  if (!baseId && !cnpj) {
    return e.json(400, { success: false, error: 'Informe a pasta ou o CNPJ do cliente.' })
  }

  /* ── reúne as pastas do cliente: a base e as filhas ── */
  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
  } catch (_) {}

  var idsCliente = {}
  var baseEncontrada = null
  var ufCliente = ''

  if (baseId) {
    for (var i = 0; i < pastas.length; i++) {
      if (pastas[i].id === baseId) baseEncontrada = pastas[i]
    }
    if (baseEncontrada) {
      idsCliente[baseEncontrada.id] = true
      cnpj = String(baseEncontrada.getString('cnpj') || '').replace(/\D/g, '')
    }
  }
  if (!baseEncontrada && cnpj) {
    for (var j = 0; j < pastas.length; j++) {
      if (
        !pastas[j].getString('pai') &&
        String(pastas[j].getString('cnpj') || '').replace(/\D/g, '') === cnpj
      ) {
        baseEncontrada = pastas[j]
        idsCliente[pastas[j].id] = true
        break
      }
    }
  }

  /* filhas da base */
  var filhas = []
  if (baseEncontrada) {
    for (var k = 0; k < pastas.length; k++) {
      if (pastas[k].getString('pai') === baseEncontrada.id) {
        idsCliente[pastas[k].id] = true
        filhas.push({
          id: pastas[k].id,
          tipo: pastas[k].getString('tipo'),
          nome: pastas[k].getString('nome'),
        })
      }
    }
  }

  /* ── documentos do cliente (pela pasta ou pelo CNPJ nas partes) ── */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 20000, 0)
  } catch (_) {}

  var docsDoCliente = {}
  var ufs = {}
  for (var m = 0; m < docs.length; m++) {
    var d = docs[m]
    var pid = d.getString('pasta')
    var cE = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cD = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    var pertence = false
    if (idsCliente[pid]) pertence = true
    else if (cnpj && (cE === cnpj || cD === cnpj)) pertence = true
    if (!pertence) continue
    docsDoCliente[d.id] = {
      direcao: d.getString('direcao'),
      uf: d.getString('uf'),
      data: String(d.get('data_emissao') || '').slice(0, 7),
      emitente: d.getString('emitente_nome'),
    }
    if (d.getString('uf')) ufs[d.getString('uf')] = (ufs[d.getString('uf')] || 0) + 1
  }

  /* UF predominante do emitente — usada só como sugestão, nunca como verdade */
  var ufSugerida = ''
  var maiorUf = 0
  for (var u in ufs) {
    if (ufs[u] > maiorUf) {
      maiorUf = ufs[u]
      ufSugerida = u
    }
  }

  /* ── itens desses documentos ── */
  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 20000, 0)
  } catch (_) {}

  var out = []
  for (var n = 0; n < itens.length; n++) {
    var it = itens[n]
    var docId = it.getString('documento')
    var ref = docsDoCliente[docId]
    if (!ref) continue
    out.push({
      documento: docId,
      competencia: ref.data,
      emitente: ref.emitente,
      numero_item: it.get('numero_item'),
      descricao: it.getString('descricao'),
      ncm: it.getString('ncm'),
      cfop: it.getString('cfop'),
      direcao: it.getString('direcao') || ref.direcao,
      valor: Number(it.get('valor_total')) || 0,
      cclasstrib: it.getString('cclasstrib'),
    })
  }

  return e.json(200, {
    success: true,
    cliente: baseEncontrada
      ? {
          id: baseEncontrada.id,
          nome: baseEncontrada.getString('nome'),
          cnpj: String(baseEncontrada.getString('cnpj') || '').replace(/\D/g, ''),
        }
      : null,
    filhas: filhas,
    documentos: Object.keys(docsDoCliente).length,
    itens: out.length,
    uf_sugerida: ufSugerida,
    uf_contagem: ufs,
    lista: out,
  })
})
