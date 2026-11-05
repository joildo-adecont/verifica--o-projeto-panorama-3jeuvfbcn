/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — CORRIGE AS 9 NOTAS DE ENTRADA E ARQUIVA. REMOVER DEPOIS.
 *
 * ── O QUE FOI ENCONTRADO ──
 * O DIO SANTO tem 10 documentos no sistema. Nove estão marcados como `saida` e
 * todos os emitentes são FORNECEDORES (SEGALAS, SPAL, PERTE, EXCELENCIA). Se o
 * cliente é o DESTINATÁRIO, a operação é ENTRADA — ele comprou.
 *
 * O erro vem da regra ANTIGA, anterior à correção de 04/11: o CFOP dessas notas
 * (5102/6102) aponta saída para quem emitiu, e era isso que o sistema gravava.
 *
 * ── O QUE ESTA ROTA FAZ ──
 * 1. Recalcula a direção pela posição do CLIENTE na nota (regra nova).
 * 2. Move para Compras ou Vendas conforme o resultado.
 * 3. Compara com a direção gravada e relata o que mudou.
 *
 * Nada é apagado. A nota da SEGALAS já está correta (entrada) e não será tocada.
 */
routerAdd('POST', '/backend/v1/param-corrigir-lote-diosanto', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var body = e.requestInfo().body || {}
  var aplicar = body.aplicar === true
  var CNPJ = '08174238000145'

  var out = { antes: [], depois: [], corrigidos: 0, movidos: 0, ja_correto: 0 }

  /**
   * A REGRA — a mesma `direcaoDoCliente` do hook de produção.
   * O CFOP é a ótica do EMITENTE; a direção do CLIENTE vem de onde ele está.
   */
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

  /* a base e as filhas do cliente */
  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
  } catch (_) {}
  var baseId = ''
  var folha = {}
  for (var i = 0; i < pastas.length; i++) {
    var c = String(pastas[i].getString('cnpj') || '').replace(/\D/g, '')
    if (c !== CNPJ) continue
    if (!pastas[i].getString('pai')) baseId = pastas[i].id
  }
  for (var j = 0; j < pastas.length; j++) {
    if (pastas[j].getString('pai') === baseId) {
      folha[pastas[j].getString('tipo')] = { id: pastas[j].id, nome: pastas[j].getString('nome') }
    }
  }
  out.folhas = {
    compras: folha['entrada'] ? folha['entrada'].nome : '(nao existe)',
    vendas: folha['saida'] ? folha['saida'].nome : '(nao existe)',
  }

  /* documentos do cliente */
  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-data_emissao', 20000, 0)
  } catch (_) {}

  for (var k = 0; k < docs.length; k++) {
    var d = docs[k]
    var cE = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cD = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    if (cE !== CNPJ && cD !== CNPJ) continue

    var dirAntiga = d.getString('direcao')
    var dirNova = direcaoDoCliente(CNPJ, cE, cD, d.getString('cfop_predominante'))
    var papel = cE === CNPJ ? 'EMITENTE (vendeu)' : cD === CNPJ ? 'DESTINATARIO (comprou)' : '?'

    var info = {
      id: d.id,
      arquivo: d.getString('numero'),
      emitente: String(d.getString('emitente_nome')).slice(0, 28),
      papel: papel,
      cfop: d.getString('cfop_predominante'),
      direcao_antes: dirAntiga,
      direcao_correta: dirNova,
      pasta_antes: d.getString('pasta_nome'),
      valor: Number(d.get('valor_total')) || 0,
    }
    out.antes.push(info)

    if (dirNova === dirAntiga) {
      out.ja_correto++
    }

    if (!aplicar) continue

    /* grava a direção nova (se mudou) */
    var mudou = dirNova && dirNova !== dirAntiga
    if (mudou) {
      d.set('direcao', dirNova)
      $app.save(d)
      var its = []
      try {
        its = $app.findRecordsByFilter('param_itens', 'documento = "' + d.id + '"', '', 5000, 0)
      } catch (_) {}
      for (var m = 0; m < its.length; m++) {
        its[m].set('direcao', dirNova)
        $app.save(its[m])
      }
      out.corrigidos++
    }

    /* move para a folha certa */
    var destino =
      dirNova === 'entrada' ? folha['entrada'] : dirNova === 'saida' ? folha['saida'] : null
    if (destino && d.getString('pasta') !== destino.id) {
      d.set('pasta', destino.id)
      d.set('pasta_nome', destino.nome)
      $app.save(d)
      var its2 = []
      try {
        its2 = $app.findRecordsByFilter('param_itens', 'documento = "' + d.id + '"', '', 5000, 0)
      } catch (_) {}
      for (var n = 0; n < its2.length; n++) {
        its2[n].set('pasta', destino.id)
        $app.save(its2[n])
      }
      out.movidos++
      info.pasta_depois = destino.nome
    } else {
      info.pasta_depois = d.getString('pasta_nome')
    }
    out.depois.push(info)
  }

  /* estado final */
  var resumo = {}
  for (var p in folha) {
    var ds = []
    try {
      ds = $app.findRecordsByFilter(
        'param_documentos',
        'pasta = "' + folha[p].id + '"',
        '',
        5000,
        0,
      )
    } catch (_) {}
    var tot = 0
    for (var q = 0; q < ds.length; q++) tot += Number(ds[q].get('valor_total')) || 0
    resumo[p] = { documentos: ds.length, valor: Math.round(tot * 100) / 100 }
  }
  out.resumo_pastas = resumo

  var semPasta = []
  try {
    var todos = $app.findRecordsByFilter('param_documentos', '', '', 20000, 0)
    for (var r = 0; r < todos.length; r++) {
      var cc1 = String(todos[r].getString('emitente_cnpj') || '').replace(/\D/g, '')
      var cc2 = String(todos[r].getString('destinatario_cnpj') || '').replace(/\D/g, '')
      if ((cc1 === CNPJ || cc2 === CNPJ) && !todos[r].getString('pasta')) {
        semPasta.push(todos[r].getString('numero'))
      }
    }
  } catch (_) {}
  out.do_cliente_sem_pasta = semPasta.length

  return e.json(200, { success: true, aplicado: aplicar, resultado: out })
})
