/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA DE VALIDAÇÃO DA FASE 4 — REMOVER APÓS O TESTE.
 *
 * Mesmo motivo da anterior: as rotas exigem X-Painel-Token, cujo valor não me é
 * exposto. Esta rota executa o fluxo real (importar lote → totalizadores →
 * análise IBS) com o segredo lido do próprio servidor, e devolve o resultado.
 *
 * Exige TESTE_PARAM_TOKEN; sem ele responde 404.
 */
routerAdd('POST', '/backend/v1/param-teste-fase4', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var painel = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var base = 'http://127.0.0.1:8090'
  var out = { passos: [] }

  // ── direção por CFOP: a regra que sustenta a separação entrada/saída ──
  function dirDe(cfop) {
    var c = String(cfop || '').replace(/\D/g, '')
    if (!c) return ''
    var d = c.charAt(0)
    if (d === '1' || d === '2' || d === '3') return 'entrada'
    if (d === '5' || d === '6' || d === '7') return 'saida'
    return ''
  }
  out.regra_cfop = {
    1102: dirDe('1102'),
    2102: dirDe('2102'),
    5102: dirDe('5102'),
    6102: dirDe('6102'),
    7101: dirDe('7101'),
    '': dirDe(''),
  }

  // ── monta documentos: 2 entradas + 2 saídas + 1 repetido ──
  function nfe(chave, mod, nNF, dh, cfop, valor, ncm) {
    return (
      '<nfeProc versao="4.00"><NFe><infNFe versao="4.00" Id="NFe' +
      chave +
      '">' +
      '<ide><mod>' +
      mod +
      '</mod><serie>1</serie><nNF>' +
      nNF +
      '</nNF><dhEmi>' +
      dh +
      '</dhEmi></ide>' +
      '<emit><CNPJ>11111111000111</CNPJ><xNome>FORNECEDOR TESTE</xNome><enderEmit><UF>RS</UF></enderEmit></emit>' +
      '<dest><CNPJ>22222222000122</CNPJ><xNome>ADECONT TESTE</xNome></dest>' +
      '<det n="1"><prod><cProd>X</cProd><xProd>PRODUTO TESTE</xProd><NCM>' +
      ncm +
      '</NCM>' +
      '<CFOP>' +
      cfop +
      '</CFOP><uCom>UN</uCom><qCom>1</qCom><vUnCom>' +
      valor +
      '</vUnCom><vProd>' +
      valor +
      '</vProd></prod>' +
      '<imposto><ICMS><ICMS00><CST>00</CST></ICMS00></ICMS></imposto></det>' +
      '<total><ICMSTot><vProd>' +
      valor +
      '</vProd><vNF>' +
      valor +
      '</vNF></ICMSTot></total>' +
      '</infNFe></NFe></nfeProc>'
    )
  }

  var k1 = '43241011111111000111550010000000011000000017'
  var arqs = [
    {
      nome: 'entrada-01.xml',
      xml: nfe(k1, '55', '1', '2026-09-10T10:00:00-03:00', '1102', '10000.00', '07141000'),
    },
    {
      nome: 'entrada-02.xml',
      xml: nfe(
        '43241011111111000111550010000000021000000025',
        '55',
        '2',
        '2026-10-12T10:00:00-03:00',
        '2102',
        '5000.00',
        '39269030',
      ),
    },
    {
      nome: 'saida-01.xml',
      xml: nfe(
        '43241011111111000111550010000000031000000033',
        '55',
        '3',
        '2026-09-20T10:00:00-03:00',
        '5102',
        '30000.00',
        '22030000',
      ),
    },
    {
      nome: 'saida-02.xml',
      xml: nfe(
        '43241011111111000111550010000000041000000041',
        '55',
        '4',
        '2026-10-22T10:00:00-03:00',
        '6102',
        '25000.00',
        '30049099',
      ),
    },
    /* o MESMO arquivo de novo: tem de cair como repetido, não duplicar */
    {
      nome: 'entrada-01-REPETIDO.xml',
      xml: nfe(k1, '55', '1', '2026-09-10T10:00:00-03:00', '1102', '10000.00', '07141000'),
    },
  ]

  function postar(rota, corpo, headers) {
    try {
      var h = { 'Content-Type': 'application/json' }
      for (var kk in headers) h[kk] = headers[kk]
      var r = $http.send({
        url: base + rota,
        method: 'POST',
        headers: h,
        body: JSON.stringify(corpo),
        timeout: 120,
      })
      return { status: r.statusCode, json: r.json }
    } catch (err) {
      return { status: 0, erro: String(err).slice(0, 200) }
    }
  }
  function pegar(rota, headers) {
    try {
      var h = {}
      for (var kk in headers) h[kk] = headers[kk]
      var r = $http.send({ url: base + rota, method: 'GET', headers: h, timeout: 120 })
      return { status: r.statusCode, json: r.json }
    } catch (err) {
      return { status: 0, erro: String(err).slice(0, 200) }
    }
  }

  /* $http.send para 127.0.0.1 dá status 0 (a porta interna do hook não é a do
     proxy). Então eu chamo as rotas pelo host público, com o token lido do
     segredo: mesmo caminho que o navegador faria. */
  var host = 'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'
  function postarPub(rota, corpo) {
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
      return { status: 0, erro: String(err).slice(0, 200) }
    }
  }
  function pegarPub(rota) {
    try {
      var r = $http.send({
        url: host + rota,
        method: 'GET',
        headers: { 'X-Painel-Token': painel },
        timeout: 120,
      })
      return { status: r.statusCode, json: r.json }
    } catch (err) {
      return { status: 0, erro: String(err).slice(0, 200) }
    }
  }

  var imp = postarPub('/backend/v1/param-importar-lote', { arquivos: arqs, lote: 'TESTE-FASE4' })
  out.passos.push({ etapa: 'importar-lote', status: imp.status })
  if (imp.status !== 200) {
    out.erro = imp.erro || (imp.json ? imp.json.error : 'falhou')
    return e.json(200, out)
  }
  var j = imp.json
  out.lote = {
    entraram: j.entraram,
    repetidos: j.repetidos,
    invalidos: j.invalidos,
    valor_entrada: j.valor_entrada,
    valor_saida: j.valor_saida,
    direcoes: (j.resultados || []).map(function (r) {
      return r.nome + '=' + (r.direcao || r.status)
    }),
  }

  var tot = pegarPub('/backend/v1/param-totalizadores')
  out.totalizadores =
    tot.status === 200
      ? {
          status: tot.status,
          meses: (tot.json.meses || []).map(function (m) {
            return m.competencia + ': E=' + m.entrada + ' S=' + m.saida + ' res=' + m.resultado
          }),
          totais: tot.json.totais,
        }
      : { status: tot.status, erro: tot.erro }

  var ibs = pegarPub('/backend/v1/param-analise-ibs')
  out.analise_ibs =
    ibs.status === 200
      ? {
          status: ibs.status,
          periodo: ibs.json.periodo,
          base: ibs.json.base,
        }
      : { status: ibs.status, erro: ibs.erro }

  // limpa o lote de teste
  var apagados = 0
  try {
    var docsT = $app.findRecordsByFilter('param_documentos', 'lote = "TESTE-FASE4"', '', 100, 0)
    for (var i = 0; i < docsT.length; i++) {
      var its = $app.findRecordsByFilter(
        'param_itens',
        'documento = "' + docsT[i].id + '"',
        '',
        100,
        0,
      )
      for (var m = 0; m < its.length; m++) $app.delete(its[m])
      $app.delete(docsT[i])
      apagados++
    }
  } catch (_) {}
  out.limpou = apagados

  return e.json(200, { success: true, resultado: out })
})
