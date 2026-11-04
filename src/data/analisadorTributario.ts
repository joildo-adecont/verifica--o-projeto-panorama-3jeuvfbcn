/**
 * ANALISADOR TRIBUTÁRIO — o motor que compara HOJE × REFORMA
 * ==========================================================
 * Pedido do CEO (04/11/2026): "elaborar análises finas com relação à tributação
 * atual e a tributação da reforma, com comparativos das duas, indicando por
 * produto, grupo, ramo e atividades relacionadas ao cliente, o melhor caminho
 * e/ou a melhor tributação para o cliente, realizando também simulações futuras."
 *
 * ── A DECISÃO QUE SUSTENTA ESTE ARQUIVO ──
 * Comparar regimes é fácil. Difícil é comparar sem mentir. A carga de hoje
 * depende de ICMS estadual, benefício fiscal, substituição tributária e regime
 * da empresa; a carga da reforma depende do tratamento do NCM e do ano da
 * transição. Um número único por cliente seria ficção com aparência de cálculo.
 *
 * Por isso o motor trabalha em três níveis, e a tela sempre mostra de qual dela
 * veio a resposta:
 *
 *   NÍVEL 1 — PRODUTO (NCM): a única comparação que pode ser exata, porque o
 *     tratamento do NCM está na lei e a alíquota modal do ICMS está declarada.
 *   NÍVEL 2 — GRUPO / RAMO: agregação por segmento. É média ponderada pelo
 *     valor, não média de médias — senão um item de R$ 10 pesaria igual a um de
 *     R$ 1 milhão.
 *   NÍVEL 3 — CLIENTE: o consolidado. Aqui a resposta é uma FAIXA, não um
 *     número, porque a incerteza dos níveis anteriores se acumula.
 *
 * ── O QUE ELE NÃO FAZ ──
 * Não escolhe regime tributário pelo cliente, não sugere "migrar para o
 * Simples" e não afirma economia garantida. Ele mostra quanto cada caminho
 * custa HOJE e quanto tende a custar na REFORMA, com o ano em que a diferença
 * aparece, e deixa a decisão com quem responde por ela.
 */

import { CBS_POR_ANO, IBS_REF, REF_TOTAL, ibsDoAno, totalDoAno } from '@/data/aliquotas'
import { cargaAtual, RESSALVA_COMPARACAO } from '@/data/aliquotasAtuais'
import { classificarNCM, soDigitos } from '@/data/motorClassificacao'

/** Anos da transição que o analisador projeta. */
export const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]

/** Um item já lido do XML, com o que o motor precisa. */
export interface ItemAnalise {
  ncm: string
  descricao: string
  valor: number
  direcao: 'entrada' | 'saida' | ''
  cfop?: string
  uf?: string
}

/**
 * CLASSIFICAÇÃO DE UM PRODUTO — nível 1.
 *
 * Devolve a carga de hoje, a carga da reforma no regime pleno, e a diferença.
 * A comparação é feita SOBRE O MESMO VALOR — é isso que a torna legível: "neste
 * produto, hoje pesa X% e na reforma pesa Y%".
 */
export interface AnaliseProduto {
  ncm: string
  descricao: string
  valor: number
  direcao: string
  /** tratamento na reforma */
  tratamento: string
  anexo: string
  /** fator da reforma (0 = zero, 0,4 = redução 60%, 1 = integral) */
  fator: number
  /** a regra veio do NCM exato ou da posição? */
  conferir: boolean
  /** incide Imposto Seletivo por fora */
  temIS: boolean
  /** regimes aplicáveis que NÃO alteram alíquota */
  regimes: string[]
  /** carga de hoje, em % do valor */
  cargaHoje: number
  /** carga na reforma plena (2033), em % do valor */
  cargaReforma: number
  /** diferença em pontos percentuais (negativo = reforma mais barata) */
  variacaoPP: number
  /** diferença em reais sobre o valor deste item */
  variacaoReais: number
  /** leitura em uma frase */
  leitura: string
}

/** Alíquota efetiva da reforma num ano, dado o fator do tratamento. */
export function reformaNoAno(ano: number, fator: number): number {
  const total = totalDoAno(ano)
  return Math.round(total * fator * 100) / 100
}

