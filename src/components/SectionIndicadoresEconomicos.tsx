/**
 * PORTAL — Indicadores Econômicos e Financeiros (Plataforma Administrativa)
 *
 * Consome EXCLUSIVAMENTE o serviço `fetchIndicadoresEconomicos` (rota backend
 * /backend/v1/indicadores-economicos, proxy BCB). O navegador nunca fala direto
 * com o Banco Central — padrão anti-bloqueio do projeto (como download-resolution).
 *
 * Regras de resiliência: se a fonte viva falhar, o serviço devolve FALLBACK com
 * `fonteViva: false` e aviso transparente — o portal exibe o aviso, nunca erro
 * cru, nunca crash. Carregando? esqueleto. Sem rede? fallback com faixa âmbar.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  Percent,
  Coins,
  RefreshCw,
  AlertTriangle,
  Landmark,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ArrowLeftRight,
  Check,
  History,
  Search,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import type { ConfidenceTier } from '@/types/panorama'
import { AbaEstatisticas } from '@/components/AbaEstatisticas'
import { AbaHistoricoIndicadores } from '@/components/AbaHistoricoIndicadores'
import {
  buscarIndicadores,
  SUGESTOES_BUSCA_INDICADORES,
  type ResultadoBuscaIndicador,
} from '@/services/buscadorIndicadores'
import { AbaMercadoFinanceiro } from '@/components/AbaMercadoFinanceiro'
import { BotaoCadastroClientes } from '@/components/BotaoCadastroClientes'
import type { ChaveSerieHistorica } from '@/services/seriesHistoricas'
import {
  fetchIndicadoresEconomicos,
  paridadeEntre,
  realNaMoeda,
  type IndicadorEconomico,
  type MoedaCotacao,
  type RespostaIndicadores,
} from '@/services/indicadoresEconomicos'

type AbaId = 'inflacao' | 'taxas' | 'estatisticas' | 'mercado' | 'cambio' | 'historico'

const ABAS: { id: AbaId; label: string; Icon: typeof TrendingUp; descricao: string }[] = [
  {
    id: 'inflacao',
    label: 'Inflação e Correção',
    Icon: TrendingUp,
    descricao: 'IPCA, IGP-M, INPC, IPC e demais índices de inflação e correção monetária',
  },
  {
    id: 'taxas',
    label: 'Taxas',
    Icon: Percent,
    descricao: 'Selic, CDI, TR e rendimento da poupança',
  },
  {
    id: 'estatisticas',
    label: 'Estatísticas',
    Icon: BarChart3,
    descricao:
      'Séries oficiais do IBGE (IPCA, PIB, desemprego), Tesouro Nacional (SICONFI) e IPEA (IGP-M, INPC, salário mínimo)',
  },
  {
    id: 'mercado',
    label: 'Mercado Financeiro',
    Icon: TrendingUp,
    descricao:
      'Ibovespa e IFIX — índices de mercado financeiro da B3, consultados via Banco Central (SGS 7) e IPEADATA',
  },
  {
    id: 'cambio',
    label: 'Câmbio',
    Icon: Coins,
    descricao: 'Cotações PTAX do Banco Central, com comparativo entre moedas',
  },
  {
    id: 'historico',
    label: 'Histórico',
    Icon: History,
    descricao:
      'Séries evolutivas com acumulados por ano e por período, granularidade mensal, trimestral ou anual',
  },
]

const MAX_MOEDAS = 4

function formatarData(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

/** Gráfico de evolução simples (sparkline SVG, sem dependência extra). */
function Sparkline({ serie, cor }: { serie: number[]; cor: string }) {
  const pontos = serie.filter((v) => Number.isFinite(v))
  if (pontos.length < 2) return null
  const min = Math.min(...pontos)
  const max = Math.max(...pontos)
  const amplitude = max - min || 1
  const largura = 120
  const altura = 32
  const passo = largura / (pontos.length - 1)
  const coordenadas = pontos
    .map((v, i) => {
      const y = altura - ((v - min) / amplitude) * (altura - 4) - 2
      return `${(i * passo).toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={coordenadas}
        fill="none"
        stroke={cor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CartaoIndicador({ item }: { item: IndicadorEconomico }) {
  const sobe = item.variacao > 0
  const desce = item.variacao < 0
  const corSeta = sobe ? 'text-rose-600' : desce ? 'text-emerald-600' : 'text-slate-400'
  const IconeSeta = sobe ? ArrowUpRight : desce ? ArrowDownRight : Minus
  const corSpark = sobe ? '#e11d48' : desce ? '#059669' : '#0f294a'
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 hover:border-panorama-gold transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-black text-slate-900 truncate">{item.nome}</h4>
          <p className="text-[10.5px] text-slate-500 leading-snug line-clamp-2">{item.descricao}</p>
        </div>
        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0 uppercase">
          {item.unidade}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            {item.valorAtual.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
          </span>
          <span className="text-xs font-semibold text-slate-500 ml-1">{item.unidade}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Referência: {formatarData(item.dataReferencia)}
          </p>
        </div>
        <Sparkline serie={item.serie} cor={corSpark} />
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-2">
        <span className={`inline-flex items-center gap-1 text-xs font-bold ${corSeta}`}>
          <IconeSeta className="w-3.5 h-3.5" />
          {sobe ? '+' : ''}
          {item.variacao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} pp
        </span>
        <span className="text-[10px] text-slate-400">variação vs. período anterior</span>
      </div>
    </div>
  )
}

/** Cabeçalho com logo ADECONT e selo da fonte oficial — padrão de selos do projeto. */
function CabecalhoPortal({
  resposta,
  carregando,
  onAtualizar,
}: {
  resposta: RespostaIndicadores | null
  carregando: boolean
  onAtualizar: () => void
}) {
  return (
    <div className="rounded-2xl border-2 border-panorama-gold bg-gradient-to-br from-panorama-navy to-slate-900 text-white p-5 sm:p-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/95 p-1.5 shadow-sm">
            <AdecontLogo variant="color" className="h-10 w-auto" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black leading-tight">
              Indicadores Econômicos e Financeiros
            </h2>
            <p className="text-xs text-slate-200">
              Séries oficiais do Banco Central do Brasil — SGS e PTAX, via proxy do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BotaoCadastroClientes variante="header" />
          <SeloNivelConfianca
            fonte="Banco Central do Brasil (BCB)"
            tier={'oficial_institucional' as ConfidenceTier}
            className="bg-white/95 rounded-lg p-1"
          />
          <button
            type="button"
            onClick={onAtualizar}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panorama-gold text-panorama-navy text-xs font-black hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>
      {resposta && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-200">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 border border-white/20">
            <Landmark className="w-3 h-3" />
            Última atualização: {formatarData(resposta.atualizadoEm)}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${
              resposta.fonteViva
                ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100'
                : 'bg-amber-500/20 border-amber-300/40 text-amber-100'
            }`}
          >
            {resposta.fonteViva
              ? 'Fonte viva: BCB online'
              : 'Fonte viva indisponível — cache/fallback'}
          </span>
        </div>
      )}
    </div>
  )
}

