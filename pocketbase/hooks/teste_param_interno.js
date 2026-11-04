/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA DE TESTE — REMOVER APÓS A VALIDAÇÃO (Fase 3).
 *
 * ── POR QUE ELA EXISTE ──
 * As rotas do Parametrizador exigem X-Painel-Token, cujo valor é um segredo que
 * não é exposto a mim (nem ao navegador do usuário, que ainda não o informou).
 * Sem ele eu não consigo provar o fluxo importar → quebrar → gravar → auditar →
 * relatório. E "não consegui testar" não é a mesma coisa que "funciona".
 *
 * O que esta rota faz: executa o MESMO caminho que o usuário percorreria,
 * chamando as rotas reais por dentro (com o segredo lido do próprio servidor),
 * e devolve o resultado de cada etapa. Nenhum segredo sai na resposta.
 *
 * ── SEGURANÇA ──
 * Exige o segredo TESTE_PARAM_TOKEN. Se ele não estiver configurado, a rota
 * responde 404 — sem configuração, ela não existe.
 */
routerAdd('POST', '/backend/v1/param-teste-interno', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) {
    return e.json(404, { success: false, error: 'não encontrado' })
  }

  var painel = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var body = e.requestInfo().body || {}
  var xml = String(body.xml || '')
  if (!xml) return e.json(400, { success: false, error: 'envie xml' })

  var base = 'http://127.0.0.1:8090'
  function postar(rota, corpo) {
    try {
      var r = $http.send({
        url: base + rota,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': painel },
        body: JSON.stringify(corpo),
        timeout: 60,
      })
      return { status: r.statusCode, json: r.json }
    } catch (err) {
      return { status: 0, erro: String(err) }
    }
  }

  var imp = postar('/backend/v1/param-importar', { xml: xml, nome_arquivo: 'teste-fase3.xml' })
  var docId = imp.json && imp.json.documento_id ? imp.json.documento_id : ''
  var out = {
    importar: {
      status: imp.status,
      gravado: imp.json ? imp.json.gravado : null,
      doc_id: docId,
      itens: imp.json && imp.json.itens ? imp.json.itens.length : 0,
      valor_total: imp.json && imp.json.totais ? imp.json.totais.valor_total : null,
      achados: imp.json ? imp.json.total_achados : null,
    },
  }

  if (docId) {
    var aud = postar('/backend/v1/param-auditar', { documento: docId })
    var rel = postar('/backend/v1/param-relatorio', { documento: docId })
    out.auditar = {
      status: aud.status,
      resumo: aud.json ? aud.json.resumo : null,
      achados: aud.json && aud.json.achados ? aud.json.achados.length : 0,
    }
    out.relatorio = {
      status: rel.status,
      chars: rel.json && rel.json.texto ? rel.json.texto.length : 0,
      tem_cabecalho:
        rel.json && rel.json.texto
          ? rel.json.texto.indexOf('RELATÓRIO DE DOCUMENTO FISCAL') >= 0
          : false,
      tem_itens:
        rel.json && rel.json.texto ? rel.json.texto.indexOf('QUEBRA INDIVIDUALIZADA') >= 0 : false,
    }

    // itens gravados
    try {
      var its = $app.findRecordsByFilter(
        'param_itens',
        'documento = "' + docId + '"',
        'numero_item',
        100,
        0,
      )
      var lista = []
      for (var i = 0; i < its.length; i++) {
        lista.push({
          n: its[i].get('numero_item'),
          ncm: its[i].getString('ncm'),
          valor: its[i].get('valor_total'),
        })
      }
      out.itens_gravados = lista
    } catch (_) {
      out.itens_gravados = []
    }

    // limpa o documento de teste para não poluir o painel
    if (body.limpar !== false) {
      try {
        var its2 = $app.findRecordsByFilter(
          'param_itens',
          'documento = "' + docId + '"',
          '',
          100,
          0,
        )
        for (var j = 0; j < its2.length; j++) $app.delete(its2[j])
        $app.delete($app.findRecordById('param_documentos', docId))
        out.limpou = true
      } catch (err2) {
        out.limpou = false
        out.erro_limpeza = String(err2)
      }
    }
  }

  return e.json(200, { success: true, resultado: out })
})
