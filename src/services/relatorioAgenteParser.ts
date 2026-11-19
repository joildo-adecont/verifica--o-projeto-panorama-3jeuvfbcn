/**
 * PARSER DE RELATÓRIOS DOS AGENTES ESPECIALISTAS — markdown → blocos estruturados
 *
 * Os 7 agentes respondem em markdown (texto corrido, títulos, tabelas com "|",
 * listas e pares "rótulo: valor"). Este parser converte a resposta em blocos
 * tipados para que a tela renderize TABELAS de verdade, GRÁFICOS de barras e
 * COMPARATIVOS (períodos, valores, itens) — e não só texto corrido.
 *
 * Regras (da mais para a menos específica, por linha):
 *  - '#/##/### ' → título (níveis 1/2/3)
 *  - '|a|b|c|'   → tabela (linha de separação --- é descartada; 1ª linha vira header)
 *  - '- item' / '* item' / '1. item' → lista; se ≥2 itens carregam VALOR
 *    (R$, %, dias, meses...), o bloco vira COMPARATIVO
 *  - linhas soltas "Rótulo: valor" (≥2 seguidas, valor reconhecido) → COMPARATIVO
 *  - todo o resto acumula em parágrafo de texto
 */

export type BlocoRelatorio =
  | { tipo: 'titulo'; nivel: 1 | 2 | 3; texto: string }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'lista'; itens: string[] }
  | { tipo: 'tabela'; colunas: string[]; linhas: string[][] }
  | { tipo: 'comparativo'; itens: Array<{ rotulo: string; valor: string }> }

const RX_TITULO = /^(#{1,3})\s+(.*)$/
const RX_BULLET = /^\s*(?:[-*•]|\d{1,3}[.)])\s+(.*)$/
const RX_TABELA_SEPARADOR = /^\s*\|?[\s:|-]+\|?\s*$/
const RX_VALOR =
  /(R\$\s?\d[\d.,]*)|(\d[\d.,]*\s*%)|(\d[\d.,]*\s*(?:dias?|meses|m[eê]ses|anos?|horas?|unidades?|itens?|mil\b|milh[oõ]es|bilh[oõ]es))/i

/** Remove marcação inline (negrito/itálico/código) para texto puro (TXT/CSV/XLSX). */
function limparInline(s: string): string {
  return (s || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*/g, '')
    .trim()
}

/** Linha "Rótulo: valor"? Devolve as duas partes quando o valor é reconhecido. */
function extrairParRotuloValor(linha: string): { rotulo: string; valor: string } | null {
  const m = linha.match(/^([^:]{2,80}):\s*(.+)$/)
  if (!m) return null
  const valor = m[2].trim().replace(/\*\*/g, '').trim()
  if (!RX_VALOR.test(valor)) return null
  return { rotulo: m[1].trim().replace(/\*\*/g, ''), valor }
}

