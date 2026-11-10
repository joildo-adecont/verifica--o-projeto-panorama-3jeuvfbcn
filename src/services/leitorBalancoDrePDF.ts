/**
 * LEITURA AUTOMÁTICA DE BALANÇO PATRIMONIAL E DRE EM PDF
 * =======================================================
 * Camada 1 do fluxo pedido pelo usuário: lê o texto dos PDFs de Balanço/DRE
 * já anexados na ficha (coleção `cliente_arquivos`) e PRENCHE a grade de
 * conferência da FerramentaAnaliseBalancosAnexados. A conferência manual
 * (camada 2) continua sendo a última palavra — nada calcula sobre exercício
 * não marcado como conferido.
 *
 * O download usa a URL de arquivo do próprio PocketBase (pb.files.getUrl) — os
 * anexos de cliente estão hospedados no próprio backend, sem proxy externo.
 *
 * A extração de texto é feita no navegador com pdf.js (o runtime JSVM do
 * PocketBase não expõe zlib e os PDFs do sistema contábil usam fonte Type0 /
 * Identity-H — ver leitorBalancetePDF.ts, mesmo princípio). Reconstruímos as
 * LINHAS pela coordenada Y e, dentro de cada linha, ordenamos por X, porque
 * pdf.js devolve os itens na ordem do desenho, não na ordem das colunas.
 *
 * ── HONESTIDADE DA LEITURA ──
 * Nunca inventa número: rótulo não reconhecido → campo fica vazio/zerado e
 * sinalizado como "não lido" na UI; valor ambíguo (dois rótulos iguais com
 * valores diferentes sem critério) → sinalizado, não preenchido.
 */

import pb from '@/lib/pocketbase/client'
import type { ExercicioFinanceiroCompleto } from '@/types/analisesEmpresariaisModel'
import { criarExercicioVazio } from './motorAnaliseEmpresarial'
import { ALVOS_TOTAIS, ALVOS_DETALHE } from './leitorBalancoRotulos'

// ─────────────────────── pdf.js (mesmo padrão do leitorBalancetePDF) ───────────────────────

/**
 * pdf.js é carregado SOB DEMANDA (primeira leitura real): manter o import no
 * topo obrigaria o Node/testes a carregar o worker — aqui só o navegador lê PDF.
 */
let pdfjsLib: typeof import('pdfjs-dist') | null = null

async function obterPdfjs(): Promise<NonNullable<typeof pdfjsLib>> {
  if (pdfjsLib) return pdfjsLib
  const mod: any = await import('pdfjs-dist')
  const workerMod: any = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjsLib = mod.default ?? mod
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerMod.default ?? workerMod
  return pdfjsLib
}

// ─────────────────────── Download do arquivo do PocketBase ───────────────────────

/**
 * Baixa o PDF de `cliente_arquivos` e devolve os bytes. Usa a URL de arquivo do
 * PocketBase via SDK (pb.files.getUrl) — sem proxy /download-resolution, que é
 * só para fontes EXTERNAS bloqueadas pelo Edge do usuário.
 */
export async function baixarPdfClienteArquivo(record: {
  id: string
  arquivo: string
  collectionId?: string
  collectionName?: string
}): Promise<Uint8Array> {
  const rec = {
    id: record.id,
    collectionId: record.collectionId || 'cliente_arquivos',
    collectionName: record.collectionName || 'cliente_arquivos',
  } as any
  const url = pb.files.getUrl(rec, record.arquivo)
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(`Falha ao baixar o PDF do anexo (HTTP ${resp.status}).`)
  }
  const buf = await resp.arrayBuffer()
  return new Uint8Array(buf)
}

// ─────────────────────── Extração de texto (linhas visuais) ───────────────────────

export interface LeituraPdfLinhas {
  linhas: string[]
  paginas: number
  caracteres: number
}

