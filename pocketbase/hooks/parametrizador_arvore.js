/// <reference path="../pb_data/types.d.ts" />

/**
 * PASTAS HIERÁRQUICAS — base do cliente com Entradas (Compras) e Saídas (Vendas)
 * ==============================================================================
 * Pedido do CEO (03/11/2026): "Para cada cliente devemos criar uma pasta Base,
 * contendo duas pastas uma de entradas (Compras) e outra de Saídas (Vendas)."
 *
 * ── A REGRA QUE ORGANIZA TUDO ──
 * O documento mora na FOLHA, e a folha é decidida pela DIREÇÃO do documento —
 * que vem do CFOP (já gravada desde a Fase 4). Então:
 *
 *   documento com direcao 'entrada' → pasta filha tipo 'entrada' (Compras)
 *   documento com direcao 'saida'   → pasta filha tipo 'saida'   (Vendas)
 *
 * Isso torna o arquivamento automático e verificável: não é o operador que
 * escolhe onde põe; é o documento que diz a que pasta pertence. Se a direção
 * não pôde ser determinada (CFOP ausente), o documento fica na BASE e o sistema
 * aponta — é o único caso que pede decisão humana.
 *
 * ── ROTAS ──
 *   GET    /param-pastas-arvore      → a árvore completa (base + filhas + totais)
 *   POST   /param-pastas-estruturar  → cria Base/Entradas/Saídas para um cliente
 *   POST   /param-arquivar           → coloca documentos na folha certa pela direção
 *   POST   /param-dedup              → resolve duplicata por chave de acesso
 */

/** GET /param-pastas-arvore — a árvore de pastas com totalizadores. */
routerAdd('GET', '/backend/v1/param-pastas-arvore', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
  } catch (_) {
    pastas = []
  }

  /* Contagem em UMA passada: com 300 clientes, uma consulta por pasta seriam
     900 consultas a cada abertura de tela. */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 20000, 0)
  } catch (_) {
    docs = []
  }
  var porPasta = {}
  var soltos = 0
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var pid = d.getString('pasta')
    if (!pid) {
      soltos++
      continue
    }
    if (!porPasta[pid]) porPasta[pid] = { documentos: 0, entrada: 0, saida: 0 }
    porPasta[pid].documentos++
    var v = Number(d.get('valor_total')) || 0
    var dir = d.getString('direcao')
    if (dir === 'entrada') porPasta[pid].entrada += v
    else if (dir === 'saida') porPasta[pid].saida += v
  }

  function totals(id) {
    var c = porPasta[id] || { documentos: 0, entrada: 0, saida: 0 }
    return {
      documentos: c.documentos,
      entrada: Math.round(c.entrada * 100) / 100,
      saida: Math.round(c.saida * 100) / 100,
    }
  }

  /* separa bases e filhas */
  var bases = []
  var filhasPorPai = {}
  for (var j = 0; j < pastas.length; j++) {
    var p = pastas[j]
    var tipo = p.getString('tipo')
    var pai = p.getString('pai')
    var info = {
      id: p.id,
      nome: p.getString('nome'),
      cnpj: p.getString('cnpj'),
      cor: p.getString('cor'),
      observacao: p.getString('observacao'),
      tipo: tipo || 'base',
      pai: pai,
      ativo: p.get('ativo') !== false,
      totais: totals(p.id),
    }
    if (!pai) {
      bases.push(info)
    } else {
      if (!filhasPorPai[pai]) filhasPorPai[pai] = []
      filhasPorPai[pai].push(info)
    }
  }

  /* monta a árvore, somando na base o que as filhas têm */
  var arvore = []
  for (var k = 0; k < bases.length; k++) {
    var b = bases[k]
    var filhas = filhasPorPai[b.id] || []
    /* ordena: entradas antes de saídas */
    filhas.sort(function (x, y) {
      var px = x.tipo === 'entrada' ? 0 : 1
      var py = y.tipo === 'entrada' ? 0 : 1
      return px - py
    })
    var somaE = b.totais.entrada
    var somaS = b.totais.saida
    var somaD = b.totais.documentos
    for (var m = 0; m < filhas.length; m++) {
      somaE += filhas[m].totais.entrada
      somaS += filhas[m].totais.saida
      somaD += filhas[m].totais.documentos
    }
    arvore.push({
      base: b,
      filhas: filhas,
      /* o total da base inclui o que está nela + o que está nas filhas */
      consolidado: {
        documentos: somaD,
        entrada: Math.round(somaE * 100) / 100,
        saida: Math.round(somaS * 100) / 100,
      },
      /* base sem filhas = cliente ainda não estruturado */
      estruturada: filhas.length >= 2,
    })
  }

  return e.json(200, {
    success: true,
    clientes: arvore.length,
    arvore: arvore,
    documentos_sem_pasta: soltos,
  })
})

