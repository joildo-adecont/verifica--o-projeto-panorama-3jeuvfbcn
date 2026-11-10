/**
 * TESTES — leitorBalancoDrePDF (parser de rótulos/números, colunas e consistência)
 * ==============================================================================
 * Os PDFs do cliente são Type0/Identity-H e o servidor não os lê; a extração
 * real acontece no navegador. Aqui testamos a camada determinística:
 * 1. Rótulos comuns, sinônimos contábeis e abreviações (AC, ANC, PC, PNC, PL, Disponibilidades, Estoques etc.)
 * 2. Numeração brasileira, negativos em parênteses, sinal negativo separado, separadores quebrados
 * 3. Valores traço ("—", "-") e zero explícito
 * 4. Layout em COLUNAS (detecção de cabeçalho de ano, seleção da coluna correta)
 * 5. Consumo de linhas e hierarquia (Total PC ≠ Total do Passivo)
 * 6. Cruzamentos de consistência contábil (equação patrimonial, AC+ANC=Ativo Total, DRE)
 * 7. Não invenção de valor (campo ausente/ambíguo fica vazio).
 */

import { describe, expect, it } from 'vitest'
import {
  parseNumeroBR,
  parseLeitura,
  detectarEscala,
  lerLinhasDeConta,
  verificarCruzamentos,
  avaliarConsistenciaContabil,
  detectarColunasExercicio,
  repararTokensLinha,
  ehTracoNulo,
  parsearBalancoDREDeTexto,
} from './leitorBalancoDrePDF'
import { testarParseExemplo } from './exemploBalancoReal'

describe('parseNumeroBR e repararTokensLinha', () => {
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
    expect(parseNumeroBR('1.000,00-')).toBe(-1000)
  })

  it('repara separadores de milhar quebrados com espaço', () => {
    expect(repararTokensLinha('Caixa 1. 234. 567,89')).toBe('Caixa 1.234.567,89')
    expect(repararTokensLinha('Clientes - 1.234,56')).toBe('Clientes -1.234,56')
    expect(repararTokensLinha('Estoques ( 500,00 )')).toBe('Estoques (500,00)')
  })

  it('detecta traço nulo', () => {
    expect(ehTracoNulo('-')).toBe(true)
    expect(ehTracoNulo('—')).toBe(true)
    expect(ehTracoNulo('-.-')).toBe(true)
    expect(ehTracoNulo('1.000,00')).toBe(false)
  })

  it('aceita prefixo R$', () => {
    expect(parseNumeroBR('R$ 2.500,00')).toBe(2500)
  })

  it('rejeita lixo e vazio (nunca inventa número)', () => {
    expect(parseNumeroBR('')).toBeNull()
    expect(parseNumeroBR('abc')).toBeNull()
    expect(parseNumeroBR('...')).toBeNull()
    expect(parseNumeroBR('-')).toBeNull()
    expect(parseNumeroBR('—')).toBeNull()
  })
})

describe('detectarEscala', () => {
  it('detecta "em milhares de reais" e "R$ mil"', () => {
    expect(detectarEscala(['Valores expressos em milhares de reais'])).toBe(1000)
    expect(detectarEscala(['(Valores em R$ mil)'])).toBe(1000)
    expect(detectarEscala(['Balanço Patrimonial'])).toBe(1)
  })
})

describe('lerLinhasDeConta e Colunas', () => {
  it('separa rótulo dos valores da linha simples', () => {
    const linhas = lerLinhasDeConta(['Caixa e Equivalentes 1.000,00 950,00'])
    expect(linhas).toHaveLength(1)
    expect(linhas[0].rotuloNorm).toContain('caixa')
    expect(linhas[0].valores).toEqual([1000, 950])
  })

  it('trata traço na coluna como null sem descartar a linha', () => {
    const linhas = lerLinhasDeConta(['Adiantamento de Clientes — 1.500,00'])
    expect(linhas).toHaveLength(1)
    expect(linhas[0].colunas).toEqual([null, 1500])
    expect(linhas[0].teveTraco).toBe(true)
  })

  it('remove código de conta contábil do início do rótulo', () => {
    const linhas = lerLinhasDeConta([
      '1.1.01.001 - Caixa Geral 1.000,00',
      '2.01 Fornecedores Nacionais 5.000,00',
    ])
    expect(linhas[0].rotuloNorm).toBe('caixa geral')
    expect(linhas[1].rotuloNorm).toBe('fornecedores nacionais')
  })

  it('detecta anos de cabeçalho em colunas', () => {
    const cabeçalho = [
      'ADECONT - Demonstrações Contábeis',
      'Balanço Patrimonial em 31/12/2020 e 31/12/2019',
      'Conta                                2020         2019',
    ]
    const mapa2020 = detectarColunasExercicio(cabeçalho, '2020')
    expect(mapa2020.anosDetectados).toEqual(['2020', '2019'])
    expect(mapa2020.indiceColuna).toBe(0)

    const mapa2019 = detectarColunasExercicio(cabeçalho, '2019')
    expect(mapa2019.indiceColuna).toBe(1)
  })
})

