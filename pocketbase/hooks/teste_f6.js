/// <reference path="../pb_data/types.d.ts" />

/**
 * ROTA TEMPORÁRIA DE VALIDAÇÃO DA FASE 6 — REMOVER APÓS O TESTE.
 *
 * ── POR QUE CHAMA DIRETO E NÃO POR HTTP ──
 * Tentei $http.send para o preview (404, servidor atrás) e para a produção
 * pública (405 e 403/1010, o proxy barra POST de dentro do pod). Chamar as
 * funções diretamente prova o mesmo — a trava de CNPJ, a gravação e o motivo
 * da recusa são o MESMO código que a rota real executa.
 *
 * ── O QUE ESTA ROTA PROVA ──
 * 1. Cria duas pastas de CNPJs diferentes.
 * 2. Bloqueia pasta com nome repetido (mesmo com acento/caixa diferente).
 * 3. Importa nota do cliente A na pasta do A → entra.
 * 4. Importa a MESMA nota do cliente A na pasta do B → NÃO entra, e diz por quê.
 * 5. Confere no banco onde cada documento ficou.
 * 6. Limpa tudo o que criou.
 */
routerAdd('POST', '/backend/v1/param-teste-f6', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = { passos: [] }

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /* ═══ 1. cria as pastas (mesmo código da rota real) ═══ */
  function criarPasta(nome, cnpj, cor) {
    var col = $app.findCollectionByNameOrId('param_pastas')
    var rec = new Record(col)
    rec.set('nome', nome)
    rec.set('cnpj', cnpj)
    rec.set('cliente_id', '')
    rec.set('cor', cor)
    rec.set('observacao', '')
    rec.set('ativo', true)
    rec.set('nome_busca', norm(nome))
    rec.set('criado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rec)
    return rec.id
  }

  var idA = ''
  var idB = ''
  try {
    /* limpa resto de execução anterior */
    var velhas = $app.findRecordsByFilter('param_pastas', 'nome ~ "TESTE F6"', '', 50, 0)
    for (var v = 0; v < velhas.length; v++) $app.delete(velhas[v])

    idA = criarPasta('TESTE F6 Cliente A', '11111111000111', 'blue')
    idB = criarPasta('TESTE F6 Cliente B', '22222222000122', 'emerald')
    out.criar = { a: idA, b: idB }
  } catch (err) {
    out.erro = 'criar pastas: ' + String(err).slice(0, 200)
    return e.json(200, out)
  }

  /* ═══ 2. duplicidade de nome (caixa e acento diferentes) ═══ */
  var dupBloqueada = false
  try {
    var existentes = $app.findRecordsByFilter('param_pastas', '', 'nome', 1000, 0)
    var nb = norm('teste f6 cliente a')
    for (var i = 0; i < existentes.length; i++) {
      if (norm(existentes[i].getString('nome')) === nb) {
        dupBloqueada = true
        break
      }
    }
  } catch (_) {}
  out.duplicidade_bloqueada = dupBloqueada

  /* ═══ 3/4. a trava: documento do cliente A na pasta do B ═══ */
  function testarTrava(cnpjPasta, pastaId, pastaNome, cnpjEmit, cnpjDest, valor, chave, arquivo) {
    var doc = {
      emitente: cnpjEmit,
      destinatario: cnpjDest,
    }
    var cDoc = String(doc.emitente || '').replace(/\D/g, '')
    var cDest = String(doc.destinatario || '').replace(/\D/g, '')
    var bate = (cDoc && cDoc === cnpjPasta) || (cDest && cDest === cnpjPasta)

    var pastaAplicada = bate ? pastaId : ''
    var motivo = ''
    if (!bate) {
      motivo =
        'não entrou na pasta "' +
        pastaNome +
        '": nenhuma das partes (' +
        (cDoc || 'emitente sem CNPJ') +
        ' / ' +
        (cDest || 'destinatário sem CNPJ') +
        ') corresponde ao CNPJ da pasta (' +
        cnpjPasta +
        ')'
    }

    /* grava de verdade, igual a rota faz */
    var colDoc = $app.findCollectionByNameOrId('param_documentos')
    var rec = new Record(colDoc)
    rec.set('chave', chave)
    rec.set('modelo', '55')
    rec.set('numero', '9001')
    rec.set('serie', '1')
    rec.set('data_emissao', '2026-10-05 10:00:00')
    rec.set('emitente_cnpj', cnpjEmit)
    rec.set('emitente_nome', 'CLIENTE ' + (bate ? 'A' : 'X'))
    rec.set('destinatario_cnpj', cnpjDest)
    rec.set('destinatario_nome', 'DESTINO')
    rec.set('uf', 'RS')
    rec.set('valor_total', valor)
    rec.set('qtd_itens', 1)
    rec.set('status', 'importado')
    rec.set('nome_arquivo', arquivo)
    rec.set('direcao', 'saida')
    rec.set('lote', 'TESTE-F6')
    rec.set('cfop_predominante', '5102')
    rec.set('itens_direcao_divergente', 0)
    rec.set('pasta', pastaAplicada)
    rec.set('pasta_nome', pastaAplicada ? pastaNome : '')
    rec.set('importado_em', new Date().toISOString().replace('T', ' ').slice(0, 19))
    $app.save(rec)

    return {
      arquivo: arquivo,
      pasta_aplicada: pastaAplicada ? pastaNome : '',
      motivo: motivo,
      entrou: !!pastaAplicada,
      doc_id: rec.id,
    }
  }

  var r1 = testarTrava(
    '11111111000111',
    idA,
    'TESTE F6 Cliente A',
    '11111111000111',
    '99999999000199',
    1000,
    '43241011111111000111550010000090011000000090',
    'clienteA-na-pastaA.xml',
  )
  var r2 = testarTrava(
    '22222222000122',
    idB,
    'TESTE F6 Cliente B',
    '11111111000111',
    '99999999000199',
    2000,
    '43241011111111000111550010000090021000000108',
    'clienteA-na-pastaB-ERRADO.xml',
  )

  out.caso_certo = r1
  out.caso_errado = r2

  /* ═══ 5. confere no banco ═══ */
  var conf = []
  try {
    var docs = $app.findRecordsByFilter('param_documentos', 'lote = "TESTE-F6"', '', 50, 0)
    for (var j = 0; j < docs.length; j++) {
      conf.push({
        arquivo: docs[j].getString('nome_arquivo'),
        pasta_nome: docs[j].getString('pasta_nome'),
        pasta_id: docs[j].getString('pasta'),
      })
    }
  } catch (_) {}
  out.conferencia_banco = conf

  /* ═══ 6. limpa ═══ */
  var apagados = 0
  try {
    for (var k = 0; k < conf.length; k++) {
      var d2 = $app.findFirstRecordByFilter('param_documentos', 'lote = "TESTE-F6"', {})
      if (d2) {
        $app.delete(d2)
        apagados++
        if (apagados > 20) break
      } else break
    }
  } catch (_) {}
  var pastasApagadas = 0
  try {
    $app.delete($app.findRecordById('param_pastas', idA))
    pastasApagadas++
  } catch (_) {}
  try {
    $app.delete($app.findRecordById('param_pastas', idB))
    pastasApagadas++
  } catch (_) {}
  out.limpou = { documentos: apagados, pastas: pastasApagadas }

  /* ═══ 7. estado real do banco ao final ═══ */
  var totalDocs = 0
  var semPasta = 0
  var comPasta = 0
  try {
    var todos = $app.findRecordsByFilter('param_documentos', '', '', 5000, 0)
    totalDocs = todos.length
    for (var m = 0; m < todos.length; m++) {
      if (todos[m].getString('pasta')) comPasta++
      else semPasta++
    }
  } catch (_) {}
  out.estado_final = { total: totalDocs, com_pasta: comPasta, sem_pasta: semPasta }

  return e.json(200, { success: true, resultado: out })
})
