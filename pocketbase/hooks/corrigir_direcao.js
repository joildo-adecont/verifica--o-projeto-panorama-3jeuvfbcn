/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA — VERIFICA E CORRIGE A DIREÇÃO RELATIVA AO CLIENTE.
 *
 * ── O ERRO QUE O CEO APONTOU ──
 * O CFOP é sempre a ótica de QUEM EMITE o documento. O 6.102 significa "venda de
 * mercadoria adquirida de terceiros, interestadual" — é SAÍDA para a SEGALAS,
 * que emitiu. Para o DIO SANTO, que é o DESTINATÁRIO, a mesma operação é
 * ENTRADA: ele comprou.
 *
 * A regra que eu escrevi olhava só o primeiro dígito do CFOP e chamava aquilo de
 * "a direção do documento". Isso é a direção do EMITENTE, não do cliente cuja
 * pasta estamos organizando. Resultado: uma compra do restaurante foi arquivada
 * em Vendas.
 *
 * ── A REGRA CORRETA ──
 * A direção que interessa é a do CLIENTE (o dono da pasta):
 *   cliente é o EMITENTE      → SAÍDA  (ele vendeu)
 *   cliente é o DESTINATÁRIO  → ENTRADA (ele comprou)
 *   cliente é ambos           → decide o CFOP (transferência entre filiais)
 *   cliente não identificado  → fica o CFOP, mas marcado como ótica do emitente
 *
 * Esta rota mostra o ANTES, aplica a correção e mostra o DEPOIS. Nada é apagado.
 */
