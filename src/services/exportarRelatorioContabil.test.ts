import { describe, it, expect } from 'vitest'
import {
  escaparCampoCsv,
  formatarValorIndicadorPtBr,
  formatarStatusSemaforo,
  obterNomeGrupoIndicador,
  prepararLinhasExportacao,
  gerarCsvRelatorioContabil,
} from './exportarRelatorioContabil'
import type { ItemIndicador, AnaliseBalanco3Exercicios } from '@/types/analisesEmpresariaisModel'

describe('exportarRelatorioContabil - Funções de Formatação e Geração de Arquivos', () => {
  it('escapa campos CSV corretamente com aspas duplas e sem quebras de linha', () => {
    expect(escaparCampoCsv('Texto simples')).toBe('"Texto simples"')
    expect(escaparCampoCsv('Texto com "aspas"')).toBe('"Texto com ""aspas"""')
    expect(escaparCampoCsv('Linha 1\nLinha 2')).toBe('"Linha 1 Linha 2"')
    expect(escaparCampoCsv(null)).toBe('""')
    expect(escaparCampoCsv(undefined)).toBe('""')
  })

  it('formata valores de indicadores no padrão pt-BR de acordo com a unidade', () => {
    // Moeda
    const moeda = formatarValorIndicadorPtBr(1250000, 'moeda')
    expect(moeda).toContain('R$')
    expect(moeda).toContain('1.250.000')

    // Percentual
    const pct = formatarValorIndicadorPtBr(18.75, 'percentual')
    expect(pct).toBe('18,75%')

    // Dias
    const dias = formatarValorIndicadorPtBr(45.2, 'dias')
    expect(dias).toBe('45d')

    // Fator / Multiplicador
    const ind = formatarValorIndicadorPtBr(1.45, 'fator')
    expect(ind).toBe('1,45x')

    // Nulo / Indefinido
    expect(formatarValorIndicadorPtBr(undefined)).toBe('—')
    expect(formatarValorIndicadorPtBr(null)).toBe('—')
    expect(formatarValorIndicadorPtBr(NaN)).toBe('—')
  })

  it('formata status semafóricos amigáveis em português', () => {
    expect(formatarStatusSemaforo('saudavel')).toBe('Saudável')
    expect(formatarStatusSemaforo('atencao')).toBe('Atenção')
    expect(formatarStatusSemaforo('critico')).toBe('Crítico')
    expect(formatarStatusSemaforo(undefined)).toBe('Neutro')
  })

  it('associa o indicador ao respectivo grupo contábil ADECONT', () => {
    expect(obterNomeGrupoIndicador('liq_corrente')).toBe('1. Liquidez')
    expect(obterNomeGrupoIndicador('pct')).toBe('2. Endividamento')
    expect(obterNomeGrupoIndicador('margem_liquida')).toBe('3. Rentabilidade')
    expect(obterNomeGrupoIndicador('giro_ativo')).toBe('4. Atividade / Ciclos')
    expect(obterNomeGrupoIndicador('dscr')).toBe('5. Cobertura / Capex')
    expect(obterNomeGrupoIndicador('outro_qualquer')).toBe('Geral')
  })

  it('prepara linhas tabulares de exportação incluindo triênio e diagnóstico', () => {
    const indicadoresMock: ItemIndicador[] = [
      {
        id: 'liq_corrente',
        nome: 'Liquidez Corrente',
        valor: 1.85,
        unidade: 'fator',
        referencia: '> 1,20x',
        formula: 'AC / PC',
        semaforo: 'saudavel',
        explicacao: 'Excelente liquidez de curto prazo',
      },
      {
        id: 'margem_liquida',
        nome: 'Margem Líquida',
        valor: 12.5,
        unidade: 'percentual',
        referencia: '> 8,00%',
        formula: 'LL / Receita Líquida',
        semaforo: 'saudavel',
        explicacao: 'Margem líquida saudável acima da média do setor',
      },
    ]

    const balancoMock: AnaliseBalanco3Exercicios = {
      anoMenos2: {
        rotulo: '2023',
        ativoCirculante: {
          caixaEquivalentes: 20000,
          aplicacoesFinanceiras: 0,
          contasReceber: 50000,
          estoques: 30000,
          tributosRecuperar: 0,
          outrosAtivosCirculantes: 0,
        },
        ativoNaoCirculante: {
          realizavelLongoPrazo: 10000,
          investimentos: 0,
          imobilizado: 35000,
          intangivel: 5000,
        },
        passivoCirculante: {
          fornecedores: 40000,
          emprestimosCP: 20000,
          obrigacoesTrabalhistas: 10000,
          obrigacoesTributarias: 5000,
          adiantamentosClientes: 0,
          outrasObrigacoesCP: 5000,
        },
        passivoNaoCirculante: {
          emprestimosLP: 15000,
          outrasObrigacoesLP: 5000,
          provisoesCPC25: 0,
          tributosParcelados: 0,
        },
        patrimonioLiquido: {
          capitalSocial: 40000,
          reservasLucros: 10000,
          ajustesAvaliacaoPatrimonial: 0,
          prejuizosAcumulados: 0,
        },
        dre: {
          receitaBruta: 300000,
          deducoesImpostos: -30000,
          cmv: -150000,
          despesasVendas: -20000,
          despesasAdministrativas: -30000,
          outrasDespesasOperacionais: 0,
          depreciacaoAmortizacao: 5000,
          resultadoFinanceiro: -5000,
          irCsll: -10000,
        },
        complementares: {
          depreciacao: 5000,
          despesaJuros: 5000,
          compras: 100000,
          numEmpregados: 10,
          folhaBruta: 30000,
          encargos: 8000,
          capex: 10000,
          amortizacaoDividas: 5000,
        },
      },
      anoMenos1: {
        rotulo: '2024',
        ativoCirculante: {
          caixaEquivalentes: 30000,
          aplicacoesFinanceiras: 0,
          contasReceber: 55000,
          estoques: 35000,
          tributosRecuperar: 0,
          outrosAtivosCirculantes: 0,
        },
        ativoNaoCirculante: {
          realizavelLongoPrazo: 10000,
          investimentos: 0,
          imobilizado: 45000,
          intangivel: 5000,
        },
        passivoCirculante: {
          fornecedores: 45000,
          emprestimosCP: 25000,
          obrigacoesTrabalhistas: 10000,
          obrigacoesTributarias: 5000,
          adiantamentosClientes: 0,
          outrasObrigacoesCP: 5000,
        },
        passivoNaoCirculante: {
          emprestimosLP: 20000,
          outrasObrigacoesLP: 5000,
          provisoesCPC25: 0,
          tributosParcelados: 0,
        },
        patrimonioLiquido: {
          capitalSocial: 40000,
          reservasLucros: 25000,
          ajustesAvaliacaoPatrimonial: 0,
          prejuizosAcumulados: 0,
        },
        dre: {
          receitaBruta: 350000,
          deducoesImpostos: -35000,
          cmv: -170000,
          despesasVendas: -25000,
          despesasAdministrativas: -35000,
          outrasDespesasOperacionais: 0,
          depreciacaoAmortizacao: 6000,
          resultadoFinanceiro: -6000,
          irCsll: -12000,
        },
        complementares: {
          depreciacao: 6000,
          despesaJuros: 6000,
          compras: 120000,
          numEmpregados: 12,
          folhaBruta: 35000,
          encargos: 9000,
          capex: 15000,
          amortizacaoDividas: 6000,
        },
      },
      anoAtual: {
        rotulo: '2025',
        ativoCirculante: {
          caixaEquivalentes: 40000,
          aplicacoesFinanceiras: 0,
          contasReceber: 70000,
          estoques: 40000,
          tributosRecuperar: 0,
          outrosAtivosCirculantes: 0,
        },
        ativoNaoCirculante: {
          realizavelLongoPrazo: 10000,
          investimentos: 0,
          imobilizado: 55000,
          intangivel: 5000,
        },
        passivoCirculante: {
          fornecedores: 50000,
          emprestimosCP: 30000,
          obrigacoesTrabalhistas: 10000,
          obrigacoesTributarias: 5000,
          adiantamentosClientes: 0,
          outrasObrigacoesCP: 5000,
        },
        passivoNaoCirculante: {
          emprestimosLP: 25000,
          outrasObrigacoesLP: 5000,
          provisoesCPC25: 0,
          tributosParcelados: 0,
        },
        patrimonioLiquido: {
          capitalSocial: 40000,
          reservasLucros: 50000,
          ajustesAvaliacaoPatrimonial: 0,
          prejuizosAcumulados: 0,
        },
        dre: {
          receitaBruta: 400000,
          deducoesImpostos: -40000,
          cmv: -190000,
          despesasVendas: -30000,
          despesasAdministrativas: -40000,
          outrasDespesasOperacionais: 0,
          depreciacaoAmortizacao: 7000,
          resultadoFinanceiro: -7000,
          irCsll: -15000,
        },
        complementares: {
          depreciacao: 7000,
          despesaJuros: 7000,
          compras: 140000,
          numEmpregados: 14,
          folhaBruta: 40000,
          encargos: 10000,
          capex: 20000,
          amortizacaoDividas: 7000,
        },
      },
    }

    const linhas = prepararLinhasExportacao(indicadoresMock, balancoMock)
    expect(linhas.length).toBe(2)

    const l1 = linhas[0]
    expect(l1.grupo).toBe('1. Liquidez')
    expect(l1.indicador).toBe('Liquidez Corrente')
    expect(l1.valor).toBe('1,85x')
    expect(l1.status).toBe('Saudável')
    expect(l1.anoAtual).toBe('1,85x')
    expect(l1.referencia).toBe('> 1,20x')
  })

  it('gera CSV com BOM UTF-8, cabeçalho de empresa e separador ";"', () => {
    const linhas = [
      {
        grupo: '1. Liquidez',
        indicador: 'Liquidez Corrente',
        valor: '1,85x',
        status: 'Saudável',
        anoMenos2: '1,25x',
        anoMenos1: '1,33x',
        anoAtual: '1,85x',
        referencia: '> 1,20x',
        formula: 'AC / PC',
        diagnostico: 'Excelente liquidez',
      },
    ]

    const csv = gerarCsvRelatorioContabil(linhas, {
      clienteNome: 'Empresa Teste LTDA',
      clienteDoc: '12.345.678/0001-90',
      regimeTributario: 'Lucro Presumido',
      rotuloMenos2: '2023',
      rotuloMenos1: '2024',
      rotuloAtual: '2025',
    })

    // Deve começar com BOM UTF-8
    expect(csv.startsWith('\uFEFF')).toBe(true)

    // Deve conter marca ADECONT e dados da empresa
    expect(csv).toContain('ADECONT - Assessoria Contábil e Administrativa')
    expect(csv).toContain('Empresa Teste LTDA')
    expect(csv).toContain('12.345.678/0001-90')
    expect(csv).toContain('Lucro Presumido')

    // Deve conter as colunas separadas por ';'
    expect(csv).toContain('"Grupo";"Índice";"Valor";"Status";"2023";"2024";"2025"')
    expect(csv).toContain('"1. Liquidez";"Liquidez Corrente";"1,85x";"Saudável"')
  })
})
