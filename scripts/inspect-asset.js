import fs from 'fs'
import zlib from 'zlib'

const buf = fs.readFileSync('src/assets/logojpg-0b037.jpg')
console.log('--- ASSET INSPECTION ---')
console.log('File size:', buf.length)

const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
console.log('Is PNG:', isPng)

let width = 0
let height = 0
let colorType = 0
let bitDepth = 0

if (isPng) {
  width = buf.readUInt32BE(16)
  height = buf.readUInt32BE(20)
  bitDepth = buf[24]
  colorType = buf[25]
  console.log(`Dimensions: ${width} x ${height}, bitDepth: ${bitDepth}, colorType: ${colorType}`)
  fs.writeFileSync(
    'scripts/asset-summary.json',
    JSON.stringify({ width, height, bitDepth, colorType }, null, 2),
  )
}

// Let's decode PNG IDAT chunks if PNG
if (isPng) {
  let pos = 8
  const idatChunks = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    if (type === 'IDAT') {
      idatChunks.push(buf.subarray(pos + 8, pos + 8 + len))
    }
    pos += 12 + len
  }
  const allIdat = Buffer.concat(idatChunks)
  const decompressed = zlib.inflateSync(allIdat)
  console.log('Decompressed IDAT size:', decompressed.length)

  // Calculate scanline size: 1 byte filter per line + width * channels
  const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 1
  console.log('Bytes per pixel:', bytesPerPixel)

  // Unfilter simple scanlines (or parse)
  // Let's sample colors across image
  // Find bounding box of non-transparent (or non-white) pixels!
  let minX = width,
    maxX = 0,
    minY = height,
    maxY = 0

  // Parse scanlines into raw pixels
  const stride = 1 + width * bytesPerPixel
  const rawData = Buffer.alloc(width * height * bytesPerPixel)

  let prevRow = null
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride
    const filterType = decompressed[rowStart]
    const rowData = Buffer.alloc(width * bytesPerPixel)

    for (let x = 0; x < width * bytesPerPixel; x++) {
      const rawByte = decompressed[rowStart + 1 + x]
      const a = x >= bytesPerPixel ? rowData[x - bytesPerPixel] : 0
      const b = prevRow ? prevRow[x] : 0
      const c = prevRow && x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0

      let val = rawByte
      if (filterType === 1) {
        // Sub
        val = (rawByte + a) & 0xff
      } else if (filterType === 2) {
        // Up
        val = (rawByte + b) & 0xff
      } else if (filterType === 3) {
        // Average
        val = (rawByte + Math.floor((a + b) / 2)) & 0xff
      } else if (filterType === 4) {
        // Paeth
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        let pr = 0
        if (pa <= pb && pa <= pc) pr = a
        else if (pb <= pc) pr = b
        else pr = c
        val = (rawByte + pr) & 0xff
      }
      rowData[x] = val
    }

    rowData.copy(rawData, y * width * bytesPerPixel)
    prevRow = rowData
  }

  // Analyze bounding boxes of elements
  // Helper to get pixel (r, g, b, a)
  function getPixel(x, y) {
    const offset = (y * width + x) * bytesPerPixel
    if (bytesPerPixel === 4) {
      return [rawData[offset], rawData[offset + 1], rawData[offset + 2], rawData[offset + 3]]
    } else {
      return [rawData[offset], rawData[offset + 1], rawData[offset + 2], 255]
    }
  }

  // Non-transparent or dark pixels
  const rowCounts = new Array(height).fill(0)
  const colCounts = new Array(width).fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y)
      // Check if not white and not transparent
      if (a > 30 && !(r > 240 && g > 240 && b > 240)) {
        rowCounts[y]++
        colCounts[x]++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  console.log(
    `Content bbox: x=[${minX}, ${maxX}] (${maxX - minX}px), y=[${minY}, ${maxY}] (${maxY - minY}px)`,
  )

  // Check primary dark color by finding the most common dark color
  const colorHistogram = {}
  for (let y = minY; y <= maxY; y += 4) {
    for (let x = minX; x <= maxX; x += 4) {
      const [r, g, b, a] = getPixel(x, y)
      if (a > 200 && r < 100 && g < 100 && b < 100) {
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        colorHistogram[hex] = (colorHistogram[hex] || 0) + 1
      }
    }
  }
  const sortedColors = Object.entries(colorHistogram).sort((a, b) => b[1] - a[1])
  console.log('Top dark colors:', sortedColors.slice(0, 5))

  // Find vertical bands (peaks and valleys of rowCounts)
  const bands = []
  let inBand = false
  let bandStart = 0
  for (let y = minY; y <= maxY; y++) {
    if (rowCounts[y] > 5 && !inBand) {
      inBand = true
      bandStart = y
    } else if (rowCounts[y] <= 5 && inBand) {
      inBand = false
      bands.push({ start: bandStart, end: y - 1, height: y - bandStart })
    }
  }
  if (inBand) bands.push({ start: bandStart, end: maxY, height: maxY - bandStart })
  console.log('Vertical bands (elements in logo):', bands)

  // Find sphere center & radius
  // Sphere is characterized by blueish pixels (r < 150, g > 100, b > 180 or similar)
  let sphereMinX = width,
    sphereMaxX = 0,
    sphereMinY = height,
    sphereMaxY = 0
  let spherePixelCount = 0
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const [r, g, b, a] = getPixel(x, y)
      // Check if light/cyan blue: b > 160 && (b - r > 40)
      if (a > 100 && b > 160 && b - r > 30 && g > 100) {
        if (x < sphereMinX) sphereMinX = x
        if (x > sphereMaxX) sphereMaxX = x
        if (y < sphereMinY) sphereMinY = y
        if (y > sphereMaxY) sphereMaxY = y
        spherePixelCount++
      }
    }
  }
  console.log(
    `Sphere bbox: x=[${sphereMinX}, ${sphereMaxX}] (w=${sphereMaxX - sphereMinX}), y=[${sphereMinY}, ${sphereMaxY}] (h=${sphereMaxY - sphereMinY}), count=${spherePixelCount}`,
  )
  const sphereCenterX = (sphereMinX + sphereMaxX) / 2
  const sphereCenterY = (sphereMinY + sphereMaxY) / 2
  const sphereRadius = (sphereMaxX - sphereMinX + sphereMaxY - sphereMinY) / 4
  console.log(`Sphere center: (${sphereCenterX}, ${sphereCenterY}), radius: ${sphereRadius}`)

  // Sample sphere colors from center to edge
  const centerPix = getPixel(Math.round(sphereCenterX), Math.round(sphereCenterY))
  console.log('Sphere center pixel:', centerPix)
  const edgePix = getPixel(
    Math.round(sphereCenterX + sphereRadius * 0.9),
    Math.round(sphereCenterY),
  )
  console.log('Sphere edge pixel:', edgePix)

  fs.writeFileSync(
    'scripts/asset-summary.json',
    JSON.stringify(
      {
        width,
        height,
        minX,
        maxX,
        minY,
        maxY,
        bands,
        sphere: {
          cx: sphereCenterX,
          cy: sphereCenterY,
          r: sphereRadius,
          centerPix,
          edgePix,
        },
        topColors: sortedColors.slice(0, 8),
      },
      null,
      2,
    ),
  )
}
