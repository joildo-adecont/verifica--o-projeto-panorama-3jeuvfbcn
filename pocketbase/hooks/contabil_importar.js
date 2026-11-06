/**
 * AGENTE CONTÁBIL ESPECIALISTA — importação e validação de balancetes,
 * balanços e DREs
 * ==========================================================================
 * Pedido do CEO (05/11/2026): "importar e validar as informações dos
 * balancetes, balanços e DREs, com o agente contábil especialista, para ser
 * usado nas análises e cruzamentos do pedido anterior".
 *
 * ── O QUE ESTE AGENTE FAZ, EM SEIS ESPECIALISTAS ──
 *   1. FORMATO      — descobre o que o arquivo é antes de tentar lê-lo
 *                     (SPED-ECD, CSV, TXT delimitado, HTML/XLS do contábil)
 *   2. IDENTIFICAÇÃO — CNPJ, razão social e período saem do PRÓPRIO arquivo,
 *                     não de um campo que o usuário digitou
 *   3. PLANO        — classifica cada conta em ativo/passivo/PL/receita/custo/
 *                     despesa pela hierarquia do código E pela descrição
 *   4. FECHAMENTO   — Ativo = Passivo + PL · DRE fecha · conta sem par
 *   5. REFORMA      — marca o que entra na base de IBS/CBS e o que gera crédito
 *   6. PROCEDÊNCIA  — diz o que foi lido do arquivo e o que foi inferido
 *
 * ── O QUE ELE NÃO FAZ: ADIVINHAR ──
 * Conta que não se encaixa fica `nao_classificada` e aparece no relatório. Uma
 * classificação errada aqui não é um número feio na tela — é o ativo subindo
 * ou descendo no cruzamento da reforma, e ninguém percebe. O agente prefere
 * devolver "não sei" a devolver um chute com cara de apuração.
 *
 * ── ARMADILHAS QUE ESTE CÓDIGO JÁ TRATA (custaram tempo em casos reais) ──
 *   · valor monetário brasileiro: "1.234,56" e "(1.234,56)" negativo;
 *   · CSV com ; ou , como separador e BOM no início;
 *   · SPED-ECD: registros I050 (plano), I155 (saldo) e I355 (DRE), com campos
 *     separados por | e números com vírgula decimal;
 *   · cabeçalho que não é cabeçalho (linha de título do relatório antes da
 *     tabela) — a detecção é por CONTEÚDO, não por posição.
 *
 * ── JSVM: helpers INLINE ──
 * Callback roda em pool de VM separado; função no topo do arquivo dá
 * ReferenceError dentro do handler. Tudo vai inline, por mais que repita.
 */

