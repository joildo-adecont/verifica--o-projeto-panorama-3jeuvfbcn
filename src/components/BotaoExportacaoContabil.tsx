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
import {
  Download,
  FileText,
  FileSpreadsheet,
  Table,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import type {
  ItemIndicador,
  AnaliseBalanco3Exercicios,
  ParecerFinalAnalise,
} from '@/types/analisesEmpresariaisModel'
import type { RelatorioIndicesAvancados } from '@/services/indicesAvancadosEmpresariais'
import type { ConfiguracaoRelatorioCustomizado } from '@/types/customizacaoRelatorio'
import {
  prepararLinhasExportacao,
  gerarCsvRelatorioContabil,
  baixarArquivoCsv,
  exportarExcelRelatorioContabil,
  type OpcoesExportacaoContabil,
} from '@/services/exportarRelatorioContabil'
import { ModalCustomizacaoRelatorio } from './ModalCustomizacaoRelatorio'

interface BotaoExportacaoContabilProps {
  indicadores: ItemIndicador[]
  clienteNome: string
  clienteDoc?: string
  regimeTributario?: string
  balanco3Anos?: AnaliseBalanco3Exercicios
  onAbrirRelatorioPdf?: (custom?: ConfiguracaoRelatorioCustomizado) => void
  disabled?: boolean
  motivoDesabilitado?: string
  className?: string
  rotuloBotao?: string
  relatorioAvancado?: RelatorioIndicesAvancados | null
  parecerFinal?: ParecerFinalAnalise | null
  customizacaoAtual?: ConfiguracaoRelatorioCustomizado | null
  onCustomizacaoAlterada?: (novaConfig: ConfiguracaoRelatorioCustomizado) => void
}

export const BotaoExportacaoContabil: React.FC<BotaoExportacaoContabilProps> = ({
  indicadores,
  clienteNome,
  clienteDoc,
  regimeTributario,
  balanco3Anos,
  onAbrirRelatorioPdf,
  disabled = false,
  motivoDesabilitado = 'Nenhum indicador contábil apurado para exportar',
  className = '',
  rotuloBotao = 'Exportar',
  relatorioAvancado,
  parecerFinal,
  customizacaoAtual,
  onCustomizacaoAlterada,
}) => {
  const [exportando, setExportando] = useState<string | null>(null)
  const [modalCustomizacaoAberto, setModalCustomizacaoAberto] = useState(false)
  const [formatoAposCustomizacao, setFormatoAposCustomizacao] = useState<
    'pdf' | 'xlsx' | 'csv' | null
  >(null)

  const semDados = disabled || !indicadores || indicadores.length === 0
  const tooltipTexto = semDados
    ? motivoDesabilitado
    : 'Exportar relatório contábil em PDF, Excel ou CSV'

  const construirOpcoes = (
    config?: ConfiguracaoRelatorioCustomizado | null,
  ): OpcoesExportacaoContabil => {
    const cfg = config ?? customizacaoAtual
    const incluirAvancados = cfg?.secoes?.modelosAvancados ?? true
    const incluirClassicos = cfg?.secoes?.indicesClassicos ?? true

    return {
      clienteNome,
      clienteDoc,
      regimeTributario,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      rotuloMenos2: balanco3Anos?.anoMenos2?.rotulo || 'Ano -2',
      rotuloMenos1: balanco3Anos?.anoMenos1?.rotulo || 'Ano -1',
      rotuloAtual: balanco3Anos?.anoAtual?.rotulo || 'Ano Atual',
      incluirIndicesAvancados: incluirAvancados,
      incluirIndicesClassicos: incluirClassicos,
      relatorioAvancado,
      parecerFinal,
      customizacao: cfg || undefined,
    }
  }

  const sanitizarNome = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30)

  const prefixoArquivo = `ADECONT_${sanitizarNome(clienteNome || 'Cliente')}_Indicadores_${new Date().toISOString().slice(0, 10)}`

  const executarExportacaoCsv = (cfg?: ConfiguracaoRelatorioCustomizado | null) => {
    if (semDados) return
    try {
      setExportando('csv')
      const opcoesFinal = construirOpcoes(cfg)
      const linhas = prepararLinhasExportacao(indicadores, balanco3Anos, {
        incluirIndicesAvancados: opcoesFinal.incluirIndicesAvancados,
        incluirIndicesClassicos: opcoesFinal.incluirIndicesClassicos,
        relatorioAvancado,
      })
      const conteudoCsv = gerarCsvRelatorioContabil(linhas, opcoesFinal)
      baixarArquivoCsv(conteudoCsv, `${prefixoArquivo}.csv`)
    } finally {
      setExportando(null)
    }
  }

  const executarExportacaoExcel = (cfg?: ConfiguracaoRelatorioCustomizado | null) => {
    if (semDados) return
    try {
      setExportando('xlsx')
      const opcoesFinal = construirOpcoes(cfg)
      const linhas = prepararLinhasExportacao(indicadores, balanco3Anos, {
        incluirIndicesAvancados: opcoesFinal.incluirIndicesAvancados,
        incluirIndicesClassicos: opcoesFinal.incluirIndicesClassicos,
        relatorioAvancado,
      })
      exportarExcelRelatorioContabil(linhas, opcoesFinal, `${prefixoArquivo}.xlsx`)
    } finally {
      setExportando(null)
    }
  }

  const executarExportacaoPdf = (cfg?: ConfiguracaoRelatorioCustomizado | null) => {
    if (semDados) return
    const cfgEfetiva = cfg ?? customizacaoAtual ?? undefined
    if (onAbrirRelatorioPdf) {
      onAbrirRelatorioPdf(cfgEfetiva)
    } else {
      window.print()
    }
  }

  const handleExportarCsv = () => executarExportacaoCsv()
  const handleExportarExcel = () => executarExportacaoExcel()
  const handleExportarPdf = () => executarExportacaoPdf()

  const handleAbrirCustomizacao = (formatoAlvo?: 'pdf' | 'xlsx' | 'csv') => {
    setFormatoAposCustomizacao(formatoAlvo || null)
    setModalCustomizacaoAberto(true)
  }

  const handleAplicarEExportar = (
    config: ConfiguracaoRelatorioCustomizado,
    formato?: 'pdf' | 'xlsx' | 'csv',
  ) => {
    onCustomizacaoAlterada?.(config)
    const formatoFinal = formato || formatoAposCustomizacao
    if (formatoFinal === 'pdf') {
      executarExportacaoPdf(config)
    } else if (formatoFinal === 'xlsx') {
      executarExportacaoExcel(config)
    } else if (formatoFinal === 'csv') {
      executarExportacaoCsv(config)
    }
    setFormatoAposCustomizacao(null)
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
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
      ) : (
        <Download className="w-3.5 h-3.5 text-primary" />
      )}
      <span>{rotuloBotao}</span>
      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
        {indicadores?.length || 0}
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
          Exportar Relatório Contábil
        </DropdownMenuLabel>
        <div className="px-2 py-1 text-[11px] text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
          {indicadores.length} indicador(es) selecionado(s)
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
            <p className="text-[10px] text-slate-500">Relatório executivo padrão A4 ADECONT</p>
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
            <p className="text-[10px] text-slate-500">BOM UTF-8 e separador &quot;;&quot; direto</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => handleAbrirCustomizacao()}
          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40 my-0.5"
        >
          <div className="w-7 h-7 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
              Personalizar relatório...
            </p>
            <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
              Selecione seções, título e observações
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />
        <p className="text-[9px] text-slate-400 px-2 py-0.5 text-center">
          Respeita filtros de busca, grupos ativos e customizações salvas
        </p>
      </DropdownMenuContent>

      <ModalCustomizacaoRelatorio
        aberto={modalCustomizacaoAberto}
        onFechar={() => {
          setModalCustomizacaoAberto(false)
          setFormatoAposCustomizacao(null)
        }}
        clienteCnpj={clienteDoc}
        clienteNome={clienteNome}
        configInicial={customizacaoAtual}
        onSalvarConfig={(novaCfg) => {
          onCustomizacaoAlterada?.(novaCfg)
        }}
        onAplicarEExportar={handleAplicarEExportar}
      />
    </DropdownMenu>
  )
}

export default BotaoExportacaoContabil
