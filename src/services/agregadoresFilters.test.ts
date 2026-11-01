import { describe, it, expect } from 'vitest'
import { FALLBACK_CLASSIFICATIONS } from './classifications'
import {
  filtrarClassificacoes,
  contarFiltrosAgregadoresAtivos,
  deduzirEsferaClassificacao,
  correspondeFonteAgregador,
  FILTROS_AGREGADORES_INICIAIS,
  OPCOES_TABELAS_AGREGADOR,
  OPCOES_FONTES_AGREGADOR,
  OPCOES_ESFERAS_AGREGADOR,
} from './agregadoresFilters'

describe('Filtros facetados dos Agregadores (agregadoresFilters.ts)', () => {
  it('sem filtros retorna todas as classificações', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, FILTROS_AGREGADORES_INICIAIS)
    expect(res).toHaveLength(FALLBACK_CLASSIFICATIONS.length)
    expect(contarFiltrosAgregadoresAtivos(FILTROS_AGREGADORES_INICIAIS)).toBe(0)
  })

  it('possui as 11 tabelas de classificação oficiais cadastradas', () => {
    expect(OPCOES_TABELAS_AGREGADOR).toHaveLength(11)
    const ids = OPCOES_TABELAS_AGREGADOR.map((t) => t.id)
    expect(ids).toContain('Nome')
    expect(ids).toContain('NCM')
    expect(ids).toContain('cClassTrib')
    expect(ids).toContain('CST')
    expect(ids).toContain('cCredPres')
    expect(ids).toContain('CEST')
    expect(ids).toContain('MVA-ST')
    expect(ids).toContain('CFOP')
    expect(ids).toContain('NBS')
    expect(ids).toContain('CNAE 2.3')
    expect(ids).toContain('cBenef')
  })

  it('possui as fontes oficiais especificadas no briefing', () => {
    expect(OPCOES_FONTES_AGREGADOR.length).toBeGreaterThanOrEqual(6)
    const ids = OPCOES_FONTES_AGREGADOR.map((f) => f.id)
    expect(ids).toContain('RFB')
    expect(ids).toContain('CGIBS')
    expect(ids).toContain('CONFAZ')
    expect(ids).toContain('IBGE')
    expect(ids).toContain('Siscomex/MDIC')
    expect(ids).toContain('portal NF-e')
  })

  it('filtra por tabela de classificação: apenas NCM', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      tabelas: ['NCM'],
    })
    expect(res.length).toBeGreaterThan(0)
    for (const item of res) {
      expect(item.tipo).toBe('NCM')
    }
  })

  it('filtra por tabela de classificação combinável: cClassTrib + CST', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      tabelas: ['cClassTrib', 'CST'],
    })
    expect(res.length).toBeGreaterThan(0)
    for (const item of res) {
      expect(item.tipo === 'cClassTrib' || item.tipo === 'CST').toBe(true)
    }
  })

  it('filtra por fonte oficial: CGIBS', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      fontes: ['CGIBS'],
    })
    expect(res.length).toBeGreaterThan(0)
    for (const item of res) {
      expect(correspondeFonteAgregador(item, 'CGIBS')).toBe(true)
    }
  })

  it('filtra por fonte oficial: CONFAZ (deve trazer CEST, MVA-ST, CFOP)', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      fontes: ['CONFAZ'],
    })
    expect(res.length).toBeGreaterThan(0)
    for (const item of res) {
      expect(correspondeFonteAgregador(item, 'CONFAZ')).toBe(true)
    }
  })

  it('filtra por esfera: estadual', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      esferas: ['estadual'],
    })
    expect(res.length).toBeGreaterThan(0)
    for (const item of res) {
      expect(deduzirEsferaClassificacao(item)).toBe('estadual')
    }
  })

  it('combina tabela NCM + fonte Siscomex/MDIC + termo "arroz"', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      termo: 'arroz',
      tabelas: ['NCM'],
      fontes: ['Siscomex/MDIC'],
      esferas: [],
    })
    expect(res.length).toBeGreaterThan(0)
    expect(res[0].codigo).toContain('1006')
  })

  it('combinação sem correspondência gera estado vazio', () => {
    const res = filtrarClassificacoes(FALLBACK_CLASSIFICATIONS, {
      ...FILTROS_AGREGADORES_INICIAIS,
      tabelas: ['CNAE 2.3'],
      fontes: ['CGIBS'], // CNAE vem do IBGE, não do CGIBS
    })
    expect(res).toHaveLength(0)
  })

  it('contador de filtros ativos soma todas as dimensões selecionadas', () => {
    const total = contarFiltrosAgregadoresAtivos({
      termo: 'medicamento',
      tabelas: ['Nome', 'NCM'],
      fontes: ['RFB'],
      esferas: ['federal'],
    })
    expect(total).toBe(5) // 1 termo + 2 tabelas + 1 fonte + 1 esfera = 5
  })
})
