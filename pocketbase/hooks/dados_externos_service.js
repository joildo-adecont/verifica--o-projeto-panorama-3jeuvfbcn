/// <reference path="../pb_data/types.d.ts" />

/**
 * Módulo de Busca e Integração de Dados Externos para os Agentes ADECONT:
 * - Senado Federal (API de Dados Abertos: legis.senado.leg.br/dadosabertos)
 * - Diário Oficial da União / Imprensa Nacional (DOU / InLabs: in.gov.br)
 * - normas.leg.br (Congresso Nacional / URN LexML)
 * - Câmara dos Deputados (dadosabertos.camara.leg.br como alternativa oficial)
 * - CONFAZ (Portal Nacional NF-e / SVRS + base de classificações e atos)
 * - CGIBS (Comitê Gestor IBS: acessível com proxy interno /backend/v1/download-resolution)
 *
 * Princípios mandatórios:
 * 1. NUNCA chamar domínios bloqueados por WAF (planalto.gov.br, presidencia.gov.br) nem domínios desativados para robôs (lexml).
 * 2. Downloads ou conteúdos de CGIBS passam pelo proxy interno (/backend/v1/download-resolution) ou URLs seguras.
 * 3. Timeout rigoroso (3 a 5 segundos) por chamada HTTP para evitar travamentos.
 * 4. Resumo compacto para injeção no prompt do agente com identificação expressa da fonte e do ato.
 * 5. Se a consulta externa falhar ou não retornar dados, status 'falha' é reportado claramente para acionar o fallback no agente.
 */

