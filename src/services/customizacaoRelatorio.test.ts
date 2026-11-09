import { describe, it, expect, beforeEach } from 'vitest'
import {
  criarConfiguracaoPadrao,
  mesclarComPadrao,
  decodificarNotasEAjustes,
  codificarNotasComAjustes,
  salvarConfiguracaoLocalStorage,
  carregarConfiguracaoLocalStorage,
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
})
