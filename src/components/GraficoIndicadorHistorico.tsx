/**
 * GRÁFICO EVOLUTIVO — histórico de um indicador do portal de Indicadores
 * Econômicos e Financeiros (aba Histórico).
 *
 * Recharts (já no template): alternância linha/colunas e granularidade
 * escolhida pelo usuário (mensal, trimestral, anual) — as barras se
 * redimensionam conforme a janela de tempo: 12 meses = 12 barras;
 * 5 anos = 5 barras anuais.
 *
 * Toda consulta vai pelo proxy do backend (/backend/v1/series-historicas) —
 * nunca fetch direto do navegador. Fonte viva falhou? base interna com o
 * aviso transparente "Base interna — dado aproximado", nunca erro cru.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  ArrowLeft,
  LineChart as IconeLinha,
  BarChart3,
  RefreshCw,
  CalendarRange,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  fetchSerieHistorica,
  catalogoDaChave,
  type ChaveSerieHistorica,
  type GranularidadeHistorica,
  type PontoSerie,
} from '@/services/seriesHistoricas'
import {
  agruparSerie,
  acumuladosPorAno,
  acumuladoDoPeriodo,
  resumoAcumulados,
  rotuloDoPonto,
  serieComAcumulado,
  filtrarPorPeriodo,
  formatarValorSerie,
} from '@/services/seriesCalculos'

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const COR_LINHA = '#0f294a'
const COR_BARRA = '#b58a2b'
const COR_ACUM = '#b91c1c'

interface PropsGraficoIndicador {
  chave: ChaveSerieHistorica
  onVoltar: () => void
}

interface EstadoSerie {
  serie: PontoSerie[]
  fonteViva: boolean
  baseInterna: boolean
  fonte: string
  aviso: string
  carregando: boolean
}

export function GraficoIndicadorHistorico({ chave, onVoltar }: PropsGraficoIndicador) {
  const item = catalogoDaChave(chave)
  const [estado, setEstado] = useState<EstadoSerie>({
    serie: [],
    fonteViva: true,
    baseInterna: false,
    fonte: '',
    aviso: '',
    carregando: true,
  })
  const [granularidade, setGranularidade] = useState<GranularidadeHistorica>('mensal')
  const [tipoGrafico, setTipoGrafico] = useState<'linha' | 'barras'>('barras')
  const [mostrarAcumulado, setMostrarAcumulado] = useState(true)

  const agora = new Date()
  const [iniAno, setIniAno] = useState(agora.getFullYear() - 2)
  const [iniMes, setIniMes] = useState(1)
  const [fimAno, setFimAno] = useState(agora.getFullYear())
  const [fimMes, setFimMes] = useState(agora.getMonth() + 1)

  useEffect(() => {
    let montado = true
    setEstado((s) => ({ ...s, carregando: true }))
    fetchSerieHistorica(chave).then((res) => {
      if (!montado) return
      setEstado({ ...res, carregando: false })
    })
    return () => {
      montado = false
    }
  }, [chave])

  const serieFiltrada = useMemo(() => {
    if (estado.carregando) return []
    return filtrarPorPeriodo(estado.serie, iniAno, iniMes, fimAno, fimMes)
  }, [estado, iniAno, iniMes, fimAno, fimMes])

  const serieAgrupada = useMemo(
    () => agruparSerie(serieFiltrada, item, granularidade),
    [serieFiltrada, item, granularidade],
  )

  const dadosGrafico = useMemo(
    () =>
      serieAgrupada.map((p) => {
        const r = rotuloDoPonto(p.periodo, granularidade)
        return { periodo: r, valor: p.valor, periodoChave: p.periodo }
      }),
    [serieAgrupada, granularidade],
  )

  const acumuladosAno = useMemo(
    () => (item ? acumuladosPorAno(serieFiltrada, item) : []),
    [serieFiltrada, item],
  )

  const resumo = useMemo(
    () => (item ? resumoAcumulados(estado.serie, serieFiltrada, item) : null),
    [estado.serie, serieFiltrada, item],
  )

  const acumuladoPeriodo = useMemo(
    () => (item ? acumuladoDoPeriodo(serieFiltrada, item) : 0),
    [serieFiltrada, item],
  )

  if (!item) {
    return (
      <div className="p-6 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        Indicador não encontrado no catálogo.{' '}
        <button
          type="button"
          onClick={onVoltar}
          className="font-bold text-panorama-navy underline cursor-pointer"
        >
          Voltar à listagem
        </button>
      </div>
    )
  }

  const ehVariacao = item.modoAcumulado === 'variacao_mensal'
  const rotuloAcumulado = ehVariacao ? 'Acumulado do período' : 'Variação % no período'
  const anosDisponiveis = Array.from(new Set(estado.serie.map((p) => p.periodo.slice(0, 4))))
    .filter((a) => /^\d{4}$/.test(a))
    .sort()

  const eixoX = dadosGrafico.map((d) => d.periodo)
  const alturaRotulo = dadosGrafico.length > 40 ? 0 : dadosGrafico.length > 20 ? -35 : -25

  const comum = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis
        dataKey="periodo"
        tick={{ fontSize: 10 }}
        interval={eixoX.length > 24 ? Math.ceil(eixoX.length / 12) : 0}
        angle={dadosGrafico.length > 14 ? -40 : 0}
        textAnchor={dadosGrafico.length > 14 ? 'end' : 'middle'}
        height={dadosGrafico.length > 14 ? 52 : 28}
      />
      <YAxis
        tick={{ fontSize: 10 }}
        width={56}
        tickFormatter={(v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
        domain={['auto', 'auto']}
      />
      <Tooltip
        formatter={(valor: number | string) => [formatarValorSerie(Number(valor), item), item.nome]}
        labelFormatter={(l) => String(l)}
        contentStyle={{ fontSize: 12, borderRadius: 8 }}
      />
      <Legend wrapperStyle={{ fontSize: 11 }} />
    </>
  )

  const serieAcum = dadosGrafico.map((d) => {
    const pts: PontoSerie[] = serieAgrupada.filter(
      (p) => rotuloDoPonto(p.periodo, granularidade) === d.periodo,
    )
    void pts
    return d
  })
  void serieAcum

  const barraWidthPct = Math.max(
    25,
    Math.min(
      90,
      Math.round(
        (dadosGrafico.length / Math.max(dadosGrafico.length, 1)) * 100 -
          (dadosGrafico.length > 24 ? 40 : 20),
      ),
    ),
  )
  void barraWidthPct
  void mostrarAcumulado
  void alturaRotulo

  return (
    <div className="space-y-4">
      {/* Cabeçalho: voltar, logo ADECONT e selo de confiança da fonte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onVoltar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
          <AdecontLogo variant="color" className="h-7 w-auto shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 leading-snug truncate">
              {item.nome} — histórico evolutivo
            </h3>
            <p className="text-[10.5px] text-slate-500 truncate">{item.descricao}</p>
          </div>
        </div>
        <SeloNivelConfianca tier={item.selo} />
      </div>

      {estado.carregando ? (
        <div className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
      ) : (
        <>
          {/* Aviso transparente da base interna */}
          {(!estado.fonteViva || estado.baseInterna) && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
              <p className="text-xs leading-relaxed">
                <strong>Base interna — dado aproximado.</strong>{' '}
                {estado.aviso || 'Fonte oficial indisponível neste momento.'}
              </p>
            </div>
          )}

          {/* Cartões de acumulado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CartaoAcumulado
              titulo={`Acumulado ${new Date().getFullYear()}`}
              valor={resumo ? resumo.anoCorrente : 0}
              ehVariacao={ehVariacao}
              detalhe="Ano corrente (jan até o último mês disponível)"
            />
            <CartaoAcumulado
              titulo={`Acumulado ${new Date().getFullYear() - 1}`}
              valor={resumo ? resumo.anoAnterior : 0}
              ehVariacao={ehVariacao}
              detalhe="Ano anterior (jan–dez)"
            />
            <CartaoAcumulado
              titulo={rotuloAcumulado}
              valor={acumuladoPeriodo}
              ehVariacao={ehVariacao}
              detalhe={`${resumo?.primeiro.periodo || '—'} a ${resumo?.ultimo.periodo || '—'} · ${resumo?.quantidadePontos || 0} pontos`}
              destaque
            />
          </div>

          {/* Controles: granularidade, tipo de gráfico, período */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide inline-flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5" /> Granularidade
              </span>
              {(['mensal', 'trimestral', 'anual'] as GranularidadeHistorica[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularidade(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    granularidade === g
                      ? 'bg-panorama-navy text-white border-panorama-navy'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
              <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setTipoGrafico(tipoGrafico === 'barras' ? 'linha' : 'barras')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {tipoGrafico === 'barras' ? (
                  <>
                    <IconeLinha className="w-3.5 h-3.5" /> Ver em linha
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-3.5 h-3.5" /> Ver em colunas
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => void fetchSerieHistorica(chave)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                title="Recarregar série da fonte oficial"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recarregar
              </button>
            </div>

            {/* Período: mês/ano inicial e final */}
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide w-full sm:w-auto">
                Período solicitado
              </span>
              <SelectPeriodo
                valorAno={iniAno}
                setAno={setIniAno}
                valorMes={iniMes}
                setMes={setIniMes}
                anos={anosDisponiveis}
                rotulo="De"
              />
              <SelectPeriodo
                valorAno={fimAno}
                setAno={setFimAno}
                valorMes={fimMes}
                setMes={setFimMes}
                anos={anosDisponiveis}
                rotulo="Até"
              />
              <button
                type="button"
                onClick={() => {
                  setIniAno(agora.getFullYear() - 2)
                  setIniMes(1)
                  setFimAno(agora.getFullYear())
                  setFimMes(agora.getMonth() + 1)
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Últimos 2 anos
              </button>
            </div>
          </div>

          {/* Gráfico */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            {dadosGrafico.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-slate-500">
                Sem dados no período selecionado — amplie a janela de tempo.
              </div>
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  {tipoGrafico === 'barras' ? (
                    <BarChart data={dadosGrafico} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                      {comum}
                      <Bar
                        dataKey="valor"
                        name={item.nome}
                        fill={COR_BARRA}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={48}
                      />
                    </BarChart>
                  ) : (
                    <LineChart
                      data={dadosGrafico}
                      margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                    >
                      {comum}
                      <Line
                        type="monotone"
                        dataKey="valor"
                        name={item.nome}
                        stroke={COR_LINHA}
                        strokeWidth={2}
                        dot={dadosGrafico.length <= 24}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-[10.5px] text-slate-400 mt-2">
              {tipoGrafico === 'barras' ? 'Colunas' : 'Linha'} · granularidade {granularidade} ·{' '}
              {dadosGrafico.length} barra{dadosGrafico.length === 1 ? '' : 's'} na janela
              selecionada · fonte:{' '}
              {estado.fonteViva ? estado.fonte || item.fonte : 'base interna aproximada'}
            </p>
          </div>

          {/* Acumulado por ano */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
              {ehVariacao ? 'Acumulado por ano (composto)' : 'Variação por ano'}
            </h4>
            {acumuladosAno.length === 0 ? (
              <p className="text-xs text-slate-500">Sem anos disponíveis na série.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {acumuladosAno.map((a) => (
                  <span
                    key={a.ano}
                    className="inline-flex items-baseline gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <span className="text-xs font-black text-slate-800">{a.ano}</span>
                    <span
                      className={`text-xs font-bold tabular-nums ${a.acumulado > 0 ? 'text-rose-600' : a.acumulado < 0 ? 'text-emerald-600' : 'text-slate-500'}`}
                    >
                      {a.acumulado > 0 ? '+' : ''}
                      {a.acumulado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                    </span>
                  </span>
                ))}
              </div>
            )}
            {ehVariacao && (
              <p className="text-[10.5px] text-slate-400 mt-2">
                Acumulação composta: produto de (1 + v/100) dos meses de cada ano civil.
              </p>
            )}
          </div>

          {/* Série com acumulado progressivo (linha vermelha no mesmo gráfico) */}
          {ehVariacao && mostrarAcumulado && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
                Evolução do acumulado — {item.nome}
              </h4>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <ComposedChart
                    data={dadosGrafico.map((d, i) => ({
                      ...d,
                      acum: serieComAcumulado(serieAgrupada, item)[i]?.acumulado ?? 0,
                    }))}
                    margin={{ top: 8, right: 8, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="periodo"
                      tick={{ fontSize: 10 }}
                      interval={eixoX.length > 24 ? Math.ceil(eixoX.length / 12) : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={56}
                      tickFormatter={(v: number) =>
                        v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'
                      }
                    />
                    <Tooltip
                      formatter={(v: number | string) => [
                        Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%',
                        'Acumulado',
                      ]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="acum"
                      name="Acumulado do período"
                      stroke={COR_ACUM}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CartaoAcumulado({
  titulo,
  valor,
  ehVariacao,
  detalhe,
  destaque,
}: {
  titulo: string
  valor: number
  ehVariacao: boolean
  detalhe: string
  destaque?: boolean
}) {
  const cor = valor > 0 ? 'text-rose-600' : valor < 0 ? 'text-emerald-600' : 'text-slate-600'
  return (
    <div
      className={`p-4 rounded-2xl border bg-white ${destaque ? 'border-panorama-gold' : 'border-slate-200'}`}
    >
      <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">{titulo}</p>
      <p className={`text-xl font-black tabular-nums ${cor} mt-0.5`}>
        {valor > 0 ? '+' : ''}
        {valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
      </p>
      <p className="text-[10.5px] text-slate-400 mt-1">{detalhe}</p>
      {!ehVariacao && (
        <p className="text-[9.5px] text-slate-400 mt-0.5">
          Variação % entre o primeiro e o último ponto
        </p>
      )}
    </div>
  )
}

function SelectPeriodo({
  valorAno,
  setAno,
  valorMes,
  setMes,
  anos,
  rotulo,
}: {
  valorAno: number
  setAno: (v: number) => void
  valorMes: number
  setMes: (v: number) => void
  anos: string[]
  rotulo: string
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs">
      <span className="font-bold text-slate-600">{rotulo}</span>
      <select
        value={valorMes}
        onChange={(e) => setMes(Number(e.target.value))}
        className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white cursor-pointer"
        aria-label={`Mês ${rotulo.toLowerCase()}`}
      >
        {MESES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        value={valorAno}
        onChange={(e) => setAno(Number(e.target.value))}
        className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white cursor-pointer"
        aria-label={`Ano ${rotulo.toLowerCase()}`}
      >
        {(anos.length > 0 ? anos : [String(valorAno)]).map((a) => (
          <option key={a} value={Number(a)}>
            {a}
          </option>
        ))}
      </select>
    </label>
  )
}
