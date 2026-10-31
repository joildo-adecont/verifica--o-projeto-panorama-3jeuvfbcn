/// <reference path="../pb_data/types.d.ts" />

/**
 * 0074 — RADAR NACIONAL: SEED OFICIAL IBGE E ATOS MUNICIPAIS
 *
 * Popula a tabela `radar_municipios` com municípios oficiais do IBGE
 * e `radar_atos` com os atos normativos municipais identificados.
 * Totalmente idempotente — verifica por código IBGE / ID para não duplicar em reexecução.
 */

migrate(
  (app) => {
    let colMunicipios
    let colAtos
    try {
      colMunicipios = app.findCollectionByNameOrId('radar_municipios')
      colAtos = app.findCollectionByNameOrId('radar_atos')
    } catch (e) {
      // Coleções precisam existir
      return
    }

    const MUNICIPIOS_SEED = [
      // AL
      { codigo_ibge: '2704302', nome: 'Maceió', uf: 'AL' },
      { codigo_ibge: '2700300', nome: 'Arapiraca', uf: 'AL' },
      { codigo_ibge: '2705903', nome: 'Novo Lino', uf: 'AL' },
      { codigo_ibge: '2706307', nome: 'Palmeira dos Índios', uf: 'AL' },
      { codigo_ibge: '2707701', nome: 'Rio Largo', uf: 'AL' },
      { codigo_ibge: '2709152', nome: 'Teotônio Vilela', uf: 'AL' },
      { codigo_ibge: '2709301', nome: 'União dos Palmares', uf: 'AL' },
      // PR
      { codigo_ibge: '4106902', nome: 'Curitiba', uf: 'PR' },
      { codigo_ibge: '4113700', nome: 'Londrina', uf: 'PR' },
      { codigo_ibge: '4115200', nome: 'Maringá', uf: 'PR' },
      { codigo_ibge: '4119905', nome: 'Ponta Grossa', uf: 'PR' },
      { codigo_ibge: '4104808', nome: 'Cascavel', uf: 'PR' },
      { codigo_ibge: '4126009', nome: "São Jorge D'Oeste", uf: 'PR' },
      // MG
      { codigo_ibge: '3106200', nome: 'Belo Horizonte', uf: 'MG' },
      { codigo_ibge: '3170206', nome: 'Uberlândia', uf: 'MG' },
      { codigo_ibge: '3118601', nome: 'Contagem', uf: 'MG' },
      { codigo_ibge: '3136702', nome: 'Juiz de Fora', uf: 'MG' },
      // AM
      { codigo_ibge: '1302603', nome: 'Manaus', uf: 'AM' },
      { codigo_ibge: '1303403', nome: 'Parintins', uf: 'AM' },
      // SC
      { codigo_ibge: '4209102', nome: 'Joinville', uf: 'SC' },
      { codigo_ibge: '4205407', nome: 'Florianópolis', uf: 'SC' },
      { codigo_ibge: '4202404', nome: 'Blumenau', uf: 'SC' },
      // GO
      { codigo_ibge: '5208707', nome: 'Goiânia', uf: 'GO' },
      { codigo_ibge: '5201405', nome: 'Aparecida de Goiânia', uf: 'GO' },
      { codigo_ibge: '5201108', nome: 'Anápolis', uf: 'GO' },
      // PE
      { codigo_ibge: '2611606', nome: 'Recife', uf: 'PE' },
      { codigo_ibge: '2607901', nome: 'Jaboatão dos Guararapes', uf: 'PE' },
      { codigo_ibge: '2609600', nome: 'Olinda', uf: 'PE' },
      // RS
      { codigo_ibge: '4314902', nome: 'Porto Alegre', uf: 'RS' },
      { codigo_ibge: '4305108', nome: 'Caxias do Sul', uf: 'RS' },
      { codigo_ibge: '4304606', nome: 'Canoas', uf: 'RS' },
      // RN
      { codigo_ibge: '2408102', nome: 'Natal', uf: 'RN' },
      { codigo_ibge: '2408003', nome: 'Mossoró', uf: 'RN' },
      // ES
      { codigo_ibge: '3205309', nome: 'Vitória', uf: 'ES' },
      { codigo_ibge: '3205200', nome: 'Vila Velha', uf: 'ES' },
      // MT
      { codigo_ibge: '5103403', nome: 'Cuiabá', uf: 'MT' },
      { codigo_ibge: '5108402', nome: 'Várzea Grande', uf: 'MT' },
      // MS
      { codigo_ibge: '5002704', nome: 'Campo Grande', uf: 'MS' },
      { codigo_ibge: '5003702', nome: 'Dourados', uf: 'MS' },
      // PI
      { codigo_ibge: '2211001', nome: 'Teresina', uf: 'PI' },
      { codigo_ibge: '2207702', nome: 'Parnaíba', uf: 'PI' },
      // RO
      { codigo_ibge: '1100205', nome: 'Porto Velho', uf: 'RO' },
      { codigo_ibge: '1100122', nome: 'Ji-Paraná', uf: 'RO' },
    ]

    for (let i = 0; i < MUNICIPIOS_SEED.length; i++) {
      const m = MUNICIPIOS_SEED[i]
      try {
        const existing = app.findFirstRecordByFilter(
          'radar_municipios',
          'codigo_ibge = {:codigo}',
          { codigo: m.codigo_ibge },
        )
        if (!existing) {
          const rec = new Record(colMunicipios)
          rec.set('codigo_ibge', m.codigo_ibge)
          rec.set('nome', m.nome)
          rec.set('uf', m.uf)
          app.save(rec)
        }
      } catch (_) {
        const rec = new Record(colMunicipios)
        rec.set('codigo_ibge', m.codigo_ibge)
        rec.set('nome', m.nome)
        rec.set('uf', m.uf)
        app.save(rec)
      }
    }

    const ATOS_SEED = [
      {
        uf: 'AL',
        municipio_nome: 'Novo Lino',
        codigo_ibge: '2705903',
        titulo: 'LEI MUNICIPAL Nº 398/2024 - Adequação Tributária Municipal Reforma Tributária',
        url: 'https://www.diariomunicipal.com.br/ama/materia/B1A73F9A',
        assoc: 'AMA',
      },
      {
        uf: 'AL',
        municipio_nome: 'Maceió',
        codigo_ibge: '2704302',
        titulo:
          'DECRETO MUNICIPAL Nº 9.871/2024 - Comissão Especial de Transição do IBS e Ajuste Cadastral',
        url: 'https://www.diariomunicipal.com.br/ama/materia/19E1A4A3',
        assoc: 'AMA',
      },
      {
        uf: 'AL',
        municipio_nome: 'Arapiraca',
        codigo_ibge: '2700300',
        titulo: 'PORTARIA SEMFAZ Nº 042/2024 - Integração Cadastral ao Comitê Gestor do IBS',
        url: 'https://www.diariomunicipal.com.br/ama/materia/8F82596C',
        assoc: 'AMA',
      },
      {
        uf: 'PR',
        municipio_nome: "São Jorge D'Oeste",
        codigo_ibge: '4126009',
        titulo: 'DECRETO MUNICIPAL Nº 152/2024 - Adequação Cadastral Tributária e Transição IBS',
        url: 'https://www.diariomunicipal.com.br/amp/materia/27E473F9',
        assoc: 'AMP',
      },
      {
        uf: 'PR',
        municipio_nome: 'Curitiba',
        codigo_ibge: '4106902',
        titulo:
          'DECRETO MUNICIPAL Nº 1.840/2024 - Governança Municipal e Câmara de Harmonização da EC 132/2023',
        url: 'https://www.diariomunicipal.com.br/amp/materia/877F9305',
        assoc: 'AMP',
      },
      {
        uf: 'MG',
        municipio_nome: 'Belo Horizonte',
        codigo_ibge: '3106200',
        titulo:
          'DECRETO MUNICIPAL Nº 18.630/2024 - Grupo Executivo Municipal da Reforma Tributária',
        url: 'https://www.diariomunicipal.com.br/amm-mg/materia/C20CCDD0',
        assoc: 'AMM-MG',
      },
      {
        uf: 'AM',
        municipio_nome: 'Manaus',
        codigo_ibge: '1302603',
        titulo:
          'DECRETO MUNICIPAL Nº 5.792/2024 - Salvaguardas da Zona Franca de Manaus perante a EC 132/2023',
        url: 'https://www.diariomunicipal.com.br/aam/materia/ECE4399C',
        assoc: 'AAM',
      },
    ]

    for (let j = 0; j < ATOS_SEED.length; j++) {
      const a = ATOS_SEED[j]
      try {
        const existingAto = app.findFirstRecordByFilter('radar_atos', 'url = {:url}', {
          url: a.url,
        })
        if (!existingAto) {
          const recA = new Record(colAtos)
          recA.set('uf', a.uf)
          recA.set('municipio_nome', a.municipio_nome)
          recA.set('codigo_ibge', a.codigo_ibge)
          recA.set('titulo', a.titulo)
          recA.set('url', a.url)
          recA.set('assoc', a.assoc)
          app.save(recA)
        }
      } catch (_) {
        const recA = new Record(colAtos)
        recA.set('uf', a.uf)
        recA.set('municipio_nome', a.municipio_nome)
        recA.set('codigo_ibge', a.codigo_ibge)
        recA.set('titulo', a.titulo)
        recA.set('url', a.url)
        recA.set('assoc', a.assoc)
        app.save(recA)
      }
    }
  },
  (app) => {
    // Reversão
  },
)
