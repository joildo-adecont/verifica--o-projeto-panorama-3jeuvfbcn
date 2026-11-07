import { describe, it, expect } from 'vitest'
import { validarCPF, validarCNPJ, validarDocumentoCadastral } from './validacaoDocumento'

describe('validacaoDocumento', () => {
  it('valida CPF correto e rejeita inválido', () => {
    // CPFs com dígitos verificadores válidos conhecidos de teste
    expect(validarCPF('11144477735')).toBe(true)
    expect(validarCPF('111.444.777-35')).toBe(true)
    expect(validarCPF('00000000000')).toBe(false)
    expect(validarCPF('12345678900')).toBe(false)
    expect(validarCPF('123')).toBe(false)
  })

  it('valida CNPJ correto e rejeita inválido', () => {
    // CNPJ Climatizar real: 08.003.213/0001-89
    expect(validarCNPJ('08003213000189')).toBe(true)
    expect(validarCNPJ('08.003.213/0001-89')).toBe(true)

    // CNPJ Vidro Astral real: 05.296.014/0001-18
    expect(validarCNPJ('05296014000118')).toBe(true)

    // CNPJ incorreto / malformado
    expect(validarCNPJ('00000000000000')).toBe(false)
    expect(validarCNPJ('6813609800014268136098')).toBe(false) // 22 dígitos
    expect(validarCNPJ('291804090001194')).toBe(false) // 15 dígitos
  })

  it('validarDocumentoCadastral detecta documentos malformados ou vazios para sinalização visual', () => {
    const semDoc = validarDocumentoCadastral('', 'CNPJ')
    expect(semDoc.valido).toBe(false)
    expect(semDoc.motivoInvalido).toContain('ausente')

    const cnpj22 = validarDocumentoCadastral('6813609800014268136098', 'CNPJ')
    expect(cnpj22.valido).toBe(false)
    expect(cnpj22.motivoInvalido).toContain('22 dígitos')

    const cnpj15 = validarDocumentoCadastral('291804090001194', 'CNPJ')
    expect(cnpj15.valido).toBe(false)
    expect(cnpj15.motivoInvalido).toContain('15 dígitos')

    const cnpjOk = validarDocumentoCadastral('08.003.213/0001-89', 'CNPJ')
    expect(cnpjOk.valido).toBe(true)
  })
})
