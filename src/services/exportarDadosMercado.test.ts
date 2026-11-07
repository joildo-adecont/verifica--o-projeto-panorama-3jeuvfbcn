import { describe, it, expect } from 'vitest'
import {
  escaparCampoCsv,
  obterStatusSemaforoMercado,
  formatarVariacaoMercado,
  obterFonteRealMercado,
  prepararLinhasExportacaoMercado,
  gerarCsvDadosMercado,
} from './exportarDadosMercado'
import type { ItemIndiceMercado } from '@/services/dadosMercadoAnalises'

describe('exportarDadosMercado', () => {
  const mockIndices: ItemIndiceMercado[] = [
    {
      chave: 'selic',
      nome: 'Taxa Selic Meta',
      codigoCurto: 'SELIC',
      descricao: 'Taxa básica de juros',
      unidade: '% a.a.',
      valorAtual: 10.75,
      valorAnterior: 10.5,
      variacao: 0.25,
      variacaoPct: 2.38,
      periodoFormatado: 'Fev/2026',
      dataReferencia: '2026-02',
      fonte: 'BCB SGS 432',
      fonteRota: 'BCB SGS 432',
      fonteViva: true,
      baseInterna: false,
      aviso: '',
      historico: [],
      interpretacao: 'baixa_boa',
      categoria: 'taxas',
      formato: 'percentual',
      casasDecimais: 2,
    },
    {
      chave: 'ibovespa',
      nome: 'Ibovespa',
      codigoCurto: 'IBOV',
      descricao: 'Principal índice de ações da B3',
      unidade: 'pts',
      valorAtual: 138520,
      valorAnterior: 134600,
      variacao: 3920,
      variacaoPct: 2.91,
      periodoFormatado: '2025',
      dataReferencia: '2025',
      fonte: 'Base Interna ADECONT',
      fonteRota: 'B3 / IPEADATA',
      fonteViva: false,
      baseInterna: true,
      aviso: 'dados da base interna (última sincronização: 2025)',
      historico: [],
      interpretacao: 'alta_boa',
      categoria: 'bolsa_fii',
      formato: 'pontos',
      casasDecimais: 0,
    },
    {
      chave: 'usd',
      nome: 'Dólar Comercial (PTAX)',
      codigoCurto: 'USD',
      descricao: 'Cotação de venda do dólar PTAX',
      unidade: 'R$',
      valorAtual: 5.4215,
      valorAnterior: 5.4215,
      variacao: 0,
      variacaoPct: 0,
      periodoFormatado: 'Fev/2026',
      dataReferencia: '2026-02',
      fonte: 'BCB SGS 10813',
      fonteRota: 'BCB SGS 10813',
      fonteViva: true,
      baseInterna: false,
      aviso: '',
      historico: [],
      interpretacao: 'neutro',
      categoria: 'cambio',
      formato: 'moeda',
      casasDecimais: 4,
    },
  ]

  it('escapa campos CSV corretamente', () => {
    expect(escaparCampoCsv('Teste simples')).toBe('"Teste simples"')
    expect(escaparCampoCsv('Com "aspas"')).toBe('"Com ""aspas"""')
    expect(escaparCampoCsv('Quebra\nde\nlinha')).toBe('"Quebra de linha"')
    expect(escaparCampoCsv(null)).toBe('""')
  })

  it('calcula o status do semáforo amigável', () => {
    expect(obterStatusSemaforoMercado(mockIndices[0])).toEqual({
      statusTexto: 'Alta',
      tipo: 'alta',
    })
    expect(obterStatusSemaforoMercado(mockIndices[2])).toEqual({
      statusTexto: 'Estável',
      tipo: 'estavel',
    })

    const indiceBaixa = { ...mockIndices[0], variacao: -0.5 }
    expect(obterStatusSemaforoMercado(indiceBaixa)).toEqual({
      statusTexto: 'Baixa',
      tipo: 'baixa',
    })

    const indiceNulo = { ...mockIndices[0], variacao: null }
    expect(obterStatusSemaforoMercado(indiceNulo)).toEqual({
      statusTexto: 'Indisponível',
      tipo: 'indisponivel',
    })
  })

  it('formata variações com sinal explícito e pt-BR', () => {
    expect(formatarVariacaoMercado(0.25, 2)).toBe('+0,25')
    expect(formatarVariacaoMercado(-1.5, 2)).toBe('-1,50')
    expect(formatarVariacaoMercado(0, 2)).toBe('0,00')
    expect(formatarVariacaoMercado(null)).toBe('—')
    expect(formatarVariacaoMercado(undefined)).toBe('—')
  })

  it('preserva a fonte real e identifica base interna com transparência', () => {
    expect(obterFonteRealMercado(mockIndices[0])).toBe('BCB SGS 432')
    expect(obterFonteRealMercado(mockIndices[1])).toBe('Base Interna ADECONT')
  })

  it('prepara linhas tabulares com colunas formatadas', () => {
    const linhas = prepararLinhasExportacaoMercado(mockIndices)
    expect(linhas.length).toBe(3)

    // Selic
    expect(linhas[0].indice).toBe('Taxa Selic Meta')
    expect(linhas[0].valor).toBe('10,75')
    expect(linhas[0].unidade).toBe('% a.a.')
    expect(linhas[0].dataDado).toBe('Fev/2026')
    expect(linhas[0].fonte).toBe('BCB SGS 432')
    expect(linhas[0].variacao).toBe('+0,25')
    expect(linhas[0].status).toBe('Alta')
    expect(linhas[0].baseInterna).toBe(false)

    // Ibovespa (base interna)
    expect(linhas[1].indice).toBe('Ibovespa')
    expect(linhas[1].valor).toBe('138.520')
    expect(linhas[1].unidade).toBe('pts')
    expect(linhas[1].fonte).toBe('Base Interna ADECONT')
    expect(linhas[1].baseInterna).toBe(true)
    expect(linhas[1].aviso).toContain('base interna')

    // Dólar (4 casas)
    expect(linhas[2].indice).toBe('Dólar Comercial (PTAX)')
    expect(linhas[2].valor).toBe('5,4215')
    expect(linhas[2].unidade).toBe('R$')
    expect(linhas[2].variacao).toBe('0,00')
    expect(linhas[2].status).toBe('Estável')
  })

  it('gera CSV com BOM UTF-8, delimitador ";" e metadados ADECONT', () => {
    const linhas = prepararLinhasExportacaoMercado(mockIndices)
    const csv = gerarCsvDadosMercado(linhas, {
      clienteNome: 'Supermercado Central Ltda',
      clienteDoc: '12.345.678/0001-90',
      dataEmissao: '07/11/2026',
      atualizadoEm: '07/11/2026 14:30',
    })

    // Começa com BOM UTF-8 (\uFEFF)
    expect(csv.startsWith('\uFEFF')).toBe(true)

    // Contém metadados da ADECONT
    expect(csv).toContain('ADECONT — Assessoria Contábil e Administrativa')
    expect(csv).toContain('Supermercado Central Ltda')
    expect(csv).toContain('12.345.678/0001-90')

    // Cabeçalho da tabela com separador ';'
    expect(csv).toContain('"Índice";"Valor";"Unidade";"Data do Dado";"Fonte";"Variação";"Status"')

    // Linhas de dados
    expect(csv).toContain(
      '"Taxa Selic Meta";"10,75";"% a.a.";"Fev/2026";"BCB SGS 432";"+0,25";"Alta"',
    )
    expect(csv).toContain(
      '"Ibovespa";"138.520";"pts";"2025";"Base Interna ADECONT";"+3.920,00";"Alta"',
    )
  })

  it('retorna array vazio quando não há índices', () => {
    expect(prepararLinhasExportacaoMercado([])).toEqual([])
  })
})
