import fs from 'fs'

const requiredFiles = [
  'artifacts/adecont-favicon.ico',
  'artifacts/adecont-favicon.svg',
  'public/favicon.ico',
  'public/favicon.svg',
  'public/favicon-32x32.svg',
  'public/apple-touch-icon.svg',
  'public/apple-touch-icon.png',
  'public/og-image.svg',
]

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo obrigatório ausente: ${file}`)
  }
  const stat = fs.statSync(file)
  if (stat.size === 0) {
    throw new Error(`Arquivo está vazio: ${file}`)
  }
  console.log(`✓ Verificado: ${file} (${stat.size} bytes)`)
}
