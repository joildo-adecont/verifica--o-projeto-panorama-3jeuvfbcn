import { describe, it, expect, beforeEach } from 'vitest'
import {
  registrarAuditoriaStatus,
  listarAuditoriaStatusPorCliente,
  limparCacheAuditoriaStatus,
} from './statusAuditoriaService'

describe('Serviço de Auditoria de Status/Situação Cadastral (ADECONT)', () => {
  beforeEach(() => {
    limparCacheAuditoriaStatus()
  })

  it('registra auditoria de inativação com motivo opcional ou fornecido', async () => {
    const res = await registrarAuditoriaStatus({
      empresaCodigo: 123,
      empresaNome: 'EMPRESA TESTE LTDA',
      empresaDocumento: '12.345.678/0001-90',
      statusAnterior: 'Ativa',
      statusNovo: 'Inativa',
      acao: 'inativar',
      motivo: 'Encerramento de contrato contábil',
      usuario: 'Operador Teste',
    })

    expect(res.sucesso).toBe(true)
    expect(res.registro).toBeDefined()
    expect(res.registro.status_anterior).toBe('Ativa')
    expect(res.registro.status_novo).toBe('Inativa')
    expect(res.registro.motivo).toBe('Encerramento de contrato contábil')
    expect(res.registro.empresa_documento).toBe('12345678000190')

    const historico = listarAuditoriaStatusPorCliente(123)
    expect(historico.length).toBe(1)
    expect(historico[0].motivo).toBe('Encerramento de contrato contábil')
  })

  it('registra auditoria de reativação preservando timestamp e dados', async () => {
    const res = await registrarAuditoriaStatus({
      empresaCodigo: 456,
      empresaNome: 'EMPRESA REATIVADA S/A',
      empresaDocumento: '98.765.432/0001-10',
      statusAnterior: 'Inativa',
      statusNovo: 'Ativa',
      acao: 'reativar',
      motivo: 'Retomada das operações',
    })

    expect(res.sucesso).toBe(true)
    expect(res.registro.acao).toBe('reativar')
    expect(res.registro.status_novo).toBe('Ativa')
    expect(res.registro.motivo).toBe('Retomada das operações')

    const historico = listarAuditoriaStatusPorCliente(456)
    expect(historico.length).toBe(1)
  })

  it('usa fallback padrão se motivo não for informado', async () => {
    const res = await registrarAuditoriaStatus({
      empresaCodigo: 789,
      statusAnterior: 'Ativa',
      statusNovo: 'Inativa',
      acao: 'inativar',
    })

    expect(res.sucesso).toBe(true)
    expect(res.registro.motivo).toBe('Sem motivo especificado')
  })
})
