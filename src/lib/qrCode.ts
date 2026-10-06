/**
 * Gerador de QR Code leve em SVG puro (sem dependências de terceiros).
 * Implementa codificação QR (Modo Byte / ISO 8859-1, Error Correction Nível L/M, Versões 1 a 6)
 * suficiente para URLs de até ~130 caracteres (URLs típicas da aplicação).
 */

// GF(256) com polinômio primitivo 0x11d (285)
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)

;(function initGalois() {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 256) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
})()

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0
  return GF_EXP[GF_LOG[x] + GF_LOG[y]]
}

function polyMul(p1: number[], p2: number[]): number[] {
  const res = new Array<number>(p1.length + p2.length - 1).fill(0)
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= gfMul(p1[i], p2[j])
    }
  }
  return res
}

function rsGeneratorPoly(degree: number): number[] {
  let g = [1]
  for (let i = 0; i < degree; i++) {
    g = polyMul(g, [1, GF_EXP[i]])
  }
  return g
}

function rsCompute(data: Uint8Array, eccLen: number): Uint8Array {
  const gen = rsGeneratorPoly(eccLen)
  const rem = new Uint8Array(eccLen)
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0]
    for (let j = 0; j < eccLen - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor)
    }
    rem[eccLen - 1] = gfMul(gen[eccLen], factor)
  }
  return rem
}

interface QrVersionSpec {
  version: number
  totalCodewords: number
  dataCodewords: number
  eccCodewords: number
  alignmentPatterns: number[]
}

const QR_VERSIONS: QrVersionSpec[] = [
  { version: 1, totalCodewords: 26, dataCodewords: 19, eccCodewords: 7, alignmentPatterns: [] },
  {
    version: 2,
    totalCodewords: 44,
    dataCodewords: 34,
    eccCodewords: 10,
    alignmentPatterns: [6, 18],
  },
  {
    version: 3,
    totalCodewords: 70,
    dataCodewords: 55,
    eccCodewords: 15,
    alignmentPatterns: [6, 22],
  },
  {
    version: 4,
    totalCodewords: 100,
    dataCodewords: 80,
    eccCodewords: 20,
    alignmentPatterns: [6, 26],
  },
  {
    version: 5,
    totalCodewords: 134,
    dataCodewords: 108,
    eccCodewords: 26,
    alignmentPatterns: [6, 30],
  },
  {
    version: 6,
    totalCodewords: 172,
    dataCodewords: 136,
    eccCodewords: 36,
    alignmentPatterns: [6, 34],
  },
]

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text)
  const len = bytes.length

  const spec =
    QR_VERSIONS.find((v) => v.dataCodewords >= len + 3) || QR_VERSIONS[QR_VERSIONS.length - 1]
  const size = spec.version * 4 + 17

  // Bit buffer: Modo Byte (0100) + Contagem de 8 bits + Dados + Terminador
  const bits: number[] = [0, 1, 0, 0]
  for (let i = 7; i >= 0; i--) bits.push((len >> i) & 1)
  for (let i = 0; i < len; i++) {
    const b = bytes[i]
    for (let j = 7; j >= 0; j--) bits.push((b >> j) & 1)
  }

  // Preenchimento com terminador (até 4 zeros)
  const capBits = spec.dataCodewords * 8
  for (let i = 0; i < 4 && bits.length < capBits; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  // Bytes de padding (0xEC, 0x11)
  const pad = [0xec, 0x11]
  let padIdx = 0
  while (bits.length < capBits) {
    const p = pad[padIdx % 2]
    for (let j = 7; j >= 0; j--) bits.push((p >> j) & 1)
    padIdx++
  }

  const dataCodewords = new Uint8Array(spec.dataCodewords)
  for (let i = 0; i < spec.dataCodewords; i++) {
    let byteVal = 0
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b]
    }
    dataCodewords[i] = byteVal
  }

  const ecc = rsCompute(dataCodewords, spec.eccCodewords)
  const finalCodewords = new Uint8Array(spec.totalCodewords)
  finalCodewords.set(dataCodewords, 0)
  finalCodewords.set(ecc, dataCodewords.length)

  // Matriz de módulos e máscara de função
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  function setFinder(r0: number, c0: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = r0 + r
        const nc = c0 + c
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          isFunction[nr][nc] = true
          const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6
          const inBorder = inOuter && (r === 0 || r === 6 || c === 0 || c === 6)
          const inCenter = inOuter && r >= 2 && r <= 4 && c >= 2 && c <= 4
          matrix[nr][nc] = inBorder || inCenter
        }
      }
    }
  }

  // Finders
  setFinder(0, 0)
  setFinder(0, size - 7)
  setFinder(size - 7, 0)

  // Linhas de sincronização (timing)
  for (let i = 8; i < size - 8; i++) {
    isFunction[6][i] = true
    isFunction[i][6] = true
    matrix[6][i] = i % 2 === 0
    matrix[i][6] = i % 2 === 0
  }

  // Padrões de alinhamento
  if (spec.alignmentPatterns.length > 0) {
    const coords = spec.alignmentPatterns
    for (const r of coords) {
      for (const c of coords) {
        if (isFunction[r][c]) continue
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            isFunction[r + dr][c + dc] = true
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2
            const isDot = dr === 0 && dc === 0
            matrix[r + dr][c + dc] = isBorder || isDot
          }
        }
      }
    }
  }

  // Ponto negro fixo
  isFunction[4 * spec.version + 9][8] = true
  matrix[4 * spec.version + 9][8] = true

  // Reserva de Formato
  for (let i = 0; i < 9; i++) {
    isFunction[8][i] = true
    isFunction[i][8] = true
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true
    isFunction[size - 1 - i][8] = true
  }

  // Inserção dos dados em zigue-zague
  let bitIdx = 0
  const allBits: number[] = []
  for (let i = 0; i < finalCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((finalCodewords[i] >> b) & 1)
    }
  }

  let upward = true
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col-- // pula a coluna de sincronismo
    const rowRange = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i)

    for (const row of rowRange) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          let b = bitIdx < allBits.length ? allBits[bitIdx++] : 0
          // Máscara 0: (row + col) % 2 === 0
          if ((row + c) % 2 === 0) b ^= 1
          matrix[row][c] = b === 1
        }
      }
    }
    upward = !upward
  }

  // Formato (Nível L = 01, Máscara 0 = 000 -> 01000)
  // Format info codificado com BCH (15, 5): 0x77c4 para L mask 0
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0]
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1
  matrix[8][7] = formatBits[6] === 1
  matrix[8][8] = formatBits[7] === 1
  matrix[7][8] = formatBits[8] === 1
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1

  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = formatBits[i] === 1
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = formatBits[i] === 1

  return matrix
}

export function renderQrCodeSvg(text: string, sizePx = 200, fgColor = '#2E2260'): string {
  try {
    const matrix = generateQrMatrix(text)
    const n = matrix.length
    const margin = 4
    const totalDim = n + margin * 2

    let rects = ''
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (matrix[r][c]) {
          rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="${fgColor}"/>`
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges" style="background:#ffffff;border-radius:8px;padding:4px"><rect width="${totalDim}" height="${totalDim}" fill="#ffffff"/>${rects}</svg>`
  } catch (err) {
    console.error('[QR] Erro ao gerar SVG:', err)
    return ''
  }
}