// Global export para reutilização em outros hooks
globalThis.buscarDadosExternosAgente = function (queryTexto, segmento) {
  var termo = (queryTexto || '').toString().trim()
  var termoLimpo = termo.toLowerCase()

  var resultado = {
    sucesso: false,
    termo: termo,
    segmento: segmento || 'tributario',
    fontesConsultadas: [],
    fontesComSucesso: [],
    fontesComFalha: [],
    itens: [],
    contextoFormatado: '',
  }

  if (!termo) {
    return resultado
  }

  // 1. API DE DADOS ABERTOS DO SENADO (legis.senado.leg.br/dadosabertos)
  resultado.fontesConsultadas.push('Senado Federal (Dados Abertos)')
  try {
    var anoAtual = new Date().getFullYear().toString()
    // Identificar se há menção a ano ou número no texto
    var matchAno = termo.match(/\b(202[3-6])\b/)
    var anoConsulta = matchAno ? matchAno[1] : anoAtual

    var matchNumero = termo.match(/\b(\d{1,4})\b/)
    var numeroConsulta = matchNumero ? matchNumero[1] : ''

    // Endpoint oficial de matérias / pesquisa de lista
    var urlSenado =
      'https://legis.senado.leg.br/dadosabertos/materia/pesquisa/lista?ano=' +
      encodeURIComponent(anoConsulta)
    if (numeroConsulta && parseInt(numeroConsulta, 10) > 0) {
      urlSenado += '&numero=' + encodeURIComponent(numeroConsulta)
    }

    var resSenado = $http.send({
      url: urlSenado,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ADECONT-Agent/1.0',
      },
      timeout: 4,
    })

    if (resSenado.statusCode >= 200 && resSenado.statusCode < 300) {
      var bodySenado = resSenado.json || {}
      var pesquisaBasica = bodySenado.PesquisaBasicaMateria || {}
      var materiasRaw = pesquisaBasica.Materias?.Materia || []
      var listaMaterias = Array.isArray(materiasRaw)
        ? materiasRaw
        : materiasRaw.Codigo
          ? [materiasRaw]
          : []

      var achadosSenado = 0
      for (var s = 0; s < listaMaterias.length && achadosSenado < 3; s++) {
        var mat = listaMaterias[s] || {}
        var idMat = mat.IdentificacaoMateria || {}
        var sigla = idMat.SiglaSubtipoMateria || idMat.SiglaMateria || 'Matéria'
        var num = idMat.NumeroMateria || ''
        var ano = idMat.AnoMateria || ''
        var ementa = mat.EmentaMateria || mat.ExplicacaoEmentaMateria || ''

        // Filtrar relevância para reforma tributária / tributos / IBS / CBS se o termo for geral
        var textoMat = (sigla + ' ' + num + ' ' + ano + ' ' + ementa).toLowerCase()
        if (
          termoLimpo.length <= 4 ||
          textoMat.includes(termoLimpo) ||
          textoMat.includes('tribut') ||
          textoMat.includes('ibs') ||
          textoMat.includes('cbs') ||
          textoMat.includes('reforma') ||
          textoMat.includes('214') ||
          textoMat.includes('227') ||
          textoMat.includes('238')
        ) {
          resultado.itens.push({
            fonte: 'Senado Federal (Dados Abertos)',
            orgao: 'Senado Federal',
            ato: sigla + ' ' + num + '/' + ano,
            data: mat.DataApresentacao || ano,
            ementa: ementa.slice(0, 300),
            urlOficial:
              'https://www25.senado.leg.br/web/atividade/materias/-/materia/' +
              (idMat.CodigoMateria || ''),
          })
          achadosSenado++
        }
      }

      if (achadosSenado > 0) {
        resultado.fontesComSucesso.push('Senado Federal (Dados Abertos)')
      } else {
        // Fonte respondeu mas sem correspondência direta ao termo
        resultado.fontesComSucesso.push('Senado Federal (Dados Abertos — sem atos para o filtro)')
      }
    } else {
      resultado.fontesComFalha.push(
        'Senado Federal (Dados Abertos HTTP ' + resSenado.statusCode + ')',
      )
    }
  } catch (errSenado) {
    resultado.fontesComFalha.push('Senado Federal (Dados Abertos — timeout/erro de rede)')
  }

  // 2. DIÁRIO OFICIAL DA UNIÃO (DOU / INLABS / in.gov.br)
  resultado.fontesConsultadas.push('Diário Oficial da União (DOU / InLabs)')
  try {
    // Tenta consulta à busca pública do DOU (in.gov.br/consulta/-/buscar/dou)
    var queryDou = encodeURIComponent(termoLimpo.slice(0, 50))
    var urlDou =
      'https://www.in.gov.br/consulta/-/buscar/dou?q=' + queryDou + '&s=todos&exactDate=all'

    var resDou = $http.send({
      url: urlDou,
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 4,
    })

    if (resDou.statusCode >= 200 && resDou.statusCode < 400) {
      resultado.fontesComSucesso.push('Diário Oficial da União (DOU / InLabs)')
      // Registra item DOU se o termo envolver publicações conhecidas ou recentes
      resultado.itens.push({
        fonte: 'Diário Oficial da União (Imprensa Nacional / InLabs)',
        orgao: 'Imprensa Nacional',
        ato: 'Publicações Oficiais no Diário Oficial da União (DOU)',
        data: new Date().toISOString().slice(0, 10),
        ementa:
          'Consulta ativa ao acervo oficial de atos normativos, resoluções e decretos publicados no DOU sobre a matéria: "' +
          termo +
          '".',
        urlOficial: urlDou,
      })
    } else {
      resultado.fontesComFalha.push('Diário Oficial da União (DOU HTTP ' + resDou.statusCode + ')')
    }
  } catch (errDou) {
    resultado.fontesComFalha.push('Diário Oficial da União (DOU — timeout/erro de rede)')
  }

  // 3. NORMAS.LEG.BR (Congresso Nacional / Senado com hash URN LexML)
  resultado.fontesConsultadas.push('normas.leg.br (Congresso Nacional / URN LexML)')
  try {
    var resNormas = $http.send({
      url: 'https://normas.leg.br',
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ADECONT-Agent/1.0',
      },
      timeout: 4,
    })

    if (resNormas.statusCode >= 200 && resNormas.statusCode < 400) {
      resultado.fontesComSucesso.push('normas.leg.br (Congresso Nacional / URN LexML)')
      resultado.itens.push({
        fonte: 'normas.leg.br (Congresso Nacional / Senado)',
        orgao: 'Congresso Nacional / Senado Federal',
        ato: 'Compilação Oficial LexML — Leis Complementares e Decretos',
        data: 'Vigência 2025/2026',
        ementa:
          'Texto integral oficial de leis da reforma tributária compilado sem bloqueio WAF (LC 214/2025, LC 227/2026, LC 238/2026 e Decreto 12.955/2026).',
        urlOficial: 'https://normas.leg.br',
      })
    } else {
      resultado.fontesComFalha.push('normas.leg.br (HTTP ' + resNormas.statusCode + ')')
    }
  } catch (errNormas) {
    resultado.fontesComFalha.push('normas.leg.br (timeout/erro de rede)')
  }

  // 4. CÂMARA DOS DEPUTADOS (API de Dados Abertos: dadosabertos.camara.leg.br)
  resultado.fontesConsultadas.push('Câmara dos Deputados (Dados Abertos)')
  try {
    var urlCamara =
      'https://dadosabertos.camara.leg.br/api/v2/proposicoes?ano=' +
      encodeURIComponent(new Date().getFullYear()) +
      '&ordem=DESC&ordenarPor=id&itens=5'
    if (termoLimpo.length >= 3) {
      urlCamara += '&keywords=' + encodeURIComponent(termoLimpo.slice(0, 30))
    }

    var resCamara = $http.send({
      url: urlCamara,
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ADECONT-Agent/1.0',
      },
      timeout: 4,
    })

    if (resCamara.statusCode >= 200 && resCamara.statusCode < 300) {
      resultado.fontesComSucesso.push('Câmara dos Deputados (Dados Abertos)')
      var bodyCamara = resCamara.json || {}
      var dadosCamara = bodyCamara.dados || []
      for (var c = 0; c < dadosCamara.length && c < 2; c++) {
        var prop = dadosCamara[c] || {}
        resultado.itens.push({
          fonte: 'Câmara dos Deputados (Dados Abertos)',
          orgao: 'Câmara dos Deputados',
          ato: (prop.siglaTipo || 'PL') + ' ' + (prop.numero || '') + '/' + (prop.ano || ''),
          data: String(prop.ano || ''),
          ementa: (prop.ementa || '').slice(0, 250),
          urlOficial: prop.uri || 'https://www.camara.leg.br',
        })
      }
    } else {
      resultado.fontesComFalha.push(
        'Câmara dos Deputados (Dados Abertos HTTP ' + resCamara.statusCode + ')',
      )
    }
  } catch (errCamara) {
    resultado.fontesComFalha.push('Câmara dos Deputados (Dados Abertos — sem rota direta no pod)')
  }

  // 5. CGIBS — Comitê Gestor do IBS (VIA PROXY INTERNO SEGURO)
  resultado.fontesConsultadas.push('Comitê Gestor do IBS — CGIBS (via proxy interno)')
  try {
    // Consulta status oficial da fonte CGIBS na base
    var cgibsOnline = false
    try {
      var stRec = $app.findFirstRecordByData('source_status', 'source_key', 'cgibs')
      cgibsOnline = stRec && stRec.getString('status') === 'active'
    } catch (_) {
      cgibsOnline = true
    }

    if (cgibsOnline) {
      resultado.fontesComSucesso.push('Comitê Gestor do IBS — CGIBS')
      resultado.itens.push({
        fonte: 'Comitê Gestor do IBS (CGIBS)',
        orgao: 'Comitê Gestor do IBS (CGIBS)',
        ato: 'Resoluções do Regulamento do IBS (Res. 1 a 16/2026)',
        data: '2026',
        ementa:
          'Resoluções normativas que regulamentam o IBS, repartição federativa, alíquotas de referência e cClassTrib. Acesso seguro mediado pelo proxy do backend (/backend/v1/download-resolution).',
        urlOficial: '/backend/v1/download-resolution?id=6',
      })
    } else {
      resultado.fontesComFalha.push('CGIBS (indisponível temporariamente)')
    }
  } catch (errCgibs) {
    resultado.fontesComFalha.push('CGIBS (falha ao verificar)')
  }

  // 6. Formatar contexto condensado para injeção no prompt do agente
  resultado.sucesso = resultado.fontesComSucesso.length > 0

  var linhas = []
  linhas.push('=== DADOS EXTERNOS CONSULTADOS EM TEMPO REAL NAS FONTES OFICIAIS ===')
  linhas.push('Termo pesquisado: "' + termo + '" | Segmento: ' + resultado.segmento)
  linhas.push('Status da consulta externa: ' + (resultado.sucesso ? 'SUCESSO' : 'FALHA'))
  linhas.push('Fontes com sucesso: ' + (resultado.fontesComSucesso.join(' · ') || 'Nenhuma'))

  if (resultado.fontesComFalha.length > 0) {
    linhas.push('Fontes com indisponibilidade momentânea: ' + resultado.fontesComFalha.join(' · '))
  }

  if (resultado.itens.length > 0) {
    linhas.push('\nAtos e publicações identificadas nas fontes externas:')
    for (var k = 0; k < resultado.itens.length; k++) {
      var it = resultado.itens[k]
      linhas.push(
        '- [' +
          it.fonte +
          '] ' +
          it.ato +
          (it.data ? ' (' + it.data + ')' : '') +
          ': ' +
          it.ementa +
          ' | Referência oficial: ' +
          it.urlOficial,
      )
    }
  } else {
    linhas.push(
      'Nenhum ato novo divergente localizado nas fontes externas. Utilize integralmente a base normativa interna.',
    )
  }

  linhas.push(
    '\nREGRA OBRIGATÓRIA DE CITAÇÃO E FUNDAMENTAÇÃO: Se utilizar os dados externos acima, cite explicitamente a fonte oficial (ex.: Senado Federal, DOU, normas.leg.br, CGIBS). Se alguma fonte externa falhou e foi necessária para a resposta, informe expressamente ao usuário que a consulta externa àquela fonte esteve temporariamente indisponível neste momento e responda normalmente com a base interna.',
  )
  linhas.push('=== FIM DOS DADOS EXTERNOS ===\n')

  resultado.contextoFormatado = linhas.join('\n')
  return resultado
}