/** Converte uma linha de tabela markdown em células (sem bordas). */
function celulasDaLinhaTabela(linha: string): string[] {
  return linha
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

/**
 * Converte o markdown de resposta do agente em blocos estruturados.
 * Nunca lança: resposta vazia/ilegível vira um único bloco de texto.
 */
export function parseBlocosRelatorio(markdown: string): BlocoRelatorio[] {
  const bruto = (markdown || '').replace(/\r\n/g, '\n')
  if (!bruto.trim()) return []

  const blocos: BlocoRelatorio[] = []
  let paragrafo: string[] = []
  let comparativoAtual: Array<{ rotulo: string; valor: string }> = []

  const fecharParagrafo = () => {
    if (paragrafo.length > 0) {
      blocos.push({ tipo: 'texto', texto: limparInline(paragrafo.join(' ').trim()) })
      paragrafo = []
    }
  }
  const fecharComparativo = () => {
    if (comparativoAtual.length > 0) {
      blocos.push({ tipo: 'comparativo', itens: comparativoAtual })
      comparativoAtual = []
    }
  }

  const linhas = bruto.split('\n')
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    const linhaTrim = linha.trim()

    // ── tabela markdown ──
    if (linhaTrim.startsWith('|') && linhaTrim.endsWith('|') && linhaTrim.length > 2) {
      const celulas = celulasDaLinhaTabela(linhaTrim)
      if (celulas.length >= 2) {
        const proxima = (linhas[i + 1] || '').trim()
        const temCabecalho = RX_TABELA_SEPARADOR.test(proxima) && proxima.includes('-')
        const colunas = temCabecalho ? celulas : []
        const linhasDados: string[][] = temCabecalho ? [] : [celulas]
        if (temCabecalho) i++ // consome a linha de separação
        let j = i + 1
        while (j < linhas.length) {
          const candidata = linhas[j].trim()
          if (!candidata.startsWith('|') || !candidata.endsWith('|')) break
          linhasDados.push(celulasDaLinhaTabela(candidata))
          j++
        }
        i = j - 1
        fecharParagrafo()
        fecharComparativo()
        if (colunas.length === 0 && linhasDados.length > 0) {
          // tabela sem separador: 1ª linha de dados vira header (comportamento do Excel)
          blocos.push({ tipo: 'tabela', colunas: linhasDados[0], linhas: linhasDados.slice(1) })
        } else {
          blocos.push({ tipo: 'tabela', colunas, linhas: linhasDados })
        }
        continue
      }
    }

    // ── régua horizontal (---, ***, ___) → separador visual, não vira bloco ──
    if (/^([-*_])\s*(?:\1\s*)+$/.test(linhaTrim)) {
      fecharParagrafo()
      continue
    }

    // ── título ──
    const mTitulo = linhaTrim.match(RX_TITULO)
    if (mTitulo) {
      fecharParagrafo()
      fecharComparativo()
      blocos.push({
        tipo: 'titulo',
        nivel: mTitulo[1].length as 1 | 2 | 3,
        texto: limparInline(mTitulo[2].trim()),
      })
      continue
    }

    // ── bullet ──
    const mBullet = linhaTrim.match(RX_BULLET)
    if (mBullet) {
      fecharParagrafo()
      const par = extrairParRotuloValor(mBullet[1])
      if (par) {
        comparativoAtual.push(par)
      } else {
        fecharComparativo()
        const ultimo = blocos[blocos.length - 1]
        if (ultimo && ultimo.tipo === 'lista') {
          ultimo.itens.push(mBullet[1].trim())
        } else {
          blocos.push({ tipo: 'lista', itens: [mBullet[1].trim()] })
        }
      }
      continue
    }

    // ── par solto "Rótulo: valor" ──
    const par = extrairParRotuloValor(linhaTrim)
    if (par && !linhaTrim.startsWith('#')) {
      fecharParagrafo()
      comparativoAtual.push(par)
      continue
    }

    // ── texto corrido / linha em branco ──
    fecharComparativo()
    if (!linhaTrim) {
      fecharParagrafo()
    } else {
      paragrafo.push(linhaTrim)
    }
  }

  fecharParagrafo()
  fecharComparativo()
  return blocos
}

/**
 * Tenta ler um número de um texto pt-BR/en ("R$ 1.234,56", "12,5%", "3 meses").
 * Devolve null quando não há número utilizável — usado pelos gráficos de barras.
 */
export function parseValorNumerico(texto: string): number | null {
  const s = (texto || '').replace(/R\$/gi, '').replace(/\s/g, '').replace(/%/g, '')
  if (!/\d/.test(s)) return null
  const temDois = s.includes('.') && s.includes(',')
  let normalizado = s
  if (temDois) {
    // o separador decimal é o ÚLTIMO separador que apareceu
    normalizado =
      s.lastIndexOf(',') > s.lastIndexOf('.')
        ? s.replace(/\./g, '').replace(',', '.')
        : s.replace(/,/g, '')
  } else if (s.includes(',')) {
    normalizado = s.replace(',', '.')
  }
  // separador de milhar sem decimal: "1.234" (pt-BR) → 1234
  if (!temDois && s.includes('.')) {
    const partes = s.split('.')
    if (partes.length === 2 && partes[1].length === 3 && /^\d+$/.test(partes[0])) {
      normalizado = s.replace('.', '')
    }
  }
  const n = Number(normalizado.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Indica se a tabela tem coluna numérica suficiente para virar gráfico. */
export function tabelaVirouGrafico(bloco: Extract<BlocoRelatorio, { tipo: 'tabela' }>): boolean {
  if (bloco.linhas.length < 2 || bloco.colunas.length < 2) return false
  let coluna = -1
  for (let c = 1; c < bloco.colunas.length && coluna < 0; c++) {
    const comNumero = bloco.linhas.filter((l) => parseValorNumerico(l[c] ?? '') !== null).length
    if (comNumero >= 2) coluna = c
  }
  return coluna > 0
}
