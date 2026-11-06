/**
 * COMPARADOR DE REGIMES — hoje × transição × 2033
 * ================================================
 * Pedido do CEO (05/11/2026): "criar um módulo comparativo e interativo com
 * projeções de troca de regime e atividades, resultando após as comparações
 * qual melhor opção de tributação com a nova reforma, criando campo para
 * extrair informações de itens que terão créditos pela compra, do IBS e CBS,
 * como as do ativo imobilizado".
 *
 * O QUE ELE COMPARA, E O QUE NÃO COMPARA
 * Compara IBS/CBS e o crédito que cada regime permite. IRPJ, CSLL, ICMS e ISS
 * ficam de fora de propósito: entram de forma diferente em cada regime (no
 * Simples vêm dentro do DAS) e somá-los num número único produziria comparação
 * que parece completa e não é.
 *
 * A ASSIMETRIA QUE GOVERNA A DECISÃO
 * O Simples cobra menos — e é por isso que pode custar mais caro:
 *   art. 47, § 9º, I  — o optante que não exerce a opção pelo regime regular
 *                        não apropria crédito de IBS/CBS nas compras;
 *   art. 47, § 9º, II  — quem compra de optante do Simples apropria crédito
 *                        só equivalente ao que foi pago naquele regime.
 * Quem vende para empresa do regime regular entrega menos crédito, e o
 * adquirente cobra a diferença no preço.
 *
 * A SAÍDA DO SIMPLES (art. 41, § 3º)
 * O optante pode apurar IBS/CBS pelo regime regular: o "Simples híbrido".
 * Continua no DAS para ICMS/ISS/IRPJ/CSLL e recupera o crédito nas compras.
 *
 * O QUE DEPENDE DE DADO QUE NÃO TEMOS
 * A parcela de IBS/CBS dentro do DAS não é pública por contribuinte. O campo
 * existe e o aviso também — não se estima essa parcela.
 */

import { CBS_POR_ANO, REF_TOTAL, totalDoAno } from '@/data/aliquotas'

/** Anos que o comparador projeta. 2026 é o ano de teste. */
export const ANOS_COMPARADOR = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]

export type RegimeId = 'regular' | 'simples_hibrido' | 'simples'

export const REGIMES: { id: RegimeId; nome: string; base: string; curto: string }[] = [
  {
    id: 'regular',
    nome: 'Regime regular',
    curto: 'Regular',
    base: 'LC 214/2025, art. 41, caput e § 1º',
  },
  {
    id: 'simples_hibrido',
    nome: 'Simples com IBS/CBS no regime regular',
    curto: 'Simples híbrido',
    base: 'LC 214/2025, art. 41, § 3º',
  },
  {
    id: 'simples',
    nome: 'Simples Nacional integral',
    curto: 'Simples',
    base: 'LC 214/2025, arts. 41, § 2º, e 343',
  },
]

/** Tudo o que o comparador precisa saber. */
export interface EntradaComparador {
  receitaAnual: number
  comprasAnual: number
  imobilizadoAnual: number
  /** % das compras que gera crédito (o resto é uso ou consumo pessoal, art. 57) */
  pctComprasCreditaveis: number
  /** DAS efetivo informado pelo contador, em % da receita */
  dasPct: number
  /** parcela de IBS/CBS embutida no DAS, em % da receita */
  pctIbsCbsNoDas: number
  /** fator médio de tratamento das vendas: 1 = integral, 0,4 = redução de 60% */
  fatorVendas: number
  uf: string
}

export interface LinhaAno {
  ano: number
  fase: string
  /** IBS/CBS sobre as vendas, em R$ */
  debito: number
  /** crédito apropriado nas compras + imobilizado, em R$ */
  credito: number
  /** carga líquida de IBS/CBS, em R$ */
  carga: number
  /** carga líquida como % da receita */
  pctReceita: number
  /** crédito que o ADQUIRENTE toma ao comprar deste fornecedor */
  creditoAoAdquirente: number
  /** DAS pago no ano (só nos regimes do Simples) */
  das: number
}

export interface ResultadoRegime {
  regime: RegimeId
  nome: string
  base: string
  anos: LinhaAno[]
  /** crédito apropriado no regime pleno */
  credito2033: number
  /** carga de IBS/CBS somada ao DAS no regime pleno */
  cargaTotal2033: number
  /** crédito que o adquirente deixa de tomar em 2033, contra o regular */
  creditoPerdido2033: number
  leitura: string
}

