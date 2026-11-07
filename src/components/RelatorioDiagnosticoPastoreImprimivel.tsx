import React from 'react'
import { AdecontLogo } from './AdecontLogo'
import type { DiagnosticoClienteData } from '@/services/diagnosticoPastore'
import { Printer, X } from 'lucide-react'

interface RelatorioDiagnosticoPastoreImprimivelProps {
  data: DiagnosticoClienteData
  onClose: () => void
}

export const RelatorioDiagnosticoPastoreImprimivel: React.FC<
  RelatorioDiagnosticoPastoreImprimivelProps
> = ({ data, onClose }) => {
  const brl = (v: number | null | undefined) =>
    Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    })

  const handlePrint = () => {
    window.print()
  }

  const { empresa, balancetes, recomendacao, linhasComparativo, notas } = data

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto print:p-0 print:overflow-visible">
      {/* Barra de controle no topo (não impressa) */}
      <div className="sticky top-0 bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg text-amber-400">
            Diagnóstico Tributário — Relatório Técnico A4
          </span>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            LC 214/2025 · Panorama RT
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded shadow transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
            Fechar Visualização
          </button>
        </div>
      </div>

      {/* Conteúdo A4 formatado */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-0 text-xs">
        {/* Cabeçalho ADECONT */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <AdecontLogo tamanho="medio" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                Portal Panorama RT · Módulo Parametrizador
              </p>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                Diagnóstico Tributário & Comparativo de Regimes 2027+
              </h1>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-600 leading-tight">
            <p className="font-bold text-slate-900">Emissão: {data.dataCalculo}</p>
            <p>Parecer Gerencial Confidencial</p>
            <p className="text-[10px] text-amber-800 font-medium">
              Reforma Tributária (LC 214/2025)
            </p>
          </div>
        </div>

        {/* Identificação do Cliente */}
        <div className="bg-slate-50 border border-slate-300 rounded p-3 mb-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">
                Razão Social:
              </span>
              <span className="font-bold text-slate-900 text-xs">
                {empresa?.razao_social || 'AUTO MECANICA IRMAOS PASTORE LTDA'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">CNPJ:</span>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {empresa?.numero_documento || '92.353.630/0001-68'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">
                Município / UF:
              </span>
              <span className="font-semibold text-slate-900 text-xs">
                {empresa?.municipio || 'Vacaria'} / {empresa?.uf || 'RS'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">
                CNAE Principal:
              </span>
              <span className="text-slate-800 text-xs">
                {empresa?.cnae || '4520-0/01'} — Manutenção e reparação de veículos
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">
                Cliente ADECONT desde:
              </span>
              <span className="font-semibold text-slate-800 text-xs">
                {empresa?.cliente_desde || '1997'} ({empresa?.situacao || 'Ativa'})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">
                Capital Social:
              </span>
              <span className="font-semibold text-slate-800 text-xs">
                {empresa?.capital_social || 'R$ 640.000,00'}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo dos Números Reais (Balancetes e NFes) */}
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
            1. Retrato Econômico-Financeiro (Balancetes Oficiais Jan–Jul/2026)
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="border border-slate-200 p-2 rounded bg-slate-50 text-center">
              <span className="text-[10px] text-slate-500 block">Receita Real Acumulada</span>
              <span className="text-xs font-bold text-slate-900">
                {brl(data.receitaTotalAcumulada)}
              </span>
            </div>
            <div className="border border-slate-200 p-2 rounded bg-emerald-50/60 text-center">
              <span className="text-[10px] text-emerald-900 font-medium block">
                Projeção Anual (12m)
              </span>
              <span className="text-xs font-bold text-emerald-950">
                {brl(data.receitaAnualizada)} (Teto Simples OK)
              </span>
            </div>
            <div className="border border-slate-200 p-2 rounded bg-slate-50 text-center">
              <span className="text-[10px] text-slate-500 block">Ativo Total (Jul/2026)</span>
              <span className="text-xs font-bold text-slate-900">
                {brl(data.ativoTotalMaisRecente)}
              </span>
            </div>
            <div className="border border-slate-200 p-2 rounded bg-emerald-50/60 text-center">
              <span className="text-[10px] text-emerald-900 font-medium block">
                Margem Retida no PL
              </span>
              <span className="text-xs font-bold text-emerald-950">
                {data.margemRetidaLiquidaPct.toFixed(2)}% (+{brl(data.variacaoPatrimonioLiquido)})
              </span>
            </div>
          </div>

          {/* Nota Metodológica de Balancetes Cumulativos */}
          <div className="bg-amber-50/80 border border-amber-300 rounded p-2 mb-2 text-[9px] text-amber-950 leading-relaxed">
            <span className="font-bold uppercase tracking-wider block mb-0.5 text-amber-900">
              Nota Metodológica — Balancetes Cumulativos "Até a Data":
            </span>
            {data.notaMetodologicaCumulativa}
          </div>

          {/* Tabela dos 7 balancetes com Detalhamento de Conversão */}
          <table className="w-full border-collapse border border-slate-200 text-[10px] mb-2">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-200 p-1 text-left">Competência</th>
                <th className="border border-slate-200 p-1 text-right">Cumulativo Gravado (R$)</th>
                <th className="border border-slate-200 p-1 text-right bg-emerald-50 text-emerald-950 font-bold">
                  Líquido Mensal Real (R$)
                </th>
                <th className="border border-slate-200 p-1 text-right">Patrimônio Líquido (R$)</th>
                <th className="border border-slate-200 p-1 text-left">Arquivo de Origem</th>
              </tr>
            </thead>
            <tbody>
              {data.detalhamentoConversao.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="border border-slate-200 p-1 font-semibold">{row.mesRotulo}</td>
                  <td className="border border-slate-200 p-1 text-right font-mono text-slate-600">
                    {brl(row.cumulativoGravado)}
                  </td>
                  <td className="border border-slate-200 p-1 text-right font-mono font-bold text-emerald-900 bg-emerald-50/40">
                    {brl(row.liquidoMensalReal)}
                  </td>
                  <td className="border border-slate-200 p-1 text-right font-mono">
                    {brl(row.patrimonioLiquido)}
                  </td>
                  <td className="border border-slate-200 p-1 text-slate-500 truncate max-w-[150px]">
                    {row.arquivoNome}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900">
                <td className="border border-slate-200 p-1">Acumulado / Variação</td>
                <td className="border border-slate-200 p-1 text-right font-mono text-amber-900">
                  {brl(data.receitaTotalAcumulada)} (Acum. Jul)
                </td>
                <td className="border border-slate-200 p-1 text-right font-mono text-emerald-950 bg-emerald-100/60">
                  {brl(data.receitaTotalAcumulada)} (Total Real)
                </td>
                <td className="border border-slate-200 p-1 text-right font-mono">
                  {brl(data.patrimonioLiquidoFinal)} (+{brl(data.variacaoPatrimonioLiquido)})
                </td>
                <td className="border border-slate-200 p-1 text-[9px] text-slate-500 font-normal">
                  Sem duplicação indevida
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="text-[10px] text-slate-600 space-y-0.5">
            <p className="italic">
              * Dados de movimentação fiscal consolidados: {notas.saidasQtd} NFes de saída (CFOP
              5102 - autopeças) e {notas.entradasQtd} NFes de entrada de fornecedores do setor (ex.:
              Cobra Rolamentos e Distribuidoras). Total de {notas.totalNotas} documento(s) únicos
              auditados.
            </p>
            {notas.conciliacaoFontes?.avisoTransparencia && (
              <p className="text-[9px] text-amber-900 bg-amber-50/90 border border-amber-200/80 rounded px-2 py-0.5 font-medium">
                🛡️ {notas.conciliacaoFontes.avisoTransparencia}
                {notas.conciliacaoFontes.duplicadasEvitadas > 0 && (
                  <span className="font-bold ml-1">
                    ({notas.conciliacaoFontes.duplicadasEvitadas} duplicata(s) de chave
                    descartada(s) na conciliação).
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* TABELA COMPARATIVA DE REGIMES */}
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
            2. Tabela Comparativa de Enquadramento Tributário: Simples Nacional × Lucro Presumido ×
            Regime Regular 2027+
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-[10px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-300 p-1.5 text-left w-[22%]">
                  Critério Tributário
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[26%] bg-emerald-900 text-emerald-100 font-bold">
                  Simples Nacional (Opção Cabível)
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[26%] bg-slate-800">
                  Situação Atual: Lucro Presumido
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[26%] bg-amber-900 text-amber-200 font-bold">
                  Reforma 2027+: Regime Regular (IBS/CBS)
                </th>
              </tr>
            </thead>
            <tbody>
              {linhasComparativo.map((linha, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-200 p-1.5 font-bold text-slate-900 bg-slate-100/50">
                    {linha.criterio}
                  </td>
                  <td className="border border-slate-200 p-1.5 align-top bg-emerald-50/30">
                    <p className="font-semibold text-emerald-950">{linha.simplesNacional.valor}</p>
                    <p className="text-[9px] text-slate-700 mt-0.5">
                      {linha.simplesNacional.detalhe}
                    </p>
                  </td>
                  <td className="border border-slate-200 p-1.5 align-top">
                    <p className="font-semibold text-slate-900">{linha.lucroPresumido.valor}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">
                      {linha.lucroPresumido.detalhe}
                    </p>
                  </td>
                  <td className="border border-slate-200 p-1.5 align-top bg-amber-50/40">
                    <p className="font-bold text-amber-950">{linha.reforma2027.valor}</p>
                    <p className="text-[9px] text-slate-700 mt-0.5">{linha.reforma2027.detalhe}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Parecer Técnico e Recomendação Final */}
        <div className="bg-amber-50/70 border border-amber-300 rounded p-3 mb-4">
          <h3 className="text-xs font-black text-amber-950 uppercase tracking-tight mb-1 flex items-center justify-between">
            <span>3. Parecer Técnico e Recomendação Estratégica Oficial ADECONT</span>
            <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold">
              Simples Nacional Cabível & Rota 2027+
            </span>
          </h3>
          <p className="text-[10px] text-slate-800 leading-relaxed font-medium mb-2">
            {recomendacao.motivoPrincipal}
          </p>
          <div className="space-y-1 mb-2">
            {recomendacao.pontosChave.map((pt, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-700">
                <span className="text-amber-700 font-bold">•</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-amber-200 flex justify-between items-center text-[10px]">
            <span className="font-bold text-amber-950">Impacto Estimado no Caixa Anual:</span>
            <span className="font-black text-emerald-800 text-xs">
              {recomendacao.resumoCargaEstimada}
            </span>
          </div>
        </div>

        {/* Rodapé institucional com assinaturas */}
        <div className="pt-4 border-t border-slate-300 flex justify-between items-end text-[9px] text-slate-500">
          <div>
            <p className="font-bold text-slate-800">
              ADECONT — Assessoria Contábil e Administrativa
            </p>
            <p>Vacaria/RS · Sistema Integrado Panorama RT · Lei Complementar nº 214/2025</p>
            <p className="text-[8px] italic text-slate-400 mt-0.5">
              Estimativa técnica elaborada para suporte decisório gerencial. Não substitui parecer
              formal de auditoria tributária.
            </p>
          </div>
          <div className="text-right">
            <div className="w-40 border-b border-slate-400 mb-1"></div>
            <p className="font-semibold text-slate-700">Departamento Tributário & Contábil</p>
            <p className="text-[8px]">ADECONT Assessoria</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default RelatorioDiagnosticoPastoreImprimivel
