/**
 * IMPORTAÇÃO DO CADASTRO DE EMPRESAS — em lotes
 * =============================================
 * Pedido do CEO (05/11/2026): "quebre o arquivo em PDF em quantos pedaços forem
 * necessários e ajude o SKIP realizar a tarefa mais rápido".
 *
 * ── POR QUE UMA ROTA, E NÃO UM `seed` NA MIGRATION ──
 * Uma migration com 943 registros embutidos no código é frágil de três formas:
 *   1. o arquivo de migration passa de 1 MB e o build fica lento;
 *   2. cada correção de dado exige uma migration nova — e migration aplicada
 *      não se edita;
 *   3. se a importação falhar no meio, o Rollback apaga tudo e não se sabe
 *      onde parou.
 * A rota recebe um LOTE (100 registros), grava, e devolve o que fez. Se um lote
 * falhar, os outros nove continuam válidos e basta reenviar aquele.
 *
 * ── A CHAVE DE DEDUPLICAÇÃO ──
 * `codigo` é o código do contribuinte no sistema contábil e é único por
 * construção (a coleção já tem índice único). O upsert procura por código:
 * reenviar o mesmo lote ATUALIZA em vez de duplicar. Isso torna a importação
 * repetível — e repetível é o que permite corrigir sem medo.
 *
 * ── O QUE ESTA ROTA NÃO FAZ ──
 * Não inventa campo. Se o PDF não trouxe o dado (há 159 registros sem CNAE e
 * 471 sem capital social — pessoas físicas em sua maioria), o campo fica vazio.
 * Preencher por dedução seria criar cadastro que a fonte não sustenta.
 */

/* ── helpers INLINE (o JSVM não enxerga função top-level) ── */

function soDigitos(v) {
  return String(v || '').replace(/\D/g, '')
}

