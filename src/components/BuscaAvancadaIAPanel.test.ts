import { describe, it, expect } from 'vitest'
import {
  mapearSegmentoParaEspecialista,
  METADADOS_ESPECIALISTAS,
} from '@/components/BuscaAvancadaIAPanel'

describe('mapearSegmentoParaEspecialista', () => {
  it('roteia juridica/juridico para o agente Jurídico', () => {
    expect(mapearSegmentoParaEspecialista('juridica')).toBe('juridico')
    expect(mapearSegmentoParaEspecialista('juridico')).toBe('juridico')
    expect(mapearSegmentoParaEspecialista('JURIDICA')).toBe('juridico')
  })

  it('roteia administrativa/administrativo para o agente Administrativo', () => {
    expect(mapearSegmentoParaEspecialista('administrativa')).toBe('administrativo')
    expect(mapearSegmentoParaEspecialista('administrativo')).toBe('administrativo')
    expect(mapearSegmentoParaEspecialista('ADMINISTRATIVA')).toBe('administrativo')
  })

  it('roteia contabil para o agente Contábil', () => {
    expect(mapearSegmentoParaEspecialista('contabil')).toBe('contabil')
    expect(mapearSegmentoParaEspecialista('CONTABIL')).toBe('contabil')
  })

  it('roteia sem segmento ou tributario para o agente Tributário', () => {
    expect(mapearSegmentoParaEspecialista(null)).toBe('tributario')
    expect(mapearSegmentoParaEspecialista(undefined)).toBe('tributario')
    expect(mapearSegmentoParaEspecialista('')).toBe('tributario')
    expect(mapearSegmentoParaEspecialista('tributario')).toBe('tributario')
    expect(mapearSegmentoParaEspecialista('reforma-tributaria')).toBe('tributario')
    expect(mapearSegmentoParaEspecialista('geral')).toBe('tributario')
  })

  it('possui metadados completos para os 4 especialistas com selo e sugestões', () => {
    const segmentos = ['juridico', 'tributario', 'contabil', 'administrativo'] as const
    for (const seg of segmentos) {
      const meta = METADADOS_ESPECIALISTAS[seg]
      expect(meta).toBeDefined()
      expect(meta.titulo).toContain('ADECONT')
      expect(meta.badge).toBeTruthy()
      expect(meta.descricao).toBeTruthy()
      expect(meta.sugestoes.length).toBeGreaterThan(0)
    }
  })
})
