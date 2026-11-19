/**
 * BARRA DE EXPORTAÇÃO DOS RELATÓRIOS DOS AGENTES — PDF · TXT · CSV · XLSX
 * Sistema ADECONT — Projeto Panorama
 *
 * Aparece em todo relatório exibido (tela do agente e Central de Entregas).
 * PDF abre a impressão paisagem (padrão A4 do sistema); TXT/CSV baixam arquivos;
 * XLSX gera planilha nativa via SheetJS. Cada exportação registra a entrega na
 * Central de Entregas (coleção entregas_agentes).
 */
import { useState } from 'react'
import { FileDown, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  baixarTextoRelatorio,
  blocosParaCsv,
  blocosParaTexto,
  blocosParaXlsx,
  nomeArquivoSeguroRelatorio,
  type MetaExportacaoRelatorio,
} from '@/services/exportarRelatorioAgente'
import { imprimirRelatorioAgente } from '@/services/imprimirRelatorioAgente'
import { registrarEntrega } from '@/services/centralEntregas'
import { parseBlocosRelatorio, type BlocoRelatorio } from '@/services/relatorioAgenteParser'
import type { SegmentoEspecialista } from '@/services/agenteEspecialista'

export interface BarraExportacaoRelatorioProps {
  /** blocos já parseados — ou o markdown cru (parseado aqui dentro) */
  blocos?: BlocoRelatorio[]
  markdown?: string
  meta: MetaExportacaoRelatorio
  agenteSegmento: SegmentoEspecialista
  perguntaOrigem?: string
  /** citações das fontes externas usadas pelo agente (vão para o rodapé do PDF/TXT/CSV) */
  citations?: import('@/lib/skipAi').AgentCitation[]
  /** Central de Entregas já registrou a entrega — evita duplicar */
  entregaJaRegistrada?: boolean
}

export function BarraExportacaoRelatorio({
  blocos,
  markdown,
  meta,
  agenteSegmento,
  perguntaOrigem,
  citations,
  entregaJaRegistrada = false,
}: BarraExportacaoRelatorioProps) {
  const { toast } = useToast()
  const [registrando, setRegistrando] = useState(false)

  const blocosResolvidos = blocos ?? parseBlocosRelatorio(markdown || '')
  const extras = { pergunta: perguntaOrigem, citations }

  async function exportar(formato: 'pdf' | 'txt' | 'csv' | 'xlsx') {
    if (blocosResolvidos.length === 0) {
      toast({
        title: 'Nada para exportar',
        description: 'O relatório está vazio.',
        variant: 'destructive',
      })
      return
    }
    try {
      if (formato === 'pdf') {
        imprimirRelatorioAgente({
          meta: { ...meta, pergunta: perguntaOrigem },
          blocos: blocosResolvidos,
          citations,
        })
      } else if (formato === 'txt') {
        baixarTextoRelatorio(
          blocosParaTexto(blocosResolvidos, meta, extras),
          nomeArquivoSeguroRelatorio(meta.titulo, 'txt'),
        )
      } else if (formato === 'csv') {
        baixarTextoRelatorio(
          blocosParaCsv(blocosResolvidos, meta, extras),
          nomeArquivoSeguroRelatorio(meta.titulo, 'csv'),
        )
      } else {
        blocosParaXlsx(blocosResolvidos, meta, undefined, extras)
      }
    } catch (e) {
      console.warn('[BarraExportacaoRelatorio] falha ao exportar:', e)
      toast({ title: 'Falha na exportação', description: String(e), variant: 'destructive' })
      return
    }

    if (!entregaJaRegistrada) {
      setRegistrando(true)
      const entrega = await registrarEntrega({
        agenteSegmento,
        agenteNome: meta.agente,
        titulo: meta.titulo,
        tipoConteudo: formato.toUpperCase(),
        blocos: blocosResolvidos,
        perguntaOrigem,
      })
      setRegistrando(false)
      toast({
        title: entrega ? 'Relatório exportado' : 'Relatório exportado (entrega não registrada)',
        description: entrega
          ? `Registrado na Central de Entregas como ${formato.toUpperCase()}.`
          : 'Não foi possível registrar na Central de Entregas agora.',
        variant: entrega ? 'default' : 'destructive',
      })
    }
  }

  return (
    <div className="nao-imprimir flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Exportar relatório
      </span>
      <Button size="sm" variant="outline" onClick={() => exportar('pdf')}>
        <Printer className="mr-1 h-3.5 w-3.5" /> PDF
      </Button>
      <Button size="sm" variant="outline" onClick={() => exportar('txt')}>
        <FileText className="mr-1 h-3.5 w-3.5" /> TXT
      </Button>
      <Button size="sm" variant="outline" onClick={() => exportar('csv')}>
        <FileDown className="mr-1 h-3.5 w-3.5" /> CSV
      </Button>
      <Button size="sm" variant="outline" onClick={() => exportar('xlsx')}>
        <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> XLSX
      </Button>
      {registrando && (
        <span className="text-[11px] text-slate-400">registrando na Central de Entregas…</span>
      )}
    </div>
  )
}
