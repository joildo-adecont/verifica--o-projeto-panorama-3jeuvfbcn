/// <reference path="../pb_data/types.d.ts" />

/**
 * PERMISSÕES DO CLIENTE — edição individual e em lote
 * ====================================================
 * Pedido do CEO (03/11/2026): "pode fazer os dois agora" — editar as permissões
 * de um cliente já cadastrado e aplicar as mesmas permissões a vários de uma vez.
 *
 * ── POR QUE UMA ROTA, E NÃO DUAS ──
 * Editar um cliente e editar trinta é a MESMA operação com `cliente_ids` de
 * tamanhos diferentes. Duas rotas pronto-duplicariam a regra de gravação — e a
 * regra aqui tem detalhe (ver abaixo). Uma rota só, com a lista como entrada,
 * garante que o comportamento em lote é exatamente o da edição individual.
 * Um item na lista não é um caso especial; é o caso mais simples.
 *
 * ── O DETALHE QUE NÃO PODE ERRAR ──
 * Os arrays de permissão são gravados SEMPRE, inclusive VAZIOS. Nos outros campos
 * do cadastro a regra é "só grava quando vem preenchido", para importação
 * parcial não apagar dado. Aqui o inverso é obrigatório: se "vazio" significasse
 * "não mexer", desmarcar a última proibição não a removeria do cadastro, e o
 * cliente seguiria bloqueado sem ninguém entender por quê. Foi o raciocínio
 * registrado na 0107 e ele vale igual aqui.
 *
 * ── POR QUE EXIGE TOKEN DO PAINEL ──
 * Isto muda quem entra e quem não entra no sistema. É a operação mais sensível
 * do cadastro: sem credencial, qualquer pessoa com a URL liberaria acesso a
 * qualquer cliente. Usa o mesmo X-Painel-Token do resto do painel.
 *
 * ── TRILHA ──
 * Cada cliente alterado gera uma linha em `simul_acesso_log` com o estado
 * anterior e o novo. Perguntar "por que o cliente X foi bloqueado?" meses depois
 * só tem resposta se alguém a escreveu na hora.
 */

