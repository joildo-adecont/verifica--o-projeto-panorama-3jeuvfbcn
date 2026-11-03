import React, { useState } from 'react'
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
import type { NormReviewHistoryItem } from '@/types/panorama'
import { obterTodasRevisoesDaNorma } from '@/services/normReviewsHistory'
import {
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react'

export interface ModalDetalhesNormaProps {
  normaSelecionada: NormReviewHistoryItem | null
  todasRevisoes: NormReviewHistoryItem[]
  aberto: boolean
  aoFechar: () => void
}

export const ModalDetalhesNorma: React.FC<ModalDetalhesNormaProps> = ({
  normaSelecionada,
  todasRevisoes,
  aberto,
  aoFechar,
}) => {
  if (!normaSelecionada) return null

  // Busca todas as revisões desta norma específica ordenadas cronologicamente
  const revisoesDestaNorma = obterTodasRevisoesDaNorma(todasRevisoes, normaSelecionada.norm_code)

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && aoFechar()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            <AdecontLogo variante="colorido" tamanho="sm" />
            <SeloNivelConfianca
              tier={normaSelecionada.confidence_tier}
              nomeFonte={normaSelecionada.source_org}
              tamanho="compacto"
              permitirModal={false}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {normaSelecionada.norm_type}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Segmento: {normaSelecionada.segment}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {normaSelecionada.norm_code}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-400">
              {normaSelecionada.norm_title}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Linha do tempo de todas as revisões desta norma específica */}
        <div className="space-y-6 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Evolução Temporal e Revisões Desta Norma ({revisoesDestaNorma.length})
            </h3>
            {normaSelecionada.link_url && (
              <a
                href={normaSelecionada.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                Fonte Oficial <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {revisoesDestaNorma.map((rev, index) => {
              const isMaisRecente = index === 0
              return (
                <div key={rev.id || index} className="relative group">
                  {/* Ponto na timeline */}
                  <div
                    className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 transition-colors ${
                      isMaisRecente
                        ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950/50'
                        : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            rev.review_type === 'inclusao'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : rev.review_type === 'alteracao'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {rev.review_type === 'inclusao'
                            ? 'Inclusão'
                            : rev.review_type === 'alteracao'
                              ? 'Alteração'
                              : 'Exclusão'}
                        </span>
                        {isMaisRecente && (
                          <span className="text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                            Vigente / Mais recente
                          </span>
                        )}
                        <span className="text-[11px] text-slate-500">
                          Origem: {rev.record_origin.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {rev.review_date}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Mudança efetuada:{' '}
                      </span>
                      {rev.summary_change}
                    </div>

                    {/* Comparação lado a lado de Versão Anterior e Atual */}
                    {(rev.previous_version || rev.current_version) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase text-rose-700 dark:text-rose-400 mb-1">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            Versão Anterior
                          </div>
                          <p className="whitespace-pre-line text-[11px] leading-relaxed">
                            {rev.previous_version ||
                              'Dispositivo inexistente ou sem redação anterior formalizada.'}
                          </p>
                        </div>

                        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200">
                          <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase text-emerald-700 dark:text-emerald-400 mb-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Versão Atual (Vigente)
                          </div>
                          <p className="whitespace-pre-line text-[11px] leading-relaxed">
                            {rev.current_version || rev.summary_change}
                          </p>
                        </div>
                      </div>
                    )}

                    {rev.notes && (
                      <div className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
                        {rev.notes}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t pt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={aoFechar}>
            Fechar Detalhes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
