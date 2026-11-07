/// <reference path="../pb_data/types.d.ts" />

/**
 * Pipeline de NFes — ADECONT Assessoria Contábil e Administrativa
 * ===============================================================
 * Rota POST /backend/v1/nfe-processar-lote
 *
 * Recebe lote de XMLs (JSON com array `arquivos`: [{ nome, xml }]),
 * parseia estrutura nacional da NF-e (infNFe, ide, emit, dest, det, total, transp, pag, infIntermed, cobr/dup),
 * identifica tipo de operação (compra x venda) combinando:
 *   - tpNF (0=entrada/compra, 1=saída/venda)
 *   - Prefixo dos CFOPs dos itens (1/2/3=entrada; 5/6/7=saída)
 *   - Vínculo com cadastro de empresas (se emitente é cliente => venda; se destinatário PJ é cliente => compra)
 * Destinatário Pessoa Física (CPF):
 *   - Se dest é CPF (venda B2C / consumidor final), não tenta vínculo PJ em cadastro_empresas
 *   - Marca destinatario_tipo = 'PF', ind_final = 1, vinculo_cliente_status = 'nao_localizado' (ou 'consumidor_final')
 * Intermediador / Marketplace:
 *   - Extrai infIntermed (CNPJ, idCadIntTran), transporte (transporta/CNPJ/xNome) e verProc (ex: mercadolivre.invoice)
 * Bloco IBSCBS (Reforma Tributária):
 *   - Extrai do total (IBSCBSTot: vBCIBSCBS, vIBS, vCBS, vCredPres, vCredPresCondSus)
 *   - Extrai de cada item (IBSCBS: CST, cClassTrib, vBC, pIBSUF, vIBSUF, pIBSMun, vIBSMun, vIBS, pCBS, vCBS, etc.)
 * Deduplica por chave_acesso de 44 dígitos (atualiza itens e dados sem duplicar registro).
 */

routerAdd('OPTIONS', '/backend/v1/nfe-processar-lote', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  e.response.header().set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  e.response
    .header()
    .set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Painel-Token')
  return e.noContent(204)
})