/**
 * ANALISA UM PRODUTO.
 *
 * `uf` é a do estabelecimento que opera — é ela que define o ICMS de hoje. Sem
 * ela, o motor usa a referência e AVISA na leitura, porque 18% de São Paulo não
 * é 17% do Rio Grande do Sul e a diferença muda a conclusão em alguns produtos.
 */
export function analisarProduto(item: ItemAnalise, ufCliente: string): AnaliseProduto {
  const cls = classificarNCM(item.ncm)
  const atual = cargaAtual(ufCliente)
  const fator = cls.fator

  /* Carga de hoje sobre este produto: ICMS modal + fundo + PIS/COFINS.
     Para produto com alíquota zero na reforma, a comparação é direta. */
  const cargaHoje = atual.total

  /* Carga na reforma plena: 30,00% × fator do tratamento. */
  const cargaReforma = Math.round(REF_TOTAL * fator * 100) / 100

  const variacaoPP = Math.round((cargaReforma - cargaHoje) * 100) / 100
  const variacaoReais = Math.round(((cargaReforma - cargaHoje) / 100) * item.valor * 100) / 100

  const tratamento = cls.encontrado && cls.regra ? cls.regra.tratamento : 'Tributação integral'
  const anexo = cls.encontrado && cls.regra ? cls.regra.anexo : '—'

  let leitura: string
  if (!soDigitos(item.ncm)) {
    leitura = 'Sem NCM: não há como comparar. É lacuna do documento, não escolha do sistema.'
  } else if (!cls.encontrado) {
    leitura =
      `Sem regra de alíquota nos Anexos: paga a integral (${cargaReforma.toFixed(2).replace('.', ',')}%) ` +
      `contra ${cargaHoje.toFixed(2).replace('.', ',')}% de hoje. ` +
      (variacaoPP > 0
        ? 'A reforma AUMENTA a carga deste produto.'
        : 'A reforma reduz a carga deste produto.')
  } else if (fator === 0) {
    leitura =
      `Alíquota zero na reforma (${anexo}): de ${cargaHoje.toFixed(2).replace('.', ',')}% ` +
      `para 0%. É o melhor tratamento da lei para este produto.`
  } else if (fator < 1) {
    leitura =
      `${tratamento} (${anexo}): de ${cargaHoje.toFixed(2).replace('.', ',')}% ` +
      `para ${cargaReforma.toFixed(2).replace('.', ',')}%. ` +
      `Reduz ${Math.abs(variacaoPP).toFixed(2).replace('.', ',')} ponto(s) percentual.`
  } else {
    leitura =
      `Tributação integral (${cargaReforma.toFixed(2).replace('.', ',')}%) contra ` +
      `${cargaHoje.toFixed(2).replace('.', ',')}% de hoje: ` +
      `aumento de ${Math.abs(variacaoPP).toFixed(2).replace('.', ',')} pontos.`
  }

  if (cls.seletivos.length > 0) {
    leitura += ' ATENÇÃO: incide Imposto Seletivo por fora do IBS/CBS — a carga real é maior.'
  }
  if (atual.divergente) {
    leitura += ` Ressalva: as fontes divergem para ${String(ufCliente).toUpperCase()} — conferir a alíquota.`
  }
  if (cls.conferir) {
    leitura += ' Casamento pela posição do NCM, não pelo código exato: conferir.'
  }

  return {
    ncm: item.ncm,
    descricao: item.descricao,
    valor: item.valor,
    direcao: item.direcao,
    tratamento,
    anexo,
    fator,
    conferir: cls.conferir,
    temIS: cls.seletivos.length > 0,
    regimes: cls.regimes.map((r) => r.tratamento),
    cargaHoje,
    cargaReforma,
    variacaoPP,
    variacaoReais,
    leitura,
  }
}

/**
 * AGREGA POR GRUPO — nível 2.
 *
 * A ponderação é por VALOR, não por quantidade de itens. Média simples de
 * percentuais é erro clássico: um parafuso de R$ 5 com 0% pesaria igual a um
 * equipamento de R$ 500 mil com 30%, e o resultado não descreveria a empresa.
 */
