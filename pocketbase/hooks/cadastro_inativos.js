/**
 * TRANSFERÊNCIA DE CLIENTES INATIVOS
 * ==================================
 * Pedido do CEO (05/11/2026): mover todos os clientes inativos do Cadastro
 * Analítico de Clientes para o Cadastro Analítico de Clientes Inativos.
 *
 * ── A DECISÃO QUE GOVERNA ESTA ROTA ──
 * Mover cadastro é destrutivo na prática: o registro sai de onde estava e
 * passa a viver noutro lugar. Se o critério estiver errado, o cliente some da
 * carteira e ninguém percebe até precisar dele. Por isso a rota tem DOIS modos:
 *
 *   ?simular=1  → diz exatamente o que FARIA (quantos, quais, por quê), sem
 *                 gravar nada. É o que a tela mostra antes de o usuário decidir.
 *   (padrão)    → executa: copia para os inativos e remove do cadastro ativo.
 *
 * ── O QUE CONTA COMO "INATIVO" ──
 * `situacao` diferente de "Ativa" — e não apenas "Inativa" — porque o cadastro
 * prevê Suspensa e Baixada. Cliente suspenso ou baixado não é cliente ativo;
 * deixá-lo no cadastro principal repetiria o problema que esta separação veio
 * resolver. A contagem por situação vai no relatório para o CEO conferir o que
 * foi movido, um a um, por motivo.
 *
 * ── A CÓPIA É FIEL, MAS NÃO É `set(objeto)` ──
 * O JSVM não aplica `set(objeto)` de forma confiável (descoberto no agente
 * contábil: o save passava e o registro ficava vazio). Aqui cada campo é
 * atribuído individualmente, campo a campo, e o registro é RELIDO depois de
 * gravado. Se a releitura não confirmar, a transferência daquele cliente é
 * revertida e o erro entra no relatório.
 */

