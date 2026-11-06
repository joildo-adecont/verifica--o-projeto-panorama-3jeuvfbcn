/**
 * PASTAS DE DADOS POR CLIENTE — `param-pastas-dados`
 * ==================================================
 * Pedido do CEO (06/11/2026): "Criar pastas de Dados por Cliente que será
 * analisado contendo pastas individuais de XMLs Entradas, XMLs Saídas,
 * Documentos Contábeis: Balanço, Balancetes DREs e Demais documentos financeiros
 * e relatórios para análises, que serão utilizadas para guardar os documentos do
 * cliente e servirão de repositório para a busca por parte dos especialistas".
 *
 * ── A DECISÃO: ESTENDER A ÁRVORE QUE JÁ EXISTE, NÃO CRIAR OUTRA ──
 * A tela "Pastas por cliente" (Fase 6) já mantém uma árvore em `param_pastas`,
 * com `pai` e `tipo`, e os XMLs ficam ligados a ela por `param_documentos.pasta`.
 * Criar uma segunda coleção de pastas daria dois lugares para o mesmo documento
 * — e a pessoa escolheria o errado metade das vezes. Aqui só se ACRESCENTAM
 * tipos de pasta à mesma árvore.
 *
 *   Base do cliente
 *   ├── XMLs Entradas        (xml_entrada)
 *   ├── XMLs Saídas          (xml_saida)
 *   ├── Documentos Contábeis (contabil)
 *   │   ├── Balanços         (contabil_balanco)
 *   │   ├── Balancetes       (contabil_balancete)
 *   │   ├── DREs             (contabil_dre)
 *   │   └── Demais documentos(contabil_demais)
 *   └── Relatórios           (relatorios)
 *
 * ── OS TIPOS ANTIGOS CONTINUAM VÁLIDOS ──
 * `entrada` e `saida` (Fase 7) apontam para as mesmas pastas físicas de
 * Compras e Vendas. Renomear o tipo quebraria todo o arquivamento já feito, e a
 * Fase 7 move documento por `tipo`. As pastas novas de XML usam tipo próprio,
 * mas a rota aceita os dois nomes para não deixar documento órfão.
 */

