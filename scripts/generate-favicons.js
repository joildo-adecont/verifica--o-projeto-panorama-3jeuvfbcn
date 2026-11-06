/**
 * ÍCONES DO APP — cópia, não desenho.
 *
 * ── O QUE ESTE SCRIPT NÃO FAZ, E POR QUE ISSO ESTÁ ESCRITO AQUI ──
 * Ele NÃO desenha o símbolo, NÃO gera PNG por código e NÃO recalcula favicon a
 * partir de formas geométricas. Uma versão anterior fazia isso e o resultado foi
 * o ícone do celular mostrando um símbolo deformado, diferente do logo oficial.
 *
 * A regra que ficou: o ícone do app é RECORTE do logo oficial, feito uma vez
 * com Pillow em `scripts/icons-src/` (LANCZOS, margem de 10% nos ícones de app
 * e 5%/3% nos favicons, fundo branco). Este script apenas COPIA esses arquivos
 * para `public/`. Nada de geração em tempo de build.
 *
 * ── E OS PDFs DE ORIGEM (05/11/2026) ──
 * Os PDFs grandes que o usuário envia para processamento ficam em `src/assets/`
 * e NÃO são servidos pelo Vite (a pasta assets do src é empacotada, não exposta).
 * Sem cópia para `public/`, ninguém consegue baixar o arquivo de volta — nem o
 * próprio assistente, porque o canal de leitura do MCP trunca binário em 256 KB.
 * Copiar resolve os dois lados: o arquivo vira URL e pode ser lido em pedaços.
 */
import fs from 'fs'
import path from 'path'

const iconsSrcDir = path.resolve('scripts/icons-src')
const publicDir = path.resolve('public')

if (!fs.existsSync(iconsSrcDir)) {
  console.warn('[favicons] scripts/icons-src/ não existe — nada a copiar.')
} else {
  const arquivos = fs.readdirSync(iconsSrcDir)
  let copiados = 0
  for (const arquivo of arquivos) {
    const origem = path.join(iconsSrcDir, arquivo)
    const destino = path.join(publicDir, arquivo)
    if (!fs.statSync(origem).isFile()) continue
    fs.copyFileSync(origem, destino)
    copiados++
  }
  console.log(`[favicons] ${copiados} arquivo(s) copiado(s) de scripts/icons-src/ para public/.`)
}

/* ── PDFs de origem: src/assets → public/pdf ── */
const assetsDir = path.resolve('src/assets')
const publicPdfDir = path.join(publicDir, 'pdf')

if (fs.existsSync(assetsDir)) {
  const pdfs = fs.readdirSync(assetsDir).filter((f) => f.toLowerCase().endsWith('.pdf'))
  if (pdfs.length) {
    fs.mkdirSync(publicPdfDir, { recursive: true })
    for (const pdf of pdfs) {
      fs.copyFileSync(path.join(assetsDir, pdf), path.join(publicPdfDir, pdf))
    }
    console.log(`[pdf] ${pdfs.length} PDF(s) copiado(s) para public/pdf/.`)
  }
}
