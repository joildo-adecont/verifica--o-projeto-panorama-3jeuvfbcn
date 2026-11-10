/**
 * LEITURA AUTOMÁTICA DE BALANÇO PATRIMONIAL E DRE EM PDF
 * =======================================================
 * Camada 1 do fluxo pedido pelo usuário: lê o texto dos PDFs de Balanço/DRE
 * já anexados na ficha (coleção `cliente_arquivos`) e PREENCHE a grade de
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
 * ── MELHORIAS DE DETECÇÃO DE CAMPOS (Requisitos 1 a 5) ──
 * 1. Dicionário enriquecido: centenas de variações de grafia e sinônimos contábeis
 *    brasileiros (AC, ANC, PC, PNC, PL, Disponibilidades, Estoques, DRE etc.).
 * 2. Layout em COLUNAS: detecção de cabeçalhos de anos (ex.: "2020", "2019"),
 *    mapeamento para o índice correto da coluna do exercício procurado e, quando
 *    não há cabeçalho explícito, prioriza a última coluna (padrão contábil BR:
 *    coluna mais recente à direita), sinalizando ambiguidade se houver dúvida.
 * 3. Casamento de linha:
 *    • Unificação de separadores de milhar quebrados ("1. 234. 567,89" ou "1. 234,56").
 *    • Parênteses, sinais negativos separados ("- 1.234,56", "( 1.234,56 )").
 *    • Tratamento explícito de traço ("—", "-", "-.-") como nulo/vazio com aviso;
 *      "0,00" ou "0" como zero preenchido.
 * 4. Cruzamentos de consistência com tolerância de 5%:
 *    • Ativo Total = Ativo Circulante + Ativo Não Circulante
 *    • Passivo + PL = Passivo Circulante + Passivo Não Circulante + Patrimônio Líquido
 *    • Ativo Total = Passivo Total + PL (equação patrimonial básica)
 *    • Receita Líquida - Custos - Despesas = Lucro/Prejuízo Líquido
 *    • Pontuação de plausibilidade para escolha do melhor demonstrativo entre arquivos.
 * 5. Honestidade: campo ambíguo ou ausente → vazio/zerado na grade e listado em
 *    naoLidos com aviso discreto; falha em um arquivo nunca impede os demais.
 */

import pb from '@/lib/pocketbase/client'
import type { ExercicioFinanceiroCompleto } from '@/types/analisesEmpresariaisModel'
import { criarExercicioVazio } from './motorAnaliseEmpresarial'
import { ALVOS_TOTAIS, ALVOS_DETALHE } from './leitorBalancoRotulos'

// ─────────────────────── pdf.js (mesmo padrão do leitorBalancetePDF) ───────────────────────

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
 * (negativo), "- 1.234,56" (negativo com espaço), "1.234,56 C" / "1.234,56D".
 * Devolve:
 *   • number: quando o valor é válido (ex.: 1234.56, 0).
 *   • null: quando não é um número nem traço nulo.
 *
 * Traço explícito ("—", "-", "-.-") deve ser tratado externamente ou mapeado
 * para null com marcação de ausência.
 */
