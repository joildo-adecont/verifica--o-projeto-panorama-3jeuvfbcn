/**
 * INATIVAÇÃO INDIVIDUAL DE CLIENTE — TECLA ATIVO/INATIVO POR LINHA
 * ================================================================
 * Pedido do CEO: "no Cadastro de clientes inserir tecla individual para cada
 * cliente de Ativo e Inativo, quando inativar levar para cadastro de inativos
 * para facilitar a busca dos mesmos".
 *
 * É a operação inversa da reativação (/backend/v1/inativos-reativar) e segue o
 * MESMO contrato de segurança e de escrita:
 *   · autentica pelo X-Painel-Token (SIMUL_PAINEL_TOKEN), como as demais rotas;
 *   · copia CAMPO A CAMPO (o JSVM não aplica `set(objeto)` de forma confiável);
 *   · RELÊ o registro gravado para confirmar antes de remover da origem — o
 *     defeito do agente contábil produziu registro vazio com "ok: true";
 *   · só apaga do cadastro ativo depois que a cópia está confirmada, então
 *     nenhum cliente se perde no meio da operação.
 *
 * Se o cliente já existir nos inativos (ex.: reação de um caso antigo), não
 * duplica: apenas remove o registro do cadastro ativo.
 */

routerAdd('POST', '/backend/v1/inativos-inativar', (e) => {
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

  const codigo = Number(corpo.codigo || 0)
  if (!codigo) {
    return e.json(400, { ok: false, erro: 'codigo ausente' })
  }
  const motivo = String(corpo.motivo || '').slice(0, 300)

  const app = $app

  /* localiza no cadastro ativo */
  let registro = null
  try {
    registro = app.findFirstRecordByFilter('cadastro_empresas', 'codigo = {:c}', { c: codigo })
  } catch (err) {
    registro = null
  }
  if (!registro) {
    return e.json(404, {
      ok: false,
      erro: 'cliente não encontrado no cadastro ativo (talvez já esteja inativado)',
    })
  }

  const docLimpo = String(registro.get('documento_limpo') || '')
  const razaoSocial = String(registro.get('razao_social') || '')

  /* já estava nos inativos? então só tira do ativo — nunca duplicar */
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
    try {
      app.delete(registro)
    } catch (err) {
      return e.json(500, {
        ok: false,
        erro: 'cliente já constava nos inativos e não pôde ser removido do cadastro ativo',
      })
    }
    return e.json(200, {
      ok: true,
      codigo: codigo,
      mensagem: 'cliente já constava nos inativos; removido do cadastro ativo',
    })
  }

  /* campos copiados derivados do schema de destino, como na transferência */
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
      erro: 'coleção de inativos indisponível — rode a migration 0137',
    })
  }

  try {
    const colDestino = app.findCollectionByNameOrId('cadastro_empresas_inativos')
    const novo = new Record(colDestino)

    for (let k = 0; k < campos.length; k++) {
      const nome = campos[k]
      if (nome === 'situacao') continue
      const valor = registro.get(nome)
      if (valor !== null && valor !== undefined) novo.set(nome, valor)
    }

    const sit = String(registro.get('situacao') || '').trim() || 'Inativa'
    novo.set('situacao', sit)
    novo.set(
      'motivo_transferencia',
      motivo || 'Inativado pelo botão Ativo/Inativo do Cadastro Analítico de Clientes',
    )
    novo.set('transferido_em', new Date().toISOString())
    novo.set('transferido_por', 'painel')
    novo.set('reativado', false)

    app.save(novo)

    /* RELÊ para confirmar antes de apagar da origem */
    const conferido = app.findRecordById('cadastro_empresas_inativos', novo.id)
    if (Number(conferido.get('codigo') || 0) !== codigo) {
      throw new Error('releitura não confirmou o código')
    }

    app.delete(registro)

    let totalAtivo = -1
    let totalInativos = -1
    try {
      totalAtivo = app.countRecords('cadastro_empresas')
      totalInativos = app.countRecords('cadastro_empresas_inativos')
    } catch (err) {
      /* segue: contagem é informativa */
    }

    return e.json(200, {
      ok: true,
      codigo: codigo,
      razao_social: razaoSocial,
      situacao: sit,
      total_no_cadastro_ativo: totalAtivo,
      total_no_cadastro_inativos: totalInativos,
      mensagem: 'cliente inativado e movido para o Cadastro Analítico de Clientes Inativos',
    })
  } catch (err) {
    return e.json(500, {
      ok: false,
      erro: String(err && err.message ? err.message : err).slice(0, 250),
    })
  }
})