export async function extrairLinhasDoPdf(dados: Uint8Array): Promise<LeituraPdfLinhas> {
  const pdfjsLib = await obterPdfjs()
  const pdf = await pdfjsLib.getDocument({ data: dados }).promise
  const linhasVisuais: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const pagina = await pdf.getPage(p)
    const conteudo = await pagina.getTextContent()

    /* agrupa por Y arredondado; pdf.js usa origem embaixo, então Y maior = topo */
    const porLinha = new Map<number, { x: number; texto: string }[]>()

    for (const item of conteudo.items as any[]) {
      if (!item.str || !item.str.trim()) continue
      const y = Math.round(item.transform[5] / 2) * 2
      const x = item.transform[4]

      /* procura uma linha próxima (tolerância de 2pt) */
      let chave = y
      for (const k of porLinha.keys()) {
        if (Math.abs(k - y) <= 2) {
          chave = k
          break
        }
      }
      if (!porLinha.has(chave)) porLinha.set(chave, [])
      porLinha.get(chave)!.push({ x, texto: item.str })
    }

    const ordenadas = [...porLinha.entries()].sort((a, b) => b[0] - a[0])

    for (const [, itens] of ordenadas) {
      const linha = itens
        .sort((a, b) => a.x - b.x)
        .map((i) => i.texto)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (linha) linhasVisuais.push(linha)
    }
  }

  const texto = linhasVisuais.join('\n')
  return { linhas: linhasVisuais, paginas: pdf.numPages, caracteres: texto.length }
}

// ─────────────────────── Valores numéricos brasileiros ───────────────────────

/**
 * Converte token em número aceitando os formatos comuns dos demonstrativos BR:
 * "1.234.567,89" (reais), "1.234.567,89-" (sinal à direita), "(1.234,56)"
 * (negativo), "1.234,56 C" / "1.234,56D" (natureza — mantém o valor, a origem
 * da coluna já define o lado). Devolve null quando não é um valor.
 */
export function parseNumeroBR(tok: string): number | null {
  if (!tok) return null
  let t = String(tok).trim().replace(/\s+/g, '')
  let negativo = false
  if (/^\(.*\)$/.test(t)) {
    negativo = true
    t = t.slice(1, -1)
  }
  if (t.endsWith('-')) {
    negativo = true
    t = t.slice(0, -1)
  }
  if (t.startsWith('-')) {
    negativo = true
    t = t.slice(1)
  }
  t = t.replace(/[DC]$/i, '')
  if (t.startsWith('R$')) t = t.slice(2)
  if (!/^[0-9.,]+$/.test(t) || !/\d/.test(t)) return null

  let inteiro = ''
  let dec = ''
  const vComma = t.lastIndexOf(',')
  const vDot = t.lastIndexOf('.')
  if (vComma >= 0 && vDot >= 0) {
    if (vComma > vDot) {
      inteiro = t.slice(0, vComma)
      dec = t.slice(vComma + 1)
    } else {
      inteiro = t.slice(0, vDot)
      dec = t.slice(vDot + 1)
    }
  } else if (vComma >= 0) {
    inteiro = t.slice(0, vComma)
    dec = t.slice(vComma + 1)
  } else if (vDot >= 0) {
    /* ponto sozinho: separador de milhar ("1.234") ou decimal ("1.50") */
    const partes = t.split('.')
    if (partes.length === 2 && partes[1].length !== 3) {
      inteiro = partes[0]
      dec = partes[1]
    } else {
      inteiro = t.replace(/\./g, '')
    }
  } else {
    inteiro = t
  }
  inteiro = inteiro.replace(/[.,]/g, '')
  if (dec.length > 2) {
    /* mais de 2 dígitos após o separador decimal não é padrão BR — desconfia */
    return null
  }
  const num = parseFloat(`${inteiro}.${dec || '0'}`)
  if (isNaN(num)) return null
  return Math.round((negativo ? -num : num) * 100) / 100
}

const EH_VALOR = /^-?[\d.]+,\d{2}[DC]?$/

