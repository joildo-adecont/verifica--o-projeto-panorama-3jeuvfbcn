/**
 * UTILITÁRIO DE VALIDAÇÃO DE DOCUMENTOS (CPF / CNPJ / CEI)
 * ========================================================
 * Usado para sinalização visual na interface ADECONT conforme
 * diretriz de Limpeza Segura (nunca altera o documento automaticamente,
 * apenas sinaliza na listagem e nos seletores).
 */

export interface ValidacaoDocumentoResultado {
  valido: boolean
  tipoEsperado: 'CPF' | 'CNPJ' | 'CEI' | 'INDEFINIDO'
  motivoInvalido?: string
  limpo: string
}

/**
 * Validação com dígitos verificadores para CPF
 */
export function validarCPF(cpf: string): boolean {
  const limpo = (cpf || '').replace(/\D/g, '')
  if (limpo.length !== 11) return false
  if (/^(\d)\1{10}$/.test(limpo)) return false // Elimina 111.111.111-11, etc.

  let soma = 0
  let resto = 0

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo.substring(9, 10), 10)) return false

  soma = 0
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(limpo.substring(10, 11), 10)) return false

  return true
}

/**
 * Validação com dígitos verificadores para CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const limpo = (cnpj || '').replace(/\D/g, '')
  if (limpo.length !== 14) return false
  if (/^(\d)\1{13}$/.test(limpo)) return false // Elimina 00000000000000, etc.

  let tamanho = limpo.length - 2
  let numeros = limpo.substring(0, tamanho)
  const digitos = limpo.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false

  tamanho = tamanho + 1
  numeros = limpo.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false

  return true
}

/**
 * Validação geral de documento cadastral (CPF, CNPJ, CEI ou vazio)
 */
export function validarDocumentoCadastral(
  numeroDoc?: string,
  tipoDeclarado?: string,
): ValidacaoDocumentoResultado {
  const raw = String(numeroDoc || '').trim()
  const limpo = raw.replace(/\D/g, '')

  if (!raw || !limpo) {
    return {
      valido: false,
      tipoEsperado: 'INDEFINIDO',
      motivoInvalido: 'Documento ausente / não informado',
      limpo: '',
    }
  }

  const tipo = (tipoDeclarado || '').toUpperCase().trim()

  if (limpo.length === 11 || tipo === 'CPF') {
    if (limpo.length !== 11) {
      return {
        valido: false,
        tipoEsperado: 'CPF',
        motivoInvalido: `CPF com ${limpo.length} dígitos (esperado 11)`,
        limpo,
      }
    }
    const ok = validarCPF(limpo)
    return {
      valido: ok,
      tipoEsperado: 'CPF',
      motivoInvalido: ok ? undefined : 'Dígito verificador de CPF inválido',
      limpo,
    }
  }

  if (limpo.length === 14 || tipo === 'CNPJ') {
    if (limpo.length !== 14) {
      return {
        valido: false,
        tipoEsperado: 'CNPJ',
        motivoInvalido: `CNPJ com ${limpo.length} dígitos (esperado 14)`,
        limpo,
      }
    }
    const ok = validarCNPJ(limpo)
    return {
      valido: ok,
      tipoEsperado: 'CNPJ',
      motivoInvalido: ok ? undefined : 'Dígito verificador de CNPJ inválido',
      limpo,
    }
  }

  if (limpo.length === 12 || tipo === 'CEI') {
    return {
      valido: limpo.length === 12,
      tipoEsperado: 'CEI',
      motivoInvalido:
        limpo.length === 12 ? undefined : `CEI com ${limpo.length} dígitos (esperado 12)`,
      limpo,
    }
  }

  return {
    valido: false,
    tipoEsperado: 'INDEFINIDO',
    motivoInvalido: `Tamanho irregular (${limpo.length} dígitos)`,
    limpo,
  }
}
