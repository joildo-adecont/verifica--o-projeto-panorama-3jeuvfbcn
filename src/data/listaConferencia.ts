/**
 * LISTA DE CONFERÊNCIA DE NCM — o trabalho dirigido que o CEO pediu
 * ================================================================
 * Pedido (04/11/2026): "levantar quais NCMs aparecem sem regra em toda a base
 * importada e montar uma lista de conferência: isso transforma o '7 de 10' em
 * trabalho dirigido, em vez de dúvida."
 *
 * ── A DISTINÇÃO QUE DÁ VALOR À LISTA ──
 * "Sem regra de alíquota" pode significar duas coisas opostas, e tratá-las igual
 * faria a lista parecer maior do que é:
 *
 *   CASO A — o CAPÍTULO do NCM tem regras, mas este código não casou.
 *     Quase sempre é NCM genérico ("21069090 — preparações alimentícias diversas")
 *     ou descrição frouxa na nota. AQUI a conferência rende: pode haver
 *     benefício que a nota não permitiu reconhecer.
 *
 *   CASO B — o CAPÍTULO inteiro não tem nenhuma regra de alíquota.
 *     O produto paga a integral porque a lei não previu redução para ele.
 *     Conferir rende pouco, mas CONFIRMA — e confirmar também é trabalho.
 *
 * Sem essa separação, o contador abriria 100 itens para descobrir que 70 nunca
 * teriam benefício. Com ela, começa pelos que têm.
 *
 * ── O QUE ESTA LISTA NÃO FAZ ──
 * Não afirma que o produto deveria pagar menos. Isso exige ler a lei e a
 * descrição real do produto — trabalho de quem responde por ele.
 */

import { CAPITULOS_COM_REGRA, classificarNCM, soDigitos } from '@/data/motorClassificacao'

export interface LinhaConferencia {
  ncm: string
  capitulo: string
  /** A = capítulo tem regra (conferir rende) · B = capítulo sem regra */
  caso: 'A' | 'B'
  prioridade: 'alta' | 'media' | 'baixa'
  itens: number
  valor: number
  descricoes: string[]
  direcoes: string[]
  fornecedores: string[]
  competencias: string[]
  /** o que fazer com esta linha */
  acao: string
  /** por que ela está nesta faixa */
  motivo: string
}

export interface ResumoConferencia {
  ncmsTotais: number
  ncmsSemRegra: number
  itensSemRegra: number
  itensTotais: number
  valorSemRegra: number
  valorTotal: number
  percentualValor: number
  casoA: number
  casoB: number
  /** valor concentrado no caso A — o esforço que rende */
  valorCasoA: number
  valorCasoB: number
}

const CAPS_SET = new Set(CAPITULOS_COM_REGRA)

/** Nomes dos capítulos mais comuns — só para a tela ficar legível. */
const NOME_CAPITULO: Record<string, string> = {
  '01': 'Animais vivos',
  '02': 'Carnes e miudezas',
  '03': 'Peixes e crustáceos',
  '04': 'Leite, laticínios, ovos, mel',
  '05': 'Outros produtos de origem animal',
  '06': 'Plantas vivas e floricultura',
  '07': 'Produtos hortícolas',
  '08': 'Frutas e castanhas',
  '09': 'Café, chá, especiarias',
  '10': 'Cereais',
  '11': 'Produtos da moagem',
  '12': 'Sementes e frutos oleaginosos',
  '15': 'Gorduras e óleos',
  '16': 'Preparações de carne e peixe',
  '17': 'Açúcares e confeitaria',
  '18': 'Cacau e preparações',
  '19': 'Preparações de cereais',
  '20': 'Preparações de hortícolas e frutas',
  '21': 'Preparações alimentícias diversas',
  '22': 'Bebidas, líquidos alcoólicos e vinagres',
  '23': 'Resíduos da indústria alimentar',
  '25': 'Sal, pedras, cimentos',
  '28': 'Produtos químicos inorgânicos',
  '29': 'Produtos químicos orgânicos',
  '30': 'Produtos farmacêuticos',
  '31': 'Adubos e fertilizantes',
  '32': 'Tintas e pigmentos',
  '33': 'Perfumaria e cosméticos',
  '34': 'Sabões e ceras',
  '38': 'Produtos diversos das indústrias químicas',
  '39': 'Plásticos e suas obras',
  '40': 'Borracha e suas obras',
  '48': 'Papel e cartão',
  '68': 'Obras de pedra e cimento',
  '69': 'Cerâmica',
  '70': 'Vidro',
  '72': 'Ferro e aço',
  '73': 'Obras de ferro ou aço',
  '76': 'Alumínio',
  '82': 'Ferramentas',
  '84': 'Máquinas e aparelhos mecânicos',
  '85': 'Máquinas e aparelhos elétricos',
  '87': 'Veículos automóveis',
  '90': 'Instrumentos ópticos e médicos',
  '94': 'Móveis e iluminação',
  '95': 'Brinquedos e jogos',
  '96': 'Obras diversas',
  '99': 'Serviços',
}