/**
 * POST /param-pastas-estruturar
 * body: { pasta: 'id-da-base', cnpj: '...', nome: '...' }  ou  { criar: {...} }
 *
 * Cria as duas filhas de um cliente. Idempotente: rodar duas vezes não duplica
 * — pasta repetida faria a nota cair em uma e a tela mostrar zero na outra.
 */
routerAdd('POST', '/backend/v1/param-pastas-estruturar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var col = $app.findCollectionByNameOrId('param_pastas')

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /* ═══ 1. a BASE: usa a existente ou cria ═══ */
  var baseId = String(body.pasta || '')
  var baseNome = ''
  var baseCnpj = ''
  var baseCor = 'slate'

  if (baseId) {
    try {
      var pb = $app.findRecordById('param_pastas', baseId)
      baseNome = pb.getString('nome')
      baseCnpj = pb.getString('cnpj')
      baseCor = pb.getString('cor') || 'slate'
      /* garante que ela é base, não folha */
      if (!pb.getString('pai') && !pb.getString('tipo')) {
        pb.set('tipo', 'base')
        $app.save(pb)
      }
    } catch (_) {
      return e.json(404, { success: false, error: 'Pasta base não encontrada.' })
    }
  } else if (body.criar) {
    var nome = String(body.criar.nome || '').trim()
    if (!nome) return e.json(400, { success: false, error: 'Informe o nome do cliente.' })
    /* não duplica base de mesmo nome */
    try {
      var todas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
      for (var i = 0; i < todas.length; i++) {
        if (!todas[i].getString('pai') && norm(todas[i].getString('nome')) === norm(nome)) {
          baseId = todas[i].id
          baseNome = todas[i].getString('nome')
          baseCnpj = todas[i].getString('cnpj')
          baseCor = todas[i].getString('cor') || 'slate'
          break
        }
      }
    } catch (_) {}
    if (!baseId) {
      var rb = new Record(col)
      rb.set('nome', nome)
      rb.set('cnpj', String(body.criar.cnpj || '').replace(/\D/g, ''))
      rb.set('cliente_id', String(body.criar.cliente_id || ''))
      rb.set('cor', String(body.criar.cor || 'slate'))
      rb.set('observacao', String(body.criar.observacao || ''))
      rb.set('ativo', true)
      rb.set('nome_busca', norm(nome))
      rb.set('tipo', 'base')
      rb.set('pai', '')
      rb.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      $app.save(rb)
      baseId = rb.id
      baseNome = nome
      baseCnpj = rb.getString('cnpj')
      baseCor = rb.getString('cor')
    }
  } else {
    return e.json(400, { success: false, error: 'Informe a pasta base ou os dados do cliente.' })
  }

  /* ═══ 2. as duas FILHAS: cria se faltar ═══ */
  var existentes = []
  try {
    existentes = $app.findRecordsByFilter('param_pastas', 'pai = "' + baseId + '"', '', 100, 0)
  } catch (_) {
    existentes = []
  }

  function acharFilha(tipo) {
    for (var i = 0; i < existentes.length; i++) {
      if (existentes[i].getString('tipo') === tipo) return existentes[i]
    }
    return null
  }

  var nomes = {
    entrada: 'Entradas (Compras)',
    saida: 'Saídas (Vendas)',
  }
  var criadas = []
  var filhas = {}

  for (var t in nomes) {
    var f = acharFilha(t)
    if (f) {
      filhas[t] = { id: f.id, nome: f.getString('nome'), criada: false }
      continue
    }
    var rf = new Record(col)
    rf.set('nome', baseNome + ' — ' + nomes[t])
    rf.set('cnpj', baseCnpj)
    rf.set('cliente_id', '')
    rf.set('cor', t === 'entrada' ? 'blue' : 'emerald')
    rf.set('observacao', '')
    rf.set('ativo', true)
    rf.set('nome_busca', norm(baseNome + ' ' + nomes[t]))
    rf.set('tipo', t)
    rf.set('pai', baseId)
    rf.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rf)
    filhas[t] = { id: rf.id, nome: rf.getString('nome'), criada: true }
    criadas.push(t)
  }

  return e.json(200, {
    success: true,
    base: { id: baseId, nome: baseNome, cnpj: baseCnpj },
    filhas: filhas,
    criadas: criadas.length,
  })
})

