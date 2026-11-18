/**
 * UTILITÁRIO DE VALIDAÇÃO DE DOCUMENTOS (CPF / CNPJ / CAEPF / CEI)
 * ================================================================
 * Usado para sinalização visual na interface ADECONT conforme
 * diretriz de Limpeza Segura (nunca altera o documento automaticamente,
 * apenas sinaliza na listagem e nos seletores).
 *
 * CAEPF (Cadastro de Atividades Econômicas da Pessoa Física):
 * inscrição de 14 dígitos da RFB para produtores rurais pessoa física,
 * formato 000.000.000/000-00 — base de 9 dígitos do CPF + sequencial de
 * 3 dígitos + 2 dígitos verificadores. Os DVs usam os pesos do módulo 11
 * do CNPJ (ciclo 2..9, dv = 0 se resto < 2, senão 11 - resto) e o par
 * resultante é deslocado em +12 com volta ao chegar a 100. Vetores de
 * conferência: SERPRO 00000002500171 → 71 e validation-br
 * 411422600001 → 01.
 */

export interface ValidacaoDocumentoResultado {
  valido: boolean
  tipoEsperado: 'CPF' | 'CNPJ' | 'CAEPF' | 'CEI' | 'INDEFINIDO'
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
 * Validação com dígitos verificadores para CAEPF (14 dígitos)
 * Pesos do módulo 11 do CNPJ + deslocamento de +12 no par de DVs.
 */
export function validarCAEPF(caepf: string): boolean {
  const limpo = (caepf || '').replace(/\D/g, '')
  if (limpo.length !== 14) return false
  // Base de 12 dígitos com todos os dígitos iguais é rejeitada
  if (/^(\d)\1{11}\d{2}$/.test(limpo)) return false

  const calcularDvCnpj = (base: string): number => {
    let soma = 0
    let peso = 2
    for (let i = base.length - 1; i >= 0; i--) {
      soma += parseInt(base.charAt(i), 10) * peso
      peso = peso === 9 ? 2 : peso + 1
    }
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const base = limpo.substring(0, 12)
  const dv1Calc = calcularDvCnpj(base)
  const dv2Calc = calcularDvCnpj(base + String(dv1Calc))

  let par = dv1Calc * 10 + dv2Calc + 12
  if (par > 99) par -= 100

  const dv1 = parseInt(limpo.charAt(12), 10)
  const dv2 = parseInt(limpo.charAt(13), 10)
  return dv1 === Math.floor(par / 10) && dv2 === par % 10
}

/**
 * Formata um CAEPF na máscara 000.000.000/000-00 (até onde os dígitos vão)
 */
export function formatarCAEPF(valor: string): string {
  const limpo = (valor || '').replace(/\D/g, '').slice(0, 14)
  let out = limpo
  if (limpo.length > 9)
    out = `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}/${limpo.slice(9)}`
  else if (limpo.length > 6) out = `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6)}`
  else if (limpo.length > 3) out = `${limpo.slice(0, 3)}.${limpo.slice(3)}`
  return out
}

/**
 * Máscara progressiva por tipo de documento declarado
 */
export function mascararDocumentoCadastral(
  tipoDeclarado: string | undefined,
  valor: string,
): string {
  const tipo = (tipoDeclarado || '').toUpperCase().trim()
  const limpo = (valor || '').replace(/\D/g, '')
  if (tipo === 'CPF' && limpo.length <= 11) {
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  if (tipo === 'CAEPF') return formatarCAEPF(valor)
  if (tipo === 'CNPJ') {
    return limpo
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
  return valor
}

/**
 * Validação geral de documento cadastral (CPF, CNPJ, CAEPF, CEI ou vazio)
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

  if (tipo === 'CAEPF') {
    if (limpo.length !== 14) {
      return {
        valido: false,
        tipoEsperado: 'CAEPF',
        motivoInvalido: `CAEPF com ${limpo.length} dígitos (esperado 14)`,
        limpo,
      }
    }
    const ok = validarCAEPF(limpo)
    return {
      valido: ok,
      tipoEsperado: 'CAEPF',
      motivoInvalido: ok ? undefined : 'Dígito verificador de CAEPF inválido',
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
    // Reconhecimento com amarração: 14 dígitos podem ser CNPJ ou CAEPF.
    // Tenta CNPJ primeiro; se falhar, tenta CAEPF (produtores rurais PF)
    // antes de marcar como inválido.
    const okCnpj = validarCNPJ(limpo)
    if (okCnpj) {
      return { valido: true, tipoEsperado: 'CNPJ', limpo }
    }
    const okCaepf = validarCAEPF(limpo)
    if (okCaepf) {
      return {
        valido: true,
        tipoEsperado: 'CAEPF',
        motivoInvalido: undefined,
        limpo,
      }
    }
    return {
      valido: false,
      tipoEsperado: tipo === 'CNPJ' ? 'CNPJ' : 'INDEFINIDO',
      motivoInvalido: 'Dígito verificador inválido (não é CNPJ nem CAEPF válido)',
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
