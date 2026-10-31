import fs from 'fs'
import path from 'path'

/**
 * ÍCONES DO APP — COPIA, NÃO DESENHA (29/10/2026)
 *
 * ── POR QUE ESTE SCRIPT NÃO GERA MAIS NADA ──
 * A versão anterior DESENHAVA o símbolo (arco + esfera) por código e gravava por
 * cima de public/icon-192.png, icon-512.png, apple-touch-icon.png e favicons a
 * CADA BUILD (roda no "prebuild"). Resultado: o ícone do atalho no celular mostrava
 * só o símbolo, sem "ADECONT / ASSESSORIA / ADMINISTRATIVA, CONTÁBIL", enquanto o
 * computador mostrava o logo completo. Dois logos diferentes no mesmo sistema.
 *
 * Uma tentativa intermediária de gerar os ícones aqui, decodificando o PNG do logo
 * em Node puro, foi descartada: a conversão distorceu o texto do logo (verificado
 * visualmente). Os ícones corretos são gerados UMA VEZ em Python (Pillow, redução
 * por média de área) a partir do logo oficial e ficam versionados em
 * scripts/icons-src/. Este script apenas os copia para public/ — determinístico,
 * sem desenho, sem surpresa a cada build.
 *
 * ── COMO REGENERAR OS ARQUIVOS DE scripts/icons-src/ ──
 * Fora do build, com Pillow disponível:
 *   python3 - <<'PY'
 *   from PIL import Image, ImageChops
 *   src = Image.open('public/logo-adecont.png').convert('RGB')
 *   bbox = ImageChops.difference(src, Image.new('RGB', src.size, (255,255,255))).getbbox()
 *   logo = src.crop(bbox)
 *   def icone(t, m):
 *       u = int(t*(1-2*m)); h = round(u/(logo.size[0]/logo.size[1])); w = u
 *       if h > u: h = u; w = round(h*logo.size[0]/logo.size[1])
 *       r = logo.resize((w,h), Image.LANCZOS)
 *       c = Image.new('RGB',(t,t),(255,255,255)); c.paste(r,((t-w)//2,(t-h)//2)); return c
 *   for nome,t,m in [('icon-192.png',192,.10),('icon-512.png',512,.10),
 *                    ('apple-touch-icon.png',180,.10),('favicon-32x32.png',32,.05),
 *                    ('favicon-16x16.png',16,.03)]:
 *       icone(t,m).save('scripts/icons-src/'+nome)
 *   icone(256,.06).save('scripts/icons-src/favicon.ico', sizes=[(16,16),(32,32),(48,48)])
 *   PY
 */

const ORIGEM = path.resolve(process.cwd(), 'scripts/icons-src')
const SAIDA = path.resolve(process.cwd(), 'public')

const ARQUIVOS = [
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon.ico',
  'favicon.svg',
  'favicon-32x32.svg',
  'apple-touch-icon.svg',
]

function main() {
  if (!fs.existsSync(ORIGEM)) {
    console.warn('[icones] scripts/icons-src/ ausente — ícones de public/ mantidos como estão.')
    return
  }
  let copiados = 0
  for (const nome of ARQUIVOS) {
    const de = path.join(ORIGEM, nome)
    if (!fs.existsSync(de)) continue
    fs.copyFileSync(de, path.join(SAIDA, nome))
    copiados++
  }
  console.log(
    `[icones] ${copiados} ícones copiados de scripts/icons-src/ para public/ (logo oficial completo).`,
  )
}

main()