export function nomeCapitulo(cap: string): string {
  return NOME_CAPITULO[cap] || `Capítulo ${cap}`
}

/** Um item vindo da API, já com o que a lista precisa. */
export interface ItemBase {
  ncm: string
  descricao: string
  valor: number
  direcao?: string
  fornecedor?: string
  competencia?: string
}

/**
 * MONTA A LISTA DE CONFERÊNCIA.
 *
 * Agrupa por NCM — porque a conferência é por produto, não por linha de nota.
 * Se o mesmo NCM aparece em 40 notas, o contador confere UMA vez e resolve 40.
 */
export function montarListaConferencia(itens: ItemBase[]): {
  linhas: LinhaConferencia[]
  resumo: ResumoConferencia
} {
  const mapa: Record<
    string,
    {
      ncm: string
      itens: number
      valor: number
      descricoes: Set<string>
      direcoes: Set<string>
      fornecedores: Set<string>
      competencias: Set<string>
    }
  > = {}

  let valorTotal = 0
  let itensTotais = 0

  for (const it of itens) {
    const chave = soDigitos(it.ncm) || '(sem NCM)'
    itensTotais++
    valorTotal += Number(it.valor) || 0
    if (!mapa[chave]) {
      mapa[chave] = {
        ncm: chave,
        itens: 0,
        valor: 0,
        descricoes: new Set(),
        direcoes: new Set(),
        fornecedores: new Set(),
        competencias: new Set(),
      }
    }
    const g = mapa[chave]
    g.itens++
    g.valor += Number(it.valor) || 0
    if (it.descricao) g.descricoes.add(it.descricao)
    if (it.direcao) g.direcoes.add(it.direcao)
    if (it.fornecedor) g.fornecedores.add(it.fornecedor)
    if (it.competencia) g.competencias.add(it.competencia)
  }

  const linhas: LinhaConferencia[] = []
  let ncmsTotais = 0

  for (const chave in mapa) {
    const g = mapa[chave]
    ncmsTotais++
    if (chave === '(sem NCM)') {
      /* Item sem NCM é o pior caso: não há como classificar. Prioridade máxima
         independentemente de capítulo. */
      linhas.push({
        ncm: '',
        capitulo: '',
        caso: 'A',
        prioridade: 'alta',
        itens: g.itens,
        valor: Math.round(g.valor * 100) / 100,
        descricoes: Array.from(g.descricoes).slice(0, 5),
        direcoes: Array.from(g.direcoes),
        fornecedores: Array.from(g.fornecedores).slice(0, 3),
        competencias: Array.from(g.competencias).sort(),
        acao: 'Ler o XML do fornecedor e obter o NCM correto. Sem NCM não há classificação possível.',
        motivo: 'Documento chegou sem NCM — é lacuna do arquivo, não da lei.',
      })
      continue
    }

    /* Já tem regra de alíquota? Então não entra na lista. */
    const cls = classificarNCM(chave)
    if (cls.encontrado) continue

    const cap = chave.slice(0, 2)
    const capTemRegra = CAPS_SET.has(cap)
    const caso: 'A' | 'B' = capTemRegra ? 'A' : 'B'

    linhas.push({
      ncm: chave,
      capitulo: cap,
      caso,
      prioridade: caso === 'A' ? 'alta' : 'baixa',
      itens: g.itens,
      valor: Math.round(g.valor * 100) / 100,
      descricoes: Array.from(g.descricoes).slice(0, 5),
      direcoes: Array.from(g.direcoes),
      fornecedores: Array.from(g.fornecedores).slice(0, 3),
      competencias: Array.from(g.competencias).sort(),
      acao:
        caso === 'A'
          ? `O capítulo ${cap} (${nomeCapitulo(cap)}) TEM regras de alíquota nos Anexos. ` +
            'Conferir se o produto se enquadra em algum item — o NCM pode estar genérico demais ' +
            'ou a descrição da nota não sustentar o benefício.'
          : `O capítulo ${cap} (${nomeCapitulo(cap)}) NÃO tem regra de alíquota nos Anexos. ` +
            'O produto paga a integral porque a lei não previu redução. Conferir só confirma.',
      motivo:
        caso === 'A'
          ? `Capítulo com regra: ${CAPITULOS_COM_REGRA.filter((c) => c === cap).length > 0 ? 'sim' : 'sim'} — há benefício possível.`
          : 'Capítulo sem nenhuma regra de alíquota nos Anexos.',
    })
  }

  /* ordena: caso A (por valor desc), depois caso B (por valor desc) */
  linhas.sort((a, b) => {
    if (a.caso !== b.caso) return a.caso === 'A' ? -1 : 1
    return b.valor - a.valor
  })

  /* prioridade fina dentro do caso A: por valor acumulado */
  let acumA = 0
  const valorA = linhas.filter((l) => l.caso === 'A').reduce((s, l) => s + l.valor, 0)
  for (const l of linhas) {
    if (l.caso !== 'A') {
      l.prioridade = 'baixa'
      continue
    }
    acumA += l.valor
    const fracao = valorA > 0 ? acumA / valorA : 1
    l.prioridade = fracao <= 0.8 ? 'alta' : 'media'
  }

  const semRegra = linhas
  const valorSemRegra = semRegra.reduce((s, l) => s + l.valor, 0)
  const itensSemRegra = semRegra.reduce((s, l) => s + l.itens, 0)
  const casoA = semRegra.filter((l) => l.caso === 'A')
  const casoB = semRegra.filter((l) => l.caso === 'B')

  return {
    linhas,
    resumo: {
      ncmsTotais,
      ncmsSemRegra: semRegra.filter((l) => l.ncm).length,
      itensSemRegra,
      itensTotais,
      valorSemRegra: Math.round(valorSemRegra * 100) / 100,
      valorTotal: Math.round(valorTotal * 100) / 100,
      percentualValor: valorTotal > 0 ? Math.round((valorSemRegra / valorTotal) * 1000) / 10 : 0,
      casoA: casoA.length,
      casoB: casoB.length,
      valorCasoA: Math.round(casoA.reduce((s, l) => s + l.valor, 0) * 100) / 100,
      valorCasoB: Math.round(casoB.reduce((s, l) => s + l.valor, 0) * 100) / 100,
    },
  }
}

