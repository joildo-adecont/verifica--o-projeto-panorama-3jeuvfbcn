/*
 * SERVICE WORKER — Panorama da Reforma Tributária (ADECONT)
 * =========================================================
 *
 * POR QUE ELE EXISTE (pedido do CEO, 02/11/2026):
 * "bem como o link para instalação, pronto para receber as atualizações."
 *
 * Sem service worker o app NÃO é instalável de verdade: o navegador até oferece
 * "adicionar à tela inicial", mas abre uma aba do navegador em vez de um app, e
 * nunca recebe atualização. Com ele o app abre em janela própria (standalone),
 * funciona offline e busca versão nova.
 *
 * ── ESTRATÉGIA (deliberadamente conservadora) ──
 * O Panorama publica conteúdo novo toda semana. Servir HTML/CSS/JS do cache
 * faria o CEO ver a lei de ontem. Então:
 *
 *   NAVEGAÇÃO (HTML)  -> network-first. Sempre busca a versão nova; só usa o
 *                        cache se estiver sem rede. Assim a atualização aparece
 *                        no primeiro carregamento, não no segundo.
 *   58 assets (JS/CSS/imagem) -> stale-while-revalidate. Abre rápido pelo cache
 *                        e atualiza em segundo plano; na próxima abertura já é
 *                        a versão nova.
 *   API/backend       -> NUNCA cacheia. Dado tributário tem de ser fresco.
 *
 * ── CUIDADO QUE JÁ CUSTOU CARO ANTES ──
 * Um service worker com cache agressivo "congela" o site: o usuário vê a versão
 * antiga para sempre e nem recarregar resolve. Por isso a navegação é
 * network-first e o cache tem nome versionado (VERSAO): subir a versão limpa
 * todo o cache antigo no `activate`.
 */

const VERSAO = 'panorama-rt-v1.0.0'
const CACHE_ESTATICO = `${VERSAO}-estatico`

/* Só os arquivos que fazem sentido ter offline. A lista é curta de propósito:
 * guardar os ~40 MB de dados das seções (tabelaGeral, ribs) encheria o
 * armazenamento do celular. Eles chegam pela rede quando a aba abre. */
const ESSENCIAIS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/logo-adecont.png',
]

/* ── INSTALAÇÃO ─────────────────────────────────────────────────────────── */
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_ESTATICO)
      // addAll falha inteiro se UM arquivo der 404 — por isso vai um a um e
      // ignora o que não existir. A instalação nunca deve falhar por causa de
      // um favicon ausente.
      await Promise.all(
        ESSENCIAIS.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)),
      )
      // assume o controle sem esperar todas as abas fecharem
      await self.skipWaiting()
    })(),
  )
})

/* ── ATIVAÇÃO: limpa cache de versões antigas ───────────────────────────── */
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nomes = await caches.keys()
      await Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

/* ── BUSCA ───────────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (evento) => {
  const req = evento.request

  // Só GET. POST/PUT (envio de simulação) nunca passa pelo cache.
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // Origem diferente (CDN de fonte, backend) -> deixa o navegador resolver.
  if (url.origin !== self.location.origin) return

  // Backend / API / PocketBase -> sempre rede, nunca cache.
  if (
    url.pathname.startsWith('/backend/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/.well-known/')
  ) {
    return
  }

  // NAVEGAÇÃO: network-first. A lei de hoje não pode vir do cache de ontem.
  if (req.mode === 'navigate') {
    evento.respondWith(
      (async () => {
        try {
          const rede = await fetch(req)
          const cache = await caches.open(CACHE_ESTATICO)
          cache.put('/', rede.clone()).catch(() => null)
          return rede
        } catch (_) {
          const cache = await caches.open(CACHE_ESTATICO)
          const guardado = await cache.match('/')
          if (guardado) return guardado
          return new Response(
            '<!doctype html><meta charset="utf-8"><title>Sem conexão</title>' +
              '<body style="font-family:system-ui;padding:32px;text-align:center">' +
              '<h1>Sem conexão</h1><p>O Panorama precisa de internet para carregar ' +
              'a legislação atualizada. Verifique a rede e tente de novo.</p></body>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 },
          )
        }
      })(),
    )
    return
  }

  // ASSETS: stale-while-revalidate.
  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_ESTATICO)
      const guardado = await cache.match(req)
      const daRede = fetch(req)
        .then((resp) => {
          if (resp && resp.ok && resp.type === 'basic') {
            cache.put(req, resp.clone()).catch(() => null)
          }
          return resp
        })
        .catch(() => null)
      return guardado || (await daRede) || new Response('', { status: 504 })
    })(),
  )
})

/* ── MENSAGEM DO APP ─────────────────────────────────────────────────────────
 * O app pode pedir "pule a espera" quando avisa o usuário que há versão nova. */
self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.tipo === 'PULAR_ESPERA') {
    self.skipWaiting()
  }
})
