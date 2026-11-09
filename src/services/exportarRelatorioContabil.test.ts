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

const balancoMockGlobal: AnaliseBalanco3Exercicios = {
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
      caixaEquivalentes: 45000,
      aplicacoesFinanceiras: 0,
      contasReceber: 60000,
      estoques: 40000,
      tributosRecuperar: 0,
      outrosAtivosCirculantes: 0,
    },
    ativoNaoCirculante: {
      realizavelLongoPrazo: 15000,
      investimentos: 0,
      imobilizado: 55000,
      intangivel: 5000,
    },
    passivoCirculante: {
      fornecedores: 50000,
      emprestimosCP: 30000,
      obrigacoesTrabalhistas: 12000,
      obrigacoesTributarias: 6000,
      adiantamentosClientes: 0,
      outrasObrigacoesCP: 6000,
    },
    passivoNaoCirculante: {
      emprestimosLP: 25000,
      outrasObrigacoesLP: 5000,
      provisoesCPC25: 0,
      tributosParcelados: 0,
    },
    patrimonioLiquido: {
      capitalSocial: 40000,
      reservasLucros: 46000,
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

  it('inclui índices avançados (Kanitz, Altman Z1, Elizabetsky, Du Pont, CDG/NCG/Efeito Tesoura) quando solicitado ou presente no balanço', () => {
    const indicadoresTeste: ItemIndicador[] = [
      {
        id: 'liq_corrente',
        nome: 'Liquidez Corrente',
        valor: 1.85,
        unidade: 'fator',
        referencia: '> 1,20x',
        formula: 'AC / PC',
        semaforo: 'saudavel',
        explicacao: 'Excelente liquidez',
      },
    ]

    const linhas = prepararLinhasExportacao(indicadoresTeste, balancoMockGlobal, {
      incluirIndicesAvancados: true,
    })

    // Deve conter mais linhas além da 1 clássica
    expect(linhas.length).toBeGreaterThan(1)

    // Verifica a presença dos modelos avançados obrigatórios
    const nomes = linhas.map((l) => l.indicador)
    const grupos = linhas.map((l) => l.grupo)

    expect(nomes.some((n) => n.includes('Termômetro de Insolvência de Kanitz'))).toBe(true)
    expect(nomes.some((n) => n.includes('Altman Z1'))).toBe(true)
    expect(nomes.some((n) => n.includes('Elizabetsky'))).toBe(true)
    expect(nomes.some((n) => n.includes('Du Pont'))).toBe(true)
    expect(nomes.some((n) => n.includes('Efeito Tesoura') || n.includes('Dinâmica'))).toBe(true)

    expect(grupos.some((g) => g.includes('Modelo de Kanitz'))).toBe(true)
    expect(grupos.some((g) => g.includes('Modelo de Altman Z1'))).toBe(true)
    expect(grupos.some((g) => g.includes('Elizabetsky'))).toBe(true)
    expect(grupos.some((g) => g.includes('Du Pont'))).toBe(true)
    expect(grupos.some((g) => g.includes('Fleuriet'))).toBe(true)
  })

  it('inclui parecer e notas do cliente no CSV quando fornecido', () => {
    const csv = gerarCsvRelatorioContabil([], {
      clienteNome: 'Cliente Com Parecer',
      parecerFinal: {
        empresaNome: 'Cliente Com Parecer',
        cnpj: '12.345.678/0001-90',
        periodo: '2022-2024',
        escopo: 'Contábil e Financeiro',
        indicadoresChave: {
          liquidezCorrente: 1.85,
          margemLiquida: 12.5,
          roe: 25.0,
          dividaLiquidaEbitda: 1.2,
          cicloFinanceiro: 45,
          dscr: 1.8,
          scoreFinal: 8.5,
        },
        nivelOpiniao: 'Sem ressalvas',
        recomendacaoCredito: 'Aprovado até R$ 500.000,00',
        responsavelTecnico: 'Contador Responsável CRC/PR',
        conclusao: 'Empresa sólida e rentável',
        pontosFortes: 'Excelente liquidez',
        pontosAtencao: 'Prazos de recebimento',
        achadosCriticos: 'Balancete 2024 conferido integralmente sem distorções relevantes',
        data: '2024-12-31',
      },
    })

    expect(csv).toContain('=== PARECER TÉCNICO & NOTAS DO CLIENTE ===')
    expect(csv).toContain('Sem ressalvas')
    expect(csv).toContain('Aprovado até R$ 500.000,00')
    expect(csv).toContain('Empresa sólida e rentável')
    expect(csv).toContain('Balancete 2024 conferido integralmente sem distorções relevantes')
  })

  it('respeita opções de customização desmarcando seções e aplicando título e observações livres no CSV', () => {
    const indicadoresTeste: ItemIndicador[] = [
      {
        id: 'liq_corrente',
        nome: 'Liquidez Corrente',
        valor: 1.85,
        unidade: 'fator',
        referencia: '> 1,20x',
        formula: 'AC / PC',
        semaforo: 'saudavel',
        explicacao: 'Excelente liquidez',
      },
    ]

    // Customização: apenas modelos avançados (sem clássicos), sem parecer, com notas e título personalizado
    const linhas = prepararLinhasExportacao(indicadoresTeste, balancoMockGlobal, {
      customizacao: {
        tituloPersonalizado: 'Dossiê Executivo de Insolvência e Risco',
        subtituloPersonalizado: 'Auditoria Especial',
        observacoesFinais: 'Auditoria concluída sem ressalvas impeditivas.',
        secoes: {
          indicesClassicos: false,
          modelosAvancados: true,
          parecerTecnico: false,
          achadosCriticos: true,
        },
        incluirDadosEmpresa: false,
        incluirQrCode: false,
      },
    })

    // Como clássicos foram desmarcados, NÃO deve ter a linha de Liquidez Corrente
    expect(linhas.some((l) => l.indicador === 'Liquidez Corrente')).toBe(false)
    // E deve conter os avançados
    expect(linhas.some((l) => l.indicador.includes('Kanitz'))).toBe(true)

    // Teste também passando via flag direta incluirIndicesClassicos: false
    const linhasSemClassicosDireto = prepararLinhasExportacao(indicadoresTeste, balancoMockGlobal, {
      incluirIndicesClassicos: false,
      incluirIndicesAvancados: true,
    })
    expect(linhasSemClassicosDireto.some((l) => l.indicador === 'Liquidez Corrente')).toBe(false)
    expect(linhasSemClassicosDireto.some((l) => l.indicador.includes('Kanitz'))).toBe(true)

    const csv = gerarCsvRelatorioContabil(linhas, {
      clienteNome: 'Empresa Oculta LTDA',
      clienteDoc: '99.888.777/0001-66',
      customizacao: {
        tituloPersonalizado: 'Dossiê Executivo de Insolvência e Risco',
        observacoesFinais: 'Auditoria concluída sem ressalvas impeditivas.',
        secoes: {
          indicesClassicos: false,
          modelosAvancados: true,
          parecerTecnico: false,
          achadosCriticos: true,
        },
        incluirDadosEmpresa: false,
        incluirQrCode: false,
      },
      parecerFinal: {
        empresaNome: 'Empresa Oculta LTDA',
        nivelOpiniao: 'Opiniao Qualquer',
        achadosCriticos: 'Nota Crítica Exibida com Sucesso',
      } as any,
    })

    // Título personalizado presente
    expect(csv).toContain('Dossiê Executivo de Insolvência e Risco')
    // Observações finais presentes
    expect(csv).toContain('=== CONSIDERAÇÕES & OBSERVAÇÕES FINAIS ===')
    expect(csv).toContain('Auditoria concluída sem ressalvas impeditivas.')
    // Dados da empresa omitidos porque incluirDadosEmpresa = false
    expect(csv).not.toContain('Empresa Oculta LTDA')
    // Parecer técnico foi desmarcado, então nível da opinião não deve constar
    expect(csv).not.toContain('Nível da Opinião:')
    // Notas foram mantidas, então achados críticos devem constar
    expect(csv).toContain('Nota Crítica Exibida com Sucesso')
  })

  it('exporta seções customizadas no CSV respeitando ordem e toggle de inclusão', () => {
    const indicadoresTesteLocal: ItemIndicador[] = [
      {
        id: 'liq_corrente',
        nome: 'Liquidez Corrente',
        valor: 1.85,
        unidade: 'fator',
        referencia: '> 1,20x',
        formula: 'AC / PC',
        semaforo: 'saudavel',
        explicacao: 'Excelente liquidez',
      },
    ]
    const linhas = prepararLinhasExportacao(indicadoresTesteLocal, balancoMockGlobal)

    // Cenário 1: com seções customizadas habilitadas
    const csvComSecoes = gerarCsvRelatorioContabil(linhas, {
      clienteNome: 'FMF Participações',
      customizacao: {
        tituloPersonalizado: 'Relatório Completo',
        incluirSecoesCustomizadas: true,
        secoesCustomizadas: [
          {
            id: 'sec-1',
            titulo: 'Análise de Garantias e Imóveis',
            conteudo: 'Foram vistoriados 3 galpões logísticos livres de ônus.',
            ordem: 0,
            ativa: true,
          },
          {
            id: 'sec-2',
            titulo: 'Comitê de Crédito e Risco',
            conteudo: 'Aprovado limite de R$ 5.000.000,00 para capital de giro.',
            ordem: 1,
            ativa: true,
          },
          {
            id: 'sec-inativa',
            titulo: 'Seção Oculta',
            conteudo: 'Este texto não deve aparecer no CSV.',
            ordem: 2,
            ativa: false,
          },
        ],
        secoes: {
          indicesClassicos: true,
          modelosAvancados: true,
          parecerTecnico: true,
          achadosCriticos: true,
        },
        incluirDadosEmpresa: true,
        incluirQrCode: true,
      },
    })

    expect(csvComSecoes).toContain('=== ANÁLISE DE GARANTIAS E IMÓVEIS ===')
    expect(csvComSecoes).toContain('Foram vistoriados 3 galpões logísticos livres de ônus.')
    expect(csvComSecoes).toContain('=== COMITÊ DE CRÉDITO E RISCO ===')
    expect(csvComSecoes).toContain('Aprovado limite de R$ 5.000.000,00 para capital de giro.')
    // Seção inativa não aparece
    expect(csvComSecoes).not.toContain('=== SEÇÃO OCULTA ===')
    expect(csvComSecoes).not.toContain('Este texto não deve aparecer no CSV.')

    // Cenário 2: com toggle mestre incluirSecoesCustomizadas = false
    const csvSemSecoes = gerarCsvRelatorioContabil(linhas, {
      clienteNome: 'FMF Participações',
      customizacao: {
        tituloPersonalizado: 'Relatório Sem Customizadas',
        incluirSecoesCustomizadas: false,
        secoesCustomizadas: [
          {
            id: 'sec-1',
            titulo: 'Análise de Garantias e Imóveis',
            conteudo: 'Foram vistoriados 3 galpões logísticos livres de ônus.',
            ordem: 0,
            ativa: true,
          },
        ],
        secoes: {
          indicesClassicos: true,
          modelosAvancados: true,
          parecerTecnico: true,
          achadosCriticos: true,
        },
        incluirDadosEmpresa: true,
        incluirQrCode: true,
      },
    })

    expect(csvSemSecoes).not.toContain('=== ANÁLISE DE GARANTIAS E IMÓVEIS ===')
    expect(csvSemSecoes).not.toContain('Foram vistoriados 3 galpões logísticos livres de ônus.')
  })
})
