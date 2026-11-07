import React from 'react'
import { AdecontLogo } from './AdecontLogo'
import type { SinteseAnaliseEmpresarial } from '@/services/analisesEmpresariais'
import { Printer, X, CheckCircle2, TrendingUp, ShieldCheck, Scale, FileText } from 'lucide-react'

interface RelatorioAnaliseEmpresarialA4Props {
  dossie: SinteseAnaliseEmpresarial
  onClose: () => void
}

export const RelatorioAnaliseEmpresarialA4: React.FC<RelatorioAnaliseEmpresarialA4Props> = ({
  dossie,
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

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-y-auto print:p-0 print:overflow-visible">
      {/* Barra superior de controle (oculta na impressão) */}
      <div className="sticky top-0 bg-slate-900 text-white p-3.5 flex justify-between items-center shadow-lg print:hidden z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base text-amber-400">
            Dossiê de Análise Empresarial Integrada — Relatório Técnico A4
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
      <div className="max-w-[210mm] mx-auto p-8 print:p-0 text-xs font-sans">
        {/* Cabeçalho Oficial ADECONT */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
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
            <p className="text-[10px] text-amber-800 font-medium">Reforma Tributária LC 214/2025</p>
          </div>
        </div>

        {/* Identificação do Cliente */}
        <div className="bg-slate-50 border border-slate-300 rounded p-3 mb-4">
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

        {/* Destaque dos Indicadores Financeiros / Contábeis (Micro) */}
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            1. Indicadores Econômico-Financeiros do Cliente (Microeconomia)
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="border border-slate-200 rounded p-2 bg-white">
              <span className="text-[10px] text-slate-500 block uppercase">Receita Anualizada</span>
              <span className="text-sm font-black text-slate-900">
                {brl(indicadores.receitaAnualizada)}
              </span>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-white">
              <span className="text-[10px] text-slate-500 block uppercase">
                Último Mês Faturado
              </span>
              <span className="text-sm font-black text-emerald-700">
                {brl(indicadores.receitaUltimoMes)}
              </span>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-white">
              <span className="text-[10px] text-slate-500 block uppercase">Ativo Total / PL</span>
              <span className="text-sm font-bold text-slate-900">
                {brl(indicadores.ativoTotalAtual)} / {brl(indicadores.patrimonioLiquidoAtual)}
              </span>
            </div>
            <div className="border border-slate-200 rounded p-2 bg-white">
              <span className="text-[10px] text-slate-500 block uppercase">Crescimento Médio</span>
              <span
                className={`text-sm font-black ${indicadores.crescimentoMedioReceitaPct >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}
              >
                {indicadores.crescimentoMedioReceitaPct >= 0 ? '+' : ''}
                {indicadores.crescimentoMedioReceitaPct.toFixed(1)}% a.m.
              </span>
            </div>
          </div>

          {/* Tabela de Evolução Mensal dos Balancetes */}
          {indicadores.seriesMensalizadas.length > 0 ? (
            <div className="border border-slate-200 rounded overflow-hidden mb-3">
              <table className="w-full text-[10px] text-left">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="p-1.5">Competência</th>
                    <th className="p-1.5 text-right">Rec. Cumulativa</th>
                    <th className="p-1.5 text-right">Rec. Líquida Mensal</th>
                    <th className="p-1.5 text-right">Ativo Total</th>
                    <th className="p-1.5 text-right">Patrimônio Líquido</th>
                    <th className="p-1.5 text-right">Margem Líquida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {indicadores.seriesMensalizadas.map((s) => (
                    <tr key={s.documentoId} className="hover:bg-slate-50">
                      <td className="p-1.5 font-bold font-mono text-slate-900">{s.competencia}</td>
                      <td className="p-1.5 text-right text-slate-500">
                        {brl(s.receitaCumulativa)}
                      </td>
                      <td className="p-1.5 text-right font-bold text-emerald-800">
                        {brl(s.receitaMensalLiquida)}
                      </td>
                      <td className="p-1.5 text-right text-slate-700">{brl(s.totalAtivo)}</td>
                      <td className="p-1.5 text-right text-slate-700">
                        {brl(s.patrimonioLiquido)}
                      </td>
                      <td className="p-1.5 text-right font-medium text-slate-800">
                        {s.margemLucroLiquido.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic p-2 bg-slate-50 rounded border border-slate-200">
              Nenhum balancete/DRE importado para exibição do histórico temporal.
            </p>
          )}
        </div>

        {/* Pareceres dos 4 Agentes Especialistas */}
        <div className="mb-4">
          <h2 className="text-xs font-black uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            2. Síntese Técnica dos Agentes Especialistas ADECONT
          </h2>
          <div className="space-y-2">
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
              <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                <Scale className="w-3 h-3 text-emerald-600" />
                Parecer Tributário & Reforma Tributária (LC 214/2025):
              </span>
              <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                {parecerEspecialistas.tributario}
              </p>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
              <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-600" />
                Parecer Contábil & Auditoria de Balancetes:
              </span>
              <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                {parecerEspecialistas.contabil}
              </p>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
              <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                Parecer Administrativo, Trabalhista & Fator R:
              </span>
              <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                {parecerEspecialistas.administrativo}
              </p>
            </div>
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50">
              <span className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-600" />
                Parecer Macroeconômico de Mercado:
              </span>
              <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                {parecerEspecialistas.economico}
              </p>
            </div>
          </div>
        </div>

        {/* Fundamentação Legislativa & Índices Macroeconômicos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border border-slate-200 rounded p-2.5 bg-white">
            <h3 className="font-bold text-[11px] text-slate-900 uppercase mb-1.5 flex items-center gap-1">
              <Scale className="w-3 h-3 text-slate-700" />
              Repositório Legislativo (Últimas Revisões)
            </h3>
            {normasRelevantes.length > 0 ? (
              <div className="space-y-1.5">
                {normasRelevantes.slice(0, 3).map((n) => (
                  <div key={n.id} className="text-[10px] border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-800">{n.review_date}</span> ·{' '}
                    {n.reviewer || 'Comitê Técnico'}
                    <p className="text-slate-600 line-clamp-1">
                      {n.observations ||
                        n.highlights ||
                        'Revisão das normas do CGIBS e LC 214/2025.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">
                Histórico legislativo em conformidade.
              </p>
            )}
          </div>

          <div className="border border-slate-200 rounded p-2.5 bg-white">
            <h3 className="font-bold text-[11px] text-slate-900 uppercase mb-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-slate-700" />
              Índices Oficiais de Referência (BCB / IBGE)
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {indicesMacro.indicadores.slice(0, 4).map((ind) => (
                <div key={ind.chave} className="bg-slate-50 p-1.5 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-500 block truncate">{ind.nome}</span>
                  <span className="text-xs font-bold text-slate-900">
                    {ind.valorAtual} {ind.unidade}
                  </span>
                </div>
              ))}
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
            <p className="font-mono text-slate-600">Pág. 1/1 · Autenticidade Garantida</p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default RelatorioAnaliseEmpresarialA4
