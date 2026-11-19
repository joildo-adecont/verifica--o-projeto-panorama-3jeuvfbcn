/**
 * SERVIÇO DE EXPORTAÇÃO DOS RELATÓRIOS DOS AGENTES — PDF · TXT · CSV · XLSX
 * Sistema ADECONT — Projeto Panorama
 *
 * Reutiliza os padrões já consagrados do sistema:
 * - PDF: impressão da própria tela via CSS @media print + window.print()
 *   (padrão BotaoExportarPDF / relatórios A4) — paisagem, por relatório.
 * - TXT: texto corrido do relatório em UTF-8.
 * - CSV: BOM UTF-8 + delimitador ';' (abre direto no Excel pt-BR) — padrão
 *   exportarDadosMercado.ts.
 * - XLSX: planilha nativa SheetJS (pacote `xlsx`, já dependência do projeto).
 */

import * as XLSX from 'xlsx'
import type { BlocoRelatorio } from '@/services/relatorioAgenteParser'

export type FormatoExportacaoRelatorio = 'pdf' | 'txt' | 'csv' | 'xlsx'

const CSS_IMPRESSAO_RELATORIO = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body * { visibility: hidden !important; }
  #relatorio-agente-impressao, #relatorio-agente-impressao * { visibility: visible !important; }
  #relatorio-agente-impressao {
    position: absolute !important;
    left: 0; top: 0; width: 100%;
    box-shadow: none !important; border: none !important;
  }
  #relatorio-agente-impressao table { break-inside: avoid; width: 100%; font-size: 9pt; }
  #relatorio-agente-impressao .nao-imprimir { display: none !important; }
}
`

export interface MetaExportacaoRelatorio {
  titulo: string
  agente: string
  dataEmissao?: string
}

/** Nome de arquivo seguro: sem acentos, espaços ou caracteres proibidos. */
export function nomeArquivoSeguroRelatorio(titulo: string, ext: string): string {
  const base = (titulo || 'Relatorio Agente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
  return `ADECONT_${base || 'Relatorio_Agente'}_${new Date().toISOString().slice(0, 10)}.${ext}`
}

/** Blocos → texto corrido (TXT e corpo do CSV/XLSX compartilham a base). */
export function blocosParaTexto(blocos: BlocoRelatorio[], meta: MetaExportacaoRelatorio): string {
  const linhas: string[] = []
  linhas.push('ADECONT — Assessoria Contábil e Administrativa')
  linhas.push(`Relatório do Agente: ${meta.agente}`)
  linhas.push(`Título: ${meta.titulo}`)
  linhas.push(`Data de emissão: ${meta.dataEmissao || new Date().toLocaleString('pt-BR')}`)
  linhas.push('')
  for (const b of blocos) {
    switch (b.tipo) {
      case 'titulo':
        linhas.push('')
        linhas.push(b.texto.toUpperCase())
        linhas.push('-'.repeat(Math.min(80, b.texto.length + 4)))
        break
      case 'texto':
        linhas.push(b.texto)
        linhas.push('')
        break
      case 'lista':
        b.itens.forEach((i) => linhas.push(`  • ${i}`))
        linhas.push('')
        break
      case 'tabela':
        linhas.push(b.colunas.join(' | '))
        b.linhas.forEach((l) => linhas.push(l.join(' | ')))
        linhas.push('')
        break
      case 'comparativo':
        b.itens.forEach((i) => linhas.push(`  ${i.rotulo}: ${i.valor}`))
        linhas.push('')
        break
    }
  }
  return linhas.join('\r\n')
}

function escaparCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '""'
  const s = String(valor)
    .replace(/"/g, '""')
    .replace(/\r\n|\n|\r/g, ' ')
    .trim()
  return `"${s}"`
}

/** Blocos → CSV com BOM UTF-8 e ';' — todas as tabelas/comparativos empilhadas. */
export function blocosParaCsv(blocos: BlocoRelatorio[], meta: MetaExportacaoRelatorio): string {
  const linhas: string[] = []
  linhas.push(escaparCsv('ADECONT — Assessoria Contábil e Administrativa'))
  linhas.push(escaparCsv(`Relatório do Agente: ${meta.agente}`))
  linhas.push(escaparCsv(`Título: ${meta.titulo}`))
  linhas.push(escaparCsv(`Emissão: ${meta.dataEmissao || new Date().toLocaleString('pt-BR')}`))
  linhas.push('')
  for (const b of blocos) {
    if (b.tipo === 'titulo') {
      linhas.push(escaparCsv(b.texto))
    } else if (b.tipo === 'tabela') {
      linhas.push(b.colunas.map(escaparCsv).join(';'))
      b.linhas.forEach((l) => linhas.push(l.map((c) => escaparCsv(c ?? '')).join(';')))
      linhas.push('')
    } else if (b.tipo === 'comparativo') {
      linhas.push(escaparCsv('Item') + ';' + escaparCsv('Valor'))
      b.itens.forEach((i) => linhas.push(escaparCsv(i.rotulo) + ';' + escaparCsv(i.valor)))
      linhas.push('')
    } else if (b.tipo === 'lista') {
      b.itens.forEach((i) => linhas.push(escaparCsv(i)))
      linhas.push('')
    }
  }
  return '\uFEFF' + linhas.join('\r\n')
}

/** Blocos → planilha XLSX nativa (uma aba, seções empilhadas). */
export function blocosParaXlsx(
  blocos: BlocoRelatorio[],
  meta: MetaExportacaoRelatorio,
  nomeArquivo?: string,
): void {
  const aoa: (string | number)[][] = []
  aoa.push(['ADECONT — Assessoria Contábil e Administrativa'])
  aoa.push([`Relatório do Agente: ${meta.agente}`])
  aoa.push([`Título: ${meta.titulo}`])
  aoa.push([`Emissão: ${meta.dataEmissao || new Date().toLocaleString('pt-BR')}`])
  aoa.push([])
  for (const b of blocos) {
    if (b.tipo === 'titulo') aoa.push([b.texto])
    else if (b.tipo === 'tabela') {
      aoa.push(b.colunas)
      b.linhas.forEach((l) => aoa.push(l.map((c) => c ?? '')))
      aoa.push([])
    } else if (b.tipo === 'comparativo') {
      aoa.push(['Item', 'Valor'])
      b.itens.forEach((i) => aoa.push([i.rotulo, i.valor]))
      aoa.push([])
    } else if (b.tipo === 'lista') {
      b.itens.forEach((i) => aoa.push([i]))
      aoa.push([])
    }
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 42 }, { wch: 22 }, { wch: 22 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
  XLSX.writeFile(wb, nomeArquivo || nomeArquivoSeguroRelatorio(meta.titulo, 'xlsx'))
}

/** Baixa um blob de texto (TXT ou CSV) no navegador. */
export function baixarTextoRelatorio(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** PDF: abre a caixa de impressão escopada ao bloco #relatorio-agente-impressao (paisagem). */
export function imprimirRelatorioAgente(): void {
  if (!document.getElementById('css-impressao-relatorio-agente')) {
    const tag = document.createElement('style')
    tag.id = 'css-impressao-relatorio-agente'
    tag.textContent = CSS_IMPRESSAO_RELATORIO
    document.head.appendChild(tag)
  }
  window.setTimeout(() => window.print(), 120)
}
