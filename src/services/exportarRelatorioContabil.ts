/**
 * Serviço de Exportação de Relatórios Contábeis
 * Sistema ADECONT — Portal Panorama RT
 *
 * Gera arquivos nos formatos:
 * - CSV (com BOM UTF-8 e delimitador ';' para abertura automática no Excel brasileiro)
 * - XLSX (formato binário Excel nativo via SheetJS)
 *
 * Respeita filtros ativos (grupo, busca, semáforo) e formatação pt-BR dos números.
 */

import * as XLSX from 'xlsx'
import type { ItemIndicador, AnaliseBalanco3Exercicios } from '@/types/analisesEmpresariaisModel'
import { calcular25Indicadores } from '@/services/motorAnaliseEmpresarial'

export interface ItemExportacaoIndicador {
  grupo: string
  indicador: string
  valor: string
  status: string
  anoMenos2: string
  anoMenos1: string
  anoAtual: string
  referencia: string
  formula: string
  diagnostico: string
}

export interface OpcoesExportacaoContabil {
  clienteNome: string
  clienteDoc?: string
  regimeTributario?: string
  dataEmissao?: string
  rotuloMenos2?: string
  rotuloMenos1?: string
  rotuloAtual?: string
}

export const GRUPOS_CONTABEIS_DEFINICAO = [
  {
    id: 'liquidez',
    rotuloCurto: '1. Liquidez',
    ids: ['liq_corrente', 'liq_seca', 'liq_imediata', 'liq_geral', 'ccl'],
  },
  {
    id: 'endividamento',
    rotuloCurto: '2. Endividamento',
    ids: [
      'pct',
      'comp_endividamento',
      'grau_endividamento',
      'divida_liquida',
      'div_liq_ebitda',
      'div_liq_pl',
    ],
  },
  {
    id: 'rentabilidade',
    rotuloCurto: '3. Rentabilidade',
    ids: ['margem_bruta', 'margem_ebitda', 'margem_operacional', 'margem_liquida', 'roa', 'roe'],
  },
  {
    id: 'atividade',
    rotuloCurto: '4. Atividade / Ciclos',
    ids: ['giro_ativo', 'pmr', 'pmp', 'pme', 'ciclo_operacional', 'ciclo_financeiro'],
  },
  {
    id: 'cobertura',
    rotuloCurto: '5. Cobertura / Capex',
    ids: ['dscr', 'capex_receita'],
  },
]

