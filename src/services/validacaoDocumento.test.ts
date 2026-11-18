import { describe, it, expect } from 'vitest'
import {
  formatarCAEPF,
  validarCAEPF,
  validarCNPJ,
  validarCPF,
  validarDocumentoCadastral,
} from './validacaoDocumento'

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

  it('valida CAEPF (14 dígitos, DVs com pesos do CNPJ e deslocamento +12)', () => {
    // Exemplo oficial do SERPRO
    expect(validarCAEPF('00000002500171')).toBe(true)
    // Exemplo do validation-br (checksum de 411422600001 = 01)
    expect(validarCAEPF('411.422.600/001-01')).toBe(true)
    expect(validarCAEPF('293.118.610/001-84')).toBe(true)
    // DV errado é rejeitado
    expect(validarCAEPF('29311861000185')).toBe(false)
    expect(validarCAEPF('00000002500170')).toBe(false)
    // Base com todos os dígitos iguais é rejeitada
    expect(validarCAEPF('00000000000012')).toBe(false)
    // Tamanho errado é rejeitado
    expect(validarCAEPF('2931186100018')).toBe(false)
    // Formatação da máscara 000.000.000/000-00
    expect(formatarCAEPF('29311861000184')).toBe('293.118.610/001-84')
    expect(formatarCAEPF('293118')).toBe('293.118')
  })

  it('validarDocumentoCadastral reconhece CAEPF declarado e por amarração de 14 dígitos', () => {
    // Tipo declarado CAEPF: válido com DVs corretos
    const caepfDeclarado = validarDocumentoCadastral('009.435.480/001-87', 'CAEPF')
    expect(caepfDeclarado.valido).toBe(true)
    expect(caepfDeclarado.tipoEsperado).toBe('CAEPF')

    // 14 dígitos sem tipo declarado: primeiro tenta CNPJ, depois CAEPF
    const caepfAmarrado = validarDocumentoCadastral('232.603.270/001-18', '')
    expect(caepfAmarrado.valido).toBe(true)
    expect(caepfAmarrado.tipoEsperado).toBe('CAEPF')

    // 14 dígitos que não são CNPJ nem CAEPF continuam inválidos
    const nenhum = validarDocumentoCadastral('29180409000119', '')
    expect(nenhum.valido).toBe(false)

    // CAEPF declarado com DV errado continua inválido
    const caepfRuim = validarDocumentoCadastral('009.435.480/001-88', 'CAEPF')
    expect(caepfRuim.valido).toBe(false)
    expect(caepfRuim.motivoInvalido).toContain('CAEPF')
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

  it('CEI continua validado como antes (12 dígitos)', () => {
    const cei = validarDocumentoCadastral('192261133509', 'CEI')
    expect(cei.valido).toBe(true)
    expect(cei.tipoEsperado).toBe('CEI')
  })
})
