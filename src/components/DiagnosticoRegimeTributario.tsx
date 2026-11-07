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
  Calendar,
  DollarSign,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
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
            <span className="font-semibold uppercase tracking-wider">Receita Real Acumulada</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">{brl(data.receitaTotalAcumulada)}</div>
          <div className="mt-2 text-xs text-amber-400/90 font-medium bg-amber-950/40 border border-amber-800/50 rounded p-1.5 flex justify-between items-center">
            <span>Projeção Anual (12m):</span>
            <span className="font-bold text-emerald-400">{brl(data.receitaAnualizada)}</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">
            Abaixo do teto do Simples Nacional (R$ 4,8 mi). Média: {brl(data.receitaMensalMedia)}
            /mês.
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
          <div className="text-xl font-black text-white flex items-baseline gap-2">
            <span>{notas.totalNotas}</span>
            <span className="text-xs font-normal text-slate-400">chaves únicas</span>
          </div>
          <div className="mt-2 text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded p-1.5 flex justify-between items-center">
            <span>Saídas (CFOP 5102):</span>
            <span className="font-bold text-amber-300">{notas.saidasQtd} NFes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Entradas: {notas.entradasQtd} NFes (Cobra Rolamentos, baterias, autopeças).
          </p>
          {notas.conciliacaoFontes?.avisoTransparencia && (
            <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-amber-300/90 leading-tight">
              {notas.conciliacaoFontes.avisoTransparencia}
            </div>
          )}
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
            Valores mensais líquidos desdobrados por diferença (de R$ 201k a R$ 297k/mês). Balancete
            de Julho (R$ 1,66 mi) reflete o acumulado real.
          </span>
          <span className="text-emerald-400 font-medium">
            Projeção anualizada de <strong>~{brl(data.receitaAnualizada)}</strong> — DENTRO do teto
            do Simples (R$ 4,8 mi)
          </span>
        </div>
      </div>

      {/* Detalhamento Mensal da Conversão (Cumulativo Gravado vs Líquido Real) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Detalhamento da Conversão de Balancetes Cumulativos (Jan–Jul/2026)
          </h3>
          <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded font-mono">
            Conversão por Diferença (Leitura)
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
          {data.notaMetodologicaCumulativa}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-2.5">Competência</th>
                <th className="p-2.5 text-right">Cumulativo Gravado no Balancete</th>
                <th className="p-2.5 text-right text-emerald-400">Receita Líquida Mensal Real</th>
                <th className="p-2.5 text-right">Patrimônio Líquido</th>
                <th className="p-2.5">Arquivo de Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.detalhamentoConversao.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-800/40'}>
                  <td className="p-2.5 font-bold text-white">{row.mesRotulo}</td>
                  <td className="p-2.5 text-right font-mono text-slate-300">
                    {brl(row.cumulativoGravado)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                    {brl(row.liquidoMensalReal)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-300">
                    {brl(row.patrimonioLiquido)}
                  </td>
                  <td className="p-2.5 text-slate-400 text-[11px] truncate max-w-[180px]">
                    {row.arquivoNome}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950 text-white font-bold border-t-2 border-slate-700">
                <td className="p-2.5">Total / Acumulado Real</td>
                <td className="p-2.5 text-right font-mono text-amber-300">
                  {brl(data.receitaTotalAcumulada)} (Acumulado Julho)
                </td>
                <td className="p-2.5 text-right font-mono text-emerald-400">
                  {brl(data.receitaTotalAcumulada)} (Soma Líquida Real)
                </td>
                <td className="p-2.5 text-right font-mono text-slate-300">
                  {brl(data.patrimonioLiquidoFinal)} (+{brl(data.variacaoPatrimonioLiquido)})
                </td>
                <td className="p-2.5 text-[11px] text-slate-400 font-normal">
                  Sem duplicação indevida
                </td>
              </tr>
            </tfoot>
          </table>
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
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              1. Simples Nacional Plenamente Cabível
            </div>
            <p className="text-slate-300">
              Com receita acumulada real de <strong>{brl(data.receitaTotalAcumulada)}</strong> em 7
              meses e faturamento anualizado de <strong>~{brl(data.receitaAnualizada)}</strong>, a
              Pastore fica confortavelmente abaixo do sublimite de R$ 3,6 mi e do teto de R$ 4,8
              milhões do Simples Nacional. O Simples volta a ser uma opção perfeitamente viável,
              legal e competitiva para o cliente.
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
              <strong>32%</strong> nos serviços mecânicos, gerando custo tributário desnecessário de
              quase R$ 100 mil/ano acima dos outros regimes.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              3. Rota Estratégica 2027+ (IBS/CBS)
            </div>
            <p className="text-slate-300">
              A empresa adquire autopeças de grandes distribuidores nacionais (ex.:{' '}
              <em>Cobra Rolamentos</em>) e vende com mão de obra mecânica e peças (CFOP 5102)
              majoritariamente a clientes Pessoa Física (consumidor final). Na Reforma Tributária
              (2027+), o crédito das compras é 100% compensável no Regime Regular, gerando a menor
              carga líquida.
            </p>
          </div>
        </div>
      </div>

      {/* 2.5 QUADRO EXPLICATIVO: MECÂNICA E PONTO DE VIRADA DO SIMPLES HÍBRIDO (LC 214/2025) */}
      {simplesHibrido && (
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500 text-slate-950 px-2.5 py-0.5 rounded font-mono">
                  Transição LC 214/2025
                </span>
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  Mecânica do Simples Híbrido 2027
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Simples Híbrido: Sublimite de R$ 3,6 Mi e Ponto de Virada
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-lg px-3 py-2 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Status Atual (Projeção ~{brl(data.receitaAnualizada)})
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Abaixo do Sublimite (Não Acionado)
                </span>
              </div>
              <div className="bg-indigo-950/80 border border-indigo-700/60 rounded-lg px-3 py-2 text-right">
                <span className="text-[10px] text-indigo-300 uppercase font-semibold block">
                  Julho Anualizado ({brl(balancetes[balancetes.length - 1]?.receitaLiquida)}/mês)
                </span>
                <span className="text-xs font-black text-amber-300">
                  ~{brl(simplesHibrido.receitaJulhoAnualizada)} (98,9% do Sublimite)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
            {/* Bloco 1: Regra do Sublimite */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-wider text-[11px]">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                1. O que é o Simples Híbrido?
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ao faturar entre <strong>R$ 3.600.000,00</strong> (sublimite) e{' '}
                <strong>R$ 4.800.000,00</strong> (teto), a empresa NÃO é expulsa do Simples. A
                parcela até R$ 3,6 mi recolhe no DAS (sem IBS/CBS) e a parcela excedente recolhe
                IBS/CBS no <strong>regime regular</strong>, com crédito pleno de insumos e
                autopeças.
              </p>
            </div>

            {/* Bloco 2: Cenário a R$ 4,8 mi */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0" />
                2. Cenário no Teto (R$ 4,8 Milhões)
              </div>
              <p className="text-slate-300 leading-relaxed">
                Parcela excedente de <strong>25%</strong> (R$ 1.200.000) paga IBS/CBS regular,
                abatendo{' '}
                <strong>{brl(simplesHibrido.cenarioTeto48.creditosAproveitadosExcedente)}</strong>{' '}
                em créditos de autopeças (Cobra Rolamentos). A carga final no teto é de apenas{' '}
                <strong className="text-emerald-400">
                  {brl(simplesHibrido.cenarioTeto48.cargaTotalAnual)} (~
                  {simplesHibrido.cenarioTeto48.aliquotaEfetivaPct.toFixed(2)}%)
                </strong>
                , economizando mais de R$ 145 mil/ano vs Simples puro.
              </p>
            </div>

            {/* Bloco 3: Ponto de Virada */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                <Scale className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                3. Ponto de Virada Tributário
              </div>
              <p className="text-slate-300 leading-relaxed">
                Abaixo de R$ 3,6 mi: Simples puro e Híbrido empatam em <strong>~9,2%</strong>. Acima
                de R$ 3,6 mi: o Híbrido supera o Simples puro graças ao crédito pleno. Acima de R$
                4,8 mi ou com crescimento acentuado: o <strong>Regime Regular pleno (~8,5%)</strong>{' '}
                passa a ser a melhor rota técnica global.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex-wrap gap-2">
            <span className="text-indigo-300">
              💡 <strong>Diagnóstico Gerencial Pastore:</strong> Faturamento atual (~R$ 2,85 mi)
              está seguro no Simples. Porém, o ritmo de julho (R$ 296,9k) aponta para R$ 3,56
              mi/ano, tornando o Simples Híbrido a salvaguarda legal perfeita para 2027+.
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              Sublimite: R$ 3.600.000,00 | Teto: R$ 4.800.000,00
            </span>
          </div>
        </div>
      )}

      {/* NOVO BLOCO: COMPARATIVO LUCRO REAL COMPLETO (REGIME AUTÔNOMO) */}
      {lucroRealPuro && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border-2 border-sky-600/50 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sky-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <Briefcase className="w-5 h-5 text-sky-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                  Regime Autônomo & Completo
                </span>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  1. Comparativo Lucro Real Completo (Tributação Efetiva sobre Números Reais)
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-300">Lucro Real Estimado:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-700/60">
                {brl(lucroRealPuro.lucroRealAnualEstimado)} (
                {lucroRealPuro.margemLucroRealPct.toFixed(2)}% da receita)
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            No <strong>Lucro Real</strong>, o IRPJ e a CSLL incidem estritamente sobre o resultado
            econômico comprovado da mecânica nos balancetes (margem retida real de ~
            <strong>{lucroRealPuro.margemLucroRealPct.toFixed(2)}%</strong>). Como o lucro anual
            estimado (~{brl(lucroRealPuro.lucroRealAnualEstimado)}) fica{' '}
            <strong>abaixo de R$ 240.000,00/ano</strong> (R$ 20 mil/mês), a Pastore tem{' '}
            <strong>isenção integral do adicional de 10% do IRPJ</strong>.
          </p>

          {/* Cards de Apuração do Lucro Real */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* IRPJ */}
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                IRPJ (15% + Adic. 10%)
              </span>
              <div className="text-sm font-mono font-bold text-white">
                {brl(lucroRealPuro.irpjTotal)}
              </div>
              <p className="text-[10px] text-slate-400">
                15% s/ {brl(lucroRealPuro.lucroRealAnualEstimado)}. Adicional 10% = R$ 0,00 (abaixo
                de R$ 20k/mês).
              </p>
            </div>

            {/* CSLL */}
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                CSLL (9% sobre Lucro Real)
              </span>
              <div className="text-sm font-mono font-bold text-white">
                {brl(lucroRealPuro.csll9)}
              </div>
              <p className="text-[10px] text-slate-400">
                9% direto sobre o lucro fiscal apurado nos balancetes oficiais.
              </p>
            </div>

            {/* IRPJ + CSLL Consolidado */}
            <div className="bg-emerald-950/40 border border-emerald-700/60 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                Tributação Direta (IRPJ + CSLL)
              </span>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {brl(lucroRealPuro.irpjCsllConsolidado)} (~
                {lucroRealPuro.irpjCsllAliquotaEfetivaPct.toFixed(2)}%)
              </div>
              <p className="text-[10px] text-emerald-300/80">
                Alíquota direta extremamente reduzida sobre a receita bruta.
              </p>
            </div>

            {/* Custo de Conformidade */}
            <div className="bg-rose-950/30 border border-rose-800/60 p-3 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-300 block">
                Custo de Conformidade / SPED
              </span>
              <div className="text-sm font-mono font-bold text-rose-300">
                ~{brl(lucroRealPuro.custoConformidadeAnualEstimado)} / ano
              </div>
              <p className="text-[10px] text-rose-300/80">
                ECD, ECF, EFD-Contribuições e auditoria contábil obrigatória.
              </p>
            </div>
          </div>

          {/* Créditos de PIS/COFINS e Tributação Indireta */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-sky-400" />
                Aproveitamento de Créditos das Compras e Tributos Indiretos
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                PIS 1,65% · COFINS 7,60% (Não-Cumulativos)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Compras de Peças/Insumos:</span>
                <span className="font-bold text-white font-mono">
                  {brl(lucroRealPuro.comprasInsumosAnual)} (~95,6% receita)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Créditos gerados nas aquisições de distribuidores (Cobra Rolamentos, etc.).
                </p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  Autopeças Monofásicas & ICMS-ST:
                </span>
                <span className="font-bold text-amber-300 font-mono">
                  Segregação Legal (Lei 10.485)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Alíquota zero de PIS/COFINS na saída varejista e ICMS retido por substituição
                  tributária no RS.
                </p>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  Carga Total Lucro Real Puro:
                </span>
                <span className="font-bold text-sky-300 font-mono">
                  {brl(lucroRealPuro.cargaTributariaAnualTotal)} (~
                  {lucroRealPuro.aliquotaEfetivaTotalPct.toFixed(2)}%)
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Inclui tributos diretos, indiretos e encargos patronais (CPP folha).
                </p>
              </div>
            </div>
          </div>

          {/* Obrigações Acessórias Exigidas no Lucro Real */}
          <div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Obrigações Acessórias e Exigências Legais do Lucro Real:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[10px]">
              {lucroRealPuro.obrigacoesAcessorias.map((ob, idx) => (
                <div key={idx} className="bg-slate-950/50 border border-slate-800 p-2 rounded">
                  <div className="font-bold text-slate-200">{ob.nome}</div>
                  <span className="text-sky-400 font-mono block text-[9px]">
                    {ob.periodicidade}
                  </span>
                  <p className="text-slate-400 mt-1 line-clamp-3 leading-tight">{ob.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Parecer do Lucro Real */}
          <div className="bg-sky-950/30 border border-sky-800/60 rounded-lg p-3 text-xs text-sky-200/90 leading-relaxed">
            <strong>Veredito Técnico ADECONT sobre Lucro Real:</strong>{' '}
            {lucroRealPuro.avaliacaoAdiantada}
          </div>
        </div>
      )}

      {/* NOVO BLOCO: TABELA CONSOLIDADA DE VALORES EM R$ E PERCENTUAIS (5 REGIMES) COM VANTAGENS E DESVANTAGENS */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl space-y-0">
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <h3 className="font-bold text-white text-base">
              2. Tabela de Valores em R$ e Percentuais — Comparativo Consolidado de 5 Regimes
            </h3>
          </div>
          <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700">
            Regime de Referência: <strong className="text-emerald-400">Simples Nacional</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 w-[28%]">Regime Tributário</th>
                <th className="p-3 text-right w-[18%]">Carga Anual Estimada (R$)</th>
                <th className="p-3 text-right w-[16%]">Alíquota Efetiva (%)</th>
                <th className="p-3 text-right w-[19%]">Economia / Custo vs Simples</th>
                <th className="p-3 text-right w-[19%]">Diferença em Pontos (p.p.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tabelaValoresPercentuais.map((item) => {
                const ehReferencia = item.ehRegimeReferencia
                const ehMaisCaro = item.diferencaVsSimplesBrl > 0
                const ehEconomia = item.diferencaVsSimplesBrl < 0

                return (
                  <tr
                    key={item.regimeId}
                    className={`transition-colors ${
                      ehReferencia
                        ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                        : item.melhorRegimeLongoPrazo
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : 'bg-slate-900/60 hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 border-r border-slate-800 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{item.nomeRegime}</span>
                        {ehReferencia && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-normal">
                            Referência
                          </span>
                        )}
                        {item.melhorRegimeLongoPrazo && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-normal">
                            Menor Carga 2027+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white border-r border-slate-800">
                      {brl(item.cargaAnualEstimada)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-200 border-r border-slate-800">
                      {item.aliquotaEfetivaPct.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right font-mono border-r border-slate-800">
                      {ehReferencia ? (
                        <span className="text-slate-400 font-normal">R$ 0,00 (base)</span>
                      ) : ehEconomia ? (
                        <span className="text-emerald-400 font-bold">
                          -{brl(Math.abs(item.diferencaVsSimplesBrl))} (economia)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          +{brl(item.diferencaVsSimplesBrl)} (sobretaxa)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">
                      {ehReferencia ? (
                        <span className="text-slate-400 font-normal">0,00 p.p.</span>
                      ) : ehEconomia ? (
                        <span className="text-emerald-400 font-bold">
                          {item.diferencaVsSimplesPontosPct.toFixed(2)} p.p.
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold">
                          +{item.diferencaVsSimplesPontosPct.toFixed(2)} p.p.
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* VANTAGENS E DESVANTAGENS POR REGIME (CARDS EM GRADE) */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Análise Qualitativa: Vantagens e Desvantagens de Cada Regime
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tabelaValoresPercentuais.map((item) => (
              <div
                key={item.regimeId}
                className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <span className="font-bold text-white text-xs">{item.rotuloCurto}</span>
                    <span className="font-mono text-[11px] text-amber-400 font-bold">
                      {item.aliquotaEfetivaPct.toFixed(2)}%
                    </span>
                  </div>

                  {/* Vantagens */}
                  <div className="space-y-1 mb-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" /> Vantagens:
                    </div>
                    {item.vantagens.map((v, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                        <span className="text-emerald-400 font-bold flex-shrink-0">•</span>
                        <span className="leading-tight">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Desvantagens */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3" /> Desvantagens:
                    </div>
                    {item.desvantagens.map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                        <span className="text-rose-400 font-bold flex-shrink-0">•</span>
                        <span className="leading-tight">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] flex justify-between items-center text-slate-400">
                  <span>Carga Anual:</span>
                  <span className="font-mono font-bold text-slate-200">
                    {brl(item.cargaAnualEstimada)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOVO BLOCO: LINHA DO TEMPO DA TRANSIÇÃO TRIBUTÁRIA ATÉ 2033 (LC 214/2025) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Lei Complementar nº 214/2025
                </span>
                <span className="text-[10px] font-bold uppercase bg-gradient-to-r from-amber-500/30 to-yellow-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-400/50 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Recorte Estratégico: 2027–2029 Fase de Decisão
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                3. Linha do Tempo da Transição Tributária (2026 a 2033) e Impactos para a Pastore
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              Fases Oficiais (IVA Dual)
            </span>
            <span className="text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-600/50 font-semibold text-[11px]">
              Destaque: Triênio 2027–2029
            </span>
          </div>
        </div>

        {/* Banner Explicativo do Recorte 2027-2029 Fase de Decisão */}
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border-l-4 border-l-amber-500 border border-amber-700/40 rounded-lg p-3 text-xs text-amber-100/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-200 text-xs">
                Fase de Decisão Estratégica da Pastore: Triênio 2027, 2028 e 2029
              </p>
              <p className="text-[11px] text-slate-300 leading-snug">
                Os anos de <strong>2027 (momento da migração/decisão de regime)</strong>,{' '}
                <strong>2028 (ajuste ao Regime Regular)</strong> e{' '}
                <strong>2029 (consolidação da convivência e revisão da carga)</strong> constituem a
                janela crítica de decisão contábil e societária.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[10px] uppercase font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded border border-amber-500/40">
            Janela Crítica ADECONT
          </span>
        </div>

        <div className="space-y-3">
          {linhaDoTempoTransicao.map((marco, idx) => {
            const isFaseDecisao = !!marco.faseDecisao
            return (
              <div
                key={idx}
                className={`rounded-lg p-3.5 transition-all space-y-2 text-xs relative ${
                  isFaseDecisao
                    ? 'bg-gradient-to-b from-amber-950/30 via-slate-950 to-slate-950 border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                    : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700 opacity-90'
                }`}
              >
                {/* Faixa / Badge de Fase de Decisão */}
                {isFaseDecisao && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1 border-b border-amber-500/30">
                    <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      Fase de Decisão · Triênio 2027–2029
                    </span>
                    {marco.rotuloFaseDecisao && (
                      <span className="text-[10px] font-medium text-amber-200/90 hidden md:inline">
                        {marco.rotuloFaseDecisao}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-black text-sm px-2.5 py-0.5 rounded border ${
                        isFaseDecisao
                          ? 'text-amber-300 bg-amber-500/20 border-amber-400/60 shadow-sm'
                          : 'text-amber-400 bg-amber-950/50 border-amber-800/50'
                      }`}
                    >
                      {marco.ano}
                    </span>
                    <h4
                      className={`font-bold text-xs ${
                        isFaseDecisao ? 'text-amber-100 font-extrabold' : 'text-white'
                      }`}
                    >
                      {marco.titulo}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        isFaseDecisao
                          ? 'bg-amber-950/80 text-amber-200 border-amber-600/60 font-semibold'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {marco.statusOficial}
                    </span>
                    {marco.creditoComprasValendo ? (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                        Crédito Pleno Ativo
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                        Crédito em Teste
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] pt-1">
                  <div className="space-y-0.5 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Mecânica Legislativa (LC 214/2025):
                    </span>
                    <p className="text-slate-300 leading-relaxed">{marco.mecanicaLegislativa}</p>
                  </div>
                  <div className="space-y-0.5 bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                      O Que Muda para a Pastore:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{marco.impactoPastore}</p>
                  </div>
                  <div
                    className={`space-y-0.5 p-2.5 rounded border ${
                      isFaseDecisao
                        ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/20'
                        : 'bg-amber-950/20 border-amber-800/40'
                    }`}
                  >
                    <span
                      className={`text-[10px] uppercase font-bold block ${
                        isFaseDecisao ? 'text-amber-300' : 'text-amber-400'
                      }`}
                    >
                      Recomendação Estratégica ADECONT{isFaseDecisao ? ' (Fase de Decisão):' : ':'}
                    </span>
                    <p
                      className={`leading-relaxed font-medium ${
                        isFaseDecisao ? 'text-amber-100 font-semibold' : 'text-amber-200/90'
                      }`}
                    >
                      {marco.acaoRecomendadaAdecont}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. TABELA COMPARATIVA (4 REGIMES LADO A LADO: SIMPLES x SIMPLES HÍBRIDO x PRESUMIDO x REGIME REGULAR) */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Tabela Comparativa de 4 Regimes: Simples Nacional × Simples Híbrido 2027 × Lucro
              Presumido × Regime Regular 2027+
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
                <th className="p-3 w-[20%]">Critério Comparativo</th>
                <th className="p-3 w-[20%] bg-emerald-950/40 border-l border-emerald-900/60">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Simples Nacional
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-normal">
                    Puro (Dentro do Teto)
                  </div>
                </th>
                <th className="p-3 w-[20%] bg-indigo-950/50 border-l border-indigo-900/60">
                  <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    Simples Híbrido 2027
                  </div>
                  <div className="text-[10px] text-indigo-300/80 font-normal">
                    LC 214/2025 (Sublimite R$ 3,6 mi)
                  </div>
                </th>
                <th className="p-3 w-[20%] bg-slate-900/90 border-l border-slate-800">
                  <div className="font-bold text-slate-200">Situação Atual</div>
                  <div className="text-[10px] text-slate-400 font-normal">Lucro Presumido</div>
                </th>
                <th className="p-3 w-[20%] bg-amber-950/40 border-l border-amber-900/60">
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
                  <td className="p-3 text-slate-300 border-r border-slate-800 bg-emerald-950/10">
                    <p className="font-semibold text-emerald-200">{linha.simplesNacional.valor}</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {linha.simplesNacional.detalhe}
                    </p>
                  </td>
                  <td className="p-3 text-slate-200 border-r border-slate-800 bg-indigo-950/20">
                    <p className="font-bold text-indigo-300">
                      {linha.simplesHibrido2027?.valor || '—'}
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {linha.simplesHibrido2027?.detalhe}
                    </p>
                  </td>
                  <td className="p-3 text-slate-300 border-r border-slate-800">
                    <p className="font-semibold text-white">{linha.lucroPresumido.valor}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {linha.lucroPresumido.detalhe}
                    </p>
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
            <span className="text-lg font-black text-emerald-400">~R$ 96k a R$ 116k / ano</span>
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
