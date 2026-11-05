/**
 * COMPONENTE REUTILIZÁVEL: Painel de Comparação de Índices da Pizza de Setores.
 *
 * Exibe a comparação de múltiplos índices (dentro do mesmo setor e/ou cruzando
 * múltiplos setores), contendo:
 *   - Gráfico de Linhas com evolução temporal das séries normalizadas (base 100
 *     no início do período) para permitir comparação direta de grandezas distintas
 *     (ex.: IPCA % vs Dólar R$ vs Ibovespa pontos), com tooltip rica e legenda.
 *   - Alternador de granularidade (Mensal, Trimestral, Anual).
 *   - Seletor de janela de anos (Início e Fim).
 *   - Tabela comparativa com: Valor Inicial, Valor Final, Variação no Período
 *     Anterior, Variação Anual (12m) e Evolução Total no Período.
 *   - Selo transparente da fonte oficial de cada índice.
 *
 * Utilizado de forma unificada nas abas Histórico e Estatística do portal ADECONT.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingUp, RotateCcw, Sparkles, Calendar, Layers, X, ExternalLink } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  compararIndices,
  anosDisponiveisComparacao,
  formatarValorIndice,
  formatarPercentual,
  seloFonteLinha,
  type LinhaComparacao,
  type GranularidadeComparacao,
} from '@/services/comparacaoSeries'
import { fetchSerieHistorica, type ChaveSerieHistorica } from '@/services/seriesHistoricas'
import { setorDaChave, corDoSetor } from '@/services/distribuicaoSetores'

export interface PropsPainelComparacaoSetores {
  chaves: ChaveSerieHistorica[]
  onRemoverChave?: (chave: ChaveSerieHistorica) => void
  onLimparSelecao?: () => void
  onAbrirHistoricoIndividual?: (chave: ChaveSerieHistorica) => void
}

/** Cores distintas para as linhas do gráfico de comparação */
const CORES_PALETA = [
  '#0f294a', // Navy ADECONT
  '#b58a2b', // Gold ADECONT
  '#0284c7', // Sky
  '#16a34a', // Green
  '#dc2626', // Red
  '#9333ea', // Purple
  '#ea580c', // Orange
  '#0d9488', // Teal
  '#be185d', // Pink
  '#475569', // Slate
]