/** Texto pronto para imprimir — a folha de trabalho do contador. */
export function textoConferencia(
  linhas: LinhaConferencia[],
  resumo: ResumoConferencia,
  cliente: string,
): string {
  const L: string[] = []
  L.push('LISTA DE CONFERÊNCIA DE NCM — PRODUTOS SEM REGRA DE ALÍQUOTA')
  L.push('='.repeat(74))
  L.push('')
  L.push('Cliente: ' + (cliente || 'Todos os clientes'))
  L.push('Gerado em: ' + new Date().toLocaleString('pt-BR'))
  L.push('')
  L.push('RESUMO')
  L.push('  NCMs distintos analisados......: ' + resumo.ncmsTotais)
  L.push('  NCMs sem regra de alíquota.....: ' + resumo.ncmsSemRegra)
  L.push('  Itens nesta condição...........: ' + resumo.itensSemRegra + ' de ' + resumo.itensTotais)
  L.push(
    '  Valor nesta condição...........: R$ ' +
      resumo.valorSemRegra.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
      ' (' +
      resumo.percentualValor +
      '% do total)',
  )
  L.push('')
  L.push(
    '  CASO A — capítulo TEM regra (conferir rende)...: ' +
      resumo.casoA +
      ' NCM(s), R$ ' +
      resumo.valorCasoA.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  L.push(
    '  CASO B — capítulo SEM regra (só confirma)......: ' +
      resumo.casoB +
      ' NCM(s), R$ ' +
      resumo.valorCasoB.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
  )
  L.push('')

  const A = linhas.filter((l) => l.caso === 'A')
  const B = linhas.filter((l) => l.caso === 'B')

  if (A.length > 0) {
    L.push('='.repeat(74))
    L.push('CASO A — CONFERIR PRIMEIRO (há benefício possível na lei)')
    L.push('='.repeat(74))
    for (const l of A) {
      L.push('')
      L.push(
        `[${l.prioridade.toUpperCase()}] NCM ${l.ncm || '(SEM NCM)'} — capítulo ${l.capitulo} (${nomeCapitulo(l.capitulo)})`,
      )
      L.push(
        '  Itens: ' +
          l.itens +
          '  |  Valor: R$ ' +
          l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
          (l.direcoes.length ? '  |  ' + l.direcoes.join('/') : ''),
      )
      if (l.descricoes.length) {
        L.push('  Descrições nas notas:')
        for (const d of l.descricoes) L.push('    · ' + d.slice(0, 90))
      }
      if (l.fornecedores.length)
        L.push('  Fornecedor(es): ' + l.fornecedores.join(' | ').slice(0, 100))
      if (l.competencias.length) L.push('  Competências: ' + l.competencias.join(', '))
      L.push('  O que fazer: ' + l.acao)
    }
  }

  if (B.length > 0) {
    L.push('')
    L.push('='.repeat(74))
    L.push('CASO B — CONFERIR DEPOIS (capítulo sem regra; confirmação)')
    L.push('='.repeat(74))
    for (const l of B) {
      L.push('')
      L.push(`NCM ${l.ncm} — capítulo ${l.capitulo} (${nomeCapitulo(l.capitulo)})`)
      L.push(
        '  Itens: ' +
          l.itens +
          '  |  Valor: R$ ' +
          l.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      )
      if (l.descricoes.length) L.push('  Descrição: ' + l.descricoes[0].slice(0, 90))
    }
  }

  L.push('')
  L.push('='.repeat(74))
  L.push('O QUE ESTA LISTA É — E O QUE ELA NÃO É')
  L.push('')
  L.push('É o retrato dos produtos que o motor de classificação NÃO conseguiu')
  L.push('enquadrar em nenhum Anexo da LC 214/RIBS. Separada em dois casos,')
  L.push('porque conferir um NCM de capítulo COM regra é trabalho que rende;')
  L.push('conferir um de capítulo SEM regra serve para confirmar que não há')
  L.push('benefício previsto.')
  L.push('')
  L.push('NÃO é afirmação de que o produto deveria pagar menos. Isso exige ler a')
  L.push('lei e a descrição real do produto — decisão de quem responde por ela.')
  L.push('')
  L.push('Fonte da classificação: Tabela Geral dos Anexos (Seção 7A), gerada da')
  L.push('LC 214/2025, do RIBS (Res. CGIBS 6/2026) e do Decreto 12.955/2026.')
  L.push('Gerado pelo Analisador Tributário — ADECONT')

  return L.join('\n')
}
