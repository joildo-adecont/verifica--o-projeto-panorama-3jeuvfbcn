import React from 'react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import type { NormExclusionHistoryItem } from '@/types/panorama'
import type { FiltrosHistoricoExclusoes } from '@/services/normExclusionsHistory'
import { Printer, Calendar, ShieldCheck, Ban, FileX, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface RelatorioExclusoesImprimivelProps {
  itens: NormExclusionHistoryItem[]
  filtros: FiltrosHistoricoExclusoes
  aoFechar: () => void
}

export const RelatorioExclusoesImprimivel: React.FC<RelatorioExclusoesImprimivelProps> = ({
  itens,
  filtros,
  aoFechar,
}) => {
  const agoraFormatado = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(new Date())

  const totalTributario = (itens || []).filter((i) => i.segment === 'Tributário').length
  const totalJuridico = (itens || []).filter((i) => i.segment === 'Jurídico').length
  const totalContabil = (itens || []).filter((i) => i.segment === 'Contábil').length
  const totalAdmin = (itens || []).filter((i) => i.segment === 'Administrativo').length

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Barra de ações no topo (oculta na impressão) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Printer className="h-4 w-4 text-rose-600" />
            <span className="font-semibold">
              Relatório de Exclusões e Revogações de Normas — Impressão A4
            </span>
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
              className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
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
            <div className="border-b-2 border-rose-800 pb-6 flex items-start justify-between gap-6">
              <div className="space-y-1">
                <div className="mb-2">
                  <AdecontLogo variant="color" className="h-10 w-auto" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  Relatório de Exclusões e Revogações de Normas
                </h1>
                <p className="text-xs text-slate-600">
                  Registro Oficial de Dispositivos e Atos Revogados da Reforma Tributária — ADECONT
                </p>
              </div>

              <div className="text-right space-y-1 text-xs text-slate-500">
                <div className="font-semibold text-slate-700">
                  Relatório nº ADECONT-EXCL-{new Date().getFullYear()}
                </div>
                <div>Emissão: {agoraFormatado}</div>
                <div className="inline-flex items-center gap-1 font-medium text-rose-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Fontes Oficiais Verificadas
                </div>
              </div>
            </div>

            {/* Sumário Executivo */}
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                  Total Exclusões
                </div>
                <div className="text-xl font-bold text-rose-800">{itens.length}</div>
              </div>
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-slate-600">Tributário</div>
                <div className="text-xl font-bold text-slate-800">{totalTributario}</div>
              </div>
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-slate-600">Jurídico</div>
                <div className="text-xl font-bold text-slate-800">{totalJuridico}</div>
              </div>
              <div className="p-2 border-r border-slate-200 last:border-r-0">
                <div className="text-xs uppercase tracking-wide text-slate-600">Contábil</div>
                <div className="text-xl font-bold text-slate-800">{totalContabil}</div>
              </div>
              <div className="p-2">
                <div className="text-xs uppercase tracking-wide text-slate-600">Administrativo</div>
                <div className="text-xl font-bold text-slate-800">{totalAdmin}</div>
              </div>
            </div>

            {/* Metadados do Filtro Aplicado */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span className="font-medium text-slate-700">Filtros aplicados:</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Segmento: {filtros.segmento}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Fonte: {filtros.fonte}
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

            {/* Listagem Cronológica dos Itens de Exclusão */}
            <div className="mt-6 space-y-6">
              {itens.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic text-sm">
                  Nenhuma exclusão ou revogação encontrada para os critérios informados.
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
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                            <Ban className="h-2.5 w-2.5" />
                            {item.norm_type || 'Exclusão Legislativa'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.segment}
                          </span>
                          {item.revoked_article && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Dispositivo: {item.revoked_article}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 font-medium">{item.norm_title}</div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <div className="flex items-center justify-end gap-1 text-xs text-slate-600 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Data: {item.exclusion_date}
                        </div>
                        <div className="flex justify-end">
                          <SeloNivelConfianca
                            tier={item.confidence_tier}
                            fonte={item.source_org}
                            compacto
                          />
                        </div>
                      </div>
                    </div>

                    {/* Motivo e Justificativa da Exclusão */}
                    <div className="text-xs text-slate-700 bg-rose-50/50 p-2.5 rounded border border-rose-200/80">
                      <span className="font-semibold text-rose-900">
                        Motivo da Exclusão / Revogação:{' '}
                      </span>
                      {item.reason_description}
                    </div>

                    {/* Redação Anterior Revogada (se houver) */}
                    {item.previous_content && (
                      <div className="text-xs p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
                        <span className="font-bold text-[11px] block uppercase text-slate-600 mb-0.5">
                          Texto / Redação Anterior
                        </span>
                        <p className="line-clamp-4">{item.previous_content}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Fonte Oficial: {item.source_org}</span>
                      <span>
                        Origem:{' '}
                        {item.record_origin === 'rotina_semanal'
                          ? 'Rotina Semanal Automática'
                          : item.record_origin === 'backfill_inicial'
                            ? 'Carga Histórica Inicial'
                            : 'Registro Manual'}
                      </span>
                    </div>
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
            <div>Plataforma Panorama da Reforma Tributária — Módulo de Histórico de Exclusões</div>
            <div className="text-[10px] text-slate-400">
              Documento emitido para controle técnico interno, rastreabilidade legislativa e
              conformidade legal institucional.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
