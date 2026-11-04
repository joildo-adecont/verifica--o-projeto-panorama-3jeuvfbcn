/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA — executa a Fase 7 no DIO SANTO e apaga a duplicata. REMOVER DEPOIS. */
routerAdd('POST', '/backend/v1/param-exec-fase7', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = {}
  var CNPJ = '08174238000145'
  var col = $app.findCollectionByNameOrId('param_pastas')

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /* ── 1. acha a base do DIO SANTO ── */
  var base = null
  try {
    var todas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
    for (var i = 0; i < todas.length; i++) {
      if (
        !todas[i].getString('pai') &&
        norm(todas[i].getString('nome')).indexOf('dio santo') >= 0
      ) {
        base = todas[i]
        break
      }
    }
  } catch (_) {}

  if (!base) return e.json(200, { success: false, erro: 'base do DIO SANTO não encontrada' })

  /* garante tipo base */
  try {
    if (base.getString('tipo') !== 'base' || base.getString('pai')) {
      base.set('tipo', 'base')
      base.set('pai', '')
      $app.save(base)
    }
  } catch (_) {}
  out.base = { id: base.id, nome: base.getString('nome'), cnpj: base.getString('cnpj') }

  /* ── 2. cria as duas filhas ── */
  var filhas = {}
  var existentes = []
  try {
    existentes = $app.findRecordsByFilter('param_pastas', 'pai = "' + base.id + '"', '', 50, 0)
  } catch (_) {}

  var nomes = { entrada: 'Compras', saida: 'Vendas' }
  for (var t in nomes) {
    var achou = null
    for (var j = 0; j < existentes.length; j++) {
      if (existentes[j].getString('tipo') === t) {
        achou = existentes[j]
        break
      }
    }
    if (!achou) {
      var rf = new Record(col)
      rf.set('nome', base.getString('nome') + ' — ' + nomes[t])
      rf.set('cnpj', base.getString('cnpj'))
      rf.set('cliente_id', '')
      rf.set('cor', t === 'entrada' ? 'blue' : 'emerald')
      rf.set('observacao', '')
      rf.set('ativo', true)
      rf.set('nome_busca', norm(base.getString('nome') + ' ' + nomes[t]))
      rf.set('tipo', t)
      rf.set('pai', base.id)
      rf.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      $app.save(rf)
      filhas[t] = { id: rf.id, nome: rf.getString('nome'), criada: true }
    } else {
      filhas[t] = { id: achou.id, nome: achou.getString('nome'), criada: false }
    }
  }
  out.filhas = filhas

  /* ── 3. arquiva os documentos do cliente na folha certa ── */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {}
  var movidos = []
  for (var k = 0; k < docs.length; k++) {
    var d = docs[k]
    var cE = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cD = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    if (cE !== CNPJ && cD !== CNPJ) continue
    var dir = d.getString('direcao')
    if (dir !== 'entrada' && dir !== 'saida') continue
    var destino = filhas[dir].id
    if (d.getString('pasta') === destino) continue
    d.set('pasta', destino)
    d.set('pasta_nome', filhas[dir].nome)
    $app.save(d)
    var its = $app.findRecordsByFilter('param_itens', 'documento = "' + d.id + '"', '', 2000, 0)
    for (var m = 0; m < its.length; m++) {
      its[m].set('pasta', destino)
      $app.save(its[m])
    }
    movidos.push({ arquivo: d.getString('nome_arquivo'), direcao: dir, para: filhas[dir].nome })
  }
  out.arquivados = movidos

  /* ── 4. DEDUP: apaga o registro MAIS ANTIGO de cada chave (pedido do CEO) ── */
  var todos = []
  try {
    todos = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {}

  var porChave = {}
  var ordem = []
  for (var n = 0; n < todos.length; n++) {
    var ch = todos[n].getString('chave')
    if (!ch) continue
    if (!porChave[ch]) {
      porChave[ch] = []
      ordem.push(ch)
    }
    porChave[ch].push(todos[n])
  }

  var apagados = []
  var itensApagados = 0
  for (var p = 0; p < ordem.length; p++) {
    var lista = porChave[ordem[p]]
    if (lista.length < 2) continue
    /* lista vem de '-importado_em': [0] = mais recente (MANTÉM), resto = mais
       antigos (APAGA). O CEO pediu: "apague o registro mais antigo". */
    for (var q = 1; q < lista.length; q++) {
      var alvo = lista[q]
      var itsA = []
      try {
        itsA = $app.findRecordsByFilter('param_itens', 'documento = "' + alvo.id + '"', '', 2000, 0)
      } catch (_) {}
      for (var r = 0; r < itsA.length; r++) {
        $app.delete(itsA[r])
        itensApagados++
      }
      apagados.push({
        chave: ordem[p].slice(0, 22) + '…',
        arquivo: alvo.getString('nome_arquivo'),
        importado_em: String(alvo.get('importado_em') || ''),
        valor: Number(alvo.get('valor_total')) || 0,
        mantido_id: lista[0].id,
      })
      $app.delete(alvo)
    }
  }
  out.dedup = { apagados: apagados.length, itens: itensApagados, detalhe: apagados }

  /* ── 5. estado final da árvore ── */
  var final = []
  try {
    var fs = $app.findRecordsByFilter('param_pastas', 'pai = "' + base.id + '"', '', 50, 0)
    for (var s = 0; s < fs.length; s++) {
      var ds = $app.findRecordsByFilter(
        'param_documentos',
        'pasta = "' + fs[s].id + '"',
        '',
        5000,
        0,
      )
      var tot = 0
      for (var u = 0; u < ds.length; u++) tot += Number(ds[u].get('valor_total')) || 0
      final.push({
        tipo: fs[s].getString('tipo'),
        nome: fs[s].getString('nome'),
        documentos: ds.length,
        valor: Math.round(tot * 100) / 100,
      })
    }
  } catch (_) {}
  out.arvore_final = final

  var naBase = []
  try {
    naBase = $app.findRecordsByFilter('param_documentos', 'pasta = "' + base.id + '"', '', 1000, 0)
  } catch (_) {}
  out.documentos_na_base = naBase.length

  return e.json(200, { success: true, resultado: out })
})