/**
 * POST /param-arquivar
 * body: { pasta_base: 'id' }   ou   { todas: true }
 *
 * Coloca cada documento na FOLHA certa, pela sua direção. É o que faz a
 * hierarquia valer: sem isso, a nota fica na base e os totais de Compras e
 * Vendas ficam zerados — a estrutura existiria só no desenho.
 */
routerAdd('POST', '/backend/v1/param-arquivar', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var baseFiltro = String(body.pasta_base || '')

  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
  } catch (_) {
    pastas = []
  }

  /* mapa: baseId -> { entrada: idFolha, saida: idFolha } */
  var mapa = {}
  for (var i = 0; i < pastas.length; i++) {
    var p = pastas[i]
    var pai = p.getString('pai')
    if (!pai) continue
    if (!mapa[pai]) mapa[pai] = {}
    mapa[pai][p.getString('tipo')] = p.id
  }

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 20000, 0)
  } catch (_) {
    docs = []
  }

  var movidos = 0
  var naBase = 0
  var semEstrutura = 0
  var semDirecao = 0
  var detalhe = []

  for (var j = 0; j < docs.length; j++) {
    var d = docs[j]
    var pastaAtual = d.getString('pasta')
    var dir = d.getString('direcao')

    /* Se o cliente não foi filtrado, processa todos os que têm estrutura. */
    if (baseFiltro && pastaAtual !== baseFiltro) {
      /* também aceita documento que já está numa das filhas dessa base */
      var achouBase = false
      if (pastaAtual && mapa) {
        for (var b in mapa) {
          if (mapa[b].entrada === pastaAtual || mapa[b].saida === pastaAtual) {
            if (b === baseFiltro) achouBase = true
            break
          }
        }
      }
      if (!achouBase) continue
    }

    /* descobre a base do documento: ele está na base ou numa filha dela */
    var baseDoDoc = ''
    if (pastaAtual) {
      for (var bb in mapa) {
        if (bb === pastaAtual || mapa[bb].entrada === pastaAtual || mapa[bb].saida === pastaAtual) {
          baseDoDoc = bb
          break
        }
      }
    }
    if (!baseDoDoc) {
      semEstrutura++
      continue
    }
    if (!dir || (dir !== 'entrada' && dir !== 'saida')) {
      /* sem direção não há folha certa — fica na base, e isso é visível */
      semDirecao++
      if (pastaAtual !== baseDoDoc) {
        d.set('pasta', baseDoDoc)
        var pb2 = null
        for (var q = 0; q < pastas.length; q++) if (pastas[q].id === baseDoDoc) pb2 = pastas[q]
        d.set('pasta_nome', pb2 ? pb2.getString('nome') : '')
        $app.save(d)
      }
      continue
    }

    var destino = mapa[baseDoDoc][dir]
    if (!destino) {
      semEstrutura++
      continue
    }
    if (pastaAtual === destino) continue

    var nomeDest = ''
    for (var r = 0; r < pastas.length; r++)
      if (pastas[r].id === destino) nomeDest = pastas[r].getString('nome')

    d.set('pasta', destino)
    d.set('pasta_nome', nomeDest)
    $app.save(d)

    var its = $app.findRecordsByFilter('param_itens', 'documento = "' + d.id + '"', '', 5000, 0)
    for (var k = 0; k < its.length; k++) {
      its[k].set('pasta', destino)
      $app.save(its[k])
    }

    movidos++
    if (detalhe.length < 50) {
      detalhe.push({
        arquivo: d.getString('nome_arquivo'),
        direcao: dir,
        para: nomeDest,
      })
    }
    naBase++
  }

  return e.json(200, {
    success: true,
    movidos: movidos,
    sem_estrutura: semEstrutura,
    sem_direcao: semDirecao,
    detalhe: detalhe,
  })
})

