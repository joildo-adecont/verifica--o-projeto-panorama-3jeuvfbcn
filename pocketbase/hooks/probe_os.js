/**
 * PROBE TEMPORÁRIO — o que o host do backend oferece para ler PDF?
 * Será removido depois da decisão.
 */
routerAdd('GET', '/backend/v1/probe-os', (e) => {
  var info = { tem_os: false, chaves: [], exec: null, python: null, pdftotext: null }
  try {
    if (typeof $os !== 'undefined' && $os) {
      info.tem_os = true
      info.chaves = Object.keys($os)
    }
  } catch (err) {
    info.erro_os = String(err)
  }
  try {
    info.exec = String($os.exec('echo oi'))
  } catch (err) {
    info.exec = 'ERRO: ' + String(err).slice(0, 120)
  }
  try {
    info.python = String($os.exec('python3 --version 2>&1 || echo SEM_PYTHON'))
  } catch (err) {
    info.python = 'ERRO: ' + String(err).slice(0, 120)
  }
  try {
    info.pdftotext = String($os.exec('which pdftotext 2>&1 || echo SEM_PDFTOTEXT'))
  } catch (err) {
    info.pdftotext = 'ERRO: ' + String(err).slice(0, 120)
  }
  return e.json(200, info)
})
