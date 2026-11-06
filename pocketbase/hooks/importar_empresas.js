/**
 * IMPORTAÇÃO DO CADASTRO DE EMPRESAS — em lotes
 * =============================================
 * Pedido do CEO (05/11/2026): "quebre o arquivo em PDF em quantos pedaços forem
 * necessários e ajude o SKIP realizar a tarefa mais rápido".
 *
 * ── POR QUE UMA ROTA, E NÃO UM `seed` NA MIGRATION ──
 * Migration com 943 registros embutidos no código é frágil: passa de 1 MB, cada
 * correção de dado exige migration nova (e migration aplicada não se edita) e,
 * se falhar no meio, o Rollback apaga tudo sem dizer onde parou. A rota recebe
 * um LOTE, grava e devolve o que fez: se um lote falhar, os outros nove
 * continuam válidos e basta reenviar aquele.
 *
 * ── A CHAVE DE DEDUPLICAÇÃO ──
 * `codigo` é o código do contribuinte no sistema contábil, único por construção
 * (a coleção tem índice único). Reenviar o mesmo lote ATUALIZA em vez de
 * duplicar — importação repetível é o que permite corrigir sem medo.
 *
 * ── O QUE ESTA ROTA NÃO FAZ ──
 * Não inventa campo. Se o PDF não trouxe o dado (159 registros sem CNAE, 471
 * sem capital social — pessoas físicas em maioria), o campo fica vazio.
 *
 * ── DUAS ARMADILHAS DO JSVM QUE CUSTARAM RODADAS ──
 * 1. Callback roda em pool de VM separado: função declarada no topo do arquivo
 *    NÃO existe dentro do handler (ReferenceError). Todo helper vai INLINE.
 * 2. `e.bindBody()` não existe: o corpo lê-se em `$apis.requestInfo(e).data`
 *    para JSON, ou de `e.request.postFormValue()`/body cru. Sem isso a rota
 *    recebe o lote inteiro e responde "nenhum item no corpo".
 */

