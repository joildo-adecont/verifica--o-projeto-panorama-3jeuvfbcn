/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA — valida o Analisador com o cliente real. REMOVER DEPOIS. */
routerAdd('POST', '/backend/v1/param-teste-analisador', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = {}

  /* 1. acha o DIO SANTO */
  var base = null
  try {
    var ps = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
    for (var i = 0; i < ps.length; i++) {
      if (
        !ps[i].getString('pai') &&
        String(ps[i].getString('cnpj')).replace(/\D/g, '') === '08174238000145'
      ) {
        base = ps[i]
        break
      }
    }
  } catch (_) {}
  if (!base) return e.json(200, { success: false, erro: 'cliente nao encontrado' })
  out.cliente = { id: base.id, nome: base.getString('nome'), cnpj: base.getString('cnpj') }

  /* 2. simula a rota param-itens-cliente */
  var ids = {}
  ids[base.id] = true
  try {
    var fs = $app.findRecordsByFilter('param_pastas', 'pai = "' + base.id + '"', '', 50, 0)
    for (var j = 0; j < fs.length; j++) ids[fs[j].id] = true
  } catch (_) {}

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 20000, 0)
  } catch (_) {}

  var doCliente = {}
  for (var k = 0; k < docs.length; k++) {
    var d = docs[k]
    var pid = d.getString('pasta')
    var cE = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cD = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    if (ids[pid] || cE === '08174238000145' || cD === '08174238000145') {
      doCliente[d.id] = {
        direcao: d.getString('direcao'),
        uf: d.getString('uf'),
        emitente: d.getString('emitente_nome'),
        pasta: d.getString('pasta_nome'),
      }
    }
  }
  out.documentos_do_cliente = Object.keys(doCliente).length

  /* 3. os itens */
  var itens = []
  try {
    itens = $app.findRecordsByFilter('param_itens', '', '', 20000, 0)
  } catch (_) {}
  var meus = []
  var deOutros = 0
  for (var m = 0; m < itens.length; m++) {
    var ref = doCliente[itens[m].getString('documento')]
    if (!ref) {
      deOutros++
      continue
    }
    meus.push({
      ncm: itens[m].getString('ncm'),
      descricao: itens[m].getString('descricao'),
      valor: Number(itens[m].get('valor_total')) || 0,
      direcao: itens[m].getString('direcao') || ref.direcao,
    })
  }
  out.itens_do_cliente = meus.length
  out.itens_de_outros_clientes = deOutros

  /* 4. UF sugerida (emitente das notas, não do destinatário) */
  var ufs = {}
  for (var dd in doCliente) {
    var u = doCliente[dd].uf
    if (u) ufs[u] = (ufs[u] || 0) + 1
  }
  out.ufs_emitente = ufs

  /* 5. amostra do que o analisador vai mostrar */
  out.amostra = meus.slice(0, 12)

  /* 6. total */
  var soma = 0
  for (var n = 0; n < meus.length; n++) soma += meus[n].valor
  out.valor_total = Math.round(soma * 100) / 100

  return e.json(200, { success: true, resultado: out })
})
