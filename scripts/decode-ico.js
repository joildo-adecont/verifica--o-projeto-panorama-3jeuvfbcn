import fs from 'fs'

try {
  const b64 = fs.readFileSync('artifacts/adecont-favicon.ico.base64', 'utf8').trim()
  const buf = Buffer.from(b64, 'base64')
  fs.writeFileSync('artifacts/adecont-favicon.ico', buf)
  fs.writeFileSync('public/favicon.ico', buf)
  console.log('Decoded adecont-favicon.ico successfully!')
} catch (e) {
  console.error('Error decoding ico:', e)
}
