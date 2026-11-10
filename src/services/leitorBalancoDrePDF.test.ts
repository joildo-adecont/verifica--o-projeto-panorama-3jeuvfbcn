/**
 * TESTES — leitorBalancoDrePDF (parser de rótulos/números, sem pdf.js)
 * ====================================================================
 * Os PDFs do cliente são Type0/Identity-H e o servidor não os lê; a extração
 * real acontece no navegador. Aqui testamos a camada determinística: rótulos
 * comuns, numeração brasileira, negativos em parênteses, escala "em milhares",
 * consumo de linhas (Total PC ≠ Total do Passivo) e não invenção de valor.
 */

import { describe, expect, it } from 'vitest'
import {
  parseNumeroBR,
  parseLeitura,
  detectarEscala,
  lerLinhasDeConta,
  verificarCruzamentos,
} from './leitorBalancoDrePDF'

describe('parseNumeroBR', () => {
  it('lê milhar com ponto e centavos com vírgula', () => {
    expect(parseNumeroBR('1.994.882,26')).toBe(1994882.26)
    expect(parseNumeroBR('12.345,6')).toBe(12345.6)
  })

  it('lê inteiro simples e decimal curto', () => {
    expect(parseNumeroBR('123')).toBe(123)
    expect(parseNumeroBR('1.5')).toBe(1.5)
  })

  it('lê negativos entre parênteses e com hífen', () => {
    expect(parseNumeroBR('(312,45)')).toBe(-312.45)
    expect(parseNumeroBR('-1.000,00')).toBe(-1000)
  })

  it('aceita prefixo R$', () => {
    expect(parseNumeroBR('R$ 2.500,00')).toBe(2500)
  })

  it('rejeita lixo e vazio (nunca inventa número)', () => {
    expect(parseNumeroBR('')).toBeNull()
    expect(parseNumeroBR('abc')).toBeNull()
    expect(parseNumeroBR('...')).toBeNull()
  })
})

describe('detectarEscala', () => {
  it('detecta "em milhares de reais" e "R$ mil"', () => {
    expect(detectarEscala(['Valores expressos em milhares de reais'])).toBe(1000)
    expect(detectarEscala(['(Valores em R$ mil)'])).toBe(1000)
    expect(detectarEscala(['Balanço Patrimonial'])).toBe(1)
  })
})

describe('lerLinhasDeConta', () => {
  it('separa rótulo dos valores da linha', () => {
    const linhas = lerLinhasDeConta(['Caixa e Equivalentes 1.000,00 950,00'])
    expect(linhas).toHaveLength(1)
    expect(linhas[0].rotuloNorm).toContain('caixa')
    expect(linhas[0].valores).toEqual([1000, 950])
  })

  it('ignora linhas sem valor', () => {
    expect(lerLinhasDeConta(['Notas Explicativas', '1.1 Ativo'])).toHaveLength(0)
  })
})

describe('parseLeitura', () => {
  it('preenche contas de detalhe e total de grupo', () => {
    const linhas = lerLinhasDeConta([
      'Caixa 1.000,00',
      'Clientes 25.000,00',
      'Total do Ativo Circulante 26.000,00',
      'Fornecedores 10.000,00',
      'Total do Passivo Circulante 10.000,00',
      'Capital Social 50.000,00',
      'Total do Patrimônio Líquido 50.000,00',
    ])
    const leitura = parseLeitura(linhas)
    expect(leitura.dados.ativoCirculante.caixaEquivalentes).toBe(1000)
    expect(leitura.dados.ativoCirculante.contasReceber).toBe(25000)
    expect(leitura.dados.passivoCirculante.fornecedores).toBe(10000)
    expect(leitura.dados.patrimonioLiquido.capitalSocial).toBe(50000)
    expect(leitura.lidos).toContain('ativoCirculante.caixaEquivalentes')
    expect((leitura.dados as any).__totais.ativoCirculante).toBe(26000)
    expect((leitura.dados as any).__totais.patrimonioLiquido).toBe(50000)
  })

  it('"Total do Passivo Circulante" não vira "Total do Passivo" (consumo de linhas)', () => {
    const linhas = lerLinhasDeConta([
      'Fornecedores 10.000,00',
      'Total do Passivo Circulante 10.000,00',
      'Capital Social 50.000,00',
      'Total do Passivo 60.000,00',
    ])
    const leitura = parseLeitura(linhas)
    expect((leitura.dados as any).__totais.passivoCirculante).toBe(10000)
    expect((leitura.dados as any).__totais.passivo).toBe(60000)
  })

  it('rótulo ambíguo (valores distintos) não entra na grade', () => {
    const linhas = lerLinhasDeConta(['Caixa 1.000,00', 'Caixa 2.000,00'])
    const leitura = parseLeitura(linhas)
    expect(leitura.dados.ativoCirculante.caixaEquivalentes).toBe(0)
    expect(leitura.naoLidos).toContain('ativoCirculante.caixaEquivalentes')
  })

  it('não inventa valor para rótulo ausente (campo fica 0, fora de lidos)', () => {
    const linhas = lerLinhasDeConta(['Caixa 1.000,00'])
    const leitura = parseLeitura(linhas)
    expect(leitura.dados.ativoCirculante.estoques).toBe(0)
    expect(leitura.lidos).not.toContain('ativoCirculante.estoques')
  })

  it('aplica fator de escala (valores em milhares)', () => {
    const linhas = lerLinhasDeConta(['Caixa 1,00'])
    const leitura = parseLeitura(linhas, 1000)
    expect(leitura.dados.ativoCirculante.caixaEquivalentes).toBe(1000)
  })

  it('lê DRE com receita bruta, deduções, custos e lucro/prejuízo', () => {
    const linhas = lerLinhasDeConta([
      'Receita Bruta 100.000,00',
      'Deduções da Receita (10.000,00)',
      'Custo dos Produtos Vendidos (60.000,00)',
      'Despesas Administrativas (15.000,00)',
      'Lucro Líquido do Exercício 15.000,00',
    ])
    const leitura = parseLeitura(linhas)
    expect(leitura.dados.dre.receitaBruta).toBe(100000)
    expect(leitura.dados.dre.deducoesImpostos).toBe(-10000)
    expect(leitura.dados.dre.cmv).toBe(-60000)
    expect(leitura.dados.dre.despesasAdministrativas).toBe(-15000)
    expect((leitura.dados as any).__resultado).toBe(15000)
  })
})

describe('verificarCruzamentos', () => {
  it('sinaliza divergência forte entre detalhes e total lido', () => {
    const linhas = lerLinhasDeConta(['Caixa 1.000,00', 'Total do Ativo Circulante 9.000,00'])
    const leitura = parseLeitura(linhas)
    expect(verificarCruzamentos(leitura)).toMatch(/Ativo Circulante/)
  })

  it('não sinaliza quando detalhes batem com o total', () => {
    const linhas = lerLinhasDeConta([
      'Caixa 4.000,00',
      'Clientes 5.000,00',
      'Total do Ativo Circulante 9.000,00',
    ])
    const leitura = parseLeitura(linhas)
    expect(verificarCruzamentos(leitura)).toBeUndefined()
  })
})
