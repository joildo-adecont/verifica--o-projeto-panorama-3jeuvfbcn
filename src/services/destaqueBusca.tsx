import React from 'react'

/**
 * Remove acentos e converte para minúsculas para busca insensível a caixa e diacríticos.
 */
export function normalizarParaBusca(texto?: string | null): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Divide a query em múltiplos termos individuais (palavras-chave).
 */
export function extrairPalavrasChave(query?: string | null): string[] {
  if (!query) return []
  return normalizarParaBusca(query)
    .split(/\s+/)
    .filter((palavra) => palavra.length > 0)
}

/**
 * Avalia se o texto fornecido (ou junção de campos) contém TODAS as palavras-chave fornecidas (operador "E").
 * Quando a lista de palavras-chave está vazia, retorna true.
 */
export function correspondePalavrasChave(
  textoAlvo: string | string[] | undefined | null,
  palavrasChave: string[],
): boolean {
  if (!palavrasChave || palavrasChave.length === 0) return true
  const textoNormalizado = Array.isArray(textoAlvo)
    ? textoAlvo.map((t) => normalizarParaBusca(t)).join(' ')
    : normalizarParaBusca(textoAlvo)

  if (!textoNormalizado) return false
  return palavrasChave.every((palavra) => textoNormalizado.includes(palavra))
}

/**
 * Destaca visualmente trechos de texto que correspondam a qualquer uma das palavras-chave.
 * Ignora acentos e caixa alta/baixa, preservando a acentuação e caixa original do texto de exibição.
 */
export function destacarTrechos(
  textoOriginal: string | undefined | null,
  palavrasChave: string[],
  classeDestaque = 'bg-amber-200 text-amber-950 font-bold px-0.5 rounded shadow-2xs',
): React.ReactNode {
  if (!textoOriginal) return ''
  if (!palavrasChave || palavrasChave.length === 0) return textoOriginal

  // Normaliza palavras únicas e não vazias, ordenando da maior para a menor para evitar cortes em sub-palavras
  const termosUnicos = Array.from(new Set(palavrasChave.map((p) => normalizarParaBusca(p))))
    .filter((p) => p.length > 0)
    .sort((a, b) => b.length - a.length)

  if (termosUnicos.length === 0) return textoOriginal

  // Mapeamento caractere a caractere para preservar acentos do texto original
  // Cria string normalizada decomposta
  const normTexto = normalizarParaBusca(textoOriginal)
  if (!termosUnicos.some((termo) => normTexto.includes(termo))) {
    return textoOriginal
  }

  // Encontra intervalos de correspondência mapeados no texto original
  // Abordagem regex tolerante a acentos para correspondência exata nos caracteres originais
  const padroesRegex = termosUnicos.map((termo) => {
    return termo
      .split('')
      .map((ch) => {
        switch (ch) {
          case 'a':
            return '[aáàâãäåAÁÀÂÃÄÅ]'
          case 'e':
            return '[eéèêëEÉÈÊË]'
          case 'i':
            return '[iíìîïIÍÌÎÏ]'
          case 'o':
            return '[oóòôõöOÓÒÔÕÖ]'
          case 'u':
            return '[uúùûüUÚÙÛÜ]'
          case 'c':
            return '[cçCÇ]'
          default:
            return ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }
      })
      .join('')
  })

  try {
    const regexCombinada = new RegExp(`(${padroesRegex.join('|')})`, 'gi')
    const partes = textoOriginal.split(regexCombinada)

    if (partes.length <= 1) return textoOriginal

    return partes.map((parte, index) => {
      // Verifica se esta parte corresponde a alguma das palavras pesquisadas
      const parteNorm = normalizarParaBusca(parte)
      const ehMatch = termosUnicos.some((t) => t === parteNorm)

      if (ehMatch) {
        return (
          <mark key={index} className={classeDestaque}>
            {parte}
          </mark>
        )
      }
      return <React.Fragment key={index}>{parte}</React.Fragment>
    })
  } catch {
    return textoOriginal
  }
}