export function obterNomeGrupoIndicador(id: string): string {
  for (const g of GRUPOS_CONTABEIS_DEFINICAO) {
    if (g.ids.includes(id)) {
      return g.rotuloCurto
    }
  }
  return 'Geral'
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
 * Formata valor do indicador para exibição pt-BR:
 * - Moeda: R$ 1.234.567,89
 * - Percentual: 12,34%
 * - Dias: 45d
 * - Índice/Multiplicador: 1,45x
 */
export function formatarValorIndicadorPtBr(
  valor: number | undefined | null,
  unidade?: string,
): string {
  if (valor === undefined || valor === null || isNaN(Number(valor))) return '—'
  const num = Number(valor)

  switch (unidade) {
    case 'moeda':
      return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      })
    case 'percentual':
      return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
    case 'dias':
      return `${Math.round(num).toLocaleString('pt-BR')}d`
    case 'indice':
    default:
      return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`
  }
}

/**
 * Formata o status semafórico para texto amigável em português
 */
export function formatarStatusSemaforo(
  semaforo?: 'saudavel' | 'atencao' | 'critico' | string,
): string {
  switch (semaforo) {
    case 'saudavel':
      return 'Saudável'
    case 'atencao':
      return 'Atenção'
    case 'critico':
      return 'Crítico'
    default:
      return 'Neutro'
  }
}

/**
 * Mapeia a lista de indicadores apurados e o histórico trienal para o formato tabular de exportação
 */
export function prepararLinhasExportacao(
  indicadores: ItemIndicador[],
  balanco3Anos?: AnaliseBalanco3Exercicios,
): ItemExportacaoIndicador[] {
  const indMenos1Map = new Map<string, ItemIndicador>()
  const indMenos2Map = new Map<string, ItemIndicador>()

  if (balanco3Anos?.anoMenos1) {
    const calcMenos1 = calcular25Indicadores(balanco3Anos.anoMenos1)
    for (const item of calcMenos1) {
      indMenos1Map.set(item.id, item)
    }
  }

  if (balanco3Anos?.anoMenos2) {
    const calcMenos2 = calcular25Indicadores(balanco3Anos.anoMenos2)
    for (const item of calcMenos2) {
      indMenos2Map.set(item.id, item)
    }
  }

  return indicadores.map((ind) => {
    const grupo = obterNomeGrupoIndicador(ind.id)
    const indMenos1 = indMenos1Map.get(ind.id)
    const indMenos2 = indMenos2Map.get(ind.id)

    return {
      grupo,
      indicador: ind.nome,
      valor: formatarValorIndicadorPtBr(ind.valor, ind.unidade),
      status: formatarStatusSemaforo(ind.semaforo),
      anoMenos2: indMenos2 ? formatarValorIndicadorPtBr(indMenos2.valor, ind.unidade) : '—',
      anoMenos1: indMenos1 ? formatarValorIndicadorPtBr(indMenos1.valor, ind.unidade) : '—',
      anoAtual: formatarValorIndicadorPtBr(ind.valor, ind.unidade),
      referencia: ind.referencia || '—',
      formula: ind.formula || '—',
      diagnostico: ind.explicacao || '—',
    }
  })
}

/**
 * Gera conteúdo CSV padrão pt-BR (BOM UTF-8, delimitador ';')
 * com colunas: Grupo, Índice, Valor, Status, Ano -2, Ano -1, Ano Atual
 */
export function gerarCsvRelatorioContabil(
  linhas: ItemExportacaoIndicador[],
  opcoes?: OpcoesExportacaoContabil,
): string {
  const rotuloMenos2 = opcoes?.rotuloMenos2 || 'Ano -2'
  const rotuloMenos1 = opcoes?.rotuloMenos1 || 'Ano -1'
  const rotuloAtual = opcoes?.rotuloAtual || 'Ano Atual'

  const colunas = [
    'Grupo',
    'Índice',
    'Valor',
    'Status',
    rotuloMenos2,
    rotuloMenos1,
    rotuloAtual,
    'Meta / Referência',
    'Fórmula',
    'Diagnóstico Executivo',
  ]

  const linhasCsv: string[] = []

  // Metadados informativos no topo (se houver cliente/regime)
  if (opcoes?.clienteNome) {
    linhasCsv.push(
      escaparCampoCsv(
        `ADECONT - Assessoria Contábil e Administrativa - Relatório de Indicadores Contábeis`,
      ),
    )
    linhasCsv.push(
      escaparCampoCsv(
        `Cliente: ${opcoes.clienteNome}${opcoes.clienteDoc ? ` (CNPJ/CPF: ${opcoes.clienteDoc})` : ''}`,
      ),
    )
    if (opcoes.regimeTributario) {
      linhasCsv.push(escaparCampoCsv(`Regime Tributário: ${opcoes.regimeTributario}`))
    }
    linhasCsv.push(
      escaparCampoCsv(
        `Data de Emissão: ${opcoes.dataEmissao || new Date().toLocaleDateString('pt-BR')}`,
      ),
    )
    linhasCsv.push('') // Linha em branco separadora
  }

  linhasCsv.push(colunas.map(escaparCampoCsv).join(';'))

  for (const item of linhas) {
    const linha = [
      escaparCampoCsv(item.grupo),
      escaparCampoCsv(item.indicador),
      escaparCampoCsv(item.valor),
      escaparCampoCsv(item.status),
      escaparCampoCsv(item.anoMenos2),
      escaparCampoCsv(item.anoMenos1),
      escaparCampoCsv(item.anoAtual),
      escaparCampoCsv(item.referencia),
      escaparCampoCsv(item.formula),
      escaparCampoCsv(item.diagnostico),
    ]
    linhasCsv.push(linha.join(';'))
  }

  // BOM UTF-8 (\uFEFF) para garantir abertura automática no Microsoft Excel brasileiro
  return '\uFEFF' + linhasCsv.join('\r\n')
}

/**
 * Dispara o download de um arquivo CSV gerado no navegador via Blob temporário.
 */
export function baixarArquivoCsv(conteudoCsv: string, nomeArquivo: string): void {
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
 * Gera e baixa uma planilha Excel (.xlsx) nativa contendo:
 * - Cabeçalho com marca ADECONT e dados da empresa
 * - Tabela completa dos índices filtrados
 */
export function exportarExcelRelatorioContabil(
  linhas: ItemExportacaoIndicador[],
  opcoes?: OpcoesExportacaoContabil,
  nomeArquivo?: string,
): void {
  const rotuloMenos2 = opcoes?.rotuloMenos2 || 'Ano -2'
  const rotuloMenos1 = opcoes?.rotuloMenos1 || 'Ano -1'
  const rotuloAtual = opcoes?.rotuloAtual || 'Ano Atual'

  const dadosAoa: (string | number)[][] = []

  // Bloco de cabeçalho
  dadosAoa.push(['ADECONT — Assessoria Contábil e Administrativa'])
  dadosAoa.push(['Relatório de Indicadores Contábeis e Financeiros'])
  if (opcoes?.clienteNome) {
    dadosAoa.push([
      `Cliente: ${opcoes.clienteNome}${opcoes.clienteDoc ? ` | CNPJ/CPF: ${opcoes.clienteDoc}` : ''}`,
    ])
  }
  if (opcoes?.regimeTributario) {
    dadosAoa.push([`Regime Tributário: ${opcoes.regimeTributario}`])
  }
  dadosAoa.push([`Emissão: ${opcoes?.dataEmissao || new Date().toLocaleDateString('pt-BR')}`])
  dadosAoa.push([]) // Linha em branco

  // Cabeçalho da tabela
  dadosAoa.push([
    'Grupo',
    'Índice',
    'Valor',
    'Status',
    rotuloMenos2,
    rotuloMenos1,
    rotuloAtual,
    'Meta / Referência',
    'Fórmula',
    'Diagnóstico Executivo',
  ])

  // Linhas de dados
  for (const item of linhas) {
    dadosAoa.push([
      item.grupo,
      item.indicador,
      item.valor,
      item.status,
      item.anoMenos2,
      item.anoMenos1,
      item.anoAtual,
      item.referencia,
      item.formula,
      item.diagnostico,
    ])
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(dadosAoa)

  // Ajusta larguras de coluna para boa apresentação
  ws['!cols'] = [
    { wch: 20 }, // Grupo
    { wch: 32 }, // Índice
    { wch: 14 }, // Valor
    { wch: 12 }, // Status
    { wch: 14 }, // Ano -2
    { wch: 14 }, // Ano -1
    { wch: 14 }, // Ano Atual
    { wch: 20 }, // Meta / Referência
    { wch: 28 }, // Fórmula
    { wch: 45 }, // Diagnóstico
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Indicadores')

  const nomeFinal =
    nomeArquivo || `ADECONT_Relatorio_Contabil_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, nomeFinal)
}
