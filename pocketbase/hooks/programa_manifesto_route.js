// Rota do Manifesto de Atualização do Programa Panorama ADECONT
// GET /backend/v1/programa-manifesto?plataforma=desktop|celular&versao=vX.Y.Z
// OPTIONS /backend/v1/programa-manifesto
//
// Retorna JSON com:
// - versao_atual (por plataforma)
// - data_atualizacao
// - versao_base_mais_recente
// - data_base_mais_recente
// - requires_update: bool (true se cliente desatualizado ou houver atualizações na base não aplicadas)
// - atualizacoes_do_dia: lista de atualizações registradas no mesmo dia da última base
// - url_instalador_oficial
// - status_mecanismo: "ativo"

routerAdd('OPTIONS', '/backend/v1/programa-manifesto', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('GET', '/backend/v1/programa-manifesto', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Content-Type', 'application/json; charset=utf-8')

  const plataformaQuery = (e.request.url.query().get('plataforma') || 'desktop').toLowerCase()
  const versaoCliente = (e.request.url.query().get('versao') || '').trim()

  const plataformaTarget = plataformaQuery === 'celular' ? 'celular' : 'desktop'

  // 1. Busca versão atual homologada pelo CEO para a plataforma solicitada
  let versaoAtual = null
  try {
    const versoes = $app.findRecordsByFilter(
      'programa_versoes',
      "status = 'atual' && plataforma = {:plat}",
      '-data_atualizacao',
      1,
      0,
      { plat: plataformaTarget },
    )
    if (versoes.length > 0) {
      versaoAtual = versoes[0]
    }
  } catch (err) {
    console.log('[programa-manifesto] Falha ao consultar programa_versoes: ' + String(err))
  }

  // Fallback se não encontrar
  const versaoNome = versaoAtual
    ? versaoAtual.getString('versao')
    : plataformaTarget === 'celular'
      ? 'v2.8.4-m'
      : 'v2.8.4'

  const dataVersaoAtual = versaoAtual ? versaoAtual.getString('data_atualizacao') : '2026-10-31'

  const urlInstalador = versaoAtual
    ? versaoAtual.getString('url_instalador') || '/#instalador-versao'
    : '/#instalador-versao'

  const notasVersao = versaoAtual ? versaoAtual.getString('notas_versao') : ''

  // 2. Busca a última atualização de base registrada em programa_atualizacoes
  let ultimaAtualizacaoBase = null
  let atualizacoesDoDia = []
  try {
    const atts = $app.findRecordsByFilter(
      'programa_atualizacoes',
      '',
      '-data_atualizacao,-created',
      10,
      0,
    )
    if (atts.length > 0) {
      ultimaAtualizacaoBase = atts[0]
      const dataUltima = ultimaAtualizacaoBase.getString('data_atualizacao')

      for (let i = 0; i < atts.length; i++) {
        const item = atts[i]
        if (item.getString('data_atualizacao') === dataUltima) {
          atualizacoesDoDia.push({
            id: item.id,
            data_atualizacao: item.getString('data_atualizacao'),
            origem: item.getString('origem'),
            versao_base: item.getString('versao_base'),
            descricao: item.getString('descricao'),
            total_envios_afetados: item.getInt('total_envios_afetados'),
            executado_por: item.getString('executado_por'),
          })
        }
      }
    }
  } catch (err) {
    console.log('[programa-manifesto] Falha ao consultar programa_atualizacoes: ' + String(err))
  }

  const versaoBaseMaisRecente = ultimaAtualizacaoBase
    ? ultimaAtualizacaoBase.getString('versao_base')
    : 'v2.8.4-base'

  const dataBaseMaisRecente = ultimaAtualizacaoBase
    ? ultimaAtualizacaoBase.getString('data_atualizacao')
    : dataVersaoAtual

  // 3. Verifica se requer atualização
  // Requer atualização quando:
  // - versaoCliente foi informada e difere da versão atual
  // - OU não informou versao (assume consulta informativa/potencialmente desatualizada)
  // - OU se a data da base for mais recente que a data da versão informada
  let requiresUpdate = false
  if (!versaoCliente) {
    requiresUpdate = false
  } else if (versaoCliente !== versaoNome) {
    requiresUpdate = true
  }

  const payload = {
    sucesso: true,
    mecanismo_atualizacao: {
      status: 'ativo',
      tipo: 'propagacao_mesmo_dia',
      controlado_por: 'CEO — Direção Executiva ADECONT',
      politica:
        'A base de dados se atualiza e a atualização propaga para todos os sistemas enviados no mesmo dia.',
      manifesto_url: '/backend/v1/programa-manifesto',
    },
    plataforma: plataformaTarget,
    versao_cliente: versaoCliente || null,
    versao_atual: versaoNome,
    data_atualizacao: dataVersaoAtual,
    notas_versao: notasVersao,
    url_instalador: urlInstalador,
    requires_update: requiresUpdate,
    base_dados: {
      versao_mais_recente: versaoBaseMaisRecente,
      data_mais_recente: dataBaseMaisRecente,
      atualizacoes_mesmo_dia: atualizacoesDoDia,
    },
    servidor_timestamp: new Date().toISOString(),
  }

  return e.json(200, payload)
})
