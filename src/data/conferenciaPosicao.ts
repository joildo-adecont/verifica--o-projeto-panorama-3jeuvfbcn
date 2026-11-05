/**
 * CONFERÊNCIA DE CASAMENTO POR POSIÇÃO — o que a lista precisa mostrar
 * ============================================================
 * Pedido do CEO (05/11/2026): "liste quais são, com a posição que casou e a
 * descrição da nota, para conferir com a contabilidade".
 *
 * ── POR QUE ESTA LISTA EXISTE, E O QUE ELA ACHOU ──
 * Dos 27 NCMs do DIO SANTO, 4 casaram pela POSIÇÃO (4 ou 2 dígitos) e não pelo
 * código exato. Ao montar a lista, dois deles se revelaram **falsos benefícios**:
 *
 *   · BANHA (1501.10.00) casou pela posição "15" com uma regra do **Anexo IX**,
 *     que trata de INSUMOS AGROPECUÁRIOS — não de alimento. A regra do Anexo IX
 *     na posição 15 é "ácidos graxos para fabricação de sabão", não banha de
 *     cozinha. Classificar banha como insumo agropecuário com redução de 60% é
 *     erro que, numa fiscalização, vira glosa.
 *
 *   · BATATA CHIPS (2004.10.00) casou pela posição "2004" porque uma célula do
 *     Anexo VII lista "20.04, 20.05, 2002.10.00" ao lado da descrição "produtos
 *     hortícolas pré-cozidos". Batata frita industrializada não é hortícola
 *     pré-cozido. O motor leu o código e ignorou a descrição.
 *
 *   · BACON (0210.19.00) casou pela posição "0210" com regra do Anexo IX sobre
 *     "farinhas de carne e osso" — subproduto para ração, não carne curada.
 *
 * ── A LIÇÃO, E O QUE MUDA ──
 * Casar por posição é necessário (a lei referencia posições), mas o código
 * sozinho não basta: a DESCRIÇÃO da regra precisa ser compatível com a descrição
 * do produto. Onde não é, o casamento deve ser tratado como **suspeito**, e não
 * como benefício.
 *
 * Esta lista marca cada caso como **CONFIRMAR** ou **SUSPEITA**, com o motivo.
 */

import { classificarNCM, soDigitos } from '@/data/motorClassificacao'

export interface ItemConferencia {
  ncm: string
  /** descrição real da nota */
  descricaoNota: string
  /** quantos itens e quanto valor */
  itens: number
  valor: number
  /** a posição que casou, e com quantos dígitos */
  posicao: string
  digitos: number
  /** tratamento que o motor atribuiu */
  tratamento: string
  anexo: string
  /** descrição da REGRA na tabela (o que a lei diz daquele código) */
  descricaoRegra: string
  /** a leitura é compatível entre produto e regra? */
  veredito: 'confirmar' | 'suspeita'
  /** por que */
  motivo: string
  /** o que fazer */
  acao: string
}

/**
 * PALAVRAS QUE DENUNCIAM INCOMPATIBILIDADE.
 *
 * A regra do anexo fala de uma coisa; a nota fala de outra. Se a regra menciona
 * "insumo", "adubo", "ração", "sabão" e o produto é alimento, o casamento está
 * errado — mesmo que o dígito bata.
 *
 * Isto NÃO é um classificador: é um alarme. Ele levanta a mão para o contador
 * olhar; quem decide é ele.
 */
const REGRA_NAO_ALIMENTO = [
  'insumo',
  'adubo',
  'fertilizante',
  'corretivo',
  'solo',
  'ração',
  'raçao',
  'sabão',
  'sabao',
  'ácido',
  'acido',
  'solvente',
  'industrial',
  'máquina',
  'maquina',
  'peça',
  'peca',
  'embalagem',
  'vegetal para',
  'genética',
  'semente',
]

const PRODUTO_ALIMENTO = [
  'queijo',
  'qjo',
  'leite',
  'manteiga',
  'creme',
  'bacon',
  'carne',
  'bov',
  'frango',
  'peito',
  'file',
  'batata',
  'tomate',
  'oleo',
  'óleo',
  'açucar',
  'acucar',
  'pão',
  'pao',
  'polenta',
  'mussarela',
  'coalho',
  'gorgonzola',
  'cheddar',
  'mostarda',
  'extrato',
  'pepino',
  'refrigerante',
  'sprite',
  'crystal',
  'suco',
  'sucos',
  'chocolate',
  'choc',
  'bala',
  'mentos',
  'fini',
  'fermento',
  'paprica',
  'páprica',
  'banha',
  'gordura',
  'polpa',
  'fruta',
  'cereal',
  'farinha',
  'macarrão',
  'macarrao',
  'bolo',
  'biscoito',
]

