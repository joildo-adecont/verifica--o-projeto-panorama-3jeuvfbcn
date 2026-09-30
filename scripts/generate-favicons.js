import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

// Dimensões da imagem original: 1920 x 1080
// Test image reading tools in node
async function checkImageTools() {
  const builtins = ['canvas', 'jimp', 'jpeg-js', 'pngjs']
  for (const b of builtins) {
    try {
      const m = await import(b)
      console.log(`[pkg ${b}]: available`)
    } catch {}
  }
}
await checkImageTools()

/**
 * Script de geração de ícones e favicons da ADECONT a partir do novo traço oficial:
 * - Arco azul-marinho profundo (#2B2160) em formato curvo pontiagudo
 * - Esfera central em degradê esférico com ponto de luz (#FFFFFF -> #AEE1FA -> #4FA8DC -> #2A7EB8 -> #1B4F7D)
 */
function createPng(width, height, drawFn) {
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

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

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

/**
 * Renderiza o símbolo oficial ADECONT:
 * - Cor primária do arco: #251A54 (R: 37, G: 26, B: 84)
 * - Esfera central: ciano/azul com ponto de luz
 */
function renderAdecontSymbol(x, y, w, h, options = {}) {
  const nx = x / w
  const ny = y / h

  // Fundo arredondado suave caso solicitado
  if (options.roundedBg) {
    const cornerR = 0.22
    const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR))
    const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR))
    if (dx * dx + dy * dy > cornerR * cornerR) {
      return [0, 0, 0, 0]
    }
  }

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

  // 1. Esfera central: centro (0.49, 0.52), raio ~ 0.135
  const scx = 0.49
  const scy = 0.52
  const sR = 0.135
  const sdist = Math.sqrt((nx - scx) * (nx - scx) + (ny - scy) * (ny - scy))

  if (sdist <= sR) {
    // Ponto de luz no centro suave com glow
    const lx = 0.49
    const ly = 0.52
    const ldist = Math.sqrt((nx - lx) * (nx - lx) + (ny - ly) * (ny - ly)) / (sR * 1.4)
    const t = Math.min(Math.max(ldist, 0), 1)

    // Cores: #FFFFFF (255,255,255) -> #AEE1FA (174,225,250) -> #7EC8F0 (126,200,240) -> #4FA8DC (79,168,220) -> #2A7EB8 (42,126,184) -> #1B4F7D (27,79,125)
    let r, g, b
    if (t < 0.25) {
      const f = t / 0.25
      r = Math.round(255 + f * (174 - 255))
      g = Math.round(255 + f * (225 - 255))
      b = Math.round(255 + f * (250 - 255))
    } else if (t < 0.55) {
      const f = (t - 0.25) / 0.3
      r = Math.round(174 + f * (126 - 174))
      g = Math.round(225 + f * (200 - 225))
      b = Math.round(250 + f * (240 - 250))
    } else if (t < 0.78) {
      const f = (t - 0.55) / 0.23
      r = Math.round(126 + f * (79 - 126))
      g = Math.round(200 + f * (168 - 200))
      b = Math.round(240 + f * (220 - 240))
    } else if (t < 0.92) {
      const f = (t - 0.78) / 0.14
      r = Math.round(79 + f * (42 - 79))
      g = Math.round(168 + f * (126 - 168))
      b = Math.round(220 + f * (184 - 220))
    } else {
      const f = (t - 0.92) / 0.08
      r = Math.round(42 + f * (27 - 42))
      g = Math.round(126 + f * (79 - 126))
      b = Math.round(184 + f * (125 - 184))
    }

    // Suavização anti-aliasing
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
  // Cúpula superior com pontas estendidas
  const dx = Math.abs(nx - 0.5)

  // Curva externa superior: pico central arredondado no topo (y ~ 0.14), abrindo suave
  const yExt = 0.14 + 2.8 * Math.pow(dx, 1.72)
  // Curva interna côncava inferior
  const yInt = 0.24 + 4.1 * Math.pow(dx, 1.58)

  const inArch = ny >= yExt && ny <= yInt && dx <= 0.44 && ny <= 0.84

  if (inArch) {
    // Cor azul-marinho profunda oficial #2E2260 (RGB: 46, 34, 96)
    return [46, 34, 96, 255]
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

// 3. Gerar Apple Touch Icon 180x180 PNG com fundo claro
const png180 = createPng(180, 180, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [248, 250, 252, 255], roundedBg: true }),
)

// 4. Gerar Ícones 192x192 e 512x512
const png192 = createPng(192, 192, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [0, 0, 0, 0] }),
)
const png512 = createPng(512, 512, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [0, 0, 0, 0] }),
)

// 5. Montar arquivo .ICO válido
function createIco(images) {
  const count = images.length
  const headerLen = 6
  const dirEntryLen = 16
  let offset = headerLen + dirEntryLen * count

  const header = Buffer.alloc(headerLen)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)

  const entries = []
  const dataList = []

  for (const img of images) {
    const entry = Buffer.alloc(dirEntryLen)
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0)
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(img.data.length, 8)
    entry.writeUInt32LE(offset, 12)
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

// Salvar também em artifacts/ para consulta
if (!fs.existsSync('artifacts')) {
  fs.mkdirSync('artifacts', { recursive: true })
}
fs.writeFileSync('artifacts/adecont-favicon.ico', icoBuffer)
fs.writeFileSync('artifacts/adecont-favicon-32.png', png32)
fs.writeFileSync('artifacts/adecont-favicon-180.png', png180)

console.log(
  'Todos os favicons e ícones ADECONT foram gerados com sucesso a partir do novo traço oficial!',
)
