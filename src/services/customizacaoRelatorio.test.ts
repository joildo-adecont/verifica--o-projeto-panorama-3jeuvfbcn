import { describe, it, expect, beforeEach } from 'vitest'
import {
  criarConfiguracaoPadrao,
  mesclarComPadrao,
  decodificarNotasEAjustes,
  codificarNotasComAjustes,
  salvarConfiguracaoLocalStorage,
  carregarConfiguracaoLocalStorage,
  obterSubtituloSecao,
} from './customizacaoRelatorio'
import type { ConfiguracaoRelatorioCustomizado } from '@/types/customizacaoRelatorio'

describe('customizacaoRelatorio - Modelos e Persistência de Preferências', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('cria configuração padrão com todas as seções habilitadas', () => {
    const config = criarConfiguracaoPadrao()
    expect(config.tituloPersonalizado).toBe('')
    expect(config.observacoesFinais).toBe('')
    expect(config.secoes.indicesClassicos).toBe(true)
    expect(config.secoes.modelosAvancados).toBe(true)
    expect(config.secoes.parecerTecnico).toBe(true)
    expect(config.secoes.achadosCriticos).toBe(true)
    expect(config.incluirDadosEmpresa).toBe(true)
    expect(config.incluirQrCode).toBe(true)
  })

  it('mescla configurações parciais preservando valores padrão não informados', () => {
    const parcial: Partial<ConfiguracaoRelatorioCustomizado> = {
      tituloPersonalizado: 'Dossiê Especial Diretoria 2024',
      secoes: {
        indicesClassicos: true,
        modelosAvancados: false,
        parecerTecnico: true,
        achadosCriticos: false,
      },
      incluirQrCode: false,
    }

    const resultado = mesclarComPadrao(parcial)
    expect(resultado.tituloPersonalizado).toBe('Dossiê Especial Diretoria 2024')
    expect(resultado.secoes.indicesClassicos).toBe(true)
    expect(resultado.secoes.modelosAvancados).toBe(false)
    expect(resultado.secoes.parecerTecnico).toBe(true)
    expect(resultado.secoes.achadosCriticos).toBe(false)
    expect(resultado.incluirQrCode).toBe(false)
    expect(resultado.incluirDadosEmpresa).toBe(true) // Preservado do padrão
  })

  it('codifica e decodifica notas e configurações com marcador seguro', () => {
    const config: ConfiguracaoRelatorioCustomizado = {
      tituloPersonalizado: 'Relatório Trimestral FMF',
      subtituloPersonalizado: 'Auditoria de Índices',
      observacoesFinais: 'Recomendamos reavaliação de estoques no 2º semestre.',
      secoes: {
        indicesClassicos: true,
        modelosAvancados: true,
        parecerTecnico: false,
        achadosCriticos: true,
      },
      incluirDadosEmpresa: true,
      incluirQrCode: false,
      incluirRodapeOficial: true,
    }

    const notasOriginais = 'Empresa apresentou melhora contábil significativa em 2024.'
    const codificado = codificarNotasComAjustes(notasOriginais, config)

    expect(codificado).toContain('__CUSTOM_RELATORIO_ADECONT__')

    const decodificado = decodificarNotasEAjustes(codificado)
    expect(decodificado.notasTexto).toBe(notasOriginais)
    expect(decodificado.configuracao).not.toBeNull()
    expect(decodificado.configuracao?.tituloPersonalizado).toBe('Relatório Trimestral FMF')
    expect(decodificado.configuracao?.observacoesFinais).toBe(
      'Recomendamos reavaliação de estoques no 2º semestre.',
    )
    expect(decodificado.configuracao?.secoes.parecerTecnico).toBe(false)
    expect(decodificado.configuracao?.incluirQrCode).toBe(false)
  })

  it('lida com texto de notas puro sem marcador sem falhar', () => {
    const textoPuro = 'Apenas uma anotação simples do analista'
    const resultado = decodificarNotasEAjustes(textoPuro)
    expect(resultado.notasTexto).toBe(textoPuro)
    expect(resultado.configuracao).toBeNull()
  })

  it('salva e recupera configurações no localStorage por cliente e globalmente', () => {
    const config: ConfiguracaoRelatorioCustomizado = {
      ...criarConfiguracaoPadrao(),
      tituloPersonalizado: 'Auditoria Específica 12345678000190',
      observacoesFinais: 'Considerações especiais para o cliente.',
      secoes: {
        ...criarConfiguracaoPadrao().secoes,
        modelosAvancados: false,
      },
    }

    salvarConfiguracaoLocalStorage('12.345.678/0001-90', config)

    const carregadoCliente = carregarConfiguracaoLocalStorage('12345678000190')
    expect(carregadoCliente.tituloPersonalizado).toBe('Auditoria Específica 12345678000190')
    expect(carregadoCliente.observacoesFinais).toBe('Considerações especiais para o cliente.')
    expect(carregadoCliente.secoes.modelosAvancados).toBe(false)

    // Outro cliente deve cair no fallback global que também foi atualizado
    const carregadoOutro = carregarConfiguracaoLocalStorage('98765432000111')
    expect(carregadoOutro.tituloPersonalizado).toBe('Auditoria Específica 12345678000190')
  })

  it('persiste e mescla seções customizadas mantendo ordenação e campos', () => {
    const parcial: Partial<ConfiguracaoRelatorioCustomizado> = {
      tituloPersonalizado: 'Relatório com Seções Próprias',
      incluirSecoesCustomizadas: true,
      secoesCustomizadas: [
        {
          id: 'sec-1',
          titulo: 'Análise de Riscos ESG',
          conteudo: 'Empresa com certificação ISO 14001 e baixo passivo ambiental.',
          ordem: 0,
          ativa: true,
        },
        {
          id: 'sec-2',
          titulo: 'Garantias Hipotecárias',
          conteudo: 'Imóveis avaliados em R$ 12.000.000,00 como garantia de alienação fiduciária.',
          ordem: 1,
          ativa: true,
        },
      ],
    }

    const resultado = mesclarComPadrao(parcial)
    expect(resultado.incluirSecoesCustomizadas).toBe(true)
    expect(resultado.secoesCustomizadas).toHaveLength(2)
    expect(resultado.secoesCustomizadas?.[0].titulo).toBe('Análise de Riscos ESG')
    expect(resultado.secoesCustomizadas?.[1].titulo).toBe('Garantias Hipotecárias')
    expect(resultado.secoesCustomizadas?.[1].ordem).toBe(1)
  })

  it('persiste e decodifica títulos customizados para seções padrão', () => {
    const configComTitulos: ConfiguracaoRelatorioCustomizado = {
      ...criarConfiguracaoPadrao(),
      titulosSecoes: {
        indicesClassicos: 'Métricas Financeiras Clássicas',
        modelosAvancados: 'Termômetro de Insolvência e Du Pont',
        parecerTecnico: 'Conclusão e Opinião da Auditoria',
        achadosCriticos: 'Apontamentos Relevantes',
      },
    }

    const notasComConfig = codificarNotasComAjustes('Anotações do consultor', configComTitulos)
    const decodificado = decodificarNotasEAjustes(notasComConfig)

    expect(decodificado.configuracao?.titulosSecoes?.indicesClassicos).toBe(
      'Métricas Financeiras Clássicas',
    )
    expect(decodificado.configuracao?.titulosSecoes?.modelosAvancados).toBe(
      'Termômetro de Insolvência e Du Pont',
    )
    expect(decodificado.configuracao?.titulosSecoes?.parecerTecnico).toBe(
      'Conclusão e Opinião da Auditoria',
    )
    expect(decodificado.configuracao?.titulosSecoes?.achadosCriticos).toBe(
      'Apontamentos Relevantes',
    )
  })

  it('obterSubtituloSecao retorna subtítulo quando definido e vazio quando ausente/em branco', () => {
    const config: ConfiguracaoRelatorioCustomizado = {
      ...criarConfiguracaoPadrao(),
      subtitulosSecoes: {
        parecerTecnico: 'Conclusão técnica fundamentada no balanço e DRE',
        indicesClassicos: '   ', // Apenas espaços
        modelosAvancados: 'Termômetro de Insolvência e Decomposição Du Pont',
      },
    }

    expect(obterSubtituloSecao(config, 'parecerTecnico')).toBe(
      'Conclusão técnica fundamentada no balanço e DRE',
    )
    expect(obterSubtituloSecao(config, 'modelosAvancados')).toBe(
      'Termômetro de Insolvência e Decomposição Du Pont',
    )
    // Seção com espaços em branco deve retornar string vazia
    expect(obterSubtituloSecao(config, 'indicesClassicos')).toBe('')
    // Seção não informada no objeto
    expect(obterSubtituloSecao(config, 'balanco3Anos')).toBe('')
    // Chamada com config nula ou indefinida
    expect(obterSubtituloSecao(null, 'parecerTecnico')).toBe('')
    expect(obterSubtituloSecao(undefined, 'parecerTecnico')).toBe('')
  })

  it('persiste e decodifica subtítulos para seções padrão e customizadas', () => {
    const configComSubtitulos: ConfiguracaoRelatorioCustomizado = {
      ...criarConfiguracaoPadrao(),
      subtituloPersonalizado: 'Subtítulo Geral do Relatório Contábil',
      subtitulosSecoes: {
        indicesClassicos: 'Avaliação dos 25 índices padrão CFC',
        parecerTecnico: 'Opinião do perito contador responsável',
      },
      secoesCustomizadas: [
        {
          id: 'sec-custom-1',
          titulo: 'Análise de Endividamento Setorial',
          subtitulo: 'Comparativo contra pares da indústria automotiva',
          conteudo: 'A alavancagem financeira está alinhada ao quartil superior.',
          ordem: 0,
          ativa: true,
        },
      ],
    }

    const notas = codificarNotasComAjustes('Observações gerais', configComSubtitulos)
    const decodificado = decodificarNotasEAjustes(notas)

    expect(decodificado.configuracao?.subtituloPersonalizado).toBe(
      'Subtítulo Geral do Relatório Contábil',
    )
    expect(decodificado.configuracao?.subtitulosSecoes?.indicesClassicos).toBe(
      'Avaliação dos 25 índices padrão CFC',
    )
    expect(decodificado.configuracao?.subtitulosSecoes?.parecerTecnico).toBe(
      'Opinião do perito contador responsável',
    )
    expect(decodificado.configuracao?.secoesCustomizadas?.[0].subtitulo).toBe(
      'Comparativo contra pares da indústria automotiva',
    )
  })
})