export interface AnaliseGrupo {
  chave: string
  nome: string
  itens: number
  valor: number
  cargaHojePonderada: number
  cargaReformaPonderada: number
  variacaoPP: number
  variacaoReais: number
  /** o grupo é vantajoso na reforma? */
  tendencia: 'melhora' | 'piora' | 'neutro'
}

/** Agrupa por tratamento da reforma — é o recorte que mostra onde a lei ajuda. */
export function agruparPorTratamento(produtos: AnaliseProduto[]): AnaliseGrupo[] {
  const mapa: Record<
    string,
    { itens: number; valor: number; somaHoje: number; somaReforma: number }
  > = {}
  for (const p of produtos) {
    const k = p.tratamento
    if (!mapa[k]) mapa[k] = { itens: 0, valor: 0, somaHoje: 0, somaReforma: 0 }
    mapa[k].itens++
    mapa[k].valor += p.valor
    mapa[k].somaHoje += (p.cargaHoje / 100) * p.valor
    mapa[k].somaReforma += (p.cargaReforma / 100) * p.valor
  }

  const out: AnaliseGrupo[] = []
  for (const k in mapa) {
    const m = mapa[k]
    const hoje = m.valor > 0 ? (m.somaHoje / m.valor) * 100 : 0
    const reforma = m.valor > 0 ? (m.somaReforma / m.valor) * 100 : 0
    const varPP = reforma - hoje
    out.push({
      chave: k,
      nome: k,
      itens: m.itens,
      valor: Math.round(m.valor * 100) / 100,
      cargaHojePonderada: Math.round(hoje * 100) / 100,
      cargaReformaPonderada: Math.round(reforma * 100) / 100,
      variacaoPP: Math.round(varPP * 100) / 100,
      variacaoReais: Math.round((m.somaReforma - m.somaHoje) * 100) / 100,
      tendencia: Math.abs(varPP) < 0.01 ? 'neutro' : varPP > 0 ? 'piora' : 'melhora',
    })
  }
  out.sort((a, b) => b.valor - a.valor)
  return out
}

/**
 * AGRUPA POR NCM (produto) — para ver quais poucos produtos carregam o
 * resultado. Se 5 NCMs respondem por 80% do valor, a análise fina deles decide
 * o cliente inteiro — e o esforço de classificar o resto pode esperar.
 */
export function agruparPorNCM(produtos: AnaliseProduto[]): AnaliseGrupo[] {
  const mapa: Record<
    string,
    { itens: number; valor: number; somaHoje: number; somaReforma: number; nome: string }
  > = {}
  for (const p of produtos) {
    const k = p.ncm || '(sem NCM)'
    if (!mapa[k]) mapa[k] = { itens: 0, valor: 0, somaHoje: 0, somaReforma: 0, nome: p.descricao }
    mapa[k].itens++
    mapa[k].valor += p.valor
    mapa[k].somaHoje += (p.cargaHoje / 100) * p.valor
    mapa[k].somaReforma += (p.cargaReforma / 100) * p.valor
  }
  const out: AnaliseGrupo[] = []
  for (const k in mapa) {
    const m = mapa[k]
    const hoje = m.valor > 0 ? (m.somaHoje / m.valor) * 100 : 0
    const reforma = m.valor > 0 ? (m.somaReforma / m.valor) * 100 : 0
    const varPP = reforma - hoje
    out.push({
      chave: k,
      nome: m.nome,
      itens: m.itens,
      valor: Math.round(m.valor * 100) / 100,
      cargaHojePonderada: Math.round(hoje * 100) / 100,
      cargaReformaPonderada: Math.round(reforma * 100) / 100,
      variacaoPP: Math.round(varPP * 100) / 100,
      variacaoReais: Math.round((m.somaReforma - m.somaHoje) * 100) / 100,
      tendencia: Math.abs(varPP) < 0.01 ? 'neutro' : varPP > 0 ? 'piora' : 'melhora',
    })
  }
  out.sort((a, b) => b.valor - a.valor)
  return out
}

