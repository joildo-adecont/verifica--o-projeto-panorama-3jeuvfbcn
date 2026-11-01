import { describe, it, expect } from 'vitest'
import {
  filtrarAtosRadar,
  contarFiltrosRadarAtivos,
  filtrarMunicipiosPorRecorte,
  FILTROS_RADAR_INICIAIS,
  OPCOES_NIVEIS_RADAR,
} from './radarFilters'
import type { RadarAtoItem, RadarMunicipioItem } from './radarMunicipios'

const ATOS_MOCK: RadarAtoItem[] = [
  {
    id: 'ato-1',
    codigo_ibge: '3550308',
    uf: 'SP',
    municipio_nome: 'São Paulo',
    titulo: 'Decreto Municipal nº 63.123/2026 — Regulamenta adesão ao Comitê Gestor do IBS',
    resumo: 'Ato do município de São Paulo sobre transição do ISS para o IBS',
    data: '2026-03-15',
    nivel: 'municipal',
  },
  {
    id: 'ato-2',
    codigo_ibge: '3304557',
    uf: 'RJ',
    municipio_nome: 'Rio de Janeiro',
    titulo:
      'Lei Municipal nº 8.900/2026 — Regime especial de conformidade da NFS-e padrão nacional',
    resumo: 'Adequação da NFS-e municipal às diretrizes do CGIBS',
    data: '2026-04-10',
    nivel: 'municipal',
  },
  {
    id: 'ato-3',
    codigo_ibge: '4314902',
    uf: 'RS',
    municipio_nome: 'Porto Alegre',
    titulo: 'Decreto Estadual nº 57.000/2026 — Adequação do ICMS às alíquotas de teste',
    resumo: 'Publicação oficial no Diário do Estado do RS',
    data: '2026-02-20',
    nivel: 'estadual',
  },
  {
    id: 'ato-4',
    codigo_ibge: '5300108',
    uf: 'DF',
    municipio_nome: 'Brasília',
    titulo: 'Ato Conjunto RFB/CGIBS nº 1/2025 — Cadastro Nacional de Contribuintes do IBS e CBS',
    resumo: 'Regras federais de alcance nacional',
    data: '2025-11-01',
    nivel: 'federal',
  },
]