function normaliza(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** A regra fala de insumo/indústria e o produto é alimento? */
function incompativel(descRegra: string, descNota: string): { suspeita: boolean; motivo: string } {
  const r = normaliza(descRegra)
  const n = normaliza(descNota)

  const regraInsumo = REGRA_NAO_ALIMENTO.find((p) => r.indexOf(normaliza(p)) >= 0)
  const produtoAlimento = PRODUTO_ALIMENTO.find((p) => n.indexOf(normaliza(p)) >= 0)

  if (regraInsumo && produtoAlimento) {
    return {
      suspeita: true,
      motivo:
        `a regra trata de "${regraInsumo}" e o produto da nota é "${produtoAlimento}". ` +
        'O código casou, mas o assunto da regra é outro.',
    }
  }

  /* Caso específico: posição 2004 é de hortícolas PREPARADOS/CONSERVADOS, e a
     regra do Anexo VII fala de "apenas pré-cozidos ou cozidos" — batata chips é
     produto industrializado, não hortícola pré-cozido. */
  if (/^200[45]/.test(normaliza(descNota)) === false) {
    const notaTemFritura = /frit|chips|surecrisp|snack|extrusad/.test(n)
    const regraTemPreCozido = /precozid|pre-cozid|apenas.*cozid|congelad/.test(r)
    if (notaTemFritura && regraTemPreCozido) {
      return {
        suspeita: true,
        motivo:
          'o produto é frito/industrializado (chips) e a regra fala só de produto hortícola ' +
          'pré-cozido ou cozido. São coisas diferentes.',
      }
    }
  }

  return { suspeita: false, motivo: '' }
}

/** Um item vindo dos documentos, com o mínimo que a conferência precisa. */
export interface ItemBase {
  ncm: string
  descricao: string
  valor: number
}

/**
 * MONTA A LISTA DOS QUE CASARAM POR POSIÇÃO.
 *
 * Só entram os que casaram por posição — quem casou pelo código exato não tem
 * ambiguidade de posição e não precisa entrar nesta folha.
 */
export function conferirPorPosicao(itens: ItemBase[]): ItemConferencia[] {
  /* agrupa por NCM */
  const mapa: Record<string, { itens: number; valor: number; descricoes: Set<string> }> = {}
  for (const it of itens) {
    const c = soDigitos(it.ncm)
    if (!c) continue
    if (!mapa[c]) mapa[c] = { itens: 0, valor: 0, descricoes: new Set() }
    mapa[c].itens++
    mapa[c].valor += Number(it.valor) || 0
    if (it.descricao) mapa[c].descricoes.add(it.descricao)
  }

  const out: ItemConferencia[] = []
  for (const ncm in mapa) {
    const cls = classificarNCM(ncm)
    if (!cls.encontrado || cls.nivel === null) continue
    /* só os que casaram por posição (menos que o código inteiro) */
    if (cls.nivel >= ncm.length) continue

    const regra = cls.regra!
    const descNota = Array.from(mapa[ncm].descricoes)[0] || ''
    const { suspeita, motivo } = incompativel(regra.descricao, descNota)

    out.push({
      ncm,
      descricaoNota: descNota,
      itens: mapa[ncm].itens,
      valor: Math.round(mapa[ncm].valor * 100) / 100,
      posicao: ncm.slice(0, cls.nivel),
      digitos: cls.nivel,
      tratamento: regra.tratamento,
      anexo: regra.anexo,
      descricaoRegra: regra.descricao,
      veredito: suspeita ? 'suspeita' : 'confirmar',
      motivo: suspeita
        ? motivo
        : `código e regra são do mesmo assunto. Confirmar a subposição na Tabela Geral ` +
          'antes de usar o benefício.',
      acao: suspeita
        ? 'NÃO usar o benefício até conferir. Se a subposição correta não estiver no Anexo, ' +
          'o produto paga a integral — e tratar como reduzido geraria diferença a recolher.'
        : 'Confirmar na Seção 7A que a subposição do produto está listada no Anexo e que a ' +
          'descrição da nota sustenta o enquadramento.',
    })
  }

  /* suspeitas primeiro, depois por valor */
  out.sort((a, b) => {
    if (a.veredito !== b.veredito) return a.veredito === 'suspeita' ? -1 : 1
    return b.valor - a.valor
  })
  return out
}

/** Texto pronto para o contador — a folha de conferência. */
export function textoConferenciaPosicao(lista: ItemConferencia[], cliente: string): string {
  const L: string[] = []
  const suspeitas = lista.filter((x) => x.veredito === 'suspeita')
  const confirmar = lista.filter((x) => x.veredito === 'confirmar')

  L.push('CONFERÊNCIA DE NCM CASADO POR POSIÇÃO')
  L.push('='.repeat(76))
  L.push('')
  L.push('Cliente: ' + (cliente || '—'))
  L.push('Gerado em: ' + new Date().toLocaleString('pt-BR'))
  L.push('')
  L.push('O QUE É ESTA LISTA')
  L.push('  Estes NCMs não casaram pelo código exato: casaram pela POSIÇÃO (4 ou 2')
  L.push('  dígitos). A regra encontrada vale para a posição inteira, e por isso')
  L.push('  precisa de conferência — pode haver distinção por subposição que mude o')
  L.push('  tratamento. Mussarela e queijo coalho são o exemplo clássico: mesmo')
  L.push('  produto para o mercado, tratamentos opostos na lei.')
  L.push('')
  L.push(
    '  ' + suspeitas.length + ' caso(s) marcados SUSPEITA e ' + confirmar.length + ' a CONFIRMAR.',
  )
  L.push('')

  if (suspeitas.length) {
    L.push('='.repeat(76))
    L.push('SUSPEITA — NÃO USAR O BENEFÍCIO ANTES DE CONFERIR')
    L.push('='.repeat(76))
    for (const x of suspeitas) {
      L.push('')
      L.push(`NCM ${x.ncm} — "${x.descricaoNota.slice(0, 60)}"`)
      L.push(`  Casou pela posição ${x.posicao} (${x.digitos} dígitos)`)
      L.push(`  Motor atribuiu: ${x.tratamento} — ${x.anexo}`)
      L.push(`  A REGRA diz: "${x.descricaoRegra.slice(0, 90)}"`)
      L.push(`  POR QUE É SUSPEITA: ${x.motivo}`)
      L.push(
        `  Valor em jogo: R$ ${x.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` +
          ` em ${x.itens} item(ns)`,
      )
      L.push(`  O QUE FAZER: ${x.acao}`)
    }
  }

  if (confirmar.length) {
    L.push('')
    L.push('='.repeat(76))
    L.push('A CONFIRMAR — o assunto bate, falta validar a subposição')
    L.push('='.repeat(76))
    for (const x of confirmar) {
      L.push('')
      L.push(`NCM ${x.ncm} — "${x.descricaoNota.slice(0, 60)}"`)
      L.push(`  Casou pela posição ${x.posicao} (${x.digitos} dígitos)`)
      L.push(`  Motor atribuiu: ${x.tratamento} — ${x.anexo}`)
      L.push(`  A REGRA diz: "${x.descricaoRegra.slice(0, 90)}"`)
      L.push(`  Valor: R$ ${x.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    }
  }

  L.push('')
  L.push('='.repeat(76))
  L.push('COMO CONFERIR')
  L.push('')
  L.push('  1. Abra a Tabela Geral dos Anexos (Seção 7A) e localize o anexo citado.')
  L.push('  2. Procure a SUBPOSIÇÃO do produto (os 6 primeiros dígitos do NCM).')
  L.push('  3. Se estiver listada, o benefício vale — confira só a descrição.')
  L.push('  4. Se NÃO estiver, o produto paga a alíquota integral. Tratá-lo como')
  L.push('     reduzido geraria diferença a recolher na fiscalização.')
  L.push('')
  L.push('POR QUE ISSO IMPORTA')
  L.push('  O NCM é a raiz de toda a classificação fiscal e contábil. Um casamento')
  L.push('  por posição que não se confirma contamina o crédito, o débito e o')
  L.push('  relatório do cliente. Conferir 4 códigos custa minutos; corrigir uma')
  L.push('  apuração errada custa a confiança do cliente.')
  L.push('')
  L.push('Fonte: Tabela Geral dos Anexos (Seção 7A) — LC 214/2025, RIBS (Res. CGIBS')
  L.push('6/2026) e Decreto 12.955/2026. Gerado pelo Parametrizador — ADECONT.')

  return L.join('\n')
}
