import React, { useEffect, useState, useMemo } from 'react'
import {
  carregarDiagnosticoClientePastore,
  type DiagnosticoClienteData,
  CNPJ_PASTORE_FORMATADO,
} from '@/services/diagnosticoPastore'
import RelatorioDiagnosticoPastoreImprimivel from './RelatorioDiagnosticoPastoreImprimivel'
import {
  Building2,
  TrendingUp,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Printer,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Percent,
  Receipt,
  Layers,
  Info,
  HelpCircle,
  BarChart3,
  ExternalLink,
} from 'lucide-react'

export const DiagnosticoRegimeTributario: React.FC = () => {
  const [data, setData] = useState<DiagnosticoClienteData | null>(null)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarImprimivel, setMostrarImprimivel] = useState<boolean>(false)

  const carregar = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await carregarDiagnosticoClientePastore()
      setData(res)
    } catch (e: any) {
      setErro(e?.message || 'Falha ao carregar dados do diagnóstico.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const brl = (v: number | null | undefined) =>
    Number(v || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    })

  const maxReceitaMes = useMemo(() => {
    if (!data?.balancetes.length) return 1
    return Math.max(...data.balancetes.map((b) => b.receitaLiquida), 1)
  }, [data])

  if (carregando) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-white">Carregando Diagnóstico Tributário...</h3>
        <p className="text-sm text-slate-400 mt-1">
          Buscando cadastro, balancetes mensais e notas fiscais do cliente no sistema...
        </p>
      </div>
    )
  }

  if (erro || !data) {
    return (
      <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-6 text-slate-200">
        <div className="flex items-center gap-3 text-rose-400 mb-2">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold text-lg">Erro ao carregar diagnóstico</h3>
        </div>
        <p className="text-sm text-slate-300 mb-4">{erro || 'Dados não localizados.'}</p>
        <button
          onClick={carregar}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded text-sm font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Tentar Novamente
        </button>
      </div>
    )
  }

  const { empresa, balancetes, recomendacao, linhasComparativo, notas } = data

  return (
    <div className="space-y-6">
      {/* Visualização de Impressão A4 Modal */}
      {mostrarImprimivel && (
        <RelatorioDiagnosticoPastoreImprimivel
          data={data}
          onClose={() => setMostrarImprimivel(false)}
        />
      )}

      {/* Header do Painel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Caso Concreto · Cliente Analisado
              </span>
              <span className="text-xs text-slate-400">
                Dados ao vivo do PocketBase (Jan–Jul/2026)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-500 flex-shrink-0" />
              {empresa?.razao_social || 'AUTO MECANICA IRMAOS PASTORE LTDA'}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-semibold">
                CNPJ {empresa?.numero_documento || CNPJ_PASTORE_FORMATADO}
              </span>
              <span>·</span>
              <span>
                CNAE {empresa?.cnae || '4520-0/01'} (
                {empresa?.ramo_atividade || 'Manutenção Mecânica'})
              </span>
              <span>·</span>
              <span>
                {empresa?.municipio || 'Vacaria'}/{empresa?.uf || 'RS'}
              </span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">
                Cliente desde {empresa?.cliente_desde || '1997'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setMostrarImprimivel(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg shadow-md transition-all text-sm"
              title="Abre o layout de impressão A4 com o selo e padrão ADECONT"
            >
              <Printer className="w-4 h-4" />
              Imprimir Diagnóstico (A4)
            </button>
            <button
              onClick={carregar}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 1. RETRATO ATUAL DO CLIENTE (CARDS + MINI-GRÁFICO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita 7 meses + Projeção Anual */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">
              Receita Líquida (7 meses)
            </span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">{brl(data.receitaTotalAcumulada)}</div>
          <div className="mt-2 text-xs text-amber-400/90 font-medium bg-amber-950/40 border border-amber-800/50 rounded p-1.5 flex justify-between items-center">
            <span>Projeção Anual (12m):</span>
            <span className="font-bold">{brl(data.receitaAnualizada)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Média mensal de {brl(data.receitaMensalMedia)} com curva de crescimento.
          </p>
        </div>

        {/* Ativo Total e Patrimônio Líquido */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Estrutura Patrimonial</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">{brl(data.ativoTotalMaisRecente)}</div>
          <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded p-1.5 flex justify-between items-center">
            <span>Patrimônio Líquido (Jul):</span>
            <span className="font-bold text-white">{brl(data.patrimonioLiquidoFinal)}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Capital Social registrado de {empresa?.capital_social || 'R$ 640.000,00'}.
          </p>
        </div>

        {/* Margem Retida vs Presunção */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Margem Retida no PL</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">
            {data.margemRetidaLiquidaPct.toFixed(2)}%
          </div>
          <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded p-1.5 flex justify-between items-center">
            <span>Alerta Presunção:</span>
            <span className="font-bold">Presume 8% a 32%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Variação de PL de +{brl(data.variacaoPatrimonioLiquido)} no período.
          </p>
        </div>

        {/* Operações Fiscais e NFes */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold uppercase tracking-wider">Fluxo de Documentos</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white">
            {notas.totalNotas} <span className="text-sm font-normal text-slate-400">notas</span>
          </div>
          <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded p-1.5 flex justify-between items-center">
            <span>Saídas (CFOP 5102):</span>
            <span className="font-bold text-amber-300">{notas.saidasQtd} NFes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Entradas: {notas.entradasQtd} NFes (Cobra Rolamentos, baterias, autopeças).
          </p>
        </div>
      </div>

      {/* Mini-Gráfico da Evolução Mensal da Receita (Balancetes Jan-Jul) */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5 shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Evolução da Receita Líquida Mensal nos Balancetes Oficiais (2026)
            </h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
            Total 7 Meses:{' '}
            <strong className="text-amber-400">{brl(data.receitaTotalAcumulada)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6 pb-2 px-2 border-b border-slate-700">
          {balancetes.map((b) => {
            const pct = Math.max(8, Math.round((b.receitaLiquida / maxReceitaMes) * 100))
            return (
              <div key={b.id} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] text-amber-300 font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                  {brl(b.receitaLiquida)}
                </span>
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full max-w-[48px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md group-hover:from-amber-500 group-hover:to-amber-300 transition-all shadow-md relative"
                ></div>
                <span className="text-xs font-semibold text-slate-300 mt-2">{b.mesRotulo}</span>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mt-3 flex-wrap gap-2">
          <span>
            Curva ascendente: Jan/26 (R$ 233k) → Jul/26 (R$ 1,66 mi) — expansão no faturamento de
            autopeças e serviços mecânicos.
          </span>
          <span className="text-amber-400 font-medium">
            Projeção anualizada anual atinge <strong>~{brl(data.receitaAnualizada)}</strong>
          </span>
        </div>
      </div>

      {/* 2. DIAGNÓSTICO TEXTUAL GERADO A PARTIR DOS NÚMEROS */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-amber-500" />
          Diagnóstico Técnico dos Dados da Auto Mecânica Pastore
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              1. Simples Nacional Inviável
            </div>
            <p className="text-slate-300">
              Com receita acumulada de <strong>{brl(data.receitaTotalAcumulada)}</strong> em apenas
              7 meses e faturamento anualizado de <strong>~{brl(data.receitaAnualizada)}</strong>, a
              Pastore supera com folga o sublimite de R$ 3,6 mi e o teto máximo de R$ 4,8 milhões do
              Simples Nacional. O reenquadramento ou manutenção no Simples é legalmente impossível.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              2. Sobretaxação no Lucro Presumido
            </div>
            <p className="text-slate-300">
              Os balancetes oficiais revelam variação patrimonial de{' '}
              <strong>+{brl(data.variacaoPatrimonioLiquido)}</strong> (margem retida líquida de
              apenas <strong>{data.margemRetidaLiquidaPct.toFixed(2)}%</strong>). O Lucro Presumido
              presume lucro fictício de <strong>8%</strong> no comércio de peças e{' '}
              <strong>32%</strong> nos serviços mecânicos, gerando imposto sobre lucro inexistente e
              vedando tomada de crédito de insumos.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              3. Operação Mista & Consumidor Final
            </div>
            <p className="text-slate-300">
              A empresa adquire autopeças de grandes distribuidores nacionais (ex.:{' '}
              <em>Cobra Rolamentos</em>) e vende com mão de obra mecânica e peças (CFOP 5102)
              majoritariamente a clientes Pessoa Física (consumidor final). Na Reforma Tributária
              (2027+), o crédito das compras é 100% compensável, sem perda de margem nas saídas a
              PF.
            </p>
          </div>
        </div>
      </div>

      {/* 3. TABELA COMPARATIVA (NÚCLEO DO PEDIDO) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Tabela Comparativa de Enquadramento: Situação Atual × Alternativa × Reforma 2027+
            </h3>
          </div>
          <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
            Base anualizada calculada: <strong>~{brl(data.receitaAnualizada)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 w-1/4">Critério Comparativo</th>
                <th className="p-3 w-1/4 bg-slate-900/90 border-l border-slate-800">
                  <div className="font-bold text-slate-200">Situação Atual</div>
                  <div className="text-[10px] text-slate-400 font-normal">Lucro Presumido</div>
                </th>
                <th className="p-3 w-1/4 bg-slate-800/60 border-l border-slate-700">
                  <div className="font-bold text-blue-300">Alternativa Atual</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Lucro Real (Imediato)
                  </div>
                </th>
                <th className="p-3 w-1/4 bg-amber-950/40 border-l border-amber-900/60">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Reforma 2027+
                  </div>
                  <div className="text-[10px] text-amber-300/80 font-normal">
                    Regime Regular (IBS/CBS) + Lucro Real
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {linhasComparativo.map((linha, index) => (
                <tr
                  key={index}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    index % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-900/80'
                  }`}
                >
                  <td className="p-3 font-semibold text-slate-200 border-r border-slate-800 bg-slate-950/20">
                    {linha.criterio}
                  </td>
                  <td className="p-3 text-slate-300 border-r border-slate-800">
                    <p className="font-semibold text-white">{linha.lucroPresumido.valor}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {linha.lucroPresumido.detalhe}
                    </p>
                  </td>
                  <td className="p-3 text-slate-300 border-r border-slate-800 bg-slate-800/20">
                    <p className="font-semibold text-blue-200">{linha.lucroReal.valor}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{linha.lucroReal.detalhe}</p>
                  </td>
                  <td className="p-3 text-slate-200 bg-amber-950/20 border-l border-amber-900/30">
                    <p className="font-bold text-amber-300">{linha.reforma2027.valor}</p>
                    <p className="text-[11px] text-slate-300 mt-1">{linha.reforma2027.detalhe}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. RECOMENDAÇÃO FINAL EM DESTAQUE */}
      <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded font-mono">
              Recomendação Oficial ADECONT
            </span>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              {recomendacao.titulo}
            </h3>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-700/80 rounded-lg p-3 text-right flex-shrink-0">
            <span className="text-[11px] text-emerald-300 uppercase font-semibold block">
              Economia Anual Estimada
            </span>
            <span className="text-lg font-black text-emerald-400">~R$ 525.000 / ano</span>
          </div>
        </div>

        <p className="text-sm text-slate-200 leading-relaxed mb-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
          {recomendacao.motivoPrincipal}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          {recomendacao.pontosChave.map((ponto, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded border border-slate-700/60"
            >
              <span className="text-amber-400 font-bold">•</span>
              <span>{ponto}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Estimativa gerencial baseada na <strong>LC 214/2025</strong> e nos dados
              contábeis/fiscais reais do sistema. Não substitui parecer formal de auditoria fiscal.
            </span>
          </div>
          <button
            onClick={() => setMostrarImprimivel(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition-colors text-xs uppercase tracking-wider flex-shrink-0"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório Completo A4
          </button>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticoRegimeTributario
