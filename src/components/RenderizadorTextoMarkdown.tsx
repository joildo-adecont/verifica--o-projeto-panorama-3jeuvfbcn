/**
 * Parser e Renderizador de Markdown e Seções Estruturadas
 * para o Relatório do Diagnóstico Tributário ADECONT.
 *
 * Suporta:
 * - Títulos hierárquicos (###, ##, #)
 * - Listas com marcadores (- ou • ou *)
 * - Listas numeradas (1., 2., etc.)
 * - Negrito (**texto**), itálico (*texto*), código inline (`código`)
 * - Destaques e badges de pontos de atenção
 * - Extração de seções inteligentes caso o agente envie texto corrido/markdown
 */
import React from 'react'

export interface BlocoTexto {
  tipo: 'h1' | 'h2' | 'h3' | 'p' | 'lista_bullet' | 'lista_num' | 'atencao' | 'citacao'
  conteudo: string
  itens?: string[]
}

/**
 * Renderiza nós inline com suporte a **negrito**, *itálico* e `código`
 */
export function renderizarTextoInline(texto: string): React.ReactNode[] {
  if (!texto) return []

  // Tokeniza **negrito**, *itálico*, `código`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g
  const partes = texto.split(regex)

  return partes.map((parte, idx) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {parte.slice(2, -2)}
        </strong>
      )
    }
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-800">
          {parte.slice(1, -1)}
        </em>
      )
    }
    if (parte.startsWith('`') && parte.endsWith('`') && parte.length >= 2) {
      return (
        <code
          key={idx}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-indigo-800 border border-slate-200"
        >
          {parte.slice(1, -1)}
        </code>
      )
    }
    return <React.Fragment key={idx}>{parte}</React.Fragment>
  })
}

/**
 * Converte texto livre ou markdown do agente em blocos semânticos estruturados
 */
export function parsearMarkdownEmBlocos(texto: string): BlocoTexto[] {
  if (!texto || !texto.trim()) return []

  const linhas = texto.split(/\r?\n/)
  const blocos: BlocoTexto[] = []

  let bulletBuffer: string[] = []
  let numBuffer: string[] = []

  const flushListas = () => {
    if (bulletBuffer.length > 0) {
      blocos.push({
        tipo: 'lista_bullet',
        conteudo: '',
        itens: [...bulletBuffer],
      })
      bulletBuffer = []
    }
    if (numBuffer.length > 0) {
      blocos.push({
        tipo: 'lista_num',
        conteudo: '',
        itens: [...numBuffer],
      })
      numBuffer = []
    }
  }

  for (let i = 0; i < linhas.length; i++) {
    const rawLinha = linhas[i]
    const linha = rawLinha.trim()

    if (!linha) {
      flushListas()
      continue
    }

    // Título H1 (# )
    if (linha.startsWith('# ')) {
      flushListas()
      blocos.push({ tipo: 'h1', conteudo: linha.slice(2).trim() })
      continue
    }

    // Título H2 (## )
    if (linha.startsWith('## ')) {
      flushListas()
      blocos.push({ tipo: 'h2', conteudo: linha.slice(3).trim() })
      continue
    }

    // Título H3 (### )
    if (linha.startsWith('### ')) {
      flushListas()
      blocos.push({ tipo: 'h3', conteudo: linha.slice(4).trim() })
      continue
    }

    // Item de lista não numerada (- , * , • )
    if (linha.startsWith('- ') || linha.startsWith('* ') || linha.startsWith('• ')) {
      if (numBuffer.length > 0) flushListas()
      bulletBuffer.push(linha.replace(/^[-*•]\s+/, '').trim())
      continue
    }

    // Item de lista numerada (1. , 2. , 1) , 2) , etc.)
    const matchNum = linha.match(/^(\d+)[.)]\s+(.*)$/)
    if (matchNum) {
      if (bulletBuffer.length > 0) flushListas()
      numBuffer.push(matchNum[2].trim())
      continue
    }

    // Citações ou avisos (> ou Atenção:)
    if (linha.startsWith('> ')) {
      flushListas()
      blocos.push({ tipo: 'citacao', conteudo: linha.slice(2).trim() })
      continue
    }

    // Ponto de atenção explícito
    if (
      linha.toLowerCase().startsWith('atenção:') ||
      linha.toLowerCase().startsWith('ponto de atenção:') ||
      linha.toLowerCase().startsWith('alerta:') ||
      linha.startsWith('⚠️')
    ) {
      flushListas()
      blocos.push({
        tipo: 'atencao',
        conteudo: linha.replace(/^(⚠️|atenção:|ponto de atenção:|alerta:)\s*/i, '').trim(),
      })
      continue
    }

    // Parágrafo comum
    flushListas()
    blocos.push({ tipo: 'p', conteudo: linha })
  }

  flushListas()
  return blocos
}

/**
 * Componente que renderiza um texto markdown formatado
 */
export function RenderizadorTextoMarkdown({
  texto,
  className = '',
}: {
  texto: string
  className?: string
}) {
  const blocos = parsearMarkdownEmBlocos(texto)

  if (blocos.length === 0) {
    return <p className="text-slate-400 italic text-sm">Nenhum conteúdo informado.</p>
  }

  return (
    <div className={`space-y-3 text-slate-800 ${className}`}>
      {blocos.map((bloco, idx) => {
        switch (bloco.tipo) {
          case 'h1':
            return (
              <h2
                key={idx}
                className="text-lg sm:text-xl font-black text-panorama-navy border-b border-slate-200 pb-1.5 mt-4 first:mt-0"
              >
                {renderizarTextoInline(bloco.conteudo)}
              </h2>
            )
          case 'h2':
            return (
              <h3
                key={idx}
                className="text-base sm:text-lg font-bold text-slate-900 border-l-3 border-panorama-gold pl-2.5 mt-3 first:mt-0"
              >
                {renderizarTextoInline(bloco.conteudo)}
              </h3>
            )
          case 'h3':
            return (
              <h4
                key={idx}
                className="text-sm sm:text-base font-bold text-slate-800 mt-2 first:mt-0"
              >
                {renderizarTextoInline(bloco.conteudo)}
              </h4>
            )
          case 'lista_bullet':
            return (
              <ul key={idx} className="space-y-1.5 pl-4 sm:pl-5 list-disc marker:text-indigo-600">
                {bloco.itens?.map((it, iIdx) => (
                  <li key={iIdx} className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                    {renderizarTextoInline(it)}
                  </li>
                ))}
              </ul>
            )
          case 'lista_num':
            return (
              <ol
                key={idx}
                className="space-y-1.5 pl-4 sm:pl-5 list-decimal marker:font-bold marker:text-indigo-800"
              >
                {bloco.itens?.map((it, iIdx) => (
                  <li key={iIdx} className="text-xs sm:text-[13px] leading-relaxed text-slate-700">
                    {renderizarTextoInline(it)}
                  </li>
                ))}
              </ol>
            )
          case 'atencao':
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs sm:text-[13px] leading-relaxed"
              >
                <span className="font-bold block mb-0.5">Ponto de Atenção:</span>
                {renderizarTextoInline(bloco.conteudo)}
              </div>
            )
          case 'citacao':
            return (
              <blockquote
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border-l-4 border-indigo-400 text-slate-700 italic text-xs sm:text-[13px]"
              >
                {renderizarTextoInline(bloco.conteudo)}
              </blockquote>
            )
          case 'p':
          default:
            return (
              <p
                key={idx}
                className="text-xs sm:text-[13.5px] leading-relaxed text-slate-700 text-justify"
              >
                {renderizarTextoInline(bloco.conteudo)}
              </p>
            )
        }
      })}
    </div>
  )
}
