/**
 * BLOCOS → TEXTO CORRIDO (TXT) — conteúdo COMPLETO do relatório
 * Sistema ADECONT — Projeto Panorama
 *
 * Corrige a falha "material pesquisado não sai nos arquivos": a versão anterior
 * descartava os blocos 'texto' no CSV e no XLSX (só tabela/comparativo/lista
 * entravam) — o material pesquisado, que na prática é texto corrido, não
 * aparecia. Aqui TODO bloco vai para o formato, sem exceção.
 */

import * as XLSX from 'xlsx'
import type { BlocoRelatorio } from '@/services/relatorioAgenteParser'
import type { AgentCitation } from '@/lib/skipAi'

export interface MetaExportacaoRelatorio {
  titulo: string
  agente: string
  dataEmissao?: string
}

function agoraPadrao(): string {
  return new Date().toLocaleString('pt-BR')
}

function linhasCabecalho(meta: MetaExportacaoRelatorio, pergunta?: string): string[] {
  const l = [
    'ADECONT — Assessoria Contábil e Administrativa',
    `Relatório do Agente: ${meta.agente}`,
    `Título: ${meta.titulo}`,
    `Data de emissão: ${meta.dataEmissao || agoraPadrao()}`,
  ]
  if (pergunta) l.push(`Consulta de origem: ${pergunta}`)
  l.push('')
  return l
}

function linhasFontes(citations?: AgentCitation[]): string[] {
  if (!citations || citations.length === 0) return []
  const l = ['FONTES DO SISTEMA CITADAS', '-'.repeat(40)]
  citations.slice(0, 20).forEach((c, i) => {
    l.push(`  [${c.n ?? i + 1}] ${(c.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 300)}`)
  })
  l.push('')
  return l
}

/** Blocos → texto corrido (TXT). Nunca descarta bloco. */
export function blocosParaTexto(
  blocos: BlocoRelatorio[],
  meta: MetaExportacaoRelatorio,
  extras?: { pergunta?: string; citations?: AgentCitation[] },
): string {
  const linhas = linhasCabecalho(meta, extras?.pergunta)
  for (const b of blocos) {
    switch (b.tipo) {
      case 'titulo':
        linhas.push('')
        linhas.push(b.texto.toUpperCase())
        linhas.push('-'.repeat(Math.min(80, Math.max(4, b.texto.length + 4))))
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
  linhas.push(...linhasFontes(extras?.citations))
  return linhas.join('\r\n')
}

function escaparCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '""'
  return `"${String(valor)
    .replace(/"/g, '""')
    .replace(/\r\n|\n|\r/g, ' ')
    .trim()}"`
}

/** Blocos → CSV com BOM UTF-8 e ';' — texto, tabelas, comparativos e listas. */
export function blocosParaCsv(
  blocos: BlocoRelatorio[],
  meta: MetaExportacaoRelatorio,
  extras?: { pergunta?: string; citations?: AgentCitation[] },
): string {
  const linhas: string[] = []
  linhas.push(escaparCsv('ADECONT — Assessoria Contábil e Administrativa'))
  linhas.push(escaparCsv(`Relatório do Agente: ${meta.agente}`))
  linhas.push(escaparCsv(`Título: ${meta.titulo}`))
  linhas.push(escaparCsv(`Emissão: ${meta.dataEmissao || agoraPadrao()}`))
  if (extras?.pergunta) linhas.push(escaparCsv(`Consulta de origem: ${extras.pergunta}`))
  linhas.push('')

  for (const b of blocos) {
    switch (b.tipo) {
      case 'titulo':
        linhas.push(escaparCsv(b.texto))
        break
      case 'texto':
        linhas.push(escaparCsv(b.texto))
        break
      case 'tabela':
        linhas.push(b.colunas.map(escaparCsv).join(';'))
        b.linhas.forEach((l) => linhas.push(l.map((c) => escaparCsv(c ?? '')).join(';')))
        linhas.push('')
        break
      case 'comparativo':
        linhas.push(escaparCsv('Item') + ';' + escaparCsv('Valor'))
        b.itens.forEach((i) => linhas.push(escaparCsv(i.rotulo) + ';' + escaparCsv(i.valor)))
        linhas.push('')
        break
      case 'lista':
        b.itens.forEach((i) => linhas.push(escaparCsv(i)))
        linhas.push('')
        break
    }
  }
  if (extras?.citations && extras.citations.length > 0) {
    linhas.push(escaparCsv('Fontes do sistema citadas'))
    extras.citations.slice(0, 20).forEach((c, i) => {
      linhas.push(
        escaparCsv(
          `[${c.n ?? i + 1}] ${(c.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 300)}`,
        ),
      )
    })
    linhas.push('')
  }
  return '\uFEFF' + linhas.join('\r\n')
}

/** Blocos → planilha XLSX nativa (SheetJS), seções empilhadas — sem descartar bloco. */
export function blocosParaXlsx(
  blocos: BlocoRelatorio[],
  meta: MetaExportacaoRelatorio,
  nomeArquivo?: string,
  extras?: { pergunta?: string; citations?: AgentCitation[] },
): void {
  const aoa: (string | number)[][] = []
  aoa.push(['ADECONT — Assessoria Contábil e Administrativa'])
  aoa.push([`Relatório do Agente: ${meta.agente}`])
  aoa.push([`Título: ${meta.titulo}`])
  aoa.push([`Emissão: ${meta.dataEmissao || agoraPadrao()}`])
  if (extras?.pergunta) aoa.push([`Consulta de origem: ${extras.pergunta}`])
  aoa.push([])

  for (const b of blocos) {
    switch (b.tipo) {
      case 'titulo':
        aoa.push([b.texto])
        break
      case 'texto':
        aoa.push([b.texto])
        break
      case 'tabela':
        aoa.push(b.colunas)
        b.linhas.forEach((l) => aoa.push(l.map((c) => c ?? '')))
        aoa.push([])
        break
      case 'comparativo':
        aoa.push(['Item', 'Valor'])
        b.itens.forEach((i) => aoa.push([i.rotulo, i.valor]))
        aoa.push([])
        break
      case 'lista':
        b.itens.forEach((i) => aoa.push([i]))
        aoa.push([])
        break
    }
  }
  if (extras?.citations && extras.citations.length > 0) {
    aoa.push(['Fontes do sistema citadas'])
    extras.citations.slice(0, 20).forEach((c, i) => {
      aoa.push([`[${c.n ?? i + 1}] ${(c.excerpt || '').replace(/\s+/g, ' ').trim().slice(0, 300)}`])
    })
    aoa.push([])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 42 }, { wch: 22 }, { wch: 22 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
  XLSX.writeFile(wb, nomeArquivo || nomeArquivoSeguroRelatorio(meta.titulo, 'xlsx'))
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
