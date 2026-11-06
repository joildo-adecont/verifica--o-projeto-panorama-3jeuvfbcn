// Script for sending companies extracted to PocketBase collection cadastro_empresas
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const iconsSrcDir = path.resolve('scripts/icons-src')
const publicDir = path.resolve('public')
if (fs.existsSync(iconsSrcDir)) {
  const files = fs.readdirSync(iconsSrcDir)
  for (const file of files) {
    fs.copyFileSync(path.join(iconsSrcDir, file), path.join(publicDir, file))
  }
}

async function runExtractionAndSeed() {
  const pdfPath = path.resolve('src/assets/empresas-completo-255b6.pdf')
  if (!fs.existsSync(pdfPath)) return

  const buf = fs.readFileSync(pdfPath)
  const str = buf.toString('latin1')

  const cmaps = []
  let sIdx = 0
  const textStreams = []

  while (true) {
    const sPos = str.indexOf('stream', sIdx)
    if (sPos === -1) break
    let dataStart = sPos + 6
    if (buf[dataStart] === 0x0d && buf[dataStart + 1] === 0x0a) dataStart += 2
    else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1

    const ePos = str.indexOf('endstream', dataStart)
    if (ePos === -1) break
    let dataEnd = ePos
    if (buf[dataEnd - 1] === 0x0a) dataEnd--
    if (buf[dataEnd - 1] === 0x0d) dataEnd--

    const chunk = buf.subarray(dataStart, dataEnd)
    try {
      const decomp = zlib.inflateSync(chunk)
      const dStr = decomp.toString('latin1')
      if (dStr.includes('beginbfchar') || dStr.includes('beginbfrange')) {
        cmaps.push(dStr)
      } else if (dStr.includes('BT') && dStr.includes('ET')) {
        textStreams.push(dStr)
      }
    } catch (_) {}
    sIdx = ePos + 9
  }

  const codeToChar = new Map()
  for (const cmapStr of cmaps) {
    const bfcharRegex = /beginbfchar([\s\S]*?)endbfchar/g
    let match
    while ((match = bfcharRegex.exec(cmapStr)) !== null) {
      const lines = match[1].trim().split('\n')
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 2) {
          const src = parts[0].replace(/[<>]/g, '')
          const dst = parts[1].replace(/[<>]/g, '')
          if (src && dst) {
            const srcCode = parseInt(src, 16)
            let charStr = ''
            for (let i = 0; i < dst.length; i += 4) {
              const uCode = parseInt(dst.substr(i, 4), 16)
              if (!isNaN(uCode)) charStr += String.fromCharCode(uCode)
            }
            codeToChar.set(srcCode, charStr)
          }
        }
      }
    }

    const bfrangeRegex = /beginbfrange([\s\S]*?)endbfrange/g
    while ((match = bfrangeRegex.exec(cmapStr)) !== null) {
      const lines = match[1].trim().split('\n')
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 3) {
          const startHex = parts[0].replace(/[<>]/g, '')
          const endHex = parts[1].replace(/[<>]/g, '')
          const dstHex = parts[2].replace(/[<>]/g, '')
          const start = parseInt(startHex, 16)
          const end = parseInt(endHex, 16)
          const dstStart = parseInt(dstHex, 16)
          for (let code = start; code <= end; code++) {
            const uCode = dstStart + (code - start)
            codeToChar.set(code, String.fromCharCode(uCode))
          }
        }
      }
    }
  }

  function decodeHex(hexStr) {
    let result = ''
    for (let i = 0; i < hexStr.length; i += 4) {
      const code = parseInt(hexStr.substr(i, 4), 16)
      if (codeToChar.has(code)) {
        result += codeToChar.get(code)
      } else {
        result += '?'
      }
    }
    return result
  }

  const parsedEmpresas = []

  for (let pIdx = 0; pIdx < textStreams.length; pIdx++) {
    const tStream = textStreams[pIdx]
    const items = []
    const tmRegex = /1\s+0\s+0\s+1\s+([\d.]+)\s+([\d.]+)\s+Tm[\s\S]*?<([0-9A-Fa-f]+)>\s*Tj/g
    let m
    while ((m = tmRegex.exec(tStream)) !== null) {
      const x = parseFloat(m[1])
      const y = parseFloat(m[2])
      const text = decodeHex(m[3])
      items.push({ x, y, text })
    }

    // Group items by line
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 2) return b.y - a.y
      return a.x - b.x
    })

    const lines = []
    let currentLineY = null
    let currentLineWords = []

    for (const item of items) {
      if (currentLineY === null || Math.abs(item.y - currentLineY) > 2) {
        if (currentLineWords.length > 0) {
          lines.push(currentLineWords.join(' ').trim())
        }
        currentLineY = item.y
        currentLineWords = [item.text]
      } else {
        currentLineWords.push(item.text)
      }
    }
    if (currentLineWords.length > 0) {
      lines.push(currentLineWords.join(' ').trim())
    }

    const rawText = lines.join(' \n ')

    // Código
    let codigo = null
    const codM = rawText.match(/C[oó]digo:\s*(\d+)/i)
    if (codM) codigo = parseInt(codM[1], 10)

    // Página
    let pagina = pIdx + 1
    const pagM = rawText.match(/P[aá]gina:\s*(\d+)\s*\/\s*\d+/i) || rawText.match(/(\d+)\s*\/\s*943/i)
    if (pagM) pagina = parseInt(pagM[1], 10)

    // Data da inscrição
    let dataInscricao = ''
    const dtM = rawText.match(/Data da inscri[cç][aã]o:\s*(\d{2}\/\d{2}\/\d{4})/i)
    if (dtM) dataInscricao = dtM[1]

    // Apelido
    let apelido = ''
    const apelM = rawText.match(/Apelido:\s*([^ \n]+(?:\s+[^ \n]+)*?)(?=\s+(?:Insc\.|Nome:|Data|C[oó]digo|P[aá]gina|$))/i)
    if (apelM) apelido = apelM[1].trim()

    // Insc. Suframa
    let suframa = ''
    const sufM = rawText.match(/Insc\.\s*Suframa:\s*([^ \n]+(?:\s+[^ \n]+)*?)(?=\s+(?:Nome:|Insc\.|Apelido|$))/i)
    if (sufM && !sufM[1].includes('Nome:')) suframa = sufM[1].trim()

    // Insc. Estadual
    let inscEstadual = ''
    const ieM = rawText.match(/Insc(?:ri[cç][aã]o)?\.?\s*Estadual:\s*([^ \n]+(?:\s+[^ \n]+)*?)(?=\s+(?:Nome:|Insc\.|Apelido|$))/i)
    if (ieM) inscEstadual = ieM[1].trim()

    // Nome / Razão Social
    let razaoSocial = ''
    const nomeM = rawText.match(/Nome:\s*([^\n]+?)(?=\s+(?:Insc\.|Apelido|C[oó]digo|Data|$))/i)
    if (nomeM) {
      razaoSocial = nomeM[1].trim()
    } else {
      const empM = rawText.match(/Empresa:\s*([^\n]+?)(?=\s+(?:P[aá]gina|Emiss[aã]o|Hora|$))/i)
      if (empM) razaoSocial = empM[1].trim()
    }

    // Tipo e Número do Documento
    let tipoDoc = ''
    let numDoc = ''

    if (/C\.N\.P\.J\.:/i.test(rawText)) {
      tipoDoc = 'CNPJ'
      const docM = rawText.match(/C\.N\.P\.J\.:\s*([0-9.\-\/]+)/i)
      if (docM) numDoc = docM[1].trim()
    } else if (/C\.A\.E\.P\.F\.:/i.test(rawText)) {
      tipoDoc = 'CAEPF'
      const docM = rawText.match(/C\.A\.E\.P\.F\.:\s*([0-9.\-\/]+)/i)
      if (docM) numDoc = docM[1].trim()
    } else if (/C\.E\.I\.:/i.test(rawText)) {
      tipoDoc = 'CEI'
      const docM = rawText.match(/C\.E\.I\.:\s*([0-9.\-\/]+)/i)
      if (docM) numDoc = docM[1].trim()
    } else if (/C\.P\.F\.:/i.test(rawText)) {
      tipoDoc = 'CPF'
      const docM = rawText.match(/C\.P\.F\.:\s*([0-9.\-\/]+)/i)
      if (docM) numDoc = docM[1].trim()
    }

    if (numDoc === '. . / -' || numDoc === '. . -' || !numDoc) {
      numDoc = ''
    }

    const docLimpo = numDoc.replace(/\D/g, '')

    parsedEmpresas.push({
      codigo: codigo || (pIdx + 1),
      tipo_documento: tipoDoc,
      numero_documento: numDoc,
      documento_limpo: docLimpo,
      razao_social: razaoSocial || `EMPRESA ${codigo || pIdx + 1}`,
      apelido: apelido,
      data_inscricao: dataInscricao,
      inscricao_estadual: inscEstadual,
      inscricao_suframa: suframa,
      pagina: pagina
    })
  }

  // Write to src/data/empresasData.json for fallback / offline inspection if needed
  fs.writeFileSync('src/data/empresasData.json', JSON.stringify(parsedEmpresas))

  // Send in chunks of 50 to PocketBase endpoint
  const backendUrl = 'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev'
  const chunkSize = 50
  let totalImported = 0
  for (let i = 0; i < parsedEmpresas.length; i += chunkSize) {
    const chunk = parsedEmpresas.slice(i, i + chunkSize)
    try {
      const res = await fetch(`${backendUrl}/backend/v1/importar-empresas-chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: chunk })
      })
      const json = await res.json()
      if (json && json.ok) {
        totalImported = json.total
      }
    } catch (err) {
      console.error('Error importing chunk', i, err)
    }
  }

  console.log(`Extraction complete: ${parsedEmpresas.length} pages processed. Total in PB: ${totalImported}`)
}

runExtractionAndSeed().catch(console.error)
