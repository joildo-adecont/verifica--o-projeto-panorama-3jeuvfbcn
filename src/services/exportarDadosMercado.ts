/**
 * SERVIÇO DE EXPORTAÇÃO DE DADOS DE MERCADO
 * Sistema ADECONT — Portal Panorama RT
 *
 * Gera relatórios e arquivos de dados de mercado nos formatos:
 * - CSV (com BOM UTF-8 e delimitador ';' para abertura automática e sem truncamentos no Microsoft Excel pt-BR)
 * - XLSX (planilha nativa formatada com SheetJS / xlsx)
 * - Modelo tabular para pré-visualização e impressão executiva A4 ADECONT
 *
 * Colunas requeridas pela especificação:
 * - Índice
 * - Valor
 * - Unidade
 * - Data do Dado (período de referência)
 * - Fonte (selo real da fonte/rota)
 * - Variação
 * - Status (semáforo amigável em pt-BR: Alta / Baixa / Estável / Indisponível)
 */

import * as XLSX from 'xlsx'
import type { ItemIndiceMercado } from '@/services/dadosMercadoAnalises'
import { formatarValorIndice } from '@/services/dadosMercadoAnalises'

export interface ItemExportacaoMercado {
  indice: string
  codigo: string
  valor: string
  unidade: string
  dataDado: string
  fonte: string
  fonteReal: string
  variacao: string
  status: string
  baseInterna: boolean
  aviso: string
  categoria: string
}

export interface OpcoesExportacaoMercado {
  clienteNome?: string
  clienteDoc?: string
  dataEmissao?: string
  atualizadoEm?: string
}

/**
 * Escapa strings para formato CSV:
 * - Se contiver aspas, ponto-e-vírgula ou quebras de linha, envolve em aspas duplas dobrando aspas internas.
 * - Converte quebras de linha em espaço simples para não quebrar linhas no Excel.
 */
export function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '""'
  const s = String(valor)
    .replace(/"/g, '""')
    .replace(/\r\n|\n|\r/g, ' ')
    .trim()
  return `"${s}"`
}

/**
 * Determina o status textual do semáforo com base na variação e semântica econômica
 */
export function obterStatusSemaforoMercado(ind: ItemIndiceMercado): {
  statusTexto: string
  tipo: 'alta' | 'baixa' | 'estavel' | 'indisponivel'
} {
  const v = ind.variacao
  if (v === null || v === undefined || !Number.isFinite(v)) {
    return { statusTexto: 'Indisponível', tipo: 'indisponivel' }
  }
  if (Math.abs(v) < 0.00001) {
    return { statusTexto: 'Estável', tipo: 'estavel' }
  }
  if (v > 0) {
    return { statusTexto: 'Alta', tipo: 'alta' }
  }
  return { statusTexto: 'Baixa', tipo: 'baixa' }
}

/**
 * Formata a variação absoluta com sinal explícito (+/-) e padrão pt-BR
 */
export function formatarVariacaoMercado(
  variacao: number | null | undefined,
  casasDecimais = 2,
): string {
  if (variacao === null || variacao === undefined || !Number.isFinite(variacao)) {
    return '—'
  }
  if (Math.abs(variacao) < 0.00001) {
    return '0,00'
  }
  const prefixo = variacao > 0 ? '+' : ''
  const valorStr = variacao.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  })
  return `${prefixo}${valorStr}`
}

/**
 * Obtém o selo real da fonte da rota ou fallback seguro, nunca genérico vazio
 */
export function obterFonteRealMercado(ind: ItemIndiceMercado): string {
  if (ind.baseInterna) {
    return 'Base Interna ADECONT'
  }
  if (ind.fonteRota && ind.fonteRota.trim()) {
    return ind.fonteRota.trim()
  }
  if (ind.fonte && ind.fonte.trim()) {
    return ind.fonte.trim()
  }
  return 'Fonte Oficial'
}

/**
 * Mapeia os itens do painel de dados de mercado para o formato tabular padrão
 */
export function prepararLinhasExportacaoMercado(
  indices: ItemIndiceMercado[],
): ItemExportacaoMercado[] {
  if (!indices || indices.length === 0) return []

  return indices.map((ind) => {
    const valorFmt = formatarValorIndice(ind.valorAtual, ind.formato, ind.casasDecimais)
    const { statusTexto } = obterStatusSemaforoMercado(ind)
    const casasVar = ind.casasDecimais > 2 ? 4 : 2
    const varFmt = formatarVariacaoMercado(ind.variacao, casasVar)
    const fonteReal = obterFonteRealMercado(ind)
    const dataDado = ind.periodoFormatado || ind.dataReferencia || '—'

    return {
      indice: ind.nome,
      codigo: ind.codigoCurto,
      valor: valorFmt,
      unidade: ind.unidade || '—',
      dataDado,
      fonte: fonteReal,
      fonteReal,
      variacao: varFmt,
      status: statusTexto,
      baseInterna: !!ind.baseInterna,
      aviso: ind.aviso || '',
      categoria: ind.categoria || 'Geral',
    }
  })
}

