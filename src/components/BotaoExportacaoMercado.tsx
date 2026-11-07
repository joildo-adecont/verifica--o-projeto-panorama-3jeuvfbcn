/**
 * BOTÃO DE EXPORTAÇÃO DE DADOS DE MERCADO (ADECONT)
 *
 * Menu suspenso com opções de exportação:
 * - PDF / Imprimir (A4) com marca ADECONT e pré-visualização completa
 * - Excel (.xlsx) nativo com SheetJS e formatação pt-BR
 * - CSV com BOM UTF-8 e delimitador ';' para o Microsoft Excel brasileiro
 *
 * Respeita o estado do painel (desabilita com tooltip explicativo caso não existam índices carregados).
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Download, FileText, FileSpreadsheet, Table, Loader2 } from 'lucide-react'
import type { ItemIndiceMercado } from '@/services/dadosMercadoAnalises'
import {
  prepararLinhasExportacaoMercado,
  gerarCsvDadosMercado,
  baixarArquivoCsvMercado,
  exportarExcelDadosMercado,
  type OpcoesExportacaoMercado,
} from '@/services/exportarDadosMercado'

interface BotaoExportacaoMercadoProps {
  indices: ItemIndiceMercado[]
  clienteNome?: string
  clienteDoc?: string
  atualizadoEm?: string
  onAbrirRelatorioPdf?: () => void
  disabled?: boolean
  motivoDesabilitado?: string
  className?: string
  rotuloBotao?: string
}

export const BotaoExportacaoMercado: React.FC<BotaoExportacaoMercadoProps> = ({
  indices,
  clienteNome,
  clienteDoc,
  atualizadoEm,
  onAbrirRelatorioPdf,
  disabled = false,
  motivoDesabilitado = 'Nenhum índice de mercado carregado para exportar',
  className = '',
  rotuloBotao = 'Exportar',
}) => {
  const [exportando, setExportando] = useState<string | null>(null)

  const semDados = disabled || !indices || indices.length === 0
  const tooltipTexto = semDados
    ? motivoDesabilitado
    : 'Exportar cotações e índices de mercado em PDF, Excel ou CSV'

  const opcoes: OpcoesExportacaoMercado = {
    clienteNome,
    clienteDoc,
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    atualizadoEm,
  }

  const sanitizarNome = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30)

  const sufixoCliente = clienteNome ? `_${sanitizarNome(clienteNome)}` : ''
  const prefixoArquivo = `ADECONT_Dados_Mercado${sufixoCliente}_${new Date().toISOString().slice(0, 10)}`

  const handleExportarCsv = () => {
    if (semDados) return
    try {
      setExportando('csv')
      const linhas = prepararLinhasExportacaoMercado(indices)
      const conteudoCsv = gerarCsvDadosMercado(linhas, opcoes)
      baixarArquivoCsvMercado(conteudoCsv, `${prefixoArquivo}.csv`)
    } finally {
      setExportando(null)
    }
  }

  const handleExportarExcel = () => {
    if (semDados) return
    try {
      setExportando('xlsx')
      const linhas = prepararLinhasExportacaoMercado(indices)
      exportarExcelDadosMercado(linhas, opcoes, `${prefixoArquivo}.xlsx`)
    } finally {
      setExportando(null)
    }
  }

  const handleExportarPdf = () => {
    if (semDados) return
    if (onAbrirRelatorioPdf) {
      onAbrirRelatorioPdf()
    } else {
      window.print()
    }
  }

  const botaoTrigger = (
    <Button
      variant="outline"
      size="sm"
      disabled={semDados}
      className={`h-8 gap-2 font-medium text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs ${className} ${
        semDados ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {exportando ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      )}
      <span>{rotuloBotao}</span>
      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
        {indices?.length || 0}
      </span>
    </Button>
  )

  if (semDados) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-not-allowed">{botaoTrigger}</span>
          </TooltipTrigger>
          <TooltipContent className="text-xs max-w-xs bg-slate-900 text-white p-2">
            <p className="font-semibold">Exportação Indisponível</p>
            <p className="text-slate-300 text-[11px] mt-0.5">{tooltipTexto}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{botaoTrigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-1.5 bg-white dark:bg-slate-900 shadow-xl border-slate-200 dark:border-slate-800"
      >
        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
          Exportar Dados de Mercado
        </DropdownMenuLabel>
        <div className="px-2 py-1 text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
          {indices.length} índice(s) de mercado carregado(s)
        </div>

        <DropdownMenuItem
          onClick={handleExportarPdf}
          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100"
        >
          <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              PDF / Imprimir (A4)
            </p>
            <p className="text-[10px] text-slate-500">Relatório executivo A4 padrão ADECONT</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportarExcel}
          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100"
        >
          <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Excel (.xlsx)
            </p>
            <p className="text-[10px] text-slate-500">Planilha nativa com formatação pt-BR</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleExportarCsv}
          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100"
        >
          <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Table className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              CSV (Excel Brasil)
            </p>
            <p className="text-[10px] text-slate-500">
              BOM UTF-8 e delimitador &quot;;&quot; direto
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />
        <p className="text-[9px] text-slate-400 px-2 py-0.5 text-center">
          Exporta cotações oficiais e selos de fonte ativos
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default BotaoExportacaoMercado
