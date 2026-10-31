// Script temporário para baixar e estruturar a lista oficial de 5.570 municípios do Brasil
import fs from 'node:fs'

async function run() {
  const url = 'https://raw.githubusercontent.com/adrianomargarin/brazilian-cities/master/cities.json'
  console.log('Baixando de:', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha HTTP: ${res.status}`)
  const data = await res.json()
  console.log('Total registros recebidos:', data.length)
  
  // Mapear para { codigo: city_code, nome: city_name, uf: state }
  const municipios = data.map((item: any) => ({
    codigo: String(item.city_code).trim(),
    nome: String(item.city_name).trim(),
    uf: String(item.state).trim().toUpperCase()
  }))

  // Ordenar por UF e depois por Nome
  municipios.sort((a: any, b: any) => {
    if (a.uf !== b.uf) return a.uf.localeCompare(b.uf)
    return a.nome.localeCompare(b.nome)
  })

  // Agrupamento por UF para checagem
  const porUf: Record<string, number> = {}
  for (const m of municipios) {
    porUf[m.uf] = (porUf[m.uf] || 0) + 1
  }
  console.log('Distribuição por UF:', porUf)
  console.log('Total UFs:', Object.keys(porUf).length)

  fs.writeFileSync('src/data/municipios_completo_ibge.json', JSON.stringify(municipios, null, 2))
  console.log('Arquivo salvo com sucesso!')
}

run().catch(console.error)
