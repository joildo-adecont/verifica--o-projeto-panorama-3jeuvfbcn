/**
 * NOTÍCIAS FINANCEIRAS — rota backend (proxy anti-bloqueio + cache).
 *
 * GET /backend/v1/noticias-financeiras
 *   → { ok, fonteViva, aviso, itens: [{ guid, titulo, link, resumo, publicadoEm, fonte }] }
 *
 * Fonte: feed RSS institucional oficial do Banco Central (Sala de Imprensa).
 * O navegador nunca fala direto com o feed — o backend baixa, faz o parsing,
 * grava no cache (news_cache) e devolve as notícias. Se o feed falhar, responde
 * com o que há no cache + aviso transparente (nunca erro cru). Se não houver
 * cache, devolve lista vazia + aviso.
 */
routerAdd('GET', '/backend/v1/noticias-financeiras', (e) => {
  const FEED_KEY = 'bcb_noticias'
  const FONTES_FEED = [
    'https://www.bcb.gov.br/api/conteudo/rss/pt-br/noticias',
    'https://www.bcb.gov.br/saladeimprensa/rss',
    'https://www.bcb.gov.br/api/rss/pt-br/noticias',
  ]
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/rss+xml,application/xml,text/xml,*/*',
  }

  const primeiro = (xml, tag) => {
    const m = xml.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'))
    if (!m) return ''
    return m[1]
      .replace('<![CDATA[', '')
      .replace(']]>', '')
      .replace(/<[^>]+>/g, '')
      .trim()
  }

  const lerCache = () => {
    try {
      return $app.findRecordsByFilter(
        'news_cache',
        'feed_key = "' + FEED_KEY + '"',
        '-publicado_em',
        12,
        0,
      )
    } catch (err) {
      return []
    }
  }

  let itens = []
  let falhou = false
  for (let i = 0; i < FONTES_FEED.length && itens.length === 0; i++) {
    try {
      const resp = $http.send({ url: FONTES_FEED[i], method: 'GET', timeout: 9, headers: CAB })
      const xml = String(resp.body || '')
      const blocos = xml.match(/<item[\s\S]*?<\/item>/g) || []
      for (let b = 0; b < blocos.length && itens.length < 12; b++) {
        const bloco = blocos[b]
        const titulo = primeiro(bloco, 'title')
        if (!titulo) continue
        const link = primeiro(bloco, 'link')
        const guid = primeiro(bloco, 'guid') || link || titulo
        const resumo = primeiro(bloco, 'description').slice(0, 400)
        const pub = primeiro(bloco, 'pubDate')
        let publicadoEm = new Date().toISOString()
        if (pub) {
          const d = new Date(pub)
          if (!isNaN(d.getTime())) publicadoEm = d.toISOString()
        }
        itens.push({
          guid: guid,
          titulo: titulo,
          link: link || 'https://www.bcb.gov.br/saladeimprensa',
          resumo: resumo,
          publicadoEm: publicadoEm,
          fonte: 'Banco Central do Brasil — Sala de Imprensa',
        })
      }
    } catch (err) {
      falhou = true
    }
  }

  if (itens.length > 0) {
    // grava no cache (upsert por feed_key + guid)
    const col = $app.findCollectionByNameOrId('news_cache')
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i]
      try {
        let rec = null
        try {
          rec = $app.findFirstRecordByFilter(
            'news_cache',
            'feed_key = "' + FEED_KEY + '" && guid = "' + String(it.guid).replace(/"/g, '') + '"',
          )
        } catch (_) {
          rec = null
        }
        if (!rec) rec = new Record(col)
        rec.set('feed_key', FEED_KEY)
        rec.set('guid', String(it.guid).replace(/"/g, ''))
        rec.set('titulo', it.titulo)
        rec.set('link', it.link)
        rec.set('resumo', it.resumo)
        rec.set('publicado_em', it.publicadoEm)
        rec.set('fonte_nome', it.fonte)
        rec.set('fetched_at', new Date().toISOString())
        $app.save(rec)
      } catch (dbErr) {
        console.log('news_cache: falha ao gravar item: ' + String(dbErr))
      }
    }
    return e.json(200, { ok: true, fonteViva: true, aviso: '', itens: itens })
  }

  // Feed falhou — responde com o cache + aviso transparente
  const cache = lerCache()
  const itensCache = cache.map(function (r) {
    return {
      guid: r.getString('guid'),
      titulo: r.getString('titulo'),
      link: r.getString('link'),
      resumo: r.getString('resumo'),
      publicadoEm: r.getDateTime('publicado_em') ? String(r.getDateTime('publicado_em')) : '',
      fonte: r.getString('fonte_nome') || 'Banco Central do Brasil',
    }
  })
  return e.json(200, {
    ok: true,
    fonteViva: false,
    aviso:
      'Feed oficial do Banco Central indisponível neste momento — exibindo as últimas notícias em cache (podem estar desatualizadas).',
    itens: itensCache,
  })
})
