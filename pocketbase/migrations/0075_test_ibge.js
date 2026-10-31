/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Teste de download dos municípios oficiais do IBGE
    try {
      const res = $http.send({
        url: 'https://raw.githubusercontent.com/chandez/Estados-Cidades-IBGE/master/json/municipios.json',
        method: 'GET',
        timeout: 30,
      })
      console.log(
        'TESTE_IBGE_DOWNLOAD: Status=',
        res.statusCode,
        'Len=',
        res.raw ? res.raw.length : 0,
      )
      if (res.statusCode === 200) {
        const data = JSON.parse(res.raw)
        const list = data.data || []
        console.log('TESTE_IBGE_DOWNLOAD: Total itens=', list.length)
        if (list.length > 0) {
          console.log('TESTE_IBGE_DOWNLOAD: Primeiro=', JSON.stringify(list[0]))
          console.log('TESTE_IBGE_DOWNLOAD: Ultimo=', JSON.stringify(list[list.length - 1]))
        }
      }
    } catch (err) {
      console.log('TESTE_IBGE_DOWNLOAD ERRO:', err)
    }
  },
  (app) => {},
)