/**
 * CONSOLIDADO DO CLIENTE — nível 3.
 *
 * Devolve a comparação em FAIXA. A razão: a carga de hoje é modal (não a
 * efetiva de cada produto) e parte dos NCMs pode não ter regra. Reportar um
 * número único daria precisão que não existe.
 */
export interface ConsolidadoCliente {
  itens: number
  itensClassificados: number
  itensComIS: number
  valorTotal: number
  cargaHojePonderada: number
  cargaReformaPonderada: number
  variacaoPP: number
  variacaoReais: number
  /** faixa de incerteza em pontos percentuais */
  margemPP: number
  /** dois extremos plausíveis */
  cenarioMinPP: number
  cenarioMaxPP: number
  uf: string
  ufDivergente: boolean
  leitura: string
}

export function consolidar(produtos: AnaliseProduto[], uf: string): ConsolidadoCliente {
  let valor = 0
  let somaHoje = 0
  let somaReforma = 0
  let classificados = 0
  let comIS = 0

  for (const p of produtos) {
    valor += p.valor
    somaHoje += (p.cargaHoje / 100) * p.valor
    somaReforma += (p.cargaReforma / 100) * p.valor
    if (p.tratamento !== 'Tributação integral') classificados++
    if (p.temIS) comIS++
  }

  const hoje = valor > 0 ? (somaHoje / valor) * 100 : 0
  const reforma = valor > 0 ? (somaReforma / valor) * 100 : 0
  const varPP = reforma - hoje

  /* A margem cresce com a proporção de itens não classificados: se metade dos
     itens não tem regra, a incerteza é alta. 2 p.p. por 50% de não classificados
     é uma estimativa conservadora, declarada como estimativa. */
  const naoClassificados = produtos.length - classificados
  const proporcaoNaoClass = produtos.length > 0 ? naoClassificados / produtos.length : 0
  const margem = Math.round(proporcaoNaoClass * 2 * 100) / 100

  const atual = cargaAtual(uf)

  let leitura: string
  if (produtos.length === 0) {
    leitura = 'Nenhum item para analisar. Importe documentos deste cliente primeiro.'
  } else if (Math.abs(varPP) < 0.5) {
    leitura =
      `Carga praticamente equivalente: ${hoje.toFixed(2).replace('.', ',')}% hoje contra ` +
      `${reforma.toFixed(2).replace('.', ',')}% na reforma.`
  } else if (varPP > 0) {
    leitura =
      `A reforma AUMENTA a carga em ${Math.abs(varPP).toFixed(2).replace('.', ',')} pontos ` +
      `(${hoje.toFixed(2).replace('.', ',')}% → ${reforma.toFixed(2).replace('.', ',')}%). ` +
      `${comIS > 0 ? `${comIS} item(ns) com Imposto Seletivo agravam o quadro. ` : ''}` +
      `O caminho é revisar enquadramento e confirmar o tratamento de cada NCM.`
  } else {
    leitura =
      `A reforma REDUZ a carga em ${Math.abs(varPP).toFixed(2).replace('.', ',')} pontos ` +
      `(${hoje.toFixed(2).replace('.', ',')}% → ${reforma.toFixed(2).replace('.', ',')}%). ` +
      `Impacto de R$ ${Math.abs(Math.round((somaReforma - somaHoje) * 100) / 100)
        .toFixed(2)
        .replace('.', ',')} sobre o valor movimentado.`
  }

  if (classificados < produtos.length) {
    leitura += ` ${produtos.length - classificados} de ${produtos.length} item(ns) sem regra de alíquota: receberam a integral por presunção.`
  }
  if (atual.divergente) {
    leitura += ` Alíquota de ${String(uf).toUpperCase()} é divergente entre as fontes: conferir.`
  }

  return {
    itens: produtos.length,
    itensClassificados: classificados,
    itensComIS: comIS,
    valorTotal: Math.round(valor * 100) / 100,
    cargaHojePonderada: Math.round(hoje * 100) / 100,
    cargaReformaPonderada: Math.round(reforma * 100) / 100,
    variacaoPP: Math.round(varPP * 100) / 100,
    variacaoReais: Math.round((somaReforma - somaHoje) * 100) / 100,
    margemPP: margem,
    cenarioMinPP: Math.round((varPP - margem) * 100) / 100,
    cenarioMaxPP: Math.round((varPP + margem) * 100) / 100,
    uf: String(uf || '').toUpperCase(),
    ufDivergente: atual.divergente,
    leitura,
  }
}

