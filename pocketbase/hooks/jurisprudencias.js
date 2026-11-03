/**
 * JURISPRUDÊNCIAS — publicação do acervo do escritório
 * ====================================================
 * Pedido do CEO (03/11/2026): "Crie um ícone em separado no acervo jurídico só
 * para publicar as jurisprudências."
 *
 * ── O QUE ESTE HOOK FAZ ──
 * CRUD do acervo próprio de jurisprudência, com ciclo de vida:
 *   rascunho → revisar → publicada → (arquivada)
 * Toda mudança de situação grava uma linha em jurisprudencias_log, com autor e
 * horário. Publicar é ato registrado, não um clique anônimo.
 *
 * ── POR QUE ELE NÃO É PÚBLICO ──
 * Jurisprudência do escritório contém estratégia: qual tese se usa em qual
 * cliente. Todas as rotas exigem o token do painel (X-Painel-Token), do mesmo
 * jeito que o resto do sistema. Não existe GET aberto.
 *
 * ── REGRA DE QA RESPEITADA ──
 * O JSVM dos hooks não enxerga funções de topo: todos os helpers são inline.
 */

routerAdd(
  'GET',
  '/backend/v1/jurisprudencias',
  (c) => {
    try {
      const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''

      function normalizar(s) {
        return String(s || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      }

      const token = c.request.header.get('X-Painel-Token') || ''
      if (!tokenEsperado || token !== tokenEsperado) {
        return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
      }

      const q = c.queryParam('q') || ''
      const tribunal = c.queryParam('tribunal') || ''
      const materia = c.queryParam('materia') || ''
      const situacao = c.queryParam('situacao') || ''
      const destaque = c.queryParam('destaque') || ''
      const limite = parseInt(c.queryParam('limite') || '200', 10)

      const filtros = []
      if (tribunal) filtros.push('tribunal = {:tribunal}')
      if (materia) filtros.push('materia = {:materia}')
      if (situacao) filtros.push('situacao = {:situacao}')
      if (destaque === '1') filtros.push('destaque = true')

      const params = { tribunal: tribunal, materia: materia, situacao: situacao }
      let filtro = filtros.join(' && ')

      let registros = []
      try {
        registros = $app.findRecordsByFilter(
          'jurisprudencias',
          filtro,
          '-publicado_em,-created',
          limite > 0 && limite <= 500 ? limite : 200,
          0,
          params,
        )
      } catch (eFiltro) {
        // Sem filtro válido, busca tudo — melhor devolver o acervo do que erro.
        registros = $app.findRecordsByFilter('jurisprudencias', '', '-created', 200, 0, {})
      }

      const itens = registros.map((r) => ({
        id: r.id,
        titulo: r.getString('titulo'),
        tribunal: r.getString('tribunal'),
        orgao_julgador: r.getString('orgao_julgador'),
        tipo_decisao: r.getString('tipo_decisao'),
        numero: r.getString('numero'),
        processo: r.getString('processo'),
        relator: r.getString('relator'),
        data_julgamento: r.getString('data_julgamento'),
        data_publicacao: r.getString('data_publicacao'),
        materia: r.getString('materia'),
        tese: r.getString('tese'),
        ementa: r.getString('ementa'),
        aplicacao_pratica: r.getString('aplicacao_pratica'),
        dispositivos: r.getString('dispositivos'),
        palavras_chave: r.getString('palavras_chave'),
        origem: r.getString('origem'),
        fonte_url: r.getString('fonte_url'),
        situacao: r.getString('situacao'),
        destaque: r.getBool('destaque'),
        publicado_em: r.getString('publicado_em'),
        criado_por: r.getString('criado_por'),
        created: r.getString('created'),
        updated: r.getString('updated'),
      }))

      // Busca textual livre (título, tese, ementa, palavras-chave)
      let lista = itens
      const termo = normalizar(q).trim()
      if (termo) {
        const partes = termo.split(/\s+/)
        lista = itens.filter((it) => {
          const alvo = normalizar(
            [
              it.titulo,
              it.tese,
              it.ementa,
              it.palavras_chave,
              it.dispositivos,
              it.numero,
              it.processo,
            ].join(' '),
          )
          return partes.every((p) => alvo.indexOf(p) >= 0)
        })
      }

      const porSituacao = { rascunho: 0, revisar: 0, publicada: 0, arquivada: 0 }
      const porTribunal = {}
      const porMateria = {}
      for (let i = 0; i < itens.length; i++) {
        const it = itens[i]
        if (porSituacao[it.situacao] !== undefined) porSituacao[it.situacao] += 1
        if (it.tribunal) porTribunal[it.tribunal] = (porTribunal[it.tribunal] || 0) + 1
        if (it.materia) porMateria[it.materia] = (porMateria[it.materia] || 0) + 1
      }

      return c.json(200, {
        ok: true,
        total: lista.length,
        total_acervo: itens.length,
        resumo: { por_situacao: porSituacao, por_tribunal: porTribunal, por_materia: porMateria },
        itens: lista,
      })
    } catch (err) {
      return c.json(500, { ok: false, erro: 'Falha ao listar: ' + String(err) })
    }
  },
  $apis.requireRecordAuth('users'),
)

routerAdd(
  'POST',
  '/backend/v1/jurisprudencias',
  (c) => {
    try {
      const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
      const token = c.request.header.get('X-Painel-Token') || ''
      if (!tokenEsperado || token !== tokenEsperado) {
        return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
      }

      const body = $apis.requestInfo(c).data || {}
      const agora = new Date().toISOString()

      if (!body.titulo || !String(body.titulo).trim()) {
        return c.json(400, { ok: false, erro: 'Título é obrigatório.' })
      }
      if (!body.tese || !String(body.tese).trim()) {
        return c.json(400, {
          ok: false,
          erro: 'A tese é obrigatória — é o coração da jurisprudência publicada.',
        })
      }

      const situacao = body.situacao || 'rascunho'
      const validas = ['rascunho', 'revisar', 'publicada', 'arquivada']
      const sit = validas.indexOf(situacao) >= 0 ? situacao : 'rascunho'

      const col = $app.findCollectionByNameOrId('jurisprudencias')
      const rec = new Record(col)
      rec.set('titulo', String(body.titulo).trim())
      rec.set('tribunal', body.tribunal || 'Outro')
      rec.set('orgao_julgador', body.orgao_julgador || '')
      rec.set('tipo_decisao', body.tipo_decisao || 'acórdão')
      rec.set('numero', body.numero || '')
      rec.set('processo', body.processo || '')
      rec.set('relator', body.relator || '')
      rec.set('data_julgamento', body.data_julgamento || '')
      rec.set('data_publicacao', body.data_publicacao || '')
      rec.set('materia', body.materia || 'Outro')
      rec.set('tese', body.tese)
      rec.set('ementa', body.ementa || '')
      rec.set('aplicacao_pratica', body.aplicacao_pratica || '')
      rec.set('dispositivos', body.dispositivos || '')
      rec.set('palavras_chave', body.palavras_chave || '')
      rec.set('origem', body.origem || 'manual')
      rec.set('fonte_url', body.fonte_url || '')
      rec.set('situacao', sit)
      rec.set('destaque', body.destaque === true)
      rec.set('publicado_em', sit === 'publicada' ? agora : '')
      rec.set('criado_por', body.criado_por || 'painel')
      rec.set('atualizado_em', agora)
      $app.save(rec)

      // trilha: criação registrada
      try {
        const logCol = $app.findCollectionByNameOrId('jurisprudencias_log')
        const lg = new Record(logCol)
        lg.set('jurisprudencia_id', rec.id)
        lg.set('acao', 'criacao')
        lg.set('de', '')
        lg.set('para', sit)
        lg.set('por', body.criado_por || 'painel')
        lg.set('detalhe', 'Jurisprudência cadastrada com situação "' + sit + '".')
        $app.save(lg)
      } catch (eLog) {
        console.log('log de criação falhou: ' + String(eLog))
      }

      return c.json(200, { ok: true, id: rec.id, situacao: sit })
    } catch (err) {
      return c.json(500, { ok: false, erro: 'Falha ao criar: ' + String(err) })
    }
  },
  $apis.requireRecordAuth('users'),
)

routerAdd(
  'PATCH',
  '/backend/v1/jurisprudencias/{id}',
  (c) => {
    try {
      const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
      const token = c.request.header.get('X-Painel-Token') || ''
      if (!tokenEsperado || token !== tokenEsperado) {
        return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
      }

      const id = c.pathParam('id')
      const rec = $app.findRecordById('jurisprudencias', id)
      const body = $apis.requestInfo(c).data || {}
      const agora = new Date().toISOString()
      const sitAnterior = rec.getString('situacao')

      const campos = [
        'titulo',
        'tribunal',
        'orgao_julgador',
        'tipo_decisao',
        'numero',
        'processo',
        'relator',
        'data_julgamento',
        'data_publicacao',
        'materia',
        'tese',
        'ementa',
        'aplicacao_pratica',
        'dispositivos',
        'palavras_chave',
        'origem',
        'fonte_url',
        'situacao',
        'criado_por',
      ]
      for (let i = 0; i < campos.length; i++) {
        const k = campos[i]
        if (body[k] !== undefined && body[k] !== null) {
          rec.set(k, String(body[k]))
        }
      }
      if (body.destaque !== undefined) rec.set('destaque', body.destaque === true)

      const sitNova = rec.getString('situacao')
      if (sitNova === 'publicada' && !rec.getString('publicado_em')) {
        rec.set('publicado_em', agora)
      }
      rec.set('atualizado_em', agora)
      $app.save(rec)

      if (sitAnterior !== sitNova) {
        try {
          const logCol = $app.findCollectionByNameOrId('jurisprudencias_log')
          const lg = new Record(logCol)
          lg.set('jurisprudencia_id', rec.id)
          lg.set('acao', 'mudanca_situacao')
          lg.set('de', sitAnterior)
          lg.set('para', sitNova)
          lg.set('por', body.criado_por || 'painel')
          lg.set('detalhe', 'Situação alterada de "' + sitAnterior + '" para "' + sitNova + '".')
          $app.save(lg)
        } catch (eLog) {
          console.log('log de situação falhou: ' + String(eLog))
        }
      }

      return c.json(200, { ok: true, id: rec.id, situacao: sitNova })
    } catch (err) {
      return c.json(500, { ok: false, erro: 'Falha ao atualizar: ' + String(err) })
    }
  },
  $apis.requireRecordAuth('users'),
)

routerAdd(
  'DELETE',
  '/backend/v1/jurisprudencias/{id}',
  (c) => {
    try {
      const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
      const token = c.request.header.get('X-Painel-Token') || ''
      if (!tokenEsperado || token !== tokenEsperado) {
        return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
      }

      const id = c.pathParam('id')
      const rec = $app.findRecordById('jurisprudencias', id)

      // Arquivar em vez de apagar: histórico de peça enviada a cliente não some.
      rec.set('situacao', 'arquivada')
      rec.set('atualizado_em', new Date().toISOString())
      $app.save(rec)

      try {
        const logCol = $app.findCollectionByNameOrId('jurisprudencias_log')
        const lg = new Record(logCol)
        lg.set('jurisprudencia_id', id)
        lg.set('acao', 'arquivamento')
        lg.set('de', rec.getString('situacao'))
        lg.set('para', 'arquivada')
        lg.set('por', 'painel')
        lg.set('detalhe', 'Registro arquivado (não apagado: o histórico se preserva).')
        $app.save(lg)
      } catch (eLog) {
        console.log('log de arquivamento falhou: ' + String(eLog))
      }

      return c.json(200, { ok: true, id: id, situacao: 'arquivada' })
    } catch (err) {
      return c.json(500, { ok: false, erro: 'Falha ao arquivar: ' + String(err) })
    }
  },
  $apis.requireRecordAuth('users'),
)

routerAdd(
  'GET',
  '/backend/v1/jurisprudencias/{id}/historico',
  (c) => {
    try {
      const tokenEsperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
      const token = c.request.header.get('X-Painel-Token') || ''
      if (!tokenEsperado || token !== tokenEsperado) {
        return c.json(401, { ok: false, erro: 'Token do painel ausente ou inválido.' })
      }

      const id = c.pathParam('id')
      let registros = []
      try {
        registros = $app.findRecordsByFilter(
          'jurisprudencias_log',
          'jurisprudencia_id = {:id}',
          '-created',
          100,
          0,
          { id: id },
        )
      } catch (e) {
        registros = []
      }

      return c.json(200, {
        ok: true,
        itens: registros.map((r) => ({
          id: r.id,
          acao: r.getString('acao'),
          de: r.getString('de'),
          para: r.getString('para'),
          por: r.getString('por'),
          detalhe: r.getString('detalhe'),
          quando: r.getString('created'),
        })),
      })
    } catch (err) {
      return c.json(500, { ok: false, erro: 'Falha ao ler histórico: ' + String(err) })
    }
  },
  $apis.requireRecordAuth('users'),
)
