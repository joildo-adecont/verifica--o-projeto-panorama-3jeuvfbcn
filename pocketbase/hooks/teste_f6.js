/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA DE VALIDAÇÃO DA FASE 6 — REMOVER APÓS O TESTE.
 *
 * O que ela prova, e por que só assim:
 * a trava de CNPJ vive DENTRO da rota de importação, que exige o token do
 * painel. Esta rota cria duas pastas de CNPJs diferentes, tenta importar um
 * lote na pasta ERRADA e confere se o documento foi recusado e por quê.
 */
routerAdd('POST', '/backend/v1/param-teste-f6', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var painel = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var host = 'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'

  function postar(rota, corpo) {
    try {
      var r = $http.send({
        url: host + rota,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Painel-Token': painel },
        body: JSON.stringify(corpo),
        timeout: 120,
      })
      return { status: r.statusCode, json: r.json }
    } catch (err) {
      return { status: 0, erro: String(err).slice(0, 160) }
    }
  }

  var out = { passos: [] }

  /* ── 1. cria duas pastas de CNPJs diferentes ── */
  var pA = postar('/backend/v1/param-pastas', {
    nome: 'TESTE Pastas Cliente A',
    cnpj: '11111111000111',
    cor: 'blue',
  })
  var pB = postar('/backend/v1/param-pastas', {
    nome: 'TESTE Pastas Cliente B',
    cnpj: '22222222000122',
    cor: 'emerald',
  })
  out.criar_a = { status: pA.status, id: pA.json ? pA.json.pasta?.id : null }
  out.criar_b = { status: pB.status, id: pB.json ? pB.json.pasta?.id : null }

  var idA = pA.json && pA.json.pasta ? pA.json.pasta.id : ''
  var idB = pB.json && pB.json.pasta ? pB.json.pasta.id : ''
  if (!idA || !idB) {
    out.erro = 'nao criou as pastas'
    return e.json(200, out)
  }

  /* ── 2. duplicidade de nome deve ser bloqueada (409) ── */
  var pDup = postar('/backend/v1/param-pastas', {
    nome: 'teste pastas cliente a',
    cnpj: '11111111000111',
  })
  out.duplicidade = { status: pDup.status, erro: pDup.json ? pDup.json.error : '' }

  /* ── 3. monta uma NF do CLIENTE A (emitente 11111111000111) ── */
  function nfe(chave, cnpjEmit, cnpjDest, nNF) {
    return (
      '<nfeProc><NFe><infNFe Id="NFe' +
      chave +
      '">' +
      '<ide><mod>55</mod><serie>1</serie><nNF>' +
      nNF +
      '</nNF><dhEmi>2026-10-05T10:00:00-03:00</dhEmi></ide>' +
      '<emit><CNPJ>' +
      cnpjEmit +
      '</CNPJ><xNome>CLIENTE A FORNECEDOR</xNome><enderEmit><UF>RS</UF></enderEmit></emit>' +
      '<dest><CNPJ>' +
      cnpjDest +
      '</CNPJ><xNome>DESTINO</xNome></dest>' +
      '<det n="1"><prod><cProd>P1</cProd><xProd>PRODUTO</xProd><NCM>07141000</NCM><CFOP>5102</CFOP>' +
      '<uCom>UN</uCom><qCom>1</qCom><vUnCom>1000.00</vUnCom><vProd>1000.00</vProd></prod></det>' +
      '<total><ICMSTot><vProd>1000.00</vProd><vNF>1000.00</vNF></ICMSTot></total>' +
      '</infNFe></NFe></nfeProc>'
    )
  }

  /* ── 4. importa a NF do cliente A na pasta do A (deve entrar) ── */
  var okA = postar('/backend/v1/param-importar-lote', {
    arquivos: [
      {
        nome: 'clienteA-na-pastaA.xml',
        xml: nfe(
          '43241011111111000111550010000090011000000090',
          '11111111000111',
          '99999999000199',
          '9001',
        ),
      },
    ],
    pasta: idA,
    lote: 'TESTE-F6-OK',
  })
  out.importar_certo = {
    status: okA.status,
    entraram: okA.json ? okA.json.entraram : null,
    pasta: okA.json ? okA.json.pasta : null,
    fora: okA.json ? okA.json.fora_da_pasta : null,
    resultados:
      okA.json && okA.json.resultados
        ? okA.json.resultados.map(function (r) {
            return { nome: r.nome, pasta: r.pasta, motivo: r.motivo_sem_pasta }
          })
        : [],
  }

  /* ── 5. A PROVA: importa NF do cliente A na pasta do B (deve RECUSAR) ── */
  var errado = postar('/backend/v1/param-importar-lote', {
    arquivos: [
      {
        nome: 'clienteA-na-pastaB-ERRADO.xml',
        xml: nfe(
          '43241011111111000111550010000090021000000108',
          '11111111000111',
          '99999999000199',
          '9002',
        ),
      },
    ],
    pasta: idB,
    lote: 'TESTE-F6-ERRADO',
  })
  out.importar_errado = {
    status: errado.status,
    entraram: errado.json ? errado.json.entraram : null,
    pasta: errado.json ? errado.json.pasta : null,
    fora_da_pasta: errado.json ? errado.json.fora_da_pasta : null,
    motivo:
      errado.json && errado.json.resultados && errado.json.resultados[0]
        ? errado.json.resultados[0].motivo_sem_pasta
        : '',
  }

  /* ── 6. confere no banco onde cada documento ficou ── */
  var conferencia = []
  try {
    var docs = $app.findRecordsByFilter('param_documentos', 'lote ~ "TESTE-F6"', '', 50, 0)
    for (var i = 0; i < docs.length; i++) {
      conferencia.push({
        arquivo: docs[i].getString('nome_arquivo'),
        lote: docs[i].getString('lote'),
        pasta_nome: docs[i].getString('pasta_nome'),
        pasta_id: docs[i].getString('pasta'),
      })
    }
  } catch (_) {}
  out.conferencia = conferencia

  /* ── 7. limpa tudo o que a rota criou ── */
  var apagados = 0
  try {
    for (var j = 0; j < docs.length; j++) {
      var its = $app.findRecordsByFilter(
        'param_itens',
        'documento = "' + docs[j].id + '"',
        '',
        100,
        0,
      )
      for (var k = 0; k < its.length; k++) $app.delete(its[k])
      $app.delete(docs[j])
      apagados++
    }
  } catch (_) {}
  var pastasApagadas = 0
  try {
    $app.delete($app.findRecordById('param_pastas', idA))
    $app.delete($app.findRecordById('param_pastas', idB))
    pastasApagadas = 2
  } catch (_) {}
  out.limpou = { documentos: apagados, pastas: pastasApagadas }

  /* ── 8. estado final: nenhum documento pode ter ficado sem pasta ── */
  var semPasta = 0
  try {
    var todos = $app.findRecordsByFilter('param_documentos', '', '', 5000, 0)
    for (var m = 0; m < todos.length; m++) {
      if (!todos[m].getString('pasta')) semPasta++
    }
  } catch (_) {}
  out.documentos_sem_pasta_apos_limpeza = semPasta

  return e.json(200, { success: true, resultado: out })
})
