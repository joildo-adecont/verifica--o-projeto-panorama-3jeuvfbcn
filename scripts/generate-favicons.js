import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

// Dimensões da imagem original: 1920 x 1080
// Test image reading tools in node
// Helper to inspect logo-adecont.png
function decodePngChunks(buf) {
  let offset = 8
  const chunks = []
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset)
    const type = buf.subarray(offset + 4, offset + 8).toString('ascii')
    const data = buf.subarray(offset + 8, offset + 8 + len)
    chunks.push({ type, data })
    offset += 8 + len + 4
  }
  return chunks
}

function parsePngRgba(filePath) {
  const buf = fs.readFileSync(filePath)
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  const bitDepth = buf.readUInt8(24)
  const colorType = buf.readUInt8(25)
  const chunks = decodePngChunks(buf)
  const idats = chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)
  const uncompressed = zlib.inflateSync(Buffer.concat(idats))

  // For colorType 6 (RGBA) and bitDepth 8:
  // Each line has 1 filter byte + width * 4 bytes
  const bytesPerPixel = 4
  const stride = 1 + width * bytesPerPixel
  const rgba = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    const filter = uncompressed[y * stride]
    const lineStart = y * stride + 1
    const prevLineStart = (y - 1) * stride + 1

    for (let i = 0; i < width * bytesPerPixel; i++) {
      let val = uncompressed[lineStart + i]
      const a = i >= bytesPerPixel ? rgba[y * width * 4 + i - bytesPerPixel] : 0
      const b = y > 0 ? rgba[(y - 1) * width * 4 + i] : 0
      const c = y > 0 && i >= bytesPerPixel ? rgba[(y - 1) * width * 4 + i - bytesPerPixel] : 0

      if (filter === 1) {
        // Sub
        val = (val + a) & 0xff
      } else if (filter === 2) {
        // Up
        val = (val + b) & 0xff
      } else if (filter === 3) {
        // Average
        val = (val + Math.floor((a + b) / 2)) & 0xff
      } else if (filter === 4) {
        // Paeth
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        let pr = c
        if (pa <= pb && pa <= pc) pr = a
        else if (pb <= pc) pr = b
        val = (val + pr) & 0xff
      }
      rgba[y * width * 4 + i] = val
    }
  }
  return { width, height, rgba }
}

function testDecode() {
  const target = path.resolve(process.cwd(), 'public/logo-adecont.png')
  if (fs.existsSync(target)) {
    const { width, height, rgba } = parsePngRgba(target)
    console.log(`[DECODE SUCCESS] width=${width}, height=${height}, rgbaLen=${rgba.length}`)

    // Find bounding box of non-transparent pixels
    let minX = width,
      maxX = 0,
      minY = height,
      maxY = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = rgba[(y * width + x) * 4 + 3]
        if (a > 20) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    console.log(
      `[BBOX] x: ${minX}..${maxX} (${maxX - minX + 1}), y: ${minY}..${maxY} (${maxY - minY + 1})`,
    )
    const rowStats = []
    for (let y = 0; y < 600; y += 20) {
      let rMin = width,
        rMax = 0,
        count = 0
      for (let x = 0; x < width; x++) {
        const a = rgba[(y * width + x) * 4 + 3]
        if (a > 20) {
          if (x < rMin) rMin = x
          if (x > rMax) rMax = x
          count++
        }
      }
      if (count > 0) {
        rowStats.push({ y, rMin, rMax, widthSpan: rMax - rMin, count })
      }
    }
    console.log(`[BBOX DONE] found pixels`)
  } else {
    console.log('Target not found: ' + target)
  }
}
testDecode()

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

  let bgR = 255,
    bgG = 255,
    bgB = 255,
    bgA = 255
  if (options.bg) {
    bgR = options.bg[0]
    bgG = options.bg[1]
    bgB = options.bg[2]
    bgA = options.bg[3]
  }

  // Fundo arredondado suave apenas se explicitamente solicitado
  if (options.roundedBg) {
    const cornerR = 0.22
    const dx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cornerR))
    const dy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cornerR))
    if (dx * dx + dy * dy > cornerR * cornerR) {
      return [0, 0, 0, 0]
    }
  }

  // Padding / escala do símbolo para garantir margem de respiro e nunca cortar
  const padding = options.padding ?? 0.16
  const scale = 1 - 2 * padding
  const cx = 0.5
  const cy = 0.5

  // Coordenadas normalizadas do símbolo centradas
  const sx = (nx - cx) / scale + 0.5
  const sy = (ny - cy) / scale + 0.5

  // 1. Esfera central: centro (0.49, 0.54), raio ~ 0.138
  const scx = 0.49
  const scy = 0.54
  const sR = 0.138
  const sdist = Math.sqrt((sx - scx) * (sx - scx) + (sy - scy) * (sy - scy))

  if (sdist <= sR) {
    // Ponto de luz no centro suave com glow
    const lx = 0.49
    const ly = 0.52
    const ldist = Math.sqrt((sx - lx) * (sx - lx) + (sy - ly) * (sy - ly)) / (sR * 1.35)
    const t = Math.min(Math.max(ldist, 0), 1)

    // Cores da esfera degradê oficial: #FFFFFF -> #AEE1FA -> #7EC8F0 -> #4FA8DC -> #2A7EB8 -> #1B4F7D
    let r, g, b
    if (t < 0.22) {
      const f = t / 0.22
      r = Math.round(255 + f * (174 - 255))
      g = Math.round(255 + f * (225 - 255))
      b = Math.round(255 + f * (250 - 255))
    } else if (t < 0.52) {
      const f = (t - 0.22) / 0.3
      r = Math.round(174 + f * (126 - 174))
      g = Math.round(225 + f * (200 - 225))
      b = Math.round(250 + f * (240 - 250))
    } else if (t < 0.76) {
      const f = (t - 0.52) / 0.24
      r = Math.round(126 + f * (79 - 126))
      g = Math.round(200 + f * (168 - 200))
      b = Math.round(240 + f * (220 - 240))
    } else if (t < 0.92) {
      const f = (t - 0.76) / 0.16
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
    const pxSize = 1 / (Math.min(w, h) * scale)
    const alpha = Math.min(Math.max(edge / pxSize, 0), 1)
    if (alpha < 1 && bgA > 0) {
      return [
        Math.round(r * alpha + bgR * (1 - alpha)),
        Math.round(g * alpha + bgG * (1 - alpha)),
        Math.round(b * alpha + bgB * (1 - alpha)),
        bgA,
      ]
    }
    return [r, g, b, 255]
  }

  // 2. Arco ADECONT:
  // Cúpula superior azul-marinho #2E2260 com pontas estendidas
  const dx = Math.abs(sx - 0.5)

  // Curva externa superior: pico central arredondado no topo (y ~ 0.12), descendo em asa
  const yExt = 0.12 + 2.75 * Math.pow(dx, 1.7)
  // Curva interna côncava inferior
  const yInt = 0.22 + 4.15 * Math.pow(dx, 1.56)

  const inArch = sy >= yExt && sy <= yInt && dx <= 0.45 && sy <= 0.86

  if (inArch) {
    // Cor azul-marinho oficial #2E2260 (RGB: 46, 34, 96)
    return [46, 34, 96, 255]
  }

  return [bgR, bgG, bgB, bgA]
}

