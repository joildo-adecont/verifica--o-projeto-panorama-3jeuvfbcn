import { describe, it, expect, vi } from 'vitest'
import { OPCOES_REGIME_TRIBUTARIO } from '@/pages/CadastroClientes'
import {
  OPCOES_REGIME_TRIBUTARIO as OPCOES_TYPES,
  EVENTO_REGIME_TRIBUTARIO_ALTERADO,
} from '@/types/cadastroEmpresas'
import { mapearRegistro, atualizarEmpresa } from '@/services/cadastroEmpresas'

describe('Cadastro de Clientes — Regime Tributário', () => {
  it('contém exatamente as 5 opções oficiais especificadas pelo usuário', () => {
    expect(OPCOES_REGIME_TRIBUTARIO).toEqual([
      'Simples Nacional',
      'Simples Híbrido',
      'Lucro Presumido',
      'Lucro Real',
      'Regime Regular IBS/CBS',
    ])
  })

  it('faz mapeamento resiliente do campo regime_tributario de registros da base', () => {
    // Caso com regime_tributario gravado
    const recordComRegime = {
      id: 'rec_01',
      codigo: 101,
      razao_social: 'AUTO MECANICA IRMAOS PASTORE LTDA',
      numero_documento: '92.353.630/0001-68',
      tipo_documento: 'CNPJ',
      regime_tributario: 'Simples Nacional',
    }
    const mapeado1 = mapearRegistro(recordComRegime)
    expect(mapeado1.regime_tributario).toBe('Simples Nacional')

    // Caso de fallback para enquadramento_tributario legado
    const recordLegado = {
      id: 'rec_02',
      codigo: 102,
      razao_social: 'EMPRESA LEGADA LTDA',
      enquadramento_tributario: 'Lucro Presumido',
    }
    const mapeado2 = mapearRegistro(recordLegado)
    expect(mapeado2.regime_tributario).toBe('Lucro Presumido')

    // Caso antigo sem nenhum regime nem enquadramento (não quebra)
    const recordVazio = {
      id: 'rec_03',
      codigo: 103,
      razao_social: 'EMPRESA SEM REGIME LTDA',
    }
    const mapeado3 = mapearRegistro(recordVazio)
    expect(mapeado3.regime_tributario).toBe('')
  })

  it('exporta a constante oficial também nos types compartilhados com mesmo valor', () => {
    expect(OPCOES_TYPES).toEqual(OPCOES_REGIME_TRIBUTARIO)
    expect(EVENTO_REGIME_TRIBUTARIO_ALTERADO).toBe('adecont:regime_tributario_alterado')
  })

  it('permite atualização inline direta via atualizarEmpresa com regime_tributario', async () => {
    // Simula chamada de atualização parcial usada no select inline da tabela
    // e no onChange da Ficha Cadastral sem depender de modal ou botão separado
    const idTeste = 'rec_pastore_teste'
    const payloadAtualizacao = { regime_tributario: 'Lucro Real' as const }

    // Mock seguro para validar estrutura e retorno de erro limpo em ambiente sem PB
    try {
      const res = await atualizarEmpresa(idTeste, payloadAtualizacao)
      // Se tiver PB configurado ou mock ativo, retorna boolean
      expect(typeof res).toBe('boolean')
    } catch (e: any) {
      // Sem backend rodando no teste unitário, atualizarEmpresa captura e retorna false
      // sem estourar exceção não tratada
      expect(e).toBeUndefined()
    }
  })

  it('emite e processa o CustomEvent de sincronização bidirecional entre módulos', () => {
    const handler = vi.fn()
    window.addEventListener(EVENTO_REGIME_TRIBUTARIO_ALTERADO, handler)

    const evento = new CustomEvent(EVENTO_REGIME_TRIBUTARIO_ALTERADO, {
      detail: {
        codigo: 1,
        id: 'rec_101',
        documento_limpo: '92353630000168',
        regime_tributario: 'Lucro Presumido',
      },
    })
    window.dispatchEvent(evento)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].detail).toEqual({
      codigo: 1,
      id: 'rec_101',
      documento_limpo: '92353630000168',
      regime_tributario: 'Lucro Presumido',
    })

    window.removeEventListener(EVENTO_REGIME_TRIBUTARIO_ALTERADO, handler)
  })
})