routerAdd('POST', '/backend/v1/param-corrigir-direcao', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = { antes: [], depois: [], corrigidos: 0, sem_cliente: 0 }

  /* ── mapa pasta -> CNPJ do cliente ── */
  var pastas = []
  try {
    pastas = $app.findRecordsByFilter('param_pastas', '', 'nome', 2000, 0)
  } catch (_) {}
  var cnpjDaPasta = {}
  var tipoDaPasta = {}
  var paiDaPasta = {}
  for (var i = 0; i < pastas.length; i++) {
    cnpjDaPasta[pastas[i].id] = String(pastas[i].getString('cnpj') || '').replace(/\D/g, '')
    tipoDaPasta[pastas[i].id] = pastas[i].getString('tipo') || 'base'
    paiDaPasta[pastas[i].id] = pastas[i].getString('pai')
  }

  /* sobe até a base para achar o CNPJ do cliente */
  function cnpjDoCliente(pastaId) {
    if (!pastaId) return ''
    var atual = pastaId
    var guarda = 0
    while (atual && guarda < 5) {
      if (cnpjDaPasta[atual]) return cnpjDaPasta[atual]
      atual = paiDaPasta[atual]
      guarda++
    }
    return ''
  }

  function dirCliente(cnpjCliente, cEmit, cDest, cfop) {
    if (cnpjCliente) {
      var eEmit = cEmit && cEmit === cnpjCliente
      var eDest = cDest && cDest === cnpjCliente
      if (eEmit && !eDest) return 'saida'
      if (eDest && !eEmit) return 'entrada'
    }
    /* sem cliente identificado (ou é os dois): CFOP, ótica do emitente */
    var c = String(cfop || '').replace(/\D/g, '')
    if (!c) return ''
    var d = c.charAt(0)
    if (d === '1' || d === '2' || d === '3') return 'entrada'
    if (d === '5' || d === '6' || d === '7') return 'saida'
    return ''
  }

  var docs = []
  try {
    docs = $app.findRecordsByFilter('param_documentos', '', '-importado_em', 20000, 0)
  } catch (_) {}

  for (var j = 0; j < docs.length; j++) {
    var d = docs[j]
    var cEmit = String(d.getString('emitente_cnpj') || '').replace(/\D/g, '')
    var cDest = String(d.getString('destinatario_cnpj') || '').replace(/\D/g, '')
    var pastaAtual = d.getString('pasta')
    var cnpjCli = cnpjDoCliente(pastaAtual)
    var dirAntiga = d.getString('direcao')
    var dirNova = dirCliente(cnpjCli, cEmit, cDest, d.getString('cfop_predominante'))

    var info = {
      arquivo: d.getString('nome_arquivo'),
      emitente: d.getString('emitente_nome') + ' (' + cEmit + ')',
      destinatario: d.getString('destinatario_nome') + ' (' + cDest + ')',
      cnpj_cliente: cnpjCli || '(sem cliente)',
      cfop: d.getString('cfop_predominante'),
      pasta_atual: d.getString('pasta_nome'),
      direcao_antes: dirAntiga,
      direcao_correta: dirNova,
    }
    out.antes.push(info)

    if (!cnpjCli) {
      out.sem_cliente++
      continue
    }
    if (!dirNova || dirNova === dirAntiga) continue

    /* ── corrige a direção do documento ── */
    d.set('direcao', dirNova)
    $app.save(d)

    /* ── corrige a direção dos itens ── */
    var its = []
    try {
      its = $app.findRecordsByFilter('param_itens', 'documento = "' + d.id + '"', '', 5000, 0)
    } catch (_) {}
    for (var k = 0; k < its.length; k++) {
      its[k].set('direcao', dirNova)
      $app.save(its[k])
    }

    /* ── move para a folha certa, se o cliente tem estrutura ── */
    var baseDoCliente = ''
    for (var m = 0; m < pastas.length; m++) {
      if (paiDaPasta[pastas[m].id] === '' && cnpjDaPasta[pastas[m].id] === cnpjCli) {
        baseDoCliente = pastas[m].id
        break
      }
    }
    var destino = ''
    var nomeDestino = ''
    if (baseDoCliente) {
      for (var n = 0; n < pastas.length; n++) {
        if (paiDaPasta[pastas[n].id] === baseDoCliente && tipoDaPasta[pastas[n].id] === dirNova) {
          destino = pastas[n].id
          nomeDestino = pastas[n].getString('nome')
          break
        }
      }
    }
    if (destino && pastaAtual !== destino) {
      d.set('pasta', destino)
      d.set('pasta_nome', nomeDestino)
      $app.save(d)
      for (var p = 0; p < its.length; p++) {
        its[p].set('pasta', destino)
        $app.save(its[p])
      }
    }

    info.pasta_nova = nomeDestino || info.pasta_atual
    out.corrigidos++
    out.depois.push({
      arquivo: info.arquivo,
      direcao: dirNova,
      pasta: nomeDestino || info.pasta_atual,
      motivo:
        'cliente é ' +
        (cEmit === cnpjCli ? 'o EMITENTE → saída' : 'o DESTINATÁRIO → entrada') +
        ' (CFOP ' +
        info.cfop +
        ' é a ótica de quem emitiu)',
    })
  }

  /* ── estado final das pastas do DIO SANTO ── */
  var resumo = []
  try {
    var doDio = []
    for (var q = 0; q < pastas.length; q++) {
      if (cnpjDaPasta[pastas[q].id] === '08174238000145') doDio.push(pastas[q])
    }
    for (var r = 0; r < doDio.length; r++) {
      var ds = $app.findRecordsByFilter(
        'param_documentos',
        'pasta = "' + doDio[r].id + '"',
        '',
        5000,
        0,
      )
      var tot = 0
      for (var s = 0; s < ds.length; s++) tot += Number(ds[s].get('valor_total')) || 0
      resumo.push({
        tipo: tipoDaPasta[doDio[r].id],
        nome: doDio[r].getString('nome'),
        documentos: ds.length,
        valor: Math.round(tot * 100) / 100,
      })
    }
  } catch (_) {}
  out.dio_santo = resumo

  return e.json(200, { success: true, resultado: out })
})