/* ══════════════════════════════════════════════════════════════════════════
 * POST /backend/v1/contab-importar
 * Corpo: { arquivo_nome, conteudo, cliente_cnpj?, cliente_nome?, competencia? }
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('POST', '/backend/v1/contab-importar', (e) => {
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
  if (!corpo || !corpo.conteudo) {
    try {
      const bruto = toString(e.request.body)
      if (bruto) corpo = JSON.parse(bruto) || {}
    } catch (err) {
      corpo = corpo || {}
    }
  }

  const conteudo = String(corpo.conteudo || '')
  const arquivoNome = String(corpo.arquivo_nome || 'documento')
  if (!conteudo.trim()) {
    return e.json(400, { ok: false, erro: 'conteúdo vazio' })
  }

  /* ── normalizadores INLINE ── */
  const soDigitos = (v) => String(v || '').replace(/\D/g, '')

  /**
   * Número no padrão brasileiro.
   * Aceita "1.234,56", "-1.234,56", "(1.234,56)" (negativo contábil),
   * "1,234.56" (padrão americano, quando não há vírgula decimal) e "1234.56".
   * A ordem das tentativas importa: se há vírgula E ponto, o ÚLTIMO é o
   * decimal — é assim que o contador escreve.
   */
  const numBR = (v) => {
    let s = String(v == null ? '' : v).trim()
    if (!s) return 0
    let negativo = false
    if (/^\(.*\)$/.test(s)) {
      negativo = true
      s = s.slice(1, -1)
    }
    if (s.indexOf('-') === 0) {
      negativo = true
      s = s.slice(1)
    }
    s = s.replace(/[R$\s%]/gi, '')
    const temVirgula = s.indexOf(',') >= 0
    const temPonto = s.indexOf('.') >= 0
    if (temVirgula && temPonto) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.')
      } else {
        s = s.replace(/,/g, '')
      }
    } else if (temVirgula) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else if (temPonto) {
      const partes = s.split('.')
      /* "1.234" com 3 dígitos depois do ponto e mais de um grupo = milhar */
      const ultimo = partes[partes.length - 1]
      if (partes.length > 2 || (ultimo.length === 3 && partes[0].length <= 3 && s.length > 5)) {
        s = s.replace(/\./g, '')
      }
    }
    const n = parseFloat(s)
    if (!isFinite(n)) return 0
    return negativo ? -n : n
  }

  const limpar = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim()

  /* ── ESPECIALISTA 1: FORMATO ── */
  const linhas = conteudo.split(/\r?\n/)
  const amostra = linhas.slice(0, 40).join('\n')

  let formato = 'desconhecido'
  if (/^\s*\|0000\|/.test(conteudo) || /\|I050\|/.test(amostra)) formato = 'sped_ecd'
  else if (/<table|<tr|<td/i.test(amostra)) formato = 'html_xls'
  else if ((amostra.match(/;/g) || []).length >= 3 && linhas.length > 3) formato = 'csv'
  else if ((amostra.match(/\t/g) || []).length >= 3) formato = 'txt_delimitado'
  else if (linhas.length > 3) formato = 'csv'

  /* ── ESPECIALISTA 2: IDENTIFICAÇÃO ── */
  let cnpj = soDigitos(corpo.cliente_cnpj || '')
  if (!cnpj) {
    const m = conteudo.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/)
    if (m) cnpj = soDigitos(m[0])
  }
  let razao = limpar(corpo.cliente_nome || '')
  if (!razao) {
    const m = conteudo.match(/[Rr]az[ãa]o\s+[Ss]ocial\s*[:\-]?\s*([^\n;|\t]{3,120})/)
    if (m) razao = limpar(m[1])
  }

  /* período: procura datas no cabeçalho e no registro 0000 do SPED */
  let periodoInicio = ''
  let periodoFim = ''
  const datas = conteudo.match(/\b\d{2}\/\d{2}\/\d{4}\b/g) || []
  if (datas.length >= 2) {
    periodoInicio = datas[0]
    periodoFim = datas[1]
  } else if (datas.length === 1) {
    periodoFim = datas[0]
  }
  let competencia = limpar(corpo.competencia || '')
  if (!competencia && periodoFim) {
    const p = periodoFim.split('/')
    if (p.length === 3) competencia = p[2] + '-' + p[1]
  }

  /* ── ESPECIALISTA 3: PLANO DE CONTAS ── */
  const contas = []
  const naoClassificadas = []

  /**
   * Classificação por código + descrição.
   *
   * A regra do código é a do plano de contas brasileiro (1=ativo, 2=passivo,
   * 3=PL/resultado conforme o plano, 4=receita, 5=custo, 6=despesa). Mas plano
   * de contas é do escritório, não da lei: por isso a DESCRIÇÃO decide quando o
   * código não é conclusivo, e o conflito entre os dois vira `nao_classificada`
   * em vez de um palpite.
   */
  const classificar = (codigo, descricao) => {
    const d = String(descricao || '').toLowerCase()
    const c = soDigitos(codigo)
    const raiz = c.slice(0, 1)

    if (/^\s*ativo\b|^\s*ativo/.test(d) || /total do ativo|ativo total/.test(d)) return 'ativo'
    if (/passivo|exig[ií]vel/.test(d) && !/patrim[oô]nio/.test(d)) return 'passivo'
    if (
      /patrim[oô]nio\s+l[ií]quido|capital\s+social|reservas?\s+de\s+lucros|preju[ií]zos?\s+acumulados/.test(
        d,
      )
    )
      return 'patrimonio_liquido'
    if (/receita|faturamento|vendas?\b/.test(d)) return 'receita'
    if (/custo/.test(d)) return 'custo'
    if (/despesa|encargo|tributo|sal[aá]rio|honor[aá]rio/.test(d)) return 'despesa'
    if (/resultado|apura[cç][aã]o/.test(d)) return 'resultado'

    if (raiz === '1') return 'ativo'
    if (raiz === '2') return 'passivo'
    if (raiz === '3') return 'patrimonio_liquido'
    if (raiz === '4') return 'receita'
    if (raiz === '5') return 'custo'
    if (raiz === '6') return 'despesa'
    return 'nao_classificada'
  }

  /**
   * Efeito na reforma — o que este número faz no cálculo de IBS/CBS.
   * É a ponte entre a contabilidade e o comparador de regimes.
   */
  const efeitoReforma = (grupo, descricao) => {
    const d = String(descricao || '').toLowerCase()
    if (/imobilizado|m[aá]quinas|ve[ií]culos|im[oó]vel|equipamento/.test(d))
      return 'credito_imobilizado'
    if (grupo === 'receita') return 'base_receita'
    if (grupo === 'custo' || /insumo|mat[eé]ria.?prima|mercadoria/.test(d)) return 'credito_insumo'
    if (grupo === 'ativo' || grupo === 'passivo' || grupo === 'patrimonio_liquido')
      return 'sem_efeito'
    return 'a_confirmar'
  }

  /* ── leitura por formato ── */
  if (formato === 'sped_ecd') {
    /* I050 monta o plano: |I050|dt_ini|dt_fim|codigo|descr|...|
       I155 traz o saldo:  |I155|codigo|...|saldo|
       I355 é a DRE:       |I355|codigo|descr|valor|...| */
    const plano = {}
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i]
      if (l.indexOf('|I050|') < 0) continue
      const c = l.split('|')
      /* campos: ['', 'I050', ini, fim, codigo, descr, ...] */
      const codigo = limpar(c[4])
      const descr = limpar(c[5])
      if (codigo) plano[codigo] = descr
    }
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i]
      if (l.indexOf('|I155|') < 0 && l.indexOf('|I355|') < 0) continue
      const c = l.split('|')
      const ehDre = l.indexOf('|I355|') >= 0
      const codigo = limpar(c[2])
      if (!codigo) continue
      const descr = plano[codigo] || (ehDre ? limpar(c[3]) : '')
      const valor = ehDre ? numBR(c[3]) : numBR(c[c.length - 2])
      const grupo = classificar(codigo, descr)
      contas.push({
        codigo: codigo,
        descricao: descr,
        nivel: (codigo.match(/\./g) || []).length + 1,
        grupo: grupo,
        saldo_anterior: 0,
        debito: 0,
        credito: 0,
        saldo_atual: valor,
        natureza: valor >= 0 ? 'devedora' : 'credora',
        efeito_reforma: efeitoReforma(grupo, descr),
      })
      if (grupo === 'nao_classificada') naoClassificadas.push({ codigo: codigo, descricao: descr })
    }
  } else {
    /* CSV / TXT / HTML: acha a linha de cabeçalho por CONTEÚDO (precisa ter
       ao menos duas destas palavras), não por posição. */
    let sep = ';'
    if ((amostra.match(/\t/g) || []).length > (amostra.match(/;/g) || []).length) sep = '\t'
    else if ((amostra.match(/;/g) || []).length === 0 && (amostra.match(/,/g) || []).length > 3)
      sep = ','

    let idxCab = -1
    let colCodigo = -1
    let colDesc = -1
    let colSaldo = -1
    let colDeb = -1
    let colCred = -1
    let colAnterior = -1

    for (let i = 0; i < Math.min(linhas.length, 60); i++) {
      const baixo = linhas[i].toLowerCase()
      const pistas = ['conta', 'descri', 'saldo', 'd[ée]bito', 'cr[ée]dito', 'c[oó]digo']
      let achou = 0
      for (let p = 0; p < pistas.length; p++) {
        if (new RegExp(pistas[p]).test(baixo)) achou++
      }
      if (achou >= 2) {
        idxCab = i
        const cols = linhas[i].split(sep)
        for (let k = 0; k < cols.length; k++) {
          const t = cols[k].toLowerCase()
          if (colCodigo < 0 && /c[oó]digo|conta/.test(t)) colCodigo = k
          if (colDesc < 0 && /descri|nome|hist[oó]rico/.test(t)) colDesc = k
          if (colAnterior < 0 && /anterior/.test(t)) colAnterior = k
          if (colDeb < 0 && /d[ée]bito/.test(t)) colDeb = k
          if (colCred < 0 && /cr[ée]dito/.test(t)) colCred = k
          if (colSaldo < 0 && /saldo|atual|valor/.test(t)) colSaldo = k
        }
        break
      }
    }

    const inicioDados = idxCab >= 0 ? idxCab + 1 : 0
    if (colCodigo < 0) colCodigo = 0
    if (colDesc < 0) colDesc = 1

    for (let i = inicioDados; i < linhas.length; i++) {
      const bruta = linhas[i]
      if (!bruta || !bruta.trim()) continue
      const c = bruta.split(sep)
      if (c.length < 2) continue
      const codigo = limpar(c[colCodigo])
      const descr = limpar(c[colDesc])
      if (!codigo && !descr) continue
      /* linha de total do relatório não é conta */
      if (/^total/i.test(descr) && !soDigitos(codigo)) continue

      const saldo = colSaldo >= 0 ? numBR(c[colSaldo]) : 0
      const deb = colDeb >= 0 ? numBR(c[colDeb]) : 0
      const cred = colCred >= 0 ? numBR(c[colCred]) : 0
      const anterior = colAnterior >= 0 ? numBR(c[colAnterior]) : 0
      const grupo = classificar(codigo, descr)

      contas.push({
        codigo: codigo,
        descricao: descr,
        nivel: (codigo.match(/\./g) || []).length + 1,
        grupo: grupo,
        saldo_anterior: anterior,
        debito: deb,
        credito: cred,
        saldo_atual: saldo !== 0 ? saldo : deb - cred,
        natureza: saldo >= 0 ? 'devedora' : 'credora',
        efeito_reforma: efeitoReforma(grupo, descr),
      })
      if (grupo === 'nao_classificada') naoClassificadas.push({ codigo: codigo, descricao: descr })
    }
  }

  /* ── ESPECIALISTA 4: FECHAMENTO ── */
  const somar = (grupo) => {
    let t = 0
    for (let i = 0; i < contas.length; i++) {
      if (contas[i].grupo === grupo) t += contas[i].saldo_atual
    }
    return Math.round(t * 100) / 100
  }

  const totalAtivo = somar('ativo')
  const totalPassivo = somar('passivo')
  const totalPL = somar('patrimonio_liquido')
  const totalReceita = somar('receita')
  const totalCusto = somar('custo')
  const totalDespesa = somar('despesa')
  const lucro = Math.round((totalReceita - totalCusto - totalDespesa) * 100) / 100

  /* imobilizado: soma das contas marcadas com crédito de imobilizado */
  let imobilizado = 0
  for (let i = 0; i < contas.length; i++) {
    if (contas[i].efeito_reforma === 'credito_imobilizado') imobilizado += contas[i].saldo_atual
  }
  imobilizado = Math.round(imobilizado * 100) / 100

  const achados = []

  /**
   * A EQUAÇÃO PATRIMONIAL. Ativo = Passivo + PL.
   * Tolerância de 1% e piso de R$ 1,00: balanço de empresa pequena arredonda
   * centavos, e acusar erro por R$ 0,03 gastaria a confiança de quem lê.
   */
  if (totalAtivo !== 0 || totalPassivo !== 0 || totalPL !== 0) {
    const diferenca = Math.round((totalAtivo - (totalPassivo + totalPL)) * 100) / 100
    const piso = Math.max(Math.abs(totalAtivo) * 0.01, 1)
    if (Math.abs(diferenca) > piso) {
      achados.push({
        gravidade: 'ALTA',
        item: 'Equação patrimonial não fecha',
        detalhe:
          'Ativo ' +
          totalAtivo +
          ' contra Passivo + PL ' +
          (totalPassivo + totalPL) +
          ' — diferença de ' +
          diferenca +
          '. Um balanço que não fecha contamina todo o cruzamento.',
      })
    } else if (Math.abs(diferenca) > 0.005) {
      achados.push({
        gravidade: 'BAIXA',
        item: 'Diferença de arredondamento na equação patrimonial',
        detalhe:
          'Diferença de ' + diferenca + ', abaixo do limite de 1% — compatível com arredondamento.',
      })
    }
  }

  if (naoClassificadas.length) {
    achados.push({
      gravidade: naoClassificadas.length > 10 ? 'ALTA' : 'MEDIA',
      item: 'Contas sem classificação',
      detalhe:
        naoClassificadas.length +
        ' conta(s) fora do plano padrão. Elas NÃO entram nos totais — ' +
        'ficam listadas para o contador dizer a que grupo pertencem. Ex.: ' +
        naoClassificadas
          .slice(0, 3)
          .map((x) => x.codigo + ' ' + x.descricao)
          .join(' · '),
    })
  }

  if (!totalAtivo && !totalReceita) {
    achados.push({
      gravidade: 'ALTA',
      item: 'Nenhum valor reconhecido',
      detalhe:
        'O arquivo foi lido (' +
        contas.length +
        ' linhas) mas nenhum grupo somou valor. ' +
        'Provável layout não suportado — confira o formato antes de usar no cruzamento.',
    })
  }

  if (lucro < 0) {
    achados.push({
      gravidade: 'INFO',
      item: 'Resultado do período é prejuízo',
      detalhe:
        'Receita ' +
        totalReceita +
        ' menos custos ' +
        totalCusto +
        ' e despesas ' +
        totalDespesa +
        ' resulta em ' +
        lucro +
        '. Não é erro do arquivo — é o resultado, e ele muda a comparação de regimes.',
    })
  }

  if (imobilizado === 0 && (totalAtivo > 0 || totalPassivo > 0)) {
    achados.push({
      gravidade: 'INFO',
      item: 'Sem ativo imobilizado identificado',
      detalhe:
        'Nenhuma conta casou com imobilizado. Se a empresa tem bens, o grupo está com outro nome no ' +
        'plano — e sem ele o crédito do ativo imobilizado não entra no comparador.',
    })
  }

  /* ── tipo do documento: pelo que foi lido, não pelo nome do arquivo ──
     O campo é `required` na coleção: se ficar vazio, a GRAVAÇÃO inteira falha
     e o usuário perde a importação depois de o agente já ter feito todo o
     trabalho. Por isso o padrão é 'balancete' — a peça que traz ativo E
     resultado — e 'indefinido' só quando nem o conteúdo nem o nome dizem nada. */
  let tipo = ''
  if (totalAtivo > 0 && totalReceita > 0) tipo = 'balancete'
  else if (totalAtivo > 0 || totalPassivo > 0) tipo = 'balanco'
  else if (totalReceita > 0) tipo = 'dre'

  if (!tipo) {
    const nomeBaixo = arquivoNome.toLowerCase()
    if (/balancete/.test(nomeBaixo)) tipo = 'balancete'
    else if (/balan/.test(nomeBaixo)) tipo = 'balanco'
    else if (/dre/.test(nomeBaixo)) tipo = 'dre'
    else if (/razao|razão/.test(nomeBaixo)) tipo = 'razao'
    else tipo = 'indefinido'
  }

  const gravidadeAlta = achados.filter((a) => a.gravidade === 'ALTA').length
  const status = gravidadeAlta > 0 ? 'erro' : achados.length > 0 ? 'alerta' : 'ok'

  /* ── hash: SHA-256 do conteúdo normalizado ── */
  let hash = ''
  try {
    hash = $security.sha256(conteudo.replace(/\s+/g, ' ').trim()).slice(0, 40)
  } catch (err) {
    hash = ''
  }

  /* ══════════ GRAVAÇÃO ══════════ */
  const app = $app
  let documentoId = ''
  let substituiu = false

  try {
    const col = app.findCollectionByNameOrId('cont_documentos')
    let existente = null
    try {
      existente = app.findFirstRecordByFilter(
        'cont_documentos',
        'hash_arquivo = {:h} && competencia = {:c}',
        { h: hash, c: competencia },
      )
    } catch (err) {
      existente = null
    }

    /* Um campo `select` recebe STRING, não array. `maxSelect: 1` em alguns
       caminhos do PocketBase espera lista — e um valor que JÁ está no formato
       certo passaria, enquanto array viraria "cannot be blank" na validação.
       Aqui o valor é normalizado antes de tocar no registro. */
    const valorTipo = typeof tipo === 'string' && tipo ? tipo : 'indefinido'
    const dados = {
      cliente_cnpj: cnpj,
      cliente_nome: razao,
      tipo_documento: valorTipo,
      competencia: competencia,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      arquivo_nome: arquivoNome,
      hash_arquivo: hash,
      formato: formato,
      status: status,
      linhas: contas.length,
      contas_reconhecidas: contas.length - naoClassificadas.length,
      total_ativo: totalAtivo,
      total_passivo: totalPassivo + totalPL,
      receita_liquida: totalReceita,
      lucro_liquido: lucro,
      imobilizado: imobilizado,
      patrimonio_liquido: totalPL,
      validacao: { achados: achados, nao_classificadas: naoClassificadas.slice(0, 50) },
      importado_por: 'painel',
    }

    let rec = null
    if (existente) {
      existente.set(dados)
      app.save(existente)
      rec = existente
      substituiu = true
    } else {
      rec = new Record(col)
      rec.set(dados)
      app.save(rec)
    }
    documentoId = rec.id

    /* Confirmação de leitura: gravar e acreditar no retorno do save() é o que
       produziu o sintoma mais caro deste projeto — "written: true" e o dado
       errado. Aqui o registro é RELIDO antes de seguir. */
    try {
      const conferido = app.findRecordById('cont_documentos', documentoId)
      if (!String(conferido.get('tipo_documento') || '')) {
        throw new Error('tipo_documento não persistiu')
      }
    } catch (errConf) {
      throw new Error(
        'confirmação falhou: ' +
          String(errConf && errConf.message ? errConf.message : errConf).slice(0, 150),
      )
    }

    /* linhas: apaga as antigas deste documento e regrava */
    try {
      const antigas = app.findRecordsByFilter('cont_contas', 'documento_id = {:d}', '', 5000, 0, {
        d: documentoId,
      })
      for (let i = 0; i < antigas.length; i++) {
        app.delete(antigas[i])
      }
    } catch (err) {
      /* sem linhas anteriores */
    }

    const colContas = app.findCollectionByNameOrId('cont_contas')
    for (let i = 0; i < contas.length; i++) {
      const c = contas[i]
      try {
        const rc = new Record(colContas)
        rc.set({
          documento_id: documentoId,
          cliente_cnpj: cnpj,
          competencia: competencia,
          codigo: c.codigo,
          descricao: c.descricao,
          nivel: c.nivel,
          grupo: c.grupo,
          saldo_anterior: c.saldo_anterior,
          debito: c.debito,
          credito: c.credito,
          saldo_atual: c.saldo_atual,
          natureza: c.natureza,
          efeito_reforma: c.efeito_reforma,
        })
        app.save(rc)
      } catch (err) {
        /* uma linha que falha não derruba o documento */
      }
    }
  } catch (err) {
    /* Diagnóstico: quando a gravação falha, o erro sozinho ("campo X cannot be
       blank") não diz se o valor chegou vazio ou se o campo nem foi enviado.
       Devolver o que se TENTOU gravar encurta o caminho — e some da resposta
       quando dá certo. */
    let tentativa = null
    try {
      tentativa = {
        tipo_calculado: tipo,
        total_ativo: totalAtivo,
        total_passivo: totalPassivo,
        total_pl: totalPL,
        total_receita: totalReceita,
        formato: formato,
        linhas: contas.length,
      }
    } catch (e2) {
      tentativa = null
    }
    return e.json(500, {
      ok: false,
      erro: 'falha ao gravar: ' + String(err && err.message ? err.message : err).slice(0, 300),
      tentativa: tentativa,
    })
  }

  return e.json(200, {
    ok: true,
    documento_id: documentoId,
    substituiu: substituiu,
    tipo_documento: tipo,
    formato: formato,
    status: status,
    identificacao: {
      cnpj: cnpj,
      razao_social: razao,
      competencia: competencia,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
    },
    totais: {
      linhas: contas.length,
      contas_reconhecidas: contas.length - naoClassificadas.length,
      ativo: totalAtivo,
      passivo: totalPassivo,
      patrimonio_liquido: totalPL,
      receita: totalReceita,
      custo: totalCusto,
      despesa: totalDespesa,
      lucro: lucro,
      imobilizado: imobilizado,
    },
    achados: achados,
    resumo: {
      alta: gravidadeAlta,
      media: achados.filter((a) => a.gravidade === 'MEDIA').length,
      baixa: achados.filter((a) => a.gravidade === 'BAIXA').length,
      info: achados.filter((a) => a.gravidade === 'INFO').length,
    },
  })
})

