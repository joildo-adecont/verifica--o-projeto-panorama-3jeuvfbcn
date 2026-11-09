import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  processarArquivoImportacaoMassa,
  exportarPlanilhaComplementarMassa,
  LIMITE_MAXIMO_IMPORTACAO_COMPLEMENTAR,
} from './clienteImportExportMassaService'
import * as XLSX from 'xlsx'
import { EmpresaRecord } from '@/types/cadastroEmpresas'

vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => ({
      getFullList: vi.fn(async () => []),
      getFirstListItem: vi.fn(async () => {
        throw new Error('Not found')
      }),
      create: vi.fn(async (data) => ({ id: 'mock_id', ...data })),
      update: vi.fn(async (id, data) => ({ id, ...data })),
      delete: vi.fn(async () => true),
    }),
    files: {
      getUrl: vi.fn(() => 'http://mock.pb/files/1/test.pdf'),
    },
  },
}))

describe('clienteImportExportMassaService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('respeita o limite máximo de 10.000 importações', () => {
    expect(LIMITE_MAXIMO_IMPORTACAO_COMPLEMENTAR).toBe(10000)
  })

  it('processa planilha XLSX de importação e vincula por CNPJ e Código', async () => {
    const empresasMock: EmpresaRecord[] = [
      {
        codigo: 101,
        tipo_documento: 'CNPJ',
        numero_documento: '12.345.678/0001-90',
        documento_limpo: '12345678000190',
        razao_social: 'Empresa Teste Alpha LTDA',
        apelido: 'Alpha',
      },
      {
        codigo: 102,
        tipo_documento: 'CPF',
        numero_documento: '987.654.321-00',
        documento_limpo: '98765432100',
        razao_social: 'Cliente Beta da Silva',
        apelido: 'Beta',
      },
    ]

    // Monta uma planilha de teste em memória
    const dados = [
      ['Código', 'CNPJ / CPF', 'Razão Social', 'E-mail', 'WhatsApp / Celular', 'Instagram'],
      [
        '101',
        '12.345.678/0001-90',
        'Empresa Teste Alpha LTDA',
        'alpha@teste.com',
        '(11) 98888-7777',
        '@alpha_oficial',
      ],
      [
        '102',
        '987.654.321-00',
        'Cliente Beta da Silva',
        'beta@silva.com',
        '11977776666',
        'beta_insta',
      ],
      ['999', '00.000.000/0001-00', 'Inexistente', 'inexistente@teste.com', '', ''],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(dados)
    XLSX.utils.book_append_sheet(wb, ws, 'Dados')
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

    const file = new File([buffer], 'teste_importacao.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const resultado = await processarArquivoImportacaoMassa(
      file,
      empresasMock,
      'Operador Teste ADECONT',
    )

    expect(resultado.totalLido).toBe(3)
    expect(resultado.clientesAtualizados).toBe(2)
    expect(resultado.ignoradosCount).toBe(1) // Cliente 999 inexistente
    expect(resultado.contatosCriadosOuAtualizados).toBeGreaterThan(0)
  })
})
