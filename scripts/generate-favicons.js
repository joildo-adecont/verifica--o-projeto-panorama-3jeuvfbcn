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
 */
import fs from 'fs'
import path from 'path'

const iconsSrcDir = path.resolve('scripts/icons-src')
const publicDir = path.resolve('public')

if (!fs.existsSync(iconsSrcDir)) {
  console.warn('[favicons] scripts/icons-src/ não existe — nada a copiar.')
  process.exit(0)
}

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