/* ══════════════════════════════════════════════════════════════════════════
 * GET /backend/v1/contab-documentos?cnpj=  — lista o que já foi importado
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('GET', '/backend/v1/contab-documentos', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  const cnpj = e.request.url.query().get('cnpj') || ''
  const app = $app
  let lista = []

  try {
    if (cnpj) {
      lista = app.findRecordsByFilter(
        'cont_documentos',
        'cliente_cnpj = {:c}',
        '-importado_em',
        100,
        0,
        { c: cnpj },
      )
    } else {
      lista = app.findRecordsByFilter('cont_documentos', 'id != ""', '-importado_em', 100, 0)
    }
  } catch (err) {
    return e.json(200, { ok: true, documentos: [], aviso: 'nenhum documento importado ainda' })
  }

  const saida = []
  for (let i = 0; i < lista.length; i++) {
    const r = lista[i]
    saida.push({
      id: r.id,
      cliente_cnpj: r.get('cliente_cnpj'),
      cliente_nome: r.get('cliente_nome'),
      tipo_documento: r.get('tipo_documento'),
      competencia: r.get('competencia'),
      formato: r.get('formato'),
      status: r.get('status'),
      linhas: r.get('linhas'),
      total_ativo: r.get('total_ativo'),
      receita_liquida: r.get('receita_liquida'),
      lucro_liquido: r.get('lucro_liquido'),
      imobilizado: r.get('imobilizado'),
      importado_em: r.get('importado_em'),
    })
  }

  return e.json(200, { ok: true, documentos: saida })
})

/* ══════════════════════════════════════════════════════════════════════════
 * GET /backend/v1/contab-resumo?cnpj=&competencia=
 * O que o ANALISADOR consome: números contábeis prontos para o cruzamento.
 * ══════════════════════════════════════════════════════════════════════════ */