/** Cria (ou reaproveita) a árvore completa de um cliente. */
routerAdd('POST', '/backend/v1/param-pastas-dados', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var cnpj = String(body.cnpj || '').replace(/\D/g, '')
  var nome = String(body.nome || '').trim()

  if (!cnpj && !nome) {
    return e.json(400, { success: false, error: 'Informe o CNPJ ou o nome do cliente.' })
  }

  var app = $app

  /* ── se o CNPJ veio, o nome e o código vêm do cadastro ──
     Assim a pasta nasce com o nome EXATO da razão social, e não com o que
     alguém digitou com pressa. */
  var clienteCodigo = ''
  if (cnpj) {
    try {
      var emp = app.findFirstRecordByFilter('cadastro_empresas', 'documento_limpo = {:d}', {
        d: cnpj,
      })
      if (!emp) {
        emp = app.findFirstRecordByFilter('cadastro_empresas_inativos', 'documento_limpo = {:d}', {
          d: cnpj,
        })
      }
      if (emp) {
        if (!nome) nome = emp.getString('razao_social')
        clienteCodigo = String(emp.getInt('codigo'))
      }
    } catch (err) {
      /* o cliente pode não estar no cadastro — segue com o que veio */
    }
  }

  if (!nome) {
    return e.json(400, {
      success: false,
      error: 'Cliente não encontrado no cadastro e sem nome informado.',
    })
  }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  var criadas = []
  var reaproveitadas = 0

  try {
    var col = app.findCollectionByNameOrId('param_pastas')

    /* ── acha a base por CNPJ (preferência) ou por nome ── */
    var base = null
    try {
      if (cnpj)
        base = app.findFirstRecordByFilter(
          'param_pastas',
          'cnpj = {:c} && (pai = "" || pai = null)',
          { c: cnpj },
        )
    } catch (err) {}
    if (!base) {
      try {
        base = app.findFirstRecordByFilter(
          'param_pastas',
          'nome_busca = {:n} && (pai = "" || pai = null)',
          { n: norm(nome) },
        )
      } catch (err) {}
    }

    if (!base) {
      base = new Record(col)
      base.set('nome', nome)
      base.set('nome_busca', norm(nome))
      base.set('cnpj', cnpj)
      base.set('cliente_id', clienteCodigo)
      base.set('tipo', 'base')
      base.set('pai', '')
      base.set('cor', 'slate')
      base.set('ativo', true)
      base.set('observacao', 'Pasta de dados do cliente para análise tributária')
      base.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      app.save(base)
      criadas.push(nome)
    } else {
      reaproveitadas++
      /* completa o que faltava, sem sobrescrever o que já havia */
      var mudou = false
      if (cnpj && !base.getString('cnpj')) {
        base.set('cnpj', cnpj)
        mudou = true
      }
      if (clienteCodigo && !base.getString('cliente_id')) {
        base.set('cliente_id', clienteCodigo)
        mudou = true
      }
      if (mudou) app.save(base)
    }

    /* ── as pastas filhas, na ordem em que o trabalho acontece ── */
    var estrutura = [
      {
        nome: 'XMLs Entradas',
        tipo: 'xml_entrada',
        cor: 'blue',
        obs: 'Notas de entrada do cliente (compras)',
      },
      {
        nome: 'XMLs Saídas',
        tipo: 'xml_saida',
        cor: 'emerald',
        obs: 'Notas de saída do cliente (vendas)',
      },
      {
        nome: 'Documentos Contábeis',
        tipo: 'contabil',
        cor: 'amber',
        obs: 'Balanços, balancetes e DREs',
      },
      {
        nome: 'Balanços',
        tipo: 'balanco',
        cor: 'amber',
        obs: 'Balanços patrimoniais',
        pai_nome: 'Documentos Contábeis',
      },
      {
        nome: 'Balancetes',
        tipo: 'balancete',
        cor: 'amber',
        obs: 'Balancetes mensais',
        pai_nome: 'Documentos Contábeis',
      },
      {
        nome: 'DREs',
        tipo: 'dre',
        cor: 'amber',
        obs: 'Demonstrativos de resultado',
        pai_nome: 'Documentos Contábeis',
      },
      {
        nome: 'Demais Documentos',
        tipo: 'demais',
        cor: 'slate',
        obs: 'Outros documentos financeiros',
        pai_nome: 'Documentos Contábeis',
      },
      {
        nome: 'Relatórios',
        tipo: 'relatorios',
        cor: 'violet',
        obs: 'Relatórios e análises geradas',
      },
    ]

    var mapa = { '': base.id }

    for (var i = 0; i < estrutura.length; i++) {
      var it = estrutura[i]
      var chavePai = it.pai_nome || ''
      var paiId = mapa[chavePai] || base.id

      var existente = null
      try {
        existente = app.findFirstRecordByFilter('param_pastas', 'pai = {:p} && tipo = {:t}', {
          p: paiId,
          t: it.tipo,
        })
      } catch (err) {
        existente = null
      }

      if (existente) {
        reaproveitadas++
        mapa[it.nome] = existente.id
        continue
      }

      var filha = new Record(col)
      filha.set('nome', it.nome)
      filha.set('nome_busca', norm(it.nome))
      filha.set('cnpj', cnpj)
      filha.set('cliente_id', clienteCodigo)
      filha.set('tipo', it.tipo)
      filha.set('pai', paiId)
      filha.set('cor', it.cor)
      filha.set('ativo', true)
      filha.set('observacao', it.obs)
      filha.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      app.save(filha)
      mapa[it.nome] = filha.id
      criadas.push(it.nome)
    }

    return e.json(200, {
      success: true,
      cliente: nome,
      cnpj: cnpj,
      codigo: clienteCodigo,
      base_id: base.id,
      criadas: criadas,
      reaproveitadas: reaproveitadas,
      pastas: mapa,
    })
  } catch (err) {
    return e.json(500, { success: false, error: String(err).slice(0, 300) })
  }
})

/**
 * GET /backend/v1/param-pastas-dados — a árvore completa com contagem por pasta.
 * Devolve também os TOTAIS do que está guardado, para a tela abrir mostrando
 * volume em vez de uma árvore vazia sem contexto.
 */