routerAdd('OPTIONS', '/backend/v1/simul-acesso-permissoes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, X-Painel-Token')
  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/simul-acesso-permissoes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  // ── credencial ──
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || !recebido || recebido !== esperado) {
    return e.json(401, {
      success: false,
      error: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }

  var body = e.requestInfo().body || {}
  var ids = body.cliente_ids || []
  if (!Array.isArray(ids) || ids.length === 0) {
    return e.json(400, { success: false, error: 'Nenhum cliente selecionado.' })
  }
  if (ids.length > 1000) {
    return e.json(400, { success: false, error: 'Máximo de 1000 clientes por operação.' })
  }

  // ── normalização dos valores de entrada ──
  // Lista fechada: valor fora dela é descartado em silêncio, em vez de gravar
  // lixo que o enforcement depois não reconhece (e o bloqueio não aconteceria).
  var SITUACOES = ['liberado', 'restrito', 'bloqueado']
  var NIVEIS = ['N1_consulta', 'N2_relatorio', 'N3_confirmacao', 'N4_total']
  var REST_VALIDAS = [
    'proibe_exportar',
    'proibe_compartilhar',
    'proibe_confirmar',
    'proibe_novos_envios',
    'proibe_apos_expirar',
    'proibe_valores',
    'proibe_capitulacao',
    'proibe_historico',
  ]
  var LIB_VALIDAS = [
    'libera_valores',
    'libera_capitulacao',
    'libera_exportar',
    'libera_simulacoes_auto',
    'libera_download_anexos',
    'libera_multiplos_usuarios',
  ]

  function filtrar(lista, permitidos) {
    var out = []
    if (!Array.isArray(lista)) return out
    for (var i = 0; i < lista.length; i++) {
      if (permitidos.indexOf(lista[i]) >= 0 && out.indexOf(lista[i]) < 0) out.push(lista[i])
    }
    return out
  }

  var situacao = SITUACOES.indexOf(body.acesso_situacao) >= 0 ? body.acesso_situacao : null
  var nivel = NIVEIS.indexOf(body.acesso_nivel) >= 0 ? body.acesso_nivel : null
  var restricoes = filtrar(body.acesso_restricoes, REST_VALIDAS)
  var liberacoes = filtrar(body.acesso_liberacoes, LIB_VALIDAS)
  var motivo = body.acesso_motivo ? String(body.acesso_motivo).slice(0, 2000) : ''
  var autor = body.acesso_autorizado_por ? String(body.acesso_autorizado_por).slice(0, 300) : ''

  var validadeDias = null
  if (
    body.acesso_validade_dias !== undefined &&
    body.acesso_validade_dias !== null &&
    body.acesso_validade_dias !== ''
  ) {
    var vd = Number(body.acesso_validade_dias)
    if (isFinite(vd) && vd >= 0) validadeDias = vd
  }

  var agora = new Date()
  var carimbo = agora.toISOString().replace('T', ' ').slice(0, 19)

  var col = null
  try {
    col = $app.findCollectionByNameOrId('simul_clientes')
  } catch (_) {
    return e.json(500, { success: false, error: 'Coleção simul_clientes não encontrada.' })
  }

  var logCol = null
  try {
    logCol = $app.findCollectionByNameOrId('simul_acesso_log')
  } catch (_) {
    logCol = null // sem log a operação ainda vale; a trilha é acessório, não pré-requisito
  }

  var aplicados = []
  var falhas = []

  for (var k = 0; k < ids.length; k++) {
    var id = String(ids[k])
    var rec = null
    try {
      rec = $app.findRecordById('simul_clientes', id)
    } catch (_) {
      falhas.push({ id: id, motivo: 'cliente não encontrado' })
      continue
    }

    // ── estado anterior, para a trilha ──
    var sitAnt = rec.getString('acesso_situacao') || 'liberado'
    var nivAnt = rec.getString('acesso_nivel') || 'N3_confirmacao'
    var restAnt = rec.get('acesso_restricoes') || []
    var libAnt = rec.get('acesso_liberacoes') || []

    try {
      // situacao/nivel: só muda quando vieram (edição parcial de um só campo)
      if (situacao) rec.set('acesso_situacao', situacao)
      if (nivel) rec.set('acesso_nivel', nivel)

      // restrições e liberações: SEMPRE, inclusive vazias — ver o comentário
      // do topo. É o ponto onde "não mexer" e "apagar" não podem ser confundidos.
      rec.set('acesso_restricoes', restricoes)
      rec.set('acesso_liberacoes', liberacoes)

      if (motivo) rec.set('acesso_motivo', motivo)
      if (autor) rec.set('acesso_autorizado_por', autor)

      if (validadeDias !== null) {
        rec.set('acesso_validade_dias', validadeDias)
        if (validadeDias > 0) {
          var exp = new Date()
          exp.setDate(exp.getDate() + validadeDias)
          rec.set('acesso_expira_em', exp.toISOString().replace('T', ' ').slice(0, 19))
        } else {
          // zero significa "sem prazo": limpa a data, senão uma expiração antiga
          // continuaria valendo e fecharia o acesso de quem não deveria
          rec.set('acesso_expira_em', '')
        }
      }

      rec.set('acesso_atualizado_em', carimbo)
      $app.save(rec)

      aplicados.push({ id: id, nome: rec.getString('nome') })

      if (logCol) {
        try {
          var log = new Record(logCol)
          log.set('cliente_id', id)
          log.set('cliente_nome', rec.getString('nome'))
          log.set('acao', ids.length > 1 ? 'lote' : 'edicao')
          log.set('situacao_anterior', sitAnt)
          log.set('situacao_nova', rec.getString('acesso_situacao') || '')
          log.set('nivel_anterior', nivAnt)
          log.set('nivel_novo', rec.getString('acesso_nivel') || '')
          log.set('restricoes_anteriores', restAnt.join(','))
          log.set('restricoes_novas', restricoes.join(','))
          log.set('liberacoes_anteriores', libAnt.join(','))
          log.set('liberacoes_novas', liberacoes.join(','))
          log.set('motivo', motivo)
          log.set('autor', autor)
          log.set('registrado_em', carimbo)
          $app.save(log)
        } catch (_) {}
      }
    } catch (err) {
      falhas.push({ id: id, motivo: String(err) })
    }
  }

  return e.json(200, {
    success: true,
    aplicados: aplicados.length,
    falhas: falhas.length,
    // devolve a lista: em lote de 30, "30 aplicados" sem dizer QUAIS impede
    // conferir se o cliente certo entrou
    detalhe_aplicados: aplicados,
    detalhe_falhas: falhas,
    situacao: situacao || '(mantida)',
    nivel: nivel || '(mantido)',
    restricoes: restricoes,
    liberacoes: liberacoes,
  })
})

/**
 * GET /backend/v1/simul-acesso-permissoes?cliente_id=...
 * Lê o estado de permissão de um cliente — usado pelo formulário de edição, que
 * não pode depender da lista carregada na tela (ela pode estar velha).
 */
routerAdd('GET', '/backend/v1/simul-acesso-permissoes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  var esperadoG = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebidoG = e.request.header.get('X-Painel-Token') || ''
  if (!esperadoG || !recebidoG || recebidoG !== esperadoG) {
    return e.json(401, {
      success: false,
      error: 'Token do painel ausente ou inválido (X-Painel-Token).',
    })
  }

  var cid = e.requestInfo().query.cliente_id || ''
  if (!cid) return e.json(400, { success: false, error: 'cliente_id é obrigatório.' })

  var r = null
  try {
    r = $app.findRecordById('simul_clientes', cid)
  } catch (_) {
    return e.json(404, { success: false, error: 'Cliente não encontrado.' })
  }

  return e.json(200, {
    success: true,
    cliente: {
      id: r.id,
      nome: r.getString('nome'),
      empresa: r.getString('empresa'),
      email: r.getString('email'),
      acesso_situacao: r.getString('acesso_situacao') || 'liberado',
      acesso_nivel: r.getString('acesso_nivel') || 'N3_confirmacao',
      acesso_restricoes: r.get('acesso_restricoes') || [],
      acesso_liberacoes: r.get('acesso_liberacoes') || [],
      acesso_validade_dias: r.get('acesso_validade_dias') || 0,
      acesso_expira_em: r.getString('acesso_expira_em') || '',
      acesso_motivo: r.getString('acesso_motivo') || '',
      acesso_autorizado_por: r.getString('acesso_autorizado_por') || '',
      acesso_atualizado_em: r.getString('acesso_atualizado_em') || '',
    },
  })
})
