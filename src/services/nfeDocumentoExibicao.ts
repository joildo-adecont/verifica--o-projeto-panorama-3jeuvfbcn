/**
 * ROTULAGEM E FORMATAÇÃO DE DOCUMENTOS NA LISTAGEM DE NFes
 * ========================================================
 * Sistema ADECONT — Projeto Panorama
 *
 * Reusa EXCLUSIVAMENTE o validador central (validacaoDocumento.ts) —
 * nenhum algoritmo de dígitos verificadores é duplicado aqui.
 *
 * Regras de exibição:
 *  - 11 dígitos → "CPF" (exibição sem máscara, como sempre foi);
 *  - 14 dígitos válidos como CNPJ → "CNPJ";
 *  - 14 dígitos válidos como CAEPF (produtores rurais PF, amarração
 *    tenta-CNPJ-então-CAEPF) → "CAEPF" com máscara 000.000.000/000-00;
 *  - documento que não confere em nenhum formato → rótulo pela quantidade
 *    de dígitos, número exibido como veio (nunca silenciosamente alterado).
 */
import { formatarCAEPF, validarDocumentoCadastral } from '@/services/validacaoDocumento'

export interface RotulagemDocumentoFiscal {
  rotulo: 'CPF' | 'CNPJ' | 'CAEPF'
  exibicao: string
}

export function rotularDocumentoFiscal(documento: string | undefined): RotulagemDocumentoFiscal {
  const raw = String(documento || '')
  const limpo = raw.replace(/\D/g, '')

  if (limpo.length === 11) {
    return { rotulo: 'CPF', exibicao: raw }
  }

  if (limpo.length === 14) {
    // Amarração central: tenta CNPJ primeiro; se não conferir e for um CAEPF
    // válido (DVs com pesos do CNPJ + deslocamento +12), rotula e mascara CAEPF.
    const res = validarDocumentoCadastral(limpo)
    if (res.tipoEsperado === 'CAEPF') {
      return { rotulo: 'CAEPF', exibicao: formatarCAEPF(limpo) }
    }
    return { rotulo: 'CNPJ', exibicao: raw }
  }

  // Tamanho irregular: mantém o rótulo antigo pela heurística de tamanho,
  // sem máscara e sem validar (documento problemático continua visível).
  return { rotulo: limpo.length === 11 ? 'CPF' : 'CNPJ', exibicao: raw }
}