/**
 * Gera conteúdo CSV padrão pt-BR (BOM UTF-8, delimitador ';')
 * Colunas: Índice, Valor, Unidade, Data do Dado, Fonte, Variação, Status
 */
export function gerarCsvDadosMercado(
  linhas: ItemExportacaoMercado[],
  opcoes?: OpcoesExportacaoMercado,
): string {
  const colunas = ['Índice', 'Valor', 'Unidade', 'Data do Dado', 'Fonte', 'Variação', 'Status']

  const linhasCsv: string[] = []

  // Metadados informativos no topo com a marca oficial ADECONT
  linhasCsv.push(escaparCampoCsv('ADECONT — Assessoria Contábil e Administrativa'))
  linhasCsv.push(escaparCampoCsv('Relatório de Dados de Mercado & Índices Oficiais'))

  if (opcoes?.clienteNome) {
    linhasCsv.push(
      escaparCampoCsv(
        `Cliente: ${opcoes.clienteNome}${opcoes.clienteDoc ? ` (CNPJ/CPF: ${opcoes.clienteDoc})` : ''}`,
      ),
    )
  }

  const emissao = opcoes?.dataEmissao || new Date().toLocaleDateString('pt-BR')
  linhasCsv.push(escaparCampoCsv(`Data de Emissão: ${emissao}`))

  if (opcoes?.atualizadoEm) {
    linhasCsv.push(escaparCampoCsv(`Última Sincronização do Repositório: ${opcoes.atualizadoEm}`))
  }

  linhasCsv.push('') // Linha em branco separadora
  linhasCsv.push(colunas.map(escaparCampoCsv).join(';'))

  for (const item of linhas) {
    const linha = [
      escaparCampoCsv(item.indice),
      escaparCampoCsv(item.valor),
      escaparCampoCsv(item.unidade),
      escaparCampoCsv(item.dataDado),
      escaparCampoCsv(item.fonte),
      escaparCampoCsv(item.variacao),
      escaparCampoCsv(item.status),
    ]
    linhasCsv.push(linha.join(';'))
  }

  // BOM UTF-8 (\uFEFF) para garantir abertura automática no Microsoft Excel brasileiro
  return '\uFEFF' + linhasCsv.join('\r\n')
}

/**
 * Dispara o download de um arquivo CSV gerado no navegador via Blob temporário.
 */
export function baixarArquivoCsvMercado(conteudoCsv: string, nomeArquivo: string): void {
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Gera e baixa uma planilha Excel (.xlsx) nativa com SheetJS:
 * - Cabeçalho oficial ADECONT
 * - Metadados de emissão e cliente (se houver)
 * - Tabela com colunas: Índice, Valor, Unidade, Data do Dado, Fonte, Variação, Status
 * - Larguras de colunas ajustadas
 */
export function exportarExcelDadosMercado(
  linhas: ItemExportacaoMercado[],
  opcoes?: OpcoesExportacaoMercado,
  nomeArquivo?: string,
): void {
  const dadosAoa: (string | number)[][] = []

  // Bloco de cabeçalho institucional
  dadosAoa.push(['ADECONT — Assessoria Contábil e Administrativa'])
  dadosAoa.push(['Relatório de Dados de Mercado & Índices Oficiais'])

  if (opcoes?.clienteNome) {
    dadosAoa.push([
      `Cliente: ${opcoes.clienteNome}${opcoes.clienteDoc ? ` | CNPJ/CPF: ${opcoes.clienteDoc}` : ''}`,
    ])
  }

  const emissao = opcoes?.dataEmissao || new Date().toLocaleDateString('pt-BR')
  dadosAoa.push([`Emissão: ${emissao}`])

  if (opcoes?.atualizadoEm) {
    dadosAoa.push([`Última sincronização do repositório: ${opcoes.atualizadoEm}`])
  }

  dadosAoa.push([]) // Linha em branco

  // Cabeçalho da tabela
  dadosAoa.push(['Índice', 'Valor', 'Unidade', 'Data do Dado', 'Fonte', 'Variação', 'Status'])

  // Linhas de dados
  for (const item of linhas) {
    dadosAoa.push([
      item.indice,
      item.valor,
      item.unidade,
      item.dataDado,
      item.fonte,
      item.variacao,
      item.status,
    ])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(dadosAoa)

  // Ajusta larguras de coluna
  ws['!cols'] = [
    { wch: 34 }, // Índice
    { wch: 16 }, // Valor
    { wch: 12 }, // Unidade
    { wch: 16 }, // Data do Dado
    { wch: 28 }, // Fonte
    { wch: 14 }, // Variação
    { wch: 14 }, // Status
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Dados de Mercado')

  const nomeFinal =
    nomeArquivo || `ADECONT_Dados_Mercado_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, nomeFinal)
}
