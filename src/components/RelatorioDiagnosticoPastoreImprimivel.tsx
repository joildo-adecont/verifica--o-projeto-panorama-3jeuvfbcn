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

  const {
    empresa,
    balancetes,
    recomendacao,
    linhasComparativo,
    notas,
    simplesHibrido,
    lucroRealPuro,
    tabelaValoresPercentuais,
    linhaDoTempoTransicao,
  } = data

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

        {/* QUADRO DO SIMPLES HÍBRIDO 2027 (LC 214/2025) */}
        {simplesHibrido && (
          <div className="bg-indigo-50/70 border border-indigo-300 rounded p-3 mb-4 text-[10px]">
            <div className="flex justify-between items-center border-b border-indigo-200 pb-1 mb-2">
              <span className="font-black text-indigo-950 uppercase tracking-tight text-[11px]">
                2. Cenário de Transição: Simples Híbrido 2027 (LC 214/2025 · Sublimite R$ 3,6 Mi)
              </span>
              <span className="text-[9px] bg-indigo-200 text-indigo-950 px-2 py-0.5 rounded font-bold">
                Proteção Anti-Desenquadramento
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="border border-indigo-200 bg-white p-2 rounded">
                <span className="text-[9px] text-indigo-700 font-bold block uppercase">
                  Situação Atual (~R$ 2,85 mi)
                </span>
                <span className="font-semibold text-slate-900">
                  Não Acionado (Abaixo Sublimite)
                </span>
                <p className="text-[8px] text-slate-600 mt-0.5">
                  Carga idêntica ao Simples puro (~9,2%).
                </p>
              </div>
              <div className="border border-indigo-200 bg-white p-2 rounded">
                <span className="text-[9px] text-indigo-700 font-bold block uppercase">
                  Tendência Julho (R$ 297k/mês)
                </span>
                <span className="font-semibold text-amber-900">
                  ~{brl(simplesHibrido.receitaJulhoAnualizada)} / ano
                </span>
                <p className="text-[8px] text-slate-600 mt-0.5">
                  Encosta no sublimite de R$ 3.600.000,00 (98,9%).
                </p>
              </div>
              <div className="border border-indigo-200 bg-white p-2 rounded">
                <span className="text-[9px] text-indigo-700 font-bold block uppercase">
                  Cenário no Teto (R$ 4,8 mi)
                </span>
                <span className="font-bold text-emerald-800">
                  {brl(simplesHibrido.cenarioTeto48.cargaTotalAnual)} (~
                  {simplesHibrido.cenarioTeto48.aliquotaEfetivaPct.toFixed(2)}%)
                </span>
                <p className="text-[8px] text-slate-600 mt-0.5">
                  25% paga IBS/CBS regular com crédito pleno (economia de R$ 145k vs Simples puro).
                </p>
              </div>
            </div>
            <p className="text-[9px] text-indigo-900 leading-relaxed">
              <strong>Ponto de Virada:</strong> {simplesHibrido.pontoDeVirada.explicacao}
            </p>
          </div>
        )}

        {/* NOVO BLOCO 3: COMPARATIVO LUCRO REAL COMPLETO (RELATÓRIO IMPRESSO) */}
        {lucroRealPuro && (
          <div className="bg-sky-50/70 border border-sky-300 rounded p-3 mb-4 text-[10px] break-inside-avoid">
            <div className="flex justify-between items-center border-b border-sky-200 pb-1 mb-2">
              <span className="font-black text-sky-950 uppercase tracking-tight text-[11px]">
                3. Comparativo Lucro Real Completo (Regime Autônomo com Números Reais)
              </span>
              <span className="text-[9px] bg-sky-200 text-sky-950 px-2 py-0.5 rounded font-bold">
                Lucro Real Efetivo: ~{lucroRealPuro.margemLucroRealPct.toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2 text-center">
              <div className="border border-sky-200 bg-white p-1.5 rounded">
                <span className="text-[8px] text-slate-500 uppercase block font-semibold">
                  Lucro Real Anual Estimado
                </span>
                <span className="font-bold text-slate-900 text-[10px]">
                  {brl(lucroRealPuro.lucroRealAnualEstimado)}
                </span>
                <p className="text-[7.5px] text-slate-500 mt-0.5">Balancetes Jan-Jul/2026</p>
              </div>
              <div className="border border-sky-200 bg-white p-1.5 rounded">
                <span className="text-[8px] text-slate-500 uppercase block font-semibold">
                  IRPJ (15% + Adic. 10%)
                </span>
                <span className="font-bold text-slate-900 text-[10px]">
                  {brl(lucroRealPuro.irpjTotal)}
                </span>
                <p className="text-[7.5px] text-emerald-700 mt-0.5">
                  Isento adic. 10% (lucro &lt; R$ 240k)
                </p>
              </div>
              <div className="border border-sky-200 bg-white p-1.5 rounded">
                <span className="text-[8px] text-slate-500 uppercase block font-semibold">
                  CSLL (9% sobre Lucro Real)
                </span>
                <span className="font-bold text-slate-900 text-[10px]">
                  {brl(lucroRealPuro.csll9)}
                </span>
                <p className="text-[7.5px] text-slate-500 mt-0.5">
                  IRPJ+CSLL: {brl(lucroRealPuro.irpjCsllConsolidado)}
                </p>
              </div>
              <div className="border border-sky-200 bg-white p-1.5 rounded">
                <span className="text-[8px] text-slate-500 uppercase block font-semibold">
                  Carga Total Estimada
                </span>
                <span className="font-bold text-sky-950 text-[10px]">
                  {brl(lucroRealPuro.cargaTributariaAnualTotal)} (~
                  {lucroRealPuro.aliquotaEfetivaTotalPct.toFixed(2)}%)
                </span>
                <p className="text-[7.5px] text-slate-500 mt-0.5">Consumo + Folha + Diretos</p>
              </div>
            </div>

            <div className="bg-white border border-sky-200 rounded p-2 mb-2 space-y-1 text-[9px] text-slate-700">
              <p>
                <strong>Créditos das Compras & Tributos Indiretos:</strong> Compras anuais estimadas
                em <strong>{brl(lucroRealPuro.comprasInsumosAnual)}</strong> geram créditos
                não-cumulativos de PIS (1,65%) e COFINS (7,60%). As autopeças contam com segregação
                de alíquota zero nas saídas (Lei 10.485/2002) e ICMS retido por Substituição
                Tributária no RS, limitando os desembolsos diretos de consumo.
              </p>
              <p>
                <strong>Obrigações Acessórias e Custo de Conformidade:</strong> Exige transmissão
                obrigatória de <strong>ECD</strong> (livros contábeis digitais),{' '}
                <strong>ECF</strong> (e-LALUR/e-LACS), <strong>EFD-Contribuições</strong> e{' '}
                <strong>SPED Fiscal</strong>, representando custo de conformidade contábil e de
                sistemas de aproximadamente{' '}
                <strong>{brl(lucroRealPuro.custoConformidadeAnualEstimado)}/ano</strong>.
              </p>
            </div>
            <p className="text-[8.5px] text-sky-950 font-medium italic">
              * Parecer ADECONT: {lucroRealPuro.avaliacaoAdiantada}
            </p>
          </div>
        )}

        {/* NOVO BLOCO 4: TABELA CONSOLIDADA DE VALORES EM R$, % E VANTAGENS/DESVANTAGENS */}
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
            4. Tabela de Valores em R$ e Percentuais — Comparativo de 5 Regimes com Vantagens e
            Desvantagens
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-[9px] mb-3">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-300 p-1.5 text-left w-[28%]">
                  Regime Tributário
                </th>
                <th className="border border-slate-300 p-1.5 text-right w-[18%]">
                  Carga Anual (R$)
                </th>
                <th className="border border-slate-300 p-1.5 text-right w-[16%]">
                  Alíquota Efetiva (%)
                </th>
                <th className="border border-slate-300 p-1.5 text-right w-[19%]">
                  Diferença vs Simples (R$)
                </th>
                <th className="border border-slate-300 p-1.5 text-right w-[19%]">
                  Diferença (p.p.)
                </th>
              </tr>
            </thead>
            <tbody>
              {tabelaValoresPercentuais.map((item, idx) => {
                const ehRef = item.ehRegimeReferencia
                const ehEcon = item.diferencaVsSimplesBrl < 0
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 p-1.5 font-bold text-slate-900">
                      {item.nomeRegime}
                      {ehRef && (
                        <span className="ml-1 text-[8px] text-emerald-800 font-semibold bg-emerald-100 px-1 py-0.2 rounded">
                          (Referência)
                        </span>
                      )}
                      {item.melhorRegimeLongoPrazo && (
                        <span className="ml-1 text-[8px] text-amber-900 font-semibold bg-amber-100 px-1 py-0.2 rounded">
                          (Menor Carga 2027+)
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-900">
                      {brl(item.cargaAnualEstimada)}
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono font-bold text-slate-800">
                      {item.aliquotaEfetivaPct.toFixed(2)}%
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono">
                      {ehRef ? (
                        <span className="text-slate-500">R$ 0,00</span>
                      ) : ehEcon ? (
                        <span className="text-emerald-700 font-bold">
                          -{brl(Math.abs(item.diferencaVsSimplesBrl))}
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold">
                          +{brl(item.diferencaVsSimplesBrl)}
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-200 p-1.5 text-right font-mono">
                      {ehRef ? (
                        <span className="text-slate-500">0,00 p.p.</span>
                      ) : ehEcon ? (
                        <span className="text-emerald-700 font-bold">
                          {item.diferencaVsSimplesPontosPct.toFixed(2)} p.p.
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold">
                          +{item.diferencaVsSimplesPontosPct.toFixed(2)} p.p.
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Vantagens e Desvantagens Resumidas */}
          <div className="grid grid-cols-2 gap-2 text-[8.5px]">
            {tabelaValoresPercentuais.map((item, idx) => (
              <div key={idx} className="border border-slate-200 bg-slate-50 p-2 rounded">
                <span className="font-bold text-slate-900 block mb-1 border-b border-slate-200 pb-0.5">
                  {item.rotuloCurto} ({item.aliquotaEfetivaPct.toFixed(2)}% ·{' '}
                  {brl(item.cargaAnualEstimada)})
                </span>
                <div className="space-y-0.5 mb-1 text-emerald-950">
                  <span className="font-bold text-[8px] text-emerald-800 uppercase block">
                    Vantagens:
                  </span>
                  {item.vantagens.slice(0, 2).map((v, vi) => (
                    <p key={vi} className="leading-tight">
                      • {v}
                    </p>
                  ))}
                </div>
                <div className="space-y-0.5 text-rose-950">
                  <span className="font-bold text-[8px] text-rose-800 uppercase block">
                    Desvantagens:
                  </span>
                  {item.desvantagens.slice(0, 2).map((d, di) => (
                    <p key={di} className="leading-tight">
                      • {d}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOVO BLOCO 5: LINHA DO TEMPO DA TRANSIÇÃO TRIBUTÁRIA ATÉ 2033 (LC 214/2025) */}
        <div className="mb-4 break-inside-avoid">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5. Linha do Tempo da Transição Tributária (2026 a 2033) e Recomendações Estratégicas
            </h2>
            <span className="text-[8px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              Recorte Estratégico: 2027–2029 Fase de Decisão
            </span>
          </div>

          {/* Faixa explicativa sobre o recorte da fase de decisão */}
          <div className="bg-amber-50/80 border-l-4 border-l-amber-600 border border-amber-200 rounded p-1.5 mb-2 text-[8px] text-amber-950 leading-tight">
            <strong>Fase de Decisão Estratégica (Triênio 2027–2029):</strong> Intervalo crítico de
            transição contábil da Pastore destacado abaixo em dourado, cobrindo a decisão de regime
            e momento de migração (2027), ajuste operacional ao Regime Regular (2028) e consolidação
            da convivência com revisão global de carga (2029).
          </div>

          <div className="border border-slate-300 rounded overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-[8.5px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-1.5 text-left w-[14%]">Ano / Fase</th>
                  <th className="p-1.5 text-left w-[27%]">Mecânica Legislativa (LC 214/2025)</th>
                  <th className="p-1.5 text-left w-[29%]">Impacto Concreto para a Pastore</th>
                  <th className="p-1.5 text-left w-[30%] bg-amber-900 text-amber-100">
                    Ação ADECONT Recomendada
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {linhaDoTempoTransicao.map((marco, idx) => {
                  const isFaseDecisao = !!marco.faseDecisao
                  return (
                    <tr
                      key={idx}
                      className={
                        isFaseDecisao
                          ? 'bg-amber-50/60 font-medium border-l-4 border-l-amber-600'
                          : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-slate-50'
                      }
                    >
                      <td className="p-1.5 font-bold text-slate-900 align-top">
                        <div className="flex items-center gap-1">
                          <span
                            className={`block font-mono font-black text-[9px] ${
                              isFaseDecisao ? 'text-amber-800' : 'text-slate-900'
                            }`}
                          >
                            {marco.ano}
                          </span>
                          {isFaseDecisao && (
                            <span className="text-[6.5px] uppercase font-bold px-1 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                              Decisão
                            </span>
                          )}
                        </div>
                        <span className="text-[7.5px] text-slate-600 font-normal leading-tight block mt-0.5">
                          {marco.fase}
                        </span>
                        {isFaseDecisao && (
                          <span className="text-[6.5px] font-semibold text-amber-900 block mt-0.5">
                            Fase de Decisão
                          </span>
                        )}
                      </td>
                      <td className="p-1.5 text-slate-700 align-top leading-tight">
                        {marco.mecanicaLegislativa}
                      </td>
                      <td className="p-1.5 text-slate-800 align-top leading-tight font-medium">
                        {marco.impactoPastore}
                      </td>
                      <td
                        className={`p-1.5 align-top leading-tight font-medium ${
                          isFaseDecisao
                            ? 'text-amber-950 bg-amber-100/70 border-l border-amber-300'
                            : 'text-amber-950 bg-amber-50/40'
                        }`}
                      >
                        {isFaseDecisao && (
                          <span className="block font-bold text-[7.5px] text-amber-900 uppercase mb-0.5">
                            {marco.rotuloFaseDecisao || 'Fase de Decisão'}
                          </span>
                        )}
                        {marco.acaoRecomendadaAdecont}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABELA COMPARATIVA DE 4 REGIMES */}
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
            6. Detalhamento dos 4 Regimes por Critério Contábil
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-[9px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-300 p-1.5 text-left w-[20%]">
                  Critério Tributário
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[20%] bg-emerald-900 text-emerald-100 font-bold">
                  Simples Nacional Puro
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[20%] bg-indigo-900 text-indigo-100 font-bold">
                  Simples Híbrido 2027
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[20%] bg-slate-800">
                  Situação Atual: Lucro Presumido
                </th>
                <th className="border border-slate-300 p-1.5 text-left w-[20%] bg-amber-900 text-amber-200 font-bold">
                  Reforma 2027+: Regime Regular
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
                    <p className="text-[8px] text-slate-700 mt-0.5">
                      {linha.simplesNacional.detalhe}
                    </p>
                  </td>
                  <td className="border border-slate-200 p-1.5 align-top bg-indigo-50/40">
                    <p className="font-semibold text-indigo-950">
                      {linha.simplesHibrido2027?.valor || '—'}
                    </p>
                    <p className="text-[8px] text-slate-700 mt-0.5">
                      {linha.simplesHibrido2027?.detalhe}
                    </p>
                  </td>
                  <td className="border border-slate-200 p-1.5 align-top">
                    <p className="font-semibold text-slate-900">{linha.lucroPresumido.valor}</p>
                    <p className="text-[8px] text-slate-600 mt-0.5">
                      {linha.lucroPresumido.detalhe}
                    </p>
                  </td>
                  <td className="border border-slate-200 p-1.5 align-top bg-amber-50/40">
                    <p className="font-bold text-amber-950">{linha.reforma2027.valor}</p>
                    <p className="text-[8px] text-slate-700 mt-0.5">{linha.reforma2027.detalhe}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Parecer Técnico e Recomendação Final */}
        <div className="bg-amber-50/70 border border-amber-300 rounded p-3 mb-4 break-inside-avoid">
          <h3 className="text-xs font-black text-amber-950 uppercase tracking-tight mb-1 flex items-center justify-between">
            <span>7. Parecer Técnico e Recomendação Estratégica Oficial ADECONT</span>
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
