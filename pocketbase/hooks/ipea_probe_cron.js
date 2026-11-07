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

  // Consulta direta ao SGS do BCB para as 4 chaves e grava em unblock_channel
  try {
    const sgsBacen = [
      { chave: 'juros_medio', sgs: 20714 },
      { chave: 'cdi', sgs: 4391 },
      { chave: 'poupanca', sgs: 195 },
      { chave: 'saldo_credito', sgs: 20622 },
    ]
    const partes = []
    for (let i = 0; i < sgsBacen.length; i++) {
      const it = sgsBacen[i]
      const u =
        'https://api.bcb.gov.br/dados/serie/bcdata.sgs.' + it.sgs + '/dados/ultimos/2?formato=json'
      const r = get(u, 6)
      if (r.err) {
        partes.push(it.chave + ':ERR(' + r.err + ')')
      } else {
        const arr = Array.isArray(r.json) ? r.json : []
        partes.push(it.chave + ':SGS' + it.sgs + '=200(n=' + arr.length + ')')
      }
    }
    let rB = $app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
    if (rB) {
      rB.set('unblock_channel', partes.join('; ').slice(0, 250))
      $app.save(rB)
    }
  } catch (e) {}

  L('PROBE rodada concluída')
})
