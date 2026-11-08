/**
 * SERVIÇO DE EXPORTAÇÃO — INDICADORES ECONÔMICOS SETORIAIS (ADECONT)
 *
 * Segue o padrão de exportarDadosMercado.ts: CSV com BOM UTF-8 e delimitador ';'
 * (Excel brasileiro), planilha .xlsx nativa com SheetJS e modelo tabular para
 * pré-visualização/execução A4. Colunas: Índice, Valor, Unidade, Data do Dado,
 * Fonte, Variação e Status — com agrupamento por setor na ordem canônica.
 */

import * as XLSX from 'xlsx'
import {
  ROTULO_SETOR,
  ORDEM_SETOR,
  formatarValorSetorial,
  obterStatusSemaforoSetorial,
  type ItemIndicadorSetorial,
} from './indicadoresSetoriais'
import { formatarVariacaoMercado, type ItemExportacaoMercado } from './exportarDadosMercado'
import { escaparCampoCsv } from './exportarDadosMercado'

export const COLUNAS_EXPORTACAO_SETORIAL = [
  'Índice',
  'Valor',
  'Unidade',
  'Data do Dado',
  'Fonte',
  'Variação',
  'Status',
] as const

/** Prepara as linhas tabulares padrão ADECONT a partir dos itens setoriais. */
export function prepararLinhasExportacaoSetorial(
  itens: ItemIndicadorSetorial[],
): ItemExportacaoMercado[] {
  if (!itens || itens.length === 0) return []

  const ordenados = [...itens].sort((a, b) => {
    const oa = ORDEM_SETOR.indexOf(a.setor)
    const ob = ORDEM_SETOR.indexOf(b.setor)
    if (oa !== ob) return oa - ob
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })

  return ordenados.map((ind) => {
    const valorFmt = formatarValorSetorial(ind.valorAtual, ind.formato, ind.casasDecimais)
    const { statusTexto } = obterStatusSemaforoSetorial(ind.variacao)
    const casasVar = ind.casasDecimais > 2 ? 4 : 2
    const varFmt = formatarVariacaoMercado(ind.variacao, casasVar)
    const fonteReal = ind.baseInterna
      ? 'Base Interna ADECONT'
      : ind.fonteRota?.trim() || ind.fonte?.trim() || 'Fonte Oficial'
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
      categoria: ROTULO_SETOR[ind.setor],
    }
  })
}

export interface OpcoesExportacaoSetorial {
  clienteNome?: string
  clienteDoc?: string
  dataEmissao?: string
  atualizadoEm?: string
}

/**
 * Gera conteúdo CSV padrão pt-BR (BOM UTF-8, delimitador ';') para os indicadores setoriais.
 */
export function gerarCsvIndicadoresSetoriais(
  linhas: ItemExportacaoMercado[],
  opcoes?: OpcoesExportacaoSetorial,
): string {
  const partes: string[] = []
  partes.push(escaparCampoCsv('ADECONT — Assessoria Contábil e Administrativa'))
  partes.push(escaparCampoCsv('Relatório de Indicadores Econômicos Setoriais'))

  if (opcoes?.clienteNome) {
    partes.push(
      escaparCampoCsv(
        `Cliente: ${opcoes.clienteNome}${opcoes.clienteDoc ? ` (CNPJ/CPF: ${opcoes.clienteDoc})` : ''}`,
      ),
    )
  }

  const emissao = opcoes?.dataEmissao || new Date().toLocaleDateString('pt-BR')
  partes.push(escaparCampoCsv(`Data de Emissão: ${emissao}`))

  if (opcoes?.atualizadoEm) {
    partes.push(escaparCampoCsv(`Última Sincronização do Repositório: ${opcoes.atualizadoEm}`))
  }

  partes.push('')
  partes.push(COLUNAS_EXPORTACAO_SETORIAL.map(escaparCampoCsv).join(';'))

  for (const item of linhas) {
    partes.push(
      [
        escaparCampoCsv(item.indice),
        escaparCampoCsv(item.valor),
        escaparCampoCsv(item.unidade),
        escaparCampoCsv(item.dataDado),
        escaparCampoCsv(item.fonte),
        escaparCampoCsv(item.variacao),
        escaparCampoCsv(item.status),
      ].join(';'),
    )
  }

  // BOM UTF-8 para abertura automática no Microsoft Excel brasileiro
  return '\uFEFF' + partes.join('\r\n')
}

/** Dispara o download do CSV via Blob temporário. */
export function baixarArquivoCsvSetorial(conteudoCsv: string, nomeArquivo: string): void {
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
 * Gera e baixa a planilha Excel (.xlsx) nativa com SheetJS, incluindo o cabeçalho
 * institucional ADECONT e a tabela completa de indicadores setoriais.
 */
export function exportarExcelIndicadoresSetoriais(
  linhas: ItemExportacaoMercado[],
  opcoes?: OpcoesExportacaoSetorial,
  nomeArquivo?: string,
): void {
  const dadosAoa: (string | number)[][] = []

  dadosAoa.push(['ADECONT — Assessoria Contábil e Administrativa'])
  dadosAoa.push(['Relatório de Indicadores Econômicos Setoriais'])

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

  dadosAoa.push([])
  dadosAoa.push([...COLUNAS_EXPORTACAO_SETORIAL])

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

  ws['!cols'] = [
    { wch: 36 }, // Índice
    { wch: 16 }, // Valor
    { wch: 12 }, // Unidade
    { wch: 16 }, // Data do Dado
    { wch: 30 }, // Fonte
    { wch: 14 }, // Variação
    { wch: 14 }, // Status
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Indicadores Setoriais')

  const nomeFinal =
    nomeArquivo || `ADECONT_Indicadores_Setoriais_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, nomeFinal)
}
