/**
 * BLOCOS ESTRUTURADOS → HTML puro (documento de impressão / PDF)
 * Sistema ADECONT — Projeto Panorama
 *
 * Usado pelo gerador de impressão (imprimirRelatorioAgente.ts). Converte cada
 * bloco do parser em HTML de verdade — títulos, parágrafos, listas, tabelas
 * completas e comparativos em cartões — com escape de HTML em todo conteúdo.
 */

import type { BlocoRelatorio } from '@/services/relatorioAgenteParser'

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Markdown inline simples: **negrito**, *itálico*, `código`. */
function inline(s: string): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

function htmlTitulo(b: Extract<BlocoRelatorio, { tipo: 'titulo' }>): string {
  const mapa = { 1: 'h2', 2: 'h2', 3: 'h3' } as const
  return `<${mapa[b.nivel]}>${inline(b.texto)}</${mapa[b.nivel]}>`
}

function htmlTabela(b: Extract<BlocoRelatorio, { tipo: 'tabela' }>): string {
  const th = b.colunas.map((c) => `<th>${inline(c)}</th>`).join('')
  const trs = b.linhas
    .map((l) => `<tr>${l.map((c) => `<td>${inline(c ?? '')}</td>`).join('')}</tr>`)
    .join('')
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`
}

function htmlComparativo(b: Extract<BlocoRelatorio, { tipo: 'comparativo' }>): string {
  const cards = b.itens
    .map(
      (it) =>
        `<div class="card"><p class="rotulo">${inline(it.rotulo)}</p><p class="valor">${inline(
          it.valor,
        )}</p></div>`,
    )
    .join('')
  return `<div class="comparativo">${cards}</div>`
}

/** Converte todos os blocos em HTML contíguo (sem raiz — vai dentro do host). */
export function renderizarBlocosComoHtml(blocos: BlocoRelatorio[]): string {
  const out: string[] = []
  for (const b of blocos) {
    switch (b.tipo) {
      case 'titulo':
        out.push(htmlTitulo(b))
        break
      case 'texto':
        out.push(`<p>${inline(b.texto)}</p>`)
        break
      case 'lista':
        out.push(`<ul>${b.itens.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`)
        break
      case 'tabela':
        out.push(htmlTabela(b))
        break
      case 'comparativo':
        out.push(htmlComparativo(b))
        break
      default:
        break
    }
  }
  return out.join('\n')
}