/** Rótulo da fase de transição de um ano. */
export function faseDoAno(ano: number): string {
  if (ano <= 2026) return 'teste — CBS 0,9% · IBS 0,1%'
  if (ano <= 2028)
    return `CBS ${(CBS_POR_ANO[ano] ?? 0).toFixed(2).replace('.', ',')}% · IBS em teste`
  if (ano === 2033) return 'regime pleno'
  return 'transição do IBS'
}

const r2 = (v: number) => Math.round(v * 100) / 100

/**
 * MONTA A LINHA DE UM ANO.
 * O regime decide se há crédito — e é a lei que diz isso, não premissa de
 * cálculo: art. 47, § 9º, I veda o crédito ao optante do Simples.
 */
function linhaDoAno(ano: number, e: EntradaComparador, regime: RegimeId): LinhaAno {
  const aliq = totalDoAno(ano)
  const debito = e.receitaAnual * (aliq / 100) * e.fatorVendas
  const baseCredito = e.comprasAnual * (e.pctComprasCreditaveis / 100) + e.imobilizadoAnual
  const das = e.receitaAnual * (e.dasPct / 100)

  if (regime === 'simples') {
    /* Sem crédito nas compras; o adquirente só toma o pago no regime
       (art. 47, § 9º, II). A carga de IBS/CBS está dentro do DAS. */
    const ibsCbsNoDas = e.receitaAnual * (e.pctIbsCbsNoDas / 100)
    return {
      ano,
      fase: faseDoAno(ano),
      debito: 0,
      credito: 0,
      carga: 0,
      pctReceita: 0,
      creditoAoAdquirente: r2(ibsCbsNoDas),
      das: r2(das),
    }
  }

  const credito = baseCredito * (aliq / 100)
  const carga = debito - credito

  /* No híbrido o DAS continua sendo pago, descontada a parcela de IBS/CBS que
     passa a ser apurada no regime regular. Descontar evita contar o mesmo
     tributo duas vezes. */
  const dasHibrido =
    regime === 'simples_hibrido' ? e.receitaAnual * ((e.dasPct - e.pctIbsCbsNoDas) / 100) : 0

  return {
    ano,
    fase: faseDoAno(ano),
    debito: r2(debito),
    credito: r2(credito),
    carga: r2(carga),
    pctReceita: e.receitaAnual > 0 ? r2((carga / e.receitaAnual) * 100) : 0,
    creditoAoAdquirente: r2(debito),
    das: r2(Math.max(0, dasHibrido)),
  }
}

/** COMPARA OS TRÊS CAMINHOS. */
export function comparar(e: EntradaComparador): ResultadoRegime[] {
  const saida: ResultadoRegime[] = REGIMES.map((r) => ({
    regime: r.id,
    nome: r.nome,
    base: r.base,
    anos: ANOS_COMPARADOR.map((ano) => linhaDoAno(ano, e, r.id)),
    credito2033: 0,
    cargaTotal2033: 0,
    creditoPerdido2033: 0,
    leitura: '',
  }))

  const reg = saida.find((x) => x.regime === 'regular')
  const hib = saida.find((x) => x.regime === 'simples_hibrido')
  const sim = saida.find((x) => x.regime === 'simples')

  const lr = reg?.anos.find((a) => a.ano === 2033)
  const lh = hib?.anos.find((a) => a.ano === 2033)
  const ls = sim?.anos.find((a) => a.ano === 2033)

  for (const r of saida) {
    const l = r.anos.find((a) => a.ano === 2033)
    if (!l) continue
    r.credito2033 = l.credito
    r.cargaTotal2033 = r2(l.carga + l.das)
  }

  if (lr && reg) {
    reg.leitura =
      `IBS/CBS de ${lr.pctReceita.toFixed(2).replace('.', ',')}% da receita em 2033, já descontado ` +
      `o crédito de R$ ${lr.credito.toFixed(2).replace('.', ',')}. Entrega crédito cheio ao adquirente.`
  }
  if (lr && ls && sim) {
    sim.creditoPerdido2033 = r2(lr.creditoAoAdquirente - ls.creditoAoAdquirente)
    sim.leitura =
      `DAS de R$ ${ls.das.toFixed(2).replace('.', ',')} sem crédito nas compras, e o adquirente ` +
      'toma apenas a parcela de IBS/CBS embutida no DAS. A diferença volta como pressão de preço.'
  }
  if (lh && hib) {
    hib.leitura =
      `DAS de R$ ${lh.das.toFixed(2).replace('.', ',')} mais IBS/CBS de ` +
      `${lh.pctReceita.toFixed(2).replace('.', ',')}% da receita. Recupera o crédito nas compras ` +
      'e entrega crédito cheio ao cliente — é a saída do art. 41, § 3º.'
  }

  return saida
}

