import React from 'react'
import { AdecontLogo } from './AdecontLogo'
import type { SinteseAnaliseEmpresarial } from '@/services/analisesEmpresariais'
import type {
  ItemIndicador,
  ScorePonderadoResultado,
  ItemChecklistDoc,
  AchadoDueDiligence,
  ParecerFinalAnalise,
} from '@/types/analisesEmpresariaisModel'
import {
  Printer,
  X,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Scale,
  FileText,
  AlertTriangle,
  XCircle,
  Award,
} from 'lucide-react'

interface RelatorioAnaliseEmpresarialA4Props {
  dossie: SinteseAnaliseEmpresarial
  indicadoresModelo?: ItemIndicador[]
  scoreResultado?: ScorePonderadoResultado
  checklistItens?: ItemChecklistDoc[]
  achados?: AchadoDueDiligence[]
  parecerFinal?: ParecerFinalAnalise
  onClose: () => void
}

export const RelatorioAnaliseEmpresarialA4: React.FC<RelatorioAnaliseEmpresarialA4Props> = ({
  dossie,
  indicadoresModelo,
  scoreResultado,
  checklistItens,
  achados,
  parecerFinal,
  onClose,
}) => {
  const {
    cliente,
    indicadores,
    normasRelevantes,
    indicesMacro,
    parecerEspecialistas,
    dataAnalise,
  } = dossie

  const brl = (v?: number | null) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handlePrint = () => {
    window.print()
  }

  const checklistTotal = checklistItens?.length || 0
  const checklistRecebidos = checklistItens?.filter((i) => i.recebido).length || 0
  const checklistPct = checklistTotal > 0 ? (checklistRecebidos / checklistTotal) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto print:p-0 print:overflow-visible">
      {/* Barra superior de controle (oculta na impressão) */}
      <div className="sticky top-0 bg-slate-900 text-white p-3.5 flex justify-between items-center shadow-lg print:hidden z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base text-amber-400">
            Dossiê de Análise Empresarial Integrada — Relatório Técnico A4 Completo
          </span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            ADECONT · Confidencial
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded shadow transition-colors text-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* Folha A4 formatada */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-0 text-xs font-sans space-y-4">
        {/* Cabeçalho Oficial ADECONT */}
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AdecontLogo tamanho="medio" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                Portal Panorama RT · Módulo de Análises Empresariais
              </p>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                Parecer Técnico & Dossiê Empresarial Integrado
              </h1>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 leading-tight">
            <p className="font-bold text-slate-900">Emissão: {dataAnalise}</p>
            <p>Assessoria Contábil e Administrativa</p>
            <p className="text-[10px] text-amber-800 font-medium">Metodologia Oficial ADECONT</p>
          </div>
        </div>

        {/* Identificação do Cliente */}
        <div className="bg-slate-50 border border-slate-300 rounded p-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Razão Social</p>
              <p className="text-xs font-black text-slate-900">
                {cliente.razao_social || cliente.nome}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">CNPJ / CPF</p>
              <p className="text-xs font-mono font-bold text-slate-800">
                {cliente.documento_limpo || cliente.numero_documento}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Regime Tributário</p>
              <p className="text-xs font-bold text-emerald-800">
                {cliente.regime_tributario || cliente.enquadramento_tributario || 'Não Definido'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">CNAE Principal</p>
              <p className="text-xs text-slate-800">
                {cliente.cnae || 'N/D'} - {cliente.ramo_atividade || 'Ramo não especificado'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Localização</p>
              <p className="text-xs text-slate-800">
                {cliente.municipio || 'N/D'} - {cliente.uf || 'N/D'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Quadro Funcional</p>
              <p className="text-xs text-slate-800">
                {cliente.num_funcionarios || 0} colaborador(es) · Folha:{' '}
                {brl(cliente.folha_salarial_mensal)}
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 1: PARECER TÉCNICO OFICIAL & RECOMENDAÇÃO DE CRÉDITO */}
        {parecerFinal && (
          <div className="border border-slate-300 rounded p-3 bg-slate-50/50">
            <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1.5">
              <h2 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                1. Parecer Técnico Oficial & Recomendação de Crédito
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Opinião: {parecerFinal.nivelOpiniao}
              </span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div>
                <strong className="text-slate-900">Conclusão Técnica: </strong>
                <span className="text-slate-700 leading-relaxed">{parecerFinal.conclusao}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <strong className="text-emerald-800">Pontos Fortes: </strong>
                  <span className="text-slate-700">{parecerFinal.pontosFortes}</span>
                </div>
                <div>
                  <strong className="text-amber-800">Pontos de Atenção: </strong>
                  <span className="text-slate-700">{parecerFinal.pontosAtencao}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] text-slate-600">
                <span>
                  Recomendação de Crédito:{' '}
                  <strong className="text-slate-900">{parecerFinal.recomendacaoCredito}</strong>
                </span>
                <span>
                  Responsável:{' '}
                  <strong className="text-slate-900">{parecerFinal.responsavelTecnico}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO 2: 25 INDICADORES COM SEMÁFORO (QUADRO SÍNTESE) */}
        {indicadoresModelo && indicadoresModelo.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              2. Matriz dos 25 Indicadores Comparativos com Semáforo
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1">Indicador</th>
                    <th className="p-1 text-center">Referência</th>
                    <th className="p-1 text-right">Valor Apurado</th>
                    <th className="p-1 text-center">Semáforo</th>
                    <th className="p-1">Diagnóstico Executivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indicadoresModelo.map((ind) => (
                    <tr key={ind.id} className="hover:bg-slate-50">
                      <td className="p-1 font-semibold text-slate-900">{ind.nome}</td>
                      <td className="p-1 text-center text-slate-500 font-medium">
                        {ind.referencia}
                      </td>
                      <td className="p-1 text-right font-mono font-bold text-slate-900">
                        {ind.unidade === 'moeda'
                          ? brl(ind.valor)
                          : ind.unidade === 'percentual'
                            ? `${ind.valor.toFixed(2)}%`
                            : ind.unidade === 'dias'
                              ? `${ind.valor.toFixed(0)}d`
                              : `${ind.valor.toFixed(2)}x`}
                      </td>
                      <td className="p-1 text-center">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[8px] ${
                            ind.semaforo === 'saudavel'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ind.semaforo === 'atencao'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ind.semaforo.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-1 text-slate-600 truncate max-w-[200px]">
                        {ind.explicacao}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEÇÃO 3: SCORE PONDERADO MULTICRITÉRIO & COMPLETUDE DOCUMENTAL */}
        <div className="grid grid-cols-2 gap-3">
          {scoreResultado && (
            <div className="border border-slate-200 rounded p-2.5 bg-white">
              <h3 className="font-bold text-[11px] text-slate-900 uppercase mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-600" />
                  Score Ponderado (0 a 10)
                </span>
                <span className="text-primary font-bold font-mono">
                  Nota: {scoreResultado.notaFinal.toFixed(2)}
                </span>
              </h3>
              <div className="space-y-1 text-[10px]">
                {scoreResultado.blocos.map((b) => (
                  <div
                    key={b.bloco}
                    className="flex justify-between border-b border-slate-100 pb-0.5"
                  >
                    <span className="text-slate-600">
                      {b.bloco} ({(b.peso * 100).toFixed(0)}%):
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {b.nota.toFixed(1)} (Pond: {b.notaPonderada.toFixed(2)})
                    </span>
                  </div>
                ))}
                <div className="pt-1 flex justify-between font-bold text-slate-900 text-[11px]">
                  <span>Classificação:</span>
                  <span className="text-primary">{scoreResultado.classificacao}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded p-2.5 bg-white flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[11px] text-slate-900 uppercase mb-1.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-600" />
                Checklist Documental & Due Diligence
              </h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">Total de Documentos Auditados:</span>
                  <span className="font-bold text-slate-900">{checklistTotal} itens</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">Documentos Validados / Entregues:</span>
                  <span className="font-bold text-emerald-700">{checklistRecebidos} itens</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600">Pendências Documentais:</span>
                  <span className="font-bold text-amber-700">
                    {checklistTotal - checklistRecebidos} itens
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-bold text-[11px]">
                  <span className="text-slate-900">Taxa de Completude:</span>
                  <span className="text-primary">{checklistPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] text-slate-500 italic">
              Conforme as 8 categorias normativas (Societário, Contábil, Fiscal, Trabalhista,
              Patrimonial, Financeiro, Operacional e Governança).
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: MATRIZ DE ACHADOS (APONTAMENTOS) */}
        {achados && achados.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              4. Matriz de Achados e Recomendações (Due Diligence)
            </h2>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-[9px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1 w-6 text-center">Nº</th>
                    <th className="p-1 w-20">Área</th>
                    <th className="p-1">Achado / Inconsistência</th>
                    <th className="p-1 text-center w-16">Impacto</th>
                    <th className="p-1">Recomendação Técnica ADECONT</th>
                    <th className="p-1 text-center w-20">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {achados.slice(0, 8).map((a, idx) => (
                    <tr key={a.id || idx}>
                      <td className="p-1 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-1 font-bold text-slate-900">{a.area}</td>
                      <td className="p-1 text-slate-800">{a.achado}</td>
                      <td className="p-1 text-center">
                        <span
                          className={`px-1 py-0.2 rounded font-semibold text-[8px] ${
                            a.impacto === 'Alto'
                              ? 'bg-red-100 text-red-800'
                              : a.impacto === 'Médio'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {a.impacto}
                        </span>
                      </td>
                      <td className="p-1 text-slate-700">{a.recomendacao}</td>
                      <td className="p-1 text-center font-medium text-slate-600">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pareceres dos 4 Agentes Especialistas Integrados */}
        <div>
          <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            5. Síntese Técnica dos Agentes Especialistas ADECONT
          </h2>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-0.5">
                Parecer Tributário (LC 214/2025):
              </span>
              <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.tributario}</p>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-0.5">
                Parecer Contábil (Balancetes):
              </span>
              <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.contabil}</p>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-0.5">
                Parecer Administrativo / Trabalhista:
              </span>
              <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.administrativo}</p>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-slate-50/50">
              <span className="font-bold text-slate-900 block mb-0.5">
                Parecer Macroeconômico de Mercado:
              </span>
              <p className="text-slate-700 line-clamp-3">{parecerEspecialistas.economico}</p>
            </div>
          </div>
        </div>

        {/* Rodapé Oficial com carimbo */}
        <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-500 flex justify-between items-center">
          <div>
            <p className="font-bold text-slate-700">
              ADECONT — Assessoria Contábil e Administrativa
            </p>
            <p>
              Documento gerado automaticamente pelo Sistema Panorama RT · Responsabilidade Técnica
              Restrita
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-slate-600">Autenticidade Garantida · Sistema ADECONT</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RelatorioAnaliseEmpresarialA4