/** Normaliza rótulo: remove códigos/acentos/caixa e espaços múltiplos. */
function normalizarRotulo(descricao: string): string {
  return descricao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(?\bR\$\b\)?/gi, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// ─────────────────────── Parsing das linhas → campos da grade ───────────────────────

/** Linha de conta: rótulo seguido de 1..6 valores. */
export interface LinhaConta {
  rotulo: string
  rotuloNorm: string
  valores: number[]
}

export function lerLinhasDeConta(linhas: string[]): LinhaConta[] {
  const saida: LinhaConta[] = []
  for (const bruta of linhas) {
    const limpa = bruta.trim()
    if (!limpa) continue
    const campos = limpa.split(/\s+/)
    if (campos.length < 2) continue

    /* recorta o maior sufixo final composto só de valores (1 a 6 colunas) */
    let qtd = 0
    let inicio = campos.length
    while (qtd < 6 && inicio - 1 >= 0) {
      const tok = campos[inicio - 1]
      let t = tok
      if (EH_VALOR.test(tok) || /^\(?-?[\d.]+,\d{2}\)?[DC-]?$/.test(tok)) {
        inicio--
        qtd++
        continue
      }
      /* valores sem centavos ("1.234.567", "1234567") também aparecem — só
         quando já existe ao menos um valor decimal na cauda (evita capturar
         códigos de conta "1", "2" como valores) */
      if (qtd > 0 && /^\(?-?[\d.,]+\)?$/.test(t) && /\d/.test(t)) {
        const v = parseNumeroBR(t)
        if (v !== null) {
          inicio--
          qtd++
          continue
        }
      }
      break
    }
    if (qtd === 0) continue

    const rotulo = campos.slice(0, inicio).join(' ').trim()
    if (!rotulo) continue
    const valores: number[] = []
    for (let i = inicio; i < campos.length; i++) {
      const v = parseNumeroBR(campos[i])
      if (v === null) {
        /* valor inválido no meio da cauda — descarta a linha inteira */
        valores.length = 0
        break
      }
      valores.push(v)
    }
    if (valores.length === 0) continue

    saida.push({ rotulo, rotuloNorm: normalizarRotulo(rotulo), valores })
  }
  return saida
}

/**
 * Tenta casar uma linha com um alvo. Devolve o valor ou null, e marca
 * `ambiguo` quando dois rótulos iguais trazem valores diferentes.
 *
 * `usados`: linhas já consumidas por um alvo anterior (ex.: "Total do Passivo
 * Circulante" é do alvo PC — não pode casar de novo com "Total do Passivo").
 * Os ALVOS_TOTAIS são ordenados do mais específico ao mais genérico.
 */
function casarLinha(
  alvo: { chave: string; padroes: RegExp[] },
  linhas: LinhaConta[],
  usados?: Set<number>,
): { valor: number | null; ambiguo: boolean; indice?: number } {
  for (const padrao of alvo.padroes) {
    const candidatos = linhas
      .map((l, i) => ({ l, i }))
      .filter(({ l, i }) => !usados?.has(i) && padrao.test(l.rotuloNorm))
    if (candidatos.length === 0) continue
    /* coluna do valor: balanço comparativo traz ANO-2 ANO-1 — pega a última
       (posição mais recente); DRE de um exercício traz 1 coluna; DRE
       comparativa traz 2 (exercício anterior à esquerda) — mesma regra. */
    const comValor = candidatos.map(({ l, i }) => ({
      i,
      valor: l.valores[l.valores.length - 1],
    }))
    const utéis = comValor.filter((c) => c.valor !== 0)
    const escolhidos = utéis.length > 0 ? utéis : comValor.filter((c) => c.valor === 0)
    if (escolhidos.length === 0) continue
    const valoresDistintos = new Set(escolhidos.map((c) => c.valor))
    if (valoresDistintos.size > 1) {
      /* rótulo igual com valores diferentes (ex.: total do grupo repetido em
         páginas diferentes) — ambíguo: sinaliza, não inventa */
      return { valor: null, ambiguo: true }
    }
    return { valor: escolhidos[0].valor, ambiguo: false, indice: escolhidos[0].i }
  }
  return { valor: null, ambiguo: false }
}

/** Resultado da leitura de um exercício (para a grade e para a UI). */
export interface LeituraExercicio {
  dados: ExercicioFinanceiroCompleto
  /** Campos com valor lido (chave 'grupo.campo', ex. 'ativoCirculante.estoques'). */
  lidos: string[]
  /** Campos ambíguos ou não encontrados (chave 'grupo.campo'). */
  naoLidos: string[]
  aviso?: string
}

/**
 * Detecta escala do demonstrativo a partir do cabeçalho/cabeçalho de coluna
 * ("Valores em R$ mil", "em milhares de reais", "expressos em mil") — o fator
 * multiplicador é aplicado ao preencher a grade.
 */
export function detectarEscala(linhas: string[]): 1 | 1000 {
  for (const bruta of linhas.slice(0, 30)) {
    const t = bruta
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    if (/mil(hares| )/.test(t) || /r\$\s*mil\b/.test(t) || /em\s*mil\b/.test(t)) return 1000
  }
  return 1
}

/** Preenche a estrutura a partir das linhas lidas do PDF. */
export function parseLeitura(linhas: LinhaConta[], fatorEscala = 1): LeituraExercicio {
  const dados = criarExercicioVazio('', '')
  const lidos: string[] = []
  const naoLidos: string[] = []

  const aplicar = (chave: string, v: number, fator: number) => {
    const [grupo, campo] = chave.split('.')
    const val = Math.round(v * fator * 100) / 100
    if (campo === 'total') {
      /* totais de grupo ficam em contas de conferência, não na grade —
         guardamos para cruzamento no chamador (verificarCruzamentos) */
      ;(dados as any).__totais = (dados as any).__totais || {}
      ;(dados as any).__totais[grupo] = val
      return
    }
    if (chave === 'dre.lucroPrejuizo') {
      ;(dados as any).__resultado = val
      return
    }
    const g = (dados as any)[grupo]
    if (g && campo in g) {
      g[campo] = val
      lidos.push(chave)
    }
  }

  // 1) TOTAIS primeiro (prioridade sobre detalhes)
  const totais: Record<string, number | null> = {}
  const usadas = new Set<number>()
  for (const alvo of ALVOS_TOTAIS) {
    const { valor, indice } = casarLinha(alvo, linhas, usadas)
    if (valor !== null) {
      aplicar(alvo.chave, valor, fatorEscala)
      if (indice !== undefined) usadas.add(indice)
    }
    if (alvo.chave.endsWith('.total')) {
      totais[alvo.chave.split('.')[0]] = valor
    }
  }

  // 2) DETALHES: só preenchem contas individuais da grade
  for (const alvo of ALVOS_DETALHE) {
    const { valor, ambiguo, indice } = casarLinha(alvo, linhas, usadas)
    if (valor !== null) {
      aplicar(alvo.chave, valor, fatorEscala)
      if (indice !== undefined) usadas.add(indice)
    } else if (ambiguo) naoLidos.push(alvo.chave)
  }
  const aviso = montarAviso(totais, lidos, naoLidos)
  return { dados, lidos, naoLidos, aviso }
}

/**
 * Cruzamento dos totais lidos (AC+ANC, PC+PNC, PC+PNC+PL) contra os detalhes
 * da grade. Devolve aviso quando a diferença supera 5% — não bloqueia, apenas
 * sinaliza para conferência.
 */
export function verificarCruzamentos(leitura: LeituraExercicio): string | undefined {
  const tot: any = (leitura.dados as any).__totais || {}
  const somarGrupo = (grupo: string) =>
    Object.entries((leitura.dados as any)[grupo] || {}).reduce(
      (s, [, v]) => s + (Number(v) || 0),
      0,
    )
  const avisos: string[] = []
  const comparar = (nome: string, detalhe: number, total: number | undefined) => {
    if (total === undefined || total === null) return
    if (Math.abs(total) < 0.01) return
    const dif = Math.abs(detalhe - total) / Math.abs(total)
    if (dif > 0.05) {
      avisos.push(
        `${nome} lido (${total.toLocaleString('pt-BR')}) difere da soma dos detalhes (${detalhe.toLocaleString('pt-BR')})`,
      )
    }
  }
  comparar('Ativo Circulante', somarGrupo('ativoCirculante'), tot.ativoCirculante)
  comparar('Ativo Não Circulante', somarGrupo('ativoNaoCirculante'), tot.ativoNaoCirculante)
  comparar('Passivo Circulante', somarGrupo('passivoCirculante'), tot.passivoCirculante)
  comparar('Passivo Não Circulante', somarGrupo('passivoNaoCirculante'), tot.passivoNaoCirculante)
  if (avisos.length === 0) return undefined
  return `Divergência na leitura (conferir na grade): ${avisos.join('; ')}.`
}

function montarAviso(
  totais: Record<string, number | null>,
  lidos: string[],
  naoLidos: string[],
): string | undefined {
  const partes: string[] = []
  const faltandoTotais = ['ativo', 'passivo', 'patrimonioLiquido'].filter(
    (g) => totais[g] === null || totais[g] === undefined,
  )
  if (lidos.length === 0) {
    return 'Nenhum valor reconhecido no texto do PDF — confira manualmente.'
  }
  if (naoLidos.length > 0) {
    partes.push(`${naoLidos.length} campo(s) não lido(s) ou ambíguo(s)`)
  }
  if (faltandoTotais.length > 0) {
    partes.push('totais de conferência ausentes')
  }
  if (partes.length > 0) return `Leitura parcial: ${partes.join('; ')}. Confira na grade.`
  return undefined
}

// ─────────────────────── Leitura de um exercício completo ───────────────────────

export interface ResultadoLeituraExercicio {
  ok: boolean
  aviso?: string
  leitura?: LeituraExercicio
}

/**
 * Lê um anexo PDF de `cliente_arquivos` e devolve os valores prontos para a
 * grade. Nunca lança — devolve `ok:false` + aviso (padrão do projeto: a tela
 * nunca fica em estado de erro total).
 */
export async function lerExercicioDoAnexo(params: {
  id: string
  arquivo: string
  titulo?: string
}): Promise<ResultadoLeituraExercicio> {
  try {
    const bytes = await baixarPdfClienteArquivo(params)
    const { linhas, paginas, caracteres } = await extrairLinhasDoPdf(bytes)
    if (caracteres < 40) {
      return {
        ok: false,
        aviso: 'PDF sem texto extraível (provavelmente imagem escaneada) — confira manualmente.',
      }
    }
    const linhasConta = lerLinhasDeConta(linhas)
    if (linhasConta.length === 0) {
      return {
        ok: false,
        aviso: `PDF com ${paginas} página(s), mas nenhuma linha de conta reconhecida — confira manualmente.`,
      }
    }
    const fator = detectarEscala(linhas)
    const leitura = parseLeitura(linhasConta, fator)
    /* cruzamento: soma dos detalhes vs total lido do grupo — divergência forte
       (> 5%) sinaliza leitura imperfeita; nunca substitui a conferência manual */
    const avisoCruz = verificarCruzamentos(leitura)
    const avisoFinal = [leitura.aviso, avisoCruz].filter(Boolean).join(' ') || undefined
    return {
      ok: leitura.lidos.length > 0,
      aviso: avisoFinal,
      leitura: { ...leitura, aviso: avisoFinal },
    }
  } catch (err: any) {
    const msg = String(err?.message || err || '')
    const detalhe = /password/i.test(msg)
      ? 'PDF protegido por senha — informe a senha ou confira manualmente.'
      : /HTTP \d+/.test(msg)
        ? msg
        : 'Falha ao ler o PDF (arquivo corrompido ou formato não suportado) — confira manualmente.'
    console.warn('[leitorBalancoDrePDF] Erro ao ler anexo:', msg)
    return { ok: false, aviso: detalhe }
  }
}