/* ══════════════════════════════════════════════════════════════════════════
 * POST /backend/v1/importar-empresas-lote
 * Corpo: { itens: [...], lote: "lote_01_0001-0100.json" }
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/importar-empresas-lote', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  /* ── corpo: três caminhos, o primeiro que funcionar ── */
  let corpo = {}
  try {
    const info = $apis.requestInfo(e)
    if (info && info.data && typeof info.data === 'object') corpo = info.data
  } catch (err) {
    corpo = {}
  }

  if (!corpo || !Array.isArray(corpo.itens)) {
    try {
      const bruto = toString(e.request.body)
      if (bruto) {
        const parsed = JSON.parse(bruto)
        if (parsed && Array.isArray(parsed.itens)) corpo = parsed
      }
    } catch (err) {
      /* segue com o que tiver */
    }
  }

  /* Também aceita form-encoded: itens=<json> */
  if (!corpo || !Array.isArray(corpo.itens)) {
    try {
      const txt = e.request.postFormValue('itens')
      if (txt) {
        const parsed = JSON.parse(txt)
        if (Array.isArray(parsed)) corpo = { itens: parsed, lote: e.request.postFormValue('lote') }
      }
    } catch (err) {
      /* segue */
    }
  }

  const itens = Array.isArray(corpo.itens) ? corpo.itens : []

  if (!itens.length) {
    let amostra = ''
    try {
      amostra = toString(e.request.body).slice(0, 200)
    } catch (err) {
      amostra = '(corpo ilegível)'
    }
    return e.json(400, {
      ok: false,
      erro: 'nenhum item no corpo',
      dica: 'envie JSON {"itens":[...]} com Content-Type: application/json',
      recebido: amostra,
    })
  }
  if (itens.length > 200) {
    return e.json(400, { ok: false, erro: 'lote acima de 200 registros' })
  }

  const app = $app
  let novos = 0
  let atualizados = 0
  const erros = []

  for (let i = 0; i < itens.length; i++) {
    const b = itens[i] || {}

    const soDigitos = (v) => String(v || '').replace(/\D/g, '')
    const limpar = (v) =>
      String(v || '')
        .replace(/\s+/g, ' ')
        .trim()
    const cnaeDivisao = (c) => {
      const d = soDigitos(c)
      return d.length >= 2 ? d.slice(0, 2) : ''
    }

    const codigo = Number(b.codigo)
    if (!codigo || !Number.isFinite(codigo)) {
      erros.push({ codigo: null, motivo: 'código ausente' })
      continue
    }

    /* Só campos que existem na coleção: campo a mais faz o PocketBase recusar
       o registro inteiro e o lote perderia os 100 por um detalhe. */
    const dados = {
      codigo: codigo,
      tipo_documento: limpar(b.tipo_documento),
      numero_documento: limpar(b.numero_documento),
      documento_limpo: soDigitos(b.documento_limpo || b.numero_documento),
      razao_social: limpar(b.razao_social) || 'SEM RAZÃO SOCIAL',
      apelido: limpar(b.apelido),
      data_inscricao: limpar(b.data_inscricao),
      inscricao_estadual: limpar(b.inscricao_estadual),
      inscricao_suframa: limpar(b.inscricao_suframa),
      pagina: Number(b.pagina) || 0,
      nome: limpar(b.nome),
      nome_fantasia: limpar(b.nome_fantasia),
      natureza_juridica: limpar(b.natureza_juridica),
      cnae: limpar(b.cnae),
      cnae_divisao: cnaeDivisao(b.cnae),
      ramo_atividade: limpar(b.ramo_atividade),
      inicio_atividades: limpar(b.inicio_atividades),
      cliente_desde: limpar(b.cliente_desde),
      situacao: limpar(b.situacao),
      tipo_endereco: limpar(b.tipo_endereco),
      endereco: limpar(b.endereco),
      numero_endereco: limpar(b.numero),
      bairro: limpar(b.bairro),
      complemento: limpar(b.complemento),
      municipio: limpar(b.municipio),
      uf: limpar(b.uf).slice(0, 2).toUpperCase(),
      cep: soDigitos(b.cep),
      pais: limpar(b.pais),
      telefone: limpar(b.telefone),
      fax: limpar(b.fax),
      email: limpar(b.email),
      pagina_internet: limpar(b.pagina_internet),
      inscricao_municipal: limpar(b.inscricao_municipal),
      inscricao_junta_comercial: limpar(b.inscricao_junta_comercial),
      capital_social: limpar(b.capital_social),
      contador: limpar(b.contador),
      responsavel_legal: limpar(b.responsavel_legal),
      foro_comarca: limpar(b.foro_comarca),
      duracao_contrato: limpar(b.duracao_contrato),
    }

    let existente = null
    try {
      existente = app.findFirstRecordByFilter('cadastro_empresas', 'codigo = {:c}', { c: codigo })
    } catch (err) {
      existente = null
    }

    try {
      if (existente) {
        existente.set(dados)
        app.save(existente)
        atualizados++
      } else {
        const col = app.findCollectionByNameOrId('cadastro_empresas')
        const rec = new Record(col)
        rec.set(dados)
        app.save(rec)
        novos++
      }
    } catch (err) {
      const msg = String(err && err.message ? err.message : err).slice(0, 200)
      erros.push({ codigo: codigo, motivo: msg })
    }
  }

  let total = -1
  try {
    total = app.countRecords('cadastro_empresas')
  } catch (err) {
    total = -1
  }

  return e.json(200, {
    ok: true,
    lote: corpo.lote || '',
    recebidos: itens.length,
    novos: novos,
    atualizados: atualizados,
    erros: erros.slice(0, 20),
    total_erros: erros.length,
    total_na_colecao: total,
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * GET /backend/v1/importar-empresas-status — quanto já entrou, e coberto
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('GET', '/backend/v1/importar-empresas-status', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  const app = $app
  let total = 0
  let comCnae = 0
  let ativas = 0
  let comDocumento = 0

  try {
    const todos = app.findAllRecords('cadastro_empresas')
    total = todos.length
    for (let i = 0; i < todos.length; i++) {
      const r = todos[i]
      if (String(r.get('cnae') || '').trim()) comCnae++
      if (String(r.get('situacao') || '') === 'Ativa') ativas++
      if (String(r.get('documento_limpo') || '').trim()) comDocumento++
    }
  } catch (err) {
    return e.json(500, { ok: false, erro: String(err).slice(0, 300) })
  }

  return e.json(200, {
    ok: true,
    total: total,
    com_cnae: comCnae,
    com_documento: comDocumento,
    ativas: ativas,
  })
})
