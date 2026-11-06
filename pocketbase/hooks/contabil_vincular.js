/**
 * VÍNCULO DOS DOCUMENTOS CONTÁBEIS À PASTA DO CLIENTE — `contab-vincular-pasta`
 * ============================================================================
 * Os 7 balancetes do cliente entraram com todos os totais corretos, mas com o
 * campo `pasta` vazio: a migration 0139 acrescentou a coluna, e o INSERT feito
 * na mesma rodada não a preencheu. O resultado é o pior tipo de meia-entrega —
 * o dado existe, mas não aparece onde o usuário procura.
 *
 * Esta rota refaz o vínculo pelo CAMINHO LEGÍVEL da pasta (CNPJ → Base →
 * Documentos Contábeis → pasta do tipo), sem depender de id fixo: id muda entre
 * ambientes, nome não. Ela é idempotente — rodar duas vezes não duplica nada,
 * só reescreve o mesmo `pasta`.
 */
routerAdd('POST', '/backend/v1/contab-vincular-pasta', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var cnpj = String(body.cnpj || '').replace(/\D/g, '')
  if (!cnpj) return e.json(400, { success: false, error: 'Informe o cnpj.' })

  var app = $app
  var vinculados = 0
  var semPasta = 0
  var detalhe = []

  /* 1. acha a pasta-mãe do cliente pelo CNPJ */
  var base = null
  try {
    base = app.findFirstRecordByFilter('param_pastas', 'cnpj = {:c} && tipo = "base"', { c: cnpj })
  } catch (err) {
    base = null
  }
  if (!base) {
    return e.json(404, {
      success: false,
      error: 'Não achei a pasta base deste CNPJ em param_pastas.',
    })
  }

  /* 2. acha a subpasta por tipo (balancete / balanco / dre / demais),
     descendo um nível a partir dos filhos da base */
  function acharSubpasta(paiId, tipo) {
    var filhos = app.findRecordsByFilter('param_pastas', 'pai = {:p}', '', 100, 0, { p: paiId })
    for (var i = 0; i < filhos.length; i++) {
      if (filhos[i].getString('tipo') === tipo) return filhos[i]
      /* desce mais um nível (Documentos Contábeis > Balancetes) */
      var netos = app.findRecordsByFilter('param_pastas', 'pai = {:p}', '', 100, 0, {
        p: filhos[i].id,
      })
      for (var j = 0; j < netos.length; j++) {
        if (netos[j].getString('tipo') === tipo) return netos[j]
      }
    }
    return null
  }

  function caminho(p) {
    var nomes = []
    var atual = p
    var guarda = 0
    while (atual && guarda < 6) {
      nomes.unshift(atual.getString('nome'))
      var paiId = atual.getString('pai')
      if (!paiId) break
      try {
        atual = app.findRecordById('param_pastas', paiId)
      } catch (err) {
        atual = null
      }
      guarda++
    }
    return nomes.join(' > ')
  }

  /* 3. percorre os documentos contábeis do CNPJ e liga cada um à pasta do seu tipo */
  var docs = []
  try {
    docs = app.findRecordsByFilter(
      'cont_documentos',
      'cliente_cnpj = {:c}',
      'competencia',
      2000,
      0,
      { c: cnpj },
    )
  } catch (err) {
    return e.json(500, { success: false, error: String(err).slice(0, 200) })
  }

  for (var d = 0; d < docs.length; d++) {
    var doc = docs[d]
    var tipo = doc.getString('tipo_documento') || 'balancete'
    /* 'balancete' já é o nome do tipo de pasta — não precisa mapear */
    var alvo = acharSubpasta(base.id, tipo)
    if (!alvo) {
      semPasta++
      detalhe.push({
        competencia: doc.getString('competencia'),
        motivo: 'sem pasta de tipo ' + tipo,
      })
      continue
    }
    doc.set('pasta', alvo.id)
    doc.set('pasta_nome', caminho(alvo))
    app.save(doc)
    vinculados++
    detalhe.push({ competencia: doc.getString('competencia'), pasta: caminho(alvo) })
  }

  return e.json(200, {
    success: true,
    base: base.getString('nome'),
    documentos: docs.length,
    vinculados: vinculados,
    sem_pasta: semPasta,
    detalhe: detalhe.slice(0, 20),
  })
})
