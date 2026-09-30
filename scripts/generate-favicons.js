import fs from 'fs'
import path from 'path'

// Gera PNG binário minimalista com canvas puro sem dependências externas ou gera ICO embutindo bitmaps
// Como no Node padrão sem dependências gráficas gerar PNG puro requer encoder zlib:
import zlib from 'zlib'

function createPng(width, height, drawFn) {
  // Matriz RGBA
  const buffer = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4)
    buffer[rowOffset] = 0 // filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height)
      const pxOffset = rowOffset + 1 + x * 4
      buffer[pxOffset] = r
      buffer[pxOffset + 1] = g
      buffer[pxOffset + 2] = b
      buffer[pxOffset + 3] = a
    }
  }

  const compressed = zlib.deflateSync(buffer)

  // Chunk helper
  function makeChunk(type, data) {
    const len = data.length
    const buf = Buffer.alloc(4 + 4 + len + 4)
    buf.writeUInt32BE(len, 0)
    buf.write(type, 4)
    data.copy(buf, 8)
    const crc = calcCrc(buf.subarray(4, 8 + len))
    buf.writeUInt32BE(crc >>> 0, 8 + len)
    return buf
  }

  // PNG Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk])
}

// CRC32 table
const crcTable = []
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1)
    else c = c >>> 1
  }
  crcTable[n] = c
}

function calcCrc(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

// Desenhar o símbolo ADECONT:
// Arco azul-marinho (#0B1033 -> RGB 11, 16, 51)
// Esfera central com degradê azul-claro (#38BDF8 -> #0284C7)
function renderAdecontSymbol(x, y, w, h, options = {}) {
  const nx = x / w
  const ny = y / h

  // Se tiver fundo arredondado (estilo apple-touch-icon)
  if (options.roundedBg) {
    const cornerR = 0.2
    let inCard = true
    const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR))
    const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR))
    if (dx * dx + dy * dy > cornerR * cornerR) {
      return [0, 0, 0, 0] // fora dos cantos arredondados
    }
  }

  // Normalização do símbolo ADECONT:
  // Centro X = 0.5
  // Arco superior: cúpula parabólica/gótica de y ~ 0.22 a y ~ 0.80
  // Esfera central em (0.5, 0.52), raio ~ 0.13

  // Fundo base se options.bg:
  let bgR = 0,
    bgG = 0,
    bgB = 0,
    bgA = 0
  if (options.bg) {
    bgR = options.bg[0]
    bgG = options.bg[1]
    bgB = options.bg[2]
    bgA = options.bg[3]
  }

  // 1. Esfera central: centro cx = 0.5, cy = 0.53, raio = 0.14
  const scx = 0.5
  const scy = 0.54
  const sR = 0.14
  const sdist = Math.sqrt((nx - scx) * (nx - scx) + (ny - scy) * (ny - scy))

  if (sdist <= sR) {
    // Gradiente esférico: ponto de luz em (0.46, 0.49)
    const lx = 0.46
    const ly = 0.48
    const ldist = Math.sqrt((nx - lx) * (nx - lx) + (ny - ly) * (ny - ly)) / (sR * 1.6)
    const t = Math.min(Math.max(ldist, 0), 1)

    // Interpolação de #FFFFFF -> #38BDF8 -> #0284C7 -> #0369A1
    let r, g, b
    if (t < 0.3) {
      const f = t / 0.3
      r = Math.round(255 + f * (56 - 255))
      g = Math.round(255 + f * (189 - 255))
      b = Math.round(255 + f * (248 - 255))
    } else if (t < 0.75) {
      const f = (t - 0.3) / 0.45
      r = Math.round(56 + f * (2 - 56))
      g = Math.round(189 + f * (132 - 189))
      b = Math.round(248 + f * (199 - 248))
    } else {
      const f = (t - 0.75) / 0.25
      r = Math.round(2 + f * (3 - 2))
      g = Math.round(132 + f * (105 - 132))
      b = Math.round(199 + f * (161 - 199))
    }

    // Suavização da borda da esfera (anti-aliasing)
    const edge = sR - sdist
    const pxSize = 1 / Math.min(w, h)
    const alpha = Math.min(Math.max(edge / pxSize, 0), 1)
    if (alpha < 1 && bgA > 0) {
      return [
        Math.round(r * alpha + bgR * (1 - alpha)),
        Math.round(g * alpha + bgG * (1 - alpha)),
        Math.round(b * alpha + bgB * (1 - alpha)),
        255,
      ]
    }
    return [r, g, b, 255]
  }

  // 2. Arco ADECONT:
  // Cúpula externa: de base y = 0.82 (x = 0.12 e 0.88) até topo y = 0.18 (x = 0.5)
  // Cúpula interna: corte elíptico inferior
  const dx = Math.abs(nx - 0.5)

  // Curva externa do arco (topo da cúpula):
  // Em dx = 0 -> y = 0.21. Em dx = 0.40 -> y ~ 0.74
  const yExt = 0.21 + 2.8 * Math.pow(dx, 1.8)

  // Curva interna do arco (intradorso):
  // Em dx = 0 -> y = 0.28. Em dx = 0.38 -> y ~ 0.80
  const yInt = 0.28 + 3.6 * Math.pow(dx, 1.6)

  const inArch = ny >= yExt && ny <= yInt && dx <= 0.42 && ny <= 0.8

  if (inArch) {
    // Cor azul marinho #0B1033 (RGB: 11, 16, 51)
    return [11, 16, 51, 255]
  }

  return [bgR, bgG, bgB, bgA]
}

