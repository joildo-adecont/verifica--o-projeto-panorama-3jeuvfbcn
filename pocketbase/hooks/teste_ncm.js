/// <reference path="../pb_data/types.d.ts" />

/** ROTA TEMPORÁRIA — verifica se o backend lê os arquivos de estado dos agentes NCM. */
routerAdd('POST', '/backend/v1/param-teste-ncm-agentes', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  var meu = $secrets.get('TESTE_PARAM_TOKEN') || ''
  var veio = e.request.header.get('X-Teste-Token') || ''
  if (!meu || veio !== meu) return e.json(404, { success: false, error: 'não encontrado' })

  var out = {}
  var arquivos = [
    { nome: 'validador', path: '/home/ethos/.assistant/workspace/tmp/ncm-validador-ultimo.json' },
    { nome: 'monitor', path: '/home/ethos/.assistant/workspace/tmp/ncm-monitor-ultimo.json' },
  ]

  for (var i = 0; i < arquivos.length; i++) {
    var a = arquivos[i]
    try {
      var bruto = $os.readFile(a.path)
      var txt = String(bruto)
      var d = JSON.parse(txt)
      out[a.nome] = {
        leu: true,
        bytes: txt.length,
        estado: d.estado || '(validador nao tem estado)',
        quando: d.quando || '',
        ok: d.verificacoes_ok,
        total: d.verificacoes_total,
        relevantes: d.relevantes ? d.relevantes.length : 0,
        achados: d.achados ? d.achados.length : 0,
      }
    } catch (err) {
      out[a.nome] = { leu: false, erro: String(err).slice(0, 160) }
    }
  }

  return e.json(200, { success: true, resultado: out })
})
