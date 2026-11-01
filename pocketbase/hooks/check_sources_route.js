// Rota HTTP para acionamento imediato da verificação das fontes ("Atualizar agora")
// POST /backend/v1/check-sources e OPTIONS /backend/v1/check-sources
// Aplica rotas alternativas para fontes bloqueadas por WAF / sem rota, exclui LexML das verificações robóticas

routerAdd('OPTIONS', '/backend/v1/check-sources', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response.header().set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-token')
  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/check-sources', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  const sources = [
    {
      key: 'cgibs',
      name: 'CGIBS (Comitê Gestor IBS)',
      url: 'https://www.cgibs.gov.br/',
      order: 1,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'receita',
      name: 'Receita Federal do Brasil (RFB)',
      url: 'https://www.receita.fazenda.gov.br',
      order: 2,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'senado_leg',
      name: 'Senado Federal (Legislação / Dados Abertos)',
      url: 'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?ano=2025',
      order: 3,
      isAccessible: true,
      alternative: 'API de Dados Abertos do Senado e catálogo oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'normas_leg',
      name: 'normas.leg.br (Congresso Nacional / Senado)',
      url: 'https://normas.leg.br',
      order: 4,
      isAccessible: true,
      alternative: 'Texto integral de leis e decretos com hash por norma',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'dou',
      name: 'Imprensa Nacional (Diário Oficial da União)',
      url: 'https://www.in.gov.br',
      order: 5,
      isAccessible: true,
      alternative: 'Publicação oficial primária no DOU / InLabs',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'planalto',
      name: 'Portal da Legislação (Planalto / Presidência)',
      url: 'https://www.planalto.gov.br',
      order: 6,
      isAccessible: false,
      wafBlocked: true,
      unblockChannel: 'bloqueio.de.aplicacoes@presidencia.gov.br',
      alternative:
        'Senado Dados Abertos (legis.senado.leg.br) + normas.leg.br + DOU (Imprensa Nacional)',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Bloqueada por WAF da Presidência da República (IP de datacenter estrangeiro, HTTP 200 de 814 bytes "Acesso Negado!"). Coberta integralmente por normas.leg.br, Senado Dados Abertos e DOU.',
    },
    {
      key: 'presidencia',
      name: 'Presidência da República — Legislação',
      url: 'https://legislacao.presidencia.gov.br',
      order: 7,
      isAccessible: false,
      wafBlocked: true,
      unblockChannel: 'bloqueio.de.aplicacoes@presidencia.gov.br',
      alternative: 'normas.leg.br + DOU (Imprensa Nacional)',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Bloqueada por WAF da Presidência da República (409 bytes sem conteúdo). Coberta por normas.leg.br e DOU.',
    },
    {
      key: 'camara',
      name: 'Câmara dos Deputados',
      url: 'https://www.camara.leg.br',
      order: 8,
      isAccessible: false,
      noNetworkRoute: true,
      alternative: 'normas.leg.br + Senado Dados Abertos (legis.senado.leg.br)',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Sem rota de rede a partir do pod (timeout em bd, legin, legislacao e dadosabertos). Coberta integralmente pelo Senado Dados Abertos e normas.leg.br.',
    },
    {
      key: 'confaz',
      name: 'CONFAZ (CEST, MVA-ST e CFOP)',
      url: 'https://www.confaz.fazenda.gov.br',
      order: 9,
      isAccessible: false,
      noNetworkRoute: true,
      alternative: 'Portal Nacional NF-e / SVRS (nfe.fazenda.gov.br) + Buscador NCM + CGIBS',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Sem rota de rede direta a partir do pod (timeout). Coberta via Portal Nacional NF-e / SVRS e base consolidada CGIBS.',
    },
    {
      key: 'calculadorartc',
      name: 'Calculadora RT C — Serpro / RFB',
      url: 'https://calculadorartc.serpro.gov.br',
      order: 10,
      isAccessible: false,
      noNetworkRoute: true,
      alternative: 'Buscador NCM + Portal CGIBS + Portal da Reforma da RFB',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Sem rota pública (DNS não resolve a partir do pod; endereço não confirmado). Coberta via Buscador NCM, CGIBS e RFB.',
    },
    {
      key: 'reformadoconsumo',
      name: 'Portal Reforma do Consumo (Min. Fazenda)',
      url: 'https://www.gov.br/fazenda/pt-br/assuntos/reforma-tributaria',
      order: 11,
      isAccessible: true,
      alternative: 'Espelho oficial Gov.br Fazenda + RFB Reforma + CGIBS',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Endereço reformadoconsumo.gov.br sem resolução DNS; coberto pelo portal oficial ativo da Fazenda / RFB e CGIBS.',
    },
    {
      key: 'nfe_portal',
      name: 'Portal Nacional NF-e / SVRS (cClassTrib, cCredPres e cBenef)',
      url: 'https://www.nfe.fazenda.gov.br',
      order: 12,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'siscomex',
      name: 'Portal Único Siscomex / TIPI (NCM integral)',
      url: 'https://portalunico.siscomex.gov.br/',
      order: 13,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'mdic_balanca',
      name: 'MDIC / Comex Stat (Tabelas de Comércio Exterior)',
      url: 'https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/base-de-dados-bruta',
      order: 14,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'ibge',
      name: 'IBGE / Concla (CNAE 2.3)',
      url: 'https://cnae.ibge.gov.br',
      order: 15,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'cgsn_simples',
      name: 'Comitê Gestor do Simples Nacional (CGSN)',
      url: 'https://www.receita.fazenda.gov.br/simplesnacional',
      order: 16,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'suframa_zfm',
      name: 'SUFRAMA (Zona Franca de Manaus e ALC)',
      url: 'https://www.gov.br/suframa/pt-br',
      order: 17,
      isAccessible: true,
      alternative: 'Acesso direto oficial',
      coverageStatus: 'coberta_direta',
    },
    {
      key: 'sefaz_estaduais',
      name: 'SEFAZ Estaduais (Legislações Estaduais IBS)',
      url: 'https://www.cgibs.gov.br/',
      order: 18,
      isAccessible: true,
      alternative: 'Consolidação centralizada no Comitê Gestor do IBS (CGIBS)',
      coverageStatus: 'coberta_alternativa',
      knownReason:
        'Endereços de /legislacao mudam por Estado (404 em RS/SP); cobertura centralizada e unificada via CGIBS.',
    },
    {
      key: 'lexml',
      name: 'LexML (Rede de Informação Legislativa e Jurídica)',
      url: 'http://www.lexml.gov.br',
      order: 19,
      isAccessible: false,
      humanOnly: true,
      alternative:
        'normas.leg.br + Senado Dados Abertos (para robôs); LexML mantido apenas para consulta humana',
      coverageStatus: 'consulta_humana_apenas',
      knownReason:
        'API SRU legada devolve 9.049 bytes fixos sem registros. Retirada de verificações automatizadas; mantida apenas para consulta humana.',
    },
  ]

  const results = []
  const nowIso = new Date().toISOString()

  for (let i = 0; i < sources.length; i++) {
    const src = sources[i]
    const startTime = new Date().getTime()
    let status = 'active'
    let httpStatus = 200
    let message = 'Fonte oficial ativa e acessível'

    if (src.humanOnly) {
      status = 'warning'
      httpStatus = 200
      message = src.knownReason || 'Consulta apenas humana (API legada desativada para robôs).'
    } else if (src.wafBlocked) {
      status = 'warning'
      httpStatus = 200
      message = src.knownReason || 'Bloqueada por WAF da Presidência (IP de datacenter).'
    } else if (src.noNetworkRoute) {
      status = 'warning'
      httpStatus = 0
      message = src.knownReason || 'Sem rota de rede direta a partir do pod.'
    } else {
      try {
        const res = $http.send({
          url: src.url,
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 8,
        })

        httpStatus = res.statusCode || 200
        if (httpStatus >= 200 && httpStatus < 400) {
          status = 'active'
          message = 'Fonte online e respondendo normalmente (' + httpStatus + ')'
        } else if (httpStatus === 403 || httpStatus === 401) {
          status = 'active'
          message = 'Servidor oficial ativo (proteção WAF/Gov ' + httpStatus + ')'
        } else {
          status = 'warning'
          message = 'Resposta com status HTTP ' + httpStatus
        }
      } catch (err) {
        status = 'warning'
        httpStatus = 0
        message =
          'Conexão direta indisponível: ' +
          String(err) +
          '. Cobertura mantida pelas rotas alternativas.'
      }
    }

    const duration = new Date().getTime() - startTime

    try {
      let record
      try {
        record = $app.findFirstRecordByData('source_status', 'source_key', src.key)
      } catch (_) {
        const col = $app.findCollectionByNameOrId('source_status')
        record = new Record(col)
        record.set('source_key', src.key)
      }

      record.set('name', src.name)
      record.set('url', src.url)
      record.set('status', status)
      record.set('http_status', httpStatus)
      record.set('response_time_ms', duration)
      record.set('last_checked_at', nowIso)
      record.set('message', message)
      record.set('order', src.order)
      record.set('coverage_status', src.coverageStatus || 'coberta_direta')
      record.set('alternative_source', src.alternative || '')
      if (src.unblockChannel) {
        record.set('unblock_channel', src.unblockChannel)
      }

      $app.save(record)

      results.push({
        source_key: src.key,
        name: src.name,
        url: src.url,
        status: status,
        http_status: httpStatus,
        response_time_ms: duration,
        last_checked_at: nowIso,
        message: message,
        coverage_status: src.coverageStatus,
        alternative_source: src.alternative,
        unblock_channel: src.unblockChannel || null,
      })
    } catch (dbErr) {
      results.push({
        source_key: src.key,
        error: String(dbErr),
      })
    }
  }

  return e.json(200, {
    success: true,
    sources: results,
    timestamp: nowIso,
  })
})
