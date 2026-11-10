/// <reference path="../pb_data/types.d.ts" />

routerAdd('GET', '/backend/v1/parsear-e-relatar-cardoso', (e) => {
  e.response.header().set('Access-Control-Allow-Origin', '*')
  const titulos = [
    { titulo: 'Balanço de out a dez-2019', ex: '2019' },
    { titulo: 'Balanço 2020', ex: '2020' },
    { titulo: 'Balanço 2021', ex: '2021' },
    { titulo: 'Balanço 2022', ex: '2022' },
    { titulo: 'Balanço 2023', ex: '2023' },
    { titulo: 'Balanço 2024', ex: '2024' },
    { titulo: 'Balanço 2025', ex: '2025' },
    { titulo: 'Balancete 2026', ex: '2026' },
    { titulo: 'Contrato social - CARDOSO & SIX LTDA.pdf', ex: '2018' },
  ]

  const relatorio = []
  for (let idx = 0; idx < titulos.length; idx++) {
    const item = titulos[idx]
    try {
      const r = $app.findFirstRecordByFilter('cliente_arquivos', 'titulo = {:t}', {
        t: item.titulo,
      })
      const { markdown } = $documents.toMarkdown({ record: r, field: 'arquivo' })
      const linhas = markdown
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      // Encontra linhas que parecem contas contábeis
      const linhasComValor = []
      for (let j = 0; j < linhas.length; j++) {
        const l = linhas[j]
        if (/\d+,\d{2}/.test(l)) {
          linhasComValor.push(l)
        }
      }

      relatorio.push({
        titulo: item.titulo,
        exercicio: item.ex,
        status: 'texto_extraido',
        totalLinhas: linhas.length,
        linhasComValor: linhasComValor.length,
        primeirasLinhasComValor: linhasComValor.slice(0, 15),
      })
    } catch (err) {
      relatorio.push({
        titulo: item.titulo,
        exercicio: item.ex,
        status: err.status === 422 ? 'escaneado' : 'erro',
        erro: String(err.message || err),
      })
    }
  }

  const jsonStr = JSON.stringify({ ok: true, relatorio })
  e.response.header().set('Content-Type', 'application/json')
  e.response.write(jsonStr)
})
