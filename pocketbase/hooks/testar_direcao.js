/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — PROVA A CORREÇÃO DA DIREÇÃO. REMOVER APÓS O TESTE.
 *
 * Simula exatamente o caso que estava errado: uma NF-e emitida pela SEGALAS
 * (CNPJ 01333984000276) com CFOP 6102, destinada ao DIO SANTO (08174238000145),
 * importada para a pasta do DIO SANTO.
 *
 *   Regra ANTIGA: CFOP 6102 → 'saida' → ia para Vendas   ❌ (compra em Vendas)
 *   Regra NOVA:   cliente é o DESTINATÁRIO → 'entrada' → vai para Compras  ✅
 *
 * Também testa o sentido inverso: uma venda do DIO SANTO (ele como emitente)
 * tem de ir para Vendas.
 */
routerAdd('POST', '/backend/v1/param-testar-direcao', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var CLIENTE = '08174238000145'
  var SEGALAS = '01333984000276'
  var out = {}

  /* a função em teste — cópia exata da que está no hook de produção */
  function direcaoDoCliente(cnpjCliente, cnpjEmitente, cnpjDestinatario, cfop) {
    var cli = String(cnpjCliente || '').replace(/\D/g, '')
    var emit = String(cnpjEmitente || '').replace(/\D/g, '')
    var dest = String(cnpjDestinatario || '').replace(/\D/g, '')
    if (cli) {
      var eEmit = emit && emit === cli
      var eDest = dest && dest === cli
      if (eEmit && !eDest) return 'saida'
      if (eDest && !eEmit) return 'entrada'
    }
    var c = String(cfop || '').replace(/\D/g, '')
    if (!c) return ''
    var d = c.charAt(0)
    if (d === '1' || d === '2' || d === '3') return 'entrada'
    if (d === '5' || d === '6' || d === '7') return 'saida'
    return ''
  }

  out.casos = [
    {
      caso: 'COMPRA do cliente (SEGALAS emite, DIO SANTO recebe, CFOP 6102)',
      esperado: 'entrada',
      obtido: direcaoDoCliente(CLIENTE, SEGALAS, CLIENTE, '6102'),
    },
    {
      caso: 'VENDA do cliente (DIO SANTO emite, CFOP 5102)',
      esperado: 'saida',
      obtido: direcaoDoCliente(CLIENTE, CLIENTE, '99999999000199', '5102'),
    },
    {
      caso: 'TRANSFERÊNCIA entre filiais (cliente é as duas partes, CFOP 1152)',
      esperado: 'entrada',
      obtido: direcaoDoCliente(CLIENTE, CLIENTE, CLIENTE, '1152'),
    },
    {
      caso: 'SEM cliente na pasta (cai no CFOP, ótica do emitente)',
      esperado: 'saida',
      obtido: direcaoDoCliente('', SEGALAS, CLIENTE, '6102'),
    },
    {
      caso: 'COMPRA com CFOP 2102 (estadual)',
      esperado: 'entrada',
      obtido: direcaoDoCliente(CLIENTE, SEGALAS, CLIENTE, '2102'),
    },
  ]

  var ok = 0
  for (var i = 0; i < out.casos.length; i++) {
    out.casos[i].passou = out.casos[i].obtido === out.casos[i].esperado
    if (out.casos[i].passou) ok++
  }
  out.aprovados = ok + '/' + out.casos.length

  /* ── agora o teste de verdade: importar um XML novo na pasta do DIO SANTO ── */
  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', 'cnpj = "08174238000145"', '', 20, 0)
  } catch (_) {}
  var base = null
  for (var j = 0; j < pastas.length; j++) {
    if (!pastas[j].getString('pai')) {
      base = pastas[j]
      break
    }
  }
  if (!base) {
    out.erro = 'pasta do DIO SANTO não encontrada'
    return e.json(200, out)
  }

  /* XML de compra do restaurante: SEGALAS emite, DIO SANTO recebe, CFOP 6102 */
  var chaveTeste = '43241101333984000276550010000099991000099991'
  var xml =
    '<nfeProc><NFe><infNFe Id="NFe' +
    chaveTeste +
    '">' +
    '<ide><mod>55</mod><serie>1</serie><nNF>9999</nNF><dhEmi>2026-11-04T09:00:00-03:00</dhEmi></ide>' +
    '<emit><CNPJ>' +
    SEGALAS +
    '</CNPJ><xNome>SEGALAS ALIMENTOS LTDA FILIAL 2</xNome><enderEmit><UF>SC</UF></enderEmit></emit>' +
    '<dest><CNPJ>' +
    CLIENTE +
    '</CNPJ><xNome>DIO SANTO TRATTORIA LTDA</xNome></dest>' +
    '<det n="1"><prod><cProd>T1</cProd><xProd>TESTE DIREÇÃO</xProd><NCM>21069090</NCM><CFOP>6102</CFOP>' +
    '<uCom>UN</uCom><qCom>1</qCom><vUnCom>100.00</vUnCom><vProd>100.00</vProd></prod></det>' +
    '<total><ICMSTot><vProd>100.00</vProd><vNF>100.00</vNF></ICMSTot></total>' +
    '</infNFe></NFe></nfeProc>'

  /* grava simulando exatamente o que a rota de importação faz agora */
  var dirNova = direcaoDoCliente(base.getString('cnpj'), SEGALAS, CLIENTE, '6102')
  var colDoc = $app.findCollectionByNameOrId('param_documentos')
  var rec = new Record(colDoc)
  rec.set('chave', chaveTeste)
  rec.set('modelo', '55')
  rec.set('numero', '9999')
  rec.set('serie', '1')
  rec.set('data_emissao', '2026-11-04 09:00:00')
  rec.set('emitente_cnpj', SEGALAS)
  rec.set('emitente_nome', 'SEGALAS ALIMENTOS LTDA FILIAL 2')
  rec.set('destinatario_cnpj', CLIENTE)
  rec.set('destinatario_nome', 'DIO SANTO TRATTORIA LTDA')
  rec.set('uf', 'SC')
  rec.set('valor_total', 100)
  rec.set('qtd_itens', 1)
  rec.set('status', 'importado')
  rec.set('nome_arquivo', 'teste-direcao-compras.xml')
  rec.set('direcao', dirNova)
  rec.set('cfop_predominante', '6102')
  rec.set('lote', 'TESTE-DIRECAO')
  rec.set('importado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))

  /* destino: a folha certa da base */
  var folha = ''
  var folhaNome = ''
  for (var k = 0; k < pastas.length; k++) {
    if (pastas[k].getString('pai') === base.id && pastas[k].getString('tipo') === dirNova) {
      folha = pastas[k].id
      folhaNome = pastas[k].getString('nome')
      break
    }
  }
  rec.set('pasta', folha)
  rec.set('pasta_nome', folhaNome)
  $app.save(rec)

  out.importacao_teste = {
    cfop: '6102 (ótica do EMITENTE = saída dele)',
    cliente_eh: 'DESTINATÁRIO',
    direcao_calculada: dirNova,
    pasta_destino: folhaNome,
    correto: dirNova === 'entrada' && folhaNome.indexOf('Compras') >= 0,
  }

  /* limpa o documento de teste */
  try {
    var its = $app.findRecordsByFilter('param_itens', 'documento = "' + rec.id + '"', '', 100, 0)
    for (var m = 0; m < its.length; m++) $app.delete(its[m])
    $app.delete($app.findRecordById('param_documentos', rec.id))
    out.limpou = true
  } catch (_) {
    out.limpou = false
  }

  /* estado final das pastas do DIO SANTO */
  var resumo = []
  for (var n = 0; n < pastas.length; n++) {
    var ds = $app.findRecordsByFilter(
      'param_documentos',
      'pasta = "' + pastas[n].id + '"',
      '',
      5000,
      0,
    )
    var tot = 0
    for (var p = 0; p < ds.length; p++) tot += Number(ds[p].get('valor_total')) || 0
    resumo.push({
      tipo: pastas[n].getString('tipo') || 'base',
      nome: pastas[n].getString('nome'),
      documentos: ds.length,
      valor: Math.round(tot * 100) / 100,
    })
  }
  out.dio_santo = resumo

  return e.json(200, { success: true, resultado: out })
})