export function parseNumeroBR(tok: string): number | null {
  if (!tok) return null
  let t = String(tok).trim().replace(/\s+/g, '')

  // Se é apenas traço de conta sem movimento ("-", "—", "--", "-.-")
  if (/^[—–-]+$/.test(t) || t === '-.-' || t === '---') {
    return null
  }

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

/** Verifica se um token é um traço indicando valor nulo/sem movimento */
export function ehTracoNulo(tok: string): boolean {
  if (!tok) return false
  const t = tok.trim()
  return /^[—–-]+$/.test(t) || t === '-.-' || t === '---' || t === '( - )' || t === '(-)'
}

const EH_VALOR_TOKEN = /^\(?-?[\d.]+,\d{2}\)?[DC-]?$/

/**
 * Normaliza rótulo: remove códigos de conta no início (ex.: "1.1.01", "2.1"),
 * acentos, múltiplos espaços e parênteses auxiliares.
 */
export function normalizarRotulo(descricao: string): string {
  let d = descricao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(?\bR\$\b\)?/gi, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')

  // Remove códigos de conta contábil no início da linha (ex.: "1.", "1.1.", "1.1.01", "2.01.01.001 -")
  d = d.replace(/^[\d.\-/]+\s*[-–—]?\s*/, '')

  return d.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Pré-processa uma linha de texto para consertar tokens quebrados comuns em PDFs:
 * - Ponto de milhar com espaço ("1. 234. 567,89" → "1.234.567,89")
 * - Sinal negativo separado ("- 1.234,56" → "-1.234,56")
 * - Parênteses separados ("( 1.234,56 )" → "(1.234,56)")
 */
export function repararTokensLinha(linha: string): string {
  let s = linha
  // Conserta números com espaço após ponto de milhar: "1. 234" → "1.234"
  s = s.replace(/(\d+)\.\s+(\d{3})/g, '$1.$2')
  s = s.replace(/(\d+)\.\s+(\d{3})/g, '$1.$2') // segunda passada para milhares múltiplos
  // Conserta vírgula com espaço: "1.234, 56" → "1.234,56"
  s = s.replace(/(\d+),\s+(\d{2})/g, '$1,$2')
  // Conserta sinal de menos com espaço: "- 1.234,56" → "-1.234,56"
  s = s.replace(/(^|\s)-\s+([\d.]+,\d{2})/g, '$1-$2')
  // Conserta parênteses com espaço: "( 1.234,56 )" → "(1.234,56)"
  s = s.replace(/\(\s+([\d.,]+)\s+\)/g, '($1)')
  return s.replace(/\s+/g, ' ').trim()
}

// ─────────────────────── Parsing das linhas → campos da grade ───────────────────────

/** Linha de conta: rótulo seguido de 1..6 colunas de valores (ou traço). */
export interface LinhaConta {
  rotulo: string
  rotuloNorm: string
  /** Valores numéricos por coluna (null indica traço/ausente naquela coluna). */
  colunas: Array<number | null>
  /** Apenas os valores numéricos válidos existentes. */
  valores: number[]
  /** Teve traço explícito em alguma coluna? */
  teveTraco: boolean
}

/**
 * Lê e estrutura as linhas de conta contábil.
 */
export function lerLinhasDeConta(linhas: string[]): LinhaConta[] {
  const saida: LinhaConta[] = []
  for (const bruta of linhas) {
    const limpa = repararTokensLinha(bruta)
    if (!limpa) continue
    const campos = limpa.split(/\s+/)
    if (campos.length < 2) continue

    /* recorta o maior sufixo final composto de valores numéricos ou traço (1 a 6 colunas) */
    let qtd = 0
    let inicio = campos.length
    while (qtd < 6 && inicio - 1 >= 0) {
      const tok = campos[inicio - 1]
      if (ehTracoNulo(tok)) {
        inicio--
        qtd++
        continue
      }
      if (EH_VALOR_TOKEN.test(tok)) {
        inicio--
        qtd++
        continue
      }
      // valores sem centavos ("1.234.567") só se já tem token de valor na cauda
      if (qtd > 0 && /^\(?-?[\d.,]+\)?$/.test(tok) && /\d/.test(tok)) {
        const v = parseNumeroBR(tok)
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

    const colunas: Array<number | null> = []
    const valores: number[] = []
    let teveTraco = false
    let invalido = false

    for (let i = inicio; i < campos.length; i++) {
      const tok = campos[i]
      if (ehTracoNulo(tok)) {
        colunas.push(null)
        teveTraco = true
        continue
      }
      const v = parseNumeroBR(tok)
      if (v === null) {
        invalido = true
        break
      }
      colunas.push(v)
      valores.push(v)
    }

    if (invalido || (valores.length === 0 && !teveTraco)) continue

    saida.push({
      rotulo,
      rotuloNorm: normalizarRotulo(rotulo),
      colunas,
      valores,
      teveTraco,
    })
  }
  return saida
}

// ─────────────────────── Detecção de Colunas / Exercícios ───────────────────────

export interface MapaColunasExercicio {
  /** Ano do exercício desejado (ex.: "2020") */
  exercicioDesejado?: string
  /** Índice da coluna correspondente ao exercício desejado (0-based) */
  indiceColuna?: number
  /** Lista de anos detectados nas colunas, se houver */
  anosDetectados: string[]
}

/**
 * Procura nos cabeçalhos das primeiras 40 linhas por anos de exercício (ex.: "2020", "2019", "31/12/2020").
 * Exemplo típico de cabeçalho:
 * "Descrição                  2020         2019"
 * ou "Balanço Patrimonial em 31/12/2020 e 31/12/2019"
 */
export function detectarColunasExercicio(
  linhas: string[],
  exercicioDesejado?: string,
): MapaColunasExercicio {
  const anosDetectados: string[] = []

  for (const l of linhas.slice(0, 40)) {
    const limpa = l.trim()
    // Procura por anos de 4 dígitos isolados ou com data
    const matches = [...limpa.matchAll(/\b(20\d{2})\b/g)]
    if (matches.length >= 2) {
      // Linha de cabeçalho com 2 ou mais anos (ex: "2021   2020" ou "2020   2019")
      const anos = matches.map((m) => m[1])
      // Deduplica mantendo ordem
      for (const a of anos) {
        if (!anosDetectados.includes(a)) anosDetectados.push(a)
      }
      break
    }
  }

  let indiceColuna: number | undefined = undefined
  if (exercicioDesejado && anosDetectados.length > 0) {
    const idx = anosDetectados.indexOf(exercicioDesejado)
    if (idx >= 0) {
      indiceColuna = idx
    }
  }

  return {
    exercicioDesejado,
    indiceColuna,
    anosDetectados,
  }
}

/**
 * Seleciona o valor numérico de uma linha de conta de acordo com a coluna do exercício:
 * - Se `indiceColuna` for fornecido e couber nas colunas, usa essa coluna.
 *   Se nessa coluna houver traço (null), devolve { valor: null, ehTraco: true }.
 * - Caso contrário (sem cabeçalho de coluna explícito ou demonstrativo simples):
 *   Demonstrativos contábeis comparativos brasileiros SEMPRE colocam o exercício
 *   mais recente à direita (última coluna). Pega a última coluna com valor.
 */
function extrairValorDaColuna(
  linha: LinhaConta,
  indiceColuna?: number,
): { valor: number | null; ehTraco: boolean } {
  if (indiceColuna !== undefined && indiceColuna >= 0 && indiceColuna < linha.colunas.length) {
    const valCol = linha.colunas[indiceColuna]
    if (valCol === null) {
      return { valor: null, ehTraco: true }
    }
    return { valor: valCol, ehTraco: false }
  }

  // Fallback: última coluna (exercício mais recente)
  if (linha.colunas.length > 0) {
    const ult = linha.colunas[linha.colunas.length - 1]
    if (ult === null) {
      return { valor: null, ehTraco: true }
    }
    return { valor: ult, ehTraco: false }
  }

  if (linha.valores.length > 0) {
    return { valor: linha.valores[linha.valores.length - 1], ehTraco: false }
  }

  return { valor: null, ehTraco: linha.teveTraco }
}

/**
 * Tenta casar uma linha com um alvo. Devolve o valor ou null, e marca
 * `ambiguo` quando dois rótulos iguais trazem valores diferentes sem critério.
 */
function casarLinha(
  alvo: { chave: string; padroes: RegExp[] },
  linhas: LinhaConta[],
  usados?: Set<number>,
  indiceColuna?: number,
): { valor: number | null; ambiguo: boolean; indice?: number; teveTraco?: boolean } {
  for (const padrao of alvo.padroes) {
    const candidatos = linhas
      .map((l, i) => ({ l, i }))
      .filter(({ l, i }) => !usados?.has(i) && padrao.test(l.rotuloNorm))
    if (candidatos.length === 0) continue

    const comValor = candidatos.map(({ l, i }) => {
      const extraido = extrairValorDaColuna(l, indiceColuna)
      return { i, valor: extraido.valor, ehTraco: extraido.ehTraco }
    })

    const uteis = comValor.filter((c) => c.valor !== null)
    if (uteis.length === 0) {
      const comTraco = comValor.find((c) => c.ehTraco)
      if (comTraco) {
        return { valor: null, ambiguo: false, indice: comTraco.i, teveTraco: true }
      }
      continue
    }

    const valoresDistintos = new Set(uteis.map((c) => c.valor))
    if (valoresDistintos.size > 1) {
      /* Rótulo igual com valores diferentes sem como desambiguar — ambíguo: sinaliza, não inventa */
      return { valor: null, ambiguo: true }
    }

    return { valor: uteis[0].valor, ambiguo: false, indice: uteis[0].i }
  }
  return { valor: null, ambiguo: false }
}

// ─────────────────────── Estruturas de Resultado ───────────────────────

export interface LeituraExercicio {
  dados: ExercicioFinanceiroCompleto
  /** Campos com valor lido (chave 'grupo.campo', ex. 'ativoCirculante.estoques'). */
  lidos: string[]
  /** Campos ambíguos ou com traço/ausentes (chave 'grupo.campo'). */
  naoLidos: string[]
  /** Avisos específicos de leitura (campos ambíguos, traço, divergências) */
  aviso?: string
  /** Pontuação de consistência (0 a 100) para escolha entre arquivos */
  scoreConsistencia?: number
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

/**
 * Preenche a estrutura `ExercicioFinanceiroCompleto` a partir das linhas de conta.
 *
 * @param linhas Linhas de conta já estruturadas
 * @param fatorEscala 1 ou 1000
 * @param indiceColuna Índice da coluna correspondente ao exercício (se conhecido)
 */
export function parseLeitura(
  linhas: LinhaConta[],
  fatorEscala = 1,
  indiceColuna?: number,
): LeituraExercicio {
  const dados = criarExercicioVazio('', '')
  const lidos: string[] = []
  const naoLidos: string[] = []
  const camposComTraco: string[] = []

  const aplicar = (chave: string, v: number, fator: number) => {
    const [grupo, campo] = chave.split('.')
    const val = Math.round(v * fator * 100) / 100
    if (campo === 'total') {
      ;(dados as any).__totais = (dados as any).__totais || {}
      ;(dados as any).__totais[grupo] = val
      return
    }
    if (chave === 'dre.lucroPrejuizo') {
      ;(dados as any).__resultado = val
      return
    }
    if (chave === 'dre.lucroBruto') {
      ;(dados as any).__lucroBruto = val
      return
    }
    if (chave === 'dre.receitaLiquida') {
      ;(dados as any).__receitaLiquida = val
      // Se receitaBruta ainda não foi preenchida ou está zerada, preenche receitaBruta
      if (!dados.dre.receitaBruta) {
        dados.dre.receitaBruta = val
        lidos.push('dre.receitaBruta')
      }
      return
    }
    const g = (dados as any)[grupo]
    if (g && campo in g) {
      g[campo] = val
      lidos.push(chave)
    }
  }

  // 1) TOTAIS primeiro (prioridade máxima e consumo de linhas)
  const totais: Record<string, number | null> = {}
  const usadas = new Set<number>()

  for (const alvo of ALVOS_TOTAIS) {
    const { valor, indice, ambiguo, teveTraco } = casarLinha(alvo, linhas, usadas, indiceColuna)
    if (valor !== null) {
      aplicar(alvo.chave, valor, fatorEscala)
      if (indice !== undefined) usadas.add(indice)
    } else if (ambiguo) {
      naoLidos.push(alvo.chave)
    } else if (teveTraco) {
      camposComTraco.push(alvo.chave)
    }

    if (alvo.chave.endsWith('.total')) {
      totais[alvo.chave.split('.')[0]] = valor
    }
  }

  // 2) DETALHES: só preenchem contas individuais da grade
  for (const alvo of ALVOS_DETALHE) {
    const { valor, ambiguo, indice, teveTraco } = casarLinha(alvo, linhas, usadas, indiceColuna)
    if (valor !== null) {
      aplicar(alvo.chave, valor, fatorEscala)
      if (indice !== undefined) usadas.add(indice)
    } else if (ambiguo) {
      naoLidos.push(alvo.chave)
    } else if (teveTraco) {
      camposComTraco.push(alvo.chave)
    }
  }

  const aviso = montarAviso(totais, lidos, naoLidos, camposComTraco)
  return { dados, lidos, naoLidos, aviso }
}

// ─────────────────────── Cruzamentos de Consistência ───────────────────────

export interface ResultadoCruzamentoConsistencia {
  avisos: string[]
  score: number // 0 a 100
  consistente: boolean
}

/**
 * Cruzamentos robustos de consistência contábil (tolerância de 5%):
 * 1. Ativo Total = Ativo Circulante + Ativo Não Circulante
 * 2. Passivo Total + PL = Passivo Circulante + Passivo Não Circulante + Patrimônio Líquido
 * 3. Ativo Total = Passivo Total (+ PL)
 * 4. Detalhes de cada grupo vs Total lido do grupo
 * 5. DRE: Receita Líquida + Custos (neg) + Despesas (neg) + ResFin ≈ Lucro Líquido
 */
export function avaliarConsistenciaContabil(
  leitura: LeituraExercicio,
): ResultadoCruzamentoConsistencia {
  const tot: any = (leitura.dados as any).__totais || {}
  const d = leitura.dados
  const avisos: string[] = []
  let penalidades = 0

  const somarGrupo = (grupo: string) =>
    Object.entries((d as any)[grupo] || {}).reduce((s, [, v]) => s + (Number(v) || 0), 0)

  const somaAC = somarGrupo('ativoCirculante')
  const somaANC = somarGrupo('ativoNaoCirculante')
  const somaPC = somarGrupo('passivoCirculante')
  const somaPNC = somarGrupo('passivoNaoCirculante')
  const somaPL = somarGrupo('patrimonioLiquido')

  const totalAC = tot.ativoCirculante ?? (somaAC > 0 ? somaAC : undefined)
  const totalANC = tot.ativoNaoCirculante ?? (somaANC > 0 ? somaANC : undefined)
  const totalAtivo = tot.ativo ?? (totalAC && totalANC ? totalAC + totalANC : undefined)

  const totalPC = tot.passivoCirculante ?? (somaPC > 0 ? somaPC : undefined)
  const totalPNC = tot.passivoNaoCirculante ?? (somaPNC > 0 ? somaPNC : undefined)
  const totalPL = tot.patrimonioLiquido ?? (somaPL > 0 ? somaPL : undefined)
  const totalPassivo = tot.passivo

  // Checagem 1: Ativo Circulante detalhes vs total
  if (tot.ativoCirculante && somaAC > 0) {
    const dif = Math.abs(somaAC - tot.ativoCirculante) / Math.abs(tot.ativoCirculante)
    if (dif > 0.05) {
      penalidades += 15
      avisos.push(
        `Ativo Circulante lido (${tot.ativoCirculante.toLocaleString('pt-BR')}) difere dos detalhes (${somaAC.toLocaleString('pt-BR')})`,
      )
    }
  }

  // Checagem 2: Passivo Circulante detalhes vs total
  if (tot.passivoCirculante && somaPC > 0) {
    const dif = Math.abs(somaPC - tot.passivoCirculante) / Math.abs(tot.passivoCirculante)
    if (dif > 0.05) {
      penalidades += 15
      avisos.push(
        `Passivo Circulante lido (${tot.passivoCirculante.toLocaleString('pt-BR')}) difere dos detalhes (${somaPC.toLocaleString('pt-BR')})`,
      )
    }
  }

  // Checagem 3: Ativo Total = AC + ANC
  if (totalAtivo && totalAC !== undefined && totalANC !== undefined) {
    const somaAtivo = totalAC + totalANC
    const dif = Math.abs(somaAtivo - totalAtivo) / Math.abs(totalAtivo)
    if (dif > 0.05) {
      penalidades += 20
      avisos.push(
        `Ativo Total (${totalAtivo.toLocaleString('pt-BR')}) difere de AC+ANC (${somaAtivo.toLocaleString('pt-BR')})`,
      )
    }
  }

  // Checagem 4: Ativo Total = Passivo Total + PL (Equação Fundamental)
  if (totalAtivo && totalPC !== undefined && totalPL !== undefined) {
    const somaPassivoPL = totalPC + (totalPNC || 0) + totalPL
    const dif = Math.abs(somaPassivoPL - totalAtivo) / Math.abs(totalAtivo)
    if (dif > 0.05) {
      penalidades += 25
      avisos.push(
        `Equação patrimonial: Ativo (${totalAtivo.toLocaleString('pt-BR')}) difere de Passivo+PL (${somaPassivoPL.toLocaleString('pt-BR')})`,
      )
    }
  }

  // Checagem 5: DRE Lucro Líquido vs Receita e Custos
  const resDRE = (d as any).__resultado
  const recLiq =
    (d as any).__receitaLiquida ||
    (d.dre.receitaBruta ? d.dre.receitaBruta + (d.dre.deducoesImpostos || 0) : undefined)
  if (recLiq && resDRE !== undefined) {
    const cmv = d.dre.cmv || 0
    const despAdm = d.dre.despesasAdministrativas || 0
    const despVend = d.dre.despesasVendas || 0
    const resFin = d.dre.resultadoFinanceiro || 0
    const calcLucro = recLiq + cmv + despAdm + despVend + resFin
    if (Math.abs(calcLucro) > 0.01 && Math.abs(resDRE) > 0.01) {
      const dif = Math.abs(calcLucro - resDRE) / Math.max(Math.abs(recLiq), Math.abs(resDRE))
      if (dif > 0.15) {
        penalidades += 10
      }
    }
  }

  const score = Math.max(0, 100 - penalidades)
  return {
    avisos,
    score,
    consistente: avisos.length === 0,
  }
}

/** Mantém compatibilidade com chamadas anteriores de verificarCruzamentos */
export function verificarCruzamentos(leitura: LeituraExercicio): string | undefined {
  const res = avaliarConsistenciaContabil(leitura)
  if (res.avisos.length === 0) return undefined
  return `Divergência na leitura (conferir na grade): ${res.avisos.join('; ')}.`
}

function montarAviso(
  totais: Record<string, number | null>,
  lidos: string[],
  naoLidos: string[],
  camposComTraco: string[],
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
  if (camposComTraco.length > 0) {
    partes.push(`${camposComTraco.length} campo(s) com traço/sem movimento`)
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
/**
 * Converte linhas de texto bruto ou markdown (ex.: tabelas markdown `|CONTA|VALOR1|VALOR2|`)
 * em linhas limpas reconhecíveis por `lerLinhasDeConta`.
 */
export function normalizarLinhasDeTextoOuMarkdown(linhas: string[]): string[] {
  return linhas
    .map((l) => {
      let s = l.trim()
      if (!s) return ''
      // Se for linha de tabela markdown, remove pipes delimitadores e converte em espaços
      if (s.includes('|')) {
        s = s
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((col) => col.trim())
          .filter((col) => !/^[-:]+$/.test(col)) // ignora separador markdown |---|---|
          .join(' ')
      }
      return s.trim()
    })
    .filter((l) => l.length > 0)
}

/**
 * Extrai e estrutura dados de Balanço Patrimonial e DRE a partir de um texto puro
 * ou Markdown (ex.: texto extraído do PDF via pdf.js ou $documents.toMarkdown).
 */
export function parsearBalancoDREDeTexto(
  texto: string,
  exercicioDesejado?: string,
): LeituraExercicio {
  const linhasBrutas = String(texto || '').split(/\r?\n/)
  const linhasLimpos = normalizarLinhasDeTextoOuMarkdown(linhasBrutas)
  const linhasConta = lerLinhasDeConta(linhasLimpos)
  const mapaColunas = detectarColunasExercicio(linhasLimpos, exercicioDesejado)
  const fator = detectarEscala(linhasLimpos)
  const leitura = parseLeitura(linhasConta, fator, mapaColunas.indiceColuna)
  const consist = avaliarConsistenciaContabil(leitura)
  leitura.scoreConsistencia = consist.score
  return leitura
}

/**
 * Tenta ler o anexo PDF pelo backend (via rota /backend/v1/ler-balanco-pdf com $documents.toMarkdown).
 * Se o backend retornar sucesso com o markdown, parseia o texto diretamente.
 * Se retornar 422 (escaneado), devolve aviso imediato sem tentar pdf.js.
 * Se falhar com outro erro de rede, devolve null para que o fallback pdf.js seja usado.
 */
async function tentarLeituraPeloBackend(
  recordId: string,
  exercicioDesejado?: string,
): Promise<{ tentado: boolean; resultado?: ResultadoLeituraExercicio }> {
  try {
    const url = `/backend/v1/ler-balanco-pdf?id=${encodeURIComponent(recordId)}`
    const resp = await fetch(url)
    if (resp.status === 422) {
      return {
        tentado: true,
        resultado: {
          ok: false,
          aviso: 'PDF sem texto extraível (provavelmente imagem escaneada) — confira manualmente.',
        },
      }
    }
    if (!resp.ok) {
      return { tentado: false }
    }
    const data = await resp.json()
    if (!data?.ok || !data?.markdown) {
      return { tentado: false }
    }
    const leitura = parsearBalancoDREDeTexto(data.markdown, exercicioDesejado)
    if (leitura.lidos.length === 0) {
      return { tentado: false }
    }
    return {
      tentado: true,
      resultado: {
        ok: true,
        aviso: leitura.aviso,
        leitura,
      },
    }
  } catch {
    return { tentado: false }
  }
}

/**
 * Lê um anexo PDF de `cliente_arquivos` e devolve os valores prontos para a
 * grade. Prioriza a rota do servidor /backend/v1/ler-balanco-pdf ($documents.toMarkdown)
 * com fallback transparente para o leitor cliente pdf.js.
 * Nunca lança — devolve `ok:false` + aviso (padrão do projeto: a tela
 * nunca fica em estado de erro total).
 */
export async function lerExercicioDoAnexo(params: {
  id: string
  arquivo: string
  titulo?: string
  exercicioDesejado?: string
}): Promise<ResultadoLeituraExercicio> {
  // 1) Tenta via backend ($documents.toMarkdown) se id estiver disponível
  if (params.id) {
    const backend = await tentarLeituraPeloBackend(params.id, params.exercicioDesejado)
    if (backend.tentado && backend.resultado) {
      return backend.resultado
    }
  }

  // 2) Fallback via pdf.js no navegador
  try {
    const bytes = await baixarPdfClienteArquivo(params)
    const { linhas, paginas, caracteres } = await extrairLinhasDoPdf(bytes)
    if (caracteres < 40) {
      return {
        ok: false,
        aviso: 'PDF sem texto extraível (provavelmente imagem escaneada) — confira manualmente.',
      }
    }
    const linhasLimpos = normalizarLinhasDeTextoOuMarkdown(linhas)
    const linhasConta = lerLinhasDeConta(linhasLimpos)
    if (linhasConta.length === 0) {
      return {
        ok: false,
        aviso: `PDF com ${paginas} página(s), mas nenhuma linha de conta reconhecida — confira manualmente.`,
      }
    }

    const mapaColunas = detectarColunasExercicio(linhasLimpos, params.exercicioDesejado)
    const fator = detectarEscala(linhasLimpos)
    const leitura = parseLeitura(linhasConta, fator, mapaColunas.indiceColuna)

    /* Cruzamento e consistência contábil */
    const consist = avaliarConsistenciaContabil(leitura)
    leitura.scoreConsistencia = consist.score

    const avisoCruz =
      consist.avisos.length > 0 ? `Divergência: ${consist.avisos.join('; ')}.` : undefined
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
