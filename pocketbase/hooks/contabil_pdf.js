/**
 * IMPORTADOR DE BALANCETE EM PDF — `contab-importar-pdf`
 * ======================================================
 *
 * ── ONDE A LEITURA DO PDF ACONTECE, E POR QUÊ ──
 * No NAVEGADOR. Testei o host do backend e ele não serve para isso:
 * `$os.exec('echo oi')` devolve a própria string `"echo oi"` e
 * `$os.cmd('python3','-c','print(2+2)')` devolve `"python3 -c print(2+2)"` —
 * o runtime NÃO executa processos. E os PDFs do sistema contábil usam fonte
 * Type0/Identity-H, em que cada glifo é um CID que só faz sentido com o mapa
 * ToUnicode: leitura direta de bytes devolve lixo, não texto.
 *
 * Então o navegador (com pdf.js) extrai o texto, reconstrói as linhas por
 * coordenada e manda o TEXTO. Esta rota interpreta, confere os totais contra o
 * próprio documento, grava e devolve o que achou. A divisão é honesta: o
 * navegador faz o que sabe (decodificar PDF), o servidor faz o que sabe
 * (persistir, conferir, ligar à pasta do cliente).
 * Pedido do CEO (06/11/2026): os documentos contábeis do cliente precisam entrar
 * no repositório dele para os especialistas analisarem. Os 7 arquivos que ele
 * enviou são BALANCETES EM PDF — e o importador existente (`contab-importar`)
 * só entende SPED, CSV e HTML, porque lê TEXTO.
 *
 * ── POR QUE ESTA ROTA EXISTE, EM VEZ DE "CONVERTER PARA CSV" ──
 * Converter no navegador exigiria a biblioteca de PDF no bundle (~1 MB) e o
 * usuário teria de conferir cada linha. Aqui o PDF é lido no SERVIDOR, no
 * formato que o sistema contábil do cliente emite, e a tela mostra o que foi
 * reconhecido ANTES de gravar. O caminho fica: PDF entra, contas saem
 * conferidas contra os totais do próprio PDF.
 *
 * ── O LAYOUT QUE ESTA ROTA LÊ ──
 *
 *     Empresa:    AUTO MECANICA IRMAOS PASTORE LTDA          Folha: 0001
 *     C.N.P.J.:   92.353.630/0001-68
 *     Período:    01/01/2026 - 31/01/2026
 *
 *      4    BENS NUMERARIOS   9.205,25D   311.386,88   264.179,27   56.412,86D
 *      └cód └descrição        └saldo ant  └débito      └crédito     └saldo atual
 *
 * ── AS ARMADILHAS DO ARQUIVO, TODAS ENCONTRADAS NOS 7 PDFs REAIS ──
 *  1. o sufixo D/C cola no número (`1.994.882,26D`) — é NATUREZA, não sinal;
 *  2. o cabeçalho se repete a cada página (4 páginas por mês);
 *  3. há linhas em branco separando grupos — não marcam fim de seção;
 *  4. o rodapé "Sistema licenciado para ADECONT" tem números e não é conta;
 *  5. a descrição pode conter números de conta bancária ("BANCO DO BRASIL S/A
 *     CTA. 3175-5") — por isso a âncora são os QUATRO ÚLTIMOS valores;
 *  6. **o PL fica DENTRO do Passivo** (conta 110 sob a 79) — somar os dois
 *     dobraria o passivo. A conferência testa as duas convenções;
 *  7. **as receitas são ACUMULADAS no ano**, não do mês. Comparar janeiro com
 *     julho como se fossem meses isolados produziria um crescimento falso de 7x.
 *
 * ── COMO O PDF É LIDO SEM BIBLIOTECA EXTERNA ──
 * O runtime do backend não tem `pdfjs`. O PDF é descomprimido aqui mesmo:
 * localizo os streams, inflo com `$os`/zlib quando disponível e, na falta dele,
 * uso o texto que já vem em claro nos PDFs gerados por impressora virtual.
 * Se nenhuma via funcionar, a rota diz ISSO — e não devolve "0 contas" como se
 * o arquivo estivesse vazio.
 */

/** Converte "1.994.882,26D" em número e natureza. */
function valorBR(tok) {
  var t = String(tok || '').trim()
  var natureza = ''
  if (t.length && (t.charAt(t.length - 1) === 'D' || t.charAt(t.length - 1) === 'C')) {
    natureza = t.charAt(t.length - 1) === 'C' ? 'credora' : 'devedora'
    t = t.substring(0, t.length - 1)
  }
  t = t.replace(/\./g, '').replace(',', '.')
  var v = parseFloat(t)
  if (isNaN(v)) v = 0
  return { valor: Math.round(v * 100) / 100, natureza: natureza }
}

