/**
 * PROBE TEMPORÁRIO — o que o host do backend oferece para ler PDF?
 * Será removido depois da decisão.
 */
routerAdd('GET', '/backend/v1/probe-os', (e) => {
  // Teste ao vivo das 4 chaves BACEN chamando a função interna/HTTP
  const chaves = ['juros_medio', 'cdi', 'poupanca', 'saldo_credito']
  const resultado = {}
  for (let i = 0; i < chaves.length; i++) {
    const k = chaves[i]
    try {
      const resp = $http.send({
        url: 'http://127.0.0.1:8090/backend/v1/series-historicas?chave=' + k + '&reteste=1',
        method: 'GET',
        timeout: 12,
      })
      resultado[k] = {
        status: resp ? resp.statusCode : 0,
        body: resp ? resp.json : null,
      }
    } catch (err) {
      resultado[k] = { erro: String(err) }
    }
  }

  // Também grava o resultado em source_status para podermos inspecionar via db_query
  try {
    let rec = $app.findFirstRecordByData('source_status', 'source_key', 'bcb_bacen')
    if (rec) {
      rec.set('response_time_ms', 100)
      rec.set(
        'last_checked_at',
        JSON.stringify({
          val_chaves: Object.keys(resultado).map((k) => ({
            chave: k,
            status: resultado[k].status,
            fonteViva: resultado[k].body ? resultado[k].body.fonteViva : false,
            baseInterna: resultado[k].body ? resultado[k].body.baseInterna : false,
            fonte: resultado[k].body ? resultado[k].body.fonte : '',
            pontos:
              resultado[k].body && Array.isArray(resultado[k].body.serie)
                ? resultado[k].body.serie.length
                : 0,
            aviso: resultado[k].body ? resultado[k].body.aviso : '',
            amostra:
              resultado[k].body && Array.isArray(resultado[k].body.serie)
                ? resultado[k].body.serie.slice(-2)
                : [],
          })),
        }),
      )
      $app.save(rec)
    }
  } catch (errRec) {
    resultado.erro_gravacao = String(errRec)
  }

  return e.json(200, resultado)
})
