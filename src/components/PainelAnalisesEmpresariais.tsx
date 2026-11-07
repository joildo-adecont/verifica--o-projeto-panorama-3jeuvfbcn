import React, { useState } from 'react'
import {
  TrendingUp,
  BarChart3,
  FileText,
  ShieldCheck,
  Scale,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Building2,
  DollarSign,
  PieChart,
} from 'lucide-react'
import type { SinteseAnaliseEmpresarial } from '@/services/analisesEmpresariais'
import { RelatorioAnaliseEmpresarialA4 } from './RelatorioAnaliseEmpresarialA4'

interface PainelAnalisesEmpresariaisProps {
  dossie: SinteseAnaliseEmpresarial
}

export const PainelAnalisesEmpresariais: React.FC<PainelAnalisesEmpresariaisProps> = ({
  dossie,
}) => {
  const [modalRelatorioA4, setModalRelatorioA4] = useState(false)
  const { cliente, indicadores, normasRelevantes, indicesMacro, parecerEspecialistas } = dossie

  const brl = (v?: number | null) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const temBalancetes = indicadores.mesesDisponiveis > 0

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Resumo do Cliente */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              {cliente.regime_tributario || cliente.enquadramento_tributario || 'Regime a Definir'}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              CNPJ: {cliente.documento_limpo || cliente.numero_documento}
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-1">
            {cliente.razao_social || cliente.nome}
          </h2>
          <p className="text-xs text-slate-500">
            {cliente.municipio
              ? `${cliente.municipio} - ${cliente.uf}`
              : 'Localidade não informada'}{' '}
            · CNAE: {cliente.cnae || 'N/D'} ({cliente.ramo_atividade || 'Ramo Geral'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalRelatorioA4(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-lg shadow-sm text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Emitir Relatório Técnico A4
          </button>
        </div>
      </div>

      {/* Grid de Métricas Chave (Microeconômicas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Receita Anualizada</span>
            <div className="p-2 bg-emerald-100/70 text-emerald-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900">
              {brl(indicadores.receitaAnualizada)}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Base: {indicadores.mesesDisponiveis} mês(es) escriturado(s)
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Último Mês Faturado</span>
            <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-blue-800">
              {brl(indicadores.receitaUltimoMes)}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Competência mais recente: {indicadores.mesMaisRecente || 'N/A'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Crescimento Médio</span>
            <div
              className={`p-2 rounded-lg ${indicadores.crescimentoMedioReceitaPct >= 0 ? 'bg-emerald-100/70 text-emerald-700' : 'bg-rose-100/70 text-rose-700'}`}
            >
              {indicadores.crescimentoMedioReceitaPct >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-black ${indicadores.crescimentoMedioReceitaPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
            >
              {indicadores.crescimentoMedioReceitaPct >= 0 ? '+' : ''}
              {indicadores.crescimentoMedioReceitaPct.toFixed(1)}%
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Variação média de faturamento a.m.
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Patrimônio Líquido</span>
            <div className="p-2 bg-purple-100/70 text-purple-700 rounded-lg">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-purple-900">
              {brl(indicadores.patrimonioLiquidoAtual)}
            </span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              Ativo: {brl(indicadores.ativoTotalAtual)} · Passivo:{' '}
              {brl(indicadores.passivoTotalAtual)}
            </span>
          </div>
        </div>
      </div>

      {/* Histórico e Tabela de Balancetes Decupados */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Escrituração Contábil Mensalizada (Correção de Balancetes Cumulativos)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {indicadores.seriesMensalizadas.length} competência(s) encontrada(s)
          </span>
        </div>

        {temBalancetes ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Competência</th>
                  <th className="p-2.5">Arquivo Origem</th>
                  <th className="p-2.5 text-right">Rec. Cumulativa</th>
                  <th className="p-2.5 text-right font-black text-emerald-800">
                    Rec. Líquida Mensal
                  </th>
                  <th className="p-2.5 text-right">Ativo Total</th>
                  <th className="p-2.5 text-right">Passivo Total</th>
                  <th className="p-2.5 text-right">Patrimônio Líquido</th>
                  <th className="p-2.5 text-right">Margem Líquida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {indicadores.seriesMensalizadas.map((s) => (
                  <tr key={s.documentoId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-slate-900">{s.competencia}</td>
                    <td className="p-2.5 text-slate-500 truncate max-w-[160px]">{s.arquivoNome}</td>
                    <td className="p-2.5 text-right text-slate-500">{brl(s.receitaCumulativa)}</td>
                    <td className="p-2.5 text-right font-black text-emerald-800 bg-emerald-50/40">
                      {brl(s.receitaMensalLiquida)}
                    </td>
                    <td className="p-2.5 text-right text-slate-700">{brl(s.totalAtivo)}</td>
                    <td className="p-2.5 text-right text-slate-700">{brl(s.totalPassivo)}</td>
                    <td className="p-2.5 text-right text-slate-700">{brl(s.patrimonioLiquido)}</td>
                    <td className="p-2.5 text-right font-semibold text-slate-800">
                      {s.margemLucroLiquido.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">
              Nenhum balancete ou DRE importado para este cliente
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
              Utilize o importador acima para anexar os arquivos de balancete (PDF, CSV, XLSX, XML).
              O sistema fará a decupagem de valores cumulativos e alimentará os indicadores.
            </p>
          </div>
        )}
      </div>

      {/* Parecer dos 4 Agentes Especialistas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Síntese Técnica dos Agentes Especialistas ADECONT
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              Especialista Tributário (LC 214/2025 & CBS/IBS)
            </span>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              {parecerEspecialistas.tributario}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Especialista Contábil & Demonstrações Financeiras
            </span>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              {parecerEspecialistas.contabil}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Especialista Administrativo, Fator R & Folha
            </span>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              {parecerEspecialistas.administrativo}
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              Especialista Macroeconômico & Mercado
            </span>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              {parecerEspecialistas.economico}
            </p>
          </div>
        </div>
      </div>

      {/* Fundamentação Legislativa & Índices Macroeconômicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repositório Legislativo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Fundamentação Legislativa (norm_reviews_history)
            </h3>
          </div>

          {normasRelevantes.length > 0 ? (
            <div className="space-y-2.5">
              {normasRelevantes.slice(0, 4).map((norma) => (
                <div
                  key={norma.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">
                      Revisão Semanal: {norma.review_date}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-100">
                      {norma.status || 'Concluída'}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-tight">
                    {norma.observations ||
                      norma.highlights ||
                      'Análise de conformidade e novas resoluções da Reforma Tributária.'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded">
              Nenhuma revisão legislativa recente pendente. Repositório normativo atualizado.
            </p>
          )}
        </div>

        {/* Índices Macroeconômicos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Índices Econômicos Oficiais (Fontes Estatísticas)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {indicesMacro.indicadores.slice(0, 6).map((ind) => (
              <div key={ind.chave} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block truncate">
                  {ind.nome}
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">
                  {ind.valorAtual} {ind.unidade}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  Ref: {ind.dataReferencia || 'Atual'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal A4 */}
      {modalRelatorioA4 && (
        <RelatorioAnaliseEmpresarialA4 dossie={dossie} onClose={() => setModalRelatorioA4(false)} />
      )}
    </div>
  )
}
export default PainelAnalisesEmpresariais