/**
 * PONTO DE EQUILÍBRIO — a partir de que fatia de vendas para clientes do regime
 * regular o Simples deixa de compensar.
 */
export function pontoDeEquilibrio(
  e: EntradaComparador,
  ano = 2033,
): { pctVendasParaRegular: number; explicacao: string } | null {
  const res = comparar(e)
  const reg = res.find((r) => r.regime === 'regular')
  const sim = res.find((r) => r.regime === 'simples')
  if (!reg || !sim) return null
  const lr = reg.anos.find((a) => a.ano === ano)
  const ls = sim.anos.find((a) => a.ano === ano)
  if (!lr || !ls) return null

  const creditoDestruido = lr.creditoAoAdquirente - ls.creditoAoAdquirente
  if (creditoDestruido <= 0) return null

  const pct = Math.max(0, Math.min(100, (lr.carga / creditoDestruido) * 100))
  return {
    pctVendasParaRegular: r2(pct),
    explicacao:
      `Com ${pct.toFixed(1).replace('.', ',')}% das vendas para clientes do regime regular, ` +
      'o crédito que o Simples deixa de entregar anula a diferença de carga.',
  }
}

/**
 * OS CRÉDITOS DE IBS/CBS POR ORIGEM DA COMPRA.
 * O ativo imobilizado é o pedido explícito do CEO e tem uma armadilha: a LC 214
 * não adota os 1/48 avos do PIS/COFINS — o crédito é integral na aquisição. O
 * parcelamento antigo sobrevive só como crédito presumido de transição (art.
 * 380). Quem vem do regime antigo erra exatamente aqui.
 */
export interface CreditoPorOrigem {
  origem: string
  base: number
  aliq2033: number
  credito: number
  como: string
  baseLegal: string
}

export function creditosPorOrigem(e: EntradaComparador): CreditoPorOrigem[] {
  const aliq = totalDoAno(2033)
  const comprasCred = e.comprasAnual * (e.pctComprasCreditaveis / 100)
  const comprasNaoCred = e.comprasAnual - comprasCred

  return [
    {
      origem: 'Compras de bens e serviços (insumos)',
      base: r2(comprasCred),
      aliq2033: aliq,
      credito: r2(comprasCred * (aliq / 100)),
      como: 'Crédito integral no período de apuração, contra o débito das vendas',
      baseLegal: 'LC 214/2025, art. 47, caput e § 2º, I',
    },
    {
      origem: 'Ativo imobilizado',
      base: r2(e.imobilizadoAnual),
      aliq2033: aliq,
      credito: r2(e.imobilizadoAnual * (aliq / 100)),
      como:
        'Crédito integral na aquisição — a LC 214 não adota os 1/48 avos do PIS/COFINS; o ' +
        'parcelamento antigo sobrevive só como crédito presumido de transição (art. 380)',
      baseLegal: 'LC 214/2025, art. 47, caput; art. 380 (transição)',
    },
    {
      origem: 'Uso ou consumo pessoal',
      base: r2(comprasNaoCred),
      aliq2033: aliq,
      credito: 0,
      como: 'Sem crédito — vedado expressamente',
      baseLegal: 'LC 214/2025, arts. 47, caput, e 57',
    },
  ]
}

/** Ressalva obrigatória — vai na tela, não só no comentário. */
export const RESSALVA_COMPARADOR =
  'Esta comparação é de IBS/CBS e do crédito. IRPJ, CSLL, ICMS e ISS entram de forma diferente ' +
  'em cada regime (no Simples, dentro do DAS) e precisam ser comparados à parte, com a apuração ' +
  'real. O DAS e a parcela de IBS/CBS nele contida são INFORMADOS pelo contador — o sistema ' +
  'não os deduz.'

/** Alíquota de referência do regime pleno, para a tela citar. */
export const REF_PLENA = REF_TOTAL
