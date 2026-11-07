/**
 * PAINEL DE DADOS DE MERCADO (ADECONT)
 *
 * Exibe os principais índices de mercado financeiro e macroeconomia
 * (SELIC, IPCA, Ibovespa, IFIX, Dólar, Juros Pessoal, Inadimplência, Juros Médio)
 * com cotações reais da infraestrutura de séries do backend.
 *
 * Características:
 * - Semáforo inteligente de variação (positivo/verde ou negativo/vermelho dependendo
 *   da semântica econômica do índice — ex: bolsa em alta é verde, inflação/juros em alta é vermelho).
 * - Período de referência visível (Fev/2026, 2025, etc.).
 * - Selo da fonte oficial (BCB, B3, IBGE, IPEA) e aviso transparente quando degradado
 *   para base interna.
 * - Mini-gráfico de tendência SVG responsivo com seleção de período (6 meses / 12 meses / 24 meses / Tudo).
 * - Formatação pt-BR tabular-nums estrita, suporte a tema claro e escuro.
 */

import React, { useState } from 'react'
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  AlertTriangle,
  Building2,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import {
  type ItemIndiceMercado,
  formatarValorIndice,
  filtrarHistoricoPorPeriodo,
} from '@/services/dadosMercadoAnalises'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'

interface PainelDadosMercadoProps {
  indices: ItemIndiceMercado[]
  carregando: boolean
  atualizadoEm?: string
  onRecarregar?: () => void
  resumido?: boolean
}

type PeriodoGrafico = '6m' | '12m' | '24m' | 'todos'

/**
 * Mini-gráfico vetorial SVG sem dependências pesadas, seguro e responsivo.
 */
function MiniGraficoSparkline({
  pontos,
  cor = '#059669',
  altura = 40,
}: {
  pontos: { periodo: string; valor: number }[]
  cor?: string
  altura?: number
}) {
  if (!pontos || pontos.length < 2) {
    return (
      <div
        className="w-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700"
        style={{ height: `${altura}px` }}
      >
        Pontos insuficientes
      </div>
    )
  }

  const valores = pontos.map((p) => p.valor)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  const amplitude = max - min === 0 ? 1 : max - min

  const largura = 180
  const paddingX = 4
  const paddingY = 4
  const alturaUtil = altura - paddingY * 2
  const larguraUtil = largura - paddingX * 2

  const coords = pontos.map((p, idx) => {
    const x = paddingX + (idx / (pontos.length - 1)) * larguraUtil
    const y = paddingY + alturaUtil - ((p.valor - min) / amplitude) * alturaUtil
    return { x, y }
  })

  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${altura - 1} L ${coords[0].x} ${altura - 1} Z`

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      className="w-full overflow-visible"
      style={{ height: `${altura}px` }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${cor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${cor.replace('#', '')})`} />
      <path
        d={pathD}
        fill="none"
        stroke={cor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1].x}
          cy={coords[coords.length - 1].y}
          r="2.5"
          fill={cor}
          className="animate-pulse"
        />
      )}
    </svg>
  )
}