/**
 * POST /param-dedup
 * body: { aplicar: true }  → remove duplicatas por chave de acesso, mantendo a
 *        mais RECENTE (a mais antiga é a que o CEO pediu para apagar).
 *
 * ── POR QUE MANTER A MAIS RECENTE ──
 * A duplicata nasceu quando o sistema não tinha deduplicação. A cópia mais nova
 * é a que passou pelo parser atual — com direção, pasta e itens completos. A
 * antiga pode ter sido gravada por uma versão anterior, com menos campos.
 *
 * ── O QUE ELE NÃO FAZ ──
 * Não apaga nada quando `aplicar` não vem: por padrão só RELATA. Apagar dado do
 * usuário tem de ser ato deliberado, não efeito colateral de abrir a tela.
 */
routerAdd('POST', '/backend/v1/param-dedup', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var aplicar = body.aplicar === true

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 20000, 0)
  } catch (_) {
    docs = []
  }

  /* agrupa por chave */
  var porChave = {}
  var ordem = []
  for (var i = 0; i < docs.length; i++) {
    var ch = docs[i].getString('chave')
    if (!ch) continue
    if (!porChave[ch]) {
      porChave[ch] = []
      ordem.push(ch)
    }
    porChave[ch].push(docs[i])
  }

  var grupos = []
  var aApagar = []
  for (var j = 0; j < ordem.length; j++) {
    var lista = porChave[ordem[j]]
    if (lista.length < 2) continue
    /* A coleção já vem ordenada por -importado_em: a primeira é a mais recente. */
    var manter = lista[0]
    var remover = []
    for (var k = 1; k < lista.length; k++) {
      remover.push(lista[k])
      aApagar.push(lista[k])
    }
    grupos.push({
      chave: ordem[j],
      quantidade: lista.length,
      manter: {
        id: manter.id,
        arquivo: manter.getString('nome_arquivo'),
        importado_em: String(manter.get('importado_em') || ''),
        valor: Number(manter.get('valor_total')) || 0,
        pasta: manter.getString('pasta_nome'),
      },
      remover: remover.map(function (r) {
        return {
          id: r.id,
          arquivo: r.getString('nome_arquivo'),
          importado_em: String(r.get('importado_em') || ''),
          valor: Number(r.get('valor_total')) || 0,
          pasta: r.getString('pasta_nome'),
        }
      }),
    })
  }

  var apagados = 0
  var itensApagados = 0
  if (aplicar) {
    for (var m = 0; m < aApagar.length; m++) {
      try {
        var its = $app.findRecordsByFilter(
          'param_itens',
          'documento = "' + aApagar[m].id + '"',
          '',
          5000,
          0,
        )
        for (var n = 0; n < its.length; n++) {
          $app.delete(its[n])
          itensApagados++
        }
        $app.delete($app.findRecordById('param_documentos', aApagar[m].id))
        apagados++
      } catch (_) {}
    }
  }

  return e.json(200, {
    success: true,
    aplicado: aplicar,
    grupos: grupos,
    duplicatas_encontradas: aApagar.length,
    documentos_apagados: apagados,
    itens_apagados: itensApagados,
    aviso: aplicar
      ? 'Duplicatas removidas; a cópia mais recente de cada chave foi mantida.'
      : 'Nada foi apagado. Envie { "aplicar": true } para remover as duplicatas.',
  })
})