function limpar(v) {
  return String(v || '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Extrai o número do código CNAE (4 primeiros dígitos) para o cruzamento. */
function cnaeDivisao(cnae) {
  const d = soDigitos(cnae)
  return d.length >= 2 ? d.slice(0, 2) : ''
}

function tokenOk(e, app) {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  return Boolean(esperado) && recebido === esperado
}

function jsonResposta(e, status, corpo) {
  return e.json(status, corpo)
}

/** Grava ou atualiza UM registro. Devolve 'novo', 'atualizado' ou 'erro'. */
function gravarUm(app, bruto) {
  const codigo = Number(bruto.codigo)
  if (!codigo || !Number.isFinite(codigo)) {
    return { resultado: 'erro', motivo: 'código ausente' }
  }

  /* Os campos gravados são SÓ os que existem na coleção. Acrescentar campo
     aqui sem a migration correspondente faz o PocketBase recusar o registro
     inteiro — e o lote perderia os 100 por causa de um campo a mais. */
  const dados = {
    codigo: codigo,
    tipo_documento: limpar(bruto.tipo_documento),
    numero_documento: limpar(bruto.numero_documento),
    documento_limpo: soDigitos(bruto.documento_limpo || bruto.numero_documento),
    razao_social: limpar(bruto.razao_social) || 'SEM RAZÃO SOCIAL',
    apelido: limpar(bruto.apelido),
    data_inscricao: limpar(bruto.data_inscricao),
    inscricao_estadual: limpar(bruto.inscricao_estadual),
    inscricao_suframa: limpar(bruto.inscricao_suframa),
    pagina: Number(bruto.pagina) || 0,
    /* campos novos (migration 0134) */
    nome: limpar(bruto.nome),
    nome_fantasia: limpar(bruto.nome_fantasia),
    natureza_juridica: limpar(bruto.natureza_juridica),
    cnae: limpar(bruto.cnae),
    cnae_divisao: cnaeDivisao(bruto.cnae),
    ramo_atividade: limpar(bruto.ramo_atividade),
    inicio_atividades: limpar(bruto.inicio_atividades),
    cliente_desde: limpar(bruto.cliente_desde),
    situacao: limpar(bruto.situacao),
    tipo_endereco: limpar(bruto.tipo_endereco),
    endereco: limpar(bruto.endereco),
    numero_endereco: limpar(bruto.numero),
    bairro: limpar(bruto.bairro),
    complemento: limpar(bruto.complemento),
    municipio: limpar(bruto.municipio),
    uf: limpar(bruto.uf).slice(0, 2).toUpperCase(),
    cep: soDigitos(bruto.cep),
    pais: limpar(bruto.pais),
    telefone: limpar(bruto.telefone),
    fax: limpar(bruto.fax),
    email: limpar(bruto.email),
    pagina_internet: limpar(bruto.pagina_internet),
    inscricao_municipal: limpar(bruto.inscricao_municipal),
    inscricao_junta_comercial: limpar(bruto.inscricao_junta_comercial),
    capital_social: limpar(bruto.capital_social),
    contador: limpar(bruto.contador),
    responsavel_legal: limpar(bruto.responsavel_legal),
    foro_comarca: limpar(bruto.foro_comarca),
    duracao_contrato: limpar(bruto.duracao_contrato),
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
      return { resultado: 'atualizado', codigo: codigo }
    }
    const col = app.findCollectionByNameOrId('cadastro_empresas')
    const rec = new Record(col)
    rec.set(dados)
    app.save(rec)
    return { resultado: 'novo', codigo: codigo }
  } catch (err) {
    return {
      resultado: 'erro',
      codigo: codigo,
      motivo: String(err && err.message ? err.message : err).slice(0, 200),
    }
  }
}

/* ── ROTAS ── */

/**
 * POST /backend/v1/importar-empresas-lote
 * Corpo: { itens: [...], lote: "lote_01_0001-0100.json", total_lotes: 10 }
 * Devolve o balanço do lote e o total atual na coleção.
 */
routerAdd(
  'POST',
  '/backend/v1/importar-empresas-lote',
  (e) => {
    if (!tokenOk(e, null)) {
      return jsonResposta(e, 401, { ok: false, erro: 'token inválido' })
    }

    let corpo = {}
    try {
      corpo = e.bindBody ? e.bindBody() : $apis.requestInfo(e).data
    } catch (err) {
      corpo = {}
    }

    const itens = Array.isArray(corpo.itens) ? corpo.itens : []
    if (!itens.length) {
      return jsonResposta(e, 400, { ok: false, erro: 'nenhum item no corpo' })
    }
    if (itens.length > 200) {
      return jsonResposta(e, 400, { ok: false, erro: 'lote acima de 200 registros' })
    }

    const app = $app
    let novos = 0
    let atualizados = 0
    const erros = []

    for (let i = 0; i < itens.length; i++) {
      const r = gravarUm(app, itens[i])
      if (r.resultado === 'novo') novos++
      else if (r.resultado === 'atualizado') atualizados++
      else erros.push({ codigo: r.codigo || null, motivo: r.motivo })
    }

    let total = 0
    try {
      total = app.countRecords('cadastro_empresas')
    } catch (err) {
      total = -1
    }

    return jsonResposta(e, 200, {
      ok: true,
      lote: corpo.lote || '',
      recebidos: itens.length,
      novos: novos,
      atualizados: atualizados,
      erros: erros.slice(0, 20),
      total_erros: erros.length,
      total_na_colecao: total,
    })
  },
  $apis.requireRecordAuth ? undefined : undefined,
)

/** GET /backend/v1/importar-empresas-status — quanto já entrou. */
routerAdd('GET', '/backend/v1/importar-empresas-status', (e) => {
  if (!tokenOk(e, null)) {
    return jsonResposta(e, 401, { ok: false, erro: 'token inválido' })
  }
  const app = $app
  let total = 0
  let comCnae = 0
  let ativas = 0
  try {
    total = app.countRecords('cadastro_empresas')
    comCnae = app.countRecords('cadastro_empresas', $dbx.exp('cnae != ""'))
    ativas = app.countRecords('cadastro_empresas', $dbx.exp('situacao = "Ativa"'))
  } catch (err) {
    /* conta por varredura se a expressão não for suportada */
    try {
      const todos = app.findAllRecords('cadastro_empresas')
      total = todos.length
      for (const r of todos) {
        if (String(r.get('cnae') || '').trim()) comCnae++
        if (String(r.get('situacao') || '') === 'Ativa') ativas++
      }
    } catch (err2) {
      return jsonResposta(e, 500, { ok: false, erro: String(err2).slice(0, 200) })
    }
  }
  return jsonResposta(e, 200, { ok: true, total: total, com_cnae: comCnae, ativas: ativas })
})