export const PainelDadosMercado: React.FC<PainelDadosMercadoProps> = ({
  indices,
  carregando,
  atualizadoEm,
  onRecarregar,
  resumido = false,
}) => {
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoGrafico>('12m')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')

  const indicesFiltrados = indices.filter((ind) => {
    if (filtroCategoria === 'todos') return true
    return ind.categoria === filtroCategoria
  })

  // Cores do semáforo dependendo da semântica econômica
  const obterCorVariacao = (
    ind: ItemIndiceMercado,
  ): {
    corTexto: string
    corFundo: string
    corGrafico: string
    Icone: typeof ArrowUpRight
  } => {
    const varNum = ind.variacao ?? 0
    if (varNum === 0 || ind.variacao === null) {
      return {
        corTexto: 'text-slate-500 dark:text-slate-400',
        corFundo: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        corGrafico: '#64748b',
        Icone: Minus,
      }
    }

    const subiu = varNum > 0

    // Para bolsa/FII: subiu é verde (bom), desceu é vermelho
    // Para inflação/taxas/inadimplência: subiu é vermelho (ruim), desceu é verde (alívio)
    // Para câmbio (neutro): subiu é âmbar/azul, desceu é âmbar/azul
    let positivo = subiu
    if (ind.interpretacao === 'baixa_boa') {
      positivo = !subiu
    }

    if (ind.interpretacao === 'neutro') {
      return {
        corTexto: subiu ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400',
        corFundo: subiu
          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        corGrafico: '#2563eb',
        Icone: subiu ? ArrowUpRight : ArrowDownRight,
      }
    }

    if (positivo) {
      return {
        corTexto: 'text-emerald-700 dark:text-emerald-300',
        corFundo:
          'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/80',
        corGrafico: '#059669',
        Icone: subiu ? ArrowUpRight : ArrowDownRight,
      }
    }

    return {
      corTexto: 'text-rose-700 dark:text-rose-300',
      corFundo: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/80',
      corGrafico: '#e11d48',
      Icone: subiu ? ArrowUpRight : ArrowDownRight,
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de controle e cabeçalho do painel */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Dados de Mercado & Índices Oficiais</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                Ao Vivo / Proxy Backend
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cotações oficiais integradas ao repositório BCB, B3, IBGE e IPEADATA da ADECONT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Seletor de Período para os Sparklines */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-0.5 text-xs font-semibold">
            <span className="px-2 py-1 text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Janela:
            </span>
            {(['6m', '12m', '24m', 'todos'] as PeriodoGrafico[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodoFiltro(p)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  periodoFiltro === p
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p === 'todos' ? 'Tudo' : p.toUpperCase()}
              </button>
            ))}
          </div>

          {onRecarregar && (
            <button
              onClick={onRecarregar}
              disabled={carregando}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar cotações do backend"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Filtros de Categoria (apenas na visualização completa) */}
      {!resumido && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Segmentos:
          </span>
          {[
            { id: 'todos', rotulo: 'Todos os Índices' },
            { id: 'taxas', rotulo: 'Taxas & Juros' },
            { id: 'inflacao', rotulo: 'Inflação' },
            { id: 'bolsa_fii', rotulo: 'B3: Bolsa & FIIs' },
            { id: 'cambio', rotulo: 'Câmbio' },
            { id: 'credito', rotulo: 'Crédito & Inadimplência' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroCategoria === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat.rotulo}
            </button>
          ))}
        </div>
      )}

      {/* Grid de Cards dos Índices */}
      {carregando && indices.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            Carregando séries históricas oficiais e cotações de mercado...
          </p>
        </div>
      ) : indicesFiltrados.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          Nenhum índice encontrado para este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {indicesFiltrados.map((ind) => {
            const { corTexto, corFundo, corGrafico, Icone } = obterCorVariacao(ind)
            const valorFormatado = formatarValorIndice(
              ind.valorAtual,
              ind.formato,
              ind.casasDecimais,
            )
            const serieRecortada = filtrarHistoricoPorPeriodo(ind.historico, periodoFiltro)

            return (
              <div
                key={ind.chave}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
              >
                {/* Linha 1: Título, Código e Unidade */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono tracking-tight uppercase">
                        {ind.codigoCurto}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {ind.unidade}
                      </span>
                    </div>
                    <h4
                      className="text-xs font-black text-slate-900 dark:text-white mt-1 truncate"
                      title={ind.nome}
                    >
                      {ind.nome}
                    </h4>
                  </div>

                  {/* Tag Fonte Viva ou Base Interna */}
                  {ind.baseInterna ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      title={ind.aviso || 'Exibindo dados da base interna'}
                    >
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Base Interna
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                      Oficial
                    </span>
                  )}
                </div>

                {/* Linha 2: Valor Atual e Semáforo de Variação */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
                    {valorFormatado}
                  </span>

                  {ind.variacao !== null && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-bold font-mono px-1.5 py-0.5 rounded border ${corFundo} ${corTexto}`}
                      title={`Variação absoluta: ${ind.variacao > 0 ? '+' : ''}${ind.variacao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`}
                    >
                      <Icone className="w-3.5 h-3.5" />
                      {ind.variacao > 0 ? '+' : ''}
                      {ind.variacao.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>

                {/* Linha 3: Mini-gráfico de tendência sparkline */}
                <div className="pt-1">
                  <MiniGraficoSparkline pontos={serieRecortada} cor={corGrafico} altura={36} />
                </div>

                {/* Linha 4: Rodapé do card com período e selo da fonte */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10.5px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium truncate">
                    <Calendar className="w-3 h-3 shrink-0" />
                    Ref: {ind.periodoFormatado}
                  </span>
                  <span
                    className="font-bold text-slate-500 dark:text-slate-400 truncate max-w-[120px]"
                    title={ind.fonte}
                  >
                    {ind.fonte}
                  </span>
                </div>

                {/* Aviso transparente quando em base interna */}
                {ind.baseInterna && ind.aviso && (
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20 p-1.5 rounded border border-amber-200/50 dark:border-amber-800/40 leading-snug">
                    {ind.aviso}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Rodapé informativo */}
      {atualizadoEm && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>
            Última sincronização do repositório: <strong>{atualizadoEm}</strong>
          </span>
          <span className="hidden sm:inline">
            Fonte: Banco Central do Brasil (SGS) · B3 S.A. · IBGE SIDRA · IPEADATA
          </span>
        </div>
      )}
    </div>
  )
}
export default PainelDadosMercado