routerAdd('GET', '/backend/v1/param-pastas-dados', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var app = $app

  var pastas = []
  try {
    pastas = app.findRecordsByFilter('param_pastas', 'ativo = true', 'nome', 2000, 0)
  } catch (err) {
    return e.json(200, { success: true, clientes: [], total_pastas: 0 })
  }

  /* ── documentos por pasta ──
     Conta XML (param_documentos.pasta) e documento contábil
     (cont_documentos.pasta) na MESMA passagem: a tela precisa do total por
     pasta, e uma consulta por pasta seria N+1. */
  var porPastaXml = {}
  try {
    var xmls = app.findRecordsByFilter('param_documentos', '', '', 20000, 0)
    for (var i = 0; i < xmls.length; i++) {
      var p = xmls[i].getString('pasta')
      if (!p) continue
      porPastaXml[p] = (porPastaXml[p] || 0) + 1
    }
  } catch (err) {}

  var porPastaCont = {}
  try {
    var conts = app.findRecordsByFilter('cont_documentos', '', '', 20000, 0)
    for (var j = 0; j < conts.length; j++) {
      var pp = conts[j].getString('pasta')
      if (!pp) continue
      porPastaCont[pp] = (porPastaCont[pp] || 0) + 1
    }
  } catch (err) {}

  var porId = {}
  var bases = []

  for (var k = 0; k < pastas.length; k++) {
    var r = pastas[k]
    var reg = {
      id: r.id,
      nome: r.getString('nome'),
      cnpj: r.getString('cnpj'),
      cliente_id: r.getString('cliente_id'),
      tipo: r.getString('tipo'),
      pai: r.getString('pai'),
      cor: r.getString('cor'),
      observacao: r.getString('observacao'),
      xmls: porPastaXml[r.id] || 0,
      contabeis: porPastaCont[r.id] || 0,
      filhas: [],
    }
    reg.documentos = reg.xmls + reg.contabeis
    porId[r.id] = reg
    if (!reg.pai || reg.tipo === 'base') bases.push(reg)
  }

  /* monta a árvore */
  for (var kk = 0; kk < pastas.length; kk++) {
    var rr = porId[pastas[kk].id]
    if (rr && rr.pai && porId[rr.pai] && rr.tipo !== 'base') {
      porId[rr.pai].filhas.push(rr)
    }
  }

  /* soma recursiva — o total do cliente tem de incluir as filhas */
  function somar(no) {
    var t = no.documentos
    for (var f = 0; f < no.filhas.length; f++) t += somar(no.filhas[f])
    no.total = t
    return t
  }
  for (var b = 0; b < bases.length; b++) somar(bases[b])

  return e.json(200, {
    success: true,
    total_pastas: pastas.length,
    clientes: bases,
  })
})

/**
 * GET /backend/v1/param-pastas-dados-conteudo?pasta=ID
 * O que está guardado numa pasta — XMLs e documentos contábeis juntos.
 */