describe('parseLeitura com Colunas e Novos Sinônimos', () => {
  it('preenche coluna do ano desejado quando especificada', () => {
    const linhas = lerLinhasDeConta([
      'Disponibilidades 2.000,00 1.000,00', // col 0: 2020, col 1: 2019
      'Clientes 8.000,00 4.000,00',
      'Total do Ativo Circulante 10.000,00 5.000,00',
    ])

    // Leitura do ano 2020 (coluna 0)
    const leitura2020 = parseLeitura(linhas, 1, 0)
    expect(leitura2020.dados.ativoCirculante.caixaEquivalentes).toBe(2000)
    expect(leitura2020.dados.ativoCirculante.contasReceber).toBe(8000)

    // Leitura do ano 2019 (coluna 1)
    const leitura2019 = parseLeitura(linhas, 1, 1)
    expect(leitura2019.dados.ativoCirculante.caixaEquivalentes).toBe(1000)
    expect(leitura2019.dados.ativoCirculante.contasReceber).toBe(4000)
  })

  it('reconhece sinônimos e abreviações contábeis (AC, ANC, PC, PNC, PL, etc.)', () => {
    const linhas = lerLinhasDeConta([
      'Disponibilidades 1.500,00',
      'Duplicatas a Receber 20.000,00',
      'Mercadorias para Revenda 12.000,00',
      'Total AC 33.500,00',
      'Bens Móveis e Imóveis 50.000,00',
      'Total ANC 50.000,00',
      'Total do Ativo 83.500,00',
      'Fornecedores Nacionais 15.000,00',
      'Total PC 15.000,00',
      'Financiamentos LP 20.000,00',
      'Total PNC 20.000,00',
      'Capital Subscrito e Realizado 40.000,00',
      'Lucros ou Prejuízos Acumulados 8.500,00',
      'Total PL 48.500,00',
      'Total do Passivo e Patrimônio Líquido 83.500,00',
    ])
    const l = parseLeitura(linhas)
    expect(l.dados.ativoCirculante.caixaEquivalentes).toBe(1500)
    expect(l.dados.ativoCirculante.contasReceber).toBe(20000)
    expect(l.dados.ativoCirculante.estoques).toBe(12000)
    expect(l.dados.ativoNaoCirculante.imobilizado).toBe(50000)
    expect(l.dados.passivoCirculante.fornecedores).toBe(15000)
    expect(l.dados.passivoNaoCirculante.emprestimosLP).toBe(20000)
    expect(l.dados.patrimonioLiquido.capitalSocial).toBe(40000)
    expect(l.dados.patrimonioLiquido.prejuizosAcumulados).toBe(8500)
    expect((l.dados as any).__totais.ativo).toBe(83500)
    expect((l.dados as any).__totais.passivo).toBe(83500)
  })

  it('trata campo com traço como ausente/não lido sem inventar valor', () => {
    const linhas = lerLinhasDeConta([
      'Caixa 1.000,00',
      'Estoques —',
      'Total do Ativo Circulante 1.000,00',
    ])
    const l = parseLeitura(linhas)
    expect(l.dados.ativoCirculante.caixaEquivalentes).toBe(1000)
    expect(l.dados.ativoCirculante.estoques).toBe(0)
    expect(l.lidos).not.toContain('ativoCirculante.estoques')
    expect(l.aviso).toMatch(/traço/)
  })

  it('lê DRE com CMV, despesas comerciais, administrativas e resultado financeiro', () => {
    const linhas = lerLinhasDeConta([
      'Receita Operacional Bruta 200.000,00',
      'Custo das Mercadorias Vendidas (120.000,00)',
      'Lucro Bruto 80.000,00',
      'Despesas Comerciais (10.000,00)',
      'Despesas Gerais e Administrativas (25.000,00)',
      'Resultado Financeiro Líquido (5.000,00)',
      'Lucro Líquido do Exercício 40.000,00',
    ])
    const l = parseLeitura(linhas)
    expect(l.dados.dre.receitaBruta).toBe(200000)
    expect(l.dados.dre.cmv).toBe(-120000)
    expect(l.dados.dre.despesasVendas).toBe(-10000)
    expect(l.dados.dre.despesasAdministrativas).toBe(-25000)
    expect(l.dados.dre.resultadoFinanceiro).toBe(-5000)
    expect((l.dados as any).__resultado).toBe(40000)
  })
})