/**
 * SIMULAÇÃO POR ANO — a série da transição sobre a carteira real.
 *
 * Aqui a resposta muda de ano para ano e é isso que o CEO quer ver: em 2027 o
 * IBS ainda é teste (0,1%) e a CBS entra cheia; o pico da diferença costuma
 * aparecer entre 2029 e 2032, quando o IBS sobe por degraus. O número de 2033
 * é o regime pleno e não deve ser lido como "o que vai acontecer em 2027".
 */
export interface SimulacaoAno {
  ano: number
  /** carga da reforma naquele ano, em % (fator já aplicado) */
  cargaReforma: number
  /** a mesma base, sem o tratamento por NCM — para mostrar o efeito da lei */
  cargaSemTratamento: number
  /** carga de hoje, repetida para comparação */
  cargaHoje: number
  variacaoPP: number
  variacaoReais: number
  fase: string
  /** é o ano em que a diferença é maior? */
  pico: boolean
}

export function simularPorAno(
  produtos: AnaliseProduto[],
  uf: string,
): { anos: SimulacaoAno[]; pico: number; resumo: string } {
  const atual = cargaAtual(uf)
  let valorFator = 0
  let valorCheio = 0

  for (const p of produtos) {
    valorFator += (p.cargaReforma / 100) * p.valor // já tem o fator aplicado
    valorCheio += p.valor
  }

  /* Proporção da carga plena que a carteira efetivamente paga — é o fator médio
     ponderado. Usar a média simples distorceria: um item de R$ 5 com 0% não
     pode pesar igual a um de R$ 500 mil. */
  const fatorMedio = valorCheio > 0 ? valorFator / ((REF_TOTAL / 100) * valorCheio) : 1

  const anos: SimulacaoAno[] = ANOS.map((ano) => {
    const total = totalDoAno(ano)
    const cbs = CBS_POR_ANO[ano] ?? 0
    const ibs = ibsDoAno(ano)
    const cargaReforma = Math.round(total * fatorMedio * 100) / 100 || 0
    const cargaSemTratamento = Math.round(total * 100) / 100
    const variacaoPP = Math.round((cargaReforma - atual.total) * 100) / 100
    const variacaoReais = Math.round(((cargaReforma - atual.total) / 100) * valorCheio * 100) / 100
    const fase =
      ano <= 2026
        ? 'teste (CBS 0,9% · IBS 0,1%)'
        : ano <= 2028
          ? `CBS ${cbs.toFixed(2).replace('.', ',')}% · IBS em teste (${ibs.toFixed(2).replace('.', ',')}%)`
          : ano === 2033
            ? 'regime pleno'
            : `transição do IBS (${ibs.toFixed(2).replace('.', ',')}%)`
    return {
      ano,
      cargaReforma,
      cargaSemTratamento,
      cargaHoje: atual.total,
      variacaoPP,
      variacaoReais,
      fase,
      pico: false,
    }
  })

  /**
   * O pico é procurado DE 2027 EM DIANTE, e isso é uma decisão, não detalhe.
   *
   * Em 2026 a reforma está em fase de teste (CBS 0,9% + IBS 0,1%): a diferença
   * contra a carga atual é maxima justamente porque quase nada é cobrado. Dizer
   * que "2026 é o pior ano" seria ler o número ao contrário — é o ano mais
   * leve, não o mais pesado. O impacto real começa em 2027, com a CBS cheia.
   */
  let pico = 2027
  let maior = -Infinity
  for (const a of anos) {
    if (a.ano < 2027) continue
    if (Math.abs(a.variacaoPP) > maior) {
      maior = Math.abs(a.variacaoPP)
      pico = a.ano
    }
  }
  for (const a of anos) a.pico = a.ano === pico

  const anoPico = anos.find((a) => a.pico)!

  /* Ano de MAIOR CARGA — conceito diferente do pico de diferença. Em 2027 a
     diferença é grande porque a CBS entra cheia e o IBS ainda é teste; a maior
     carga absoluta, porém, só chega em 2033, com o regime pleno. Os dois números
     são úteis e não devem ser confundidos. */
  let anoMaiorCarga = 2033
  let maiorCarga = -Infinity
  for (const a of anos) {
    if (a.cargaReforma > maiorCarga) {
      maiorCarga = a.cargaReforma
      anoMaiorCarga = a.ano
    }
  }

  const resumo =
    `A maior DIFERENÇA contra hoje aparece em ${pico}: ` +
    `${anoPico.cargaReforma.toFixed(2).replace('.', ',')}% contra ` +
    `${atual.total.toFixed(2).replace('.', ',')}% ` +
    `(${anoPico.variacaoPP > 0 ? '+' : ''}${anoPico.variacaoPP.toFixed(2).replace('.', ',')} pontos). ` +
    `A maior CARGA absoluta é em ${anoMaiorCarga}: ` +
    `${maiorCarga.toFixed(2).replace('.', ',')}%. ` +
    `O fator médio de tratamento da carteira é ${(fatorMedio * 100).toFixed(1).replace('.', ',')}% da referência.`

  return { anos, pico, resumo }
}