describe('Filtros facetados do Radar Nacional (radarFilters.ts)', () => {
  it('sem filtros retorna todos os atos', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, FILTROS_RADAR_INICIAIS)
    expect(res).toHaveLength(4)
    expect(contarFiltrosRadarAtivos(FILTROS_RADAR_INICIAIS)).toBe(0)
  })

  it('filtra por nível: municipal', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, {
      ...FILTROS_RADAR_INICIAIS,
      niveis: ['municipal'],
    })
    expect(res).toHaveLength(2)
    for (const a of res) {
      expect(a.nivel).toBe('municipal')
    }
  })

  it('filtra por nível combinável: estadual e federal', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, {
      ...FILTROS_RADAR_INICIAIS,
      niveis: ['estadual', 'federal'],
    })
    expect(res).toHaveLength(2)
    const niveis = res.map((a) => a.nivel)
    expect(niveis).toContain('estadual')
    expect(niveis).toContain('federal')
  })

  it('filtra por estado (UF): SP', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, {
      ...FILTROS_RADAR_INICIAIS,
      uf: 'SP',
    })
    expect(res).toHaveLength(1)
    expect(res[0].municipio_nome).toBe('São Paulo')
  })

  it('filtra por município específico (código IBGE): Rio de Janeiro', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, {
      ...FILTROS_RADAR_INICIAIS,
      municipio: {
        id: 'mun-rj-01',
        codigo_ibge: '3304557',
        nome: 'Rio de Janeiro',
        uf: 'RJ',
      },
    })
    expect(res).toHaveLength(1)
    expect(res[0].codigo_ibge).toBe('3304557')
  })

  it('combina UF + nível + termo de busca', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, {
      termo: 'transição',
      uf: 'SP',
      municipio: null,
      niveis: ['municipal'],
    })
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe('ato-1')
  })

  it('combinação sem correspondência gera estado vazio', () => {
    const res = filtrarAtosRadar(ATOS_MOCK, {
      ...FILTROS_RADAR_INICIAIS,
      uf: 'SP',
      niveis: ['estadual'], // Em SP temos apenas ato municipal no mock
    })
    expect(res).toHaveLength(0)
  })

  it('contagem de filtros ativos soma corretamente', () => {
    expect(
      contarFiltrosRadarAtivos({
        termo: 'IBS',
        uf: 'SP',
        municipio: { id: 'mun-sp-01', codigo_ibge: '3550308', nome: 'São Paulo', uf: 'SP' },
        niveis: ['municipal', 'estadual'],
      }),
    ).toBe(5) // 1 termo + 1 uf + 1 município + 2 níveis = 5
  })

  it('opções de nível têm rótulos oficiais padronizados', () => {
    expect(OPCOES_NIVEIS_RADAR).toHaveLength(3)
    const ids = OPCOES_NIVEIS_RADAR.map((o) => o.id)
    expect(ids).toContain('federal')
    expect(ids).toContain('estadual')
    expect(ids).toContain('municipal')
  })

  it('navegação por grupos e busca por estado/município mantêm integridade com os filtros', () => {
    // Busca por termo no município refina atos mesmo com UF ativa
    const res = filtrarAtosRadar(ATOS_MOCK, {
      ...FILTROS_RADAR_INICIAIS,
      uf: 'RJ',
      termo: '8.900',
    })
    expect(res).toHaveLength(1)
    expect(res[0].codigo_ibge).toBe('3304557')
    expect(res[0].uf).toBe('RJ')
  })

  describe('Recorte por nível dentro de UF expandida (filtrarMunicipiosPorRecorte)', () => {
    const MUNICIPIOS_MG: RadarMunicipioItem[] = [
      { id: 'm-bh', codigo_ibge: '3106200', nome: 'Belo Horizonte', uf: 'MG', atosCount: 0 },
      { id: 'm-ub', codigo_ibge: '3170206', nome: 'Uberlândia', uf: 'MG', atosCount: 0 },
      { id: 'm-jf', codigo_ibge: '3136702', nome: 'Juiz de Fora', uf: 'MG', atosCount: 0 },
      { id: 'm-ct', codigo_ibge: '3118601', nome: 'Contagem', uf: 'MG', atosCount: 0 },
    ]

    const ATOS_MG: RadarAtoItem[] = [
      {
        id: 'ato-mg-1',
        uf: 'MG',
        codigo_ibge: '3106200',
        municipio_nome: 'Belo Horizonte',
        titulo: 'Decreto Municipal nº 18.630/2024',
        nivel: 'municipal',
      },
      {
        id: 'ato-mg-2',
        uf: 'MG',
        codigo_ibge: '3170206',
        municipio_nome: 'Uberlândia',
        titulo: 'Portaria SEFIN nº 076/2024',
        nivel: 'municipal',
      },
      {
        id: 'ato-mg-3',
        uf: 'MG',
        titulo: 'Publicação Estadual no Jornal Minas Gerais',
        nivel: 'estadual',
      },
    ]

    it('sem filtro de nível, exibe todos os municípios da UF com contagens gerais', () => {
      const res = filtrarMunicipiosPorRecorte(MUNICIPIOS_MG, ATOS_MG, {
        ...FILTROS_RADAR_INICIAIS,
        uf: 'MG',
      })
      expect(res).toHaveLength(4)
      const nomes = res.map((m) => m.nome)
      expect(nomes).toContain('Belo Horizonte')
      expect(nomes).toContain('Uberlândia')
      expect(nomes).toContain('Juiz de Fora')
      expect(nomes).toContain('Contagem')
    })

    it('com nível "municipal" ativo, grupo da UF expandida exibe APENAS municípios com atos municipais vinculados', () => {
      const res = filtrarMunicipiosPorRecorte(MUNICIPIOS_MG, ATOS_MG, {
        ...FILTROS_RADAR_INICIAIS,
        uf: 'MG',
        niveis: ['municipal'],
      })
      // Apenas Belo Horizonte e Uberlândia possuem atos municipais vinculados
      expect(res).toHaveLength(2)
      const codigos = res.map((m) => m.codigo_ibge)
      expect(codigos).toContain('3106200')
      expect(codigos).toContain('3170206')
      expect(codigos).not.toContain('3136702') // Juiz de Fora sem ato municipal
      expect(codigos).not.toContain('3118601') // Contagem sem ato municipal

      // Contagens atualizadas refletindo o recorte
      const bh = res.find((m) => m.codigo_ibge === '3106200')
      expect(bh?.atosCount).toBe(1)
      const ub = res.find((m) => m.codigo_ibge === '3170206')
      expect(ub?.atosCount).toBe(1)
    })

    it('ao limpar o filtro de nível, lista volta ao estado completo da UF', () => {
      // 1. Aplica filtro municipal
      const filtrado = filtrarMunicipiosPorRecorte(MUNICIPIOS_MG, ATOS_MG, {
        ...FILTROS_RADAR_INICIAIS,
        uf: 'MG',
        niveis: ['municipal'],
      })
      expect(filtrado).toHaveLength(2)

      // 2. Limpa o filtro (volta a FILTROS_RADAR_INICIAIS)
      const restaurado = filtrarMunicipiosPorRecorte(MUNICIPIOS_MG, ATOS_MG, {
        ...FILTROS_RADAR_INICIAIS,
        uf: 'MG',
        niveis: [],
      })
      expect(restaurado).toHaveLength(4)
    })

    it('com nível "estadual" ativo, municípios não exibem atos municipais', () => {
      const res = filtrarMunicipiosPorRecorte(MUNICIPIOS_MG, ATOS_MG, {
        ...FILTROS_RADAR_INICIAIS,
        uf: 'MG',
        niveis: ['estadual'],
      })
      expect(res).toHaveLength(4)
      for (const m of res) {
        expect(m.atosCount).toBe(0)
      }
    })
  })
})