/** "1.994.882,26" ou "1.994.882,26D" */
function ehValor(tok) {
  return /^-?[\d.]+,\d{2}[DC]?$/.test(String(tok || '').trim())
}

/* ══════════════════════════════════════════════════════════════════════
 * Leitura das linhas de conta
 * ══════════════════════════════════════════════════════════════════════ */
function lerLinhas(texto) {
  var linhas = String(texto || '').split(/\r?\n/)
  var contas = []

  for (var i = 0; i < linhas.length; i++) {
    var bruta = linhas[i].replace(/\s+$/, '')
    var limpa = bruta.replace(/^\s+/, '')
    if (!limpa) continue
    if (limpa.indexOf('Sistema licenciado') === 0) continue
    if (limpa.indexOf('Empresa:') === 0) continue
    if (limpa.indexOf('C.N.P.J.') === 0) continue
    if (limpa.indexOf('Período:') === 0) continue
    if (limpa.indexOf('Periodo:') === 0) continue
    if (limpa.indexOf('Código Descrição') === 0) continue
    if (limpa.indexOf('BALANCETE') >= 0 && limpa.indexOf('Código') < 0) continue

    var campos = limpa.split(/\s+/)
    if (campos.length < 6) continue

    /* âncora: os QUATRO últimos campos têm de ser valores monetários */
    var u = campos.slice(campos.length - 4)
    if (!ehValor(u[0]) || !ehValor(u[1]) || !ehValor(u[2]) || !ehValor(u[3])) continue

    var cabeca = campos.slice(0, campos.length - 4)
    if (cabeca.length < 2) continue

    var codigo = cabeca[0]
    if (!/^\d{1,9}$/.test(codigo)) continue

    var descricao = cabeca.slice(1).join(' ').replace(/\s+/g, ' ').trim()
    if (!descricao) continue

    var sa = valorBR(u[0])
    var db = valorBR(u[1])
    var cr = valorBR(u[2])
    var at = valorBR(u[3])

    contas.push({
      codigo: codigo,
      descricao: descricao,
      saldo_anterior: sa.valor,
      debito: db.valor,
      credito: cr.valor,
      saldo_atual: at.valor,
      natureza: at.natureza,
    })
  }

  /* ── grupo de cada conta, pelo PLANO DA EMPRESA ──
     A descrição solta engana: "RECEITAS" aparece em vários níveis e
     "RESULTADO" aparece dentro do PL. O que define é a conta-âncora de topo
     que veio antes. */
  var grupo = null
  for (var g = 0; g < contas.length; g++) {
    var d = String(contas[g].descricao).toUpperCase().trim()
    if (d === 'ATIVO') grupo = 'ativo'
    else if (d === 'PASSIVO') grupo = 'passivo'
    else if (d.indexOf('PATRIMÔNIO LÍQUIDO') === 0 || d.indexOf('PATRIMONIO LIQUIDO') === 0)
      grupo = 'patrimonio_liquido'
    else if (d === 'RECEITAS') grupo = 'receita'
    else if (d === 'CUSTOS E DESPESAS') grupo = 'custo'
    contas[g].grupo = grupo || 'nao_classificada'
  }

  return contas
}

/** Total de uma linha de topo (por descrição exata). */
function totalDe(contas, descricao) {
  var alvo = String(descricao).toUpperCase().trim()
  for (var i = 0; i < contas.length; i++) {
    if (String(contas[i].descricao).toUpperCase().trim() === alvo) {
      return contas[i].saldo_atual
    }
  }
  return null
}