// 1. Gerar Favicon 32x32 PNG
const png32 = createPng(32, 32, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [0, 0, 0, 0] }),
)

// 2. Gerar Favicon 16x16 PNG
const png16 = createPng(16, 16, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [0, 0, 0, 0] }),
)

// 3. Gerar Apple Touch Icon 180x180 PNG (com fundo elegante suave)
const png180 = createPng(180, 180, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [248, 250, 252, 255], roundedBg: true }),
)

// 4. Gerar Ícone 192x192 e 512x512
const png192 = createPng(192, 192, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [0, 0, 0, 0] }),
)
const png512 = createPng(512, 512, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [0, 0, 0, 0] }),
)

// 5. Montar arquivo .ICO válido contendo 16x16 e 32x32 embutidos como PNGs (formato ICO moderno oficial)
function createIco(images) {
  const count = images.length
  const headerLen = 6
  const dirEntryLen = 16
  let offset = headerLen + dirEntryLen * count

  const header = Buffer.alloc(headerLen)
  header.writeUInt16LE(0, 0) // Reserved
  header.writeUInt16LE(1, 2) // Type 1 = ICO
  header.writeUInt16LE(count, 4) // Count

  const entries = []
  const dataList = []

  for (const img of images) {
    const entry = Buffer.alloc(dirEntryLen)
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0)
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1)
    entry.writeUInt8(0, 2) // color palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(img.data.length, 8) // size of image data
    entry.writeUInt32LE(offset, 12) // offset
    entries.push(entry)
    dataList.push(img.data)
    offset += img.data.length
  }

  return Buffer.concat([header, ...entries, ...dataList])
}

const icoBuffer = createIco([
  { width: 16, height: 16, data: png16 },
  { width: 32, height: 32, data: png32 },
])

// Salvar em public/
fs.writeFileSync('public/favicon.ico', icoBuffer)
fs.writeFileSync('public/favicon-32x32.png', png32)
fs.writeFileSync('public/favicon-16x16.png', png16)
fs.writeFileSync('public/apple-touch-icon.png', png180)
fs.writeFileSync('public/icon-192.png', png192)
fs.writeFileSync('public/icon-512.png', png512)

// Salvar também em artifacts/ conforme solicitado pelo usuário
if (!fs.existsSync('artifacts')) {
  fs.mkdirSync('artifacts', { recursive: true })
}
fs.writeFileSync('artifacts/adecont-favicon.ico', icoBuffer)
fs.writeFileSync('artifacts/adecont-favicon-32.png', png32)
fs.writeFileSync('artifacts/adecont-favicon-180.png', png180)

console.log('Todos os favicons e ícones ADECONT foram gerados com sucesso!')
