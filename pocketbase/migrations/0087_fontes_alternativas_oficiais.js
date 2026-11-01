// Migration 0087: Atualiza schema e fontes em source_status com rotas alternativas oficiais
// e status detalhados para órgãos bloqueados/sem rota, retirando LexML de robôs

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('source_status')

    // Adiciona campos para fonte alternativa e canal de desbloqueio, se ainda não existirem
    if (!col.fields.getByName('alternative_source')) {
      col.fields.add(new TextField({ name: 'alternative_source', required: false }))
    }
    if (!col.fields.getByName('coverage_status')) {
      col.fields.add(new TextField({ name: 'coverage_status', required: false }))
    }
    if (!col.fields.getByName('unblock_channel')) {
      col.fields.add(new TextField({ name: 'unblock_channel', required: false }))
    }
    app.save(col)

    // Lista canônica de fontes com status oficiais, alternativas e justificativas
    const fontesAtualizadas = [
      {
        source_key: 'cgibs',
        name: 'CGIBS (Comitê Gestor IBS)',
        url: 'https://www.cgibs.gov.br/',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Fonte oficial ativa e acessível diretamente',
        order: 1,
      },
      {
        source_key: 'receita',
        name: 'Receita Federal do Brasil (RFB)',
        url: 'https://www.receita.fazenda.gov.br',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Portal oficial da RFB online',
        order: 2,
      },
      {
        source_key: 'senado_leg',
        name: 'Senado Federal (Legislação / Dados Abertos)',
        url: 'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?ano=2025',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source:
          'API de Dados Abertos do Senado (legis.senado.leg.br/dadosabertos) e normas.leg.br',
        message: 'Catálogo oficial de Leis Complementares e Emendas ativas',
        order: 3,
      },
      {
        source_key: 'normas_leg',
        name: 'normas.leg.br (Congresso Nacional / Senado)',
        url: 'https://normas.leg.br',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial (texto integral com URN LexML)',
        message: 'Fonte online e fornecendo texto integral de leis e decretos com hash',
        order: 4,
      },
      {
        source_key: 'dou',
        name: 'Imprensa Nacional (Diário Oficial da União)',
        url: 'https://www.in.gov.br',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Publicação oficial primária no DOU / InLabs',
        message: 'Diário Oficial da União online para novos atos normativos',
        order: 5,
      },
      {
        source_key: 'planalto',
        name: 'Portal da Legislação (Planalto / Presidência)',
        url: 'https://www.planalto.gov.br',
        status: 'warning',
        coverage_status: 'coberta_alternativa',
        alternative_source:
          'Senado Dados Abertos (legis.senado.leg.br) + normas.leg.br + DOU (Imprensa Nacional)',
        unblock_channel: 'bloqueio.de.aplicacoes@presidencia.gov.br',
        message:
          'Bloqueada por WAF da Presidência (IP de datacenter, HTTP 200 com 814B "Acesso Negado"). Coberta integralmente por normas.leg.br, Senado Dados Abertos e DOU.',
        order: 6,
      },
      {
        source_key: 'presidencia',
        name: 'Presidência da República — Legislação',
        url: 'https://legislacao.presidencia.gov.br',
        status: 'warning',
        coverage_status: 'coberta_alternativa',
        alternative_source: 'normas.leg.br + DOU (Imprensa Nacional)',
        unblock_channel: 'bloqueio.de.aplicacoes@presidencia.gov.br',
        message:
          'Bloqueada por WAF da Presidência (409 bytes sem conteúdo). Coberta por normas.leg.br e DOU.',
        order: 7,
      },
      {
        source_key: 'camara',
        name: 'Câmara dos Deputados',
        url: 'https://www.camara.leg.br',
        status: 'warning',
        coverage_status: 'coberta_alternativa',
        alternative_source: 'normas.leg.br + Senado Dados Abertos (legis.senado.leg.br)',
        message:
          'Sem rota de rede a partir do pod (timeout em bd, legin, legislacao e dadosabertos). Coberta pelo Senado Dados Abertos e normas.leg.br.',
        order: 8,
      },
      {
        source_key: 'confaz',
        name: 'CONFAZ (CEST, MVA-ST e CFOP)',
        url: 'https://www.confaz.fazenda.gov.br',
        status: 'warning',
        coverage_status: 'coberta_alternativa',
        alternative_source:
          'Portal Nacional NF-e / SVRS (nfe.fazenda.gov.br) + Buscador NCM + CGIBS',
        message:
          'Sem rota de rede direta a partir do pod (timeout). Coberta via Portal Nacional NF-e / SVRS e base consolidada CGIBS.',
        order: 9,
      },
      {
        source_key: 'calculadorartc',
        name: 'Calculadora RT C — Serpro / RFB',
        url: 'https://calculadorartc.serpro.gov.br',
        status: 'warning',
        coverage_status: 'coberta_alternativa',
        alternative_source: 'Buscador NCM + Portal CGIBS + Portal da Reforma da RFB',
        message:
          'Sem rota pública (DNS não resolve do pod; endereço não confirmado). Coberta via Buscador NCM, CGIBS e RFB.',
        order: 10,
      },
      {
        source_key: 'reformadoconsumo',
        name: 'Portal Reforma do Consumo (Min. Fazenda)',
        url: 'https://www.gov.br/fazenda/pt-br/assuntos/reforma-tributaria',
        status: 'active',
        coverage_status: 'coberta_alternativa',
        alternative_source:
          'Espelho oficial Gov.br Fazenda (gov.br/fazenda/pt-br/assuntos/reforma-tributaria) + RFB Reforma + CGIBS',
        message:
          'Domínio reformadoconsumo.gov.br sem DNS; coberto pelo portal oficial ativo da Fazenda / RFB e CGIBS.',
        order: 11,
      },
      {
        source_key: 'nfe_portal',
        name: 'Portal Nacional NF-e / SVRS (cClassTrib, cCredPres e cBenef)',
        url: 'https://www.nfe.fazenda.gov.br',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Fonte online e respondendo normalmente',
        order: 12,
      },
      {
        source_key: 'siscomex',
        name: 'Portal Único Siscomex / TIPI (NCM integral)',
        url: 'https://portalunico.siscomex.gov.br/',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Fonte online e respondendo normalmente',
        order: 13,
      },
      {
        source_key: 'mdic_balanca',
        name: 'MDIC / Comex Stat (Tabelas de Comércio Exterior)',
        url: 'https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/base-de-dados-bruta',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Fonte online e respondendo normalmente',
        order: 14,
      },
      {
        source_key: 'ibge',
        name: 'IBGE / Concla (CNAE 2.3)',
        url: 'https://cnae.ibge.gov.br',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Servidor oficial ativo (proteção WAF/Gov 403)',
        order: 15,
      },
      {
        source_key: 'cgsn_simples',
        name: 'Comitê Gestor do Simples Nacional (CGSN)',
        url: 'https://www.receita.fazenda.gov.br/simplesnacional',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Fonte online e respondendo normalmente',
        order: 16,
      },
      {
        source_key: 'suframa_zfm',
        name: 'SUFRAMA (Zona Franca de Manaus e ALC)',
        url: 'https://www.gov.br/suframa/pt-br',
        status: 'active',
        coverage_status: 'coberta_direta',
        alternative_source: 'Acesso direto oficial',
        message: 'Fonte online e respondendo normalmente',
        order: 17,
      },
      {
        source_key: 'sefaz_estaduais',
        name: 'SEFAZ Estaduais (Legislações Estaduais IBS)',
        url: 'https://www.cgibs.gov.br/',
        status: 'active',
        coverage_status: 'coberta_alternativa',
        alternative_source: 'Consolidação centralizada no Comitê Gestor do IBS (CGIBS)',
        message:
          'Endereços de /legislacao mudam por Estado (404 em RS/SP); cobertura centralizada e unificada via CGIBS.',
        order: 18,
      },
      {
        source_key: 'lexml',
        name: 'LexML (Rede de Informação Legislativa e Jurídica)',
        url: 'http://www.lexml.gov.br',
        status: 'warning',
        coverage_status: 'consulta_humana_apenas',
        alternative_source:
          'normas.leg.br + Senado Dados Abertos (para robôs); LexML mantido apenas para consulta humana',
        message:
          'API SRU legada devolve 9.049 bytes fixos sem registros. Retirada de verificações automatizadas; mantida apenas para consulta humana.',
        order: 19,
      },
    ]

    const nowIso = new Date().toISOString()

    for (let i = 0; i < fontesAtualizadas.length; i++) {
      const item = fontesAtualizadas[i]
      let rec
      try {
        rec = app.findFirstRecordByData('source_status', 'source_key', item.source_key)
      } catch (_) {
        rec = new Record(col)
        rec.set('source_key', item.source_key)
      }

      rec.set('name', item.name)
      rec.set('url', item.url)
      rec.set('status', item.status)
      rec.set('coverage_status', item.coverage_status)
      rec.set('alternative_source', item.alternative_source)
      if (item.unblock_channel) {
        rec.set('unblock_channel', item.unblock_channel)
      }
      rec.set('message', item.message)
      rec.set('order', item.order)
      rec.set('last_checked_at', nowIso)

      app.save(rec)
    }
  },
  (app) => {
    // rollback opcional
  },
)
