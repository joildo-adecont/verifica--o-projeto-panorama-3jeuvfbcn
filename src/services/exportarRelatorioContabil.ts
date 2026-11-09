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
import type {
  ItemIndicador,
  AnaliseBalanco3Exercicios,
  ParecerFinalAnalise,
} from '@/types/analisesEmpresariaisModel'
import { calcular25Indicadores } from '@/services/motorAnaliseEmpresarial'
import {
  calcularTodosIndicesAvancados,
  type ItemIndiceAvancado,
  type RelatorioIndicesAvancados,
} from '@/services/indicesAvancadosEmpresariais'

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
  incluirIndicesAvancados?: boolean
  relatorioAvancado?: RelatorioIndicesAvancados | null
  parecerFinal?: ParecerFinalAnalise | null
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
    case 'fator':
    default:
      return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}x`
  }
}

/**
 * Converte um ItemIndiceAvancado em ItemExportacaoIndicador compatível com a planilha
 */
export function converterIndiceAvancadoParaExportacao(
  adv: ItemIndiceAvancado,
  indMenos2?: ItemIndiceAvancado,
  indMenos1?: ItemIndiceAvancado,
): ItemExportacaoIndicador {
  const formatarValor = (item?: ItemIndiceAvancado) => {
    if (!item) return '—'
    return item.valorFormatado || formatarValorIndicadorPtBr(item.valor, item.unidade)
  }

  return {
    grupo: `Avançado · ${adv.grupoTitulo}`,
    indicador: adv.sigla ? `${adv.sigla} - ${adv.nome}` : adv.nome,
    valor: adv.valorFormatado || formatarValorIndicadorPtBr(adv.valor, adv.unidade),
    status: formatarStatusSemaforo(adv.semaforo),
    anoMenos2: formatarValor(indMenos2),
    anoMenos1: formatarValor(indMenos1),
    anoAtual: adv.valorFormatado || formatarValorIndicadorPtBr(adv.valor, adv.unidade),
    referencia: adv.referencia || '—',
    formula: adv.formula
      ? `${adv.formula} (${adv.fonteLegalAcademica || 'Referência Acadêmica'})`
      : '—',
    diagnostico: adv.faixaInterpretada
      ? `${adv.faixaInterpretada}. ${adv.explicacao || ''}`.trim()
      : adv.explicacao || '—',
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
  opcoes?: {
    incluirIndicesAvancados?: boolean
    relatorioAvancado?: RelatorioIndicesAvancados | null
  },
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

  const linhasClassicas: ItemExportacaoIndicador[] = indicadores.map((ind) => {
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

  // Se solicitado ou se houver balanço / relatório avançado disponível, inclui os índices avançados
  const incluirAvancados =
    opcoes?.incluirIndicesAvancados ??
    (Boolean(opcoes?.relatorioAvancado) || Boolean(balanco3Anos?.anoAtual))

  if (!incluirAvancados) {
    return linhasClassicas
  }

  let relAtual: RelatorioIndicesAvancados | null = opcoes?.relatorioAvancado || null
  if (!relAtual && balanco3Anos?.anoAtual) {
    try {
      relAtual = calcularTodosIndicesAvancados(balanco3Anos.anoAtual)
    } catch {
      relAtual = null
    }
  }

  if (!relAtual || !relAtual.indices || relAtual.indices.length === 0) {
    return linhasClassicas
  }

  // Mapas trienais para índices avançados se houver anoMenos1 e anoMenos2
  const advMenos1Map = new Map<string, ItemIndiceAvancado>()
  const advMenos2Map = new Map<string, ItemIndiceAvancado>()

  if (balanco3Anos?.anoMenos1) {
    try {
      const r1 = calcularTodosIndicesAvancados(balanco3Anos.anoMenos1)
      for (const i of r1.indices) {
        advMenos1Map.set(i.id, i)
      }
    } catch {
      // Ignora erro
    }
  }

  if (balanco3Anos?.anoMenos2) {
    try {
      const r2 = calcularTodosIndicesAvancados(balanco3Anos.anoMenos2)
      for (const i of r2.indices) {
        advMenos2Map.set(i.id, i)
      }
    } catch {
      // Ignora erro
    }
  }

  const linhasAvancadas: ItemExportacaoIndicador[] = relAtual.indices.map((adv) =>
    converterIndiceAvancadoParaExportacao(adv, advMenos2Map.get(adv.id), advMenos1Map.get(adv.id)),
  )

  return [...linhasClassicas, ...linhasAvancadas]
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

  // Seção de parecer e notas do cliente no CSV
  if (opcoes?.parecerFinal) {
    const pf = opcoes.parecerFinal
    linhasCsv.push('')
    linhasCsv.push(escaparCampoCsv('=== PARECER TÉCNICO & NOTAS DO CLIENTE ==='))
    if (pf.nivelOpiniao) {
      linhasCsv.push(`${escaparCampoCsv('Nível da Opinião:')};${escaparCampoCsv(pf.nivelOpiniao)}`)
    }
    if (pf.recomendacaoCredito) {
      linhasCsv.push(
        `${escaparCampoCsv('Recomendação de Crédito:')};${escaparCampoCsv(pf.recomendacaoCredito)}`,
      )
    }
    if (pf.responsavelTecnico) {
      linhasCsv.push(
        `${escaparCampoCsv('Responsável Técnico:')};${escaparCampoCsv(pf.responsavelTecnico)}`,
      )
    }
    if (pf.conclusao) {
      linhasCsv.push(`${escaparCampoCsv('Conclusão Técnica:')};${escaparCampoCsv(pf.conclusao)}`)
    }
    if (pf.pontosFortes) {
      linhasCsv.push(`${escaparCampoCsv('Pontos Fortes:')};${escaparCampoCsv(pf.pontosFortes)}`)
    }
    if (pf.pontosAtencao) {
      linhasCsv.push(
        `${escaparCampoCsv('Pontos de Atenção:')};${escaparCampoCsv(pf.pontosAtencao)}`,
      )
    }
    if (pf.achadosCriticos) {
      linhasCsv.push(
        `${escaparCampoCsv('Achados Críticos / Notas:')};${escaparCampoCsv(pf.achadosCriticos)}`,
      )
    }
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

  // Seção de parecer técnico e notas do cliente
  if (opcoes?.parecerFinal) {
    const pf = opcoes.parecerFinal
    dadosAoa.push([])
    dadosAoa.push(['=== PARECER TÉCNICO & NOTAS DO CLIENTE ==='])
    if (pf.nivelOpiniao) {
      dadosAoa.push(['Nível da Opinião:', pf.nivelOpiniao])
    }
    if (pf.recomendacaoCredito) {
      dadosAoa.push(['Recomendação de Crédito:', pf.recomendacaoCredito])
    }
    if (pf.responsavelTecnico) {
      dadosAoa.push(['Responsável Técnico:', pf.responsavelTecnico])
    }
    if (pf.conclusao) {
      dadosAoa.push(['Conclusão Técnica:', pf.conclusao])
    }
    if (pf.pontosFortes) {
      dadosAoa.push(['Pontos Fortes:', pf.pontosFortes])
    }
    if (pf.pontosAtencao) {
      dadosAoa.push(['Pontos de Atenção:', pf.pontosAtencao])
    }
    if (pf.achadosCriticos) {
      dadosAoa.push(['Achados Críticos / Notas:', pf.achadosCriticos])
    }
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
