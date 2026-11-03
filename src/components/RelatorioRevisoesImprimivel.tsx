import React from 'react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import type { NormReviewHistoryItem, FiltrosHistoricoNormas } from '@/types/panorama'
import { Printer, Calendar, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RelatorioRevisoesImprimivelProps {
  itens: NormReviewHistoryItem[]
  filtros: FiltrosHistoricoNormas
  aoFechar: () => void
}

export const RelatorioRevisoesImprimivel: React.FC<RelatorioRevisoesImprimivelProps> = ({
  itens,
  filtros,
  aoFechar,
}) => {
  const agoraFormatado = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date())

  const totalInclusoes = itens.filter((i) => i.review_type === 'inclusao').length
  const totalAlteracoes = itens.filter((i) => i.review_type === 'alteracao').length
  const totalExclusoes = itens.filter((i) => i.review_type === 'exclusao').length

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Barra de ações no topo (oculta na impressão) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Printer className="h-4 w-4 text-emerald-600" />
            <span>Visualização para Impressão / Exportação A4 Oficial</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={aoFechar}
              className="text-slate-600 border-slate-300 hover:bg-slate-200"
            >
              Fechar Visualização
            </Button>
            <Button
              size="sm"
              onClick={handleImprimir}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Documento
            </Button>
          </div>
        </div>

        {/* Conteúdo formatado A4 */}
        <div className="p-8 sm:p-12 print:p-8 space-y-8 min-h-[1100px] flex flex-col justify-between">
          <div>
            {/* Cabeçalho Institucional Oficial */}
            <div className="border-b-2 border-emerald-800 pb-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="mb-2">
                  <AdecontLogo variante="colorido" tamanho="md" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  Relatório Consolidado de Revisões de Normas
                </h1>
                <p className="text-xs text-slate-600">
                  Arcabouço Legal da Reforma Tributária — Controle Contábil, Jurídico e
                  Administrativo
                </p>
              </div>

              <div className="text-right space-y-1 text-xs text-slate-500">
                <div className="font-semibold text-slate-700">
                  Relatório nº ADECONT-REV-{new Date().getFullYear()}
                </div>
                <div>Emissão: {agoraFormatado}</div>
                <div className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Fontes Oficiais Compiladas
                </div>
              </div>
            </div>

            {/* Sumário Executivo */}
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Total de Registros
                </div>
                <div className="text-xl font-bold text-slate-800">{itens.length}</div>
              </div>
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-emerald-700">Inclusões</div>
                <div className="text-xl font-bold text-emerald-800">{totalInclusoes}</div>
              </div>
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-amber-700">Alterações</div>
                <div className="text-xl font-bold text-amber-800">{totalAlteracoes}</div>
              </div>
              <div className="p-2">
                <div className="text-xs uppercase tracking-wide text-rose-700">
                  Exclusões Legais
                </div>
                <div className="text-xl font-bold text-rose-800">{totalExclusoes}</div>
              </div>
            </div>

            {/* Metadados do Filtro Aplicado */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-medium text-slate-700">Filtros aplicados:</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Segmento: {filtros.segmento}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Tipo: {filtros.tipoRevisao === 'TODOS' ? 'Todos os tipos' : filtros.tipoRevisao}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Período: {filtros.periodo}
              </span>
              {filtros.busca && (
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  Busca: &ldquo;{filtros.busca}&rdquo;
                </span>
              )}
            </div>

            {/* Listagem Cronológica dos Itens */}
            <div className="mt-6 space-y-6">
              {itens.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic text-sm">
                  Nenhuma revisão encontrada para os critérios informados.
                </div>
              ) : (
                itens.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-lg border border-slate-200 bg-white space-y-3 break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{item.norm_code}</span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                              item.review_type === 'inclusao'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.review_type === 'alteracao'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {item.review_type === 'inclusao'
                              ? 'Inclusão Normativa'
                              : item.review_type === 'alteracao'
                                ? 'Alteração Legislativa'
                                : 'Exclusão / Revogação'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.segment}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">{item.norm_title}</div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <div className="flex items-center justify-end gap-1 text-xs text-slate-600 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {item.review_date}
                        </div>
                        <div className="flex justify-end">
                          <SeloNivelConfianca
                            tier={item.confidence_tier}
                            nomeFonte={item.source_org}
                            tamanho="compacto"
                            permitirModal={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumo da Mudança */}
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                      <span className="font-semibold text-slate-900">Resumo da Revisão: </span>
                      {item.summary_change}
                    </div>

                    {/* Confronto de Versões (quando aplicável) */}
                    {(item.previous_version || item.current_version) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        {item.previous_version && (
                          <div className="p-2 rounded bg-rose-50/50 border border-rose-200/80 text-rose-900">
                            <span className="font-bold text-[11px] block uppercase text-rose-800 mb-1">
                              Versão Anterior
                            </span>
                            <p className="line-clamp-4">{item.previous_version}</p>
                          </div>
                        )}
                        {item.current_version && (
                          <div
                            className={`p-2 rounded bg-emerald-50/50 border border-emerald-200/80 text-emerald-900 ${
                              !item.previous_version ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <span className="font-bold text-[11px] block uppercase text-emerald-800 mb-1">
                              Versão Atual / Vigente
                            </span>
                            <p className="line-clamp-4">{item.current_version}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {item.notes && (
                      <div className="text-[11px] text-slate-500 italic">
                        Observação: {item.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rodapé Institucional Oficial A4 */}
          <div className="border-t border-slate-300 pt-6 mt-12 text-center text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">
              ADECONT — Assessoria Contábil e Administrativa
            </div>
            <div>
              Plataforma Panorama da Reforma Tributária — Sistema de Gestão e Monitoramento
              Normativo
            </div>
            <div className="text-[10px] text-slate-400">
              Documento emitido para controle técnico interno e conformidade legal institucional.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