function AvisoFallback({ aviso }: { aviso: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs leading-relaxed">
        <strong>Aviso transparente:</strong>{' '}
        {aviso || 'Dados de fallback — base interna aproximada do sistema, não oficial.'}
      </p>
    </div>
  )
}

function AbaCambio({ resposta }: { resposta: RespostaIndicadores }) {
  const disponiveis = resposta.moedasDisponiveis.length
    ? resposta.moedasDisponiveis
    : resposta.moedas.map((m) => ({ codigo: m.codigo, nome: m.nome }))
  const mapa = useMemo(() => new Map(resposta.moedas.map((m) => [m.codigo, m])), [resposta.moedas])

  const [selecionadas, setSelecionadas] = useState<string[]>(() => {
    const iniciais = ['USD', 'EUR', 'GBP', 'JPY'].filter((c) =>
      (resposta.moedasDisponiveis.length ? resposta.moedasDisponiveis : resposta.moedas).some(
        (m) => m.codigo === c,
      ),
    )
    const base = iniciais.length
      ? iniciais
      : disponiveis.slice(0, Math.min(4, disponiveis.length)).map((m) => m.codigo)
    return base.slice(0, MAX_MOEDAS)
  })

  const alternar = (codigo: string) => {
    setSelecionadas((prev) => {
      if (prev.includes(codigo)) return prev.filter((c) => c !== codigo)
      if (prev.length >= MAX_MOEDAS) return prev // teto de 4 moedas simultâneas
      return [...prev, codigo]
    })
  }

  const moedasAtivas = selecionadas
    .map((c) => mapa.get(c))
    .filter((m): m is MoedaCotacao => Boolean(m))

  return (
    <div className="space-y-4">
      {/* Seletor de até 4 moedas simultâneas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-panorama-gold-dark" />
            Moedas (até {MAX_MOEDAS} simultâneas)
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            {selecionadas.length}/{MAX_MOEDAS} selecionadas
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {disponiveis.map((m) => {
            const ativa = selecionadas.includes(m.codigo)
            const cheia = !ativa && selecionadas.length >= MAX_MOEDAS
            return (
              <button
                key={m.codigo}
                type="button"
                onClick={() => alternar(m.codigo)}
                disabled={cheia}
                title={cheia ? `Limite de ${MAX_MOEDAS} moedas simultâneas` : m.nome}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  ativa
                    ? 'bg-panorama-navy text-panorama-gold border-panorama-navy shadow-xs'
                    : cheia
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-panorama-gold hover:bg-amber-50'
                }`}
              >
                {ativa && <Check className="w-3 h-3" />}
                {m.codigo}
                <span className="hidden sm:inline font-medium opacity-80">· {m.nome}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cartões de cotação PTAX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {moedasAtivas.map((m) => (
          <div
            key={m.codigo}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2 hover:border-panorama-gold transition-colors"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900">{m.codigo}</h4>
              <span className="text-[10px] text-slate-400">{formatarData(m.dataCotacao)}</span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{m.nome}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-panorama-navy tabular-nums">
                R${' '}
                {m.cotacaoCompra.toLocaleString('pt-BR', {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </span>
              <span className="text-[10px] text-slate-500">compra</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Venda: R${' '}
              {m.cotacaoVenda.toLocaleString('pt-BR', {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
              })}
            </div>
            <div className="text-[10.5px] text-slate-500 border-t border-slate-100 pt-1.5">
              R$ 1,00 = {realNaMoeda(m).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}{' '}
              {m.codigo}
            </div>
          </div>
        ))}
        {moedasAtivas.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-4 p-6 rounded-xl border-2 border-dashed border-slate-300 text-center text-sm text-slate-500">
            Selecione ao menos uma moeda para ver as cotações PTAX.
          </div>
        )}
      </div>

      {/* Comparativo ENTRE as moedas e em relação ao real */}
      {moedasAtivas.length >= 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4 text-panorama-gold-dark" />
            Comparativo entre as moedas selecionadas (PTAX — compra)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left px-3 py-2 font-bold border-b border-slate-200">
                    Paridade
                  </th>
                  <th className="text-center px-3 py-2 font-bold border-b border-slate-200">
                    1 unidade equivale a
                  </th>
                  <th className="text-center px-3 py-2 font-bold border-b border-slate-200">
                    Em relação ao real
                  </th>
                </tr>
              </thead>
              <tbody>
                {moedasAtivas.map((a) => (
                  <tr key={a.codigo} className="border-b border-slate-100 hover:bg-amber-50/40">
                    <td className="px-3 py-2 font-bold text-panorama-navy">{a.codigo}</td>
                    <td className="px-3 py-2 text-center space-x-2">
                      {moedasAtivas
                        .filter((b) => b.codigo !== a.codigo)
                        .map((b) => (
                          <span key={b.codigo} className="inline-flex items-center gap-1">
                            <span className="font-semibold tabular-nums">
                              {paridadeEntre(a, b).toLocaleString('pt-BR', {
                                maximumFractionDigits: 4,
                              })}
                            </span>
                            <span className="text-slate-400">{b.codigo}</span>
                            <span className="text-slate-200">|</span>
                          </span>
                        ))}
                      {moedasAtivas.length <= 1 && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="font-semibold tabular-nums">
                        R${' '}
                        {a.cotacaoCompra.toLocaleString('pt-BR', {
                          minimumFractionDigits: 4,
                          maximumFractionDigits: 4,
                        })}
                      </span>
                      <span className="text-slate-400 ml-1">/ {a.codigo}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10.5px] text-slate-400">
            Paridades cruzadas calculadas pelas cotações PTAX de compra (1 A = X B ⇒ B/… via BRL).
            R$ 1,00 ={' '}
            {moedasAtivas
              .map(
                (m) =>
                  `${realNaMoeda(m).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} ${m.codigo}`,
              )
              .join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}

export function SectionIndicadoresEconomicos() {
  const [resposta, setResposta] = useState<RespostaIndicadores | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [aba, setAba] = useState<AbaId>('inflacao')
  const [consulta, setConsulta] = useState('')
  const [historicoSelecionado, setHistoricoSelecionado] = useState<ChaveSerieHistorica | null>(null)

  const resultadosBusca = useMemo(
    () => (consulta.trim() ? buscarIndicadores(consulta).slice(0, 8) : []),
    [consulta],
  )

  /** Clicar num resultado do buscador: muda para a aba Histórico com o indicador aberto. */
  const abrirIndicadorHistorico = useCallback((chave: ChaveSerieHistorica) => {
    setHistoricoSelecionado(chave)
    setAba('historico')
    setConsulta('')
  }, [])

  /** Fatia da pizza "Distribuição por Setor" (aba Estatísticas) → abre o histórico. */
  useEffect(() => {
    const handler = (e: Event) => {
      const chave = (e as CustomEvent<ChaveSerieHistorica>).detail
      if (typeof chave === 'string') abrirIndicadorHistorico(chave)
    }
    window.addEventListener('panorama:abrir-indicador-historico', handler)
    return () => window.removeEventListener('panorama:abrir-indicador-historico', handler)
  }, [abrirIndicadorHistorico])

  const carregar = useCallback(async (forcar = false) => {
    setCarregando(true)
    const res = await fetchIndicadoresEconomicos(forcar)
    setResposta(res)
    setCarregando(false)
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const inflacao = useMemo(
    () => resposta?.indicadores.filter((i) => i.categoria === 'inflacao') ?? [],
    [resposta],
  )
  const taxas = useMemo(
    () => resposta?.indicadores.filter((i) => i.categoria === 'taxa') ?? [],
    [resposta],
  )

  const abaInfo = ABAS.find((a) => a.id === aba)

  return (
    <div className="space-y-4 pb-8" id="indicadores-economicos">
      <CabecalhoPortal
        resposta={resposta}
        carregando={carregando}
        onAtualizar={() => void carregar(true)}
      />

      {/* Buscador nativo de índices — visível no topo do portal, em TODAS as abas */}
      <BuscadorIndicadores
        consulta={consulta}
        setConsulta={setConsulta}
        resultados={resultadosBusca}
        onAbrir={abrirIndicadorHistorico}
      />

      {resposta && !resposta.fonteViva && <AvisoFallback aviso={resposta.aviso} />}

      {/* Abas */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
          {ABAS.map((a) => {
            const IconeAba = a.Icon
            const ativa = aba === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  ativa
                    ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <IconeAba className="w-4 h-4 text-panorama-gold-dark" />
                {a.label}
              </button>
            )
          })}
        </nav>
      </div>

      <p className="text-xs text-slate-500">{abaInfo?.descricao}</p>

      {carregando && !resposta ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : aba === 'cambio' && resposta ? (
        <AbaCambio resposta={resposta} />
      ) : aba === 'estatisticas' ? (
        <AbaEstatisticas />
      ) : aba === 'mercado' ? (
        <AbaMercadoFinanceiro />
      ) : aba === 'historico' ? (
        <AbaHistoricoIndicadores
          selecionado={historicoSelecionado}
          onSelecionar={setHistoricoSelecionado}
          onFechar={() => setHistoricoSelecionado(null)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(aba === 'inflacao' ? inflacao : taxas).map((item) => (
            <CartaoIndicador key={item.chave || item.nome} item={item} />
          ))}
        </div>
      )}

      {!carregando &&
        resposta &&
        inflacao.length === 0 &&
        taxas.length === 0 &&
        aba !== 'cambio' &&
        aba !== 'estatisticas' &&
        aba !== 'mercado' &&
        aba !== 'historico' && (
          <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
            Nenhum indicador disponível no momento. Use o botão “Atualizar” para tentar novamente.
          </div>
        )}

      {/* Rodapé institucional */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <AdecontLogo variant="color" className="h-8 w-auto scale-90 origin-left" />
          <span>
            ADECONT · Assessoria Contábil e Administrativa · Panorama da Reforma Tributária
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Fonte oficial: Banco Central — SGS/PTAX · IBGE — SIDRA · Tesouro Nacional — SICONFI · IPEA
          — IPEADATA · consulta via proxy do backend
        </span>
      </div>
    </div>
  )
}

/** Buscador nativo do portal — no topo, visível em todas as abas. */
function BuscadorIndicadores({
  consulta,
  setConsulta,
  resultados,
  onAbrir,
}: {
  consulta: string
  setConsulta: (v: string) => void
  resultados: ResultadoBuscaIndicador[]
  onAbrir: (chave: ChaveSerieHistorica) => void
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-white">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar índice por nome (ex.: IPCA, Selic, dólar, soja, IDEB)…"
          aria-label="Buscar índice por nome"
          className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-slate-400"
        />
        {consulta.trim() !== '' && (
          <button
            type="button"
            onClick={() => setConsulta('')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
          >
            Limpar
          </button>
        )}
      </div>

      {consulta.trim() !== '' && (
        <div className="mt-2 p-3 rounded-2xl border border-slate-200 bg-white space-y-1">
          {SUGESTOES_BUSCA_INDICADORES.length > 0 && resultados.length === 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide">
                Sugestões:
              </span>
              {SUGESTOES_BUSCA_INDICADORES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setConsulta(s)}
                  className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {resultados.length === 0 ? (
            <p className="text-xs text-slate-500 py-1">
              Nenhum índice encontrado para “{consulta.trim()}”.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {resultados.map((r) => (
                <li key={r.chave}>
                  <button
                    type="button"
                    onClick={() => onAbrir(r.chave)}
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-bold text-slate-900">{r.nome}</p>
                    <p className="text-[10.5px] text-slate-500 line-clamp-1">{r.descricao}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {r.categoria} · fonte: {r.fonte}
                      {r.baseInterna ? ' (base interna aproximada)' : ''}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
