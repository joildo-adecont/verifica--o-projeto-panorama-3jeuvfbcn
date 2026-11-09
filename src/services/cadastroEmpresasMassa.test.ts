import { describe, it, expect, vi, beforeEach } from 'vitest'
import { alterarStatusClientesEmMassa } from './cadastroEmpresasMassa'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

// Mocks do PocketBase e serviços dependentes
vi.mock('@/lib/pocketbase/client', () => {
  return {
    default: {
      collection: vi.fn((_name: string) => ({
        update: vi.fn().mockResolvedValue({ id: 'mock-id' }),
        getFirstListItem: vi.fn().mockResolvedValue({ id: 'mock-item-id' }),
      })),
    },
  }
})

vi.mock('@/services/cadastroEmpresasInativos', () => {
  return {
    inativarCliente: vi.fn().mockResolvedValue({ ok: true }),
    reativarCliente: vi.fn().mockResolvedValue({ ok: true }),
  }
})

describe('alterarStatusClientesEmMassa', () => {
  const clientesMock: EmpresaRecord[] = [
    {
      id: 'cli-1',
      codigo: 101,
      razao_social: 'EMPRESA ALFA LTDA',
      apelido: 'ALFA',
      tipo_documento: 'CNPJ',
      numero_documento: '11.222.333/0001-44',
      documento_limpo: '11222333000144',
      situacao: 'Ativa',
    },
    {
      id: 'cli-2',
      codigo: 102,
      razao_social: 'EMPRESA BETA S/A',
      apelido: 'BETA',
      tipo_documento: 'CNPJ',
      numero_documento: '22.333.444/0001-55',
      documento_limpo: '22333444000155',
      situacao: 'Ativa',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna contagem vazia se novaSituacao não for informada', async () => {
    const res = await alterarStatusClientesEmMassa(clientesMock, { novaSituacao: '' })
    expect(res.sucessoCount).toBe(0)
    expect(res.falhaCount).toBe(0)
  })

  it('atualiza campo situacao diretamente quando o status for Suspensa ou Baixada', async () => {
    const pb = (await import('@/lib/pocketbase/client')).default
    const res = await alterarStatusClientesEmMassa(clientesMock, {
      novaSituacao: 'Suspensa',
      motivo: 'Suspensão temporária',
    })

    expect(res.totalSolicitado).toBe(2)
    expect(res.sucessoCount).toBe(2)
    expect(res.falhaCount).toBe(0)
    expect(pb.collection).toHaveBeenCalledWith('cadastro_empresas')
  })

  it('aciona inativarCliente quando coleção for cadastro_empresas e status for Inativa', async () => {
    const { inativarCliente } = await import('@/services/cadastroEmpresasInativos')
    const res = await alterarStatusClientesEmMassa(clientesMock, {
      novaSituacao: 'Inativa',
      motivo: 'Inativação em lote',
    })

    expect(res.sucessoCount).toBe(2)
    expect(inativarCliente).toHaveBeenCalledTimes(2)
    expect(inativarCliente).toHaveBeenCalledWith(101, 'Inativação em lote')
    expect(inativarCliente).toHaveBeenCalledWith(102, 'Inativação em lote')
  })

  it('aciona reativarCliente quando coleção for cadastro_empresas_inativos e status for Ativa', async () => {
    const { reativarCliente } = await import('@/services/cadastroEmpresasInativos')
    const res = await alterarStatusClientesEmMassa(
      clientesMock,
      {
        novaSituacao: 'Ativa',
      },
      'cadastro_empresas_inativos',
    )

    expect(res.sucessoCount).toBe(2)
    expect(reativarCliente).toHaveBeenCalledTimes(2)
    expect(reativarCliente).toHaveBeenCalledWith(101)
    expect(reativarCliente).toHaveBeenCalledWith(102)
  })
})