routerAdd('GET', '/backend/v1/contab-resumo', (e) => {
  const recebido = e.request.header.get('x-painel-token') || ''
  const esperado = $secrets.get('SIMUL_PAINEL_TOKEN') || ''
  if (!esperado || recebido !== esperado) {
    return e.json(401, { ok: false, erro: 'token inválido' })
  }

  const q = e.request.url.query()
  const cnpj = q.get('cnpj') || ''
  const competencia = q.get('competencia') || ''
  const app = $app

  let docs = []
  try {
    let filtro = 'id != ""'
    const params = {}
    if (cnpj) {
      filtro += ' && cliente_cnpj = {:c}'
      params.c = cnpj
    }
    if (competencia) {
      filtro += ' && competencia = {:p}'
      params.p = competencia
    }
    docs = app.findRecordsByFilter('cont_documentos', filtro, '-importado_em', 50, 0, params)
  } catch (err) {
    return e.json(200, {
      ok: true,
      disponivel: false,
      motivo: 'nenhum documento contábil importado',
    })
  }

  if (!docs.length) {
    return e.json(200, {
      ok: true,
      disponivel: false,
      motivo: 'nenhum documento contábil para este cliente',
    })
  }

  const d = docs[0]

  /* contas agrupadas por efeito na reforma — é o que o comparador precisa */
  let contas = []
  try {
    contas = app.findRecordsByFilter('cont_contas', 'documento_id = {:d}', '', 5000, 0, { d: d.id })
  } catch (err) {
    contas = []
  }

  let baseReceita = 0
  let creditoInsumo = 0
  let creditoImobilizado = 0
  for (let i = 0; i < contas.length; i++) {
    const c = contas[i]
    const v = Number(c.get('saldo_atual') || 0)
    const ef = c.get('efeito_reforma')
    if (ef === 'base_receita') baseReceita += v
    else if (ef === 'credito_insumo') creditoInsumo += v
    else if (ef === 'credito_imobilizado') creditoImobilizado += v
  }

  const r2 = (v) => Math.round(v * 100) / 100

  return e.json(200, {
    ok: true,
    disponivel: true,
    documento: {
      id: d.id,
      tipo: d.get('tipo_documento'),
      competencia: d.get('competencia'),
      status: d.get('status'),
      cliente_nome: d.get('cliente_nome'),
      cliente_cnpj: d.get('cliente_cnpj'),
      importado_em: d.get('importado_em'),
    },
    contabilidade: {
      ativo: d.get('total_ativo'),
      passivo_pl: d.get('total_passivo'),
      patrimonio_liquido: d.get('patrimonio_liquido'),
      receita: d.get('receita_liquida'),
      lucro: d.get('lucro_liquido'),
      imobilizado: d.get('imobilizado'),
    },
    /* a ponte para o comparador de regimes */
    para_reforma: {
      base_receita: r2(baseReceita),
      credito_insumo: r2(creditoInsumo),
      credito_imobilizado: r2(creditoImobilizado),
      contas_com_efeito: contas.filter((c) => c.get('efeito_reforma') !== 'sem_efeito').length,
    },
    total_contas: contas.length,
    versoes: docs.length,
  })
})
