/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA DE LIMPEZA — REMOVER APÓS USO.
 *
 * Por que existe: durante a validação das fases 1 a 4 importei documentos de
 * teste em produção. Eles ficaram no banco e poluem os totalizadores — aparecem
 * como "sem direção" (importados antes de existir o campo) e somam R$ 2.267,34
 * que não são do CEO nem de cliente nenhum. Dado de teste em painel de produção
 * é pior que dado faltando: parece real.
 *
 * Apaga SOMENTE o que é de teste, e prova o que apagou:
 *   - documentos com nome_arquivo contendo 'teste'
 *   - documentos cujo emitente é 'FORNECEDOR TESTE' / 'DISTRIBUIDORA PARANA LTDA'
 *     (os CNPJs que usei nos XMLs sintéticos)
 *   - documentos do lote 'TESTE-FASE4'
 *
 * NÃO toca em documento com CNPJ real de cliente.
 */
routerAdd('POST', '/backend/v1/param-limpar-teste', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var body = e.requestInfo().body || {}
  var somenteListar = body.listar === true

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 5000, 0)
  } catch (_) {
    docs = []
  }

  /* CNPJs dos XMLs sintéticos que usei nas validações. Nenhum é de cliente. */
  var CNPJ_TESTE = {
    11111111000111: true,
    11122233000144: true,
    12345678000199: true,
    98765432000188: true,
    22222222000122: true,
    99888777000166: true,
  }

  var alvos = []
  for (var i = 0; i < docs.length; i++) {
    var d = docs[i]
    var nome = String(d.getString('nome_arquivo') || '').toLowerCase()
    var cnpj = String(d.getString('emitente_cnpj') || '')
    var cnpjD = String(d.getString('destinatario_cnpj') || '')
    var lote = String(d.getString('lote') || '')
    var razao = ''
    if (nome.indexOf('teste') >= 0) razao = 'nome do arquivo'
    else if (lote.indexOf('TESTE') >= 0) razao = 'lote de teste'
    else if (CNPJ_TESTE[cnpj] || CNPJ_TESTE[cnpjD]) razao = 'CNPJ sintético'
    if (razao) {
      alvos.push({
        id: d.id,
        nome: d.getString('nome_arquivo'),
        emitente: d.getString('emitente_nome'),
        cnpj: cnpj,
        valor: d.get('valor_total'),
        direcao: d.getString('direcao'),
        motivo: razao,
      })
    }
  }

  if (somenteListar) {
    return e.json(200, { success: true, encontrados: alvos.length, alvos: alvos })
  }

  var apagados = 0
  var itensApagados = 0
  var erros = []
  for (var j = 0; j < alvos.length; j++) {
    try {
      var its = $app.findRecordsByFilter(
        'param_itens',
        'documento = "' + alvos[j].id + '"',
        '',
        500,
        0,
      )
      for (var k = 0; k < its.length; k++) {
        $app.delete(its[k])
        itensApagados++
      }
      $app.delete($app.findRecordById('param_documentos', alvos[j].id))
      apagados++
    } catch (err) {
      erros.push(String(err).slice(0, 120))
    }
  }

  return e.json(200, {
    success: true,
    encontrados: alvos.length,
    documentos_apagados: apagados,
    itens_apagados: itensApagados,
    erros: erros,
    alvos: alvos,
  })
})
