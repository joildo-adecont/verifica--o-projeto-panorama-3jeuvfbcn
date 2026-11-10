/// <reference path="../pb_data/types.d.ts" />

cronAdd('seed_contrato_social_cardoso', '*/5 * * * *', () => {
  try {
    const r = $app.findFirstRecordByFilter('cliente_arquivos', 'titulo = "Balanço 2020"')
    const { markdown } = $documents.toMarkdown({ record: r, field: 'arquivo' })
    const lines = markdown.split('\n').filter((l) => l.trim().length > 0)
    for (let i = 0; i < lines.length; i += 4) {
      console.log(`[RAW_2020_${i}] ${lines.slice(i, i + 4).join(' <<<>>> ')}`)
    }
  } catch (err) {
    console.error('[RAW_2020_ERR]', err)
  }
})