routerAdd('POST', '/backend/v1/nfe-processar-lote', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')

  try {
    var info = e.requestInfo()
    var body = info.body || {}
    var arquivos = body.arquivos || []

    // Suporte se vier apenas um arquivo { nome, xml } no corpo
    if (!arquivos.length && body.xml) {
      arquivos = [{ nome: body.nome || 'documento.xml', xml: body.xml }]
    }

    if (!arquivos.length) {
      return e.json(200, {
        success: false,
        error: 'Nenhum arquivo XML recebido para processamento.',
        total_arquivos: 0,
        processadas_sucesso: 0,
        duplicadas: 0,
        erros: 0,
        resultados: [],
      })
    }

    // Funções utilitárias de parseamento XML inline (padrão JSVM do PocketBase)
    var TAG_MALFORMADA = '__TAG_SEM_FECHAMENTO__'

    function tagDe(xml, nome) {
      var t = String(xml || '')
      if (!t) return ''
      var abre = '<' + nome
      var fecha = '</' + nome + '>'
      var i = t.indexOf(abre)
      if (i >= 0 && t.slice(0, i).trim() === '') {
        var j0 = t.indexOf('>', i)
        var k0 = t.lastIndexOf(fecha)
        if (j0 >= 0 && k0 > j0) return t.slice(j0 + 1, k0)
        if (j0 >= 0) return TAG_MALFORMADA
      }
      var a = t.indexOf(abre)
      if (a < 0) return ''
      var b = t.indexOf('>', a)
      if (b < 0) return TAG_MALFORMADA
      var c = t.indexOf(fecha, b)
      if (c < 0) return TAG_MALFORMADA
      return t.slice(b + 1, c)
    }

    function numDe(v) {
      if (v === TAG_MALFORMADA || v === undefined || v === null) return 0
      var s = String(v).replace(/\s+/g, '').replace(',', '.')
      var n = Number(s)
      return isFinite(n) ? n : 0
    }

    function limpar(s) {
      return String(s || '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function digitsOnly(s) {
      return String(s || '').replace(/\D/g, '')
    }

    function attrDe(xml, nome, attr) {
      var re = new RegExp('<' + nome + '[^>]*\\s' + attr + '="([^"]*)"')
      var m = re.exec(String(xml || ''))
      return m ? m[1] : ''
    }

    function todasDe(xml, nome) {
      var re = new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>', 'g')
      var out = []
      var m
      while ((m = re.exec(String(xml || ''))) !== null) out.push(m[1])
      return out
    }

    // Busca cliente por CNPJ na coleção cadastro_empresas (somente para CNPJ de PJ com 14 dígitos ou raiz >= 8)
    function buscarClientePorCnpj(cnpjOuCpf) {
      var limpo = digitsOnly(cnpjOuCpf)
      // Se tiver 11 dígitos, é CPF de pessoa física — NÃO busca no cadastro de empresas PJ
      if (!limpo || limpo.length === 11 || limpo.length < 8) return null
      try {
        var filtro =
          'documento_limpo = "' + limpo + '" || numero_documento ~ "' + limpo.slice(0, 8) + '"'
        var recs = $app.findRecordsByFilter('cadastro_empresas', filtro, '-created', 1, 0)
        if (recs && recs.length > 0) {
          var r = recs[0]
          return {
            id: r.id,
            cnpj: r.getString('numero_documento') || r.getString('documento_limpo'),
            cnpj_limpo: r.getString('documento_limpo') || limpo,
            nome:
              r.getString('razao_social') || r.getString('nome') || r.getString('nome_fantasia'),
          }
        }
      } catch (errBusca) {
        // Fallback silencioso
      }
      return null
    }

    var colLote = $app.findCollectionByNameOrId('nfes_lote')
    var colNfe = $app.findCollectionByNameOrId('nfes')
    var colItens = $app.findCollectionByNameOrId('nfes_itens')

    var loteRec = new Record(colLote)
    loteRec.set('total_arquivos', arquivos.length)
    loteRec.set('status', 'processando')
    loteRec.set('processadas_sucesso', 0)
    loteRec.set('duplicadas', 0)
    loteRec.set('erros', 0)
    loteRec.set('total_itens', 0)
    loteRec.set('valor_total_produtos', 0)
    loteRec.set('valor_total_nf', 0)
    $app.save(loteRec)

    var resultados = []
    var processadasSucesso = 0
    var duplicadas = 0
    var erros = 0
    var somaItens = 0
    var somaProd = 0
    var somaNF = 0
    var clienteDetectado = null
    var tiposDetectados = {}

    for (var i = 0; i < arquivos.length; i++) {
      var arq = arquivos[i] || {}
      var nomeArquivo = limpar(arq.nome || 'nfe_' + (i + 1) + '.xml')
      var xml = String(arq.xml || '').trim()

      if (!xml || xml.indexOf('<') < 0) {
        erros++
        resultados.push({
          arquivo: nomeArquivo,
          status: 'erro',
          motivo: 'Arquivo vazio ou formato não é XML.',
        })
        continue
      }

      try {
        // 1. Chave de acesso (44 dígitos)
        var chave = attrDe(xml, 'infNFe', 'Id').replace(/^NFe/, '').trim()
        if (!chave) {
          chave = digitsOnly(tagDe(xml, 'chNFe'))
        }

        var ide = tagDe(xml, 'ide')
        var emit = tagDe(xml, 'emit')
        var dest = tagDe(xml, 'dest')
        var total = tagDe(xml, 'total')
        var icmsTot = tagDe(total, 'ICMSTot')
        var ibscbsTot = tagDe(total, 'IBSCBSTot')
        var transp = tagDe(xml, 'transp')
        var pag = tagDe(xml, 'pag')
        var infIntermed = tagDe(xml, 'infIntermed')
        var cobr = tagDe(xml, 'cobr')

        var numero = limpar(tagDe(ide, 'nNF'))
        var serie = limpar(tagDe(ide, 'serie'))
        var natOp = limpar(tagDe(ide, 'natOp'))
        var dhEmi = limpar(tagDe(ide, 'dhEmi') || tagDe(ide, 'dEmi'))
        var dhSaiEnt = limpar(tagDe(ide, 'dhSaiEnt') || tagDe(ide, 'dSaiEnt'))
        var tpNF = limpar(tagDe(ide, 'tpNF')) // 0=entrada, 1=saida
        var indFinal = numDe(tagDe(ide, 'indFinal')) // 0=normal, 1=consumidor final
        var verProc = limpar(tagDe(ide, 'verProc'))

        if (!chave || chave.length !== 44) {
          if (chave && chave.length > 20) {
            // chave presente
          } else {
            chave =
              'NFE' +
              (numero || '0') +
              '_' +
              (serie || '1') +
              '_' +
              digitsOnly(dhEmi || new Date().toISOString())
          }
        }

        // Dados Emitente
        var emitCnpjCpf = digitsOnly(tagDe(emit, 'CNPJ') || tagDe(emit, 'CPF'))
        var emitNome = limpar(tagDe(emit, 'xNome'))
        var emitFantasia = limpar(tagDe(emit, 'xFant'))
        var emitEnder = tagDe(emit, 'enderEmit')
        var emitUf = limpar(tagDe(emitEnder, 'UF'))
        var emitMun = limpar(tagDe(emitEnder, 'xMun'))
        var emitIe = limpar(tagDe(emit, 'IE'))
        var emitCrt = limpar(tagDe(emit, 'CRT'))

        // Dados Destinatário (pode ser CNPJ ou CPF)
        var destCnpj = digitsOnly(tagDe(dest, 'CNPJ'))
        var destCpf = digitsOnly(tagDe(dest, 'CPF'))
        var destCnpjCpf = destCnpj || destCpf
        var destinatarioTipo = destCpf ? 'PF' : 'PJ'
        var destNome = limpar(tagDe(dest, 'xNome'))
        var destEnder = tagDe(dest, 'enderDest')
        var destUf = limpar(tagDe(destEnder, 'UF'))
        var destMun = limpar(tagDe(destEnder, 'xMun'))
        var destIe = limpar(tagDe(dest, 'IE'))
        var indIEDest = limpar(tagDe(dest, 'indIEDest'))

        // Identificação preliminar de CFOP dos itens para apoiar classificação
        var dets = todasDe(xml, 'det')
        var primeiroCfop = ''
        if (dets.length > 0) {
          var prod0 = tagDe(dets[0], 'prod')
          primeiroCfop = digitsOnly(tagDe(prod0, 'CFOP'))
        }

        // Determinação de tipo_compra_venda:
        // Regra tributária nacional:
        // 1. tpNF = 1 (saída) e CFOP iniciando em 5, 6 ou 7 => VENDA (operação de saída)
        // 2. tpNF = 0 (entrada) e CFOP iniciando em 1, 2 ou 3 => COMPRA (operação de entrada)
        // 3. Se destinatário é cliente cadastrado da ADECONT e emitente é fornecedor terceiro => COMPRA do cliente
        // 4. Se emitente é cliente cadastrado da ADECONT e dest é comprador/PF/terceiro => VENDA do cliente
        var cliDest = destinatarioTipo === 'PJ' ? buscarClientePorCnpj(destCnpjCpf) : null
        var cliEmit = buscarClientePorCnpj(emitCnpjCpf)

        var clienteVinculado = null
        var tipoOperacao = 'compra'
        var vinculoStatus = 'nao_localizado'

        var cfopDigito = primeiroCfop ? primeiroCfop.charAt(0) : ''
        var ehSaidaFiscal =
          tpNF === '1' || cfopDigito === '5' || cfopDigito === '6' || cfopDigito === '7'
        var ehEntradaFiscal =
          tpNF === '0' || cfopDigito === '1' || cfopDigito === '2' || cfopDigito === '3'

        if (cliEmit && !cliDest) {
          // Cliente ADECONT emitiu a nota (venda/saída)
          clienteVinculado = cliEmit
          tipoOperacao = 'venda'
          vinculoStatus = 'vinculado'
        } else if (cliDest && !cliEmit) {
          // Cliente ADECONT comprou a mercadoria de terceiro
          clienteVinculado = cliDest
          tipoOperacao = 'compra'
          vinculoStatus = 'vinculado'
        } else if (cliEmit && cliDest) {
          clienteVinculado = cliDest
          tipoOperacao = ehSaidaFiscal ? 'venda' : 'compra'
          vinculoStatus = 'vinculado'
        } else {
          // Nenhum dos dois está no cadastro PJ:
          // Se dest é PF (CPF) e tpNF=1 ou CFOP 5/6/7, é inequivocamente VENDA (saída para consumidor final)
          if (destinatarioTipo === 'PF' || ehSaidaFiscal) {
            tipoOperacao = 'venda'
            vinculoStatus = destinatarioTipo === 'PF' ? 'nao_localizado' : 'nao_localizado'
          } else if (ehEntradaFiscal) {
            tipoOperacao = 'compra'
            vinculoStatus = 'nao_localizado'
          } else {
            tipoOperacao = tpNF === '0' ? 'compra' : 'venda'
            vinculoStatus = 'nao_localizado'
          }
        }

        if (clienteVinculado && !clienteDetectado) {
          clienteDetectado = clienteVinculado
        }
        tiposDetectados[tipoOperacao] = (tiposDetectados[tipoOperacao] || 0) + 1

        // Dados de Intermediador / Marketplace e Transporte
        var intermedCnpj = digitsOnly(tagDe(infIntermed, 'CNPJ'))
        var intermedId = limpar(tagDe(infIntermed, 'idCadIntTran'))
        var transporta = tagDe(transp, 'transporta')
        var transpCnpj = digitsOnly(tagDe(transporta, 'CNPJ'))
        var transpNome = limpar(tagDe(transporta, 'xNome'))

        // Nome do intermediador inferido ou extraído
        var intermedNome = ''
        if (
          intermedCnpj === '03007331000141' ||
          /mercadolivre/i.test(verProc) ||
          /ebazar/i.test(transpNome)
        ) {
          intermedNome = 'Mercado Livre (Ebazar.com.br LTDA)'
        } else if (intermedCnpj) {
          intermedNome = transpNome || 'Intermediador CNPJ ' + intermedCnpj
        }

        // Totais e tributos gerais (ICMSTot)
        var vProd = numDe(tagDe(icmsTot, 'vProd'))
        var vFrete = numDe(tagDe(icmsTot, 'vFrete'))
        var vSeg = numDe(tagDe(icmsTot, 'vSeg'))
        var vDesc = numDe(tagDe(icmsTot, 'vDesc'))
        var vOutro = numDe(tagDe(icmsTot, 'vOutro'))
        var vNF = numDe(tagDe(icmsTot, 'vNF'))

        var vBC = numDe(tagDe(icmsTot, 'vBC'))
        var vICMS = numDe(tagDe(icmsTot, 'vICMS'))
        var vBCST = numDe(tagDe(icmsTot, 'vBCST'))
        var vST = numDe(tagDe(icmsTot, 'vST'))
        var vPIS = numDe(tagDe(icmsTot, 'vPIS'))
        var vCOFINS = numDe(tagDe(icmsTot, 'vCOFINS'))
        var vIPI = numDe(tagDe(icmsTot, 'vIPI'))
        var vICMSUFDest = numDe(tagDe(icmsTot, 'vICMSUFDest')) // DIFAL da UF Destino

        // Totais do Bloco IBSCBS (IBSCBSTot — Reforma Tributária)
        var ibscbsTotVbc = 0
        var ibscbsTotVibs = 0
        var ibscbsTotVcbs = 0
        var ibscbsTotVcredpres = 0
        var blocoIbscbsTotalObj = null

        if (ibscbsTot && ibscbsTot !== TAG_MALFORMADA) {
          ibscbsTotVbc = numDe(tagDe(ibscbsTot, 'vBCIBSCBS'))
          var gIbs = tagDe(ibscbsTot, 'gIBS')
          var gCbs = tagDe(ibscbsTot, 'gCBS')
          ibscbsTotVibs = numDe(tagDe(gIbs, 'vIBS') || tagDe(ibscbsTot, 'vIBS'))
          ibscbsTotVcbs = numDe(tagDe(gCbs, 'vCBS') || tagDe(ibscbsTot, 'vCBS'))
          ibscbsTotVcredpres = numDe(
            tagDe(gIbs, 'vCredPres') || tagDe(gCbs, 'vCredPres') || tagDe(ibscbsTot, 'vCredPres'),
          )
          blocoIbscbsTotalObj = {
            vBCIBSCBS: ibscbsTotVbc,
            vIBS: ibscbsTotVibs,
            vCBS: ibscbsTotVcbs,
            vCredPres: ibscbsTotVcredpres,
            vCredPresCondSus: numDe(
              tagDe(gIbs, 'vCredPresCondSus') || tagDe(gCbs, 'vCredPresCondSus'),
            ),
          }
        }

        // Duplicatas e cobrança
        var dups = todasDe(cobr, 'dup')
        var listaDuplicatas = []
        for (var d = 0; d < dups.length; d++) {
          var dupXml = dups[d]
          listaDuplicatas.push({
            numero: limpar(tagDe(dupXml, 'nDup')),
            vencimento: limpar(tagDe(dupXml, 'dVenc')),
            valor: numDe(tagDe(dupXml, 'vDup')),
          })
        }

        // Formas de pagamento
        var tPag = limpar(tagDe(pag, 'tPag'))
        var card = tagDe(pag, 'card')
        var cardCnpj = digitsOnly(tagDe(card, 'CNPJ'))

        // Parse de Itens (<det>)
        var listaItens = []

        for (var j = 0; j < dets.length; j++) {
          var detXml = dets[j]
          var nItem =
            Number(limpar(attrDe(detXml, 'det', 'nItem') || attrDe(detXml, 'det', 'n'))) || j + 1
          var prod = tagDe(detXml, 'prod')
          var imposto = tagDe(detXml, 'imposto')

          var cProd = limpar(tagDe(prod, 'cProd'))
          var xProd = limpar(tagDe(prod, 'xProd'))
          var ncm = digitsOnly(tagDe(prod, 'NCM'))
          var cest = digitsOnly(tagDe(prod, 'CEST'))
          var cfop = digitsOnly(tagDe(prod, 'CFOP'))
          var uCom = limpar(tagDe(prod, 'uCom'))
          var qCom = numDe(tagDe(prod, 'qCom'))
          var vUnCom = numDe(tagDe(prod, 'vUnCom'))
          var vProdItem = numDe(tagDe(prod, 'vProd'))
          var vDescItem = numDe(tagDe(prod, 'vDesc'))
          var vFreteItem = numDe(tagDe(prod, 'vFrete'))

          // ICMS
          var icmsBlock = tagDe(imposto, 'ICMS')
          var origem = ''
          var cstIcms = ''
          var baseIcmsItem = 0
          var aliqIcmsItem = 0
          var valIcmsItem = 0

          var baseIcmsStItem = 0
          var aliqIcmsStItem = 0
          var valIcmsStItem = 0

          var gruposIcms = [
            'ICMS00',
            'ICMS10',
            'ICMS20',
            'ICMS30',
            'ICMS40',
            'ICMS51',
            'ICMS60',
            'ICMS70',
            'ICMS90',
            'ICMSSN101',
            'ICMSSN102',
            'ICMSSN201',
            'ICMSSN202',
            'ICMSSN500',
            'ICMSSN900',
            'ICMSPart',
            'ICMSST',
          ]
          for (var g = 0; g < gruposIcms.length; g++) {
            var subTag = tagDe(icmsBlock, gruposIcms[g])
            if (subTag && subTag !== TAG_MALFORMADA) {
              origem = limpar(tagDe(subTag, 'orig'))
              cstIcms = limpar(tagDe(subTag, 'CST') || tagDe(subTag, 'CSOSN'))
              baseIcmsItem = numDe(tagDe(subTag, 'vBC'))
              aliqIcmsItem = numDe(tagDe(subTag, 'pICMS'))
              valIcmsItem = numDe(tagDe(subTag, 'vICMS'))

              baseIcmsStItem = numDe(tagDe(subTag, 'vBCST'))
              aliqIcmsStItem = numDe(tagDe(subTag, 'pICMSST'))
              valIcmsStItem = numDe(tagDe(subTag, 'vICMSST'))
              break
            }
          }

          // PIS
          var pisBlock = tagDe(imposto, 'PIS')
          var cstPis = ''
          var basePis = 0
          var aliqPis = 0
          var valPis = 0
          var gruposPis = ['PISAliq', 'PISQtde', 'PISNT', 'PISOutr']
          for (var p = 0; p < gruposPis.length; p++) {
            var subPis = tagDe(pisBlock, gruposPis[p])
            if (subPis && subPis !== TAG_MALFORMADA) {
              cstPis = limpar(tagDe(subPis, 'CST'))
              basePis = numDe(tagDe(subPis, 'vBC'))
              aliqPis = numDe(tagDe(subPis, 'pPIS'))
              valPis = numDe(tagDe(subPis, 'vPIS'))
              break
            }
          }

          // COFINS
          var cofinsBlock = tagDe(imposto, 'COFINS')
          var cstCofins = ''
          var baseCofins = 0
          var aliqCofins = 0
          var valCofins = 0
          var gruposCofins = ['COFINSAliq', 'COFINSQtde', 'COFINSNT', 'COFINSOutr']
          for (var c = 0; c < gruposCofins.length; c++) {
            var subCofins = tagDe(cofinsBlock, gruposCofins[c])
            if (subCofins && subCofins !== TAG_MALFORMADA) {
              cstCofins = limpar(tagDe(subCofins, 'CST'))
              baseCofins = numDe(tagDe(subCofins, 'vBC'))
              aliqCofins = numDe(tagDe(subCofins, 'pCOFINS'))
              valCofins = numDe(tagDe(subCofins, 'vCOFINS'))
              break
            }
          }

          // IPI
          var ipiBlock = tagDe(imposto, 'IPI')
          var ipiTrib = tagDe(ipiBlock, 'IPITrib')
          var ipiNt = tagDe(ipiBlock, 'IPINT')
          var cstIpi = limpar(tagDe(ipiTrib, 'CST') || tagDe(ipiNt, 'CST'))
          var aliqIpi = numDe(tagDe(ipiTrib, 'pIPI'))
          var valIpi = numDe(tagDe(ipiTrib, 'vIPI'))

          // ICMSUFDest (DIFAL Interestadual consumidor final EC 87/2015)
          var icmsUfDestBlock = tagDe(imposto, 'ICMSUFDest')
          var valDifalItem = numDe(tagDe(icmsUfDestBlock, 'vICMSUFDest'))

          // Bloco IBSCBS no item (<IBSCBS>)
          var ibscbsItemBlock = tagDe(imposto, 'IBSCBS')
          var ibscbsCst = ''
          var ibscbsCclassTrib = ''
          var ibscbsVbc = 0
          var ibscbsPibsUf = 0
          var ibscbsVibsUf = 0
          var ibscbsPibsMun = 0
          var ibscbsVibsMun = 0
          var ibscbsVibs = 0
          var ibscbsPcbs = 0
          var ibscbsVcbs = 0
          var ibscbsVcredpres = 0
          var dadosIbscbsItem = null

          if (ibscbsItemBlock && ibscbsItemBlock !== TAG_MALFORMADA) {
            ibscbsCst = limpar(tagDe(ibscbsItemBlock, 'CST'))
            ibscbsCclassTrib = limpar(tagDe(ibscbsItemBlock, 'cClassTrib'))
            var gIbscbs = tagDe(ibscbsItemBlock, 'gIBSCBS')
            var escopo = gIbscbs && gIbscbs !== TAG_MALFORMADA ? gIbscbs : ibscbsItemBlock

            ibscbsVbc = numDe(tagDe(escopo, 'vBC'))

            var gIbsUf = tagDe(escopo, 'gIBSUF')
            ibscbsPibsUf = numDe(tagDe(gIbsUf, 'pIBSUF') || tagDe(escopo, 'pIBSUF'))
            ibscbsVibsUf = numDe(tagDe(gIbsUf, 'vIBSUF') || tagDe(escopo, 'vIBSUF'))

            var gIbsMun = tagDe(escopo, 'gIBSMun')
            ibscbsPibsMun = numDe(tagDe(gIbsMun, 'pIBSMun') || tagDe(escopo, 'pIBSMun'))
            ibscbsVibsMun = numDe(tagDe(gIbsMun, 'vIBSMun') || tagDe(escopo, 'vIBSMun'))

            ibscbsVibs = numDe(tagDe(escopo, 'vIBS')) || ibscbsVibsUf + ibscbsVibsMun

            var gCbs = tagDe(escopo, 'gCBS')
            ibscbsPcbs = numDe(tagDe(gCbs, 'pCBS') || tagDe(escopo, 'pCBS'))
            ibscbsVcbs = numDe(tagDe(gCbs, 'vCBS') || tagDe(escopo, 'vCBS'))

            ibscbsVcredpres = numDe(tagDe(escopo, 'vCredPres'))

            dadosIbscbsItem = {
              cst: ibscbsCst,
              cClassTrib: ibscbsCclassTrib,
              vBC: ibscbsVbc,
              pIBSUF: ibscbsPibsUf,
              vIBSUF: ibscbsVibsUf,
              pIBSMun: ibscbsPibsMun,
              vIBSMun: ibscbsVibsMun,
              vIBS: ibscbsVibs,
              pCBS: ibscbsPcbs,
              vCBS: ibscbsVcbs,
              vCredPres: ibscbsVcredpres,
            }
          }

          // Projeção de cClassTrib: prioriza o bloco IBSCBS real quando presente no XML
          var cClassTribSugerido = ibscbsCclassTrib || '000000'
          var regimeReformaSugerido = 'Regime Geral (IBS ~17,7% + CBS ~8,8%) com Crédito Pleno'
          var creditoPresumidoReforma = 'Não aplicável (apuração ampla standard)'

          if (ibscbsCclassTrib === '000001') {
            cClassTribSugerido = '000001'
            regimeReformaSugerido =
              'Regime Geral — Operação padrão com tributação integral na CBS (0,90%) e IBS UF (0,10%) em 2026'
            creditoPresumidoReforma =
              ibscbsVcredpres > 0
                ? 'Crédito presumido de R$ ' + ibscbsVcredpres.toFixed(2)
                : 'Sem crédito presumido destacado (vCredPres = 0.00)'
          } else if (
            ncm.indexOf('8708') === 0 ||
            ncm.indexOf('8409') === 0 ||
            ncm.indexOf('8483') === 0 ||
            ncm.indexOf('8511') === 0 ||
            ncm.indexOf('8301') === 0
          ) {
            cClassTribSugerido = '000001'
            regimeReformaSugerido =
              'Regime Geral — Peças, ferragens e componentes automotivos (tributação no destino)'
            creditoPresumidoReforma =
              'Tributação pelo princípio do destino; crédito amplo na apuração do adquirente PJ'
          }

          listaItens.push({
            numero_item: nItem,
            codigo_produto: cProd,
            descricao: xProd,
            ncm: ncm,
            cest: cest,
            cfop: cfop,
            unidade: uCom,
            quantidade: qCom,
            valor_unitario: vUnCom,
            valor_total: vProdItem,
            valor_desconto: vDescItem,
            valor_frete: vFreteItem,
            origem: origem,
            cst_icms: cstIcms,
            base_icms: baseIcmsItem,
            aliquota_icms: aliqIcmsItem,
            valor_icms: valIcmsItem,
            cst_icms_st: cest ? '10' : '',
            base_icms_st: baseIcmsStItem,
            aliquota_icms_st: aliqIcmsStItem,
            valor_icms_st: valIcmsStItem,
            cst_pis: cstPis,
            base_pis: basePis,
            aliquota_pis: aliqPis,
            valor_pis: valPis,
            cst_cofins: cstCofins,
            base_cofins: baseCofins,
            aliquota_cofins: aliqCofins,
            valor_cofins: valCofins,
            cst_ipi: cstIpi,
            aliquota_ipi: aliqIpi,
            valor_ipi: valIpi,
            cclass_trib_sugerido: cClassTribSugerido,
            regime_reforma_sugerido: regimeReformaSugerido,
            credito_presumido_reforma: creditoPresumidoReforma,
            // Campos IBSCBS
            ibscbs_cst: ibscbsCst,
            ibscbs_cclass_trib: ibscbsCclassTrib,
            ibscbs_vbc: ibscbsVbc,
            ibscbs_pibs_uf: ibscbsPibsUf,
            ibscbs_pibs_mun: ibscbsPibsMun,
            ibscbs_vibs: ibscbsVibs,
            ibscbs_pcbs: ibscbsPcbs,
            ibscbs_vcbs: ibscbsVcbs,
            ibscbs_vcredpres: ibscbsVcredpres,
            dados_ibscbs: dadosIbscbsItem,
            valor_difal_uf_dest: valDifalItem,
          })
        }

        // Deduplicação: verifica se a chave de acesso já existe no banco
        var nfeExistente = null
        try {
          nfeExistente = $app.findFirstRecordByData('nfes', 'chave_acesso', chave)
        } catch (_) {
          nfeExistente = null
        }

        var nfeRecord = nfeExistente || new Record(colNfe)
        var eraDuplicada = Boolean(nfeExistente)

        nfeRecord.set('chave_acesso', chave)
        nfeRecord.set('lote_id', loteRec.id)
        nfeRecord.set('numero', numero)
        nfeRecord.set('serie', serie)
        nfeRecord.set('natureza_operacao', natOp)
        nfeRecord.set('data_emissao', dhEmi)
        nfeRecord.set('data_saida_entrada', dhSaiEnt)
        nfeRecord.set('tipo_operacao', tipoOperacao)
        nfeRecord.set('tipo_compra_venda', tipoOperacao)
        nfeRecord.set('destinatario_tipo', destinatarioTipo)
        nfeRecord.set('ind_final', indFinal)

        if (clienteVinculado) {
          nfeRecord.set('cliente_id', clienteVinculado.id)
          nfeRecord.set('cliente_cnpj', clienteVinculado.cnpj)
          nfeRecord.set('cliente_nome', clienteVinculado.nome)
          nfeRecord.set('vinculo_cliente_status', 'vinculado')
        } else {
          nfeRecord.set('cliente_id', '')
          nfeRecord.set('cliente_cnpj', tipoOperacao === 'compra' ? destCnpjCpf : emitCnpjCpf)
          nfeRecord.set('cliente_nome', tipoOperacao === 'compra' ? destNome : emitNome)
          nfeRecord.set('vinculo_cliente_status', 'nao_localizado')
        }

        nfeRecord.set('emit_cnpj_cpf', emitCnpjCpf)
        nfeRecord.set('emit_razao_social', emitNome)
        nfeRecord.set('emit_nome_fantasia', emitFantasia)
        nfeRecord.set('emit_uf', emitUf)
        nfeRecord.set('emit_municipio', emitMun)
        nfeRecord.set('emit_ie', emitIe)
        nfeRecord.set('emit_crt', emitCrt)

        nfeRecord.set('dest_cnpj_cpf', destCnpjCpf)
        nfeRecord.set('dest_razao_social', destNome)
        nfeRecord.set('dest_uf', destUf)
        nfeRecord.set('dest_municipio', destMun)
        nfeRecord.set('dest_ie', destIe)

        // Intermediador / Marketplace / Transporte
        nfeRecord.set('intermediador_cnpj', intermedCnpj)
        nfeRecord.set('intermediador_nome', intermedNome)
        nfeRecord.set('intermediador_id', intermedId)
        nfeRecord.set('transportadora_nome', transpNome)
        nfeRecord.set('transportadora_cnpj', transpCnpj)

        // Totais
        nfeRecord.set('valor_produtos', vProd)
        nfeRecord.set('valor_frete', vFrete)
        nfeRecord.set('valor_seguro', vSeg)
        nfeRecord.set('valor_desconto', vDesc)
        nfeRecord.set('valor_outras_despesas', vOutro)
        nfeRecord.set('valor_total_nfe', vNF)

        nfeRecord.set('base_icms', vBC)
        nfeRecord.set('valor_icms', vICMS)
        nfeRecord.set('base_icms_st', vBCST)
        nfeRecord.set('valor_icms_st', vST)
        nfeRecord.set('valor_pis', vPIS)
        nfeRecord.set('valor_cofins', vCOFINS)
        nfeRecord.set('valor_ipi', vIPI)
        nfeRecord.set('valor_difal_uf_dest', vICMSUFDest)

        // Bloco IBSCBS totais
        nfeRecord.set('ibscbs_tot_vbc', ibscbsTotVbc)
        nfeRecord.set('ibscbs_tot_vibs', ibscbsTotVibs)
        nfeRecord.set('ibscbs_tot_vcbs', ibscbsTotVcbs)
        nfeRecord.set('ibscbs_tot_vcredpres', ibscbsTotVcredpres)
        nfeRecord.set('bloco_ibscbs', blocoIbscbsTotalObj)

        nfeRecord.set('forma_pagamento', tPag)
        nfeRecord.set('duplicatas', listaDuplicatas)
        nfeRecord.set('quantidade_itens', listaItens.length)
        nfeRecord.set('arquivo_origem', nomeArquivo)
        if (!eraDuplicada) {
          nfeRecord.set('analise_status', 'pendente')
        }

        $app.save(nfeRecord)

        // Se era duplicada, remove itens anteriores para evitar duplicidade de itens
        if (eraDuplicada) {
          try {
            var itensAntigos = $app.findRecordsByFilter(
              'nfes_itens',
              'nfe_id = "' + nfeRecord.id + '"',
              '',
              1000,
              0,
            )
            for (var k = 0; k < itensAntigos.length; k++) {
              $app.delete(itensAntigos[k])
            }
          } catch (_) {}
        }

        // Grava itens na coleção nfes_itens
        for (var m = 0; m < listaItens.length; m++) {
          var itemObj = listaItens[m]
          var itemRec = new Record(colItens)
          itemRec.set('nfe_id', nfeRecord.id)
          itemRec.set('chave_acesso', chave)
          itemRec.set('numero_item', itemObj.numero_item)
          itemRec.set('codigo_produto', itemObj.codigo_produto)
          itemRec.set('descricao', itemObj.descricao)
          itemRec.set('ncm', itemObj.ncm)
          itemRec.set('cest', itemObj.cest)
          itemRec.set('cfop', itemObj.cfop)
          itemRec.set('unidade', itemObj.unidade)
          itemRec.set('quantidade', itemObj.quantidade)
          itemRec.set('valor_unitario', itemObj.valor_unitario)
          itemRec.set('valor_total', itemObj.valor_total)
          itemRec.set('valor_desconto', itemObj.valor_desconto)
          itemRec.set('valor_frete', itemObj.valor_frete)

          itemRec.set('origem', itemObj.origem)
          itemRec.set('cst_icms', itemObj.cst_icms)
          itemRec.set('base_icms', itemObj.base_icms)
          itemRec.set('aliquota_icms', itemObj.aliquota_icms)
          itemRec.set('valor_icms', itemObj.valor_icms)
          itemRec.set('cst_icms_st', itemObj.cst_icms_st)
          itemRec.set('base_icms_st', itemObj.base_icms_st)
          itemRec.set('aliquota_icms_st', itemObj.aliquota_icms_st)
          itemRec.set('valor_icms_st', itemObj.valor_icms_st)

          itemRec.set('cst_pis', itemObj.cst_pis)
          itemRec.set('base_pis', itemObj.base_pis)
          itemRec.set('aliquota_pis', itemObj.aliquota_pis)
          itemRec.set('valor_pis', itemObj.valor_pis)

          itemRec.set('cst_cofins', itemObj.cst_cofins)
          itemRec.set('base_cofins', itemObj.base_cofins)
          itemRec.set('aliquota_cofins', itemObj.aliquota_cofins)
          itemRec.set('valor_cofins', itemObj.valor_cofins)

          itemRec.set('cst_ipi', itemObj.cst_ipi)
          itemRec.set('aliquota_ipi', itemObj.aliquota_ipi)
          itemRec.set('valor_ipi', itemObj.valor_ipi)

          itemRec.set('cclass_trib_sugerido', itemObj.cclass_trib_sugerido)
          itemRec.set('regime_reforma_sugerido', itemObj.regime_reforma_sugerido)
          itemRec.set('credito_presumido_reforma', itemObj.credito_presumido_reforma)

          // IBSCBS por item
          itemRec.set('ibscbs_cst', itemObj.ibscbs_cst)
          itemRec.set('ibscbs_cclass_trib', itemObj.ibscbs_cclass_trib)
          itemRec.set('ibscbs_vbc', itemObj.ibscbs_vbc)
          itemRec.set('ibscbs_pibs_uf', itemObj.ibscbs_pibs_uf)
          itemRec.set('ibscbs_pibs_mun', itemObj.ibscbs_pibs_mun)
          itemRec.set('ibscbs_vibs', itemObj.ibscbs_vibs)
          itemRec.set('ibscbs_pcbs', itemObj.ibscbs_pcbs)
          itemRec.set('ibscbs_vcbs', itemObj.ibscbs_vcbs)
          itemRec.set('ibscbs_vcredpres', itemObj.ibscbs_vcredpres)
          itemRec.set('dados_ibscbs', itemObj.dados_ibscbs)
          itemRec.set('valor_difal_uf_dest', itemObj.valor_difal_uf_dest)

          itemRec.set('parecer_item', {
            ncm: itemObj.ncm,
            cfop: itemObj.cfop,
            cest: itemObj.cest,
            cst_icms: itemObj.cst_icms,
            aliq_icms: itemObj.aliquota_icms,
            cst_pis: itemObj.cst_pis,
            cst_cofins: itemObj.cst_cofins,
            cclass_trib: itemObj.cclass_trib_sugerido,
            ibscbs: itemObj.dados_ibscbs,
          })

          $app.save(itemRec)
        }

        somaItens += listaItens.length
        somaProd += vProd
        somaNF += vNF

        if (eraDuplicada) {
          duplicadas++
          resultados.push({
            arquivo: nomeArquivo,
            status: 'duplicada',
            chave: chave,
            numero: numero,
            nfe_id: nfeRecord.id,
            cliente_vinculado: clienteVinculado
              ? clienteVinculado.nome
              : 'Consumidor final / Manual',
            cliente_cnpj: clienteVinculado
              ? clienteVinculado.cnpj
              : tipoOperacao === 'compra'
                ? destCnpjCpf
                : emitCnpjCpf,
            tipo: tipoOperacao,
            itens: listaItens.length,
            valor_total: vNF,
            motivo:
              'Chave já cadastrada anteriormente; itens e totais foram atualizados sem duplicação de nota.',
          })
        } else {
          processadasSucesso++
          resultados.push({
            arquivo: nomeArquivo,
            status: 'ok',
            chave: chave,
            numero: numero,
            nfe_id: nfeRecord.id,
            cliente_vinculado: clienteVinculado
              ? clienteVinculado.nome
              : 'Consumidor final / Manual',
            cliente_cnpj: clienteVinculado
              ? clienteVinculado.cnpj
              : tipoOperacao === 'compra'
                ? destCnpjCpf
                : emitCnpjCpf,
            tipo: tipoOperacao,
            itens: listaItens.length,
            valor_total: vNF,
          })
        }
      } catch (errNota) {
        erros++
        resultados.push({
          arquivo: nomeArquivo,
          status: 'erro',
          motivo: String(errNota).slice(0, 300),
        })
      }
    }

    // Atualiza o registro do lote
    var tipoLote = 'misto'
    var qtdCompras = tiposDetectados['compra'] || 0
    var qtdVendas = tiposDetectados['venda'] || 0
    if (qtdCompras > 0 && qtdVendas === 0) tipoLote = 'compra'
    else if (qtdVendas > 0 && qtdCompras === 0) tipoLote = 'venda'

    var statusFinal = 'concluido'
    if (erros > 0 && processadasSucesso > 0) statusFinal = 'concluido_com_erros'
    else if (erros > 0 && processadasSucesso === 0 && duplicadas === 0) statusFinal = 'falha'

    loteRec.set('processadas_sucesso', processadasSucesso)
    loteRec.set('duplicadas', duplicadas)
    loteRec.set('erros', erros)
    loteRec.set('total_itens', somaItens)
    loteRec.set('valor_total_produtos', Math.round(somaProd * 100) / 100)
    loteRec.set('valor_total_nf', Math.round(somaNF * 100) / 100)
    loteRec.set('tipo', tipoLote)
    loteRec.set('status', statusFinal)
    loteRec.set('resumo_arquivos', resultados)

    if (clienteDetectado) {
      loteRec.set('cliente_id', clienteDetectado.id)
      loteRec.set('cliente_cnpj', clienteDetectado.cnpj)
      loteRec.set('cliente_nome', clienteDetectado.nome)
    }

    $app.save(loteRec)

    return e.json(200, {
      success: true,
      lote_id: loteRec.id,
      status: statusFinal,
      total_arquivos: arquivos.length,
      processadas_sucesso: processadasSucesso,
      duplicadas: duplicadas,
      erros: erros,
      total_itens: somaItens,
      valor_total_produtos: Math.round(somaProd * 100) / 100,
      valor_total_nf: Math.round(somaNF * 100) / 100,
      tipo_predominante: tipoLote,
      cliente_vinculado: clienteDetectado,
      resultados: resultados,
    })
  } catch (errGeral) {
    console.log('Erro geral em nfe-processar-lote:', errGeral)
    return e.json(200, {
      success: false,
      error: 'Falha durante o processamento do lote de NFes: ' + String(errGeral).slice(0, 300),
      total_arquivos: 0,
      processadas_sucesso: 0,
      duplicadas: 0,
      erros: 1,
      resultados: [],
    })
  }
})
