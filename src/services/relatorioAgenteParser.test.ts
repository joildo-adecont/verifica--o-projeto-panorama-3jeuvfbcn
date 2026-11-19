import { describe, expect, it } from 'vitest'
import {
  parseBlocosRelatorio,
  parseValorNumerico,
  tabelaVirouGrafico,
  type BlocoRelatorio,
} from '@/services/relatorioAgenteParser'

describe('parseBlocosRelatorio', () => {
  it('converte tabela markdown em bloco tabela', () => {
    const md = '| Imposto | 2025 | 2026 |\n| --- | --- | --- |\n| IBS | R$ 100 | R$ 150 |'
    const blocos = parseBlocosRelatorio(md)
    const tabela = blocos.find((b: BlocoRelatorio) => b.tipo === 'tabela') as Extract<
      BlocoRelatorio,
      { tipo: 'tabela' }
    >
    expect(tabela.colunas).toEqual(['Imposto', '2025', '2026'])
    expect(tabela.linhas).toEqual([['IBS', 'R$ 100', 'R$ 150']])
  })

  it('converte lista com valores em comparativo', () => {
    const md = '- Jan: R$ 1.000,00\n- Fev: R$ 2.000,00'
    const blocos = parseBlocosRelatorio(md)
    const comp = blocos.find((b) => b.tipo === 'comparativo') as Extract<
      BlocoRelatorio,
      { tipo: 'comparativo' }
    >
    expect(comp.itens).toHaveLength(2)
    expect(comp.itens[0].rotulo).toBe('Jan')
  })

  it('mantém texto corrido como bloco texto', () => {
    const blocos = parseBlocosRelatorio('Parágrafo simples sem marcadores.')
    expect(blocos[0].tipo).toBe('texto')
  })

  it('não lança em resposta vazia', () => {
    expect(parseBlocosRelatorio('')).toEqual([])
    expect(parseBlocosRelatorio(undefined as unknown as string)).toEqual([])
  })

  it('reconhece títulos markdown', () => {
    const blocos = parseBlocosRelatorio('## Comparativo de carga')
    expect(blocos[0]).toMatchObject({ tipo: 'titulo', nivel: 2, texto: 'Comparativo de carga' })
  })

  it('não vira bloco "texto" com "---" (respostas reais dos agentes usam régua)', () => {
    // falha reportada: o material pesquisado não chegava aos arquivos porque a
    // régua horizontal do markdown dos agentes era acumulada como parágrafo
    const blocos = parseBlocosRelatorio(
      '**Consultor da Reforma Tributária – ADECONT**\n---\n## 1. Visão Geral',
    )
    expect(blocos.some((b) => b.tipo === 'texto' && b.texto === '---')).toBe(false)
    expect(blocos[0]).toMatchObject({ tipo: 'texto' })
    expect(blocos[1]).toMatchObject({ tipo: 'titulo', texto: '1. Visão Geral' })
  })

  it('limpa negrito/itálico markdown dos blocos texto e títulos', () => {
    const blocos = parseBlocosRelatorio('## **Título em Negrito**\nTexto com **destaque** interno.')
    expect(blocos[0]).toMatchObject({ tipo: 'titulo', texto: 'Título em Negrito' })
    expect(blocos[1]).toMatchObject({ tipo: 'texto', texto: 'Texto com destaque interno.' })
  })
})

describe('parseValorNumerico', () => {
  it('lê R$ com milhar e decimal pt-BR', () => {
    expect(parseValorNumerico('R$ 1.234,56')).toBeCloseTo(1234.56)
  })
  it('lê porcentagem', () => {
    expect(parseValorNumerico('12,5%')).toBeCloseTo(12.5)
  })
  it('devolve null quando não há número', () => {
    expect(parseValorNumerico('sem número')).toBeNull()
  })
})

describe('tabelaVirouGrafico', () => {
  it('exige ≥2 linhas e coluna numérica', () => {
    const tabela: Extract<BlocoRelatorio, { tipo: 'tabela' }> = {
      tipo: 'tabela',
      colunas: ['Item', 'Valor'],
      linhas: [
        ['A', '10'],
        ['B', '20'],
      ],
    }
    expect(tabelaVirouGrafico(tabela)).toBe(true)
    expect(
      tabelaVirouGrafico({ tipo: 'tabela', colunas: ['Item', 'Valor'], linhas: [['A', '10']] }),
    ).toBe(false)
  })
})
