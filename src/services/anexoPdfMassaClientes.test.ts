import { describe, it, expect, vi } from 'vitest'
import {
  extrairChavesDeNomeArquivo,
  construirIndiceClientes,
  identificarClientePorNome,
  filtrarPdfsValidos,
  processarAnexosEmMassa,
  LIMITE_MAXIMO_ANEXO_MASSA,
  type ItemAnexoMassa,
} from './anexoPdfMassaClientes'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

vi.mock('@/services/clienteDadosComplementaresService', () => ({
  listarArquivosCliente: vi.fn().mockResolvedValue([]),
  uploadArquivoCliente: vi.fn().mockResolvedValue({ id: 'novo-arquivo' }),
}))

const clienteA: EmpresaRecord = {
  id: 'emp-a',
  codigo: 94109,
  razao_social: 'CARDOSO & SIX LTDA',
  tipo_documento: 'CNPJ',
  numero_documento: '11.222.333/0001-44',
  documento_limpo: '11222333000144',
  situacao: 'Ativa',
} as unknown as EmpresaRecord

const clienteB: EmpresaRecord = {
  id: 'emp-b',
  codigo: 1234,
  razao_social: 'EMPRESA BETA S/A',
  tipo_documento: 'CPF',
  numero_documento: '123.456.789-09',
  documento_limpo: '12345678909',
  situacao: 'Ativa',
} as unknown as EmpresaRecord

function item(overrides: Partial<ItemAnexoMassa>): ItemAnexoMassa {
  return {
    id: 'i1',
    file: new File(['pdf'], 'arquivo.pdf', { type: 'application/pdf' }),
    nomeOriginal: 'arquivo.pdf',
    titulo: 'Arquivo',
    categoria: 'Outro',
    observacao: '',
    cliente: null,
    autoIdentificado: false,
    status: 'pronto',
    ...overrides,
  }
}

describe('extrairChavesDeNomeArquivo', () => {
  it('extrai CNPJ com máscara', () => {
    const r = extrairChavesDeNomeArquivo('Contrato Social 11.222.333_0001-44.pdf')
    expect(r.documentos).toContain('11222333000144')
  })

  it('extrai CNPJ sem máscara', () => {
    const r = extrairChavesDeNomeArquivo('11222333000144 contrato.pdf')
    expect(r.documentos).toContain('11222333000144')
  })

  it('extrai CPF com máscara', () => {
    const r = extrairChavesDeNomeArquivo('Procuração 123.456.789-09.pdf')
    expect(r.documentos).toContain('12345678909')
  })

  it('extrai código de cliente no formato COD123', () => {
    const r = extrairChavesDeNomeArquivo('COD94109 - contrato social.pdf')
    expect(r.codigo).toBe(94109)
  })

  it('não trata sequência de 4 dígitos como código', () => {
    const r = extrairChavesDeNomeArquivo('Relatório 2024.pdf')
    expect(r.codigo).toBeNull()
  })
})

describe('identificarClientePorNome', () => {
  const indice = construirIndiceClientes([clienteA, clienteB])

  it('localiza por CNPJ no nome do arquivo', () => {
    const { cliente, pista } = identificarClientePorNome('Contrato 11.222.333_0001-44.pdf', indice)
    expect(cliente?.codigo).toBe(94109)
    expect(pista).toContain('CNPJ')
  })

  it('localiza por CPF no nome do arquivo', () => {
    const { cliente } = identificarClientePorNome('Procuração 123.456.789-09.pdf', indice)
    expect(cliente?.codigo).toBe(1234)
  })

  it('localiza por código de cliente', () => {
    const { cliente } = identificarClientePorNome('COD94109 - contrato.pdf', indice)
    expect(cliente?.codigo).toBe(94109)
  })

  it('retorna null quando não identifica', () => {
    const { cliente } = identificarClientePorNome('documento-avulso.pdf', indice)
    expect(cliente).toBeNull()
  })
})

describe('filtrarPdfsValidos', () => {
  it('rejeita arquivo não-PDF e aceita PDF', () => {
    const pdf = new File(['x'], 'ok.pdf', { type: 'application/pdf' })
    const txt = new File(['x'], 'planilha.xlsx', { type: 'application/vnd.ms-excel' })
    const r = filtrarPdfsValidos([pdf, txt])
    expect(r.validos).toHaveLength(1)
    expect(r.rejeitados[0].motivo).toContain('apenas PDF')
  })

  it('respeita o limite unificado de 10.000 arquivos', () => {
    expect(LIMITE_MAXIMO_ANEXO_MASSA).toBe(10000)
  })
})

describe('processarAnexosEmMassa', () => {
  it('marca item sem cliente como pendência e processa os demais', async () => {
    const itens = [
      item({ id: 'a', titulo: 'Doc A', cliente: null }),
      item({
        id: 'b',
        titulo: 'Doc B',
        cliente: {
          codigo: 94109,
          razao_social: 'CARDOSO & SIX LTDA',
          documento_limpo: '11222333000144',
        },
      }),
    ]
    const res = await processarAnexosEmMassa(itens, {
      onItemAtualizado: () => {},
      onProgresso: () => {},
    })
    expect(res.anexados).toBe(1)
    expect(res.pendentes).toBe(1)
    expect(res.falhas).toBe(0)
  })

  it('marca duplicado quando o título já existe para o cliente', async () => {
    const svc = await import('@/services/clienteDadosComplementaresService')
    const { listarArquivosCliente } = svc as any
    ;(listarArquivosCliente as any).mockResolvedValueOnce([{ titulo: 'Contrato Social' }])

    const itens = [
      item({
        id: 'd',
        titulo: 'Contrato Social',
        cliente: {
          codigo: 94109,
          razao_social: 'CARDOSO & SIX LTDA',
          documento_limpo: '11222333000144',
        },
      }),
    ]
    const res = await processarAnexosEmMassa(itens, {
      onItemAtualizado: () => {},
      onProgresso: () => {},
    })
    expect(res.duplicados).toBe(1)
    expect(res.anexados).toBe(0)
  })

  it('marca falha com motivo quando o upload rejeita', async () => {
    const svc = await import('@/services/clienteDadosComplementaresService')
    const { uploadArquivoCliente } = svc as any
    ;(uploadArquivoCliente as any).mockRejectedValueOnce(new Error('storage cheio'))

    const itens = [
      item({
        id: 'f',
        titulo: 'Falha',
        cliente: {
          codigo: 94109,
          razao_social: 'CARDOSO & SIX LTDA',
          documento_limpo: '11222333000144',
        },
      }),
    ]
    const res = await processarAnexosEmMassa(itens, {
      onItemAtualizado: () => {},
      onProgresso: () => {},
    })
    expect(res.falhas).toBe(1)
    expect(res.itens[0].motivo).toContain('storage cheio')
  })
})