routerAdd('GET', '/backend/v1/param-pastas-dados-conteudo', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var pasta = String(e.request.url.query().get('pasta') || '')
  if (!pasta) return e.json(400, { success: false, error: 'Informe a pasta.' })

  var app = $app
  var xmls = []
  var contabeis = []

  try {
    var lista = app.findRecordsByFilter('param_documentos', 'pasta = {:p}', '-created', 500, 0, {
      p: pasta,
    })
    for (var i = 0; i < lista.length; i++) {
      var r = lista[i]
      xmls.push({
        id: r.id,
        chave: r.getString('chave'),
        numero: r.getString('numero'),
        emitente: r.getString('emitente_nome'),
        destinatario: r.getString('destinatario_nome'),
        data: r.getString('data_emissao'),
        valor: r.getFloat('valor_total'),
        direcao: r.getString('direcao'),
        itens: r.getInt('itens'),
      })
    }
  } catch (err) {}

  try {
    var lc = app.findRecordsByFilter('cont_documentos', 'pasta = {:p}', '-competencia', 500, 0, {
      p: pasta,
    })
    for (var j = 0; j < lc.length; j++) {
      var d = lc[j]
      contabeis.push({
        id: d.id,
        nome: d.getString('arquivo_nome'),
        tipo: d.getString('tipo_documento'),
        competencia: d.getString('competencia'),
        periodo_inicio: d.getString('periodo_inicio'),
        periodo_fim: d.getString('periodo_fim'),
        ativo: d.getFloat('total_ativo'),
        passivo: d.getFloat('total_passivo'),
        pl: d.getFloat('patrimonio_liquido'),
        receita: d.getFloat('receita_liquida'),
        lucro: d.getFloat('lucro_liquido'),
        linhas: d.getInt('linhas'),
        status: d.getString('status'),
      })
    }
  } catch (err) {}

  return e.json(200, {
    success: true,
    xmls: xmls,
    contabeis: contabeis,
    total: xmls.length + contabeis.length,
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * GARANTIR PASTAS CONTÁBEIS EM TODOS OS CLIENTES (06/11/2026)
 *
 * Pedido do CEO: "Incluir os balancetes e balanços criando uma pasta dentro
 * do cliente."
 *
 * ── O PROBLEMA QUE ISTO RESOLVE ──
 * A árvore de pastas (XMLs Entradas, XMLs Saídas, Documentos Contábeis >
 * Balanços/Balancetes/DREs/Demais, Relatórios) é criada quando o cliente é
 * cadastrado. Cliente que já existia antes da pasta contábil nascer NÃO ganha
 * as pastas novas — ele fica com a árvore velha e o contador não tem onde
 * soltar o balanço. Isso é backfill, e sem ele a estrutura só vale para
 * cliente novo.
 *
 * ── O QUE A ROTA FAZ ──
 * Percorre as pastas-base, e para cada cliente garante que existam as 4
 * contábeis. IDEMPOTENTE: se já existir, reaproveita; se faltar, cria. Pode
 * rodar quantas vezes quiser. Responde quantas criou e em quais clientes.
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/param-pastas-garantir-contabil', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var col = app.findCollectionByNameOrId('param_pastas')

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  /* as filhas de Documentos Contábeis — exatamente as que o CEO pediu */
  var FILHAS = [
    { nome: 'Balanços', tipo: 'balanco', cor: 'amber', obs: 'Balanços patrimoniais' },
    { nome: 'Balancetes', tipo: 'balancete', cor: 'amber', obs: 'Balancetes mensais' },
    { nome: 'DREs', tipo: 'dre', cor: 'amber', obs: 'Demonstrativos de resultado' },
    {
      nome: 'Demais Documentos',
      tipo: 'demais',
      cor: 'slate',
      obs: 'Outros documentos financeiros',
    },
  ]

  var bases = []
  try {
    bases = app.findRecordsByFilter('param_pastas', 'tipo = "base"', '', 500, 0)
  } catch (err) {
    bases = []
  }

  var criadas = 0
  var clientesTocados = []
  var jaTinham = 0

  for (var b = 0; b < bases.length; b++) {
    var base = bases[b]
    var cnpj = base.getString('cnpj')
    var clienteId = base.getString('cliente_id')

    /* acha (ou cria) a pasta-mãe "Documentos Contábeis" deste cliente */
    var mae = null
    try {
      mae = app.findFirstRecordByFilter('param_pastas', 'pai = {:p} && tipo = "contabil"', {
        p: base.id,
      })
    } catch (err) {
      mae = null
    }
    if (!mae) {
      mae = new Record(col)
      mae.set('nome', 'Documentos Contábeis')
      mae.set('nome_busca', norm('Documentos Contabeis'))
      mae.set('cnpj', cnpj)
      mae.set('cliente_id', clienteId)
      mae.set('tipo', 'contabil')
      mae.set('pai', base.id)
      mae.set('cor', 'amber')
      mae.set('ativo', true)
      mae.set('observacao', 'Balanços, balancetes e DREs')
      mae.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      app.save(mae)
      criadas++
      if (clientesTocados.indexOf(base.getString('nome')) === -1) {
        clientesTocados.push(base.getString('nome'))
      }
    }

    for (var i = 0; i < FILHAS.length; i++) {
      var f = FILHAS[i]
      var existe = null
      try {
        existe = app.findFirstRecordByFilter('param_pastas', 'pai = {:p} && tipo = {:t}', {
          p: mae.id,
          t: f.tipo,
        })
      } catch (err) {
        existe = null
      }
      if (existe) {
        jaTinham++
        continue
      }
      var nova = new Record(col)
      nova.set('nome', f.nome)
      nova.set('nome_busca', norm(f.nome))
      nova.set('cnpj', cnpj)
      nova.set('cliente_id', clienteId)
      nova.set('tipo', f.tipo)
      nova.set('pai', mae.id)
      nova.set('cor', f.cor)
      nova.set('ativo', true)
      nova.set('observacao', f.obs)
      nova.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
      app.save(nova)
      criadas++
      if (clientesTocados.indexOf(base.getString('nome')) === -1) {
        clientesTocados.push(base.getString('nome'))
      }
    }
  }

  return e.json(200, {
    success: true,
    clientes: bases.length,
    pastas_criadas: criadas,
    pastas_ja_existentes: jaTinham,
    clientes_com_pasta_nova: clientesTocados,
    mensagem:
      criadas === 0
        ? 'Todos os clientes já tinham as pastas contábeis.'
        : criadas + ' pasta(s) criada(s) em ' + clientesTocados.length + ' cliente(s).',
  })
})
