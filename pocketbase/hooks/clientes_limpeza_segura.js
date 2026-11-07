/**
 * ROTAS DE BACKEND PARA LIMPEZA SEGURA E ARQUIVAMENTO DE CLIENTES
 * ===============================================================
 * Operações:
 * 1. GET  /backend/v1/clientes-limpeza-resumo   -> Retorna diagnóstico atual (duplicatas, arquivados, inválidos)
 * 2. POST /backend/v1/clientes-limpeza-executar -> Executa ou simula dedup agrupada por doc+atividade com reapontamento de vínculos
 * 3. POST /backend/v1/clientes-reverter-arquivamento -> Reverte arquivamento de um cliente específico ({ id } ou { codigo })
 *
 * NOTA JSVM: Todas as funções auxiliares são declaradas inline dentro do callback
 * para evitar ReferenceError em runtime pools isolados.
 */

/* ══════════════════════════════════════════════════════════════════════════
 * GET /backend/v1/clientes-limpeza-resumo
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('GET', '/backend/v1/clientes-limpeza-resumo', (e) => {
  function normalizarAtividade(r) {
    const cnae = String(r.get('cnae') || '')
      .replace(/\D/g, '')
      .trim()
    if (cnae.length >= 4) return 'CNAE:' + cnae

    const ramo = String(r.get('ramo_atividade') || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (ramo.length > 5) return 'RAMO:' + ramo.slice(0, 40)

    const cnaeDiv = String(r.get('cnae_divisao') || '')
      .replace(/\D/g, '')
      .trim()
    if (cnaeDiv) return 'DIV:' + cnaeDiv

    return 'GERAL'
  }

  const app = $app
  let todos = []
  try {
    todos = app.findAllRecords('cadastro_empresas')
  } catch (err) {
    return e.json(500, { ok: false, erro: 'falha ao ler cadastro_empresas: ' + String(err) })
  }

  let arquivados = 0
  let ativos = 0
  let invalidosOuVazios = 0
  const grupos = {}

  for (let i = 0; i < todos.length; i++) {
    const r = todos[i]
    const isArq = Boolean(r.get('arquivado'))
    if (isArq) {
      arquivados++
    } else {
      ativos++
    }

    const docLimpo = String(r.get('documento_limpo') || '')
      .replace(/\D/g, '')
      .trim()
    const isValido = docLimpo.length === 11 || docLimpo.length === 14 || docLimpo.length === 12
    if (!docLimpo || !isValido) {
      invalidosOuVazios++
      continue
    }

    const ativ = normalizarAtividade(r)
    const chave = docLimpo + '|||' + ativ
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push({
      id: r.id,
      codigo: Number(r.get('codigo') || 0),
      razao_social: r.get('razao_social'),
      documento: r.get('numero_documento'),
      arquivado: isArq,
      substituido_por_codigo: r.get('substituido_por_codigo'),
    })
  }

  let gruposComDuplicatas = 0
  let duplicatasPotenciais = 0
  const amostraDuplicatas = []

  const chaves = Object.keys(grupos)
  for (let c = 0; c < chaves.length; c++) {
    const lista = grupos[chaves[c]]
    if (lista.length > 1) {
      gruposComDuplicatas++
      duplicatasPotenciais += lista.length - 1
      if (amostraDuplicatas.length < 15) {
        amostraDuplicatas.push({
          chave: chaves[c],
          registros: lista,
        })
      }
    }
  }

  return e.json(200, {
    ok: true,
    total_registros: todos.length,
    ativos,
    arquivados,
    invalidos_ou_vazios: invalidosOuVazios,
    grupos_duplicados: gruposComDuplicatas,
    duplicatas_potenciais: duplicatasPotenciais,
    amostra_duplicatas: amostraDuplicatas,
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * POST /backend/v1/clientes-limpeza-executar
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/clientes-limpeza-executar', (e) => {
  function normalizarAtividade(r) {
    const cnae = String(r.get('cnae') || '')
      .replace(/\D/g, '')
      .trim()
    if (cnae.length >= 4) return 'CNAE:' + cnae

    const ramo = String(r.get('ramo_atividade') || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (ramo.length > 5) return 'RAMO:' + ramo.slice(0, 40)

    const cnaeDiv = String(r.get('cnae_divisao') || '')
      .replace(/\D/g, '')
      .trim()
    if (cnaeDiv) return 'DIV:' + cnaeDiv

    return 'GERAL'
  }

  function calcularScore(r) {
    let score = 0
    const campos = [
      'razao_social',
      'nome_fantasia',
      'apelido',
      'cnae',
      'cnae_divisao',
      'ramo_atividade',
      'natureza_juridica',
      'inscricao_estadual',
      'inscricao_municipal',
      'inscricao_junta_comercial',
      'capital_social',
      'email',
      'telefone',
      'endereco',
      'bairro',
      'municipio',
      'uf',
      'cep',
      'responsavel_legal',
      'contador',
      'regime_tributario',
      'enquadramento_tributario',
    ]
    for (let k = 0; k < campos.length; k++) {
      const v = r.get(campos[k])
      if (v !== null && v !== undefined && String(v).trim().length > 0) {
        score++
      }
    }
    return score
  }

  const simular = String(e.request.url.query().get('simular') || '') === '1'

  const app = $app
  let registros = []
  try {
    registros = app.findAllRecords('cadastro_empresas')
  } catch (err) {
    return e.json(500, { ok: false, erro: 'falha ao ler cadastro_empresas: ' + String(err) })
  }

  const grupos = {}
  for (let i = 0; i < registros.length; i++) {
    const r = registros[i]
    const docLimpo = String(r.get('documento_limpo') || '')
      .replace(/\D/g, '')
      .trim()
    if (!docLimpo || (docLimpo.length !== 11 && docLimpo.length !== 12 && docLimpo.length !== 14)) {
      continue
    }

    const ativ = normalizarAtividade(r)
    const chave = docLimpo + '|||' + ativ
    if (!grupos[chave]) grupos[chave] = []
    grupos[chave].push(r)
  }

  let totalArquivados = 0
  let totalReapontamentos = 0
  const alterados = []

  const chaves = Object.keys(grupos)
  for (let c = 0; c < chaves.length; c++) {
    const lista = grupos[chaves[c]]
    if (lista.length <= 1) continue

    lista.sort((a, b) => {
      const arqA = Boolean(a.get('arquivado')) ? 1 : 0
      const arqB = Boolean(b.get('arquivado')) ? 1 : 0
      if (arqA !== arqB) return arqA - arqB

      const scoreA = calcularScore(a)
      const scoreB = calcularScore(b)
      if (scoreA !== scoreB) return scoreB - scoreA

      const codA = Number(a.get('codigo') || 999999)
      const codB = Number(b.get('codigo') || 999999)
      return codA - codB
    })

    const principal = lista[0]
    const principalId = principal.id
    const principalCodigo = Number(principal.get('codigo') || 0)

    if (!simular && Boolean(principal.get('arquivado'))) {
      principal.set('arquivado', false)
      principal.set('substituido_por_id', '')
      principal.set('substituido_por_codigo', null)
      app.save(principal)
    }

    for (let g = 1; g < lista.length; g++) {
      const gemeo = lista[g]
      const gemeoId = gemeo.id
      const gemeoCodigo = Number(gemeo.get('codigo') || 0)

      const jaArquivado = Boolean(gemeo.get('arquivado'))
      const mesmoSubst = String(gemeo.get('substituido_por_id') || '') === principalId

      if (!simular && (!jaArquivado || !mesmoSubst)) {
        gemeo.set('arquivado', true)
        gemeo.set('arquivado_em', new Date().toISOString())
        gemeo.set('arquivado_por', 'limpeza_segura_hook')
        gemeo.set(
          'motivo_arquivamento',
          'Duplicata real de cadastro (mesmo documento e atividade). Mantido código ' +
            principalCodigo,
        )
        gemeo.set('substituido_por_id', principalId)
        gemeo.set('substituido_por_codigo', principalCodigo)
        app.save(gemeo)
      }

      totalArquivados++
      alterados.push({
        gemeo_id: gemeoId,
        gemeo_codigo: gemeoCodigo,
        gemeo_razao: gemeo.get('razao_social'),
        mantido_id: principalId,
        mantido_codigo: principalCodigo,
        mantido_razao: principal.get('razao_social'),
      })

      if (!simular) {
        // Reaponta vínculos
        try {
          const nfesGemeo = app.findRecordsByFilter(
            'nfes',
            'cliente_id = {:gid}',
            '-created',
            1000,
            0,
            { gid: gemeoId },
          )
          for (let n = 0; n < nfesGemeo.length; n++) {
            nfesGemeo[n].set('cliente_id', principalId)
            app.save(nfesGemeo[n])
            totalReapontamentos++
          }
        } catch (_) {}

        try {
          const lotesGemeo = app.findRecordsByFilter(
            'nfes_lote',
            'cliente_id = {:gid}',
            '-created',
            500,
            0,
            { gid: gemeoId },
          )
          for (let l = 0; l < lotesGemeo.length; l++) {
            lotesGemeo[l].set('cliente_id', principalId)
            app.save(lotesGemeo[l])
            totalReapontamentos++
          }
        } catch (_) {}

        try {
          const regGemeo = app.findRecordsByFilter(
            'regime_historico',
            'empresa_id = {:gid}',
            '-created',
            500,
            0,
            { gid: gemeoId },
          )
          for (let r = 0; r < regGemeo.length; r++) {
            regGemeo[r].set('empresa_id', principalId)
            regGemeo[r].set('empresa_codigo', principalCodigo)
            app.save(regGemeo[r])
            totalReapontamentos++
          }
        } catch (_) {}
      }
    }
  }

  return e.json(200, {
    ok: true,
    simulado: simular,
    total_arquivados: totalArquivados,
    total_reapontamentos: totalReapontamentos,
    alterados: alterados.slice(0, 50),
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * POST /backend/v1/clientes-reverter-arquivamento
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/clientes-reverter-arquivamento', (e) => {
  let corpo = {}
  try {
    const info = e.requestInfo()
    if (info && info.body && typeof info.body === 'object') {
      corpo = info.body
    }
  } catch (_) {}

  if (!corpo || (!corpo.id && !corpo.codigo)) {
    try {
      corpo = JSON.parse(toString(e.request.body)) || {}
    } catch (_) {}
  }

  const id = String(corpo.id || '').trim()
  const codigo = Number(corpo.codigo || 0)

  if (!id && !codigo) {
    return e.json(400, { ok: false, erro: 'Informe o "id" ou "codigo" do cliente a reverter' })
  }

  const app = $app
  let registro = null
  try {
    if (id) {
      registro = app.findRecordById('cadastro_empresas', id)
    } else if (codigo) {
      registro = app.findFirstRecordByFilter('cadastro_empresas', 'codigo = {:c}', { c: codigo })
    }
  } catch (err) {
    return e.json(404, { ok: false, erro: 'Cliente não localizado: ' + String(err) })
  }

  if (!registro) {
    return e.json(404, { ok: false, erro: 'Registro não encontrado' })
  }

  try {
    registro.set('arquivado', false)
    registro.set('arquivado_em', '')
    registro.set('arquivado_por', '')
    registro.set('motivo_arquivamento', '')
    registro.set('substituido_por_id', '')
    registro.set('substituido_por_codigo', null)
    app.save(registro)

    return e.json(200, {
      ok: true,
      id: registro.id,
      codigo: Number(registro.get('codigo') || 0),
      razao_social: registro.get('razao_social'),
      mensagem: 'Arquivamento revertido com sucesso. Cliente voltou à listagem ativa.',
    })
  } catch (errSave) {
    return e.json(500, { ok: false, erro: 'Falha ao reverter arquivamento: ' + String(errSave) })
  }
})