describe('Consistência Contábil e Cruzamentos', () => {
  it('aprova e pontua alto (100) balanço com equação patrimonial perfeita', () => {
    const linhas = lerLinhasDeConta([
      'Caixa 10.000,00',
      'Clientes 40.000,00',
      'Total do Ativo Circulante 50.000,00',
      'Imobilizado 50.000,00',
      'Total do Ativo Não Circulante 50.000,00',
      'Total do Ativo 100.000,00',
      'Fornecedores 20.000,00',
      'Total do Passivo Circulante 20.000,00',
      'Empréstimos LP 30.000,00',
      'Total do Passivo Não Circulante 30.000,00',
      'Capital Social 50.000,00',
      'Total do Patrimônio Líquido 50.000,00',
      'Total do Passivo e Patrimônio Líquido 100.000,00',
    ])
    const l = parseLeitura(linhas)
    const avaliacao = avaliarConsistenciaContabil(l)
    expect(avaliacao.consistente).toBe(true)
    expect(avaliacao.score).toBe(100)
    expect(verificarCruzamentos(l)).toBeUndefined()
  })

  it('penaliza quando Ativo Total difere de Passivo + PL ou AC+ANC', () => {
    const linhas = lerLinhasDeConta([
      'Caixa 10.000,00',
      'Total do Ativo Circulante 10.000,00',
      'Imobilizado 20.000,00',
      'Total do Ativo Não Circulante 20.000,00',
      'Total do Ativo 90.000,00', // erro artificial
      'Fornecedores 10.000,00',
      'Total do Passivo Circulante 10.000,00',
      'Capital Social 20.000,00',
      'Total do Patrimônio Líquido 20.000,00',
    ])
    const l = parseLeitura(linhas)
    const avaliacao = avaliarConsistenciaContabil(l)
    expect(avaliacao.consistente).toBe(false)
    expect(avaliacao.score).toBeLessThan(70)
    expect(avaliacao.avisos.length).toBeGreaterThan(0)
  })
})

describe('parsearBalancoDREDeTexto e exemploBalancoReal', () => {
  it('parseia texto bruto e preenche a grade de exemplo', () => {
    const res = testarParseExemplo()
    expect(res.lidos.length).toBeGreaterThan(0)
    expect(res.dados.ativoCirculante.caixaEquivalentes).toBe(12500)
    expect(res.dados.ativoCirculante.contasReceber).toBe(85000)
    expect(res.dados.ativoCirculante.estoques).toBe(52730)
    expect(res.dados.ativoNaoCirculante.imobilizado).toBe(190000)
    expect(res.dados.passivoCirculante.fornecedores).toBe(45000)
    expect(res.dados.patrimonioLiquido.capitalSocial).toBe(100000)
    expect(res.dados.dre.receitaBruta).toBe(500000)
    expect(res.dados.dre.cmv).toBe(-250000)
  })

  it('parseia tabelas markdown vindas do $documents.toMarkdown', () => {
    const md = `
| ATIVO CIRCULANTE | 150.000,00 | 120.000,00 |
| Caixa e Equivalentes | 10.000,00 | 8.000,00 |
| Duplicatas a Receber | 90.000,00 | 70.000,00 |
| Estoques | 50.000,00 | 42.000,00 |
| TOTAL DO ATIVO | 350.000,00 | 300.000,00 |
`
    const res = parsearBalancoDREDeTexto(md)
    expect(res.dados.ativoCirculante.caixaEquivalentes).toBe(10000)
    expect(res.dados.ativoCirculante.contasReceber).toBe(90000)
    expect(res.dados.ativoCirculante.estoques).toBe(50000)
  })
})