/**
 * O MELHOR CAMINHO — a resposta que o CEO pediu, com o que a sustenta.
 *
 * Não é uma receita: é a leitura do que os números mostram, com as ações que
 * mudam o resultado. Cada recomendação carrega o motivo e o limite.
 */
export interface Recomendacao {
  prioridade: 'alta' | 'media' | 'baixa'
  titulo: string
  motivo: string
  acao: string
  impacto: string
}

export function recomendar(
  produtos: AnaliseProduto[],
  consolidado: ConsolidadoCliente,
): Recomendacao[] {
  const out: Recomendacao[] = []

  /* 1. Itens sem regra de alíquota — o ponto cego */
  const semRegra = produtos.filter(
    (p) => p.tratamento === 'Tributação integral' && soDigitos(p.ncm),
  )
  if (semRegra.length > 0) {
    const valorSemRegra = semRegra.reduce((s, p) => s + p.valor, 0)
    out.push({
      prioridade: 'alta',
      titulo: `${semRegra.length} produto(s) sem regra de alíquota nos Anexos`,
      motivo:
        'Receberam a alíquota integral por presunção legal, não por decisão. Pode haver ' +
        'enquadramento em anexo que não foi reconhecido pelo NCM declarado.',
      acao:
        'Conferir a descrição do produto contra os Anexos da LC 214. Se houver enquadramento, ' +
        'a classificação correta reduz a carga; o código do produto pode estar genérico.',
      impacto: `R$ ${valorSemRegra.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} movimentados nesta condição`,
    })
  }

  /* 2. Produtos que pioram — onde a reforma pesa */
  const piores = produtos
    .filter((p) => p.variacaoPP > 0.5)
    .sort((a, b) => b.variacaoReais - a.variacaoReais)
  if (piores.length > 0) {
    const impacto = piores.reduce((s, p) => s + p.variacaoReais, 0)
    out.push({
      prioridade: 'alta',
      titulo: `${piores.length} produto(s) com carga MAIOR na reforma`,
      motivo:
        'Nestes itens a alíquota da reforma supera a carga atual. É o grupo que exige ' +
        'planejamento — e o principal argumento para revisar preço e cadeia de fornecedores.',
      acao:
        'Revisar a formação de preço destes itens e verificar se há substituto com tratamento ' +
        'melhor. Verificar também o crédito: na reforma o crédito é amplo, o que pode compensar ' +
        'parte do aumento na ponta compradora.',
      impacto: `aumento de R$ ${Math.abs(impacto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sobre o valor movimentado`,
    })
  }

  /* 3. Produtos que melhoram — onde está o ganho */
  const melhores = produtos
    .filter((p) => p.variacaoPP < -0.5)
    .sort((a, b) => a.variacaoReais - b.variacaoReais)
  if (melhores.length > 0) {
    const ganho = melhores.reduce((s, p) => s + p.variacaoReais, 0)
    out.push({
      prioridade: 'media',
      titulo: `${melhores.length} produto(s) com carga MENOR na reforma`,
      motivo:
        'São os itens em que a lei reduz a alíquota (zero, 60%, 30%). É onde o cliente ganha, ' +
        'e onde vale concentrar esforço de conferência: um erro aqui custa o benefício.',
      acao:
        'Confirmar o enquadramento no Anexo correto e garantir que a descrição do produto na ' +
        'nota sustente o benefício. Documentação fraca é o que faz o benefício cair na fiscalização.',
      impacto: `redução de R$ ${Math.abs(ganho).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sobre o valor movimentado`,
    })
  }

  /* 4. Imposto Seletivo */
  if (consolidado.itensComIS > 0) {
    out.push({
      prioridade: 'alta',
      titulo: `${consolidado.itensComIS} item(ns) sujeitos a Imposto Seletivo`,
      motivo:
        'O IS incide POR FORA do IBS/CBS e não está somado nas comparações acima. É carga ' +
        'adicional que pode inverter a conclusão de vantagem em produtos específicos.',
      acao:
        'Levantar a alíquota de IS de cada produto em lei e refazer o cálculo incluindo-a. ' +
        'Enquanto ela não entrar, estes itens estão subestimados.',
      impacto: 'carga real maior que a apresentada',
    })
  }

  /* 5. Casamento por posição */
  const porPosicao = produtos.filter((p) => p.conferir)
  if (porPosicao.length > 0) {
    out.push({
      prioridade: 'media',
      titulo: `${porPosicao.length} produto(s) classificados pela posição do NCM, não pelo código exato`,
      motivo:
        'A regra encontrada vale para a posição de 4 dígitos. Pode haver distinção por ' +
        'subposição que mude o tratamento — mussarela e queijo coalho são o exemplo clássico: ' +
        'mesmo produto para o mercado, tratamentos opostos na lei.',
      acao: 'Conferir item a item na Tabela Geral dos Anexos (Seção 7A) e confirmar a subposição.',
      impacto: 'pode alterar o tratamento de cada item conferido',
    })
  }

  /* 6. UF divergente */
  if (consolidado.ufDivergente) {
    out.push({
      prioridade: 'media',
      titulo: `Alíquota de ${consolidado.uf} divergente entre as fontes públicas`,
      motivo:
        'A comparação usa a alíquota modal base da compilação. Para esta UF as compilações ' +
        'não convergem, e a diferença muda o ponto de equilíbrio.',
      acao: 'Confirmar a alíquota vigente no RICMS estadual antes de levar o número ao cliente.',
      impacto: 'pode alterar a conclusão em poucos pontos percentuais',
    })
  }

  /* 7. Concentração — onde o esforço rende mais */
  const ordenados = [...produtos].sort((a, b) => b.valor - a.valor)
  let acum = 0
  let quantos = 0
  const totalValor = ordenados.reduce((s, p) => s + p.valor, 0)
  for (const p of ordenados) {
    acum += p.valor
    quantos++
    if (totalValor > 0 && acum / totalValor >= 0.8) break
  }
  if (quantos > 0 && quantos < ordenados.length) {
    out.push({
      prioridade: 'baixa',
      titulo: `${quantos} de ${ordenados.length} produtos respondem por 80% do valor`,
      motivo:
        'A análise fina destes poucos itens decide o resultado do cliente. Classificar o ' +
        'resto é importante para a escrituração, mas não muda a conclusão econômica.',
      acao: 'Concentrar a conferência neste grupo e tratar os demais em lote.',
      impacto: 'esforço de conferência concentrado onde há efeito',
    })
  }

  const peso = { alta: 0, media: 1, baixa: 2 }
  out.sort((a, b) => peso[a.prioridade] - peso[b.prioridade])
  return out
}

/** Reexporta a ressalva para a tela mostrar junto do resultado. */
export { RESSALVA_COMPARACAO, IBS_REF, REF_TOTAL }
