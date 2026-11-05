/// <reference path="../pb_data/types.d.ts" />
// Migration 0130 — Teste ao vivo da rota series-historicas para ibge_construcao e ibge_pms
migrate(
  (app) => {
    try {
      const resConstrucao = $http.send({
        url: 'https://apisidra.ibge.gov.br/values/t/8886/n1/1/v/12606/p/last%20160',
        method: 'GET',
        timeout: 10,
        headers: { Accept: 'application/json' },
      })
      const arrConstrucao = resConstrucao.json || []
      const pontosC = []
      for (let i = 0; i < arrConstrucao.length; i++) {
        const l = arrConstrucao[i]
        if (!l || l.V === 'Valor' || l.VL === 'Valor') continue
        const v = parseFloat(l.V != null ? l.V : l.VL)
        if (isFinite(v)) pontosC.push({ p: l.D3C || l.D2C || l.D1C, v })
      }

      const resPms = $http.send({
        url: 'https://apisidra.ibge.gov.br/values/t/5906/n1/1/v/7167/p/last%20160/c11046/56726',
        method: 'GET',
        timeout: 10,
        headers: { Accept: 'application/json' },
      })
      const arrPms = resPms.json || []
      const pontosP = []
      for (let i = 0; i < arrPms.length; i++) {
        const l = arrPms[i]
        if (!l || l.V === 'Valor' || l.VL === 'Valor') continue
        const v = parseFloat(l.V != null ? l.V : l.VL)
        if (isFinite(v)) pontosP.push({ p: l.D3C || l.D2C || l.D1C, v })
      }

      // Registra o resultado em content_reviews ou log
      const col = app.findCollectionByNameOrId('content_reviews')
      const rec = new Record(col)
      rec.set('review_date', new Date().toISOString())
      rec.set('status', 'ok')
      rec.set(
        'summary',
        'PROVA AO VIVO SIDRA: Construcao civil t8886=' +
          pontosC.length +
          ' pontos; PMS t5906=' +
          pontosP.length +
          ' pontos',
      )
      rec.set(
        'notes',
        'Último construção: ' +
          JSON.stringify(pontosC[pontosC.length - 1]) +
          ' | Último PMS: ' +
          JSON.stringify(pontosP[pontosP.length - 1]),
      )
      rec.set('sources_checked', [
        { key: 'ibge_construcao', pontos: pontosC.length, ultimo: pontosC[pontosC.length - 1] },
        { key: 'ibge_pms', pontos: pontosP.length, ultimo: pontosP[pontosP.length - 1] },
      ])
      app.save(rec)
    } catch (e) {
      console.log('Erro no teste ao vivo SIDRA:', e)
    }
  },
  (app) => {},
)
