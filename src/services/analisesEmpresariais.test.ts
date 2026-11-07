import { describe, it, expect } from 'vitest'
import {
  decuparBalancetesCumulativos,
  normalizarDocumento,
  type DocumentoContabilRecord,
} from './analisesEmpresariais'

describe('analisesEmpresariais - decuparBalancetesCumulativos', () => {
  it('normaliza documentos removendo caracteres especiais', () => {
    expect(normalizarDocumento('12.345.678/0001-90')).toBe('12345678000190')
    expect(normalizarDocumento('123.456.789-00')).toBe('12345678900')
    expect(normalizarDocumento(null)).toBe('')
  })

  it('decupa balancetes cumulativos em receitas líquidas mensais corretamente', () => {
    const docs: DocumentoContabilRecord[] = [
      {
        id: 'doc-1',
        cliente_cnpj: '12345678000190',
        cliente_nome: 'Empresa Teste',
        tipo_documento: 'balancete',
        competencia: '2026-01',
        arquivo_nome: 'balancete_jan.pdf',
        receita_liquida: 100000,
        lucro_liquido: 15000,
        total_ativo: 500000,
        total_passivo: 200000,
        patrimonio_liquido: 300000,
      },
      {
        id: 'doc-2',
        cliente_cnpj: '12345678000190',
        cliente_nome: 'Empresa Teste',
        tipo_documento: 'balancete',
        competencia: '2026-02',
        arquivo_nome: 'balancete_fev.pdf',
        receita_liquida: 220000, // Cumulativo Jan+Fev (Fev = 120.000)
        lucro_liquido: 35000,
        total_ativo: 520000,
        total_passivo: 210000,
        patrimonio_liquido: 310000,
      },
      {
        id: 'doc-3',
        cliente_cnpj: '12345678000190',
        cliente_nome: 'Empresa Teste',
        tipo_documento: 'balancete',
        competencia: '2026-03',
        arquivo_nome: 'balancete_mar.pdf',
        receita_liquida: 350000, // Cumulativo Jan+Fev+Mar (Mar = 130.000)
        lucro_liquido: 50000,
        total_ativo: 550000,
        total_passivo: 220000,
        patrimonio_liquido: 330000,
      },
    ]

    const resultado = decuparBalancetesCumulativos(docs)

    expect(resultado.mesesDisponiveis).toBe(3)
    expect(resultado.mesMaisRecente).toBe('2026-03')
    expect(resultado.seriesMensalizadas).toHaveLength(3)

    // Janeiro: 100.000
    expect(resultado.seriesMensalizadas[0].receitaMensalLiquida).toBe(100000)
    // Fevereiro: 220.000 - 100.000 = 120.000
    expect(resultado.seriesMensalizadas[1].receitaMensalLiquida).toBe(120000)
    // Março: 350.000 - 220.000 = 130.000
    expect(resultado.seriesMensalizadas[2].receitaMensalLiquida).toBe(130000)

    // Receita último mês (Março)
    expect(resultado.receitaUltimoMes).toBe(130000)

    // Receita Anualizada = Média mensal (350.000 / 3 = 116.666,66) * 12 = 1.400.000
    expect(resultado.receitaAnualizada).toBeCloseTo(1400000, 0)

    // Crescimento médio positivo
    expect(resultado.crescimentoMedioReceitaPct).toBeGreaterThan(0)
  })

  it('lida com lista vazia sem quebrar ou gerar NaNs', () => {
    const resultado = decuparBalancetesCumulativos([])
    expect(resultado.mesesDisponiveis).toBe(0)
    expect(resultado.receitaAnualizada).toBe(0)
    expect(resultado.receitaUltimoMes).toBe(0)
    expect(resultado.crescimentoMedioReceitaPct).toBe(0)
  })
})
