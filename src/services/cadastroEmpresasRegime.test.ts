import { describe, it, expect } from 'vitest'
import { OPCOES_REGIME_TRIBUTARIO } from '@/pages/CadastroClientes'
import { mapearRegistro } from '@/services/cadastroEmpresas'

describe('Cadastro de Clientes — Regime Tributário', () => {
  it('contém exatamente as 5 opções oficiais especificadas pelo usuário', () => {
    expect(OPCOES_REGIME_TRIBUTARIO).toEqual([
      'Simples Nacional',
      'Simples Híbrido',
      'Lucro Presumido',
      'Lucro Real',
      'Regime Regular IBS/CBS',
    ])
  })

  it('faz mapeamento resiliente do campo regime_tributario de registros da base', () => {
    // Caso com regime_tributario gravado
    const recordComRegime = {
      id: 'rec_01',
      codigo: 101,
      razao_social: 'AUTO MECANICA IRMAOS PASTORE LTDA',
      numero_documento: '92.353.630/0001-68',
      tipo_documento: 'CNPJ',
      regime_tributario: 'Simples Nacional',
    }
    const mapeado1 = mapearRegistro(recordComRegime)
    expect(mapeado1.regime_tributario).toBe('Simples Nacional')

    // Caso de fallback para enquadramento_tributario legado
    const recordLegado = {
      id: 'rec_02',
      codigo: 102,
      razao_social: 'EMPRESA LEGADA LTDA',
      enquadramento_tributario: 'Lucro Presumido',
    }
    const mapeado2 = mapearRegistro(recordLegado)
    expect(mapeado2.regime_tributario).toBe('Lucro Presumido')

    // Caso antigo sem nenhum regime nem enquadramento (não quebra)
    const recordVazio = {
      id: 'rec_03',
      codigo: 103,
      razao_social: 'EMPRESA SEM REGIME LTDA',
    }
    const mapeado3 = mapearRegistro(recordVazio)
    expect(mapeado3.regime_tributario).toBe('')
  })
})