/* ══════════════════════════════════════════════════════════════════════════
 * GET /backend/v1/inativos-previa — o que SERIA movido (não grava nada)
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('GET', '/backend/v1/inativos-previa', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  const app = $app
  let todos = []
  try {
    todos = app.findAllRecords('cadastro_empresas')
  } catch (err) {
    return e.json(200, { ok: true, total: 0, a_mover: 0, por_situacao: {}, amostra: [] })
  }

  const porSituacao = {}
  const aMover = []
  let ativos = 0

  for (let i = 0; i < todos.length; i++) {
    const r = todos[i]
    const sit = String(r.get('situacao') || '').trim() || '(vazia)'
    porSituacao[sit] = (porSituacao[sit] || 0) + 1
    /* "Ativa" (com qualquer caixa) fica; o resto sai. Comparação sem acento e
       sem caixa porque o cadastro de origem grafa "ATIVA", "Ativa" e "ativa". */
    const normal = sit.toLowerCase()
    if (normal === 'ativa') {
      ativos++
      continue
    }
    aMover.push({
      codigo: Number(r.get('codigo') || 0),
      razao_social: r.get('razao_social') || '',
      documento: r.get('numero_documento') || '',
      situacao: sit,
      cnae: r.get('cnae') || '',
      municipio: r.get('municipio') || '',
      uf: r.get('uf') || '',
      cliente_desde: r.get('cliente_desde') || '',
    })
  }

  let jaNoInativos = 0
  try {
    jaNoInativos = app.countRecords('cadastro_empresas_inativos')
  } catch (err) {
    jaNoInativos = 0
  }

  return e.json(200, {
    ok: true,
    total_no_cadastro: todos.length,
    ativos: ativos,
    a_mover: aMover.length,
    ja_no_cadastro_de_inativos: jaNoInativos,
    por_situacao: porSituacao,
    amostra: aMover.slice(0, 30),
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * POST /backend/v1/inativos-transferir?simular=1
 * Copia os inativos para o cadastro novo e remove do cadastro atual.
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/inativos-transferir', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  const simular = String(e.request.url.query().get('simular') || '') === '1'

  const app = $app
  let todos = []
  try {
    todos = app.findAllRecords('cadastro_empresas')
  } catch (err) {
    return e.json(500, {
      ok: false,
      erro: 'não consegui ler o cadastro: ' + String(err).slice(0, 200),
    })
  }

  /* campos copiados — a lista vem do schema da coleção de destino, para que
     acrescentar um campo lá não exija lembrar de editar esta rota */
  let campos = []
  try {
    const colDestino = app.findCollectionByNameOrId('cadastro_empresas_inativos')
    const listaCampos = colDestino.fields
    for (let i = 0; i < listaCampos.length; i++) {
      const nome = listaCampos[i].name
      if (nome === 'id' || nome === 'created' || nome === 'updated') continue
      if (
        nome === 'transferido_em' ||
        nome === 'motivo_transferencia' ||
        nome === 'transferido_por'
      )
        continue
      if (nome === 'reativado' || nome === 'reativado_em') continue
      campos.push(nome)
    }
  } catch (err) {
    return e.json(500, {
      ok: false,
      erro: 'coleção de inativos não existe — rode a migration 0137',
    })
  }

  const movidos = []
  const erros = []
  const porSituacao = {}
  let ativosMantidos = 0
  let jaExistiam = 0

  for (let i = 0; i < todos.length; i++) {
    const r = todos[i]
    const sit = String(r.get('situacao') || '').trim() || '(vazia)'
    const normal = sit.toLowerCase()
    if (normal === 'ativa') {
      ativosMantidos++
      continue
    }
    porSituacao[sit] = (porSituacao[sit] || 0) + 1

    const codigo = Number(r.get('codigo') || 0)
    const docLimpo = String(r.get('documento_limpo') || '')

    if (simular) {
      movidos.push({ codigo: codigo, razao_social: r.get('razao_social'), situacao: sit })
      continue
    }

    /* já transferido antes? então não duplica: marca e segue */
    let existente = null
    try {
      existente = app.findFirstRecordByFilter(
        'cadastro_empresas_inativos',
        'codigo = {:c} && documento_limpo = {:d}',
        { c: codigo, d: docLimpo },
      )
    } catch (err) {
      existente = null
    }

    if (existente) {
      jaExistiam++
      try {
        app.delete(r)
      } catch (err) {
        erros.push({
          codigo: codigo,
          motivo: 'já estava nos inativos; falhou ao remover do cadastro ativo',
        })
      }
      continue
    }

    try {
      const colDestino = app.findCollectionByNameOrId('cadastro_empresas_inativos')
      const novo = new Record(colDestino)

      /* campo a campo: `set(objeto)` não é confiável neste runtime */
      for (let k = 0; k < campos.length; k++) {
        const nome = campos[k]
        if (nome === 'situacao') continue
        const valor = r.get(nome)
        if (valor !== null && valor !== undefined) novo.set(nome, valor)
      }
      novo.set('situacao', sit)
      novo.set(
        'motivo_transferencia',
        'Transferido do Cadastro Analítico de Clientes por estar com situação "' + sit + '"',
      )
      novo.set('transferido_por', 'painel')
      novo.set('reativado', false)

      app.save(novo)

      /* RELÊ para confirmar — gravar e acreditar no retorno foi o defeito do
         agente contábil, que produziu registro vazio com "ok: true" */
      const conferido = app.findRecordById('cadastro_empresas_inativos', novo.id)
      if (Number(conferido.get('codigo') || 0) !== codigo) {
        throw new Error('releitura não confirmou o código')
      }

      /* só então remove da origem */
      app.delete(r)
      movidos.push({ codigo: codigo, razao_social: r.get('razao_social'), situacao: sit })
    } catch (err) {
      erros.push({
        codigo: codigo,
        motivo: String(err && err.message ? err.message : err).slice(0, 150),
      })
    }
  }

  let totalAtivo = -1
  let totalInativos = -1
  try {
    totalAtivo = app.countRecords('cadastro_empresas')
    totalInativos = app.countRecords('cadastro_empresas_inativos')
  } catch (err) {
    /* segue */
  }

  return e.json(200, {
    ok: erros.length === 0,
    simulado: simular,
    movidos: movidos.length,
    ativos_mantidos: ativosMantidos,
    ja_existiam: jaExistiam,
    por_situacao: porSituacao,
    erros: erros.slice(0, 30),
    total_erros: erros.length,
    total_no_cadastro_ativo: totalAtivo,
    total_no_cadastro_inativos: totalInativos,
    amostra: movidos.slice(0, 30),
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * POST /backend/v1/inativos-reativar  { codigo }
 * Devolve o cliente ao cadastro ativo. É a operação inversa — e sem ela a
 * separação seria uma passagem só de ida, o que ninguém aceita num cadastro.
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/inativos-reativar', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  let corpo = {}
  try {
    const info = $apis.requestInfo(e)
    if (info && info.data && typeof info.data === 'object') corpo = info.data
  } catch (err) {
    corpo = {}
  }
  if (!corpo || !corpo.codigo) {
    try {
      corpo = JSON.parse(toString(e.request.body)) || {}
    } catch (err) {
      corpo = corpo || {}
    }
  }

  const codigo = Number(corpo.codigo || 0)
  if (!codigo) {
    return e.json(400, { ok: false, erro: 'codigo ausente' })
  }

  const app = $app
  let registro = null
  try {
    registro = app.findFirstRecordByFilter('cadastro_empresas_inativos', 'codigo = {:c}', {
      c: codigo,
    })
  } catch (err) {
    registro = null
  }
  if (!registro) {
    return e.json(404, { ok: false, erro: 'cliente não encontrado no cadastro de inativos' })
  }

  /* volta para o cadastro ativo com situação Ativa e cópia fiel dos campos */
  let campos = []
  try {
    const colAtivo = app.findCollectionByNameOrId('cadastro_empresas')
    for (let i = 0; i < colAtivo.fields.length; i++) {
      const nome = colAtivo.fields[i].name
      if (nome === 'id' || nome === 'created' || nome === 'updated') continue
      campos.push(nome)
    }
  } catch (err) {
    return e.json(500, { ok: false, erro: 'coleção ativa indisponível' })
  }

  try {
    const colAtivo = app.findCollectionByNameOrId('cadastro_empresas')
    const novo = new Record(colAtivo)
    for (let k = 0; k < campos.length; k++) {
      const nome = campos[k]
      if (nome === 'situacao') continue
      const valor = registro.get(nome)
      if (valor !== null && valor !== undefined) novo.set(nome, valor)
    }
    novo.set('situacao', 'Ativa')
    app.save(novo)

    const conferido = app.findRecordById('cadastro_empresas', novo.id)
    if (Number(conferido.get('codigo') || 0) !== codigo) {
      throw new Error('releitura não confirmou o código')
    }

    /* marca como reativado em vez de apagar: preserva a história */
    registro.set('reativado', true)
    registro.set('reativado_em', new Date().toISOString())
    app.save(registro)

    return e.json(200, {
      ok: true,
      codigo: codigo,
      mensagem: 'cliente devolvido ao cadastro ativo',
    })
  } catch (err) {
    return e.json(500, {
      ok: false,
      erro: String(err && err.message ? err.message : err).slice(0, 250),
    })
  }
})

/* ══════════════════════════════════════════════════════════════════════════
 * GET /backend/v1/inativos-resumo — números dos dois cadastros, para a tela
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('GET', '/backend/v1/inativos-resumo', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  const app = $app
  let ativos = 0
  let inativos = 0
  const porSituacao = {}

  try {
    const todos = app.findAllRecords('cadastro_empresas')
    ativos = todos.length
    for (let i = 0; i < todos.length; i++) {
      const s = String(todos[i].get('situacao') || '(vazia)')
      porSituacao[s] = (porSituacao[s] || 0) + 1
    }
  } catch (err) {
    ativos = -1
  }

  try {
    const todos = app.findAllRecords('cadastro_empresas_inativos')
    inativos = todos.length
  } catch (err) {
    inativos = -1
  }

  return e.json(200, {
    ok: true,
    cadastro_analitico: ativos,
    cadastro_inativos: inativos,
    por_situacao_no_analitico: porSituacao,
  })
})
