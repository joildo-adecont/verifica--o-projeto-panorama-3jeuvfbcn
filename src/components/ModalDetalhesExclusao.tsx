import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import type { NormExclusionHistoryItem } from '@/types/panorama'
import {
  Calendar,
  ExternalLink,
  Ban,
  FileX,
  AlertTriangle,
  Info,
  ShieldCheck,
  Building,
} from 'lucide-react'

export interface ModalDetalhesExclusaoProps {
  exclusaoSelecionada: NormExclusionHistoryItem | null
  aberto: boolean
  aoFechar: () => void
}

export const ModalDetalhesExclusao: React.FC<ModalDetalhesExclusaoProps> = ({
  exclusaoSelecionada,
  aberto,
  aoFechar,
}) => {
  if (!exclusaoSelecionada) return null

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            <AdecontLogo variant="color" className="h-7 w-auto" />
            <SeloNivelConfianca
              tier={exclusaoSelecionada.confidence_tier}
              fonte={exclusaoSelecionada.source_org}
              compacto
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 flex items-center gap-1">
                <Ban className="h-3 w-3" />
                {exclusaoSelecionada.norm_type || 'Exclusão Legislativa'}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Segmento: {exclusaoSelecionada.segment}
              </span>
              {exclusaoSelecionada.revoked_article && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  Dispositivo: {exclusaoSelecionada.revoked_article}
                </span>
              )}
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {exclusaoSelecionada.norm_code}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              {exclusaoSelecionada.norm_title}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Card de Informações Gerais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Data do Evento
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {exclusaoSelecionada.exclusion_date}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Órgão Emissor / Fonte
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {exclusaoSelecionada.source_org}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Origem do Registro
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {exclusaoSelecionada.record_origin === 'rotina_semanal'
                  ? 'Rotina Semanal (Cron)'
                  : exclusaoSelecionada.record_origin === 'backfill_inicial'
                    ? 'Carga Inicial Compilada'
                    : 'Registro Manual'}
              </div>
            </div>
          </div>

          {/* Motivo e Fundamentação */}
          <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wide text-rose-800 dark:text-rose-300">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              Motivo e Justificativa da Exclusão / Revogação
            </div>
            <p className="whitespace-pre-line leading-relaxed text-xs">
              {exclusaoSelecionada.reason_description}
            </p>
          </div>

          {/* Contexto do Antes: Redação Anterior Revogada */}
          {exclusaoSelecionada.previous_content ? (
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileX className="h-3.5 w-3.5 text-slate-500" />
                  Redação Anterior Revogada (O que existia e foi retirado)
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                  Revogado / Ineficaz
                </span>
              </div>
              <p className="whitespace-pre-line text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-100 dark:border-slate-800 font-mono text-[11px] leading-relaxed">
                {exclusaoSelecionada.previous_content}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Ato revogatório sem transcrição literal de texto anterior anexada.</span>
            </div>
          )}

          {/* Notas Adicionais */}
          {exclusaoSelecionada.notes && (
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 text-[11px] space-y-0.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Observações Técnicas ADECONT:
              </span>
              <p>{exclusaoSelecionada.notes}</p>
            </div>
          )}

          {/* Link Oficial */}
          {exclusaoSelecionada.link_url && (
            <div className="pt-2">
              <a
                href={exclusaoSelecionada.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1.5 font-semibold"
              >
                <span>Acessar Diário Oficial / Fonte Primária Oficial</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-between items-center mt-2">
          <span className="text-[11px] text-slate-400">Registro ID: {exclusaoSelecionada.id}</span>
          <Button variant="outline" size="sm" onClick={aoFechar}>
            Fechar Detalhes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
