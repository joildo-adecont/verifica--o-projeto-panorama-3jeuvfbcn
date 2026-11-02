// Dispara verificação para testar o hook
routerAdd('GET', '/backend/v1/test-check-sources-exec', (e) => {
  try {
    const res = $http.send({
      url: 'https://verificacao-projeto-panorama-18549.shrd02.internal.goskip.dev/backend/v1/check-sources',
      method: 'POST',
      timeout: 15,
    })
    return e.json(200, { ok: true, status: res.statusCode, body: res.json })
  } catch (err) {
    return e.json(500, { ok: false, error: String(err) })
  }
})
