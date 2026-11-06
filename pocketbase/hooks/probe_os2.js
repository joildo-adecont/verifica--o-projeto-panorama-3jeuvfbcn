/**
 * PROBE TEMPORÁRIO 2 — $os.cmd executa? writeFile/readFile funcionam?
 */
routerAdd('GET', '/backend/v1/probe-os2', (e) => {
  var out = {}
  try {
    out.cmd_echo = String($os.cmd('echo', 'oi'))
  } catch (err) {
    out.cmd_echo = 'ERRO: ' + String(err).slice(0, 150)
  }
  try {
    out.cmd_python = String($os.cmd('python3', '-c', 'print(2+2)'))
  } catch (err) {
    out.cmd_python = 'ERRO: ' + String(err).slice(0, 150)
  }
  try {
    var p = $os.tempDir() + '/probe.txt'
    $os.writeFile(p, 'conteudo-teste', 0o644)
    out.escrita = 'ok'
    out.leitura = String($os.readFile(p))
    try {
      $os.remove(p)
    } catch (_) {}
  } catch (err) {
    out.escrita = 'ERRO: ' + String(err).slice(0, 150)
  }
  return e.json(200, out)
})