export function PainelComparacaoSetores({
  chaves,
  onRemoverChave,
  onLimparSelecao,
  onAbrirHistoricoIndividual,
}: PropsPainelComparacaoSetores) {
  const anos = useMemo(() => anosDisponiveisComparacao(), [])
  const anoMaisRecente = anos[anos.length - 1] ?? new Date().getFullYear()

  const [anoInicio, setAnoInicio] = useState<number>(Math.max(2019, anos[0] ?? 2014))
  const [anoFim, setAnoFim] = useState<number>(anoMaisRecente)
  const [gran, setGran] = useState<GranularidadeComparacao>('mensal')

  const [linhas, setLinhas] = useState<LinhaComparacao[]>([])
  const [seriesBrutas, setSeriesBrutas] = useState<
    Record<string, { periodo: string; valor: number }[]>
  >({})
  const [carregando, setCarregando] = useState<boolean>(true)

  useEffect(() => {
    let montado = true
    if (chaves.length < 2) {
      setLinhas([])
      setSeriesBrutas({})
      setCarregando(false)
      return
    }

    setCarregando(true)

    Promise.all([
      compararIndices(chaves, gran, anoInicio, anoFim),
      Promise.all(
        chaves.map(async (c) => {
          try {
            const res = await fetchSerieHistorica(c)
            return { chave: c, serie: res.serie }
          } catch {
            return { chave: c, serie: [] }
          }
        }),
      ),
    ])
      .then(([linhasRes, seriesRes]) => {
        if (!montado) return
        setLinhas(linhasRes)
        const mapa: Record<string, { periodo: string; valor: number }[]> = {}
        for (const item of seriesRes) {
          mapa[item.chave] = item.serie
        }
        setSeriesBrutas(mapa)
        setCarregando(false)
      })
      .catch(() => {
        if (!montado) return
        setCarregando(false)
      })

    return () => {
      montado = false
    }
  }, [chaves, gran, anoInicio, anoFim])

  const dadosGraficoNormalizado = useMemo(() => {
    if (chaves.length < 2) return []

    const periodosSet = new Set<string>()
    for (const c of chaves) {
      const serie = seriesBrutas[c] ?? []
      for (const p of serie) {
        const ano = parseInt(p.periodo.slice(0, 4), 10)
        if (ano >= anoInicio && ano <= anoFim) {
          let chavePer = p.periodo.slice(0, 7)
          if (gran === 'anual') chavePer = p.periodo.slice(0, 4)
          else if (gran === 'trimestral') {
            const m = parseInt(p.periodo.slice(5, 7), 10)
            const t = Math.ceil(m / 3)
            chavePer = `${p.periodo.slice(0, 4)}-T${t}`
          }
          periodosSet.add(chavePer)
        }
      }
    }

    const periodos = Array.from(periodosSet).sort()
    if (periodos.length === 0) return []

    const bases: Record<string, number> = {}
    for (const c of chaves) {
      const linha = linhas.find((l) => l.chave === c)
      if (linha && linha.valorInicial !== undefined && Math.abs(linha.valorInicial) > 0.00001) {
        bases[c] = linha.valorInicial
      }
    }

    return periodos.map((periodo) => {
      const ponto: Record<string, string | number | null> = { periodo }
      for (const c of chaves) {
        const serie = seriesBrutas[c] ?? []
        const item = serie.find((p) => {
          if (gran === 'mensal') return p.periodo.startsWith(periodo)
          if (gran === 'anual') return p.periodo.startsWith(periodo)
          const m = parseInt(p.periodo.slice(5, 7), 10)
          const t = Math.ceil(m / 3)
          return `${p.periodo.slice(0, 4)}-T${t}` === periodo
        })

        if (item && bases[c]) {
          const base = bases[c]
          const norm = (item.valor / base) * 100
          ponto[c] = Number(norm.toFixed(2))
        } else if (item) {
          ponto[c] = item.valor
        } else {
          ponto[c] = null
        }
      }
      return ponto
    })
  }, [chaves, seriesBrutas, linhas, anoInicio, anoFim, gran])

  if (chaves.length < 2) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 text-center">
        <p className="text-xs text-slate-600 font-medium">
          Selecione ao menos <strong>2 índices</strong> para gerar o gráfico e a tabela comparativa.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-panorama-gold/15 text-panorama-gold-dark border border-panorama-gold/30">
              <TrendingUp className="w-3 h-3" />
              Comparação Parametrizada ({chaves.length} índices)
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Evolução e variações percentuais
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Compare o comportamento relativo dos índices selecionados (mesmo setor ou
            multissetorial). O gráfico normaliza em <strong>Base 100</strong> no início do período
            para comparação direta de grandezas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {onLimparSelecao && (
            <button
              type="button"
              onClick={onLimparSelecao}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              title="Limpar todos os índices marcados"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar seleção
            </button>
          )}
          <AdecontLogo variant="color" className="h-7 w-auto" />
        </div>
      </div>

      {/* Chips dos índices selecionados */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
          <Layers className="w-3.5 h-3.5" />
          Índices em comparação:
        </span>
        {chaves.map((c, i) => {
          const l = linhas.find((x) => x.chave === c)
          const nome = l?.nome ?? c
          const cor = CORES_PALETA[i % CORES_PALETA.length]
          const setor = setorDaChave(c)
          return (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs"
              style={{
                backgroundColor: `${cor}12`,
                borderColor: `${cor}40`,
                color: cor,
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
              <span className="truncate max-w-[200px]" title={`${nome} (${setor ?? 'Setor'})`}>
                {nome}
              </span>
              {setor && <span className="text-[10px] opacity-75 font-normal">· {setor}</span>}
              {onAbrirHistoricoIndividual && (
                <button
                  type="button"
                  onClick={() => onAbrirHistoricoIndividual(c)}
                  className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                  title={`Abrir série individual de ${nome}`}
                >
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              {onRemoverChave && (
                <button
                  type="button"
                  onClick={() => onRemoverChave(c)}
                  className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                  title={`Remover ${nome} da comparação`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )
        })}
      </div>

      {/* Controles de Janela e Granularidade */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Janela:
          </span>
          <select
            value={anoInicio}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v <= anoFim) setAnoInicio(v)
            }}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-panorama-gold"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400">até</span>
          <select
            value={anoFim}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (v >= anoInicio) setAnoFim(v)
            }}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-panorama-gold"
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
          {(['mensal', 'trimestral', 'anual'] as GranularidadeComparacao[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGran(g)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                gran === g
                  ? 'bg-panorama-navy text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico de Evolução Comparativa (Base 100) */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-white space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-panorama-gold-dark" />
            Evolução Relativa das Séries (Base 100 = Início da Janela)
          </span>
          <span className="text-[11px] text-slate-500">
            {gran === 'mensal'
              ? 'Pontos mensais'
              : gran === 'trimestral'
                ? 'Trimestrais'
                : 'Anuais'}
          </span>
        </div>

        {carregando ? (
          <div className="h-[280px] rounded-lg bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
            Carregando séries comparativas das fontes oficiais...
          </div>
        ) : dadosGraficoNormalizado.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
            Sem dados na janela selecionada.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dadosGraficoNormalizado}
                margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="periodo"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-white text-xs max-w-[280px]">
                        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1.5">
                          Período: {label}
                        </p>
                        <div className="space-y-1">
                          {payload.map((p) => {
                            const chave = p.dataKey as ChaveSerieHistorica
                            const linha = linhas.find((l) => l.chave === chave)
                            const nome = linha?.nome ?? chave
                            const val = p.value as number | null
                            return (
                              <div
                                key={chave}
                                className="flex items-center justify-between gap-3 text-[11px]"
                              >
                                <span className="flex items-center gap-1.5 truncate text-slate-300">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: p.color }}
                                  />
                                  <span className="truncate">{nome}</span>
                                </span>
                                <span className="font-mono font-bold text-white tabular-nums shrink-0">
                                  {val !== null && val !== undefined
                                    ? `${val.toFixed(1)} pts`
                                    : '—'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800">
                          Base 100 = Início da janela
                        </p>
                      </div>
                    )
                  }}
                />
                <Legend
                  formatter={(val) => {
                    const l = linhas.find((x) => x.chave === val)
                    return (
                      <span className="text-[11px] font-medium text-slate-700">
                        {l?.nome ?? val}
                      </span>
                    )
                  }}
                />
                {chaves.map((c, i) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    name={c}
                    stroke={CORES_PALETA[i % CORES_PALETA.length]}
                    strokeWidth={2}
                    dot={dadosGraficoNormalizado.length <= 16}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela de Variações e Níveis */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Índice</th>
              <th className="py-2.5 px-3">Setor</th>
              <th className="py-2.5 px-3 text-right">Início ({anoInicio})</th>
              <th className="py-2.5 px-3 text-right">Final ({anoFim})</th>
              <th className="py-2.5 px-3 text-right">Período Ant.</th>
              <th className="py-2.5 px-3 text-right">12 Meses</th>
              <th className="py-2.5 px-3 text-right">Evolução Total</th>
              <th className="py-2.5 px-3 text-center">Fonte Oficial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {carregando ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-slate-400 animate-pulse">
                  Calculando variações e estatísticas...
                </td>
              </tr>
            ) : (
              linhas.map((l, i) => {
                const cor = CORES_PALETA[i % CORES_PALETA.length]
                const setor = setorDaChave(l.chave)
                const corSetor = setor ? corDoSetor(setor) : '#0f294a'
                return (
                  <tr key={l.chave} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cor }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {l.nome}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {l.unidade || 'índice'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {setor ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
                          style={{
                            backgroundColor: `${corSetor}12`,
                            color: corSetor,
                          }}
                        >
                          {setor}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatarValorIndice(l.valorInicial, l.unidade)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      {formatarValorIndice(l.valorFinal, l.unidade)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          (l.variacaoPeriodoAnterior ?? 0) > 0
                            ? 'text-emerald-700'
                            : (l.variacaoPeriodoAnterior ?? 0) < 0
                              ? 'text-rose-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {formatarPercentual(l.variacaoPeriodoAnterior)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span
                        className={`font-semibold ${
                          (l.variacaoAnual ?? 0) > 0
                            ? 'text-emerald-700'
                            : (l.variacaoAnual ?? 0) < 0
                              ? 'text-rose-700'
                              : 'text-slate-600'
                        }`}
                      >
                        {formatarPercentual(l.variacaoAnual)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          (l.evolucaoPeriodo ?? 0) > 0
                            ? 'bg-emerald-50 text-emerald-800'
                            : (l.evolucaoPeriodo ?? 0) < 0
                              ? 'bg-rose-50 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {formatarPercentual(l.evolucaoPeriodo)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.fonteViva
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                        title={l.aviso || seloFonteLinha(l)}
                      >
                        {seloFonteLinha(l)}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé explicativo */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10.5px] text-slate-500">
        <p>
          Base 100 normaliza todas as séries no primeiro ponto comum da janela para permitir
          comparação de comportamento relativo de grandezas heterogêneas.
        </p>
        <SeloNivelConfianca tier="oficial_institucional" compacto />
      </div>
    </div>
  )
}