// 1. Gerar Favicon 32x32 PNG (fundo branco sólido e padding calibrado para nitidez em abas)
const png32 = createPng(32, 32, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [255, 255, 255, 255], padding: 0.08 }),
)

// 2. Gerar Favicon 16x16 PNG
const png16 = createPng(16, 16, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [255, 255, 255, 255], padding: 0.06 }),
)

// 3. Gerar Apple Touch Icon 180x180 PNG com fundo branco sólido e padding adequado
// Conforme especificações da Apple e pedido do usuário: fundo branco sólido para celular / iOS
const png180 = createPng(180, 180, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [255, 255, 255, 255], padding: 0.16 }),
)

// 4. Gerar Ícones 192x192 e 512x512 para PWA/Android com fundo branco sólido e padding safe-area
const png192 = createPng(192, 192, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [255, 255, 255, 255], padding: 0.16 }),
)
const png512 = createPng(512, 512, (x, y, w, h) =>
  renderAdecontSymbol(x, y, w, h, { bg: [255, 255, 255, 255], padding: 0.16 }),
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

// 6. Gerar SVG unificado para favicon e apple-touch-icon (com fundo branco sólido e padding perfeito)
function buildAdecontSvg({ size = 512, background = null, padding = 0.16 }) {
  // Arco ADECONT: escala e centralização com base no padding
  const scale = (1 - 2 * padding) * (size / 1000)
  const tx = size / 2
  const ty = size / 2 + size * 0.02
  const bgMarkup = background
    ? `<rect width="${size}" height="${size}" fill="${background}" />\n`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="sphereGrad_${size}" cx="48%" cy="45%" r="52%" fx="48%" fy="45%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="22%" stop-color="#AEE1FA" stop-opacity="0.98" />
      <stop offset="52%" stop-color="#7EC8F0" />
      <stop offset="76%" stop-color="#4FA8DC" />
      <stop offset="92%" stop-color="#2A7EB8" />
      <stop offset="100%" stop-color="#1B4F7D" />
    </radialGradient>
    <filter id="softCenterGlow_${size}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${Math.max(1.5, size * 0.01)}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  ${bgMarkup}
  <g transform="translate(${tx}, ${ty}) scale(${scale}) translate(-486, -210)">
    <!-- Arco azul-marinho oficial #2E2260 -->
    <path
      d="M 122 370
         C 142 320, 206 182, 326 84
         C 388 34, 452 0, 500 0
         C 548 0, 612 34, 674 84
         C 718 120, 742 186, 755 283
         C 745 220, 715 156, 650 114
         C 592 76, 540 106, 500 110
         C 458 114, 404 80, 344 116
         C 246 174, 178 266, 122 370 Z"
      fill="#2E2260"
    />
    <!-- Esfera central degradê azul -->
    <circle
      cx="486"
      cy="216"
      r="59"
      fill="url(#sphereGrad_${size})"
    />
    <!-- Ponto de luz no centro -->
    <circle
      cx="486"
      cy="216"
      r="16"
      fill="#FFFFFF"
      opacity="0.85"
      filter="url(#softCenterGlow_${size})"
    />
  </g>
</svg>`
}

const svgFavicon = buildAdecontSvg({ size: 512, background: '#FFFFFF', padding: 0.12 })
const svgFavicon32 = buildAdecontSvg({ size: 32, background: '#FFFFFF', padding: 0.08 })
const svgApple = buildAdecontSvg({ size: 180, background: '#FFFFFF', padding: 0.16 })

// Salvar em public/
fs.writeFileSync('public/favicon.ico', icoBuffer)
fs.writeFileSync('public/favicon-32x32.png', png32)
fs.writeFileSync('public/favicon-16x16.png', png16)
fs.writeFileSync('public/apple-touch-icon.png', png180)
fs.writeFileSync('public/icon-192.png', png192)
fs.writeFileSync('public/icon-512.png', png512)
fs.writeFileSync('public/favicon.svg', svgFavicon)
fs.writeFileSync('public/favicon-32x32.svg', svgFavicon32)
fs.writeFileSync('public/apple-touch-icon.svg', svgApple)

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
