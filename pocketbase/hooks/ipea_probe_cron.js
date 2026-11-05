/**
 * PROBE TEMPORÁRIO — descoberta de códigos IPEADATA/BCB (remover após uso).
 * Cron por minuto; escreve TUDO no log hooks.
 */
cronAdd('ipea_probe', '* * * * *', () => {
  const LINHAS = []
  function L(s) {
    LINHAS.push(String(s))
    console.log(s)
  }
  const CAB = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  }
  function get(url, t) {
    try {
      return $http.send({ url: url, method: 'GET', timeout: t, headers: CAB })
    } catch (err) {
      return { err: String(err) }
    }
  }
  function enc(s) {
    return String(s).replace(/ /g, '%20').replace(/'/g, '%27')
  }
  const BASE = 'https://www.ipeadata.gov.br/api/odata4'

  // 1) Metadados por lote de códigos exatos (controle: GM366_IBVSP366 conhecido-bom)
  const codigos = [
    'GM366_IBVSP366',
    'SPX366',
    'GM366_SPX366',
    'INDU366',
    'GM366_INDU366',
    'CCMP366',
    'GM366_CCMP366',
    'GSPC366',
    'DJI366',
    'IXIC366',
    'SP500366',
    'DJIA366',
    'NASDAQ366',
    'IFIX366',
    'GM366_IFIX366',
    'SP500',
    'DJIA',
    'NASDAQ',
    'SPX',
    'INDU',
    'CCMP',
    'IFIX',
  ]
  const filtro = codigos
    .map(function (c) {
      return "SERCODIGO eq '" + c + "'"
    })
    .join(' or ')
  const r1 = get(BASE + '/Metadados?$filter=' + enc(filtro), 25)
  if (r1.err) {
    L('PROBE metadados-codigos ERRO: ' + r1.err)
  } else {
    const v1 = r1.json && r1.json.value ? r1.json.value : []
    const nomes = v1.map(function (m) {
      return m.SERCODIGO + ' | ' + m.SERNOME + ' | ' + String(m.SERPERIODICIDADE || '') + ' | fim:' + String(m.SERMAXDATA || '')
    })
    L('PROBE metadados-codigos status=' + r1.statusCode + ' hits=' + v1.length + ' :: ' + nomes.join(' ;; '))
  }

  // 2) Metadados por nome
  const nomesBusca = ['S&P 500', 'Dow Jones', 'Nasdaq', 'IFIX', 'Standard', 'IBOV']
  for (let i = 0; i < nomesBusca.length; i++) {
    const f = "contains(SERNOME,'" + nomesBusca[i] + "')"
    const rn = get(BASE + '/Metadados?$filter=' + enc(f), 25)
    if (rn.err) {
      L('PROBE nome[' + nomesBusca[i] + '] ERRO: ' + rn.err)
      continue
    }
    const vn = rn.json && rn.json.value ? rn.json.value : []
    const lista = vn
      .slice(0, 12)
      .map(function (m) {
        return m.SERCODIGO + ' | ' + m.SERNOME + ' | fim:' + String(m.SERMAXDATA || '')
      })
    L('PROBE nome[' + nomesBusca[i] + '] status=' + rn.statusCode + ' hits=' + vn.length + ' :: ' + lista.join(' ;; '))
  }

  // 3) ValoresSerie top-2 desc para os hits do lote de códigos
  const hits = []
  try {
    const v1b = r1.json && r1.json.value ? r1.json.value : []
    for (let k = 0; k < v1b.length; k++) hits.push(String(v1b[k].SERCODIGO))
  } catch (_) {}
  for (let h = 0; h < hits.length; h++) {
    const rv = get(
      BASE +
        "/ValoresSerie(SERCODIGO='" +
        hits[h] +
        "')?$top=2&$orderby=VALDATA%20desc",
      20,
    )
    if (rv.err) {
      L('PROBE valores[' + hits[h] + '] ERRO: ' + rv.err)
      continue
    }
    const vv = rv.json && rv.json.value ? rv.json.value : []
    L(
      'PROBE valores[' +
        hits[h] +
        '] status=' +
        rv.statusCode +
        ' n=' +
        vv.length +
        ' :: ' +
        vv
          .map(function (x) {
            return String(x.VALDATA || '') + '=' + String(x.VALVALOR)
          })
          .join(' ;; '),
    )
  }

  // 4) BCB SGS candidatos a IFIX
  const sgs = [139731, 139734, 139732, 139733]
  for (let s = 0; s < sgs.length; s++) {
    const rs = get(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + sgs[s] + '/dados/ultimos/2?formato=json',
      15,
    )
    if (rs.err) {
      L('PROBE sgs[' + sgs[s] + '] ERRO: ' + rs.err)
      continue
    }
    let corpo = ''
    try {
      corpo = JSON.stringify(rs.json)
    } catch (_) {
      corpo = 'sem-json'
    }
    L('PROBE sgs[' + sgs[s] + '] status=' + rs.statusCode + ' :: ' + String(corpo).slice(0, 300))
  }

  // 5) Alternativa Stooq (CSV mensal, sem chave) para os índices globais
  const stq = ['%5Espx', '%5Edji', '%5Endx']
  for (let t = 0; t < stq.length; t++) {
    const rq = get('https://stooq.com/q/d/l/?s=' + stq[t] + '&i=m', 15)
    if (rq.err) {
      L('PROBE stooq[' + stq[t] + '] ERRO: ' + rq.err)
      continue
    }
    const txt = typeof rq.json === 'string' ? rq.json : rq.body ? String(rq.body) : JSON.stringify(rq.json)
    L(
      'PROBE stooq[' + stq[t] + '] status=' + rq.statusCode + ' :: ' + String(txt || '').slice(0, 400),
    )
  }

  L('PROBE rodada concluída')

  // Publica as linhas na coleção series_cache para leitura via db_query.
  try {
    let rec = null
    try {
      rec = $app.findFirstRecordByData('series_cache', 'chave', 'probe_ipea')
    } catch (_) {
      const col = $app.findCollectionByNameOrId('series_cache')
      rec = new Record(col)
      rec.set('chave', 'probe_ipea')
    }
    const agora = new Date().toISOString()
    rec.set('payload', JSON.stringify({ fetched_at_iso: agora, serie: LINHAS }))
    rec.set('fonte', 'probe')
    rec.set('fetched_at', agora)
    $app.save(rec)
    console.log('PROBE salvo em series_cache/probe_ipea (' + LINHAS.length + ' linhas)')
  } catch (errSave) {
    console.log('PROBE falha ao salvar: ' + String(errSave))
  }
})
