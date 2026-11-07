import { describe, it, expect, beforeEach } from 'vitest'
import {
  registrarMudancaRegime,
  registrarAlteracaoRegime,
  listarHistoricoRegimePorCliente,
  listarHistoricoPorEmpresa,
  obterUltimaAlteracaoPorEmpresa,
  obterResumoUltimaAlteracao,
  obterBadgeRegime,
  obterBadgeOrigem,
  formatarOrigemAlteracao,
  formatarDataHoraRegime,
  formatarDataHoraAuditoria,
  limparCacheLocalHistorico,
  normalizarNomeRegime,
} from './regimeHistoricoService'

describe('Serviço de Trilha de Auditoria de Regime Tributário (ADECONT)', () => {
  beforeEach(() => {
    limparCacheLocalHistorico()
  })

  it('formata adequadamente as origens das alterações', () => {
    expect(formatarOrigemAlteracao('listagem')).toBe('Listagem de Clientes (Inline)')
    expect(formatarOrigemAlteracao('ficha_cadastral')).toBe('Ficha Cadastral do Cliente')
    expect(formatarOrigemAlteracao('banner_diagnostico')).toBe('Banner do Diagnóstico Tributário')
    expect(formatarOrigemAlteracao('parametrizador')).toBe('Parametrizador Tributário')
    expect(formatarOrigemAlteracao('outro_canal' as any)).toBe('outro_canal')
  })

  it('normaliza strings de regime com segurança', () => {
    expect(normalizarNomeRegime('  Simples Nacional  ')).toBe('Simples Nacional')
    expect(normalizarNomeRegime('')).toBe('')
    expect(normalizarNomeRegime(null)).toBe('')
    expect(normalizarNomeRegime(undefined)).toBe('')
  })

  it('ignora gravação se o regime novo for idêntico ao anterior (deduplicação)', async () => {
    const res = await registrarMudancaRegime({
      empresaCodigo: 1,
      empresaNome: 'AUTO MECANICA IRMAOS PASTORE LTDA',
      empresaDocumento: '92353630000168',
      regimeAnterior: 'Simples Nacional',
      regimeNovo: 'Simples Nacional',
      origem: 'listagem',
    })

    expect(res.sucesso).toBe(true)
    expect(res.gravou).toBe(false)
    expect(res.motivo).toContain('mesmo valor anterior e novo')
  })

  it('registra mudança quando há troca real de regime e preserva dados', async () => {
    const res = await registrarMudancaRegime({
      empresaCodigo: 1,
      empresaNome: 'AUTO MECANICA IRMAOS PASTORE LTDA',
      empresaDocumento: '92.353.630/0001-68',
      regimeAnterior: 'Simples Nacional',
      regimeNovo: 'Lucro Presumido',
      origem: 'banner_diagnostico',
      usuario: 'Especialista Fiscal ADECONT',
      observacao: 'Simulação de migração tributária',
    })

    expect(res.sucesso).toBe(true)
    expect(res.gravou).toBe(true)
    expect(res.registro).toBeDefined()
    expect(res.registro?.regime_anterior).toBe('Simples Nacional')
    expect(res.registro?.regime_novo).toBe('Lucro Presumido')
    expect(res.registro?.origem).toBe('banner_diagnostico')
    expect(res.registro?.empresa_documento).toBe('92353630000168')
  })

  it('recupera histórico por código e documento em ordem cronológica decrescente', async () => {
    // Registra alteração 1
    await registrarMudancaRegime({
      empresaCodigo: 42,
      empresaNome: 'Cliente Teste S/A',
      empresaDocumento: '12.345.678/0001-90',
      regimeAnterior: 'Simples Nacional',
      regimeNovo: 'Simples Híbrido',
      origem: 'ficha_cadastral',
    })

    // Registra alteração 2
    await registrarMudancaRegime({
      empresaCodigo: 42,
      empresaNome: 'Cliente Teste S/A',
      empresaDocumento: '12.345.678/0001-90',
      regimeAnterior: 'Simples Híbrido',
      regimeNovo: 'Regime Regular IBS/CBS',
      origem: 'listagem',
    })

    const lista = await listarHistoricoRegimePorCliente({ empresaCodigo: 42 })
    expect(lista.length).toBeGreaterThanOrEqual(2)
    // O mais recente deve vir primeiro
    expect(lista[0].regime_novo).toBe('Regime Regular IBS/CBS')
    expect(lista[0].regime_anterior).toBe('Simples Híbrido')
    expect(lista[1].regime_novo).toBe('Simples Híbrido')
  })

  it('gera resumo da última alteração para o diagnóstico e parecer', () => {
    const historicoMock = [
      {
        id: 'hist_1',
        empresa_codigo: 1,
        regime_anterior: 'Simples Nacional',
        regime_novo: 'Lucro Presumido',
        origem: 'banner_diagnostico' as const,
        data_hora: '2026-11-07T14:30:00.000Z',
        created: '2026-11-07T14:30:00.000Z',
      },
      {
        id: 'hist_0',
        empresa_codigo: 1,
        regime_anterior: 'Não informado',
        regime_novo: 'Simples Nacional',
        origem: 'ficha_cadastral' as const,
        data_hora: '2026-01-15T09:00:00.000Z',
        created: '2026-01-15T09:00:00.000Z',
      },
    ]

    const resumo = obterResumoUltimaAlteracao(historicoMock)
    expect(resumo.temHistorico).toBe(true)
    expect(resumo.totalAlteracoes).toBe(2)
    expect(resumo.regimeAnterior).toBe('Simples Nacional')
    expect(resumo.regimeAtual).toBe('Lucro Presumido')
    expect(resumo.origemTexto).toBe('Banner do Diagnóstico Tributário')
    expect(resumo.dataUltimaAlteracaoFormatada).toBeDefined()
  })

  it('trata estado vazio no resumo de forma amigável', () => {
    const resumo = obterResumoUltimaAlteracao([])
    expect(resumo.temHistorico).toBe(false)
    expect(resumo.totalAlteracoes).toBe(0)
    expect(resumo.ultimoRegistro).toBeNull()
  })

  it('formata data e hora sem quebrar em strings nulas ou inválidas', () => {
    expect(formatarDataHoraRegime(null)).toBe('—')
    expect(formatarDataHoraRegime('')).toBe('—')
    expect(formatarDataHoraRegime('data_invalida')).toBe('data_invalida')
    expect(formatarDataHoraAuditoria(null)).toBe('—')
  })

  it('suporta aliases registrarAlteracaoRegime, listarHistoricoPorEmpresa e obterUltimaAlteracaoPorEmpresa com parâmetros flexíveis', async () => {
    const res = await registrarAlteracaoRegime({
      empresa_codigo: 99,
      empresa_nome: 'Empresa Teste Aliases',
      empresa_cnpj: '11.222.333/0001-44',
      regime_anterior: 'Simples Nacional',
      regime_novo: 'Lucro Real',
      origem: 'listagem',
    })
    expect(res.sucesso).toBe(true)
    expect(res.gravou).toBe(true)

    const ultima = await obterUltimaAlteracaoPorEmpresa({ empresaCodigo: 99 })
    expect(ultima).not.toBeNull()
    expect(ultima?.regime_novo).toBe('Lucro Real')

    const lista = await listarHistoricoPorEmpresa({ empresa_codigo: 99 })
    expect(lista.length).toBeGreaterThanOrEqual(1)
  })

  it('gera badges visuais consistentes para regimes e origens', () => {
    const badgeSimples = obterBadgeRegime('Simples Nacional')
    expect(badgeSimples.bg).toContain('emerald')

    const badgePresumido = obterBadgeRegime('Lucro Presumido')
    expect(badgePresumido.bg).toContain('amber')

    const badgeReal = obterBadgeRegime('Lucro Real')
    expect(badgeReal.bg).toContain('blue')

    const badgeHibrido = obterBadgeRegime('Simples Híbrido')
    expect(badgeHibrido.bg).toContain('purple')

    const badgeIbs = obterBadgeRegime('Regime Regular IBS/CBS')
    expect(badgeIbs.bg).toContain('rose')

    const badgeListagem = obterBadgeOrigem('listagem')
    expect(badgeListagem.label).toBe('Listagem Inline')

    const badgeFicha = obterBadgeOrigem('ficha_cadastral')
    expect(badgeFicha.label).toBe('Ficha Cadastral')

    const badgeBanner = obterBadgeOrigem('banner_diagnostico')
    expect(badgeBanner.label).toBe('Banner Diagnóstico')
  })
})