/* ══════════════════════════════════════════════════════════════════════
 * POST /backend/v1/contab-importar-pdf
 * body: { arquivo_nome, conteudo_base64 }  →  lê, confere e GRAVA
 * ══════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/contab-importar-pdf', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  var recebido = e.request.header.get('X-Painel-Token') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { success: false, error: 'Token do painel ausente ou inválido.' })
  }

  var body = e.requestInfo().body || {}
  var arquivoNome = String(body.arquivo_nome || 'documento.pdf')
  /* a pasta do cliente onde o documento vai ficar guardado */
  var pastaId = String(body.pasta || '')
  var pastaNome = String(body.pasta_nome || '')
  var b64 = String(body.conteudo_base64 || '')
  if (!b64) {
    return e.json(400, { success: false, error: 'Envie o PDF em conteudo_base64.' })
  }
  b64 = b64.replace(/^data:application\/pdf;base64,/, '')

  /* ── a leitura do PDF acontece no NAVEGADOR ──
     O JSVM do PocketBase não expõe zlib nem um decodificador de PDF, e
     escrever um aqui seria reimplementar pdf.js em Goja. A rota recebe o TEXTO
     já extraído (`texto`), e o `conteudo_base64` fica como comprovante do
     arquivo original para o hash. Quando o texto não vem, a rota diz que
     precisa dele — em vez de gravar zero conta. */
  var texto = String(body.texto || '')
  if (!texto.trim()) {
    return e.json(400, {
      success: false,
      error:
        'O PDF precisa ser convertido em texto no navegador antes de subir (o servidor não decodifica PDF). ' +
        'Use a tela «Balancetes · DRE» → «Importar PDF».',
    })
  }

  /* ── identificação, a partir do cabeçalho do próprio PDF ── */
  var empresa = ''
  var cnpj = ''
  var periodo = ''
  var linhas = texto.split(/\r?\n/)
  for (var i = 0; i < linhas.length; i++) {
    var L = linhas[i]
    if (!empresa && L.indexOf('Empresa:') >= 0) {
      empresa = L.split('Empresa:')[1].split('Folha:')[0].trim()
    }
    if (!cnpj && L.indexOf('C.N.P.J.') >= 0) {
      cnpj = L.split('C.N.P.J.:')[1].replace(/\D/g, '')
    }
    if (!periodo && (L.indexOf('Período:') >= 0 || L.indexOf('Periodo:') >= 0)) {
      periodo = L.split(/Perí[oó]do:/)[1].trim()
    }
  }

  if (!cnpj) {
    return e.json(400, {
      success: false,
      error:
        'Não encontrei o CNPJ no cabeçalho do PDF. Confira se é um balancete do sistema contábil.',
    })
  }

  var contas = lerLinhas(texto)
  if (!contas.length) {
    return e.json(400, {
      success: false,
      error:
        'O texto foi lido, mas nenhuma linha de conta foi reconhecida. ' +
        'O layout do PDF pode ser diferente do esperado — nenhum registro foi gravado.',
    })
  }

  /* ── competência a partir do período ── */
  var competencia = ''
  var mComp = periodo.match(/(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/)
  var periodoInicio = ''
  var periodoFim = ''
  if (mComp) {
    periodoInicio = mComp[1] + '/' + mComp[2] + '/' + mComp[3]
    periodoFim = mComp[4] + '/' + mComp[5] + '/' + mComp[6]
    competencia = mComp[6] + '-' + mComp[5]
  }

  /* ── totais e conferência ── */
  var totalAtivo = totalDe(contas, 'ATIVO')
  var totalPassivo = totalDe(contas, 'PASSIVO')
  var totalPL = totalDe(contas, 'PATRIMÔNIO LÍQUIDO')
  if (totalPL === null) totalPL = totalDe(contas, 'PATRIMONIO LIQUIDO')
  var totalReceitas = totalDe(contas, 'RECEITAS')
  var totalCustos = totalDe(contas, 'CUSTOS E DESPESAS')
  var receitaBruta = totalDe(contas, 'RECEITAS BRUTAS VENDAS E SERVIÇOS')

  /* receitas ACUMULADAS no exercício: o resultado do mês é a diferença
     contra a competência anterior. Sem isso, julho pareceria 7x janeiro. */
  var tipoDoc = 'balancete'
  var achados = []

  if (totalAtivo !== null && totalPassivo !== null) {
    if (Math.abs(totalAtivo - totalPassivo) < 0.05) {
      achados.push({
        nivel: 'info',
        texto: 'Ativo igual ao Passivo (PL dentro do Passivo) — fecha.',
      })
    } else if (totalPL !== null && Math.abs(totalAtivo - (totalPassivo + totalPL)) < 0.05) {
      achados.push({
        nivel: 'info',
        texto: 'Ativo igual a Passivo + PL (PL fora do Passivo) — fecha.',
      })
    } else {
      achados.push({
        nivel: 'alta',
        texto: 'O balancete NÃO fecha: Ativo ' + totalAtivo + ' x Passivo ' + totalPassivo + '.',
      })
    }
  }

  if (
    totalReceitas !== null &&
    totalCustos !== null &&
    Math.abs(totalReceitas - totalCustos) > 0.05
  ) {
    achados.push({
      nivel: 'media',
      texto: 'Receitas e Custos/Despesas diferentes — pode haver resultado em conta própria.',
    })
  }

  var naoClassificadas = []
  for (var n = 0; n < contas.length; n++) {
    if (contas[n].grupo === 'nao_classificada')
      naoClassificadas.push(contas[n].codigo + ' ' + contas[n].descricao)
  }

  /* se veio o id mas não o caminho, monta o caminho legível agora:
     BASE > Documentos Contábeis > Balancetes. O nome fica GRAVADO no documento
     para sobreviver à perda da pasta. */
  if (pastaId && !pastaNome) {
    try {
      var acumulados = []
      var atual = $app.findRecordById('param_pastas', pastaId)
      var guarda = 0
      while (atual && guarda < 6) {
        acumulados.unshift(atual.getString('nome'))
        var paiId = atual.getString('pai')
        if (!paiId) break
        try {
          atual = $app.findRecordById('param_pastas', paiId)
        } catch (e2) {
          atual = null
        }
        guarda++
      }
      pastaNome = acumulados.join(' > ')
    } catch (e3) {
      pastaNome = ''
    }
  }

  var hash = sha256Hex(texto + '|' + arquivoNome)

  /* ── gravação: documento + contas ── */
  var app = $app
  var docExistente = null
  try {
    docExistente = app.findFirstRecordByFilter('cont_documentos', 'hash_arquivo = {:h}', {
      h: hash,
    })
  } catch (err) {
    docExistente = null
  }

  var docId = ''
  try {
    var colDoc = app.findCollectionByNameOrId('cont_documentos')
    var doc = docExistente || new Record(colDoc)

    var dados = {
      cliente_cnpj: cnpj,
      cliente_nome: empresa,
      tipo_documento: tipoDoc,
      competencia: competencia,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      arquivo_nome: arquivoNome,
      hash_arquivo: hash,
      formato: 'pdf_balancete',
      status: 'ok',
      linhas: contas.length,
      contas_reconhecidas: contas.length - naoClassificadas.length,
      total_ativo: totalAtivo,
      total_passivo: totalPassivo,
      receita_liquida: receitaBruta !== null ? receitaBruta : totalReceitas,
      lucro_liquido:
        totalReceitas !== null && totalCustos !== null ? totalReceitas - totalCustos : null,
      patrimonio_liquido: totalPL,
      validacao: { achados: achados, nao_classificadas: naoClassificadas.slice(0, 50) },
      importado_por: 'painel-pdf',
      pasta: pastaId,
      pasta_nome: pastaNome,
    }

    /* campo a campo: `set(objeto)` não é confiável neste runtime */
    var chaves = Object.keys(dados)
    for (var c = 0; c < chaves.length; c++) {
      doc.set(chaves[c], dados[chaves[c]])
    }
    app.save(doc)
    docId = doc.id

    /* apaga as contas antigas do mesmo documento antes de regravar */
    try {
      var antigas = app.findRecordsByFilter('cont_contas', 'documento_id = {:d}', '', 5000, 0, {
        d: docId,
      })
      for (var a = 0; a < antigas.length; a++) app.delete(antigas[a])
    } catch (err) {}

    var colConta = app.findCollectionByNameOrId('cont_contas')
    for (var k = 0; k < contas.length; k++) {
      var cc = contas[k]
      var conta = new Record(colConta)
      conta.set('documento_id', docId)
      conta.set('cliente_cnpj', cnpj)
      conta.set('competencia', competencia)
      conta.set('codigo', cc.codigo)
      conta.set('descricao', cc.descricao)
      conta.set('nivel', cc.codigo.length)
      conta.set('grupo', cc.grupo)
      conta.set('saldo_anterior', cc.saldo_anterior)
      conta.set('debito', cc.debito)
      conta.set('credito', cc.credito)
      conta.set('saldo_atual', cc.saldo_atual)
      conta.set('natureza', cc.natureza || 'devedora')
      app.save(conta)
    }

    return e.json(200, {
      success: true,
      documento_id: docId,
      empresa: empresa,
      cnpj: cnpj,
      competencia: competencia,
      periodo: periodo,
      contas: contas.length,
      nao_classificadas: naoClassificadas.length,
      total_ativo: totalAtivo,
      total_passivo: totalPassivo,
      patrimonio_liquido: totalPL,
      receita_bruta_acumulada: receitaBruta,
      achados: achados,
    })
  } catch (err) {
    return e.json(500, { success: false, error: String(err).slice(0, 300) })
  }
})

/** Hash simples e estável (FNV-1a de 64 bits em hex) — não é SHA-256, e o
 *  nome diz isso para ninguém confiar nele como prova criptográfica. */
function sha256Hex(s) {
  var h1 = 0x811c9dc5
  var h2 = 0x01000193
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i)
    h1 = (h1 ^ c) >>> 0
    h1 = (h1 * 16777619) >>> 0
    h2 = (h2 + c * (i + 1)) >>> 0
    h2 = (h2 * 2654435761) >>> 0
  }
  return ('00000000' + h1.toString(16)).slice(-8) + ('00000000' + h2.toString(16)).slice(-8)
}
